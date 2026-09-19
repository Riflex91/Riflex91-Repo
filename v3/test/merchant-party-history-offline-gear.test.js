'use strict';

// CI anchor: runtime bundles are generated from source; this test-only comment intentionally leaves them unchanged.

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantPartyHistory } = require('../src/party/merchant-party-history');
const { GearProgressionEvaluator } = require('../src/economy/gear-progression');
const { InventoryLedger } = require('../src/economy/inventory-ledger');
const { Alpha27BankRecovery } = require('../src/reliability/alpha27-bank-recovery');

function memoryStorage() {
  const data = {};
  return {
    data,
    get: (key) => data[key] || null,
    set: (key, value) => { data[key] = value; return true; }
  };
}

function gameData() {
  return {
    items: {
      coat1: {
        type: 'chest',
        armor: 35,
        resistance: 12,
        g: 12000,
        upgrade: { armor: 5, resistance: 2 },
        grades: []
      }
    },
    monsters: {},
    maps: {}
  };
}

function merchantRow() {
  return {
    name: 'My_Merchant',
    ctype: 'merchant',
    level: 56,
    stateConfidence: 1,
    inventory: [{ index: 0, name: 'coat1', level: 3, q: 1 }],
    gear: {}
  };
}

function warriorRow(extra = {}) {
  return {
    name: 'My_Warrior',
    ctype: 'warrior',
    level: 12,
    stateConfidence: 1,
    inventory: [],
    gear: {},
    ...extra
  };
}

test('Merchant party history persists only trusted characters actually observed in the party', () => {
  const storage = memoryStorage();
  let now = 1000;
  const history = new MerchantPartyHistory({
    storage,
    now: () => now,
    saveIntervalMs: 5000,
    log: { emit() {} }
  });

  const changed = history.observe({
    merchantName: 'My_Merchant',
    partyNames: ['My_Merchant', 'My_Warrior', 'Stranger'],
    trustedNames: ['My_Merchant', 'My_Warrior'],
    registry: {
      characters: [
        merchantRow(),
        warriorRow({ gear: { helmet: { name: 'helmet', level: 2 } } }),
        { name: 'Stranger', ctype: 'mage', level: 80, gear: {}, inventory: [] }
      ]
    }
  });

  assert.equal(changed, true);
  assert.equal(history.status().rememberedMembers, 1);
  assert.equal(history.get('Stranger'), null);
  assert.equal(history.get('My_Warrior').gear.helmet.level, 2);
  assert.equal(history.status().stats.rejectedUntrusted, 1);

  history.save({ force: true });
  now += 10000;
  const restored = new MerchantPartyHistory({ storage, now: () => now, log: { emit() {} } });
  assert.equal(restored.status().rememberedMembers, 1);
  const offline = restored.planningRows({
    currentPartyNames: ['My_Merchant'],
    registry: { characters: [merchantRow()] }
  });
  assert.equal(offline.length, 1);
  assert.equal(offline[0].name, 'My_Warrior');
  assert.equal(offline[0].rememberedOffline, true);
  assert.deepEqual(offline[0].inventory, [], 'history must never create stale physical inventory authority');
});

test('offline remembered Farmer upgrade is banked, then becomes live progression again after party return', () => {
  const evaluator = new GearProgressionEvaluator({
    now: () => 2000,
    minImprovementRatio: 0.01,
    maxProbeLevel: 5
  });
  const offlineWarrior = warriorRow({
    rememberedOffline: true,
    rememberedPartyMember: true,
    presence: 'REMEMBERED_OFFLINE',
    online: false,
    available: false,
    lastPartyAt: 1500
  });
  const offlineRegistry = { characters: [merchantRow(), offlineWarrior] };

  const offlineEvaluation = evaluator.evaluate({
    registry: offlineRegistry,
    gameData: gameData(),
    contentDrift: { requiresRevalidation: () => false }
  });
  const offlineGoal = offlineEvaluation.currentGoals.find((goal) => goal.character === 'My_Warrior' && goal.item === 'coat1');
  assert.ok(offlineGoal);
  assert.equal(offlineGoal.targetOffline, true);
  assert.equal(offlineGoal.bankUntilPartyReturn, true);
  const offlineReservation = offlineEvaluation.reservations.find((row) => row.goalIds.includes(offlineGoal.id));
  assert.ok(offlineReservation);
  assert.equal(offlineReservation.bankUntilPartyReturn, true);
  assert.equal(offlineReservation.targetCharacter, 'My_Warrior');

  const ledger = new InventoryLedger({ now: () => 2000 });
  ledger.setProgressionReservations(offlineEvaluation.reservations);
  ledger.observe({
    registry: { characters: [merchantRow()] },
    gameData: gameData(),
    contentDrift: { requiresRevalidation: () => false },
    liveCharacter: { name: 'My_Merchant', isize: 42, items: [{ name: 'coat1', level: 3, q: 1 }] }
  });
  const banked = ledger.get('My_Merchant', 0);
  assert.equal(banked.disposition, 'BANK');
  assert.ok(banked.reasons.includes('OFFLINE_PARTY_GEAR_RESERVE'));
  assert.equal(banked.reservation.targetCharacter, 'My_Warrior');

  const onlineEvaluation = evaluator.evaluate({
    registry: { characters: [merchantRow(), warriorRow()] },
    gameData: gameData(),
    contentDrift: { requiresRevalidation: () => false }
  });
  const onlineGoal = onlineEvaluation.currentGoals.find((goal) => goal.character === 'My_Warrior' && goal.item === 'coat1');
  assert.ok(onlineGoal);
  assert.equal(onlineGoal.targetOffline, false);
  assert.equal(onlineGoal.bankUntilPartyReturn, false);

  ledger.setProgressionReservations(onlineEvaluation.reservations);
  ledger.observe({
    registry: { characters: [merchantRow(), warriorRow()] },
    gameData: gameData(),
    contentDrift: { requiresRevalidation: () => false },
    liveCharacter: { name: 'My_Merchant', isize: 42, items: [{ name: 'coat1', level: 3, q: 1 }] }
  });
  assert.equal(ledger.get('My_Merchant', 0).disposition, 'RESERVE_PROGRESSION');
});

