'use strict';

function isQuotaError(error) {
  if (!error) return false;
  const name = String(error.name || '');
  const message = String(error.message || error);
  return name === 'QuotaExceededError'
    || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || /quota/i.test(message)
    || /setItem.*Storage/i.test(message);
}

class WorldPersistence {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.key = options.key || 'AIO_V3_WORLD_MODEL';
    this.minIntervalMs = Math.max(5000, Number(options.minIntervalMs) || 30000);
    this.maxBytes = Math.max(10000, Number(options.maxBytes) || 900000);
    this.storageHighWatermarkChars = Math.max(500000, Number(options.storageHighWatermarkChars) || 4000000);
    this.storage = options.storage || null;
    this.lastSavedAt = 0;
    this.lastSavedRevision = -1;
    this.loaded = false;
    this.backendName = null;
    this.unavailableLogged = false;
    this.quotaBlocked = false;
    this.quotaBlockedAt = 0;
    this.lastWriteError = null;
    this.preflightQuotaBlocks = 0;
    this.writeFailures = 0;
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') {
      this.backendName = 'custom';
      return this.storage;
    }
    const get = this.root && this.root.get;
    const set = this.root && this.root.set;
    if (typeof get === 'function' && typeof set === 'function') {
      this.backendName = 'adventure-land';
      return { get: (key) => get.call(this.root, key), set: (key, value) => set.call(this.root, key, value) };
    }
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') {
      this.backendName = 'localStorage';
      return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    }
    this.backendName = null;
    return null;
  }

  _localStorageProjectedChars(serialized) {
    const storage = this.root && this.root.localStorage;
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.key !== 'function') return null;
    try {
      let total = 0;
      for (let i = 0; i < Number(storage.length || 0); i += 1) {
        const key = storage.key(i);
        if (key == null) continue;
        const value = storage.getItem(key);
        total += String(key).length + String(value == null ? '' : value).length;
      }

      const candidates = [`csstore_${this.key}`, this.key];
      let oldChars = 0;
      let oldKeyChars = 0;
      for (const candidate of candidates) {
        const value = storage.getItem(candidate);
        if (value != null) {
          oldChars = Math.max(oldChars, String(value).length);
          oldKeyChars = Math.max(oldKeyChars, candidate.length);
        }
      }
      return Math.max(0, total - oldChars - oldKeyChars)
        + String(serialized == null ? '' : serialized).length
        + (`csstore_${this.key}`).length;
    } catch (_) {
      return null;
    }
  }

  _blockQuota(reason, error = null, data = {}) {
    if (!this.quotaBlocked) {
      this.quotaBlocked = true;
      this.quotaBlockedAt = this.now();
      this.lastWriteError = error ? String(error && error.message || error) : reason;
      if (this.log) this.log.emit({
        component: 'persistence',
        event: 'WORLD_MODEL_PERSISTENCE_QUOTA_BLOCKED',
        severity: 'warn',
        reason,
        data: {
          backend: this.backendName,
          message: this.lastWriteError,
          ...data
        }
      });
    }
    return false;
  }

  load(world) {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      return false;
    }
    try {
      const serialized = backend.get(this.key);
      if (serialized == null || serialized === '') {
        if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_STORAGE_EMPTY', data: { backend: this.backendName } });
        return false;
      }
      world.restore(serialized);
      this.lastSavedRevision = world.revision;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORED', data: { backend: this.backendName, bytes: String(serialized).length, revision: world.revision } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORE_FAILED', severity: 'warn', reason: 'PERSISTENCE_READ_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      return false;
    }
  }

  maybeSave(world, options = {}) {
    if (this.quotaBlocked) return false;

    const force = options.force === true;
    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      return false;
    }
    const now = this.now();
    if (!force && world.revision === this.lastSavedRevision) return false;
    if (!force && now - this.lastSavedAt < this.minIntervalMs) return false;

    let serialized;
    try {
      serialized = world.serialize();
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'SERIALIZE_ERROR', data: { message: String(error && error.message || error) } });
      return false;
    }
    if (serialized.length > this.maxBytes) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_SKIPPED', severity: 'warn', reason: 'PERSISTENCE_SIZE_LIMIT', data: { bytes: serialized.length, maxBytes: this.maxBytes, revision: world.revision } });
      return false;
    }

    const projectedChars = this._localStorageProjectedChars(serialized);
    if (projectedChars != null && projectedChars >= this.storageHighWatermarkChars) {
      this.preflightQuotaBlocks += 1;
      return this._blockQuota('PERSISTENCE_QUOTA_PRESSURE', null, {
        projectedChars,
        highWatermarkChars: this.storageHighWatermarkChars,
        bytes: serialized.length,
        revision: world.revision
      });
    }

    try {
      backend.set(this.key, serialized);
      this.lastSavedAt = now;
      this.lastSavedRevision = world.revision;
      this.lastWriteError = null;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVED', data: { backend: this.backendName, bytes: serialized.length, revision: world.revision, forced: force } });
      return true;
    } catch (error) {
      this.writeFailures += 1;
      if (isQuotaError(error)) {
        return this._blockQuota('PERSISTENCE_QUOTA_EXCEEDED', error, {
          bytes: serialized.length,
          revision: world.revision
        });
      }
      this.lastWriteError = String(error && error.message || error);
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'PERSISTENCE_WRITE_ERROR', data: { backend: this.backendName, message: this.lastWriteError } });
      return false;
    }
  }

  _logUnavailable() {
    if (this.unavailableLogged) return;
    this.unavailableLogged = true;
    if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_PERSISTENCE_UNAVAILABLE', severity: 'warn', reason: 'NO_SUPPORTED_STORAGE' });
  }

  status() {
    return {
      backend: this.backendName,
      loaded: this.loaded,
      lastSavedAt: this.lastSavedAt || null,
      lastSavedRevision: this.lastSavedRevision,
      quotaBlocked: this.quotaBlocked,
      quotaBlockedAt: this.quotaBlockedAt || null,
      lastWriteError: this.lastWriteError,
      preflightQuotaBlocks: this.preflightQuotaBlocks,
      writeFailures: this.writeFailures,
      storageHighWatermarkChars: this.storageHighWatermarkChars
    };
  }
}

module.exports = { WorldPersistence, isQuotaError };
