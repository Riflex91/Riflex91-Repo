'use strict';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

class BasicKitingPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.minRange = Math.max(40, Number(options.minRange) || 80);
    this.tooCloseFactor = clamp(options.tooCloseFactor == null ? 0.45 : options.tooCloseFactor, 0.2, 0.75);
    this.desiredFactor = clamp(options.desiredFactor == null ? 0.72 : options.desiredFactor, this.tooCloseFactor + 0.05, 0.9);
    this.maxStepFactor = clamp(options.maxStepFactor == null ? 0.4 : options.maxStepFactor, 0.15, 0.6);
    this.speedStepSeconds = clamp(options.speedStepSeconds == null ? 1.25 : options.speedStepSeconds, 0.5, 2);
  }

  evaluate(character, target) {
    if (!this.enabled) return { shouldMove: false, reason: 'KITING_DISABLED' };
    if (!character || !target) return { shouldMove: false, reason: 'KITING_NOT_APPLICABLE' };

    const range = finite(character.range);
    if (range == null || range < this.minRange) {
      return { shouldMove: false, reason: 'RANGE_CAPABILITY_TOO_LOW', range };
    }

    if (target.target && target.target !== character.name) {
      return { shouldMove: false, reason: 'TARGET_FOCUSED_ELSEWHERE', range, targetOwner: target.target };
    }

    const cx = finite(character.x);
    const cy = finite(character.y);
    const tx = finite(target.x);
    const ty = finite(target.y);
    if (cx == null || cy == null || tx == null || ty == null) {
      return { shouldMove: false, reason: 'POSITION_UNKNOWN', range };
    }

    const dx = cx - tx;
    const dy = cy - ty;
    const distance = Math.hypot(dx, dy);
    const tooCloseDistance = range * this.tooCloseFactor;
    const desiredDistance = range * this.desiredFactor;

    if (distance >= tooCloseDistance) {
      return {
        shouldMove: false,
        reason: 'DISTANCE_OK',
        distance: Number(distance.toFixed(2)),
        range,
        tooCloseDistance: Number(tooCloseDistance.toFixed(2)),
        desiredDistance: Number(desiredDistance.toFixed(2))
      };
    }

    if (distance < 0.001) {
      return { shouldMove: false, reason: 'POSITION_OVERLAP', distance: 0, range };
    }

    const speed = Math.max(1, finite(character.speed) || 40);
    const maxStep = Math.max(20, Math.min(range * this.maxStepFactor, speed * this.speedStepSeconds));
    const step = Math.max(0, Math.min(desiredDistance - distance, maxStep));
    if (step < 1) return { shouldMove: false, reason: 'KITE_STEP_TOO_SMALL', distance, range };

    const ux = dx / distance;
    const uy = dy / distance;
    return {
      shouldMove: true,
      reason: 'TARGET_TOO_CLOSE',
      x: cx + ux * step,
      y: cy + uy * step,
      distance: Number(distance.toFixed(2)),
      range,
      tooCloseDistance: Number(tooCloseDistance.toFixed(2)),
      desiredDistance: Number(desiredDistance.toFixed(2)),
      step: Number(step.toFixed(2))
    };
  }

  status() {
    return {
      enabled: this.enabled,
      minRange: this.minRange,
      tooCloseFactor: this.tooCloseFactor,
      desiredFactor: this.desiredFactor,
      maxStepFactor: this.maxStepFactor,
      speedStepSeconds: this.speedStepSeconds
    };
  }
}

module.exports = { BasicKitingPolicy };
