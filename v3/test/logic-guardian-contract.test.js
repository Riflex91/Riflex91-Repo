'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'logic', 'invariants.json');
const architectureConfigPath = path.join(root, '.dependency-cruiser.cjs');

function loadContract() {
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('logic invariant registry is unique, explicit and points at real enforcement', () => {
  const contract = loadContract();
  assert.equal(contract.schemaVersion, 1);
  assert.ok(Array.isArray(contract.invariants));
  assert.ok(contract.invariants.length >= 8);

  const ids = new Set();
  for (const invariant of contract.invariants) {
    assert.match(invariant.id, /^[A-Z0-9_]+$/);
    assert.ok(!ids.has(invariant.id), `duplicate invariant ${invariant.id}`);
    ids.add(invariant.id);
    assert.ok(['block', 'warn'].includes(invariant.severity));
    assert.ok(String(invariant.statement || '').length >= 20);
    assert.ok(Array.isArray(invariant.enforcement) && invariant.enforcement.length > 0);
    assert.ok(invariant.enforcement.every((entry) => ['test', 'static-analysis', 'manual-review'].includes(entry)));
    assert.ok(Array.isArray(invariant.tests));
    if (invariant.enforcement.includes('test')) {
      assert.ok(invariant.tests.length > 0, `${invariant.id} claims test enforcement without a test`);
      for (const relative of invariant.tests) {
        assert.ok(fs.existsSync(path.join(root, relative)), `${invariant.id} references missing ${relative}`);
      }
    }
    if (invariant.enforcement.includes('static-analysis')) {
      assert.ok(fs.existsSync(architectureConfigPath), `${invariant.id} claims static-analysis without dependency-cruiser config`);
    }
  }

  for (const required of [
    'TARGET_AUTOMATRON_NEVER_ATTACK',
    'PASSIVE_UNRELATED_AUTOMATRON_MUST_NOT_NAV_DEADLOCK',
    'UNKNOWN_CONTENT_FAIL_CLOSED',
    'NO_HIDDEN_CROSS_MODULE_DEADLOCK',
    'FARMER_BOUNDED_LIVENESS',
    'FARMER_TEAM_COHESION_MUST_MAKE_PROGRESS',
    'MERCHANT_RENDEZVOUS_REQUIRES_REAL_WORK',
    'MERCHANT_RENDEZVOUS_MUST_NOT_STARVE_HOME_SERVICE',
    'ALPHA21_PROGRESSION_REQUIRES_LIVE_EVIDENCE',
    'ALPHA21_CROSS_MAP_NEVER_BYPASSES_TRAVEL_AUTHORITY',
    'FARMER_TARGET_AUTHORITY_SEPARATES_RAW_TARGET',
    'PERFORMANCE_ATTRIBUTION_REQUIRES_OWNERSHIP_OR_SELF_AGGRO',
    'ATOMIC_COMPOUND_RESERVES_ALL_INPUTS',
    'MERCHANT_MUTATION_OUTCOME_MUST_BE_VERIFIED_NO_BLIND_RETRY',
    'SHADOW_PLAN_MUST_ADVANCE',
    'MERCHANT_ROLE_BOUNDARY',
    'NO_CIRCULAR_CRITICAL_RUNTIME_DEPENDENCIES'
  ]) assert.ok(ids.has(required), `missing critical invariant ${required}`);
});
