'use strict';

const GEAR_PROGRESSION_SCHEMA_VERSION = 1;
const GEAR_PROGRESSION_MODE = 'shadow-planning-only';

const CLASS_WEIGHTS = Object.freeze({
  warrior: { attack: 1.0, armor: 1.25, resistance: 0.85, hp: 0.04, str: 0.8, dex: 0.2, int: 0.1, crit: 0.3, evasion: 0.2, speed: 0.15 },
  paladin: { attack: 0.9, armor: 1.15, resistance: 1.15, hp: 0.05, str: 0.65, int: 0.45, crit: 0.2, speed: 0.1 },
  ranger: { attack: 1.1, armor: 0.55, resistance: 0.55, hp: 0.025, dex: 0.9, crit: 0.45, speed: 0.2, range: 0.12, frequency: 0.4 },
  rogue: { attack: 1.15, armor: 0.5, resistance: 0.45, hp: 0.02, dex: 0.95, crit: 0.55, evasion: 0.35, speed: 0.25, frequency: 0.45 },
  mage: { attack: 1.1, armor: 0.35, resistance: 0.75, hp: 0.02, mp: 0.025, int: 1.0, crit: 0.25, speed: 0.1, range: 0.1 },
  priest: { attack: 0.75, armor: 0.45, resistance: 1.0, hp: 0.04, mp: 0.03, int: 0.9, speed: 0.1, range: 0.08 },
  merchant: { attack: 0.3, armor: 0.7, resistance: 0.7, hp: 0.04, str: 0.15, dex: 0.15, int: 0.15, speed: 0.3 }
});

const DEFAULT_WEIGHTS = Object.freeze({ attack: 1, armor: 0.7, resistance: 0.7, hp: 0.03, mp: 0.015, str: 0.35, dex: 0.35, int: 0.35, vit: 0.4, crit: 0.25, evasion: 0.2, speed: 0.15, range: 0.08, frequency: 0.3 });

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function levelOf(item) {
  return Math.max(0, Math.floor(finite(item && item.level, 0)));
}

function compatible(meta, character) {
  if (!meta || !character) return false;
  const classes = Array.isArray(meta.class) ? meta.class : meta.class ? [meta.class] : [];
  if (classes.length && !classes.map((x) => String(x).toLowerCase()).includes(String(character.ctype || '').toLowerCase())) return false;
  const required = finite(meta.level, 0);
  if (required > finite(character.level, 0)) return false;
  return true;
}

function candidateSlots(meta) {
  if (!meta || typeof meta !== 'object') return [];
  const type = String(meta.type || '').toLowerCase();
  const map = {
    helmet: ['helmet'], chest: ['chest'], pants: ['pants'], shoes: ['shoes'], gloves: ['gloves'], cape: ['cape'],
    amulet: ['amulet'], belt: ['belt'], orb: ['orb'], ring: ['ring1', 'ring2'], earring: ['earring1', 'earring2']
  };
  if (map[type]) return map[type];
  if (type === 'weapon') return ['mainhand'];
  if (type === 'shield' || type === 'source' || type === 'quiver') return ['offhand'];
  return [];
}

function effectiveStats(meta, level) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  const skip = new Set(['g', 'gold', 'cash', 'level', 'type', 'wtype', 'name', 'skin', 'description', 'class', 'grades', 'upgrade', 'compound']);
  for (const [key, value] of Object.entries(meta)) {
    if (skip.has(key)) continue;
    const n = finite(value);
    if (n != null) out[key] = n;
  }
  const upgrade = meta.upgrade && typeof meta.upgrade === 'object' ? meta.upgrade : {};
  for (const [key, value] of Object.entries(upgrade)) {
    const n = finite(value);
    if (n == null) continue;
    out[key] = finite(out[key], 0) + n * Math.max(0, level);
  }
  return out;
}

function scoreItem(meta, level, ctype) {
  const weights = CLASS_WEIGHTS[String(ctype || '').toLowerCase()] || DEFAULT_WEIGHTS;
  const stats = effectiveStats(meta, level);
  let total = 0;
  let survival = 0;
  for (const [key, value] of Object.entries(stats)) {
    const weight = finite(weights[key], finite(DEFAULT_WEIGHTS[key], 0));
    total += value * weight;
    if (['armor', 'resistance', 'hp', 'vit', 'evasion', 'reflection'].includes(key)) survival += value * Math.max(weight, 0);
  }
  return { total, survival, stats };
}

