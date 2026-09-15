'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installFullTestAuthorityHotfix } = require('../src/reliability/alpha20-42-full-test-authority-hotfix');

function baseRuntime({ ctype = 'ranger', now = 10000 } = {}) {
  const clock = { now };
  const root = { character: { name: ctype === 'merchant' ? 'My_Merchant' : 'My_Ranger2', ctype, hp: 1000, max_hp: 1000, mp: 950, max_mp: 1000, rip: false }, parent: { entities: {} } };
  return {
    clock,
    root,
    now: () => clock.now,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => ({ items: {} }), command: () => ({ executed: true }) },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    _alpha20EconomyEmergency: () => false
  };
}

test('missing MP potions degrade to basic attacks and no longer fail team combat readiness', () => {
  const runtime = baseRuntime();
  const resourceEvents = [];
  runtime.farmerResourceTopoffHotfix = {
    lastSupply: null,
    supply: () => ({ hpPotions: 100, mpPotions: 0, hpReady: true, mpReady: false, ready: false }),
    _event: (event, severity, reason, data) => resourceEvents.push({ event, severity, reason, data }),
    status: () => ({ requiresHpAndMpSupplyForTeamCombat: true })
  };
  runtime.farmer = {
    skillUsage: {
      evaluate: () => ({ useSkill: true, reason: 'DIRECT_DAMAGE_SKILL', skill: { id: 'supershot', mp: 80 } })
    }
  };
  runtime.teamCombatCohesionHotfix = {
    _team: () => ({ complete: true, alive: true, cohesive: true, healthReady: true, manaReady: false }),
    status: () => ({})
  };

  const hotfix = installFullTestAuthorityHotfix(runtime, { warningDedupeMs: 5000 });
  const snapshot = { character: { inventory: [{ name: 'hpot0', q: 100 }] } };
  const supply = runtime.farmerResourceTopoffHotfix.supply(snapshot);
  assert.equal(supply.hpReady, true);
  assert.equal(supply.mpReady, false);
  assert.equal(supply.strictReady, false);
  assert.equal(supply.ready, true);
  assert.equal(supply.basicCombatReady, true);

  const skill = runtime.farmer.skillUsage.evaluate(snapshot, { id: 'm1' }, {}, {}, {});
  assert.equal(skill.useSkill, false);
  assert.equal(skill.reason, 'MP_POTION_SUPPLY_UNAVAILABLE_BASIC_ATTACK_ONLY');

  const team = runtime.teamCombatCohesionHotfix._team(snapshot);
  assert.equal(team.observedManaReady, false);
  assert.equal(team.manaReady, true);
  assert.equal(hotfix.status().farmerPolicy.missingMpPotionBlocksBasicCombat, false);

  runtime.farmerResourceTopoffHotfix._event('FARMER_RESOURCE_TOPOFF_UNAVAILABLE', 'warn', 'REQUIRED_POTION_UNAVAILABLE', { supply });
  runtime.farmerResourceTopoffHotfix._event('FARMER_RESOURCE_TOPOFF_UNAVAILABLE', 'warn', 'REQUIRED_POTION_UNAVAILABLE', { supply });
  assert.equal(resourceEvents.length, 1);
  assert.equal(hotfix.status().stats.warningSuppressions, 1);
});

test('merchant supply request is retained when only the configured potion reserve remains', () => {
  const runtime = baseRuntime({ ctype: 'merchant' });
  const requests = new Map([['My_Ranger2', { sender: 'My_Ranger2', receivedAt: runtime.now(), hpPotions: 500, mpPotions: 0 }]]);
  let baseCalls = 0;
  runtime.controlledPartyLogistics = {
    config: { merchantPotionReserve: 80, farmerPotionTarget: 500, messageTtlMs: 10000 },
    pendingSupply: null,
    backoffUntil: 0,
    supplyRequests: requests,
    lastDecision: null,
    _processSupply: () => { baseCalls += 1; requests.clear(); return true; }
  };
  const hotfix = installFullTestAuthorityHotfix(runtime);
  const snapshot = { character: { inventory: [{ name: 'mpot0', q: 80 }, { name: 'hpot0', q: 1000 }] } };

  assert.equal(runtime.controlledPartyLogistics._processSupply(snapshot), false);
  assert.equal(baseCalls, 0);
  assert.equal(requests.has('My_Ranger2'), true);
  assert.equal(runtime.controlledPartyLogistics.lastDecision.action, 'RESTOCK_REQUIRED');
  assert.equal(hotfix.status().stats.retainedSupplyRequests, 1);
});

test('full Merchant test mode enables sell, bank, upgrade, compound, travel, service, buy and craft authorities', () => {
  const runtime = baseRuntime({ ctype: 'merchant' });
  const calls = {};
  runtime.controlledMerchantProduction = { goldReserve: 1000000, maxBuyQuantity: 1000 };
  runtime.configureControlledMerchant = (config) => { calls.merchant = config; return config; };
  runtime.configureControlledTravel = (config) => { calls.travel = config; return config; };
  runtime.configureMerchantService = (config) => { calls.service = config; return config; };
  runtime.configureMerchantProduction = (config) => { calls.production = config; return config; };

  const hotfix = installFullTestAuthorityHotfix(runtime, { testGoldReserve: 0, maxGlobalBuyQuantity: 2000 });
  assert.equal(hotfix.ensureAuthorities(true), true);
  assert.equal(calls.merchant.sell, true);
  assert.equal(calls.merchant.bank, true);
  assert.equal(calls.merchant.upgrade, true);
  assert.equal(calls.merchant.compound, true);
  assert.equal(calls.travel.enabled, true);
  assert.equal(calls.service.allowStand, true);
  assert.equal(calls.service.allowDelivery, true);
  assert.equal(calls.service.allowTravel, true);
  assert.equal(calls.production.allowBuy, true);
  assert.equal(calls.production.allowBank, true);
  assert.equal(calls.production.allowCraft, true);
  assert.equal(runtime.controlledMerchantProduction.goldReserve, 0);
  assert.ok(runtime.controlledMerchantProduction.maxBuyQuantity >= 2000);
});

test('global Merchant buy uses the controlled production executor for any known purchasable item', async () => {
  const runtime = baseRuntime({ ctype: 'merchant' });
  let executed = null;
  runtime.root.can_buy = () => true;
  runtime.adapter.getGameData = () => ({ items: { mpot0: { g: 5 }, scroll0: { g: 1000 } } });
  runtime.controlledMerchantProduction = {
    goldReserve: 1000000,
    maxBuyQuantity: 1000,
    execute: async (plan, step) => { executed = { plan, step }; return { executed: true, committed: true, reason: 'BUY_DELTA_VERIFIED' }; }
  };
  runtime.configureControlledMerchant = () => ({});
  runtime.configureControlledTravel = () => ({});
  runtime.configureMerchantService = () => ({});
  runtime.configureMerchantProduction = () => ({});

  const hotfix = installFullTestAuthorityHotfix(runtime, { testGoldReserve: 0 });
  const result = await hotfix.buy('scroll0', 7);
  assert.equal(result.committed, true);
  assert.equal(executed.step.kind, 'BUY');
  assert.equal(executed.step.name, 'scroll0');
  assert.equal(executed.step.quantity, 7);
  assert.equal(executed.step.unitCost, 1000);
  assert.equal(hotfix.status().stats.buys, 1);
});
