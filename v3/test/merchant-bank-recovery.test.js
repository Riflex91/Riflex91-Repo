'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { Alpha27BankRecovery } = require('../src/reliability/alpha27-bank-recovery');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeLedger, makeRuntime } = require('./alpha27-convergence-test-helpers');

function recoveryFixture({
  inventory = [],
  bank = { items0: [] },
  items = {},
  map = 'bank',
  now = 1000
} = {}) {
  let clock = now;
  const persisted = new Map();
  const root = {
    localStorage: {
      getItem(key) { return persisted.has(key) ? persisted.get(key) : null; },
      setItem(key, value) { persisted.set(key, String(value)); }
    },
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map,
      x: 0,
      y: 0,
      gold: 5000000,
      rip: false,
      isize: 12,
      items: inventory.slice(),
      bank
    },
    parent: { entities: {} },
    G: { items, monsters: {}, maps: {} },
    bank_retrieve: async (pack, index) => {
      const item = root.character.bank[pack][index];
      root.character.bank[pack][index] = null;
      let slot = root.character.items.findIndex((row) => !row);
      if (slot < 0) slot = root.character.items.length;
      root.character.items[slot] = item;
      return { success: true, place: 'bank', bank_action: 'retrieve' };
    }
  };
  const runtime = {
    root,
    now: () => clock,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    contentDrift: { requiresRevalidation: () => false },
    inventoryLedger: { status: () => ({ stale: false, workspaceSlots: 3 }) },
    _alpha20EconomyEmergency: () => false
  };
  const atomic = {
    merchantBusy: false,
    namedServiceTravel: async () => {
      root.character.map = 'bank';
      root.character.bank = bank;
      return { ok: true };
    }
  };
  const shared = {
    now: runtime.now,
    log: runtime.log,
    options: {
      goldReserve: 1000000,
      keepValue: 1000000,
      compoundValueCap: 500000,
      upgradeValueCap: 2000000,
      maxCompoundLevel: 10,
      maxUpgradeLevel: 7,
      bankRecoveryProbeIntervalMs: 300000,
      bankRecoveryFailureRetryMs: 30000
    }
  };
  return {
    root,
    runtime,
    atomic,
    shared,
    setNow(value) { clock = value; }
  };
}

test('bank recovery retrieves exactly one missing ring to complete a local compound set', async () => {
  const fx = recoveryFixture({
    inventory: [
      { name: 'ringsj', level: 0, q: 1 },
      { name: 'ringsj', level: 0, q: 1 },
      null
    ],
    bank: { items0: [{ name: 'ringsj', level: 0, q: 1 }] },
    items: {
      ringsj: { type: 'ring', g: 24000, compound: { dex: 1 }, grades: [] }
    }
  });
  const recovery = new Alpha27BankRecovery(fx.runtime, fx.atomic, fx.shared);

  const plan = recovery.plan();
  assert.equal(plan.action, 'RETRIEVE');
  assert.equal(plan.reason, 'COMPOUND_SET_COMPLETION');
  assert.equal(plan.candidate.row.name, 'ringsj');
  assert.equal(plan.candidate.neededForSet, 1);

  assert.equal(await recovery.execute(plan), true);
  assert.equal(fx.root.character.bank.items0[0], null);
  assert.equal(fx.root.character.items.filter((row) => row && row.name === 'ringsj').length, 3);
  assert.equal(recovery.status().stats.retrievesCommitted, 1);
});

test('bank recovery keeps incomplete level-zero compound fragments in bank', () => {
  const fx = recoveryFixture({
    inventory: [],
    bank: { items0: [{ name: 'ringsj', level: 0, q: 1 }] },
    items: {
      ringsj: { type: 'ring', g: 24000, compound: { dex: 1 }, grades: [] }
    }
  });
  const recovery = new Alpha27BankRecovery(fx.runtime, fx.atomic, fx.shared);
  assert.equal(recovery.plan(), null);
  assert.equal(recovery.status().stats.skippedIncompleteCompoundSet >= 1, true);
});

test('bank recovery refuses high-value progression items', () => {
  const fx = recoveryFixture({
    inventory: [{ name: 'raregear', level: 0, q: 1 }, { name: 'raregear', level: 0, q: 1 }],
    bank: { items0: [{ name: 'raregear', level: 0, q: 1 }] },
    items: {
      raregear: { type: 'ring', g: 1500000, compound: { dex: 5 }, grades: [] }
    }
  });
  const recovery = new Alpha27BankRecovery(fx.runtime, fx.atomic, fx.shared);
  assert.equal(recovery.plan(), null);
  assert.equal(recovery.status().stats.skippedHighValue >= 1, true);
});

test('bank recovery travels to bank only when the bounded probe is due', async () => {
  const bank = { items0: [] };
  const fx = recoveryFixture({ inventory: [], bank, items: {}, map: 'main', now: 1000 });
  fx.root.character.bank = null;
  const recovery = new Alpha27BankRecovery(fx.runtime, fx.atomic, fx.shared);

  const first = recovery.plan();
  assert.equal(first.action, 'TRAVEL_BANK');
  assert.equal(await recovery.execute(first), true);
  assert.equal(recovery.status().stats.bankTravels, 1);

  fx.root.character.bank = null;
  fx.root.character.map = 'main';
  fx.setNow(2000);
  assert.equal(recovery.plan(), null);
});

// Live regression: ringsj had the largest ready backlog but was starved by lexical group selection.
test('compound planner drains largest backlog first so rings cannot starve behind belts', () => {
  const entries = [];
  let index = 0;
  for (const [name, count] of [['hpbelt', 6], ['hpamulet', 6], ['ringsj', 9]]) {
    for (let i = 0; i < count; i += 1) {
      entries.push({
        character: 'Merchant',
        index: index++,
        name,
        level: 0,
        disposition: 'RESERVE_COMPOUND'
      });
    }
  }
  const ledger = makeLedger(entries);
  const gameData = {
    items: {
      hpbelt: { g: 10000, compound: { hp: 10 }, grades: [] },
      hpamulet: { g: 10000, compound: { hp: 10 }, grades: [] },
      ringsj: { g: 10000, compound: { dex: 1 }, grades: [] }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);

  const request = convergence._planCompound();
  assert.equal(request.type, 'COMPOUND');
  assert.equal(request.metadata.compoundIdentity, 'ringsj:0');
  assert.equal(request.metadata.completeSetsBefore, 3);
});

test('compound planner rotates equal backlogs instead of repeating one identity forever', () => {
  const entries = [];
  let index = 0;
  for (const [name, count] of [['hpbelt', 3], ['ringsj', 3]]) {
    for (let i = 0; i < count; i += 1) {
      entries.push({
        character: 'Merchant',
        index: index++,
        name,
        level: 0,
        disposition: 'RESERVE_COMPOUND'
      });
    }
  }
  const ledger = makeLedger(entries);
  const gameData = {
    items: {
      hpbelt: { g: 10000, compound: { hp: 10 }, grades: [] },
      ringsj: { g: 10000, compound: { dex: 1 }, grades: [] }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);

  const first = convergence._planCompound();
  const second = convergence._planCompound();
  assert.equal(first.metadata.compoundIdentity, 'hpbelt:0');
  assert.equal(second.metadata.compoundIdentity, 'ringsj:0');
});
