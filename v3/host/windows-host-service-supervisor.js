'use strict';

const WINDOWS_HOST_SERVICE_STATE_SCHEMA_VERSION = 1;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}

function defaultState() {
  return {
    schemaVersion: WINDOWS_HOST_SERVICE_STATE_SCHEMA_VERSION,
    starts: [],
    circuitOpenUntil: null,
    lastStartAttemptAt: null,
    lastStartedAt: null,
    lastStableAt: null,
    lastCleanStopAt: null,
    lastFailure: null,
    stats: {
      startAttempts: 0,
      starts: 0,
      blocks: 0,
      failures: 0,
      cleanStops: 0,
      stableMarks: 0
    }
  };
}

class PersistentWindowsStartBudget {
  constructor(options = {}) {
    if (!options.store || typeof options.store.load !== 'function' || typeof options.store.save !== 'function') {
      throw new Error('WINDOWS_HOST_STATE_STORE_REQUIRED');
    }
    this.store = options.store;
    this.now = options.now || (() => Date.now());
    this.windowMs = Math.max(60_000, finite(options.windowMs, 10 * 60_000));
    this.maxStartsPerWindow = Math.max(1, Math.min(20, Math.floor(finite(options.maxStartsPerWindow, 4))));
    this.circuitCooldownMs = Math.max(60_000, finite(options.circuitCooldownMs, 15 * 60_000));
    this.lastError = null;
  }

  _normalize(raw) {
    const base = defaultState();
    if (raw == null) return base;
    if (!raw || typeof raw !== 'object' || raw.schemaVersion !== WINDOWS_HOST_SERVICE_STATE_SCHEMA_VERSION) {
      throw new Error('WINDOWS_HOST_STATE_SCHEMA_INVALID');
    }
    base.starts = Array.isArray(raw.starts)
      ? raw.starts.map(Number).filter(Number.isFinite).slice(-100)
      : [];
    base.circuitOpenUntil = Number.isFinite(Number(raw.circuitOpenUntil)) ? Number(raw.circuitOpenUntil) : null;
    for (const name of ['lastStartAttemptAt','lastStartedAt','lastStableAt','lastCleanStopAt']) {
      base[name] = Number.isFinite(Number(raw[name])) ? Number(raw[name]) : null;
    }
    base.lastFailure = raw.lastFailure && typeof raw.lastFailure === 'object'
      ? { at: finite(raw.lastFailure.at, null), reason: bounded(raw.lastFailure.reason, 160) }
      : null;
    if (raw.stats && typeof raw.stats === 'object') {
      for (const name of Object.keys(base.stats)) base.stats[name] = Math.max(0, Math.floor(finite(raw.stats[name], 0)));
    }
    return base;
  }

  _load() {
    try {
      const state = this._normalize(this.store.load(defaultState()));
      this.lastError = null;
      return state;
    } catch (error) {
      this.lastError = {
        at: this.now(),
        code: bounded(error && (error.code || error.message) || error || 'WINDOWS_HOST_STATE_LOAD_FAILED', 160)
      };
      throw new Error('WINDOWS_HOST_STATE_UNAVAILABLE:' + this.lastError.code);
    }
  }

  _save(state) {
    const ok = this.store.save(state);
    if (ok !== true) {
      this.lastError = { at: this.now(), code: 'WINDOWS_HOST_STATE_SAVE_FAILED' };
      throw new Error('WINDOWS_HOST_STATE_SAVE_FAILED');
    }
    this.lastError = null;
    return state;
  }

  _prune(state, now) {
    const cutoff = now - this.windowMs;
    state.starts = state.starts.filter((at) => Number.isFinite(at) && at > cutoff && at <= now + 60_000);
    if (state.circuitOpenUntil != null && state.circuitOpenUntil <= now) state.circuitOpenUntil = null;
    return state;
  }

