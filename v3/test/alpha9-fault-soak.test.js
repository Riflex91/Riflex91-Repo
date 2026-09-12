'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  Alpha9Runtime,
  StrategyBrain,
  StudentNetwork,
  StrategicRewardModel,
  WorldModel,
  EvidenceKind,
  FarmPlanner,
  SafeLocalSpawnNavigator
} = require('../src');

function context(overrides = {}) {
  const snapshot = {
    observedAt: 10000,
    character: {
      name: 'BrainBoundaryProbe', ctype: 'ranger', level: 70, map: 'main',
      x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      speed: 40, range: 120, frequency: 2,
      xp: 1000, gold: 1000, rip: false, inventory: Array(42).fill(null)
    },
    entities: [], objects: [], party: []
  };
  return {
    snapshot,
    party: { fingerprint: 'solo:ranger', members: [{ name: 'BrainBoundaryProbe', rip: false }] },
    farmer: { state: 'REASSESS', targetType: null },
    combatEmergency: { pendingRetreat: false },
    contentSafety: { counts: { LEGACY_ALLOWED: 2, APPROVED: 0, QUARANTINED: 0 } },
    localFarming: {
      candidateCount: 2,
      goal: { monster: 'goo', confidence: 0.7 },
      candidates: [
        { monster: 'goo', map: 'main', x: 200, y: 0 },
        { monster: 'bee', map: 'main', x: -200, y: 0 }
      ]
    },
    progress: { state: 'HEALTHY', progressAgeMs: 1000, degradedAfterMs: 180000 },
    performance: { current: { rates: { xpPerHour: 100000, goldPerHour: 10000, killsPerHour: 100, deathsPerHour: 0, potionsPerHour: 10, damageTakenPerHour: 1000 } } },
    movement: { circuitOpen: false, failureStreak: 0, maxFailures: 3 },
    persistence: { saveCircuitOpen: false, loadFailureStreak: 0 },
    headlessHealth: { state: 'HEALTHY' },
    world: { entities: 100 },
    noveltyCount: 0,
    ...overrides
  };
}

function healthyChampionFor(brain, ctx, actionIndex) {
  for (let i = 0; i < 12; i += 1) brain.quality.record({ reward: 0.3, confidence: 0.7, loss: 0.1 });
  const features = brain.encoder.encode({ ...ctx, replay: brain.replay.status() });
  const model = new StudentNetwork({ seed: 991, learningRate: 0.04 });
  const target = Array(5).fill(0);
  target[actionIndex] = 1;
  for (let i = 0; i < 250; i += 1) model.train(features, target);
  brain.league.champion = { at: 10000, model: model.export(), metrics: { validationLoss: 0.1, meanReward: 0.3 } };
  brain.league.state = 'champion';
  return features;
}

test('bounded Brain influence can prefer another safe same-map target but never emits a gameplay command', () => {
  let now = 10000;
  const brain = new StrategyBrain({ now: () => now, minInfluenceConfidence: 0.6, decisionIntervalMs: 1000, seed: 1 });
  const ctx = context();
  healthyChampionFor(brain, ctx, 1);
  brain.setInfluenceEnabled(true);
  brain.observe(ctx);
  const preference = brain.preference();
  assert.ok(preference);
  assert.equal(preference.action, 'change_farm_target');
  assert.equal(preference.avoidMonster, 'goo');
  assert.equal(brain.status().rawGameplayAccess, false);
  assert.equal(brain.status().strategicOnly, true);
});

test('combat emergency masks every Brain action that could delay safety handling', () => {
  const brain = new StrategyBrain({ now: () => 10000, minInfluenceConfidence: 0.6, decisionIntervalMs: 1000, seed: 2 });
  const safe = context();
  healthyChampionFor(brain, safe, 1);
  brain.setInfluenceEnabled(true);
  const emergency = context({ combatEmergency: { pendingRetreat: true } });
  const mask = brain.actionMask(emergency);
  assert.deepEqual(mask, [true, false, false, false, false]);
  brain.observe(emergency);
  assert.equal(brain.preference(), null);
});

