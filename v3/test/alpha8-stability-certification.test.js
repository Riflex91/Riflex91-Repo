'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { CommandOutcomeTracker, CommandOutcomeState } = require('../src/game/command-outcomes');
const { StabilityGameAdapter } = require('../src/game/stability-adapter');
const { StableScheduler } = require('../src/core/stable-scheduler');
const { createTask, TaskState } = require('../src/core/task');
const { ResilientWorldPersistence } = require('../src/world/resilient-persistence');
const { KnowledgeAgingPolicy, installStaleRiskGuard } = require('../src/world/knowledge-aging');
const { StabilityRuntime } = require('../src/stability/stability-runtime');

function snapshot(overrides = {}) {
  return {
    observedAt: 1000,
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main',
      x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      range: 120, speed: 40, frequency: 2, xp: 0, gold: 0,
      moving: false, rip: false, inventory: [],
      ...(overrides.character || {})
    },
    entities: overrides.entities || [],
    objects: [],
    party: [],
    game: { monstersKnown: 0, mapsKnown: 1 }
  };
}

test('CommandOutcomeTracker confirms movement only after observed position progress', () => {
  let now = 1000;
  const tracker = new CommandOutcomeTracker({ now: () => now, moveMinDelta: 4 });
  const issued = tracker.issue({
    action: 'move', args: [100, 0],
    before: { map: 'main', x: 0, y: 0, moving: false }
  });
  tracker.observe(snapshot());
  assert.equal(tracker.get(issued.id).state, CommandOutcomeState.PENDING);
  now += 250;
  tracker.observe(snapshot({ character: { x: 6, y: 0 } }));
  const result = tracker.get(issued.id);
  assert.equal(result.state, CommandOutcomeState.CONFIRMED);
  assert.equal(result.reason, 'POSITION_CHANGED');
});

test('CommandOutcomeTracker times out an accepted command with no observed effect', () => {
  let now = 1000;
  const tracker = new CommandOutcomeTracker({ now: () => now, defaultTimeoutMs: 1000 });
  const issued = tracker.issue({
    action: 'move', args: [100, 0],
    before: { map: 'main', x: 0, y: 0, moving: false }
  });
  now = 2500;
  tracker.observe(snapshot());
  assert.equal(tracker.get(issued.id).state, CommandOutcomeState.TIMED_OUT);
  assert.equal(tracker.status().counts.TIMED_OUT, 1);
});

test('StabilityGameAdapter opens a bounded movement circuit after repeated unverified moves', () => {
  let now = 10000;
  const root = {
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main',
      real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      range: 120, speed: 40, frequency: 2, xp: 0, gold: 0, moving: false, items: []
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} },
    move: () => true
  };
  const adapter = new StabilityGameAdapter({
    root, parent: root.parent, mode: 'active', now: () => now,
    commandOutcomeTimeoutMs: 500, movementMaxFailures: 3, movementCircuitMs: 5000
  });
  adapter.snapshot();
  for (let i = 0; i < 3; i += 1) {
    const request = adapter.command('move', [100, 0]);
    assert.equal(request.executed, true);
    now += 1000;
    adapter.snapshot();
  }
  const status = adapter.stabilityStatus().movement;
  assert.equal(status.failureStreak, 3);
  assert.equal(status.circuitOpen, true);
  const blocked = adapter.command('move', [100, 0]);
  assert.equal(blocked.executed, false);
  assert.equal(blocked.reason, 'MOVEMENT_CIRCUIT_OPEN');
});

test('StabilityGameAdapter resets movement failure streak after observed progress', () => {
  let now = 10000;
  const root = {
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main',
      real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      range: 120, speed: 40, frequency: 2, xp: 0, gold: 0, moving: false, items: []
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} },
    move: () => true
  };
  const adapter = new StabilityGameAdapter({ root, parent: root.parent, mode: 'active', now: () => now, commandOutcomeTimeoutMs: 500 });
  adapter.snapshot();
  adapter.command('move', [100, 0]);
  now += 1000;
  adapter.snapshot();
  assert.equal(adapter.stabilityStatus().movement.failureStreak, 1);
  adapter.command('move', [100, 0]);
  root.character.real_x = 10;
  now += 100;
  adapter.snapshot();
  assert.equal(adapter.stabilityStatus().movement.failureStreak, 0);
  assert.equal(adapter.stabilityStatus().movement.lastOutcome.state, CommandOutcomeState.CONFIRMED);
});

