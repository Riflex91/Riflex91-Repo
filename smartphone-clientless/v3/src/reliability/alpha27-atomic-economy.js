'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicService } = require('./alpha27-atomic-service');

const TRANSIENT_ATOMIC_PREFLIGHT_REASONS = new Set([
  'CONTROLLED_MERCHANT_DISABLED',
  'UPGRADE_LIVE_DISABLED',
  'COMPOUND_LIVE_DISABLED',
  'MERCHANT_ACTIVE_MODE_REQUIRED',
  'SUPERVISOR_NOT_HEALTHY',
  'CONTROLLED_MERCHANT_BUSY',
  'COMBAT_ACTIVE',
  'TRANSACTION_CIRCUIT_OPEN',
  'ACTION_BUDGET_EXHAUSTED',
  'MUTATION_RISK_BUDGET_EXHAUSTED',
  'LEDGER_UNAVAILABLE_OR_STALE',
  'ITEM_REQUIRES_REVALIDATION'
]);
const PREFLIGHT_DEFER_BASE_MS = 1000;
const PREFLIGHT_DEFER_MAX_MS = 15000;

class Alpha27AtomicEconomy extends Alpha27AtomicService {
  _deferredAtomicResult(tx) {
    const retryAt = finite(tx && tx.preflightDeferredUntil, 0);
    if (!tx || tx.state !== 'RESERVED' || retryAt <= this.now()) return null;
    return {
      executed: false,
      committed: false,
      reason: 'TRANSACTION_PREFLIGHT_DEFERRED',
      blockedReason: tx.lastPreflightReason || null,
      retryAt
    };
  }

  _handleAtomicPreflightReject(tx, check, executor) {
    const engine = this.runtime.transactionEngine;
    const reason = String(check && check.reason || 'ATOMIC_PREFLIGHT_REJECTED');
    const now = this.now();
    if (executor && executor.stats) executor.stats.rejected += 1;

    if (tx && reason === 'TRANSACTION_LEASE_EXPIRED') {
      if (engine && typeof engine.cancel === 'function') engine.cancel(tx.id, reason);
      this.lastMerchantAction = { at: now, transactionId: tx.id, type: tx.type, result: 'ABORTED', reason };
      if (executor) executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_PREFLIGHT_ABORTED', 'warn', reason, this.lastMerchantAction);
      return { executed: false, committed: false, aborted: true, reason };
    }

    if (tx && TRANSIENT_ATOMIC_PREFLIGHT_REASONS.has(reason)) {
      const liveTx = engine && engine.transactions && engine.transactions.get(String(tx.id));
      if (liveTx && liveTx.state === 'RESERVED') {
        const deferrals = Math.max(0, Math.floor(finite(liveTx.preflightDeferrals, 0))) + 1;
        const exponent = Math.min(4, deferrals - 1);
        const backoffMs = Math.min(PREFLIGHT_DEFER_MAX_MS, PREFLIGHT_DEFER_BASE_MS * (2 ** exponent));
        const leaseExpiresAt = finite(liveTx.leaseExpiresAt, 0);
        const retryAt = leaseExpiresAt > now ? Math.min(now + backoffMs, leaseExpiresAt) : now + backoffMs;
        liveTx.preflightDeferrals = deferrals;
        liveTx.preflightDeferredUntil = retryAt;
        liveTx.lastPreflightReason = reason;
        liveTx.reason = `PREFLIGHT_DEFERRED:${reason}`;
        liveTx.updatedAt = now;
        if (typeof engine.save === 'function') engine.save();
        this.lastMerchantAction = { at: now, transactionId: tx.id, type: tx.type, result: 'DEFERRED', reason, retryAt, backoffMs, deferrals };
        if (executor) executor.lastAction = clone(this.lastMerchantAction);
        this._event('ALPHA27_MERCHANT_PREFLIGHT_DEFERRED', deferrals === 1 ? 'warn' : 'info', reason, this.lastMerchantAction);
        return { executed: false, committed: false, deferred: true, reason, retryAt, backoffMs, deferrals };
      }
    }

    if (tx && engine && typeof engine.cancel === 'function') {
      const cancelReason = `PREFLIGHT_ABORTED:${reason}`;
      engine.cancel(tx.id, cancelReason);
      this.lastMerchantAction = { at: now, transactionId: tx.id, type: tx.type, result: 'ABORTED', reason, cancelReason };
      if (executor) executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_PREFLIGHT_ABORTED', 'warn', reason, this.lastMerchantAction);
      return { executed: false, committed: false, aborted: true, reason };
    }

    this.lastMerchantAction = { at: now, transactionId: tx && tx.id || null, type: tx && tx.type || null, result: 'REJECTED', reason };
    if (executor) executor.lastAction = clone(this.lastMerchantAction);
    return { executed: false, committed: false, reason };
  }

