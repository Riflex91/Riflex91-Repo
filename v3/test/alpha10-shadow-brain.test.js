'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  Alpha10Runtime,
  StrategicFeatureEncoder,
  FEATURE_SCHEMA_VERSION,
  FEATURE_NAMES,
  BoundedReplayBuffer,
  ShadowStrategicBrain,
  BrainQualityState
} = require('../src');

function character(overrides = {}) {
  return {
    name: 'Alpha10', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    speed: 40, range: 120, frequency: 2,
    xp: 0, gold: 0, items: [], rip: false, moving: false,
    ...overrides
  };
}

function gameData(monsters = [
  { type: 'goo', boundary: [400, -50, 500, 50] },
  { type: 'unknownboss', boundary: [900, 900, 1100, 1100] }
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

function brainContext(overrides = {}) {
  const candidates = overrides.candidates || [
    { id: 'main:goo:0', monster: 'goo', map: 'main', xpPerHour: 6000, goldPerHour: 100, deathsPerHour: 0, confidence: 0.8, travelSeconds: 20, source: 'measured-spawn' },
    { id: 'main:crab:1', monster: 'crab', map: 'main', xpPerHour: 9000, goldPerHour: 0, deathsPerHour: 0.1, confidence: 0.2, travelSeconds: 80, source: 'known-spawn-metadata' }
  ];
  return {
    snapshot: { character: character(overrides.character || {}) },
    currentPlan: overrides.currentPlan || { monster: 'goo' },
    candidates,
    teacherRanking: overrides.teacherRanking || [{ ...candidates[0], score: 1 }]
  };
}

test('StrategicFeatureEncoder emits a versioned bounded finite schema', () => {
  const encoder = new StrategicFeatureEncoder();
  const rows = encoder.encodeCandidates(brainContext());
  assert.equal(rows.length, 2);
  assert.equal(rows[0].schemaVersion, FEATURE_SCHEMA_VERSION);
  assert.equal(rows[0].vector.length, FEATURE_NAMES.length);
  assert.deepEqual(encoder.status().featureNames, FEATURE_NAMES);
  for (const row of rows) {
    for (const value of row.vector) {
      assert.ok(Number.isFinite(value));
      assert.ok(value >= 0 && value <= 1);
    }
  }
});

test('StrategicFeatureEncoder sanitizes malformed numeric observations instead of propagating NaN/Infinity', () => {
  const encoder = new StrategicFeatureEncoder();
  const rows = encoder.encodeCandidates(brainContext({
    character: { hp: Infinity, max_hp: 0, mp: NaN, max_mp: 0 },
    candidates: [{ id: 'x', monster: 'x', xpPerHour: Infinity, goldPerHour: NaN, deathsPerHour: -5, confidence: 99, travelSeconds: Infinity }],
    teacherRanking: []
  }));
  assert.equal(rows.length, 1);
  for (const value of rows[0].vector) {
    assert.ok(Number.isFinite(value));
    assert.ok(value >= 0 && value <= 1);
  }
});

test('BoundedReplayBuffer keeps a hard capacity and reports drops', () => {
  const replay = new BoundedReplayBuffer({ capacity: 32 });
  for (let i = 0; i < 100; i += 1) replay.push({ i });
  assert.equal(replay.status().capacity, 32);
  assert.equal(replay.status().size, 32);
  assert.equal(replay.status().dropped, 68);
  assert.equal(replay.list(100).length, 32);
});

test('ShadowStrategicBrain is recommendation-only and cannot expose direct action authority', () => {
  const brain = new ShadowStrategicBrain();
  const result = brain.observe(brainContext());
  const status = brain.status();
  assert.equal(result.mode, 'shadow');
  assert.equal(result.actionAuthority, false);
  assert.equal(status.mode, 'shadow');
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directActionAccess, false);
  assert.equal(status.executorBypassAllowed, false);
  assert.equal(typeof brain.command, 'undefined');
  assert.equal(typeof brain.move, 'undefined');
  assert.equal(typeof brain.attack, 'undefined');
  assert.equal(typeof brain.use_skill, 'undefined');
});

test('ShadowStrategicBrain performs bounded teacher distillation and keeps finite capped weights', () => {
  let now = 1000;
  const brain = new ShadowStrategicBrain({
    now: () => now,
    replayCapacity: 32,
    qualityWindow: 8,
    minQualitySamples: 4,
    learningRate: 0.1,
    maxAbsWeight: 0.5,
    initialWeights: Object.fromEntries(FEATURE_NAMES.map((name) => [name, 0]))
  });
  const context = brainContext({ teacherRanking: [{ id: 'main:goo:0' }] });
  for (let i = 0; i < 40; i += 1) {
    now += 1000;
    brain.observe(context);
  }
  const status = brain.status();
  assert.ok(status.stats.teacherSamples >= 40);
  assert.ok(status.stats.distillations > 0);
  assert.ok(Object.values(BrainQualityState).includes(status.quality.state));
  for (const value of Object.values(status.weights)) {
    assert.ok(Number.isFinite(value));
    assert.ok(Math.abs(value) <= 0.5);
  }
  assert.ok(status.replay.size <= 32);
});

test('ShadowStrategicBrain handles an empty candidate set without fabricating a decision', () => {
  const brain = new ShadowStrategicBrain();
  const result = brain.observe(brainContext({ candidates: [], teacherRanking: [] }));
  assert.equal(result.reason, 'NO_ELIGIBLE_CANDIDATES');
  assert.equal(result.recommendation, null);
  assert.equal(brain.status().stats.noCandidates, 1);
});

test('Alpha10Runtime exposes a JSON-safe shadow Brain and only feeds approved same-map candidates', () => {
  let now = 10000;
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData()
  };
  const runtime = new Alpha10Runtime({
    root,
    parent: root.parent,
    mode: 'shadow',
    now: () => now,
    visibleStatus: false,
    brainAuditMs: 1000,
    storage: { get: () => null, set() {} }
  });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.12.0');
  assert.equal(status.mode, 'shadow');
  assert.ok(status.brain);
  assert.equal(status.brain.mode, 'shadow');
  assert.equal(status.brain.actionAuthority, false);
  assert.equal(status.brain.lastRecommendation.recommendation.monster, 'goo');
  assert.equal(status.brain.lastRecommendation.candidateCount, 1);
  assert.equal(status.localFarming.currentPlan.monster, 'goo');
  assert.doesNotThrow(() => JSON.stringify(status));
});

