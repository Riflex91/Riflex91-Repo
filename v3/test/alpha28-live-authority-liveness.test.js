'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { FarmPlanner } = require('../src/planner/farm-planner');
const { Alpha27AtomicLedger } = require('../src/reliability/alpha27-atomic-ledger');
const { Alpha28LedgerFarmerFixes } = require('../src/reliability/alpha28-ledger-farmer-fixes');
const { Alpha28MerchantTransfers } = require('../src/reliability/alpha28-merchant-transfers');
const { Alpha28CrossMapFarmerProgression, CROSS_MAP_RECEIVER } = require('../src/reliability/alpha28-cross-map-farmer');
const { Alpha28BrainCloud } = require('../src/reliability/alpha28-brain-cloud');

function alpha28Stats() {
  return {
    ledgerSignatureFixes: 0, ledgerRecoveredSellClassifications: 0, ledgerRecoveredBankClassifications: 0,
    semanticRegroupPreserved: 0, falseAreaPressureSuppressed: 0, plannedTargetFallbackSelections: 0,
    arbitraryTransferRequests: 0, arbitraryTransferAttempts: 0, arbitraryTransfersCommitted: 0, arbitraryTransferExpired: 0,
    crossMapObjectivesPublished: 0, crossMapObjectivesReceived: 0, crossMapTravelAttempts: 0, crossMapTravelCompleted: 0,
    crossMapTravelFailedSafe: 0, brainCloudSettingPatches: 0, brainCanaryPlannerDecisions: 0, tickErrors: 0
  };
}

function shared(now = () => 1) { return { now, log: null, stats: alpha28Stats() }; }

test('Alpha27 inventory planner preserves native counts contract and autonomous disposition', () => {
  const ledger = {
    _baseDisposition(row, gameData, contentDrift, counts) {
      const same = counts.get(`${row.name}:${row.level}`) || 0;
      const meta = gameData && gameData.items && gameData.items[row.name];
      if (meta && meta.compound && same >= 3) return { disposition: 'RESERVE_COMPOUND', reasons: ['COMPOUND_SET_AVAILABLE'] };
      return { disposition: 'UNDECIDED', reasons: [] };
    },
    _resolveSellBlockers: () => [],
    status: () => ({ stale: false })
  };
  const owner = {
    runtime: {
      inventoryLedger: ledger,
      contentDrift: null,
      adapter: { getGameData: () => ({}) },
      gearProgression: {
        futureProtectionFor: () => null,
        futureSellSafetyFor: () => ({ checked: true, protected: false })
      }
    },
    options: { keepValue: 1000000, maxUpgradeLevel: 7, maxCompoundLevel: 10, upgradeValueCap: 2000000, compoundValueCap: 500000 },
    stats: { autoLedgerBankClassifications: 0, autoLedgerSellClassifications: 0 }
  };
  assert.equal(Alpha27AtomicLedger.prototype.patchInventoryLedger.call(owner), true);
  const gameData = { items: { wood: { g: 5, type: 'material' }, ringsj: { g: 100, compound: true } } };
  const counts = new Map([['wood:0', 2], ['ringsj:0', 3]]);
  assert.equal(ledger._baseDisposition({ name: 'wood', level: 0 }, gameData, null, counts).disposition, 'SELL');
  assert.equal(ledger._baseDisposition({ name: 'ringsj', level: 0 }, gameData, null, counts).disposition, 'RESERVE_COMPOUND');
  assert.doesNotThrow(() => ledger._baseDisposition({ name: 'wood', level: 0 }, gameData, null, undefined));
  assert.equal(owner.stats.autoLedgerSellClassifications, 2);
});

test('Alpha28 preserves semantic regroup and suppresses false area pressure', () => {
  const runtime = {
    now: () => 20,
    inventoryLedger: null,
    farmer: null,
    teamCombatCohesionHotfix: { _team: () => ({ complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true, regroupRequired: true, stuckMembers: ['Ranger2'] }) },
    farmAreaPressureHotfix: { _evaluate: () => ({ pressured: true, classification: 'AREA_OVERPOPULATED', monsterUptimeRatio: 0.96, contestedLossRatio: 0.05 }) }
  };
  const fixes = new Alpha28LedgerFarmerFixes(runtime, shared(() => 20));
  assert.equal(runtime.teamCombatCohesionHotfix._team({}).cohesive, false);
  const pressure = runtime.farmAreaPressureHotfix._evaluate();
  assert.equal(pressure.pressured, false);
  assert.equal(pressure.alpha28Classification, 'COMBAT_ACQUISITION_STALLED');
  assert.equal(fixes.status().semanticRegroupPreserved, true);
});

