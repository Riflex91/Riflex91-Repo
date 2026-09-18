'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PartyOrchestrator } = require('../src/party/orchestrator');
const { ControlledPartyBootstrap } = require('../src/party/controlled-party-bootstrap');
const { PartyTransitionController } = require('../src/party/transition-controller');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_ACK, PartyLifecycleOperationState } = require('../src/party/controlled-lifecycle-coordinator');
const { TeamCombatCohesionHotfix } = require('../src/party/team-combat-cohesion-hotfix');
const { PartyBootstrapMerchantDiscoveryHotfix } = require('../src/party/party-bootstrap-merchant-discovery-hotfix');
const { PartyLifecycleState } = require('../src/party/lifecycle-store');

function registryCharacters(rows) {
  return { characters: rows.map((row) => ({ stateConfidence: 1, online: true, available: true, dead: false, level: 80, ...row })) };
}

function combat(name, ctype) {
  return { name, ctype, stateConfidence: 1, online: true, available: true, dead: false, level: 80 };
}

function merchant(name = 'MerchantA') {
  return combat(name, 'merchant');
}

test('orchestrator models exactly one merchant plus one to three supported combat characters', () => {
  const orchestrator = new PartyOrchestrator();
  const rows = [merchant(), combat('R1', 'ranger'), combat('R2', 'ranger'), combat('R3', 'ranger')];
  const candidates = orchestrator.candidates(registryCharacters(rows));
  assert.equal(candidates.length, 7);
  assert.deepEqual([...new Set(candidates.map((row) => row.combat.length))], [1, 2, 3]);
  assert.ok(candidates.every((row) => row.members.length >= 2 && row.members.length <= 4));
  assert.ok(candidates.some((row) => row.combat.length === 3 && row.combat.every((member) => member.ctype === 'ranger')));
});

test('orchestrator keeps duplicate classes legal and rejects unsupported/no-combat topologies', () => {
  const orchestrator = new PartyOrchestrator();
  const warriors = orchestrator.candidates(registryCharacters([merchant(), combat('W1', 'warrior'), combat('W2', 'warrior')]));
  assert.ok(warriors.some((row) => row.combat.length === 2 && row.combat.every((member) => member.ctype === 'warrior')));
  const priest = orchestrator.candidates(registryCharacters([merchant(), combat('P1', 'priest')]));
  assert.equal(priest.length, 1);
  assert.equal(priest[0].combat[0].ctype, 'priest');
  assert.equal(orchestrator.candidates(registryCharacters([combat('R1', 'ranger')])).length, 0);
  assert.equal(orchestrator.candidates(registryCharacters([merchant()])).length, 0);
  assert.equal(orchestrator.candidates(registryCharacters([merchant(), combat('X', 'bard')])).length, 0);
  const multiMerchant = orchestrator.candidates(registryCharacters([merchant('M1'), merchant('M2'), combat('R1', 'ranger')]));
  assert.equal(multiMerchant.length, 2);
  assert.ok(multiMerchant.every((row) => row.members.filter((member) => member.ctype === 'merchant').length === 1));
});

function bootstrapRoot(activeNames = ['MerchantA', 'R1'], party = {}) {
  return {
    character: { name: 'MerchantA', ctype: 'merchant' },
    parent: { party, party_list: ['MerchantA'] },
    get_active_characters: () => Object.fromEntries(activeNames.map((name) => [name, name === 'MerchantA' ? 'self' : 'active']))
  };
}

test('controlled bootstrap accepts explicit trusted rosters of total size two through four', () => {
  for (const roster of [
    ['MerchantA', 'R1'],
    ['MerchantA', 'R1', 'P1'],
    ['MerchantA', 'R1', 'P1', 'W1']
  ]) {
    const bootstrap = new ControlledPartyBootstrap({ root: bootstrapRoot(roster), desiredRoster: roster, merchantName: 'MerchantA' });
    assert.deepEqual(bootstrap.trustedRosterNames(), roster);
    assert.equal(bootstrap.merchantName, 'MerchantA');
    assert.equal(bootstrap.status().trustSource, 'explicit-variable-party-roster');
    bootstrap.uninstall();
  }
});

