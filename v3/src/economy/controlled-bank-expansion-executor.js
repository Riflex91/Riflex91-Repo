'use strict';

const CONTROLLED_BANK_EXPANSION_MODE = 'controlled-canary-default-off';
const CONTROLLED_BANK_EXPANSION_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

class ControlledBankExpansionExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.engine = options.engine;
    this.manager = options.manager;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.timeoutMs = Math.max(1000, Math.min(30000, finite(options.timeoutMs, 10000)));
    this.enabled = false;
    this.busy = false;
    this.lastAction = null;
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, timeouts: 0, staleCostRejected: 0, partialUnlockRejected: 0 };
  }
  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-bank-expansion', event, severity, reason, data });
  }
  configure(config = {}) {
    if (config.enabled === true && config.ack !== CONTROLLED_BANK_EXPANSION_ACK) {
      this.enabled = false;
      this._event('CONTROLLED_BANK_EXPANSION_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = config.enabled === true;
    this._event('CONTROLLED_BANK_EXPANSION_CONFIG_CHANGED', 'warn', this.enabled ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED');
    return this.status();
  }
  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._event('CONTROLLED_BANK_EXPANSION_DISABLED', 'warn', reason);
    return this.status();
  }
  _inCombat() {
    const character = this.root && this.root.character || {};
    if (character.target) return true;
    const entities = this.root && this.root.parent && this.root.parent.entities || this.root.entities || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }
  _bankPacks() {
    return this.root.bank_packs || this.root.parent && this.root.parent.bank_packs || {};
  }
  _observe() {
    const character = this.root && this.root.character || null;
    if (!character || !this.manager) return null;
    const G = this.root.G || this.root.parent && this.root.parent.G || {};
    return this.manager.observe({ character, bankPacks: this._bankPacks(), gameData: G, observedAt: this.now() });
  }
  _preflight(tx) {
    if (!tx) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_BANK_EXPANSION_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_BANK_EXPANSION_BUSY' };
    if (tx.state !== 'RESERVED') return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (tx.leaseExpiresAt != null && this.now() > Number(tx.leaseExpiresAt)) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (tx.nextRetryAt != null && this.now() < Number(tx.nextRetryAt)) return { ok: false, reason: 'PREFLIGHT_BACKOFF_ACTIVE' };
    if (tx.currency !== 'gold') return { ok: false, reason: 'SHELL_SPEND_NOT_ENABLED_FOR_ALPHA18_CANARY' };
    if (this.engine && this.engine.breaker().open) return { ok: false, reason: 'BANK_EXPANSION_CIRCUIT_OPEN' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this.root && this.root.character;
    if (!character) return { ok: false, reason: 'CHARACTER_UNAVAILABLE' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
    if (Array.isArray(character.bank[tx.pack])) return { ok: false, reason: 'BANK_PACK_ALREADY_UNLOCKED' };
    const catalog = this._bankPacks();
    const raw = catalog && catalog[tx.pack];
    if (!raw) return { ok: false, reason: 'BANK_PACK_CATALOG_MISSING' };
    const map = Array.isArray(raw) ? raw[0] : raw.map || raw.place;
    const goldCost = Array.isArray(raw) ? finite(raw[1], -1) : finite(raw.gold == null ? raw.goldCost : raw.gold, -1);
    if (map != null && String(character.map || '') !== String(map)) return { ok: false, reason: 'WRONG_BANK_FLOOR', expectedMap: map, actualMap: character.map || null };
    if (goldCost < 0 || goldCost !== finite(tx.cost, -2)) {
      this.stats.staleCostRejected += 1;
      return { ok: false, reason: 'EXPANSION_COST_STALE', expectedCost: tx.cost, observedCost: goldCost };
    }
    const gold = Math.max(0, finite(character.gold, 0));
    if (gold < goldCost) return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
    if (gold - goldCost < Math.max(0, finite(tx.protectedReserve, 0))) return { ok: false, reason: 'PROTECTED_GOLD_RESERVE_VIOLATION' };
    if (typeof this.root.open_bank_pack !== 'function') return { ok: false, reason: 'OPEN_BANK_PACK_API_UNAVAILABLE' };
    return { ok: true, character, catalog, map, goldCost };
  }
  _timeout(promise) {
    let timer = null;
    const setTimer = this.root.setTimeout || setTimeout;
    const clearTimer = this.root.clearTimeout || clearTimeout;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error('BANK_EXPANSION_TIMEOUT')), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }
  _snapshot(tx) {
    const character = this.root && this.root.character || {};
    const pack = character.bank && Array.isArray(character.bank[tx.pack]) ? character.bank[tx.pack] : null;
    return {
      at: this.now(),
      pack: tx.pack,
      unlocked: !!pack,
      capacity: pack ? pack.length : 0,
      occupied: pack ? pack.filter(Boolean).length : 0,
      gold: Math.max(0, finite(character.gold, 0)),
      map: character.map || null
    };
  }
  _failSafe(tx, reason, evidence = {}) {
    this.engine.failSafe(tx.id, reason, evidence);
    this.stats.failedSafe += 1;
    this.lastAction = { at: this.now(), transactionId: tx.id, pack: tx.pack, result: 'FAILED_SAFE', reason, evidence: clone(evidence) };
    this._event('CONTROLLED_BANK_EXPANSION_FAILED_SAFE', 'error', reason, this.lastAction);
    return { executed: true, committed: false, reason, evidence: clone(evidence) };
  }
  async execute(transactionId) {
    const tx = this.engine && this.engine.get(String(transactionId));
    const check = this._preflight(tx);
    if (!check.ok) {
      this.stats.rejected += 1;
      if (tx && ['BANK_PACK_CATALOG_MISSING', 'WRONG_BANK_FLOOR', 'PREFLIGHT_BACKOFF_ACTIVE'].includes(check.reason)) this.engine.preflightRetry(tx.id, check.reason);
      if (tx && check.reason === 'TRANSACTION_LEASE_EXPIRED') this.engine.abort(tx.id, check.reason);
      this._event('CONTROLLED_BANK_EXPANSION_REJECTED', 'warn', check.reason, { transactionId, pack: tx && tx.pack || null });
      return { executed: false, committed: false, reason: check.reason, ...check };
    }
    const begun = this.engine.begin(tx.id);
    if (!begun.ok) return { executed: false, committed: false, reason: begun.reason };
    this.busy = true;
    this.stats.attempts += 1;
    const before = this._snapshot(tx);
    this._event('CONTROLLED_BANK_EXPANSION_STARTED', 'warn', 'CONTROLLED_CANARY', { transactionId: tx.id, pack: tx.pack, currency: tx.currency, cost: tx.cost, before });
    try {
      const response = await this._timeout(this.root.open_bank_pack(tx.pack, tx.currency, this.timeoutMs));
      this.engine.verifying(tx.id);
      const after = this._snapshot(tx);
      if (!after.unlocked || after.capacity <= 0) {
        this.stats.partialUnlockRejected += 1;
        return this._failSafe(tx, 'BANK_PACK_UNLOCK_NOT_OBSERVED', { before, after, response: clone(response) });
      }
      if (before.unlocked || before.capacity !== 0) return this._failSafe(tx, 'BANK_PACK_BEFORE_SNAPSHOT_INVALID', { before, after });
      const goldDelta = before.gold - after.gold;
      const expectedCost = finite(tx.cost, -1);
      if (expectedCost < 0 || (goldDelta !== 0 && goldDelta !== expectedCost)) {
        return this._failSafe(tx, 'BANK_EXPANSION_GOLD_DELTA_INVALID', { before, after, expectedCost, observedGoldDelta: goldDelta });
      }
      this.engine.commit(tx.id, { before, after, response: clone(response), expectedCost, observedGoldDelta: goldDelta, commitBasis: 'OFFICIAL_PROMISE_PLUS_OBSERVED_UNLOCK' });
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), transactionId: tx.id, pack: tx.pack, result: 'COMMITTED', reason: 'UNLOCK_VERIFIED_COMMIT', before, after, expectedCost, observedGoldDelta: goldDelta };
      this._event('CONTROLLED_BANK_EXPANSION_COMMITTED', 'info', 'UNLOCK_VERIFIED_COMMIT', this.lastAction);
      return { executed: true, committed: true, reason: 'UNLOCK_VERIFIED_COMMIT', before, after, expectedCost, observedGoldDelta: goldDelta, response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'BANK_EXPANSION_FAILED');
      if (reason.includes('TIMEOUT')) this.stats.timeouts += 1;
      return this._failSafe(tx, reason, { before, after: this._snapshot(tx) });
    } finally {
      this.busy = false;
    }
  }
  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_BANK_EXPANSION_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      explicitAckRequired: CONTROLLED_BANK_EXPANSION_ACK,
      officialApi: 'open_bank_pack(pack,currency,timeout_ms)',
      goldCanaryOnly: true,
      shellSpendEnabled: false,
      rawActionAttemptLimit: 1,
      verification: 'official-promise-plus-observed-pack-unlock-capacity-and-exact-or-stale-local-gold-delta',
      busy: this.busy,
      timeoutMs: this.timeoutMs,
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledBankExpansionExecutor, CONTROLLED_BANK_EXPANSION_MODE, CONTROLLED_BANK_EXPANSION_ACK };
