'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  Alpha33MarkOrbitMerchantDelivery,
  effectActiveOn,
  FARMER_STATE_ACTION,
  GEAR_DELIVERY_INTENT_ACTION,
  GEAR_DELIVERY_INTENT_ACK_ACTION
} = require('../src/reliability/alpha33-mark-orbit-merchant-delivery');

function quietLog() { return { emit() {} }; }

function target(id = 'm1') {
  return { id, mtype: 'tortoise', hp: 10000, max_hp: 10000, x: 20, y: 0, target: 'R1', dead: false };
}

function rangerTeam() {
  return {
    leaderName: 'My_Ranger1',
    members: [
      { name: 'My_Ranger1', ctype: 'ranger', present: true },
      { name: 'My_Ranger2', ctype: 'ranger', present: true },
      { name: 'My_Ranger3', ctype: 'ranger', present: true }
    ]
  };
}

test('Alpha33 recognizes live Adventure Land effect state and skips redundant Hunters Mark', () => {
  const raw = target();
  raw.s = { huntersmark: { ms: 8000 } };
  const decision = { id: 'huntersmark', args: ['huntersmark', 'm1'], kind: 'support', reason: 'LONG_ENCOUNTER_MARK' };
  const runtime = {
    now: () => 10000,
    log: quietLog(),
    root: { character: { name: 'R1', ctype: 'ranger' }, parent: { entities: { m1: raw } } },
    partySkillEngine: { _supportDecision: () => decision }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  assert.equal(effectActiveOn(raw, 'huntersmark', 10000), true);
  assert.equal(runtime.partySkillEngine._supportDecision({}, target(), {}), null);
  assert.equal(hotfix.stats.huntersMarkExistingDebuffSkips, 1);

  delete raw.s.huntersmark;
  assert.deepEqual(runtime.partySkillEngine._supportDecision({}, target(), {}), decision);
});

test('Alpha33 gives Hunters Mark to exactly one deterministic Ranger before debuff replication', () => {
  const decision = { id: 'huntersmark', args: ['huntersmark', 'm1'], kind: 'support', reason: 'LONG_ENCOUNTER_MARK' };
  const make = (name) => {
    const runtime = {
      now: () => 15000,
      log: quietLog(),
      root: { character: { name, ctype: 'ranger' }, parent: { entities: { m1: target() } } },
      partySkillEngine: { _supportDecision: () => decision }
    };
    const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
    const result = runtime.partySkillEngine._supportDecision({ snapshot: { character: { name, ctype: 'ranger' } } }, target(), rangerTeam());
    return { result, hotfix };
  };

  const r1 = make('My_Ranger1');
  const r2 = make('My_Ranger2');
  const r3 = make('My_Ranger3');
  assert.deepEqual(r1.result, decision);
  assert.equal(r2.result, null);
  assert.equal(r3.result, null);
  assert.equal(r1.hotfix.stats.huntersMarkOwnerAllows, 1);
  assert.equal(r2.hotfix.stats.huntersMarkOwnershipSkips, 1);
  assert.equal(r3.hotfix.stats.huntersMarkOwnershipSkips, 1);
});

test('Alpha33 Merchant combat authority ignores a selected target and requires incoming monster aggro', () => {
  const monster = { id: 'm1', mtype: 'tortoise', hp: 1000, target: null };
  const controlledTravel = { _inCombat: () => true };
  const controlledMerchantService = { _inCombat: () => true };
  const controlledMerchantProduction = { _inCombat: () => true };
  const atomic = { merchantInCombat: () => true };
  const runtime = {
    now: () => 20000,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', target: 'm1' },
      parent: { entities: { m1: monster } }
    },
    _merchantInCombat: () => true,
    controlledTravel,
    controlledMerchantService,
    controlledMerchantProduction,
    alpha27CombatMerchantConvergence: { atomic }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  assert.equal(runtime._merchantInCombat(), false);
  assert.equal(controlledTravel._inCombat(), false);
  assert.equal(controlledMerchantService._inCombat(), false);
  assert.equal(controlledMerchantProduction._inCombat(), false);
  assert.equal(atomic.merchantInCombat(), false);
  assert.equal(hotfix.stats.merchantCombatOwnersPatched, 5);

  monster.target = 'My_Merchant';
  assert.equal(runtime._merchantInCombat(), true);
  assert.equal(controlledTravel._inCombat(), true);
});

test('Alpha33 close-range escape has a tangential component instead of pure backward kiting', () => {
  const alpha31 = {
    orbitStepSeconds: 0.8,
    _orbitDirection: () => 1,
    _canMoveTo: () => true,
    _segmentSafe: () => true,
    _radialEscape: () => ({ x: -30, y: 0, step: 30, afterDistance: 50, hardSafeDistance: 40, maxRangeDistance: 110, escape: true }),
    _orbitWaypoint: () => ({ x: -30, y: 0, step: 30, afterDistance: 50, desiredDistance: 90, hardSafeDistance: 40, maxRangeDistance: 110, direction: 1, escape: true })
  };
  const runtime = {
    now: () => 30000,
    log: quietLog(),
    localFarming: { currentPlan: { id: 'farm-1', map: 'main', x: 0, y: 0 } },
    alpha31PartyRoleLivenessHotfix: alpha31
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const character = { name: 'R1', map: 'main', x: 0, y: 0, range: 120, speed: 60 };
  const monster = { id: 'm1', mtype: 'tortoise', x: 20, y: 0, hp: 1000, target: 'R1' };
  const waypoint = alpha31._radialEscape(character, monster, 90, 40, 110);
  assert.ok(waypoint);
  assert.ok(Math.abs(waypoint.y) > 1, 'escape should move around the monster, not straight backward');
  assert.equal(waypoint.escape, true);
  assert.equal(waypoint.anchored, true);
  assert.equal(hotfix.stats.orbitSpiralEscapes, 1);
});

test('Alpha33 holds Merchant gear delivery until target gear is observed and still matches the goal', () => {
  const goal = {
    id: 'My_Ranger1:amulet:hpamulet:2',
    character: 'My_Ranger1', slot: 'amulet', item: 'hpamulet', observedLevel: 2,
    currentItem: 'hpamulet', currentLevel: 1, projectedUpgradeRequired: false
  };
  const candidate = { goal, item: { name: 'hpamulet', level: 2 } };
  let targetGear = {};
  const merchant = { gearDeliveryCandidate: () => candidate };
  const runtime = {
    now: () => 40000,
    log: quietLog(),
    characterRegistry: { status: () => ({ characters: [{ name: 'My_Ranger1', gear: targetGear }] }) },
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  assert.equal(merchant.gearDeliveryCandidate(), null);
  assert.equal(hotfix.stats.gearDeliveryUnknownTargetGearHolds, 1);

  targetGear = { amulet: { name: 'hpamulet', level: 1 } };
  assert.deepEqual(merchant.gearDeliveryCandidate(), candidate);

  targetGear = { amulet: { name: 'hpamulet', level: 2 } };
  assert.equal(merchant.gearDeliveryCandidate(), null);
  assert.equal(hotfix.stats.gearDeliveryStaleGoalHolds, 1);
});

test('Alpha33 reserves only the exact active self gear assignment and leaves cross-Farmer duplicates transferable', () => {
  let activeGoalIds = ['My_Ranger2:amulet:hpamulet:2'];
  const selfGoal = {
    id: 'My_Ranger1:amulet:hpamulet:2',
    character: 'My_Ranger1',
    sourceCharacter: 'My_Ranger1',
    sourceIndex: 3,
    slot: 'amulet',
    item: 'hpamulet',
    observedLevel: 2,
    currentItem: 'hpamulet',
    currentLevel: 1,
    projectedUpgradeRequired: false,
    lastSeenAt: 50000
  };
  const crossGoal = {
    ...selfGoal,
    id: 'My_Ranger2:amulet:hpamulet:2',
    character: 'My_Ranger2'
  };
  const logistics = {
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: 1 })
  };
  const runtime = {
    now: () => 50000,
    log: quietLog(),
    root: {
      character: {
        name: 'My_Ranger1',
        ctype: 'ranger',
        slots: { amulet: { name: 'hpamulet', level: 1 } }
      }
    },
    controlledPartyLogistics: logistics,
    inventoryLedger: {
      get: (_name, index) => index === 3
        ? { reservation: { goalIds: activeGoalIds } }
        : null
    },
    gearProgression: { list: () => [selfGoal, crossGoal] }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);

  const crossAssigned = logistics._safeLootDescriptor({ index: 3, name: 'hpamulet', level: 2 });
  assert.equal(crossAssigned.ok, true, 'an item actively assigned to another Farmer must still reach the Merchant');

  activeGoalIds = [selfGoal.id];
  const exactSelf = logistics._safeLootDescriptor({ index: 3, name: 'hpamulet', level: 2 });
  assert.equal(exactSelf.ok, false);
  assert.equal(exactSelf.reason, 'ACTIVE_LOCAL_GEAR_GOAL_RESERVED');
  assert.equal(hotfix.stats.farmerGearLootReservations, 1);

  const duplicate = logistics._safeLootDescriptor({ index: 4, name: 'hpamulet', level: 2 });
  assert.equal(duplicate.ok, true, 'same-name/level duplicates without the exact reservation must not inherit the hold');
});

test('Alpha33 requires Farmer pre-delivery snapshot ACK before Merchant sends gear item', async () => {
  const calls = [];
  const goal = {
    id: 'My_Ranger1:ring1:ringsj:3',
    character: 'My_Ranger1',
    slot: 'ring1',
    item: 'ringsj',
    observedLevel: 3,
    currentItem: 'ringsj',
    currentLevel: 1,
    projectedUpgradeRequired: false
  };
  const candidate = { goal, item: { index: 6, name: 'ringsj', level: 3 } };
  const merchant = {
    gearDeliveryCandidate: () => candidate,
    deliverGearGoal: async () => {
      calls.push({ kind: 'delivery' });
      return true;
    }
  };
  const logistics = {
    stats: { messagesReceived: 0, messagesRejected: 0 },
    receive: () => false,
    _isMerchant: () => true,
    _validEnvelope: () => true,
    _send: async (targetName, action, payload) => {
      calls.push({ kind: 'intent', targetName, action, payload });
      return { delivered: true };
    }
  };
  const runtime = {
    now: () => 51000,
    log: quietLog(),
    root: { character: { name: 'My_Merchant', ctype: 'merchant' } },
    characterRegistry: {
      status: () => ({
        characters: [{
          name: 'My_Ranger1',
          gear: { ring1: { name: 'ringsj', level: 1 } }
        }]
      })
    },
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, { gearDeliveryIntentAckTimeoutMs: 1000 });

  const deliveryPromise = merchant.deliverGearGoal();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(calls.length, 1, 'physical gear delivery must wait for Farmer ACK');
  assert.equal(calls[0].kind, 'intent');
  assert.equal(calls[0].targetName, 'My_Ranger1');
  assert.equal(calls[0].action, GEAR_DELIVERY_INTENT_ACTION);
  assert.equal(calls[0].payload.goalId, goal.id);
  assert.equal(calls[0].payload.slot, 'ring1');
  assert.equal(calls[0].payload.currentItem, 'ringsj');
  assert.equal(calls[0].payload.currentLevel, 1);
  assert.ok(calls[0].payload.intentToken);

  const acked = logistics.receive('My_Ranger1', {
    type: 'aio-v3-party-logistics',
    protocol: 1,
    action: GEAR_DELIVERY_INTENT_ACK_ACTION,
    sender: 'My_Ranger1',
    at: 51000,
    intentToken: calls[0].payload.intentToken,
    goalId: goal.id,
    targetName: 'My_Ranger1',
    itemName: 'ringsj',
    itemLevel: 3,
    slot: 'ring1',
    beforeIndices: [2]
  });
  assert.equal(acked, true);

  const acted = await deliveryPromise;
  assert.equal(acted, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].kind, 'delivery');
  assert.equal(hotfix.stats.gearDeliveryIntentsSent, 1);
  assert.equal(hotfix.stats.gearDeliveryIntentAcksReceived, 1);
  assert.equal(hotfix.stats.gearDeliveryIntentAckTimeouts, 0);
  assert.equal(hotfix.pendingGearDeliveryIntentAcks.size, 0);
  assert.equal(hotfix.status().policies.gearDeliveryIntentRequiresFarmerPredeliverySnapshotAck, true);
});

