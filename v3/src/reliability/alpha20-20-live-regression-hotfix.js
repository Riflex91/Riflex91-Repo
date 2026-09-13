'use strict';

// Guards two live regressions observed in the September 13 session logs.
const LIVE_REGRESSION_MODE = 'alpha20.20-live-regression-hotfix-v1';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function targetGone(target) {
  if (!target) return true;
  if (target.dead || target.rip) return true;
  const hp = finite(target.hp);
  return hp != null && hp <= 0;
}

function goalKey(goal) {
  if (!goal) return null;
  if (goal.id) return String(goal.id);
  return [goal.character, goal.slot, goal.item, finite(goal.observedLevel, 0), finite(goal.targetLevel, 0)]
    .map((value) => String(value == null ? '' : value)).join(':');
}

function goalSignature(goal) {
  return JSON.stringify({
    character: goal && goal.character || null,
    slot: goal && goal.slot || null,
    sourceCharacter: goal && goal.sourceCharacter || null,
    item: goal && goal.item || null,
    observedLevel: finite(goal && goal.observedLevel, 0),
    targetLevel: finite(goal && goal.targetLevel, 0),
    currentItem: goal && goal.currentItem || null,
    currentLevel: finite(goal && goal.currentLevel, 0),
    projectedUpgradeRequired: !!(goal && goal.projectedUpgradeRequired)
  });
}

function installStaleEncounterCleanup(runtime, stats) {
  const farmer = runtime && runtime.farmer;
  if (!farmer || farmer.__alpha2020StaleEncounterCleanupInstalled) return false;
  const log = runtime.log || null;

  const wrap = (method, phase) => {
    if (typeof farmer[method] !== 'function') return;
    const base = farmer[method].bind(farmer);
    farmer[method] = (context, target) => {
      if ((farmer.targetId != null || farmer.targetType != null) && targetGone(target)) {
        const staleTargetId = farmer.targetId == null ? null : String(farmer.targetId);
        const staleTargetType = farmer.targetType || null;
        if (typeof farmer._clearTarget === 'function') farmer._clearTarget('TARGET_DEAD_OR_GONE_PRE_COHESION_GATE');
        else {
          farmer.targetId = null;
          farmer.targetType = null;
        }
        if (typeof farmer._transition === 'function') {
          farmer._transition('REASSESS', 'TARGET_DEAD_OR_GONE_PRE_COHESION_GATE', { phase, staleTargetId, staleTargetType });
        } else {
          farmer.state = 'REASSESS';
          farmer.stateReason = 'TARGET_DEAD_OR_GONE_PRE_COHESION_GATE';
        }
        stats.staleEncounterClears += 1;
        if (log && typeof log.emit === 'function') {
          try {
            log.emit({
              component: 'alpha20.20-live-regression',
              event: 'STALE_ENCOUNTER_CLEARED',
              severity: 'warn',
              reason: 'TARGET_DEAD_OR_GONE_PRE_COHESION_GATE',
              data: { phase, staleTargetId, staleTargetType }
            });
          } catch (_) {}
        }
        return undefined;
      }
      return base(context, target);
    };
  };

  wrap('_engage', 'ENGAGE');
  wrap('_travel', 'TRAVEL');
  farmer.__alpha2020StaleEncounterCleanupInstalled = true;
  return true;
}

