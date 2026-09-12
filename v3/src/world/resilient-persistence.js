'use strict';

const { WorldPersistence } = require('./persistence');

class ResilientWorldPersistence extends WorldPersistence {
  constructor(options = {}) {
    super(options);
    this.retryBaseMs = Math.max(1000, Number(options.retryBaseMs) || 5000);
    this.retryMaxMs = Math.max(this.retryBaseMs, Number(options.retryMaxMs) || 120000);
    this.saveCircuitAfter = Math.max(2, Number(options.saveCircuitAfter) || 5);
    this.saveCircuitMs = Math.max(10000, Number(options.saveCircuitMs) || 120000);
    this.loadComplete = false;
    this.loadAttempts = 0;
    this.loadFailureStreak = 0;
    this.nextLoadAttemptAt = 0;
    this.lastLoadError = null;
    this.saveFailureStreak = 0;
    this.nextSaveAttemptAt = 0;
    this.saveCircuitUntil = 0;
    this.lastSaveError = null;
  }

  _backoff(streak) {
    const exponent = Math.max(0, Number(streak) - 1);
    return Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, exponent));
  }

  _recordLoadFailure(reason, error = null) {
    const now = this.now();
    this.loadFailureStreak += 1;
    this.lastLoadError = error ? String(error && error.message || error) : reason;
    const backoffMs = this._backoff(this.loadFailureStreak);
    this.nextLoadAttemptAt = now + backoffMs;
    this.loaded = false;
    if (this.log) this.log.emit({
      component: 'persistence',
      event: 'WORLD_MODEL_RESTORE_RETRY_SCHEDULED',
      severity: 'warn',
      reason,
      data: { failureStreak: this.loadFailureStreak, backoffMs, nextAttemptAt: this.nextLoadAttemptAt, message: this.lastLoadError }
    });
  }

  _recordSaveFailure(reason, error = null) {
    const now = this.now();
    this.saveFailureStreak += 1;
    this.lastSaveError = error ? String(error && error.message || error) : reason;
    const backoffMs = this._backoff(this.saveFailureStreak);
    this.nextSaveAttemptAt = now + backoffMs;
    if (this.saveFailureStreak >= this.saveCircuitAfter) {
      this.saveCircuitUntil = Math.max(this.saveCircuitUntil, now + this.saveCircuitMs);
      if (this.log) this.log.emit({
        component: 'persistence',
        event: 'WORLD_MODEL_SAVE_CIRCUIT_OPENED',
        severity: 'warn',
        reason,
        data: { failureStreak: this.saveFailureStreak, circuitUntil: this.saveCircuitUntil, circuitMs: this.saveCircuitMs }
      });
    }
    if (this.log) this.log.emit({
      component: 'persistence',
      event: 'WORLD_MODEL_SAVE_RETRY_SCHEDULED',
      severity: 'warn',
      reason,
      data: { failureStreak: this.saveFailureStreak, backoffMs, nextAttemptAt: this.nextSaveAttemptAt, message: this.lastSaveError }
    });
  }

  _resetSaveFailures() {
    this.saveFailureStreak = 0;
    this.nextSaveAttemptAt = 0;
    this.saveCircuitUntil = 0;
    this.lastSaveError = null;
  }

  load(world) {
    if (this.loadComplete) return false;
    const now = this.now();
    if (now < this.nextLoadAttemptAt) return false;
    this.loadAttempts += 1;
    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      this._recordLoadFailure('NO_SUPPORTED_STORAGE');
      return false;
    }

    try {
      const serialized = backend.get(this.key);
      if (serialized == null || serialized === '') {
        this.loadComplete = true;
        this.loaded = true;
        this.loadFailureStreak = 0;
        this.nextLoadAttemptAt = 0;
        this.lastLoadError = null;
        if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_STORAGE_EMPTY', data: { backend: this.backendName } });
        return false;
      }
      world.restore(serialized);
      this.lastSavedRevision = world.revision;
      this.loadComplete = true;
      this.loaded = true;
      this.loadFailureStreak = 0;
      this.nextLoadAttemptAt = 0;
      this.lastLoadError = null;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORED', data: { backend: this.backendName, bytes: String(serialized).length, revision: world.revision, attempts: this.loadAttempts } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORE_FAILED', severity: 'warn', reason: 'PERSISTENCE_READ_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      this._recordLoadFailure('PERSISTENCE_READ_ERROR', error);
      return false;
    }
  }

  maybeSave(world, options = {}) {
    const force = options.force === true;
    const now = this.now();
    if (!force && this.saveCircuitUntil > now) return false;
    if (!force && this.nextSaveAttemptAt > now) return false;
    if (this.saveCircuitUntil && now >= this.saveCircuitUntil) {
      this.saveCircuitUntil = 0;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_CIRCUIT_CLOSED' });
    }

    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      this._recordSaveFailure('NO_SUPPORTED_STORAGE');
      return false;
    }
    if (!force && world.revision === this.lastSavedRevision) return false;
    if (!force && now - this.lastSavedAt < this.minIntervalMs) return false;

    let serialized;
    try {
      serialized = world.serialize();
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'SERIALIZE_ERROR', data: { message: String(error && error.message || error) } });
      this._recordSaveFailure('SERIALIZE_ERROR', error);
      return false;
    }

    if (serialized.length > this.maxBytes) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_SKIPPED', severity: 'warn', reason: 'PERSISTENCE_SIZE_LIMIT', data: { bytes: serialized.length, maxBytes: this.maxBytes, revision: world.revision } });
      this._recordSaveFailure('PERSISTENCE_SIZE_LIMIT');
      return false;
    }

    try {
      backend.set(this.key, serialized);
      this.lastSavedAt = now;
      this.lastSavedRevision = world.revision;
      this._resetSaveFailures();
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVED', data: { backend: this.backendName, bytes: serialized.length, revision: world.revision, forced: force } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'PERSISTENCE_WRITE_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      this._recordSaveFailure('PERSISTENCE_WRITE_ERROR', error);
      return false;
    }
  }

  status() {
    const now = this.now();
    return {
      ...super.status(),
      loadComplete: this.loadComplete,
      loadAttempts: this.loadAttempts,
      loadFailureStreak: this.loadFailureStreak,
      nextLoadAttemptAt: this.nextLoadAttemptAt || null,
      loadRetryRemainingMs: Math.max(0, this.nextLoadAttemptAt - now),
      lastLoadError: this.lastLoadError,
      saveFailureStreak: this.saveFailureStreak,
      nextSaveAttemptAt: this.nextSaveAttemptAt || null,
      saveRetryRemainingMs: Math.max(0, this.nextSaveAttemptAt - now),
      saveCircuitOpen: this.saveCircuitUntil > now,
      saveCircuitUntil: this.saveCircuitUntil || null,
      saveCircuitRemainingMs: Math.max(0, this.saveCircuitUntil - now),
      lastSaveError: this.lastSaveError,
      retryBaseMs: this.retryBaseMs,
      retryMaxMs: this.retryMaxMs
    };
  }
}

module.exports = { ResilientWorldPersistence };
