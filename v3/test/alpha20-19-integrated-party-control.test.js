'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AccountCharacterTransport } = require('../src/party/account-character-transport');
const { installAlpha2019AccountTransportHotfix } = require('../src/reliability/alpha20-19-account-transport-hotfix');
const { ControlledPartyLogistics } = require('../src/reliability/controlled-party-logistics');
const { patchLogisticsPrototype } = require('../src/reliability/alpha20-15-combat-logistics-hotfix');
const { patchAlpha2019LogisticsStabilization } = require('../src/reliability/alpha20-19-logistics-stabilization');
const { FarmAreaPressureHotfix, areaKey } = require('../src/reliability/farm-area-pressure-hotfix');
const { patchAdaptiveFarmIntelligence } = require('../src/autonomy/adaptive-farm-intelligence');
const { TacticalPartyCombat } = require('../src/autonomy/tactical-party-combat');
const { AdvancedPartyMovement } = require('../src/autonomy/advanced-party-movement');
const { PartySkillEngine } = require('../src/autonomy/party-skill-engine');
const { RELEASE_VERSION } = require('../src/release-version');

function tacticalFixture(meta = {}) {
  let now = 10000;
  const squig = { id: 's1', mtype: 'squigtoad', map: 'main', x: 70, y: 0, hp: 14400, max_hp: 14400, attack: 160, frequency: 1, target: null, dead: false };
  const snapshot = {
    character: { name: 'R1', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 3600, max_hp: 3600, mp: 900, max_mp: 900, attack: 330, frequency: 1, range: 120, target: null },
    entities: [
      squig,
      { name: 'R2', ctype: 'ranger', map: 'main', x: 10, y: 0, hp: 3500, max_hp: 3500, attack: 320, frequency: 1, range: 120 },
      { name: 'R3', ctype: 'ranger', map: 'main', x: -10, y: 0, hp: 3500, max_hp: 3500, attack: 320, frequency: 1, range: 120 }
    ]
  };
  const teamState = {
    members: [
      { name: 'R1', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 3600, max_hp: 3600, mp: 900, max_mp: 900 },
      { name: 'R2', ctype: 'ranger', map: 'main', x: 10, y: 0, hp: 3500, max_hp: 3500, mp: 900, max_mp: 900 },
      { name: 'R3', ctype: 'ranger', map: 'main', x: -10, y: 0, hp: 3500, max_hp: 3500, mp: 900, max_mp: 900 }
    ],
    names: ['R1', 'R2', 'R3'], selfName: 'R1', leaderName: 'R1', complete: true
  };
  teamState.self = teamState.members[0]; teamState.leader = teamState.members[0];
  const farmer = {
    _selectTarget: () => ({ target: squig, ranking: { monster: squig.mtype, score: 1, travelSeconds: 0 } }),
    _safeLiveMonsters: (snap) => snap.entities.filter((row) => row && row.mtype && !row.dead),
    _targetAllowed: () => true,
    _needsRecovery: () => ({ hpUnsafe: false }),
    _maybeReassessTarget: (_context, target) => target
  };
  const team = {
    _team: () => teamState,
    _candidateAllowed: (_context, target) => !!target && !target.dead,
    _sharedAggro: (context, state) => (context.snapshot.entities || []).find((row) => row && row.mtype && row.target && state.names.includes(String(row.target))) || null,
    _combatGate: () => ({ allowed: true, team: teamState })
  };
  const runtime = { farmer, teamCombatCohesionHotfix: team, adapter: { getGameData: () => ({ monsters: meta }) }, lastSnapshot: snapshot, now: () => now, log: { emit() {} } };
  const tactical = new TacticalPartyCombat(runtime);
  return { runtime, farmer, team, tactical, snapshot, teamState, squig, setNow: (value) => { now = value; } };
}

test('Alpha20.17 allows a normal 14,400 HP squigtoad for three healthy Rangers', () => {
  const { tactical, team, teamState, snapshot, squig } = tacticalFixture({ squigtoad: { attack: 160, frequency: 1 } });
  const result = tactical.evaluateTarget(squig, teamState, snapshot);
  assert.equal(result.allowed, true);
  assert.equal(team._oversizedNewTarget(squig, teamState), false);
  assert.ok(result.ttkSeconds < tactical.config.maxRoutineTtkSeconds);
});