test('Bot active mode never promotes the Alpha10 Brain out of shadow', () => {
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData([{ type: 'goo', boundary: [400, -50, 500, 50] }])
  };
  const runtime = new Alpha10Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: { get: () => null, set() {} } });
  runtime.setMode('active');
  assert.equal(runtime.status().mode, 'active');
  assert.equal(runtime.status().brain.mode, 'shadow');
  assert.equal(runtime.status().brain.actionAuthority, false);
});

test('A malicious shadow recommendation cannot replace the deterministic local farming plan', () => {
  const fakeBrain = {
    observe() { return { recommendation: { id: 'bad', monster: 'unknownboss' } }; },
    status() { return { mode: 'shadow', actionAuthority: false, lastRecommendation: { recommendation: { id: 'bad', monster: 'unknownboss' } } }; },
    replay() { return []; }
  };
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData()
  };
  const runtime = new Alpha10Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, brain: fakeBrain, storage: { get: () => null, set() {} } });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  assert.equal(runtime.status().localFarming.currentPlan.monster, 'goo');
  assert.equal(runtime.status().brain.lastRecommendation.recommendation.monster, 'unknownboss');
});

test('Alpha10 synthetic shadow soak keeps Brain state bounded and serializable', () => {
  let now = 0;
  const brain = new ShadowStrategicBrain({ now: () => now, replayCapacity: 128, qualityWindow: 64 });
  const context = brainContext();
  for (let i = 0; i < 2000; i += 1) {
    now += 5000;
    if (i % 17 === 0) context.teacherRanking = [{ ...context.candidates[1], score: 1 }];
    else context.teacherRanking = [{ ...context.candidates[0], score: 1 }];
    brain.observe(context);
  }
  const status = brain.status();
  assert.equal(status.stats.evaluations, 2000);
  assert.ok(status.replay.size <= 128);
  assert.ok(status.quality.samples <= 64);
  for (const value of Object.values(status.weights)) assert.ok(Number.isFinite(value));
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.stringify(brain.replay(128)));
});
