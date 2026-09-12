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
    this.maxCommandAttempts = Math.max(1, Math.min(3, Math.floor(finite(options.maxCommandAttempts, 2))));
    this.failureBackoffMs = Math.max(500, Math.min(10000, finite(options.failureBackoffMs, 2000)));
    this.retryableCommandReasons = new Set(['COMMAND_FAILED']);
  }

  candidates(character, gameData = {}) {
    if (!this.enabled || !character) return [];
    const skills = gameData.skills || {};
    return Object.entries(skills)
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
  }

  select(character, gameData = {}) {
    return this.candidates(character, gameData)[0] || null;
  }

  canRetryCommandFailure(result) {
    if (!result || result.executed || result.shadow) return false;
    return this.retryableCommandReasons.has(String(result.reason || ''));
  }

  evaluate(snapshot, target, gameData, adapter, options = {}) {
    const character = snapshot && snapshot.character;
    if (!this.enabled) return { useSkill: false, reason: 'SKILL_USAGE_DISABLED', skill: null, candidateCount: 0, candidateRank: null, rejectedCandidates: [] };
    if (!character || !target) return { useSkill: false, reason: 'SKILL_CONTEXT_MISSING', skill: null, candidateCount: 0, candidateRank: null, rejectedCandidates: [] };

    const candidates = this.candidates(character, gameData || {});
    if (!candidates.length) return { useSkill: false, reason: 'NO_SAFE_DIRECT_DAMAGE_SKILL', skill: null, candidateCount: 0, candidateRank: null, rejectedCandidates: [] };

    const skippedSkillIds = new Set(
      Array.isArray(options.skipSkillIds) ? options.skipSkillIds.map((id) => String(id)) : []
    );
    const backoffSkillIds = new Set(
      Array.isArray(options.backoffSkillIds) ? options.backoffSkillIds.map((id) => String(id)) : []
    );
    const mp = Math.max(0, finite(character.mp, 0));
    const maxMp = Math.max(0, finite(character.max_mp, mp));
    const reserveMp = maxMp * this.mpReserveRatio;
    const rejectedCandidates = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const skill = candidates[index];
      const mpAfter = mp - skill.mp;
      let rejectionReason = null;

      if (skippedSkillIds.has(String(skill.id))) {
        rejectionReason = 'PREVIOUS_COMMAND_FAILED';
      } else if (backoffSkillIds.has(String(skill.id))) {
        rejectionReason = 'SKILL_COMMAND_BACKOFF';
      } else if (mpAfter < reserveMp) {
        rejectionReason = 'MP_RESERVE';
      } else if (adapter && typeof adapter.canUseSkill === 'function' && !adapter.canUseSkill(skill.id)) {
        rejectionReason = 'SKILL_COOLDOWN_OR_REQUIREMENT';
      } else if (adapter && typeof adapter.isSkillInRange === 'function' && !adapter.isSkillInRange(target.id, skill.id)) {
        rejectionReason = 'SKILL_OUT_OF_RANGE';
      }

      if (rejectionReason) {
        rejectedCandidates.push({
          skill: skill.id,
          rank: index + 1,
          reason: rejectionReason,
          mpAfter
        });
        continue;
      }

      return {
        useSkill: true,
        reason: index === 0 ? 'SAFE_DIRECT_DAMAGE_SKILL' : 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL',
        skill,
        mp,
        reserveMp,
        mpAfter,
        candidateCount: candidates.length,
        candidateRank: index + 1,
        rejectedCandidates
      };
    }

    const primary = candidates[0];
    const primaryRejection = rejectedCandidates[0] || { reason: 'NO_USABLE_SAFE_DIRECT_DAMAGE_SKILL' };
    return {
      useSkill: false,
      reason: primaryRejection.reason,
      skill: primary,
      mp,
      reserveMp,
      mpAfter: mp - primary.mp,
      candidateCount: candidates.length,
      candidateRank: null,
      rejectedCandidates
    };
  }

  status() {
    return {
      enabled: this.enabled,
      mpReserveRatio: this.mpReserveRatio,
      minIntervalMs: this.minIntervalMs,
      fallbackEnabled: true,
      executionFallbackEnabled: true,
      maxCommandAttempts: this.maxCommandAttempts,
      retryableCommandReasons: [...this.retryableCommandReasons],
      failureBackoffEnabled: true,
      failureBackoffMs: this.failureBackoffMs,
      backoffReason: 'SKILL_COMMAND_BACKOFF',
      selection: 'ranked single-target hostile damage_multiplier>1 with live safe fallback'
    };
  }
}

module.exports = { SkillUsagePolicy, isDirectDamageSkill };
