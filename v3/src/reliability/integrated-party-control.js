'use strict';

const { installAlpha2019AccountTransportHotfix } = require('./alpha20-19-account-transport-hotfix');
const { patchAlpha2019LogisticsStabilization } = require('./alpha20-19-logistics-stabilization');
const { patchAdaptiveFarmIntelligence } = require('../autonomy/adaptive-farm-intelligence');
const { installTacticalPartyCombat } = require('../autonomy/tactical-party-combat');
const { installAdvancedPartyMovement } = require('../autonomy/advanced-party-movement');
const { installPartySkillEngine } = require('../autonomy/party-skill-engine');

const INTEGRATED_PARTY_CONTROL_MODE = 'alpha20.16-20.19-integrated-party-control-v1';

class IntegratedPartyControl {
  constructor(runtime, components = {}) {
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.installedAt = this.now();
    this.transportPatched = components.transportPatched === true;
    this.logisticsPatched = components.logisticsPatched === true;
    this.adaptiveFarmPatched = components.adaptiveFarmPatched === true;
    this.tacticalPartyCombat = components.tacticalPartyCombat || null;
    this.advancedPartyMovement = components.advancedPartyMovement || null;
    this.partySkillEngine = components.partySkillEngine || null;
    this._event('INTEGRATED_PARTY_CONTROL_INSTALLED', 'warn', 'ALPHA20_16_TO_20_19_ACTIVE', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'integrated-party-control', event, severity, reason, data }); } catch (_) {}
  }

  status() {
    const logistics = this.runtime.controlledPartyLogistics;
    const farm = this.runtime.farmAreaPressureHotfix;
    return {
      schemaVersion: 1,
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
        logisticsPrototypePatched: this.logisticsPatched,
        logistics: logistics && typeof logistics.status === 'function' ? logistics.status().alpha20_19 || null : null,
        skillEngine: this.partySkillEngine && this.partySkillEngine.status ? this.partySkillEngine.status() : null
      }
    };
  }
}

function installIntegratedPartyControl(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.integratedPartyControl) return runtime.integratedPartyControl;
  const transportPatched = installAlpha2019AccountTransportHotfix();
  const logisticsPatched = patchAlpha2019LogisticsStabilization();
  const adaptiveFarmPatched = patchAdaptiveFarmIntelligence();
  const tacticalPartyCombat = installTacticalPartyCombat(runtime, options.tacticalPartyCombat || {});
  runtime.tacticalPartyCombat = tacticalPartyCombat;
  const advancedPartyMovement = installAdvancedPartyMovement(runtime, options.advancedPartyMovement || {});
  runtime.advancedPartyMovement = advancedPartyMovement;
  const partySkillEngine = installPartySkillEngine(runtime, options.partySkillEngine || {});
  runtime.partySkillEngine = partySkillEngine;
  const controller = new IntegratedPartyControl(runtime, { transportPatched, logisticsPatched, adaptiveFarmPatched, tacticalPartyCombat, advancedPartyMovement, partySkillEngine });
  runtime.integratedPartyControl = controller;
  return controller;
}

module.exports = { IntegratedPartyControl, installIntegratedPartyControl, INTEGRATED_PARTY_CONTROL_MODE };
