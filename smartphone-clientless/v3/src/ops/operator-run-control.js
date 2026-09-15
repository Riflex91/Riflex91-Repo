'use strict';

const { buildReconciliationStatus } = require('./reconciliation-status');

const OPERATOR_RUN_CONTROL_SCHEMA_VERSION = 1;
const OPERATOR_RUN_CONTROL_MODE = 'operator-safe-run-control';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function bounded(value, max = 160) {
  return String(value == null ? '' : value).slice(0, max);
}

class OperatorRunControl {
  constructor(options = {}) {
    this.runtime = options.runtime || null;
    this.log = options.log || (this.runtime && this.runtime.log) || null;
    this.now = options.now || (this.runtime && this.runtime.now) || (() => Date.now());
    this.stopGraceMs = Math.floor(clamp(options.stopGraceMs, 250, 30000) || 5000);
    if (!Number.isFinite(Number(options.stopGraceMs))) this.stopGraceMs = 5000;
    this.pollMs = Math.floor(clamp(options.pollMs, 25, 1000) || 100);
    if (!Number.isFinite(Number(options.pollMs))) this.pollMs = 100;
    this.sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.getReconciliationStatus = options.getReconciliationStatus || (() => buildReconciliationStatus(this.runtime, this.now));
    this.transition = null;
    this.lastTransition = null;
    this.sequence = 0;
  }

