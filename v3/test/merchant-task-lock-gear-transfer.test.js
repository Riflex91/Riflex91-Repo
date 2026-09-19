'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantTaskCoordinator } = require('../src/merchant/merchant-task-coordinator');
const { InventoryLedger, ItemDisposition } = require('../src/economy/inventory-ledger');
const { GearProgressionEvaluator } = require('../src/economy/gear-progression');
const { ControlledPartyLogistics } = require('../src/party/controlled-party-logistics');
const { FarmerController, FarmerState } = require('../src/farmer/farmer-fsm');
const { Alpha27MerchantAutonomy } = require('../src/reliability/alpha27-merchant-autonomy');

test('Merchant task coordinator is non-preemptive across subsystem owners', () => {
  let now = 1000;
  const coordinator = new MerchantTaskCoordinator({ now: () => now, defaultLeaseMs: 60000 });
  const first = coordinator.acquire('ALPHA27', 'PROGRESSION_BATCH', 'alpha27:progression-batch', { serviceArea: 'newupgrade' });
  assert.equal(first.acquired, true);

  const blocked = coordinator.acquire('PRODUCTION', 'EXCHANGE_BATCH', 'production:exchange:seashell:elixirdex0');
  assert.equal(blocked.acquired, false);
  assert.equal(blocked.reason, 'MERCHANT_TASK_LOCKED');
  assert.equal(blocked.task.owner, 'ALPHA27');

  const continued = coordinator.acquire('ALPHA27', 'PROGRESSION_BATCH', 'alpha27:progression-batch');
  assert.equal(continued.acquired, true);
  assert.equal(continued.continued, true);

  assert.equal(coordinator.release('ALPHA27', 'alpha27:progression-batch', 'PROGRESSION_BATCH_DRAINED'), true);
  const second = coordinator.acquire('PRODUCTION', 'EXCHANGE_BATCH', 'production:exchange:seashell:elixirdex0');
  assert.equal(second.acquired, true);
});

test('rejected progression work releases the Merchant batch lease instead of pinning Production', async () => {
  const coordinator = new MerchantTaskCoordinator({ now: () => 1000, defaultLeaseMs: 600000 });
  assert.equal(coordinator.acquire('ALPHA27', 'PROGRESSION_BATCH', 'alpha27:progression-batch', { serviceArea: 'newupgrade' }).acquired, true);

  const merchant = Object.create(Alpha27MerchantAutonomy.prototype);
  merchant.stats = { autonomousMerchantCycles: 0, autonomousMerchantHolds: 0 };
  merchant.now = () => 1000;
  merchant.taskCoordinator = coordinator;
  merchant.runtime = {};
  merchant.atomic = {
    merchantActive: () => true,
    supervisorAllowed: () => true,
    merchantInCombat: () => false,
    serviceTravelBusy: false,
    merchantBusy: false
  };
  merchant.ensureAutonomousAuthorities = () => {};
  merchant.reconcileRecovering = () => false;
  merchant.activeTransaction = () => null;
  merchant.criticalPartySupplyPlan = () => null;
  merchant.restockPartyPotions = async () => false;
  merchant.progressOrDeliverFarmerGear = async () => false;
  merchant.transactionFamilyOpen = () => false;
  merchant.planCompound = () => ({ type: 'COMPOUND', character: 'Merchant', indices: [1, 2, 3] });
  merchant.planUpgrade = () => null;
  merchant.executeEconomyRequest = async () => false;
  merchant.selfGear = null;
  merchant._updateCollectionSession = () => ({ active: false });
  merchant.planSellOrBank = () => null;
  merchant.bankRecovery = null;
  merchant._event = () => {};

  const acted = await merchant.cycle();
  assert.equal(acted, false);
  assert.equal(coordinator.current(), null);
  assert.equal(merchant.stats.progressionTaskNoProgressReleases, 1);

  const production = coordinator.acquire('PRODUCTION', 'EXCHANGE_BATCH', 'production:exchange:seashell:elixirdex0');
  assert.equal(production.acquired, true);
});

