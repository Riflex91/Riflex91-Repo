'use strict';

const { finite, clone, farmerOwnedCombatBusy, isPoisonedPerformanceProfile } = require('./alpha27-utils');
const { Alpha27CombatOwnership } = require('./alpha27-combat-ownership');
const { Alpha27AtomicEconomy } = require('./alpha27-atomic-economy');
const { Alpha27MerchantAutonomy } = require('./alpha27-merchant-autonomy');

const ALPHA27_MODE = 'alpha27-combat-merchant-convergence-v1';

function boundedOptions(options = {}) {
  return {
    targetTtlMs: Math.max(1500, finite(options.targetTtlMs, 6000)),
    targetPublishMs: Math.max(250, finite(options.targetPublishMs, 1000)),
    merchantIntervalMs: Math.max(500, finite(options.merchantIntervalMs, 1200)),
    atomicLeaseMs: Math.max(30000, finite(options.atomicLeaseMs, 5 * 60 * 1000)),
    goldReserve: Math.max(0, finite(options.goldReserve, 1000000)),
    upgradeValueCap: Math.max(10000, finite(options.upgradeValueCap, 2000000)),
    compoundValueCap: Math.max(10000, finite(options.compoundValueCap, 500000)),
    keepValue: Math.max(10000, finite(options.keepValue, 1000000)),
    merchantPotionLow: Math.max(20, finite(options.merchantPotionLow, 160)),
    merchantPotionTarget: Math.max(80, finite(options.merchantPotionTarget, 500)),
    merchantMaxPotionBuy: Math.max(1, Math.min(2000, Math.floor(finite(options.merchantMaxPotionBuy, 500)))),
    mutationAttemptWindowMs: Math.max(60000, finite(options.mutationAttemptWindowMs, 60 * 60 * 1000)),
    maxUpgradeAttemptsPerWindow: Math.max(1, Math.min(20, Math.floor(finite(options.maxUpgradeAttemptsPerWindow, 3)))),
    maxCompoundAttemptsPerWindow: Math.max(1, Math.min(20, Math.floor(finite(options.maxCompoundAttemptsPerWindow, 2)))),
    gearDeliveryDistance: Math.max(50, Math.min(800, finite(options.gearDeliveryDistance, 400))),
    maxUpgradeLevel: Math.max(0, Math.min(4, Math.floor(finite(options.maxUpgradeLevel, 2)))),
    maxCompoundLevel: Math.max(0, Math.min(3, Math.floor(finite(options.maxCompoundLevel, 1)))),
    serviceTravelTimeoutMs: Math.max(5000, Math.min(180000, finite(options.serviceTravelTimeoutMs, 90000))),
    verifyDelayMs: Math.max(25, Math.min(1000, finite(options.verifyDelayMs, 150))),
    verifyAttempts: Math.max(1, Math.min(20, Math.floor(finite(options.verifyAttempts, 10))))
  };
}

function initialStats() {
  return {
    rawAdventureTargetsIgnored: 0,
    farmerOwnedCombatHolds: 0,
    targetAuthorityPublishes: 0,
    targetAuthorityReceives: 0,
    targetAuthorityRejects: 0,
    performanceAttributedDamageEvents: 0,
    performanceAttributedKills: 0,
    performanceDisappearKills: 0,
    poisonedPerformanceProfilesQuarantined: 0,
    atomicTransactionsPlanned: 0,
    atomicInputReservations: 0,
    autoLedgerSellClassifications: 0,
    autoLedgerBankClassifications: 0,
    potionRestocks: 0,
    gearDeliveryAttempts: 0,
    gearDeliveriesCommitted: 0,
    restartAtomicTransactionsAborted: 0,
    autonomousMerchantCycles: 0,
    autonomousMerchantPlans: 0,
    autonomousMerchantHolds: 0,
    realUpgradesAttempted: 0,
    realUpgradesCommitted: 0,
    realUpgradeFailedRollsVerified: 0,
    realCompoundsAttempted: 0,
    realCompoundsCommitted: 0,
    realCompoundFailedRollsVerified: 0,
    scrollPurchases: 0,
    namedServiceTravels: 0,
    failedSafe: 0
  };
}

class Alpha27CombatMerchantConvergence {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.options = boundedOptions(options);
    this.stats = initialStats();
    const shared = { now: this.now, log: this.log, options: this.options, stats: this.stats };
    this.combat = new Alpha27CombatOwnership(runtime, shared);
    this.atomic = new Alpha27AtomicEconomy(runtime, shared);
    this.merchant = new Alpha27MerchantAutonomy(runtime, this.atomic, shared);
    this._patchRuntimeTick();
    this._event('ALPHA27_CONVERGENCE_INSTALLED', 'warn', 'CENTRAL_TARGET_AND_MERCHANT_AUTHORITY', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha27-convergence', event, severity, reason, data }); } catch (_) {}
  }

