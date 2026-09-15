'use strict';

const SAFE_RECOVERY_SCHEMA_VERSION = 1;
const SAFE_RECOVERY_ACK = 'ALPHA20_5_SAFE_RECOVERY';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class SafeRecoveryCoordinator {
  constructor(options = {}) {
    this.runtime = options.runtime || null;
    this.now = options.now || (() => Date.now());
    this.enabled = false;
    this.reobserveAfterMs = Math.max(1000, finite(options.reobserveAfterMs, 15000));
    this.replanAfterMs = Math.max(this.reobserveAfterMs, finite(options.replanAfterMs, 45000));
    this.circuitAfterMs = Math.max(this.replanAfterMs, finite(options.circuitAfterMs, 90000));
    this.safeModeAfterMs = Math.max(this.circuitAfterMs, finite(options.safeModeAfterMs, 120000));
    this.hostRestartAfterMs = Math.max(this.safeModeAfterMs, finite(options.hostRestartAfterMs, 300000));
    this.windowMs = Math.max(60000, finite(options.windowMs, 10 * 60 * 1000));
    this.maxSafeModesPerWindow = Math.max(1, Math.min(10, Math.floor(finite(options.maxSafeModesPerWindow, 2))));
    this.safeModeCooldownMs = Math.max(10000, finite(options.safeModeCooldownMs, 120000));
    this.degradedSince = null;
    this.incidentId = 0;
    this.safeModeAppliedIncident = null;
    this.safeModeTimes = [];
    this.lastPlan = null;
    this.lastResult = null;
    this.history = [];
    this.maxHistory = Math.max(20, Math.min(500, Math.floor(finite(options.maxHistory, 100))));
    this.stats = { observations: 0, safeModeAttempts: 0, safeModeApplied: 0, budgetBlocks: 0, rejectedEnables: 0 };
  }

  configure(config = {}) {
    if (config.enabled === true) {
      if (config.ack !== SAFE_RECOVERY_ACK) {
        this.enabled = false;
        this.stats.rejectedEnables += 1;
        return { ...this.status(), enableRejected: 'WRONG_ACK' };
      }
      this.enabled = true;
    } else {
      this.enabled = false;
    }
    return this.status();
  }

  disable() {
    this.enabled = false;
    return this.status();
  }

  _record(row) {
    this.history.push(clone(row));
    if (this.history.length > this.maxHistory) this.history.splice(0, this.history.length - this.maxHistory);
  }

  _pruneBudget(now) {
    const cutoff = now - this.windowMs;
    this.safeModeTimes = this.safeModeTimes.filter((at) => at > cutoff);
  }

  _stage(elapsedMs, state) {
    if (state === 'WATCH') return 'REOBSERVE';
    if (elapsedMs >= this.hostRestartAfterMs) return 'HOST_RESTART';
    if (elapsedMs >= this.safeModeAfterMs) return 'SAFE_MODE';
    if (elapsedMs >= this.circuitAfterMs) return 'CIRCUIT';
    if (elapsedMs >= this.replanAfterMs) return 'REPLAN';
    return 'REOBSERVE';
  }

  _disableAuthority(runtime, name, method = 'disable') {
    const target = runtime && runtime[name];
    if (!target || typeof target[method] !== 'function') return { name, attempted: false, ok: true };
    try {
      target[method]('ALPHA20_5_RELIABILITY_SAFE_MODE');
      return { name, attempted: true, ok: true };
    } catch (error) {
      return { name, attempted: true, ok: false, error: String(error && error.message || error) };
    }
  }

  _applySafeMode(reason) {
    const runtime = this.runtime;
    this.stats.safeModeAttempts += 1;
    if (!runtime) return { executed: false, reason: 'RUNTIME_UNAVAILABLE', actions: [] };
    const actions = [];
    const invoke = (name, fn) => {
      try {
        fn();
        actions.push({ name, ok: true });
      } catch (error) {
        actions.push({ name, ok: false, error: String(error && error.message || error) });
      }
    };

    if (typeof runtime.alpha20LiveGateStatus === 'function' && typeof runtime.cancelAlpha20CombinedLiveGate === 'function') {
      let gate = null;
      try { gate = runtime.alpha20LiveGateStatus(); } catch (_) {}
      if (gate && gate.running === true) invoke('cancelAlpha20LiveGate', () => runtime.cancelAlpha20CombinedLiveGate('RELIABILITY_SAFE_MODE'));
    }
    if (typeof runtime.setFarmerEnabled === 'function') invoke('disableFarmer', () => runtime.setFarmerEnabled(false));
    if (runtime.partyTransitions && typeof runtime.partyTransitions.setLiveEnabled === 'function') invoke('disableLegacyPartyTransition', () => runtime.partyTransitions.setLiveEnabled(false));
    actions.push(this._disableAuthority(runtime, 'controlledPartyLifecycle'));
    actions.push(this._disableAuthority(runtime, 'controlledPaladinAura'));
    actions.push(this._disableAuthority(runtime, 'controlledMerchantSpaceRecovery'));
    actions.push(this._disableAuthority(runtime, 'controlledBankConsolidation'));
    actions.push(this._disableAuthority(runtime, 'controlledBankExpansion'));
    actions.push(this._disableAuthority(runtime, 'controlledMerchant'));
    actions.push(this._disableAuthority(runtime, 'controlledTravel'));
    if (typeof runtime.setMode === 'function') invoke('setShadowMode', () => runtime.setMode('shadow'));
    else if (runtime.adapter && typeof runtime.adapter.setMode === 'function') invoke('setShadowMode', () => runtime.adapter.setMode('shadow'));

    const failed = actions.filter((row) => row && row.attempted !== false && row.ok === false);
    const executed = actions.some((row) => row && (row.attempted === true || row.name === 'disableFarmer' || row.name === 'setShadowMode' || row.name === 'cancelAlpha20LiveGate'));
    if (executed && failed.length === 0) this.stats.safeModeApplied += 1;
    return {
      executed,
      reason: failed.length ? 'SAFE_MODE_PARTIAL_FAILURE' : 'SAFE_MODE_APPLIED',
      trigger: reason || null,
      actionScope: 'safety-reduction-only',
      rawGameplayActions: 0,
      actions,
      failures: failed
    };
  }

  observe(watchdog = {}, group = null) {
    const now = this.now();
    this.stats.observations += 1;
    const state = String(watchdog.state || 'HEALTHY');
    if (state === 'HEALTHY') {
      this.degradedSince = null;
      this.safeModeAppliedIncident = null;
      this.lastPlan = { at: now, state, stage: 'NONE', elapsedMs: 0, automaticActionEligible: false };
      return clone(this.lastPlan);
    }

    if (this.degradedSince == null) {
      this.degradedSince = now;
      this.incidentId += 1;
      this.safeModeAppliedIncident = null;
    }
    const elapsedMs = Math.max(0, now - this.degradedSince);
    const stage = this._stage(elapsedMs, state);
    const plan = {
      at: now,
      incidentId: this.incidentId,
      state,
      watchdogReason: watchdog.reason || null,
      groupState: group && group.state || null,
      elapsedMs,
      stage,
      recommendation: stage,
      enabled: this.enabled,
      automaticActionEligible: false,
      actionScope: 'safety-reduction-only',
      rawGameplayActionAuthority: false
    };

    if (stage === 'SAFE_MODE') {
      this._pruneBudget(now);
      const cooldownSatisfied = !this.safeModeTimes.length || now - this.safeModeTimes[this.safeModeTimes.length - 1] >= this.safeModeCooldownMs;
      const budgetSatisfied = this.safeModeTimes.length < this.maxSafeModesPerWindow;
      const notAlreadyApplied = this.safeModeAppliedIncident !== this.incidentId;
      plan.automaticActionEligible = this.enabled && cooldownSatisfied && budgetSatisfied && notAlreadyApplied;
      plan.cooldownSatisfied = cooldownSatisfied;
      plan.budgetSatisfied = budgetSatisfied;
      if (this.enabled && !budgetSatisfied) this.stats.budgetBlocks += 1;
      if (plan.automaticActionEligible) {
        const result = this._applySafeMode(watchdog.reason || 'WATCHDOG_DEGRADED');
        this.lastResult = { at: now, incidentId: this.incidentId, stage, ...clone(result) };
        this._record(this.lastResult);
        if (result.executed) {
          this.safeModeTimes.push(now);
          this.safeModeAppliedIncident = this.incidentId;
        }
        plan.execution = clone(this.lastResult);
      }
    }

    if (stage === 'HOST_RESTART') {
      plan.automaticActionEligible = false;
      plan.hostActionRequired = true;
      plan.reason = 'PROCESS_RESTART_REQUIRES_EXTERNAL_SUPERVISOR';
    }
    if (stage === 'CIRCUIT') {
      plan.automaticActionEligible = false;
      plan.reason = 'OWNING_SUBSYSTEM_CIRCUIT_OR_SAFE_MODE_RECOMMENDED';
    }

    this.lastPlan = clone(plan);
    return clone(plan);
  }

  status() {
    const now = this.now();
    this._pruneBudget(now);
    return {
      schemaVersion: SAFE_RECOVERY_SCHEMA_VERSION,
      mode: 'bounded-safety-reduction',
      requiredAck: SAFE_RECOVERY_ACK,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      actionScope: 'safety-reduction-only',
      rawGameplayActionAuthority: false,
      automaticRestart: false,
      thresholds: {
        reobserveAfterMs: this.reobserveAfterMs,
        replanAfterMs: this.replanAfterMs,
        circuitAfterMs: this.circuitAfterMs,
        safeModeAfterMs: this.safeModeAfterMs,
        hostRestartAfterMs: this.hostRestartAfterMs
      },
      budget: {
        windowMs: this.windowMs,
        maxSafeModesPerWindow: this.maxSafeModesPerWindow,
        inWindow: this.safeModeTimes.length,
        cooldownMs: this.safeModeCooldownMs
      },
      degradedSince: this.degradedSince,
      incidentId: this.incidentId,
      lastPlan: clone(this.lastPlan),
      lastResult: clone(this.lastResult),
      recent: this.history.slice(-10).map(clone),
      stats: { ...this.stats }
    };
  }
}

module.exports = { SafeRecoveryCoordinator, SAFE_RECOVERY_SCHEMA_VERSION, SAFE_RECOVERY_ACK };
