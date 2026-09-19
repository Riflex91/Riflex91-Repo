'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { createObservableBankCapacityManager } = require('../src/reliability/pre-farming-reliability');
const {
  TeamCombatCohesionHotfix,
  TEAM_TARGET_STATE_ACTION
} = require('../src/party/team-combat-cohesion-hotfix');
const {
  makeEngine,
  makeControlledMerchant,
  makeLedger,
  makeRuntime,
  mutationFixture
} = require('./alpha27-convergence-test-helpers');

function coatGoal() {
  return {
    id: 'My_Warrior:chest:coat1:5',
    sourceCharacter: 'Merchant',
    sourceIndex: 0,
    character: 'My_Warrior',
    slot: 'chest',
    item: 'coat1',
    observedLevel: 3,
    targetLevel: 5,
    currentItem: null,
    currentLevel: 0,
    observedMeaningful: true,
    observedImprovement: 59.35,
    observedSurvivalImprovement: 59.35,
    projectedUpgradeRequired: true
  };
}

function gearServiceFixture() {
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map: 'main',
      x: 0,
      y: 0,
      items: [{ index: 0, name: 'coat1', level: 3, q: 1 }]
    },
    parent: {
      entities: {
        warrior: { id: 'warrior', name: 'My_Warrior', ctype: 'warrior', map: 'main', x: 10, y: 0 }
      }
    }
  };
  const service = {
    actionTimes: [],
    stats: { rawActions: 0, deliveries: 0, failedSafe: 0, committed: 0 },
    _executeDelivery: async () => ({ executed: false, committed: false, reason: 'BASE_DELIVERY' }),
    _trusted: (name) => name === 'My_Warrior',
    _visibleTarget: (name) => name === 'My_Warrior' ? root.parent.entities.warrior : null,
    _distanceTo: () => 10,
    _startOperation: () => true,
    _transition() { return true; },
    _command(action) {
      assert.equal(action, 'send_item');
      root.character.items[0] = null;
      return { executed: true, value: { success: true } };
    },
    async _timeout(value) { return value; },
    async _verify(predicate) { return predicate(); },
    _commit(_kind, reason, data) {
      this.stats.committed += 1;
      return { executed: true, committed: true, reason, data };
    },
    _failed(_kind, reason, data) {
      this.stats.failedSafe += 1;
      return { executed: true, committed: false, reason, data };
    },
    reconcile() { return { reconciled: false }; },
    status() { return {}; }
  };
  const runtime = makeRuntime({
    root,
    ledger: makeLedger([]),
    engine: makeEngine(),
    controlledMerchant: makeControlledMerchant(),
    service,
    gearGoals: [coatGoal()],
    gameData: {
      items: {
        coat1: { type: 'chest', g: 12000, armor: 35, resistance: 12, upgrade: { armor: 5, resistance: 2 }, grades: [] }
      },
      monsters: {},
      maps: {}
    }
  });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  return { root, service, runtime, convergence };
}

test('safe intermediate Farmer gear authorization crosses finalizer -> service executor without opening generic projected-goal delivery', async () => {
  const { root, service } = gearServiceFixture();

  const authorized = await service._executeDelivery({
    kind: 'SERVICE_DELIVERY',
    sourceReportAt: 1000,
    target: { name: 'My_Warrior' },
    delivery: { itemName: 'coat1', quantity: 1 },
    metadata: {
      alpha27GearGoal: 'My_Warrior:chest:coat1:5',
      itemLevel: 3,
      alpha27SafeIntermediateDelivery: true,
      alpha27FinalizationReason: 'RISK_GATE_PREFERS_SAFE_CURRENT_PARTY_UPGRADE'
    }
  });

  assert.equal(authorized.committed, true);
  assert.equal(authorized.reason, 'GEAR_DELIVERY_LOCAL_DELTA_VERIFIED');
  assert.equal(root.character.items[0], null);

  root.character.items[0] = { index: 0, name: 'coat1', level: 3, q: 1 };
  const unapproved = await service._executeDelivery({
    kind: 'SERVICE_DELIVERY',
    sourceReportAt: 1001,
    target: { name: 'My_Warrior' },
    delivery: { itemName: 'coat1', quantity: 1 },
    metadata: {
      alpha27GearGoal: 'My_Warrior:chest:coat1:5',
      itemLevel: 3,
      alpha27SafeIntermediateDelivery: false,
      alpha27FinalizationReason: null
    }
  });

  assert.equal(unapproved.committed, false);
  assert.equal(unapproved.reason, 'GEAR_GOAL_NOT_CURRENT');
  assert.equal(root.character.items[0].name, 'coat1');
});

