'use strict';

const { BUILT_IN_DANGEROUS_MONSTERS } = require('../farmer/content-safety');

const DANGEROUS = new Set(BUILT_IN_DANGEROUS_MONSTERS);

class DangerousContentHotfix {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.filteredCandidates = 0;
    this.revalidated = false;
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

  beforeTick() {
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
      schemaVersion: 1,
      mode: 'dangerous-content-hotfix-v1',
      blockedMonsterTypes: [...DANGEROUS].sort(),
      worldPolicyRevalidated: this.revalidated,
      filteredCandidates: this.filteredCandidates
    };
  }
}

function installDangerousContentHotfix(runtime) {
  return new DangerousContentHotfix(runtime);
}

module.exports = { DangerousContentHotfix, installDangerousContentHotfix };
