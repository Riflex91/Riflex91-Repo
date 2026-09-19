'use strict';

const AOE_FARMING_CERTIFICATION_MODE = 'aoe-farming-certification-v1';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value, fallback = null) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}
function clamp(value, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, finite(value, lo))); }

class AoeFarmingCertification {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = options.now || runtime.now || (() => Date.now());
    this.log = options.log || runtime.log || null;
    this.config = {
      soakWindowMs: Math.max(60 * 1000, Math.min(60 * 60 * 1000, finite(options.soakWindowMs, 10 * 60 * 1000))),
      minSoakEncounters: Math.max(4, Math.min(200, Math.floor(finite(options.minSoakEncounters, 12)))),
      minDistinctPullSizes: Math.max(1, Math.min(6, Math.floor(finite(options.minDistinctPullSizes, 2)))),
      minSafetyMargin: clamp(options.minSafetyMargin == null ? 0.45 : options.minSafetyMargin),
      maxNearDeathRate: clamp(options.maxNearDeathRate == null ? 0.10 : options.maxNearDeathRate),
      maxRetreatRate: clamp(options.maxRetreatRate == null ? 0.15 : options.maxRetreatRate)
    };
    this.startedAt = this.now();
    this.rows = [];
    this.lastOutcome = null;
    this.lastFailure = null;
    this.stats = {
      outcomesSeen: 0,
      aoeOutcomes: 0,
      liveSmokePasses: 0,
      liveSmokeFailures: 0,
      soakPasses: 0,
      soakResets: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'aoe-farming-certification', event, severity, reason, data }); } catch (_) {}
  }

  _isAoe(row) {
    return !!(row && finite(row.maxEngaged, 0) >= 2 && finite(row.aoeSkillExecutions, 0) >= 1);
  }

  _liveSmoke(row) {
    if (!this._isAoe(row)) return { eligible: false, pass: false, reason: 'AOE_EVIDENCE_REQUIRED' };
    const active = String(this.runtime && this.runtime.adapter && this.runtime.adapter.mode || '') === 'active';
    if (!active) return { eligible: false, pass: false, reason: 'ACTIVE_RUNTIME_REQUIRED' };
    if (row.learningEligible !== true) return { eligible: true, pass: false, reason: 'OUTCOME_NOT_LEARNING_ELIGIBLE' };
    if (String(row.outcome) !== 'SUCCESS') return { eligible: true, pass: false, reason: 'OUTCOME_' + String(row.outcome || 'UNKNOWN') };
    if (finite(row.deaths, 0) > 0) return { eligible: true, pass: false, reason: 'DEATH_OBSERVED' };
    if (finite(row.retreats, 0) > 0) return { eligible: true, pass: false, reason: 'RETREAT_OBSERVED' };
    if (finite(row.safetyMargin, 0) < this.config.minSafetyMargin) return { eligible: true, pass: false, reason: 'SAFETY_MARGIN_BELOW_FLOOR' };
    return { eligible: true, pass: true, reason: 'CONTROLLED_LIVE_AOE_ENCOUNTER_PASSED' };
  }

  _trim(now) {
    const floor = now - this.config.soakWindowMs;
    this.rows = this.rows.filter((row) => finite(row.endedAt, 0) >= floor);
  }

  _soak() {
    // Certification is a safety gate, not a learning filter. CONTENT_DRIFT and
    // INTERRUPTED are intentionally not learning-eligible, but they must still
    // invalidate a live soak while they remain inside the observation window.
    const rows = this.rows.filter((row) => this._isAoe(row));
    const count = rows.length;
    const deaths = rows.reduce((sum, row) => sum + Math.max(0, finite(row.deaths, 0)), 0);
    const nearDeaths = rows.reduce((sum, row) => sum + Math.max(0, finite(row.nearDeaths, 0)), 0);
    const retreats = rows.reduce((sum, row) => sum + Math.max(0, finite(row.retreats, 0)), 0);
    const partyFailures = rows.filter((row) => String(row.outcome) === 'PARTY_FAILURE').length;
    const contentDrift = rows.filter((row) => String(row.outcome) === 'CONTENT_DRIFT').length;
    const interrupted = rows.filter((row) => String(row.outcome) === 'INTERRUPTED').length;
    const safety = rows.length ? rows.reduce((sum, row) => sum + clamp(row.safetyMargin), 0) / rows.length : 0;
    const pullSizes = [...new Set(rows.map((row) => Math.max(1, Math.floor(finite(row.maxEngaged, 1)))))].sort((a, b) => a - b);
    const nearDeathRate = count ? nearDeaths / count : 0;
    const retreatRate = count ? retreats / count : 0;
    const enoughDuration = !!(rows.length && (finite(rows[rows.length - 1].endedAt, 0) - finite(rows[0].endedAt, 0) >= this.config.soakWindowMs * 0.80));
    const pass = count >= this.config.minSoakEncounters
      && pullSizes.length >= this.config.minDistinctPullSizes
      && enoughDuration
      && deaths === 0
      && partyFailures === 0
      && contentDrift === 0
      && interrupted === 0
      && safety >= this.config.minSafetyMargin
      && nearDeathRate <= this.config.maxNearDeathRate
      && retreatRate <= this.config.maxRetreatRate;
    let reason = 'SOAK_INCOMPLETE';
    if (pass) reason = 'AOE_SOAK_PASSED';
    else if (deaths > 0) reason = 'SOAK_DEATH_OBSERVED';
    else if (partyFailures > 0) reason = 'SOAK_PARTY_FAILURE';
    else if (contentDrift > 0) reason = 'SOAK_CONTENT_DRIFT';
    else if (interrupted > 0) reason = 'SOAK_INTERRUPTED';
    else if (nearDeathRate > this.config.maxNearDeathRate) reason = 'SOAK_NEAR_DEATH_RATE_HIGH';
    else if (retreatRate > this.config.maxRetreatRate) reason = 'SOAK_RETREAT_RATE_HIGH';
    else if (safety < this.config.minSafetyMargin) reason = 'SOAK_SAFETY_MARGIN_LOW';
    else if (pullSizes.length < this.config.minDistinctPullSizes) reason = 'SOAK_PULL_VARIETY_INCOMPLETE';
    else if (count < this.config.minSoakEncounters) reason = 'SOAK_SAMPLE_COUNT_INCOMPLETE';
    else if (!enoughDuration) reason = 'SOAK_DURATION_INCOMPLETE';
    return {
      pass, reason, count, deaths, nearDeaths, retreats, partyFailures, contentDrift, interrupted,
      nearDeathRate: Number(nearDeathRate.toFixed(4)),
      retreatRate: Number(retreatRate.toFixed(4)),
      averageSafetyMargin: Number(safety.toFixed(4)),
      pullSizes,
      enoughDuration
    };
  }

  recordOutcome(outcome) {
    if (!outcome || !outcome.encounterId) return null;
    const now = this.now();
    this.stats.outcomesSeen += 1;
    if (!this._isAoe(outcome)) return { accepted: false, reason: 'NON_AOE_ENCOUNTER' };
    this.stats.aoeOutcomes += 1;
    const row = clone(outcome);
    this.lastOutcome = row;
    this.rows.push(row);
    this._trim(now);

    const smoke = this._liveSmoke(row);
    if (smoke.eligible) {
      if (smoke.pass) {
        this.stats.liveSmokePasses += 1;
        this._event('AOE_LIVE_SMOKE_PASS', 'info', smoke.reason, {
          encounterId: row.encounterId,
          maxEngaged: row.maxEngaged,
          safetyMargin: row.safetyMargin,
          aoeSkillExecutions: row.aoeSkillExecutions
        });
      } else {
        this.stats.liveSmokeFailures += 1;
        this.lastFailure = { at: now, stage: 'LIVE_SMOKE', reason: smoke.reason, encounterId: row.encounterId };
        this._event('AOE_LIVE_SMOKE_FAIL', 'warn', smoke.reason, clone(this.lastFailure));
      }
    }

    const soak = this._soak();
    if (soak.pass) {
      this.stats.soakPasses += 1;
      this._event('AOE_SOAK_PASS', 'info', soak.reason, soak);
    } else if (['SOAK_DEATH_OBSERVED', 'SOAK_PARTY_FAILURE', 'SOAK_CONTENT_DRIFT'].includes(soak.reason)) {
      this.stats.soakResets += 1;
      this.lastFailure = { at: now, stage: 'SOAK', reason: soak.reason, encounterId: row.encounterId };
    }
    return { accepted: true, smoke, soak };
  }

  status() {
    const soak = this._soak();
    return {
      schemaVersion: 1,
      mode: AOE_FARMING_CERTIFICATION_MODE,
      observationOnly: true,
      gameplayAuthority: false,
      startedAt: this.startedAt,
      config: { ...this.config },
      liveSmoke: {
        pass: this.stats.liveSmokePasses > 0,
        passes: this.stats.liveSmokePasses,
        failures: this.stats.liveSmokeFailures
      },
      soak,
      lastOutcome: clone(this.lastOutcome),
      lastFailure: clone(this.lastFailure),
      stats: { ...this.stats }
    };
  }
}

function installAoeFarmingCertification(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.aoeFarmingCertification) return runtime.aoeFarmingCertification;
  runtime.aoeFarmingCertification = new AoeFarmingCertification(runtime, options);
  return runtime.aoeFarmingCertification;
}

module.exports = { AoeFarmingCertification, installAoeFarmingCertification, AOE_FARMING_CERTIFICATION_MODE };
