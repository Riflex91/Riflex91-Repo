'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha10Runtime } = require('../src/autonomy/alpha10-runtime');
const { StrategicFeatureEncoder, FEATURE_NAMES } = require('../src/brain/feature-encoder');
const { BoundedReplayBuffer } = require('../src/brain/replay-buffer');
const { ShadowStrategicBrain } = require('../src/brain/shadow-brain');

function character() {
  return {
    id: 'ranger', name: 'RangerA', ctype: 'ranger', map: 'main', x: 0, y: 0,
    hp: 900, max_hp: 1000, mp: 400, max_mp: 500, gold: 1000, xp: 100,
    level: 60, range: 120, speed: 50, frequency: 1, rip: false, items: []
  };
}

function gameData() {
  return {
    levels: [0, 1000, 2000],
    maps: {
      main: {
        monsters: [
          { type: 'goo', boundary: [0, 0, 100, 100] },
          { type: 'bee', boundary: [200, 200, 300, 300] }
        ]
      }
    },
    monsters: {
      goo: { hp: 100, attack: 20, frequency: 1, xp: 100, gold: 10 },
      bee: { hp: 150, attack: 40, frequency: 1, xp: 200, gold: 20 }
    }
  };
}

function brainContext(overrides = {}) {
  return {
    snapshot: {
      now: 1000,
      character: character(),
      entities: [],
      party: [],
      gameData: gameData()
    },
    party: { members: [], fingerprint: 'solo' },
    candidates: [
      { monster: 'goo', map: 'main', x: 50, y: 50, source: 'map-metadata', confidence: 0.7, expectedXp: 100, expectedGold: 10, travelDistance: 70 },
      { monster: 'bee', map: 'main', x: 250, y: 250, source: 'map-metadata', confidence: 0.6, expectedXp: 200, expectedGold: 20, travelDistance: 350 }
    ],
    teacherRanking: [
      { monster: 'bee', map: 'main', score: 5, safety: 1, xpPerHour: 1000, goldPerHour: 100, travelSeconds: 20 },
      { monster: 'goo', map: 'main', score: 4, safety: 1, xpPerHour: 900, goldPerHour: 80, travelSeconds: 10 }
    ],
    currentPlan: { monster: 'goo', map: 'main' },
    ...overrides
  };
}

test('StrategicFeatureEncoder emits a versioned bounded finite schema', () => {
  const encoder = new StrategicFeatureEncoder();
  const result = encoder.encode(brainContext());
  assert.equal(result.schemaVersion, 1);
  assert.deepEqual(result.featureNames, FEATURE_NAMES);
  assert.equal(result.features.length, FEATURE_NAMES.length);
  assert.ok(result.features.every(Number.isFinite));
  assert.ok(result.features.every((value) => value >= -1 && value <= 1));
});

test('StrategicFeatureEncoder sanitizes malformed numeric observations instead of propagating NaN/Infinity', () => {
  const encoder = new StrategicFeatureEncoder();
  const context = brainContext();
  context.snapshot.character.hp = NaN;
  context.snapshot.character.max_hp = Infinity;
  context.candidates[0].expectedXp = Infinity;
  context.teacherRanking[0].score = NaN;
  const result = encoder.encode(context);
  assert.ok(result.features.every(Number.isFinite));
});

test('BoundedReplayBuffer keeps a hard capacity and reports drops', () => {
  const replay = new BoundedReplayBuffer({ capacity: 3 });
  replay.push({ id: 1 });
  replay.push({ id: 2 });
  replay.push({ id: 3 });
  replay.push({ id: 4 });
  assert.deepEqual(replay.list().map((row) => row.id), [2, 3, 4]);
  assert.equal(replay.status().dropped, 1);
});

test('ShadowStrategicBrain is recommendation-only and cannot expose direct action authority', () => {
  const brain = new ShadowStrategicBrain();
  const result = brain.observe(brainContext());
  assert.equal(result.mode, 'shadow');
  assert.equal(result.actionAuthority, false);
  assert.equal(result.recommendation.directAction, null);
  assert.equal(brain.status().actionAuthority, false);
  assert.equal(brain.status().directCommandsAllowed, false);
});

test('ShadowStrategicBrain performs bounded teacher distillation and keeps finite capped weights', () => {
  const brain = new ShadowStrategicBrain({ learningRate: 0.2, maxAbsWeight: 2, minQualitySamples: 2 });
  for (let i = 0; i < 200; i += 1) brain.observe(brainContext());
  const status = brain.status();
  assert.equal(status.stats.updates, 200);
  assert.ok(status.weights.every(Number.isFinite));
  assert.ok(status.weights.every((value) => Math.abs(value) <= 2));
  assert.ok(status.replay.size <= status.replay.capacity);
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
  const root = { character: character(), parent: { entities: {}, party: {} }, G: gameData() };
  const runtime = new Alpha10Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, visibleStatus: false, brainAuditMs: 1000, storage: { get: () => null, set() {} } });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.18.0');
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
  const root = { character: character(), parent: { entities: {}, party: {} }, G: gameData() };
  const runtime = new Alpha10Runtime({ root, parent: root.parent, mode: 'active', visibleStatus: false, storage: { get: () => null, set() {} } });
  runtime.tick();
  assert.equal(runtime.adapter.mode, 'active');
  assert.equal(runtime.brain.status().mode, 'shadow');
  assert.equal(runtime.brain.status().actionAuthority, false);
});

test('A malicious shadow recommendation cannot replace the deterministic local farming plan', () => {
  const root = { character: character(), parent: { entities: {}, party: {} }, G: gameData() };
  const maliciousBrain = {
    observe() { return { recommendation: { monster: 'bee', map: 'other-map', directAction: 'attack', authority: true } }; },
    status() { return { mode: 'shadow', actionAuthority: false, lastRecommendation: null, replay: { size: 0 } }; },
    replay() { return []; }
  };
  const runtime = new Alpha10Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, brain: maliciousBrain, storage: { get: () => null, set() {} } });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  assert.equal(runtime.localFarming.status().currentPlan.monster, 'goo');
  assert.equal(runtime.adapter.mode, 'shadow');
});

test('Alpha10 synthetic shadow soak keeps Brain state bounded and serializable', () => {
  let now = 0;
  const root = { character: character(), parent: { entities: {}, party: {} }, G: gameData() };
  const runtime = new Alpha10Runtime({
    root, parent: root.parent, mode: 'shadow', visibleStatus: false, now: () => now,
    brainAuditMs: 1000, brainReplayCapacity: 64, storage: { get: () => null, set() {} }
  });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  for (let i = 0; i < 2500; i += 1) {
    now += 1000;
    runtime.tick();
  }
  const status = runtime.brain.status();
  assert.ok(status.replay.size <= 64);
  assert.ok(status.weights.every(Number.isFinite));
  assert.equal(status.actionAuthority, false);
  assert.doesNotThrow(() => JSON.stringify(runtime.status()));
});
