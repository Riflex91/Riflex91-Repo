'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const MIGRATIONS = [
  ['reliability/live-navigation-hotfix', 'farmer/live-navigation-hotfix'],
  ['reliability/farmer-local-plan-priority', 'farmer/farmer-local-plan-priority'],
  ['reliability/farmer-travel-safety-hotfix', 'farmer/farmer-travel-safety-hotfix'],
  ['reliability/farmer-target-efficiency-hotfix', 'farmer/farmer-target-efficiency-hotfix'],
  ['reliability/farmer-terrain-navigation-hotfix', 'farmer/farmer-terrain-navigation-hotfix'],
  ['reliability/farmer-resource-topoff-hotfix', 'farmer/farmer-resource-topoff-hotfix'],
  ['reliability/farm-area-pressure-hotfix', 'farmer/farm-area-pressure-hotfix'],
  ['reliability/party-focus-fire-hotfix', 'party/party-focus-fire-hotfix'],
  ['reliability/team-combat-cohesion-hotfix', 'party/team-combat-cohesion-hotfix'],
  ['reliability/team-combat-cohesion-hotfix-base', 'party/team-combat-cohesion-hotfix-base'],
  ['reliability/controlled-party-logistics', 'party/controlled-party-logistics'],
  ['reliability/party-persistence-quota-hotfix', 'party/party-persistence-quota-hotfix'],
  ['reliability/party-account-communication', 'party/party-account-communication'],
  ['reliability/party-bootstrap-farmer-gate', 'party/party-bootstrap-farmer-gate'],
  ['reliability/party-bootstrap-merchant-discovery-hotfix', 'party/party-bootstrap-merchant-discovery-hotfix'],
  ['reliability/party-bootstrap-merchant-discovery-hotfix-base', 'party/party-bootstrap-merchant-discovery-hotfix-base'],
  ['reliability/alpha20-15-combat-logistics-hotfix', 'party/alpha20-15-combat-logistics-hotfix'],
  ['reliability/alpha20-15-logistics-fairness-hotfix', 'party/alpha20-15-logistics-fairness-hotfix'],
  ['reliability/alpha20-19-logistics-stabilization', 'party/alpha20-19-logistics-stabilization'],
  ['reliability/alpha20-19-account-transport-hotfix', 'party/alpha20-19-account-transport-hotfix'],
  ['reliability/content-drift-storage-hotfix', 'content/content-drift-storage-hotfix'],
  ['reliability/content-drift-semantic-recovery', 'content/content-drift-semantic-recovery'],
  ['reliability/dangerous-content-hotfix', 'content/dangerous-content-hotfix']
];

function source(relativeModule) {
  return fs.readFileSync(path.join(ROOT, 'src', `${relativeModule}.js`), 'utf8');
}

function load(relativeModule) {
  return require(path.join(ROOT, 'src', relativeModule));
}

test('step 6 compatibility paths re-export the domain-owned implementation', () => {
  for (const [legacy, owner] of MIGRATIONS) {
    assert.strictEqual(load(legacy), load(owner), `${legacy} must re-export ${owner}`);
  }
});

test('step 6 reliability compatibility files contain no behavior of their own', () => {
  for (const [legacy, owner] of MIGRATIONS) {
    const text = source(legacy);
    assert.match(text, /^'use strict';\s+module\.exports = require\('\.\.\//);
    assert.ok(text.includes(owner.split('/').slice(-1)[0]), `${legacy} must point at ${owner}`);
    assert.doesNotMatch(text, /\bclass\s+|\bfunction\s+|prototype\.|\.beforeTick\s*=|\.tick\s*=/);
    assert.ok(text.length < 180, `${legacy} should remain a thin compatibility shim`);
  }
});

test('farmer/navigation behavior has permanent farmer owners', () => {
  const navigation = load('farmer/live-navigation-hotfix');
  const localPlan = load('farmer/farmer-local-plan-priority');
  const targetEfficiency = load('farmer/farmer-target-efficiency-hotfix');
  const travel = load('farmer/farmer-travel-safety-hotfix');
  const terrain = load('farmer/farmer-terrain-navigation-hotfix');
  const topoff = load('farmer/farmer-resource-topoff-hotfix');
  const pressure = load('farmer/farm-area-pressure-hotfix');

  assert.equal(typeof navigation.installLiveNavigationHotfix, 'function');
  assert.equal(typeof localPlan.installFarmerLocalPlanPriority, 'function');
  assert.equal(typeof targetEfficiency.installFarmerTargetEfficiencyHotfix, 'function');
  assert.equal(typeof travel.installFarmerTravelSafetyHotfix, 'function');
  assert.equal(typeof terrain.installFarmerTerrainNavigationHotfix, 'function');
  assert.equal(typeof topoff.installFarmerResourceTopoffHotfix, 'function');
  assert.equal(typeof pressure.installFarmAreaPressureHotfix, 'function');
});

test('party combat logistics and bootstrap behavior has permanent party owners', () => {
  const focus = load('party/party-focus-fire-hotfix');
  const cohesion = load('party/team-combat-cohesion-hotfix');
  const logistics = load('party/controlled-party-logistics');
  const quota = load('party/party-persistence-quota-hotfix');
  const communication = load('party/party-account-communication');
  const farmerGate = load('party/party-bootstrap-farmer-gate');
  const discovery = load('party/party-bootstrap-merchant-discovery-hotfix');
  const transport = load('party/alpha20-19-account-transport-hotfix');
  const combatLogistics = load('party/alpha20-15-combat-logistics-hotfix');
  const stabilization = load('party/alpha20-19-logistics-stabilization');

  assert.equal(typeof focus.installPartyFocusFireHotfix, 'function');
  assert.equal(typeof cohesion.installTeamCombatCohesionHotfix, 'function');
  assert.equal(typeof logistics.installControlledPartyLogistics, 'function');
  assert.equal(typeof quota.installPartyPersistenceQuotaHotfix, 'function');
  assert.equal(typeof communication.installPartyAccountCommunication, 'function');
  assert.equal(typeof farmerGate.installPartyBootstrapFarmerGate, 'function');
  assert.equal(typeof discovery.installPartyBootstrapMerchantDiscoveryHotfix, 'function');
  assert.equal(typeof transport.installAlpha2019AccountTransportHotfix, 'function');
  assert.equal(typeof combatLogistics.installAlpha2015CombatLogisticsHotfix, 'function');
  assert.equal(typeof stabilization.patchAlpha2019LogisticsStabilization, 'function');
});

test('content and persistence behavior has permanent content owners', () => {
  const dangerous = load('content/dangerous-content-hotfix');
  const storage = load('content/content-drift-storage-hotfix');
  const semantic = load('content/content-drift-semantic-recovery');

  assert.equal(typeof dangerous.installDangerousContentHotfix, 'function');
  assert.equal(typeof storage.installContentDriftStorageHotfix, 'function');
  assert.equal(typeof semantic.installContentDriftSemanticRecovery, 'function');
});