  admitStart() {
    const now = this.now();
    let state;
    try { state = this._prune(this._load(), now); }
    catch (error) {
      return { allowed: false, reason: 'SERVICE_STATE_UNAVAILABLE', error: bounded(error.message, 220), status: this.status(false) };
    }

    if (state.circuitOpenUntil != null && state.circuitOpenUntil > now) {
      state.stats.blocks += 1;
      try { this._save(state); } catch (_) {}
      return {
        allowed: false,
        reason: 'START_CIRCUIT_OPEN',
        retryAfterMs: state.circuitOpenUntil - now,
        circuitOpenUntil: state.circuitOpenUntil
      };
    }

    if (state.starts.length >= this.maxStartsPerWindow) {
      state.circuitOpenUntil = now + this.circuitCooldownMs;
      state.stats.blocks += 1;
      try { this._save(state); }
      catch (error) {
        return { allowed: false, reason: 'SERVICE_STATE_UNAVAILABLE', error: bounded(error.message, 220) };
      }
      return {
        allowed: false,
        reason: 'START_BUDGET_EXHAUSTED',
        retryAfterMs: this.circuitCooldownMs,
        circuitOpenUntil: state.circuitOpenUntil
      };
    }

    state.starts.push(now);
    state.lastStartAttemptAt = now;
    state.stats.startAttempts += 1;
    try { this._save(state); }
    catch (error) {
      return { allowed: false, reason: 'SERVICE_STATE_UNAVAILABLE', error: bounded(error.message, 220) };
    }
    return {
      allowed: true,
      inWindow: state.starts.length,
      remaining: Math.max(0, this.maxStartsPerWindow - state.starts.length)
    };
  }

  recordStarted() {
    const state = this._prune(this._load(), this.now());
    state.lastStartedAt = this.now();
    state.stats.starts += 1;
    this._save(state);
    return clone(state);
  }

  recordFailure(reason) {
    const state = this._prune(this._load(), this.now());
    state.lastFailure = { at: this.now(), reason: bounded(reason || 'WINDOWS_HOST_START_FAILED', 160) };
    state.stats.failures += 1;
    this._save(state);
    return clone(state);
  }

  recordStable() {
    const state = this._prune(this._load(), this.now());
    state.lastStableAt = this.now();
    state.stats.stableMarks += 1;
    this._save(state);
    return clone(state);
  }

  recordCleanStop() {
    const state = this._prune(this._load(), this.now());
    state.lastCleanStopAt = this.now();
    state.stats.cleanStops += 1;
    this._save(state);
    return clone(state);
  }

  status(load = true) {
    let state = null;
    if (load) {
      try { state = this._prune(this._load(), this.now()); }
      catch (_) {}
    }
    return {
      schemaVersion: WINDOWS_HOST_SERVICE_STATE_SCHEMA_VERSION,
      mode: 'persistent-windows-start-budget',
      windowMs: this.windowMs,
      maxStartsPerWindow: this.maxStartsPerWindow,
      circuitCooldownMs: this.circuitCooldownMs,
      state: state ? clone(state) : null,
      lastError: this.lastError ? { ...this.lastError } : null,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false
    };
  }
}

class WindowsHostServiceSupervisor {
  constructor(options = {}) {
    if (!options.harness || typeof options.harness.start !== 'function' || typeof options.harness.stop !== 'function') {
      throw new Error('PRODUCTION_HOST_HARNESS_REQUIRED');
    }
    this.harness = options.harness;
    this.budget = options.budget;
    if (!this.budget || typeof this.budget.admitStart !== 'function') throw new Error('WINDOWS_HOST_START_BUDGET_REQUIRED');
    this.now = options.now || (() => Date.now());
    this.stableAfterMs = Math.max(10_000, finite(options.stableAfterMs, 2 * 60_000));
    this.setTimeout = options.setTimeout || globalThis.setTimeout;
    this.clearTimeout = options.clearTimeout || globalThis.clearTimeout;
    this.stableTimer = null;
    this.running = false;
    this.startedAt = null;
    this.lastStartResult = null;
    this.lastStopResult = null;
    this.lastError = null;
  }

