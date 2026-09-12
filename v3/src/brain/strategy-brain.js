'use strict';

const { ACTIONS, StrategicFeatureEncoder, StudentNetwork, PrioritizedReplayBuffer, clamp01, normalizeTarget } = require('./model');
const { BrainQualityMonitor, BrainLeague, BrainDiary, mean, sanitize } = require('./governance');
const { StrategicRewardModel } = require('./reward');

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function oneHot(index, confidence = 1) {
  const n = ACTIONS.length;
  const c = Math.max(1 / n, Math.min(1, finite(confidence, 1)));
  const rest = n > 1 ? (1 - c) / (n - 1) : 0;
  return Array.from({ length: n }, (_, i) => i === index ? c : rest);
}
function actionIndex(action) { return ACTIONS.indexOf(String(action || '')); }

class StrategyBrain {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.encoder = options.encoder || new StrategicFeatureEncoder({ now: this.now });
    this.student = options.student || new StudentNetwork({
      hiddenSize: options.hiddenSize,
      learningRate: options.learningRate,
      seed: options.seed
    });
    this.replay = options.replay || new PrioritizedReplayBuffer({ capacity: options.replayCapacity || 512, seed: options.replaySeed });
    this.rewardModel = options.rewardModel || new StrategicRewardModel({ outcomeMs: options.outcomeMs });
    this.quality = options.quality || new BrainQualityMonitor({ now: this.now });
    this.league = options.league || new BrainLeague({ now: this.now });
    this.diary = options.diary || new BrainDiary({ now: this.now, capacity: options.diaryCapacity || 80 });
    this.enabled = options.enabled !== false;
    this.influenceEnabled = false;
    this.minInfluenceConfidence = Math.max(0.6, Math.min(0.99, Number(options.minInfluenceConfidence) || 0.82));
    this.decisionIntervalMs = Math.max(1000, Math.min(60000, Number(options.decisionIntervalMs) || 5000));
    this.influenceHoldMs = Math.max(2000, Math.min(60000, Number(options.influenceHoldMs) || 15000));
    this.maxPendingOutcomes = Math.max(4, Math.min(100, Number(options.maxPendingOutcomes) || 32));
    this.lastDecisionAt = -Infinity;
    this.lastFeatures = null;
    this.lastPrediction = null;
    this.lastTeacher = null;
    this.lastDecision = null;
    this.lastOutcome = null;
    this.currentPreference = null;
    this.pendingOutcomes = [];
    this.teacher = { received: 0, accepted: 0, rejected: 0, agreements: 0 };
    this.outcomes = { completed: 0, safetyIncidents: 0, rewardSum: 0 };
    this.restoreErrors = 0;
    this.lastRestoreError = null;
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log) return;
    this.log.emit({ component: 'brain', event, severity, reason, data: sanitize(data) });
  }

  _safeIdle(context = {}) {
    const farmer = context.farmer || {};
    const emergency = context.combatEmergency || {};
    if (emergency.pendingRetreat) return false;
    if (farmer.state === 'ENGAGE' || farmer.state === 'RECOVER') return false;
    return true;
  }

  actionMask(context = {}) {
    const local = context.localFarming || {};
    const safeIdle = this._safeIdle(context);
    return [
      true,
      safeIdle && finite(local.candidateCount) >= 2,
      false,
      false,
      safeIdle
    ];
  }

  _contextForEncoder(context = {}) {
    return {
      ...context,
      replay: this.replay.status(),
      targetType: context.farmer && context.farmer.targetType || null
    };
  }

  _teacherTarget(input, index) {
    const scores = input && input.scores;
    if (Array.isArray(scores) && scores.length === ACTIONS.length && scores.every((value) => Number.isFinite(Number(value)) && Number(value) >= 0)) return normalizeTarget(scores.map(Number));
    if (scores && typeof scores === 'object') {
      const values = ACTIONS.map((action) => Math.max(0, finite(scores[action], 0)));
      if (values.some((value) => value > 0)) return normalizeTarget(values);
    }
    return oneHot(index, input && input.confidence == null ? 1 : input.confidence);
  }

  submitTeacher(input = {}, context = {}) {
    this.teacher.received += 1;
    const action = String(input.action || '').trim();
    const index = actionIndex(action);
    const features = this.lastFeatures || this.encoder.encode(this._contextForEncoder(context));
    const mask = this.actionMask(context);
    if (index < 0) return this._rejectTeacher('INVALID_ACTION', input);
    if (mask[index] === false) return this._rejectTeacher('ACTION_MASKED', input);
    const confidence = clamp01(input.confidence == null ? 0.5 : input.confidence);
    const target = this._teacherTarget(input, index);
    const prediction = this.student.predict(features, mask);
    this.teacher.accepted += 1;
    if (prediction.action === action) this.teacher.agreements += 1;
    const sample = this.replay.add({
      source: 'teacher',
      features,
      target,
      teacherAction: action,
      teacherConfidence: confidence,
      reward: 0,
      mask: mask.slice(),
      lesson: String(input.lesson || '').slice(0, 500),
      reason: String(input.reason || '').slice(0, 500)
    }, Math.max(0.05, 0.5 + confidence));
    const direct = this.student.train(features, target, { learningRate: this.student.learningRate * this.quality.learningRateFactor() });
    this.replay.updatePriority(sample.id, direct.loss + 0.05);
    this._trainReplay(2);
    this.lastTeacher = {
      at: this.now(), action, confidence,
      scores: sanitize(input.scores || null),
      reason: String(input.reason || '').slice(0, 500),
      lesson: String(input.lesson || '').slice(0, 500),
      expected: sanitize(input.expected || input.expectedOutcomeChanges || null),
      preferredMonster: typeof input.monster === 'string' ? input.monster : null,
      prediction: { action: prediction.action, confidence: prediction.confidence },
      loss: direct.loss
    };
    this.diary.add('teacher', this.lastTeacher);
    this._event('BRAIN_TEACHER_ACCEPTED', 'info', action, { confidence, studentAction: prediction.action, loss: direct.loss });
    this._startOutcome(action, features, confidence, context, 'teacher', null);
    this._considerLeague();
    return { accepted: true, action, confidence, loss: direct.loss, agreement: prediction.action === action };
  }

  _rejectTeacher(reason, input) {
    this.teacher.rejected += 1;
    const record = { at: this.now(), accepted: false, reason, action: input && input.action || null };
    this.lastTeacher = record;
    this.diary.add('error', record, 'warn');
    this._event('BRAIN_TEACHER_REJECTED', 'warn', reason, record);
    return record;
  }

  _trainReplay(iterations = 1) {
    let lastLoss = null;
    const count = Math.max(0, Math.min(20, Number(iterations) || 0));
    for (let n = 0; n < count; n += 1) {
      const batch = this.replay.sample(8);
      for (const sample of batch) {
        const result = this.student.train(sample.features, sample.target, { learningRate: this.student.learningRate * this.quality.learningRateFactor() });
        this.replay.updatePriority(sample.id, Math.abs(finite(sample.reward)) + result.loss + 0.05);
        lastLoss = result.loss;
      }
    }
    return lastLoss;
  }

  _validationLoss(model = this.student) {
    const rows = this.replay.validationSet(64);
    if (!rows.length) return model.lossEma == null ? 10 : model.lossEma;
    const losses = [];
    for (const sample of rows) {
      const prediction = model.predict(sample.features, null).probabilities;
      const target = normalizeTarget(sample.target);
      losses.push(-target.reduce((acc, value, index) => acc + value * Math.log(Math.max(1e-12, prediction[index])), 0));
    }
    return mean(losses);
  }

  _metrics() {
    return {
      samples: this.replay.status().size,
      updates: this.student.updates,
      teacherAgreement: this.teacher.accepted ? this.teacher.agreements / this.teacher.accepted : 0,
      outcomes: this.outcomes.completed,
      validationLoss: this._validationLoss(),
      meanReward: this.outcomes.completed ? this.outcomes.rewardSum / this.outcomes.completed : 0
    };
  }

  _considerLeague() {
    const result = this.league.consider(this.student, this._metrics(), this.quality.status());
    if (result.changed) {
      this.diary.add(result.reason === 'FIRST_CHAMPION' ? 'promotion' : 'challenge', { reason: result.reason, league: this.league.status() });
      this._event('BRAIN_LEAGUE_CHANGED', 'info', result.reason, this.league.status());
      if (result.reason === 'FIRST_CHAMPION') {
        this.quality.setHealthyChampion(this.league.champion);
      }
    }
    return result;
  }

  _startOutcome(action, features, confidence, context, source, policy) {
    if (actionIndex(action) < 0) return null;
    const row = {
      id: `brain-outcome-${this.now()}-${this.pendingOutcomes.length + 1}`,
      startedAt: this.now(),
      expiresAt: this.now() + this.rewardModel.outcomeMs,
      action,
      features: features.slice(),
      confidence: clamp01(confidence),
      source,
      policy: policy || 'student',
      before: this.rewardModel.metrics(context)
    };
    this.pendingOutcomes.push(row);
    if (this.pendingOutcomes.length > this.maxPendingOutcomes) this.pendingOutcomes.splice(0, this.pendingOutcomes.length - this.maxPendingOutcomes);
    return row;
  }

  _resolveOutcomes(context) {
    const now = this.now();
    const remaining = [];
    for (const pending of this.pendingOutcomes) {
      if (now < pending.expiresAt) { remaining.push(pending); continue; }
      const after = this.rewardModel.metrics(context);
      const safetyIncident = after.rip === true || (context.progress && context.progress.state === 'DEGRADED' && pending.before.progressHealthy > 0);
      const evaluated = this.rewardModel.evaluate(pending.before, after, { safetyIncident });
      const index = actionIndex(pending.action);
      const targetIndex = evaluated.reward >= 0 ? index : 0;
      const target = oneHot(Math.max(0, targetIndex), Math.max(0.55, 0.55 + Math.abs(evaluated.reward) * 0.45));
      const sample = this.replay.add({ source: 'outcome', features: pending.features, target, action: pending.action, reward: evaluated.reward, components: evaluated.components }, Math.abs(evaluated.reward) + 0.2);
      const trained = this.student.train(sample.features, sample.target, { learningRate: this.student.learningRate * this.quality.learningRateFactor() });
      this.replay.updatePriority(sample.id, Math.abs(evaluated.reward) + trained.loss + 0.05);
      this.outcomes.completed += 1;
      this.outcomes.rewardSum += evaluated.reward;
      if (safetyIncident) this.outcomes.safetyIncidents += 1;
      const quality = this.quality.record({ reward: evaluated.reward, confidence: pending.confidence, loss: trained.loss, safetyIncident, death: after.rip === true });
      const leagueResult = this.league.recordOutcome(pending.policy, evaluated.reward, { safetyIncident });
      this.lastOutcome = { at: now, id: pending.id, action: pending.action, reward: evaluated.reward, components: evaluated.components, source: pending.source, policy: pending.policy, safetyIncident, qualityState: quality.state, leagueReason: leagueResult.reason };
      this.diary.add('outcome', this.lastOutcome, evaluated.reward < 0 ? 'warn' : 'info');
      this._event('BRAIN_OUTCOME_MEASURED', evaluated.reward < 0 ? 'warn' : 'info', pending.action, this.lastOutcome);
      if (safetyIncident) this.currentPreference = null;
    }
    this.pendingOutcomes = remaining;
    this._trainReplay(1);
    this._considerLeague();
  }

  _modelPredictionFromSnapshot(snapshot, features, mask) {
    if (!snapshot) return null;
    try {
      const model = new StudentNetwork({ hiddenSize: this.student.hiddenSize, learningRate: this.student.learningRate, seed: 1 });
      model.restore(snapshot);
      return model.predict(features, mask);
    } catch (error) {
      this._event('BRAIN_POLICY_MODEL_INVALID', 'warn', 'MODEL_RESTORE_FAILED', { message: String(error && error.message || error) });
      return null;
    }
  }

  _influenceDecision(context, features, mask) {
    if (!this.influenceEnabled || !this.quality.autonomyAllowed() || !this.league.champion) return null;
    const policy = this.league.choosePolicy();
    const modelSnapshot = this.league.modelFor(policy);
    const prediction = this._modelPredictionFromSnapshot(modelSnapshot, features, mask);
    if (!prediction) return null;
    const threshold = Math.min(0.99, this.minInfluenceConfidence + this.quality.confidenceAdjustment());
    if (prediction.confidence < threshold) return null;
    if (prediction.action === 'continue') return null;
    if (prediction.action === 'replan_merchant' || prediction.action === 'explore') return null;
    const now = this.now();
    let preference = null;
    if (prediction.action === 'wait') {
      preference = { action: 'wait', at: now, expiresAt: now + Math.min(this.influenceHoldMs, 10000), confidence: prediction.confidence, policy };
    } else if (prediction.action === 'change_farm_target') {
      const candidates = context.localFarming && Array.isArray(context.localFarming.candidates) ? context.localFarming.candidates : [];
      if (candidates.length < 2) return null;
      const currentMonster = context.localFarming && context.localFarming.goal && context.localFarming.goal.monster || null;
      let preferredMonster = null;
      if (this.lastTeacher && this.lastTeacher.action === 'change_farm_target' && this.lastTeacher.preferredMonster && now - finite(this.lastTeacher.at) < 10 * 60 * 1000) {
        if (candidates.some((candidate) => candidate.monster === this.lastTeacher.preferredMonster)) preferredMonster = this.lastTeacher.preferredMonster;
      }
      preference = { action: 'change_farm_target', at: now, expiresAt: now + this.influenceHoldMs, confidence: prediction.confidence, policy, avoidMonster: currentMonster, preferredMonster };
    }
    if (preference) {
      this._startOutcome(prediction.action, features, prediction.confidence, context, 'autonomy', policy);
      this.diary.add('autonomy', preference);
      this._event('BRAIN_SAFE_INFLUENCE_APPLIED', 'info', prediction.action, preference);
    }
    return preference;
  }

  observe(context = {}) {
    if (!this.enabled) return this.status();
    this._resolveOutcomes(context);
    const now = this.now();
    if (this.currentPreference && finite(this.currentPreference.expiresAt) <= now) this.currentPreference = null;
    if (now - this.lastDecisionAt < this.decisionIntervalMs) return this.status();
    this.lastDecisionAt = now;
    const features = this.encoder.encode(this._contextForEncoder(context));
    const mask = this.actionMask(context);
    const prediction = this.student.predict(features, mask);
    this.lastFeatures = features;
    this.lastPrediction = { at: now, action: prediction.action, confidence: prediction.confidence, probabilities: prediction.probabilities, entropy: prediction.entropy, mask: ACTIONS.reduce((out, action, index) => { out[action] = mask[index]; return out; }, {}) };
    this.lastDecision = { at: now, mode: this.influenceEnabled ? 'bounded-influence-eligible' : 'shadow', prediction: this.lastPrediction };
    const influence = this._influenceDecision(context, features, mask);
    if (influence) this.currentPreference = influence;
    this._trainReplay(1);
    this._considerLeague();
    return this.status();
  }

  recordSafetyIncident(reason = 'SAFETY_INCIDENT') {
    this.outcomes.safetyIncidents += 1;
    this.currentPreference = null;
    const quality = this.quality.record({ at: this.now(), reward: -1, confidence: 1, loss: this.student.lossEma || 0, safetyIncident: true });
    const league = this.league.recordOutcome('champion', -1, { safetyIncident: true });
    const record = { at: this.now(), reason, qualityState: quality.state, leagueReason: league.reason };
    this.diary.add('rollback', record, 'warn');
    this._event('BRAIN_SAFETY_INCIDENT', 'warn', reason, record);
    return record;
  }

  setInfluenceEnabled(enabled) {
    this.influenceEnabled = enabled === true;
    if (!this.influenceEnabled) this.currentPreference = null;
    const record = { at: this.now(), influenceEnabled: this.influenceEnabled };
    this.diary.add('autonomy', record, this.influenceEnabled ? 'warn' : 'info');
    this._event('BRAIN_INFLUENCE_CHANGED', this.influenceEnabled ? 'warn' : 'info', this.influenceEnabled ? 'EXPLICITLY_ENABLED' : 'DISABLED', record);
    return this.influenceEnabled;
  }

  preference() {
    if (!this.currentPreference || finite(this.currentPreference.expiresAt) <= this.now()) return null;
    return { ...this.currentPreference };
  }

  exportState() {
    return {
      schemaVersion: 1,
      student: this.student.export(),
      replay: this.replay.export(128),
      quality: this.quality.export(),
      league: this.league.export(),
      diary: this.diary.export(),
      teacher: { ...this.teacher },
      outcomes: { ...this.outcomes },
      lastTeacher: this.lastTeacher,
      lastOutcome: this.lastOutcome
    };
  }

  restoreState(data) {
    try {
      if (!data || data.schemaVersion !== 1) throw new Error('unsupported brain state schema');
      this.student.restore(data.student);
      this.replay.restore(data.replay || { schemaVersion: 1, samples: [] });
      this.quality.restore(data.quality || { schemaVersion: 1, outcomes: [] });
      this.league.restore(data.league || { schemaVersion: 1, state: 'shadow' });
      this.diary.restore(data.diary || { schemaVersion: 1, entries: [] });
      this.teacher = { received: 0, accepted: 0, rejected: 0, agreements: 0, ...(data.teacher || {}) };
      this.outcomes = { completed: 0, safetyIncidents: 0, rewardSum: 0, ...(data.outcomes || {}) };
      this.lastTeacher = data.lastTeacher || null;
      this.lastOutcome = data.lastOutcome || null;
      this.influenceEnabled = false;
      this.currentPreference = null;
      this.lastRestoreError = null;
      this.diary.add('confirmed', { event: 'BRAIN_STATE_RESTORED', influenceForcedOff: true });
      return true;
    } catch (error) {
      this.restoreErrors += 1;
      this.lastRestoreError = String(error && error.message || error);
      this.influenceEnabled = false;
      this.currentPreference = null;
      this._event('BRAIN_STATE_RESTORE_FAILED', 'warn', 'BRAIN_STATE_INVALID', { message: this.lastRestoreError });
      return false;
    }
  }

  researchSummary() {
    return {
      generatedAt: this.now(),
      architecture: this.student.status().architecture,
      actions: [...ACTIONS],
      metrics: this._metrics(),
      quality: this.quality.status(),
      league: this.league.status(),
      teacher: this.teacherStatus(),
      outcomes: { ...this.outcomes },
      diary: this.diary.researchSummary({ profile: 'development', hours: 24, maxHighlights: 12 })
    };
  }

  teacherStatus() {
    return {
      transport: 'host-provided',
      requiredForGameplay: false,
      received: this.teacher.received,
      accepted: this.teacher.accepted,
      rejected: this.teacher.rejected,
      agreement: this.teacher.accepted ? this.teacher.agreements / this.teacher.accepted : 0,
      last: this.lastTeacher
    };
  }

  status() {
    return {
      enabled: this.enabled,
      strategicOnly: true,
      rawGameplayAccess: false,
      actions: [...ACTIONS],
      influenceEnabled: this.influenceEnabled,
      influenceDefault: false,
      minInfluenceConfidence: this.minInfluenceConfidence,
      decisionIntervalMs: this.decisionIntervalMs,
      currentPreference: this.preference(),
      lastDecision: this.lastDecision,
      lastPrediction: this.lastPrediction,
      pendingOutcomes: this.pendingOutcomes.length,
      maxPendingOutcomes: this.maxPendingOutcomes,
      lastOutcome: this.lastOutcome,
      features: this.encoder.status(),
      student: this.student.status(),
      replay: this.replay.status(),
      reward: this.rewardModel.status(),
      teacher: this.teacherStatus(),
      quality: this.quality.status(),
      league: this.league.status(),
      diary: this.diary.status(),
      outcomes: { ...this.outcomes },
      restoreErrors: this.restoreErrors,
      lastRestoreError: this.lastRestoreError
    };
  }
}

module.exports = { StrategyBrain };
