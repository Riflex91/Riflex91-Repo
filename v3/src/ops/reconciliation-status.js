'use strict';

const RECONCILIATION_STATUS_SCHEMA_VERSION = 1;
const RECONCILIATION_STATUS_TYPE = 'AIO_V3_RECONCILIATION_STATUS';
const ACTIVE_LIFECYCLE_STATES = new Set(['RESERVED', 'EXECUTING', 'VERIFYING', 'RECOVERING']);
const ACTIVE_MERCHANT_SERVICE_STATES = new Set(['RESERVED', 'EXECUTING', 'VERIFYING', 'RECOVERING']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bounded(value, max = 128) {
  return String(value == null ? '' : value).slice(0, max);
}

function safeStatus(target) {
  try {
    if (!target || typeof target.status !== 'function') return null;
    const value = target.status();
    return value && typeof value === 'object' ? value : null;
  } catch (_) {
    return null;
  }
}

function count(status, name) {
  return status ? Math.max(0, Math.floor(finite(status[name], 0))) : 0;
}

function stateCount(status, name) {
  const states = status && status.states;
  return states && typeof states === 'object' ? Math.max(0, Math.floor(finite(states[name], 0))) : 0;
}

function circuitOpen(value) {
  return !!(value && typeof value === 'object' && (value.open === true || value.circuitOpen === true));
}

function circuitSummary(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    open: circuitOpen(value),
    openUntil: value.openUntil == null && value.circuitUntil == null ? null : finite(value.openUntil == null ? value.circuitUntil : value.openUntil, null),
    reason: bounded(value.reason || value.circuitReason || '', 96) || null
  };
}

function safeStability(runtime) {
  try {
    const adapter = runtime && runtime.adapter;
    if (!adapter || typeof adapter.stabilityStatus !== 'function') return null;
    const value = adapter.stabilityStatus();
    return value && typeof value === 'object' ? value : null;
  } catch (_) {
    return null;
  }
}

