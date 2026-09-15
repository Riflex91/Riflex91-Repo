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
const { installFarmerResourceTopoffHotfix } = require('../reliability/farmer-resource-topoff-hotfix');
const { installPartyFocusFireHotfix } = require('../reliability/party-focus-fire-hotfix');
const { installTeamCombatCohesionHotfix } = require('../reliability/team-combat-cohesion-hotfix');
const { installTeamCohesionDeadlockHotfix } = require('../reliability/team-cohesion-deadlock-hotfix');
const { installControlledPartyLogistics } = require('../reliability/controlled-party-logistics');
const { installFarmAreaPressureHotfix } = require('../reliability/farm-area-pressure-hotfix');
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
    this.farmerResourceTopoffHotfix = installFarmerResourceTopoffHotfix(this, {
      targetRatio: options.farmerResourceTopoffRatio,
      criticalHpRatio: options.farmerResourceCriticalHpRatio,
      cooldownMs: options.farmerResourcePotionCooldownMs
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
    this.teamCombatCohesionHotfix = installTeamCombatCohesionHotfix(this, {
      resourceTopoff: this.farmerResourceTopoffHotfix,
      requiredCombatMembers: options.teamCombatRequiredMembers,
      cohesionRadius: options.teamCombatCohesionRadius,
      followRadius: options.teamCombatFollowRadius,
      kiteFormationRadius: options.teamCombatKiteFormationRadius,
      followStep: options.teamCombatFollowStep,
      followCooldownMs: options.teamCombatFollowCooldownMs,
      minNewFightHpRatio: options.teamCombatMinHpRatio,
      minNewFightMpRatio: options.teamCombatMinMpRatio,
      maxNewTargetHpVsTeam: options.teamCombatMaxTargetHpVsTeam
    });
    this.teamCohesionDeadlockHotfix = installTeamCohesionDeadlockHotfix(this, {
      followRadius: options.teamCombatPairwiseSafeFollowRadius,
      margin: options.teamCombatPairwiseSafetyMargin
    });
    this.controlledPartyLogistics = installControlledPartyLogistics(this, {
      statusIntervalMs: options.partyLogisticsStatusIntervalMs,
      statusFreshMs: options.partyLogisticsStatusFreshMs,
      merchantReserveSlots: options.partyLogisticsMerchantReserveSlots,
      farmerPotionLow: options.partyLogisticsFarmerPotionLow,
      farmerPotionTarget: options.partyLogisticsFarmerPotionTarget,
      merchantPotionReserve: options.partyLogisticsMerchantPotionReserve,
      maxSupplyBatch: options.partyLogisticsMaxSupplyBatch,
      farmerGoldReserve: options.partyLogisticsFarmerGoldReserve,
      maxGoldBatch: options.partyLogisticsMaxGoldBatch,
      maxTransferDistance: options.partyLogisticsMaxTransferDistance,
      rendezvousDistance: options.partyLogisticsRendezvousDistance,
      rendezvousStep: options.partyLogisticsRendezvousStep
    });
    this.farmAreaPressureHotfix = installFarmAreaPressureHotfix(this, {
      sampleIntervalMs: options.farmAreaPressureSampleIntervalMs,
      windowMs: options.farmAreaPressureWindowMs,
      minDwellMs: options.farmAreaPressureMinDwellMs,
      minSamples: options.farmAreaPressureMinSamples,
      availabilityThreshold: options.farmAreaPressureAvailabilityThreshold,
      idleThreshold: options.farmAreaPressureIdleThreshold,
      foreignPresenceThreshold: options.farmAreaPressureForeignPresenceThreshold,
      observationRadius: options.farmAreaPressureObservationRadius,
      exclusionMs: options.farmAreaPressureExclusionMs,
      switchCooldownMs: options.farmAreaPressureSwitchCooldownMs
    });
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
    this.controlledPartyLogistics.tick(snapshot);
    this.farmAreaPressureHotfix.tick(snapshot);
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
      farmerResourceTopoffHotfix: this.farmerResourceTopoffHotfix.status(),
      partyFocusFireHotfix: this.partyFocusFireHotfix.status(),
      teamCombatCohesionHotfix: this.teamCombatCohesionHotfix.status(),
      teamCohesionDeadlockHotfix: this.teamCohesionDeadlockHotfix.status(),
      controlledPartyLogistics: this.controlledPartyLogistics.status(),
      farmAreaPressureHotfix: this.farmAreaPressureHotfix.status(),
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
        partyBootstrapAuthority: 'bounded-active-owned-invites-only',
        partyLogisticsAuthority: 'bounded-owned-party-potions-loot-gold-only'
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
        teamCombat: this.teamCombatCohesionHotfix.status(),
        teamCohesionDeadlock: this.teamCohesionDeadlockHotfix.status(),
        logistics: this.controlledPartyLogistics.status(),
        persistenceQuota: this.partyPersistenceQuotaHotfix.status()
      },
      farmerLoot: this.controlledFarmerLoot.status(),
      autoRespawn: this.controlledAutoRespawn.status(),
      preFarmingReliability: this.preFarmingReliability.status(),
      liveNavigationHotfix: this.liveNavigationHotfix.status(),
      farmerLocalPlanPriority: this.farmerLocalPlanPriority.status(),
      farmerTargetEfficiencyHotfix: this.farmerTargetEfficiencyHotfix.status(),
      farmerTerrainNavigationHotfix: this.farmerTerrainNavigationHotfix.status(),
      farmerResourceTopoffHotfix: this.farmerResourceTopoffHotfix.status(),
      farmAreaPressureHotfix: this.farmAreaPressureHotfix.status(),
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
        teamCombatCohesionFirst: true,
        teamLeaderOwnsFarmDirection: true,
        followersNeverOpenIndependentTargets: true,
        teamSharedAggroAssistance: true,
        incompletePotionSupplyHoldsCombat: true,
        aggressivePreciseResourceTopoff: true,
        reducedTeamKitingRadius: true,
        pairwiseCohesionDeadlockFixed: true,
        boundedMerchantPotionResupply: true,
        boundedFarmerLootToMerchant: true,
        boundedFarmerGoldToMerchant: true,
        merchantCapacityStopHandshake: true,
        merchantLogisticsRendezvous: true,
        adaptiveFarmAreaPressureDetection: true,
        overcrowdedAreaReplan: true,
        spawnStarvationAreaReplan: true,
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
