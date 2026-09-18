'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateTargetEfficiency } = require('../src/farmer/target-efficiency');
const { installFarmerTargetEfficiencyHotfix } = require('../src/farmer/farmer-target-efficiency-hotfix');
const { ReliabilityCheckpointStore } = require('../src/ops/reliability-checkpoint');

function createLocalStorage(entries = {}) {
  const values = new Map(Object.entries(entries).map(([key, value]) => [String(key), String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    values
  };
}

test('routine farm policy rejects Giga Crab style special content but preserves normal targets', () => {
  const gameData = {
    monsters: {
      crabxx: { name: 'Giga Crab', special: true, cooperative: true, respawn: -1, hp: 960000, attack: 16000 },
      crabx: { name: 'Huge Crab', respawn: 4, hp: 4200, attack: 240 },
      frog: { name: 'Froggie', evasion: 99, respawn: 960 }
    }
  };

  const special = evaluateTargetEfficiency({ mtype: 'crabxx' }, gameData, {
    character: { name: 'My_Ranger1', ctype: 'ranger' },
    routineFarm: true
  });
  const normal = evaluateTargetEfficiency({ mtype: 'crabx' }, gameData, {
    character: { name: 'My_Ranger1', ctype: 'ranger' },
    routineFarm: true
  });

  assert.equal(special.allowed, false);
  assert.equal(special.reason, 'SPECIAL_CONTENT_NOT_ROUTINE_FARM');
  assert.equal(normal.allowed, true);
});

test('special content that is already attacking the farmer is not suppressed solely by routine classification', () => {
  const gameData = { monsters: { eventboss: { special: true, cooperative: true, respawn: -1 } } };
  const verdict = evaluateTargetEfficiency({ mtype: 'eventboss', target: 'My_Ranger1' }, gameData, {
    character: { name: 'My_Ranger1', ctype: 'ranger' },
    routineFarm: true
  });
  assert.equal(verdict.allowed, true);
  assert.equal(verdict.defensive, true);
});

test('planner rejects crabxx while keeping normal crabx and rejecting Froggie', () => {
  const gameData = {
    monsters: {
      crabxx: { special: true, cooperative: true, respawn: -1 },
      crabx: { respawn: 4 },
      frog: { evasion: 99, respawn: 960 }
    }
  };
  const planner = {
    spawnCandidates() {
      return [
        { id: 'main:crabxx:0', monster: 'crabxx' },
        { id: 'main:crabx:1', monster: 'crabx' },
        { id: 'main:frog:2', monster: 'frog' }
      ];
    }
  };
  const runtime = {
    now: () => 1000,
    log: { emit() {} },
    adapter: { getGameData: () => gameData },
    localFarmPlanner: planner,
    farmer: null
  };
  const hotfix = installFarmerTargetEfficiencyHotfix(runtime);
  const snapshot = { character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main' } };

  const rows = planner.spawnCandidates(snapshot, gameData, {}, {});
  assert.deepEqual(rows.map((row) => row.monster), ['crabx']);
  assert.equal(hotfix.status().stats.nonRoutineRejected, 1);
  assert.equal(hotfix.status().stats.extremeEvasionRejected, 1);
});

test('after spawn arrival a same-snapshot safe normal monster can recover an empty planned-target list', () => {
  const gameData = {
    monsters: {
      crabxx: { special: true, cooperative: true, respawn: -1 },
      crab: { respawn: 0.64 },
      frog: { evasion: 99, respawn: 960 }
    }
  };
  const farmer = {
    // Simulates the pre-farming planned-monster filter returning no crabxx.
    _safeLiveMonsters() { return []; },
    _targetAllowed() { return true; }
  };
  const runtime = {
    now: () => 2000,
    log: { emit() {} },
    adapter: { getGameData: () => gameData },
    localFarmPlanner: null,
    localFarming: {
      currentPlan: {
        id: 'local-farm-live-regression',
        monster: 'crabxx',
        state: 'HOLDING',
        completionReason: 'SPAWN_RADIUS_REACHED'
      },
      lastDecision: { reason: 'SPAWN_RADIUS_REACHED' }
    },
    preFarmingReliability: {
      safeEntityIds: new Set(['crab-live', 'frog-live', 'crabxx-live']),
      safeEntitySnapshotAt: 12345
    },
    farmer
  };
  const hotfix = installFarmerTargetEfficiencyHotfix(runtime);
  const snapshot = {
    observedAt: 12345,
    character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main' },
    entities: [
      { id: 'crab-live', mtype: 'crab', map: 'main', hp: 400 },
      { id: 'frog-live', mtype: 'frog', map: 'main', hp: 600 },
      { id: 'crabxx-live', mtype: 'crabxx', map: 'main', hp: 960000 }
    ]
  };

  const targets = farmer._safeLiveMonsters(snapshot, { members: [] });
  assert.deepEqual(targets.map((entity) => entity.mtype), ['crab']);
  assert.equal(hotfix.status().stats.arrivalFallbackActivations, 1);
  assert.equal(hotfix.status().stats.arrivalFallbackCandidates, 1);
  assert.equal(hotfix.status().lastArrivalFallback.plannedMonster, 'crabxx');
});

test('arrival fallback fails closed when safety approval belongs to another snapshot', () => {
  const farmer = { _safeLiveMonsters() { return []; }, _targetAllowed() { return true; } };
  const runtime = {
    now: () => 2500,
    log: { emit() {} },
    adapter: { getGameData: () => ({ monsters: { crab: { respawn: 1 } } }) },
    localFarming: {
      currentPlan: { monster: 'crab', state: 'HOLDING', completionReason: 'SPAWN_RADIUS_REACHED' },
      lastDecision: { reason: 'SPAWN_RADIUS_REACHED' }
    },
    preFarmingReliability: { safeEntityIds: new Set(['crab-live']), safeEntitySnapshotAt: 111 },
    farmer
  };
  installFarmerTargetEfficiencyHotfix(runtime);
  const snapshot = {
    observedAt: 222,
    character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main' },
    entities: [{ id: 'crab-live', mtype: 'crab', map: 'main', hp: 400 }]
  };
  assert.deepEqual(farmer._safeLiveMonsters(snapshot, { members: [] }), []);
});

test('reliability checkpoint preflights the Adventure Land store_ keys and avoids the first quota write', () => {
  const localStorage = createLocalStorage({ filler: 'x'.repeat(499900) });
  let setCalls = 0;
  const root = {
    localStorage,
    get(key) { return localStorage.getItem(`store_${key}`); },
    set(key, value) {
      setCalls += 1;
      localStorage.setItem(`store_${key}`, value);
    }
  };
  const checkpoint = new ReliabilityCheckpointStore({
    root,
    now: () => 3000,
    storageHighWatermarkChars: 500000
  });

  const result = checkpoint.save({ farmer: { state: 'ASSESS' } });
  assert.equal(result.saved, false);
  assert.equal(result.reason, 'CHECKPOINT_QUOTA_PRESSURE');
  assert.equal(setCalls, 0);
  assert.equal(checkpoint.status().quotaBlocked, true);
  assert.equal(checkpoint.status().stats.preflightQuotaBlocks, 1);
});

test('a real checkpoint QuotaExceededError causes one write attempt and then a session hard block', () => {
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
  const checkpoint = new ReliabilityCheckpointStore({ root, now: () => 4000 });

  const first = checkpoint.save({ farmer: { state: 'ASSESS' } });
  assert.equal(first.saved, false);
  assert.equal(first.reason, 'CHECKPOINT_QUOTA_EXCEEDED');
  assert.equal(setCalls, 1);
  assert.equal(checkpoint.status().quotaBlocked, true);
  assert.equal(checkpoint.status().stats.quotaWriteFailures, 1);

  const second = checkpoint.save({ farmer: { state: 'ASSESS' } });
  assert.equal(second.saved, false);
  assert.equal(second.reason, 'QUOTA_BLOCKED');
  assert.equal(setCalls, 1);
});
