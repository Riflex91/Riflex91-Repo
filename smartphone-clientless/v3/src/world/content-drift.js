'use strict';

const CONTENT_DRIFT_SCHEMA_VERSION = 1;
const ContentLifecycle = Object.freeze({
  BASELINE: 'BASELINE',
  OBSERVED: 'OBSERVED',
  QUARANTINED: 'QUARANTINED'
});

const DEFAULT_CATEGORIES = Object.freeze(['monsters', 'maps', 'npcs', 'items', 'skills', 'events']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalize(value, depth = 0) {
  if (depth > 6) return '[depth-limit]';
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 512 ? value.slice(0, 512) : value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'function' || typeof value === 'undefined' || typeof value === 'symbol') return undefined;
  if (Array.isArray(value)) return value.slice(0, 128).map((item) => normalize(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    const keys = Object.keys(value).sort().slice(0, 256);
    for (const key of keys) {
      const normalized = normalize(value[key], depth + 1);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }
  return String(value);
}

function stableStringify(value) {
  return JSON.stringify(normalize(value));
}

function hashString(input) {
  let hash = 0x811c9dc5;
  const text = String(input || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function fingerprint(value) {
  const canonical = stableStringify(value);
  return { hash: hashString(canonical), bytes: canonical.length };
}

function recordKey(category, id) {
  return `${category}:${String(id)}`;
}

class ContentDriftMonitor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'aio-v3-content-drift-v1';
    this.capacity = Math.max(64, Math.min(10000, Math.floor(finite(options.capacity, 2048))));
    this.scanBudget = Math.max(6, Math.min(512, Math.floor(finite(options.scanBudget, 96))));
    this.minObservedSamples = Math.max(2, Math.min(20, Math.floor(finite(options.minObservedSamples, 2))));
    this.minSaveMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.minSaveMs, 30000)));
    this.categories = Array.isArray(options.categories) && options.categories.length ? [...new Set(options.categories.map(String))] : DEFAULT_CATEGORIES.slice();
    this.records = new Map();
    this.catalog = new Map(this.categories.map((category) => [category, { cursor: 0, baselineComplete: false, cycles: 0 }]));
    this.loaded = false;
    this.lastSavedAt = 0;
    this.lastScanAt = null;
    this.lastScan = null;
    this.stats = { scans: 0, observed: 0, baselineRecords: 0, novelty: 0, drift: 0, revalidated: 0, pruned: 0, loadErrors: 0, saveErrors: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'content-drift', event, severity, reason, data });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    const ls = this.root && this.root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
      return { get: (key) => ls.getItem(key), set: (key, value) => ls.setItem(key, value) };
    }
    return null;
  }

  _catalogState(category) {
    if (!this.catalog.has(category)) this.catalog.set(category, { cursor: 0, baselineComplete: false, cycles: 0 });
    return this.catalog.get(category);
  }

  _prune() {
    if (this.records.size <= this.capacity) return 0;
    const rows = [...this.records.entries()].sort((a, b) => {
      const aq = a[1].lifecycle === ContentLifecycle.QUARANTINED ? 1 : 0;
      const bq = b[1].lifecycle === ContentLifecycle.QUARANTINED ? 1 : 0;
      if (aq !== bq) return aq - bq;
      return finite(a[1].lastSeenAt) - finite(b[1].lastSeenAt);
    });
    const count = this.records.size - this.capacity;
    for (let i = 0; i < count; i += 1) this.records.delete(rows[i][0]);
    this.stats.pruned += count;
    if (count > 0) this._event('CONTENT_DRIFT_RECORDS_PRUNED', 'warn', 'CAPACITY_LIMIT', { count, capacity: this.capacity });
    return count;
  }

  _observe(category, id, value, options = {}) {
    if (!category || id == null) return null;
    const now = this.now();
    const key = recordKey(category, id);
    const fp = fingerprint(value);
    const current = this.records.get(key);
    const baselineAllowed = options.baselineAllowed === true;
    this.stats.observed += 1;

    if (!current) {
      const lifecycle = baselineAllowed ? ContentLifecycle.BASELINE : ContentLifecycle.QUARANTINED;
      const record = {
        schemaVersion: CONTENT_DRIFT_SCHEMA_VERSION,
        key,
        category: String(category),
        id: String(id),
        lifecycle,
        fingerprint: fp.hash,
        baselineFingerprint: fp.hash,
        previousFingerprint: null,
        bytes: fp.bytes,
        samples: 1,
        changeCount: 0,
        firstSeenAt: now,
        lastSeenAt: now,
        lastChangedAt: null,
        source: options.source || 'catalog'
      };
      this.records.set(key, record);
      if (baselineAllowed) this.stats.baselineRecords += 1;
      else {
        this.stats.novelty += 1;
        this._event('CONTENT_NOVELTY_DETECTED', 'warn', 'NEW_CONTENT_AFTER_BASELINE', { category, id: String(id), fingerprint: fp.hash, source: record.source });
      }
      this._prune();
      return { kind: baselineAllowed ? 'BASELINE' : 'NOVELTY', record: clone(record) };
    }

    current.samples += 1;
    current.lastSeenAt = now;
    current.source = options.source || current.source;
    current.bytes = fp.bytes;
    if (current.fingerprint !== fp.hash) {
      current.previousFingerprint = current.fingerprint;
      current.fingerprint = fp.hash;
      current.changeCount += 1;
      current.lastChangedAt = now;
      current.lifecycle = ContentLifecycle.QUARANTINED;
      this.stats.drift += 1;
      this._event('CONTENT_DRIFT_DETECTED', 'warn', 'FINGERPRINT_CHANGED', {
        category,
        id: String(id),
        previousFingerprint: current.previousFingerprint,
        fingerprint: current.fingerprint,
        changeCount: current.changeCount,
        source: current.source
      });
      return { kind: 'DRIFT', record: clone(current) };
    }

    if (current.lifecycle === ContentLifecycle.BASELINE && current.samples >= this.minObservedSamples) current.lifecycle = ContentLifecycle.OBSERVED;
    return { kind: 'UNCHANGED', record: clone(current) };
  }

  _entries(gameData, category) {
    const source = gameData && gameData[category];
    if (!source) return [];
    if (Array.isArray(source)) return source.map((value, index) => [String(index), value]);
    if (typeof source !== 'object') return [];
    return Object.keys(source).sort().map((key) => [key, source[key]]);
  }

  _priority(snapshot, gameData, changes) {
    if (!snapshot || !snapshot.character) return;
    const map = snapshot.character.map;
    if (map && gameData && gameData.maps && gameData.maps[map]) {
      const state = this._catalogState('maps');
      const row = this._observe('maps', map, gameData.maps[map], { baselineAllowed: !state.baselineComplete, source: 'current-map' });
      if (row && (row.kind === 'DRIFT' || row.kind === 'NOVELTY')) changes.push(row);
    }
    const monsters = new Set();
    for (const entity of snapshot.entities || []) if (entity && entity.mtype) monsters.add(entity.mtype);
    for (const mtype of [...monsters].sort().slice(0, 32)) {
      const value = gameData && gameData.monsters && gameData.monsters[mtype];
      if (!value) continue;
      const state = this._catalogState('monsters');
      const row = this._observe('monsters', mtype, value, { baselineAllowed: !state.baselineComplete, source: 'visible-monster' });
      if (row && (row.kind === 'DRIFT' || row.kind === 'NOVELTY')) changes.push(row);
    }
  }

  _scanCategory(gameData, category, budget, changes) {
    const entries = this._entries(gameData, category);
    const state = this._catalogState(category);
    if (!entries.length) {
      state.cursor = 0;
      state.baselineComplete = true;
      state.cycles = Math.max(1, state.cycles);
      return 0;
    }
    if (state.cursor >= entries.length) state.cursor = 0;
    let used = 0;
    while (used < budget && entries.length) {
      const [id, value] = entries[state.cursor];
      const row = this._observe(category, id, value, { baselineAllowed: !state.baselineComplete, source: `catalog:${category}` });
      if (row && (row.kind === 'DRIFT' || row.kind === 'NOVELTY')) changes.push(row);
      used += 1;
      state.cursor += 1;
      if (state.cursor >= entries.length) {
        state.cursor = 0;
        state.baselineComplete = true;
        state.cycles += 1;
        break;
      }
    }
    return used;
  }

  scan(snapshot, gameData = {}) {
    const now = this.now();
    const changes = [];
    this._priority(snapshot, gameData, changes);
    let remaining = this.scanBudget;
    for (const category of this.categories) {
      if (remaining <= 0) break;
      const categoriesLeft = Math.max(1, this.categories.length - this.categories.indexOf(category));
      const budget = Math.max(1, Math.floor(remaining / categoriesLeft));
      remaining -= this._scanCategory(gameData, category, budget, changes);
    }
    this.stats.scans += 1;
    this.lastScanAt = now;
    this.lastScan = {
      at: now,
      map: snapshot && snapshot.character && snapshot.character.map || null,
      changes: changes.map((row) => ({ kind: row.kind, category: row.record.category, id: row.record.id, lifecycle: row.record.lifecycle, fingerprint: row.record.fingerprint })),
      baselineComplete: Object.fromEntries(this.categories.map((category) => [category, this._catalogState(category).baselineComplete]))
    };
    if (changes.length) this._event('CONTENT_SCAN_COMPLETED', 'warn', 'CONTENT_CHANGE_DETECTED', { changes: this.lastScan.changes });
    this.save({ force: changes.length > 0 });
    return clone(this.lastScan);
  }

  markRevalidated(category, id) {
    const record = this.records.get(recordKey(category, id));
    if (!record) return false;
    record.lifecycle = ContentLifecycle.OBSERVED;
    record.baselineFingerprint = record.fingerprint;
    record.previousFingerprint = null;
    record.lastSeenAt = this.now();
    this.stats.revalidated += 1;
    this._event('CONTENT_REVALIDATED', 'info', null, { category: record.category, id: record.id, fingerprint: record.fingerprint });
    this.save({ force: true });
    return true;
  }

  requiresRevalidation(category, id) {
    const record = this.records.get(recordKey(category, id));
    return !!record && record.lifecycle === ContentLifecycle.QUARANTINED;
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== CONTENT_DRIFT_SCHEMA_VERSION || !Array.isArray(data.records)) throw new Error('unsupported content drift schema');
      this.records = new Map(data.records.filter((row) => Array.isArray(row) && row.length === 2));
      if (data.catalog && typeof data.catalog === 'object') {
        for (const [category, state] of Object.entries(data.catalog)) {
          if (!this.categories.includes(category)) continue;
          this.catalog.set(category, {
            cursor: Math.max(0, Math.floor(finite(state.cursor, 0))),
            baselineComplete: state.baselineComplete === true,
            cycles: Math.max(0, Math.floor(finite(state.cycles, 0)))
          });
        }
      }
      this._prune();
      this._event('CONTENT_DRIFT_RESTORED', 'info', null, { records: this.records.size });
      return true;
    } catch (error) {
      this.records.clear();
      this.catalog = new Map(this.categories.map((category) => [category, { cursor: 0, baselineComplete: false, cycles: 0 }]));
      this.stats.loadErrors += 1;
      this._event('CONTENT_DRIFT_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', { message: String(error && error.message || error) });
      return false;
    }
  }

  serialize() {
    return JSON.stringify({
      schemaVersion: CONTENT_DRIFT_SCHEMA_VERSION,
      savedAt: this.now(),
      records: [...this.records.entries()],
      catalog: Object.fromEntries(this.catalog.entries())
    });
  }

  save(options = {}) {
    const backend = this._backend();
    if (!backend) return false;
    const now = this.now();
    if (options.force !== true && now - this.lastSavedAt < this.minSaveMs) return false;
    try {
      backend.set(this.key, this.serialize());
      this.lastSavedAt = now;
      return true;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('CONTENT_DRIFT_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', { message: String(error && error.message || error) });
      return false;
    }
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.capacity, Math.floor(finite(limit, 100))));
    return [...this.records.values()]
      .sort((a, b) => finite(b.lastChangedAt || b.lastSeenAt) - finite(a.lastChangedAt || a.lastSeenAt))
      .slice(0, n)
      .map(clone);
  }

  status() {
    const counts = { BASELINE: 0, OBSERVED: 0, QUARANTINED: 0 };
    for (const record of this.records.values()) counts[record.lifecycle] = (counts[record.lifecycle] || 0) + 1;
    return {
      schemaVersion: CONTENT_DRIFT_SCHEMA_VERSION,
      mode: 'observation-first',
      actionAuthority: false,
      directGameplayActionAccess: false,
      records: this.records.size,
      capacity: this.capacity,
      scanBudget: this.scanBudget,
      counts,
      baseline: Object.fromEntries(this.categories.map((category) => {
        const state = this._catalogState(category);
        return [category, { baselineComplete: state.baselineComplete, cursor: state.cursor, cycles: state.cycles }];
      })),
      lastScanAt: this.lastScanAt,
      lastScan: clone(this.lastScan),
      persistence: { available: !!this._backend(), lastSavedAt: this.lastSavedAt || null, key: this.key },
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  ContentDriftMonitor,
  ContentLifecycle,
  CONTENT_DRIFT_SCHEMA_VERSION,
  stableStringify,
  fingerprint
};
