'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AccountCharacterTransport, NAMED_RECEIVER_CM_PROTOCOL } = require('../src/party/account-character-transport');
const { ContentDriftMonitor } = require('../src/world/content-drift');
const { contentDriftStorageKey } = require('../src/autonomy/alpha13-runtime');

test('send_cm fallback preserves the named receiver and legacy CM handling', async () => {
  const sent = [];
  const senderRoot = {
    character: { name: 'My_Merchant' },
    get_active_characters: () => ({ My_Merchant: 'self' }),
    command_character() { throw new Error('must not use direct path for unobserved target'); },
    send_cm(name, payload) { sent.push([name, payload]); }
  };
  const sender = new AccountCharacterTransport({
    root: senderRoot,
    trustedNames: ['My_Merchant', 'My_Ranger3']
  });

  const result = await sender.send('My_Ranger3', { type: 'TEAM_REGROUP', map: 'winterland' }, {
    receiver: '__AIO_TEAM_REGROUP_RECEIVER',
    sender: 'My_Merchant'
  });
  assert.equal(result.transport, 'send_cm');
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], 'My_Ranger3');
  assert.equal(sent[0][1].__aioProtocol, NAMED_RECEIVER_CM_PROTOCOL);
  assert.equal(sent[0][1].receiver, '__AIO_TEAM_REGROUP_RECEIVER');

  const legacy = [];
  const received = [];
  const receiverRoot = {
    character: { name: 'My_Ranger3' },
    get_active_characters: () => ({ My_Ranger3: 'self' }),
    on_cm(name, payload) { legacy.push([name, payload]); }
  };
  const receiver = new AccountCharacterTransport({
    root: receiverRoot,
    trustedNames: ['My_Merchant', 'My_Ranger3']
  });
  receiver.installDirectReceiver('__AIO_TEAM_REGROUP_RECEIVER', (name, payload) => received.push([name, payload]));

  receiverRoot.on_cm('My_Merchant', sent[0][1]);
  assert.deepEqual(received, [['My_Merchant', { type: 'TEAM_REGROUP', map: 'winterland' }]]);
  assert.equal(receiver.status().stats.fallbackReceived, 1);

  receiverRoot.on_cm('SomeFriend', { hello: true });
  assert.deepEqual(legacy, [['SomeFriend', { hello: true }]]);
});

test('content drift persistence is isolated per character while genuine same-character drift stays fail-closed', () => {
  const persisted = {};
  const storage = {
    get(key) { return persisted[key] || null; },
    set(key, value) { persisted[key] = value; return true; }
  };
  const snapshot = { character: { name: 'My_Ranger1', map: 'winterland' }, entities: [] };
  const key1 = contentDriftStorageKey({ character: { name: 'My_Ranger1' } });
  const key2 = contentDriftStorageKey({ character: { name: 'My_Ranger2' } });
  assert.notEqual(key1, key2);

  let now = 1000;
  const ranger1 = new ContentDriftMonitor({ storage, key: key1, now: () => now, scanBudget: 96, minObservedSamples: 2 });
  ranger1.scan(snapshot, { maps: { winterland: { monsters: [], doors: [] } } });
  ranger1.save({ force: true });

  const ranger2 = new ContentDriftMonitor({ storage, key: key2, now: () => now, scanBudget: 96, minObservedSamples: 2 });
  assert.equal(ranger2.load(), false);
  const firstRanger2 = ranger2.scan({ ...snapshot, character: { ...snapshot.character, name: 'My_Ranger2' } }, {
    maps: { winterland: { monsters: [], doors: [], clientOnlyShape: true } }
  });
  assert.equal(firstRanger2.changes.some((row) => row.category === 'maps' && row.kind === 'DRIFT'), false);

  now = 2000;
  const changed = ranger1.scan(snapshot, { maps: { winterland: { monsters: [{ type: 'new-danger' }], doors: [] } } });
  assert.equal(changed.changes.some((row) => row.category === 'maps' && row.kind === 'DRIFT'), true);
  assert.equal(ranger1.requiresRevalidation('maps', 'winterland'), true);
});
