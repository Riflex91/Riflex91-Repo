'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { CombatMode } = require('../src/autonomy/combat-modes');
const { SmartAoePlanner, SmartAoeState } = require('../src/autonomy/smart-aoe-planner');
const { CharacterCombatProfileStore } = require('../src/autonomy/character-combat-profile');
const { TacticalPartyCombat } = require('../src/autonomy/tactical-party-combat');
const { PartySkillEngine } = require('../src/autonomy/party-skill-engine');

function storage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; }
  };
}

function team(overrides = {}) {
  return {
    members: [
      { name: 'WarriorA', ctype: 'warrior', hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000, map: 'main', x: 0, y: 0 },
      { name: 'RangerA', ctype: 'ranger', hp: 3200, max_hp: 3200, mp: 1500, max_mp: 1800, map: 'main', x: 15, y: 0 },
      { name: 'PriestA', ctype: 'priest', hp: 3000, max_hp: 3000, mp: 2600, max_mp: 3000, map: 'main', x: -15, y: 0 }
    ],
    names: ['WarriorA', 'RangerA', 'PriestA'],
    selfName: 'WarriorA',
    leaderName: 'WarriorA',
    complete: true,
    alive: true,
    sameMap: true,
    positionsKnown: true,
    cohesive: true,
    healthReady: true,
    manaReady: true,
    ...overrides
  };
}

function partyCapabilities(overrides = {}) {
  return {
    generation: 7,
    catalogReady: true,
    members: [
      {
        name: 'WarriorA', ctype: 'warrior',
        skills: [
          { id: 'cleave', configuredReady: true, targetCapacity: null, parameters: { minTargets: 3 }, capabilities: ['aoe_damage', 'multi_target_damage'] },
          { id: 'agitate', configuredReady: true, targetCapacity: null, parameters: { maxDesiredTargets: 4 }, capabilities: ['aoe_aggro_control', 'pull_control'] }
        ]
      },
      {
        name: 'RangerA', ctype: 'ranger',
        skills: [
          { id: '3shot', configuredReady: true, targetCapacity: 3, parameters: { minTargets: 2 }, capabilities: ['multi_target_damage', 'ranged_multi_target_damage'] },
          { id: '5shot', configuredReady: true, targetCapacity: 5, parameters: { minTargets: 4 }, capabilities: ['multi_target_damage', 'ranged_multi_target_damage'] }
        ]
      },
      {
        name: 'PriestA', ctype: 'priest',
        skills: [
          { id: 'partyheal', configuredReady: true, targetCapacity: null, parameters: { hpThreshold: 0.72, minInjuredMembers: 2 }, capabilities: ['party_heal', 'group_sustain'] }
        ]
      }
    ],
    combat: {
      aoePotential: true,
      aoeConfigured: true,
      support: {
        partyHeal: true,
        groupSustain: true,
        aoeControl: false,
        aoeAggroControl: true
      }
    },
    ...overrides
  };
}

function mob(id, hp = 1000, target = null) {
  return { id, mtype: 'goo', hp, max_hp: 1000, attack: 80, frequency: 1, x: 30, y: 0, target };
}

test('combat mode defaults to Smart Auto and persists per character', () => {
  const mem = storage();
  const store = new CharacterCombatProfileStore({ storage: mem, now: () => 1000 });
  assert.equal(store.getCombatMode('RangerA'), CombatMode.SMART_AUTO);

  assert.deepEqual(store.setCombatMode('RangerA', CombatMode.AOE_PREFERRED), {
    ok: true, combatMode: CombatMode.AOE_PREFERRED
  });
  assert.equal(store.getCombatMode('RangerA'), CombatMode.AOE_PREFERRED);

  const restored = new CharacterCombatProfileStore({ storage: mem, now: () => 2000 });
  assert.equal(restored.getCombatMode('RangerA'), CombatMode.AOE_PREFERRED);
  assert.equal(restored.setCombatMode('RangerA', 'not-a-mode').ok, false);
});