test('Alpha33 Farmer recognizes Merchant-delivered ready gear and equips it with closed-loop slot verification', async () => {
  let now = 52000;
  let baseTicks = 0;
  const root = {
    character: {
      name: 'My_Ranger1',
      ctype: 'ranger',
      items: [null, null, { name: 'ringsj', level: 3 }, null, null, null],
      slots: { ring1: { name: 'ringsj', level: 1 } }
    }
  };
  const snapshot = {
    character: {
      name: 'My_Ranger1',
      ctype: 'ranger',
      inventory: []
    }
  };
  const sent = [];
  const logistics = {
    stats: { messagesReceived: 0, messagesRejected: 0 },
    receive: () => false,
    _isMerchant: () => false,
    _merchantName: () => 'My_Merchant',
    _validEnvelope: () => true,
    _send: async (targetName, action, payload) => {
      sent.push({ targetName, action, payload });
      return { delivered: true };
    },
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: 1 }),
    _farmerTick: () => {
      baseTicks += 1;
      return { action: 'BASE' };
    },
    adapter: {
      snapshot: () => snapshot,
      command: (name, args) => {
        assert.equal(name, 'equip');
        assert.deepEqual(args, [5, 'ring1']);
        const [index, slot] = args;
        const replacement = root.character.items[index];
        const previous = root.character.slots[slot];
        root.character.slots[slot] = replacement;
        root.character.items[index] = previous;
        return { executed: true, value: Promise.resolve({ success: true }) };
      }
    }
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root,
    controlledPartyLogistics: logistics
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);

  const accepted = logistics.receive('My_Merchant', {
    type: 'aio-v3-party-logistics',
    protocol: 1,
    action: GEAR_DELIVERY_INTENT_ACTION,
    sender: 'My_Merchant',
    at: now,
    intentToken: 'intent-ringsj-3',
    goalId: 'My_Ranger1:ring1:ringsj:3',
    targetName: 'My_Ranger1',
    itemName: 'ringsj',
    itemLevel: 3,
    slot: 'ring1',
    currentItem: 'ringsj',
    currentLevel: 1,
    expiresAt: now + 30000
  });
  assert.equal(accepted, true);
  assert.equal(hotfix.stats.gearDeliveryIntentsReceived, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].targetName, 'My_Merchant');
  assert.equal(sent[0].action, GEAR_DELIVERY_INTENT_ACK_ACTION);
  assert.equal(sent[0].payload.intentToken, 'intent-ringsj-3');
  assert.deepEqual(sent[0].payload.beforeIndices, [2]);
  await Promise.resolve();
  assert.equal(hotfix.stats.gearDeliveryIntentAcksSent, 1);

  // Live alpha.20.107 proved that allowing the pre-existing same-identity row
  // to remain generic loot leaves a same-index reuse race: it can be sent out
  // after ACK and the incoming upgrade can land in that just-freed index.
  // Freeze the whole targeted name+level identity until equip resolves.
  const preExisting = logistics._safeLootDescriptor({ index: 2, name: 'ringsj', level: 3 });
  assert.equal(preExisting.ok, false);
  assert.equal(preExisting.reason, 'ACTIVE_LOCAL_GEAR_GOAL_RESERVED');
  assert.equal(hotfix.stats.farmerGearIntentIdentityHolds, 1);

  root.character.items[5] = { name: 'ringsj', level: 3 };
  snapshot.character.inventory = [
    { index: 2, name: 'ringsj', level: 3 },
    { index: 5, name: 'ringsj', level: 3 }
  ];
  const newlyDelivered = logistics._safeLootDescriptor({ index: 5, name: 'ringsj', level: 3 });
  assert.equal(newlyDelivered.ok, false);
  assert.equal(newlyDelivered.reason, 'ACTIVE_LOCAL_GEAR_GOAL_RESERVED');

  const first = logistics._farmerTick(snapshot);
  assert.equal(first.reason, 'LOCAL_GEAR_UPGRADE_READY');
  assert.equal(root.character.slots.ring1.level, 3);
  assert.equal(hotfix.stats.farmerGearEquipAttempts, 1);
  assert.equal(baseTicks, 0);

  now += 100;
  const second = logistics._farmerTick(snapshot);
  assert.equal(second.reason, 'LOCAL_EQUIP_VERIFIED');
  assert.equal(hotfix.stats.farmerGearEquipCommitted, 1);
  assert.equal(hotfix.incomingGearIntents.size, 0);
  assert.equal(hotfix.pendingFarmerGearEquip, null);
  assert.equal(hotfix.status().policies.targetedGearIdentityHeldOutOfGenericLootUntilEquip, true);
  assert.equal(hotfix.status().policies.farmerReceivedReadyGearAutoEquippedAndVerified, true);
  assert.equal(hotfix.status().policies.localProgressionReservationRequiresExactActivePhysicalAssignment, true);
  assert.equal(baseTicks, 0);
});