// Live alpha.20.113: a passive self-gear wait must not own the global Merchant lease.
test('self-gear wait releases the Merchant progression lease so Production can continue', async () => {
  const coordinator = new MerchantTaskCoordinator({ now: () => 1000, defaultLeaseMs: 600000 });
  assert.equal(coordinator.acquire('ALPHA27', 'PROGRESSION_BATCH', 'alpha27:progression-batch', { serviceArea: 'newupgrade' }).acquired, true);

  const merchant = Object.create(Alpha27MerchantAutonomy.prototype);
  merchant.stats = { autonomousMerchantCycles: 0, autonomousMerchantHolds: 0 };
  merchant.now = () => 1000;
  merchant.taskCoordinator = coordinator;
  merchant.runtime = {};
  merchant.atomic = {
    merchantActive: () => true,
    supervisorAllowed: () => true,
    merchantInCombat: () => false,
    serviceTravelBusy: false,
    merchantBusy: false
  };
  merchant.ensureAutonomousAuthorities = () => {};
  merchant.reconcileRecovering = () => false;
  merchant.activeTransaction = () => null;
  merchant.criticalPartySupplyPlan = () => null;
  merchant.restockPartyPotions = async () => false;
  merchant.progressOrDeliverFarmerGear = async () => false;
  merchant.transactionFamilyOpen = () => false;
  merchant.planCompound = () => null;
  merchant.planUpgrade = () => null;
  merchant.selfGear = {
    cycle: async () => false,
    status: () => ({ session: { stage: 'WAIT_LEDGER' } })
  };
  merchant._updateCollectionSession = () => ({ active: false });
  merchant.planSellOrBank = () => null;
  merchant.bankRecovery = null;
  merchant._event = () => {};

  const acted = await merchant.cycle();
  assert.equal(acted, false);
  assert.equal(coordinator.current(), null);

  const production = coordinator.acquire('PRODUCTION', 'EXCHANGE_BATCH', 'production:exchange:seashell:elixirdex0');
  assert.equal(production.acquired, true);
});

test('gear finalization HOLD is reported as no progress so the global progression lease may drain', async () => {
  const merchant = Object.create(Alpha27MerchantAutonomy.prototype);
  merchant.stats = { autonomousMerchantHolds: 0 };
  merchant.now = () => 1000;
  merchant.planGearDeliveryFinalization = () => ({
    state: 'HOLD',
    reason: 'GEAR_FINALIZATION_UPGRADE_LEDGER_PENDING',
    targetLevel: 5,
    candidate: {
      goal: { character: 'My_Ranger1', slot: 'offhand' },
      item: { name: 'quiver', level: 4, index: 7 }
    }
  });
  merchant.deliverGearGoal = async () => { throw new Error('HOLD must not deliver'); };

  assert.equal(await merchant.progressOrDeliverFarmerGear(), false);
  assert.equal(merchant.lastMerchantPlan.reason, 'GEAR_FINALIZATION_UPGRADE_LEDGER_PENDING');
});

test('Inventory ledger reserves only the exact physical gear-goal item', () => {
  const ledger = new InventoryLedger({ now: () => 1000 });
  ledger.setProgressionReservations([{
    name: 'ringsj',
    level: 1,
    quantity: 1,
    sourceCharacter: 'Farmer',
    sourceIndex: 1,
    goalIds: ['goal-1']
  }]);
  ledger.observe({
    observedAt: 1000,
    registry: {
      characters: [{
        name: 'Farmer',
        ctype: 'ranger',
        stateConfidence: 1,
        inventory: [
          { index: 0, name: 'ringsj', level: 1, q: 1 },
          { index: 1, name: 'ringsj', level: 1, q: 1 },
          { index: 2, name: 'ringsj', level: 1, q: 1 }
        ]
      }]
    },
    gameData: {
      items: {
        ringsj: { type: 'ring', g: 1000, compound: { dex: 1 }, grades: [] }
      }
    }
  });
  assert.equal(ledger.get('Farmer', 1).disposition, ItemDisposition.RESERVE_PROGRESSION);
  assert.equal(ledger.get('Farmer', 0).disposition, ItemDisposition.RESERVE_COMPOUND);
  assert.equal(ledger.get('Farmer', 2).disposition, ItemDisposition.RESERVE_COMPOUND);
});

