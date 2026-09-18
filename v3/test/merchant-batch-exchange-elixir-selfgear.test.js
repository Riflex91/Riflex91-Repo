'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('../src/merchant/controlled-merchant-production-executor');
const { planElixirAcquisition, preferredAcquisitionElixir, activeElixir } = require('../src/party/elixir-policy');
const { MerchantSelfGear } = require('../src/reliability/merchant-self-gear');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeEngine, makeLedger, makeRuntime } = require('./alpha27-convergence-test-helpers');

// Integrated live regression coverage for alpha.20.94 Merchant economy behavior.
test('default mutation risk budget is the requested 10x experiment', () => {
  const runtime = makeRuntime({ gameData: { items: {}, monsters: {}, maps: {} } });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  const risk = convergence.merchant.status().risk;
  assert.equal(risk.maxUpgradeAttemptsPerWindow, 30);
  assert.equal(risk.maxCompoundAttemptsPerWindow, 20);
  assert.equal(risk.mutationAttemptWindowMs, 60 * 60 * 1000);
});

test('scroll batching counts the currently actionable compound backlog', () => {
  const entries = [];
  for (let index = 0; index < 9; index += 1) {
    entries.push({
      key: `Merchant:${index}`,
      character: 'Merchant',
      index,
      name: 'ringsj',
      level: 0,
      q: 1,
      disposition: 'RESERVE_COMPOUND',
      actionAuthority: false
    });
  }
  const ledger = makeLedger(entries);
  const runtime = makeRuntime({
    ledger,
    engine: makeEngine(),
    gameData: {
      items: {
        ringsj: { type: 'ring', g: 1000, compound: { dex: 1 }, grades: [] },
        cscroll0: { type: 'cscroll', g: 5000 }
      },
      monsters: {},
      maps: {}
    }
  });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  const batch = convergence.atomic.plannedScrollDemand('cscroll0');
  assert.equal(batch.quantity, 3);
  assert.equal(batch.groups[0].operations, 3);
  assert.equal(batch.groups[0].actionable, 3);
});

test('NPC exchange planning is demand-driven and uses exact G.items e requirement', () => {
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 0 });
  const input = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      gold: 1000,
      items: [{ index: 0, name: 'seashell', level: 0, q: 20 }],
      bank: {}
    },
    gameData: {
      items: {
        seashell: { type: 'material', e: 20, quest: 'shells' }
      }
    },
    exchangeDemands: []
  };

  assert.equal(planner.planExchange(input, {}), null);

  input.exchangeDemands = [{ item: 'seashell', target: 'elixirdex0', expiresAt: 2000 }];
  const plan = planner.planExchange(input, {});
  assert.equal(plan.state, 'READY');
  assert.equal(plan.nextStep.kind, ProductionStepKind.EXCHANGE);
  assert.equal(plan.nextStep.quantity, 20);
  assert.equal(plan.nextStep.destination, 'shells');
  assert.equal(plan.costStrategy, 'EXCHANGE_EXACT_REQUIREMENT_V2_DEMAND_DRIVEN');
});

test('controlled production executor verifies an NPC exchange input delta', async () => {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      gold: 1000,
      items: [{ name: 'seashell', level: 0, q: 20 }]
    },
    G: { items: { seashell: { e: 20, quest: 'shells' } } },
    localStorage: { getItem() { return null; }, setItem() {} },
    exchange: async (index) => {
      root.character.items[index] = null;
      return { success: true, reward: 'elixirdex0' };
    }
  };
  const executor = new ControlledMerchantProductionExecutor({
    root,
    now: () => 1000,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getEconomyEmergency: () => false,
    verifyDelayMs: 0,
    verifyAttempts: 1,
    goldReserve: 0
  });
  executor.configure({
    enabled: true,
    ack: CONTROLLED_MERCHANT_PRODUCTION_ACK,
    allowExchange: true
  });
  const plan = { id: 'exchange-plan', target: { output: 'elixirdex0' } };
  const step = {
    kind: ProductionStepKind.EXCHANGE,
    name: 'seashell',
    level: 0,
    inventoryIndex: 0,
    quantity: 20,
    destination: 'shells'
  };
  const result = await executor.execute(plan, step);
  assert.equal(result.executed, true);
  assert.equal(result.committed, true);
  assert.equal(executor.status().stats.exchanges, 1);
});

