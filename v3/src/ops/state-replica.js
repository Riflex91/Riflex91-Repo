'use strict';

class StateReplica {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.maxBytes = Math.max(10000, Number(options.maxBytes) || 900000);
    this.latest = null;
    this.lastRevision = -1;
    this.droppedOversize = 0;
    this.captureErrors = 0;
    this.lastError = null;
  }

  capture(world) {
    if (!world || typeof world.serialize !== 'function') return false;
    if (Number(world.revision) === this.lastRevision) return false;
    let serialized;
    try {
      serialized = world.serialize();
    } catch (error) {
      this.captureErrors += 1;
      this.lastError = String(error && error.message || error);
      return false;
    }
    if (serialized.length > this.maxBytes) {
      this.droppedOversize += 1;
      return false;
    }
    this.lastRevision = Number(world.revision);
    this.lastError = null;
    this.latest = {
      revision: this.lastRevision,
      capturedAt: this.now(),
      bytes: serialized.length,
      serialized
    };
    return true;
  }

  peek() {
    return this.latest ? { ...this.latest } : null;
  }

  take() {
    if (!this.latest) return null;
    const value = { ...this.latest };
    this.latest = null;
    return value;
  }

  status() {
    return {
      pending: !!this.latest,
      revision: this.latest ? this.latest.revision : this.lastRevision >= 0 ? this.lastRevision : null,
      bytes: this.latest ? this.latest.bytes : 0,
      maxBytes: this.maxBytes,
      droppedOversize: this.droppedOversize,
      captureErrors: this.captureErrors,
      lastError: this.lastError
    };
  }
}

class HeadlessHealth {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.watchAfterMs = Math.max(1000, Number(options.watchAfterMs) || 10000);
    this.degradedAfterMs = Math.max(this.watchAfterMs, Number(options.degradedAfterMs) || 30000);
    this.lastTickAt = null;
    this.lastSnapshotAt = null;
    this.startedAt = null;
  }

  noteStart() { if (this.startedAt == null) this.startedAt = this.now(); }
  noteTick() { this.lastTickAt = this.now(); }
  noteSnapshot() { this.lastSnapshotAt = this.now(); }

  status() {
    const now = this.now();
    const tickAgeMs = this.lastTickAt == null ? null : Math.max(0, now - this.lastTickAt);
    const snapshotAgeMs = this.lastSnapshotAt == null ? null : Math.max(0, now - this.lastSnapshotAt);
    const age = snapshotAgeMs == null ? (this.startedAt == null ? 0 : Math.max(0, now - this.startedAt)) : snapshotAgeMs;
    let state = 'HEALTHY';
    if (age >= this.degradedAfterMs) state = 'DEGRADED';
    else if (age >= this.watchAfterMs) state = 'WATCH';
    return {
      state,
      headlessCompatible: true,
      domRequired: false,
      dashboardRequired: false,
      tickAgeMs,
      snapshotAgeMs,
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs
    };
  }
}

module.exports = { StateReplica, HeadlessHealth };
