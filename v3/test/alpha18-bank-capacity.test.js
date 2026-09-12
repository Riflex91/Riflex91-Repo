'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BankCapacityManager, BankSpaceAction } = require('../src/economy/bank-capacity-manager');
const { BankExpansionTransactionEngine } = require('../src/economy/bank-expansion-transactions');
const { ControlledBankExpansionExecutor } = require('../src/economy/controlled-bank-expansion-executor');

function memoryStorage() {
  const data = new Map();
  return { get: (key) => data.get(key), set: (key, value) => { data.set(key, value); return true; }, data };
}
function gameData() {
  return { items: {
    seashell: { type: 'material', s: 9999, g: 20 },
    scrap: { type: 'material', s: 9999, g: 1 },
    hpot1: { type: 'pot', s: 9999, g: 20 },
    weapon: { type: 'weapon', upgrade: true, wtype: 'sword', g: 1000 },
    questmat: { type: 'material', s: 9999, quest: true, g: 1 }
  } };
}
function manager(options = {}) {
  return new BankCapacityManager({ workspaceSlots: 1, protectedGoldReserve: 100, pressureObservationsRequired: 3, ...options });
}
function observe(m, overrides = {}) {
  const character = overrides.character || { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [null, null] } };
  return m.observe({ character, bankPacks: overrides.bankPacks || { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData(), contentDrift: overrides.contentDrift || null, observedAt: overrides.observedAt });
}
function sellLedger(entries, stale = false) {
  return { status: () => ({ stale }), list: () => entries.map((row) => ({ metadataKnown: true, locked: false, special: false, level: 0, q: 2, disposition: 'SELL', ...row })) };
}

test('discovers unlocked and locked packs dynamically without hardcoded pack names', () => {
  const m = manager();
  const obs = m.observe({
    character: { name: 'My_Merchant', map: 'vaultx', gold: 1000, bank: { alphaPack: [null], omegaPack: [{ name: 'seashell', q: 2 }] } },
    bankPacks: { alphaPack: ['vaultx', 0, 0], omegaPack: ['vaultx', 0, 0], futurePack: ['vaultx', 250, 7] },
    gameData: gameData()
  });
  assert.deepEqual(obs.packs.map((row) => row.name), ['alphaPack', 'futurePack', 'omegaPack']);
  assert.equal(obs.unlockedPackCount, 2);
  assert.equal(obs.lockedPackCount, 1);
  assert.equal(obs.totals.capacity, 2);
  assert.equal(obs.totals.occupied, 1);
});

test('uses compatible stack before free slot or expansion', () => {
  const m = manager();
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'seashell', q: 10 }, null] } }, bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData() });
  const plan = m.planSpace({ item: 'seashell', quantity: 5 }, { observation: obs, gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.DEPOSIT_STACK);
  assert.equal(plan.pack, 'items0');
});

test('uses free bank slot before expansion', () => {
  const m = manager();
  const obs = observe(m);
  const plan = m.planSpace({ item: 'scrap', quantity: 1 }, { observation: obs, gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.DEPOSIT_FREE_SLOT);
});

test('plans safe stack consolidation before expansion', () => {
  const m = manager();
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'seashell', q: 3 }, { name: 'seashell', q: 4 }] } }, bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData() });
  const plan = m.planSpace({ item: 'scrap' }, { observation: obs, gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.CONSOLIDATE_BANK_STACKS);
  assert.equal(plan.destructive, false);
  assert.equal(plan.executionAuthority, false);
});

test('expands only after blocked deposit or sustained pressure and preserves gold reserve', () => {
  const m = manager({ protectedGoldReserve: 400 });
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'weapon' }] } }, bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData() });
  const plan = m.planSpace({ item: 'scrap', depositBlocked: true }, { observation: obs, gold: 1000, currentMap: 'bank', gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.EXPAND_BANK_PACK);
  assert.equal(plan.pack, 'items2');
  assert.equal(plan.currency, 'gold');
  assert.equal(plan.cost, 500);
  assert.equal(plan.reserveAfter, 500);
  assert.equal(plan.exactlyOneExpansion, true);
});

test('does not expand when protected reserve would be violated', () => {
  const m = manager({ protectedGoldReserve: 600 });
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'weapon' }] } }, bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData() });
  const plan = m.planSpace({ item: 'scrap', depositBlocked: true }, { observation: obs, gold: 1000, gameData: gameData(), ledger: sellLedger([]) });
  assert.equal(plan.action, BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK);
  assert.equal(plan.globalBotStop, false);
});