test('Alpha28 planned-target fallback preserves native ranking contract and remains leader-only', () => {
  const snapshot = {
    observedAt: 30,
    character: { name: 'Leader', map: 'main', x: 0, y: 0, speed: 50 },
    entities: [
      { id: 'safe', mtype: 'crab', map: 'main', x: 10, y: 0, hp: 100 },
      { id: 'unsafe', mtype: 'crab', map: 'main', x: 1, y: 0, hp: 100 }
    ]
  };
  const farmer = {
    planner: new FarmPlanner(),
    _selectTarget: () => null,
    _targetAllowed: () => true,
    _candidateRows: () => ({
      rows: [{ id: 'crab', monster: 'crab', xpPerHour: 6000, goldPerHour: 500, deathsPerHour: 0, confidence: 0.8, travelSeconds: 0.2, source: 'estimate-live' }],
      monsters: snapshot.entities
    })
  };
  const runtime = {
    now: () => 30,
    inventoryLedger: null,
    farmer,
    localFarming: { currentPlan: { id: 'crab-plan', monster: 'crab' } },
    preFarmingReliability: { safeEntityIds: new Set(['safe']), safeEntitySnapshotAt: 30 },
    teamCombatCohesionHotfix: { _team: () => ({ selfName: 'Leader', leaderName: 'Leader', complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true }) }
  };
  new Alpha28LedgerFarmerFixes(runtime, shared(() => 30));
  const selected = farmer._selectTarget({ snapshot, party: { fingerprint: 'party:test' } });
  assert.equal(selected.target.id, 'safe');
  assert.equal(selected.ranking.source, 'alpha28-safe-planned-fallback');
  assert.equal(Number.isFinite(selected.ranking.score), true);
  assert.equal(Number.isFinite(selected.ranking.travelSeconds), true);
  assert.doesNotThrow(() => {
    selected.ranking.score.toFixed(5);
    selected.ranking.travelSeconds.toFixed(2);
  });
  runtime.teamCombatCohesionHotfix._team = () => ({ selfName: 'Follower', leaderName: 'Leader', complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true });
  assert.equal(farmer._selectTarget({ snapshot, party: { fingerprint: 'party:test' } }), null);
});

test('Alpha28 Merchant transfer remains trusted, ledger-aware and persist-before-action', async () => {
  let persisted = false;
  let sendAfterPersist = false;
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', map: 'main', items: [{ name: 'wood', q: 5, level: 0 }] },
    G: { items: { wood: { type: 'material' } } },
    send_item: async () => { sendAfterPersist = persisted; root.character.items[0].q -= 2; return { success: true }; }
  };
  const adapter = {
    getGameData: () => root.G,
    command(action, args) {
      const fn = root[action];
      return typeof fn === 'function'
        ? { executed: true, value: fn.apply(root, args) }
        : { executed: false, reason: 'COMMAND_UNAVAILABLE' };
    }
  };
  const service = {
    maxDeliveryDistance: 400,
    stats: { rawActions: 0, deliveries: 0 }, actionTimes: [], activeOperation: null,
    _trusted: (name) => name === 'Ranger1',
    _visibleTarget: (name) => name === 'Ranger1' ? { name, map: 'main', x: 1, y: 1 } : null,
    _distanceTo: () => 1,
    _startOperation: () => { persisted = true; return true; },
    _command: (action, args) => adapter.command(action, args),
    _transition: () => {}, _timeout: (p) => Promise.resolve(p), _verify: async (fn) => fn(),
    _commit: (kind, reason, extra) => ({ executed: true, committed: true, reason, ...extra }),
    _failed: (kind, reason) => ({ executed: true, committed: false, reason }),
    _executeDelivery: async () => ({ executed: false, committed: false }),
    status: () => ({ busy: false }),
    async execute(plan) { return this._executeDelivery(plan); }
  };
  const runtime = {
    root, adapter, controlledMerchantService: service,
    partyAccountCommunication: { transport: { isOwned: (name) => name === 'Ranger1' } },
    inventoryLedger: { get: () => ({ disposition: 'KEEP' }) },
    contentDrift: { requiresRevalidation: () => false }
  };
  const state = shared(() => 40);
  const transfers = new Alpha28MerchantTransfers(runtime, state);
  assert.equal(transfers.request({ targetName: 'Stranger', index: 0, quantity: 1 }).accepted, false);
  assert.equal(transfers.request({ targetName: 'Ranger1', index: 0, quantity: 2 }).accepted, true);
  await transfers.tick();
  assert.equal(sendAfterPersist, true);
  assert.equal(root.character.items[0].q, 3);
  assert.equal(state.stats.arbitraryTransfersCommitted, 1);
});

