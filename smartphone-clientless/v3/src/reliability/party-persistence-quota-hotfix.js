'use strict';

const { isQuotaError } = require('../world/persistence');

const PARTY_PERSISTENCE_QUOTA_MODE = 'party-persistence-quota-isolation-v1';
const PARTY_PERFORMANCE_SCHEMA_VERSION = 1;

class PartyPersistenceQuotaHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.storageHighWatermarkChars = Math.max(500000, Number(options.storageHighWatermarkChars) || 4000000);
    this.storageRecoveryThresholdChars = Math.max(
      100000,
      Math.min(
        this.storageHighWatermarkChars,
        Number(options.storageRecoveryThresholdChars) || Math.floor(this.storageHighWatermarkChars * 0.9)
      )
    );
    this.storageRecoveryTargetChars = Math.max(
      100000,
      Math.min(
        this.storageRecoveryThresholdChars,
        Number(options.storageRecoveryTargetChars) || Math.floor(this.storageHighWatermarkChars * 0.85)
      )
    );
    this.performanceRetentionCeilingRecords = Math.max(
      64,
      Math.min(512, Number(options.performanceRetentionCeilingRecords) || 256)
    );
    this.performanceRetentionFloorRecords = Math.max(
      32,
      Math.min(
        this.performanceRetentionCeilingRecords,
        Number(options.performanceRetentionFloorRecords) || 64
      )
    );
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

  _performancePayload(value) {
    if (typeof value !== 'string') return null;
    try {
      const data = JSON.parse(value);
      if (!data || data.schemaVersion !== PARTY_PERFORMANCE_SCHEMA_VERSION || !Array.isArray(data.records)) return null;
      return { data, records: data.records };
    } catch (_) {
      return null;
    }
  }

  _compactPerformanceValue(value, limit) {
    const parsed = this._performancePayload(value);
    if (!parsed) return null;
    const boundedLimit = Math.max(1, Math.min(parsed.records.length, Math.floor(Number(limit) || 0)));
    if (parsed.records.length <= boundedLimit) return null;
    const ranked = parsed.records.map((record, index) => ({
      record,
      index,
      updatedAt: record && Number.isFinite(Number(record.updatedAt)) ? Number(record.updatedAt) : 0
    })).sort((a, b) => b.updatedAt - a.updatedAt || b.index - a.index);
    const kept = ranked.slice(0, boundedLimit).sort((a, b) => a.index - b.index).map((row) => row.record);
    const compacted = JSON.stringify({ ...parsed.data, records: kept });
    if (compacted.length >= value.length) return null;
    return {
      value: compacted,
      recordsBefore: parsed.records.length,
      recordsAfter: kept.length,
      charsBefore: value.length,
      charsAfter: compacted.length,
      charsRecovered: value.length - compacted.length
    };
  }

  _pressureCompaction(state, key, value) {
    if (state.name !== 'partyPerformance') return null;
    const projected = this._projectedChars(state.backend, key, value);
    if (projected == null && !state.forcePerformanceCompaction) return null;
    if (projected != null && projected < this.storageRecoveryThresholdChars && !state.forcePerformanceCompaction) return null;

    if (state.forcePerformanceCompaction) {
      const forced = this._compactPerformanceValue(value, this.performanceRetentionFloorRecords);
      if (!forced) return null;
      return { ...forced, projectedChars: this._projectedChars(state.backend, key, forced.value) };
    }

    // PartyPerformance is decayed historical planner evidence. Under storage pressure,
    // retaining the newest evidence is intentionally preferred over touching lifecycle,
    // content-drift, quarantine, or any in-memory safety state.
    const parsed = this._performancePayload(value);
    if (!parsed || parsed.records.length <= this.performanceRetentionFloorRecords) return null;
    const limits = [];
    let limit = Math.min(parsed.records.length - 1, this.performanceRetentionCeilingRecords);
    while (limit > this.performanceRetentionFloorRecords) {
      limits.push(limit);
      const next = Math.max(this.performanceRetentionFloorRecords, Math.floor(limit * 0.75));
      if (next === limit) break;
      limit = next;
    }
    limits.push(this.performanceRetentionFloorRecords);

    let best = null;
    for (const candidateLimit of [...new Set(limits)]) {
      const candidate = this._compactPerformanceValue(value, candidateLimit);
      if (!candidate) continue;
      const candidateProjected = this._projectedChars(state.backend, key, candidate.value);
      const row = { ...candidate, projectedChars: candidateProjected };
      best = row;
      if (candidateProjected != null && candidateProjected <= this.storageRecoveryTargetChars) return row;
    }
    return best;
  }

  _recordCompaction(state, compaction, trigger) {
    if (!compaction) return;
    state.historyCompactions += 1;
    state.historyRecordsDropped += Math.max(0, compaction.recordsBefore - compaction.recordsAfter);
    state.historyCharsRecovered += Math.max(0, compaction.charsRecovered);
    if (trigger === 'startup') state.startupCompactions += 1;
    if (trigger === 'quota-retry') state.quotaRecoveries += 1;
    this._event('PARTY_PERFORMANCE_HISTORY_COMPACTED', 'info', 'NONCRITICAL_HISTORY_RETENTION', {
      trigger,
      store: state.name,
      key: state.key,
      recordsBefore: compaction.recordsBefore,
      recordsAfter: compaction.recordsAfter,
      charsRecovered: compaction.charsRecovered,
      projectedChars: compaction.projectedChars
    });
  }

  _recoverStoredPerformance(state, baseBackend) {
    if (!state || state.name !== 'partyPerformance' || !state.key) return false;
    let backend;
    let raw;
    try {
      backend = baseBackend();
      if (!backend || typeof backend.get !== 'function' || typeof backend.set !== 'function') return false;
      raw = backend.get(state.key);
    } catch (_) {
      return false;
    }
    if (typeof raw !== 'string') return false;
    const projected = this._projectedChars(state.backend, state.key, raw);
    if (projected == null || projected < this.storageRecoveryThresholdChars) return false;
    const compaction = this._pressureCompaction(state, state.key, raw);
    if (!compaction) return false;
    try {
      backend.set(state.key, compaction.value);
      this._recordCompaction(state, compaction, 'startup');
      return true;
    } catch (error) {
      state.historyCompactionFailures += 1;
      if (isQuotaError(error)) {
        state.quotaWriteFailures += 1;
        this._block(state, 'PERSISTENCE_QUOTA_EXCEEDED', error);
      }
      return false;
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
      bypassedSaves: 0,
      historyCompactions: 0,
      historyCompactionFailures: 0,
      historyRecordsDropped: 0,
      historyCharsRecovered: 0,
      startupCompactions: 0,
      quotaRecoveries: 0,
      forcePerformanceCompaction: false
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

          const pressureCompaction = this._pressureCompaction(state, key, value);
          let candidateValue = pressureCompaction ? pressureCompaction.value : value;
          let projected = this._projectedChars(state.backend, key, candidateValue);
          if (projected != null && projected >= this.storageHighWatermarkChars) {
            const floorCompaction = state.name === 'partyPerformance'
              ? this._compactPerformanceValue(value, this.performanceRetentionFloorRecords)
              : null;
            if (floorCompaction && floorCompaction.value !== candidateValue) {
              candidateValue = floorCompaction.value;
              projected = this._projectedChars(state.backend, key, candidateValue);
            }
          }

          if (projected != null && projected >= this.storageHighWatermarkChars) {
            state.preflightBlocks += 1;
            this._block(state, 'PERSISTENCE_QUOTA_PRESSURE');
            const error = new Error(`PARTY_PERSISTENCE_QUOTA_PRESSURE:${name}`);
            error.code = 'PARTY_PERSISTENCE_QUOTA_BLOCKED';
            throw error;
          }

          let successfulCompaction = null;
          if (candidateValue !== value) {
            successfulCompaction = this._compactPerformanceValue(
              value,
              (this._performancePayload(candidateValue) || { records: [] }).records.length
            ) || pressureCompaction;
            if (successfulCompaction) {
              successfulCompaction.projectedChars = projected;
            }
          }

          try {
            const result = backend.set(key, candidateValue);
            if (successfulCompaction) this._recordCompaction(state, successfulCompaction, 'preflight');
            return result;
          } catch (error) {
            if (!isQuotaError(error)) throw error;
            state.quotaWriteFailures += 1;

            const retryCompaction = state.name === 'partyPerformance'
              ? this._compactPerformanceValue(value, this.performanceRetentionFloorRecords)
              : null;
            if (retryCompaction && retryCompaction.value !== candidateValue) {
              try {
                const result = backend.set(key, retryCompaction.value);
                state.forcePerformanceCompaction = true;
                retryCompaction.projectedChars = this._projectedChars(state.backend, key, retryCompaction.value);
                this._recordCompaction(state, retryCompaction, 'quota-retry');
                return result;
              } catch (retryError) {
                if (isQuotaError(retryError)) state.quotaWriteFailures += 1;
                state.historyCompactionFailures += 1;
                this._block(state, isQuotaError(retryError) ? 'PERSISTENCE_QUOTA_EXCEEDED' : 'PERSISTENCE_WRITE_ERROR', retryError);
                throw retryError;
              }
            }

            this._block(state, 'PERSISTENCE_QUOTA_EXCEEDED', error);
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
    this._recoverStoredPerformance(state, baseBackend);
    return true;
  }

  _install() {
    const performance = this._wrapStore('partyPerformance', this.runtime.partyPerformance);
    const lifecycle = this._wrapStore('partyLifecycle', this.runtime.partyLifecycle);
    this.installed = performance || lifecycle;
    this._event('PARTY_PERSISTENCE_QUOTA_HOTFIX_INSTALLED', 'info', null, {
      performance,
      lifecycle,
      storageHighWatermarkChars: this.storageHighWatermarkChars,
      storageRecoveryThresholdChars: this.storageRecoveryThresholdChars,
      storageRecoveryTargetChars: this.storageRecoveryTargetChars,
      performanceRetentionCeilingRecords: this.performanceRetentionCeilingRecords,
      performanceRetentionFloorRecords: this.performanceRetentionFloorRecords
    });
  }

  status() {
    return {
      schemaVersion: 1,
      mode: PARTY_PERSISTENCE_QUOTA_MODE,
      installed: this.installed,
      storageHighWatermarkChars: this.storageHighWatermarkChars,
      storageRecoveryThresholdChars: this.storageRecoveryThresholdChars,
      storageRecoveryTargetChars: this.storageRecoveryTargetChars,
      retention: {
        partyPerformanceOnly: true,
        policy: 'recent-noncritical-history-under-storage-pressure',
        ceilingRecords: this.performanceRetentionCeilingRecords,
        floorRecords: this.performanceRetentionFloorRecords,
        mutatesInMemoryState: false,
        touchesContentDrift: false,
        touchesPartyLifecycle: false
      },
      stores: Object.fromEntries([...this.states.entries()].map(([name, state]) => [name, { ...state }]))
    };
  }
}

function installPartyPersistenceQuotaHotfix(runtime, options = {}) {
  return new PartyPersistenceQuotaHotfix(runtime, options);
}

module.exports = { PartyPersistenceQuotaHotfix, installPartyPersistenceQuotaHotfix, PARTY_PERSISTENCE_QUOTA_MODE };
