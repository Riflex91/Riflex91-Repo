'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha27MerchantAutonomy } = require('../src/reliability/alpha27-merchant-autonomy');

test('merchant autonomy holds before re-enabling authorities when an economy circuit is open', async () => {
  let authorityEnableCalls = 0;
  const subject = Object.create(Alpha27MerchantAutonomy.prototype);
  subject.runtime = {
    transactionEngine: {
      breaker(type) {
        if (type === 'UPGRADE') {
          return {
            family: 'UPGRADE',
            open: true,
            openUntil: 125000,
            failuresInWindow: 3,
            threshold: 3,
            reason: 'UPGRADE_DELTA_NOT_OBSERVED_NO_RETRY'
          };
        }
        return { family: type, open: false, openUntil: null, failuresInWindow: 0, threshold: 3, reason: null };
      }
    }
  };
  subject.stats = { autonomousMerchantCycles: 0, autonomousMerchantHolds: 0 };
  subject.atomic = {
    merchantActive: () => true,
    supervisorAllowed: () => true,
    merchantInCombat: () => false,
    serviceTravelBusy: false,
    merchantBusy: false
  };
  subject.now = () => 5000;
  subject.ensureAutonomousAuthorities = () => { authorityEnableCalls += 1; };
  subject.lastMerchantPlan = null;

  const result = await subject.cycle();

  assert.equal(result, false);
  assert.equal(authorityEnableCalls, 0);
  assert.equal(subject.stats.autonomousMerchantHolds, 1);
  assert.equal(subject.lastMerchantPlan.reason, 'ECONOMY_CIRCUIT_OPEN');
  assert.equal(subject.lastMerchantPlan.breakers[0].family, 'UPGRADE');
  assert.equal(subject.lastMerchantPlan.breakers[0].openUntil, 125000);
});