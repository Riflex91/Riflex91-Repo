'use strict';

class ContentDriftStorageHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.contentDrift) throw new Error('runtime contentDrift required');
    this.runtime = runtime;
    this.monitor = runtime.contentDrift;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.originalCapacity = Number(this.monitor.capacity) || null;
    this.originalSave = this.monitor.save.bind(this.monitor);
    this.sessionWriteBlocked = false;
    this.blockedAt = 0;
    this.lastError = null;
    this.stats = {
      quotaFailures: 0,
      persistenceFailures: 0,
      blockedWrites: 0,
      semanticCompactionsPrevented: 0
    };
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'content-drift-storage-hotfix', event, severity, reason, data });
  }

  _blockWrites(error) {
    this.sessionWriteBlocked = true;
    this.blockedAt = this.now();
    this.lastError = String(error && error.message || error || 'PERSISTENCE_WRITE_ERROR').slice(0, 240);
    this.stats.persistenceFailures += 1;
    if (/quota|storage|setitem/i.test(this.lastError)) this.stats.quotaFailures += 1;
    this.stats.semanticCompactionsPrevented += 1;
    this._event('CONTENT_DRIFT_STORAGE_SESSION_BLOCKED', 'warn', 'PERSISTENCE_WRITE_ERROR', {
      message: this.lastError,
      recordsPreserved: this.monitor.records instanceof Map ? this.monitor.records.size : null,
      capacityPreserved: Number(this.monitor.capacity) || null,
      policy: 'never-delete-semantic-drift-records-for-storage-recovery'
    });
  }

  _install() {
    const monitor = this.monitor;
    if (monitor.__aioQuotaHotfixInstalled) return;
    monitor.__aioQuotaHotfixInstalled = true;
    monitor.save = (options = {}) => {
      if (this.sessionWriteBlocked) {
        this.stats.blockedWrites += 1;
        return false;
      }

      const beforeErrors = Number(monitor.stats && monitor.stats.saveErrors) || 0;
      const result = this.originalSave(options);
      const afterErrors = Number(monitor.stats && monitor.stats.saveErrors) || 0;
      if (afterErrors > beforeErrors) {
        // The previous implementation reduced monitor.capacity and pruned records
        // here. That changed safety semantics: pruned baseline entries were seen as
        // NOVELTY on the next scan and eventually quarantined the whole catalog.
        // Persistence loss must never mutate the in-memory safety knowledge.
        this._blockWrites('CONTENT_DRIFT_STORAGE_WRITE_FAILED');
        return false;
      }
      return result;
    };
  }

  status() {
    return {
      schemaVersion: 2,
      mode: 'content-drift-persistence-isolation-v2',
      originalCapacity: this.originalCapacity,
      currentCapacity: Number(this.monitor.capacity) || null,
      sessionWriteBlocked: this.sessionWriteBlocked,
      blockedAt: this.blockedAt || null,
      lastError: this.lastError,
      semanticRecordPruningAllowedForQuotaRecovery: false,
      stats: { ...this.stats }
    };
  }
}

function installContentDriftStorageHotfix(runtime, options = {}) {
  return new ContentDriftStorageHotfix(runtime, options);
}

module.exports = { ContentDriftStorageHotfix, installContentDriftStorageHotfix };
