'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  Alpha11Runtime,
  CharacterRegistry,
  REGISTRY_SCHEMA_VERSION,
  REGISTRY_MODE
} = require('../src');

function character(overrides = {}) {
  return {
    name: 'RangerA', ctype: 'ranger', level: 70, map: 'main',
    x: 10, y: 20, real_x: 10, real_y: 20,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    attack: 300, armor: 200, resistance: 150, range: 120, speed: 40, frequency: 2,
    xp: 0, gold: 0, rip: false, moving: false,
    items: [{ name: 'hpot1', q: 50 }, { name: 'mpot1', q: 40 }],
    slots: { mainhand: { name: 'bow', level: 7, l: true } },
    ...overrides
  };
}

function gameData() {
  return {
    monsters: { goo: { xp: 100 } },
    maps: { main: { monsters: [{ type: 'goo', boundary: [100, 100, 200, 200] }] } },
    skills: {
      supershot: { class: ['ranger'], level: 10 },
      mark: { class: ['ranger'], level: 20 },
      pallylow: { class: ['paladin'], level: 30 },
      pallyhigh: { class: ['paladin'], level: 90 },
      monsterSkill: { level: 1 }
    }
  };
}

function registrySnapshot(overrides = {}) {
  return {
    observedAt: 1000,
    character: {
      name: 'RangerA', ctype: 'ranger', level: 70, map: 'main', x: 10, y: 20,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, range: 120, speed: 40, frequency: 2,
      rip: false,
      inventory: [
        { index: 0, name: 'hpot1', q: 50, level: 0, locked: false, special: false },
        { index: 1, name: 'mpot1', q: 40, level: 0, locked: false, special: false }
      ],
      equipment: { mainhand: { name: 'bow', level: 7, locked: false, special: false } }
    },
    party: [
      { name: 'RangerA', type: 'ranger', level: 70, map: 'main' },
      { name: 'PaladinA', type: 'paladin', level: 65, map: 'main' }
    ],
    entities: [
      { id: 'p1', name: 'PaladinA', type: 'character', player: true, map: 'main', x: 50, y: 60, hp: 900, max_hp: 1200, dead: false }
    ],
    ...overrides
  };
}

test('CharacterRegistry merges configured, party, visible and self observations without gameplay authority', () => {
  let now = 1000;
  const registry = new CharacterRegistry({
    now: () => now,
    roster: [
      { name: 'MageReserve', ctype: 'mage', level: 50, online: false },
      { name: 'RangerA', ctype: 'ranger', level: 69 }
    ]
  });
  registry.observe({ snapshot: registrySnapshot(), gameData: gameData() });
  const status = registry.status();
  assert.equal(status.schemaVersion, REGISTRY_SCHEMA_VERSION);
  assert.equal(status.mode, REGISTRY_MODE);
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directActionAccess, false);
  assert.equal(status.executorBypassAllowed, false);
  assert.equal(status.counts.total, 3);

  const self = registry.get('RangerA');
  assert.equal(self.primarySource, 'self');
  assert.equal(self.online, true);
  assert.equal(self.available, true);
  assert.equal(self.level, 70);
  assert.deepEqual(self.skillUnlocks, ['mark', 'supershot']);
  assert.equal(self.supplies.hpPotions, 50);
  assert.equal(self.supplies.mpPotions, 40);
  assert.equal(self.gear.mainhand.name, 'bow');

  const paladin = registry.get('PaladinA');
  assert.equal(paladin.primarySource, 'visible');
  assert.equal(paladin.online, true);
  assert.equal(paladin.available, true);
  assert.deepEqual(paladin.skillUnlocks, ['pallylow']);

  const reserve = registry.get('MageReserve');
  assert.equal(reserve.presence, 'OFFLINE');
  assert.equal(reserve.stateConfidence, 0.35);
});

test('CharacterRegistry enriches self from read-only live character data', () => {
  const registry = new CharacterRegistry();
  const snapshot = registrySnapshot({
    character: { name: 'RangerA', ctype: 'ranger', level: 70, map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, rip: false },
    party: [],
    entities: []
  });
  registry.observe({ snapshot, gameData: gameData(), liveCharacter: character({ attack: 777, armor: 333 }) });
  const self = registry.get('RangerA');
  assert.equal(self.stats.attack, 777);
  assert.equal(self.stats.armor, 333);
  assert.equal(self.gear.mainhand.name, 'bow');
  assert.equal(self.gear.mainhand.level, 7);
  assert.equal(self.gear.mainhand.locked, true);
  assert.equal(self.supplies.hpPotions, 50);
  assert.equal(self.supplies.mpPotions, 40);
});

test('CharacterRegistry never invents offline state when live evidence merely becomes stale', () => {
  let now = 1000;
  const registry = new CharacterRegistry({ now: () => now, staleAfterMs: 1000 });
  registry.observe({ snapshot: registrySnapshot({ party: [], entities: [] }), gameData: gameData() });
  assert.equal(registry.get('RangerA').presence, 'ONLINE');
  now = 2501;
  const stale = registry.get('RangerA');
  assert.equal(stale.presence, 'STALE');
  assert.equal(stale.online, null);
  assert.equal(stale.available, null);
  assert.ok(stale.stateConfidence < 1);
});

