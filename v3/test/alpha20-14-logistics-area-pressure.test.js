'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAdapter } = require('../src/game/adapter');
const { installTeamCohesionDeadlockHotfix } = require('../src/reliability/team-cohesion-deadlock-hotfix');
const { installControlledPartyLogistics } = require('../src/reliability/controlled-party-logistics');
const { installFarmAreaPressureHotfix } = require('../src/reliability/farm-area-pressure-hotfix');

function gameData() {
  return {
    items: {
      hpot0: { type: 'pot', s: 9999 },
      mpot0: { type: 'pot', s: 9999 },
      gslime: { type: 'material', s: 9999 },
      seashell: { type: 'material', s: 9999 },
      sword: { type: 'weapon', wtype: 'sword', upgrade: true }
    },
    monsters: { crab: { xp: 100 }, squigtoad: { xp: 200 } },
    maps: {}
  };
}

function rawItem(name, q = 1, extra = {}) {
  return { name, q, level: 0, ...extra };
}

class DirectBusTransport {
  constructor(name, bus) {
    this.name = name;
    this.bus = bus;
    this.receivers = {};
    bus.transports[name] = this;
  }
  localName() { return this.name; }
  trustedRosterNames() { return Object.keys(this.bus.characters).sort(); }
  activeNames() { return Object.keys(this.bus.characters).sort(); }
  installDirectReceiver(name, handler) { this.receivers[name] = handler; return true; }
  send(target, payload, options = {}) {
    const transport = this.bus.transports[target];
    if (!transport) return Promise.reject(new Error('target missing'));
    const receiver = transport.receivers[options.receiver];
    if (!receiver) return Promise.reject(new Error('receiver missing'));
    receiver(options.sender || this.name, payload);
    return Promise.resolve({ delivered: true, transport: 'test-direct' });
  }
}

function makeRoot(name, ctype, bus, { items = [], gold = 100000, x = 0, y = 0, isize = 42 } = {}) {
  const root = {
    parent: {},
    G: gameData(),
    character: {
      name, ctype, map: 'main', real_x: x, real_y: y, x, y,
      hp: 3000, max_hp: 3000, mp: 800, max_mp: 800,
      range: 120, speed: 60, frequency: 1, gold, rip: false,
      isize, items: Array.from({ length: isize }, (_, index) => items[index] || null)
    }
  };
  root.parent.G = root.G;
  root.parent.character = root.character;
  root.move = (nx, ny) => { root.character.real_x = nx; root.character.real_y = ny; root.character.x = nx; root.character.y = ny; };
  root.send_gold = (target, amount) => {
    const destination = bus.characters[target];
    if (!destination) throw new Error('target missing');
    const q = Math.max(0, Math.floor(Number(amount) || 0));
    if (q > root.character.gold) throw new Error('not enough gold');
    root.character.gold -= q;
    destination.character.gold += q;
  };
  root.send_item = (target, index, quantity) => {
    const destination = bus.characters[target];
    if (!destination) throw new Error('target missing');
    const source = root.character.items[index];
    if (!source) throw new Error('source item missing');
    const q = Math.min(Math.max(1, Math.floor(Number(quantity) || 1)), Math.max(1, Number(source.q) || 1));
    let targetItem = destination.character.items.find((item) => item && item.name === source.name && Number(item.level || 0) === Number(source.level || 0));
    if (!targetItem) {
      const free = destination.character.items.findIndex((item) => !item);
      if (free < 0) throw new Error('inventory full');
      targetItem = { ...source, q: 0 };
      destination.character.items[free] = targetItem;
    }
    targetItem.q = Math.max(0, Number(targetItem.q) || 0) + q;
    source.q = Math.max(0, Number(source.q) || 0) - q;
    if (source.q <= 0) root.character.items[index] = null;
  };
  bus.characters[name] = root;
  return root;
}

function makeLogisticsRuntime(name, ctype, bus, clock, options = {}) {
  const root = makeRoot(name, ctype, bus, options);
  const transport = new DirectBusTransport(name, bus);
  const adapter = new GameAdapter({ root, parent: root.parent, now: () => clock.now, mode: 'active' });
  const runtime = {
    root,
    adapter,
    now: () => clock.now,
    log: { emit() {} },
    farmer: { state: 'ASSESS', targetId: null },
    partyAccountCommunication: { transport },
    partyControlLease: { merchantName: 'My_Merchant' },
    partyBootstrap: { trustedRosterNames: () => Object.keys(bus.characters) }
  };
  const logistics = installControlledPartyLogistics(runtime, {
    statusIntervalMs: 1000,
    statusFreshMs: 5000,
    supplyRequestIntervalMs: 3000,
    transferIntervalMs: 700,
    verifyDelayMs: 250,
    verifyTimeoutMs: 1800,
    farmerPotionLow: 120,
    farmerPotionTarget: 500,
    merchantPotionReserve: 300,
    merchantReserveSlots: 4,
    maxTransferDistance: 380
  });
  return { root, adapter, runtime, logistics, snapshot: () => adapter.snapshot() };
}

