'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InventoryLedger } = require('../src/economy/inventory-ledger');
const { GearProgressionEvaluator, scoreItem } = require('../src/economy/gear-progression');
const { EconomyTransactionEngine } = require('../src/economy/transaction-engine');
const { ControlledMerchantExecutor, CONTROLLED_MERCHANT_ACK } = require('../src/economy/controlled-merchant-executor');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeEngine, makeControlledMerchant, makeLedger, makeRuntime } = require('./alpha27-convergence-test-helpers');

test('InventoryLedger recognizes Adventure Land object-valued compound metadata', () => {
  const inventory = [0, 1, 2].map((index) => ({ index, name: 'ringsj', level: 0, q: 1 }));
  const ledger = new InventoryLedger({ now: () => 1000 });
  ledger.observe({
    registry: {
      characters: [{
        name: 'Merchant',
        ctype: 'merchant',
        stateConfidence: 1,
        inventory
      }]
    },
    gameData: {
      items: {
        ringsj: {
          type: 'ring',
          g: 24000,
          compound: { int: 1, str: 1, dex: 1, resistance: 5 }
        }
      }
    },
    liveCharacter: { name: 'Merchant', isize: 42, items: inventory }
  });

  assert.deepEqual(
    inventory.map((row) => ledger.get('Merchant', row.index).disposition),
    ['RESERVE_COMPOUND', 'RESERVE_COMPOUND', 'RESERVE_COMPOUND']
  );
});

test('compound counts are character-local and never combine copies spread across the party', () => {
  const ledger = new InventoryLedger({ now: () => 1000 });
  ledger.observe({
    registry: {
      characters: [
        { name: 'Merchant', ctype: 'merchant', stateConfidence: 1, inventory: [{ index: 0, name: 'ringsj', level: 0, q: 1 }] },
        { name: 'Ranger1', ctype: 'ranger', stateConfidence: 1, inventory: [{ index: 0, name: 'ringsj', level: 0, q: 1 }] },
        { name: 'Ranger2', ctype: 'ranger', stateConfidence: 1, inventory: [{ index: 0, name: 'ringsj', level: 0, q: 1 }] }
      ]
    },
    gameData: {
      items: { ringsj: { type: 'ring', g: 24000, compound: { dex: 1 } } }
    },
    liveCharacter: { name: 'Merchant', isize: 42, items: [{ name: 'ringsj', level: 0, q: 1 }] }
  });

  assert.notEqual(ledger.get('Merchant', 0).disposition, 'RESERVE_COMPOUND');
  assert.notEqual(ledger.get('Ranger1', 0).disposition, 'RESERVE_COMPOUND');
  assert.notEqual(ledger.get('Ranger2', 0).disposition, 'RESERVE_COMPOUND');
});

test('compound levels contribute their real stat gains to party gear scoring', () => {
  const meta = {
    type: 'ring',
    int: 1,
    str: 1,
    dex: 1,
    resistance: 5,
    compound: { int: 1, str: 1, dex: 1, resistance: 5 }
  };
  const base = scoreItem(meta, 0, 'ranger');
  const plusOne = scoreItem(meta, 1, 'ranger');
  assert.ok(plusOne.total > base.total);
  assert.ok(plusOne.survival > base.survival);
});

test('stale persisted gear goals do not reserve new live inventory', () => {
  let now = 1000;
  const evaluator = new GearProgressionEvaluator({ now: () => now });
  evaluator.goals.set('stale', {
    id: 'stale',
    character: 'Ranger1',
    ctype: 'ranger',
    slot: 'ring1',
    sourceCharacter: 'Merchant',
    item: 'ringsj',
    observedLevel: 1,
    targetLevel: 1,
    improvement: 10,
    survivalImprovement: 2,
    lastSeenAt: 900
  });

  const result = evaluator.evaluate({
    registry: { characters: [{ name: 'Merchant', ctype: 'merchant', inventory: [], gear: {} }] },
    gameData: { items: { ringsj: { type: 'ring', g: 24000, compound: { dex: 1 } } } },
    contentDrift: { requiresRevalidation: () => false }
  });

  assert.equal(result.goals.some((goal) => goal.id === 'stale'), true);
  assert.equal(result.currentGoals.some((goal) => goal.id === 'stale'), false);
  assert.equal(result.reservations.some((row) => row.goalIds.includes('stale')), false);
  assert.equal(result.status.lastEvaluation.activeGoals, 0);
  assert.equal(result.status.lastEvaluation.persistedGoals, 1);
});