test('CharacterRegistry is hard bounded and live observations can evict lower-confidence configured entries', () => {
  const roster = ['A', 'B', 'C', 'D'].map((name) => ({ name, ctype: 'ranger' }));
  const registry = new CharacterRegistry({ capacity: 4, roster });
  assert.equal(registry.status().counts.total, 4);
  registry.observe({
    snapshot: registrySnapshot({ character: { ...registrySnapshot().character, name: 'LIVE' }, party: [], entities: [] }),
    gameData: gameData()
  });
  assert.equal(registry.status().counts.total, 4);
  assert.ok(registry.get('LIVE'));
  assert.equal(registry.status().stats.evicted, 1);
});

test('CharacterRegistry sanitizes malformed optional data and remains JSON-safe', () => {
  const registry = new CharacterRegistry({ capacity: 4 });
  registry.observe({
    snapshot: {
      observedAt: 1,
      character: {
        name: 'Bad', ctype: 'ranger', level: Infinity,
        hp: NaN, max_hp: 0, mp: Infinity, max_mp: 0, rip: false,
        inventory: [{ name: 'hpot1', q: Infinity }]
      },
      party: [],
      entities: []
    },
    gameData: { skills: { bad: { class: ['ranger'], level: Infinity } } }
  });
  const status = registry.status();
  assert.doesNotThrow(() => JSON.stringify(status));
  const bad = registry.get('Bad');
  assert.equal(bad.level, 0);
  assert.ok(Number.isFinite(bad.supplies.hpPotions));
  assert.deepEqual(bad.skillUnlocks, []);
});

test('Alpha11Runtime integrates party observation while preserving Alpha.10 Brain shadow authority boundary', () => {
  let now = 10000;
  const root = {
    character: character(),
    parent: {
      entities: {
        p1: { id: 'p1', name: 'PaladinA', type: 'character', player: true, map: 'main', real_x: 50, real_y: 60, hp: 900, max_hp: 1200, dead: false }
      },
      party: { PaladinA: { type: 'paladin', level: 65, map: 'main' } }
    },
    G: gameData()
  };
  const runtime = new Alpha11Runtime({
    root,
    parent: root.parent,
    mode: 'shadow',
    now: () => now,
    visibleStatus: false,
    partyObservationMs: 500,
    brainAuditMs: 1000,
    characterRoster: [{ name: 'MageReserve', ctype: 'mage', level: 50, online: false }],
    storage: { get: () => null, set() {} }
  });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.16.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.brain.mode, 'shadow');
  assert.equal(status.brain.actionAuthority, false);
  assert.ok(status.party);
  assert.equal(status.party.registry.mode, 'observation-only');
  assert.equal(status.party.registry.actionAuthority, false);
  assert.equal(status.party.registry.counts.total, 3);
  assert.equal(runtime.characterRegistry.get('RangerA').gear.mainhand.name, 'bow');
  assert.equal(runtime.characterRegistry.get('MageReserve').presence, 'OFFLINE');
  assert.equal(status.party.registry.recommendation, undefined);
  assert.equal(status.party.registry.transition, undefined);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('Bot active mode never promotes Alpha.11 party observation into action authority', () => {
  const root = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData()
  };
  const runtime = new Alpha11Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: { get: () => null, set() {} } });
  runtime.setMode('active');
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.mode, 'active');
  assert.equal(status.brain.mode, 'shadow');
  assert.equal(status.party.registry.mode, 'observation-only');
  assert.equal(status.party.registry.actionAuthority, false);
  assert.equal(status.party.registry.directActionAccess, false);
  assert.equal(status.party.registry.executorBypassAllowed, false);
  assert.equal(typeof runtime.characterRegistry.command, 'undefined');
  assert.equal(typeof runtime.characterRegistry.move, 'undefined');
  assert.equal(typeof runtime.characterRegistry.attack, 'undefined');
  assert.equal(typeof runtime.characterRegistry.smart_move, 'undefined');
});

test('Alpha.11 synthetic observation soak keeps registry bounded, finite and serializable', () => {
  let now = 0;
  const registry = new CharacterRegistry({ now: () => now, capacity: 32, staleAfterMs: 15000 });
  for (let i = 0; i < 2000; i += 1) {
    now += 1000;
    const self = `R${i % 8}`;
    registry.observe({
      snapshot: {
        observedAt: now,
        character: { name: self, ctype: 'ranger', level: 70 + (i % 5), map: 'main', hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, rip: false, inventory: [] },
        party: [{ name: `P${i % 8}`, type: 'paladin', level: 65, map: 'main' }],
        entities: []
      },
      gameData: gameData()
    });
  }
  const status = registry.status();
  assert.equal(status.stats.observations, 2000);
  assert.ok(status.counts.total <= 32);
  for (const entry of status.characters) {
    assert.ok(Number.isFinite(entry.stateConfidence));
    assert.ok(entry.stateConfidence >= 0 && entry.stateConfidence <= 1);
  }
  assert.doesNotThrow(() => JSON.stringify(status));
});
