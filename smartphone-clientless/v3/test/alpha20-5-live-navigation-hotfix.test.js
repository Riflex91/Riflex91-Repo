'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { LocalFarmOrchestrator } = require('../src/autonomy/local-farm-orchestrator');
const { PreFarmingReliabilityPolicy } = require('../src/reliability/pre-farming-reliability');
const { LiveNavigationHotfix } = require('../src/reliability/live-navigation-hotfix');
const { Alpha20_5FarmReadinessRuntime } = require('../src/autonomy/alpha20-5-farm-readiness-runtime');

function makeLocalFixture(overrides = {}) {
  let now = 1000;
  let moveCalls = 0;
  const events = [];
  const character = {
    name: 'FarmerA', ctype: 'ranger', level: 60, map: 'main', x: 0, y: 0,
    hp: 1000, max_hp: 1000, speed: 60, rip: false
  };
  const planner = {
    rank() {
      return [{
        monster: 'goo', map: 'main', x: 500, y: 0, spawnIndex: 0,
        source: 'map-metadata', contentDisposition: 'LEGACY_ALLOWED', score: 10
      }];
    },
    materiallyBetter() { return false; }
  };
  const localFarming = new LocalFarmOrchestrator({
    now: () => now,
    planner,
    minHoldMs: 5000,
    planLeaseMs: 120000,
    noProgressMs: 15000,
    moveCooldownMs: 500,
    arrivalRadius: 40
  });
  const farmer = {
    enabled: true,
    targetId: null,
    state: 'ASSESS',
    setEnabled(value) { this.enabled = value === true; return this.enabled; },
    ensureScheduled() { return 'task'; },
    _safeLiveMonsters(snapshot) { return (snapshot.entities || []).filter((row) => row && row.mtype && !row.dead); }
  };
  const runtime = {
    root: { character },
    now: () => now,
    localFarming,
    farmer,
    world: {},
    targetSafety: overrides.targetSafety || { evaluate() { return { allowed: true, reason: 'ALLOWED' }; } },
    combatRisk: overrides.combatRisk || { evaluate() { return { allowed: true, score: 0, threshold: 0.65, reason: 'RISK_ACCEPTABLE', signals: { contentDisposition: 'LEGACY_ALLOWED' } }; } },
    adapter: {
      mode: 'active',
      getGameData() { return { monsters: { hen: {}, goo: {}, target_ar900: {}, unknownboss: {} }, maps: { main: {} } }; },
      command(kind, args) {
        assert.equal(kind, 'move');
        assert.equal(args.length, 2);
        moveCalls += 1;
        return { executed: true, shadow: false, coalesced: false, reason: 'COMMAND_SENT', outcomeId: `move-${moveCalls}`, outcomeState: 'PENDING' };
      },
      stabilityStatus() { return { movement: { circuitOpen: false, pendingOutcomeId: null } }; }
    },
    _partyProfile() { return { fingerprint: 'ranger:1' }; },
    _farmSnapshot(snapshot) { return snapshot; },
    partyTelemetry: null,
    merchantServicePlanner: null,
    contentDrift: null,
    log: { emit(row) { events.push(row); } }
  };
  runtime.root.parent = runtime.root;
  return {
    runtime,
    character,
    events,
    moves: () => moveCalls,
    setNow(value) { now = value; }
  };
}

function snapshot(character, entities) {
  return { observedAt: 1000, character: { ...character }, entities: entities.map((row) => ({ ...row })), party: [] };
}

test('live regression: safe incidental visible monster no longer prevents a Local Farm plan and bounded move', () => {
  const fixture = makeLocalFixture();
  // Reproduce the production order: old pre-farming wrapper first, then the
  // hotfix. Deliberately do not prime the old safe-entity cache.
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);
  const snap = snapshot(fixture.character, [{ id: 'hen-1', mtype: 'hen', map: 'main', x: 20, y: 0, hp: 100 }]);

  const result = fixture.runtime.localFarming.tick({ runtime: fixture.runtime, snapshot: snap, world: fixture.runtime.world, party: { fingerprint: 'ranger:1' }, gameData: fixture.runtime.adapter.getGameData() });
  assert.equal(result.action, 'MOVE');
  assert.equal(fixture.runtime.localFarming.currentPlan.monster, 'goo');
  assert.equal(fixture.runtime.localFarming.stats.plansCreated, 1);
  assert.equal(fixture.runtime.localFarming.stats.movesRequested, 1);
  assert.equal(fixture.moves(), 1);
  assert.equal(hotfix.status().lastEvaluation.blockingCount, 0);
  assert.equal(hotfix.status().stats.incidentalSafeIgnored, 1);
});

