'use strict';

const TRANSACTION_SCHEMA_VERSION = 1;
const TRANSACTION_MODE = 'shadow-transaction-foundation';
const TransactionType = Object.freeze({
  SELL: 'SELL',
  BANK: 'BANK',
  EXCHANGE: 'EXCHANGE',
  COMPOUND: 'COMPOUND',
  UPGRADE: 'UPGRADE'
});
const TransactionState = Object.freeze({
  PREFLIGHT: 'PREFLIGHT',
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const TERMINAL = new Set([TransactionState.COMMITTED, TransactionState.ABORTED, TransactionState.FAILED_SAFE]);
const EXPECTED_DISPOSITIONS = Object.freeze({
  [TransactionType.SELL]: ['SELL'],
  [TransactionType.BANK]: ['BANK'],
  [TransactionType.EXCHANGE]: ['EXCHANGE'],
  [TransactionType.COMPOUND]: ['RESERVE_COMPOUND'],
  [TransactionType.UPGRADE]: ['RESERVE_UPGRADE', 'RESERVE_PROGRESSION']
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function storageGet(storage, key) {
  if (!storage) return null;
  if (typeof storage.get === 'function') return storage.get(key);
  if (typeof storage.getItem === 'function') return storage.getItem(key);
  return null;
}
function storageSet(storage, key, value) {
  if (!storage) return false;
  if (typeof storage.set === 'function') { storage.set(key, value); return true; }
  if (typeof storage.setItem === 'function') { storage.setItem(key, value); return true; }
  return false;
}

class EconomyTransactionEngine {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3:economy-transactions:v1';
    this.capacity = Math.max(16, Math.min(512, Math.floor(finite(options.capacity, 128))));
    this.leaseMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.leaseMs, 30000)));
    this.failureWindowMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.circuitCooldownMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.transactions = new Map();
    this.reservations = new Map();
    this.failures = new Map();
    this.circuits = new Map();
    this.sequence = 0;
    this.lastSavedAt = null;
    this.stats = {
      planned: 0, rejected: 0, cancelled: 0, expired: 0, reconciled: 0,
      committed: 0, failedSafe: 0, loadErrors: 0, saveErrors: 0, capacityEvictions: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'economy-transaction', event, severity, reason, data });
  }

  _id(type) {
    this.sequence += 1;
    return `tx-${this.now().toString(36)}-${String(type || 'x').toLowerCase()}-${this.sequence.toString(36)}`;
  }

  _pruneFailures(type, now = this.now()) {
    const key = String(type || 'UNKNOWN');
    const rows = (this.failures.get(key) || []).filter((row) => now - row.at <= this.failureWindowMs);
    this.failures.set(key, rows);
    const circuit = this.circuits.get(key);
    if (circuit && circuit.openUntil <= now) this.circuits.delete(key);
    return rows;
  }

  breaker(type) {
    const key = String(type || 'UNKNOWN');
    const now = this.now();
    const failures = this._pruneFailures(key, now);
    const circuit = this.circuits.get(key) || null;
    return {
      family: key,
      open: !!(circuit && circuit.openUntil > now),
      openUntil: circuit ? circuit.openUntil : null,
      reason: circuit ? circuit.reason : null,
      failuresInWindow: failures.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  noteFailure(type, reason = 'TRANSACTION_FAILURE') {
    const key = String(type || 'UNKNOWN');
    const now = this.now();
    const rows = this._pruneFailures(key, now);
    rows.push({ at: now, reason: String(reason || 'TRANSACTION_FAILURE') });
    this.failures.set(key, rows);
    if (rows.length >= this.failureThreshold) {
      this.circuits.set(key, { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'FAILURE_BUDGET_EXHAUSTED') });
      this._event('ECONOMY_CIRCUIT_OPENED', 'warn', reason, { family: key, failures: rows.length, openUntil: now + this.circuitCooldownMs });
    }
    return this.breaker(key);
  }

  noteSuccess(type) {
    const key = String(type || 'UNKNOWN');
    this.failures.delete(key);
    this.circuits.delete(key);
    this._event('ECONOMY_CIRCUIT_RESET', 'info', null, { family: key });
    return this.breaker(key);
  }

  _ledgerEntry(ledger, character, index) {
    if (!ledger || typeof ledger.get !== 'function') return null;
    try { return ledger.get(character, index); } catch (_) { return null; }
  }

  _reject(reason, data = {}) {
    this.stats.rejected += 1;
    this._event('TRANSACTION_PREFLIGHT_REJECTED', 'warn', reason, data);
    return { accepted: false, reason };
  }

  _evictIfNeeded() {
    if (this.transactions.size < this.capacity) return;
    const terminal = [...this.transactions.values()]
      .filter((row) => TERMINAL.has(row.state))
      .sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt));
    const candidate = terminal[0];
    if (!candidate) return;
    this.transactions.delete(candidate.id);
    this.stats.capacityEvictions += 1;
  }

  plan(request = {}, context = {}) {
    const type = String(request.type || '').toUpperCase();
    if (!Object.values(TransactionType).includes(type)) return this._reject('TRANSACTION_TYPE_NOT_ALLOWED', { type });
    if (this.breaker(type).open) return this._reject('TRANSACTION_CIRCUIT_OPEN', { type });
    const character = String(request.character || '').trim();
    const index = Number(request.index);
    const quantity = Math.max(1, Math.floor(finite(request.quantity, 1)));
    if (!character || !Number.isInteger(index) || index < 0) return this._reject('INVALID_ITEM_REFERENCE', { type, character, index });

    const ledgerStatus = context.ledger && typeof context.ledger.status === 'function' ? context.ledger.status() : null;
    if (!ledgerStatus || ledgerStatus.stale === true) return this._reject('LEDGER_UNAVAILABLE_OR_STALE', { type, character, index });
    const entry = this._ledgerEntry(context.ledger, character, index);
    if (!entry) return this._reject('LEDGER_ITEM_NOT_FOUND', { type, character, index });
    if (entry.actionAuthority !== false) return this._reject('LEDGER_AUTHORITY_CONTRACT_INVALID', { type, character, index });
    if (!EXPECTED_DISPOSITIONS[type].includes(entry.disposition)) {
      return this._reject('LEDGER_DISPOSITION_NOT_AUTHORIZED', { type, character, index, disposition: entry.disposition });
    }
    if (quantity > Math.max(1, finite(entry.q, 1))) return this._reject('QUANTITY_EXCEEDS_OBSERVED_STACK', { type, quantity, observed: entry.q });

    const reservationKey = String(entry.key || `${character}:${index}`);
    const existing = this.reservations.get(reservationKey);
    if (existing) return this._reject('ITEM_ALREADY_RESERVED', { type, reservationKey, transactionId: existing });

    this._evictIfNeeded();
    if (this.transactions.size >= this.capacity) return this._reject('TRANSACTION_CAPACITY_EXHAUSTED', { capacity: this.capacity });

    const now = this.now();
    const id = this._id(type);
    const row = {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      id,
      type,
      state: TransactionState.RESERVED,
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      character,
      index,
      quantity,
      reservationKey,
      item: String(entry.name),
      level: Math.max(0, Math.floor(finite(entry.level, 0))),
      disposition: entry.disposition,
      expectedDisposition: EXPECTED_DISPOSITIONS[type].slice(),
      reason: 'PREFLIGHT_OK_RESERVED',
      executionAllowed: false,
      actionAuthority: false,
      restartReconcileRequired: false,
      metadata: request.metadata && typeof request.metadata === 'object' ? clone(request.metadata) : {}
    };
    this.transactions.set(id, row);
    this.reservations.set(reservationKey, id);
    this.stats.planned += 1;
    this._event('TRANSACTION_RESERVED', 'info', null, { transactionId: id, type, item: row.item, character, index, quantity, leaseExpiresAt: row.leaseExpiresAt });
    this.save();
    return { accepted: true, transaction: clone(row) };
  }

  _release(row) {
    if (!row || !row.reservationKey) return;
    if (this.reservations.get(row.reservationKey) === row.id) this.reservations.delete(row.reservationKey);
  }

  cancel(id, reason = 'OPERATOR_CANCELLED') {
    const row = this.transactions.get(String(id));
    if (!row) return { cancelled: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (TERMINAL.has(row.state)) return { cancelled: false, reason: 'TRANSACTION_ALREADY_TERMINAL', transaction: clone(row) };
    row.state = TransactionState.ABORTED;
    row.reason = String(reason || 'OPERATOR_CANCELLED');
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    this._release(row);
    this.stats.cancelled += 1;
    this._event('TRANSACTION_ABORTED', 'warn', row.reason, { transactionId: row.id, type: row.type });
    this.save();
    return { cancelled: true, transaction: clone(row) };
  }

  reconcile(id, context = {}) {
    const row = this.transactions.get(String(id));
    if (!row) return { reconciled: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (row.state !== TransactionState.RECOVERING) return { reconciled: false, reason: 'TRANSACTION_NOT_RECOVERING', transaction: clone(row) };
    const entry = this._ledgerEntry(context.ledger, row.character, row.index);
    const stillMatches = !!entry && entry.name === row.item && Math.max(0, Math.floor(finite(entry.level, 0))) === row.level;
    row.state = TransactionState.ABORTED;
    row.reason = stillMatches ? 'RESTART_RECONCILED_ABORTED_UNEXECUTED' : 'RESTART_RECONCILED_ITEM_CHANGED';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    this._release(row);
    this.stats.reconciled += 1;
    this._event('TRANSACTION_RECONCILED_SAFE', 'warn', row.reason, { transactionId: row.id, type: row.type, itemStillMatches: stillMatches });
    this.save();
    return { reconciled: true, itemStillMatches: stillMatches, transaction: clone(row) };
  }

  markCommitted(id, evidence = {}) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = TransactionState.COMMITTED;
    row.reason = 'VERIFIED_COMMIT';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.evidence = clone(evidence);
    this._release(row);
    this.stats.committed += 1;
    this.noteSuccess(row.type);
    this.save();
    return true;
  }

  markFailedSafe(id, reason = 'FAILED_SAFE') {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = TransactionState.FAILED_SAFE;
    row.reason = String(reason || 'FAILED_SAFE');
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    this._release(row);
    this.stats.failedSafe += 1;
    this.noteFailure(row.type, row.reason);
    this.save();
    return true;
  }

  transition(id, nextState, reason = null) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    if (![TransactionState.EXECUTING, TransactionState.VERIFYING].includes(nextState)) return false;
    row.state = nextState;
    row.reason = reason || nextState;
    row.updatedAt = this.now();
    return true;
  }

  tick() {
    const now = this.now();
    let expired = 0;
    for (const row of this.transactions.values()) {
      if (TERMINAL.has(row.state) || row.state === TransactionState.RECOVERING) continue;
      if (row.leaseExpiresAt != null && now > row.leaseExpiresAt) {
        row.state = TransactionState.ABORTED;
        row.reason = 'TRANSACTION_LEASE_EXPIRED';
        row.updatedAt = now;
        row.leaseExpiresAt = null;
        this._release(row);
        this.stats.expired += 1;
        expired += 1;
        this._event('TRANSACTION_LEASE_EXPIRED', 'warn', 'TRANSACTION_LEASE_EXPIRED', { transactionId: row.id, type: row.type });
      }
    }
    if (expired) this.save();
    for (const type of Object.values(TransactionType)) this._pruneFailures(type, now);
    return { expired };
  }

  list(limit = 100) {
    const rows = [...this.transactions.values()].sort((a, b) => finite(a.createdAt) - finite(b.createdAt));
    const n = Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))));
    return rows.slice(rows.length - n).map(clone);
  }

  get(id) {
    const row = this.transactions.get(String(id));
    return row ? clone(row) : null;
  }

  save() {
    if (!this.storage) return false;
    try {
      const payload = JSON.stringify({
        schemaVersion: TRANSACTION_SCHEMA_VERSION,
        savedAt: this.now(),
        sequence: this.sequence,
        transactions: this.list(this.capacity),
        failures: [...this.failures.entries()],
        circuits: [...this.circuits.entries()]
      });
      const ok = storageSet(this.storage, this.storageKey, payload);
      if (ok) this.lastSavedAt = this.now();
      return ok;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('TRANSACTION_SAVE_FAILED', 'error', 'PERSISTENCE_WRITE_FAILED', { message: String(error && error.message || error) });
      return false;
    }
  }

  load() {
    this.transactions.clear();
    this.reservations.clear();
    if (!this.storage) return false;
    try {
      const raw = storageGet(this.storage, this.storageKey);
      if (!raw) return false;
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!payload || payload.schemaVersion !== TRANSACTION_SCHEMA_VERSION || !Array.isArray(payload.transactions)) throw new Error('UNSUPPORTED_TRANSACTION_SCHEMA');
      this.sequence = Math.max(0, Math.floor(finite(payload.sequence, 0)));
      for (const candidate of payload.transactions.slice(-this.capacity)) {
        if (!candidate || !candidate.id || !Object.values(TransactionType).includes(candidate.type)) continue;
        const row = clone(candidate);
        if (!TERMINAL.has(row.state)) {
          row.state = TransactionState.RECOVERING;
          row.reason = 'RESTART_RECONCILE_REQUIRED';
          row.restartReconcileRequired = true;
          row.leaseExpiresAt = null;
          if (row.reservationKey) this.reservations.set(row.reservationKey, row.id);
        }
        this.transactions.set(row.id, row);
      }
      this.failures = new Map(Array.isArray(payload.failures) ? payload.failures : []);
      this.circuits = new Map(Array.isArray(payload.circuits) ? payload.circuits : []);
      this._event('TRANSACTION_STATE_LOADED', 'info', null, { transactions: this.transactions.size, recovering: [...this.transactions.values()].filter((row) => row.state === TransactionState.RECOVERING).length });
      return true;
    } catch (error) {
      this.transactions.clear();
      this.reservations.clear();
      this.failures.clear();
      this.circuits.clear();
      this.stats.loadErrors += 1;
      this._event('TRANSACTION_LOAD_FAILED', 'error', 'PERSISTENCE_CORRUPT_FAIL_CLOSED', { message: String(error && error.message || error) });
      return false;
    }
  }

  status() {
    const rows = [...this.transactions.values()];
    const states = {};
    for (const state of Object.values(TransactionState)) states[state] = rows.filter((row) => row.state === state).length;
    const circuits = {};
    for (const type of Object.values(TransactionType)) circuits[type] = this.breaker(type);
    return {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      mode: TRANSACTION_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      liveExecutionEnabled: false,
      supportedFamilies: Object.values(TransactionType),
      liveFamilies: [],
      capacity: this.capacity,
      leaseMs: this.leaseMs,
      transactions: rows.length,
      active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== TransactionState.RECOVERING).length,
      recovering: states.RECOVERING || 0,
      reservations: this.reservations.size,
      states,
      circuits,
      lastSavedAt: this.lastSavedAt,
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  EconomyTransactionEngine,
  TRANSACTION_SCHEMA_VERSION,
  TRANSACTION_MODE,
  TransactionType,
  TransactionState,
  EXPECTED_DISPOSITIONS
};
