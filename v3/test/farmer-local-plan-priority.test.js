'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TaskState } = require('../src/core/task');
const { FarmerLocalPlanPriority } = require('../src/farmer/farmer-local-plan-priority');

function fixture() {
  let originalSteps = 0;
  const runtime = {
    lastSnapshot: {
      character: { name: 'FarmerA', ctype: 'ranger', hp: 1000, max_hp: 1000, rip: false },
      entities: []
    },
    farmer: {
      state: 'ASSESS',
      targetId: null,
      step() { originalSteps += 1; return { state: TaskState.RUNNING, reason: 'ORIGINAL' }; }
    },
    localFarming: {
      enabled: true,
      currentPlan: null,
      lastDecision: null,
      config: { engageHpRatio: 0.7 }
    },
    log: { emit() {} }
  };
  return { runtime, originalSteps: () => originalSteps };
}

test('Farmer yields exactly one safe scheduler turn so local farm planning can run before incidental target churn', () => {
  const f = fixture();
  const policy = new FarmerLocalPlanPriority(f.runtime);
  const first = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
  assert.equal(first.state, TaskState.WAITING);
  assert.equal(first.reason, 'LOCAL_PLAN_PRIORITY');
  assert.equal(f.originalSteps(), 0);

  const second = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
  assert.equal(second.reason, 'ORIGINAL');
  assert.equal(f.originalSteps(), 1);
  assert.equal(policy.status().stats.yields, 1);
});

test('a created local plan rearms one-turn priority for a later plan-loss episode', () => {
  const f = fixture();
  const policy = new FarmerLocalPlanPriority(f.runtime);
  f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
  f.runtime.localFarming.currentPlan = { id: 'p1', monster: 'squigtoad' };
  assert.equal(f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot }).reason, 'ORIGINAL');
  f.runtime.localFarming.currentPlan = null;
  f.runtime.localFarming.lastDecision = { action: 'ABORT', reason: 'PLAN_NO_LONGER_ELIGIBLE' };
  const next = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
  assert.equal(next.reason, 'LOCAL_PLAN_PRIORITY');
  assert.equal(policy.status().stats.yields, 2);
  assert.equal(policy.status().stats.rearmedAfterPlan, 1);
});

test('self aggro, low HP, active combat/travel and known no-spawn states bypass plan priority', () => {
  const cases = [
    (f) => { f.runtime.lastSnapshot.entities = [{ id: 'm1', mtype: 'crab', target: 'FarmerA' }]; },
    (f) => { f.runtime.lastSnapshot.character.hp = 500; },
    (f) => { f.runtime.farmer.state = 'RECOVER'; },
    (f) => { f.runtime.farmer.state = 'ENGAGE'; },
    (f) => { f.runtime.farmer.state = 'TRAVEL'; },
    (f) => { f.runtime.localFarming.lastDecision = { action: 'WAIT', reason: 'NO_APPROVED_LOCAL_SPAWN' }; }
  ];
  for (const mutate of cases) {
    const f = fixture();
    const policy = new FarmerLocalPlanPriority(f.runtime);
    mutate(f);
    const result = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
    assert.equal(result.reason, 'ORIGINAL');
    assert.equal(policy.status().stats.yields, 0);
  }
});

test('Merchant is never granted a local-plan priority Farmer turn', () => {
  const f = fixture();
  f.runtime.lastSnapshot.character.ctype = 'merchant';
  const policy = new FarmerLocalPlanPriority(f.runtime);
  const result = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
  assert.equal(result.reason, 'ORIGINAL');
  assert.equal(policy.status().stats.yields, 0);
});

test('2500 plan-loss episodes yield exactly once each and never execute Farmer work on the priority turn', () => {
  const f = fixture();
  const policy = new FarmerLocalPlanPriority(f.runtime);
  for (let i = 0; i < 2500; i += 1) {
    f.runtime.localFarming.currentPlan = { id: `p-${i}`, monster: 'squigtoad' };
    f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
    f.runtime.localFarming.currentPlan = null;
    f.runtime.localFarming.lastDecision = { action: 'ABORT', reason: 'PLAN_NO_LONGER_ELIGIBLE' };
    const yielded = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
    assert.equal(yielded.reason, 'LOCAL_PLAN_PRIORITY');
    const resumed = f.runtime.farmer.step({ snapshot: f.runtime.lastSnapshot });
    assert.equal(resumed.reason, 'ORIGINAL');
  }
  assert.equal(policy.status().stats.yields, 2500);
  assert.equal(policy.status().stats.rearmedAfterPlan, 2499);
  assert.equal(f.originalSteps(), 5000);
});
