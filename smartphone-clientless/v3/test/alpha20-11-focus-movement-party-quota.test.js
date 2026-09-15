'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installFarmerTerrainNavigationHotfix } = require('../src/reliability/farmer-terrain-navigation-hotfix');
const { installPartyFocusFireHotfix } = require('../src/reliability/party-focus-fire-hotfix');
const { installPartyPersistenceQuotaHotfix } = require('../src/reliability/party-persistence-quota-hotfix');

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

function createTerrainFarmer(now = () => 10000) {
  const transitions = [];
  const blocks = [];
  const clears = [];
  const farmer = {
    now,
    lastActionAt: 0,
    config: { moveCooldownMs: 0 },
    _safeLiveMonsters(snapshot) { return snapshot.entities || []; },
    _targetAllowed() { return true; },
    _engagementRange() { return 80; },
    _clearTarget(reason) { clears.push(reason); },
    _transition(state, reason) { transitions.push({ state, reason }); },
    _block(reason) { blocks.push(reason); },
    _event() {}
  };
  return { farmer, transitions, blocks, clears };
}

test('terrain navigation uses a reachable bounded alternate instead of issuing an impossible straight move', () => {
  const clock = () => 10000;
  const { farmer, blocks } = createTerrainFarmer(clock);
  const moves = [];
  const root = {
    can_move_to(x, y) { return Math.abs(Number(y)) > 1; }
  };
  const runtime = { root, now: clock, log: { emit() {} }, farmer };
  const hotfix = installFarmerTerrainNavigationHotfix(runtime, { minStep: 50, maxStep: 120, stepSeconds: 2 });
  const target = { id: 'far-target', mtype: 'crab', x: 500, y: 0, hp: 400 };
  const context = {
    snapshot: { character: { name: 'My_Ranger2', x: 0, y: 0, speed: 60, map: 'main' }, entities: [target] },
    party: { members: [] },
    adapter: { command(action, args) { moves.push({ action, args }); return { executed: true }; } }
  };

  farmer._travel(context, target);
  assert.equal(moves.length, 1);
  assert.equal(moves[0].action, 'move');
  assert.notEqual(Math.round(moves[0].args[1]), 0);
  assert.equal(blocks.length, 0);
  assert.equal(hotfix.status().stats.alternateWaypoints, 1);
});

test('unreachable local target is temporarily filtered without poisoning the whole farmer state', () => {
  let now = 20000;
  const { farmer, transitions, blocks, clears } = createTerrainFarmer(() => now);
  const root = { can_move_to() { return false; } };
  let moveCalls = 0;
  const runtime = { root, now: () => now, log: { emit() {} }, farmer };
  const hotfix = installFarmerTerrainNavigationHotfix(runtime, { blockedTargetMs: 12000 });
  const target = { id: 'blocked-target', mtype: 'squigtoad', x: 500, y: 0, hp: 1000 };
  const snapshot = { character: { name: 'My_Ranger2', x: 0, y: 0, speed: 60, map: 'main' }, entities: [target] };
  const context = { snapshot, party: { members: [] }, adapter: { command() { moveCalls += 1; return { executed: true }; } } };

  farmer._travel(context, target);
  assert.equal(moveCalls, 0);
  assert.equal(blocks.length, 0);
  assert.deepEqual(clears, ['TARGET_PATH_LOCALLY_BLOCKED']);
  assert.deepEqual(transitions.at(-1), { state: 'REASSESS', reason: 'TARGET_PATH_LOCALLY_BLOCKED' });
  assert.deepEqual(farmer._safeLiveMonsters(snapshot, { members: [] }), []);
  assert.equal(hotfix.status().stats.noReachableWaypoint, 1);

  now += 12001;
  assert.equal(farmer._safeLiveMonsters(snapshot, { members: [] }).length, 1);
});

