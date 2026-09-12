'use strict';

const CONTROLLED_MERCHANT_MODE = 'controlled-live-default-off';
const LIVE_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function itemSnapshot(item) {
  if (!item) return null;
  return {
    name: item.name == null ? null : String(item.name),
    level: Math.max(0, Math.floor(finite(item.level, 0))),
    q: Math.max(1, Math.floor(finite(item.q, 1)))
  };
}

class ControlledMerchantExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.engine = options.engine;
    this.ledger = options.ledger;
    this.contentDrift = options.contentDrift || null;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.timeoutMs = Math.max(1000, Math.min(30000, finite(options.timeoutMs, 8000)));
    this.verifyDelayMs = Math.max(0, Math.min(1000, finite(options.verifyDelayMs, 100)));
    this.verifyAttempts = Math.max(1, Math.min(5, Math.floor(finite(options.verifyAttempts, 3))));
    this.actionWindowMs = Math.max(10000, Math.min(30 * 60 * 1000, finite(options.actionWindowMs, 60000)));
    this.maxActionsPerWindow = Math.max(1, Math.min(10, Math.floor(finite(options.maxActionsPerWindow, 3))));
    this.enabled = false;
    this.sellEnabled = false;
    this.bankEnabled = false;
    this.busy = false;
    this.actionTimes = [];
    this.lastAction = null;
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, timeouts: 0, verificationRetries: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'controlled-merchant', event, severity, reason, data });
    }
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== LIVE_ACK) {
      this.enabled = false;
      this.sellEnabled = false;
      this.bankEnabled = false;
      this._event('CONTROLLED_MERCHANT_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this.sellEnabled = wantsLive && config.sell === true;
    this.bankEnabled = wantsLive && config.bank === true;
    this._event('CONTROLLED_MERCHANT_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED', {
      enabled: this.enabled, sell: this.sellEnabled, bank: this.bankEnabled
    });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this.sellEnabled = false;
    this.bankEnabled = false;
    this._event('CONTROLLED_MERCHANT_DISABLED', 'warn', reason);
    return this.status();
  }

  _pruneActions() {
    const now = this.now();
    this.actionTimes = this.actionTimes.filter((at) => now - at <= this.actionWindowMs);
  }

  _inCombat() {
    const root = this.root || {};
    const character = root.character || {};
    if (character.target) return true;
    const parent = root.parent || {};
    const entities = parent.entities || root.entities || {};
    const selfNames = new Set([character.name, character.id].filter(Boolean).map(String));
    for (const entity of Object.values(entities)) {
      if (!entity || !entity.target) continue;
      if (selfNames.has(String(entity.target))) return true;
    }
    return false;
  }

  _ledgerEntry(tx) {
    if (!this.ledger || typeof this.ledger.get !== 'function') return null;
    try { return this.ledger.get(tx.character, tx.index); } catch (_) { return null; }
  }

  _preflight(tx) {
    if (!tx) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_MERCHANT_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_MERCHANT_BUSY' };
    if (tx.state !== 'RESERVED') return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (tx.leaseExpiresAt != null && this.now() > Number(tx.leaseExpiresAt)) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (!['SELL', 'BANK'].includes(tx.type)) return { ok: false, reason: 'TRANSACTION_FAMILY_NOT_LIVE_ALLOWED' };
    if (tx.type === 'SELL' && !this.sellEnabled) return { ok: false, reason: 'SELL_LIVE_DISABLED' };
    if (tx.type === 'BANK' && !this.bankEnabled) return { ok: false, reason: 'BANK_LIVE_DISABLED' };
    if (this.engine && this.engine.breaker(tx.type).open) return { ok: false, reason: 'TRANSACTION_CIRCUIT_OPEN' };

    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY', supervisorState: supervisor.state || null };

    const character = this.root && this.root.character;
    if (!character || String(character.name || '') !== String(tx.character || '')) return { ok: false, reason: 'CONTROLLED_CHARACTER_MISMATCH' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };

    const ledgerStatus = this.ledger && typeof this.ledger.status === 'function' ? this.ledger.status() : null;
    if (!ledgerStatus || ledgerStatus.stale === true) return { ok: false, reason: 'LEDGER_UNAVAILABLE_OR_STALE' };
    const entry = this._ledgerEntry(tx);
    if (!entry) return { ok: false, reason: 'LEDGER_ITEM_NOT_FOUND' };
    if (entry.name !== tx.item || Math.max(0, Math.floor(finite(entry.level, 0))) !== Math.max(0, Math.floor(finite(tx.level, 0)))) return { ok: false, reason: 'ITEM_IDENTITY_CHANGED' };
    if (entry.disposition !== tx.type) return { ok: false, reason: 'LEDGER_DISPOSITION_CHANGED', disposition: entry.disposition };
    if (finite(entry.q, 0) < finite(tx.quantity, 1)) return { ok: false, reason: 'ITEM_QUANTITY_CHANGED' };
    if (this.contentDrift && typeof this.contentDrift.requiresRevalidation === 'function' && this.contentDrift.requiresRevalidation('items', tx.item)) return { ok: false, reason: 'ITEM_REQUIRES_REVALIDATION' };

    const items = Array.isArray(character.items) ? character.items : [];
    const liveItem = itemSnapshot(items[tx.index]);
    if (!liveItem || liveItem.name !== tx.item || liveItem.level !== Math.max(0, Math.floor(finite(tx.level, 0)))) return { ok: false, reason: 'LIVE_ITEM_IDENTITY_MISMATCH' };
    if (liveItem.q < finite(tx.quantity, 1)) return { ok: false, reason: 'LIVE_ITEM_QUANTITY_MISMATCH' };

    if (tx.type === 'SELL' && typeof this.root.sell !== 'function') return { ok: false, reason: 'SELL_API_UNAVAILABLE' };
    if (tx.type === 'BANK') {
      if (typeof this.root.bank_store !== 'function') return { ok: false, reason: 'BANK_STORE_API_UNAVAILABLE' };
      if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
      if (finite(tx.quantity, 1) !== liveItem.q) return { ok: false, reason: 'BANK_REQUIRES_FULL_STACK' };
    }

    this._pruneActions();
    if (this.actionTimes.length >= this.maxActionsPerWindow) return { ok: false, reason: 'ACTION_BUDGET_EXHAUSTED' };
    return { ok: true, entry, liveItem, supervisor };
  }

  _timeout(promise, label) {
    let timer = null;
    const setTimer = (this.root && this.root.setTimeout) || setTimeout;
    const clearTimer = (this.root && this.root.clearTimeout) || clearTimeout;
    const timeout = new Promise((_, reject) => {
      timer = setTimer(() => reject(new Error(`${label}_TIMEOUT`)), this.timeoutMs);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
      if (timer != null) clearTimer(timer);
    });
  }

  _sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    const setTimer = (this.root && this.root.setTimeout) || setTimeout;
    return new Promise((resolve) => setTimer(resolve, ms));
  }

  _verify(tx, before) {
    const character = this.root && this.root.character || {};
    const after = itemSnapshot(Array.isArray(character.items) ? character.items[tx.index] : null);
    const afterGold = finite(character.gold, before.gold);
    const quantity = Math.max(1, Math.floor(finite(tx.quantity, 1)));
    if (tx.type === 'SELL') {
      const expectedQ = before.item.q - quantity;
      const itemOk = expectedQ <= 0
        ? after == null
        : !!after && after.name === before.item.name && after.level === before.item.level && after.q === expectedQ;
      return { ok: itemOk && afterGold >= before.gold, afterItem: after, afterGold, expectedQ };
    }
    if (tx.type === 'BANK') return { ok: after == null, afterItem: after, afterGold, expectedQ: 0 };
    return { ok: false, afterItem: after, afterGold, expectedQ: null };
  }

  async _verifyEventually(tx, before) {
    let result = this._verify(tx, before);
    for (let attempt = 1; !result.ok && attempt < this.verifyAttempts; attempt += 1) {
      this.stats.verificationRetries += 1;
      await this._sleep(this.verifyDelayMs);
      result = this._verify(tx, before);
    }
    return result;
  }

  async execute(transactionId) {
    const tx = this.engine && this.engine.get(String(transactionId));
    const check = this._preflight(tx);
    if (!check.ok) {
      if (tx && check.reason === 'TRANSACTION_LEASE_EXPIRED' && this.engine) this.engine.cancel(tx.id, check.reason);
      this.stats.rejected += 1;
      this._event('CONTROLLED_MERCHANT_EXECUTION_REJECTED', 'warn', check.reason, { transactionId, type: tx && tx.type || null, supervisorState: check.supervisorState || null });
      return { executed: false, committed: false, reason: check.reason };
    }

    this.busy = true;
    this.stats.attempts += 1;
    this.actionTimes.push(this.now());
    const character = this.root.character;
    const before = { item: itemSnapshot(character.items[tx.index]), gold: finite(character.gold, 0), at: this.now() };
    this.engine.transition(tx.id, 'EXECUTING', 'CONTROLLED_EXECUTION_STARTED');
    this.engine.save();
    this._event('CONTROLLED_MERCHANT_EXECUTION_STARTED', 'warn', 'CONTROLLED_CANARY', {
      transactionId: tx.id, type: tx.type, item: tx.item, quantity: tx.quantity, index: tx.index
    });

    try {
      const call = tx.type === 'SELL' ? this.root.sell(tx.index, tx.quantity) : this.root.bank_store(tx.index);
      const response = await this._timeout(call, tx.type);
      if (response && response.failed === true) throw new Error(String(response.reason || `${tx.type}_FAILED`));
      this.engine.transition(tx.id, 'VERIFYING', 'SERVER_RESULT_RECEIVED');
      this.engine.save();
      const verification = await this._verifyEventually(tx, before);
      if (!verification.ok) {
        this.engine.markFailedSafe(tx.id, 'INVENTORY_DELTA_MISMATCH');
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason: 'INVENTORY_DELTA_MISMATCH', verification };
        this._event('CONTROLLED_MERCHANT_FAILED_SAFE', 'error', 'INVENTORY_DELTA_MISMATCH', this.lastAction);
        return { executed: true, committed: false, reason: 'INVENTORY_DELTA_MISMATCH', verification };
      }
      this.engine.markCommitted(tx.id, { serverResponse: clone(response), before: clone(before), verification: clone(verification) });
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'COMMITTED', verification };
      this._event('CONTROLLED_MERCHANT_COMMITTED', 'info', null, this.lastAction);
      return { executed: true, committed: true, reason: 'VERIFIED_COMMIT', verification, response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'CONTROLLED_EXECUTION_FAILED');
      if (reason.includes('_TIMEOUT')) this.stats.timeouts += 1;
      this.engine.markFailedSafe(tx.id, reason);
      this.stats.failedSafe += 1;
      this.lastAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason };
      this._event('CONTROLLED_MERCHANT_FAILED_SAFE', 'error', reason, this.lastAction);
      return { executed: true, committed: false, reason };
    } finally {
      this.busy = false;
    }
  }

  status() {
    this._pruneActions();
    return {
      schemaVersion: 1,
      mode: CONTROLLED_MERCHANT_MODE,
      enabled: this.enabled,
      sellEnabled: this.sellEnabled,
      bankEnabled: this.bankEnabled,
      compoundEnabled: false,
      upgradeEnabled: false,
      exchangeEnabled: false,
      actionAuthority: this.enabled && (this.sellEnabled || this.bankEnabled),
      directActionAccess: true,
      boundedActionFamilies: ['SELL', 'BANK'],
      forbiddenActionFamilies: ['COMPOUND', 'UPGRADE', 'EXCHANGE', 'TRADE', 'SEND_ITEM'],
      explicitAckRequired: LIVE_ACK,
      busy: this.busy,
      timeoutMs: this.timeoutMs,
      verification: { attempts: this.verifyAttempts, delayMs: this.verifyDelayMs },
      actionBudget: { maxPerWindow: this.maxActionsPerWindow, windowMs: this.actionWindowMs, inWindow: this.actionTimes.length },
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledMerchantExecutor, CONTROLLED_MERCHANT_MODE, CONTROLLED_MERCHANT_ACK: LIVE_ACK };
