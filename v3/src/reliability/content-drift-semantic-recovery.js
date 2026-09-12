'use strict';

const { EvidenceKind } = require('../world/world-model');
const {
  ContentDisposition,
  BUILT_IN_DANGEROUS_MONSTERS
} = require('../farmer/content-safety');

const DANGEROUS = new Set(BUILT_IN_DANGEROUS_MONSTERS.map((value) => String(value).toLowerCase()));
const NON_FARM_MONSTERS = new Set(['target']);
const NEVER_AUTO_RECOVER = new Set([...DANGEROUS, ...NON_FARM_MONSTERS]);

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function boundedMessage(error) {
  return String(error && error.message || error || 'unknown').slice(0, 240);
}

class ContentDriftSemanticRecovery {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.world || !runtime.contentDrift || !runtime.combatRisk) {
      throw new Error('runtime world, contentDrift and combatRisk required');
    }
    this.runtime = runtime;
    this.world = runtime.world;
    this.monitor = runtime.contentDrift;
    this.contentSafety = runtime.combatRisk.contentSafety;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.minHistoricalLeadMs = Math.max(1000, Number(options.minHistoricalLeadMs) || 15000);
    this.maxAutoQuarantineLagMs = Math.max(1000, Number(options.maxAutoQuarantineLagMs) || 30000);
    this.intervalMs = Math.max(1000, Number(options.intervalMs) || 5000);
    this.lastRunAt = -Infinity;
    this.lastResult = null;
    this.stats = {
      runs: 0,
      inspected: 0,
      recovered: 0,
      skippedDangerous: 0,
      skippedNonFarm: 0,
      skippedRealDrift: 0,
      skippedNoHistoricalEvidence: 0,
      skippedPolicyMismatch: 0,
      recordErrors: 0,
      telemetryErrors: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return false;
    try {
      this.log.emit({ component: 'content-drift-semantic-recovery', event, severity, reason, data });
      return true;
    } catch (_) {
      // Observability must never become action authority. Recovery remains
      // fail-closed even when the diagnostic sink itself is unhealthy.
      this.stats.telemetryErrors += 1;
      return false;
    }
  }

  _fact(id, name) {
    const fact = this.world.fact('monster-policy', id, name);
    return fact && fact.value != null ? fact.value : null;
  }

  _recoverPolicy(id, at) {
    this.world.observeEntity('monster-policy', id, {
      contentSafetyDisposition: ContentDisposition.LEGACY_ALLOWED,
      contentSafetyReason: 'RECOVERED_PRUNED_BASELINE',
      contentSafetyUpdatedAt: at
    }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
  }

  _eligible(record) {
    if (!record || record.category !== 'monsters' || record.lifecycle !== 'QUARANTINED') return null;
    this.stats.inspected += 1;
    const id = String(record.id || '');
    if (!id) return null;
    const normalizedId = id.toLowerCase();
    if (DANGEROUS.has(normalizedId)) {
      this.stats.skippedDangerous += 1;
      return null;
    }
    if (NON_FARM_MONSTERS.has(normalizedId)) {
      this.stats.skippedNonFarm += 1;
      return null;
    }

    // A genuine definition change must never be auto-recovered. The corruption
    // observed live was a missing baseline record being re-created as NOVELTY:
    // no previous fingerprint and changeCount === 0.
    if (record.previousFingerprint || Number(record.changeCount) > 0) {
      this.stats.skippedRealDrift += 1;
      return null;
    }

    const monster = typeof this.world.entity === 'function' ? this.world.entity('monster', id) : null;
    const monsterFirstSeen = finite(monster && monster.firstSeenAt);
    const noveltyFirstSeen = finite(record.firstSeenAt);
    if (monsterFirstSeen == null || noveltyFirstSeen == null
      || noveltyFirstSeen - monsterFirstSeen < this.minHistoricalLeadMs) {
      this.stats.skippedNoHistoricalEvidence += 1;
      return null;
    }

    const disposition = this._fact(id, 'contentSafetyDisposition');
    const reason = this._fact(id, 'contentSafetyReason');
    const policyUpdatedAt = finite(this._fact(id, 'contentSafetyUpdatedAt'));
    if (disposition !== ContentDisposition.QUARANTINED
      || reason !== 'OPERATOR_QUARANTINED'
      || policyUpdatedAt == null
      || Math.abs(policyUpdatedAt - noveltyFirstSeen) > this.maxAutoQuarantineLagMs) {
      this.stats.skippedPolicyMismatch += 1;
      return null;
    }

    // Cache all evidence needed by the mutation and telemetry paths. The World
    // Model can legitimately change between observations; never dereference the
    // entity a second time after eligibility was established.
    return {
      id,
      historicalFirstSeenAt: monsterFirstSeen,
      falseNoveltyFirstSeenAt: noveltyFirstSeen
    };
  }

  _recoverRecord(record, at) {
    const evidence = this._eligible(record);
    if (!evidence) return null;
    const id = evidence.id;
    this._recoverPolicy(id, at);
    record.lifecycle = 'OBSERVED';
    record.baselineFingerprint = record.fingerprint;
    record.previousFingerprint = null;
    record.lastSeenAt = at;
    if (this.monitor.stats) this.monitor.stats.revalidated = (Number(this.monitor.stats.revalidated) || 0) + 1;
    this.stats.recovered += 1;
    this._event('CONTENT_FALSE_NOVELTY_RECOVERED', 'warn', 'PRUNED_BASELINE_FALSE_NOVELTY', {
      monster: id,
      historicalFirstSeenAt: evidence.historicalFirstSeenAt,
      falseNoveltyFirstSeenAt: evidence.falseNoveltyFirstSeenAt
    });
    return id;
  }

  beforeTick() {
    const at = this.now();
    if (at - this.lastRunAt < this.intervalMs) return this.lastResult;
    this.lastRunAt = at;
    this.stats.runs += 1;
    const recovered = [];
    const recordErrors = [];
    if (!(this.monitor.records instanceof Map)) {
      this.lastResult = { at, recovered, recoveredCount: 0, recordErrors, reason: 'CONTENT_DRIFT_RECORDS_UNAVAILABLE' };
      return this.lastResult;
    }

    // A corrupt/stale individual drift row must not abort runtime.start(). The
    // row stays untouched (fail closed), while independent valid rows can still
    // be reconciled during the same bounded pass.
    for (const record of this.monitor.records.values()) {
      try {
        const id = this._recoverRecord(record, at);
        if (id) recovered.push(id);
      } catch (error) {
        this.stats.recordErrors += 1;
        const id = (() => {
          try { return record && record.id != null ? String(record.id) : null; } catch (_) { return null; }
        })();
        const failure = { id, message: boundedMessage(error) };
        recordErrors.push(failure);
        this._event('CONTENT_FALSE_NOVELTY_RECOVERY_SKIPPED', 'warn', 'RECORD_RECOVERY_ERROR', failure);
      }
    }

    this.lastResult = {
      at,
      recovered,
      recoveredCount: recovered.length,
      recordErrors,
      policy: 'historical-world-evidence-plus-no-real-drift-plus-auto-quarantine-timing'
    };
    return this.lastResult;
  }

  status() {
    return {
      schemaVersion: 2,
      mode: 'content-drift-semantic-recovery-v2',
      minHistoricalLeadMs: this.minHistoricalLeadMs,
      maxAutoQuarantineLagMs: this.maxAutoQuarantineLagMs,
      dangerousNeverRecovered: [...DANGEROUS].sort(),
      nonFarmNeverRecovered: [...NON_FARM_MONSTERS].sort(),
      neverAutoRecovered: [...NEVER_AUTO_RECOVER].sort(),
      lastRunAt: Number.isFinite(this.lastRunAt) ? this.lastRunAt : null,
      lastResult: this.lastResult ? {
        ...this.lastResult,
        recovered: this.lastResult.recovered.slice(),
        recordErrors: (this.lastResult.recordErrors || []).map((row) => ({ ...row }))
      } : null,
      stats: { ...this.stats }
    };
  }
}

function installContentDriftSemanticRecovery(runtime, options = {}) {
  return new ContentDriftSemanticRecovery(runtime, options);
}

module.exports = {
  ContentDriftSemanticRecovery,
  NEVER_AUTO_RECOVER,
  NON_FARM_MONSTERS,
  installContentDriftSemanticRecovery
};
