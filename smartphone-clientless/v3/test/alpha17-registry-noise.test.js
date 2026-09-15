'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha17Runtime } = require('../src');

function storage() { return { get: () => null, set() {} }; }
function character(overrides = {}) {
  return {
    name: 'MerchantA', ctype: 'merchant', level: 56, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 100, rip: false,
    items: [], slots: {}, speed: 40, ...overrides
  };
}
function gameData() {
  return { monsters: {}, maps: { main: {}, bank: {} }, npcs: {}, items: {}, skills: {}, events: {} };
}
function root() {
  const r = {
    character: character(), parent: { entities: {}, party: {} }, G: gameData(), performance_trick() {},
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  r.globalThis = r;
  return r;
}
function foreignEntities(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `foreign-${i}`, name: `Foreign${i}`, type: 'character', player: true,
    map: 'main', x: i, y: -i, hp: 1000, max_hp: 1000, dead: false
  }));
}
function snapshot(at, foreignCount = 100) {
  return {
    observedAt: at,
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 56, map: 'main', x: 0, y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, rip: false, inventory: [], equipment: {}
    },
    party: [
      { name: 'MerchantA', type: 'merchant', level: 56, map: 'main' },
      { name: 'PartyPaladin', type: 'paladin', level: 60, map: 'main' }
    ],
    entities: [
      { id: 'party-paladin', name: 'PartyPaladin', type: 'character', player: true, map: 'main', x: 20, y: 30, hp: 900, max_hp: 1200, dead: false },
      { id: 'reserve', name: 'ReserveMage', type: 'character', player: true, map: 'main', x: 40, y: 50, hp: 700, max_hp: 900, dead: false },
      ...foreignEntities(foreignCount)
    ]
  };
}

test('Alpha17 registry enriches only self, party and configured roster from visible entities', () => {
  const r = root();
  const runtime = new Alpha17Runtime({
    root: r, parent: r.parent, mode: 'shadow', visibleStatus: false, storage: storage(),
    characterRoster: [{ name: 'ReserveMage', ctype: 'mage', level: 50, online: false }]
  });
  runtime.lastSnapshot = snapshot(1000, 100);
  runtime._partyObservation();

  const registry = runtime.characterRegistry.status();
  assert.deepEqual(registry.characters.map((row) => row.name), ['MerchantA', 'PartyPaladin', 'ReserveMage']);
  assert.equal(registry.stats.evicted, 0);
  assert.equal(runtime.status().registryVisibility.foreignVisibleIgnored, 100);
  assert.equal(runtime.characterRegistry.get('PartyPaladin').primarySource, 'visible');
  assert.equal(runtime.characterRegistry.get('ReserveMage').primarySource, 'visible');
  assert.equal(runtime.characterRegistry.get('Foreign0'), null);
  assert.equal(registry.actionAuthority, false);
});

test('Alpha17 registry filtering prevents crowded-map add/evict log churn over 200 observations', () => {
  const r = root();
  const runtime = new Alpha17Runtime({
    root: r, parent: r.parent, mode: 'shadow', visibleStatus: false, storage: storage(),
    characterRoster: [{ name: 'ReserveMage', ctype: 'mage', level: 50, online: false }]
  });

  for (let i = 0; i < 200; i += 1) {
    runtime.lastSnapshot = snapshot(1000 + i * 1000, 100);
    runtime._partyObservation();
  }

  const registry = runtime.characterRegistry.status();
  const summary = runtime.log.summary();
  assert.equal(registry.counts.total, 3);
  assert.equal(registry.stats.evicted, 0);
  assert.equal(registry.stats.added, 3);
  assert.equal(runtime.status().registryVisibility.foreignVisibleIgnored, 20000);
  assert.equal(summary.counts.CHARACTER_REGISTRY_MEMBER_EVICTED || 0, 0);
  assert.equal(summary.counts.CHARACTER_REGISTRY_MEMBER_ADDED || 0, 3);
  assert.ok(summary.retained < 100);
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});
