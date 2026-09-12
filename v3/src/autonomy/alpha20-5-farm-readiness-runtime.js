'use strict';

const { Alpha20_5MerchantRuntime } = require('./alpha20-5-merchant-runtime');
const { ControlledFarmerLoot } = require('../farmer/controlled-farmer-loot');
const { ControlledAutoRespawn } = require('../ops/controlled-auto-respawn');
const { ControlledPartyBootstrap } = require('../party/controlled-party-bootstrap');
const {
  createObservableBankCapacityManager,
  installPreFarmingReliability
} = require('../reliability/pre-farming-reliability');
const { installFarmerLocalPlanPriority } = require('../reliability/farmer-local-plan-priority');
const { installLiveNavigationHotfix } = require('../reliability/live-navigation-hotfix');
const { installFarmerTravelSafetyHotfix } = require('../reliability/farmer-travel-safety-hotfix');
const { installDangerousContentHotfix } = require('../reliability/dangerous-content-hotfix');
const { installContentDriftStorageHotfix } = require('../reliability/content-drift-storage-hotfix');
const { installPartyAccountCommunication } = require('../reliability/party-account-communication');
const { installPartyBootstrapFarmerGate } = require('../reliability/party-bootstrap-farmer-gate');

const ALPHA20_5_FARM_READINESS_MODE = 'alpha20.5-farm-readiness';

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

class Alpha20_5FarmReadinessRuntime extends Alpha20_5MerchantRuntime {
  constructor(options = {}) {
    const injectedBankCapacity = options.bankCapacity || createObservableBankCapacityManager(options);
    super({ ...options, bankCapacity: injectedBankCapacity });
    if (!options.bankCapacity && this.bankCapacity) this.bankCapacity.log = this.log;

    this.controlledFarmerLoot = options.controlledFarmerLoot || new ControlledFarmerLoot({
      root: this.root,
      now: this.now,
      log: this.log,
      getMode: () => this.adapter.mode,
      enabled: options.farmerLootEnabled !== false,
      intervalMs: options.farmerLootIntervalMs,
      noChestPollMs: options.farmerLootNoChestPollMs,
      fullInventoryIntervalMs: options.farmerLootFullInventoryIntervalMs,
      failureBackoffMs: options.farmerLootFailureBackoffMs,
      verifyDelayMs: options.farmerLootVerifyDelayMs
    });
    this.controlledAutoRespawn = options.controlledAutoRespawn || new ControlledAutoRespawn({
      root: this.root,
      now: this.now,
      log: this.log,
      getMode: () => this.adapter.mode,
      enabled: options.autoRespawnEnabled !== false,
      deathGraceMs: options.autoRespawnDeathGraceMs,
      retryMs: options.autoRespawnRetryMs,
      maxAttempts: options.autoRespawnMaxAttempts
    });

    this.preFarmingReliability = installPreFarmingReliability(this);
    // Install after the pre-farming wrapper: live logs showed that the old
    // safe-entity cache still left ordinary visible monsters as navigation
    // blockers. This replacement asks the existing TargetSafety + CombatRisk
    // boundaries directly on every Local Farm arbitration pass.
    this.liveNavigationHotfix = installLiveNavigationHotfix(this);
    this.farmerLocalPlanPriority = installFarmerLocalPlanPriority(this);

    // 2026-09 live diagnostics: special fairies inherited LEGACY_ALLOWED,
    // direct Farmer travel requested very large raw moves, content-drift writes
    // exhausted localStorage, and send_cm therefore failed repeatedly. Keep the
    // fixes modular so the proven Alpha.20 action boundaries remain unchanged.
    this.dangerousContentHotfix = installDangerousContentHotfix(this);
    this.farmerTravelSafetyHotfix = installFarmerTravelSafetyHotfix(this, {
      minStep: options.farmerTravelMinStep,
      maxStep: options.farmerTravelMaxStep,
      stepSeconds: options.farmerTravelStepSeconds
    });
    this.contentDriftStorageHotfix = installContentDriftStorageHotfix(this, {
      maxRecordsAfterQuota: options.contentDriftQuotaMaxRecords,
      retryBaseMs: options.contentDriftQuotaRetryBaseMs,
      retryMaxMs: options.contentDriftQuotaRetryMaxMs
    });
    this.partyAccountCommunication = installPartyAccountCommunication(this, {
      telemetryBaseBackoffMs: options.partyTelemetryFailureBackoffMs,
      telemetryMaxBackoffMs: options.partyTelemetryFailureBackoffMaxMs
    });
    this.partyBootstrap = options.partyBootstrap || new ControlledPartyBootstrap({
      runtime: this,
      root: this.root,
      now: this.now,
      log: this.log,
      controlLease: this.partyControlLease,
      transport: this.partyAccountCommunication.transport,
      challengeTtlMs: options.partyBootstrapChallengeTtlMs,
      ackTimeoutMs: options.partyBootstrapAckTimeoutMs,
      verifyTimeoutMs: options.partyBootstrapVerifyTimeoutMs,
      retryBaseMs: options.partyBootstrapRetryBaseMs,
      retryMaxMs: options.partyBootstrapRetryMaxMs,
      maxAttempts: options.partyBootstrapMaxAttempts,
      breakerMs: options.partyBootstrapBreakerMs
    });
    this.partyBootstrapFarmerGate = installPartyBootstrapFarmerGate(this, this.partyBootstrap);
  }

