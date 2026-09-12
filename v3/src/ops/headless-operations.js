'use strict';

const { TelemetryOutbox } = require('./telemetry-outbox');
const { ControlGateway } = require('./control-gateway');
const { StateReplica } = require('./state-replica');
const { FlightRecorder } = require('./flight-recorder');
const { GroupLivenessMonitor } = require('./group-liveness');
const { RuntimeProgressWatchdog } = require('./runtime-watchdog');
const { ReliabilityCheckpointStore } = require('./reliability-checkpoint');

function safeCall(fn, fallback = null) {
  try { return typeof fn === 'function' ? fn() : fallback; } catch (_) { return fallback; }
}
function compactCharacter(character) {
  if (!character) return null;
  return {
    name: character.name || null,
    ctype: character.ctype || null,
    level: Number(character.level) || 0,
    map: character.map || null,
    x: Number.isFinite(Number(character.x)) ? Number(character.x) : null,
    y: Number.isFinite(Number(character.y)) ? Number(character.y) : null,
    hp: Number.isFinite(Number(character.hp)) ? Number(character.hp) : null,
    maxHp: Number.isFinite(Number(character.max_hp)) ? Number(character.max_hp) : null,
    mp: Number.isFinite(Number(character.mp)) ? Number(character.mp) : null,
    maxMp: Number.isFinite(Number(character.max_mp)) ? Number(character.max_mp) : null,
    xp: Number.isFinite(Number(character.xp)) ? Number(character.xp) : null,
    gold: Number.isFinite(Number(character.gold)) ? Number(character.gold) : null,
    rip: character.rip === true
  };
}

class HeadlessOperations {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.runtime = options.runtime || null;
    this.watchAfterMs = Math.max(1000, Number(options.watchAfterMs) || 10000);
    this.degradedAfterMs = Math.max(this.watchAfterMs, Number(options.degradedAfterMs) || 30000);
    this.telemetry = options.telemetry || new TelemetryOutbox({ capacity: options.telemetryCapacity });
    this.replica = options.replica || new StateReplica({ now: this.now, maxBytes: options.replicaMaxBytes });
    this.control = options.control || new ControlGateway({
      now: this.now,
      log: this.log,
      allowElevated: options.allowElevatedControl === true,
      maxHistory: options.controlHistory,
      maxTtlMs: options.controlMaxTtlMs,
      execute: (action, params) => this._execute(action, params)
    });

