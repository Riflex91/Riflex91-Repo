'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  Alpha33MarkOrbitMerchantDelivery,
  effectActiveOn
} = require('../src/reliability/alpha33-mark-orbit-merchant-delivery');

function quietLog() { return { emit() {} }; }

function target(id = 'm1') {
  return { id, mtype: 'tortoise', hp: 10000, max_hp: 10000, x: 20, y: 0, target: 'R1', dead: false };
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

test('Alpha33 prevents locally useful progression gear from immediately returning as generic Farmer loot', () => {
  const logistics = {
    _safeLootDescriptor: (item) => ({ ok: true, name: item.name, level: item.level || 0, quantity: 1 })
  };
  const runtime = {
    now: () => 50000,
    log: quietLog(),
    root: { character: { name: 'My_Ranger1', ctype: 'ranger' } },
    controlledPartyLogistics: logistics,
    gearProgression: {
      list: () => [{
        id: 'My_Ranger1:amulet:hpamulet:2', character: 'My_Ranger1', item: 'hpamulet',
        observedLevel: 2, projectedUpgradeRequired: false
      }]
    }
  };
  const hotfix = new Alpha33MarkOrbitMerchantDelivery(runtime);
  const descriptor = logistics._safeLootDescriptor({ name: 'hpamulet', level: 2 });
  assert.equal(descriptor.ok, false);
  assert.equal(descriptor.reason, 'ACTIVE_LOCAL_GEAR_GOAL_RESERVED');
  assert.equal(hotfix.stats.farmerGearLootReservations, 1);
  assert.equal(logistics._safeLootDescriptor({ name: 'ringsj', level: 0 }).ok, true);
});

test('production live services wires Alpha33 before same-version early return', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/production-live-services.js'), 'utf8');
  assert.match(source, /installAlpha33MarkOrbitMerchantDelivery/);
  assert.match(source, /const liveCorrections = installAlpha33MarkOrbitMerchantDelivery\(runtime, options\)/);
  assert.match(source, /alpha33MarkOrbitMerchantDeliveryInstalled/);
  assert.match(source, /markOrbitMerchantDelivery:/);
});