function tickAll(rows) {
  for (const row of rows) row.logistics.tick(row.snapshot());
}

test('pairwise formation hotfix makes steady opposite follower positions fit the cohesion gate', () => {
  const runtime = {
    now: () => 1000,
    log: { emit() {} },
    teamCombatCohesionHotfix: { cohesionRadius: 150, followRadius: 85, followStep: 70 }
  };
  const hotfix = installTeamCohesionDeadlockHotfix(runtime);
  const status = hotfix.status();
  assert.equal(runtime.teamCombatCohesionHotfix.followRadius, 60);
  assert.ok(status.theoreticalOppositeFollowerDistance <= 120);
  assert.equal(status.pairwiseSteadyFormationFitsGate, true);
});

test('merchant automatically resupplies a trusted farmer with missing MP potions and verifies its own inventory delta', async () => {
  const bus = { characters: {}, transports: {} };
  const clock = { now: 10000 };
  const merchant = makeLogisticsRuntime('My_Merchant', 'merchant', bus, clock, {
    items: [rawItem('mpot0', 1500), rawItem('hpot0', 1500)], gold: 1000000, x: 0, y: 0
  });
  const farmer = makeLogisticsRuntime('My_Ranger1', 'ranger', bus, clock, {
    items: [rawItem('hpot0', 200)], gold: 100000, x: 40, y: 0
  });

  tickAll([merchant, farmer]);
  await Promise.resolve();
  merchant.logistics.tick(merchant.snapshot());
  assert.ok(farmer.snapshot().character.inventory.some((item) => item && item.name === 'mpot0'));
  assert.equal(merchant.logistics.status().stats.supplyTransfers, 1);

  clock.now += 400;
  merchant.logistics.tick(merchant.snapshot());
  await Promise.resolve();
  assert.equal(merchant.logistics.status().stats.supplyVerified, 1);
  assert.equal(farmer.logistics.status().lastSupplyResult.committed, true);
});

test('farmer sends only safe material loot to merchant through a short-lived grant and keeps protected gear', async () => {
  const bus = { characters: {}, transports: {} };
  const clock = { now: 20000 };
  const merchant = makeLogisticsRuntime('My_Merchant', 'merchant', bus, clock, {
    items: [rawItem('mpot0', 1500), rawItem('hpot0', 1500)], gold: 1000000, x: 0, y: 0
  });
  const farmer = makeLogisticsRuntime('My_Ranger1', 'ranger', bus, clock, {
    items: [rawItem('hpot0', 500), rawItem('mpot0', 500), rawItem('gslime', 7), rawItem('sword', 1)],
    gold: 100000, x: 30, y: 0
  });

  merchant.logistics.tick(merchant.snapshot());
  await Promise.resolve();
  farmer.logistics.tick(farmer.snapshot());
  await Promise.resolve();
  assert.equal(farmer.logistics.status().pendingGrant.action, 'LOOT_GRANT');

  clock.now += 50;
  farmer.logistics.tick(farmer.snapshot());
  assert.equal(farmer.logistics.status().stats.lootTransfers, 1);
  clock.now += 400;
  farmer.logistics.tick(farmer.snapshot());
  await Promise.resolve();
  assert.equal(farmer.logistics.status().stats.lootVerified, 1);
  assert.ok(merchant.snapshot().character.inventory.some((item) => item && item.name === 'gslime' && item.q === 7));
  assert.ok(farmer.snapshot().character.inventory.some((item) => item && item.name === 'sword'));
});

test('farmer transfers gold above the configured reserve and keeps the reserve locally', async () => {
  const bus = { characters: {}, transports: {} };
  const clock = { now: 30000 };
  const merchant = makeLogisticsRuntime('My_Merchant', 'merchant', bus, clock, {
    items: [rawItem('mpot0', 1500), rawItem('hpot0', 1500)], gold: 1000000, x: 0, y: 0
  });
  const farmer = makeLogisticsRuntime('My_Ranger1', 'ranger', bus, clock, {
    items: [rawItem('hpot0', 500), rawItem('mpot0', 500)], gold: 600000, x: 30, y: 0
  });

  merchant.logistics.tick(merchant.snapshot());
  await Promise.resolve();
  farmer.logistics.tick(farmer.snapshot());
  await Promise.resolve();
  assert.equal(farmer.logistics.status().pendingGrant.action, 'GOLD_GRANT');
  clock.now += 50;
  farmer.logistics.tick(farmer.snapshot());
  assert.equal(farmer.root.character.gold, 250000);
  assert.equal(merchant.root.character.gold, 1350000);
  clock.now += 400;
  farmer.logistics.tick(farmer.snapshot());
  assert.equal(farmer.logistics.status().stats.goldVerified, 1);
});