  _event(event, severity = 'info', reason = null, data = null) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'operator-run-control', event, severity, reason, data });
  }

  _runtimeStatus() {
    try {
      if (!this.runtime || typeof this.runtime.status !== 'function') return null;
      const status = this.runtime.status();
      return status && typeof status === 'object' ? status : null;
    } catch (_) {
      return null;
    }
  }

  _running() {
    const status = this._runtimeStatus();
    return !!(status && status.running === true);
  }

  _reconciliation() {
    try {
      const status = this.getReconciliationStatus();
      if (!status || typeof status !== 'object') throw new Error('RECONCILIATION_STATUS_UNAVAILABLE');
      return {
        observedClean: status.observedClean === true,
        blockers: Array.isArray(status.blockers) ? status.blockers.slice(0, 32).map((row) => bounded(row, 96)) : [],
        observedAt: Number.isFinite(Number(status.observedAt)) ? Number(status.observedAt) : null,
        actionAuthority: status.actionAuthority === true,
        rawGameplayActionAuthority: status.rawGameplayActionAuthority === true
      };
    } catch (error) {
      return {
        observedClean: false,
        blockers: ['RECONCILIATION_STATUS_UNAVAILABLE'],
        observedAt: null,
        actionAuthority: false,
        rawGameplayActionAuthority: false,
        error: bounded(error && error.message || error || 'RECONCILIATION_STATUS_UNAVAILABLE', 160)
      };
    }
  }

  _record(kind, result) {
    this.lastTransition = {
      id: `operator-run-${++this.sequence}`,
      kind,
      at: finite(this.now(), Date.now()),
      ...clone(result)
    };
    return clone(this.lastTransition);
  }

  status() {
    const running = this._running();
    const reconciliation = this._reconciliation();
    let state;
    if (this.transition === 'STOPPING') state = 'STOPPING';
    else if (this.transition === 'STARTING') state = 'STARTING';
    else if (running) state = 'RUNNING';
    else state = reconciliation.observedClean ? 'STOPPED' : 'STOPPED_BLOCKED';
    return {
      schemaVersion: OPERATOR_RUN_CONTROL_SCHEMA_VERSION,
      mode: OPERATOR_RUN_CONTROL_MODE,
      runtimeControlAuthority: true,
      directGameplayActionAccess: false,
      rawGameplayActionAuthority: false,
      state,
      running,
      transition: this.transition,
      startBlocked: !running && reconciliation.observedClean !== true,
      reconciliationObservedClean: reconciliation.observedClean === true,
      blockers: reconciliation.blockers.slice(),
      stopGraceMs: this.stopGraceMs,
      pollMs: this.pollMs,
      lastTransition: clone(this.lastTransition)
    };
  }

  async stop(reason = 'GUI_OPERATOR_STOP') {
    if (this.transition) return { ok: false, stopped: !this._running(), reason: 'CONTROL_TRANSITION_IN_PROGRESS', state: this.status().state };
    if (!this.runtime || typeof this.runtime.stop !== 'function') return { ok: false, stopped: false, reason: 'RUNTIME_STOP_UNAVAILABLE' };

    if (!this._running()) {
      const reconciliation = this._reconciliation();
      const result = {
        ok: reconciliation.observedClean === true,
        stopped: true,
        reason: reconciliation.observedClean ? 'ALREADY_STOPPED' : 'ALREADY_STOPPED_RECONCILIATION_REQUIRED',
        blockers: reconciliation.blockers.slice()
      };
      this._record('STOP', result);
      return result;
    }

    this.transition = 'STOPPING';
    this._event('OPERATOR_STOP_REQUESTED', 'warn', bounded(reason, 96));
    try {
      const stopResult = this.runtime.stop();
      if (stopResult && typeof stopResult.then === 'function') await stopResult;
    } catch (error) {
      const result = { ok: false, stopped: !this._running(), reason: 'RUNTIME_STOP_FAILED', error: bounded(error && error.message || error, 160) };
      this.transition = null;
      this._record('STOP', result);
      this._event('OPERATOR_STOP_FAILED', 'error', result.reason, { error: result.error });
      return result;
    }

    const maxPolls = Math.max(1, Math.ceil(this.stopGraceMs / this.pollMs) + 1);
    const startedAt = finite(this.now(), Date.now());
    let reconciliation = this._reconciliation();
    let polls = 0;
    while (!reconciliation.observedClean && polls < maxPolls) {
      const elapsed = Math.max(0, finite(this.now(), startedAt) - startedAt);
      if (elapsed >= this.stopGraceMs) break;
      polls += 1;
      await this.sleep(this.pollMs);
      reconciliation = this._reconciliation();
    }

    const clean = reconciliation.observedClean === true;
    const result = {
      ok: clean,
      stopped: !this._running(),
      reason: clean ? 'RUNTIME_STOPPED_RECONCILED' : 'RUNTIME_STOPPED_RECONCILIATION_REQUIRED',
      blockers: reconciliation.blockers.slice(),
      polls
    };
    this.transition = null;
    this._record('STOP', result);
    this._event(clean ? 'OPERATOR_STOPPED' : 'OPERATOR_STOPPED_BLOCKED', clean ? 'info' : 'warn', result.reason, { blockers: result.blockers, polls });
    return result;
  }

  async start(reason = 'GUI_OPERATOR_START') {
    if (this.transition) return { ok: false, started: this._running(), reason: 'CONTROL_TRANSITION_IN_PROGRESS', state: this.status().state };
    if (!this.runtime || typeof this.runtime.start !== 'function') return { ok: false, started: false, reason: 'RUNTIME_START_UNAVAILABLE' };
    if (this._running()) {
      const result = { ok: true, started: true, reason: 'ALREADY_RUNNING' };
      this._record('START', result);
      return result;
    }

    const reconciliation = this._reconciliation();
    if (!reconciliation.observedClean) {
      const result = { ok: false, started: false, reason: 'START_BLOCKED_RECONCILIATION_REQUIRED', blockers: reconciliation.blockers.slice() };
      this._record('START', result);
      this._event('OPERATOR_START_BLOCKED', 'warn', result.reason, { blockers: result.blockers });
      return result;
    }

    this.transition = 'STARTING';
    this._event('OPERATOR_START_REQUESTED', 'info', bounded(reason, 96));
    try {
      const startResult = this.runtime.start();
      if (startResult && typeof startResult.then === 'function') await startResult;
    } catch (error) {
      const result = { ok: false, started: this._running(), reason: 'RUNTIME_START_FAILED', error: bounded(error && error.message || error, 160) };
      this.transition = null;
      this._record('START', result);
      this._event('OPERATOR_START_FAILED', 'error', result.reason, { error: result.error });
      return result;
    }

    const started = this._running();
    const result = { ok: started, started, reason: started ? 'RUNTIME_STARTED_AFTER_CLEAN_PREFLIGHT' : 'RUNTIME_START_DID_NOT_REPORT_RUNNING' };
    this.transition = null;
    this._record('START', result);
    this._event(started ? 'OPERATOR_STARTED' : 'OPERATOR_START_FAILED', started ? 'info' : 'error', result.reason);
    return result;
  }
}

module.exports = {
  OperatorRunControl,
  OPERATOR_RUN_CONTROL_SCHEMA_VERSION,
  OPERATOR_RUN_CONTROL_MODE
};
