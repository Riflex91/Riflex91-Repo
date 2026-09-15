'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { Alpha28LedgerFarmerFixes } = require('../src/reliability/alpha28-ledger-farmer-fixes');
const {
  failureReason,
  installMerchantFailureReasonNormalization,
  installScopedControlledAuthorityGuard
} = require('../src/reliability/alpha28-live-authority-liveness');

function stats() {
  return {
    ledgerSignatureFixes: 0,
    semanticRegroupPreserved: 0,
    falseAreaPressureSuppressed: 0,
    plannedTargetFallbackSelections: 0
  };
}

test('Alpha28 safe planned target remains selectable when ranking metadata is temporarily unavailable', () => {
  const snapshot = {
    observedAt: 100,
    character: { name: 'Leader', map: 'main', x: 0, y: 0, speed: 50 },
    entities: [
      { id: 'safe-near', mtype: 'squigtoad', map: 'main', x: 100, y: 0, hp: 100 },
      { id: 'unsafe-nearer', mtype: 'squigtoad', map: 'main', x: 5, y: 0, hp: 100 }
    ]
  };
  const farmer = {
    _selectTarget: () => null,
    _targetAllowed: () => true,
    _candidateRows: () => ({ rows: [], monsters: snapshot.entities }),
    planner: { rank: () => [] }
  };
  const runtime = {
    farmer,
    localFarming: { currentPlan: { id: 'plan-1', monster: 'squigtoad' } },
    preFarmingReliability: { safeEntityIds: new Set(['safe-near']), safeEntitySnapshotAt: 100 },
    teamCombatCohesionHotfix: {
      _team: () => ({ selfName: 'Leader', leaderName: 'Leader', complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true })
    }
  };
  const sharedStats = stats();
  new Alpha28LedgerFarmerFixes(runtime, { now: () => 100, log: null, stats: sharedStats });

  const selected = farmer._selectTarget({ snapshot, party: { fingerprint: 'party:test' } });
  assert.equal(selected.target.id, 'safe-near');
  assert.equal(selected.ranking.source, 'alpha28-safe-live-liveness-fallback');
  assert.equal(Number.isFinite(selected.ranking.score), true);
  assert.equal(Number.isFinite(selected.ranking.travelSeconds), true);
  assert.equal(sharedStats.plannedTargetFallbackSelections, 1);
});

test('Alpha28 economy circuit guard does not disable healthy travel authority', () => {
  const disabled = [];
  const runtime = {
    adapter: { mode: 'active' },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    _controlledSubsystemHealth: () => ({
      economy: { state: 'DEGRADED', reasons: ['SELL_CIRCUIT_OPEN'] },
      travel: { state: 'HEALTHY', reasons: [] }
    }),
    controlledMerchant: {
      enabled: true,
      status() { return { enabled: this.enabled }; },
      disable(reason) { disabled.push(['merchant', reason]); this.enabled = false; return this.status(); }
    },
    controlledTravel: {
      enabled: true,
      status() { return { enabled: this.enabled }; },
      disable(reason) { disabled.push(['travel', reason]); this.enabled = false; return this.status(); }
    },
    log: { emit() {} }
  };

  assert.equal(installScopedControlledAuthorityGuard(runtime), true);
  const result = runtime._guardControlledAuthority();
  assert.deepEqual(disabled, [['merchant', 'ECONOMY_CIRCUIT_OPEN']]);
  assert.equal(runtime.controlledTravel.enabled, true);
  assert.equal(result.economyGuardReason, 'ECONOMY_CIRCUIT_OPEN');
  assert.equal(result.travelGuardReason, null);
});

test('Alpha28 travel circuit remains independently fail-closed', async () => {
  const disabled = [];
  const runtime = {
    adapter: { mode: 'active' },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    _controlledSubsystemHealth: () => ({
      economy: { state: 'HEALTHY', reasons: [] },
      travel: { state: 'DEGRADED', reasons: ['TRAVEL_CIRCUIT_OPEN'] }
    }),
    controlledMerchant: {
      enabled: true,
      status() { return { enabled: this.enabled }; },
      disable(reason) { disabled.push(['merchant', reason]); this.enabled = false; return this.status(); }
    },
    controlledTravel: {
      enabled: true,
      status() { return { enabled: this.enabled }; },
      disable(reason) { disabled.push(['travel', reason]); this.enabled = false; return this.status(); }
    },
    log: { emit() {} }
  };

  installScopedControlledAuthorityGuard(runtime);
  const result = runtime._guardControlledAuthority();
  await Promise.resolve();
  assert.deepEqual(disabled, [['travel', 'TRAVEL_CIRCUIT_OPEN']]);
  assert.equal(runtime.controlledMerchant.enabled, true);
  assert.equal(result.economyGuardReason, null);
  assert.equal(result.travelGuardReason, 'TRAVEL_CIRCUIT_OPEN');
});

test('Merchant failed response keeps structured reason instead of [object Object]', async () => {
  const merchant = {
    async _timeout() {
      return { failed: true, reason: { code: 'SELL_REJECTED', message: 'shop refused item' } };
    }
  };
  const runtime = { controlledMerchant: merchant };
  assert.equal(installMerchantFailureReasonNormalization(runtime), true);
  const response = await merchant._timeout(Promise.resolve(), 'SELL');
  assert.equal(response.reason, 'SELL_REJECTED: shop refused item');
  assert.equal(failureReason({ reason: { message: 'nested failure' } }), 'nested failure');
  assert.notEqual(response.reason, '[object Object]');
});
