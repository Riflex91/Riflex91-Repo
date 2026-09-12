'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  Alpha9Runtime,
  WorldModel,
  EvidenceKind,
  FarmPlanner,
  LocalSpawnNavigator,
  ProgressWatchdog,
  extractSameMapSpawns,
  ACTIONS,
  FEATURE_NAMES,
  StrategicFeatureEncoder,
  StudentNetwork,
  PrioritizedReplayBuffer,
  StrategyBrain,
  BrainQualityMonitor,
  BrainLeague,
  ControlGateway
} = require('../src');

function policy(world, monster, disposition = 'LEGACY_ALLOWED') {
  world.observeEntity('monster-policy', monster, { contentSafetyDisposition: disposition }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
}

function snapshot(overrides = {}) {
  return {
    observedAt: 10000,
    character: {
      name: 'Alpha9Probe',
      ctype: 'ranger',
      level: 70,
      map: 'main',
      x: 0,
      y: 0,
      real_x: 0,
      real_y: 0,
      hp: 1000,
      max_hp: 1000,
      mp: 500,
      max_mp: 500,
      range: 120,
      speed: 40,
      frequency: 2,
      xp: 1000,
      gold: 5000,
      rip: false,
      inventory: Array(42).fill(null),
      ...overrides
    },
    entities: [],
    objects: [],
    party: []
  };
}

function brainContext(overrides = {}) {
  return {
    snapshot: snapshot(),
    party: { fingerprint: 'solo:ranger', members: [{ name: 'Alpha9Probe', rip: false }] },
    farmer: { state: 'REASSESS', targetType: null },
    combatEmergency: { pendingRetreat: false },
    contentSafety: { counts: { LEGACY_ALLOWED: 2, APPROVED: 0, QUARANTINED: 0 } },
    localFarming: {
      candidateCount: 2,
      goal: { monster: 'goo', confidence: 0.6 },
      candidates: [
        { monster: 'goo', map: 'main', x: 200, y: 0 },
        { monster: 'bee', map: 'main', x: -200, y: 0 }
      ]
    },
    progress: { state: 'HEALTHY', progressAgeMs: 1000, degradedAfterMs: 180000 },
    performance: { current: { rates: { xpPerHour: 100000, goldPerHour: 10000, killsPerHour: 100, deathsPerHour: 0, potionsPerHour: 10, damageTakenPerHour: 5000 } } },
    movement: { circuitOpen: false, failureStreak: 0, maxFailures: 3 },
    persistence: { saveCircuitOpen: false, loadFailureStreak: 0 },
    headlessHealth: { state: 'HEALTHY' },
    world: { entities: 100 },
    noveltyCount: 0,
    ...overrides
  };
}

test('alpha.9 extracts tolerant same-map spawn metadata shapes', () => {
  const rows = extractSameMapSpawns('main', {
    monsters: [
      { type: 'goo', boundary: [0, 0, 100, 100] },
      { mtype: 'bee', x: 200, y: -50 },
      ['crab', 300, 300, 500, 500]
    ]
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.monster), ['goo', 'bee', 'crab']);
  assert.deepEqual([rows[0].x, rows[0].y], [50, 50]);
  assert.deepEqual([rows[1].x, rows[1].y], [200, -50]);
});

test('local spawn navigator only exposes explicitly safe monster dispositions', () => {
  const world = new WorldModel({ now: () => 10000 });
  policy(world, 'goo', 'LEGACY_ALLOWED');
  policy(world, 'bee', 'QUARANTINED');
  const navigator = new LocalSpawnNavigator({ planner: new FarmPlanner(), now: () => 10000 });
  const rows = navigator.candidates({
    snapshot: snapshot(),
    gameData: {
      maps: { main: { monsters: [{ type: 'goo', boundary: [100, 0, 200, 100] }, { type: 'bee', boundary: [-200, 0, -100, 100] }] } },
      monsters: { goo: { xp: 10 }, bee: { xp: 999999 } }
    },
    world,
    party: { fingerprint: 'solo:ranger' }
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].monster, 'goo');
  assert.equal(rows[0].map, 'main');
});

test('local spawn navigator uses bounded verified movement path and respects movement circuit', () => {
  let now = 10000;
  const world = new WorldModel({ now: () => now });
  policy(world, 'goo');
  const commands = [];
  let circuitOpen = false;
  const adapter = {
    stabilityStatus: () => ({ movement: { circuitOpen, pendingOutcomeId: null, circuitUntil: circuitOpen ? now + 1000 : null } }),
    command: (action, args) => { commands.push({ action, args }); return { executed: true, outcomeId: 'move-1' }; }
  };
  const navigator = new LocalSpawnNavigator({ planner: new FarmPlanner(), now: () => now, maxStep: 100, moveCooldownMs: 500 });
  const context = {
    snapshot: snapshot(),
    gameData: { maps: { main: { monsters: [{ type: 'goo', boundary: [400, 0, 500, 0] }] } }, monsters: { goo: { xp: 10 } } },
    world,
    party: { fingerprint: 'solo:ranger' },
    adapter
  };
  const moved = navigator.step(context);
  assert.equal(moved.acted, true);
  assert.equal(commands.length, 1);
  assert.equal(commands[0].action, 'move');
  assert.ok(commands[0].args[0] <= 100.001);
  circuitOpen = true;
  now += 1000;
  const blocked = navigator.step(context);
  assert.equal(blocked.acted, false);
  assert.equal(blocked.reason, 'MOVEMENT_CIRCUIT_OPEN');
  assert.equal(commands.length, 1);
});

test('progress watchdog escalates without retry churn and recovers on real progress', () => {
  let now = 0;
  const watchdog = new ProgressWatchdog({ now: () => now, watchAfterMs: 10000, degradedAfterMs: 20000, cooldownMs: 5000 });
  watchdog.observe(snapshot({ xp: 100, gold: 100 }));
  now = 11000;
  assert.equal(watchdog.observe(snapshot({ xp: 100, gold: 100 })).state, 'WATCH');
  now = 21000;
  assert.equal(watchdog.observe(snapshot({ xp: 100, gold: 100 })).state, 'DEGRADED');
  assert.equal(watchdog.requestReassessment(), true);
  assert.equal(watchdog.requestReassessment(), false);
  assert.equal(watchdog.status().state, 'COOLDOWN');
  now = 22000;
  assert.equal(watchdog.observe(snapshot({ xp: 101, gold: 100 })).state, 'HEALTHY');
  assert.equal(watchdog.status().escalations, 0);
});

test('v3 strategic feature encoder is exactly 32 finite normalized values', () => {
  const encoder = new StrategicFeatureEncoder({ now: () => Date.UTC(2026, 8, 12, 12, 0, 0) });
  const values = encoder.encode(brainContext());
  assert.equal(FEATURE_NAMES.length, 32);
  assert.equal(values.length, 32);
  assert.ok(values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  assert.equal(Object.keys(encoder.named(brainContext())).length, 32);
});

test('student network is 32-24-5 softmax and learns a repeated target', () => {
  const model = new StudentNetwork({ seed: 123, learningRate: 0.03 });
  const features = Array(32).fill(0.5);
  const before = model.predict(features);
  const target = [0, 1, 0, 0, 0];
  for (let i = 0; i < 120; i += 1) model.train(features, target);
  const after = model.predict(features);
  assert.equal(model.status().architecture, '32-24-5');
  assert.ok(Math.abs(after.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(after.probabilities[1] > before.probabilities[1]);
  assert.equal(after.action, 'change_farm_target');
});

test('prioritized replay is bounded and exports only a bounded persistence tail', () => {
  const replay = new PrioritizedReplayBuffer({ capacity: 32, seed: 1 });
  for (let i = 0; i < 80; i += 1) replay.add({ features: Array(32).fill((i % 10) / 10), target: [1, 0, 0, 0, 0], reward: i % 2 ? 0.5 : -0.5 });
  assert.equal(replay.status().size, 32);
  assert.equal(replay.export(12).samples.length, 12);
  assert.equal(replay.sample(8).length, 8);
});

test('teacher interface validates fixed actions and masks unavailable strategy paths', () => {
  const brain = new StrategyBrain({ now: () => 10000, outcomeMs: 5000, decisionIntervalMs: 1000, seed: 2, replaySeed: 3 });
  brain.observe(brainContext());
  const explore = brain.submitTeacher({ action: 'explore', confidence: 0.9 }, brainContext());
  assert.equal(explore.accepted, false);
  assert.equal(explore.reason, 'ACTION_MASKED');
  const merchant = brain.submitTeacher({ action: 'replan_merchant', confidence: 0.9 }, brainContext());
  assert.equal(merchant.accepted, false);
  assert.equal(merchant.reason, 'ACTION_MASKED');
  const valid = brain.submitTeacher({ action: 'continue', confidence: 0.9, lesson: 'stay stable' }, brainContext());
  assert.equal(valid.accepted, true);
  assert.ok(brain.status().replay.size >= 1);
  assert.equal(brain.status().teacher.transport, 'host-provided');
  assert.equal(brain.status().teacher.requiredForGameplay, false);
});

test('teacher change_farm_target is only accepted when deterministic safe alternatives exist', () => {
  const brain = new StrategyBrain({ now: () => 10000, decisionIntervalMs: 1000, seed: 4 });
  const oneCandidate = brainContext({ localFarming: { candidateCount: 1, goal: { monster: 'goo' }, candidates: [{ monster: 'goo' }] } });
  brain.observe(oneCandidate);
  const denied = brain.submitTeacher({ action: 'change_farm_target', confidence: 0.9 }, oneCandidate);
  assert.equal(denied.accepted, false);
  const allowedContext = brainContext();
  brain.observe(allowedContext);
  const accepted = brain.submitTeacher({ action: 'change_farm_target', confidence: 0.9, monster: 'bee' }, allowedContext);
  assert.equal(accepted.accepted, true);
});

test('brain quality progresses from warming to healthy and quarantines safety incidents', () => {
  let now = 10000;
  const quality = new BrainQualityMonitor({ now: () => now, minOutcomes: 12, windowSize: 24, quarantineMs: 60000 });
  for (let i = 0; i < 12; i += 1) quality.record({ reward: 0.2, confidence: 0.7, loss: 0.2 });
  assert.equal(quality.status().state, 'healthy');
  quality.record({ reward: -1, confidence: 0.99, loss: 1, safetyIncident: true });
  assert.equal(quality.status().state, 'quarantine');
  assert.equal(quality.status().autonomyAllowed, false);
  now += 60001;
  assert.notEqual(quality.evaluate().state, 'quarantine');
});

test('champion challenger canary promotion and probation are bounded', () => {
  let now = 10000;
  const league = new BrainLeague({ now: () => now, minSamples: 80, minUpdates: 120, minOutcomes: 12, challengeMinOutcomes: 8, probationMinOutcomes: 12 });
  const championModel = new StudentNetwork({ seed: 10 });
  championModel.updates = 120;
  const first = league.consider(championModel, { samples: 80, updates: 120, teacherAgreement: 0.7, outcomes: 12, validationLoss: 1, meanReward: 0.2 }, { challengerAllowed: true });
  assert.equal(first.reason, 'FIRST_CHAMPION');
  const challenger = championModel.clone();
  challenger.train(Array(32).fill(0.2), [0, 1, 0, 0, 0]);
  const challenge = league.consider(challenger, { samples: 100, updates: 130, teacherAgreement: 0.7, outcomes: 20, validationLoss: 0.8, meanReward: 0.25 }, { challengerAllowed: true });
  assert.equal(challenge.reason, 'CHALLENGE_STARTED');
  for (let i = 0; i < 8; i += 1) league.recordOutcome('challenger', 0.5);
  assert.equal(league.status().state, 'probation');
  for (let i = 0; i < 12; i += 1) league.recordOutcome('champion', 0.5);
  assert.equal(league.status().state, 'champion');
  assert.equal(league.status().rollbackAvailable, false);
  now += 1;
});

test('challenger is rejected immediately on a safety incident', () => {
  const league = new BrainLeague({ minSamples: 80, minUpdates: 120, minOutcomes: 12 });
  const model = new StudentNetwork({ seed: 11 });
  model.updates = 120;
  league.consider(model, { samples: 80, updates: 120, teacherAgreement: 0.8, outcomes: 12, validationLoss: 1, meanReward: 0.2 }, { challengerAllowed: true });
  league.consider(model.clone(), { samples: 100, updates: 140, teacherAgreement: 0.8, outcomes: 20, validationLoss: 0.7, meanReward: 0.3 }, { challengerAllowed: true });
  assert.equal(league.status().state, 'challenge');
  league.recordOutcome('challenger', -1, { safetyIncident: true });
  assert.equal(league.status().state, 'champion');
  assert.equal(league.status().challengerAvailable, false);
});

test('brain state restore never restores risk-increasing influence', () => {
  const brain = new StrategyBrain({ now: () => 10000, seed: 12 });
  brain.setInfluenceEnabled(true);
  brain.diary.add('teacher', { lesson: 'persist me' });
  const state = brain.exportState();
  const restored = new StrategyBrain({ now: () => 20000, seed: 13 });
  assert.equal(restored.restoreState(state), true);
  assert.equal(restored.status().influenceEnabled, false);
  assert.equal(restored.status().diary.entries >= 1, true);
});

test('remote brain training and autonomy enabling are elevated controls by default', () => {
  const gateway = new ControlGateway({ now: () => 10000, allowElevated: false, execute: () => true });
  const base = { issuedAt: 9000, expiresAt: 11000 };
  const teach = gateway.submit({ ...base, commandId: 'teach', action: 'BRAIN_TEACH', params: { recommendation: { action: 'continue' } } });
  const influence = gateway.submit({ ...base, commandId: 'influence', action: 'SET_BRAIN_INFLUENCE', params: { enabled: true } });
  const disable = gateway.submit({ ...base, commandId: 'disable', action: 'SET_BRAIN_INFLUENCE', params: { enabled: false } });
  assert.equal(teach.reason, 'ELEVATED_CONTROL_DISABLED');
  assert.equal(influence.reason, 'ELEVATED_CONTROL_DISABLED');
  assert.equal(disable.status, 'EXECUTED');
});

test('Alpha9Runtime plans safe same-map farming in shadow without issuing gameplay commands', () => {
  let now = 10000;
  let moveCalls = 0;
  const root = {
    AIO_V3_AUTOSTART: false,
    character: {
      name: 'Alpha9RuntimeProbe', ctype: 'ranger', level: 70, map: 'main',
      real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      xp: 0, gold: 0, items: [], speed: 40, range: 120, frequency: 2, rip: false
    },
    parent: { entities: {}, party: {} },
    G: {
      monsters: { goo: { xp: 10, attack: 1, frequency: 1 } },
      maps: { main: { monsters: [{ type: 'goo', boundary: [300, 0, 400, 100] }] } },
      skills: {}
    },
    move: () => { moveCalls += 1; }
  };
  const runtime = new Alpha9Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, storage: { get: () => null, set: () => {} }, visibleStatus: false });
  policy(runtime.world, 'goo');
  runtime.tick();
  const status = runtime.status();
  assert.equal(moveCalls, 0);
  assert.equal(status.mode, 'shadow');
  assert.equal(status.localFarming.sameMapOnly, true);
  assert.equal(status.localFarming.unknownContentAllowed, false);
  assert.equal(status.localFarming.goal.monster, 'goo');
  assert.equal(status.brain.features.featureCount, 32);
  assert.equal(status.brain.influenceEnabled, false);
  assert.equal(status.brain.rawGameplayAccess, false);
});

test('Alpha9Runtime stages bounded brain state in the existing resilient world persistence model', () => {
  let now = 10000;
  const root = {
    character: { name: 'PersistProbe', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 0, items: [], speed: 40, range: 120, frequency: 2, rip: false },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} }
  };
  const runtime = new Alpha9Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, storage: { get: () => null, set: () => {} }, visibleStatus: false });
  runtime.tick();
  runtime.brain.diary.add('teacher', { lesson: 'bounded persistence' });
  assert.equal(runtime._persistBrainMaybe(true), true);
  const fact = runtime.world.fact('brain', 'strategy', 'state');
  assert.equal(fact.value.schemaVersion, 1);
  assert.ok(JSON.stringify(fact.value).length < runtime.brainStateMaxBytes);
  const restored = new StrategyBrain({ now: () => now + 1, seed: 50 });
  restored.setInfluenceEnabled(true);
  assert.equal(restored.restoreState(fact.value), true);
  assert.equal(restored.status().influenceEnabled, false);
});

test('alpha.9 strategic state remains bounded under synthetic long pressure', () => {
  const brain = new StrategyBrain({ now: () => 10000, replayCapacity: 64, diaryCapacity: 20, maxPendingOutcomes: 8, seed: 21, replaySeed: 22 });
  const features = Array(32).fill(0.4);
  for (let i = 0; i < 200; i += 1) {
    brain.replay.add({ features, target: [1, 0, 0, 0, 0], reward: i % 3 === 0 ? -0.2 : 0.2 });
    brain.diary.add('outcome', { i, payload: 'x'.repeat(50) });
    brain._startOutcome('continue', features, 0.7, brainContext(), 'synthetic', 'student');
  }
  assert.equal(brain.status().replay.size, 64);
  assert.equal(brain.status().diary.entries, 20);
  assert.equal(brain.status().pendingOutcomes, 8);
  assert.doesNotThrow(() => JSON.stringify(brain.status()));
});
