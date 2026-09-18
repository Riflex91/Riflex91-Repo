'use strict';

const HOST_RESTART_ACK = 'ALPHA20_5_HOST_RESTART';
const HOST_SUPERVISOR_SCHEMA_VERSION = 1;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(value, min, max, fallback) {
  const n = finite(value, fallback);
  return Math.max(min, Math.min(max, n));
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class HostWatchdogSupervisor {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.restartProcess = typeof options.restartProcess === 'function' ? options.restartProcess : null;
    this.startupGraceMs = clamp(options.startupGraceMs, 5000, 10 * 60 * 1000, 60000);
    this.restartDelayMs = clamp(options.restartDelayMs, 1000, 10 * 60 * 1000, 10000);
    this.restartCooldownMs = clamp(options.restartCooldownMs, 5000, 60 * 60 * 1000, 60000);
    this.restartWindowMs = clamp(options.restartWindowMs, 60000, 24 * 60 * 60 * 1000, 30 * 60 * 1000);
    this.maxRestartsPerWindow = Math.max(1, Math.min(10, Math.floor(finite(options.maxRestartsPerWindow, 3))));
    this.maxClockSkewMs = clamp(options.maxClockSkewMs, 1000, 10 * 60 * 1000, 120000);
    this.historyCapacity = Math.max(20, Math.min(500, Math.floor(finite(options.historyCapacity, 100))));

    this.restartEnabled = false;
    this.startedAt = this.now();
    this.lastBeacon = null;
    this.lastRunId = null;
    this.lastSeq = null;
    this.deadSince = null;
    this.lastRestartAttemptAt = null;
    this.restartAttempts = [];
    this.history = [];
    this.state = 'STARTING';
    this.reason = 'AWAITING_FIRST_BEACON';
    this.stats = {
      acceptedBeacons: 0,
      rejectedBeacons: 0,
      replayedBeacons: 0,
      restartAttempts: 0,
      restartSuccesses: 0,
      restartFailures: 0,
      restartBudgetBlocks: 0,
      cooldownBlocks: 0
    };
  }

  _record(type, data = {}) {
    const row = { at: this.now(), type, ...clone(data) };
    this.history.push(row);
    if (this.history.length > this.historyCapacity) this.history.splice(0, this.history.length - this.historyCapacity);
    return row;
  }

  _pruneRestartWindow(now = this.now()) {
    const cutoff = now - this.restartWindowMs;
    while (this.restartAttempts.length && this.restartAttempts[0] <= cutoff) this.restartAttempts.shift();
  }

  configure(config = {}) {
    if (config.enabled === true) {
      if (config.ack !== HOST_RESTART_ACK) {
        this.restartEnabled = false;
        this._record('RESTART_ENABLE_REJECTED', { reason: 'ACK_REQUIRED' });
        return { enabled: false, accepted: false, reason: 'ACK_REQUIRED', requiredAck: HOST_RESTART_ACK };
      }
      this.restartEnabled = true;
      this._record('RESTART_ENABLED', { reason: config.reason || 'OPERATOR_ACK' });
      return { enabled: true, accepted: true, restartAuthority: 'process-only', gameplayActionAuthority: false };
    }
    this.restartEnabled = false;
    this._record('RESTART_DISABLED', { reason: config.reason || 'DISABLED' });
    return { enabled: false, accepted: true, restartAuthority: 'none', gameplayActionAuthority: false };
  }

  _validateBeacon(beacon) {
    if (!beacon || typeof beacon !== 'object') return 'BEACON_REQUIRED';
    if (beacon.schemaVersion !== 1 || beacon.type !== 'AIO_V3_HOST_WATCHDOG_BEACON') return 'BEACON_SCHEMA_INVALID';
    if (!beacon.contract || beacon.contract.externalDeadManRequired !== true || beacon.contract.hostOwnsRestart !== true) return 'BEACON_CONTRACT_INVALID';
    if (beacon.contract.actionAuthority !== false) return 'BEACON_GAMEPLAY_AUTHORITY_INVALID';
    const seq = finite(beacon.seq);
    const at = finite(beacon.at);
    const deadlineAt = finite(beacon.deadlineAt);
    const leaseMs = finite(beacon.leaseMs);
    if (seq == null || seq < 1 || Math.floor(seq) !== seq) return 'BEACON_SEQUENCE_INVALID';
    if (at == null || deadlineAt == null || leaseMs == null) return 'BEACON_TIME_INVALID';
    if (leaseMs < 5000 || leaseMs > 5 * 60 * 1000) return 'BEACON_LEASE_INVALID';
    if (deadlineAt !== at + leaseMs) return 'BEACON_DEADLINE_INVALID';
    if (at > this.now() + this.maxClockSkewMs) return 'BEACON_CLOCK_AHEAD';
    return null;
  }

  acceptBeacon(beacon) {
    const error = this._validateBeacon(beacon);
    if (error) {
      this.stats.rejectedBeacons += 1;
      this._record('BEACON_REJECTED', { reason: error });
      return { accepted: false, reason: error };
    }

    const runId = beacon.runId == null ? null : String(beacon.runId);
    const seq = Number(beacon.seq);
    if (this.lastBeacon && runId === this.lastRunId && this.lastSeq != null && seq <= this.lastSeq) {
      this.stats.rejectedBeacons += 1;
      this.stats.replayedBeacons += 1;
      this._record('BEACON_REJECTED', { reason: 'BEACON_REPLAY', runId, seq, lastSeq: this.lastSeq });
      return { accepted: false, reason: 'BEACON_REPLAY' };
    }

    const newRun = this.lastBeacon != null && runId !== this.lastRunId;
    this.lastBeacon = clone(beacon);
    this.lastRunId = runId;
    this.lastSeq = seq;
    this.deadSince = null;
    this.state = this.now() <= Number(beacon.deadlineAt) ? 'HEALTHY' : 'WATCH';
    this.reason = this.state === 'HEALTHY' ? 'BEACON_FRESH' : 'BEACON_ALREADY_EXPIRED';
    this.stats.acceptedBeacons += 1;
    this._record('BEACON_ACCEPTED', { runId, seq, newRun, deadlineAt: beacon.deadlineAt });
    return { accepted: true, newRun, state: this.state, deadlineAt: beacon.deadlineAt };
  }

  _deadman(now) {
    if (!this.lastBeacon) {
      const graceRemainingMs = Math.max(0, this.startedAt + this.startupGraceMs - now);
      if (graceRemainingMs > 0) return { dead: false, state: 'STARTING', reason: 'AWAITING_FIRST_BEACON', graceRemainingMs };
      return { dead: true, reason: 'NO_BEACON_AFTER_STARTUP_GRACE', incidentAt: this.startedAt + this.startupGraceMs };
    }
    const deadlineAt = Number(this.lastBeacon.deadlineAt);
    if (now <= deadlineAt) return { dead: false, state: 'HEALTHY', reason: 'BEACON_FRESH', deadlineAt };
    return { dead: true, reason: 'BEACON_DEADLINE_MISSED', incidentAt: deadlineAt, deadlineAt, overdueMs: now - deadlineAt };
  }

  async tick() {
    const now = this.now();
    this._pruneRestartWindow(now);
    const deadman = this._deadman(now);
    if (!deadman.dead) {
      this.deadSince = null;
      this.state = deadman.state;
      this.reason = deadman.reason;
      return this.status();
    }

    if (this.deadSince == null) {
      this.deadSince = deadman.incidentAt || now;
      this._record('DEADMAN_OPENED', { reason: deadman.reason, deadSince: this.deadSince });
    }
    const deadForMs = Math.max(0, now - this.deadSince);
    if (deadForMs < this.restartDelayMs) {
      this.state = 'WATCH';
      this.reason = deadman.reason;
      return this.status();
    }

    if (!this.restartEnabled) {
      this.state = 'RESTART_REQUIRED';
      this.reason = 'RESTART_AUTHORITY_DISABLED';
      return this.status();
    }
    if (!this.restartProcess) {
      this.state = 'RESTART_REQUIRED';
      this.reason = 'RESTART_CALLBACK_UNAVAILABLE';
      return this.status();
    }
    if (this.lastRestartAttemptAt != null && now - this.lastRestartAttemptAt < this.restartCooldownMs) {
      this.state = 'RESTART_COOLDOWN';
      this.reason = 'RESTART_COOLDOWN';
      this.stats.cooldownBlocks += 1;
      return this.status();
    }
    if (this.restartAttempts.length >= this.maxRestartsPerWindow) {
      this.state = 'CIRCUIT_OPEN';
      this.reason = 'RESTART_BUDGET_EXHAUSTED';
      this.stats.restartBudgetBlocks += 1;
      return this.status();
    }

    this.lastRestartAttemptAt = now;
    this.restartAttempts.push(now);
    this.stats.restartAttempts += 1;
    const context = {
      reason: deadman.reason,
      deadForMs,
      runId: this.lastRunId,
      lastSeq: this.lastSeq,
      lastBeacon: clone(this.lastBeacon),
      gameplayActionAuthority: false
    };
    this._record('RESTART_ATTEMPTED', context);

    try {
      const result = await this.restartProcess(clone(context));
      if (result === false || result && result.ok === false) throw new Error('restart callback reported failure');
      this.stats.restartSuccesses += 1;
      this._record('RESTART_SUCCEEDED', { runId: this.lastRunId });
      this.state = 'RESTARTING';
      this.reason = 'PROCESS_RESTART_REQUESTED';
      this.lastBeacon = null;
      this.lastRunId = null;
      this.lastSeq = null;
      this.deadSince = null;
      this.startedAt = now;
    } catch (error) {
      this.stats.restartFailures += 1;
      this._record('RESTART_FAILED', { reason: String(error && error.message || error).slice(0, 256) });
      this.state = 'RESTART_FAILED';
      this.reason = 'PROCESS_RESTART_FAILED';
    }
    return this.status();
  }

  status() {
    const now = this.now();
    this._pruneRestartWindow(now);
    const deadman = this._deadman(now);
    return {
      schemaVersion: HOST_SUPERVISOR_SCHEMA_VERSION,
      mode: 'external-process-watchdog',
      state: this.state,
      reason: this.reason,
      restartEnabled: this.restartEnabled,
      restartAuthority: this.restartEnabled ? 'process-only' : 'none',
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      externalProcessBoundary: true,
      lastRunId: this.lastRunId,
      lastSeq: this.lastSeq,
      lastBeaconAt: this.lastBeacon && this.lastBeacon.at || null,
      lastDeadlineAt: this.lastBeacon && this.lastBeacon.deadlineAt || null,
      lastBeaconSummary: this.lastBeacon ? {
        runId: this.lastBeacon.runId == null ? null : String(this.lastBeacon.runId),
        seq: finite(this.lastBeacon.seq),
        at: finite(this.lastBeacon.at),
        deadlineAt: finite(this.lastBeacon.deadlineAt),
        release: this.lastBeacon.release == null ? null : String(this.lastBeacon.release).slice(0, 80),
        character: this.lastBeacon.character ? {
          name: this.lastBeacon.character.name == null ? null : String(this.lastBeacon.character.name).slice(0, 80),
          ctype: this.lastBeacon.character.ctype == null ? null : String(this.lastBeacon.character.ctype).slice(0, 40),
          map: this.lastBeacon.character.map == null ? null : String(this.lastBeacon.character.map).slice(0, 80),
          rip: this.lastBeacon.character.rip === true
        } : null,
        runtime: this.lastBeacon.runtime ? {
          mode: this.lastBeacon.runtime.mode == null ? null : String(this.lastBeacon.runtime.mode).slice(0, 40),
          heartbeatAt: finite(this.lastBeacon.runtime.heartbeatAt),
          snapshotAt: finite(this.lastBeacon.runtime.snapshotAt)
        } : null,
        health: this.lastBeacon.health ? {
          state: this.lastBeacon.health.state == null ? null : String(this.lastBeacon.health.state).slice(0, 40),
          watchdogState: this.lastBeacon.health.watchdogState == null ? null : String(this.lastBeacon.health.watchdogState).slice(0, 40),
          watchdogReason: this.lastBeacon.health.watchdogReason == null ? null : String(this.lastBeacon.health.watchdogReason).slice(0, 120),
          groupState: this.lastBeacon.health.groupState == null ? null : String(this.lastBeacon.health.groupState).slice(0, 40),
          fourCharacterReady: this.lastBeacon.health.fourCharacterReady === true
        } : null,
        alerts: this.lastBeacon.alerts ? {
          pending: Math.max(0, Math.floor(finite(this.lastBeacon.alerts.pending, 0))),
          pendingCritical: Math.max(0, Math.floor(finite(this.lastBeacon.alerts.pendingCritical, 0)))
        } : null,
        contract: this.lastBeacon.contract ? {
          externalDeadManRequired: this.lastBeacon.contract.externalDeadManRequired === true,
          hostOwnsRestart: this.lastBeacon.contract.hostOwnsRestart === true,
          authenticationOwnedByHost: this.lastBeacon.contract.authenticationOwnedByHost === true,
          actionAuthority: this.lastBeacon.contract.actionAuthority === true
        } : null
      } : null,
      deadman,
      deadSince: this.deadSince,
      restartBudget: {
        used: this.restartAttempts.length,
        max: this.maxRestartsPerWindow,
        windowMs: this.restartWindowMs,
        cooldownMs: this.restartCooldownMs
      },
      stats: { ...this.stats }
    };
  }

  listHistory(limit = 50) {
    const n = Math.max(0, Math.min(this.history.length, Math.floor(finite(limit, 0))));
    return this.history.slice(this.history.length - n).map(clone);
  }
}

module.exports = {
  HostWatchdogSupervisor,
  HOST_RESTART_ACK,
  HOST_SUPERVISOR_SCHEMA_VERSION
};
