'use strict';

const {
  DEFAULT_MAX_EVASION,
  DEFAULT_MAX_AVOIDANCE,
  EVASION_SENSITIVE_CTYPES,
  evaluateTargetEfficiency
} = require('../farmer/target-efficiency');

class FarmerTargetEfficiencyHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.log = runtime.log || null;
    this.maxEvasion = Number.isFinite(Number(options.maxEvasion))
      ? Math.max(0, Number(options.maxEvasion))
      : DEFAULT_MAX_EVASION;
    this.maxAvoidance = Number.isFinite(Number(options.maxAvoidance))
      ? Math.max(0, Number(options.maxAvoidance))
      : DEFAULT_MAX_AVOIDANCE;
    this.installed = false;
    this.plannerInstalled = false;
    this.farmerInstalled = false;
    this.lastSkip = null;
    this.seenSkipSignals = new Set();
    this.stats = {
      plannerCandidatesRejected: 0,
      liveTargetsRejected: 0,
      extremeEvasionRejected: 0,
      extremeAvoidanceRejected: 0
    };
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try {
      this.log.emit({ component: 'farmer-target-efficiency', event, severity, reason, data });
    } catch (_) {
      // Diagnostics must never affect target arbitration.
    }
  }

  _gameData() {
    const adapter = this.runtime && this.runtime.adapter;
    if (!adapter || typeof adapter.getGameData !== 'function') return {};
    try { return adapter.getGameData() || {}; } catch (_) { return {}; }
  }

  _evaluate(entity, snapshot, gameData) {
    return evaluateTargetEfficiency(entity, gameData || {}, {
      character: snapshot && snapshot.character || null,
      maxEvasion: this.maxEvasion,
      maxAvoidance: this.maxAvoidance
    });
  }

  _recordSkip(source, verdict, entity = null) {
    const mtype = verdict && verdict.mtype || entity && (entity.mtype || entity.monster) || null;
    if (source === 'planner') this.stats.plannerCandidatesRejected += 1;
    else this.stats.liveTargetsRejected += 1;
    if (verdict && verdict.reason === 'EXTREME_EVASION') this.stats.extremeEvasionRejected += 1;
    if (verdict && verdict.reason === 'EXTREME_AVOIDANCE') this.stats.extremeAvoidanceRejected += 1;
    this.lastSkip = {
      at: this.runtime && typeof this.runtime.now === 'function' ? this.runtime.now() : Date.now(),
      source,
      mtype,
      reason: verdict && verdict.reason || 'TARGET_INEFFICIENT',
      evasion: verdict && verdict.evasion != null ? verdict.evasion : null,
      avoidance: verdict && verdict.avoidance != null ? verdict.avoidance : null,
      ctype: verdict && verdict.ctype || null
    };

    const signal = `${source}|${mtype || '-'}|${this.lastSkip.reason}`;
    if (!this.seenSkipSignals.has(signal)) {
      this.seenSkipSignals.add(signal);
      this._event('FARM_TARGET_EFFICIENCY_REJECTED', 'info', this.lastSkip.reason, { ...this.lastSkip });
    }
  }

  _installPlanner() {
    const planner = this.runtime && this.runtime.localFarmPlanner;
    if (!planner || typeof planner.spawnCandidates !== 'function' || planner.__targetEfficiencyHotfixInstalled) return false;
    const baseSpawnCandidates = planner.spawnCandidates.bind(planner);
    planner.spawnCandidates = (snapshot, gameData, world, party) => {
      const rows = baseSpawnCandidates(snapshot, gameData, world, party);
      if (!Array.isArray(rows)) return rows;
      return rows.filter((row) => {
        const verdict = this._evaluate({ mtype: row && row.monster }, snapshot, gameData || {});
        if (verdict.allowed) return true;
        this._recordSkip('planner', verdict, row);
        return false;
      });
    };
    planner.__targetEfficiencyHotfixInstalled = true;
    return true;
  }

  _installFarmer() {
    const farmer = this.runtime && this.runtime.farmer;
    if (!farmer || typeof farmer._safeLiveMonsters !== 'function' || farmer.__targetEfficiencyHotfixInstalled) return false;
    const baseSafeLiveMonsters = farmer._safeLiveMonsters.bind(farmer);
    farmer._safeLiveMonsters = (snapshot, party) => {
      const rows = baseSafeLiveMonsters(snapshot, party);
      if (!Array.isArray(rows)) return rows;
      const gameData = this._gameData();
      return rows.filter((entity) => {
        const verdict = this._evaluate(entity, snapshot, gameData);
        if (verdict.allowed) return true;
        this._recordSkip('live', verdict, entity);
        return false;
      });
    };
    farmer.__targetEfficiencyHotfixInstalled = true;
    return true;
  }

  install() {
    this.plannerInstalled = this._installPlanner() || this.plannerInstalled;
    this.farmerInstalled = this._installFarmer() || this.farmerInstalled;
    this.installed = this.plannerInstalled || this.farmerInstalled;
    this._event('FARM_TARGET_EFFICIENCY_HOTFIX_INSTALLED', 'info', null, {
      plannerInstalled: this.plannerInstalled,
      farmerInstalled: this.farmerInstalled,
      maxEvasion: this.maxEvasion,
      maxAvoidance: this.maxAvoidance
    });
    return this.installed;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'farmer-target-efficiency-v1',
      installed: this.installed,
      plannerInstalled: this.plannerInstalled,
      farmerInstalled: this.farmerInstalled,
      maxEvasion: this.maxEvasion,
      maxAvoidance: this.maxAvoidance,
      evasionSensitiveCtypes: [...EVASION_SENSITIVE_CTYPES],
      lastSkip: this.lastSkip ? { ...this.lastSkip } : null,
      stats: { ...this.stats }
    };
  }
}

function installFarmerTargetEfficiencyHotfix(runtime, options = {}) {
  return new FarmerTargetEfficiencyHotfix(runtime, options);
}

module.exports = {
  FarmerTargetEfficiencyHotfix,
  installFarmerTargetEfficiencyHotfix
};