test('Smart Auto uses the lowest useful enabled AoE threshold while AoE preferred aims higher within the same hard capacity', () => {
  const planner = new SmartAoePlanner({ now: () => 1000 });
  const caps = partyCapabilities();
  const readyTeam = team();
  const engaged = [mob('m1', 1000, 'WarriorA')];
  const evaluations = [{ allowed: true, projectedDamageRatio: 0.08 }];

  const smart = planner.evaluate({
    mode: CombatMode.SMART_AUTO,
    team: readyTeam,
    partyCapabilities: caps,
    engagedTargets: engaged,
    evaluations
  });
  assert.equal(smart.pullCapacity, 5);
  assert.equal(smart.desiredPullSize, 2);
  assert.equal(smart.state, SmartAoeState.BUILD_PULL);
  assert.equal(smart.mayAddTarget, true);

  const preferred = planner.evaluate({
    mode: CombatMode.AOE_PREFERRED,
    team: readyTeam,
    partyCapabilities: caps,
    engagedTargets: engaged,
    evaluations
  });
  assert.equal(preferred.pullCapacity, 5);
  assert.equal(preferred.desiredPullSize, 4);
  assert.equal(preferred.state, SmartAoeState.BUILD_PULL);
  assert.equal(preferred.mayAddTarget, true);
});

test('Single Target is a hard capacity of one and AoE preferred never overrides hard safety', () => {
  const planner = new SmartAoePlanner({ now: () => 1000 });
  const caps = partyCapabilities();

  const single = planner.evaluate({
    mode: CombatMode.SINGLE_TARGET,
    team: team(),
    partyCapabilities: caps,
    engagedTargets: [mob('m1', 700, 'WarriorA')],
    evaluations: [{ allowed: true, projectedDamageRatio: 0.1 }]
  });
  assert.equal(single.pullCapacity, 1);
  assert.equal(single.desiredPullSize, 1);
  assert.equal(single.mayAddTarget, false);
  assert.equal(single.state, SmartAoeState.FINISH);

  const unsafeTeam = team({
    members: [
      { name: 'WarriorA', ctype: 'warrior', hp: 1200, max_hp: 5000, mp: 1800, max_mp: 2000 },
      { name: 'RangerA', ctype: 'ranger', hp: 3200, max_hp: 3200, mp: 1500, max_mp: 1800 },
      { name: 'PriestA', ctype: 'priest', hp: 3000, max_hp: 3000, mp: 2600, max_mp: 3000 }
    ]
  });
  const unsafe = planner.evaluate({
    mode: CombatMode.AOE_PREFERRED,
    team: unsafeTeam,
    partyCapabilities: caps,
    engagedTargets: [mob('m1', 1000, 'WarriorA'), mob('m2', 1000, 'WarriorA')],
    evaluations: [
      { allowed: true, projectedDamageRatio: 0.12 },
      { allowed: true, projectedDamageRatio: 0.12 }
    ]
  });
  assert.equal(unsafe.state, SmartAoeState.ABORT_PULL);
  assert.equal(unsafe.mayAddTarget, false);
});

test('missing sustain and AoE control conservatively caps a nominal five-target party at two', () => {
  const planner = new SmartAoePlanner({ now: () => 1000 });
  const caps = partyCapabilities({
    combat: {
      aoePotential: true,
      aoeConfigured: true,
      support: { partyHeal: false, groupSustain: false, aoeControl: false, aoeAggroControl: false }
    }
  });
  const plan = planner.evaluate({
    mode: CombatMode.AOE_PREFERRED,
    team: team(),
    partyCapabilities: caps,
    engagedTargets: [mob('m1', 1000, 'WarriorA')],
    evaluations: [{ allowed: true, projectedDamageRatio: 0.05 }]
  });
  assert.equal(plan.pullCapacity, 2);
  assert.equal(plan.desiredPullSize, 2);
});

test('candidate expansion is denied when aggregate projected damage would exceed the deterministic risk ceiling', () => {
  const planner = new SmartAoePlanner({ now: () => 1000, maxAggregateProjectedDamageRatio: 0.9 });
  const plan = planner.evaluate({
    mode: CombatMode.SMART_AUTO,
    team: team(),
    partyCapabilities: partyCapabilities(),
    engagedTargets: [mob('m1', 1000, 'WarriorA')],
    evaluations: [{ allowed: true, projectedDamageRatio: 0.55 }]
  });
  assert.equal(plan.state, SmartAoeState.BUILD_PULL);

  const rejected = planner.evaluateCandidate(plan, { allowed: true, projectedDamageRatio: 0.40 });
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.reason, 'AGGREGATE_PROJECTED_DAMAGE_TOO_HIGH');

  const allowed = planner.evaluateCandidate(plan, { allowed: true, projectedDamageRatio: 0.10 });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.resultingCount, 2);
});

