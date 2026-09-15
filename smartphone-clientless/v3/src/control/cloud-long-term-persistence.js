'use strict';

const CLOUD_LONG_TERM_MODE = 'cloud-long-term-write-behind-v1';
const FALLBACK_KEY = 'aio-v3:cloud-long-term-fallback:v1';
const LEGACY_KEYS = Object.freeze({
  brain: ['aio-v3:brain-v2:state:v2'],
  gear: ['aio-v3-gear-progression-v1'],
  market: ['aio-v3:economy-v2-market-history:v1'],
  'party-performance': ['AIO_V3_PARTY_PERFORMANCE']
});
const ALLOWED_NAMESPACES = new Set(Object.keys(LEGACY_KEYS));

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}
function storageOf(root) {
  try {
    const storage = root && (root.localStorage || root.parent && root.parent.localStorage);
    return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' ? storage : null;
  } catch (_) { return null; }
}
function maxTimestamp(values) {
  let best = 0;
  for (const value of values || []) {
    const n = finite(value, 0);
    if (n > best) best = n;
  }
  return best;
}

class CloudLongTermPersistence {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.flushIntervalMs = Math.max(5000, finite(options.flushIntervalMs, 15000));
    this.fallbackIntervalMs = Math.max(30000, finite(options.fallbackIntervalMs, 60000));
    this.maxFallbackBytes = Math.max(16000, Math.min(128000, finite(options.maxFallbackBytes, 96000)));
    this.dirty = new Map();
    this.lastFlushAt = 0;
    this.lastFallbackAt = 0;
    this.lastSuccessAt = 0;
    this.lastError = null;
    this.busy = false;
    this.bootstrapStarted = false;
    this.bootstrapComplete = false;
    this.installed = new Set();
    this.stats = {
      queued: 0, flushes: 0, recordsFlushed: 0, flushFailures: 0,
      bootstraps: 0, recordsRestored: 0, legacyKeysCleared: 0,
      fallbackWrites: 0, fallbackFailures: 0
    };
    this.installAdapters();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'cloud-long-term-persistence', event, severity, reason, data }); } catch (_) {}
  }

  _cloud() { return this.runtime.cloudControlPlane || null; }

  _cloudReady() {
    const cloud = this._cloud();
    if (!cloud || typeof cloud._post !== 'function') return false;
    try { return !!(cloud.status && cloud.status().ready); } catch (_) { return false; }
  }

  markDirty(namespace, stateKey, payload, schemaVersion = 1) {
    if (!ALLOWED_NAMESPACES.has(namespace) || !stateKey || payload == null) return false;
    const key = `${namespace}:${stateKey}`;
    this.dirty.set(key, {
      namespace,
      stateKey: String(stateKey),
      schemaVersion: Math.max(1, Math.floor(finite(schemaVersion, 1))),
      payload: clone(payload),
      updatedAt: this.now()
    });
    this.stats.queued += 1;
    return true;
  }

  _brainPayload() {
    const brain = this.runtime.strategicBrainV2 || this.runtime.brain;
    return brain && typeof brain.exportState === 'function' ? brain.exportState() : null;
  }

  _gearPayload() {
    const gear = this.runtime.gearProgression;
    if (!gear) return null;
    try {
      if (typeof gear.serialize === 'function') return JSON.parse(gear.serialize());
      if (gear.goals instanceof Map) return { schemaVersion: 1, savedAt: this.now(), goals: [...gear.goals.entries()] };
    } catch (_) {}
    return null;
  }

  _marketPayload() {
    const economy = this.runtime.economyEquipmentAutonomyV2;
    const market = economy && economy.marketHistory;
    if (!market) return null;
    try {
      if (typeof market._payload === 'function') return market._payload();
      if (market.history instanceof Map) return { schemaVersion: 1, savedAt: this.now(), items: [...market.history.entries()].map(([key, samples]) => ({ key, samples })) };
    } catch (_) {}
    return null;
  }

  _partyPayload() {
    const party = this.runtime.partyPerformance;
    if (!party || !(party.records instanceof Map)) return null;
    return { schemaVersion: 1, savedAt: this.now(), records: [...party.records.values()].map(clone) };
  }

  _queueInitialSnapshots() {
    const brain = this._brainPayload(); if (brain) this.markDirty('brain', 'state', brain, brain.schemaVersion || 2);
    const gear = this._gearPayload(); if (gear) this.markDirty('gear', 'state', gear, gear.schemaVersion || 1);
    const market = this._marketPayload(); if (market) this.markDirty('market', 'history', market, market.schemaVersion || 1);
    const party = this._partyPayload(); if (party) this.markDirty('party-performance', 'state', party, party.schemaVersion || 1);
  }

  _wrapBrain() {
    const brain = this.runtime.strategicBrainV2 || this.runtime.brain;
    if (!brain || brain.__alpha2021CloudPersistenceWrapped || typeof brain._save !== 'function') return false;
    brain.__alpha2021OriginalSave = brain._save.bind(brain);
    brain._save = () => {
      const payload = this._brainPayload();
      if (!payload) return false;
      brain.lastSaveAt = this.now();
      brain.persistenceDisabled = false;
      brain.persistenceError = null;
      this.markDirty('brain', 'state', payload, payload.schemaVersion || 2);
      return true;
    };
    brain.__alpha2021CloudPersistenceWrapped = true;
    this.installed.add('brain');
    return true;
  }

  _wrapGear() {
    const gear = this.runtime.gearProgression;
    if (!gear || gear.__alpha2021CloudPersistenceWrapped || typeof gear.save !== 'function') return false;
    gear.__alpha2021OriginalSave = gear.save.bind(gear);
    gear.save = (options = {}) => {
      const now = this.now();
      if (options.force !== true && gear.lastSavedAt != null && now - gear.lastSavedAt < 30000) return false;
      const payload = this._gearPayload();
      if (!payload) return false;
      gear.lastSavedAt = now;
      this.markDirty('gear', 'state', payload, payload.schemaVersion || 1);
      return true;
    };
    gear.__alpha2021CloudPersistenceWrapped = true;
    this.installed.add('gear');
    return true;
  }

  _wrapMarket() {
    const economy = this.runtime.economyEquipmentAutonomyV2;
    const market = economy && economy.marketHistory;
    if (!market || market.__alpha2021CloudPersistenceWrapped || typeof market.save !== 'function') return false;
    market.__alpha2021OriginalSave = market.save.bind(market);
    market.save = (force = false) => {
      const now = this.now();
      if (!force && market.lastSavedAt != null && now - market.lastSavedAt < market.saveIntervalMs) return false;
      try { if (typeof market._compact === 'function') market._compact(); } catch (_) {}
      const payload = this._marketPayload();
      if (!payload) return false;
      market.lastSavedAt = now;
      market.persistenceDisabled = false;
      if (market.stats) market.stats.saves = finite(market.stats.saves, 0) + 1;
      this.markDirty('market', 'history', payload, payload.schemaVersion || 1);
      return true;
    };
    market.__alpha2021CloudPersistenceWrapped = true;
    this.installed.add('market');
    return true;
  }

  _wrapPartyPerformance() {
    const party = this.runtime.partyPerformance;
    if (!party || party.__alpha2021CloudPersistenceWrapped || typeof party.save !== 'function') return false;
    party.__alpha2021OriginalSave = party.save.bind(party);
    party.save = (options = {}) => {
      if (!party.dirty && options.force !== true) return false;
      const now = this.now();
      if (!options.force && now - party.lastSavedAt < party.minSaveMs) return false;
      const payload = this._partyPayload();
      if (!payload) return false;
      party.lastSavedAt = now;
      party.dirty = false;
      if (party.stats) party.stats.saves = finite(party.stats.saves, 0) + 1;
      this.markDirty('party-performance', 'state', payload, payload.schemaVersion || 1);
      return true;
    };
    party.__alpha2021CloudPersistenceWrapped = true;
    this.installed.add('party-performance');
    return true;
  }

  installAdapters() {
    this._wrapBrain();
    this._wrapGear();
    this._wrapMarket();
    this._wrapPartyPerformance();
    return this.installed.size;
  }

  _localEvidenceTime(namespace) {
    if (namespace === 'gear') {
      const goals = this.runtime.gearProgression && this.runtime.gearProgression.goals;
      return goals instanceof Map ? maxTimestamp([...goals.values()].map((g) => g && g.lastSeenAt)) : 0;
    }
    if (namespace === 'market') {
      const market = this.runtime.economyEquipmentAutonomyV2 && this.runtime.economyEquipmentAutonomyV2.marketHistory;
      if (!(market && market.history instanceof Map)) return 0;
      const values = [];
      for (const samples of market.history.values()) if (Array.isArray(samples) && samples.length) values.push(samples[samples.length - 1].at);
      return maxTimestamp(values);
    }
    if (namespace === 'party-performance') {
      const records = this.runtime.partyPerformance && this.runtime.partyPerformance.records;
      return records instanceof Map ? maxTimestamp([...records.values()].map((r) => r && r.updatedAt)) : 0;
    }
    return 0;
  }

  _restoreRecord(record) {
    if (!record || !ALLOWED_NAMESPACES.has(record.namespace) || !record.payload) return false;
    const payload = record.payload;
    if (record.namespace === 'brain') {
      const brain = this.runtime.strategicBrainV2 || this.runtime.brain;
      if (!brain || typeof brain.importState !== 'function') return false;
      const incomingSamples = finite(payload.samples, 0);
      const incomingUpdates = finite(payload.updates, 0);
      if (incomingSamples < finite(brain.samples, 0)) return false;
      if (incomingSamples === finite(brain.samples, 0) && incomingUpdates < finite(brain.updates, 0)) return false;
      return brain.importState(payload) === true;
    }
    if (finite(record.updatedAt, 0) < this._localEvidenceTime(record.namespace)) return false;
    if (record.namespace === 'gear') {
      const gear = this.runtime.gearProgression;
      if (!gear || !Array.isArray(payload.goals)) return false;
      gear.goals = new Map(payload.goals.filter((row) => Array.isArray(row) && row.length === 2));
      if (typeof gear._prune === 'function') gear._prune();
      return true;
    }
    if (record.namespace === 'market') {
      const market = this.runtime.economyEquipmentAutonomyV2 && this.runtime.economyEquipmentAutonomyV2.marketHistory;
      if (!market || !Array.isArray(payload.items)) return false;
      market.history = new Map(payload.items.filter((row) => row && row.key && Array.isArray(row.samples)).map((row) => [row.key, row.samples.slice(-market.maxSamplesPerItem)]));
      market.persistenceDisabled = false;
      return true;
    }
    if (record.namespace === 'party-performance') {
      const party = this.runtime.partyPerformance;
      if (!party || !Array.isArray(payload.records)) return false;
      const next = new Map();
      for (const row of payload.records.slice(-party.capacity)) {
        const clean = typeof party._sanitize === 'function' ? party._sanitize(row) : row;
        if (clean) next.set(typeof party._key === 'function' ? party._key(clean.encounterKey, clean.partyKey) : `${clean.encounterKey}::${clean.partyKey}`, clean);
      }
      party.records = next;
      party.dirty = false;
      return true;
    }
    return false;
  }

  async bootstrap() {
    if (this.bootstrapStarted || !this._cloudReady()) return false;
    this.bootstrapStarted = true;
    this.stats.bootstraps += 1;
    try {
      const cloud = this._cloud();
      const result = await cloud._post('/api/v3/persistence/load', {
        account: cloud.credentials.account,
        namespaces: [...ALLOWED_NAMESPACES]
      }, 12000);
      for (const record of Array.isArray(result.records) ? result.records : []) {
        try { if (this._restoreRecord(record)) this.stats.recordsRestored += 1; } catch (_) {}
      }
      this.bootstrapComplete = true;
      this._queueInitialSnapshots();
      return true;
    } catch (error) {
      this.bootstrapStarted = false;
      this.lastError = { at: this.now(), message: String(error && error.message || error).slice(0, 240) };
      return false;
    }
  }

  _clearLegacyKeys(namespaces) {
    const storage = storageOf(this.root);
    if (!storage || typeof storage.removeItem !== 'function') return 0;
    let count = 0;
    for (const namespace of namespaces) {
      for (const key of LEGACY_KEYS[namespace] || []) {
        try { if (storage.getItem(key) != null) { storage.removeItem(key); count += 1; } } catch (_) {}
      }
    }
    this.stats.legacyKeysCleared += count;
    return count;
  }

  _slimRecord(record) {
    const payload = clone(record.payload) || {};
    if (record.namespace === 'gear' && Array.isArray(payload.goals)) payload.goals = payload.goals.slice(-32);
    if (record.namespace === 'market' && Array.isArray(payload.items)) payload.items = payload.items.slice(-12).map((row) => ({ ...row, samples: Array.isArray(row.samples) ? row.samples.slice(-8) : [] }));
    if (record.namespace === 'party-performance' && Array.isArray(payload.records)) payload.records = payload.records.slice(-32);
    if (record.namespace === 'brain' && Array.isArray(payload.diary)) payload.diary = payload.diary.slice(-20);
    return { ...record, payload };
  }

  _writeFallback() {
    if (this.now() - this.lastFallbackAt < this.fallbackIntervalMs) return false;
    this.lastFallbackAt = this.now();
    const storage = storageOf(this.root);
    if (!storage) return false;
    try {
      let records = [...this.dirty.values()].map((row) => this._slimRecord(row));
      let serialized = JSON.stringify({ schemaVersion: 1, savedAt: this.now(), records });
      while (serialized.length > this.maxFallbackBytes && records.length > 1) {
        const market = records.findIndex((r) => r.namespace === 'market');
        records.splice(market >= 0 ? market : 0, 1);
        serialized = JSON.stringify({ schemaVersion: 1, savedAt: this.now(), records });
      }
      if (serialized.length > this.maxFallbackBytes) return false;
      storage.setItem(FALLBACK_KEY, serialized);
      this.stats.fallbackWrites += 1;
      return true;
    } catch (_) {
      this.stats.fallbackFailures += 1;
      return false;
    }
  }

  async flush() {
    if (this.busy || !this.dirty.size || !this._cloudReady()) return false;
    this.busy = true;
    const snapshot = [...this.dirty.entries()].map(([key, row]) => [key, clone(row)]);
    try {
      const cloud = this._cloud();
      const result = await cloud._post('/api/v3/persistence/upsert', {
        account: cloud.credentials.account,
        records: snapshot.map(([, row]) => row)
      }, 15000);
      const accepted = new Set(Array.isArray(result.accepted) ? result.accepted : snapshot.map(([key]) => key));
      const clearedNamespaces = new Set();
      for (const [key, row] of snapshot) {
        if (!accepted.has(key) && !accepted.has(`${row.namespace}:${row.stateKey}`)) continue;
        const current = this.dirty.get(key);
        if (current && finite(current.updatedAt, 0) <= finite(row.updatedAt, 0)) this.dirty.delete(key);
        clearedNamespaces.add(row.namespace);
        this.stats.recordsFlushed += 1;
      }
      this._clearLegacyKeys(clearedNamespaces);
      const storage = storageOf(this.root); try { if (storage && !this.dirty.size) storage.removeItem(FALLBACK_KEY); } catch (_) {}
      this.stats.flushes += 1;
      this.lastSuccessAt = this.now();
      this.lastError = null;
      return true;
    } catch (error) {
      this.stats.flushFailures += 1;
      this.lastError = { at: this.now(), message: String(error && error.message || error).slice(0, 240) };
      this._writeFallback();
      this._event('CLOUD_LONG_TERM_FLUSH_FAILED', 'warn', 'CLOUD_UNAVAILABLE_NON_BLOCKING', { ...this.lastError, queued: this.dirty.size, actionAuthority: false });
      return false;
    } finally { this.busy = false; }
  }

  beforeTick() {
    this.installAdapters();
    if (!this.bootstrapStarted && this._cloudReady()) Promise.resolve(this.bootstrap()).catch(() => {});
    const now = this.now();
    if (!this.busy && this.dirty.size && now - this.lastFlushAt >= this.flushIntervalMs) {
      this.lastFlushAt = now;
      Promise.resolve(this.flush()).catch(() => {});
      return true;
    }
    return false;
  }

  status() {
    return {
      schemaVersion: 1, mode: CLOUD_LONG_TERM_MODE, cloudPrimary: true,
      browserFallbackKey: FALLBACK_KEY, fallbackMaxBytes: this.maxFallbackBytes,
      flushIntervalMs: this.flushIntervalMs, bootstrapComplete: this.bootstrapComplete,
      installedNamespaces: [...this.installed].sort(), dirtyRecords: this.dirty.size,
      busy: this.busy, lastSuccessAt: this.lastSuccessAt || null, lastError: this.lastError,
      stats: { ...this.stats },
      policies: { actionAuthority: false, directGameplayActionAccess: false, cloudFailureBlocksCombat: false, writeBehindOnly: true, localFallbackBounded: true, legacyLocalStateDeletedOnlyAfterCloudAck: true }
    };
  }
}

function installCloudLongTermPersistence(runtime, options = {}) {
  if (runtime.cloudLongTermPersistence) return runtime.cloudLongTermPersistence;
  return runtime.cloudLongTermPersistence = new CloudLongTermPersistence(runtime, options);
}

module.exports = { CloudLongTermPersistence, installCloudLongTermPersistence, CLOUD_LONG_TERM_MODE, FALLBACK_KEY, LEGACY_KEYS, ALLOWED_NAMESPACES };
