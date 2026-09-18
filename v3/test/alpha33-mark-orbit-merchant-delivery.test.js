'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  Alpha33MarkOrbitMerchantDelivery,
  effectActiveOn,
  FARMER_STATE_ACTION,
  GEAR_DELIVERY_INTENT_ACTION
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

test('Alpha33 blocks persisted gear goals that are impossible for the target class slot', () => {
  const goal = {
    id: 'My_Ranger1:offhand:shield:0',
    character: 'My_Ranger1',
    slot: 'offhand',
    item: 'shield',
    observedLevel: 0,
    currentItem: 'quiver',
    currentLevel: 3,
    projectedUpgradeRequired: false
  };
  const candidate = { goal, item: { index: 4, name: 'shield', level: 0 } };
  const merchant = { gearDeliveryCandidate: () => candidate };
  const gameData = {
    classes: {
      ranger: {
        mainhand: { bow: {} },
        doublehand: { fist: {}, dagger: {} },
        offhand: { quiver: {} }
      }
    },
    items: {
      shield: { type: 'shield', armor: 60 },
      bow: { type: 'weapon', wtype: 'bow', attack: 40 },
      quiver: { type: 'quiver', dex: 12 }
    }
  };
  const runtime = {
    now: () => 49500,
    log: quietLog(),
    root: { character: { name: 'My_Merchant', ctype: 'merchant' }, G: gameData },
    adapter: { getGameData: () => gameData },
    characterRegistry: {
      status: () => ({
        characters: [{
          name: 'My_Ranger1',
          ctype: 'ranger',
          level: 60,
          gear: {
            mainhand: { name: 'bow', level: 5 },
            offhand: { name: 'quiver', level: 3 }
          }
        }]
      })
    },
    alpha27CombatMerchantConvergence: { merchant }
  };

  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);

  assert.equal(merchant.gearDeliveryCandidate(), null);
  assert.equal(hotfix.stats.gearDeliveryIncompatibleGoalHolds, 1);
  assert.equal(hotfix.lastGearHold.reason, 'TARGET_ITEM_SLOT_INCOMPATIBLE');
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

test('Alpha33 sends a targeted Farmer equip intent before Merchant gear delivery', async () => {
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
    controlledPartyLogistics: {
      _send: async (targetName, action, payload) => {
        calls.push({ kind: 'intent', targetName, action, payload });
        return { delivered: true };
      }
    },
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);

  const acted = await merchant.deliverGearGoal();

  assert.equal(acted, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].kind, 'intent');
  assert.equal(calls[0].targetName, 'My_Ranger1');
  assert.equal(calls[0].action, GEAR_DELIVERY_INTENT_ACTION);
  assert.equal(calls[0].payload.goalId, goal.id);
  assert.equal(calls[0].payload.slot, 'ring1');
  assert.equal(calls[0].payload.currentItem, 'ringsj');
  assert.equal(calls[0].payload.currentLevel, 1);
  assert.equal(calls[1].kind, 'delivery');
  assert.equal(hotfix.stats.gearDeliveryIntentsSent, 1);
});

