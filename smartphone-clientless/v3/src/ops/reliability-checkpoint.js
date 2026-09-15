'use strict';

const { isQuotaError } = require('../world/persistence');

const RELIABILITY_CHECKPOINT_SCHEMA_VERSION = 1;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function checksum(text) {
  let hash = 0x811c9dc5;
  const value = String(text);
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

class ReliabilityCheckpointStore {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.baseKey = options.baseKey || 'AIO_V3_RELIABILITY_CHECKPOINT';
    this.maxBytes = Math.max(10000, Math.min(1000000, finite(options.maxBytes, 120000)));
    this.storageHighWatermarkChars = Math.max(500000, finite(options.storageHighWatermarkChars, 4000000));
    this.lastLoaded = null;
    this.lastSaved = null;
    this.backendName = null;
    this.quotaBlocked = false;
    this.quotaBlockedAt = 0;
    this.lastWriteError = null;
    this.stats = {
      saves: 0,
      saveFailures: 0,
      loads: 0,
      loadFailures: 0,
      fallbacks: 0,
      corrupt: 0,
      oversize: 0,
      preflightQuotaBlocks: 0,
      quotaWriteFailures: 0
    };
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

  _slotKey(slot) { return `${this.baseKey}_${slot}`; }
  _pointerKey() { return `${this.baseKey}_PTR`; }

  _physicalStorageKey(logicalKey) {
    if (this.backendName === 'adventure-land') return `store_${logicalKey}`;
    if (this.backendName === 'localStorage') return logicalKey;
    return null;
  }

  _projectedStorageChars(writes) {
    if (this.backendName !== 'adventure-land' && this.backendName !== 'localStorage') return null;
    const storage = this.root && this.root.localStorage;
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.key !== 'function') return null;
    try {
      let total = 0;
      for (let index = 0; index < Number(storage.length || 0); index += 1) {
        const key = storage.key(index);
        if (key == null) continue;
        const value = storage.getItem(key);
        total += String(key).length + String(value == null ? '' : value).length;
      }
      for (const write of writes || []) {
        const physicalKey = this._physicalStorageKey(write && write.key);
        if (!physicalKey) continue;
        const previous = storage.getItem(physicalKey);
        if (previous != null) total -= String(physicalKey).length + String(previous).length;
        total += String(physicalKey).length + String(write && write.value == null ? '' : write.value).length;
      }
      return Math.max(0, total);
    } catch (_) {
      return null;
    }
  }

  _blockQuota(reason, error = null) {
    if (!this.quotaBlocked) {
      this.quotaBlocked = true;
      this.quotaBlockedAt = this.now();
      this.lastWriteError = error ? String(error && error.message || error) : reason;
    }
    return { saved: false, reason, quotaBlocked: true, error: error ? this.lastWriteError : undefined };
  }

  _decode(raw) {
    if (raw == null || raw === '') return null;
    try {
      const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!envelope || envelope.schemaVersion !== RELIABILITY_CHECKPOINT_SCHEMA_VERSION || typeof envelope.serialized !== 'string') return null;
      if (checksum(envelope.serialized) !== envelope.checksum) return null;
      const payload = JSON.parse(envelope.serialized);
      if (!payload || payload.schemaVersion !== RELIABILITY_CHECKPOINT_SCHEMA_VERSION) return null;
      if (payload.resumeAllowed !== false || payload.reconciliationRequired !== true) return null;
      return payload;
    } catch (_) {
      return null;
    }
  }

  load() {
    const backend = this._backend();
    this.stats.loads += 1;
    if (!backend) {
      this.stats.loadFailures += 1;
      return null;
    }
    let pointer = null;
    try { pointer = String(backend.get(this._pointerKey()) || '').toUpperCase(); } catch (_) {}
    const order = pointer === 'A' || pointer === 'B' ? [pointer, pointer === 'A' ? 'B' : 'A'] : ['A', 'B'];
    for (let index = 0; index < order.length; index += 1) {
      const slot = order[index];
      let raw = null;
      try { raw = backend.get(this._slotKey(slot)); } catch (_) { raw = null; }
      const decoded = this._decode(raw);
      if (decoded) {
        if (index > 0) this.stats.fallbacks += 1;
        this.lastLoaded = { slot, ...clone(decoded) };
        return clone(this.lastLoaded);
      }
      if (raw != null && raw !== '') this.stats.corrupt += 1;
    }
    this.stats.loadFailures += 1;
    return null;
  }

  save(snapshot = {}, options = {}) {
    if (this.quotaBlocked) return { saved: false, reason: 'QUOTA_BLOCKED', quotaBlocked: true };
    const backend = this._backend();
    if (!backend) {
      this.stats.saveFailures += 1;
      return { saved: false, reason: 'STORAGE_UNAVAILABLE' };
    }
    let pointer = null;
    try { pointer = String(backend.get(this._pointerKey()) || '').toUpperCase(); } catch (_) {}
    const slot = pointer === 'A' ? 'B' : 'A';
    const previousSequence = Math.max(
      finite(this.lastSaved && this.lastSaved.sequence, 0),
      finite(this.lastLoaded && this.lastLoaded.sequence, 0)
    );
    const payload = {
      schemaVersion: RELIABILITY_CHECKPOINT_SCHEMA_VERSION,
      sequence: previousSequence + 1,
      savedAt: this.now(),
      reason: options.reason || 'PERIODIC',
      resumeAllowed: false,
      reconciliationRequired: true,
      snapshot: clone(snapshot)
    };
    let serialized;
    try { serialized = JSON.stringify(payload); } catch (_) {
      this.stats.saveFailures += 1;
      return { saved: false, reason: 'SERIALIZE_FAILED' };
    }
    const envelope = JSON.stringify({
      schemaVersion: RELIABILITY_CHECKPOINT_SCHEMA_VERSION,
      checksum: checksum(serialized),
      serialized
    });
    if (envelope.length > this.maxBytes) {
      this.stats.oversize += 1;
      this.stats.saveFailures += 1;
      return { saved: false, reason: 'SIZE_LIMIT', bytes: envelope.length, maxBytes: this.maxBytes };
    }

    const projectedChars = this._projectedStorageChars([
      { key: this._slotKey(slot), value: envelope },
      { key: this._pointerKey(), value: slot }
    ]);
    if (projectedChars != null && projectedChars >= this.storageHighWatermarkChars) {
      this.stats.preflightQuotaBlocks += 1;
      this.stats.saveFailures += 1;
      return this._blockQuota('CHECKPOINT_QUOTA_PRESSURE');
    }

    try {
      backend.set(this._slotKey(slot), envelope);
      backend.set(this._pointerKey(), slot);
      this.stats.saves += 1;
      this.lastWriteError = null;
      this.lastSaved = { slot, bytes: envelope.length, ...clone(payload) };
      return { saved: true, slot, bytes: envelope.length, sequence: payload.sequence, savedAt: payload.savedAt };
    } catch (error) {
      this.stats.saveFailures += 1;
      if (isQuotaError(error)) {
        this.stats.quotaWriteFailures += 1;
        return this._blockQuota('CHECKPOINT_QUOTA_EXCEEDED', error);
      }
      this.lastWriteError = String(error && error.message || error);
      return { saved: false, reason: 'WRITE_FAILED', error: this.lastWriteError };
    }
  }

  latestEvidence() {
    const row = this.lastSaved || this.lastLoaded;
    return row ? clone(row) : null;
  }

  status() {
    return {
      schemaVersion: RELIABILITY_CHECKPOINT_SCHEMA_VERSION,
      mode: 'reconciliation-evidence-only',
      actionAuthority: false,
      resumeAllowed: false,
      reconciliationRequired: true,
      backend: this.backendName,
      baseKey: this.baseKey,
      maxBytes: this.maxBytes,
      storageHighWatermarkChars: this.storageHighWatermarkChars,
      quotaBlocked: this.quotaBlocked,
      quotaBlockedAt: this.quotaBlockedAt || null,
      lastWriteError: this.lastWriteError,
      lastSavedAt: this.lastSaved && this.lastSaved.savedAt || null,
      lastSavedSequence: this.lastSaved && this.lastSaved.sequence || null,
      lastLoadedAt: this.lastLoaded && this.lastLoaded.savedAt || null,
      lastLoadedSequence: this.lastLoaded && this.lastLoaded.sequence || null,
      stats: { ...this.stats }
    };
  }
}

module.exports = { ReliabilityCheckpointStore, RELIABILITY_CHECKPOINT_SCHEMA_VERSION, checksum };
