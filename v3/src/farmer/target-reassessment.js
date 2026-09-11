'use strict';

function distance(a, b) {
  if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) return Infinity;
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

function liveMonster(entity, character) {
  if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
  if (entity.map && character && character.map && entity.map !== character.map) return false;
  return true;
}

class TargetReassessmentPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.minIntervalMs = Math.max(250, Number(options.minIntervalMs) || 750);
    this.switchCooldownMs = Math.max(1000, Number(options.switchCooldownMs) || 2500);
    this.selfAggroSwitchFactor = Math.max(0.25, Math.min(0.9, Number(options.selfAggroSwitchFactor) || 0.7));
  }

  _selfAttackers(snapshot, character, selfName) {
    return (snapshot.entities || [])
      .filter((entity) => liveMonster(entity, character) && entity.target === selfName)
      .sort((a, b) => {
        const delta = distance(character, a) - distance(character, b);
        if (delta !== 0) return delta;
        return String(a.id).localeCompare(String(b.id));
      });
  }

  evaluate(snapshot, currentTarget) {
    if (!this.enabled) return { switchTarget: false, reason: 'REASSESSMENT_DISABLED' };
    if (!snapshot || !snapshot.character || !currentTarget) return { switchTarget: false, reason: 'REASSESSMENT_CONTEXT_MISSING' };

    const character = snapshot.character;
    const selfName = character.name;
    if (!selfName) return { switchTarget: false, reason: 'CHARACTER_NAME_MISSING' };
    if (!liveMonster(currentTarget, character)) return { switchTarget: false, reason: 'CURRENT_TARGET_NOT_LIVE' };

    const attackers = this._selfAttackers(snapshot, character, selfName);

    if (currentTarget.target === selfName) {
      const currentDistance = distance(character, currentTarget);
      const alternatives = attackers.filter((entity) => String(entity.id) !== String(currentTarget.id));

      if (!alternatives.length) {
        return {
          switchTarget: false,
          reason: 'CURRENT_TARGET_ONLY_SELF_AGGRO',
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance
        };
      }

      const target = alternatives[0];
      const targetDistance = distance(character, target);
      const switchThresholdDistance = Number.isFinite(currentDistance)
        ? currentDistance * this.selfAggroSwitchFactor
        : null;

      if (!Number.isFinite(currentDistance) || !Number.isFinite(targetDistance)) {
        return {
          switchTarget: false,
          reason: 'SELF_AGGRO_DISTANCE_UNKNOWN',
          target,
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          targetDistance,
          switchThresholdDistance
        };
      }

      if (targetDistance > switchThresholdDistance) {
        return {
          switchTarget: false,
          reason: 'CURRENT_SELF_AGGRO_STABLE',
          target,
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          targetDistance,
          switchThresholdDistance
        };
      }

      return {
        switchTarget: true,
        reason: 'CLOSER_SELF_AGGRO_PRIORITY',
        target,
        attackerCount: attackers.length,
        currentTargetOwner: currentTarget.target || null,
        currentDistance,
        targetDistance,
        switchThresholdDistance
      };
    }

    const alternatives = attackers.filter((entity) => String(entity.id) !== String(currentTarget.id));
    if (!alternatives.length) {
      return {
        switchTarget: false,
        reason: 'NO_SELF_AGGRO_ALTERNATIVE',
        attackerCount: 0,
        currentTargetOwner: currentTarget.target || null,
        currentDistance: distance(character, currentTarget)
      };
    }

    const target = alternatives[0];
    return {
      switchTarget: true,
      reason: 'SELF_AGGRO_PRIORITY',
      target,
      attackerCount: alternatives.length,
      currentTargetOwner: currentTarget.target || null,
      currentDistance: distance(character, currentTarget),
      targetDistance: distance(character, target),
      switchThresholdDistance: null
    };
  }

  status() {
    return {
      enabled: this.enabled,
      minIntervalMs: this.minIntervalMs,
      switchCooldownMs: this.switchCooldownMs,
      selfAggroSwitchFactor: this.selfAggroSwitchFactor,
      strategy: 'nearest-self-attacker; switch between self-aggro targets only when candidate <= factor * current distance'
    };
  }
}

module.exports = { TargetReassessmentPolicy };
