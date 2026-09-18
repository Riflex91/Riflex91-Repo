'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RetreatFarmerController } = require('../src/farmer/retreat-farmer');
const { installFarmerTerrainNavigationHotfix } = require('../src/farmer/farmer-terrain-navigation-hotfix');

function planner() {
  return { rank: (rows) => rows.map((row, index) => ({ ...row, score: 1 - index * 0.1 })) };
}

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 408, max_mp: 815,
    range: 120, speed: 40, frequency: 2, rip: false,
    inventory: [{ index: 0, name: 'mpot0', q: 100 }, { index: 1, name: 'hpot0', q: 100 }],
    ...overrides
  };
}

function monster(overrides = {}) {
  return {
    id: 'm1', mtype: 'goo', map: 'main', x: 20, y: 0,
    hp: 1000, max_hp: 1000, target: 'R1', dead: false,
    ...overrides
  };
}

function supershotSkills() {
  return {
    supershot: {
      type: 'skill', class: ['ranger'], hostile: true, target: true,
      name: 'Supershot', mp: 400, level: 30, cooldown: 30000,
      damage_multiplier: 1.5, wtype: ['bow', 'crossbow']
    }
  };
}

function makeRuntime({ canMoveTo = () => true, now = () => 10000 } = {}) {
  const farmer = new RetreatFarmerController({
    now,
    planner: planner(),
    attackIntervalMs: 250,
    kitingMoveCooldownMs: 250
  });
  const root = { can_move_to: canMoveTo, parent: {} };
  const runtime = { root, farmer, now, log: { emit() {} } };
  const hotfix = installFarmerTerrainNavigationHotfix(runtime);
  return { farmer, hotfix, root };
}

function context(farmer, { c = character(), target = monster(), commands = [], gameSkills = {}, canUseSkill = () => true } = {}) {
  return {
    snapshot: { observedAt: 10000, character: c, entities: [target], party: [] },
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { goo: { xp: 100 } }, skills: gameSkills }),
      canAttack: () => true,
      canUseSkill,
      isSkillInRange: () => true,
      command: (action, args = []) => {
        commands.push({ action, args });
        return { executed: true };
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: c.name, ctype: c.ctype }], fingerprint: `${c.ctype}:1` },
    runtime: {}
  };
}

test('Alpha20.12 raises ranged kite distance and removes the routine offensive MP reserve', () => {
  const { farmer, hotfix } = makeRuntime();
  assert.equal(farmer.kiting.tooCloseFactor, 0.62);
  assert.equal(farmer.kiting.desiredFactor, 0.86);
  assert.equal(farmer.kiting.maxStepFactor, 0.5);
  assert.equal(farmer.skillUsage.mpReserveRatio, 0);
  assert.equal(farmer.skillUsage.minIntervalMs, 250);
  assert.equal(hotfix.status().combatMovement.orbitalKiting, true);
  assert.equal(hotfix.status().skillRotation.reserveRatio, 0);
});

test('blocked radial kite chooses a reachable orbital waypoint while continuing damage', () => {
  let now = 10000;
  const commands = [];
  const { farmer, hotfix } = makeRuntime({
    now: () => now,
    // Wall directly west of the character: straight-away kiting is blocked,
    // while a tangential/orbital step with x near zero remains reachable.
    canMoveTo: (x) => Number(x) >= -1
  });
  const ctx = context(farmer, { commands, target: monster({ x: 20, target: 'R1' }) });

  farmer.step(ctx);
  farmer.step(ctx);
  now += 1000;
  farmer.step(ctx);

  const move = commands.findLast((entry) => entry.action === 'move');
  assert.ok(move, 'Expected an orbital kite move before attacking');
  assert.ok(move.args[0] >= -1);
  assert.ok(Math.abs(move.args[1]) > 1);
  assert.equal(commands.at(-1).action, 'attack');
  const status = hotfix.status();
  assert.ok(status.stats.kiteOrbitalWaypoints >= 1);
  assert.notEqual(status.combatMovement.lastKiteDecision.offsetDeg, 0);
});

