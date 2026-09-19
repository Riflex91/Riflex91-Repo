'use strict';

// Final integration gate: generated runtime bundle must remain unchanged on this user-authored PR head.

const test = require('node:test');
const assert = require('node:assert/strict');

const { TacticalPartyCombat } = require('../src/autonomy/tactical-party-combat');
const { SmartAoePlanner } = require('../src/autonomy/smart-aoe-planner');
const { CombatMode } = require('../src/autonomy/combat-modes');
const { LocalFarmPlanner } = require('../src/autonomy/local-farm-planner');
const { Alpha9Runtime } = require('../src/autonomy/alpha9-runtime');
const { FarmPlanner } = require('../src/planner/farm-planner');
const { AoeFarmingCertification } = require('../src/autonomy/aoe-farming-certification');

function member(name, ctype, x = 0) {
  return {
    name, ctype, level: 80,
    hp: 4000, max_hp: 4000,
    mp: 1800, max_mp: 2000,
    attack: 500, frequency: 1, range: ctype === 'warrior' ? 70 : 120,
    map: 'main', x, y: 0, gear: {}, skillUnlocks: []
  };
}

function teamState() {
  const members = [
    member('WarriorA', 'warrior', 0),
    member('RangerA', 'ranger', 15),
    member('PriestA', 'priest', -15)
  ];
  return {
    members,
    names: members.map((row) => row.name),
    selfName: 'WarriorA',
    leaderName: 'WarriorA',
    complete: true,
    alive: true,
    sameMap: true,
    positionsKnown: true,
    cohesive: true,
    healthReady: true,
    manaReady: true
  };
}

function capabilities() {
  return {
    generation: 1,
    catalogReady: true,
    members: [
      {
        name: 'WarriorA',
        ctype: 'warrior',
        skills: [
          {
            id: 'cleave',
            configuredReady: true,
            targetCapacity: null,
            parameters: { minTargets: 3 },
            capabilities: ['aoe_damage', 'multi_target_damage']
          },
          {
            id: 'agitate',
            configuredReady: true,
            targetCapacity: null,
            parameters: { maxDesiredTargets: 4 },
            capabilities: ['aoe_aggro_control', 'pull_control']
          }
        ]
      },
      {
        name: 'RangerA',
        ctype: 'ranger',
        skills: [
          {
            id: '3shot',
            configuredReady: true,
            targetCapacity: 3,
            parameters: { minTargets: 2 },
            capabilities: ['multi_target_damage', 'ranged_multi_target_damage']
          },
          {
            id: '5shot',
            configuredReady: true,
            targetCapacity: 5,
            parameters: { minTargets: 4 },
            capabilities: ['multi_target_damage', 'ranged_multi_target_damage']
          }
        ]
      },
      {
        name: 'PriestA',
        ctype: 'priest',
        skills: [{
          id: 'partyheal',
          configuredReady: true,
          targetCapacity: null,
          parameters: { hpThreshold: 0.72, minInjuredMembers: 2 },
          capabilities: ['party_heal', 'group_sustain']
        }]
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
      },
      configuredSupport: {
        partyHeal: true,
        groupSustain: true,
        aoeControl: false,
        aoeAggroControl: true
      }
    }
  };
}

function mob(id, x, target = null, mtype = 'goo') {
  return {
    id, mtype, x, y: 0,
    hp: 1000, max_hp: 1000,
    attack: 80, frequency: 1,
    target
  };
}

function tacticalFixture(entities, canAttack) {
  let now = 1000;
  const commands = [];
  const team = teamState();
  const snapshot = {
    character: { ...team.members[0] },
    entities,
    party: []
  };
  const primary = entities[0];
  const farmer = {
    lastActionAt: -Infinity,
    lastSkillAttemptAt: -Infinity,
    skillUsage: { mpReserveRatio: 0.30, minIntervalMs: 250, candidates: () => [] },
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities.filter((row) => row && row.mtype && !row.dead),
    _targetAllowed: () => true
  };
  const teamModule = {
    _team: () => team,
    _candidateAllowed: (_context, target) => snapshot.entities.some((row) => row && row.id === target.id && !row.dead),
    _sharedAggro: () => snapshot.entities.find((row) => row && row.target && team.names.includes(String(row.target))) || null,
    _combatGate: () => ({ allowed: true, team })
  };
  const gameData = {
    monsters: {
      goo: { hp: 1000, attack: 80, frequency: 1 },
      bee: { hp: 1000, attack: 80, frequency: 1 }
    },
    skills: {
      agitate: { class: ['warrior'], mp: 420, range: 320, cooldown: 2200, hostile: true }
    }
  };
  const adapter = {
    getGameData: () => gameData,
    canUseSkill: (id) => id === 'agitate',
    canAttack: (id) => canAttack ? canAttack(id) : true,
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
    characterCombatProfiles: { getCombatMode: () => CombatMode.AOE_PREFERRED },
    partyCapabilityResolver: { status: () => capabilities() },
    adapter
  };
  const tactical = new TacticalPartyCombat(runtime);
  return {
    runtime, tactical, snapshot, team, farmer, adapter, commands, primary,
    setNow(value) { now = value; },
    advance(ms) { now += ms; }
  };
}