function tacticalRuntime(mode = CombatMode.SMART_AUTO, snapshotOverrides = {}) {
  const primary = mob('m1', 1000, 'WarriorA');
  const extra = mob('m2', 1000, 'RangerA');
  const fresh = mob('m3', 1000, null);
  const snapshot = {
    character: { name: 'WarriorA', ctype: 'warrior', hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000, attack: 500, frequency: 1, range: 70, map: 'main', x: 0, y: 0 },
    entities: [primary, extra, fresh],
    party: [],
    ...snapshotOverrides
  };
  const teamState = team();
  const farmer = {
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities.filter((row) => row && row.mtype && !row.dead),
    _targetAllowed: () => true
  };
  const teamModule = {
    _team: () => teamState,
    _candidateAllowed: (_context, target) => snapshot.entities.some((row) => row && row.id === target.id && !row.dead),
    _sharedAggro: () => snapshot.entities.find((row) => row && row.target && teamState.names.includes(row.target)) || null
  };
  const runtime = {
    farmer,
    teamCombatCohesionHotfix: teamModule,
    now: () => 1000,
    log: { emit() {} },
    lastSnapshot: snapshot,
    characterCombatProfiles: { getCombatMode: () => mode },
    partyCapabilityResolver: { status: () => partyCapabilities() },
    adapter: { getGameData: () => ({ monsters: { goo: { hp: 1000, attack: 80, frequency: 1 } } }) }
  };
  return { runtime, snapshot, teamState, primary, extra, fresh };
}

test('TacticalPartyCombat models multiple engaged monsters but keeps a single leader-owned primary target', () => {
  const f = tacticalRuntime(CombatMode.SMART_AUTO);
  const tactical = new TacticalPartyCombat(f.runtime);
  const evaluation = tactical.evaluateTarget(f.primary, f.teamState, f.snapshot);
  tactical._setEncounter(f.primary, evaluation, 'TEST', f.teamState, f.snapshot);

  assert.equal(tactical.encounter.primaryTargetId, 'm1');
  assert.equal(tactical.encounter.targetId, 'm1');
  assert.equal(tactical.encounter.pullOwner, 'WarriorA');
  assert.deepEqual(tactical.encounter.targetIds, ['m1', 'm2']);
  assert.equal(tactical.encounter.targets.filter((row) => row.role === 'PRIMARY').length, 1);
  assert.equal(tactical.encounter.aoe.engagedCount, 2);
  assert.ok([SmartAoeState.AOE_BURN, SmartAoeState.HOLD_PULL].includes(tactical.encounter.aoe.state));
});

test('only the combat leader can expand a pull and Single Target mode blocks expansion even for the leader', () => {
  const leaderFixture = tacticalRuntime(CombatMode.SMART_AUTO, {
    entities: [mob('m1', 1000, 'WarriorA'), mob('m3', 1000, null)]
  });
  const leaderTactical = new TacticalPartyCombat(leaderFixture.runtime);
  const evalPrimary = leaderTactical.evaluateTarget(leaderFixture.primary, leaderFixture.teamState, leaderFixture.snapshot);
  leaderTactical._setEncounter(leaderFixture.primary, evalPrimary, 'TEST', leaderFixture.teamState, leaderFixture.snapshot);
  const allowed = leaderTactical.canAddTarget(leaderFixture.fresh, { snapshot: leaderFixture.snapshot, team: leaderFixture.teamState, party: {} });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.pullOwner, 'WarriorA');

  const followerTeam = team({ selfName: 'RangerA' });
  const blockedFollower = leaderTactical.canAddTarget(leaderFixture.fresh, { snapshot: leaderFixture.snapshot, team: followerTeam, party: {} });
  assert.equal(blockedFollower.allowed, false);
  assert.equal(blockedFollower.reason, 'PULL_OWNED_BY_TEAM_LEADER');

  const singleFixture = tacticalRuntime(CombatMode.SINGLE_TARGET, {
    entities: [mob('m1', 1000, 'WarriorA'), mob('m3', 1000, null)]
  });
  const singleTactical = new TacticalPartyCombat(singleFixture.runtime);
  const singleEval = singleTactical.evaluateTarget(singleFixture.primary, singleFixture.teamState, singleFixture.snapshot);
  singleTactical._setEncounter(singleFixture.primary, singleEval, 'TEST', singleFixture.teamState, singleFixture.snapshot);
  const blockedSingle = singleTactical.canAddTarget(singleFixture.fresh, { snapshot: singleFixture.snapshot, team: singleFixture.teamState, party: {} });
  assert.equal(blockedSingle.allowed, false);
  assert.equal(blockedSingle.reason, 'SINGLE_TARGET_MODE');
});


