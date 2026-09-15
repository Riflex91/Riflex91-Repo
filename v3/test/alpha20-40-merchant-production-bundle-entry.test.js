'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const productionEntry = require('../src/index-production');


test('production bundle entry exports scoped Merchant production authority', () => {
  assert.equal(typeof productionEntry.install, 'function');
  assert.equal(typeof productionEntry.installMerchantProduction, 'function');
  assert.equal(typeof productionEntry.MerchantProductionPlanner, 'function');
  assert.equal(typeof productionEntry.ControlledMerchantProductionExecutor, 'function');
  assert.equal(productionEntry.CONTROLLED_MERCHANT_PRODUCTION_ACK, 'MERCHANT_PRODUCTION_V1');
  assert.equal(productionEntry.ProductionStepKind.BUY, 'BUY');
  assert.equal(productionEntry.ProductionStepKind.BANK_RETRIEVE, 'BANK_RETRIEVE');
  assert.equal(productionEntry.ProductionStepKind.CRAFT, 'CRAFT');
});
