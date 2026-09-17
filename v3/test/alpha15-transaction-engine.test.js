'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha14Runtime,
  Alpha15Runtime,
  InventoryLedger,
  EconomyTransactionEngine,
  TRANSACTION_SCHEMA_VERSION,
  TRANSACTION_MODE,
  TransactionType,
  TransactionState
} = require('../src');
const { GameAdapter, ACTIVE_ALLOWED } = require('../src/game/adapter');

function gameData() {
  return {
    monsters: {}, maps: { main: {} }, npcs: {}, events: {}, skills: {},
    items: {
      junk: { type: 'material', s: 999, g: 1 },
      bankme: { type: 'material', g: 2 },
      citem: { type: 'ring', compound: true, dex: 2 },
      hpot1: { type: 'pot', gives: [['hp', 400]] }
    }
  };
}

function makeLedger(options = {}) {
  const now = options.now || (() => 1000);
  const ledger = new InventoryLedger({
    now,
    staleAfterMs: 60000,
    sellAllowlist: ['junk'],
    bankAllowlist: ['bankme']
  });
  ledger.observe({
    observedAt: now(),
    registry: { characters: [{
      name: 'M1', ctype: 'merchant', level: 80, stateConfidence: 1,
      inventory: [
        { index: 0, name: 'junk', level: 0, q: 5 },
        { index: 1, name: 'bankme', level: 0, q: 2 },
        { index: 2, name: 'hpot1', level: 0, q: 100 }
      ]
    }] },
    gameData: gameData(),
    liveCharacter: { name: 'M1', items: Array(42).fill(null) }
  });
  return ledger;
}

function memoryStorage(initial = null) {
  let raw = initial;
  return {
    get: () => raw,
    set: (_, value) => { raw = value; },
    raw: () => raw
  };
}

test('Alpha14 runtime version is frozen after later release bumps', () => {
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, xp: 0, gold: 0, items: [], slots: {}, speed: 40 },
    parent: { entities: {}, party: {} }, G: gameData(), performance_trick() {}
  };
  const runtime = new Alpha14Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false });
  assert.equal(runtime.status().version, '3.0.0-alpha.14.0');
});

test('Transaction Engine is schema-versioned, bounded and has zero live authority', () => {
  const engine = new EconomyTransactionEngine({ capacity: 16 });
  const status = engine.status();
  assert.equal(status.schemaVersion, TRANSACTION_SCHEMA_VERSION);
  assert.equal(status.mode, TRANSACTION_MODE);
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directGameplayActionAccess, false);
  assert.equal(status.liveExecutionEnabled, false);
  assert.deepEqual(status.liveFamilies, []);
  assert.ok(status.capacity >= 16 && status.capacity <= 512);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test('Transaction preflight accepts only exact Ledger-authorized dispositions', () => {
  const ledger = makeLedger();
  const engine = new EconomyTransactionEngine();
  const sell = engine.plan({ type: 'SELL', character: 'M1', index: 0, quantity: 2 }, { ledger });
  assert.equal(sell.accepted, true);
  assert.equal(sell.transaction.state, TransactionState.RESERVED);
  assert.equal(sell.transaction.executionAllowed, false);
  const wrong = engine.plan({ type: 'SELL', character: 'M1', index: 1 }, { ledger });
  assert.equal(wrong.accepted, false);
  assert.equal(wrong.reason, 'LEDGER_DISPOSITION_NOT_AUTHORIZED');
  const protectedPotion = engine.plan({ type: 'SELL', character: 'M1', index: 2 }, { ledger });
  assert.equal(protectedPotion.accepted, false);
  assert.equal(protectedPotion.reason, 'LEDGER_DISPOSITION_NOT_AUTHORIZED');
});

test('Transaction reservations prevent double-booking and cancellation releases the item', () => {
  const ledger = makeLedger();
  const engine = new EconomyTransactionEngine();
  const first = engine.plan({ type: TransactionType.BANK, character: 'M1', index: 1 }, { ledger });
  assert.equal(first.accepted, true);
  const duplicate = engine.plan({ type: TransactionType.BANK, character: 'M1', index: 1 }, { ledger });
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, 'ITEM_ALREADY_RESERVED');
  assert.equal(engine.cancel(first.transaction.id).cancelled, true);
  const second = engine.plan({ type: TransactionType.BANK, character: 'M1', index: 1 }, { ledger });
  assert.equal(second.accepted, true);
});

test('Expired transaction lease aborts and releases reservation', () => {
  let now = 1000;
  const ledger = makeLedger({ now: () => now });
  const engine = new EconomyTransactionEngine({ now: () => now, leaseMs: 1000 });
  const first = engine.plan({ type: 'SELL', character: 'M1', index: 0 }, { ledger });
  now += 1001;
  assert.equal(engine.tick().expired, 1);
  assert.equal(engine.get(first.transaction.id).state, TransactionState.ABORTED);
  assert.equal(engine.status().reservations, 0);
});