test('elixir policy prefers efficient class stat buff and can justify farming exchange material', () => {
  const gameData = {
    items: {
      seashell: { type: 'material', e: 20, quest: 'shells' },
      elixirdex0: { type: 'elixir', dex: 4, duration: 24, g: 20000 },
      elixirdex1: { type: 'elixir', dex: 6, duration: 48, g: 1000000 }
    },
    drops: {
      monsters: {
        goo: [[0.5, 'seashell', 1]]
      },
      seashell: [[1, 'elixirdex0', 1]]
    },
    maps: {
      main: { monsters: [{ type: 'goo', boundary: [0, 0, 100, 100] }] }
    }
  };
  const runtime = {
    adapter: { getGameData: () => gameData },
    world: {
      performance: new Map([
        ['profile', { monster: 'goo', seconds: 3600, kills: 100 }]
      ])
    }
  };
  const preferred = preferredAcquisitionElixir(gameData, 'ranger');
  assert.equal(preferred.name, 'elixirdex0');

  const plan = planElixirAcquisition(runtime, 'ranger', { maxFarmHours: 2, minUtilityPerFarmHour: 1 });
  assert.equal(plan.worthwhile, true);
  assert.equal(plan.farm.kind, 'EXCHANGE_MATERIAL_DROP');
  assert.equal(plan.farm.material, 'seashell');
  assert.equal(plan.farm.monster, 'goo');
  assert.ok(plan.farm.expectedHours < 1);
});

test('active elixir remains valid until its real expires timestamp', () => {
  const now = Date.parse('2026-09-18T15:00:00.000Z');
  const state = activeElixir({
    slots: {
      elixir: {
        name: 'elixirdex0',
        expires: new Date(now + 60 * 60 * 1000).toISOString()
      }
    }
  }, now);
  assert.equal(state.active, true);
  assert.equal(state.name, 'elixirdex0');
  assert.equal(state.remainingMs, 60 * 60 * 1000);
});

test('Merchant self-gear only starts when a fallback remains available', () => {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      isize: 8,
      items: [
        { index: 0, name: 'ringsj', level: 0 },
        { index: 1, name: 'ringsj', level: 0 },
        { index: 2, name: 'ringofluck', level: 0 },
        null, null, null, null, null
      ],
      slots: {
        ring1: { name: 'ringsj', level: 0 }
      }
    },
    G: {
      items: {
        ringsj: { type: 'ring', g: 1000, compound: { dex: 1 }, grades: [] },
        ringofluck: { type: 'ring', g: 500, compound: { luck: 1 }, grades: [] }
      }
    },
    localStorage: { getItem() { return null; }, setItem() {} }
  };
  const runtime = {
    root,
    adapter: { getGameData: () => root.G },
    inventoryLedger: { status: () => ({ stale: false }), get() { return null; } }
  };
  const atomic = {
    mutationAttemptBudget: () => ({ allowed: true, remaining: 20 }),
    verifyEventually: async () => true
  };
  const manager = new MerchantSelfGear(runtime, atomic, {
    now: () => 1000,
    log: { emit() {} },
    options: {
      maxUpgradeLevel: 7,
      maxCompoundLevel: 10,
      upgradeValueCap: 2000000,
      compoundValueCap: 500000
    }
  });
  const candidate = manager._candidate();
  assert.equal(candidate.type, 'COMPOUND');
  assert.equal(candidate.name, 'ringsj');
  assert.equal(candidate.fallback.name, 'ringofluck');

  root.character.items[2] = null;
  assert.equal(manager._candidate(), null);
});

