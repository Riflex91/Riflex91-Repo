'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PROTECTED_MUTATION_APIS,
  findViolations,
  scanSourceTree
} = require('../scripts/game-command-boundary-guard');

test('guard rejects direct Adventure Land mutations and raw binding aliases', () => {
  const source = `
    this.root.sell(2, 1);
    parent['send_gold']('MerchantA', 1000);
    const invite = this._function('send_party_invite');
    smart_move({ map: 'main', x: 1, y: 2 });
  `;
  const violations = findViolations(source, 'fixture.js');
  assert.deepEqual(
    violations.map((row) => [row.api, row.kind]),
    [
      ['sell', 'raw-property'],
      ['send_gold', 'raw-element'],
      ['send_party_invite', 'raw-binding-helper'],
      ['smart_move', 'raw-global-call']
    ]
  );
});

test('guard accepts adapter command routing', () => {
  const source = `
    adapter.command('sell', [2, 1]);
    adapter.command('send_gold', ['MerchantA', 1000]);
    adapter.command('send_party_invite', ['RangerA']);
    adapter.command('smart_move', [{ map: 'main', x: 1, y: 2 }]);
  `;
  assert.deepEqual(findViolations(source, 'fixture.js'), []);
});

test('production source contains no direct protected mutation access outside GameAdapter', () => {
  assert.ok(PROTECTED_MUTATION_APIS.length >= 20);
  assert.deepEqual(scanSourceTree(), []);
});
