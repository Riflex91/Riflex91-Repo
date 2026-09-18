'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  install,
  Runtime,
  RuntimeComposition,
  COMPOSITION_MODE,
  Alpha19Runtime,
  Alpha20Runtime,
  Alpha20_5MerchantRuntime,
  Alpha20_5FarmReadinessRuntime
} = require('../src');

function storage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; },
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

function root(name = 'MerchantA') {
  const value = {
    AIO_V3_AUTOSTART: false,
    localStorage: storage(),
    character: {
      name, ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 10000000, rip: false,
      items: [], isize: 42, slots: {}, speed: 40, bank: { items0: [null] }
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { bank: {} }, npcs: {}, skills: {}, events: {}, items: {} },
    bank_packs: { items0: ['bank', 0, 0] },
    get_chests() { return {}; },
    get_player() { return null; },
    send_cm() {},
    can_move_to() { return true; },
    can_attack() { return false; },
    is_in_range() { return false; },
    performance_trick() {},
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  value.parent.character = value.character;
  value.parent.G = value.G;
  value.globalThis = value;
  return value;
}

function options(value) {
  return {
    root: value,
    parent: value.parent,
    mode: 'shadow',
    visibleStatus: false,
    debugMonitorVisible: false,
    storage: storage(),
    now: () => 10000
  };
}

function statusShape(status) {
  return {
    keys: Object.keys(status).sort(),
    partyKeys: Object.keys(status.party || {}).sort(),
    economyKeys: Object.keys(status.economy || {}).sort(),
    travelKeys: Object.keys(status.travel || {}).sort(),
    alpha18: status.alpha18,
    alpha19: status.alpha19,
    alpha20: status.alpha20,
    alpha20_5: status.alpha20_5
  };
}

test('runtime composition preserves final Alpha20.5 status/API shape without inheriting the Alpha runtime chain', () => {
  const legacy = new Alpha20_5FarmReadinessRuntime(options(root('LegacyMerchant')));
  const composed = new RuntimeComposition(options(root('ComposedMerchant')));

  assert.ok(composed instanceof Runtime);
  assert.ok(composed instanceof RuntimeComposition);
  assert.ok(composed instanceof Alpha19Runtime);
  assert.ok(composed instanceof Alpha20Runtime);
  assert.ok(composed instanceof Alpha20_5MerchantRuntime);
  assert.ok(composed instanceof Alpha20_5FarmReadinessRuntime);
  assert.notEqual(Object.getPrototypeOf(composed), Alpha20_5FarmReadinessRuntime.prototype);

  for (const name of [
    'start', 'stop', 'tick', 'setMode', 'status', 'exportDiagnostics',
    'configureControlledMerchant', 'configureControlledTravel',
    'configureControlledPartyLifecycle', 'configureMerchantService',
    'farmReadinessStatus'
  ]) {
    assert.equal(typeof composed[name], 'function', `missing composed method ${name}`);
    assert.equal(typeof legacy[name], 'function', `missing legacy method ${name}`);
  }

  assert.deepEqual(statusShape(composed.status()), statusShape(legacy.status()));
  assert.deepEqual(
    Object.keys(JSON.parse(composed.exportDiagnostics()).context).sort(),
    Object.keys(JSON.parse(legacy.exportDiagnostics()).context).sort()
  );

  legacy.stop();
  composed.stop();
});

test('composition root reports the three required service groups', () => {
  const composed = new RuntimeComposition(options(root('GroupedMerchant')));
  const status = composed.compositionStatus();
  assert.equal(status.mode, COMPOSITION_MODE);
  assert.equal(status.productionConstruction, 'composition-root');
  assert.equal(status.inheritedAlphaRuntime, false);
  assert.equal(status.compatibilityFacadePreserved, true);
  assert.ok(status.serviceGroups.gameStability.includes('adapter'));
  assert.ok(status.serviceGroups.gameStability.includes('stability'));
  assert.ok(status.serviceGroups.merchantEconomyTravel.includes('transactionEngine'));
  assert.ok(status.serviceGroups.merchantEconomyTravel.includes('controlledMerchantService'));
  assert.ok(status.serviceGroups.farmerPartyReliability.includes('farmer'));
  assert.ok(status.serviceGroups.farmerPartyReliability.includes('partyBootstrap'));
  composed.stop();
});

test('public install constructs RuntimeComposition while preserving Alpha instanceof compatibility', () => {
  const value = root('InstalledMerchant');
  const api = install(value, {
    mode: 'shadow',
    visibleStatus: false,
    debugMonitorVisible: false,
    storage: storage(),
    now: () => 10000
  });
  assert.ok(api.__runtime instanceof RuntimeComposition);
  assert.ok(api.__runtime instanceof Alpha20_5FarmReadinessRuntime);
  assert.equal(api.runtimeComposition.status().productionConstruction, 'composition-root');
  assert.equal(api.status().version, api.version);
  api.stop();
});
