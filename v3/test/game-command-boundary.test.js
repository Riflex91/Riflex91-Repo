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
    send_item(target, slot, quantity) { calls.push(['send_item', target, slot, quantity]); this.character.items[slot].q -= quantity; return { success: true }; }
  };
  return { root, calls, adapter: new GameAdapter({ root, parent: root.parent, mode }) };
}

test('structured command catalog exposes the bounded merchant command family', () => {
  for (const action of ['open_stand', 'close_stand', 'send_item']) {
    assert.equal(ACTIVE_ALLOWED.has(action), true);
    assert.deepEqual(COMMAND_CATALOG[action], { family: 'merchant', mutation: true, outcome: 'domain' });
  }
  assert.equal(ACTIVE_ALLOWED.has('sell'), false);
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

test('shadow GameAdapter records intent without executing merchant writes', () => {
  const { adapter, calls, root } = fixture('shadow');
  for (const [action, args] of [['open_stand', [0]], ['send_item', ['FarmerA', 0, 12]], ['close_stand', []]]) {
    const result = adapter.command(action, args);
    assert.equal(result.executed, false);
    assert.equal(result.shadow, true);
  }
  assert.deepEqual(calls, []);
  assert.equal(root.character.stand, false);
  assert.equal(root.character.items[0].q, 50);
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
