'use strict';

const { Runtime, VERSION } = require('./runtime');
const { StabilityRuntime } = require('./stability/stability-runtime');
const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { StableScheduler } = require('./core/stable-scheduler');
const { TaskState, createTask } = require('./core/task');
const { WorldModel, KnowledgeState, EvidenceKind } = require('./world/world-model');
const { WorldPersistence } = require('./world/persistence');
const { ResilientWorldPersistence } = require('./world/resilient-persistence');
const { KnowledgeAgingPolicy } = require('./world/knowledge-aging');
const { DiscoveryService } = require('./world/discovery');
const { PerformanceTracker } = require('./telemetry/performance-tracker');
const { ResearchJournal, ExperimentState } = require('./research/research');
const { FarmPlanner } = require('./planner/farm-planner');
const { FarmerController, FarmerState, TargetPolicy } = require('./farmer/farmer-fsm');
const { TargetSafety, BUILT_IN_TARGET_EXCLUSIONS } = require('./farmer/target-safety');
const { ContentSafetyGate, ContentDisposition } = require('./farmer/content-safety');
const { partyProfile, capabilitiesFor } = require('./party/capabilities');
const { TelemetryOutbox } = require('./ops/telemetry-outbox');
const { ControlGateway } = require('./ops/control-gateway');
const { StateReplica, HeadlessHealth } = require('./ops/state-replica');
const { HeadlessOperations } = require('./ops/headless-operations');
const { CommandOutcomeTracker, CommandOutcomeState } = require('./game/command-outcomes');
const { StabilityGameAdapter } = require('./game/stability-adapter');
const { CombatStabilitySupervisor } = require('./stability/combat-stability-supervisor');

function install(root = globalThis, options = {}) {
  if (root.AIO_V3 && root.AIO_V3.__runtime) return root.AIO_V3;
  const runtime = new StabilityRuntime({ ...options, root });
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

  function status() {
    return { ...runtime.status(), operations: operations.status() };
  }

  function exportDiagnostics() {
    const base = JSON.parse(runtime.exportDiagnostics());
    base.context = base.context || {};
    base.context.operations = operations.status();
    return JSON.stringify(base, null, 2);
  }

  const api = {
    version: VERSION,
    __runtime: runtime,
    __operations: operations,
    start: () => runtime.start(),
    stop: () => runtime.stop(),
    setMode: (mode) => runtime.setMode(mode),
    status,
    showStatus: () => { runtime.showStatus(); return status(); },
    getEvents: (query = 100) => typeof query === 'number' ? runtime.log.list(query) : runtime.log.query(query),
    exportDiagnostics,
    saveWorld: () => runtime.persistence.maybeSave(runtime.world, { force: true }),
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
  if (root.AIO_V3_AUTOSTART !== false) runtime.start();
  return api;
}

module.exports = {
  install, Runtime, StabilityRuntime, VERSION, EventLog, Scheduler, StableScheduler, TaskState, createTask,
  WorldModel, KnowledgeState, EvidenceKind, WorldPersistence, ResilientWorldPersistence, KnowledgeAgingPolicy, DiscoveryService,
  PerformanceTracker, ResearchJournal, ExperimentState,
  FarmPlanner, FarmerController, FarmerState, TargetPolicy, TargetSafety, BUILT_IN_TARGET_EXCLUSIONS,
  ContentSafetyGate, ContentDisposition, partyProfile, capabilitiesFor,
  TelemetryOutbox, ControlGateway, StateReplica, HeadlessHealth, HeadlessOperations,
  CommandOutcomeTracker, CommandOutcomeState, StabilityGameAdapter, CombatStabilitySupervisor
};
