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

function makeContext(options = {}) {
  const target = options.target || monster();
  const events = options.events || [];
  const commands = options.commands || [];
  const canUseSkill = options.canUseSkill || (() => true);
  const isSkillInRange = options.isSkillInRange || (() => true);
  const commandResult = options.commandResult || (() => ({ executed: true }));
  return {
    target,
    events,
    commands,
    context: {
      snapshot: {
        observedAt: 10000,
        character: character(),
        entities: [target],
        party: []
      },
      adapter: {
        mode: 'active',
        getGameData: () => gameData(),
        canAttack: () => true,
        canUseSkill,
        isSkillInRange,
        command: (action, args = []) => {
          const record = { action, args: args.slice() };
          commands.push(record);
          return commandResult(action, args, record);
        }
      },
      world: { performanceFor: () => null },
      party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
      runtime: {}
    }
  };
}

function makeFarmer(events = [], options = {}) {
  const farmer = new SkillFarmerController({
    now: () => 10000,
    log: { emit: (event) => events.push(event) },
    skillUsageMaxCommandAttempts: options.maxCommandAttempts
  });
  farmer.lastReassessmentAt = 10000;
  return farmer;
}

test('SkillUsagePolicy can skip a command-failed candidate while preserving the same safe pool', () => {
  const policy = new SkillUsagePolicy();
  const result = policy.evaluate(
    { character: character() },
    monster(),
    gameData(),
    { canUseSkill: () => true, isSkillInRange: () => true },
    { skipSkillIds: ['burst'] }
  );

  assert.equal(result.useSkill, true);
  assert.equal(result.skill.id, 'steady');
  assert.equal(result.candidateRank, 2);
  assert.equal(result.reason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.deepEqual(result.rejectedCandidates[0], {
    skill: 'burst', rank: 1, reason: 'PREVIOUS_COMMAND_FAILED', mpAfter: 300
  });
  assert.equal(policy.status().executionFallbackEnabled, true);
  assert.equal(policy.status().maxCommandAttempts, 2);
  assert.deepEqual(policy.status().retryableCommandReasons, ['COMMAND_FAILED']);
});

test('SkillFarmer retries one next-safe candidate after retryable COMMAND_FAILED and records execution telemetry', () => {
  const events = [];
  const commands = [];
  const { context, target } = makeContext({
    events,
    commands,
    commandResult: (action, args) => {
      if (action === 'use_skill' && args[0] === 'burst') return { executed: false, reason: 'COMMAND_FAILED' };
      return { executed: true };
    }
  });
  const farmer = makeFarmer(events);

  farmer._engage(context, target);

  assert.deepEqual(commands.map((entry) => entry.action), ['use_skill', 'use_skill']);
  assert.deepEqual(commands.map((entry) => entry.args[0]), ['burst', 'steady']);
  const status = farmer.status().skillUsage;
  assert.equal(status.lastUse.skill, 'steady');
  assert.equal(status.lastUse.executionReason, 'SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK');
  assert.equal(status.lastUse.executionAttempt, 2);
  assert.equal(status.lastDecision.reason, 'SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK');
  assert.equal(status.lastDecision.preflightReason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.equal(status.lastDecision.executionFallbackUsed, true);
  assert.equal(status.lastDecision.executionAttempts.length, 2);
  assert.equal(status.lastExecution.outcome, 'SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK');

  const failed = events.find((event) => event.event === 'FARMER_SKILL_USE_FAILED');
  const used = events.find((event) => event.event === 'FARMER_SKILL_USED');
  assert.equal(failed.data.retryable, true);
  assert.equal(failed.data.willRetry, true);
  assert.equal(used.reason, 'SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK');
  assert.equal(used.data.executionAttempt, 2);
});

test('SkillFarmer does not retry another skill after non-retryable COMMAND_UNAVAILABLE', () => {
  const commands = [];
  const { context, target } = makeContext({
    commands,
    commandResult: (action) => action === 'use_skill'
      ? { executed: false, reason: 'COMMAND_UNAVAILABLE' }
      : { executed: true }
  });
  const farmer = makeFarmer();

  farmer._engage(context, target);

  const skillCommands = commands.filter((entry) => entry.action === 'use_skill');
  assert.equal(skillCommands.length, 1);
  assert.equal(skillCommands[0].args[0], 'burst');
  assert.equal(commands.some((entry) => entry.action === 'attack'), true);
  assert.equal(farmer.status().skillUsage.lastExecution.outcome, 'SKILL_COMMAND_NON_RETRYABLE');
  assert.equal(farmer.status().skillUsage.lastDecision.executionAttempts.length, 1);
});

test('SkillFarmer bounds retryable command failures to two skill attempts before normal attack fallback', () => {
  const commands = [];
  const { context, target } = makeContext({
    commands,
    commandResult: (action) => action === 'use_skill'
      ? { executed: false, reason: 'COMMAND_FAILED' }
      : { executed: true }
  });
  const farmer = makeFarmer();

  farmer._engage(context, target);

  const skillCommands = commands.filter((entry) => entry.action === 'use_skill');
  assert.deepEqual(skillCommands.map((entry) => entry.args[0]), ['burst', 'steady']);
  assert.equal(skillCommands.some((entry) => entry.args[0] === 'quick'), false);
  assert.equal(commands.some((entry) => entry.action === 'attack'), true);
  assert.equal(farmer.status().skillUsage.lastExecution.outcome, 'SKILL_COMMAND_FALLBACK_EXHAUSTED');
  assert.equal(farmer.status().skillUsage.lastDecision.executionAttempts.length, 2);
});

test('SkillFarmer re-runs live preflight gates before execution fallback and may skip an unavailable middle candidate', () => {
  const commands = [];
  let burstFailed = false;
  const { context, target } = makeContext({
    commands,
    canUseSkill: (skillId) => !(burstFailed && skillId === 'steady'),
    commandResult: (action, args) => {
      if (action === 'use_skill' && args[0] === 'burst') {
        burstFailed = true;
        return { executed: false, reason: 'COMMAND_FAILED' };
      }
      return { executed: true };
    }
  });
  const farmer = makeFarmer();

  farmer._engage(context, target);

  const skillCommands = commands.filter((entry) => entry.action === 'use_skill');
  assert.deepEqual(skillCommands.map((entry) => entry.args[0]), ['burst', 'quick']);
  const status = farmer.status().skillUsage;
  assert.equal(status.lastUse.skill, 'quick');
  assert.equal(status.lastUse.candidateRank, 3);
  assert.deepEqual(
    status.lastDecision.rejectedCandidates.map((entry) => [entry.skill, entry.reason]),
    [
      ['burst', 'PREVIOUS_COMMAND_FAILED'],
      ['steady', 'SKILL_COOLDOWN_OR_REQUIREMENT']
    ]
  );
});
