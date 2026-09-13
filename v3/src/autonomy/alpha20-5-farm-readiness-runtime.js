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
const { installFarmerTargetEfficiencyHotfix } = require('../reliability/farmer-target-efficiency-hotfix');
const { installFarmerTerrainNavigationHotfix } = require('../reliability/farmer-terrain-navigation-hotfix');
const { installPartyFocusFireHotfix } = require('../reliability/party-focus-fire-hotfix');
const { installPartyPersistenceQuotaHotfix } = require('../reliability/party-persistence-quota-hotfix');
const { installDangerousContentHotfix } = require('../reliability/dangerous-content-hotfix');
const { installContentDriftStorageHotfix } = require('../reliability/content-drift-storage-hotfix');
const { installContentDriftSemanticRecovery } = require('../reliability/content-drift-semantic-recovery');
const { installPartyAccountCommunication } = require('../reliability/party-account-communication');
const { installPartyBootstrapFarmerGate } = require('../reliability/party-bootstrap-farmer-gate');
const { installPartyBootstrapMerchantDiscoveryHotfix } = require('../reliability/party-bootstrap-merchant-discovery-hotfix');

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
    this.liveNavigationHotfix = installLiveNavigationHotfix(this);
    this.farmerLocalPlanPriority = installFarmerLocalPlanPriority(this);
    this.farmerTargetEfficiencyHotfix = installFarmerTargetEfficiencyHotfix(this, {
      maxEvasion: options.farmerMaxTargetEvasion,
      maxAvoidance: options.farmerMaxTargetAvoidance
    });

    // Live reliability fixes remain modular so the proven Alpha.20 action
    // boundaries are unchanged. Persistence failure may reduce observability,
    // but must never rewrite combat-safety semantics.
    this.dangerousContentHotfix = installDangerousContentHotfix(this);
    this.farmerTravelSafetyHotfix = installFarmerTravelSafetyHotfix(this, {
      minStep: options.farmerTravelMinStep,
      maxStep: options.farmerTravelMaxStep,
      stepSeconds: options.farmerTravelStepSeconds
    });
    this.farmerTerrainNavigationHotfix = installFarmerTerrainNavigationHotfix(this, {
      minStep: options.farmerTravelMinStep,
      maxStep: options.farmerTravelMaxStep,
      stepSeconds: options.farmerTravelStepSeconds,
      blockedTargetMs: options.farmerTerrainBlockedTargetMs,
      minProgress: options.farmerTerrainMinProgress
    });
    this.partyFocusFireHotfix = installPartyFocusFireHotfix(this, {
      maxFocusDistance: options.partyFocusMaxDistance
    });
    this.contentDriftStorageHotfix = installContentDriftStorageHotfix(this, {
      maxRecordsAfterQuota: options.contentDriftQuotaMaxRecords,
      retryBaseMs: options.contentDriftQuotaRetryBaseMs,
      retryMaxMs: options.contentDriftQuotaRetryMaxMs
    });
    this.contentDriftSemanticRecovery = installContentDriftSemanticRecovery(this, {
      minHistoricalLeadMs: options.contentDriftRecoveryHistoricalLeadMs,
      maxAutoQuarantineLagMs: options.contentDriftRecoveryAutoQuarantineLagMs,
      intervalMs: options.contentDriftRecoveryIntervalMs
    });
    this.partyPersistenceQuotaHotfix = installPartyPersistenceQuotaHotfix(this, {
      storageHighWatermarkChars: options.partyPersistenceStorageHighWatermarkChars
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
    this.partyBootstrapMerchantDiscoveryHotfix = installPartyBootstrapMerchantDiscoveryHotfix(this.partyBootstrap);
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
    this.contentDriftSemanticRecovery.beforeTick();
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
      farmerTargetEfficiencyHotfix: this.farmerTargetEfficiencyHotfix.status(),
      farmerTerrainNavigationHotfix: this.farmerTerrainNavigationHotfix.status(),
      partyFocusFireHotfix: this.partyFocusFireHotfix.status(),
      partyPersistenceQuotaHotfix: this.partyPersistenceQuotaHotfix.status(),
      dangerousContentHotfix: this.dangerousContentHotfix.status(),
      farmerTravelSafetyHotfix: this.farmerTravelSafetyHotfix.status(),
      contentDriftStorageHotfix: this.contentDriftStorageHotfix.status(),
      contentDriftSemanticRecovery: this.contentDriftSemanticRecovery.status(),
      partyAccountCommunication: this.partyAccountCommunication.status(),
      partyBootstrap: this.partyBootstrap.status(),
      partyBootstrapMerchantDiscoveryHotfix: this.partyBootstrapMerchantDiscoveryHotfix.status(),
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
        bootstrapMerchantDiscovery: this.partyBootstrapMerchantDiscoveryHotfix.status(),
        accountCommunication: this.partyAccountCommunication.status(),
        focusFire: this.partyFocusFireHotfix.status(),
        persistenceQuota: this.partyPersistenceQuotaHotfix.status()
      },
      farmerLoot: this.controlledFarmerLoot.status(),
      autoRespawn: this.controlledAutoRespawn.status(),
      preFarmingReliability: this.preFarmingReliability.status(),
      liveNavigationHotfix: this.liveNavigationHotfix.status(),
      farmerLocalPlanPriority: this.farmerLocalPlanPriority.status(),
      farmerTargetEfficiencyHotfix: this.farmerTargetEfficiencyHotfix.status(),
      farmerTerrainNavigationHotfix: this.farmerTerrainNavigationHotfix.status(),
      dangerousContentHotfix: this.dangerousContentHotfix.status(),
      farmerTravelSafetyHotfix: this.farmerTravelSafetyHotfix.status(),
      contentDriftStorageHotfix: this.contentDriftStorageHotfix.status(),
      contentDriftSemanticRecovery: this.contentDriftSemanticRecovery.status(),
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
        terrainAwareBoundedFarmerTravel: true,
        movementFailureReselectsInsteadOfGlobalFarmerBlock: true,
        safeVisiblePartyFocusFire: true,
        partyFocusDoesNotUseCm: true,
        extremeEvasionFarmTargetsRejected: true,
        extremeAvoidanceFarmTargetsRejected: true,
        farmEfficiencySeparateFromNavigationSafety: true,
        partyTrustUsesExplicitRoster: true,
        partyBootstrapEnabled: true,
        partyBootstrapDoesNotGateTrustedFarmerProgress: true,
        partyCommunicationDirectRequiresObservedActive: true,
        partyPersistenceQuotaNonAuthoritative: true,
        contentDriftQuotaRecoveryMutatesSafetyKnowledge: false,
        contentDriftFalseNoveltyRecoveryRequiresHistoricalEvidence: true,
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
