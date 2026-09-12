'use strict';

const BANK_EXPANSION_TX_SCHEMA_VERSION = 1;
const BANK_EXPANSION_TX_MODE = 'shadow-restart-safe-default-off';
const BankExpansionState = Object.freeze({
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const TERMINAL = new Set([BankExpansionState.COMMITTED, BankExpansionState.ABORTED, BankExpansionState.FAILED_SAFE]);

function finite(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
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

class BankExpansionTransactionEngine {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3:bank-expansion-transactions:v1';
    this.leaseMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.leaseMs, 30000)));
    this.failureWindowMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.circuitCooldownMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.preflightRetryBudget = Math.max(0, Math.min(10, Math.floor(finite(options.preflightRetryBudget, 2))));
    this.retryBackoffMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.retryBackoffMs, 5000)));
    this.transactions = new Map();
    this.activeByPack = new Map();
    this.failures = [];
    this.circuit = null;
    this.sequence = 0;
    this.stats = { planned: 0, deduped: 0, committed: 0, aborted: 0, failedSafe: 0, recovered: 0, expired: 0, loadErrors: 0, saveErrors: 0 };
  }
  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'bank-expansion-transaction', event, severity, reason, data });
  }
  _pruneFailures() {
    const now = this.now();
    this.failures = this.failures.filter((row) => now - row.at <= this.failureWindowMs);
    if (this.circuit && this.circuit.openUntil <= now) this.circuit = null;
  }
  breaker() {
    this._pruneFailures();
    return { open: !!this.circuit, openUntil: this.circuit && this.circuit.openUntil || null, reason: this.circuit && this.circuit.reason || null, failuresInWindow: this.failures.length, threshold: this.failureThreshold, windowMs: this.failureWindowMs, cooldownMs: this.circuitCooldownMs };
  }
  noteFailure(reason) {
    this._pruneFailures();
    const now = this.now();
    this.failures.push({ at: now, reason: String(reason || 'BANK_EXPANSION_FAILURE') });
    if (this.failures.length >= this.failureThreshold) {
      this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'BANK_EXPANSION_FAILURE') };
      this._event('BANK_EXPANSION_CIRCUIT_OPENED', 'warn', this.circuit.reason, { openUntil: this.circuit.openUntil });
    }
    this.save();
    return this.breaker();
  }
  noteSuccess() { this.failures = []; this.circuit = null; this.save(); return this.breaker(); }
  plan(plan = {}, context = {}) {
    if (!plan || plan.action !== 'EXPAND_BANK_PACK') return { accepted: false, reason: 'EXPANSION_PLAN_REQUIRED' };
    if (this.breaker().open) return { accepted: false, reason: 'BANK_EXPANSION_CIRCUIT_OPEN' };
    const pack = String(plan.pack || '').trim();
    const currency = String(plan.currency || '').trim();
    const cost = finite(plan.cost, -1);
    if (!pack || !['gold', 'shells'].includes(currency) || cost < 0) return { accepted: false, reason: 'INVALID_EXPANSION_INTENT' };
    const existingId = this.activeByPack.get(pack);
    if (existingId) {
      this.stats.deduped += 1;
      return { accepted: false, reason: 'BANK_PACK_TRANSACTION_ALREADY_ACTIVE', transaction: this.get(existingId) };
    }
    const observation = context.observation || null;
    const packBefore = observation && Array.isArray(observation.packs) ? observation.packs.find((row) => row.name === pack) : null;
    if (!packBefore || packBefore.unlocked) return { accepted: false, reason: packBefore ? 'BANK_PACK_ALREADY_UNLOCKED' : 'BANK_PACK_NOT_OBSERVED' };
    if ((currency === 'gold' ? packBefore.goldCost : packBefore.shellCost) !== cost) return { accepted: false, reason: 'EXPANSION_COST_STALE' };
    const now = this.now();
    const id = `bank-expand-${now.toString(36)}-${(++this.sequence).toString(36)}`;
    const row = {
      schemaVersion: BANK_EXPANSION_TX_SCHEMA_VERSION,
      id,
      pack,
      map: plan.map == null ? null : String(plan.map),
      currency,
      cost,
      protectedReserve: Math.max(0, finite(plan.protectedReserve, 0)),
      state: BankExpansionState.RESERVED,
      reason: 'EXPANSION_INTENT_PERSISTED',
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      preflightRetriesRemaining: this.preflightRetryBudget,
      nextRetryAt: null,
      rawActionAttempts: 0,
      rawActionAttemptLimit: 1,
      before: { unlocked: false, capacity: Math.max(0, finite(packBefore.capacity, 0)), goldCost: packBefore.goldCost, shellCost: packBefore.shellCost, totals: clone(observation.totals) },
      executionAllowed: false,
      actionAuthority: false,
      restartReconcileRequired: false
    };
    this.transactions.set(id, row);
    this.activeByPack.set(pack, id);
    this.stats.planned += 1;
    this.save();
    this._event('BANK_EXPANSION_RESERVED', 'info', null, { transactionId: id, pack, currency, cost, leaseExpiresAt: row.leaseExpiresAt });
    return { accepted: true, transaction: clone(row) };
  }
  begin(id) {
    const row = this.transactions.get(String(id));
    if (!row) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (row.state !== BankExpansionState.RESERVED) return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (row.leaseExpiresAt != null && this.now() > row.leaseExpiresAt) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (row.rawActionAttempts >= row.rawActionAttemptLimit) return { ok: false, reason: 'RAW_ACTION_ATTEMPT_BUDGET_EXHAUSTED' };
    row.state = BankExpansionState.EXECUTING;
    row.reason = 'RAW_ACTION_STARTED';
    row.updatedAt = this.now();
    row.rawActionAttempts += 1;
    this.save();
    return { ok: true, transaction: clone(row) };
  }
  verifying(id) {
    const row = this.transactions.get(String(id));
    if (!row || row.state !== BankExpansionState.EXECUTING) return false;
    row.state = BankExpansionState.VERIFYING;
    row.reason = 'RAW_ACTION_RESULT_RECEIVED';
    row.updatedAt = this.now();
    this.save();
    return true;
  }
  preflightRetry(id, reason) {
    const row = this.transactions.get(String(id));
    if (!row || row.state !== BankExpansionState.RESERVED) return false;
    if (row.preflightRetriesRemaining <= 0) return false;
    row.preflightRetriesRemaining -= 1;
    row.nextRetryAt = this.now() + this.retryBackoffMs;
    row.reason = String(reason || 'PREFLIGHT_RETRY_BACKOFF');
    row.updatedAt = this.now();
    this.save();
    return true;
  }
  commit(id, evidence = {}) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = BankExpansionState.COMMITTED;
    row.reason = 'UNLOCK_VERIFIED_COMMIT';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.evidence = clone(evidence);
    this.activeByPack.delete(row.pack);
    this.stats.committed += 1;
    this.noteSuccess();
    this.save();
    return true;
  }
  abort(id, reason = 'ABORTED') {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = BankExpansionState.ABORTED;
    row.reason = String(reason);
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    this.activeByPack.delete(row.pack);
    this.stats.aborted += 1;
    this.save();
    return true;
  }
  failSafe(id, reason = 'FAILED_SAFE', evidence = {}) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = BankExpansionState.FAILED_SAFE;
    row.reason = String(reason);
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.evidence = clone(evidence);
    this.activeByPack.delete(row.pack);
    this.stats.failedSafe += 1;
    this.noteFailure(row.reason);
    this.save();
    return true;
  }
  reconcile(id, observation) {
    const row = this.transactions.get(String(id));
    if (!row || row.state !== BankExpansionState.RECOVERING) return { reconciled: false, reason: 'TRANSACTION_NOT_RECOVERING' };
    const pack = observation && Array.isArray(observation.packs) ? observation.packs.find((candidate) => candidate.name === row.pack) : null;
    if (pack && pack.unlocked && pack.capacity > 0) {
      row.state = BankExpansionState.COMMITTED;
      row.reason = 'RESTART_OBSERVED_UNLOCK';
      row.updatedAt = this.now();
      row.leaseExpiresAt = null;
      row.restartReconcileRequired = false;
      row.evidence = { after: clone(pack), reconciliation: true };
      this.activeByPack.delete(row.pack);
      this.stats.committed += 1;
      this.stats.recovered += 1;
      this.noteSuccess();
      this.save();
      return { reconciled: true, committed: true, transaction: clone(row) };
    }
    row.state = BankExpansionState.ABORTED;
    row.reason = 'RESTART_RECONCILED_NO_UNLOCK_RETRY_REQUIRES_NEW_TRANSACTION';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    this.activeByPack.delete(row.pack);
    this.stats.aborted += 1;
    this.stats.recovered += 1;
    this.save();
    return { reconciled: true, committed: false, transaction: clone(row) };
  }
  tick() {
    const now = this.now();
    let expired = 0;
    for (const row of this.transactions.values()) {
      if (TERMINAL.has(row.state) || row.state === BankExpansionState.RECOVERING) continue;
      if (row.leaseExpiresAt != null && now > row.leaseExpiresAt) {
        this.abort(row.id, 'BANK_EXPANSION_LEASE_EXPIRED');
        expired += 1;
        this.stats.expired += 1;
      }
    }
    this._pruneFailures();
    return { expired };
  }
  get(id) { const row = this.transactions.get(String(id)); return row ? clone(row) : null; }
  list(limit = 100) {
    const rows = [...this.transactions.values()].sort((a, b) => a.createdAt - b.createdAt);
    return rows.slice(-Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))))).map(clone);
  }
  save() {
    if (!this.storage) return false;
    try {
      return storageSet(this.storage, this.storageKey, JSON.stringify({ schemaVersion: BANK_EXPANSION_TX_SCHEMA_VERSION, sequence: this.sequence, transactions: this.list(256), failures: clone(this.failures), circuit: clone(this.circuit) }));
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('BANK_EXPANSION_SAVE_FAILED', 'error', 'PERSISTENCE_WRITE_FAILED', { message: String(error && error.message || error) });
      return false;
    }
  }
  load() {
    this.transactions.clear(); this.activeByPack.clear();
    if (!this.storage) return false;
    try {
      const raw = storageGet(this.storage, this.storageKey);
      if (!raw) return false;
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!payload || payload.schemaVersion !== BANK_EXPANSION_TX_SCHEMA_VERSION || !Array.isArray(payload.transactions)) throw new Error('UNSUPPORTED_BANK_EXPANSION_SCHEMA');
      this.sequence = Math.max(0, Math.floor(finite(payload.sequence, 0)));
      this.failures = Array.isArray(payload.failures) ? payload.failures : [];
      this.circuit = payload.circuit || null;
      for (const candidate of payload.transactions) {
        if (!candidate || !candidate.id || !candidate.pack) continue;
        const row = clone(candidate);
        if (!TERMINAL.has(row.state)) {
          row.state = BankExpansionState.RECOVERING;
          row.reason = 'RESTART_RECONCILE_REQUIRED';
          row.restartReconcileRequired = true;
          row.leaseExpiresAt = null;
          this.activeByPack.set(row.pack, row.id);
        }
        this.transactions.set(row.id, row);
      }
      return true;
    } catch (error) {
      this.transactions.clear(); this.activeByPack.clear(); this.failures = []; this.circuit = null;
      this.stats.loadErrors += 1;
      this._event('BANK_EXPANSION_LOAD_FAILED', 'error', 'PERSISTENCE_CORRUPT_FAIL_CLOSED', { message: String(error && error.message || error) });
      return false;
    }
  }
  status() {
    const rows = [...this.transactions.values()];
    return { schemaVersion: BANK_EXPANSION_TX_SCHEMA_VERSION, mode: BANK_EXPANSION_TX_MODE, actionAuthority: false, liveExecutionEnabled: false, leaseMs: this.leaseMs, rawActionAttemptLimit: 1, preflightRetryBudget: this.preflightRetryBudget, retryBackoffMs: this.retryBackoffMs, transactions: rows.length, active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== BankExpansionState.RECOVERING).length, recovering: rows.filter((row) => row.state === BankExpansionState.RECOVERING).length, breaker: this.breaker(), stats: clone(this.stats) };
  }
}

module.exports = { BankExpansionTransactionEngine, BANK_EXPANSION_TX_SCHEMA_VERSION, BANK_EXPANSION_TX_MODE, BankExpansionState };