test('Alpha33 trusted Farmer state makes remote gear observable and releases stale Merchant gear goals', () => {
  const merged = [];
  const staleGoal = {
    id: 'My_Ranger1:chest:wattire:0', character: 'My_Ranger1', slot: 'chest', item: 'wattire', observedLevel: 0,
    currentItem: null, currentLevel: 0
  };
  const logistics = {
    stats: { messagesReceived: 0, messagesRejected: 0 },
    receive: () => false,
    _isMerchant: () => true,
    _validEnvelope: () => true,
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0 })
  };
  const runtime = {
    now: () => 60000,
    log: quietLog(),
    root: { character: { name: 'My_Merchant', ctype: 'merchant' }, parent: { entities: {} } },
    controlledPartyLogistics: logistics,
    characterRegistry: { _merge: (row) => merged.push(row), status: () => ({ characters: [] }) },
    gearProgression: { goals: new Map([[staleGoal.id, staleGoal]]), list: () => [] }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const accepted = logistics.receive('My_Ranger1', {
    type: 'aio-v3-party-logistics', protocol: 1, action: FARMER_STATE_ACTION,
    sender: 'My_Ranger1', at: 60000, runtimeActive: true, ctype: 'ranger', level: 59,
    map: 'main', x: -1100, y: 1200, rip: false,
    gear: { chest: { name: 'coat', level: 2 } }
  });
  assert.equal(accepted, true);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].gear.chest.name, 'coat');
  assert.equal(runtime.gearProgression.goals.has(staleGoal.id), false);
  assert.equal(hotfix.stats.farmerStateReceived, 1);
  assert.equal(hotfix.stats.farmerGearRegistryUpdates, 1);
  assert.equal(hotfix.stats.staleGearGoalsReleased, 1);
});