test('leader BUILD_PULL executes exactly one safe fresh same-type tag and waits for observed aggro', () => {
  let now = 1000;
  const commands = [];
  const primary = mob('m1', 1000, 'WarriorA');
  const candidate = mob('m2', 1000, null);
  const snapshot = {
    character: { name: 'WarriorA', ctype: 'warrior', hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000, attack: 500, frequency: 1, range: 70, map: 'main', x: 0, y: 0 },
    entities: [primary, candidate],
    party: []
  };
  const teamState = team();
  const farmer = {
    lastActionAt: -Infinity,
    lastSkillAttemptAt: -Infinity,
    skillUsage: { minIntervalMs: 250 },
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities.filter((row) => row && row.mtype && !row.dead)
  };
  const teamModule = {
    _team: () => teamState,
    _candidateAllowed: (_context, target) => snapshot.entities.some((row) => row && row.id === target.id && !row.dead),
    _sharedAggro: () => snapshot.entities.find((row) => row && row.target && teamState.names.includes(row.target)) || null,
    _combatGate: () => ({ allowed: true, team: teamState })
  };
  const adapter = {
    getGameData: () => ({ monsters: { goo: { hp: 1000, attack: 80, frequency: 1 } } }),
    canAttack: () => true,
    command: (action, args) => {
      commands.push({ action, args });
      return { executed: true, shadow: false };
    }
  };
  const runtime = {
    farmer,
    teamCombatCohesionHotfix: teamModule,
    now: () => now,
    log: { emit() {} },
    lastSnapshot: snapshot,
    characterCombatProfiles: { getCombatMode: () => CombatMode.SMART_AUTO },
    partyCapabilityResolver: { status: () => partyCapabilities() },
    adapter
  };
  const tactical = new TacticalPartyCombat(runtime);
  const evaluation = tactical.evaluateTarget(primary, teamState, snapshot);
  tactical._setEncounter(primary, evaluation, 'TEST', teamState, snapshot);

  assert.equal(tactical.encounter.aoe.state, SmartAoeState.BUILD_PULL);
  const first = tactical.maybeExpandPull({ snapshot, adapter, party: {} }, primary);
  assert.equal(first.acted, true);
  assert.equal(commands.length, 1);
  assert.equal(commands[0].action, 'attack');
  assert.equal(commands[0].args[0], 'm2');
  assert.equal(tactical.pendingPull.targetId, 'm2');
  assert.equal(farmer.lastActionAt, now);
  assert.equal(farmer.lastSkillAttemptAt, now);

  now += 600;
  const second = tactical.maybeExpandPull({ snapshot, adapter, party: {} }, primary);
  assert.equal(second.acted, false);
  assert.equal(second.reason, 'PULL_AGGRO_CONFIRMATION_PENDING');
  assert.equal(commands.length, 1);

  candidate.target = 'WarriorA';
  now += 600;
  tactical._refreshEncounterPlan(snapshot, teamState);
  assert.equal(tactical.pendingPull, null);
  assert.deepEqual(tactical.encounter.targetIds.sort(), ['m1', 'm2']);
  assert.equal(tactical.encounter.aoe.state, SmartAoeState.AOE_BURN);
});

test('pull expansion refuses occupied, different-type and boss/special candidates', () => {
  const primary = mob('m1', 1000, 'WarriorA');
  const occupied = mob('m2', 1000, 'OtherPlayer');
  const different = { ...mob('m3', 1000, null), mtype: 'bee' };
  const special = { ...mob('m4', 1000, null), special: true };
  const snapshot = {
    character: { name: 'WarriorA', ctype: 'warrior', hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000, attack: 500, frequency: 1, range: 70, map: 'main', x: 0, y: 0 },
    entities: [primary, occupied, different, special],
    party: []
  };
  const teamState = team();
  const farmer = {
    lastActionAt: -Infinity,
    lastSkillAttemptAt: -Infinity,
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities
  };
  const teamModule = {
    _team: () => teamState,
    _candidateAllowed: () => true,
    _sharedAggro: () => null,
    _combatGate: () => ({ allowed: true, team: teamState })
  };
  const adapter = {
    getGameData: () => ({
      monsters: {
        goo: { hp: 1000, attack: 80, frequency: 1 },
        bee: { hp: 1000, attack: 80, frequency: 1 }
      }
    }),
    canAttack: () => true,
    command: () => ({ executed: true })
  };
  const runtime = {
    farmer, teamCombatCohesionHotfix: teamModule, now: () => 1000, log: { emit() {} },
    lastSnapshot: snapshot,
    characterCombatProfiles: { getCombatMode: () => CombatMode.SMART_AUTO },
    partyCapabilityResolver: { status: () => partyCapabilities() },
    adapter
  };
  const tactical = new TacticalPartyCombat(runtime);
  tactical._setEncounter(primary, tactical.evaluateTarget(primary, teamState, snapshot), 'TEST', teamState, snapshot);
  const result = tactical.maybeExpandPull({ snapshot, adapter, party: {} }, primary);
  assert.equal(result.acted, false);
  assert.equal(result.reason, 'NO_SAFE_IN_RANGE_PULL_CANDIDATE');
});

