'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { WorldModel, EvidenceKind, FarmPlanner, StrategyBrain, Alpha9Runtime } = require('../src');
const { SafeLocalSpawnNavigator } = require('../src/autonomy/safe-local-farming');

function character() {
  return {
    name: 'HardeningProbe', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    speed: 40, range: 120, frequency: 2, xp: 0, gold: 0, rip: false,
    inventory: Array(42).fill(null)
  };
}

function policy(world, monster, disposition = 'LEGACY_ALLOWED') {
  world.observeEntity('monster-policy', monster, { contentSafetyDisposition: disposition }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
}

function navContext(world, mode) {
  return {
    snapshot: { observedAt: 10000, character: character(), entities: [], objects: [], party: [] },
    gameData: {
      maps: { main: { monsters: [{ type: 'goo', boundary: [300, 0, 400, 100] }] } },
      monsters: { goo: { xp: 10 } }
    },
    world,
    party: { fingerprint: 'solo:ranger' },
    adapter: {
      mode,
      stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }),
      command: () => ({ executed: mode === 'active', shadow: mode !== 'active' })
    }
  };
}

test('unlearned legacy spawn is shadow-previewable but cannot drive active movement', () => {
  const world = new WorldModel({ now: () => 10000 });
  policy(world, 'goo', 'LEGACY_ALLOWED');
  const navigator = new SafeLocalSpawnNavigator({ planner: new FarmPlanner({ log: null }), now: () => 10000, minLearnedConfidence: 0.1 });

  assert.equal(navigator.candidates(navContext(world, 'shadow')).length, 1);
  assert.equal(navigator.candidates(navContext(world, 'active')).length, 0);

  world.recordPerformance('goo', 'solo:ranger', { seconds: 180, xp: 1000, gold: 10, kills: 10, deaths: 0 });
  const active = navigator.candidates(navContext(world, 'active'));
  assert.equal(active.length, 1);
  assert.ok(active[0].confidence >= 0.1);
});

test('explicitly approved spawn remains eligible without learned history', () => {
  const world = new WorldModel({ now: () => 10000 });
  policy(world, 'goo', 'APPROVED');
  const navigator = new SafeLocalSpawnNavigator({ planner: new FarmPlanner({ log: null }), now: () => 10000 });
  const active = navigator.candidates(navContext(world, 'active'));
  assert.equal(active.length, 1);
  assert.equal(active[0].disposition, 'APPROVED');
});

test('corrupted brain restore is atomic and preserves the previous safe learning state', () => {
  const brain = new StrategyBrain({ now: () => 10000, seed: 77, replaySeed: 78 });
  const features = Array(32).fill(0.4);
  brain.student.train(features, [1, 0, 0, 0, 0]);
  brain.replay.add({ features, target: [1, 0, 0, 0, 0], reward: 0.2 });
  brain.diary.add('teacher', { lesson: 'keep' });
  brain.setInfluenceEnabled(true);

  const beforeStudent = JSON.stringify(brain.student.export());
  const beforeReplay = brain.replay.status().size;
  const beforeDiary = brain.diary.status().entries;
  const corrupted = brain.exportState();
  corrupted.replay = { schemaVersion: 999, samples: [] };

  assert.equal(brain.restoreState(corrupted), false);
  assert.equal(JSON.stringify(brain.student.export()), beforeStudent);
  assert.equal(brain.replay.status().size, beforeReplay);
  assert.equal(brain.diary.status().entries, beforeDiary + 1); // influence enable audit remains; failed restore adds no diary mutation
  assert.equal(brain.status().influenceEnabled, false);
  assert.equal(brain.status().restoreErrors, 1);
  assert.match(brain.status().lastRestoreError, /replay/i);
});

test('dashboard/status polling does not emit planner ranking telemetry', () => {
  let now = 10000;
  const root = {
    character: { ...character(), items: [] },
    parent: { entities: {}, party: {} },
    G: {
      monsters: { goo: { xp: 10, attack: 1, frequency: 1 } },
      maps: { main: { monsters: [{ type: 'goo', boundary: [300, 0, 400, 100] }] } },
      skills: {}
    }
  };
  const runtime = new Alpha9Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, storage: { get: () => null, set: () => {} }, visibleStatus: false });
  policy(runtime.world, 'goo', 'APPROVED');
  runtime.tick();
  const before = runtime.log.query({ component: 'planner', event: 'FARM_TARGET_RANKED', limit: 1000 }).length;
  for (let i = 0; i < 20; i += 1) runtime.status();
  const after = runtime.log.query({ component: 'planner', event: 'FARM_TARGET_RANKED', limit: 1000 }).length;
  assert.equal(after, before);
});

test('unchanged brain state is not restaged every persistence interval', () => {
  let now = 10000;
  const root = {
    character: { ...character(), items: [] },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} }
  };
  const runtime = new Alpha9Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, storage: { get: () => null, set: () => {} }, visibleStatus: false, brainPersistenceIntervalMs: 10000 });
  runtime.tick();
  assert.equal(runtime._persistBrainMaybe(true), true);
  const revision = runtime.world.revision;
  now += 10001;
  assert.equal(runtime._persistBrainMaybe(false), false);
  assert.equal(runtime.world.revision, revision);
});

test('combat emergency propagates into Brain quarantine and revokes influence', () => {
  let now = 10000;
  const root = {
    character: { ...character(), items: [] },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} }
  };
  const runtime = new Alpha9Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, storage: { get: () => null, set: () => {} }, visibleStatus: false });
  runtime.brain.setInfluenceEnabled(true);
  runtime.lastEmergencyDisengage = { at: now, reason: 'CRITICAL_HP' };
  assert.equal(runtime._propagateSafetyIncident(), true);
  assert.equal(runtime.brain.status().influenceEnabled, true); // global enable flag remains explicit; quality gate disables actual autonomy
  assert.equal(runtime.brain.status().quality.state, 'quarantine');
  assert.equal(runtime.brain.status().quality.autonomyAllowed, false);
  assert.equal(runtime.brain.preference(), null);
  assert.equal(runtime._propagateSafetyIncident(), false);
});
