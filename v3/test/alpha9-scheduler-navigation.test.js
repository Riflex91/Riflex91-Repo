'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha9Runtime, EvidenceKind } = require('../src');

function rootFixture() {
  let moveCalls = 0;
  const root = {
    character: {
      name: 'SchedulerNavProbe', ctype: 'ranger', level: 70, map: 'main',
      real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      xp: 0, gold: 0, items: [], speed: 40, range: 120, frequency: 2, rip: false
    },
    parent: { entities: {}, party: {} },
    G: {
      monsters: { goo: { xp: 10, attack: 1, frequency: 1 } },
      maps: { main: { monsters: [{ type: 'goo', boundary: [300, 0, 400, 100] }] } },
      skills: {}
    },
    move: () => { moveCalls += 1; return true; }
  };
  return { root, moveCalls: () => moveCalls };
}

function approve(runtime, monster) {
  runtime.world.observeEntity('monster-policy', monster, { contentSafetyDisposition: 'APPROVED' }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
}

test('active local navigation is queued by runtime and executed only from the scheduler-owned Farmer tick', () => {
  let now = 10000;
  const fixture = rootFixture();
  const runtime = new Alpha9Runtime({
    root: fixture.root,
    parent: fixture.root.parent,
    mode: 'active',
    now: () => now,
    storage: { get: () => null, set: () => {} },
    visibleStatus: false
  });
  approve(runtime, 'goo');

  runtime.tick();
  assert.equal(fixture.moveCalls(), 0, 'runtime planning phase must not call move directly');
  assert.ok(runtime.status().localFarming.pendingSchedulerMove);
  assert.equal(runtime.status().localFarming.schedulerOwned, true);

  now += 250;
  runtime.tick();
  assert.equal(fixture.moveCalls(), 1, 'next scheduler-owned Farmer step executes the queued move');
  assert.equal(runtime.status().localFarming.pendingSchedulerMove, null);
  assert.equal(runtime.status().localFarming.lastSchedulerExecution.executed, true);
});

test('a newly visible safe combat target cancels queued local spawn movement before execution', () => {
  let now = 10000;
  const fixture = rootFixture();
  const runtime = new Alpha9Runtime({
    root: fixture.root,
    parent: fixture.root.parent,
    mode: 'active',
    now: () => now,
    storage: { get: () => null, set: () => {} },
    visibleStatus: false
  });
  approve(runtime, 'goo');
  runtime.tick();
  assert.ok(runtime.status().localFarming.pendingSchedulerMove);

  fixture.root.parent.entities.goo1 = {
    id: 'goo1', type: 'monster', mtype: 'goo', map: 'main',
    x: 80, y: 0, hp: 100, max_hp: 100, target: null
  };
  now += 250;
  runtime.tick();
  assert.equal(fixture.moveCalls(), 0);
  assert.equal(runtime.status().localFarming.pendingSchedulerMove, null);
  assert.ok(['SAFE_LIVE_TARGET_PRIORITY', 'COMBAT_TARGET_PRIORITY', 'FARMER_ENGAGE_PRIORITY', 'FARMER_TRAVEL_PRIORITY'].includes(runtime.status().localFarming.lastSchedulerExecution.reason));
});

test('emergency/recovery state outranks queued local farming movement', () => {
  let now = 10000;
  const fixture = rootFixture();
  const runtime = new Alpha9Runtime({
    root: fixture.root,
    parent: fixture.root.parent,
    mode: 'active',
    now: () => now,
    storage: { get: () => null, set: () => {} },
    visibleStatus: false
  });
  approve(runtime, 'goo');
  runtime.tick();
  assert.ok(runtime.status().localFarming.pendingSchedulerMove);

  runtime.pendingEmergencyRetreat = {
    at: now,
    reason: 'CRITICAL_HP',
    hpRatio: 0.3,
    sourceTargetId: null,
    sourceTargetType: null,
    threats: []
  };
  fixture.root.character.hp = 300;
  now += 250;
  runtime.tick();
  assert.equal(fixture.moveCalls(), 0);
  assert.equal(runtime.status().localFarming.pendingSchedulerMove, null);
  assert.notEqual(runtime.status().localFarming.lastSchedulerExecution.reason, 'SCHEDULER_OWNED_LOCAL_MOVE');
});

test('shadow local farming remains preview-only and never queues a scheduler movement command', () => {
  let now = 10000;
  const fixture = rootFixture();
  const runtime = new Alpha9Runtime({
    root: fixture.root,
    parent: fixture.root.parent,
    mode: 'shadow',
    now: () => now,
    storage: { get: () => null, set: () => {} },
    visibleStatus: false
  });
  approve(runtime, 'goo');
  for (let i = 0; i < 5; i += 1) {
    runtime.tick();
    now += 250;
  }
  assert.equal(fixture.moveCalls(), 0);
  assert.equal(runtime.status().localFarming.pendingSchedulerMove, null);
  assert.equal(runtime.status().localFarming.schedulerOwned, true);
  assert.equal(runtime.status().mode, 'shadow');
});
