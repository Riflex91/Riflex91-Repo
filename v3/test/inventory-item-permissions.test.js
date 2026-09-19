'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InventoryLedger, ItemDisposition } = require('../src/economy/inventory-ledger');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeLedger, makeRuntime } = require('./alpha27-convergence-test-helpers');

function registry(inventory) {
  return {
    status() {
      return {
        characters: [{
          name: 'Merchant',
          stateConfidence: 1,
          inventory
        }]
      };
    }
  };
}

const gameData = {
  items: {
    junk: { type: 'material', g: 5 },
    sword: { type: 'weapon', upgrade: true, g: 100, grades: [] },
    ring: { type: 'ring', compound: true, g: 100, grades: [] }
  }
};

test('sell permission never removes a live item protection flag', () => {
  const locked = new InventoryLedger();
  locked.observe({ registry: registry([{ index: 0, name: 'junk', q: 1, locked: true }]), gameData });
  assert.equal(locked.get('Merchant', 0).disposition, ItemDisposition.KEEP);

  const permitted = new InventoryLedger({ itemPermissions: { junk: { sell: true } } });
  permitted.observe({ registry: registry([{ index: 0, name: 'junk', q: 1, locked: true }]), gameData });
  const row = permitted.get('Merchant', 0);
  assert.equal(row.disposition, ItemDisposition.KEEP);
  assert.equal(row.protected, true);
  assert.equal(row.protectionReason, 'ITEM_LOCKED');
  assert.ok(row.reasons.includes('ITEM_LOCKED'));
});

test('explicit compound denial prevents automatic compound classification', () => {
  const ledger = new InventoryLedger({ itemPermissions: { ring: { compound: false } } });
  ledger.observe({
    registry: registry([
      { index: 0, name: 'ring', level: 0 },
      { index: 1, name: 'ring', level: 0 },
      { index: 2, name: 'ring', level: 0 }
    ]),
    gameData
  });
  assert.equal(ledger.get('Merchant', 0).disposition, ItemDisposition.UNDECIDED);
});

test('explicit upgrade denial preempts active progression reservation', () => {
  const ledger = new InventoryLedger({ itemPermissions: { sword: { upgrade: false } } });
  ledger.setProgressionReservations([{ name: 'sword', level: 0, quantity: 1, sourceCharacter: 'Merchant', sourceIndex: 0, goalIds: ['goal-1'] }]);
  ledger.observe({ registry: registry([{ index: 0, name: 'sword', level: 0 }]), gameData });
  const row = ledger.get('Merchant', 0);
  assert.equal(row.disposition, ItemDisposition.KEEP);
  assert.ok(row.reasons.includes('OPERATOR_UPGRADE_DENIED'));
});

test('explicit protected upgrade permission can classify a locked upgrade item', () => {
  const ledger = new InventoryLedger({ itemPermissions: { sword: { upgrade: true } } });
  ledger.observe({ registry: registry([{ index: 0, name: 'sword', level: 0, locked: true }]), gameData });
  const row = ledger.get('Merchant', 0);
  assert.equal(row.disposition, ItemDisposition.RESERVE_UPGRADE);
  assert.ok(row.reasons.includes('PROTECTED_ITEM_OPERATOR_OVERRIDE'));
});

test('Alpha27 autonomous planner respects per-action deny rules instead of bypassing them', () => {
  const permissions = {
    material: { sell: false },
    sword: { upgrade: false },
    ring: { compound: false },
    rare: { bank: false }
  };
  const ledger = makeLedger([], {
    _permission(name, action) {
      const row = permissions[name];
      return row && typeof row[action] === 'boolean' ? row[action] : null;
    }
  });
  const gd = {
    items: {
      material: { g: 10 },
      sword: { g: 10, upgrade: { attack: 1 }, grades: [] },
      ring: { g: 10, compound: { dex: 1 }, grades: [] },
      rare: { g: 20000 }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData: gd });
  new Alpha27CombatMerchantConvergence(runtime, { keepValue: 1000 });
  runtime.gearProgression.futureProtectionFor = () => null;
  runtime.gearProgression.futureSellSafetyFor = () => ({ checked: true, protected: false });
  const counts = new Map([['ring:0', 3]]);
  const classify = (name) => ledger._baseDisposition({ name, level: 0 }, gd, runtime.contentDrift, counts);

  assert.equal(classify('material').disposition, 'KEEP');
  assert.ok(classify('material').reasons.includes('OPERATOR_SELL_DENIED'));
  assert.equal(classify('sword').disposition, 'SELL');
  assert.ok(classify('sword').reasons.includes('AUTONOMOUS_ECONOMIC_EXPECTED_VALUE_SELL'));
  assert.equal(classify('ring').disposition, 'SELL');
  assert.ok(classify('ring').reasons.includes('AUTONOMOUS_ECONOMIC_EXPECTED_VALUE_SELL'));
  assert.equal(classify('rare').disposition, 'KEEP');
  assert.ok(classify('rare').reasons.includes('OPERATOR_BANK_DENIED'));
});
