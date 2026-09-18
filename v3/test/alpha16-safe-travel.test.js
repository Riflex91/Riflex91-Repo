'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha15Runtime, Alpha16Runtime, SafeTravelController, TRAVEL_SCHEMA_VERSION, TRAVEL_MODE, TravelState } = require('../src');

function gameData() {
  return { monsters: {}, maps: { main: {}, winterland: {}, bank: {} }, npcs: {}, items: {}, skills: {}, events: {} };
}
function snapshot(map = 'main', x = 0, y = 0) {
  return { observedAt: 1, character: { name: 'M1', ctype: 'merchant', level: 80, map, x, y, real_x: x, real_y: y, hp: 100, max_hp: 100, mp: 100, max_mp: 100, xp: 0, gold: 0, items: [], slots: {}, speed: 40, rip: false }, entities: [], party: [] };
}
function drift(blocked = new Set()) {
  return { requiresRevalidation(category, id) { return blocked.has(`${category}:${id}`); } };
}

test('Alpha15 runtime version is frozen after Alpha16 release bump', () => {
  const root = { character: snapshot().character, parent: { entities: {}, party: {} }, G: gameData(), performance_trick() {} };
  const runtime = new Alpha15Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: { get: () => null, set() {} } });
  assert.equal(runtime.status().version, '3.0.0-alpha.15.0');
});

test('Safe Travel schema is bounded and exposes no live authority', () => {
  const travel = new SafeTravelController({ capacity: 16 });
  const status = travel.status();
  assert.equal(status.schemaVersion, TRAVEL_SCHEMA_VERSION);
  assert.equal(status.mode, TRAVEL_MODE);
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directGameplayActionAccess, false);
  assert.equal(status.liveExecutionEnabled, false);
  assert.equal(status.smartMoveExecutionEnabled, false);
  assert.equal(status.serverChangeAllowed, false);
  assert.equal(status.unknownMapTravelAllowed, false);
  assert.ok(status.capacity >= 16 && status.capacity <= 256);
});

test('Safe Travel accepts known maps and records bounded same/cross-map plans', () => {
  const travel = new SafeTravelController();
  const same = travel.plan({ destination: { map: 'main', x: 100, y: 50 } }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
  assert.equal(same.accepted, true);
  assert.equal(same.plan.routeKind, 'SAME_MAP');
  assert.equal(same.plan.liveExecutionAllowed, false);
  const cross = travel.plan({ destination: 'winterland' }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
  assert.equal(cross.accepted, true);
  assert.equal(cross.plan.routeKind, 'CROSS_MAP_KNOWN_ONLY');
});

test('Safe Travel rejects unknown/drifted maps and any server change request', () => {
  const travel = new SafeTravelController();
  assert.equal(travel.plan({ destination: 'void' }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() }).reason, 'UNKNOWN_DESTINATION_MAP');
  assert.equal(travel.plan({ destination: 'winterland' }, { gameData: gameData(), contentDrift: drift(new Set(['maps:winterland'])), snapshot: snapshot() }).reason, 'DESTINATION_MAP_REQUIRES_REVALIDATION');
  assert.equal(travel.plan({ destination: 'winterland', server: 'US I' }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() }).reason, 'SERVER_CHANGE_FORBIDDEN');
});

