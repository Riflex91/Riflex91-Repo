'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { CommandOutcomeTracker, CommandOutcomeState } = require('../src/game/command-outcomes');
const { StabilityGameAdapter } = require('../src/game/stability-adapter');
const { ResilientWorldPersistence } = require('../src/world/resilient-persistence');
const { CombatStabilitySupervisor } = require('../src/stability/combat-stability-supervisor');
const { StabilityRuntime } = require('../src/stability/stability-runtime');
const { TaskState } = require('../src/core/task');

function rootCharacter(overrides = {}) {
  return {
    name: 'FaultProbe', ctype: 'ranger', level: 70, map: 'main',
    real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    range: 120, speed: 40, frequency: 2, xp: 0, gold: 0,
    moving: false, rip: false, items: [],
    ...overrides
  };
}

function adapterRoot(overrides = {}) {
  const root = {
    character: rootCharacter(),
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} },
    move: () => true,
    ...overrides
  };
  root.parent = root.parent || { entities: {}, party: {} };
  return root;
}

test('movement circuit closes after cooldown and allows a fresh verified attempt', () => {
  let now = 10000;
  const root = adapterRoot();
  const adapter = new StabilityGameAdapter({
    root, parent: root.parent, mode: 'active', now: () => now,
    commandOutcomeTimeoutMs: 500, movementMaxFailures: 2, movementCircuitMs: 2000
  });
  adapter.snapshot();
  for (let i = 0; i < 2; i += 1) {
    adapter.command('move', [100, 0]);
    now += 1000;
    adapter.snapshot();
  }
  assert.equal(adapter.stabilityStatus().movement.circuitOpen, true);
  now += 2000;
  assert.equal(adapter.stabilityStatus().movement.circuitOpen, false);
  const attempt = adapter.command('move', [100, 0]);
  assert.equal(attempt.executed, true);
  root.character.real_x = 8;
  now += 100;
  adapter.snapshot();
  const status = adapter.stabilityStatus().movement;
  assert.equal(status.failureStreak, 0);
  assert.equal(status.lastOutcome.state, CommandOutcomeState.CONFIRMED);
});

test('pending movement coalesces repeated travel requests instead of issuing command spam', () => {
  let now = 10000;
  let moveCalls = 0;
  const root = adapterRoot({ move: () => { moveCalls += 1; return true; } });
  const adapter = new StabilityGameAdapter({ root, parent: root.parent, mode: 'active', now: () => now, commandOutcomeTimeoutMs: 2000 });
  adapter.snapshot();
  const first = adapter.command('move', [100, 0]);
  const second = adapter.command('move', [120, 0]);
  assert.equal(first.executed, true);
  assert.equal(second.coalesced, true);
  assert.equal(second.reason, 'MOVE_OUTCOME_PENDING');
  assert.equal(moveCalls, 1);
});

test('command outcome storage remains bounded under long synthetic pressure', () => {
  let now = 1000;
  const tracker = new CommandOutcomeTracker({ now: () => now, capacity: 50, pendingCapacity: 10, defaultTimeoutMs: 500 });
  const snap = {
    character: { name: 'Probe', map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, moving: false, inventory: [] },
    entities: []
  };
  for (let i = 0; i < 500; i += 1) {
    tracker.issue({ action: 'move', args: [100, 0], before: { map: 'main', x: 0, y: 0, moving: false } });
    now += 600;
    tracker.observe(snap);
    tracker.drainTerminal(1000);
  }
  const status = tracker.status();
  assert.ok(status.historySize <= 50);
  assert.ok(status.counts.PENDING <= 10);
  assert.ok(status.droppedHistory > 0);
});

test('successful persistence save closes prior failure circuit state', () => {
  let now = 10000;
  let failWrites = true;
  const storage = {
    get: () => null,
    set: () => {
      if (failWrites) throw new Error('temporary disk fault');
    }
  };
  const persistence = new ResilientWorldPersistence({
    storage, now: () => now, saveCircuitAfter: 2, saveCircuitMs: 2000,
    retryBaseMs: 500, retryMaxMs: 1000
  });
  const world = { revision: 1, serialize: () => '{"schemaVersion":2}' };
  persistence.maybeSave(world, { force: true });
  persistence.maybeSave(world, { force: true });
  assert.equal(persistence.status().saveCircuitOpen, true);
  failWrites = false;
  now += 2000;
  assert.equal(persistence.maybeSave(world, { force: true }), true);
  const status = persistence.status();
  assert.equal(status.saveFailureStreak, 0);
  assert.equal(status.saveCircuitOpen, false);
  assert.equal(status.lastSaveError, null);
});

