'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  evaluateTargetEfficiency,
  DEFAULT_MAX_EVASION,
  DEFAULT_MAX_AVOIDANCE
} = require('../src/farmer/target-efficiency');
const { installFarmerTargetEfficiencyHotfix } = require('../src/farmer/farmer-target-efficiency-hotfix');
const { ResilientWorldPersistence } = require('../src/world/resilient-persistence');

function createLocalStorage(entries = {}) {
  const values = new Map(Object.entries(entries).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    values
  };
}

function world(serialized, revision = 1) {
  return {
    revision,
    serialize() { return serialized; }
  };
}

test('ranger rejects Froggie from authoritative evasion metadata while normal evasion remains farmable', () => {
  const gameData = {
    monsters: {
      frog: { name: 'Froggie', evasion: 99 },
      ghost: { name: 'Ghost', evasion: 20 }
    }
  };

  const frog = evaluateTargetEfficiency({ mtype: 'frog' }, gameData, { character: { ctype: 'ranger' } });
  const ghost = evaluateTargetEfficiency({ mtype: 'ghost' }, gameData, { character: { ctype: 'ranger' } });

  assert.equal(DEFAULT_MAX_EVASION, 80);
  assert.equal(frog.allowed, false);
  assert.equal(frog.reason, 'EXTREME_EVASION');
  assert.equal(frog.evasion, 99);
  assert.equal(ghost.allowed, true);
});

test('high evasion remains class-aware but extreme avoidance is rejected for every farmer', () => {
  const gameData = {
    monsters: {
      frog: { evasion: 99 },
      cutebee: { avoidance: 99.9 }
    }
  };

  const mageFrog = evaluateTargetEfficiency({ mtype: 'frog' }, gameData, { character: { ctype: 'mage' } });
  const mageCuteBee = evaluateTargetEfficiency({ mtype: 'cutebee' }, gameData, { character: { ctype: 'mage' } });

  assert.equal(DEFAULT_MAX_AVOIDANCE, 80);
  assert.equal(mageFrog.allowed, true);
  assert.equal(mageFrog.evasionSensitive, false);
  assert.equal(mageCuteBee.allowed, false);
  assert.equal(mageCuteBee.reason, 'EXTREME_AVOIDANCE');
});

test('efficiency hotfix removes Froggie from both spawn planning and live target selection', () => {
  const gameData = {
    monsters: {
      frog: { name: 'Froggie', evasion: 99 },
      crab: { name: 'Tiny Crab', armor: 160 }
    }
  };
  const planner = {
    spawnCandidates() {
      return [
        { id: 'main:frog:4', monster: 'frog' },
        { id: 'main:crab:0', monster: 'crab' }
      ];
    }
  };
  const farmer = {
    _safeLiveMonsters() {
      return [
        { id: 'frog-live', mtype: 'frog', hp: 600 },
        { id: 'crab-live', mtype: 'crab', hp: 400 }
      ];
    }
  };
  const runtime = {
    now: () => 12345,
    log: { emit() {} },
    adapter: { getGameData: () => gameData },
    localFarmPlanner: planner,
    farmer
  };
  const hotfix = installFarmerTargetEfficiencyHotfix(runtime);
  const snapshot = { character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main' } };

  const planned = planner.spawnCandidates(snapshot, gameData, {}, {});
  const live = farmer._safeLiveMonsters(snapshot, { members: [] });

  assert.deepEqual(planned.map((row) => row.monster), ['crab']);
  assert.deepEqual(live.map((entity) => entity.mtype), ['crab']);
  assert.equal(hotfix.status().plannerInstalled, true);
  assert.equal(hotfix.status().farmerInstalled, true);
  assert.equal(hotfix.status().stats.extremeEvasionRejected, 2);
});

test('resilient persistence preflights the actual Adventure Land store_ key before set()', () => {
  const localStorage = createLocalStorage({ filler: 'x'.repeat(499900) });
  let setCalls = 0;
  const root = {
    localStorage,
    get() { return null; },
    set() { setCalls += 1; }
  };
  const persistence = new ResilientWorldPersistence({
    root,
    storageHighWatermarkChars: 500000,
    maxBytes: 900000,
    now: () => 1000
  });

  assert.equal(persistence.maybeSave(world(JSON.stringify({ value: 'y'.repeat(250) })), { force: true }), false);
  assert.equal(setCalls, 0);
  assert.equal(persistence.status().quotaBlocked, true);
  assert.equal(persistence.status().preflightQuotaBlocks, 1);
  assert.equal(persistence.status().lastWriteError, 'PERSISTENCE_QUOTA_PRESSURE');
});

test('quota projection treats an existing store_AIO_V3_WORLD_MODEL as a replacement, not duplicate growth', () => {
  const existing = 'x'.repeat(400000);
  const replacement = 'y'.repeat(400000);
  const localStorage = createLocalStorage({
    store_AIO_V3_WORLD_MODEL: existing,
    other: 'z'.repeat(50000)
  });
  let setCalls = 0;
  const root = {
    localStorage,
    get() { return null; },
    set(key, value) {
      setCalls += 1;
      localStorage.setItem(`store_${key}`, value);
    }
  };
  const persistence = new ResilientWorldPersistence({
    root,
    storageHighWatermarkChars: 500000,
    maxBytes: 900000,
    now: () => 2000
  });

  assert.equal(persistence.maybeSave(world(replacement), { force: true }), true);
  assert.equal(setCalls, 1);
  assert.equal(persistence.status().quotaBlocked, false);
});

test('a real QuotaExceededError permanently blocks repeated resilient writes for the session', () => {
  let setCalls = 0;
  const root = {
    get() { return null; },
    set() {
      setCalls += 1;
      const error = new Error("Failed to execute 'setItem' on 'Storage': Setting the value exceeded the quota.");
      error.name = 'QuotaExceededError';
      throw error;
    }
  };
  const persistence = new ResilientWorldPersistence({ root, now: () => 3000 });
  const model = world('{"ok":true}');

  assert.equal(persistence.maybeSave(model, { force: true }), false);
  assert.equal(setCalls, 1);
  assert.equal(persistence.status().quotaBlocked, true);
  assert.equal(persistence.status().writeFailures, 1);

  assert.equal(persistence.maybeSave(model, { force: true }), false);
  assert.equal(setCalls, 1);
});