function installMerchantGearDeliveryGuard(runtime, stats, options = {}) {
  const economy = runtime && runtime.merchantEconomyAutonomy;
  if (!economy || economy.__alpha2020GearDeliveryGuardInstalled || typeof economy._gearTransfer !== 'function') return false;
  const maxEvidenceAgeMs = Math.max(5000, finite(options.maxGearEvidenceAgeMs, 30000));
  const claims = new Map();
  const base = economy._gearTransfer.bind(economy);
  const now = economy.now || runtime.now || (() => Date.now());

  economy._gearTransfer = async (reservations = {}) => {
    const at = now();
    const inputGoals = Array.isArray(reservations.goals) ? reservations.goals : [];
    const freshGoals = [];
    for (const goal of inputGoals) {
      if (!goal) continue;
      const evidenceAt = finite(goal.lastSeenAt);
      if (evidenceAt == null || evidenceAt > at + 5000 || at - evidenceAt > maxEvidenceAgeMs) {
        stats.staleGearGoalBlocks += 1;
        continue;
      }
      const key = goalKey(goal);
      const signature = goalSignature(goal);
      const claim = key && claims.get(key);
      if (claim && claim.signature === signature) {
        stats.duplicateGearDeliveryBlocks += 1;
        continue;
      }
      freshGoals.push(goal);
    }

    const beforeTransfers = finite(economy.stats && economy.stats.gearTransfers, 0);
    const result = await base({ ...reservations, goals: freshGoals });
    const afterTransfers = finite(economy.stats && economy.stats.gearTransfers, 0);
    if (afterTransfers > beforeTransfers && economy.lastAction && economy.lastAction.kind === 'GEAR_TRANSFER') {
      const action = economy.lastAction;
      const delivered = freshGoals.find((goal) => goal && goal.character === action.target && goal.item === action.item && finite(goal.observedLevel, 0) === finite(action.level, 0));
      if (delivered) {
        const key = goalKey(delivered);
        if (key) claims.set(key, { signature: goalSignature(delivered), sentAt: at, evidenceAt: finite(delivered.lastSeenAt) });
        stats.guardedGearDeliveries += 1;
      }
    }
    return result;
  };

  economy.__alpha2020GearDeliveryGuardInstalled = true;
  economy.__alpha2020GearDeliveryClaims = claims;
  economy.__alpha2020GearEvidenceMaxAgeMs = maxEvidenceAgeMs;
  return true;
}

class Alpha2020LiveRegressionHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.installedAt = this.now();
    this.stats = {
      staleEncounterClears: 0,
      staleGearGoalBlocks: 0,
      duplicateGearDeliveryBlocks: 0,
      guardedGearDeliveries: 0
    };
    this.staleEncounterCleanupInstalled = installStaleEncounterCleanup(runtime, this.stats);
    this.gearDeliveryGuardInstalled = installMerchantGearDeliveryGuard(runtime, this.stats, options);
  }

  status() {
    const economy = this.runtime && this.runtime.merchantEconomyAutonomy;
    return {
      schemaVersion: 1,
      mode: LIVE_REGRESSION_MODE,
      installedAt: this.installedAt,
      staleEncounterCleanupInstalled: this.staleEncounterCleanupInstalled,
      gearDeliveryGuardInstalled: this.gearDeliveryGuardInstalled,
      gearEvidenceMaxAgeMs: economy && economy.__alpha2020GearEvidenceMaxAgeMs || null,
      pendingGearDeliveryClaims: economy && economy.__alpha2020GearDeliveryClaims instanceof Map ? economy.__alpha2020GearDeliveryClaims.size : 0,
      stats: { ...this.stats },
      policies: {
        deadOrMissingTargetsClearBeforeCohesionGate: true,
        staleGearGoalsNeverExecute: true,
        identicalGearGoalDeliveredAtMostOncePerRuntime: true
      }
    };
  }
}

function installAlpha2020LiveRegressionHotfix(runtime, options = {}) {
  if (runtime.alpha2020LiveRegressionHotfix) return runtime.alpha2020LiveRegressionHotfix;
  const hotfix = new Alpha2020LiveRegressionHotfix(runtime, options);
  runtime.alpha2020LiveRegressionHotfix = hotfix;
  return hotfix;
}

module.exports = {
  LIVE_REGRESSION_MODE,
  Alpha2020LiveRegressionHotfix,
  installAlpha2020LiveRegressionHotfix,
  installStaleEncounterCleanup,
  installMerchantGearDeliveryGuard,
  goalKey,
  goalSignature,
  targetGone
};
