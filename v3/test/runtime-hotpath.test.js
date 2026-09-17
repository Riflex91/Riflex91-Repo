'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { finite, clamp, clamp01, ratio } = require('../src/core/numeric');
const { distance } = require('../src/core/geometry');
const { createSnapshotEntityIndex, entityById } = require('../src/core/snapshot-entity-index');
const { CommandOutcomeTracker } = require('../src/game/command-outcomes');
const { ControlledFarmerLoot } = require('../src/farmer/controlled-farmer-loot');
const { StrategicFeatureEncoder } = require('../src/brain/feature-encoder');
const { FarmPlanner } = require('../src/planner/farm-planner');

const ROOT = path.resolve(__dirname, '..');

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

test('shared numeric helpers preserve bounded finite and ratio semantics', () => {
  assert.equal(finite('12.5', null), 12.5);
  assert.equal(finite('nope', null), null);
  assert.equal(clamp(12, 0, 10, 0), 10);
  assert.equal(clamp01(-3), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(ratio(5, 10, 0), 0.5);
  assert.equal(ratio(5, 0, 1), 1);
});

test('shared geometry returns deterministic Euclidean distance and fails closed', () => {
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(distance({ x: '1', y: '2' }, { x: 4, y: 6 }), 5);
  assert.equal(distance({ x: 0 }, { x: 1, y: 1 }), Infinity);
  assert.equal(distance({ x: 'bad', y: 0 }, { x: 1, y: 1 }), Infinity);
});

test('snapshot entity index is scoped to the supplied snapshot', () => {
  const firstEntity = { id: 'm1', hp: 100 };
  const secondEntity = { id: 'm1', hp: 50 };
  const first = { entities: [firstEntity] };
  const second = { entities: [secondEntity] };

  const firstIndex = createSnapshotEntityIndex(first);
  const secondIndex = createSnapshotEntityIndex(second);

  assert.equal(firstIndex.size, 1);
  assert.strictEqual(entityById(firstIndex, 'm1'), firstEntity);
  assert.strictEqual(entityById(secondIndex, 'm1'), secondEntity);
  assert.notStrictEqual(firstIndex, secondIndex);
});

test('command outcome observation does not fall back to repeated linear entity lookup', () => {
  let now = 1000;
  const tracker = new CommandOutcomeTracker({ now: () => now });
  tracker.issue({ action: 'attack', args: ['m1'], before: { targetPresent: true, targetHp: 100 } });
  tracker.issue({ action: 'use_skill', args: ['mluck', 'm1'], before: { targetPresent: true, targetHp: 100, mp: 100 } });

  const entities = [{ id: 'm1', hp: 80, dead: false }];
  entities.find = () => { throw new Error('linear find must not be used in observe hot path'); };
  const completed = tracker.observe({ character: { mp: 90, inventory: [] }, entities });

  assert.equal(completed.length, 2);
  assert.deepEqual(completed.map((row) => row.reason), ['TARGET_HP_DECREASED', 'TARGET_HP_DECREASED']);
});

test('loot pending observation avoids JSON deep clone inside the tick hot path', () => {
  let now = 2000;
  const service = new ControlledFarmerLoot({
    now: () => now,
    adapter: { canCommand: () => true, command: () => ({ executed: true }) },
    getMode: () => 'active',
    verifyDelayMs: 100
  });
  service.pendingObservation = {
    at: 1000,
    requestId: 7,
    before: { gold: 10, occupied: 1, quantity: 1, freeSlots: 3 }
  };

  const originalParse = JSON.parse;
  let parses = 0;
  JSON.parse = (...args) => { parses += 1; return originalParse(...args); };
  try {
    const observed = service._observePending({
      character: {
        gold: 11,
        isize: 4,
        inventory: [{ name: 'hpot0', q: 2 }, null, null, null]
      }
    });
    assert.strictEqual(observed, service.lastObservation);
    assert.equal(parses, 0);
    assert.equal(observed.observedDelta, true);
  } finally {
    JSON.parse = originalParse;
  }
});

test('shared helper migration preserves representative planner and feature decisions', () => {
  const planner = new FarmPlanner();
  const ranked = planner.rank([
    { id: 'a', xpPerHour: 100, goldPerHour: 20, deathsPerHour: 0, confidence: 1, travelSeconds: 10 },
    { id: 'b', xpPerHour: 50, goldPerHour: 5, deathsPerHour: 0, confidence: 1, travelSeconds: 10 }
  ]);
  assert.equal(ranked[0].id, 'a');

  const encoder = new StrategicFeatureEncoder();
  const [encoded] = encoder.encodeCandidates({
    snapshot: { character: { hp: 50, max_hp: 100, mp: 25, max_mp: 100 } },
    candidates: [{ id: 'a', xpPerHour: 100, goldPerHour: 20, deathsPerHour: 0, confidence: 0.5, travelSeconds: 10, source: 'measured' }]
  });
  assert.equal(encoded.features.hpReserve, 0.5);
  assert.equal(encoded.features.mpReserve, 0.25);
  assert.equal(encoded.features.measuredEvidence, 1);
});

test('step 5 selected hot paths consume shared helpers instead of local duplicates', () => {
  assert.match(source('src/brain/feature-encoder.js'), /require\('\.\.\/core\/numeric'\)/);
  assert.match(source('src/planner/farm-planner.js'), /require\('\.\.\/core\/numeric'\)/);
  assert.match(source('src/farmer/target-reassessment.js'), /require\('\.\.\/core\/geometry'\)/);
  assert.match(source('src/autonomy/local-farm-planner.js'), /require\('\.\.\/core\/geometry'\)/);
  assert.match(source('src/game/command-outcomes.js'), /createSnapshotEntityIndex\(snapshot\)/);
  assert.doesNotMatch(source('src/farmer/controlled-farmer-loot.js'), /return clone\(this\.lastObservation\)/);
});