test('corrupted champion snapshot cannot execute influence and is contained', () => {
  const brain = new StrategyBrain({ now: () => 10000, minInfluenceConfidence: 0.6, decisionIntervalMs: 1000, seed: 3 });
  for (let i = 0; i < 12; i += 1) brain.quality.record({ reward: 0.3, confidence: 0.7, loss: 0.1 });
  brain.league.champion = { model: { schemaVersion: 1, inputSize: 999 }, metrics: { validationLoss: 0.1 } };
  brain.league.state = 'champion';
  brain.setInfluenceEnabled(true);
  assert.doesNotThrow(() => brain.observe(context()));
  assert.equal(brain.preference(), null);
});

test('malformed Teacher payloads are nonblocking and fail closed', () => {
  const brain = new StrategyBrain({ now: () => 10000, seed: 4 });
  brain.observe(context());
  assert.equal(brain.submitTeacher({}, context()).reason, 'INVALID_ACTION');
  assert.equal(brain.submitTeacher({ action: 'sell_everything', confidence: 999 }, context()).reason, 'INVALID_ACTION');
  assert.equal(brain.submitTeacher({ action: 'explore', confidence: 0.99 }, context()).reason, 'ACTION_MASKED');
  assert.equal(brain.status().teacher.accepted, 0);
  assert.equal(brain.status().teacher.rejected, 3);
});

test('reward model remains bounded under extreme telemetry', () => {
  const reward = new StrategicRewardModel();
  const positive = reward.evaluate(
    { xpPerHour: 0, goldPerHour: 0, freeInventoryRatio: 0, hpRatio: 0, partyAliveRatio: 0, deathsPerHour: 10, movementHealthy: 0, persistenceHealthy: 0, progressHealthy: 0, rip: false },
    { xpPerHour: 1e30, goldPerHour: 1e30, freeInventoryRatio: 1, hpRatio: 1, partyAliveRatio: 1, deathsPerHour: 0, movementHealthy: 1, persistenceHealthy: 1, progressHealthy: 1, rip: false }
  );
  const negative = reward.evaluate(
    { xpPerHour: 1e30, goldPerHour: 1e30, freeInventoryRatio: 1, hpRatio: 1, partyAliveRatio: 1, deathsPerHour: 0, movementHealthy: 1, persistenceHealthy: 1, progressHealthy: 1, rip: false },
    { xpPerHour: 0, goldPerHour: 0, freeInventoryRatio: 0, hpRatio: 0, partyAliveRatio: 0, deathsPerHour: 99, movementHealthy: 0, persistenceHealthy: 0, progressHealthy: 0, rip: true },
    { safetyIncident: true, actionError: true }
  );
  assert.equal(positive.reward <= 1 && positive.reward >= -1, true);
  assert.equal(negative.reward, -1);
});

test('Brain research summary is bounded and never contains weight matrices or credentials', () => {
  const brain = new StrategyBrain({ now: () => 10000, seed: 5 });
  brain.diary.add('teacher', { token: 'secret-token', authorization: 'Bearer secret', lesson: 'safe' });
  const json = JSON.stringify(brain.researchSummary());
  assert.equal(json.includes('secret-token'), false);
  assert.equal(json.includes('Bearer secret'), false);
  assert.equal(json.includes('"w1"'), false);
  assert.equal(json.includes('"w2"'), false);
  assert.ok(json.length < 50000);
});

