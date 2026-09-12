'use strict';

const ACTIONS = Object.freeze(['continue', 'change_farm_target', 'replan_merchant', 'explore', 'wait']);

const FEATURE_NAMES = Object.freeze([
  'hp_ratio', 'mp_ratio', 'inventory_fill', 'free_inventory_ratio', 'gold_log',
  'party_size_ratio', 'party_alive_ratio', 'xp_rate_norm', 'gold_rate_norm', 'kills_rate_norm',
  'deaths_rate_norm', 'potions_rate_norm', 'damage_taken_norm', 'visible_monsters_norm', 'self_aggro_norm',
  'competition_norm', 'content_quarantine_norm', 'farm_confidence', 'farm_safety', 'movement_circuit_open',
  'movement_failure_norm', 'persistence_health', 'headless_health', 'snapshot_freshness', 'progress_freshness',
  'planner_candidates_norm', 'world_known_norm', 'novelty_norm', 'replay_fill', 'map_hash',
  'target_hash', 'utc_day_fraction'
]);

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function ratio(value, max, fallback = 1) { const d = finite(max, 0); return d > 0 ? clamp01(finite(value, 0) / d) : fallback; }
function rateNorm(value, scale) { return clamp01(Math.log1p(Math.max(0, finite(value, 0))) / Math.log1p(scale)); }
function hash01(value) {
  const text = String(value == null ? '' : value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

class StrategicFeatureEncoder {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
  }

  encode(context = {}) {
    const snapshot = context.snapshot || {};
    const c = snapshot.character || {};
    const inventory = Array.isArray(c.inventory) ? c.inventory : [];
    const capacity = Math.max(1, inventory.length || 42);
    const occupied = inventory.filter(Boolean).length;
    const party = context.party && Array.isArray(context.party.members) ? context.party.members : [];
    const partySize = Math.max(1, party.length || 1);
    const partyAlive = party.filter((member) => member && member.rip !== true).length || 1;
    const performance = context.performance && context.performance.current || {};
    const rates = performance.rates || {};
    const entities = Array.isArray(snapshot.entities) ? snapshot.entities : [];
    const visibleMonsters = entities.filter((entity) => entity && entity.mtype && !entity.dead && (entity.hp == null || Number(entity.hp) > 0));
    const selfAggro = visibleMonsters.filter((entity) => entity.target && entity.target === c.name).length;
    const friendly = new Set([c.name, ...party.map((member) => member && member.name).filter(Boolean)]);
    const competition = visibleMonsters.filter((entity) => entity.target && !friendly.has(entity.target)).length;
    const content = context.contentSafety || {};
    const counts = content.counts || {};
    const contentTotal = Math.max(1, finite(counts.LEGACY_ALLOWED) + finite(counts.APPROVED) + finite(counts.QUARANTINED));
    const local = context.localFarming || {};
    const movement = context.movement || {};
    const persistence = context.persistence || {};
    const health = context.headlessHealth || {};
    const progress = context.progress || {};
    const world = context.world || {};
    const replay = context.replay || {};
    const now = this.now();
    const observedAt = finite(snapshot.observedAt, now);
    const snapshotAge = Math.max(0, now - observedAt);
    const progressAge = Math.max(0, finite(progress.progressAgeMs, 0));
    const target = context.targetType || (context.farmer && context.farmer.targetType) || null;
    const localConfidence = local.goal && Number.isFinite(Number(local.goal.confidence)) ? Number(local.goal.confidence) : 0;
    const farmSafety = clamp01(1 - Math.min(1, finite(rates.deathsPerHour) / 2));

    const values = [
      ratio(c.hp, c.max_hp),
      ratio(c.mp, c.max_mp),
      clamp01(occupied / capacity),
      clamp01((capacity - occupied) / capacity),
      clamp01(Math.log10(Math.max(1, finite(c.gold, 0) + 1)) / 8),
      clamp01(partySize / 4),
      clamp01(partyAlive / partySize),
      rateNorm(rates.xpPerHour, 100000000),
      rateNorm(rates.goldPerHour, 10000000),
      rateNorm(rates.killsPerHour, 10000),
      clamp01(finite(rates.deathsPerHour) / 5),
      clamp01(finite(rates.potionsPerHour) / 1000),
      rateNorm(rates.damageTakenPerHour, 10000000),
      clamp01(visibleMonsters.length / 20),
      clamp01(selfAggro / 6),
      clamp01(competition / 12),
      clamp01(finite(counts.QUARANTINED) / contentTotal),
      clamp01(localConfidence),
      farmSafety,
      movement.circuitOpen ? 1 : 0,
      clamp01(finite(movement.failureStreak) / Math.max(1, finite(movement.maxFailures, 3))),
      persistence.saveCircuitOpen || finite(persistence.loadFailureStreak) > 0 ? 0 : 1,
      health.state === 'DEGRADED' ? 0 : health.state === 'WATCH' ? 0.5 : 1,
      clamp01(1 - snapshotAge / 30000),
      clamp01(1 - progressAge / Math.max(1, finite(progress.degradedAfterMs, 180000))),
      clamp01(finite(local.candidateCount) / 20),
      clamp01(finite(world.entities) / 5000),
      clamp01(finite(context.noveltyCount) / 20),
      clamp01(finite(replay.size) / Math.max(1, finite(replay.capacity, 512))),
      hash01(c.map),
      hash01(target),
      ((new Date(now).getUTCHours() * 3600 + new Date(now).getUTCMinutes() * 60 + new Date(now).getUTCSeconds()) / 86400)
    ].map((value) => clamp01(Number.isFinite(Number(value)) ? Number(value) : 0));

    if (values.length !== FEATURE_NAMES.length) throw new Error(`feature encoder produced ${values.length}, expected ${FEATURE_NAMES.length}`);
    return values;
  }

  named(context = {}) {
    const values = this.encode(context);
    const out = {};
    FEATURE_NAMES.forEach((name, index) => { out[name] = values[index]; });
    return out;
  }

  status() { return { featureCount: FEATURE_NAMES.length, featureNames: [...FEATURE_NAMES] }; }
}

class SeededRandom {
  constructor(seed = 0x5f3759df) { this.state = (Number(seed) >>> 0) || 1; }
  next() {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }
}

function zeros(rows, cols) { return Array.from({ length: rows }, () => Array(cols).fill(0)); }
function vectorZeros(n) { return Array(n).fill(0); }
function clip(value, limit) { return Math.max(-limit, Math.min(limit, value)); }
function normalizeTarget(target) {
  const values = Array.from({ length: ACTIONS.length }, (_, i) => Math.max(0, finite(target && target[i], 0)));
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) return values.map((_, i) => i === 0 ? 1 : 0);
  return values.map((value) => value / sum);
}

