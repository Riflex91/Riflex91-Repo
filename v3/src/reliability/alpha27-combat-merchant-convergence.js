'use strict';

const { finite, clone, farmerOwnedCombatBusy, isPoisonedPerformanceProfile, levelOf, gradeForLevel } = require('./alpha27-utils');
const { Alpha27CombatOwnership } = require('./alpha27-combat-ownership');
const { Alpha27AtomicEconomy } = require('./alpha27-atomic-economy');
const { Alpha27MerchantAutonomy } = require('./alpha27-merchant-autonomy');
const { installAlpha28LiveAuthorityLiveness } = require('./alpha28-live-authority-liveness');
const { installMerchantTaskCoordinator } = require('../merchant/merchant-task-coordinator');
const { installMerchantRouteStability } = require('../merchant/merchant-route-stability');

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
    // Temporary live-observation experiment: 10x the former defaults while
    // keeping the same one-hour window and all per-attempt atomic safeguards.
    // Upgrade: 3 -> 30, Compound: 2 -> 20.
    maxUpgradeAttemptsPerWindow: Math.max(1, Math.min(200, Math.floor(finite(options.maxUpgradeAttemptsPerWindow, 30)))),
    maxCompoundAttemptsPerWindow: Math.max(1, Math.min(200, Math.floor(finite(options.maxCompoundAttemptsPerWindow, 20)))),
    gearDeliveryDistance: Math.max(50, Math.min(800, finite(options.gearDeliveryDistance, 400))),
    maxUpgradeLevel: Math.max(0, Math.min(7, Math.floor(finite(options.maxUpgradeLevel, 7)))),
    maxCompoundLevel: Math.max(0, Math.min(10, Math.floor(finite(options.maxCompoundLevel, 10)))),
    serviceTravelTimeoutMs: Math.max(5000, Math.min(180000, finite(options.serviceTravelTimeoutMs, 90000))),
    verifyDelayMs: Math.max(25, Math.min(1000, finite(options.verifyDelayMs, 150))),
    verifyAttempts: Math.max(1, Math.min(20, Math.floor(finite(options.verifyAttempts, 10))))
  };
}

function synchronizeLegacyUpgradePolicy(runtime, maxUpgradeLevel) {
  const legacy = runtime && runtime.merchantEconomyAutonomy;
  if (!legacy || !legacy.cfg || typeof legacy.cfg !== 'object') return false;
  const resultCap = Math.max(0, Math.min(7, Math.floor(finite(maxUpgradeLevel, 7))));
  // Alpha20/22 already uses an exclusive source-level check for upgrades, so
  // the stored value can match Alpha27's result-level cap directly.
  legacy.cfg.maxUpgrade = resultCap;
  legacy.cfg.maxUpgradeResultLevel = resultCap;
  return true;
}

function synchronizeLegacyCompoundPolicy(runtime, maxCompoundLevel) {
  const legacy = runtime && runtime.merchantEconomyAutonomy;
  if (!legacy || !legacy.cfg || typeof legacy.cfg !== 'object') return false;
  const resultCap = Math.max(0, Math.min(10, Math.floor(finite(maxCompoundLevel, 10))));
  // Alpha20/22 stores the highest source level it may compound and historically
  // used an inclusive check. Keep that legacy path aligned with Alpha27's
  // result-level cap without widening any other economy authority.
  legacy.cfg.maxCompound = resultCap - 1;
  legacy.cfg.maxCompoundResultLevel = resultCap;
  return true;
}

function selectedLegacyUpgradeGrade(legacy, res) {
  try {
    const c = legacy && typeof legacy._c === 'function' ? legacy._c() : null;
    const goals = res && Array.isArray(res.goals) ? res.goals : [];
    if (!c) return null;
    const goal = goals
      .filter((row) => row && row.sourceCharacter === c.name && row.projectedUpgradeRequired && Number(row.observedLevel) < Number(row.targetLevel) && Number(row.observedLevel) < finite(legacy.cfg && legacy.cfg.maxUpgrade, 0))
      .sort((a, b) => finite(b.survivalImprovement, 0) - finite(a.survivalImprovement, 0))[0];
    if (!goal) return null;
    const item = typeof legacy._inv === 'function' ? legacy._inv().find((row) => row && row.name === goal.item && levelOf(row) === Number(goal.observedLevel || 0)) : null;
    const gd = typeof legacy._g === 'function' ? legacy._g() : {};
    const meta = gd && gd.items && gd.items[goal.item];
    if (!item || !meta || !meta.upgrade || item.locked || item.l || item.special || item.p) return null;
    const quote = legacy.oracle && typeof legacy.oracle.quote === 'function' ? legacy.oracle.quote(goal.item, levelOf(item)) : null;
    if (quote && quote.fairValue != null && quote.fairValue > finite(legacy.cfg && legacy.cfg.upgradeCap, Infinity)) return null;
    return gradeForLevel(meta, levelOf(item));
  } catch (_) { return null; }
}

