'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetSafety } = require('../src/farmer/target-safety');
const { FarmerController, FarmerState } = require('../src/farmer/farmer-fsm');
const { installAlpha2023IdleDeadlockRecovery } = require('../src/reliability/alpha20-23-idle-deadlock-recovery');
const { LogicOutcome, classifyCrossModuleDecision, traceHasBoundedProgress } = require('../scripts/logic-guardian-model');

function navigationFixture({ selectedTargetId = null, plannedMonster = 'squigtoad', evaluate } = {}) {
  const runtime = {
    now: () => 1000,
    root: { G: { monsters: {} } },
    farmer: { targetId: selectedTargetId },
    targetSafety: evaluate ? { evaluate } : new TargetSafety(),
    localFarming: {
      currentPlan: plannedMonster ? { monster: plannedMonster } : null,
      _visibleMonsters(snapshot) {
        return (snapshot.entities || []).filter((entity) => entity && entity.mtype && !entity.dead && (entity.hp == null || Number(entity.hp) > 0));
      }
    },
    log: { emit() {} }
  };
  runtime.root.parent = runtime.root;
  installAlpha2023IdleDeadlockRecovery(runtime);
  return runtime;
}

function snapshot(entities) {
  return { character: { name: 'FarmerA', ctype: 'ranger', map: 'main', x: 0, y: 0 }, entities };
}

test('cross-module classifier detects the exact hidden-deadlock shape', () => {
  const outcome = classifyCrossModuleDecision({
    workExpected: true,
    attackAllowed: false,
    safeTargetAvailable: false,
    planAvailable: true,
    navigationBlocked: true,
    explicitSafetyStop: false,
    alternateProgress: false
  });
  assert.equal(outcome, LogicOutcome.DEADLOCK);

  assert.equal(classifyCrossModuleDecision({
    workExpected: true,
    attackAllowed: false,
    safeTargetAvailable: false,
    planAvailable: true,
    navigationBlocked: true,
    explicitSafetyStop: true
  }), LogicOutcome.SAFE_STOP);
});

test('passive unrelated Automatron leaves a real navigation progress path while remaining non-attackable', () => {
  const runtime = navigationFixture();
  const automatron = { id: '30', name: 'Target Automatron', mtype: 'target', map: 'main', hp: 9999, target: null };
  const safety = runtime.targetSafety.evaluate(automatron, runtime.root.G);
  const blockers = runtime.localFarming._visibleMonsters(snapshot([automatron]));
  assert.equal(safety.allowed, false);
  assert.equal(safety.reason, 'TRAINING_TARGET_AUTOMATRON');
  assert.deepEqual(blockers, []);

  const outcome = classifyCrossModuleDecision({
    workExpected: true,
    attackAllowed: safety.allowed,
    safeTargetAvailable: false,
    planAvailable: true,
    navigationBlocked: blockers.length > 0,
    explicitSafetyStop: false
  });
  assert.equal(outcome, LogicOutcome.NAVIGATE);
});

test('Automatron safety guards remain fail-closed across self-aggro, selected and planned combinations', () => {
  const cases = [
    { label: 'self-aggro', selectedTargetId: null, plannedMonster: 'squigtoad', target: 'FarmerA' },
    { label: 'selected', selectedTargetId: '30', plannedMonster: 'squigtoad', target: null },
    { label: 'planned', selectedTargetId: null, plannedMonster: 'target', target: null }
  ];

  for (const row of cases) {
    const runtime = navigationFixture(row);
    const automatron = { id: '30', name: 'Target Automatron', mtype: 'target', map: 'main', hp: 9999, target: row.target };
    assert.equal(runtime.targetSafety.evaluate(automatron, runtime.root.G).allowed, false, row.label);
    assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot([automatron])).map((entity) => entity.id), ['30'], row.label);
  }
});

test('TargetSafety evaluation failures cannot accidentally manufacture a navigation release', () => {
  const runtime = navigationFixture({ evaluate() { throw new Error('synthetic failure'); } });
  const automatron = { id: '30', name: 'Target Automatron', mtype: 'target', map: 'main', hp: 9999 };
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot([automatron])).map((entity) => entity.id), ['30']);
  assert.equal(runtime.alpha2023IdleDeadlockRecovery.status().stats.targetSafetyEvaluationFailures, 1);
});

test('healthy active Farmer reaches combat action within a bounded number of ticks', () => {
  let now = 10000;
  const commands = [];
  const target = { id: 's1', name: 'Squigtoad', mtype: 'squigtoad', map: 'main', x: 20, y: 0, hp: 1000, max_hp: 1000, dead: false };
  const farmer = new FarmerController({
    now: () => now,
    targetPolicy: 'allow',
    planner: { rank: (rows) => rows.map((row) => ({ ...row, score: 1 })) }
  });
  const context = {
    snapshot: {
      character: { name: 'FarmerA', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, range: 120, frequency: 1, inventory: [] },
      entities: [target]
    },
    party: { members: [], fingerprint: 'solo:test' },
    world: null,
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { squigtoad: { xp: 100 } } }),
      canAttack: () => true,
      command(action, args) { commands.push({ action, args }); return { executed: true }; }
    }
  };

  const trace = [];
  for (let tick = 0; tick < 6 && !commands.some((row) => row.action === 'attack'); tick += 1) {
    farmer.step(context);
    trace.push({ signature: farmer.progress(context), action: commands.length > 0 });
    now += 1100;
  }

  assert.equal(commands.some((row) => row.action === 'attack'), true);
  assert.ok([FarmerState.ENGAGE, FarmerState.TRAVEL].includes(farmer.state));
  assert.equal(traceHasBoundedProgress(trace, 6), true);
});

test('shadow Farmer periodically advances plan revision and changes its progress signature', () => {
  let now = 10000;
  const farmer = new FarmerController({ now: () => now, targetPolicy: 'allow', shadowPlanIntervalMs: 1000 });
  const context = {
    snapshot: { character: { name: 'FarmerA', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, inventory: [] }, entities: [] },
    party: { members: [], fingerprint: 'solo:test' },
    world: null,
    adapter: { mode: 'shadow', getGameData: () => ({ monsters: {} }) }
  };

  farmer.step(context);
  const first = farmer.progress(context);
  assert.equal(farmer.shadowPlanRevision, 1);
  now += 1100;
  farmer.step(context);
  const second = farmer.progress(context);
  assert.equal(farmer.shadowPlanRevision, 2);
  assert.notEqual(first, second);
});
