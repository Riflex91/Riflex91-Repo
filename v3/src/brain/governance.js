'use strict';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }
function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function std(values) { if (!values.length) return 0; const m = mean(values); return Math.sqrt(mean(values.map((v) => Math.pow(v - m, 2)))); }

class BrainQualityMonitor {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.windowSize = Math.max(12, Math.min(200, Number(options.windowSize) || 24));
    this.minOutcomes = Math.max(6, Math.min(this.windowSize, Number(options.minOutcomes) || 12));
    this.overconfidenceThreshold = Math.max(0.5, Math.min(0.99, Number(options.overconfidenceThreshold) || 0.88));
    this.rewardDropThreshold = Math.max(0.05, Math.min(0.5, Number(options.rewardDropThreshold) || 0.15));
    this.quarantineMs = Math.max(60000, Math.min(24 * 60 * 60 * 1000, Number(options.quarantineMs) || 20 * 60 * 1000));
    this.outcomes = [];
    this.state = 'warming';
    this.score = 50;
    this.quarantineUntil = 0;
    this.lastEvaluation = null;
    this.healthyChampion = null;
  }

  record(outcome = {}) {
    const row = {
      at: finite(outcome.at, this.now()),
      reward: Math.max(-1, Math.min(1, finite(outcome.reward))),
      confidence: clamp01(outcome.confidence),
      loss: Math.max(0, finite(outcome.loss)),
      safetyIncident: outcome.safetyIncident === true,
      death: outcome.death === true,
      partyRegression: outcome.partyRegression === true
    };
    this.outcomes.push(row);
    if (this.outcomes.length > this.windowSize) this.outcomes.splice(0, this.outcomes.length - this.windowSize);
    if (row.safetyIncident) this.quarantineUntil = Math.max(this.quarantineUntil, this.now() + this.quarantineMs);
    return this.evaluate();
  }

  evaluate() {
    const now = this.now();
    const rows = this.outcomes;
    if (now < this.quarantineUntil) {
      this.state = 'quarantine';
      this.score = 0;
    } else if (rows.length < this.minOutcomes) {
      this.state = 'warming';
      this.score = Math.round(40 + 20 * rows.length / this.minOutcomes);
    } else {
      const half = Math.max(1, Math.floor(rows.length / 2));
      const older = rows.slice(0, half);
      const recent = rows.slice(half);
      const olderReward = mean(older.map((row) => row.reward));
      const recentReward = mean(recent.map((row) => row.reward));
      const rewardDrop = olderReward - recentReward;
      const highConfidenceNegative = recent.filter((row) => row.confidence >= this.overconfidenceThreshold && row.reward < 0).length / Math.max(1, recent.length);
      const volatility = std(recent.map((row) => row.reward));
      const safetyIncidents = recent.filter((row) => row.safetyIncident || row.death || row.partyRegression).length;
      const avgLoss = mean(recent.map((row) => row.loss));
      let penalty = 0;
      penalty += Math.max(0, rewardDrop) * 140;
      penalty += highConfidenceNegative * 45;
      penalty += Math.min(1, volatility) * 20;
      penalty += Math.min(3, safetyIncidents) * 18;
      penalty += Math.min(2, avgLoss) * 8;
      this.score = Math.max(0, Math.min(100, Math.round(92 - penalty)));
      if (safetyIncidents > 0 || rewardDrop >= this.rewardDropThreshold * 1.5 || highConfidenceNegative >= 0.5) this.state = 'degraded';
      else if (rewardDrop >= this.rewardDropThreshold * 0.5 || highConfidenceNegative >= 0.25 || volatility >= 0.7) this.state = 'watch';
      else this.state = 'healthy';
      this.lastEvaluation = { at: now, olderReward, recentReward, rewardDrop, highConfidenceNegative, volatility, safetyIncidents, avgLoss };
    }
    return this.status();
  }

  autonomyAllowed() { return this.state === 'healthy'; }
  challengerAllowed() { return this.state === 'healthy'; }
  learningRateFactor() {
    if (this.state === 'watch') return 0.75;
    if (this.state === 'degraded') return 0.42;
    if (this.state === 'quarantine') return 0.18;
    return 1;
  }
  confidenceAdjustment() {
    if (this.state === 'watch') return 0.05;
    if (this.state === 'degraded' || this.state === 'quarantine') return 1;
    return 0;
  }
  setHealthyChampion(snapshot) { this.healthyChampion = snapshot || null; }

  export() {
    return {
      schemaVersion: 1,
      state: this.state,
      score: this.score,
      quarantineUntil: this.quarantineUntil,
      outcomes: this.outcomes.slice(),
      lastEvaluation: this.lastEvaluation,
      healthyChampion: this.healthyChampion
    };
  }

  restore(data) {
    if (!data || data.schemaVersion !== 1) throw new Error('invalid quality state');
    this.outcomes = Array.isArray(data.outcomes) ? data.outcomes.slice(-this.windowSize) : [];
    this.quarantineUntil = Math.max(0, finite(data.quarantineUntil));
    this.healthyChampion = data.healthyChampion || null;
    this.evaluate();
    return this;
  }

  status() {
    return {
      state: this.state,
      score: this.score,
      outcomeCount: this.outcomes.length,
      windowSize: this.windowSize,
      minOutcomes: this.minOutcomes,
      overconfidenceThreshold: this.overconfidenceThreshold,
      rewardDropThreshold: this.rewardDropThreshold,
      quarantineUntil: this.quarantineUntil || null,
      quarantineRemainingMs: Math.max(0, this.quarantineUntil - this.now()),
      autonomyAllowed: this.autonomyAllowed(),
      challengerAllowed: this.challengerAllowed(),
      learningRateFactor: this.learningRateFactor(),
      confidenceAdjustment: this.confidenceAdjustment(),
      lastEvaluation: this.lastEvaluation,
      healthyChampionAvailable: !!this.healthyChampion
    };
  }
}

