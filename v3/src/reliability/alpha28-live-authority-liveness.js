'use strict';

const { Alpha28LedgerFarmerFixes } = require('./alpha28-ledger-farmer-fixes');
const { Alpha28MerchantTransfers } = require('./alpha28-merchant-transfers');
const { Alpha28CrossMapFarmerProgression } = require('./alpha28-cross-map-farmer');
const { Alpha28BrainCloud } = require('./alpha28-brain-cloud');
const { installAlpha2023IdleDeadlockRecovery } = require('./alpha20-23-idle-deadlock-recovery');
const { installAlpha2033CombatLogisticsRegressionHotfix } = require('./alpha20-33-combat-logistics-regression-hotfix');

const ALPHA28_MODE = 'alpha28-live-authority-liveness-v1';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function failureReason(value, fallback = 'CONTROLLED_EXECUTION_FAILED') {
  if (value == null) return fallback;
  if (value instanceof Error && value.message) return String(value.message);
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const code = typeof value.code === 'string' ? value.code.trim() : '';
    const message = typeof value.message === 'string' ? value.message.trim() : '';
    if (code && message) return `${code}: ${message}`;
    if (message) return message;
    if (code) return code;
    for (const key of ['reason', 'error']) {
      const nested = value[key];
      if (nested == null || nested === value) continue;
      const resolved = failureReason(nested, '');
      if (resolved) return resolved;
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== '{}') return serialized.slice(0, 512);
    } catch (_) {}
  }
  const text = String(value || '');
  return !text || text === '[object Object]' ? fallback : text;
}

function installMerchantFailureReasonNormalization(runtime) {
  const merchant = runtime && runtime.controlledMerchant;
  if (!merchant || merchant.__alpha28FailureReasonNormalization || typeof merchant._timeout !== 'function') return false;
  const baseTimeout = merchant._timeout.bind(merchant);
  merchant._timeout = async (promise, label) => {
    const fallback = `${label || 'CONTROLLED'}_FAILED`;
    try {
      const response = await baseTimeout(promise, label);
      if (!response || response.failed !== true || response.reason == null || typeof response.reason !== 'object') return response;
      return { ...response, reason: failureReason(response.reason, fallback) };
    } catch (error) {
      if (error instanceof Error && error.message && error.message !== '[object Object]') throw error;
      throw new Error(failureReason(error, fallback));
    }
  };
  merchant.__alpha28FailureReasonNormalization = true;
  return true;
}

function installScopedControlledAuthorityGuard(runtime) {
  if (!runtime || runtime.__alpha28ScopedControlledAuthorityGuard || typeof runtime._controlledSubsystemHealth !== 'function') return false;
  if (!runtime.controlledMerchant || !runtime.controlledTravel || !runtime.globalSupervisor || !runtime.adapter) return false;

  runtime._guardControlledAuthority = function alpha28ScopedControlledAuthorityGuard() {
    const health = this._controlledSubsystemHealth();
    const supervisor = this.globalSupervisor.status();
    let globalReason = null;
    if (this.adapter.mode !== 'active') globalReason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) globalReason = 'SUPERVISOR_NOT_HEALTHY';

    const economyReasons = health && health.economy && Array.isArray(health.economy.reasons)
      ? health.economy.reasons.map(String)
      : [];
    const scopedFamilyOnly = economyReasons.length > 0
      && economyReasons.every((reason) => /^(SELL|BANK|UPGRADE|COMPOUND|EXCHANGE)_CIRCUIT_OPEN$/.test(reason));
    const economyReason = globalReason
      || (health.economy.state === 'DEGRADED' && !scopedFamilyOnly ? 'ECONOMY_CIRCUIT_OPEN' : null);
    const travelReason = globalReason || (health.travel.state === 'DEGRADED' ? 'TRAVEL_CIRCUIT_OPEN' : null);

    if (economyReason && this.controlledMerchant.status().enabled) this.controlledMerchant.disable(economyReason);
    if (travelReason && this.controlledTravel.status().enabled) {
      Promise.resolve(this.controlledTravel.disable(travelReason)).catch((error) => {
        if (this.log && typeof this.log.emit === 'function') {
          this.log.emit({
            component: 'controlled-travel',
            event: 'CONTROLLED_TRAVEL_GUARD_DISABLE_FAILED',
            severity: 'error',
            reason: travelReason,
            data: { message: failureReason(error, 'CONTROLLED_TRAVEL_GUARD_DISABLE_FAILED') }
          });
        }
      });
    }

    this.lastEconomyGuardReason = economyReason;
    this.lastTravelGuardReason = travelReason;
    this.lastControlledGuardReason = economyReason || travelReason;
    return {
      reason: this.lastControlledGuardReason,
      economyGuardReason: economyReason,
      travelGuardReason: travelReason,
      health
    };
  };
  runtime.__alpha28ScopedControlledAuthorityGuard = true;
  return true;
}

