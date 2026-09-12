/* Adventure Land AiO Bot 3.0.0-alpha.17.0 | generated | shadow mode by default */
(function(root){
'use strict';
var modules={
"src/index.js": function(require,module,exports){
'use strict';

const { Runtime } = require('./runtime');
const { RELEASE_VERSION: VERSION } = require('./release-version');
const { StabilityRuntime } = require('./stability/stability-runtime');
const { Alpha9Runtime } = require('./autonomy/alpha9-runtime');
const { Alpha10Runtime } = require('./autonomy/alpha10-runtime');
const { Alpha11Runtime } = require('./autonomy/alpha11-runtime');
const { Alpha12Runtime } = require('./autonomy/alpha12-hardened-runtime');
const { Alpha13Runtime } = require('./autonomy/alpha13-runtime');
const { Alpha14Runtime } = require('./autonomy/alpha14-runtime');
const { Alpha15Runtime } = require('./autonomy/alpha15-runtime');
const { Alpha16Runtime, ALPHA16_VERSION } = require('./autonomy/alpha16-runtime');
const { Alpha17Runtime } = require('./autonomy/alpha17-runtime');
const { Alpha18Runtime, ALPHA18_VERSION } = require('./autonomy/alpha18-runtime');
const { Alpha19Runtime, ALPHA19_VERSION } = require('./autonomy/alpha19-runtime');
const { Alpha20Runtime } = require('./autonomy/alpha20-runtime');
const { LocalFarmPlanner } = require('./autonomy/local-farm-planner');
const { LocalFarmOrchestrator } = require('./autonomy/local-farm-orchestrator');
const { StrategicFeatureEncoder, FEATURE_SCHEMA_VERSION, FEATURE_NAMES } = require('./brain/feature-encoder');
const { BoundedReplayBuffer } = require('./brain/replay-buffer');
const { ShadowStrategicBrain, BrainQualityState } = require('./brain/shadow-brain');
const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { StableScheduler } = require('./core/stable-scheduler');
const { TaskState, createTask } = require('./core/task');
const { WorldModel, KnowledgeState, EvidenceKind } = require('./world/world-model');
const { WorldPersistence } = require('./world/persistence');
const { ResilientWorldPersistence } = require('./world/resilient-persistence');
const { KnowledgeAgingPolicy } = require('./world/knowledge-aging');
const { DiscoveryService } = require('./world/discovery');
const { ContentDriftMonitor, ContentLifecycle, CONTENT_DRIFT_SCHEMA_VERSION, stableStringify, fingerprint } = require('./world/content-drift');
const { PerformanceTracker } = require('./telemetry/performance-tracker');
const { ResearchJournal, ExperimentState } = require('./research/research');
const { FarmPlanner } = require('./planner/farm-planner');
const { FarmerController, FarmerState, TargetPolicy } = require('./farmer/farmer-fsm');
const { TargetSafety, BUILT_IN_TARGET_EXCLUSIONS } = require('./farmer/target-safety');
const { ContentSafetyGate, ContentDisposition } = require('./farmer/content-safety');
const { partyProfile, capabilitiesFor } = require('./party/capabilities');
const { CharacterRegistry, REGISTRY_SCHEMA_VERSION, REGISTRY_MODE, SOURCE_CONFIDENCE } = require('./party/character-registry');
const { FINGERPRINT_SCHEMA_VERSION, createPartyFingerprint, createEncounterFingerprint } = require('./party/fingerprints');
const { PartyPerformanceStore, PARTY_PERFORMANCE_SCHEMA_VERSION } = require('./party/performance-store');
const { PartyOrchestrator, COMBAT_CLASSES, DEFAULT_WEIGHTS } = require('./party/orchestrator');
const { PaladinAuraPolicy, AURAS } = require('./party/paladin-aura-policy');
const { PartyTelemetryBridge, TELEMETRY_PROTOCOL } = require('./party/telemetry-bridge');
const { PartyTransitionController, TransitionState } = require('./party/transition-controller');
const { PartyControlLease, PARTY_CONTROL_PROTOCOL, PARTY_CONTROL_TYPE, PartyControlAction } = require('./party/control-lease');
const { PartyLifecycleStore, PartyLifecycleState, PARTY_LIFECYCLE_SCHEMA_VERSION, PARTY_LIFECYCLE_MODE } = require('./party/lifecycle-store');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_MODE, CONTROLLED_PARTY_LIFECYCLE_ACK, PartyLifecycleOperationState } = require('./party/controlled-lifecycle-coordinator');
const { ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_MODE, CONTROLLED_PALADIN_AURA_ACK } = require('./party/controlled-paladin-aura-executor');
const { InventoryLedger, INVENTORY_LEDGER_SCHEMA_VERSION, INVENTORY_LEDGER_MODE, ItemDisposition, stackKey } = require('./economy/inventory-ledger');
const { GearProgressionEvaluator, GEAR_PROGRESSION_SCHEMA_VERSION, GEAR_PROGRESSION_MODE, CLASS_WEIGHTS, effectiveStats, scoreItem, candidateSlots } = require('./economy/gear-progression');
const { EconomyTransactionEngine, TRANSACTION_SCHEMA_VERSION, TRANSACTION_MODE, TransactionType, TransactionState, EXPECTED_DISPOSITIONS } = require('./economy/transaction-engine');
const { ControlledMerchantExecutor, CONTROLLED_MERCHANT_MODE, CONTROLLED_MERCHANT_ACK } = require('./economy/controlled-merchant-executor');
const { BankCapacityManager, BANK_CAPACITY_SCHEMA_VERSION, BANK_CAPACITY_MODE, BankSpaceAction } = require('./economy/bank-capacity-manager');
const { BankExpansionTransactionEngine, BANK_EXPANSION_TX_SCHEMA_VERSION, BANK_EXPANSION_TX_MODE, BankExpansionState } = require('./economy/bank-expansion-transactions');
const { ControlledBankExpansionExecutor, CONTROLLED_BANK_EXPANSION_MODE, CONTROLLED_BANK_EXPANSION_ACK } = require('./economy/controlled-bank-expansion-executor');
const { MerchantSpaceRecoveryJournal, MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION, MERCHANT_SPACE_RECOVERY_MODE, MerchantSpaceRecoveryState } = require('./economy/merchant-space-recovery-journal');
const { ControlledBankConsolidationExecutor, CONTROLLED_BANK_CONSOLIDATION_MODE, CONTROLLED_BANK_CONSOLIDATION_ACK } = require('./economy/controlled-bank-consolidation-executor');
const { HardenedControlledMerchantSpaceRecovery, CONTROLLED_SPACE_RECOVERY_MODE, CONTROLLED_SPACE_RECOVERY_ACK, MAX_RAW_ACTIONS_PER_OPERATION } = require('./economy/controlled-merchant-space-recovery-hardened');
const { SafeTravelController, TRAVEL_SCHEMA_VERSION, TRAVEL_MODE, TravelState } = require('./travel/safe-travel');
const { ControlledTravelExecutor, CONTROLLED_TRAVEL_MODE, CONTROLLED_TRAVEL_ACK } = require('./travel/controlled-travel-executor');
const { TelemetryOutbox } = require('./ops/telemetry-outbox');
const { ControlGateway } = require('./ops/control-gateway');
const { StateReplica, HeadlessHealth } = require('./ops/state-replica');
const { HeadlessOperations } = require('./ops/headless-operations');
const { BackgroundExecutionGuard } = require('./ops/background-execution-guard');
const { MinuteCountdownReporter } = require('./ops/minute-countdown-reporter');
const { SessionMonitor, MONITOR_SCHEMA_VERSION } = require('./ops/session-monitor');
const { DebugMonitorUI } = require('./ops/debug-monitor-ui');
const { CommandOutcomeTracker, CommandOutcomeState } = require('./game/command-outcomes');
const { StabilityGameAdapter } = require('./game/stability-adapter');
const { CombatStabilitySupervisor } = require('./stability/combat-stability-supervisor');
const { GlobalSupervisor, HealthState } = require('./stability/global-supervisor');

function install(root = globalThis, options = {}) {
  if (root.AIO_V3 && root.AIO_V3.__runtime) return root.AIO_V3;
  const runtime = new Alpha20Runtime({ ...options, root });
  const operations = new HeadlessOperations({
    runtime,
    log: runtime.log,
    now: runtime.now,
    telemetryCapacity: options.telemetryOutboxCapacity,
    replicaMaxBytes: options.stateReplicaMaxBytes,
    watchAfterMs: options.headlessWatchAfterMs,
    degradedAfterMs: options.headlessDegradedAfterMs,
    allowElevatedControl: options.allowElevatedRemoteControl === true,
    controlHistory: options.remoteControlHistory,
    controlMaxTtlMs: options.remoteControlMaxTtlMs
  });
  const monitor = new SessionMonitor({
    root,
    runtime,
    operations,
    log: runtime.log,
    now: runtime.now,
    version: VERSION,
    maxEvents: options.sessionMonitorMaxEvents,
    maxInventory: options.sessionMonitorMaxInventory,
    maxTransactions: options.sessionMonitorMaxTransactions,
    maxTravel: options.sessionMonitorMaxTravel,
    maxGoals: options.sessionMonitorMaxGoals
  });
  const debugUI = new DebugMonitorUI({
    root,
    monitor,
    log: runtime.log,
    refreshMs: options.debugMonitorRefreshMs,
    containerId: options.debugMonitorContainerId
  });

  function status() {
    return { ...runtime.status(), operations: operations.status(), monitor: monitor.status(), debugUI: debugUI.status() };
  }
  function exportDiagnostics() {
    const base = JSON.parse(runtime.exportDiagnostics());
    base.context = base.context || {};
    base.context.operations = operations.status();
    base.context.monitor = monitor.status();
    base.context.debugUI = debugUI.status();
    return JSON.stringify(base, null, 2);
  }

  const api = {
    version: VERSION,
    __runtime: runtime,
    __operations: operations,
    __monitor: monitor,
    __debugUI: debugUI,
    start: () => runtime.start(),
    stop: () => runtime.stop(),
    setMode: (mode) => runtime.setMode(mode),
    status,
    showStatus: () => { runtime.showStatus(); return status(); },
    getEvents: (query = 100) => typeof query === 'number' ? runtime.log.list(query) : runtime.log.query(query),
    exportDiagnostics,
    saveWorld: () => runtime.persistence.maybeSave(runtime.world, { force: true }),
    monitor: {
      status: () => monitor.status(),
      summary: () => monitor.summary(),
      exportSession: () => monitor.exportSession(),
      copyLog: () => monitor.copyToClipboard(),
      show: () => debugUI.show(),
      hide: () => debugUI.hide(),
      uiStatus: () => debugUI.status()
    },
    operations: {
      status: () => operations.status(),
      submit: (command) => operations.submit(command),
      drainTelemetry: (limit = 100) => operations.drainTelemetry(limit),
      peekTelemetry: (limit = 100) => operations.peekTelemetry(limit),
      takeStateReplica: () => operations.takeStateReplica(),
      peekStateReplica: () => operations.peekStateReplica()
    },
    world: runtime.world,
    scheduler: runtime.scheduler,
    performance: runtime.performance,
    research: runtime.research,
    brain: { status: () => runtime.brain.status(), replay: (limit = 32) => runtime.brain.replay(limit) },
    supervisor: {
      status: () => runtime.status().supervisor,
      setSafeActionsEnabled: (enabled) => runtime.setSupervisorSafeActionsEnabled(enabled),
      quarantineSubsystem: (name, reason) => runtime.quarantineSubsystem(name, reason),
      clearSubsystemQuarantine: (name) => runtime.clearSubsystemQuarantine(name)
    },
    contentDrift: {
      status: () => runtime.contentDrift.status(),
      records: (limit = 100) => runtime.contentDrift.list(limit),
      requiresRevalidation: (category, id) => runtime.contentDrift.requiresRevalidation(category, id),
      markRevalidated: (category, id) => runtime.markContentRevalidated(category, id),
      save: () => runtime.contentDrift.save({ force: true })
    },
    inventory: {
      status: () => runtime.inventoryLedger.status(),
      entries: (limit = 100) => runtime.inventoryLedger.list(limit),
      item: (character, index) => runtime.inventoryLedger.get(character, index),
      setActionPolicy: (config) => runtime.configureInventoryActionPolicy(config)
    },
    gearProgression: {
      status: () => runtime.gearProgression.status(),
      goals: (limit = 100) => runtime.gearProgression.list(limit),
      save: () => runtime.gearProgression.save({ force: true })
    },
    economy: {
      status: () => runtime.status().economy,
      controlled: {
        status: () => runtime.controlledMerchant.status(),
        configure: (config) => runtime.configureControlledMerchant(config),
        disable: (reason) => runtime.controlledMerchant.disable(reason),
        execute: (id) => runtime.executeEconomyTransaction(id)
      },
      transactions: {
        status: () => runtime.transactionEngine.status(),
        list: (limit = 100) => runtime.transactionEngine.list(limit),
        get: (id) => runtime.transactionEngine.get(id),
        plan: (request) => runtime.planEconomyTransaction(request),
        cancel: (id, reason) => runtime.transactionEngine.cancel(id, reason),
        reconcile: (id) => runtime.reconcileEconomyTransaction(id),
        breaker: (family) => runtime.transactionEngine.breaker(family),
        save: () => runtime.transactionEngine.save()
      },
      bankCapacity: {
        status: () => runtime.bankCapacity.status(),
        observe: () => runtime._observeBankCapacity(),
        planSpace: (request = {}) => runtime.planBankSpace(request),
        workGate: () => runtime.bankCapacity.status().workGate
      },
      bankExpansion: {
        status: () => runtime.bankExpansionTransactions.status(),
        list: (limit = 100) => runtime.bankExpansionTransactions.list(limit),
        get: (id) => runtime.bankExpansionTransactions.get(id),
        plan: (request = {}) => runtime.planBankExpansion(request),
        reconcile: (id) => runtime.bankExpansionTransactions.reconcile(id, runtime._observeBankCapacity()),
        breaker: () => runtime.bankExpansionTransactions.breaker(),
        save: () => runtime.bankExpansionTransactions.save(),
        controlled: {
          status: () => runtime.controlledBankExpansion.status(),
          configure: (config) => runtime.configureControlledBankExpansion(config),
          disable: (reason) => runtime.controlledBankExpansion.disable(reason),
          execute: (id) => runtime.executeBankExpansion(id)
        }
      },
      spaceRecovery: {
        status: () => runtime.controlledMerchantSpaceRecovery.status(),
        list: (limit = 100) => runtime.merchantSpaceRecoveryJournal.list(limit),
        get: (id) => runtime.merchantSpaceRecoveryJournal.get(id),
        plan: (request = {}) => runtime.planMerchantSpaceRecovery(request),
        reconcile: (id) => runtime.reconcileMerchantSpaceRecovery(id),
        breaker: () => runtime.merchantSpaceRecoveryJournal.breaker(),
        save: () => runtime.merchantSpaceRecoveryJournal.save(),
        controlled: {
          status: () => runtime.controlledMerchantSpaceRecovery.status(),
          configure: (config) => runtime.configureControlledMerchantSpaceRecovery(config),
          disable: (reason) => runtime.controlledMerchantSpaceRecovery.disable(reason),
          execute: (id) => runtime.executeMerchantSpaceRecovery(id)
        },
        consolidation: { status: () => runtime.controlledBankConsolidation.status() }
      }
    },
    travel: {
      status: () => runtime.status().travel,
      list: (limit = 100) => runtime.safeTravel.list(limit),
      get: (id) => runtime.safeTravel.get(id),
      plan: (request) => runtime.planTravel(request),
      cancel: (id, reason) => runtime.safeTravel.cancel(id, reason),
      breaker: () => runtime.safeTravel.breaker(),
      controlled: {
        status: () => runtime.controlledTravel.status(),
        configure: (config) => runtime.configureControlledTravel(config),
        disable: (reason) => runtime.controlledTravel.disable(reason),
        execute: (id) => runtime.executeTravelPlan(id),
        abort: (reason) => runtime.abortControlledTravel(reason)
      }
    },
    party: {
      status: () => runtime.status().party,
      registry: () => runtime.characterRegistry.status(),
      character: (name) => runtime.characterRegistry.get(name),
      configureRoster: (roster) => {
        const result = runtime.characterRegistry.seedRoster(roster);
        runtime.partyTelemetry.setTrustedNames(result.characters.map((row) => row.name));
        const merchant = result.characters.find((row) => row.ctype === 'merchant');
        if (merchant) {
          runtime.partyTelemetry.setMerchantName(merchant.name);
          runtime.partyTransitions.setMerchantName(merchant.name);
        }
        if (typeof runtime.syncPartyControlConfig === 'function') runtime.syncPartyControlConfig();
        return result;
      },
      decision: () => runtime.lastPartyDecision,
      fingerprints: () => ({ party: runtime.currentPartyFingerprint, encounter: runtime.currentEncounterFingerprint }),
      performance: () => runtime.partyPerformance.status(64),
      telemetry: () => runtime.partyTelemetry.status(),
      transition: () => runtime.partyTransitions.status(),
      controlLease: () => runtime.partyControlLease ? runtime.partyControlLease.status() : null,
      aura: () => runtime.status().party.aura,
      lifecycle: {
        status: () => runtime.partyLifecycle.status(),
        characters: () => runtime.partyLifecycle.list(),
        character: (name) => runtime.partyLifecycle.get(name),
        controlled: {
          status: () => runtime.controlledPartyLifecycle.status(),
          configure: (config) => runtime.configureControlledPartyLifecycle(config),
          disable: (reason) => runtime.configureControlledPartyLifecycle({ enabled: false, reason }),
          reconcile: () => runtime.reconcilePartyLifecycle()
        },
        aura: {
          status: () => runtime.controlledPaladinAura.status()
        }
      },
      setTransitionsEnabled: (enabled) => runtime.setPartyTransitionsEnabled(enabled),
      setAuraAutomationEnabled: (enabled) => runtime.setPartyAuraAutomationEnabled(enabled),
      setExplorationEnabled: (enabled) => runtime.setPartyExplorationEnabled(enabled),
      setCodeSlots: (slots) => runtime.setPartyCodeSlots(slots)
    },
    backgroundExecution: {
      status: () => runtime.backgroundExecution.status(),
      arm: () => runtime.backgroundExecution.arm('API_MANUAL'),
      setEnabled: (enabled) => runtime.backgroundExecution.setEnabled(enabled)
    },
    localFarming: { status: () => runtime.localFarming.status() },
    farmer: {
      enable: () => runtime.setFarmerEnabled(true),
      disable: () => runtime.setFarmerEnabled(false),
      status: () => runtime.farmerStatus(),
      setTargetPolicy: (policy) => runtime.setFarmerTargetPolicy(policy),
      addTargetExclusion: (value) => runtime.addFarmerTargetExclusion(value),
      removeTargetExclusion: (value) => runtime.removeFarmerTargetExclusion(value),
      approveMonsterContent: (mtype) => runtime.combatRisk.approveMonsterType(runtime.world, mtype),
      quarantineMonsterContent: (mtype) => runtime.combatRisk.quarantineMonsterType(runtime.world, mtype)
    },
    createTask,
    TaskState
  };

  root.AIO_V3 = api;
  if (options.debugMonitorVisible !== false) debugUI.show();
  if (root.AIO_V3_AUTOSTART !== false) runtime.start();
  return api;
}

module.exports = {
  install, Runtime, StabilityRuntime, Alpha9Runtime, Alpha10Runtime, Alpha11Runtime, Alpha12Runtime, Alpha13Runtime, Alpha14Runtime, Alpha15Runtime, Alpha16Runtime, ALPHA16_VERSION, Alpha17Runtime, Alpha18Runtime, ALPHA18_VERSION, Alpha19Runtime, ALPHA19_VERSION, Alpha20Runtime, VERSION,
  EventLog, Scheduler, StableScheduler, TaskState, createTask,
  WorldModel, KnowledgeState, EvidenceKind, WorldPersistence, ResilientWorldPersistence, KnowledgeAgingPolicy, DiscoveryService,
  ContentDriftMonitor, ContentLifecycle, CONTENT_DRIFT_SCHEMA_VERSION, stableStringify, fingerprint,
  PerformanceTracker, ResearchJournal, ExperimentState,
  FarmPlanner, LocalFarmPlanner, LocalFarmOrchestrator, FarmerController, FarmerState, TargetPolicy, TargetSafety, BUILT_IN_TARGET_EXCLUSIONS,
  ContentSafetyGate, ContentDisposition, partyProfile, capabilitiesFor, CharacterRegistry, REGISTRY_SCHEMA_VERSION, REGISTRY_MODE, SOURCE_CONFIDENCE,
  FINGERPRINT_SCHEMA_VERSION, createPartyFingerprint, createEncounterFingerprint, PartyPerformanceStore, PARTY_PERFORMANCE_SCHEMA_VERSION,
  PartyOrchestrator, COMBAT_CLASSES, DEFAULT_WEIGHTS, PaladinAuraPolicy, AURAS, PartyTelemetryBridge, TELEMETRY_PROTOCOL,
  PartyTransitionController, TransitionState, PartyControlLease, PARTY_CONTROL_PROTOCOL, PARTY_CONTROL_TYPE, PartyControlAction,
  PartyLifecycleStore, PartyLifecycleState, PARTY_LIFECYCLE_SCHEMA_VERSION, PARTY_LIFECYCLE_MODE,
  ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_MODE, CONTROLLED_PARTY_LIFECYCLE_ACK, PartyLifecycleOperationState,
  ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_MODE, CONTROLLED_PALADIN_AURA_ACK,
  InventoryLedger, INVENTORY_LEDGER_SCHEMA_VERSION, INVENTORY_LEDGER_MODE, ItemDisposition, stackKey,
  GearProgressionEvaluator, GEAR_PROGRESSION_SCHEMA_VERSION, GEAR_PROGRESSION_MODE, CLASS_WEIGHTS, effectiveStats, scoreItem, candidateSlots,
  EconomyTransactionEngine, TRANSACTION_SCHEMA_VERSION, TRANSACTION_MODE, TransactionType, TransactionState, EXPECTED_DISPOSITIONS,
  ControlledMerchantExecutor, CONTROLLED_MERCHANT_MODE, CONTROLLED_MERCHANT_ACK,
  BankCapacityManager, BANK_CAPACITY_SCHEMA_VERSION, BANK_CAPACITY_MODE, BankSpaceAction,
  BankExpansionTransactionEngine, BANK_EXPANSION_TX_SCHEMA_VERSION, BANK_EXPANSION_TX_MODE, BankExpansionState,
  ControlledBankExpansionExecutor, CONTROLLED_BANK_EXPANSION_MODE, CONTROLLED_BANK_EXPANSION_ACK,
  MerchantSpaceRecoveryJournal, MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION, MERCHANT_SPACE_RECOVERY_MODE, MerchantSpaceRecoveryState,
  ControlledBankConsolidationExecutor, CONTROLLED_BANK_CONSOLIDATION_MODE, CONTROLLED_BANK_CONSOLIDATION_ACK,
  HardenedControlledMerchantSpaceRecovery, CONTROLLED_SPACE_RECOVERY_MODE, CONTROLLED_SPACE_RECOVERY_ACK, MAX_RAW_ACTIONS_PER_OPERATION,
  SafeTravelController, TRAVEL_SCHEMA_VERSION, TRAVEL_MODE, TravelState, ControlledTravelExecutor, CONTROLLED_TRAVEL_MODE, CONTROLLED_TRAVEL_ACK,
  SessionMonitor, MONITOR_SCHEMA_VERSION, DebugMonitorUI,
  StrategicFeatureEncoder, FEATURE_SCHEMA_VERSION, FEATURE_NAMES, BoundedReplayBuffer, ShadowStrategicBrain, BrainQualityState,
  TelemetryOutbox, ControlGateway, StateReplica, HeadlessHealth, HeadlessOperations, BackgroundExecutionGuard, MinuteCountdownReporter,
  CommandOutcomeTracker, CommandOutcomeState, StabilityGameAdapter, CombatStabilitySupervisor, GlobalSupervisor, HealthState
};

},
"src/runtime.js": function(require,module,exports){
'use strict';

const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { GameAdapter } = require('./game/adapter');
const { WorldModel, EvidenceKind } = require('./world/world-model');
const { WorldPersistence } = require('./world/persistence');
const { DiscoveryService } = require('./world/discovery');
const { PerformanceTracker } = require('./telemetry/performance-tracker');
const { ResearchJournal } = require('./research/research');
const { partyProfile } = require('./party/capabilities');
const { FarmPlanner } = require('./planner/farm-planner');
const { RetreatFarmerController } = require('./farmer/retreat-farmer');
const { TargetSafety } = require('./farmer/target-safety');
const { CombatRiskGate } = require('./farmer/combat-risk');
const { CombatEmergencyGate } = require('./farmer/combat-emergency');

const VERSION = '3.0.0-alpha.8.13';

class Runtime {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.root = options.root || globalThis;
    this.log = options.log || new EventLog({ version: VERSION, now: this.now, capacity: options.logCapacity || 4000 });
    this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: options.parent, log: this.log, mode: options.mode || 'shadow', now: this.now });
    this.world = options.world || new WorldModel({ now: this.now, log: this.log });
    this.scheduler = options.scheduler || new Scheduler({ now: this.now, log: this.log });
    this.planner = options.planner || new FarmPlanner({ log: this.log });
    this.farmer = options.farmer || new RetreatFarmerController({
      now: this.now,
      log: this.log,
      planner: this.planner,
      enabled: options.farmerEnabled !== false,
      targetPolicy: options.farmerTargetPolicy || options.targetPolicy,
      useHpRatio: options.farmerUseHpRatio || 0.75,
      kitingEnabled: options.farmerKitingEnabled !== false,
      kitingMinRange: options.farmerKitingMinRange,
      kitingTooCloseFactor: options.farmerKitingTooCloseFactor,
      kitingDesiredFactor: options.farmerKitingDesiredFactor,
      kitingMaxStepFactor: options.farmerKitingMaxStepFactor,
      kitingSpeedStepSeconds: options.farmerKitingSpeedStepSeconds,
      kitingMoveCooldownMs: options.farmerKitingMoveCooldownMs,
      skillUsageEnabled: options.farmerSkillUsageEnabled !== false,
      skillUsageMpReserveRatio: options.farmerSkillUsageMpReserveRatio,
      skillUsageMinIntervalMs: options.farmerSkillUsageMinIntervalMs,
      skillUsageMaxCommandAttempts: options.farmerSkillUsageMaxCommandAttempts,
      skillUsageFailureBackoffMs: options.farmerSkillUsageFailureBackoffMs,
      skillUsageFailureBackoffMultiplier: options.farmerSkillUsageFailureBackoffMultiplier,
      skillUsageFailureBackoffMaxMs: options.farmerSkillUsageFailureBackoffMaxMs,
      skillUsageFailureStreakResetMs: options.farmerSkillUsageFailureStreakResetMs,
      targetReassessmentEnabled: options.farmerTargetReassessmentEnabled !== false,
      targetReassessmentMinIntervalMs: options.farmerTargetReassessmentMinIntervalMs,
      targetReassessmentSwitchCooldownMs: options.farmerTargetReassessmentSwitchCooldownMs,
      targetReassessmentSelfAggroSwitchFactor: options.farmerTargetReassessmentSelfAggroSwitchFactor,
      targetReassessmentSelfAggroThreatSwitchFactor: options.farmerTargetReassessmentSelfAggroThreatSwitchFactor,
      safeRetreatEnabled: options.farmerSafeRetreatEnabled !== false,
      safeRetreatStepSeconds: options.farmerSafeRetreatStepSeconds,
      safeRetreatMinStep: options.farmerSafeRetreatMinStep,
      safeRetreatMaxStep: options.farmerSafeRetreatMaxStep,
      safeRetreatMaxThreats: options.farmerSafeRetreatMaxThreats
    });
    this.targetSafety = options.targetSafety || new TargetSafety({ exclusions: options.farmerTargetExclusions || [] });
    this.lastSafetySkip = null;
    this.safetySkipLoggedAt = new Map();
    this.safetySkipLogCooldownMs = Math.max(5000, Number(options.safetySkipLogCooldownMs) || 30000);
    this.combatRisk = options.combatRisk || new CombatRiskGate({
      threshold: options.combatRiskThreshold,
      recoveryHpRatio: options.farmerRecoverHpRatio || this.farmer.config.recoverHpRatio,
      minLearnedConfidence: options.combatRiskMinConfidence,
      deathRateReference: options.combatRiskDeathRateReference,
      log: this.log,
      now: this.now
    });
    this.lastRiskSkip = null;
    this.riskSkipLoggedAt = new Map();
    this.riskSkipLogCooldownMs = Math.max(5000, Number(options.riskSkipLogCooldownMs) || 30000);
    this.combatEmergency = options.combatEmergency || new CombatEmergencyGate({
      criticalHpRatio: options.combatEmergencyCriticalHpRatio,
      multiAggroHpRatio: options.combatEmergencyMultiAggroHpRatio,
      multiAggroCount: options.combatEmergencyMultiAggroCount
    });
    this.lastEmergencyDisengage = null;
    this.pendingEmergencyRetreat = null;
    this.performance = options.performance || new PerformanceTracker({ now: this.now, log: this.log, windowMs: options.performanceWindowMs || 60000 });
    this.persistence = options.persistence || new WorldPersistence({ root: this.root, storage: options.storage, now: this.now, log: this.log, minIntervalMs: options.persistenceIntervalMs || 30000 });
    this.discovery = options.discovery || new DiscoveryService({ world: this.world, now: this.now, log: this.log });
    this.research = options.research || new ResearchJournal({ world: this.world, now: this.now, log: this.log });
    this.tickMs = Math.max(100, Number(options.tickMs) || 250);
    this.timer = null;
    this.lastHeartbeat = 0;
    this.lastPlannerAudit = -Infinity;
    this.lastSnapshot = null;
    this.lastDiscovery = null;
    this.startedAt = null;
    this.worldLoaded = false;
    this.visibleStatusEnabled = options.visibleStatus !== false;
    this.readyAnnounced = false;
  }

  setMode(mode) {
    const resolved = this.adapter.setMode(mode);
    const note = resolved === 'active' ? 'farmer commands can execute' : 'farmer preview only';
    this._announce(`[AIO v3 ${VERSION}] MODE | ${resolved} | ${note}`, 'VISIBLE_MODE_CHANGED');
    return resolved;
  }

  setFarmerEnabled(enabled) {
    const resolved = this.farmer.setEnabled(enabled);
    this._announce(`[AIO v3 ${VERSION}] FARMER | ${resolved ? 'enabled' : 'disabled'} | mode=${this.adapter.mode}`, resolved ? 'VISIBLE_FARMER_ENABLED' : 'VISIBLE_FARMER_DISABLED');
    return resolved;
  }

  setFarmerTargetPolicy(policy) {
    const resolved = this.farmer.setTargetPolicy(policy);
    this._announce(`[AIO v3 ${VERSION}] FARMER TARGET POLICY | ${resolved}`, 'VISIBLE_FARMER_TARGET_POLICY_CHANGED');
    return resolved;
  }

  addFarmerTargetExclusion(value) {
    const token = this.targetSafety.add(value);
    this._announce(`[AIO v3 ${VERSION}] FARMER TARGET EXCLUSION | added=${token}`, 'VISIBLE_FARMER_TARGET_EXCLUSION_CHANGED');
    return token;
  }

  removeFarmerTargetExclusion(value) {
    const removed = this.targetSafety.remove(value);
    this._announce(`[AIO v3 ${VERSION}] FARMER TARGET EXCLUSION | remove=${String(value || '').trim().toLowerCase()} | removed=${removed}`, 'VISIBLE_FARMER_TARGET_EXCLUSION_CHANGED');
    return removed;
  }

  _gameLog(message) {
    if (!this.visibleStatusEnabled) return false;
    const fn = this.root && (this.root.game_log || (this.root.parent && this.root.parent.game_log));
    if (typeof fn !== 'function') return false;
    try {
      fn.call(this.root, message);
      return true;
    } catch (error) {
      this.log.emit({ component: 'runtime', event: 'VISIBLE_STATUS_FAILED', severity: 'warn', reason: String(error && error.message || error) });
      return false;
    }
  }

  _announce(message, event) {
    if (!this._gameLog(message)) return false;
    this.log.emit({ component: 'runtime', event, data: { message } });
    return true;
  }

  _announceReady(snapshot) {
    if (this.readyAnnounced || !snapshot || !snapshot.character) return false;
    const c = snapshot.character;
    const message = `[AIO v3 ${VERSION}] READY | ${c.name} | ${c.ctype} L${c.level} | map=${c.map || 'unknown'} | mode=${this.adapter.mode} | visible=${snapshot.entities.length}`;
    if (!this._announce(message, 'VISIBLE_READY')) return false;
    this.readyAnnounced = true;
    return true;
  }

  farmerStatus() {
    return {
      ...this.farmer.status(),
      targetExclusions: this.targetSafety.list(),
      lastSafetySkip: this.lastSafetySkip,
      lastRiskSkip: this.lastRiskSkip,
      lastEmergencyDisengage: this.lastEmergencyDisengage
    };
  }

  showStatus() {
    const status = this.status();
    const c = status.character;
    const character = c ? `${c.name} | ${c.ctype} L${c.level} | map=${c.map || 'unknown'}` : 'character=waiting';
    const queued = status.scheduler && status.scheduler.queued ? status.scheduler.queued.length : 0;
    const active = status.scheduler && status.scheduler.active ? status.scheduler.active.length : 0;
    const entities = status.world && Number.isFinite(Number(status.world.entities)) ? Number(status.world.entities) : 0;
    const modeNote = status.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    const farmer = status.farmer || {};
    const farmerText = `farmer=${farmer.enabled ? farmer.state : 'disabled'}${farmer.targetType ? ':' + farmer.targetType : ''}${farmer.reason ? '[' + farmer.reason + ']' : ''} | targetPolicy=${farmer.targetPolicy || 'party-only'}`;
    const message = `[AIO v3 ${VERSION}] STATUS | running=${status.running} | mode=${status.mode} (${modeNote}) | ${character} | ${farmerText} | world=${entities} | tasks=${active}/${queued}`;
    this._announce(message, 'VISIBLE_STATUS');
    return status;
  }

  _restoreWorldOnce() {
    if (this.worldLoaded) return;
    this.worldLoaded = true;
    this.persistence.load(this.world);
  }

  start() {
    if (this.timer) return false;
    this._restoreWorldOnce();
    this.startedAt = this.startedAt || this.now();
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STARTED', data: { version: VERSION, mode: this.adapter.mode, tickMs: this.tickMs } });
    const modeNote = this.adapter.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    this._announce(`[AIO v3 ${VERSION}] STARTED | mode=${this.adapter.mode} | ${modeNote}`, 'VISIBLE_STARTUP');
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return true;
  }

  stop() {
    if (!this.timer) {
      this.persistence.maybeSave(this.world, { force: true });
      return false;
    }
    clearInterval(this.timer);
    this.timer = null;
    this.performance.flush({ world: this.world }, 'RUNTIME_STOPPED');
    this.persistence.maybeSave(this.world, { force: true });
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STOPPED' });
    return true;
  }

  _observeCharacter(snapshot) {
    if (!snapshot) return;
    const c = snapshot.character;
    this.world.observeEntity('character', c.name, { ctype: c.ctype, level: c.level, map: c.map, rip: c.rip }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  }

  _partyProfile(snapshot) {
    const members = [{ name: snapshot.character.name, ctype: snapshot.character.ctype, level: snapshot.character.level }];
    for (const p of snapshot.party || []) {
      if (p.name && p.name !== snapshot.character.name) members.push({ name: p.name, ctype: p.type, level: p.level });
    }
    return partyProfile(members);
  }

  _noteSafetySkip(entity, safety) {
    if (!entity || !safety || safety.allowed) return;
    const now = this.now();
    const key = `${entity.id || entity.mtype || 'unknown'}:${safety.reason}:${safety.token || '-'}`;
    const record = {
      at: now,
      entityId: entity.id || null,
      entityName: entity.name || null,
      monsterType: entity.mtype || null,
      reason: safety.reason,
      exclusion: safety.token || null,
      source: safety.source || null
    };
    this.lastSafetySkip = record;
    const last = this.safetySkipLoggedAt.get(key) || -Infinity;
    if (now - last < this.safetySkipLogCooldownMs) return;
    this.safetySkipLoggedAt.set(key, now);
    this.log.emit({ component: 'farmer', event: 'FARMER_TARGET_SKIPPED', character: this.lastSnapshot && this.lastSnapshot.character && this.lastSnapshot.character.name || null, reason: safety.reason, data: record });
  }

  _noteRiskSkip(entity, risk) {
    if (!entity || !risk || risk.allowed) return;
    const now = this.now();
    const key = `${entity.id || entity.mtype || 'unknown'}:${risk.reason}`;
    const record = {
      at: now,
      entityId: entity.id || null,
      entityName: entity.name || null,
      monsterType: entity.mtype || null,
      reason: risk.reason,
      score: risk.score,
      threshold: risk.threshold,
      signals: risk.signals || {}
    };
    this.lastRiskSkip = record;
    const last = this.riskSkipLoggedAt.get(key) || -Infinity;
    if (now - last < this.riskSkipLogCooldownMs) return;
    this.riskSkipLoggedAt.set(key, now);
    this.log.emit({ component: 'farmer', event: 'FARMER_TARGET_RISK_REJECTED', character: this.lastSnapshot && this.lastSnapshot.character && this.lastSnapshot.character.name || null, reason: risk.reason, data: record });
  }

  _armEmergencyRetreat(snapshot, entity, emergency, at) {
    if (this.adapter.mode !== 'active' || !snapshot || !snapshot.character) return;
    const character = snapshot.character;
    const threats = [];
    const seen = new Set();
    for (const candidate of snapshot.entities || []) {
      if (!candidate || !candidate.id || !candidate.mtype || candidate.dead || (candidate.hp != null && Number(candidate.hp) <= 0)) continue;
      const isCurrent = entity && String(candidate.id) === String(entity.id);
      const isSelfAggro = candidate.target === character.name;
      if (!isCurrent && !isSelfAggro) continue;
      const key = String(candidate.id);
      if (seen.has(key)) continue;
      seen.add(key);
      threats.push({
        id: key,
        mtype: candidate.mtype || null,
        x: candidate.x == null ? null : Number(candidate.x),
        y: candidate.y == null ? null : Number(candidate.y),
        target: candidate.target || null
      });
      if (threats.length >= 6) break;
    }

    this.pendingEmergencyRetreat = {
      at,
      reason: emergency.reason,
      hpRatio: emergency.signals && emergency.signals.hpRatio != null ? Number(emergency.signals.hpRatio) : null,
      sourceTargetId: entity && entity.id || null,
      sourceTargetType: entity && entity.mtype || null,
      threats
    };
  }

  takeEmergencyRetreat() {
    const pending = this.pendingEmergencyRetreat;
    this.pendingEmergencyRetreat = null;
    return pending;
  }

  _noteEmergencyDisengage(entity, emergency, snapshot) {
    if (!entity || !emergency || !emergency.triggered) return;
    const at = this.now();
    const record = {
      at,
      entityId: entity.id || null,
      entityName: entity.name || null,
      monsterType: entity.mtype || null,
      reason: emergency.reason,
      signals: emergency.signals || {}
    };
    this.lastEmergencyDisengage = record;
    this._armEmergencyRetreat(snapshot, entity, emergency, at);
    this.log.emit({
      component: 'farmer',
      event: 'FARMER_EMERGENCY_DISENGAGE',
      severity: 'warn',
      character: this.lastSnapshot && this.lastSnapshot.character && this.lastSnapshot.character.name || null,
      reason: emergency.reason,
      data: record
    });
  }

  _farmSnapshot(snapshot, gameData, profile) {
    if (!snapshot) return snapshot;
    const entities = [];
    for (const entity of snapshot.entities || []) {
      const isCurrentEngageTarget = this.farmer.state === 'ENGAGE' && this.farmer.targetId != null && String(entity.id) === String(this.farmer.targetId);
      if (isCurrentEngageTarget) {
        const emergency = this.combatEmergency.evaluate(snapshot, entity);
        if (emergency.triggered) {
          this._noteEmergencyDisengage(entity, emergency, snapshot);
          continue;
        }
      }

      const safety = this.targetSafety.evaluate(entity, gameData || {});
      if (!safety.allowed) {
        this._noteSafetySkip(entity, safety);
        continue;
      }
      const risk = this.combatRisk.evaluate(entity, snapshot, this.world, profile);
      if (!risk.allowed) {
        this._noteRiskSkip(entity, risk);
        continue;
      }
      entities.push(entity);
    }
    return { ...snapshot, entities };
  }

  _plannerCandidates(snapshot, profile) {
    const G = this.adapter.getGameData() || {};
    const seen = new Set();
    const rows = [];
    for (const entity of snapshot.entities) {
      if (!entity.mtype || entity.dead || seen.has(entity.mtype)) continue;
      seen.add(entity.mtype);
      const learned = this.world.performanceFor(entity.mtype, profile.fingerprint);
      const g = G.monsters && G.monsters[entity.mtype] || {};
      const fallbackXp = Math.max(0, Number(g.xp) || 0) * 60;
      rows.push({
        id: entity.mtype,
        monster: entity.mtype,
        xpPerHour: learned ? learned.xpPerHour : fallbackXp,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.05,
        travelSeconds: this._roughTravelSeconds(snapshot.character, entity),
        source: learned ? 'measured' : 'estimate-live'
      });
    }
    return rows;
  }

  _roughTravelSeconds(character, entity) {
    if (!character || character.map !== entity.map || character.x == null || character.y == null || entity.x == null || entity.y == null) return 120;
    const distance = Math.hypot(character.x - entity.x, character.y - entity.y);
    const c = this.adapter._character && this.adapter._character();
    const speed = c && Number(c.speed) || 40;
    return distance / Math.max(1, speed);
  }

  tick() {
    this._restoreWorldOnce();
    const snapshot = this.adapter.snapshot();
    if (!snapshot) {
      if (this.now() - this.lastHeartbeat > 5000) {
        this.lastHeartbeat = this.now();
        this.log.emit({ component: 'runtime', event: 'SNAPSHOT_UNAVAILABLE', severity: 'warn', reason: 'CHARACTER_NOT_READY' });
      }
      return;
    }
    this.lastSnapshot = snapshot;
    this._observeCharacter(snapshot);
    const profile = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const farmSnapshot = this._farmSnapshot(snapshot, gameData, profile);
    this.lastDiscovery = this.discovery.scan(snapshot, gameData);
    this._announceReady(snapshot);
    this.performance.observe(snapshot, { partyFingerprint: profile.fingerprint, world: this.world, gameData });
    this.farmer.ensureScheduled(this.scheduler, snapshot.character.name);
    this.scheduler.tick({ snapshot: farmSnapshot, adapter: this.adapter, world: this.world, party: profile, runtime: this });
    this.persistence.maybeSave(this.world);

    if (this.now() - this.lastPlannerAudit >= 15000) {
      this.lastPlannerAudit = this.now();
      const candidates = this._plannerCandidates(farmSnapshot, profile);
      if (candidates.length) this.planner.rank(candidates, { character: snapshot.character.name, partyFingerprint: profile.fingerprint });
      else this.log.emit({ component: 'planner', event: 'NO_LIVE_FARM_CANDIDATES', character: snapshot.character.name, data: { partyFingerprint: profile.fingerprint } });
    }

    if (this.now() - this.lastHeartbeat >= 5000) {
      this.lastHeartbeat = this.now();
      this.log.emit({
        component: 'runtime',
        event: 'HEARTBEAT',
        character: snapshot.character.name,
        data: {
          mode: this.adapter.mode,
          map: snapshot.character.map,
          hp: snapshot.character.hp,
          mp: snapshot.character.mp,
          gold: snapshot.character.gold,
          scheduler: { queued: this.scheduler.queue.length, active: this.scheduler.activeByOwner.size },
          world: this.world.summary(),
          performance: this.performance.status().current,
          combatRisk: { ...this.combatRisk.status(), lastRiskSkip: this.lastRiskSkip },
          combatEmergency: { ...this.combatEmergency.status(), lastEmergencyDisengage: this.lastEmergencyDisengage, pendingRetreat: !!this.pendingEmergencyRetreat },
          persistence: this.persistence.status()
        }
      });
    }
  }

  status() {
    return {
      version: VERSION,
      mode: this.adapter.mode,
      running: !!this.timer,
      runId: this.log.runId,
      startedAt: this.startedAt,
      character: this.lastSnapshot && this.lastSnapshot.character || null,
      scheduler: this.scheduler.snapshot(),
      farmer: this.farmerStatus(),
      combatRisk: { ...this.combatRisk.status(), lastRiskSkip: this.lastRiskSkip },
      combatEmergency: { ...this.combatEmergency.status(), lastEmergencyDisengage: this.lastEmergencyDisengage, pendingRetreat: !!this.pendingEmergencyRetreat },
      world: this.world.summary(),
      performance: this.performance.status(),
      discovery: this.discovery.status(),
      research: this.research.summary(),
      persistence: this.persistence.status(),
      eventSummary: this.log.summary()
    };
  }

  exportDiagnostics() {
    return this.log.exportBundle({
      runtime: this.status(),
      snapshot: this.lastSnapshot,
      scheduler: this.scheduler.snapshot(),
      farmer: this.farmerStatus(),
      combatRisk: { ...this.combatRisk.status(), lastRiskSkip: this.lastRiskSkip },
      combatEmergency: { ...this.combatEmergency.status(), lastEmergencyDisengage: this.lastEmergencyDisengage, pendingRetreat: !!this.pendingEmergencyRetreat },
      world: this.world.diagnosticsSnapshot(200),
      performance: this.performance.status(),
      research: { summary: this.research.summary(), experiments: this.research.listExperiments() },
      discovery: this.lastDiscovery
    });
  }
}

module.exports = { Runtime, VERSION };
},
"src/core/event-log.js": function(require,module,exports){
'use strict';

const SECRET_KEY = /(token|secret|password|passwd|write[_-]?key|api[_-]?key|authorization|cookie|session)/i;

function cloneSafe(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 4000 ? value.slice(0, 4000) + '…' : value;
  if (typeof value === 'function') return '[function]';
  if (depth > 6) return '[depth-limit]';
  if (typeof value === 'object') {
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 100).map((v) => cloneSafe(v, depth + 1, seen));
    const out = {};
    for (const [key, child] of Object.entries(value).slice(0, 100)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : cloneSafe(child, depth + 1, seen);
    }
    return out;
  }
  return String(value);
}

function makeRunId(now) {
  return `v3-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class EventLog {
  constructor(options = {}) {
    this.capacity = Math.max(100, Number(options.capacity) || 4000);
    this.now = options.now || (() => Date.now());
    this.version = options.version || 'v3';
    this.runId = options.runId || makeRunId(this.now());
    this.events = [];
    this.sequence = 0;
    this.sink = typeof options.sink === 'function' ? options.sink : null;
  }

  emit(input = {}) {
    const event = {
      seq: ++this.sequence,
      ts: new Date(this.now()).toISOString(),
      runId: this.runId,
      version: this.version,
      severity: input.severity || 'info',
      component: input.component || 'runtime',
      event: input.event || 'EVENT',
      character: input.character || null,
      taskId: input.taskId || null,
      reason: input.reason || null,
      data: cloneSafe(input.data || {})
    };
    this.events.push(event);
    if (this.events.length > this.capacity) this.events.splice(0, this.events.length - this.capacity);
    if (this.sink) {
      try { this.sink(event); } catch (_) { /* diagnostics must never block gameplay */ }
    }
    return event;
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.events.length, Number(limit) || 0));
    return this.events.slice(this.events.length - n).map((e) => cloneSafe(e));
  }

  query(options = {}) {
    if (typeof options === 'number') return this.list(options);
    const filters = options && typeof options === 'object' ? options : {};
    let rows = this.events;
    for (const field of ['component', 'event', 'severity', 'character', 'taskId', 'reason']) {
      if (filters[field] != null) rows = rows.filter((e) => e[field] === filters[field]);
    }
    if (filters.sinceSeq != null) rows = rows.filter((e) => e.seq > Number(filters.sinceSeq));
    if (Array.isArray(filters.events) && filters.events.length) {
      const accepted = new Set(filters.events);
      rows = rows.filter((e) => accepted.has(e.event));
    }
    const limit = Math.max(0, Math.min(rows.length, Number(filters.limit == null ? 100 : filters.limit) || 0));
    return rows.slice(rows.length - limit).map((e) => cloneSafe(e));
  }

  summary() {
    const counts = {};
    const severities = {};
    const components = {};
    const reasons = {};
    for (const e of this.events) {
      counts[e.event] = (counts[e.event] || 0) + 1;
      severities[e.severity] = (severities[e.severity] || 0) + 1;
      components[e.component] = (components[e.component] || 0) + 1;
      if (e.reason) reasons[e.reason] = (reasons[e.reason] || 0) + 1;
    }
    return {
      runId: this.runId,
      retained: this.events.length,
      firstSeq: this.events[0] ? this.events[0].seq : null,
      lastSeq: this.events[this.events.length - 1] ? this.events[this.events.length - 1].seq : null,
      counts,
      severities,
      components,
      reasons
    };
  }

  exportBundle(context = {}) {
    return JSON.stringify({
      manifest: {
        botVersion: this.version,
        schemaVersion: 2,
        runId: this.runId,
        exportedAt: new Date(this.now()).toISOString()
      },
      context: cloneSafe(context),
      eventSummary: this.summary(),
      events: this.list(this.events.length)
    }, null, 2);
  }
}

module.exports = { EventLog, cloneSafe };

},
"src/core/scheduler.js": function(require,module,exports){
'use strict';

const { TaskState } = require('./task');

class Scheduler {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.queue = [];
    this.activeByOwner = new Map();
    this.completed = [];
    this.completedCapacity = Math.max(20, Number(options.completedCapacity) || 200);
  }

  _event(task, event, severity = 'info', reason = null, data = {}) {
    if (!this.log) return;
    this.log.emit({ component: 'scheduler', event, severity, taskId: task.id, character: task.owner, reason, data: { type: task.type, ...data } });
  }

  submit(task) {
    if (!task || !task.id) throw new Error('valid task required');
    if (task.key) {
      const duplicate = this.queue.find((t) => t.owner === task.owner && t.key === task.key) ||
        [...this.activeByOwner.values()].find((t) => t.owner === task.owner && t.key === task.key);
      if (duplicate) return duplicate;
    }
    this.queue.push(task);
    this._event(task, 'TASK_QUEUED', 'info', null, { priority: task.priority, key: task.key });
    return task;
  }

  cancelOwner(owner, reason = 'CANCELLED') {
    const active = this.activeByOwner.get(owner);
    if (active) {
      active.state = TaskState.CANCELLED;
      active.reason = reason;
      try { if (active.onCancel) active.onCancel(reason); } catch (_) {}
      this._event(active, 'TASK_CANCELLED', 'warn', reason);
      this._finish(active);
    }
    const removed = this.queue.filter((t) => t.owner === owner);
    this.queue = this.queue.filter((t) => t.owner !== owner);
    for (const task of removed) {
      task.state = TaskState.CANCELLED;
      task.reason = reason;
      this._event(task, 'TASK_CANCELLED', 'warn', reason);
      this._remember(task);
    }
  }

  _remember(task) {
    this.completed.push({ id: task.id, key: task.key, type: task.type, owner: task.owner, state: task.state, reason: task.reason, retries: task.retries, startedAt: task.startedAt, updatedAt: task.updatedAt });
    if (this.completed.length > this.completedCapacity) this.completed.splice(0, this.completed.length - this.completedCapacity);
  }

  _finish(task) {
    this.activeByOwner.delete(task.owner);
    this._remember(task);
  }

  _nextForOwner(owner) {
    const candidates = this.queue.filter((t) => t.owner === owner);
    candidates.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    const task = candidates[0];
    if (!task) return null;
    this.queue.splice(this.queue.indexOf(task), 1);
    return task;
  }

  _owners() {
    return [...new Set([...this.queue.map((t) => t.owner), ...this.activeByOwner.keys()])];
  }

  _start(task, now, context) {
    if (task.precondition) {
      let ok = false;
      try { ok = task.precondition(context) !== false; } catch (error) {
        task.state = TaskState.FAILED_RETRYABLE;
        task.reason = `PRECONDITION_ERROR:${error && error.message || error}`;
        this._event(task, 'TASK_PRECONDITION_ERROR', 'warn', task.reason);
        this._retryOrFinish(task, now);
        return false;
      }
      if (!ok) {
        task.state = TaskState.WAITING;
        task.reason = 'PRECONDITION_FALSE';
        task.updatedAt = now;
        this.queue.push(task);
        this._event(task, 'TASK_WAITING', 'info', task.reason);
        return false;
      }
    }
    task.state = TaskState.RUNNING;
    task.startedAt = task.startedAt || now;
    task.updatedAt = now;
    task.lastProgressAt = now;
    if (task.progress) {
      try { task.lastProgressToken = task.progress(context); } catch (_) {}
    }
    this.activeByOwner.set(task.owner, task);
    this._event(task, 'TASK_STARTED', 'info', null, { priority: task.priority });
    return true;
  }

  _retryOrFinish(task, now) {
    this.activeByOwner.delete(task.owner);
    if (task.state === TaskState.FAILED_RETRYABLE && task.retries < task.maxRetries) {
      task.retries += 1;
      task.state = TaskState.QUEUED;
      task.updatedAt = now;
      task.startedAt = null;
      task.lastProgressAt = null;
      task.reason = null;
      this.queue.push(task);
      this._event(task, 'TASK_RETRY_QUEUED', 'warn', null, { retry: task.retries, maxRetries: task.maxRetries });
      return;
    }
    this._remember(task);
  }

  _observeProgress(task, context, now) {
    if (!task.progress) return;
    let token;
    try { token = task.progress(context); } catch (error) {
      this._event(task, 'TASK_PROGRESS_ERROR', 'warn', String(error && error.message || error));
      return;
    }
    if (token !== task.lastProgressToken) {
      task.lastProgressToken = token;
      task.lastProgressAt = now;
      this._event(task, 'TASK_PROGRESS', 'info', null, { progress: token });
    }
  }

  _run(task, context, now) {
    if (now - task.startedAt > task.timeoutMs) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = 'TASK_TIMEOUT';
      this._event(task, 'TASK_FAILED', 'warn', task.reason);
      this._retryOrFinish(task, now);
      return;
    }
    this._observeProgress(task, context, now);
    if (now - task.lastProgressAt > task.stallMs) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = 'NO_PROGRESS';
      this._event(task, 'TASK_STALLED', 'warn', task.reason, { stallMs: now - task.lastProgressAt, progress: task.lastProgressToken });
      this._retryOrFinish(task, now);
      return;
    }

    let result;
    try { result = task.step(context, task); } catch (error) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = `STEP_ERROR:${error && error.message || error}`;
      this._event(task, 'TASK_FAILED', 'error', task.reason);
      this._retryOrFinish(task, now);
      return;
    }
    task.updatedAt = now;
    const state = typeof result === 'string' ? result : result && result.state;
    const reason = result && typeof result === 'object' ? result.reason || null : null;
    if (!state || state === TaskState.RUNNING || state === TaskState.WAITING) {
      if (state === TaskState.WAITING) task.state = TaskState.WAITING;
      else task.state = TaskState.RUNNING;
      return;
    }
    if (!Object.values(TaskState).includes(state)) throw new Error(`unknown task state ${state}`);
    task.state = state;
    task.reason = reason;
    if (state === TaskState.SUCCEEDED) this._event(task, 'TASK_SUCCEEDED', 'info', reason);
    else if (state === TaskState.CANCELLED) this._event(task, 'TASK_CANCELLED', 'warn', reason);
    else this._event(task, 'TASK_FAILED', state === TaskState.FAILED_FATAL ? 'error' : 'warn', reason);
    this._retryOrFinish(task, now);
  }

  _maybePreempt(owner, now) {
    const active = this.activeByOwner.get(owner);
    if (!active || !active.interruptible) return;
    const queued = this.queue.filter((t) => t.owner === owner).sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)[0];
    if (!queued || queued.priority <= active.priority) return;
    active.state = TaskState.QUEUED;
    active.updatedAt = now;
    this.activeByOwner.delete(owner);
    this.queue.push(active);
    this._event(active, 'TASK_PREEMPTED', 'warn', 'HIGHER_PRIORITY_TASK', { byTaskId: queued.id, byPriority: queued.priority });
  }

  tick(context = {}) {
    const now = this.now();
    for (const owner of this._owners()) {
      this._maybePreempt(owner, now);
      let active = this.activeByOwner.get(owner);
      if (!active) {
        const next = this._nextForOwner(owner);
        if (next && this._start(next, now, context)) active = next;
      }
      if (active) this._run(active, context, now);
    }
  }

  snapshot() {
    return {
      queued: this.queue.map((t) => ({ id: t.id, key: t.key, type: t.type, owner: t.owner, priority: t.priority, state: t.state, retries: t.retries })),
      active: [...this.activeByOwner.values()].map((t) => ({ id: t.id, key: t.key, type: t.type, owner: t.owner, priority: t.priority, state: t.state, reason: t.reason, retries: t.retries, startedAt: t.startedAt, lastProgressAt: t.lastProgressAt, progress: t.lastProgressToken })),
      completed: this.completed.slice()
    };
  }
}

module.exports = { Scheduler };

},
"src/core/task.js": function(require,module,exports){
'use strict';

const TaskState = Object.freeze({
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED_RETRYABLE: 'FAILED_RETRYABLE',
  FAILED_FATAL: 'FAILED_FATAL',
  CANCELLED: 'CANCELLED'
});

let nextId = 1;

function createTask(spec = {}) {
  if (!spec.type) throw new Error('task type required');
  if (typeof spec.step !== 'function') throw new Error('task step() required');
  const now = Number(spec.createdAt) || Date.now();
  return {
    id: spec.id || `task-${nextId++}`,
    key: spec.key || null,
    type: spec.type,
    owner: spec.owner || 'local',
    priority: Number(spec.priority) || 0,
    interruptible: spec.interruptible !== false,
    maxRetries: Math.max(0, Number(spec.maxRetries) || 0),
    retries: 0,
    stallMs: Math.max(1000, Number(spec.stallMs) || 15000),
    timeoutMs: Math.max(1000, Number(spec.timeoutMs) || 120000),
    createdAt: now,
    startedAt: null,
    updatedAt: now,
    lastProgressAt: null,
    lastProgressToken: undefined,
    state: TaskState.QUEUED,
    reason: null,
    metadata: spec.metadata || {},
    precondition: typeof spec.precondition === 'function' ? spec.precondition : null,
    progress: typeof spec.progress === 'function' ? spec.progress : null,
    step: spec.step,
    onCancel: typeof spec.onCancel === 'function' ? spec.onCancel : null
  };
}

module.exports = { TaskState, createTask };

},
"src/game/adapter.js": function(require,module,exports){
'use strict';

const ACTIVE_ALLOWED = new Set(['attack', 'move', 'smart_move', 'town', 'use_hp', 'use_mp', 'use_hp_or_mp', 'use_skill', 'stop']);

function finite(n) { return Number.isFinite(Number(n)) ? Number(n) : null; }

class GameAdapter {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.parent = options.parent || this.root.parent || this.root;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.mode = options.mode === 'active' ? 'active' : 'shadow';
    this.lastSnapshot = null;
  }

  _character() { return this.root.character || this.parent.character || null; }
  _entities() { return this.root.parent && this.root.parent.entities || this.parent.entities || {}; }
  _G() { return this.root.G || this.parent.G || {}; }
  _entityById(id) {
    if (id == null) return null;
    const wanted = String(id);
    return Object.values(this._entities() || {}).find((entity) => entity && String(entity.id) === wanted) || null;
  }

  _objects() {
    const collections = [
      this.root.chests,
      this.root.parent && this.root.parent.chests,
      this.parent.chests,
      this.root.map_objects,
      this.parent.map_objects
    ];
    const out = new Map();
    for (const collection of collections) {
      if (!collection || typeof collection !== 'object') continue;
      for (const [rawId, object] of Object.entries(collection)) {
        if (!object) continue;
        const id = String(object.id || rawId);
        if (out.has(id)) continue;
        out.set(id, {
          id,
          name: object.name || object.type || object.skin || null,
          type: object.type || object.skin || 'object',
          map: object.map || (this._character() && this._character().map) || null,
          x: finite(object.real_x != null ? object.real_x : object.x),
          y: finite(object.real_y != null ? object.real_y : object.y)
        });
      }
    }
    return [...out.values()];
  }

  setMode(mode) {
    if (mode !== 'shadow' && mode !== 'active') throw new Error('mode must be shadow or active');
    const previous = this.mode;
    this.mode = mode;
    if (this.log) this.log.emit({ component: 'adapter', event: 'MODE_CHANGED', severity: mode === 'active' ? 'warn' : 'info', data: { previous, mode } });
    return this.mode;
  }

  snapshot() {
    const c = this._character();
    if (!c) return null;
    const entities = [];
    for (const entity of Object.values(this._entities() || {})) {
      if (!entity || !entity.id) continue;
      entities.push({
        id: String(entity.id),
        name: entity.name || null,
        type: entity.type || null,
        mtype: entity.mtype || null,
        player: entity.player || null,
        npc: entity.npc || entity.type === 'npc' || null,
        map: entity.map || c.map || null,
        x: finite(entity.real_x != null ? entity.real_x : entity.x),
        y: finite(entity.real_y != null ? entity.real_y : entity.y),
        hp: finite(entity.hp),
        max_hp: finite(entity.max_hp),
        target: entity.target || null,
        dead: !!entity.dead
      });
    }
    const rawItems = Array.isArray(c.items) ? c.items : [];
    const reportedIsize = finite(c.isize);
    const inventorySize = reportedIsize == null
      ? rawItems.length
      : Math.max(0, Math.floor(reportedIsize));
    const inventory = rawItems.slice(0, inventorySize).map((item, index) => item ? ({
      index,
      name: item.name,
      level: Number(item.level) || 0,
      q: Number(item.q) || 1,
      locked: !!item.l,
      special: !!item.p
    }) : null);
    const snap = {
      observedAt: this.now(),
      character: {
        name: c.name || 'unknown',
        ctype: c.ctype || 'unknown',
        level: Number(c.level) || 0,
        map: c.map || null,
        x: finite(c.real_x != null ? c.real_x : c.x),
        y: finite(c.real_y != null ? c.real_y : c.y),
        hp: finite(c.hp), max_hp: finite(c.max_hp),
        mp: finite(c.mp), max_mp: finite(c.max_mp),
        range: finite(c.range), speed: finite(c.speed), frequency: finite(c.frequency),
        xp: finite(c.xp), gold: finite(c.gold),
        moving: !!c.moving,
        target: c.target || null,
        rip: !!c.rip,
        isize: inventorySize,
        inventory
      },
      entities,
      objects: this._objects(),
      party: this._partySnapshot(),
      game: { monstersKnown: Object.keys((this._G().monsters) || {}).length, mapsKnown: Object.keys((this._G().maps) || {}).length }
    };
    this.lastSnapshot = snap;
    return snap;
  }

  _partySnapshot() {
    const party = this.parent.party || {};
    const out = [];
    for (const [name, member] of Object.entries(party)) {
      out.push({ name, type: member && (member.type || member.ctype) || null, level: member && Number(member.level) || null, map: member && member.map || null });
    }
    return out;
  }

  getGameData() { return this._G(); }

  canAttack(targetId) {
    const target = this._entityById(targetId);
    if (!target) return false;
    const fn = this.root.can_attack || this.parent.can_attack;
    if (typeof fn !== 'function') return true;
    try { return fn.call(this.root, target) !== false; } catch (_) { return false; }
  }

  canUseSkill(skillName) {
    const G = this._G();
    const skill = G.skills && G.skills[skillName];
    const c = this._character();
    if (!skill || !c) return false;
    if (Array.isArray(skill.class) && !skill.class.includes(c.ctype)) return false;
    if (Number(skill.level) > 0 && Number(c.level) < Number(skill.level)) return false;
    if (Number(skill.mp) > 0 && Number(c.mp) < Number(skill.mp)) return false;

    if (Array.isArray(skill.wtype) && skill.wtype.length) {
      const slots = c.slots || {};
      const equippedTypes = ['mainhand', 'offhand']
        .map((slot) => slots[slot] && slots[slot].name)
        .filter(Boolean)
        .map((name) => G.items && G.items[name] && G.items[name].wtype)
        .filter(Boolean);
      if (equippedTypes.length && !equippedTypes.some((wtype) => skill.wtype.includes(wtype))) return false;
    }

    const canUse = this.root.can_use || this.parent.can_use;
    if (typeof canUse === 'function') {
      try { return canUse.call(this.root, skillName) !== false; } catch (_) { return false; }
    }
    const onCooldown = this.root.is_on_cooldown || this.parent.is_on_cooldown;
    if (typeof onCooldown === 'function') {
      try { return onCooldown.call(this.root, skillName) !== true; } catch (_) { return false; }
    }
    return true;
  }

  isSkillInRange(targetId, skillName) {
    const target = this._entityById(targetId);
    const c = this._character();
    const G = this._G();
    const skill = G.skills && G.skills[skillName];
    if (!target || !c || !skill) return false;

    const fn = this.root.is_in_range || this.parent.is_in_range;
    if (typeof fn === 'function') {
      try { return fn.call(this.root, target, skillName) !== false; } catch (_) { return false; }
    }

    const cx = finite(c.real_x != null ? c.real_x : c.x);
    const cy = finite(c.real_y != null ? c.real_y : c.y);
    const tx = finite(target.real_x != null ? target.real_x : target.x);
    const ty = finite(target.real_y != null ? target.real_y : target.y);
    if (cx == null || cy == null || tx == null || ty == null) return false;

    let range = finite(skill.range);
    if (range == null) {
      const baseRange = finite(c.range);
      if (baseRange == null) return false;
      range = baseRange * (finite(skill.range_multiplier) || 1);
    }
    return Math.hypot(cx - tx, cy - ty) <= range;
  }

  _prepareArgs(action, args) {
    const out = Array.isArray(args) ? args.slice() : [];
    if (action === 'attack' && typeof out[0] === 'string') {
      const target = this._entityById(out[0]);
      if (target) out[0] = target;
    }
    if (action === 'use_skill' && typeof out[1] === 'string') {
      const target = this._entityById(out[1]);
      if (target) out[1] = target;
    }
    return out;
  }

  command(action, args = []) {
    if (!ACTIVE_ALLOWED.has(action)) {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'ACTION_NOT_ALLOWED_IN_ALPHA', data: { action } });
      return { executed: false, reason: 'ACTION_NOT_ALLOWED_IN_ALPHA' };
    }
    if (this.mode !== 'active') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'SHADOW_COMMAND', data: { action, args: args.map((x) => typeof x === 'object' && x ? (x.id || x.name || '[object]') : x) } });
      return { executed: false, shadow: true };
    }
    let resolvedAction = action;
    let fn = this.root[action] || this.parent[action];
    if (typeof fn !== 'function' && (action === 'use_hp' || action === 'use_mp')) {
      resolvedAction = 'use_hp_or_mp';
      fn = this.root.use_hp_or_mp || this.parent.use_hp_or_mp;
    }
    if (typeof fn !== 'function') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'COMMAND_UNAVAILABLE', data: { action, resolvedAction } });
      return { executed: false, reason: 'COMMAND_UNAVAILABLE', action, resolvedAction };
    }
    try {
      const prepared = this._prepareArgs(resolvedAction, args);
      const value = fn.apply(this.root, prepared);
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', data: { action, resolvedAction } });
      return { executed: true, value, action, resolvedAction };
    } catch (error) {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_FAILED', severity: 'error', reason: String(error && error.message || error), data: { action } });
      return { executed: false, reason: 'COMMAND_FAILED', error };
    }
  }
}

module.exports = { GameAdapter, ACTIVE_ALLOWED };

},
"src/world/world-model.js": function(require,module,exports){
'use strict';

const KnowledgeState = Object.freeze({ UNKNOWN: 'UNKNOWN', KNOWN_TRUE: 'KNOWN_TRUE', KNOWN_FALSE: 'KNOWN_FALSE' });
const EvidenceKind = Object.freeze({ OBSERVED: 'OBSERVED', INFERRED: 'INFERRED', HYPOTHESIS: 'HYPOTHESIS' });
const EVIDENCE_PRIORITY = Object.freeze([EvidenceKind.OBSERVED, EvidenceKind.INFERRED, EvidenceKind.HYPOTHESIS]);

function key(type, id) { return `${type}:${id}`; }
function perfKey(monster, fingerprint) { return `${monster}::${fingerprint || 'unknown-party'}`; }
function knowledgeState(value) {
  if (value === undefined || value === null) return KnowledgeState.UNKNOWN;
  if (typeof value === 'boolean') return value ? KnowledgeState.KNOWN_TRUE : KnowledgeState.KNOWN_FALSE;
  return KnowledgeState.KNOWN_TRUE;
}
function confidence(value) { return Math.max(0, Math.min(1, Number(value == null ? 1 : value))); }

function existingEvidence(fact) {
  if (!fact) return {};
  if (fact.evidenceByKind && typeof fact.evidenceByKind === 'object') return { ...fact.evidenceByKind };
  if (!fact.evidence) return {};
  return {
    [fact.evidence]: {
      state: fact.state,
      value: fact.value,
      confidence: fact.confidence,
      samples: fact.samples || 0,
      updatedAt: fact.updatedAt || null
    }
  };
}

function resolveEvidence(evidenceByKind) {
  for (const evidence of EVIDENCE_PRIORITY) {
    const record = evidenceByKind[evidence];
    if (!record) continue;
    return { ...record, evidence, evidenceByKind };
  }
  return {
    state: KnowledgeState.UNKNOWN,
    value: null,
    confidence: 0,
    evidence: null,
    samples: 0,
    updatedAt: null,
    evidenceByKind
  };
}

class WorldModel {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.maxEntities = Math.max(100, Number(options.maxEntities) || 5000);
    this.maxPerformanceProfiles = Math.max(50, Number(options.maxPerformanceProfiles) || 1000);
    this.entities = new Map();
    this.performance = new Map();
    this.revision = 0;
  }

  hasEntity(type, id) { return this.entities.has(key(type, id)); }
  entity(type, id) { return this.entities.get(key(type, id)) || null; }

  _touch() { this.revision += 1; }

  _pruneEntities() {
    if (this.entities.size <= this.maxEntities) return;
    const removable = [...this.entities.entries()].sort((a, b) => (a[1].lastSeenAt || 0) - (b[1].lastSeenAt || 0));
    const count = this.entities.size - this.maxEntities;
    for (let i = 0; i < count; i++) this.entities.delete(removable[i][0]);
    if (this.log && count > 0) this.log.emit({ component: 'world', event: 'WORLD_ENTITIES_PRUNED', severity: 'warn', data: { count, maxEntities: this.maxEntities } });
  }

  _prunePerformance() {
    if (this.performance.size <= this.maxPerformanceProfiles) return;
    const removable = [...this.performance.entries()].sort((a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0));
    const count = this.performance.size - this.maxPerformanceProfiles;
    for (let i = 0; i < count; i++) this.performance.delete(removable[i][0]);
    if (this.log && count > 0) this.log.emit({ component: 'world', event: 'WORLD_PERFORMANCE_PRUNED', severity: 'warn', data: { count, maxPerformanceProfiles: this.maxPerformanceProfiles } });
  }

  observeEntity(type, id, attributes = {}, meta = {}) {
    if (!type || !id) return null;
    const k = key(type, id);
    const now = this.now();
    const current = this.entities.get(k) || { type, id: String(id), facts: {}, firstSeenAt: now, lastSeenAt: 0 };
    const evidence = Object.values(EvidenceKind).includes(meta.evidence) ? meta.evidence : EvidenceKind.OBSERVED;
    current.lastSeenAt = now;
    for (const [name, value] of Object.entries(attributes)) {
      const byEvidence = existingEvidence(current.facts[name]);
      const previous = byEvidence[evidence];
      byEvidence[evidence] = {
        state: knowledgeState(value),
        value: value === undefined ? null : value,
        confidence: confidence(meta.confidence),
        samples: (previous && previous.samples || 0) + 1,
        updatedAt: now
      };
      current.facts[name] = resolveEvidence(byEvidence);
    }
    this.entities.set(k, current);
    this._touch();
    this._pruneEntities();
    return current;
  }

  hypothesis(type, id, fact, value, confidenceValue = 0.25) {
    return this.observeEntity(type, id, { [fact]: value }, { evidence: EvidenceKind.HYPOTHESIS, confidence: confidenceValue });
  }

  fact(type, id, factName) {
    const entity = this.entities.get(key(type, id));
    return entity && entity.facts[factName] || { state: KnowledgeState.UNKNOWN, value: null, confidence: 0, evidence: null, samples: 0, updatedAt: null, evidenceByKind: {} };
  }

  evidenceFor(type, id, factName, evidence) {
    const fact = this.fact(type, id, factName);
    if (fact.evidenceByKind && fact.evidenceByKind[evidence]) return { ...fact.evidenceByKind[evidence], evidence };
    if (fact.evidence === evidence) return { state: fact.state, value: fact.value, confidence: fact.confidence, evidence, samples: fact.samples, updatedAt: fact.updatedAt };
    return { state: KnowledgeState.UNKNOWN, value: null, confidence: 0, evidence, samples: 0, updatedAt: null };
  }

  recordPerformance(monster, fingerprint, sample = {}) {
    if (!monster) return null;
    const k = perfKey(monster, fingerprint);
    const current = this.performance.get(k) || {
      monster,
      fingerprint: fingerprint || 'unknown-party',
      seconds: 0,
      xp: 0,
      gold: 0,
      kills: 0,
      deaths: 0,
      potions: 0,
      damageTaken: 0,
      monsterHpLost: 0,
      windows: 0,
      updatedAt: 0
    };
    current.seconds += Math.max(0, Number(sample.seconds) || 0);
    current.xp += Math.max(0, Number(sample.xp) || 0);
    current.gold += Number(sample.gold) || 0;
    current.kills += Math.max(0, Number(sample.kills) || 0);
    current.deaths += Math.max(0, Number(sample.deaths) || 0);
    current.potions += Math.max(0, Number(sample.potions) || 0);
    current.damageTaken += Math.max(0, Number(sample.damageTaken) || 0);
    current.monsterHpLost += Math.max(0, Number(sample.monsterHpLost) || 0);
    current.windows += 1;
    current.updatedAt = this.now();
    this.performance.set(k, current);
    this._touch();
    this._prunePerformance();
    if (this.log) this.log.emit({
      component: 'world',
      event: 'PERFORMANCE_WINDOW_RECORDED',
      data: {
        monster,
        fingerprint: current.fingerprint,
        seconds: sample.seconds || 0,
        xp: sample.xp || 0,
        gold: sample.gold || 0,
        kills: sample.kills || 0,
        deaths: sample.deaths || 0,
        potions: sample.potions || 0,
        damageTaken: sample.damageTaken || 0,
        monsterHpLost: sample.monsterHpLost || 0
      }
    });
    return this.performanceFor(monster, fingerprint);
  }

  performanceFor(monster, fingerprint) {
    const p = this.performance.get(perfKey(monster, fingerprint));
    if (!p) return null;
    const hours = p.seconds / 3600;
    return {
      ...p,
      xpPerHour: hours > 0 ? p.xp / hours : 0,
      goldPerHour: hours > 0 ? p.gold / hours : 0,
      deathsPerHour: hours > 0 ? p.deaths / hours : 0,
      killsPerHour: hours > 0 ? p.kills / hours : 0,
      potionsPerHour: hours > 0 ? p.potions / hours : 0,
      damageTakenPerHour: hours > 0 ? p.damageTaken / hours : 0,
      monsterHpLostPerHour: hours > 0 ? p.monsterHpLost / hours : 0,
      confidence: Math.max(0, Math.min(1, p.seconds / 1800))
    };
  }

  summary() {
    const evidence = { OBSERVED: 0, INFERRED: 0, HYPOTHESIS: 0, UNKNOWN: 0 };
    const entityTypes = {};
    for (const entity of this.entities.values()) {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
      for (const fact of Object.values(entity.facts)) {
        const records = fact.evidenceByKind && Object.keys(fact.evidenceByKind).length
          ? Object.entries(fact.evidenceByKind)
          : [[fact.evidence, fact]];
        for (const [kind, record] of records) {
          if (!record || record.state === KnowledgeState.UNKNOWN || !kind) evidence.UNKNOWN += 1;
          else evidence[kind] = (evidence[kind] || 0) + 1;
        }
      }
    }
    return { entities: this.entities.size, entityTypes, performanceProfiles: this.performance.size, evidence, revision: this.revision };
  }

  diagnosticsSnapshot(limit = 100) {
    const n = Math.max(0, Number(limit) || 0);
    return {
      summary: this.summary(),
      recentEntities: [...this.entities.values()].sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)).slice(0, n),
      performance: [...this.performance.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, n).map((p) => this.performanceFor(p.monster, p.fingerprint))
    };
  }

  serialize() {
    return JSON.stringify({
      schemaVersion: 2,
      revision: this.revision,
      entities: [...this.entities.entries()],
      performance: [...this.performance.entries()]
    });
  }

  restore(serialized) {
    const data = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
    if (!data || (data.schemaVersion !== 1 && data.schemaVersion !== 2)) throw new Error('unsupported world model schema');
    this.entities = new Map(data.entities || []);
    this.performance = new Map(data.performance || []);
    this.revision = Math.max(0, Number(data.revision) || 0);
    this._pruneEntities();
    this._prunePerformance();
    return this.summary();
  }
}

module.exports = { WorldModel, KnowledgeState, EvidenceKind };

},
"src/world/persistence.js": function(require,module,exports){
'use strict';

class WorldPersistence {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.key = options.key || 'AIO_V3_WORLD_MODEL';
    this.minIntervalMs = Math.max(5000, Number(options.minIntervalMs) || 30000);
    this.maxBytes = Math.max(10000, Number(options.maxBytes) || 900000);
    this.storage = options.storage || null;
    this.lastSavedAt = 0;
    this.lastSavedRevision = -1;
    this.loaded = false;
    this.backendName = null;
    this.unavailableLogged = false;
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') {
      this.backendName = 'custom';
      return this.storage;
    }
    const get = this.root && this.root.get;
    const set = this.root && this.root.set;
    if (typeof get === 'function' && typeof set === 'function') {
      this.backendName = 'adventure-land';
      return { get: (key) => get.call(this.root, key), set: (key, value) => set.call(this.root, key, value) };
    }
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') {
      this.backendName = 'localStorage';
      return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    }
    this.backendName = null;
    return null;
  }

  load(world) {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      return false;
    }
    try {
      const serialized = backend.get(this.key);
      if (serialized == null || serialized === '') {
        if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_STORAGE_EMPTY', data: { backend: this.backendName } });
        return false;
      }
      world.restore(serialized);
      this.lastSavedRevision = world.revision;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORED', data: { backend: this.backendName, bytes: String(serialized).length, revision: world.revision } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORE_FAILED', severity: 'warn', reason: 'PERSISTENCE_READ_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      return false;
    }
  }

  maybeSave(world, options = {}) {
    const force = options.force === true;
    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      return false;
    }
    const now = this.now();
    if (!force && world.revision === this.lastSavedRevision) return false;
    if (!force && now - this.lastSavedAt < this.minIntervalMs) return false;

    let serialized;
    try { serialized = world.serialize(); } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'SERIALIZE_ERROR', data: { message: String(error && error.message || error) } });
      return false;
    }
    if (serialized.length > this.maxBytes) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_SKIPPED', severity: 'warn', reason: 'PERSISTENCE_SIZE_LIMIT', data: { bytes: serialized.length, maxBytes: this.maxBytes, revision: world.revision } });
      return false;
    }
    try {
      backend.set(this.key, serialized);
      this.lastSavedAt = now;
      this.lastSavedRevision = world.revision;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVED', data: { backend: this.backendName, bytes: serialized.length, revision: world.revision, forced: force } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'PERSISTENCE_WRITE_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      return false;
    }
  }

  _logUnavailable() {
    if (this.unavailableLogged) return;
    this.unavailableLogged = true;
    if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_PERSISTENCE_UNAVAILABLE', severity: 'warn', reason: 'NO_SUPPORTED_STORAGE' });
  }

  status() {
    return {
      backend: this.backendName,
      loaded: this.loaded,
      lastSavedAt: this.lastSavedAt || null,
      lastSavedRevision: this.lastSavedRevision
    };
  }
}

module.exports = { WorldPersistence };

},
"src/world/discovery.js": function(require,module,exports){
'use strict';

const { EvidenceKind } = require('./world-model');

function uniqueMaps(existing, map) {
  const out = Array.isArray(existing) ? existing.slice() : [];
  if (map && !out.includes(map)) out.push(map);
  return out.sort();
}

function extractName(value, fallback) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const candidate = value.find((item) => typeof item === 'string');
    return candidate || fallback;
  }
  if (value && typeof value === 'object') return value.mtype || value.type || value.id || value.name || value.npc || fallback;
  return fallback;
}

class DiscoveryService {
  constructor(options = {}) {
    this.world = options.world;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.totalNew = 0;
  }

  _record(type, id, attributes, meta) {
    if (!this.world || !type || !id) return null;
    const isNew = !this.world.hasEntity(type, id);
    const oldMaps = this.world.fact(type, id, 'maps').value;
    const map = attributes && attributes.map;
    const merged = { ...attributes, maps: uniqueMaps(oldMaps, map) };
    delete merged.map;
    const entity = this.world.observeEntity(type, String(id), merged, {
      evidence: meta.evidence,
      confidence: meta.confidence
    });
    if (isNew) {
      this.totalNew += 1;
      if (this.log) this.log.emit({
        component: 'discovery',
        event: 'DISCOVERY_ENTITY_NEW',
        data: { type, id: String(id), map: map || null, evidence: meta.evidence, confidence: meta.confidence, source: meta.source }
      });
    }
    return entity;
  }

  _scanLive(snapshot) {
    let created = 0;
    for (const entity of snapshot.entities || []) {
      if (entity.mtype) {
        const before = this.world.hasEntity('monster', entity.mtype);
        this._record('monster', entity.mtype, {
          map: entity.map || snapshot.character.map,
          lastX: entity.x,
          lastY: entity.y,
          lastHp: entity.hp,
          live: !entity.dead,
          lastSeenSource: 'live-entity'
        }, { evidence: EvidenceKind.OBSERVED, confidence: 1, source: 'live-entity' });
        if (!before) created += 1;
      } else if (entity.npc || entity.type === 'npc') {
        const id = entity.name || entity.id;
        const before = this.world.hasEntity('npc', id);
        this._record('npc', id, {
          map: entity.map || snapshot.character.map,
          lastX: entity.x,
          lastY: entity.y,
          lastSeenSource: 'live-entity'
        }, { evidence: EvidenceKind.OBSERVED, confidence: 1, source: 'live-entity' });
        if (!before) created += 1;
      }
    }
    for (const object of snapshot.objects || []) {
      const id = object.name || object.id;
      const before = this.world.hasEntity('object', id);
      this._record('object', id, {
        map: object.map || snapshot.character.map,
        objectType: object.type || 'object',
        lastX: object.x,
        lastY: object.y,
        lastSeenSource: 'live-object'
      }, { evidence: EvidenceKind.OBSERVED, confidence: 1, source: 'live-object' });
      if (!before) created += 1;
    }
    return created;
  }

  _scanCurrentMapMetadata(snapshot, gameData) {
    const mapName = snapshot.character.map;
    const mapData = gameData && gameData.maps && gameData.maps[mapName];
    if (!mapData || typeof mapData !== 'object') return 0;
    let created = 0;

    const scanCollection = (type, collection, source) => {
      if (!collection) return;
      const values = Array.isArray(collection) ? collection : Object.values(collection);
      values.forEach((value, index) => {
        const id = extractName(value, `${source}-${index}`);
        if (!id) return;
        const before = this.world.hasEntity(type, id);
        this._record(type, id, { map: mapName, lastSeenSource: source }, { evidence: EvidenceKind.INFERRED, confidence: 0.65, source });
        if (!before) created += 1;
      });
    };

    scanCollection('npc', mapData.npcs, 'map-metadata-npc');
    scanCollection('monster', mapData.monsters, 'map-metadata-monster');

    if (Array.isArray(mapData.doors)) {
      mapData.doors.forEach((door, index) => {
        const id = `door:${mapName}:${index}`;
        const before = this.world.hasEntity('object', id);
        const x = Array.isArray(door) ? door[0] : door && door.x;
        const y = Array.isArray(door) ? door[1] : door && door.y;
        this._record('object', id, { map: mapName, objectType: 'door', lastX: x, lastY: y, lastSeenSource: 'map-metadata-door' }, { evidence: EvidenceKind.INFERRED, confidence: 0.65, source: 'map-metadata-door' });
        if (!before) created += 1;
      });
    }
    return created;
  }

  scan(snapshot, gameData = {}) {
    if (!snapshot || !snapshot.character || !this.world) return { newEntities: 0, totalNew: this.totalNew };
    const newEntities = this._scanLive(snapshot) + this._scanCurrentMapMetadata(snapshot, gameData);
    if (newEntities && this.log) this.log.emit({
      component: 'discovery',
      event: 'DISCOVERY_SCAN_COMPLETED',
      character: snapshot.character.name,
      data: { map: snapshot.character.map, newEntities, worldEntities: this.world.entities.size }
    });
    return { newEntities, totalNew: this.totalNew };
  }

  status() {
    return { totalNew: this.totalNew };
  }
}

module.exports = { DiscoveryService };

},
"src/telemetry/performance-tracker.js": function(require,module,exports){
'use strict';

function number(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }

function potionCount(inventory) {
  let total = 0;
  for (const item of inventory || []) {
    if (!item || !/^(hpot|mpot)/i.test(String(item.name || ''))) continue;
    total += Math.max(0, number(item.q) || 1);
  }
  return total;
}

function levelRequirement(gameData, level) {
  const levels = gameData && gameData.levels;
  if (!levels) return null;
  const raw = Array.isArray(levels) ? levels[level] : levels[level] != null ? levels[level] : levels[String(level)];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function xpDelta(previous, current, gameData) {
  if (!previous || !current) return 0;
  const before = number(previous.xp);
  const after = number(current.xp);
  const beforeLevel = number(previous.level);
  const afterLevel = number(current.level);
  if (afterLevel === beforeLevel) return Math.max(0, after - before);
  if (afterLevel < beforeLevel) return 0;

  let total = -before + after;
  for (let level = beforeLevel; level < afterLevel; level++) {
    const required = levelRequirement(gameData, level);
    if (required == null) return Math.max(0, after - before);
    total += required;
  }
  return Math.max(0, total);
}

class PerformanceTracker {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.windowMs = Math.max(1000, Number(options.windowMs) || 60000);
    this.minRecordSeconds = Math.max(1, Number(options.minRecordSeconds) || 5);
    this.historyCapacity = Math.max(10, Number(options.historyCapacity) || 120);
    this.previous = null;
    this.window = null;
    this.history = [];
    this.nextWindowId = 1;
  }

  _start(snapshot, context) {
    const now = this.now();
    this.window = {
      id: `perf-${this.nextWindowId++}`,
      startedAt: now,
      lastObservedAt: now,
      character: snapshot.character.name,
      map: snapshot.character.map,
      partyFingerprint: context.partyFingerprint || 'unknown-party',
      xp: 0,
      gold: 0,
      kills: 0,
      deaths: 0,
      potions: 0,
      damageTaken: 0,
      monsterHpLost: 0,
      targetSamples: {},
      killsByMonster: {},
      damageEventsByMonster: {},
      samples: 0
    };
  }

  _contextChanged(snapshot, context) {
    return this.window && (
      this.window.character !== snapshot.character.name ||
      this.window.map !== snapshot.character.map ||
      this.window.partyFingerprint !== (context.partyFingerprint || 'unknown-party')
    );
  }

  _entityMap(snapshot) {
    const map = new Map();
    for (const entity of snapshot && snapshot.entities || []) map.set(entity.id, entity);
    return map;
  }

  _increment(object, key, amount = 1) {
    if (!key) return;
    object[key] = (object[key] || 0) + amount;
  }

  _observeTransition(previous, current, context) {
    const w = this.window;
    const prevC = previous.character;
    const currC = current.character;
    w.samples += 1;
    w.lastObservedAt = this.now();
    w.xp += xpDelta(prevC, currC, context.gameData);
    w.gold += number(currC.gold) - number(prevC.gold);

    if (!prevC.rip && currC.rip) w.deaths += 1;
    if (number(prevC.hp) > number(currC.hp)) w.damageTaken += number(prevC.hp) - number(currC.hp);

    const beforePotions = potionCount(prevC.inventory);
    const afterPotions = potionCount(currC.inventory);
    if (beforePotions > afterPotions) w.potions += beforePotions - afterPotions;

    const prevEntities = this._entityMap(previous);
    const currEntities = this._entityMap(current);
    for (const [id, before] of prevEntities) {
      if (!before.mtype) continue;
      const after = currEntities.get(id);
      if (!after) continue;
      const beforeHp = number(before.hp);
      const afterHp = number(after.hp);
      if (beforeHp > afterHp) {
        w.monsterHpLost += beforeHp - afterHp;
        this._increment(w.damageEventsByMonster, before.mtype);
      }
      const wasAlive = !before.dead && (before.hp == null || beforeHp > 0);
      const isDead = !!after.dead || (after.hp != null && afterHp <= 0);
      if (wasAlive && isDead) {
        w.kills += 1;
        this._increment(w.killsByMonster, before.mtype);
      }
    }

    const targetId = currC.target;
    if (targetId) {
      const target = currEntities.get(String(targetId)) || currEntities.get(targetId);
      if (target && target.mtype) this._increment(w.targetSamples, target.mtype);
    }
  }

  _dominantMonster(window) {
    const score = {};
    for (const [monster, count] of Object.entries(window.targetSamples)) this._increment(score, monster, count);
    for (const [monster, count] of Object.entries(window.killsByMonster)) this._increment(score, monster, count * 8);
    for (const [monster, count] of Object.entries(window.damageEventsByMonster)) this._increment(score, monster, count * 2);
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!ranked.length) return { monster: null, confidence: 0, mixed: false };
    const total = ranked.reduce((sum, row) => sum + row[1], 0);
    const share = total > 0 ? ranked[0][1] / total : 0;
    return { monster: share >= 0.6 || ranked.length === 1 ? ranked[0][0] : null, confidence: share, mixed: ranked.length > 1 && share < 0.6 };
  }

  _rates(window, seconds) {
    const hours = seconds / 3600;
    return {
      xpPerHour: hours > 0 ? window.xp / hours : 0,
      goldPerHour: hours > 0 ? window.gold / hours : 0,
      killsPerHour: hours > 0 ? window.kills / hours : 0,
      deathsPerHour: hours > 0 ? window.deaths / hours : 0,
      potionsPerHour: hours > 0 ? window.potions / hours : 0,
      damageTakenPerHour: hours > 0 ? window.damageTaken / hours : 0,
      monsterHpLostPerHour: hours > 0 ? window.monsterHpLost / hours : 0
    };
  }

  flush(context = {}, reason = 'WINDOW_COMPLETE') {
    if (!this.window) return null;
    const now = this.now();
    const seconds = Math.max(0, (now - this.window.startedAt) / 1000);
    const dominant = this._dominantMonster(this.window);
    const completed = {
      ...this.window,
      endedAt: now,
      seconds,
      monster: dominant.monster,
      targetConfidence: dominant.confidence,
      mixedTargets: dominant.mixed,
      rates: this._rates(this.window, seconds),
      reason
    };
    this.history.push(completed);
    if (this.history.length > this.historyCapacity) this.history.splice(0, this.history.length - this.historyCapacity);

    if (this.log) {
      this.log.emit({
        component: 'performance',
        event: 'PERFORMANCE_WINDOW_COMPLETED',
        character: completed.character,
        reason: dominant.monster ? reason : (dominant.mixed ? 'MIXED_TARGETS' : 'TARGET_UNKNOWN'),
        data: {
          windowId: completed.id,
          seconds: Number(seconds.toFixed(3)),
          monster: dominant.monster,
          targetConfidence: Number(dominant.confidence.toFixed(3)),
          partyFingerprint: completed.partyFingerprint,
          map: completed.map,
          xp: completed.xp,
          gold: completed.gold,
          kills: completed.kills,
          deaths: completed.deaths,
          potions: completed.potions,
          damageTaken: completed.damageTaken,
          monsterHpLost: completed.monsterHpLost,
          rates: completed.rates
        }
      });
    }

    const world = context.world;
    if (world && dominant.monster && seconds >= this.minRecordSeconds) {
      world.recordPerformance(dominant.monster, completed.partyFingerprint, {
        seconds,
        xp: completed.xp,
        gold: completed.gold,
        kills: completed.kills,
        deaths: completed.deaths,
        potions: completed.potions,
        damageTaken: completed.damageTaken,
        monsterHpLost: completed.monsterHpLost
      });
    }
    this.window = null;
    return completed;
  }

  observe(snapshot, context = {}) {
    if (!snapshot || !snapshot.character) return null;
    if (!this.window) this._start(snapshot, context);
    if (this.previous && this._contextChanged(snapshot, context)) {
      this.flush(context, 'CONTEXT_CHANGED');
      this._start(snapshot, context);
      this.previous = snapshot;
      return this.status();
    }
    if (this.previous) this._observeTransition(this.previous, snapshot, context);
    this.previous = snapshot;

    if (this.now() - this.window.startedAt >= this.windowMs) {
      this.flush(context, 'WINDOW_COMPLETE');
      this._start(snapshot, context);
    }
    return this.status();
  }

  status() {
    const current = this.window ? {
      id: this.window.id,
      startedAt: this.window.startedAt,
      seconds: Math.max(0, (this.now() - this.window.startedAt) / 1000),
      character: this.window.character,
      map: this.window.map,
      partyFingerprint: this.window.partyFingerprint,
      xp: this.window.xp,
      gold: this.window.gold,
      kills: this.window.kills,
      deaths: this.window.deaths,
      potions: this.window.potions,
      damageTaken: this.window.damageTaken,
      monsterHpLost: this.window.monsterHpLost,
      rates: this._rates(this.window, Math.max(0, (this.now() - this.window.startedAt) / 1000))
    } : null;
    return { windowMs: this.windowMs, current, recent: this.history.slice(-10) };
  }
}

module.exports = { PerformanceTracker, xpDelta, potionCount };

},
"src/research/research.js": function(require,module,exports){
'use strict';

const ExperimentState = Object.freeze({
  READY: 'READY',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

const OBSERVATION_ONLY_KINDS = new Set(['OBSERVE', 'MEASURE', 'COMPARE']);

class ResearchJournal {
  constructor(options = {}) {
    this.world = options.world || null;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.hypotheses = new Map();
    this.experiments = new Map();
    this.nextHypothesisId = 1;
    this.nextExperimentId = 1;
  }

  hypothesis(spec = {}) {
    if (!spec.type || !spec.entityId || !spec.fact) throw new Error('type, entityId and fact are required');
    const id = spec.id || `hyp-${this.nextHypothesisId++}`;
    const record = {
      id,
      type: spec.type,
      entityId: String(spec.entityId),
      fact: spec.fact,
      value: spec.value,
      confidence: Math.max(0, Math.min(1, Number(spec.confidence == null ? 0.25 : spec.confidence))),
      rationale: spec.rationale || null,
      createdAt: this.now()
    };
    this.hypotheses.set(id, record);
    if (this.world) this.world.hypothesis(record.type, record.entityId, record.fact, record.value, record.confidence);
    if (this.log) this.log.emit({ component: 'research', event: 'HYPOTHESIS_RECORDED', data: record });
    return { ...record };
  }

  proposeExperiment(spec = {}) {
    const id = spec.id || `exp-${this.nextExperimentId++}`;
    const kind = String(spec.kind || 'OBSERVE').toUpperCase();
    const actions = Array.isArray(spec.actions) ? spec.actions.slice() : [];
    const observationOnly = OBSERVATION_ONLY_KINDS.has(kind) && !spec.requiresAction && actions.length === 0;
    const state = observationOnly ? ExperimentState.READY : ExperimentState.BLOCKED;
    const reason = observationOnly ? null : 'ALPHA_OBSERVATION_ONLY';
    const record = {
      id,
      kind,
      target: spec.target || null,
      hypothesisId: spec.hypothesisId || null,
      method: spec.method || null,
      state,
      reason,
      observationOnly,
      createdAt: this.now(),
      observations: []
    };
    this.experiments.set(id, record);
    if (this.log) this.log.emit({
      component: 'research',
      event: 'EXPERIMENT_PROPOSED',
      severity: state === ExperimentState.BLOCKED ? 'warn' : 'info',
      reason,
      data: { id, kind, target: record.target, hypothesisId: record.hypothesisId, observationOnly }
    });
    return this._cloneExperiment(record);
  }

  recordObservation(experimentId, observation = {}) {
    const record = this.experiments.get(experimentId);
    if (!record) throw new Error('unknown experiment');
    if (record.state === ExperimentState.BLOCKED || record.state === ExperimentState.CANCELLED) return this._cloneExperiment(record);
    record.observations.push({ at: this.now(), ...observation });
    if (observation.complete === true) record.state = ExperimentState.COMPLETED;
    if (this.log) this.log.emit({
      component: 'research',
      event: 'EXPERIMENT_OBSERVATION_RECORDED',
      data: { id: record.id, state: record.state, observation }
    });
    return this._cloneExperiment(record);
  }

  _cloneExperiment(record) {
    return { ...record, observations: record.observations.map((row) => ({ ...row })) };
  }

  listExperiments() {
    return [...this.experiments.values()].map((record) => this._cloneExperiment(record));
  }

  summary() {
    const states = {};
    for (const record of this.experiments.values()) states[record.state] = (states[record.state] || 0) + 1;
    return { hypotheses: this.hypotheses.size, experiments: this.experiments.size, states };
  }
}

module.exports = { ResearchJournal, ExperimentState, OBSERVATION_ONLY_KINDS };

},
"src/party/capabilities.js": function(require,module,exports){
'use strict';

const CLASS_PRIORS = Object.freeze({
  ranger: ['ranged_damage', 'multi_target_damage', 'kiting'],
  priest: ['ranged_damage', 'healing', 'party_sustain', 'revive_support'],
  warrior: ['melee_damage', 'high_survivability', 'aggro_control', 'frontline'],
  mage: ['ranged_damage', 'burst_damage', 'multi_target_damage', 'mobility_support'],
  rogue: ['melee_damage', 'burst_damage', 'mobility'],
  paladin: ['melee_damage', 'high_survivability', 'party_sustain'],
  merchant: ['trading', 'banking', 'crafting', 'logistics']
});

function capabilitiesFor(ctype) {
  return (CLASS_PRIORS[String(ctype || '').toLowerCase()] || []).slice();
}

function partyProfile(members = []) {
  const normalized = members.map((member) => {
    const ctype = String(member.ctype || member.type || 'unknown').toLowerCase();
    return {
      name: member.name || 'unknown',
      ctype,
      level: Number(member.level) || 0,
      capabilities: capabilitiesFor(ctype)
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const counts = {};
  const capabilities = {};
  for (const member of normalized) {
    counts[member.ctype] = (counts[member.ctype] || 0) + 1;
    for (const capability of member.capabilities) capabilities[capability] = (capabilities[capability] || 0) + 1;
  }
  const fingerprint = Object.keys(counts).sort().map((ctype) => `${ctype}:${counts[ctype]}`).join('|') || 'solo:unknown';
  return { members: normalized, counts, capabilities, fingerprint };
}

module.exports = { CLASS_PRIORS, capabilitiesFor, partyProfile };

},
"src/planner/farm-planner.js": function(require,module,exports){
'use strict';

function clamp01(n) { return Math.max(0, Math.min(1, Number(n) || 0)); }
function normalize(value, max) { return max > 0 ? Math.max(0, Number(value) || 0) / max : 0; }

class FarmPlanner {
  constructor(options = {}) {
    this.log = options.log || null;
    this.maxDeathsPerHour = Number.isFinite(Number(options.maxDeathsPerHour)) ? Number(options.maxDeathsPerHour) : 0.25;
    this.maxTravelSeconds = Number.isFinite(Number(options.maxTravelSeconds)) ? Number(options.maxTravelSeconds) : 600;
    this.explorationWeight = Number.isFinite(Number(options.explorationWeight)) ? Number(options.explorationWeight) : 0.04;
  }

  rank(candidates = [], context = {}) {
    const safe = candidates.filter((candidate) => {
      if (!candidate || !candidate.id) return false;
      if (candidate.blocked || candidate.unsafe) return false;
      const deaths = Math.max(0, Number(candidate.deathsPerHour) || 0);
      return deaths <= this.maxDeathsPerHour;
    });
    if (!safe.length) return [];

    const maxXp = Math.max(1, ...safe.map((c) => Math.max(0, Number(c.xpPerHour) || 0)));
    const maxGold = Math.max(1, ...safe.map((c) => Math.max(0, Number(c.goldPerHour) || 0)));
    const rows = safe.map((candidate) => {
      const xp = Math.max(0, Number(candidate.xpPerHour) || 0);
      const gold = Math.max(0, Number(candidate.goldPerHour) || 0);
      const deaths = Math.max(0, Number(candidate.deathsPerHour) || 0);
      const confidence = clamp01(candidate.confidence == null ? 0.2 : candidate.confidence);
      const travel = Math.max(0, Number(candidate.travelSeconds) || 0);
      const rate = normalize(xp, maxXp) * 0.68 + normalize(gold, maxGold) * 0.32;
      const reliability = 0.72 + confidence * 0.28;
      const risk = Math.max(0.15, 1 - (deaths / Math.max(this.maxDeathsPerHour, 0.01)) * 0.35);
      const travelPenalty = Math.min(0.12, (travel / Math.max(this.maxTravelSeconds, 1)) * 0.12);
      const exploration = (1 - confidence) * this.explorationWeight;
      const score = Math.max(0, rate * reliability * risk - travelPenalty + exploration);
      return {
        ...candidate,
        xpPerHour: xp,
        goldPerHour: gold,
        deathsPerHour: deaths,
        confidence,
        travelSeconds: travel,
        score,
        scoring: { rate, reliability, risk, travelPenalty, exploration }
      };
    });
    rows.sort((a, b) => b.score - a.score || b.xpPerHour - a.xpPerHour || b.goldPerHour - a.goldPerHour || a.travelSeconds - b.travelSeconds || String(a.id).localeCompare(String(b.id)));
    if (this.log && rows[0]) {
      this.log.emit({
        component: 'planner',
        event: 'FARM_TARGET_RANKED',
        character: context.character || null,
        data: {
          selected: rows[0].id,
          partyFingerprint: context.partyFingerprint || null,
          top: rows.slice(0, 5).map((r) => ({ id: r.id, score: Number(r.score.toFixed(5)), xpPerHour: Math.round(r.xpPerHour), goldPerHour: Math.round(r.goldPerHour), deathsPerHour: Number(r.deathsPerHour.toFixed(3)), confidence: Number(r.confidence.toFixed(3)), travelSeconds: Math.round(r.travelSeconds) }))
        }
      });
    }
    return rows;
  }
}

module.exports = { FarmPlanner };

},
"src/farmer/retreat-farmer.js": function(require,module,exports){
'use strict';

const { TaskState } = require('../core/task');
const { SkillFarmerController } = require('./skill-farmer');
const { SafeRetreatPolicy } = require('./safe-retreat');
const { FarmerState } = require('./farmer-fsm');

class RetreatFarmerController extends SkillFarmerController {
  constructor(options = {}) {
    super(options);
    this.safeRetreat = options.safeRetreat || new SafeRetreatPolicy({
      enabled: options.safeRetreatEnabled !== false,
      stepSeconds: options.safeRetreatStepSeconds,
      minStep: options.safeRetreatMinStep,
      maxStep: options.safeRetreatMaxStep,
      maxThreats: options.safeRetreatMaxThreats
    });
    this.lastSafeRetreatMove = null;
    this.lastSafeRetreatFailure = null;
  }

  _consumePendingRetreat(context) {
    const runtime = context && context.runtime;
    if (!runtime || typeof runtime.takeEmergencyRetreat !== 'function') return null;
    return runtime.takeEmergencyRetreat();
  }

  _ensureEmergencyPending(context) {
    const runtime = context && context.runtime;
    const adapter = context && context.adapter;
    if (!runtime || !adapter || adapter.mode !== 'active') return null;
    if (runtime.pendingEmergencyRetreat) return runtime.pendingEmergencyRetreat;
    if (!runtime.combatEmergency || typeof runtime.combatEmergency.evaluate !== 'function') return null;
    if (typeof runtime._noteEmergencyDisengage !== 'function') return null;
    if (this.targetId == null) return null;

    const snapshot = runtime.lastSnapshot || context.snapshot;
    const character = snapshot && snapshot.character;
    if (!snapshot || !character || character.rip) return null;

    const target = (snapshot.entities || []).find((entity) => (
      entity && entity.mtype && !entity.dead &&
      (entity.hp == null || Number(entity.hp) > 0) &&
      String(entity.id) === String(this.targetId)
    ));
    if (!target) return null;

    const emergency = runtime.combatEmergency.evaluate(snapshot, target);
    if (!emergency || !emergency.triggered) return null;

    runtime._noteEmergencyDisengage(target, emergency, snapshot);
    return runtime.pendingEmergencyRetreat || null;
  }

  _handlePendingRetreat(context, pending) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    if (!pending || !snapshot || !character || character.rip) return false;

    const recovery = this._needsRecovery(snapshot);
    this._maybePotion(context, recovery);
    const decision = this.safeRetreat.evaluate(character, pending.threats || []);

    if (decision.shouldMove) {
      const result = context.adapter.command('move', [decision.x, decision.y]);
      if (result.executed || result.shadow) {
        const now = this.now();
        this.lastActionAt = now;
        this.lastSafeRetreatMove = {
          at: now,
          emergencyReason: pending.reason || null,
          sourceTargetId: pending.sourceTargetId || null,
          sourceTargetType: pending.sourceTargetType || null,
          hpRatio: pending.hpRatio == null ? null : Number(pending.hpRatio),
          reason: decision.reason,
          threatCount: decision.threatCount,
          nearestThreatId: decision.nearestThreatId,
          nearestThreatDistance: decision.nearestThreatDistance,
          step: decision.step,
          x: Number(decision.x.toFixed(2)),
          y: Number(decision.y.toFixed(2))
        };
        this.lastSafeRetreatFailure = null;
        this._event('FARMER_SAFE_RETREAT_REQUESTED', 'warn', decision.reason, {
          emergencyReason: pending.reason || null,
          sourceTargetId: pending.sourceTargetId || null,
          sourceTargetType: pending.sourceTargetType || null,
          hpRatio: pending.hpRatio == null ? null : Number(pending.hpRatio),
          threatCount: decision.threatCount,
          nearestThreatId: decision.nearestThreatId,
          nearestThreatDistance: decision.nearestThreatDistance,
          step: decision.step,
          x: Math.round(decision.x),
          y: Math.round(decision.y)
        });
        this._clearTarget('EMERGENCY_SAFE_RETREAT');
        this._transition(FarmerState.RECOVER, 'EMERGENCY_SAFE_RETREAT');
        return true;
      }

      this.lastSafeRetreatFailure = {
        at: this.now(),
        reason: result.reason || 'SAFE_RETREAT_MOVE_FAILED',
        emergencyReason: pending.reason || null,
        sourceTargetId: pending.sourceTargetId || null,
        sourceTargetType: pending.sourceTargetType || null
      };
      this._event('FARMER_SAFE_RETREAT_FAILED', 'warn', this.lastSafeRetreatFailure.reason, {
        emergencyReason: pending.reason || null,
        sourceTargetId: pending.sourceTargetId || null,
        sourceTargetType: pending.sourceTargetType || null,
        x: Math.round(decision.x),
        y: Math.round(decision.y)
      });
    } else {
      this.lastSafeRetreatFailure = {
        at: this.now(),
        reason: decision.reason,
        emergencyReason: pending.reason || null,
        sourceTargetId: pending.sourceTargetId || null,
        sourceTargetType: pending.sourceTargetType || null
      };
      this._event('FARMER_SAFE_RETREAT_SKIPPED', 'warn', decision.reason, {
        emergencyReason: pending.reason || null,
        sourceTargetId: pending.sourceTargetId || null,
        sourceTargetType: pending.sourceTargetType || null
      });
    }

    this._clearTarget('EMERGENCY_SAFE_RETREAT_UNAVAILABLE');
    this._transition(FarmerState.RECOVER, 'EMERGENCY_SAFE_RETREAT_UNAVAILABLE');
    return true;
  }

  _activeStep(context) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    if (!snapshot || !character) return super._activeStep(context);

    // Emergency handling must not depend on the current FSM state. Kiting can
    // legitimately move ENGAGE -> TRAVEL while the character is still under
    // attack. Use the runtime's raw snapshot so safety/risk filtering cannot
    // hide the current target from the emergency gate.
    this._ensureEmergencyPending(context);
    const pending = this._consumePendingRetreat(context);
    if (pending && !character.rip) {
      this._handlePendingRetreat(context, pending);
      return { state: TaskState.RUNNING };
    }

    return super._activeStep(context);
  }

  status() {
    return {
      ...super.status(),
      safeRetreat: {
        ...this.safeRetreat.status(),
        lastMove: this.lastSafeRetreatMove,
        lastFailure: this.lastSafeRetreatFailure
      }
    };
  }
}

module.exports = { RetreatFarmerController };

},
"src/farmer/skill-farmer.js": function(require,module,exports){
'use strict';

const { KitingFarmerController } = require('./kiting-farmer');
const { SkillUsagePolicy } = require('./skill-usage');
const { TargetReassessmentPolicy } = require('./target-reassessment');

class SkillFarmerController extends KitingFarmerController {
  constructor(options = {}) {
    super(options);
    this.skillUsage = options.skillUsage || new SkillUsagePolicy({
      enabled: options.skillUsageEnabled !== false,
      mpReserveRatio: options.skillUsageMpReserveRatio,
      minIntervalMs: options.skillUsageMinIntervalMs,
      maxCommandAttempts: options.skillUsageMaxCommandAttempts,
      failureBackoffMs: options.skillUsageFailureBackoffMs,
      failureBackoffMultiplier: options.skillUsageFailureBackoffMultiplier,
      failureBackoffMaxMs: options.skillUsageFailureBackoffMaxMs,
      failureStreakResetMs: options.skillUsageFailureStreakResetMs
    });
    this.targetReassessment = options.targetReassessment || new TargetReassessmentPolicy({
      enabled: options.targetReassessmentEnabled !== false,
      minIntervalMs: options.targetReassessmentMinIntervalMs,
      switchCooldownMs: options.targetReassessmentSwitchCooldownMs,
      selfAggroSwitchFactor: options.targetReassessmentSelfAggroSwitchFactor,
      selfAggroThreatSwitchFactor: options.targetReassessmentSelfAggroThreatSwitchFactor
    });
    this.lastSkillAttemptAt = -Infinity;
    this.selectedSkill = null;
    this.lastSkillUse = null;
    this.lastSkillDecision = null;
    this.lastSkillExecution = null;
    this.skillFailureBackoffs = new Map();
    this.skillFailureHistory = new Map();
    this.lastSkillBackoff = null;
    this.lastSkillFailureRecovery = null;
    this.lastReassessmentAt = -Infinity;
    this.lastTargetSwitchAt = -Infinity;
    this.lastReassessmentDecision = null;
    this.lastTargetSwitch = null;
  }

  _updateSelectedSkill(context) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    const gameData = context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const selected = character ? this.skillUsage.select(character, gameData) : null;
    this.selectedSkill = selected ? selected.id : null;
    return { selected, gameData };
  }

  _shadowStep(context) {
    this._updateSelectedSkill(context);
    return super._shadowStep(context);
  }

  _maybeReassessTarget(context, target) {
    const now = this.now();
    if (now - this.lastReassessmentAt < this.targetReassessment.minIntervalMs) return target;
    this.lastReassessmentAt = now;

    const gameData = context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const decision = this.targetReassessment.evaluate(context && context.snapshot, target, gameData);
    const round = (value) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)) : null;
    const baseRecord = {
      at: now,
      reason: decision.reason,
      currentTargetId: target && target.id || null,
      currentTargetType: target && target.mtype || null,
      currentTargetOwner: decision.currentTargetOwner == null ? (target && target.target || null) : decision.currentTargetOwner,
      candidateTargetId: decision.target && decision.target.id || null,
      candidateTargetType: decision.target && decision.target.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: round(decision.currentDistance),
      candidateDistance: round(decision.targetDistance),
      switchThresholdDistance: round(decision.switchThresholdDistance),
      currentThreatScore: round(decision.currentThreatScore),
      candidateThreatScore: round(decision.targetThreatScore),
      threatSwitchThreshold: round(decision.threatSwitchThreshold)
    };

    if (!decision.switchTarget || !decision.target) {
      this.lastReassessmentDecision = baseRecord;
      return target;
    }

    const sinceSwitch = now - this.lastTargetSwitchAt;
    if (sinceSwitch < this.targetReassessment.switchCooldownMs) {
      this.lastReassessmentDecision = {
        ...baseRecord,
        reason: 'TARGET_SWITCH_COOLDOWN',
        cooldownRemainingMs: Math.max(0, this.targetReassessment.switchCooldownMs - sinceSwitch)
      };
      return target;
    }

    const previousTargetId = target && target.id || null;
    const previousTargetType = target && target.mtype || null;
    const next = decision.target;
    this.targetId = String(next.id);
    this.targetType = next.mtype || null;
    this.lastTargetSwitchAt = now;
    this.lastReassessmentDecision = baseRecord;
    this.lastTargetSwitch = {
      at: now,
      reason: decision.reason,
      fromTargetId: previousTargetId,
      fromTargetType: previousTargetType,
      toTargetId: next.id || null,
      toTargetType: next.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: baseRecord.currentDistance,
      distance: baseRecord.candidateDistance,
      switchThresholdDistance: baseRecord.switchThresholdDistance,
      currentThreatScore: baseRecord.currentThreatScore,
      threatScore: baseRecord.candidateThreatScore,
      threatSwitchThreshold: baseRecord.threatSwitchThreshold
    };

    this._event('FARMER_TARGET_REASSESSED', 'info', decision.reason, {
      previousTargetId,
      previousTargetType,
      nextTargetId: next.id || null,
      nextTargetType: next.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: this.lastTargetSwitch.currentDistance,
      distance: this.lastTargetSwitch.distance,
      switchThresholdDistance: this.lastTargetSwitch.switchThresholdDistance,
      currentThreatScore: this.lastTargetSwitch.currentThreatScore,
      threatScore: this.lastTargetSwitch.threatScore,
      threatSwitchThreshold: this.lastTargetSwitch.threatSwitchThreshold
    });

    return next;
  }

  _skillDecisionRecord(decision, target) {
    return {
      at: this.now(),
      reason: decision.reason,
      preflightReason: decision.reason,
      skill: decision.skill ? decision.skill.id : null,
      targetId: target && target.id || null,
      targetType: target && target.mtype || null,
      mp: decision.mp == null ? null : Number(decision.mp),
      reserveMp: decision.reserveMp == null ? null : Number(decision.reserveMp.toFixed(2)),
      mpAfter: decision.mpAfter == null ? null : Number(decision.mpAfter.toFixed(2)),
      candidateCount: Number(decision.candidateCount) || 0,
      candidateRank: decision.candidateRank == null ? null : Number(decision.candidateRank),
      rejectedCandidates: Array.isArray(decision.rejectedCandidates)
        ? decision.rejectedCandidates.map((entry) => ({
          skill: entry.skill || null,
          rank: Number(entry.rank) || null,
          reason: entry.reason || null,
          mpAfter: entry.mpAfter == null ? null : Number(Number(entry.mpAfter).toFixed(2))
        }))
        : [],
      executionAttempts: [],
      executionOutcome: null,
      executionFallbackUsed: false
    };
  }

  _executionAttemptRecord(attempt, decision, result) {
    return {
      attempt,
      skill: decision.skill ? decision.skill.id : null,
      candidateRank: decision.candidateRank == null ? null : Number(decision.candidateRank),
      selectionReason: decision.reason || null,
      result: result && result.executed ? 'executed' : (result && result.shadow ? 'shadow' : 'failed'),
      failureReason: result && !result.executed && !result.shadow ? (result.reason || 'SKILL_COMMAND_FAILED') : null
    };
  }

  _pruneSkillFailureState(now = this.now()) {
    for (const [skillId, record] of this.skillFailureBackoffs.entries()) {
      if (!record || Number(record.expiresAt) <= now) this.skillFailureBackoffs.delete(skillId);
    }
    for (const [skillId, record] of this.skillFailureHistory.entries()) {
      if (!record || now - Number(record.lastFailureAt) >= this.skillUsage.failureStreakResetMs) {
        this.skillFailureHistory.delete(skillId);
      }
    }
  }

  _pruneSkillFailureBackoffs(now = this.now()) {
    this._pruneSkillFailureState(now);
  }

  _activeSkillFailureBackoffIds(now = this.now()) {
    this._pruneSkillFailureState(now);
    return [...this.skillFailureBackoffs.keys()];
  }

  _skillFailureBackoffStatus(now = this.now()) {
    this._pruneSkillFailureState(now);
    return [...this.skillFailureBackoffs.values()]
      .sort((a, b) => Number(a.expiresAt) - Number(b.expiresAt) || String(a.skill).localeCompare(String(b.skill)))
      .map((record) => ({
        skill: record.skill,
        reason: record.reason,
        at: record.at,
        expiresAt: record.expiresAt,
        remainingMs: Math.max(0, Number(record.expiresAt) - now),
        failureStreak: Number(record.failureStreak) || 1,
        backoffMs: Number(record.backoffMs) || this.skillUsage.failureBackoffMs
      }));
  }

  _skillFailureHistoryStatus(now = this.now()) {
    this._pruneSkillFailureState(now);
    return [...this.skillFailureHistory.values()]
      .sort((a, b) => Number(b.lastFailureAt) - Number(a.lastFailureAt) || String(a.skill).localeCompare(String(b.skill)))
      .map((record) => ({
        skill: record.skill,
        failureStreak: Number(record.failureStreak) || 0,
        firstFailureAt: record.firstFailureAt,
        lastFailureAt: record.lastFailureAt,
        lastBackoffMs: record.lastBackoffMs,
        resetsInMs: Math.max(0, this.skillUsage.failureStreakResetMs - (now - Number(record.lastFailureAt)))
      }));
  }

  _nextSkillFailureRecord(skillId, now = this.now()) {
    const id = String(skillId);
    this._pruneSkillFailureState(now);
    const previous = this.skillFailureHistory.get(id) || null;
    const failureStreak = previous ? Number(previous.failureStreak) + 1 : 1;
    const backoffMs = this.skillUsage.failureBackoffForStreak(failureStreak);
    const record = {
      skill: id,
      failureStreak,
      firstFailureAt: previous ? previous.firstFailureAt : now,
      lastFailureAt: now,
      lastBackoffMs: backoffMs
    };
    this.skillFailureHistory.set(id, record);
    return record;
  }

  _resetSkillFailureState(skill, now = this.now()) {
    if (!skill || !skill.id) return null;
    const id = String(skill.id);
    this._pruneSkillFailureState(now);
    const history = this.skillFailureHistory.get(id) || null;
    const backoff = this.skillFailureBackoffs.get(id) || null;
    if (!history && !backoff) return null;

    this.skillFailureHistory.delete(id);
    this.skillFailureBackoffs.delete(id);
    const recovery = {
      at: now,
      skill: id,
      reason: 'COMMAND_SUCCEEDED',
      previousFailureStreak: history
        ? Number(history.failureStreak) || 0
        : (backoff ? Number(backoff.failureStreak) || 0 : 0)
    };
    this.lastSkillFailureRecovery = recovery;
    this._event('FARMER_SKILL_FAILURE_STREAK_RESET', 'info', 'COMMAND_SUCCEEDED', recovery);
    return recovery;
  }

  _armSkillFailureBackoff(skill, result, now = this.now()) {
    if (!skill || !skill.id || !this.skillUsage.canRetryCommandFailure(result)) return null;
    const failure = this._nextSkillFailureRecord(skill.id, now);
    const record = {
      skill: String(skill.id),
      reason: String(result.reason || 'COMMAND_FAILED'),
      at: now,
      expiresAt: now + failure.lastBackoffMs,
      failureStreak: failure.failureStreak,
      backoffMs: failure.lastBackoffMs
    };
    this.skillFailureBackoffs.set(record.skill, record);
    this.lastSkillBackoff = { ...record };
    this._event('FARMER_SKILL_BACKOFF_ARMED', 'warn', 'SKILL_COMMAND_BACKOFF', {
      skill: record.skill,
      commandReason: record.reason,
      backoffMs: record.backoffMs,
      baseBackoffMs: this.skillUsage.failureBackoffMs,
      maxBackoffMs: this.skillUsage.failureBackoffMaxMs,
      failureStreak: record.failureStreak,
      escalated: record.failureStreak > 1,
      expiresAt: record.expiresAt
    });
    return record;
  }

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;

    if (snapshot && character && target && !target.dead && !(target.hp != null && target.hp <= 0)) {
      const recovery = this._needsRecovery(snapshot);
      const targetAllowed = this._targetAllowed(target, snapshot, context.party);

      if (!character.rip && !recovery.hpUnsafe && targetAllowed) {
        target = this._maybeReassessTarget(context, target);
        const reassessedTargetAllowed = this._targetAllowed(target, snapshot, context.party);

        if (reassessedTargetAllowed) {
          const kiteDecision = this.kiting.evaluate(character, target);
          if (kiteDecision.shouldMove) return super._engage(context, target);

          const { gameData } = this._updateSelectedSkill(context);
          const decision = this.skillUsage.evaluate(snapshot, target, gameData, context.adapter, {
            backoffSkillIds: this._activeSkillFailureBackoffIds(this.now())
          });
          if (decision.skill) this.selectedSkill = decision.skill.id;
          this.lastSkillDecision = this._skillDecisionRecord(decision, target);

          if (decision.useSkill && decision.skill) {
            const now = this.now();
            if (now - this.lastSkillAttemptAt >= this.skillUsage.minIntervalMs) {
              this.lastSkillAttemptAt = now;
              const attemptedSkillIds = [];
              const executionAttempts = [];
              let attemptDecision = decision;
              let executionOutcome = null;

              for (let attempt = 1; attempt <= this.skillUsage.maxCommandAttempts; attempt += 1) {
                if (!attemptDecision || !attemptDecision.useSkill || !attemptDecision.skill) break;

                const skill = attemptDecision.skill;
                this.selectedSkill = skill.id;
                const result = context.adapter.command('use_skill', [skill.id, String(target.id)]);
                executionAttempts.push(this._executionAttemptRecord(attempt, attemptDecision, result));

                if (result.executed || result.shadow) {
                  const failureRecovery = result.executed ? this._resetSkillFailureState(skill, now) : null;
                  const executionReason = attempt === 1
                    ? attemptDecision.reason
                    : 'SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK';
                  executionOutcome = executionReason;
                  this.lastActionAt = now;
                  this.lastSkillDecision = {
                    ...this._skillDecisionRecord(attemptDecision, target),
                    reason: executionReason,
                    preflightReason: attemptDecision.reason,
                    executionAttempts,
                    executionOutcome,
                    executionFallbackUsed: attempt > 1
                  };
                  this.lastSkillExecution = {
                    at: now,
                    targetId: target.id || null,
                    targetType: target.mtype || null,
                    outcome: executionOutcome,
                    attempts: executionAttempts.slice()
                  };
                  this.lastSkillUse = {
                    at: now,
                    skill: skill.id,
                    skillName: skill.name,
                    targetId: target.id || null,
                    targetType: target.mtype || null,
                    mpCost: skill.mp,
                    damageMultiplier: skill.damageMultiplier,
                    selectionReason: attemptDecision.reason,
                    executionReason,
                    candidateRank: attemptDecision.candidateRank == null ? null : Number(attemptDecision.candidateRank),
                    executionAttempt: attempt,
                    failureStreakReset: !!failureRecovery,
                    previousFailureStreak: failureRecovery ? failureRecovery.previousFailureStreak : 0
                  };
                  this._event('FARMER_SKILL_USED', 'info', executionReason, {
                    skill: skill.id,
                    skillName: skill.name,
                    targetId: target.id || null,
                    targetType: target.mtype || null,
                    mpCost: skill.mp,
                    damageMultiplier: skill.damageMultiplier,
                    mpAfter: Number(attemptDecision.mpAfter.toFixed(2)),
                    reserveMp: Number(attemptDecision.reserveMp.toFixed(2)),
                    candidateCount: Number(attemptDecision.candidateCount) || 0,
                    candidateRank: attemptDecision.candidateRank == null ? null : Number(attemptDecision.candidateRank),
                    selectionReason: attemptDecision.reason,
                    executionAttempt: attempt,
                    executionFallbackUsed: attempt > 1,
                    failureStreakReset: !!failureRecovery,
                    previousFailureStreak: failureRecovery ? failureRecovery.previousFailureStreak : 0,
                    rejectedCandidates: this.lastSkillDecision.rejectedCandidates,
                    executionAttempts: executionAttempts.slice()
                  });
                  return;
                }

                attemptedSkillIds.push(skill.id);
                const retryable = this.skillUsage.canRetryCommandFailure(result);
                const backoffRecord = retryable ? this._armSkillFailureBackoff(skill, result, now) : null;
                const withinAttemptLimit = attempt < this.skillUsage.maxCommandAttempts;
                let nextDecision = null;
                if (retryable && withinAttemptLimit) {
                  nextDecision = this.skillUsage.evaluate(snapshot, target, gameData, context.adapter, {
                    skipSkillIds: attemptedSkillIds,
                    backoffSkillIds: this._activeSkillFailureBackoffIds(now)
                  });
                }
                const willRetry = !!(nextDecision && nextDecision.useSkill && nextDecision.skill);

                this._event('FARMER_SKILL_USE_FAILED', 'warn', result.reason || 'SKILL_COMMAND_FAILED', {
                  skill: skill.id,
                  targetId: target.id || null,
                  targetType: target.mtype || null,
                  selectionReason: attemptDecision.reason,
                  candidateRank: attemptDecision.candidateRank == null ? null : Number(attemptDecision.candidateRank),
                  executionAttempt: attempt,
                  retryable,
                  willRetry,
                  maxCommandAttempts: this.skillUsage.maxCommandAttempts,
                  backoffArmed: !!backoffRecord,
                  backoffMs: backoffRecord ? backoffRecord.backoffMs : 0,
                  failureStreak: backoffRecord ? backoffRecord.failureStreak : 0
                });

                if (!retryable) {
                  executionOutcome = 'SKILL_COMMAND_NON_RETRYABLE';
                  break;
                }
                if (!withinAttemptLimit) {
                  executionOutcome = 'SKILL_COMMAND_FALLBACK_EXHAUSTED';
                  break;
                }
                if (!willRetry) {
                  executionOutcome = 'NO_SAFE_EXECUTION_FALLBACK';
                  break;
                }

                attemptDecision = nextDecision;
              }

              this.lastSkillDecision = {
                ...this.lastSkillDecision,
                executionAttempts,
                executionOutcome: executionOutcome || 'SKILL_COMMAND_FALLBACK_EXHAUSTED',
                executionFallbackUsed: executionAttempts.length > 1
              };
              this.lastSkillExecution = {
                at: now,
                targetId: target.id || null,
                targetType: target.mtype || null,
                outcome: this.lastSkillDecision.executionOutcome,
                attempts: executionAttempts.slice()
              };
            }
          }
        }
      }
    }

    return super._engage(context, target);
  }

  status() {
    return {
      ...super.status(),
      skillUsage: {
        ...this.skillUsage.status(),
        selectedSkill: this.selectedSkill,
        lastUse: this.lastSkillUse,
        lastDecision: this.lastSkillDecision,
        lastExecution: this.lastSkillExecution,
        activeFailureBackoffs: this._skillFailureBackoffStatus(),
        recentFailureStreaks: this._skillFailureHistoryStatus(),
        lastBackoff: this.lastSkillBackoff,
        lastFailureRecovery: this.lastSkillFailureRecovery
      },
      targetReassessment: {
        ...this.targetReassessment.status(),
        lastDecision: this.lastReassessmentDecision,
        lastSwitch: this.lastTargetSwitch
      }
    };
  }
}

module.exports = { SkillFarmerController };

},
"src/farmer/kiting-farmer.js": function(require,module,exports){
'use strict';

const { FarmerController } = require('./farmer-fsm');
const { BasicKitingPolicy } = require('./basic-kiting');

class KitingFarmerController extends FarmerController {
  constructor(options = {}) {
    super(options);
    this.kiting = options.kiting || new BasicKitingPolicy({
      enabled: options.kitingEnabled !== false,
      minRange: options.kitingMinRange,
      tooCloseFactor: options.kitingTooCloseFactor,
      desiredFactor: options.kitingDesiredFactor,
      maxStepFactor: options.kitingMaxStepFactor,
      speedStepSeconds: options.kitingSpeedStepSeconds
    });
    this.kiteMoveCooldownMs = Math.max(250, Number(options.kitingMoveCooldownMs) || 650);
    this.lastKiteAt = -Infinity;
    this.lastKiteMove = null;
  }

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    if (snapshot && snapshot.character && target && !target.dead && !(target.hp != null && target.hp <= 0)) {
      const recovery = this._needsRecovery(snapshot);
      const targetAllowed = this._targetAllowed(target, snapshot, context.party);
      if (!snapshot.character.rip && !recovery.hpUnsafe && targetAllowed) {
        const decision = this.kiting.evaluate(snapshot.character, target);
        if (decision.shouldMove) {
          const now = this.now();
          if (now - this.lastKiteAt >= this.kiteMoveCooldownMs) {
            const result = context.adapter.command('move', [decision.x, decision.y]);
            if (result.executed || result.shadow) {
              this.lastKiteAt = now;
              this.lastActionAt = now;
              this.lastKiteMove = {
                at: now,
                targetId: target.id || null,
                targetType: target.mtype || null,
                reason: decision.reason,
                fromDistance: decision.distance,
                desiredDistance: decision.desiredDistance,
                step: decision.step,
                x: Number(decision.x.toFixed(2)),
                y: Number(decision.y.toFixed(2))
              };
              this._event('FARMER_KITE_MOVE_REQUESTED', 'info', decision.reason, {
                distance: decision.distance,
                range: decision.range,
                tooCloseDistance: decision.tooCloseDistance,
                desiredDistance: decision.desiredDistance,
                step: decision.step,
                x: Math.round(decision.x),
                y: Math.round(decision.y)
              });
              return;
            }

            this._event('FARMER_KITE_MOVE_FAILED', 'warn', result.reason || 'KITE_MOVE_FAILED', {
              distance: decision.distance,
              x: Math.round(decision.x),
              y: Math.round(decision.y)
            });
          }
        }
      }
    }

    return super._engage(context, target);
  }

  status() {
    return {
      ...super.status(),
      kiting: {
        ...this.kiting.status(),
        moveCooldownMs: this.kiteMoveCooldownMs,
        lastMove: this.lastKiteMove
      }
    };
  }
}

module.exports = { KitingFarmerController };

},
"src/farmer/farmer-fsm.js": function(require,module,exports){
'use strict';

const { TaskState, createTask } = require('../core/task');

const FarmerState = Object.freeze({
  ASSESS: 'ASSESS',
  SELECT_TARGET: 'SELECT_TARGET',
  TRAVEL: 'TRAVEL',
  ENGAGE: 'ENGAGE',
  RECOVER: 'RECOVER',
  REASSESS: 'REASSESS',
  BLOCKED: 'BLOCKED'
});

const TargetPolicy = Object.freeze({
  AVOID: 'avoid',
  PARTY_ONLY: 'party-only',
  ALLOW: 'allow'
});

function normalizeTargetPolicy(policy) {
  const resolved = String(policy || TargetPolicy.PARTY_ONLY).toLowerCase();
  if (!Object.values(TargetPolicy).includes(resolved)) {
    throw new Error(`target policy must be one of: ${Object.values(TargetPolicy).join(', ')}`);
  }
  return resolved;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function ratio(value, max) {
  const denominator = Number(max) || 0;
  if (denominator <= 0) return 1;
  return clamp01((Number(value) || 0) / denominator);
}

function distance(a, b) {
  if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) return Infinity;
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

function hasPotion(inventory, prefix) {
  return (inventory || []).some((item) => item && String(item.name || '').startsWith(prefix) && (Number(item.q) || 0) > 0);
}

class FarmerController {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.planner = options.planner || null;
    this.enabled = options.enabled !== false;
    this.targetPolicy = normalizeTargetPolicy(options.targetPolicy || TargetPolicy.PARTY_ONLY);
    this.state = FarmerState.ASSESS;
    this.stateSince = this.now();
    this.stateReason = 'INITIAL';
    this.targetId = null;
    this.targetType = null;
    this.lastActionAt = 0;
    this.lastPotionAt = 0;
    this.lastShadowPlanAt = -Infinity;
    this.shadowPlanRevision = 0;
    this.blockedUntil = 0;
    this.lastSelection = null;
    this.taskId = null;
    this.owner = null;
    this.config = {
      recoverHpRatio: Number(options.recoverHpRatio) || 0.75,
      engageMinHpRatio: Number(options.engageMinHpRatio) || 0.45,
      useHpRatio: Number(options.useHpRatio) || 0.62,
      recoverMpRatio: Number(options.recoverMpRatio) || 0.22,
      useMpRatio: Number(options.useMpRatio) || 0.28,
      potionCooldownMs: Math.max(500, Number(options.potionCooldownMs) || 1800),
      moveCooldownMs: Math.max(250, Number(options.moveCooldownMs) || 900),
      fallbackAttackIntervalMs: Math.max(250, Number(options.attackIntervalMs) || 950),
      shadowPlanIntervalMs: Math.max(1000, Number(options.shadowPlanIntervalMs) || 5000),
      blockedRetryMs: Math.max(1000, Number(options.blockedRetryMs) || 5000),
      engagementRangeFactor: Math.max(0.4, Math.min(0.95, Number(options.engagementRangeFactor) || 0.8))
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log) return;
    this.log.emit({
      component: 'farmer',
      event,
      severity,
      character: this.owner,
      reason,
      data: {
        state: this.state,
        targetId: this.targetId,
        targetType: this.targetType,
        targetPolicy: this.targetPolicy,
        ...data
      }
    });
  }

  _transition(next, reason, data = {}) {
    if (!FarmerState[next] && !Object.values(FarmerState).includes(next)) throw new Error(`unknown farmer state ${next}`);
    const resolved = FarmerState[next] || next;
    if (this.state === resolved && this.stateReason === reason) return;
    const previous = this.state;
    this.state = resolved;
    this.stateSince = this.now();
    this.stateReason = reason || null;
    this._event('FARMER_STATE_CHANGED', 'info', reason || null, { from: previous, to: resolved, ...data });
  }

  _clearTarget(reason = 'TARGET_CLEARED') {
    if (this.targetId || this.targetType) {
      this._event('FARMER_TARGET_CLEARED', 'info', reason, { clearedTargetId: this.targetId, clearedTargetType: this.targetType });
    }
    this.targetId = null;
    this.targetType = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled !== false;
    this._event(this.enabled ? 'FARMER_ENABLED' : 'FARMER_DISABLED', this.enabled ? 'info' : 'warn');
    if (this.enabled) this._transition(FarmerState.REASSESS, 'ENABLED');
    return this.enabled;
  }

  setTargetPolicy(policy) {
    const resolved = normalizeTargetPolicy(policy);
    if (resolved === this.targetPolicy) return this.targetPolicy;
    const previous = this.targetPolicy;
    this.targetPolicy = resolved;
    this.lastShadowPlanAt = -Infinity;
    this._clearTarget('TARGET_POLICY_CHANGED');
    this._transition(FarmerState.REASSESS, 'TARGET_POLICY_CHANGED', { previousTargetPolicy: previous, targetPolicy: resolved });
    this._event('FARMER_TARGET_POLICY_CHANGED', 'info', 'TARGET_POLICY_CHANGED', { previousTargetPolicy: previous, targetPolicy: resolved });
    return this.targetPolicy;
  }

  _attackIntervalMs(snapshot) {
    const frequency = snapshot && snapshot.character && Number(snapshot.character.frequency);
    if (Number.isFinite(frequency) && frequency > 0) return Math.max(250, Math.ceil(1000 / frequency));
    return this.config.fallbackAttackIntervalMs;
  }

  _engagementRange(snapshot) {
    const liveRange = snapshot && snapshot.character && Number(snapshot.character.range);
    const base = Number.isFinite(liveRange) && liveRange > 0 ? liveRange : 100;
    return Math.max(25, base * this.config.engagementRangeFactor);
  }

  _findTarget(snapshot) {
    if (!snapshot || !this.targetId) return null;
    return (snapshot.entities || []).find((entity) => entity && String(entity.id) === String(this.targetId)) || null;
  }

  _friendlyNames(snapshot, party) {
    const names = new Set();
    const selfName = snapshot && snapshot.character && snapshot.character.name;
    if (selfName) names.add(selfName);
    for (const member of party && party.members || []) if (member && member.name) names.add(member.name);
    return names;
  }

  _targetAllowed(entity, snapshot, party) {
    if (!entity || !snapshot || !snapshot.character) return false;
    if (!entity.target) return true;
    if (entity.target === snapshot.character.name) return true;
    if (this.targetPolicy === TargetPolicy.ALLOW) return true;
    if (this.targetPolicy === TargetPolicy.AVOID) return false;
    return this._friendlyNames(snapshot, party).has(entity.target);
  }

  _safeLiveMonsters(snapshot, party) {
    if (!snapshot || !snapshot.character) return [];
    const c = snapshot.character;
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && entity.hp <= 0)) return false;
      if (entity.map && c.map && entity.map !== c.map) return false;
      return this._targetAllowed(entity, snapshot, party);
    });
  }

  _candidateRows(context) {
    const snapshot = context.snapshot;
    const party = context.party || { fingerprint: 'solo:unknown' };
    const world = context.world;
    const gameData = context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const monsters = this._safeLiveMonsters(snapshot, party);
    const rows = [];
    const byType = new Map();
    for (const entity of monsters) {
      const list = byType.get(entity.mtype) || [];
      list.push(entity);
      byType.set(entity.mtype, list);
    }
    for (const [mtype, entities] of byType.entries()) {
      const learned = world && world.performanceFor ? world.performanceFor(mtype, party.fingerprint) : null;
      const g = gameData.monsters && gameData.monsters[mtype] || {};
      const nearest = entities.slice().sort((a, b) => distance(snapshot.character, a) - distance(snapshot.character, b))[0];
      rows.push({
        id: mtype,
        monster: mtype,
        xpPerHour: learned ? learned.xpPerHour : Math.max(0, Number(g.xp) || 0) * 60,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.05,
        travelSeconds: Number.isFinite(distance(snapshot.character, nearest)) ? distance(snapshot.character, nearest) / Math.max(1, Number(snapshot.character.speed) || 40) : 120,
        source: learned ? 'measured' : 'estimate-live'
      });
    }
    return { rows, monsters };
  }

  _selectTarget(context) {
    const { rows, monsters } = this._candidateRows(context);
    if (!rows.length || !monsters.length) return null;
    const ranked = this.planner && this.planner.rank ? this.planner.rank(rows, {
      character: context.snapshot.character.name,
      partyFingerprint: context.party && context.party.fingerprint || null
    }) : rows;
    if (!ranked.length) return null;
    const type = ranked[0].monster || ranked[0].id;
    const candidates = monsters.filter((entity) => entity.mtype === type)
      .sort((a, b) => distance(context.snapshot.character, a) - distance(context.snapshot.character, b));
    const target = candidates[0];
    if (!target) return null;
    return { target, ranking: ranked[0] };
  }

  _inventory(snapshot) {
    return snapshot && snapshot.character && snapshot.character.inventory || [];
  }

  _needsRecovery(snapshot) {
    const c = snapshot.character;
    const hpRatio = ratio(c.hp, c.max_hp);
    const mpRatio = ratio(c.mp, c.max_mp);
    return {
      hpRatio,
      mpRatio,
      hpLow: hpRatio < this.config.recoverHpRatio,
      hpUnsafe: hpRatio < this.config.engageMinHpRatio,
      mpLow: mpRatio < this.config.recoverMpRatio,
      hasHpPotion: hasPotion(this._inventory(snapshot), 'hpot'),
      hasMpPotion: hasPotion(this._inventory(snapshot), 'mpot')
    };
  }

  _maybePotion(context, recovery) {
    const now = this.now();
    if (now - this.lastPotionAt < this.config.potionCooldownMs) return false;
    const c = context.snapshot.character;
    if (recovery.hasHpPotion && recovery.hpRatio < this.config.useHpRatio) {
      const result = context.adapter.command('use_hp');
      if (result.executed) {
        this.lastPotionAt = now;
        this._event('FARMER_POTION_USED', 'info', 'HP_LOW', { kind: 'hp', hp: c.hp, maxHp: c.max_hp });
        return true;
      }
    }
    if (recovery.hasMpPotion && recovery.mpRatio < this.config.useMpRatio) {
      const result = context.adapter.command('use_mp');
      if (result.executed) {
        this.lastPotionAt = now;
        this._event('FARMER_POTION_USED', 'info', 'MP_LOW', { kind: 'mp', mp: c.mp, maxMp: c.max_mp });
        return true;
      }
    }
    return false;
  }

  _block(reason) {
    this.blockedUntil = this.now() + this.config.blockedRetryMs;
    this._transition(FarmerState.BLOCKED, reason);
  }

  _shadowStep(context) {
    const now = this.now();
    if (now - this.lastShadowPlanAt < this.config.shadowPlanIntervalMs) return { state: TaskState.RUNNING };
    this.lastShadowPlanAt = now;
    this.shadowPlanRevision += 1;
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return { state: TaskState.WAITING };
    const recovery = this._needsRecovery(snapshot);
    const selection = this._selectTarget(context);
    this.lastSelection = selection && selection.ranking || null;
    this.targetId = selection && selection.target.id || null;
    this.targetType = selection && selection.target.mtype || null;
    this.state = recovery.hpLow ? FarmerState.RECOVER : (selection ? FarmerState.SELECT_TARGET : FarmerState.REASSESS);
    this.stateSince = now;
    this.stateReason = recovery.hpLow ? 'SHADOW_RECOVERY_PREVIEW' : (selection ? 'SHADOW_TARGET_PREVIEW' : 'SHADOW_NO_TARGET');
    this._event('FARMER_SHADOW_PLAN', 'info', this.stateReason, {
      hpRatio: Number(recovery.hpRatio.toFixed(3)),
      mpRatio: Number(recovery.mpRatio.toFixed(3)),
      selected: selection ? selection.target.mtype : null,
      score: selection && selection.ranking ? Number(selection.ranking.score.toFixed(5)) : null,
      revision: this.shadowPlanRevision
    });
    return { state: TaskState.RUNNING };
  }

  _travel(context, target) {
    const snapshot = context.snapshot;
    const c = snapshot.character;
    if (!target || target.dead || (target.hp != null && target.hp <= 0)) {
      this._clearTarget('TARGET_GONE');
      this._transition(FarmerState.REASSESS, 'TARGET_GONE');
      return;
    }
    if (!this._targetAllowed(target, snapshot, context.party)) {
      this._clearTarget('TARGET_POLICY_REJECTED');
      this._transition(FarmerState.REASSESS, 'TARGET_POLICY_REJECTED');
      return;
    }
    const engageRange = this._engagementRange(snapshot);
    const d = distance(c, target);
    if (d <= engageRange) {
      this._transition(FarmerState.ENGAGE, 'IN_RANGE', { distance: Math.round(d), engageRange: Math.round(engageRange) });
      return;
    }
    if (!Number.isFinite(d) || target.x == null || target.y == null || c.x == null || c.y == null) {
      this._block('TARGET_POSITION_UNKNOWN');
      return;
    }
    const now = this.now();
    if (now - this.lastActionAt < this.config.moveCooldownMs) return;
    const dx = Number(target.x) - Number(c.x);
    const dy = Number(target.y) - Number(c.y);
    const len = Math.max(1, Math.hypot(dx, dy));
    const desired = Math.max(20, engageRange * 0.9);
    const travel = Math.max(0, len - desired);
    const x = Number(c.x) + (dx / len) * travel;
    const y = Number(c.y) + (dy / len) * travel;
    const result = context.adapter.command('move', [x, y]);
    this.lastActionAt = now;
    if (!result.executed && !result.shadow) {
      this._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'MOVE_COMMAND_UNAVAILABLE' : 'MOVE_COMMAND_FAILED');
      return;
    }
    this._event('FARMER_MOVE_REQUESTED', 'info', 'TARGET_OUT_OF_RANGE', { x: Math.round(x), y: Math.round(y), distance: Math.round(d), engageRange: Math.round(engageRange) });
  }

  _engage(context, target) {
    const snapshot = context.snapshot;
    const recovery = this._needsRecovery(snapshot);
    this._maybePotion(context, recovery);
    if (snapshot.character.rip) {
      this._block('CHARACTER_DEAD');
      return;
    }
    if (recovery.hpUnsafe && !recovery.hasHpPotion) {
      this._block('LOW_HP_NO_POTION');
      return;
    }
    if (!target || target.dead || (target.hp != null && target.hp <= 0)) {
      this._clearTarget('TARGET_DEAD_OR_GONE');
      this._transition(FarmerState.REASSESS, 'TARGET_DEAD_OR_GONE');
      return;
    }
    if (!this._targetAllowed(target, snapshot, context.party)) {
      this._clearTarget('TARGET_POLICY_REJECTED');
      this._transition(FarmerState.REASSESS, 'TARGET_POLICY_REJECTED');
      return;
    }
    const d = distance(snapshot.character, target);
    const engageRange = this._engagementRange(snapshot);
    if (d > engageRange * 1.15) {
      this._transition(FarmerState.TRAVEL, 'TARGET_MOVED_OUT_OF_RANGE', { distance: Math.round(d), engageRange: Math.round(engageRange) });
      return;
    }
    const now = this.now();
    if (now - this.lastActionAt < this._attackIntervalMs(snapshot)) return;
    if (context.adapter.canAttack && !context.adapter.canAttack(target.id)) return;
    const result = context.adapter.command('attack', [target.id]);
    this.lastActionAt = now;
    if (!result.executed && !result.shadow) {
      this._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'ATTACK_COMMAND_UNAVAILABLE' : 'ATTACK_COMMAND_FAILED');
      return;
    }
    this._event('FARMER_ATTACK_REQUESTED', 'info', 'TARGET_IN_RANGE', { targetHp: target.hp, distance: Math.round(d) });
  }

  _activeStep(context) {
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return { state: TaskState.WAITING };
    const c = snapshot.character;
    const recovery = this._needsRecovery(snapshot);
    const target = this._findTarget(snapshot);

    if (c.rip && this.state !== FarmerState.BLOCKED) this._block('CHARACTER_DEAD');

    switch (this.state) {
      case FarmerState.ASSESS:
        if (recovery.hpUnsafe && !recovery.hasHpPotion) this._block('LOW_HP_NO_POTION');
        else if (recovery.hpLow || (recovery.mpLow && recovery.hasMpPotion)) this._transition(FarmerState.RECOVER, recovery.hpLow ? 'HP_BELOW_RECOVERY_THRESHOLD' : 'MP_BELOW_RECOVERY_THRESHOLD');
        else this._transition(FarmerState.SELECT_TARGET, 'READY_TO_SELECT');
        break;

      case FarmerState.SELECT_TARGET: {
        const selection = this._selectTarget(context);
        this.lastSelection = selection && selection.ranking || null;
        if (!selection) {
          this._clearTarget('NO_SAFE_LIVE_TARGET');
          this._transition(FarmerState.REASSESS, 'NO_SAFE_LIVE_TARGET');
          break;
        }
        this.targetId = String(selection.target.id);
        this.targetType = selection.target.mtype;
        this._event('FARMER_TARGET_SELECTED', 'info', 'PLANNER_TOP_SAFE_LIVE_TARGET', {
          score: Number(selection.ranking.score.toFixed(5)),
          source: selection.ranking.source,
          travelSeconds: Number(selection.ranking.travelSeconds.toFixed(2))
        });
        const d = distance(c, selection.target);
        this._transition(d <= this._engagementRange(snapshot) ? FarmerState.ENGAGE : FarmerState.TRAVEL, d <= this._engagementRange(snapshot) ? 'TARGET_IN_RANGE' : 'TARGET_OUT_OF_RANGE');
        break;
      }

      case FarmerState.TRAVEL:
        if (recovery.hpUnsafe) this._transition(FarmerState.RECOVER, 'HP_UNSAFE_DURING_TRAVEL');
        else this._travel(context, target);
        break;

      case FarmerState.ENGAGE:
        this._engage(context, target);
        break;

      case FarmerState.RECOVER:
        this._maybePotion(context, recovery);
        if (recovery.hpUnsafe && !recovery.hasHpPotion) this._block('LOW_HP_NO_POTION');
        else if (recovery.hpRatio >= this.config.recoverHpRatio && (!recovery.mpLow || !recovery.hasMpPotion)) this._transition(FarmerState.REASSESS, 'RECOVERY_COMPLETE');
        break;

      case FarmerState.REASSESS:
        this._transition(FarmerState.ASSESS, 'REASSESS');
        break;

      case FarmerState.BLOCKED:
        if (c.rip) break;
        if (this.now() >= this.blockedUntil) this._transition(FarmerState.REASSESS, 'BLOCK_RETRY');
        break;

      default:
        this._block('UNKNOWN_STATE');
        break;
    }
    return { state: TaskState.RUNNING };
  }

  step(context) {
    if (!this.enabled) return { state: TaskState.SUCCEEDED, reason: 'FARMER_DISABLED' };
    this.owner = context && context.snapshot && context.snapshot.character && context.snapshot.character.name || this.owner || 'local';
    if (!context || !context.adapter) return { state: TaskState.WAITING };
    if (context.adapter.mode !== 'active') return this._shadowStep(context);
    return this._activeStep(context);
  }

  progress(context) {
    const snapshot = context && context.snapshot;
    const c = snapshot && snapshot.character || {};
    const target = this._findTarget(snapshot);
    const x = Number.isFinite(Number(c.x)) ? Math.round(Number(c.x) / 10) : 'x';
    const y = Number.isFinite(Number(c.y)) ? Math.round(Number(c.y) / 10) : 'y';
    const hp = target && Number.isFinite(Number(target.hp)) ? Math.round(Number(target.hp)) : 'na';
    const selfHp = Number.isFinite(Number(c.hp)) ? Math.round(Number(c.hp)) : 'na';
    return `${this.state}|${this.targetId || '-'}|${x}:${y}|thp:${hp}|hp:${selfHp}|shadow:${this.shadowPlanRevision}`;
  }

  createTask(owner) {
    this.owner = owner || this.owner || 'local';
    const task = createTask({
      key: `farmer:${this.owner}`,
      type: 'FARMER_FSM',
      owner: this.owner,
      priority: 20,
      interruptible: true,
      maxRetries: 2,
      stallMs: 20000,
      timeoutMs: Infinity,
      progress: (context) => this.progress(context),
      step: (context) => this.step(context)
    });
    this.taskId = task.id;
    return task;
  }

  ensureScheduled(scheduler, owner) {
    if (!this.enabled || !scheduler || !owner) return null;
    const key = `farmer:${owner}`;
    const active = [...scheduler.activeByOwner.values()].find((task) => task.key === key);
    const queued = scheduler.queue.find((task) => task.key === key);
    if (active || queued) {
      const existing = active || queued;
      this.taskId = existing.id;
      return existing;
    }
    const task = this.createTask(owner);
    scheduler.submit(task);
    this._event('FARMER_TASK_ENSURED', 'info', 'SCHEDULER_OWNER_READY', { taskId: task.id });
    return task;
  }

  status() {
    return {
      enabled: this.enabled,
      state: this.state,
      reason: this.stateReason,
      stateSince: this.stateSince,
      owner: this.owner,
      taskId: this.taskId,
      targetId: this.targetId,
      targetType: this.targetType,
      targetPolicy: this.targetPolicy,
      shadowPlanRevision: this.shadowPlanRevision,
      lastSelection: this.lastSelection ? {
        id: this.lastSelection.id,
        score: this.lastSelection.score,
        source: this.lastSelection.source,
        confidence: this.lastSelection.confidence,
        travelSeconds: this.lastSelection.travelSeconds
      } : null
    };
  }
}

module.exports = { FarmerController, FarmerState, TargetPolicy, normalizeTargetPolicy, ratio, distance, hasPotion };

},
"src/farmer/basic-kiting.js": function(require,module,exports){
'use strict';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

class BasicKitingPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.minRange = Math.max(40, Number(options.minRange) || 80);
    this.tooCloseFactor = clamp(options.tooCloseFactor == null ? 0.45 : options.tooCloseFactor, 0.2, 0.75);
    this.desiredFactor = clamp(options.desiredFactor == null ? 0.72 : options.desiredFactor, this.tooCloseFactor + 0.05, 0.9);
    this.maxStepFactor = clamp(options.maxStepFactor == null ? 0.4 : options.maxStepFactor, 0.15, 0.6);
    this.speedStepSeconds = clamp(options.speedStepSeconds == null ? 1.25 : options.speedStepSeconds, 0.5, 2);
  }

  evaluate(character, target) {
    if (!this.enabled) return { shouldMove: false, reason: 'KITING_DISABLED' };
    if (!character || !target) return { shouldMove: false, reason: 'KITING_NOT_APPLICABLE' };

    const range = finite(character.range);
    if (range == null || range < this.minRange) {
      return { shouldMove: false, reason: 'RANGE_CAPABILITY_TOO_LOW', range };
    }

    if (target.target && target.target !== character.name) {
      return { shouldMove: false, reason: 'TARGET_FOCUSED_ELSEWHERE', range, targetOwner: target.target };
    }

    const cx = finite(character.x);
    const cy = finite(character.y);
    const tx = finite(target.x);
    const ty = finite(target.y);
    if (cx == null || cy == null || tx == null || ty == null) {
      return { shouldMove: false, reason: 'POSITION_UNKNOWN', range };
    }

    const dx = cx - tx;
    const dy = cy - ty;
    const distance = Math.hypot(dx, dy);
    const tooCloseDistance = range * this.tooCloseFactor;
    const desiredDistance = range * this.desiredFactor;

    if (distance >= tooCloseDistance) {
      return {
        shouldMove: false,
        reason: 'DISTANCE_OK',
        distance: Number(distance.toFixed(2)),
        range,
        tooCloseDistance: Number(tooCloseDistance.toFixed(2)),
        desiredDistance: Number(desiredDistance.toFixed(2))
      };
    }

    if (distance < 0.001) {
      return { shouldMove: false, reason: 'POSITION_OVERLAP', distance: 0, range };
    }

    const speed = Math.max(1, finite(character.speed) || 40);
    const maxStep = Math.max(20, Math.min(range * this.maxStepFactor, speed * this.speedStepSeconds));
    const step = Math.max(0, Math.min(desiredDistance - distance, maxStep));
    if (step < 1) return { shouldMove: false, reason: 'KITE_STEP_TOO_SMALL', distance, range };

    const ux = dx / distance;
    const uy = dy / distance;
    return {
      shouldMove: true,
      reason: 'TARGET_TOO_CLOSE',
      x: cx + ux * step,
      y: cy + uy * step,
      distance: Number(distance.toFixed(2)),
      range,
      tooCloseDistance: Number(tooCloseDistance.toFixed(2)),
      desiredDistance: Number(desiredDistance.toFixed(2)),
      step: Number(step.toFixed(2))
    };
  }

  status() {
    return {
      enabled: this.enabled,
      minRange: this.minRange,
      tooCloseFactor: this.tooCloseFactor,
      desiredFactor: this.desiredFactor,
      maxStepFactor: this.maxStepFactor,
      speedStepSeconds: this.speedStepSeconds
    };
  }
}

module.exports = { BasicKitingPolicy };

},
"src/farmer/skill-usage.js": function(require,module,exports){
'use strict';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finite(value, 0)));
}

function isDirectDamageSkill(skill, character) {
  if (!skill || skill.type !== 'skill' || skill.hostile !== true) return false;
  if (!(skill.target === true || skill.target === 'monster')) return false;
  if (skill.consume || skill.slot || skill.persistent) return false;
  if (!(finite(skill.damage_multiplier, 0) > 1)) return false;

  const classes = Array.isArray(skill.class) ? skill.class : null;
  if (classes && character && character.ctype && !classes.includes(character.ctype)) return false;

  const requiredLevel = finite(skill.level, 0);
  if (character && requiredLevel > finite(character.level, 0)) return false;
  return true;
}

class SkillUsagePolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.mpReserveRatio = clamp01(options.mpReserveRatio == null ? 0.30 : options.mpReserveRatio);
    this.minIntervalMs = Math.max(250, finite(options.minIntervalMs, 750));
    this.maxCommandAttempts = Math.max(1, Math.min(3, Math.floor(finite(options.maxCommandAttempts, 2))));
    this.failureBackoffMs = Math.max(500, Math.min(10000, finite(options.failureBackoffMs, 2000)));
    this.failureBackoffMultiplier = Math.max(1, Math.min(4, finite(options.failureBackoffMultiplier, 2)));
    this.failureBackoffMaxMs = Math.max(
      this.failureBackoffMs,
      Math.min(60000, finite(options.failureBackoffMaxMs, 8000))
    );
    this.failureStreakResetMs = Math.max(5000, Math.min(300000, finite(options.failureStreakResetMs, 30000)));
    this.retryableCommandReasons = new Set(['COMMAND_FAILED']);
  }

  candidates(character, gameData = {}) {
    if (!this.enabled || !character) return [];
    const skills = gameData.skills || {};
    return Object.entries(skills)
      .filter(([, skill]) => isDirectDamageSkill(skill, character))
      .map(([id, skill]) => ({
        id,
        name: skill.name || id,
        mp: Math.max(0, finite(skill.mp, 0)),
        level: Math.max(0, finite(skill.level, 0)),
        cooldown: Math.max(0, finite(skill.cooldown, 0)),
        damageMultiplier: finite(skill.damage_multiplier, 0),
        range: Number.isFinite(Number(skill.range)) ? Number(skill.range) : null,
        rangeMultiplier: Number.isFinite(Number(skill.range_multiplier)) ? Number(skill.range_multiplier) : null,
        weaponTypes: Array.isArray(skill.wtype) ? skill.wtype.slice() : []
      }))
      .sort((a, b) => {
        if (b.damageMultiplier !== a.damageMultiplier) return b.damageMultiplier - a.damageMultiplier;
        if (b.cooldown !== a.cooldown) return b.cooldown - a.cooldown;
        return a.id.localeCompare(b.id);
      });
  }

  select(character, gameData = {}) {
    return this.candidates(character, gameData)[0] || null;
  }

  canRetryCommandFailure(result) {
    if (!result || result.executed || result.shadow) return false;
    return this.retryableCommandReasons.has(String(result.reason || ''));
  }

  failureBackoffForStreak(streak) {
    const boundedStreak = Math.max(1, Math.floor(finite(streak, 1)));
    const scaled = this.failureBackoffMs * Math.pow(this.failureBackoffMultiplier, boundedStreak - 1);
    return Math.min(this.failureBackoffMaxMs, Math.max(this.failureBackoffMs, Math.round(scaled)));
  }

  evaluate(snapshot, target, gameData, adapter, options = {}) {
    const character = snapshot && snapshot.character;
    if (!this.enabled) return { useSkill: false, reason: 'SKILL_USAGE_DISABLED', skill: null, candidateCount: 0, candidateRank: null, rejectedCandidates: [] };
    if (!character || !target) return { useSkill: false, reason: 'SKILL_CONTEXT_MISSING', skill: null, candidateCount: 0, candidateRank: null, rejectedCandidates: [] };

    const candidates = this.candidates(character, gameData || {});
    if (!candidates.length) return { useSkill: false, reason: 'NO_SAFE_DIRECT_DAMAGE_SKILL', skill: null, candidateCount: 0, candidateRank: null, rejectedCandidates: [] };

    const skippedSkillIds = new Set(
      Array.isArray(options.skipSkillIds) ? options.skipSkillIds.map((id) => String(id)) : []
    );
    const backoffSkillIds = new Set(
      Array.isArray(options.backoffSkillIds) ? options.backoffSkillIds.map((id) => String(id)) : []
    );
    const mp = Math.max(0, finite(character.mp, 0));
    const maxMp = Math.max(0, finite(character.max_mp, mp));
    const reserveMp = maxMp * this.mpReserveRatio;
    const rejectedCandidates = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const skill = candidates[index];
      const mpAfter = mp - skill.mp;
      let rejectionReason = null;

      if (skippedSkillIds.has(String(skill.id))) {
        rejectionReason = 'PREVIOUS_COMMAND_FAILED';
      } else if (backoffSkillIds.has(String(skill.id))) {
        rejectionReason = 'SKILL_COMMAND_BACKOFF';
      } else if (mpAfter < reserveMp) {
        rejectionReason = 'MP_RESERVE';
      } else if (adapter && typeof adapter.canUseSkill === 'function' && !adapter.canUseSkill(skill.id)) {
        rejectionReason = 'SKILL_COOLDOWN_OR_REQUIREMENT';
      } else if (adapter && typeof adapter.isSkillInRange === 'function' && !adapter.isSkillInRange(target.id, skill.id)) {
        rejectionReason = 'SKILL_OUT_OF_RANGE';
      }

      if (rejectionReason) {
        rejectedCandidates.push({
          skill: skill.id,
          rank: index + 1,
          reason: rejectionReason,
          mpAfter
        });
        continue;
      }

      return {
        useSkill: true,
        reason: index === 0 ? 'SAFE_DIRECT_DAMAGE_SKILL' : 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL',
        skill,
        mp,
        reserveMp,
        mpAfter,
        candidateCount: candidates.length,
        candidateRank: index + 1,
        rejectedCandidates
      };
    }

    const primary = candidates[0];
    const primaryRejection = rejectedCandidates[0] || { reason: 'NO_USABLE_SAFE_DIRECT_DAMAGE_SKILL' };
    return {
      useSkill: false,
      reason: primaryRejection.reason,
      skill: primary,
      mp,
      reserveMp,
      mpAfter: mp - primary.mp,
      candidateCount: candidates.length,
      candidateRank: null,
      rejectedCandidates
    };
  }

  status() {
    return {
      enabled: this.enabled,
      mpReserveRatio: this.mpReserveRatio,
      minIntervalMs: this.minIntervalMs,
      fallbackEnabled: true,
      executionFallbackEnabled: true,
      maxCommandAttempts: this.maxCommandAttempts,
      retryableCommandReasons: [...this.retryableCommandReasons],
      failureBackoffEnabled: true,
      failureBackoffMs: this.failureBackoffMs,
      failureIntelligenceEnabled: true,
      failureBackoffMultiplier: this.failureBackoffMultiplier,
      failureBackoffMaxMs: this.failureBackoffMaxMs,
      failureStreakResetMs: this.failureStreakResetMs,
      backoffReason: 'SKILL_COMMAND_BACKOFF',
      selection: 'ranked single-target hostile damage_multiplier>1 with live safe fallback'
    };
  }
}

module.exports = { SkillUsagePolicy, isDirectDamageSkill };

},
"src/farmer/target-reassessment.js": function(require,module,exports){
'use strict';

function distance(a, b) {
  if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) return Infinity;
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

function liveMonster(entity, character) {
  if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
  if (entity.map && character && character.map && entity.map !== character.map) return false;
  return true;
}

function threatScore(entity, gameData) {
  if (!entity || !entity.mtype || !gameData || !gameData.monsters) return null;
  const data = gameData.monsters[entity.mtype];
  if (!data) return null;
  const attack = Number(data.attack);
  const frequency = Number(data.frequency);
  if (!Number.isFinite(attack) || attack <= 0 || !Number.isFinite(frequency) || frequency <= 0) return null;
  return attack * frequency;
}

class TargetReassessmentPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.minIntervalMs = Math.max(250, Number(options.minIntervalMs) || 750);
    this.switchCooldownMs = Math.max(1000, Number(options.switchCooldownMs) || 2500);
    this.selfAggroSwitchFactor = Math.max(0.25, Math.min(0.9, Number(options.selfAggroSwitchFactor) || 0.7));
    this.selfAggroThreatSwitchFactor = Math.max(1, Math.min(3, Number(options.selfAggroThreatSwitchFactor) || 1.25));
  }

  _selfAttackers(snapshot, character, selfName) {
    return (snapshot.entities || [])
      .filter((entity) => liveMonster(entity, character) && entity.target === selfName)
      .sort((a, b) => {
        const delta = distance(character, a) - distance(character, b);
        if (delta !== 0) return delta;
        return String(a.id).localeCompare(String(b.id));
      });
  }

  _highestThreatAlternative(alternatives, character, gameData) {
    return alternatives
      .map((entity) => ({
        entity,
        score: threatScore(entity, gameData),
        distance: distance(character, entity)
      }))
      .filter((row) => row.score != null)
      .sort((a, b) => {
        const threatDelta = b.score - a.score;
        if (threatDelta !== 0) return threatDelta;
        const distanceDelta = a.distance - b.distance;
        if (distanceDelta !== 0) return distanceDelta;
        return String(a.entity.id).localeCompare(String(b.entity.id));
      })[0] || null;
  }

  evaluate(snapshot, currentTarget, gameData = {}) {
    if (!this.enabled) return { switchTarget: false, reason: 'REASSESSMENT_DISABLED' };
    if (!snapshot || !snapshot.character || !currentTarget) return { switchTarget: false, reason: 'REASSESSMENT_CONTEXT_MISSING' };

    const character = snapshot.character;
    const selfName = character.name;
    if (!selfName) return { switchTarget: false, reason: 'CHARACTER_NAME_MISSING' };
    if (!liveMonster(currentTarget, character)) return { switchTarget: false, reason: 'CURRENT_TARGET_NOT_LIVE' };

    const attackers = this._selfAttackers(snapshot, character, selfName);

    if (currentTarget.target === selfName) {
      const currentDistance = distance(character, currentTarget);
      const currentThreatScore = threatScore(currentTarget, gameData);
      const alternatives = attackers.filter((entity) => String(entity.id) !== String(currentTarget.id));

      if (!alternatives.length) {
        return {
          switchTarget: false,
          reason: 'CURRENT_TARGET_ONLY_SELF_AGGRO',
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          currentThreatScore
        };
      }

      const highestThreat = this._highestThreatAlternative(alternatives, character, gameData);
      if (currentThreatScore != null && highestThreat && highestThreat.score >= currentThreatScore * this.selfAggroThreatSwitchFactor) {
        return {
          switchTarget: true,
          reason: 'HIGHER_SELF_AGGRO_THREAT',
          target: highestThreat.entity,
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          targetDistance: highestThreat.distance,
          switchThresholdDistance: Number.isFinite(currentDistance) ? currentDistance * this.selfAggroSwitchFactor : null,
          currentThreatScore,
          targetThreatScore: highestThreat.score,
          threatSwitchThreshold: currentThreatScore * this.selfAggroThreatSwitchFactor
        };
      }

      const target = alternatives[0];
      const targetDistance = distance(character, target);
      const targetThreatScore = threatScore(target, gameData);
      const switchThresholdDistance = Number.isFinite(currentDistance)
        ? currentDistance * this.selfAggroSwitchFactor
        : null;

      if (!Number.isFinite(currentDistance) || !Number.isFinite(targetDistance)) {
        return {
          switchTarget: false,
          reason: 'SELF_AGGRO_DISTANCE_UNKNOWN',
          target,
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          targetDistance,
          switchThresholdDistance,
          currentThreatScore,
          targetThreatScore
        };
      }

      if (targetDistance > switchThresholdDistance) {
        return {
          switchTarget: false,
          reason: 'CURRENT_SELF_AGGRO_STABLE',
          target,
          attackerCount: attackers.length,
          currentTargetOwner: currentTarget.target || null,
          currentDistance,
          targetDistance,
          switchThresholdDistance,
          currentThreatScore,
          targetThreatScore
        };
      }

      return {
        switchTarget: true,
        reason: 'CLOSER_SELF_AGGRO_PRIORITY',
        target,
        attackerCount: attackers.length,
        currentTargetOwner: currentTarget.target || null,
        currentDistance,
        targetDistance,
        switchThresholdDistance,
        currentThreatScore,
        targetThreatScore
      };
    }

    const alternatives = attackers.filter((entity) => String(entity.id) !== String(currentTarget.id));
    if (!alternatives.length) {
      return {
        switchTarget: false,
        reason: 'NO_SELF_AGGRO_ALTERNATIVE',
        attackerCount: 0,
        currentTargetOwner: currentTarget.target || null,
        currentDistance: distance(character, currentTarget),
        currentThreatScore: threatScore(currentTarget, gameData)
      };
    }

    const target = alternatives[0];
    return {
      switchTarget: true,
      reason: 'SELF_AGGRO_PRIORITY',
      target,
      attackerCount: alternatives.length,
      currentTargetOwner: currentTarget.target || null,
      currentDistance: distance(character, currentTarget),
      targetDistance: distance(character, target),
      switchThresholdDistance: null,
      currentThreatScore: threatScore(currentTarget, gameData),
      targetThreatScore: threatScore(target, gameData)
    };
  }

  status() {
    return {
      enabled: this.enabled,
      minIntervalMs: this.minIntervalMs,
      switchCooldownMs: this.switchCooldownMs,
      selfAggroSwitchFactor: this.selfAggroSwitchFactor,
      selfAggroThreatSwitchFactor: this.selfAggroThreatSwitchFactor,
      threatMetric: 'G.monsters[mtype].attack * frequency',
      strategy: 'self-aggro threat override when candidate >= threat factor; otherwise alpha.8.6 distance hysteresis'
    };
  }
}

module.exports = { TargetReassessmentPolicy, threatScore };

},
"src/farmer/safe-retreat.js": function(require,module,exports){
'use strict';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

class SafeRetreatPolicy {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.stepSeconds = Math.max(0.5, Math.min(3, finite(options.stepSeconds, 1.5)));
    this.minStep = Math.max(15, Math.min(80, finite(options.minStep, 35)));
    this.maxStep = Math.max(this.minStep, Math.min(160, finite(options.maxStep, 90)));
    this.maxThreats = Math.max(1, Math.min(10, Math.floor(finite(options.maxThreats, 6))));
  }

  evaluate(character, threats = []) {
    if (!this.enabled) return { shouldMove: false, reason: 'SAFE_RETREAT_DISABLED' };
    if (!character || character.x == null || character.y == null) {
      return { shouldMove: false, reason: 'CHARACTER_POSITION_UNKNOWN' };
    }

    const cx = Number(character.x);
    const cy = Number(character.y);
    const positioned = (threats || [])
      .filter((threat) => threat && threat.x != null && threat.y != null)
      .slice(0, this.maxThreats)
      .map((threat) => ({
        ...threat,
        x: Number(threat.x),
        y: Number(threat.y),
        distance: Math.hypot(cx - Number(threat.x), cy - Number(threat.y))
      }))
      .filter((threat) => Number.isFinite(threat.distance));

    if (!positioned.length) return { shouldMove: false, reason: 'THREAT_POSITION_UNKNOWN' };

    let awayX = 0;
    let awayY = 0;
    for (const threat of positioned) {
      const d = Math.max(1, threat.distance);
      const weight = 1 / Math.max(20, d);
      awayX += ((cx - threat.x) / d) * weight;
      awayY += ((cy - threat.y) / d) * weight;
    }

    let vectorLength = Math.hypot(awayX, awayY);
    let fallbackThreat = null;
    if (vectorLength < 0.0001) {
      fallbackThreat = positioned.slice().sort((a, b) => a.distance - b.distance)[0];
      const d = Math.max(1, fallbackThreat.distance);
      awayX = (cx - fallbackThreat.x) / d;
      awayY = (cy - fallbackThreat.y) / d;
      vectorLength = Math.hypot(awayX, awayY);
    }

    if (vectorLength < 0.0001) return { shouldMove: false, reason: 'RETREAT_DIRECTION_UNAVAILABLE' };

    const speed = Math.max(1, finite(character.speed, 40));
    const step = Math.max(this.minStep, Math.min(this.maxStep, speed * this.stepSeconds));
    const ux = awayX / vectorLength;
    const uy = awayY / vectorLength;
    const nearest = positioned.slice().sort((a, b) => a.distance - b.distance)[0];

    return {
      shouldMove: true,
      reason: 'EMERGENCY_THREAT_RETREAT',
      x: cx + ux * step,
      y: cy + uy * step,
      step: Number(step.toFixed(2)),
      threatCount: positioned.length,
      nearestThreatId: nearest && nearest.id || null,
      nearestThreatDistance: nearest ? Number(nearest.distance.toFixed(2)) : null,
      fallbackThreatId: fallbackThreat && fallbackThreat.id || null
    };
  }

  status() {
    return {
      enabled: this.enabled,
      stepSeconds: this.stepSeconds,
      minStep: this.minStep,
      maxStep: this.maxStep,
      maxThreats: this.maxThreats
    };
  }
}

module.exports = { SafeRetreatPolicy };

},
"src/farmer/target-safety.js": function(require,module,exports){
'use strict';

const BUILT_IN_TARGET_EXCLUSIONS = Object.freeze([
  Object.freeze({ token: 'automatron', reason: 'TRAINING_TARGET_AUTOMATRON' })
]);

function normalizeTargetToken(value) {
  return String(value || '').trim().toLowerCase();
}

class TargetSafety {
  constructor(options = {}) {
    this.custom = new Set();
    for (const value of options.exclusions || []) this.add(value);
  }

  list() {
    return [...new Set([
      ...BUILT_IN_TARGET_EXCLUSIONS.map((rule) => rule.token),
      ...this.custom
    ])].sort();
  }

  add(value) {
    const token = normalizeTargetToken(value);
    if (!token) throw new Error('target exclusion must be a non-empty string');
    this.custom.add(token);
    return token;
  }

  remove(value) {
    const token = normalizeTargetToken(value);
    if (!token) return false;
    if (BUILT_IN_TARGET_EXCLUSIONS.some((rule) => rule.token === token)) return false;
    return this.custom.delete(token);
  }

  evaluate(entity, gameData = {}) {
    if (!entity) return { allowed: false, reason: 'MISSING_ENTITY', token: null, source: null };
    const monster = entity.mtype && gameData.monsters && gameData.monsters[entity.mtype] || null;
    const identities = [
      ['entity.name', entity.name],
      ['entity.mtype', entity.mtype],
      ['monster.name', monster && monster.name],
      ['monster.skin', monster && monster.skin]
    ];

    const rules = [
      ...BUILT_IN_TARGET_EXCLUSIONS,
      ...[...this.custom].map((token) => ({ token, reason: 'CUSTOM_TARGET_EXCLUSION' }))
    ];

    for (const rule of rules) {
      for (const [source, raw] of identities) {
        const identity = normalizeTargetToken(raw);
        if (identity && identity.includes(rule.token)) {
          return { allowed: false, reason: rule.reason, token: rule.token, source };
        }
      }
    }
    return { allowed: true, reason: 'ALLOWED', token: null, source: null };
  }
}

module.exports = { TargetSafety, BUILT_IN_TARGET_EXCLUSIONS, normalizeTargetToken };

},
"src/farmer/combat-risk.js": function(require,module,exports){
'use strict';

const { ContentSafetyGate } = require('./content-safety');

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function hpRatio(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return 1;
  const maxHp = Number(c.max_hp) || 0;
  if (maxHp <= 0) return 1;
  return clamp01((Number(c.hp) || 0) / maxHp);
}

class CombatRiskGate {
  constructor(options = {}) {
    this.threshold = Math.max(0.1, Math.min(1, Number(options.threshold) || 0.65));
    this.recoveryHpRatio = Math.max(0.1, Math.min(1, Number(options.recoveryHpRatio) || 0.75));
    this.lowHpWeight = Math.max(0, Math.min(1, Number(options.lowHpWeight) || 0.45));
    this.additionalAggroWeight = Math.max(0, Math.min(1, Number(options.additionalAggroWeight) || 0.70));
    this.deathRiskWeight = Math.max(0, Math.min(1, Number(options.deathRiskWeight) || 0.65));
    this.deathRateReference = Math.max(0.1, Number(options.deathRateReference) || 2);
    this.minLearnedConfidence = Math.max(0, Math.min(1, Number(options.minLearnedConfidence) || 0.25));
    this.contentSafety = options.contentSafety || new ContentSafetyGate({ log: options.log, now: options.now });
    this.lastWorld = null;
  }

  approveMonsterType(world, mtype) {
    return this.contentSafety.approve(world || this.lastWorld, mtype);
  }

  quarantineMonsterType(world, mtype) {
    return this.contentSafety.quarantine(world || this.lastWorld, mtype);
  }

  _additionalAggro(snapshot, entity) {
    const c = snapshot && snapshot.character;
    if (!c || !c.name) return 0;
    const targetId = entity && entity.id != null ? String(entity.id) : null;
    return (snapshot.entities || []).filter((other) => {
      if (!other || !other.mtype || other.dead || (other.hp != null && Number(other.hp) <= 0)) return false;
      if (targetId != null && String(other.id) === targetId) return false;
      return other.target === c.name;
    }).length;
  }

  evaluate(entity, snapshot, world, party) {
    if (!entity || !entity.mtype || !snapshot || !snapshot.character) {
      return { allowed: true, score: 0, reason: 'RISK_NOT_APPLICABLE', signals: {} };
    }

    if (world) this.lastWorld = world;
    const content = this.contentSafety.evaluate(entity, world || this.lastWorld);
    if (!content.allowed) {
      return {
        allowed: false,
        score: 1,
        threshold: this.threshold,
        reason: content.reason,
        signals: {
          contentDisposition: content.disposition || null,
          contentReason: content.cause || content.reason,
          monsterType: content.monsterType || entity.mtype
        }
      };
    }

    // Existing combat is not abandoned by the ordinary risk score, but unknown
    // content was already filtered above so ALREADY_ENGAGED cannot bypass quarantine.
    if (entity.target) {
      return {
        allowed: true,
        score: 0,
        reason: 'ALREADY_ENGAGED',
        signals: { claimedBy: entity.target, contentDisposition: content.disposition || null }
      };
    }

    const signals = { contentDisposition: content.disposition || null };
    let score = 0;
    let primaryReason = 'RISK_ACCEPTABLE';

    const currentHpRatio = hpRatio(snapshot);
    signals.hpRatio = Number(currentHpRatio.toFixed(3));
    if (currentHpRatio < this.recoveryHpRatio) {
      const deficit = clamp01((this.recoveryHpRatio - currentHpRatio) / this.recoveryHpRatio);
      const contribution = deficit * this.lowHpWeight;
      score += contribution;
      signals.lowHpContribution = Number(contribution.toFixed(3));
      if (contribution > 0) primaryReason = 'LOW_HP';
    }

    const additionalAggro = this._additionalAggro(snapshot, entity);
    signals.additionalAggro = additionalAggro;
    if (additionalAggro > 0) {
      const contribution = Math.min(1, additionalAggro) * this.additionalAggroWeight;
      score += contribution;
      signals.additionalAggroContribution = Number(contribution.toFixed(3));
      primaryReason = 'ADDITIONAL_AGGRO';
    }

    const fingerprint = party && party.fingerprint || null;
    let learned = null;
    if (world && typeof world.performanceFor === 'function') {
      try { learned = world.performanceFor(entity.mtype, fingerprint); } catch (_) { learned = null; }
    }
    if (learned) {
      const confidence = clamp01(learned.confidence);
      const deathsPerHour = Math.max(0, Number(learned.deathsPerHour) || 0);
      signals.learnedConfidence = Number(confidence.toFixed(3));
      signals.deathsPerHour = Number(deathsPerHour.toFixed(3));
      if (confidence >= this.minLearnedConfidence && deathsPerHour > 0) {
        const scaled = clamp01(deathsPerHour / this.deathRateReference);
        const contribution = scaled * this.deathRiskWeight * confidence;
        score += contribution;
        signals.deathRiskContribution = Number(contribution.toFixed(3));
        if (contribution >= this.additionalAggroWeight * 0.5 && primaryReason === 'RISK_ACCEPTABLE') primaryReason = 'LEARNED_DEATH_RISK';
      }
    }

    score = clamp01(score);
    const allowed = score < this.threshold;
    if (!allowed && primaryReason === 'RISK_ACCEPTABLE') primaryReason = 'RISK_THRESHOLD_EXCEEDED';
    return {
      allowed,
      score: Number(score.toFixed(3)),
      threshold: this.threshold,
      reason: allowed ? 'RISK_ACCEPTABLE' : primaryReason,
      signals
    };
  }

  status() {
    return {
      threshold: this.threshold,
      recoveryHpRatio: this.recoveryHpRatio,
      minLearnedConfidence: this.minLearnedConfidence,
      deathRateReference: this.deathRateReference,
      contentSafety: this.contentSafety.status(this.lastWorld)
    };
  }
}

module.exports = { CombatRiskGate };

},
"src/farmer/content-safety.js": function(require,module,exports){
'use strict';

const { EvidenceKind } = require('../world/world-model');

const ContentDisposition = Object.freeze({
  LEGACY_ALLOWED: 'LEGACY_ALLOWED',
  APPROVED: 'APPROVED',
  QUARANTINED: 'QUARANTINED'
});

function normalizeMonsterType(value) {
  const id = String(value || '').trim();
  if (!id) throw new Error('monster type must be a non-empty string');
  return id;
}

class ContentSafetyGate {
  constructor(options = {}) {
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.policyType = 'monster-policy';
    this.dispositionFact = 'contentSafetyDisposition';
    this.maxStatusEntries = Math.max(10, Math.min(500, Number(options.maxStatusEntries) || 100));
    this.lastDecision = null;
  }

  _fact(world, mtype, name) {
    if (!world || typeof world.fact !== 'function') return null;
    const fact = world.fact(this.policyType, mtype, name);
    return fact && fact.value != null ? fact.value : null;
  }

  _write(world, mtype, disposition, reason, event) {
    if (!world || typeof world.observeEntity !== 'function') return null;
    const id = normalizeMonsterType(mtype);
    const at = this.now();
    world.observeEntity(this.policyType, id, {
      [this.dispositionFact]: disposition,
      contentSafetyReason: reason,
      contentSafetyUpdatedAt: at
    }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
    const record = { at, monsterType: id, disposition, reason };
    this.lastDecision = record;
    if (this.log && event) {
      this.log.emit({
        component: 'content-safety',
        event,
        severity: disposition === ContentDisposition.QUARANTINED ? 'warn' : 'info',
        reason,
        data: record
      });
    }
    return record;
  }

  approve(world, mtype) {
    return this._write(world, mtype, ContentDisposition.APPROVED, 'OPERATOR_APPROVED', 'CONTENT_MONSTER_APPROVED');
  }

  quarantine(world, mtype) {
    return this._write(world, mtype, ContentDisposition.QUARANTINED, 'OPERATOR_QUARANTINED', 'CONTENT_MONSTER_QUARANTINED');
  }

  evaluate(entity, world) {
    if (!entity || !entity.mtype) {
      return { allowed: true, reason: 'CONTENT_SAFETY_NOT_APPLICABLE', disposition: null, monsterType: null };
    }
    const mtype = String(entity.mtype);
    if (!world || typeof world.hasEntity !== 'function' || typeof world.fact !== 'function' || typeof world.observeEntity !== 'function') {
      const result = { allowed: false, reason: 'CONTENT_SAFETY_UNAVAILABLE', disposition: null, monsterType: mtype };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }

    const disposition = this._fact(world, mtype, this.dispositionFact);
    if (disposition === ContentDisposition.APPROVED || disposition === ContentDisposition.LEGACY_ALLOWED) {
      const result = { allowed: true, reason: disposition === ContentDisposition.APPROVED ? 'CONTENT_APPROVED' : 'CONTENT_LEGACY_ALLOWED', disposition, monsterType: mtype };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }
    if (disposition === ContentDisposition.QUARANTINED) {
      const result = { allowed: false, reason: 'CONTENT_QUARANTINED', disposition, monsterType: mtype };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }

    // Migration boundary: monster types already present in the persistent world
    // before alpha.8.12 remain eligible. Truly new types are quarantined before
    // Discovery records them as known world entities later in the same tick.
    if (world.hasEntity('monster', mtype)) {
      this._write(world, mtype, ContentDisposition.LEGACY_ALLOWED, 'PRE_ALPHA_8_12_KNOWN', 'CONTENT_MONSTER_LEGACY_ALLOWED');
      return { allowed: true, reason: 'CONTENT_LEGACY_ALLOWED', disposition: ContentDisposition.LEGACY_ALLOWED, monsterType: mtype };
    }

    this._write(world, mtype, ContentDisposition.QUARANTINED, 'NEW_MONSTER_TYPE', 'CONTENT_MONSTER_QUARANTINED');
    return { allowed: false, reason: 'CONTENT_QUARANTINED', disposition: ContentDisposition.QUARANTINED, monsterType: mtype, cause: 'NEW_MONSTER_TYPE' };
  }

  status(world) {
    const rows = [];
    if (world && world.entities instanceof Map) {
      for (const entity of world.entities.values()) {
        if (!entity || entity.type !== this.policyType) continue;
        const mtype = String(entity.id);
        const disposition = this._fact(world, mtype, this.dispositionFact);
        if (!Object.values(ContentDisposition).includes(disposition)) continue;
        rows.push({
          monsterType: mtype,
          disposition,
          reason: this._fact(world, mtype, 'contentSafetyReason'),
          updatedAt: this._fact(world, mtype, 'contentSafetyUpdatedAt')
        });
      }
    }
    rows.sort((a, b) => String(a.monsterType).localeCompare(String(b.monsterType)));
    const counts = { LEGACY_ALLOWED: 0, APPROVED: 0, QUARANTINED: 0 };
    for (const row of rows) counts[row.disposition] += 1;
    return {
      enabled: true,
      unknownDefault: ContentDisposition.QUARANTINED,
      policyType: this.policyType,
      counts,
      quarantined: rows.filter((row) => row.disposition === ContentDisposition.QUARANTINED).slice(0, this.maxStatusEntries),
      approved: rows.filter((row) => row.disposition === ContentDisposition.APPROVED).slice(0, this.maxStatusEntries),
      legacyAllowed: rows.filter((row) => row.disposition === ContentDisposition.LEGACY_ALLOWED).slice(0, this.maxStatusEntries),
      lastDecision: this.lastDecision
    };
  }
}

module.exports = { ContentSafetyGate, ContentDisposition, normalizeMonsterType };

},
"src/farmer/combat-emergency.js": function(require,module,exports){
'use strict';

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function hpRatio(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return 1;
  const maxHp = Number(c.max_hp) || 0;
  if (maxHp <= 0) return 1;
  return clamp01((Number(c.hp) || 0) / maxHp);
}

class CombatEmergencyGate {
  constructor(options = {}) {
    this.criticalHpRatio = Math.max(0.1, Math.min(0.9, Number(options.criticalHpRatio) || 0.35));
    this.multiAggroHpRatio = Math.max(this.criticalHpRatio, Math.min(0.95, Number(options.multiAggroHpRatio) || 0.55));
    this.multiAggroCount = Math.max(2, Math.floor(Number(options.multiAggroCount) || 2));
  }

  _attackers(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c || !c.name) return [];
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
      return entity.target === c.name;
    });
  }

  evaluate(snapshot, target) {
    if (!snapshot || !snapshot.character || !target || !target.mtype) {
      return { triggered: false, reason: 'EMERGENCY_NOT_APPLICABLE', signals: {} };
    }

    const currentHpRatio = hpRatio(snapshot);
    const attackers = this._attackers(snapshot);
    const signals = {
      hpRatio: Number(currentHpRatio.toFixed(3)),
      attackers: attackers.length,
      attackerIds: attackers.slice(0, 5).map((entity) => String(entity.id))
    };

    if (currentHpRatio <= this.criticalHpRatio) {
      return { triggered: true, reason: 'CRITICAL_HP', signals };
    }

    if (currentHpRatio <= this.multiAggroHpRatio && attackers.length >= this.multiAggroCount) {
      return { triggered: true, reason: 'MULTI_AGGRO_LOW_HP', signals };
    }

    return { triggered: false, reason: 'EMERGENCY_CLEAR', signals };
  }

  status() {
    return {
      criticalHpRatio: this.criticalHpRatio,
      multiAggroHpRatio: this.multiAggroHpRatio,
      multiAggroCount: this.multiAggroCount
    };
  }
}

module.exports = { CombatEmergencyGate };

},
"src/release-version.js": function(require,module,exports){
'use strict';

const RELEASE_VERSION = '3.0.0-alpha.20.0';

module.exports = { RELEASE_VERSION };

},
"src/stability/stability-runtime.js": function(require,module,exports){
'use strict';

const { Runtime } = require('../runtime');
const { VERSION } = require('../version');
const { TaskState } = require('../core/task');
const { StabilityGameAdapter } = require('../game/stability-adapter');
const { StableScheduler } = require('../core/stable-scheduler');
const { ResilientWorldPersistence } = require('../world/resilient-persistence');
const { KnowledgeAgingPolicy, installKnowledgeAging, installStaleRiskGuard } = require('../world/knowledge-aging');
const { CombatStabilitySupervisor } = require('./combat-stability-supervisor');

class StabilityRuntime extends Runtime {
  constructor(options = {}) {
    super(options);
    // Runtime alpha.8.13 remains the historical base implementation. The
    // stability runtime owns the phase-freeze version without rewriting that
    // large proven file, and all emitted events use the phase version.
    this.log.version = VERSION;

    if (!options.adapter) {
      this.adapter = new StabilityGameAdapter({
        root: this.root,
        parent: options.parent,
        log: this.log,
        mode: options.mode || 'shadow',
        now: this.now,
        commandOutcomeCapacity: options.commandOutcomeCapacity,
        commandOutcomePendingCapacity: options.commandOutcomePendingCapacity,
        commandOutcomeTimeoutMs: options.commandOutcomeTimeoutMs,
        commandOutcomeMoveMinDelta: options.commandOutcomeMoveMinDelta,
        movementMaxFailures: options.movementMaxFailures,
        movementCircuitMs: options.movementCircuitMs
      });
    }

    if (!options.scheduler) {
      this.scheduler = new StableScheduler({
        now: this.now,
        log: this.log,
        completedCapacity: options.schedulerCompletedCapacity
      });
    }

    if (!options.persistence) {
      this.persistence = new ResilientWorldPersistence({
        root: this.root,
        storage: options.storage,
        now: this.now,
        log: this.log,
        minIntervalMs: options.persistenceIntervalMs || 30000,
        maxBytes: options.persistenceMaxBytes,
        retryBaseMs: options.persistenceRetryBaseMs,
        retryMaxMs: options.persistenceRetryMaxMs,
        saveCircuitAfter: options.persistenceSaveCircuitAfter,
        saveCircuitMs: options.persistenceSaveCircuitMs
      });
      this.worldLoaded = false;
    }

    this.knowledgeAging = new KnowledgeAgingPolicy({
      now: this.now,
      freshMs: options.knowledgeFreshMs,
      staleMs: options.knowledgeStaleMs,
      minFreshness: options.knowledgeMinFreshness
    });
    installKnowledgeAging(this.world, this.knowledgeAging);
    installStaleRiskGuard(this.combatRisk, this.world, this.knowledgeAging, {
      weight: options.staleKnowledgeRiskWeight
    });

    this.stability = new CombatStabilitySupervisor({
      runtime: this,
      adapter: this.adapter,
      log: this.log,
      now: this.now,
      capacity: options.stabilityOutcomeCapacity
    });

    this._installFarmerStableWaitContract();
    this._installKitingCircuitGuard();
  }

  _installFarmerStableWaitContract() {
    const farmer = this.farmer;
    if (!farmer || farmer.__stableWaitContractInstalled) return;
    const baseStep = farmer.step.bind(farmer);
    farmer.step = (context) => {
      const result = baseStep(context) || { state: TaskState.RUNNING };
      const snapshot = context && context.snapshot;
      const character = snapshot && snapshot.character;
      if (!character) return { state: TaskState.WAITING, reason: 'SNAPSHOT_UNAVAILABLE', stableWait: true };
      if (character.rip) return { state: TaskState.WAITING, reason: 'CHARACTER_DEAD', stableWait: true };
      if (farmer.state === 'BLOCKED') {
        return { state: TaskState.WAITING, reason: farmer.stateReason || 'FARMER_BLOCKED', stableWait: true };
      }
      if (result.state === TaskState.WAITING) return { ...result, stableWait: true };
      return result;
    };
    farmer.__stableWaitContractInstalled = true;
  }

  _installKitingCircuitGuard() {
    const farmer = this.farmer;
    if (!farmer || farmer.__kitingCircuitGuardInstalled || typeof farmer._engage !== 'function') return;
    const baseEngage = farmer._engage.bind(farmer);
    farmer._engage = (context, target) => {
      const snapshot = context && context.snapshot;
      const adapter = context && context.adapter;
      if (snapshot && snapshot.character && target && farmer.kiting && adapter && typeof adapter.stabilityStatus === 'function') {
        const decision = farmer.kiting.evaluate(snapshot.character, target);
        const movement = adapter.stabilityStatus().movement;
        if (decision && decision.shouldMove && movement && movement.circuitOpen) {
          if (typeof farmer._event === 'function') {
            farmer._event('FARMER_KITE_SUPPRESSED', 'warn', 'MOVEMENT_CIRCUIT_OPEN', {
              circuitUntil: movement.circuitUntil,
              failureStreak: movement.failureStreak,
              targetId: target.id || null,
              targetType: target.mtype || null
            });
          }
          return;
        }
      }
      return baseEngage(context, target);
    };
    farmer.__kitingCircuitGuardInstalled = true;
  }

  _phaseMessage(message) {
    return String(message || '').replace(/\[AIO v3 [^\]]+\]/, `[AIO v3 ${VERSION}]`);
  }

  _announce(message, event) {
    const resolved = this._phaseMessage(message);
    this.log.emit({ component: 'runtime', event, data: { message: resolved, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(resolved);
    return true;
  }

  _restoreWorldOnce() {
    if (this.worldLoaded) return;
    this.persistence.load(this.world);
    const status = this.persistence.status();
    this.worldLoaded = status.loadComplete === true || (status.loaded === true && status.loadComplete == null);
  }

  start() {
    if (this.timer) return false;
    this._restoreWorldOnce();
    this.startedAt = this.startedAt || this.now();
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STARTED', data: { version: VERSION, mode: this.adapter.mode, tickMs: this.tickMs } });
    const modeNote = this.adapter.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    this._announce(`[AIO v3 ${VERSION}] STARTED | mode=${this.adapter.mode} | ${modeNote}`, 'VISIBLE_STARTUP');
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return true;
  }

  _armEmergencyRetreat(snapshot, entity, emergency, at) {
    if (this.adapter && typeof this.adapter.supersedeMovement === 'function') {
      this.adapter.supersedeMovement('EMERGENCY_RETREAT_OVERRIDE');
    }
    return super._armEmergencyRetreat(snapshot, entity, emergency, at);
  }

  tick() {
    super.tick();
    this.stability.process();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: VERSION,
      stability: {
        commandOutcomes: this.adapter && typeof this.adapter.stabilityStatus === 'function'
          ? this.adapter.stabilityStatus()
          : null,
        combat: this.stability.status(),
        knowledgeAging: this.knowledgeAging.status(this.world),
        stableScheduler: this.scheduler instanceof StableScheduler
      }
    };
  }
}

module.exports = { StabilityRuntime };

},
"src/version.js": function(require,module,exports){
'use strict';

// StabilityRuntime and the historical Alpha.9-Alpha.13 lineage intentionally
// remain frozen at the last release that used this shared legacy version
// surface. Current releases use release-version.js directly in their phase
// runtime and public index.
const VERSION = '3.0.0-alpha.18.0';

module.exports = { VERSION };

},
"src/game/stability-adapter.js": function(require,module,exports){
'use strict';

const { GameAdapter } = require('./adapter');
const { CommandOutcomeTracker, CommandOutcomeState, entityById, inventoryCount } = require('./command-outcomes');

class StabilityGameAdapter extends GameAdapter {
  constructor(options = {}) {
    super(options);
    this.outcomes = options.outcomes || new CommandOutcomeTracker({
      now: this.now,
      log: this.log,
      capacity: options.commandOutcomeCapacity,
      pendingCapacity: options.commandOutcomePendingCapacity,
      defaultTimeoutMs: options.commandOutcomeTimeoutMs,
      moveMinDelta: options.commandOutcomeMoveMinDelta
    });
    this.movementMaxFailures = Math.max(1, Number(options.movementMaxFailures) || 3);
    this.movementCircuitMs = Math.max(1000, Number(options.movementCircuitMs) || 15000);
    this.movementFailureStreak = 0;
    this.movementCircuitUntil = 0;
    this.pendingMovementOutcomeId = null;
    this.lastMovementOutcome = null;
    this.lastMovementFailure = null;
  }

  _beforeState(action, args) {
    const snapshot = this.lastSnapshot || super.snapshot();
    if (!snapshot || !snapshot.character) return null;
    const c = snapshot.character;
    const targetId = action === 'attack' ? args[0] : (action === 'use_skill' ? args[1] : null);
    const target = entityById(snapshot, targetId);
    return {
      observedAt: snapshot.observedAt,
      map: c.map || null,
      x: c.x,
      y: c.y,
      moving: !!c.moving,
      hp: c.hp,
      mp: c.mp,
      hpPotionCount: inventoryCount(snapshot, 'hpot'),
      mpPotionCount: inventoryCount(snapshot, 'mpot'),
      targetId: targetId == null ? null : String(targetId),
      targetPresent: !!target,
      targetHp: target && target.hp != null ? Number(target.hp) : null
    };
  }

  _movementCircuitOpen(now = this.now()) {
    if (this.movementCircuitUntil && now >= this.movementCircuitUntil) {
      this.movementCircuitUntil = 0;
      this.movementFailureStreak = 0;
      if (this.log) this.log.emit({ component: 'adapter', event: 'MOVEMENT_CIRCUIT_CLOSED' });
    }
    return this.movementCircuitUntil > now;
  }

  _recordMovementFailure(reason, outcome = null) {
    const now = this.now();
    this.movementFailureStreak += 1;
    this.lastMovementFailure = {
      at: now,
      reason: reason || 'MOVEMENT_FAILED',
      failureStreak: this.movementFailureStreak,
      outcomeId: outcome && outcome.id || null
    };
    if (this.movementFailureStreak >= this.movementMaxFailures) {
      this.movementCircuitUntil = Math.max(this.movementCircuitUntil, now + this.movementCircuitMs);
      if (this.log) this.log.emit({
        component: 'adapter',
        event: 'MOVEMENT_CIRCUIT_OPENED',
        severity: 'warn',
        reason: this.lastMovementFailure.reason,
        data: {
          failureStreak: this.movementFailureStreak,
          maxFailures: this.movementMaxFailures,
          circuitUntil: this.movementCircuitUntil,
          circuitMs: this.movementCircuitMs
        }
      });
    }
  }

  _reconcileMovement() {
    if (!this.pendingMovementOutcomeId) return null;
    const outcome = this.outcomes.get(this.pendingMovementOutcomeId);
    if (!outcome || outcome.state === CommandOutcomeState.PENDING) return outcome;
    this.pendingMovementOutcomeId = null;
    this.lastMovementOutcome = outcome;
    if (outcome.state === CommandOutcomeState.CONFIRMED) {
      this.movementFailureStreak = 0;
      this.lastMovementFailure = null;
    } else {
      this._recordMovementFailure(outcome.reason || 'MOVE_OUTCOME_TIMEOUT', outcome);
    }
    return outcome;
  }

  supersedeMovement(reason = 'SUPERSEDED') {
    if (!this.pendingMovementOutcomeId) return false;
    const id = this.pendingMovementOutcomeId;
    this.pendingMovementOutcomeId = null;
    if (this.log) this.log.emit({
      component: 'adapter',
      event: 'MOVEMENT_OUTCOME_SUPERSEDED',
      severity: 'warn',
      reason,
      data: { outcomeId: id }
    });
    return true;
  }

  snapshot() {
    const snapshot = super.snapshot();
    this.outcomes.observe(snapshot);
    this._reconcileMovement();
    return snapshot;
  }

  command(action, args = []) {
    const now = this.now();
    const isMovement = action === 'move' || action === 'smart_move' || action === 'town';
    if (isMovement) {
      this._reconcileMovement();
      if (this._movementCircuitOpen(now)) {
        return {
          executed: false,
          accepted: false,
          reason: 'MOVEMENT_CIRCUIT_OPEN',
          circuitUntil: this.movementCircuitUntil
        };
      }
      if (this.pendingMovementOutcomeId) {
        const pending = this.outcomes.get(this.pendingMovementOutcomeId);
        if (pending && pending.state === CommandOutcomeState.PENDING) {
          return {
            executed: true,
            accepted: false,
            coalesced: true,
            reason: 'MOVE_OUTCOME_PENDING',
            outcomeId: pending.id,
            outcomeState: pending.state
          };
        }
        this.pendingMovementOutcomeId = null;
      }
    }

    const before = this.mode === 'active' ? this._beforeState(action, args) : null;
    const result = super.command(action, args);

    if (!result.executed) {
      if (isMovement && !result.shadow && !result.coalesced) this._recordMovementFailure(result.reason || 'MOVE_COMMAND_FAILED');
      return result;
    }

    const outcome = this.outcomes.issue({ action, args, before });
    if (isMovement) this.pendingMovementOutcomeId = outcome.id;
    return {
      ...result,
      accepted: true,
      verified: false,
      outcomeId: outcome.id,
      outcomeState: outcome.state
    };
  }

  commandOutcome(id) {
    return this.outcomes.get(id);
  }

  takeCommandOutcomes(limit = 100) {
    return this.outcomes.drainTerminal(limit);
  }

  stabilityStatus() {
    const now = this.now();
    this._reconcileMovement();
    return {
      outcomes: this.outcomes.status(),
      movement: {
        pendingOutcomeId: this.pendingMovementOutcomeId,
        failureStreak: this.movementFailureStreak,
        maxFailures: this.movementMaxFailures,
        circuitOpen: this._movementCircuitOpen(now),
        circuitUntil: this.movementCircuitUntil || null,
        circuitRemainingMs: Math.max(0, this.movementCircuitUntil - now),
        lastOutcome: this.lastMovementOutcome,
        lastFailure: this.lastMovementFailure
      }
    };
  }
}

module.exports = { StabilityGameAdapter };

},
"src/game/command-outcomes.js": function(require,module,exports){
'use strict';

const CommandOutcomeState = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  TIMED_OUT: 'TIMED_OUT'
});

function finite(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function entityById(snapshot, id) {
  if (!snapshot || id == null) return null;
  const wanted = String(id);
  return (snapshot.entities || []).find((entity) => entity && String(entity.id) === wanted) || null;
}

function inventoryCount(snapshot, prefix) {
  const inventory = snapshot && snapshot.character && snapshot.character.inventory || [];
  return inventory.reduce((sum, item) => {
    if (!item || !String(item.name || '').startsWith(prefix)) return sum;
    return sum + Math.max(0, Number(item.q) || 1);
  }, 0);
}

class CommandOutcomeTracker {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(50, Number(options.capacity) || 500);
    this.pendingCapacity = Math.max(10, Number(options.pendingCapacity) || 100);
    this.moveMinDelta = Math.max(1, Number(options.moveMinDelta) || 4);
    this.defaultTimeoutMs = Math.max(500, Number(options.defaultTimeoutMs) || 2500);
    this.nextId = 1;
    this.nextTerminalSeq = 1;
    this.pending = new Map();
    this.history = [];
    this.terminalQueue = [];
    this.droppedPending = 0;
    this.droppedHistory = 0;
  }

  _timeoutFor(action) {
    if (action === 'attack') return 2000;
    if (action === 'stop') return 1500;
    if (action === 'smart_move' || action === 'town') return 5000;
    return this.defaultTimeoutMs;
  }

  issue(spec = {}) {
    const now = this.now();
    if (this.pending.size >= this.pendingCapacity) {
      const oldest = [...this.pending.values()].sort((a, b) => a.issuedAt - b.issuedAt)[0];
      if (oldest) {
        this.pending.delete(oldest.id);
        this.droppedPending += 1;
        this._terminal(oldest, CommandOutcomeState.TIMED_OUT, 'PENDING_CAPACITY_EVICTION', now);
      }
    }

    const record = {
      id: spec.id || `outcome-${now}-${this.nextId++}`,
      action: String(spec.action || ''),
      args: Array.isArray(spec.args) ? spec.args.map((value) => {
        if (value && typeof value === 'object') return value.id || value.name || '[object]';
        return value;
      }) : [],
      issuedAt: now,
      expiresAt: now + Math.max(500, Number(spec.timeoutMs) || this._timeoutFor(spec.action)),
      state: CommandOutcomeState.PENDING,
      reason: 'AWAITING_OBSERVED_EFFECT',
      before: spec.before || null,
      confirmedAt: null,
      observed: null,
      terminalSeq: null
    };
    this.pending.set(record.id, record);
    if (this.log) this.log.emit({
      component: 'adapter',
      event: 'COMMAND_OUTCOME_PENDING',
      data: { outcomeId: record.id, action: record.action, expiresAt: record.expiresAt }
    });
    return { ...record };
  }

  _effect(record, snapshot) {
    if (!snapshot || !snapshot.character || !record.before) return null;
    const before = record.before;
    const c = snapshot.character;
    const action = record.action;

    if (action === 'move' || action === 'smart_move' || action === 'town') {
      if (before.map && c.map && before.map !== c.map) return { kind: 'MAP_CHANGED', map: c.map };
      const bx = finite(before.x);
      const by = finite(before.y);
      const x = finite(c.x);
      const y = finite(c.y);
      if (bx != null && by != null && x != null && y != null) {
        const delta = Math.hypot(x - bx, y - by);
        if (delta >= this.moveMinDelta) return { kind: 'POSITION_CHANGED', delta: Number(delta.toFixed(2)), x, y };
      }
      if ((action === 'smart_move' || action === 'town') && c.moving && !before.moving) return { kind: 'MOVEMENT_STARTED' };
      return null;
    }

    if (action === 'stop') {
      if (before.moving && !c.moving) return { kind: 'MOVEMENT_STOPPED' };
      if (!before.moving && !c.moving) return { kind: 'ALREADY_STOPPED' };
      return null;
    }

    if (action === 'attack' || action === 'use_skill') {
      const targetId = action === 'attack' ? record.args[0] : record.args[1];
      const target = entityById(snapshot, targetId);
      if (before.targetPresent && !target) return { kind: 'TARGET_GONE', targetId: targetId || null };
      if (target && (target.dead || (target.hp != null && Number(target.hp) <= 0))) return { kind: 'TARGET_DEAD', targetId: target.id };
      if (target && before.targetHp != null && target.hp != null && Number(target.hp) < Number(before.targetHp)) {
        return { kind: 'TARGET_HP_DECREASED', targetId: target.id, beforeHp: before.targetHp, afterHp: Number(target.hp) };
      }
      if (action === 'use_skill' && before.mp != null && c.mp != null && Number(c.mp) < Number(before.mp)) {
        return { kind: 'MP_DECREASED', beforeMp: before.mp, afterMp: Number(c.mp) };
      }
      return null;
    }

    if (action === 'use_hp') {
      if (before.hp != null && c.hp != null && Number(c.hp) > Number(before.hp)) return { kind: 'HP_INCREASED', beforeHp: before.hp, afterHp: Number(c.hp) };
      if (inventoryCount(snapshot, 'hpot') < Number(before.hpPotionCount || 0)) return { kind: 'HP_POTION_CONSUMED' };
      return null;
    }

    if (action === 'use_mp') {
      if (before.mp != null && c.mp != null && Number(c.mp) > Number(before.mp)) return { kind: 'MP_INCREASED', beforeMp: before.mp, afterMp: Number(c.mp) };
      if (inventoryCount(snapshot, 'mpot') < Number(before.mpPotionCount || 0)) return { kind: 'MP_POTION_CONSUMED' };
      return null;
    }

    if (action === 'use_hp_or_mp') {
      if (before.hp != null && c.hp != null && Number(c.hp) > Number(before.hp)) return { kind: 'HP_INCREASED' };
      if (before.mp != null && c.mp != null && Number(c.mp) > Number(before.mp)) return { kind: 'MP_INCREASED' };
      const beforePotions = Number(before.hpPotionCount || 0) + Number(before.mpPotionCount || 0);
      const afterPotions = inventoryCount(snapshot, 'hpot') + inventoryCount(snapshot, 'mpot');
      if (afterPotions < beforePotions) return { kind: 'POTION_CONSUMED' };
      return null;
    }

    return null;
  }

  _terminal(record, state, reason, at, observed = null) {
    this.pending.delete(record.id);
    record.state = state;
    record.reason = reason;
    record.confirmedAt = at;
    record.observed = observed;
    record.terminalSeq = this.nextTerminalSeq++;
    const stored = { ...record };
    this.history.push(stored);
    this.terminalQueue.push(stored);
    if (this.history.length > this.capacity) {
      const drop = this.history.length - this.capacity;
      this.history.splice(0, drop);
      this.droppedHistory += drop;
    }
    if (this.terminalQueue.length > this.capacity) this.terminalQueue.splice(0, this.terminalQueue.length - this.capacity);
    if (this.log) this.log.emit({
      component: 'adapter',
      event: state === CommandOutcomeState.CONFIRMED ? 'COMMAND_OUTCOME_CONFIRMED' : 'COMMAND_OUTCOME_TIMED_OUT',
      severity: state === CommandOutcomeState.CONFIRMED ? 'info' : 'warn',
      reason,
      data: { outcomeId: record.id, action: record.action, observed }
    });
    return stored;
  }

  observe(snapshot) {
    const now = this.now();
    const completed = [];
    for (const record of [...this.pending.values()]) {
      const effect = this._effect(record, snapshot);
      if (effect) {
        completed.push(this._terminal(record, CommandOutcomeState.CONFIRMED, effect.kind, now, effect));
        continue;
      }
      if (now >= record.expiresAt) completed.push(this._terminal(record, CommandOutcomeState.TIMED_OUT, 'OBSERVED_EFFECT_TIMEOUT', now));
    }
    return completed;
  }

  get(id) {
    if (!id) return null;
    const pending = this.pending.get(String(id));
    if (pending) return { ...pending };
    const terminal = [...this.history].reverse().find((record) => record.id === String(id));
    return terminal ? { ...terminal } : null;
  }

  drainTerminal(limit = 100) {
    const count = Math.max(0, Math.min(this.terminalQueue.length, Number(limit) || 0));
    return this.terminalQueue.splice(0, count).map((record) => ({ ...record }));
  }

  status() {
    const counts = { PENDING: this.pending.size, CONFIRMED: 0, TIMED_OUT: 0 };
    for (const record of this.history) counts[record.state] = (counts[record.state] || 0) + 1;
    return {
      counts,
      pendingCapacity: this.pendingCapacity,
      historyCapacity: this.capacity,
      historySize: this.history.length,
      droppedPending: this.droppedPending,
      droppedHistory: this.droppedHistory,
      recent: this.history.slice(-20).map((record) => ({
        id: record.id,
        action: record.action,
        state: record.state,
        reason: record.reason,
        issuedAt: record.issuedAt,
        confirmedAt: record.confirmedAt
      }))
    };
  }
}

module.exports = { CommandOutcomeTracker, CommandOutcomeState, inventoryCount, entityById };

},
"src/core/stable-scheduler.js": function(require,module,exports){
'use strict';

const { Scheduler } = require('./scheduler');
const { TaskState } = require('./task');

class StableScheduler extends Scheduler {
  constructor(options = {}) {
    super(options);
    this.stableWaitTransitions = 0;
    this.resumedTransitions = 0;
  }

  _run(task, context, now) {
    if (now - task.startedAt > task.timeoutMs) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = 'TASK_TIMEOUT';
      this._event(task, 'TASK_FAILED', 'warn', task.reason);
      this._retryOrFinish(task, now);
      return;
    }

    this._observeProgress(task, context, now);

    let result;
    try {
      result = task.step(context, task);
    } catch (error) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = `STEP_ERROR:${error && error.message || error}`;
      this._event(task, 'TASK_FAILED', 'error', task.reason);
      this._retryOrFinish(task, now);
      return;
    }

    task.updatedAt = now;
    const state = typeof result === 'string' ? result : result && result.state;
    const reason = result && typeof result === 'object' ? result.reason || null : null;
    const stableWait = !!(result && typeof result === 'object' && result.stableWait === true);

    if (!state || state === TaskState.RUNNING || state === TaskState.WAITING) {
      if (state === TaskState.WAITING && stableWait) {
        const entering = task.state !== TaskState.WAITING || task.reason !== reason || task.stableWait !== true;
        task.state = TaskState.WAITING;
        task.reason = reason || 'STABLE_WAIT';
        task.stableWait = true;
        task.waitingSince = task.waitingSince || now;
        if (entering) {
          this.stableWaitTransitions += 1;
          this._event(task, 'TASK_STABLE_WAIT', 'info', task.reason, { waitingSince: task.waitingSince });
        }
        return;
      }

      if (task.stableWait) {
        task.stableWait = false;
        task.waitingSince = null;
        task.lastProgressAt = now;
        this.resumedTransitions += 1;
        this._event(task, 'TASK_RESUMED', 'info', reason || 'STABLE_WAIT_RESOLVED');
      }

      task.state = state === TaskState.WAITING ? TaskState.WAITING : TaskState.RUNNING;
      task.reason = reason;

      if (now - task.lastProgressAt > task.stallMs) {
        task.state = TaskState.FAILED_RETRYABLE;
        task.reason = 'NO_PROGRESS';
        this._event(task, 'TASK_STALLED', 'warn', task.reason, {
          stallMs: now - task.lastProgressAt,
          progress: task.lastProgressToken
        });
        this._retryOrFinish(task, now);
      }
      return;
    }

    if (!Object.values(TaskState).includes(state)) throw new Error(`unknown task state ${state}`);
    task.stableWait = false;
    task.waitingSince = null;
    task.state = state;
    task.reason = reason;
    if (state === TaskState.SUCCEEDED) this._event(task, 'TASK_SUCCEEDED', 'info', reason);
    else if (state === TaskState.CANCELLED) this._event(task, 'TASK_CANCELLED', 'warn', reason);
    else this._event(task, 'TASK_FAILED', state === TaskState.FAILED_FATAL ? 'error' : 'warn', reason);
    this._retryOrFinish(task, now);
  }

  snapshot() {
    const base = super.snapshot();
    base.active = base.active.map((row) => {
      const task = this.activeByOwner.get(row.owner);
      return {
        ...row,
        stableWait: !!(task && task.stableWait),
        waitingSince: task && task.waitingSince || null
      };
    });
    base.stability = {
      stableWaitTransitions: this.stableWaitTransitions,
      resumedTransitions: this.resumedTransitions
    };
    return base;
  }
}

module.exports = { StableScheduler };

},
"src/world/resilient-persistence.js": function(require,module,exports){
'use strict';

const { WorldPersistence } = require('./persistence');

class ResilientWorldPersistence extends WorldPersistence {
  constructor(options = {}) {
    super(options);
    this.retryBaseMs = Math.max(1000, Number(options.retryBaseMs) || 5000);
    this.retryMaxMs = Math.max(this.retryBaseMs, Number(options.retryMaxMs) || 120000);
    this.saveCircuitAfter = Math.max(2, Number(options.saveCircuitAfter) || 5);
    this.saveCircuitMs = Math.max(10000, Number(options.saveCircuitMs) || 120000);
    this.loadComplete = false;
    this.loadAttempts = 0;
    this.loadFailureStreak = 0;
    this.nextLoadAttemptAt = 0;
    this.lastLoadError = null;
    this.saveFailureStreak = 0;
    this.nextSaveAttemptAt = 0;
    this.saveCircuitUntil = 0;
    this.lastSaveError = null;
  }

  _backoff(streak) {
    const exponent = Math.max(0, Number(streak) - 1);
    return Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, exponent));
  }

  _recordLoadFailure(reason, error = null) {
    const now = this.now();
    this.loadFailureStreak += 1;
    this.lastLoadError = error ? String(error && error.message || error) : reason;
    const backoffMs = this._backoff(this.loadFailureStreak);
    this.nextLoadAttemptAt = now + backoffMs;
    this.loaded = false;
    if (this.log) this.log.emit({
      component: 'persistence',
      event: 'WORLD_MODEL_RESTORE_RETRY_SCHEDULED',
      severity: 'warn',
      reason,
      data: { failureStreak: this.loadFailureStreak, backoffMs, nextAttemptAt: this.nextLoadAttemptAt, message: this.lastLoadError }
    });
  }

  _recordSaveFailure(reason, error = null) {
    const now = this.now();
    this.saveFailureStreak += 1;
    this.lastSaveError = error ? String(error && error.message || error) : reason;
    const backoffMs = this._backoff(this.saveFailureStreak);
    this.nextSaveAttemptAt = now + backoffMs;
    if (this.saveFailureStreak >= this.saveCircuitAfter) {
      this.saveCircuitUntil = Math.max(this.saveCircuitUntil, now + this.saveCircuitMs);
      if (this.log) this.log.emit({
        component: 'persistence',
        event: 'WORLD_MODEL_SAVE_CIRCUIT_OPENED',
        severity: 'warn',
        reason,
        data: { failureStreak: this.saveFailureStreak, circuitUntil: this.saveCircuitUntil, circuitMs: this.saveCircuitMs }
      });
    }
    if (this.log) this.log.emit({
      component: 'persistence',
      event: 'WORLD_MODEL_SAVE_RETRY_SCHEDULED',
      severity: 'warn',
      reason,
      data: { failureStreak: this.saveFailureStreak, backoffMs, nextAttemptAt: this.nextSaveAttemptAt, message: this.lastSaveError }
    });
  }

  _resetSaveFailures() {
    this.saveFailureStreak = 0;
    this.nextSaveAttemptAt = 0;
    this.saveCircuitUntil = 0;
    this.lastSaveError = null;
  }

  load(world) {
    if (this.loadComplete) return false;
    const now = this.now();
    if (now < this.nextLoadAttemptAt) return false;
    this.loadAttempts += 1;
    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      this._recordLoadFailure('NO_SUPPORTED_STORAGE');
      return false;
    }

    try {
      const serialized = backend.get(this.key);
      if (serialized == null || serialized === '') {
        this.loadComplete = true;
        this.loaded = true;
        this.loadFailureStreak = 0;
        this.nextLoadAttemptAt = 0;
        this.lastLoadError = null;
        if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_STORAGE_EMPTY', data: { backend: this.backendName } });
        return false;
      }
      world.restore(serialized);
      this.lastSavedRevision = world.revision;
      this.loadComplete = true;
      this.loaded = true;
      this.loadFailureStreak = 0;
      this.nextLoadAttemptAt = 0;
      this.lastLoadError = null;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORED', data: { backend: this.backendName, bytes: String(serialized).length, revision: world.revision, attempts: this.loadAttempts } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_RESTORE_FAILED', severity: 'warn', reason: 'PERSISTENCE_READ_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      this._recordLoadFailure('PERSISTENCE_READ_ERROR', error);
      return false;
    }
  }

  maybeSave(world, options = {}) {
    const force = options.force === true;
    const now = this.now();
    if (!force && this.saveCircuitUntil > now) return false;
    if (!force && this.nextSaveAttemptAt > now) return false;
    if (this.saveCircuitUntil && now >= this.saveCircuitUntil) {
      this.saveCircuitUntil = 0;
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_CIRCUIT_CLOSED' });
    }

    const backend = this._backend();
    if (!backend) {
      this._logUnavailable();
      this._recordSaveFailure('NO_SUPPORTED_STORAGE');
      return false;
    }
    if (!force && world.revision === this.lastSavedRevision) return false;
    if (!force && now - this.lastSavedAt < this.minIntervalMs) return false;

    let serialized;
    try {
      serialized = world.serialize();
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'SERIALIZE_ERROR', data: { message: String(error && error.message || error) } });
      this._recordSaveFailure('SERIALIZE_ERROR', error);
      return false;
    }

    if (serialized.length > this.maxBytes) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_SKIPPED', severity: 'warn', reason: 'PERSISTENCE_SIZE_LIMIT', data: { bytes: serialized.length, maxBytes: this.maxBytes, revision: world.revision } });
      this._recordSaveFailure('PERSISTENCE_SIZE_LIMIT');
      return false;
    }

    try {
      backend.set(this.key, serialized);
      this.lastSavedAt = now;
      this.lastSavedRevision = world.revision;
      this._resetSaveFailures();
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVED', data: { backend: this.backendName, bytes: serialized.length, revision: world.revision, forced: force } });
      return true;
    } catch (error) {
      if (this.log) this.log.emit({ component: 'persistence', event: 'WORLD_MODEL_SAVE_FAILED', severity: 'warn', reason: 'PERSISTENCE_WRITE_ERROR', data: { backend: this.backendName, message: String(error && error.message || error) } });
      this._recordSaveFailure('PERSISTENCE_WRITE_ERROR', error);
      return false;
    }
  }

  status() {
    const now = this.now();
    return {
      ...super.status(),
      loadComplete: this.loadComplete,
      loadAttempts: this.loadAttempts,
      loadFailureStreak: this.loadFailureStreak,
      nextLoadAttemptAt: this.nextLoadAttemptAt || null,
      loadRetryRemainingMs: Math.max(0, this.nextLoadAttemptAt - now),
      lastLoadError: this.lastLoadError,
      saveFailureStreak: this.saveFailureStreak,
      nextSaveAttemptAt: this.nextSaveAttemptAt || null,
      saveRetryRemainingMs: Math.max(0, this.nextSaveAttemptAt - now),
      saveCircuitOpen: this.saveCircuitUntil > now,
      saveCircuitUntil: this.saveCircuitUntil || null,
      saveCircuitRemainingMs: Math.max(0, this.saveCircuitUntil - now),
      lastSaveError: this.lastSaveError,
      retryBaseMs: this.retryBaseMs,
      retryMaxMs: this.retryMaxMs
    };
  }
}

module.exports = { ResilientWorldPersistence };

},
"src/world/knowledge-aging.js": function(require,module,exports){
'use strict';

class KnowledgeAgingPolicy {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    // Production defaults remain deliberately long-lived (6h fresh / 72h stale),
    // while explicit configurations may use short windows for deterministic tests
    // and future controlled revalidation experiments.
    this.freshMs = Math.max(100, Number(options.freshMs) || 6 * 60 * 60 * 1000);
    this.staleMs = Math.max(this.freshMs + 100, Number(options.staleMs) || 72 * 60 * 60 * 1000);
    this.minFreshness = Math.max(0.05, Math.min(0.5, Number(options.minFreshness) || 0.15));
  }

  freshness(ageMs) {
    const age = Math.max(0, Number(ageMs) || 0);
    if (age <= this.freshMs) return 1;
    if (age >= this.staleMs) return this.minFreshness;
    const span = this.staleMs - this.freshMs;
    const t = (age - this.freshMs) / span;
    return 1 - t * (1 - this.minFreshness);
  }

  apply(record) {
    if (!record) return null;
    const now = this.now();
    const updatedAt = Number(record.updatedAt) || 0;
    const ageMs = updatedAt > 0 ? Math.max(0, now - updatedAt) : Infinity;
    const freshness = Number.isFinite(ageMs) ? this.freshness(ageMs) : this.minFreshness;
    const baseConfidence = Math.max(0, Math.min(1, Number(record.confidence) || 0));
    return {
      ...record,
      baseConfidence,
      confidence: Number((baseConfidence * freshness).toFixed(6)),
      freshness: Number(freshness.toFixed(6)),
      ageMs: Number.isFinite(ageMs) ? ageMs : null,
      stale: !Number.isFinite(ageMs) || ageMs >= this.staleMs,
      needsRevalidation: !Number.isFinite(ageMs) || ageMs > this.freshMs
    };
  }

  status(world) {
    let fresh = 0;
    let aging = 0;
    let stale = 0;
    if (world && world.performance instanceof Map) {
      for (const record of world.performance.values()) {
        const ageMs = record && record.updatedAt ? Math.max(0, this.now() - Number(record.updatedAt)) : Infinity;
        if (!Number.isFinite(ageMs) || ageMs >= this.staleMs) stale += 1;
        else if (ageMs > this.freshMs) aging += 1;
        else fresh += 1;
      }
    }
    return { freshMs: this.freshMs, staleMs: this.staleMs, minFreshness: this.minFreshness, profiles: { fresh, aging, stale } };
  }
}

function installKnowledgeAging(world, policy) {
  if (!world || !policy || world.__knowledgeAgingInstalled) return false;
  const basePerformanceFor = world.performanceFor.bind(world);
  world.performanceFor = (monster, fingerprint) => policy.apply(basePerformanceFor(monster, fingerprint));
  world.__knowledgeAgingInstalled = true;
  return true;
}

function installStaleRiskGuard(combatRisk, world, policy, options = {}) {
  if (!combatRisk || !world || !policy || combatRisk.__staleRiskGuardInstalled) return false;
  const weight = Math.max(0, Math.min(0.5, Number(options.weight) || 0.25));
  const baseEvaluate = combatRisk.evaluate.bind(combatRisk);
  combatRisk.evaluate = (entity, snapshot, currentWorld, party) => {
    const result = baseEvaluate(entity, snapshot, currentWorld, party);
    if (!entity || !entity.mtype || entity.target || !result || !result.allowed) return result;
    const fingerprint = party && party.fingerprint || null;
    let learned = null;
    try { learned = (currentWorld || world).performanceFor(entity.mtype, fingerprint); } catch (_) { learned = null; }
    if (!learned || !learned.needsRevalidation) return result;
    const baseConfidence = Math.max(0, Math.min(1, Number(learned.baseConfidence) || Number(learned.confidence) || 0));
    const contribution = weight * Math.max(0.25, baseConfidence);
    const score = Math.min(1, Math.max(0, Number(result.score) || 0) + contribution);
    const allowed = score < Number(result.threshold || combatRisk.threshold || 0.65);
    return {
      ...result,
      allowed,
      score: Number(score.toFixed(3)),
      reason: allowed ? 'RISK_ACCEPTABLE_STALE_KNOWLEDGE' : 'STALE_KNOWLEDGE_REVALIDATION_REQUIRED',
      signals: {
        ...(result.signals || {}),
        performanceAgeMs: learned.ageMs,
        performanceFreshness: learned.freshness,
        performanceNeedsRevalidation: true,
        staleKnowledgeContribution: Number(contribution.toFixed(3))
      }
    };
  };
  combatRisk.__staleRiskGuardInstalled = true;
  combatRisk.staleKnowledgeWeight = weight;
  const baseStatus = combatRisk.status.bind(combatRisk);
  combatRisk.status = () => ({ ...baseStatus(), staleKnowledgeWeight: weight, knowledgeAging: policy.status(world) });
  return true;
}

module.exports = { KnowledgeAgingPolicy, installKnowledgeAging, installStaleRiskGuard };

},
"src/stability/combat-stability-supervisor.js": function(require,module,exports){
'use strict';

const { CommandOutcomeState } = require('../game/command-outcomes');

class CombatStabilitySupervisor {
  constructor(options = {}) {
    this.runtime = options.runtime || null;
    this.adapter = options.adapter || this.runtime && this.runtime.adapter || null;
    this.log = options.log || this.runtime && this.runtime.log || null;
    this.now = options.now || (() => Date.now());
    this.capacity = Math.max(20, Number(options.capacity) || 100);
    this.recent = [];
    this.counts = { CONFIRMED: 0, TIMED_OUT: 0 };
    this.skillTimeouts = 0;
    this.attackTimeoutStreak = 0;
    this.lastAttackOutcome = null;
    this.trackedRetreatAt = null;
    this.pendingRetreatOutcomeId = null;
    this.retreatConfirmed = 0;
    this.retreatTimedOut = 0;
    this.lastRetreatOutcome = null;
  }

  _event(event, severity, reason, data) {
    if (!this.log) return;
    this.log.emit({ component: 'stability', event, severity: severity || 'info', reason: reason || null, data: data || {} });
  }

  _remember(outcome) {
    this.recent.push({
      id: outcome.id,
      action: outcome.action,
      state: outcome.state,
      reason: outcome.reason,
      issuedAt: outcome.issuedAt,
      confirmedAt: outcome.confirmedAt,
      observed: outcome.observed || null
    });
    if (this.recent.length > this.capacity) this.recent.splice(0, this.recent.length - this.capacity);
  }

  _trackRetreatRequest() {
    const farmer = this.runtime && this.runtime.farmer;
    if (!farmer || !farmer.lastSafeRetreatMove || !this.adapter || typeof this.adapter.stabilityStatus !== 'function') return;
    const retreatAt = Number(farmer.lastSafeRetreatMove.at) || 0;
    if (!retreatAt || retreatAt === this.trackedRetreatAt) return;
    const movement = this.adapter.stabilityStatus().movement;
    if (!movement || !movement.pendingOutcomeId) return;
    this.trackedRetreatAt = retreatAt;
    this.pendingRetreatOutcomeId = String(movement.pendingOutcomeId);
    farmer.lastSafeRetreatMove = {
      ...farmer.lastSafeRetreatMove,
      verified: false,
      outcomeId: this.pendingRetreatOutcomeId,
      verificationState: 'PENDING'
    };
    this._event('SAFE_RETREAT_OUTCOME_PENDING', 'warn', 'AWAITING_OBSERVED_MOVEMENT', {
      outcomeId: this.pendingRetreatOutcomeId,
      retreatAt,
      emergencyReason: farmer.lastSafeRetreatMove.emergencyReason || null
    });
  }

  _handleRetreat(outcome) {
    if (!this.pendingRetreatOutcomeId || String(outcome.id) !== String(this.pendingRetreatOutcomeId)) return false;
    const farmer = this.runtime && this.runtime.farmer;
    this.pendingRetreatOutcomeId = null;
    this.lastRetreatOutcome = {
      id: outcome.id,
      state: outcome.state,
      reason: outcome.reason,
      at: outcome.confirmedAt,
      observed: outcome.observed || null
    };

    if (outcome.state === CommandOutcomeState.CONFIRMED) {
      this.retreatConfirmed += 1;
      if (farmer && farmer.lastSafeRetreatMove) {
        farmer.lastSafeRetreatMove = {
          ...farmer.lastSafeRetreatMove,
          verified: true,
          verificationState: 'CONFIRMED',
          verifiedAt: outcome.confirmedAt,
          observed: outcome.observed || null
        };
        farmer.lastSafeRetreatFailure = null;
      }
      this._event('SAFE_RETREAT_OUTCOME_CONFIRMED', 'info', outcome.reason, {
        outcomeId: outcome.id,
        observed: outcome.observed || null
      });
      return true;
    }

    if (outcome.state === CommandOutcomeState.TIMED_OUT) {
      this.retreatTimedOut += 1;
      if (farmer) {
        const failure = {
          at: this.now(),
          reason: 'SAFE_RETREAT_OUTCOME_TIMEOUT',
          outcomeId: outcome.id,
          commandOutcomeReason: outcome.reason,
          emergencyReason: farmer.lastSafeRetreatMove && farmer.lastSafeRetreatMove.emergencyReason || null,
          sourceTargetId: farmer.lastSafeRetreatMove && farmer.lastSafeRetreatMove.sourceTargetId || null,
          sourceTargetType: farmer.lastSafeRetreatMove && farmer.lastSafeRetreatMove.sourceTargetType || null
        };
        farmer.lastSafeRetreatFailure = failure;
        if (farmer.lastSafeRetreatMove) {
          farmer.lastSafeRetreatMove = {
            ...farmer.lastSafeRetreatMove,
            verified: false,
            verificationState: 'TIMED_OUT',
            verifiedAt: outcome.confirmedAt
          };
        }
        if (typeof farmer._transition === 'function') farmer._transition('RECOVER', 'EMERGENCY_RETREAT_UNCONFIRMED');
        if (typeof farmer._event === 'function') farmer._event('FARMER_SAFE_RETREAT_UNCONFIRMED', 'warn', failure.reason, failure);
      }
      this._event('SAFE_RETREAT_OUTCOME_TIMED_OUT', 'warn', 'SAFE_RETREAT_OUTCOME_TIMEOUT', {
        outcomeId: outcome.id,
        commandOutcomeReason: outcome.reason
      });
      return true;
    }
    return false;
  }

  _restorePreviousSkillStreak(skillId, outcome) {
    const farmer = this.runtime && this.runtime.farmer;
    if (!farmer || !farmer.skillFailureHistory || !skillId) return;
    const recovery = farmer.lastSkillFailureRecovery;
    if (!recovery || String(recovery.skill) !== String(skillId)) return;
    if (Number(recovery.at) < Number(outcome.issuedAt) - 50) return;
    const previous = Math.max(0, Number(recovery.previousFailureStreak) || 0);
    if (!previous) return;
    farmer.skillFailureHistory.set(String(skillId), {
      skill: String(skillId),
      failureStreak: previous,
      firstFailureAt: Number(outcome.issuedAt) - 1,
      lastFailureAt: Number(outcome.issuedAt) - 1,
      lastBackoffMs: farmer.skillUsage && farmer.skillUsage.failureBackoffForStreak
        ? farmer.skillUsage.failureBackoffForStreak(previous)
        : 0
    });
  }

  _handleSkill(outcome) {
    const farmer = this.runtime && this.runtime.farmer;
    const skillId = outcome.args && outcome.args[0] != null ? String(outcome.args[0]) : null;
    if (!farmer || !skillId) return;

    if (outcome.state === CommandOutcomeState.CONFIRMED) {
      if (typeof farmer._resetSkillFailureState === 'function') farmer._resetSkillFailureState({ id: skillId }, this.now());
      this._event('SKILL_OUTCOME_CONFIRMED', 'info', outcome.reason, { outcomeId: outcome.id, skill: skillId, observed: outcome.observed || null });
      return;
    }

    if (outcome.state === CommandOutcomeState.TIMED_OUT) {
      this.skillTimeouts += 1;
      this._restorePreviousSkillStreak(skillId, outcome);
      let backoff = null;
      if (typeof farmer._armSkillFailureBackoff === 'function') {
        backoff = farmer._armSkillFailureBackoff({ id: skillId }, { executed: false, reason: 'COMMAND_FAILED' }, this.now());
      }
      this._event('SKILL_OUTCOME_TIMED_OUT', 'warn', 'COMMAND_OUTCOME_TIMEOUT', {
        outcomeId: outcome.id,
        skill: skillId,
        backoffArmed: !!backoff,
        failureStreak: backoff && backoff.failureStreak || 0,
        backoffMs: backoff && backoff.backoffMs || 0
      });
    }
  }

  _handleAttack(outcome) {
    this.lastAttackOutcome = {
      id: outcome.id,
      state: outcome.state,
      reason: outcome.reason,
      at: outcome.confirmedAt
    };
    if (outcome.state === CommandOutcomeState.CONFIRMED) this.attackTimeoutStreak = 0;
    else if (outcome.state === CommandOutcomeState.TIMED_OUT) this.attackTimeoutStreak += 1;
    this._event(
      outcome.state === CommandOutcomeState.CONFIRMED ? 'ATTACK_OUTCOME_CONFIRMED' : 'ATTACK_OUTCOME_TIMED_OUT',
      outcome.state === CommandOutcomeState.CONFIRMED ? 'info' : 'warn',
      outcome.reason,
      { outcomeId: outcome.id, timeoutStreak: this.attackTimeoutStreak }
    );
  }

  process() {
    if (!this.adapter || typeof this.adapter.takeCommandOutcomes !== 'function') return [];
    this._trackRetreatRequest();
    const outcomes = this.adapter.takeCommandOutcomes(200);
    for (const outcome of outcomes) {
      this._remember(outcome);
      this.counts[outcome.state] = (this.counts[outcome.state] || 0) + 1;
      this._handleRetreat(outcome);
      if (outcome.action === 'use_skill') this._handleSkill(outcome);
      if (outcome.action === 'attack') this._handleAttack(outcome);
    }
    return outcomes;
  }

  status() {
    return {
      counts: { ...this.counts },
      skillTimeouts: this.skillTimeouts,
      attackTimeoutStreak: this.attackTimeoutStreak,
      lastAttackOutcome: this.lastAttackOutcome,
      retreat: {
        pendingOutcomeId: this.pendingRetreatOutcomeId,
        confirmed: this.retreatConfirmed,
        timedOut: this.retreatTimedOut,
        lastOutcome: this.lastRetreatOutcome
      },
      recent: this.recent.slice()
    };
  }
}

module.exports = { CombatStabilitySupervisor };

},
"src/autonomy/alpha9-runtime.js": function(require,module,exports){
'use strict';

const { StabilityRuntime } = require('../stability/stability-runtime');
const { LocalFarmPlanner } = require('./local-farm-planner');
const { LocalFarmOrchestrator } = require('./local-farm-orchestrator');

class Alpha9Runtime extends StabilityRuntime {
  constructor(options = {}) {
    super(options);
    this.localFarmPlanner = options.localFarmPlanner || new LocalFarmPlanner({
      log: this.log,
      minExpectedImprovement: options.localFarmMinExpectedImprovement,
      maxCandidates: options.localFarmMaxCandidates
    });
    this.localFarming = options.localFarming || new LocalFarmOrchestrator({
      now: this.now,
      log: this.log,
      planner: this.localFarmPlanner,
      enabled: options.localFarmingEnabled !== false,
      minHoldMs: options.localFarmMinHoldMs,
      planLeaseMs: options.localFarmPlanLeaseMs,
      noProgressMs: options.localFarmNoProgressMs,
      replanCooldownMs: options.localFarmReplanCooldownMs,
      arrivalRadius: options.localFarmArrivalRadius,
      stepSeconds: options.localFarmStepSeconds,
      minStep: options.localFarmMinStep,
      maxStep: options.localFarmMaxStep,
      moveCooldownMs: options.localFarmMoveCooldownMs,
      maxPlanFailures: options.localFarmMaxPlanFailures,
      engageHpRatio: options.localFarmEngageHpRatio
    });
  }

  tick() {
    super.tick();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return;
    const party = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    this.localFarming.tick({
      runtime: this,
      snapshot,
      world: this.world,
      party,
      gameData
    });
  }

  status() {
    return {
      ...super.status(),
      localFarming: this.localFarming.status()
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.localFarming = this.localFarming.status();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha9Runtime };

},
"src/autonomy/local-farm-planner.js": function(require,module,exports){
'use strict';

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function distance(a, b) {
  if (!a || !b) return Infinity;
  const ax = finite(a.x);
  const ay = finite(a.y);
  const bx = finite(b.x);
  const by = finite(b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function spawnType(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) {
    const value = entry.find((item) => typeof item === 'string');
    return value || null;
  }
  if (typeof entry === 'object') return entry.type || entry.mtype || entry.monster || entry.id || null;
  return null;
}

function boundaryCenter(boundary) {
  if (!boundary) return null;
  if (Array.isArray(boundary)) {
    const nums = boundary.map(Number).filter(Number.isFinite);
    if (nums.length >= 4) {
      return { x: (nums[0] + nums[2]) / 2, y: (nums[1] + nums[3]) / 2 };
    }
    if (nums.length >= 2) return { x: nums[0], y: nums[1] };
  }
  if (typeof boundary === 'object') {
    const x1 = finite(boundary.x1 != null ? boundary.x1 : boundary.left);
    const y1 = finite(boundary.y1 != null ? boundary.y1 : boundary.top);
    const x2 = finite(boundary.x2 != null ? boundary.x2 : boundary.right);
    const y2 = finite(boundary.y2 != null ? boundary.y2 : boundary.bottom);
    if (x1 != null && y1 != null && x2 != null && y2 != null) return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    const x = finite(boundary.x);
    const y = finite(boundary.y);
    if (x != null && y != null) return { x, y };
  }
  return null;
}

function spawnCenter(entry) {
  if (!entry || typeof entry === 'string') return null;
  if (Array.isArray(entry)) {
    if (entry.length >= 5 && typeof entry[0] === 'string') return boundaryCenter(entry.slice(1));
    return boundaryCenter(entry);
  }
  if (typeof entry !== 'object') return null;
  const direct = boundaryCenter(entry.boundary || entry.bound || entry.bounds || entry.area);
  if (direct) return direct;
  const x = finite(entry.x);
  const y = finite(entry.y);
  if (x != null && y != null) return { x, y };
  return null;
}

function contentDisposition(world, mtype) {
  if (!world || typeof world.fact !== 'function' || !mtype) return null;
  try {
    return world.fact('monster-policy', String(mtype), 'contentSafetyDisposition').value || null;
  } catch (_) {
    return null;
  }
}

function isApprovedDisposition(value) {
  return value === 'APPROVED' || value === 'LEGACY_ALLOWED';
}

class LocalFarmPlanner {
  constructor(options = {}) {
    this.log = options.log || null;
    this.minExpectedImprovement = Math.max(0.05, Math.min(1, Number(options.minExpectedImprovement) || 0.2));
    this.maxCandidates = Math.max(5, Math.min(100, Number(options.maxCandidates) || 40));
  }

  spawnCandidates(snapshot, gameData, world, party) {
    if (!snapshot || !snapshot.character) return [];
    const mapName = snapshot.character.map;
    const mapData = gameData && gameData.maps && gameData.maps[mapName];
    const raw = mapData && mapData.monsters;
    if (!raw) return [];
    const entries = Array.isArray(raw) ? raw : Object.values(raw);
    const monsterData = gameData && gameData.monsters || {};
    const fingerprint = party && party.fingerprint || null;
    const rows = [];

    for (let index = 0; index < entries.length && rows.length < this.maxCandidates; index += 1) {
      const entry = entries[index];
      const mtype = spawnType(entry);
      const center = spawnCenter(entry);
      if (!mtype || !center) continue;
      const disposition = contentDisposition(world, mtype);
      if (!isApprovedDisposition(disposition)) continue;
      const learned = world && typeof world.performanceFor === 'function'
        ? world.performanceFor(mtype, fingerprint)
        : null;
      const metadata = monsterData[mtype] || {};
      const travel = distance(snapshot.character, center);
      const speed = Math.max(1, Number(snapshot.character.speed) || 40);
      rows.push({
        id: `${mapName}:${mtype}:${index}`,
        monster: String(mtype),
        map: mapName,
        x: center.x,
        y: center.y,
        spawnIndex: index,
        contentDisposition: disposition,
        xpPerHour: learned ? learned.xpPerHour : Math.max(0, Number(metadata.xp) || 0) * 60,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.1,
        travelSeconds: Number.isFinite(travel) ? travel / speed : 120,
        source: learned ? 'measured-spawn' : 'known-spawn-metadata'
      });
    }
    return rows;
  }

  rank(snapshot, gameData, world, party, farmPlanner) {
    const candidates = this.spawnCandidates(snapshot, gameData, world, party);
    if (!candidates.length) return [];
    const ranked = farmPlanner && typeof farmPlanner.rank === 'function'
      ? farmPlanner.rank(candidates, {
          character: snapshot.character && snapshot.character.name || null,
          partyFingerprint: party && party.fingerprint || null
        })
      : candidates.slice();
    return ranked;
  }

  materiallyBetter(current, candidate) {
    if (!current || !candidate) return true;
    const currentScore = Math.max(0, Number(current.score) || 0);
    const nextScore = Math.max(0, Number(candidate.score) || 0);
    if (currentScore <= 0) return nextScore > 0;
    return nextScore >= currentScore * (1 + this.minExpectedImprovement);
  }
}

module.exports = {
  LocalFarmPlanner,
  spawnType,
  spawnCenter,
  contentDisposition,
  isApprovedDisposition
};

},
"src/autonomy/local-farm-orchestrator.js": function(require,module,exports){
'use strict';

const { LocalFarmPlanner } = require('./local-farm-planner');

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratio(value, max) {
  const denominator = Number(max) || 0;
  if (denominator <= 0) return 1;
  return Math.max(0, Math.min(1, (Number(value) || 0) / denominator));
}

function distance(a, b) {
  const ax = a && finite(a.x);
  const ay = a && finite(a.y);
  const bx = b && finite(b.x);
  const by = b && finite(b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

class LocalFarmOrchestrator {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.planner = options.planner || new LocalFarmPlanner({ log: this.log });
    this.enabled = options.enabled !== false;
    this.config = {
      minHoldMs: Math.max(5000, Number(options.minHoldMs) || 20000),
      planLeaseMs: Math.max(30000, Number(options.planLeaseMs) || 120000),
      noProgressMs: Math.max(5000, Number(options.noProgressMs) || 15000),
      replanCooldownMs: Math.max(2000, Number(options.replanCooldownMs) || 10000),
      arrivalRadius: Math.max(40, Number(options.arrivalRadius) || 100),
      stepSeconds: Math.max(0.5, Math.min(4, Number(options.stepSeconds) || 2.5)),
      minStep: Math.max(20, Number(options.minStep) || 50),
      maxStep: Math.max(60, Number(options.maxStep) || 120),
      moveCooldownMs: Math.max(500, Number(options.moveCooldownMs) || 1200),
      maxPlanFailures: Math.max(1, Math.min(5, Number(options.maxPlanFailures) || 3)),
      engageHpRatio: Math.max(0.45, Math.min(0.95, Number(options.engageHpRatio) || 0.7))
    };
    this.currentPlan = null;
    this.lastPlan = null;
    this.lastMove = null;
    this.lastAbort = null;
    this.lastDecision = null;
    this.lastActionAt = -Infinity;
    this.cooldownUntil = 0;
    this.planSeq = 0;
    this.stats = {
      plansCreated: 0,
      plansCompleted: 0,
      plansAborted: 0,
      movesRequested: 0,
      shadowMoves: 0,
      noProgressAborts: 0,
      leaseAborts: 0,
      circuitWaits: 0,
      visibleMonsterYields: 0
    };
  }

  _event(event, severity, reason, data = {}) {
    if (!this.log) return;
    this.log.emit({
      component: 'local-farming',
      event,
      severity: severity || 'info',
      reason: reason || null,
      data: {
        planId: this.currentPlan && this.currentPlan.id || null,
        monster: this.currentPlan && this.currentPlan.monster || null,
        ...data
      }
    });
  }

  _visibleMonsters(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c) return [];
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
      if (entity.map && c.map && entity.map !== c.map) return false;
      return true;
    });
  }

  _selfAggro(snapshot) {
    const name = snapshot && snapshot.character && snapshot.character.name;
    if (!name) return [];
    return (snapshot.entities || []).filter((entity) => entity && entity.mtype && !entity.dead && entity.target === name);
  }

  _canReposition(runtime, snapshot, visibleMonsters) {
    if (!this.enabled) return { allowed: false, reason: 'LOCAL_FARMING_DISABLED' };
    if (!snapshot || !snapshot.character) return { allowed: false, reason: 'SNAPSHOT_UNAVAILABLE' };
    const c = snapshot.character;
    if (c.rip) return { allowed: false, reason: 'CHARACTER_DEAD' };
    if (ratio(c.hp, c.max_hp) < this.config.engageHpRatio) return { allowed: false, reason: 'HP_RECOVERY_REQUIRED' };
    if (this._selfAggro(snapshot).length) return { allowed: false, reason: 'SELF_AGGRO_PRESENT' };
    if (visibleMonsters && visibleMonsters.length) return { allowed: false, reason: 'VISIBLE_MONSTER_PRESENT' };
    const farmer = runtime && runtime.farmer;
    if (farmer && farmer.targetId) return { allowed: false, reason: 'FARMER_TARGET_ACTIVE' };
    if (farmer && ['ENGAGE', 'TRAVEL', 'RECOVER'].includes(farmer.state)) return { allowed: false, reason: `FARMER_${farmer.state}` };
    const adapter = runtime && runtime.adapter;
    if (adapter && typeof adapter.stabilityStatus === 'function') {
      const movement = adapter.stabilityStatus().movement || {};
      if (movement.circuitOpen) return { allowed: false, reason: 'MOVEMENT_CIRCUIT_OPEN', movement };
      if (movement.pendingOutcomeId) return { allowed: false, reason: 'MOVE_OUTCOME_PENDING', movement };
    }
    return { allowed: true, reason: 'LOCAL_REPOSITION_ALLOWED' };
  }

  _makePlan(candidate, now) {
    const plan = {
      id: `local-farm-${now}-${++this.planSeq}`,
      monster: candidate.monster,
      map: candidate.map,
      x: candidate.x,
      y: candidate.y,
      spawnIndex: candidate.spawnIndex,
      source: candidate.source,
      contentDisposition: candidate.contentDisposition,
      score: Number(candidate.score) || 0,
      createdAt: now,
      holdUntil: now + this.config.minHoldMs,
      leaseUntil: now + this.config.planLeaseMs,
      lastProgressAt: now,
      lastDistance: null,
      bestDistance: null,
      moveAttempts: 0,
      failures: 0,
      state: 'TRAVELLING'
    };
    this.stats.plansCreated += 1;
    this.currentPlan = plan;
    this.lastPlan = { ...plan };
    this._event('LOCAL_FARM_PLAN_CREATED', 'info', 'KNOWN_SPAWN_SELECTED', {
      map: plan.map,
      x: Math.round(plan.x),
      y: Math.round(plan.y),
      score: Number(plan.score.toFixed(5)),
      leaseUntil: plan.leaseUntil,
      holdUntil: plan.holdUntil,
      contentDisposition: plan.contentDisposition
    });
    return plan;
  }

  _abort(reason, now, data = {}) {
    if (!this.currentPlan) return false;
    const aborted = { ...this.currentPlan, abortedAt: now, abortReason: reason };
    this.lastAbort = aborted;
    this.lastPlan = aborted;
    this.currentPlan = null;
    this.cooldownUntil = now + this.config.replanCooldownMs;
    this.stats.plansAborted += 1;
    if (reason === 'NO_PROGRESS') this.stats.noProgressAborts += 1;
    if (reason === 'PLAN_LEASE_EXPIRED') this.stats.leaseAborts += 1;
    this._event('LOCAL_FARM_PLAN_ABORTED', 'warn', reason, data);
    return true;
  }

  _complete(reason, now, data = {}) {
    if (!this.currentPlan) return false;
    const completed = { ...this.currentPlan, completedAt: now, completionReason: reason, state: 'HOLDING' };
    this.lastPlan = completed;
    this.currentPlan = completed;
    this.stats.plansCompleted += 1;
    this._event('LOCAL_FARM_PLAN_REACHED', 'info', reason, data);
    return true;
  }

  _choosePlan(runtime, snapshot, gameData, world, party, now) {
    if (this.currentPlan && this.currentPlan.map !== snapshot.character.map) {
      this._abort('MAP_CHANGED', now, { map: snapshot.character.map });
      return null;
    }
    if (this.currentPlan && now >= this.currentPlan.leaseUntil) {
      this._abort('PLAN_LEASE_EXPIRED', now);
      return null;
    }

    const ranked = this.planner.rank(snapshot, gameData, world, party, runtime && runtime.planner);
    if (!ranked.length) {
      if (this.currentPlan) this._abort('PLAN_NO_LONGER_ELIGIBLE', now);
      return null;
    }

    const top = ranked[0];
    if (!this.currentPlan) return this._makePlan(top, now);
    if (now < this.currentPlan.holdUntil) return this.currentPlan;
    const currentRank = ranked.find((row) => row.monster === this.currentPlan.monster && row.spawnIndex === this.currentPlan.spawnIndex);
    if (!currentRank) {
      this._abort('PLAN_NO_LONGER_ELIGIBLE', now);
      return null;
    }
    if (this.planner.materiallyBetter(currentRank, top)) {
      const previous = this.currentPlan;
      this.currentPlan = null;
      const next = this._makePlan(top, now);
      this._event('LOCAL_FARM_PLAN_SWITCHED', 'info', 'MATERIAL_IMPROVEMENT', {
        previousPlanId: previous.id,
        previousMonster: previous.monster,
        previousScore: Number(previous.score || 0),
        nextScore: Number(next.score || 0)
      });
      return next;
    }
    return this.currentPlan;
  }

  _updateProgress(plan, snapshot, now) {
    const d = distance(snapshot.character, plan);
    if (!Number.isFinite(d)) return { distance: Infinity, progressed: false };
    const previous = plan.lastDistance;
    const best = plan.bestDistance;
    const progressed = best == null || d <= best - 8;
    plan.lastDistance = d;
    if (best == null || d < best) plan.bestDistance = d;
    if (progressed) plan.lastProgressAt = now;
    if (previous == null) plan.lastProgressAt = now;
    return { distance: d, progressed };
  }

  _boundedDestination(character, plan) {
    const cx = finite(character.x);
    const cy = finite(character.y);
    if (cx == null || cy == null) return null;
    const dx = Number(plan.x) - cx;
    const dy = Number(plan.y) - cy;
    const len = Math.hypot(dx, dy);
    if (!Number.isFinite(len) || len <= 0) return { x: cx, y: cy, step: 0 };
    const speed = Math.max(1, Number(character.speed) || 40);
    const desired = speed * this.config.stepSeconds;
    const step = Math.min(len, Math.max(this.config.minStep, Math.min(this.config.maxStep, desired)));
    return {
      x: cx + (dx / len) * step,
      y: cy + (dy / len) * step,
      step
    };
  }

  tick(context = {}) {
    const runtime = context.runtime;
    const snapshot = context.snapshot;
    const world = context.world;
    const party = context.party;
    const gameData = context.gameData || runtime && runtime.adapter && runtime.adapter.getGameData && runtime.adapter.getGameData() || {};
    const now = this.now();
    const visibleMonsters = this._visibleMonsters(snapshot);

    if (visibleMonsters.length) {
      this.stats.visibleMonsterYields += 1;
      this.lastDecision = { at: now, action: 'YIELD', reason: 'VISIBLE_MONSTER_PRESENT', visibleCount: visibleMonsters.length };
      return this.lastDecision;
    }

    const gate = this._canReposition(runtime, snapshot, visibleMonsters);
    if (!gate.allowed) {
      if (gate.reason === 'MOVEMENT_CIRCUIT_OPEN') this.stats.circuitWaits += 1;
      this.lastDecision = { at: now, action: 'WAIT', reason: gate.reason };
      return this.lastDecision;
    }

    if (now < this.cooldownUntil) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'REPLAN_COOLDOWN', cooldownUntil: this.cooldownUntil };
      return this.lastDecision;
    }

    const plan = this._choosePlan(runtime, snapshot, gameData, world, party, now);
    if (!plan) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'NO_APPROVED_LOCAL_SPAWN' };
      return this.lastDecision;
    }

    const progress = this._updateProgress(plan, snapshot, now);
    if (progress.distance <= this.config.arrivalRadius) {
      if (plan.state !== 'HOLDING') this._complete('SPAWN_RADIUS_REACHED', now, { distance: Math.round(progress.distance) });
      this.lastDecision = { at: now, action: 'HOLD', reason: 'SPAWN_RADIUS_REACHED', distance: progress.distance, planId: plan.id };
      return this.lastDecision;
    }

    if (runtime && runtime.adapter && runtime.adapter.mode !== 'shadow' && now - plan.lastProgressAt >= this.config.noProgressMs && plan.moveAttempts > 0) {
      this._abort('NO_PROGRESS', now, { distance: Math.round(progress.distance), moveAttempts: plan.moveAttempts });
      this.lastDecision = { at: now, action: 'ABORT', reason: 'NO_PROGRESS' };
      return this.lastDecision;
    }

    if (now - this.lastActionAt < this.config.moveCooldownMs) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'MOVE_COOLDOWN', planId: plan.id };
      return this.lastDecision;
    }

    const destination = this._boundedDestination(snapshot.character, plan);
    if (!destination) {
      plan.failures += 1;
      if (plan.failures >= this.config.maxPlanFailures) this._abort('POSITION_UNAVAILABLE', now);
      this.lastDecision = { at: now, action: 'WAIT', reason: 'POSITION_UNAVAILABLE', failures: plan.failures };
      return this.lastDecision;
    }

    const adapter = runtime && runtime.adapter;
    if (!adapter || typeof adapter.command !== 'function') {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'ADAPTER_UNAVAILABLE' };
      return this.lastDecision;
    }

    const result = adapter.command('move', [destination.x, destination.y]);
    this.lastActionAt = now;
    plan.moveAttempts += 1;
    if (result.shadow) this.stats.shadowMoves += 1;
    if (result.executed) this.stats.movesRequested += 1;
    if (!result.executed && !result.shadow && !result.coalesced) plan.failures += 1;
    if (plan.failures >= this.config.maxPlanFailures) this._abort('MOVE_FAILURE_BUDGET_EXHAUSTED', now, { failures: plan.failures, reason: result.reason || null });

    this.lastMove = {
      at: now,
      planId: plan.id,
      monster: plan.monster,
      x: destination.x,
      y: destination.y,
      step: destination.step,
      result: {
        executed: !!result.executed,
        shadow: !!result.shadow,
        coalesced: !!result.coalesced,
        reason: result.reason || null,
        outcomeId: result.outcomeId || null,
        outcomeState: result.outcomeState || null
      }
    };
    this._event('LOCAL_FARM_MOVE_REQUESTED', 'info', result.shadow ? 'SHADOW_LOCAL_REPOSITION' : 'LOCAL_REPOSITION', {
      x: Math.round(destination.x),
      y: Math.round(destination.y),
      step: Math.round(destination.step),
      distance: Math.round(progress.distance),
      moveAttempts: plan.moveAttempts,
      result: this.lastMove.result
    });
    this.lastDecision = {
      at: now,
      action: result.shadow ? 'SHADOW_MOVE' : (result.executed ? 'MOVE' : 'WAIT'),
      reason: result.reason || (result.shadow ? 'SHADOW' : 'MOVE_REQUESTED'),
      planId: plan.id,
      distance: progress.distance
    };
    return this.lastDecision;
  }

  status() {
    return {
      enabled: this.enabled,
      scope: 'same-map-known-approved-spawns-only',
      navigation: 'bounded-local-move-only',
      smartMoveAllowed: false,
      mapChangeAllowed: false,
      config: { ...this.config },
      currentPlan: this.currentPlan ? { ...this.currentPlan } : null,
      lastPlan: this.lastPlan ? { ...this.lastPlan } : null,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      lastAbort: this.lastAbort ? { ...this.lastAbort } : null,
      lastDecision: this.lastDecision ? { ...this.lastDecision } : null,
      cooldownUntil: this.cooldownUntil,
      stats: { ...this.stats }
    };
  }
}

module.exports = { LocalFarmOrchestrator };

},
"src/autonomy/alpha10-runtime.js": function(require,module,exports){
'use strict';

const { Alpha9Runtime } = require('./alpha9-runtime');
const { ShadowStrategicBrain } = require('../brain/shadow-brain');

class Alpha10Runtime extends Alpha9Runtime {
  constructor(options = {}) {
    super(options);
    this.brain = options.brain || new ShadowStrategicBrain({
      now: this.now,
      log: this.log,
      replayCapacity: options.brainReplayCapacity,
      learningRate: options.brainLearningRate,
      maxAbsWeight: options.brainMaxAbsWeight,
      qualityWindow: options.brainQualityWindow,
      minQualitySamples: options.brainMinQualitySamples,
      healthyAgreement: options.brainHealthyAgreement,
      watchAgreement: options.brainWatchAgreement,
      maxDeathsPerHour: options.brainMaxDeathsPerHour,
      maxTravelSeconds: options.brainMaxTravelSeconds
    });
    this.brainAuditMs = Math.max(1000, Math.min(60000, Number(options.brainAuditMs) || 5000));
    this.lastBrainAudit = -Infinity;
  }

  _brainAudit() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return null;
    const party = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const candidates = this.localFarmPlanner.spawnCandidates(snapshot, gameData, this.world, party);
    const teacherRanking = candidates.length
      ? this.planner.rank(candidates, {
          character: snapshot.character.name || null,
          partyFingerprint: party.fingerprint || null
        })
      : [];
    const localStatus = this.localFarming && typeof this.localFarming.status === 'function'
      ? this.localFarming.status()
      : null;
    return this.brain.observe({
      snapshot,
      party,
      candidates,
      teacherRanking,
      currentPlan: localStatus && localStatus.currentPlan || null
    });
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastBrainAudit < this.brainAuditMs) return;
    this.lastBrainAudit = now;
    this._brainAudit();
  }

  status() {
    return {
      ...super.status(),
      brain: this.brain.status()
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.brain = {
      status: this.brain.status(),
      replay: this.brain.replay(32)
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha10Runtime };

},
"src/brain/shadow-brain.js": function(require,module,exports){
'use strict';

const { FEATURE_NAMES, StrategicFeatureEncoder } = require('./feature-encoder');
const { BoundedReplayBuffer } = require('./replay-buffer');

const BrainQualityState = Object.freeze({
  WARMUP: 'WARMUP',
  HEALTHY: 'HEALTHY',
  WATCH: 'WATCH',
  QUARANTINED: 'QUARANTINED'
});

const DEFAULT_WEIGHTS = Object.freeze({
  xpRate: 0.55,
  goldRate: 0.22,
  survival: 0.35,
  confidence: 0.18,
  travelEfficiency: 0.12,
  measuredEvidence: 0.08,
  hpReserve: 0.03,
  mpReserve: 0.02,
  currentPlanAffinity: 0.06
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bounded(value, limit) {
  return Math.max(-limit, Math.min(limit, finite(value, 0)));
}

class ShadowStrategicBrain {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.encoder = options.encoder || new StrategicFeatureEncoder(options);
    this.replayBuffer = options.replayBuffer || new BoundedReplayBuffer({ capacity: options.replayCapacity });
    this.learningRate = Math.max(0.001, Math.min(0.1, finite(options.learningRate, 0.02)));
    this.maxAbsWeight = Math.max(0.25, Math.min(5, finite(options.maxAbsWeight, 2)));
    this.qualityWindow = Math.max(8, Math.min(256, Number(options.qualityWindow) || 64));
    this.minQualitySamples = Math.max(4, Math.min(this.qualityWindow, Number(options.minQualitySamples) || 16));
    this.healthyAgreement = Math.max(0.5, Math.min(0.95, finite(options.healthyAgreement, 0.7)));
    this.watchAgreement = Math.max(0.1, Math.min(this.healthyAgreement, finite(options.watchAgreement, 0.4)));
    this.weights = {};
    const supplied = options.initialWeights || {};
    for (const name of FEATURE_NAMES) {
      const initial = supplied[name] == null ? DEFAULT_WEIGHTS[name] : supplied[name];
      this.weights[name] = bounded(initial, this.maxAbsWeight);
    }
    this.qualityHistory = [];
    this.qualityState = BrainQualityState.WARMUP;
    this.lastRecommendation = null;
    this.lastQualityTransition = null;
    this.stats = {
      evaluations: 0,
      noCandidates: 0,
      teacherSamples: 0,
      agreements: 0,
      distillations: 0,
      qualityTransitions: 0
    };
  }

  _score(row) {
    let score = 0;
    for (const name of FEATURE_NAMES) score += finite(row.features[name], 0) * finite(this.weights[name], 0);
    return finite(score, 0);
  }

  _quality() {
    const samples = this.qualityHistory.length;
    const agreements = this.qualityHistory.reduce((sum, value) => sum + (value ? 1 : 0), 0);
    return {
      state: this.qualityState,
      samples,
      agreements,
      agreementRate: samples ? agreements / samples : null,
      window: this.qualityWindow,
      minSamples: this.minQualitySamples,
      healthyAgreement: this.healthyAgreement,
      watchAgreement: this.watchAgreement
    };
  }

  _updateQuality(agreement) {
    this.qualityHistory.push(!!agreement);
    while (this.qualityHistory.length > this.qualityWindow) this.qualityHistory.shift();
    const before = this.qualityState;
    const quality = this._quality();
    if (quality.samples < this.minQualitySamples) this.qualityState = BrainQualityState.WARMUP;
    else if (quality.agreementRate >= this.healthyAgreement) this.qualityState = BrainQualityState.HEALTHY;
    else if (quality.agreementRate >= this.watchAgreement) this.qualityState = BrainQualityState.WATCH;
    else this.qualityState = BrainQualityState.QUARANTINED;
    if (before !== this.qualityState) {
      this.stats.qualityTransitions += 1;
      this.lastQualityTransition = { at: this.now(), from: before, to: this.qualityState, agreementRate: this._quality().agreementRate };
      if (this.log) this.log.emit({ component: 'brain', event: 'BRAIN_QUALITY_CHANGED', severity: this.qualityState === BrainQualityState.QUARANTINED ? 'warn' : 'info', data: this.lastQualityTransition });
    }
  }

  _distill(studentRow, teacherRow) {
    if (!studentRow || !teacherRow || studentRow.id === teacherRow.id) return false;
    for (const name of FEATURE_NAMES) {
      const delta = finite(teacherRow.features[name], 0) - finite(studentRow.features[name], 0);
      this.weights[name] = bounded(this.weights[name] + this.learningRate * delta, this.maxAbsWeight);
    }
    this.stats.distillations += 1;
    return true;
  }

  observe(context = {}) {
    this.stats.evaluations += 1;
    const encoded = this.encoder.encodeCandidates(context);
    if (!encoded.length) {
      this.stats.noCandidates += 1;
      this.lastRecommendation = {
        at: this.now(),
        mode: 'shadow',
        actionAuthority: false,
        reason: 'NO_ELIGIBLE_CANDIDATES',
        candidateCount: 0,
        recommendation: null,
        teacher: null,
        agreement: null
      };
      return this.lastRecommendation;
    }

    const ranked = encoded.map((row) => ({ ...row, score: this._score(row) }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
    const student = ranked[0];
    const teacherTop = Array.isArray(context.teacherRanking) && context.teacherRanking[0] || null;
    const teacherId = teacherTop && teacherTop.id != null ? String(teacherTop.id) : null;
    const teacherRow = teacherId ? encoded.find((row) => row.id === teacherId) || null : null;
    const agreement = teacherRow ? student.id === teacherRow.id : null;

    if (teacherRow) {
      this.stats.teacherSamples += 1;
      if (agreement) this.stats.agreements += 1;
      this._updateQuality(agreement);
      if (!agreement) this._distill(student, teacherRow);
    }

    const record = {
      at: this.now(),
      mode: 'shadow',
      actionAuthority: false,
      featureSchemaVersion: this.encoder.status().schemaVersion,
      candidateCount: ranked.length,
      recommendation: { id: student.id, monster: student.monster, map: student.map, score: Number(student.score.toFixed(6)) },
      teacher: teacherRow ? { id: teacherRow.id, monster: teacherRow.monster, map: teacherRow.map } : null,
      agreement,
      quality: this._quality(),
      top: ranked.slice(0, 5).map((row) => ({ id: row.id, monster: row.monster, score: Number(row.score.toFixed(6)) }))
    };
    this.replayBuffer.push(record);
    this.lastRecommendation = record;
    if (this.log) this.log.emit({
      component: 'brain',
      event: 'BRAIN_SHADOW_RECOMMENDATION',
      data: {
        candidateCount: record.candidateCount,
        recommendation: record.recommendation,
        teacher: record.teacher,
        agreement: record.agreement,
        qualityState: record.quality.state
      }
    });
    return record;
  }

  replay(limit = 32) {
    return this.replayBuffer.list(limit);
  }

  status() {
    return {
      mode: 'shadow',
      actionAuthority: false,
      directActionAccess: false,
      executorBypassAllowed: false,
      learning: 'bounded-teacher-distillation',
      encoder: this.encoder.status(),
      replay: this.replayBuffer.status(),
      quality: this._quality(),
      learningRate: this.learningRate,
      maxAbsWeight: this.maxAbsWeight,
      weights: { ...this.weights },
      stats: { ...this.stats },
      lastRecommendation: this.lastRecommendation,
      lastQualityTransition: this.lastQualityTransition
    };
  }
}

module.exports = {
  ShadowStrategicBrain,
  BrainQualityState,
  DEFAULT_WEIGHTS
};

},
"src/brain/feature-encoder.js": function(require,module,exports){
'use strict';

const FEATURE_SCHEMA_VERSION = 1;
const FEATURE_NAMES = Object.freeze([
  'xpRate',
  'goldRate',
  'survival',
  'confidence',
  'travelEfficiency',
  'measuredEvidence',
  'hpReserve',
  'mpReserve',
  'currentPlanAffinity'
]);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finite(value, 0)));
}

function ratio(value, max) {
  const denominator = finite(max, 0);
  if (denominator <= 0) return 0;
  return clamp01(finite(value, 0) / denominator);
}

function candidateId(candidate) {
  if (!candidate) return null;
  if (candidate.id != null && String(candidate.id)) return String(candidate.id);
  if (candidate.monster != null && String(candidate.monster)) return String(candidate.monster);
  return null;
}

class StrategicFeatureEncoder {
  constructor(options = {}) {
    this.maxDeathsPerHour = Math.max(0.01, Math.min(10, finite(options.maxDeathsPerHour, 0.25)));
    this.maxTravelSeconds = Math.max(30, Math.min(3600, finite(options.maxTravelSeconds, 600)));
  }

  encodeCandidates(context = {}) {
    const snapshot = context.snapshot || {};
    const character = snapshot.character || {};
    const candidates = Array.isArray(context.candidates) ? context.candidates.filter(Boolean) : [];
    const currentPlan = context.currentPlan || null;
    const usable = candidates.filter((candidate) => candidateId(candidate));
    if (!usable.length) return [];

    const maxXp = Math.max(1, ...usable.map((candidate) => Math.max(0, finite(candidate.xpPerHour, 0))));
    const maxGold = Math.max(1, ...usable.map((candidate) => Math.max(0, finite(candidate.goldPerHour, 0))));
    const hpReserve = ratio(character.hp, character.max_hp);
    const mpReserve = ratio(character.mp, character.max_mp);

    return usable.map((candidate) => {
      const id = candidateId(candidate);
      const deaths = Math.max(0, finite(candidate.deathsPerHour, 0));
      const travel = Math.max(0, finite(candidate.travelSeconds, this.maxTravelSeconds));
      const source = String(candidate.source || '');
      const planMatches = !!currentPlan && (
        (currentPlan.id != null && String(currentPlan.id) === id) ||
        (currentPlan.monster != null && candidate.monster != null && String(currentPlan.monster) === String(candidate.monster))
      );
      const features = {
        xpRate: clamp01(Math.max(0, finite(candidate.xpPerHour, 0)) / maxXp),
        goldRate: clamp01(Math.max(0, finite(candidate.goldPerHour, 0)) / maxGold),
        survival: clamp01(1 - deaths / this.maxDeathsPerHour),
        confidence: clamp01(candidate.confidence == null ? 0 : candidate.confidence),
        travelEfficiency: clamp01(1 - travel / this.maxTravelSeconds),
        measuredEvidence: source.startsWith('measured') ? 1 : 0,
        hpReserve,
        mpReserve,
        currentPlanAffinity: planMatches ? 1 : 0
      };
      return {
        id,
        monster: candidate.monster != null ? String(candidate.monster) : null,
        map: candidate.map != null ? String(candidate.map) : null,
        schemaVersion: FEATURE_SCHEMA_VERSION,
        features,
        vector: FEATURE_NAMES.map((name) => features[name])
      };
    });
  }

  status() {
    return {
      schemaVersion: FEATURE_SCHEMA_VERSION,
      featureNames: FEATURE_NAMES.slice(),
      maxDeathsPerHour: this.maxDeathsPerHour,
      maxTravelSeconds: this.maxTravelSeconds
    };
  }
}

module.exports = {
  FEATURE_SCHEMA_VERSION,
  FEATURE_NAMES,
  StrategicFeatureEncoder,
  candidateId,
  clamp01
};

},
"src/brain/replay-buffer.js": function(require,module,exports){
'use strict';

function safeClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

class BoundedReplayBuffer {
  constructor(options = {}) {
    this.capacity = Math.max(32, Math.min(4096, Number(options.capacity) || 256));
    this.records = [];
    this.dropped = 0;
    this.rejected = 0;
  }

  push(record) {
    const cloned = safeClone(record);
    if (!cloned) {
      this.rejected += 1;
      return false;
    }
    this.records.push(cloned);
    while (this.records.length > this.capacity) {
      this.records.shift();
      this.dropped += 1;
    }
    return true;
  }

  list(limit = this.capacity) {
    const count = Math.max(0, Math.min(this.capacity, Number(limit) || 0));
    return this.records.slice(Math.max(0, this.records.length - count)).map((row) => safeClone(row));
  }

  status() {
    return {
      capacity: this.capacity,
      size: this.records.length,
      dropped: this.dropped,
      rejected: this.rejected
    };
  }
}

module.exports = { BoundedReplayBuffer };

},
"src/autonomy/alpha11-runtime.js": function(require,module,exports){
'use strict';

const { Alpha10Runtime } = require('./alpha10-runtime');
const { CharacterRegistry } = require('../party/character-registry');

class Alpha11Runtime extends Alpha10Runtime {
  constructor(options = {}) {
    super(options);
    this.characterRegistry = options.characterRegistry || new CharacterRegistry({
      now: this.now,
      log: this.log,
      capacity: options.characterRegistryCapacity,
      staleAfterMs: options.characterRegistryStaleAfterMs,
      maxInventoryItems: options.characterRegistryMaxInventoryItems,
      roster: options.characterRoster
    });
    this.partyObservationMs = Math.max(500, Math.min(60000, Number(options.partyObservationMs) || 1000));
    this.lastPartyObservation = -Infinity;
  }

  _partyObservation() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return null;
    return this.characterRegistry.observe({
      snapshot,
      gameData: this.adapter.getGameData() || {},
      liveCharacter: this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null
    });
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastPartyObservation < this.partyObservationMs) return;
    this.lastPartyObservation = now;
    this._partyObservation();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      party: {
        ...(base.party || {}),
        observationIntervalMs: this.partyObservationMs,
        registry: this.characterRegistry.status()
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.party = {
      observationIntervalMs: this.partyObservationMs,
      registry: this.characterRegistry.status()
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha11Runtime };

},
"src/party/character-registry.js": function(require,module,exports){
'use strict';

const REGISTRY_SCHEMA_VERSION = 1;
const REGISTRY_MODE = 'observation-only';
const SOURCE_CONFIDENCE = Object.freeze({ configured: 0.35, party: 0.75, visible: 0.9, self: 1 });
const SOURCE_RANK = Object.freeze({ configured: 1, party: 2, visible: 3, self: 4 });
const STAT_KEYS = Object.freeze([
  'attack', 'armor', 'resistance', 'range', 'speed', 'frequency',
  'evasion', 'reflection', 'crit', 'critdamage', 'lifesteal', 'manasteal',
  'dreturn', 'courage', 'mcourage'
]);

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp01(value) {
  const number = finite(value);
  if (number == null) return 0;
  return Math.max(0, Math.min(1, number));
}

function normalizeName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function normalizeClass(value) {
  const ctype = String(value == null ? '' : value).trim().toLowerCase();
  return ctype || null;
}

function cloneJson(value, fallback) {
  if (value == null) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function normalizeEquipment(equipment, maxSlots = 32) {
  if (!equipment || typeof equipment !== 'object' || Array.isArray(equipment)) return {};
  const out = {};
  const keys = Object.keys(equipment).sort().slice(0, maxSlots);
  for (const slot of keys) {
    const item = equipment[slot];
    if (!item || typeof item !== 'object') continue;
    out[slot] = {
      name: item.name || null,
      level: Math.max(0, finite(item.level) == null ? 0 : finite(item.level)),
      locked: !!(item.locked || item.l),
      special: !!(item.special || item.p)
    };
  }
  return out;
}

function normalizeInventory(inventory, maxItems = 80) {
  if (!Array.isArray(inventory)) return [];
  const out = [];
  for (const item of inventory) {
    if (!item || typeof item !== 'object') continue;
    out.push({
      index: Number.isFinite(Number(item.index)) ? Number(item.index) : null,
      name: item.name || null,
      level: Math.max(0, finite(item.level) == null ? 0 : finite(item.level)),
      q: Math.max(1, finite(item.q) == null ? 1 : finite(item.q)),
      locked: !!(item.locked || item.l),
      special: !!(item.special || item.p)
    });
    if (out.length >= maxItems) break;
  }
  return out;
}

function summarizeSupplies(inventory) {
  const byName = {};
  let hpPotions = 0;
  let mpPotions = 0;
  for (const item of inventory || []) {
    if (!item || !item.name) continue;
    const name = String(item.name).toLowerCase();
    const quantity = Math.max(1, finite(item.q) == null ? 1 : finite(item.q));
    if (/^hpot/.test(name)) hpPotions += quantity;
    if (/^mpot/.test(name)) mpPotions += quantity;
    if (/^(hpot|mpot)/.test(name)) byName[item.name] = (byName[item.name] || 0) + quantity;
  }
  return { hpPotions, mpPotions, byName };
}

function normalizeStats(stats, maxKeys = 64) {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return {};
  const out = {};
  for (const key of Object.keys(stats).sort().slice(0, maxKeys)) {
    const value = finite(stats[key]);
    if (value != null) out[key] = value;
  }
  return out;
}

function normalizeSupplies(supplies) {
  if (!supplies || typeof supplies !== 'object' || Array.isArray(supplies)) {
    return { hpPotions: 0, mpPotions: 0, byName: {} };
  }
  const byName = {};
  if (supplies.byName && typeof supplies.byName === 'object' && !Array.isArray(supplies.byName)) {
    for (const key of Object.keys(supplies.byName).sort().slice(0, 32)) {
      const value = finite(supplies.byName[key]);
      if (value != null && value >= 0) byName[key] = value;
    }
  }
  return {
    hpPotions: Math.max(0, finite(supplies.hpPotions) == null ? 0 : finite(supplies.hpPotions)),
    mpPotions: Math.max(0, finite(supplies.mpPotions) == null ? 0 : finite(supplies.mpPotions)),
    byName
  };
}

function extractStats(character) {
  const out = {};
  for (const key of STAT_KEYS) {
    const value = finite(character && character[key]);
    if (value != null) out[key] = value;
  }
  return out;
}

function levelUnlockedSkills(ctype, level, gameData, maxSkills = 128) {
  const resolvedClass = normalizeClass(ctype);
  const resolvedLevel = Math.max(0, finite(level) == null ? 0 : finite(level));
  const skills = gameData && gameData.skills;
  if (!resolvedClass || !skills || typeof skills !== 'object') return [];
  const out = [];
  for (const [name, skill] of Object.entries(skills)) {
    if (!skill || typeof skill !== 'object') continue;
    const classes = Array.isArray(skill.class) ? skill.class : skill.class ? [skill.class] : [];
    if (!classes.map((value) => String(value).toLowerCase()).includes(resolvedClass)) continue;
    const requiredLevel = skill.level == null ? 0 : finite(skill.level);
    if (requiredLevel == null || requiredLevel > resolvedLevel) continue;
    out.push(String(name));
    if (out.length >= maxSkills) break;
  }
  return out.sort();
}

function materialView(record) {
  return JSON.stringify({
    ctype: record.ctype,
    level: record.level,
    map: record.map,
    online: record.online,
    available: record.available,
    dead: record.dead
  });
}

class CharacterRegistry {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(4, Math.min(128, Number(options.capacity) || 32));
    this.staleAfterMs = Math.max(1000, Math.min(10 * 60 * 1000, Number(options.staleAfterMs) || 15000));
    this.maxInventoryItems = Math.max(8, Math.min(160, Number(options.maxInventoryItems) || 80));
    this.records = new Map();
    this.stats = { observations: 0, added: 0, materialUpdates: 0, rejected: 0, evicted: 0 };
    this.lastObservedAt = null;
    this.seedRoster(options.roster || []);
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'party-registry', event, severity, reason, data });
  }

  _sourceRank(source) {
    return SOURCE_RANK[source] || 0;
  }

  _makeRecord(name, at) {
    return {
      name,
      ctype: null,
      level: 0,
      map: null,
      x: null,
      y: null,
      online: null,
      available: null,
      dead: null,
      gear: {},
      stats: {},
      skillUnlocks: [],
      inventory: [],
      supplies: { hpPotions: 0, mpPotions: 0, byName: {} },
      primarySource: 'configured',
      primarySourceRank: 0,
      sources: [],
      stateConfidence: 0,
      firstObservedAt: at,
      lastSeenAt: null,
      lastUpdatedAt: at
    };
  }

  _evictFor(source, incomingName) {
    if (this.records.size < this.capacity) return true;
    const incomingRank = this._sourceRank(source);
    const candidates = [...this.records.values()]
      .filter((record) => record.name !== incomingName && record.primarySource !== 'self')
      .sort((a, b) => {
        if (a.primarySourceRank !== b.primarySourceRank) return a.primarySourceRank - b.primarySourceRank;
        return (a.lastUpdatedAt || 0) - (b.lastUpdatedAt || 0);
      });
    const victim = candidates[0];
    if (!victim || (victim.primarySourceRank > incomingRank && source !== 'self')) return false;
    this.records.delete(victim.name);
    this.stats.evicted += 1;
    this._event('CHARACTER_REGISTRY_MEMBER_EVICTED', { name: victim.name, source: victim.primarySource }, 'warn', 'REGISTRY_CAPACITY');
    return true;
  }

  _merge(observation, source, options = {}) {
    const name = normalizeName(observation && observation.name);
    if (!name) {
      this.stats.rejected += 1;
      return null;
    }
    const at = finite(options.at) == null ? this.now() : Number(options.at);
    let record = this.records.get(name);
    const isNew = !record;
    if (!record) {
      if (!this._evictFor(source, name)) {
        this.stats.rejected += 1;
        this._event('CHARACTER_REGISTRY_OBSERVATION_REJECTED', { name, source }, 'warn', 'REGISTRY_CAPACITY');
        return null;
      }
      record = this._makeRecord(name, at);
      this.records.set(name, record);
    }

    const before = materialView(record);
    const rank = this._sourceRank(source);
    const ctype = normalizeClass(observation.ctype || observation.type);
    const level = finite(observation.level);
    const x = finite(observation.x);
    const y = finite(observation.y);

    if (ctype) record.ctype = ctype;
    if (level != null) record.level = Math.max(0, level);
    if (observation.map != null) record.map = String(observation.map);
    if (x != null) record.x = x;
    if (y != null) record.y = y;
    if (typeof observation.online === 'boolean') record.online = observation.online;
    if (typeof observation.available === 'boolean') record.available = observation.available;
    if (typeof observation.dead === 'boolean') {
      record.dead = observation.dead;
      if (observation.online === true || options.live === true) record.available = !observation.dead;
    }

    if (observation.gear && typeof observation.gear === 'object') {
      record.gear = normalizeEquipment(observation.gear);
    }
    if (observation.stats && typeof observation.stats === 'object') {
      record.stats = { ...record.stats, ...normalizeStats(observation.stats) };
    }
    if (Array.isArray(observation.skillUnlocks)) {
      record.skillUnlocks = [...new Set(observation.skillUnlocks.map(String))].sort().slice(0, 128);
    }
    if (Array.isArray(observation.inventory)) {
      record.inventory = normalizeInventory(observation.inventory, this.maxInventoryItems);
      record.supplies = summarizeSupplies(record.inventory);
    }
    if (observation.supplies && typeof observation.supplies === 'object') {
      record.supplies = normalizeSupplies(observation.supplies);
    }

    if (!record.sources.includes(source)) record.sources.push(source);
    record.sources.sort((a, b) => this._sourceRank(b) - this._sourceRank(a));
    record.primarySource = source;
    record.primarySourceRank = rank;
    record.stateConfidence = clamp01(options.confidence == null ? SOURCE_CONFIDENCE[source] : options.confidence);
    if (options.live === true || observation.online === true) record.lastSeenAt = at;
    record.lastUpdatedAt = at;

    if (isNew) {
      this.stats.added += 1;
      this._event('CHARACTER_REGISTRY_MEMBER_ADDED', { name, ctype: record.ctype, source: record.primarySource });
    } else if (before !== materialView(record)) {
      this.stats.materialUpdates += 1;
      this._event('CHARACTER_REGISTRY_MEMBER_CHANGED', { name, ctype: record.ctype, level: record.level, map: record.map, source: record.primarySource });
    }
    return record;
  }

  seedRoster(roster) {
    if (!Array.isArray(roster)) return this.status();
    const at = this.now();
    for (const descriptor of roster) {
      const item = typeof descriptor === 'string' ? { name: descriptor } : descriptor;
      if (!item || typeof item !== 'object') continue;
      this._merge({
        name: item.name,
        ctype: item.ctype || item.type,
        level: item.level,
        map: item.map,
        online: typeof item.online === 'boolean' ? item.online : undefined,
        available: typeof item.available === 'boolean' ? item.available : undefined,
        gear: item.gear,
        stats: item.stats,
        skillUnlocks: item.skillUnlocks,
        inventory: item.inventory,
        supplies: item.supplies
      }, 'configured', { at, confidence: item.stateConfidence == null ? SOURCE_CONFIDENCE.configured : item.stateConfidence, live: item.online === true });
    }
    return this.status();
  }

  observe(context = {}) {
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return this.status();
    const at = finite(snapshot.observedAt) == null ? this.now() : Number(snapshot.observedAt);
    const gameData = context.gameData || {};
    const self = snapshot.character;
    const liveCharacter = context.liveCharacter && typeof context.liveCharacter === 'object' ? context.liveCharacter : null;
    const partyNames = new Set((snapshot.party || []).map((member) => normalizeName(member && member.name)).filter(Boolean));
    partyNames.add(normalizeName(self.name));

    for (const member of snapshot.party || []) {
      if (!member || !member.name || member.name === self.name) continue;
      this._merge({
        name: member.name,
        ctype: member.ctype || member.type,
        level: member.level,
        map: member.map,
        online: true,
        skillUnlocks: levelUnlockedSkills(member.ctype || member.type, member.level, gameData)
      }, 'party', { at, live: true });
    }

    for (const entity of snapshot.entities || []) {
      if (!entity || !entity.name) continue;
      const entityName = normalizeName(entity.name);
      const playerLike = !!entity.player || entity.type === 'character' || !!entity.ctype || partyNames.has(entityName);
      if (!playerLike || entityName === self.name) continue;
      this._merge({
        name: entityName,
        ctype: entity.ctype,
        level: entity.level,
        map: entity.map,
        x: entity.x,
        y: entity.y,
        online: true,
        dead: typeof entity.dead === 'boolean' ? entity.dead : undefined,
        stats: {
          hp: finite(entity.hp), max_hp: finite(entity.max_hp),
          mp: finite(entity.mp), max_mp: finite(entity.max_mp)
        },
        skillUnlocks: entity.ctype && finite(entity.level) != null ? levelUnlockedSkills(entity.ctype, entity.level, gameData) : null
      }, 'visible', { at, live: true });
    }

    const selfSource = liveCharacter ? { ...liveCharacter, ...self } : self;
    const rawInventory = Array.isArray(self.inventory)
      ? self.inventory
      : liveCharacter && Array.isArray(liveCharacter.items)
        ? liveCharacter.items.map((item, index) => item ? ({ index, ...item }) : null)
        : [];
    const inventory = normalizeInventory(rawInventory, this.maxInventoryItems);
    this._merge({
      name: self.name || (liveCharacter && liveCharacter.name),
      ctype: self.ctype || (liveCharacter && liveCharacter.ctype),
      level: self.level != null ? self.level : liveCharacter && liveCharacter.level,
      map: self.map || (liveCharacter && liveCharacter.map),
      x: self.x != null ? self.x : liveCharacter && (liveCharacter.real_x != null ? liveCharacter.real_x : liveCharacter.x),
      y: self.y != null ? self.y : liveCharacter && (liveCharacter.real_y != null ? liveCharacter.real_y : liveCharacter.y),
      online: true,
      available: !(self.rip || (liveCharacter && liveCharacter.rip)),
      dead: !!(self.rip || (liveCharacter && liveCharacter.rip)),
      gear: self.equipment || self.gear || (liveCharacter && liveCharacter.slots) || {},
      stats: {
        ...extractStats(selfSource),
        hp: finite(self.hp != null ? self.hp : liveCharacter && liveCharacter.hp),
        max_hp: finite(self.max_hp != null ? self.max_hp : liveCharacter && liveCharacter.max_hp),
        mp: finite(self.mp != null ? self.mp : liveCharacter && liveCharacter.mp),
        max_mp: finite(self.max_mp != null ? self.max_mp : liveCharacter && liveCharacter.max_mp)
      },
      skillUnlocks: levelUnlockedSkills(self.ctype || (liveCharacter && liveCharacter.ctype), self.level != null ? self.level : liveCharacter && liveCharacter.level, gameData),
      inventory,
      supplies: summarizeSupplies(inventory)
    }, 'self', { at, live: true, confidence: 1 });

    this.stats.observations += 1;
    this.lastObservedAt = at;
    return this.status();
  }

  _snapshotRecord(record, now) {
    const ageMs = record.lastSeenAt == null ? null : Math.max(0, now - record.lastSeenAt);
    const stale = ageMs != null && ageMs > this.staleAfterMs;
    let online = record.online;
    let available = record.available;
    let stateConfidence = record.stateConfidence;
    if (stale && record.primarySource !== 'configured') {
      online = null;
      available = null;
      stateConfidence *= 0.5;
    }
    const presence = stale ? 'STALE' : online === true ? 'ONLINE' : online === false ? 'OFFLINE' : 'UNKNOWN';
    const availability = available === true ? 'AVAILABLE' : available === false ? 'UNAVAILABLE' : 'UNKNOWN';
    return {
      name: record.name,
      ctype: record.ctype,
      level: record.level,
      map: record.map,
      x: record.x,
      y: record.y,
      online,
      presence,
      available,
      availability,
      dead: record.dead,
      gear: cloneJson(record.gear, {}),
      stats: cloneJson(record.stats, {}),
      skillUnlocks: record.skillUnlocks.slice(),
      inventory: cloneJson(record.inventory, []),
      supplies: cloneJson(record.supplies, { hpPotions: 0, mpPotions: 0, byName: {} }),
      primarySource: record.primarySource,
      sources: record.sources.slice(),
      stateConfidence: clamp01(stateConfidence),
      firstObservedAt: record.firstObservedAt,
      lastSeenAt: record.lastSeenAt,
      lastUpdatedAt: record.lastUpdatedAt,
      observationAgeMs: ageMs
    };
  }

  list() {
    const now = this.now();
    return [...this.records.values()]
      .map((record) => this._snapshotRecord(record, now))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get(name) {
    const wanted = normalizeName(name);
    if (!wanted) return null;
    const record = this.records.get(wanted);
    return record ? this._snapshotRecord(record, this.now()) : null;
  }

  status() {
    const characters = this.list();
    const counts = {
      total: characters.length,
      online: 0,
      offline: 0,
      stale: 0,
      unknownPresence: 0,
      available: 0,
      unavailable: 0,
      unknownAvailability: 0,
      byClass: {}
    };
    for (const character of characters) {
      if (character.presence === 'ONLINE') counts.online += 1;
      else if (character.presence === 'OFFLINE') counts.offline += 1;
      else if (character.presence === 'STALE') counts.stale += 1;
      else counts.unknownPresence += 1;
      if (character.availability === 'AVAILABLE') counts.available += 1;
      else if (character.availability === 'UNAVAILABLE') counts.unavailable += 1;
      else counts.unknownAvailability += 1;
      const ctype = character.ctype || 'unknown';
      counts.byClass[ctype] = (counts.byClass[ctype] || 0) + 1;
    }
    return {
      schemaVersion: REGISTRY_SCHEMA_VERSION,
      mode: REGISTRY_MODE,
      actionAuthority: false,
      directActionAccess: false,
      executorBypassAllowed: false,
      capacity: this.capacity,
      staleAfterMs: this.staleAfterMs,
      lastObservedAt: this.lastObservedAt,
      counts,
      characters,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  CharacterRegistry,
  REGISTRY_SCHEMA_VERSION,
  REGISTRY_MODE,
  SOURCE_CONFIDENCE,
  levelUnlockedSkills,
  summarizeSupplies
};

},
"src/autonomy/alpha12-hardened-runtime.js": function(require,module,exports){
'use strict';

const { Alpha12Runtime: BaseAlpha12Runtime } = require('./alpha12-runtime');
const { PartyControlLease } = require('../party/control-lease');

const ALPHA12_VERSION = '3.0.0-alpha.12.0';

class Alpha12Runtime extends BaseAlpha12Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA12_VERSION;
    const roster = this.characterRegistry.status().characters || [];
    const merchant = options.partyMerchantName || roster.find((row) => row.ctype === 'merchant')?.name || this.partyTransitions.merchantName || null;
    this.partyControlLease = options.partyControlLease || new PartyControlLease({
      root: this.root,
      now: this.now,
      log: this.log,
      merchantName: merchant,
      trustedNames: roster.map((row) => row.name),
      leaseMs: options.partyControlLeaseMs,
      ackTimeoutMs: options.partyControlAckTimeoutMs,
      pollMs: options.partyControlPollMs,
      maxClockSkewMs: options.partyControlMaxClockSkewMs
    });
    this.partyControlLease.install();
    this.partyTransitions.setControlLease(this.partyControlLease);
    this.syncPartyControlConfig();
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA12_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  syncPartyControlConfig() {
    if (!this.partyControlLease) return null;
    const status = this.characterRegistry.status();
    const names = status.characters.map((row) => row.name);
    const merchant = status.characters.find((row) => row.ctype === 'merchant');
    this.partyControlLease.setTrustedNames(names);
    if (merchant) {
      this.partyControlLease.setMerchantName(merchant.name);
      this.partyTransitions.setMerchantName(merchant.name);
      this.partyTelemetry.setMerchantName(merchant.name);
    }
    return this.partyControlLease.status();
  }

  _partyDecisionCycle() {
    this.syncPartyControlConfig();
    return super._partyDecisionCycle();
  }

  start() {
    if (this.partyControlLease && !this.partyControlLease.installed) this.partyControlLease.install();
    return super.start();
  }

  stop() {
    if (this.backgroundExecution && typeof this.backgroundExecution.stop === 'function') this.backgroundExecution.stop();
    if (this.partyControlLease) this.partyControlLease.uninstall();
    return super.stop();
  }

  setPartyTransitionsEnabled(enabled) {
    this.syncPartyControlConfig();
    return super.setPartyTransitionsEnabled(enabled);
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: ALPHA12_VERSION,
      party: {
        ...(base.party || {}),
        controlLease: this.partyControlLease ? this.partyControlLease.status() : null,
        transition: {
          ...((base.party && base.party.transition) || {}),
          controlLeaseBound: !!(this.partyTransitions && this.partyTransitions.controlLease)
        }
      }
    };
  }
}

module.exports = { Alpha12Runtime, ALPHA12_VERSION };

},
"src/autonomy/alpha12-runtime.js": function(require,module,exports){
'use strict';

const { Alpha11Runtime } = require('./alpha11-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { createPartyFingerprint, createEncounterFingerprint, dominantMonster } = require('../party/fingerprints');
const { PartyPerformanceStore } = require('../party/performance-store');
const { PartyOrchestrator } = require('../party/orchestrator');
const { PaladinAuraPolicy } = require('../party/paladin-aura-policy');
const { PartyTelemetryBridge } = require('../party/telemetry-bridge');
const { PartyTransitionController } = require('../party/transition-controller');
const { BackgroundExecutionGuard } = require('../ops/background-execution-guard');
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }
class Alpha12Runtime extends Alpha11Runtime {
  constructor(options = {}) {
    super(options); this.log.version = RELEASE_VERSION; this.partyDecisionMs = Math.max(2000, Math.min(60000, Number(options.partyDecisionMs) || 5000)); this.lastPartyDecisionAt = -Infinity; this.lastPerformanceSampleAt = null; this.currentPartyFingerprint = null; this.currentEncounterFingerprint = null; this.lastPartyDecision = null; this.lastAuraRecommendation = null; this.lastAuraExecution = null; this.auraAutomationEnabled = options.partyAuraAutomationEnabled === true;
    this.partyPerformance = options.partyPerformance || new PartyPerformanceStore({ root: this.root, storage: options.partyPerformanceStorage || options.storage, log: this.log, now: this.now, capacity: options.partyPerformanceCapacity, halfLifeMs: options.partyPerformanceHalfLifeMs, minSaveMs: options.partyPerformanceSaveMs }); this.partyPerformance.load();
    this.partyOrchestrator = options.partyOrchestrator || new PartyOrchestrator({ now: this.now, log: this.log, weights: options.partyScoreWeights, minScoreGain: options.partyMinScoreGain, minSwitchIntervalMs: options.partyMinSwitchIntervalMs, minRecommendedConfidence: options.partyMinRecommendedConfidence, maxCandidates: options.partyMaxCandidates, explorationEnabled: options.partyExplorationEnabled === true }); this.auraPolicy = options.auraPolicy || new PaladinAuraPolicy({ now: this.now, minHoldMs: options.partyAuraMinHoldMs });
    const roster = this.characterRegistry.status().characters || []; const configuredMerchant = options.partyMerchantName || roster.find((row) => row.ctype === 'merchant')?.name || null;
    this.partyTelemetry = options.partyTelemetry || new PartyTelemetryBridge({ root: this.root, now: this.now, log: this.log, merchantName: configuredMerchant, trustedNames: roster.map((row) => row.name), sendIntervalMs: options.partyTelemetrySendMs, reportTtlMs: options.partyTelemetryTtlMs, capacity: options.partyTelemetryCapacity }); this.partyTelemetry.installReceiver();
    this.partyTransitions = options.partyTransitions || new PartyTransitionController({ root: this.root, now: this.now, log: this.log, liveEnabled: options.partyTransitionsEnabled === true, merchantName: configuredMerchant, codeSlots: options.partyCodeSlots, stepTimeoutMs: options.partyTransitionStepTimeoutMs, transitionLeaseMs: options.partyTransitionLeaseMs, pollMs: options.partyTransitionPollMs });
    this.backgroundExecution = options.backgroundExecution || new BackgroundExecutionGuard({ root: this.root, now: this.now, log: this.log, expectedTickMs: this.tickMs, driftThresholdMs: options.backgroundDriftThresholdMs, rearmCooldownMs: options.backgroundRearmCooldownMs, enabled: options.backgroundExecutionGuardEnabled !== false });
  }
  start() { const started = super.start(); this.backgroundExecution.start(); return started; }
  stop() { this.partyPerformance.save({ force: true }); return super.stop(); }
  _contentDisposition(mtype) { if (!mtype || !this.world || typeof this.world.fact !== 'function') return 'UNKNOWN'; const fact = this.world.fact('monster-policy', mtype, 'contentSafetyDisposition'); return fact && fact.value || 'UNKNOWN'; }
  _currentMembers(snapshot) {
    if (!snapshot || !snapshot.character) return []; const names = new Set([snapshot.character.name]); for (const member of snapshot.party || []) if (member && member.name) names.add(member.name); const status = this.characterRegistry.status(); const byName = new Map(status.characters.map((row) => [row.name, row])); const result = [];
    for (const name of names) { const row = byName.get(name); if (row) result.push(row); else if (name === snapshot.character.name) result.push({ name, ctype: snapshot.character.ctype, level: snapshot.character.level, map: snapshot.character.map, stateConfidence: 1, online: true, available: !snapshot.character.rip, dead: !!snapshot.character.rip, stats: { hp: snapshot.character.hp, max_hp: snapshot.character.max_hp, mp: snapshot.character.mp, max_mp: snapshot.character.max_mp }, skillUnlocks: [] }); } return result;
  }
  _encounter(snapshot, gameData) {
    const monster = dominantMonster(snapshot) || (this.localFarming && this.localFarming.status().currentPlan && this.localFarming.status().currentPlan.monster) || null; const distances = []; for (const entity of snapshot.entities || []) { if (!entity || entity.mtype !== monster || entity.x == null || entity.y == null || snapshot.character.x == null || snapshot.character.y == null) continue; distances.push(Math.hypot(entity.x - snapshot.character.x, entity.y - snapshot.character.y)); }
    const levels = this._currentMembers(snapshot).map((row) => Number(row.level) || 0).filter((value) => value > 0); const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    return createEncounterFingerprint({ snapshot, gameData, monster, contentDisposition: this._contentDisposition(monster), avgDistance: distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : null, spawnDensity: monster ? (snapshot.entities || []).filter((entity) => entity && entity.mtype === monster && !entity.dead).length : 0, partyLevelBand: Math.floor(avgLevel / 10) * 10 });
  }
  _riskContext(snapshot, encounter) {
    const c = snapshot.character; const hpRatio = c.max_hp > 0 ? c.hp / c.max_hp : 1; const telemetry = this.partyTelemetry.aggregate(this._currentMembers(snapshot).map((row) => row.name)); const unknown = encounter.contentDisposition === 'QUARANTINED' || encounter.contentDisposition === 'UNKNOWN';
    return { unknown, highRisk: unknown || telemetry.emergencies > 0 || telemetry.deathsPerHour >= 1 || hpRatio < 0.45, mediumRisk: telemetry.deathsPerHour > 0 || telemetry.retreats > 0 || hpRatio < 0.7, lowSurvivalMargin: hpRatio < 0.6 || (telemetry.minHpRatio != null && telemetry.minHpRatio < 0.55), mpStarvation: telemetry.minMpRatio != null && telemetry.minMpRatio < 0.2, statusPressure: false, elementalPressure: false };
  }
  _recordCurrentPerformance(snapshot, encounter, currentMembers, currentFingerprint) {
    if (!currentFingerprint || !encounter || !encounter.monster || !encounter.monster.mtype) return; const now = this.now(); const elapsedMs = this.lastPerformanceSampleAt == null ? 0 : now - this.lastPerformanceSampleAt; this.lastPerformanceSampleAt = now; if (elapsedMs < 1000 || elapsedMs > 60000) return; const names = currentMembers.map((row) => row.name); const aggregate = this.partyTelemetry.aggregate(names); const local = this.partyTelemetry.buildLocalReport(this);
    if (local && !aggregate.reports.some((row) => row.name === local.name)) { aggregate.freshReports += 1; for (const key of ['xpPerHour', 'goldPerHour', 'killsPerHour', 'deathsPerHour', 'potionsPerHour', 'damageTakenPerHour']) aggregate[key] += local.rates[key]; aggregate.minHpRatio = aggregate.minHpRatio == null ? local.hpRatio : Math.min(aggregate.minHpRatio, local.hpRatio); aggregate.minMpRatio = aggregate.minMpRatio == null ? local.mpRatio : Math.min(aggregate.minMpRatio, local.mpRatio); if (local.safety.retreat) aggregate.retreats += 1; if (local.safety.emergency) aggregate.emergencies += 1; if (local.safety.movementCircuitOpen) aggregate.movementCircuits += 1; aggregate.skillFailureBackoffs += local.safety.skillFailureBackoffs; }
    if (aggregate.freshReports <= 0) return; const hours = elapsedMs / 3600000; const progressNorm = clamp01(Math.log1p(Math.max(0, aggregate.xpPerHour)) / Math.log(6000001)); const safetyMargin = aggregate.minHpRatio == null ? 0.5 : aggregate.minHpRatio; const score = clamp01(safetyMargin * 0.6 + progressNorm * 0.4 - Math.min(0.5, aggregate.deathsPerHour * 0.35));
    this.partyPerformance.record(encounter.key, currentFingerprint.key, { seconds: elapsedMs / 1000, xp: aggregate.xpPerHour * hours, gold: aggregate.goldPerHour * hours, kills: aggregate.killsPerHour * hours, deaths: aggregate.deathsPerHour * hours, hpPotions: aggregate.potionsPerHour * hours, damage: 0, retreats: aggregate.retreats, nearDeaths: aggregate.minHpRatio != null && aggregate.minHpRatio < 0.25 ? 1 : 0, movementFailures: aggregate.movementCircuits, skillFailures: aggregate.skillFailureBackoffs, safetyMargin, score }); this.partyPerformance.save();
  }
  _maybeApplyAura(snapshot, encounter, risk, currentMembers) {
    const localName = snapshot.character.name; const local = currentMembers.find((row) => row.name === localName); const paladin = currentMembers.find((row) => row.ctype === 'paladin') || null; const recommendation = this.auraPolicy.recommend({ paladin, encounter, risk }); this.lastAuraRecommendation = recommendation; if (!recommendation.aura || !local || local.ctype !== 'paladin' || paladin.name !== local.name) return; if (!this.auraAutomationEnabled || this.adapter.mode !== 'active' || recommendation.canSwitch === false) return; if (this.auraPolicy.lastAura === recommendation.aura) return; const result = this.adapter.command('use_skill', ['paladin_aura', recommendation.aura]); this.lastAuraExecution = { at: this.now(), aura: recommendation.aura, result: { executed: !!result.executed, reason: result.reason || null, shadow: !!result.shadow } }; if (result.executed) { this.auraPolicy.noteApplied(recommendation.aura); this.log.emit({ component: 'party-aura', event: 'PALADIN_AURA_CHANGED', data: { aura: recommendation.aura, reason: recommendation.reason } }); }
  }
  _maybeStartTransition(snapshot, decision, currentMembers) {
    if (!decision || decision.decision !== 'WOULD_SWITCH' || !decision.recommended || this.partyTransitions.active) return; if (!this.partyTransitions.liveEnabled || this.adapter.mode !== 'active') return; const recommendedNames = new Set(decision.recommended.members.map((row) => row.name)); const status = this.characterRegistry.status(); const planMembers = status.characters.filter((row) => recommendedNames.has(row.name)); if (planMembers.length !== 4) return; const merchant = planMembers.find((row) => row.ctype === 'merchant'); if (!merchant) return; const c = snapshot.character; const inCombat = !!c.target || (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name); const requiresCrossMapRouting = planMembers.some((member) => member.map && c.map && member.map !== c.map && member.online === true);
    Promise.resolve(this.partyTransitions.execute({ members: planMembers, merchant }, { runtimeMode: this.adapter.mode, currentMembers, registryStatus: status, inCombat, emergency: !!this.pendingEmergencyRetreat, requiresCrossMapRouting, verifyTargetState: (targetNames) => { const latest = this.characterRegistry.status(); const byName = new Map(latest.characters.map((row) => [row.name, row])); return targetNames.every((name) => { const row = byName.get(name); if (!row || row.dead === true) return false; if (row.online === false || row.presence === 'STALE') return false; if (row.map && c.map && row.map !== c.map) return false; const hp = row.stats && Number(row.stats.hp); const maxHp = row.stats && Number(row.stats.max_hp); if (Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0 && hp / maxHp < 0.5) return false; return true; }); } })).then((result) => { if (result && result.executed) this.partyOrchestrator.noteSwitch(); }).catch((error) => { this.log.emit({ component: 'party-transition', event: 'PARTY_SWITCH_ABORTED', severity: 'error', reason: 'UNHANDLED_TRANSITION_ERROR', data: { message: String(error && error.message || error) } }); });
  }
  _partyDecisionCycle() {
    const snapshot = this.lastSnapshot; if (!snapshot || !snapshot.character) return null; const gameData = this.adapter.getGameData() || {}; const registryStatus = this.characterRegistry.status(); const rosterNames = registryStatus.characters.map((row) => row.name); this.partyTelemetry.setTrustedNames(rosterNames); const merchant = registryStatus.characters.find((row) => row.ctype === 'merchant'); if (merchant) { this.partyTelemetry.setMerchantName(merchant.name); this.partyTransitions.setMerchantName(merchant.name); }
    const currentMembers = this._currentMembers(snapshot); const currentFingerprint = createPartyFingerprint(currentMembers, { aura: this.auraPolicy.lastAura }); const encounter = this._encounter(snapshot, gameData); this.currentPartyFingerprint = currentFingerprint; this.currentEncounterFingerprint = encounter; this._recordCurrentPerformance(snapshot, encounter, currentMembers, currentFingerprint); const decision = this.partyOrchestrator.decide({ snapshot, gameData, registryStatus, currentMembers, encounter, performanceStore: this.partyPerformance, switchCostSeconds: 180 }); this.lastPartyDecision = decision; const risk = this._riskContext(snapshot, encounter); this._maybeApplyAura(snapshot, encounter, risk, currentMembers); this._maybeStartTransition(snapshot, decision, currentMembers); return decision;
  }
  tick() { this.backgroundExecution.noteTick(); super.tick(); this.partyTelemetry.tick(this); const now = this.now(); if (now - this.lastPartyDecisionAt < this.partyDecisionMs) return; this.lastPartyDecisionAt = now; this._partyDecisionCycle(); }
  setPartyTransitionsEnabled(enabled) { return this.partyTransitions.setLiveEnabled(enabled); }
  setPartyAuraAutomationEnabled(enabled) { this.auraAutomationEnabled = enabled === true; return this.auraAutomationEnabled; }
  setPartyExplorationEnabled(enabled) { return this.partyOrchestrator.setExplorationEnabled(enabled); }
  setPartyCodeSlots(slots) { return this.partyTransitions.setCodeSlots(slots); }
  status() {
    const base = super.status(); return { ...base, version: RELEASE_VERSION, backgroundExecution: this.backgroundExecution.status(), party: { ...(base.party || {}), mode: 'adaptive-orchestrator', actionAuthority: (this.adapter.mode === 'active' && (this.partyTransitions.liveEnabled || this.auraAutomationEnabled)), strategicBrainAuthority: false, decisionIntervalMs: this.partyDecisionMs, fingerprints: { party: this.currentPartyFingerprint, encounter: this.currentEncounterFingerprint }, orchestrator: this.partyOrchestrator.status(), decision: this.lastPartyDecision, performance: this.partyPerformance.status(16), telemetry: this.partyTelemetry.status(), aura: { automationEnabled: this.auraAutomationEnabled, recommendation: this.lastAuraRecommendation, execution: this.lastAuraExecution, policy: this.auraPolicy.status() }, transition: this.partyTransitions.status() } };
  }
  exportDiagnostics() { const base = JSON.parse(super.exportDiagnostics()); base.context = base.context || {}; base.context.backgroundExecution = this.backgroundExecution.status(); base.context.party = this.status().party; return JSON.stringify(base, null, 2); }
}
module.exports = { Alpha12Runtime };

},
"src/party/fingerprints.js": function(require,module,exports){
'use strict';

const FINGERPRINT_SCHEMA_VERSION = 1;

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clamp(value, min, max) {
  const n = finite(value);
  if (n == null) return min;
  return Math.max(min, Math.min(max, n));
}
function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}
function hash(input) {
  const text = String(input || '');
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function gearSignature(gear) {
  if (!gear || typeof gear !== 'object') return 'none';
  return Object.keys(gear).sort().map((slot) => { const item = gear[slot] || {}; return `${slot}:${item.name || '?'}+${Math.max(0, Number(item.level) || 0)}`; }).join(',') || 'none';
}
function memberFingerprint(member) {
  return { name: String(member && member.name || 'unknown'), ctype: String(member && (member.ctype || member.type) || 'unknown').toLowerCase(), level: Math.max(0, Number(member && member.level) || 0), gear: gearSignature(member && member.gear), skills: Array.isArray(member && member.skillUnlocks) ? member.skillUnlocks.slice().map(String).sort().slice(0, 128) : [] };
}
function createPartyFingerprint(members = [], options = {}) {
  const normalized = members.map(memberFingerprint).sort((a, b) => a.name.localeCompare(b.name));
  const classes = normalized.map((member) => member.ctype).sort();
  const semantic = classes.join('|') || 'empty';
  const detail = { schemaVersion: FINGERPRINT_SCHEMA_VERSION, members: normalized, aura: options.aura || null, rolePolicy: options.rolePolicy || null };
  const detailHash = hash(stableStringify(detail));
  return { schemaVersion: FINGERPRINT_SCHEMA_VERSION, semantic, key: `${semantic}::${detailHash}`, detailHash, members: normalized, aura: options.aura || null };
}
function monsterMetadata(gameData, mtype) {
  const raw = gameData && gameData.monsters && gameData.monsters[mtype] || {};
  return { mtype: mtype || null, hp: finite(raw.hp), attack: finite(raw.attack), frequency: finite(raw.frequency), armor: finite(raw.armor), resistance: finite(raw.resistance), damageType: raw.damage_type || raw.damageType || null, aggro: raw.aggro == null ? null : Number(raw.aggro), rage: raw.rage == null ? null : Number(raw.rage) };
}
function dominantMonster(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return null;
  const rows = new Map();
  for (const entity of snapshot.entities || []) {
    if (!entity || !entity.mtype || entity.dead) continue;
    let score = 1;
    if (String(entity.id) === String(c.target || '')) score += 6;
    if (entity.target === c.name) score += 4;
    rows.set(entity.mtype, (rows.get(entity.mtype) || 0) + score);
  }
  return [...rows.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
}
function createEncounterFingerprint(context = {}) {
  const snapshot = context.snapshot || {};
  const c = snapshot.character || {};
  const gameData = context.gameData || {};
  const mtype = context.monster || dominantMonster(snapshot) || (context.currentPlan && context.currentPlan.monster) || null;
  const metadata = monsterMetadata(gameData, mtype);
  const selfAggro = (snapshot.entities || []).filter((entity) => entity && !entity.dead && entity.target === c.name).length;
  const visibleSameType = (snapshot.entities || []).filter((entity) => entity && !entity.dead && entity.mtype === mtype).length;
  const hpRatio = c.max_hp > 0 ? clamp(c.hp / c.max_hp, 0, 1) : null;
  const mpRatio = c.max_mp > 0 ? clamp(c.mp / c.max_mp, 0, 1) : null;
  const detail = { schemaVersion: FINGERPRINT_SCHEMA_VERSION, map: c.map || null, zone: context.zone || null, monster: metadata, expectedParallel: Math.max(visibleSameType, selfAggro, Number(context.expectedParallel) || 1), spawnDensity: context.spawnDensity == null ? null : clamp(context.spawnDensity, 0, 1000), avgDistance: context.avgDistance == null ? null : Math.max(0, finite(context.avgDistance) || 0), partyLevelBand: context.partyLevelBand || null, event: context.event || null, hpBand: hpRatio == null ? null : Math.round(hpRatio * 10), mpBand: mpRatio == null ? null : Math.round(mpRatio * 10), contentDisposition: context.contentDisposition || null };
  const key = `enc::${hash(stableStringify(detail))}`;
  return { ...detail, key };
}
module.exports = { FINGERPRINT_SCHEMA_VERSION, stableStringify, hash, createPartyFingerprint, createEncounterFingerprint, dominantMonster, monsterMetadata };

},
"src/party/performance-store.js": function(require,module,exports){
'use strict';

const PARTY_PERFORMANCE_SCHEMA_VERSION = 1;
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value, 0))); }
class PartyPerformanceStore {
  constructor(options = {}) {
    this.root = options.root || globalThis; this.storage = options.storage || null; this.log = options.log || null; this.now = options.now || (() => Date.now());
    this.key = options.key || 'AIO_V3_PARTY_PERFORMANCE'; this.capacity = Math.max(32, Math.min(4096, Number(options.capacity) || 512));
    this.halfLifeMs = Math.max(60 * 60 * 1000, Math.min(90 * 24 * 60 * 60 * 1000, Number(options.halfLifeMs) || 7 * 24 * 60 * 60 * 1000));
    this.minSaveMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.minSaveMs) || 30000));
    this.records = new Map(); this.loaded = false; this.dirty = false; this.lastSavedAt = 0; this.stats = { samples: 0, loads: 0, loadFailures: 0, saves: 0, saveFailures: 0, evicted: 0 };
  }
  _event(event, data = {}, severity = 'info', reason = null) { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-performance', event, severity, reason, data }); }
  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    return null;
  }
  _key(encounterKey, partyKey) { return `${encounterKey || 'unknown-encounter'}::${partyKey || 'unknown-party'}`; }
  _sanitize(record) {
    if (!record || typeof record !== 'object') return null; const encounterKey = String(record.encounterKey || ''); const partyKey = String(record.partyKey || ''); if (!encounterKey || !partyKey) return null;
    return { encounterKey, partyKey, samples: Math.max(0, finite(record.samples)), combatSeconds: Math.max(0, finite(record.combatSeconds)), xp: Math.max(0, finite(record.xp)), gold: finite(record.gold), damage: Math.max(0, finite(record.damage)), kills: Math.max(0, finite(record.kills)), deaths: Math.max(0, finite(record.deaths)), retreats: Math.max(0, finite(record.retreats)), nearDeaths: Math.max(0, finite(record.nearDeaths)), recoverySeconds: Math.max(0, finite(record.recoverySeconds)), hpPotions: Math.max(0, finite(record.hpPotions)), mpPotions: Math.max(0, finite(record.mpPotions)), merchantTrips: Math.max(0, finite(record.merchantTrips)), skillFailures: Math.max(0, finite(record.skillFailures)), movementFailures: Math.max(0, finite(record.movementFailures)), disconnects: Math.max(0, finite(record.disconnects)), safetyMarginSum: Math.max(0, finite(record.safetyMarginSum)), safetyMarginSamples: Math.max(0, finite(record.safetyMarginSamples)), scoreEwma: clamp01(record.scoreEwma), scoreVariance: Math.max(0, finite(record.scoreVariance)), updatedAt: Math.max(0, finite(record.updatedAt)), firstSeenAt: Math.max(0, finite(record.firstSeenAt)) };
  }
  load() {
    if (this.loaded) return false; this.loaded = true; const backend = this._backend(); if (!backend) return false;
    try { const raw = backend.get(this.key); if (!raw) return false; const data = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!data || data.schemaVersion !== PARTY_PERFORMANCE_SCHEMA_VERSION || !Array.isArray(data.records)) throw new Error('unsupported party performance schema'); for (const row of data.records.slice(-this.capacity)) { const clean = this._sanitize(row); if (clean) this.records.set(this._key(clean.encounterKey, clean.partyKey), clean); } this.stats.loads += 1; this._event('PARTY_PERFORMANCE_RESTORED', { records: this.records.size }); return true; }
    catch (error) { this.records.clear(); this.stats.loadFailures += 1; this._event('PARTY_PERFORMANCE_RESTORE_FAILED', { message: String(error && error.message || error) }, 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA'); return false; }
  }
  _prune() { if (this.records.size <= this.capacity) return; const rows = [...this.records.entries()].sort((a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0)); const count = this.records.size - this.capacity; for (let i = 0; i < count; i += 1) this.records.delete(rows[i][0]); this.stats.evicted += count; }
  record(encounterKey, partyKey, sample = {}) {
    if (!encounterKey || !partyKey) return null; const key = this._key(encounterKey, partyKey); const now = this.now(); const current = this.records.get(key) || this._sanitize({ encounterKey, partyKey, firstSeenAt: now, updatedAt: now });
    const weight = Math.max(1, finite(sample.samples, 1)); const score = clamp01(sample.score == null ? current.scoreEwma : sample.score); const alpha = Math.max(0.02, Math.min(0.5, finite(sample.ewmaAlpha, 0.12))); const oldEwma = current.scoreEwma; const nextEwma = current.samples > 0 ? oldEwma * (1 - alpha) + score * alpha : score; const delta = score - oldEwma;
    current.scoreVariance = current.samples > 0 ? Math.max(0, current.scoreVariance * (1 - alpha) + delta * delta * alpha) : 0; current.scoreEwma = clamp01(nextEwma); current.samples += weight;
    current.combatSeconds += Math.max(0, finite(sample.combatSeconds || sample.seconds)); current.xp += Math.max(0, finite(sample.xp)); current.gold += finite(sample.gold); current.damage += Math.max(0, finite(sample.damage)); current.kills += Math.max(0, finite(sample.kills)); current.deaths += Math.max(0, finite(sample.deaths)); current.retreats += Math.max(0, finite(sample.retreats)); current.nearDeaths += Math.max(0, finite(sample.nearDeaths)); current.recoverySeconds += Math.max(0, finite(sample.recoverySeconds)); current.hpPotions += Math.max(0, finite(sample.hpPotions)); current.mpPotions += Math.max(0, finite(sample.mpPotions)); current.merchantTrips += Math.max(0, finite(sample.merchantTrips)); current.skillFailures += Math.max(0, finite(sample.skillFailures)); current.movementFailures += Math.max(0, finite(sample.movementFailures)); current.disconnects += Math.max(0, finite(sample.disconnects));
    if (sample.safetyMargin != null) { current.safetyMarginSum += clamp01(sample.safetyMargin); current.safetyMarginSamples += 1; } current.updatedAt = now; this.records.set(key, current); this.stats.samples += 1; this.dirty = true; this._prune(); this._event('PARTY_SAMPLE_COMPLETED', { encounterKey, partyKey, score: current.scoreEwma, samples: current.samples }); return this.profile(encounterKey, partyKey);
  }
  profile(encounterKey, partyKey) {
    const raw = this.records.get(this._key(encounterKey, partyKey)); if (!raw) return null; const hours = raw.combatSeconds / 3600; const ageMs = Math.max(0, this.now() - raw.updatedAt); const freshness = Math.pow(0.5, ageMs / this.halfLifeMs); const evidence = 1 - Math.exp(-Math.max(raw.combatSeconds / 900, raw.samples / 8)); const confidence = clamp01(evidence * freshness);
    return { ...raw, xpPerHour: hours > 0 ? raw.xp / hours : 0, goldPerHour: hours > 0 ? raw.gold / hours : 0, deathsPerHour: hours > 0 ? raw.deaths / hours : 0, retreatsPerHour: hours > 0 ? raw.retreats / hours : 0, recoverySecondsPerHour: hours > 0 ? raw.recoverySeconds / hours : 0, hpPotionsPerHour: hours > 0 ? raw.hpPotions / hours : 0, mpPotionsPerHour: hours > 0 ? raw.mpPotions / hours : 0, avgSafetyMargin: raw.safetyMarginSamples > 0 ? raw.safetyMarginSum / raw.safetyMarginSamples : null, freshness, confidence, uncertainty: 1 - confidence, ageMs };
  }
  save(options = {}) {
    if (!this.dirty && options.force !== true) return false; if (!options.force && this.now() - this.lastSavedAt < this.minSaveMs) return false; const backend = this._backend(); if (!backend) return false;
    try { const serialized = JSON.stringify({ schemaVersion: PARTY_PERFORMANCE_SCHEMA_VERSION, savedAt: this.now(), records: [...this.records.values()] }); backend.set(this.key, serialized); this.lastSavedAt = this.now(); this.dirty = false; this.stats.saves += 1; this._event('PARTY_PERFORMANCE_SAVED', { records: this.records.size, bytes: serialized.length }); return true; }
    catch (error) { this.stats.saveFailures += 1; this._event('PARTY_PERFORMANCE_SAVE_FAILED', { message: String(error && error.message || error) }, 'warn', 'PERSISTENCE_WRITE_ERROR'); return false; }
  }
  status(limit = 32) { const rows = [...this.records.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, Math.max(0, Math.min(128, Number(limit) || 32))); return { schemaVersion: PARTY_PERFORMANCE_SCHEMA_VERSION, capacity: this.capacity, size: this.records.size, halfLifeMs: this.halfLifeMs, loaded: this.loaded, dirty: this.dirty, stats: { ...this.stats }, recent: rows.map((row) => this.profile(row.encounterKey, row.partyKey)) }; }
}
module.exports = { PartyPerformanceStore, PARTY_PERFORMANCE_SCHEMA_VERSION };

},
"src/party/orchestrator.js": function(require,module,exports){
'use strict';

const { createPartyFingerprint, createEncounterFingerprint } = require('./fingerprints');
const COMBAT_CLASSES = new Set(['warrior', 'paladin', 'rogue', 'ranger', 'mage', 'priest']);
const DEFAULT_WEIGHTS = Object.freeze({ survival: 0.45, progress: 0.30, controllability: 0.15, synergy: 0.10 });
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }
function avg(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function combinations(items, count, start = 0, acc = [], out = []) { if (acc.length === count) { out.push(acc.slice()); return out; } for (let i = start; i <= items.length - (count - acc.length); i += 1) { acc.push(items[i]); combinations(items, count, i + 1, acc, out); acc.pop(); } return out; }
function hasSkill(party, skill) { return party.some((member) => Array.isArray(member.skillUnlocks) && member.skillUnlocks.includes(skill)); }
function countClass(party, ctype) { return party.filter((member) => member.ctype === ctype).length; }

class PartyOrchestrator {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now()); this.log = options.log || null; const rawWeights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) }; const sum = Object.values(rawWeights).reduce((a, b) => a + Math.max(0, finite(b)), 0) || 1;
    this.weights = Object.fromEntries(Object.entries(rawWeights).map(([key, value]) => [key, Math.max(0, finite(value)) / sum])); this.minScoreGain = Math.max(0.01, Math.min(0.3, finite(options.minScoreGain, 0.06))); this.minSwitchIntervalMs = Math.max(60000, Math.min(24 * 60 * 60 * 1000, finite(options.minSwitchIntervalMs, 15 * 60 * 1000))); this.minRecommendedConfidence = Math.max(0, Math.min(1, finite(options.minRecommendedConfidence, 0.25))); this.maxCandidates = Math.max(4, Math.min(256, finite(options.maxCandidates, 96))); this.explorationEnabled = options.explorationEnabled === true; this.lastDecision = null; this.lastSwitchAt = 0;
  }
  _event(event, data = {}, severity = 'info', reason = null) { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-orchestrator', event, severity, reason, data }); }
  candidates(registryStatus) {
    const chars = (registryStatus && registryStatus.characters || []).filter((entry) => entry && entry.dead !== true && entry.available !== false && entry.stateConfidence >= 0.3 && (entry.online === true || entry.primarySource === 'configured' || entry.presence === 'OFFLINE'));
    const merchants = chars.filter((entry) => entry.ctype === 'merchant'); const combat = chars.filter((entry) => COMBAT_CLASSES.has(entry.ctype)); const out = [];
    for (const merchant of merchants) for (const group of combinations(combat, 3)) { const members = [merchant, ...group]; const fingerprint = createPartyFingerprint(members); out.push({ id: fingerprint.key, merchant, combat: group, members, fingerprint }); if (out.length >= this.maxCandidates) return out; }
    return out;
  }
  _theory(candidate, encounter) {
    const party = candidate.combat; const monster = encounter.monster || {}; const damageType = String(monster.damageType || '').toLowerCase(); const known = !!encounter.monster?.mtype && encounter.contentDisposition !== 'QUARANTINED' && encounter.contentDisposition !== 'UNKNOWN'; const avgConfidence = avg(candidate.members.map((member) => clamp01(member.stateConfidence))); const avgLevel = avg(party.map((member) => Math.max(0, finite(member.level))));
    const survivalStats = avg(party.map((member) => { const hp = Math.max(0, finite(member.stats && member.stats.max_hp, finite(member.stats && member.stats.hp, 0))); const armor = Math.max(0, finite(member.stats && member.stats.armor, 0)); const resistance = Math.max(0, finite(member.stats && member.stats.resistance, 0)); return clamp01((hp / 6000) * 0.4 + (armor / 1000) * 0.3 + (resistance / 1000) * 0.3); }));
    let survival = 0.35 + survivalStats * 0.30; let progress = 0.35; let controllability = 0.55; let synergy = 0.30; const reasons = [];
    const rangers = countClass(party, 'ranger'); const paladins = countClass(party, 'paladin'); const priests = countClass(party, 'priest'); const mages = countClass(party, 'mage'); const warriors = countClass(party, 'warrior'); const rogues = countClass(party, 'rogue');
    progress += rangers * 0.11 + mages * 0.105 + rogues * 0.11 + warriors * 0.075 + paladins * 0.065 + priests * 0.035; controllability += rangers * 0.06 + mages * 0.05 + priests * 0.04 + paladins * 0.035 + warriors * 0.025; survival += paladins * 0.10 + priests * 0.13 + warriors * 0.09; synergy += paladins * 0.08 + priests * 0.08 + mages * 0.06 + warriors * 0.04;
    if (hasSkill(party, 'huntersmark')) { synergy += 0.07; reasons.push('HUNTERS_MARK_AVAILABLE'); } if (hasSkill(party, 'energize')) { synergy += 0.08; reasons.push('MAGE_MP_SUPPORT_EXPECTED'); } if (hasSkill(party, 'darkblessing')) { synergy += 0.06; reasons.push('DARK_BLESSING_AVAILABLE'); } if (hasSkill(party, 'warcry')) { synergy += 0.05; reasons.push('WAR_CRY_AVAILABLE'); } if (hasSkill(party, 'guardians_oath') || hasSkill(party, 'guardian_oath')) { survival += 0.08; synergy += 0.04; reasons.push('GUARDIANS_OATH_AVAILABLE'); } if (hasSkill(party, 'paladin_aura')) { survival += 0.08; synergy += 0.06; reasons.push('PALADIN_AURA_AVAILABLE'); }
    if (damageType === 'physical' && (paladins || warriors)) { survival += 0.10; reasons.push('PHYSICAL_DAMAGE_PRESSURE'); } if (damageType === 'magical' && (paladins || priests)) { survival += 0.10; reasons.push('MAGICAL_DAMAGE_PRESSURE'); } if (finite(monster.armor) > 500 && mages) { progress += 0.10; reasons.push('NEED_MAGIC_DAMAGE'); } if (finite(monster.resistance) > 500 && rangers) { progress += 0.07; reasons.push('NEED_RANGED_DAMAGE'); } if (!known) { survival += paladins * 0.06 + priests * 0.08; progress -= 0.12; reasons.push('UNKNOWN_CONTENT'); } if (rangers === 3 && known) { progress += 0.08; controllability += 0.05; reasons.push('V2_TRIPLE_RANGER_PRIOR'); } if (avgLevel < 40) synergy *= 0.9;
    return { survival: clamp01(survival), progress: clamp01(progress), controllability: clamp01(controllability), synergy: clamp01(synergy), confidence: clamp01(0.18 + avgConfidence * 0.32 + (rangers === 3 && known ? 0.12 : 0)), reasons };
  }
  _measured(profile) {
    if (!profile) return null; const survival = clamp01(1 - Math.min(1, profile.deathsPerHour / 1.0) * 0.55 - Math.min(1, profile.retreatsPerHour / 6) * 0.20 - Math.min(1, profile.recoverySecondsPerHour / 900) * 0.15 + (profile.avgSafetyMargin == null ? 0 : profile.avgSafetyMargin * 0.10)); const progress = clamp01(Math.log1p(Math.max(0, profile.xpPerHour)) / Math.log(6000001)); const resourcePenalty = Math.min(0.25, (profile.hpPotionsPerHour + profile.mpPotionsPerHour) / 5000); const controllability = clamp01(1 - resourcePenalty - Math.min(0.25, profile.movementFailures / Math.max(1, profile.samples)) - Math.min(0.25, profile.skillFailures / Math.max(1, profile.samples))); return { survival, progress, controllability, synergy: clamp01(profile.scoreEwma), confidence: clamp01(profile.confidence) };
  }
  score(candidate, context = {}) {
    const encounter = context.encounter || createEncounterFingerprint(context); const profile = context.performanceStore && context.performanceStore.profile(encounter.key, candidate.fingerprint.key); const theory = this._theory(candidate, encounter); const measured = this._measured(profile); const blend = measured ? measured.confidence : 0; const components = {};
    for (const key of ['survival', 'progress', 'controllability', 'synergy']) components[key] = clamp01(theory[key] * (1 - blend) + (measured ? measured[key] : 0) * blend);
    const confidence = clamp01(Math.max(theory.confidence * (1 - blend), measured ? measured.confidence : 0)); const highRiskUnknown = encounter.contentDisposition === 'QUARANTINED' || encounter.contentDisposition === 'UNKNOWN'; const empiricallyUnsafe = profile && (profile.deathsPerHour >= 1 || profile.retreatsPerHour >= 8 || (profile.avgSafetyMargin != null && profile.avgSafetyMargin < 0.2)); const hardSafetyRejected = !!empiricallyUnsafe; let total = Object.entries(this.weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0); if (highRiskUnknown) total *= 0.86; if (hardSafetyRejected) total = 0; if (this.explorationEnabled && !highRiskUnknown && confidence < 0.5 && components.survival >= 0.65) total += Math.min(0.025, (0.5 - confidence) * 0.05); total = clamp01(total);
    return { candidate, encounter, profile, theory, measured, components, confidence, uncertainty: 1 - confidence, score: total, hardSafetyRejected, reasons: [...new Set(theory.reasons.concat(empiricallyUnsafe ? ['HIGH_DEATH_RATE'] : []))] };
  }
  decide(context = {}) {
    const registryStatus = context.registryStatus || { characters: [] }; const encounter = context.encounter || createEncounterFingerprint(context); const candidates = this.candidates(registryStatus); const scored = candidates.map((candidate) => this.score(candidate, { ...context, encounter })).sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.candidate.id.localeCompare(b.candidate.id)); const currentNames = new Set((context.currentMembers || []).map((member) => typeof member === 'string' ? member : member.name)); const current = scored.find((row) => row.candidate.members.every((member) => currentNames.has(member.name)) && currentNames.size === row.candidate.members.length) || null; const best = scored.find((row) => !row.hardSafetyRejected) || null;
    let decision = 'WOULD_KEEP'; const reasons = []; const projectedGain = best && current ? best.score - current.score : best ? best.score : 0; const switchCostScore = Math.min(0.15, Math.max(0, finite(context.switchCostSeconds, 180)) / 3600 * 0.35);
    if (!best) reasons.push('NO_ELIGIBLE_PARTY'); else if (!current) { decision = 'WOULD_SWITCH'; reasons.push('CURRENT_PARTY_NOT_MODELED'); } else if (best.candidate.id === current.candidate.id) reasons.push('CURRENT_PARTY_BEST'); else if (best.confidence < this.minRecommendedConfidence) reasons.push('INSUFFICIENT_CONFIDENCE'); else if (this.now() - this.lastSwitchAt < this.minSwitchIntervalMs) reasons.push('SWITCH_COOLDOWN'); else if (projectedGain <= this.minScoreGain + switchCostScore) reasons.push('GAIN_BELOW_SWITCH_THRESHOLD'); else { decision = 'WOULD_SWITCH'; reasons.push(...best.reasons); } if (encounter.contentDisposition === 'QUARANTINED' || encounter.contentDisposition === 'UNKNOWN') reasons.push('UNKNOWN_CONTENT');
    const result = { at: this.now(), mode: 'shadow-recommendation', actionAuthority: false, decision, current: current ? this._summary(current) : null, recommended: best ? this._summary(best) : null, projectedGain, switchCostSeconds: Math.max(0, finite(context.switchCostSeconds, 180)), switchCostScore, reasons: [...new Set(reasons)], encounter, candidateCount: scored.length, top: scored.slice(0, 8).map((row) => this._summary(row)) };
    const changed = !this.lastDecision || this.lastDecision.decision !== result.decision || this.lastDecision.recommended?.partyKey !== result.recommended?.partyKey; this.lastDecision = result; this._event(changed ? 'PARTY_RECOMMENDATION_CHANGED' : 'PARTY_SCORE_CALCULATED', { decision: result.decision, current: result.current && result.current.partyKey, recommended: result.recommended && result.recommended.partyKey, gain: result.projectedGain, reasons: result.reasons }); return result;
  }
  _summary(row) { return { partyKey: row.candidate.fingerprint.key, semantic: row.candidate.fingerprint.semantic, members: row.candidate.members.map((member) => ({ name: member.name, ctype: member.ctype, level: member.level })), score: row.score, confidence: row.confidence, uncertainty: row.uncertainty, components: row.components, hardSafetyRejected: row.hardSafetyRejected, reasons: row.reasons }; }
  noteSwitch() { this.lastSwitchAt = this.now(); }
  setExplorationEnabled(enabled) { this.explorationEnabled = enabled === true; return this.explorationEnabled; }
  status() { return { mode: 'shadow-recommendation', actionAuthority: false, directActionAccess: false, executorBypassAllowed: false, weights: { ...this.weights }, minScoreGain: this.minScoreGain, minSwitchIntervalMs: this.minSwitchIntervalMs, minRecommendedConfidence: this.minRecommendedConfidence, explorationEnabled: this.explorationEnabled, lastSwitchAt: this.lastSwitchAt || null, lastDecision: this.lastDecision }; }
}
module.exports = { PartyOrchestrator, COMBAT_CLASSES, DEFAULT_WEIGHTS, combinations };

},
"src/party/paladin-aura-policy.js": function(require,module,exports){
'use strict';

const AURAS = Object.freeze(['bulwark', 'sanctuary', 'zeal', 'warding']);
class PaladinAuraPolicy {
  constructor(options = {}) { this.now = options.now || (() => Date.now()); this.minHoldMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.minHoldMs) || 30000)); this.lastAura = null; this.lastChangedAt = 0; this.lastDecision = null; }
  recommend(context = {}) {
    const paladin = context.paladin || null; const encounter = context.encounter || {}; const risk = context.risk || {};
    if (!paladin || paladin.ctype !== 'paladin' || Number(paladin.level) < 60 || !Array.isArray(paladin.skillUnlocks) || !paladin.skillUnlocks.includes('paladin_aura')) { this.lastDecision = { aura: null, reason: 'PALADIN_AURA_UNAVAILABLE', canSwitch: false }; return this.lastDecision; }
    const monster = encounter.monster || {}; const damageType = String(monster.damageType || '').toLowerCase(); let aura = 'zeal'; let reason = 'SAFE_OFFENSE';
    if (risk.unknown || risk.highRisk || risk.lowSurvivalMargin) { aura = damageType === 'magical' ? 'sanctuary' : 'bulwark'; reason = damageType === 'magical' ? 'MAGICAL_DAMAGE_PRESSURE' : 'LOW_SURVIVAL_MARGIN'; }
    else if (risk.statusPressure || risk.elementalPressure || risk.mpStarvation) { aura = 'warding'; reason = risk.mpStarvation ? 'MP_STARVATION' : 'STATUS_OR_ELEMENTAL_PRESSURE'; }
    else if (damageType === 'magical' && risk.mediumRisk) { aura = 'sanctuary'; reason = 'MAGICAL_DAMAGE_PRESSURE'; }
    else if (damageType === 'physical' && risk.mediumRisk) { aura = 'bulwark'; reason = 'PHYSICAL_DAMAGE_PRESSURE'; }
    const now = this.now(); const held = this.lastAura && this.lastAura !== aura && now - this.lastChangedAt < this.minHoldMs; const resolved = held ? this.lastAura : aura;
    this.lastDecision = { aura: resolved, proposedAura: aura, reason: held ? 'AURA_HYSTERESIS_HOLD' : reason, canSwitch: !held, minHoldMs: this.minHoldMs }; return this.lastDecision;
  }
  noteApplied(aura) { if (!AURAS.includes(aura)) return false; if (this.lastAura !== aura) { this.lastAura = aura; this.lastChangedAt = this.now(); } return true; }
  status() { return { auras: AURAS.slice(), lastAura: this.lastAura, lastChangedAt: this.lastChangedAt || null, lastDecision: this.lastDecision, minHoldMs: this.minHoldMs }; }
}
module.exports = { PaladinAuraPolicy, AURAS };

},
"src/party/telemetry-bridge.js": function(require,module,exports){
'use strict';

const TELEMETRY_PROTOCOL = 1;
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function clamp(value, min, max) { const n = finite(value); return n == null ? min : Math.max(min, Math.min(max, n)); }
class PartyTelemetryBridge {
  constructor(options = {}) {
    this.root = options.root || globalThis; this.now = options.now || (() => Date.now()); this.log = options.log || null; this.merchantName = options.merchantName || null; this.trustedNames = new Set((options.trustedNames || []).map(String)); this.sendIntervalMs = Math.max(2000, Math.min(60000, Number(options.sendIntervalMs) || 5000)); this.reportTtlMs = Math.max(this.sendIntervalMs * 2, Math.min(5 * 60 * 1000, Number(options.reportTtlMs) || 20000)); this.capacity = Math.max(4, Math.min(64, Number(options.capacity) || 16)); this.lastSentAt = 0; this.reports = new Map(); this.stats = { sent: 0, received: 0, rejected: 0, sendFailures: 0, expired: 0 }; this.installed = false; this.previousOnCm = null;
  }
  _event(event, data = {}, severity = 'info', reason = null) { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-telemetry', event, severity, reason, data }); }
  setTrustedNames(names) { this.trustedNames = new Set((names || []).filter(Boolean).map(String)); return [...this.trustedNames].sort(); }
  setMerchantName(name) { this.merchantName = name ? String(name) : null; return this.merchantName; }
  _character() { return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null; }
  installReceiver() { if (this.installed) return false; const root = this.root; if (!root) return false; this.previousOnCm = typeof root.on_cm === 'function' ? root.on_cm : null; const self = this; root.on_cm = function onPartyTelemetry(name, data) { try { self.receive(name, data); } catch (_) {} if (self.previousOnCm) return self.previousOnCm.apply(this, arguments); return undefined; }; this.installed = true; return true; }
  uninstallReceiver() { if (!this.installed || !this.root) return false; if (this.root.on_cm && this.root.on_cm.name === 'onPartyTelemetry') this.root.on_cm = this.previousOnCm || undefined; this.installed = false; return true; }
  _cleanReport(report, sender) {
    if (!report || report.type !== 'aio-v3-party-report' || Number(report.protocol) !== TELEMETRY_PROTOCOL) return null; const name = String(sender || report.name || ''); if (!name || (this.trustedNames.size && !this.trustedNames.has(name))) return null; const at = finite(report.at); if (at == null || Math.abs(this.now() - at) > this.reportTtlMs * 2) return null; const rates = report.rates && typeof report.rates === 'object' ? report.rates : {}; const safety = report.safety && typeof report.safety === 'object' ? report.safety : {};
    return { protocol: TELEMETRY_PROTOCOL, name, ctype: String(report.ctype || 'unknown').toLowerCase(), level: Math.max(0, finite(report.level) || 0), map: report.map == null ? null : String(report.map), targetMonster: report.targetMonster == null ? null : String(report.targetMonster), hpRatio: clamp(report.hpRatio, 0, 1), mpRatio: clamp(report.mpRatio, 0, 1), rip: report.rip === true, active: report.active !== false, rates: { xpPerHour: Math.max(0, finite(rates.xpPerHour) || 0), goldPerHour: finite(rates.goldPerHour) || 0, killsPerHour: Math.max(0, finite(rates.killsPerHour) || 0), deathsPerHour: Math.max(0, finite(rates.deathsPerHour) || 0), potionsPerHour: Math.max(0, finite(rates.potionsPerHour) || 0), damageTakenPerHour: Math.max(0, finite(rates.damageTakenPerHour) || 0) }, safety: { retreat: safety.retreat === true, emergency: safety.emergency === true, movementCircuitOpen: safety.movementCircuitOpen === true, skillFailureBackoffs: Math.max(0, finite(safety.skillFailureBackoffs) || 0) }, at };
  }
  receive(sender, data) { const clean = this._cleanReport(data, sender); if (!clean) { this.stats.rejected += 1; return false; } if (!this.reports.has(clean.name) && this.reports.size >= this.capacity) { const oldest = [...this.reports.entries()].sort((a, b) => a[1].at - b[1].at)[0]; if (oldest) this.reports.delete(oldest[0]); } this.reports.set(clean.name, clean); this.stats.received += 1; return true; }
  buildLocalReport(runtime) {
    const c = runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || this._character(); if (!c) return null; const perf = runtime && runtime.performance && runtime.performance.status().current; const rates = perf && perf.rates || {}; const farmer = runtime && typeof runtime.farmerStatus === 'function' ? runtime.farmerStatus() : {}; const movement = runtime && runtime.adapter && typeof runtime.adapter.stabilityStatus === 'function' ? runtime.adapter.stabilityStatus().movement : null; const local = runtime && runtime.localFarming && typeof runtime.localFarming.status === 'function' ? runtime.localFarming.status() : null;
    return { type: 'aio-v3-party-report', protocol: TELEMETRY_PROTOCOL, name: c.name, ctype: c.ctype, level: c.level, map: c.map, targetMonster: farmer && farmer.targetType || local && local.currentPlan && local.currentPlan.monster || null, hpRatio: c.max_hp > 0 ? c.hp / c.max_hp : 0, mpRatio: c.max_mp > 0 ? c.mp / c.max_mp : 0, rip: !!c.rip, active: true, rates: { xpPerHour: Math.max(0, finite(rates.xpPerHour) || 0), goldPerHour: finite(rates.goldPerHour) || 0, killsPerHour: Math.max(0, finite(rates.killsPerHour) || 0), deathsPerHour: Math.max(0, finite(rates.deathsPerHour) || 0), potionsPerHour: Math.max(0, finite(rates.potionsPerHour) || 0), damageTakenPerHour: Math.max(0, finite(rates.damageTakenPerHour) || 0) }, safety: { retreat: !!(runtime && runtime.pendingEmergencyRetreat), emergency: !!(runtime && runtime.lastEmergencyDisengage && this.now() - runtime.lastEmergencyDisengage.at < 10000), movementCircuitOpen: !!(movement && movement.circuitOpen), skillFailureBackoffs: Array.isArray(farmer && farmer.skillUsage && farmer.skillUsage.activeFailureBackoffs) ? farmer.skillUsage.activeFailureBackoffs.length : 0 }, at: this.now() };
  }
  tick(runtime) {
    this.prune(); const c = this._character(); if (!c || !this.merchantName || c.name === this.merchantName || this.now() - this.lastSentAt < this.sendIntervalMs) return false; const send = this.root && (this.root.send_cm || (this.root.parent && this.root.parent.send_cm)); if (typeof send !== 'function') return false; const report = this.buildLocalReport(runtime); if (!report) return false; this.lastSentAt = this.now();
    try { const pending = send.call(this.root, this.merchantName, report); Promise.resolve(pending).catch((error) => { this.stats.sendFailures += 1; this._event('PARTY_TELEMETRY_SEND_FAILED', { merchant: this.merchantName, message: String(error && error.message || error) }, 'warn', 'SEND_CM_FAILED'); }); this.stats.sent += 1; return true; }
    catch (error) { this.stats.sendFailures += 1; this._event('PARTY_TELEMETRY_SEND_FAILED', { merchant: this.merchantName, message: String(error && error.message || error) }, 'warn', 'SEND_CM_FAILED'); return false; }
  }
  prune() { const now = this.now(); for (const [name, report] of this.reports) if (now - report.at > this.reportTtlMs) { this.reports.delete(name); this.stats.expired += 1; } }
  aggregate(names = []) {
    this.prune(); const wanted = names.length ? new Set(names.map(String)) : null; const reports = [...this.reports.values()].filter((report) => !wanted || wanted.has(report.name)); const out = { freshReports: reports.length, xpPerHour: 0, goldPerHour: 0, killsPerHour: 0, deathsPerHour: 0, potionsPerHour: 0, damageTakenPerHour: 0, minHpRatio: reports.length ? 1 : null, minMpRatio: reports.length ? 1 : null, retreats: 0, emergencies: 0, movementCircuits: 0, skillFailureBackoffs: 0, reports: reports.map((report) => ({ ...report })) };
    for (const report of reports) { for (const key of ['xpPerHour', 'goldPerHour', 'killsPerHour', 'deathsPerHour', 'potionsPerHour', 'damageTakenPerHour']) out[key] += report.rates[key]; out.minHpRatio = Math.min(out.minHpRatio, report.hpRatio); out.minMpRatio = Math.min(out.minMpRatio, report.mpRatio); if (report.safety.retreat) out.retreats += 1; if (report.safety.emergency) out.emergencies += 1; if (report.safety.movementCircuitOpen) out.movementCircuits += 1; out.skillFailureBackoffs += report.safety.skillFailureBackoffs; } return out;
  }
  status() { this.prune(); return { protocol: TELEMETRY_PROTOCOL, merchantName: this.merchantName, sendIntervalMs: this.sendIntervalMs, reportTtlMs: this.reportTtlMs, trustedNames: [...this.trustedNames].sort(), reports: [...this.reports.values()].sort((a, b) => b.at - a.at), stats: { ...this.stats } }; }
}
module.exports = { PartyTelemetryBridge, TELEMETRY_PROTOCOL };

},
"src/party/transition-controller.js": function(require,module,exports){
'use strict';

const TransitionState = Object.freeze({
  IDLE: 'IDLE',
  PREFLIGHT: 'PREFLIGHT',
  STOPPING: 'STOPPING',
  STARTING: 'STARTING',
  PARTYING: 'PARTYING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
  RECOVERING: 'RECOVERING',
  RECOVERED: 'RECOVERED',
  FAILED_SAFE: 'FAILED_SAFE'
});

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function namesOf(members) {
  return (members || [])
    .map((member) => typeof member === 'string' ? member : member && member.name)
    .filter(Boolean)
    .map(String);
}

class PartyTransitionController {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.liveEnabled = options.liveEnabled === true;
    this.merchantName = options.merchantName || null;
    this.codeSlots = { ...(options.codeSlots || {}) };
    this.controlLease = options.controlLease || null;
    this.stepTimeoutMs = Math.max(3000, Math.min(120000, Number(options.stepTimeoutMs) || 20000));
    this.transitionLeaseMs = Math.max(15000, Math.min(10 * 60 * 1000, Number(options.transitionLeaseMs) || 90000));
    this.pollMs = Math.max(100, Math.min(5000, Number(options.pollMs) || 500));
    this.state = TransitionState.IDLE;
    this.active = null;
    this.lastResult = null;
    this.history = [];
    this.historyCapacity = Math.max(10, Math.min(100, Number(options.historyCapacity) || 30));
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'party-transition', event, severity, reason, data });
    }
  }

  setLiveEnabled(enabled) {
    this.liveEnabled = enabled === true;
    return this.liveEnabled;
  }

  setMerchantName(name) {
    this.merchantName = name ? String(name) : null;
    if (this.controlLease && typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(this.merchantName);
    return this.merchantName;
  }

  setCodeSlots(slots) {
    this.codeSlots = { ...(slots || {}) };
    return { ...this.codeSlots };
  }

  setControlLease(controlLease) {
    this.controlLease = controlLease || null;
    if (this.controlLease && typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(this.merchantName);
    return !!this.controlLease;
  }

  _function(name) {
    return this.root && (this.root[name] || (this.root.parent && this.root.parent[name])) || null;
  }

  _localCharacter() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _activeCharacters() {
    const fn = this._function('get_active_characters');
    if (typeof fn !== 'function') return null;
    try {
      const value = fn.call(this.root);
      return value && typeof value === 'object' ? value : null;
    } catch (_) {
      return null;
    }
  }

  _partyNames() {
    const parent = this.root && (this.root.parent || this.root);
    return Object.keys(parent && parent.party || {});
  }

  _isPresentState(value) {
    return ['self', 'starting', 'loading', 'active', 'code'].includes(String(value));
  }

  _isRunningState(value) {
    return ['self', 'active', 'code'].includes(String(value));
  }

  _controlLeaseStatus() {
    if (!this.controlLease || typeof this.controlLease.status !== 'function') return null;
    try { return this.controlLease.status(); } catch (_) { return null; }
  }

  preflight(plan, context = {}) {
    const local = this._localCharacter();
    const targetNames = namesOf(plan && plan.members);
    const currentNames = namesOf(context.currentMembers);
    const desiredMerchant = plan && plan.merchant && plan.merchant.name || this.merchantName;
    const registry = context.registryStatus || { characters: [] };
    const byName = new Map((registry.characters || []).map((entry) => [entry.name, entry]));
    const slotRequired = [...new Set(currentNames.concat(targetNames))].filter((name) => name !== desiredMerchant);
    const missingSlots = slotRequired.filter((name) => !this.codeSlots[name]);
    const unsafeOutgoing = currentNames
      .filter((name) => name !== desiredMerchant)
      .map((name) => byName.get(name))
      .filter((row) => row && (
        row.dead ||
        row.available !== true ||
        (row.stats && row.stats.hp != null && row.stats.max_hp > 0 && row.stats.hp / row.stats.max_hp < 0.6)
      ));
    const reasons = [];

    if (!this.liveEnabled) reasons.push('TRANSITIONS_DISABLED');
    if (context.runtimeMode !== 'active') reasons.push('RUNTIME_NOT_ACTIVE');
    if (!local || !desiredMerchant || local.name !== desiredMerchant) reasons.push('MERCHANT_CONTROLLER_REQUIRED');
    if (context.inCombat) reasons.push('ACTIVE_COMBAT');
    if (context.emergency) reasons.push('EMERGENCY_RECOVERY');
    if (!targetNames.includes(desiredMerchant)) reasons.push('MERCHANT_MUST_REMAIN');
    if (targetNames.length !== 4) reasons.push('PARTY_SIZE_MUST_BE_FOUR');
    if (new Set(targetNames).size !== targetNames.length) reasons.push('DUPLICATE_CHARACTER_NAME');
    if (missingSlots.length) reasons.push('MISSING_CODE_SLOT');
    if (unsafeOutgoing.length) reasons.push('UNSAFE_OUTGOING_CHARACTER');
    const active = this._activeCharacters();
    if (!active) reasons.push('ACTIVE_CHARACTER_STATE_UNAVAILABLE');
    if (context.requiresCrossMapRouting) reasons.push('CROSS_MAP_ROUTING_NOT_ALLOWED');

    const control = this._controlLeaseStatus();
    if (this.controlLease) {
      if (!control || control.installed !== true) reasons.push('PARTY_CONTROL_LEASE_NOT_READY');
      if (control && control.merchantName !== desiredMerchant) reasons.push('PARTY_CONTROL_MERCHANT_MISMATCH');
    }

    return {
      allowed: reasons.length === 0,
      reasons,
      targetNames,
      currentNames,
      merchantName: desiredMerchant,
      missingSlots,
      activeCharacters: active,
      controlLease: control
    };
  }

  async _waitUntil(predicate, timeoutMs, reason) {
    const started = this.now();
    while (this.now() - started <= timeoutMs) {
      try {
        if (predicate()) return true;
      } catch (_) {}
      await sleep(this.pollMs);
    }
    throw new Error(reason || 'TRANSITION_STEP_TIMEOUT');
  }

  async _stop(name) {
    const fn = this._function('stop_character');
    if (typeof fn !== 'function') throw new Error('STOP_CHARACTER_UNAVAILABLE');
    fn.call(this.root, name);
    await this._waitUntil(() => {
      const active = this._activeCharacters();
      return active && !this._isPresentState(active[name]);
    }, this.stepTimeoutMs, `STOP_VERIFY_TIMEOUT:${name}`);
  }

  async _start(name) {
    const fn = this._function('start_character');
    if (typeof fn !== 'function') throw new Error('START_CHARACTER_UNAVAILABLE');
    const slot = this.codeSlots[name];
    if (!slot) throw new Error(`MISSING_CODE_SLOT:${name}`);
    await Promise.resolve(fn.call(this.root, name, slot));
    await this._waitUntil(() => {
      const active = this._activeCharacters();
      return active && this._isRunningState(active[name]);
    }, this.stepTimeoutMs, `START_VERIFY_TIMEOUT:${name}`);
  }

  async _authorizeInvite(name, transactionId) {
    if (!this.controlLease || typeof this.controlLease.authorizeIncoming !== 'function') return { authorized: true, legacy: true };
    return this.controlLease.authorizeIncoming(name, transactionId);
  }

  async _invite(name, transactionId) {
    await this._authorizeInvite(name, transactionId);
    const fn = this._function('send_party_invite');
    if (typeof fn !== 'function') throw new Error('PARTY_INVITE_UNAVAILABLE');
    await Promise.resolve(fn.call(this.root, name));
  }

  async _recover(oldNames, newStarted, merchantName, transactionId) {
    this.state = TransitionState.RECOVERING;
    this._event('PARTY_SWITCH_RECOVERY', { oldNames, newStarted }, 'warn');

    for (const name of newStarted.slice().reverse()) {
      if (name === merchantName || oldNames.includes(name)) continue;
      try { await this._stop(name); } catch (_) {}
    }

    for (const name of oldNames) {
      if (name === merchantName) continue;
      const active = this._activeCharacters();
      if (active && this._isRunningState(active[name])) continue;
      try {
        await this._start(name);
      } catch (error) {
        this.state = TransitionState.FAILED_SAFE;
        return {
          recovered: false,
          reason: `ROLLBACK_START_FAILED:${name}`,
          error: String(error && error.message || error)
        };
      }
    }

    try {
      for (const name of oldNames) {
        if (name === merchantName || this._partyNames().includes(name)) continue;
        await this._invite(name, `${transactionId}:rollback`);
      }
      await this._waitUntil(() => {
        const party = new Set(this._partyNames().concat(merchantName));
        return oldNames.every((name) => party.has(name));
      }, this.stepTimeoutMs, 'ROLLBACK_PARTY_VERIFY_TIMEOUT');
    } catch (error) {
      this.state = TransitionState.FAILED_SAFE;
      return {
        recovered: false,
        reason: 'ROLLBACK_PARTY_FAILED',
        error: String(error && error.message || error)
      };
    }

    this.state = TransitionState.RECOVERED;
    return { recovered: true };
  }

  async execute(plan, context = {}) {
    if (this.active) return { executed: false, reason: 'TRANSITION_ALREADY_RUNNING' };
    this.state = TransitionState.PREFLIGHT;
    const preflight = this.preflight(plan, context);
    if (!preflight.allowed) {
      this.state = TransitionState.ABORTED;
      const result = {
        executed: false,
        state: this.state,
        reason: preflight.reasons[0],
        reasons: preflight.reasons,
        preflight
      };
      this._finish(result);
      this._event('PARTY_SWITCH_SUPPRESSED', { reasons: preflight.reasons }, 'warn', preflight.reasons[0]);
      return result;
    }

    const transaction = {
      id: `party-transition-${this.now()}`,
      startedAt: this.now(),
      targetNames: preflight.targetNames,
      oldNames: preflight.currentNames,
      stopped: [],
      started: []
    };
    this.active = transaction;
    this._event('PARTY_SWITCH_STARTED', { id: transaction.id, from: transaction.oldNames, to: transaction.targetNames });

    try {
      const deadline = transaction.startedAt + this.transitionLeaseMs;
      const target = new Set(transaction.targetNames);
      const outgoing = transaction.oldNames.filter((name) => name !== preflight.merchantName && !target.has(name));
      const incoming = transaction.targetNames.filter((name) => name !== preflight.merchantName && !transaction.oldNames.includes(name));

      this.state = TransitionState.STOPPING;
      for (const name of outgoing) {
        if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
        await this._stop(name);
        transaction.stopped.push(name);
      }

      this.state = TransitionState.STARTING;
      for (const name of incoming) {
        if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
        await this._start(name);
        transaction.started.push(name);
      }

      this.state = TransitionState.PARTYING;
      for (const name of transaction.targetNames) {
        if (name === preflight.merchantName) continue;
        if (!this._partyNames().includes(name)) {
          if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
          try {
            await this._invite(name, transaction.id);
          } catch (error) {
            throw new Error(`PARTY_INVITE_FAILED:${name}:${String(error && error.message || error)}`);
          }
        }
      }

      this.state = TransitionState.VERIFYING;
      await this._waitUntil(() => {
        const active = this._activeCharacters();
        if (!active) return false;
        const activeOk = transaction.targetNames.every((name) => name === preflight.merchantName || this._isRunningState(active[name]));
        const party = new Set(this._partyNames().concat(preflight.merchantName));
        const partyOk = transaction.targetNames.every((name) => party.has(name));
        const stateOk = typeof context.verifyTargetState === 'function'
          ? context.verifyTargetState(transaction.targetNames) === true
          : true;
        return activeOk && partyOk && stateOk;
      }, Math.min(this.stepTimeoutMs, Math.max(this.pollMs, deadline - this.now())), 'POSTCONDITION_VERIFY_TIMEOUT');

      if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
      this.state = TransitionState.COMPLETED;
      const result = {
        executed: true,
        state: this.state,
        id: transaction.id,
        from: transaction.oldNames,
        to: transaction.targetNames,
        durationMs: this.now() - transaction.startedAt
      };
      this._finish(result);
      this._event('PARTY_SWITCH_COMPLETED', result);
      return result;
    } catch (error) {
      this.state = TransitionState.ABORTED;
      const reason = String(error && error.message || error);
      this._event('PARTY_SWITCH_ABORTED', { id: transaction.id, reason }, 'error', reason);
      const recovery = await this._recover(transaction.oldNames, transaction.started, preflight.merchantName, transaction.id);
      const result = {
        executed: false,
        state: this.state,
        id: transaction.id,
        reason,
        recovery,
        durationMs: this.now() - transaction.startedAt
      };
      this._finish(result);
      return result;
    }
  }

  _finish(result) {
    this.lastResult = result;
    this.history.push(result);
    if (this.history.length > this.historyCapacity) this.history.splice(0, this.history.length - this.historyCapacity);
    this.active = null;
  }

  status() {
    return {
      liveEnabled: this.liveEnabled,
      state: this.state,
      merchantName: this.merchantName,
      transitionLeaseMs: this.transitionLeaseMs,
      stepTimeoutMs: this.stepTimeoutMs,
      configuredCodeSlots: Object.keys(this.codeSlots).sort(),
      controlLeaseBound: !!this.controlLease,
      controlLease: this._controlLeaseStatus(),
      crossMapRoutingAllowed: false,
      serverChangeAllowed: false,
      smartMoveAllowed: false,
      active: this.active ? { ...this.active } : null,
      lastResult: this.lastResult,
      recent: this.history.slice(-10)
    };
  }
}

module.exports = { PartyTransitionController, TransitionState };

},
"src/ops/background-execution-guard.js": function(require,module,exports){
'use strict';

class BackgroundExecutionGuard {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.expectedTickMs = Math.max(100, Number(options.expectedTickMs) || 250);
    this.driftThresholdMs = Math.max(1000, Math.min(60000, Number(options.driftThresholdMs) || 3000));
    this.rearmCooldownMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.rearmCooldownMs) || 30000));
    this.enabled = options.enabled !== false;
    this.lastTickAt = null;
    this.lastArmAt = 0;
    this.lastDriftMs = 0;
    this.stats = { armAttempts: 0, armSuccess: 0, armFailures: 0, driftEvents: 0, focusRearms: 0 };
    this.listenersInstalled = false;
    this.boundRearm = () => {
      if (!this.enabled) return;
      const now = this.now();
      if (this.lastArmAt && now - this.lastArmAt < Math.min(this.rearmCooldownMs, 5000)) return;
      this.stats.focusRearms += 1;
      this.arm('FOCUS_OR_VISIBILITY');
    };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'background-execution', event, severity, reason, data });
    }
  }

  _fn() {
    if (!this.root) return null;
    return this.root.performance_trick || (this.root.parent && this.root.parent.performance_trick) || null;
  }

  arm(reason = 'MANUAL') {
    if (!this.enabled) return { armed: false, reason: 'DISABLED' };
    const fn = this._fn();
    this.stats.armAttempts += 1;
    if (typeof fn !== 'function') {
      this.stats.armFailures += 1;
      return { armed: false, reason: 'PERFORMANCE_TRICK_UNAVAILABLE' };
    }
    try {
      const pending = fn.call(this.root);
      this.lastArmAt = this.now();
      this.stats.armSuccess += 1;
      this._event('BACKGROUND_EXECUTION_GUARD_ARMED', { reason, strategy: 'adventure-land-performance-trick' });
      if (pending && typeof pending.then === 'function') {
        Promise.resolve(pending).catch((error) => {
          this.stats.armFailures += 1;
          this._event('BACKGROUND_EXECUTION_GUARD_FAILED', { reason, message: String(error && error.message || error) }, 'warn', 'PERFORMANCE_TRICK_ASYNC_FAILED');
        });
      }
      return { armed: true, reason, strategy: 'adventure-land-performance-trick' };
    } catch (error) {
      this.stats.armFailures += 1;
      this._event('BACKGROUND_EXECUTION_GUARD_FAILED', { reason, message: String(error && error.message || error) }, 'warn', 'PERFORMANCE_TRICK_FAILED');
      return { armed: false, reason: 'PERFORMANCE_TRICK_FAILED' };
    }
  }

  installListeners() {
    if (this.listenersInstalled || !this.root) return false;
    const doc = this.root.document;
    if (doc && typeof doc.addEventListener === 'function') doc.addEventListener('visibilitychange', this.boundRearm);
    if (typeof this.root.addEventListener === 'function') this.root.addEventListener('focus', this.boundRearm);
    this.listenersInstalled = !!((doc && typeof doc.addEventListener === 'function') || typeof this.root.addEventListener === 'function');
    return this.listenersInstalled;
  }

  removeListeners() {
    if (!this.listenersInstalled || !this.root) return false;
    const doc = this.root.document;
    try {
      if (doc && typeof doc.removeEventListener === 'function') doc.removeEventListener('visibilitychange', this.boundRearm);
      if (typeof this.root.removeEventListener === 'function') this.root.removeEventListener('focus', this.boundRearm);
    } catch (_) {}
    this.listenersInstalled = false;
    return true;
  }

  noteTick() {
    const now = this.now();
    if (this.lastTickAt != null) {
      const drift = Math.max(0, now - this.lastTickAt - this.expectedTickMs);
      this.lastDriftMs = drift;
      if (drift >= this.driftThresholdMs) {
        this.stats.driftEvents += 1;
        this._event('BACKGROUND_EXECUTION_DRIFT', { driftMs: drift, expectedTickMs: this.expectedTickMs }, 'warn', 'TIMER_DRIFT');
        if (now - this.lastArmAt >= this.rearmCooldownMs) this.arm('TIMER_DRIFT');
      }
    }
    this.lastTickAt = now;
  }

  start() {
    this.installListeners();
    return this.arm('RUNTIME_START');
  }

  stop() {
    this.removeListeners();
    this.lastTickAt = null;
    return true;
  }

  setEnabled(enabled) {
    this.enabled = enabled === true;
    return this.enabled;
  }

  status() {
    return {
      enabled: this.enabled,
      strategy: 'adventure-land-performance-trick',
      guarantee: false,
      listenersInstalled: this.listenersInstalled,
      functionAvailable: typeof this._fn() === 'function',
      lastArmAt: this.lastArmAt || null,
      lastDriftMs: this.lastDriftMs,
      expectedTickMs: this.expectedTickMs,
      driftThresholdMs: this.driftThresholdMs,
      rearmCooldownMs: this.rearmCooldownMs,
      stats: { ...this.stats }
    };
  }
}

module.exports = { BackgroundExecutionGuard };

},
"src/party/control-lease.js": function(require,module,exports){
'use strict';

const PARTY_CONTROL_PROTOCOL = 1;
const PARTY_CONTROL_TYPE = 'aio-v3-party-control';
const PartyControlAction = Object.freeze({
  ALLOW_PARTY_INVITE: 'ALLOW_PARTY_INVITE',
  LEASE_ACK: 'LEASE_ACK'
});

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function cleanName(value) { const name = String(value == null ? '' : value).trim(); return name || null; }
function cleanTransactionId(value) {
  const id = String(value == null ? '' : value).trim();
  if (!id || id.length > 128) return null;
  return id;
}

class PartyControlLease {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.merchantName = cleanName(options.merchantName);
    this.trustedNames = new Set((options.trustedNames || []).map(cleanName).filter(Boolean));
    this.leaseMs = Math.max(5000, Math.min(60000, Number(options.leaseMs) || 15000));
    this.ackTimeoutMs = Math.max(1000, Math.min(15000, Number(options.ackTimeoutMs) || 5000));
    this.pollMs = Math.max(50, Math.min(1000, Number(options.pollMs) || 100));
    this.maxClockSkewMs = Math.max(1000, Math.min(10000, Number(options.maxClockSkewMs) || 3000));
    this.activeLease = null;
    this.acks = new Map();
    this.installed = false;
    this.previousOnCm = null;
    this.previousOnPartyInvite = null;
    this.stats = {
      leasesSent: 0,
      leasesReceived: 0,
      leaseAcksSent: 0,
      leaseAcksReceived: 0,
      controlRejected: 0,
      inviteAccepted: 0,
      inviteRejected: 0,
      acceptFailures: 0,
      ackTimeouts: 0
    };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'party-control', event, severity, reason, data });
    }
  }

  _function(name) {
    if (!this.root) return null;
    return this.root[name] || (this.root.parent && this.root.parent[name]) || null;
  }

  _character() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _localName() {
    const character = this._character();
    return cleanName(character && character.name);
  }

  setMerchantName(name) {
    this.merchantName = cleanName(name);
    return this.merchantName;
  }

  setTrustedNames(names) {
    this.trustedNames = new Set((names || []).map(cleanName).filter(Boolean));
    return [...this.trustedNames].sort();
  }

  _isTrusted(name) {
    const resolved = cleanName(name);
    return !!resolved && this.trustedNames.has(resolved);
  }

  _isControlMessage(data) {
    return !!data && data.type === PARTY_CONTROL_TYPE && Number(data.protocol) === PARTY_CONTROL_PROTOCOL;
  }

  _ackKey(transactionId, target) {
    return `${transactionId}:${target}`;
  }

  _prune() {
    const now = this.now();
    if (this.activeLease && this.activeLease.expiresAt <= now) {
      this._event('PARTY_CONTROL_LEASE_EXPIRED', { transactionId: this.activeLease.transactionId, target: this.activeLease.target }, 'warn', 'LEASE_EXPIRED');
      this.activeLease = null;
    }
    for (const [key, at] of this.acks) {
      if (now - at > this.ackTimeoutMs * 2) this.acks.delete(key);
    }
  }

  _reject(reason, data = {}) {
    this.stats.controlRejected += 1;
    this._event('PARTY_CONTROL_REJECTED', data, 'warn', reason);
    return false;
  }

  async _send(name, payload) {
    const send = this._function('send_cm');
    if (typeof send !== 'function') throw new Error('SEND_CM_UNAVAILABLE');
    return Promise.resolve(send.call(this.root, name, payload));
  }

  _validateLeaseEnvelope(sender, data) {
    const now = this.now();
    const localName = this._localName();
    const senderName = cleanName(sender);
    const target = cleanName(data && data.target);
    const transactionId = cleanTransactionId(data && data.transactionId);
    const issuedAt = finite(data && data.issuedAt);
    const expiresAt = finite(data && data.expiresAt);
    if (!localName) return { ok: false, reason: 'LOCAL_CHARACTER_UNAVAILABLE' };
    if (!this.merchantName || senderName !== this.merchantName) return { ok: false, reason: 'UNTRUSTED_MERCHANT' };
    if (!this._isTrusted(senderName) || !this._isTrusted(localName)) return { ok: false, reason: 'UNTRUSTED_ROSTER_MEMBER' };
    if (!target || target !== localName) return { ok: false, reason: 'LEASE_TARGET_MISMATCH' };
    if (!transactionId) return { ok: false, reason: 'INVALID_TRANSACTION_ID' };
    if (issuedAt == null || expiresAt == null) return { ok: false, reason: 'INVALID_LEASE_TIME' };
    if (issuedAt > now + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_FROM_FUTURE' };
    if (now - issuedAt > this.leaseMs + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_TOO_OLD' };
    if (expiresAt <= now) return { ok: false, reason: 'LEASE_EXPIRED' };
    if (expiresAt - issuedAt > this.leaseMs + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_TOO_LONG' };
    if (expiresAt - now > this.leaseMs + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_EXPIRY_TOO_FAR' };
    return { ok: true, senderName, localName, target, transactionId, issuedAt, expiresAt };
  }

  receive(sender, data) {
    if (!this._isControlMessage(data)) return false;
    this._prune();
    const action = String(data.action || '');
    if (action === PartyControlAction.ALLOW_PARTY_INVITE) {
      const validation = this._validateLeaseEnvelope(sender, data);
      if (!validation.ok) return this._reject(validation.reason, { sender: cleanName(sender), action, target: cleanName(data.target) });
      this.activeLease = {
        merchantName: validation.senderName,
        target: validation.target,
        transactionId: validation.transactionId,
        issuedAt: validation.issuedAt,
        expiresAt: validation.expiresAt
      };
      this.stats.leasesReceived += 1;
      this._event('PARTY_CONTROL_LEASE_RECEIVED', { transactionId: validation.transactionId, target: validation.target, expiresAt: validation.expiresAt });
      const ack = {
        type: PARTY_CONTROL_TYPE,
        protocol: PARTY_CONTROL_PROTOCOL,
        action: PartyControlAction.LEASE_ACK,
        merchantName: validation.senderName,
        target: validation.target,
        transactionId: validation.transactionId,
        at: this.now()
      };
      try {
        const pending = this._send(validation.senderName, ack);
        this.stats.leaseAcksSent += 1;
        Promise.resolve(pending).catch((error) => {
          this._event('PARTY_CONTROL_ACK_SEND_FAILED', { transactionId: validation.transactionId, message: String(error && error.message || error) }, 'warn', 'ACK_SEND_FAILED');
        });
      } catch (error) {
        this._event('PARTY_CONTROL_ACK_SEND_FAILED', { transactionId: validation.transactionId, message: String(error && error.message || error) }, 'warn', 'ACK_SEND_FAILED');
      }
      return true;
    }

    if (action === PartyControlAction.LEASE_ACK) {
      const localName = this._localName();
      const senderName = cleanName(sender);
      const target = cleanName(data.target);
      const transactionId = cleanTransactionId(data.transactionId);
      if (!localName || !this.merchantName || localName !== this.merchantName) return this._reject('ACK_NOT_ON_MERCHANT', { sender: senderName, target });
      if (!senderName || senderName !== target || !this._isTrusted(senderName) || !this._isTrusted(localName)) return this._reject('ACK_UNTRUSTED_TARGET', { sender: senderName, target });
      if (cleanName(data.merchantName) !== localName || !transactionId) return this._reject('ACK_MISMATCH', { sender: senderName, target });
      const at = finite(data.at);
      if (at == null || Math.abs(this.now() - at) > this.leaseMs + this.maxClockSkewMs) return this._reject('ACK_STALE', { sender: senderName, target });
      this.acks.set(this._ackKey(transactionId, senderName), this.now());
      this.stats.leaseAcksReceived += 1;
      this._event('PARTY_CONTROL_ACK_RECEIVED', { transactionId, target: senderName });
      return true;
    }

    return this._reject('UNKNOWN_CONTROL_ACTION', { action, sender: cleanName(sender) });
  }

  async authorizeIncoming(targetName, transactionId) {
    this._prune();
    const target = cleanName(targetName);
    const tx = cleanTransactionId(transactionId);
    const localName = this._localName();
    if (!target || !tx) throw new Error('INVALID_PARTY_CONTROL_REQUEST');
    if (!this.merchantName || localName !== this.merchantName) throw new Error('MERCHANT_CONTROLLER_REQUIRED');
    if (!this._isTrusted(localName) || !this._isTrusted(target)) throw new Error(`UNTRUSTED_PARTY_CONTROL_TARGET:${target}`);
    if (target === localName) return { authorized: true, target, transactionId: tx, local: true };
    const issuedAt = this.now();
    const expiresAt = issuedAt + this.leaseMs;
    const key = this._ackKey(tx, target);
    this.acks.delete(key);
    await this._send(target, {
      type: PARTY_CONTROL_TYPE,
      protocol: PARTY_CONTROL_PROTOCOL,
      action: PartyControlAction.ALLOW_PARTY_INVITE,
      merchantName: localName,
      target,
      transactionId: tx,
      issuedAt,
      expiresAt
    });
    this.stats.leasesSent += 1;
    this._event('PARTY_CONTROL_LEASE_SENT', { transactionId: tx, target, expiresAt });
    const startedAt = this.now();
    while (this.now() - startedAt <= this.ackTimeoutMs) {
      this._prune();
      if (this.acks.has(key)) {
        this.acks.delete(key);
        return { authorized: true, target, transactionId: tx, expiresAt };
      }
      await sleep(this.pollMs);
    }
    this.stats.ackTimeouts += 1;
    this._event('PARTY_CONTROL_ACK_TIMEOUT', { transactionId: tx, target }, 'warn', 'ACK_TIMEOUT');
    throw new Error(`PARTY_CONTROL_ACK_TIMEOUT:${target}`);
  }

  _validInviteLease(inviter) {
    this._prune();
    const inviterName = cleanName(inviter);
    const localName = this._localName();
    const lease = this.activeLease;
    return !!lease && !!localName && inviterName === lease.merchantName && inviterName === this.merchantName && localName === lease.target && this._isTrusted(inviterName) && this._isTrusted(localName) && lease.expiresAt > this.now();
  }

  _handleInvite(inviter) {
    const inviterName = cleanName(inviter);
    if (!this.merchantName || inviterName !== this.merchantName) return false;
    if (!this._validInviteLease(inviterName)) {
      this.stats.inviteRejected += 1;
      this._event('PARTY_CONTROL_INVITE_REJECTED', { inviter: inviterName, target: this._localName() }, 'warn', 'NO_VALID_CONTROL_LEASE');
      return true;
    }
    const lease = this.activeLease;
    this.activeLease = null;
    const accept = this._function('accept_party_invite');
    if (typeof accept !== 'function') {
      this.stats.acceptFailures += 1;
      this._event('PARTY_CONTROL_INVITE_ACCEPT_FAILED', { inviter: inviterName, transactionId: lease.transactionId }, 'error', 'ACCEPT_PARTY_INVITE_UNAVAILABLE');
      return true;
    }
    try {
      const pending = accept.call(this.root, inviterName);
      this.stats.inviteAccepted += 1;
      this._event('PARTY_CONTROL_INVITE_ACCEPTED', { inviter: inviterName, target: lease.target, transactionId: lease.transactionId });
      Promise.resolve(pending).catch((error) => {
        this.stats.acceptFailures += 1;
        this._event('PARTY_CONTROL_INVITE_ACCEPT_FAILED', { inviter: inviterName, transactionId: lease.transactionId, message: String(error && error.message || error) }, 'error', 'ACCEPT_PARTY_INVITE_FAILED');
      });
    } catch (error) {
      this.stats.acceptFailures += 1;
      this._event('PARTY_CONTROL_INVITE_ACCEPT_FAILED', { inviter: inviterName, transactionId: lease.transactionId, message: String(error && error.message || error) }, 'error', 'ACCEPT_PARTY_INVITE_FAILED');
    }
    return true;
  }

  install() {
    if (this.installed || !this.root) return false;
    const self = this;
    this.previousOnCm = typeof this.root.on_cm === 'function' ? this.root.on_cm : null;
    this.previousOnPartyInvite = typeof this.root.on_party_invite === 'function' ? this.root.on_party_invite : null;
    this.root.on_cm = function onPartyControlMessage(name, data) {
      if (self._isControlMessage(data)) {
        self.receive(name, data);
        return undefined;
      }
      if (self.previousOnCm) return self.previousOnCm.apply(this, arguments);
      return undefined;
    };
    this.root.on_party_invite = function onPartyControlInvite(name) {
      if (self._handleInvite(name)) return undefined;
      if (self.previousOnPartyInvite) return self.previousOnPartyInvite.apply(this, arguments);
      return undefined;
    };
    this.installed = true;
    return true;
  }

  uninstall() {
    if (!this.installed || !this.root) return false;
    if (this.root.on_cm && this.root.on_cm.name === 'onPartyControlMessage') this.root.on_cm = this.previousOnCm || undefined;
    if (this.root.on_party_invite && this.root.on_party_invite.name === 'onPartyControlInvite') this.root.on_party_invite = this.previousOnPartyInvite || undefined;
    this.installed = false;
    this.activeLease = null;
    this.acks.clear();
    return true;
  }

  status() {
    this._prune();
    return {
      protocol: PARTY_CONTROL_PROTOCOL,
      type: PARTY_CONTROL_TYPE,
      installed: this.installed,
      merchantName: this.merchantName,
      trustedNames: [...this.trustedNames].sort(),
      leaseMs: this.leaseMs,
      ackTimeoutMs: this.ackTimeoutMs,
      activeLease: this.activeLease ? { ...this.activeLease } : null,
      pendingAcks: this.acks.size,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  PartyControlLease,
  PARTY_CONTROL_PROTOCOL,
  PARTY_CONTROL_TYPE,
  PartyControlAction
};

},
"src/autonomy/alpha13-runtime.js": function(require,module,exports){
'use strict';

const { Alpha12Runtime } = require('./alpha12-hardened-runtime');
const { GlobalSupervisor } = require('../stability/global-supervisor');
const { ContentDriftMonitor } = require('../world/content-drift');

const ALPHA13_VERSION = '3.0.0-alpha.13.0';

class Alpha13Runtime extends Alpha12Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA13_VERSION;
    this.contentDriftScanMs = Math.max(1000, Math.min(60000, Number(options.contentDriftScanMs) || 5000));
    this.supervisorIntervalMs = Math.max(500, Math.min(30000, Number(options.globalSupervisorIntervalMs) || 1000));
    this.lastContentDriftScanAt = -Infinity;
    this.lastSupervisorAt = -Infinity;
    this.lastContentDriftResult = null;
    this.lastSupervisorResult = null;

    this.contentDrift = options.contentDrift || new ContentDriftMonitor({
      root: this.root,
      storage: options.contentDriftStorage || options.storage,
      now: this.now,
      log: this.log,
      capacity: options.contentDriftCapacity,
      scanBudget: options.contentDriftScanBudget,
      minObservedSamples: options.contentDriftMinObservedSamples,
      minSaveMs: options.contentDriftSaveMs
    });
    this.contentDrift.load();

    this.globalSupervisor = options.globalSupervisor || new GlobalSupervisor({
      now: this.now,
      log: this.log,
      safeActionsEnabled: options.globalSupervisorSafeActionsEnabled === true,
      watchAfterMs: options.globalSupervisorWatchAfterMs,
      degradedAfterMs: options.globalSupervisorDegradedAfterMs,
      safeModeAfterMs: options.globalSupervisorSafeModeAfterMs,
      quarantineAfterMs: options.globalSupervisorQuarantineAfterMs,
      minMovementProgress: options.globalSupervisorMinMovementProgress,
      recoveryCooldownMs: options.globalSupervisorRecoveryCooldownMs,
      recoveryWindowMs: options.globalSupervisorRecoveryWindowMs,
      maxRecoveriesPerWindow: options.globalSupervisorMaxRecoveriesPerWindow
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA13_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _scanContentDrift() {
    if (!this.lastSnapshot || !this.lastSnapshot.character) return null;
    const gameData = this.adapter.getGameData() || {};
    const result = this.contentDrift.scan(this.lastSnapshot, gameData);
    this.lastContentDriftResult = result;
    for (const change of result && result.changes || []) {
      if (change.category !== 'monsters') continue;
      if (change.kind !== 'DRIFT' && change.kind !== 'NOVELTY') continue;
      try {
        this.combatRisk.quarantineMonsterType(this.world, change.id);
        this.log.emit({
          component: 'content-drift', event: 'CONTENT_MONSTER_FAIL_CLOSED', severity: 'warn',
          reason: change.kind === 'DRIFT' ? 'MONSTER_DEFINITION_CHANGED' : 'NEW_MONSTER_AFTER_BASELINE',
          data: { monster: change.id, fingerprint: change.fingerprint }
        });
      } catch (error) {
        this.log.emit({
          component: 'content-drift', event: 'CONTENT_MONSTER_FAIL_CLOSED_FAILED', severity: 'error', reason: 'QUARANTINE_WRITE_FAILED',
          data: { monster: change.id, message: String(error && error.message || error) }
        });
      }
    }
    return result;
  }

  _evaluateGlobalSupervisor() {
    const baseStatus = super.status();
    const result = this.globalSupervisor.observe({ runtime: this, status: baseStatus, contentDrift: this.contentDrift.status() });
    this.lastSupervisorResult = result;
    return result;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastContentDriftScanAt >= this.contentDriftScanMs) {
      this.lastContentDriftScanAt = now;
      this._scanContentDrift();
    }
    if (now - this.lastSupervisorAt >= this.supervisorIntervalMs) {
      this.lastSupervisorAt = now;
      this._evaluateGlobalSupervisor();
    }
  }

  stop() {
    if (this.contentDrift) this.contentDrift.save({ force: true });
    return super.stop();
  }

  setSupervisorSafeActionsEnabled(enabled) { return this.globalSupervisor.setSafeActionsEnabled(enabled); }
  quarantineSubsystem(name, reason) { return this.globalSupervisor.quarantineSubsystem(name, reason); }
  clearSubsystemQuarantine(name) { return this.globalSupervisor.clearSubsystemQuarantine(name); }
  markContentRevalidated(category, id) { return this.contentDrift.markRevalidated(category, id); }

  status() {
    const base = super.status();
    return { ...base, version: ALPHA13_VERSION, supervisor: this.globalSupervisor.status(), contentDrift: this.contentDrift.status() };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.supervisor = this.globalSupervisor.status();
    base.context.contentDrift = { status: this.contentDrift.status(), recent: this.contentDrift.list(200) };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha13Runtime, ALPHA13_VERSION };

},
"src/stability/global-supervisor.js": function(require,module,exports){
'use strict';

const HealthState = Object.freeze({
  HEALTHY: 'HEALTHY',
  WATCH: 'WATCH',
  DEGRADED: 'DEGRADED',
  RECOVERY: 'RECOVERY',
  SAFE_MODE: 'SAFE_MODE',
  QUARANTINE: 'QUARANTINE'
});

const RANK = Object.freeze({
  [HealthState.HEALTHY]: 0,
  [HealthState.WATCH]: 1,
  [HealthState.DEGRADED]: 2,
  [HealthState.RECOVERY]: 3,
  [HealthState.SAFE_MODE]: 4,
  [HealthState.QUARANTINE]: 5
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class GlobalSupervisor {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.safeActionsEnabled = options.safeActionsEnabled === true;
    this.watchAfterMs = clamp(options.watchAfterMs || 15000, 1000, 30 * 60 * 1000);
    this.degradedAfterMs = clamp(options.degradedAfterMs || 45000, this.watchAfterMs, 60 * 60 * 1000);
    this.safeModeAfterMs = clamp(options.safeModeAfterMs || 120000, this.degradedAfterMs, 2 * 60 * 60 * 1000);
    this.quarantineAfterMs = clamp(options.quarantineAfterMs || 300000, this.safeModeAfterMs, 6 * 60 * 60 * 1000);
    this.minMovementProgress = clamp(options.minMovementProgress || 25, 5, 500);
    this.recoveryCooldownMs = clamp(options.recoveryCooldownMs || 30000, 1000, 30 * 60 * 1000);
    this.recoveryWindowMs = clamp(options.recoveryWindowMs || 10 * 60 * 1000, this.recoveryCooldownMs, 24 * 60 * 60 * 1000);
    this.maxRecoveriesPerWindow = Math.max(1, Math.min(20, Math.floor(finite(options.maxRecoveriesPerWindow, 3))));
    this.state = HealthState.HEALTHY;
    this.reasons = [];
    this.subsystems = {};
    this.lastEvaluatedAt = null;
    this.lastProgressAt = null;
    this.progressAnchor = null;
    this.lastRecoveryAt = null;
    this.recoveries = [];
    this.manualQuarantines = new Map();
    this.stats = { evaluations: 0, transitions: 0, safeFallbacks: 0, safeFallbackFailures: 0, budgetBlocks: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'global-supervisor', event, severity, reason, data });
  }

  _probe(status) {
    const c = status && status.character;
    if (!c) return null;
    return {
      map: c.map || null,
      x: finite(c.x != null ? c.x : c.real_x, 0),
      y: finite(c.y != null ? c.y : c.real_y, 0),
      xp: finite(c.xp, 0),
      gold: finite(c.gold, 0),
      rip: c.rip === true
    };
  }

  _activeWork(status) {
    if (!status || status.running !== true || status.mode !== 'active') return false;
    const c = status.character;
    if (!c || c.rip === true) return false;
    const farmer = status.farmer || {};
    const transition = status.party && status.party.transition;
    const partyActive = !!(transition && (transition.active === true || !['IDLE', 'READY', 'COMPLETED'].includes(String(transition.state || 'IDLE'))));
    return farmer.enabled === true || partyActive;
  }

  _noteProgress(status) {
    const now = this.now();
    const probe = this._probe(status);
    if (!probe || !this._activeWork(status)) {
      this.progressAnchor = probe;
      this.lastProgressAt = now;
      return { active: false, progressed: true, ageMs: 0 };
    }
    if (!this.progressAnchor) {
      this.progressAnchor = probe;
      this.lastProgressAt = now;
      return { active: true, progressed: true, ageMs: 0 };
    }
    const anchor = this.progressAnchor;
    const distance = Math.hypot(probe.x - anchor.x, probe.y - anchor.y);
    const progressed = probe.map !== anchor.map || probe.xp > anchor.xp || probe.gold > anchor.gold || distance >= this.minMovementProgress;
    if (progressed) {
      this.progressAnchor = probe;
      this.lastProgressAt = now;
    }
    if (this.lastProgressAt == null) this.lastProgressAt = now;
    return { active: true, progressed, ageMs: Math.max(0, now - this.lastProgressAt), distance };
  }

  _progressState(progress) {
    if (!progress.active) return { state: HealthState.HEALTHY, reasons: [] };
    const age = progress.ageMs;
    if (age >= this.quarantineAfterMs) return { state: HealthState.QUARANTINE, reasons: ['NO_PROGRESS_QUARANTINE'] };
    if (age >= this.safeModeAfterMs) return { state: HealthState.SAFE_MODE, reasons: ['NO_PROGRESS_SAFE_MODE'] };
    if (age >= this.degradedAfterMs) return { state: HealthState.DEGRADED, reasons: ['NO_PROGRESS_DEGRADED'] };
    if (age >= this.watchAfterMs) return { state: HealthState.WATCH, reasons: ['NO_PROGRESS_WATCH'] };
    return { state: HealthState.HEALTHY, reasons: [] };
  }

  _subsystemState(status, contentDrift, progress) {
    const result = {};
    const movement = status && status.stability && status.stability.commandOutcomes && status.stability.commandOutcomes.movement;
    result.combat = movement && movement.circuitOpen
      ? { state: HealthState.DEGRADED, reasons: ['MOVEMENT_CIRCUIT_OPEN'] }
      : { state: HealthState.HEALTHY, reasons: [] };

    const persistence = status && status.persistence || {};
    if (finite(persistence.loadFailureStreak) >= 5 || finite(persistence.saveFailureStreak) >= 8) {
      result.persistence = { state: HealthState.SAFE_MODE, reasons: ['PERSISTENCE_FAILURE_BUDGET_EXCEEDED'] };
    } else if (persistence.saveCircuitOpen === true || finite(persistence.loadFailureStreak) >= 3 || finite(persistence.saveFailureStreak) >= 3) {
      result.persistence = { state: HealthState.DEGRADED, reasons: ['PERSISTENCE_UNHEALTHY'] };
    } else result.persistence = { state: HealthState.HEALTHY, reasons: [] };

    const transition = status && status.party && status.party.transition || {};
    if (String(transition.state || '') === 'FAILED_SAFE') result.party = { state: HealthState.QUARANTINE, reasons: ['PARTY_TRANSITION_FAILED_SAFE'] };
    else if (transition.active === true && transition.leaseExpired === true) result.party = { state: HealthState.DEGRADED, reasons: ['PARTY_TRANSITION_LEASE_EXPIRED'] };
    else result.party = { state: HealthState.HEALTHY, reasons: [] };

    const brain = status && status.brain || {};
    result.brain = String(brain.quality && brain.quality.state || brain.qualityState || brain.quality || '').toUpperCase().includes('QUARANTINED')
      ? { state: HealthState.QUARANTINE, reasons: ['BRAIN_QUARANTINED'] }
      : { state: HealthState.HEALTHY, reasons: [] };

    const quarantined = finite(contentDrift && contentDrift.counts && contentDrift.counts.QUARANTINED, 0);
    result.content = quarantined > 0
      ? { state: HealthState.WATCH, reasons: ['CONTENT_REVALIDATION_REQUIRED'] }
      : { state: HealthState.HEALTHY, reasons: [] };

    result.progress = this._progressState(progress);

    for (const [name, record] of this.manualQuarantines.entries()) {
      result[name] = { state: HealthState.QUARANTINE, reasons: ['MANUAL_QUARANTINE', record.reason].filter(Boolean) };
    }
    return result;
  }

  _overall(subsystems) {
    let state = HealthState.HEALTHY;
    const reasons = [];
    const critical = ['progress', 'combat', 'persistence'];
    for (const name of critical) {
      const row = subsystems[name];
      if (!row) continue;
      if (RANK[row.state] > RANK[state]) state = row.state;
      reasons.push(...row.reasons);
    }
    const party = subsystems.party;
    if (party) {
      const capped = party.state === HealthState.QUARANTINE ? HealthState.DEGRADED : party.state;
      if (RANK[capped] > RANK[state]) state = capped;
      reasons.push(...party.reasons);
    }
    for (const name of ['brain', 'content']) {
      const row = subsystems[name];
      if (!row) continue;
      const capped = row.state === HealthState.HEALTHY ? HealthState.HEALTHY : HealthState.WATCH;
      if (RANK[capped] > RANK[state]) state = capped;
      reasons.push(...row.reasons);
    }
    for (const [name, row] of Object.entries(subsystems)) {
      if (['progress', 'combat', 'persistence', 'party', 'brain', 'content'].includes(name)) continue;
      if (RANK[row.state] > RANK[state]) state = row.state;
      reasons.push(...row.reasons);
    }
    return { state, reasons: [...new Set(reasons)] };
  }

  _pruneRecoveries(now) {
    this.recoveries = this.recoveries.filter((row) => now - row.at <= this.recoveryWindowMs);
  }

  _canRecover(now) {
    this._pruneRecoveries(now);
    if (this.lastRecoveryAt != null && now - this.lastRecoveryAt < this.recoveryCooldownMs) return { allowed: false, reason: 'RECOVERY_COOLDOWN' };
    if (this.recoveries.length >= this.maxRecoveriesPerWindow) return { allowed: false, reason: 'RECOVERY_BUDGET_EXHAUSTED' };
    return { allowed: true, reason: null };
  }

  _applySafeFallback(runtime, triggerState, reasons) {
    const now = this.now();
    const budget = this._canRecover(now);
    if (!budget.allowed) {
      this.stats.budgetBlocks += 1;
      this._event('SUPERVISOR_RECOVERY_SUPPRESSED', 'warn', budget.reason, { triggerState, reasons, recoveriesInWindow: this.recoveries.length });
      return { executed: false, reason: budget.reason, actions: [] };
    }
    const actions = [];
    const call = (name, fn) => {
      try {
        if (typeof fn !== 'function') return;
        fn();
        actions.push(name);
      } catch (error) {
        this.stats.safeFallbackFailures += 1;
        this._event('SUPERVISOR_SAFE_ACTION_FAILED', 'error', name, { message: String(error && error.message || error) });
      }
    };
    call('PARTY_TRANSITIONS_OFF', runtime && typeof runtime.setPartyTransitionsEnabled === 'function' ? () => runtime.setPartyTransitionsEnabled(false) : null);
    call('PARTY_AURA_OFF', runtime && typeof runtime.setPartyAuraAutomationEnabled === 'function' ? () => runtime.setPartyAuraAutomationEnabled(false) : null);
    call('PARTY_EXPLORATION_OFF', runtime && typeof runtime.setPartyExplorationEnabled === 'function' ? () => runtime.setPartyExplorationEnabled(false) : null);
    call('FARMER_OFF', runtime && typeof runtime.setFarmerEnabled === 'function' ? () => runtime.setFarmerEnabled(false) : null);
    call('RUNTIME_SHADOW', runtime && typeof runtime.setMode === 'function' ? () => runtime.setMode('shadow') : null);
    this.lastRecoveryAt = now;
    const row = { at: now, triggerState, reasons: reasons.slice(0, 16), actions };
    this.recoveries.push(row);
    this.stats.safeFallbacks += 1;
    this._event('SUPERVISOR_SAFE_FALLBACK_APPLIED', 'warn', 'SAFETY_REDUCTION_ONLY', row);
    return { executed: true, reason: 'SAFETY_REDUCTION_ONLY', actions };
  }

  observe(context = {}) {
    const now = this.now();
    const status = context.status || {};
    const progress = this._noteProgress(status);
    const subsystems = this._subsystemState(status, context.contentDrift || null, progress);
    const overall = this._overall(subsystems);
    let recovery = { executed: false, reason: this.safeActionsEnabled ? 'NOT_REQUIRED' : 'SAFE_ACTIONS_DISABLED', actions: [] };
    if (this.safeActionsEnabled && RANK[overall.state] >= RANK[HealthState.SAFE_MODE]) recovery = this._applySafeFallback(context.runtime, overall.state, overall.reasons);

    const previous = this.state;
    this.state = overall.state;
    if (overall.state === HealthState.HEALTHY && this.lastRecoveryAt != null && now - this.lastRecoveryAt < this.recoveryCooldownMs) this.state = HealthState.RECOVERY;
    this.reasons = overall.reasons;
    this.subsystems = subsystems;
    this.lastEvaluatedAt = now;
    this.stats.evaluations += 1;
    if (previous !== this.state) {
      this.stats.transitions += 1;
      this._event('SUPERVISOR_STATE_CHANGED', this.state === HealthState.HEALTHY ? 'info' : 'warn', this.reasons[0] || null, { from: previous, to: this.state, reasons: this.reasons });
    }
    return { state: this.state, reasons: this.reasons.slice(), progress, recovery };
  }

  setSafeActionsEnabled(enabled) {
    this.safeActionsEnabled = enabled === true;
    this._event('SUPERVISOR_SAFE_ACTIONS_CHANGED', 'info', null, { enabled: this.safeActionsEnabled });
    return this.safeActionsEnabled;
  }

  quarantineSubsystem(name, reason = 'MANUAL') {
    const key = String(name || '').trim();
    if (!key) return false;
    this.manualQuarantines.set(key, { at: this.now(), reason: String(reason || 'MANUAL') });
    this._event('SUPERVISOR_SUBSYSTEM_QUARANTINED', 'warn', reason, { subsystem: key });
    return true;
  }

  clearSubsystemQuarantine(name) {
    const key = String(name || '').trim();
    const cleared = this.manualQuarantines.delete(key);
    if (cleared) this._event('SUPERVISOR_SUBSYSTEM_QUARANTINE_CLEARED', 'info', null, { subsystem: key });
    return cleared;
  }

  status() {
    const now = this.now();
    this._pruneRecoveries(now);
    return {
      schemaVersion: 1,
      state: this.state,
      reasons: this.reasons.slice(),
      safeActionsEnabled: this.safeActionsEnabled,
      actionAuthority: this.safeActionsEnabled,
      actionScope: 'safety-reduction-only',
      directGameplayActionAccess: false,
      thresholds: {
        watchAfterMs: this.watchAfterMs,
        degradedAfterMs: this.degradedAfterMs,
        safeModeAfterMs: this.safeModeAfterMs,
        quarantineAfterMs: this.quarantineAfterMs,
        minMovementProgress: this.minMovementProgress
      },
      progress: {
        lastProgressAt: this.lastProgressAt,
        ageMs: this.lastProgressAt == null ? null : Math.max(0, now - this.lastProgressAt),
        anchor: clone(this.progressAnchor)
      },
      subsystems: clone(this.subsystems),
      manualQuarantines: [...this.manualQuarantines.entries()].map(([name, value]) => ({ name, ...value })),
      recovery: {
        lastRecoveryAt: this.lastRecoveryAt,
        cooldownMs: this.recoveryCooldownMs,
        windowMs: this.recoveryWindowMs,
        maxPerWindow: this.maxRecoveriesPerWindow,
        inWindow: this.recoveries.length,
        recent: clone(this.recoveries.slice(-10))
      },
      lastEvaluatedAt: this.lastEvaluatedAt,
      stats: { ...this.stats }
    };
  }
}

module.exports = { GlobalSupervisor, HealthState };

},
"src/world/content-drift.js": function(require,module,exports){
'use strict';

const CONTENT_DRIFT_SCHEMA_VERSION = 1;
const ContentLifecycle = Object.freeze({
  BASELINE: 'BASELINE',
  OBSERVED: 'OBSERVED',
  QUARANTINED: 'QUARANTINED'
});

const DEFAULT_CATEGORIES = Object.freeze(['monsters', 'maps', 'npcs', 'items', 'skills', 'events']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalize(value, depth = 0) {
  if (depth > 6) return '[depth-limit]';
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 512 ? value.slice(0, 512) : value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'function' || typeof value === 'undefined' || typeof value === 'symbol') return undefined;
  if (Array.isArray(value)) return value.slice(0, 128).map((item) => normalize(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    const keys = Object.keys(value).sort().slice(0, 256);
    for (const key of keys) {
      const normalized = normalize(value[key], depth + 1);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }
  return String(value);
}

function stableStringify(value) {
  return JSON.stringify(normalize(value));
}

function hashString(input) {
  let hash = 0x811c9dc5;
  const text = String(input || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function fingerprint(value) {
  const canonical = stableStringify(value);
  return { hash: hashString(canonical), bytes: canonical.length };
}

function recordKey(category, id) {
  return `${category}:${String(id)}`;
}

class ContentDriftMonitor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'aio-v3-content-drift-v1';
    this.capacity = Math.max(64, Math.min(10000, Math.floor(finite(options.capacity, 2048))));
    this.scanBudget = Math.max(6, Math.min(512, Math.floor(finite(options.scanBudget, 96))));
    this.minObservedSamples = Math.max(2, Math.min(20, Math.floor(finite(options.minObservedSamples, 2))));
    this.minSaveMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.minSaveMs, 30000)));
    this.categories = Array.isArray(options.categories) && options.categories.length ? [...new Set(options.categories.map(String))] : DEFAULT_CATEGORIES.slice();
    this.records = new Map();
    this.catalog = new Map(this.categories.map((category) => [category, { cursor: 0, baselineComplete: false, cycles: 0 }]));
    this.loaded = false;
    this.lastSavedAt = 0;
    this.lastScanAt = null;
    this.lastScan = null;
    this.stats = { scans: 0, observed: 0, baselineRecords: 0, novelty: 0, drift: 0, revalidated: 0, pruned: 0, loadErrors: 0, saveErrors: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'content-drift', event, severity, reason, data });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    const ls = this.root && this.root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
      return { get: (key) => ls.getItem(key), set: (key, value) => ls.setItem(key, value) };
    }
    return null;
  }

  _catalogState(category) {
    if (!this.catalog.has(category)) this.catalog.set(category, { cursor: 0, baselineComplete: false, cycles: 0 });
    return this.catalog.get(category);
  }

  _prune() {
    if (this.records.size <= this.capacity) return 0;
    const rows = [...this.records.entries()].sort((a, b) => {
      const aq = a[1].lifecycle === ContentLifecycle.QUARANTINED ? 1 : 0;
      const bq = b[1].lifecycle === ContentLifecycle.QUARANTINED ? 1 : 0;
      if (aq !== bq) return aq - bq;
      return finite(a[1].lastSeenAt) - finite(b[1].lastSeenAt);
    });
    const count = this.records.size - this.capacity;
    for (let i = 0; i < count; i += 1) this.records.delete(rows[i][0]);
    this.stats.pruned += count;
    if (count > 0) this._event('CONTENT_DRIFT_RECORDS_PRUNED', 'warn', 'CAPACITY_LIMIT', { count, capacity: this.capacity });
    return count;
  }

  _observe(category, id, value, options = {}) {
    if (!category || id == null) return null;
    const now = this.now();
    const key = recordKey(category, id);
    const fp = fingerprint(value);
    const current = this.records.get(key);
    const baselineAllowed = options.baselineAllowed === true;
    this.stats.observed += 1;

    if (!current) {
      const lifecycle = baselineAllowed ? ContentLifecycle.BASELINE : ContentLifecycle.QUARANTINED;
      const record = {
        schemaVersion: CONTENT_DRIFT_SCHEMA_VERSION,
        key,
        category: String(category),
        id: String(id),
        lifecycle,
        fingerprint: fp.hash,
        baselineFingerprint: fp.hash,
        previousFingerprint: null,
        bytes: fp.bytes,
        samples: 1,
        changeCount: 0,
        firstSeenAt: now,
        lastSeenAt: now,
        lastChangedAt: null,
        source: options.source || 'catalog'
      };
      this.records.set(key, record);
      if (baselineAllowed) this.stats.baselineRecords += 1;
      else {
        this.stats.novelty += 1;
        this._event('CONTENT_NOVELTY_DETECTED', 'warn', 'NEW_CONTENT_AFTER_BASELINE', { category, id: String(id), fingerprint: fp.hash, source: record.source });
      }
      this._prune();
      return { kind: baselineAllowed ? 'BASELINE' : 'NOVELTY', record: clone(record) };
    }

    current.samples += 1;
    current.lastSeenAt = now;
    current.source = options.source || current.source;
    current.bytes = fp.bytes;
    if (current.fingerprint !== fp.hash) {
      current.previousFingerprint = current.fingerprint;
      current.fingerprint = fp.hash;
      current.changeCount += 1;
      current.lastChangedAt = now;
      current.lifecycle = ContentLifecycle.QUARANTINED;
      this.stats.drift += 1;
      this._event('CONTENT_DRIFT_DETECTED', 'warn', 'FINGERPRINT_CHANGED', {
        category,
        id: String(id),
        previousFingerprint: current.previousFingerprint,
        fingerprint: current.fingerprint,
        changeCount: current.changeCount,
        source: current.source
      });
      return { kind: 'DRIFT', record: clone(current) };
    }

    if (current.lifecycle === ContentLifecycle.BASELINE && current.samples >= this.minObservedSamples) current.lifecycle = ContentLifecycle.OBSERVED;
    return { kind: 'UNCHANGED', record: clone(current) };
  }

  _entries(gameData, category) {
    const source = gameData && gameData[category];
    if (!source) return [];
    if (Array.isArray(source)) return source.map((value, index) => [String(index), value]);
    if (typeof source !== 'object') return [];
    return Object.keys(source).sort().map((key) => [key, source[key]]);
  }

  _priority(snapshot, gameData, changes) {
    if (!snapshot || !snapshot.character) return;
    const map = snapshot.character.map;
    if (map && gameData && gameData.maps && gameData.maps[map]) {
      const state = this._catalogState('maps');
      const row = this._observe('maps', map, gameData.maps[map], { baselineAllowed: !state.baselineComplete, source: 'current-map' });
      if (row && (row.kind === 'DRIFT' || row.kind === 'NOVELTY')) changes.push(row);
    }
    const monsters = new Set();
    for (const entity of snapshot.entities || []) if (entity && entity.mtype) monsters.add(entity.mtype);
    for (const mtype of [...monsters].sort().slice(0, 32)) {
      const value = gameData && gameData.monsters && gameData.monsters[mtype];
      if (!value) continue;
      const state = this._catalogState('monsters');
      const row = this._observe('monsters', mtype, value, { baselineAllowed: !state.baselineComplete, source: 'visible-monster' });
      if (row && (row.kind === 'DRIFT' || row.kind === 'NOVELTY')) changes.push(row);
    }
  }

  _scanCategory(gameData, category, budget, changes) {
    const entries = this._entries(gameData, category);
    const state = this._catalogState(category);
    if (!entries.length) {
      state.cursor = 0;
      state.baselineComplete = true;
      state.cycles = Math.max(1, state.cycles);
      return 0;
    }
    if (state.cursor >= entries.length) state.cursor = 0;
    let used = 0;
    while (used < budget && entries.length) {
      const [id, value] = entries[state.cursor];
      const row = this._observe(category, id, value, { baselineAllowed: !state.baselineComplete, source: `catalog:${category}` });
      if (row && (row.kind === 'DRIFT' || row.kind === 'NOVELTY')) changes.push(row);
      used += 1;
      state.cursor += 1;
      if (state.cursor >= entries.length) {
        state.cursor = 0;
        state.baselineComplete = true;
        state.cycles += 1;
        break;
      }
    }
    return used;
  }

  scan(snapshot, gameData = {}) {
    const now = this.now();
    const changes = [];
    this._priority(snapshot, gameData, changes);
    let remaining = this.scanBudget;
    for (const category of this.categories) {
      if (remaining <= 0) break;
      const categoriesLeft = Math.max(1, this.categories.length - this.categories.indexOf(category));
      const budget = Math.max(1, Math.floor(remaining / categoriesLeft));
      remaining -= this._scanCategory(gameData, category, budget, changes);
    }
    this.stats.scans += 1;
    this.lastScanAt = now;
    this.lastScan = {
      at: now,
      map: snapshot && snapshot.character && snapshot.character.map || null,
      changes: changes.map((row) => ({ kind: row.kind, category: row.record.category, id: row.record.id, lifecycle: row.record.lifecycle, fingerprint: row.record.fingerprint })),
      baselineComplete: Object.fromEntries(this.categories.map((category) => [category, this._catalogState(category).baselineComplete]))
    };
    if (changes.length) this._event('CONTENT_SCAN_COMPLETED', 'warn', 'CONTENT_CHANGE_DETECTED', { changes: this.lastScan.changes });
    this.save({ force: changes.length > 0 });
    return clone(this.lastScan);
  }

  markRevalidated(category, id) {
    const record = this.records.get(recordKey(category, id));
    if (!record) return false;
    record.lifecycle = ContentLifecycle.OBSERVED;
    record.baselineFingerprint = record.fingerprint;
    record.previousFingerprint = null;
    record.lastSeenAt = this.now();
    this.stats.revalidated += 1;
    this._event('CONTENT_REVALIDATED', 'info', null, { category: record.category, id: record.id, fingerprint: record.fingerprint });
    this.save({ force: true });
    return true;
  }

  requiresRevalidation(category, id) {
    const record = this.records.get(recordKey(category, id));
    return !!record && record.lifecycle === ContentLifecycle.QUARANTINED;
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== CONTENT_DRIFT_SCHEMA_VERSION || !Array.isArray(data.records)) throw new Error('unsupported content drift schema');
      this.records = new Map(data.records.filter((row) => Array.isArray(row) && row.length === 2));
      if (data.catalog && typeof data.catalog === 'object') {
        for (const [category, state] of Object.entries(data.catalog)) {
          if (!this.categories.includes(category)) continue;
          this.catalog.set(category, {
            cursor: Math.max(0, Math.floor(finite(state.cursor, 0))),
            baselineComplete: state.baselineComplete === true,
            cycles: Math.max(0, Math.floor(finite(state.cycles, 0)))
          });
        }
      }
      this._prune();
      this._event('CONTENT_DRIFT_RESTORED', 'info', null, { records: this.records.size });
      return true;
    } catch (error) {
      this.records.clear();
      this.catalog = new Map(this.categories.map((category) => [category, { cursor: 0, baselineComplete: false, cycles: 0 }]));
      this.stats.loadErrors += 1;
      this._event('CONTENT_DRIFT_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', { message: String(error && error.message || error) });
      return false;
    }
  }

  serialize() {
    return JSON.stringify({
      schemaVersion: CONTENT_DRIFT_SCHEMA_VERSION,
      savedAt: this.now(),
      records: [...this.records.entries()],
      catalog: Object.fromEntries(this.catalog.entries())
    });
  }

  save(options = {}) {
    const backend = this._backend();
    if (!backend) return false;
    const now = this.now();
    if (options.force !== true && now - this.lastSavedAt < this.minSaveMs) return false;
    try {
      backend.set(this.key, this.serialize());
      this.lastSavedAt = now;
      return true;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('CONTENT_DRIFT_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', { message: String(error && error.message || error) });
      return false;
    }
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.capacity, Math.floor(finite(limit, 100))));
    return [...this.records.values()]
      .sort((a, b) => finite(b.lastChangedAt || b.lastSeenAt) - finite(a.lastChangedAt || a.lastSeenAt))
      .slice(0, n)
      .map(clone);
  }

  status() {
    const counts = { BASELINE: 0, OBSERVED: 0, QUARANTINED: 0 };
    for (const record of this.records.values()) counts[record.lifecycle] = (counts[record.lifecycle] || 0) + 1;
    return {
      schemaVersion: CONTENT_DRIFT_SCHEMA_VERSION,
      mode: 'observation-first',
      actionAuthority: false,
      directGameplayActionAccess: false,
      records: this.records.size,
      capacity: this.capacity,
      scanBudget: this.scanBudget,
      counts,
      baseline: Object.fromEntries(this.categories.map((category) => {
        const state = this._catalogState(category);
        return [category, { baselineComplete: state.baselineComplete, cursor: state.cursor, cycles: state.cycles }];
      })),
      lastScanAt: this.lastScanAt,
      lastScan: clone(this.lastScan),
      persistence: { available: !!this._backend(), lastSavedAt: this.lastSavedAt || null, key: this.key },
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  ContentDriftMonitor,
  ContentLifecycle,
  CONTENT_DRIFT_SCHEMA_VERSION,
  stableStringify,
  fingerprint
};

},
"src/autonomy/alpha14-runtime.js": function(require,module,exports){
'use strict';

const { Alpha13Runtime } = require('./alpha13-runtime');
const { InventoryLedger } = require('../economy/inventory-ledger');
const { GearProgressionEvaluator } = require('../economy/gear-progression');

const ALPHA14_VERSION = '3.0.0-alpha.14.0';

class Alpha14Runtime extends Alpha13Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA14_VERSION;
    this.inventoryPlanningIntervalMs = Math.max(1000, Math.min(60000, Number(options.inventoryPlanningIntervalMs) || 3000));
    this.lastInventoryPlanningAt = -Infinity;
    this.lastInventoryPlanningResult = null;

    this.gearProgression = options.gearProgression || new GearProgressionEvaluator({
      root: this.root,
      storage: options.gearProgressionStorage || options.storage,
      now: this.now,
      log: this.log,
      capacity: options.gearGoalCapacity,
      maxProbeLevel: options.gearMaxProbeLevel,
      minImprovementRatio: options.gearMinImprovementRatio
    });
    this.gearProgression.load();

    this.inventoryLedger = options.inventoryLedger || new InventoryLedger({
      now: this.now,
      log: this.log,
      capacity: options.inventoryLedgerCapacity,
      staleAfterMs: options.inventoryLedgerStaleAfterMs,
      workspaceSlots: options.inventoryWorkspaceSlots,
      groupHpPotionReserve: options.groupHpPotionReserve,
      groupMpPotionReserve: options.groupMpPotionReserve,
      sellAllowlist: options.inventorySellAllowlist,
      bankAllowlist: options.inventoryBankAllowlist,
      exchangeAllowlist: options.inventoryExchangeAllowlist
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA14_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _planInventoryAndGear() {
    const registry = this.characterRegistry.status();
    const gameData = this.adapter.getGameData() || {};
    const gear = this.gearProgression.evaluate({
      registry,
      gameData,
      contentDrift: this.contentDrift
    });
    this.inventoryLedger.setProgressionReservations(gear.reservations);
    const ledger = this.inventoryLedger.observe({
      registry,
      gameData,
      contentDrift: this.contentDrift,
      liveCharacter: this.root && this.root.character,
      observedAt: this.lastSnapshot && this.lastSnapshot.observedAt
    });
    this.lastInventoryPlanningResult = {
      at: this.now(),
      ledger: ledger.summary,
      gear: gear.status.lastEvaluation
    };
    return this.lastInventoryPlanningResult;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastInventoryPlanningAt >= this.inventoryPlanningIntervalMs) {
      this.lastInventoryPlanningAt = now;
      this._planInventoryAndGear();
    }
  }

  stop() {
    if (this.gearProgression) this.gearProgression.save({ force: true });
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: ALPHA14_VERSION,
      inventory: this.inventoryLedger.status(),
      gearProgression: this.gearProgression.status()
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.inventory = {
      status: this.inventoryLedger.status(),
      entries: this.inventoryLedger.list(300)
    };
    base.context.gearProgression = {
      status: this.gearProgression.status(),
      goals: this.gearProgression.list(200)
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha14Runtime, ALPHA14_VERSION };

},
"src/economy/inventory-ledger.js": function(require,module,exports){
'use strict';

const { sellProtectionReasons, sellSafetyStatus } = require('./sell-safety');

const INVENTORY_LEDGER_SCHEMA_VERSION = 1;
const INVENTORY_LEDGER_MODE = 'observation-planning-only';
const ItemDisposition = Object.freeze({
  KEEP: 'KEEP',
  RESERVE_GROUP: 'RESERVE_GROUP',
  RESERVE_PROGRESSION: 'RESERVE_PROGRESSION',
  RESERVE_COMPOUND: 'RESERVE_COMPOUND',
  RESERVE_UPGRADE: 'RESERVE_UPGRADE',
  SELL: 'SELL',
  BANK: 'BANK',
  EXCHANGE: 'EXCHANGE',
  UNDECIDED: 'UNDECIDED'
});

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function itemKey(character, index) {
  return `${String(character || '')}:${Number.isFinite(Number(index)) ? Number(index) : 'x'}`;
}

function stackKey(name, level) {
  return `${String(name || '')}:${Math.max(0, Math.floor(finite(level, 0)))}`;
}

function asSet(value) {
  return new Set(Array.isArray(value) ? value.map(String) : []);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '')).filter(Boolean))];
}

class InventoryLedger {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(64, Math.min(5000, Math.floor(finite(options.capacity, 1024))));
    this.staleAfterMs = Math.max(5000, Math.min(30 * 60 * 1000, finite(options.staleAfterMs, 60000)));
    this.workspaceSlots = Math.max(1, Math.min(16, Math.floor(finite(options.workspaceSlots, 3))));
    this.groupPotionReserve = {
      hp: Math.max(0, Math.min(100000, Math.floor(finite(options.groupHpPotionReserve, 200)))),
      mp: Math.max(0, Math.min(100000, Math.floor(finite(options.groupMpPotionReserve, 200))))
    };
    this.sellAllowlist = asSet(options.sellAllowlist);
    this.bankAllowlist = asSet(options.bankAllowlist);
    this.exchangeAllowlist = asSet(options.exchangeAllowlist);
    this.sellSafetyResolver = typeof options.sellSafetyResolver === 'function' ? options.sellSafetyResolver : null;
    this.progressionReservations = new Map();
    this.entries = new Map();
    this.lastObservedAt = null;
    this.lastSummary = null;
    this.stats = {
      observations: 0,
      items: 0,
      truncated: 0,
      invalidIndexes: 0,
      outOfRangeRejected: 0,
      undecided: 0,
      reserved: 0,
      sellCandidates: 0,
      sellProtected: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'inventory-ledger', event, severity, reason, data });
  }

  setSellSafetyResolver(resolver) {
    this.sellSafetyResolver = typeof resolver === 'function' ? resolver : null;
    return this.sellSafetyResolver !== null;
  }

  setProgressionReservations(reservations) {
    this.progressionReservations.clear();
    for (const row of Array.isArray(reservations) ? reservations : []) {
      if (!row || !row.name) continue;
      const key = stackKey(row.name, row.level);
      const quantity = Math.max(1, Math.floor(finite(row.quantity, 1)));
      this.progressionReservations.set(key, {
        name: String(row.name), level: Math.max(0, Math.floor(finite(row.level, 0))), quantity,
        goalIds: Array.isArray(row.goalIds) ? row.goalIds.map(String).slice(0, 32) : []
      });
    }
    return this.progressionReservations.size;
  }

  _registryRows(registry) {
    if (!registry) return [];
    const status = typeof registry.status === 'function' ? registry.status() : registry;
    return Array.isArray(status && status.characters) ? status.characters : [];
  }

  _contentUnsafe(contentDrift, name) {
    if (!name || !contentDrift) return false;
    try {
      if (typeof contentDrift.requiresRevalidation === 'function') return contentDrift.requiresRevalidation('items', name) === true;
      if (Array.isArray(contentDrift.records)) {
        const row = contentDrift.records.find((record) => record && record.category === 'items' && record.id === name);
        return !!row && row.lifecycle === 'QUARANTINED';
      }
    } catch (_) {}
    return false;
  }

  _resolveSellBlockers(row, meta, gameData, contentDrift) {
    let blockers = sellProtectionReasons(meta);
    if (!this.sellSafetyResolver) return blockers;
    try {
      const resolved = this.sellSafetyResolver({ row: clone(row), meta, gameData, contentDrift });
      const extra = Array.isArray(resolved)
        ? resolved
        : resolved && Array.isArray(resolved.blockers)
          ? resolved.blockers
          : [];
      blockers = uniqueStrings([...blockers, ...extra]);
    } catch (_) {
      blockers = uniqueStrings([...blockers, 'SELL_SAFETY_RESOLVER_FAILED']);
    }
    return blockers;
  }

  _baseDisposition(row, gameData, contentDrift, counts) {
    const reasons = [];
    const meta = gameData && gameData.items && gameData.items[row.name];
    if (row.locked || row.special) return { disposition: ItemDisposition.KEEP, reasons: [row.locked ? 'ITEM_LOCKED' : 'ITEM_SPECIAL'] };
    if (!meta || typeof meta !== 'object') return { disposition: ItemDisposition.UNDECIDED, reasons: ['ITEM_METADATA_UNKNOWN'] };
    if (this._contentUnsafe(contentDrift, row.name)) return { disposition: ItemDisposition.UNDECIDED, reasons: ['CONTENT_REVALIDATION_REQUIRED'] };

    const progression = this.progressionReservations.get(stackKey(row.name, row.level));
    if (progression) return { disposition: ItemDisposition.RESERVE_PROGRESSION, reasons: ['ACTIVE_GEAR_GOAL'], reservation: clone(progression) };

    const lower = String(row.name).toLowerCase();
    if (/^hpot/.test(lower)) return { disposition: ItemDisposition.RESERVE_GROUP, reasons: ['GROUP_HP_POTION_RESERVE'] };
    if (/^mpot/.test(lower)) return { disposition: ItemDisposition.RESERVE_GROUP, reasons: ['GROUP_MP_POTION_RESERVE'] };

    const same = counts.get(stackKey(row.name, row.level)) || 0;
    if (meta.compound === true && same >= 3) return { disposition: ItemDisposition.RESERVE_COMPOUND, reasons: ['COMPOUND_SET_AVAILABLE'] };

    if (this.exchangeAllowlist.has(row.name)) return { disposition: ItemDisposition.EXCHANGE, reasons: ['OPERATOR_EXCHANGE_ALLOWLIST'] };
    if (this.bankAllowlist.has(row.name)) return { disposition: ItemDisposition.BANK, reasons: ['OPERATOR_BANK_ALLOWLIST'] };
    if (this.sellAllowlist.has(row.name)) {
      const blockers = this._resolveSellBlockers(row, meta, gameData, contentDrift);
      if (blockers.length) {
        return {
          disposition: ItemDisposition.UNDECIDED,
          reasons: ['SELL_ALLOWLIST_PROTECTED', ...blockers].slice(0, 12),
          sellProtected: true
        };
      }
      return { disposition: ItemDisposition.SELL, reasons: ['OPERATOR_SELL_ALLOWLIST'] };
    }

    return { disposition: ItemDisposition.UNDECIDED, reasons };
  }

  observe(context = {}) {
    const at = finite(context.observedAt, this.now());
    const registryRows = this._registryRows(context.registry);
    const gameData = context.gameData || {};
    const contentDrift = context.contentDrift || null;
    const liveCharacter = context.liveCharacter && typeof context.liveCharacter === 'object' ? context.liveCharacter : null;
    const selfName = liveCharacter && normalizeName(liveCharacter.name);
    const reportedIsize = liveCharacter ? finite(liveCharacter.isize) : null;
    const fallbackLength = liveCharacter && Array.isArray(liveCharacter.items) ? liveCharacter.items.length : null;
    const authoritativeCapacity = reportedIsize == null
      ? fallbackLength
      : Math.max(0, Math.floor(reportedIsize));
    const capacitySource = reportedIsize == null ? 'items.length-fallback' : 'character.isize';
    const raw = [];
    let invalidIndexes = 0;
    let outOfRangeRejected = 0;

    for (const character of registryRows.slice(0, 128)) {
      const name = normalizeName(character && character.name);
      if (!name || !Array.isArray(character.inventory)) continue;
      for (const item of character.inventory) {
        if (!item || !item.name) continue;
        const index = finite(item.index);
        if (index == null || !Number.isInteger(index) || index < 0) {
          invalidIndexes += 1;
          continue;
        }
        if (selfName && name === selfName && authoritativeCapacity != null && index >= authoritativeCapacity) {
          outOfRangeRejected += 1;
          continue;
        }
        raw.push({
          character: name,
          index,
          name: String(item.name),
          level: Math.max(0, Math.floor(finite(item.level, 0))),
          q: Math.max(1, Math.floor(finite(item.q, 1))),
          locked: item.locked === true,
          special: item.special === true,
          confidence: Math.max(0, Math.min(1, finite(character.stateConfidence, 0)))
        });
      }
    }
    raw.sort((a, b) => a.character.localeCompare(b.character) || a.index - b.index || a.name.localeCompare(b.name));
    const counts = new Map();
    for (const row of raw) counts.set(stackKey(row.name, row.level), (counts.get(stackKey(row.name, row.level)) || 0) + row.q);

    this.entries.clear();
    let hpReserved = 0;
    let mpReserved = 0;
    let truncated = 0;
    let sellProtected = 0;
    for (const row of raw) {
      if (this.entries.size >= this.capacity) { truncated += 1; continue; }
      const classified = this._baseDisposition(row, gameData, contentDrift, counts);
      let disposition = classified.disposition;
      const reasons = classified.reasons.slice();
      if (classified.sellProtected === true) sellProtected += 1;
      const lower = row.name.toLowerCase();
      if (disposition === ItemDisposition.RESERVE_GROUP && /^hpot/.test(lower)) {
        if (hpReserved >= this.groupPotionReserve.hp) { disposition = ItemDisposition.UNDECIDED; reasons.push('GROUP_RESERVE_ALREADY_SATISFIED'); }
        else hpReserved += row.q;
      }
      if (disposition === ItemDisposition.RESERVE_GROUP && /^mpot/.test(lower)) {
        if (mpReserved >= this.groupPotionReserve.mp) { disposition = ItemDisposition.UNDECIDED; reasons.push('GROUP_RESERVE_ALREADY_SATISFIED'); }
        else mpReserved += row.q;
      }
      const meta = gameData && gameData.items && gameData.items[row.name];
      const entry = {
        schemaVersion: INVENTORY_LEDGER_SCHEMA_VERSION,
        key: itemKey(row.character, row.index),
        observedAt: at,
        ...row,
        disposition,
        reasons: reasons.slice(0, 12),
        reservation: classified.reservation || null,
        metadataKnown: !!meta,
        metadataType: meta && meta.type || null,
        actionAuthority: false
      };
      this.entries.set(entry.key, entry);
    }

    const selfOccupied = selfName ? [...this.entries.values()].filter((row) => row.character === selfName).length : null;
    const freeSlots = authoritativeCapacity == null || selfOccupied == null ? null : Math.max(0, authoritativeCapacity - selfOccupied);
    const pressure = authoritativeCapacity && selfOccupied != null ? Math.max(0, Math.min(1, selfOccupied / authoritativeCapacity)) : null;
    const dispositionCounts = {};
    for (const value of Object.values(ItemDisposition)) dispositionCounts[value] = 0;
    for (const row of this.entries.values()) dispositionCounts[row.disposition] = (dispositionCounts[row.disposition] || 0) + 1;

    this.lastObservedAt = at;
    this.stats.observations += 1;
    this.stats.items = this.entries.size;
    this.stats.truncated += truncated;
    this.stats.invalidIndexes += invalidIndexes;
    this.stats.outOfRangeRejected += outOfRangeRejected;
    this.stats.undecided = dispositionCounts.UNDECIDED || 0;
    this.stats.reserved = [...this.entries.values()].filter((row) => String(row.disposition).startsWith('RESERVE_') || row.disposition === ItemDisposition.KEEP).length;
    this.stats.sellCandidates = dispositionCounts.SELL || 0;
    this.stats.sellProtected = sellProtected;
    this.lastSummary = {
      at,
      characters: new Set([...this.entries.values()].map((row) => row.character)).size,
      entries: this.entries.size,
      quantity: [...this.entries.values()].reduce((sum, row) => sum + row.q, 0),
      dispositions: dispositionCounts,
      groupReserve: { hpRequired: this.groupPotionReserve.hp, hpObservedReserved: hpReserved, mpRequired: this.groupPotionReserve.mp, mpObservedReserved: mpReserved },
      selfInventory: {
        name: selfName,
        capacity: authoritativeCapacity,
        capacitySource,
        occupied: selfOccupied,
        freeSlots,
        pressure,
        workspaceSlots: this.workspaceSlots,
        workspaceAvailable: freeSlots == null ? null : freeSlots >= this.workspaceSlots,
        invalidIndexesRejected: invalidIndexes,
        outOfRangeRejected
      }
    };
    if (truncated) this._event('INVENTORY_LEDGER_TRUNCATED', 'warn', 'CAPACITY_LIMIT', { capacity: this.capacity, dropped: truncated });
    if (invalidIndexes) this._event('INVENTORY_INDEX_INVALID', 'warn', 'INVALID_INVENTORY_INDEX', { rejected: invalidIndexes });
    if (outOfRangeRejected) this._event('INVENTORY_INDEX_OUT_OF_RANGE', 'warn', 'CHARACTER_ISIZE_BOUND', {
      character: selfName,
      isize: authoritativeCapacity,
      rejected: outOfRangeRejected
    });
    if (sellProtected) this._event('INVENTORY_SELL_PROTECTED', 'info', 'SELL_ALLOWLIST_CANNOT_OVERRIDE_PROTECTED_METADATA', { rejected: sellProtected });
    if (freeSlots != null && freeSlots < this.workspaceSlots) this._event('INVENTORY_PRESSURE_HIGH', 'warn', 'WORKSPACE_RESERVE_VIOLATED', { freeSlots, workspaceSlots: this.workspaceSlots });
    return this.status();
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.capacity, Math.floor(finite(limit, 100))));
    return [...this.entries.values()].slice(0, n).map(clone);
  }

  get(character, index) {
    const row = this.entries.get(itemKey(character, index));
    return row ? clone(row) : null;
  }

  status() {
    const now = this.now();
    return {
      schemaVersion: INVENTORY_LEDGER_SCHEMA_VERSION,
      mode: INVENTORY_LEDGER_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      destructiveActionsEnabled: false,
      sellExecutionEnabled: false,
      bankExecutionEnabled: false,
      compoundExecutionEnabled: false,
      upgradeExecutionEnabled: false,
      exchangeExecutionEnabled: false,
      capacity: this.capacity,
      workspaceSlots: this.workspaceSlots,
      lastObservedAt: this.lastObservedAt,
      observationAgeMs: this.lastObservedAt == null ? null : Math.max(0, now - this.lastObservedAt),
      stale: this.lastObservedAt != null && now - this.lastObservedAt > this.staleAfterMs,
      summary: clone(this.lastSummary),
      policy: {
        groupPotionReserve: clone(this.groupPotionReserve),
        sellAllowlist: [...this.sellAllowlist].sort(),
        bankAllowlist: [...this.bankAllowlist].sort(),
        exchangeAllowlist: [...this.exchangeAllowlist].sort(),
        defaultDisposition: ItemDisposition.UNDECIDED,
        sellSafetyResolver: this.sellSafetyResolver ? 'ENABLED' : 'DISABLED',
        sellSafety: sellSafetyStatus()
      },
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  InventoryLedger,
  INVENTORY_LEDGER_SCHEMA_VERSION,
  INVENTORY_LEDGER_MODE,
  ItemDisposition,
  stackKey
};

},
"src/economy/sell-safety.js": function(require,module,exports){
'use strict';

const LOW_RISK_SELL_TYPES = Object.freeze(['material']);
const STRUCTURAL_GEAR_KEYS = Object.freeze(['grades', 'tier', 'scroll', 'wtype', 'class']);
const INTERACTIVE_KEYS = Object.freeze(['action', 'onclick', 'offering', 'throw', 'rare', 'ignore']);

function hasOwn(value, key) {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key);
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sellProtectionReasons(meta) {
  if (!meta || typeof meta !== 'object') return ['SELL_METADATA_UNKNOWN'];
  const reasons = [];
  const type = String(meta.type || '').toLowerCase();
  if (!LOW_RISK_SELL_TYPES.includes(type)) reasons.push('SELL_TYPE_NOT_LOW_RISK');

  const stackSize = finite(meta.s);
  if (stackSize == null || stackSize < 2) reasons.push('SELL_NOT_PLAIN_STACKABLE_MATERIAL');

  if (meta.quest || meta.q) reasons.push('SELL_QUEST_ITEM_PROTECTED');
  if (meta.e || meta.exchange) reasons.push('SELL_EXCHANGE_ITEM_PROTECTED');
  if (meta.event) reasons.push('SELL_EVENT_ITEM_PROTECTED');
  if (meta.cash || meta.cash_item || meta.cashitem) reasons.push('SELL_CASH_ITEM_PROTECTED');
  if (meta.soulbound || meta.soul_bound) reasons.push('SELL_SOULBOUND_ITEM_PROTECTED');
  if (meta.compound) reasons.push('SELL_COMPOUND_ITEM_PROTECTED');
  if (meta.upgrade) reasons.push('SELL_UPGRADE_ITEM_PROTECTED');

  for (const key of STRUCTURAL_GEAR_KEYS) {
    if (hasOwn(meta, key)) reasons.push(`SELL_GEAR_SIGNAL_${key.toUpperCase()}`);
  }
  for (const key of INTERACTIVE_KEYS) {
    if (hasOwn(meta, key) && meta[key] != null && meta[key] !== false) reasons.push(`SELL_SPECIAL_SIGNAL_${key.toUpperCase()}`);
  }

  return unique(reasons);
}

function rawSellProtectionReasons(item) {
  if (!item || typeof item !== 'object') return ['SELL_RAW_ITEM_UNKNOWN'];
  const reasons = [];
  if (hasOwn(item, 'level')) reasons.push('SELL_RAW_LEVELLED_ITEM_PROTECTED');
  if (item.l === true) reasons.push('SELL_RAW_LOCKED_ITEM_PROTECTED');
  if (item.p) reasons.push('SELL_RAW_SPECIAL_ITEM_PROTECTED');
  return unique(reasons);
}

function sellMetadataSafetyView(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const out = {
    type: String(meta.type || '').toLowerCase(),
    stackSize: finite(meta.s)
  };
  for (const key of [
    'quest', 'q', 'e', 'exchange', 'event', 'cash', 'cash_item', 'cashitem',
    'soulbound', 'soul_bound', 'compound', 'upgrade',
    ...STRUCTURAL_GEAR_KEYS, ...INTERACTIVE_KEYS
  ]) {
    out[key] = hasOwn(meta, key) ? (meta[key] == null ? null : meta[key] === false ? false : true) : 'ABSENT';
  }
  return out;
}

function sellMetadataConsensus(root, itemName) {
  const name = String(itemName || '').trim();
  const candidates = [];
  const seen = new Set();
  const sources = [
    ['root', root && root.G],
    ['parent', root && root.parent && root.parent.G]
  ];

  for (const [source, gameData] of sources) {
    const meta = gameData && gameData.items && gameData.items[name];
    if (!meta || typeof meta !== 'object' || seen.has(meta)) continue;
    seen.add(meta);
    candidates.push({ source, meta });
  }

  if (!candidates.length) {
    return { ok: false, blockers: ['SELL_METADATA_UNKNOWN'], sources: [], views: [] };
  }

  const blockers = [];
  const views = [];
  for (const candidate of candidates) {
    blockers.push(...sellProtectionReasons(candidate.meta));
    views.push({ source: candidate.source, safety: sellMetadataSafetyView(candidate.meta) });
  }

  const fingerprints = new Set(views.map((row) => JSON.stringify(row.safety)));
  if (fingerprints.size > 1) blockers.push('SELL_METADATA_CONFLICT');

  const resolvedBlockers = unique(blockers);
  return {
    ok: resolvedBlockers.length === 0,
    blockers: resolvedBlockers,
    sources: candidates.map((row) => row.source),
    views
  };
}

function sellSafetyStatus() {
  return {
    policy: 'plain-stackable-material-only',
    allowlistCannotOverride: true,
    allowedMetadataTypes: LOW_RISK_SELL_TYPES.slice(),
    requiresStackableMetadata: true,
    rawLevelledItemProtected: true,
    metadataConsensusRequiredAtLiveExecution: true,
    protectedSignals: [
      'quest', 'exchange', 'event', 'cash', 'soulbound', 'compound', 'upgrade',
      'grades', 'tier', 'scroll', 'wtype', 'class',
      'action', 'onclick', 'offering', 'throw', 'rare', 'ignore'
    ]
  };
}

module.exports = {
  LOW_RISK_SELL_TYPES,
  sellProtectionReasons,
  rawSellProtectionReasons,
  sellMetadataSafetyView,
  sellMetadataConsensus,
  sellSafetyStatus
};

},
"src/economy/gear-progression.js": function(require,module,exports){
'use strict';

const GEAR_PROGRESSION_SCHEMA_VERSION = 1;
const GEAR_PROGRESSION_MODE = 'shadow-planning-only';

const CLASS_WEIGHTS = Object.freeze({
  warrior: { attack: 1.0, armor: 1.25, resistance: 0.85, hp: 0.04, str: 0.8, dex: 0.2, int: 0.1, crit: 0.3, evasion: 0.2, speed: 0.15 },
  paladin: { attack: 0.9, armor: 1.15, resistance: 1.15, hp: 0.05, str: 0.65, int: 0.45, crit: 0.2, speed: 0.1 },
  ranger: { attack: 1.1, armor: 0.55, resistance: 0.55, hp: 0.025, dex: 0.9, crit: 0.45, speed: 0.2, range: 0.12, frequency: 0.4 },
  rogue: { attack: 1.15, armor: 0.5, resistance: 0.45, hp: 0.02, dex: 0.95, crit: 0.55, evasion: 0.35, speed: 0.25, frequency: 0.45 },
  mage: { attack: 1.1, armor: 0.35, resistance: 0.75, hp: 0.02, mp: 0.025, int: 1.0, crit: 0.25, speed: 0.1, range: 0.1 },
  priest: { attack: 0.75, armor: 0.45, resistance: 1.0, hp: 0.04, mp: 0.03, int: 0.9, speed: 0.1, range: 0.08 },
  merchant: { attack: 0.3, armor: 0.7, resistance: 0.7, hp: 0.04, str: 0.15, dex: 0.15, int: 0.15, speed: 0.3 }
});

const DEFAULT_WEIGHTS = Object.freeze({ attack: 1, armor: 0.7, resistance: 0.7, hp: 0.03, mp: 0.015, str: 0.35, dex: 0.35, int: 0.35, vit: 0.4, crit: 0.25, evasion: 0.2, speed: 0.15, range: 0.08, frequency: 0.3 });

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function levelOf(item) {
  return Math.max(0, Math.floor(finite(item && item.level, 0)));
}

function compatible(meta, character) {
  if (!meta || !character) return false;
  const classes = Array.isArray(meta.class) ? meta.class : meta.class ? [meta.class] : [];
  if (classes.length && !classes.map((x) => String(x).toLowerCase()).includes(String(character.ctype || '').toLowerCase())) return false;
  const required = finite(meta.level, 0);
  if (required > finite(character.level, 0)) return false;
  return true;
}

function candidateSlots(meta) {
  if (!meta || typeof meta !== 'object') return [];
  const type = String(meta.type || '').toLowerCase();
  const map = {
    helmet: ['helmet'], chest: ['chest'], pants: ['pants'], shoes: ['shoes'], gloves: ['gloves'], cape: ['cape'],
    amulet: ['amulet'], belt: ['belt'], orb: ['orb'], ring: ['ring1', 'ring2'], earring: ['earring1', 'earring2']
  };
  if (map[type]) return map[type];
  if (type === 'weapon') return ['mainhand'];
  if (type === 'shield' || type === 'source' || type === 'quiver') return ['offhand'];
  return [];
}

function effectiveStats(meta, level) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  const skip = new Set(['g', 'gold', 'cash', 'level', 'type', 'wtype', 'name', 'skin', 'description', 'class', 'grades', 'upgrade', 'compound']);
  for (const [key, value] of Object.entries(meta)) {
    if (skip.has(key)) continue;
    const n = finite(value);
    if (n != null) out[key] = n;
  }
  const upgrade = meta.upgrade && typeof meta.upgrade === 'object' ? meta.upgrade : {};
  for (const [key, value] of Object.entries(upgrade)) {
    const n = finite(value);
    if (n == null) continue;
    out[key] = finite(out[key], 0) + n * Math.max(0, level);
  }
  return out;
}

function scoreItem(meta, level, ctype) {
  const weights = CLASS_WEIGHTS[String(ctype || '').toLowerCase()] || DEFAULT_WEIGHTS;
  const stats = effectiveStats(meta, level);
  let total = 0;
  let survival = 0;
  for (const [key, value] of Object.entries(stats)) {
    const weight = finite(weights[key], finite(DEFAULT_WEIGHTS[key], 0));
    total += value * weight;
    if (['armor', 'resistance', 'hp', 'vit', 'evasion', 'reflection'].includes(key)) survival += value * Math.max(weight, 0);
  }
  return { total, survival, stats };
}

class GearProgressionEvaluator {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'aio-v3-gear-progression-v1';
    this.capacity = Math.max(16, Math.min(512, Math.floor(finite(options.capacity, 128))));
    this.maxProbeLevel = Math.max(1, Math.min(20, Math.floor(finite(options.maxProbeLevel, 12))));
    this.minImprovementRatio = Math.max(0.01, Math.min(1, finite(options.minImprovementRatio, 0.05)));
    this.goals = new Map();
    this.loaded = false;
    this.lastEvaluatedAt = null;
    this.lastEvaluation = null;
    this.lastSavedAt = null;
    this.stats = { evaluations: 0, candidates: 0, goalsCreated: 0, goalsUpdated: 0, blockedUnknownContent: 0, loadErrors: 0, saveErrors: 0, pruned: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'gear-progression', event, severity, reason, data });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    const ls = this.root && this.root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') return { get: (key) => ls.getItem(key), set: (key, value) => ls.setItem(key, value) };
    return null;
  }

  _registryRows(registry) {
    if (!registry) return [];
    const status = typeof registry.status === 'function' ? registry.status() : registry;
    return Array.isArray(status && status.characters) ? status.characters : [];
  }

  _unsafe(contentDrift, name) {
    try {
      return !!(contentDrift && typeof contentDrift.requiresRevalidation === 'function' && contentDrift.requiresRevalidation('items', name));
    } catch (_) { return true; }
  }

  _currentItem(character, slot, gameData) {
    const equipped = character && character.gear && character.gear[slot];
    if (!equipped || !equipped.name) return { name: null, level: 0, score: { total: 0, survival: 0, stats: {} } };
    const meta = gameData && gameData.items && gameData.items[equipped.name];
    return { name: equipped.name, level: levelOf(equipped), score: scoreItem(meta, levelOf(equipped), character.ctype) };
  }

  _firstMeaningful(meta, observedLevel, currentScore, ctype) {
    const start = Math.max(0, observedLevel);
    const max = meta && meta.upgrade ? Math.max(start, this.maxProbeLevel) : start;
    const threshold = currentScore.total <= 0 ? 0.001 : currentScore.total * (1 + this.minImprovementRatio);
    for (let level = start; level <= max; level += 1) {
      const score = scoreItem(meta, level, ctype);
      if (score.total > threshold) return { level, score };
    }
    return null;
  }

  _goalId(character, slot, item, targetLevel) {
    return `${character}:${slot}:${item}:${targetLevel}`;
  }

  _prune() {
    if (this.goals.size <= this.capacity) return;
    const rows = [...this.goals.entries()].sort((a, b) => finite(a[1].lastSeenAt, 0) - finite(b[1].lastSeenAt, 0));
    while (this.goals.size > this.capacity && rows.length) {
      this.goals.delete(rows.shift()[0]);
      this.stats.pruned += 1;
    }
  }

  evaluate(context = {}) {
    const now = this.now();
    const gameData = context.gameData || {};
    const characters = this._registryRows(context.registry).filter((row) => row && row.name && row.ctype);
    const candidates = [];
    for (const source of characters) {
      for (const item of Array.isArray(source.inventory) ? source.inventory : []) {
        if (!item || !item.name) continue;
        const meta = gameData.items && gameData.items[item.name];
        if (!meta || typeof meta !== 'object') continue;
        const slots = candidateSlots(meta);
        if (!slots.length) continue;
        candidates.push({ sourceCharacter: source.name, item, meta, slots });
      }
    }
    this.stats.candidates += candidates.length;
    const seenGoalIds = new Set();
    let blockedUnknownContent = 0;

    for (const character of characters) {
      for (const candidate of candidates) {
        if (!compatible(candidate.meta, character)) continue;
        if (this._unsafe(context.contentDrift, candidate.item.name)) { blockedUnknownContent += 1; continue; }
        let best = null;
        for (const slot of candidate.slots) {
          const current = this._currentItem(character, slot, gameData);
          const meaningful = this._firstMeaningful(candidate.meta, levelOf(candidate.item), current.score, character.ctype);
          if (!meaningful) continue;
          const improvement = meaningful.score.total - current.score.total;
          const survivalImprovement = meaningful.score.survival - current.score.survival;
          const row = { slot, current, meaningful, improvement, survivalImprovement };
          if (!best || row.improvement > best.improvement || (row.improvement === best.improvement && row.survivalImprovement > best.survivalImprovement)) best = row;
        }
        if (!best) continue;
        const targetLevel = best.meaningful.level;
        const id = this._goalId(character.name, best.slot, candidate.item.name, targetLevel);
        seenGoalIds.add(id);
        const existing = this.goals.get(id);
        const goal = {
          schemaVersion: GEAR_PROGRESSION_SCHEMA_VERSION,
          id,
          character: character.name,
          ctype: character.ctype,
          slot: best.slot,
          sourceCharacter: candidate.sourceCharacter,
          item: candidate.item.name,
          observedLevel: levelOf(candidate.item),
          targetLevel,
          currentItem: best.current.name,
          currentLevel: best.current.level,
          currentScore: best.current.score.total,
          targetScore: best.meaningful.score.total,
          improvement: best.improvement,
          survivalImprovement: best.survivalImprovement,
          projectedUpgradeRequired: targetLevel > levelOf(candidate.item),
          feasibility: targetLevel > levelOf(candidate.item) ? 'MATERIALS_AND_RISK_UNMODELED' : 'HELD_AND_READY_FOR_LATER_EXECUTOR',
          priority: best.survivalImprovement > 0 ? 'SURVIVABILITY_OR_MIXED' : 'FARMING_EFFICIENCY',
          actionAuthority: false,
          firstSeenAt: existing ? existing.firstSeenAt : now,
          lastSeenAt: now
        };
        this.goals.set(id, goal);
        if (existing) this.stats.goalsUpdated += 1; else this.stats.goalsCreated += 1;
      }
    }

    for (const [id, goal] of this.goals.entries()) {
      if (!seenGoalIds.has(id) && now - finite(goal.lastSeenAt, now) > 24 * 60 * 60 * 1000) this.goals.delete(id);
    }
    this._prune();
    this.stats.blockedUnknownContent += blockedUnknownContent;
    this.stats.evaluations += 1;
    this.lastEvaluatedAt = now;

    const goals = this.list(this.capacity);
    const reservations = new Map();
    for (const goal of goals) {
      const key = `${goal.item}:${goal.observedLevel}`;
      const current = reservations.get(key) || { name: goal.item, level: goal.observedLevel, quantity: 0, goalIds: [] };
      current.quantity += 1;
      current.goalIds.push(goal.id);
      reservations.set(key, current);
    }
    this.lastEvaluation = { at: now, characters: characters.length, candidates: candidates.length, activeGoals: goals.length, blockedUnknownContent };
    this.save();
    return { status: this.status(), goals, reservations: [...reservations.values()].map(clone) };
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== GEAR_PROGRESSION_SCHEMA_VERSION || !Array.isArray(data.goals)) throw new Error('unsupported gear progression schema');
      this.goals = new Map(data.goals.filter((row) => Array.isArray(row) && row.length === 2));
      this._prune();
      return true;
    } catch (error) {
      this.goals.clear();
      this.stats.loadErrors += 1;
      this._event('GEAR_PROGRESSION_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', { message: String(error && error.message || error) });
      return false;
    }
  }

  serialize() {
    return JSON.stringify({ schemaVersion: GEAR_PROGRESSION_SCHEMA_VERSION, savedAt: this.now(), goals: [...this.goals.entries()] });
  }

  save(options = {}) {
    const backend = this._backend();
    if (!backend) return false;
    const now = this.now();
    if (options.force !== true && this.lastSavedAt != null && now - this.lastSavedAt < 30000) return false;
    try {
      backend.set(this.key, this.serialize());
      this.lastSavedAt = now;
      return true;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('GEAR_PROGRESSION_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', { message: String(error && error.message || error) });
      return false;
    }
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.capacity, Math.floor(finite(limit, 100))));
    return [...this.goals.values()]
      .sort((a, b) => b.survivalImprovement - a.survivalImprovement || b.improvement - a.improvement || a.id.localeCompare(b.id))
      .slice(0, n)
      .map(clone);
  }

  status() {
    return {
      schemaVersion: GEAR_PROGRESSION_SCHEMA_VERSION,
      mode: GEAR_PROGRESSION_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      destructiveActionsEnabled: false,
      defaultProgressionMode: 'sustainable',
      capacity: this.capacity,
      maxProbeLevel: this.maxProbeLevel,
      minImprovementRatio: this.minImprovementRatio,
      goals: this.goals.size,
      lastEvaluatedAt: this.lastEvaluatedAt,
      lastEvaluation: clone(this.lastEvaluation),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  GearProgressionEvaluator,
  GEAR_PROGRESSION_SCHEMA_VERSION,
  GEAR_PROGRESSION_MODE,
  CLASS_WEIGHTS,
  effectiveStats,
  scoreItem,
  candidateSlots
};

},
"src/autonomy/alpha15-runtime.js": function(require,module,exports){
'use strict';

const { Alpha14Runtime } = require('./alpha14-runtime');
const { EconomyTransactionEngine } = require('../economy/transaction-engine');

const ALPHA15_VERSION = '3.0.0-alpha.15.0';

class Alpha15Runtime extends Alpha14Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA15_VERSION;
    this.transactionMaintenanceIntervalMs = Math.max(250, Math.min(30000, Number(options.transactionMaintenanceIntervalMs) || 1000));
    this.lastTransactionMaintenanceAt = -Infinity;
    this.transactionEngine = options.transactionEngine || new EconomyTransactionEngine({
      now: this.now,
      log: this.log,
      storage: options.transactionStorage || options.storage,
      capacity: options.transactionCapacity,
      leaseMs: options.transactionLeaseMs,
      failureWindowMs: options.transactionFailureWindowMs,
      failureThreshold: options.transactionFailureThreshold,
      circuitCooldownMs: options.transactionCircuitCooldownMs
    });
    this.transactionEngine.load();
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA15_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _economyStatus() {
    return {
      schemaVersion: 1,
      mode: 'transaction-foundation',
      actionAuthority: false,
      directGameplayActionAccess: false,
      liveEnabled: false,
      sellLiveEnabled: false,
      bankLiveEnabled: false,
      compoundLiveEnabled: false,
      upgradeLiveEnabled: false,
      exchangeLiveEnabled: false,
      transactions: this.transactionEngine.status()
    };
  }

  _evaluateGlobalSupervisor() {
    const baseStatus = super.status();
    const status = { ...baseStatus, economy: this._economyStatus() };
    const result = this.globalSupervisor.observe({ runtime: this, status, contentDrift: this.contentDrift.status() });
    this.lastSupervisorResult = result;
    return result;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastTransactionMaintenanceAt >= this.transactionMaintenanceIntervalMs) {
      this.lastTransactionMaintenanceAt = now;
      this.transactionEngine.tick();
    }
  }

  stop() {
    if (this.transactionEngine) this.transactionEngine.save();
    return super.stop();
  }

  setEconomyLiveEnabled() {
    this.log.emit({ component: 'economy-transaction', event: 'LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'ALPHA15_SHADOW_ONLY' });
    return false;
  }

  planEconomyTransaction(request) {
    return this.transactionEngine.plan(request, { ledger: this.inventoryLedger, snapshot: this.lastSnapshot });
  }

  reconcileEconomyTransaction(id) {
    return this.transactionEngine.reconcile(id, { ledger: this.inventoryLedger, snapshot: this.lastSnapshot });
  }

  status() {
    const base = super.status();
    return { ...base, version: ALPHA15_VERSION, economy: this._economyStatus() };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.economy = {
      status: this._economyStatus(),
      transactions: this.transactionEngine.list(200)
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha15Runtime, ALPHA15_VERSION };

},
"src/economy/transaction-engine.js": function(require,module,exports){
'use strict';

const TRANSACTION_SCHEMA_VERSION = 1;
const TRANSACTION_MODE = 'shadow-transaction-foundation';
const TransactionType = Object.freeze({
  SELL: 'SELL',
  BANK: 'BANK',
  EXCHANGE: 'EXCHANGE',
  COMPOUND: 'COMPOUND',
  UPGRADE: 'UPGRADE'
});
const TransactionState = Object.freeze({
  PREFLIGHT: 'PREFLIGHT',
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const TERMINAL = new Set([TransactionState.COMMITTED, TransactionState.ABORTED, TransactionState.FAILED_SAFE]);
const EXPECTED_DISPOSITIONS = Object.freeze({
  [TransactionType.SELL]: ['SELL'],
  [TransactionType.BANK]: ['BANK'],
  [TransactionType.EXCHANGE]: ['EXCHANGE'],
  [TransactionType.COMPOUND]: ['RESERVE_COMPOUND'],
  [TransactionType.UPGRADE]: ['RESERVE_UPGRADE', 'RESERVE_PROGRESSION']
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function storageGet(storage, key) {
  if (!storage) return null;
  if (typeof storage.get === 'function') return storage.get(key);
  if (typeof storage.getItem === 'function') return storage.getItem(key);
  return null;
}
function storageSet(storage, key, value) {
  if (!storage) return false;
  if (typeof storage.set === 'function') { storage.set(key, value); return true; }
  if (typeof storage.setItem === 'function') { storage.setItem(key, value); return true; }
  return false;
}

class EconomyTransactionEngine {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3:economy-transactions:v1';
    this.capacity = Math.max(16, Math.min(512, Math.floor(finite(options.capacity, 128))));
    this.leaseMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.leaseMs, 30000)));
    this.failureWindowMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.circuitCooldownMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.transactions = new Map();
    this.reservations = new Map();
    this.failures = new Map();
    this.circuits = new Map();
    this.sequence = 0;
    this.lastSavedAt = null;
    this.stats = {
      planned: 0, rejected: 0, cancelled: 0, expired: 0, reconciled: 0,
      committed: 0, failedSafe: 0, loadErrors: 0, saveErrors: 0, capacityEvictions: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'economy-transaction', event, severity, reason, data });
  }

  _id(type) {
    this.sequence += 1;
    return `tx-${this.now().toString(36)}-${String(type || 'x').toLowerCase()}-${this.sequence.toString(36)}`;
  }

  _pruneFailures(type, now = this.now()) {
    const key = String(type || 'UNKNOWN');
    const rows = (this.failures.get(key) || []).filter((row) => now - row.at <= this.failureWindowMs);
    this.failures.set(key, rows);
    const circuit = this.circuits.get(key);
    if (circuit && circuit.openUntil <= now) this.circuits.delete(key);
    return rows;
  }

  breaker(type) {
    const key = String(type || 'UNKNOWN');
    const now = this.now();
    const failures = this._pruneFailures(key, now);
    const circuit = this.circuits.get(key) || null;
    return {
      family: key,
      open: !!(circuit && circuit.openUntil > now),
      openUntil: circuit ? circuit.openUntil : null,
      reason: circuit ? circuit.reason : null,
      failuresInWindow: failures.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  noteFailure(type, reason = 'TRANSACTION_FAILURE') {
    const key = String(type || 'UNKNOWN');
    const now = this.now();
    const rows = this._pruneFailures(key, now);
    rows.push({ at: now, reason: String(reason || 'TRANSACTION_FAILURE') });
    this.failures.set(key, rows);
    if (rows.length >= this.failureThreshold) {
      this.circuits.set(key, { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'FAILURE_BUDGET_EXHAUSTED') });
      this._event('ECONOMY_CIRCUIT_OPENED', 'warn', reason, { family: key, failures: rows.length, openUntil: now + this.circuitCooldownMs });
    }
    return this.breaker(key);
  }

  noteSuccess(type) {
    const key = String(type || 'UNKNOWN');
    this.failures.delete(key);
    this.circuits.delete(key);
    this._event('ECONOMY_CIRCUIT_RESET', 'info', null, { family: key });
    return this.breaker(key);
  }

  _ledgerEntry(ledger, character, index) {
    if (!ledger || typeof ledger.get !== 'function') return null;
    try { return ledger.get(character, index); } catch (_) { return null; }
  }

  _reject(reason, data = {}) {
    this.stats.rejected += 1;
    this._event('TRANSACTION_PREFLIGHT_REJECTED', 'warn', reason, data);
    return { accepted: false, reason };
  }

  _evictIfNeeded() {
    if (this.transactions.size < this.capacity) return;
    const terminal = [...this.transactions.values()]
      .filter((row) => TERMINAL.has(row.state))
      .sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt));
    const candidate = terminal[0];
    if (!candidate) return;
    this.transactions.delete(candidate.id);
    this.stats.capacityEvictions += 1;
  }

  plan(request = {}, context = {}) {
    const type = String(request.type || '').toUpperCase();
    if (!Object.values(TransactionType).includes(type)) return this._reject('TRANSACTION_TYPE_NOT_ALLOWED', { type });
    if (this.breaker(type).open) return this._reject('TRANSACTION_CIRCUIT_OPEN', { type });
    const character = String(request.character || '').trim();
    const index = Number(request.index);
    const quantity = Math.max(1, Math.floor(finite(request.quantity, 1)));
    if (!character || !Number.isInteger(index) || index < 0) return this._reject('INVALID_ITEM_REFERENCE', { type, character, index });

    const ledgerStatus = context.ledger && typeof context.ledger.status === 'function' ? context.ledger.status() : null;
    if (!ledgerStatus || ledgerStatus.stale === true) return this._reject('LEDGER_UNAVAILABLE_OR_STALE', { type, character, index });
    const entry = this._ledgerEntry(context.ledger, character, index);
    if (!entry) return this._reject('LEDGER_ITEM_NOT_FOUND', { type, character, index });
    if (entry.actionAuthority !== false) return this._reject('LEDGER_AUTHORITY_CONTRACT_INVALID', { type, character, index });
    if (!EXPECTED_DISPOSITIONS[type].includes(entry.disposition)) {
      return this._reject('LEDGER_DISPOSITION_NOT_AUTHORIZED', { type, character, index, disposition: entry.disposition });
    }
    if (quantity > Math.max(1, finite(entry.q, 1))) return this._reject('QUANTITY_EXCEEDS_OBSERVED_STACK', { type, quantity, observed: entry.q });

    const reservationKey = String(entry.key || `${character}:${index}`);
    const existing = this.reservations.get(reservationKey);
    if (existing) return this._reject('ITEM_ALREADY_RESERVED', { type, reservationKey, transactionId: existing });

    this._evictIfNeeded();
    if (this.transactions.size >= this.capacity) return this._reject('TRANSACTION_CAPACITY_EXHAUSTED', { capacity: this.capacity });

    const now = this.now();
    const id = this._id(type);
    const row = {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      id,
      type,
      state: TransactionState.RESERVED,
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      character,
      index,
      quantity,
      reservationKey,
      item: String(entry.name),
      level: Math.max(0, Math.floor(finite(entry.level, 0))),
      disposition: entry.disposition,
      expectedDisposition: EXPECTED_DISPOSITIONS[type].slice(),
      reason: 'PREFLIGHT_OK_RESERVED',
      executionAllowed: false,
      actionAuthority: false,
      restartReconcileRequired: false,
      metadata: request.metadata && typeof request.metadata === 'object' ? clone(request.metadata) : {}
    };
    this.transactions.set(id, row);
    this.reservations.set(reservationKey, id);
    this.stats.planned += 1;
    this._event('TRANSACTION_RESERVED', 'info', null, { transactionId: id, type, item: row.item, character, index, quantity, leaseExpiresAt: row.leaseExpiresAt });
    this.save();
    return { accepted: true, transaction: clone(row) };
  }

  _release(row) {
    if (!row || !row.reservationKey) return;
    if (this.reservations.get(row.reservationKey) === row.id) this.reservations.delete(row.reservationKey);
  }

  cancel(id, reason = 'OPERATOR_CANCELLED') {
    const row = this.transactions.get(String(id));
    if (!row) return { cancelled: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (TERMINAL.has(row.state)) return { cancelled: false, reason: 'TRANSACTION_ALREADY_TERMINAL', transaction: clone(row) };
    row.state = TransactionState.ABORTED;
    row.reason = String(reason || 'OPERATOR_CANCELLED');
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    this._release(row);
    this.stats.cancelled += 1;
    this._event('TRANSACTION_ABORTED', 'warn', row.reason, { transactionId: row.id, type: row.type });
    this.save();
    return { cancelled: true, transaction: clone(row) };
  }

  reconcile(id, context = {}) {
    const row = this.transactions.get(String(id));
    if (!row) return { reconciled: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (row.state !== TransactionState.RECOVERING) return { reconciled: false, reason: 'TRANSACTION_NOT_RECOVERING', transaction: clone(row) };
    const entry = this._ledgerEntry(context.ledger, row.character, row.index);
    const stillMatches = !!entry && entry.name === row.item && Math.max(0, Math.floor(finite(entry.level, 0))) === row.level;
    row.state = TransactionState.ABORTED;
    row.reason = stillMatches ? 'RESTART_RECONCILED_ABORTED_UNEXECUTED' : 'RESTART_RECONCILED_ITEM_CHANGED';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    this._release(row);
    this.stats.reconciled += 1;
    this._event('TRANSACTION_RECONCILED_SAFE', 'warn', row.reason, { transactionId: row.id, type: row.type, itemStillMatches: stillMatches });
    this.save();
    return { reconciled: true, itemStillMatches: stillMatches, transaction: clone(row) };
  }

  markCommitted(id, evidence = {}) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = TransactionState.COMMITTED;
    row.reason = 'VERIFIED_COMMIT';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.evidence = clone(evidence);
    this._release(row);
    this.stats.committed += 1;
    this.noteSuccess(row.type);
    this.save();
    return true;
  }

  markFailedSafe(id, reason = 'FAILED_SAFE') {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = TransactionState.FAILED_SAFE;
    row.reason = String(reason || 'FAILED_SAFE');
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    this._release(row);
    this.stats.failedSafe += 1;
    this.noteFailure(row.type, row.reason);
    this.save();
    return true;
  }

  transition(id, nextState, reason = null) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    if (![TransactionState.EXECUTING, TransactionState.VERIFYING].includes(nextState)) return false;
    row.state = nextState;
    row.reason = reason || nextState;
    row.updatedAt = this.now();
    return true;
  }

  tick() {
    const now = this.now();
    let expired = 0;
    for (const row of this.transactions.values()) {
      if (TERMINAL.has(row.state) || row.state === TransactionState.RECOVERING) continue;
      if (row.leaseExpiresAt != null && now > row.leaseExpiresAt) {
        row.state = TransactionState.ABORTED;
        row.reason = 'TRANSACTION_LEASE_EXPIRED';
        row.updatedAt = now;
        row.leaseExpiresAt = null;
        this._release(row);
        this.stats.expired += 1;
        expired += 1;
        this._event('TRANSACTION_LEASE_EXPIRED', 'warn', 'TRANSACTION_LEASE_EXPIRED', { transactionId: row.id, type: row.type });
      }
    }
    if (expired) this.save();
    for (const type of Object.values(TransactionType)) this._pruneFailures(type, now);
    return { expired };
  }

  list(limit = 100) {
    const rows = [...this.transactions.values()].sort((a, b) => finite(a.createdAt) - finite(b.createdAt));
    const n = Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))));
    return rows.slice(rows.length - n).map(clone);
  }

  get(id) {
    const row = this.transactions.get(String(id));
    return row ? clone(row) : null;
  }

  save() {
    if (!this.storage) return false;
    try {
      const payload = JSON.stringify({
        schemaVersion: TRANSACTION_SCHEMA_VERSION,
        savedAt: this.now(),
        sequence: this.sequence,
        transactions: this.list(this.capacity),
        failures: [...this.failures.entries()],
        circuits: [...this.circuits.entries()]
      });
      const ok = storageSet(this.storage, this.storageKey, payload);
      if (ok) this.lastSavedAt = this.now();
      return ok;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('TRANSACTION_SAVE_FAILED', 'error', 'PERSISTENCE_WRITE_FAILED', { message: String(error && error.message || error) });
      return false;
    }
  }

  load() {
    this.transactions.clear();
    this.reservations.clear();
    if (!this.storage) return false;
    try {
      const raw = storageGet(this.storage, this.storageKey);
      if (!raw) return false;
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!payload || payload.schemaVersion !== TRANSACTION_SCHEMA_VERSION || !Array.isArray(payload.transactions)) throw new Error('UNSUPPORTED_TRANSACTION_SCHEMA');
      this.sequence = Math.max(0, Math.floor(finite(payload.sequence, 0)));
      for (const candidate of payload.transactions.slice(-this.capacity)) {
        if (!candidate || !candidate.id || !Object.values(TransactionType).includes(candidate.type)) continue;
        const row = clone(candidate);
        if (!TERMINAL.has(row.state)) {
          row.state = TransactionState.RECOVERING;
          row.reason = 'RESTART_RECONCILE_REQUIRED';
          row.restartReconcileRequired = true;
          row.leaseExpiresAt = null;
          if (row.reservationKey) this.reservations.set(row.reservationKey, row.id);
        }
        this.transactions.set(row.id, row);
      }
      this.failures = new Map(Array.isArray(payload.failures) ? payload.failures : []);
      this.circuits = new Map(Array.isArray(payload.circuits) ? payload.circuits : []);
      this._event('TRANSACTION_STATE_LOADED', 'info', null, { transactions: this.transactions.size, recovering: [...this.transactions.values()].filter((row) => row.state === TransactionState.RECOVERING).length });
      return true;
    } catch (error) {
      this.transactions.clear();
      this.reservations.clear();
      this.failures.clear();
      this.circuits.clear();
      this.stats.loadErrors += 1;
      this._event('TRANSACTION_LOAD_FAILED', 'error', 'PERSISTENCE_CORRUPT_FAIL_CLOSED', { message: String(error && error.message || error) });
      return false;
    }
  }

  status() {
    const rows = [...this.transactions.values()];
    const states = {};
    for (const state of Object.values(TransactionState)) states[state] = rows.filter((row) => row.state === state).length;
    const circuits = {};
    for (const type of Object.values(TransactionType)) circuits[type] = this.breaker(type);
    return {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      mode: TRANSACTION_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      liveExecutionEnabled: false,
      supportedFamilies: Object.values(TransactionType),
      liveFamilies: [],
      capacity: this.capacity,
      leaseMs: this.leaseMs,
      transactions: rows.length,
      active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== TransactionState.RECOVERING).length,
      recovering: states.RECOVERING || 0,
      reservations: this.reservations.size,
      states,
      circuits,
      lastSavedAt: this.lastSavedAt,
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  EconomyTransactionEngine,
  TRANSACTION_SCHEMA_VERSION,
  TRANSACTION_MODE,
  TransactionType,
  TransactionState,
  EXPECTED_DISPOSITIONS
};

},
"src/autonomy/alpha16-runtime.js": function(require,module,exports){
'use strict';

const { Alpha15Runtime } = require('./alpha15-runtime');
const { SafeTravelController } = require('../travel/safe-travel');

const ALPHA16_VERSION = '3.0.0-alpha.16.0';

class Alpha16Runtime extends Alpha15Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA16_VERSION;
    this.travelMaintenanceIntervalMs = Math.max(250, Math.min(30000, Number(options.travelMaintenanceIntervalMs) || 1000));
    this.lastTravelMaintenanceAt = -Infinity;
    this.safeTravel = options.safeTravel || new SafeTravelController({
      now: this.now,
      log: this.log,
      capacity: options.travelCapacity,
      leaseMs: options.travelLeaseMs,
      noProgressMs: options.travelNoProgressMs,
      arrivalRadius: options.travelArrivalRadius,
      minProgressDistance: options.travelMinProgressDistance,
      failureThreshold: options.travelFailureThreshold,
      failureWindowMs: options.travelFailureWindowMs,
      circuitCooldownMs: options.travelCircuitCooldownMs
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA16_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _travelStatus() { return this.safeTravel.status(); }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastTravelMaintenanceAt >= this.travelMaintenanceIntervalMs) {
      this.lastTravelMaintenanceAt = now;
      this.safeTravel.tick(this.lastSnapshot || {});
    }
  }

  setTravelLiveEnabled() {
    this.log.emit({ component: 'safe-travel', event: 'LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'ALPHA16_SHADOW_ONLY' });
    return false;
  }

  planTravel(request) {
    return this.safeTravel.plan(request, {
      gameData: this.adapter.getGameData() || {},
      contentDrift: this.contentDrift,
      snapshot: this.lastSnapshot || this.adapter.snapshot()
    });
  }

  status() {
    const base = super.status();
    return { ...base, version: ALPHA16_VERSION, travel: this._travelStatus() };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.travel = { status: this.safeTravel.status(), plans: this.safeTravel.list(100) };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha16Runtime, ALPHA16_VERSION };

},
"src/travel/safe-travel.js": function(require,module,exports){
'use strict';

const TRAVEL_SCHEMA_VERSION = 1;
const TRAVEL_MODE = 'shadow-safe-travel-foundation';
const TravelState = Object.freeze({
  PLANNED: 'PLANNED',
  TRAVELLING: 'TRAVELLING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const TERMINAL = new Set([TravelState.COMPLETED, TravelState.ABORTED, TravelState.FAILED_SAFE]);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function point(snapshot = {}) {
  const c = snapshot.character || snapshot || {};
  return {
    map: String(c.map || ''),
    x: finite(c.x != null ? c.x : c.real_x, 0),
    y: finite(c.y != null ? c.y : c.real_y, 0)
  };
}
function distance(a, b) {
  const dx = finite(a && a.x) - finite(b && b.x);
  const dy = finite(a && a.y) - finite(b && b.y);
  return Math.hypot(dx, dy);
}

class SafeTravelController {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(16, Math.min(256, Math.floor(finite(options.capacity, 64))));
    this.leaseMs = Math.max(5000, Math.min(30 * 60 * 1000, finite(options.leaseMs, 120000)));
    this.noProgressMs = Math.max(2000, Math.min(5 * 60 * 1000, finite(options.noProgressMs, 15000)));
    this.arrivalRadius = Math.max(5, Math.min(300, finite(options.arrivalRadius, 80)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.failureWindowMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.circuitCooldownMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.minProgressDistance = Math.max(1, Math.min(200, finite(options.minProgressDistance, 12)));
    this.plans = new Map();
    this.sequence = 0;
    this.failures = [];
    this.circuit = null;
    this.stats = { planned: 0, rejected: 0, syntheticStarts: 0, completed: 0, aborted: 0, failedSafe: 0, progress: 0, capacityEvictions: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'safe-travel', event, severity, reason, data });
    }
  }

  _id() {
    this.sequence += 1;
    return `travel-${this.now().toString(36)}-${this.sequence.toString(36)}`;
  }

  _pruneFailures(now = this.now()) {
    this.failures = this.failures.filter((row) => now - row.at <= this.failureWindowMs);
    if (this.circuit && this.circuit.openUntil <= now) this.circuit = null;
  }

  breaker() {
    const now = this.now();
    this._pruneFailures(now);
    return {
      open: !!(this.circuit && this.circuit.openUntil > now),
      openUntil: this.circuit ? this.circuit.openUntil : null,
      reason: this.circuit ? this.circuit.reason : null,
      failuresInWindow: this.failures.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  _failure(reason, plan = null) {
    const now = this.now();
    this._pruneFailures(now);
    this.failures.push({ at: now, reason: String(reason || 'TRAVEL_FAILURE'), planId: plan && plan.id || null });
    if (this.failures.length >= this.failureThreshold) {
      this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'TRAVEL_FAILURE_BUDGET') };
      this._event('TRAVEL_CIRCUIT_OPENED', 'warn', reason, { openUntil: this.circuit.openUntil, failures: this.failures.length });
    }
  }

  _reject(reason, data = {}) {
    this.stats.rejected += 1;
    this._event('TRAVEL_PLAN_REJECTED', 'warn', reason, data);
    return { accepted: false, reason };
  }

  _evict() {
    if (this.plans.size < this.capacity) return;
    const row = [...this.plans.values()].filter((p) => TERMINAL.has(p.state)).sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt))[0];
    if (row) {
      this.plans.delete(row.id);
      this.stats.capacityEvictions += 1;
    }
  }

  plan(request = {}, context = {}) {
    if (this.breaker().open) return this._reject('TRAVEL_CIRCUIT_OPEN');
    if (request.server || request.region || request.serverChange === true) return this._reject('SERVER_CHANGE_FORBIDDEN');
    const destination = typeof request.destination === 'string' ? { map: request.destination } : clone(request.destination || {});
    const map = String(destination.map || '').trim();
    if (!map) return this._reject('DESTINATION_MAP_REQUIRED');
    const gameData = context.gameData || {};
    if (!gameData.maps || !Object.prototype.hasOwnProperty.call(gameData.maps, map)) return this._reject('UNKNOWN_DESTINATION_MAP', { map });
    if (context.contentDrift && typeof context.contentDrift.requiresRevalidation === 'function' && context.contentDrift.requiresRevalidation('maps', map)) {
      return this._reject('DESTINATION_MAP_REQUIRES_REVALIDATION', { map });
    }
    const start = point(context.snapshot || {});
    if (!start.map) return this._reject('TRAVEL_SNAPSHOT_UNAVAILABLE');
    const target = {
      map,
      x: destination.x == null ? null : finite(destination.x, 0),
      y: destination.y == null ? null : finite(destination.y, 0)
    };
    this._evict();
    if (this.plans.size >= this.capacity) return this._reject('TRAVEL_CAPACITY_EXHAUSTED');
    const now = this.now();
    const id = this._id();
    const row = {
      schemaVersion: TRAVEL_SCHEMA_VERSION,
      id,
      state: TravelState.PLANNED,
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      lastProgressAt: now,
      start,
      lastObserved: start,
      target,
      reason: 'SAFE_PLAN_CREATED',
      actionAuthority: false,
      liveExecutionAllowed: false,
      serverChangeAllowed: false,
      routeKind: start.map === map ? 'SAME_MAP' : 'CROSS_MAP_KNOWN_ONLY',
      metadata: request.metadata && typeof request.metadata === 'object' ? clone(request.metadata) : {}
    };
    this.plans.set(id, row);
    this.stats.planned += 1;
    this._event('TRAVEL_PLAN_CREATED', 'info', null, { planId: id, from: start.map, to: map, routeKind: row.routeKind });
    return { accepted: true, plan: clone(row) };
  }

  startSynthetic(id) {
    const row = this.plans.get(String(id));
    if (!row || row.state !== TravelState.PLANNED) return { started: false, reason: 'PLAN_NOT_STARTABLE' };
    if (this.breaker().open) return { started: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    row.state = TravelState.TRAVELLING;
    row.updatedAt = this.now();
    row.lastProgressAt = row.updatedAt;
    row.reason = 'SYNTHETIC_EXECUTION_STARTED';
    this.stats.syntheticStarts += 1;
    this._event('TRAVEL_SYNTHETIC_STARTED', 'info', null, { planId: row.id });
    return { started: true, plan: clone(row) };
  }

  _arrived(row, observed) {
    if (!row || !observed || observed.map !== row.target.map) return false;
    if (row.target.x == null || row.target.y == null) return true;
    return distance(observed, row.target) <= this.arrivalRadius;
  }

  observe(snapshot) {
    const now = this.now();
    const observed = point(snapshot || {});
    const results = [];
    for (const row of this.plans.values()) {
      if (TERMINAL.has(row.state) || row.state === TravelState.PLANNED) continue;
      if (row.leaseExpiresAt != null && now > row.leaseExpiresAt) {
        row.state = TravelState.FAILED_SAFE;
        row.reason = 'TRAVEL_LEASE_EXPIRED';
        row.updatedAt = now;
        this.stats.failedSafe += 1;
        this._failure(row.reason, row);
        results.push({ id: row.id, state: row.state, reason: row.reason });
        continue;
      }
      const mapChanged = observed.map && observed.map !== row.lastObserved.map;
      const moved = observed.map === row.lastObserved.map && distance(observed, row.lastObserved) >= this.minProgressDistance;
      if (mapChanged || moved) {
        row.lastProgressAt = now;
        row.lastObserved = observed;
        row.updatedAt = now;
        this.stats.progress += 1;
        this._event('TRAVEL_PROGRESS', 'debug', null, { planId: row.id, observed });
      }
      if (this._arrived(row, observed)) {
        row.state = TravelState.COMPLETED;
        row.reason = 'ARRIVAL_VERIFIED';
        row.updatedAt = now;
        row.lastObserved = observed;
        this.stats.completed += 1;
        this.failures = [];
        this.circuit = null;
        this._event('TRAVEL_COMPLETED', 'info', null, { planId: row.id, observed });
        results.push({ id: row.id, state: row.state, reason: row.reason });
        continue;
      }
      if (now - row.lastProgressAt > this.noProgressMs) {
        row.state = TravelState.FAILED_SAFE;
        row.reason = 'TRAVEL_NO_PROGRESS_TIMEOUT';
        row.updatedAt = now;
        this.stats.failedSafe += 1;
        this._failure(row.reason, row);
        this._event('TRAVEL_FAILED_SAFE', 'warn', row.reason, { planId: row.id });
        results.push({ id: row.id, state: row.state, reason: row.reason });
      }
    }
    return results;
  }

  cancel(id, reason = 'OPERATOR_CANCELLED') {
    const row = this.plans.get(String(id));
    if (!row) return { cancelled: false, reason: 'PLAN_NOT_FOUND' };
    if (TERMINAL.has(row.state)) return { cancelled: false, reason: 'PLAN_ALREADY_TERMINAL', plan: clone(row) };
    row.state = TravelState.ABORTED;
    row.reason = String(reason || 'OPERATOR_CANCELLED');
    row.updatedAt = this.now();
    this.stats.aborted += 1;
    this._event('TRAVEL_ABORTED', 'warn', row.reason, { planId: row.id });
    return { cancelled: true, plan: clone(row) };
  }

  tick(snapshot) {
    this._pruneFailures(this.now());
    return this.observe(snapshot);
  }

  get(id) {
    const row = this.plans.get(String(id));
    return row ? clone(row) : null;
  }

  list(limit = 100) {
    const rows = [...this.plans.values()].sort((a, b) => finite(a.createdAt) - finite(b.createdAt));
    const n = Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))));
    return rows.slice(rows.length - n).map(clone);
  }

  status() {
    const rows = [...this.plans.values()];
    const states = {};
    for (const state of Object.values(TravelState)) states[state] = rows.filter((row) => row.state === state).length;
    return {
      schemaVersion: TRAVEL_SCHEMA_VERSION,
      mode: TRAVEL_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      liveExecutionEnabled: false,
      smartMoveExecutionEnabled: false,
      serverChangeAllowed: false,
      unknownMapTravelAllowed: false,
      capacity: this.capacity,
      leaseMs: this.leaseMs,
      noProgressMs: this.noProgressMs,
      arrivalRadius: this.arrivalRadius,
      plans: rows.length,
      active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== TravelState.PLANNED).length,
      states,
      circuit: this.breaker(),
      stats: clone(this.stats)
    };
  }
}

module.exports = { SafeTravelController, TRAVEL_SCHEMA_VERSION, TRAVEL_MODE, TravelState };

},
"src/autonomy/alpha17-runtime.js": function(require,module,exports){
'use strict';

const { Alpha16Runtime } = require('./alpha16-runtime');
const { ControlledMerchantExecutor, CONTROLLED_MERCHANT_ACK } = require('../economy/controlled-merchant-executor');
const { sellMetadataConsensus, rawSellProtectionReasons } = require('../economy/sell-safety');
const { ControlledTravelExecutor, CONTROLLED_TRAVEL_ACK } = require('../travel/controlled-travel-executor');

const ALPHA17_VERSION = '3.0.0-alpha.17.0';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function registryName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

class Alpha17Runtime extends Alpha16Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA17_VERSION;
    if (this.inventoryLedger && typeof this.inventoryLedger.setSellSafetyResolver === 'function') {
      this.inventoryLedger.setSellSafetyResolver(({ row }) => {
        const blockers = sellMetadataConsensus(this.root, row && row.name).blockers.slice();
        const character = this.root && this.root.character;
        const sameCharacter = character && row && String(character.name || '') === String(row.character || '');
        if (sameCharacter) {
          const items = Array.isArray(character.items) ? character.items : [];
          const index = Number(row.index);
          const rawItem = Number.isInteger(index) && index >= 0 ? items[index] : null;
          blockers.push(...rawSellProtectionReasons(rawItem));
        }
        return [...new Set(blockers)];
      });
    }
    this.controlledMerchant = options.controlledMerchant || new ControlledMerchantExecutor({
      root: this.root,
      engine: this.transactionEngine,
      ledger: this.inventoryLedger,
      contentDrift: this.contentDrift,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      timeoutMs: options.controlledMerchantTimeoutMs,
      verifyDelayMs: options.controlledMerchantVerifyDelayMs,
      verifyAttempts: options.controlledMerchantVerifyAttempts,
      actionWindowMs: options.controlledMerchantActionWindowMs,
      maxActionsPerWindow: options.controlledMerchantMaxActionsPerWindow
    });
    this.controlledTravel = options.controlledTravel || new ControlledTravelExecutor({
      root: this.root,
      controller: this.safeTravel,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      timeoutMs: options.controlledTravelTimeoutMs
    });
    this.lastControlledGuardReason = null;
    this.registryVisibility = { foreignVisibleIgnored: 0, lastObservedAt: null };
  }

  _partyObservation() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return null;

    const selfName = registryName(snapshot.character.name);
    const partyNames = new Set((snapshot.party || []).map((member) => registryName(member && member.name)).filter(Boolean));
    if (selfName) partyNames.add(selfName);
    const knownNames = new Set(
      (this.characterRegistry && typeof this.characterRegistry.list === 'function' ? this.characterRegistry.list() : [])
        .map((member) => registryName(member && member.name))
        .filter(Boolean)
    );

    let ignored = 0;
    const entities = (snapshot.entities || []).filter((entity) => {
      const name = registryName(entity && entity.name);
      if (!name) return false;
      const allowed = name === selfName || partyNames.has(name) || knownNames.has(name);
      if (!allowed) ignored += 1;
      return allowed;
    });

    this.registryVisibility.foreignVisibleIgnored += ignored;
    this.registryVisibility.lastObservedAt = snapshot.observedAt || this.now();

    return this.characterRegistry.observe({
      snapshot: { ...snapshot, entities },
      gameData: this.adapter.getGameData() || {},
      liveCharacter: this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA17_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _controlledSubsystemHealth() {
    const tx = this.transactionEngine.status();
    const economyReasons = [];
    for (const family of ['SELL', 'BANK']) {
      if (tx.circuits && tx.circuits[family] && tx.circuits[family].open) economyReasons.push(`${family}_CIRCUIT_OPEN`);
    }
    const economyLast = this.controlledMerchant && this.controlledMerchant.status().lastAction;
    const economy = economyReasons.length
      ? { state: 'DEGRADED', reasons: economyReasons }
      : economyLast && economyLast.result === 'FAILED_SAFE'
        ? { state: 'WATCH', reasons: ['CONTROLLED_MERCHANT_LAST_ACTION_FAILED_SAFE'] }
        : { state: 'HEALTHY', reasons: [] };

    const breaker = this.safeTravel.breaker();
    const travelLast = this.controlledTravel && this.controlledTravel.status().lastAction;
    const travel = breaker.open
      ? { state: 'DEGRADED', reasons: ['TRAVEL_CIRCUIT_OPEN'] }
      : travelLast && travelLast.result === 'FAILED_SAFE'
        ? { state: 'WATCH', reasons: ['CONTROLLED_TRAVEL_LAST_ACTION_FAILED_SAFE'] }
        : { state: 'HEALTHY', reasons: [] };
    return { economy, travel };
  }

  _economyStatus() {
    const base = super._economyStatus();
    const controlled = this.controlledMerchant ? this.controlledMerchant.status() : null;
    return {
      ...base,
      mode: 'controlled-canary-default-off',
      actionAuthority: !!(controlled && controlled.actionAuthority),
      directGameplayActionAccess: !!(controlled && controlled.actionAuthority),
      liveEnabled: !!(controlled && controlled.enabled),
      sellLiveEnabled: !!(controlled && controlled.sellEnabled),
      bankLiveEnabled: !!(controlled && controlled.bankEnabled),
      controlled
    };
  }

  _travelStatus() {
    const base = super._travelStatus();
    const controlled = this.controlledTravel ? this.controlledTravel.status() : null;
    return {
      ...base,
      plannerActionAuthority: false,
      actionAuthority: !!(controlled && controlled.actionAuthority),
      liveExecutionEnabled: !!(controlled && controlled.enabled),
      smartMoveExecutionEnabled: !!(controlled && controlled.enabled),
      controlled
    };
  }

  _evaluateGlobalSupervisor() {
    const status = super.status();
    const result = this.globalSupervisor.observe({ runtime: this, status, contentDrift: this.contentDrift.status() });
    this.lastSupervisorResult = result;
    return result;
  }

  _liveEnableGate() {
    if (this.adapter.mode !== 'active') return { allowed: false, reason: 'RUNTIME_NOT_ACTIVE' };
    const supervisor = this.globalSupervisor.status();
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { allowed: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this.root && this.root.character;
    if (!character || String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { allowed: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { allowed: false, reason: 'CHARACTER_DEAD' };
    return { allowed: true, reason: null };
  }

  _guardControlledAuthority() {
    const health = this._controlledSubsystemHealth();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (health.economy.state === 'DEGRADED') reason = 'ECONOMY_CIRCUIT_OPEN';

    if (reason && this.controlledMerchant.status().enabled) this.controlledMerchant.disable(reason);
    if ((reason || health.travel.state === 'DEGRADED') && this.controlledTravel.status().enabled) {
      const travelReason = health.travel.state === 'DEGRADED' ? 'TRAVEL_CIRCUIT_OPEN' : reason;
      Promise.resolve(this.controlledTravel.disable(travelReason)).catch((error) => {
        this.log.emit({ component: 'controlled-travel', event: 'CONTROLLED_TRAVEL_GUARD_DISABLE_FAILED', severity: 'error', reason: travelReason, data: { message: String(error && error.message || error) } });
      });
    }
    this.lastControlledGuardReason = reason || (health.travel.state === 'DEGRADED' ? 'TRAVEL_CIRCUIT_OPEN' : null);
    return { reason: this.lastControlledGuardReason, health };
  }

  tick() {
    super.tick();
    this._guardControlledAuthority();
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') {
      this.controlledMerchant.disable('RUNTIME_LEFT_ACTIVE_MODE');
      Promise.resolve(this.controlledTravel.disable('RUNTIME_LEFT_ACTIVE_MODE')).catch(() => {});
    }
    return resolved;
  }

  configureInventoryActionPolicy(config = {}) {
    const normalize = (value) => [...new Set((Array.isArray(value) ? value : []).map((x) => String(x || '').trim()).filter(Boolean))].slice(0, 128);
    const sell = normalize(config.sell);
    const bank = normalize(config.bank);
    const exchange = normalize(config.exchange);
    this.inventoryLedger.sellAllowlist = new Set(sell);
    this.inventoryLedger.bankAllowlist = new Set(bank);
    this.inventoryLedger.exchangeAllowlist = new Set(exchange);
    this.log.emit({ component: 'inventory-ledger', event: 'INVENTORY_ACTION_POLICY_CHANGED', severity: 'warn', reason: 'OPERATOR_POLICY', data: { sell, bank, exchange } });
    if (this.lastSnapshot) this._planInventoryAndGear();
    return clone(this.inventoryLedger.status().policy);
  }

  configureControlledMerchant(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledMerchant.disable(gate.reason);
        this.log.emit({ component: 'controlled-merchant', event: 'CONTROLLED_MERCHANT_ENABLE_REJECTED', severity: 'warn', reason: gate.reason });
        return { ...this.controlledMerchant.status(), enableRejected: gate.reason };
      }
    }
    return this.controlledMerchant.configure(config);
  }

  configureControlledTravel(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        Promise.resolve(this.controlledTravel.disable(gate.reason)).catch(() => {});
        this.log.emit({ component: 'controlled-travel', event: 'CONTROLLED_TRAVEL_ENABLE_REJECTED', severity: 'warn', reason: gate.reason });
        return { ...this.controlledTravel.status(), enableRejected: gate.reason };
      }
    }
    return this.controlledTravel.configure(config);
  }

  setEconomyLiveEnabled(enabled) {
    if (enabled !== true) return this.controlledMerchant.disable('GENERIC_LIVE_DISABLE');
    this.log.emit({ component: 'controlled-merchant', event: 'GENERIC_LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'USE_CONTROLLED_CANARY_API' });
    return false;
  }

  setTravelLiveEnabled(enabled) {
    if (enabled !== true) {
      Promise.resolve(this.controlledTravel.disable('GENERIC_LIVE_DISABLE')).catch(() => {});
      return false;
    }
    this.log.emit({ component: 'controlled-travel', event: 'GENERIC_LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'USE_CONTROLLED_CANARY_API' });
    return false;
  }

  executeEconomyTransaction(id) { return this.controlledMerchant.execute(id); }
  executeTravelPlan(id) { return this.controlledTravel.execute(id); }
  abortControlledTravel(reason) { return this.controlledTravel.abort(reason); }

  stop() {
    this.controlledMerchant.disable('RUNTIME_STOP');
    Promise.resolve(this.controlledTravel.disable('RUNTIME_STOP')).catch(() => {});
    return super.stop();
  }

  status() {
    const base = super.status();
    const controlledSubsystems = this._controlledSubsystemHealth();
    return {
      ...base,
      version: ALPHA17_VERSION,
      economy: this._economyStatus(),
      travel: this._travelStatus(),
      supervisor: { ...base.supervisor, controlledSubsystems },
      registryVisibility: clone(this.registryVisibility),
      controlledCanary: {
        explicitAck: CONTROLLED_MERCHANT_ACK,
        merchantAck: CONTROLLED_MERCHANT_ACK,
        travelAck: CONTROLLED_TRAVEL_ACK,
        defaultEnabled: false,
        guardReason: this.lastControlledGuardReason
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.controlledCanary = {
      economy: this._economyStatus(),
      travel: this._travelStatus(),
      supervisor: this._controlledSubsystemHealth(),
      guardReason: this.lastControlledGuardReason
    };
    base.context.registryVisibility = clone(this.registryVisibility);
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha17Runtime, ALPHA17_VERSION };

},
"src/economy/controlled-merchant-executor.js": function(require,module,exports){
'use strict';

const { sellMetadataConsensus, rawSellProtectionReasons, sellSafetyStatus } = require('./sell-safety');

const CONTROLLED_MERCHANT_MODE = 'controlled-live-default-off';
const LIVE_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function itemSnapshot(item) {
  if (!item) return null;
  return {
    name: item.name == null ? null : String(item.name),
    level: Math.max(0, Math.floor(finite(item.level, 0))),
    q: Math.max(1, Math.floor(finite(item.q, 1)))
  };
}
function identityQuantity(items, name, level) {
  if (!Array.isArray(items)) return 0;
  const wantedName = String(name || '');
  const wantedLevel = Math.max(0, Math.floor(finite(level, 0)));
  let total = 0;
  for (const item of items) {
    const snapshot = itemSnapshot(item);
    if (!snapshot || snapshot.name !== wantedName || snapshot.level !== wantedLevel) continue;
    total += snapshot.q;
  }
  return total;
}
function bankIdentityQuantity(bank, name, level) {
  if (!bank || typeof bank !== 'object') return 0;
  let total = 0;
  for (const pack of Object.values(bank)) {
    if (!Array.isArray(pack)) continue;
    total += identityQuantity(pack, name, level);
  }
  return total;
}
function bankStoreAcknowledged(response) {
  return !!response
    && typeof response === 'object'
    && response.failed !== true
    && response.success === true
    && String(response.place || '') === 'bank'
    && String(response.bank_action || '') === 'store';
}
function genericSuccessfulResponse(response) {
  if (!response || typeof response !== 'object' || response.failed === true || response.success !== true) return false;
  return response.place == null && response.bank_action == null;
}
function hasExplicitBankBinding(response) {
  return !!response && typeof response === 'object' && (response.place != null || response.bank_action != null);
}

class ControlledMerchantExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.engine = options.engine;
    this.ledger = options.ledger;
    this.contentDrift = options.contentDrift || null;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.timeoutMs = Math.max(1000, Math.min(30000, finite(options.timeoutMs, 8000)));
    this.verifyDelayMs = Math.max(0, Math.min(1000, finite(options.verifyDelayMs, 200)));
    this.verifyAttempts = Math.max(1, Math.min(20, Math.floor(finite(options.verifyAttempts, 10))));
    this.actionWindowMs = Math.max(10000, Math.min(30 * 60 * 1000, finite(options.actionWindowMs, 60000)));
    this.maxActionsPerWindow = Math.max(1, Math.min(10, Math.floor(finite(options.maxActionsPerWindow, 3))));
    this.enabled = false;
    this.sellEnabled = false;
    this.bankEnabled = false;
    this.busy = false;
    this.actionTimes = [];
    this.lastAction = null;
    this.stats = {
      attempts: 0,
      committed: 0,
      rejected: 0,
      failedSafe: 0,
      timeouts: 0,
      verificationRetries: 0,
      inventoryIndexRejected: 0,
      sellSafetyRejected: 0,
      bankServerAckCommits: 0,
      bankLocalEvidenceCommits: 0,
      bankLocalObservationMisses: 0,
      bankInvalidServerAcks: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'controlled-merchant', event, severity, reason, data });
    }
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== LIVE_ACK) {
      this.enabled = false;
      this.sellEnabled = false;
      this.bankEnabled = false;
      this._event('CONTROLLED_MERCHANT_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this.sellEnabled = wantsLive && config.sell === true;
    this.bankEnabled = wantsLive && config.bank === true;
    this._event('CONTROLLED_MERCHANT_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED', {
      enabled: this.enabled, sell: this.sellEnabled, bank: this.bankEnabled
    });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this.sellEnabled = false;
    this.bankEnabled = false;
    this._event('CONTROLLED_MERCHANT_DISABLED', 'warn', reason);
    return this.status();
  }

  _pruneActions() {
    const now = this.now();
    this.actionTimes = this.actionTimes.filter((at) => now - at <= this.actionWindowMs);
  }

  _inCombat() {
    const root = this.root || {};
    const character = root.character || {};
    if (character.target) return true;
    const parent = root.parent || {};
    const entities = parent.entities || root.entities || {};
    const selfNames = new Set([character.name, character.id].filter(Boolean).map(String));
    for (const entity of Object.values(entities)) {
      if (!entity || !entity.target) continue;
      if (selfNames.has(String(entity.target))) return true;
    }
    return false;
  }

  _ledgerEntry(tx) {
    if (!this.ledger || typeof this.ledger.get !== 'function') return null;
    try { return this.ledger.get(tx.character, tx.index); } catch (_) { return null; }
  }

  _preflight(tx) {
    if (!tx) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_MERCHANT_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_MERCHANT_BUSY' };
    if (tx.state !== 'RESERVED') return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (tx.leaseExpiresAt != null && this.now() > Number(tx.leaseExpiresAt)) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (!['SELL', 'BANK'].includes(tx.type)) return { ok: false, reason: 'TRANSACTION_FAMILY_NOT_LIVE_ALLOWED' };
    if (tx.type === 'SELL' && !this.sellEnabled) return { ok: false, reason: 'SELL_LIVE_DISABLED' };
    if (tx.type === 'BANK' && !this.bankEnabled) return { ok: false, reason: 'BANK_LIVE_DISABLED' };
    if (this.engine && this.engine.breaker(tx.type).open) return { ok: false, reason: 'TRANSACTION_CIRCUIT_OPEN' };

    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY', supervisorState: supervisor.state || null };

    const character = this.root && this.root.character;
    if (!character || String(character.name || '') !== String(tx.character || '')) return { ok: false, reason: 'CONTROLLED_CHARACTER_MISMATCH' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };

    const items = Array.isArray(character.items) ? character.items : [];
    const txIndex = Number(tx.index);
    const reportedIsize = Number(character.isize);
    const inventorySize = Number.isFinite(reportedIsize)
      ? Math.max(0, Math.floor(reportedIsize))
      : items.length;
    if (!Number.isInteger(txIndex) || txIndex < 0 || txIndex >= inventorySize) {
      this.stats.inventoryIndexRejected += 1;
      return {
        ok: false,
        reason: 'INVENTORY_INDEX_OUT_OF_RANGE',
        index: tx.index,
        inventorySize,
        inventorySizeSource: Number.isFinite(reportedIsize) ? 'character.isize' : 'items.length-fallback'
      };
    }

    const ledgerStatus = this.ledger && typeof this.ledger.status === 'function' ? this.ledger.status() : null;
    if (!ledgerStatus || ledgerStatus.stale === true) return { ok: false, reason: 'LEDGER_UNAVAILABLE_OR_STALE' };
    const entry = this._ledgerEntry(tx);
    if (!entry) return { ok: false, reason: 'LEDGER_ITEM_NOT_FOUND' };
    if (entry.name !== tx.item || Math.max(0, Math.floor(finite(entry.level, 0))) !== Math.max(0, Math.floor(finite(tx.level, 0)))) return { ok: false, reason: 'ITEM_IDENTITY_CHANGED' };
    if (entry.disposition !== tx.type) return { ok: false, reason: 'LEDGER_DISPOSITION_CHANGED', disposition: entry.disposition };
    if (finite(entry.q, 0) < finite(tx.quantity, 1)) return { ok: false, reason: 'ITEM_QUANTITY_CHANGED' };
    if (this.contentDrift && typeof this.contentDrift.requiresRevalidation === 'function' && this.contentDrift.requiresRevalidation('items', tx.item)) return { ok: false, reason: 'ITEM_REQUIRES_REVALIDATION' };

    const rawLiveItem = items[txIndex];
    const liveItem = itemSnapshot(rawLiveItem);
    if (!liveItem || liveItem.name !== tx.item || liveItem.level !== Math.max(0, Math.floor(finite(tx.level, 0)))) return { ok: false, reason: 'LIVE_ITEM_IDENTITY_MISMATCH' };
    if (liveItem.q < finite(tx.quantity, 1)) return { ok: false, reason: 'LIVE_ITEM_QUANTITY_MISMATCH' };

    if (tx.type === 'SELL') {
      const consensus = sellMetadataConsensus(this.root, tx.item);
      const blockers = [...new Set([...rawSellProtectionReasons(rawLiveItem), ...consensus.blockers])];
      if (blockers.length) {
        this.stats.sellSafetyRejected += 1;
        return {
          ok: false,
          reason: 'SELL_ITEM_NOT_LOW_RISK',
          sellProtectionReasons: blockers,
          sellMetadataSources: consensus.sources
        };
      }
      if (typeof this.root.sell !== 'function') return { ok: false, reason: 'SELL_API_UNAVAILABLE' };
    }
    if (tx.type === 'BANK') {
      if (typeof this.root.bank_store !== 'function') return { ok: false, reason: 'BANK_STORE_API_UNAVAILABLE' };
      if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
      if (finite(tx.quantity, 1) !== liveItem.q) return { ok: false, reason: 'BANK_REQUIRES_FULL_STACK' };
    }

    this._pruneActions();
    if (this.actionTimes.length >= this.maxActionsPerWindow) return { ok: false, reason: 'ACTION_BUDGET_EXHAUSTED' };
    return { ok: true, entry, liveItem, supervisor, txIndex, inventorySize };
  }

  _timeout(promise, label) {
    let timer = null;
    const setTimer = (this.root && this.root.setTimeout) || setTimeout;
    const clearTimer = (this.root && this.root.clearTimeout) || clearTimeout;
    const timeout = new Promise((_, reject) => {
      timer = setTimer(() => reject(new Error(`${label}_TIMEOUT`)), this.timeoutMs);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
      if (timer != null) clearTimer(timer);
    });
  }

  _sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    const setTimer = (this.root && this.root.setTimeout) || setTimeout;
    return new Promise((resolve) => setTimer(resolve, ms));
  }

  _verify(tx, before) {
    const character = this.root && this.root.character || {};
    const items = Array.isArray(character.items) ? character.items : [];
    const afterItem = itemSnapshot(items[tx.index]);
    const afterGold = finite(character.gold, before.gold);
    const quantity = Math.max(1, Math.floor(finite(tx.quantity, 1)));
    const afterInventoryQuantity = identityQuantity(items, tx.item, tx.level);
    const expectedInventoryQuantity = Math.max(0, before.inventoryQuantity - quantity);

    if (tx.type === 'SELL') {
      const inventoryOk = afterInventoryQuantity === expectedInventoryQuantity;
      return {
        ok: inventoryOk && afterGold >= before.gold,
        afterItem,
        afterGold,
        inventoryQuantityBefore: before.inventoryQuantity,
        afterInventoryQuantity,
        expectedInventoryQuantity
      };
    }

    if (tx.type === 'BANK') {
      const afterBankQuantity = bankIdentityQuantity(character.bank, tx.item, tx.level);
      const expectedBankQuantity = before.bankQuantity + quantity;
      const inventoryOk = afterInventoryQuantity === expectedInventoryQuantity;
      const bankOk = afterBankQuantity === expectedBankQuantity;
      return {
        ok: inventoryOk && bankOk,
        afterItem,
        afterGold,
        inventoryQuantityBefore: before.inventoryQuantity,
        afterInventoryQuantity,
        expectedInventoryQuantity,
        bankQuantityBefore: before.bankQuantity,
        afterBankQuantity,
        expectedBankQuantity
      };
    }

    return {
      ok: false,
      afterItem,
      afterGold,
      inventoryQuantityBefore: before.inventoryQuantity,
      afterInventoryQuantity,
      expectedInventoryQuantity
    };
  }

  async _verifyEventually(tx, before) {
    let result = this._verify(tx, before);
    for (let attempt = 1; !result.ok && attempt < this.verifyAttempts; attempt += 1) {
      this.stats.verificationRetries += 1;
      await this._sleep(this.verifyDelayMs);
      result = this._verify(tx, before);
    }
    return result;
  }

  _failSafe(tx, reason, extra = {}) {
    this.engine.markFailedSafe(tx.id, reason);
    this.stats.failedSafe += 1;
    this.lastAction = {
      at: this.now(), transactionId: tx.id, type: tx.type, result: 'FAILED_SAFE', reason, ...clone(extra)
    };
    this._event('CONTROLLED_MERCHANT_FAILED_SAFE', 'error', reason, this.lastAction);
    return { executed: true, committed: false, reason, ...clone(extra) };
  }

  async execute(transactionId) {
    const tx = this.engine && this.engine.get(String(transactionId));
    const check = this._preflight(tx);
    if (!check.ok) {
      if (tx && check.reason === 'TRANSACTION_LEASE_EXPIRED' && this.engine) this.engine.cancel(tx.id, check.reason);
      this.stats.rejected += 1;
      this._event('CONTROLLED_MERCHANT_EXECUTION_REJECTED', 'warn', check.reason, {
        transactionId,
        type: tx && tx.type || null,
        supervisorState: check.supervisorState || null,
        index: check.index == null ? tx && tx.index : check.index,
        inventorySize: check.inventorySize == null ? null : check.inventorySize,
        sellProtectionReasons: check.sellProtectionReasons || null,
        sellMetadataSources: check.sellMetadataSources || null
      });
      return {
        executed: false,
        committed: false,
        reason: check.reason,
        index: check.index == null ? undefined : check.index,
        inventorySize: check.inventorySize == null ? undefined : check.inventorySize,
        sellProtectionReasons: check.sellProtectionReasons || undefined,
        sellMetadataSources: check.sellMetadataSources || undefined
      };
    }

    this.busy = true;
    this.stats.attempts += 1;
    this.actionTimes.push(this.now());
    const character = this.root.character;
    const before = {
      item: itemSnapshot(character.items[check.txIndex]),
      gold: finite(character.gold, 0),
      at: this.now(),
      inventoryQuantity: identityQuantity(character.items, tx.item, tx.level),
      bankQuantity: tx.type === 'BANK' ? bankIdentityQuantity(character.bank, tx.item, tx.level) : 0
    };
    this.engine.transition(tx.id, 'EXECUTING', 'CONTROLLED_EXECUTION_STARTED');
    this.engine.save();
    this._event('CONTROLLED_MERCHANT_EXECUTION_STARTED', 'warn', 'CONTROLLED_CANARY', {
      transactionId: tx.id, type: tx.type, item: tx.item, quantity: tx.quantity, index: check.txIndex
    });

    try {
      const call = tx.type === 'SELL' ? this.root.sell(check.txIndex, tx.quantity) : this.root.bank_store(check.txIndex);
      const response = await this._timeout(call, tx.type);
      if (response && response.failed === true) throw new Error(String(response.reason || `${tx.type}_FAILED`));
      this.engine.transition(tx.id, 'VERIFYING', 'SERVER_RESULT_RECEIVED');
      this.engine.save();

      if (tx.type === 'BANK') {
        const serverAcknowledged = bankStoreAcknowledged(response);
        if (!serverAcknowledged && hasExplicitBankBinding(response)) {
          this.stats.bankInvalidServerAcks += 1;
          const localObservation = this._verify(tx, before);
          return this._failSafe(tx, 'BANK_SERVER_ACK_INVALID', {
            serverResponse: clone(response),
            serverAcknowledged: false,
            localObservationConfirmed: localObservation.ok === true,
            verification: localObservation
          });
        }

        const localObservation = await this._verifyEventually(tx, before);
        const localFallbackConfirmed = !serverAcknowledged && genericSuccessfulResponse(response) && localObservation.ok === true;
        if (!serverAcknowledged && !localFallbackConfirmed) {
          const reason = genericSuccessfulResponse(response) ? 'INVENTORY_DELTA_MISMATCH' : 'BANK_SERVER_ACK_INVALID';
          if (reason === 'BANK_SERVER_ACK_INVALID') this.stats.bankInvalidServerAcks += 1;
          return this._failSafe(tx, reason, {
            serverResponse: clone(response),
            serverAcknowledged: false,
            localObservationConfirmed: localObservation.ok === true,
            verification: localObservation
          });
        }

        const commitBasis = serverAcknowledged ? 'SERVER_ACK' : 'LOCAL_IDENTITY_BALANCE';
        const verification = {
          ...localObservation,
          serverAcknowledged,
          localObservationConfirmed: localObservation.ok === true,
          commitBasis
        };
        if (serverAcknowledged && !localObservation.ok) {
          this.stats.bankLocalObservationMisses += 1;
          this._event('CONTROLLED_BANK_LOCAL_STATE_UNCONFIRMED', 'warn', 'SERVER_ACK_LOCAL_CACHE_MISMATCH', {
            transactionId: tx.id,
            type: tx.type,
            verification: clone(verification)
          });
        }

        this.engine.markCommitted(tx.id, {
          serverResponse: clone(response),
          before: clone(before),
          verification: clone(verification)
        });
        this.stats.committed += 1;
        if (serverAcknowledged) this.stats.bankServerAckCommits += 1;
        else this.stats.bankLocalEvidenceCommits += 1;
        const commitReason = serverAcknowledged ? 'SERVER_ACK_COMMIT' : 'VERIFIED_COMMIT';
        this.lastAction = {
          at: this.now(), transactionId: tx.id, type: tx.type, result: 'COMMITTED',
          reason: commitReason, verification: clone(verification)
        };
        this._event('CONTROLLED_MERCHANT_COMMITTED', 'info', commitReason, this.lastAction);
        return {
          executed: true,
          committed: true,
          reason: commitReason,
          verification,
          response: clone(response)
        };
      }

      const verification = await this._verifyEventually(tx, before);
      if (!verification.ok) {
        return this._failSafe(tx, 'INVENTORY_DELTA_MISMATCH', { verification });
      }
      this.engine.markCommitted(tx.id, { serverResponse: clone(response), before: clone(before), verification: clone(verification) });
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), transactionId: tx.id, type: tx.type, result: 'COMMITTED', verification };
      this._event('CONTROLLED_MERCHANT_COMMITTED', 'info', null, this.lastAction);
      return { executed: true, committed: true, reason: 'VERIFIED_COMMIT', verification, response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'CONTROLLED_EXECUTION_FAILED');
      if (reason.includes('_TIMEOUT')) this.stats.timeouts += 1;
      return this._failSafe(tx, reason);
    } finally {
      this.busy = false;
    }
  }

  status() {
    this._pruneActions();
    return {
      schemaVersion: 1,
      mode: CONTROLLED_MERCHANT_MODE,
      enabled: this.enabled,
      sellEnabled: this.sellEnabled,
      bankEnabled: this.bankEnabled,
      compoundEnabled: false,
      upgradeEnabled: false,
      exchangeEnabled: false,
      actionAuthority: this.enabled && (this.sellEnabled || this.bankEnabled),
      directActionAccess: true,
      boundedActionFamilies: ['SELL', 'BANK'],
      forbiddenActionFamilies: ['COMPOUND', 'UPGRADE', 'EXCHANGE', 'TRADE', 'SEND_ITEM'],
      explicitAckRequired: LIVE_ACK,
      busy: this.busy,
      timeoutMs: this.timeoutMs,
      inventoryIndexGuard: {
        enabled: true,
        authoritativeSource: 'character.isize',
        fallbackSource: 'items.length',
        validRange: '0..isize-1'
      },
      sellSafety: sellSafetyStatus(),
      verification: {
        attempts: this.verifyAttempts,
        delayMs: this.verifyDelayMs,
        maxPollingMs: Math.max(0, this.verifyAttempts - 1) * this.verifyDelayMs,
        strategy: 'server-ack-bank-with-local-identity-balance-diagnostic',
        bankCommitBasis: 'SERVER_ACK_OR_STRICT_LOCAL_FALLBACK',
        bankRequiredAck: { success: true, place: 'bank', bank_action: 'store' },
        bankGenericSuccessFallback: 'REQUIRES_EXACT_LOCAL_IDENTITY_BALANCE',
        sellCommitBasis: 'IDENTITY_BALANCE_DELTA'
      },
      actionBudget: { maxPerWindow: this.maxActionsPerWindow, windowMs: this.actionWindowMs, inWindow: this.actionTimes.length },
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledMerchantExecutor, CONTROLLED_MERCHANT_MODE, CONTROLLED_MERCHANT_ACK: LIVE_ACK };

},
"src/travel/controlled-travel-executor.js": function(require,module,exports){
'use strict';

const CONTROLLED_TRAVEL_MODE = 'controlled-live-default-off';
const LIVE_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class ControlledTravelExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.controller = options.controller;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.timeoutMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.timeoutMs) || 120000));
    this.enabled = false;
    this.busy = false;
    this.activePlanId = null;
    this.lastAction = null;
    this.stats = { attempts: 0, completed: 0, rejected: 0, failedSafe: 0, timeouts: 0, aborts: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-travel', event, severity, reason, data });
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== LIVE_ACK) {
      this.enabled = false;
      this._event('CONTROLLED_TRAVEL_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this._event('CONTROLLED_TRAVEL_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED', { enabled: this.enabled });
    return this.status();
  }

  async disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    if (this.busy) await this.abort(reason);
    this._event('CONTROLLED_TRAVEL_DISABLED', 'warn', reason);
    return this.status();
  }

  _inCombat() {
    const root = this.root || {};
    const character = root.character || {};
    if (character.target) return true;
    const parent = root.parent || {};
    const entities = parent.entities || root.entities || {};
    const selfNames = new Set([character.name, character.id].filter(Boolean).map(String));
    for (const entity of Object.values(entities)) {
      if (entity && entity.target && selfNames.has(String(entity.target))) return true;
    }
    return false;
  }

  _preflight(plan) {
    if (!plan) return { ok: false, reason: 'TRAVEL_PLAN_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_TRAVEL_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_TRAVEL_BUSY' };
    if (plan.state !== 'PLANNED') return { ok: false, reason: 'TRAVEL_PLAN_NOT_PLANNED' };
    if (plan.leaseExpiresAt != null && this.now() > Number(plan.leaseExpiresAt)) return { ok: false, reason: 'TRAVEL_LEASE_EXPIRED' };
    if (plan.serverChangeAllowed !== false) return { ok: false, reason: 'PLAN_SERVER_CHANGE_CONTRACT_INVALID' };
    if (this.controller && this.controller.breaker().open) return { ok: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY', supervisorState: supervisor.state || null };
    const character = this.root && this.root.character;
    if (!character) return { ok: false, reason: 'CHARACTER_UNAVAILABLE' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (typeof this.root.smart_move !== 'function') return { ok: false, reason: 'SMART_MOVE_API_UNAVAILABLE' };
    if (typeof this.root.stop !== 'function') return { ok: false, reason: 'STOP_API_UNAVAILABLE' };
    return { ok: true, supervisor };
  }

  _destination(plan) {
    if (!plan || !plan.target) return null;
    if (plan.target.x == null || plan.target.y == null) return plan.target.map;
    return { map: plan.target.map, x: plan.target.x, y: plan.target.y };
  }

  _snapshot() {
    const c = this.root && this.root.character || {};
    return {
      observedAt: this.now(),
      character: {
        name: c.name, ctype: c.ctype || c.type, map: c.map,
        x: c.x != null ? c.x : c.real_x, y: c.y != null ? c.y : c.real_y,
        real_x: c.real_x, real_y: c.real_y, hp: c.hp, max_hp: c.max_hp,
        mp: c.mp, max_mp: c.max_mp, rip: c.rip === true
      }
    };
  }

  _timeout(promise) {
    let timer = null;
    const setTimer = (this.root && this.root.setTimeout) || setTimeout;
    const clearTimer = (this.root && this.root.clearTimeout) || clearTimeout;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error('SMART_MOVE_TIMEOUT')), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }

  _startControlled(plan) {
    if (this.controller && typeof this.controller.startControlled === 'function') return this.controller.startControlled(plan.id);
    const map = this.controller && this.controller.plans;
    const row = map && typeof map.get === 'function' ? map.get(String(plan.id)) : null;
    if (!row || row.state !== 'PLANNED') return { started: false, reason: 'PLAN_NOT_STARTABLE' };
    if (this.controller.breaker().open) return { started: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    row.state = 'TRAVELLING';
    row.updatedAt = this.now();
    row.lastProgressAt = row.updatedAt;
    row.reason = 'CONTROLLED_EXECUTION_STARTED';
    this.controller.stats.controlledStarts = (this.controller.stats.controlledStarts || 0) + 1;
    if (typeof this.controller._event === 'function') this.controller._event('TRAVEL_CONTROLLED_STARTED', 'warn', 'CONTROLLED_CANARY', { planId: row.id });
    return { started: true, plan: clone(row) };
  }

  _failSafe(planId, reason) {
    if (this.controller && typeof this.controller.failSafe === 'function') return this.controller.failSafe(planId, reason);
    const map = this.controller && this.controller.plans;
    const row = map && typeof map.get === 'function' ? map.get(String(planId)) : null;
    if (!row || ['COMPLETED', 'ABORTED', 'FAILED_SAFE'].includes(row.state)) return false;
    row.state = 'FAILED_SAFE';
    row.reason = String(reason || 'FAILED_SAFE');
    row.updatedAt = this.now();
    this.controller.stats.failedSafe = (this.controller.stats.failedSafe || 0) + 1;
    if (typeof this.controller._failure === 'function') this.controller._failure(row.reason, row);
    if (typeof this.controller._event === 'function') this.controller._event('TRAVEL_FAILED_SAFE', 'error', row.reason, { planId: row.id });
    return true;
  }

  async _stopSmart(reason) {
    try {
      const result = await Promise.resolve(this.root.stop('smart'));
      this._event('CONTROLLED_TRAVEL_STOPPED', 'warn', reason, { result: clone(result) });
      return true;
    } catch (error) {
      this._event('CONTROLLED_TRAVEL_STOP_FAILED', 'error', reason, { message: String(error && error.message || error) });
      return false;
    }
  }

  async execute(planId) {
    const plan = this.controller && this.controller.get(String(planId));
    const check = this._preflight(plan);
    if (!check.ok) {
      if (plan && check.reason === 'TRAVEL_LEASE_EXPIRED') this.controller.cancel(plan.id, check.reason);
      this.stats.rejected += 1;
      this._event('CONTROLLED_TRAVEL_EXECUTION_REJECTED', 'warn', check.reason, { planId, supervisorState: check.supervisorState || null });
      return { executed: false, completed: false, reason: check.reason };
    }
    this.busy = true;
    this.activePlanId = plan.id;
    this.stats.attempts += 1;
    const started = this._startControlled(plan);
    if (!started || started.started !== true) {
      this.busy = false;
      this.activePlanId = null;
      this.stats.rejected += 1;
      return { executed: false, completed: false, reason: started && started.reason || 'TRAVEL_PLAN_NOT_STARTABLE' };
    }
    const destination = this._destination(plan);
    this._event('CONTROLLED_TRAVEL_STARTED', 'warn', 'CONTROLLED_CANARY', { planId: plan.id, destination: clone(destination) });

    try {
      const routePromise = Promise.resolve(this.root.smart_move(destination));
      routePromise.catch(() => {});
      const response = await this._timeout(routePromise);
      if (response && response.failed === true) throw new Error(String(response.reason || 'SMART_MOVE_FAILED'));
      this.controller.observe(this._snapshot());
      const finalPlan = this.controller.get(plan.id);
      if (!finalPlan || finalPlan.state !== 'COMPLETED') {
        this._failSafe(plan.id, 'ARRIVAL_VERIFICATION_FAILED');
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), planId: plan.id, result: 'FAILED_SAFE', reason: 'ARRIVAL_VERIFICATION_FAILED' };
        this._event('CONTROLLED_TRAVEL_FAILED_SAFE', 'error', 'ARRIVAL_VERIFICATION_FAILED', this.lastAction);
        return { executed: true, completed: false, reason: 'ARRIVAL_VERIFICATION_FAILED', response: clone(response) };
      }
      this.stats.completed += 1;
      this.lastAction = { at: this.now(), planId: plan.id, result: 'COMPLETED', destination: clone(destination) };
      this._event('CONTROLLED_TRAVEL_COMPLETED', 'info', null, this.lastAction);
      return { executed: true, completed: true, reason: 'ARRIVAL_VERIFIED', response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'SMART_MOVE_FAILED');
      if (reason === 'SMART_MOVE_TIMEOUT') {
        this.stats.timeouts += 1;
        await this._stopSmart(reason);
      }
      this._failSafe(plan.id, reason);
      this.stats.failedSafe += 1;
      this.lastAction = { at: this.now(), planId: plan.id, result: 'FAILED_SAFE', reason };
      this._event('CONTROLLED_TRAVEL_FAILED_SAFE', 'error', reason, this.lastAction);
      return { executed: true, completed: false, reason };
    } finally {
      this.busy = false;
      this.activePlanId = null;
    }
  }

  async abort(reason = 'OPERATOR_ABORT') {
    if (!this.busy || !this.activePlanId) return { aborted: false, reason: 'NO_ACTIVE_CONTROLLED_TRAVEL' };
    const planId = this.activePlanId;
    await this._stopSmart(reason);
    this.controller.cancel(planId, reason);
    this.stats.aborts += 1;
    this.busy = false;
    this.activePlanId = null;
    this.lastAction = { at: this.now(), planId, result: 'ABORTED', reason };
    return { aborted: true, planId, reason };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_TRAVEL_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      boundedActionFamilies: ['SMART_MOVE'],
      serverChangeAllowed: false,
      unknownMapTravelAllowed: false,
      explicitAckRequired: LIVE_ACK,
      busy: this.busy,
      activePlanId: this.activePlanId,
      timeoutMs: this.timeoutMs,
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledTravelExecutor, CONTROLLED_TRAVEL_MODE, CONTROLLED_TRAVEL_ACK: LIVE_ACK };

},
"src/autonomy/alpha18-runtime.js": function(require,module,exports){
'use strict';

const { Alpha17Runtime } = require('./alpha17-runtime');
const { BankCapacityManager } = require('../economy/bank-capacity-manager');
const { BankExpansionTransactionEngine } = require('../economy/bank-expansion-transactions');
const { ControlledBankExpansionExecutor, CONTROLLED_BANK_EXPANSION_ACK } = require('../economy/controlled-bank-expansion-executor');
const { Alpha18CombinedLiveGate, ALPHA18_LIVE_GATE_ACK } = require('../ops/alpha18-combined-live-gate-hardened');

const ALPHA18_VERSION = '3.0.0-alpha.18.0';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class Alpha18Runtime extends Alpha17Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA18_VERSION;
    this.bankCapacityObservationIntervalMs = Math.max(1000, Math.min(60000, Number(options.bankCapacityObservationIntervalMs) || 3000));
    this.lastBankCapacityObservationAt = -Infinity;

    this.bankCapacity = options.bankCapacity || new BankCapacityManager({
      now: this.now,
      log: this.log,
      workspaceSlots: options.bankWorkspaceSlots == null ? options.inventoryWorkspaceSlots : options.bankWorkspaceSlots,
      protectedGoldReserve: options.bankProtectedGoldReserve,
      protectedShellReserve: options.bankProtectedShellReserve,
      allowShellSpend: options.bankAllowShellSpend === true,
      pressureObservationsRequired: options.bankPressureObservationsRequired
    });
    this.bankExpansionTransactions = options.bankExpansionTransactions || new BankExpansionTransactionEngine({
      now: this.now,
      log: this.log,
      storage: options.bankExpansionStorage || options.storage,
      leaseMs: options.bankExpansionLeaseMs,
      failureWindowMs: options.bankExpansionFailureWindowMs,
      failureThreshold: options.bankExpansionFailureThreshold,
      circuitCooldownMs: options.bankExpansionCircuitCooldownMs,
      preflightRetryBudget: options.bankExpansionPreflightRetryBudget,
      retryBackoffMs: options.bankExpansionRetryBackoffMs
    });
    this.bankExpansionTransactions.load();
    this.controlledBankExpansion = options.controlledBankExpansion || new ControlledBankExpansionExecutor({
      root: this.root,
      engine: this.bankExpansionTransactions,
      manager: this.bankCapacity,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      timeoutMs: options.controlledBankExpansionTimeoutMs
    });
    this.alpha18LiveGate = options.alpha18LiveGate || new Alpha18CombinedLiveGate({
      runtime: this,
      root: this.root,
      now: this.now,
      testMode: options.alpha18LiveGateTestMode === true,
      observationMs: options.alpha18LiveGateObservationMs,
      sampleMs: options.alpha18LiveGateSampleMs,
      sleep: options.alpha18LiveGateSleep
    });
    this._observeBankCapacity();
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA18_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _bankPacks() {
    return this.root && (this.root.bank_packs || this.root.parent && this.root.parent.bank_packs) || {};
  }

  _liveCharacter() {
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _observeBankCapacity() {
    const character = this._liveCharacter();
    if (!character) return null;
    const result = this.bankCapacity.observe({
      character,
      bankPacks: this._bankPacks(),
      gameData: this.adapter.getGameData() || {},
      contentDrift: this.contentDrift,
      observedAt: this.now()
    });
    for (const tx of this.bankExpansionTransactions.list(256)) {
      if (tx.state === 'RECOVERING') this.bankExpansionTransactions.reconcile(tx.id, result);
    }
    return result;
  }

  _economyStatus() {
    const base = super._economyStatus();
    return {
      ...base,
      bankCapacity: this.bankCapacity.status(),
      bankExpansion: {
        transactions: this.bankExpansionTransactions.status(),
        controlled: this.controlledBankExpansion.status()
      }
    };
  }

  _guardControlledAuthority() {
    const result = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (this.bankExpansionTransactions.breaker().open) reason = 'BANK_EXPANSION_CIRCUIT_OPEN';
    if (reason && this.controlledBankExpansion.status().enabled) this.controlledBankExpansion.disable(reason);
    return { ...result, bankExpansionGuardReason: reason };
  }

  tick() {
    super.tick();
    const now = this.now();
    this.bankExpansionTransactions.tick();
    if (now - this.lastBankCapacityObservationAt >= this.bankCapacityObservationIntervalMs) {
      this.lastBankCapacityObservationAt = now;
      this._observeBankCapacity();
    }
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') this.controlledBankExpansion.disable('RUNTIME_LEFT_ACTIVE_MODE');
    return resolved;
  }

  planBankSpace(request = {}) {
    const observation = this._observeBankCapacity();
    return this.bankCapacity.planSpace(request, {
      observation,
      currentMap: this._liveCharacter() && this._liveCharacter().map,
      gold: this._liveCharacter() && this._liveCharacter().gold,
      ledger: this.inventoryLedger,
      gameData: this.adapter.getGameData() || {},
      contentDrift: this.contentDrift,
      minimumReserves: request.minimumReserves || {}
    });
  }

  planBankExpansion(request = {}) {
    const plan = request.plan && request.plan.action === 'EXPAND_BANK_PACK' ? request.plan : this.planBankSpace(request);
    if (!plan || plan.action !== 'EXPAND_BANK_PACK') return { accepted: false, reason: 'NO_SAFE_EXPANSION_PLAN', plan: clone(plan) };
    return this.bankExpansionTransactions.plan(plan, { observation: this.bankCapacity.status().observation });
  }

  configureControlledBankExpansion(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledBankExpansion.disable(gate.reason);
        return { ...this.controlledBankExpansion.status(), enableRejected: gate.reason };
      }
      if (this.bankExpansionTransactions.breaker().open) {
        this.controlledBankExpansion.disable('BANK_EXPANSION_CIRCUIT_OPEN');
        return { ...this.controlledBankExpansion.status(), enableRejected: 'BANK_EXPANSION_CIRCUIT_OPEN' };
      }
    }
    return this.controlledBankExpansion.configure(config);
  }

  executeBankExpansion(id) { return this.controlledBankExpansion.execute(id); }
  runAlpha18CombinedLiveGate(config = {}) { return this.alpha18LiveGate.run(config); }
  alpha18LiveGateStatus() { return this.alpha18LiveGate.status(); }
  alpha18LiveGateResult() { return this.alpha18LiveGate.result(); }
  alpha18LiveGateResultText() { return this.alpha18LiveGate.resultText(); }

  stop() {
    this.controlledBankExpansion.disable('RUNTIME_STOP');
    this.bankExpansionTransactions.save();
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: ALPHA18_VERSION,
      economy: this._economyStatus(),
      alpha18: {
        bankCapacityFoundation: true,
        automaticExpansionEnabled: false,
        automaticEmergencyReclaimEnabled: false,
        controlledExpansionAck: CONTROLLED_BANK_EXPANSION_ACK,
        liveGateAck: ALPHA18_LIVE_GATE_ACK,
        liveGate: this.alpha18LiveGate.status(),
        globalStopOnNoSpace: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.bankCapacity = this.bankCapacity.status();
    base.context.bankExpansion = {
      status: this.bankExpansionTransactions.status(),
      transactions: this.bankExpansionTransactions.list(100),
      controlled: this.controlledBankExpansion.status()
    };
    base.context.alpha18LiveGate = this.alpha18LiveGate.status();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha18Runtime, ALPHA18_VERSION };

},
"src/economy/bank-capacity-manager.js": function(require,module,exports){
'use strict';

const { sellProtectionReasons } = require('./sell-safety');

const BANK_CAPACITY_SCHEMA_VERSION = 1;
const BANK_CAPACITY_MODE = 'observation-planning-only';
const BankSpaceAction = Object.freeze({
  DEPOSIT_STACK: 'DEPOSIT_STACK',
  DEPOSIT_FREE_SLOT: 'DEPOSIT_FREE_SLOT',
  CONSOLIDATE_BANK_STACKS: 'CONSOLIDATE_BANK_STACKS',
  EXPAND_BANK_PACK: 'EXPAND_BANK_PACK',
  EMERGENCY_RECLAIM: 'EMERGENCY_RECLAIM',
  BLOCK_INVENTORY_PRODUCING_WORK: 'BLOCK_INVENTORY_PRODUCING_WORK'
});

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function observedCost(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function hasOwn(value, key) {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key);
}
function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}
function itemIdentity(item) {
  if (!item || !item.name) return null;
  return `${String(item.name)}:${Math.max(0, Math.floor(finite(item.level, 0)))}`;
}
function packCatalogRow(name, value) {
  if (Array.isArray(value)) {
    return {
      name: String(name),
      map: value[0] == null ? null : String(value[0]),
      goldCost: observedCost(value[1]),
      shellCost: observedCost(value[2]),
      source: 'bank_packs-array'
    };
  }
  if (value && typeof value === 'object') {
    return {
      name: String(name),
      map: value.map == null && value.place == null ? null : String(value.map == null ? value.place : value.map),
      goldCost: observedCost(value.gold == null ? value.goldCost : value.gold),
      shellCost: observedCost(value.shells == null ? value.shellCost : value.shells),
      source: 'bank_packs-object'
    };
  }
  return { name: String(name), map: null, goldCost: null, shellCost: null, source: 'observed-bank-only' };
}

class BankCapacityManager {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.workspaceSlots = Math.max(1, Math.min(32, Math.floor(finite(options.workspaceSlots, 3))));
    this.protectedGoldReserve = Math.max(0, finite(options.protectedGoldReserve, 1000000));
    this.protectedShellReserve = Math.max(0, finite(options.protectedShellReserve, 0));
    this.allowShellSpend = options.allowShellSpend === true;
    this.pressureObservationsRequired = Math.max(2, Math.min(20, Math.floor(finite(options.pressureObservationsRequired, 3))));
    this.pressureHistory = [];
    this.lastObservation = null;
    this.lastPlan = null;
    this.stats = {
      observations: 0,
      plans: 0,
      stackTargets: 0,
      freeSlotTargets: 0,
      consolidationPlans: 0,
      expansionPlans: 0,
      reclaimPlans: 0,
      selectiveBlocks: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'bank-capacity', event, severity, reason, data });
    }
  }

  _catalog(bank, bankPacks) {
    const names = new Set();
    if (bankPacks && typeof bankPacks === 'object') Object.keys(bankPacks).forEach((name) => names.add(name));
    if (bank && typeof bank === 'object') {
      for (const [name, value] of Object.entries(bank)) if (Array.isArray(value)) names.add(name);
    }
    const rows = [];
    for (const name of names) {
      const source = bankPacks && typeof bankPacks === 'object' ? bankPacks[name] : null;
      rows.push(packCatalogRow(name, source));
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }

  _contentUnsafe(contentDrift, itemName) {
    if (!contentDrift || !itemName) return false;
    try {
      if (typeof contentDrift.requiresRevalidation === 'function') return contentDrift.requiresRevalidation('items', itemName) === true;
    } catch (_) {}
    return false;
  }

  _bankItemSafety(item, gameData, contentDrift) {
    if (!item || !item.name) return { protected: true, reasons: ['BANK_ITEM_UNKNOWN'] };
    const reasons = [];
    if (item.l === true || item.locked === true) reasons.push('BANK_ITEM_LOCKED');
    if (item.p || item.special) reasons.push('BANK_ITEM_SPECIAL');
    if (hasOwn(item, 'level') && Math.max(0, finite(item.level, 0)) > 0) reasons.push('BANK_ITEM_LEVELLED');
    const meta = gameData && gameData.items && gameData.items[item.name];
    if (!meta) reasons.push('BANK_ITEM_METADATA_UNKNOWN');
    if (this._contentUnsafe(contentDrift, item.name)) reasons.push('BANK_ITEM_CONTENT_REVALIDATION_REQUIRED');
    if (meta) reasons.push(...sellProtectionReasons(meta));
    return { protected: unique(reasons).length > 0, reasons: unique(reasons) };
  }

  _packView(row, bank, gameData, contentDrift) {
    const items = bank && Array.isArray(bank[row.name]) ? bank[row.name] : null;
    const unlocked = !!items;
    const capacity = unlocked ? items.length : 0;
    let occupied = 0;
    let protectedSlots = 0;
    const compatibleStacks = [];
    const identities = new Map();
    if (items) {
      items.forEach((item, index) => {
        if (!item || !item.name) return;
        occupied += 1;
        const safety = this._bankItemSafety(item, gameData, contentDrift);
        if (safety.protected) protectedSlots += 1;
        const meta = gameData && gameData.items && gameData.items[item.name];
        const stackMax = Math.max(1, Math.floor(finite(meta && meta.s, 1)));
        const quantity = Math.max(1, Math.floor(finite(item.q, 1)));
        const identity = itemIdentity(item);
        if (!identity) return;
        const current = identities.get(identity) || [];
        current.push({ index, quantity, stackMax, name: String(item.name), level: Math.max(0, Math.floor(finite(item.level, 0))) });
        identities.set(identity, current);
        if (stackMax > quantity) compatibleStacks.push({ index, name: String(item.name), level: Math.max(0, Math.floor(finite(item.level, 0))), quantity, stackMax, headroom: stackMax - quantity });
      });
    }
    const consolidation = [];
    for (const stacks of identities.values()) {
      if (stacks.length < 2) continue;
      for (let i = 0; i < stacks.length; i += 1) {
        for (let j = i + 1; j < stacks.length; j += 1) {
          if (stacks[i].stackMax > 1 && stacks[i].quantity + stacks[j].quantity <= stacks[i].stackMax) {
            consolidation.push({ fromIndex: stacks[j].index, toIndex: stacks[i].index, name: stacks[i].name, level: stacks[i].level, combinedQuantity: stacks[i].quantity + stacks[j].quantity, stackMax: stacks[i].stackMax });
          }
        }
      }
    }
    return {
      ...row,
      unlocked,
      capacity,
      occupied,
      free: Math.max(0, capacity - occupied),
      protectedSlots,
      reservedSlots: protectedSlots,
      workspaceSlots: this.workspaceSlots,
      workspaceAvailable: unlocked && Math.max(0, capacity - occupied) >= this.workspaceSlots,
      compatibleStacks,
      consolidation
    };
  }

  observe(context = {}) {
    const character = context.character || {};
    const bank = character.bank && typeof character.bank === 'object' ? character.bank : {};
    const gameData = context.gameData || {};
    const catalog = this._catalog(bank, context.bankPacks || {});
    const packs = catalog.map((row) => this._packView(row, bank, gameData, context.contentDrift || null));
    const unlocked = packs.filter((row) => row.unlocked);
    const locked = packs.filter((row) => !row.unlocked);
    const totals = {
      capacity: unlocked.reduce((sum, row) => sum + row.capacity, 0),
      occupied: unlocked.reduce((sum, row) => sum + row.occupied, 0),
      free: unlocked.reduce((sum, row) => sum + row.free, 0),
      compatibleStackHeadroom: unlocked.reduce((sum, row) => sum + row.compatibleStacks.reduce((inner, stack) => inner + stack.headroom, 0), 0),
      consolidationSlotsRecoverable: unlocked.reduce((sum, row) => sum + row.consolidation.length, 0)
    };
    const pressureNow = totals.free < this.workspaceSlots;
    this.pressureHistory.push({ at: finite(context.observedAt, this.now()), pressure: pressureNow });
    this.pressureHistory = this.pressureHistory.slice(-this.pressureObservationsRequired);
    const sustainedPressure = this.pressureHistory.length >= this.pressureObservationsRequired && this.pressureHistory.every((row) => row.pressure);
    this.lastObservation = {
      schemaVersion: BANK_CAPACITY_SCHEMA_VERSION,
      observedAt: finite(context.observedAt, this.now()),
      character: { name: character.name || null, map: character.map || null, gold: Math.max(0, finite(character.gold, 0)) },
      catalogSource: context.bankPacks && Object.keys(context.bankPacks).length ? 'observed-bank_packs' : 'observed-bank-only',
      packs,
      totals,
      unlockedPackCount: unlocked.length,
      lockedPackCount: locked.length,
      pressureNow,
      sustainedPressure,
      actionAuthority: false
    };
    this.stats.observations += 1;
    if (pressureNow) this._event('BANK_CAPACITY_PRESSURE', sustainedPressure ? 'warn' : 'info', sustainedPressure ? 'SUSTAINED_CAPACITY_PRESSURE' : 'CAPACITY_PRESSURE_OBSERVED', { free: totals.free, workspaceSlots: this.workspaceSlots, observations: this.pressureHistory.length });
    return clone(this.lastObservation);
  }

  _stackTarget(request, observation) {
    const name = String(request.item || request.name || '').trim();
    const level = Math.max(0, Math.floor(finite(request.level, 0)));
    const quantity = Math.max(1, Math.floor(finite(request.quantity, 1)));
    if (!name) return null;
    for (const pack of observation.packs.filter((row) => row.unlocked)) {
      const stack = pack.compatibleStacks.find((row) => row.name === name && row.level === level && row.headroom >= quantity);
      if (stack) return { action: BankSpaceAction.DEPOSIT_STACK, pack: pack.name, slot: stack.index, headroom: stack.headroom, quantity };
    }
    return null;
  }

  _freeTarget(observation) {
    const pack = observation.packs.filter((row) => row.unlocked && row.free > 0).sort((a, b) => b.free - a.free || a.name.localeCompare(b.name))[0];
    return pack ? { action: BankSpaceAction.DEPOSIT_FREE_SLOT, pack: pack.name, freeBefore: pack.free } : null;
  }

  _consolidation(observation) {
    for (const pack of observation.packs.filter((row) => row.unlocked)) {
      if (pack.consolidation.length) return { action: BankSpaceAction.CONSOLIDATE_BANK_STACKS, pack: pack.name, move: clone(pack.consolidation[0]), destructive: false, executionAuthority: false };
    }
    return null;
  }

  _expansion(observation, context = {}) {
    const currentMap = String(context.currentMap == null ? observation.character.map || '' : context.currentMap);
    const gold = Math.max(0, finite(context.gold, observation.character.gold));
    const shells = Math.max(0, finite(context.shells, 0));
    const candidates = observation.packs.filter((row) => !row.unlocked).map((row) => {
      const choices = [];
      if (Number.isFinite(row.goldCost) && row.goldCost >= 0 && gold - row.goldCost >= this.protectedGoldReserve) choices.push({ currency: 'gold', cost: row.goldCost, reserveAfter: gold - row.goldCost });
      if (this.allowShellSpend && Number.isFinite(row.shellCost) && row.shellCost >= 0 && shells - row.shellCost >= this.protectedShellReserve) choices.push({ currency: 'shells', cost: row.shellCost, reserveAfter: shells - row.shellCost });
      choices.sort((a, b) => a.cost - b.cost || a.currency.localeCompare(b.currency));
      return { row, payment: choices[0] || null, sameMap: !row.map || row.map === currentMap };
    }).filter((candidate) => candidate.payment);
    candidates.sort((a, b) => Number(b.sameMap) - Number(a.sameMap) || a.payment.cost - b.payment.cost || a.row.name.localeCompare(b.row.name));
    const picked = candidates[0];
    if (!picked) return null;
    return {
      action: BankSpaceAction.EXPAND_BANK_PACK,
      pack: picked.row.name,
      map: picked.row.map,
      currency: picked.payment.currency,
      cost: picked.payment.cost,
      reserveAfter: picked.payment.reserveAfter,
      protectedReserve: picked.payment.currency === 'gold' ? this.protectedGoldReserve : this.protectedShellReserve,
      requiresTravel: !!picked.row.map && picked.row.map !== currentMap,
      exactlyOneExpansion: true,
      executionAuthority: false
    };
  }

  _reclaimBlockers(entry, meta, contentDrift, minimumReserve) {
    const blockers = [];
    if (!entry || entry.disposition !== 'SELL') blockers.push('NOT_POSITIVELY_DISPOSABLE');
    if (!entry || entry.metadataKnown !== true) blockers.push('ITEM_METADATA_UNKNOWN');
    if (entry && (entry.locked || entry.special)) blockers.push(entry.locked ? 'ITEM_LOCKED' : 'ITEM_SPECIAL');
    if (entry && String(entry.disposition || '').startsWith('RESERVE_')) blockers.push('ITEM_RESERVED');
    if (entry && this._contentUnsafe(contentDrift, entry.name)) blockers.push('CONTENT_REVALIDATION_REQUIRED');
    blockers.push(...sellProtectionReasons(meta));
    const quantity = Math.max(1, Math.floor(finite(entry && entry.q, 1)));
    if (quantity <= minimumReserve) blockers.push('PROTECTED_MINIMUM_RESERVE');
    return unique(blockers);
  }

  _lossScore(entry, meta, minimumReserve) {
    const quantity = Math.max(1, Math.floor(finite(entry.q, 1)));
    const surplus = Math.max(0, quantity - minimumReserve);
    const replacementCost = Math.max(0, finite(meta && (meta.g == null ? meta.gold : meta.g), 0));
    const rarityPenalty = Math.max(0, finite(meta && (meta.rarity == null ? meta.rare : meta.rarity), 0));
    const acquisitionPenalty = Math.max(0, finite(meta && meta.difficulty, 0));
    const progressionPenalty = String(entry.disposition || '').includes('PROGRESSION') ? 1000000000 : 0;
    const groupPenalty = String(entry.disposition || '').includes('GROUP') ? 1000000000 : 0;
    return replacementCost + rarityPenalty * 1000000 + acquisitionPenalty * 100000 + progressionPenalty + groupPenalty + (surplus > 0 ? 1000 / surplus : 1000000000);
  }

  _reclaim(context = {}) {
    const ledger = context.ledger;
    const entries = ledger && typeof ledger.list === 'function' ? ledger.list(5000) : [];
    const status = ledger && typeof ledger.status === 'function' ? ledger.status() : null;
    if (!status || status.stale === true) return null;
    const gameData = context.gameData || {};
    const minimumReserves = context.minimumReserves && typeof context.minimumReserves === 'object' ? context.minimumReserves : {};
    const candidates = [];
    for (const entry of entries) {
      if (!entry || !entry.name) continue;
      const meta = gameData.items && gameData.items[entry.name];
      const minimumReserve = Math.max(0, Math.floor(finite(minimumReserves[entry.name], 0)));
      const blockers = this._reclaimBlockers(entry, meta, context.contentDrift || null, minimumReserve);
      if (blockers.length) continue;
      candidates.push({
        character: entry.character,
        index: entry.index,
        item: entry.name,
        level: Math.max(0, Math.floor(finite(entry.level, 0))),
        observedQuantity: Math.max(1, Math.floor(finite(entry.q, 1))),
        protectedMinimumReserve: minimumReserve,
        quantity: 1,
        lossScore: this._lossScore(entry, meta, minimumReserve),
        reasons: ['POSITIVE_SELL_DISPOSITION', 'SELL_SAFETY_CLEAR', 'MINIMUM_RESERVE_PRESERVED']
      });
    }
    candidates.sort((a, b) => a.lossScore - b.lossScore || a.item.localeCompare(b.item) || a.index - b.index);
    return candidates[0] || null;
  }

  planSpace(request = {}, context = {}) {
    const observation = context.observation || this.lastObservation || this.observe(context);
    if (!observation) return { planned: false, reason: 'BANK_OBSERVATION_UNAVAILABLE' };
    this.stats.plans += 1;
    const stack = this._stackTarget(request, observation);
    if (stack) {
      this.stats.stackTargets += 1;
      return this._remember({ planned: true, reason: 'COMPATIBLE_STACK_AVAILABLE', ...stack, destructive: false });
    }
    const free = this._freeTarget(observation);
    if (free) {
      this.stats.freeSlotTargets += 1;
      return this._remember({ planned: true, reason: 'FREE_BANK_SLOT_AVAILABLE', ...free, destructive: false });
    }
    const consolidation = this._consolidation(observation);
    if (consolidation) {
      this.stats.consolidationPlans += 1;
      return this._remember({ planned: true, reason: 'SAFE_STACK_CONSOLIDATION_AVAILABLE', ...consolidation });
    }

    const depositBlocked = request.depositBlocked === true || !!String(request.item || request.name || '').trim();
    if (observation.sustainedPressure || depositBlocked) {
      const expansion = this._expansion(observation, context);
      if (expansion) {
        this.stats.expansionPlans += 1;
        return this._remember({ planned: true, reason: depositBlocked ? 'SAFE_DEPOSIT_BLOCKED_EXPANSION_AVAILABLE' : 'SUSTAINED_CAPACITY_PRESSURE', ...expansion });
      }
    }

    const reclaim = this._reclaim(context);
    if (reclaim) {
      this.stats.reclaimPlans += 1;
      return this._remember({
        planned: true,
        reason: 'EMERGENCY_RECLAIM_MINIMAL_SAFE_CANDIDATE',
        action: BankSpaceAction.EMERGENCY_RECLAIM,
        candidate: reclaim,
        destructive: true,
        exactlyOneUnit: true,
        reobserveRequiredBeforeNextDecision: true,
        bulkSellForbidden: true,
        executionAuthority: false
      });
    }

    this.stats.selectiveBlocks += 1;
    return this._remember({
      planned: true,
      reason: 'NO_SAFE_SPACE_RECOVERY_ACTION',
      action: BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK,
      blockInventoryProducingWork: true,
      globalBotStop: false,
      independentSubsystemsMayContinue: ['combat', 'party', 'monitoring', 'travel-without-loot', 'safe-non-inventory-work'],
      executionAuthority: false
    });
  }

  _remember(plan) {
    this.lastPlan = { at: this.now(), ...clone(plan) };
    this._event('BANK_SPACE_PLAN', plan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK ? 'warn' : 'info', plan.reason, { action: plan.action, pack: plan.pack || null, item: plan.candidate && plan.candidate.item || null });
    return clone(this.lastPlan);
  }

  status() {
    return {
      schemaVersion: BANK_CAPACITY_SCHEMA_VERSION,
      mode: BANK_CAPACITY_MODE,
      actionAuthority: false,
      destructiveActionAuthority: false,
      automaticSellEnabled: false,
      automaticExpansionEnabled: false,
      workspaceSlots: this.workspaceSlots,
      protectedGoldReserve: this.protectedGoldReserve,
      protectedShellReserve: this.protectedShellReserve,
      shellSpendAllowed: this.allowShellSpend,
      pressureObservationsRequired: this.pressureObservationsRequired,
      observation: clone(this.lastObservation),
      lastPlan: clone(this.lastPlan),
      workGate: this.lastPlan && this.lastPlan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK ? {
        inventoryProducingWorkBlocked: true,
        globalBotStop: false,
        reason: this.lastPlan.reason
      } : { inventoryProducingWorkBlocked: false, globalBotStop: false, reason: null },
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  BankCapacityManager,
  BANK_CAPACITY_SCHEMA_VERSION,
  BANK_CAPACITY_MODE,
  BankSpaceAction,
  packCatalogRow,
  itemIdentity
};

},
"src/economy/bank-expansion-transactions.js": function(require,module,exports){
'use strict';

const BANK_EXPANSION_TX_SCHEMA_VERSION = 1;
const BANK_EXPANSION_TX_MODE = 'shadow-restart-safe-default-off';
const BankExpansionState = Object.freeze({
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const TERMINAL = new Set([BankExpansionState.COMMITTED, BankExpansionState.ABORTED, BankExpansionState.FAILED_SAFE]);

function finite(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function storageGet(storage, key) {
  if (!storage) return null;
  if (typeof storage.get === 'function') return storage.get(key);
  if (typeof storage.getItem === 'function') return storage.getItem(key);
  return null;
}
function storageSet(storage, key, value) {
  if (!storage) return false;
  if (typeof storage.set === 'function') { storage.set(key, value); return true; }
  if (typeof storage.setItem === 'function') { storage.setItem(key, value); return true; }
  return false;
}

class BankExpansionTransactionEngine {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3:bank-expansion-transactions:v1';
    this.leaseMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.leaseMs, 30000)));
    this.failureWindowMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.circuitCooldownMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.preflightRetryBudget = Math.max(0, Math.min(10, Math.floor(finite(options.preflightRetryBudget, 2))));
    this.retryBackoffMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.retryBackoffMs, 5000)));
    this.transactions = new Map();
    this.activeByPack = new Map();
    this.failures = [];
    this.circuit = null;
    this.sequence = 0;
    this.stats = { planned: 0, deduped: 0, committed: 0, aborted: 0, failedSafe: 0, recovered: 0, expired: 0, loadErrors: 0, saveErrors: 0 };
  }
  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'bank-expansion-transaction', event, severity, reason, data });
  }
  _pruneFailures() {
    const now = this.now();
    this.failures = this.failures.filter((row) => now - row.at <= this.failureWindowMs);
    if (this.circuit && this.circuit.openUntil <= now) this.circuit = null;
  }
  breaker() {
    this._pruneFailures();
    return { open: !!this.circuit, openUntil: this.circuit && this.circuit.openUntil || null, reason: this.circuit && this.circuit.reason || null, failuresInWindow: this.failures.length, threshold: this.failureThreshold, windowMs: this.failureWindowMs, cooldownMs: this.circuitCooldownMs };
  }
  noteFailure(reason) {
    this._pruneFailures();
    const now = this.now();
    this.failures.push({ at: now, reason: String(reason || 'BANK_EXPANSION_FAILURE') });
    if (this.failures.length >= this.failureThreshold) {
      this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'BANK_EXPANSION_FAILURE') };
      this._event('BANK_EXPANSION_CIRCUIT_OPENED', 'warn', this.circuit.reason, { openUntil: this.circuit.openUntil });
    }
    this.save();
    return this.breaker();
  }
  noteSuccess() { this.failures = []; this.circuit = null; this.save(); return this.breaker(); }
  plan(plan = {}, context = {}) {
    if (!plan || plan.action !== 'EXPAND_BANK_PACK') return { accepted: false, reason: 'EXPANSION_PLAN_REQUIRED' };
    if (this.breaker().open) return { accepted: false, reason: 'BANK_EXPANSION_CIRCUIT_OPEN' };
    const pack = String(plan.pack || '').trim();
    const currency = String(plan.currency || '').trim();
    const cost = finite(plan.cost, -1);
    if (!pack || !['gold', 'shells'].includes(currency) || cost < 0) return { accepted: false, reason: 'INVALID_EXPANSION_INTENT' };
    const existingId = this.activeByPack.get(pack);
    if (existingId) {
      this.stats.deduped += 1;
      return { accepted: false, reason: 'BANK_PACK_TRANSACTION_ALREADY_ACTIVE', transaction: this.get(existingId) };
    }
    const observation = context.observation || null;
    const packBefore = observation && Array.isArray(observation.packs) ? observation.packs.find((row) => row.name === pack) : null;
    if (!packBefore || packBefore.unlocked) return { accepted: false, reason: packBefore ? 'BANK_PACK_ALREADY_UNLOCKED' : 'BANK_PACK_NOT_OBSERVED' };
    if ((currency === 'gold' ? packBefore.goldCost : packBefore.shellCost) !== cost) return { accepted: false, reason: 'EXPANSION_COST_STALE' };
    const now = this.now();
    const id = `bank-expand-${now.toString(36)}-${(++this.sequence).toString(36)}`;
    const row = {
      schemaVersion: BANK_EXPANSION_TX_SCHEMA_VERSION,
      id,
      pack,
      map: plan.map == null ? null : String(plan.map),
      currency,
      cost,
      protectedReserve: Math.max(0, finite(plan.protectedReserve, 0)),
      state: BankExpansionState.RESERVED,
      reason: 'EXPANSION_INTENT_PERSISTED',
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      preflightRetriesRemaining: this.preflightRetryBudget,
      nextRetryAt: null,
      rawActionAttempts: 0,
      rawActionAttemptLimit: 1,
      before: { unlocked: false, capacity: Math.max(0, finite(packBefore.capacity, 0)), goldCost: packBefore.goldCost, shellCost: packBefore.shellCost, totals: clone(observation.totals) },
      executionAllowed: false,
      actionAuthority: false,
      restartReconcileRequired: false
    };
    this.transactions.set(id, row);
    this.activeByPack.set(pack, id);
    this.stats.planned += 1;
    this.save();
    this._event('BANK_EXPANSION_RESERVED', 'info', null, { transactionId: id, pack, currency, cost, leaseExpiresAt: row.leaseExpiresAt });
    return { accepted: true, transaction: clone(row) };
  }
  begin(id) {
    const row = this.transactions.get(String(id));
    if (!row) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (row.state !== BankExpansionState.RESERVED) return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (row.leaseExpiresAt != null && this.now() > row.leaseExpiresAt) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (row.rawActionAttempts >= row.rawActionAttemptLimit) return { ok: false, reason: 'RAW_ACTION_ATTEMPT_BUDGET_EXHAUSTED' };
    row.state = BankExpansionState.EXECUTING;
    row.reason = 'RAW_ACTION_STARTED';
    row.updatedAt = this.now();
    row.rawActionAttempts += 1;
    this.save();
    return { ok: true, transaction: clone(row) };
  }
  verifying(id) {
    const row = this.transactions.get(String(id));
    if (!row || row.state !== BankExpansionState.EXECUTING) return false;
    row.state = BankExpansionState.VERIFYING;
    row.reason = 'RAW_ACTION_RESULT_RECEIVED';
    row.updatedAt = this.now();
    this.save();
    return true;
  }
  preflightRetry(id, reason) {
    const row = this.transactions.get(String(id));
    if (!row || row.state !== BankExpansionState.RESERVED) return false;
    if (row.preflightRetriesRemaining <= 0) return false;
    row.preflightRetriesRemaining -= 1;
    row.nextRetryAt = this.now() + this.retryBackoffMs;
    row.reason = String(reason || 'PREFLIGHT_RETRY_BACKOFF');
    row.updatedAt = this.now();
    this.save();
    return true;
  }
  commit(id, evidence = {}) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = BankExpansionState.COMMITTED;
    row.reason = 'UNLOCK_VERIFIED_COMMIT';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.evidence = clone(evidence);
    this.activeByPack.delete(row.pack);
    this.stats.committed += 1;
    this.noteSuccess();
    this.save();
    return true;
  }
  abort(id, reason = 'ABORTED') {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = BankExpansionState.ABORTED;
    row.reason = String(reason);
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    this.activeByPack.delete(row.pack);
    this.stats.aborted += 1;
    this.save();
    return true;
  }
  failSafe(id, reason = 'FAILED_SAFE', evidence = {}) {
    const row = this.transactions.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = BankExpansionState.FAILED_SAFE;
    row.reason = String(reason);
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.evidence = clone(evidence);
    this.activeByPack.delete(row.pack);
    this.stats.failedSafe += 1;
    this.noteFailure(row.reason);
    this.save();
    return true;
  }
  reconcile(id, observation) {
    const row = this.transactions.get(String(id));
    if (!row || row.state !== BankExpansionState.RECOVERING) return { reconciled: false, reason: 'TRANSACTION_NOT_RECOVERING' };
    const pack = observation && Array.isArray(observation.packs) ? observation.packs.find((candidate) => candidate.name === row.pack) : null;
    if (pack && pack.unlocked && pack.capacity > 0) {
      row.state = BankExpansionState.COMMITTED;
      row.reason = 'RESTART_OBSERVED_UNLOCK';
      row.updatedAt = this.now();
      row.leaseExpiresAt = null;
      row.restartReconcileRequired = false;
      row.evidence = { after: clone(pack), reconciliation: true };
      this.activeByPack.delete(row.pack);
      this.stats.committed += 1;
      this.stats.recovered += 1;
      this.noteSuccess();
      this.save();
      return { reconciled: true, committed: true, transaction: clone(row) };
    }
    row.state = BankExpansionState.ABORTED;
    row.reason = 'RESTART_RECONCILED_NO_UNLOCK_RETRY_REQUIRES_NEW_TRANSACTION';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    this.activeByPack.delete(row.pack);
    this.stats.aborted += 1;
    this.stats.recovered += 1;
    this.save();
    return { reconciled: true, committed: false, transaction: clone(row) };
  }
  tick() {
    const now = this.now();
    let expired = 0;
    for (const row of this.transactions.values()) {
      if (TERMINAL.has(row.state) || row.state === BankExpansionState.RECOVERING) continue;
      if (row.leaseExpiresAt != null && now > row.leaseExpiresAt) {
        this.abort(row.id, 'BANK_EXPANSION_LEASE_EXPIRED');
        expired += 1;
        this.stats.expired += 1;
      }
    }
    this._pruneFailures();
    return { expired };
  }
  get(id) { const row = this.transactions.get(String(id)); return row ? clone(row) : null; }
  list(limit = 100) {
    const rows = [...this.transactions.values()].sort((a, b) => a.createdAt - b.createdAt);
    return rows.slice(-Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))))).map(clone);
  }
  save() {
    if (!this.storage) return false;
    try {
      return storageSet(this.storage, this.storageKey, JSON.stringify({ schemaVersion: BANK_EXPANSION_TX_SCHEMA_VERSION, sequence: this.sequence, transactions: this.list(256), failures: clone(this.failures), circuit: clone(this.circuit) }));
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('BANK_EXPANSION_SAVE_FAILED', 'error', 'PERSISTENCE_WRITE_FAILED', { message: String(error && error.message || error) });
      return false;
    }
  }
  load() {
    this.transactions.clear(); this.activeByPack.clear();
    if (!this.storage) return false;
    try {
      const raw = storageGet(this.storage, this.storageKey);
      if (!raw) return false;
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!payload || payload.schemaVersion !== BANK_EXPANSION_TX_SCHEMA_VERSION || !Array.isArray(payload.transactions)) throw new Error('UNSUPPORTED_BANK_EXPANSION_SCHEMA');
      this.sequence = Math.max(0, Math.floor(finite(payload.sequence, 0)));
      this.failures = Array.isArray(payload.failures) ? payload.failures : [];
      this.circuit = payload.circuit || null;
      for (const candidate of payload.transactions) {
        if (!candidate || !candidate.id || !candidate.pack) continue;
        const row = clone(candidate);
        if (!TERMINAL.has(row.state)) {
          row.state = BankExpansionState.RECOVERING;
          row.reason = 'RESTART_RECONCILE_REQUIRED';
          row.restartReconcileRequired = true;
          row.leaseExpiresAt = null;
          this.activeByPack.set(row.pack, row.id);
        }
        this.transactions.set(row.id, row);
      }
      return true;
    } catch (error) {
      this.transactions.clear(); this.activeByPack.clear(); this.failures = []; this.circuit = null;
      this.stats.loadErrors += 1;
      this._event('BANK_EXPANSION_LOAD_FAILED', 'error', 'PERSISTENCE_CORRUPT_FAIL_CLOSED', { message: String(error && error.message || error) });
      return false;
    }
  }
  status() {
    const rows = [...this.transactions.values()];
    return { schemaVersion: BANK_EXPANSION_TX_SCHEMA_VERSION, mode: BANK_EXPANSION_TX_MODE, actionAuthority: false, liveExecutionEnabled: false, leaseMs: this.leaseMs, rawActionAttemptLimit: 1, preflightRetryBudget: this.preflightRetryBudget, retryBackoffMs: this.retryBackoffMs, transactions: rows.length, active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== BankExpansionState.RECOVERING).length, recovering: rows.filter((row) => row.state === BankExpansionState.RECOVERING).length, breaker: this.breaker(), stats: clone(this.stats) };
  }
}

module.exports = { BankExpansionTransactionEngine, BANK_EXPANSION_TX_SCHEMA_VERSION, BANK_EXPANSION_TX_MODE, BankExpansionState };

},
"src/economy/controlled-bank-expansion-executor.js": function(require,module,exports){
'use strict';

const CONTROLLED_BANK_EXPANSION_MODE = 'controlled-canary-default-off';
const CONTROLLED_BANK_EXPANSION_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

class ControlledBankExpansionExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.engine = options.engine;
    this.manager = options.manager;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.timeoutMs = Math.max(1000, Math.min(30000, finite(options.timeoutMs, 10000)));
    this.enabled = false;
    this.busy = false;
    this.lastAction = null;
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, timeouts: 0, staleCostRejected: 0, partialUnlockRejected: 0 };
  }
  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-bank-expansion', event, severity, reason, data });
  }
  configure(config = {}) {
    if (config.enabled === true && config.ack !== CONTROLLED_BANK_EXPANSION_ACK) {
      this.enabled = false;
      this._event('CONTROLLED_BANK_EXPANSION_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = config.enabled === true;
    this._event('CONTROLLED_BANK_EXPANSION_CONFIG_CHANGED', 'warn', this.enabled ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED');
    return this.status();
  }
  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._event('CONTROLLED_BANK_EXPANSION_DISABLED', 'warn', reason);
    return this.status();
  }
  _inCombat() {
    const character = this.root && this.root.character || {};
    if (character.target) return true;
    const entities = this.root && this.root.parent && this.root.parent.entities || this.root.entities || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }
  _bankPacks() {
    return this.root.bank_packs || this.root.parent && this.root.parent.bank_packs || {};
  }
  _observe() {
    const character = this.root && this.root.character || null;
    if (!character || !this.manager) return null;
    const G = this.root.G || this.root.parent && this.root.parent.G || {};
    return this.manager.observe({ character, bankPacks: this._bankPacks(), gameData: G, observedAt: this.now() });
  }
  _preflight(tx) {
    if (!tx) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_BANK_EXPANSION_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_BANK_EXPANSION_BUSY' };
    if (tx.state !== 'RESERVED') return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (tx.leaseExpiresAt != null && this.now() > Number(tx.leaseExpiresAt)) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (tx.nextRetryAt != null && this.now() < Number(tx.nextRetryAt)) return { ok: false, reason: 'PREFLIGHT_BACKOFF_ACTIVE' };
    if (tx.currency !== 'gold') return { ok: false, reason: 'SHELL_SPEND_NOT_ENABLED_FOR_ALPHA18_CANARY' };
    if (this.engine && this.engine.breaker().open) return { ok: false, reason: 'BANK_EXPANSION_CIRCUIT_OPEN' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this.root && this.root.character;
    if (!character) return { ok: false, reason: 'CHARACTER_UNAVAILABLE' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
    if (Array.isArray(character.bank[tx.pack])) return { ok: false, reason: 'BANK_PACK_ALREADY_UNLOCKED' };
    const catalog = this._bankPacks();
    const raw = catalog && catalog[tx.pack];
    if (!raw) return { ok: false, reason: 'BANK_PACK_CATALOG_MISSING' };
    const map = Array.isArray(raw) ? raw[0] : raw.map || raw.place;
    const goldCost = Array.isArray(raw) ? finite(raw[1], -1) : finite(raw.gold == null ? raw.goldCost : raw.gold, -1);
    if (map != null && String(character.map || '') !== String(map)) return { ok: false, reason: 'WRONG_BANK_FLOOR', expectedMap: map, actualMap: character.map || null };
    if (goldCost < 0 || goldCost !== finite(tx.cost, -2)) {
      this.stats.staleCostRejected += 1;
      return { ok: false, reason: 'EXPANSION_COST_STALE', expectedCost: tx.cost, observedCost: goldCost };
    }
    const gold = Math.max(0, finite(character.gold, 0));
    if (gold < goldCost) return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
    if (gold - goldCost < Math.max(0, finite(tx.protectedReserve, 0))) return { ok: false, reason: 'PROTECTED_GOLD_RESERVE_VIOLATION' };
    if (typeof this.root.open_bank_pack !== 'function') return { ok: false, reason: 'OPEN_BANK_PACK_API_UNAVAILABLE' };
    return { ok: true, character, catalog, map, goldCost };
  }
  _timeout(promise) {
    let timer = null;
    const setTimer = this.root.setTimeout || setTimeout;
    const clearTimer = this.root.clearTimeout || clearTimeout;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error('BANK_EXPANSION_TIMEOUT')), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }
  _snapshot(tx) {
    const character = this.root && this.root.character || {};
    const pack = character.bank && Array.isArray(character.bank[tx.pack]) ? character.bank[tx.pack] : null;
    return {
      at: this.now(),
      pack: tx.pack,
      unlocked: !!pack,
      capacity: pack ? pack.length : 0,
      occupied: pack ? pack.filter(Boolean).length : 0,
      gold: Math.max(0, finite(character.gold, 0)),
      map: character.map || null
    };
  }
  _failSafe(tx, reason, evidence = {}) {
    this.engine.failSafe(tx.id, reason, evidence);
    this.stats.failedSafe += 1;
    this.lastAction = { at: this.now(), transactionId: tx.id, pack: tx.pack, result: 'FAILED_SAFE', reason, evidence: clone(evidence) };
    this._event('CONTROLLED_BANK_EXPANSION_FAILED_SAFE', 'error', reason, this.lastAction);
    return { executed: true, committed: false, reason, evidence: clone(evidence) };
  }
  async execute(transactionId) {
    const tx = this.engine && this.engine.get(String(transactionId));
    const check = this._preflight(tx);
    if (!check.ok) {
      this.stats.rejected += 1;
      if (tx && ['BANK_PACK_CATALOG_MISSING', 'WRONG_BANK_FLOOR', 'PREFLIGHT_BACKOFF_ACTIVE'].includes(check.reason)) this.engine.preflightRetry(tx.id, check.reason);
      if (tx && check.reason === 'TRANSACTION_LEASE_EXPIRED') this.engine.abort(tx.id, check.reason);
      this._event('CONTROLLED_BANK_EXPANSION_REJECTED', 'warn', check.reason, { transactionId, pack: tx && tx.pack || null });
      return { executed: false, committed: false, reason: check.reason, ...check };
    }
    const begun = this.engine.begin(tx.id);
    if (!begun.ok) return { executed: false, committed: false, reason: begun.reason };
    this.busy = true;
    this.stats.attempts += 1;
    const before = this._snapshot(tx);
    this._event('CONTROLLED_BANK_EXPANSION_STARTED', 'warn', 'CONTROLLED_CANARY', { transactionId: tx.id, pack: tx.pack, currency: tx.currency, cost: tx.cost, before });
    try {
      const response = await this._timeout(this.root.open_bank_pack(tx.pack, tx.currency, this.timeoutMs));
      this.engine.verifying(tx.id);
      const after = this._snapshot(tx);
      if (!after.unlocked || after.capacity <= 0) {
        this.stats.partialUnlockRejected += 1;
        return this._failSafe(tx, 'BANK_PACK_UNLOCK_NOT_OBSERVED', { before, after, response: clone(response) });
      }
      if (before.unlocked || before.capacity !== 0) return this._failSafe(tx, 'BANK_PACK_BEFORE_SNAPSHOT_INVALID', { before, after });
      const goldDelta = before.gold - after.gold;
      const expectedCost = finite(tx.cost, -1);
      if (expectedCost < 0 || (goldDelta !== 0 && goldDelta !== expectedCost)) {
        return this._failSafe(tx, 'BANK_EXPANSION_GOLD_DELTA_INVALID', { before, after, expectedCost, observedGoldDelta: goldDelta });
      }
      this.engine.commit(tx.id, { before, after, response: clone(response), expectedCost, observedGoldDelta: goldDelta, commitBasis: 'OFFICIAL_PROMISE_PLUS_OBSERVED_UNLOCK' });
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), transactionId: tx.id, pack: tx.pack, result: 'COMMITTED', reason: 'UNLOCK_VERIFIED_COMMIT', before, after, expectedCost, observedGoldDelta: goldDelta };
      this._event('CONTROLLED_BANK_EXPANSION_COMMITTED', 'info', 'UNLOCK_VERIFIED_COMMIT', this.lastAction);
      return { executed: true, committed: true, reason: 'UNLOCK_VERIFIED_COMMIT', before, after, expectedCost, observedGoldDelta: goldDelta, response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'BANK_EXPANSION_FAILED');
      if (reason.includes('TIMEOUT')) this.stats.timeouts += 1;
      return this._failSafe(tx, reason, { before, after: this._snapshot(tx) });
    } finally {
      this.busy = false;
    }
  }
  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_BANK_EXPANSION_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      explicitAckRequired: CONTROLLED_BANK_EXPANSION_ACK,
      officialApi: 'open_bank_pack(pack,currency,timeout_ms)',
      goldCanaryOnly: true,
      shellSpendEnabled: false,
      rawActionAttemptLimit: 1,
      verification: 'official-promise-plus-observed-pack-unlock-capacity-and-exact-or-stale-local-gold-delta',
      busy: this.busy,
      timeoutMs: this.timeoutMs,
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledBankExpansionExecutor, CONTROLLED_BANK_EXPANSION_MODE, CONTROLLED_BANK_EXPANSION_ACK };

},
"src/ops/alpha18-combined-live-gate-hardened.js": function(require,module,exports){
'use strict';

const {
  Alpha18CombinedLiveGate: BaseAlpha18CombinedLiveGate,
  ALPHA18_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
} = require('./alpha18-combined-live-gate');

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class Alpha18CombinedLiveGate extends BaseAlpha18CombinedLiveGate {
  constructor(options = {}) {
    super(options);
    if (this.observationMs > 0 && this.sampleMs <= 0) this.sampleMs = 1;
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

  _publish(result) {
    if (result && result.planProbe && result.planProbe.plan && result.expansionCanary) {
      const plan = result.planProbe.plan;
      const expansionCoverageSatisfied = plan.action !== 'EXPAND_BANK_PACK'
        || plan.requiresTravel === true
        || result.expansionCanary.state === 'COMMITTED';
      result.expansionCoverageSatisfied = expansionCoverageSatisfied;
      result.confirmationEligible = result.confirmationEligible === true && expansionCoverageSatisfied;
      if (!expansionCoverageSatisfied) {
        result.confirmationBlockers = [...new Set([...(result.confirmationBlockers || []), 'JUSTIFIED_SAME_FLOOR_EXPANSION_NOT_COMMITTED'])];
      } else {
        result.confirmationBlockers = clone(result.confirmationBlockers || []);
      }
    }

    // Base run() snapshots lastResult immediately before _publish(). Re-snapshot the
    // hardened result here so status()/result()/global text all expose identical evidence.
    this.lastResult = clone(result);
    return super._publish(result);
  }
}

module.exports = {
  Alpha18CombinedLiveGate,
  ALPHA18_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};

},
"src/ops/alpha18-combined-live-gate.js": function(require,module,exports){
'use strict';

const { RELEASE_VERSION } = require('../release-version');

const ALPHA18_LIVE_GATE_ACK = 'ALPHA18_FULL_LIVE_GATE';
const CONTROLLED_CANARY_ACK = 'CONTROLLED_CANARY';
const REQUIRED_OBSERVATION_MS = 10 * 60 * 1000;
const DEFAULT_SAMPLE_MS = 5000;
const ALLOWED_SUPERVISOR = new Set(['HEALTHY', 'WATCH']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function counterDelta(after, before, key) {
  return Math.max(0, finite(after && after[key], 0) - finite(before && before[key], 0));
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

class Alpha18CombinedLiveGate {
  constructor(options = {}) {
    this.runtime = options.runtime;
    this.root = options.root || this.runtime && this.runtime.root || globalThis;
    this.now = options.now || this.runtime && this.runtime.now || (() => Date.now());
    this.testMode = options.testMode === true;
    this.observationMs = this.testMode
      ? Math.max(0, finite(options.observationMs, 0))
      : REQUIRED_OBSERVATION_MS;
    this.sampleMs = this.testMode
      ? Math.max(0, finite(options.sampleMs, 1))
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

  _character() {
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _inCombat() {
    const character = this._character() || {};
    if (character.target) return true;
    const entities = this.root && this.root.parent && this.root.parent.entities || this.root && this.root.entities || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (log && typeof log.emit === 'function') log.emit({ component: 'alpha18-live-gate', event, severity, reason, data });
  }

  _controlledSnapshot() {
    const runtime = this.runtime;
    return {
      merchant: runtime && runtime.controlledMerchant && runtime.controlledMerchant.status ? runtime.controlledMerchant.status() : null,
      travel: runtime && runtime.controlledTravel && runtime.controlledTravel.status ? runtime.controlledTravel.status() : null,
      expansion: runtime && runtime.controlledBankExpansion && runtime.controlledBankExpansion.status ? runtime.controlledBankExpansion.status() : null
    };
  }

  _circuits() {
    const runtime = this.runtime;
    const tx = runtime && runtime.transactionEngine && runtime.transactionEngine.status ? runtime.transactionEngine.status() : {};
    return {
      sell: tx && tx.circuits && tx.circuits.SELL || null,
      bank: tx && tx.circuits && tx.circuits.BANK || null,
      travel: runtime && runtime.safeTravel && runtime.safeTravel.breaker ? runtime.safeTravel.breaker() : null,
      bankExpansion: runtime && runtime.bankExpansionTransactions && runtime.bankExpansionTransactions.breaker ? runtime.bankExpansionTransactions.breaker() : null
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
        merchantEnabled: !!(controlled.merchant && controlled.merchant.enabled),
        travelEnabled: !!(controlled.travel && controlled.travel.enabled),
        expansionEnabled: !!(controlled.expansion && controlled.expansion.enabled)
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
    if (runtime.controlledBankExpansion && runtime.controlledBankExpansion.disable) runtime.controlledBankExpansion.disable('ALPHA18_LIVE_GATE_SAFE_STATE');
    if (runtime.controlledMerchant && runtime.controlledMerchant.disable) runtime.controlledMerchant.disable('ALPHA18_LIVE_GATE_SAFE_STATE');
    if (runtime.controlledTravel && runtime.controlledTravel.disable) await Promise.resolve(runtime.controlledTravel.disable('ALPHA18_LIVE_GATE_SAFE_STATE')).catch(() => {});
    if (runtime.setMode) runtime.setMode('shadow');
    if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false);
  }

  _precheck() {
    const runtime = this.runtime;
    const character = this._character();
    const supervisor = runtime && runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : {};
    const observation = runtime && runtime._observeBankCapacity ? runtime._observeBankCapacity() : null;
    const failures = [];
    if (!runtime) failures.push('RUNTIME_UNAVAILABLE');
    if (!character) failures.push('CHARACTER_UNAVAILABLE');
    if (character && String(character.ctype || character.type || '').toLowerCase() !== 'merchant') failures.push('MERCHANT_REQUIRED');
    if (character && (character.rip === true || character.dead === true)) failures.push('CHARACTER_DEAD');
    if (character && (!character.bank || typeof character.bank !== 'object')) failures.push('BANK_CONTEXT_REQUIRED');
    if (this._inCombat()) failures.push('COMBAT_ACTIVE');
    if (!ALLOWED_SUPERVISOR.has(String(supervisor && supervisor.state || ''))) failures.push('SUPERVISOR_NOT_HEALTHY');
    if (!this.root || typeof this.root.open_bank_pack !== 'function') failures.push('OPEN_BANK_PACK_API_UNAVAILABLE');
    if (!observation || !Array.isArray(observation.packs) || observation.packs.length === 0) failures.push('BANK_PACK_CATALOG_UNAVAILABLE');
    if (!observation || observation.actionAuthority !== false) failures.push('BANK_CAPACITY_AUTHORITY_INVARIANT_FAILED');
    return {
      pass: failures.length === 0,
      failures,
      character: character ? { name: character.name || null, ctype: character.ctype || character.type || null, map: character.map || null, gold: finite(character.gold, 0) } : null,
      supervisor: clone(supervisor),
      bankObservation: clone(observation)
    };
  }

  _wrongAckProbe() {
    const runtime = this.runtime;
    if (!runtime || !runtime.controlledBankExpansion || typeof runtime.controlledBankExpansion.configure !== 'function') {
      return { pass: false, reason: 'CONTROLLED_BANK_EXPANSION_UNAVAILABLE' };
    }
    const result = runtime.controlledBankExpansion.configure({ enabled: true, ack: 'WRONG_ACK_ALPHA18_LIVE_GATE' });
    const pass = !result || result.enabled !== true;
    runtime.controlledBankExpansion.disable('ALPHA18_LIVE_GATE_WRONG_ACK_PROBE_COMPLETE');
    return { pass, reason: pass ? 'WRONG_ACK_REJECTED' : 'WRONG_ACK_UNEXPECTEDLY_ENABLED', status: clone(result) };
  }

  _planProbe() {
    const runtime = this.runtime;
    if (!runtime || typeof runtime.planBankSpace !== 'function') return { pass: false, reason: 'BANK_SPACE_PLANNER_UNAVAILABLE', plan: null };
    const plan = runtime.planBankSpace({ item: '__alpha18_live_gate_probe__', level: 0, quantity: 1, depositBlocked: true, minimumReserves: {} });
    const allowed = new Set(['DEPOSIT_STACK', 'DEPOSIT_FREE_SLOT', 'CONSOLIDATE_BANK_STACKS', 'EXPAND_BANK_PACK', 'EMERGENCY_RECLAIM', 'BLOCK_INVENTORY_PRODUCING_WORK']);
    const failures = [];
    if (!plan || !allowed.has(String(plan.action || ''))) failures.push('UNKNOWN_BANK_SPACE_PLAN');
    if (plan && plan.action === 'EMERGENCY_RECLAIM') {
      if (plan.executionAuthority !== false) failures.push('RECLAIM_AUTHORITY_MUST_REMAIN_FALSE');
      if (finite(plan.quantity, 0) !== 1) failures.push('RECLAIM_MUST_BE_EXACTLY_ONE_UNIT');
    }
    if (plan && plan.action === 'BLOCK_INVENTORY_PRODUCING_WORK' && plan.globalBotStop !== false) failures.push('SELECTIVE_BLOCK_MUST_NOT_GLOBAL_STOP');
    if (plan && plan.action === 'EXPAND_BANK_PACK' && plan.exactlyOneExpansion !== true) failures.push('EXPANSION_MUST_BE_EXACTLY_ONE');
    return { pass: failures.length === 0, failures, plan: clone(plan) };
  }

  async _maybeExpansionCanary(plan, allowExpansionPurchase) {
    const runtime = this.runtime;
    if (!plan || plan.action !== 'EXPAND_BANK_PACK') return { state: 'NOT_JUSTIFIED', pass: true, reason: 'LIVE_PLANNER_SELECTED_OTHER_RECOVERY', plan: clone(plan) };
    if (plan.requiresTravel) return { state: 'NOT_EXECUTED', pass: true, reason: 'WRONG_BANK_FLOOR_NO_TRAVEL_AUTHORITY', plan: clone(plan) };
    if (allowExpansionPurchase !== true) return { state: 'NOT_EXECUTED', pass: true, reason: 'OPERATOR_DID_NOT_ALLOW_EXPANSION_PURCHASE', plan: clone(plan) };
    if (this._inCombat()) return { state: 'NOT_EXECUTED', pass: false, reason: 'COMBAT_ACTIVE', plan: clone(plan) };

    const reservation = runtime.planBankExpansion({ plan });
    if (!reservation || reservation.accepted !== true || !reservation.transaction || !reservation.transaction.id) {
      return { state: 'FAILED', pass: false, reason: reservation && reservation.reason || 'EXPANSION_RESERVATION_FAILED', reservation: clone(reservation), plan: clone(plan) };
    }

    let execution = null;
    try {
      runtime.setMode('active');
      const enabled = runtime.configureControlledBankExpansion({ enabled: true, ack: CONTROLLED_CANARY_ACK });
      if (!enabled || enabled.enabled !== true) {
        return { state: 'FAILED', pass: false, reason: enabled && enabled.enableRejected || 'CONTROLLED_EXPANSION_ENABLE_FAILED', reservation: clone(reservation), enabled: clone(enabled) };
      }
      execution = await runtime.executeBankExpansion(reservation.transaction.id);
      const after = runtime._observeBankCapacity();
      const packAfter = after && Array.isArray(after.packs) ? after.packs.find((row) => row.name === plan.pack) : null;
      const pass = !!(execution && execution.executed === true && execution.committed === true && packAfter && packAfter.unlocked && packAfter.capacity > 0);
      return {
        state: pass ? 'COMMITTED' : 'FAILED',
        pass,
        reason: execution && execution.reason || (pass ? 'UNLOCK_VERIFIED_COMMIT' : 'EXPANSION_EXECUTION_FAILED'),
        reservation: clone(reservation),
        execution: clone(execution),
        observedPackAfter: clone(packAfter)
      };
    } finally {
      if (runtime.controlledBankExpansion && runtime.controlledBankExpansion.disable) runtime.controlledBankExpansion.disable('ALPHA18_LIVE_GATE_CANARY_COMPLETE');
      runtime.setMode('shadow');
      if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false);
    }
  }

  _eventsSince(at) {
    const log = this.runtime && this.runtime.log;
    const rows = log && typeof log.list === 'function' ? log.list(4000) : [];
    return rows.filter((row) => finite(row && (row.at == null ? row.timestamp : row.at), 0) >= at);
  }

  _sampleViolations(snapshot) {
    const violations = [];
    if (!snapshot) return ['STATUS_UNAVAILABLE'];
    if (snapshot.mode !== 'shadow') violations.push('RUNTIME_LEFT_SHADOW');
    if (snapshot.farmerEnabled) violations.push('FARMER_ENABLED_DURING_OBSERVATION');
    if (snapshot.controlled && snapshot.controlled.merchantEnabled) violations.push('CONTROLLED_MERCHANT_ENABLED_DURING_OBSERVATION');
    if (snapshot.controlled && snapshot.controlled.travelEnabled) violations.push('CONTROLLED_TRAVEL_ENABLED_DURING_OBSERVATION');
    if (snapshot.controlled && snapshot.controlled.expansionEnabled) violations.push('CONTROLLED_BANK_EXPANSION_ENABLED_DURING_OBSERVATION');
    if (!ALLOWED_SUPERVISOR.has(String(snapshot.supervisorState || ''))) violations.push('SUPERVISOR_DEGRADED_DURING_OBSERVATION');
    for (const [name, breaker] of Object.entries(snapshot.circuits || {})) if (breaker && breaker.open) violations.push(`${String(name).toUpperCase()}_CIRCUIT_OPEN`);
    if (snapshot.capacity && snapshot.capacity.actionAuthority !== false) violations.push('BANK_CAPACITY_GAINED_ACTION_AUTHORITY');
    return violations;
  }

  async _observeWindow() {
    const runtime = this.runtime;
    const startedAt = this.now();
    const beforeControlled = this._controlledSnapshot();
    const beforeExpansion = clone(beforeControlled.expansion && beforeControlled.expansion.stats || {});
    const beforeMerchant = clone(beforeControlled.merchant && beforeControlled.merchant.stats || {});
    const beforeTravel = clone(beforeControlled.travel && beforeControlled.travel.stats || {});
    const samples = [];
    const violations = [];
    let elapsed = 0;

    do {
      if (runtime && runtime._observeBankCapacity) runtime._observeBankCapacity();
      const snapshot = this._safeStateSnapshot();
      const found = this._sampleViolations(snapshot);
      if (found.length) violations.push(...found.map((reason) => ({ at: this.now(), reason })));
      samples.push(snapshot);
      if (this.observationMs <= 0 || elapsed >= this.observationMs) break;
      const step = Math.min(this.sampleMs || this.observationMs, this.observationMs - elapsed);
      await this.sleep(step);
      elapsed += step;
    } while (elapsed <= this.observationMs);

    const finishedAt = this.now();
    const afterControlled = this._controlledSnapshot();
    const afterExpansion = afterControlled.expansion && afterControlled.expansion.stats || {};
    const afterMerchant = afterControlled.merchant && afterControlled.merchant.stats || {};
    const afterTravel = afterControlled.travel && afterControlled.travel.stats || {};
    const events = this._eventsSince(startedAt);
    const errorEvents = events.filter((row) => String(row && row.severity || '').toLowerCase() === 'error');
    const unexpectedActionDeltas = {
      bankExpansionAttempts: counterDelta(afterExpansion, beforeExpansion, 'attempts'),
      merchantAttempts: counterDelta(afterMerchant, beforeMerchant, 'attempts'),
      travelAttempts: counterDelta(afterTravel, beforeTravel, 'attempts')
    };
    if (unexpectedActionDeltas.bankExpansionAttempts > 0) violations.push({ at: finishedAt, reason: 'BANK_EXPANSION_ATTEMPT_DURING_PASSIVE_WINDOW' });
    if (unexpectedActionDeltas.merchantAttempts > 0) violations.push({ at: finishedAt, reason: 'MERCHANT_ATTEMPT_DURING_PASSIVE_WINDOW' });
    if (unexpectedActionDeltas.travelAttempts > 0) violations.push({ at: finishedAt, reason: 'TRAVEL_ATTEMPT_DURING_PASSIVE_WINDOW' });
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
    return `=== ALPHA18 FULL LIVE GATE RESULT BEGIN ===\n${JSON.stringify(result, null, 2)}\n=== ALPHA18 FULL LIVE GATE RESULT END ===`;
  }

  _publish(result) {
    const text = this._resultText(result);
    this.lastResultText = text;
    try { this.root.AIO_V3_ALPHA18_LIVE_GATE_RESULT = clone(result); } catch (_) {}
    try { this.root.AIO_V3_ALPHA18_LIVE_GATE_RESULT_TEXT = text; } catch (_) {}
    const consoles = [this.root && this.root.console, this.root && this.root.parent && this.root.parent.console].filter(Boolean);
    for (const target of consoles) {
      try { if (target && typeof target.log === 'function') target.log(text); } catch (_) {}
    }
    const gameLog = this.root && (this.root.game_log || this.root.parent && this.root.parent.game_log);
    if (typeof gameLog === 'function') {
      try { gameLog(`[AIO v3 ${RELEASE_VERSION}] ALPHA18 LIVE GATE ${result.pass ? 'PASS' : 'FAIL'} | confirmationEligible=${result.confirmationEligible} | expansion=${result.expansionCanary && result.expansionCanary.state || 'n/a'}`); } catch (_) {}
    }
    return text;
  }

  async run(config = {}) {
    if (this.running) return { accepted: false, reason: 'ALPHA18_LIVE_GATE_ALREADY_RUNNING', status: this.status() };
    if (config.ack !== ALPHA18_LIVE_GATE_ACK) return { accepted: false, reason: 'ALPHA18_LIVE_GATE_ACK_REQUIRED', requiredAck: ALPHA18_LIVE_GATE_ACK };
    if (!this.runtime) return { accepted: false, reason: 'RUNTIME_UNAVAILABLE' };

    this.running = true;
    this.phase = 'SAFE_STATE';
    this.startedAt = this.now();
    this.lastResult = null;
    this.lastResultText = null;
    this._event('ALPHA18_LIVE_GATE_STARTED', 'warn', 'EXPLICIT_OPERATOR_ACK', { observationMs: this.observationMs, allowExpansionPurchase: config.allowExpansionPurchase === true, testMode: this.testMode });

    let result;
    try {
      await this._normalizeSafeState();
      this.phase = 'PRECHECK';
      const precheck = this._precheck();
      const wrongAckProbe = this._wrongAckProbe();
      const planProbe = this._planProbe();
      if (!precheck.pass || !wrongAckProbe.pass || !planProbe.pass) {
        result = {
          schemaVersion: 1,
          release: RELEASE_VERSION,
          pass: false,
          confirmationEligible: false,
          startedAt: this.startedAt,
          finishedAt: this.now(),
          precheck,
          wrongAckProbe,
          planProbe,
          expansionCanary: { state: 'NOT_RUN', pass: false, reason: 'PRECHECK_FAILED' },
          passiveObservation: null,
          finalSafeState: this._safeStateSnapshot()
        };
        return result;
      }

      this.phase = 'OPTIONAL_EXPANSION_CANARY';
      const expansionCanary = await this._maybeExpansionCanary(planProbe.plan, config.allowExpansionPurchase === true);
      await this._normalizeSafeState();

      this.phase = 'PASSIVE_OBSERVATION';
      const passiveObservation = await this._observeWindow();
      await this._normalizeSafeState();
      const finalSafeState = this._safeStateSnapshot();
      const finalViolations = this._sampleViolations(finalSafeState);
      const pass = precheck.pass && wrongAckProbe.pass && planProbe.pass && expansionCanary.pass && passiveObservation.pass && finalViolations.length === 0;
      const confirmationEligible = pass && passiveObservation.confirmationDurationSatisfied && !this.testMode;
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass,
        confirmationEligible,
        startedAt: this.startedAt,
        finishedAt: this.now(),
        testMode: this.testMode,
        policy: {
          requiredAck: ALPHA18_LIVE_GATE_ACK,
          expansionPurchaseExplicitlyAllowed: config.allowExpansionPurchase === true,
          forcedCapacityPressure: false,
          emergencyReclaimExecutionAuthority: false,
          observationRequiredMs: REQUIRED_OBSERVATION_MS
        },
        precheck,
        wrongAckProbe,
        planProbe,
        expansionCanary,
        passiveObservation,
        finalSafeState,
        finalViolations: unique(finalViolations)
      };
      return result;
    } catch (error) {
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass: false,
        confirmationEligible: false,
        startedAt: this.startedAt,
        finishedAt: this.now(),
        error: String(error && error.message || error),
        finalSafeState: null
      };
      this._event('ALPHA18_LIVE_GATE_FAILED', 'error', 'UNCAUGHT_GATE_ERROR', { message: result.error });
      return result;
    } finally {
      try { await this._normalizeSafeState(); } catch (_) {}
      if (result) {
        result.finishedAt = result.finishedAt == null ? this.now() : result.finishedAt;
        result.finalSafeState = result.finalSafeState || this._safeStateSnapshot();
        this.lastResult = clone(result);
        this._publish(result);
        this._event('ALPHA18_LIVE_GATE_FINISHED', result.pass ? 'info' : 'error', result.pass ? 'PASS' : 'FAIL', { confirmationEligible: result.confirmationEligible, expansion: result.expansionCanary && result.expansionCanary.state || null });
      }
      this.phase = 'COMPLETE';
      this.running = false;
    }
  }

  status() {
    return {
      schemaVersion: 1,
      release: RELEASE_VERSION,
      requiredAck: ALPHA18_LIVE_GATE_ACK,
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
  Alpha18CombinedLiveGate,
  ALPHA18_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};

},
"src/autonomy/alpha19-runtime.js": function(require,module,exports){
'use strict';

const { Alpha18Runtime } = require('./alpha18-runtime');
const { MerchantSpaceRecoveryJournal } = require('../economy/merchant-space-recovery-journal');
const { ControlledBankConsolidationExecutor, CONTROLLED_BANK_CONSOLIDATION_ACK } = require('../economy/controlled-bank-consolidation-executor');
const { HardenedControlledMerchantSpaceRecovery, CONTROLLED_SPACE_RECOVERY_ACK, MAX_RAW_ACTIONS_PER_OPERATION } = require('../economy/controlled-merchant-space-recovery-hardened');
const { Alpha19CombinedLiveGate, ALPHA19_LIVE_GATE_ACK } = require('../ops/alpha19-combined-live-gate');

const ALPHA19_VERSION = '3.0.0-alpha.19.0';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

class Alpha19Runtime extends Alpha18Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA19_VERSION;
    this.merchantSpaceRecoveryJournal = options.merchantSpaceRecoveryJournal || new MerchantSpaceRecoveryJournal({
      now: this.now,
      log: this.log,
      storage: options.merchantSpaceRecoveryStorage || options.storage,
      storageKey: options.merchantSpaceRecoveryStorageKey,
      capacity: options.merchantSpaceRecoveryCapacity,
      leaseMs: options.merchantSpaceRecoveryLeaseMs,
      failureWindowMs: options.merchantSpaceRecoveryFailureWindowMs,
      failureThreshold: options.merchantSpaceRecoveryFailureThreshold,
      circuitCooldownMs: options.merchantSpaceRecoveryCircuitCooldownMs
    });
    this.merchantSpaceRecoveryJournal.load();
    this.controlledBankConsolidation = options.controlledBankConsolidation || new ControlledBankConsolidationExecutor({
      root: this.root,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getGameData: () => this.adapter.getGameData() || {},
      timeoutMs: options.controlledBankConsolidationTimeoutMs,
      verifyDelayMs: options.controlledBankConsolidationVerifyDelayMs,
      verifyAttempts: options.controlledBankConsolidationVerifyAttempts
    });
    this.controlledMerchantSpaceRecovery = options.controlledMerchantSpaceRecovery || new HardenedControlledMerchantSpaceRecovery({
      root: this.root,
      log: this.log,
      now: this.now,
      journal: this.merchantSpaceRecoveryJournal,
      manager: this.bankCapacity,
      transactionEngine: this.transactionEngine,
      ledger: this.inventoryLedger,
      controlledMerchant: this.controlledMerchant,
      expansionTransactions: this.bankExpansionTransactions,
      controlledExpansion: this.controlledBankExpansion,
      controlledConsolidation: this.controlledBankConsolidation,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      observeBank: () => this._observeBankCapacity(),
      getGameData: () => this.adapter.getGameData() || {},
      getContentDrift: () => this.contentDrift
    });
    this.alpha19LiveGate = options.alpha19LiveGate || new Alpha19CombinedLiveGate({
      runtime: this,
      root: this.root,
      now: this.now,
      testMode: options.alpha19LiveGateTestMode === true,
      observationMs: options.alpha19LiveGateObservationMs,
      sampleMs: options.alpha19LiveGateSampleMs,
      sleep: options.alpha19LiveGateSleep
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA19_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _economyStatus() {
    const base = super._economyStatus();
    return { ...base, merchantSpaceRecovery: this.controlledMerchantSpaceRecovery.status() };
  }

  _guardControlledAuthority() {
    const result = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (this.merchantSpaceRecoveryJournal.breaker().open) reason = 'SPACE_RECOVERY_CIRCUIT_OPEN';
    if (reason && this.controlledMerchantSpaceRecovery.status().enabled) this.controlledMerchantSpaceRecovery.disable(reason);
    if (reason && this.controlledBankConsolidation.status().enabled) this.controlledBankConsolidation.disable(reason);
    return { ...result, merchantSpaceRecoveryGuardReason: reason };
  }

  tick() { super.tick(); this.merchantSpaceRecoveryJournal.tick(); }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') {
      this.controlledMerchantSpaceRecovery.disable('RUNTIME_LEFT_ACTIVE_MODE');
      this.controlledBankConsolidation.disable('RUNTIME_LEFT_ACTIVE_MODE');
    }
    return resolved;
  }

  planMerchantSpaceRecovery(request = {}) { return this.controlledMerchantSpaceRecovery.plan(request); }

  configureControlledMerchantSpaceRecovery(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledMerchantSpaceRecovery.disable(gate.reason);
        return { ...this.controlledMerchantSpaceRecovery.status(), enableRejected: gate.reason };
      }
      if (this.merchantSpaceRecoveryJournal.breaker().open) {
        this.controlledMerchantSpaceRecovery.disable('SPACE_RECOVERY_CIRCUIT_OPEN');
        return { ...this.controlledMerchantSpaceRecovery.status(), enableRejected: 'SPACE_RECOVERY_CIRCUIT_OPEN' };
      }
    }
    return this.controlledMerchantSpaceRecovery.configure(config);
  }

  executeMerchantSpaceRecovery(id) { return this.controlledMerchantSpaceRecovery.execute(id); }
  reconcileMerchantSpaceRecovery(id) { return this.controlledMerchantSpaceRecovery.reconcile(id); }
  runAlpha19CombinedLiveGate(config = {}) { return this.alpha19LiveGate.run(config); }
  alpha19LiveGateStatus() { return this.alpha19LiveGate.status(); }
  alpha19LiveGateResult() { return this.alpha19LiveGate.result(); }
  alpha19LiveGateResultText() { return this.alpha19LiveGate.resultText(); }

  stop() {
    this.controlledMerchantSpaceRecovery.disable('RUNTIME_STOP');
    this.controlledBankConsolidation.disable('RUNTIME_STOP');
    this.merchantSpaceRecoveryJournal.save();
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: ALPHA19_VERSION,
      economy: this._economyStatus(),
      alpha19: {
        merchantSpaceRecovery: true,
        controlledSpaceRecoveryAck: CONTROLLED_SPACE_RECOVERY_ACK,
        controlledConsolidationAck: CONTROLLED_BANK_CONSOLIDATION_ACK,
        liveGateAck: ALPHA19_LIVE_GATE_ACK,
        liveGate: this.alpha19LiveGate.status(),
        maxRawActionsPerOperation: MAX_RAW_ACTIONS_PER_OPERATION,
        emergencyReclaimMaxUnitsPerOperation: 1,
        emergencyReclaimBulkAllowed: false,
        emergencyReclaimRequiresFreshReobservation: true,
        separateExpansionPurchaseBudget: true,
        separateEmergencyReclaimBudget: true,
        travelAuthority: false,
        shellExpansionAuthority: false,
        craftingAuthority: false,
        upgradeAuthority: false,
        compoundAuthority: false,
        exchangeAuthority: false,
        globalStopOnNoSpace: false,
        liveExecutionDefault: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.merchantSpaceRecovery = { status: this.controlledMerchantSpaceRecovery.status(), journal: this.merchantSpaceRecoveryJournal.list(100), consolidation: this.controlledBankConsolidation.status() };
    base.context.alpha19LiveGate = this.alpha19LiveGate.status();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha19Runtime, ALPHA19_VERSION };

},
"src/economy/merchant-space-recovery-journal.js": function(require,module,exports){
'use strict';

const MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION = 1;
const MERCHANT_SPACE_RECOVERY_MODE = 'controlled-orchestration-default-off';

const MerchantSpaceRecoveryState = Object.freeze({
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  REOBSERVING: 'REOBSERVING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  BLOCKED: 'BLOCKED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});

const TERMINAL = new Set([
  MerchantSpaceRecoveryState.COMMITTED,
  MerchantSpaceRecoveryState.BLOCKED,
  MerchantSpaceRecoveryState.ABORTED,
  MerchantSpaceRecoveryState.FAILED_SAFE
]);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function storageGet(storage, key) {
  if (!storage) return null;
  if (typeof storage.get === 'function') return storage.get(key);
  if (typeof storage.getItem === 'function') return storage.getItem(key);
  return null;
}
function storageSet(storage, key, value) {
  if (!storage) return false;
  if (typeof storage.set === 'function') return storage.set(key, value) !== false;
  if (typeof storage.setItem === 'function') { storage.setItem(key, value); return true; }
  return false;
}

class MerchantSpaceRecoveryJournal {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = String(options.storageKey || 'aio-v3-alpha19-space-recovery');
    this.capacity = Math.max(16, Math.min(1024, Math.floor(finite(options.capacity, 256))));
    this.leaseMs = Math.max(5000, Math.min(10 * 60 * 1000, finite(options.leaseMs, 60000)));
    this.failureWindowMs = Math.max(10000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.circuitCooldownMs = Math.max(10000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.operations = new Map();
    this.reservations = new Map();
    this.sequence = 0;
    this.failures = [];
    this.circuit = null;
    this.lastSavedAt = null;
    this.stats = {
      planned: 0,
      rejected: 0,
      committed: 0,
      blocked: 0,
      aborted: 0,
      failedSafe: 0,
      expired: 0,
      reconciled: 0,
      capacityEvictions: 0,
      saveErrors: 0,
      loadErrors: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'merchant-space-recovery', event, severity, reason, data });
    }
  }

  _id() {
    this.sequence += 1;
    return `space-${this.now().toString(36)}-${this.sequence.toString(36)}`;
  }

  _reservationKey(request = {}) {
    const character = String(request.character || '').trim();
    const index = Number(request.index);
    if (character && Number.isInteger(index) && index >= 0) return `${character}:${index}`;
    const item = String(request.item || request.name || '').trim();
    return `${character || 'unknown'}:capacity:${item || 'generic'}`;
  }

  _pruneFailures(now = this.now()) {
    this.failures = this.failures.filter((row) => now - finite(row.at) <= this.failureWindowMs);
    if (this.circuit && finite(this.circuit.openUntil) <= now) this.circuit = null;
    return this.failures;
  }

  breaker() {
    const now = this.now();
    this._pruneFailures(now);
    return {
      open: !!(this.circuit && this.circuit.openUntil > now),
      openUntil: this.circuit ? this.circuit.openUntil : null,
      reason: this.circuit ? this.circuit.reason : null,
      failuresInWindow: this.failures.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  noteFailure(reason = 'SPACE_RECOVERY_FAILURE') {
    const now = this.now();
    this._pruneFailures(now);
    this.failures.push({ at: now, reason: String(reason || 'SPACE_RECOVERY_FAILURE') });
    if (this.failures.length >= this.failureThreshold) {
      this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'FAILURE_BUDGET_EXHAUSTED') };
      this._event('SPACE_RECOVERY_CIRCUIT_OPENED', 'warn', this.circuit.reason, { failures: this.failures.length, openUntil: this.circuit.openUntil });
    }
    this.save();
    return this.breaker();
  }

  noteSuccess() {
    this.failures = [];
    this.circuit = null;
    this.save();
    return this.breaker();
  }

  _release(row) {
    if (row && row.reservationKey && this.reservations.get(row.reservationKey) === row.id) this.reservations.delete(row.reservationKey);
  }

  _evictIfNeeded() {
    if (this.operations.size < this.capacity) return;
    const candidate = [...this.operations.values()]
      .filter((row) => TERMINAL.has(row.state))
      .sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt))[0];
    if (!candidate) return;
    this.operations.delete(candidate.id);
    this.stats.capacityEvictions += 1;
  }

  plan(request = {}, plan = null) {
    if (this.breaker().open) return this._reject('SPACE_RECOVERY_CIRCUIT_OPEN');
    if (!plan || plan.planned !== true || !plan.action) return this._reject('SPACE_RECOVERY_PLAN_REQUIRED');
    const character = String(request.character || '').trim();
    if (!character) return this._reject('SPACE_RECOVERY_CHARACTER_REQUIRED');
    const reservationKey = this._reservationKey(request);
    const existing = this.reservations.get(reservationKey);
    if (existing) return this._reject('SPACE_RECOVERY_ALREADY_ACTIVE', { operationId: existing });
    this._evictIfNeeded();
    if (this.operations.size >= this.capacity) return this._reject('SPACE_RECOVERY_CAPACITY_EXHAUSTED');
    const now = this.now();
    const row = {
      schemaVersion: MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
      id: this._id(),
      state: MerchantSpaceRecoveryState.RESERVED,
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      reservationKey,
      request: clone(request),
      plan: clone(plan),
      reason: 'SPACE_RECOVERY_RESERVED',
      actionAuthority: false,
      directGameplayActionAccess: false,
      rawActionCount: 0,
      emergencyReclaimCount: 0,
      reobservations: 0,
      restartReconcileRequired: false,
      evidence: []
    };
    this.operations.set(row.id, row);
    this.reservations.set(reservationKey, row.id);
    this.stats.planned += 1;
    this._event('SPACE_RECOVERY_RESERVED', 'info', row.reason, { operationId: row.id, action: plan.action, reservationKey });
    this.save();
    return { accepted: true, operation: clone(row) };
  }

  _reject(reason, data = {}) {
    this.stats.rejected += 1;
    this._event('SPACE_RECOVERY_REJECTED', 'warn', reason, data);
    return { accepted: false, reason: String(reason) };
  }

  transition(id, nextState, reason = null) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    if (![MerchantSpaceRecoveryState.EXECUTING, MerchantSpaceRecoveryState.REOBSERVING].includes(nextState)) return false;
    row.state = nextState;
    row.reason = reason || nextState;
    row.updatedAt = this.now();
    this.save();
    return true;
  }

  addEvidence(id, kind, data = {}, rawActions = 0) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    const count = Math.max(0, Math.floor(finite(rawActions, 0)));
    row.rawActionCount += count;
    row.evidence.push({ at: this.now(), kind: String(kind || 'EVIDENCE'), data: clone(data), rawActions: count });
    row.updatedAt = this.now();
    this.save();
    return true;
  }

  noteReobservation(id, observation, plan = null) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.reobservations += 1;
    row.updatedAt = this.now();
    row.evidence.push({ at: this.now(), kind: 'REOBSERVATION', data: { observation: clone(observation), plan: clone(plan) }, rawActions: 0 });
    this.save();
    return true;
  }

  noteEmergencyReclaim(id) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.emergencyReclaimCount += 1;
    row.updatedAt = this.now();
    this.save();
    return true;
  }

  _terminal(id, state, reason, evidence = {}) {
    const row = this.operations.get(String(id));
    if (!row || TERMINAL.has(row.state)) return false;
    row.state = state;
    row.reason = String(reason || state);
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    row.finalEvidence = clone(evidence);
    this._release(row);
    if (state === MerchantSpaceRecoveryState.COMMITTED) {
      this.stats.committed += 1;
      this.noteSuccess();
    } else if (state === MerchantSpaceRecoveryState.BLOCKED) {
      this.stats.blocked += 1;
    } else if (state === MerchantSpaceRecoveryState.ABORTED) {
      this.stats.aborted += 1;
    } else if (state === MerchantSpaceRecoveryState.FAILED_SAFE) {
      this.stats.failedSafe += 1;
      this.noteFailure(row.reason);
    }
    this.save();
    this._event('SPACE_RECOVERY_TERMINAL', state === MerchantSpaceRecoveryState.FAILED_SAFE ? 'error' : state === MerchantSpaceRecoveryState.BLOCKED ? 'warn' : 'info', row.reason, { operationId: row.id, state, rawActionCount: row.rawActionCount, emergencyReclaimCount: row.emergencyReclaimCount });
    return true;
  }

  markCommitted(id, reason = 'SPACE_RECOVERY_VERIFIED_COMMIT', evidence = {}) { return this._terminal(id, MerchantSpaceRecoveryState.COMMITTED, reason, evidence); }
  markBlocked(id, reason = 'SPACE_RECOVERY_BLOCKED', evidence = {}) { return this._terminal(id, MerchantSpaceRecoveryState.BLOCKED, reason, evidence); }
  markFailedSafe(id, reason = 'SPACE_RECOVERY_FAILED_SAFE', evidence = {}) { return this._terminal(id, MerchantSpaceRecoveryState.FAILED_SAFE, reason, evidence); }
  cancel(id, reason = 'SPACE_RECOVERY_CANCELLED') { return this._terminal(id, MerchantSpaceRecoveryState.ABORTED, reason, {}); }

  reconcile(id) {
    const row = this.operations.get(String(id));
    if (!row) return { reconciled: false, reason: 'SPACE_RECOVERY_NOT_FOUND' };
    if (row.state !== MerchantSpaceRecoveryState.RECOVERING) return { reconciled: false, reason: 'SPACE_RECOVERY_NOT_RECOVERING', operation: clone(row) };
    row.state = MerchantSpaceRecoveryState.ABORTED;
    row.reason = 'RESTART_REOBSERVE_AND_REPLAN_REQUIRED_NO_BLIND_RETRY';
    row.updatedAt = this.now();
    row.leaseExpiresAt = null;
    row.restartReconcileRequired = false;
    this._release(row);
    this.stats.reconciled += 1;
    this.stats.aborted += 1;
    this.save();
    this._event('SPACE_RECOVERY_RESTART_RECONCILED', 'warn', row.reason, { operationId: row.id, rawActionCount: row.rawActionCount });
    return { reconciled: true, operation: clone(row) };
  }

  tick() {
    const now = this.now();
    let expired = 0;
    for (const row of this.operations.values()) {
      if (TERMINAL.has(row.state) || row.state === MerchantSpaceRecoveryState.RECOVERING) continue;
      if (row.leaseExpiresAt != null && now > finite(row.leaseExpiresAt)) {
        row.state = MerchantSpaceRecoveryState.ABORTED;
        row.reason = 'SPACE_RECOVERY_LEASE_EXPIRED';
        row.updatedAt = now;
        row.leaseExpiresAt = null;
        this._release(row);
        this.stats.expired += 1;
        this.stats.aborted += 1;
        expired += 1;
      }
    }
    this._pruneFailures(now);
    if (expired) this.save();
    return { expired };
  }

  get(id) {
    const row = this.operations.get(String(id));
    return row ? clone(row) : null;
  }

  list(limit = 100) {
    const rows = [...this.operations.values()].sort((a, b) => finite(a.createdAt) - finite(b.createdAt));
    const n = Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))));
    return rows.slice(rows.length - n).map(clone);
  }

  save() {
    if (!this.storage) return false;
    try {
      const payload = JSON.stringify({
        schemaVersion: MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
        savedAt: this.now(),
        sequence: this.sequence,
        operations: this.list(this.capacity),
        failures: clone(this.failures),
        circuit: clone(this.circuit)
      });
      const ok = storageSet(this.storage, this.storageKey, payload);
      if (ok) this.lastSavedAt = this.now();
      return ok;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('SPACE_RECOVERY_SAVE_FAILED', 'error', 'PERSISTENCE_WRITE_FAILED', { message: String(error && error.message || error) });
      return false;
    }
  }

  load() {
    this.operations.clear();
    this.reservations.clear();
    if (!this.storage) return false;
    try {
      const raw = storageGet(this.storage, this.storageKey);
      if (!raw) return false;
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!payload || payload.schemaVersion !== MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION || !Array.isArray(payload.operations)) throw new Error('UNSUPPORTED_SPACE_RECOVERY_SCHEMA');
      this.sequence = Math.max(0, Math.floor(finite(payload.sequence, 0)));
      for (const candidate of payload.operations.slice(-this.capacity)) {
        if (!candidate || !candidate.id) continue;
        const row = clone(candidate);
        if (!TERMINAL.has(row.state)) {
          row.state = MerchantSpaceRecoveryState.RECOVERING;
          row.reason = 'RESTART_RECONCILE_REQUIRED';
          row.restartReconcileRequired = true;
          row.leaseExpiresAt = null;
          if (row.reservationKey) this.reservations.set(row.reservationKey, row.id);
        }
        this.operations.set(row.id, row);
      }
      this.failures = Array.isArray(payload.failures) ? clone(payload.failures) : [];
      this.circuit = payload.circuit ? clone(payload.circuit) : null;
      this._event('SPACE_RECOVERY_STATE_LOADED', 'info', null, { operations: this.operations.size, recovering: [...this.operations.values()].filter((row) => row.state === MerchantSpaceRecoveryState.RECOVERING).length });
      return true;
    } catch (error) {
      this.operations.clear();
      this.reservations.clear();
      this.failures = [];
      this.circuit = null;
      this.stats.loadErrors += 1;
      this._event('SPACE_RECOVERY_LOAD_FAILED', 'error', 'PERSISTENCE_CORRUPT_FAIL_CLOSED', { message: String(error && error.message || error) });
      return false;
    }
  }

  status() {
    const rows = [...this.operations.values()];
    const states = {};
    for (const state of Object.values(MerchantSpaceRecoveryState)) states[state] = rows.filter((row) => row.state === state).length;
    return {
      schemaVersion: MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
      mode: MERCHANT_SPACE_RECOVERY_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      defaultEnabled: false,
      leaseMs: this.leaseMs,
      capacity: this.capacity,
      operations: rows.length,
      active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== MerchantSpaceRecoveryState.RECOVERING).length,
      recovering: states.RECOVERING || 0,
      reservations: this.reservations.size,
      states,
      breaker: this.breaker(),
      lastSavedAt: this.lastSavedAt,
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  MerchantSpaceRecoveryJournal,
  MERCHANT_SPACE_RECOVERY_SCHEMA_VERSION,
  MERCHANT_SPACE_RECOVERY_MODE,
  MerchantSpaceRecoveryState
};

},
"src/economy/controlled-bank-consolidation-executor.js": function(require,module,exports){
'use strict';

const CONTROLLED_BANK_CONSOLIDATION_MODE = 'controlled-live-default-off';
const CONTROLLED_BANK_CONSOLIDATION_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function snap(item) {
  if (!item || !item.name) return null;
  return {
    name: String(item.name),
    level: Math.max(0, Math.floor(finite(item.level, 0))),
    q: Math.max(1, Math.floor(finite(item.q, 1))),
    locked: item.l === true || item.locked === true,
    special: !!(item.p || item.special)
  };
}
function sameIdentity(a, b) {
  return !!a && !!b && a.name === b.name && a.level === b.level;
}
function identityQuantity(items, name, level) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const row = snap(item);
    return row && row.name === name && row.level === level ? sum + row.q : sum;
  }, 0);
}

class ControlledBankConsolidationExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.getGameData = options.getGameData || (() => ({}));
    this.timeoutMs = Math.max(1000, Math.min(30000, finite(options.timeoutMs, 8000)));
    this.verifyDelayMs = Math.max(0, Math.min(1000, finite(options.verifyDelayMs, 150)));
    this.verifyAttempts = Math.max(1, Math.min(20, Math.floor(finite(options.verifyAttempts, 10))));
    this.enabled = false;
    this.busy = false;
    this.lastAction = null;
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, rawCalls: 0, verificationRetries: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-bank-consolidation', event, severity, reason, data });
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== CONTROLLED_BANK_CONSOLIDATION_ACK) {
      this.enabled = false;
      this._event('CONTROLLED_BANK_CONSOLIDATION_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this._event('CONTROLLED_BANK_CONSOLIDATION_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED', { enabled: this.enabled });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._event('CONTROLLED_BANK_CONSOLIDATION_DISABLED', 'warn', reason);
    return this.status();
  }

  _inCombat() {
    const character = this.root && this.root.character || {};
    if (character.target) return true;
    const entities = this.root && ((this.root.parent && this.root.parent.entities) || this.root.entities) || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _inventoryWorkspace(character) {
    const items = Array.isArray(character.items) ? character.items : [];
    const reported = Number(character.isize);
    const size = Number.isFinite(reported) ? Math.max(0, Math.floor(reported)) : items.length;
    for (let i = 0; i < size; i += 1) if (!items[i]) return i;
    return -1;
  }

  _preflight(plan) {
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_BANK_CONSOLIDATION_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_BANK_CONSOLIDATION_BUSY' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this.root && this.root.character;
    if (!character || String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
    if (!plan || plan.action !== 'CONSOLIDATE_BANK_STACKS' || !plan.pack || !plan.move) return { ok: false, reason: 'CONSOLIDATION_PLAN_REQUIRED' };
    if (typeof this.root.bank_retrieve !== 'function' || typeof this.root.bank_store !== 'function') return { ok: false, reason: 'OFFICIAL_BANK_API_UNAVAILABLE' };
    const pack = character.bank[plan.pack];
    if (!Array.isArray(pack)) return { ok: false, reason: 'BANK_PACK_NOT_UNLOCKED' };
    const fromIndex = Number(plan.move.fromIndex);
    const toIndex = Number(plan.move.toIndex);
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || fromIndex >= pack.length || toIndex >= pack.length) return { ok: false, reason: 'CONSOLIDATION_INDEX_INVALID' };
    const source = snap(pack[fromIndex]);
    const target = snap(pack[toIndex]);
    if (!source || !target || !sameIdentity(source, target)) return { ok: false, reason: 'CONSOLIDATION_IDENTITY_CHANGED' };
    if (source.locked || source.special || target.locked || target.special) return { ok: false, reason: 'CONSOLIDATION_ITEM_PROTECTED' };
    if (source.name !== String(plan.move.name || '') || source.level !== Math.max(0, Math.floor(finite(plan.move.level, 0)))) return { ok: false, reason: 'CONSOLIDATION_PLAN_STALE' };
    const gameData = this.getGameData() || {};
    const meta = gameData.items && gameData.items[source.name];
    const stackMax = Math.max(1, Math.floor(finite(meta && meta.s, 1)));
    if (!meta || stackMax <= 1) return { ok: false, reason: 'CONSOLIDATION_STACK_METADATA_UNAVAILABLE' };
    if (source.q + target.q > stackMax) return { ok: false, reason: 'CONSOLIDATION_STACK_OVERFLOW' };
    const workspace = this._inventoryWorkspace(character);
    if (workspace < 0) return { ok: false, reason: 'NO_INVENTORY_WORKSPACE' };
    const bankPacks = this.root.bank_packs || (this.root.parent && this.root.parent.bank_packs) || {};
    const catalog = bankPacks && bankPacks[plan.pack];
    const owningMap = Array.isArray(catalog) ? catalog[0] : catalog && (catalog.map || catalog.place);
    if (owningMap && String(owningMap) !== String(character.map || '')) return { ok: false, reason: 'WRONG_BANK_FLOOR' };
    return { ok: true, character, pack, fromIndex, toIndex, source, target, workspace, stackMax };
  }

  _timeout(promise, label) {
    let timer;
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    const clearTimer = this.root && this.root.clearTimeout || clearTimeout;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error(`${label}_TIMEOUT`)), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }

  _sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    return new Promise((resolve) => setTimer(resolve, ms));
  }

  async _eventually(check) {
    let result = check();
    for (let attempt = 1; !result.ok && attempt < this.verifyAttempts; attempt += 1) {
      this.stats.verificationRetries += 1;
      await this._sleep(this.verifyDelayMs);
      result = check();
    }
    return result;
  }

  _afterRetrieve(check, beforeTotal) {
    const character = this.root.character;
    const pack = character.bank && character.bank[check.packName];
    const inventoryItem = snap(character.items && character.items[check.workspace]);
    const sourceAfter = Array.isArray(pack) ? snap(pack[check.fromIndex]) : null;
    const bankTotal = Array.isArray(pack) ? identityQuantity(pack, check.name, check.level) : -1;
    const inventoryTotal = identityQuantity(character.items, check.name, check.level);
    return {
      ok: !sourceAfter && inventoryItem && inventoryItem.name === check.name && inventoryItem.level === check.level && inventoryItem.q === check.sourceQ && bankTotal + inventoryTotal === beforeTotal,
      sourceAfter,
      inventoryItem,
      bankTotal,
      inventoryTotal,
      beforeTotal
    };
  }

  _afterStore(check, beforeTotal) {
    const character = this.root.character;
    const pack = character.bank && character.bank[check.packName];
    const sourceAfter = Array.isArray(pack) ? snap(pack[check.fromIndex]) : null;
    const targetAfter = Array.isArray(pack) ? snap(pack[check.toIndex]) : null;
    const workspaceAfter = snap(character.items && character.items[check.workspace]);
    const bankTotal = Array.isArray(pack) ? identityQuantity(pack, check.name, check.level) : -1;
    const inventoryTotal = identityQuantity(character.items, check.name, check.level);
    return {
      ok: !sourceAfter && targetAfter && targetAfter.name === check.name && targetAfter.level === check.level && targetAfter.q === check.combinedQ && !workspaceAfter && bankTotal + inventoryTotal === beforeTotal,
      sourceAfter,
      targetAfter,
      workspaceAfter,
      bankTotal,
      inventoryTotal,
      beforeTotal
    };
  }

  async execute(plan) {
    const preflight = this._preflight(plan);
    if (!preflight.ok) {
      this.stats.rejected += 1;
      this._event('CONTROLLED_BANK_CONSOLIDATION_REJECTED', 'warn', preflight.reason);
      return { executed: false, committed: false, reason: preflight.reason, rawActions: 0 };
    }
    this.busy = true;
    this.stats.attempts += 1;
    const name = preflight.source.name;
    const level = preflight.source.level;
    const beforeTotal = identityQuantity(preflight.pack, name, level) + identityQuantity(preflight.character.items, name, level);
    const proof = {
      packName: String(plan.pack),
      fromIndex: preflight.fromIndex,
      toIndex: preflight.toIndex,
      workspace: preflight.workspace,
      name,
      level,
      sourceQ: preflight.source.q,
      targetQ: preflight.target.q,
      combinedQ: preflight.source.q + preflight.target.q
    };
    let rawActions = 0;
    try {
      this._event('CONTROLLED_BANK_CONSOLIDATION_STARTED', 'warn', 'CONTROLLED_CANARY', clone(proof));
      const retrieveResponse = await this._timeout(this.root.bank_retrieve(proof.packName, proof.fromIndex, proof.workspace), 'BANK_RETRIEVE');
      rawActions += 1;
      this.stats.rawCalls += 1;
      if (retrieveResponse && retrieveResponse.failed === true) throw new Error(String(retrieveResponse.reason || 'BANK_RETRIEVE_FAILED'));
      const retrieved = await this._eventually(() => this._afterRetrieve(proof, beforeTotal));
      if (!retrieved.ok) {
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason: 'RETRIEVE_STATE_UNCONFIRMED', rawActions, proof: clone(proof), verification: clone(retrieved) };
        this._event('CONTROLLED_BANK_CONSOLIDATION_FAILED_SAFE', 'error', this.lastAction.reason, this.lastAction);
        return { executed: true, committed: false, reason: this.lastAction.reason, rawActions, verification: retrieved };
      }
      const storeResponse = await this._timeout(this.root.bank_store(proof.workspace, proof.packName, proof.toIndex), 'BANK_STORE');
      rawActions += 1;
      this.stats.rawCalls += 1;
      if (storeResponse && storeResponse.failed === true) throw new Error(String(storeResponse.reason || 'BANK_STORE_FAILED'));
      const stored = await this._eventually(() => this._afterStore(proof, beforeTotal));
      if (!stored.ok) {
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason: 'CONSOLIDATION_STATE_UNCONFIRMED', rawActions, proof: clone(proof), verification: clone(stored) };
        this._event('CONTROLLED_BANK_CONSOLIDATION_FAILED_SAFE', 'error', this.lastAction.reason, this.lastAction);
        return { executed: true, committed: false, reason: this.lastAction.reason, rawActions, verification: stored };
      }
      this.stats.committed += 1;
      this.lastAction = { at: this.now(), result: 'COMMITTED', reason: 'VERIFIED_CONSOLIDATION', rawActions, proof: clone(proof), verification: clone(stored) };
      this._event('CONTROLLED_BANK_CONSOLIDATION_COMMITTED', 'info', this.lastAction.reason, this.lastAction);
      return { executed: true, committed: true, reason: this.lastAction.reason, rawActions, verification: stored, proof: clone(proof) };
    } catch (error) {
      this.stats.failedSafe += 1;
      const reason = String(error && error.message || error || 'CONSOLIDATION_FAILED_SAFE');
      this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason, rawActions, proof: clone(proof) };
      this._event('CONTROLLED_BANK_CONSOLIDATION_FAILED_SAFE', 'error', reason, this.lastAction);
      return { executed: rawActions > 0, committed: false, reason, rawActions, proof: clone(proof) };
    } finally {
      this.busy = false;
    }
  }

  status() {
    return {
      mode: CONTROLLED_BANK_CONSOLIDATION_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      explicitAckRequired: CONTROLLED_BANK_CONSOLIDATION_ACK,
      rawActionAttemptLimit: 2,
      strategy: 'bank_retrieve-verify-targeted-bank_store-verify',
      busy: this.busy,
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  ControlledBankConsolidationExecutor,
  CONTROLLED_BANK_CONSOLIDATION_MODE,
  CONTROLLED_BANK_CONSOLIDATION_ACK
};

},
"src/economy/controlled-merchant-space-recovery-hardened.js": function(require,module,exports){
'use strict';

const {
  ControlledMerchantSpaceRecovery,
  CONTROLLED_SPACE_RECOVERY_MODE,
  CONTROLLED_SPACE_RECOVERY_ACK,
  MAX_RAW_ACTIONS_PER_OPERATION
} = require('./controlled-merchant-space-recovery');

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

class HardenedControlledMerchantSpaceRecovery extends ControlledMerchantSpaceRecovery {
  constructor(options = {}) {
    super(options);
    this.allowExpansionPurchase = false;
    this.allowEmergencyReclaim = false;
  }

  configure(config = {}) {
    const status = super.configure(config);
    if (status && status.enabled === true) {
      this.allowExpansionPurchase = config.allowExpansionPurchase === true;
      this.allowEmergencyReclaim = config.allowEmergencyReclaim === true;
    } else {
      this.allowExpansionPurchase = false;
      this.allowEmergencyReclaim = false;
    }
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.allowExpansionPurchase = false;
    this.allowEmergencyReclaim = false;
    super.disable(reason);
    return this.status();
  }

  async _expand(operation, plan, observation) {
    if (this.allowExpansionPurchase !== true) {
      return { ok: false, blocked: true, reason: 'EXPANSION_PURCHASE_NOT_AUTHORIZED', rawActions: 0 };
    }
    return super._expand(operation, plan, observation);
  }

  _freshReclaimPlan(operation, originalPlan, observation) {
    if (originalPlan && originalPlan.reason === 'ALPHA19_MINIMAL_RECLAIM_FALLBACK') {
      // Re-evaluate the same executable Alpha.19 authority scope. A cross-floor
      // expansion or consolidation without inventory workspace must not become
      // Travel/undocumented authority merely because we are revalidating SELL.
      return this._fallbackPlan(operation.request, observation, { skipExpansion: true });
    }
    return this.manager.planSpace(operation.request, this._context(observation, operation.request));
  }

  async _reclaim(operation, plan) {
    if (this.allowEmergencyReclaim !== true) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_NOT_AUTHORIZED', rawActions: 0 };
    }
    if (operation.emergencyReclaimCount >= 1 || plan.exactlyOneUnit !== true || plan.bulkSellForbidden !== true || !plan.candidate || Number(plan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_BOUNDARY_INVALID', rawActions: 0 };
    }

    const freshObservation = this.observeBank();
    const freshPlan = this._freshReclaimPlan(operation, plan, freshObservation);
    this.journal.noteReobservation(operation.id, freshObservation, freshPlan);
    if (freshPlan.action !== 'EMERGENCY_RECLAIM' || !this._sameCandidate(plan.candidate, freshPlan.candidate) || Number(freshPlan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_FRESH_PLAN_CHANGED', rawActions: 0, freshPlan };
    }

    const candidate = freshPlan.candidate;
    const planned = this.transactionEngine.plan({
      type: 'SELL',
      character: candidate.character,
      index: candidate.index,
      quantity: 1,
      metadata: {
        alpha19SpaceRecovery: operation.id,
        emergencyReclaim: true,
        exactlyOneUnit: true,
        protectedMinimumReserve: candidate.protectedMinimumReserve
      }
    }, { ledger: this.ledger });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `RECLAIM_TRANSACTION_${planned.reason}`, rawActions: 0 };

    this.controlledMerchant.configure({ enabled: true, ack: 'CONTROLLED_CANARY', sell: true, bank: false });
    try {
      const result = await this.controlledMerchant.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };

      this.journal.noteEmergencyReclaim(operation.id);
      this.stats.emergencyReclaims += 1;
      const afterObservation = this.observeBank();
      const afterPlan = this.manager.planSpace(operation.request, this._context(afterObservation, operation.request));
      this.journal.noteReobservation(operation.id, afterObservation, afterPlan);
      return {
        ok: true,
        reclaim: true,
        reason: 'EMERGENCY_RECLAIM_ONE_UNIT_COMMITTED',
        rawActions: 1,
        transactionId: planned.transaction.id,
        result,
        afterObservation,
        afterPlan
      };
    } finally {
      this.controlledMerchant.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  _finishBlocked(id, reason, evidence = {}) {
    const before = this.journal.get(id);
    const didExecute = !!(before && finite(before.rawActionCount, 0) > 0);
    this.journal.markBlocked(id, reason, { ...JSON.parse(JSON.stringify(evidence || {})), globalBotStop: false });
    this.stats.blocked += 1;
    this.lastResult = {
      executed: didExecute,
      committed: false,
      blocked: true,
      reason,
      operation: this.journal.get(id)
    };
    return JSON.parse(JSON.stringify(this.lastResult));
  }

  _finishFailedSafe(id, reason, evidence = {}) {
    const before = this.journal.get(id);
    const didExecute = !!(before && finite(before.rawActionCount, 0) > 0);
    this.journal.markFailedSafe(id, reason, evidence);
    this.stats.failedSafe += 1;
    this.lastResult = {
      executed: didExecute,
      committed: false,
      failedSafe: true,
      reason,
      operation: this.journal.get(id)
    };
    return JSON.parse(JSON.stringify(this.lastResult));
  }

  status() {
    const base = super.status();
    return {
      ...base,
      expansionPurchaseAuthority: this.enabled && this.allowExpansionPurchase === true,
      emergencyReclaimAuthority: this.enabled && this.allowEmergencyReclaim === true
    };
  }
}

module.exports = {
  HardenedControlledMerchantSpaceRecovery,
  CONTROLLED_SPACE_RECOVERY_MODE,
  CONTROLLED_SPACE_RECOVERY_ACK,
  MAX_RAW_ACTIONS_PER_OPERATION
};

},
"src/economy/controlled-merchant-space-recovery.js": function(require,module,exports){
'use strict';

const { BankSpaceAction } = require('./bank-capacity-manager');

const CONTROLLED_SPACE_RECOVERY_MODE = 'controlled-live-default-off';
const CONTROLLED_SPACE_RECOVERY_ACK = 'ALPHA19_SPACE_RECOVERY';
const CHILD_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);
const MAX_RAW_ACTIONS_PER_OPERATION = 3;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

class ControlledMerchantSpaceRecovery {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.journal = options.journal;
    this.manager = options.manager;
    this.transactionEngine = options.transactionEngine;
    this.ledger = options.ledger;
    this.controlledMerchant = options.controlledMerchant;
    this.expansionTransactions = options.expansionTransactions;
    this.controlledExpansion = options.controlledExpansion;
    this.controlledConsolidation = options.controlledConsolidation;
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.observeBank = options.observeBank || (() => null);
    this.getGameData = options.getGameData || (() => ({}));
    this.getContentDrift = options.getContentDrift || (() => null);
    this.enabled = false;
    this.busy = false;
    this.lastResult = null;
    this.stats = { plans: 0, attempts: 0, committed: 0, blocked: 0, failedSafe: 0, rejected: 0, emergencyReclaims: 0, expansionExecutions: 0, consolidationExecutions: 0, bankDeposits: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-space-recovery', event, severity, reason, data });
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== CONTROLLED_SPACE_RECOVERY_ACK) {
      this.enabled = false;
      this._event('SPACE_RECOVERY_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this._event('SPACE_RECOVERY_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_ALPHA19_ENABLE' : 'DISABLED', { enabled: this.enabled });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._disableChildren(`SPACE_RECOVERY_${reason}`);
    this._event('SPACE_RECOVERY_DISABLED', 'warn', reason);
    return this.status();
  }

  _liveCharacter() {
    return this.root && this.root.character || null;
  }

  _inCombat() {
    const character = this._liveCharacter() || {};
    if (character.target) return true;
    const entities = this.root && ((this.root.parent && this.root.parent.entities) || this.root.entities) || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _preflight(operation) {
    if (!operation) return { ok: false, reason: 'SPACE_RECOVERY_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'SPACE_RECOVERY_DISABLED' };
    if (this.busy) return { ok: false, reason: 'SPACE_RECOVERY_BUSY' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (operation.state !== 'RESERVED') return { ok: false, reason: 'SPACE_RECOVERY_NOT_RESERVED' };
    if (operation.leaseExpiresAt != null && this.now() > finite(operation.leaseExpiresAt)) return { ok: false, reason: 'SPACE_RECOVERY_LEASE_EXPIRED' };
    if (this.journal && this.journal.breaker().open) return { ok: false, reason: 'SPACE_RECOVERY_CIRCUIT_OPEN' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this._liveCharacter();
    if (!character || String(character.name || '') !== String(operation.request.character || '')) return { ok: false, reason: 'CONTROLLED_CHARACTER_MISMATCH' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    const childStates = this._childStates();
    if (childStates.merchant || childStates.expansion || childStates.consolidation) return { ok: false, reason: 'CHILD_EXECUTOR_ALREADY_ENABLED', childStates };
    return { ok: true, character, supervisor };
  }

  _childStates() {
    return {
      merchant: !!(this.controlledMerchant && this.controlledMerchant.status && this.controlledMerchant.status().enabled),
      expansion: !!(this.controlledExpansion && this.controlledExpansion.status && this.controlledExpansion.status().enabled),
      consolidation: !!(this.controlledConsolidation && this.controlledConsolidation.status && this.controlledConsolidation.status().enabled)
    };
  }

  _disableChildren(reason) {
    try { if (this.controlledMerchant && typeof this.controlledMerchant.disable === 'function') this.controlledMerchant.disable(reason); } catch (_) {}
    try { if (this.controlledExpansion && typeof this.controlledExpansion.disable === 'function') this.controlledExpansion.disable(reason); } catch (_) {}
    try { if (this.controlledConsolidation && typeof this.controlledConsolidation.disable === 'function') this.controlledConsolidation.disable(reason); } catch (_) {}
  }

  _context(observation, request) {
    const character = this._liveCharacter() || {};
    return {
      observation,
      character,
      bankPacks: this.root.bank_packs || (this.root.parent && this.root.parent.bank_packs) || {},
      gameData: this.getGameData() || {},
      contentDrift: this.getContentDrift(),
      ledger: this.ledger,
      minimumReserves: request.minimumReserves || {},
      gold: Math.max(0, finite(character.gold, 0)),
      shells: Math.max(0, finite(character.shells, 0)),
      currentMap: character.map || null
    };
  }

  _normalizeRequest(request = {}) {
    const character = this._liveCharacter() || {};
    const index = request.index == null ? null : Number(request.index);
    const liveItem = Number.isInteger(index) && Array.isArray(character.items) ? character.items[index] : null;
    return {
      ...clone(request),
      character: String(request.character || character.name || ''),
      index: Number.isInteger(index) ? index : null,
      item: String(request.item || request.name || (liveItem && liveItem.name) || ''),
      name: String(request.item || request.name || (liveItem && liveItem.name) || ''),
      level: Math.max(0, Math.floor(finite(request.level, liveItem && liveItem.level || 0))),
      quantity: Math.max(1, Math.floor(finite(request.quantity, liveItem && liveItem.q || 1))),
      depositBlocked: request.depositBlocked !== false,
      minimumReserves: request.minimumReserves && typeof request.minimumReserves === 'object' ? clone(request.minimumReserves) : {}
    };
  }

  plan(request = {}) {
    const normalized = this._normalizeRequest(request);
    if (!normalized.character) return { accepted: false, reason: 'SPACE_RECOVERY_CHARACTER_REQUIRED' };
    const observation = this.observeBank();
    if (!observation) return { accepted: false, reason: 'BANK_OBSERVATION_UNAVAILABLE' };
    const plan = this.manager.planSpace(normalized, this._context(observation, normalized));
    const reserved = this.journal.plan(normalized, plan);
    if (reserved.accepted) this.stats.plans += 1;
    return { ...reserved, plan: clone(plan), observation: clone(observation) };
  }

  _fallbackPlan(request, observation, options = {}) {
    const context = this._context(observation, request);
    if (!options.skipExpansion && this.manager && typeof this.manager._expansion === 'function') {
      const expansion = this.manager._expansion(observation, context);
      if (expansion && !expansion.requiresTravel) return { at: this.now(), planned: true, reason: 'ALPHA19_EXECUTABLE_EXPANSION_FALLBACK', ...expansion };
    }
    if (this.manager && typeof this.manager._reclaim === 'function') {
      const candidate = this.manager._reclaim(context);
      if (candidate) return {
        at: this.now(), planned: true, reason: 'ALPHA19_MINIMAL_RECLAIM_FALLBACK', action: BankSpaceAction.EMERGENCY_RECLAIM,
        candidate, destructive: true, exactlyOneUnit: true, reobserveRequiredBeforeNextDecision: true, bulkSellForbidden: true, executionAuthority: false
      };
    }
    return {
      at: this.now(), planned: true, reason: 'NO_EXECUTABLE_SAFE_SPACE_RECOVERY_ACTION', action: BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK,
      blockInventoryProducingWork: true, globalBotStop: false,
      independentSubsystemsMayContinue: ['combat', 'party', 'monitoring', 'travel-without-loot', 'safe-non-inventory-work'], executionAuthority: false
    };
  }

  _sourceItem(request) {
    const character = this._liveCharacter() || {};
    const index = Number(request.index);
    if (!Number.isInteger(index) || index < 0 || !Array.isArray(character.items) || !character.items[index]) return null;
    return character.items[index];
  }

  async _deposit(operation, plan) {
    const request = operation.request;
    const source = this._sourceItem(request);
    if (!source) return { ok: false, blocked: true, reason: 'DEPOSIT_SOURCE_ITEM_UNAVAILABLE', rawActions: 0 };
    const quantity = Math.max(1, Math.floor(finite(source.q, 1)));
    const planned = this.transactionEngine.plan({
      type: 'BANK', character: request.character, index: request.index, quantity,
      metadata: { alpha19SpaceRecovery: operation.id, plannedBankAction: plan.action, plannedPack: plan.pack || null, plannedSlot: plan.slot == null ? null : plan.slot }
    }, { ledger: this.ledger });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `BANK_TRANSACTION_${planned.reason}`, rawActions: 0 };
    this.controlledMerchant.configure({ enabled: true, ack: CHILD_ACK, bank: true, sell: false });
    try {
      const result = await this.controlledMerchant.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `BANK_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `BANK_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };
      this.stats.bankDeposits += 1;
      return { ok: true, reason: 'BANK_DEPOSIT_COMMITTED', rawActions: 1, transactionId: planned.transaction.id, result };
    } finally {
      this.controlledMerchant.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  async _expand(operation, plan, observation) {
    if (plan.requiresTravel) return { ok: false, blocked: true, reason: 'EXPANSION_REQUIRES_TRAVEL_NOT_AUTHORIZED', rawActions: 0 };
    const planned = this.expansionTransactions.plan(plan, { observation });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `EXPANSION_TRANSACTION_${planned.reason}`, rawActions: 0 };
    this.controlledExpansion.configure({ enabled: true, ack: CHILD_ACK });
    try {
      const result = await this.controlledExpansion.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `EXPANSION_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `EXPANSION_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };
      this.stats.expansionExecutions += 1;
      return { ok: true, reason: 'BANK_EXPANSION_COMMITTED', rawActions: 1, transactionId: planned.transaction.id, result };
    } finally {
      this.controlledExpansion.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  async _consolidate(operation, plan) {
    this.controlledConsolidation.configure({ enabled: true, ack: CHILD_ACK });
    try {
      const result = await this.controlledConsolidation.execute(plan);
      if (!result.executed && result.reason === 'NO_INVENTORY_WORKSPACE') return { ok: false, fallback: true, reason: result.reason, rawActions: 0, result };
      if (!result.executed) return { ok: false, blocked: true, reason: `CONSOLIDATION_${result.reason}`, rawActions: 0, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `CONSOLIDATION_${result.reason}`, rawActions: result.rawActions || 1, result };
      this.stats.consolidationExecutions += 1;
      return { ok: true, reason: 'BANK_CONSOLIDATION_COMMITTED', rawActions: result.rawActions || 2, result };
    } finally {
      this.controlledConsolidation.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  _sameCandidate(a, b) {
    if (!a || !b) return false;
    return String(a.character || '') === String(b.character || '') && Number(a.index) === Number(b.index) && String(a.item || '') === String(b.item || '') && Math.max(0, Math.floor(finite(a.level, 0))) === Math.max(0, Math.floor(finite(b.level, 0)));
  }

  async _reclaim(operation, plan) {
    if (operation.emergencyReclaimCount >= 1 || plan.exactlyOneUnit !== true || plan.bulkSellForbidden !== true || !plan.candidate || Number(plan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_BOUNDARY_INVALID', rawActions: 0 };
    }
    const freshObservation = this.observeBank();
    const freshPlan = this.manager.planSpace(operation.request, this._context(freshObservation, operation.request));
    this.journal.noteReobservation(operation.id, freshObservation, freshPlan);
    if (freshPlan.action !== BankSpaceAction.EMERGENCY_RECLAIM || !this._sameCandidate(plan.candidate, freshPlan.candidate) || Number(freshPlan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_FRESH_PLAN_CHANGED', rawActions: 0, freshPlan };
    }
    const candidate = freshPlan.candidate;
    const planned = this.transactionEngine.plan({
      type: 'SELL', character: candidate.character, index: candidate.index, quantity: 1,
      metadata: { alpha19SpaceRecovery: operation.id, emergencyReclaim: true, exactlyOneUnit: true, protectedMinimumReserve: candidate.protectedMinimumReserve }
    }, { ledger: this.ledger });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `RECLAIM_TRANSACTION_${planned.reason}`, rawActions: 0 };
    this.controlledMerchant.configure({ enabled: true, ack: CHILD_ACK, sell: true, bank: false });
    try {
      const result = await this.controlledMerchant.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };
      this.journal.noteEmergencyReclaim(operation.id);
      this.stats.emergencyReclaims += 1;
      const after = this.observeBank();
      const afterPlan = this.manager.planSpace(operation.request, this._context(after, operation.request));
      this.journal.noteReobservation(operation.id, after, afterPlan);
      return { ok: true, reclaim: true, reason: 'EMERGENCY_RECLAIM_ONE_UNIT_COMMITTED', rawActions: 1, transactionId: planned.transaction.id, result, afterObservation: after, afterPlan };
    } finally {
      this.controlledMerchant.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  _rawBudget(operation, additional) {
    return finite(operation.rawActionCount, 0) + Math.max(0, Math.floor(finite(additional, 0))) <= MAX_RAW_ACTIONS_PER_OPERATION;
  }

  _recordChild(operationId, kind, result) {
    const current = this.journal.get(operationId);
    const rawActions = Math.max(0, Math.floor(finite(result && result.rawActions, 0)));
    if (!this._rawBudget(current, rawActions)) return false;
    return this.journal.addEvidence(operationId, kind, result, rawActions);
  }

  _finishBlocked(id, reason, evidence = {}) {
    this.journal.markBlocked(id, reason, { ...clone(evidence), globalBotStop: false });
    this.stats.blocked += 1;
    this.lastResult = { executed: false, committed: false, blocked: true, reason, operation: this.journal.get(id) };
    return clone(this.lastResult);
  }

  _finishFailedSafe(id, reason, evidence = {}) {
    this.journal.markFailedSafe(id, reason, evidence);
    this.stats.failedSafe += 1;
    this.lastResult = { executed: true, committed: false, failedSafe: true, reason, operation: this.journal.get(id) };
    return clone(this.lastResult);
  }

  _finishCommitted(id, reason, evidence = {}) {
    this.journal.markCommitted(id, reason, evidence);
    this.stats.committed += 1;
    this.lastResult = { executed: true, committed: true, reason, operation: this.journal.get(id) };
    return clone(this.lastResult);
  }

  async execute(operationId) {
    let operation = this.journal && this.journal.get(String(operationId));
    const preflight = this._preflight(operation);
    if (!preflight.ok) {
      if (operation && preflight.reason === 'SPACE_RECOVERY_LEASE_EXPIRED') this.journal.cancel(operation.id, preflight.reason);
      this.stats.rejected += 1;
      return { executed: false, committed: false, reason: preflight.reason, childStates: preflight.childStates };
    }
    this.busy = true;
    this.stats.attempts += 1;
    this.journal.transition(operation.id, 'EXECUTING', 'ALPHA19_EXECUTION_STARTED');
    this._event('SPACE_RECOVERY_EXECUTION_STARTED', 'warn', 'ALPHA19_CONTROLLED_SCOPE', { operationId: operation.id, action: operation.plan.action });
    try {
      let plan = clone(operation.plan);
      let observation = this.observeBank();
      this.journal.noteReobservation(operation.id, observation, plan);

      if (plan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK) return this._finishBlocked(operation.id, plan.reason || 'NO_SAFE_SPACE_RECOVERY_ACTION', { plan });

      if (plan.action === BankSpaceAction.CONSOLIDATE_BANK_STACKS) {
        const consolidated = await this._consolidate(operation, plan);
        if (consolidated.fallback) {
          plan = this._fallbackPlan(operation.request, observation, { skipExpansion: false });
          this.journal.addEvidence(operation.id, 'CONSOLIDATION_SKIPPED_NO_WORKSPACE', { fallbackPlan: plan }, 0);
        } else {
          if (!this._recordChild(operation.id, 'CONSOLIDATION', consolidated)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { consolidated });
          if (consolidated.failedSafe) return this._finishFailedSafe(operation.id, consolidated.reason, consolidated);
          if (!consolidated.ok) return this._finishBlocked(operation.id, consolidated.reason, consolidated);
          observation = this.observeBank();
          plan = this.manager.planSpace(operation.request, this._context(observation, operation.request));
          this.journal.noteReobservation(operation.id, observation, plan);
        }
      }

      if (plan.action === BankSpaceAction.EXPAND_BANK_PACK) {
        if (plan.requiresTravel) {
          plan = this._fallbackPlan(operation.request, observation, { skipExpansion: true });
          this.journal.addEvidence(operation.id, 'EXPANSION_SKIPPED_TRAVEL_NOT_AUTHORIZED', { fallbackPlan: plan }, 0);
        } else {
          const expanded = await this._expand(operation, plan, observation);
          if (!this._recordChild(operation.id, 'EXPANSION', expanded)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { expanded });
          if (expanded.failedSafe) return this._finishFailedSafe(operation.id, expanded.reason, expanded);
          if (!expanded.ok) return this._finishBlocked(operation.id, expanded.reason, expanded);
          observation = this.observeBank();
          plan = this.manager.planSpace(operation.request, this._context(observation, operation.request));
          this.journal.noteReobservation(operation.id, observation, plan);
        }
      }

      if ([BankSpaceAction.DEPOSIT_STACK, BankSpaceAction.DEPOSIT_FREE_SLOT].includes(plan.action)) {
        const deposited = await this._deposit(operation, plan);
        if (!this._recordChild(operation.id, 'BANK_DEPOSIT', deposited)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { deposited });
        if (deposited.failedSafe) return this._finishFailedSafe(operation.id, deposited.reason, deposited);
        if (!deposited.ok) return this._finishBlocked(operation.id, deposited.reason, deposited);
        observation = this.observeBank();
        this.journal.noteReobservation(operation.id, observation, null);
        return this._finishCommitted(operation.id, 'SPACE_RECOVERY_DEPOSIT_COMMITTED', { finalObservation: observation, plan });
      }

      if (plan.action === BankSpaceAction.EMERGENCY_RECLAIM) {
        const reclaimed = await this._reclaim(this.journal.get(operation.id), plan);
        if (!this._recordChild(operation.id, 'EMERGENCY_RECLAIM', reclaimed)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { reclaimed });
        if (reclaimed.failedSafe) return this._finishFailedSafe(operation.id, reclaimed.reason, reclaimed);
        if (!reclaimed.ok) return this._finishBlocked(operation.id, reclaimed.reason, reclaimed);
        return this._finishCommitted(operation.id, 'EMERGENCY_RECLAIM_ONE_UNIT_VERIFIED_REOBSERVED', {
          exactlyOneUnit: true,
          bulkSellForbidden: true,
          reobserveRequiredBeforeNextDecision: true,
          afterObservation: reclaimed.afterObservation,
          afterPlan: reclaimed.afterPlan
        });
      }

      if (plan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK) return this._finishBlocked(operation.id, plan.reason || 'NO_SAFE_SPACE_RECOVERY_ACTION', { plan });
      return this._finishBlocked(operation.id, 'UNSUPPORTED_OR_NON_EXECUTABLE_SPACE_RECOVERY_PLAN', { plan });
    } catch (error) {
      return this._finishFailedSafe(operation.id, 'SPACE_RECOVERY_EXCEPTION', { message: String(error && error.message || error) });
    } finally {
      this._disableChildren('ALPHA19_OPERATION_FINALIZE');
      this.busy = false;
    }
  }

  reconcile(operationId) {
    this._disableChildren('ALPHA19_RESTART_RECONCILE');
    return this.journal.reconcile(operationId);
  }

  status() {
    return {
      mode: CONTROLLED_SPACE_RECOVERY_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      directGameplayActionAccess: false,
      explicitAckRequired: CONTROLLED_SPACE_RECOVERY_ACK,
      childAck: CHILD_ACK,
      maxRawActionsPerOperation: MAX_RAW_ACTIONS_PER_OPERATION,
      emergencyReclaimMaxUnitsPerOperation: 1,
      bulkEmergencyReclaimAllowed: false,
      travelAuthority: false,
      shellExpansionAuthority: false,
      busy: this.busy,
      journal: this.journal && this.journal.status ? this.journal.status() : null,
      consolidation: this.controlledConsolidation && this.controlledConsolidation.status ? this.controlledConsolidation.status() : null,
      lastResult: clone(this.lastResult),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  ControlledMerchantSpaceRecovery,
  CONTROLLED_SPACE_RECOVERY_MODE,
  CONTROLLED_SPACE_RECOVERY_ACK,
  MAX_RAW_ACTIONS_PER_OPERATION
};

},
"src/ops/alpha19-combined-live-gate.js": function(require,module,exports){
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

},
"src/autonomy/alpha20-runtime.js": function(require,module,exports){
'use strict';

const { Alpha19Runtime } = require('./alpha19-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { PartyLifecycleStore } = require('../party/lifecycle-store');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_ACK } = require('../party/controlled-lifecycle-coordinator');
const { ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_ACK } = require('../party/controlled-paladin-aura-executor');

const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }

class Alpha20Runtime extends Alpha19Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = RELEASE_VERSION;

    // Legacy Alpha.12 live switches are permanently closed in Alpha.20.
    // Live authority can only be borrowed inside the controlled lifecycle operation.
    this.partyTransitions.setLiveEnabled(false);
    this.auraAutomationEnabled = false;

    this.partyLifecycle = options.partyLifecycle || new PartyLifecycleStore({
      root: this.root,
      storage: options.partyLifecycleStorage || options.storage,
      key: options.partyLifecycleStorageKey,
      now: this.now,
      log: this.log,
      capacity: options.partyLifecycleCapacity,
      minCurrentSamples: options.partyLifecycleMinCurrentSamples,
      minCurrentConfidence: options.partyLifecycleMinCurrentConfidence,
      minPromotionSafety: options.partyLifecycleMinPromotionSafety,
      minPromotionXpRatio: options.partyLifecycleMinPromotionXpRatio,
      minPromotionGain: options.partyLifecycleMinPromotionGain,
      minProjectedGain: options.partyLifecycleMinProjectedGain,
      minTrainingSafety: options.partyLifecycleMinTrainingSafety,
      minTrainingExpectedXpRatio: options.partyLifecycleMinTrainingExpectedXpRatio,
      promotionWindowsRequired: options.partyLifecyclePromotionWindowsRequired
    });
    this.partyLifecycle.load();

    this.controlledPartyLifecycle = options.controlledPartyLifecycle || new ControlledPartyLifecycleCoordinator({
      root: this.root,
      now: this.now,
      log: this.log,
      storage: options.partyLifecycleOperationStorage || options.storage,
      storageKey: options.partyLifecycleOperationStorageKey,
      lifecycle: this.partyLifecycle,
      transitions: this.partyTransitions,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getEconomyEmergency: () => this._alpha20EconomyEmergency(),
      minTransitionIntervalMs: options.partyLifecycleMinTransitionIntervalMs,
      maxDevelopmentRotationMs: options.partyLifecycleMaxDevelopmentRotationMs,
      failureWindowMs: options.partyLifecycleFailureWindowMs,
      failureThreshold: options.partyLifecycleFailureThreshold,
      circuitCooldownMs: options.partyLifecycleCircuitCooldownMs
    });

    this.controlledPaladinAura = options.controlledPaladinAura || new ControlledPaladinAuraExecutor({
      root: this.root,
      now: this.now,
      log: this.log,
      adapter: this.adapter,
      auraPolicy: this.auraPolicy,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getEconomyEmergency: () => this._alpha20EconomyEmergency()
    });
    this.lastLifecyclePlan = null;
    this.lastLifecycleExecution = null;
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${RELEASE_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _alpha20EconomyEmergency() {
    const recovery = this.controlledMerchantSpaceRecovery && this.controlledMerchantSpaceRecovery.status ? this.controlledMerchantSpaceRecovery.status() : null;
    const capacity = this.bankCapacity && this.bankCapacity.status ? this.bankCapacity.status() : null;
    return !!(
      recovery && recovery.busy ||
      recovery && recovery.journal && recovery.journal.breaker && recovery.journal.breaker.open ||
      capacity && capacity.workGate && capacity.workGate.blockInventoryProducingWork === true
    );
  }

  _measuredScore(row) {
    if (!row || !row.measured) return null;
    const weights = this.partyOrchestrator.weights || {};
    return clamp01(['survival', 'progress', 'controllability', 'synergy'].reduce((sum, key) => sum + clamp01(row.measured[key]) * finite(weights[key]), 0));
  }

  _sameParty(candidate, currentMembers) {
    const candidateNames = new Set((candidate && candidate.members || []).map((row) => row && row.name).filter(Boolean));
    const currentNames = new Set((currentMembers || []).map((row) => row && row.name).filter(Boolean));
    return candidateNames.size === currentNames.size && [...candidateNames].every((name) => currentNames.has(name));
  }

  _lifecycleEvidence(snapshot, currentMembers, registryStatus, encounter, risk) {
    const context = { snapshot, gameData: this.adapter.getGameData() || {}, registryStatus, currentMembers, encounter, performanceStore: this.partyPerformance };
    const scored = this.partyOrchestrator.candidates(registryStatus).map((candidate) => this.partyOrchestrator.score(candidate, context));
    const currentScored = scored.find((row) => this._sameParty(row.candidate, currentMembers)) || null;
    const activeNames = new Set(currentMembers.filter((row) => row.ctype !== 'merchant').map((row) => row.name));
    const combat = (registryStatus.characters || []).filter((row) => row && row.ctype !== 'merchant');
    const session = this.controlledPartyLifecycle && this.controlledPartyLifecycle.status ? this.controlledPartyLifecycle.status().developmentSession : null;
    const rows = [];

    for (const character of combat) {
      const active = activeNames.has(character.name);
      const containing = scored.filter((row) => row.candidate.combat.some((member) => member.name === character.name) && !row.hardSafetyRejected);
      const projected = containing.slice().sort((a, b) => b.score - a.score || b.confidence - a.confidence)[0] || null;
      const historicalMeasured = containing
        .filter((row) => row.measured && row.profile && Number(row.profile.samples) > 0)
        .sort((a, b) => finite(b.measured.confidence) - finite(a.measured.confidence) || finite(a.profile.ageMs) - finite(b.profile.ageMs))[0] || null;
      // Active characters only receive CURRENT evidence from the actually active composition.
      // Benched candidates may use their own previously observed real compositions, never theory-only score.
      const measured = active ? (currentScored && currentScored.measured && currentScored.profile ? currentScored : null) : historicalMeasured;
      const gear = character.gear && typeof character.gear === 'object' ? character.gear : {};
      rows.push({
        name: character.name,
        ctype: character.ctype,
        level: character.level,
        active,
        currentScore: measured ? this._measuredScore(measured) : null,
        currentConfidence: measured ? measured.measured.confidence : 0,
        currentSamples: measured && measured.profile ? measured.profile.samples : 0,
        survivalScore: measured ? measured.measured.survival : null,
        xpPerHour: measured && measured.profile ? measured.profile.xpPerHour : 0,
        projectedScore: projected ? projected.score : null,
        projectedProgress: projected ? projected.components.progress : null,
        trainingSafetyScore: projected ? projected.components.survival : null,
        expectedTrainingXpRatio: null,
        gearReady: Object.keys(gear).length > 0 && finite(character.stateConfidence) >= 0.75,
        contentSafe: encounter && encounter.contentDisposition !== 'UNKNOWN' && encounter.contentDisposition !== 'QUARANTINED'
      });
    }

    const active = rows.filter((row) => row.active);
    const activeCurrent = active.map((row) => row.currentScore).filter((value) => value != null);
    const activeProjected = active.map((row) => row.projectedScore).filter((value) => value != null);
    const activeProgress = active.map((row) => row.projectedProgress).filter((value) => value != null && value > 0);
    const activeXp = active.map((row) => row.xpPerHour).filter((value) => value > 0);
    const observedIncumbentCurrentScore = activeCurrent.length === active.length && active.length ? Math.min(...activeCurrent) : null;
    const observedIncumbentProjectedScore = activeProjected.length ? Math.min(...activeProjected) : null;
    const observedIncumbentProjectedProgress = activeProgress.length ? Math.min(...activeProgress) : null;
    const observedIncumbentXpPerHour = activeXp.length ? Math.min(...activeXp) : 0;

    // During a bounded Development rotation the comparison baseline is frozen from the
    // pre-rotation incumbent. This prevents the trainee from being compared against itself.
    const incumbentCurrentScore = session && session.baselineCurrentScore != null ? clamp01(session.baselineCurrentScore) : observedIncumbentCurrentScore;
    const incumbentProjectedScore = session && session.baselineProjectedScore != null ? clamp01(session.baselineProjectedScore) : observedIncumbentProjectedScore;
    const incumbentProjectedProgress = session && session.baselineProjectedProgress != null ? clamp01(session.baselineProjectedProgress) : observedIncumbentProjectedProgress;
    const incumbentXpPerHour = session && finite(session.baselineXpPerHour) > 0 ? finite(session.baselineXpPerHour) : observedIncumbentXpPerHour;
    for (const row of rows) {
      row.expectedTrainingXpRatio = row.projectedProgress != null && incumbentProjectedProgress > 0 ? row.projectedProgress / incumbentProjectedProgress : null;
    }
    return {
      characters: rows,
      incumbentCurrentScore,
      incumbentProjectedScore,
      incumbentXpPerHour,
      developmentCandidateName: session && session.candidate || null,
      highRisk: !!(risk && (risk.highRisk || risk.unknown)),
      economyEmergency: this._alpha20EconomyEmergency()
    };
  }

  _maybeApplyAura(snapshot, encounter, risk, currentMembers) {
    const localName = snapshot && snapshot.character && snapshot.character.name;
    const local = currentMembers.find((row) => row.name === localName);
    const paladin = currentMembers.find((row) => row.ctype === 'paladin') || null;
    const recommendation = this.auraPolicy.recommend({ paladin, encounter, risk });
    this.lastAuraRecommendation = recommendation;
    if (!local || local.ctype !== 'paladin' || !paladin || paladin.name !== local.name) return recommendation;
    const c = snapshot.character;
    const inCombat = !!c.target || (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name);
    const result = this.controlledPaladinAura.execute(recommendation, {
      inCombat,
      highRisk: !!(risk && (risk.highRisk || risk.unknown)),
      emergency: !!this.pendingEmergencyRetreat
    });
    if (result && result.executed) this.lastAuraExecution = result;
    return recommendation;
  }

  // Projected Alpha.12 recommendations can never directly execute a switch in Alpha.20.
  _maybeStartTransition() { return null; }

  _verifyLifecycleTarget(targetNames, snapshot) {
    const latest = this.characterRegistry.status();
    const byName = new Map((latest.characters || []).map((row) => [row.name, row]));
    return targetNames.every((name) => {
      const row = byName.get(name);
      if (!row || row.dead === true || row.online === false || row.presence === 'STALE') return false;
      if (row.map && snapshot.character.map && row.map !== snapshot.character.map) return false;
      const hp = row.stats && Number(row.stats.hp);
      const maxHp = row.stats && Number(row.stats.max_hp);
      return !(Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0 && hp / maxHp < 0.5);
    });
  }

  _partyDecisionCycle() {
    const decision = super._partyDecisionCycle();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character || !this.currentEncounterFingerprint) return decision;
    const registryStatus = this.characterRegistry.status();
    const currentMembers = this._currentMembers(snapshot);
    const risk = this._riskContext(snapshot, this.currentEncounterFingerprint);
    const evidence = this._lifecycleEvidence(snapshot, currentMembers, registryStatus, this.currentEncounterFingerprint, risk);
    this.partyLifecycle.evaluate(evidence);
    this.partyLifecycle.save();

    const c = snapshot.character;
    const inCombat = !!c.target || (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name);
    const context = {
      currentNames: currentMembers.map((row) => row.name),
      inCombat,
      highRisk: evidence.highRisk,
      emergency: !!this.pendingEmergencyRetreat,
      requiresCrossMapRouting: currentMembers.some((member) => member.map && c.map && member.map !== c.map && member.online === true),
      verifyTargetState: (targetNames) => this._verifyLifecycleTarget(targetNames, snapshot)
    };
    this.lastLifecyclePlan = this.controlledPartyLifecycle.plan(currentMembers, registryStatus, context);
    if (this.lastLifecyclePlan && this.lastLifecyclePlan.planned && !this.controlledPartyLifecycle.busy) {
      Promise.resolve(this.controlledPartyLifecycle.executePlan(this.lastLifecyclePlan, currentMembers, registryStatus, context))
        .then((result) => {
          this.lastLifecycleExecution = result;
          if (result && result.executed) this.partyOrchestrator.noteSwitch();
        })
        .catch((error) => {
          this.lastLifecycleExecution = { executed: false, reason: 'UNHANDLED_ALPHA20_TRANSITION_ERROR', error: String(error && error.message || error) };
          this.log.emit({ component: 'alpha20-party-lifecycle', event: 'PARTY_LIFECYCLE_EXECUTION_ERROR', severity: 'error', reason: 'UNHANDLED_ALPHA20_TRANSITION_ERROR', data: { message: String(error && error.message || error) } });
        });
    }
    return decision;
  }

  configureControlledPartyLifecycle(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledPartyLifecycle.disable(gate.reason);
        this.controlledPaladinAura.disable(gate.reason);
        return { lifecycle: { ...this.controlledPartyLifecycle.status(), enableRejected: gate.reason }, aura: this.controlledPaladinAura.status() };
      }
    }
    const lifecycle = this.controlledPartyLifecycle.configure({
      enabled: config.enabled === true,
      ack: config.ack,
      allowTransitions: config.allowTransitions === true,
      allowDevelopmentRotation: config.allowDevelopmentRotation === true,
      reason: config.reason
    });
    let aura;
    if (config.enabled === true && config.allowAuraChanges === true) aura = this.controlledPaladinAura.configure({ enabled: true, ack: config.auraAck });
    else aura = this.controlledPaladinAura.disable(config.reason || 'AURA_NOT_AUTHORIZED');
    return { lifecycle, aura };
  }

  reconcilePartyLifecycle() {
    const snapshot = this.lastSnapshot;
    const names = snapshot ? this._currentMembers(snapshot).map((row) => row.name) : [];
    return this.controlledPartyLifecycle.reconcile(names);
  }

  setPartyTransitionsEnabled() {
    this.partyTransitions.setLiveEnabled(false);
    return false;
  }

  setPartyAuraAutomationEnabled() {
    this.auraAutomationEnabled = false;
    return false;
  }

  _guardControlledAuthority() {
    const base = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (this.controlledPartyLifecycle.breaker().open) reason = 'PARTY_LIFECYCLE_CIRCUIT_OPEN';
    if (reason) {
      if (this.controlledPartyLifecycle.status().enabled) this.controlledPartyLifecycle.disable(reason);
      if (this.controlledPaladinAura.status().enabled) this.controlledPaladinAura.disable(reason);
    }
    return { ...base, partyLifecycleGuardReason: reason };
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') {
      this.controlledPartyLifecycle.disable('RUNTIME_LEFT_ACTIVE_MODE');
      this.controlledPaladinAura.disable('RUNTIME_LEFT_ACTIVE_MODE');
    }
    return resolved;
  }

  stop() {
    this.controlledPartyLifecycle.disable('RUNTIME_STOP');
    this.controlledPaladinAura.disable('RUNTIME_STOP');
    this.partyLifecycle.save({ force: true });
    this.controlledPartyLifecycle.save();
    return super.stop();
  }

  status() {
    const base = super.status();
    const controlledLifecycle = this.controlledPartyLifecycle.status();
    return {
      ...base,
      version: RELEASE_VERSION,
      party: {
        ...(base.party || {}),
        lifecycle: this.partyLifecycle.status(),
        controlledLifecycle,
        controlledAura: this.controlledPaladinAura.status(),
        lifecyclePlan: this.lastLifecyclePlan,
        lifecycleExecution: this.lastLifecycleExecution,
        legacyTransitionBypassAllowed: false,
        legacyAuraBypassAllowed: false
      },
      alpha20: {
        adaptivePartyLifecycle: true,
        statuses: ['ACTIVE', 'BENCH', 'DEVELOPMENT', 'PROMOTION_CANDIDATE'],
        currentScoreRequiredForPromotion: true,
        projectedScorePlanningOnly: true,
        maxDevelopmentSlots: 1,
        maxDevelopmentRotationMs: controlledLifecycle.maxDevelopmentRotationMs,
        boundedDevelopmentReturn: true,
        persistentDevelopmentSession: true,
        partyTransitionCircuitBreaker: true,
        controlledLifecycleAck: CONTROLLED_PARTY_LIFECYCLE_ACK,
        controlledAuraAck: CONTROLLED_PALADIN_AURA_ACK,
        transitionAuthorityDefault: false,
        developmentRotationAuthorityDefault: false,
        auraAuthorityDefault: false,
        crossMapRoutingAuthority: false,
        smartMoveAuthority: false,
        serverChangeAuthority: false,
        brainGameplayAuthority: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.partyLifecycle = this.partyLifecycle.status();
    base.context.controlledPartyLifecycle = this.controlledPartyLifecycle.status();
    base.context.controlledPaladinAura = this.controlledPaladinAura.status();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha20Runtime };

},
"src/party/lifecycle-store.js": function(require,module,exports){
'use strict';

const PARTY_LIFECYCLE_SCHEMA_VERSION = 1;
const PARTY_LIFECYCLE_MODE = 'planning-controlled-default-off';
const PartyLifecycleState = Object.freeze({
  ACTIVE: 'ACTIVE',
  BENCH: 'BENCH',
  DEVELOPMENT: 'DEVELOPMENT',
  PROMOTION_CANDIDATE: 'PROMOTION_CANDIDATE'
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class PartyLifecycleStore {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'AIO_V3_PARTY_LIFECYCLE';
    this.capacity = Math.max(4, Math.min(64, Number(options.capacity) || 32));
    this.minCurrentSamples = Math.max(2, Math.min(100, Number(options.minCurrentSamples) || 8));
    this.minCurrentConfidence = Math.max(0.1, Math.min(1, finite(options.minCurrentConfidence, 0.55)));
    this.minPromotionSafety = Math.max(0.5, Math.min(1, finite(options.minPromotionSafety, 0.90)));
    this.minPromotionXpRatio = Math.max(0.5, Math.min(2, finite(options.minPromotionXpRatio, 0.85)));
    this.minPromotionGain = Math.max(0.01, Math.min(0.5, finite(options.minPromotionGain, 0.05)));
    this.minProjectedGain = Math.max(0.01, Math.min(0.5, finite(options.minProjectedGain, 0.04)));
    this.minTrainingSafety = Math.max(0.5, Math.min(1, finite(options.minTrainingSafety, 0.90)));
    this.minTrainingExpectedXpRatio = Math.max(0.5, Math.min(1.5, finite(options.minTrainingExpectedXpRatio, 0.75)));
    this.promotionWindowsRequired = Math.max(2, Math.min(20, Number(options.promotionWindowsRequired) || 3));
    this.maxDevelopmentSlots = 1;
    this.records = new Map();
    this.loaded = false;
    this.dirty = false;
    this.lastEvaluation = null;
    this.stats = { evaluations: 0, loads: 0, loadFailures: 0, saves: 0, saveFailures: 0, promotionsReady: 0, developmentSelections: 0, evicted: 0 };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-lifecycle', event, data, severity, reason });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    return null;
  }

  _sanitize(row) {
    if (!row || typeof row !== 'object' || !row.name) return null;
    const state = Object.values(PartyLifecycleState).includes(row.state) ? row.state : PartyLifecycleState.BENCH;
    return {
      name: String(row.name),
      ctype: row.ctype ? String(row.ctype) : null,
      level: Math.max(0, finite(row.level)),
      state,
      active: row.active === true,
      currentScore: row.currentScore == null ? null : clamp01(row.currentScore),
      currentConfidence: clamp01(row.currentConfidence),
      currentSamples: Math.max(0, finite(row.currentSamples)),
      projectedScore: row.projectedScore == null ? null : clamp01(row.projectedScore),
      projectedProgress: row.projectedProgress == null ? null : clamp01(row.projectedProgress),
      trainingSafetyScore: row.trainingSafetyScore == null ? null : clamp01(row.trainingSafetyScore),
      survivalScore: row.survivalScore == null ? null : clamp01(row.survivalScore),
      xpPerHour: Math.max(0, finite(row.xpPerHour)),
      xpRatioToIncumbent: row.xpRatioToIncumbent == null ? null : Math.max(0, finite(row.xpRatioToIncumbent)),
      expectedTrainingXpRatio: row.expectedTrainingXpRatio == null ? null : Math.max(0, finite(row.expectedTrainingXpRatio)),
      gearReady: row.gearReady === true,
      contentSafe: row.contentSafe === true,
      promotionStreak: Math.max(0, Math.floor(finite(row.promotionStreak))),
      reasons: Array.isArray(row.reasons) ? row.reasons.map(String).slice(0, 24) : [],
      updatedAt: Math.max(0, finite(row.updatedAt)),
      firstSeenAt: Math.max(0, finite(row.firstSeenAt))
    };
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== PARTY_LIFECYCLE_SCHEMA_VERSION || !Array.isArray(data.records)) throw new Error('unsupported party lifecycle schema');
      for (const row of data.records.slice(-this.capacity)) {
        const clean = this._sanitize(row);
        if (clean) this.records.set(clean.name, clean);
      }
      this.stats.loads += 1;
      this._event('PARTY_LIFECYCLE_RESTORED', { records: this.records.size });
      return true;
    } catch (error) {
      this.records.clear();
      this.stats.loadFailures += 1;
      this._event('PARTY_LIFECYCLE_RESTORE_FAILED', { message: String(error && error.message || error) }, 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA');
      return false;
    }
  }

  _prune() {
    if (this.records.size <= this.capacity) return;
    const rows = [...this.records.values()].sort((a, b) => a.updatedAt - b.updatedAt);
    const count = this.records.size - this.capacity;
    for (let i = 0; i < count; i += 1) this.records.delete(rows[i].name);
    this.stats.evicted += count;
  }

  evaluate(input = {}) {
    const now = this.now();
    const characters = Array.isArray(input.characters) ? input.characters.filter((row) => row && row.name && row.ctype !== 'merchant') : [];
    const incumbentCurrentScore = input.incumbentCurrentScore == null ? null : clamp01(input.incumbentCurrentScore);
    const incumbentProjectedScore = input.incumbentProjectedScore == null ? null : clamp01(input.incumbentProjectedScore);
    const incumbentXpPerHour = Math.max(0, finite(input.incumbentXpPerHour));
    const developmentCandidateName = input.developmentCandidateName ? String(input.developmentCandidateName) : null;
    const highRisk = input.highRisk === true;
    const economyEmergency = input.economyEmergency === true;

    const next = [];
    for (const raw of characters) {
      const name = String(raw.name);
      const old = this.records.get(name);
      const currentScore = raw.currentScore == null ? null : clamp01(raw.currentScore);
      const currentConfidence = clamp01(raw.currentConfidence);
      const currentSamples = Math.max(0, finite(raw.currentSamples));
      const projectedScore = raw.projectedScore == null ? null : clamp01(raw.projectedScore);
      const projectedProgress = raw.projectedProgress == null ? null : clamp01(raw.projectedProgress);
      const trainingSafetyScore = raw.trainingSafetyScore == null ? null : clamp01(raw.trainingSafetyScore);
      const survivalScore = raw.survivalScore == null ? null : clamp01(raw.survivalScore);
      const xpPerHour = Math.max(0, finite(raw.xpPerHour));
      const xpRatioToIncumbent = incumbentXpPerHour > 0 ? xpPerHour / incumbentXpPerHour : null;
      const expectedTrainingXpRatio = raw.expectedTrainingXpRatio == null ? null : Math.max(0, finite(raw.expectedTrainingXpRatio));
      const gearReady = raw.gearReady === true;
      const contentSafe = raw.contentSafe === true;
      const active = raw.active === true;
      const continuingDevelopment = active && developmentCandidateName === name;
      const reasons = [];

      const measuredReady = currentScore != null && currentSamples >= this.minCurrentSamples && currentConfidence >= this.minCurrentConfidence;
      const promotionSuperior = measuredReady && incumbentCurrentScore != null && currentScore >= incumbentCurrentScore + this.minPromotionGain;
      const promotionSafe = survivalScore != null && survivalScore >= this.minPromotionSafety && contentSafe && !highRisk && !economyEmergency;
      const promotionProgress = xpRatioToIncumbent != null && xpRatioToIncumbent >= this.minPromotionXpRatio;
      const promotionEligiblePosition = !active || continuingDevelopment;
      const qualifiesPromotionWindow = promotionEligiblePosition && promotionSuperior && promotionSafe && promotionProgress && gearReady;
      const promotionStreak = qualifiesPromotionWindow ? Math.min(1000, (old && old.promotionStreak || 0) + 1) : 0;

      if (!measuredReady) reasons.push('CURRENT_EVIDENCE_NOT_READY');
      if (projectedScore != null && incumbentProjectedScore != null && projectedScore > incumbentProjectedScore) reasons.push('PROJECTED_SUPERIORITY_ONLY_PLANNING');
      if (trainingSafetyScore == null || trainingSafetyScore < this.minTrainingSafety) reasons.push('TRAINING_SAFETY_GATE');
      if (survivalScore == null || survivalScore < this.minPromotionSafety) reasons.push('PROMOTION_SURVIVAL_GATE');
      if (!gearReady) reasons.push('PROMOTION_GEAR_NOT_READY');
      if (!contentSafe) reasons.push('CONTENT_NOT_SAFE');
      if (highRisk) reasons.push('HIGH_RISK_CONTEXT');
      if (economyEmergency) reasons.push('ECONOMY_EMERGENCY');
      if (xpRatioToIncumbent == null || xpRatioToIncumbent < this.minPromotionXpRatio) reasons.push('PROMOTION_XP_RATIO_GATE');
      if (!promotionSuperior) reasons.push('CURRENT_SUPERIORITY_NOT_PROVEN');
      if (continuingDevelopment) reasons.push('ACTIVE_BOUNDED_DEVELOPMENT_SESSION');
      if (qualifiesPromotionWindow && promotionStreak < this.promotionWindowsRequired) reasons.push('PROMOTION_HYSTERESIS_BUILDING');

      let state = PartyLifecycleState.BENCH;
      if (continuingDevelopment) {
        state = qualifiesPromotionWindow && promotionStreak >= this.promotionWindowsRequired
          ? PartyLifecycleState.PROMOTION_CANDIDATE
          : PartyLifecycleState.DEVELOPMENT;
      } else if (active) {
        state = PartyLifecycleState.ACTIVE;
      } else if (qualifiesPromotionWindow && promotionStreak >= this.promotionWindowsRequired) {
        state = PartyLifecycleState.PROMOTION_CANDIDATE;
      }

      next.push(this._sanitize({
        name,
        ctype: raw.ctype,
        level: raw.level,
        state,
        active,
        currentScore,
        currentConfidence,
        currentSamples,
        projectedScore,
        projectedProgress,
        trainingSafetyScore,
        survivalScore,
        xpPerHour,
        xpRatioToIncumbent,
        expectedTrainingXpRatio,
        gearReady,
        contentSafe,
        promotionStreak,
        reasons,
        firstSeenAt: old && old.firstSeenAt || now,
        updatedAt: now
      }));
    }

    const activeDevelopment = next.find((row) => row.active && (row.state === PartyLifecycleState.DEVELOPMENT || row.state === PartyLifecycleState.PROMOTION_CANDIDATE));
    const development = activeDevelopment ? [] : next
      .filter((row) => !row.active && row.state !== PartyLifecycleState.PROMOTION_CANDIDATE)
      .filter((row) => row.projectedScore != null && incumbentProjectedScore != null && row.projectedScore >= incumbentProjectedScore + this.minProjectedGain)
      .filter((row) => row.trainingSafetyScore != null && row.trainingSafetyScore >= this.minTrainingSafety)
      .filter((row) => row.expectedTrainingXpRatio != null && row.expectedTrainingXpRatio >= this.minTrainingExpectedXpRatio)
      .filter((row) => row.contentSafe && !highRisk && !economyEmergency)
      .sort((a, b) => (b.projectedScore || 0) - (a.projectedScore || 0) || b.level - a.level || a.name.localeCompare(b.name))
      .slice(0, this.maxDevelopmentSlots);
    const developmentNames = new Set(development.map((row) => row.name));
    for (const row of next) {
      if (developmentNames.has(row.name)) {
        row.state = PartyLifecycleState.DEVELOPMENT;
        row.reasons = [...new Set(row.reasons.concat('BOUNDED_DEVELOPMENT_SLOT'))];
      }
      this.records.set(row.name, row);
    }

    this._prune();
    this.dirty = true;
    this.stats.evaluations += 1;
    this.stats.promotionsReady += next.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE).length;
    this.stats.developmentSelections += development.length;
    this.lastEvaluation = {
      at: now,
      highRisk,
      economyEmergency,
      incumbentCurrentScore,
      incumbentProjectedScore,
      incumbentXpPerHour,
      developmentCandidateName,
      developmentSlotsUsed: activeDevelopment ? 1 : development.length,
      promotionCandidates: next.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE).map((row) => row.name),
      development: next.filter((row) => row.state === PartyLifecycleState.DEVELOPMENT).map((row) => row.name)
    };
    this._event('PARTY_LIFECYCLE_EVALUATED', clone(this.lastEvaluation));
    return this.status();
  }

  get(name) { const row = this.records.get(String(name)); return row ? clone(row) : null; }
  list() { return [...this.records.values()].sort((a, b) => (a.state === PartyLifecycleState.ACTIVE ? -1 : 0) - (b.state === PartyLifecycleState.ACTIVE ? -1 : 0) || a.name.localeCompare(b.name)).map(clone); }

  save(options = {}) {
    if (!this.dirty && options.force !== true) return false;
    const backend = this._backend();
    if (!backend) return false;
    try {
      backend.set(this.key, JSON.stringify({ schemaVersion: PARTY_LIFECYCLE_SCHEMA_VERSION, savedAt: this.now(), records: [...this.records.values()] }));
      this.dirty = false;
      this.stats.saves += 1;
      return true;
    } catch (error) {
      this.stats.saveFailures += 1;
      this._event('PARTY_LIFECYCLE_SAVE_FAILED', { message: String(error && error.message || error) }, 'warn', 'PERSISTENCE_WRITE_ERROR');
      return false;
    }
  }

  status() {
    const rows = this.list();
    return {
      schemaVersion: PARTY_LIFECYCLE_SCHEMA_VERSION,
      mode: PARTY_LIFECYCLE_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      maxDevelopmentSlots: this.maxDevelopmentSlots,
      thresholds: {
        minCurrentSamples: this.minCurrentSamples,
        minCurrentConfidence: this.minCurrentConfidence,
        minPromotionSafety: this.minPromotionSafety,
        minPromotionXpRatio: this.minPromotionXpRatio,
        minPromotionGain: this.minPromotionGain,
        minProjectedGain: this.minProjectedGain,
        minTrainingSafety: this.minTrainingSafety,
        minTrainingExpectedXpRatio: this.minTrainingExpectedXpRatio,
        promotionWindowsRequired: this.promotionWindowsRequired
      },
      lastEvaluation: clone(this.lastEvaluation),
      counts: Object.fromEntries(Object.values(PartyLifecycleState).map((state) => [state, rows.filter((row) => row.state === state).length])),
      characters: rows,
      stats: { ...this.stats }
    };
  }
}

module.exports = { PartyLifecycleStore, PartyLifecycleState, PARTY_LIFECYCLE_SCHEMA_VERSION, PARTY_LIFECYCLE_MODE };

},
"src/party/controlled-lifecycle-coordinator.js": function(require,module,exports){
'use strict';

const { PartyLifecycleState } = require('./lifecycle-store');

const CONTROLLED_PARTY_LIFECYCLE_MODE = 'controlled-live-default-off';
const CONTROLLED_PARTY_LIFECYCLE_ACK = 'ALPHA20_PARTY_LIFECYCLE';
const PartyLifecycleOperationState = Object.freeze({
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function uniqueNames(values) { return [...new Set((values || []).map((value) => typeof value === 'string' ? value : value && value.name).filter(Boolean).map(String))]; }

class ControlledPartyLifecycleCoordinator {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'AIO_V3_PARTY_LIFECYCLE_OPERATION';
    this.lifecycle = options.lifecycle;
    this.transitions = options.transitions;
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'UNKNOWN' }));
    this.getEconomyEmergency = options.getEconomyEmergency || (() => false);
    this.enabled = false;
    this.allowTransitions = false;
    this.allowDevelopmentRotation = false;
    this.minTransitionIntervalMs = Math.max(60 * 1000, Math.min(24 * 60 * 60 * 1000, Number(options.minTransitionIntervalMs) || 15 * 60 * 1000));
    this.maxDevelopmentRotationMs = Math.max(15 * 60 * 1000, Math.min(4 * 60 * 60 * 1000, Number(options.maxDevelopmentRotationMs) || 30 * 60 * 1000));
    this.failureWindowMs = Math.max(60 * 1000, Math.min(60 * 60 * 1000, Number(options.failureWindowMs) || 10 * 60 * 1000));
    this.failureThreshold = Math.max(2, Math.min(10, Number(options.failureThreshold) || 3));
    this.circuitCooldownMs = Math.max(60 * 1000, Math.min(24 * 60 * 60 * 1000, Number(options.circuitCooldownMs) || 10 * 60 * 1000));
    this.failureTimestamps = [];
    this.circuitOpenUntil = 0;
    this.circuitReason = null;
    this.lastTransitionAt = 0;
    this.operation = null;
    this.developmentSession = null;
    this.busy = false;
    this.lastResult = null;
    this.stats = {
      plans: 0,
      attempts: 0,
      committed: 0,
      aborted: 0,
      failedSafe: 0,
      rejected: 0,
      developmentRotations: 0,
      developmentReturns: 0,
      developmentPromotions: 0,
      developmentSessionDrifts: 0,
      promotions: 0,
      circuitOpens: 0
    };
    this.load();
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-lifecycle-controlled', event, data, severity, reason });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    return null;
  }

  _pruneFailures(at = this.now()) {
    const cutoff = at - this.failureWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter((value) => Number.isFinite(Number(value)) && Number(value) >= cutoff && Number(value) <= at);
  }

  breaker() {
    const now = this.now();
    this._pruneFailures(now);
    if (this.circuitOpenUntil > 0 && now >= this.circuitOpenUntil) {
      this.circuitOpenUntil = 0;
      this.circuitReason = null;
    }
    return {
      open: this.circuitOpenUntil > now,
      openUntil: this.circuitOpenUntil > now ? this.circuitOpenUntil : null,
      reason: this.circuitOpenUntil > now ? this.circuitReason : null,
      failuresInWindow: this.failureTimestamps.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  _recordFailure(reason) {
    const now = this.now();
    this.failureTimestamps.push(now);
    this._pruneFailures(now);
    if (this.failureTimestamps.length >= this.failureThreshold) {
      this.circuitOpenUntil = Math.max(this.circuitOpenUntil, now + this.circuitCooldownMs);
      this.circuitReason = String(reason || 'PARTY_TRANSITION_FAILURE_BUDGET_EXCEEDED');
      this.stats.circuitOpens += 1;
      if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
      this._event('PARTY_LIFECYCLE_CIRCUIT_OPENED', this.breaker(), 'error', this.circuitReason);
    }
  }

  _sanitizeDevelopmentSession(value) {
    if (!value || typeof value !== 'object') return null;
    const originalNames = uniqueNames(value.originalNames);
    const trainingNames = uniqueNames(value.trainingNames);
    if (!value.candidate || !value.incumbent || originalNames.length !== 4 || trainingNames.length !== 4) return null;
    return {
      schemaVersion: 1,
      candidate: String(value.candidate),
      incumbent: String(value.incumbent),
      originalNames,
      trainingNames,
      startedAt: Math.max(0, finite(value.startedAt)),
      expiresAt: Math.max(0, finite(value.expiresAt)),
      baselineCurrentScore: value.baselineCurrentScore == null ? null : finite(value.baselineCurrentScore),
      baselineProjectedScore: value.baselineProjectedScore == null ? null : finite(value.baselineProjectedScore),
      baselineProjectedProgress: value.baselineProjectedProgress == null ? null : finite(value.baselineProjectedProgress),
      baselineXpPerHour: Math.max(0, finite(value.baselineXpPerHour)),
      driftDetectedAt: value.driftDetectedAt == null ? null : Math.max(0, finite(value.driftDetectedAt)),
      lastObservedAt: value.lastObservedAt == null ? null : Math.max(0, finite(value.lastObservedAt))
    };
  }

  save() {
    const backend = this._backend();
    if (!backend) return false;
    try {
      backend.set(this.storageKey, JSON.stringify({
        schemaVersion: 1,
        savedAt: this.now(),
        operation: this.operation,
        developmentSession: this.developmentSession,
        lastTransitionAt: this.lastTransitionAt,
        failureTimestamps: this.failureTimestamps,
        circuitOpenUntil: this.circuitOpenUntil,
        circuitReason: this.circuitReason
      }));
      return true;
    } catch (error) {
      this._event('PARTY_LIFECYCLE_OPERATION_SAVE_FAILED', { message: String(error && error.message || error) }, 'warn', 'PERSISTENCE_WRITE_ERROR');
      return false;
    }
  }

  load() {
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.storageKey);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== 1) throw new Error('unsupported lifecycle operation schema');
      this.lastTransitionAt = Math.max(0, finite(data.lastTransitionAt));
      this.failureTimestamps = Array.isArray(data.failureTimestamps) ? data.failureTimestamps.map(Number).filter(Number.isFinite) : [];
      this.circuitOpenUntil = Math.max(0, finite(data.circuitOpenUntil));
      this.circuitReason = data.circuitReason ? String(data.circuitReason) : null;
      this.developmentSession = this._sanitizeDevelopmentSession(data.developmentSession);
      this.breaker();
      if (data.operation && [PartyLifecycleOperationState.RESERVED, PartyLifecycleOperationState.EXECUTING, PartyLifecycleOperationState.VERIFYING].includes(data.operation.state)) {
        this.operation = { ...data.operation, state: PartyLifecycleOperationState.RECOVERING, reason: 'RESTART_RECONCILIATION_REQUIRED', updatedAt: this.now() };
        this._event('PARTY_LIFECYCLE_RESTART_RECOVERY_REQUIRED', { id: this.operation.id }, 'warn', 'NO_BLIND_RETRY');
        this.save();
      } else this.operation = data.operation || null;
      return true;
    } catch (error) {
      this.operation = null;
      this.developmentSession = null;
      this.failureTimestamps = [];
      this.circuitOpenUntil = 0;
      this.circuitReason = null;
      this._event('PARTY_LIFECYCLE_OPERATION_RESTORE_FAILED', { message: String(error && error.message || error) }, 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA');
      return false;
    }
  }

  configure(config = {}) {
    if (config.enabled !== true) {
      this.disable(config.reason || 'OPERATOR_DISABLED');
      return this.status();
    }
    if (config.ack !== CONTROLLED_PARTY_LIFECYCLE_ACK) {
      this.disable('WRONG_ACK');
      this.stats.rejected += 1;
      return { ...this.status(), enableRejected: 'WRONG_ACK' };
    }
    if (this.breaker().open) {
      this.disable('PARTY_LIFECYCLE_CIRCUIT_OPEN');
      this.stats.rejected += 1;
      return { ...this.status(), enableRejected: 'PARTY_LIFECYCLE_CIRCUIT_OPEN' };
    }
    this.enabled = true;
    this.allowTransitions = config.allowTransitions === true;
    this.allowDevelopmentRotation = this.allowTransitions && config.allowDevelopmentRotation === true;
    this._event('PARTY_LIFECYCLE_CONTROL_ENABLED', { allowTransitions: this.allowTransitions, allowDevelopmentRotation: this.allowDevelopmentRotation });
    return this.status();
  }

  disable(reason = 'DISABLED') {
    this.enabled = false;
    this.allowTransitions = false;
    this.allowDevelopmentRotation = false;
    if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
    this._event('PARTY_LIFECYCLE_CONTROL_DISABLED', { developmentSessionPreserved: !!this.developmentSession }, 'info', reason);
    return this.status();
  }

  _localCharacter() { return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null; }
  _sameNames(left, right) {
    const a = uniqueNames(left);
    const b = uniqueNames(right);
    return a.length === b.length && a.every((name) => b.includes(name));
  }

  _gate(context = {}) {
    const reasons = [];
    const local = this._localCharacter();
    const supervisor = this.getSupervisorStatus() || {};
    if (!this.enabled) reasons.push('CONTROLLED_PARTY_LIFECYCLE_DISABLED');
    if (this.breaker().open) reasons.push('PARTY_LIFECYCLE_CIRCUIT_OPEN');
    if (this.getMode() !== 'active') reasons.push('RUNTIME_NOT_ACTIVE');
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reasons.push('SUPERVISOR_NOT_HEALTHY');
    if (!local || local.ctype !== 'merchant') reasons.push('MERCHANT_CONTROLLER_REQUIRED');
    if (context.inCombat === true) reasons.push('ACTIVE_COMBAT');
    if (context.highRisk === true) reasons.push('HIGH_RISK_CONTEXT');
    if (context.emergency === true) reasons.push('EMERGENCY_RECOVERY');
    if (this.getEconomyEmergency() === true) reasons.push('ECONOMY_EMERGENCY');
    if (this.busy) reasons.push('PARTY_LIFECYCLE_BUSY');
    if (this.operation && this.operation.state === PartyLifecycleOperationState.RECOVERING) reasons.push('RESTART_RECONCILIATION_REQUIRED');
    return { allowed: reasons.length === 0, reasons, local, supervisor };
  }

  _startDevelopmentSession(plan, at = this.now()) {
    const originalNames = uniqueNames(plan && plan.evidence && plan.evidence.context && plan.evidence.context.currentNames);
    const trainingNames = uniqueNames(plan && plan.targetNames);
    if (!plan || plan.kind !== 'DEVELOPMENT_ROTATION' || originalNames.length !== 4 || trainingNames.length !== 4) return null;
    const outgoing = plan.evidence && plan.evidence.outgoing || {};
    this.developmentSession = this._sanitizeDevelopmentSession({
      candidate: plan.incoming,
      incumbent: plan.outgoing,
      originalNames,
      trainingNames,
      startedAt: at,
      expiresAt: at + this.maxDevelopmentRotationMs,
      baselineCurrentScore: outgoing.currentScore,
      baselineProjectedScore: outgoing.projectedScore,
      baselineProjectedProgress: outgoing.projectedProgress,
      baselineXpPerHour: outgoing.xpPerHour,
      lastObservedAt: at
    });
    if (this.developmentSession) {
      this._event('DEVELOPMENT_SESSION_STARTED', clone(this.developmentSession));
      this.save();
    }
    return clone(this.developmentSession);
  }

  _clearDevelopmentSession(reason) {
    const previous = clone(this.developmentSession);
    this.developmentSession = null;
    this._event('DEVELOPMENT_SESSION_CLEARED', { reason, previous });
    this.save();
    return previous;
  }

  _planDevelopmentSession(currentMembers = [], registryStatus = {}, context = {}) {
    const session = this.developmentSession;
    if (!session) return null;
    const currentNames = uniqueNames(currentMembers);
    const now = this.now();

    if (this._sameNames(currentNames, session.originalNames)) {
      this._clearDevelopmentSession('ORIGINAL_PARTY_OBSERVED');
      return { planned: false, reason: 'DEVELOPMENT_SESSION_RETURN_OBSERVED' };
    }
    if (!this._sameNames(currentNames, session.trainingNames)) {
      if (session.driftDetectedAt == null) {
        session.driftDetectedAt = now;
        session.lastObservedAt = now;
        this.stats.developmentSessionDrifts += 1;
        this._recordFailure('DEVELOPMENT_SESSION_PARTY_DRIFT');
        this._event('DEVELOPMENT_SESSION_PARTY_DRIFT', { session: clone(session), currentNames }, 'error', 'NO_BLIND_TRANSITION');
        this.save();
      }
      return { planned: false, reason: 'DEVELOPMENT_SESSION_PARTY_DRIFT', currentNames, expectedTrainingNames: session.trainingNames.slice(), expectedOriginalNames: session.originalNames.slice() };
    }

    session.lastObservedAt = now;
    session.driftDetectedAt = null;
    const life = this.lifecycle && this.lifecycle.status ? this.lifecycle.status() : { characters: [] };
    const candidate = (life.characters || []).find((row) => row.name === session.candidate) || null;
    if (candidate && candidate.state === PartyLifecycleState.PROMOTION_CANDIDATE && candidate.active === true) {
      this.stats.developmentPromotions += 1;
      this.stats.promotions += 1;
      this._clearDevelopmentSession('MEASURED_PROMOTION_CONFIRMED');
      this._event('DEVELOPMENT_PROMOTION_COMMITTED', { candidate: candidate.name, currentScore: candidate.currentScore, promotionStreak: candidate.promotionStreak });
      return { planned: false, reason: 'DEVELOPMENT_PROMOTION_COMMITTED_NO_RAW_TRANSITION', promoted: true, candidate: candidate.name };
    }

    if (now < session.expiresAt) {
      this.save();
      return { planned: false, reason: 'DEVELOPMENT_WINDOW_ACTIVE', candidate: session.candidate, expiresAt: session.expiresAt, remainingMs: session.expiresAt - now };
    }
    if (!this.allowDevelopmentRotation) return { planned: false, reason: 'DEVELOPMENT_RETURN_NOT_AUTHORIZED', candidate: session.candidate };

    const byName = new Map((registryStatus.characters || []).map((row) => [row.name, row]));
    const merchant = currentMembers.find((row) => row && row.ctype === 'merchant') || null;
    if (!merchant) return { planned: false, reason: 'MERCHANT_CONTROLLER_REQUIRED' };
    const members = session.originalNames.map((name) => byName.get(name) || currentMembers.find((row) => row && row.name === name)).filter(Boolean);
    if (members.length !== 4 || new Set(members.map((row) => row.name)).size !== 4) return { planned: false, reason: 'DEVELOPMENT_RETURN_STATE_INCOMPLETE' };
    const incumbent = byName.get(session.incumbent) || members.find((row) => row.name === session.incumbent);
    if (!incumbent || incumbent.dead === true || incumbent.available === false) return { planned: false, reason: 'DEVELOPMENT_RETURN_INCUMBENT_UNAVAILABLE' };

    return {
      planned: true,
      kind: 'DEVELOPMENT_RETURN',
      destructive: false,
      incoming: session.incumbent,
      outgoing: session.candidate,
      targetNames: session.originalNames.slice(),
      members,
      merchant,
      evidence: { session: clone(session), context: clone(context) }
    };
  }

  _selectPlan(currentMembers = [], registryStatus = {}, context = {}) {
    const life = this.lifecycle && this.lifecycle.status ? this.lifecycle.status() : { characters: [], thresholds: {} };
    const rows = life.characters || [];
    const current = currentMembers.filter(Boolean);
    const merchant = current.find((row) => row.ctype === 'merchant');
    const activeCombat = current.filter((row) => row.ctype !== 'merchant');
    if (!merchant || activeCombat.length !== 3) return { planned: false, reason: 'CURRENT_PARTY_MUST_BE_MERCHANT_PLUS_THREE' };
    const byName = new Map((registryStatus.characters || []).map((row) => [row.name, row]));
    const lifecycleByName = new Map(rows.map((row) => [row.name, row]));
    const promotion = rows.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE && !row.active).sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))[0] || null;
    const development = rows.filter((row) => row.state === PartyLifecycleState.DEVELOPMENT && !row.active).sort((a, b) => (b.projectedScore || 0) - (a.projectedScore || 0))[0] || null;
    let incoming = promotion;
    let kind = 'PROMOTION';
    if (!incoming && this.allowDevelopmentRotation) { incoming = development; kind = 'DEVELOPMENT_ROTATION'; }
    if (!incoming) return { planned: false, reason: 'NO_ELIGIBLE_LIFECYCLE_CHANGE' };
    if (kind === 'DEVELOPMENT_ROTATION' && !this.allowDevelopmentRotation) return { planned: false, reason: 'DEVELOPMENT_ROTATION_NOT_AUTHORIZED' };
    if (kind === 'PROMOTION' && !this.allowTransitions) return { planned: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };
    const incomingRegistry = byName.get(incoming.name);
    if (!incomingRegistry || incomingRegistry.dead === true || incomingRegistry.available === false) return { planned: false, reason: 'INCOMING_NOT_AVAILABLE' };

    const outgoing = activeCombat
      .map((member) => ({ member, lifecycle: lifecycleByName.get(member.name) || null }))
      .sort((a, b) => {
        const as = a.lifecycle && a.lifecycle.currentScore;
        const bs = b.lifecycle && b.lifecycle.currentScore;
        if (as == null && bs != null) return -1;
        if (as != null && bs == null) return 1;
        return finite(as, 0) - finite(bs, 0) || finite(a.member.level, 0) - finite(b.member.level, 0);
      })[0];
    if (!outgoing) return { planned: false, reason: 'NO_OUTGOING_MEMBER' };
    if (kind === 'PROMOTION') {
      if (incoming.currentScore == null || !outgoing.lifecycle || outgoing.lifecycle.currentScore == null || incoming.currentScore <= outgoing.lifecycle.currentScore) return { planned: false, reason: 'CURRENT_SUPERIORITY_NOT_PROVEN' };
    }
    const minTrainingXpRatio = life.thresholds && Number(life.thresholds.minTrainingExpectedXpRatio);
    if (kind === 'DEVELOPMENT_ROTATION' && (incoming.expectedTrainingXpRatio == null || !Number.isFinite(minTrainingXpRatio) || incoming.expectedTrainingXpRatio < minTrainingXpRatio)) return { planned: false, reason: 'TRAINING_XP_RATIO_GATE' };

    const targetNames = [merchant.name, ...activeCombat.filter((row) => row.name !== outgoing.member.name).map((row) => row.name), incoming.name];
    if (new Set(targetNames).size !== 4) return { planned: false, reason: 'TARGET_PARTY_DUPLICATE' };
    const targetMembers = targetNames.map((name) => byName.get(name) || current.find((row) => row.name === name)).filter(Boolean);
    if (targetMembers.length !== 4) return { planned: false, reason: 'TARGET_MEMBER_STATE_INCOMPLETE' };
    return {
      planned: true,
      kind,
      destructive: false,
      incoming: incoming.name,
      outgoing: outgoing.member.name,
      targetNames,
      members: targetMembers,
      merchant,
      evidence: { incoming: clone(incoming), outgoing: clone(outgoing.lifecycle), context: clone(context) }
    };
  }

  plan(currentMembers = [], registryStatus = {}, context = {}) {
    this.stats.plans += 1;
    const gate = this._gate(context);
    if (!gate.allowed) return { planned: false, reason: gate.reasons[0], reasons: gate.reasons };
    if (!this.allowTransitions) return { planned: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };

    const sessionPlan = this._planDevelopmentSession(currentMembers, registryStatus, context);
    if (sessionPlan) {
      if (sessionPlan.planned && this.now() - this.lastTransitionAt < this.minTransitionIntervalMs) return { planned: false, reason: 'TRANSITION_HYSTERESIS_HOLD', sessionPlan };
      return sessionPlan;
    }

    if (this.now() - this.lastTransitionAt < this.minTransitionIntervalMs) return { planned: false, reason: 'TRANSITION_HYSTERESIS_HOLD' };
    return this._selectPlan(currentMembers, registryStatus, context);
  }

  _reserve(plan) {
    const now = this.now();
    this.operation = {
      schemaVersion: 1,
      id: `party-life-${now}`,
      state: PartyLifecycleOperationState.RESERVED,
      createdAt: now,
      updatedAt: now,
      plan: clone(plan),
      rawActionAuthority: false,
      directGameplayActionAccess: false,
      reason: 'PARTY_LIFECYCLE_RESERVED'
    };
    this.save();
    return this.operation;
  }

  _commitOperation(op, plan, result) {
    op.state = PartyLifecycleOperationState.COMMITTED;
    op.reason = 'PARTY_LIFECYCLE_TRANSITION_COMMITTED';
    op.result = clone(result);
    op.updatedAt = this.now();
    this.lastTransitionAt = this.now();
    this.stats.committed += 1;
    if (plan.kind === 'PROMOTION') this.stats.promotions += 1;
    if (plan.kind === 'DEVELOPMENT_ROTATION') {
      this.stats.developmentRotations += 1;
      this._startDevelopmentSession(plan, op.updatedAt);
    }
    if (plan.kind === 'DEVELOPMENT_RETURN') {
      this.stats.developmentReturns += 1;
      this._clearDevelopmentSession('BOUNDED_DEVELOPMENT_RETURN_COMMITTED');
    }
    this.lastResult = clone(op);
    this.save();
    this._event('PARTY_LIFECYCLE_TRANSITION_COMMITTED', { id: op.id, kind: plan.kind, incoming: plan.incoming, outgoing: plan.outgoing });
  }

  async executePlan(plan, currentMembers = [], registryStatus = {}, context = {}) {
    const gate = this._gate(context);
    if (!gate.allowed) { this.stats.rejected += 1; return { executed: false, reason: gate.reasons[0], reasons: gate.reasons }; }
    if (!plan || plan.planned !== true) return { executed: false, reason: 'INVALID_PLAN' };
    if (!this.allowTransitions) return { executed: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };
    if ((plan.kind === 'DEVELOPMENT_ROTATION' || plan.kind === 'DEVELOPMENT_RETURN') && !this.allowDevelopmentRotation) return { executed: false, reason: 'DEVELOPMENT_ROTATION_NOT_AUTHORIZED' };
    if (this.now() - this.lastTransitionAt < this.minTransitionIntervalMs) return { executed: false, reason: 'TRANSITION_HYSTERESIS_HOLD' };
    this.busy = true;
    this.stats.attempts += 1;
    const op = this._reserve(plan);
    try {
      op.state = PartyLifecycleOperationState.EXECUTING;
      op.updatedAt = this.now();
      this.save();
      this.transitions.setLiveEnabled(true);
      const result = await this.transitions.execute({ members: plan.members, merchant: plan.merchant }, {
        runtimeMode: this.getMode(),
        currentMembers,
        registryStatus,
        inCombat: context.inCombat === true,
        emergency: context.emergency === true || context.highRisk === true || this.getEconomyEmergency() === true,
        requiresCrossMapRouting: context.requiresCrossMapRouting === true,
        verifyTargetState: context.verifyTargetState
      });
      this.transitions.setLiveEnabled(false);
      if (result && result.executed === true) {
        this._commitOperation(op, plan, result);
        return { executed: true, operation: clone(op), transition: result, developmentSession: clone(this.developmentSession) };
      }
      op.state = result && result.recovery && result.recovery.recovered === false ? PartyLifecycleOperationState.FAILED_SAFE : PartyLifecycleOperationState.ABORTED;
      op.reason = result && result.reason || 'TRANSITION_ABORTED';
      op.result = clone(result);
      op.updatedAt = this.now();
      if (op.state === PartyLifecycleOperationState.FAILED_SAFE) this.stats.failedSafe += 1; else this.stats.aborted += 1;
      this._recordFailure(op.reason);
      this.lastResult = clone(op);
      this.save();
      return { executed: false, operation: clone(op), transition: result, reason: op.reason };
    } catch (error) {
      if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
      op.state = PartyLifecycleOperationState.FAILED_SAFE;
      op.reason = 'UNHANDLED_PARTY_LIFECYCLE_ERROR';
      op.error = String(error && error.message || error);
      op.updatedAt = this.now();
      this.stats.failedSafe += 1;
      this._recordFailure(op.reason);
      this.lastResult = clone(op);
      this.save();
      this._event('PARTY_LIFECYCLE_TRANSITION_FAILED_SAFE', { id: op.id, error: op.error }, 'error', op.reason);
      return { executed: false, reason: op.reason, operation: clone(op) };
    } finally {
      this.busy = false;
      if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
    }
  }

  async maybeExecute(currentMembers = [], registryStatus = {}, context = {}) {
    const plan = this.plan(currentMembers, registryStatus, context);
    if (!plan.planned) return plan;
    return this.executePlan(plan, currentMembers, registryStatus, context);
  }

  reconcile(currentNames = []) {
    if (!this.operation || this.operation.state !== PartyLifecycleOperationState.RECOVERING) return { reconciled: false, reason: 'NO_RECOVERING_OPERATION' };
    const current = uniqueNames(currentNames);
    const target = uniqueNames(this.operation.plan && this.operation.plan.targetNames);
    const old = uniqueNames(this.operation.plan && this.operation.plan.evidence && this.operation.plan.evidence.context && this.operation.plan.evidence.context.currentNames);
    if (target.length === 4 && this._sameNames(current, target)) {
      this.operation.state = PartyLifecycleOperationState.COMMITTED;
      this.operation.reason = 'RESTART_TARGET_STATE_OBSERVED';
      this.operation.updatedAt = this.now();
      this.lastTransitionAt = this.now();
      this.stats.committed += 1;
      if (this.operation.plan.kind === 'DEVELOPMENT_ROTATION' && !this.developmentSession) {
        this.stats.developmentRotations += 1;
        this._startDevelopmentSession(this.operation.plan, this.operation.updatedAt);
      }
      if (this.operation.plan.kind === 'DEVELOPMENT_RETURN') {
        this.stats.developmentReturns += 1;
        this._clearDevelopmentSession('RESTART_RETURN_TARGET_OBSERVED');
      }
      if (this.operation.plan.kind === 'PROMOTION') this.stats.promotions += 1;
    } else if (old.length === 4 && this._sameNames(current, old)) {
      this.operation.state = PartyLifecycleOperationState.ABORTED;
      this.operation.reason = 'RESTART_ORIGINAL_STATE_OBSERVED';
      this.operation.updatedAt = this.now();
      this.stats.aborted += 1;
    } else {
      this.operation.state = PartyLifecycleOperationState.FAILED_SAFE;
      this.operation.reason = 'RESTART_PARTY_STATE_AMBIGUOUS_NO_BLIND_RETRY';
      this.operation.updatedAt = this.now();
      this.stats.failedSafe += 1;
      this._recordFailure(this.operation.reason);
    }
    this.lastResult = clone(this.operation);
    this.save();
    return { reconciled: true, operation: clone(this.operation), developmentSession: clone(this.developmentSession) };
  }

  status() {
    const breaker = this.breaker();
    const authority = this.enabled && !breaker.open;
    return {
      mode: CONTROLLED_PARTY_LIFECYCLE_MODE,
      requiredAck: CONTROLLED_PARTY_LIFECYCLE_ACK,
      enabled: this.enabled,
      actionAuthority: authority && this.allowTransitions,
      directGameplayActionAccess: false,
      transitionAuthority: authority && this.allowTransitions,
      developmentRotationAuthority: authority && this.allowDevelopmentRotation,
      maxDevelopmentSlots: 1,
      maxDevelopmentRotationMs: this.maxDevelopmentRotationMs,
      minTransitionIntervalMs: this.minTransitionIntervalMs,
      lastTransitionAt: this.lastTransitionAt || null,
      busy: this.busy,
      operation: clone(this.operation),
      developmentSession: clone(this.developmentSession),
      lastResult: clone(this.lastResult),
      breaker,
      serverChangeAllowed: false,
      smartMoveAllowed: false,
      crossMapRoutingAllowed: false,
      stats: { ...this.stats }
    };
  }
}

module.exports = { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_MODE, CONTROLLED_PARTY_LIFECYCLE_ACK, PartyLifecycleOperationState };

},
"src/party/controlled-paladin-aura-executor.js": function(require,module,exports){
'use strict';

const { AURAS } = require('./paladin-aura-policy');

const CONTROLLED_PALADIN_AURA_MODE = 'controlled-live-default-off';
const CONTROLLED_PALADIN_AURA_ACK = 'ALPHA20_PALADIN_AURA';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

class ControlledPaladinAuraExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.adapter = options.adapter;
    this.auraPolicy = options.auraPolicy;
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'UNKNOWN' }));
    this.getEconomyEmergency = options.getEconomyEmergency || (() => false);
    this.enabled = false;
    this.lastResult = null;
    this.stats = { attempts: 0, changed: 0, rejected: 0 };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'paladin-aura-controlled', event, data, severity, reason });
  }

  _character() { return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null; }

  configure(config = {}) {
    if (config.enabled !== true) return this.disable(config.reason || 'OPERATOR_DISABLED');
    if (config.ack !== CONTROLLED_PALADIN_AURA_ACK) {
      this.stats.rejected += 1;
      this.disable('WRONG_ACK');
      return { ...this.status(), enableRejected: 'WRONG_ACK' };
    }
    this.enabled = true;
    return this.status();
  }

  disable(reason = 'DISABLED') {
    this.enabled = false;
    this._event('PALADIN_AURA_CONTROL_DISABLED', {}, 'info', reason);
    return this.status();
  }

  execute(recommendation, context = {}) {
    const character = this._character();
    const supervisor = this.getSupervisorStatus() || {};
    const reasons = [];
    if (!this.enabled) reasons.push('CONTROLLED_PALADIN_AURA_DISABLED');
    if (this.getMode() !== 'active') reasons.push('RUNTIME_NOT_ACTIVE');
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reasons.push('SUPERVISOR_NOT_HEALTHY');
    if (!character || character.ctype !== 'paladin') reasons.push('LOCAL_PALADIN_REQUIRED');
    if (!character || Number(character.level) < 60) reasons.push('PALADIN_LEVEL_TOO_LOW');
    if (context.inCombat === true || context.highRisk === true || context.emergency === true) reasons.push('UNSAFE_AURA_SWITCH_CONTEXT');
    if (this.getEconomyEmergency() === true) reasons.push('ECONOMY_EMERGENCY');
    const aura = recommendation && recommendation.aura;
    if (!AURAS.includes(aura)) reasons.push('INVALID_AURA');
    if (recommendation && recommendation.canSwitch === false) reasons.push('AURA_HYSTERESIS_HOLD');
    if (this.auraPolicy && this.auraPolicy.lastAura === aura) reasons.push('AURA_ALREADY_ACTIVE');
    if (!this.adapter || typeof this.adapter.command !== 'function') reasons.push('ADAPTER_UNAVAILABLE');
    if (reasons.length) {
      this.stats.rejected += 1;
      this.lastResult = { at: this.now(), executed: false, aura: aura || null, reason: reasons[0], reasons };
      return { ...this.lastResult };
    }

    this.stats.attempts += 1;
    const result = this.adapter.command('use_skill', ['paladin_aura', aura]);
    this.lastResult = { at: this.now(), aura, executed: !!(result && result.executed), reason: result && result.reason || null, shadow: !!(result && result.shadow) };
    if (this.lastResult.executed) {
      if (this.auraPolicy && typeof this.auraPolicy.noteApplied === 'function') this.auraPolicy.noteApplied(aura);
      this.stats.changed += 1;
      this._event('PALADIN_AURA_CONTROLLED_CHANGED', { aura, recommendation });
    }
    return { ...this.lastResult };
  }

  status() {
    return {
      mode: CONTROLLED_PALADIN_AURA_MODE,
      requiredAck: CONTROLLED_PALADIN_AURA_ACK,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      directGameplayActionAccess: false,
      oneAuraPerParty: true,
      allowedAuras: AURAS.slice(),
      lastResult: this.lastResult ? { ...this.lastResult } : null,
      stats: { ...this.stats }
    };
  }
}

module.exports = { ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_MODE, CONTROLLED_PALADIN_AURA_ACK };

},
"src/ops/telemetry-outbox.js": function(require,module,exports){
'use strict';

function cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class TelemetryOutbox {
  constructor(options = {}) {
    this.capacity = Math.max(100, Number(options.capacity) || 2000);
    this.queue = [];
    this.lastCapturedSeq = 0;
    this.dropped = 0;
  }

  capture(log) {
    if (!log || typeof log.query !== 'function') return 0;
    const rows = log.query({ sinceSeq: this.lastCapturedSeq, limit: this.capacity * 2 });
    for (const row of rows) {
      if (!row || !Number.isFinite(Number(row.seq))) continue;
      this.lastCapturedSeq = Math.max(this.lastCapturedSeq, Number(row.seq));
      this.queue.push(cloneJson(row));
    }
    if (this.queue.length > this.capacity) {
      const overflow = this.queue.length - this.capacity;
      this.queue.splice(0, overflow);
      this.dropped += overflow;
    }
    return rows.length;
  }

  drain(limit = 100) {
    const n = Math.max(0, Math.min(this.queue.length, Number(limit) || 0));
    return this.queue.splice(0, n).map(cloneJson);
  }

  peek(limit = 100) {
    const n = Math.max(0, Math.min(this.queue.length, Number(limit) || 0));
    return this.queue.slice(0, n).map(cloneJson);
  }

  status() {
    return {
      queued: this.queue.length,
      capacity: this.capacity,
      dropped: this.dropped,
      lastCapturedSeq: this.lastCapturedSeq || null
    };
  }
}

module.exports = { TelemetryOutbox };

},
"src/ops/control-gateway.js": function(require,module,exports){
'use strict';

const COMMANDS = new Set([
  'SET_MODE',
  'SET_FARMER_ENABLED',
  'SET_TARGET_POLICY',
  'ADD_TARGET_EXCLUSION',
  'REMOVE_TARGET_EXCLUSION',
  'APPROVE_MONSTER_CONTENT',
  'QUARANTINE_MONSTER_CONTENT',
  'SAVE_WORLD',
  'SHOW_STATUS'
]);

function text(value) { return String(value == null ? '' : value).trim(); }
function short(value, max = 500) {
  const out = String(value == null ? '' : value);
  return out.length > max ? out.slice(0, max) + '…' : out;
}

class ControlGateway {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.execute = typeof options.execute === 'function' ? options.execute : (() => { throw new Error('control executor unavailable'); });
    this.allowElevated = options.allowElevated === true;
    this.maxHistory = Math.max(50, Number(options.maxHistory) || 500);
    this.maxTtlMs = Math.max(1000, Number(options.maxTtlMs) || 60000);
    this.history = new Map();
    this.order = [];
  }

  _emit(event, input, result) {
    if (!this.log) return;
    this.log.emit({
      component: 'control',
      event,
      severity: result.status === 'REJECTED' || result.status === 'FAILED' ? 'warn' : 'info',
      reason: result.reason || null,
      data: {
        commandId: input && input.commandId || null,
        action: input && input.action || null,
        status: result.status
      }
    });
  }

  _receipt(result) {
    return {
      commandId: result.commandId || null,
      action: result.action || null,
      status: result.status,
      executedAt: result.executedAt || null,
      reason: result.reason ? short(result.reason) : null
    };
  }

  _remember(id, result) {
    this.history.set(id, this._receipt(result));
    this.order.push(id);
    while (this.order.length > this.maxHistory) {
      const oldest = this.order.shift();
      this.history.delete(oldest);
    }
  }

  _requiresElevated(action, params) {
    if (action === 'SET_MODE' && params && params.mode === 'active') return true;
    if (action === 'SET_FARMER_ENABLED' && params && params.enabled === true) return true;
    if (action === 'SET_TARGET_POLICY' && params && params.policy === 'allow') return true;
    if (action === 'REMOVE_TARGET_EXCLUSION') return true;
    if (action === 'APPROVE_MONSTER_CONTENT') return true;
    return false;
  }

  submit(input = {}) {
    const now = this.now();
    const commandId = text(input.commandId);
    const action = text(input.action).toUpperCase();
    const params = input.params && typeof input.params === 'object' ? input.params : {};
    const issuedAt = Number(input.issuedAt);
    const expiresAt = Number(input.expiresAt);

    if (!commandId || commandId.length > 120) return this._reject(input, 'INVALID_COMMAND_ID');
    if (this.history.has(commandId)) {
      const previous = this.history.get(commandId);
      const result = { ...previous, duplicate: true };
      this._emit('CONTROL_COMMAND_DUPLICATE', input, result);
      return result;
    }
    if (!COMMANDS.has(action)) return this._reject(input, 'ACTION_NOT_ALLOWED');
    if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt < issuedAt) return this._reject(input, 'INVALID_TIME_WINDOW');
    if (expiresAt - issuedAt > this.maxTtlMs) return this._reject(input, 'TTL_TOO_LONG');
    if (now > expiresAt) return this._reject(input, 'COMMAND_EXPIRED', 'EXPIRED');
    if (issuedAt > now + 5000) return this._reject(input, 'COMMAND_FROM_FUTURE');
    if (this._requiresElevated(action, params) && !this.allowElevated) return this._reject(input, 'ELEVATED_CONTROL_DISABLED');

    try {
      const value = this.execute(action, params);
      const result = { commandId, action, status: 'EXECUTED', executedAt: now, value };
      this._remember(commandId, result);
      this._emit('CONTROL_COMMAND_EXECUTED', input, result);
      return result;
    } catch (error) {
      const result = { commandId, action, status: 'FAILED', executedAt: now, reason: short(error && error.message || error) };
      this._remember(commandId, result);
      this._emit('CONTROL_COMMAND_FAILED', input, result);
      return result;
    }
  }

  _reject(input, reason, status = 'REJECTED') {
    const commandId = text(input && input.commandId);
    const action = text(input && input.action).toUpperCase();
    const result = { commandId: commandId || null, action: action || null, status, reason: short(reason), executedAt: this.now() };
    if (commandId) this._remember(commandId, result);
    this._emit(status === 'EXPIRED' ? 'CONTROL_COMMAND_EXPIRED' : 'CONTROL_COMMAND_REJECTED', input, result);
    return result;
  }

  status() {
    return {
      enabled: true,
      allowElevated: this.allowElevated,
      remembered: this.history.size,
      maxHistory: this.maxHistory,
      maxTtlMs: this.maxTtlMs,
      actions: [...COMMANDS]
    };
  }
}

module.exports = { ControlGateway, COMMANDS };

},
"src/ops/state-replica.js": function(require,module,exports){
'use strict';

class StateReplica {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.maxBytes = Math.max(10000, Number(options.maxBytes) || 900000);
    this.latest = null;
    this.lastRevision = -1;
    this.droppedOversize = 0;
    this.captureErrors = 0;
    this.lastError = null;
  }

  capture(world) {
    if (!world || typeof world.serialize !== 'function') return false;
    if (Number(world.revision) === this.lastRevision) return false;
    let serialized;
    try {
      serialized = world.serialize();
    } catch (error) {
      this.captureErrors += 1;
      this.lastError = String(error && error.message || error);
      return false;
    }
    if (serialized.length > this.maxBytes) {
      this.droppedOversize += 1;
      return false;
    }
    this.lastRevision = Number(world.revision);
    this.lastError = null;
    this.latest = {
      revision: this.lastRevision,
      capturedAt: this.now(),
      bytes: serialized.length,
      serialized
    };
    return true;
  }

  peek() {
    return this.latest ? { ...this.latest } : null;
  }

  take() {
    if (!this.latest) return null;
    const value = { ...this.latest };
    this.latest = null;
    return value;
  }

  status() {
    return {
      pending: !!this.latest,
      revision: this.latest ? this.latest.revision : this.lastRevision >= 0 ? this.lastRevision : null,
      bytes: this.latest ? this.latest.bytes : 0,
      maxBytes: this.maxBytes,
      droppedOversize: this.droppedOversize,
      captureErrors: this.captureErrors,
      lastError: this.lastError
    };
  }
}

class HeadlessHealth {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.watchAfterMs = Math.max(1000, Number(options.watchAfterMs) || 10000);
    this.degradedAfterMs = Math.max(this.watchAfterMs, Number(options.degradedAfterMs) || 30000);
    this.lastTickAt = null;
    this.lastSnapshotAt = null;
    this.startedAt = null;
  }

  noteStart() { if (this.startedAt == null) this.startedAt = this.now(); }
  noteTick() { this.lastTickAt = this.now(); }
  noteSnapshot() { this.lastSnapshotAt = this.now(); }

  status() {
    const now = this.now();
    const tickAgeMs = this.lastTickAt == null ? null : Math.max(0, now - this.lastTickAt);
    const snapshotAgeMs = this.lastSnapshotAt == null ? null : Math.max(0, now - this.lastSnapshotAt);
    const age = snapshotAgeMs == null ? (this.startedAt == null ? 0 : Math.max(0, now - this.startedAt)) : snapshotAgeMs;
    let state = 'HEALTHY';
    if (age >= this.degradedAfterMs) state = 'DEGRADED';
    else if (age >= this.watchAfterMs) state = 'WATCH';
    return {
      state,
      headlessCompatible: true,
      domRequired: false,
      dashboardRequired: false,
      tickAgeMs,
      snapshotAgeMs,
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs
    };
  }
}

module.exports = { StateReplica, HeadlessHealth };

},
"src/ops/headless-operations.js": function(require,module,exports){
'use strict';

const { TelemetryOutbox } = require('./telemetry-outbox');
const { ControlGateway } = require('./control-gateway');
const { StateReplica } = require('./state-replica');

class HeadlessOperations {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.runtime = options.runtime || null;
    this.watchAfterMs = Math.max(1000, Number(options.watchAfterMs) || 10000);
    this.degradedAfterMs = Math.max(this.watchAfterMs, Number(options.degradedAfterMs) || 30000);
    this.telemetry = options.telemetry || new TelemetryOutbox({ capacity: options.telemetryCapacity });
    this.replica = options.replica || new StateReplica({ now: this.now, maxBytes: options.replicaMaxBytes });
    this.control = options.control || new ControlGateway({
      now: this.now,
      log: this.log,
      allowElevated: options.allowElevatedControl === true,
      maxHistory: options.controlHistory,
      maxTtlMs: options.controlMaxTtlMs,
      execute: (action, params) => this._execute(action, params)
    });
    this.captureErrors = 0;
  }

  _execute(action, params = {}) {
    const runtime = this.runtime;
    if (!runtime) throw new Error('runtime unavailable');
    if (action === 'SET_MODE') return runtime.setMode(params.mode);
    if (action === 'SET_FARMER_ENABLED') return runtime.setFarmerEnabled(params.enabled === true);
    if (action === 'SET_TARGET_POLICY') return runtime.setFarmerTargetPolicy(params.policy);
    if (action === 'ADD_TARGET_EXCLUSION') return runtime.addFarmerTargetExclusion(params.value);
    if (action === 'REMOVE_TARGET_EXCLUSION') return runtime.removeFarmerTargetExclusion(params.value);
    if (action === 'APPROVE_MONSTER_CONTENT') return runtime.combatRisk.approveMonsterType(runtime.world, params.mtype);
    if (action === 'QUARANTINE_MONSTER_CONTENT') return runtime.combatRisk.quarantineMonsterType(runtime.world, params.mtype);
    if (action === 'SAVE_WORLD') return runtime.persistence.maybeSave(runtime.world, { force: true });
    if (action === 'SHOW_STATUS') return runtime.status();
    throw new Error('unsupported control action');
  }

  _capture() {
    try {
      if (this.log) this.telemetry.capture(this.log);
      if (this.runtime && this.runtime.world) this.replica.capture(this.runtime.world);
    } catch (_) {
      this.captureErrors += 1;
    }
  }

  _healthStatus() {
    const runtime = this.runtime;
    const now = this.now();
    const startedAt = runtime && Number.isFinite(Number(runtime.startedAt)) ? Number(runtime.startedAt) : null;
    const lastHeartbeatAt = runtime && Number.isFinite(Number(runtime.lastHeartbeat)) && Number(runtime.lastHeartbeat) > 0 ? Number(runtime.lastHeartbeat) : null;
    const observedAt = runtime && runtime.lastSnapshot && Number.isFinite(Number(runtime.lastSnapshot.observedAt)) ? Number(runtime.lastSnapshot.observedAt) : null;
    const base = observedAt != null ? observedAt : lastHeartbeatAt != null ? lastHeartbeatAt : startedAt;
    const snapshotAgeMs = observedAt == null ? null : Math.max(0, now - observedAt);
    const heartbeatAgeMs = lastHeartbeatAt == null ? null : Math.max(0, now - lastHeartbeatAt);
    const age = base == null ? 0 : Math.max(0, now - base);
    let state = 'HEALTHY';
    if (age >= this.degradedAfterMs) state = 'DEGRADED';
    else if (age >= this.watchAfterMs) state = 'WATCH';
    return {
      state,
      headlessCompatible: true,
      domRequired: false,
      gameLogRequired: false,
      dashboardRequired: false,
      snapshotAgeMs,
      heartbeatAgeMs,
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs
    };
  }

  submit(command) {
    const result = this.control.submit(command);
    this._capture();
    return result;
  }

  drainTelemetry(limit = 100) { this._capture(); return this.telemetry.drain(limit); }
  peekTelemetry(limit = 100) { this._capture(); return this.telemetry.peek(limit); }
  takeStateReplica() { this._capture(); return this.replica.take(); }
  peekStateReplica() { this._capture(); return this.replica.peek(); }

  status() {
    this._capture();
    return {
      contractVersion: 1,
      transport: 'host-provided',
      captureErrors: this.captureErrors,
      telemetry: this.telemetry.status(),
      control: this.control.status(),
      stateReplica: this.replica.status(),
      health: this._healthStatus()
    };
  }
}

module.exports = { HeadlessOperations };

},
"src/ops/minute-countdown-reporter.js": function(require,module,exports){
'use strict';

class MinuteCountdownReporter {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.emit = typeof options.emit === 'function' ? options.emit : (() => {});
    this.intervalMs = Math.max(60 * 1000, Number(options.intervalMs) || 60 * 1000);
    this.label = options.label || 'Live Gate';
    this.startedAt = null;
    this.durationMs = 0;
    this.lastBucket = null;
    this.completed = false;
  }

  start(durationMs, label = this.label) {
    this.startedAt = this.now();
    this.durationMs = Math.max(0, Number(durationMs) || 0);
    this.label = String(label || this.label);
    this.lastBucket = null;
    this.completed = false;
    this.emit(`[${this.label}] gestartet — ${Math.ceil(this.durationMs / 60000)} Minuten Beobachtung.`);
    return this.status();
  }

  tick(at = this.now()) {
    if (this.startedAt == null || this.completed) return null;
    const elapsed = Math.max(0, Number(at) - this.startedAt);
    const remaining = Math.max(0, this.durationMs - elapsed);
    if (remaining <= 0) {
      this.completed = true;
      this.emit(`[${this.label}] Beobachtung abgeschlossen.`);
      return { type: 'complete', remainingMs: 0 };
    }
    const bucket = Math.ceil(remaining / this.intervalMs);
    if (bucket === this.lastBucket) return null;
    this.lastBucket = bucket;
    if (elapsed < this.intervalMs) return null;
    const minutes = Math.max(1, Math.ceil(remaining / 60000));
    this.emit(`[${this.label}] noch ${minutes} Minute${minutes === 1 ? '' : 'n'}.`);
    return { type: 'countdown', remainingMs: remaining, minutes };
  }

  status(at = this.now()) {
    if (this.startedAt == null) return { active: false, label: this.label, durationMs: this.durationMs, remainingMs: null, completed: this.completed };
    return {
      active: !this.completed,
      label: this.label,
      startedAt: this.startedAt,
      durationMs: this.durationMs,
      remainingMs: Math.max(0, this.durationMs - Math.max(0, Number(at) - this.startedAt)),
      completed: this.completed
    };
  }
}

module.exports = { MinuteCountdownReporter };

},
"src/ops/session-monitor.js": function(require,module,exports){
'use strict';

const MONITOR_SCHEMA_VERSION = 1;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function safeCall(fn, fallback = null) {
  try { return typeof fn === 'function' ? fn() : fallback; } catch (_) { return fallback; }
}
function sessionId(now) {
  return `session-${Number(now()).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class SessionMonitor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.runtime = options.runtime;
    this.operations = options.operations || null;
    this.log = options.log || (this.runtime && this.runtime.log) || null;
    this.now = options.now || (() => Date.now());
    this.version = options.version || null;
    const retainedCapacity = this.log && Number(this.log.capacity);
    this.maxEvents = Math.max(100, Math.min(20000, Math.floor(finite(options.maxEvents, Number.isFinite(retainedCapacity) ? retainedCapacity : 4000))));
    this.maxInventory = Math.max(50, Math.min(1000, Math.floor(finite(options.maxInventory, 400))));
    this.maxTransactions = Math.max(20, Math.min(500, Math.floor(finite(options.maxTransactions, 200))));
    this.maxTravel = Math.max(20, Math.min(300, Math.floor(finite(options.maxTravel, 100))));
    this.maxGoals = Math.max(20, Math.min(300, Math.floor(finite(options.maxGoals, 100))));
    this.id = sessionId(this.now);
    this.startedAt = this.now();
    this.copyStats = { attempts: 0, success: 0, failures: 0, lastMethod: null, lastAt: null };
  }

  _status() {
    const base = safeCall(() => this.runtime.status(), {}) || {};
    if (!this.operations || typeof this.operations.status !== 'function') return base;
    return { ...base, operations: safeCall(() => this.operations.status(), null) };
  }

  _character(status) {
    const c = status && status.character || this.root && this.root.character || {};
    return {
      name: c.name || null,
      ctype: c.ctype || c.type || null,
      level: finite(c.level, 0),
      map: c.map || null,
      x: finite(c.x != null ? c.x : c.real_x, 0),
      y: finite(c.y != null ? c.y : c.real_y, 0),
      hp: finite(c.hp, 0),
      maxHp: finite(c.max_hp, 0),
      mp: finite(c.mp, 0),
      maxMp: finite(c.max_mp, 0),
      xp: finite(c.xp, 0),
      gold: finite(c.gold, 0),
      rip: c.rip === true
    };
  }

  summary() {
    const status = this._status();
    const inventory = status.inventory || {};
    const inventorySummary = inventory.summary || {};
    const economy = status.economy || {};
    const transactions = economy.transactions || {};
    const travel = status.travel || {};
    const supervisor = status.supervisor || {};
    const party = status.party || {};
    const gear = status.gearProgression || {};
    const events = this.log && typeof this.log.list === 'function' ? this.log.list(50) : [];
    const errorEvents = events.filter((row) => row && (row.severity === 'error' || row.severity === 'fatal')).length;
    const warningEvents = events.filter((row) => row && row.severity === 'warn').length;
    return {
      schemaVersion: MONITOR_SCHEMA_VERSION,
      sessionId: this.id,
      startedAt: this.startedAt,
      generatedAt: this.now(),
      version: status.version || this.version,
      running: status.running === true,
      mode: status.mode || null,
      character: this._character(status),
      supervisor: {
        state: supervisor.state || null,
        reasons: Array.isArray(supervisor.reasons) ? supervisor.reasons.slice(0, 16) : [],
        controlledSubsystems: clone(supervisor.controlledSubsystems || null)
      },
      party: {
        mode: party.mode || null,
        actionAuthority: party.actionAuthority === true,
        transitionState: party.transition && party.transition.state || null,
        transitionLive: !!(party.transition && party.transition.liveEnabled)
      },
      economy: {
        live: !!economy.liveEnabled,
        controlled: clone(economy.controlled || null),
        activeTransactions: finite(transactions.active, 0),
        recoveringTransactions: finite(transactions.recovering, 0),
        transactionStates: clone(transactions.states || {}),
        transactionCircuits: clone(transactions.circuits || {})
      },
      travel: {
        active: finite(travel.active, 0),
        states: clone(travel.states || {}),
        circuit: clone(travel.circuit || null),
        controlled: clone(travel.controlled || null)
      },
      inventory: {
        totalEntries: finite(inventorySummary.entries, finite(inventory.stats && inventory.stats.items, 0)),
        capacity: finite(inventory.capacity, 0),
        dispositionCounts: clone(inventorySummary.dispositions || {}),
        pressure: clone(inventorySummary.selfInventory || null),
        stale: inventory.stale === true
      },
      gear: {
        goals: finite(gear.goals, finite(gear.stats && gear.stats.goals, 0)),
        lastEvaluation: clone(gear.lastEvaluation || null)
      },
      recentSignals: { errors: errorEvents, warnings: warningEvents, retainedSample: events.length },
      copy: clone(this.copyStats)
    };
  }

  bundle() {
    const status = this._status();
    const runtime = this.runtime || {};
    const eventLog = this.log && typeof this.log.list === 'function' ? this.log.list(this.maxEvents) : [];
    const eventSummary = this.log && typeof this.log.summary === 'function' ? this.log.summary() : null;
    const inventoryEntries = runtime.inventoryLedger && typeof runtime.inventoryLedger.list === 'function' ? runtime.inventoryLedger.list(this.maxInventory) : [];
    const gearGoals = runtime.gearProgression && typeof runtime.gearProgression.list === 'function' ? runtime.gearProgression.list(this.maxGoals) : [];
    const transactions = runtime.transactionEngine && typeof runtime.transactionEngine.list === 'function' ? runtime.transactionEngine.list(this.maxTransactions) : [];
    const travelPlans = runtime.safeTravel && typeof runtime.safeTravel.list === 'function' ? runtime.safeTravel.list(this.maxTravel) : [];
    const performance = runtime.performance && typeof runtime.performance.status === 'function' ? safeCall(() => runtime.performance.status(), null) : null;
    const registry = runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function' ? safeCall(() => runtime.characterRegistry.status(), null) : null;
    return {
      schemaVersion: MONITOR_SCHEMA_VERSION,
      kind: 'aio-v3-session-log',
      sessionId: this.id,
      startedAt: this.startedAt,
      generatedAt: this.now(),
      durationMs: Math.max(0, this.now() - this.startedAt),
      version: status.version || this.version,
      summary: this.summary(),
      status: clone(status),
      performance: clone(performance),
      characterRegistry: clone(registry),
      inventory: { status: clone(status.inventory || null), entries: clone(inventoryEntries) },
      gearProgression: { status: clone(status.gearProgression || null), goals: clone(gearGoals) },
      economy: { status: clone(status.economy || null), transactions: clone(transactions) },
      travel: { status: clone(status.travel || null), plans: clone(travelPlans) },
      eventLog: {
        summary: clone(eventSummary),
        retained: eventLog.length,
        maxExported: this.maxEvents,
        completeRetainedLog: !eventSummary || eventSummary.retained <= eventLog.length,
        events: clone(eventLog)
      }
    };
  }

  exportSession() {
    return JSON.stringify(this.bundle(), null, 2);
  }

  _document() {
    try {
      if (this.root && this.root.document) return this.root.document;
      if (this.root && this.root.parent && this.root.parent.document) return this.root.parent.document;
    } catch (_) {}
    return null;
  }

  _navigator() {
    try {
      if (this.root && this.root.navigator) return this.root.navigator;
      if (this.root && this.root.parent && this.root.parent.navigator) return this.root.parent.navigator;
    } catch (_) {}
    return null;
  }

  async copyToClipboard() {
    this.copyStats.attempts += 1;
    this.copyStats.lastAt = this.now();
    const text = this.exportSession();
    const nav = this._navigator();
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try {
        await nav.clipboard.writeText(text);
        this.copyStats.success += 1;
        this.copyStats.lastMethod = 'navigator.clipboard';
        return { copied: true, method: 'navigator.clipboard', bytes: text.length };
      } catch (_) {}
    }

    const doc = this._document();
    if (doc && typeof doc.createElement === 'function') {
      let area = null;
      try {
        area = doc.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', 'readonly');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        area.style.left = '-9999px';
        const body = doc.body || doc.documentElement;
        if (body && typeof body.appendChild === 'function') body.appendChild(area);
        if (typeof area.focus === 'function') area.focus();
        if (typeof area.select === 'function') area.select();
        if (typeof area.setSelectionRange === 'function') area.setSelectionRange(0, area.value.length);
        const ok = typeof doc.execCommand === 'function' && doc.execCommand('copy') === true;
        if (area.parentNode) area.parentNode.removeChild(area);
        if (ok) {
          this.copyStats.success += 1;
          this.copyStats.lastMethod = 'execCommand';
          return { copied: true, method: 'execCommand', bytes: text.length };
        }
      } catch (_) {
        try { if (area && area.parentNode) area.parentNode.removeChild(area); } catch (_) {}
      }
    }

    this.copyStats.failures += 1;
    this.copyStats.lastMethod = 'manual';
    return { copied: false, method: 'manual', bytes: text.length, text };
  }

  status() {
    return {
      schemaVersion: MONITOR_SCHEMA_VERSION,
      mode: 'read-only-monitor',
      actionAuthority: false,
      directGameplayActionAccess: false,
      sessionId: this.id,
      startedAt: this.startedAt,
      maxEvents: this.maxEvents,
      copy: clone(this.copyStats)
    };
  }
}

module.exports = { SessionMonitor, MONITOR_SCHEMA_VERSION };

},
"src/ops/debug-monitor-ui.js": function(require,module,exports){
'use strict';

function safeText(value) {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch (_) { return String(value); }
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

class DebugMonitorUI {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.monitor = options.monitor;
    this.log = options.log || null;
    this.refreshMs = Math.max(500, Math.min(10000, Number(options.refreshMs) || 1000));
    this.containerId = options.containerId || 'aio-v3-session-monitor';
    this.minWidth = Math.max(280, Math.min(700, Number(options.minWidth) || 340));
    this.minHeight = Math.max(180, Math.min(600, Number(options.minHeight) || 240));
    this.container = null;
    this.header = null;
    this.body = null;
    this.logBox = null;
    this.copyButton = null;
    this.fallbackArea = null;
    this.resizeHandle = null;
    this.timer = null;
    this.minimized = false;
    this.lastCopy = null;
    this.documentScope = 'none';
    this._interactionCleanup = null;
    this._expandedLayout = null;
  }

  _doc() {
    try {
      if (
        this.root &&
        this.root.parent &&
        this.root.parent !== this.root &&
        this.root.parent.document
      ) {
        this.documentScope = 'parent';
        return this.root.parent.document;
      }
    } catch (_) {}

    try {
      if (this.root && this.root.document) {
        this.documentScope = 'local';
        return this.root.document;
      }
    } catch (_) {}

    this.documentScope = 'none';
    return null;
  }

  _windowForDocument(doc) {
    try {
      if (doc && doc.defaultView) return doc.defaultView;
    } catch (_) {}
    try {
      if (this.root && this.root.parent && this.root.parent.document === doc) return this.root.parent;
    } catch (_) {}
    return this.root || null;
  }

  _viewport(doc) {
    const win = this._windowForDocument(doc);
    const width = Number(win && win.innerWidth) || Number(doc && doc.documentElement && doc.documentElement.clientWidth) || 1280;
    const height = Number(win && win.innerHeight) || Number(doc && doc.documentElement && doc.documentElement.clientHeight) || 720;
    return { width: Math.max(320, width), height: Math.max(240, height) };
  }

  _setStyle(node, styles) {
    if (!node || !node.style) return;
    for (const [key, value] of Object.entries(styles)) node.style[key] = value;
  }

  _button(doc, text, onClick) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = text;
    this._setStyle(button, {
      marginLeft: '7px', padding: '5px 10px', border: '1px solid #666', borderRadius: '4px',
      background: '#222', color: '#eee', cursor: 'pointer', fontSize: '12px'
    });
    button.onclick = onClick;
    button.onmousedown = (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    };
    return button;
  }

  _row(doc, label, value) {
    const row = doc.createElement('div');
    this._setStyle(row, { display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '5px' });
    const l = doc.createElement('span');
    l.textContent = label;
    this._setStyle(l, { color: '#9ca3af', whiteSpace: 'nowrap' });
    const v = doc.createElement('span');
    v.textContent = safeText(value);
    this._setStyle(v, { color: '#f3f4f6', textAlign: 'right', overflowWrap: 'anywhere' });
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  _rect() {
    if (!this.container) return null;
    try {
      if (typeof this.container.getBoundingClientRect === 'function') {
        const rect = this.container.getBoundingClientRect();
        if (rect && Number.isFinite(Number(rect.width)) && Number.isFinite(Number(rect.height))) return rect;
      }
    } catch (_) {}
    const width = parseFloat(this.container.style.width) || 480;
    const height = parseFloat(this.container.style.height) || 420;
    const left = parseFloat(this.container.style.left) || 0;
    const top = parseFloat(this.container.style.top) || 0;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }

  _anchorToPixels(rect) {
    if (!this.container || !rect) return;
    this._setStyle(this.container, {
      left: `${Math.round(rect.left)}px`,
      top: `${Math.round(rect.top)}px`,
      right: 'auto',
      bottom: 'auto',
      width: `${Math.round(rect.width)}px`
    });
  }

  _listenInteraction(doc, onMove, onEnd) {
    if (this._interactionCleanup) this._interactionCleanup();
    if (!doc || typeof doc.addEventListener !== 'function') return false;
    const move = (event) => onMove(event || {});
    const end = (event) => {
      cleanup();
      onEnd(event || {});
    };
    const cleanup = () => {
      if (typeof doc.removeEventListener === 'function') {
        doc.removeEventListener('mousemove', move);
        doc.removeEventListener('mouseup', end);
      }
      if (this._interactionCleanup === cleanup) this._interactionCleanup = null;
    };
    doc.addEventListener('mousemove', move);
    doc.addEventListener('mouseup', end);
    this._interactionCleanup = cleanup;
    return true;
  }

  _beginDrag(event) {
    if (!this.container) return false;
    if (event && Number.isFinite(Number(event.button)) && Number(event.button) !== 0) return false;
    const doc = this._doc();
    const rect = this._rect();
    if (!doc || !rect) return false;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const startX = Number(event && event.clientX) || 0;
    const startY = Number(event && event.clientY) || 0;
    const startLeft = Number(rect.left) || 0;
    const startTop = Number(rect.top) || 0;
    const width = Math.max(this.minWidth, Number(rect.width) || this.minWidth);
    const height = this.minimized
      ? Math.max(1, Number(rect.height) || 1)
      : Math.max(this.minHeight, Number(rect.height) || this.minHeight);
    this._anchorToPixels({ ...rect, width, height });
    if (this.header) this.header.style.cursor = 'grabbing';

    return this._listenInteraction(doc, (moveEvent) => {
      const viewport = this._viewport(doc);
      const dx = (Number(moveEvent.clientX) || 0) - startX;
      const dy = (Number(moveEvent.clientY) || 0) - startY;
      const left = clamp(startLeft + dx, 0, Math.max(0, viewport.width - width));
      const top = clamp(startTop + dy, 0, Math.max(0, viewport.height - height));
      this.container.style.left = `${Math.round(left)}px`;
      this.container.style.top = `${Math.round(top)}px`;
    }, () => {
      if (this.header) this.header.style.cursor = 'move';
    });
  }

  _beginResize(event) {
    if (!this.container || this.minimized) return false;
    if (event && Number.isFinite(Number(event.button)) && Number(event.button) !== 0) return false;
    const doc = this._doc();
    const rect = this._rect();
    if (!doc || !rect) return false;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const startX = Number(event && event.clientX) || 0;
    const startY = Number(event && event.clientY) || 0;
    const startWidth = Math.max(this.minWidth, Number(rect.width) || this.minWidth);
    const startHeight = Math.max(this.minHeight, Number(rect.height) || this.minHeight);
    const left = Math.max(0, Number(rect.left) || 0);
    const top = Math.max(0, Number(rect.top) || 0);
    this._anchorToPixels({ ...rect, left, top, width: startWidth, height: startHeight });
    this.container.style.height = `${Math.round(startHeight)}px`;

    return this._listenInteraction(doc, (moveEvent) => {
      const viewport = this._viewport(doc);
      const dx = (Number(moveEvent.clientX) || 0) - startX;
      const dy = (Number(moveEvent.clientY) || 0) - startY;
      const maxWidth = Math.max(this.minWidth, viewport.width - left);
      const maxHeight = Math.max(this.minHeight, viewport.height - top);
      const width = clamp(startWidth + dx, this.minWidth, maxWidth);
      const height = clamp(startHeight + dy, this.minHeight, maxHeight);
      this.container.style.width = `${Math.round(width)}px`;
      this.container.style.height = `${Math.round(height)}px`;
    }, () => {});
  }

  _setMinimized(minimized) {
    if (!this.container || !this.header) return false;
    const next = minimized === true;
    if (next === this.minimized) return true;

    if (next) {
      const rect = this._rect();
      this._expandedLayout = {
        width: rect ? `${Math.round(Number(rect.width) || this.minWidth)}px` : (this.container.style.width || '480px'),
        height: rect ? `${Math.round(Number(rect.height) || this.minHeight)}px` : (this.container.style.height || `${this.minHeight}px`),
        minHeight: this.container.style.minHeight || `${this.minHeight}px`,
        maxHeight: this.container.style.maxHeight || 'calc(100vh - 36px)',
        overflow: this.container.style.overflow || 'auto',
        headerMarginBottom: this.header.style.marginBottom || '9px'
      };
      this.minimized = true;
      if (this.body) this.body.style.display = 'none';
      if (this.logBox) this.logBox.style.display = 'none';
      if (this.resizeHandle) this.resizeHandle.style.display = 'none';
      if (this.fallbackArea) this.fallbackArea.style.display = 'none';
      this._setStyle(this.container, {
        width: this._expandedLayout.width,
        height: 'auto',
        minHeight: '0px',
        maxHeight: 'none',
        overflow: 'hidden'
      });
      this.header.style.marginBottom = '0px';
      return true;
    }

    this.minimized = false;
    const layout = this._expandedLayout || {};
    this._setStyle(this.container, {
      width: layout.width || this.container.style.width || '480px',
      height: layout.height || `${this.minHeight}px`,
      minHeight: layout.minHeight || `${this.minHeight}px`,
      maxHeight: layout.maxHeight || 'calc(100vh - 36px)',
      overflow: layout.overflow || 'auto'
    });
    this.header.style.marginBottom = layout.headerMarginBottom || '9px';
    if (this.body) this.body.style.display = 'block';
    if (this.logBox) this.logBox.style.display = 'block';
    if (this.resizeHandle) this.resizeHandle.style.display = 'block';
    if (this.fallbackArea) this.fallbackArea.style.display = 'none';
    return true;
  }

  async _copy() {
    if (!this.monitor) return;
    if (this.copyButton) {
      this.copyButton.disabled = true;
      this.copyButton.textContent = 'Kopiere…';
    }
    let result = null;
    try { result = await this.monitor.copyToClipboard(); }
    catch (error) { result = { copied: false, method: 'manual', text: this.monitor.exportSession(), error: String(error && error.message || error) }; }
    this.lastCopy = result;
    if (result && result.copied) {
      if (this.copyButton) {
        this.copyButton.textContent = 'Kopiert ✓';
        this.copyButton.disabled = false;
      }
      if (this.fallbackArea) this.fallbackArea.style.display = 'none';
      const setTimer = (this.root && this.root.setTimeout) || setTimeout;
      setTimer(() => { if (this.copyButton) this.copyButton.textContent = 'Log kopieren'; }, 1800);
      return;
    }

    if (this.fallbackArea) {
      this.fallbackArea.value = result && result.text || this.monitor.exportSession();
      this.fallbackArea.style.display = 'block';
      if (typeof this.fallbackArea.focus === 'function') this.fallbackArea.focus();
      if (typeof this.fallbackArea.select === 'function') this.fallbackArea.select();
      if (typeof this.fallbackArea.setSelectionRange === 'function') this.fallbackArea.setSelectionRange(0, this.fallbackArea.value.length);
    }
    if (this.copyButton) {
      this.copyButton.textContent = 'Strg+C';
      this.copyButton.disabled = false;
    }
  }

  _eventsText() {
    if (!this.log || typeof this.log.list !== 'function') return 'Keine Events';
    const rows = this.log.list(16);
    if (!rows.length) return 'Keine Events';
    return rows.map((row) => {
      const time = row.ts ? String(row.ts).slice(11, 19) : '--:--:--';
      return `${time} ${String(row.severity || 'info').toUpperCase()} ${row.component || '-'} :: ${row.event || '-'}${row.reason ? ` [${row.reason}]` : ''}`;
    }).join('\n');
  }

  refresh() {
    if (!this.container || !this.monitor) return false;
    const doc = this._doc();
    if (!doc || !this.body) return false;
    const summary = this.monitor.summary();
    while (this.body.firstChild) this.body.removeChild(this.body.firstChild);
    const char = summary.character || {};
    const sup = summary.supervisor || {};
    const economy = summary.economy || {};
    const travel = summary.travel || {};
    const inventory = summary.inventory || {};
    const controlledEconomy = economy.controlled || {};
    const controlledTravel = travel.controlled || {};

    const rows = [
      ['Version / Modus', `${summary.version || '—'} / ${summary.mode || '—'}`],
      ['Charakter', `${char.name || '—'} (${char.ctype || '—'}) L${char.level || 0}`],
      ['Map', `${char.map || '—'} @ ${Math.round(char.x || 0)}, ${Math.round(char.y || 0)}`],
      ['Supervisor', `${sup.state || '—'}${sup.reasons && sup.reasons.length ? ` · ${sup.reasons.slice(0, 2).join(', ')}` : ''}`],
      ['Merchant live', controlledEconomy.enabled ? `AN · SELL:${controlledEconomy.sellEnabled ? 'on' : 'off'} BANK:${controlledEconomy.bankEnabled ? 'on' : 'off'}` : 'AUS'],
      ['Travel live', controlledTravel.enabled ? `AN${controlledTravel.busy ? ' · BUSY' : ''}` : 'AUS'],
      ['Transaktionen', `aktiv ${economy.activeTransactions || 0} · recovery ${economy.recoveringTransactions || 0}`],
      ['Travel', `aktiv ${travel.active || 0} · Circuit ${travel.circuit && travel.circuit.open ? 'OPEN' : 'ok'}`],
      ['Inventar', `Einträge ${inventory.totalEntries || 0}${inventory.stale ? ' · STALE' : ''}`],
      ['Log', `Fehler ${summary.recentSignals.errors || 0} · Warn ${summary.recentSignals.warnings || 0}`]
    ];
    for (const [label, value] of rows) this.body.appendChild(this._row(doc, label, value));
    if (this.logBox) this.logBox.textContent = this._eventsText();
    return true;
  }

  show() {
    const doc = this._doc();
    if (!doc || typeof doc.createElement !== 'function') return { shown: false, reason: 'DOM_UNAVAILABLE' };
    if (this.container && this.container.parentNode) {
      this.container.style.display = 'block';
      return { shown: true, reused: true };
    }
    const old = typeof doc.getElementById === 'function' ? doc.getElementById(this.containerId) : null;
    if (old && old.parentNode) old.parentNode.removeChild(old);

    const box = doc.createElement('div');
    box.id = this.containerId;
    this._setStyle(box, {
      position: 'fixed', right: '18px', bottom: '18px', top: 'auto', left: 'auto', width: '480px',
      minWidth: `${this.minWidth}px`, minHeight: `${this.minHeight}px`, maxWidth: 'calc(100vw - 36px)',
      maxHeight: 'calc(100vh - 36px)', boxSizing: 'border-box', overflow: 'auto', zIndex: '2147483646',
      background: 'rgba(10,12,16,0.96)', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,.5)', padding: '11px', fontFamily: 'monospace', fontSize: '12px',
      lineHeight: '1.45', pointerEvents: 'auto'
    });

    const header = doc.createElement('div');
    this.header = header;
    this._setStyle(header, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '9px',
      cursor: 'move', userSelect: 'none', WebkitUserSelect: 'none'
    });
    header.onmousedown = (event) => this._beginDrag(event);

    const title = doc.createElement('strong');
    title.textContent = 'AIO v3 Monitor';
    this._setStyle(title, { fontSize: '14px', color: '#fff' });
    const buttons = doc.createElement('div');
    this._setStyle(buttons, { display: 'flex', alignItems: 'center', flexShrink: '0' });
    buttons.onmousedown = (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    };
    this.copyButton = this._button(doc, 'Log kopieren', () => { this._copy(); });
    const minimize = this._button(doc, '–', () => {
      this._setMinimized(!this.minimized);
      minimize.textContent = this.minimized ? '+' : '–';
    });
    const close = this._button(doc, '×', () => this.hide());
    buttons.appendChild(this.copyButton);
    buttons.appendChild(minimize);
    buttons.appendChild(close);
    header.appendChild(title);
    header.appendChild(buttons);
    box.appendChild(header);

    this.body = doc.createElement('div');
    box.appendChild(this.body);

    this.logBox = doc.createElement('pre');
    this._setStyle(this.logBox, {
      margin: '10px 0 0', padding: '8px', maxHeight: '260px', overflow: 'auto', whiteSpace: 'pre-wrap',
      background: '#05070a', border: '1px solid #374151', borderRadius: '5px', color: '#d1d5db',
      fontSize: '11px', lineHeight: '1.4'
    });
    box.appendChild(this.logBox);

    this.fallbackArea = doc.createElement('textarea');
    this.fallbackArea.setAttribute('readonly', 'readonly');
    this._setStyle(this.fallbackArea, {
      display: 'none', width: '100%', height: '180px', marginTop: '9px', boxSizing: 'border-box',
      background: '#05070a', color: '#fff', border: '1px solid #f59e0b', fontSize: '10px'
    });
    box.appendChild(this.fallbackArea);

    this.resizeHandle = doc.createElement('div');
    this.resizeHandle.setAttribute('aria-label', 'Monitorgröße ändern');
    this.resizeHandle.title = 'Größe ändern';
    this._setStyle(this.resizeHandle, {
      position: 'absolute', right: '2px', bottom: '2px', width: '18px', height: '18px', cursor: 'nwse-resize',
      borderRight: '3px solid #9ca3af', borderBottom: '3px solid #9ca3af', boxSizing: 'border-box', opacity: '0.8'
    });
    this.resizeHandle.onmousedown = (event) => this._beginResize(event);
    box.appendChild(this.resizeHandle);

    const host = doc.body || doc.documentElement;
    if (!host || typeof host.appendChild !== 'function') return { shown: false, reason: 'DOM_HOST_UNAVAILABLE' };
    host.appendChild(box);
    this.container = box;
    this.refresh();
    const setTimer = (this.root && this.root.setInterval) || setInterval;
    this.timer = setTimer(() => this.refresh(), this.refreshMs);
    return { shown: true, reused: false, documentScope: this.documentScope };
  }

  hide() {
    if (this._interactionCleanup) this._interactionCleanup();
    if (this.container) this.container.style.display = 'none';
    return true;
  }

  destroy() {
    if (this._interactionCleanup) this._interactionCleanup();
    const clearTimer = (this.root && this.root.clearInterval) || clearInterval;
    if (this.timer != null) clearTimer(this.timer);
    this.timer = null;
    if (this.container && this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.container = null;
    this.header = null;
    this.body = null;
    this.logBox = null;
    this.copyButton = null;
    this.fallbackArea = null;
    this.resizeHandle = null;
    this._expandedLayout = null;
    return true;
  }

  status() {
    const rect = this._rect();
    return {
      schemaVersion: 1,
      mode: 'read-only-debug-ui',
      actionAuthority: false,
      directGameplayActionAccess: false,
      domAvailable: !!this._doc(),
      documentScope: this.documentScope,
      visible: !!(this.container && this.container.style.display !== 'none'),
      minimized: this.minimized,
      collapsedToTitleBar: this.minimized,
      draggable: true,
      resizable: true,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      layout: rect ? {
        left: Math.round(Number(rect.left) || 0), top: Math.round(Number(rect.top) || 0),
        width: Math.round(Number(rect.width) || 0), height: Math.round(Number(rect.height) || 0)
      } : null,
      refreshMs: this.refreshMs,
      lastCopy: this.lastCopy ? { copied: this.lastCopy.copied === true, method: this.lastCopy.method || null, bytes: this.lastCopy.bytes || null } : null
    };
  }
}

module.exports = { DebugMonitorUI };
}
};
var cache={};
function resolve(from,request){
  var parts=from.split('/');parts.pop();
  request.split('/').forEach(function(p){if(!p||p==='.')return;if(p==='..')parts.pop();else parts.push(p);});
  var id=parts.join('/');if(!/\.js$/.test(id))id+='.js';return id;
}
function load(id){
  if(cache[id])return cache[id].exports;
  if(!modules[id])throw new Error('AiO v3 module not found: '+id);
  var module={exports:{}};cache[id]=module;
  function localRequire(request){return load(resolve(id,request));}
  modules[id](localRequire,module,module.exports);
  return module.exports;
}
var api=load("src/index.js");
api.install(root);
})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));