class BrainLeague {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.minSamples = Math.max(20, Number(options.minSamples) || 80);
    this.minUpdates = Math.max(20, Number(options.minUpdates) || 120);
    this.minTeacherAgreement = Math.max(0.4, Math.min(1, Number(options.minTeacherAgreement) || 0.6));
    this.minOutcomes = Math.max(4, Number(options.minOutcomes) || 12);
    this.challengerTraffic = Math.max(0.01, Math.min(0.5, Number(options.challengerTraffic) || 0.2));
    this.challengeMinOutcomes = Math.max(4, Number(options.challengeMinOutcomes) || 8);
    this.probationMinOutcomes = Math.max(4, Number(options.probationMinOutcomes) || 12);
    this.rollbackRewardDrop = Math.max(0.05, Math.min(0.5, Number(options.rollbackRewardDrop) || 0.12));
    this.validationImprovement = Math.max(0.001, Math.min(0.5, Number(options.validationImprovement) || 0.03));
    this.state = 'shadow';
    this.champion = null;
    this.challenger = null;
    this.rollback = null;
    this.challenge = null;
    this.probation = null;
    this.decisionCounter = 0;
    this.lastEvent = null;
  }

  eligible(metrics = {}) {
    return finite(metrics.samples) >= this.minSamples && finite(metrics.updates) >= this.minUpdates && finite(metrics.teacherAgreement) >= this.minTeacherAgreement && finite(metrics.outcomes) >= this.minOutcomes && Number.isFinite(Number(metrics.validationLoss));
  }

  _snapshot(model, metrics) {
    return { at: this.now(), model: model.export(), metrics: { ...metrics } };
  }

  consider(model, metrics = {}, quality = null) {
    if (!model || !this.eligible(metrics)) return { changed: false, reason: 'NOT_ELIGIBLE' };
    if (quality && quality.challengerAllowed === false) return { changed: false, reason: 'QUALITY_BLOCKED' };
    if (!this.champion) {
      this.champion = this._snapshot(model, metrics);
      this.state = 'champion';
      this.lastEvent = { at: this.now(), event: 'CHAMPION_CREATED', metrics: { ...metrics } };
      return { changed: true, reason: 'FIRST_CHAMPION' };
    }
    if (this.challenger || this.probation) return { changed: false, reason: 'LEAGUE_BUSY' };
    const championLoss = finite(this.champion.metrics && this.champion.metrics.validationLoss, Infinity);
    const challengerLoss = finite(metrics.validationLoss, Infinity);
    if (!Number.isFinite(championLoss) || !(challengerLoss <= championLoss * (1 - this.validationImprovement))) return { changed: false, reason: 'NO_VALIDATION_IMPROVEMENT' };
    this.challenger = this._snapshot(model, metrics);
    this.challenge = { startedAt: this.now(), challengerRewards: [], championRewards: [], safetyIncidents: 0 };
    this.state = 'challenge';
    this.lastEvent = { at: this.now(), event: 'CHALLENGE_STARTED', championLoss, challengerLoss };
    return { changed: true, reason: 'CHALLENGE_STARTED' };
  }

  choosePolicy() {
    this.decisionCounter += 1;
    if (!this.challenger || this.state !== 'challenge') return 'champion';
    const bucket = (this.decisionCounter % 100) / 100;
    return bucket < this.challengerTraffic ? 'challenger' : 'champion';
  }

  modelFor(policy) {
    if (policy === 'challenger' && this.challenger) return this.challenger.model;
    if (this.champion) return this.champion.model;
    return null;
  }

  recordOutcome(policy, reward, options = {}) {
    const value = Math.max(-1, Math.min(1, finite(reward)));
    const safetyIncident = options.safetyIncident === true;
    if (this.state === 'challenge' && this.challenge) {
      if (safetyIncident) {
        this.challenge.safetyIncidents += 1;
        return this.rejectChallenger('SAFETY_INCIDENT');
      }
      const list = policy === 'challenger' ? this.challenge.challengerRewards : this.challenge.championRewards;
      list.push(value);
      if (this.challenge.challengerRewards.length >= this.challengeMinOutcomes) {
        const challengerMean = mean(this.challenge.challengerRewards);
        const championMean = this.challenge.championRewards.length ? mean(this.challenge.championRewards) : finite(this.champion.metrics && this.champion.metrics.meanReward, 0);
        if (challengerMean + this.rollbackRewardDrop < championMean) return this.rejectChallenger('CANARY_REWARD_REGRESSION');
        this.rollback = this.champion;
        this.champion = this.challenger;
        this.challenger = null;
        this.probation = { startedAt: this.now(), baselineReward: championMean, rewards: [], safetyIncidents: 0 };
        this.challenge = null;
        this.state = 'probation';
        this.lastEvent = { at: this.now(), event: 'CHALLENGER_PROMOTED_TO_PROBATION', challengerMean, championMean };
        return { changed: true, reason: 'PROBATION_STARTED' };
      }
    } else if (this.state === 'probation' && this.probation) {
      if (safetyIncident) {
        this.probation.safetyIncidents += 1;
        return this.rollbackChampion('SAFETY_INCIDENT');
      }
      this.probation.rewards.push(value);
      const current = mean(this.probation.rewards);
      if (this.probation.rewards.length >= 3 && current < this.probation.baselineReward - this.rollbackRewardDrop) return this.rollbackChampion('PROBATION_REWARD_DROP');
      if (this.probation.rewards.length >= this.probationMinOutcomes) {
        this.rollback = null;
        this.probation = null;
        this.state = 'champion';
        this.lastEvent = { at: this.now(), event: 'CHAMPION_CONFIRMED', reward: current };
        return { changed: true, reason: 'CHAMPION_CONFIRMED' };
      }
    }
    return { changed: false, reason: 'OUTCOME_RECORDED' };
  }

  rejectChallenger(reason) {
    this.challenger = null;
    this.challenge = null;
    this.state = this.champion ? 'champion' : 'shadow';
    this.lastEvent = { at: this.now(), event: 'CHALLENGER_REJECTED', reason };
    return { changed: true, reason };
  }

  rollbackChampion(reason) {
    if (this.rollback) this.champion = this.rollback;
    this.rollback = null;
    this.challenger = null;
    this.challenge = null;
    this.probation = null;
    this.state = this.champion ? 'champion' : 'shadow';
    this.lastEvent = { at: this.now(), event: 'CHAMPION_ROLLED_BACK', reason };
    return { changed: true, reason };
  }

  export() {
    return { schemaVersion: 1, state: this.state, champion: this.champion, challenger: this.challenger, rollback: this.rollback, challenge: this.challenge, probation: this.probation, decisionCounter: this.decisionCounter, lastEvent: this.lastEvent };
  }

  restore(data) {
    if (!data || data.schemaVersion !== 1) throw new Error('invalid league state');
    this.state = ['shadow', 'champion', 'challenge', 'probation'].includes(data.state) ? data.state : 'shadow';
    this.champion = data.champion || null;
    this.challenger = data.challenger || null;
    this.rollback = data.rollback || null;
    this.challenge = data.challenge || null;
    this.probation = data.probation || null;
    this.decisionCounter = Math.max(0, finite(data.decisionCounter));
    this.lastEvent = data.lastEvent || null;
    return this;
  }

  status() {
    return {
      state: this.state,
      championAvailable: !!this.champion,
      challengerAvailable: !!this.challenger,
      rollbackAvailable: !!this.rollback,
      challenge: this.challenge ? { startedAt: this.challenge.startedAt, challengerOutcomes: this.challenge.challengerRewards.length, championOutcomes: this.challenge.championRewards.length, safetyIncidents: this.challenge.safetyIncidents } : null,
      probation: this.probation ? { startedAt: this.probation.startedAt, outcomes: this.probation.rewards.length, baselineReward: this.probation.baselineReward, safetyIncidents: this.probation.safetyIncidents } : null,
      thresholds: { minSamples: this.minSamples, minUpdates: this.minUpdates, minTeacherAgreement: this.minTeacherAgreement, minOutcomes: this.minOutcomes, challengerTraffic: this.challengerTraffic, challengeMinOutcomes: this.challengeMinOutcomes, probationMinOutcomes: this.probationMinOutcomes, rollbackRewardDrop: this.rollbackRewardDrop, validationImprovement: this.validationImprovement },
      lastEvent: this.lastEvent
    };
  }
}