test('Alpha20.17 rejects a fresh boss/special pull but keeps an active encounter locked', () => {
  const { tactical, farmer, snapshot, teamState, squig } = tacticalFixture({ squigtoad: { attack: 160 }, raidboss: { boss: true, attack: 500 } });
  const boss = { id: 'b1', mtype: 'raidboss', map: 'main', x: 80, y: 0, hp: 10000, max_hp: 10000, target: null };
  assert.equal(tactical.evaluateTarget(boss, teamState, snapshot).allowed, false);
  const context = { snapshot, party: {} };
  const first = farmer._selectTarget(context);
  assert.equal(first.target.id, squig.id);
  assert.equal(tactical.encounter.targetId, squig.id);
  snapshot.entities.push({ id: 's2', mtype: 'squigtoad', map: 'main', x: 20, y: 0, hp: 5000, max_hp: 14400, target: null });
  const second = farmer._selectTarget(context);
  assert.equal(second.target.id, squig.id);
  assert.equal(second.ranking.source, 'tactical-encounter-lock');
});

test('Alpha20.19 direct transport requires observed-active even when broader party evidence exists', async () => {
  installAlpha2019AccountTransportHotfix();
  const direct = []; const cm = [];
  const root = {
    character: { name: 'R1' },
    get_active_characters: () => ({ R1: 'self' }),
    get_player: (name) => name === 'R2' ? { name: 'R2', ctype: 'ranger', map: 'main', hp: 1000 } : null,
    command_character: (name, code) => { direct.push({ name, code }); },
    send_cm: (name, payload) => { cm.push({ name, payload }); },
    parent: {
      entities: { r2: { name: 'R2', ctype: 'ranger', map: 'main', x: 20, y: 0, hp: 1000 } },
      party: { R2: { name: 'R2', map: 'main', x: 20, y: 0, hp: 1000 } }
    }
  };
  const transport = new AccountCharacterTransport({ root, trustedNames: ['R1', 'R2', 'R3'] });
  assert.equal(transport.strongLiveEvidence('R2').live, true);
  const result = await transport.send('R2', { ok: true }, { receiver: '__rx', sender: 'R1' });
  assert.equal(result.transport, 'send_cm');
  assert.equal(direct.length, 0);
  assert.equal(cm.length, 1);
  await transport.send('R3', { ok: true }, { receiver: '__rx', sender: 'R1' });
  assert.equal(cm.length, 2);
  const status = transport.status();
  assert.equal(status.directRequiresObservedActive, true);
  assert.equal(status.directRequiresStrongLiveEvidence, false);
  assert.deepEqual(status.directEligibleOwnedNames, ['R1']);
  assert.equal(status.stats.directSkippedUnobserved, 2);
});

test('Alpha20.19 direct failure arms backoff before falling back to CM', async () => {
  installAlpha2019AccountTransportHotfix();
  let directCalls = 0; let cmCalls = 0;
  const root = {
    character: { name: 'R1' },
    get_active_characters: () => ({ R1: 'self', R2: 'active' }),
    command_character: () => { directCalls += 1; throw new Error('direct failed'); },
    send_cm: () => { cmCalls += 1; },
    parent: { party: { R2: { name: 'R2', map: 'main', x: 20, y: 0, hp: 1000 } } }
  };
  const transport = new AccountCharacterTransport({ root, trustedNames: ['R1', 'R2'] });
  await transport.send('R2', {}, { receiver: '__rx', sender: 'R1' });
  await transport.send('R2', {}, { receiver: '__rx', sender: 'R1' });
  assert.equal(directCalls, 1);
  assert.equal(cmCalls, 2);
  assert.equal(transport.status().stats.directSkippedBackoff, 1);
});

