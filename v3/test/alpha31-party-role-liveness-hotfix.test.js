'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  installAlpha31PartyRoleLivenessHotfix,
  MERCHANT_TRAVEL_ATTESTATION_SOURCE
} = require('../src/reliability/alpha31-party-role-liveness-hotfix');

function quietLog() { return { emit() {} }; }

function rootWithCharacter(character, extra = {}) {
  const root = { character, ...extra };
  root.parent = root;
  return root;
}

test('aggro holder uses a tangential safe orbit instead of standing still in the fire band', () => {
  const root = rootWithCharacter({ name: 'My_Ranger1', ctype: 'ranger' }, {
    can_move_to: () => true,
    G: { monsters: { poisio: { range: 25, speed: 40 } } }
  });
  const farmer = {
    kiting: {
      evaluate() { return { shouldMove: false, reason: 'DISTANCE_OK' }; }
    }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: quietLog(),
    farmer,
    adapter: { mode: 'active', getGameData: () => root.G }
  };
  installAlpha31PartyRoleLivenessHotfix(runtime);

  const character = { name: 'My_Ranger1', ctype: 'ranger', x: 150, y: 0, range: 200, speed: 55 };
  const target = { id: 'p1', mtype: 'poisio', x: 0, y: 0, hp: 1000, target: 'My_Ranger1', range: 25, speed: 40 };
  const decision = farmer.kiting.evaluate(character, target);

  assert.equal(decision.shouldMove, true);
  assert.equal(decision.reason, 'AGGRO_SAFE_ORBIT');
  assert.equal(decision.alpha31SafeOrbit, true);
  const afterDistance = Math.hypot(decision.x - target.x, decision.y - target.y);
  assert.ok(afterDistance > decision.safeEnemyDistance);
  assert.ok(afterDistance <= character.range * 0.82 + 0.01);
  assert.ok(Math.abs(decision.y) > 1, 'orbit step should be tangential, not only radial');
});

test('self-aggro ranger escapes through reachable retreat geometry when every in-range orbit is blocked', () => {
  const root = rootWithCharacter({ name: 'My_Ranger2', ctype: 'ranger' }, {
    can_move_to: () => false,
    G: { monsters: { tortoise: { range: 25, speed: 40 } } }
  });
  const farmer = {
    kiting: {
      evaluate() {
        return {
          shouldMove: false,
          reason: 'KITE_TERRAIN_BLOCKED',
          terrainBlocked: true,
          distance: 31.48,
          desiredDistance: 127.88
        };
      }
    },
    safeRetreat: {
      evaluate() {
        return {
          shouldMove: true,
          reason: 'EMERGENCY_THREAT_RETREAT',
          x: 95,
          y: 35,
          step: 72,
          terrainAware: true
        };
      }
    }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: quietLog(),
    farmer,
    adapter: { mode: 'active', getGameData: () => root.G }
  };
  const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime);
  const character = { name: 'My_Ranger2', ctype: 'ranger', x: 30, y: 0, range: 149, speed: 59 };
  const target = { id: 't1', mtype: 'tortoise', x: 0, y: 0, hp: 5000, target: 'My_Ranger2', range: 25, speed: 40 };

  const decision = farmer.kiting.evaluate(character, target);

  assert.equal(decision.shouldMove, true);
  assert.equal(decision.reason, 'AGGRO_EMERGENCY_TERRAIN_ESCAPE');
  assert.equal(decision.alpha31EmergencyTerrainEscape, true);
  assert.equal(decision.alpha31SafeOrbit, true);
  assert.ok(Math.hypot(decision.x - target.x, decision.y - target.y) > 30);
  assert.equal(hotfix.stats.aggroEmergencyTerrainEscapes, 1);
  assert.equal(hotfix.stats.aggroOrbitNoWaypoint, 0);
});

