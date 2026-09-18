'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { WorldModel } = require('../src/world/world-model');
const { ContentSafetyGate, ContentDisposition } = require('../src/farmer/content-safety');
const { ContentDriftSemanticRecovery } = require('../src/content/content-drift-semantic-recovery');
const { LocalFarmPlanner } = require('../src/autonomy/local-farm-planner');

function falseNoveltyRecord(id, firstSeenAt, extra = {}) {
  return {
    schemaVersion: 1,
    key: `monsters:${id}`,
    category: 'monsters',
    id,
    lifecycle: 'QUARANTINED',
    fingerprint: `fp-${id}`,
    baselineFingerprint: `fp-${id}`,
    previousFingerprint: null,
    samples: 1,
    changeCount: 0,
    firstSeenAt,
    lastSeenAt: firstSeenAt,
    ...extra
  };
}

function recoveryFixture() {
  let now = 1000;
  const world = new WorldModel({ now: () => now });
  const contentSafety = new ContentSafetyGate({ now: () => now });
  const monitor = { records: new Map(), stats: { revalidated: 0 } };
  const runtime = {
    world,
    contentDrift: monitor,
    combatRisk: { contentSafety },
    now: () => now,
    log: null
  };
  return {
    world,
    contentSafety,
    monitor,
    runtime,
    setNow(value) { now = value; }
  };
}

function prepareHistoricalQuarantine(f, id = 'crab', noveltyAt = 100000) {
  f.world.observeEntity('monster', id, { hp: 400 });
  f.setNow(noveltyAt);
  f.monitor.records.set(`monsters:${id}`, falseNoveltyRecord(id, noveltyAt));
  f.contentSafety.quarantine(f.world, id);
}

test('semantic recovery caches firstSeenAt evidence and never dereferences the monster twice', () => {
  const f = recoveryFixture();
  prepareHistoricalQuarantine(f, 'crab');

  const originalEntity = f.world.entity.bind(f.world);
  let monsterReads = 0;
  f.world.entity = (type, id) => {
    if (type === 'monster' && id === 'crab') {
      monsterReads += 1;
      if (monsterReads > 1) return null;
    }
    return originalEntity(type, id);
  };

  f.setNow(100100);
  const recovery = new ContentDriftSemanticRecovery(f.runtime, { minHistoricalLeadMs: 15000 });
  assert.doesNotThrow(() => recovery.beforeTick());
  assert.equal(monsterReads, 1);
  assert.deepEqual(recovery.status().lastResult.recovered, ['crab']);
  assert.equal(f.contentSafety.evaluate({ mtype: 'crab' }, f.world).disposition, ContentDisposition.LEGACY_ALLOWED);
});

test('one malformed semantic-drift record cannot abort recovery of later valid records', () => {
  const f = recoveryFixture();
  prepareHistoricalQuarantine(f, 'crab');

  const malformed = {};
  Object.defineProperty(malformed, 'category', {
    enumerable: true,
    get() { throw new Error('synthetic malformed record'); }
  });
  const reordered = new Map([
    ['monsters:broken', malformed],
    ['monsters:crab', f.monitor.records.get('monsters:crab')]
  ]);
  f.monitor.records = reordered;

  f.setNow(100100);
  const recovery = new ContentDriftSemanticRecovery(f.runtime, { minHistoricalLeadMs: 15000 });
  const result = recovery.beforeTick();
  assert.deepEqual(result.recovered, ['crab']);
  assert.equal(result.recordErrors.length, 1);
  assert.match(result.recordErrors[0].message, /synthetic malformed record/);
  assert.equal(recovery.status().stats.recordErrors, 1);
});

test('technical training target is never auto-recovered into farmable content', () => {
  const f = recoveryFixture();
  prepareHistoricalQuarantine(f, 'target');

  f.setNow(100100);
  const recovery = new ContentDriftSemanticRecovery(f.runtime, { minHistoricalLeadMs: 15000 });
  const result = recovery.beforeTick();
  assert.deepEqual(result.recovered, []);
  assert.equal(recovery.status().stats.skippedNonFarm, 1);
  assert.equal(f.contentSafety.evaluate({ mtype: 'target' }, f.world).disposition, ContentDisposition.QUARANTINED);
  assert.equal(f.monitor.records.get('monsters:target').lifecycle, 'QUARANTINED');
});

test('local farm planner excludes target automatron spawn even when persisted policy says LEGACY_ALLOWED', () => {
  const planner = new LocalFarmPlanner();
  const snapshot = { character: { name: 'My_Ranger2', map: 'main', x: 0, y: 0, speed: 50 } };
  const gameData = {
    maps: {
      main: {
        monsters: [
          { type: 'target', x: 10, y: 10 },
          { type: 'crab', x: 20, y: 20 }
        ]
      }
    },
    monsters: {
      target: { xp: 1000000 },
      crab: { xp: 100 }
    }
  };
  const world = {
    fact(type, id, name) {
      assert.equal(type, 'monster-policy');
      assert.equal(name, 'contentSafetyDisposition');
      return { value: id === 'target' ? 'LEGACY_ALLOWED' : 'LEGACY_ALLOWED' };
    },
    performanceFor() { return null; }
  };

  const candidates = planner.spawnCandidates(snapshot, gameData, world, { fingerprint: 'merchant:1|ranger:3' });
  assert.deepEqual(candidates.map((row) => row.monster), ['crab']);
  assert.equal(candidates[0].id, 'main:crab:1');
});
