'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { installMerchantProduction } = require('../src/merchant/merchant-production-controller');
const { ControlledPartyLogistics } = require('../src/party/controlled-party-logistics');
const {
  bestDirectMaterialFarmSource,
  bestExchangeMaterialFarmSource,
  diagnoseUnavailableMaterialSource,
  estimateBlockedProductionCandidate,
  chooseProductionTeamFarmObjective
} = require('../src/party/production-material-acquisition');
const {
  probabilisticFarmTime,
  PROBABILISTIC_FARM_TIME_MODEL
} = require('../src/party/probabilistic-farm-time');

function memoryStorage() {
  const values = new Map();
  return {
    get: (key) => values.has(key) ? values.get(key) : null,
    set: (key, value) => { values.set(key, value); return true; }
  };
}

function approvedWorld(performance = new Map()) {
  return {
    performance,
    fact: () => ({ value: 'APPROVED' })
  };
}

function questGameData() {
  return {
    items: {
      shard: { type: 'material', g: 1 },
      shell: { type: 'material', g: 1, e: 20, quest: 'shells' }
    },
    drops: {
      monsters: {
        crab: [[1, 'shell', 1]]
      },
      shell: [[1, 'shard', 1]]
    },
    monsters: {
      crab: { hp: 100, attack: 10 }
    },
    maps: {
      beach: {
        monsters: [{ type: 'crab', boundary: [0, 0, 100, 100] }]
      }
    },
    npcs: {
      shellnpc: { quest: 'shells' }
    },
    quests: {
      shells: { map: 'main', in: 'main', x: 100, y: 200, id: 'shellnpc' }
    },
    events: {}
  };
}

function eventGameData() {
  return {
    items: {
      eventmat: { type: 'material', g: 1 }
    },
    drops: {
      monsters: {
        witch: [[0.2, 'eventmat', 1]]
      }
    },
    monsters: {
      witch: { hp: 1000, attack: 50 }
    },
    maps: {
      halloween: {
        event: 'halloween',
        monsters: [{ type: 'witch', boundary: [0, 0, 100, 100] }]
      }
    },
    npcs: {},
    events: {
      halloween: { type: 'seasonal', duration: 2592000 }
    }
  };
}

function runtimeFor(gameData, { now = 1700000000000, serverState = {}, performance = new Map(), registry = [] } = {}) {
  const root = {
    S: serverState,
    character: { name: 'Merchant', ctype: 'merchant', items: [], bank: {}, gold: 10000000, isize: 42 },
    parent: { entities: {} },
    G: gameData
  };
  return {
    root,
    now: () => now,
    adapter: { mode: 'active', getGameData: () => gameData },
    world: approvedWorld(performance),
    contentDrift: { requiresRevalidation: () => false },
    characterRegistry: { status: () => ({ characters: registry }) }
  };
}

function farmCandidate(name, quantity = 1, output = 'gear', improvement = 100) {
  return {
    candidate: { output, recipient: 'R1', slot: 'mainhand', improvement },
    steps: [{ kind: ProductionStepKind.FARM_REQUIRED, name, level: 0, quantity }],
    blockers: [{ reason: 'MATERIAL_FARM_REQUIRED', name, level: 0, quantity }]
  };
}