test('Merchant self-gear upgrades a spare first without unequipping the live item', () => {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      isize: 5,
      items: [{ index: 0, name: 'sword', level: 0 }, null, null, null, null],
      slots: { mainhand: { name: 'sword', level: 0 } }
    },
    G: {
      items: { sword: { type: 'weapon', g: 1000, upgrade: { attack: 1 }, grades: [] } }
    },
    localStorage: { getItem() { return null; }, setItem() {} }
  };
  const runtime = { root, adapter: { getGameData: () => root.G } };
  const manager = new MerchantSelfGear(runtime, {
    mutationAttemptBudget: () => ({ allowed: true, remaining: 30 }),
    verifyEventually: async () => true
  }, {
    now: () => 1000,
    log: { emit() {} },
    options: { maxUpgradeLevel: 7, maxCompoundLevel: 10, upgradeValueCap: 2000000, compoundValueCap: 500000 }
  });
  const candidate = manager._candidate();
  assert.equal(candidate.type, 'UPGRADE');
  assert.equal(candidate.usesSpare, true);
  assert.equal(candidate.fallback.equipped, true);
});

test('Merchant self-gear upgrades speed-gaining equipment before non-speed equipment', () => {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      isize: 8,
      items: [
        { index: 0, name: 'sword', level: 0 },
        { index: 1, name: 'speedshoes', level: 3 },
        null, null, null, null, null, null
      ],
      slots: {
        mainhand: { name: 'sword', level: 0 },
        shoes: { name: 'speedshoes', level: 3 }
      }
    },
    G: {
      items: {
        sword: { type: 'weapon', g: 1000, attack: 100, upgrade: { attack: 100 }, grades: [] },
        speedshoes: { type: 'shoes', g: 1000, speed: 5, upgrade: { speed: 1 }, grades: [] }
      }
    },
    localStorage: { getItem() { return null; }, setItem() {} }
  };
  const runtime = { root, adapter: { getGameData: () => root.G } };
  const manager = new MerchantSelfGear(runtime, {
    mutationAttemptBudget: () => ({ allowed: true, remaining: 30 }),
    verifyEventually: async () => true
  }, {
    now: () => 1000,
    log: { emit() {} },
    options: { maxUpgradeLevel: 7, maxCompoundLevel: 10, upgradeValueCap: 2000000, compoundValueCap: 500000 }
  });

  const candidate = manager._candidate();
  assert.equal(candidate.slot, 'shoes');
  assert.equal(candidate.name, 'speedshoes');
  assert.equal(candidate.speedGain, 1);
  assert.equal(manager.status().primaryStat, 'speed');
  assert.equal(manager.status().speedPriority, 'NEXT_LEVEL_SPEED_GAIN_FIRST');
});

// Live alpha.20.113 regression: WAIT_LEDGER must not masquerade as task progress.
test('Merchant self-gear WAIT_LEDGER reports no progress while live inputs or ledger state are not executable', async () => {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      isize: 5,
      items: [{ index: 0, name: 'ringsj', level: 0 }, { index: 1, name: 'ringsj', level: 0 }, null, null, null],
      slots: { ring1: { name: 'ringsj', level: 0 } }
    },
    G: { items: { ringsj: { type: 'ring', g: 1000, compound: { dex: 1 }, grades: [] } } },
    localStorage: { getItem() { return null; }, setItem() {} }
  };
  const runtime = {
    root,
    adapter: { getGameData: () => root.G },
    inventoryLedger: { status: () => ({ stale: false }), get: () => null }
  };
  const manager = new MerchantSelfGear(runtime, {
    mutationAttemptBudget: () => ({ allowed: true, remaining: 20 }),
    verifyEventually: async () => true
  }, {
    now: () => 1000,
    log: { emit() {} },
    options: { maxUpgradeLevel: 7, maxCompoundLevel: 10, upgradeValueCap: 2000000, compoundValueCap: 500000 }
  });

  manager.session = {
    schemaVersion: 1,
    id: 'selfgear-waiting',
    startedAt: 900,
    updatedAt: 900,
    stage: 'WAIT_LEDGER',
    character: 'Merchant',
    slot: 'ring1',
    type: 'COMPOUND',
    name: 'ringsj',
    level: 0,
    usesSpare: false
  };

  assert.equal(await manager.cycle(), false);
  assert.equal(manager.session.stage, 'WAIT_LEDGER');
  assert.equal(runtime.merchantSelfGearReservation, undefined);
});

