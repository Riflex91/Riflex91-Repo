'use strict';

const { TelemetryOutbox } = require('./telemetry-outbox');
const { ControlGateway } = require('./control-gateway');
const { StateReplica } = require('./state-replica');

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
    this.captureErrors = 0;
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
    if (action === 'SET_BRAIN_INFLUENCE') {
      if (typeof runtime.setBrainInfluenceEnabled !== 'function') throw new Error('brain control unavailable');
      return runtime.setBrainInfluenceEnabled(params.enabled === true);
    }
    if (action === 'BRAIN_TEACH') {
      if (typeof runtime.submitBrainTeacher !== 'function') throw new Error('brain teacher unavailable');
      return runtime.submitBrainTeacher(params.recommendation || params);
    }
    if (action === 'SAVE_WORLD') return runtime.persistence.maybeSave(runtime.world, { force: true });
    if (action === 'SHOW_STATUS') return runtime.status();
    throw new Error('unsupported control action');
  }

  _capture() {
    try {
      if (this.log) this.telemetry.capture(this.log);
      if (this.runtime && this.runtime.world) this.replica.capture(this.runtime.world);
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
    let state = 'HEALTHY';
    if (age >= this.degradedAfterMs) state = 'DEGRADED';
    else if (age >= this.watchAfterMs) state = 'WATCH';
    return {
      state,
      headlessCompatible: true,
      domRequired: false,
      gameLogRequired: false,
      dashboardRequired: false,
      snapshotAgeMs,
      heartbeatAgeMs,
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs
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

  status() {
    this._capture();
    return {
      contractVersion: 1,
      transport: 'host-provided',
      captureErrors: this.captureErrors,
      telemetry: this.telemetry.status(),
      control: this.control.status(),
      stateReplica: this.replica.status(),
      health: this._healthStatus()
    };
  }
}

module.exports = { HeadlessOperations };