test('Warrior agitate can pull multiple safe targets outside normal autoattack range', () => {
  const primary = mob('m1', 30, 'WarriorA');
  const second = mob('m2', 150, null);
  const third = mob('m3', 260, null);
  const fx = tacticalFixture([primary, second, third], () => false);
  const evaluation = fx.tactical.evaluateTarget(primary, fx.team, fx.snapshot);
  fx.tactical._setEncounter(primary, evaluation, 'TEST', fx.team, fx.snapshot);

  assert.equal(fx.tactical.encounter.aoe.desiredPullSize, 4);
  const result = fx.tactical.maybeExpandPull({ snapshot: fx.snapshot, adapter: fx.adapter, party: {} }, primary);

  assert.equal(result.acted, true);
  assert.equal(result.decision.action, 'SMART_AOE_PULL_AGITATE');
  assert.deepEqual(result.decision.targetIds.sort(), ['m2', 'm3']);
  assert.deepEqual(fx.commands, [{ action: 'use_skill', args: ['agitate'] }]);
  assert.equal(fx.tactical.pendingPull.via, 'AGITATE');
  assert.deepEqual(fx.tactical.pendingPull.targetIds.sort(), ['m2', 'm3']);
  assert.equal(fx.tactical.status().stats.agitateCommands, 1);

  second.target = 'WarriorA';
  third.target = 'WarriorA';
  fx.advance(500);
  fx.tactical._refreshEncounterPlan(fx.snapshot, fx.team);
  assert.equal(fx.tactical.pendingPull, null);
  assert.deepEqual(fx.tactical.encounter.targetIds.sort(), ['m1', 'm2', 'm3']);
  assert.equal(fx.tactical.status().stats.pullExpansionObserved, 2);
});

test('agitate fails closed when its radius contains an unsafe unplanned monster and falls back to one safe tag', () => {
  const primary = mob('m1', 30, 'WarriorA');
  const safe = mob('m2', 50, null);
  const unsafeDifferentType = mob('b1', 100, null, 'bee');
  const fx = tacticalFixture([primary, safe, unsafeDifferentType], (id) => id === 'm2');
  const evaluation = fx.tactical.evaluateTarget(primary, fx.team, fx.snapshot);
  fx.tactical._setEncounter(primary, evaluation, 'TEST', fx.team, fx.snapshot);

  const result = fx.tactical.maybeExpandPull({ snapshot: fx.snapshot, adapter: fx.adapter, party: {} }, primary);

  assert.equal(result.acted, true);
  assert.equal(result.decision.action, 'SMART_AOE_PULL_EXPAND');
  assert.deepEqual(fx.commands, [{ action: 'attack', args: ['m2'] }]);
  assert.equal(fx.tactical.pendingPull.via, 'TAG');
  assert.equal(fx.tactical.status().stats.agitateCommands, 0);
  assert.equal(fx.tactical.status().stats.agitateUnsafeRadiusBlocks, 1);
});

test('AoE farm planning exposes capability context without recursive runtime calls', () => {
  const planner = new SmartAoePlanner({ now: () => 1000 });
  const fakeRuntime = {
    _partyProfile: () => ({ fingerprint: 'party::test', size: 3 }),
    partyCapabilityResolver: { status: () => capabilities() },
    characterCombatProfiles: { getCombatMode: () => CombatMode.AOE_PREFERRED },
    tacticalPartyCombat: { smartAoePlanner: planner }
  };
  const snapshot = { character: { name: 'WarriorA' } };

  const party = Alpha9Runtime.prototype._farmPlanningParty.call(fakeRuntime, snapshot);

  assert.equal(party.fingerprint, 'party::test');
  assert.equal(party.aoe.combatMode, CombatMode.AOE_PREFERRED);
  assert.equal(party.aoe.configured, true);
  assert.equal(party.aoe.hardCapacity, 5);
  assert.equal(party.aoe.desiredPullSize, 4);
});