test('Alpha33 Farmer recognizes Merchant-delivered ready gear and equips it with closed-loop slot verification', async () => {
  let now = 52000;
  let baseTicks = 0;
  const root = {
    character: {
      name: 'My_Ranger1',
      ctype: 'ranger',
      items: [null, null, null, null, null, null],
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
  const logistics = {
    stats: { messagesReceived: 0, messagesRejected: 0 },
    receive: () => false,
    _isMerchant: () => false,
    _merchantName: () => 'My_Merchant',
    _validEnvelope: () => true,
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

  root.character.items[5] = { name: 'ringsj', level: 3 };
  snapshot.character.inventory = [{ index: 5, name: 'ringsj', level: 3 }];

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
  assert.equal(hotfix.status().policies.farmerReceivedReadyGearAutoEquippedAndVerified, true);
  assert.equal(hotfix.status().policies.localProgressionReservationRequiresExactActivePhysicalAssignment, true);
  assert.equal(baseTicks, 0);
});

test('Alpha33 targeted gear intent blocks same-identity loot and can equip an item from a pre-existing reused index', () => {
  let now = 55000;
  let baseTicks = 0;
  const root = {
    character: {
      name: 'My_Ranger2',
      ctype: 'ranger',
      items: [null, null, null, null, null, { name: 'ringsj', level: 3 }],
      slots: { ring2: { name: 'ringsj', level: 1 } }
    }
  };
  const snapshot = {
    character: {
      name: 'My_Ranger2',
      ctype: 'ranger',
      inventory: [{ index: 5, name: 'ringsj', level: 3 }]
    }
  };
  const logistics = {
    stats: { messagesReceived: 0, messagesRejected: 0 },
    receive: () => false,
    _isMerchant: () => false,
    _merchantName: () => 'My_Merchant',
    _validEnvelope: () => true,
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: 1 }),
    _farmerTick: () => {
      baseTicks += 1;
      return { action: 'BASE' };
    },
    adapter: {
      snapshot: () => snapshot,
      command: (name, args) => {
        assert.equal(name, 'equip');
        assert.deepEqual(args, [5, 'ring2']);
        const [index, slot] = args;
        const replacement = root.character.items[index];
        const previous = root.character.slots[slot];
        root.character.slots[slot] = replacement;
        root.character.items[index] = previous;
        snapshot.character.inventory = [{ index, ...root.character.items[index] }];
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
    goalId: 'My_Ranger2:ring2:ringsj:3',
    targetName: 'My_Ranger2',
    itemName: 'ringsj',
    itemLevel: 3,
    slot: 'ring2',
    currentItem: 'ringsj',
    currentLevel: 1,
    expiresAt: now + 30000
  });
  assert.equal(accepted, true);
  assert.deepEqual(hotfix.incomingGearIntents.get('My_Ranger2:ring2:ringsj:3').beforeIndices, [5]);

  const held = logistics._safeLootDescriptor({ index: 5, name: 'ringsj', level: 3 });
  assert.equal(held.ok, false, 'the old identical row must be held so it cannot ping-pong during targeted delivery');
  assert.equal(held.reason, 'ACTIVE_LOCAL_GEAR_GOAL_RESERVED');
  assert.equal(hotfix.stats.farmerGearIntentLootHolds, 1);

  const first = logistics._farmerTick(snapshot);
  assert.equal(first.reason, 'LOCAL_GEAR_UPGRADE_READY');
  assert.equal(root.character.slots.ring2.name, 'ringsj');
  assert.equal(root.character.slots.ring2.level, 3);
  assert.equal(hotfix.stats.farmerGearEquipAttempts, 1);
  assert.equal(baseTicks, 0);

  now += 100;
  const second = logistics._farmerTick(snapshot);
  assert.equal(second.reason, 'LOCAL_EQUIP_VERIFIED');
  assert.equal(hotfix.stats.farmerGearEquipCommitted, 1);
  assert.equal(hotfix.incomingGearIntents.size, 0);
  assert.equal(hotfix.status().policies.targetedGearIdentityHeldOutOfFarmerLootUntilEquip, true);
  assert.equal(hotfix.status().policies.existingEquivalentGearMaySatisfyTargetedIntent, true);
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
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, { farmerPositionFreshMs: 5000, collectionSettleMs: 7000 });

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

test('Alpha33 capacity prep banks deferred items even when current Farmer pickup already fits', async () => {
  const banked = [];
  const merchant = {
    planSellOrBank: () => null,
    executeEconomyRequest: async (request) => { banked.push(request); return true; },
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
    parent: { entities: {} }
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

  assert.equal(prepared.ready, false, 'pickup already fits, but safe deferred bank work must still run');
  assert.equal(banked.length, 1);
  assert.equal(banked[0].type, 'BANK');
  assert.equal(banked[0].index, 1);
  assert.equal(banked[0].metadata.collectionCapacityPrep, true);
  assert.equal(banked[0].metadata.originalDisposition, 'KEEP');
  assert.equal(hotfix.stats.collectionCapacityDeferredBanks, 1);
  assert.equal(hotfix._collectionDeferredBankRequest().index, 1, 'test fixture is unchanged until execution commits');
  assert.equal(banked.some((row) => row.index === 0), false, 'operational potion stack must stay local');
  assert.equal(banked.some((row) => row.index === 2), false, 'active Farmer gear goal must stay local for delivery');
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

// Live alpha.20.104 regression: temporary zero pickup demand must not release a half-empty Merchant.
test('Alpha33 drained Farmer snapshot keeps collection at Farmers until one Merchant reserve slot remains', async () => {
  let now = 145000;
  let travelCalls = 0;
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
    controlledPartyLogistics: logistics,
    alpha27CombatMerchantConvergence: { merchant }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime, {
    farmerPositionFreshMs: 5000,
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
    id: 'collection-stay-until-full',
    startedAt: now - 30000,
    updatedAt: now - 10000,
    lastProgressAt: now - 20000,
    lastPickupQuantity: 0,
    stage: 'COLLECT',
    farmers: ['My_Ranger1'],
    targetMap: 'main',
    targetX: -1010,
    targetY: 1005
  };

  const held = await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(held, true);
  assert.ok(hotfix.collectionRoute, 'transient drained state must not end collection');
  assert.equal(hotfix.collectionRoute.stage, 'COLLECT');
  assert.equal(merchant.lastMerchantPlan.reason, 'WAITING_FOR_NEW_FARMER_LOOT_UNTIL_MERCHANT_FULL');
  assert.equal(merchant.lastMerchantPlan.freeSlots, 2);
  assert.equal(travelCalls, 0);
  assert.equal(hotfix.stats.collectionDrainedWaits, 1);

  root.character.items[2] = { name: 'loot1' };
  now += 100;

  const full = await hotfix._driveMerchantRendezvous(merchant);
  assert.equal(full, true);
  assert.equal(hotfix.collectionRoute, null);
  assert.equal(hotfix.lastMerchantRendezvous.result, 'MERCHANT_PICKUP_RESERVE_REACHED');
  assert.equal(hotfix.lastMerchantRendezvous.details.occupied, 3);
  assert.equal(hotfix.lastMerchantRendezvous.details.capacity, 4);
  assert.equal(hotfix.lastMerchantRendezvous.details.freeSlots, 1);
  assert.equal(hotfix.lastMerchantRendezvous.details.reserveSlots, 1);
  assert.equal(hotfix.status().policies.transientFarmerDrainDoesNotEndCollection, true);
  assert.equal(hotfix.status().policies.collectionReturnsToEconomyOnlyWhenInventoryFullOrFarmersExplicitlyUnavailable, true);
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
});

test('production live services wires Alpha33 before same-version early return', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/production-live-services.js'), 'utf8');
  assert.match(source, /installAlpha33MarkOrbitMerchantDelivery/);
  assert.match(source, /const liveCorrections = installAlpha33MarkOrbitMerchantDelivery\(runtime, options\)/);
  assert.match(source, /alpha33MarkOrbitMerchantDeliveryInstalled/);
  assert.match(source, /markOrbitMerchantDelivery:/);
});