test('StableScheduler does not churn retries during an explicit stable wait', () => {
  let now = 1000;
  const scheduler = new StableScheduler({ now: () => now });
  const task = createTask({
    id: 'stable-wait', owner: 'Probe', type: 'FARMER_FSM', createdAt: now,
    stallMs: 1000, timeoutMs: Infinity, maxRetries: 2,
    progress: () => 'same',
    step: () => ({ state: TaskState.WAITING, reason: 'CHARACTER_DEAD', stableWait: true })
  });
  scheduler.submit(task);
  scheduler.tick({});
  now += 30000;
  scheduler.tick({});
  const active = scheduler.activeByOwner.get('Probe');
  assert.ok(active);
  assert.equal(active.state, TaskState.WAITING);
  assert.equal(active.retries, 0);
  assert.equal(scheduler.completed.length, 0);
});

test('StableScheduler resumes with a fresh stall window after stable wait resolves', () => {
  let now = 1000;
  let waiting = true;
  const scheduler = new StableScheduler({ now: () => now });
  const task = createTask({
    id: 'resume-wait', owner: 'Probe', type: 'FARMER_FSM', createdAt: now,
    stallMs: 1000, timeoutMs: Infinity, maxRetries: 1,
    progress: () => 'same',
    step: () => waiting
      ? ({ state: TaskState.WAITING, reason: 'NO_SNAPSHOT', stableWait: true })
      : ({ state: TaskState.RUNNING })
  });
  scheduler.submit(task);
  scheduler.tick({});
  now += 5000;
  waiting = false;
  scheduler.tick({});
  const active = scheduler.activeByOwner.get('Probe');
  assert.equal(active.state, TaskState.RUNNING);
  assert.equal(active.retries, 0);
  assert.equal(active.lastProgressAt, now);
});

test('ResilientWorldPersistence retries a failed load instead of permanently marking it loaded', () => {
  let now = 10000;
  let reads = 0;
  const storage = {
    get: () => {
      reads += 1;
      if (reads === 1) throw new Error('temporary read failure');
      return null;
    },
    set: () => {}
  };
  const persistence = new ResilientWorldPersistence({ storage, now: () => now, retryBaseMs: 1000, retryMaxMs: 4000 });
  const world = { revision: 0, restore: () => {} };
  assert.equal(persistence.load(world), false);
  assert.equal(persistence.status().loadComplete, false);
  assert.equal(persistence.status().loadFailureStreak, 1);
  assert.equal(persistence.load(world), false);
  assert.equal(reads, 1);
  now += 1000;
  assert.equal(persistence.load(world), false);
  assert.equal(reads, 2);
  assert.equal(persistence.status().loadComplete, true);
  assert.equal(persistence.status().loaded, true);
});

test('ResilientWorldPersistence opens a save circuit after repeated write failures', () => {
  let now = 10000;
  const storage = { get: () => null, set: () => { throw new Error('disk unavailable'); } };
  const persistence = new ResilientWorldPersistence({
    storage, now: () => now, saveCircuitAfter: 3, saveCircuitMs: 10000,
    retryBaseMs: 1000, retryMaxMs: 4000
  });
  const world = { revision: 1, serialize: () => '{"schemaVersion":2}' };
  for (let i = 0; i < 3; i += 1) persistence.maybeSave(world, { force: true });
  const status = persistence.status();
  assert.equal(status.saveFailureStreak, 3);
  assert.equal(status.saveCircuitOpen, true);
  assert.ok(status.saveCircuitUntil > now);
});

test('KnowledgeAgingPolicy reduces stale confidence and marks revalidation', () => {
  let now = 100000;
  const policy = new KnowledgeAgingPolicy({ now: () => now, freshMs: 1000, staleMs: 5000, minFreshness: 0.1 });
  const fresh = policy.apply({ confidence: 0.8, updatedAt: 99500 });
  assert.equal(fresh.confidence, 0.8);
  assert.equal(fresh.needsRevalidation, false);
  const stale = policy.apply({ confidence: 0.8, updatedAt: 90000 });
  assert.equal(stale.stale, true);
  assert.equal(stale.needsRevalidation, true);
  assert.equal(stale.confidence, 0.08);
});

