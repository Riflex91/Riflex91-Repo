'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SkillUsagePolicy } = require('../src/farmer/skill-usage');
const { SkillFarmerController } = require('../src/farmer/skill-farmer');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    range: 120, speed: 40, frequency: 2, rip: false,
    inventory: [],
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

function safeSkill(name, damageMultiplier, mp, cooldown = 1000) {
  return {
    type: 'skill', class: ['ranger'], hostile: true, target: true,
    name, mp, level: 1, cooldown, damage_multiplier: damageMultiplier
  };
}

function gameData() {
  return {
    monsters: { goo: { xp: 100, attack: 10, frequency: 1 } },
    skills: {
      burst: safeSkill('Burst', 2.0, 200, 3000),
      steady: safeSkill('Steady', 1.5, 60, 1500),
      quick: safeSkill('Quick', 1.2, 20, 500),
      mark: {
        type: 'skill', class: ['ranger'], hostile: true, target: true,
        name: 'Mark', mp: 10, level: 1, cooldown: 500
      }
    }
  };
}

function makeHarness(options = {}) {
  const clock = { value: 10000 };
  const events = [];
  const commands = [];
  const target = monster();
  const state = { commandResult: options.commandResult || (() => ({ executed: true })) };
  const farmer = new SkillFarmerController({
    now: () => clock.value,
    log: { emit: (event) => events.push(event) },
    skillUsageFailureBackoffMs: options.failureBackoffMs == null ? 2000 : options.failureBackoffMs,
    skillUsageMaxCommandAttempts: options.maxCommandAttempts
  });
  farmer.lastReassessmentAt = clock.value;

  const context = {
    snapshot: {
      observedAt: clock.value,
      character: character(),
      entities: [target],
      party: []
    },
    adapter: {
      mode: 'active',
      getGameData: () => gameData(),
      canAttack: () => true,
      canUseSkill: () => true,
      isSkillInRange: () => true,
      command: (action, args = []) => {
        const record = { action, args: args.slice(), at: clock.value };
        commands.push(record);
        return state.commandResult(action, args, record);
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: {}
  };

  function advance(ms) {
    clock.value += ms;
    context.snapshot.observedAt = clock.value;
  }

  return { farmer, clock, events, commands, target, context, state, advance };
}

test('SkillUsagePolicy treats active failure backoff as a distinct safe-ladder rejection', () => {
  const policy = new SkillUsagePolicy({ failureBackoffMs: 2000 });
  const result = policy.evaluate(
    { character: character() },
    monster(),
    gameData(),
    { canUseSkill: () => true, isSkillInRange: () => true },
    { backoffSkillIds: ['burst'] }
  );

  assert.equal(result.useSkill, true);
  assert.equal(result.skill.id, 'steady');
  assert.equal(result.candidateRank, 2);
  assert.deepEqual(result.rejectedCandidates[0], {
    skill: 'burst', rank: 1, reason: 'SKILL_COMMAND_BACKOFF', mpAfter: 300
  });
  assert.equal(policy.status().failureBackoffEnabled, true);
  assert.equal(policy.status().failureBackoffMs, 2000);
  assert.equal(policy.status().backoffReason, 'SKILL_COMMAND_BACKOFF');
});

test('retryable failure arms a per-skill backoff and suppresses that skill on the next engage tick', () => {
  const h = makeHarness({
    commandResult: (action, args) => {
      if (action === 'use_skill' && args[0] === 'burst') return { executed: false, reason: 'COMMAND_FAILED' };
      return { executed: true };
    }
  });

  h.farmer._engage(h.context, h.target);
  assert.deepEqual(
    h.commands.filter((entry) => entry.action === 'use_skill').map((entry) => entry.args[0]),
    ['burst', 'steady']
  );

  h.advance(800);
  h.farmer._engage(h.context, h.target);

  assert.deepEqual(
    h.commands.filter((entry) => entry.action === 'use_skill').map((entry) => entry.args[0]),
    ['burst', 'steady', 'steady']
  );
  const status = h.farmer.status().skillUsage;
  assert.equal(status.lastDecision.skill, 'steady');
  assert.equal(status.lastDecision.candidateRank, 2);
  assert.equal(status.lastDecision.rejectedCandidates[0].reason, 'SKILL_COMMAND_BACKOFF');
  assert.equal(status.activeFailureBackoffs.length, 1);
  assert.equal(status.activeFailureBackoffs[0].skill, 'burst');
  assert.equal(status.activeFailureBackoffs[0].remainingMs, 1200);
  assert.equal(status.lastBackoff.skill, 'burst');
  assert.equal(h.events.some((event) => event.event === 'FARMER_SKILL_BACKOFF_ARMED'), true);
});

test('expired failure backoff is pruned and the original top-ranked skill becomes eligible again', () => {
  let failBurst = true;
  const h = makeHarness({
    commandResult: (action, args) => {
      if (action === 'use_skill' && args[0] === 'burst' && failBurst) return { executed: false, reason: 'COMMAND_FAILED' };
      return { executed: true };
    }
  });

  h.farmer._engage(h.context, h.target);
  assert.equal(h.farmer.status().skillUsage.activeFailureBackoffs[0].skill, 'burst');

  failBurst = false;
  h.advance(2000);
  h.farmer._engage(h.context, h.target);

  const skillCommands = h.commands.filter((entry) => entry.action === 'use_skill');
  assert.equal(skillCommands.at(-1).args[0], 'burst');
  assert.equal(h.farmer.status().skillUsage.activeFailureBackoffs.length, 0);
  assert.equal(h.farmer.status().skillUsage.lastUse.skill, 'burst');
  assert.equal(h.farmer.status().skillUsage.lastUse.candidateRank, 1);
});

test('non-retryable command failures never arm skill backoff', () => {
  const h = makeHarness({
    commandResult: (action) => action === 'use_skill'
      ? { executed: false, reason: 'COMMAND_UNAVAILABLE' }
      : { executed: true }
  });

  h.farmer._engage(h.context, h.target);

  const status = h.farmer.status().skillUsage;
  assert.equal(status.activeFailureBackoffs.length, 0);
  assert.equal(status.lastBackoff, null);
  assert.equal(h.events.some((event) => event.event === 'FARMER_SKILL_BACKOFF_ARMED'), false);
  const failed = h.events.find((event) => event.event === 'FARMER_SKILL_USE_FAILED');
  assert.equal(failed.data.backoffArmed, false);
  assert.equal(failed.data.backoffMs, 0);
});

test('two retryable failures back off both skills so the next tick starts directly at the next safe candidate', () => {
  let firstTick = true;
  const h = makeHarness({
    commandResult: (action) => {
      if (action === 'use_skill' && firstTick) return { executed: false, reason: 'COMMAND_FAILED' };
      return { executed: true };
    }
  });

  h.farmer._engage(h.context, h.target);
  firstTick = false;
  assert.deepEqual(
    h.commands.filter((entry) => entry.action === 'use_skill').map((entry) => entry.args[0]),
    ['burst', 'steady']
  );

  h.advance(800);
  h.farmer._engage(h.context, h.target);

  const skillCommands = h.commands.filter((entry) => entry.action === 'use_skill');
  assert.deepEqual(skillCommands.map((entry) => entry.args[0]), ['burst', 'steady', 'quick']);
  const status = h.farmer.status().skillUsage;
  assert.equal(status.lastUse.skill, 'quick');
  assert.equal(status.lastUse.candidateRank, 3);
  assert.deepEqual(
    status.lastDecision.rejectedCandidates.map((entry) => [entry.skill, entry.reason]),
    [
      ['burst', 'SKILL_COMMAND_BACKOFF'],
      ['steady', 'SKILL_COMMAND_BACKOFF']
    ]
  );
  assert.deepEqual(status.activeFailureBackoffs.map((entry) => entry.skill), ['burst', 'steady']);
  assert.equal(h.events.filter((event) => event.event === 'FARMER_SKILL_BACKOFF_ARMED').length, 2);
});