test('controlled bootstrap keeps >4 active and foreign members fail-closed and requires trusted merchant identity', () => {
  const tooMany = new ControlledPartyBootstrap({
    root: bootstrapRoot(['MerchantA', 'R1', 'R2', 'R3', 'R4']),
    desiredRoster: ['MerchantA', 'R1'],
    merchantName: 'MerchantA'
  });
  tooMany.resume();
  assert.equal(tooMany.tick().reason, 'ACTIVE_CHARACTER_LIMIT_EXCEEDED');
  tooMany.cancel();

  const foreign = new ControlledPartyBootstrap({
    root: bootstrapRoot(['MerchantA', 'R1'], { MerchantA: { type: 'merchant' }, Foreign: { type: 'ranger' } }),
    desiredRoster: ['MerchantA', 'R1'],
    merchantName: 'MerchantA'
  });
  foreign.resume();
  assert.equal(foreign.tick().reason, 'FOREIGN_OR_INACTIVE_PARTY_MEMBER_PRESENT');
  foreign.cancel();

  assert.throws(() => new ControlledPartyBootstrap({ root: bootstrapRoot(), desiredRoster: ['MerchantA', 'R1'], merchantName: 'Missing' }), /PARTY_BOOTSTRAP_MERCHANT_NOT_IN_ROSTER/);
});

test('merchant discovery recognizes every valid explicit variable roster size', () => {
  for (const roster of [['MerchantA', 'R1'], ['MerchantA', 'R1', 'R2'], ['MerchantA', 'R1', 'R2', 'R3']]) {
    const bootstrap = new ControlledPartyBootstrap({ root: bootstrapRoot(roster), desiredRoster: roster, merchantName: 'MerchantA' });
    const discovery = new PartyBootstrapMerchantDiscoveryHotfix(bootstrap);
    assert.equal(discovery.status().disabledByExplicitRoster, true);
    bootstrap.uninstall();
  }
});

function cohesionHarness(roster, rawParty, selfName) {
  const instance = Object.create(TeamCombatCohesionHotfix.prototype);
  instance.runtime = {
    partyBootstrap: { trustedRosterNames: () => roster.slice(), merchantName: 'MerchantA' },
    farmerTerrainNavigationHotfix: null
  };
  instance.root = { parent: { party: rawParty } };
  instance.parent = instance.root.parent;
  instance.now = () => 1000;
  instance.cohesionRadius = 150;
  instance.minNewFightHpRatio = 0.9;
  instance.minNewFightMpRatio = 0.75;
  instance.lastTeam = null;
  return {
    instance,
    snapshot: {
      character: { name: selfName, ctype: rawParty[selfName] && rawParty[selfName].type, map: 'main', x: rawParty[selfName] && rawParty[selfName].x, y: rawParty[selfName] && rawParty[selfName].y, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 },
      party: Object.entries(rawParty).map(([name, row]) => ({ name, type: row.type })),
      entities: []
    }
  };
}

function partyRow(type, x, y) {
  return { type, map: 'main', x, y, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 };
}

test('cohesion supports solo combat with no follower deadlock and maxPairDistance zero', () => {
  const { instance, snapshot } = cohesionHarness(['MerchantA', 'R1'], { MerchantA: partyRow('merchant', 0, 0), R1: partyRow('ranger', 10, 10) }, 'R1');
  const team = instance._team(snapshot);
  assert.equal(team.complete, true);
  assert.equal(team.cohesive, true);
  assert.equal(team.leaderName, 'R1');
  assert.equal(team.selfName, team.leaderName);
  assert.equal(team.maxPairDistance, 0);
  assert.deepEqual(team.names, ['R1']);
});

