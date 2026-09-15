'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlledFarmerLoot } = require('../src/farmer/controlled-farmer-loot');
const { ControlledAutoRespawn } = require('../src/ops/controlled-auto-respawn');
const { install, Alpha20_5FarmReadinessRuntime } = require('../src');

function snapshot(overrides = {}) {
  return {
    observedAt: overrides.observedAt || 0,
    character: {
      name: overrides.name || 'FarmerA',
      ctype: overrides.ctype || 'ranger',
      level: 70,
      map: 'main',
      x: 0,
      y: 0,
      hp: 1000,
      max_hp: 1000,
      mp: 500,
      max_mp: 500,
      gold: overrides.gold == null ? 100 : overrides.gold,
      rip: overrides.rip === true,
      isize: overrides.isize == null ? 8 : overrides.isize,
      inventory: overrides.inventory || [null, null, null, null, null, null, null, null]
    },
    entities: [],
    objects: [],
    party: [],
    game: { monstersKnown: 0, mapsKnown: 0 }
  };
}

function storage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('farmer loot executes only in active mode for living non-merchants with accessible chests and rate-limits raw loot', () => {
  let now = 0;
  let raw = 0;
  let chests = { chest1: { id: 'chest1' } };
  const root = {
    get_chests: () => chests,
    loot: () => { raw += 1; }
  };
  root.parent = root;
  let mode = 'shadow';
  const loot = new ControlledFarmerLoot({ root, now: () => now, getMode: () => mode, intervalMs: 900, noChestPollMs: 500 });

  assert.equal(loot.tick(snapshot()).shadow, true);
  assert.equal(raw, 0);
  mode = 'active';
  assert.equal(loot.tick(snapshot({ rip: true })).reason, 'CHARACTER_DEAD');
  assert.equal(raw, 0);
  assert.equal(loot.tick(snapshot({ ctype: 'merchant' })).reason, 'MERCHANT_EXCLUDED');
  assert.equal(raw, 0);

  const first = loot.tick(snapshot());
  assert.equal(first.executed, true);
  assert.equal(raw, 1);
  now = 500;
  assert.equal(loot.tick(snapshot()).reason, 'LOOT_RATE_LIMITED');
  assert.equal(raw, 1);
  now = 900;
  assert.equal(loot.tick(snapshot()).executed, true);
  assert.equal(raw, 2);

  chests = {};
  now = 1800;
  assert.equal(loot.tick(snapshot()).reason, 'NO_CHESTS');
  assert.equal(raw, 2);
  assert.equal(loot.status().stats.rawActions, 2);
});

test('farmer loot records bounded post-request inventory evidence without claiming a chest commit', () => {
  let now = 0;
  let raw = 0;
  const root = { get_chests: () => ({ c: {} }), loot: () => { raw += 1; } };
  root.parent = root;
  const loot = new ControlledFarmerLoot({ root, now: () => now, getMode: () => 'active', verifyDelayMs: 100 });
  loot.tick(snapshot({ gold: 100 }));
  assert.equal(raw, 1);
  now = 150;
  loot.tick(snapshot({ gold: 125 }));
  const status = loot.status();
  assert.equal(status.lastObservation.observedDelta, true);
  assert.equal(status.lastObservation.delta.gold, 25);
  assert.equal(status.stats.observedDeltas, 1);
});

test('auto respawn waits for death grace, emits one bounded raw request, and verifies life before resetting', () => {
  let now = 0;
  let raw = 0;
  const root = {
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main', rip: true },
    respawn: () => { raw += 1; return Promise.resolve({ ok: true }); }
  };
  root.parent = root;
  const respawn = new ControlledAutoRespawn({ root, now: () => now, getMode: () => 'active', deathGraceMs: 1000, retryMs: 3000, maxAttempts: 5 });

  assert.equal(respawn.tick(snapshot({ rip: true })).reason, 'RESPAWN_WAIT');
  assert.equal(raw, 0);
  now = 1000;
  const requested = respawn.tick(snapshot({ rip: true }));
  assert.equal(requested.executed, true);
  assert.equal(raw, 1);
  now = 1500;
  assert.equal(respawn.tick(snapshot({ rip: true })).reason, 'RESPAWN_WAIT');
  assert.equal(raw, 1);

  root.character.rip = false;
  now = 1700;
  const recovered = respawn.tick(snapshot({ rip: false }));
  assert.equal(recovered.reason, 'RECOVERY_VERIFIED');
  assert.equal(respawn.status().state, 'IDLE');
  assert.equal(respawn.status().stats.recoveriesVerified, 1);
});

