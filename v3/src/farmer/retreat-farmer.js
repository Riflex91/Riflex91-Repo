'use strict';

const { SkillFarmerController } = require('./skill-farmer');
const { SafeRetreatPolicy } = require('./safe-retreat');
const { FarmerState } = require('./farmer-fsm');

class RetreatFarmerController extends SkillFarmerController {
  constructor(options = {}) {
    super(options);
    this.safeRetreat = options.safeRetreat || new SafeRetreatPolicy({
      enabled: options.safeRetreatEnabled !== false,
      stepSeconds: options.safeRetreatStepSeconds,
      minStep: options.safeRetreatMinStep,
      maxStep: options.safeRetreatMaxStep,
      maxThreats: options.safeRetreatMaxThreats
    });
    this.lastSafeRetreatMove = null;
    this.lastSafeRetreatFailure = null;
  }

  _consumePendingRetreat(context) {
    const runtime = context && context.runtime;
    if (!runtime || typeof runtime.takeEmergencyRetreat !== 'function') return null;
    return runtime.takeEmergencyRetreat();
  }

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    const pending = this._consumePendingRetreat(context);

    if (pending && snapshot && character && !character.rip) {
      const recovery = this._needsRecovery(snapshot);
      this._maybePotion(context, recovery);
      const decision = this.safeRetreat.evaluate(character, pending.threats || []);

      if (decision.shouldMove) {
        const result = context.adapter.command('move', [decision.x, decision.y]);
        if (result.executed || result.shadow) {
          const now = this.now();
          this.lastActionAt = now;
          this.lastSafeRetreatMove = {
            at: now,
            emergencyReason: pending.reason || null,
            sourceTargetId: pending.sourceTargetId || null,
            sourceTargetType: pending.sourceTargetType || null,
            hpRatio: pending.hpRatio == null ? null : Number(pending.hpRatio),
            reason: decision.reason,
            threatCount: decision.threatCount,
            nearestThreatId: decision.nearestThreatId,
            nearestThreatDistance: decision.nearestThreatDistance,
            step: decision.step,
            x: Number(decision.x.toFixed(2)),
            y: Number(decision.y.toFixed(2))
          };
          this.lastSafeRetreatFailure = null;
          this._event('FARMER_SAFE_RETREAT_REQUESTED', 'warn', decision.reason, {
            emergencyReason: pending.reason || null,
            sourceTargetId: pending.sourceTargetId || null,
            sourceTargetType: pending.sourceTargetType || null,
            hpRatio: pending.hpRatio == null ? null : Number(pending.hpRatio),
            threatCount: decision.threatCount,
            nearestThreatId: decision.nearestThreatId,
            nearestThreatDistance: decision.nearestThreatDistance,
            step: decision.step,
            x: Math.round(decision.x),
            y: Math.round(decision.y)
          });
          this._clearTarget('EMERGENCY_SAFE_RETREAT');
          this._transition(FarmerState.RECOVER, 'EMERGENCY_SAFE_RETREAT');
          return;
        }

        this.lastSafeRetreatFailure = {
          at: this.now(),
          reason: result.reason || 'SAFE_RETREAT_MOVE_FAILED',
          emergencyReason: pending.reason || null,
          sourceTargetId: pending.sourceTargetId || null,
          sourceTargetType: pending.sourceTargetType || null
        };
        this._event('FARMER_SAFE_RETREAT_FAILED', 'warn', this.lastSafeRetreatFailure.reason, {
          emergencyReason: pending.reason || null,
          sourceTargetId: pending.sourceTargetId || null,
          sourceTargetType: pending.sourceTargetType || null,
          x: Math.round(decision.x),
          y: Math.round(decision.y)
        });
      } else {
        this.lastSafeRetreatFailure = {
          at: this.now(),
          reason: decision.reason,
          emergencyReason: pending.reason || null,
          sourceTargetId: pending.sourceTargetId || null,
          sourceTargetType: pending.sourceTargetType || null
        };
        this._event('FARMER_SAFE_RETREAT_SKIPPED', 'warn', decision.reason, {
          emergencyReason: pending.reason || null,
          sourceTargetId: pending.sourceTargetId || null,
          sourceTargetType: pending.sourceTargetType || null
        });
      }

      this._clearTarget('EMERGENCY_SAFE_RETREAT_UNAVAILABLE');
      this._transition(FarmerState.RECOVER, 'EMERGENCY_SAFE_RETREAT_UNAVAILABLE');
      return;
    }

    return super._engage(context, target);
  }

  status() {
    return {
      ...super.status(),
      safeRetreat: {
        ...this.safeRetreat.status(),
        lastMove: this.lastSafeRetreatMove,
        lastFailure: this.lastSafeRetreatFailure
      }
    };
  }
}

module.exports = { RetreatFarmerController };