test('cohesion handles two and three combat members pairwise and never counts merchant', () => {
  const two = cohesionHarness(['MerchantA', 'R1', 'P1'], {
    MerchantA: partyRow('merchant', 0, 0), R1: partyRow('ranger', 0, 0), P1: partyRow('priest', 30, 40)
  }, 'R1');
  const pair = two.instance._team(two.snapshot);
  assert.equal(pair.complete, true);
  assert.equal(pair.maxPairDistance, 50);
  assert.equal(pair.names.includes('MerchantA'), false);

  const three = cohesionHarness(['MerchantA', 'R1', 'P1', 'W1'], {
    MerchantA: partyRow('merchant', 0, 0), R1: partyRow('ranger', 0, 0), P1: partyRow('priest', 30, 40), W1: partyRow('warrior', 0, 100)
  }, 'P1');
  const trio = three.instance._team(three.snapshot);
  assert.equal(trio.complete, true);
  assert.equal(trio.names.length, 3);
  assert.equal(trio.leaderName, 'W1');
  assert.equal(trio.leaderPolicy, 'class-priority-then-name-v1');
});

// Leader choice must stay identical on every character; names only break ties inside one class.
test('cohesion selects the same role-aware combat leader on every member and uses names only as a deterministic tie-break', () => {
  const mixedRoster = ['MerchantA', 'R1', 'P1', 'W1'];
  const mixedParty = {
    MerchantA: partyRow('merchant', 0, 0),
    R1: partyRow('ranger', 20, 0),
    P1: partyRow('priest', 25, 20),
    W1: partyRow('warrior', 10, 10)
  };
  for (const selfName of ['R1', 'P1', 'W1']) {
    const { instance, snapshot } = cohesionHarness(mixedRoster, mixedParty, selfName);
    const team = instance._team(snapshot);
    assert.equal(team.complete, true);
    assert.equal(team.leaderName, 'W1');
    assert.equal(team.leader.ctype, 'warrior');
    assert.equal(team.leaderPolicy, 'class-priority-then-name-v1');
  }

  const rangedHarness = cohesionHarness(['MerchantA', 'M1', 'R1', 'P1'], {
    MerchantA: partyRow('merchant', 0, 0),
    M1: partyRow('mage', 20, 0),
    R1: partyRow('ranger', 30, 0),
    P1: partyRow('priest', 40, 0)
  }, 'P1');
  const ranged = rangedHarness.instance._team(rangedHarness.snapshot);
  assert.equal(ranged.leaderName, 'R1');

  const duplicateParty = {
    MerchantA: partyRow('merchant', 0, 0),
    R2: partyRow('ranger', 20, 0),
    R1: partyRow('ranger', 30, 0)
  };
  const duplicateHarness = cohesionHarness(['MerchantA', 'R2', 'R1'], duplicateParty, 'R2');
  const duplicate = duplicateHarness.instance._team(duplicateHarness.snapshot);
  assert.equal(duplicate.leaderName, 'R1');

  const soloPriestHarness = cohesionHarness(['MerchantA', 'P1'], {
    MerchantA: partyRow('merchant', 0, 0),
    P1: partyRow('priest', 10, 10)
  }, 'P1');
  assert.equal(soloPriestHarness.instance._team(soloPriestHarness.snapshot).leaderName, 'P1');
});

test('cohesion remains incomplete when trusted topology expects three combat members but only two are present', () => {
  const { instance, snapshot } = cohesionHarness(['MerchantA', 'R1', 'P1', 'W1'], {
    MerchantA: partyRow('merchant', 0, 0), R1: partyRow('ranger', 0, 0), P1: partyRow('priest', 20, 20)
  }, 'R1');
  const team = instance._team(snapshot);
  assert.equal(team.complete, false);
  assert.equal(team.cohesive, false);
});