  async executeAtomic(transactionId) {
    const engine = this.runtime.transactionEngine;
    const executor = this.runtime.controlledMerchant;
    const tx = engine && engine.get(String(transactionId));
    const deferred = this._deferredAtomicResult(tx);
    if (deferred) {
      this.lastMerchantAction = {
        at: this.now(),
        transactionId: tx.id,
        type: tx.type,
        result: 'DEFERRED',
        reason: deferred.blockedReason || deferred.reason,
        retryAt: deferred.retryAt
      };
      if (executor) executor.lastAction = clone(this.lastMerchantAction);
      return deferred;
    }

    const check = this.atomicPreflight(tx);
    if (!check.ok) return this._handleAtomicPreflightReject(tx, check, executor);

    const livePreflightTx = engine && engine.transactions && tx ? engine.transactions.get(String(tx.id)) : null;
    if (livePreflightTx && (livePreflightTx.preflightDeferredUntil != null || livePreflightTx.lastPreflightReason != null)) {
      livePreflightTx.preflightDeferredUntil = null;
      livePreflightTx.lastPreflightReason = null;
      livePreflightTx.reason = 'ALPHA27_ATOMIC_PREFLIGHT_OK_RESERVED';
      livePreflightTx.updatedAt = this.now();
      if (typeof engine.save === 'function') engine.save();
    }

    this.merchantBusy = true;
    executor.busy = true;
    if (executor.stats) executor.stats.attempts += 1;
    const ensured = await this.ensureScroll(tx, check.scroll);
    if (!ensured.ok) {
      executor.busy = false;
      this.merchantBusy = false;
      this.lastMerchantAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason: ensured.reason };
      return { executed: false, committed: false, reason: ensured.reason };
    }
    const beforeItems = inventoryOf(this.root);
    const before = {
      at: this.now(),
      gold: finite(characterOf(this.runtime) && characterOf(this.runtime).gold, 0),
      baseLevelQuantity: identityQuantity(beforeItems, tx.item, tx.level),
      nextLevelQuantity: identityQuantity(beforeItems, tx.item, levelOf(tx) + 1),
      scrollQuantity: identityQuantity(beforeItems, check.scroll, 0),
      inputs: transactionInputs(tx)
    };
    let response = null;
    try {
      const liveTx = engine.transactions && engine.transactions.get(String(tx.id));
      if (!liveTx) throw new Error('TRANSACTION_DISAPPEARED_BEFORE_MUTATION');
      liveTx.preAction = clone(before);
      liveTx.mutationScroll = check.scroll;
      liveTx.attemptedAt = this.now();
      liveTx.updatedAt = this.now();
      engine.transition(tx.id, 'EXECUTING', 'ALPHA27_RAW_ACTION_STARTING');
      engine.save();
      if (Array.isArray(executor.actionTimes)) executor.actionTimes.push(this.now());
      if (tx.type === 'UPGRADE') {
        const action = rawFunction(this.root, 'upgrade');
        if (!action) throw new Error('UPGRADE_API_UNAVAILABLE');
        this.stats.realUpgradesAttempted += 1;
        response = await this._timeout(action.fn.call(action.owner, check.inputs[0].index, ensured.scroll.index), 'UPGRADE', 15000);
      } else {
        const action = rawFunction(this.root, 'compound');
        if (!action) throw new Error('COMPOUND_API_UNAVAILABLE');
        this.stats.realCompoundsAttempted += 1;
        response = await this._timeout(action.fn.call(action.owner, check.inputs[0].index, check.inputs[1].index, check.inputs[2].index, ensured.scroll.index), 'COMPOUND', 15000);
      }
      if (response && response.failed === true) throw new Error(String(response.reason || `${tx.type}_FAILED`));
      engine.transition(tx.id, 'VERIFYING', 'ALPHA27_RAW_ACTION_RETURNED');
      engine.save();
      let outcome = null;
      let after = null;
      const verified = await this.verifyEventually(() => {
        const items = inventoryOf(this.root);
        after = {
          baseLevelQuantity: identityQuantity(items, tx.item, tx.level),
          nextLevelQuantity: identityQuantity(items, tx.item, levelOf(tx) + 1),
          scrollQuantity: identityQuantity(items, check.scroll, 0)
        };
        const scrollReduced = after.scrollQuantity < before.scrollQuantity;
        const upgraded = after.nextLevelQuantity > before.nextLevelQuantity && after.baseLevelQuantity < before.baseLevelQuantity;
        if (upgraded && scrollReduced) { outcome = 'SUCCESS'; return true; }
        if (!scrollReduced) return false;
        if (tx.type === 'UPGRADE' && after.nextLevelQuantity === before.nextLevelQuantity && after.baseLevelQuantity <= before.baseLevelQuantity) {
          outcome = after.baseLevelQuantity < before.baseLevelQuantity ? 'FAILED_ROLL_ITEM_LOST' : 'FAILED_ROLL_ITEM_SURVIVED';
          return true;
        }
        if (tx.type === 'COMPOUND' && after.nextLevelQuantity === before.nextLevelQuantity && after.baseLevelQuantity <= Math.max(0, before.baseLevelQuantity - 3)) {
          outcome = 'FAILED_ROLL_INPUTS_CONSUMED';
          return true;
        }
        return false;
      });
      if (!verified || !outcome) throw new Error(`${tx.type}_DELTA_NOT_OBSERVED_NO_RETRY`);
      const evidence = { response: clone(response), before, after, outcome, commitBasis: 'STRICT_ITEM_AND_SCROLL_DELTA' };
      engine.markCommitted(tx.id, evidence);
      if (executor.stats) executor.stats.committed += 1;
      if (tx.type === 'UPGRADE') {
        this.stats.realUpgradesCommitted += 1;
        if (outcome !== 'SUCCESS') this.stats.realUpgradeFailedRollsVerified += 1;
      } else {
        this.stats.realCompoundsCommitted += 1;
        if (outcome !== 'SUCCESS') this.stats.realCompoundFailedRollsVerified += 1;
      }
      const reason = outcome === 'SUCCESS' ? 'VERIFIED_COMMIT' : 'VERIFIED_GAME_FAILURE_NO_BLIND_RETRY';
      this.lastMerchantAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'COMMITTED', reason, outcome, evidence };
      executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_MUTATION_COMMITTED', outcome === 'SUCCESS' ? 'warn' : 'info', reason, this.lastMerchantAction);
      return { executed: true, committed: true, reason, outcome, evidence, response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'ATOMIC_MUTATION_FAILED');
      engine.markFailedSafe(tx.id, reason);
      if (executor.stats) executor.stats.failedSafe += 1;
      this.stats.failedSafe += 1;
      this.lastMerchantAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason };
      executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_MUTATION_FAILED_SAFE', 'error', reason, this.lastMerchantAction);
      return { executed: true, committed: false, reason };
    } finally {
      executor.busy = false;
      this.merchantBusy = false;
    }
  }

  patchControlledMerchant() {
    const executor = this.runtime.controlledMerchant;
    if (!executor || executor.__alpha27MutationPatched) return false;
    executor.upgradeEnabled = false;
    executor.compoundEnabled = false;
    const baseConfigure = executor.configure.bind(executor);
    executor.configure = (config = {}) => {
      baseConfigure(config);
      const live = executor.enabled && config.ack === CONTROLLED_ACK;
      executor.upgradeEnabled = live && config.upgrade === true;
      executor.compoundEnabled = live && config.compound === true;
      return executor.status();
    };
    const baseDisable = executor.disable.bind(executor);
    executor.disable = (reason) => { executor.upgradeEnabled = false; executor.compoundEnabled = false; return baseDisable(reason); };
    const baseExecute = executor.execute.bind(executor);
    executor.execute = (id) => {
      const tx = this.runtime.transactionEngine && this.runtime.transactionEngine.get(String(id));
      if (tx && ['UPGRADE', 'COMPOUND'].includes(tx.type)) return this.executeAtomic(id);
      return baseExecute(id);
    };
    const baseStatus = executor.status.bind(executor);
    executor.status = () => {
      const status = baseStatus();
      const bounded = ['SELL', 'BANK', ...(executor.upgradeEnabled ? ['UPGRADE'] : []), ...(executor.compoundEnabled ? ['COMPOUND'] : [])];
      return {
        ...status,
        mode: 'alpha27-controlled-merchant-live',
        upgradeEnabled: executor.upgradeEnabled,
        compoundEnabled: executor.compoundEnabled,
        actionAuthority: executor.enabled && bounded.length > 0,
        boundedActionFamilies: bounded,
        forbiddenActionFamilies: ['EXCHANGE', 'TRADE'],
        atomicMutationVerification: 'STRICT_ITEM_AND_SCROLL_DELTA',
        blindMutationRetryAllowed: false,
        preflightDeferral: {
          enabled: true,
          baseMs: PREFLIGHT_DEFER_BASE_MS,
          maxMs: PREFLIGHT_DEFER_MAX_MS,
          extendsTransactionLease: false,
          stalePreflightAbortsAndReleases: true
        }
      };
    };
    executor.__alpha27MutationPatched = true;
    return true;
  }

  status() {
    return {
      merchantBusy: this.merchantBusy,
      serviceTravelBusy: this.serviceTravelBusy,
      lastMerchantAction: clone(this.lastMerchantAction),
      controlled: this.runtime.controlledMerchant && this.runtime.controlledMerchant.status ? this.runtime.controlledMerchant.status() : null,
      transactions: this.runtime.transactionEngine && this.runtime.transactionEngine.status ? this.runtime.transactionEngine.status() : null
    };
  }
}

module.exports = { Alpha27AtomicEconomy, CONTROLLED_ACK, EXPECTED_DISPOSITIONS, TRANSIENT_ATOMIC_PREFLIGHT_REASONS };