test('fully blocked kite emits no doomed movement command and still allows damage', () => {
  let now = 10000;
  const commands = [];
  const { farmer, hotfix } = makeRuntime({ now: () => now, canMoveTo: () => false });
  const ctx = context(farmer, { commands, target: monster({ x: 20, target: 'R1' }), gameSkills: {} });

  farmer.step(ctx);
  farmer.step(ctx);
  now += 1000;
  farmer.step(ctx);

  assert.equal(commands.some((row) => row.action === 'move'), false);
  assert.equal(commands.at(-1).action, 'attack');
  assert.ok(hotfix.status().stats.kiteNoReachableWaypoint >= 1);
  assert.equal(hotfix.status().combatMovement.lastKiteDecision.reason, 'KITE_TERRAIN_BLOCKED');
});

test('emergency retreat uses a reachable angled escape when straight retreat is walled off', () => {
  const { farmer, hotfix } = makeRuntime({ canMoveTo: (x) => Number(x) >= -1 });
  const c = character({ x: 0, y: 0 });
  const threats = [{ id: 't1', x: 20, y: 0, mtype: 'goo' }];
  const decision = farmer.safeRetreat.evaluate(c, threats);

  assert.equal(decision.shouldMove, true);
  assert.ok(decision.x >= -1);
  assert.notEqual(decision.terrainOffsetDeg, 0);
  assert.ok(hotfix.status().stats.retreatAlternateWaypoints >= 1);
});

test('emergency retreat refuses an unreachable move instead of poisoning the movement circuit', () => {
  const { farmer, hotfix } = makeRuntime({ canMoveTo: () => false });
  const decision = farmer.safeRetreat.evaluate(character(), [{ id: 't1', x: 20, y: 0, mtype: 'goo' }]);
  assert.equal(decision.shouldMove, false);
  assert.equal(decision.reason, 'RETREAT_TERRAIN_BLOCKED');
  assert.equal(hotfix.status().stats.retreatNoReachableWaypoint, 1);
});

test('Ranger supershot is eligible at 408/815 MP when the live cooldown helper says ready', () => {
  const { farmer } = makeRuntime();
  const result = farmer.skillUsage.evaluate(
    { character: character({ mp: 408, max_mp: 815 }) },
    monster({ x: 70 }),
    { skills: supershotSkills() },
    { canUseSkill: () => true, isSkillInRange: () => true }
  );
  assert.equal(result.useSkill, true);
  assert.equal(result.skill.id, 'supershot');
  assert.equal(result.mpAfter, 8);
  assert.equal(result.reserveMp, 0);
});

test('shared combat skill policy rotates to another safe class skill while the top skill is on cooldown', () => {
  const { farmer } = makeRuntime();
  const mage = character({ name: 'Mage1', ctype: 'mage', mp: 500, max_mp: 500 });
  const skills = {
    burst: {
      type: 'skill', class: ['mage'], hostile: true, target: true,
      name: 'Burst', mp: 100, level: 1, cooldown: 1200, damage_multiplier: 2
    },
    zap: {
      type: 'skill', class: ['mage'], hostile: true, target: true,
      name: 'Zap', mp: 50, level: 1, cooldown: 500, damage_multiplier: 1.2
    },
    unsafeAura: {
      type: 'skill', class: ['mage'], hostile: false, target: false,
      name: 'Aura', mp: 10, level: 1, cooldown: 500, damage_multiplier: 3
    }
  };
  const result = farmer.skillUsage.evaluate(
    { character: mage },
    monster({ x: 70, target: 'Mage1' }),
    { skills },
    {
      canUseSkill: (id) => id !== 'burst',
      isSkillInRange: () => true
    }
  );
  assert.equal(result.useSkill, true);
  assert.equal(result.skill.id, 'zap');
  assert.equal(result.candidateRank, 2);
  assert.equal(result.rejectedCandidates[0].reason, 'SKILL_COOLDOWN_OR_REQUIREMENT');
  assert.equal(farmer.skillUsage.candidates(mage, { skills }).some((skill) => skill.id === 'unsafeAura'), false);
});
