'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha18Runtime } = require('../src/autonomy/alpha18-runtime');
const { Alpha19Runtime } = require('../src/autonomy/alpha19-runtime');
const { MerchantSpaceRecoveryJournal } = require('../src/economy/merchant-space-recovery-journal');
const { HardenedControlledMerchantSpaceRecovery, CONTROLLED_SPACE_RECOVERY_ACK } = require('../src/economy/controlled-merchant-space-recovery-hardened');

function storage() {
  const rows = new Map();
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; } };
}

function childExecutor(executeImpl) {
  let enabled = false;
  return {
    status: () => ({ enabled }),
    configure: (config = {}) => { enabled = config.enabled === true; return { enabled }; },
    disable: () => { enabled = false; return { enabled }; },
    execute: executeImpl || (async () => ({ executed: true, committed: true, reason: 'OK' }))
  };
}

function root(overrides = {}) {
  const value = {
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 10000000, rip: false,
      items: [{ name: 'scrap', q: 10 }], isize: 42, slots: {}, speed: 40, bank: { items0: [null] }
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { bank: {}, bank_b: {} }, npcs: {}, skills: {}, events: {}, items: { scrap: { type: 'material', s: 9999, g: 1 } } },
    bank_packs: { items0: ['bank', 0, 0], items9: ['bank_b', 475000000, 1000] },
    performance_trick() {}, setTimeout, clearTimeout, setInterval, clearInterval,
    ...overrides
  };
  value.globalThis = value;
  return value;
}

function reclaimCandidate() {
  return { character: 'MerchantA', index: 0, item: 'scrap', level: 0, observedQuantity: 10, protectedMinimumReserve: 0, quantity: 1 };
}

function reclaimFallback(candidate = reclaimCandidate()) {
  return {
    at: 1,
    planned: true,
    reason: 'ALPHA19_MINIMAL_RECLAIM_FALLBACK',
    action: 'EMERGENCY_RECLAIM',
    candidate,
    destructive: true,
    exactlyOneUnit: true,
    reobserveRequiredBeforeNextDecision: true,
    bulkSellForbidden: true,
    executionAuthority: false
  };
}

