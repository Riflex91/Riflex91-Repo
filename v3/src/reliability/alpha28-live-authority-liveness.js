'use strict';

const { Alpha28LedgerFarmerFixes } = require('./alpha28-ledger-farmer-fixes');
const { Alpha28MerchantTransfers } = require('./alpha28-merchant-transfers');
const { Alpha28CrossMapFarmerProgression } = require('./alpha28-cross-map-farmer');
const { Alpha28BrainCloud } = require('./alpha28-brain-cloud');

const ALPHA28_MODE = 'alpha28-live-authority-liveness-v1';

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
    this.fixes = new Alpha28LedgerFarmerFixes(runtime, shared);
    this.transfers = new Alpha28MerchantTransfers(runtime, shared);
    this.crossMap = new Alpha28CrossMapFarmerProgression(runtime, shared);
    this.brainCloud = new Alpha28BrainCloud(runtime, shared);
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
    return { schemaVersion:1, mode:ALPHA28_MODE, fixes:this.fixes.status(), merchantTransfers:this.transfers.status(), crossMapFarmer:this.crossMap.status(), brainCloud:this.brainCloud.status(), policies:{ targetSafetyBypassAdded:false, combatRiskBypassAdded:false, arbitraryTransferExternalPlayersAllowed:false, crossMapServerChangeAllowed:false, followersChooseIndependentProgression:false, brainDirectExecutorAccess:false, cloudFailureStopsLocalBot:false }, stats:{...this.stats} };
  }
}

function installAlpha28LiveAuthorityLiveness(runtime, options={}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha28LiveAuthorityLiveness) return runtime.alpha28LiveAuthorityLiveness;
  const module = new Alpha28LiveAuthorityLiveness(runtime, options);
  runtime.alpha28LiveAuthorityLiveness = module;
  return module;
}
module.exports = { ALPHA28_MODE, Alpha28LiveAuthorityLiveness, installAlpha28LiveAuthorityLiveness };