test('stale learned performance adds conservative new-pull risk', () => {
  const policy = new KnowledgeAgingPolicy({ now: () => 10000, freshMs: 1000, staleMs: 5000, minFreshness: 0.1 });
  const world = {
    performanceFor: () => ({ confidence: 0.08, baseConfidence: 0.8, ageMs: 10000, freshness: 0.1, needsRevalidation: true })
  };
  const risk = {
    threshold: 0.65,
    evaluate: () => ({ allowed: true, score: 0, threshold: 0.65, reason: 'RISK_ACCEPTABLE', signals: {} }),
    status: () => ({ threshold: 0.65 })
  };
  installStaleRiskGuard(risk, world, policy, { weight: 0.25 });
  const result = risk.evaluate({ mtype: 'goo', target: null }, { character: { name: 'Probe' } }, world, { fingerprint: 'solo' });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'RISK_ACCEPTABLE_STALE_KNOWLEDGE');
  assert.ok(result.score > 0);
  assert.equal(result.signals.performanceNeedsRevalidation, true);
});

test('StabilityRuntime keeps a dead farmer task in stable wait without retry churn', () => {
  let now = 10000;
  const root = {
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0,
      hp: 0, max_hp: 1000, mp: 500, max_mp: 500, range: 120, speed: 40, frequency: 2,
      xp: 0, gold: 0, moving: false, rip: true, items: []
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} }
  };
  const storage = { get: () => null, set: () => {} };
  const runtime = new StabilityRuntime({ root, parent: root.parent, mode: 'active', now: () => now, storage, visibleStatus: false });
  runtime.tick();
  let active = runtime.scheduler.activeByOwner.get('Probe');
  assert.ok(active);
  assert.equal(active.state, TaskState.WAITING);
  assert.equal(active.retries, 0);
  now += 30000;
  runtime.tick();
  active = runtime.scheduler.activeByOwner.get('Probe');
  assert.ok(active);
  assert.equal(active.state, TaskState.WAITING);
  assert.equal(active.retries, 0);
});

test('StabilityRuntime audits operator announcements without game_log or DOM', () => {
  const root = {
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, range: 120, speed: 40, frequency: 2,
      xp: 0, gold: 0, moving: false, rip: false, items: []
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} }
  };
  const runtime = new StabilityRuntime({ root, parent: root.parent, mode: 'shadow', storage: { get: () => null, set: () => {} }, visibleStatus: false });
  runtime.setMode('shadow');
  const events = runtime.log.query({ event: 'VISIBLE_MODE_CHANGED', limit: 10 });
  assert.equal(events.length, 1);
  assert.equal(events[0].data.visibleMirror, false);
});

test('skill outcome timeout is converted into conservative failure backoff', () => {
  let now = 10000;
  const root = {
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, range: 120, speed: 40, frequency: 2,
      xp: 0, gold: 0, moving: false, rip: false, items: []
    },
    parent: { entities: { m1: { id: 'm1', type: 'monster', mtype: 'goo', map: 'main', real_x: 50, real_y: 0, hp: 1000, max_hp: 1000 } }, party: {} },
    G: { monsters: { goo: { xp: 10 } }, maps: { main: {} }, skills: { burst: { type: 'skill', hostile: true, target: true, class: ['ranger'], mp: 20, level: 1, damage_multiplier: 2 } } },
    use_skill: () => true
  };
  const runtime = new StabilityRuntime({
    root, parent: root.parent, mode: 'active', now: () => now,
    storage: { get: () => null, set: () => {} }, visibleStatus: false,
    commandOutcomeTimeoutMs: 500
  });
  runtime.adapter.snapshot();
  const command = runtime.adapter.command('use_skill', ['burst', 'm1']);
  assert.equal(command.executed, true);
  now += 1000;
  runtime.adapter.snapshot();
  runtime.stability.process();
  const backoffs = runtime.farmer._skillFailureBackoffStatus(now);
  assert.equal(backoffs.length, 1);
  assert.equal(backoffs[0].skill, 'burst');
});

test('StabilityRuntime status remains JSON serializable with all stability layers enabled', () => {
  const root = {
    character: {
      name: 'Probe', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, range: 120, speed: 40, frequency: 2,
      xp: 0, gold: 0, moving: false, rip: false, items: []
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} }
  };
  const runtime = new StabilityRuntime({ root, parent: root.parent, mode: 'shadow', storage: { get: () => null, set: () => {} }, visibleStatus: false });
  runtime.tick();
  const serialized = JSON.stringify(runtime.status());
  assert.ok(serialized.length > 0);
  assert.equal(runtime.status().stability.stableScheduler, true);
});