    this.flightRecorder = options.flightRecorder || new FlightRecorder({
      now: this.now,
      capacity: options.flightRecorderCapacity,
      incidentCapacity: options.flightRecorderIncidentCapacity,
      sampleIntervalMs: options.flightRecorderSampleIntervalMs
    });
    this.groupLiveness = options.groupLiveness || new GroupLivenessMonitor({
      now: this.now,
      staleAfterMs: options.groupLivenessStaleAfterMs
    });
    this.watchdog = options.watchdog || new RuntimeProgressWatchdog({
      now: this.now,
      watchAfterMs: options.watchdogWatchAfterMs || this.watchAfterMs,
      degradedAfterMs: options.watchdogDegradedAfterMs || this.degradedAfterMs,
      progressWatchAfterMs: options.watchdogProgressWatchAfterMs,
      progressDegradedAfterMs: options.watchdogProgressDegradedAfterMs,
      clockBackwardsToleranceMs: options.watchdogClockBackwardsToleranceMs
    });
    const root = options.root || this.runtime && this.runtime.root || globalThis;
    const storage = options.checkpointStorage || options.storage || this.runtime && this.runtime.persistence && this.runtime.persistence.storage || null;
    this.checkpoint = options.checkpoint || new ReliabilityCheckpointStore({
      root,
      storage,
      now: this.now,
      baseKey: options.checkpointBaseKey,
      maxBytes: options.checkpointMaxBytes
    });
    this.checkpointIntervalMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.checkpointIntervalMs) || 30000));
    this.lastCheckpointAttemptAt = null;
    this.previousCheckpoint = this.checkpoint.load();
    this.lastReliability = null;
    this.captureErrors = 0;
    this.observing = false;
    this._installEventSink();
  }

  _execute(action, params = {}) {
    const runtime = this.runtime;
    if (!runtime) throw new Error('runtime unavailable');
    if (action === 'SET_MODE') return runtime.setMode(params.mode);
    if (action === 'SET_FARMER_ENABLED') return runtime.setFarmerEnabled(params.enabled === true);
    if (action === 'SET_TARGET_POLICY') return runtime.setFarmerTargetPolicy(params.policy);
    if (action === 'ADD_TARGET_EXCLUSION') return runtime.addFarmerTargetExclusion(params.value);
    if (action === 'REMOVE_TARGET_EXCLUSION') return runtime.removeFarmerTargetExclusion(params.value);
    if (action === 'APPROVE_MONSTER_CONTENT') return runtime.combatRisk.approveMonsterType(runtime.world, params.mtype);
    if (action === 'QUARANTINE_MONSTER_CONTENT') return runtime.combatRisk.quarantineMonsterType(runtime.world, params.mtype);
    if (action === 'SAVE_WORLD') return runtime.persistence.maybeSave(runtime.world, { force: true });
    if (action === 'SHOW_STATUS') return runtime.status();
    throw new Error('unsupported control action');
  }

  _installEventSink() {
    if (!this.log || typeof this.log.emit !== 'function') return false;
    const previous = typeof this.log.sink === 'function' ? this.log.sink : null;
    this.log.sink = (event) => {
      if (previous) {
        try { previous(event); } catch (_) {}
      }
      try { this._onEvent(event); } catch (_) { this.captureErrors += 1; }
    };
    return true;
  }

  _onEvent(event) {
    if (this.observing || !event) return;
    const severity = String(event.severity || '').toLowerCase();
    if (severity === 'warn' || severity === 'error' || severity === 'fatal') {
      this.flightRecorder.markIncident({
        at: Date.parse(event.ts) || this.now(),
        severity: severity || 'warn',
        type: event.event || 'EVENT',
        reason: event.reason || null,
        data: { component: event.component || null, character: event.character || null, taskId: event.taskId || null }
      });
    }
    if (event.event === 'HEARTBEAT' || event.event === 'SNAPSHOT_UNAVAILABLE' || event.event === 'RUNTIME_STARTED' || event.event === 'RUNTIME_STOPPED') {
      this._observeReliability({ forceSample: event.event !== 'HEARTBEAT', forceCheckpoint: event.event === 'RUNTIME_STOPPED' });
    }
  }

  _checkpointSnapshot(group, watchdog) {
    const runtime = this.runtime;
    const snapshot = runtime && runtime.lastSnapshot || null;
    const supervisor = runtime && runtime.globalSupervisor && typeof runtime.globalSupervisor.status === 'function'
      ? safeCall(() => runtime.globalSupervisor.status(), {}) : {};
    const farmer = runtime && typeof runtime.farmerStatus === 'function' ? safeCall(() => runtime.farmerStatus(), {}) : {};
    const lifecycle = runtime && runtime.controlledPartyLifecycle && typeof runtime.controlledPartyLifecycle.status === 'function'
      ? safeCall(() => runtime.controlledPartyLifecycle.status(), {}) : {};
    const aura = runtime && runtime.controlledPaladinAura && typeof runtime.controlledPaladinAura.status === 'function'
      ? safeCall(() => runtime.controlledPaladinAura.status(), {}) : {};
    const transactions = runtime && runtime.transactionEngine && typeof runtime.transactionEngine.status === 'function'
      ? safeCall(() => runtime.transactionEngine.status(), {}) : {};
    const travel = runtime && runtime.safeTravel && typeof runtime.safeTravel.status === 'function'
      ? safeCall(() => runtime.safeTravel.status(), {}) : {};
    const eventSummary = this.log && typeof this.log.summary === 'function' ? safeCall(() => this.log.summary(), {}) : {};
    const runtimeStatus = runtime && typeof runtime.status === 'function' ? safeCall(() => runtime.status(), {}) : {};

    return {
      version: runtimeStatus.version || null,
      runId: this.log && this.log.runId || null,
      observedAt: snapshot && snapshot.observedAt || null,
      mode: runtime && runtime.adapter && runtime.adapter.mode || null,
      character: compactCharacter(snapshot && snapshot.character),
      supervisor: { state: supervisor.state || null, reasons: Array.isArray(supervisor.reasons) ? supervisor.reasons.slice(0, 16) : [] },
      farmer: { enabled: farmer.enabled === true, state: farmer.state || null, targetType: farmer.targetType || null },
      group: group ? {
        state: group.state,
        memberCount: group.memberCount,
        fourCharacterReady: group.fourCharacterReady,
        invalidMembers: group.invalidMembers,
        members: group.members
      } : null,
      watchdog: watchdog ? {
        state: watchdog.state,
        reason: watchdog.reason,
        recoveryRecommendation: watchdog.recoveryRecommendation,
        activityExpected: watchdog.activityExpected,
        snapshotAgeMs: watchdog.snapshotAgeMs,
        heartbeatAgeMs: watchdog.heartbeatAgeMs,
        progressAgeMs: watchdog.progressAgeMs
      } : null,
      partyLifecycle: {
        enabled: lifecycle.enabled === true,
        operation: lifecycle.operation || null,
        developmentSession: lifecycle.developmentSession || null,
        breaker: lifecycle.breaker || null
      },
      aura: { enabled: aura.enabled === true, actionAuthority: aura.actionAuthority === true },
      economy: { active: Number(transactions.active) || 0, recovering: Number(transactions.recovering) || 0, states: transactions.states || {} },
      travel: { active: Number(travel.active) || 0, states: travel.states || {}, circuit: travel.circuit || null },
      eventLog: { firstSeq: eventSummary.firstSeq || null, lastSeq: eventSummary.lastSeq || null, retained: Number(eventSummary.retained) || 0 }
    };
  }

  _maybeCheckpoint(group, watchdog, options = {}) {
    const now = this.now();
    const force = options.force === true;
    if (!force && this.lastCheckpointAttemptAt != null && now - this.lastCheckpointAttemptAt < this.checkpointIntervalMs) return null;
    this.lastCheckpointAttemptAt = now;
    return this.checkpoint.save(this._checkpointSnapshot(group, watchdog), { reason: options.reason || (force ? 'FORCED' : 'PERIODIC') });
  }

  _observeReliability(options = {}) {
    if (this.observing) return this.lastReliability;
    this.observing = true;
    try {
      const group = this.groupLiveness.evaluate(this.runtime);
      const watchdog = this.watchdog.observe(this.runtime, group);
      if (watchdog.transition) {
        const incident = this.flightRecorder.markIncident({
          at: watchdog.transition.at,
          severity: watchdog.transition.state === 'DEGRADED' ? 'error' : watchdog.transition.state === 'WATCH' ? 'warn' : 'info',
          type: 'RUNTIME_WATCHDOG_STATE_CHANGED',
          reason: watchdog.transition.reason,
          data: watchdog.transition
        });
        if (this.log && typeof this.log.emit === 'function') this.log.emit({
          component: 'reliability',
          event: 'RUNTIME_WATCHDOG_STATE_CHANGED',
          severity: incident.severity,
          reason: incident.reason,
          data: { previous: watchdog.transition.previous, state: watchdog.transition.state, recommendation: watchdog.recoveryRecommendation }
        });
      }
      const sample = this.flightRecorder.capture(this.runtime, { group, watchdog }, { force: options.forceSample === true });
      const checkpoint = this._maybeCheckpoint(group, watchdog, {
        force: options.forceCheckpoint === true,
        reason: options.forceCheckpoint ? 'RUNTIME_STOP' : 'PERIODIC'
      });
      this.lastReliability = { at: this.now(), group, watchdog, sample, checkpoint };
      return this.lastReliability;
    } catch (_) {
      this.captureErrors += 1;
      return this.lastReliability;
    } finally {
      this.observing = false;
    }
  }

  _capture() {
    try {
      if (this.log) this.telemetry.capture(this.log);
      if (this.runtime && this.runtime.world) this.replica.capture(this.runtime.world);
      this._observeReliability();
    } catch (_) {
      this.captureErrors += 1;
    }
  }

  _healthStatus() {
    const runtime = this.runtime;
    const now = this.now();
    const startedAt = runtime && Number.isFinite(Number(runtime.startedAt)) ? Number(runtime.startedAt) : null;
    const lastHeartbeatAt = runtime && Number.isFinite(Number(runtime.lastHeartbeat)) && Number(runtime.lastHeartbeat) > 0 ? Number(runtime.lastHeartbeat) : null;
    const observedAt = runtime && runtime.lastSnapshot && Number.isFinite(Number(runtime.lastSnapshot.observedAt)) ? Number(runtime.lastSnapshot.observedAt) : null;
    const base = observedAt != null ? observedAt : lastHeartbeatAt != null ? lastHeartbeatAt : startedAt;
    const snapshotAgeMs = observedAt == null ? null : Math.max(0, now - observedAt);
    const heartbeatAgeMs = lastHeartbeatAt == null ? null : Math.max(0, now - lastHeartbeatAt);
    const age = base == null ? 0 : Math.max(0, now - base);
    const group = this.groupLiveness.evaluate(runtime);
    const watchdog = this.watchdog.status(runtime, group);
    let state = 'HEALTHY';
    if (age >= this.degradedAfterMs || watchdog.state === 'DEGRADED') state = 'DEGRADED';
    else if (age >= this.watchAfterMs || watchdog.state === 'WATCH' || (group.localCharacter && (group.state === 'WATCH' || group.state === 'DEGRADED'))) state = 'WATCH';
    return {
      state,
      headlessCompatible: true,
      domRequired: false,
      gameLogRequired: false,
      dashboardRequired: false,
      snapshotAgeMs,
      heartbeatAgeMs,
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs,
      watchdog,
      groupLiveness: group
    };
  }

  submit(command) {
    const result = this.control.submit(command);
    this._capture();
    return result;
  }

  drainTelemetry(limit = 100) { this._capture(); return this.telemetry.drain(limit); }
  peekTelemetry(limit = 100) { this._capture(); return this.telemetry.peek(limit); }
  takeStateReplica() { this._capture(); return this.replica.take(); }
  peekStateReplica() { this._capture(); return this.replica.peek(); }
  flightRecorderSamples(limit = 100) { this._capture(); return this.flightRecorder.list(limit); }
  flightRecorderWindow(windowMs = 10 * 60 * 1000) { this._capture(); return this.flightRecorder.recent(windowMs); }
  reliabilityIncidents(limit = 50) { this._capture(); return this.flightRecorder.listIncidents(limit); }
  reliabilityCheckpoint() { this._capture(); return this.checkpoint.latestEvidence(); }

  status() {
    this._capture();
    return {
      contractVersion: 2,
      transport: 'host-provided',
      captureErrors: this.captureErrors,
      telemetry: this.telemetry.status(),
      control: this.control.status(),
      stateReplica: this.replica.status(),
      health: this._healthStatus(),
      reliability: {
        mode: 'observational-read-only',
        actionAuthority: false,
        automaticRecovery: false,
        flightRecorder: this.flightRecorder.status(),
        watchdog: this.watchdog.status(this.runtime, this.groupLiveness.evaluate(this.runtime)),
        groupLiveness: this.groupLiveness.evaluate(this.runtime),
        checkpoint: this.checkpoint.status(),
        previousCheckpoint: this.previousCheckpoint ? {
          slot: this.previousCheckpoint.slot || null,
          sequence: this.previousCheckpoint.sequence || null,
          savedAt: this.previousCheckpoint.savedAt || null,
          reason: this.previousCheckpoint.reason || null,
          resumeAllowed: this.previousCheckpoint.resumeAllowed === true,
          reconciliationRequired: this.previousCheckpoint.reconciliationRequired === true
        } : null
      }
    };
  }
}

module.exports = { HeadlessOperations };
