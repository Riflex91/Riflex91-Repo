'use strict';

const { BoundedReplayBuffer } = require('./replay-buffer');

const BRAIN_V2_MODE = 'teacher-student-strategic-brain-v2';
const BRAIN_V2_ACTIONS = Object.freeze(['continue', 'change_farm_target', 'replan_merchant', 'explore', 'wait']);
const BRAIN_V2_INPUT_NAMES = Object.freeze([
  'hpRatio', 'mpRatio', 'levelNorm', 'rangeNorm', 'speedNorm', 'attackNorm', 'partyPresentRatio', 'partyAliveRatio',
  'partyCohesion', 'selfAggro', 'visibleHostiles', 'targetHpRatio', 'riskHeadroom', 'deathSafety', 'xpRate', 'goldRate',
  'freeSlotsRatio', 'inventoryHealth', 'merchantIdle', 'marketLiquidity', 'gearHealth', 'travelEfficiency', 'worldConfidence', 'knowledgeFreshness',
  'errorHealth', 'recoveryHealth', 'currentPlanAffinity', 'targetEfficiency', 'kiteConfidence', 'teacherRecency', 'outcomeHealth', 'novelty',
  'capabilityCoverage', 'catalogAgreement', 'aoeConfigured', 'aoeSkillDensity', 'aoeSupport', 'combatModeAggression',
  'pullCapacity', 'desiredPullRatio', 'engagedPullRatio', 'adaptivePullConfidence', 'adaptiveSafetySignal'
]);
const HIDDEN_SIZE = 24;
const STORAGE_KEY = 'aio-v3:brain-v2:state:v2';

