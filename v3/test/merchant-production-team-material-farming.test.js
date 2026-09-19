'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { ControlledPartyLogistics, Action } = require('../src/party/controlled-party-logistics');
const {
  bestDirectMaterialFarmSource,
  estimateBlockedProductionCandidate,
  chooseProductionTeamFarmObjective
} = require('../src/party/production-material-acquisition');

function runtimeForDrops(dropChance = 0.5) {
  const gameData = {
    items: {
      weakbow: { type: 'weapon', attack: 1, class: ['ranger'], g: 10 },
      goodbow: { type: 'weapon', attack: 20, class: ['ranger'], g: 1000 },
      wood: { type: 'material', g: 10 }
    },
    craft: {
      goodbow: { cost: 100, items: [[10, 'wood', 0]] }
    },
    drops: {
      monsters: {
        goo: [[dropChance, 'wood', 1]]
      }
    },
    monsters: {
      goo: { hp: 100, attack: 10 }
    },
    maps: {
      main: {
        monsters: [{ type: 'goo', boundary: [0, 0, 100, 100] }]
      }
    },
    npcs: {}
  };
  return {
    adapter: { getGameData: () => gameData },
    world: {
      performance: new Map(),
      fact: () => ({ value: 'APPROVED' })
    },
    contentDrift: { requiresRevalidation: () => false }
  };
}

function blockedCandidate(quantity = 10, improvement = 20) {
  return {
    candidate: {
      output: 'goodbow',
      recipient: 'R1',
      slot: 'mainhand',
      improvement,
      survivalImprovement: 0,
      speedImprovement: 0
    },
    steps: [{
      kind: ProductionStepKind.FARM_REQUIRED,
      name: 'wood',
      level: 0,
      quantity
    }],
    blockers: [{ reason: 'MATERIAL_FARM_REQUIRED', name: 'wood', level: 0, quantity }]
  };
}

test('production material source estimates team farm time from drops and observed/fallback kill rate', () => {
  const runtime = runtimeForDrops(0.5);
  const source = bestDirectMaterialFarmSource(runtime, 'wood', 10, { fallbackKillsPerHour: 20 });
  assert.ok(source);
  assert.equal(source.monster, 'goo');
  assert.equal(source.map, 'main');
  assert.equal(source.evidence, 'CONSERVATIVE_FALLBACK_KILLS_PER_HOUR');
  assert.equal(source.unitsPerHour, 10);
  assert.equal(source.expectedHours, 1);
});

test('production material acquisition keeps a 100h+ recipe valid but deprioritized', () => {
  const runtime = runtimeForDrops(0.001);
  const estimate = estimateBlockedProductionCandidate(runtime, blockedCandidate(10, 1000), {
    maxTeamFarmHours: 12,
    fallbackKillsPerHour: 20
  });
  assert.equal(estimate.eligible, true);
  assert.equal(estimate.reason, 'LONG_TEAM_FARM_PATH_DEPRIORITIZED');
  assert.equal(estimate.longPath, true);
  assert.equal(estimate.priorityTier, 1);
  assert.ok(estimate.totalExpectedHours > 100);
  assert.equal(estimate.maxTeamFarmHours, 12);
});

test('production material acquisition rejects leveled ingredients instead of pretending they can be directly farmed', () => {
  const runtime = runtimeForDrops(0.5);
  const candidate = blockedCandidate(3, 50);
  candidate.steps[0].level = 2;
  candidate.blockers[0].level = 2;
  const estimate = estimateBlockedProductionCandidate(runtime, candidate, { maxTeamFarmHours: 12 });
  assert.equal(estimate.eligible, false);
  assert.equal(estimate.reason, 'LEVELED_MATERIAL_REQUIRES_PROGRESSION');
});

test('production material chooser puts <=12h paths ahead of much stronger 100h+ paths', () => {
  const runtime = runtimeForDrops(0.001);
  const veryLong = blockedCandidate(10, 100000);
  veryLong.candidate.output = 'legendarybow';
  const shortRuntime = runtimeForDrops(0.5);
  const short = blockedCandidate(10, 50);
  short.candidate.output = 'practicalbow';

  const longEstimate = estimateBlockedProductionCandidate(runtime, veryLong, {
    maxTeamFarmHours: 12,
    fallbackKillsPerHour: 20
  });
  const shortEstimate = estimateBlockedProductionCandidate(shortRuntime, short, {
    maxTeamFarmHours: 12,
    fallbackKillsPerHour: 20
  });

  assert.equal(longEstimate.priorityTier, 1);
  assert.equal(shortEstimate.priorityTier, 0);
});

