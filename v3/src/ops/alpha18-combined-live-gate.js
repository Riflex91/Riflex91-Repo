'use strict';

const { RELEASE_VERSION } = require('../release-version');

const ALPHA18_LIVE_GATE_ACK = 'ALPHA18_FULL_LIVE_GATE';
const CONTROLLED_CANARY_ACK = 'CONTROLLED_CANARY';
const REQUIRED_OBSERVATION_MS = 10 * 60 * 1000;
const DEFAULT_SAMPLE_MS = 5000;
const ALLOWED_SUPERVISOR = new Set(['HEALTHY', 'WATCH']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function counterDelta(after, before, key) {
  return Math.max(0, finite(after && after[key], 0) - finite(before && before[key], 0));
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

class Alpha18CombinedLiveGate {
  constructor(options = {}) {
    this.runtime = options.runtime;
    this.root = options.root || this.runtime && this.runtime.root || globalThis;
    this.now = options.now || this.runtime && this.runtime.now || (() => Date.now());
    this.testMode = options.testMode === true;
    this.observationMs = this.testMode
      ? Math.max(0, finite(options.observationMs, 0))
      : REQUIRED_OBSERVATION_MS;
    this.sampleMs = this.testMode
      ? Math.max(0, finite(options.sampleMs, 1))
      : DEFAULT_SAMPLE_MS;
    this.sleep = options.sleep || ((ms) => new Promise((resolve) => {
      const setTimer = this.root && this.root.setTimeout || setTimeout;
      setTimer(resolve, ms);
    }));
    this.running = false;
    this.phase = 'IDLE';
    this.startedAt = null;
    this.lastResult = null;
    this.lastResultText = null;
  }

  _character() {
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _inCombat() {
    const character = this._character() || {};
    if (character.target) return true;
    const entities = this.root && this.root.parent && this.root.parent.entities || this.root && this.root.entities || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (log && typeof log.emit === 'function') log.emit({ component: 'alpha18-live-gate', event, severity, reason, data });
  }

  _controlledSnapshot() {
    const runtime = this.runtime;
    return {
      merchant: runtime && runtime.controlledMerchant && runtime.controlledMerchant.status ? runtime.controlledMerchant.status() : null,
      travel: runtime && runtime.controlledTravel && runtime.controlledTravel.status ? runtime.controlledTravel.status() : null,
      expansion: runtime && runtime.controlledBankExpansion && runtime.controlledBankExpansion.status ? runtime.controlledBankExpansion.status() : null
    };
  }

  _circuits() {
    const runtime = this.runtime;
    const tx = runtime && runtime.transactionEngine && runtime.transactionEngine.status ? runtime.transactionEngine.status() : {};
    return {
      sell: tx && tx.circuits && tx.circuits.SELL || null,
      bank: tx && tx.circuits && tx.circuits.BANK || null,
      travel: runtime && runtime.safeTravel && runtime.safeTravel.breaker ? runtime.safeTravel.breaker() : null,
      bankExpansion: runtime && runtime.bankExpansionTransactions && runtime.bankExpansionTransactions.breaker ? runtime.bankExpansionTransactions.breaker() : null
    };
  }

  _safeStateSnapshot() {
    const runtime = this.runtime;
    const status = runtime && runtime.status ? runtime.status() : {};
    const controlled = this._controlledSnapshot();
    const farmer = runtime && runtime.farmerStatus ? runtime.farmerStatus() : status.farmer || null;
    const supervisor = runtime && runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : status.supervisor || {};
    const capacity = runtime && runtime.bankCapacity && runtime.bankCapacity.status ? runtime.bankCapacity.status() : null;
    return {
      at: this.now(),
      version: status.version || null,
      mode: status.mode || runtime && runtime.adapter && runtime.adapter.mode || null,
      farmerEnabled: !!(farmer && farmer.enabled),
      supervisorState: supervisor && supervisor.state || null,
      controlled: {
        merchantEnabled: !!(controlled.merchant && controlled.merchant.enabled),
        travelEnabled: !!(controlled.travel && controlled.travel.enabled),
        expansionEnabled: !!(controlled.expansion && controlled.expansion.enabled)
      },
      circuits: this._circuits(),
      capacity: capacity && capacity.observation ? {
        totals: clone(capacity.observation.totals),
        unlockedPackCount: capacity.observation.unlockedPackCount,
        lockedPackCount: capacity.observation.lockedPackCount,
        pressureNow: capacity.observation.pressureNow,
        sustainedPressure: capacity.observation.sustainedPressure,
        actionAuthority: capacity.observation.actionAuthority
      } : null
    };
  }

  async _normalizeSafeState() {
    const runtime = this.runtime;
    if (!runtime) return;
    if (runtime.controlledBankExpansion && runtime.controlledBankExpansion.disable) runtime.controlledBankExpansion.disable('ALPHA18_LIVE_GATE_SAFE_STATE');
    if (runtime.controlledMerchant && runtime.controlledMerchant.disable) runtime.controlledMerchant.disable('ALPHA18_LIVE_GATE_SAFE_STATE');
    if (runtime.controlledTravel && runtime.controlledTravel.disable) await Promise.resolve(runtime.controlledTravel.disable('ALPHA18_LIVE_GATE_SAFE_STATE')).catch(() => {});
    if (runtime.setMode) runtime.setMode('shadow');
    if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false);
  }

  _precheck() {
    const runtime = this.runtime;
    const character = this._character();
    const supervisor = runtime && runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : {};
    const observation = runtime && runtime._observeBankCapacity ? runtime._observeBankCapacity() : null;
    const failures = [];
    if (!runtime) failures.push('RUNTIME_UNAVAILABLE');
    if (!character) failures.push('CHARACTER_UNAVAILABLE');
    if (character && String(character.ctype || character.type || '').toLowerCase() !== 'merchant') failures.push('MERCHANT_REQUIRED');
    if (character && (character.rip === true || character.dead === true)) failures.push('CHARACTER_DEAD');
    if (character && (!character.bank || typeof character.bank !== 'object')) failures.push('BANK_CONTEXT_REQUIRED');
    if (this._inCombat()) failures.push('COMBAT_ACTIVE');
    if (!ALLOWED_SUPERVISOR.has(String(supervisor && supervisor.state || ''))) failures.push('SUPERVISOR_NOT_HEALTHY');
    if (!this.root || typeof this.root.open_bank_pack !== 'function') failures.push('OPEN_BANK_PACK_API_UNAVAILABLE');
    if (!observation || !Array.isArray(observation.packs) || observation.packs.length === 0) failures.push('BANK_PACK_CATALOG_UNAVAILABLE');
    if (!observation || observation.actionAuthority !== false) failures.push('BANK_CAPACITY_AUTHORITY_INVARIANT_FAILED');
    return {
      pass: failures.length === 0,
      failures,
      character: character ? { name: character.name || null, ctype: character.ctype || character.type || null, map: character.map || null, gold: finite(character.gold, 0) } : null,
      supervisor: clone(supervisor),
      bankObservation: clone(observation)
    };
  }

  _wrongAckProbe() {
    const runtime = this.runtime;
    if (!runtime || !runtime.controlledBankExpansion || typeof runtime.controlledBankExpansion.configure !== 'function') {
      return { pass: false, reason: 'CONTROLLED_BANK_EXPANSION_UNAVAILABLE' };
    }
    const result = runtime.controlledBankExpansion.configure({ enabled: true, ack: 'WRONG_ACK_ALPHA18_LIVE_GATE' });
    const pass = !result || result.enabled !== true;
    runtime.controlledBankExpansion.disable('ALPHA18_LIVE_GATE_WRONG_ACK_PROBE_COMPLETE');
    return { pass, reason: pass ? 'WRONG_ACK_REJECTED' : 'WRONG_ACK_UNEXPECTEDLY_ENABLED', status: clone(result) };
  }

  _planProbe() {
    const runtime = this.runtime;
    if (!runtime || typeof runtime.planBankSpace !== 'function') return { pass: false, reason: 'BANK_SPACE_PLANNER_UNAVAILABLE', plan: null };
    const plan = runtime.planBankSpace({ item: '__alpha18_live_gate_probe__', level: 0, quantity: 1, depositBlocked: true, minimumReserves: {} });
    const allowed = new Set(['DEPOSIT_STACK', 'DEPOSIT_FREE_SLOT', 'CONSOLIDATE_BANK_STACKS', 'EXPAND_BANK_PACK', 'EMERGENCY_RECLAIM', 'BLOCK_INVENTORY_PRODUCING_WORK']);
    const failures = [];
    if (!plan || !allowed.has(String(plan.action || ''))) failures.push('UNKNOWN_BANK_SPACE_PLAN');
    if (plan && plan.action === 'EMERGENCY_RECLAIM') {
      if (plan.executionAuthority !== false) failures.push('RECLAIM_AUTHORITY_MUST_REMAIN_FALSE');
      if (finite(plan.quantity, 0) !== 1) failures.push('RECLAIM_MUST_BE_EXACTLY_ONE_UNIT');
    }
    if (plan && plan.action === 'BLOCK_INVENTORY_PRODUCING_WORK' && plan.globalBotStop !== false) failures.push('SELECTIVE_BLOCK_MUST_NOT_GLOBAL_STOP');
    if (plan && plan.action === 'EXPAND_BANK_PACK' && plan.exactlyOneExpansion !== true) failures.push('EXPANSION_MUST_BE_EXACTLY_ONE');
    return { pass: failures.length === 0, failures, plan: clone(plan) };
  }

  async _maybeExpansionCanary(plan, allowExpansionPurchase) {
    const runtime = this.runtime;
    if (!plan || plan.action !== 'EXPAND_BANK_PACK') return { state: 'NOT_JUSTIFIED', pass: true, reason: 'LIVE_PLANNER_SELECTED_OTHER_RECOVERY', plan: clone(plan) };
    if (plan.requiresTravel) return { state: 'NOT_EXECUTED', pass: true, reason: 'WRONG_BANK_FLOOR_NO_TRAVEL_AUTHORITY', plan: clone(plan) };
    if (allowExpansionPurchase !== true) return { state: 'NOT_EXECUTED', pass: true, reason: 'OPERATOR_DID_NOT_ALLOW_EXPANSION_PURCHASE', plan: clone(plan) };
    if (this._inCombat()) return { state: 'NOT_EXECUTED', pass: false, reason: 'COMBAT_ACTIVE', plan: clone(plan) };

    const reservation = runtime.planBankExpansion({ plan });
    if (!reservation || reservation.accepted !== true || !reservation.transaction || !reservation.transaction.id) {
      return { state: 'FAILED', pass: false, reason: reservation && reservation.reason || 'EXPANSION_RESERVATION_FAILED', reservation: clone(reservation), plan: clone(plan) };
    }

    let execution = null;
    try {
      runtime.setMode('active');
      const enabled = runtime.configureControlledBankExpansion({ enabled: true, ack: CONTROLLED_CANARY_ACK });
      if (!enabled || enabled.enabled !== true) {
        return { state: 'FAILED', pass: false, reason: enabled && enabled.enableRejected || 'CONTROLLED_EXPANSION_ENABLE_FAILED', reservation: clone(reservation), enabled: clone(enabled) };
      }
      execution = await runtime.executeBankExpansion(reservation.transaction.id);
      const after = runtime._observeBankCapacity();
      const packAfter = after && Array.isArray(after.packs) ? after.packs.find((row) => row.name === plan.pack) : null;
      const pass = !!(execution && execution.executed === true && execution.committed === true && packAfter && packAfter.unlocked && packAfter.capacity > 0);
      return {
        state: pass ? 'COMMITTED' : 'FAILED',
        pass,
        reason: execution && execution.reason || (pass ? 'UNLOCK_VERIFIED_COMMIT' : 'EXPANSION_EXECUTION_FAILED'),
        reservation: clone(reservation),
        execution: clone(execution),
        observedPackAfter: clone(packAfter)
      };
    } finally {
      if (runtime.controlledBankExpansion && runtime.controlledBankExpansion.disable) runtime.controlledBankExpansion.disable('ALPHA18_LIVE_GATE_CANARY_COMPLETE');
      runtime.setMode('shadow');
      if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false);
    }
  }

  _eventsSince(at) {
    const log = this.runtime && this.runtime.log;
    const rows = log && typeof log.list === 'function' ? log.list(4000) : [];
    return rows.filter((row) => finite(row && (row.at == null ? row.timestamp : row.at), 0) >= at);
  }

  _sampleViolations(snapshot) {
    const violations = [];
    if (!snapshot) return ['STATUS_UNAVAILABLE'];
    if (snapshot.mode !== 'shadow') violations.push('RUNTIME_LEFT_SHADOW');
    if (snapshot.farmerEnabled) violations.push('FARMER_ENABLED_DURING_OBSERVATION');
    if (snapshot.controlled && snapshot.controlled.merchantEnabled) violations.push('CONTROLLED_MERCHANT_ENABLED_DURING_OBSERVATION');
    if (snapshot.controlled && snapshot.controlled.travelEnabled) violations.push('CONTROLLED_TRAVEL_ENABLED_DURING_OBSERVATION');
    if (snapshot.controlled && snapshot.controlled.expansionEnabled) violations.push('CONTROLLED_BANK_EXPANSION_ENABLED_DURING_OBSERVATION');
    if (!ALLOWED_SUPERVISOR.has(String(snapshot.supervisorState || ''))) violations.push('SUPERVISOR_DEGRADED_DURING_OBSERVATION');
    for (const [name, breaker] of Object.entries(snapshot.circuits || {})) if (breaker && breaker.open) violations.push(`${String(name).toUpperCase()}_CIRCUIT_OPEN`);
    if (snapshot.capacity && snapshot.capacity.actionAuthority !== false) violations.push('BANK_CAPACITY_GAINED_ACTION_AUTHORITY');
    return violations;
  }

  async _observeWindow() {
    const runtime = this.runtime;
    const startedAt = this.now();
    const beforeControlled = this._controlledSnapshot();
    const beforeExpansion = clone(beforeControlled.expansion && beforeControlled.expansion.stats || {});
    const beforeMerchant = clone(beforeControlled.merchant && beforeControlled.merchant.stats || {});
    const beforeTravel = clone(beforeControlled.travel && beforeControlled.travel.stats || {});
    const samples = [];
    const violations = [];
    let elapsed = 0;

    do {
      if (runtime && runtime._observeBankCapacity) runtime._observeBankCapacity();
      const snapshot = this._safeStateSnapshot();
      const found = this._sampleViolations(snapshot);
      if (found.length) violations.push(...found.map((reason) => ({ at: this.now(), reason })));
      samples.push(snapshot);
      if (this.observationMs <= 0 || elapsed >= this.observationMs) break;
      const step = Math.min(this.sampleMs || this.observationMs, this.observationMs - elapsed);
      await this.sleep(step);
      elapsed += step;
    } while (elapsed <= this.observationMs);

    const finishedAt = this.now();
    const afterControlled = this._controlledSnapshot();
    const afterExpansion = afterControlled.expansion && afterControlled.expansion.stats || {};
    const afterMerchant = afterControlled.merchant && afterControlled.merchant.stats || {};
    const afterTravel = afterControlled.travel && afterControlled.travel.stats || {};
    const events = this._eventsSince(startedAt);
    const errorEvents = events.filter((row) => String(row && row.severity || '').toLowerCase() === 'error');
    const unexpectedActionDeltas = {
      bankExpansionAttempts: counterDelta(afterExpansion, beforeExpansion, 'attempts'),
      merchantAttempts: counterDelta(afterMerchant, beforeMerchant, 'attempts'),
      travelAttempts: counterDelta(afterTravel, beforeTravel, 'attempts')
    };
    if (unexpectedActionDeltas.bankExpansionAttempts > 0) violations.push({ at: finishedAt, reason: 'BANK_EXPANSION_ATTEMPT_DURING_PASSIVE_WINDOW' });
    if (unexpectedActionDeltas.merchantAttempts > 0) violations.push({ at: finishedAt, reason: 'MERCHANT_ATTEMPT_DURING_PASSIVE_WINDOW' });
    if (unexpectedActionDeltas.travelAttempts > 0) violations.push({ at: finishedAt, reason: 'TRAVEL_ATTEMPT_DURING_PASSIVE_WINDOW' });
    if (errorEvents.length) violations.push({ at: finishedAt, reason: 'ERROR_EVENT_DURING_PASSIVE_WINDOW' });

    return {
      pass: violations.length === 0,
      startedAt,
      finishedAt,
      requiredObservationMs: REQUIRED_OBSERVATION_MS,
      configuredObservationMs: this.observationMs,
      confirmationDurationSatisfied: !this.testMode && this.observationMs >= REQUIRED_OBSERVATION_MS,
      sampleCount: samples.length,
      firstSample: clone(samples[0] || null),
      lastSample: clone(samples[samples.length - 1] || null),
      violations: clone(violations),
      errorEvents: clone(errorEvents.slice(-50)),
      unexpectedActionDeltas
    };
  }

  _resultText(result) {
    return `=== ALPHA18 FULL LIVE GATE RESULT BEGIN ===\n${JSON.stringify(result, null, 2)}\n=== ALPHA18 FULL LIVE GATE RESULT END ===`;
  }

  _publish(result) {
    const text = this._resultText(result);
    this.lastResultText = text;
    try { this.root.AIO_V3_ALPHA18_LIVE_GATE_RESULT = clone(result); } catch (_) {}
    try { this.root.AIO_V3_ALPHA18_LIVE_GATE_RESULT_TEXT = text; } catch (_) {}
    const consoles = [this.root && this.root.console, this.root && this.root.parent && this.root.parent.console].filter(Boolean);
    for (const target of consoles) {
      try { if (target && typeof target.log === 'function') target.log(text); } catch (_) {}
    }
    const gameLog = this.root && (this.root.game_log || this.root.parent && this.root.parent.game_log);
    if (typeof gameLog === 'function') {
      try { gameLog(`[AIO v3 ${RELEASE_VERSION}] ALPHA18 LIVE GATE ${result.pass ? 'PASS' : 'FAIL'} | confirmationEligible=${result.confirmationEligible} | expansion=${result.expansionCanary && result.expansionCanary.state || 'n/a'}`); } catch (_) {}
    }
    return text;
  }

  async run(config = {}) {
    if (this.running) return { accepted: false, reason: 'ALPHA18_LIVE_GATE_ALREADY_RUNNING', status: this.status() };
    if (config.ack !== ALPHA18_LIVE_GATE_ACK) return { accepted: false, reason: 'ALPHA18_LIVE_GATE_ACK_REQUIRED', requiredAck: ALPHA18_LIVE_GATE_ACK };
    if (!this.runtime) return { accepted: false, reason: 'RUNTIME_UNAVAILABLE' };

    this.running = true;
    this.phase = 'SAFE_STATE';
    this.startedAt = this.now();
    this.lastResult = null;
    this.lastResultText = null;
    this._event('ALPHA18_LIVE_GATE_STARTED', 'warn', 'EXPLICIT_OPERATOR_ACK', { observationMs: this.observationMs, allowExpansionPurchase: config.allowExpansionPurchase === true, testMode: this.testMode });

    let result;
    try {
      await this._normalizeSafeState();
      this.phase = 'PRECHECK';
      const precheck = this._precheck();
      const wrongAckProbe = this._wrongAckProbe();
      const planProbe = this._planProbe();
      if (!precheck.pass || !wrongAckProbe.pass || !planProbe.pass) {
        result = {
          schemaVersion: 1,
          release: RELEASE_VERSION,
          pass: false,
          confirmationEligible: false,
          startedAt: this.startedAt,
          finishedAt: this.now(),
          precheck,
          wrongAckProbe,
          planProbe,
          expansionCanary: { state: 'NOT_RUN', pass: false, reason: 'PRECHECK_FAILED' },
          passiveObservation: null,
          finalSafeState: this._safeStateSnapshot()
        };
        return result;
      }

      this.phase = 'OPTIONAL_EXPANSION_CANARY';
      const expansionCanary = await this._maybeExpansionCanary(planProbe.plan, config.allowExpansionPurchase === true);
      await this._normalizeSafeState();

      this.phase = 'PASSIVE_OBSERVATION';
      const passiveObservation = await this._observeWindow();
      await this._normalizeSafeState();
      const finalSafeState = this._safeStateSnapshot();
      const finalViolations = this._sampleViolations(finalSafeState);
      const pass = precheck.pass && wrongAckProbe.pass && planProbe.pass && expansionCanary.pass && passiveObservation.pass && finalViolations.length === 0;
      const confirmationEligible = pass && passiveObservation.confirmationDurationSatisfied && !this.testMode;
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass,
        confirmationEligible,
        startedAt: this.startedAt,
        finishedAt: this.now(),
        testMode: this.testMode,
        policy: {
          requiredAck: ALPHA18_LIVE_GATE_ACK,
          expansionPurchaseExplicitlyAllowed: config.allowExpansionPurchase === true,
          forcedCapacityPressure: false,
          emergencyReclaimExecutionAuthority: false,
          observationRequiredMs: REQUIRED_OBSERVATION_MS
        },
        precheck,
        wrongAckProbe,
        planProbe,
        expansionCanary,
        passiveObservation,
        finalSafeState,
        finalViolations: unique(finalViolations)
      };
      return result;
    } catch (error) {
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass: false,
        confirmationEligible: false,
        startedAt: this.startedAt,
        finishedAt: this.now(),
        error: String(error && error.message || error),
        finalSafeState: null
      };
      this._event('ALPHA18_LIVE_GATE_FAILED', 'error', 'UNCAUGHT_GATE_ERROR', { message: result.error });
      return result;
    } finally {
      try { await this._normalizeSafeState(); } catch (_) {}
      if (result) {
        result.finishedAt = result.finishedAt == null ? this.now() : result.finishedAt;
        result.finalSafeState = result.finalSafeState || this._safeStateSnapshot();
        this.lastResult = clone(result);
        this._publish(result);
        this._event('ALPHA18_LIVE_GATE_FINISHED', result.pass ? 'info' : 'error', result.pass ? 'PASS' : 'FAIL', { confirmationEligible: result.confirmationEligible, expansion: result.expansionCanary && result.expansionCanary.state || null });
      }
      this.phase = 'COMPLETE';
      this.running = false;
    }
  }

  status() {
    return {
      schemaVersion: 1,
      release: RELEASE_VERSION,
      requiredAck: ALPHA18_LIVE_GATE_ACK,
      running: this.running,
      phase: this.phase,
      startedAt: this.startedAt,
      observationMs: this.observationMs,
      requiredObservationMs: REQUIRED_OBSERVATION_MS,
      testMode: this.testMode,
      lastResult: clone(this.lastResult)
    };
  }

  result() { return clone(this.lastResult); }
  resultText() { return this.lastResultText; }
}

module.exports = {
  Alpha18CombinedLiveGate,
  ALPHA18_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};