test('Alpha33 collection route travels only to fresh Farmer pickup positions and stays collection-owned', async () => {
  let now = 70000;
  let travelled = null;
  const merchant = {
    lastMerchantPlan: null,
    atomic: {
      merchantBusy: false,
      serviceTravelBusy: false,
      namedServiceTravel: async (destination) => { travelled = destination; return { ok: true }; }
    },
    planSellOrBank: () => null,
    planCompound: () => null,
    async cycle() {
      this.lastMerchantPlan = { at: now, action: 'IDLE', reason: 'NO_LEDGER_AUTHORIZED_ACTION' };
      return false;
    }
  };
  const logistics = {
    config: { rendezvousDistance: 260, maxTransferDistance: 380 },
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: item.q || 1 }),
    _trustedNames: () => ['My_Ranger1', 'My_Ranger2', 'My_Ranger3'],
    _send: async () => ({ sent: true })
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', x: 0, y: -37, real_x: 0, real_y: -37, items: [], isize: 42 },
      parent: { entities: {} },
      G: { items: { seashell: { type: 'material', s: 9999 } } }
    },
    adapter: { getGameData: () => ({ items: { seashell: { type: 'material', s: 9999 } } }) },
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 5000,
    collectionSettleMs: 7000,
    collectionMinPickupEntries: 2
  });

  hotfix._acceptFarmerState('My_Ranger1', {
    at: now - 12000, runtimeActive: true, ctype: 'ranger', map: 'main', x: 9000, y: 9000,
    pickupItems: [{ name: 'seashell', level: 0, quantity: 1 }]
  });
  assert.equal(hotfix._merchantRendezvousCandidate(), null, 'stale position must not become a travel target');

  hotfix._acceptFarmerState('My_Ranger1', {
    at: now, runtimeActive: true, ctype: 'ranger', map: 'main', x: -1200, y: 1040,
    pickupItems: [{ name: 'seashell', level: 0, quantity: 4 }]
  });
  hotfix._acceptFarmerState('My_Ranger2', {
    at: now, runtimeActive: true, ctype: 'ranger', map: 'main', x: -1170, y: 1220,
    pickupItems: [{ name: 'seashell', level: 0, quantity: 3 }]
  });

  const acted = await merchant.cycle();
  assert.equal(acted, true);
  assert.ok(travelled);
  assert.equal(travelled.map, 'main');
  assert.ok(travelled.x < -1000 && travelled.y > 1000);
  assert.ok(hotfix.collectionRoute);
  assert.equal(hotfix.collectionRoute.stage, 'TRAVEL_TO_FARMERS');
  assert.equal(hotfix.stats.collectionRoutesStarted, 1);
  assert.ok(hotfix.stats.staleFarmerPositionsRejected >= 1);
});


test('Alpha33 rejects a 2.9s-old kiting Farmer position even though it is inside the flat TTL', () => {
  const now = 80000;
  let refreshes = 0;
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0 },
      parent: { entities: {} }
    },
    controlledPartyLogistics: {
      _trustedNames: () => ['My_Ranger1'],
      _send: async () => { refreshes += 1; return { sent: true }; }
    }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 5000,
    farmerMovingPositionMaxError: 70,
    farmerKitePositionMaxError: 55,
    farmerStateIntervalMs: 1200
  });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now - 2900,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1038,
    y: 1138,
    speed: 55,
    moving: true,
    kiteActive: true,
    pickupItems: [{ name: 'seashell', level: 0, quantity: 5 }]
  });

  assert.equal(hotfix._merchantRendezvousCandidate(), null);
  assert.ok(hotfix.stats.motionStaleFarmerPositionsRejected >= 1);
  hotfix._requestFarmerStateRefresh();
  assert.ok(hotfix.stats.movingFarmerRefreshRequests >= 1);
  assert.equal(refreshes, 1);
});

test('Alpha33 visible Farmer position overrides an older kiting state coordinate', () => {
  const now = 90000;
  const visible = {
    id: 'r1', name: 'My_Ranger1', type: 'character', map: 'main',
    real_x: -900, real_y: 1300, speed: 55, moving: true
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0 },
      parent: { entities: { r1: visible } }
    }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 5000,
    farmerKitePositionMaxError: 55
  });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now - 2900,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1038,
    y: 1138,
    speed: 55,
    moving: true,
    kiteActive: true,
    pickupItems: [{ name: 'seashell', level: 0, quantity: 5 }]
  });

  const candidate = hotfix._merchantRendezvousCandidate();
  assert.ok(candidate);
  assert.equal(candidate.x, -900);
  assert.equal(candidate.y, 1300);
  assert.equal(candidate.positionSource, 'LIVE_VISIBLE');
  assert.equal(candidate.positionFreshness.reason, 'LIVE_VISIBLE_POSITION');
  assert.ok(hotfix.stats.liveVisibleFarmerPositionsUsed >= 1);
});

test('Alpha33 re-resolves the moving Farmer immediately before collection travel', async () => {
  const now = 100000;
  let travelled = null;
  const visible = {
    id: 'r1', name: 'My_Ranger1', type: 'character', map: 'main',
    real_x: -850, real_y: 1360, speed: 55, moving: true
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0 },
      parent: { entities: { r1: visible } }
    }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 5000,
    farmerKitePositionMaxError: 55
  });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1038,
    y: 1138,
    speed: 55,
    moving: true,
    kiteActive: true,
    pickupItems: [{ name: 'seashell', level: 0, quantity: 5 }]
  });

  const merchant = {
    lastMerchantPlan: null,
    atomic: {
      namedServiceTravel: async (destination) => {
        travelled = destination;
        return { ok: true };
      }
    }
  };
  const oldCandidate = {
    map: 'main',
    x: -1038,
    y: 1138,
    targetName: 'My_Ranger1',
    names: ['My_Ranger1'],
    pickupEntryCount: 1,
    pickupQuantity: 5,
    observedAt: now
  };

  const ok = await hotfix._travelToFreshCandidate(merchant, oldCandidate, true);
  assert.equal(ok, true);
  assert.deepEqual(travelled, { map: 'main', x: -850, y: 1360 });
  assert.equal(merchant.lastMerchantPlan.positionSource, 'LIVE_VISIBLE');
  assert.equal(hotfix.stats.collectionTravelRetargets, 1);
});

