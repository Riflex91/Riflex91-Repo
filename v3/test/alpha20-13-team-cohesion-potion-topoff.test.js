'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAdapter } = require('../src/game/adapter');
const { RetreatFarmerController } = require('../src/farmer/retreat-farmer');
const { LocalFarmOrchestrator } = require('../src/autonomy/local-farm-orchestrator');
const { installFarmerResourceTopoffHotfix } = require('../src/farmer/farmer-resource-topoff-hotfix');
const { installTeamCombatCohesionHotfix } = require('../src/party/team-combat-cohesion-hotfix');

function planner() {
  return {
    rank: (rows) => rows.map((row, index) => ({ ...row, score: 100 - index })),
    materiallyBetter: () => false
  };
}

function inventory({ hp = 100, mp = 100 } = {}) {
  const rows = [];
  if (hp > 0) rows.push({ index: rows.length, name: 'hpot0', q: hp });
  if (mp > 0) rows.push({ index: rows.length, name: 'mpot0', q: mp });
  return rows;
}

function character(name = 'My_Ranger1', overrides = {}) {
  return {
    name,
    ctype: 'ranger',
    level: 60,
    map: 'main',
    x: 0,
    y: 0,
    hp: 3000,
    max_hp: 3000,
    mp: 800,
    max_mp: 800,
    range: 130,
    speed: 60,
    frequency: 1,
    rip: false,
    inventory: inventory(),
    ...overrides
  };
}

function monster(id = 'm1', overrides = {}) {
  return {
    id,
    mtype: 'crab',
    map: 'main',
    x: 70,
    y: 0,
    hp: 500,
    max_hp: 500,
    target: null,
    dead: false,
    ...overrides
  };
}

function rawParty(overrides = {}) {
  return {
    My_Merchant: { name: 'My_Merchant', type: 'merchant', map: 'main', x: 5, y: 5, hp: 2000, max_hp: 2000, mp: 1500, max_mp: 1500, target: null },
    My_Ranger1: { name: 'My_Ranger1', type: 'ranger', map: 'main', x: 0, y: 0, hp: 3000, max_hp: 3000, mp: 800, max_mp: 800, target: null },
    My_Ranger2: { name: 'My_Ranger2', type: 'ranger', map: 'main', x: 30, y: 0, hp: 3000, max_hp: 3000, mp: 800, max_mp: 800, target: null },
    My_Ranger3: { name: 'My_Ranger3', type: 'ranger', map: 'main', x: 60, y: 0, hp: 3000, max_hp: 3000, mp: 800, max_mp: 800, target: null },
    ...overrides
  };
}

function snapshot(name = 'My_Ranger1', { c = {}, entities = [], party } = {}) {
  const self = character(name, c);
  return {
    observedAt: 10000,
    character: self,
    entities,
    party: party || [
      { name: 'My_Merchant', type: 'merchant', map: 'main' },
      { name: 'My_Ranger1', type: 'ranger', map: 'main' },
      { name: 'My_Ranger2', type: 'ranger', map: 'main' },
      { name: 'My_Ranger3', type: 'ranger', map: 'main' }
    ]
  };
}

function context(runtime, snap, commands = []) {
  return {
    runtime,
    snapshot: snap,
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { crab: { xp: 100 } }, skills: {} }),
      canAttack: () => true,
      canUseSkill: () => false,
      isSkillInRange: () => true,
      command: (action, args = []) => {
        commands.push({ action, args });
        return { executed: true };
      }
    },
    world: { performanceFor: () => null },
    party: {
      members: [
        { name: 'My_Ranger1', ctype: 'ranger' },
        { name: 'My_Ranger2', ctype: 'ranger' },
        { name: 'My_Ranger3', ctype: 'ranger' }
      ],
      fingerprint: 'ranger:3'
    },
    gameData: { monsters: { crab: { xp: 100 } }, skills: {} }
  };
}