test('AoE preferred farm ranking favors a dense pack when baseline farm value is equal', () => {
  const local = new LocalFarmPlanner({
    aoeClusterRadius: 300,
    aoePreferredBonus: 0.14,
    aoeSmartBonus: 0.08
  });
  const farm = new FarmPlanner({ explorationWeight: 0 });
  const snapshot = {
    character: { name: 'WarriorA', map: 'main', x: 250, y: 0, speed: 50 },
    entities: []
  };
  const gameData = {
    maps: {
      main: {
        monsters: [
          { type: 'goo', x: 0, y: 0, count: 1 },
          { type: 'bee', x: 500, y: 0, count: 4 }
        ]
      }
    },
    monsters: {
      goo: { xp: 100 },
      bee: { xp: 100 }
    }
  };
  const world = {
    fact: () => ({ value: 'APPROVED' }),
    performanceFor: () => null
  };
  const party = {
    fingerprint: 'party::aoe',
    aoe: {
      configured: true,
      combatMode: CombatMode.AOE_PREFERRED,
      hardCapacity: 4,
      desiredPullSize: 4
    }
  };

  const ranked = local.rank(snapshot, gameData, world, party, farm);

  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].monster, 'bee');
  assert.equal(ranked[0].packPotential, 4);
  assert.equal(ranked[0].aoeFarmFit, 1);
  assert.ok(ranked[0].aoeFarmBonus > ranked[1].aoeFarmBonus);
  assert.ok(ranked[0].score > ranked[1].score);
});

function aoeOutcome(id, endedAt, pullSize, overrides = {}) {
  return {
    schemaVersion: 1,
    encounterId: id,
    leaderName: 'WarriorA',
    lifecycleState: 'RESOLVED',
    outcome: 'SUCCESS',
    contentDisposition: 'APPROVED',
    learningEligible: true,
    maxEngaged: pullSize,
    aoeSkillExecutions: 1,
    deaths: 0,
    retreats: 0,
    nearDeaths: 0,
    safetyMargin: 0.80,
    startedAt: endedAt - 10000,
    endedAt,
    ...overrides
  };
}

test('AoE certification passes a controlled live smoke and bounded soak, then fails closed on content drift', () => {
  let now = 100000;
  const runtime = {
    now: () => now,
    adapter: { mode: 'active' },
    log: { emit() {} }
  };
  const certification = new AoeFarmingCertification(runtime, {
    soakWindowMs: 60000,
    minSoakEncounters: 4,
    minDistinctPullSizes: 2,
    minSafetyMargin: 0.45,
    maxNearDeathRate: 0.10,
    maxRetreatRate: 0.15
  });

  const rows = [
    aoeOutcome('aoe-1', 100000, 2),
    aoeOutcome('aoe-2', 116000, 3),
    aoeOutcome('aoe-3', 132000, 2),
    aoeOutcome('aoe-4', 150000, 3)
  ];
  let result = null;
  for (const row of rows) {
    now = row.endedAt;
    result = certification.recordOutcome(row);
  }

  assert.equal(result.accepted, true);
  assert.equal(result.smoke.pass, true);
  assert.equal(result.soak.pass, true);
  assert.equal(result.soak.reason, 'AOE_SOAK_PASSED');
  assert.deepEqual(result.soak.pullSizes, [2, 3]);
  assert.equal(certification.status().liveSmoke.passes, 4);

  now = 151000;
  const drift = certification.recordOutcome(aoeOutcome('aoe-drift', now, 2, {
    outcome: 'CONTENT_DRIFT',
    lifecycleState: 'ABORTED',
    contentDisposition: 'QUARANTINED',
    learningEligible: false
  }));

  assert.equal(drift.accepted, true);
  assert.equal(drift.smoke.pass, false);
  assert.equal(drift.soak.pass, false);
  assert.equal(drift.soak.reason, 'SOAK_CONTENT_DRIFT');
  assert.equal(certification.status().stats.soakResets, 1);
});
