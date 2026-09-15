'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
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

function gameData() {
  return {
    monsters: { goo: { xp: 100, attack: 10, frequency: 1 } },
    skills: {
      burst: {
        type: 'skill', class: ['ranger'], hostile: true, target: true,
        name: 'Burst', mp: 20, level: 1, cooldown: 3000, damage_multiplier: 2
      }
    }
  };
}

function makeHarness() {
  const clock = { value: 10000 };
  const events = [];
  const commands = [];
  const target = monster();
  const state = { skillResult: { executed: false, reason: 'COMMAND_FAILED' } };
  const farmer = new SkillFarmerController({
    now: () => clock.value,
    log: { emit: (event) => events.push(event) },
    skillUsageMaxCommandAttempts: 1,
    skillUsageFailureBackoffMs: 2000,
    skillUsageFailureBackoffMultiplier: 2,
    skillUsageFailureBackoffMaxMs: 8000,
    skillUsageFailureStreakResetMs: 30000
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
        commands.push({ action, args: args.slice(), at: clock.value });
        if (action === 'use_skill') return { ...state.skillResult };
        return { executed: true };
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

  return { farmer, clock, events, commands, target, state, context, advance };
}

function failRecord(h) {
  return h.farmer.status().skillUsage.recentFailureStreaks[0];
}

function backoffRecord(h) {
  return h.farmer.status().skillUsage.activeFailureBackoffs[0];
}

test('repeated retryable failures escalate the exact skill backoff but stay capped', () => {
  const h = makeHarness();

  h.farmer._engage(h.context, h.target);
  assert.equal(failRecord(h).failureStreak, 1);
  assert.equal(backoffRecord(h).backoffMs, 2000);

  h.advance(2000);
  h.farmer._engage(h.context, h.target);
  assert.equal(failRecord(h).failureStreak, 2);
  assert.equal(backoffRecord(h).backoffMs, 4000);

  h.advance(4000);
  h.farmer._engage(h.context, h.target);
  assert.equal(failRecord(h).failureStreak, 3);
  assert.equal(backoffRecord(h).backoffMs, 8000);

  h.advance(8000);
  h.farmer._engage(h.context, h.target);
  assert.equal(failRecord(h).failureStreak, 4);
  assert.equal(backoffRecord(h).backoffMs, 8000);

  const armed = h.events.filter((event) => event.event === 'FARMER_SKILL_BACKOFF_ARMED');
  assert.deepEqual(armed.map((event) => event.data.failureStreak), [1, 2, 3, 4]);
  assert.deepEqual(armed.map((event) => event.data.backoffMs), [2000, 4000, 8000, 8000]);
});

test('a confirmed executed skill resets its previous failure streak immediately', () => {
  const h = makeHarness();

  h.farmer._engage(h.context, h.target);
  assert.equal(failRecord(h).failureStreak, 1);

  h.advance(2000);
  h.state.skillResult = { executed: true };
  h.farmer._engage(h.context, h.target);

  let status = h.farmer.status().skillUsage;
  assert.deepEqual(status.recentFailureStreaks, []);
  assert.deepEqual(status.activeFailureBackoffs, []);
  assert.equal(status.lastFailureRecovery.skill, 'burst');
  assert.equal(status.lastFailureRecovery.previousFailureStreak, 1);
  assert.equal(status.lastUse.failureStreakReset, true);
  assert.equal(h.events.filter((event) => event.event === 'FARMER_SKILL_FAILURE_STREAK_RESET').length, 1);

  h.advance(800);
  h.state.skillResult = { executed: false, reason: 'COMMAND_FAILED' };
  h.farmer._engage(h.context, h.target);
  status = h.farmer.status().skillUsage;
  assert.equal(status.recentFailureStreaks[0].failureStreak, 1);
  assert.equal(status.activeFailureBackoffs[0].backoffMs, 2000);
});

test('shadow command results never fabricate a failure-streak recovery', () => {
  const h = makeHarness();

  h.farmer._engage(h.context, h.target);
  h.advance(2000);
  h.state.skillResult = { executed: false, shadow: true };
  h.farmer._engage(h.context, h.target);

  let status = h.farmer.status().skillUsage;
  assert.equal(status.recentFailureStreaks[0].failureStreak, 1);
  assert.equal(status.lastFailureRecovery, null);

  h.advance(800);
  h.state.skillResult = { executed: false, reason: 'COMMAND_FAILED' };
  h.farmer._engage(h.context, h.target);
  status = h.farmer.status().skillUsage;
  assert.equal(status.recentFailureStreaks[0].failureStreak, 2);
  assert.equal(status.activeFailureBackoffs[0].backoffMs, 4000);
});

test('quiet failure history expires so a later failure starts again at the base backoff', () => {
  const h = makeHarness();

  h.farmer._engage(h.context, h.target);
  assert.equal(failRecord(h).failureStreak, 1);

  h.advance(30000);
  h.farmer._engage(h.context, h.target);

  assert.equal(failRecord(h).failureStreak, 1);
  assert.equal(backoffRecord(h).backoffMs, 2000);
});

test('non-retryable failures do not create failure intelligence state', () => {
  const h = makeHarness();
  h.state.skillResult = { executed: false, reason: 'COMMAND_UNAVAILABLE' };

  h.farmer._engage(h.context, h.target);

  const status = h.farmer.status().skillUsage;
  assert.deepEqual(status.recentFailureStreaks, []);
  assert.deepEqual(status.activeFailureBackoffs, []);
  assert.equal(status.lastBackoff, null);
  const failed = h.events.find((event) => event.event === 'FARMER_SKILL_USE_FAILED');
  assert.equal(failed.data.retryable, false);
  assert.equal(failed.data.failureStreak, 0);
  assert.equal(failed.data.backoffMs, 0);
});
