'use strict';

const RUNTIME_WATCHDOG_SCHEMA_VERSION = 1;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function snapshotToken(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return null;
  return JSON.stringify([
    c.map || null,
    finite(c.x), finite(c.y), finite(c.xp), finite(c.gold),
    c.target || null, c.moving === true, c.rip === true
  ]);
}

class RuntimeProgressWatchdog {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.watchAfterMs = Math.max(1000, finite(options.watchAfterMs, 15000));
    this.degradedAfterMs = Math.max(this.watchAfterMs, finite(options.degradedAfterMs, 45000));
    this.progressWatchAfterMs = Math.max(5000, finite(options.progressWatchAfterMs, 30000));
    this.progressDegradedAfterMs = Math.max(this.progressWatchAfterMs, finite(options.progressDegradedAfterMs, 120000));
    this.clockBackwardsToleranceMs = Math.max(0, finite(options.clockBackwardsToleranceMs, 1000));
    this.lastObservedAt = null;
    this.lastSnapshotAt = null;
    this.lastHeartbeatAt = null;
    this.lastProgressAt = null;
    this.lastProgressToken = null;
    this.lastState = 'HEALTHY';
    this.lastReason = null;
    this.clockAnomalies = 0;
    this.transitions = 0;
    this.observations = 0;
    this.lastTransition = null;
  }

  _activityExpected(runtime, snapshot) {
    if (!runtime || !snapshot || !snapshot.character) return false;
    if (!(runtime.adapter && runtime.adapter.mode === 'active')) return false;
    if (snapshot.character.rip === true) return false;
    let farmer = null;
    try { farmer = typeof runtime.farmerStatus === 'function' ? runtime.farmerStatus() : null; } catch (_) {}
    if (!farmer || farmer.enabled !== true) return false;
    const state = String(farmer.state || '');
    if (['ENGAGE', 'MOVE', 'RETREAT', 'RECOVER'].includes(state)) return true;
    if (snapshot.character.moving === true || snapshot.character.target) return true;
    const scheduler = runtime.scheduler && runtime.scheduler.snapshot ? runtime.scheduler.snapshot() : null;
    return !!(scheduler && Array.isArray(scheduler.active) && scheduler.active.length > 0 && !['IDLE', 'WAITING'].includes(state));
  }

  _ages(runtime, now) {
    const snapshotAt = runtime && runtime.lastSnapshot && finite(runtime.lastSnapshot.observedAt);
    const heartbeatAt = runtime && finite(runtime.lastHeartbeat);
    return {
      snapshotAgeMs: snapshotAt == null ? null : Math.max(0, now - snapshotAt),
      heartbeatAgeMs: heartbeatAt == null || heartbeatAt <= 0 ? null : Math.max(0, now - heartbeatAt)
    };
  }

  _transition(state, reason, now) {
    if (state === this.lastState && reason === this.lastReason) return null;
    const previous = this.lastState;
    this.lastState = state;
    this.lastReason = reason;
    this.transitions += 1;
    this.lastTransition = { at: now, previous, state, reason };
    return { ...this.lastTransition };
  }

  observe(runtime, group = null) {
    const now = this.now();
    this.observations += 1;
    let clockBackwards = false;
    if (this.lastObservedAt != null && now + this.clockBackwardsToleranceMs < this.lastObservedAt) {
      this.clockAnomalies += 1;
      clockBackwards = true;
    }
    this.lastObservedAt = now;

    const snapshot = runtime && runtime.lastSnapshot || null;
    if (snapshot && finite(snapshot.observedAt) != null) this.lastSnapshotAt = Number(snapshot.observedAt);
    if (runtime && finite(runtime.lastHeartbeat) != null && Number(runtime.lastHeartbeat) > 0) this.lastHeartbeatAt = Number(runtime.lastHeartbeat);

    const token = snapshotToken(snapshot);
    if (token != null && token !== this.lastProgressToken) {
      this.lastProgressToken = token;
      this.lastProgressAt = now;
    } else if (token != null && this.lastProgressAt == null) {
      this.lastProgressAt = now;
    }

    const activityExpected = this._activityExpected(runtime, snapshot);
    if (!activityExpected && token != null) this.lastProgressAt = now;

    const ages = this._ages(runtime, now);
    const progressAgeMs = this.lastProgressAt == null ? null : Math.max(0, now - this.lastProgressAt);
    let state = 'HEALTHY';
    let reason = null;
    let recoveryRecommendation = null;

    if (clockBackwards) {
      state = 'DEGRADED'; reason = 'CLOCK_MOVED_BACKWARDS'; recoveryRecommendation = 'SAFE_MODE_AND_REOBSERVE';
    } else if (!snapshot) {
      state = 'DEGRADED'; reason = 'SNAPSHOT_UNAVAILABLE'; recoveryRecommendation = 'REOBSERVE_OR_RESTART';
    } else if (ages.snapshotAgeMs != null && ages.snapshotAgeMs >= this.degradedAfterMs) {
      state = 'DEGRADED'; reason = 'SNAPSHOT_STALE'; recoveryRecommendation = 'REOBSERVE_OR_RESTART';
    } else if (ages.heartbeatAgeMs != null && ages.heartbeatAgeMs >= this.degradedAfterMs) {
      state = 'DEGRADED'; reason = 'HEARTBEAT_STALE'; recoveryRecommendation = 'REOBSERVE_OR_RESTART';
    } else if (activityExpected && progressAgeMs != null && progressAgeMs >= this.progressDegradedAfterMs) {
      state = 'DEGRADED'; reason = 'EXPECTED_ACTIVITY_NO_PROGRESS'; recoveryRecommendation = 'REPLAN_THEN_SAFE_MODE';
    } else if (group && group.localCharacter && group.state === 'DEGRADED') {
      state = 'WATCH'; reason = 'GROUP_LIVENESS_DEGRADED'; recoveryRecommendation = 'REOBSERVE_PARTY';
    } else if ((ages.snapshotAgeMs != null && ages.snapshotAgeMs >= this.watchAfterMs) || (ages.heartbeatAgeMs != null && ages.heartbeatAgeMs >= this.watchAfterMs)) {
      state = 'WATCH'; reason = 'RUNTIME_FRESHNESS_WATCH'; recoveryRecommendation = 'REOBSERVE';
    } else if (activityExpected && progressAgeMs != null && progressAgeMs >= this.progressWatchAfterMs) {
      state = 'WATCH'; reason = 'EXPECTED_ACTIVITY_PROGRESS_WATCH'; recoveryRecommendation = 'REOBSERVE_THEN_REPLAN';
    } else if (group && group.localCharacter && group.state === 'WATCH') {
      state = 'WATCH'; reason = 'GROUP_LIVENESS_WATCH'; recoveryRecommendation = 'REOBSERVE_PARTY';
    }

    const transition = this._transition(state, reason, now);
    return {
      ...this.status(runtime, group),
      state,
      reason,
      recoveryRecommendation,
      activityExpected,
      progressAgeMs,
      transition
    };
  }

  status(runtime, group = null) {
    const now = this.now();
    const ages = this._ages(runtime, now);
    const snapshot = runtime && runtime.lastSnapshot || null;
    const activityExpected = this._activityExpected(runtime, snapshot);
    const progressAgeMs = this.lastProgressAt == null ? null : Math.max(0, now - this.lastProgressAt);
    let state = this.lastState;
    let reason = this.lastReason;
    let recommendation = null;

    if (ages.snapshotAgeMs != null && ages.snapshotAgeMs >= this.degradedAfterMs) { state = 'DEGRADED'; reason = 'SNAPSHOT_STALE'; recommendation = 'REOBSERVE_OR_RESTART'; }
    else if (ages.heartbeatAgeMs != null && ages.heartbeatAgeMs >= this.degradedAfterMs) { state = 'DEGRADED'; reason = 'HEARTBEAT_STALE'; recommendation = 'REOBSERVE_OR_RESTART'; }
    else if (activityExpected && progressAgeMs != null && progressAgeMs >= this.progressDegradedAfterMs) { state = 'DEGRADED'; reason = 'EXPECTED_ACTIVITY_NO_PROGRESS'; recommendation = 'REPLAN_THEN_SAFE_MODE'; }
    else if ((ages.snapshotAgeMs != null && ages.snapshotAgeMs >= this.watchAfterMs) || (ages.heartbeatAgeMs != null && ages.heartbeatAgeMs >= this.watchAfterMs)) { state = 'WATCH'; reason = 'RUNTIME_FRESHNESS_WATCH'; recommendation = 'REOBSERVE'; }
    else if (activityExpected && progressAgeMs != null && progressAgeMs >= this.progressWatchAfterMs) { state = 'WATCH'; reason = 'EXPECTED_ACTIVITY_PROGRESS_WATCH'; recommendation = 'REOBSERVE_THEN_REPLAN'; }
    else if (group && group.localCharacter && group.state === 'DEGRADED') { state = 'WATCH'; reason = 'GROUP_LIVENESS_DEGRADED'; recommendation = 'REOBSERVE_PARTY'; }
    else if (group && group.localCharacter && group.state === 'WATCH') { state = 'WATCH'; reason = 'GROUP_LIVENESS_WATCH'; recommendation = 'REOBSERVE_PARTY'; }

    return {
      schemaVersion: RUNTIME_WATCHDOG_SCHEMA_VERSION,
      mode: 'observe-and-recommend-only',
      actionAuthority: false,
      automaticRecovery: false,
      state,
      reason,
      recoveryRecommendation: recommendation,
      activityExpected,
      snapshotAgeMs: ages.snapshotAgeMs,
      heartbeatAgeMs: ages.heartbeatAgeMs,
      progressAgeMs,
      lastObservedAt: this.lastObservedAt,
      lastProgressAt: this.lastProgressAt,
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs,
      progressWatchAfterMs: this.progressWatchAfterMs,
      progressDegradedAfterMs: this.progressDegradedAfterMs,
      clockAnomalies: this.clockAnomalies,
      observations: this.observations,
      transitions: this.transitions,
      lastTransition: this.lastTransition ? { ...this.lastTransition } : null
    };
  }
}

module.exports = { RuntimeProgressWatchdog, RUNTIME_WATCHDOG_SCHEMA_VERSION };