test('Merchant self-gear rejected atomic plan reports no progress instead of pinning progression', async () => {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      isize: 4,
      items: [{ index: 0, name: 'sword', level: 0 }, null, null, null],
      slots: { mainhand: { name: 'sword', level: 0 } }
    },
    G: { items: { sword: { type: 'weapon', g: 1000, upgrade: { attack: 1 }, grades: [] } } },
    localStorage: { getItem() { return null; }, setItem() {} }
  };
  const runtime = {
    root,
    adapter: { getGameData: () => root.G },
    inventoryLedger: {
      status: () => ({ stale: false }),
      get: () => ({ character: 'Merchant', index: 0, name: 'sword', level: 0, disposition: 'KEEP' })
    },
    transactionEngine: { planAtomic: () => ({ accepted: false, reason: 'LEDGER_DISPOSITION_NOT_AUTHORIZED' }) },
    lastSnapshot: {}
  };
  const manager = new MerchantSelfGear(runtime, {
    mutationAttemptBudget: () => ({ allowed: true, remaining: 30 }),
    verifyEventually: async () => true
  }, {
    now: () => 1000,
    log: { emit() {} },
    options: { maxUpgradeLevel: 7, maxCompoundLevel: 10, upgradeValueCap: 2000000, compoundValueCap: 500000 }
  });

  manager.session = {
    schemaVersion: 1,
    id: 'selfgear-rejected',
    startedAt: 900,
    updatedAt: 900,
    stage: 'WAIT_LEDGER',
    character: 'Merchant',
    slot: 'mainhand',
    type: 'UPGRADE',
    name: 'sword',
    level: 0,
    usesSpare: true
  };

  assert.equal(await manager.cycle(), false);
  assert.equal(manager.session.stage, 'WAIT_LEDGER');
  assert.equal(runtime.merchantSelfGearReservation, null);
});

test('exact self-gear reservation can authorize a non-progression ledger disposition but nothing broader', () => {
  const ledger = makeLedger([{
    key: 'Merchant:0',
    character: 'Merchant',
    index: 0,
    name: 'sword',
    level: 2,
    q: 1,
    disposition: 'BANK',
    actionAuthority: false
  }]);
  const runtime = makeRuntime({
    ledger,
    engine: makeEngine(),
    gameData: {
      items: { sword: { type: 'weapon', g: 1000, upgrade: { attack: 1 }, grades: [] } },
      monsters: {},
      maps: {}
    }
  });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  runtime.merchantSelfGearReservation = {
    sessionId: 'self-1',
    type: 'UPGRADE',
    slot: 'mainhand',
    character: 'Merchant',
    item: 'sword',
    level: 2,
    indices: [0]
  };
  const accepted = runtime.transactionEngine.planAtomic({
    type: 'UPGRADE',
    character: 'Merchant',
    indices: [0],
    metadata: { selfGear: true, selfGearSessionId: 'self-1', selfGearSlot: 'mainhand' }
  }, { ledger });
  assert.equal(accepted.accepted, true);

  const acceptedRow = runtime.transactionEngine.transactions.get(accepted.transaction.id);
  runtime.transactionEngine._release(acceptedRow);
  runtime.transactionEngine.transactions.delete(accepted.transaction.id);
  const rejected = runtime.transactionEngine.planAtomic({
    type: 'UPGRADE',
    character: 'Merchant',
    indices: [0],
    metadata: { selfGear: true, selfGearSessionId: 'wrong', selfGearSlot: 'mainhand' }
  }, { ledger });
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, 'LEDGER_DISPOSITION_NOT_AUTHORIZED');
});