// Live alpha.20.114 regression: one advertised pickup item with 30 free slots
// must not trigger a broad BANK sweep before Farmer rendezvous. This assertion
// also guards the final generated-bundle head used by pull-request CI.
// Live alpha.20.114 follow-up: a one-item pickup must not immediately pull the
// Merchant away from useful economy work when Farmers have plenty of space.
// Keep this assertion on the final user-authored PR head after bundle generation.
test('Alpha33 defers tiny Farmer pickup batches and lets ordinary Merchant work continue', async () => {
  let now = 110000;
  let baseCycles = 0;
  let travelCalls = 0;
  const merchant = {
    lastMerchantPlan: null,
    atomic: {
      namedServiceTravel: async () => {
        travelCalls += 1;
        return { ok: true };
      }
    },
    cycle: async () => {
      baseCycles += 1;
      return true;
    }
  };
  const logistics = {
    config: { rendezvousDistance: 260, maxTransferDistance: 380 },
    _trustedNames: () => ['My_Ranger1'],
    _send: async () => ({ delivered: true })
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', x: 0, y: -37, items: [], isize: 42 },
      parent: { entities: {} }
    },
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, { farmerPositionFreshMs: 5000 });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1200,
    y: 1040,
    pickupItems: [{ name: 'ringsj', level: 0, quantity: 1 }],
    inventoryCapacity: 42,
    inventoryOccupied: 6,
    inventoryFreeSlots: 36,
    inventoryPressure: 6 / 42
  });

  const acted = await merchant.cycle();

  assert.equal(acted, true, 'ordinary Merchant cycle remains allowed while pickup batch is tiny');
  assert.equal(baseCycles, 1);
  assert.equal(travelCalls, 0);
  assert.equal(hotfix.collectionRoute, null);
  assert.ok(hotfix.lastCollectionBatchDecision);
  assert.equal(hotfix.lastCollectionBatchDecision.ready, false);
  assert.equal(hotfix.lastCollectionBatchDecision.reason, 'WAIT_FOR_EFFICIENT_BATCH');
  assert.equal(hotfix.lastCollectionBatchDecision.pickupEntryCount, 1);
  assert.equal(hotfix.status().config.collectionMinPickupEntries, 4);
  assert.equal(hotfix.status().config.collectionMinPickupQuantity, 20);
  assert.equal(hotfix.status().config.collectionFarmerPressureThreshold, 0.75);
  assert.equal(hotfix.status().config.collectionMaxBatchWaitMs, 120000);
  assert.equal(hotfix.status().policies.smallPickupDoesNotPreemptMerchantEconomy, true);
});

// A nearly full Farmer must be serviced even for a single pickup entry.
test('Alpha33 Farmer inventory pressure overrides the small pickup batch threshold', async () => {
  let now = 120000;
  let travelled = null;
  const merchant = {
    lastMerchantPlan: null,
    atomic: {
      namedServiceTravel: async (destination) => {
        travelled = destination;
        return { ok: true };
      }
    },
    cycle: async () => false
  };
  const logistics = {
    config: { rendezvousDistance: 260, maxTransferDistance: 380 },
    _trustedNames: () => ['My_Ranger1'],
    _send: async () => ({ delivered: true })
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', x: 0, y: -37, items: [], isize: 42 },
      parent: { entities: {} },
      G: { items: { ringsj: { type: 'ring', s: 1 } } }
    },
    adapter: { getGameData: () => runtime.root.G },
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, { farmerPositionFreshMs: 5000 });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1200,
    y: 1040,
    pickupItems: [{ name: 'ringsj', level: 0, quantity: 1 }],
    inventoryCapacity: 42,
    inventoryOccupied: 36,
    inventoryFreeSlots: 6,
    inventoryPressure: 36 / 42
  });

  const acted = await merchant.cycle();

  assert.equal(acted, true);
  assert.ok(hotfix.collectionRoute);
  assert.equal(hotfix.collectionRoute.batchReason, 'FARMER_INVENTORY_PRESSURE');
  assert.ok(travelled);
  assert.equal(hotfix.stats.collectionBatchStartsByPressure, 1);
});

// Tiny loot is eventually collected even when the Farmer never reaches pressure.
test('Alpha33 maximum batch wait eventually releases a persistent one-item pickup', () => {
  let now = 130000;
  const merchant = { cycle: async () => false };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'bank', x: 0, y: 0, items: [], isize: 42 },
      parent: { entities: {} }
    },
    controlledPartyLogistics: { _trustedNames: () => [], _send: async () => ({ sent: true }) },
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 12000,
    collectionMaxBatchWaitMs: 10000
  });
  const state = {
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1200,
    y: 1040,
    pickupItems: [{ name: 'ringsj', level: 0, quantity: 1 }],
    inventoryCapacity: 42,
    inventoryOccupied: 5,
    inventoryFreeSlots: 37,
    inventoryPressure: 5 / 42
  };
  hotfix._acceptFarmerState('My_Ranger1', { ...state, at: now });
  const first = hotfix._collectionStartDecision(hotfix._merchantRendezvousCandidate());
  assert.equal(first.ready, false);

  now += 10001;
  hotfix._acceptFarmerState('My_Ranger1', { ...state, at: now });
  const aged = hotfix._collectionStartDecision(hotfix._merchantRendezvousCandidate());

  assert.equal(aged.ready, true);
  assert.equal(aged.reason, 'MAX_BATCH_WAIT');
  assert.ok(aged.waitAgeMs >= 10000);
});

