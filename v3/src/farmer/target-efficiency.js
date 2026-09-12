'use strict';

const DEFAULT_MAX_EVASION = 80;
const DEFAULT_MAX_AVOIDANCE = 80;
const EVASION_SENSITIVE_CTYPES = Object.freeze([
  'merchant',
  'paladin',
  'ranger',
  'rogue',
  'warrior'
]);

function finiteNonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function maxKnown(...values) {
  const known = values.map(finiteNonNegative).filter((value) => value != null);
  return known.length ? Math.max(...known) : null;
}

function normalizedType(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function resolveMonsterType(entity, options = {}) {
  if (typeof entity === 'string') return normalizedType(entity);
  if (!entity || typeof entity !== 'object') return normalizedType(options.mtype);
  return normalizedType(entity.mtype || entity.monster || entity.type || options.mtype);
}

function evaluateTargetEfficiency(entity, gameData = {}, options = {}) {
  const mtype = resolveMonsterType(entity, options);
  const metadata = mtype && gameData && gameData.monsters && gameData.monsters[mtype] || {};
  const source = entity && typeof entity === 'object' ? entity : {};
  const character = options.character || {};
  const ctype = normalizedType(character.ctype || character.type || options.ctype);
  const maxEvasion = finiteNonNegative(options.maxEvasion) == null
    ? DEFAULT_MAX_EVASION
    : finiteNonNegative(options.maxEvasion);
  const maxAvoidance = finiteNonNegative(options.maxAvoidance) == null
    ? DEFAULT_MAX_AVOIDANCE
    : finiteNonNegative(options.maxAvoidance);
  const evasion = maxKnown(source.evasion, metadata.evasion);
  const avoidance = maxKnown(source.avoidance, metadata.avoidance);
  const evasionSensitive = !ctype || EVASION_SENSITIVE_CTYPES.includes(ctype);

  const base = {
    allowed: true,
    reason: 'EFFICIENT_ENOUGH',
    mtype: mtype || null,
    ctype: ctype || null,
    evasion,
    avoidance,
    maxEvasion,
    maxAvoidance,
    evasionSensitive
  };

  if (avoidance != null && avoidance >= maxAvoidance) {
    return { ...base, allowed: false, reason: 'EXTREME_AVOIDANCE' };
  }

  if (evasionSensitive && evasion != null && evasion >= maxEvasion) {
    return { ...base, allowed: false, reason: 'EXTREME_EVASION' };
  }

  return base;
}

module.exports = {
  DEFAULT_MAX_EVASION,
  DEFAULT_MAX_AVOIDANCE,
  EVASION_SENSITIVE_CTYPES,
  evaluateTargetEfficiency,
  resolveMonsterType
};
