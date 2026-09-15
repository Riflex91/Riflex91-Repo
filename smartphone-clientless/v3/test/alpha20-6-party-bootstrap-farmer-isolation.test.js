'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { installPartyBootstrapFarmerGate } = require('../src/reliability/party-bootstrap-farmer-gate');

function runtimeWith(name = 'My_Ranger3') {
  let steps = 0;
  const farmer = {
    step() {
      steps += 1;
      return { state: 'RUNNING', reason: 'ORIGINAL_RAN' };
    }
  };
  return {
    farmer,
    lastSnapshot: { character: { name, ctype: 'ranger' } },
    now: () => Date.now(),
    steps: () => steps
  };
}

test('trusted solo farmer keeps progressing while party bootstrap is waiting', () => {
  const runtime = runtimeWith();
  const bootstrap = {
    farmingGate() {
      return { allowed: false, reason: 'WAITING_FOR_TRUSTED_MERCHANT_PARTY', full: false };
    },
    status() {
      return {
        state: 'PARTIAL',
        reason: 'WAITING_FOR_TRUSTED_MERCHANT_PARTY',
        desiredRoster: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3'],
        observed: {
          foreignPartyNames: [],
          observedPresentNames: ['My_Ranger3'],
          partyNames: ['My_Ranger3']
        }
      };
    }
  };
  const gate = installPartyBootstrapFarmerGate(runtime, bootstrap);
  const result = runtime.farmer.step({ snapshot: runtime.lastSnapshot });
  assert.equal(result.reason, 'ORIGINAL_RAN');
  assert.equal(runtime.steps(), 1);
  assert.equal(gate.status().lastGate.reason, 'TRUSTED_ROSTER_BOOTSTRAP_PENDING');
  assert.equal(gate.status().stats.trustedPendingAllows, 1);
});

test('farmer isolation still fails closed for foreign party members', () => {
  const runtime = runtimeWith('My_Ranger1');
  const bootstrap = {
    farmingGate() {
      return { allowed: false, reason: 'FOREIGN_PARTY_MEMBER_PRESENT', full: false };
    },
    status() {
      return {
        state: 'BLOCKED',
        reason: 'FOREIGN_OR_INACTIVE_PARTY_MEMBER_PRESENT',
        desiredRoster: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3'],
        observed: {
          foreignPartyNames: ['Stranger'],
          observedPresentNames: ['My_Ranger1'],
          partyNames: ['My_Ranger1', 'Stranger']
        }
      };
    }
  };
  const gate = installPartyBootstrapFarmerGate(runtime, bootstrap);
  const result = runtime.farmer.step({ snapshot: runtime.lastSnapshot });
  assert.equal(result.reason, 'PARTY_BOOTSTRAP_NOT_READY');
  assert.equal(runtime.steps(), 0);
  assert.equal(gate.status().stats.gatedSteps, 1);
});

test('farmer isolation still fails closed for impossible observed active count', () => {
  const runtime = runtimeWith('My_Ranger2');
  const bootstrap = {
    farmingGate() {
      return { allowed: false, reason: 'ACTIVE_CHARACTER_LIMIT_EXCEEDED', full: false };
    },
    status() {
      return {
        state: 'BLOCKED',
        reason: 'ACTIVE_CHARACTER_LIMIT_EXCEEDED',
        desiredRoster: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3'],
        observed: {
          foreignPartyNames: [],
          observedPresentNames: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3', 'Unexpected'],
          partyNames: ['My_Ranger2']
        }
      };
    }
  };
  const gate = installPartyBootstrapFarmerGate(runtime, bootstrap);
  const result = runtime.farmer.step({ snapshot: runtime.lastSnapshot });
  assert.equal(result.reason, 'PARTY_BOOTSTRAP_NOT_READY');
  assert.equal(runtime.steps(), 0);
  assert.equal(gate.status().stats.gatedSteps, 1);
});
