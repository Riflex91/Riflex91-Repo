'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlledPartyLogistics, Action } = require('../src/party/controlled-party-logistics');
const {
  installFarmerRankingGuard,
  patchLogisticsPrototype,
  normalizeRanking
} = require('../src/party/alpha20-15-combat-logistics-hotfix');
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

test('Alpha20.15 logistics keeps one Merchant pickup slot and uses accelerated closed-loop transfer cadence', () => {
  const { runtime } = makeRuntime();
  const logistics = new ControlledPartyLogistics(runtime);
  assert.equal(logistics.config.farmerPotionLow, 200);
  assert.equal(logistics.config.farmerPotionTarget, 5000);
  assert.equal(logistics.config.maxSupplyBatch, 5000);
  assert.equal(logistics.config.farmerGoldReserve, 0);
  assert.equal(logistics.config.merchantReserveSlots, 1);
  assert.equal(logistics.config.transferIntervalMs, 300);
  assert.equal(logistics.config.verifyDelayMs, 250);
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

test('Merchant stops item intake with one physical pickup-reserve slot remaining', () => {
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
  assert.equal(logistics._merchantCapacity(oneFree).acceptingLoot, false);
  assert.equal(logistics._merchantCapacity(oneFree).reserveSlots, 1);
  assert.equal(logistics._merchantCapacity(full).acceptingLoot, false);
  assert.equal(logistics._merchantCapacity(full).stopReason, 'OKAY_STOP_MERCHANT_INVENTORY_FULL');
});

test('Merchant keeps the last-slot grant reserved until recipient inventory observes the Farmer item', () => {
  const { runtime, root, clock } = makeRuntime('My_Merchant', 'merchant');
  root.G = { items: { hpbelt: { type: 'belt', upgrade: { armor: 1 } }, mpot0: { type: 'pot' } } };
  root.character.isize = 3;
  root.character.items = [{ index: 0, name: 'mpot0', q: 5000 }, null, null];
  runtime.adapter.snapshot = () => ({
    character: { ...root.character, inventory: root.character.items },
    entities: []
  });
  const logistics = new ControlledPartyLogistics(runtime, { recipientSettleTimeoutMs: 6000 });
  logistics._send = () => Promise.resolve({ delivered: true });

  assert.equal(logistics._handleLootOffer('My_Ranger1', {
    offerId: 'offer-last-slot',
    quantity: 1,
    item: { name: 'hpbelt', level: 0, q: 1, index: 7 },
    map: 'main',
    x: 20,
    y: 0
  }), true);
  const grant = [...logistics.activeLootGrants.values()][0];
  assert.ok(grant);
  assert.equal(logistics._merchantCapacity(runtime.adapter.snapshot()).effectiveFreeSlots, 1);

  assert.equal(logistics.receive('My_Ranger1', {
    type: 'aio-v3-party-logistics',
    protocol: 1,
    action: Action.TRANSFER_COMMIT,
    sender: 'My_Ranger1',
    at: clock.now,
    grantId: grant.grantId,
    offerId: grant.offerId,
    kind: 'item',
    committed: true
  }), true);

  assert.equal(logistics.activeLootGrants.has(grant.grantId), true, 'sender commit alone must not release last-slot reservation');
  assert.equal(logistics._merchantCapacity(runtime.adapter.snapshot()).acceptingLoot, false);

  root.character.items[1] = { index: 1, name: 'hpbelt', level: 0, q: 1 };
  clock.now += 100;
  const capacity = logistics._merchantCapacity(runtime.adapter.snapshot());
  assert.equal(logistics.activeLootGrants.has(grant.grantId), false);
  assert.equal(logistics.stats.lootRecipientVerified, 1);
  assert.equal(capacity.freeSlots, 1);
  assert.equal(capacity.reserveSlots, 1);
  assert.equal(capacity.acceptingLoot, false);
});

// Live alpha.20.105 regression: identical concurrent grants must not share one Merchant recipient baseline.
test('Merchant serializes concurrent grants for the same item identity until recipient settlement', () => {
  const { runtime, root, clock } = makeRuntime('My_Merchant', 'merchant');
  root.G = { items: { hpbelt: { type: 'belt', upgrade: { armor: 1 } }, mpot0: { type: 'pot' } } };
  root.character.isize = 4;
  root.character.items = [{ index: 0, name: 'mpot0', q: 5000 }, null, null, null];
  runtime.adapter.snapshot = () => ({
    character: { ...root.character, inventory: root.character.items },
    entities: []
  });
  const logistics = new ControlledPartyLogistics(runtime, {
    recipientSettleTimeoutMs: 6000,
    transferIntervalMs: 300
  });
  const sent = [];
  logistics._send = (target, action, data) => {
    sent.push({ target, action, data });
    return Promise.resolve({ delivered: true });
  };

  assert.equal(logistics._handleLootOffer('My_Ranger1', {
    offerId: 'offer-identical-a',
    quantity: 1,
    item: { name: 'hpbelt', level: 0, q: 1, index: 7 },
    map: 'main',
    x: 20,
    y: 0
  }), true);
  assert.equal(logistics.activeLootGrants.size, 1);

  assert.equal(logistics._handleLootOffer('My_Ranger2', {
    offerId: 'offer-identical-b',
    quantity: 1,
    item: { name: 'hpbelt', level: 0, q: 1, index: 8 },
    map: 'main',
    x: 25,
    y: 0
  }), true);
  assert.equal(logistics.activeLootGrants.size, 1, 'second identical identity must not get a concurrent recipient baseline');

  const rejected = sent.find((row) => row.target === 'My_Ranger2' && row.action === Action.LOOT_REJECT);
  assert.ok(rejected);
  assert.equal(rejected.data.reason, 'IDENTITY_TRANSFER_IN_FLIGHT');
  assert.ok(rejected.data.retryAfterMs <= 750);

  const grant = [...logistics.activeLootGrants.values()][0];
  assert.equal(logistics.receive('My_Ranger1', {
    type: 'aio-v3-party-logistics',
    protocol: 1,
    action: Action.TRANSFER_COMMIT,
    sender: 'My_Ranger1',
    at: clock.now,
    grantId: grant.grantId,
    offerId: grant.offerId,
    kind: 'item',
    committed: true
  }), true);
  root.character.items[1] = { index: 1, name: 'hpbelt', level: 0, q: 1 };
  clock.now += 100;
  logistics._merchantCapacity(runtime.adapter.snapshot());
  assert.equal(logistics.activeLootGrants.size, 0);

  assert.equal(logistics._handleLootOffer('My_Ranger2', {
    offerId: 'offer-identical-c',
    quantity: 1,
    item: { name: 'hpbelt', level: 0, q: 1, index: 8 },
    map: 'main',
    x: 25,
    y: 0
  }), true);
  assert.equal(logistics.activeLootGrants.size, 1, 'same identity may proceed immediately after prior recipient settlement');
});

test('transient send_item rejection uses short retry guard instead of two-minute item lockout', () => {
  const { runtime, clock } = makeRuntime('My_Ranger1', 'ranger');
  const logistics = new ControlledPartyLogistics(runtime, { failureBackoffMs: 7000, verifyTimeoutMs: 3500 });
  const snap = snapshot('My_Ranger1', 'ranger', {
    inventory: [{ index: 0, name: 'hpbelt', level: 0, q: 1 }]
  });
  logistics.pendingOutbound = {
    kind: 'item',
    at: clock.now - 1000,
    offerId: 'offer-transient',
    grantId: 'grant-transient',
    name: 'hpbelt',
    level: 0,
    quantity: 1,
    beforeCount: 1,
    index: 0,
    signature: '0:hpbelt:0',
    asyncRejected: true
  };

  logistics._verifyPendingOutbound(snap);

  const blocked = logistics.rejectedLoot.get('0:hpbelt:0');
  assert.ok(blocked);
  assert.equal(blocked.reason, 'OUTBOUND_SEND_REJECTED_TRANSIENT');
  assert.ok(blocked.blockedUntil - clock.now <= 15000);
  assert.ok(blocked.blockedUntil - clock.now >= 3000);
  assert.equal(logistics.pendingOutbound, null);
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

test('Farmer loot offers and granted transfers are not blocked by normal ENGAGE combat state', () => {
  const { runtime } = makeRuntime('My_Ranger1', 'ranger');
  runtime.farmer.state = 'ENGAGE';
  const logistics = new ControlledPartyLogistics(runtime);
  let offers = 0;
  let grants = 0;
  logistics._requestSupply = () => false;
  logistics._verifyPendingOutbound = () => false;
  logistics._offerInventoryItem = () => { offers += 1; return true; };
  logistics._offerGoldAnytime = () => false;
  logistics._executeGrant = () => { grants += 1; logistics.pendingGrant = null; logistics.pendingOffer = null; return true; };

  const snap = snapshot('My_Ranger1', 'ranger', { inventory: [{ index: 0, name: 'gslime', q: 1 }] });
  logistics._farmerTick(snap);
  assert.equal(offers, 1);

  logistics.pendingOffer = { kind: 'item', offerId: 'offer-1', item: { index: 0, name: 'gslime', level: 0 } };
  logistics.pendingGrant = { action: Action.LOOT_GRANT, offerId: 'offer-1', grantId: 'grant-1', expiresAt: 20000 };
  offers = 0;
  logistics._farmerTick(snap);
  assert.equal(grants, 1);
  assert.equal(offers, 1);
});

test('visible release version matches integrated Alpha20.23', () => {
  assert.equal(RELEASE_VERSION, '3.0.0-alpha.20.121');
});