function makeTeamRuntime({ localName = 'My_Ranger1', partyOverrides = {}, localOverrides = {}, entities = [], canMoveTo = () => true } = {}) {
  let now = 10000;
  const commands = [];
  const party = rawParty(partyOverrides);
  const root = {
    parent: { party },
    can_move_to: canMoveTo
  };
  const farmer = new RetreatFarmerController({
    now: () => now,
    planner: planner(),
    attackIntervalMs: 250,
    kitingMoveCooldownMs: 250
  });
  const localFarming = new LocalFarmOrchestrator({
    now: () => now,
    planner: {
      rank: () => [{ monster: 'crab', map: 'main', x: 500, y: 0, spawnIndex: 0, source: 'test', contentDisposition: 'LEGACY_ALLOWED', score: 10 }],
      materiallyBetter: () => false
    },
    moveCooldownMs: 500
  });
  const adapter = {
    mode: 'active',
    command: (action, args = []) => {
      commands.push({ action, args });
      return { executed: true };
    },
    getGameData: () => ({ monsters: { crab: { xp: 100 } }, skills: {} })
  };
  const runtime = {
    root,
    parent: root.parent,
    farmer,
    localFarming,
    adapter,
    now: () => now,
    log: { emit() {} },
    partyBootstrap: {
      trustedRosterNames: () => ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']
    },
    lastSnapshot: null
  };
  const resourceTopoff = {
    supply: (snap) => {
      const names = (snap.character.inventory || []).map((row) => row && row.name).filter(Boolean);
      const hpReady = names.some((name) => name.startsWith('hpot'));
      const mpReady = names.some((name) => name.startsWith('mpot'));
      return { hpReady, mpReady, ready: hpReady && mpReady, hpPotions: hpReady ? 100 : 0, mpPotions: mpReady ? 100 : 0 };
    },
    topOff: () => false
  };
  const hotfix = installTeamCombatCohesionHotfix(runtime, { resourceTopoff });
  const snap = snapshot(localName, { c: localOverrides, entities });
  runtime.lastSnapshot = snap;
  return { runtime, hotfix, snap, commands, party, setNow: (value) => { now = value; } };
}

