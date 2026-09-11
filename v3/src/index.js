'use strict';

const { Runtime, VERSION } = require('./runtime');
const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { TaskState, createTask } = require('./core/task');
const { WorldModel, KnowledgeState, EvidenceKind } = require('./world/world-model');
const { FarmPlanner } = require('./planner/farm-planner');
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
    getEvents: (limit = 100) => runtime.log.list(limit),
    exportDiagnostics: () => runtime.exportDiagnostics(),
    world: runtime.world,
    scheduler: runtime.scheduler,
    createTask,
    TaskState
  };
  root.AIO_V3 = api;
  if (root.AIO_V3_AUTOSTART !== false) runtime.start();
  return api;
}

module.exports = {
  install, Runtime, VERSION, EventLog, Scheduler, TaskState, createTask,
  WorldModel, KnowledgeState, EvidenceKind, FarmPlanner, partyProfile, capabilitiesFor
};
