'use strict';

const ALPHA20_23_IDLE_DEADLOCK_MODE = 'alpha20.23-idle-deadlock-recovery-v2';
const NAVIGATION_RELEASE_REASONS = new Set(['TRAINING_TARGET_AUTOMATRON', 'FOREIGN_ENGAGED_SAFE_MONSTER']);

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

function addPartyNames(names, party) {
  if (!party) return;
  if (Array.isArray(party)) {
    for (const member of party) {
      const name = text(typeof member === 'string' ? member : member && member.name);
      if (name) names.add(name);
    }
    return;
  }
  if (typeof party !== 'object') return;
  for (const [key, member] of Object.entries(party)) {
    const name = text(member && member.name || key);
    if (name) names.add(name);
  }
}

function friendlyNamesOf(runtime, snapshot) {
  const names = new Set();
  const character = snapshot && snapshot.character || runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || null;
  const selfName = text(character && character.name);
  if (selfName) names.add(selfName);
  addPartyNames(names, snapshot && snapshot.party);
  const root = runtime && runtime.root;
  addPartyNames(names, root && root.party);
  if (root && root.parent && root.parent !== root) addPartyNames(names, root.parent.party);
  return names;
}

function knownMonster(gameData, entity) {
  return Boolean(entity && entity.mtype && gameData && gameData.monsters && gameData.monsters[entity.mtype]);
}

function contentAllowsNavigationRelease(runtime, entity, stats) {
  const gate = runtime && runtime.combatRisk && runtime.combatRisk.contentSafety;
  if (!gate || typeof gate.evaluate !== 'function') return true;
  try {
    const result = gate.evaluate(entity, runtime.world || gate.lastWorld || null);
    return Boolean(result && result.allowed === true);
  } catch (_) {
    stats.contentSafetyEvaluationFailures += 1;
    return false;
  }
}

function recordRelease(runtime, stats, entity, reason, safety) {
  stats.navigationDeadlocksReleased += 1;
  if (reason === 'FOREIGN_ENGAGED_SAFE_MONSTER') stats.foreignEngagedReleases += 1;
  stats.lastRelease = {
    at: runtime.now ? runtime.now() : Date.now(),
    entityId: entity.id == null ? null : String(entity.id),
    entityName: entity.name || null,
    monsterType: entity.mtype || null,
    claimedBy: entity.target || null,
    reason,
    token: safety && safety.token || null,
    source: safety && safety.source || null
  };
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
    const friendlyNames = friendlyNamesOf(runtime, snapshot);
    const selectedTargetId = farmer.targetId == null ? null : String(farmer.targetId);
    const plannedMonster = local.currentPlan && local.currentPlan.monster ? String(local.currentPlan.monster) : null;
    const gameData = gameDataOf(runtime, snapshot);

    return rows.filter((entity) => {
      if (!entity || !entity.mtype) return true;

      const claimedBy = text(entity.target);

      // Hard safety invariants always win over the deadlock release.
      if (selfName && claimedBy === selfName) return true;
      if (claimedBy && friendlyNames.has(claimedBy)) return true;
      if (selectedTargetId != null && entity.id != null && String(entity.id) === selectedTargetId) return true;

      // Preserve the existing fail-closed invariant for a neutral monster type that
      // LocalFarming explicitly plans to approach. Do this before TargetSafety so a
      // safety-evaluation failure cannot alter the protected-state accounting.
      // A foreign-engaged monster of the same type intentionally continues below so
      // it can be released from navigation blocking when all safety gates approve it.
      if (!claimedBy && plannedMonster && String(entity.mtype) === plannedMonster) return true;

      let safety;
      try {
        safety = targetSafety.evaluate(entity, gameData);
      } catch (_) {
        stats.targetSafetyEvaluationFailures += 1;
        return true;
      }

      // Preserve the existing Target Automatron release. A planned technical target
      // remains a blocker so explicit operator/test plans are never bypassed.
      if (safety && safety.allowed === false && NAVIGATION_RELEASE_REASONS.has(String(safety.reason || ''))) {
        if (plannedMonster && String(entity.mtype) === plannedMonster) return true;
        recordRelease(runtime, stats, entity, String(safety.reason), safety);
        return false;
      }

      // Everything TargetSafety rejects (dangerous fairies, custom exclusions, etc.)
      // remains fail-closed.
      if (!safety || safety.allowed !== true) return true;

      // Neutral monsters are actionable under party-only and must remain visible to
      // the farmer. Only a monster already claimed by somebody outside our party can
      // be ignored for navigation, because the farmer itself is forbidden to select it.
      if (!claimedBy || friendlyNames.has(claimedBy)) return true;

      // Do not widen safety for unknown or content-quarantined monster types.
      if (!knownMonster(gameData, entity)) return true;
      if (!contentAllowsNavigationRelease(runtime, entity, stats)) return true;

      recordRelease(runtime, stats, entity, 'FOREIGN_ENGAGED_SAFE_MONSTER', safety);
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
      foreignEngagedReleases: 0,
      targetSafetyEvaluationFailures: 0,
      contentSafetyEvaluationFailures: 0,
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
      schemaVersion: 2,
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
        partyAggroAlwaysBlocksNavigation: true,
        selectedTargetAlwaysBlocksNavigation: true,
        neutralKnownMonsterStillBlocksNavigation: true,
        foreignEngagedKnownSafeMonsterMayNotDeadlockNavigation: true,
        nonHostileTrainingAutomatronMayNotDeadlockNavigation: true,
        targetSafetyFailClosed: true,
        contentSafetyFailClosed: true
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
