import assert from 'node:assert/strict';
import test from 'node:test';

import { AdventureLandObserver } from '../../packages/adapters/src/adventure-land/index.js';
import { ManualClock } from '../../packages/core/src/time/clock.js';
import { reduceWorldObservation } from '../../packages/domain/src/world/index.js';

test('observer returns null before the character exists without consuming sequence', () => {
  const root: Record<string, unknown> = {};
  const clock = new ManualClock(500);
  const observer = new AdventureLandObserver({ root, clock });

  assert.equal(observer.observe(), null);

  root.character = baseCharacter();
  const first = observer.observe();
  assert.equal(first?.sequence, 1);
  assert.equal(first?.observedAt, 500);
});

test('observer normalizes Adventure Land globals into WorldObservation v1', () => {
  const clock = new ManualClock(10_000);
  const root = {
    character: {
      ...baseCharacter(),
      real_x: '10.5',
      real_y: 20,
      hp: '800',
      max_hp: 1_000,
      mp: 500,
      max_mp: 750,
      range: 120,
      speed: 45,
      frequency: 1.2,
      xp: 12345,
      gold: 67890,
      moving: true,
      target: 991,
      isize: 3,
      items: [
        { name: 'hpot1', q: 42, level: 0 },
        null,
        { name: 'staff', level: 7, l: 1, p: 'shiny' },
        { name: 'outside-size' },
      ],
    },
    parent: {
      entities: {
        z: {
          id: 'z-monster',
          type: 'monster',
          mtype: 'goo',
          name: 'Goo',
          real_x: 30,
          real_y: 40,
          hp: 90,
          max_hp: 100,
          target: 'TestMage',
        },
        a: {
          id: 7,
          type: 'character',
          name: 'OtherPlayer',
          x: 5,
          y: 6,
          hp: 200,
          max_hp: 200,
        },
        ignored: { name: 'missing-id' },
      },
      chests: {
        chest1: { id: 'chest-1', type: 'chest', x: 4, y: 5 },
      },
      map_objects: {
        door1: { id: 'door-1', name: 'Door', type: 'door', x: 6, y: 7 },
      },
      party: {
        TestMage: { type: 'mage', level: 42, map: 'main' },
        Ally: { ctype: 'priest', level: '41', map: 'main' },
      },
      G: {
        monsters: { goo: {}, bee: {} },
        maps: { main: {}, cave: {}, winterland: {} },
      },
    },
  };

  const observer = new AdventureLandObserver({ root, clock });
  const observed = observer.observe();
  assert.ok(observed);

  assert.equal(observed.schemaVersion, 1);
  assert.equal(observed.sequence, 1);
  assert.equal(observed.observedAt, 10_000);
  assert.deepEqual(observed.self.position, { map: 'main', x: 10.5, y: 20 });
  assert.deepEqual(observed.self.health, { current: 800, max: 1_000 });
  assert.equal(observed.self.targetId, '991');
  assert.equal(observed.self.inventorySize, 3);
  assert.deepEqual(observed.self.inventory, [
    { index: 0, name: 'hpot1', level: 0, quantity: 42, locked: false, special: false },
    null,
    { index: 2, name: 'staff', level: 7, quantity: 1, locked: true, special: true },
  ]);

  assert.deepEqual(observed.entities.map((entity) => entity.id), ['7', 'z-monster']);
  assert.equal(observed.entities[0]?.kind, 'player');
  assert.equal(observed.entities[1]?.kind, 'monster');
  assert.equal(observed.entities[1]?.position.map, 'main');
  assert.deepEqual(observed.objects.map((object) => object.id), ['chest-1', 'door-1']);
  assert.deepEqual(observed.party.map((member) => member.name), ['Ally', 'TestMage']);
  assert.deepEqual(observed.gameData, { monstersKnown: 2, mapsKnown: 3 });

  const reduced = reduceWorldObservation(null, observed);
  assert.equal(reduced.accepted, true);
});

test('observer uses the injected clock and increments sequence deterministically', () => {
  const clock = new ManualClock(100);
  const observer = new AdventureLandObserver({ root: { character: baseCharacter() }, clock });

  const first = observer.observe();
  clock.advance(25);
  const second = observer.observe();

  assert.equal(first?.sequence, 1);
  assert.equal(first?.observedAt, 100);
  assert.equal(second?.sequence, 2);
  assert.equal(second?.observedAt, 125);
});

function baseCharacter(): Record<string, unknown> {
  return {
    name: 'TestMage',
    ctype: 'mage',
    level: 42,
    map: 'main',
    x: 0,
    y: 0,
    hp: 1_000,
    max_hp: 1_000,
    mp: 1_000,
    max_mp: 1_000,
    isize: 0,
    items: [],
  };
}
