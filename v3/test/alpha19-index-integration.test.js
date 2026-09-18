'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install, Alpha19Runtime, Alpha20Runtime, VERSION } = require('../src');

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

test('public install advances to Alpha20Runtime while Alpha.19 economy remains bounded/default-off', () => {
  const r = root();
  const api = install(r, { mode: 'shadow', visibleStatus: false, debugMonitorVisible: false, storage: storage() });
  assert.equal(VERSION, '3.0.0-alpha.20.109');
  assert.equal(api.version, '3.0.0-alpha.20.109');
  assert.ok(api.__runtime instanceof Alpha20Runtime);
  assert.ok(api.__runtime instanceof Alpha19Runtime);
  assert.equal(api.status().version, '3.0.0-alpha.20.109');
  assert.equal(api.economy.spaceRecovery.status().enabled, false);
  assert.equal(api.economy.spaceRecovery.status().actionAuthority, false);
  assert.equal(api.economy.spaceRecovery.consolidation.status().enabled, false);
  assert.equal(typeof api.economy.spaceRecovery.plan, 'function');
  assert.equal(typeof api.economy.spaceRecovery.controlled.execute, 'function');

  const rejected = api.economy.spaceRecovery.controlled.configure({ enabled: true, ack: 'ALPHA19_SPACE_RECOVERY' });
  assert.equal(rejected.enabled, false);
  assert.equal(rejected.enableRejected, 'RUNTIME_NOT_ACTIVE');
});

test('public Alpha.20 lifecycle API is default-off and legacy direct party switches cannot bypass it', () => {
  const r = root();
  const api = install(r, { mode: 'shadow', visibleStatus: false, debugMonitorVisible: false, storage: storage() });
  const status = api.party.lifecycle.status();
  const controlled = api.party.lifecycle.controlled.status();
  assert.equal(status.actionAuthority, false);
  assert.equal(status.maxDevelopmentSlots, 1);
  assert.equal(controlled.enabled, false);
  assert.equal(controlled.actionAuthority, false);
  assert.equal(controlled.transitionAuthority, false);
  assert.equal(controlled.developmentRotationAuthority, false);
  assert.equal(api.party.lifecycle.aura.status().enabled, false);
  assert.equal(api.party.lifecycle.aura.status().actionAuthority, false);
  assert.equal(api.party.setTransitionsEnabled(true), false);
  assert.equal(api.party.setAuraAutomationEnabled(true), false);
  assert.equal(api.status().party.legacyTransitionBypassAllowed, false);
  assert.equal(api.status().party.legacyAuraBypassAllowed, false);
});

test('Alpha.19 runtime version remains frozen when instantiated directly after public Alpha.20 release bump', () => {
  const r = root();
  const runtime = new Alpha19Runtime({ root: r, parent: r.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  assert.equal(runtime.status().version, '3.0.0-alpha.19.0');
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