test('warrior paladin and rogue never enter kiting or emergency kite retreat while holding aggro', () => {
  for (const ctype of ['warrior', 'paladin', 'rogue']) {
    let retreats = 0;
    const name = `My_${ctype}`;
    const root = rootWithCharacter({ name, ctype }, {
      can_move_to: () => true,
      G: { monsters: { crab: { range: 25, speed: 40 } } }
    });
    const farmer = {
      kiting: {
        evaluate() {
          return {
            shouldMove: false,
            reason: 'RANGE_CAPABILITY_TOO_LOW',
            range: 25
          };
        }
      },
      safeRetreat: {
        evaluate() {
          retreats += 1;
          return {
            shouldMove: true,
            reason: 'EMERGENCY_THREAT_RETREAT',
            x: 120,
            y: 0,
            step: 90
          };
        }
      }
    };
    const runtime = {
      root,
      now: () => 1000,
      log: quietLog(),
      farmer,
      adapter: { mode: 'active', getGameData: () => root.G }
    };
    const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime);
    const character = { name, ctype, x: 20, y: 0, range: 25, speed: 55 };
    const target = { id: 'melee-target', mtype: 'crab', x: 0, y: 0, hp: 1000, target: name, range: 25, speed: 40 };

    const decision = farmer.kiting.evaluate(character, target);
    assert.equal(decision.shouldMove, false, ctype);
    assert.equal(decision.reason, 'MELEE_KITING_DISABLED', ctype);
    assert.equal(decision.meleeKitingDisabled, true, ctype);
    assert.equal(decision.alpha31SafeOrbit, false, ctype);
    assert.equal(decision.alpha31EmergencyTerrainEscape, false, ctype);
    assert.equal(retreats, 0, ctype);
    assert.equal(hotfix.stats.meleeKitingBypasses, 1, ctype);
    assert.equal(hotfix.stats.aggroEmergencyTerrainEscapes, 0, ctype);
  }
});

test('safe orbit never takes movement authority from a non-aggro ranger or emergency retreat', () => {
  const root = rootWithCharacter({ name: 'My_Ranger2', ctype: 'ranger' }, { can_move_to: () => true });
  const farmer = { kiting: { evaluate() { return { shouldMove: false, reason: 'DISTANCE_OK' }; } } };
  const runtime = { root, now: () => 1000, log: quietLog(), farmer, adapter: { mode: 'active', getGameData: () => ({ monsters: {} }) } };
  installAlpha31PartyRoleLivenessHotfix(runtime);
  const character = { name: 'My_Ranger2', x: 150, y: 0, range: 200, speed: 50 };

  assert.equal(farmer.kiting.evaluate(character, { id: 'x', mtype: 'goo', x: 0, y: 0, hp: 10, target: 'My_Ranger1' }).shouldMove, false);
  runtime.pendingEmergencyRetreat = true;
  assert.equal(farmer.kiting.evaluate(character, { id: 'y', mtype: 'goo', x: 0, y: 0, hp: 10, target: 'My_Ranger2' }).shouldMove, false);
});

test('visible leader coordinates outrank stale party coordinates', () => {
  const root = rootWithCharacter({ name: 'My_Ranger3', ctype: 'ranger' });
  const team = {
    _member(_snapshot, name) { return { name, map: 'main', x: 10, y: 20, hp: 100, max_hp: 100, mp: 100, max_mp: 100, target: null, rip: false }; },
    _visiblePlayer(snapshot, name) { return (snapshot.entities || []).find((row) => row && row.name === name) || null; },
    _followLeader() { return false; }
  };
  const runtime = { root, now: () => 1000, log: quietLog(), teamCombatCohesionHotfix: team, farmer: {}, adapter: { mode: 'active', getGameData: () => ({ maps: {} }) } };
  installAlpha31PartyRoleLivenessHotfix(runtime);

  const snapshot = { entities: [{ name: 'My_Ranger1', map: 'main', real_x: 310, real_y: 420, hp: 90, max_hp: 100 }] };
  const row = team._member(snapshot, 'My_Ranger1', 'ranger');
  assert.equal(row.x, 310);
  assert.equal(row.y, 420);
  assert.equal(row.hp, 90);
});