function transitionFixture(size) {
  const members = [merchant(), ...Array.from({ length: size - 1 }, (_, index) => combat(`R${index + 1}`, index === 1 ? 'priest' : 'ranger'))];
  const active = Object.fromEntries(members.map((row) => [row.name, row.ctype === 'merchant' ? 'self' : 'active']));
  const codeSlots = Object.fromEntries(members.filter((row) => row.ctype !== 'merchant').map((row, index) => [row.name, index + 1]));
  const controller = new PartyTransitionController({
    root: { character: { name: 'MerchantA', ctype: 'merchant' }, parent: { party: {} }, get_active_characters: () => active },
    liveEnabled: true,
    merchantName: 'MerchantA',
    codeSlots
  });
  return { controller, members, registryStatus: registryCharacters(members) };
}

test('transition preflight accepts safe total party sizes two, three and four', () => {
  for (const size of [2, 3, 4]) {
    const { controller, members, registryStatus } = transitionFixture(size);
    const result = controller.preflight({ members, merchant: members[0] }, { runtimeMode: 'active', currentMembers: members, registryStatus });
    assert.equal(result.allowed, true, `size ${size}: ${result.reasons.join(',')}`);
  }
});

test('transition preflight blocks total size one, above four, missing merchant and non-merchant controller', () => {
  const base = transitionFixture(2);
  let result = base.controller.preflight({ members: [merchant()], merchant: merchant() }, { runtimeMode: 'active', currentMembers: [merchant()], registryStatus: registryCharacters([merchant()]) });
  assert.ok(result.reasons.includes('PARTY_SIZE_BELOW_MINIMUM'));

  const five = [merchant(), combat('R1', 'ranger'), combat('R2', 'ranger'), combat('R3', 'ranger'), combat('R4', 'ranger')];
  const codeSlots = { R1: 1, R2: 2, R3: 3, R4: 4 };
  const controller = new PartyTransitionController({ root: { character: { name: 'MerchantA', ctype: 'merchant' }, get_active_characters: () => ({ MerchantA: 'self', R1: 'active', R2: 'active', R3: 'active', R4: 'active' }) }, liveEnabled: true, merchantName: 'MerchantA', codeSlots });
  result = controller.preflight({ members: five, merchant: five[0] }, { runtimeMode: 'active', currentMembers: five, registryStatus: registryCharacters(five) });
  assert.ok(result.reasons.includes('PARTY_SIZE_ABOVE_MAXIMUM'));

  const noMerchant = [combat('R1', 'ranger'), combat('R2', 'priest')];
  result = base.controller.preflight({ members: noMerchant, merchant: merchant() }, { runtimeMode: 'active', currentMembers: base.members, registryStatus: registryCharacters(base.members.concat(noMerchant)) });
  assert.ok(result.reasons.includes('MERCHANT_MUST_REMAIN'));
  assert.ok(result.reasons.includes('EXACTLY_ONE_MERCHANT_REQUIRED'));

  const wrongController = new PartyTransitionController({ root: { character: { name: 'R1', ctype: 'ranger' }, get_active_characters: () => ({ MerchantA: 'active', R1: 'self' }) }, liveEnabled: true, merchantName: 'MerchantA', codeSlots: { R1: 1 } });
  result = wrongController.preflight({ members: [merchant(), combat('R1', 'ranger')], merchant: merchant() }, { runtimeMode: 'active', currentMembers: [merchant(), combat('R1', 'ranger')], registryStatus: registryCharacters([merchant(), combat('R1', 'ranger')]) });
  assert.ok(result.reasons.includes('MERCHANT_CONTROLLER_REQUIRED'));
});

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed));
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; } };
}

