'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha20_5MerchantRuntime } = require('../src/autonomy/alpha20-5-merchant-runtime');
const { MerchantServicePlanKind } = require('../src/merchant/merchant-service-planner');

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function runtimeFixture(result) {
  const events = [];
  const runtime = Object.create(Alpha20_5MerchantRuntime.prototype);
  runtime.now = () => 123456;
  runtime.log = { emit: (row) => events.push(JSON.parse(JSON.stringify(row))) };
  runtime.merchantServiceExecutionPending = false;
  runtime.lastMerchantServiceExecution = null;
  runtime.controlledMerchantService = {
    status: () => ({ enabled: true }),
    execute: async () => result
  };
  runtime._executeMerchantTravel = async () => result;
  return { runtime, events };
}

test('committed potion service is retained as a bounded forensic event for GUI session export', async () => {
  const result = {
    executed: true,
    committed: true,
    reason: 'DELIVERY_LOCAL_DELTA_VERIFIED',
    targetName: 'FarmerA',
    itemName: 'hpot0',
    quantity: 125,
    sourceReportAt: 777
  };
  const { runtime, events } = runtimeFixture(result);
  const plan = {
    id: 'service-1',
    kind: MerchantServicePlanKind.SERVICE_DELIVERY,
    sourceReportAt: 777,
    target: { name: 'FarmerA', map: 'main', x: 10, y: 20 },
    delivery: { itemName: 'hpot0', quantity: 125 }
  };

  assert.equal(runtime._scheduleMerchantServiceExecution(plan), true);
  await flush();

  assert.equal(runtime.merchantServiceExecutionPending, false);
  assert.equal(runtime.lastMerchantServiceExecution.result.committed, true);
  const committed = events.find((row) => row.event === 'MERCHANT_SERVICE_EXECUTION_COMMITTED');
  assert.ok(committed);
  assert.equal(committed.component, 'merchant-service');
  assert.equal(committed.severity, 'info');
  assert.equal(committed.reason, 'DELIVERY_LOCAL_DELTA_VERIFIED');
  assert.deepEqual(committed.data, {
    planId: 'service-1',
    kind: MerchantServicePlanKind.SERVICE_DELIVERY,
    targetName: 'FarmerA',
    itemName: 'hpot0',
    quantity: 125,
    sourceReportAt: 777,
    standSlot: null,
    committed: true,
    executed: true,
    route: null
  });
  assert.equal(Object.prototype.hasOwnProperty.call(committed.data, 'inventory'), false);
});

test('committed stand action records the exact verified stand slot without inventing delivery fields', async () => {
  const { runtime, events } = runtimeFixture({ executed: true, committed: true, reason: 'STAND_OPEN_VERIFIED', standSlot: 3 });
  const plan = { id: 'stand-1', kind: MerchantServicePlanKind.STAND_OPEN };

  assert.equal(runtime._scheduleMerchantServiceExecution(plan), true);
  await flush();

  const committed = events.find((row) => row.event === 'MERCHANT_SERVICE_EXECUTION_COMMITTED');
  assert.ok(committed);
  assert.equal(committed.data.planId, 'stand-1');
  assert.equal(committed.data.kind, MerchantServicePlanKind.STAND_OPEN);
  assert.equal(committed.data.standSlot, 3);
  assert.equal(committed.data.targetName, null);
  assert.equal(committed.data.itemName, null);
  assert.equal(committed.data.quantity, null);
  assert.equal(committed.data.sourceReportAt, null);
});

test('rejected execution does not fabricate a committed audit event', async () => {
  const { runtime, events } = runtimeFixture({ executed: false, committed: false, reason: 'SERVICE_REPORT_ALREADY_SERVED' });
  const plan = {
    id: 'duplicate-1',
    kind: MerchantServicePlanKind.SERVICE_DELIVERY,
    sourceReportAt: 900,
    target: { name: 'FarmerA' },
    delivery: { itemName: 'hpot0', quantity: 25 }
  };

  assert.equal(runtime._scheduleMerchantServiceExecution(plan), true);
  await flush();

  assert.equal(events.some((row) => row.event === 'MERCHANT_SERVICE_EXECUTION_COMMITTED'), false);
  assert.equal(runtime.lastMerchantServiceExecution.result.reason, 'SERVICE_REPORT_ALREADY_SERVED');
});