class StudentNetwork {
  constructor(options = {}) {
    this.inputSize = FEATURE_NAMES.length;
    this.hiddenSize = Math.max(4, Math.min(128, Number(options.hiddenSize) || 24));
    this.outputSize = ACTIONS.length;
    this.learningRate = Math.max(0.0001, Math.min(0.2, Number(options.learningRate) || 0.012));
    this.l2 = Math.max(0, Math.min(0.1, Number(options.l2) || 0.0001));
    this.gradientClip = Math.max(0.1, Math.min(10, Number(options.gradientClip) || 1));
    this.rng = options.rng || new SeededRandom(options.seed == null ? 0x39a9b17 : options.seed);
    this.w1 = zeros(this.hiddenSize, this.inputSize);
    this.b1 = vectorZeros(this.hiddenSize);
    this.w2 = zeros(this.outputSize, this.hiddenSize);
    this.b2 = vectorZeros(this.outputSize);
    this.updates = 0;
    this.lossEma = null;
    this._init();
  }

  _init() {
    const limit1 = Math.sqrt(6 / (this.inputSize + this.hiddenSize));
    const limit2 = Math.sqrt(6 / (this.hiddenSize + this.outputSize));
    for (let i = 0; i < this.hiddenSize; i += 1) for (let j = 0; j < this.inputSize; j += 1) this.w1[i][j] = (this.rng.next() * 2 - 1) * limit1;
    for (let i = 0; i < this.outputSize; i += 1) for (let j = 0; j < this.hiddenSize; j += 1) this.w2[i][j] = (this.rng.next() * 2 - 1) * limit2;
  }

