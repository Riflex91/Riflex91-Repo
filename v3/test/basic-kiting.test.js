'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BasicKitingPolicy } = require('../src/farmer/basic-kiting');
const { KitingFarmerController } = require('../src/farmer/kiting-farmer');
const { FarmerState } = require('../src/farmer/farmer-fsm');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 50, map: 'main',
    x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    range: 120, speed: 40, frequency: 2, rip: false,
    inventory: [{ index: 0, name: 'hpot0', q: 10 }],
    ...overrides
  };
}

function monster(overrides = {}) {
  return {
    id: 'm1', mtype: 'goo', map: 'main', x: 20, y: 0,
    hp: 100, max_hp: 100, target: null, dead: false,
    ...overrides
  };
}

function planner() {
  return { rank: (rows) => rows.map((row, index) => ({ ...row, score: 1 - index * 0.1 })) };
}

function context({ target = monster(), commands = [] } = {}) {
  return {
    snapshot: { observedAt: 10000, character: character(), entities: [target], party: [] },
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { goo: { xp: 100 } } }),
      canAttack: () => true,
      command: (action, args = []) => {
        commands.push({ action, args });
        return { executed: true };
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: {}
  };
}

test('BasicKitingPolicy is capability based and does not kite short-range characters', () => {
  const policy = new BasicKitingPolicy();
  const result = policy.evaluate(character({ range: 55 }), monster({ x: 10, target: 'R1' }));
  assert.equal(result.shouldMove, false);
  assert.equal(result.reason, 'RANGE_CAPABILITY_TOO_LOW');
});

test('BasicKitingPolicy moves directly away when a self-focused target is too close', () => {
  const policy = new BasicKitingPolicy();
  const result = policy.evaluate(character(), monster({ x: 20, target: 'R1' }));
  assert.equal(result.shouldMove, true);
  assert.equal(result.reason, 'TARGET_TOO_CLOSE');
  assert.ok(result.x < 0);
  assert.equal(result.y, 0);
  assert.ok(result.step > 0);
});

test('BasicKitingPolicy does not reposition a target focused on somebody else', () => {
  const policy = new BasicKitingPolicy();
  const result = policy.evaluate(character(), monster({ x: 20, target: 'PartyMate' }));
  assert.equal(result.shouldMove, false);
  assert.equal(result.reason, 'TARGET_FOCUSED_ELSEWHERE');
});

test('KitingFarmer requests a move and keeps attacking when the target is too close', () => {
  let now = 10000;
  const commands = [];
  const farmer = new KitingFarmerController({ now: () => now, planner: planner(), attackIntervalMs: 250, kitingMoveCooldownMs: 250 });
  const ctx = context({ target: monster({ x: 20, target: 'R1' }), commands });

  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.state, FarmerState.ENGAGE);
  now += 1000;
  farmer.step(ctx);

  const tail = commands.slice(-2);
  assert.deepEqual(tail.map((entry) => entry.action), ['move', 'attack']);
  assert.ok(tail[0].args[0] < 0);
  assert.deepEqual(tail[1].args, ['m1']);
  assert.equal(farmer.status().kiting.lastMove.targetId, 'm1');
});

test('KitingFarmer preserves normal attack behavior when distance is already safe', () => {
  let now = 10000;
  const commands = [];
  const farmer = new KitingFarmerController({ now: () => now, planner: planner(), attackIntervalMs: 250 });
  const ctx = context({ target: monster({ x: 70, target: 'R1' }), commands });

  farmer.step(ctx);
  farmer.step(ctx);
  now += 1000;
  farmer.step(ctx);

  assert.equal(commands.at(-1).action, 'attack');
  assert.deepEqual(commands.at(-1).args, ['m1']);
});