test('Alpha28 cross-map receiver accepts only validated leader objective while party is split', () => {
  let receiver = null;
  let members = [
    { name: 'Leader', ctype: 'ranger', level: 80, gear: { mainhand: { name: 'bow', level: 7 } }, skillUnlocks: ['3shot'] },
    { name: 'Follower', ctype: 'ranger', level: 80, gear: { mainhand: { name: 'bow', level: 7 } }, skillUnlocks: ['3shot'] }
  ];
  const root = { parent: {}, character: { name: 'Follower', ctype: 'ranger', map: 'main' } };
  const runtime = {
    root, now: () => 50,
    adapter: { mode: 'active', getGameData: () => ({ maps: { main: {}, cave: {} }, monsters: { bat: {} } }) },
    world: { fact: () => ({ value: 'APPROVED' }) }, contentDrift: { requiresRevalidation: () => false },
    lastSnapshot: { character: { name: 'Follower', ctype: 'ranger', map: 'main' }, entities: [] },
    _currentMembers: () => members.map((row) => ({ ...row })),
    teamCombatCohesionHotfix: { _team: () => ({ selfName: 'Follower', leaderName: 'Leader', complete: true, alive: true, sameMap: false, positionsKnown: true, cohesive: false, members: members.map((row) => ({ ...row })) }) },
    partyAccountCommunication: { transport: { installDirectReceiver: (name, fn) => { assert.equal(name, CROSS_MAP_RECEIVER); receiver = fn; } } },
    progressionIntelligence: { status: () => ({ policy: {} }) }
  };
  const state = shared(() => 50);
  const crossMap = new Alpha28CrossMapFarmerProgression(runtime, state);
  assert.equal(crossMap._ensureReceiver(), true);
  const identity = crossMap._partyIdentity(runtime.lastSnapshot, runtime.teamCombatCohesionHotfix._team());
  const objective = {
    id: 'x1',
    kind: 'PROGRESSION',
    leaderName: 'Leader',
    partyIdentityFingerprint: identity.key,
    map: 'cave',
    monster: 'bat',
    x: 1,
    y: 2,
    expiresAt: 500,
    crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
  };
  assert.equal(receiver('Stranger', objective), false);
  assert.equal(receiver('Leader', objective), true);
  assert.equal(crossMap._sharedObjective(runtime.teamCombatCohesionHotfix._team()).id, 'x1');
  assert.equal(state.stats.crossMapObjectivesReceived, 1);

  members = [
    { name: 'Leader', ctype: 'ranger', level: 80, gear: { mainhand: { name: 'bow', level: 7 } }, skillUnlocks: ['3shot'] },
    { name: 'FollowerWeak', ctype: 'ranger', level: 20, gear: { mainhand: { name: 'bow', level: 0 } }, skillUnlocks: [] }
  ];
  assert.equal(crossMap._sharedObjective(runtime.teamCombatCohesionHotfix._team()), null);
});

