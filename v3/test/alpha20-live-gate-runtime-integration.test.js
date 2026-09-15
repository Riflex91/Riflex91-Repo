'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install, Alpha20Runtime } = require('../src');

function storage() {
  const rows = new Map();
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; } };
}

function root() {
  const value = {
    AIO_V3_AUTOSTART: false,
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 10000000, rip: false,
      items: [], isize: 42, slots: {}, speed: 40, bank: { items0: [null] }
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { bank: {} }, npcs: {}, skills: {}, events: {}, items: {} },
    bank_packs: { items0: ['bank', 0, 0] },
    performance_trick() {}, setTimeout, clearTimeout, setInterval, clearInterval
  };
  value.globalThis = value;
  return value;
}

test('public Alpha20Runtime exposes the hardened combined live gate while remaining default-off', async () => {
  const r = root();
  const api = install(r, { mode: 'shadow', visibleStatus: false, debugMonitorVisible: false, storage: storage() });
  const runtime = api.__runtime;
  assert.ok(runtime instanceof Alpha20Runtime);
  assert.equal(typeof runtime.runAlpha20CombinedLiveGate, 'function');
  assert.equal(typeof runtime.cancelAlpha20CombinedLiveGate, 'function');
  assert.equal(typeof runtime.alpha20LiveGateStatus, 'function');
  assert.equal(typeof runtime.alpha20LiveGateResult, 'function');
  assert.equal(typeof runtime.alpha20LiveGateResultText, 'function');

  const status = runtime.alpha20LiveGateStatus();
  assert.equal(status.release, '3.0.0-alpha.20.39');
  assert.equal(status.requiredAck, 'ALPHA20_FULL_LIVE_GATE');
  assert.equal(status.running, false);
  assert.equal(status.abortable, true);
  assert.equal(api.status().alpha20.liveGateAck, 'ALPHA20_FULL_LIVE_GATE');
  assert.equal(api.status().alpha20.liveGate.running, false);

  const wrong = await runtime.runAlpha20CombinedLiveGate({ ack: 'WRONG_ACK' });
  assert.equal(wrong.accepted, false);
  assert.equal(wrong.reason, 'ALPHA20_LIVE_GATE_ACK_REQUIRED');
  assert.equal(runtime.alpha20LiveGateStatus().running, false);
  assert.equal(api.party.lifecycle.controlled.status().enabled, false);
  assert.equal(api.party.lifecycle.aura.status().enabled, false);
});

test('idle cancel is explicit and cannot manufacture a live-gate result', () => {
  const r = root();
  const api = install(r, { mode: 'shadow', visibleStatus: false, debugMonitorVisible: false, storage: storage() });
  const cancelled = api.__runtime.cancelAlpha20CombinedLiveGate('USER_TEST_CANCEL');
  assert.equal(cancelled.accepted, false);
  assert.equal(cancelled.reason, 'ALPHA20_LIVE_GATE_NOT_RUNNING');
  assert.equal(api.__runtime.alpha20LiveGateResult(), null);
  assert.equal(api.__runtime.alpha20LiveGateResultText(), null);
});