function controllerHarness(gameData, blockedPlan, options = {}) {
  const storage = memoryStorage();
  const runtime = runtimeFor(gameData, {
    serverState: options.serverState || {},
    registry: options.registry || []
  });
  if (options.characterItems) runtime.root.character.items = options.characterItems;
  runtime.log = { emit() {} };
  runtime.globalSupervisor = { status: () => ({ state: 'HEALTHY' }) };
  runtime._merchantCollectionSessionActive = () => false;
  runtime._liveEnableGate = () => ({ allowed: true });
  runtime.tick = () => {};
  runtime.status = () => ({});
  runtime.exportDiagnostics = () => '{}';
  runtime.setMode = function setMode(mode) { this.adapter.mode = mode; return mode; };
  runtime.stop = () => {};

  const calls = { farm: [], handoff: [], clears: [] };
  runtime.controlledPartyLogistics = {
    lastProductionMaterialObjective: null,
    publishProductionMaterialObjective: (row) => { calls.farm.push(JSON.parse(JSON.stringify(row))); return true; },
    publishProductionMaterialHandoffReady: (row) => { calls.handoff.push(JSON.parse(JSON.stringify(row))); return true; },
    clearProductionMaterialObjective: (reason) => { calls.clears.push(reason); return true; }
  };

  const planner = {
    plan: () => JSON.parse(JSON.stringify(blockedPlan)),
    planMaterialConsolidation: () => null,
    planExchange: options.planExchange || (() => null),
    status: () => ({ costStrategy: 'LEAST_GOLD_SOURCE_GRAPH_V3_QUEST_EVENT_PROBABILISTIC' })
  };
  const bankCatalog = {
    observe: () => true,
    needsRefresh: () => false,
    status: () => ({ usable: true, snapshot: { rows: [] } })
  };
  const executor = {
    status: () => ({ enabled: true, busy: false, activeOperation: null }),
    execute: async () => ({ executed: false, committed: false }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({ reconciled: false })
  };
  const controller = installMerchantProduction(runtime, { storage, planner, bankCatalog, executor });
  return { runtime, controller, calls };
}

test('probabilistic farm time keeps expected telemetry but uses conservative P90 with confidence', () => {
  const fallback = probabilisticFarmTime({
    requiredUnits: 1,
    unitsPerHour: 1,
    measured: false,
    evidence: 'FALLBACK'
  });
  const measured = probabilisticFarmTime({
    requiredUnits: 1,
    unitsPerHour: 1,
    measured: true,
    sampleSeconds: 3600,
    evidence: 'MEASURED'
  });

  assert.equal(fallback.model, PROBABILISTIC_FARM_TIME_MODEL);
  assert.equal(fallback.expectedHours, 1);
  assert.ok(fallback.p90Hours > fallback.expectedHours);
  assert.ok(fallback.p90Hours > measured.p90Hours);
  assert.ok(measured.confidence > fallback.confidence);
  assert.equal(fallback.decisionQuantile, 'P90');
});

test('P90 can prefer a slightly slower measured source over a lower-mean fallback source', () => {
  const gameData = {
    items: { a: { type: 'material' }, b: { type: 'material' } },
    drops: {
      monsters: {
        amon: [[1, 'a', 1]],
        bmon: [[1, 'b', 1]]
      }
    },
    monsters: { amon: {}, bmon: {} },
    maps: {
      a: { monsters: [{ type: 'amon', boundary: [0, 0, 100, 100] }] },
      b: { monsters: [{ type: 'bmon', boundary: [0, 0, 100, 100] }] }
    }
  };
  const performance = new Map([
    ['b', { monster: 'bmon', seconds: 3600, kills: 9 }]
  ]);
  const runtime = runtimeFor(gameData, { performance });
  const decision = chooseProductionTeamFarmObjective(runtime, [
    farmCandidate('a', 10, 'fallback-mean-lower', 100),
    farmCandidate('b', 10, 'measured-p90-lower', 100)
  ], { fallbackKillsPerHour: 10, maxTeamFarmHours: 12 });

  assert.ok(decision.selected);
  assert.equal(decision.selected.target.output, 'measured-p90-lower');
  const fallback = decision.evaluated.find((row) => row.output === 'fallback-mean-lower');
  const measured = decision.evaluated.find((row) => row.output === 'measured-p90-lower');
  assert.ok(fallback.totalExpectedHours < measured.totalExpectedHours);
  assert.ok(fallback.totalP90Hours > measured.totalP90Hours);
});

test('validated quest exchange becomes an explicit QUEST_EXCHANGE acquisition node', () => {
  const gameData = questGameData();
  const runtime = runtimeFor(gameData);
  const source = bestExchangeMaterialFarmSource(runtime, 'shard', 2, { fallbackKillsPerHour: 20 });

  assert.ok(source);
  assert.equal(source.kind, 'QUEST_EXCHANGE_MATERIAL_DROP');
  assert.equal(source.quest, 'shells');
  assert.equal(source.questDestination.npc, 'shellnpc');
  assert.equal(source.questDestination.map, 'main');
  assert.equal(source.expectedExchangeOperations, 2);
  assert.equal(source.p90ExchangeOperations, 2, 'deterministic reward must not receive fake exchange variance');
  assert.equal(source.quantity, 40);
  assert.equal(source.graphNode.kind, 'QUEST_EXCHANGE');
  assert.equal(source.graphNode.input.kind, 'FARM_DROP');
  assert.ok(source.p90Hours >= source.expectedHours);
});

test('quest-tagged production source without a verified NPC destination stays fail-closed', () => {
  const gameData = questGameData();
  delete gameData.quests;
  gameData.npcs = {};
  const runtime = runtimeFor(gameData);

  assert.equal(bestExchangeMaterialFarmSource(runtime, 'shard', 2, { fallbackKillsPerHour: 20 }), null);
  const diagnosis = diagnoseUnavailableMaterialSource(runtime, 'shard');
  assert.equal(diagnosis.reason, 'QUEST_SOURCE_DESTINATION_UNVERIFIED');
  assert.equal(diagnosis.quest, 'shells');
});

test('uncertain exchange rewards expand input farming to the P90 operation count', () => {
  const gameData = questGameData();
  gameData.items.shell.quest = null;
  gameData.drops.shell = [
    [0.5, 'shard', 1],
    [0.5, 'other', 1]
  ];
  gameData.items.other = { type: 'material' };
  const runtime = runtimeFor(gameData);
  const source = bestExchangeMaterialFarmSource(runtime, 'shard', 2, { fallbackKillsPerHour: 20 });

  assert.ok(source);
  assert.equal(source.kind, 'EXCHANGE_MATERIAL_DROP');
  assert.equal(source.expectedExchangeOperations, 4);
  assert.ok(source.p90ExchangeOperations > source.expectedExchangeOperations);
  assert.ok(source.riskAdjustedInputUnits > source.expectedInputUnits);
  assert.equal(source.quantity, source.p90ExchangeOperations * source.requiredPerExchange);
});

test('event-gated direct farm is executable only while live server event evidence is active', () => {
  const now = 1700000000000;
  const gameData = eventGameData();
  const activeRuntime = runtimeFor(gameData, {
    now,
    serverState: { halloween: { active: true, endsAt: now + 3600000 } }
  });
  const active = bestDirectMaterialFarmSource(activeRuntime, 'eventmat', 1, { fallbackKillsPerHour: 20 });
  assert.ok(active);
  assert.equal(active.kind, 'EVENT_DIRECT_MATERIAL_DROP');
  assert.equal(active.eventKey, 'halloween');
  assert.equal(active.graphNode.kind, 'EVENT_FARM');

  const inactiveRuntime = runtimeFor(gameData, { now, serverState: {} });
  assert.equal(bestDirectMaterialFarmSource(inactiveRuntime, 'eventmat', 1, { fallbackKillsPerHour: 20 }), null);
  const diagnosis = diagnoseUnavailableMaterialSource(inactiveRuntime, 'eventmat');
  assert.equal(diagnosis.reason, 'EVENT_SOURCE_INACTIVE');

  const estimate = estimateBlockedProductionCandidate(inactiveRuntime, farmCandidate('eventmat', 1, 'eventgear'), {
    fallbackKillsPerHour: 20,
    maxTeamFarmHours: 12
  });
  assert.equal(estimate.eligible, false);
  assert.equal(estimate.reason, 'EVENT_SOURCE_INACTIVE');
  assert.equal(estimate.deferredSource.event.eventKey, 'halloween');
});

test('boolean event flag without deterministic event key is never guessed', () => {
  const gameData = eventGameData();
  delete gameData.maps.halloween.event;
  gameData.items.eventmat.event = true;
  const runtime = runtimeFor(gameData, { serverState: { halloween: true } });

  assert.equal(bestDirectMaterialFarmSource(runtime, 'eventmat', 1, { fallbackKillsPerHour: 20 }), null);
  assert.equal(diagnoseUnavailableMaterialSource(runtime, 'eventmat').reason, 'EVENT_SOURCE_UNVERIFIED');
});

test('inactive production event demand cannot reopen as autonomous exchange cleanup', () => {
  const gameData = questGameData();
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 0 });
  const input = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      gold: 100000,
      items: [{ index: 0, name: 'shell', level: 0, q: 20 }],
      bank: {}
    },
    gameData,
    eventState: {},
    exchangeDemands: [{
      item: 'shell',
      target: 'shard',
      reason: 'PRODUCTION_MATERIAL',
      quest: 'shells',
      eventKey: 'halloween',
      output: 'gear',
      recipient: 'R1',
      expiresAt: 5000
    }]
  };

  assert.equal(planner.planExchange(input, {}), null);

  input.eventState = { halloween: { active: true } };
  const ready = planner.planExchange(input, {});
  assert.ok(ready);
  assert.equal(ready.nextStep.kind, ProductionStepKind.EXCHANGE);
  assert.equal(ready.nextStep.destination, 'shells');
  assert.equal(ready.nextStep.reason, 'EVENT_QUEST_EXCHANGE_REQUIREMENT_SATISFIED');
  assert.equal(ready.nextStep.questDestination.npc, 'shellnpc');
});

