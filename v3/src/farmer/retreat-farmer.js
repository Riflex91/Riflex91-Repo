'use strict';

const { TaskState } = require('../core/task');
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

  _ensureEmergencyPending(context) {
    const runtime = context && context.runtime;
    const adapter = context && context.adapter;
    if (!runtime || !adapter || adapter.mode !== 'active') return null;
    if (runtime.pendingEmergencyRetreat) return runtime.pendingEmergencyRetreat;
    if (!runtime.combatEmergency || typeof runtime.combatEmergency.evaluate !== 'function') return null;
    if (typeof runtime._noteEmergencyDisengage !== 'function') return null;
    if (this.targetId == null) return null;

    const snapshot = runtime.lastSnapshot || context.snapshot;
    const character = snapshot && snapshot.character;
    if (!snapshot || !character || character.rip) return null;

    const target = (snapshot.entities || []).find((entity) => (
      entity && entity.mtype && !entity.dead &&
      (entity.hp == null || Number(entity.hp) > 0) &&
      String(entity.id) === String(this.targetId)
    ));
    if (!target) return null;

    const emergency = runtime.combatEmergency.evaluate(snapshot, target);
    if (!emergency || !emergency.triggered) return null;

    runtime._noteEmergencyDisengage(target, emergency, snapshot);
    return runtime.pendingEmergencyRetreat || null;
  }

  _handlePendingRetreat(context, pending) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    if (!pending || !snapshot || !character || character.rip) return false;

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
        return true;
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
    return true;
  }

  _activeStep(context) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    if (!snapshot || !character) return super._activeStep(context);

    // Emergency handling must not depend on the current FSM state. Kiting can
    // legitimately move ENGAGE -> TRAVEL while the character is still under
    // attack. Use the runtime's raw snapshot so safety/risk filtering cannot
    // hide the current target from the emergency gate.
    this._ensureEmergencyPending(context);
    const pending = this._consumePendingRetreat(context);
    if (pending && !character.rip) {
      this._handlePendingRetreat(context, pending);
      return { state: TaskState.RUNNING };
    }

    return super._activeStep(context);
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