test('confirmed retreat movement is explicitly marked verified', () => {
  let queue = [];
  const farmer = {
    lastSafeRetreatMove: { at: 1000, emergencyReason: 'CRITICAL_HP' },
    lastSafeRetreatFailure: { reason: 'old' }
  };
  const adapter = {
    stabilityStatus: () => ({ movement: { pendingOutcomeId: 'retreat-1' } }),
    takeCommandOutcomes: () => queue.splice(0)
  };
  const supervisor = new CombatStabilitySupervisor({ runtime: { farmer }, adapter, now: () => 1500 });
  supervisor.process();
  assert.equal(farmer.lastSafeRetreatMove.verificationState, 'PENDING');
  queue.push({ id: 'retreat-1', action: 'move', args: [100, 0], state: CommandOutcomeState.CONFIRMED, reason: 'POSITION_CHANGED', issuedAt: 1000, confirmedAt: 1500, observed: { delta: 10 } });
  supervisor.process();
  assert.equal(farmer.lastSafeRetreatMove.verified, true);
  assert.equal(farmer.lastSafeRetreatMove.verificationState, 'CONFIRMED');
  assert.equal(farmer.lastSafeRetreatFailure, null);
  assert.equal(supervisor.status().retreat.confirmed, 1);
});

test('timed-out retreat remains in recovery and is surfaced as degraded', () => {
  let queue = [];
  let transition = null;
  let event = null;
  const farmer = {
    lastSafeRetreatMove: { at: 1000, emergencyReason: 'CRITICAL_HP', sourceTargetId: 'boss', sourceTargetType: 'boss' },
    lastSafeRetreatFailure: null,
    _transition: (state, reason) => { transition = { state, reason }; },
    _event: (name, severity, reason, data) => { event = { name, severity, reason, data }; }
  };
  const adapter = {
    stabilityStatus: () => ({ movement: { pendingOutcomeId: 'retreat-2' } }),
    takeCommandOutcomes: () => queue.splice(0)
  };
  const supervisor = new CombatStabilitySupervisor({ runtime: { farmer }, adapter, now: () => 2500 });
  supervisor.process();
  queue.push({ id: 'retreat-2', action: 'move', args: [100, 0], state: CommandOutcomeState.TIMED_OUT, reason: 'OBSERVED_EFFECT_TIMEOUT', issuedAt: 1000, confirmedAt: 2500, observed: null });
  supervisor.process();
  assert.equal(farmer.lastSafeRetreatMove.verified, false);
  assert.equal(farmer.lastSafeRetreatMove.verificationState, 'TIMED_OUT');
  assert.equal(farmer.lastSafeRetreatFailure.reason, 'SAFE_RETREAT_OUTCOME_TIMEOUT');
  assert.deepEqual(transition, { state: 'RECOVER', reason: 'EMERGENCY_RETREAT_UNCONFIRMED' });
  assert.equal(event.name, 'FARMER_SAFE_RETREAT_UNCONFIRMED');
  assert.equal(supervisor.status().retreat.timedOut, 1);
});

test('dead character resumes on the same scheduler task after revival', () => {
  let now = 10000;
  const root = adapterRoot();
  root.character.rip = true;
  root.character.hp = 0;
  const runtime = new StabilityRuntime({
    root, parent: root.parent, mode: 'active', now: () => now,
    storage: { get: () => null, set: () => {} }, visibleStatus: false
  });
  runtime.tick();
  const first = runtime.scheduler.activeByOwner.get('FaultProbe');
  assert.ok(first);
  const taskId = first.id;
  assert.equal(first.state, TaskState.WAITING);
  now += 60000;
  root.character.rip = false;
  root.character.hp = 1000;
  runtime.tick();
  const resumed = runtime.scheduler.activeByOwner.get('FaultProbe');
  assert.ok(resumed);
  assert.equal(resumed.id, taskId);
  assert.equal(resumed.retries, 0);
  assert.notEqual(resumed.state, TaskState.FAILED_RETRYABLE);
});

test('synthetic stability soak stays bounded over thousands of shadow ticks', () => {
  let now = 10000;
  const root = adapterRoot();
  const runtime = new StabilityRuntime({
    root, parent: root.parent, mode: 'shadow', now: () => now,
    storage: { get: () => null, set: () => {} }, visibleStatus: false,
    logCapacity: 400
  });
  for (let i = 0; i < 3000; i += 1) {
    now += 250;
    runtime.tick();
  }
  const status = runtime.status();
  assert.ok(runtime.log.list(10000).length <= 400);
  assert.ok(status.scheduler.completed.length <= 200);
  assert.ok(status.stability.commandOutcomes.outcomes.historySize <= 500);
  assert.equal(status.mode, 'shadow');
  assert.equal(JSON.parse(JSON.stringify(status)).mode, 'shadow');
});