function aoeEngineFixture({ ctype = 'ranger', skills = [], entities, mp = 1800, maxMp = 2000 }) {
  const commands = [];
  const character = {
    name: 'DpsA', ctype, hp: 3000, max_hp: 3000, mp, max_mp: maxMp,
    attack: 500, frequency: 1, map: 'main'
  };
  const snapshot = { character, entities, party: [] };
  const teamState = {
    members: [{ name: 'DpsA', ctype, hp: 3000, max_hp: 3000, mp, max_mp: maxMp, target: entities[0] && entities[0].id }],
    names: ['DpsA'], selfName: 'DpsA', leaderName: 'DpsA',
    complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true,
    healthReady: true, manaReady: true
  };
  const farmer = {
    lastSkillAttemptAt: -Infinity, lastActionAt: -Infinity,
    skillUsage: { mpReserveRatio: 0, minIntervalMs: 250, candidates: () => [] },
    _needsRecovery: () => ({ hpUnsafe: false }),
    _targetAllowed: () => true,
    _engage() {}
  };
  const policySettings = Object.fromEntries(skills.map((skill) => [skill.id, { enabled: true, parameters: skill.parameters || {} }]));
  const runtime = {
    farmer,
    now: () => 1000,
    log: { emit() {} },
    skillPolicy: {
      peek: (id) => !!policySettings[id],
      settings: (id) => policySettings[id] || null
    },
    teamCombatCohesionHotfix: {
      _team: () => teamState,
      _combatGate: () => ({ allowed: true, team: teamState })
    },
    tacticalPartyCombat: {
      encounter: {
        primaryTargetId: entities[0] && String(entities[0].id),
        targetId: entities[0] && String(entities[0].id),
        targetIds: entities.map((row) => String(row.id)),
        aoe: {
          state: SmartAoeState.AOE_BURN,
          engagedCount: entities.length,
          pullCapacity: Math.max(entities.length, 5)
        }
      },
      maybeExpandPull: () => ({ acted: false })
    },
    partyCapabilityResolver: {
      status: () => ({
        catalogReady: true,
        members: [{
          name: 'DpsA', ctype,
          skills: skills.map((skill) => ({
            ...skill,
            configuredReady: true,
            capabilities: skill.capabilities || ['multi_target_damage']
          }))
        }]
      })
    }
  };
  const liveSkills = {};
  for (const skill of skills) liveSkills[skill.id] = { class: [ctype], mp: skill.mp || 0, damage_multiplier: skill.damageMultiplier, ratio: skill.ratio, multi: skill.multi, list: skill.list };
  const adapter = {
    getGameData: () => ({ skills: liveSkills }),
    canUseSkill: () => true,
    isSkillInRange: () => true,
    command: (action, args) => {
      commands.push({ action, args });
      return { executed: true, shadow: false };
    }
  };
  const context = { snapshot, adapter, party: {} };
  return { runtime, farmer, context, teamState, commands };
}

test('AOE_BURN uses 3shot at three engaged targets but does not fire 5shot below its configured threshold', () => {
  const entities = [mob('m1', 900, 'DpsA'), mob('m2', 900, 'DpsA'), mob('m3', 900, 'DpsA')];
  const f = aoeEngineFixture({
    entities,
    skills: [
      { id: '3shot', targetCapacity: 3, parameters: { minTargets: 2 }, mp: 200, damageMultiplier: 0.7, multi: true },
      { id: '5shot', targetCapacity: 5, parameters: { minTargets: 4 }, mp: 320, damageMultiplier: 0.5, multi: true }
    ]
  });
  const engine = new PartySkillEngine(f.runtime);
  const decision = engine.decide(f.context, entities[0]);
  assert.equal(decision.id, '3shot');
  assert.deepEqual(decision.args, ['3shot', ['m1', 'm2', 'm3']]);
  assert.equal(decision.targetCount, 3);
  assert.equal(engine._execute(f.context, entities[0], decision), true);
  assert.deepEqual(f.commands[0], { action: 'use_skill', args: ['3shot', ['m1', 'm2', 'm3']] });
});

