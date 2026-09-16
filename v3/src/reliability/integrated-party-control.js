'use strict';

const { installAlpha2019AccountTransportHotfix } = require('./alpha20-19-account-transport-hotfix');
const { installAlpha2057ReliableAccountTransport } = require('./alpha20-57-reliable-account-transport');
const { installAlpha2057RegroupMovementOwnership } = require('./alpha20-57-regroup-movement-ownership');
const { patchAlpha2019LogisticsStabilization } = require('./alpha20-19-logistics-stabilization');
const { patchAdaptiveFarmIntelligence } = require('../autonomy/adaptive-farm-intelligence');
const { installTacticalPartyCombat } = require('../autonomy/tactical-party-combat');
const { installAdvancedPartyMovement } = require('../autonomy/advanced-party-movement');
const { installPartySkillEngine } = require('../autonomy/party-skill-engine');
const { patchAlpha21LivenessGuards, ALPHA21_LIVENESS_MODE } = require('./alpha21-liveness-guards');
const { installAlpha21ProgressionIntelligence } = require('./alpha21-progression-intelligence');

const INTEGRATED_PARTY_CONTROL_MODE = 'alpha20.16-20.19-integrated-party-control-v2';

class IntegratedPartyControl {
  constructor(runtime, components = {}) {
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.installedAt = this.now();
    this.transportPatched = components.transportPatched === true;
    this.reliableTransportPatched = components.reliableTransportPatched === true;
    this.regroupMovementOwnershipPatched = components.regroupMovementOwnershipPatched === true;
    this.logisticsPatched = components.logisticsPatched === true;
    this.adaptiveFarmPatched = components.adaptiveFarmPatched === true;
    this.alpha21Liveness = components.alpha21Liveness || null;
    this.progressionIntelligence = components.progressionIntelligence || null;
    this.tacticalPartyCombat = components.tacticalPartyCombat || null;
    this.advancedPartyMovement = components.advancedPartyMovement || null;
    this.partySkillEngine = components.partySkillEngine || null;
    this._event('INTEGRATED_PARTY_CONTROL_INSTALLED', 'warn', 'ALPHA20_16_TO_ALPHA21_ACTIVE', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'integrated-party-control', event, severity, reason, data }); } catch (_) {}
  }

  status() {
    const logistics = this.runtime.controlledPartyLogistics;
    const farm = this.runtime.farmAreaPressureHotfix;
    return {
      schemaVersion: 2,
      mode: INTEGRATED_PARTY_CONTROL_MODE,
      installedAt: this.installedAt,
      groupAuthority: {
        commonLeader: true,
        commonTarget: true,
        commonFarmDirection: true,
        followerSoloPulls: false,
        followerIndependentFarmTravel: false,
        formationBoundKiting: true
      },
      alpha20_16: farm && typeof farm.status === 'function' ? farm.status().alpha20_16 || null : { prototypePatched: this.adaptiveFarmPatched, awaitingFarmAreaInstance: true },
      alpha20_17: this.tacticalPartyCombat && this.tacticalPartyCombat.status ? this.tacticalPartyCombat.status() : null,
      alpha20_18: this.advancedPartyMovement && this.advancedPartyMovement.status ? this.advancedPartyMovement.status() : null,
      alpha20_19: {
        transportPrototypePatched: this.transportPatched,
        reliableTransportPatched: this.reliableTransportPatched,
        regroupMovementOwnershipPatched: this.regroupMovementOwnershipPatched,
        logisticsPrototypePatched: this.logisticsPatched,
        logistics: logistics && typeof logistics.status === 'function' ? logistics.status().alpha20_19 || null : null,
        skillEngine: this.partySkillEngine && this.partySkillEngine.status ? this.partySkillEngine.status() : null
      },
      alpha21Liveness: {
        mode: ALPHA21_LIVENESS_MODE,
        ...(this.alpha21Liveness || {})
      },
      alpha21Progression: this.progressionIntelligence && typeof this.progressionIntelligence.status === 'function'
        ? this.progressionIntelligence.status()
        : null
    };
  }
}

function installIntegratedPartyControl(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.integratedPartyControl) return runtime.integratedPartyControl;
  const transportPatched = installAlpha2019AccountTransportHotfix();
  const reliableTransportPatched = installAlpha2057ReliableAccountTransport();
  const regroupMovementOwnershipPatched = installAlpha2057RegroupMovementOwnership();
  const logisticsPatched = patchAlpha2019LogisticsStabilization();
  const adaptiveFarmPatched = patchAdaptiveFarmIntelligence();
  const alpha21Liveness = patchAlpha21LivenessGuards();
  const progressionIntelligence = installAlpha21ProgressionIntelligence(runtime, options.progressionIntelligence || {});
  const tacticalPartyCombat = installTacticalPartyCombat(runtime, options.tacticalPartyCombat || {});
  runtime.tacticalPartyCombat = tacticalPartyCombat;
  const advancedPartyMovement = installAdvancedPartyMovement(runtime, options.advancedPartyMovement || {});
  runtime.advancedPartyMovement = advancedPartyMovement;
  const partySkillEngine = installPartySkillEngine(runtime, options.partySkillEngine || {});
  runtime.partySkillEngine = partySkillEngine;
  const controller = new IntegratedPartyControl(runtime, { transportPatched, reliableTransportPatched, regroupMovementOwnershipPatched, logisticsPatched, adaptiveFarmPatched, alpha21Liveness, progressionIntelligence, tacticalPartyCombat, advancedPartyMovement, partySkillEngine });
  runtime.integratedPartyControl = controller;
  return controller;
}

module.exports = { IntegratedPartyControl, installIntegratedPartyControl, INTEGRATED_PARTY_CONTROL_MODE };
