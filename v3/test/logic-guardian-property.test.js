'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');
const { LogicOutcome, classifyCrossModuleDecision } = require('../scripts/logic-guardian-model');
const { installNeverTargetNavigationRelease } = require('../src/reliability/alpha20-23-idle-deadlock-recovery');

const PROPERTY_RUNS = 1000;
const PROPERTY_SEED = 20260913;

test('property: cross-module classifier reports DEADLOCK exactly when every progress path is closed', () => {
  const decisionArbitrary = fc.record({
    workExpected: fc.boolean(),
    attackAllowed: fc.boolean(),
    safeTargetAvailable: fc.boolean(),
    planAvailable: fc.boolean(),
    navigationBlocked: fc.boolean(),
    explicitSafetyStop: fc.boolean(),
    alternateProgress: fc.boolean()
  });

  fc.assert(fc.property(decisionArbitrary, (input) => {
    const actual = classifyCrossModuleDecision(input);
    const expectedDeadlock = input.workExpected === true
      && input.safeTargetAvailable !== true
      && !(input.planAvailable === true && input.navigationBlocked !== true)
      && input.alternateProgress !== true
      && input.explicitSafetyStop !== true;

    assert.equal(actual === LogicOutcome.DEADLOCK, expectedDeadlock);
  }), { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED });
});

test('property: Automatron navigation release is exact and fails closed for protected states', () => {
  const safetyCaseArbitrary = fc.record({
    selfAggro: fc.boolean(),
    selected: fc.boolean(),
    planned: fc.boolean(),
    evaluationThrows: fc.boolean(),
    returnNull: fc.boolean(),
    allowed: fc.boolean(),
    reason: fc.constantFrom('TRAINING_TARGET_AUTOMATRON', 'CONTENT_QUARANTINED', 'CUSTOM_EXCLUSION', 'OTHER')
  });

  fc.assert(fc.property(safetyCaseArbitrary, (row) => {
    const entity = {
      id: 'target-1',
      mtype: 'target',
      target: row.selfAggro ? 'Farmer' : null
    };
    const local = {
      currentPlan: row.planned ? { monster: 'target' } : { monster: 'goo' },
      _visibleMonsters: () => [entity]
    };
    const farmer = { targetId: row.selected ? 'target-1' : 'other-target' };
    const targetSafety = {
      evaluate() {
        if (row.evaluationThrows) throw new Error('synthetic TargetSafety failure');
        if (row.returnNull) return null;
        return { allowed: row.allowed, reason: row.reason };
      }
    };
    const stats = {
      navigationDeadlocksReleased: 0,
      targetSafetyEvaluationFailures: 0,
      lastRelease: null
    };
    const runtime = {
      localFarming: local,
      farmer,
      targetSafety,
      now: () => 123
    };

    assert.equal(installNeverTargetNavigationRelease(runtime, stats), true);
    const visible = local._visibleMonsters({ character: { name: 'Farmer' }, gameData: {} });
    const protectedBeforeSafety = row.selfAggro || row.selected || row.planned;
    const releasable = !protectedBeforeSafety
      && !row.evaluationThrows
      && !row.returnNull
      && row.allowed === false
      && row.reason === 'TRAINING_TARGET_AUTOMATRON';

    assert.equal(visible.length, releasable ? 0 : 1);
    assert.equal(stats.navigationDeadlocksReleased, releasable ? 1 : 0);
    assert.equal(stats.targetSafetyEvaluationFailures, row.evaluationThrows && !protectedBeforeSafety ? 1 : 0);
  }), { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED + 1 });
});
