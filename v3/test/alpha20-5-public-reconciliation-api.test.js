'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install } = require('../src');

function publicRoot() {
  const root = {
    AIO_V3_AUTOSTART: false,
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 10000000, rip: false,
      items: [], isize: 42, slots: {}, speed: 40, bank: { items0: [null] }
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, npcs: {}, skills: {}, events: {}, items: {} },
    performance_trick() {}, setTimeout, clearTimeout, setInterval, clearInterval
  };
  root.globalThis = root;
  return root;
}

function runtimeStorage() {
  const rows = new Map();
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; } };
}

test('public AIO_V3.operations exposes bot-owned observation-only reconciliation evidence', () => {
  const api = install(publicRoot(), {
    mode: 'shadow',
    visibleStatus: false,
    debugMonitorVisible: false,
    storage: runtimeStorage()
  });

  assert.equal(typeof api.operations.hostHeartbeat, 'function');
  assert.equal(typeof api.operations.pendingAlerts, 'function');
  assert.equal(typeof api.operations.claimAlerts, 'function');
  assert.equal(typeof api.operations.reconciliationStatus, 'function');

  const evidence = api.operations.reconciliationStatus();
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.type, 'AIO_V3_RECONCILIATION_STATUS');
  assert.equal(evidence.actionAuthority, false);
  assert.equal(evidence.rawGameplayActionAuthority, false);
  assert.equal(Array.isArray(evidence.blockers), true);
  assert.equal(typeof evidence.observedClean, 'boolean');
  assert.equal(JSON.stringify(evidence).includes('attack'), false);
  assert.equal(JSON.stringify(evidence).includes('smart_move'), false);
});
