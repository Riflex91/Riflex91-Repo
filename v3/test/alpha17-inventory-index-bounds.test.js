'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAdapter } = require('../src/game/adapter');
const {
  InventoryLedger,
  ControlledMerchantExecutor,
  EconomyTransactionEngine,
  CONTROLLED_MERCHANT_ACK
} = require('../src');

function fakeLedger(entry) {
  return {
    status() { return { stale: false, actionAuthority: false }; },
    get(name, index) {
      return name === entry.character && index === entry.index
        ? { ...entry, actionAuthority: false }
        : null;
    }
  };
}

function merchant(overrides = {}) {
  return {
    name: 'MerchantA',
    ctype: 'merchant',
    level: 80,
    map: 'bank',
    hp: 1000,
    max_hp: 1000,
    mp: 500,
    max_mp: 500,
    gold: 100,
    rip: false,
    target: null,
    isize: 2,
    items: [null, null],
    bank: { items0: Array(42).fill(null) },
    ...overrides
  };
}

function root(character) {
  const value = {
    character,
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { bank: {} }, npcs: {}, items: {}, skills: {}, events: {} },
    setTimeout,
    clearTimeout
  };
  value.globalThis = value;
  return value;
}

function plan(engine, ledger, index, item = 'bankme') {
  return engine.plan(
    { type: 'BANK', character: 'MerchantA', index, quantity: 1 },
    { ledger, snapshot: {} }
  );
}

test('GameAdapter snapshots only indexes below character.isize even if items array is longer', () => {
  const c = merchant({
    isize: 2,
    items: [
      { name: 'slot0', q: 1 },
      { name: 'slot1', q: 1 },
      { name: 'out_of_range', q: 99 }
    ]
  });
  const game = root(c);
  const adapter = new GameAdapter({ root: game, parent: game.parent });
  const snapshot = adapter.snapshot();

  assert.equal(snapshot.character.isize, 2);
  assert.deepEqual(snapshot.character.inventory.map((row) => row && row.index), [0, 1]);
  assert.deepEqual(snapshot.character.inventory.map((row) => row && row.name), ['slot0', 'slot1']);
});

test('InventoryLedger rejects self entries at index >= character.isize before BANK classification', () => {
  const ledger = new InventoryLedger({ bankAllowlist: ['good', 'bad'] });
  const registry = {
    status() {
      return {
        characters: [{
          name: 'MerchantA',
          stateConfidence: 1,
          inventory: [
            { index: 1, name: 'good', level: 0, q: 1 },
            { index: 2, name: 'bad', level: 0, q: 1 }
          ]
        }]
      };
    }
  };
  const liveCharacter = merchant({
    isize: 2,
    items: [null, { name: 'good', q: 1 }, { name: 'bad', q: 1 }]
  });
  const gameData = { items: { good: { type: 'material' }, bad: { type: 'material' } } };

  ledger.observe({ registry, liveCharacter, gameData, observedAt: 1000 });
  assert.equal(ledger.get('MerchantA', 1).disposition, 'BANK');
  assert.equal(ledger.get('MerchantA', 2), null);

  const status = ledger.status();
  assert.equal(status.summary.selfInventory.capacity, 2);
  assert.equal(status.summary.selfInventory.capacitySource, 'character.isize');
  assert.equal(status.summary.selfInventory.outOfRangeRejected, 1);
  assert.equal(status.stats.outOfRangeRejected, 1);
});

test('Controlled Merchant rejects an out-of-range BANK index before bank_store is called', async () => {
  const engine = new EconomyTransactionEngine();
  const ledger = fakeLedger({
    character: 'MerchantA', index: 2, name: 'bankme', level: 0, q: 1, disposition: 'BANK'
  });
  const c = merchant({
    isize: 2,
    items: [null, null, { name: 'bankme', level: 0, q: 1 }]
  });
  const game = root(c);
  let bankCalls = 0;
  game.bank_store = async () => {
    bankCalls += 1;
    return { success: true, response: 'data', place: 'bank' };
  };

  const executor = new ControlledMerchantExecutor({
    root: game,
    engine,
    ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = plan(engine, ledger, 2);
  assert.equal(planned.accepted, true);

  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.executed, false);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'INVENTORY_INDEX_OUT_OF_RANGE');
  assert.equal(result.index, 2);
  assert.equal(result.inventorySize, 2);
  assert.equal(bankCalls, 0);
  assert.equal(executor.status().stats.inventoryIndexRejected, 1);
});

test('Controlled Merchant accepts the highest valid index isize-1 and preserves strict BANK acknowledgement', async () => {
  const engine = new EconomyTransactionEngine();
  const ledger = fakeLedger({
    character: 'MerchantA', index: 1, name: 'bankme', level: 0, q: 1, disposition: 'BANK'
  });
  const bank = { items0: Array(42).fill(null) };
  const c = merchant({
    isize: 2,
    items: [null, { name: 'bankme', level: 0, q: 1 }],
    bank
  });
  const game = root(c);
  let bankCalls = 0;
  game.bank_store = async (index) => {
    bankCalls += 1;
    assert.equal(index, 1);
    game.character.items[index] = null;
    game.character.bank.items0[0] = { name: 'bankme', level: 0, q: 1 };
    return { success: true, response: 'data', place: 'bank', bank_action: 'store', operation: 'swap', inv: 1, str: 0, pack: 'items0' };
  };

  const executor = new ControlledMerchantExecutor({
    root: game,
    engine,
    ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = plan(engine, ledger, 1);
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(result.reason, 'SERVER_ACK_COMMIT');
  assert.equal(result.verification.serverAcknowledged, true);
  assert.equal(result.verification.localObservationConfirmed, true);
  assert.equal(bankCalls, 1);
});