  _forward(features) {
    if (!Array.isArray(features) || features.length !== this.inputSize) throw new Error(`expected ${this.inputSize} features`);
    const x = features.map((v) => clamp01(v));
    const hidden = this.w1.map((row, i) => Math.tanh(row.reduce((sum, w, j) => sum + w * x[j], this.b1[i])));
    const logits = this.w2.map((row, i) => row.reduce((sum, w, j) => sum + w * hidden[j], this.b2[i]));
    return { x, hidden, logits };
  }

  predict(features, mask = null) {
    const { hidden, logits } = this._forward(features);
    const allowed = Array.from({ length: this.outputSize }, (_, i) => !mask || mask[i] !== false);
    if (!allowed.some(Boolean)) allowed[0] = true;
    const masked = logits.map((value, i) => allowed[i] ? value : -1e9);
    const max = Math.max(...masked);
    const exps = masked.map((value, i) => allowed[i] ? Math.exp(value - max) : 0);
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    const probabilities = exps.map((value) => value / sum);
    let best = 0;
    for (let i = 1; i < probabilities.length; i += 1) if (probabilities[i] > probabilities[best]) best = i;
    const entropy = -probabilities.reduce((acc, p) => p > 0 ? acc + p * Math.log(p) : acc, 0) / Math.log(this.outputSize);
    return { action: ACTIONS[best], actionIndex: best, confidence: probabilities[best], probabilities, entropy: clamp01(entropy), hidden };
  }

  train(features, target, options = {}) {
    const targetDistribution = normalizeTarget(target);
    const { x, hidden, logits } = this._forward(features);
    const max = Math.max(...logits);
    const exps = logits.map((value) => Math.exp(value - max));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    const probabilities = exps.map((value) => value / sum);
    const eps = 1e-12;
    const loss = -targetDistribution.reduce((acc, t, i) => acc + t * Math.log(Math.max(eps, probabilities[i])), 0);
    const dLogits = probabilities.map((p, i) => p - targetDistribution[i]);
    const dHidden = vectorZeros(this.hiddenSize);
    for (let i = 0; i < this.outputSize; i += 1) {
      for (let j = 0; j < this.hiddenSize; j += 1) dHidden[j] += dLogits[i] * this.w2[i][j];
    }
    const rate = Math.max(0.00001, Math.min(0.2, Number(options.learningRate) || this.learningRate));
    for (let i = 0; i < this.outputSize; i += 1) {
      for (let j = 0; j < this.hiddenSize; j += 1) {
        const grad = clip(dLogits[i] * hidden[j] + this.l2 * this.w2[i][j], this.gradientClip);
        this.w2[i][j] -= rate * grad;
      }
      this.b2[i] -= rate * clip(dLogits[i], this.gradientClip);
    }
    for (let j = 0; j < this.hiddenSize; j += 1) {
      const local = dHidden[j] * (1 - hidden[j] * hidden[j]);
      for (let k = 0; k < this.inputSize; k += 1) {
        const grad = clip(local * x[k] + this.l2 * this.w1[j][k], this.gradientClip);
        this.w1[j][k] -= rate * grad;
      }
      this.b1[j] -= rate * clip(local, this.gradientClip);
    }
    this.updates += 1;
    this.lossEma = this.lossEma == null ? loss : this.lossEma * 0.95 + loss * 0.05;
    return { loss, probabilities };
  }

  clone() {
    const copy = new StudentNetwork({ hiddenSize: this.hiddenSize, learningRate: this.learningRate, l2: this.l2, gradientClip: this.gradientClip, seed: 1 });
    copy.restore(this.export());
    return copy;
  }

  export() {
    const round = (value) => Number(Number(value).toFixed(7));
    return {
      schemaVersion: 1,
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      learningRate: this.learningRate,
      l2: this.l2,
      gradientClip: this.gradientClip,
      updates: this.updates,
      lossEma: this.lossEma,
      w1: this.w1.map((row) => row.map(round)),
      b1: this.b1.map(round),
      w2: this.w2.map((row) => row.map(round)),
      b2: this.b2.map(round)
    };
  }