test('workspace reserve violation banks a safe BANK row before progression', async () => {
  const ledger = makeLedger([
    { character: 'Merchant', index: 4, name: 'scrap', q: 1, disposition: 'BANK', reasons: ['INVENTORY_PRESSURE'] },
    { character: 'Merchant', index: 5, name: 'sword', q: 1, disposition: 'RESERVE_UPGRADE' }
  ], {
    status() {
      return {
        stale: false,
        summary: { selfInventory: { capacity: 42, occupied: 41, freeSlots: 1, workspaceSlots: 3 } }
      };
    }
  });
  const runtime = makeRuntime({
    ledger,
    engine: makeEngine(),
    controlledMerchant: makeControlledMerchant(),
    gameData: { items: { scrap: { g: 1 }, sword: { g: 1000, upgrade: true, grades: [] } }, monsters: {}, maps: {} }
  });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  let executed = null;
  convergence.merchant.restockPartyPotions = async () => false;
  convergence.merchant.criticalPartySupplyPlan = () => null;
  convergence.merchant.activeTransaction = () => null;
  convergence.merchant.executeEconomyRequest = async (request) => { executed = request; return true; };
  convergence.merchant.planUpgrade = () => { throw new Error('progression must not be reached while workspace is violated'); };

  const acted = await convergence.merchant.cycle();

  assert.equal(acted, true);
  assert.ok(executed);
  assert.equal(executed.type, 'BANK');
  assert.equal(executed.index, 4);
  assert.equal(executed.metadata.workspaceReserveRecovery, true);
  assert.equal(executed.metadata.freeSlots, 1);
  assert.equal(executed.metadata.workspaceSlots, 3);
  assert.equal(convergence.merchant.status().workspaceReserveBankPreemptions, 1);
});

test('persisted bank catalog can inform capacity planning but never grants physical action authority', () => {
  const manager = createObservableBankCapacityManager({ inventoryWorkspaceSlots: 3 });
  const observation = manager.observe({
    character: { name: 'Merchant', map: 'main', gold: 2000000 },
    bankCatalog: {
      usable: true,
      snapshot: {
        observedAt: 900,
        packCapacities: { items0: 42 },
        rows: [{ pack: 'items0', index: 0, name: 'scrap', level: 0, quantity: 10 }]
      }
    },
    gameData: { items: { scrap: { g: 1, s: 999 } } },
    observedAt: 1000
  });

  assert.equal(observation.observationState, 'PLANNING_ONLY');
  assert.equal(observation.catalogSource, 'persisted-bank-catalog');
  assert.equal(observation.totals.capacity, 42);
  assert.equal(observation.totals.occupied, 1);
  assert.equal(observation.actionAuthority, false);
  assert.equal(observation.physicalActionAuthority, false);

  const plan = manager.planSpace(
    { item: 'scrap', quantity: 1 },
    { observation, gameData: { items: { scrap: { g: 1, s: 999 } } } }
  );
  assert.equal(plan.planningOnly, true);
  assert.equal(plan.requiresLiveBankRevalidation, true);
  assert.equal(plan.actionAuthority, false);
  assert.equal(plan.executionAuthority, false);
});

test('interrupted mutation service travel arms identity-scoped backoff and does not block unrelated identity', () => {
  let now = 1000;
  const { runtime, convergence } = mutationFixture('UPGRADE');
  runtime.now = () => now;
  convergence.atomic.now = () => now;
  convergence.merchant.now = () => now;

  const tx = {
    id: 'tx-upgrade-live',
    type: 'UPGRADE',
    character: 'Merchant',
    item: 'sword',
    level: 0,
    index: 0,
    inputs: [{ index: 0, item: 'sword', level: 0 }]
  };
  const armed = convergence.atomic._armServiceTravelBackoff('newupgrade', tx, 'interrupted');
  assert.ok(armed);
  assert.equal(armed.reason, 'SERVICE_TRAVEL_INTERRUPTED_BACKOFF');

  const same = convergence.atomic.serviceTravelBackoffFor('newupgrade', tx);
  assert.ok(same);
  assert.ok(same.remainingMs > 0);

  const different = convergence.atomic.serviceTravelBackoffFor('newupgrade', {
    ...tx,
    id: 'tx-upgrade-other',
    item: 'other',
    inputs: [{ index: 1, item: 'other', level: 0 }]
  });
  assert.equal(different, null);

  now = armed.expiresAt + 1;
  assert.equal(convergence.atomic.serviceTravelBackoffFor('newupgrade', tx), null);
});