test('bank recovery holds remembered gear while target is absent and prioritizes it when trusted target rejoins', () => {
  let party = [{ name: 'My_Merchant' }];
  const root = {
    character: {
      name: 'My_Merchant',
      ctype: 'merchant',
      isize: 42,
      items: [],
      bank: { items0: [{ name: 'coat1', level: 3, q: 1 }] }
    },
    parent: { entities: {} },
    G: gameData()
  };
  const goal = {
    id: 'My_Warrior:chest:coat1:5',
    sourceCharacter: 'My_Merchant',
    character: 'My_Warrior',
    slot: 'chest',
    item: 'coat1',
    observedLevel: 3,
    targetLevel: 5,
    targetOffline: true,
    bankUntilPartyReturn: true,
    improvement: 50,
    survivalImprovement: 50
  };
  const runtime = {
    root,
    adapter: { mode: 'shadow' },
    lastSnapshot: { party },
    partyBootstrap: { trustedRosterNames: () => ['My_Merchant', 'My_Warrior'] },
    gearProgression: { list: () => [{ ...goal }] },
    merchantBankCatalog: { observe() { return true; } },
    contentDrift: { requiresRevalidation: () => false },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) }
  };
  const recovery = new Alpha27BankRecovery(
    runtime,
    {},
    {
      now: () => 3000,
      log: { emit() {} },
      options: {}
    }
  );

  assert.deepEqual(recovery._recoverableRows(), []);
  assert.ok(recovery.status().stats.offlineGearReservationsHeld >= 1);

  party = [{ name: 'My_Merchant' }, { name: 'My_Warrior' }];
  runtime.lastSnapshot = { party };
  const candidates = recovery._recoverableRows();
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].kind, 'OFFLINE_PARTY_GEAR_RETURN');
  assert.equal(candidates[0].priority, -10);
  assert.equal(candidates[0].targetName, 'My_Warrior');
  assert.equal(candidates[0].gearGoalId, goal.id);
});


test('bank recovery retrieves only the rows claimed by returning goals and leaves other offline reservations banked', () => {
  const root = {
    character: {
      name: 'My_Merchant',
      ctype: 'merchant',
      isize: 42,
      items: [],
      bank: {
        items0: [
          { name: 'coat1', level: 3, q: 1 },
          { name: 'coat1', level: 3, q: 1 }
        ]
      }
    },
    parent: { entities: {} },
    G: gameData()
  };
  const goals = [
    {
      id: 'My_Warrior:chest:coat1:5',
      sourceCharacter: 'My_Merchant',
      character: 'My_Warrior',
      slot: 'chest',
      item: 'coat1',
      observedLevel: 3,
      targetLevel: 5,
      bankUntilPartyReturn: true,
      survivalImprovement: 50,
      improvement: 50
    },
    {
      id: 'My_Rogue:chest:coat1:5',
      sourceCharacter: 'My_Merchant',
      character: 'My_Rogue',
      slot: 'chest',
      item: 'coat1',
      observedLevel: 3,
      targetLevel: 5,
      bankUntilPartyReturn: true,
      survivalImprovement: 30,
      improvement: 30
    }
  ];
  const runtime = {
    root,
    adapter: { mode: 'shadow' },
    lastSnapshot: { party: [{ name: 'My_Merchant' }, { name: 'My_Warrior' }] },
    partyBootstrap: { trustedRosterNames: () => ['My_Merchant', 'My_Warrior'] },
    gearProgression: { list: () => goals.map((row) => ({ ...row })) },
    merchantBankCatalog: { observe() { return true; } },
    contentDrift: { requiresRevalidation: () => false },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) }
  };
  const recovery = new Alpha27BankRecovery(
    runtime,
    {},
    { now: () => 4000, log: { emit() {} }, options: {} }
  );

  const candidates = recovery._recoverableRows();
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].kind, 'OFFLINE_PARTY_GEAR_RETURN');
  assert.equal(candidates[0].gearGoalId, 'My_Warrior:chest:coat1:5');
  assert.equal(candidates[0].row.index, 0);
  assert.ok(recovery.status().stats.offlineGearReservationsHeld >= 1);
});
