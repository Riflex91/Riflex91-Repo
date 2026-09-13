'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetSafety } = require('../src/farmer/target-safety');

function evaluate(safety, entity) {
  return safety.evaluate(entity, { monsters: {} });
}

test('release invariant: Target Automatron is permanently non-attackable', () => {
  const safety = new TargetSafety();
  const entity = { id: '30', name: 'Target Automatron', mtype: 'target' };
  const verdict = evaluate(safety, entity);
  assert.equal(verdict.allowed, false);
  assert.equal(verdict.reason, 'TRAINING_TARGET_AUTOMATRON');
  assert.equal(safety.remove('automatron'), false);
  assert.equal(evaluate(safety, entity).allowed, false);
});

test('release invariant: dangerous fairy and custom exclusions remain fail-closed', () => {
  const safety = new TargetSafety({ exclusions: ['customskip'] });
  assert.equal(evaluate(safety, { name: 'Red Fairy', mtype: 'redfairy' }).allowed, false);
  assert.equal(evaluate(safety, { name: 'customskip dummy', mtype: 'dummy' }).allowed, false);
  assert.equal(evaluate(safety, { name: 'Squigtoad', mtype: 'squigtoad' }).allowed, true);
});
