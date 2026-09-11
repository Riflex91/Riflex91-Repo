'use strict';

class WorldPersistence {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.key = options.key || 'AIO_V3_WORLD_MODEL';
    this.minIntervalMs = Math.max(5000, Number(options.minIntervalMs) || 30000);
    this.maxBytes = Math.max(10000, Number(options.maxBytes) || 900000);
    this.storage = options.storage || null;
    this.lastSavedAt = 0;
    this.lastSavedRevision = -1;
    this.loaded = false;
    this.backendName = null;
    this.unavailableLogged = false;
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
    try { serialized = world.serialize(); } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'SERIALIZE_ERROR', data: { message: String(error && error.message || error) } });
      return false;
    }
    if (serialized.length > this.maxBytes) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_SKIPPED', severity: 'warn', reason: 'PERSISTENCE_SIZE_LIMIT', data: { bytes: serialized.length, maxBytes: this.maxBytes, revision: world.revision } });
      return false;
    }
    try {
      backend.set(this.key, serialized);
      this.lastSavedAt = now;
      this.lastSavedRevision = world.revision;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVED', data: { backend: this.backendName, bytes: serialized.length, revision: world.revision, forced: force } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'PERSISTENCE_WRITE_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
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
      lastSavedRevision: this.lastSavedRevision
    };
  }
}

module.exports = { WorldPersistence };
