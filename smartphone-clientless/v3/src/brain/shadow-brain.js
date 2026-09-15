'use strict';

const { FEATURE_NAMES, StrategicFeatureEncoder } = require('./feature-encoder');
const { BoundedReplayBuffer } = require('./replay-buffer');

const BrainQualityState = Object.freeze({
  WARMUP: 'WARMUP',
  HEALTHY: 'HEALTHY',
  WATCH: 'WATCH',
  QUARANTINED: 'QUARANTINED'
});

const DEFAULT_WEIGHTS = Object.freeze({
  xpRate: 0.55,
  goldRate: 0.22,
  survival: 0.35,
  confidence: 0.18,
  travelEfficiency: 0.12,
  measuredEvidence: 0.08,
  hpReserve: 0.03,
  mpReserve: 0.02,
  currentPlanAffinity: 0.06
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bounded(value, limit) {
  return Math.max(-limit, Math.min(limit, finite(value, 0)));
}

class ShadowStrategicBrain {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.encoder = options.encoder || new StrategicFeatureEncoder(options);
    this.replayBuffer = options.replayBuffer || new BoundedReplayBuffer({ capacity: options.replayCapacity });
    this.learningRate = Math.max(0.001, Math.min(0.1, finite(options.learningRate, 0.02)));
    this.maxAbsWeight = Math.max(0.25, Math.min(5, finite(options.maxAbsWeight, 2)));
    this.qualityWindow = Math.max(8, Math.min(256, Number(options.qualityWindow) || 64));
    this.minQualitySamples = Math.max(4, Math.min(this.qualityWindow, Number(options.minQualitySamples) || 16));
    this.healthyAgreement = Math.max(0.5, Math.min(0.95, finite(options.healthyAgreement, 0.7)));
    this.watchAgreement = Math.max(0.1, Math.min(this.healthyAgreement, finite(options.watchAgreement, 0.4)));
    this.weights = {};
    const supplied = options.initialWeights || {};
    for (const name of FEATURE_NAMES) {
      const initial = supplied[name] == null ? DEFAULT_WEIGHTS[name] : supplied[name];
      this.weights[name] = bounded(initial, this.maxAbsWeight);
    }
    this.qualityHistory = [];
    this.qualityState = BrainQualityState.WARMUP;
    this.lastRecommendation = null;
    this.lastQualityTransition = null;
    this.stats = {
      evaluations: 0,
      noCandidates: 0,
      teacherSamples: 0,
      agreements: 0,
      distillations: 0,
      qualityTransitions: 0
    };
  }

  _score(row) {
    let score = 0;
    for (const name of FEATURE_NAMES) score += finite(row.features[name], 0) * finite(this.weights[name], 0);
    return finite(score, 0);
  }

  _quality() {
    const samples = this.qualityHistory.length;
    const agreements = this.qualityHistory.reduce((sum, value) => sum + (value ? 1 : 0), 0);
    return {
      state: this.qualityState,
      samples,
      agreements,
      agreementRate: samples ? agreements / samples : null,
      window: this.qualityWindow,
      minSamples: this.minQualitySamples,
      healthyAgreement: this.healthyAgreement,
      watchAgreement: this.watchAgreement
    };
  }

  _updateQuality(agreement) {
    this.qualityHistory.push(!!agreement);
    while (this.qualityHistory.length > this.qualityWindow) this.qualityHistory.shift();
    const before = this.qualityState;
    const quality = this._quality();
    if (quality.samples < this.minQualitySamples) this.qualityState = BrainQualityState.WARMUP;
    else if (quality.agreementRate >= this.healthyAgreement) this.qualityState = BrainQualityState.HEALTHY;
    else if (quality.agreementRate >= this.watchAgreement) this.qualityState = BrainQualityState.WATCH;
    else this.qualityState = BrainQualityState.QUARANTINED;
    if (before !== this.qualityState) {
      this.stats.qualityTransitions += 1;
      this.lastQualityTransition = { at: this.now(), from: before, to: this.qualityState, agreementRate: this._quality().agreementRate };
      if (this.log) this.log.emit({ component: 'brain', event: 'BRAIN_QUALITY_CHANGED', severity: this.qualityState === BrainQualityState.QUARANTINED ? 'warn' : 'info', data: this.lastQualityTransition });
    }
  }

  _distill(studentRow, teacherRow) {
    if (!studentRow || !teacherRow || studentRow.id === teacherRow.id) return false;
    for (const name of FEATURE_NAMES) {
      const delta = finite(teacherRow.features[name], 0) - finite(studentRow.features[name], 0);
      this.weights[name] = bounded(this.weights[name] + this.learningRate * delta, this.maxAbsWeight);
    }
    this.stats.distillations += 1;
    return true;
  }

  observe(context = {}) {
    this.stats.evaluations += 1;
    const encoded = this.encoder.encodeCandidates(context);
    if (!encoded.length) {
      this.stats.noCandidates += 1;
      this.lastRecommendation = {
        at: this.now(),
        mode: 'shadow',
        actionAuthority: false,
        reason: 'NO_ELIGIBLE_CANDIDATES',
        candidateCount: 0,
        recommendation: null,
        teacher: null,
        agreement: null
      };
      return this.lastRecommendation;
    }

    const ranked = encoded.map((row) => ({ ...row, score: this._score(row) }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
    const student = ranked[0];
    const teacherTop = Array.isArray(context.teacherRanking) && context.teacherRanking[0] || null;
    const teacherId = teacherTop && teacherTop.id != null ? String(teacherTop.id) : null;
    const teacherRow = teacherId ? encoded.find((row) => row.id === teacherId) || null : null;
    const agreement = teacherRow ? student.id === teacherRow.id : null;

    if (teacherRow) {
      this.stats.teacherSamples += 1;
      if (agreement) this.stats.agreements += 1;
      this._updateQuality(agreement);
      if (!agreement) this._distill(student, teacherRow);
    }

    const record = {
      at: this.now(),
      mode: 'shadow',
      actionAuthority: false,
      featureSchemaVersion: this.encoder.status().schemaVersion,
      candidateCount: ranked.length,
      recommendation: { id: student.id, monster: student.monster, map: student.map, score: Number(student.score.toFixed(6)) },
      teacher: teacherRow ? { id: teacherRow.id, monster: teacherRow.monster, map: teacherRow.map } : null,
      agreement,
      quality: this._quality(),
      top: ranked.slice(0, 5).map((row) => ({ id: row.id, monster: row.monster, score: Number(row.score.toFixed(6)) }))
    };
    this.replayBuffer.push(record);
    this.lastRecommendation = record;
    if (this.log) this.log.emit({
      component: 'brain',
      event: 'BRAIN_SHADOW_RECOMMENDATION',
      data: {
        candidateCount: record.candidateCount,
        recommendation: record.recommendation,
        teacher: record.teacher,
        agreement: record.agreement,
        qualityState: record.quality.state
      }
    });
    return record;
  }

  replay(limit = 32) {
    return this.replayBuffer.list(limit);
  }

  status() {
    return {
      mode: 'shadow',
      actionAuthority: false,
      directActionAccess: false,
      executorBypassAllowed: false,
      learning: 'bounded-teacher-distillation',
      encoder: this.encoder.status(),
      replay: this.replayBuffer.status(),
      quality: this._quality(),
      learningRate: this.learningRate,
      maxAbsWeight: this.maxAbsWeight,
      weights: { ...this.weights },
      stats: { ...this.stats },
      lastRecommendation: this.lastRecommendation,
      lastQualityTransition: this.lastQualityTransition
    };
  }
}

module.exports = {
  ShadowStrategicBrain,
  BrainQualityState,
  DEFAULT_WEIGHTS
};
