'use strict';

const FARMER_TRAVEL_SAFETY_MODE = 'bounded-farmer-target-travel-v1';

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

class FarmerTravelSafetyHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer) throw new Error('runtime farmer required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.minStep = Math.max(20, Number(options.minStep) || 50);
    this.maxStep = Math.max(this.minStep, Number(options.maxStep) || 120);
    this.stepSeconds = Math.max(0.5, Math.min(4, Number(options.stepSeconds) || 2));
    this.stats = { travelCalls: 0, boundedMoves: 0, unboundedDistanceAvoided: 0, moveFailures: 0 };
    this.lastMove = null;
    this._install();
  }

  _boundedStep(character, travel) {
    const speed = Math.max(1, Number(character && character.speed) || 40);
    const desired = Math.max(this.minStep, Math.min(this.maxStep, speed * this.stepSeconds));
    return Math.min(Math.max(0, travel), desired);
  }

  _install() {
    const farmer = this.farmer;
    if (farmer.__boundedTargetTravelInstalled) return;
    farmer.__boundedTargetTravelInstalled = true;
    farmer._travel = (context, target) => {
      this.stats.travelCalls += 1;
      const snapshot = context && context.snapshot;
      const c = snapshot && snapshot.character;
      if (!snapshot || !c) {
        farmer._block('TARGET_POSITION_UNKNOWN');
        return;
      }
      if (!target || target.dead || (target.hp != null && target.hp <= 0)) {
        farmer._clearTarget('TARGET_GONE');
        farmer._transition('REASSESS', 'TARGET_GONE');
        return;
      }
      if (!farmer._targetAllowed(target, snapshot, context.party)) {
        farmer._clearTarget('TARGET_POLICY_REJECTED');
        farmer._transition('REASSESS', 'TARGET_POLICY_REJECTED');
        return;
      }

      const engageRange = farmer._engagementRange(snapshot);
      const d = distance(c, target);
      if (d <= engageRange) {
        farmer._transition('ENGAGE', 'IN_RANGE', { distance: Math.round(d), engageRange: Math.round(engageRange) });
        return;
      }
      if (!Number.isFinite(d) || target.x == null || target.y == null || c.x == null || c.y == null) {
        farmer._block('TARGET_POSITION_UNKNOWN');
        return;
      }

      const now = farmer.now();
      if (now - farmer.lastActionAt < farmer.config.moveCooldownMs) return;
      const dx = Number(target.x) - Number(c.x);
      const dy = Number(target.y) - Number(c.y);
      const len = Math.max(1, Math.hypot(dx, dy));
      const desiredRange = Math.max(20, engageRange * 0.9);
      const rawTravel = Math.max(0, len - desiredRange);
      const step = this._boundedStep(c, rawTravel);
      const x = Number(c.x) + (dx / len) * step;
      const y = Number(c.y) + (dy / len) * step;
      const result = context.adapter.command('move', [x, y]);
      farmer.lastActionAt = now;

      if (!result.executed && !result.shadow && !result.coalesced) {
        this.stats.moveFailures += 1;
        farmer._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'MOVE_COMMAND_UNAVAILABLE' : 'MOVE_COMMAND_FAILED');
        return;
      }

      if (rawTravel > step + 0.01) {
        this.stats.boundedMoves += 1;
        this.stats.unboundedDistanceAvoided += rawTravel - step;
      }
      this.lastMove = {
        at: now,
        targetId: target.id == null ? null : String(target.id),
        targetType: target.mtype || null,
        distance: d,
        engageRange,
        rawTravel,
        step,
        x,
        y,
        executed: !!result.executed,
        shadow: !!result.shadow,
        coalesced: !!result.coalesced,
        reason: result.reason || null
      };
      farmer._event('FARMER_MOVE_REQUESTED', 'info', 'TARGET_OUT_OF_RANGE', {
        x: Math.round(x),
        y: Math.round(y),
        distance: Math.round(d),
        engageRange: Math.round(engageRange),
        boundedStep: Math.round(step),
        rawTravel: Math.round(rawTravel)
      });
    };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: FARMER_TRAVEL_SAFETY_MODE,
      minStep: this.minStep,
      maxStep: this.maxStep,
      stepSeconds: this.stepSeconds,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      stats: { ...this.stats, unboundedDistanceAvoided: Math.round(this.stats.unboundedDistanceAvoided) }
    };
  }
}

function installFarmerTravelSafetyHotfix(runtime, options = {}) {
  return new FarmerTravelSafetyHotfix(runtime, options);
}

module.exports = { FarmerTravelSafetyHotfix, installFarmerTravelSafetyHotfix, FARMER_TRAVEL_SAFETY_MODE };
