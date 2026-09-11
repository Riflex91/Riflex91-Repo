'use strict';

const { KitingFarmerController } = require('./kiting-farmer');
const { SkillUsagePolicy } = require('./skill-usage');

class SkillFarmerController extends KitingFarmerController {
  constructor(options = {}) {
    super(options);
    this.skillUsage = options.skillUsage || new SkillUsagePolicy({
      enabled: options.skillUsageEnabled !== false,
      mpReserveRatio: options.skillUsageMpReserveRatio,
      minIntervalMs: options.skillUsageMinIntervalMs
    });
    this.lastSkillAttemptAt = -Infinity;
    this.selectedSkill = null;
    this.lastSkillUse = null;
    this.lastSkillDecision = null;
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

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;

    if (snapshot && character && target && !target.dead && !(target.hp != null && target.hp <= 0)) {
      const recovery = this._needsRecovery(snapshot);
      const targetAllowed = this._targetAllowed(target, snapshot, context.party);

      if (!character.rip && !recovery.hpUnsafe && targetAllowed) {
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
      }
    };
  }
}

module.exports = { SkillFarmerController };
