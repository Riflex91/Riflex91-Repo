'use strict';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finite(value, 0)));
}

function isDirectDamageSkill(skill, character) {
  if (!skill || skill.type !== 'skill' || skill.hostile !== true) return false;
  if (!(skill.target === true || skill.target === 'monster')) return false;
  if (skill.consume || skill.slot || skill.persistent) return false;
  if (!(finite(skill.damage_multiplier, 0) > 1)) return false;

  const classes = Array.isArray(skill.class) ? skill.class : null;
  if (classes && character && character.ctype && !classes.includes(character.ctype)) return false;

  const requiredLevel = finite(skill.level, 0);
  if (character && requiredLevel > finite(character.level, 0)) return false;
  return true;
}

class SkillUsagePolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.mpReserveRatio = clamp01(options.mpReserveRatio == null ? 0.30 : options.mpReserveRatio);
    this.minIntervalMs = Math.max(250, finite(options.minIntervalMs, 750));
  }

  select(character, gameData = {}) {
    if (!this.enabled || !character) return null;
    const skills = gameData.skills || {};
    const candidates = Object.entries(skills)
      .filter(([, skill]) => isDirectDamageSkill(skill, character))
      .map(([id, skill]) => ({
        id,
        name: skill.name || id,
        mp: Math.max(0, finite(skill.mp, 0)),
        level: Math.max(0, finite(skill.level, 0)),
        cooldown: Math.max(0, finite(skill.cooldown, 0)),
        damageMultiplier: finite(skill.damage_multiplier, 0),
        range: Number.isFinite(Number(skill.range)) ? Number(skill.range) : null,
        rangeMultiplier: Number.isFinite(Number(skill.range_multiplier)) ? Number(skill.range_multiplier) : null,
        weaponTypes: Array.isArray(skill.wtype) ? skill.wtype.slice() : []
      }))
      .sort((a, b) => {
        if (b.damageMultiplier !== a.damageMultiplier) return b.damageMultiplier - a.damageMultiplier;
        if (b.cooldown !== a.cooldown) return b.cooldown - a.cooldown;
        return a.id.localeCompare(b.id);
      });
    return candidates[0] || null;
  }

  evaluate(snapshot, target, gameData, adapter) {
    const character = snapshot && snapshot.character;
    if (!this.enabled) return { useSkill: false, reason: 'SKILL_USAGE_DISABLED', skill: null };
    if (!character || !target) return { useSkill: false, reason: 'SKILL_CONTEXT_MISSING', skill: null };

    const skill = this.select(character, gameData || {});
    if (!skill) return { useSkill: false, reason: 'NO_SAFE_DIRECT_DAMAGE_SKILL', skill: null };

    const mp = Math.max(0, finite(character.mp, 0));
    const maxMp = Math.max(0, finite(character.max_mp, mp));
    const reserveMp = maxMp * this.mpReserveRatio;
    const mpAfter = mp - skill.mp;
    if (mpAfter < reserveMp) {
      return { useSkill: false, reason: 'MP_RESERVE', skill, mp, reserveMp, mpAfter };
    }

    if (adapter && typeof adapter.canUseSkill === 'function' && !adapter.canUseSkill(skill.id)) {
      return { useSkill: false, reason: 'SKILL_COOLDOWN_OR_REQUIREMENT', skill, mp, reserveMp, mpAfter };
    }

    if (adapter && typeof adapter.isSkillInRange === 'function' && !adapter.isSkillInRange(target.id, skill.id)) {
      return { useSkill: false, reason: 'SKILL_OUT_OF_RANGE', skill, mp, reserveMp, mpAfter };
    }

    return { useSkill: true, reason: 'SAFE_DIRECT_DAMAGE_SKILL', skill, mp, reserveMp, mpAfter };
  }

  status() {
    return {
      enabled: this.enabled,
      mpReserveRatio: this.mpReserveRatio,
      minIntervalMs: this.minIntervalMs,
      selection: 'single-target hostile damage_multiplier>1'
    };
  }
}

module.exports = { SkillUsagePolicy, isDirectDamageSkill };
