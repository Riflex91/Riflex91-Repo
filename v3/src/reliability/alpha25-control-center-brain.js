'use strict';

const { ControlPlaneConfig } = require('../control/control-plane-config');
const { CloudControlPlane } = require('../control/cloud-control-plane');
const { StrategicBrainV2 } = require('../brain/strategic-brain-v2');
const { boundedOptions, synchronizeLegacyUpgradePolicy, synchronizeLegacyCompoundPolicy } = require('./alpha27-combat-merchant-convergence');

const ALPHA25_MODE = 'alpha25-control-center-brain-v2';

class Alpha25ControlCenterBrain {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.installedAt = this.now();
    this.legacyBrain = runtime.brain || null;
    this.controlPlane = runtime.controlPlane || new ControlPlaneConfig({ root: runtime.root, now: this.now, log: this.log });
    runtime.controlPlane = this.controlPlane;
    this.brain = runtime.strategicBrainV2 || new StrategicBrainV2({ runtime, root: runtime.root, now: this.now, log: this.log, controlPlane: this.controlPlane, legacyBrain: this.legacyBrain });
    runtime.legacyShadowBrain = this.legacyBrain;
    runtime.strategicBrainV2 = this.brain;
    runtime.brain = this.brain;
    this.cloud = runtime.cloudControlPlane || new CloudControlPlane({ runtime, root: runtime.root, now: this.now, log: this.log, controlPlane: this.controlPlane, brain: this.brain, onSettingsChanged: (changed) => this._applyExtendedSettings(changed) });
    runtime.cloudControlPlane = this.cloud;
    this.lastCycleAt = 0;
    this.stats = { ticks: 0, outcomes: 0, cloudCyclesStarted: 0, cloudCycleErrors: 0, localPatches: 0, remoteExtendedPatches: 0, extendedSettingsApplied: 0 };
    this.controlPlane.applyHot(runtime);
    this._applyExtendedSettings();
    if (this.cloud.autoEnableSuggested && this.cloud.status().ready && this.controlPlane.get('cloud.enabled', false) !== true) {
      const source = this.cloud.legacyCredentialsMigrated ? 'v2-cloud-credential-migration' : 'global-cloud-config';
      this.patchSettings({ 'cloud.enabled': true }, source);
    }
    if (this.log) this.log.emit({ component: 'alpha25-control-center', event: 'ALPHA25_CONTROL_CENTER_BRAIN_INSTALLED', data: this.status() });
  }

  _applyExtendedSettings(keys = null) {
    const selected = Array.isArray(keys) ? new Set(keys.map((row) => typeof row === 'string' ? row : row && row.key).filter(Boolean)) : null;
    const apply = (key, fn) => {
      if (selected && !selected.has(key)) return;
      const value = this.controlPlane.get(key);
      if (value == null) return;
      try { fn(value); this.stats.extendedSettingsApplied += 1; } catch (_) {}
    };
    const farmer = this.runtime.farmer;
    if (farmer && farmer.config) apply('combat.recoveryHpRatio', (value) => { farmer.config.recoverHpRatio = Number(value); });
    const base = this.runtime.merchantEconomyAutonomy;
    if (base && base.cfg) {
      const map = {
        'merchant.lowFreeSlots': 'lowSlots', 'merchant.targetFreeSlots': 'targetSlots', 'merchant.potionLow': 'potionLow', 'merchant.potionTarget': 'potionTarget', 'merchant.goldReserve': 'goldReserve', 'merchant.transferRange': 'transferRange',
        'economy.keepValue': 'keepValue', 'economy.upgradeCap': 'upgradeCap', 'economy.compoundCap': 'compoundCap'
      };
      for (const [key, property] of Object.entries(map)) apply(key, (value) => { base.cfg[property] = Number(value); });
    }

    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    apply('economy.maxUpgrade', (value) => {
      const current = alpha27 && alpha27.options && typeof alpha27.options === 'object' ? alpha27.options : {};
      const limit = boundedOptions({ ...current, maxUpgradeLevel: Number(value) }).maxUpgradeLevel;
      if (alpha27 && alpha27.options) alpha27.options.maxUpgradeLevel = limit;
      const synchronized = synchronizeLegacyUpgradePolicy(this.runtime, limit);
      if (alpha27) alpha27.legacyUpgradePolicySynchronized = synchronized;
    });
    apply('economy.maxCompound', (value) => {
      const current = alpha27 && alpha27.options && typeof alpha27.options === 'object' ? alpha27.options : {};
      const limit = boundedOptions({ ...current, maxCompoundLevel: Number(value) }).maxCompoundLevel;
      if (alpha27 && alpha27.options) alpha27.options.maxCompoundLevel = limit;
      const synchronized = synchronizeLegacyCompoundPolicy(this.runtime, limit);
      if (alpha27) alpha27.legacyCompoundPolicySynchronized = synchronized;
    });

    const economy = this.runtime.economyEquipmentAutonomyV2;
    if (economy && economy.marketHistory) {
      apply('economy.marketMaxTrackedItems', (value) => { economy.marketHistory.maxItems = Math.max(16, Math.min(256, Number(value) || 96)); });
      apply('economy.marketMaxSamples', (value) => { economy.marketHistory.maxSamplesPerItem = Math.max(8, Math.min(128, Number(value) || 48)); });
    }
    if (this.runtime.combatRisk) apply('combat.riskThreshold', (value) => { this.runtime.combatRisk.threshold = Number(value); });
    if (selected) this.stats.remoteExtendedPatches += selected.size;
    return true;
  }

  beforeTick() {
    this.stats.ticks += 1;
    const outcome = this.brain && typeof this.brain.tickOutcome === 'function' ? this.brain.tickOutcome() : null;
    if (outcome) {
      this.stats.outcomes += 1;
      if (this.cloud && Array.isArray(this.cloud.pendingFeedback)) this.cloud.pendingFeedback.push(outcome);
    }
    const now = this.now();
    if (this.cloud && now - this.lastCycleAt >= 1000) {
      this.lastCycleAt = now;
      this.stats.cloudCyclesStarted += 1;
      Promise.resolve(this.cloud.cycle()).catch((error) => {
        this.stats.cloudCycleErrors += 1;
        if (this.log) this.log.emit({ component: 'alpha25-control-center', event: 'CLOUD_CONTROL_PROMISE_REJECTED', severity: 'warn', reason: String(error && error.message || error).slice(0, 240) });
      });
    }
    return !!outcome;
  }

  patchSettings(values = {}, source = 'local-api') {
    const patch = this.controlPlane.patch(values, { source });
    const applied = this.controlPlane.applyHot(this.runtime, patch.changed);
    this._applyExtendedSettings(patch.changed);
    this.stats.localPatches += patch.changed.length;
    return { ...patch, ...applied };
  }

  configureCloud(config = {}) {
    const cloud = this.cloud.configure(config);
    if (cloud.ready) this.patchSettings({ 'cloud.enabled': true }, 'cloud-configure');
    return this.cloud.status();
  }

  status() {
    return {
      schemaVersion: 2,
      mode: ALPHA25_MODE,
      installedAt: this.installedAt,
      controlPlane: this.controlPlane.status(),
      brain: this.brain.status(),
      cloud: this.cloud.status(),
      stats: { ...this.stats },
      policies: {
        dashboardSettingsAreLocallyRevalidated: true,
        remoteExtendedSettingsReachLiveSubsystems: true,
        progressionSettingsReachCurrentAlpha27Policy: true,
        compoundDashboardLimitUsesResultLevelSemantics: true,
        outcomeEvaluationHasSingleOwner: true,
        explicitGlobalCloudConfigEnablesControlPlane: true,
        legacyV2DashboardCredentialsAutoMigrate: true,
        migratedCloudCredentialsAutoEnableControlPlane: true,
        cloudCannotBypassSafety: true,
        brainStrategicOnly: true,
        brainDirectExecutorAccess: false,
        dangerousContentFailClosed: true,
        emergencyRetreatPriorityPreserved: true,
        commandCharacterAuthorityWidened: false
      }
    };
  }
}

function installAlpha25ControlCenterBrain(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha25ControlCenterBrain) return runtime.alpha25ControlCenterBrain;
  const module = new Alpha25ControlCenterBrain(runtime, options);
  runtime.alpha25ControlCenterBrain = module;
  return module;
}

module.exports = { ALPHA25_MODE, Alpha25ControlCenterBrain, installAlpha25ControlCenterBrain };