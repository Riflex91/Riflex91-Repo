'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  Alpha9Runtime,
  LocalFarmPlanner,
  LocalFarmOrchestrator,
  WorldModel,
  ContentSafetyGate
} = require('../src');

function character(overrides = {}) {
  return {
    name: 'Alpha9', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    speed: 40, range: 120, frequency: 2,
    xp: 0, gold: 0, items: [], rip: false, moving: false,
    ...overrides
  };
}

function gameData(monsters = [
  { type: 'goo', boundary: [400, -50, 500, 50] }
]) {
  return {
    monsters: {
      goo: { xp: 100 },
      crab: { xp: 500 },
      unknownboss: { xp: 999999 }
    },
    maps: { main: { monsters }, other: { monsters: [] } },
    skills: {}
  };
}

function approve(world, mtype, now = () => 1) {
  const gate = new ContentSafetyGate({ now });
  return gate.approve(world, mtype);
}

function snapshot(overrides = {}) {
  return {
    observedAt: 1,
    character: character(overrides.character || {}),
    entities: overrides.entities || [],
    objects: [],
    party: []
  };
}

function fakeRuntime(adapter, farmer = {}) {
  return {
    adapter,
    farmer: {
      state: 'REASSESS',
      targetId: null,
      ...farmer
    },
    planner: {
      rank(rows) {
        return rows.map((row) => ({ ...row, score: row.monster === 'crab' ? 1 : 0.5 }))
          .sort((a, b) => b.score - a.score);
      }
    }
  };
}

test('LocalFarmPlanner extracts same-map spawn centers and rejects unapproved content', () => {
  const world = new WorldModel();
  approve(world, 'goo');
  const planner = new LocalFarmPlanner();
  const rows = planner.spawnCandidates(
    snapshot(),
    gameData([
      { type: 'goo', boundary: [400, -50, 500, 50] },
      { type: 'unknownboss', boundary: [900, 900, 1100, 1100] }
    ]),
    world,
    { fingerprint: 'solo:ranger' }
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].monster, 'goo');
  assert.equal(rows[0].x, 450);
  assert.equal(rows[0].y, 0);
  assert.equal(rows[0].contentDisposition, 'APPROVED');
});

test('LocalFarmOrchestrator previews bounded repositioning in shadow without executing movement', () => {
  let moveCalls = 0;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'shadow',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command(action, args) {
      assert.equal(action, 'move');
      moveCalls += 1;
      return { executed: false, shadow: true, action, args };
    }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => 10000 });
  const runtime = fakeRuntime(adapter);
  const decision = orchestrator.tick({
    runtime,
    snapshot: snapshot(),
    world,
    party: { fingerprint: 'solo:ranger' },
    gameData: gameData()
  });
  assert.equal(decision.action, 'SHADOW_MOVE');
  assert.equal(moveCalls, 1);
  assert.equal(orchestrator.status().currentPlan.monster, 'goo');
  assert.ok(orchestrator.status().lastMove.step <= 120);
});

test('LocalFarmOrchestrator active movement is bounded and pending outcomes suppress command spam', () => {
  let now = 10000;
  let calls = 0;
  let pending = null;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'active',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: pending } }),
    command() {
      calls += 1;
      pending = `move-${calls}`;
      return { executed: true, accepted: true, outcomeId: pending, outcomeState: 'PENDING' };
    }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => now, moveCooldownMs: 500 });
  const runtime = fakeRuntime(adapter);
  const context = { runtime, snapshot: snapshot(), world, party: { fingerprint: 'solo:ranger' }, gameData: gameData() };
  const first = orchestrator.tick(context);
  now += 1000;
  const second = orchestrator.tick(context);
  assert.equal(first.action, 'MOVE');
  assert.equal(second.reason, 'MOVE_OUTCOME_PENDING');
  assert.equal(calls, 1);
  assert.ok(orchestrator.status().lastMove.step <= 120);
});

test('LocalFarmOrchestrator always yields to any visible live monster, including unknown content', () => {
  let calls = 0;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'active',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command() { calls += 1; return { executed: true }; }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => 10000 });
  const decision = orchestrator.tick({
    runtime: fakeRuntime(adapter),
    snapshot: snapshot({ entities: [{ id: 'boss', mtype: 'unknownboss', map: 'main', x: 50, y: 0, hp: 100, target: null }] }),
    world,
    party: { fingerprint: 'solo:ranger' },
    gameData: gameData()
  });
  assert.equal(decision.action, 'YIELD');
  assert.equal(decision.reason, 'VISIBLE_MONSTER_PRESENT');
  assert.equal(calls, 0);
});