test('auto respawn is fail-closed outside active mode and exhausts a strict per-death attempt budget', () => {
  let now = 0;
  let raw = 0;
  const root = { character: { name: 'FarmerA', ctype: 'ranger', map: 'main', rip: true }, respawn: () => { raw += 1; } };
  root.parent = root;
  let mode = 'shadow';
  const respawn = new ControlledAutoRespawn({ root, now: () => now, getMode: () => mode, deathGraceMs: 500, retryMs: 1000, maxAttempts: 3 });
  respawn.tick(snapshot({ rip: true }));
  now = 1000;
  assert.equal(respawn.tick(snapshot({ rip: true })).reason, 'RUNTIME_NOT_ACTIVE');
  assert.equal(raw, 0);
  mode = 'active';
  for (let i = 0; i < 20; i += 1) {
    now += 1000;
    respawn.tick(snapshot({ rip: true }));
  }
  assert.equal(raw, 3);
  assert.equal(respawn.status().state, 'EXHAUSTED');
  assert.equal(respawn.status().stats.rawActions, 3);
});

test('3000-cycle loot and respawn soak remains bounded and cannot grow raw action rate beyond configured budgets', () => {
  let now = 0;
  let lootRaw = 0;
  let respawnRaw = 0;
  const lootRoot = { get_chests: () => ({ c: {} }), loot: () => { lootRaw += 1; } };
  lootRoot.parent = lootRoot;
  const loot = new ControlledFarmerLoot({ root: lootRoot, now: () => now, getMode: () => 'active', intervalMs: 900, verifyDelayMs: 100 });
  for (let i = 0; i < 3000; i += 1) {
    now += 100;
    loot.tick(snapshot());
  }
  assert.ok(lootRaw <= 334);
  assert.equal(loot.status().stats.rawActions, lootRaw);

  now = 0;
  const respawnRoot = { character: { rip: true }, respawn: () => { respawnRaw += 1; } };
  respawnRoot.parent = respawnRoot;
  const respawn = new ControlledAutoRespawn({ root: respawnRoot, now: () => now, getMode: () => 'active', deathGraceMs: 500, retryMs: 1000, maxAttempts: 5 });
  for (let i = 0; i < 3000; i += 1) {
    now += 100;
    respawn.tick(snapshot({ rip: true }));
  }
  assert.equal(respawnRaw, 5);
  assert.equal(respawn.status().state, 'EXHAUSTED');
});

test('default install is active-mode but stopped, with loot and auto-respawn armed only for a later operator start', () => {
  const root = { localStorage: storage() };
  root.parent = root;
  const api = install(root, { debugMonitorVisible: false, visibleStatus: false });
  assert.ok(api.__runtime instanceof Alpha20_5FarmReadinessRuntime);
  assert.equal(api.__runtime.adapter.mode, 'active');
  assert.equal(api.__runtime.status().running, false);
  assert.equal(api.__runtime.timer, null);
  assert.equal(api.__runtime.controlledFarmerLoot.status().enabled, true);
  assert.equal(api.__runtime.controlledFarmerLoot.status().stats.rawActions, 0);
  assert.equal(api.__runtime.controlledAutoRespawn.status().enabled, true);
  assert.equal(api.__runtime.controlledAutoRespawn.status().stats.rawActions, 0);
  assert.equal(api.__debugUI.runControl.status().state, 'STOPPED');
  assert.equal(api.__debugUI._runButtonText(api.__debugUI.runControl.status()), 'Starten');
});