  get remoteLeaderTarget() { return this.combat.remoteLeaderTarget; }
  set remoteLeaderTarget(value) { this.combat.remoteLeaderTarget = value; }

  _patchTeamTargetAuthority() { return this.combat.patchTeamTargetAuthority(); }
  _patchCohesionRecovery() { return this.combat.patchCohesionRecovery(); }
  _patchPartyFocusAuthority() { return this.combat.patchPartyFocusAuthority(); }
  _executeAtomic(id) { return this.atomic.executeAtomic(id); }
  _restockPartyPotions() { return this.merchant.restockPartyPotions(); }
  _planUpgrade() { return this.merchant.planUpgrade(); }
  _planCompound() { return this.merchant.planCompound(); }
  _planSellOrBank() { return this.merchant.planSellOrBank(); }

  _patchRuntimeTick() {
    if (this.runtime.__alpha27ConvergenceTickInstalled || typeof this.runtime.tick !== 'function') return false;
    const baseTick = this.runtime.tick.bind(this.runtime);
    this.runtime.tick = (...args) => {
      const result = baseTick(...args);
      try { this.combat.tick(); }
      catch (error) {
        this.stats.failedSafe += 1;
        this._event('ALPHA27_COMBAT_TICK_FAILED_SAFE', 'error', 'ALPHA27_COMBAT_TICK_ERROR', { message: String(error && error.message || error).slice(0, 220) });
      }
      try { this.merchant.tick(); }
      catch (error) {
        this.stats.failedSafe += 1;
        this._event('ALPHA27_MERCHANT_TICK_FAILED_SAFE', 'error', 'ALPHA27_MERCHANT_TICK_ERROR', { message: String(error && error.message || error).slice(0, 220) });
      }
      return result;
    };
    this.runtime.__alpha27ConvergenceTickInstalled = true;
    return true;
  }

  status() {
    const combat = this.combat.status();
    const merchant = this.merchant.status();
    return {
      schemaVersion: 1,
      mode: ALPHA27_MODE,
      targetAuthority: combat.targetAuthority,
      cohesionRecovery: combat.cohesionRecovery,
      performance: combat.performance,
      merchant: {
        autonomous: true,
        centralLedgerPlanner: true,
        atomicTransactions: true,
        realUpgrade: true,
        realCompound: true,
        blindMutationRetryAllowed: false,
        ...merchant,
        risk: {
          goldReserve: this.options.goldReserve,
          upgradeValueCap: this.options.upgradeValueCap,
          compoundValueCap: this.options.compoundValueCap,
          keepValue: this.options.keepValue,
          merchantPotionLow: this.options.merchantPotionLow,
          merchantPotionTarget: this.options.merchantPotionTarget,
          mutationAttemptWindowMs: this.options.mutationAttemptWindowMs,
          maxUpgradeAttemptsPerWindow: this.options.maxUpgradeAttemptsPerWindow,
          maxCompoundAttemptsPerWindow: this.options.maxCompoundAttemptsPerWindow,
          gearDeliveryDistance: this.options.gearDeliveryDistance,
          maxUpgradeLevel: this.options.maxUpgradeLevel,
          maxCompoundLevel: this.options.maxCompoundLevel
        }
      },
      policies: {
        supervisorRequired: true,
        combatBlocksMerchantMutation: true,
        contentDriftBlocksMutation: true,
        ledgerDispositionRequired: true,
        gearGoalRequiredForUpgrade: true,
        compoundRequiresThreeAtomicReservations: true,
        restartUncertainMutationAborts: true,
        ambiguousMutationReplanBlocked: true,
        mutationAttemptBudgetPersisted: true,
        scrollPurchasePreservesGoldReserve: true,
        unknownItemsFailClosed: true,
        targetSafetyBypassAdded: false,
        farmerSmartMoveAuthorityAdded: false,
        merchantServiceTravelOnly: true
      },
      stats: { ...this.stats }
    };
  }
}

function installAlpha27CombatMerchantConvergence(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha27CombatMerchantConvergence) return runtime.alpha27CombatMerchantConvergence;
  const module = new Alpha27CombatMerchantConvergence(runtime, options);
  runtime.alpha27CombatMerchantConvergence = module;
  return module;
}

module.exports = {
  ALPHA27_MODE,
  Alpha27CombatMerchantConvergence,
  installAlpha27CombatMerchantConvergence,
  farmerOwnedCombatBusy,
  isPoisonedPerformanceProfile,
  boundedOptions
};