function teamRuntime() {
  let now = 1000;
  const monster = {
    id: '2651206',
    mtype: 'tortoise',
    map: 'main',
    x: 15,
    y: 0,
    hp: 1000,
    max_hp: 1000,
    target: null,
    dead: false,
    rip: false
  };
  const unsafe = {
    id: 'unsafe-1',
    mtype: 'phoenix',
    map: 'main',
    x: 20,
    y: 0,
    hp: 100000,
    max_hp: 100000,
    target: null,
    dead: false,
    rip: false
  };
  const rawParty = {
    My_Merchant: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0 },
    My_Warrior: { name: 'My_Warrior', ctype: 'warrior', map: 'main', x: 0, y: 0, hp: 1700, max_hp: 1700, mp: 250, max_mp: 250, target: null },
    My_Priest: { name: 'My_Priest', ctype: 'priest', map: 'main', x: 20, y: 0, hp: 1000, max_hp: 1000, mp: 600, max_mp: 600, target: null },
    My_Rogue: { name: 'My_Rogue', ctype: 'rogue', map: 'main', x: 10, y: 0, hp: 900, max_hp: 900, mp: 275, max_mp: 275, target: null }
  };
  const root = { parent: { party: rawParty, entities: {} }, party: rawParty };
  const safeRows = [monster];
  const farmer = {
    logicalTeamTargetId: null,
    logicalTeamTargetType: null,
    kiting: null,
    _safeLiveMonsters: () => safeRows.slice(),
    _selectTarget: () => null,
    _travel() {},
    _engage() {},
    _setLogicalTeamTarget(id, type) {
      this.logicalTeamTargetId = id == null ? null : String(id);
      this.logicalTeamTargetType = type || null;
    },
    _holdTargetSelection() {},
    _clearTarget() {},
    _transition() {}
  };
  const localFarming = { tick: () => ({ action: 'BASE' }) };
  const logistics = {
    __teamTargetReplicationInstalled: false,
    sent: [],
    _validEnvelope(sender, data) {
      return ['My_Warrior', 'My_Priest', 'My_Rogue', 'My_Merchant'].includes(String(sender))
        && data && String(data.sender || sender) === String(sender);
    },
    _send(name, action, data) {
      this.sent.push({ name, action, data });
      return Promise.resolve({ delivered: true });
    },
    receive() { return false; }
  };
  const snapshot = {
    character: { name: 'My_Rogue', ctype: 'rogue', map: 'main', x: 10, y: 0, hp: 900, max_hp: 900, mp: 275, max_mp: 275 },
    party: [
      { name: 'My_Merchant', ctype: 'merchant' },
      { name: 'My_Warrior', ctype: 'warrior' },
      { name: 'My_Priest', ctype: 'priest' },
      { name: 'My_Rogue', ctype: 'rogue' }
    ],
    entities: [monster, unsafe]
  };
  const runtime = {
    root,
    farmer,
    localFarming,
    controlledPartyLogistics: logistics,
    partyBootstrap: {
      merchantName: 'My_Merchant',
      trustedRosterNames: () => ['My_Merchant', 'My_Warrior', 'My_Priest', 'My_Rogue']
    },
    adapter: { command: () => ({ executed: true }) },
    now: () => now,
    log: { emit() {} },
    lastSnapshot: snapshot
  };
  return {
    runtime,
    farmer,
    logistics,
    monster,
    unsafe,
    snapshot,
    setNow(value) { now = value; }
  };
}

test('trusted Warrior target replication repairs follower mirror when local party view lost leader.target', () => {
  const fixture = teamRuntime();
  const cohesion = new TeamCombatCohesionHotfix(fixture.runtime, { teamTargetTtlMs: 3000 });

  const accepted = fixture.logistics.receive('My_Warrior', {
    action: TEAM_TARGET_STATE_ACTION,
    sender: 'My_Warrior',
    at: 1000,
    expiresAt: 4000,
    targetId: '2651206',
    targetType: 'tortoise'
  });
  assert.equal(accepted, true);

  const result = fixture.farmer._selectTarget({
    snapshot: fixture.snapshot,
    party: fixture.snapshot.party,
    adapter: fixture.runtime.adapter
  });
  assert.ok(result);
  assert.equal(result.target.id, '2651206');
  assert.equal(fixture.farmer.logicalTeamTargetId, '2651206');
  assert.equal(cohesion.lastTeam.leaderName, 'My_Warrior');
  assert.equal(cohesion.lastTeam.leaderTargetSource, 'TRUSTED_LEADER_REPLICATION');
  assert.equal(cohesion.stats.followerMirrors, 1);

  const wrongLeader = fixture.logistics.receive('My_Priest', {
    action: TEAM_TARGET_STATE_ACTION,
    sender: 'My_Priest',
    at: 1000,
    expiresAt: 4000,
    targetId: 'unsafe-1',
    targetType: 'phoenix'
  });
  assert.equal(wrongLeader, false);
  assert.equal(cohesion.replicatedLeaderTarget.targetId, '2651206');
});

test('replicated leader target still fails closed when target is not locally safe or state is stale', () => {
  const fixture = teamRuntime();
  const cohesion = new TeamCombatCohesionHotfix(fixture.runtime, { teamTargetTtlMs: 3000 });

  assert.equal(fixture.logistics.receive('My_Warrior', {
    action: TEAM_TARGET_STATE_ACTION,
    sender: 'My_Warrior',
    at: 1000,
    expiresAt: 4000,
    targetId: 'unsafe-1',
    targetType: 'phoenix'
  }), true);

  const unsafe = fixture.farmer._selectTarget({
    snapshot: fixture.snapshot,
    party: fixture.snapshot.party,
    adapter: fixture.runtime.adapter
  });
  assert.equal(unsafe, null);
  assert.equal(cohesion.lastDecision.reason, 'LEADER_TARGET_NOT_LOCALLY_SAFE');

  fixture.setNow(5001);
  const team = cohesion._team(fixture.snapshot);
  assert.equal(team.leaderTargetId, null);
  assert.equal(cohesion.replicatedLeaderTarget, null);
  assert.ok(cohesion.stats.teamTargetReplicatedStale >= 1);
});