test('Alpha33 capacity prep performs no disposal when current Farmer pickup already fits', async () => {
  const disposed = [];
  let plannerCalls = 0;
  const merchant = {
    planSellOrBank: () => {
      plannerCalls += 1;
      return { type: 'BANK', index: 1, character: 'My_Merchant' };
    },
    executeEconomyRequest: async (request) => { disposed.push(request); return true; },
    planCompound: () => null
  };
  const root = {
    character: {
      name: 'My_Merchant', ctype: 'merchant', map: 'bank', x: 0, y: 0, isize: 6,
      items: [
        { name: 'hpot0', q: 5000 },
        { name: 'futuremat', q: 5 },
        { name: 'goalgear', level: 0, q: 1 },
        null,
        null,
        null
      ],
      bank: { items0: Array(42).fill(null) }
    },
    parent: { entities: {} },
    G: { items: { seashell: { type: 'material', s: 9999 } } }
  };
  const rows = [
    { character: 'My_Merchant', index: 0, name: 'hpot0', level: 0, q: 5000, disposition: 'KEEP' },
    { character: 'My_Merchant', index: 1, name: 'futuremat', level: 0, q: 5, disposition: 'KEEP' },
    { character: 'My_Merchant', index: 2, name: 'goalgear', level: 0, q: 1, disposition: 'RESERVE_PROGRESSION' }
  ];
  const runtime = {
    now: () => 1000,
    log: quietLog(),
    root,
    adapter: { getGameData: () => root.G },
    inventoryLedger: { list: () => rows },
    gearProgression: {
      list: () => [{
        sourceCharacter: 'My_Merchant', sourceIndex: 2, item: 'goalgear',
        observedLevel: 0, character: 'My_Ranger1', targetLevel: 5
      }]
    },
    controlledPartyLogistics: { _trustedNames: () => [], _send: async () => ({ sent: true }) },
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const candidate = {
    count: 1,
    names: ['My_Ranger1'],
    pickupEntryCount: 1,
    pickupQuantity: 1,
    rows: [{ pickupItems: [{ name: 'seashell', level: 0, quantity: 1 }] }]
  };

  const prepared = await hotfix._prepareCollectionCapacity(merchant, candidate);

  assert.equal(prepared.plan.slotsToFree, 0);
  assert.equal(prepared.ready, true);
  assert.equal(prepared.acted, false);
  assert.equal(plannerCalls, 0, 'ordinary SELL/BANK planner must not run for collection when no slot is needed');
  assert.equal(disposed.length, 0, 'no inventory item may be banked or sold just to maximize empty space');
  assert.equal(hotfix.stats.collectionCapacityDeferredBanks, 0);
  assert.equal(hotfix.status().policies.merchantCollectionFreesOnlyRequiredSlotsBeforeDeparture, true);
  assert.equal(hotfix.status().policies.collectionDeferredItemsBankedOnlyWhenRequiredForPickupCapacity, true);
});

test('Alpha33 collection capacity plan uses total Farmer pickup demand and stack headroom', () => {
  const merchant = {
    atomic: { merchantBusy: false, serviceTravelBusy: false, namedServiceTravel: async () => ({ ok: true }) },
    cycle: async () => false
  };
  const root = {
    character: {
      name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, isize: 6,
      items: [
        { name: 'seashell', level: 0, q: 8 },
        { name: 'keep1', level: 0 },
        { name: 'keep2', level: 0 },
        { name: 'keep3', level: 0 },
        { name: 'keep4', level: 0 },
        null
      ]
    },
    parent: { entities: {} },
    G: { items: { seashell: { type: 'material', s: 10 }, ringsj: { type: 'ring', s: 1 } } }
  };
  const runtime = {
    now: () => 1000,
    log: quietLog(),
    root,
    adapter: { getGameData: () => root.G },
    controlledPartyLogistics: {
      _safeLootDescriptor: () => ({ ok: true }),
      _trustedNames: () => [],
      _send: async () => ({ sent: true })
    },
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const plan = hotfix._collectionCapacityPlan({
    count: 2,
    names: ['R1', 'R2'],
    pickupEntryCount: 3,
    pickupQuantity: 5,
    rows: [
      { pickupItems: [{ name: 'seashell', level: 0, quantity: 3 }] },
      { pickupItems: [{ name: 'ringsj', level: 0, quantity: 2 }] }
    ]
  });

  assert.equal(plan.pickupQuantity, 5);
  assert.equal(plan.incomingSlotsNeeded, 3);
  assert.equal(plan.reserveSlots, 1);
  assert.equal(plan.targetFreeSlots, 4);
  assert.equal(plan.currentFreeSlots, 1);
  assert.equal(plan.slotsToFree, 3);
  const shell = plan.identities.find((row) => row.name === 'seashell');
  assert.equal(shell.existingHeadroom, 2);
  assert.equal(shell.newSlotsNeeded, 1);
});


test('Alpha33 Farmer honors explicit Merchant STATUS_REQUEST even inside telemetry throttle window', () => {
  let now = 90000;
  const sent = [];
  const snapshot = {
    character: {
      name: 'My_Ranger1', ctype: 'ranger', level: 59, map: 'main', x: -1200, y: 1040,
      inventory: [], isize: 42
    }
  };
  const logistics = {
    stats: { messagesReceived: 0, messagesRejected: 0 },
    adapter: { snapshot: () => snapshot },
    receive: () => false,
    _isMerchant: () => false,
    _merchantName: () => 'My_Merchant',
    _validEnvelope: (from, data) => from === 'My_Merchant'
      && data && data.type === 'aio-v3-party-logistics'
      && Number(data.protocol) === 1
      && data.sender === 'My_Merchant',
    _safeLootDescriptor: () => ({ ok: false, reason: 'NONE' }),
    _send: (targetName, action, payload) => {
      sent.push({ targetName, action, payload });
      return Promise.resolve({ delivered: true });
    }
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: { character: { name: 'My_Ranger1', ctype: 'ranger', level: 59, map: 'main', x: -1200, y: 1040, items: [] } },
    controlledPartyLogistics: logistics
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, { farmerStateIntervalMs: 5000 });
  hotfix.lastFarmerStateSentAt = now;

  const accepted = logistics.receive('My_Merchant', {
    type: 'aio-v3-party-logistics',
    protocol: 1,
    action: 'STATUS_REQUEST',
    sender: 'My_Merchant',
    at: now,
    reason: 'MERCHANT_COLLECTION_FRESH_POSITION_REQUIRED'
  });

  assert.equal(accepted, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].targetName, 'My_Merchant');
  assert.equal(sent[0].action, FARMER_STATE_ACTION);
  assert.equal(sent[0].payload.name, 'My_Ranger1');
  assert.equal(sent[0].payload.map, 'main');
  assert.equal(sent[0].payload.x, -1200);
  assert.equal(sent[0].payload.y, 1040);
  assert.equal(hotfix.stats.farmerStateSent, 1);
  assert.equal(logistics.stats.messagesReceived, 1);
});

test('Alpha33 bounded capacity preparation departs instead of deadlocking on rejected disposal', async () => {
  let now = 120000;
  let travelled = null;
  let disposalAttempts = 0;
  const merchant = {
    lastMerchantPlan: null,
    atomic: {
      merchantBusy: false,
      serviceTravelBusy: false,
      namedServiceTravel: async (destination) => {
        travelled = destination;
        return { ok: true };
      }
    },
    planSellOrBank: () => ({ type: 'SELL', item: { name: 'junk', level: 0, index: 0 } }),
    planCompound: () => null,
    executeEconomyRequest: async () => {
      disposalAttempts += 1;
      return false;
    },
    cycle: async () => false
  };
  const logistics = {
    config: { rendezvousDistance: 260, maxTransferDistance: 380 },
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: item.q || 1 }),
    _trustedNames: () => ['My_Ranger1'],
    _send: async () => ({ delivered: true })
  };
  const root = {
    character: {
      name: 'My_Merchant', ctype: 'merchant', map: 'bank', x: 0, y: -37, real_x: 0, real_y: -37,
      isize: 4,
      items: [
        { name: 'junk', level: 0 },
        { name: 'keep1', level: 0 },
        { name: 'keep2', level: 0 },
        null
      ]
    },
    parent: { entities: {} },
    G: { items: { ringsj: { type: 'ring', s: 1 }, junk: { type: 'material', s: 1 } } }
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root,
    adapter: { getGameData: () => root.G },
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 5000,
    collectionPrepareMaxMs: 10000
  });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1200,
    y: 1040,
    pickupItems: [{ name: 'ringsj', level: 0, quantity: 3 }]
  });
  const candidate = hotfix._merchantRendezvousCandidate();
  assert.ok(candidate);
  assert.equal(hotfix._startCollectionRoute(candidate), true);
  hotfix.collectionRoute.startedAt = now - hotfix.collectionPrepareMaxMs - 1;

  const first = await hotfix._driveMerchantRendezvous(merchant);

  assert.equal(first, true);
  assert.equal(disposalAttempts, 1);
  assert.equal(travelled, null, 'blocked capacity item is skipped before departure, not treated as successful prep');
  assert.equal(hotfix.collectionRoute.stage, 'PREPARE_CAPACITY');
  assert.equal(hotfix.stats.collectionCapacityBlockedActions, 1);

  const second = await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(second, true);
  assert.ok(travelled, 'collection may depart only after no additional safe relief candidate remains');
  assert.equal(travelled.map, 'main');
  assert.equal(hotfix.collectionRoute.stage, 'TRAVEL_TO_FARMERS');
  assert.equal(hotfix.stats.collectionCapacityPrepareTimeouts, 0);
  assert.equal(hotfix.stats.collectionCapacityConstrainedDepartures, 1);
});