test('production material chooser still selects a long path when no shorter valid path remains', () => {
  const runtime = runtimeForDrops(0.001);
  const only = blockedCandidate(10, 1000);
  only.candidate.output = 'only-long-path';
  const decision = chooseProductionTeamFarmObjective(runtime, [only], {
    maxTeamFarmHours: 12,
    fallbackKillsPerHour: 20
  });
  assert.ok(decision.selected);
  assert.equal(decision.selected.target.output, 'only-long-path');
  assert.equal(decision.selected.longPath, true);
  assert.equal(decision.selected.priorityTier, 1);
});

test('production material chooser favors worthwhile benefit per bounded team farm hour', () => {
  const runtime = runtimeForDrops(0.5);
  const slow = blockedCandidate(100, 1000);
  slow.candidate.output = 'slowbow';
  const efficient = blockedCandidate(10, 100);
  efficient.candidate.output = 'efficientbow';
  const decision = chooseProductionTeamFarmObjective(runtime, [slow, efficient], {
    maxTeamFarmHours: 12,
    fallbackKillsPerHour: 20
  });
  assert.ok(decision.selected);
  assert.equal(decision.selected.target.output, 'efficientbow');
  assert.equal(decision.selected.nextMaterial.name, 'wood');
});

test('production planner exposes all blocked recipe candidates for bounded farm-path selection', () => {
  const runtime = runtimeForDrops(0.5);
  const gameData = runtime.adapter.getGameData();
  delete gameData.npcs;
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 0 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [], bank: {} },
    registry: {
      characters: [{
        name: 'R1',
        ctype: 'ranger',
        level: 80,
        gear: { mainhand: { name: 'weakbow', level: 0 } },
        inventory: []
      }]
    },
    gameData,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false
  });
  assert.equal(plan.state, 'BLOCKED');
  assert.ok(Array.isArray(plan.blockedCandidates));
  assert.ok(plan.blockedCandidates.length >= 1);
  assert.equal(plan.blockedCandidates[0].steps.some((step) => step.kind === ProductionStepKind.FARM_REQUIRED), true);
});

test('production material objective is broadcast identically to every farmer, never split', () => {
  const sent = [];
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.now = () => 1000;
  logistics.config = { productionMaterialPublishCooldownMs: 30000 };
  logistics.stats = { productionMaterialObjectives: 0, productionMaterialClears: 0 };
  logistics.lastProductionMaterialObjective = null;
  logistics.lastProductionMaterialPublishAt = -Infinity;
  logistics._isMerchant = () => true;
  logistics._localName = () => 'Merchant';
  logistics._trustedNames = () => ['Merchant', 'R1', 'R2', 'R3'];
  logistics._send = (name, action, data) => {
    sent.push({ name, action, data: JSON.parse(JSON.stringify(data)) });
    return Promise.resolve({ delivered: true });
  };
  logistics._event = () => {};

  const published = logistics.publishProductionMaterialObjective({
    objectiveId: 'production-material:goodbow:R1:wood',
    output: 'goodbow',
    recipient: 'R1',
    material: 'wood',
    requiredQuantity: 10,
    monster: 'goo',
    map: 'main',
    x: 50,
    y: 50,
    expectedHours: 1,
    totalExpectedHours: 1,
    maxTeamFarmHours: 12,
    expiresAt: 60000
  });

  assert.equal(published, true);
  assert.deepEqual(sent.map((row) => row.name).sort(), ['R1', 'R2', 'R3']);
  assert.equal(sent.every((row) => row.action === Action.PRODUCTION_MATERIAL_OBJECTIVE), true);
  assert.equal(new Set(sent.map((row) => row.data.objectiveId)).size, 1);
  assert.equal(new Set(sent.map((row) => row.data.monster)).size, 1);
  assert.equal(logistics.stats.productionMaterialObjectives, 1);
});