test('EMERGENCY_RECLAIM only chooses positively disposable low-risk item and exactly one unit', () => {
  const m = manager({ protectedGoldReserve: 1000 });
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'weapon' }] } }, bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData() });
  const ledger = sellLedger([
    { character: 'My_Merchant', index: 1, name: 'scrap', q: 10 },
    { character: 'My_Merchant', index: 2, name: 'weapon', q: 1, disposition: 'SELL' },
    { character: 'My_Merchant', index: 3, name: 'questmat', q: 5, disposition: 'SELL' }
  ]);
  const plan = m.planSpace({ item: 'seashell', depositBlocked: true }, { observation: obs, gold: 1000, ledger, gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.EMERGENCY_RECLAIM);
  assert.equal(plan.candidate.item, 'scrap');
  assert.equal(plan.candidate.quantity, 1);
  assert.equal(plan.exactlyOneUnit, true);
  assert.equal(plan.reobserveRequiredBeforeNextDecision, true);
  assert.equal(plan.bulkSellForbidden, true);
});

test('protected minimum reserve blocks reclaim candidate', () => {
  const m = manager({ protectedGoldReserve: 1000 });
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'weapon' }] } }, bankPacks: { items0: ['bank', 0, 0] }, gameData: gameData() });
  const ledger = sellLedger([{ character: 'My_Merchant', index: 1, name: 'scrap', q: 2 }]);
  const plan = m.planSpace({ item: 'seashell', depositBlocked: true }, { observation: obs, ledger, gameData: gameData(), minimumReserves: { scrap: 2 } });
  assert.equal(plan.action, BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK);
});

test('stale ledger and no safe expansion selectively block inventory-producing work only', () => {
  const m = manager({ protectedGoldReserve: 1000 });
  const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 100, bank: { items0: [{ name: 'weapon' }] } }, bankPacks: { items0: ['bank', 0, 0] }, gameData: gameData() });
  const plan = m.planSpace({ item: 'seashell', depositBlocked: true }, { observation: obs, ledger: sellLedger([], true), gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK);
  assert.equal(plan.blockInventoryProducingWork, true);
  assert.equal(plan.globalBotStop, false);
  assert.ok(plan.independentSubsystemsMayContinue.includes('combat'));
  assert.ok(plan.independentSubsystemsMayContinue.includes('party'));
  assert.ok(plan.independentSubsystemsMayContinue.includes('monitoring'));
});

test('sustained pressure requires bounded consecutive observations', () => {
  const m = manager({ pressureObservationsRequired: 3 });
  const args = { character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank: { items0: [{ name: 'weapon' }] } }, bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] }, gameData: gameData() };
  assert.equal(m.observe(args).sustainedPressure, false);
  assert.equal(m.observe(args).sustainedPressure, false);
  assert.equal(m.observe(args).sustainedPressure, true);
});

test('bank expansion transaction dedupes pack and rejects stale cost', () => {
  let now = 1000;
  const engine = new BankExpansionTransactionEngine({ now: () => now, storage: memoryStorage() });
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: { capacity: 1 } };
  const plan = { action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 };
  const first = engine.plan(plan, { observation });
  assert.equal(first.accepted, true);
  assert.equal(engine.plan(plan, { observation }).reason, 'BANK_PACK_TRANSACTION_ALREADY_ACTIVE');
  assert.equal(new BankExpansionTransactionEngine().plan({ ...plan, cost: 499 }, { observation }).reason, 'EXPANSION_COST_STALE');
});

test('restart reconciliation commits only if unlock is observed and otherwise requires a new transaction', () => {
  const storage = memoryStorage();
  let now = 1000;
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const engine1 = new BankExpansionTransactionEngine({ now: () => now, storage });
  const planned = engine1.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation });
  assert.equal(planned.accepted, true);
  const engine2 = new BankExpansionTransactionEngine({ now: () => now, storage });
  assert.equal(engine2.load(), true);
  assert.equal(engine2.get(planned.transaction.id).state, 'RECOVERING');
  const reconciled = engine2.reconcile(planned.transaction.id, { packs: [{ name: 'items2', unlocked: true, capacity: 42 }] });
  assert.equal(reconciled.committed, true);
  assert.equal(engine2.get(planned.transaction.id).reason, 'RESTART_OBSERVED_UNLOCK');
});

