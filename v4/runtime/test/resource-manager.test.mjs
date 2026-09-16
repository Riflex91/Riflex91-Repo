import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceManager } from '../../build/kernel/resource-manager.js';

test('multi-resource acquisition is atomic when one resource is blocked', () => {
  const resources = new ResourceManager();
  resources.acquire({ ownerId: 'banking', resources: ['inventory'], priority: 50, preemptible: false, now: 1 });

  const result = resources.acquire({ ownerId: 'merchant-service', resources: ['movement', 'inventory'], priority: 100, preemptible: false, now: 2 });

  assert.equal(result.granted, false);
  assert.equal(resources.getLease('movement'), null);
  assert.equal(resources.getLease('inventory')?.ownerId, 'banking');
});

test('higher-priority request can preempt a preemptible owner as one ownership set', () => {
  const resources = new ResourceManager();
  resources.acquire({ ownerId: 'explore', resources: ['movement', 'equipment'], priority: 10, preemptible: true, now: 1 });

  const result = resources.acquire({ ownerId: 'retreat', resources: ['movement'], priority: 1000, preemptible: false, now: 2 });

  assert.equal(result.granted, true);
  assert.deepEqual(result.preemptedOwners, ['explore']);
  assert.equal(resources.getLease('movement')?.ownerId, 'retreat');
  assert.equal(resources.getLease('equipment'), null);
});
