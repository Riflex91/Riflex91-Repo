'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ClientlessGameAdapter } = require('../src/runtime/ClientlessGameAdapter');
const { CharacterRuntimeManager } = require('../src/runtime/CharacterRuntimeManager');
const { ALClientTransport } = require('../src/runtime/ALClientTransport');

function transportFor(name) {
  let connected = false;
  return {
    async connect() { connected = true; },
    async disconnect() { connected = false; },
    snapshot() { return connected ? { character: { name, ctype: 'ranger', level: 1 }, entities: [], objects: [], party: [], game: {} } : null; },
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

test('ALClient transport authenticates and starts the selected character', async () => {
  const calls = [];
  const character = {
    ready: true, id: 'FarmerOne', name: 'FarmerOne', ctype: 'ranger', level: 12, map: 'main', x: 1, y: 2,
    hp: 100, max_hp: 100, mp: 80, max_mp: 100, range: 120, speed: 40, frequency: 1, xp: 10, gold: 20,
    items: [], entities: new Map(), chests: new Map(), isize: 42,
    move(x, y) { calls.push(['move', x, y]); }, disconnect() { calls.push(['disconnect']); }
  };
  const AL = {
    Game: {
      user: null, G: null,
      async login(email) { calls.push(['login', email]); this.user = { userID: 'u', userAuth: 'a', secure: true }; },
      async getGData() { this.G = { monsters: {}, maps: {}, skills: {} }; return this.G; },
      async startCharacter(name, region, identifier) { calls.push(['start', name, region, identifier]); return character; }
    },
    Pathfinder: { async prepare() { calls.push(['prepare']); } }
  };
  const transport = new ALClientTransport({ AL, credentials: { email: 'test@example.com', password: 'secret' }, characterName: 'FarmerOne', region: 'EU', identifier: 'I' });
  await transport.connect();
  assert.equal(transport.snapshot().character.name, 'FarmerOne');
  transport.command('move', [5, 6]);
  assert.deepEqual(calls.find((x) => x[0] === 'start'), ['start', 'FarmerOne', 'EU', 'I']);
  assert.deepEqual(calls.find((x) => x[0] === 'move'), ['move', 5, 6]);
  transport.disconnect();
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