// Live alpha.20.114 regression: after the advertised pickup is drained, the
// Merchant must not camp at Farmers waiting for future loot indefinitely.
test('Alpha33 drained Farmer snapshot releases collection after bounded settle window', async () => {
  let now = 145000;
  let travelCalls = 0;
  const releases = [];
  const merchant = {
    lastMerchantPlan: null,
    atomic: {
      namedServiceTravel: async () => {
        travelCalls += 1;
        return { ok: true };
      }
    },
    planSellOrBank: () => null,
    planCompound: () => null,
    executeEconomyRequest: async () => false
  };
  const logistics = {
    config: { rendezvousDistance: 260, maxTransferDistance: 380 },
    _trustedNames: () => ['My_Ranger1'],
    _send: async () => ({ delivered: true })
  };
  const coordinator = {
    heartbeat: () => true,
    release(owner, key, reason, details) {
      releases.push({ owner, key, reason, details });
      return true;
    }
  };
  const root = {
    character: {
      name: 'My_Merchant', ctype: 'merchant', map: 'main', x: -1000, y: 1000,
      isize: 4,
      items: [{ name: 'keep1' }, { name: 'keep2' }, null, null]
    },
    parent: { entities: {} }
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root,
    merchantTaskCoordinator: coordinator,
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 10000,
    collectionSettleMs: 5000
  });
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1010,
    y: 1005,
    pickupItems: []
  });
  hotfix.collectionRoute = {
    id: 'collection-drained-settle',
    startedAt: now - 30000,
    updatedAt: now - 10000,
    lastProgressAt: now - 1000,
    lastPickupQuantity: 1,
    drainedSince: null,
    stage: 'COLLECT',
    farmers: ['My_Ranger1'],
    targetMap: 'main',
    targetX: -1010,
    targetY: 1005
  };

  const first = await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(first, true);
  assert.ok(hotfix.collectionRoute);
  assert.equal(hotfix.collectionRoute.drainedSince, now);
  assert.equal(merchant.lastMerchantPlan.reason, 'WAITING_FOR_FARMER_COLLECTION_SETTLE');
  assert.equal(travelCalls, 0);
  assert.equal(releases.length, 0);

  now += 4999;
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1010,
    y: 1005,
    pickupItems: []
  });
  const beforeDeadline = await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(beforeDeadline, true);
  assert.ok(hotfix.collectionRoute, 'settle window protects in-flight Farmer updates');

  now += 1;
  hotfix._acceptFarmerState('My_Ranger1', {
    at: now,
    runtimeActive: true,
    ctype: 'ranger',
    map: 'main',
    x: -1010,
    y: 1005,
    pickupItems: []
  });
  const drained = await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(drained, true);
  assert.equal(hotfix.collectionRoute, null);
  assert.equal(hotfix.lastMerchantRendezvous.result, 'FARMER_PICKUP_DRAINED');
  assert.equal(releases.length, 1);
  assert.equal(releases[0].owner, 'RENDEZVOUS');
  assert.equal(releases[0].key, 'rendezvous:farmer-collection');
  assert.equal(releases[0].reason, 'FARMER_PICKUP_DRAINED');
  assert.equal(hotfix.status().policies.farmerDrainEndsCollectionAfterSettleWindow, true);
  assert.equal(hotfix.status().policies.collectionReturnsToEconomyAfterDrainedSettle, true);
  assert.equal(hotfix.status().policies.transientFarmerDrainDoesNotEndCollection, false);
  assert.equal(hotfix.status().policies.collectionReturnsToEconomyOnlyWhenInventoryFullOrFarmersExplicitlyUnavailable, false);
});

test('Alpha33 critical party supply preempts an active collection route', async () => {
  let now = 150000;
  let baseCycles = 0;
  let criticalSupply = {
    kind: 'RESTOCK_REQUIRED',
    target: { name: 'My_Ranger1', map: 'main', x: 0, y: 0 },
    deliveries: [{ family: 'mp', itemName: 'mpot0', quantity: 4500 }]
  };
  const releases = [];
  const coordinator = {
    release(owner, key, reason, details) {
      releases.push({ owner, key, reason, details });
      return true;
    }
  };
  const merchant = {
    criticalPartySupplyPlan: () => criticalSupply,
    cycle: async () => {
      baseCycles += 1;
      return true;
    }
  };
  const runtime = {
    now: () => now,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, items: [], isize: 42 },
      parent: { entities: {} }
    },
    merchantTaskCoordinator: coordinator,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  hotfix.collectionRoute = {
    id: 'collection-live-deadlock',
    startedAt: now - 60000,
    updatedAt: now - 1000,
    lastProgressAt: now - 30000,
    lastPickupQuantity: 95,
    stage: 'COLLECT',
    farmers: ['My_Ranger1', 'My_Ranger2', 'My_Ranger3'],
    targetMap: 'main',
    targetX: 0,
    targetY: 0
  };

  const acted = await merchant.cycle();

  assert.equal(acted, true);
  assert.equal(baseCycles, 1);
  assert.equal(hotfix.collectionRoute, null);
  assert.ok(hotfix.suspendedCollectionRoute);
  assert.equal(hotfix.suspendedCollectionRoute.id, 'collection-live-deadlock');
  assert.equal(hotfix.stats.collectionRoutesPreemptedForCriticalSupply, 1);
  assert.equal(hotfix.stats.collectionRoutesSuspendedForCriticalSupply, 1);
  assert.equal(releases.length, 1);
  assert.equal(releases[0].owner, 'RENDEZVOUS');
  assert.equal(releases[0].key, 'rendezvous:farmer-collection');
  assert.equal(releases[0].reason, 'CRITICAL_PARTY_SUPPLY_PREEMPT');
  assert.equal(releases[0].details.serviceKind, 'RESTOCK_REQUIRED');
  assert.equal(releases[0].details.target, 'My_Ranger1');
  assert.equal(hotfix.status().policies.criticalPartySupplyPreemptsCollectionRoute, true);
  assert.equal(hotfix.status().policies.criticalPartySupplySuspendsAndResumesCollection, true);

  criticalSupply = null;
  now += 1000;
  const resumed = await merchant.cycle();
  assert.equal(resumed, true);
  assert.ok(hotfix.collectionRoute);
  assert.equal(hotfix.collectionRoute.id, 'collection-live-deadlock');
  assert.equal(hotfix.suspendedCollectionRoute, null);
  assert.equal(hotfix.stats.collectionRoutesResumedAfterCriticalSupply, 1);
  assert.equal(baseCycles, 1, 'ordinary economy must not run before resumed collection');
  assert.equal(merchant.lastMerchantPlan.reason, 'WAITING_FOR_FRESH_FARMER_STATE_UNTIL_MERCHANT_FULL');
});