test('Brain preference cannot bypass movement circuit even after healthy champion influence', () => {
  let now = 10000;
  const brain = new StrategyBrain({ now: () => now, minInfluenceConfidence: 0.6, decisionIntervalMs: 1000, seed: 6 });
  const ctx = context();
  healthyChampionFor(brain, ctx, 1);
  brain.setInfluenceEnabled(true);
  brain.observe(ctx);
  const preference = brain.preference();
  assert.equal(preference.action, 'change_farm_target');

  const world = new WorldModel({ now: () => now });
  world.observeEntity('monster-policy', 'goo', { contentSafetyDisposition: 'APPROVED' }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
  world.observeEntity('monster-policy', 'bee', { contentSafetyDisposition: 'APPROVED' }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
  const navigator = new SafeLocalSpawnNavigator({ planner: new FarmPlanner({ log: null }), now: () => now });
  let moves = 0;
  const result = navigator.step({
    snapshot: ctx.snapshot,
    gameData: {
      maps: { main: { monsters: [{ type: 'goo', boundary: [300, 0, 400, 100] }, { type: 'bee', boundary: [-400, 0, -300, 100] }] } },
      monsters: { goo: { xp: 10 }, bee: { xp: 10 } }
    },
    world,
    party: ctx.party,
    adapter: {
      mode: 'active',
      stabilityStatus: () => ({ movement: { circuitOpen: true, circuitUntil: now + 5000, failureStreak: 3 } }),
      command: () => { moves += 1; return { executed: true }; }
    }
  }, preference);
  assert.equal(result.acted, false);
  assert.equal(result.reason, 'MOVEMENT_CIRCUIT_OPEN');
  assert.equal(moves, 0);
});

test('unknown/quarantined content never enters the candidate set available to Brain influence', () => {
  const world = new WorldModel({ now: () => 10000 });
  world.observeEntity('monster-policy', 'goo', { contentSafetyDisposition: 'APPROVED' }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
  world.observeEntity('monster-policy', 'dangerboss', { contentSafetyDisposition: 'QUARANTINED' }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
  const navigator = new SafeLocalSpawnNavigator({ planner: new FarmPlanner({ log: null }), now: () => 10000 });
  const ctx = context();
  const rows = navigator.candidates({
    snapshot: ctx.snapshot,
    gameData: {
      maps: { main: { monsters: [{ type: 'goo', boundary: [100, 0, 200, 100] }, { type: 'dangerboss', boundary: [200, 0, 300, 100] }] } },
      monsters: { goo: { xp: 1 }, dangerboss: { xp: 999999999 } }
    },
    world,
    party: ctx.party,
    adapter: { mode: 'active' }
  });
  assert.deepEqual(rows.map((row) => row.monster), ['goo']);
});

test('combined alpha.9 shadow soak stays bounded and command-free for thousands of ticks', () => {
  let now = 10000;
  let moveCalls = 0;
  let attackCalls = 0;
  const root = {
    character: {
      name: 'Alpha9Soak', ctype: 'ranger', level: 70, map: 'main',
      real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      xp: 0, gold: 0, items: [], speed: 40, range: 120, frequency: 2, rip: false
    },
    parent: { entities: {}, party: {} },
    G: {
      monsters: { goo: { xp: 10, attack: 1, frequency: 1 } },
      maps: { main: { monsters: [{ type: 'goo', boundary: [300, 0, 400, 100] }] } },
      skills: {}
    },
    move: () => { moveCalls += 1; return true; },
    attack: () => { attackCalls += 1; return true; }
  };
  const runtime = new Alpha9Runtime({
    root, parent: root.parent, mode: 'shadow', now: () => now,
    storage: { get: () => null, set: () => {} }, visibleStatus: false,
    logCapacity: 300, brainReplayCapacity: 64, brainDiaryCapacity: 20
  });
  runtime.world.observeEntity('monster-policy', 'goo', { contentSafetyDisposition: 'APPROVED' }, { evidence: EvidenceKind.INFERRED, confidence: 1 });

  for (let i = 0; i < 5000; i += 1) {
    runtime.tick();
    if (i % 100 === 0) runtime.brain.submitTeacher({ action: 'continue', confidence: 0.7, lesson: 'synthetic soak' }, runtime._brainContext(runtime.lastSnapshot, runtime._partyProfile(runtime.lastSnapshot), root.G, runtime.localFarming.status({ snapshot: runtime.lastSnapshot, gameData: root.G, world: runtime.world, party: runtime._partyProfile(runtime.lastSnapshot), adapter: runtime.adapter }), runtime.progressWatchdog.status()));
    now += 250;
  }

  const status = runtime.status();
  assert.equal(status.mode, 'shadow');
  assert.equal(moveCalls, 0);
  assert.equal(attackCalls, 0);
  assert.ok(runtime.log.list(10000).length <= 300);
  assert.ok(status.brain.replay.size <= 64);
  assert.ok(status.brain.diary.entries <= 20);
  assert.ok(status.brain.pendingOutcomes <= status.brain.maxPendingOutcomes);
  assert.equal(status.localFarming.pendingSchedulerMove, null);
  assert.equal(status.localFarming.schedulerOwned, true);
  assert.equal(status.brain.rawGameplayAccess, false);
  assert.doesNotThrow(() => JSON.stringify(status));
});
