'use strict';

const { KitingFarmerController } = require('./kiting-farmer');
const { SkillUsagePolicy } = require('./skill-usage');
const { TargetReassessmentPolicy } = require('./target-reassessment');

class SkillFarmerController extends KitingFarmerController {
  constructor(options = {}) {
    super(options);
    this.skillUsage = options.skillUsage || new SkillUsagePolicy({
      enabled: options.skillUsageEnabled !== false,
      mpReserveRatio: options.skillUsageMpReserveRatio,
      minIntervalMs: options.skillUsageMinIntervalMs
    });
    this.targetReassessment = options.targetReassessment || new TargetReassessmentPolicy({
      enabled: options.targetReassessmentEnabled !== false,
      minIntervalMs: options.targetReassessmentMinIntervalMs,
      switchCooldownMs: options.targetReassessmentSwitchCooldownMs,
      selfAggroSwitchFactor: options.targetReassessmentSelfAggroSwitchFactor,
      selfAggroThreatSwitchFactor: options.targetReassessmentSelfAggroThreatSwitchFactor
    });
    this.lastSkillAttemptAt = -Infinity;
    this.selectedSkill = null;
    this.lastSkillUse = null;
    this.lastSkillDecision = null;
    this.lastReassessmentAt = -Infinity;
    this.lastTargetSwitchAt = -Infinity;
    this.lastReassessmentDecision = null;
    this.lastTargetSwitch = null;
  }