test('Alpha28 cross-map travel waits for observed arrival when smart_move returns immediately', async () => {
  let now = 80;
  const root = {
    parent: {},
    character: { name: 'Leader', ctype: 'ranger', map: 'main', x: 0, y: 0, real_x: 0, real_y: 0 },
    smart_move: () => {
      setTimeout(() => {
        now += 100;
        root.character.map = 'cave';
        root.character.x = 5;
        root.character.y = 6;
        root.character.real_x = 5;
        root.character.real_y = 6;
      }, 20);
      return undefined;
    },
    stop: async () => true,
    setTimeout,
    clearTimeout
  };
  const safeTravel = {
    plans: new Map(),
    stats: {},
    breaker: () => ({ open: false }),
    plan(request) {
      const row = { id: 'travel-immediate', state: 'PLANNED', target: request.destination, leaseExpiresAt: now + 5000 };
      this.plans.set(row.id, row);
      return { accepted: true, plan: { ...row } };
    },
    get(id) { const row = this.plans.get(id); return row ? { ...row } : null; },
    observe(snapshot) {
      const row = this.plans.get('travel-immediate');
      if (row && snapshot && snapshot.character && snapshot.character.map === 'cave') row.state = 'COMPLETED';
    },
    cancel() {}
  };
  const adapter = {
    mode: 'active',
    getGameData: () => ({ maps: { main: {}, cave: {} }, monsters: { bat: {} } }),
    command(action, args) {
      if (action === 'smart_move') return { executed: true, value: root.smart_move(args[0]) };
      if (action === 'stop') return { executed: true, value: root.stop(args[0]) };
      return { executed: false, reason: 'UNAVAILABLE' };
    }
  };
  const runtime = {
    root,
    now: () => now,
    adapter,
    world: { fact: () => ({ value: 'APPROVED' }) },
    contentDrift: { requiresRevalidation: () => false },
    safeTravel,
    lastSnapshot: { character: { name: 'Leader', ctype: 'ranger', map: 'main', x: 0, y: 0 }, entities: [] },
    progressionIntelligence: { stats: { promotions: 0 } },
    localFarming: { _abort: () => true }
  };
  const state = shared(() => now);
  const crossMap = new Alpha28CrossMapFarmerProgression(runtime, state);
  crossMap.timeoutMs = 5000;
  const objective = { id: 'x-immediate', leaderName: 'Leader', map: 'cave', monster: 'bat', x: 5, y: 6, expiresAt: now + 10000, crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel' };

  assert.equal(await crossMap._execute(objective, runtime.lastSnapshot), true);
  assert.equal(root.character.map, 'cave');
  assert.equal(safeTravel.get('travel-immediate').state, 'COMPLETED');
  assert.equal(state.stats.crossMapTravelFailedSafe, 0);
});

test('Alpha28 Brain Canary and Cloud are ON without direct executor authority', () => {
  const values = { 'brain.mode': 'shadow', 'cloud.enabled': false, 'runtime.brainAuditMs': 5000 };
  const controlPlane = { get: (key, fallback) => values[key] === undefined ? fallback : values[key] };
  const planner = { rank: (rows) => rows.slice() };
  const brain = { observe: () => ({ quality: { state: 'healthy' }, student: { action: 'change_farm_target', confidence: 0.8 }, teacher: { target: 'b' } }) };
  const runtime = {
    controlPlane, planner, strategicBrainV2: brain,
    localFarming: { currentPlan: { monster: 'a' } }, lastSnapshot: { character: { name: 'Leader' } },
    cloudControlPlane: { status: () => ({ ready: false }) },
    alpha25ControlCenterBrain: { patchSettings: (patch) => { Object.assign(values, patch); return { changed: Object.keys(patch) }; } }
  };
  const state = shared(() => 60);
  const bridge = new Alpha28BrainCloud(runtime, state);
  assert.equal(bridge.ensureSettings(), true);
  assert.equal(values['brain.mode'], 'canary');
  assert.equal(values['cloud.enabled'], true);
  assert.equal(planner.rank([{ id: 'a', monster: 'a' }, { id: 'b', monster: 'b' }], {})[0].monster, 'b');
  assert.equal(bridge.status().brainDirectExecutorAccess, false);
});

test('Alpha28 cross-map execution journals through SafeTravel and verifies arrival', async () => {
  let travelRow = null;
  const root = {
    parent: {}, character: { name: 'Leader', ctype: 'ranger', map: 'main', x: 0, y: 0 },
    smart_move: async (destination) => { root.character.map = destination.map; root.character.x = destination.x; root.character.y = destination.y; return { success: true }; },
    stop: async () => true
  };
  const safeTravel = {
    plans: new Map(), stats: {}, breaker: () => ({ open: false }),
    plan(request) { travelRow = { id: 'travel-1', state: 'PLANNED', target: request.destination, leaseExpiresAt: 999999 }; this.plans.set(travelRow.id, travelRow); return { accepted: true, plan: { ...travelRow } }; },
    get(id) { const row = this.plans.get(id); return row ? { ...row } : null; },
    observe() { this.plans.get('travel-1').state = 'COMPLETED'; },
    cancel() {}
  };
  const runtime = {
    root, now: () => 70, adapter: { mode: 'active', getGameData: () => ({ maps: { main: {}, cave: {} }, monsters: { bat: {} } }) },
    world: { fact: () => ({ value: 'APPROVED' }) }, contentDrift: { requiresRevalidation: () => false }, safeTravel,
    lastSnapshot: { character: { name: 'Leader', ctype: 'ranger', map: 'main', x: 0, y: 0 }, entities: [] },
    progressionIntelligence: { stats: { promotions: 0 } }, localFarming: { _abort: () => true }
  };
  const state = shared(() => 70);
  const crossMap = new Alpha28CrossMapFarmerProgression(runtime, state);
  const objective = { id: 'x2', leaderName: 'Leader', map: 'cave', monster: 'bat', x: 5, y: 6, expiresAt: 500, crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel' };
  assert.equal(await crossMap._execute(objective, runtime.lastSnapshot), true);
  assert.equal(root.character.map, 'cave');
  assert.equal(safeTravel.get('travel-1').state, 'COMPLETED');
  assert.equal(state.stats.crossMapTravelCompleted, 1);
});