test('Alpha33 Farmer pickup telemetry excludes temporarily rejected loot', () => {
  const snapshot = {
    character: {
      name: 'My_Ranger1',
      ctype: 'ranger',
      level: 59,
      map: 'main',
      x: -865,
      y: 754,
      isize: 42,
      inventory: [
        { index: 0, name: 'blockedgear', level: 0, q: 1 },
        { index: 1, name: 'seashell', level: 0, q: 2 }
      ]
    }
  };
  const logistics = {
    adapter: { snapshot: () => snapshot },
    receive: () => false,
    _isMerchant: () => false,
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: item.q || 1, metadataType: 'test' }),
    _lootBlocked: (item) => item && item.name === 'blockedgear'
  };
  const runtime = {
    now: () => 160000,
    log: quietLog(),
    root: {
      character: { name: 'My_Ranger1', ctype: 'ranger', level: 59, map: 'main', x: -865, y: 754, items: snapshot.character.inventory },
      parent: { entities: {} }
    },
    controlledPartyLogistics: logistics
  };

  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const payload = hotfix._farmerStatePayload(snapshot);

  assert.equal(payload.pickupEntryCount, 1);
  assert.equal(payload.pickupQuantity, 2);
  assert.deepEqual(payload.pickupItems.map((row) => row.name), ['seashell']);
  assert.equal(payload.inventoryCapacity, 42);
  assert.equal(payload.inventoryOccupied, 2);
  assert.equal(payload.inventoryFreeSlots, 40);
  assert.ok(payload.inventoryPressure > 0 && payload.inventoryPressure < 0.1);
});

test('planned Farmer collection route keeps ownership and never defers to standalone potion travel', () => {
  let acquireCalls = 0;
  let standalonePotionStarts = 0;
  const runtime = {
    now: () => 170000,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, items: [], isize: 42 },
      parent: { entities: {} }
    },
    p0PotionPolicy4500: {
      startOpportunisticService() {
        standalonePotionStarts += 1;
        return { started: true };
      }
    },
    merchantTaskCoordinator: {
      acquire() {
        acquireCalls += 1;
        return { acquired: true };
      }
    }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const candidate = {
    names: ['My_Ranger1', 'My_Ranger2'],
    pickupEntryCount: 5,
    pickupQuantity: 30,
    map: 'main',
    x: 100,
    y: 100
  };

  const startedRoute = hotfix._startCollectionRoute(candidate, { ready: true, reason: 'PICKUP_ENTRY_BATCH' });

  assert.equal(startedRoute, true);
  assert.ok(hotfix.collectionRoute);
  assert.equal(acquireCalls, 1);
  assert.equal(standalonePotionStarts, 0, 'collection must never spawn a separate potion-service journey');
  assert.equal(hotfix.collectionRoute.potionPiggybackAttempted, false);
  assert.equal(hotfix.status().policies.plannedFarmerRoutePiggybacksPotionDeliveryAtDestination, true);
  assert.equal(hotfix.status().policies.plannedFarmerRouteNeverCreatesStandalonePotionTravel, true);
});

test('active Farmer collection only attempts potion piggyback after reaching the Farmer', async () => {
  let piggybackCalls = 0;
  let travelCalls = 0;
  const candidate = {
    names: ['My_Ranger1'],
    targetName: 'My_Ranger1',
    pickupEntryCount: 5,
    pickupQuantity: 20,
    map: 'main',
    x: 20,
    y: 0
  };
  const merchant = {
    atomic: {
      namedServiceTravel: async () => { travelCalls += 1; return { ok: true }; }
    },
    lastMerchantPlan: null
  };
  const runtime = {
    now: () => 180000,
    log: quietLog(),
    root: {
      character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 20, y: 0, items: [], isize: 42 },
      parent: { entities: {} }
    },
    p0PotionPolicy4500: {
      deliverOpportunisticNearby: async (names, reason) => {
        piggybackCalls += 1;
        assert.deepEqual(names, ['My_Ranger1']);
        assert.equal(reason, 'FARMER_COLLECTION_ROUTE');
        return { attempted: false, committed: 0, reason: 'ROUTE_FARMERS_ABOVE_OPPORTUNISTIC_THRESHOLD', results: [] };
      }
    },
    controlledPartyLogistics: {
      config: { rendezvousDistance: 260, maxTransferDistance: 380 }
    }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  hotfix._merchantRendezvousCandidate = () => candidate;
  hotfix.collectionRoute = {
    id: 'collection-piggyback',
    startedAt: 179000,
    updatedAt: 179000,
    lastProgressAt: 179000,
    lastPickupQuantity: 20,
    drainedSince: null,
    stage: 'COLLECT',
    potionPiggybackAttempted: false,
    potionPiggybackResult: null,
    farmers: ['My_Ranger1'],
    targetMap: 'main',
    targetX: 20,
    targetY: 0
  };

  const handled = await hotfix._driveMerchantRendezvous(merchant);

  assert.equal(handled, true);
  assert.equal(travelCalls, 0, 'piggyback must not create travel when already at the Farmer');
  assert.equal(piggybackCalls, 1);
  assert.equal(hotfix.collectionRoute.potionPiggybackAttempted, true);
  assert.equal(hotfix.collectionRoute.potionPiggybackResult.reason, 'ROUTE_FARMERS_ABOVE_OPPORTUNISTIC_THRESHOLD');

  await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(piggybackCalls, 1, 'one collection route must not repeatedly retry the same opportunistic top-up');
});

test('production live services wires Alpha33 before same-version early return', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/production-live-services.js'), 'utf8');
  assert.match(source, /installAlpha33MarkOrbitMerchantDelivery/);
  assert.match(source, /const liveCorrections = installAlpha33MarkOrbitMerchantDelivery\(runtime, options\)/);
  assert.match(source, /alpha33MarkOrbitMerchantDeliveryInstalled/);
  assert.match(source, /markOrbitMerchantDelivery:/);
});