test('movement circuit rejection causes target reselection instead of global farmer BLOCKED', () => {
  const { farmer, transitions, blocks, clears } = createTerrainFarmer(() => 30000);
  const runtime = { root: { can_move_to() { return true; } }, now: () => 30000, log: { emit() {} }, farmer };
  const hotfix = installFarmerTerrainNavigationHotfix(runtime);
  const target = { id: 'circuit-target', mtype: 'squigtoad', x: 500, y: 0, hp: 1000 };
  const context = {
    snapshot: { character: { name: 'My_Ranger2', x: 0, y: 0, speed: 60, map: 'main' }, entities: [target] },
    party: { members: [] },
    adapter: { command() { return { executed: false, reason: 'MOVEMENT_CIRCUIT_OPEN' }; } }
  };

  farmer._travel(context, target);
  assert.equal(blocks.length, 0);
  assert.deepEqual(clears, ['MOVEMENT_FAILURE_RESELECT']);
  assert.deepEqual(transitions.at(-1), { state: 'REASSESS', reason: 'MOVEMENT_FAILURE_RESELECT' });
  assert.equal(hotfix.status().stats.movementCircuitReselects, 1);
});

function focusContext(selfName = 'My_Ranger3') {
  const crabA = { id: 'crab-a', mtype: 'crab', x: 80, y: 0, hp: 400, target: null };
  const crabB = { id: 'crab-b', mtype: 'crab', x: 60, y: 30, hp: 400, target: null };
  const snapshot = {
    character: { name: selfName, ctype: 'ranger', x: 0, y: 0, speed: 60, target: selfName === 'My_Ranger1' ? 'crab-a' : 'crab-b' },
    party: [
      { name: 'My_Merchant', type: 'merchant' },
      { name: 'My_Ranger1', type: 'ranger' },
      { name: 'My_Ranger2', type: 'ranger' },
      { name: 'My_Ranger3', type: 'ranger' }
    ],
    entities: [
      { id: 'ranger-one', name: 'My_Ranger1', type: 'character', player: true, target: 'crab-a', x: 10, y: 0 },
      crabA,
      crabB
    ]
  };
  return { snapshot, crabA, crabB };
}

test('follower selects the visible safe anchor target without CM communication', () => {
  const { snapshot, crabA, crabB } = focusContext('My_Ranger3');
  const farmer = {
    planner: null,
    _candidateRows() { return { rows: [{ id: 'crab', monster: 'crab', score: 0.8, source: 'measured', confidence: 1, travelSeconds: 1 }], monsters: [crabA, crabB] }; },
    _selectTarget() { return { target: crabB, ranking: { id: 'crab', monster: 'crab', score: 0.8, source: 'measured', confidence: 1, travelSeconds: 1 } }; },
    _maybeReassessTarget(context, target) { return target; },
    targetReassessment: { switchCooldownMs: 0 },
    lastTargetSwitchAt: -Infinity,
    _event() {}
  };
  const runtime = { now: () => 40000, log: { emit() {} }, farmer };
  const hotfix = installPartyFocusFireHotfix(runtime, { maxFocusDistance: 320 });
  const context = { snapshot, party: { fingerprint: 'merchant:1|ranger:3', members: [] } };

  const selected = farmer._selectTarget(context);
  assert.equal(selected.target.id, 'crab-a');
  assert.match(selected.ranking.source, /^party-focus:/);
  assert.equal(hotfix.status().stats.selectionFocusHits, 1);

  const reassessed = farmer._maybeReassessTarget(context, crabB);
  assert.equal(reassessed.id, 'crab-a');
  assert.equal(farmer.targetId, 'crab-a');
  assert.equal(hotfix.status().stats.reassessmentFocusSwitches, 1);
});

