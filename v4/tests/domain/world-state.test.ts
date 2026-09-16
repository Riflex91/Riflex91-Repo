import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InvalidWorldObservationError,
  distanceToEntity,
  entitiesTargetingSelf,
  reduceWorldObservation,
  resourceRatio,
  visibleMonsters,
  type EntityObservation,
  type WorldObservation,
} from '../../packages/domain/src/world/index.js';

test('world reducer builds deterministic records and replaces a complete visible snapshot', () => {
  const firstObservation = observation(1, [
    entity('z-monster', 'monster', 30, 40),
    entity('a-player', 'player', 10, 20),
  ]);

  const first = reduceWorldObservation(null, firstObservation);
  assert.equal(first.accepted, true);
  if (!first.accepted) return;

  assert.equal(first.state.revision, 1);
  assert.deepEqual(Object.keys(first.state.entities), ['a-player', 'z-monster']);
  assert.notStrictEqual(first.state.self, firstObservation.self);
  assert.notStrictEqual(first.state.self.position, firstObservation.self.position);

  const second = reduceWorldObservation(first.state, observation(2, [
    entity('z-monster', 'monster', 35, 40),
  ]));
  assert.equal(second.accepted, true);
  if (!second.accepted) return;

  assert.equal(second.state.revision, 2);
  assert.deepEqual(Object.keys(second.state.entities), ['z-monster']);
  assert.equal(second.state.entities['a-player'], undefined);
});

test('world reducer ignores duplicate and out-of-order observations without changing state', () => {
  const initial = reduceWorldObservation(null, observation(10, [entity('goo-1', 'monster', 5, 0)]));
  assert.equal(initial.accepted, true);
  if (!initial.accepted) return;

  const duplicate = reduceWorldObservation(initial.state, observation(10, []));
  assert.equal(duplicate.accepted, false);
  assert.strictEqual(duplicate.state, initial.state);

  const older = reduceWorldObservation(initial.state, observation(9, []));
  assert.equal(older.accepted, false);
  assert.strictEqual(older.state, initial.state);
});

test('world reducer rejects ambiguous duplicate identifiers', () => {
  const duplicateEntity = entity('same-id', 'monster', 1, 1);
  const invalid = observation(1, [duplicateEntity, duplicateEntity]);

  assert.throws(
    () => reduceWorldObservation(null, invalid),
    (error: unknown) => error instanceof InvalidWorldObservationError
      && error.message.includes('duplicate entity key'),
  );
});

test('world selectors derive stable combat inputs from canonical state', () => {
  const threatening = {
    ...entity('goo-attacker', 'monster', 30, 40),
    targetId: 'TestMage',
  } satisfies EntityObservation;

  const reduced = reduceWorldObservation(null, observation(1, [
    entity('player-1', 'player', 11, 20),
    threatening,
    entity('goo-dead', 'monster', 20, 20, true),
  ]));
  assert.equal(reduced.accepted, true);
  if (!reduced.accepted) return;

  assert.deepEqual(visibleMonsters(reduced.state).map((row) => row.id), ['goo-attacker']);
  assert.deepEqual(entitiesTargetingSelf(reduced.state).map((row) => row.id), ['goo-attacker']);
  assert.equal(distanceToEntity(reduced.state, 'goo-attacker'), 50);
  assert.equal(resourceRatio(reduced.state.self.health), 0.8);
});

function observation(sequence: number, entities: readonly EntityObservation[]): WorldObservation {
  return {
    sequence,
    observedAt: 1_000 + sequence,
    self: {
      name: 'TestMage',
      className: 'mage',
      level: 42,
      position: { map: 'main', x: 0, y: 0 },
      health: { current: 800, max: 1_000 },
      mana: { current: 1_200, max: 1_500 },
      range: 120,
      speed: 45,
      frequency: 1.5,
      xp: 123_456,
      gold: 50_000,
      moving: false,
      targetId: null,
      dead: false,
      inventorySize: 2,
      inventory: [
        { index: 0, name: 'hpot1', level: 0, quantity: 100, locked: false, special: false },
        null,
      ],
    },
    entities,
    objects: [
      {
        id: 'chest-1',
        name: 'Chest',
        type: 'chest',
        position: { map: 'main', x: 5, y: 5 },
      },
    ],
    party: [
      { name: 'TestMage', className: 'mage', level: 42, map: 'main' },
    ],
    gameData: { monstersKnown: 100, mapsKnown: 25 },
  };
}

function entity(
  id: string,
  kind: EntityObservation['kind'],
  x: number,
  y: number,
  dead = false,
): EntityObservation {
  return {
    id,
    kind,
    name: id,
    monsterType: kind === 'monster' ? 'goo' : null,
    position: { map: 'main', x, y },
    health: { current: dead ? 0 : 100, max: 100 },
    targetId: null,
    dead,
  };
}
