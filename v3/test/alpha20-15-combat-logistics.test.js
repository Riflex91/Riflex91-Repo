'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlledPartyLogistics, Action } = require('../src/reliability/controlled-party-logistics');
const {
  installFarmerRankingGuard,
  patchLogisticsPrototype,
  normalizeRanking
} = require('../src/reliability/alpha20-15-combat-logistics-hotfix');
const { RELEASE_VERSION } = require('../src/release-version');

class FakeTransport {
  constructor() { this.receiver = null; }
  trustedRosterNames() { return ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']; }
  activeNames() { return ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']; }
  installDirectReceiver(_name, handler) { this.receiver = handler; return true; }
  send() { return Promise.resolve({ delivered: true }); }
}

function makeRuntime(name = 'My_Ranger1', ctype = 'ranger', clock = { now: 10000 }) {
  const transport = new FakeTransport();
  const root = {
    parent: {},
    character: {
      name,
      ctype,
      map: 'main',
      x: 0,
      y: 0,
      real_x: 0,
      real_y: 0,
      gold: 0,
      isize: 42,
      items: []
    },
    on_cm: null
  };
  root.parent.character = root.character;
  const runtime = {
    root,
    now: () => clock.now,
    log: { emit() {} },
    adapter: {
      mode: 'active',
      snapshot: () => ({ character: { ...root.character, inventory: root.character.items } })
    },
    farmer: {
      state: 'ASSESS',
      _selectTarget() {
        return { target: { id: 'm1', mtype: 'crab' }, ranking: { monster: 'crab', score: Number.MAX_SAFE_INTEGER, source: 'team-shared-aggro' } };
      }
    },
    partyAccountCommunication: { transport },
    partyControlLease: { merchantName: 'My_Merchant' },
    partyBootstrap: { trustedRosterNames: () => transport.trustedRosterNames() }
  };
  return { runtime, root, transport, clock };
}

function snapshot(name, ctype, { gold = 0, isize = 42, inventory = [], x = 0, y = 0 } = {}) {
  return {
    character: {
      name,
      ctype,
      map: 'main',
      x,
      y,
      hp: 3000,
      max_hp: 3000,
      mp: 800,
      max_mp: 800,
      gold,
      isize,
      inventory
    },
    entities: []
  };
}

patchLogisticsPrototype();

test('Alpha20.15 normalizes synthetic team rankings before Farmer telemetry formats travelSeconds', () => {
  const raw = { target: { id: 'm1', mtype: 'crab' }, ranking: { monster: 'crab', score: 123, source: 'team-shared-aggro' } };
  const normalized = normalizeRanking(raw);
  assert.equal(normalized.ranking.travelSeconds, 0);
  assert.doesNotThrow(() => Number(normalized.ranking.travelSeconds.toFixed(2)));

  const { runtime } = makeRuntime();
  assert.equal(installFarmerRankingGuard(runtime), true);
  const selection = runtime.farmer._selectTarget({});
  assert.equal(selection.ranking.travelSeconds, 0);
  assert.equal(selection.ranking.confidence, 1);
});

test('Alpha20.15 logistics uses below-50 refill threshold and 5000 target with no farmer gold reserve', () => {
  const { runtime } = makeRuntime();
  const logistics = new ControlledPartyLogistics(runtime);
  assert.equal(logistics.config.farmerPotionLow, 50);
  assert.equal(logistics.config.farmerPotionTarget, 5000);
  assert.equal(logistics.config.maxSupplyBatch, 5000);
  assert.equal(logistics.config.farmerGoldReserve, 0);
  assert.equal(logistics.config.merchantReserveSlots, 0);
  assert.ok(logistics.config.maxGoldBatch >= Number.MAX_SAFE_INTEGER);
});

test('Alpha20.15 farmer loot accepts transferable gear and special items but keeps HP/MP potions and locked items', () => {
  const { runtime } = makeRuntime();
  const logistics = new ControlledPartyLogistics(runtime);
  assert.equal(logistics._safeLootDescriptor({ name: 'hpot0', q: 5000, index: 0 }).ok, false);
  assert.equal(logistics._safeLootDescriptor({ name: 'mpot0', q: 5000, index: 1 }).ok, false);
  assert.equal(logistics._safeLootDescriptor({ name: 'ringsj', level: 3, special: true, q: 1, index: 2 }).ok, true);
  assert.equal(logistics._safeLootDescriptor({ name: 'anniversarygift', level: 0, special: true, q: 1, index: 3 }).ok, true);
  assert.equal(logistics._safeLootDescriptor({ name: 'lockedgear', level: 0, locked: true, q: 1, index: 4 }).ok, false);
});

test('Merchant accepts item loot until the last slot is consumed, then emits full-stop capacity', () => {
  const { runtime } = makeRuntime('My_Merchant', 'merchant');
  const logistics = new ControlledPartyLogistics(runtime);
  const oneFree = snapshot('My_Merchant', 'merchant', {
    isize: 2,
    inventory: [{ index: 0, name: 'mpot0', q: 6000 }, null]
  });
  const full = snapshot('My_Merchant', 'merchant', {
    isize: 2,
    inventory: [{ index: 0, name: 'mpot0', q: 6000 }, { index: 1, name: 'loot', q: 1 }]
  });
  assert.equal(logistics._merchantCapacity(oneFree).acceptingLoot, true);
  assert.equal(logistics._merchantCapacity(full).acceptingLoot, false);
  assert.equal(logistics._merchantCapacity(full).stopReason, 'OKAY_STOP_MERCHANT_INVENTORY_FULL');
});

test('Gold offer uses the entire farmer balance while Merchant is nearby even when Merchant inventory is full', () => {
  const { runtime, clock } = makeRuntime('My_Ranger1', 'ranger');
  const logistics = new ControlledPartyLogistics(runtime);
  const sent = [];
  logistics._send = (target, action, data) => { sent.push({ target, action, data }); return Promise.resolve({ delivered: true }); };
  logistics.lastMerchantStatus = {
    receivedAt: clock.now,
    acceptingLoot: false,
    stopReason: 'OKAY_STOP_MERCHANT_INVENTORY_FULL',
    map: 'main',
    x: 20,
    y: 0
  };
  const snap = snapshot('My_Ranger1', 'ranger', { gold: 987654, x: 0, y: 0 });
  assert.equal(logistics._offerGoldAnytime(snap), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].action, Action.GOLD_OFFER);
  assert.equal(sent[0].data.amount, 987654);
  assert.equal(logistics.lastDecision.reason, 'MERCHANT_FULL_BUT_GOLD_HAS_NO_SLOT_COST');
});

test('Inventory offer skips potions and offers levelled gear while Merchant still has capacity', () => {
  const { runtime, clock } = makeRuntime('My_Ranger1', 'ranger');
  const logistics = new ControlledPartyLogistics(runtime);
  const sent = [];
  logistics._send = (target, action, data) => { sent.push({ target, action, data }); return Promise.resolve({ delivered: true }); };
  logistics.lastMerchantStatus = { receivedAt: clock.now, acceptingLoot: true, map: 'main', x: 20, y: 0 };
  const snap = snapshot('My_Ranger1', 'ranger', {
    x: 0,
    y: 0,
    inventory: [
      { index: 0, name: 'hpot0', q: 200 },
      { index: 1, name: 'mpot0', q: 200 },
      { index: 2, name: 'hpamulet', level: 4, q: 1, special: true }
    ]
  });
  assert.equal(logistics._offerInventoryItem(snap), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].action, Action.LOOT_OFFER);
  assert.equal(sent[0].data.item.name, 'hpamulet');
  assert.equal(sent[0].data.item.level, 4);
});

test('visible release version matches integrated Alpha20.23', () => {
  assert.equal(RELEASE_VERSION, '3.0.0-alpha.20.37');
});
