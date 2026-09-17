'use strict';

const { distance } = require('../core/geometry');

function liveMonster(entity, character) {
  if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
  if (entity.map && character && character.map && entity.map !== character.map) return false;
  return true;
}

function threatScore(entity, gameData) {
  if (!entity || !entity.mtype || !gameData || !gameData.monsters) return null;
  const data = gameData.monsters[entity.mtype];
  if (!data) return null;
  const attack = Number(data.attack);
  const frequency = Number(data.frequency);
  if (!Number.isFinite(attack) || attack <= 0 || !Number.isFinite(frequency) || frequency <= 0) return null;
  return attack * frequency;
}

class TargetReassessmentPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.minIntervalMs = Math.max(250, Number(options.minIntervalMs) || 750);
    this.switchCooldownMs = Math.max(1000, Number(options.switchCooldownMs) || 2500);
    this.selfAggroSwitchFactor = Math.max(0.25, Math.min(0.9, Number(options.selfAggroSwitchFactor) || 0.7));
    this.selfAggroThreatSwitchFactor = Math.max(1, Math.min(3, Number(options.selfAggroThreatSwitchFactor) || 1.25));
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

  _highestThreatAlternative(alternatives, character, gameData) {
    return alternatives
      .map((entity) => ({
        entity,
        score: threatScore(entity, gameData),
        distance: distance(character, entity)
      }))
      .filter((row) => row.score != null)
      .sort((a, b) => {
        const threatDelta = b.score - a.score;
        if (threatDelta !== 0) return threatDelta;
        const distanceDelta = a.distance - b.distance;
        if (distanceDelta !== 0) return distanceDelta;
        return String(a.entity.id).localeCompare(String(b.entity.id));
      })[0] || null;
  }

  evaluate(snapshot, currentTarget, gameData = {}) {
    if (!this.enabled) return { switchTarget: false, reason: 'REASSESSMENT_DISABLED' };
    if (!snapshot || !snapshot.character || !currentTarget) return { switchTarget: false, reason: 'REASSESSMENT_CONTEXT_MISSING' };

    const character = snapshot.character;
    const selfName = character.name;
    if (!selfName) return { switchTarget: false, reason: 'CHARACTER_NAME_MISSING' };
    if (!liveMonster(currentTarget, character)) return { switchTarget: false, reason: 'CURRENT_TARGET_NOT_LIVE' };

    const attackers = this._selfAttackers(snapshot, character, selfName);

    if (currentTarget.target === selfName) {
      const currentDistance = distance(character, currentTarget);
      const currentThreatScore = threatScore(currentTarget, gameData);
      const alternatives = attackers.filter((entity) => String(entity.id) !== String(currentTarget.id));

      if (!alternatives.length) {
        return {
          switchTarget: false,
          reason: 'CURRENT_TARGET_ONLY_SELF_AGGRO',
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          currentThreatScore
        };
      }

      const highestThreat = this._highestThreatAlternative(alternatives, character, gameData);
      if (currentThreatScore != null && highestThreat && highestThreat.score >= currentThreatScore * this.selfAggroThreatSwitchFactor) {
        return {
          switchTarget: true,
          reason: 'HIGHER_SELF_AGGRO_THREAT',
          target: highestThreat.entity,
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          targetDistance: highestThreat.distance,
          switchThresholdDistance: Number.isFinite(currentDistance) ? currentDistance * this.selfAggroSwitchFactor : null,
          currentThreatScore,
          targetThreatScore: highestThreat.score,
          threatSwitchThreshold: currentThreatScore * this.selfAggroThreatSwitchFactor
        };
      }

      const target = alternatives[0];
      const targetDistance = distance(character, target);
      const targetThreatScore = threatScore(target, gameData);
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
          switchThresholdDistance,
          currentThreatScore,
          targetThreatScore
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
          switchThresholdDistance,
          currentThreatScore,
          targetThreatScore
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
        switchThresholdDistance,
        currentThreatScore,
        targetThreatScore
      };
    }

    const alternatives = attackers.filter((entity) => String(entity.id) !== String(currentTarget.id));
    if (!alternatives.length) {
      return {
        switchTarget: false,
        reason: 'NO_SELF_AGGRO_ALTERNATIVE',
        attackerCount: 0,
        currentTargetOwner: currentTarget.target || null,
        currentDistance: distance(character, currentTarget),
        currentThreatScore: threatScore(currentTarget, gameData)
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
      switchThresholdDistance: null,
      currentThreatScore: threatScore(currentTarget, gameData),
      targetThreatScore: threatScore(target, gameData)
    };
  }

  status() {
    return {
      enabled: this.enabled,
      minIntervalMs: this.minIntervalMs,
      switchCooldownMs: this.switchCooldownMs,
      selfAggroSwitchFactor: this.selfAggroSwitchFactor,
      selfAggroThreatSwitchFactor: this.selfAggroThreatSwitchFactor,
      threatMetric: 'G.monsters[mtype].attack * frequency',
      strategy: 'self-aggro threat override when candidate >= threat factor; otherwise alpha.8.6 distance hysteresis'
    };
  }
}

module.exports = { TargetReassessmentPolicy, threatScore };
