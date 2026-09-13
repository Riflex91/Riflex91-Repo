'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetSafety } = require('../src/farmer/target-safety');
const {
  installAlpha2023IdleDeadlockRecovery,
  ALPHA20_23_IDLE_DEADLOCK_MODE
} = require('../src/reliability/alpha20-23-idle-deadlock-recovery');

function fixture() {
  let now = 1000;
  const runtime = {
    now: () => now,
    root: { G: { monsters: {} } },
    farmer: { targetId: null },
    targetSafety: new TargetSafety({ exclusions: ['customskip'] }),
    localFarming: {
      currentPlan: { monster: 'squigtoad' },
      _visibleMonsters(snapshot) {
        return (snapshot.entities || []).filter((row) => row && row.mtype && !row.dead && (row.hp == null || Number(row.hp) > 0));
      }
    },
    log: { emit() {} }
  };
  runtime.root.parent = runtime.root;
  runtime.advance = (ms) => { now += ms; };
  return runtime;
}

function snapshot(entities) {
  return {
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
    entities
  };
}

test('Alpha20.23 releases a non-hostile Target Automatron from visible-monster navigation blocking', () => {
  const runtime = fixture();
  const recovery = installAlpha2023IdleDeadlockRecovery(runtime);
  const rows = runtime.localFarming._visibleMonsters(snapshot([
    { id: '30', name: 'Target Automatron', mtype: 'target', map: 'main', hp: 9999 }
  ]));

  assert.deepEqual(rows, []);
  assert.equal(recovery.status().mode, ALPHA20_23_IDLE_DEADLOCK_MODE);
  assert.equal(recovery.status().stats.navigationDeadlocksReleased, 1);
  assert.equal(recovery.status().stats.lastRelease.reason, 'TRAINING_TARGET_AUTOMATRON');
});

test('Alpha20.23 keeps unknown monsters, dangerous fairies and custom exclusions fail-closed', () => {
  const runtime = fixture();
  installAlpha2023IdleDeadlockRecovery(runtime);
  const rows = runtime.localFarming._visibleMonsters(snapshot([
    { id: 'u1', name: 'Unknown Boss', mtype: 'unknownboss', hp: 100 },
    { id: 'f1', name: 'Red Fairy', mtype: 'redfairy', hp: 100 },
    { id: 'c1', name: 'customskip dummy', mtype: 'dummy', hp: 100 }
  ]));

  assert.deepEqual(rows.map((row) => row.id), ['u1', 'f1', 'c1']);
});

test('Alpha20.23 never releases a Target Automatron that is attacking the character', () => {
  const runtime = fixture();
  installAlpha2023IdleDeadlockRecovery(runtime);
  const rows = runtime.localFarming._visibleMonsters(snapshot([
    { id: '30', name: 'Target Automatron', mtype: 'target', target: 'FarmerA', hp: 9999 }
  ]));

  assert.deepEqual(rows.map((row) => row.id), ['30']);
});

test('Alpha20.23 never releases a selected or planned target even if TargetSafety rejects its identity', () => {
  const selectedRuntime = fixture();
  selectedRuntime.farmer.targetId = '30';
  installAlpha2023IdleDeadlockRecovery(selectedRuntime);
  assert.deepEqual(selectedRuntime.localFarming._visibleMonsters(snapshot([
    { id: '30', name: 'Target Automatron', mtype: 'target', hp: 9999 }
  ])).map((row) => row.id), ['30']);

  const plannedRuntime = fixture();
  plannedRuntime.localFarming.currentPlan = { monster: 'target' };
  installAlpha2023IdleDeadlockRecovery(plannedRuntime);
  assert.deepEqual(plannedRuntime.localFarming._visibleMonsters(snapshot([
    { id: '30', name: 'Target Automatron', mtype: 'target', hp: 9999 }
  ])).map((row) => row.id), ['30']);
});

test('Alpha20.23 installation is idempotent and TargetSafety failures remain blockers', () => {
  const runtime = fixture();
  runtime.targetSafety = { evaluate() { throw new Error('synthetic safety failure'); } };
  const first = installAlpha2023IdleDeadlockRecovery(runtime);
  const second = installAlpha2023IdleDeadlockRecovery(runtime);
  assert.equal(first, second);

  const rows = runtime.localFarming._visibleMonsters(snapshot([
    { id: '30', name: 'Target Automatron', mtype: 'target', hp: 9999 }
  ]));
  assert.deepEqual(rows.map((row) => row.id), ['30']);
  assert.equal(first.status().stats.targetSafetyEvaluationFailures, 1);
});