test('AOE_BURN selects 5shot when four targets satisfy the configured threshold', () => {
  const entities = [mob('m1', 900, 'DpsA'), mob('m2', 900, 'DpsA'), mob('m3', 900, 'DpsA'), mob('m4', 900, 'DpsA')];
  const f = aoeEngineFixture({
    entities,
    skills: [
      { id: '3shot', targetCapacity: 3, parameters: { minTargets: 2 }, mp: 200, damageMultiplier: 0.7, multi: true },
      { id: '5shot', targetCapacity: 5, parameters: { minTargets: 4 }, mp: 320, damageMultiplier: 0.5, multi: true }
    ]
  });
  const engine = new PartySkillEngine(f.runtime);
  const decision = engine.decide(f.context, entities[0]);
  assert.equal(decision.id, '5shot');
  assert.deepEqual(decision.args[1], ['m1', 'm2', 'm3', 'm4']);
});

test('cburst uses the configured bounded MP budget and Adventure Land target/mana pair format', () => {
  const entities = [mob('m1', 900, 'DpsA'), mob('m2', 900, 'DpsA')];
  const f = aoeEngineFixture({
    ctype: 'mage',
    entities,
    mp: 1000,
    maxMp: 1000,
    skills: [{
      id: 'cburst',
      targetCapacity: null,
      parameters: { minTargets: 2, manaBudgetRatio: 0.20 },
      mp: 80,
      ratio: 0.5,
      list: true,
      capabilities: ['multi_target_damage', 'variable_multi_target_damage']
    }]
  });
  const engine = new PartySkillEngine(f.runtime);
  const decision = engine.decide(f.context, entities[0]);
  assert.equal(decision.id, 'cburst');
  assert.deepEqual(decision.args, ['cburst', [['m1', 100], ['m2', 100]]]);
  assert.equal(decision.mpCost, 280);
});

test('support decision still outranks offensive AoE during AOE_BURN', () => {
  const entities = [mob('m1', 900, 'PriestA'), mob('m2', 900, 'PriestA')];
  const character = { name: 'PriestA', ctype: 'priest', hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000, attack: 200, frequency: 1 };
  const members = [
    { name: 'PriestA', ctype: 'priest', hp: 1000, max_hp: 1000 },
    { name: 'WarriorA', ctype: 'warrior', hp: 500, max_hp: 1000 }
  ];
  const farmer = {
    lastSkillAttemptAt: -Infinity, lastActionAt: -Infinity,
    skillUsage: { mpReserveRatio: 0, minIntervalMs: 250, candidates: () => [] },
    _needsRecovery: () => ({ hpUnsafe: false }),
    _targetAllowed: () => true,
    _engage() {}
  };
  const runtime = {
    farmer, now: () => 1000, log: { emit() {} },
    skillPolicy: {
      peek: () => true,
      settings: (id) => id === 'heal'
        ? { enabled: true, parameters: { hpThreshold: 0.65 } }
        : id === 'partyheal'
          ? { enabled: false, parameters: { hpThreshold: 0.72, minInjuredMembers: 2 } }
          : null
    },
    teamCombatCohesionHotfix: {
      _team: () => ({ members }),
      _combatGate: () => ({ allowed: true, team: { members } })
    },
    tacticalPartyCombat: {
      encounter: { primaryTargetId: 'm1', targetId: 'm1', targetIds: ['m1', 'm2'], aoe: { state: SmartAoeState.AOE_BURN, engagedCount: 2, pullCapacity: 2 } },
      maybeExpandPull: () => ({ acted: false })
    },
    partyCapabilityResolver: { status: () => ({ catalogReady: true, members: [{ name: 'PriestA', ctype: 'priest', skills: [] }] }) }
  };
  const context = {
    snapshot: { character, entities },
    adapter: {
      getGameData: () => ({ skills: { heal: { class: ['priest'], mp: 0 }, partyheal: { class: ['priest'], mp: 400 } } }),
      canUseSkill: () => true,
      isSkillInRange: () => true,
      command: () => ({ executed: true })
    },
    party: {}
  };
  const engine = new PartySkillEngine(runtime);
  const decision = engine.decide(context, entities[0]);
  assert.equal(decision.id, 'heal');
  assert.equal(decision.args[1], 'WarriorA');
});


test('fanofknives uses bounded engaged target arrays and respects its minTargets slider', () => {
  const entities = [mob('m1', 900, 'DpsA'), mob('m2', 900, 'DpsA'), mob('m3', 900, 'DpsA')];
  const f = aoeEngineFixture({
    ctype: 'rogue',
    entities,
    skills: [{
      id: 'fanofknives',
      targetCapacity: 5,
      parameters: { minTargets: 3 },
      mp: 180,
      damageMultiplier: 0.85,
      multi: true,
      capabilities: ['multi_target_damage']
    }]
  });
  const engine = new PartySkillEngine(f.runtime);
  const decision = engine.decide(f.context, entities[0]);
  assert.equal(decision.id, 'fanofknives');
  assert.deepEqual(decision.args, ['fanofknives', ['m1', 'm2', 'm3']]);
});