test('Synthetic travel verifies material position progress and exact arrival', () => {
  let now = 1000;
  const travel = new SafeTravelController({ now: () => now, minProgressDistance: 10, noProgressMs: 1000, arrivalRadius: 20 });
  const planned = travel.plan({ destination: { map: 'main', x: 100, y: 0 } }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
  assert.equal(travel.startSynthetic(planned.plan.id).started, true);
  now += 200;
  travel.observe(snapshot('main', 20, 0));
  assert.equal(travel.get(planned.plan.id).state, TravelState.TRAVELLING);
  assert.equal(travel.status().stats.progress, 1);
  now += 200;
  travel.observe(snapshot('main', 90, 0));
  assert.equal(travel.get(planned.plan.id).state, TravelState.COMPLETED);
  assert.equal(travel.get(planned.plan.id).reason, 'ARRIVAL_VERIFIED');
});

test('Map-only cross-map synthetic plan completes only after observed map change', () => {
  let now = 100;
  const travel = new SafeTravelController({ now: () => now });
  const planned = travel.plan({ destination: 'winterland' }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
  travel.startSynthetic(planned.plan.id);
  now += 100;
  travel.observe(snapshot('main', 20, 20));
  assert.equal(travel.get(planned.plan.id).state, TravelState.TRAVELLING);
  now += 100;
  travel.observe(snapshot('winterland', 0, 0));
  assert.equal(travel.get(planned.plan.id).state, TravelState.COMPLETED);
});

test('No-progress and lease timeout fail safe and open a bounded travel circuit', () => {
  let now = 0;
  const travel = new SafeTravelController({ now: () => now, noProgressMs: 2000, leaseMs: 5000, failureThreshold: 2, circuitCooldownMs: 3000 });
  for (let i = 0; i < 2; i += 1) {
    const planned = travel.plan({ destination: { map: 'main', x: 500, y: 0 } }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
    assert.equal(planned.accepted, true);
    travel.startSynthetic(planned.plan.id);
    now += 2001;
    travel.observe(snapshot());
    assert.equal(travel.get(planned.plan.id).state, TravelState.FAILED_SAFE);
  }
  assert.equal(travel.breaker().open, true);
  assert.equal(travel.plan({ destination: 'winterland' }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() }).reason, 'TRAVEL_CIRCUIT_OPEN');
  now += 5001;
  assert.equal(travel.breaker().open, false);
});

test('Cancelling a plan is terminal and prevents synthetic execution', () => {
  const travel = new SafeTravelController();
  const planned = travel.plan({ destination: 'bank' }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
  assert.equal(travel.cancel(planned.plan.id, 'TEST_CANCEL').cancelled, true);
  assert.equal(travel.get(planned.plan.id).state, TravelState.ABORTED);
  assert.equal(travel.startSynthetic(planned.plan.id).started, false);
});

test('Alpha16 runtime integrates travel planning but rejects live travel authority', () => {
  let now = 10000;
  const root = { character: snapshot().character, parent: { entities: {}, party: {} }, G: gameData(), performance_trick() {} };
  const runtime = new Alpha16Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, visibleStatus: false, storage: { get: () => null, set() {} }, contentDriftScanMs: 1000 });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.16.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.travel.actionAuthority, false);
  assert.equal(status.travel.liveExecutionEnabled, false);
  assert.equal(runtime.setTravelLiveEnabled(true), false);
  const plan = runtime.planTravel({ destination: 'winterland' });
  assert.equal(plan.accepted, true);
  assert.equal(plan.plan.liveExecutionAllowed, false);
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('2000 travel planning/cancel cycles remain bounded and JSON-safe', () => {
  let now = 0;
  const travel = new SafeTravelController({ now: () => now, capacity: 32 });
  for (let i = 0; i < 2000; i += 1) {
    now += 10;
    const planned = travel.plan({ destination: { map: 'main', x: i % 100, y: 0 } }, { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() });
    if (planned.accepted) travel.cancel(planned.plan.id, 'SOAK_CANCEL');
    travel.tick(snapshot());
  }
  assert.ok(travel.list(1000).length <= 32);
  assert.equal(travel.status().active, 0);
  assert.doesNotThrow(() => JSON.stringify(travel.status()));
  assert.doesNotThrow(() => JSON.stringify(travel.list(1000)));
});


test('per-plan buffered arrival radius completes service travel before exact coordinates', () => {
  let now = 1000;
  const travel = new SafeTravelController({ now: () => now, arrivalRadius: 20 });
  const planned = travel.plan(
    { destination: { map: 'main', x: 100, y: 0 }, arrivalRadius: 90, metadata: { stopWhenInteractionReady: true } },
    { gameData: gameData(), contentDrift: drift(), snapshot: snapshot() }
  );
  assert.equal(planned.accepted, true);
  assert.equal(planned.plan.arrivalRadius, 90);
  travel.startSynthetic(planned.plan.id);
  now += 100;
  travel.observe(snapshot('main', 15, 0));
  assert.equal(travel.get(planned.plan.id).state, TravelState.COMPLETED);
});
