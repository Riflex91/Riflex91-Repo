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
const { Alpha19Runtime } = require('./autonomy/alpha19-runtime');
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
const { SessionMonitor, MONITOR_SCHEMA_VERSION } = require('./ops/session-monitor');
const { DebugMonitorUI } = require('./ops/debug-monitor-ui');
const { CommandOutcomeTracker, CommandOutcomeState } = require('./game/command-outcomes');
const { StabilityGameAdapter } = require('./game/stability-adapter');
const { CombatStabilitySupervisor } = require('./stability/combat-stability-supervisor');
const { GlobalSupervisor, HealthState } = require('./stability/global-supervisor');

function install(root = globalThis, options = {}) {
  if (root.AIO_V3 && root.AIO_V3.__runtime) return root.AIO_V3;
  const runtime = new Alpha19Runtime({ ...options, root });
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
    return {
      ...runtime.status(),
      operations: operations.status(),
      monitor: monitor.status(),
      debugUI: debugUI.status()
    };
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
        consolidation: {
          status: () => runtime.controlledBankConsolidation.status()
        }
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
  install, Runtime, StabilityRuntime, Alpha9Runtime, Alpha10Runtime, Alpha11Runtime, Alpha12Runtime, Alpha13Runtime, Alpha14Runtime, Alpha15Runtime, Alpha16Runtime, ALPHA16_VERSION, Alpha17Runtime, Alpha18Runtime, ALPHA18_VERSION, Alpha19Runtime, VERSION,
  EventLog, Scheduler, StableScheduler, TaskState, createTask,
  WorldModel, KnowledgeState, EvidenceKind, WorldPersistence, ResilientWorldPersistence, KnowledgeAgingPolicy, DiscoveryService,
  ContentDriftMonitor, ContentLifecycle, CONTENT_DRIFT_SCHEMA_VERSION, stableStringify, fingerprint,
  PerformanceTracker, ResearchJournal, ExperimentState,
  FarmPlanner, LocalFarmPlanner, LocalFarmOrchestrator, FarmerController, FarmerState, TargetPolicy, TargetSafety, BUILT_IN_TARGET_EXCLUSIONS,
  ContentSafetyGate, ContentDisposition, partyProfile, capabilitiesFor, CharacterRegistry, REGISTRY_SCHEMA_VERSION, REGISTRY_MODE, SOURCE_CONFIDENCE,
  FINGERPRINT_SCHEMA_VERSION, createPartyFingerprint, createEncounterFingerprint, PartyPerformanceStore, PARTY_PERFORMANCE_SCHEMA_VERSION,
  PartyOrchestrator, COMBAT_CLASSES, DEFAULT_WEIGHTS, PaladinAuraPolicy, AURAS, PartyTelemetryBridge, TELEMETRY_PROTOCOL,
  PartyTransitionController, TransitionState, PartyControlLease, PARTY_CONTROL_PROTOCOL, PARTY_CONTROL_TYPE, PartyControlAction,
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
  TelemetryOutbox, ControlGateway, StateReplica, HeadlessHealth, HeadlessOperations, BackgroundExecutionGuard,
  CommandOutcomeTracker, CommandOutcomeState, StabilityGameAdapter, CombatStabilitySupervisor, GlobalSupervisor, HealthState
};
