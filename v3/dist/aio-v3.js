/* Adventure Land AiO Bot 3.0.0-alpha.3 | generated | shadow mode by default */
(function(root){
'use strict';
var modules={
"src/index.js": function(require,module,exports){
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
const { FarmerController } = require('./farmer/farmer-fsm');

const VERSION = '3.0.0-alpha.3';

class Runtime {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.root = options.root || globalThis;
    this.log = options.log || new EventLog({ version: VERSION, now: this.now, capacity: options.logCapacity || 4000 });
    this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: options.parent, log: this.log, mode: options.mode || 'shadow', now: this.now });
    this.world = options.world || new WorldModel({ now: this.now, log: this.log });
    this.scheduler = options.scheduler || new Scheduler({ now: this.now, log: this.log });
    this.planner = options.planner || new FarmPlanner({ log: this.log });
    this.farmer = options.farmer || new FarmerController({ now: this.now, log: this.log, planner: this.planner, enabled: options.farmerEnabled !== false });
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

  showStatus() {
    const status = this.status();
    const c = status.character;
    const character = c ? `${c.name} | ${c.ctype} L${c.level} | map=${c.map || 'unknown'}` : 'character=waiting';
    const queued = status.scheduler && status.scheduler.queued ? status.scheduler.queued.length : 0;
    const active = status.scheduler && status.scheduler.active ? status.scheduler.active.length : 0;
    const entities = status.world && Number.isFinite(Number(status.world.entities)) ? Number(status.world.entities) : 0;
    const modeNote = status.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    const farmer = status.farmer || {};
    const farmerText = `farmer=${farmer.enabled ? farmer.state : 'disabled'}${farmer.targetType ? ':' + farmer.targetType : ''}`;
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
    this.lastDiscovery = this.discovery.scan(snapshot, gameData);
    this._announceReady(snapshot);
    this.performance.observe(snapshot, { partyFingerprint: profile.fingerprint, world: this.world, gameData });
    this.farmer.ensureScheduled(this.scheduler, snapshot.character.name);
    this.scheduler.tick({ snapshot, adapter: this.adapter, world: this.world, party: profile, runtime: this });
    this.persistence.maybeSave(this.world);

    if (this.now() - this.lastPlannerAudit >= 15000) {
      this.lastPlannerAudit = this.now();
      const candidates = this._plannerCandidates(snapshot, profile);
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
      farmer: this.farmer.status(),
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
      farmer: this.farmer.status(),
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

const ACTIVE_ALLOWED = new Set(['attack', 'move', 'smart_move', 'town', 'use_hp', 'use_mp', 'use_skill', 'stop']);

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
    const inventory = (c.items || []).map((item, index) => item ? ({ index, name: item.name, level: Number(item.level) || 0, q: Number(item.q) || 1, locked: !!item.l, special: !!item.p }) : null);
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

  _prepareArgs(action, args) {
    const out = Array.isArray(args) ? args.slice() : [];
    if (action === 'attack' && typeof out[0] === 'string') {
      const target = this._entityById(out[0]);
      if (target) out[0] = target;
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
    const fn = this.root[action] || this.parent[action];
    if (typeof fn !== 'function') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'COMMAND_UNAVAILABLE', data: { action } });
      return { executed: false, reason: 'COMMAND_UNAVAILABLE' };
    }
    try {
      const prepared = this._prepareArgs(action, args);
      const value = fn.apply(this.root, prepared);
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', data: { action } });
      return { executed: true, value };
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

  _safeLiveMonsters(snapshot, party) {
    if (!snapshot || !snapshot.character) return [];
    const c = snapshot.character;
    const friendly = new Set([c.name]);
    for (const member of party && party.members || []) if (member && member.name) friendly.add(member.name);
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && entity.hp <= 0)) return false;
      if (entity.map && c.map && entity.map !== c.map) return false;
      if (entity.target && !friendly.has(entity.target)) return false;
      return true;
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

module.exports = { FarmerController, FarmerState, ratio, distance, hasPotion };

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
