'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install, Alpha20_5FarmReadinessRuntime } = require('../src');

function localStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.has(key) ? rows.get(key) : null; },
    setItem(key, value) { rows.set(key, String(value)); },
    removeItem(key) { rows.delete(key); }
  };
}

function merchantRoot() {
  let moves = 0;
  let attacks = 0;
  const root = {
    localStorage: localStorage(),
    character: {
      name: 'My_Merchant', ctype: 'merchant', level: 60, map: 'main', x: 0, y: 0,
      hp: 2000, max_hp: 2000, mp: 1000, max_mp: 1000, gold: 1000000,
      rip: false, isize: 8, items: Array(8).fill(null), slots: {}
    },
    entities: {},
    party: {},
    G: { monsters: {}, maps: { main: {} }, npcs: {}, items: {}, skills: {}, events: {} },
    move() { moves += 1; },
    attack() { attacks += 1; },
    get_chests() { return {}; },
    get_player() { return null; },
    send_cm() {},
    can_move_to() { return true; },
    can_attack() { return false; },
    is_in_range() { return false; }
  };
  root.parent = root;
  return { root, calls: { moves: () => moves, attacks: () => attacks } };
}

test('production Alpha20.5 runtime installs Merchant stopped without any generic Farmer scheduling authority', () => {
  const fixture = merchantRoot();
  const api = install(fixture.root, { debugMonitorVisible: false, visibleStatus: false });
  const runtime = api.__runtime;
  assert.ok(runtime instanceof Alpha20_5FarmReadinessRuntime);
  assert.equal(runtime.adapter.mode, 'active');
  assert.equal(runtime.status().running, false);
  assert.equal(runtime.farmer.enabled, false);
  assert.equal(runtime.localFarming.enabled, false);
  assert.equal(runtime.farmer.ensureScheduled(runtime.scheduler, 'My_Merchant'), null);
  assert.equal(runtime.scheduler.queue.length, 0);
  assert.equal(runtime.preFarmingReliability.status().merchantFarmerSchedulingAllowed, false);
  assert.equal(fixture.calls.moves(), 0);
  assert.equal(fixture.calls.attacks(), 0);
});

test('production Alpha20.5 runtime treats missing bank and Farmer service evidence as unobservable instead of zero', () => {
  const fixture = merchantRoot();
  const api = install(fixture.root, { debugMonitorVisible: false, visibleStatus: false });
  const runtime = api.__runtime;

  const bank = runtime.bankCapacity.observe({ character: fixture.root.character, observedAt: 1000 });
  assert.equal(bank.observationState, 'NOT_OBSERVABLE');
  assert.equal(bank.totals.free, null);
  assert.equal(bank.pressureNow, false);

  const report = runtime.partyTelemetry._cleanReport({
    name: 'FarmerA', ctype: 'ranger', level: 60, at: 1000, map: 'main', supplies: {}
  }, 'FarmerA');
  assert.equal(report.x, null);
  assert.equal(report.y, null);
  assert.equal(report.supplies.hpPotions, null);
  assert.equal(report.supplies.mpPotions, null);
  assert.equal(report.supplies.freeSlots, null);
  assert.equal(report.serviceEvidenceComplete, false);
});