test('LocalFarmOrchestrator does not reposition while HP recovery is required', () => {
  let calls = 0;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'active',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command() { calls += 1; return { executed: true }; }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => 10000, engageHpRatio: 0.7 });
  const decision = orchestrator.tick({
    runtime: fakeRuntime(adapter),
    snapshot: snapshot({ character: { hp: 500, max_hp: 1000 } }),
    world,
    party: { fingerprint: 'solo:ranger' },
    gameData: gameData()
  });
  assert.equal(decision.reason, 'HP_RECOVERY_REQUIRED');
  assert.equal(calls, 0);
});

test('LocalFarmOrchestrator respects the alpha.8 movement circuit', () => {
  let calls = 0;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'active',
    stabilityStatus: () => ({ movement: { circuitOpen: true, pendingOutcomeId: null, circuitUntil: 20000 } }),
    command() { calls += 1; return { executed: true }; }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => 10000 });
  const decision = orchestrator.tick({
    runtime: fakeRuntime(adapter), snapshot: snapshot(), world,
    party: { fingerprint: 'solo:ranger' }, gameData: gameData()
  });
  assert.equal(decision.reason, 'MOVEMENT_CIRCUIT_OPEN');
  assert.equal(calls, 0);
  assert.equal(orchestrator.status().stats.circuitWaits, 1);
});

test('LocalFarmOrchestrator aborts a plan after bounded no-progress and enters replan cooldown', () => {
  let now = 10000;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'active',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command() { return { executed: true, outcomeId: `m-${now}`, outcomeState: 'PENDING' }; }
  };
  const orchestrator = new LocalFarmOrchestrator({
    now: () => now,
    noProgressMs: 5000,
    replanCooldownMs: 3000,
    moveCooldownMs: 500
  });
  const runtime = fakeRuntime(adapter);
  const context = { runtime, snapshot: snapshot(), world, party: { fingerprint: 'solo:ranger' }, gameData: gameData() };
  orchestrator.tick(context);
  now += 6000;
  const aborted = orchestrator.tick(context);
  assert.equal(aborted.action, 'ABORT');
  assert.equal(aborted.reason, 'NO_PROGRESS');
  assert.equal(orchestrator.status().currentPlan, null);
  assert.equal(orchestrator.status().stats.noProgressAborts, 1);
  now += 1000;
  const cooldown = orchestrator.tick(context);
  assert.equal(cooldown.reason, 'REPLAN_COOLDOWN');
});

test('LocalFarmOrchestrator holds a plan through minimum hold time and only switches for material improvement later', () => {
  let now = 10000;
  let better = false;
  const world = new WorldModel();
  approve(world, 'goo');
  approve(world, 'crab');
  const planner = {
    rank() {
      const goo = { monster: 'goo', map: 'main', x: 500, y: 0, spawnIndex: 0, score: 1, source: 'test', contentDisposition: 'APPROVED' };
      const crab = { monster: 'crab', map: 'main', x: 700, y: 0, spawnIndex: 1, score: better ? 1.5 : 0.8, source: 'test', contentDisposition: 'APPROVED' };
      return better ? [crab, goo] : [goo, crab];
    },
    materiallyBetter(current, candidate) {
      return Number(candidate.score) >= Number(current.score) * 1.2;
    }
  };
  const adapter = {
    mode: 'shadow',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command() { return { executed: false, shadow: true }; }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => now, planner, minHoldMs: 5000, moveCooldownMs: 500 });
  const runtime = fakeRuntime(adapter);
  const context = { runtime, snapshot: snapshot(), world, party: { fingerprint: 'solo:ranger' }, gameData: gameData() };
  orchestrator.tick(context);
  const firstId = orchestrator.status().currentPlan.id;
  better = true;
  now += 3000;
  orchestrator.tick(context);
  assert.equal(orchestrator.status().currentPlan.id, firstId);
  assert.equal(orchestrator.status().currentPlan.monster, 'goo');
  now += 3000;
  orchestrator.tick(context);
  assert.notEqual(orchestrator.status().currentPlan.id, firstId);
  assert.equal(orchestrator.status().currentPlan.monster, 'crab');
});

