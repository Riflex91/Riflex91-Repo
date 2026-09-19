'use strict';

const { Alpha9Runtime } = require('./alpha9-runtime');
const { ShadowStrategicBrain } = require('../brain/shadow-brain');

function composeAlpha10Runtime(options = {}) {
this.brain = options.brain || new ShadowStrategicBrain({
      now: this.now,
      log: this.log,
      replayCapacity: options.brainReplayCapacity,
      learningRate: options.brainLearningRate,
      maxAbsWeight: options.brainMaxAbsWeight,
      qualityWindow: options.brainQualityWindow,
      minQualitySamples: options.brainMinQualitySamples,
      healthyAgreement: options.brainHealthyAgreement,
      watchAgreement: options.brainWatchAgreement,
      maxDeathsPerHour: options.brainMaxDeathsPerHour,
      maxTravelSeconds: options.brainMaxTravelSeconds
    });
    this.brainAuditMs = Math.max(1000, Math.min(60000, Number(options.brainAuditMs) || 5000));
    this.lastBrainAudit = -Infinity;
}

class Alpha10Runtime extends Alpha9Runtime {
  constructor(options = {}) {
    super(options);
    composeAlpha10Runtime.call(this, options);
  }

  _brainAudit() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return null;
    const party = typeof this._farmPlanningParty === 'function' ? this._farmPlanningParty(snapshot) : this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const candidates = this.localFarmPlanner.spawnCandidates(snapshot, gameData, this.world, party);
    const teacherRanking = candidates.length
      ? this.planner.rank(candidates, {
          character: snapshot.character.name || null,
          partyFingerprint: party.fingerprint || null
        })
      : [];
    const localStatus = this.localFarming && typeof this.localFarming.status === 'function'
      ? this.localFarming.status()
      : null;
    return this.brain.observe({
      snapshot,
      party,
      candidates,
      teacherRanking,
      currentPlan: localStatus && localStatus.currentPlan || null
    });
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastBrainAudit < this.brainAuditMs) return;
    this.lastBrainAudit = now;
    this._brainAudit();
  }

  status() {
    return {
      ...super.status(),
      brain: this.brain.status()
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.brain = {
      status: this.brain.status(),
      replay: this.brain.replay(32)
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha10Runtime, composeAlpha10Runtime };