  start() {
    if (this.partyBootstrap) this.partyBootstrap.resume();
    return super.start();
  }

  stop() {
    if (this.partyBootstrap) this.partyBootstrap.cancel('RUNTIME_STOPPED');
    return super.stop();
  }

  tick() {
    this.dangerousContentHotfix.beforeTick();
    this.partyBootstrap.tick();
    this.preFarmingReliability.beforeTick();
    super.tick();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return;
    this.controlledAutoRespawn.tick(snapshot);
    this.controlledFarmerLoot.tick(snapshot);
  }

  farmReadinessStatus() {
    return {
      schemaVersion: 1,
      mode: ALPHA20_5_FARM_READINESS_MODE,
      farmerLoot: this.controlledFarmerLoot.status(),
      autoRespawn: this.controlledAutoRespawn.status(),
      preFarmingReliability: this.preFarmingReliability.status(),
      liveNavigationHotfix: this.liveNavigationHotfix.status(),
      farmerLocalPlanPriority: this.farmerLocalPlanPriority.status(),
      dangerousContentHotfix: this.dangerousContentHotfix.status(),
      farmerTravelSafetyHotfix: this.farmerTravelSafetyHotfix.status(),
      contentDriftStorageHotfix: this.contentDriftStorageHotfix.status(),
      partyAccountCommunication: this.partyAccountCommunication.status(),
      partyBootstrap: this.partyBootstrap.status(),
      partyBootstrapFarmerGate: this.partyBootstrapFarmerGate.status(),
      startupPolicy: {
        recommendedMode: 'active',
        recommendedInitialRuntimeState: 'stopped',
        oneClickStartUsesExistingOperatorRunControl: true,
        startDoesNotGrantMerchantServiceAuthority: true,
        startDoesNotGrantPartyLifecycleAuthority: true,
        startDoesNotGrantEconomyAuthority: true,
        partyBootstrapAuthority: 'bounded-active-owned-invites-only'
      }
    };
  }

  status() {
    const base = super.status();
    return {
      ...base,
      party: {
        ...(base.party || {}),
        bootstrap: this.partyBootstrap.status(),
        accountCommunication: this.partyAccountCommunication.status()
      },
      farmerLoot: this.controlledFarmerLoot.status(),
      autoRespawn: this.controlledAutoRespawn.status(),
      preFarmingReliability: this.preFarmingReliability.status(),
      liveNavigationHotfix: this.liveNavigationHotfix.status(),
      farmerLocalPlanPriority: this.farmerLocalPlanPriority.status(),
      dangerousContentHotfix: this.dangerousContentHotfix.status(),
      farmerTravelSafetyHotfix: this.farmerTravelSafetyHotfix.status(),
      contentDriftStorageHotfix: this.contentDriftStorageHotfix.status(),
      partyBootstrapFarmerGate: this.partyBootstrapFarmerGate.status(),
      alpha20_5: {
        ...(base.alpha20_5 || {}),
        farmReadiness: true,
        farmerLootDefaultOn: true,
        autoRespawnDefaultOn: true,
        autoRespawnBounded: true,
        autoRespawnRequiresActiveMode: true,
        lootMerchantExcluded: true,
        merchantFarmerFsmExcluded: true,
        incidentalMonsterNavigationBlockRemoved: true,
        liveNavigationUsesDirectExistingSafetyBoundaries: true,
        localFarmPlanGetsOneSafeSchedulerTurn: true,
        unsafeOrUnknownVisibleMonsterStillBlocks: true,
        trainingTargetPresenceDoesNotPinNavigation: true,
        dangerousSpecialFairiesFailClosed: true,
        farmerTargetTravelBounded: true,
        partyTrustUsesActiveOwnedCharacters: true,
        partyBootstrapEnabled: true,
        partyBootstrapRequiresFullPartyForFarming: true,
        partyCommunicationPrefersCommandCharacter: true,
        contentDriftQuotaRecoveryBounded: true,
        incompleteSupplyFailClosed: true,
        incompleteLocationFailClosed: true,
        stableContentFingerprintProfile: true,
        bankSnapshotObservabilityRequired: true
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.farmReadiness = clone(this.farmReadinessStatus());
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha20_5FarmReadinessRuntime, ALPHA20_5_FARM_READINESS_MODE };