const SECRET_KEY = /(token|secret|password|passwd|write[_-]?key|api[_-]?key|authorization|cookie|session)/i;
function sanitize(value, depth = 0) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 1000 ? value.slice(0, 1000) + '…' : value;
  if (depth > 4) return '[depth-limit]';
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitize(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value).slice(0, 50)) out[key] = SECRET_KEY.test(key) ? '[redacted]' : sanitize(child, depth + 1);
    return out;
  }
  return String(value);
}

class BrainDiary {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.capacity = Math.max(20, Math.min(200, Number(options.capacity) || 80));
    this.enabled = options.enabled !== false;
    this.entries = [];
    this.nextId = 1;
  }

  add(type, data = {}, severity = 'info') {
    if (!this.enabled) return null;
    const entry = { id: `brain-diary-${this.nextId++}`, at: this.now(), type: String(type || 'event'), severity, data: sanitize(data) };
    this.entries.push(entry);
    if (this.entries.length > this.capacity) this.entries.splice(0, this.entries.length - this.capacity);
    return entry;
  }

  researchSummary(options = {}) {
    const hours = Math.max(1, Math.min(168, Number(options.hours) || 24));
    const since = this.now() - hours * 60 * 60 * 1000;
    const rows = this.entries.filter((entry) => entry.at >= since);
    const byType = {};
    for (const row of rows) byType[row.type] = (byType[row.type] || 0) + 1;
    const highlights = rows.slice(-Math.max(1, Math.min(20, Number(options.maxHighlights) || 10))).map((row) => ({ id: row.id, at: row.at, type: row.type, severity: row.severity, data: row.data }));
    return { profile: options.profile || 'development', hours, entries: rows.length, byType, highlights };
  }

  export() { return { schemaVersion: 1, enabled: this.enabled, capacity: this.capacity, nextId: this.nextId, entries: this.entries.slice() }; }
  restore(data) {
    if (!data || data.schemaVersion !== 1) throw new Error('invalid brain diary');
    this.enabled = data.enabled !== false;
    this.entries = Array.isArray(data.entries) ? data.entries.slice(-this.capacity).map((entry) => sanitize(entry)) : [];
    this.nextId = Math.max(1, finite(data.nextId, this.entries.length + 1));
    return this;
  }
  status() { return { enabled: this.enabled, entries: this.entries.length, capacity: this.capacity, recent: this.entries.slice(-10) }; }
}

module.exports = { BrainQualityMonitor, BrainLeague, BrainDiary, sanitize, mean, std };
