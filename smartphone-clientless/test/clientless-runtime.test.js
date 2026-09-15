'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ClientlessGameAdapter } = require('../src/runtime/ClientlessGameAdapter');
const { CharacterRuntimeManager } = require('../src/runtime/CharacterRuntimeManager');

function transportFor(name) {
  let connected = false;
  return {
    async connect() { connected = true; },
    async disconnect() { connected = false; },
    snapshot() { return connected ? { character: { name }, entities: [], objects: [], party: [], game: {} } : null; },
    command(action, args) { return { action, args }; },
    status() { return { connected }; }
  };
}

test('adapter executes through injected transport without browser globals', () => {
  const adapter = new ClientlessGameAdapter({ transport: transportFor('Alpha'), mode: 'active' });
  const result = adapter.command('move', [1, 2]);
  assert.equal(result.executed, true);
  assert.equal(result.value.action, 'move');
});

test('manager creates one session per selected character and preserves roles', async () => {
  const manager = new CharacterRuntimeManager({ transportFactory: ({ characterName }) => transportFor(characterName) });
  await manager.applySelection([
    { characterName: 'FarmerOne', role: 'farmer' },
    { characterName: 'Trader', role: 'merchant' }
  ]);
  const status = manager.status();
  assert.equal(status.browser, false);
  assert.deepEqual(status.characters.map((x) => [x.characterName, x.role]), [['FarmerOne', 'farmer'], ['Trader', 'merchant']]);
  await manager.close();
});
