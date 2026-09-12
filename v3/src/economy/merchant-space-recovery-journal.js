'use strict';

const MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION = 1;
const MERCHANT_SPACE_RECOVERY_MODE = 'controlled-orchestration-default-off';

const MerchantSpaceRecoveryState = Object.freeze({
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  REOBSERVING: 'REOBSERVING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  BLOCKED: 'BLOCKED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});

const TERMINAL = new Set([
  MerchantSpaceRecoveryState.COMMITTED,
  MerchantSpaceRecoveryState.BLOCKED,
  MerchantSpaceRecoveryState.ABORTED,
  MerchantSpaceRecoveryState.FAILED_SAFE
]);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function storageGet(storage, key) {
  if (!storage) return null;
  if (typeof storage.get === 'function') return storage.get(key);
  if (typeof storage.getItem === 'function') return storage.getItem(key);
  return null;
}
function storageSet(storage, key, value) {
  if (!storage) return false;
  if (typeof storage.set === 'function') return storage.set(key, value) !== false;
  if (typeof storage.setItem === 'function') { storage.setItem(key, value); return true; }
  return false;
}

class MerchantSpaceRecoveryJournal {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = String(options.storageKey || 'aio-v3-alpha19-space-recovery');
    this.capacity = Math.max(16, Math.min(1024, Math.floor(finite(options.capacity, 256))));
    this.leaseMs = Math.max(5000, Math.min(10 * 60 * 1000, finite(options.leaseMs, 60000)));
    this.failureWindowMs = Math.max(10000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.circuitCooldownMs = Math.max(10000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.operations = new Map();
    this.reservations = new Map();
    this.sequence = 0;
    this.failures = [];
    this.circuit = null;
    this.lastSavedAt = null;
    this.stats = {
      planned: 0,
      rejected: 0,
      committed: 0,
      blocked: 0,
      aborted: 0,
      failedSafe: 0,
      expired: 0,
      reconciled: 0,
      capacityEvictions: 0,
      saveErrors: 0,
      loadErrors: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'merchant-space-recovery', event, severity, reason, data });
    }
  }

  _id() {
    this.sequence += 1;
    return `space-${this.now().toString(36)}-${this.sequence.toString(36)}`;
  }

  _reservationKey(request = {}) {
    const character = String(request.character || '').trim();
    const index = Number(request.index);
    if (character && Number.isInteger(index) && index >= 0) return `${character}:${index}`;
    const item = String(request.item || request.name || '').trim();
    return `${character || 'unknown'}:capacity:${item || 'generic'}`;
  }

  _pruneFailures(now = this.now()) {
    this.failures = this.failures.filter((row) => now - finite(row.at) <= this.failureWindowMs);
    if (this.circuit && finite(this.circuit.openUntil) <= now) this.circuit = null;
    return this.failures;
  }

  breaker() {
    const now = this.now();
    this._pruneFailures(now);
    return {
      open: !!(this.circuit && this.circuit.openUntil > now),
      openUntil: this.circuit ? this.circuit.openUntil : null,
      reason: this.circuit ? this.circuit.reason : null,
      failuresInWindow: this.failures.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  noteFailure(reason = 'SPACE_RECOVERY_FAILURE') {
    const now = this.now();
    this._pruneFailures(now);
    this.failures.push({ at: now, reason: String(reason || 'SPACE_RECOVERY_FAILURE') });
    if (this.failures.length >= this.failureThreshold) {
      this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'FAILURE_BUDGET_EXHAUSTED') };
      this._event('SPACE_RECOVERY_CIRCUIT_OPENED', 'warn', this.circuit.reason, { failures: this.failures.length, openUntil: this.circuit.openUntil });
    }
    this.save();
    return this.breaker();
  }

  noteSuccess() {
    this.failures = [];
    this.circuit = null;
    this.save();
    return this.breaker();
  }

  _release(row) {
    if (row && row.reservationKey && this.reservations.get(row.reservationKey) === row.id) this.reservations.delete(row.reservationKey);
  }

  _evictIfNeeded() {
    if (this.operations.size < this.capacity) return;
    const candidate = [...this.operations.values()]
      .filter((row) => TERMINAL.has(row.state))
      .sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt))[0];
    if (!candidate) return;
    this.operations.delete(candidate.id);
    this.stats.capacityEvictions += 1;
  }

  plan(request = {}, plan = null) {
    if (this.breaker().open) return this._reject('SPACE_RECOVERY_CIRCUIT_OPEN');
    if (!plan || plan.planned !== true || !plan.action) return this._reject('SPACE_RECOVERY_PLAN_REQUIRED');
    const character = String(request.character || '').trim();
    if (!character) return this._reject('SPACE_RECOVERY_CHARACTER_REQUIRED');
    const reservationKey = this._reservationKey(request);
    const existing = this.reservations.get(reservationKey);
    if (existing) return this._reject('SPACE_RECOVERY_ALREADY_ACTIVE', { operationId: existing });
    this._evictIfNeeded();
    if (this.operations.size >= this.capacity) return this._reject('SPACE_RECOVERY_CAPACITY_EXHAUSTED');
    const now = this.now();
    const row = {
      schemaVersion: MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
      id: this._id(),
      state: MerchantSpaceRecoveryState.RESERVED,
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      reservationKey,
      request: clone(request),
      plan: clone(plan),
      reason: 'SPACE_RECOVERY_RESERVED',
      actionAuthority: false,
      directGameplayActionAccess: false,
      rawActionCount: 0,
      emergencyReclaimCount: 0,
      reobservations: 0,
      restartReconcileRequired: false,
      evidence: []
    };
    this.operations.set(row.id, row);
    this.reservations.set(reservationKey, row.id);
    this.stats.planned += 1;
    this._event('SPACE_RECOVERY_RESERVED', 'info', row.reason, { operationId: row.id, action: plan.action, reservationKey });
    this.save();
    return { accepted: true, operation: clone(row) };
  }

  _reject(reason, data = {}) {
    this.stats.rejected += 1;
    this._event('SPACE_RECOVERY_REJECTED', 'warn', reason, data);
    return { accepted: false, reason: String(reason) };
  }

  transition(id, nextState, reason = null) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    if (![MerchantSpaceRecoveryState.EXECUTING, MerchantSpaceRecoveryState.REOBSERVING].includes(nextState)) return false;
    row.state = nextState;
    row.reason = reason || nextState;
    row.updatedAt = this.now();
    this.save();
    return true;
  }

  addEvidence(id, kind, data = {}, rawActions = 0) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    const count = Math.max(0, Math.floor(finite(rawActions, 0)));
    row.rawActionCount += count;
    row.evidence.push({ at: this.now(), kind: String(kind || 'EVIDENCE'), data: clone(data), rawActions: count });
    row.updatedAt = this.now();
    this.save();
    return true;
  }

  noteReobservation(id, observation, plan = null) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.reobservations += 1;
    row.updatedAt = this.now();
    row.evidence.push({ at: this.now(), kind: 'REOBSERVATION', data: { observation: clone(observation), plan: clone(plan) }, rawActions: 0 });
    this.save();
    return true;
  }

  noteEmergencyReclaim(id) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.emergencyReclaimCount += 1;
    row.updatedAt = this.now();
    this.save();
    return true;
  }

  _terminal(id, state, reason, evidence = {}) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = state;
    row.reason = String(reason || state);
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    row.finalEvidence = clone(evidence);
    this._release(row);
    if (state === MerchantSpaceRecoveryState.COMMITTED) {
      this.stats.committed += 1;
      this.noteSuccess();
    } else if (state === MerchantSpaceRecoveryState.BLOCKED) {
      this.stats.blocked += 1;
    } else if (state === MerchantSpaceRecoveryState.ABORTED) {
      this.stats.aborted += 1;
    } else if (state === MerchantSpaceRecoveryState.FAILED_SAFE) {
      this.stats.failedSafe += 1;
      this.noteFailure(row.reason);
    }
    this.save();
    this._event('SPACE_RECOVERY_TERMINAL', state === MerchantSpaceRecoveryState.FAILED_SAFE ? 'error' : state === MerchantSpaceRecoveryState.BLOCKED ? 'warn' : 'info', row.reason, { operationId: row.id, state, rawActionCount: row.rawActionCount, emergencyReclaimCount: row.emergencyReclaimCount });
    return true;
  }

  markCommitted(id, reason = 'SPACE_RECOVERY_VERIFIED_COMMIT', evidence = {}) { return this._terminal(id, MerchantSpaceRecoveryState.COMMITTED, reason, evidence); }
  markBlocked(id, reason = 'SPACE_RECOVERY_BLOCKED', evidence = {}) { return this._terminal(id, MerchantSpaceRecoveryState.BLOCKED, reason, evidence); }
  markFailedSafe(id, reason = 'SPACE_RECOVERY_FAILED_SAFE', evidence = {}) { return this._terminal(id, MerchantSpaceRecoveryState.FAILED_SAFE, reason, evidence); }
  cancel(id, reason = 'SPACE_RECOVERY_CANCELLED') { return this._terminal(id, MerchantSpaceRecoveryState.ABORTED, reason, {}); }

  reconcile(id) {
    const row = this.operations.get(String(id));
    if (!row) return { reconciled: false, reason: 'SPACE_RECOVERY_NOT_FOUND' };
    if (row.state !== MerchantSpaceRecoveryState.RECOVERING) return { reconciled: false, reason: 'SPACE_RECOVERY_NOT_RECOVERING', operation: clone(row) };
    row.state = MerchantSpaceRecoveryState.ABORTED;
    row.reason = 'RESTART_REOBSERVE_AND_REPLAN_REQUIRED_NO_BLIND_RETRY';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    this._release(row);
    this.stats.reconciled += 1;
    this.stats.aborted += 1;
    this.save();
    this._event('SPACE_RECOVERY_RESTART_RECONCILED', 'warn', row.reason, { operationId: row.id, rawActionCount: row.rawActionCount });
    return { reconciled: true, operation: clone(row) };
  }

  tick() {
    const now = this.now();
    let expired = 0;
    for (const row of this.operations.values()) {
      if (TERMINAL.has(row.state) || row.state === MerchantSpaceRecoveryState.RECOVERING) continue;
      if (row.leaseExpiresAt != null && now > finite(row.leaseExpiresAt)) {
        row.state = MerchantSpaceRecoveryState.ABORTED;
        row.reason = 'SPACE_RECOVERY_LEASE_EXPIRED';
        row.updatedAt = now;
        row.leaseExpiresAt = null;
        this._release(row);
        this.stats.expired += 1;
        this.stats.aborted += 1;
        expired += 1;
      }
    }
    this._pruneFailures(now);
    if (expired) this.save();
    return { expired };
  }

  get(id) {
    const row = this.operations.get(String(id));
    return row ? clone(row) : null;
  }

  list(limit = 100) {
    const rows = [...this.operations.values()].sort((a, b) => finite(a.createdAt) - finite(b.createdAt));
    const n = Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))));
    return rows.slice(rows.length - n).map(clone);
  }

  save() {
    if (!this.storage) return false;
    try {
      const payload = JSON.stringify({
        schemaVersion: MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
        savedAt: this.now(),
        sequence: this.sequence,
        operations: this.list(this.capacity),
        failures: clone(this.failures),
        circuit: clone(this.circuit)
      });
      const ok = storageSet(this.storage, this.storageKey, payload);
      if (ok) this.lastSavedAt = this.now();
      return ok;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('SPACE_RECOVERY_SAVE_FAILED', 'error', 'PERSISTENCE_WRITE_FAILED', { message: String(error && error.message || error) });
      return false;
    }
  }

  load() {
    this.operations.clear();
    this.reservations.clear();
    if (!this.storage) return false;
    try {
      const raw = storageGet(this.storage, this.storageKey);
      if (!raw) return false;
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!payload || payload.schemaVersion !== MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION || !Array.isArray(payload.operations)) throw new Error('UNSUPPORTED_SPACE_RECOVERY_SCHEMA');
      this.sequence = Math.max(0, Math.floor(finite(payload.sequence, 0)));
      for (const candidate of payload.operations.slice(-this.capacity)) {
        if (!candidate || !candidate.id) continue;
        const row = clone(candidate);
        if (!TERMINAL.has(row.state)) {
          row.state = MerchantSpaceRecoveryState.RECOVERING;
          row.reason = 'RESTART_RECONCILE_REQUIRED';
          row.restartReconcileRequired = true;
          row.leaseExpiresAt = null;
          if (row.reservationKey) this.reservations.set(row.reservationKey, row.id);
        }
        this.operations.set(row.id, row);
      }
      this.failures = Array.isArray(payload.failures) ? clone(payload.failures) : [];
      this.circuit = payload.circuit ? clone(payload.circuit) : null;
      this._event('SPACE_RECOVERY_STATE_LOADED', 'info', null, { operations: this.operations.size, recovering: [...this.operations.values()].filter((row) => row.state === MerchantSpaceRecoveryState.RECOVERING).length });
      return true;
    } catch (error) {
      this.operations.clear();
      this.reservations.clear();
      this.failures = [];
      this.circuit = null;
      this.stats.loadErrors += 1;
      this._event('SPACE_RECOVERY_LOAD_FAILED', 'error', 'PERSISTENCE_CORRUPT_FAIL_CLOSED', { message: String(error && error.message || error) });
      return false;
    }
  }

  status() {
    const rows = [...this.operations.values()];
    const states = {};
    for (const state of Object.values(MerchantSpaceRecoveryState)) states[state] = rows.filter((row) => row.state === state).length;
    return {
      schemaVersion: MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
      mode: MERCHANT_SPACE_RECOVERY_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      defaultEnabled: false,
      leaseMs: this.leaseMs,
      capacity: this.capacity,
      operations: rows.length,
      active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== MerchantSpaceRecoveryState.RECOVERING).length,
      recovering: states.RECOVERING || 0,
      reservations: this.reservations.size,
      states,
      breaker: this.breaker(),
      lastSavedAt: this.lastSavedAt,
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  MerchantSpaceRecoveryJournal,
  MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
  MERCHANT_SPACE_RECOVERY_MODE,
  MerchantSpaceRecoveryState
};