test('Alpha27 lifecycle classifies progression before BANK and disposes only processed low-value results', () => {
  const ledger = makeLedger([]);
  const gameData = {
    items: {
      ringsj: { type: 'ring', g: 24000, compound: { dex: 1 }, grades: [] },
      sword: { type: 'weapon', g: 1000, upgrade: { attack: 1 }, grades: [] },
      expensiveRing: { type: 'ring', g: 1500000, compound: { dex: 1 }, grades: [] }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData });
  new Alpha27CombatMerchantConvergence(runtime, {
    keepValue: 1000000,
    compoundValueCap: 500000,
    upgradeValueCap: 2000000
  });

  const ringSet = new Map([['ringsj:0', 3]]);
  const singleRing = new Map([['ringsj:0', 1]]);
  const processedRing = new Map([['ringsj:1', 1]]);

  const set = ledger._baseDisposition({ name: 'ringsj', level: 0 }, gameData, runtime.contentDrift, ringSet);
  assert.equal(set.disposition, 'RESERVE_COMPOUND');

  const waiting = ledger._baseDisposition({ name: 'ringsj', level: 0 }, gameData, runtime.contentDrift, singleRing);
  assert.equal(waiting.disposition, 'KEEP');
  assert.ok(waiting.reasons.includes('AUTONOMOUS_COMPOUND_ACCUMULATION'));

  const result = ledger._baseDisposition({ name: 'ringsj', level: 1 }, gameData, runtime.contentDrift, processedRing);
  assert.equal(result.disposition, 'SELL');
  assert.ok(result.reasons.includes('AUTONOMOUS_PROCESSED_GEAR_SELL'));
  assert.ok(result.reasons.includes('AUTONOMOUS_COMPOUND_RESULT'));

  const upgrade = ledger._baseDisposition({ name: 'sword', level: 0 }, gameData, runtime.contentDrift, new Map([['sword:0', 1]]));
  assert.equal(upgrade.disposition, 'RESERVE_UPGRADE');
  assert.ok(upgrade.reasons.includes('AUTONOMOUS_ECONOMIC_UPGRADE'));

  const upgraded = ledger._baseDisposition({ name: 'sword', level: 1 }, gameData, runtime.contentDrift, new Map([['sword:1', 1]]));
  assert.equal(upgraded.disposition, 'SELL');
  assert.ok(upgraded.reasons.includes('AUTONOMOUS_UPGRADE_RESULT'));

  const expensive = ledger._baseDisposition({ name: 'expensiveRing', level: 1 }, gameData, runtime.contentDrift, new Map([['expensiveRing:1', 1]]));
  assert.equal(expensive.disposition, 'BANK');
});

test('economic upgrade fallback is atomic and cannot masquerade as an arbitrary upgrade', () => {
  const engine = makeEngine();
  const controlledMerchant = makeControlledMerchant();
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map: 'main',
      x: 0,
      y: 0,
      gold: 2000000,
      target: null,
      isize: 42,
      items: [{ name: 'sword', level: 0 }, { name: 'scroll0', level: 0, q: 1 }]
    },
    parent: { entities: {} }
  };
  const ledger = makeLedger([{
    character: 'Merchant',
    index: 0,
    name: 'sword',
    level: 0,
    disposition: 'RESERVE_UPGRADE',
    reasons: ['AUTONOMOUS_ECONOMIC_UPGRADE']
  }]);
  const gameData = {
    items: {
      sword: { type: 'weapon', g: 1000, upgrade: { attack: 1 }, grades: [] },
      scroll0: { type: 'scroll', g: 100 }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ root, ledger, engine, controlledMerchant, gameData, gearGoals: [] });
  const convergence = new Alpha27CombatMerchantConvergence(runtime, { verifyAttempts: 1, verifyDelayMs: 25 });
  controlledMerchant.configure({ enabled: true, ack: 'CONTROLLED_CANARY', sell: true, bank: true, upgrade: true, compound: true });

  const request = convergence._planUpgrade();
  assert.equal(request.type, 'UPGRADE');
  assert.equal(request.metadata.economicLifecycle, true);
  assert.equal(request.metadata.targetLevel, 1);

  const planned = engine.planAtomic(request, { ledger });
  assert.equal(planned.accepted, true);
  const check = convergence.atomic.atomicPreflight(engine.get(planned.transaction.id));
  assert.equal(check.ok, true);
  assert.equal(check.goal, null);
  assert.equal(check.economicLifecycle, true);

  const forged = engine.get(planned.transaction.id);
  forged.metadata = { economicLifecycle: true, targetLevel: 2 };
  const rejected = convergence.atomic.atomicPreflight(forged);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'ECONOMIC_UPGRADE_SCOPE_INVALID');
});

