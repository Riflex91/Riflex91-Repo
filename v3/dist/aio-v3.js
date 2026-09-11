/* Adventure Land AiO Bot v3.0.0-alpha.1 | generated | shadow mode by default */
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

},
"src/runtime.js": function(require,module,exports){
'use strict';

const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { GameAdapter } = require('./game/adapter');
const { WorldModel, EvidenceKind } = require('./world/world-model');
const { partyProfile } = require('./party/capabilities');
const { FarmPlanner } = require('./planner/farm-planner');

const VERSION = '3.0.0-alpha.1';

class Runtime {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || new EventLog({ version: VERSION, now: this.now, capacity: options.logCapacity || 4000 });
    this.adapter = options.adapter || new GameAdapter({ root: options.root || globalThis, parent: options.parent, log: this.log, mode: options.mode || 'shadow' });
    this.world = options.world || new WorldModel({ now: this.now, log: this.log });
    this.scheduler = options.scheduler || new Scheduler({ now: this.now, log: this.log });
    this.planner = options.planner || new FarmPlanner({ log: this.log });
    this.tickMs = Math.max(100, Number(options.tickMs) || 250);
    this.timer = null;
    this.lastHeartbeat = 0;
    this.lastPlannerAudit = -Infinity;
    this.lastSnapshot = null;
    this.startedAt = null;
  }

  setMode(mode) { return this.adapter.setMode(mode); }

  start() {
    if (this.timer) return false;
    this.startedAt = this.startedAt || this.now();
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STARTED', data: { version: VERSION, mode: this.adapter.mode, tickMs: this.tickMs } });
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return true;
  }

  stop() {
    if (!this.timer) return false;
    clearInterval(this.timer);
    this.timer = null;
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STOPPED' });
    return true;
  }

  _observe(snapshot) {
    if (!snapshot) return;
    const c = snapshot.character;
    this.world.observeEntity('character', c.name, { ctype: c.ctype, level: c.level, map: c.map, rip: c.rip }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
    for (const entity of snapshot.entities) {
      const type = entity.mtype ? 'monster' : entity.npc ? 'npc' : entity.player ? 'player' : entity.type || 'entity';
      const id = entity.mtype || entity.name || entity.id;
      this.world.observeEntity(type, id, { map: entity.map, x: entity.x, y: entity.y, live: !entity.dead }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
    }
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
    const snapshot = this.adapter.snapshot();
    if (!snapshot) {
      if (this.now() - this.lastHeartbeat > 5000) {
        this.lastHeartbeat = this.now();
        this.log.emit({ component: 'runtime', event: 'SNAPSHOT_UNAVAILABLE', severity: 'warn', reason: 'CHARACTER_NOT_READY' });
      }
      return;
    }
    this.lastSnapshot = snapshot;
    this._observe(snapshot);
    const profile = this._partyProfile(snapshot);
    this.scheduler.tick({ snapshot, adapter: this.adapter, world: this.world, party: profile, runtime: this });

    if (this.now() - this.lastPlannerAudit >= 15000) {
      this.lastPlannerAudit = this.now();
      const candidates = this._plannerCandidates(snapshot, profile);
      if (candidates.length) this.planner.rank(candidates, { character: snapshot.character.name, partyFingerprint: profile.fingerprint });
      else this.log.emit({ component: 'planner', event: 'NO_LIVE_FARM_CANDIDATES', character: snapshot.character.name, data: { partyFingerprint: profile.fingerprint } });
    }

    if (this.now() - this.lastHeartbeat >= 5000) {
      this.lastHeartbeat = this.now();
      this.log.emit({ component: 'runtime', event: 'HEARTBEAT', character: snapshot.character.name, data: { mode: this.adapter.mode, map: snapshot.character.map, hp: snapshot.character.hp, mp: snapshot.character.mp, gold: snapshot.character.gold, scheduler: { queued: this.scheduler.queue.length, active: this.scheduler.activeByOwner.size }, world: this.world.summary() } });
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
      world: this.world.summary(),
      eventSummary: this.log.summary()
    };
  }

  exportDiagnostics() {
    return this.log.exportBundle({
      runtime: this.status(),
      snapshot: this.lastSnapshot,
      scheduler: this.scheduler.snapshot(),
      world: this.world.summary()
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
    this.version = options.version || '3.0.0-alpha.1';
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

  summary() {
    const counts = {};
    for (const e of this.events) counts[e.event] = (counts[e.event] || 0) + 1;
    return {
      runId: this.runId,
      retained: this.events.length,
      firstSeq: this.events[0] ? this.events[0].seq : null,
      lastSeq: this.events[this.events.length - 1] ? this.events[this.events.length - 1].seq : null,
      counts
    };
  }

  exportBundle(context = {}) {
    return JSON.stringify({
      manifest: {
        botVersion: this.version,
        schemaVersion: 1,
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
    this.mode = options.mode === 'active' ? 'active' : 'shadow';
    this.lastSnapshot = null;
  }

  _character() { return this.root.character || this.parent.character || null; }
  _entities() { return this.root.parent && this.root.parent.entities || this.parent.entities || {}; }
  _G() { return this.root.G || this.parent.G || {}; }

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
        npc: entity.npc || null,
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
      observedAt: Date.now(),
      character: {
        name: c.name || 'unknown',
        ctype: c.ctype || 'unknown',
        level: Number(c.level) || 0,
        map: c.map || null,
        x: finite(c.real_x != null ? c.real_x : c.x),
        y: finite(c.real_y != null ? c.real_y : c.y),
        hp: finite(c.hp), max_hp: finite(c.max_hp),
        mp: finite(c.mp), max_mp: finite(c.max_mp),
        xp: finite(c.xp), gold: finite(c.gold),
        moving: !!c.moving,
        target: c.target || null,
        rip: !!c.rip,
        inventory
      },
      entities,
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
      const value = fn.apply(this.root, args);
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

function key(type, id) { return `${type}:${id}`; }
function perfKey(monster, fingerprint) { return `${monster}::${fingerprint || 'unknown-party'}`; }

class WorldModel {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.entities = new Map();
    this.performance = new Map();
  }

  observeEntity(type, id, attributes = {}, meta = {}) {
    if (!type || !id) return null;
    const k = key(type, id);
    const current = this.entities.get(k) || { type, id: String(id), facts: {}, firstSeenAt: this.now(), lastSeenAt: 0 };
    current.lastSeenAt = this.now();
    for (const [name, value] of Object.entries(attributes)) {
      current.facts[name] = {
        state: value === undefined || value === null ? KnowledgeState.UNKNOWN : (typeof value === 'boolean' ? (value ? KnowledgeState.KNOWN_TRUE : KnowledgeState.KNOWN_FALSE) : KnowledgeState.KNOWN_TRUE),
        value: value === undefined ? null : value,
        confidence: Math.max(0, Math.min(1, Number(meta.confidence == null ? 1 : meta.confidence))),
        evidence: meta.evidence || EvidenceKind.OBSERVED,
        samples: (current.facts[name] && current.facts[name].samples || 0) + 1,
        updatedAt: this.now()
      };
    }
    this.entities.set(k, current);
    return current;
  }

  hypothesis(type, id, fact, value, confidence = 0.25) {
    return this.observeEntity(type, id, { [fact]: value }, { evidence: EvidenceKind.HYPOTHESIS, confidence });
  }

  fact(type, id, factName) {
    const entity = this.entities.get(key(type, id));
    return entity && entity.facts[factName] || { state: KnowledgeState.UNKNOWN, value: null, confidence: 0, evidence: null, samples: 0, updatedAt: null };
  }

  recordPerformance(monster, fingerprint, sample = {}) {
    if (!monster) return null;
    const k = perfKey(monster, fingerprint);
    const current = this.performance.get(k) || { monster, fingerprint: fingerprint || 'unknown-party', seconds: 0, xp: 0, gold: 0, kills: 0, deaths: 0, potions: 0, windows: 0, updatedAt: 0 };
    current.seconds += Math.max(0, Number(sample.seconds) || 0);
    current.xp += Math.max(0, Number(sample.xp) || 0);
    current.gold += Math.max(0, Number(sample.gold) || 0);
    current.kills += Math.max(0, Number(sample.kills) || 0);
    current.deaths += Math.max(0, Number(sample.deaths) || 0);
    current.potions += Math.max(0, Number(sample.potions) || 0);
    current.windows += 1;
    current.updatedAt = this.now();
    this.performance.set(k, current);
    if (this.log) this.log.emit({ component: 'world', event: 'PERFORMANCE_WINDOW_RECORDED', data: { monster, fingerprint: current.fingerprint, seconds: sample.seconds || 0, xp: sample.xp || 0, gold: sample.gold || 0, kills: sample.kills || 0, deaths: sample.deaths || 0 } });
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
      confidence: Math.max(0, Math.min(1, p.seconds / 1800))
    };
  }

  summary() {
    const evidence = { OBSERVED: 0, INFERRED: 0, HYPOTHESIS: 0, UNKNOWN: 0 };
    for (const entity of this.entities.values()) {
      for (const fact of Object.values(entity.facts)) {
        if (fact.state === KnowledgeState.UNKNOWN) evidence.UNKNOWN += 1;
        else evidence[fact.evidence] = (evidence[fact.evidence] || 0) + 1;
      }
    }
    return { entities: this.entities.size, performanceProfiles: this.performance.size, evidence };
  }

  serialize() {
    return JSON.stringify({ schemaVersion: 1, entities: [...this.entities.entries()], performance: [...this.performance.entries()] });
  }

  restore(serialized) {
    const data = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
    if (!data || data.schemaVersion !== 1) throw new Error('unsupported world model schema');
    this.entities = new Map(data.entities || []);
    this.performance = new Map(data.performance || []);
  }
}

module.exports = { WorldModel, KnowledgeState, EvidenceKind };

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
