'use strict';

const MOVING_TARGET_FRESHNESS_MODE = 'motion-aware-position-freshness-v1';

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  const n = finite(value, min);
  return Math.max(min, Math.min(max, n));
}

function point(value) {
  return {
    x: finite(value && (value.real_x != null ? value.real_x : value.x)),
    y: finite(value && (value.real_y != null ? value.real_y : value.y))
  };
}

function distance(a, b) {
  const pa = point(a);
  const pb = point(b);
  if ([pa.x, pa.y, pb.x, pb.y].some((value) => value == null)) return null;
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

function sameMap(a, b) {
  if (!a || !b || !a.map || !b.map) return true;
  return String(a.map) === String(b.map);
}

function cleanMotion(raw = {}) {
  const mode = String(raw.mode || '').toUpperCase();
  const validMode = ['STABLE', 'MOVING', 'KITE'].includes(mode) ? mode : null;
  return {
    mode: validMode,
    moving: raw.moving === true,
    kiteActive: raw.kiteActive === true,
    declaredSpeed: Math.max(0, finite(raw.declaredSpeed, finite(raw.speed, 0))),
    observedSpeed: Math.max(0, finite(raw.observedSpeed, 0)),
    speedEstimate: Math.max(0, finite(raw.speedEstimate, 0)),
    displacement: Math.max(0, finite(raw.displacement, 0)),
    sampleMs: Math.max(0, finite(raw.sampleMs, 0))
  };
}

function deriveMotion(previous, current, options = {}) {
  const minObservedSpeed = Math.max(1, finite(options.minObservedSpeed, 6));
  const movingFallbackSpeed = Math.max(minObservedSpeed, finite(options.movingFallbackSpeed, 40));
  const declaredSpeed = Math.max(0, finite(current && (current.speed != null ? current.speed : current.declaredSpeed), 0));
  const movingSignal = !!(current && (current.moving === true || current.kiteActive === true || current.motion && current.motion.moving === true));
  const kiteSignal = !!(current && (current.kiteActive === true || current.motion && current.motion.kiteActive === true));

  const currentAt = finite(current && (current.sourceAt != null ? current.sourceAt : current.at));
  const previousAt = finite(previous && (previous.sourceAt != null ? previous.sourceAt : previous.at));
  const sampleMs = currentAt != null && previousAt != null ? Math.max(0, currentAt - previousAt) : 0;
  const displacement = previous && current && sampleMs > 0 && sameMap(previous, current)
    ? Math.max(0, finite(distance(previous, current), 0))
    : 0;
  const observedSpeed = sampleMs >= 150 ? displacement / (sampleMs / 1000) : 0;

  let mode = 'STABLE';
  if (kiteSignal) mode = 'KITE';
  else if (movingSignal || observedSpeed >= minObservedSpeed) mode = 'MOVING';

  const speedEstimate = mode === 'STABLE'
    ? 0
    : Math.max(observedSpeed, declaredSpeed, movingFallbackSpeed);

  return {
    mode,
    moving: mode !== 'STABLE',
    kiteActive: mode === 'KITE',
    declaredSpeed: Number(declaredSpeed.toFixed(3)),
    observedSpeed: Number(observedSpeed.toFixed(3)),
    speedEstimate: Number(speedEstimate.toFixed(3)),
    displacement: Number(displacement.toFixed(3)),
    sampleMs
  };
}

function positionFreshness(row, now = Date.now(), options = {}) {
  const staticTtlMs = Math.max(500, finite(options.staticTtlMs, 5000));
  const movingMaxError = Math.max(10, finite(options.movingMaxError, 70));
  const kiteMaxError = Math.max(10, Math.min(movingMaxError, finite(options.kiteMaxError, 55)));
  const futureSkewMs = Math.max(0, finite(options.futureSkewMs, 1000));
  const sourceAt = finite(row && (row.positionObservedAt != null ? row.positionObservedAt : row.sourceAt != null ? row.sourceAt : row.at));
  const receivedAt = finite(row && row.at, sourceAt);
  const sourceAgeMs = sourceAt == null ? Infinity : Math.max(0, finite(now, Date.now()) - sourceAt);
  const receivedAgeMs = receivedAt == null ? Infinity : Math.max(0, finite(now, Date.now()) - receivedAt);
  const futureSkew = sourceAt != null && sourceAt - finite(now, Date.now()) > futureSkewMs;

  const motion = cleanMotion(row && row.motion || {
    mode: row && row.kiteActive === true ? 'KITE' : row && row.moving === true ? 'MOVING' : 'STABLE',
    moving: row && row.moving === true,
    kiteActive: row && row.kiteActive === true,
    speedEstimate: row && row.speed
  });
  const mode = motion.mode || (motion.kiteActive ? 'KITE' : motion.moving ? 'MOVING' : 'STABLE');
  const speedEstimate = Math.max(
    0,
    motion.speedEstimate,
    mode !== 'STABLE' ? motion.declaredSpeed : 0,
    mode !== 'STABLE' ? finite(row && row.speed, 0) : 0
  );
  const uncertainty = mode === 'STABLE' ? 0 : speedEstimate * sourceAgeMs / 1000;
  const errorBudget = mode === 'KITE' ? kiteMaxError : movingMaxError;

  let reason = 'POSITION_FRESH';
  let fresh = true;
  if (sourceAt == null || receivedAt == null) {
    fresh = false;
    reason = 'POSITION_TIMESTAMP_MISSING';
  } else if (futureSkew) {
    fresh = false;
    reason = 'POSITION_TIMESTAMP_FUTURE_SKEW';
  } else if (sourceAgeMs > staticTtlMs || receivedAgeMs > staticTtlMs) {
    fresh = false;
    reason = 'POSITION_TTL_EXCEEDED';
  } else if (mode !== 'STABLE' && uncertainty > errorBudget) {
    fresh = false;
    reason = mode === 'KITE' ? 'KITE_POSITION_UNCERTAINTY_EXCEEDED' : 'MOVING_POSITION_UNCERTAINTY_EXCEEDED';
  }

  return {
    schemaVersion: 1,
    mode: MOVING_TARGET_FRESHNESS_MODE,
    fresh,
    reason,
    motionMode: mode,
    sourceAt,
    receivedAt,
    sourceAgeMs: Number.isFinite(sourceAgeMs) ? Math.round(sourceAgeMs) : null,
    receivedAgeMs: Number.isFinite(receivedAgeMs) ? Math.round(receivedAgeMs) : null,
    speedEstimate: Number(speedEstimate.toFixed(3)),
    uncertainty: Number(uncertainty.toFixed(3)),
    errorBudget
  };
}

module.exports = {
  MOVING_TARGET_FRESHNESS_MODE,
  deriveMotion,
  positionFreshness,
  cleanMotion,
  distance,
  point
};
