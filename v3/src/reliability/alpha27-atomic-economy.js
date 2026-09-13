'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicService } = require('./alpha27-atomic-service');

class Alpha27AtomicEconomy extends Alpha27AtomicService {
  async executeAtomic(transactionId) {
    const engine = this.runtime.transactionEngine;
    const executor = this.runtime.controlledMerchant;
    const tx = engine && engine.get(String(transactionId));
    const check = this.atomicPreflight(tx);
    if (!check.ok) {
      if (tx && check.reason === 'TRANSACTION_LEASE_EXPIRED') engine.cancel(tx.id, check.reason);
      if (executor && executor.stats) executor.stats.rejected += 1;
      this.lastMerchantAction = { at: this.now(), transactionId, type: tx && tx.type || null, result: 'REJECTED', reason: check.reason };
      return { executed: false, committed: false, reason: check.reason };
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
        blindMutationRetryAllowed: false
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

module.exports = { Alpha27AtomicEconomy, CONTROLLED_ACK, EXPECTED_DISPOSITIONS };
