'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { HardenedAlpha20CombinedLiveGate, REQUIRED_OBSERVATION_MS } = require('../src/ops/alpha20-combined-live-gate-hardened');

function disabled(stats = {}) {
  return { enabled: false, stats: { attempts: 0, ...stats } };
}

function observationFixture() {
  const clock = { now: 1_000_000 };
  const lifecycle = { enabled: false, stats: { attempts: 0 } };
  const aura = { enabled: false, stats: { attempts: 0 } };
  const economy = {
    spaceRecovery: disabled(), consolidation: disabled(), merchant: disabled(), expansion: disabled(), travel: disabled()
  };
  const runtime = {
    controlledPartyLifecycle: { status: () => JSON.parse(JSON.stringify(lifecycle)) },
    controlledPaladinAura: { status: () => JSON.parse(JSON.stringify(aura)) },
    log: { emit() {}, list() { return []; } }
  };
  let gate;
  const sleep = async (ms) => {
    clock.now += ms;
    gate.cancel('USER_REQUESTED_STOP');
  };
  gate = new HardenedAlpha20CombinedLiveGate({
    runtime,
    root: { character: { name: 'MerchantA', ctype: 'merchant', hp: 1000, max_hp: 1000, target: null }, parent: { entities: {} } },
    now: () => clock.now,
    testMode: false,
    sampleMs: 5000,
    sleep
  });
  gate._refreshShadowEvidence = () => {};
  gate._controlledEconomySnapshot = () => JSON.parse(JSON.stringify(economy));
  gate._eventsSince = () => [];
  gate._safeStateSnapshot = () => ({
    mode: 'shadow', farmerEnabled: false, supervisorState: 'HEALTHY', economyEmergency: false,
    merchantDead: false, merchantInCombat: false,
    party: { valid: true },
    lifecycle: {
      maxDevelopmentSlots: 1, developmentCount: 0, activeCombat: ['RangerA', 'RangerB', 'RangerC'], evaluations: 1,
      controlledEnabled: false, transitionAuthority: false, developmentRotationAuthority: false,
      auraEnabled: false, auraAuthority: false, breaker: { open: false }
    },
    legacy: { transitionChildLive: false, auraAutomationEnabled: false, transitionBypassAllowed: false, auraBypassAllowed: false },
    controlledEconomy: {
      spaceRecoveryEnabled: false, consolidationEnabled: false, merchantEnabled: false, expansionEnabled: false,
      travelEnabled: false, expansionPurchaseAuthority: false, emergencyReclaimAuthority: false
    },
    circuits: {}
  });
  return { gate, clock };
}

test('Alpha.20 hardened live gate exposes an explicit abort boundary and rejects cancel while idle', () => {
  const { gate } = observationFixture();
  const idle = gate.cancel('NO_RUN');
  assert.equal(idle.accepted, false);
  assert.equal(idle.reason, 'ALPHA20_LIVE_GATE_NOT_RUNNING');
  gate.running = true;
  const accepted = gate.cancel('OPERATOR_CANCELLED_TEST');
  assert.equal(accepted.accepted, true);
  assert.equal(gate.status().abortable, true);
  assert.equal(gate.status().cancelRequested, true);
  assert.equal(gate.status().cancelReason, 'OPERATOR_CANCELLED_TEST');
});

test('cancel during passive observation exits bounded, fails confirmation duration, and performs no extra loop', async () => {
  const { gate } = observationFixture();
  gate.running = true;
  const result = await gate._observeWindow();
  assert.equal(result.pass, false);
  assert.equal(result.cancelled, true);
  assert.equal(result.cancelReason, 'USER_REQUESTED_STOP');
  assert.equal(result.confirmationDurationSatisfied, false);
  assert.ok(result.actualElapsedMs < REQUIRED_OBSERVATION_MS);
  assert.ok(result.violations.some((row) => row.reason === 'OPERATOR_CANCELLED_LIVE_GATE'));
  assert.equal(result.sampleCount, 1);
});

test('passive liveness invariants fail closed on Merchant death or combat', () => {
  const { gate } = observationFixture();
  const base = {
    mode: 'shadow', farmerEnabled: false, supervisorState: 'HEALTHY', economyEmergency: false,
    party: { valid: true },
    lifecycle: {
      maxDevelopmentSlots: 1, developmentCount: 0, activeCombat: ['RangerA', 'RangerB', 'RangerC'], evaluations: 1,
      controlledEnabled: false, transitionAuthority: false, developmentRotationAuthority: false,
      auraEnabled: false, auraAuthority: false, breaker: { open: false }
    },
    legacy: { transitionChildLive: false, auraAutomationEnabled: false, transitionBypassAllowed: false, auraBypassAllowed: false },
    controlledEconomy: {
      spaceRecoveryEnabled: false, consolidationEnabled: false, merchantEnabled: false, expansionEnabled: false,
      travelEnabled: false, expansionPurchaseAuthority: false, emergencyReclaimAuthority: false
    },
    circuits: {}
  };
  const dead = gate._sampleViolations({ ...base, merchantDead: true, merchantInCombat: false });
  assert.ok(dead.includes('MERCHANT_DIED_DURING_OBSERVATION'));
  const combat = gate._sampleViolations({ ...base, merchantDead: false, merchantInCombat: true });
  assert.ok(combat.includes('MERCHANT_ENTERED_COMBAT_DURING_OBSERVATION'));
});