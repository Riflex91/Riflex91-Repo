'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'logic', 'invariants.json');

function loadContract() {
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('logic invariant registry is unique, explicit and points at real deterministic tests', () => {
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
    assert.ok(invariant.enforcement.every((entry) => ['test', 'manual-review'].includes(entry)));
    assert.ok(Array.isArray(invariant.tests));
    if (invariant.enforcement.includes('test')) {
      assert.ok(invariant.tests.length > 0, `${invariant.id} claims test enforcement without a test`);
      for (const relative of invariant.tests) {
        assert.ok(fs.existsSync(path.join(root, relative)), `${invariant.id} references missing ${relative}`);
      }
    }
  }

  for (const required of [
    'TARGET_AUTOMATRON_NEVER_ATTACK',
    'PASSIVE_UNRELATED_AUTOMATRON_MUST_NOT_NAV_DEADLOCK',
    'UNKNOWN_CONTENT_FAIL_CLOSED',
    'NO_HIDDEN_CROSS_MODULE_DEADLOCK',
    'FARMER_BOUNDED_LIVENESS',
    'SHADOW_PLAN_MUST_ADVANCE'
  ]) assert.ok(ids.has(required), `missing critical invariant ${required}`);
});