class GearProgressionEvaluator {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'aio-v3-gear-progression-v1';
    this.capacity = Math.max(16, Math.min(512, Math.floor(finite(options.capacity, 128))));
    this.maxProbeLevel = Math.max(1, Math.min(20, Math.floor(finite(options.maxProbeLevel, 12))));
    this.minImprovementRatio = Math.max(0.01, Math.min(1, finite(options.minImprovementRatio, 0.05)));
    this.goals = new Map();
    this.loaded = false;
    this.lastEvaluatedAt = null;
    this.lastEvaluation = null;
    this.lastSavedAt = null;
    this.stats = { evaluations: 0, candidates: 0, goalsCreated: 0, goalsUpdated: 0, blockedUnknownContent: 0, loadErrors: 0, saveErrors: 0, pruned: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'gear-progression', event, severity, reason, data });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    const ls = this.root && this.root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') return { get: (key) => ls.getItem(key), set: (key, value) => ls.setItem(key, value) };
    return null;
  }

  _registryRows(registry) {
    if (!registry) return [];
    const status = typeof registry.status === 'function' ? registry.status() : registry;
    return Array.isArray(status && status.characters) ? status.characters : [];
  }

  _unsafe(contentDrift, name) {
    try {
      return !!(contentDrift && typeof contentDrift.requiresRevalidation === 'function' && contentDrift.requiresRevalidation('items', name));
    } catch (_) { return true; }
  }

  _currentItem(character, slot, gameData) {
    const equipped = character && character.gear && character.gear[slot];
    if (!equipped || !equipped.name) return { name: null, level: 0, score: { total: 0, survival: 0, stats: {} } };
    const meta = gameData && gameData.items && gameData.items[equipped.name];
    return { name: equipped.name, level: levelOf(equipped), score: scoreItem(meta, levelOf(equipped), character.ctype) };
  }

  _firstMeaningful(meta, observedLevel, currentScore, ctype) {
    const start = Math.max(0, observedLevel);
    const max = meta && meta.upgrade ? Math.max(start, this.maxProbeLevel) : start;
    const threshold = currentScore.total <= 0 ? 0.001 : currentScore.total * (1 + this.minImprovementRatio);
    for (let level = start; level <= max; level += 1) {
      const score = scoreItem(meta, level, ctype);
      if (score.total > threshold) return { level, score };
    }
    return null;
  }

  _goalId(character, slot, item, targetLevel) {
    return `${character}:${slot}:${item}:${targetLevel}`;
  }

  _prune() {
    if (this.goals.size <= this.capacity) return;
    const rows = [...this.goals.entries()].sort((a, b) => finite(a[1].lastSeenAt, 0) - finite(b[1].lastSeenAt, 0));
    while (this.goals.size > this.capacity && rows.length) {
      this.goals.delete(rows.shift()[0]);
      this.stats.pruned += 1;
    }
  }

  evaluate(context = {}) {
    const now = this.now();
    const gameData = context.gameData || {};
    const characters = this._registryRows(context.registry).filter((row) => row && row.name && row.ctype);
    const candidates = [];
    for (const source of characters) {
      for (const item of Array.isArray(source.inventory) ? source.inventory : []) {
        if (!item || !item.name) continue;
        const meta = gameData.items && gameData.items[item.name];
        if (!meta || typeof meta !== 'object') continue;
        const slots = candidateSlots(meta);
        if (!slots.length) continue;
        candidates.push({ sourceCharacter: source.name, item, meta, slots });
      }
    }
    this.stats.candidates += candidates.length;
    const seenGoalIds = new Set();
    let blockedUnknownContent = 0;

    for (const character of characters) {
      for (const candidate of candidates) {
        if (!compatible(candidate.meta, character)) continue;
        if (this._unsafe(context.contentDrift, candidate.item.name)) { blockedUnknownContent += 1; continue; }
        let best = null;
        for (const slot of candidate.slots) {
          const current = this._currentItem(character, slot, gameData);
          const meaningful = this._firstMeaningful(candidate.meta, levelOf(candidate.item), current.score, character.ctype);
          if (!meaningful) continue;
          const improvement = meaningful.score.total - current.score.total;
          const survivalImprovement = meaningful.score.survival - current.score.survival;
          const row = { slot, current, meaningful, improvement, survivalImprovement };
          if (!best || row.improvement > best.improvement || (row.improvement === best.improvement && row.survivalImprovement > best.survivalImprovement)) best = row;
        }
        if (!best) continue;
        const targetLevel = best.meaningful.level;
        const id = this._goalId(character.name, best.slot, candidate.item.name, targetLevel);
        seenGoalIds.add(id);
        const existing = this.goals.get(id);
        const goal = {
          schemaVersion: GEAR_PROGRESSION_SCHEMA_VERSION,
          id,
          character: character.name,
          ctype: character.ctype,
          slot: best.slot,
          sourceCharacter: candidate.sourceCharacter,
          item: candidate.item.name,
          observedLevel: levelOf(candidate.item),
          targetLevel,
          currentItem: best.current.name,
          currentLevel: best.current.level,
          currentScore: best.current.score.total,
          targetScore: best.meaningful.score.total,
          improvement: best.improvement,
          survivalImprovement: best.survivalImprovement,
          projectedUpgradeRequired: targetLevel > levelOf(candidate.item),
          feasibility: targetLevel > levelOf(candidate.item) ? 'MATERIALS_AND_RISK_UNMODELED' : 'HELD_AND_READY_FOR_LATER_EXECUTOR',
          priority: best.survivalImprovement > 0 ? 'SURVIVABILITY_OR_MIXED' : 'FARMING_EFFICIENCY',
          actionAuthority: false,
          firstSeenAt: existing ? existing.firstSeenAt : now,
          lastSeenAt: now
        };
        this.goals.set(id, goal);
        if (existing) this.stats.goalsUpdated += 1; else this.stats.goalsCreated += 1;
      }
    }

    for (const [id, goal] of this.goals.entries()) {
      if (!seenGoalIds.has(id) && now - finite(goal.lastSeenAt, now) > 24 * 60 * 60 * 1000) this.goals.delete(id);
    }
    this._prune();
    this.stats.blockedUnknownContent += blockedUnknownContent;
    this.stats.evaluations += 1;
    this.lastEvaluatedAt = now;

    const goals = this.list(this.capacity);
    const reservations = new Map();
    for (const goal of goals) {
      const key = `${goal.item}:${goal.observedLevel}`;
      const current = reservations.get(key) || { name: goal.item, level: goal.observedLevel, quantity: 0, goalIds: [] };
      current.quantity += 1;
      current.goalIds.push(goal.id);
      reservations.set(key, current);
    }
    this.lastEvaluation = { at: now, characters: characters.length, candidates: candidates.length, activeGoals: goals.length, blockedUnknownContent };
    this.save();
    return { status: this.status(), goals, reservations: [...reservations.values()].map(clone) };
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== GEAR_PROGRESSION_SCHEMA_VERSION || !Array.isArray(data.goals)) throw new Error('unsupported gear progression schema');
      this.goals = new Map(data.goals.filter((row) => Array.isArray(row) && row.length === 2));
      this._prune();
      return true;
    } catch (error) {
      this.goals.clear();
      this.stats.loadErrors += 1;
      this._event('GEAR_PROGRESSION_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', { message: String(error && error.message || error) });
      return false;
    }
  }

  serialize() {
    return JSON.stringify({ schemaVersion: GEAR_PROGRESSION_SCHEMA_VERSION, savedAt: this.now(), goals: [...this.goals.entries()] });
  }

  save(options = {}) {
    const backend = this._backend();
    if (!backend) return false;
    const now = this.now();
    if (options.force !== true && this.lastSavedAt != null && now - this.lastSavedAt < 30000) return false;
    try {
      backend.set(this.key, this.serialize());
      this.lastSavedAt = now;
      return true;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('GEAR_PROGRESSION_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', { message: String(error && error.message || error) });
      return false;
    }
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.capacity, Math.floor(finite(limit, 100))));
    return [...this.goals.values()]
      .sort((a, b) => b.survivalImprovement - a.survivalImprovement || b.improvement - a.improvement || a.id.localeCompare(b.id))
      .slice(0, n)
      .map(clone);
  }

  status() {
    return {
      schemaVersion: GEAR_PROGRESSION_SCHEMA_VERSION,
      mode: GEAR_PROGRESSION_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      destructiveActionsEnabled: false,
      defaultProgressionMode: 'sustainable',
      capacity: this.capacity,
      maxProbeLevel: this.maxProbeLevel,
      minImprovementRatio: this.minImprovementRatio,
      goals: this.goals.size,
      lastEvaluatedAt: this.lastEvaluatedAt,
      lastEvaluation: clone(this.lastEvaluation),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  GearProgressionEvaluator,
  GEAR_PROGRESSION_SCHEMA_VERSION,
  GEAR_PROGRESSION_MODE,
  CLASS_WEIGHTS,
  effectiveStats,
  scoreItem,
  candidateSlots
};