class Alpha28LiveAuthorityLiveness {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.stats = {
      ledgerSignatureFixes: 0, ledgerRecoveredSellClassifications: 0, ledgerRecoveredBankClassifications: 0,
      semanticRegroupPreserved: 0, falseAreaPressureSuppressed: 0, plannedTargetFallbackSelections: 0,
      arbitraryTransferRequests: 0, arbitraryTransferAttempts: 0, arbitraryTransfersCommitted: 0, arbitraryTransferExpired: 0,
      crossMapObjectivesPublished: 0, crossMapObjectivesReceived: 0, crossMapTravelAttempts: 0, crossMapTravelCompleted: 0, crossMapTravelFailedSafe: 0,
      brainCloudSettingPatches: 0, brainCanaryPlannerDecisions: 0, tickErrors: 0
    };
    const shared = { now: this.now, log: this.log, stats: this.stats, options };
    this.idleDeadlockRecovery = installAlpha2023IdleDeadlockRecovery(runtime);
    this.scopedControlledAuthorityGuard = installScopedControlledAuthorityGuard(runtime);
    this.merchantFailureReasonNormalization = installMerchantFailureReasonNormalization(runtime);
    this.fixes = new Alpha28LedgerFarmerFixes(runtime, shared);
    this.transfers = new Alpha28MerchantTransfers(runtime, shared);
    this.crossMap = new Alpha28CrossMapFarmerProgression(runtime, shared);
    this.brainCloud = new Alpha28BrainCloud(runtime, shared);
    this.combatLogisticsRegression = installAlpha2033CombatLogisticsRegressionHotfix(runtime, {
      parentAlpha27: options.parentAlpha27,
      goldWindowMs: 30000
    });
    this._patchRuntimeTick();
    this._event('ALPHA28_LIVE_AUTHORITY_LIVENESS_INSTALLED', 'warn', 'OPERATOR_REQUESTED_AUTHORITY_ON', this.status());
  }
  _event(event, severity='info', reason=null, data={}) { try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component:'alpha28-live-authority', event, severity, reason, data }); } catch (_) {} }
  _patchRuntimeTick() {
    if (this.runtime.__alpha28TickInstalled || typeof this.runtime.tick !== 'function') return false;
    const base = this.runtime.tick.bind(this.runtime);
    this.runtime.tick = (...args) => {
      const result = base(...args);
      try { this.fixes.ensurePatches(); } catch (_) { this.stats.tickErrors += 1; }
      try { this.brainCloud.tick(); } catch (_) { this.stats.tickErrors += 1; }
      try { this.crossMap.tick(); } catch (_) { this.stats.tickErrors += 1; }
      Promise.resolve().then(() => this.transfers.tick()).catch(() => { this.stats.tickErrors += 1; });
      return result;
    };
    this.runtime.__alpha28TickInstalled = true;
    return true;
  }
  status() {
    return {
      schemaVersion:1,
      mode:ALPHA28_MODE,
      fixes:this.fixes.status(),
      idleDeadlockRecovery:this.idleDeadlockRecovery && this.idleDeadlockRecovery.status ? this.idleDeadlockRecovery.status() : null,
      controlledAuthority:{ scopedEconomyTravelGuards:this.scopedControlledAuthorityGuard, merchantFailureReasonNormalization:this.merchantFailureReasonNormalization },
      merchantTransfers:this.transfers.status(),
      crossMapFarmer:this.crossMap.status(),
      brainCloud:this.brainCloud.status(),
      combatLogisticsRegression:this.combatLogisticsRegression && this.combatLogisticsRegression.status ? this.combatLogisticsRegression.status() : null,
      policies:{ targetSafetyBypassAdded:false, combatRiskBypassAdded:false, arbitraryTransferExternalPlayersAllowed:false, crossMapServerChangeAllowed:false, followersChooseIndependentProgression:false, brainDirectExecutorAccess:false, cloudFailureStopsLocalBot:false, economyCircuitDisablesTravel:false },
      stats:{...this.stats}
    };
  }
}

function installAlpha28LiveAuthorityLiveness(runtime, options={}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha28LiveAuthorityLiveness) return runtime.alpha28LiveAuthorityLiveness;
  const module = new Alpha28LiveAuthorityLiveness(runtime, options);
  runtime.alpha28LiveAuthorityLiveness = module;
  return module;
}
module.exports = {
  ALPHA28_MODE,
  failureReason,
  installMerchantFailureReasonNormalization,
  installScopedControlledAuthorityGuard,
  Alpha28LiveAuthorityLiveness,
  installAlpha28LiveAuthorityLiveness
};
