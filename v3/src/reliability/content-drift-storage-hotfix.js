'use strict';

class ContentDriftStorageHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.contentDrift) throw new Error('runtime contentDrift required');
    this.runtime = runtime;
    this.monitor = runtime.contentDrift;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.maxRecordsAfterQuota = Math.max(128, Math.min(1024, Number(options.maxRecordsAfterQuota) || 384));
    this.retryBaseMs = Math.max(5000, Number(options.retryBaseMs) || 10000);
    this.retryMaxMs = Math.max(this.retryBaseMs, Number(options.retryMaxMs) || 300000);
    this.failureStreak = 0;
    this.backoffUntil = 0;
    this.compacted = false;
    this.originalCapacity = Number(this.monitor.capacity) || null;
    this.originalSave = this.monitor.save.bind(this.monitor);
    this.stats = { quotaFailures: 0, compactions: 0, retrySuccesses: 0, backoffSkips: 0 };
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'content-drift-storage-hotfix', event, severity, reason, data });
  }

  _compact() {
    const monitor = this.monitor;
    if (!(monitor.records instanceof Map)) return false;
    const quarantined = [...monitor.records.values()].filter((row) => row && row.lifecycle === 'QUARANTINED').length;
    const target = Math.max(this.maxRecordsAfterQuota, quarantined);
    const previousCapacity = Number(monitor.capacity) || monitor.records.size;
    monitor.capacity = Math.min(previousCapacity, target);
    const before = monitor.records.size;
    if (typeof monitor._prune === 'function') monitor._prune();
    const after = monitor.records.size;
    this.compacted = true;
    this.stats.compactions += 1;
    this._event('CONTENT_DRIFT_STORAGE_COMPACTED', 'warn', 'STORAGE_QUOTA_RECOVERY', {
      before,
      after,
      previousCapacity,
      capacity: monitor.capacity,
      quarantinedPreserved: quarantined
    });
    return after < before || monitor.capacity < previousCapacity;
  }

  _armBackoff() {
    this.failureStreak += 1;
    const delay = Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, Math.max(0, this.failureStreak - 1)));
    this.backoffUntil = this.now() + delay;
    this._event('CONTENT_DRIFT_STORAGE_BACKOFF_ARMED', 'warn', 'PERSISTENCE_WRITE_ERROR', {
      failureStreak: this.failureStreak,
      delayMs: delay
    });
  }

  _clearFailure() {
    this.failureStreak = 0;
    this.backoffUntil = 0;
  }

  _install() {
    const monitor = this.monitor;
    if (monitor.__aioQuotaHotfixInstalled) return;
    monitor.__aioQuotaHotfixInstalled = true;
    monitor.save = (options = {}) => {
      const now = this.now();
      if (now < this.backoffUntil && options.overrideBackoff !== true) {
        this.stats.backoffSkips += 1;
        return false;
      }

      const beforeErrors = Number(monitor.stats && monitor.stats.saveErrors) || 0;
      const first = this.originalSave(options);
      const afterErrors = Number(monitor.stats && monitor.stats.saveErrors) || 0;
      if (afterErrors <= beforeErrors) {
        if (first === true) this._clearFailure();
        return first;
      }

      this.stats.quotaFailures += 1;
      const compacted = this._compact();
      if (compacted) {
        const retryErrors = Number(monitor.stats && monitor.stats.saveErrors) || 0;
        const retry = this.originalSave({ ...options, force: true });
        const retryErrorsAfter = Number(monitor.stats && monitor.stats.saveErrors) || 0;
        if (retry === true && retryErrorsAfter === retryErrors) {
          this.stats.retrySuccesses += 1;
          this._clearFailure();
          this._event('CONTENT_DRIFT_STORAGE_RECOVERED', 'info', 'COMPACT_RETRY_SUCCEEDED', {
            records: monitor.records instanceof Map ? monitor.records.size : null,
            capacity: monitor.capacity
          });
          return true;
        }
      }

      this._armBackoff();
      return false;
    };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'content-drift-quota-recovery-v1',
      originalCapacity: this.originalCapacity,
      currentCapacity: Number(this.monitor.capacity) || null,
      maxRecordsAfterQuota: this.maxRecordsAfterQuota,
      compacted: this.compacted,
      failureStreak: this.failureStreak,
      backoffUntil: this.backoffUntil || null,
      backoffRemainingMs: Math.max(0, this.backoffUntil - this.now()),
      stats: { ...this.stats }
    };
  }
}

function installContentDriftStorageHotfix(runtime, options = {}) {
  return new ContentDriftStorageHotfix(runtime, options);
}

module.exports = { ContentDriftStorageHotfix, installContentDriftStorageHotfix };