test('exact production quest input may transfer while unrelated quest items stay protected', () => {
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.now = () => 1000;
  logistics.root = {
    G: {
      items: {
        shell: { type: 'material', e: 20, quest: 'shells' },
        otherquest: { type: 'material', quest: 'other' }
      }
    }
  };
  logistics.parent = logistics.root;
  logistics.runtime = {
    farmer: {
      materialObjective: {
        kind: 'PRODUCTION_MATERIAL',
        material: 'shell',
        level: 0,
        acquisitionKind: 'QUEST_EXCHANGE_MATERIAL_DROP',
        quest: 'shells',
        expiresAt: 60000
      }
    }
  };
  logistics._isMerchant = () => false;

  const exact = logistics._safeLootDescriptor({ name: 'shell', level: 0, q: 20 });
  assert.equal(exact.ok, true);
  assert.equal(exact.merchantLifecycle, 'REQUESTED_PRODUCTION_QUEST_INPUT');

  logistics.runtime.farmer.materialObjective.quest = 'wrong-quest';
  assert.equal(logistics._safeLootDescriptor({ name: 'shell', level: 0, q: 20 }).ok, false);
  assert.equal(logistics._safeLootDescriptor({ name: 'otherquest', level: 0, q: 1 }).ok, false);
});

test('controller persists EVENT_WAITING instead of publishing an inactive event farm objective', () => {
  const gameData = eventGameData();
  const blocked = {
    id: 'event-plan',
    state: 'BLOCKED',
    reason: 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN',
    target: { output: 'eventgear', recipient: 'R1', slot: 'mainhand' },
    blockedCandidates: [farmCandidate('eventmat', 1, 'eventgear', 100)],
    reservations: {}
  };
  const { controller, calls } = controllerHarness(gameData, blocked, { serverState: {} });
  controller.cycle();

  assert.equal(calls.farm.length, 0);
  assert.equal(controller.status().productionIntent.active.phase, 'EVENT_WAITING');
  assert.equal(controller.status().productionIntent.active.reason, 'EVENT_SOURCE_INACTIVE');
  assert.equal(controller.status().productionIntent.active.progress.permanentBlock, false);
});

