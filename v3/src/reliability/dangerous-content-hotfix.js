'use strict';

const { BUILT_IN_DANGEROUS_MONSTERS } = require('../farmer/content-safety');
const { installAlpha2020Alpha22Autonomy } = require('./alpha20-20-alpha22-autonomy');
const { installAlpha2020LiveRegressionHotfix } = require('./alpha20-20-live-regression-hotfix');
const { installAlpha23CombatStabilityHotfix } = require('./alpha23-combat-stability-hotfix');
const { installEconomyEquipmentAutonomyV2 } = require('./economy-equipment-autonomy-v2');
const { installAlpha24AdaptiveRangeRiskLogisticsHotfix } = require('./alpha24-adaptive-range-risk-logistics-hotfix');
const { installAlpha25ControlCenterBrain } = require('./alpha25-control-center-brain');

const DANGEROUS = new Set(BUILT_IN_DANGEROUS_MONSTERS);

class DangerousContentHotfix {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.filteredCandidates = 0;
    this.revalidated = false;
    this.autonomyInstalled = false;
    this.autonomyInstallError = null;
    this._installPlannerFilter();
  }

  _installPlannerFilter() {
    const planner = this.runtime.localFarming && this.runtime.localFarming.planner;
    if (!planner || typeof planner.spawnCandidates !== 'function' || planner.__dangerousContentFilterInstalled) return false;
    planner.__dangerousContentFilterInstalled = true;
    const original = planner.spawnCandidates.bind(planner);
    planner.spawnCandidates = (...args) => {
      const rows = original(...args);
      const safe = rows.filter((row) => !DANGEROUS.has(String(row && row.monster || '')));
      this.filteredCandidates += rows.length - safe.length;
      return safe;
    };
    return true;
  }

  _installClosedLoopAutonomy() {
    if (!this.runtime.controlledPartyLogistics || !this.runtime.teamCombatCohesionHotfix || !this.runtime.partyAccountCommunication) return false;
    try {
      if (!this.runtime.alpha2020Alpha22Autonomy) installAlpha2020Alpha22Autonomy(this.runtime);
      if (!this.runtime.alpha2020LiveRegressionHotfix) installAlpha2020LiveRegressionHotfix(this.runtime);
      if (!this.runtime.alpha23CombatStabilityHotfix) installAlpha23CombatStabilityHotfix(this.runtime);
      if (!this.runtime.economyEquipmentAutonomyV2) installEconomyEquipmentAutonomyV2(this.runtime);
      if (!this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix) installAlpha24AdaptiveRangeRiskLogisticsHotfix(this.runtime);
      if (!this.runtime.alpha25ControlCenterBrain) installAlpha25ControlCenterBrain(this.runtime);
      const newlyInstalled = !this.autonomyInstalled;
      this.autonomyInstalled = true;
      this.autonomyInstallError = null;
      return newlyInstalled;
    } catch (error) {
      this.autonomyInstallError = String(error && error.message || error).slice(0, 240);
      return false;
    }
  }

  beforeTick() {
    this._installClosedLoopAutonomy();
    if (this.runtime.alpha25ControlCenterBrain && typeof this.runtime.alpha25ControlCenterBrain.beforeTick === 'function') {
      try { this.runtime.alpha25ControlCenterBrain.beforeTick(); } catch (error) {
        this.autonomyInstallError = `Alpha25 tick: ${String(error && error.message || error).slice(0, 200)}`;
      }
    }
    if (this.revalidated) return false;
    const gate = this.runtime.contentSafety;
    const world = this.runtime.world;
    if (!gate || typeof gate.evaluate !== 'function' || !world) return false;
    for (const mtype of DANGEROUS) gate.evaluate({ mtype }, world);
    this.revalidated = true;
    return true;
  }

  status() {
    return {
      schemaVersion: 6,
      mode: 'dangerous-content-hotfix-v6',
      blockedMonsterTypes: [...DANGEROUS].sort(),
      worldPolicyRevalidated: this.revalidated,
      filteredCandidates: this.filteredCandidates,
      closedLoopAutonomy: {
        installed: this.autonomyInstalled,
        installError: this.autonomyInstallError,
        status: this.runtime.alpha2020Alpha22Autonomy && typeof this.runtime.alpha2020Alpha22Autonomy.status === 'function' ? this.runtime.alpha2020Alpha22Autonomy.status() : null,
        liveRegression: this.runtime.alpha2020LiveRegressionHotfix && typeof this.runtime.alpha2020LiveRegressionHotfix.status === 'function' ? this.runtime.alpha2020LiveRegressionHotfix.status() : null,
        combatStability: this.runtime.alpha23CombatStabilityHotfix && typeof this.runtime.alpha23CombatStabilityHotfix.status === 'function' ? this.runtime.alpha23CombatStabilityHotfix.status() : null,
        economyV2: this.runtime.economyEquipmentAutonomyV2 && typeof this.runtime.economyEquipmentAutonomyV2.status === 'function' ? this.runtime.economyEquipmentAutonomyV2.status() : null,
        adaptiveStability: this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix && typeof this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix.status === 'function' ? this.runtime.alpha24AdaptiveRangeRiskLogisticsHotfix.status() : null,
        controlCenterBrain: this.runtime.alpha25ControlCenterBrain && typeof this.runtime.alpha25ControlCenterBrain.status === 'function' ? this.runtime.alpha25ControlCenterBrain.status() : null
      }
    };
  }
}

function installDangerousContentHotfix(runtime) { return new DangerousContentHotfix(runtime); }
module.exports = { DangerousContentHotfix, installDangerousContentHotfix };
