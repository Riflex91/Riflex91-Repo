'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assessFunctionalHealth } = require('../host/functional-health-assessor');

function snapshot({ farmer = {}, merchant = {}, performance = {} } = {}) {
  return { status: { farmer, merchantService: merchant, performance } };
}

test('healthy farmer combat progress remains healthy', () => {
  const result = assessFunctionalHealth(snapshot({ farmer: { enabled: true, state: 'ENGAGE' }, performance: { current: { seconds: 240, kills: 4, monsterHpLost: 800, xp: 100 } } }), [], { now: 1000000 });
  assert.equal(result.state, 'HEALTHY');
  assert.equal(result.subsystems.combat.state, 'HEALTHY');
});

test('active farmer without combat progress becomes critical', () => {
  const result = assessFunctionalHealth(snapshot({ farmer: { enabled: true, state: 'ENGAGE' }, performance: { current: { seconds: 181, kills: 0, monsterHpLost: 0, xp: 0 } } }), [], { now: 1000000 });
  assert.equal(result.state, 'CRITICAL');
  assert.ok(result.reasons.includes('FARMER_NO_COMBAT_PROGRESS'));
  assert.equal(result.subsystems.combat.state, 'CRITICAL');
});

test('idle farmer does not create a false combat alarm', () => {
  const result = assessFunctionalHealth(snapshot({ farmer: { enabled: true, state: 'IDLE' }, performance: { current: { seconds: 600, kills: 0, monsterHpLost: 0, xp: 0 } } }), [], { now: 1000000 });
  assert.equal(result.state, 'HEALTHY');
});

test('merchant with pending work and stale last action becomes critical', () => {
  const now = 1000000;
  const result = assessFunctionalHealth(snapshot({ merchant: { enabled: true, state: 'ACTIVE', pending: 3, lastActionAt: now - 601000 } }), [], { now });
  assert.equal(result.state, 'CRITICAL');
  assert.ok(result.reasons.includes('MERCHANT_NO_SERVICE_PROGRESS'));
  assert.equal(result.subsystems.merchant.state, 'CRITICAL');
});

test('technical stalled event is retained as functional failure evidence', () => {
  const result = assessFunctionalHealth(snapshot(), [{ event: 'MERCHANT_SERVICE', reason: 'STALLED' }], { now: 1000000 });
  assert.equal(result.state, 'CRITICAL');
  assert.ok(result.reasons.includes('MERCHANT_PROGRESS_EVENT'));
});
