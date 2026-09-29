'use strict';

const { progressionProbability } = require('./item-economic-evaluator');

const ROLE_WEIGHT_MULTIPLIERS = Object.freeze({
  tank: Object.freeze({ armor: 1.30, resistance: 1.30, hp: 1.25, vit: 1.20, evasion: 1.10, attack: 0.90 }),
  healer: Object.freeze({ mp: 1.25, int: 1.15, resistance: 1.15, hp: 1.10, attack: 0.90 }),
  support: Object.freeze({ mp: 1.20, int: 1.10, resistance: 1.15, hp: 1.10, speed: 1.05 }),
  aoe: Object.freeze({ attack: 1.15, frequency: 1.20, range: 1.10, mp: 1.10, crit: 1.05 }),
  boss: Object.freeze({ attack: 1.15, crit: 1.20, frequency: 1.15, armor: 1.08, resistance: 1.08, hp: 1.08 }),
  dps: Object.freeze({ attack: 1.15, crit: 1.15, frequency: 1.15, dex: 1.08, int: 1.08, str: 1.08 }),
  economy: Object.freeze({ speed: 1.20, hp: 1.10, resistance: 1.10 })
});

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function lower(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function roleProfile(character) {
  if (!character || typeof character !== 'object') return null;
  const direct = [
    character.gearRole,
    character.combatRole,
    character.farmRole,
    character.localRole,
    character.role
  ].map(lower).find(Boolean);

  const task = character.currentTask || character.task || character.assignment || null;
  const taskText = lower(task && typeof task === 'object'
    ? task.type || task.kind || task.role || task.mode
    : task);

  const candidates = [direct, taskText].filter(Boolean);
  for (const value of candidates) {
    if (value.includes('tank')) return 'tank';
    if (value.includes('heal')) return 'healer';
    if (value.includes('support')) return 'support';
    if (value.includes('aoe') || value.includes('area')) return 'aoe';
    if (value.includes('boss') || value.includes('single')) return 'boss';
    if (value.includes('dps') || value.includes('damage')) return 'dps';
    if (value.includes('econom') || value.includes('merchant')) return 'economy';
  }
  return null;
}

function contextualWeights(baseWeights, character) {
  const out = { ...(baseWeights || {}) };
  const profile = roleProfile(character);
  const multipliers = profile && ROLE_WEIGHT_MULTIPLIERS[profile];
  if (!multipliers) return { weights: out, roleProfile: profile };
  for (const [key, multiplier] of Object.entries(multipliers)) {
    if (finite(out[key]) == null) continue;
    out[key] *= multiplier;
  }
  return { weights: out, roleProfile: profile };
}

function buildProgressionCurve(options = {}) {
  const meta = options.meta || {};
  const observedLevel = Math.max(0, Math.floor(finite(options.observedLevel, 0)));
  const maxLevel = Math.max(observedLevel, Math.floor(finite(options.maxLevel, observedLevel)));
  const currentScore = options.currentScore || { total: 0, survival: 0, stats: {} };
  const ctype = options.ctype || null;
  const character = options.character || null;
  const gameData = options.gameData || {};
  const scoreAtLevel = options.scoreAtLevel;
  const scoreImprovement = options.scoreImprovement;
  const minImprovementRatio = Math.max(0, finite(options.minImprovementRatio, 0));
  if (typeof scoreAtLevel !== 'function' || typeof scoreImprovement !== 'function') return [];

  const progression = meta.upgrade
    ? 'UPGRADE'
    : meta.compound
      ? 'COMPOUND'
      : null;
  const compound = progression === 'COMPOUND';
  const limit = progression ? maxLevel : observedLevel;
  let cumulativeSuccessChance = 1;
  const rows = [];

  for (let level = observedLevel; level <= limit; level += 1) {
    let stepChance = level === observedLevel ? 1 : null;
    if (level > observedLevel) {
      stepChance = progressionProbability(gameData, meta, level, compound);
      cumulativeSuccessChance = cumulativeSuccessChance == null || stepChance == null
        ? null
        : cumulativeSuccessChance * stepChance;
    }

    const score = scoreAtLevel(meta, level, ctype, character);
    const delta = scoreImprovement(currentScore, score, ctype, minImprovementRatio);
    const rawUtility = Math.max(0, finite(delta && delta.improvement, 0))
      + Math.max(0, finite(delta && delta.survivalImprovement, 0)) * 0.20;
    const riskAdjustedUtility = level === observedLevel
      ? rawUtility
      : cumulativeSuccessChance == null
        ? null
        : rawUtility * cumulativeSuccessChance;

    rows.push({
      level,
      progression,
      score,
      delta,
      meaningful: !!(delta && delta.meaningful),
      stepChance,
      cumulativeSuccessChance,
      rawUtility,
      riskAdjustedUtility
    });
  }
  return rows;
}

function selectDynamicTarget(curve = [], observedLevel = 0) {
  const meaningful = (Array.isArray(curve) ? curve : []).filter((row) => row && row.meaningful === true);
  if (!meaningful.length) return null;
  const firstMeaningful = meaningful[0];

  const scored = meaningful.map((row) => ({
    row,
    utility: finite(row.riskAdjustedUtility,
      row.level === observedLevel ? finite(row.rawUtility, 0) : finite(row.rawUtility, 0) * 0.25)
  })).sort((a, b) =>
    b.utility - a.utility
    || finite(b.row.delta && b.row.delta.improvement, 0) - finite(a.row.delta && a.row.delta.improvement, 0)
    || a.row.level - b.row.level
  );

  const selected = scored[0] && scored[0].row || firstMeaningful;
  return {
    firstMeaningful,
    target: selected,
    reason: selected.level === observedLevel
      ? 'CURRENT_LEVEL_ALREADY_BEST_RISK_ADJUSTED_GEAR'
      : 'RISK_ADJUSTED_FUTURE_GEAR_VALUE',
    evidenceComplete: selected.level === observedLevel || selected.cumulativeSuccessChance != null
  };
}

module.exports = {
  ROLE_WEIGHT_MULTIPLIERS,
  roleProfile,
  contextualWeights,
  buildProgressionCurve,
  selectDynamicTarget
};
