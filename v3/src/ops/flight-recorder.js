'use strict';

const { normalizeReason } = require('../core/event-log');

const FLIGHT_RECORDER_SCHEMA_VERSION = 1;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class FlightRecorder {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.capacity = Math.max(60, Math.min(7200, Math.floor(finite(options.capacity, 720))));
    this.incidentCapacity = Math.max(20, Math.min(1000, Math.floor(finite(options.incidentCapacity, 200))));
    this.sampleIntervalMs = Math.max(1000, Math.min(60000, finite(options.sampleIntervalMs, 5000)));
    this.samples = [];
    this.incidents = [];
    this.sequence = 0;
    this.incidentSequence = 0;
    this.lastSampleAt = null;
    this.droppedSamples = 0;
    this.droppedIncidents = 0;
  }

  _compactRuntime(runtime, group, watchdog, at) {
    const snapshot = runtime && runtime.lastSnapshot || null;
    const character = snapshot && snapshot.character || null;
    const farmer = runtime && typeof runtime.farmerStatus === 'function' ? runtime.farmerStatus() : null;
    const supervisor = runtime && runtime.globalSupervisor && typeof runtime.globalSupervisor.status === 'function'
      ? runtime.globalSupervisor.status() : null;
    const scheduler = runtime && runtime.scheduler && typeof runtime.scheduler.snapshot === 'function'
      ? runtime.scheduler.snapshot() : null;
    const economy = runtime && runtime.transactionEngine && typeof runtime.transactionEngine.status === 'function'
      ? runtime.transactionEngine.status() : null;
    const travel = runtime && runtime.safeTravel && typeof runtime.safeTravel.status === 'function'
      ? runtime.safeTravel.status() : null;

    return {
      schemaVersion: FLIGHT_RECORDER_SCHEMA_VERSION,
      seq: ++this.sequence,
      at,
      runId: runtime && runtime.log && runtime.log.runId || null,
      mode: runtime && runtime.adapter && runtime.adapter.mode || null,
      character: character ? {
        name: character.name || null,
        ctype: character.ctype || null,
        level: finite(character.level, 0),
        map: character.map || null,
        x: finite(character.x),
        y: finite(character.y),
        hp: finite(character.hp),
        maxHp: finite(character.max_hp),
        mp: finite(character.mp),
        maxMp: finite(character.max_mp),
        xp: finite(character.xp),
        gold: finite(character.gold),
        target: character.target || null,
        moving: character.moving === true,
        rip: character.rip === true
      } : null,
      farmer: farmer ? {
        enabled: farmer.enabled === true,
        state: farmer.state || null,
        targetType: farmer.targetType || null,
        reason: farmer.reason || null
      } : null,
      supervisor: supervisor ? { state: supervisor.state || null, reasons: Array.isArray(supervisor.reasons) ? supervisor.reasons.slice(0, 8) : [] } : null,
      scheduler: scheduler ? {
        active: Array.isArray(scheduler.active) ? scheduler.active.length : 0,
        queued: Array.isArray(scheduler.queued) ? scheduler.queued.length : 0
      } : null,
      group: group ? {
        state: group.state || null,
        memberCount: finite(group.memberCount, 0),
        freshCount: finite(group.freshCount, 0),
        fourCharacterReady: group.fourCharacterReady === true,
        invalidMembers: Array.isArray(group.invalidMembers) ? group.invalidMembers.slice(0, 8) : []
      } : null,
      watchdog: watchdog ? {
        state: watchdog.state || null,
        activityExpected: watchdog.activityExpected === true,
        progressAgeMs: finite(watchdog.progressAgeMs),
        heartbeatAgeMs: finite(watchdog.heartbeatAgeMs),
        snapshotAgeMs: finite(watchdog.snapshotAgeMs),
        recommendation: watchdog.recoveryRecommendation || null
      } : null,
      operations: {
        activeTransactions: finite(economy && economy.active, 0),
        recoveringTransactions: finite(economy && economy.recovering, 0),
        activeTravel: finite(travel && travel.active, 0)
      }
    };
  }

  capture(runtime, context = {}, options = {}) {
    const at = finite(options.at, this.now());
    const force = options.force === true;
    if (!force && this.lastSampleAt != null && at - this.lastSampleAt < this.sampleIntervalMs) return null;
    const sample = this._compactRuntime(runtime, context.group || null, context.watchdog || null, at);
    this.samples.push(sample);
    this.lastSampleAt = at;
    if (this.samples.length > this.capacity) {
      const overflow = this.samples.length - this.capacity;
      this.samples.splice(0, overflow);
      this.droppedSamples += overflow;
    }
    return clone(sample);
  }

  markIncident(input = {}) {
    const normalizedReason = normalizeReason(input.reason);
    const record = {
      schemaVersion: FLIGHT_RECORDER_SCHEMA_VERSION,
      incidentSeq: ++this.incidentSequence,
      at: finite(input.at, this.now()),
      severity: String(input.severity || 'warn'),
      type: String(input.type || input.event || 'INCIDENT'),
      reason: normalizedReason.reason,
      reasonDetails: normalizedReason.reasonDetails,
      data: clone(input.data || {})
    };
    this.incidents.push(record);
    if (this.incidents.length > this.incidentCapacity) {
      const overflow = this.incidents.length - this.incidentCapacity;
      this.incidents.splice(0, overflow);
      this.droppedIncidents += overflow;
    }
    return clone(record);
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.samples.length, Math.floor(finite(limit, 0))));
    return this.samples.slice(this.samples.length - n).map(clone);
  }

  recent(windowMs = 10 * 60 * 1000) {
    const cutoff = this.now() - Math.max(0, finite(windowMs, 0));
    return this.samples.filter((row) => row.at >= cutoff).map(clone);
  }

  listIncidents(limit = 50) {
    const n = Math.max(0, Math.min(this.incidents.length, Math.floor(finite(limit, 0))));
    return this.incidents.slice(this.incidents.length - n).map(clone);
  }

  latest() { return this.samples.length ? clone(this.samples[this.samples.length - 1]) : null; }

  status() {
    return {
      schemaVersion: FLIGHT_RECORDER_SCHEMA_VERSION,
      mode: 'observational-read-only',
      actionAuthority: false,
      samples: this.samples.length,
      capacity: this.capacity,
      sampleIntervalMs: this.sampleIntervalMs,
      droppedSamples: this.droppedSamples,
      incidents: this.incidents.length,
      incidentCapacity: this.incidentCapacity,
      droppedIncidents: this.droppedIncidents,
      lastSampleAt: this.lastSampleAt,
      latest: this.latest(),
      recentIncidents: this.listIncidents(8)
    };
  }
}

module.exports = { FlightRecorder, FLIGHT_RECORDER_SCHEMA_VERSION };
