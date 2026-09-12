'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PartyTelemetryBridge } = require('../src/party/telemetry-bridge');
const { buildReconciliationStatus } = require('../src/ops/reconciliation-status');

function statusTarget(value) {
  return { status: () => JSON.parse(JSON.stringify(value)) };
}

function cleanRuntime(overrides = {}) {
  return {
    transactionEngine: statusTarget({ active: 0, recovering: 0 }),
    bankExpansionTransactions: statusTarget({ active: 0, recovering: 0 }),
    merchantSpaceRecoveryJournal: statusTarget({ active: 0, recovering: 0, states: {} }),
    controlledMerchantSpaceRecovery: statusTarget({ busy: false, enabled: false }),
    controlledBankConsolidation: statusTarget({ busy: false, enabled: false }),
    safeTravel: statusTarget({ active: 0 }),
    controlledPartyLifecycle: statusTarget({ busy: false, operation: null, developmentSession: null }),
    alpha20LiveGateStatus: () => ({ running: false, phase: 'IDLE' }),
    ...overrides
  };
}

test('farmer supply telemetry never counts slots or potions beyond character.isize', () => {
  const bridge = new PartyTelemetryBridge({ now: () => 1000 });
  const runtime = {
    lastSnapshot: {
      character: {
        name: 'FarmerA', ctype: 'ranger', level: 80, map: 'main', x: 10, y: 20,
        hp: 1000, max_hp: 1000, mp: 900, max_mp: 1000,
        isize: 2,
        inventory: [
          { index: 0, name: 'hpot0', q: 25 },
          null,
          { index: 2, name: 'hpot0', q: 9999 },
          { index: 3, name: 'mpot0', q: 9999 }
        ]
      }
    },
    performance: { status: () => ({ current: { rates: {} } }) },
    farmerStatus: () => ({}),
    localFarming: { status: () => ({}) },
    adapter: {}
  };

  const report = bridge.buildLocalReport(runtime);
  assert.equal(report.supplies.inventorySize, 2);
  assert.equal(report.supplies.inventoryUsed, 1);
  assert.equal(report.supplies.freeSlots, 1);
  assert.equal(report.supplies.hpPotions, 25);
  assert.equal(report.supplies.mpPotions, 0);
});

test('host restart reconciliation fails closed while merchant service operation is recovering', () => {
  const runtime = cleanRuntime({
    controlledMerchantService: statusTarget({
      enabled: false,
      busy: false,
      activeOperation: { id: 'service-1', state: 'RECOVERING', action: 'send_item' }
    })
  });

  const result = buildReconciliationStatus(runtime, () => 5000, null);
  assert.equal(result.observedClean, false);
  assert.ok(result.blockers.includes('MERCHANT_SERVICE_RECOVERY_REQUIRED'));
  assert.equal(result.detail.merchantService.operationState, 'RECOVERING');
  assert.equal(result.actionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
});

test('merchant service status failure becomes a restart blocker while frozen runtimes without the subsystem remain compatible', () => {
  const broken = cleanRuntime({
    controlledMerchantService: { status: () => { throw new Error('broken'); } }
  });
  const blocked = buildReconciliationStatus(broken, () => 6000, null);
  assert.equal(blocked.observedClean, false);
  assert.ok(blocked.blockers.includes('MERCHANT_SERVICE_STATUS_UNAVAILABLE'));

  const legacy = cleanRuntime();
  const compatible = buildReconciliationStatus(legacy, () => 7000, null);
  assert.equal(compatible.blockers.includes('MERCHANT_SERVICE_STATUS_UNAVAILABLE'), false);
  assert.equal(compatible.blockers.includes('MERCHANT_SERVICE_RECOVERY_REQUIRED'), false);
});