test('controller publishes quest input farm with P90 telemetry and persists QUEST_ACQUISITION', () => {
  const gameData = questGameData();
  const blocked = {
    id: 'quest-plan',
    state: 'BLOCKED',
    reason: 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN',
    target: { output: 'goodbow', recipient: 'R1', slot: 'mainhand' },
    blockedCandidates: [farmCandidate('shard', 2, 'goodbow', 100)],
    reservations: {}
  };
  const { controller, runtime, calls } = controllerHarness(gameData, blocked);
  controller.cycle();

  assert.equal(calls.farm.length, 1);
  const objective = calls.farm[0];
  assert.equal(objective.acquisitionKind, 'QUEST_EXCHANGE_MATERIAL_DROP');
  assert.equal(objective.material, 'shell');
  assert.equal(objective.targetMaterial, 'shard');
  assert.equal(objective.quest, 'shells');
  assert.ok(objective.p90Hours >= objective.expectedHours);
  assert.ok(objective.totalP90Hours >= objective.totalExpectedHours);
  assert.equal(objective.decisionQuantile, 'P90');
  assert.equal(controller.status().productionIntent.active.phase, 'QUEST_ACQUISITION');
  assert.equal(runtime.merchantExchangeDemands[0].quest, 'shells');
  assert.equal(runtime.merchantExchangeDemands[0].output, 'goodbow');
});

test('quest input already on Merchant advances to QUEST_READY without another Farmer farm objective', () => {
  const gameData = questGameData();
  const blocked = {
    id: 'quest-ready-plan',
    state: 'BLOCKED',
    reason: 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN',
    target: { output: 'goodbow', recipient: 'R1', slot: 'mainhand' },
    blockedCandidates: [farmCandidate('shard', 2, 'goodbow', 100)],
    reservations: {}
  };
  const { controller, runtime, calls } = controllerHarness(gameData, blocked, {
    characterItems: [{ name: 'shell', level: 0, q: 40 }]
  });
  controller.cycle();

  assert.equal(calls.farm.length, 0);
  assert.equal(controller.status().productionIntent.active.phase, 'QUEST_READY');
  assert.equal(runtime.merchantExchangeDemands.length, 1);
  assert.equal(runtime.merchantExchangeDemands[0].item, 'shell');
  assert.equal(runtime.merchantExchangeDemands[0].quest, 'shells');
});
