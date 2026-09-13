'use strict';

const { isQuotaError } = require('../world/persistence');

const PARTY_PERSISTENCE_QUOTA_MODE = 'party-persistence-quota-isolation-v1';

class PartyPersistenceQuotaHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.storageHighWatermarkChars = Math.max(500000, Number(options.storageHighWatermarkChars) || 4000000);
    this.states = new Map();
    this.installed = false;
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'party-persistence-quota', event, severity, reason, data }); } catch (_) {}
  }

  _storage() {
    return this.root && this.root.localStorage || this.root && this.root.parent && this.root.parent.localStorage || null;
  }

  _backendKind(store) {
    if (store && store.storage && typeof store.storage.get === 'function' && typeof store.storage.set === 'function') return 'custom';
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return 'adventure-land';
    const storage = this._storage();
    if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return 'localStorage';
    return 'unknown';
  }

  _physicalKey(kind, logicalKey) {
    if (kind === 'adventure-land') return `store_${logicalKey}`;
    if (kind === 'localStorage') return String(logicalKey);
    return null;
  }

  _projectedChars(kind, logicalKey, value) {
    if (kind !== 'adventure-land' && kind !== 'localStorage') return null;
    const storage = this._storage();
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.key !== 'function') return null;
    const physicalKey = this._physicalKey(kind, logicalKey);
    if (!physicalKey) return null;
    try {
      let total = 0;
      for (let index = 0; index < Number(storage.length || 0); index += 1) {
        const key = storage.key(index);
        if (key == null) continue;
        const current = storage.getItem(key);
        total += String(key).length + String(current == null ? '' : current).length;
      }
      const previous = storage.getItem(physicalKey);
      if (previous != null) total -= String(physicalKey).length + String(previous).length;
      total += String(physicalKey).length + String(value == null ? '' : value).length;
      return Math.max(0, total);
    } catch (_) {
      return null;
    }
  }

  _block(state, reason, error = null) {
    if (!state.quotaBlocked) {
      state.quotaBlocked = true;
      state.quotaBlockedAt = this.now();
      state.reason = reason;
      state.lastError = error ? String(error && error.message || error) : null;
      this._event('PARTY_PERSISTENCE_QUOTA_BLOCKED', 'warn', reason, {
        store: state.name,
        key: state.key,
        error: state.lastError
      });
    }
  }

  _wrapStore(name, store) {
    if (!store || typeof store._backend !== 'function' || typeof store.save !== 'function' || store.__partyPersistenceQuotaHotfixInstalled) return false;
    const state = {
      name,
      key: store.key || null,
      backend: this._backendKind(store),
      quotaBlocked: false,
      quotaBlockedAt: 0,
      reason: null,
      lastError: null,
      preflightBlocks: 0,
      quotaWriteFailures: 0,
      bypassedSaves: 0
    };
    this.states.set(name, state);

    const baseBackend = store._backend.bind(store);
    store._backend = () => {
      const backend = baseBackend();
      if (!backend) return backend;
      return {
        get: (key) => backend.get(key),
        set: (key, value) => {
          if (state.quotaBlocked) {
            const error = new Error(`PARTY_PERSISTENCE_QUOTA_BLOCKED:${name}`);
            error.code = 'PARTY_PERSISTENCE_QUOTA_BLOCKED';
            throw error;
          }
          const projected = this._projectedChars(state.backend, key, value);
          if (projected != null && projected >= this.storageHighWatermarkChars) {
            state.preflightBlocks += 1;
            this._block(state, 'PERSISTENCE_QUOTA_PRESSURE');
            const error = new Error(`PARTY_PERSISTENCE_QUOTA_PRESSURE:${name}`);
            error.code = 'PARTY_PERSISTENCE_QUOTA_BLOCKED';
            throw error;
          }
          try {
            return backend.set(key, value);
          } catch (error) {
            if (isQuotaError(error)) {
              state.quotaWriteFailures += 1;
              this._block(state, 'PERSISTENCE_QUOTA_EXCEEDED', error);
            }
            throw error;
          }
        }
      };
    };

    const baseSave = store.save.bind(store);
    store.save = (...args) => {
      if (state.quotaBlocked) {
        state.bypassedSaves += 1;
        return false;
      }
      return baseSave(...args);
    };
    store.__partyPersistenceQuotaHotfixInstalled = true;
    return true;
  }

  _install() {
    const performance = this._wrapStore('partyPerformance', this.runtime.partyPerformance);
    const lifecycle = this._wrapStore('partyLifecycle', this.runtime.partyLifecycle);
    this.installed = performance || lifecycle;
    this._event('PARTY_PERSISTENCE_QUOTA_HOTFIX_INSTALLED', 'info', null, { performance, lifecycle, storageHighWatermarkChars: this.storageHighWatermarkChars });
  }

  status() {
    return {
      schemaVersion: 1,
      mode: PARTY_PERSISTENCE_QUOTA_MODE,
      installed: this.installed,
      storageHighWatermarkChars: this.storageHighWatermarkChars,
      stores: Object.fromEntries([...this.states.entries()].map(([name, state]) => [name, { ...state }]))
    };
  }
}

function installPartyPersistenceQuotaHotfix(runtime, options = {}) {
  return new PartyPersistenceQuotaHotfix(runtime, options);
}

module.exports = { PartyPersistenceQuotaHotfix, installPartyPersistenceQuotaHotfix, PARTY_PERSISTENCE_QUOTA_MODE };