test('Restart never resumes a nonterminal transaction blindly', () => {
  const storage = memoryStorage();
  const ledger = makeLedger();
  const first = new EconomyTransactionEngine({ storage });
  const tx = first.plan({ type: 'SELL', character: 'M1', index: 0 }, { ledger });
  assert.equal(tx.accepted, true);
  first.save();
  const restored = new EconomyTransactionEngine({ storage });
  assert.equal(restored.load(), true);
  assert.equal(restored.get(tx.transaction.id).state, TransactionState.RECOVERING);
  assert.equal(restored.get(tx.transaction.id).restartReconcileRequired, true);
  const reconciled = restored.reconcile(tx.transaction.id, { ledger });
  assert.equal(reconciled.reconciled, true);
  assert.equal(reconciled.transaction.state, TransactionState.ABORTED);
  assert.equal(restored.status().reservations, 0);
});

test('Corrupt persisted transaction data fails closed', () => {
  const engine = new EconomyTransactionEngine({ storage: memoryStorage('{broken') });
  assert.equal(engine.load(), false);
  assert.equal(engine.status().transactions, 0);
  assert.equal(engine.status().stats.loadErrors, 1);
});

test('Independent action-family circuit breaker opens on bounded failures and cools down', () => {
  let now = 0;
  const engine = new EconomyTransactionEngine({ now: () => now, failureThreshold: 3, failureWindowMs: 10000, circuitCooldownMs: 5000 });
  engine.noteFailure('SELL', 'x1');
  engine.noteFailure('SELL', 'x2');
  assert.equal(engine.breaker('SELL').open, false);
  engine.noteFailure('SELL', 'x3');
  assert.equal(engine.breaker('SELL').open, true);
  assert.equal(engine.breaker('BANK').open, false);
  now += 5001;
  assert.equal(engine.breaker('SELL').open, false);
});

test('Alpha15 runtime integrates transaction planning but cannot enable live economy', () => {
  let now = 10000;
  const storageData = {};
  const storage = { get: (key) => storageData[key] || null, set: (key, value) => { storageData[key] = value; } };
  const root = {
    character: {
      name: 'M1', ctype: 'merchant', level: 80, map: 'main', real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 1000, speed: 40, rip: false,
      items: [{ name: 'junk', level: 0, q: 5 }], slots: {}
    },
    parent: { entities: {}, party: {} }, G: gameData(), performance_trick() {}
  };
  const runtime = new Alpha15Runtime({
    root, parent: root.parent, mode: 'shadow', now: () => now, visibleStatus: false, storage,
    inventorySellAllowlist: ['junk'], inventoryPlanningIntervalMs: 1000,
    contentDriftScanMs: 1000, globalSupervisorIntervalMs: 500,
    characterRoster: [{ name: 'M1', ctype: 'merchant', level: 80, available: true }]
  });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.15.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.economy.actionAuthority, false);
  assert.equal(status.economy.liveEnabled, false);
  assert.equal(status.economy.transactions.liveExecutionEnabled, false);
  assert.equal(runtime.setEconomyLiveEnabled(true), false);
  const planned = runtime.planEconomyTransaction({ type: 'SELL', character: 'M1', index: 0, quantity: 1 });
  assert.equal(planned.accepted, true);
  assert.equal(planned.transaction.executionAllowed, false);
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('General GameAdapter catalogs migrated economy commands while unmigrated destructive actions stay rejected in Alpha15', () => {
  for (const action of ['sell', 'bank_store']) assert.equal(ACTIVE_ALLOWED.has(action), true);
  for (const action of ['bank', 'compound', 'upgrade', 'exchange', 'trade']) assert.equal(ACTIVE_ALLOWED.has(action), false);
  assert.equal(ACTIVE_ALLOWED.has('send_item'), true);
  const root = { character: { name: 'M1', ctype: 'merchant', items: [] }, parent: { entities: {} }, G: {} };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  for (const action of ['bank', 'compound', 'upgrade']) assert.equal(adapter.command(action).reason, 'ACTION_NOT_ALLOWED_IN_ALPHA');
});

test('2000 transaction planning cycles remain bounded and serializable', () => {
  let now = 0;
  const ledger = makeLedger({ now: () => now });
  const engine = new EconomyTransactionEngine({ now: () => now, capacity: 32, leaseMs: 1000 });
  for (let i = 0; i < 2000; i += 1) {
    now += 10;
    ledger.observe({
      observedAt: now,
      registry: { characters: [{ name: 'M1', ctype: 'merchant', level: 80, stateConfidence: 1, inventory: [{ index: 0, name: 'junk', level: 0, q: 5 }] }] },
      gameData: gameData(), liveCharacter: { name: 'M1', items: Array(42).fill(null) }
    });
    const tx = engine.plan({ type: 'SELL', character: 'M1', index: 0 }, { ledger });
    if (tx.accepted) engine.cancel(tx.transaction.id, 'SOAK_CANCEL');
    engine.tick();
  }
  assert.ok(engine.list(1000).length <= 32);
  assert.equal(engine.status().reservations, 0);
  assert.doesNotThrow(() => JSON.stringify(engine.status()));
  assert.doesNotThrow(() => JSON.stringify(engine.list(1000)));
});
