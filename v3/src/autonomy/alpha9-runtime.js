'use strict';

const { StabilityRuntime } = require('../stability/stability-runtime');
const { LocalFarmPlanner } = require('./local-farm-planner');
const { LocalFarmOrchestrator } = require('./local-farm-orchestrator');

function composeAlpha9Runtime(options = {}) {
this.localFarmPlanner = options.localFarmPlanner || new LocalFarmPlanner({
      log: this.log,
      minExpectedImprovement: options.localFarmMinExpectedImprovement,
      maxCandidates: options.localFarmMaxCandidates,
      aoeClusterRadius: options.localFarmAoeClusterRadius,
      aoePreferredBonus: options.localFarmAoePreferredBonus,
      aoeSmartBonus: options.localFarmAoeSmartBonus
    });
    this.localFarming = options.localFarming || new LocalFarmOrchestrator({
      now: this.now,
      log: this.log,
      planner: this.localFarmPlanner,
      enabled: options.localFarmingEnabled !== false,
      minHoldMs: options.localFarmMinHoldMs,
      planLeaseMs: options.localFarmPlanLeaseMs,
      noProgressMs: options.localFarmNoProgressMs,
      replanCooldownMs: options.localFarmReplanCooldownMs,
      arrivalRadius: options.localFarmArrivalRadius,
      stepSeconds: options.localFarmStepSeconds,
      minStep: options.localFarmMinStep,
      maxStep: options.localFarmMaxStep,
      moveCooldownMs: options.localFarmMoveCooldownMs,
      maxPlanFailures: options.localFarmMaxPlanFailures,
      engageHpRatio: options.localFarmEngageHpRatio
    });
}

class Alpha9Runtime extends StabilityRuntime {
  constructor(options = {}) {
    super(options);
    composeAlpha9Runtime.call(this, options);
  }

  _farmPlanningParty(snapshot) {
    const party = this._partyProfile(snapshot);
    let capabilities = null;
    try {
      capabilities = this.partyCapabilityResolver && typeof this.partyCapabilityResolver.status === 'function'
        ? this.partyCapabilityResolver.status()
        : null;
    } catch (_) { capabilities = null; }
    let combatMode = 'smart_auto';
    try {
      combatMode = this.characterCombatProfiles && typeof this.characterCombatProfiles.getCombatMode === 'function'
        ? this.characterCombatProfiles.getCombatMode(snapshot && snapshot.character && snapshot.character.name)
        : combatMode;
    } catch (_) {}
    let aoe = { combatMode, configured: false, hardCapacity: 1, desiredPullSize: 1, skills: [] };
    try {
      const smart = this.tacticalPartyCombat && this.tacticalPartyCombat.smartAoePlanner;
      if (smart && typeof smart.planningProfile === 'function') aoe = smart.planningProfile(combatMode, capabilities);
    } catch (_) {}
    return { ...party, aoe };
  }

  tick() {
    super.tick();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return;
    const party = this._farmPlanningParty(snapshot);
    const gameData = this.adapter.getGameData() || {};
    this.localFarming.tick({
      runtime: this,
      snapshot,
      world: this.world,
      party,
      gameData
    });
  }

  status() {
    return {
      ...super.status(),
      localFarming: this.localFarming.status()
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.localFarming = this.localFarming.status();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha9Runtime, composeAlpha9Runtime };
