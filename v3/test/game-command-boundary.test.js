'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAdapter, ACTIVE_ALLOWED, COMMAND_CATALOG } = require('../src/game/adapter');
const { StabilityGameAdapter } = require('../src/game/stability-adapter');

function fixture(mode = 'active') {
  const calls = [];
  const root = {
    character: { name: 'MerchantA', ctype: 'merchant', stand: false, items: [{ name: 'hpot0', q: 50 }] },
    parent: { entities: {}, party: {} },
    G: { items: { hpot0: {} } },
    open_stand(slot) { calls.push(['open_stand', slot]); this.character.stand = true; return { success: true }; },
    close_stand() { calls.push(['close_stand']); this.character.stand = false; return { success: true }; },
    send_item(target, slot, quantity) { calls.push(['send_item', target, slot, quantity]); this.character.items[slot].q -= quantity; return { success: true }; },
    send_gold(target, amount) { calls.push(['send_gold', target, amount]); return { success: true }; },
    sell(slot, quantity) { calls.push(['sell', slot, quantity]); return { success: true }; },
    bank_store(slot) { calls.push(['bank_store', slot]); return { success: true, place: 'bank', bank_action: 'store' }; },
    loot() { calls.push(['loot']); return { success: true }; },
    start_character(name, slot) { calls.push(['start_character', name, slot]); return { success: true }; },
    stop_character(name) { calls.push(['stop_character', name]); return { success: true }; },
    send_party_invite(name) { calls.push(['send_party_invite', name]); return { success: true }; },
    accept_party_invite(name) { calls.push(['accept_party_invite', name]); return { success: true }; },
    send_cm(name, payload) { calls.push(['send_cm', name, payload]); return { success: true }; },
    command_character(name, code) { calls.push(['command_character', name, code]); return { success: true }; }
  };
  return { root, calls, adapter: new GameAdapter({ root, parent: root.parent, mode }) };
}

test('structured command catalog exposes all migrated step-3 command families', () => {
  for (const action of ['open_stand', 'close_stand', 'send_item', 'send_gold', 'sell', 'bank_store']) {
    assert.equal(ACTIVE_ALLOWED.has(action), true);
    assert.deepEqual(COMMAND_CATALOG[action], { family: 'merchant', mutation: true, outcome: 'domain' });
  }
  assert.deepEqual(COMMAND_CATALOG.loot, { family: 'loot', mutation: true, outcome: 'domain' });
  for (const action of ['start_character', 'stop_character', 'send_party_invite', 'accept_party_invite']) {
    assert.deepEqual(COMMAND_CATALOG[action], { family: 'party-control', mutation: true, outcome: 'domain' });
  }
  for (const action of ['send_cm', 'command_character']) {
    assert.deepEqual(COMMAND_CATALOG[action], { family: 'account-communication', mutation: true, outcome: 'domain' });
  }
  assert.equal(ACTIVE_ALLOWED.has('upgrade'), false);
});

test('active GameAdapter executes stand control and item delivery with exact arguments', async () => {
  const { adapter, root, calls } = fixture('active');
  let result = adapter.command('open_stand', [7]);
  assert.equal(result.executed, true);
  assert.equal((await result.value).success, true);
  assert.equal(root.character.stand, true);

  result = adapter.command('send_item', ['FarmerA', 0, 12]);
  assert.equal(result.executed, true);
  assert.equal((await result.value).success, true);
  assert.equal(root.character.items[0].q, 38);

  result = adapter.command('close_stand');
  assert.equal(result.executed, true);
  assert.equal((await result.value).success, true);
  assert.equal(root.character.stand, false);
  assert.deepEqual(calls, [['open_stand', 7], ['send_item', 'FarmerA', 0, 12], ['close_stand']]);
});

test('active GameAdapter executes the remaining migrated production mutations', async () => {
  const { adapter, calls } = fixture('active');
  const commands = [
    ['send_gold', ['MerchantA', 12345]],
    ['sell', [3, 2]],
    ['bank_store', [4]],
    ['loot', []],
    ['start_character', ['RangerA', 7]],
    ['stop_character', ['RangerA']],
    ['send_party_invite', ['RangerA']],
    ['accept_party_invite', ['MerchantA']],
    ['send_cm', ['RangerA', { type: 'ping' }]],
    ['command_character', ['RangerA', 'globalThis.__PING=true;']]
  ];

  for (const [action, args] of commands) {
    const result = adapter.command(action, args);
    assert.equal(result.executed, true, action);
    assert.equal((await result.value).success, true, action);
  }
  assert.deepEqual(calls, commands.map(([action, args]) => [action, ...args]));
});

test('shadow GameAdapter records intent without executing migrated writes', () => {
  const { adapter, calls, root } = fixture('shadow');
  const commands = [
    ['open_stand', [0]],
    ['send_item', ['FarmerA', 0, 12]],
    ['close_stand', []],
    ['send_gold', ['MerchantA', 100]],
    ['sell', [0, 1]],
    ['bank_store', [0]],
    ['loot', []],
    ['start_character', ['RangerA', 7]],
    ['stop_character', ['RangerA']],
    ['send_party_invite', ['RangerA']],
    ['accept_party_invite', ['MerchantA']],
    ['send_cm', ['RangerA', { type: 'ping' }]],
    ['command_character', ['RangerA', 'noop']]
  ];
  for (const [action, args] of commands) {
    const result = adapter.command(action, args);
    assert.equal(result.executed, false, action);
    assert.equal(result.shadow, true, action);
  }
  assert.deepEqual(calls, []);
  assert.equal(root.character.stand, false);
  assert.equal(root.character.items[0].q, 50);
});

test('canCommand reports raw API availability without executing it', () => {
  const { adapter, calls } = fixture('active');
  assert.equal(adapter.canCommand('send_gold'), true);
  assert.equal(adapter.canCommand('upgrade'), false);
  assert.deepEqual(calls, []);
});

test('stability adapter delegates merchant verification to the owning domain service', () => {
  const { root, calls } = fixture('active');
  const adapter = new StabilityGameAdapter({ root, parent: root.parent, mode: 'active' });
  const result = adapter.command('send_item', ['FarmerA', 0, 1]);
  assert.equal(result.executed, true);
  assert.equal(result.accepted, true);
  assert.equal(result.verificationOwner, 'domain');
  assert.equal(result.outcomeId, null);
  assert.equal(adapter.outcomes.status().counts.PENDING, 0);
  assert.deepEqual(calls, [['send_item', 'FarmerA', 0, 1]]);
});