test('each separated follower can smart-regroup independently and retarget a moving leader', () => {
  let now = 1000;
  const commands = [];
  const supersedes = [];
  const root = rootWithCharacter({ name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: 0, y: 0 });
  const teamController = {
    followRadius: 60,
    cohesionRadius: 150,
    _member(_snapshot, name) { return { name, map: 'main', x: 0, y: 0 }; },
    _visiblePlayer() { return null; },
    _followLeader() { return false; }
  };
  const runtime = {
    root,
    now: () => now,
    log: quietLog(),
    farmer: { state: 'ASSESS', targetId: null },
    teamCombatCohesionHotfix: teamController,
    adapter: {
      mode: 'active',
      getGameData: () => ({ maps: { main: {} } }),
      command(action, args) { commands.push({ action, args }); return { executed: true }; },
      supersedeMovement(reason) { supersedes.push(reason); return true; }
    }
  };
  const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime, { regroupTriggerDistance: 120, regroupRetargetMs: 1000, regroupRetargetDistance: 30 });
  const context = { snapshot: { character: root.character, entities: [] }, adapter: runtime.adapter };
  const team = {
    selfName: 'My_Ranger3', leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger3', map: 'main', x: 0, y: 0 },
    leader: { name: 'My_Ranger1', map: 'main', x: 300, y: 0 },
    sameMap: true, positionsKnown: true, cohesive: false
  };

  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.equal(commands[0].action, 'smart_move');
  assert.equal(commands[0].args[0].x, 300);
  assert.equal(hotfix.status().followerRegroup.independentFollowers, true);

  now = 2500;
  team.leader = { ...team.leader, x: 380 };
  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.ok(commands.some((row) => row.action === 'stop'));
  assert.equal(commands.at(-1).action, 'smart_move');
  assert.equal(commands.at(-1).args[0].x, 380);
  assert.equal(hotfix.stats.followerSmartRetargets, 1);
  assert.equal(supersedes.length, 1);
  assert.match(supersedes[0], /LEADER_POSITION_REFRESH/);
});

test('active follower smart regroup yields immediately to combat or emergency safety ownership', () => {
  const commands = [];
  const supersedes = [];
  const root = rootWithCharacter({ name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: 0, y: 0 });
  const teamController = {
    followRadius: 60,
    cohesionRadius: 150,
    _member(_snapshot, name) { return { name, map: 'main', x: 0, y: 0 }; },
    _visiblePlayer() { return null; },
    _followLeader() { throw new Error('base follow must not reclaim movement in the safety-preemption tick'); }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: quietLog(),
    farmer: { state: 'ASSESS', targetId: null },
    teamCombatCohesionHotfix: teamController,
    adapter: {
      mode: 'active',
      getGameData: () => ({ maps: { main: {} } }),
      command(action, args) { commands.push({ action, args }); return { executed: true }; },
      supersedeMovement(reason) { supersedes.push(reason); return true; }
    }
  };
  const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime, { regroupTriggerDistance: 120 });
  const context = { snapshot: { character: root.character, entities: [] }, adapter: runtime.adapter };
  const team = {
    selfName: 'My_Ranger3', leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger3', map: 'main', x: 0, y: 0 },
    leader: { name: 'My_Ranger1', map: 'main', x: 300, y: 0 },
    sameMap: true, positionsKnown: true, cohesive: false
  };

  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.ok(hotfix.followerSmartMove);
  runtime.pendingEmergencyRetreat = { reason: 'LOW_HP' };
  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.equal(hotfix.followerSmartMove, null);
  assert.deepEqual(commands.map((row) => row.action), ['smart_move', 'stop']);
  assert.equal(supersedes.length, 1);
  assert.match(supersedes[0], /COMBAT_OR_SAFETY_PREEMPTION/);
  assert.equal(hotfix.stats.followerSmartSafetyPreemptions, 1);
});

test('failed follower smart regroup clears the pending movement outcome so a later tick can retry', async () => {
  let smartMoves = 0;
  let pendingMovement = false;
  const supersedes = [];
  const root = rootWithCharacter({ name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: 0, y: 0 });
  const teamController = {
    followRadius: 60,
    cohesionRadius: 150,
    _member(_snapshot, name) { return { name, map: 'main', x: 0, y: 0 }; },
    _visiblePlayer() { return null; },
    _followLeader() { return false; }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: quietLog(),
    farmer: { state: 'ASSESS', targetId: null },
    teamCombatCohesionHotfix: teamController,
    adapter: {
      mode: 'active',
      getGameData: () => ({ maps: { main: {} } }),
      command(action) {
        if (action !== 'smart_move') return { executed: true };
        if (pendingMovement) return { executed: true, accepted: false, coalesced: true, reason: 'MOVE_OUTCOME_PENDING' };
        pendingMovement = true;
        smartMoves += 1;
        return { executed: true, value: Promise.resolve({ failed: true, reason: 'NO_PATH' }) };
      },
      supersedeMovement(reason) {
        pendingMovement = false;
        supersedes.push(reason);
        return true;
      }
    }
  };
  const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime, { regroupTriggerDistance: 120 });
  const context = { snapshot: { character: root.character, entities: [] }, adapter: runtime.adapter };
  const team = {
    selfName: 'My_Ranger3', leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger3', map: 'main', x: 0, y: 0 },
    leader: { name: 'My_Ranger1', map: 'main', x: 300, y: 0 },
    sameMap: true, positionsKnown: true, cohesive: false
  };

  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.ok(hotfix.followerSmartMove);
  assert.equal(pendingMovement, true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(hotfix.followerSmartMove, null);
  assert.equal(hotfix.stats.followerSmartFailures, 1);
  assert.equal(pendingMovement, false);
  assert.equal(supersedes.length, 1);
  assert.match(supersedes[0], /FOLLOWER_SMART_MOVE_FAILED/);
  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.equal(smartMoves, 2);
});

