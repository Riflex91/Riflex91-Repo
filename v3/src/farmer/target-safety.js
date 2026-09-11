'use strict';

const BUILT_IN_TARGET_EXCLUSIONS = Object.freeze([
  Object.freeze({ token: 'automatron', reason: 'TRAINING_TARGET_AUTOMATRON' })
]);

function normalizeTargetToken(value) {
  return String(value || '').trim().toLowerCase();
}

class TargetSafety {
  constructor(options = {}) {
    this.custom = new Set();
    for (const value of options.exclusions || []) this.add(value);
  }

  list() {
    return [...new Set([
      ...BUILT_IN_TARGET_EXCLUSIONS.map((rule) => rule.token),
      ...this.custom
    ])].sort();
  }

  add(value) {
    const token = normalizeTargetToken(value);
    if (!token) throw new Error('target exclusion must be a non-empty string');
    this.custom.add(token);
    return token;
  }

  remove(value) {
    const token = normalizeTargetToken(value);
    if (!token) return false;
    if (BUILT_IN_TARGET_EXCLUSIONS.some((rule) => rule.token === token)) return false;
    return this.custom.delete(token);
  }

  evaluate(entity, gameData = {}) {
    if (!entity) return { allowed: false, reason: 'MISSING_ENTITY', token: null, source: null };
    const monster = entity.mtype && gameData.monsters && gameData.monsters[entity.mtype] || null;
    const identities = [
      ['entity.name', entity.name],
      ['entity.mtype', entity.mtype],
      ['monster.name', monster && monster.name],
      ['monster.skin', monster && monster.skin]
    ];

    const rules = [
      ...BUILT_IN_TARGET_EXCLUSIONS,
      ...[...this.custom].map((token) => ({ token, reason: 'CUSTOM_TARGET_EXCLUSION' }))
    ];

    for (const rule of rules) {
      for (const [source, raw] of identities) {
        const identity = normalizeTargetToken(raw);
        if (identity && identity.includes(rule.token)) {
          return { allowed: false, reason: rule.reason, token: rule.token, source };
        }
      }
    }
    return { allowed: true, reason: 'ALLOWED', token: null, source: null };
  }
}

module.exports = { TargetSafety, BUILT_IN_TARGET_EXCLUSIONS, normalizeTargetToken };
