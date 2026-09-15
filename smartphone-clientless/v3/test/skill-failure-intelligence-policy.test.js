'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SkillUsagePolicy } = require('../src/farmer/skill-usage');

test('skill failure intelligence uses bounded exponential backoff defaults', () => {
  const policy = new SkillUsagePolicy();

  assert.equal(policy.failureBackoffForStreak(1), 2000);
  assert.equal(policy.failureBackoffForStreak(2), 4000);
  assert.equal(policy.failureBackoffForStreak(3), 8000);
  assert.equal(policy.failureBackoffForStreak(4), 8000);
  assert.equal(policy.failureBackoffForStreak(99), 8000);

  const status = policy.status();
  assert.equal(status.failureIntelligenceEnabled, true);
  assert.equal(status.failureBackoffMs, 2000);
  assert.equal(status.failureBackoffMultiplier, 2);
  assert.equal(status.failureBackoffMaxMs, 8000);
  assert.equal(status.failureStreakResetMs, 30000);
});

test('skill failure intelligence clamps unsafe configuration ranges', () => {
  const policy = new SkillUsagePolicy({
    failureBackoffMs: 250,
    failureBackoffMultiplier: 99,
    failureBackoffMaxMs: 999999,
    failureStreakResetMs: 1
  });

  assert.equal(policy.failureBackoffMs, 500);
  assert.equal(policy.failureBackoffMultiplier, 4);
  assert.equal(policy.failureBackoffMaxMs, 60000);
  assert.equal(policy.failureStreakResetMs, 5000);
  assert.equal(policy.failureBackoffForStreak(1), 500);
  assert.equal(policy.failureBackoffForStreak(2), 2000);
});

test('maximum backoff can never be configured below the base backoff', () => {
  const policy = new SkillUsagePolicy({
    failureBackoffMs: 6000,
    failureBackoffMaxMs: 1000
  });

  assert.equal(policy.failureBackoffMs, 6000);
  assert.equal(policy.failureBackoffMaxMs, 6000);
  assert.equal(policy.failureBackoffForStreak(3), 6000);
});