function buildReconciliationStatus(runtime, now = () => Date.now(), recoveryTarget = null) {
  const observedAt = finite(typeof now === 'function' ? now() : Date.now(), Date.now());
  const blockers = [];
  const add = (value) => {
    const code = bounded(value, 96);
    if (code && !blockers.includes(code) && blockers.length < 32) blockers.push(code);
  };

  if (!runtime || typeof runtime !== 'object') {
    add('RUNTIME_UNAVAILABLE');
    return {
      schemaVersion: RECONCILIATION_STATUS_SCHEMA_VERSION,
      type: RECONCILIATION_STATUS_TYPE,
      observedAt,
      actionAuthority: false,
      rawGameplayActionAuthority: false,
      observedClean: false,
      blockers,
      detail: { runtimeAvailable: false }
    };
  }

  const economy = safeStatus(runtime.transactionEngine);
  const bankExpansion = safeStatus(runtime.bankExpansionTransactions);
  const merchantJournal = safeStatus(runtime.merchantSpaceRecoveryJournal);
  const spaceRecovery = safeStatus(runtime.controlledMerchantSpaceRecovery);
  const consolidation = safeStatus(runtime.controlledBankConsolidation);
  const travel = safeStatus(runtime.safeTravel);
  const lifecycle = safeStatus(runtime.controlledPartyLifecycle);
  const hasMerchantService = Object.prototype.hasOwnProperty.call(runtime, 'controlledMerchantService');
  const merchantService = hasMerchantService ? safeStatus(runtime.controlledMerchantService) : null;
  const recoveryStatus = safeStatus(recoveryTarget);
  const stability = Object.prototype.hasOwnProperty.call(runtime, 'adapter') ? safeStability(runtime) : null;
  const persistence = Object.prototype.hasOwnProperty.call(runtime, 'persistence') ? safeStatus(runtime.persistence) : null;

  if (!economy) add('ECONOMY_STATUS_UNAVAILABLE');
  else {
    if (count(economy, 'active') > 0) add('ECONOMY_TRANSACTION_ACTIVE');
    if (count(economy, 'recovering') > 0) add('ECONOMY_TRANSACTION_RECOVERING');
    const circuits = economy.circuits && typeof economy.circuits === 'object' ? economy.circuits : {};
    for (const [family, breaker] of Object.entries(circuits)) {
      if (circuitOpen(breaker)) add('ECONOMY_' + bounded(family, 24).toUpperCase().replace(/[^A-Z0-9]+/g, '_') + '_CIRCUIT_OPEN');
    }
  }

  if (!bankExpansion) add('BANK_EXPANSION_STATUS_UNAVAILABLE');
  else {
    if (count(bankExpansion, 'active') > 0) add('BANK_EXPANSION_ACTIVE');
    if (count(bankExpansion, 'recovering') > 0) add('BANK_EXPANSION_RECOVERING');
    if (circuitOpen(bankExpansion.breaker)) add('BANK_EXPANSION_CIRCUIT_OPEN');
  }

  if (!merchantJournal) add('MERCHANT_SPACE_RECOVERY_STATUS_UNAVAILABLE');
  else {
    if (count(merchantJournal, 'active') > 0) add('MERCHANT_SPACE_RECOVERY_ACTIVE');
    if (count(merchantJournal, 'recovering') > 0 || stateCount(merchantJournal, 'RECOVERING') > 0) add('MERCHANT_SPACE_RECOVERY_RECOVERING');
    if (circuitOpen(merchantJournal.breaker)) add('MERCHANT_SPACE_RECOVERY_CIRCUIT_OPEN');
  }

  if (!spaceRecovery) add('CONTROLLED_SPACE_RECOVERY_STATUS_UNAVAILABLE');
  else if (spaceRecovery.busy === true) add('CONTROLLED_MERCHANT_SPACE_RECOVERY_BUSY');

  if (!consolidation) add('BANK_CONSOLIDATION_STATUS_UNAVAILABLE');
  else if (consolidation.busy === true) add('BANK_CONSOLIDATION_BUSY');

  if (!travel) add('TRAVEL_STATUS_UNAVAILABLE');
  else {
    if (count(travel, 'active') > 0) add('TRAVEL_ACTIVE');
    if (circuitOpen(travel.circuit)) add('TRAVEL_CIRCUIT_OPEN');
  }

  if (!lifecycle) add('PARTY_LIFECYCLE_STATUS_UNAVAILABLE');
  else {
    if (lifecycle.busy === true) add('PARTY_LIFECYCLE_BUSY');
    const lifecycleState = bounded(lifecycle.operation && lifecycle.operation.state || '', 32);
    if (ACTIVE_LIFECYCLE_STATES.has(lifecycleState)) add('PARTY_LIFECYCLE_RECOVERY_REQUIRED');
    if (circuitOpen(lifecycle.breaker)) add('PARTY_LIFECYCLE_CIRCUIT_OPEN');
  }

  if (hasMerchantService) {
    if (!merchantService) add('MERCHANT_SERVICE_STATUS_UNAVAILABLE');
    else {
      if (merchantService.busy === true) add('MERCHANT_SERVICE_BUSY');
      const serviceState = bounded(merchantService.activeOperation && merchantService.activeOperation.state || '', 32);
      if (ACTIVE_MERCHANT_SERVICE_STATES.has(serviceState)) add('MERCHANT_SERVICE_RECOVERY_REQUIRED');
      if (circuitOpen(merchantService.circuit)) add('MERCHANT_SERVICE_CIRCUIT_OPEN');
    }
  }

  if (Object.prototype.hasOwnProperty.call(runtime, 'adapter')) {
    if (!stability) add('STABILITY_STATUS_UNAVAILABLE');
    else if (circuitOpen(stability.movement)) add('MOVEMENT_CIRCUIT_OPEN');
  }
  if (Object.prototype.hasOwnProperty.call(runtime, 'persistence')) {
    if (!persistence) add('PERSISTENCE_STATUS_UNAVAILABLE');
    else if (persistence.saveCircuitOpen === true) add('PERSISTENCE_SAVE_CIRCUIT_OPEN');
  }

  let liveGate = null;
  try {
    if (typeof runtime.alpha20LiveGateStatus === 'function') liveGate = runtime.alpha20LiveGateStatus();
  } catch (_) {
    liveGate = null;
  }
  if (!liveGate || typeof liveGate !== 'object') add('ALPHA20_LIVE_GATE_STATUS_UNAVAILABLE');
  else if (liveGate.running === true) add('ALPHA20_LIVE_GATE_RUNNING');

  if (recoveryStatus && recoveryStatus.degradedSince != null) add('SAFE_RECOVERY_INCIDENT_ACTIVE');

  return {
    schemaVersion: RECONCILIATION_STATUS_SCHEMA_VERSION,
    type: RECONCILIATION_STATUS_TYPE,
    observedAt,
    actionAuthority: false,
    rawGameplayActionAuthority: false,
    observedClean: blockers.length === 0,
    blockers,
    detail: {
      runtimeAvailable: true,
      economy: economy ? {
        active: count(economy, 'active'),
        recovering: count(economy, 'recovering'),
        openCircuits: Object.entries(economy.circuits && typeof economy.circuits === 'object' ? economy.circuits : {}).filter(([, value]) => circuitOpen(value)).map(([name]) => bounded(name, 24))
      } : null,
      bankExpansion: bankExpansion ? { active: count(bankExpansion, 'active'), recovering: count(bankExpansion, 'recovering'), circuit: circuitSummary(bankExpansion.breaker) } : null,
      merchantSpaceRecovery: merchantJournal ? {
        active: count(merchantJournal, 'active'),
        recovering: Math.max(count(merchantJournal, 'recovering'), stateCount(merchantJournal, 'RECOVERING'))
      } : null,
      controlledSpaceRecovery: spaceRecovery ? { busy: spaceRecovery.busy === true, enabled: spaceRecovery.enabled === true } : null,
      bankConsolidation: consolidation ? { busy: consolidation.busy === true, enabled: consolidation.enabled === true } : null,
      travel: travel ? { active: count(travel, 'active'), circuit: circuitSummary(travel.circuit) } : null,
      partyLifecycle: lifecycle ? {
        busy: lifecycle.busy === true,
        operationState: bounded(lifecycle.operation && lifecycle.operation.state || '', 32) || null,
        developmentSessionActive: !!lifecycle.developmentSession,
        circuit: circuitSummary(lifecycle.breaker)
      } : null,
      merchantService: hasMerchantService ? (merchantService ? {
        busy: merchantService.busy === true,
        enabled: merchantService.enabled === true,
        operationState: bounded(merchantService.activeOperation && merchantService.activeOperation.state || '', 32) || null,
        circuit: circuitSummary(merchantService.circuit)
      } : null) : null,
      stability: stability ? { movement: circuitSummary(stability.movement) } : null,
      persistence: persistence ? { saveCircuitOpen: persistence.saveCircuitOpen === true, saveCircuitUntil: persistence.saveCircuitUntil == null ? null : finite(persistence.saveCircuitUntil, null) } : null,
      liveGate: liveGate ? { running: liveGate.running === true, phase: bounded(liveGate.phase || '', 48) || null } : null,
      safeRecovery: recoveryStatus ? {
        enabled: recoveryStatus.enabled === true,
        degradedSince: recoveryStatus.degradedSince == null ? null : finite(recoveryStatus.degradedSince, null),
        stage: bounded(recoveryStatus.lastPlan && recoveryStatus.lastPlan.stage || '', 48) || null
      } : null
    }
  };
}

module.exports = {
  RECONCILIATION_STATUS_SCHEMA_VERSION,
  RECONCILIATION_STATUS_TYPE,
  buildReconciliationStatus
};
