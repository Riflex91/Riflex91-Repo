import test from 'node:test';
import assert from 'node:assert/strict';
import { IntentArbiter } from '../../build/kernel/intent-arbiter.js';

function intent(overrides) {
  return {
    id: 'intent',
    ownerId: 'test',
    kind: 'TEST',
    class: 'normal',
    priority: 0,
    createdAt: 1,
    requiredResources: [],
    reason: 'TEST',
    payload: {},
    ...overrides
  };
}

test('emergency intent outranks normal work regardless of numeric normal priority', () => {
  const arbiter = new IntentArbiter();
  const selected = arbiter.select([
    intent({ id: 'farm', class: 'normal', priority: 999 }),
    intent({ id: 'retreat', class: 'emergency', priority: 1 })
  ], 10);

  assert.equal(selected?.id, 'retreat');
});

test('expired intents are excluded and ties are deterministic', () => {
  const arbiter = new IntentArbiter();
  const ranked = arbiter.rank([
    intent({ id: 'expired', priority: 1000, expiresAt: 10 }),
    intent({ id: 'b', priority: 10, createdAt: 5 }),
    intent({ id: 'a', priority: 10, createdAt: 5 })
  ], 10);

  assert.deepEqual(ranked.map((row) => row.id), ['a', 'b']);
});