  restore(data) {
    if (!data || data.schemaVersion !== 1 || Number(data.inputSize) !== this.inputSize || Number(data.outputSize) !== this.outputSize || Number(data.hiddenSize) !== this.hiddenSize) throw new Error('incompatible student model');
    const matrix = (value, rows, cols) => {
      if (!Array.isArray(value) || value.length !== rows || value.some((row) => !Array.isArray(row) || row.length !== cols || row.some((v) => !Number.isFinite(Number(v))))) throw new Error('invalid student weights');
      return value.map((row) => row.map(Number));
    };
    const vector = (value, size) => {
      if (!Array.isArray(value) || value.length !== size || value.some((v) => !Number.isFinite(Number(v)))) throw new Error('invalid student bias');
      return value.map(Number);
    };
    this.w1 = matrix(data.w1, this.hiddenSize, this.inputSize);
    this.b1 = vector(data.b1, this.hiddenSize);
    this.w2 = matrix(data.w2, this.outputSize, this.hiddenSize);
    this.b2 = vector(data.b2, this.outputSize);
    this.updates = Math.max(0, Number(data.updates) || 0);
    this.lossEma = data.lossEma == null ? null : finite(data.lossEma, null);
    return this;
  }

  status() { return { architecture: `${this.inputSize}-${this.hiddenSize}-${this.outputSize}`, updates: this.updates, learningRate: this.learningRate, l2: this.l2, gradientClip: this.gradientClip, lossEma: this.lossEma }; }
}

class PrioritizedReplayBuffer {
  constructor(options = {}) {
    this.capacity = Math.max(32, Math.min(4096, Number(options.capacity) || 512));
    this.alpha = Math.max(0, Math.min(2, Number(options.alpha) || 0.7));
    this.rng = options.rng || new SeededRandom(options.seed == null ? 0x7419 : options.seed);
    this.samples = [];
    this.nextId = 1;
  }

  add(sample = {}, priority = null) {
    if (!Array.isArray(sample.features) || sample.features.length !== FEATURE_NAMES.length) throw new Error('replay sample requires 32 features');
    const resolvedPriority = Math.max(0.001, finite(priority, Math.abs(finite(sample.reward, 0)) + finite(sample.loss, 0) + 0.05));
    const row = { ...sample, id: sample.id || `replay-${this.nextId++}`, features: sample.features.map((v) => clamp01(v)), priority: resolvedPriority, addedAt: sample.addedAt || Date.now() };
    this.samples.push(row);
    if (this.samples.length > this.capacity) this.samples.splice(0, this.samples.length - this.capacity);
    return row;
  }

  updatePriority(id, priority) {
    const row = this.samples.find((sample) => sample.id === id);
    if (!row) return false;
    row.priority = Math.max(0.001, finite(priority, row.priority));
    return true;
  }

  sample(count = 8) {
    const n = Math.max(0, Math.min(this.samples.length, Number(count) || 0));
    if (!n) return [];
    const weights = this.samples.map((sample) => Math.pow(Math.max(0.001, sample.priority), this.alpha));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const out = [];
    for (let k = 0; k < n; k += 1) {
      let needle = this.rng.next() * total;
      let selected = this.samples[this.samples.length - 1];
      for (let i = 0; i < this.samples.length; i += 1) {
        needle -= weights[i];
        if (needle <= 0) { selected = this.samples[i]; break; }
      }
      out.push(selected);
    }
    return out;
  }

  validationSet(limit = 64) {
    const rows = this.samples.filter((sample, index) => index % 5 === 0);
    return rows.slice(Math.max(0, rows.length - Math.max(1, Number(limit) || 64)));
  }

  export(limit = 128) {
    const rows = this.samples.slice(-Math.max(0, Math.min(this.capacity, Number(limit) || 0))).map((sample) => ({ ...sample }));
    return { schemaVersion: 1, capacity: this.capacity, nextId: this.nextId, samples: rows };
  }

  restore(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.samples)) throw new Error('invalid replay state');
    this.samples = [];
    for (const sample of data.samples.slice(-this.capacity)) this.add(sample, sample.priority);
    this.nextId = Math.max(this.nextId, Number(data.nextId) || this.nextId);
    return this;
  }

  status() { return { size: this.samples.length, capacity: this.capacity, fillRatio: this.samples.length / this.capacity }; }
}

module.exports = { ACTIONS, FEATURE_NAMES, StrategicFeatureEncoder, StudentNetwork, PrioritizedReplayBuffer, SeededRandom, clamp01, hash01, normalizeTarget };
