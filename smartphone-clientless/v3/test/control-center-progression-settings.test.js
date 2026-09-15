'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlPlaneConfig } = require('../src/control/control-plane-config');
const { Alpha25ControlCenterBrain } = require('../src/reliability/alpha25-control-center-brain');

function memoryStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.has(key) ? rows.get(key) : null; },
    setItem(key, value) { rows.set(key, String(value)); },
    removeItem(key) { rows.delete(key); }
  };
}

function fixture(initial = {}) {
  const root = { localStorage: memoryStorage() };
  const controlPlane = new ControlPlaneConfig({ root, now: () => 1000, initial });
  const brain = { tickOutcome: () => null, status: () => ({ mode: 'shadow' }) };
  const cloud = {
    autoEnableSuggested: false,
    pendingFeedback: [],
    cycle: () => Promise.resolve(false),
    status: () => ({ ready: false })
  };
  const runtime = {
    root,
    now: () => 1000,
    controlPlane,
    strategicBrainV2: brain,
    brain,
    cloudControlPlane: cloud,
    merchantEconomyAutonomy: { cfg: {} }
  };
  return { runtime, controlPlane };
}

test('local control plane exposes and clamps the current +7/+10 result-level progression caps', () => {
  const { controlPlane } = fixture();
  const schema = controlPlane.schema();
  assert.equal(schema.find((row) => row.key === 'economy.maxUpgrade').max, 7);
  assert.equal(schema.find((row) => row.key === 'economy.maxCompound').max, 10);

  controlPlane.patch({ 'economy.maxUpgrade': 99, 'economy.maxCompound': 99 }, { source: 'test' });
  assert.equal(controlPlane.get('economy.maxUpgrade'), 7);
  assert.equal(controlPlane.get('economy.maxCompound'), 10);
});

test('Alpha25 applies dashboard progression settings to Alpha27 and translates compound result cap for legacy policy', () => {
  const { runtime, controlPlane } = fixture();
  runtime.alpha27CombatMerchantConvergence = {
    options: { maxUpgradeLevel: 7, maxCompoundLevel: 10 },
    legacyUpgradePolicySynchronized: false,
    legacyCompoundPolicySynchronized: false
  };
  const alpha25 = new Alpha25ControlCenterBrain(runtime);

  alpha25.patchSettings({ 'economy.maxUpgrade': 6, 'economy.maxCompound': 8 }, 'test');
  assert.equal(controlPlane.get('economy.maxUpgrade'), 6);
  assert.equal(controlPlane.get('economy.maxCompound'), 8);
  assert.equal(runtime.alpha27CombatMerchantConvergence.options.maxUpgradeLevel, 6);
  assert.equal(runtime.alpha27CombatMerchantConvergence.options.maxCompoundLevel, 8);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgrade, 6);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgradeResultLevel, 6);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompound, 7);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompoundResultLevel, 8);

  alpha25.patchSettings({ 'economy.maxUpgrade': 99, 'economy.maxCompound': 99 }, 'test-clamp');
  assert.equal(controlPlane.get('economy.maxUpgrade'), 7);
  assert.equal(controlPlane.get('economy.maxCompound'), 10);
  assert.equal(runtime.alpha27CombatMerchantConvergence.options.maxUpgradeLevel, 7);
  assert.equal(runtime.alpha27CombatMerchantConvergence.options.maxCompoundLevel, 10);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgrade, 7);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompound, 9);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompoundResultLevel, 10);
  assert.equal(runtime.alpha27CombatMerchantConvergence.legacyUpgradePolicySynchronized, true);
  assert.equal(runtime.alpha27CombatMerchantConvergence.legacyCompoundPolicySynchronized, true);
});

test('Alpha25 replays stored progression settings when Alpha27 is installed later', () => {
  const { runtime } = fixture({ 'economy.maxUpgrade': 5, 'economy.maxCompound': 8 });
  const alpha25 = new Alpha25ControlCenterBrain(runtime);

  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgrade, 5);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompound, 7);

  runtime.alpha27CombatMerchantConvergence = {
    options: { maxUpgradeLevel: 7, maxCompoundLevel: 10 },
    legacyUpgradePolicySynchronized: false,
    legacyCompoundPolicySynchronized: false
  };
  alpha25.beforeTick();

  assert.equal(runtime.alpha27CombatMerchantConvergence.options.maxUpgradeLevel, 5);
  assert.equal(runtime.alpha27CombatMerchantConvergence.options.maxCompoundLevel, 8);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgrade, 5);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompound, 7);
  assert.equal(alpha25.stats.lateProgressionPolicySyncs, 1);

  alpha25.beforeTick();
  assert.equal(alpha25.stats.lateProgressionPolicySyncs, 1);
});
