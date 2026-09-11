'use strict';

const { Runtime, VERSION } = require('./runtime');
const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { TaskState, createTask } = require('./core/task');
const { WorldModel, KnowledgeState, EvidenceKind } = require('./world/world-model');
const { WorldPersistence } = require('./world/persistence');
const { DiscoveryService } = require('./world/discovery');
const { PerformanceTracker } = require('./telemetry/performance-tracker');
const { ResearchJournal, ExperimentState } = require('./research/research');
const { FarmPlanner } = require('./planner/farm-planner');
const { FarmerController, FarmerState } = require('./farmer/farmer-fsm');
const { partyProfile, capabilitiesFor } = require('./party/capabilities');

function install(root = globalThis, options = {}) {
  if (root.AIO_V3 && root.AIO_V3.__runtime) return root.AIO_V3;
  const runtime = new Runtime({ ...options, root });
  const api = {
    version: VERSION,
    __runtime: runtime,
    start: () => runtime.start(),
    stop: () => runtime.stop(),
    setMode: (mode) => runtime.setMode(mode),
    status: () => runtime.status(),
    showStatus: () => runtime.showStatus(),
    getEvents: (query = 100) => typeof query === 'number' ? runtime.log.list(query) : runtime.log.query(query),
    exportDiagnostics: () => runtime.exportDiagnostics(),
    saveWorld: () => runtime.persistence.maybeSave(runtime.world, { force: true }),
    world: runtime.world,
    scheduler: runtime.scheduler,
    performance: runtime.performance,
    research: runtime.research,
    farmer: {
      enable: () => runtime.setFarmerEnabled(true),
      disable: () => runtime.setFarmerEnabled(false),
      status: () => runtime.farmer.status()
    },
    createTask,
    TaskState
  };
  root.AIO_V3 = api;
  if (root.AIO_V3_AUTOSTART !== false) runtime.start();
  return api;
}

module.exports = {
  install, Runtime, VERSION, EventLog, Scheduler, TaskState, createTask,
  WorldModel, KnowledgeState, EvidenceKind, WorldPersistence, DiscoveryService,
  PerformanceTracker, ResearchJournal, ExperimentState,
  FarmPlanner, FarmerController, FarmerState, partyProfile, capabilitiesFor
};