test('cleave and stomp only become tactical AoE decisions when their configured target threshold is met', () => {
  const two = [mob('m1', 900, 'DpsA'), mob('m2', 900, 'DpsA')];
  const cleaveBlocked = aoeEngineFixture({
    ctype: 'warrior',
    entities: two,
    skills: [{
      id: 'cleave', targetCapacity: null, parameters: { minTargets: 3 }, mp: 720,
      damageMultiplier: 1, capabilities: ['aoe_damage', 'multi_target_damage']
    }]
  });
  let engine = new PartySkillEngine(cleaveBlocked.runtime);
  assert.equal(engine.decide(cleaveBlocked.context, two[0]), null);

  const three = [mob('m1', 900, 'DpsA'), mob('m2', 900, 'DpsA'), mob('m3', 900, 'DpsA')];
  const cleaveReady = aoeEngineFixture({
    ctype: 'warrior',
    entities: three,
    skills: [{
      id: 'cleave', targetCapacity: null, parameters: { minTargets: 3 }, mp: 720,
      damageMultiplier: 1, capabilities: ['aoe_damage', 'multi_target_damage']
    }]
  });
  engine = new PartySkillEngine(cleaveReady.runtime);
  let decision = engine.decide(cleaveReady.context, three[0]);
  assert.equal(decision.id, 'cleave');
  assert.deepEqual(decision.args, ['cleave']);

  const stompReady = aoeEngineFixture({
    ctype: 'warrior',
    entities: three,
    skills: [{
      id: 'stomp', targetCapacity: null, parameters: { minTargets: 3 }, mp: 120,
      capabilities: ['aoe_control']
    }]
  });
  engine = new PartySkillEngine(stompReady.runtime);
  decision = engine.decide(stompReady.context, three[0]);
  assert.equal(decision.id, 'stomp');
  assert.deepEqual(decision.args, ['stomp']);
  assert.equal(decision.kind, 'aoe-control');
});


test('combat follower mirrors the leader primary plus visible party aggro and can use local AoE without gaining pull authority', () => {
  const primary = mob('m1', 1000, 'WarriorA');
  const extra = mob('m2', 1000, 'RangerA');
  const fresh = mob('m3', 1000, null);
  const snapshot = {
    character: { name: 'RangerA', ctype: 'ranger', hp: 3200, max_hp: 3200, mp: 1600, max_mp: 1800, attack: 500, frequency: 1, range: 120, map: 'main', x: 10, y: 0 },
    entities: [primary, extra, fresh],
    party: []
  };
  const teamState = team({
    selfName: 'RangerA',
    leaderName: 'WarriorA',
    leaderTargetId: 'm1'
  });
  const farmer = {
    lastSkillAttemptAt: -Infinity,
    lastActionAt: -Infinity,
    skillUsage: { mpReserveRatio: 0, minIntervalMs: 250, candidates: () => [] },
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities.filter((row) => row && row.mtype && !row.dead),
    _needsRecovery: () => ({ hpUnsafe: false }),
    _targetAllowed: () => true,
    _engage() {}
  };
  const teamModule = {
    _team: () => teamState,
    _candidateAllowed: (_context, target) => snapshot.entities.some((row) => row && row.id === target.id && !row.dead),
    _sharedAggro: () => primary,
    _combatGate: () => ({ allowed: true, team: teamState })
  };
  const caps = {
    generation: 2,
    catalogReady: true,
    members: [{
      name: 'RangerA',
      ctype: 'ranger',
      skills: [{
        id: '3shot',
        configuredReady: true,
        targetCapacity: 3,
        parameters: { minTargets: 2 },
        capabilities: ['multi_target_damage', 'ranged_multi_target_damage']
      }]
    }],
    combat: {
      aoePotential: true,
      aoeConfigured: true,
      support: { partyHeal: true, groupSustain: true, aoeControl: false, aoeAggroControl: true },
      configuredSupport: { partyHeal: true, groupSustain: true, aoeControl: false, aoeAggroControl: true }
    }
  };
  const runtime = {
    farmer,
    teamCombatCohesionHotfix: teamModule,
    now: () => 1000,
    log: { emit() {} },
    lastSnapshot: snapshot,
    characterCombatProfiles: { getCombatMode: () => CombatMode.SMART_AUTO },
    partyCapabilityResolver: { status: () => caps },
    skillPolicy: {
      peek: (id) => id === '3shot',
      settings: (id) => id === '3shot' ? { enabled: true, parameters: { minTargets: 2 } } : null
    },
    adapter: {
      getGameData: () => ({
        monsters: { goo: { hp: 1000, attack: 80, frequency: 1 } },
        skills: { '3shot': { class: ['ranger'], mp: 200, damage_multiplier: 0.7, multi: true } }
      })
    }
  };
  const tactical = new TacticalPartyCombat(runtime);
  runtime.tacticalPartyCombat = tactical;
  const context = {
    snapshot,
    party: {},
    adapter: {
      getGameData: runtime.adapter.getGameData,
      canUseSkill: () => true,
      isSkillInRange: () => true,
      canAttack: () => true,
      command: () => ({ executed: true })
    }
  };

  const selection = farmer._selectTarget(context);
  assert.equal(selection.target.id, 'm1');
  assert.equal(tactical.encounter.primaryTargetId, 'm1');
  assert.equal(tactical.encounter.pullOwner, 'WarriorA');
  assert.deepEqual(tactical.encounter.targetIds.sort(), ['m1', 'm2']);
  assert.equal(tactical.encounter.aoe.state, SmartAoeState.AOE_BURN);

  const blockedPull = tactical.canAddTarget(fresh, { snapshot, team: teamState, party: {} });
  assert.equal(blockedPull.allowed, false);
  assert.equal(blockedPull.reason, 'PULL_OWNED_BY_TEAM_LEADER');

  const engine = new PartySkillEngine(runtime);
  const decision = engine.decide(context, primary);
  assert.equal(decision.id, '3shot');
  assert.deepEqual(decision.args, ['3shot', ['m1', 'm2']]);
});