test('Alpha.18 runtime version remains frozen after the Alpha.19 release bump', () => {
  const r = root();
  const runtime = new Alpha18Runtime({ root: r, parent: r.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  assert.equal(runtime.status().version, '3.0.0-alpha.18.0');
});

test('Alpha.19 runtime reports .19 while every new live authority remains default-off', () => {
  const r = root();
  const runtime = new Alpha19Runtime({ root: r, parent: r.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.19.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.alpha19.merchantSpaceRecovery, true);
  assert.equal(status.alpha19.liveExecutionDefault, false);
  assert.equal(status.alpha19.emergencyReclaimMaxUnitsPerOperation, 1);
  assert.equal(status.alpha19.emergencyReclaimBulkAllowed, false);
  assert.equal(status.alpha19.travelAuthority, false);
  assert.equal(status.alpha19.shellExpansionAuthority, false);
  assert.equal(status.economy.merchantSpaceRecovery.enabled, false);
  assert.equal(status.economy.merchantSpaceRecovery.actionAuthority, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('cross-floor expansion can fall through to one freshly revalidated reclaim without Travel authority', async () => {
  const r = root();
  const candidate = reclaimCandidate();
  let sellCalls = 0;
  let planCalls = 0;
  let expansionCalls = 0;
  const manager = {
    planSpace: () => {
      planCalls += 1;
      return { planned: true, action: 'EXPAND_BANK_PACK', reason: 'BANK_EXPANSION_SAFE', pack: 'items9', map: 'bank_b', currency: 'gold', cost: 475000000, requiresTravel: true };
    },
    _reclaim: () => candidate
  };
  const journal = new MerchantSpaceRecoveryJournal();
  const merchant = childExecutor(async () => { sellCalls += 1; r.character.items[0].q -= 1; return { executed: true, committed: true, reason: 'VERIFIED_COMMIT' }; });
  const expansion = childExecutor(async () => { expansionCalls += 1; return { executed: true, committed: true, rawActions: 1 }; });
  const recovery = new HardenedControlledMerchantSpaceRecovery({
    root: r,
    journal,
    manager,
    transactionEngine: { plan: (request) => {
      assert.equal(request.type, 'SELL');
      assert.equal(request.quantity, 1);
      return { accepted: true, transaction: { id: 'sell-1' } };
    } },
    ledger: {},
    controlledMerchant: merchant,
    expansionTransactions: { plan: () => { throw new Error('cross-floor expansion must not be planned'); } },
    controlledExpansion: expansion,
    controlledConsolidation: childExecutor(),
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    observeBank: () => ({ packs: [], totals: { free: 0 } }),
    getGameData: () => r.G
  });

  const planned = recovery.plan({ character: 'MerchantA', index: 0, item: 'scrap', depositBlocked: true });
  assert.equal(planned.accepted, true);
  assert.equal(planned.plan.action, 'EXPAND_BANK_PACK');
  recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK });
  const result = await recovery.execute(planned.operation.id);
  assert.equal(result.committed, true);
  assert.equal(sellCalls, 1);
  assert.equal(expansionCalls, 0);
  assert.ok(planCalls >= 2);
  assert.equal(result.operation.emergencyReclaimCount, 1);
  assert.equal(result.operation.rawActionCount, 1);
});

test('no-workspace consolidation can fall through safely to one reclaim and never calls consolidation raw APIs', async () => {
  const r = root();
  const candidate = reclaimCandidate();
  let sellCalls = 0;
  let consolidationCalls = 0;
  const manager = {
    planSpace: () => ({ planned: true, action: 'CONSOLIDATE_BANK_STACKS', reason: 'SAFE_STACK_CONSOLIDATION', pack: 'items0', move: { fromIndex: 1, toIndex: 0, name: 'scrap', level: 0 } }),
    _expansion: () => null,
    _reclaim: () => candidate
  };
  const journal = new MerchantSpaceRecoveryJournal();
  const consolidation = childExecutor(async () => { consolidationCalls += 1; return { executed: false, committed: false, reason: 'NO_INVENTORY_WORKSPACE', rawActions: 0 }; });
  const recovery = new HardenedControlledMerchantSpaceRecovery({
    root: r,
    journal,
    manager,
    transactionEngine: { plan: () => ({ accepted: true, transaction: { id: 'sell-2' } }) },
    ledger: {},
    controlledMerchant: childExecutor(async () => { sellCalls += 1; return { executed: true, committed: true, reason: 'VERIFIED_COMMIT' }; }),
    expansionTransactions: {},
    controlledExpansion: childExecutor(),
    controlledConsolidation: consolidation,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    observeBank: () => ({ packs: [], totals: { free: 0 } }),
    getGameData: () => r.G
  });

  const planned = recovery.plan({ character: 'MerchantA', index: 0, item: 'scrap', depositBlocked: true });
  recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK });
  const result = await recovery.execute(planned.operation.id);
  assert.equal(result.committed, true);
  assert.equal(consolidationCalls, 1);
  assert.equal(sellCalls, 1);
  assert.equal(result.operation.rawActionCount, 1);
  assert.equal(result.operation.emergencyReclaimCount, 1);
});

test('verified consolidation plus deposit consumes exactly the three-call parent raw-action budget', async () => {
  const r = root();
  let planCalls = 0;
  let bankCalls = 0;
  const manager = {
    planSpace: () => {
      planCalls += 1;
      if (planCalls === 1) return { planned: true, action: 'CONSOLIDATE_BANK_STACKS', reason: 'SAFE_STACK_CONSOLIDATION', pack: 'items0', move: { fromIndex: 1, toIndex: 0, name: 'scrap', level: 0 } };
      return { planned: true, action: 'DEPOSIT_FREE_SLOT', reason: 'FREE_BANK_SLOT_AVAILABLE', pack: 'items0' };
    }
  };
  const journal = new MerchantSpaceRecoveryJournal();
  const recovery = new HardenedControlledMerchantSpaceRecovery({
    root: r,
    journal,
    manager,
    transactionEngine: { plan: (request) => ({ accepted: true, transaction: { id: `${request.type.toLowerCase()}-1` } }) },
    ledger: {},
    controlledMerchant: childExecutor(async () => { bankCalls += 1; return { executed: true, committed: true, reason: 'VERIFIED_COMMIT' }; }),
    expansionTransactions: {},
    controlledExpansion: childExecutor(),
    controlledConsolidation: childExecutor(async () => ({ executed: true, committed: true, reason: 'VERIFIED_CONSOLIDATION', rawActions: 2 })),
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    observeBank: () => ({ packs: [], totals: { free: 1 } }),
    getGameData: () => r.G
  });

  const planned = recovery.plan({ character: 'MerchantA', index: 0, item: 'scrap', depositBlocked: true });
  recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK });
  const result = await recovery.execute(planned.operation.id);
  assert.equal(result.committed, true);
  assert.equal(bankCalls, 1);
  assert.equal(result.operation.rawActionCount, 3);
  assert.equal(result.operation.emergencyReclaimCount, 0);
});