test('processed gear SELL waits for a fresh party gear evaluation and an empty Farmer claim set', () => {
  const ledger = makeLedger([{
    character: 'Merchant',
    index: 0,
    name: 'ringsj',
    level: 1,
    observedAt: 100,
    disposition: 'SELL',
    reasons: ['AUTONOMOUS_PROCESSED_GEAR_SELL', 'AUTONOMOUS_COMPOUND_RESULT']
  }]);
  const runtime = makeRuntime({
    ledger,
    gameData: { items: { ringsj: { type: 'ring', g: 24000, compound: { dex: 1 } } }, monsters: {}, maps: {} }
  });

  let evaluatedAt = 99;
  let goals = [];
  runtime.gearProgression = {
    status: () => ({ lastEvaluatedAt: evaluatedAt }),
    list: () => goals.map((row) => ({ ...row }))
  };
  const convergence = new Alpha27CombatMerchantConvergence(runtime);

  assert.equal(convergence._planSellOrBank(), null);

  evaluatedAt = 100;
  goals = [{
    id: 'goal-r1',
    sourceCharacter: 'Merchant',
    character: 'Ranger1',
    item: 'ringsj',
    observedLevel: 1,
    targetLevel: 1,
    projectedUpgradeRequired: false
  }];
  assert.equal(convergence._planSellOrBank(), null);

  goals = [];
  const sell = convergence._planSellOrBank();
  assert.equal(sell.type, 'SELL');
  assert.equal(sell.metadata.lifecycleProcessedSale, true);
  assert.equal(sell.metadata.gearEvaluationAt, 100);
});

test('ControlledMerchant permits only explicitly lifecycle-authorized processed gear sale', async () => {
  const engine = new EconomyTransactionEngine({ now: () => 1000 });
  const entry = {
    key: 'Merchant:0',
    character: 'Merchant',
    index: 0,
    name: 'ringsj',
    level: 1,
    q: 1,
    disposition: 'SELL',
    reasons: ['AUTONOMOUS_PROCESSED_GEAR_SELL', 'AUTONOMOUS_COMPOUND_RESULT'],
    actionAuthority: false
  };
  const ledger = {
    status: () => ({ stale: false, actionAuthority: false }),
    get: (name, index) => name === 'Merchant' && index === 0 ? { ...entry } : null
  };
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      isize: 42,
      items: [{ name: 'ringsj', level: 1, q: 1 }],
      gold: 100,
      rip: false
    },
    parent: { entities: {} },
    G: {
      items: {
        ringsj: {
          type: 'ring',
          g: 24000,
          compound: { int: 1, str: 1, dex: 1, resistance: 5 },
          grades: []
        }
      }
    },
    sell: async (index) => {
      root.character.items[index] = null;
      root.character.gold += 100;
      return { success: true };
    }
  };

  const planned = engine.plan({
    type: 'SELL',
    character: 'Merchant',
    index: 0,
    quantity: 1,
    metadata: { lifecycleProcessedSale: true }
  }, { ledger });
  assert.equal(planned.accepted, true);

  const executor = new ControlledMerchantExecutor({
    root,
    engine,
    ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });

  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.executed, true);
  assert.equal(result.committed, true);
  assert.equal(root.character.items[0], null);
  assert.equal(executor.status().sellSafety.processedGearHardProtectionRetained, true);
});

test('Merchant status publishes the enforced lifecycle order', () => {
  const runtime = makeRuntime({ ledger: makeLedger([]), gameData: { items: {}, monsters: {}, maps: {} } });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  assert.deepEqual(
    convergence.merchant.status().itemLifecycleOrder,
    ['COMPOUND', 'UPGRADE', 'GEAR_DELIVERY', 'SELL', 'BANK']
  );
});