  async start(options = {}) {
    if (this.running) return { started: false, reason: 'WINDOWS_HOST_SERVICE_ALREADY_RUNNING', status: this.status() };
    const admission = this.budget.admitStart();
    if (!admission.allowed) {
      this.lastError = { at: this.now(), reason: admission.reason };
      return { started: false, reason: admission.reason, admission, status: this.status() };
    }

    let result;
    try { result = await this.harness.start(options); }
    catch (error) {
      const reason = bounded(error && error.message || error || 'HOST_HARNESS_START_FAILED', 160);
      try { this.budget.recordFailure(reason); } catch (_) {}
      this.lastError = { at: this.now(), reason };
      return { started: false, reason: 'HOST_HARNESS_START_FAILED', error: reason, status: this.status() };
    }
    this.lastStartResult = clone(result);
    if (!result || result.started !== true) {
      const reason = bounded(result && result.reason || 'HOST_HARNESS_START_REJECTED', 160);
      try { this.budget.recordFailure(reason); } catch (_) {}
      this.lastError = { at: this.now(), reason };
      return { started: false, reason, result: clone(result), status: this.status() };
    }

    try { this.budget.recordStarted(); }
    catch (error) {
      try { await this.harness.stop('WINDOWS_HOST_STATE_PERSIST_FAILED'); } catch (_) {}
      this.lastError = { at: this.now(), reason: 'WINDOWS_HOST_STATE_PERSIST_FAILED' };
      return { started: false, reason: 'WINDOWS_HOST_STATE_PERSIST_FAILED', error: bounded(error.message, 220), status: this.status() };
    }

    this.running = true;
    this.startedAt = this.now();
    this.lastError = null;
    this.stableTimer = this.setTimeout(() => {
      this.stableTimer = null;
      if (!this.running) return;
      try { this.budget.recordStable(); }
      catch (error) { this.lastError = { at: this.now(), reason: bounded(error.message, 160) }; }
    }, this.stableAfterMs);
    if (this.stableTimer && typeof this.stableTimer.unref === 'function') this.stableTimer.unref();
    return { started: true, admission, harness: clone(result), status: this.status() };
  }

  async stop(reason = 'WINDOWS_HOST_SERVICE_STOP') {
    if (this.stableTimer) this.clearTimeout(this.stableTimer);
    this.stableTimer = null;
    let result;
    try { result = await this.harness.stop(reason); }
    catch (error) {
      this.lastError = { at: this.now(), reason: bounded(error && error.message || error, 160) };
      return { stopped: false, reason: 'HOST_HARNESS_STOP_FAILED', error: this.lastError.reason, status: this.status() };
    }
    this.lastStopResult = clone(result);
    this.running = false;
    if (result && result.stopped === true) {
      try { this.budget.recordCleanStop(); }
      catch (error) { this.lastError = { at: this.now(), reason: bounded(error.message, 160) }; }
    }
    return { stopped: !!(result && result.stopped), harness: clone(result), status: this.status() };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'windows-host-service-supervisor',
      running: this.running,
      startedAt: this.startedAt,
      stableAfterMs: this.stableAfterMs,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      genericShellAuthority: false,
      browserAuthority: 'process-lifecycle-and-readonly-cdp-contract-only',
      lastStartResult: clone(this.lastStartResult),
      lastStopResult: clone(this.lastStopResult),
      lastError: clone(this.lastError),
      budget: this.budget.status(),
      harness: this.harness && typeof this.harness.status === 'function' ? this.harness.status() : null
    };
  }
}

module.exports = {
  WINDOWS_HOST_SERVICE_STATE_SCHEMA_VERSION,
  PersistentWindowsStartBudget,
  WindowsHostServiceSupervisor,
  defaultState
};