test('restart reconciliation does not blindly retry an uncertain raw action', () => {
  const storage = memoryStorage();
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const engine1 = new BankExpansionTransactionEngine({ now: () => 1000, storage });
  const planned = engine1.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation });
  const engine2 = new BankExpansionTransactionEngine({ now: () => 2000, storage });
  engine2.load();
  const reconciled = engine2.reconcile(planned.transaction.id, observation);
  assert.equal(reconciled.committed, false);
  assert.equal(engine2.get(planned.transaction.id).state, 'ABORTED');
  assert.match(engine2.get(planned.transaction.id).reason, /NEW_TRANSACTION/);
});

test('lease expiry aborts and circuit breaker opens after bounded failures', () => {
  let now = 0;
  const engine = new BankExpansionTransactionEngine({ now: () => now, leaseMs: 1000, failureThreshold: 2, circuitCooldownMs: 5000 });
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const planned = engine.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500 }, { observation });
  now = 1001;
  engine.tick();
  assert.equal(engine.get(planned.transaction.id).state, 'ABORTED');
  engine.noteFailure('A');
  engine.noteFailure('B');
  assert.equal(engine.breaker().open, true);
});

test('controlled expansion rejects wrong cost before raw action', async () => {
  const storage = memoryStorage();
  const engine = new BankExpansionTransactionEngine({ storage });
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const tx = engine.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation }).transaction;
  let calls = 0;
  const root = { character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', gold: 1000, bank: { items0: [] } }, bank_packs: { items2: ['bank', 600, 50] }, open_bank_pack: async () => { calls += 1; } };
  const executor = new ControlledBankExpansionExecutor({ root, engine, manager: manager(), getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute(tx.id);
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'EXPANSION_COST_STALE');
  assert.equal(calls, 0);
});

test('controlled expansion requires observed non-empty unlocked capacity after official Promise', async () => {
  const engine = new BankExpansionTransactionEngine();
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const tx = engine.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation }).transaction;
  const root = { character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', gold: 1000, bank: { items0: [] } }, bank_packs: { items2: ['bank', 500, 50] }, open_bank_pack: async () => { root.character.bank.items2 = []; return { pack: 'items2' }; } };
  const executor = new ControlledBankExpansionExecutor({ root, engine, manager: manager(), getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute(tx.id);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'BANK_PACK_UNLOCK_NOT_OBSERVED');
  assert.equal(engine.get(tx.id).state, 'FAILED_SAFE');
});

test('controlled expansion commits one official open_bank_pack call after exact preflight and unlock observation', async () => {
  const engine = new BankExpansionTransactionEngine();
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const tx = engine.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation }).transaction;
  let calls = 0;
  const root = { character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', gold: 1000, bank: { items0: [] } }, bank_packs: { items2: ['bank', 500, 50] }, open_bank_pack: async (pack, currency) => { calls += 1; assert.equal(pack, 'items2'); assert.equal(currency, 'gold'); root.character.gold = 500; root.character.bank.items2 = new Array(42).fill(null); return { pack: 'items2', request_id: 'official' }; } };
  const executor = new ControlledBankExpansionExecutor({ root, engine, manager: manager(), getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute(tx.id);
  assert.equal(result.committed, true);
  assert.equal(result.after.capacity, 42);
  assert.equal(calls, 1);
  assert.equal(engine.get(tx.id).state, 'COMMITTED');
});

test('2000+ cycle bank-capacity soak remains bounded and never grants action authority', () => {
  const m = manager({ pressureObservationsRequired: 3 });
  for (let i = 0; i < 2500; i += 1) {
    const full = i % 7 !== 0;
    const bank = { dyn0: full ? [{ name: 'weapon' }] : [null] };
    const obs = m.observe({ character: { name: 'My_Merchant', map: 'bank', gold: 1000, bank }, bankPacks: { dyn0: ['bank', 0, 0], [`dyn${i % 5 + 1}`]: ['bank', 500 + i, 0] }, gameData: gameData(), observedAt: i });
    assert.equal(obs.actionAuthority, false);
    assert.ok(obs.packs.length <= 2);
  }
  const status = m.status();
  assert.equal(status.stats.observations, 2500);
  assert.equal(status.actionAuthority, false);
  assert.equal(status.destructiveActionAuthority, false);
  assert.equal(status.automaticSellEnabled, false);
});