function finite(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

function ratio(value, max, fallback = 0.5) {
  const denominator = finite(max, 0);
  return denominator > 0 ? clamp(finite(value, 0) / denominator) : fallback;
}

function softmax(values) {
  const max = Math.max(...values);
  const scaled = values.map((value) => Math.exp(Math.max(-30, Math.min(30, value - max))));
  const total = scaled.reduce((sum, value) => sum + value, 0) || 1;
  return scaled.map((value) => value / total);
}

function entropy(probabilities) {
  const raw = probabilities.reduce((sum, p) => sum - (p > 0 ? p * Math.log(p) : 0), 0);
  return clamp(raw / Math.log(Math.max(2, probabilities.length)));
}

function safeClone(value) {
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function seeded(index) {
  const raw = Math.sin((index + 1) * 91.173) * 43758.5453;
  const fraction = ((raw % 1) + 1) % 1;
  return (fraction - 0.5) * 0.16;
}

function average(values, fallback = 0) {
  const usable = (values || []).map(Number).filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : fallback;
}

function scoreVector(scores) {
  const raw = BRAIN_V2_ACTIONS.map((action) => Math.max(0, finite(scores && scores[action], 0)));
  const total = raw.reduce((sum, value) => sum + value, 0);
  return total > 0 ? raw.map((value) => value / total) : BRAIN_V2_ACTIONS.map(() => 1 / BRAIN_V2_ACTIONS.length);
}

function targetVector(target) {
  if (Array.isArray(target)) {
    const scores = Object.fromEntries(BRAIN_V2_ACTIONS.map((action, index) => [action, finite(target[index], 0)]));
    return scoreVector(scores);
  }
  return scoreVector(target);
}

function actionFrom(probabilities) {
  let index = 0;
  for (let i = 1; i < probabilities.length; i += 1) if (probabilities[i] > probabilities[index]) index = i;
  return { index, action: BRAIN_V2_ACTIONS[index], confidence: probabilities[index] };
}

function vectorDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 1;
  return Math.sqrt(a.reduce((sum, value, index) => sum + ((value - b[index]) ** 2), 0) / a.length);
}

function storageOf(root) {
  try { return root && (root.localStorage || (root.parent && root.parent.localStorage)) || null; } catch (_) { return null; }
}

function partyRows(snapshot) {
  const rows = [];
  const seen = new Set();
  const add = (row) => {
    if (!row) return;
    const name = String(row.name || row.id || '');
    if (!name || seen.has(name)) return;
    seen.add(name);
    rows.push(row);
  };
  add(snapshot && snapshot.character);
  for (const member of snapshot && snapshot.party || []) add(member);
  return rows;
}

function freeSlots(character) {
  const inventory = Array.isArray(character && character.inventory) ? character.inventory : [];
  const size = Math.max(0, Math.floor(finite(character && character.isize, inventory.length)));
  const occupied = inventory.slice(0, size || undefined).filter(Boolean).length;
  return { size, free: Math.max(0, size - occupied), ratio: size ? clamp((size - occupied) / size) : 0.5 };
}

function performanceStatus(runtime) {
  try { return runtime && runtime.performance && typeof runtime.performance.status === 'function' ? runtime.performance.status() || {} : {}; } catch (_) { return {}; }
}

function currentRates(runtime) {
  const status = performanceStatus(runtime);
  const current = status.current || (Array.isArray(status.recent) && status.recent[status.recent.length - 1]) || {};
  return current.rates || {};
}

function currentMarketLiquidity(runtime) {
  try {
    const status = runtime && runtime.economyEquipmentAutonomyV2 && runtime.economyEquipmentAutonomyV2.status && runtime.economyEquipmentAutonomyV2.status();
    const rows = status && status.marketDecisions || [];
    return clamp(average(rows.map((row) => row && row.liquidity), 0.25));
  } catch (_) { return 0.25; }
}

function worldConfidence(runtime) {
  try {
    const status = runtime && runtime.world && runtime.world.status && runtime.world.status();
    return clamp(finite(status && (status.confidence || status.averageConfidence), 0.5));
  } catch (_) { return 0.5; }
}

function currentKiteConfidence(runtime) {
  try {
    const module = runtime && runtime.alpha24AdaptiveRangeRiskLogisticsHotfix;
    const status = module && module.status && module.status();
    return clamp(finite(status && status.currentTankAssessment && status.currentTankAssessment.kiteConfidence, 0));
  } catch (_) { return 0; }
}

function recentErrorHealth(runtime) {
  try {
    const rows = runtime && runtime.log && runtime.log.list ? runtime.log.list(80) : [];
    const failures = rows.filter((row) => row && ['warn', 'error', 'fatal'].includes(String(row.severity))).length;
    return clamp(1 - failures / 20);
  } catch (_) { return 0.75; }
}

function targetCandidate(context) {
  const ranked = Array.isArray(context && context.teacherRanking) ? context.teacherRanking : [];
  const candidates = Array.isArray(context && context.candidates) ? context.candidates : [];
  return ranked[0] || candidates[0] || null;
}

function brainCapabilityContext(runtime) {
  let partyCaps = null;
  try { partyCaps = runtime && runtime.partyCapabilityResolver && runtime.partyCapabilityResolver.status ? runtime.partyCapabilityResolver.status() : null; } catch (_) {}
  const tactical = runtime && runtime.tacticalPartyCombat;
  const encounter = tactical && tactical.encounter || null;
  let plan = encounter && encounter.aoe || null;
  let combatSource = plan ? 'local-tactical-encounter' : null;
  if (!plan && runtime && runtime.partyTelemetry && typeof runtime.partyTelemetry.capabilityReports === 'function') {
    try {
      const remoteRows = Object.values(runtime.partyTelemetry.capabilityReports() || {});
      const authoritative = remoteRows.find((row) => row && row.combat && row.combat.authoritative === true)
        || remoteRows.find((row) => row && row.combat && row.combat.pullOwner && row.character && String(row.combat.pullOwner) === String(row.character));
      if (authoritative && authoritative.combat) {
        plan = authoritative.combat;
        combatSource = `remote-leader:${String(authoritative.character || authoritative.combat.pullOwner || 'unknown')}`;
      }
    } catch (_) {}
  }
  const adaptive = plan && plan.adaptivePull || runtime && runtime.adaptivePullLearner && runtime.adaptivePullLearner.lastRecommendation || null;
  const remoteSync = partyCaps && partyCaps.remoteSync || {};
  const combat = partyCaps && partyCaps.combat || {};
  const configuredSupport = combat.configuredSupport || {};
  const aoeCapabilities = new Set(['multi_target_damage', 'ranged_multi_target_damage', 'variable_multi_target_damage', 'aoe_damage', 'aoe_control', 'aoe_aggro_control']);
  const members = (partyCaps && partyCaps.members || []).map((member) => {
    const skills = (member && member.skills || []).filter((skill) => skill && skill.configuredReady === true)
      .map((skill) => ({
        id: String(skill.id || ''),
        targetCapacity: skill.targetCapacity == null ? null : Math.max(1, Math.min(12, finite(skill.targetCapacity, 1))),
        minTargets: skill.parameters && Number.isFinite(Number(skill.parameters.minTargets)) ? Number(skill.parameters.minTargets) : null,
        capabilities: (skill.capabilities || []).filter((capability) => aoeCapabilities.has(String(capability))).slice(0, 8)
      }))
      .filter((skill) => skill.id)
      .slice(0, 16);
    return {
      name: String(member && member.name || ''),
      ctype: String(member && member.ctype || 'unknown'),
      remote: member && member.remote === true,
      remoteValid: member && member.remoteSync ? member.remoteSync.valid === true : true,
      combatMode: member && member.combatMode || null,
      skills
    };
  }).slice(0, 4);
  const aoeSkills = members.flatMap((member) => member.skills).filter((skill) => skill.capabilities.some((capability) => aoeCapabilities.has(capability)));
  const supportCount = ['partyHeal', 'groupSustain', 'aoeControl', 'aoeAggroControl'].filter((key) => configuredSupport[key] === true).length;
  const hardCapacity = Math.max(1, finite(plan && plan.pullCapacity, 1));
  const desired = Math.max(1, finite(plan && plan.desiredPullSize, 1));
  const engaged = Math.max(0, finite(plan && plan.engagedCount, 0));
  let combatMode = plan && plan.combatMode ? String(plan.combatMode) : 'smart_auto';
  if (!plan || !plan.combatMode) {
    try {
      if (runtime && runtime.lastSnapshot && runtime.characterCombatProfiles && typeof runtime.characterCombatProfiles.getCombatMode === 'function') {
        combatMode = String(runtime.characterCombatProfiles.getCombatMode(runtime.lastSnapshot.character && runtime.lastSnapshot.character.name) || 'smart_auto');
      }
    } catch (_) {}
  }
  const modeAggression = combatMode === 'aoe_preferred' ? 1 : combatMode === 'single_target' ? 0 : 0.5;
  const profiles = adaptive && Array.isArray(adaptive.profiles) ? adaptive.profiles : [];
  const recommended = Math.max(1, finite(adaptive && adaptive.recommendedSize, desired));
  const recommendedProfile = profiles.find((row) => Number(row && row.size) === recommended) || null;
  const adaptiveConfidence = adaptive && Number.isFinite(Number(adaptive.confidence))
    ? clamp(Number(adaptive.confidence))
    : clamp(finite(recommendedProfile && recommendedProfile.confidence, 0));
  const reason = String(adaptive && adaptive.reason || 'DETERMINISTIC_BASELINE');
  const adaptiveSafetySignal = reason === 'RISK_EVIDENCE_REDUCED_PULL'
    ? 0
    : reason === 'SUSTAINABLE_XP_OPTIMUM'
      ? 1
      : reason.startsWith('BOUNDED_EXPLORATION')
        ? 0.65
        : 0.5;
  const features = {
    capabilityCoverage: clamp(remoteSync.enabled === true ? finite(remoteSync.coverage, 0) : 0.5),
    catalogAgreement: remoteSync.enabled === true ? (remoteSync.catalogAgreement === false ? 0 : 1) : 0.5,
    aoeConfigured: combat.aoeConfigured === true ? 1 : 0,
    aoeSkillDensity: clamp(aoeSkills.length / 6),
    aoeSupport: clamp(supportCount / 4),
    combatModeAggression: modeAggression,
    pullCapacity: clamp(hardCapacity / 8),
    desiredPullRatio: clamp(desired / hardCapacity),
    engagedPullRatio: clamp(engaged / hardCapacity),
    adaptivePullConfidence: adaptiveConfidence,
    adaptiveSafetySignal
  };
  return {
    features,
    detail: {
      remoteSync: {
        enabled: remoteSync.enabled === true,
        coverage: finite(remoteSync.coverage, remoteSync.enabled === true ? 0 : 1),
        catalogAgreement: remoteSync.catalogAgreement !== false,
        valid: finite(remoteSync.valid, 0),
        expected: finite(remoteSync.expected, 0)
      },
      combat: {
        source: combatSource,
        aoeConfigured: combat.aoeConfigured === true,
        configuredSupport: { ...configuredSupport },
        combatMode,
        hardCapacity,
        desiredPullSize: desired,
        engagedCount: engaged,
        state: plan && plan.state || null
      },
      adaptive: adaptive ? {
        applied: adaptive.applied === true,
        reason,
        recommendedSize: recommended,
        confidence: adaptiveConfidence
      } : null,
      members
    }
  };
}

class TinyStrategyNetwork {
  constructor(state = null) {
    this.inputSize = BRAIN_V2_INPUT_NAMES.length;
    this.hiddenSize = HIDDEN_SIZE;
    this.outputSize = BRAIN_V2_ACTIONS.length;
    this.w1 = Array.from({ length: this.hiddenSize }, (_, hidden) => Array.from({ length: this.inputSize }, (_, input) => seeded(hidden * this.inputSize + input)));
    this.b1 = Array(this.hiddenSize).fill(0);
    this.w2 = Array.from({ length: this.outputSize }, (_, output) => Array.from({ length: this.hiddenSize }, (_, hidden) => seeded(2000 + output * this.hiddenSize + hidden)));
    this.b2 = Array(this.outputSize).fill(0);
    if (state) this.restore(state);
  }

  forward(input) {
    const x = BRAIN_V2_INPUT_NAMES.map((_, index) => clamp(input && input[index]));
    const hidden = this.w1.map((row, hiddenIndex) => Math.tanh(row.reduce((sum, weight, inputIndex) => sum + weight * x[inputIndex], this.b1[hiddenIndex])));
    const logits = this.w2.map((row, outputIndex) => row.reduce((sum, weight, hiddenIndex) => sum + weight * hidden[hiddenIndex], this.b2[outputIndex]));
    return { x, hidden, logits, probs: softmax(logits) };
  }

  train(input, target, learningRate = 0.01) {
    const forward = this.forward(input);
    const y = targetVector(target);
    const deltaOutput = forward.probs.map((probability, index) => probability - y[index]);
    const deltaHidden = Array(this.hiddenSize).fill(0);
    for (let output = 0; output < this.outputSize; output += 1) {
      for (let hidden = 0; hidden < this.hiddenSize; hidden += 1) deltaHidden[hidden] += this.w2[output][hidden] * deltaOutput[output];
    }
    for (let output = 0; output < this.outputSize; output += 1) {
      for (let hidden = 0; hidden < this.hiddenSize; hidden += 1) this.w2[output][hidden] -= learningRate * deltaOutput[output] * forward.hidden[hidden];
      this.b2[output] -= learningRate * deltaOutput[output];
    }
    for (let hidden = 0; hidden < this.hiddenSize; hidden += 1) {
      const delta = deltaHidden[hidden] * (1 - forward.hidden[hidden] ** 2);
      for (let inputIndex = 0; inputIndex < this.inputSize; inputIndex += 1) this.w1[hidden][inputIndex] -= learningRate * delta * forward.x[inputIndex];
      this.b1[hidden] -= learningRate * delta;
    }
    return -y.reduce((sum, expected, index) => sum + (expected > 0 ? expected * Math.log(Math.max(1e-9, forward.probs[index])) : 0), 0);
  }

  snapshot() { return safeClone({ w1: this.w1, b1: this.b1, w2: this.w2, b2: this.b2 }); }

  restore(state) {
    if (!state || !Array.isArray(state.w1) || state.w1.length !== this.hiddenSize || !Array.isArray(state.w2) || state.w2.length !== this.outputSize) return false;
    if (!Array.isArray(state.b1) || state.b1.length !== this.hiddenSize || !Array.isArray(state.b2) || state.b2.length !== this.outputSize) return false;
    try {
      const legacyInputSize = state.w1[0] && state.w1[0].length;
      if (!Number.isInteger(legacyInputSize) || legacyInputSize < 1 || legacyInputSize > this.inputSize) return false;
      if (!state.w1.every((row) => Array.isArray(row) && row.length === legacyInputSize)) return false;
      this.w1 = state.w1.map((row, hidden) => Array.from({ length: this.inputSize }, (_, input) => {
        if (input < legacyInputSize) return Number(row[input]);
        return seeded(hidden * this.inputSize + input);
      }));
      this.b1 = state.b1.map(Number);
      this.w2 = state.w2.map((row) => row.map(Number));
      this.b2 = state.b2.map(Number);
      return this.w1.every((row) => row.length === this.inputSize && row.every(Number.isFinite)) && this.w2.every((row) => row.length === this.hiddenSize && row.every(Number.isFinite));
    } catch (_) { return false; }
  }
}

class BrainStateEncoderV2 {
  encode(runtime, context = {}, meta = {}) {
    const snapshot = context.snapshot || runtime && runtime.lastSnapshot || {};
    const character = snapshot.character || {};
    const party = partyRows(snapshot);
    const alive = party.filter((member) => !(member.dead || member.rip));
    const hostiles = (snapshot.entities || []).filter((entity) => entity && entity.mtype && !entity.dead && (entity.hp == null || finite(entity.hp) > 0));
    const selfAggro = hostiles.filter((entity) => String(entity.target || '') === String(character.name || '')).length;
    const target = targetCandidate(context);
    const liveTarget = target && (snapshot.entities || []).find((entity) => String(entity.id) === String(target.entityId || target.id)) || null;
    const rates = currentRates(runtime);
    const slots = freeSlots(character);
    const candidates = Array.isArray(context.candidates) ? context.candidates : [];
    const maxXp = Math.max(1, ...candidates.map((row) => Math.max(0, finite(row.xpPerHour, 0))));
    const maxGold = Math.max(1, ...candidates.map((row) => Math.max(0, finite(row.goldPerHour, 0))));
    const risk = runtime && runtime.lastRiskSkip;
    const riskThreshold = finite(runtime && runtime.combatRisk && runtime.combatRisk.threshold, 0.65);
    const riskScore = finite(risk && risk.score, riskThreshold * 0.5);
    const deaths = Math.max(0, finite(rates.deathsPerHour, 0));
    const travelSeconds = Math.max(0, finite(target && target.travelSeconds, 60));
    const expectedKillSeconds = Math.max(0, finite(target && target.expectedKillSeconds, 25));
    const currentPlan = context.currentPlan || {};
    const targetId = target && String(target.id || target.monster || '');
    const planId = String(currentPlan.id || currentPlan.monster || '');
    let gearGoals = 0;
    try { gearGoals = runtime && runtime.gearProgression && runtime.gearProgression.list ? runtime.gearProgression.list(64).length : 0; } catch (_) {}
    let merchantBusy = false;
    try {
      const status = runtime && runtime.economyEquipmentAutonomyV2 && runtime.economyEquipmentAutonomyV2.status && runtime.economyEquipmentAutonomyV2.status();
      merchantBusy = !!(status && (status.busy || status.homeService && !['STANDBY', 'MARKET_SERVICE'].includes(status.homeService.phase)));
    } catch (_) {}
    const capabilityContext = brainCapabilityContext(runtime);
    const values = {
      // Adventure Land progression is gear-dominant: character level is useful
      // context and an equip/content gate, but it is not a reliable proxy for
      // combat strength. Keep the legacy feature for model compatibility while
      // deliberately bounding its influence; live combat stats, gear pressure
      // and measured performance carry the real strength signal.
      hpRatio: ratio(character.hp, character.max_hp), mpRatio: ratio(character.mp, character.max_mp), levelNorm: clamp(finite(character.level, 1) / 120) * 0.15, rangeNorm: clamp(finite(character.range, 0) / 250), speedNorm: clamp(finite(character.speed, 0) / 120), attackNorm: clamp(finite(character.attack, 0) / 2500),
      partyPresentRatio: clamp(party.length / 4), partyAliveRatio: party.length ? clamp(alive.length / party.length) : 0.25, partyCohesion: meta.partyCohesion == null ? (party.length >= 3 ? 0.8 : 0.4) : clamp(meta.partyCohesion), selfAggro: clamp(selfAggro / 3), visibleHostiles: clamp(hostiles.length / 12),
      targetHpRatio: liveTarget ? ratio(liveTarget.hp, liveTarget.max_hp || liveTarget.hp, 1) : 0.5, riskHeadroom: clamp((riskThreshold - riskScore + 1) / 1.5), deathSafety: clamp(1 - deaths), xpRate: clamp(Math.max(0, finite(target && target.xpPerHour, finite(rates.xpPerHour, 0))) / maxXp), goldRate: clamp(Math.max(0, finite(target && target.goldPerHour, finite(rates.goldPerHour, 0))) / maxGold),
      freeSlotsRatio: slots.ratio, inventoryHealth: clamp(0.25 + slots.ratio * 0.75), merchantIdle: merchantBusy ? 0 : 1, marketLiquidity: currentMarketLiquidity(runtime), gearHealth: clamp(1 - gearGoals / 20), travelEfficiency: clamp(1 - travelSeconds / Math.max(30, finite(meta.maxTravelSeconds, 600))), worldConfidence: worldConfidence(runtime), knowledgeFreshness: meta.knowledgeFreshness == null ? 0.7 : clamp(meta.knowledgeFreshness),
      errorHealth: recentErrorHealth(runtime), recoveryHealth: ratio(character.hp, character.max_hp), currentPlanAffinity: targetId && planId && (targetId === planId || String(target && target.monster || '') === planId) ? 1 : 0, targetEfficiency: clamp(1 - expectedKillSeconds / 90), kiteConfidence: currentKiteConfidence(runtime), teacherRecency: clamp(1 - finite(meta.teacherAgeMs, 300000) / 600000), outcomeHealth: clamp((finite(meta.rewardEma, 0) + 1) / 2), novelty: clamp(finite(meta.novelty, 0.5)),
      ...capabilityContext.features
    };
    return { names: BRAIN_V2_INPUT_NAMES.slice(), values, vector: BRAIN_V2_INPUT_NAMES.map((name) => clamp(values[name])) };
  }
}

function deterministicTeacher(context) {
  const rows = Array.isArray(context.teacherRanking) ? context.teacherRanking : [];
  const top = rows[0] || (Array.isArray(context.candidates) ? context.candidates[0] : null) || null;
  const current = context.currentPlan || null;
  if (!top) return { action: 'wait', target: '', confidence: 0.8, scores: { continue: 0.04, change_farm_target: 0.02, replan_merchant: 0.04, explore: 0.1, wait: 0.8 }, reason: 'no deterministic candidate', lesson: 'Wait when deterministic safety has no eligible target.', source: 'deterministic' };
  const topId = String(top.id || top.monster || '');
  const currentId = String(current && (current.id || current.monster) || '');
  const same = !!currentId && (currentId === topId || currentId === String(top.monster || ''));
  const action = same ? 'continue' : 'change_farm_target';
  const scores = { continue: 0.08, change_farm_target: 0.08, replan_merchant: 0.04, explore: 0.03, wait: 0.02 };
  scores[action] = 0.75;
  return { action, target: String(top.monster || top.id || ''), confidence: 0.75, scores, reason: same ? 'deterministic planner confirms current plan' : 'deterministic planner prefers another safe target', lesson: 'Use deterministic planner ranking as safe strategic baseline.', source: 'deterministic' };
}

class StrategicBrainV2 {
  constructor(options = {}) {
    this.runtime = options.runtime || null;
    this.control = options.controlPlane || null;
    this.legacy = options.legacyBrain || null;
    this.root = options.root || this.runtime && this.runtime.root || globalThis;
    this.now = options.now || this.runtime && this.runtime.now || (() => Date.now());
    this.log = options.log || this.runtime && this.runtime.log || null;
    this.encoder = new BrainStateEncoderV2();
    this.replayBuffer = new BoundedReplayBuffer({ capacity: this._cfg('brain.replayCapacity', 512) });
    this.network = new TinyStrategyNetwork();
    this.remoteTeacher = null;
    this.remoteTeacherAt = 0;
    this.lastObservation = null;
    this.pendingOutcome = null;
    this.lastEncounterOutcome = null;
    this.seenEncounterOutcomes = [];
    this.rewardEma = 0;
    this.lossEma = null;
    this.agreementEma = null;
    this.overconfidenceFailures = 0;
    this.samples = 0;
    this.updates = 0;
    this.outcomes = 0;
    this.lastTrainAt = 0;
    this.lastSaveAt = 0;
    this.persistenceDisabled = false;
    this.persistenceError = null;
    this.diary = [];
    this.quality = { state: 'warming', score: 0.5, reason: 'collecting evidence' };
    this.league = { generation: 0, champion: null, championLoss: null, promotions: 0, rollbacks: 0, rejections: 0, lastEvent: null, lastEventAt: 0, lastReason: null };
    this.stats = { observations: 0, teacherSamples: 0, remoteTeacherSamples: 0, deterministicTeacherSamples: 0, replayTrains: 0, outcomeRewards: 0, encounterOutcomeRewards: 0, encounterOutcomeSkips: 0, genericOutcomeAttributionDeferrals: 0, genericOutcomeAttributionSuppressions: 0, saves: 0, restoreSuccess: 0, restoreErrors: 0, persistenceFailures: 0 };
    this._restore();
    this._diary('learn', '🧠', 'Brain v2 bereit', `${BRAIN_V2_INPUT_NAMES.length}→24→5 Student, Capability/Pull-Kontext, Experience Replay, Outcome-Lernen und Teacher-Distillation aktiv.`, 'neutral');
  }

  _cfg(key, fallback) { return this.control && typeof this.control.get === 'function' ? this.control.get(key, fallback) : fallback; }

  _diary(kind, icon, title, detail, tone = 'neutral', extra = {}) {
    const row = { id: `brain-${this.now()}-${this.diary.length}`, at: this.now(), kind, icon, title, detail, tone, ...extra };
    this.diary.push(row);
    const max = Math.max(20, Math.min(300, Math.floor(this._cfg('brain.diaryMaxEntries', 100))));
    if (this.diary.length > max) this.diary.splice(0, this.diary.length - max);
    return row;
  }

  _restore() {
    const storage = storageOf(this.root);
    if (!storage) return false;
    try {
      const state = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      if (!state || Number(state.schemaVersion) !== 2) return false;
      if (state.network) this.network.restore(state.network);
      this.rewardEma = finite(state.rewardEma, 0);
      this.lossEma = state.lossEma == null ? null : finite(state.lossEma);
      this.agreementEma = state.agreementEma == null ? null : finite(state.agreementEma);
      this.samples = Math.max(0, Math.floor(finite(state.samples, 0)));
      this.updates = Math.max(0, Math.floor(finite(state.updates, 0)));
      this.outcomes = Math.max(0, Math.floor(finite(state.outcomes, 0)));
      this.league = { ...this.league, ...(state.league || {}) };
      this.diary = Array.isArray(state.diary) ? state.diary.slice(-100) : [];
      this.lastEncounterOutcome = state.lastEncounterOutcome && typeof state.lastEncounterOutcome === 'object' ? safeClone(state.lastEncounterOutcome) : null;
      const restoredSeen = Array.isArray(state.seenEncounterOutcomes)
        ? state.seenEncounterOutcomes.map(String).filter(Boolean).slice(-128)
        : [];
      if (this.lastEncounterOutcome && this.lastEncounterOutcome.encounterId) restoredSeen.push(String(this.lastEncounterOutcome.encounterId));
      this.seenEncounterOutcomes = [...new Set(restoredSeen)].slice(-128);
      this.stats.restoreSuccess += 1;
      return true;
    } catch (error) {
      this.stats.restoreErrors += 1;
      this.persistenceError = String(error && error.message || error).slice(0, 240);
      return false;
    }
  }

  _save(force = false) {
    if (this.persistenceDisabled) return false;
    const now = this.now();
    if (!force && now - this.lastSaveAt < 15000) return false;
    const storage = storageOf(this.root);
    if (!storage) return false;
    this.lastSaveAt = now;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.exportState()));
      this.stats.saves += 1;
      this.persistenceError = null;
      return true;
    } catch (error) {
      this.stats.persistenceFailures += 1;
      this.persistenceError = String(error && error.message || error).slice(0, 240);
      if (/quota|exceed/i.test(this.persistenceError)) this.persistenceDisabled = true;
      return false;
    }
  }

  _novelty(vector) {
    const rows = this.replayBuffer.list(48).filter((row) => Array.isArray(row.vector));
    if (!rows.length) return 1;
    return clamp(Math.min(...rows.map((row) => vectorDistance(vector, row.vector))) * 2.5);
  }

  _quality() {
    const minSamples = Math.max(16, Math.floor(this._cfg('brain.championMinSamples', 120) / 3));
    let state = 'healthy'; let reason = 'stable learning'; let score = 0.75;
    if (this.samples < minSamples) { state = 'warming'; reason = 'collecting evidence'; score = clamp(this.samples / minSamples * 0.7); }
    else if (this.rewardEma < -0.35 || this.overconfidenceFailures >= 5) { state = 'quarantine'; reason = 'negative outcomes or repeated overconfidence'; score = 0.1; }
    else if (this.rewardEma < -0.15 || finite(this.lossEma, 0) > 1.45) { state = 'degraded'; reason = 'reward/loss degraded'; score = 0.3; }
    else if (this.rewardEma < 0 || finite(this.lossEma, 0) > 1.15) { state = 'watch'; reason = 'learning quality under observation'; score = 0.55; }
    this.quality = { state, score: Number(score.toFixed(3)), reason, rewardEma: Number(this.rewardEma.toFixed(4)), lossEma: this.lossEma == null ? null : Number(this.lossEma.toFixed(4)), overconfidenceFailures: this.overconfidenceFailures };
    return this.quality;
  }

  _train(vector, target, source = 'teacher') {
    const learningRate = clamp(this._cfg('brain.learningRate', 0.012), 0.001, 0.08);
    const loss = this.network.train(vector, target, learningRate);
    this.lossEma = this.lossEma == null ? loss : this.lossEma * 0.94 + loss * 0.06;
    this.updates += 1;
    this.lastTrainAt = this.now();
    this.replayBuffer.push({ at: this.now(), vector: vector.slice(), target: target.slice(), source, loss });
    return loss;
  }

  _replayTrain() {
    const batchSize = Math.max(4, Math.min(64, Math.floor(this._cfg('brain.replayBatchSize', 12))));
    const rows = this.replayBuffer.list(batchSize);
    if (!rows.length) return;
    const learningRate = clamp(this._cfg('brain.learningRate', 0.012), 0.001, 0.08) * 0.35;
    for (const row of rows) if (Array.isArray(row.vector) && Array.isArray(row.target)) this.network.train(row.vector, row.target, learningRate);
    this.stats.replayTrains += 1;
  }

  _teacherFor(context) {
    const maxAge = Math.max(30000, finite(this._cfg('brain.teacherMaxIntervalMs', 300000), 300000));
    if (this.remoteTeacher && this.now() - this.remoteTeacherAt <= maxAge) return { ...this.remoteTeacher, source: 'cloudflare' };
    return deterministicTeacher(context);
  }

  observe(context = {}) {
    this.stats.observations += 1;
    if (this._cfg('brain.enabled', true) !== true) return this.lastObservation;
    let legacy = null;
    try { legacy = this.legacy && typeof this.legacy.observe === 'function' ? this.legacy.observe(context) : null; } catch (_) {}
    const teacherAgeMs = this.remoteTeacherAt ? this.now() - this.remoteTeacherAt : 600000;
    const preliminary = this.encoder.encode(this.runtime, context, { teacherAgeMs, rewardEma: this.rewardEma, novelty: 0.5, maxTravelSeconds: this._cfg('farming.maxTravelSeconds', 600) });
    const novelty = this._novelty(preliminary.vector);
    const encoded = this.encoder.encode(this.runtime, context, { teacherAgeMs, rewardEma: this.rewardEma, novelty, maxTravelSeconds: this._cfg('farming.maxTravelSeconds', 600) });
    const forward = this.network.forward(encoded.vector);
    const student = actionFrom(forward.probs);
    const teacher = this._teacherFor(context);
    const target = scoreVector(teacher.scores);
    const teacherAction = actionFrom(target);
    const loss = this._train(encoded.vector, target, teacher.source);
    this.samples += 1;
    this.stats.teacherSamples += 1;
    if (teacher.source === 'cloudflare') this.stats.remoteTeacherSamples += 1; else this.stats.deterministicTeacherSamples += 1;
    const agreement = student.action === teacherAction.action;
    this.agreementEma = this.agreementEma == null ? (agreement ? 1 : 0) : this.agreementEma * 0.94 + (agreement ? 1 : 0) * 0.06;
    this._replayTrain();
    const topCandidate = targetCandidate(context);
    const recommendation = topCandidate ? { id: String(topCandidate.id || topCandidate.monster || ''), monster: String(topCandidate.monster || ''), map: topCandidate.map || null, strategicAction: student.action, confidence: Number(student.confidence.toFixed(4)) } : null;
    const record = {
      at: this.now(), mode: 'shadow', actionAuthority: false, directActionAccess: false, candidateCount: Array.isArray(context.candidates) ? context.candidates.length : 0, recommendation,
      student: { action: student.action, confidence: Number(student.confidence.toFixed(4)), scores: Object.fromEntries(BRAIN_V2_ACTIONS.map((action, index) => [action, Number(forward.probs[index].toFixed(4))])), entropy: Number(entropy(forward.probs).toFixed(4)), novelty: Number(novelty.toFixed(4)) },
      teacher: { source: teacher.source, action: teacher.action, target: teacher.target || '', confidence: finite(teacher.confidence, teacherAction.confidence), reason: teacher.reason || '', lesson: teacher.lesson || '' }, agreement, loss: Number(loss.toFixed(5)), target: teacher.target || '', quality: this._quality(), legacy: legacy && legacy.recommendation ? { recommendation: legacy.recommendation } : null, inputs: encoded.values
    };
    this.lastObservation = record;
    this.replayBuffer.push({ at: record.at, vector: encoded.vector.slice(), target: target.slice(), source: 'observation', student: record.student, teacher: record.teacher, agreement, loss });
    if (!this.pendingOutcome) {
      let encounterId = null;
      try {
        const activeEncounter = this.runtime && this.runtime.encounterLifecycle && this.runtime.encounterLifecycle.current;
        encounterId = activeEncounter && activeEncounter.encounterId ? String(activeEncounter.encounterId) : null;
      } catch (_) {}
      this.pendingOutcome = {
        startedAt: this.now(),
        dueAt: this.now() + Math.max(15000, finite(this._cfg('brain.outcomeWindowMs', 60000), 60000)),
        action: student.action,
        target: teacher.target || '',
        confidence: student.confidence,
        baseline: this.captureMetrics(),
        encounterId
      };
    }
    this._leagueCheck();
    this._save();
    if (this.log) this.log.emit({ component: 'brain-v2', event: 'BRAIN_V2_OBSERVATION', data: { student: record.student, teacher: record.teacher, agreement, quality: record.quality.state } });
    return record;
  }

  ingestTeacher(decision, meta = {}) {
    if (!decision || !BRAIN_V2_ACTIONS.includes(String(decision.action))) return false;
    const normalized = scoreVector(decision.scores);
    const clean = { action: String(decision.action), target: String(decision.target || ''), confidence: clamp(decision.confidence), scores: Object.fromEntries(BRAIN_V2_ACTIONS.map((action, index) => [action, normalized[index]])), reason: String(decision.reason || '').slice(0, 300), lesson: String(decision.lesson || '').slice(0, 400), expected: decision.expected && typeof decision.expected === 'object' ? safeClone(decision.expected) : null, recheckSeconds: Math.max(5, Math.min(1800, finite(decision.recheckSeconds, 60))), source: 'cloudflare', neurons: finite(meta.neurons, 0) };
    this.remoteTeacher = clean;
    this.remoteTeacherAt = this.now();
    this._diary('teacher', '🎓', `Teacher: ${clean.action}`, clean.lesson || clean.reason || 'Neue strategische Lektion.', 'learn', { action: clean.action, target: clean.target });
    if (this.lastObservation && this.lastObservation.inputs) this._train(BRAIN_V2_INPUT_NAMES.map((name) => clamp(this.lastObservation.inputs[name])), normalized, 'remote-teacher');
    this._save(true);
    return true;
  }

  captureMetrics() {
    const snapshot = this.runtime && this.runtime.lastSnapshot || {};
    const character = snapshot.character || {};
    const rates = currentRates(this.runtime);
    const slots = freeSlots(character);
    const capabilityContext = brainCapabilityContext(this.runtime);
    return { at: this.now(), xpPerHour: finite(rates.xpPerHour, 0), goldPerHour: finite(rates.goldPerHour, 0), deathsPerHour: finite(rates.deathsPerHour, 0), damageTakenPerHour: finite(rates.damageTakenPerHour, 0), hpRatio: ratio(character.hp, character.max_hp), freeSlots: slots.free, freeSlotsRatio: slots.ratio, rip: !!character.rip, errorHealth: recentErrorHealth(this.runtime), pullCapacity: capabilityContext.features.pullCapacity, engagedPullRatio: capabilityContext.features.engagedPullRatio, capabilityCoverage: capabilityContext.features.capabilityCoverage, catalogAgreement: capabilityContext.features.catalogAgreement, adaptiveSafetySignal: capabilityContext.features.adaptiveSafetySignal };
  }

  tickOutcome() {
    if (!this.pendingOutcome || this.now() < this.pendingOutcome.dueAt) return null;
    const pending = this.pendingOutcome;
    if (pending.encounterId) {
      const encounterId = String(pending.encounterId);
      if (this.seenEncounterOutcomes.includes(encounterId)) {
        this.pendingOutcome = null;
        this.stats.genericOutcomeAttributionSuppressions += 1;
        if (this.log) this.log.emit({ component: 'brain-v2', event: 'BRAIN_V2_GENERIC_OUTCOME_SUPPRESSED', reason: 'ENCOUNTER_OUTCOME_ALREADY_ATTRIBUTED', data: { encounterId } });
        return null;
      }
      let activeEncounterId = null;
      try {
        const active = this.runtime && this.runtime.encounterLifecycle && this.runtime.encounterLifecycle.current;
        activeEncounterId = active && active.encounterId ? String(active.encounterId) : null;
      } catch (_) {}
      if (activeEncounterId === encounterId) {
        this.pendingOutcome.dueAt = this.now() + Math.max(1000, Math.min(5000, finite(this._cfg('brain.outcomeWindowMs', 60000), 60000) / 6));
        this.stats.genericOutcomeAttributionDeferrals += 1;
        return null;
      }
    }
    this.pendingOutcome = null;
    const before = pending.baseline || {};
    const after = this.captureMetrics();
    const relative = (current, prior, scale) => clamp((finite(current) - finite(prior)) / Math.max(scale, Math.abs(finite(prior)), 1), -1, 1);
    const xp = relative(after.xpPerHour, before.xpPerHour, 250000), gold = relative(after.goldPerHour, before.goldPerHour, 50000), slots = clamp((finite(after.freeSlots) - finite(before.freeSlots)) / 8, -1, 1), safety = clamp((finite(before.deathsPerHour) - finite(after.deathsPerHour)) / 0.5, -1, 1), hp = clamp((finite(after.hpRatio) - finite(before.hpRatio)) * 2, -1, 1), errors = clamp(finite(after.errorHealth) - finite(before.errorHealth), -1, 1);
    let reward = 0.30 * xp + 0.16 * gold + 0.12 * slots + 0.25 * safety + 0.10 * hp + 0.07 * errors;
    if (after.rip) reward -= 0.8;
    reward = clamp(reward, -1, 1);
    this.rewardEma = this.outcomes ? this.rewardEma * 0.88 + reward * 0.12 : reward;
    this.outcomes += 1;
    this.stats.outcomeRewards += 1;
    if (pending.confidence > 0.72 && reward < -0.25) this.overconfidenceFailures += 1; else if (reward > 0) this.overconfidenceFailures = Math.max(0, this.overconfidenceFailures - 1);
    const outcome = { at: this.now(), action: pending.action, target: pending.target, confidence: pending.confidence, reward: Number(reward.toFixed(4)), before, after, components: { xp: Number(xp.toFixed(3)), gold: Number(gold.toFixed(3)), slots: Number(slots.toFixed(3)), safety: Number(safety.toFixed(3)), hp: Number(hp.toFixed(3)), errors: Number(errors.toFixed(3)) } };
    this._diary('outcome', reward > 0.08 ? '✅' : reward < -0.08 ? '⚠️' : '📊', `Outcome ${reward >= 0 ? '+' : ''}${reward.toFixed(3)}`, `${outcome.action}${outcome.target ? ' · ' + outcome.target : ''} · XP ${Math.round(after.xpPerHour)}/h · Gold ${Math.round(after.goldPerHour)}/h`, reward > 0.08 ? 'good' : reward < -0.08 ? 'bad' : 'neutral', { action: outcome.action, target: outcome.target, reward: outcome.reward });
    this._quality(); this._leagueCheck(outcome); this._save(true);
    if (this.log) this.log.emit({ component: 'brain-v2', event: 'BRAIN_V2_OUTCOME', data: outcome });
    return outcome;
  }


  _latestEncounterOutcome() {
    const rows = [];
    if (this.lastEncounterOutcome) rows.push(this.lastEncounterOutcome);
    if (this.runtime && this.runtime.lastEncounterOutcome) rows.push(this.runtime.lastEncounterOutcome);
    try {
      if (this.runtime && this.runtime.partyTelemetry) {
        if (typeof this.runtime.partyTelemetry.encounterOutcomeList === 'function') rows.push(...this.runtime.partyTelemetry.encounterOutcomeList());
        else if (typeof this.runtime.partyTelemetry.encounterOutcomes === 'function') rows.push(...Object.values(this.runtime.partyTelemetry.encounterOutcomes() || {}));
      }
    } catch (_) {}
    const clean = rows.filter((row) => row && row.encounterId && Number.isFinite(Number(row.endedAt)));
    clean.sort((a, b) => finite(b.endedAt, 0) - finite(a.endedAt, 0));
    return clean.length ? safeClone(clean[0]) : null;
  }

  ingestEncounterOutcome(outcome, meta = {}) {
    if (!outcome || !outcome.encounterId) {
      this.stats.encounterOutcomeSkips += 1;
      return { accepted: false, reason: 'ENCOUNTER_OUTCOME_INVALID' };
    }
    const encounterId = String(outcome.encounterId);
    if (this.seenEncounterOutcomes.includes(encounterId)) {
      this.stats.encounterOutcomeSkips += 1;
      return { accepted: false, reason: 'ENCOUNTER_OUTCOME_DUPLICATE', encounterId };
    }
    this.seenEncounterOutcomes.push(encounterId);
    if (this.seenEncounterOutcomes.length > 128) this.seenEncounterOutcomes.splice(0, this.seenEncounterOutcomes.length - 128);
    this.lastEncounterOutcome = safeClone(outcome);
    const durableStorage = storageOf(this.root);
    if (!durableStorage || !this._save(true)) {
      this.seenEncounterOutcomes = this.seenEncounterOutcomes.filter((id) => id !== encounterId);
      if (this.lastEncounterOutcome && String(this.lastEncounterOutcome.encounterId || '') === encounterId) this.lastEncounterOutcome = null;
      this.stats.encounterOutcomeSkips += 1;
      return { accepted: false, reason: durableStorage ? 'ENCOUNTER_OUTCOME_DEDUPE_PERSIST_FAILED' : 'ENCOUNTER_OUTCOME_DEDUPE_STORAGE_UNAVAILABLE', encounterId };
    }
    const eligible = outcome.learningEligible === true
      && !['CONTENT_DRIFT', 'INTERRUPTED'].includes(String(outcome.outcome || ''));
    if (!eligible) {
      this.stats.encounterOutcomeSkips += 1;
      this._save(true);
      return { accepted: false, reason: 'ENCOUNTER_OUTCOME_NOT_LEARNING_ELIGIBLE', encounterId, outcome: String(outcome.outcome || '') };
    }

    let reward = clamp(finite(outcome.score, 0.5) * 2 - 1, -1, 1);
    if (String(outcome.outcome) === 'DEATH') reward = Math.min(reward, -0.8);
    else if (String(outcome.outcome) === 'PARTY_FAILURE') reward = Math.min(reward, -0.55);
    else if (String(outcome.outcome) === 'SAFE_ABORT') reward = Math.min(reward, -0.05);
    const firstOutcome = this.outcomes === 0;
    this.rewardEma = firstOutcome ? reward : this.rewardEma * 0.88 + reward * 0.12;
    this.outcomes += 1;
    this.stats.outcomeRewards += 1;
    this.stats.encounterOutcomeRewards += 1;

    const observation = this.lastObservation;
    let trained = false;
    let loss = null;
    if (observation && observation.inputs && observation.student && BRAIN_V2_ACTIONS.includes(observation.student.action)) {
      const vector = BRAIN_V2_INPUT_NAMES.map((name) => clamp(observation.inputs[name]));
      const chosen = BRAIN_V2_ACTIONS.indexOf(observation.student.action);
      const uniform = 1 / BRAIN_V2_ACTIONS.length;
      const strength = Math.min(1, Math.max(0.2, Math.abs(reward)));
      const desired = BRAIN_V2_ACTIONS.map((_, index) => {
        const directional = reward >= 0
          ? (index === chosen ? 1 : 0)
          : (index === chosen ? 0 : 1 / Math.max(1, BRAIN_V2_ACTIONS.length - 1));
        return uniform * (1 - strength) + directional * strength;
      });
      loss = this._train(vector, desired, 'encounter-outcome');
      this.samples += 1;
      this._replayTrain();
      trained = true;
    }

    if (meta.remote !== true && this.pendingOutcome) {
      const pendingEncounterId = this.pendingOutcome.encounterId == null ? null : String(this.pendingOutcome.encounterId);
      if (pendingEncounterId == null || pendingEncounterId === encounterId) {
        this.pendingOutcome = null;
        this.stats.genericOutcomeAttributionSuppressions += 1;
      }
    }
    if (finite(observation && observation.student && observation.student.confidence, 0) > 0.72 && reward < -0.25) this.overconfidenceFailures += 1;
    else if (reward > 0) this.overconfidenceFailures = Math.max(0, this.overconfidenceFailures - 1);

    const result = {
      accepted: true,
      source: meta.remote === true ? 'remote-encounter-outcome' : 'encounter-outcome',
      at: this.now(),
      encounterId,
      outcome: String(outcome.outcome || ''),
      monster: outcome.monster == null ? null : String(outcome.monster),
      map: outcome.map == null ? null : String(outcome.map),
      pullSize: Math.max(1, Math.floor(finite(outcome.maxEngaged, 1))),
      safetyMargin: clamp(finite(outcome.safetyMargin, 0.5)),
      reward: Number(reward.toFixed(4)),
      trained,
      loss: loss == null ? null : Number(loss.toFixed(5))
    };
    this.lastEncounterOutcome = { ...safeClone(outcome), brainReward: result.reward, brainAcceptedAt: result.at, remote: meta.remote === true };
    this._diary('outcome', reward > 0.08 ? '✅' : reward < -0.08 ? '⚠️' : '📊', `Encounter ${result.outcome} ${reward >= 0 ? '+' : ''}${reward.toFixed(3)}`, `${result.monster || 'unknown'} · Pull ${result.pullSize} · Safety ${result.safetyMargin.toFixed(2)}`, reward > 0.08 ? 'good' : reward < -0.08 ? 'bad' : 'neutral', { encounterId, reward: result.reward, source: result.source });
    this._quality();
    this._leagueCheck(result);
    this._save(true);
    if (this.log) this.log.emit({ component: 'brain-v2', event: 'BRAIN_V2_ENCOUNTER_OUTCOME', data: result });
    return result;
  }

  _validationLoss(networkState = null) {
    const rows = this.replayBuffer.list(64).filter((row) => Array.isArray(row.vector) && Array.isArray(row.target));
    if (!rows.length) return null;
    const network = networkState ? new TinyStrategyNetwork(networkState) : this.network;
    return average(rows.map((row) => { const probabilities = network.forward(row.vector).probs; return -row.target.reduce((sum, expected, index) => sum + (expected > 0 ? expected * Math.log(Math.max(1e-9, probabilities[index])) : 0), 0); }), null);
  }

  _leagueEvent(kind, reason, tone = 'learn') { this.league.lastEvent = kind; this.league.lastEventAt = this.now(); this.league.lastReason = reason; this._diary('league', kind === 'rollback' ? '↩️' : '🏆', kind, reason, tone); }

  _leagueCheck(outcome = null) {
    const minimum = Math.max(32, Math.floor(this._cfg('brain.championMinSamples', 120)));
    if (!this.league.champion && this.samples >= minimum) { this.league.champion = this.network.snapshot(); this.league.championLoss = this._validationLoss(this.league.champion); this.league.generation = 1; this._leagueEvent('first_champion', 'Erster stabiler Student-Snapshot nach Mindest-Samples.', 'good'); return; }
    if (!this.league.champion) return;
    if (outcome && outcome.reward < -0.55) { this.network.restore(this.league.champion); this.league.rollbacks += 1; this._leagueEvent('rollback', `Starker negativer Reward ${outcome.reward.toFixed(3)}; Champion wiederhergestellt.`, 'bad'); return; }
    if (this.updates % 32 !== 0) return;
    const challengerLoss = this._validationLoss(), championLoss = this._validationLoss(this.league.champion);
    if (challengerLoss == null || championLoss == null) return;
    const improvement = (championLoss - challengerLoss) / Math.max(1e-6, championLoss), required = clamp(this._cfg('brain.challengerLossImprovement', 0.04), 0.005, 0.3);
    if (improvement >= required && this.rewardEma >= -0.03) { this.league.champion = this.network.snapshot(); this.league.championLoss = challengerLoss; this.league.generation += 1; this.league.promotions += 1; this._leagueEvent('promotion', `Challenger verbessert Validierungs-Loss um ${(improvement * 100).toFixed(1)}%.`, 'good'); }
    else if (improvement < -required * 1.5) { this.league.rejections += 1; this._leagueEvent('challenge_reject', `Challenger-Loss ist ${(Math.abs(improvement) * 100).toFixed(1)}% schlechter als Champion.`, 'warn'); }
  }

  teacherRequest(trigger = 'periodic') {
    if (!this.lastObservation) return null;
    return { schemaVersion: 2, trigger, brainMode: this._cfg('brain.mode', 'shadow'), quality: this.lastObservation.quality, student: this.lastObservation.student, inputs: this.lastObservation.inputs, deterministicTeacher: this.lastObservation.teacher && this.lastObservation.teacher.source === 'deterministic' ? this.lastObservation.teacher : null, party: this.runtime && this.runtime.characterRegistry && this.runtime.characterRegistry.status ? this.runtime.characterRegistry.status() : null, capabilityLearning: brainCapabilityContext(this.runtime).detail, encounterOutcome: this._latestEncounterOutcome(), economy: this.runtime && this.runtime.economyEquipmentAutonomyV2 && this.runtime.economyEquipmentAutonomyV2.status ? this.runtime.economyEquipmentAutonomyV2.status() : null, performance: performanceStatus(this.runtime), policies: { survivalFirst: true, gearDominantStrengthModel: true, characterLevelStrengthRole: 'MINOR_CONTEXT_ONLY', directActionAuthority: false, deterministicSafetyCannotBeOverridden: true, adaptivePullCannotExceedHardCapacity: true } };
  }

  shouldAskTeacher() {
    if (!this._cfg('brain.teacherEnabled', true) || !this.lastObservation) return false;
    const age = this.remoteTeacherAt ? this.now() - this.remoteTeacherAt : Infinity, minInterval = Math.max(5000, finite(this._cfg('brain.teacherMinIntervalMs', 30000), 30000)), maxInterval = Math.max(minInterval, finite(this._cfg('brain.teacherMaxIntervalMs', 300000), 300000));
    if (age < minInterval) return false;
    if (age >= maxInterval) return true;
    return this.lastObservation.student.entropy >= this._cfg('brain.entropyTeacherThreshold', 0.72) || this.lastObservation.student.novelty >= this._cfg('brain.noveltyTeacherThreshold', 0.45) || ['watch', 'degraded', 'quarantine'].includes(this.quality.state);
  }

  replay(limit = 32) { return this.replayBuffer.list(limit); }

  exportState() { return { schemaVersion: 2, mode: BRAIN_V2_MODE, savedAt: this.now(), network: this.network.snapshot(), samples: this.samples, updates: this.updates, outcomes: this.outcomes, rewardEma: this.rewardEma, lossEma: this.lossEma, agreementEma: this.agreementEma, league: safeClone(this.league), quality: safeClone(this.quality), lastEncounterOutcome: safeClone(this.lastEncounterOutcome), seenEncounterOutcomes: this.seenEncounterOutcomes.slice(-128), diary: this.diary.slice(-Math.max(20, Math.floor(this._cfg('brain.diaryMaxEntries', 100)))) }; }

  importState(state) {
    if (!state || Number(state.schemaVersion) !== 2 || !state.network) return false;
    const incomingSamples = Math.max(0, Math.floor(finite(state.samples, 0)));
    if (incomingSamples < this.samples || !this.network.restore(state.network)) return false;
    this.samples = incomingSamples; this.updates = Math.max(this.updates, Math.floor(finite(state.updates, 0))); this.outcomes = Math.max(this.outcomes, Math.floor(finite(state.outcomes, 0))); this.rewardEma = finite(state.rewardEma, this.rewardEma); this.lossEma = state.lossEma == null ? this.lossEma : finite(state.lossEma); this.agreementEma = state.agreementEma == null ? this.agreementEma : finite(state.agreementEma);
    if (Array.isArray(state.seenEncounterOutcomes)) {
      this.seenEncounterOutcomes = [...new Set([...this.seenEncounterOutcomes, ...state.seenEncounterOutcomes.map(String).filter(Boolean)])].slice(-128);
    }
    this._save(true); return true;
  }

  status() {
    const quality = this._quality();
    return { schemaVersion: 2, mode: BRAIN_V2_MODE, operatingMode: this._cfg('brain.mode', 'shadow'), enabled: this._cfg('brain.enabled', true), actionAuthority: false, directActionAccess: false, executorBypassAllowed: false,
      architecture: { inputs: BRAIN_V2_INPUT_NAMES.length, inputNames: BRAIN_V2_INPUT_NAMES.slice(), hidden: HIDDEN_SIZE, outputs: BRAIN_V2_ACTIONS.length, actions: BRAIN_V2_ACTIONS.slice() },
      student: { samples: this.samples, updates: this.updates, outcomes: this.outcomes, lossEma: this.lossEma == null ? null : Number(this.lossEma.toFixed(5)), rewardEma: Number(this.rewardEma.toFixed(5)), agreementEma: this.agreementEma == null ? null : Number(this.agreementEma.toFixed(5)), lastTrainAt: this.lastTrainAt, replay: this.replayBuffer.status() },
      teacher: { remoteAvailable: !!this.remoteTeacher, lastAt: this.remoteTeacherAt, ageMs: this.remoteTeacherAt ? this.now() - this.remoteTeacherAt : null, lastDecision: safeClone(this.remoteTeacher), shouldAsk: this.shouldAskTeacher() }, quality,
      league: { generation: this.league.generation, hasChampion: !!this.league.champion, championLoss: this.league.championLoss, promotions: this.league.promotions, rollbacks: this.league.rollbacks, rejections: this.league.rejections, lastEvent: this.league.lastEvent, lastEventAt: this.league.lastEventAt, lastReason: this.league.lastReason },
      current: this.lastObservation, lastRecommendation: this.lastObservation, lastEncounterOutcome: safeClone(this.lastEncounterOutcome), seenEncounterOutcomes: this.seenEncounterOutcomes.length, pendingOutcome: this.pendingOutcome ? { startedAt: this.pendingOutcome.startedAt, dueAt: this.pendingOutcome.dueAt, action: this.pendingOutcome.action, target: this.pendingOutcome.target, encounterId: this.pendingOutcome.encounterId || null } : null,
      diary: { entries: this.diary.slice(-40), total: this.diary.length }, persistence: { key: STORAGE_KEY, disabled: this.persistenceDisabled, lastError: this.persistenceError }, stats: { ...this.stats }, policies: { strategicOnly: true, gearDominantStrengthModel: true, characterLevelStrengthRole: 'MINOR_CONTEXT_ONLY', deterministicCombatSafetyAuthoritative: true, dangerousContentCannotBeOverridden: true, commandCharacterAuthorityWidened: false, cloudFailureSafe: true } };
  }
}

module.exports = { BRAIN_V2_MODE, BRAIN_V2_ACTIONS, BRAIN_V2_INPUT_NAMES, TinyStrategyNetwork, BrainStateEncoderV2, StrategicBrainV2, scoreVector };
