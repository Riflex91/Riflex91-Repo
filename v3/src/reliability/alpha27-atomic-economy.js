'use strict';

const { finite, clone, text, errorDetails, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
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

    if (tx && reason === 'MUTATION_RISK_BUDGET_EXHAUSTED') {
      const retryAt = finite(check && check.mutationBudget && check.mutationBudget.retryAt, null);
      if (engine && typeof engine.cancel === 'function') engine.cancel(tx.id, 'PREFLIGHT_RELEASED:MUTATION_RISK_BUDGET_EXHAUSTED');
      this.lastMerchantAction = {
        at: now,
        transactionId: tx.id,
        type: tx.type,
        result: 'RELEASED',
        reason,
        retryAt,
        mutationBudget: clone(check && check.mutationBudget || null)
      };
      if (executor) executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_PREFLIGHT_RELEASED', 'info', reason, this.lastMerchantAction);
      return { executed: false, committed: false, released: true, reason, retryAt, mutationBudget: clone(check && check.mutationBudget || null) };
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

  _normalizeMutationChance(response) {
    const raw = response && response.chance != null
      ? Number(response.chance)
      : response && response.data && response.data.chance != null
        ? Number(response.data.chance)
        : null;
    if (!Number.isFinite(raw) || raw < 0) return null;
    if (raw <= 1) return raw;
    if (raw <= 100) return raw / 100;
    return null;
  }

  _mutationReplacementStock(tx) {
    const inputIndexes = new Set(transactionInputs(tx).map((row) => Number(row.index)));
    const level = levelOf(tx);
    let localUnits = 0;
    for (let index = 0; index < inventoryOf(this.root).length; index += 1) {
      const item = inventoryOf(this.root)[index];
      if (!item || inputIndexes.has(index) || String(item.name || '') !== String(tx.item || '') || levelOf(item) < level) continue;
      if (item.locked || item.l || item.special || item.p) continue;
      localUnits += Math.max(1, Math.floor(finite(item.q, 1)));
    }

    let bankUnits = 0;
    try {
      const catalog = this.runtime.merchantBankCatalog;
      const status = catalog && typeof catalog.status === 'function' ? catalog.status() : null;
      const rows = status && status.usable === true && status.snapshot && Array.isArray(status.snapshot.rows)
        ? status.snapshot.rows
        : [];
      for (const row of rows) {
        if (!row || String(row.name || '') !== String(tx.item || '') || levelOf(row) < level) continue;
        bankUnits += Math.max(1, Math.floor(finite(row.quantity, 1)));
      }
    } catch (_) {}

    const spareUnits = localUnits + bankUnits;
    const spareEquivalents = String(tx.type || '').toUpperCase() === 'COMPOUND'
      ? Math.floor(spareUnits / 3)
      : spareUnits;
    return { localUnits, bankUnits, spareUnits, spareEquivalents };
  }

  _mutationPartyCurrentValue(tx) {
    const c = characterOf(this.runtime);
    const gear = this.runtime.gearProgression;
    if (!c || !gear || typeof gear.list !== 'function') return { usefulNow: false, goals: [] };
    const inputIndexes = new Set(transactionInputs(tx).map((row) => Number(row.index)));
    let goals = [];
    try {
      goals = gear.list(256).filter((goal) => (
        goal
        && String(goal.sourceCharacter || '') === String(tx.character || c.name || '')
        && String(goal.character || '') !== String(tx.character || c.name || '')
        && String(goal.item || '') === String(tx.item || '')
        && levelOf({ level: goal.observedLevel }) === levelOf(tx)
        && (
          (goal.sourceIndex != null && inputIndexes.has(Number(goal.sourceIndex)))
          || goal.sourceIndex == null
        )
      ));
    } catch (_) {
      goals = [];
    }
    const useful = goals.filter((goal) => goal.observedMeaningful === true);
    useful.sort((a, b) => finite(b.observedSurvivalImprovement, 0) - finite(a.observedSurvivalImprovement, 0)
      || finite(b.observedImprovement, 0) - finite(a.observedImprovement, 0));
    return {
      usefulNow: useful.length > 0,
      goals: useful.slice(0, 8).map((goal) => ({
        character: goal.character,
        slot: goal.slot,
        currentItem: goal.currentItem || null,
        currentLevel: finite(goal.currentLevel, 0),
        observedLevel: finite(goal.observedLevel, 0),
        observedImprovement: finite(goal.observedImprovement, 0),
        observedSurvivalImprovement: finite(goal.observedSurvivalImprovement, 0)
      }))
    };
  }

  _mutationRiskThreshold(tx, check, replacement, partyValue) {
    const spare = Math.max(0, finite(replacement && replacement.spareEquivalents, 0));
    const base = spare >= 2
      ? finite(this.options.speculativeMinChanceManySpares, 0.20)
      : spare >= 1
        ? finite(this.options.speculativeMinChanceOneSpare, 0.35)
        : finite(this.options.speculativeMinChanceNoSpare, 0.60);
    const level = levelOf(tx);
    const levelPenalty = Math.min(0.30, level * Math.max(0, finite(this.options.mutationRiskLevelStep, 0.05)));
    const compoundPenalty = String(tx.type || '').toUpperCase() === 'COMPOUND' ? 0.05 : 0;
    const partyPenalty = partyValue && partyValue.usefulNow === true ? 0.12 : 0;
    const meta = check && check.meta || {};
    const value = Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0));
    const cap = String(tx.type || '').toUpperCase() === 'COMPOUND'
      ? Math.max(1, finite(this.options.compoundValueCap, 500000))
      : Math.max(1, finite(this.options.upgradeValueCap, 2000000));
    const valuePenalty = Math.min(0.08, (value / cap) * 0.08);
    const minChance = Math.max(0, Math.min(0.995, base + levelPenalty + compoundPenalty + partyPenalty + valuePenalty));
    return {
      minChance,
      base,
      levelPenalty,
      compoundPenalty,
      partyPenalty,
      valuePenalty,
      level,
      spareEquivalents: spare
    };
  }

  async mutationRiskDecision(tx, check, scroll) {
    const replacement = this._mutationReplacementStock(tx);
    const partyValue = this._mutationPartyCurrentValue(tx);
    const threshold = this._mutationRiskThreshold(tx, check, replacement, partyValue);
    const type = String(tx && tx.type || '').toUpperCase();
    let response = null;
    let chance = null;
    let reason = null;
    try {
      if (type === 'UPGRADE') {
        const action = rawFunction(this.root, 'upgrade');
        if (!action) throw new Error('UPGRADE_API_UNAVAILABLE');
        const args = action.fn.length >= 5
          ? [check.inputs[0].index, scroll.index, undefined, 'code', true]
          : [check.inputs[0].index, scroll.index, undefined, true];
        response = await this._timeout(
          action.fn.apply(action.owner, args),
          'UPGRADE_CHANCE',
          Math.max(1000, finite(this.options.mutationChanceTimeoutMs, 4000))
        );
      } else if (type === 'COMPOUND') {
        const action = rawFunction(this.root, 'compound');
        if (!action) throw new Error('COMPOUND_API_UNAVAILABLE');
        const args = action.fn.length >= 7
          ? [check.inputs[0].index, check.inputs[1].index, check.inputs[2].index, scroll.index, undefined, 'code', true]
          : [check.inputs[0].index, check.inputs[1].index, check.inputs[2].index, scroll.index, undefined, true];
        response = await this._timeout(
          action.fn.apply(action.owner, args),
          'COMPOUND_CHANCE',
          Math.max(1000, finite(this.options.mutationChanceTimeoutMs, 4000))
        );
      } else {
        throw new Error('MUTATION_RISK_UNSUPPORTED_TYPE');
      }
      chance = this._normalizeMutationChance(response);
      if (chance == null) reason = 'MUTATION_CHANCE_UNAVAILABLE';
    } catch (error) {
      reason = errorDetails(error).reason || 'MUTATION_CHANCE_UNAVAILABLE';
    }

    this.stats.mutationChanceChecks = (this.stats.mutationChanceChecks || 0) + 1;
    const allowed = chance != null && chance >= threshold.minChance;
    if (!allowed && !reason) reason = 'MUTATION_RISK_EXCEEDS_POLICY';
    const decision = {
      at: this.now(),
      allowed,
      reason: allowed ? 'MUTATION_RISK_ACCEPTED' : reason,
      type,
      item: tx && tx.item || null,
      level: levelOf(tx),
      scroll: check && check.scroll || null,
      chance,
      minChance: threshold.minChance,
      threshold,
      replacement,
      partyValue,
      serverAuthoritative: chance != null,
      chanceResponse: chance == null ? clone(response) : null
    };
    this.lastMutationRiskDecision = clone(decision);
    this._event(
      'ALPHA27_MUTATION_RISK_DECISION',
      allowed ? 'info' : 'warn',
      decision.reason,
      decision
    );
    return decision;
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
    const ensured = await this.ensureScroll(tx, check.scroll);
    if (!ensured.ok) {
      executor.busy = false;
      this.merchantBusy = false;
      this.lastMerchantAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason: ensured.reason };
      return { executed: false, committed: false, reason: ensured.reason };
    }

    const risk = await this.mutationRiskDecision(tx, check, ensured.scroll);
    if (!risk.allowed) {
      this.stats.mutationRiskHolds = (this.stats.mutationRiskHolds || 0) + 1;
      const hold = this.setMutationRiskHold(tx, risk);
      if (engine && typeof engine.cancel === 'function') engine.cancel(tx.id, `RISK_GATE:${risk.reason}`);
      executor.busy = false;
      this.merchantBusy = false;
      this.lastMerchantAction = {
        at: this.now(),
        transactionId: tx.id,
        type: tx.type,
        result: 'RELEASED',
        reason: risk.reason,
        risk: clone(risk),
        hold
      };
      executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_MUTATION_RISK_HELD', 'info', risk.reason, this.lastMerchantAction);
      return { executed: false, committed: false, released: true, reason: risk.reason, risk: clone(risk), hold };
    }
    this.clearMutationRiskHold(tx);
    if (executor.stats) executor.stats.attempts += 1;
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
      if (response && response.failed === true) throw response;
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
      const details = errorDetails(error);
      const reason = details.reason || 'ATOMIC_MUTATION_FAILED';
      engine.markFailedSafe(tx.id, reason);
      if (executor.stats) executor.stats.failedSafe += 1;
      this.stats.failedSafe += 1;
      this.lastMerchantAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason, error: details };
      executor.lastAction = clone(this.lastMerchantAction);
      this._event('ALPHA27_MERCHANT_MUTATION_FAILED_SAFE', 'error', reason, this.lastMerchantAction);
      return { executed: true, committed: false, reason, error: details };
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
      mutationRisk: {
        generalGate: true,
        serverAuthoritativeChanceCalculation: true,
        riskSensitivityIncreasesWithItemLevel: true,
        lastDecision: clone(this.lastMutationRiskDecision),
        activeHolds: this.mutationRiskHolds instanceof Map
          ? [...this.mutationRiskHolds.values()].filter((row) => row && finite(row.expiresAt, 0) > this.now()).map(clone)
          : []
      },
      controlled: this.runtime.controlledMerchant && this.runtime.controlledMerchant.status ? this.runtime.controlledMerchant.status() : null,
      transactions: this.runtime.transactionEngine && this.runtime.transactionEngine.status ? this.runtime.transactionEngine.status() : null
    };
  }
}

module.exports = { Alpha27AtomicEconomy, CONTROLLED_ACK, EXPECTED_DISPOSITIONS, TRANSIENT_ATOMIC_PREFLIGHT_REASONS };