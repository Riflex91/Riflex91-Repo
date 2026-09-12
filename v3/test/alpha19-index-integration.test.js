'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install, Alpha19Runtime, VERSION } = require('../src');

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

test('public install uses Alpha19Runtime and exposes bounded space recovery API default-off', () => {
  const r = root();
  const api = install(r, { mode: 'shadow', visibleStatus: false, debugMonitorVisible: false, storage: storage() });
  assert.equal(VERSION, '3.0.0-alpha.19.0');
  assert.equal(api.version, '3.0.0-alpha.19.0');
  assert.ok(api.__runtime instanceof Alpha19Runtime);
  assert.equal(api.status().version, '3.0.0-alpha.19.0');
  assert.equal(api.economy.spaceRecovery.status().enabled, false);
  assert.equal(api.economy.spaceRecovery.status().actionAuthority, false);
  assert.equal(api.economy.spaceRecovery.consolidation.status().enabled, false);
  assert.equal(typeof api.economy.spaceRecovery.plan, 'function');
  assert.equal(typeof api.economy.spaceRecovery.controlled.execute, 'function');

  const rejected = api.economy.spaceRecovery.controlled.configure({ enabled: true, ack: 'ALPHA19_SPACE_RECOVERY' });
  assert.equal(rejected.enabled, false);
  assert.equal(rejected.enableRejected, 'RUNTIME_NOT_ACTIVE');
});

test('leaving active mode disables Alpha.19 parent and consolidation child authority', () => {
  const r = root();
  const runtime = new Alpha19Runtime({ root: r, parent: r.parent, mode: 'active', visibleStatus: false, storage: storage() });
  runtime.globalSupervisor.lastEvaluatedAt = runtime.now();
  runtime.globalSupervisor.state = 'HEALTHY';
  runtime.controlledMerchantSpaceRecovery.configure({ enabled: true, ack: 'ALPHA19_SPACE_RECOVERY' });
  runtime.controlledBankConsolidation.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  assert.equal(runtime.controlledMerchantSpaceRecovery.status().enabled, true);
  assert.equal(runtime.controlledBankConsolidation.status().enabled, true);
  runtime.setMode('shadow');
  assert.equal(runtime.controlledMerchantSpaceRecovery.status().enabled, false);
  assert.equal(runtime.controlledBankConsolidation.status().enabled, false);
});