test('resource topoff uses the precise MP potion action whenever mana is not full', () => {
  let used = null;
  const root = {
    character: { name: 'R', ctype: 'ranger' },
    parent: {},
    can_use: () => true,
    use: (token) => { used = token; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const runtime = { root, adapter, farmer, now: () => 10000, log: { emit() {} } };
  const hotfix = installFarmerResourceTopoffHotfix(runtime, { targetRatio: 1, cooldownMs: 650 });
  const snap = { character: character('R', { hp: 3000, max_hp: 3000, mp: 799, max_mp: 800, inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), true);
  assert.equal(used, 'use_mp');
  assert.equal(hotfix.status().lastUse.action, 'use_mp');
});

test('resource topoff avoids wasting a known MP potion on a tiny mana deficit', () => {
  let used = null;
  const root = {
    character: { name: 'R', ctype: 'ranger' },
    parent: {},
    G: { items: { mpot0: { type: 'pot', gives: [['mp', 300]] }, hpot0: { type: 'pot', gives: [['hp', 200]] } } },
    can_use: () => true,
    use: (token) => { used = token; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const hotfix = installFarmerResourceTopoffHotfix(
    { root, adapter, farmer, now: () => 10000, log: { emit() {} } },
    { targetRatio: 1, minPotionUtilization: 0.5 }
  );
  const snap = { character: character('R', { hp: 3000, max_hp: 3000, mp: 800, max_mp: 835, inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), false);
  assert.equal(used, null);
  assert.equal(hotfix.status().lastUse.reason, 'POTION_OVERHEAL_AVOIDED');
  assert.equal(hotfix.status().lastUse.restoreAmount, 300);
  assert.ok(hotfix.status().lastUse.utilization < 0.5);
  assert.equal(hotfix.status().stats.overhealAvoided, 1);
});

test('resource topoff tries viable HP when preferred MP would be wasteful', () => {
  let used = null;
  const root = {
    character: { name: 'R', ctype: 'ranger' },
    parent: {},
    G: { items: { mpot0: { type: 'pot', gives: [['mp', 300]] }, hpot0: { type: 'pot', gives: [['hp', 200]] } } },
    can_use: () => true,
    use: (token) => { used = token; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const hotfix = installFarmerResourceTopoffHotfix(
    { root, adapter, farmer, now: () => 10000, log: { emit() {} } },
    { targetRatio: 1, criticalHpRatio: 0.72, minPotionUtilization: 0.5 }
  );
  const snap = { character: character('R', { hp: 2670, max_hp: 3000, mp: 704, max_mp: 800, inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), true);
  assert.equal(used, 'use_hp');
  assert.equal(hotfix.status().lastUse.action, 'use_hp');
  assert.ok(hotfix.status().lastUse.utilization >= 0.5);
  assert.equal(hotfix.status().stats.overhealAvoided, 1);
  assert.equal(hotfix.status().stats.hpRequests, 1);
  assert.equal(hotfix.status().stats.mpRequests, 0);
});

test('resource topoff uses a known MP potion once at least half its restore is useful', () => {
  let used = null;
  const root = {
    character: { name: 'R', ctype: 'ranger' },
    parent: {},
    G: { items: { mpot0: { type: 'pot', gives: [['mp', 300]] }, hpot0: { type: 'pot', gives: [['hp', 200]] } } },
    can_use: () => true,
    use: (token) => { used = token; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const hotfix = installFarmerResourceTopoffHotfix(
    { root, adapter, farmer, now: () => 10000, log: { emit() {} } },
    { targetRatio: 1, minPotionUtilization: 0.5 }
  );
  const snap = { character: character('R', { hp: 3000, max_hp: 3000, mp: 650, max_mp: 835, inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), true);
  assert.equal(used, 'use_mp');
  assert.ok(hotfix.status().lastUse.utilization >= 0.5);
});

test('critical HP bypasses potion utilization floor', () => {
  let used = null;
  const root = {
    character: { name: 'R', ctype: 'ranger' },
    parent: {},
    G: { items: { hpot0: { type: 'pot', gives: [['hp', 1000]] }, mpot0: { type: 'pot', gives: [['mp', 300]] } } },
    can_use: () => true,
    use: (token) => { used = token; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const hotfix = installFarmerResourceTopoffHotfix(
    { root, adapter, farmer, now: () => 10000, log: { emit() {} } },
    { targetRatio: 1, criticalHpRatio: 0.9, minPotionUtilization: 0.5 }
  );
  const snap = { character: character('R', { hp: 2700, max_hp: 3000, mp: 800, max_mp: 800, inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), true);
  assert.equal(used, 'use_hp');
  assert.ok(hotfix.status().lastUse.utilization < 0.5);
});

test('resource topoff suppresses cooldown command spam before reaching the adapter', () => {
  let uses = 0;
  const root = {
    character: { name: 'R', ctype: 'ranger' },
    parent: {},
    G: { items: { mpot0: { type: 'pot', gives: [['mp', 300]] }, hpot0: { type: 'pot', gives: [['hp', 200]] } } },
    can_use: () => false,
    use: () => { uses += 1; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const hotfix = installFarmerResourceTopoffHotfix(
    { root, adapter, farmer, now: () => 10000, log: { emit() {} } },
    { targetRatio: 1, minPotionUtilization: 0.5 }
  );
  const snap = { character: character('R', { hp: 3000, max_hp: 3000, mp: 650, max_mp: 835, inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), false);
  assert.equal(uses, 0);
  assert.equal(hotfix.status().lastUse.reason, 'POTION_COOLDOWN');
  assert.equal(hotfix.status().stats.cooldownProbeSkips, 1);
  assert.equal(hotfix.status().stats.mpRequests, 0);
});

test('resource topoff does nothing when HP and MP are full', () => {
  let uses = 0;
  const root = { character: { name: 'R', ctype: 'ranger' }, parent: {}, can_use: () => true, use: () => { uses += 1; } };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const hotfix = installFarmerResourceTopoffHotfix({ root, adapter, farmer, now: () => 10000, log: { emit() {} } }, { targetRatio: 1 });
  const snap = { character: character('R', { inventory: inventory() }) };

  assert.equal(hotfix.topOff(snap), false);
  assert.equal(uses, 0);
});

test('missing MP potions marks combat supply incomplete', () => {
  const farmer = { config: {}, lastPotionAt: 0, _maybePotion() {} };
  const adapter = { mode: 'active', command: () => ({ executed: true }) };
  const hotfix = installFarmerResourceTopoffHotfix({ root: { parent: {} }, adapter, farmer, now: () => 10000, log: { emit() {} } });
  const supply = hotfix.supply({ character: character('R', { inventory: inventory({ mp: 0 }) }) });
  assert.equal(supply.hpReady, true);
  assert.equal(supply.mpReady, false);
  assert.equal(supply.ready, false);
});

test('team leader is deterministic and is My_Ranger1 for the current roster', () => {
  const { hotfix } = makeTeamRuntime();
  const status = hotfix.status();
  assert.equal(status.team.leaderName, 'My_Ranger1');
  assert.deepEqual(status.team.names, ['My_Ranger1', 'My_Ranger2', 'My_Ranger3']);
  assert.equal(status.team.cohesive, true);
});

test('a follower never opens an independent target while the leader has none', () => {
  const target = monster('m1');
  const { runtime, snap, hotfix } = makeTeamRuntime({ localName: 'My_Ranger2', entities: [target] });
  const selected = runtime.farmer._selectTarget(context(runtime, snap));
  assert.equal(selected, null);
  assert.equal(hotfix.status().lastDecision.reason, 'WAITING_FOR_TEAM_LEADER_TARGET');
});

test('a follower mirrors the leader target only when it remains locally safe and visible', () => {
  const target = monster('m1');
  const { runtime, snap, hotfix } = makeTeamRuntime({
    localName: 'My_Ranger2',
    entities: [target],
    partyOverrides: { My_Ranger1: { ...rawParty().My_Ranger1, target: 'm1' } }
  });
  const selected = runtime.farmer._selectTarget(context(runtime, snap));
  assert.ok(selected);
  assert.equal(selected.target.id, 'm1');
  assert.equal(hotfix.status().lastDecision.reason, 'TEAM_LEADER_TARGET');
});

test('follower keeps authoritative leader target knowledge even when local potion supply blocks combat', () => {
  const target = monster('m1');
  const { runtime, snap, hotfix } = makeTeamRuntime({
    localName: 'My_Ranger2',
    localOverrides: { inventory: inventory({ mp: 0 }) },
    entities: [target],
    partyOverrides: { My_Ranger1: { ...rawParty().My_Ranger1, target: 'm1' } }
  });
  const ctx = context(runtime, snap);
  const selected = runtime.farmer._selectTarget(ctx);

  assert.ok(selected);
  assert.equal(selected.target.id, 'm1');
  assert.equal(runtime.farmer.logicalTeamTargetId, 'm1');
  assert.equal(runtime.farmer.logicalTeamTargetType, 'crab');
  assert.equal(hotfix.status().lastDecision.reason, 'TEAM_LEADER_TARGET');

  const gate = hotfix._combatGate(ctx, target, 'ENGAGE');
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, 'LOCAL_POTION_SUPPLY_INCOMPLETE');
  assert.equal(runtime.farmer.logicalTeamTargetId, 'm1');
});

test('follower preserves leader target identity while the target is temporarily not locally visible', () => {
  const { runtime, snap, hotfix } = makeTeamRuntime({
    localName: 'My_Ranger2',
    entities: [],
    partyOverrides: { My_Ranger1: { ...rawParty().My_Ranger1, target: 'm1' } }
  });
  const selected = runtime.farmer._selectTarget(context(runtime, snap));

  assert.equal(selected, null);
  assert.equal(runtime.farmer.logicalTeamTargetId, 'm1');
  assert.ok(runtime.farmer.targetSelectionHold);
  assert.equal(runtime.farmer.targetSelectionHold.reason, 'LEADER_TARGET_NOT_LOCALLY_VISIBLE');
  assert.equal(hotfix.status().lastDecision.reason, 'LEADER_TARGET_NOT_LOCALLY_VISIBLE');
});

test('existing shared aggro can become a rescue target for every team member before leader target propagation', () => {
  const target = monster('danger', { target: 'My_Ranger2' });
  const { runtime, snap, hotfix } = makeTeamRuntime({ localName: 'My_Ranger3', entities: [target] });
  const ctx = context(runtime, snap);
  const selected = runtime.farmer._selectTarget(ctx);
  assert.ok(selected);
  assert.equal(selected.target.id, 'danger');
  const gate = hotfix._combatGate(ctx, target, 'ENGAGE');
  assert.equal(gate.allowed, true);
});

test('leader refuses to open a routine fight when the team is spread beyond cohesion radius', () => {
  const target = monster('m1');
  const { runtime, snap, hotfix } = makeTeamRuntime({
    localName: 'My_Ranger1',
    entities: [target],
    partyOverrides: { My_Ranger3: { ...rawParty().My_Ranger3, x: 400 } }
  });
  const selected = runtime.farmer._selectTarget(context(runtime, snap));
  assert.equal(selected, null);
  assert.equal(hotfix.status().lastDecision.reason, 'TEAM_NOT_COHESIVE');
});

test('leader rejects an oversized unaggroed routine target but accepts a normal target', () => {
  const huge = monster('boss', { max_hp: 20000, hp: 20000 });
  const first = makeTeamRuntime({ localName: 'My_Ranger1', entities: [huge] });
  assert.equal(first.runtime.farmer._selectTarget(context(first.runtime, first.snap)), null);
  assert.equal(first.hotfix.status().lastDecision.reason, 'NEW_TARGET_TOO_LARGE_FOR_ROUTINE_TEAM_PULL');

  const normal = monster('normal', { max_hp: 500, hp: 500 });
  const second = makeTeamRuntime({ localName: 'My_Ranger1', entities: [normal] });
  const selected = second.runtime.farmer._selectTarget(context(second.runtime, second.snap));
  assert.ok(selected);
  assert.equal(selected.target.id, 'normal');
});

test('missing local MP potion blocks new combat rather than wandering to a new farm plan', () => {
  const target = monster('m1');
  const { runtime, snap, hotfix, commands } = makeTeamRuntime({
    localName: 'My_Ranger1',
    localOverrides: { inventory: inventory({ mp: 0 }) },
    entities: [target]
  });
  assert.equal(runtime.farmer._selectTarget(context(runtime, snap, commands)), null);
  assert.equal(hotfix.status().lastDecision.reason, 'LOCAL_POTION_SUPPLY_INCOMPLETE');

  const noMonsterSnap = snapshot('My_Ranger1', { c: { inventory: inventory({ mp: 0 }) }, entities: [] });
  runtime.lastSnapshot = noMonsterSnap;
  const decision = runtime.localFarming.tick({ runtime, snapshot: noMonsterSnap, world: {}, party: {}, gameData: {} });
  assert.equal(decision.action, 'HOLD');
  assert.equal(decision.reason, 'LOCAL_POTION_SUPPLY_INCOMPLETE');
  assert.equal(commands.some((row) => row.action === 'move'), false);
});

test('followers do not own independent farm direction and regroup toward the leader', () => {
  const { runtime, hotfix, commands } = makeTeamRuntime({
    localName: 'My_Ranger3',
    localOverrides: { x: 140, y: 0 },
    partyOverrides: { My_Ranger3: { ...rawParty().My_Ranger3, x: 140, y: 0 } }
  });
  runtime.lastSnapshot = snapshot('My_Ranger3', { c: { x: 140, y: 0 }, entities: [] });
  const decision = runtime.localFarming.tick({ runtime, snapshot: runtime.lastSnapshot, world: {}, party: {}, gameData: {} });
  assert.ok(['FORMATION_FOLLOW', 'HOLD'].includes(decision.action));
  assert.equal(runtime.localFarming.currentPlan, null);
  assert.equal(hotfix.status().stats.localFarmFollowerSuppressed, 1);
  assert.ok(commands.some((row) => row.action === 'move'));
});

test('active shared combat suppresses follower regroup movement while support fire continues outside cohesion', () => {
  const target = monster('fight-1', { x: 0, y: 0, target: 'My_Ranger2' });
  const { runtime, hotfix, snap, commands } = makeTeamRuntime({
    localName: 'My_Ranger2',
    localOverrides: { x: 240, y: 0, target: 'fight-1' },
    partyOverrides: {
      My_Ranger1: { ...rawParty().My_Ranger1, x: 0, y: 0, target: 'fight-1' },
      My_Ranger2: { ...rawParty().My_Ranger2, x: 240, y: 0, target: 'fight-1' },
      My_Ranger3: { ...rawParty().My_Ranger3, x: 20, y: 0, target: 'fight-1' }
    },
    entities: [target]
  });
  snap.character.target = 'fight-1';
  runtime.lastSnapshot = snap;
  const ctx = context(runtime, snap, commands);
  const team = hotfix._team(snap);

  assert.equal(team.cohesive, false);
  const gate = hotfix._combatGate(ctx, target, 'ENGAGE');
  assert.equal(gate.allowed, true);
  assert.equal(gate.reason, 'ACTIVE_TEAM_COMBAT_CONTINUES_OUTSIDE_COHESION');

  assert.equal(hotfix._followLeader(ctx, team, 'REGROUP_WITH_TEAM_LEADER'), true);
  assert.equal(commands.some((row) => row.action === 'move'), false);
  assert.equal(hotfix.lastDecision.reason, 'ACTIVE_COMBAT_POSITION_OWNED_BY_COMBAT');
  assert.equal(hotfix.stats.combatFormationHolds, 1);
});

test('leader waits for followers instead of departing alone to another spawn', () => {
  const { runtime, hotfix, commands } = makeTeamRuntime({
    localName: 'My_Ranger1',
    partyOverrides: { My_Ranger3: { ...rawParty().My_Ranger3, x: 220, y: 0 } }
  });
  runtime.lastSnapshot = snapshot('My_Ranger1', { entities: [] });
  const decision = runtime.localFarming.tick({ runtime, snapshot: runtime.lastSnapshot, world: {}, party: {}, gameData: {} });
  assert.equal(decision.action, 'HOLD');
  assert.equal(decision.reason, 'WAITING_FOR_TEAM_COHESION');
  assert.equal(runtime.localFarming.currentPlan, null);
  assert.equal(commands.some((row) => row.action === 'move'), false);
  assert.equal(hotfix.status().stats.localFarmLeaderWaits, 1);
});

test('team kiting radius is smaller and a kite move cannot break formation', () => {
  const { runtime, hotfix } = makeTeamRuntime({
    localName: 'My_Ranger1',
    localOverrides: { x: 0, y: 0, range: 130 },
    partyOverrides: {
      My_Ranger2: { ...rawParty().My_Ranger2, x: 100, y: 0 },
      My_Ranger3: { ...rawParty().My_Ranger3, x: 100, y: 20 }
    }
  });
  assert.equal(runtime.farmer.kiting.tooCloseFactor, 0.52);
  assert.equal(runtime.farmer.kiting.desiredFactor, 0.70);
  assert.equal(runtime.farmer.kiting.maxStepFactor, 0.32);
  assert.equal(hotfix.status().config.kiteFormationRadius, 100);
  assert.equal(hotfix.status().strategy.hardKiteTeamTether, true);

  runtime.lastSnapshot = snapshot('My_Ranger1', { c: { x: 0, y: 0, range: 130 }, entities: [] });
  const result = runtime.farmer.kiting.evaluate(runtime.lastSnapshot.character, monster('m1', { x: 20, y: 0, target: 'My_Ranger1' }));
  assert.equal(result.shouldMove, false);
  assert.equal(result.reason, 'TEAM_COHESION_KITE_LIMIT');
  assert.equal(hotfix.status().stats.kiteCohesionBlocks, 1);
});
