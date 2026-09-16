'use strict';

const { ensurePatchRegistry } = require('../core/patch-registry');

const LIVE_NAVIGATION_HOTFIX_SCHEMA_VERSION = 1;
const LIVE_NAVIGATION_HOTFIX_MODE = 'alpha20.5-live-navigation-hotfix';

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function isLiveMonster(entity, character) {
  if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
  if (entity.map && character && character.map && entity.map !== character.map) return false;
  return true;
}

class LiveNavigationHotfix {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.installed = false;
    this.lastEvaluation = null;
    this.stats = {
      evaluations: 0,
      entitiesEvaluated: 0,
      incidentalSafeIgnored: 0,
      trainingTargetsIgnored: 0,
      plannedMonsterBlocked: 0,
      farmerTargetBlocked: 0,
      selfAggroBlocked: 0,
      unknownOrRiskBlocked: 0,
      targetSafetyBlocked: 0,
      missingSafetyBoundaryBlocked: 0
    };
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (!log || typeof log.emit !== 'function') return;
    log.emit({ component: 'live-navigation-hotfix', event, severity, reason, data });
  }

  _gameData() {
    const adapter = this.runtime && this.runtime.adapter;
    if (!adapter || typeof adapter.getGameData !== 'function') return {};
    try { return adapter.getGameData() || {}; } catch (_) { return {}; }
  }

  _party(snapshot) {
    if (!this.runtime || typeof this.runtime._partyProfile !== 'function') return null;
    try { return this.runtime._partyProfile(snapshot); } catch (_) { return null; }
  }

  _classify(entity, snapshot, gameData, party) {
    const runtime = this.runtime;
    const local = runtime.localFarming;
    const farmer = runtime.farmer;
    const character = snapshot && snapshot.character;
    const characterName = character && character.name != null ? String(character.name) : null;
    const targetId = farmer && farmer.targetId != null ? String(farmer.targetId) : null;
    const entityId = entity && entity.id != null ? String(entity.id) : null;
    const planMonster = local && local.currentPlan && local.currentPlan.monster != null
      ? String(local.currentPlan.monster)
      : null;

    if (characterName && String(entity.target || '') === characterName) {
      this.stats.selfAggroBlocked += 1;
      return { blocking: true, reason: 'SELF_AGGRO_PRESENT' };
    }
    if (targetId != null && entityId != null && entityId === targetId) {
      this.stats.farmerTargetBlocked += 1;
      return { blocking: true, reason: 'FARMER_TARGET_ACTIVE' };
    }
    if (planMonster && String(entity.mtype || '') === planMonster) {
      this.stats.plannedMonsterBlocked += 1;
      return { blocking: true, reason: 'PLANNED_MONSTER_VISIBLE' };
    }

    const targetSafety = runtime.targetSafety;
    if (!targetSafety || typeof targetSafety.evaluate !== 'function') {
      this.stats.missingSafetyBoundaryBlocked += 1;
      return { blocking: true, reason: 'TARGET_SAFETY_UNAVAILABLE' };
    }
    let targetResult;
    try {
      targetResult = targetSafety.evaluate(entity, gameData || {});
    } catch (_) {
      this.stats.missingSafetyBoundaryBlocked += 1;
      return { blocking: true, reason: 'TARGET_SAFETY_EVALUATION_FAILED' };
    }
    if (!targetResult || targetResult.allowed !== true) {
      // Adventure Land's Target Automatrons are inert training targets. They are
      // excluded from combat selection, but their mere presence must not pin a
      // Farmer in place. Self-aggro was already handled above, so this exception
      // cannot hide a hostile entity targeting the character.
      if (targetResult && targetResult.reason === 'TRAINING_TARGET_AUTOMATRON') {
        this.stats.trainingTargetsIgnored += 1;
        return { blocking: false, reason: 'TRAINING_TARGET_NON_BLOCKING' };
      }
      this.stats.targetSafetyBlocked += 1;
      return { blocking: true, reason: targetResult && targetResult.reason || 'TARGET_SAFETY_REJECTED' };
    }

    const combatRisk = runtime.combatRisk;
    if (!combatRisk || typeof combatRisk.evaluate !== 'function') {
      this.stats.missingSafetyBoundaryBlocked += 1;
      return { blocking: true, reason: 'COMBAT_RISK_UNAVAILABLE' };
    }
    let risk;
    try {
      risk = combatRisk.evaluate(entity, snapshot, runtime.world, party);
    } catch (_) {
      this.stats.missingSafetyBoundaryBlocked += 1;
      return { blocking: true, reason: 'COMBAT_RISK_EVALUATION_FAILED' };
    }
    if (!risk || risk.allowed !== true) {
      this.stats.unknownOrRiskBlocked += 1;
      return {
        blocking: true,
        reason: risk && risk.reason || 'UNKNOWN_OR_RISK_REJECTED',
        risk: risk ? { score: risk.score, threshold: risk.threshold, signals: clone(risk.signals) } : null
      };
    }

    this.stats.incidentalSafeIgnored += 1;
    return {
      blocking: false,
      reason: 'INCIDENTAL_SAFE_MONSTER',
      risk: { score: risk.score, threshold: risk.threshold, signals: clone(risk.signals) }
    };
  }

  blockers(snapshot) {
    const character = snapshot && snapshot.character;
    const monsters = (snapshot && snapshot.entities || []).filter((entity) => isLiveMonster(entity, character));
    const gameData = this._gameData();
    const party = this._party(snapshot);
    const blocking = [];
    const reasons = {};

    this.stats.evaluations += 1;
    this.stats.entitiesEvaluated += monsters.length;
    for (const entity of monsters) {
      const result = this._classify(entity, snapshot, gameData, party);
      reasons[result.reason] = (reasons[result.reason] || 0) + 1;
      if (result.blocking) blocking.push(entity);
    }

    this.lastEvaluation = {
      at: this.runtime.now ? this.runtime.now() : Date.now(),
      visibleCount: monsters.length,
      blockingCount: blocking.length,
      ignoredCount: Math.max(0, monsters.length - blocking.length),
      reasons
    };
    return blocking;
  }

  _install() {
    const local = this.runtime.localFarming;
    if (!local || typeof local._visibleMonsters !== 'function') return false;
    if (local.__liveNavigationHotfixInstalled) {
      this.installed = true;
      return true;
    }
    const registry = ensurePatchRegistry(this.runtime);
    registry.register({
      moduleId: 'reliability.live-navigation-hotfix',
      target: local,
      method: '_visibleMonsters',
      targetMethod: 'localFarming._visibleMonsters',
      kind: 'exclusive',
      order: 0,
      patch: (snapshot) => this.blockers(snapshot)
    });
    local.__liveNavigationHotfixInstalled = true;
    this.installed = true;
    this._event('LIVE_NAVIGATION_HOTFIX_INSTALLED', 'info', 'PATCH_REGISTRY_SAFETY_ARBITRATION', {
      actionAuthority: false,
      unknownFailsClosed: true,
      selfAggroFailsClosed: true,
      explicitFarmerTargetFailsClosed: true
    });
    return true;
  }

  status() {
    return {
      schemaVersion: LIVE_NAVIGATION_HOTFIX_SCHEMA_VERSION,
      mode: LIVE_NAVIGATION_HOTFIX_MODE,
      installed: this.installed,
      actionAuthority: false,
      directGameplayAccess: false,
      usesExistingTargetSafety: true,
      usesExistingCombatRisk: true,
      unknownContentBlocks: true,
      selfAggroBlocks: true,
      explicitFarmerTargetBlocks: true,
      plannedMonsterBlocks: true,
      trainingTargetPresenceBlocks: false,
      lastEvaluation: clone(this.lastEvaluation),
      stats: { ...this.stats }
    };
  }
}

function installLiveNavigationHotfix(runtime) {
  if (runtime.liveNavigationHotfix instanceof LiveNavigationHotfix) return runtime.liveNavigationHotfix;
  const policy = new LiveNavigationHotfix(runtime);
  runtime.liveNavigationHotfix = policy;
  return policy;
}

module.exports = {
  LiveNavigationHotfix,
  installLiveNavigationHotfix,
  LIVE_NAVIGATION_HOTFIX_SCHEMA_VERSION,
  LIVE_NAVIGATION_HOTFIX_MODE
};