test('legacy quantity reservation consumes only its requested quantity', () => {
  const ledger = new InventoryLedger({ now: () => 1000 });
  ledger.setProgressionReservations([{ name: 'ringsj', level: 1, quantity: 1, sourceCharacter: 'Farmer', goalIds: ['goal-1'] }]);
  ledger.observe({
    observedAt: 1000,
    registry: {
      characters: [{
        name: 'Farmer',
        ctype: 'ranger',
        inventory: [
          { index: 0, name: 'ringsj', level: 1, q: 1 },
          { index: 1, name: 'ringsj', level: 1, q: 1 },
          { index: 2, name: 'ringsj', level: 1, q: 1 }
        ]
      }]
    },
    gameData: { items: { ringsj: { type: 'ring', g: 1000, compound: { dex: 1 }, grades: [] } } }
  });
  const rows = ledger.list(10).filter((row) => row.name === 'ringsj');
  assert.equal(rows.filter((row) => row.disposition === ItemDisposition.RESERVE_PROGRESSION).length, 1);
  assert.equal(rows.filter((row) => row.disposition === ItemDisposition.RESERVE_COMPOUND).length, 2);
});

test('GearProgression assigns one physical candidate to at most one target slot', () => {
  const evaluator = new GearProgressionEvaluator({ now: () => 1000, minImprovementRatio: 0.01 });
  const result = evaluator.evaluate({
    registry: {
      characters: [
        {
          name: 'Merchant',
          ctype: 'merchant',
          level: 80,
          inventory: [{ index: 0, name: 'goodbow', level: 0, q: 1 }],
          gear: {}
        },
        {
          name: 'R1',
          ctype: 'ranger',
          level: 80,
          inventory: [],
          gear: { mainhand: { name: 'weakbow', level: 0 } }
        },
        {
          name: 'R2',
          ctype: 'ranger',
          level: 80,
          inventory: [],
          gear: { mainhand: { name: 'weakbow', level: 0 } }
        }
      ]
    },
    gameData: {
      items: {
        goodbow: { type: 'weapon', class: ['ranger'], attack: 100, g: 1000, upgrade: { attack: 5 }, grades: [] },
        weakbow: { type: 'weapon', class: ['ranger'], attack: 5, g: 100, upgrade: { attack: 1 }, grades: [] }
      }
    }
  });
  assert.equal(result.currentGoals.length, 1);
  assert.equal(result.reservations.length, 1);
  assert.equal(result.reservations[0].sourceCharacter, 'Merchant');
  assert.equal(result.reservations[0].sourceIndex, 0);
});

test('GearProgression keeps better gear allocation Farmer-first at approximately 80/20', () => {
  const evaluator = new GearProgressionEvaluator({ now: () => 1000, minImprovementRatio: 0.01 });
  const inventory = [];
  for (let i = 0; i < 10; i += 1) inventory.push({ index: i, name: `ring${i}`, level: 0, q: 1 });
  const items = { weakring: { type: 'ring', dex: 1, g: 10 } };
  for (let i = 0; i < 10; i += 1) items[`ring${i}`] = { type: 'ring', dex: 20 + i, luck: 20 + i, g: 1000, compound: { dex: 1, luck: 1 }, grades: [] };

  const result = evaluator.evaluate({
    registry: {
      characters: [
        { name: 'Merchant', ctype: 'merchant', level: 80, inventory, gear: { ring1: { name: 'weakring', level: 0 }, ring2: { name: 'weakring', level: 0 } } },
        { name: 'R1', ctype: 'ranger', level: 80, inventory: [], gear: { ring1: { name: 'weakring', level: 0 }, ring2: { name: 'weakring', level: 0 } } },
        { name: 'R2', ctype: 'ranger', level: 80, inventory: [], gear: { ring1: { name: 'weakring', level: 0 }, ring2: { name: 'weakring', level: 0 } } },
        { name: 'R3', ctype: 'ranger', level: 80, inventory: [], gear: { ring1: { name: 'weakring', level: 0 }, ring2: { name: 'weakring', level: 0 } } }
      ]
    },
    gameData: { items },
    contentDrift: { requiresRevalidation: () => false }
  });

  const farmers = result.currentGoals.filter((goal) => goal.ctype !== 'merchant').length;
  const merchant = result.currentGoals.filter((goal) => goal.ctype === 'merchant').length;
  assert.ok(farmers >= merchant * 4 || merchant === 0, `expected Farmer-first allocation, got ${farmers} Farmer vs ${merchant} Merchant`);
  assert.equal(result.status.lastEvaluation.farmerTargetShare, 0.8);
});

