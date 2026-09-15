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

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
  const routineFarm = options.routineFarm === true;
  const defensive = options.defensive === true || !!(
    character && character.name && source && source.target &&
    String(source.target) === String(character.name)
  );
  const respawn = finiteNumber(metadata.respawn);

  const base = {
    allowed: true,
    reason: 'EFFICIENT_ENOUGH',
    mtype: mtype || null,
    ctype: ctype || null,
    evasion,
    avoidance,
    maxEvasion,
    maxAvoidance,
    evasionSensitive,
    routineFarm,
    defensive,
    special: metadata.special === true,
    cooperative: metadata.cooperative === true,
    immune: metadata.immune === true,
    peaceful: metadata.peaceful === true,
    operator: metadata.operator === true,
    respawn
  };

  if (avoidance != null && avoidance >= maxAvoidance) {
    return { ...base, allowed: false, reason: 'EXTREME_AVOIDANCE' };
  }

  if (evasionSensitive && evasion != null && evasion >= maxEvasion) {
    return { ...base, allowed: false, reason: 'EXTREME_EVASION' };
  }

  if (routineFarm) {
    if (metadata.immune === true) return { ...base, allowed: false, reason: 'IMMUNE_TARGET' };
    if (metadata.peaceful === true) return { ...base, allowed: false, reason: 'PEACEFUL_TARGET' };
    if (metadata.operator === true) return { ...base, allowed: false, reason: 'OPERATOR_CONTENT_NOT_ROUTINE_FARM' };

    // Special/cooperative/irregular-spawn content is never selected proactively
    // as routine farming. A self-aggro target may still pass this efficiency
    // layer so the existing combat-risk/emergency boundaries retain authority.
    if (!defensive) {
      if (metadata.special === true) return { ...base, allowed: false, reason: 'SPECIAL_CONTENT_NOT_ROUTINE_FARM' };
      if (metadata.cooperative === true) return { ...base, allowed: false, reason: 'COOPERATIVE_CONTENT_NOT_ROUTINE_FARM' };
      if (respawn != null && respawn < 0) return { ...base, allowed: false, reason: 'NON_ROUTINE_RESPAWN' };
    }
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