test('follower local Single Target mode keeps mirrored encounter but disables local AoE execution', () => {
  const primary = mob('m1', 1000, 'WarriorA');
  const extra = mob('m2', 1000, 'RangerA');
  const snapshot = {
    character: { name: 'RangerA', ctype: 'ranger', hp: 3200, max_hp: 3200, mp: 1600, max_mp: 1800, attack: 500, frequency: 1, range: 120, map: 'main', x: 10, y: 0 },
    entities: [primary, extra],
    party: []
  };
  const teamState = team({ selfName: 'RangerA', leaderName: 'WarriorA', leaderTargetId: 'm1' });
  const farmer = {
    lastSkillAttemptAt: -Infinity, lastActionAt: -Infinity,
    skillUsage: { mpReserveRatio: 0, minIntervalMs: 250, candidates: () => [] },
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities,
    _needsRecovery: () => ({ hpUnsafe: false }),
    _targetAllowed: () => true,
    _engage() {}
  };
  const teamModule = {
    _team: () => teamState,
    _candidateAllowed: () => true,
    _sharedAggro: () => primary,
    _combatGate: () => ({ allowed: true, team: teamState })
  };
  const runtime = {
    farmer, teamCombatCohesionHotfix: teamModule, now: () => 1000, log: { emit() {} }, lastSnapshot: snapshot,
    characterCombatProfiles: { getCombatMode: () => CombatMode.SINGLE_TARGET },
    partyCapabilityResolver: { status: () => ({
      generation: 2, catalogReady: true,
      members: [{ name: 'RangerA', ctype: 'ranger', skills: [{ id: '3shot', configuredReady: true, targetCapacity: 3, parameters: { minTargets: 2 }, capabilities: ['multi_target_damage'] }] }],
      combat: { aoePotential: true, aoeConfigured: true, support: {}, configuredSupport: {} }
    }) },
    skillPolicy: { peek: () => true, settings: () => ({ enabled: true, parameters: { minTargets: 2 } }) },
    adapter: { getGameData: () => ({ monsters: { goo: { hp: 1000, attack: 80, frequency: 1 } }, skills: { '3shot': { class: ['ranger'], mp: 200, damage_multiplier: 0.7, multi: true } } }) }
  };
  const tactical = new TacticalPartyCombat(runtime);
  runtime.tacticalPartyCombat = tactical;
  const context = { snapshot, party: {}, adapter: { getGameData: runtime.adapter.getGameData, canUseSkill: () => true, isSkillInRange: () => true } };
  farmer._selectTarget(context);
  assert.equal(tactical.encounter.aoe.combatMode, CombatMode.SINGLE_TARGET);
  assert.equal(tactical.encounter.aoe.state, SmartAoeState.FINISH);

  const engine = new PartySkillEngine(runtime);
  assert.equal(engine.decide(context, primary), null);
});
