'use strict';

const { RELEASE_VERSION } = require('../release-version');

const ALPHA19_LIVE_GATE_ACK = 'ALPHA19_FULL_LIVE_GATE';
const SPACE_RECOVERY_ACK = 'ALPHA19_SPACE_RECOVERY';
const REQUIRED_OBSERVATION_MS = 10 * 60 * 1000;
const DEFAULT_SAMPLE_MS = 5000;
const ALLOWED_SUPERVISOR = new Set(['HEALTHY', 'WATCH']);
const ACTIONS = new Set([
  'DEPOSIT_STACK',
  'DEPOSIT_FREE_SLOT',
  'CONSOLIDATE_BANK_STACKS',
  'EXPAND_BANK_PACK',
  'EMERGENCY_RECLAIM',
  'BLOCK_INVENTORY_PRODUCING_WORK'
]);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function delta(after, before, key) {
  return Math.max(0, finite(after && after[key], 0) - finite(before && before[key], 0));
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

class Alpha19CombinedLiveGate {
  constructor(options = {}) {
    this.runtime = options.runtime;
    this.root = options.root || this.runtime && this.runtime.root || globalThis;
    this.now = options.now || this.runtime && this.runtime.now || (() => Date.now());
    this.testMode = options.testMode === true;
    this.observationMs = this.testMode
      ? Math.max(0, finite(options.observationMs, 0))
      : REQUIRED_OBSERVATION_MS;
    this.sampleMs = this.testMode
      ? Math.max(1, finite(options.sampleMs, 1))
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

  _event(event, severity = 'info', reason = null, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (log && typeof log.emit === 'function') log.emit({ component: 'alpha19-live-gate', event, severity, reason, data });
  }

  _character() {
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _inCombat() {
    const character = this._character() || {};
    if (character.target) return true;
    const entities = this.root && (this.root.parent && this.root.parent.entities || this.root.entities) || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _api(name) {
    const direct = this.root && this.root[name];
    if (typeof direct === 'function') return direct;
    const parent = this.root && this.root.parent && this.root.parent[name];
    return typeof parent === 'function' ? parent : null;
  }

  _controlledSnapshot() {
    const runtime = this.runtime;
    const parent = runtime && runtime.controlledMerchantSpaceRecovery && runtime.controlledMerchantSpaceRecovery.status
      ? runtime.controlledMerchantSpaceRecovery.status() : null;
    const consolidation = runtime && runtime.controlledBankConsolidation && runtime.controlledBankConsolidation.status
      ? runtime.controlledBankConsolidation.status() : null;
    const merchant = runtime && runtime.controlledMerchant && runtime.controlledMerchant.status
      ? runtime.controlledMerchant.status() : null;
    const expansion = runtime && runtime.controlledBankExpansion && runtime.controlledBankExpansion.status
      ? runtime.controlledBankExpansion.status() : null;
    const travel = runtime && runtime.controlledTravel && runtime.controlledTravel.status
      ? runtime.controlledTravel.status() : null;
    return { parent, consolidation, merchant, expansion, travel };
  }

  _circuits() {
    const runtime = this.runtime;
    const tx = runtime && runtime.transactionEngine && runtime.transactionEngine.status ? runtime.transactionEngine.status() : {};
    return {
      sell: tx && tx.circuits && tx.circuits.SELL || null,
      bank: tx && tx.circuits && tx.circuits.BANK || null,
      travel: runtime && runtime.safeTravel && runtime.safeTravel.breaker ? runtime.safeTravel.breaker() : null,
      bankExpansion: runtime && runtime.bankExpansionTransactions && runtime.bankExpansionTransactions.breaker ? runtime.bankExpansionTransactions.breaker() : null,
      spaceRecovery: runtime && runtime.merchantSpaceRecoveryJournal && runtime.merchantSpaceRecoveryJournal.breaker ? runtime.merchantSpaceRecoveryJournal.breaker() : null
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
        spaceRecoveryEnabled: !!(controlled.parent && controlled.parent.enabled),
        expansionPurchaseAuthority: !!(controlled.parent && controlled.parent.expansionPurchaseAuthority),
        emergencyReclaimAuthority: !!(controlled.parent && controlled.parent.emergencyReclaimAuthority),
        consolidationEnabled: !!(controlled.consolidation && controlled.consolidation.enabled),
        merchantEnabled: !!(controlled.merchant && controlled.merchant.enabled),
        expansionEnabled: !!(controlled.expansion && controlled.expansion.enabled),
        travelEnabled: !!(controlled.travel && controlled.travel.enabled)
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
    try { if (runtime.controlledMerchantSpaceRecovery && runtime.controlledMerchantSpaceRecovery.disable) runtime.controlledMerchantSpaceRecovery.disable('ALPHA19_LIVE_GATE_SAFE_STATE'); } catch (_) {}
    try { if (runtime.controlledBankConsolidation && runtime.controlledBankConsolidation.disable) runtime.controlledBankConsolidation.disable('ALPHA19_LIVE_GATE_SAFE_STATE'); } catch (_) {}
    try { if (runtime.controlledBankExpansion && runtime.controlledBankExpansion.disable) runtime.controlledBankExpansion.disable('ALPHA19_LIVE_GATE_SAFE_STATE'); } catch (_) {}
    try { if (runtime.controlledMerchant && runtime.controlledMerchant.disable) runtime.controlledMerchant.disable('ALPHA19_LIVE_GATE_SAFE_STATE'); } catch (_) {}
    try { if (runtime.controlledTravel && runtime.controlledTravel.disable) await Promise.resolve(runtime.controlledTravel.disable('ALPHA19_LIVE_GATE_SAFE_STATE')).catch(() => {}); } catch (_) {}
    try { if (runtime.setMode) runtime.setMode('shadow'); } catch (_) {}
    try { if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false); } catch (_) {}
  }

  _precheck() {
    const runtime = this.runtime;
    const character = this._character();
    const supervisor = runtime && runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : {};
    const observation = runtime && runtime._observeBankCapacity ? runtime._observeBankCapacity() : null;
    const parentStatus = runtime && runtime.controlledMerchantSpaceRecovery && runtime.controlledMerchantSpaceRecovery.status
      ? runtime.controlledMerchantSpaceRecovery.status() : null;
    const failures = [];
    if (!runtime) failures.push('RUNTIME_UNAVAILABLE');
    if (!character) failures.push('CHARACTER_UNAVAILABLE');
    if (character && String(character.ctype || character.type || '').toLowerCase() !== 'merchant') failures.push('MERCHANT_REQUIRED');
    if (character && (character.rip === true || character.dead === true)) failures.push('CHARACTER_DEAD');
    if (character && (!character.bank || typeof character.bank !== 'object')) failures.push('BANK_CONTEXT_REQUIRED');
    if (this._inCombat()) failures.push('COMBAT_ACTIVE');
    if (!ALLOWED_SUPERVISOR.has(String(supervisor && supervisor.state || ''))) failures.push('SUPERVISOR_NOT_HEALTHY');
    if (!observation || !Array.isArray(observation.packs) || observation.packs.length === 0) failures.push('BANK_PACK_CATALOG_UNAVAILABLE');
    if (!observation || observation.actionAuthority !== false) failures.push('BANK_CAPACITY_AUTHORITY_INVARIANT_FAILED');
    if (!parentStatus || parentStatus.enabled) failures.push('SPACE_RECOVERY_NOT_DEFAULT_OFF');
    if (parentStatus && (parentStatus.expansionPurchaseAuthority || parentStatus.emergencyReclaimAuthority)) failures.push('DESTRUCTIVE_BUDGET_NOT_DEFAULT_OFF');
    if (!runtime || !runtime.merchantSpaceRecoveryJournal || !runtime.merchantSpaceRecoveryJournal.breaker) failures.push('SPACE_RECOVERY_JOURNAL_UNAVAILABLE');
    else if (runtime.merchantSpaceRecoveryJournal.breaker().open) failures.push('SPACE_RECOVERY_CIRCUIT_OPEN');
    if (!this._api('bank_store')) failures.push('BANK_STORE_API_UNAVAILABLE');
    return {
      pass: failures.length === 0,
      failures,
      character: character ? {
        name: character.name || null,
        ctype: character.ctype || character.type || null,
        map: character.map || null,
        gold: finite(character.gold, 0),
        isize: finite(character.isize, Array.isArray(character.items) ? character.items.length : 0)
      } : null,
      supervisor: clone(supervisor),
      bankObservation: clone(observation),
      spaceRecovery: clone(parentStatus)
    };
  }

  _wrongAckProbe() {
    const parent = this.runtime && this.runtime.controlledMerchantSpaceRecovery;
    if (!parent || typeof parent.configure !== 'function') return { pass: false, reason: 'SPACE_RECOVERY_UNAVAILABLE' };
    const result = parent.configure({ enabled: true, ack: 'WRONG_ACK_ALPHA19_LIVE_GATE', allowExpansionPurchase: true, allowEmergencyReclaim: true });
    const status = parent.status();
    const pass = !status.enabled && !status.expansionPurchaseAuthority && !status.emergencyReclaimAuthority;
    parent.disable('ALPHA19_LIVE_GATE_WRONG_ACK_PROBE_COMPLETE');
    return { pass, reason: pass ? 'WRONG_ACK_REJECTED' : 'WRONG_ACK_UNEXPECTEDLY_ENABLED', status: clone(result) };
  }

  _refreshPlanning() {
    const runtime = this.runtime;
    try { if (runtime && typeof runtime.tick === 'function') runtime.tick(); } catch (_) {}
    try { if (runtime && typeof runtime._planInventoryAndGear === 'function') runtime._planInventoryAndGear(); } catch (_) {}
  }

  _sourceProbe(config = {}) {
    const runtime = this.runtime;
    this._refreshPlanning();
    const ledger = runtime && runtime.inventoryLedger;
    const character = this._character() || {};
    const status = ledger && ledger.status ? ledger.status() : null;
    const rows = ledger && ledger.list ? ledger.list(512) : [];
    const wantedIndex = config.sourceIndex == null ? null : Number(config.sourceIndex);
    const candidates = rows.filter((row) => {
      if (!row || row.character !== character.name || row.disposition !== 'BANK' || row.metadataKnown !== true) return false;
      if (!Number.isInteger(Number(row.index)) || Number(row.index) < 0) return false;
      if (wantedIndex != null && Number(row.index) !== wantedIndex) return false;
      const size = Number.isFinite(Number(character.isize)) ? Math.max(0, Math.floor(Number(character.isize))) : Array.isArray(character.items) ? character.items.length : 0;
      if (Number(row.index) >= size) return false;
      const live = Array.isArray(character.items) ? character.items[Number(row.index)] : null;
      if (!live || String(live.name || '') !== String(row.name || '')) return false;
      const liveLevel = Math.max(0, Math.floor(finite(live.level, 0)));
      if (liveLevel !== Math.max(0, Math.floor(finite(row.level, 0)))) return false;
      return true;
    });
    const selected = candidates[0] || null;
    const failures = [];
    if (!status) failures.push('INVENTORY_LEDGER_UNAVAILABLE');
    else if (status.stale) failures.push('INVENTORY_LEDGER_STALE');
    if (wantedIndex != null && !Number.isInteger(wantedIndex)) failures.push('SOURCE_INDEX_INVALID');
    return {
      pass: failures.length === 0,
      failures,
      state: selected ? 'SOURCE_FOUND' : 'NOT_JUSTIFIED',
      reason: selected ? 'FRESH_LEDGER_BANK_SOURCE' : 'NO_FRESH_LEDGER_BANK_SOURCE',
      selected: clone(selected),
      candidateCount: candidates.length,
      ledgerStatus: clone(status)
    };
  }

  _cancelOperation(operationId, reason) {
    const journal = this.runtime && this.runtime.merchantSpaceRecoveryJournal;
    if (!operationId || !journal || typeof journal.cancel !== 'function') return null;
    journal.cancel(operationId, reason);
    return journal.get(operationId);
  }

  _planRecovery(sourceProbe) {
    const runtime = this.runtime;
    const source = sourceProbe && sourceProbe.selected;
    if (!source) return { pass: true, state: 'NOT_JUSTIFIED', reason: sourceProbe && sourceProbe.reason || 'NO_SOURCE', plan: null, operation: null };
    const planned = runtime.planMerchantSpaceRecovery({
      character: source.character,
      index: source.index,
      item: source.name,
      name: source.name,
      level: source.level,
      quantity: source.q,
      depositBlocked: true,
      minimumReserves: {}
    });
    const failures = [];
    if (!planned || planned.accepted !== true || !planned.operation || !planned.operation.id) failures.push(planned && planned.reason || 'SPACE_RECOVERY_PLAN_NOT_RESERVED');
    if (!planned || !planned.plan || !ACTIONS.has(String(planned.plan.action || ''))) failures.push('UNKNOWN_SPACE_RECOVERY_PLAN');
    const plan = planned && planned.plan;
    if (plan && plan.action === 'EMERGENCY_RECLAIM') {
      if (plan.exactlyOneUnit !== true || plan.bulkSellForbidden !== true || !plan.candidate || finite(plan.candidate.quantity, 0) !== 1) failures.push('EMERGENCY_RECLAIM_BOUNDARY_INVALID');
    }
    if (plan && plan.action === 'BLOCK_INVENTORY_PRODUCING_WORK' && plan.globalBotStop !== false) failures.push('SELECTIVE_BLOCK_MUST_NOT_GLOBAL_STOP');
    return {
      pass: failures.length === 0,
      failures,
      state: failures.length ? 'FAILED' : 'PLANNED',
      reason: failures.length ? failures[0] : 'LIVE_PLAN_RESERVED',
      plan: clone(plan),
      operation: clone(planned && planned.operation),
      observation: clone(planned && planned.observation)
    };
  }

  async _recoveryCanary(planProbe, config = {}) {
    const runtime = this.runtime;
    const plan = planProbe && planProbe.plan;
    const operation = planProbe && planProbe.operation;
    if (!plan || !operation) return { state: 'NOT_JUSTIFIED', pass: true, coverageSatisfied: false, reason: 'NO_FRESH_LEDGER_BANK_SOURCE', rawActions: 0 };
    if (plan.action === 'BLOCK_INVENTORY_PRODUCING_WORK') {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_NO_EXECUTABLE_RECOVERY');
      return { state: 'NOT_JUSTIFIED', pass: true, coverageSatisfied: false, reason: 'LIVE_PLANNER_SELECTED_SELECTIVE_BLOCK', plan: clone(plan), rawActions: 0 };
    }
    if (plan.action === 'EXPAND_BANK_PACK' && plan.requiresTravel === true) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_WRONG_FLOOR_NO_TRAVEL');
      return { state: 'NOT_EXECUTED', pass: true, coverageSatisfied: false, reason: 'WRONG_BANK_FLOOR_NO_TRAVEL_AUTHORITY', plan: clone(plan), rawActions: 0 };
    }
    if (config.allowControlledRecovery !== true) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_RECOVERY_NOT_AUTHORIZED');
      return { state: 'NOT_EXECUTED', pass: true, coverageSatisfied: false, reason: 'OPERATOR_DID_NOT_ALLOW_CONTROLLED_RECOVERY', plan: clone(plan), rawActions: 0 };
    }
    if (plan.action === 'EXPAND_BANK_PACK' && config.allowExpansionPurchase !== true) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_EXPANSION_NOT_AUTHORIZED');
      return { state: 'NOT_EXECUTED', pass: true, coverageSatisfied: false, reason: 'JUSTIFIED_EXPANSION_PURCHASE_NOT_AUTHORIZED', plan: clone(plan), rawActions: 0 };
    }
    if (plan.action === 'EMERGENCY_RECLAIM' && config.allowEmergencyReclaim !== true) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_RECLAIM_NOT_AUTHORIZED');
      return { state: 'NOT_EXECUTED', pass: true, coverageSatisfied: false, reason: 'JUSTIFIED_EMERGENCY_RECLAIM_NOT_AUTHORIZED', plan: clone(plan), rawActions: 0 };
    }
    if (plan.action === 'CONSOLIDATE_BANK_STACKS' && (!this._api('bank_retrieve') || !this._api('bank_store'))) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_CONSOLIDATION_API_UNAVAILABLE');
      return { state: 'NOT_EXECUTED', pass: false, coverageSatisfied: false, reason: 'CONSOLIDATION_API_UNAVAILABLE', plan: clone(plan), rawActions: 0 };
    }
    if (plan.action === 'EXPAND_BANK_PACK' && !this._api('open_bank_pack')) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_EXPANSION_API_UNAVAILABLE');
      return { state: 'NOT_EXECUTED', pass: false, coverageSatisfied: false, reason: 'OPEN_BANK_PACK_API_UNAVAILABLE', plan: clone(plan), rawActions: 0 };
    }
    if (plan.action === 'EMERGENCY_RECLAIM' && !this._api('sell')) {
      this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_SELL_API_UNAVAILABLE');
      return { state: 'NOT_EXECUTED', pass: false, coverageSatisfied: false, reason: 'SELL_API_UNAVAILABLE', plan: clone(plan), rawActions: 0 };
    }

    let enabled = null;
    let execution = null;
    try {
      runtime.setMode('active');
      enabled = runtime.configureControlledMerchantSpaceRecovery({
        enabled: true,
        ack: SPACE_RECOVERY_ACK,
        allowExpansionPurchase: config.allowExpansionPurchase === true,
        allowEmergencyReclaim: config.allowEmergencyReclaim === true
      });
      if (!enabled || enabled.enabled !== true) {
        this._cancelOperation(operation.id, 'ALPHA19_LIVE_GATE_PARENT_ENABLE_FAILED');
        return { state: 'FAILED', pass: false, coverageSatisfied: false, reason: enabled && enabled.enableRejected || 'SPACE_RECOVERY_ENABLE_FAILED', enabled: clone(enabled), rawActions: 0 };
      }
      execution = await runtime.executeMerchantSpaceRecovery(operation.id);
      const finalOperation = runtime.merchantSpaceRecoveryJournal.get(operation.id);
      const rawActions = finite(finalOperation && finalOperation.rawActionCount, 0);
      const reclaimCount = finite(finalOperation && finalOperation.emergencyReclaimCount, 0);
      const invariantFailures = [];
      if (rawActions > 3) invariantFailures.push('RAW_ACTION_BUDGET_EXCEEDED');
      if (reclaimCount > 1) invariantFailures.push('EMERGENCY_RECLAIM_COUNT_EXCEEDED');
      if (reclaimCount > 0 && config.allowEmergencyReclaim !== true) invariantFailures.push('RECLAIM_OCCURRED_WITHOUT_EXPLICIT_BUDGET');
      if (plan.action === 'EXPAND_BANK_PACK' && rawActions > 0 && config.allowExpansionPurchase !== true) invariantFailures.push('EXPANSION_OCCURRED_WITHOUT_EXPLICIT_BUDGET');
      const committed = !!(execution && execution.committed === true && finalOperation && finalOperation.state === 'COMMITTED');
      const blockedByBudget = !!(execution && execution.blocked && ['EXPANSION_PURCHASE_NOT_AUTHORIZED', 'EMERGENCY_RECLAIM_NOT_AUTHORIZED'].includes(execution.reason));
      const pass = invariantFailures.length === 0 && (committed || blockedByBudget);
      return {
        state: committed ? 'COMMITTED' : blockedByBudget ? 'NOT_EXECUTED' : 'FAILED',
        pass,
        coverageSatisfied: committed,
        reason: execution && execution.reason || (committed ? 'SPACE_RECOVERY_COMMITTED' : 'SPACE_RECOVERY_EXECUTION_FAILED'),
        plan: clone(plan),
        enabled: clone(enabled),
        execution: clone(execution),
        finalOperation: clone(finalOperation),
        rawActions,
        emergencyReclaimCount: reclaimCount,
        invariantFailures
      };
    } finally {
      if (runtime.controlledMerchantSpaceRecovery && runtime.controlledMerchantSpaceRecovery.disable) runtime.controlledMerchantSpaceRecovery.disable('ALPHA19_LIVE_GATE_CANARY_COMPLETE');
      runtime.setMode('shadow');
      if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false);
    }
  }

  _eventsSince(at) {
    const log = this.runtime && this.runtime.log;
    const rows = log && typeof log.list === 'function' ? log.list(4000) : [];
    return rows.filter((row) => {
      if (!row) return false;
      if (row.at != null && Number.isFinite(Number(row.at))) return Number(row.at) >= at;
      if (row.timestamp != null && Number.isFinite(Number(row.timestamp))) return Number(row.timestamp) >= at;
      if (row.ts != null) {
        const parsed = Date.parse(String(row.ts));
        return Number.isFinite(parsed) && parsed >= at;
      }
      return false;
    });
  }

  _sampleViolations(snapshot) {
    const violations = [];
    if (!snapshot) return ['STATUS_UNAVAILABLE'];
    if (snapshot.mode !== 'shadow') violations.push('RUNTIME_LEFT_SHADOW');
    if (snapshot.farmerEnabled) violations.push('FARMER_ENABLED_DURING_OBSERVATION');
    const controlled = snapshot.controlled || {};
    if (controlled.spaceRecoveryEnabled) violations.push('SPACE_RECOVERY_ENABLED_DURING_OBSERVATION');
    if (controlled.expansionPurchaseAuthority) violations.push('EXPANSION_PURCHASE_AUTHORITY_DURING_OBSERVATION');
    if (controlled.emergencyReclaimAuthority) violations.push('EMERGENCY_RECLAIM_AUTHORITY_DURING_OBSERVATION');
    if (controlled.consolidationEnabled) violations.push('CONSOLIDATION_ENABLED_DURING_OBSERVATION');
    if (controlled.merchantEnabled) violations.push('CONTROLLED_MERCHANT_ENABLED_DURING_OBSERVATION');
    if (controlled.expansionEnabled) violations.push('CONTROLLED_BANK_EXPANSION_ENABLED_DURING_OBSERVATION');
    if (controlled.travelEnabled) violations.push('CONTROLLED_TRAVEL_ENABLED_DURING_OBSERVATION');
    if (!ALLOWED_SUPERVISOR.has(String(snapshot.supervisorState || ''))) violations.push('SUPERVISOR_DEGRADED_DURING_OBSERVATION');
    for (const [name, breaker] of Object.entries(snapshot.circuits || {})) if (breaker && breaker.open) violations.push(`${String(name).toUpperCase()}_CIRCUIT_OPEN`);
    if (snapshot.capacity && snapshot.capacity.actionAuthority !== false) violations.push('BANK_CAPACITY_GAINED_ACTION_AUTHORITY');
    return violations;
  }

  async _observeWindow() {
    const runtime = this.runtime;
    const startedAt = this.now();
    const before = this._controlledSnapshot();
    const beforeStats = {
      parent: clone(before.parent && before.parent.stats || {}),
      consolidation: clone(before.consolidation && before.consolidation.stats || {}),
      merchant: clone(before.merchant && before.merchant.stats || {}),
      expansion: clone(before.expansion && before.expansion.stats || {}),
      travel: clone(before.travel && before.travel.stats || {})
    };
    const samples = [];
    const violations = [];
    let elapsed = 0;
    do {
      if (runtime && runtime._observeBankCapacity) runtime._observeBankCapacity();
      const snapshot = this._safeStateSnapshot();
      for (const reason of this._sampleViolations(snapshot)) violations.push({ at: this.now(), reason });
      samples.push(snapshot);
      if (this.observationMs <= 0 || elapsed >= this.observationMs) break;
      const step = Math.min(this.sampleMs, this.observationMs - elapsed);
      await this.sleep(step);
      elapsed += step;
    } while (elapsed <= this.observationMs);

    const finishedAt = this.now();
    const after = this._controlledSnapshot();
    const unexpectedActionDeltas = {
      parentAttempts: delta(after.parent && after.parent.stats, beforeStats.parent, 'attempts'),
      consolidationAttempts: delta(after.consolidation && after.consolidation.stats, beforeStats.consolidation, 'attempts'),
      merchantAttempts: delta(after.merchant && after.merchant.stats, beforeStats.merchant, 'attempts'),
      expansionAttempts: delta(after.expansion && after.expansion.stats, beforeStats.expansion, 'attempts'),
      travelAttempts: delta(after.travel && after.travel.stats, beforeStats.travel, 'attempts')
    };
    for (const [key, value] of Object.entries(unexpectedActionDeltas)) if (value > 0) violations.push({ at: finishedAt, reason: `${key.replace(/Attempts$/, '').toUpperCase()}_ATTEMPT_DURING_PASSIVE_WINDOW` });
    const events = this._eventsSince(startedAt);
    const errorEvents = events.filter((row) => String(row && row.severity || '').toLowerCase() === 'error');
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
    return `=== ALPHA19 FULL LIVE GATE RESULT BEGIN ===\n${JSON.stringify(result, null, 2)}\n=== ALPHA19 FULL LIVE GATE RESULT END ===`;
  }

  _publish(result) {
    this.lastResult = clone(result);
    const text = this._resultText(result);
    this.lastResultText = text;
    try { this.root.AIO_V3_ALPHA19_LIVE_GATE_RESULT = clone(result); } catch (_) {}
    try { this.root.AIO_V3_ALPHA19_LIVE_GATE_RESULT_TEXT = text; } catch (_) {}
    const consoles = [this.root && this.root.console, this.root && this.root.parent && this.root.parent.console].filter(Boolean);
    for (const target of consoles) {
      try { if (target && typeof target.log === 'function') target.log(text); } catch (_) {}
    }
    const gameLog = this.root && (this.root.game_log || this.root.parent && this.root.parent.game_log);
    if (typeof gameLog === 'function') {
      try { gameLog(`[AIO v3 ${RELEASE_VERSION}] ALPHA19 LIVE GATE ${result.pass ? 'PASS' : 'FAIL'} | confirmationEligible=${result.confirmationEligible} | recovery=${result.recoveryCanary && result.recoveryCanary.state || 'n/a'}`); } catch (_) {}
    }
    return text;
  }

  async run(config = {}) {
    if (this.running) return { accepted: false, reason: 'ALPHA19_LIVE_GATE_ALREADY_RUNNING', status: this.status() };
    if (config.ack !== ALPHA19_LIVE_GATE_ACK) return { accepted: false, reason: 'ALPHA19_LIVE_GATE_ACK_REQUIRED', requiredAck: ALPHA19_LIVE_GATE_ACK };
    if (!this.runtime) return { accepted: false, reason: 'RUNTIME_UNAVAILABLE' };

    this.running = true;
    this.phase = 'SAFE_STATE';
    this.startedAt = this.now();
    this.lastResult = null;
    this.lastResultText = null;
    this._event('ALPHA19_LIVE_GATE_STARTED', 'warn', 'EXPLICIT_OPERATOR_ACK', {
      observationMs: this.observationMs,
      allowControlledRecovery: config.allowControlledRecovery === true,
      allowExpansionPurchase: config.allowExpansionPurchase === true,
      allowEmergencyReclaim: config.allowEmergencyReclaim === true,
      testMode: this.testMode
    });

    let result;
    try {
      await this._normalizeSafeState();
      this.phase = 'PRECHECK';
      const precheck = this._precheck();
      const wrongAckProbe = this._wrongAckProbe();
      const sourceProbe = this._sourceProbe(config);
      const planProbe = precheck.pass && wrongAckProbe.pass && sourceProbe.pass ? this._planRecovery(sourceProbe) : { pass: false, state: 'NOT_RUN', reason: 'PRECHECK_FAILED', plan: null, operation: null };
      if (!precheck.pass || !wrongAckProbe.pass || !sourceProbe.pass || !planProbe.pass) {
        if (planProbe.operation && planProbe.operation.id) this._cancelOperation(planProbe.operation.id, 'ALPHA19_LIVE_GATE_PRECHECK_FAILED');
        result = {
          schemaVersion: 1,
          release: RELEASE_VERSION,
          pass: false,
          confirmationEligible: false,
          confirmationBlockers: ['PRECHECK_FAILED'],
          startedAt: this.startedAt,
          finishedAt: this.now(),
          testMode: this.testMode,
          precheck,
          wrongAckProbe,
          sourceProbe,
          planProbe,
          recoveryCanary: { state: 'NOT_RUN', pass: false, coverageSatisfied: false, reason: 'PRECHECK_FAILED' },
          passiveObservation: null,
          finalSafeState: this._safeStateSnapshot()
        };
        return result;
      }

      this.phase = 'OPTIONAL_RECOVERY_CANARY';
      const recoveryCanary = await this._recoveryCanary(planProbe, config);
      await this._normalizeSafeState();

      this.phase = 'PASSIVE_OBSERVATION';
      const passiveObservation = await this._observeWindow();
      await this._normalizeSafeState();
      const finalSafeState = this._safeStateSnapshot();
      const finalViolations = unique(this._sampleViolations(finalSafeState));
      const pass = precheck.pass && wrongAckProbe.pass && sourceProbe.pass && planProbe.pass && recoveryCanary.pass && passiveObservation.pass && finalViolations.length === 0;
      const confirmationBlockers = [];
      if (!sourceProbe.selected) confirmationBlockers.push('NO_FRESH_LEDGER_BANK_SOURCE');
      if (!recoveryCanary.coverageSatisfied) confirmationBlockers.push(recoveryCanary.reason || 'RECOVERY_COVERAGE_NOT_SATISFIED');
      if (!passiveObservation.confirmationDurationSatisfied) confirmationBlockers.push('FULL_10_MIN_OBSERVATION_NOT_SATISFIED');
      if (this.testMode) confirmationBlockers.push('TEST_MODE_NOT_CONFIRMATION_ELIGIBLE');
      const confirmationEligible = pass && confirmationBlockers.length === 0;
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass,
        confirmationEligible,
        confirmationBlockers: unique(confirmationBlockers),
        startedAt: this.startedAt,
        finishedAt: this.now(),
        testMode: this.testMode,
        policy: {
          requiredAck: ALPHA19_LIVE_GATE_ACK,
          controlledRecoveryExplicitlyAllowed: config.allowControlledRecovery === true,
          expansionPurchaseExplicitlyAllowed: config.allowExpansionPurchase === true,
          emergencyReclaimExplicitlyAllowed: config.allowEmergencyReclaim === true,
          forcedCapacityPressure: false,
          forcedInventoryMutation: false,
          travelAuthority: false,
          shellExpansionAuthority: false,
          maxRawActionsPerOperation: 3,
          emergencyReclaimMaxUnitsPerOperation: 1,
          bulkEmergencyReclaimAllowed: false,
          observationRequiredMs: REQUIRED_OBSERVATION_MS
        },
        precheck,
        wrongAckProbe,
        sourceProbe,
        planProbe,
        recoveryCanary,
        passiveObservation,
        finalSafeState,
        finalViolations
      };
      return result;
    } catch (error) {
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass: false,
        confirmationEligible: false,
        confirmationBlockers: ['UNCAUGHT_GATE_ERROR'],
        startedAt: this.startedAt,
        finishedAt: this.now(),
        testMode: this.testMode,
        error: String(error && error.message || error),
        finalSafeState: null
      };
      this._event('ALPHA19_LIVE_GATE_FAILED', 'error', 'UNCAUGHT_GATE_ERROR', { message: result.error });
      return result;
    } finally {
      try { await this._normalizeSafeState(); } catch (_) {}
      if (result) {
        result.finishedAt = result.finishedAt == null ? this.now() : result.finishedAt;
        result.finalSafeState = result.finalSafeState || this._safeStateSnapshot();
        this._publish(result);
        this._event('ALPHA19_LIVE_GATE_FINISHED', result.pass ? 'info' : 'error', result.pass ? 'PASS' : 'FAIL', {
          confirmationEligible: result.confirmationEligible,
          recovery: result.recoveryCanary && result.recoveryCanary.state || null
        });
      }
      this.phase = 'COMPLETE';
      this.running = false;
    }
  }

  status() {
    return {
      schemaVersion: 1,
      release: RELEASE_VERSION,
      requiredAck: ALPHA19_LIVE_GATE_ACK,
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
  Alpha19CombinedLiveGate,
  ALPHA19_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};