test('LocalFarmOrchestrator aborts a stale plan immediately after a map change without issuing another move', () => {
  let now = 10000;
  let calls = 0;
  const world = new WorldModel();
  approve(world, 'goo');
  const adapter = {
    mode: 'shadow',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command() { calls += 1; return { executed: false, shadow: true }; }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => now, moveCooldownMs: 500 });
  const runtime = fakeRuntime(adapter);
  orchestrator.tick({ runtime, snapshot: snapshot(), world, party: { fingerprint: 'solo:ranger' }, gameData: gameData() });
  assert.equal(orchestrator.status().currentPlan.map, 'main');
  assert.equal(calls, 1);
  now += 1000;
  const changed = snapshot({ character: { map: 'other' } });
  const decision = orchestrator.tick({ runtime, snapshot: changed, world, party: { fingerprint: 'solo:ranger' }, gameData: gameData() });
  assert.equal(decision.reason, 'NO_APPROVED_LOCAL_SPAWN');
  assert.equal(orchestrator.status().currentPlan, null);
  assert.equal(orchestrator.status().lastAbort.abortReason, 'MAP_CHANGED');
  assert.equal(calls, 1);
});

test('LocalFarmOrchestrator aborts a plan when its monster policy is quarantined', () => {
  let now = 10000;
  let calls = 0;
  const world = new WorldModel();
  const gate = new ContentSafetyGate({ now: () => now });
  gate.approve(world, 'goo');
  const adapter = {
    mode: 'shadow',
    stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
    command() { calls += 1; return { executed: false, shadow: true }; }
  };
  const orchestrator = new LocalFarmOrchestrator({ now: () => now, moveCooldownMs: 500 });
  const runtime = fakeRuntime(adapter);
  const context = { runtime, snapshot: snapshot(), world, party: { fingerprint: 'solo:ranger' }, gameData: gameData() };
  orchestrator.tick(context);
  assert.equal(orchestrator.status().currentPlan.monster, 'goo');
  gate.quarantine(world, 'goo');
  now += 1000;
  const decision = orchestrator.tick(context);
  assert.equal(decision.reason, 'NO_APPROVED_LOCAL_SPAWN');
  assert.equal(orchestrator.status().currentPlan, null);
  assert.equal(orchestrator.status().lastAbort.abortReason, 'PLAN_NO_LONGER_ELIGIBLE');
  assert.equal(calls, 1);
});

test('Alpha9Runtime exposes dashboard-safe local farming status and previews a known spawn in shadow', () => {
  let now = 10000;
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData()
  };
  const runtime = new Alpha9Runtime({
    root,
    parent: root.parent,
    mode: 'shadow',
    now: () => now,
    visibleStatus: false,
    storage: { get: () => null, set() {} }
  });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.mode, 'shadow');
  assert.ok(status.localFarming);
  assert.equal(status.localFarming.smartMoveAllowed, false);
  assert.equal(status.localFarming.mapChangeAllowed, false);
  assert.equal(status.localFarming.currentPlan.monster, 'goo');
  assert.equal(status.localFarming.lastDecision.action, 'SHADOW_MOVE');
  assert.doesNotThrow(() => JSON.stringify(status));
});

test('Alpha9Runtime never plans toward a map-metadata monster that has not been approved or legacy-allowed', () => {
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData([{ type: 'unknownboss', boundary: [500, 0, 700, 200] }])
  };
  const runtime = new Alpha9Runtime({
    root, parent: root.parent, mode: 'shadow', now: () => 10000,
    visibleStatus: false, storage: { get: () => null, set() {} }
  });
  runtime.tick();
  const local = runtime.status().localFarming;
  assert.equal(local.currentPlan, null);
  assert.equal(local.lastDecision.reason, 'NO_APPROVED_LOCAL_SPAWN');
});

test('Alpha9 shadow soak remains bounded while repeatedly planning a same-map approved spawn', () => {
  let now = 10000;
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData()
  };
  const runtime = new Alpha9Runtime({
    root, parent: root.parent, mode: 'shadow', now: () => now,
    visibleStatus: false, storage: { get: () => null, set() {} }, logCapacity: 200
  });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  for (let i = 0; i < 2000; i += 1) {
    now += 250;
    runtime.tick();
  }
  const status = runtime.status();
  assert.equal(status.mode, 'shadow');
  assert.ok(runtime.log.list(10000).length <= 200);
  assert.ok(status.scheduler.completed.length <= 200);
  assert.ok(status.stability.commandOutcomes.outcomes.historySize <= 500);
  assert.ok(status.localFarming.stats.plansCreated < 20);
  assert.doesNotThrow(() => JSON.stringify(status));
});