function logisticsRuntime(clock, transportResult = { delivered: true }) {
  const transport = {
    receiver: null,
    trustedRosterNames: () => ['My_Merchant', 'My_Ranger1'],
    activeNames: () => ['My_Merchant', 'My_Ranger1'],
    installDirectReceiver(_name, handler) { this.receiver = handler; return true; },
    send: () => Promise.resolve(transportResult)
  };
  const root = { character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', x: 0, y: 0, gold: 123456, isize: 42, items: [{ index: 0, name: 'hpbelt', q: 1 }] }, parent: {}, on_cm: null };
  root.parent.character = root.character;
  const runtime = {
    root, now: () => clock.now, log: { emit() {} },
    adapter: { mode: 'active', snapshot: () => ({ character: { ...root.character, inventory: root.character.items }, entities: [] }) },
    partyAccountCommunication: { transport }, partyControlLease: { merchantName: 'My_Merchant' },
    partyBootstrap: { trustedRosterNames: () => transport.trustedRosterNames() }
  };
  return { runtime, root, transport };
}

test('Alpha20.19 failed LOOT_OFFER releases pendingOffer instead of deadlocking item and gold logistics', async () => {
  patchLogisticsPrototype(); patchAlpha2019LogisticsStabilization();
  const clock = { now: 10000 }; const { runtime } = logisticsRuntime(clock, { delivered: false, reason: 'quota' });
  const logistics = new ControlledPartyLogistics(runtime);
  logistics.lastMerchantStatus = { receivedAt: clock.now, acceptingLoot: true, lootSignal: 'ACCEPTING_LOOT', map: 'main', x: 20, y: 0 };
  const snap = runtime.adapter.snapshot();
  assert.equal(logistics._offerInventoryItem(snap), true);
  assert.ok(logistics.pendingOffer);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(logistics.pendingOffer, null);
  assert.equal(logistics.status().alpha20_19.stats.offerTransportFailures, 1);
});

test('Alpha20.19 stale offer expires and Merchant status exposes explicit loot signal and 300 potion reserve', () => {
  patchLogisticsPrototype(); patchAlpha2019LogisticsStabilization();
  const clock = { now: 30000 }; const { runtime, root } = logisticsRuntime(clock);
  const logistics = new ControlledPartyLogistics(runtime);
  logistics.pendingOffer = { kind: 'item', offerId: 'stale', at: 1000 };
  logistics._prune();
  assert.equal(logistics.pendingOffer, null);
  root.character.name = 'My_Merchant'; root.character.ctype = 'merchant'; root.character.items = [null]; root.character.isize = 1;
  const payload = logistics._statusPayload(runtime.adapter.snapshot());
  assert.equal(payload.lootSignal, 'ACCEPTING_LOOT');
  assert.equal(payload.merchantPotionReservePerType, 300);
  assert.equal(logistics.config.farmerPotionLow, 50);
  assert.equal(logistics.config.farmerPotionTarget, 5000);
});

function intelligenceInstance(samples) {
  patchAdaptiveFarmIntelligence();
  const instance = Object.create(FarmAreaPressureHotfix.prototype);
  instance.runtime = { root: { localStorage: { getItem: () => null, setItem() {} } } };
  instance.now = () => 60000;
  instance.config = { windowMs: 60000, minSamples: 4, minDwellMs: 1000, availabilityThreshold: 0.22, idleThreshold: 0.72, foreignPresenceThreshold: 0.35, contestedLossThreshold: 0.30, minSpawnRatePerMin: 2.5, maxAverageWaitMs: 9000, minKillsPerMin: 1.5 };
  instance.samples = samples; instance.sampleAreaSince = 0; instance.stats = { evaluations: 0 };
  instance.exclusions = new Map(); instance._prune = () => {};
  return instance;
}

test('Alpha20.16 distinguishes overpopulation from spawn starvation', () => {
  const key = areaKey({ map: 'main', monster: 'squigtoad', spawnIndex: 0 });
  const crowdedRows = Array.from({ length: 6 }, (_, i) => ({ at: i * 10000, areaKey: key, matchingMonsters: 1, targetActive: false, foreignPlayers: 2, spawnAppearances: 1, partyKills: 0, contestedLosses: 1, xpDelta: 0, waitCompleted: 0, waitCompletedMs: 0, currentWaitMs: 10000 }));
  const starvedRows = Array.from({ length: 6 }, (_, i) => ({ at: i * 10000, areaKey: key, matchingMonsters: 0, targetActive: false, foreignPlayers: 0, spawnAppearances: 0, partyKills: 0, contestedLosses: 0, xpDelta: 0, waitCompleted: 0, waitCompletedMs: 0, currentWaitMs: 12000 }));
  const plan = { map: 'main', monster: 'squigtoad', spawnIndex: 0 };
  assert.equal(intelligenceInstance(crowdedRows)._evaluate(plan).classification, 'AREA_OVERPOPULATED');
  assert.equal(intelligenceInstance(starvedRows)._evaluate(plan).classification, 'AREA_SPAWN_STARVED');
});

test('Alpha20.18 generates bounded class-aware formation and shared group-orbit waypoints', () => {
  const target = { id: 'm1', mtype: 'goo', x: 60, y: 0 };
  const teamState = { members: [
    { name: 'R1', ctype: 'ranger', x: 0, y: 0, map: 'main' },
    { name: 'R2', ctype: 'ranger', x: -100, y: 0, map: 'main' },
    { name: 'R3', ctype: 'ranger', x: -80, y: 20, map: 'main' }
  ], names: ['R1','R2','R3'], leaderName: 'R1', selfName: 'R2', complete: true, cohesive: true, positionsKnown: true };
  teamState.leader = teamState.members[0]; teamState.self = teamState.members[1];
  const team = {
    lastTeam: teamState,
    _team() { this.lastTeam = teamState; return teamState; },
    _followWaypoint: () => ({ x: -40, y: 0, step: 60, offsetDeg: 0, distance: 100 })
  };
  const farmer = { kiting: { evaluate: () => ({ shouldMove: true, x: -20, y: 0, step: 30, range: 120 }) } };
  const runtime = { root: { can_move_to: () => true }, now: () => 10000, log: { emit() {} }, farmer, teamCombatCohesionHotfix: team, farmerTerrainNavigationHotfix: { orbitDirectionByCharacter: new Map() }, tacticalPartyCombat: { encounter: { targetId: 'm1' } }, lastSnapshot: { character: { name: 'R2', ctype: 'ranger', x: -100, y: 0, range: 120 }, entities: [target] }, localFarming: { currentPlan: null } };
  const movement = new AdvancedPartyMovement(runtime);
  team._team(runtime.lastSnapshot);
  const follow = team._followWaypoint(teamState.self, teamState.leader);
  assert.ok(follow && follow.step <= 120);
  const kite = farmer.kiting.evaluate(runtime.lastSnapshot.character, target);
  assert.equal(kite.groupOrbit, true);
  assert.ok(kite.step <= 120);
  assert.equal(movement.status().merchantExcludedFromCombatFormation, true);
});

test('Alpha20.19 prioritizes Ranger Supershot for worthwhile targets and avoids expensive Supershot overkill', () => {
  const commands = []; let baseEngages = 0;
  const teamState = { members: [{ name: 'R1', ctype: 'ranger', hp: 3000, max_hp: 3000, target: 'm1' }, { name: 'R2', ctype: 'ranger', hp: 3000, max_hp: 3000, target: 'm1' }, { name: 'R3', ctype: 'ranger', hp: 3000, max_hp: 3000, target: 'm1' }], names: ['R1','R2','R3'], selfName: 'R1', leaderName: 'R1', complete: true };
  const farmer = {
    lastSkillAttemptAt: -Infinity, lastActionAt: -Infinity,
    skillUsage: { mpReserveRatio: 0, minIntervalMs: 250, candidates: () => [
      { id: 'supershot', mp: 400, damageMultiplier: 1.5, cooldown: 30000 },
      { id: 'quickshot', mp: 50, damageMultiplier: 1.2, cooldown: 500 }
    ] },
    _needsRecovery: () => ({ hpUnsafe: false }), _targetAllowed: () => true,
    _engage: () => { baseEngages += 1; }
  };
  const team = { _team: () => teamState, _combatGate: () => ({ allowed: true, team: teamState }) };
  const runtime = { farmer, teamCombatCohesionHotfix: team, now: () => 10000, log: { emit() {} } };
  const engine = new PartySkillEngine(runtime);
  const character = { name: 'R1', ctype: 'ranger', hp: 3000, max_hp: 3000, mp: 800, max_mp: 1000, attack: 500, frequency: 1 };
  const target = { id: 'm1', mtype: 'squigtoad', hp: 5000, max_hp: 14400 };
  const context = { snapshot: { character, entities: [target] }, party: {}, adapter: { getGameData: () => ({ skills: {} }), canUseSkill: () => true, isSkillInRange: () => true, command: (action, args) => { commands.push({ action, args }); return { executed: true }; } } };
  assert.equal(engine.decide(context, target).id, 'supershot');
  farmer._engage(context, target);
  assert.equal(commands[0].args[0], 'supershot');
  assert.equal(baseEngages, 1);
  farmer.lastSkillAttemptAt = -Infinity;
  const tiny = { ...target, hp: 300 };
  const tinyDecision = engine.decide(context, tiny);
  assert.notEqual(tinyDecision && tinyDecision.id, 'supershot');
  assert.ok(engine.stats.overkillSkips >= 1);
});

test('visible integrated release version is Alpha20.23', () => {
  assert.equal(RELEASE_VERSION, '3.0.0-alpha.20.72');
});
