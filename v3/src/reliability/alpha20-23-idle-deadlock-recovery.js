'use strict';

const ALPHA20_23_IDLE_DEADLOCK_MODE = 'alpha20.23-idle-deadlock-recovery-v1';
const NAVIGATION_RELEASE_REASONS = new Set(['TRAINING_TARGET_AUTOMATRON']);

function text(value) {
  return String(value == null ? '' : value).trim();
}

function gameDataOf(runtime, snapshot) {
  if (snapshot && snapshot.gameData && typeof snapshot.gameData === 'object') return snapshot.gameData;
  const root = runtime && runtime.root;
  if (root && root.G && typeof root.G === 'object') return root.G;
  if (root && root.parent && root.parent.G && typeof root.parent.G === 'object') return root.parent.G;
  return {};
}

function installNeverTargetNavigationRelease(runtime, stats) {
  const local = runtime && runtime.localFarming;
  const farmer = runtime && runtime.farmer;
  const targetSafety = runtime && runtime.targetSafety;
  if (!local || !farmer || !targetSafety || typeof local._visibleMonsters !== 'function' || typeof targetSafety.evaluate !== 'function') return false;
  if (local.__alpha2023NeverTargetNavigationReleaseInstalled) return true;

  const baseVisible = local._visibleMonsters.bind(local);
  local._visibleMonsters = (snapshot) => {
    const rows = baseVisible(snapshot);
    if (!Array.isArray(rows) || !rows.length) return rows;

    const character = snapshot && snapshot.character || runtime.lastSnapshot && runtime.lastSnapshot.character || null;
    const selfName = text(character && character.name);
    const selectedTargetId = farmer.targetId == null ? null : String(farmer.targetId);
    const plannedMonster = local.currentPlan && local.currentPlan.monster ? String(local.currentPlan.monster) : null;
    const gameData = gameDataOf(runtime, snapshot);

    return rows.filter((entity) => {
      if (!entity || !entity.mtype) return true;

      // Hard safety invariants always win over the deadlock release.
      if (selfName && text(entity.target) === selfName) return true;
      if (selectedTargetId != null && entity.id != null && String(entity.id) === selectedTargetId) return true;
      if (plannedMonster && String(entity.mtype) === plannedMonster) return true;

      let safety;
      try {
        safety = targetSafety.evaluate(entity, gameData);
      } catch (_) {
        stats.targetSafetyEvaluationFailures += 1;
        return true;
      }

      if (!safety || safety.allowed !== false || !NAVIGATION_RELEASE_REASONS.has(String(safety.reason || ''))) return true;

      stats.navigationDeadlocksReleased += 1;
      stats.lastRelease = {
        at: runtime.now ? runtime.now() : Date.now(),
        entityId: entity.id == null ? null : String(entity.id),
        entityName: entity.name || null,
        monsterType: entity.mtype || null,
        reason: safety.reason || null,
        token: safety.token || null,
        source: safety.source || null
      };
      return false;
    });
  };

  local.__alpha2023NeverTargetNavigationReleaseInstalled = true;
  return true;
}

class Alpha2023IdleDeadlockRecovery {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.installedAt = this.now();
    this.stats = {
      navigationDeadlocksReleased: 0,
      targetSafetyEvaluationFailures: 0,
      lastRelease: null
    };
    this.navigationReleaseInstalled = installNeverTargetNavigationRelease(runtime, this.stats);
    if (runtime.log && typeof runtime.log.emit === 'function') {
      try {
        runtime.log.emit({
          component: 'alpha20-23-idle-deadlock-recovery',
          event: 'ALPHA20_23_IDLE_DEADLOCK_RECOVERY_INSTALLED',
          severity: 'info',
          data: this.status()
        });
      } catch (_) {}
    }
  }

  status() {
    return {
      schemaVersion: 1,
      mode: ALPHA20_23_IDLE_DEADLOCK_MODE,
      installedAt: this.installedAt,
      navigationReleaseInstalled: this.navigationReleaseInstalled,
      releasedReasons: [...NAVIGATION_RELEASE_REASONS],
      stats: { ...this.stats },
      policies: {
        unknownVisibleMonsterStillBlocksNavigation: true,
        dangerousSpecialFairyStillBlocksNavigation: true,
        customTargetExclusionStillBlocksNavigation: true,
        selfAggroAlwaysBlocksNavigation: true,
        selectedTargetAlwaysBlocksNavigation: true,
        plannedMonsterAlwaysBlocksNavigation: true,
        nonHostileTrainingAutomatronMayNotDeadlockNavigation: true,
        targetSafetyFailClosed: true
      }
    };
  }
}

function installAlpha2023IdleDeadlockRecovery(runtime) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha2023IdleDeadlockRecovery) return runtime.alpha2023IdleDeadlockRecovery;
  const recovery = new Alpha2023IdleDeadlockRecovery(runtime);
  runtime.alpha2023IdleDeadlockRecovery = recovery;
  return recovery;
}

module.exports = {
  ALPHA20_23_IDLE_DEADLOCK_MODE,
  NAVIGATION_RELEASE_REASONS,
  installNeverTargetNavigationRelease,
  Alpha2023IdleDeadlockRecovery,
  installAlpha2023IdleDeadlockRecovery
};
