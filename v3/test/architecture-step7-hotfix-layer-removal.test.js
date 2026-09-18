'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  LEGACY_RELIABILITY_MODULES,
  legacyReliabilityFindings
} = require('../scripts/legacy-reliability-layer-guard');

const ROOT = path.resolve(__dirname, '..');
const OWNER_MODULES = [
  'farmer/live-navigation-hotfix',
  'farmer/farmer-local-plan-priority',
  'farmer/farmer-travel-safety-hotfix',
  'farmer/farmer-target-efficiency-hotfix',
  'farmer/farmer-terrain-navigation-hotfix',
  'farmer/farmer-resource-topoff-hotfix',
  'farmer/farm-area-pressure-hotfix',
  'party/party-focus-fire-hotfix',
  'party/team-combat-cohesion-hotfix',
  'party/team-combat-cohesion-hotfix-base',
  'party/controlled-party-logistics',
  'party/party-persistence-quota-hotfix',
  'party/party-account-communication',
  'party/party-bootstrap-farmer-gate',
  'party/party-bootstrap-merchant-discovery-hotfix',
  'party/party-bootstrap-merchant-discovery-hotfix-base',
  'party/alpha20-15-combat-logistics-hotfix',
  'party/alpha20-15-logistics-fairness-hotfix',
  'party/alpha20-19-logistics-stabilization',
  'party/alpha20-19-account-transport-hotfix',
  'content/content-drift-storage-hotfix',
  'content/content-drift-semantic-recovery',
  'content/dangerous-content-hotfix'
];

function load(relativeModule) {
  return require(path.join(ROOT, 'src', relativeModule));
}

test('step 7 permanently removes every retired reliability compatibility file', () => {
  assert.equal(LEGACY_RELIABILITY_MODULES.length, 23);
  for (const legacy of LEGACY_RELIABILITY_MODULES) {
    const file = path.join(ROOT, 'src', `${legacy}.js`);
    assert.equal(fs.existsSync(file), false, `${legacy} must stay removed`);
  }
});

test('step 7 keeps all migrated behavior available from permanent domain owners', () => {
  assert.equal(OWNER_MODULES.length, LEGACY_RELIABILITY_MODULES.length);
  for (const owner of OWNER_MODULES) {
    const exports = load(owner);
    assert.ok(exports && typeof exports === 'object', `${owner} must remain loadable`);
    assert.ok(Object.keys(exports).length > 0, `${owner} must expose its permanent behavior`);
  }
});

test('step 7 architecture guard rejects any reintroduction of retired reliability paths', () => {
  assert.deepEqual(legacyReliabilityFindings(), []);
});