test('coalesced foreign movement is not claimed as an Alpha31 smart regroup', () => {
  const root = rootWithCharacter({ name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: 0, y: 0 });
  const teamController = {
    followRadius: 60,
    cohesionRadius: 150,
    _member(_snapshot, name) { return { name, map: 'main', x: 0, y: 0 }; },
    _visiblePlayer() { return null; },
    _followLeader() { return false; }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: quietLog(),
    farmer: { state: 'ASSESS', targetId: null },
    teamCombatCohesionHotfix: teamController,
    adapter: {
      mode: 'active',
      getGameData: () => ({ maps: { main: {} } }),
      command(action) {
        if (action === 'smart_move') return { executed: true, accepted: false, coalesced: true, reason: 'MOVE_OUTCOME_PENDING' };
        return { executed: true };
      }
    }
  };
  const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime, { regroupTriggerDistance: 120 });
  const context = { snapshot: { character: root.character, entities: [] }, adapter: runtime.adapter };
  const team = {
    selfName: 'My_Ranger3', leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger3', map: 'main', x: 0, y: 0 },
    leader: { name: 'My_Ranger1', map: 'main', x: 300, y: 0 },
    sameMap: true, positionsKnown: true, cohesive: false
  };

  assert.equal(teamController._followLeader(context, team, 'REGROUP'), true);
  assert.equal(hotfix.followerSmartMove, null);
  assert.equal(hotfix.stats.followerSmartCoalescedHolds, 1);
});

test('merchant service uses batch potion hysteresis and a narrow service-travel attestation', () => {
  let merchantTicks = 0;
  let capturedContext = null;
  const root = rootWithCharacter({ name: 'My_Merchant', ctype: 'merchant', map: 'main' });
  const safeTravel = { _trustedMapAttestation() { return null; } };
  const runtime = {
    root,
    now: () => 10000,
    log: quietLog(),
    merchantServicePlanner: { lowPotionCount: 4499, targetPotionCount: 4500, criticalPotionCount: 1000 },
    p0PotionPolicy4500: { installed: true, lowWatermark: 4499 },
    safeTravel,
    adapter: { mode: 'active', getGameData: () => ({ maps: { main: {}, bank: {} } }) },
    planTravel(request, context = {}) { capturedContext = context; return { accepted: true, request, context }; },
    alpha27CombatMerchantConvergence: { merchant: { tick() { merchantTicks += 1; return true; } } }
  };
  const hotfix = installAlpha31PartyRoleLivenessHotfix(runtime, { merchantPotionLowWatermark: 3500 });
  hotfix.beforeTick();

  assert.equal(runtime.merchantServicePlanner.lowPotionCount, 3500);
  assert.equal(runtime.p0PotionPolicy4500.lowWatermark, 3500);
  assert.equal(merchantTicks, 1);

  runtime.planTravel({ destination: 'bank', metadata: { source: 'ALPHA27_MERCHANT_SERVICE_TRAVEL', requestedDestination: 'bank' } });
  assert.equal(capturedContext.destinationMapAttestation.source, MERCHANT_TRAVEL_ATTESTATION_SOURCE);
  const accepted = safeTravel._trustedMapAttestation('bank', capturedContext);
  assert.equal(accepted.source, MERCHANT_TRAVEL_ATTESTATION_SOURCE);

  capturedContext = null;
  runtime.planTravel({ destination: 'bank', metadata: { source: 'FARMER_TRAVEL' } });
  assert.equal(capturedContext.destinationMapAttestation, undefined);
});