'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SkillUsagePolicy } = require('../src/farmer/skill-usage');
const { SkillFarmerController } = require('../src/farmer/skill-farmer');
const { FarmerState } = require('../src/farmer/farmer-fsm');
const { GameAdapter } = require('../src/game/adapter');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    range: 120, speed: 40, frequency: 2, rip: false,
    inventory: [{ index: 0, name: 'hpot0', q: 10 }],
    ...overrides
  };
}

function monster(overrides = {}) {
  return {
    id: 'm1', mtype: 'goo', map: 'main', x: 70, y: 0,
    hp: 1000, max_hp: 1000, target: 'R1', dead: false,
    ...overrides
  };
}

function skills() {
  return {
    huntersmark: {
      type: 'skill', class: ['ranger'], hostile: true, target: true,
      name: "Hunter's Mark", mp: 40, level: 20, cooldown: 1000
    },
    '3shot': {
      type: 'skill', class: ['ranger'], hostile: true, target: true,
      name: '3-Shot', mp: 200, level: 60, cooldown: 900, damage_multiplier: 0.6
    },
    supershot: {
      type: 'skill', class: ['ranger'], hostile: true, target: true,
      name: 'Supershot', mp: 100, level: 30, cooldown: 30000,
      damage_multiplier: 1.5, wtype: ['bow', 'crossbow']
    },
    mluck: {
      type: 'skill', class: ['merchant'], target: 'player',
      name: "Merchant's Luck", mp: 10, level: 40
    }
  };
}

function planner() {
  return { rank: (rows) => rows.map((row, index) => ({ ...row, score: 1 - index * 0.1 })) };
}

function context({ target = monster(), commands = [], commandResult } = {}) {
  return {
    snapshot: { observedAt: 10000, character: character(), entities: [target], party: [] },
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { goo: { xp: 100 } }, skills: skills() }),
      canAttack: () => true,
      canUseSkill: () => true,
      isSkillInRange: () => true,
      command: (action, args = []) => {
        commands.push({ action, args });
        if (commandResult) return commandResult(action, args);
        return { executed: true };
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: {}
  };
}

test('SkillUsagePolicy selects one direct single-target damage skill from live metadata', () => {
  const policy = new SkillUsagePolicy();
  const selected = policy.select(character(), { skills: skills() });
  assert.equal(selected.id, 'supershot');
  assert.equal(selected.damageMultiplier, 1.5);
});

test('SkillUsagePolicy preserves configured MP reserve', () => {
  const policy = new SkillUsagePolicy({ mpReserveRatio: 0.30 });
  const snap = { character: character({ mp: 200, max_mp: 500 }) };
  const result = policy.evaluate(snap, monster(), { skills: skills() }, {
    canUseSkill: () => true,
    isSkillInRange: () => true
  });
  assert.equal(result.useSkill, false);
  assert.equal(result.reason, 'MP_RESERVE');
});

test('SkillUsagePolicy respects Adventure Land cooldown and range helpers', () => {
  const policy = new SkillUsagePolicy();
  const snap = { character: character() };
  const cooldown = policy.evaluate(snap, monster(), { skills: skills() }, {
    canUseSkill: () => false,
    isSkillInRange: () => true
  });
  assert.equal(cooldown.useSkill, false);
  assert.equal(cooldown.reason, 'SKILL_COOLDOWN_OR_REQUIREMENT');

  const range = policy.evaluate(snap, monster(), { skills: skills() }, {
    canUseSkill: () => true,
    isSkillInRange: () => false
  });
  assert.equal(range.useSkill, false);
  assert.equal(range.reason, 'SKILL_OUT_OF_RANGE');
});

test('SkillFarmer uses the selected skill on the current target before normal attack', () => {
  let now = 10000;
  const commands = [];
  const farmer = new SkillFarmerController({ now: () => now, planner: planner(), attackIntervalMs: 250, kitingMoveCooldownMs: 250 });
  const ctx = context({ commands });

  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.state, FarmerState.ENGAGE);
  now += 1000;
  farmer.step(ctx);

  assert.equal(commands.at(-1).action, 'use_skill');
  assert.deepEqual(commands.at(-1).args, ['supershot', 'm1']);
  assert.equal(farmer.status().skillUsage.selectedSkill, 'supershot');
  assert.equal(farmer.status().skillUsage.lastUse.skill, 'supershot');
});

test('SkillFarmer kites while still allowing normal attack when the target is too close', () => {
  let now = 10000;
  const commands = [];
  const farmer = new SkillFarmerController({ now: () => now, planner: planner(), attackIntervalMs: 250, kitingMoveCooldownMs: 250 });
  const ctx = context({ target: monster({ x: 20 }), commands });

  farmer.step(ctx);
  farmer.step(ctx);
  now += 1000;
  farmer.step(ctx);

  assert.equal(commands.some((entry) => entry.action === 'move'), true);
  assert.equal(commands.at(-1).action, 'attack');
  assert.equal(commands.some((entry) => entry.action === 'use_skill'), false);
});

test('SkillFarmer falls back to normal attack if the skill command fails', () => {
  let now = 10000;
  const commands = [];
  const farmer = new SkillFarmerController({ now: () => now, planner: planner(), attackIntervalMs: 250 });
  const ctx = context({
    commands,
    commandResult: (action) => action === 'use_skill' ? { executed: false, reason: 'COMMAND_FAILED' } : { executed: true }
  });

  farmer.step(ctx);
  farmer.step(ctx);
  now += 1000;
  farmer.step(ctx);

  assert.equal(commands.at(-2).action, 'use_skill');
  assert.equal(commands.at(-1).action, 'attack');
});

test('SkillFarmer discovers its safe skill in shadow without issuing commands', () => {
  const commands = [];
  const farmer = new SkillFarmerController({ now: () => 10000, planner: planner() });
  const ctx = context({ commands });
  ctx.adapter.mode = 'shadow';

  farmer.step(ctx);
  assert.equal(commands.length, 0);
  assert.equal(farmer.status().skillUsage.selectedSkill, 'supershot');
});

test('GameAdapter resolves use_skill target ids to live Adventure Land entities', () => {
  const rawTarget = { id: 'm1', type: 'monster', mtype: 'goo', x: 20, y: 0, hp: 100, max_hp: 100 };
  let received = null;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 70, mp: 500, max_mp: 500, items: [], slots: {} },
    G: { skills: {}, monsters: {}, maps: {} },
    parent: { entities: { m1: rawTarget }, party: {} },
    use_skill: (name, target) => { received = { name, target }; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const result = adapter.command('use_skill', ['supershot', 'm1']);
  assert.equal(result.executed, true);
  assert.equal(received.name, 'supershot');
  assert.equal(received.target, rawTarget);
});