  _updateSelectedSkill(context) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    const gameData = context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const selected = character ? this.skillUsage.select(character, gameData) : null;
    this.selectedSkill = selected ? selected.id : null;
    return { selected, gameData };
  }

  _shadowStep(context) {
    this._updateSelectedSkill(context);
    return super._shadowStep(context);
  }

  _maybeReassessTarget(context, target) {
    const now = this.now();
    if (now - this.lastReassessmentAt < this.targetReassessment.minIntervalMs) return target;
    this.lastReassessmentAt = now;

    const gameData = context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const decision = this.targetReassessment.evaluate(context && context.snapshot, target, gameData);
    const round = (value) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)) : null;
    const baseRecord = {
      at: now,
      reason: decision.reason,
      currentTargetId: target && target.id || null,
      currentTargetType: target && target.mtype || null,
      currentTargetOwner: decision.currentTargetOwner == null ? (target && target.target || null) : decision.currentTargetOwner,
      candidateTargetId: decision.target && decision.target.id || null,
      candidateTargetType: decision.target && decision.target.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: round(decision.currentDistance),
      candidateDistance: round(decision.targetDistance),
      switchThresholdDistance: round(decision.switchThresholdDistance),
      currentThreatScore: round(decision.currentThreatScore),
      candidateThreatScore: round(decision.targetThreatScore),
      threatSwitchThreshold: round(decision.threatSwitchThreshold)
    };

    if (!decision.switchTarget || !decision.target) {
      this.lastReassessmentDecision = baseRecord;
      return target;
    }

    const sinceSwitch = now - this.lastTargetSwitchAt;
    if (sinceSwitch < this.targetReassessment.switchCooldownMs) {
      this.lastReassessmentDecision = {
        ...baseRecord,
        reason: 'TARGET_SWITCH_COOLDOWN',
        cooldownRemainingMs: Math.max(0, this.targetReassessment.switchCooldownMs - sinceSwitch)
      };
      return target;
    }

    const previousTargetId = target && target.id || null;
    const previousTargetType = target && target.mtype || null;
    const next = decision.target;
    this.targetId = String(next.id);
    this.targetType = next.mtype || null;
    this.lastTargetSwitchAt = now;
    this.lastReassessmentDecision = baseRecord;
    this.lastTargetSwitch = {
      at: now,
      reason: decision.reason,
      fromTargetId: previousTargetId,
      fromTargetType: previousTargetType,
      toTargetId: next.id || null,
      toTargetType: next.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: baseRecord.currentDistance,
      distance: baseRecord.candidateDistance,
      switchThresholdDistance: baseRecord.switchThresholdDistance,
      currentThreatScore: baseRecord.currentThreatScore,
      threatScore: baseRecord.candidateThreatScore,
      threatSwitchThreshold: baseRecord.threatSwitchThreshold
    };

    this._event('FARMER_TARGET_REASSESSED', 'info', decision.reason, {
      previousTargetId,
      previousTargetType,
      nextTargetId: next.id || null,
      nextTargetType: next.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: this.lastTargetSwitch.currentDistance,
      distance: this.lastTargetSwitch.distance,
      switchThresholdDistance: this.lastTargetSwitch.switchThresholdDistance,
      currentThreatScore: this.lastTargetSwitch.currentThreatScore,
      threatScore: this.lastTargetSwitch.threatScore,
      threatSwitchThreshold: this.lastTargetSwitch.threatSwitchThreshold
    });

    return next;
  }

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;

    if (snapshot && character && target && !target.dead && !(target.hp != null && target.hp <= 0)) {
      const recovery = this._needsRecovery(snapshot);
      const targetAllowed = this._targetAllowed(target, snapshot, context.party);

      if (!character.rip && !recovery.hpUnsafe && targetAllowed) {
        target = this._maybeReassessTarget(context, target);
        const reassessedTargetAllowed = this._targetAllowed(target, snapshot, context.party);

        if (reassessedTargetAllowed) {
          const kiteDecision = this.kiting.evaluate(character, target);
          if (kiteDecision.shouldMove) return super._engage(context, target);

          const { gameData } = this._updateSelectedSkill(context);
          const decision = this.skillUsage.evaluate(snapshot, target, gameData, context.adapter);
          this.lastSkillDecision = {
            at: this.now(),
            reason: decision.reason,
            skill: decision.skill ? decision.skill.id : null,
            targetId: target.id || null,
            targetType: target.mtype || null,
            mp: decision.mp == null ? null : Number(decision.mp),
            reserveMp: decision.reserveMp == null ? null : Number(decision.reserveMp.toFixed(2)),
            mpAfter: decision.mpAfter == null ? null : Number(decision.mpAfter.toFixed(2))
          };

          if (decision.useSkill && decision.skill) {
            const now = this.now();
            if (now - this.lastSkillAttemptAt >= this.skillUsage.minIntervalMs) {
              this.lastSkillAttemptAt = now;
              const result = context.adapter.command('use_skill', [decision.skill.id, String(target.id)]);
              if (result.executed || result.shadow) {
                this.lastActionAt = now;
                this.lastSkillUse = {
                  at: now,
                  skill: decision.skill.id,
                  skillName: decision.skill.name,
                  targetId: target.id || null,
                  targetType: target.mtype || null,
                  mpCost: decision.skill.mp,
                  damageMultiplier: decision.skill.damageMultiplier
                };
                this._event('FARMER_SKILL_USED', 'info', 'SAFE_DIRECT_DAMAGE_SKILL', {
                  skill: decision.skill.id,
                  skillName: decision.skill.name,
                  targetId: target.id || null,
                  targetType: target.mtype || null,
                  mpCost: decision.skill.mp,
                  damageMultiplier: decision.skill.damageMultiplier,
                  mpAfter: Number(decision.mpAfter.toFixed(2)),
                  reserveMp: Number(decision.reserveMp.toFixed(2))
                });
                return;
              }

              this._event('FARMER_SKILL_USE_FAILED', 'warn', result.reason || 'SKILL_COMMAND_FAILED', {
                skill: decision.skill.id,
                targetId: target.id || null,
                targetType: target.mtype || null
              });
            }
          }
        }
      }
    }

    return super._engage(context, target);
  }

  status() {
    return {
      ...super.status(),
      skillUsage: {
        ...this.skillUsage.status(),
        selectedSkill: this.selectedSkill,
        lastUse: this.lastSkillUse,
        lastDecision: this.lastSkillDecision
      },
      targetReassessment: {
        ...this.targetReassessment.status(),
        lastDecision: this.lastReassessmentDecision,
        lastSwitch: this.lastTargetSwitch
      }
    };
  }
}

module.exports = { SkillFarmerController };
