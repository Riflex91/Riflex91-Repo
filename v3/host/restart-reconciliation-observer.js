'use strict';

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}

class RestartReconciliationObserver {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.botClient = options.botClient || null;
    this.state = 'IDLE';
    this.previousRunId = null;
    this.currentRunId = null;
    this.startedAt = null;
    this.lastObservedAt = null;
    this.lastEvidence = null;
    this.lastError = null;
    this.currentObservedAt = null;
    this.currentEvidence = null;
    this.currentError = null;
    this.currentClean = null;
    this.stats = { begun: 0, freshRuns: 0, observations: 0, clean: 0, blocked: 0, failures: 0, currentObservations: 0, currentClean: 0, currentBlocked: 0, currentFailures: 0 };
  }

  begin(previousRunId = null) {
    this.state = 'WAITING_FOR_FRESH_RUN';
    this.previousRunId = previousRunId == null ? null : String(previousRunId);
    this.currentRunId = null;
    this.startedAt = this.now();
    this.lastObservedAt = null;
    this.lastEvidence = null;
    this.lastError = null;
    this.currentObservedAt = null;
    this.currentEvidence = null;
    this.currentError = null;
    this.currentClean = null;
    this.stats.begun += 1;
    return this.status();
  }

  observeFreshRun(runId) {
    if (this.state !== 'WAITING_FOR_FRESH_RUN') return { accepted: false, reason: 'NOT_WAITING_FOR_FRESH_RUN' };
    const current = runId == null ? null : String(runId);
    if (!current) return { accepted: false, reason: 'RUN_ID_REQUIRED' };
    if (this.previousRunId != null && current === this.previousRunId) return { accepted: false, reason: 'RUN_ID_NOT_FRESH' };
    this.currentRunId = current;
    this.state = 'WAITING_FOR_RECONCILIATION_EVIDENCE';
    this.stats.freshRuns += 1;
    return { accepted: true, runId: current };
  }

  _validateEvidence(evidence) {
    if (!evidence || typeof evidence !== 'object') return 'RECONCILIATION_EVIDENCE_REQUIRED';
    if (evidence.actionAuthority !== false || evidence.rawGameplayActionAuthority !== false) return 'RECONCILIATION_AUTHORITY_INVALID';
    if (!Array.isArray(evidence.blockers)) return 'RECONCILIATION_BLOCKERS_REQUIRED';
    if (typeof evidence.observedClean !== 'boolean') return 'RECONCILIATION_CLEAN_FLAG_REQUIRED';
    if (evidence.observedClean && evidence.blockers.length) return 'RECONCILIATION_EVIDENCE_CONTRADICTORY';
    return null;
  }

  _recordCurrent(evidence) {
    this.currentObservedAt = this.now();
    this.currentEvidence = clone(evidence);
    this.currentError = null;
    this.currentClean = evidence.observedClean === true;
    this.stats.currentObservations += 1;
    if (this.currentClean) this.stats.currentClean += 1;
    else this.stats.currentBlocked += 1;
  }

  _recordCurrentError(error, fallbackCode = 'RECONCILIATION_READ_FAILED') {
    this.currentObservedAt = this.now();
    this.currentEvidence = null;
    this.currentClean = false;
    this.currentError = {
      at: this.currentObservedAt,
      code: bounded(error && error.code || fallbackCode, 128),
      message: bounded(error && error.message || error || fallbackCode, 256)
    };
    this.stats.currentFailures += 1;
  }

  async observeCurrent() {
    if (!this.botClient || typeof this.botClient.reconciliationStatus !== 'function') {
      this._recordCurrentError(new Error('RECONCILIATION_INTERFACE_UNAVAILABLE'), 'RECONCILIATION_INTERFACE_UNAVAILABLE');
      return { observed: false, reason: 'RECONCILIATION_INTERFACE_UNAVAILABLE', status: this.status() };
    }
    try {
      const evidence = await this.botClient.reconciliationStatus();
      const invalid = this._validateEvidence(evidence);
      if (invalid) throw Object.assign(new Error(invalid), { code: invalid });
      this._recordCurrent(evidence);
      return { observed: true, clean: evidence.observedClean, blockers: evidence.blockers.slice(0, 64), status: this.status() };
    } catch (error) {
      this._recordCurrentError(error);
      return { observed: false, reason: this.currentError.code, status: this.status() };
    }
  }

  async observe() {
    if (this.state !== 'WAITING_FOR_RECONCILIATION_EVIDENCE' && this.state !== 'BLOCKED') {
      return { observed: false, reason: 'RECONCILIATION_NOT_PENDING', status: this.status() };
    }
    if (!this.botClient || typeof this.botClient.reconciliationStatus !== 'function') {
      this.state = 'BLOCKED';
      this.lastError = { at: this.now(), code: 'RECONCILIATION_INTERFACE_UNAVAILABLE' };
      this.stats.failures += 1;
      return { observed: false, reason: 'RECONCILIATION_INTERFACE_UNAVAILABLE', status: this.status() };
    }
    try {
      const evidence = await this.botClient.reconciliationStatus();
      const invalid = this._validateEvidence(evidence);
      if (invalid) throw Object.assign(new Error(invalid), { code: invalid });
      this.lastObservedAt = this.now();
      this.lastEvidence = clone(evidence);
      this.lastError = null;
      this._recordCurrent(evidence);
      this.stats.observations += 1;
      if (evidence.observedClean) {
        this.state = 'OBSERVED_CLEAN';
        this.stats.clean += 1;
      } else {
        this.state = 'BLOCKED';
        this.stats.blocked += 1;
      }
      return { observed: true, clean: evidence.observedClean, blockers: evidence.blockers.slice(0, 64), status: this.status() };
    } catch (error) {
      this.state = 'BLOCKED';
      this.lastError = { at: this.now(), code: bounded(error && error.code || 'RECONCILIATION_READ_FAILED', 128), message: bounded(error && error.message || error, 256) };
      this._recordCurrentError(error);
      this.stats.failures += 1;
      return { observed: false, reason: this.lastError.code, status: this.status() };
    }
  }

  reset() {
    this.state = 'IDLE';
    this.previousRunId = null;
    this.currentRunId = null;
    this.startedAt = null;
    this.lastObservedAt = null;
    this.lastEvidence = null;
    this.lastError = null;
    this.currentObservedAt = null;
    this.currentEvidence = null;
    this.currentError = null;
    this.currentClean = null;
    return this.status();
  }

  status() {
    return {
      mode: 'post-restart-observation-only',
      state: this.state,
      previousRunId: this.previousRunId,
      currentRunId: this.currentRunId,
      startedAt: this.startedAt,
      lastObservedAt: this.lastObservedAt,
      lastEvidence: clone(this.lastEvidence),
      lastError: clone(this.lastError),
      current: {
        observedAt: this.currentObservedAt,
        observedClean: this.currentClean === true,
        blockers: this.currentEvidence && Array.isArray(this.currentEvidence.blockers) ? this.currentEvidence.blockers.slice(0, 64) : [],
        lastError: clone(this.currentError)
      },
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      reconciliationActionAuthority: false,
      hostMayNotResumeBlindly: true,
      stats: { ...this.stats }
    };
  }
}

module.exports = { RestartReconciliationObserver };
