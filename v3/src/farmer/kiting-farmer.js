'use strict';

const { FarmerController } = require('./farmer-fsm');
const { BasicKitingPolicy } = require('./basic-kiting');

class KitingFarmerController extends FarmerController {
  constructor(options = {}) {
    super(options);
    this.kiting = options.kiting || new BasicKitingPolicy({
      enabled: options.kitingEnabled !== false,
      minRange: options.kitingMinRange,
      tooCloseFactor: options.kitingTooCloseFactor,
      desiredFactor: options.kitingDesiredFactor,
      maxStepFactor: options.kitingMaxStepFactor,
      speedStepSeconds: options.kitingSpeedStepSeconds
    });
    this.kiteMoveCooldownMs = Math.max(250, Number(options.kitingMoveCooldownMs) || 650);
    this.lastKiteAt = -Infinity;
    this.lastKiteMove = null;
  }

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    if (snapshot && snapshot.character && target && !target.dead && !(target.hp != null && target.hp <= 0)) {
      const recovery = this._needsRecovery(snapshot);
      const targetAllowed = this._targetAllowed(target, snapshot, context.party);
      if (!snapshot.character.rip && !recovery.hpUnsafe && targetAllowed) {
        const decision = this.kiting.evaluate(snapshot.character, target);
        if (decision.shouldMove) {
          const now = this.now();
          if (now - this.lastKiteAt >= this.kiteMoveCooldownMs) {
            const result = context.adapter.command('move', [decision.x, decision.y]);
            if (result.executed || result.shadow) {
              this.lastKiteAt = now;
              this.lastActionAt = now;
              this.lastKiteMove = {
                at: now,
                targetId: target.id || null,
                targetType: target.mtype || null,
                reason: decision.reason,
                fromDistance: decision.distance,
                desiredDistance: decision.desiredDistance,
                step: decision.step,
                x: Number(decision.x.toFixed(2)),
                y: Number(decision.y.toFixed(2))
              };
              this._event('FARMER_KITE_MOVE_REQUESTED', 'info', decision.reason, {
                distance: decision.distance,
                range: decision.range,
                tooCloseDistance: decision.tooCloseDistance,
                desiredDistance: decision.desiredDistance,
                step: decision.step,
                x: Math.round(decision.x),
                y: Math.round(decision.y)
              });
              return;
            }

            this._event('FARMER_KITE_MOVE_FAILED', 'warn', result.reason || 'KITE_MOVE_FAILED', {
              distance: decision.distance,
              x: Math.round(decision.x),
              y: Math.round(decision.y)
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
      kiting: {
        ...this.kiting.status(),
        moveCooldownMs: this.kiteMoveCooldownMs,
        lastMove: this.lastKiteMove
      }
    };
  }
}

module.exports = { KitingFarmerController };