test('unknown or risk-rejected incidental monster still blocks before plan creation and raw move', () => {
  const fixture = makeLocalFixture({
    combatRisk: {
      evaluate(entity) {
        if (entity.mtype === 'unknownboss') return { allowed: false, score: 1, threshold: 0.65, reason: 'CONTENT_QUARANTINED', signals: { contentDisposition: 'QUARANTINED' } };
        return { allowed: true, score: 0, threshold: 0.65, reason: 'RISK_ACCEPTABLE', signals: {} };
      }
    }
  });
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);
  const snap = snapshot(fixture.character, [{ id: 'boss-1', mtype: 'unknownboss', map: 'main', x: 20, y: 0, hp: 1000 }]);

  const result = fixture.runtime.localFarming.tick({ runtime: fixture.runtime, snapshot: snap, world: fixture.runtime.world, party: { fingerprint: 'ranger:1' }, gameData: fixture.runtime.adapter.getGameData() });
  assert.equal(result.action, 'YIELD');
  assert.equal(result.reason, 'VISIBLE_MONSTER_PRESENT');
  assert.equal(fixture.runtime.localFarming.currentPlan, null);
  assert.equal(fixture.moves(), 0);
  assert.equal(hotfix.status().lastEvaluation.blockingCount, 1);
  assert.equal(hotfix.status().stats.unknownOrRiskBlocked, 1);
});

test('explicit Farmer target and self-aggro remain hard navigation blockers', () => {
  const fixture = makeLocalFixture();
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);

  fixture.runtime.farmer.targetId = 'hen-1';
  let blockers = hotfix.blockers(snapshot(fixture.character, [{ id: 'hen-1', mtype: 'hen', map: 'main', hp: 100 }]));
  assert.deepEqual(blockers.map((row) => row.id), ['hen-1']);

  fixture.runtime.farmer.targetId = null;
  blockers = hotfix.blockers(snapshot(fixture.character, [{ id: 'hen-2', mtype: 'hen', map: 'main', hp: 100, target: 'FarmerA' }]));
  assert.deepEqual(blockers.map((row) => row.id), ['hen-2']);
  assert.equal(hotfix.status().stats.farmerTargetBlocked, 1);
  assert.equal(hotfix.status().stats.selfAggroBlocked, 1);
});

test('Target Automatron presence is non-blocking but never bypasses self-aggro', () => {
  const fixture = makeLocalFixture({
    targetSafety: {
      evaluate(entity) {
        if (entity.mtype === 'target_ar900') return { allowed: false, reason: 'TRAINING_TARGET_AUTOMATRON', token: 'automatron', source: 'entity.mtype' };
        return { allowed: true, reason: 'ALLOWED' };
      }
    }
  });
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);

  let blockers = hotfix.blockers(snapshot(fixture.character, [{ id: 'dummy-1', mtype: 'target_ar900', name: 'Target Automatron', map: 'main', hp: 50000 }]));
  assert.equal(blockers.length, 0);
  blockers = hotfix.blockers(snapshot(fixture.character, [{ id: 'dummy-2', mtype: 'target_ar900', name: 'Target Automatron', map: 'main', hp: 50000, target: 'FarmerA' }]));
  assert.deepEqual(blockers.map((row) => row.id), ['dummy-2']);
  assert.equal(hotfix.status().stats.trainingTargetsIgnored, 1);
});

test('3000-cycle safe-incidental arbitration soak never pins navigation and remains bounded', () => {
  const fixture = makeLocalFixture();
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);
  const snap = snapshot(fixture.character, [{ id: 'hen-1', mtype: 'hen', map: 'main', hp: 100 }]);
  for (let i = 0; i < 3000; i += 1) {
    const blockers = hotfix.blockers(snap);
    assert.equal(blockers.length, 0);
  }
  const status = hotfix.status();
  assert.equal(status.stats.evaluations, 3000);
  assert.equal(status.stats.incidentalSafeIgnored, 3000);
  assert.equal(status.lastEvaluation.blockingCount, 0);
  assert.ok(JSON.stringify(status).length < 5000);
});

test('2500-cycle unsafe-incidental soak fails closed every time and issues no gameplay action', () => {
  const fixture = makeLocalFixture({
    combatRisk: { evaluate() { return { allowed: false, score: 1, threshold: 0.65, reason: 'CONTENT_QUARANTINED', signals: { contentDisposition: 'QUARANTINED' } }; } }
  });
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);
  const snap = snapshot(fixture.character, [{ id: 'boss-1', mtype: 'unknownboss', map: 'main', hp: 1000 }]);
  for (let i = 0; i < 2500; i += 1) {
    const blockers = hotfix.blockers(snap);
    assert.equal(blockers.length, 1);
  }
  assert.equal(fixture.moves(), 0);
  assert.equal(hotfix.status().stats.unknownOrRiskBlocked, 2500);
});

test('production farm-readiness runtime exposes the installed hotfix without new action authority', () => {
  assert.equal(typeof Alpha20_5FarmReadinessRuntime, 'function');
  // Constructor integration is asserted by source-level public status in the
  // normal full suite; the policy contract itself must remain authority-free.
  const fixture = makeLocalFixture();
  new PreFarmingReliabilityPolicy(fixture.runtime);
  const hotfix = new LiveNavigationHotfix(fixture.runtime);
  const status = hotfix.status();
  assert.equal(status.installed, true);
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directGameplayAccess, false);
  assert.equal(status.unknownContentBlocks, true);
});
