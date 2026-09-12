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
function identityQuantity(items, name, level) {
  if (!Array.isArray(items)) return 0;
  const wantedName = String(name || '');
  const wantedLevel = Math.max(0, Math.floor(finite(level, 0)));
  let total = 0;
  for (const item of items) {
    const snapshot = itemSnapshot(item);
    if (!snapshot || snapshot.name !== wantedName || snapshot.level !== wantedLevel) continue;
    total += snapshot.q;
  }
  return total;
}
function bankIdentityQuantity(bank, name, level) {
  if (!bank || typeof bank !== 'object') return 0;
  let total = 0;
  for (const pack of Object.values(bank)) {
    if (!Array.isArray(pack)) continue;
    total += identityQuantity(pack, name, level);
  }
  return total;
}
function bankStoreAcknowledged(response) {
  return !!response
    && typeof response === 'object'
    && response.failed !== true
    && response.success === true
    && String(response.place || '') === 'bank'
    && String(response.bank_action || '') === 'store';
}
function genericSuccessfulResponse(response) {
  if (!response || typeof response !== 'object' || response.failed === true || response.success !== true) return false;
  return response.place == null && response.bank_action == null;
}
function hasExplicitBankBinding(response) {
  return !!response && typeof response === 'object' && (response.place != null || response.bank_action != null);
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
    this.verifyDelayMs = Math.max(0, Math.min(1000, finite(options.verifyDelayMs, 200)));
    this.verifyAttempts = Math.max(1, Math.min(20, Math.floor(finite(options.verifyAttempts, 10))));
    this.actionWindowMs = Math.max(10000, Math.min(30 * 60 * 1000, finite(options.actionWindowMs, 60000)));
    this.maxActionsPerWindow = Math.max(1, Math.min(10, Math.floor(finite(options.maxActionsPerWindow, 3))));
    this.enabled = false;
    this.sellEnabled = false;
    this.bankEnabled = false;
    this.busy = false;
    this.actionTimes = [];
    this.lastAction = null;
    this.stats = {
      attempts: 0,
      committed: 0,
      rejected: 0,
      failedSafe: 0,
      timeouts: 0,
      verificationRetries: 0,
      bankServerAckCommits: 0,
      bankLocalEvidenceCommits: 0,
      bankLocalObservationMisses: 0,
      bankInvalidServerAcks: 0
    };
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
    const items = Array.isArray(character.items) ? character.items : [];
    const afterItem = itemSnapshot(items[tx.index]);
    const afterGold = finite(character.gold, before.gold);
    const quantity = Math.max(1, Math.floor(finite(tx.quantity, 1)));
    const afterInventoryQuantity = identityQuantity(items, tx.item, tx.level);
    const expectedInventoryQuantity = Math.max(0, before.inventoryQuantity - quantity);

    if (tx.type === 'SELL') {
      const inventoryOk = afterInventoryQuantity === expectedInventoryQuantity;
      return {
        ok: inventoryOk && afterGold >= before.gold,
        afterItem,
        afterGold,
        inventoryQuantityBefore: before.inventoryQuantity,
        afterInventoryQuantity,
        expectedInventoryQuantity
      };
    }

    if (tx.type === 'BANK') {
      const afterBankQuantity = bankIdentityQuantity(character.bank, tx.item, tx.level);
      const expectedBankQuantity = before.bankQuantity + quantity;
      const inventoryOk = afterInventoryQuantity === expectedInventoryQuantity;
      const bankOk = afterBankQuantity === expectedBankQuantity;
      return {
        ok: inventoryOk && bankOk,
        afterItem,
        afterGold,
        inventoryQuantityBefore: before.inventoryQuantity,
        afterInventoryQuantity,
        expectedInventoryQuantity,
        bankQuantityBefore: before.bankQuantity,
        afterBankQuantity,
        expectedBankQuantity
      };
    }

    return {
      ok: false,
      afterItem,
      afterGold,
      inventoryQuantityBefore: before.inventoryQuantity,
      afterInventoryQuantity,
      expectedInventoryQuantity
    };
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

  _failSafe(tx, reason, extra = {}) {
    this.engine.markFailedSafe(tx.id, reason);
    this.stats.failedSafe += 1;
    this.lastAction = {
      at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason, ...clone(extra)
    };
    this._event('CONTROLLED_MERCHANT_FAILED_SAFE', 'error', reason, this.lastAction);
    return { executed: true, committed: false, reason, ...clone(extra) };
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
    const before = {
      item: itemSnapshot(character.items[tx.index]),
      gold: finite(character.gold, 0),
      at: this.now(),
      inventoryQuantity: identityQuantity(character.items, tx.item, tx.level),
      bankQuantity: tx.type === 'BANK' ? bankIdentityQuantity(character.bank, tx.item, tx.level) : 0
    };
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

      if (tx.type === 'BANK') {
        const serverAcknowledged = bankStoreAcknowledged(response);
        if (!serverAcknowledged && hasExplicitBankBinding(response)) {
          this.stats.bankInvalidServerAcks += 1;
          const localObservation = this._verify(tx, before);
          return this._failSafe(tx, 'BANK_SERVER_ACK_INVALID', {
            serverResponse: clone(response),
            serverAcknowledged: false,
            localObservationConfirmed: localObservation.ok === true,
            verification: localObservation
          });
        }

        const localObservation = await this._verifyEventually(tx, before);
        const localFallbackConfirmed = !serverAcknowledged && genericSuccessfulResponse(response) && localObservation.ok === true;
        if (!serverAcknowledged && !localFallbackConfirmed) {
          const reason = genericSuccessfulResponse(response) ? 'INVENTORY_DELTA_MISMATCH' : 'BANK_SERVER_ACK_INVALID';
          if (reason === 'BANK_SERVER_ACK_INVALID') this.stats.bankInvalidServerAcks += 1;
          return this._failSafe(tx, reason, {
            serverResponse: clone(response),
            serverAcknowledged: false,
            localObservationConfirmed: localObservation.ok === true,
            verification: localObservation
          });
        }

        const commitBasis = serverAcknowledged ? 'SERVER_ACK' : 'LOCAL_IDENTITY_BALANCE';
        const verification = {
          ...localObservation,
          serverAcknowledged,
          localObservationConfirmed: localObservation.ok === true,
          commitBasis
        };
        if (serverAcknowledged && !localObservation.ok) {
          this.stats.bankLocalObservationMisses += 1;
          this._event('CONTROLLED_BANK_LOCAL_STATE_UNCONFIRMED', 'warn', 'SERVER_ACK_LOCAL_CACHE_MISMATCH', {
            transactionId: tx.id,
            type: tx.type,
            verification: clone(verification)
          });
        }

        this.engine.markCommitted(tx.id, {
          serverResponse: clone(response),
          before: clone(before),
          verification: clone(verification)
        });
        this.stats.committed += 1;
        if (serverAcknowledged) this.stats.bankServerAckCommits += 1;
        else this.stats.bankLocalEvidenceCommits += 1;
        const commitReason = serverAcknowledged ? 'SERVER_ACK_COMMIT' : 'VERIFIED_COMMIT';
        this.lastAction = {
          at: this.now(), transactionId: tx.id, type: tx.type, result: 'COMMITTED',
          reason: commitReason, verification: clone(verification)
        };
        this._event('CONTROLLED_MERCHANT_COMMITTED', 'info', commitReason, this.lastAction);
        return {
          executed: true,
          committed: true,
          reason: commitReason,
          verification,
          response: clone(response)
        };
      }

      const verification = await this._verifyEventually(tx, before);
      if (!verification.ok) {
        return this._failSafe(tx, 'INVENTORY_DELTA_MISMATCH', { verification });
      }
      this.engine.markCommitted(tx.id, { serverResponse: clone(response), before: clone(before), verification: clone(verification) });
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'COMMITTED', verification };
      this._event('CONTROLLED_MERCHANT_COMMITTED', 'info', null, this.lastAction);
      return { executed: true, committed: true, reason: 'VERIFIED_COMMIT', verification, response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'CONTROLLED_EXECUTION_FAILED');
      if (reason.includes('_TIMEOUT')) this.stats.timeouts += 1;
      return this._failSafe(tx, reason);
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
      verification: {
        attempts: this.verifyAttempts,
        delayMs: this.verifyDelayMs,
        maxPollingMs: Math.max(0, this.verifyAttempts - 1) * this.verifyDelayMs,
        strategy: 'server-ack-bank-with-local-identity-balance-diagnostic',
        bankCommitBasis: 'SERVER_ACK_OR_STRICT_LOCAL_FALLBACK',
        bankRequiredAck: { success: true, place: 'bank', bank_action: 'store' },
        bankGenericSuccessFallback: 'REQUIRES_EXACT_LOCAL_IDENTITY_BALANCE',
        sellCommitBasis: 'IDENTITY_BALANCE_DELTA'
      },
      actionBudget: { maxPerWindow: this.maxActionsPerWindow, windowMs: this.actionWindowMs, inWindow: this.actionTimes.length },
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledMerchantExecutor, CONTROLLED_MERCHANT_MODE, CONTROLLED_MERCHANT_ACK: LIVE_ACK };