function lifecycleFixture(combatCount) {
  const current = [merchant(), ...Array.from({ length: combatCount }, (_, index) => combat(`R${index + 1}`, index === 1 ? 'priest' : 'ranger'))];
  const incoming = combat('RogueA', 'rogue');
  const lifeRows = current.filter((row) => row.ctype !== 'merchant').map((row, index) => ({ name: row.name, state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.8 + index * 0.01, projectedScore: 0.82 + index * 0.01 }));
  lifeRows.push({ name: incoming.name, state: PartyLifecycleState.PROMOTION_CANDIDATE, active: false, currentScore: 0.95, projectedScore: 0.96, expectedTrainingXpRatio: 1.1 });
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant' }, parent: { party: {} } },
    now: () => 1_000_000,
    storage: memoryStorage(),
    lifecycle: { status: () => ({ characters: lifeRows, thresholds: { minTrainingExpectedXpRatio: 0.75 } }) },
    transitions: { setLiveEnabled() {} },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  return { coordinator, current, registryStatus: registryCharacters(current.concat(incoming)) };
}

test('lifecycle rotations preserve current party size for one, two and three combat members', () => {
  for (const combatCount of [1, 2, 3]) {
    const { coordinator, current, registryStatus } = lifecycleFixture(combatCount);
    const plan = coordinator.plan(current, registryStatus, {});
    assert.equal(plan.planned, true, `combat count ${combatCount}: ${plan.reason || ''}`);
    assert.equal(plan.targetNames.length, current.length);
    assert.equal(new Set(plan.targetNames).size, current.length);
    assert.equal(plan.targetNames.includes('MerchantA'), true);
  }
});

test('restart reconciliation is size-consistent and remains fail-closed without blind retries', () => {
  for (const [oldNames, targetNames] of [
    [['MerchantA', 'R1'], ['MerchantA', 'RogueA']],
    [['MerchantA', 'R1', 'P1'], ['MerchantA', 'R1', 'RogueA']],
    [['MerchantA', 'R1', 'P1', 'W1'], ['MerchantA', 'R1', 'P1', 'RogueA']]
  ]) {
    const storage = memoryStorage({
      AIO_V3_PARTY_LIFECYCLE_OPERATION: JSON.stringify({
        schemaVersion: 1,
        savedAt: 1,
        lastTransitionAt: 0,
        operation: { id: 'op', state: PartyLifecycleOperationState.EXECUTING, plan: { kind: 'PROMOTION', targetNames, evidence: { context: { currentNames: oldNames } } } }
      })
    });
    const coordinator = new ControlledPartyLifecycleCoordinator({ root: { character: { name: 'MerchantA', ctype: 'merchant' } }, storage, lifecycle: { status: () => ({ characters: [], thresholds: {} }) }, transitions: { setLiveEnabled() {} } });
    assert.equal(coordinator.status().operation.state, PartyLifecycleOperationState.RECOVERING);
    const reconciled = coordinator.reconcile(targetNames);
    assert.equal(reconciled.operation.state, PartyLifecycleOperationState.COMMITTED);
  }

  const storage = memoryStorage({
    AIO_V3_PARTY_LIFECYCLE_OPERATION: JSON.stringify({ schemaVersion: 1, savedAt: 1, operation: { id: 'op', state: PartyLifecycleOperationState.EXECUTING, plan: { targetNames: ['MerchantA', 'R1'], evidence: { context: { currentNames: ['MerchantA', 'R2'] } } } } })
  });
  const coordinator = new ControlledPartyLifecycleCoordinator({ root: { character: { name: 'MerchantA', ctype: 'merchant' } }, storage, lifecycle: { status: () => ({ characters: [], thresholds: {} }) }, transitions: { setLiveEnabled() {} } });
  const ambiguous = coordinator.reconcile(['MerchantA', 'Unexpected']);
  assert.equal(ambiguous.operation.state, PartyLifecycleOperationState.FAILED_SAFE);
  assert.equal(ambiguous.operation.reason, 'RESTART_PARTY_STATE_AMBIGUOUS_NO_BLIND_RETRY');
});