test('Merchant gear keeps speed primary but rejects a weighted net regression', () => {
  const evaluator = new GearProgressionEvaluator({ now: () => 1000, minImprovementRatio: 0.01 });
  const result = evaluator.evaluate({
    registry: {
      characters: [{
        name: 'Merchant',
        ctype: 'merchant',
        level: 80,
        inventory: [
          { index: 0, name: 'tankboots', level: 0, q: 1 },
          { index: 1, name: 'swiftboots', level: 0, q: 1 }
        ],
        gear: { shoes: { name: 'currentboots', level: 0 } }
      }]
    },
    gameData: {
      items: {
        currentboots: { type: 'shoes', armor: 1000, speed: 5, g: 1000 },
        tankboots: { type: 'shoes', armor: 100000, speed: 4, g: 1000 },
        swiftboots: { type: 'shoes', armor: 0, speed: 6, g: 1000 }
      }
    },
    contentDrift: { requiresRevalidation: () => false }
  });

  const merchantGoals = result.currentGoals.filter((goal) => goal.character === 'Merchant');
  assert.equal(merchantGoals.length, 0);
  assert.equal(result.status.merchantPrimaryGearStat, 'speed');
  assert.equal(result.status.merchantSpeedPriority, 'WEIGHTED_PRIMARY_WITH_NET_REGRESSION_GUARD');
});

test('leader farms a safe visible fallback while the material-objective spawn is empty', () => {
  let now = 2000;
  const farmer = new FarmerController({ now: () => now, moveCooldownMs: 250 });
  farmer.state = FarmerState.SELECT_TARGET;
  farmer.materialObjective = {
    kind: 'ELIXIR_MATERIAL',
    monster: 'crabxx',
    material: 'seashell',
    elixirName: 'elixirdex0',
    map: 'main',
    x: 1000,
    y: 500,
    expiresAt: 60000
  };
  const context = {
    adapter: {
      mode: 'active',
      command: () => ({ executed: true }),
      getGameData: () => ({
        items: {},
        monsters: { tortoise: { xp: 100 } }
      })
    },
    snapshot: {
      character: {
        name: 'R1', ctype: 'ranger', map: 'main', x: 1000, y: 500,
        hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000,
        range: 120, speed: 60, inventory: []
      },
      entities: [
        { id: 't1', mtype: 'tortoise', map: 'main', x: 1040, y: 500, hp: 500, dead: false, target: null }
      ]
    },
    party: { fingerprint: 'party:R1', members: [{ name: 'R1' }] },
    world: null
  };

  farmer.step(context);

  assert.equal(farmer.targetId, 't1');
  assert.equal(farmer.targetType, 'tortoise');
  assert.equal(farmer.state, FarmerState.ENGAGE);
  assert.ok(farmer.materialObjective, 'material objective remains latched for when crabxx appears');
  assert.notEqual(farmer.reason, 'MATERIAL_OBJECTIVE_SPAWN_WAIT');
});

test('normal ENGAGE state does not by itself block Farmer outbound logistics', () => {
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.runtime = { farmer: { state: 'ENGAGE' } };
  const snapshot = {
    character: { name: 'R1', rip: false },
    entities: []
  };
  assert.equal(logistics._safeForOutbound(snapshot), true);
  snapshot.entities.push({ id: 'm1', mtype: 'goo', dead: false, target: 'R1' });
  assert.equal(logistics._safeForOutbound(snapshot), false);
});

test('same-map elixir material objective moves toward its spawn even before monster is visible', () => {
  let now = 1000;
  const moves = [];
  const farmer = new FarmerController({ now: () => now, moveCooldownMs: 250 });
  farmer.state = FarmerState.SELECT_TARGET;
  farmer.materialObjective = {
    kind: 'ELIXIR_MATERIAL',
    monster: 'crabxx',
    material: 'seashell',
    elixirName: 'elixirdex0',
    map: 'main',
    x: 1000,
    y: 500,
    expiresAt: 60000
  };
  const context = {
    adapter: {
      mode: 'active',
      command(name, args) {
        if (name === 'move') moves.push(args);
        return { executed: true };
      },
      getGameData: () => ({ items: {}, monsters: {} })
    },
    snapshot: {
      character: { name: 'R1', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000, inventory: [] },
      entities: []
    },
    party: { members: [] },
    world: null
  };
  farmer.step(context);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0], [1000, 500]);
  assert.equal(farmer.lastSelection.source, 'elixir-material-objective-same-map');
});