test('merchant says stop and grants no farmer outbound transfer when its logistics workspace is full', async () => {
  const bus = { characters: {}, transports: {} };
  const clock = { now: 40000 };
  const filled = Array.from({ length: 39 }, (_, i) => rawItem(i === 0 ? 'mpot0' : i === 1 ? 'hpot0' : 'gslime', i < 2 ? 1500 : 1));
  const merchant = makeLogisticsRuntime('My_Merchant', 'merchant', bus, clock, { items: filled, gold: 1000000, x: 0, y: 0 });
  const farmer = makeLogisticsRuntime('My_Ranger1', 'ranger', bus, clock, {
    items: [rawItem('hpot0', 500), rawItem('mpot0', 500), rawItem('gslime', 7)], gold: 100000, x: 30, y: 0
  });

  merchant.logistics.tick(merchant.snapshot());
  await Promise.resolve();
  assert.equal(farmer.logistics.status().lastMerchantStatus.acceptingLoot, false);
  assert.equal(farmer.logistics.status().lastMerchantStatus.stopReason, 'OKAY_STOP_MERCHANT_INVENTORY_FULL');
  farmer.logistics.tick(farmer.snapshot());
  assert.equal(farmer.logistics.status().pendingOffer, null);
});

function makeAreaRuntime({ candidates = null } = {}) {
  let now = 0;
  const ranked = candidates || [
    { monster: 'crab', map: 'main', x: 0, y: 0, spawnIndex: 0, score: 100 },
    { monster: 'crab', map: 'main', x: 500, y: 0, spawnIndex: 1, score: 90 }
  ];
  const planner = { rank: () => ranked.map((row) => ({ ...row })), materiallyBetter: () => false };
  const localFarming = {
    planner,
    currentPlan: { ...ranked[0], id: 'plan-a', state: 'HOLDING' },
    aborted: null,
    _abort(reason, at, data) { this.aborted = { reason, at, data }; this.currentPlan = null; return true; }
  };
  const team = {
    selfName: 'My_Ranger1', leaderName: 'My_Ranger1', complete: true, alive: true,
    sameMap: true, positionsKnown: true, cohesive: true, healthReady: true, manaReady: true
  };
  const runtime = {
    now: () => now,
    log: { emit() {} },
    localFarming,
    farmer: { targetId: null, state: 'ASSESS' },
    teamCombatCohesionHotfix: { lastTeam: team },
    farmerResourceTopoffHotfix: { supply: () => ({ ready: true }) },
    partyBootstrap: { trustedRosterNames: () => ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3'] }
  };
  const hotfix = installFarmAreaPressureHotfix(runtime, {
    sampleIntervalMs: 500,
    windowMs: 30000,
    minDwellMs: 20000,
    minSamples: 15,
    availabilityThreshold: 0.22,
    idleThreshold: 0.72,
    foreignPresenceThreshold: 0.35,
    exclusionMs: 60000,
    switchCooldownMs: 15000
  });
  planner.rank({}, {}, {}, {}, null);
  const snapshot = (entities = []) => ({
    character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 3000, max_hp: 3000, mp: 800, max_mp: 800 },
    entities
  });
  return { runtime, hotfix, snapshot, advance(ms) { now += ms; } };
}

test('sustained target starvation with foreign players marks an area overcrowded and replans to another safe candidate', () => {
  const fx = makeAreaRuntime();
  const foreign = [{ id: 'p1', name: 'Other_Player', type: 'character', player: true, map: 'main', x: 20, y: 0 }];
  let decision = null;
  for (let i = 0; i < 24; i += 1) {
    decision = fx.hotfix.tick(fx.snapshot(foreign));
    if (decision && decision.action === 'REPLAN') break;
    fx.advance(1000);
  }
  assert.equal(decision.action, 'REPLAN');
  assert.equal(decision.reason, 'AREA_OVERPOPULATED');
  assert.equal(decision.nextCandidate, 'main:crab:1');
  assert.equal(fx.runtime.localFarming.aborted.reason, 'AREA_PRESSURE_REPLAN');
  assert.ok(fx.hotfix.status().exclusions.some((row) => row.key === 'main:crab:0'));
});

test('sustained target starvation without foreign players is classified as insufficient spawn rate', () => {
  const fx = makeAreaRuntime();
  let decision = null;
  for (let i = 0; i < 24; i += 1) {
    decision = fx.hotfix.tick(fx.snapshot([]));
    if (decision && decision.action === 'REPLAN') break;
    fx.advance(1000);
  }
  assert.equal(decision.action, 'REPLAN');
  assert.equal(decision.reason, 'AREA_SPAWN_STARVED');
});

test('area pressure never invents an unsafe destination when no alternative approved candidate exists', () => {
  const fx = makeAreaRuntime({ candidates: [{ monster: 'crab', map: 'main', x: 0, y: 0, spawnIndex: 0, score: 100 }] });
  const foreign = [{ id: 'p1', name: 'Other_Player', type: 'character', player: true, map: 'main', x: 20, y: 0 }];
  let decision = null;
  for (let i = 0; i < 24; i += 1) {
    decision = fx.hotfix.tick(fx.snapshot(foreign));
    fx.advance(1000);
  }
  assert.equal(decision.action, 'HOLD');
  assert.equal(decision.reason, 'AREA_PRESSURED_BUT_NO_SAFE_ALTERNATIVE');
  assert.equal(fx.runtime.localFarming.currentPlan.state, 'HOLDING');
});
