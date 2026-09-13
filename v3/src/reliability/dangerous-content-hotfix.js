'use strict';

const { BUILT_IN_DANGEROUS_MONSTERS } = require('../farmer/content-safety');
const { installAlpha2020Alpha22Autonomy } = require('./alpha20-20-alpha22-autonomy');

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
    if (this.autonomyInstalled || this.runtime.alpha2020Alpha22Autonomy) {
      this.autonomyInstalled = true;
      return false;
    }
    if (!this.runtime.controlledPartyLogistics || !this.runtime.teamCombatCohesionHotfix || !this.runtime.partyAccountCommunication) return false;
    try {
      installAlpha2020Alpha22Autonomy(this.runtime);
      this.autonomyInstalled = true;
      this.autonomyInstallError = null;
      return true;
    } catch (error) {
      this.autonomyInstallError = String(error && error.message || error).slice(0, 240);
      return false;
    }
  }

  beforeTick() {
    this._installClosedLoopAutonomy();
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
      schemaVersion: 2,
      mode: 'dangerous-content-hotfix-v2',
      blockedMonsterTypes: [...DANGEROUS].sort(),
      worldPolicyRevalidated: this.revalidated,
      filteredCandidates: this.filteredCandidates,
      closedLoopAutonomy: {
        installed: this.autonomyInstalled,
        installError: this.autonomyInstallError,
        status: this.runtime.alpha2020Alpha22Autonomy && typeof this.runtime.alpha2020Alpha22Autonomy.status === 'function'
          ? this.runtime.alpha2020Alpha22Autonomy.status()
          : null
      }
    };
  }
}

function installDangerousContentHotfix(runtime) {
  return new DangerousContentHotfix(runtime);
}

module.exports = { DangerousContentHotfix, installDangerousContentHotfix };
