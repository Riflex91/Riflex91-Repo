'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InventoryLedger, ItemDisposition } = require('../src/economy/inventory-ledger');

function registry(items) {
  return {
    status() {
      return {
        characters: [{
          name: 'Merchant',
          stateConfidence: 1,
          inventory: items.map((item, index) => item ? { index, q: 1, level: 0, ...item } : null).filter(Boolean)
        }]
      };
    }
  };
}

function observe(ledger, items, gameData) {
  ledger.observe({
    observedAt: 1000,
    registry: registry(items),
    gameData,
    contentDrift: { requiresRevalidation: () => false },
    liveCharacter: { name: 'Merchant', isize: 42, items }
  });
  return ledger;
}

test('protected inventory items remain KEEP in auto mode', () => {
  const ledger = observe(
    new InventoryLedger({ now: () => 1000 }),
    [{ name: 'lockedmat', locked: true }],
    { items: { lockedmat: { type: 'material', g: 10 } } }
  );
  const row = ledger.get('Merchant', 0);
  assert.equal(row.disposition, ItemDisposition.KEEP);
  assert.equal(row.protected, true);
  assert.equal(row.protectionReason, 'ITEM_LOCKED');
  assert.ok(row.reasons.includes('ITEM_LOCKED'));
});

test('explicit operator permission can classify a protected item while preserving the warning metadata', () => {
  const ledger = observe(
    new InventoryLedger({
      now: () => 1000,
      itemPermissions: { lockedmat: { bank: true } }
    }),
    [{ name: 'lockedmat', locked: true }],
    { items: { lockedmat: { type: 'material', g: 10 } } }
  );
  const row = ledger.get('Merchant', 0);
  assert.equal(row.disposition, ItemDisposition.BANK);
  assert.equal(row.operatorPermissions.bank, true);
  assert.equal(row.protected, true);
  assert.equal(row.protectionReason, 'ITEM_LOCKED');
  assert.ok(row.reasons.includes('OPERATOR_BANK_ALLOWED'));
  assert.ok(row.reasons.includes('PROTECTED_ITEM_OPERATOR_OVERRIDE'));
});

test('per-item denials preempt legacy allowlists and native compound classification', () => {
  const ledger = observe(
    new InventoryLedger({
      now: () => 1000,
      sellAllowlist: ['junk'],
      bankAllowlist: ['rare'],
      itemPermissions: {
        junk: { sell: false },
        rare: { bank: false },
        ring: { compound: false }
      }
    }),
    [{ name: 'junk' }, { name: 'rare' }, { name: 'ring' }, { name: 'ring' }, { name: 'ring' }],
    {
      items: {
        junk: { type: 'material', g: 10 },
        rare: { type: 'material', g: 10000 },
        ring: { type: 'ring', g: 10, compound: { dex: 1 } }
      }
    }
  );

  assert.equal(ledger.get('Merchant', 0).disposition, ItemDisposition.UNDECIDED);
  assert.equal(ledger.get('Merchant', 1).disposition, ItemDisposition.UNDECIDED);
  assert.equal(ledger.get('Merchant', 2).disposition, ItemDisposition.UNDECIDED);
  assert.equal(ledger.get('Merchant', 3).disposition, ItemDisposition.UNDECIDED);
  assert.equal(ledger.get('Merchant', 4).disposition, ItemDisposition.UNDECIDED);
});

test('item permission input is bounded to supported boolean actions', () => {
  const ledger = new InventoryLedger({
    itemPermissions: {
      sword: { sell: false, bank: true, upgrade: true, arbitrary: true },
      ring: { compound: false },
      invalid: 'yes'
    }
  });
  assert.deepEqual(ledger.itemPermissionSnapshot(), {
    ring: { compound: false },
    sword: { sell: false, bank: true, upgrade: true }
  });
});