test('focus fire cannot override safety filtering or self-defense', () => {
  const { snapshot, crabA, crabB } = focusContext('My_Ranger3');
  const farmer = {
    planner: null,
    _candidateRows() { return { rows: [{ id: 'crab', monster: 'crab', score: 0.8, source: 'measured', confidence: 1, travelSeconds: 1 }], monsters: [crabB] }; },
    _selectTarget() { return { target: crabB, ranking: { id: 'crab', monster: 'crab', score: 0.8, source: 'measured', confidence: 1, travelSeconds: 1 } }; },
    _maybeReassessTarget(context, target) { return target; },
    targetReassessment: { switchCooldownMs: 0 },
    lastTargetSwitchAt: -Infinity,
    _event() {}
  };
  const runtime = { now: () => 50000, log: { emit() {} }, farmer };
  installPartyFocusFireHotfix(runtime);
  const context = { snapshot, party: { fingerprint: 'merchant:1|ranger:3', members: [] } };
  assert.equal(farmer._selectTarget(context).target.id, 'crab-b');

  farmer._candidateRows = () => ({ rows: [{ id: 'crab', monster: 'crab', score: 0.8, source: 'measured', confidence: 1, travelSeconds: 1 }], monsters: [crabA, crabB] });
  crabB.target = 'My_Ranger3';
  assert.equal(farmer._selectTarget(context).target.id, 'crab-b');
});

function fakePersistentStore(root, key) {
  return {
    root,
    key,
    storage: null,
    stats: { saveFailures: 0 },
    _backend() { return { get: (name) => root.get(name), set: (name, value) => root.set(name, value) }; },
    save() {
      try { this._backend().set(this.key, JSON.stringify({ payload: 'x'.repeat(200) })); return true; }
      catch (_) { this.stats.saveFailures += 1; return false; }
    }
  };
}

test('party performance and lifecycle preflight actual store_ keys and stop quota write spam', () => {
  const localStorage = createLocalStorage({ filler: 'x'.repeat(499900) });
  let setCalls = 0;
  const root = {
    localStorage,
    get(key) { return localStorage.getItem(`store_${key}`); },
    set(key, value) { setCalls += 1; localStorage.setItem(`store_${key}`, value); }
  };
  const runtime = {
    root,
    now: () => 60000,
    log: { emit() {} },
    partyPerformance: fakePersistentStore(root, 'AIO_V3_PARTY_PERFORMANCE'),
    partyLifecycle: fakePersistentStore(root, 'AIO_V3_PARTY_LIFECYCLE')
  };
  const hotfix = installPartyPersistenceQuotaHotfix(runtime, { storageHighWatermarkChars: 500000 });

  assert.equal(runtime.partyPerformance.save(), false);
  assert.equal(runtime.partyLifecycle.save(), false);
  assert.equal(setCalls, 0);
  assert.equal(runtime.partyPerformance.save(), false);
  assert.equal(runtime.partyLifecycle.save(), false);
  assert.equal(setCalls, 0);
  assert.equal(hotfix.status().stores.partyPerformance.quotaBlocked, true);
  assert.equal(hotfix.status().stores.partyLifecycle.quotaBlocked, true);
});

test('real party persistence QuotaExceededError gets one attempt per store then hard blocks the session', () => {
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
  const runtime = {
    root,
    now: () => 70000,
    log: { emit() {} },
    partyPerformance: fakePersistentStore(root, 'AIO_V3_PARTY_PERFORMANCE'),
    partyLifecycle: fakePersistentStore(root, 'AIO_V3_PARTY_LIFECYCLE')
  };
  const hotfix = installPartyPersistenceQuotaHotfix(runtime);

  assert.equal(runtime.partyPerformance.save(), false);
  assert.equal(runtime.partyPerformance.save(), false);
  assert.equal(runtime.partyLifecycle.save(), false);
  assert.equal(runtime.partyLifecycle.save(), false);
  assert.equal(setCalls, 2);
  assert.equal(hotfix.status().stores.partyPerformance.quotaWriteFailures, 1);
  assert.equal(hotfix.status().stores.partyLifecycle.quotaWriteFailures, 1);
});
