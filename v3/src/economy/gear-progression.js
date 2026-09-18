'use strict';

const GEAR_PROGRESSION_SCHEMA_VERSION = 1;
const GEAR_PROGRESSION_MODE = 'shadow-planning-only';
const FARMER_UPGRADE_MAX_LEVEL = 5;
const ECONOMIC_UPGRADE_FALLBACK_LEVEL = 3;

const CLASS_WEIGHTS = Object.freeze({
  warrior: { attack: 1.0, armor: 1.25, resistance: 0.85, hp: 0.04, str: 0.8, dex: 0.2, int: 0.1, crit: 0.3, evasion: 0.2, speed: 0.15 },
  paladin: { attack: 0.9, armor: 1.15, resistance: 1.15, hp: 0.05, str: 0.65, int: 0.45, crit: 0.2, speed: 0.1 },
  ranger: { attack: 1.1, armor: 0.55, resistance: 0.55, hp: 0.025, dex: 0.9, crit: 0.45, speed: 0.2, range: 0.12, frequency: 0.4 },
  rogue: { attack: 1.15, armor: 0.5, resistance: 0.45, hp: 0.02, dex: 0.95, crit: 0.55, evasion: 0.35, speed: 0.25, frequency: 0.45 },
  mage: { attack: 1.1, armor: 0.35, resistance: 0.75, hp: 0.02, mp: 0.025, int: 1.0, crit: 0.25, speed: 0.1, range: 0.1 },
  priest: { attack: 0.75, armor: 0.45, resistance: 1.0, hp: 0.04, mp: 0.03, int: 0.9, speed: 0.1, range: 0.08 },
  merchant: { attack: 0.3, armor: 0.7, resistance: 0.7, hp: 0.04, str: 0.15, dex: 0.15, int: 0.15, speed: 10.0 }
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
  const ctype = String(character.ctype || '').toLowerCase();
  const classes = Array.isArray(meta.class) ? meta.class : meta.class ? [meta.class] : [];
  if (classes.length && !classes.map((x) => String(x).toLowerCase()).includes(ctype)) return false;
  const required = finite(meta.level, 0);
  if (required > finite(character.level, 0)) return false;

  // Live alpha.20.107 proved that a raw shield can score above a Ranger's
  // quiver while Adventure Land rejects the actual equip command. Do not turn
  // a stat-only offhand comparison into an impossible Ranger gear goal.
  if (ctype === 'ranger' && String(meta.type || '').toLowerCase() === 'shield') return false;
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
  // Adventure Land uses the same item level field for both upgradeable and
  // compoundable equipment. Their per-level stat deltas live in different
  // metadata objects, so score the mechanic that actually applies to the item.
  const progression = meta.upgrade && typeof meta.upgrade === 'object'
    ? meta.upgrade
    : meta.compound && typeof meta.compound === 'object'
      ? meta.compound
      : {};
  for (const [key, value] of Object.entries(progression)) {
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

function scoreImprovement(currentScore, targetScore, ctype, minImprovementRatio = 0) {
  const current = currentScore || { total: 0, survival: 0, stats: {} };
  const target = targetScore || { total: 0, survival: 0, stats: {} };
  const improvement = finite(target.total, 0) - finite(current.total, 0);
  const survivalImprovement = finite(target.survival, 0) - finite(current.survival, 0);
  const currentSpeed = finite(current.stats && current.stats.speed, 0);
  const targetSpeed = finite(target.stats && target.stats.speed, 0);
  const speedImprovement = targetSpeed - currentSpeed;
  const merchant = String(ctype || '').toLowerCase() === 'merchant';

  // Merchant logistics are movement-bound. Speed is a lexicographic primary
  // stat: any real speed gain is an upgrade even if it trades secondary stats,
  // while a speed loss can never be justified by attack/armor/etc.
  if (merchant && speedImprovement !== 0) {
    return {
      meaningful: speedImprovement > 0,
      reason: speedImprovement > 0 ? 'MERCHANT_SPEED_GAIN' : 'MERCHANT_SPEED_LOSS_REJECTED',
      improvement,
      survivalImprovement,
      speedImprovement
    };
  }

  const threshold = finite(current.total, 0) <= 0
    ? 0.001
    : Math.max(0.001, finite(current.total, 0) * Math.max(0, finite(minImprovementRatio, 0)));
  return {
    meaningful: improvement > threshold,
    reason: improvement > threshold ? 'WEIGHTED_GEAR_IMPROVEMENT' : 'INSUFFICIENT_GEAR_IMPROVEMENT',
    improvement,
    survivalImprovement,
    speedImprovement
  };
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
    this.futureFarmerProtection = new Map();
    this.futureFarmerEvaluation = new Map();
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

  _firstMeaningful(meta, observedLevel, currentScore, ctype, probeMaxLevel = this.maxProbeLevel) {
    const start = Math.max(0, observedLevel);
    const boundedProbeMax = Math.max(start, Math.min(this.maxProbeLevel, Math.max(0, Math.floor(finite(probeMaxLevel, this.maxProbeLevel)))));
    const max = meta && (meta.upgrade || meta.compound) ? boundedProbeMax : start;
    for (let level = start; level <= max; level += 1) {
      const score = scoreItem(meta, level, ctype);
      const delta = scoreImprovement(currentScore, score, ctype, this.minImprovementRatio);
      if (delta.meaningful) return { level, score, delta };
    }
    return null;
  }

  futureProtectionFor(character, index, name, level) {
    const exactKey = `${String(character || '')}:${Number(index)}`;
    const row = this.futureFarmerProtection.get(exactKey);
    if (!row) return null;
    if (String(row.item || '') !== String(name || '')) return null;
    if (Math.max(0, Math.floor(finite(row.observedLevel, 0))) !== Math.max(0, Math.floor(finite(level, 0)))) return null;
    return clone(row);
  }

  futureSellSafetyFor(character, index, name, level) {
    const exactKey = `${String(character || '')}:${Number(index)}`;
    const evaluation = this.futureFarmerEvaluation.get(exactKey);
    if (!evaluation) return null;
    if (String(evaluation.item || '') !== String(name || '')) return null;
    if (Math.max(0, Math.floor(finite(evaluation.observedLevel, 0))) !== Math.max(0, Math.floor(finite(level, 0)))) return null;
    const protection = this.futureProtectionFor(character, index, name, level);
    return {
      ...clone(evaluation),
      checked: evaluation.checkedFarmerCount > 0 && evaluation.blockedByUnknownContent !== true,
      protected: !!protection,
      protection
    };
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
    this.futureFarmerProtection.clear();
    this.futureFarmerEvaluation.clear();
    for (const candidate of candidates) {
      if (!Number.isInteger(Number(candidate.item && candidate.item.index))) continue;
      const key = `${candidate.sourceCharacter}:${Number(candidate.item.index)}`;
      this.futureFarmerEvaluation.set(key, {
        sourceCharacter: candidate.sourceCharacter,
        sourceIndex: Number(candidate.item.index),
        item: candidate.item.name,
        observedLevel: levelOf(candidate.item),
        evaluatedAt: now,
        maxProbeLevel: this.maxProbeLevel,
        checkedFarmerCount: 0,
        blockedByUnknownContent: false
      });
    }
    let blockedUnknownContent = 0;

    for (const character of characters) {
      for (const candidate of candidates) {
        const evaluationKey = Number.isInteger(Number(candidate.item && candidate.item.index))
          ? `${candidate.sourceCharacter}:${Number(candidate.item.index)}`
          : null;
        const isFarmerTarget = String(character.ctype || '').toLowerCase() !== 'merchant';

        // Incompatibility is itself a completed Farmer-value check. Counting it
        // prevents impossible gear (for example Ranger + shield) from becoming
        // permanently "unknown future Farmer value" in the later sell lifecycle.
        if (isFarmerTarget && evaluationKey && this.futureFarmerEvaluation.has(evaluationKey)) {
          this.futureFarmerEvaluation.get(evaluationKey).checkedFarmerCount += 1;
        }
        if (!compatible(candidate.meta, character)) continue;
        if (this._unsafe(context.contentDrift, candidate.item.name)) {
          blockedUnknownContent += 1;
          if (isFarmerTarget && evaluationKey && this.futureFarmerEvaluation.has(evaluationKey)) {
            this.futureFarmerEvaluation.get(evaluationKey).blockedByUnknownContent = true;
          }
          continue;
        }
        let best = null;
        for (const slot of candidate.slots) {
          const current = this._currentItem(character, slot, gameData);
          const observedLevel = levelOf(candidate.item);
          const isFarmerTarget = String(character.ctype || '').toLowerCase() !== 'merchant';
          // Upgradeable feeder gear is only considered "future Farmer gear" if
          // it becomes meaningful by +5. That gives the executor a bounded,
          // explicit risk horizon instead of protecting arbitrary +6..+12 hopes.
          const probeMaxLevel = isFarmerTarget && candidate.meta.upgrade
            ? FARMER_UPGRADE_MAX_LEVEL
            : this.maxProbeLevel;
          const meaningful = this._firstMeaningful(candidate.meta, observedLevel, current.score, character.ctype, probeMaxLevel);
          if (!meaningful) continue;
          const improvement = meaningful.delta ? meaningful.delta.improvement : meaningful.score.total - current.score.total;
          const survivalImprovement = meaningful.delta ? meaningful.delta.survivalImprovement : meaningful.score.survival - current.score.survival;
          const speedImprovement = meaningful.delta ? meaningful.delta.speedImprovement : finite(meaningful.score.stats && meaningful.score.stats.speed, 0) - finite(current.score.stats && current.score.stats.speed, 0);
          const projectedFarmerUpgrade = isFarmerTarget
            && !!candidate.meta.upgrade
            && meaningful.level > observedLevel
            && meaningful.level <= FARMER_UPGRADE_MAX_LEVEL;
          const progressionTargetLevel = projectedFarmerUpgrade ? FARMER_UPGRADE_MAX_LEVEL : meaningful.level;
          const row = { slot, current, meaningful, improvement, survivalImprovement, speedImprovement, progressionTargetLevel };
          if (isFarmerTarget
            && meaningful.level > observedLevel
            && Number.isInteger(Number(candidate.item.index))) {
            const protectionKey = `${candidate.sourceCharacter}:${Number(candidate.item.index)}`;
            const existingProtection = this.futureFarmerProtection.get(protectionKey);
            const protection = {
              sourceCharacter: candidate.sourceCharacter,
              sourceIndex: Number(candidate.item.index),
              item: candidate.item.name,
              observedLevel,
              targetLevel: progressionTargetLevel,
              firstMeaningfulLevel: meaningful.level,
              targetCharacter: character.name,
              targetSlot: slot,
              improvement,
              survivalImprovement,
              upgradeLifecycle: candidate.meta.upgrade && projectedFarmerUpgrade ? 'FARMER_POTENTIAL_TO_PLUS5' : null,
              reason: 'FUTURE_FARMER_GEAR_UPGRADE_POTENTIAL'
            };
            if (!existingProtection
              || protection.targetLevel < existingProtection.targetLevel
              || protection.improvement > existingProtection.improvement) {
              this.futureFarmerProtection.set(protectionKey, protection);
            }
          }
          const merchantTarget = String(character.ctype || '').toLowerCase() === 'merchant';
          const better = !best
            || (merchantTarget
              ? (row.speedImprovement > best.speedImprovement
                || (row.speedImprovement === best.speedImprovement && row.improvement > best.improvement)
                || (row.speedImprovement === best.speedImprovement && row.improvement === best.improvement && row.survivalImprovement > best.survivalImprovement))
              : (row.improvement > best.improvement
                || (row.improvement === best.improvement && row.survivalImprovement > best.survivalImprovement)));
          if (better) best = row;
        }
        if (!best) continue;
        const targetLevel = best.progressionTargetLevel;
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
          sourceIndex: Number.isInteger(Number(candidate.item.index)) ? Number(candidate.item.index) : null,
          item: candidate.item.name,
          observedLevel: levelOf(candidate.item),
          targetLevel,
          currentItem: best.current.name,
          currentLevel: best.current.level,
          currentScore: best.current.score.total,
          targetScore: best.meaningful.score.total,
          improvement: best.improvement,
          survivalImprovement: best.survivalImprovement,
          speedImprovement: best.speedImprovement,
          projectedUpgradeRequired: targetLevel > levelOf(candidate.item),
          feasibility: targetLevel > levelOf(candidate.item) ? 'MATERIALS_AND_RISK_UNMODELED' : 'HELD_AND_READY_FOR_LATER_EXECUTOR',
          priority: String(character.ctype || '').toLowerCase() === 'merchant' && best.speedImprovement > 0
            ? 'MERCHANT_MOBILITY'
            : best.survivalImprovement > 0 ? 'SURVIVABILITY_OR_MIXED' : 'FARMING_EFFICIENCY',
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
    const observedGoals = goals.filter((goal) => goal && seenGoalIds.has(goal.id));
    const usedPhysicalItems = new Set();
    const usedTargetSlots = new Set();
    const ctypeByName = new Map(characters.filter(Boolean).map((row) => [String(row.name || ''), String(row.ctype || row.type || '').toLowerCase()]));
    const compareGoal = (a, b) => b.survivalImprovement - a.survivalImprovement || b.improvement - a.improvement || a.id.localeCompare(b.id);
    const compareMerchantGoal = (a, b) => finite(b.speedImprovement, 0) - finite(a.speedImprovement, 0)
      || b.improvement - a.improvement
      || b.survivalImprovement - a.survivalImprovement
      || a.id.localeCompare(b.id);
    const farmers = observedGoals.filter((goal) => ctypeByName.get(String(goal.character || '')) !== 'merchant').sort(compareGoal);
    const merchants = observedGoals.filter((goal) => ctypeByName.get(String(goal.character || '')) === 'merchant').sort(compareMerchantGoal);
    const currentGoals = [];

    const take = (queue, limit) => {
      let accepted = 0;
      while (queue.length && accepted < limit) {
        const goal = queue.shift();
        const physical = goal.sourceIndex != null
          ? `${goal.sourceCharacter}:${goal.sourceIndex}`
          : `${goal.sourceCharacter}:${goal.item}:${goal.observedLevel}`;
        const target = `${goal.character}:${goal.slot}`;
        if (usedPhysicalItems.has(physical) || usedTargetSlots.has(target)) continue;
        usedPhysicalItems.add(physical);
        usedTargetSlots.add(target);
        currentGoals.push(goal);
        accepted += 1;
      }
      return accepted;
    };

    // Better gear is Farmer-first. Allocate all non-conflicting Farmer goals
    // first, then permit at most one Merchant assignment per four Farmer
    // assignments (80/20). If there are no useful Farmer goals at all, Merchant
    // upgrades may use otherwise-idle gear.
    const farmerGoalCount = farmers.length;
    take(farmers, Number.MAX_SAFE_INTEGER);
    const farmerAssignments = currentGoals.length;
    if (farmerGoalCount === 0) {
      take(merchants, Number.MAX_SAFE_INTEGER);
    } else {
      const merchantBudget = Math.floor(farmerAssignments / 4);
      if (merchantBudget > 0) take(merchants, merchantBudget);
    }
    const reservations = [];
    // Reserve exact physical inventory rows whenever possible. One physical
    // item can satisfy at most one active gear goal and one target slot can
    // receive at most one item in an evaluation.
    for (const goal of currentGoals) {
      reservations.push({
        name: goal.item,
        level: goal.observedLevel,
        quantity: 1,
        sourceCharacter: goal.sourceCharacter,
        sourceIndex: goal.sourceIndex,
        goalIds: [goal.id]
      });
    }
    this.lastEvaluation = {
      at: now,
      characters: characters.length,
      candidates: candidates.length,
      activeGoals: currentGoals.length,
      observedGoals: observedGoals.length,
      physicalAssignments: currentGoals.length,
      farmerAssignments: currentGoals.filter((goal) => ctypeByName.get(String(goal.character || '')) !== 'merchant').length,
      merchantAssignments: currentGoals.filter((goal) => ctypeByName.get(String(goal.character || '')) === 'merchant').length,
      farmerTargetShare: 0.8,
      futureFarmerProtectedItems: this.futureFarmerProtection.size,
      futureFarmerEvaluatedItems: this.futureFarmerEvaluation.size,
      persistedGoals: goals.length,
      blockedUnknownContent
    };
    this.save();
    return { status: this.status(), goals, currentGoals: currentGoals.map(clone), reservations: reservations.map(clone) };
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
      futureFarmerProtectedItems: this.futureFarmerProtection.size,
      futureFarmerEvaluatedItems: this.futureFarmerEvaluation.size,
      futureProtectionMode: 'UPGRADE_TO_PLUS5_AND_COMPOUND_PROBE_TO_MAX_LEVEL',
      farmerUpgradePotentialMaxLevel: FARMER_UPGRADE_MAX_LEVEL,
      economicUpgradeFallbackLevel: ECONOMIC_UPGRADE_FALLBACK_LEVEL,
      processedGearSellRequiresExplicitFutureSafety: true,
      merchantPrimaryGearStat: 'speed',
      merchantSpeedPriority: 'LEXICOGRAPHIC_FIRST',
      merchantSpeedWeight: CLASS_WEIGHTS.merchant.speed,
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
  scoreImprovement,
  candidateSlots
};
