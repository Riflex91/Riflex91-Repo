'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { WorldModel, EvidenceKind } = require('../src/world/world-model');
const { WorldPersistence } = require('../src/world/persistence');

test('WorldPersistence saves and restores the world model without gameplay dependencies', () => {
  const values = new Map();
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) };
  let now = 1000;
  const world = new WorldModel({ now: () => now });
  world.observeEntity('monster', 'goo', { maps: ['main'] }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  world.recordPerformance('goo', 'ranger:1', { seconds: 60, xp: 1000, gold: 100 });

  const persistence = new WorldPersistence({ storage, now: () => now, minIntervalMs: 5000 });
  assert.equal(persistence.maybeSave(world, { force: true }), true);

  const restored = new WorldModel({ now: () => now });
  const loader = new WorldPersistence({ storage, now: () => now });
  assert.equal(loader.load(restored), true);
  assert.equal(restored.hasEntity('monster', 'goo'), true);
  assert.equal(restored.performanceFor('goo', 'ranger:1').xp, 1000);
});