function selectedLegacyCompoundGrade(legacy, res) {
  try {
    const groups = new Map();
    const gd = typeof legacy._g === 'function' ? legacy._g() : {};
    const reserved = res && res.keys && typeof res.keys.has === 'function' ? res.keys : new Set();
    const items = typeof legacy._inv === 'function' ? legacy._inv() : [];
    for (const item of items) {
      if (!item || !item.name || item.locked || item.l || item.special || item.p) continue;
      const level = levelOf(item);
      const meta = gd && gd.items && gd.items[item.name];
      if (!meta || !meta.compound || level > finite(legacy.cfg && legacy.cfg.maxCompound, -1) || reserved.has(`${item.name}:${level}`)) continue;
      const quote = legacy.oracle && typeof legacy.oracle.quote === 'function' ? legacy.oracle.quote(item.name, level) : null;
      if (quote && quote.fairValue != null && quote.fairValue > finite(legacy.cfg && legacy.cfg.compoundCap, Infinity)) continue;
      const key = `${item.name}:${level}`;
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    }
    const group = [...groups.values()].find((rows) => rows.length >= 3);
    if (!group) return null;
    const meta = gd && gd.items && gd.items[group[0].name];
    return meta ? gradeForLevel(meta, levelOf(group[0])) : null;
  } catch (_) { return null; }
}

function installLegacyProgressionGradeGuard(runtime) {
  const legacy = runtime && runtime.merchantEconomyAutonomy;
  if (!legacy || legacy.__alpha27ProgressionGradeGuardInstalled) return false;
  let installed = false;
  if (typeof legacy._upgrade === 'function') {
    const baseUpgrade = legacy._upgrade.bind(legacy);
    legacy._upgrade = async (res) => {
      const grade = selectedLegacyUpgradeGrade(legacy, res);
      if (grade != null && grade >= 3) {
        legacy.lastDecision = { at: typeof legacy.now === 'function' ? legacy.now() : Date.now(), action: 'DEFER_TO_ALPHA27', reason: grade >= 4 ? 'UPGRADE_ITEM_EXALTED' : 'LEGENDARY_SCROLL_REQUIRES_ALPHA27', grade };
        return false;
      }
      return baseUpgrade(res);
    };
    installed = true;
  }
  if (typeof legacy._compound === 'function') {
    const baseCompound = legacy._compound.bind(legacy);
    legacy._compound = async (res) => {
      const grade = selectedLegacyCompoundGrade(legacy, res);
      if (grade != null && grade >= 3) {
        legacy.lastDecision = { at: typeof legacy.now === 'function' ? legacy.now() : Date.now(), action: 'DEFER_TO_ALPHA27', reason: grade >= 4 ? 'COMPOUND_ITEM_EXALTED' : 'LEGENDARY_SCROLL_REQUIRES_ALPHA27', grade };
        return false;
      }
      return baseCompound(res);
    };
    installed = true;
  }
  if (installed) legacy.__alpha27ProgressionGradeGuardInstalled = true;
  return installed;
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
    this.legacyUpgradePolicySynchronized = synchronizeLegacyUpgradePolicy(runtime, this.options.maxUpgradeLevel);
    this.legacyCompoundPolicySynchronized = synchronizeLegacyCompoundPolicy(runtime, this.options.maxCompoundLevel);
    this.legacyProgressionGradeGuardInstalled = installLegacyProgressionGradeGuard(runtime);
    this.stats = initialStats();
    this.taskCoordinator = installMerchantTaskCoordinator(runtime, options);
    this.routeStability = installMerchantRouteStability(runtime, options);
    const shared = { now: this.now, log: this.log, options: this.options, stats: this.stats, taskCoordinator: this.taskCoordinator };
    this.combat = new Alpha27CombatOwnership(runtime, shared);
    this.atomic = new Alpha27AtomicEconomy(runtime, shared);
    this.merchant = new Alpha27MerchantAutonomy(runtime, this.atomic, shared);
    this._patchRuntimeTick();
    this.alpha28 = installAlpha28LiveAuthorityLiveness(runtime, { parentAlpha27: this });
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
        taskCoordinator: this.taskCoordinator ? this.taskCoordinator.status() : null,
        routeStability: this.routeStability ? this.routeStability.status() : null,
        centralLedgerPlanner: true,
        atomicTransactions: true,
        realUpgrade: true,
        realCompound: true,
        blindMutationRetryAllowed: false,
        legacyUpgradePolicySynchronized: this.legacyUpgradePolicySynchronized,
        legacyCompoundPolicySynchronized: this.legacyCompoundPolicySynchronized,
        legacyProgressionGradeGuardInstalled: this.legacyProgressionGradeGuardInstalled,
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
      alpha28: this.alpha28 && typeof this.alpha28.status === 'function' ? this.alpha28.status() : null,
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
        legendaryProgressionOwnedByAlpha27: true,
        exaltedProgressionMutationBlocked: true,
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
  boundedOptions,
  synchronizeLegacyUpgradePolicy,
  synchronizeLegacyCompoundPolicy,
  installLegacyProgressionGradeGuard
};
