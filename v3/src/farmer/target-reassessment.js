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
  }

  evaluate(snapshot, currentTarget) {
    if (!this.enabled) return { switchTarget: false, reason: 'REASSESSMENT_DISABLED' };
    if (!snapshot || !snapshot.character || !currentTarget) return { switchTarget: false, reason: 'REASSESSMENT_CONTEXT_MISSING' };

    const character = snapshot.character;
    const selfName = character.name;
    if (!selfName) return { switchTarget: false, reason: 'CHARACTER_NAME_MISSING' };
    if (!liveMonster(currentTarget, character)) return { switchTarget: false, reason: 'CURRENT_TARGET_NOT_LIVE' };

    if (currentTarget.target === selfName) {
      return {
        switchTarget: false,
        reason: 'CURRENT_TARGET_SELF_AGGRO',
        attackerCount: (snapshot.entities || []).filter((entity) => liveMonster(entity, character) && entity.target === selfName).length
      };
    }

    const attackers = (snapshot.entities || [])
      .filter((entity) => liveMonster(entity, character))
      .filter((entity) => String(entity.id) !== String(currentTarget.id))
      .filter((entity) => entity.target === selfName)
      .sort((a, b) => {
        const delta = distance(character, a) - distance(character, b);
        if (delta !== 0) return delta;
        return String(a.id).localeCompare(String(b.id));
      });

    if (!attackers.length) {
      return {
        switchTarget: false,
        reason: 'NO_SELF_AGGRO_ALTERNATIVE',
        attackerCount: 0,
        currentTargetOwner: currentTarget.target || null
      };
    }

    const target = attackers[0];
    return {
      switchTarget: true,
      reason: 'SELF_AGGRO_PRIORITY',
      target,
      attackerCount: attackers.length,
      currentTargetOwner: currentTarget.target || null,
      targetDistance: distance(character, target)
    };
  }

  status() {
    return {
      enabled: this.enabled,
      minIntervalMs: this.minIntervalMs,
      switchCooldownMs: this.switchCooldownMs,
      strategy: 'keep-self-aggro-current; otherwise nearest-self-attacker'
    };
  }
}

module.exports = { TargetReassessmentPolicy };
