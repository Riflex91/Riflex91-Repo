'use strict';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

class SafeRetreatPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.stepSeconds = Math.max(0.5, Math.min(3, finite(options.stepSeconds, 1.5)));
    this.minStep = Math.max(15, Math.min(80, finite(options.minStep, 35)));
    this.maxStep = Math.max(this.minStep, Math.min(160, finite(options.maxStep, 90)));
    this.maxThreats = Math.max(1, Math.min(10, Math.floor(finite(options.maxThreats, 6))));
  }

  evaluate(character, threats = []) {
    if (!this.enabled) return { shouldMove: false, reason: 'SAFE_RETREAT_DISABLED' };
    if (!character || character.x == null || character.y == null) {
      return { shouldMove: false, reason: 'CHARACTER_POSITION_UNKNOWN' };
    }

    const cx = Number(character.x);
    const cy = Number(character.y);
    const positioned = (threats || [])
      .filter((threat) => threat && threat.x != null && threat.y != null)
      .slice(0, this.maxThreats)
      .map((threat) => ({
        ...threat,
        x: Number(threat.x),
        y: Number(threat.y),
        distance: Math.hypot(cx - Number(threat.x), cy - Number(threat.y))
      }))
      .filter((threat) => Number.isFinite(threat.distance));

    if (!positioned.length) return { shouldMove: false, reason: 'THREAT_POSITION_UNKNOWN' };

    let awayX = 0;
    let awayY = 0;
    for (const threat of positioned) {
      const d = Math.max(1, threat.distance);
      const weight = 1 / Math.max(20, d);
      awayX += ((cx - threat.x) / d) * weight;
      awayY += ((cy - threat.y) / d) * weight;
    }

    let vectorLength = Math.hypot(awayX, awayY);
    let fallbackThreat = null;
    if (vectorLength < 0.0001) {
      fallbackThreat = positioned.slice().sort((a, b) => a.distance - b.distance)[0];
      const d = Math.max(1, fallbackThreat.distance);
      awayX = (cx - fallbackThreat.x) / d;
      awayY = (cy - fallbackThreat.y) / d;
      vectorLength = Math.hypot(awayX, awayY);
    }

    if (vectorLength < 0.0001) return { shouldMove: false, reason: 'RETREAT_DIRECTION_UNAVAILABLE' };

    const speed = Math.max(1, finite(character.speed, 40));
    const step = Math.max(this.minStep, Math.min(this.maxStep, speed * this.stepSeconds));
    const ux = awayX / vectorLength;
    const uy = awayY / vectorLength;
    const nearest = positioned.slice().sort((a, b) => a.distance - b.distance)[0];

    return {
      shouldMove: true,
      reason: 'EMERGENCY_THREAT_RETREAT',
      x: cx + ux * step,
      y: cy + uy * step,
      step: Number(step.toFixed(2)),
      threatCount: positioned.length,
      nearestThreatId: nearest && nearest.id || null,
      nearestThreatDistance: nearest ? Number(nearest.distance.toFixed(2)) : null,
      fallbackThreatId: fallbackThreat && fallbackThreat.id || null
    };
  }

  status() {
    return {
      enabled: this.enabled,
      stepSeconds: this.stepSeconds,
      minStep: this.minStep,
      maxStep: this.maxStep,
      maxThreats: this.maxThreats
    };
  }
}

module.exports = { SafeRetreatPolicy };
