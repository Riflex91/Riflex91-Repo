'use strict';

const HOST_WATCHDOG_SCHEMA_VERSION = 1;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class HostWatchdogBeacon {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.leaseMs = Math.max(5000, Math.min(5 * 60 * 1000, finite(options.leaseMs, 30000)));
    this.sequence = 0;
    this.lastBeacon = null;
    this.stats = { beacons: 0 };
  }

  emit(runtime, context = {}) {
    const at = this.now();
    const snapshot = runtime && runtime.lastSnapshot || null;
    const character = snapshot && snapshot.character || null;
    const status = runtime && typeof runtime.status === 'function' ? (() => {
      try { return runtime.status(); } catch (_) { return {}; }
    })() : {};
    const health = context.health || {};
    const watchdog = context.watchdog || health.watchdog || {};
    const group = context.group || health.groupLiveness || {};
    const recovery = context.recovery || {};
    const alerting = context.alerting || {};
    const beacon = {
      schemaVersion: HOST_WATCHDOG_SCHEMA_VERSION,
      type: 'AIO_V3_HOST_WATCHDOG_BEACON',
      seq: ++this.sequence,
      at,
      deadlineAt: at + this.leaseMs,
      leaseMs: this.leaseMs,
      runId: runtime && runtime.log && runtime.log.runId || null,
      release: status.version || null,
      character: character ? { name: character.name || null, ctype: character.ctype || null, map: character.map || null, rip: character.rip === true } : null,
      runtime: {
        mode: runtime && runtime.adapter && runtime.adapter.mode || status.mode || null,
        heartbeatAt: finite(runtime && runtime.lastHeartbeat),
        snapshotAt: finite(snapshot && snapshot.observedAt)
      },
      health: {
        state: health.state || null,
        watchdogState: watchdog.state || null,
        watchdogReason: watchdog.reason || null,
        groupState: group.state || null,
        fourCharacterReady: group.fourCharacterReady === true
      },
      recovery: {
        enabled: recovery.enabled === true,
        stage: recovery.lastPlan && recovery.lastPlan.stage || null,
        rawGameplayActionAuthority: false,
        automaticRestart: false
      },
      alerts: {
        pending: finite(alerting.pending, 0),
        pendingCritical: finite(alerting.pendingCritical, 0)
      },
      contract: {
        externalDeadManRequired: true,
        hostMustTreatMissedDeadlineAsUnhealthy: true,
        hostOwnsRestart: true,
        authenticationOwnedByHost: true,
        actionAuthority: false
      }
    };
    this.lastBeacon = beacon;
    this.stats.beacons += 1;
    return clone(beacon);
  }

  peek() { return clone(this.lastBeacon); }

  status() {
    return {
      schemaVersion: HOST_WATCHDOG_SCHEMA_VERSION,
      mode: 'external-dead-man-contract',
      actionAuthority: false,
      hostOwnsRestart: true,
      externalDeadManRequired: true,
      leaseMs: this.leaseMs,
      sequence: this.sequence,
      lastBeaconAt: this.lastBeacon && this.lastBeacon.at || null,
      lastDeadlineAt: this.lastBeacon && this.lastBeacon.deadlineAt || null,
      stats: { ...this.stats }
    };
  }
}

module.exports = { HostWatchdogBeacon, HOST_WATCHDOG_SCHEMA_VERSION };
