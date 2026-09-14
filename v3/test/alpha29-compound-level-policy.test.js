'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { boundedOptions, synchronizeLegacyCompoundPolicy } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { mutationFixture } = require('./alpha27-convergence-test-helpers');

function setCompoundLevel(fixture, level) {
  for (let index = 0; index < 3; index += 1) {
    fixture.root.character.items[index] = { name: 'ring', level };
    const entry = fixture.ledger.entries.get(`Merchant:${index}`);
    entry.level = level;
  }
}

test('compound result cap defaults to +6 and clamps explicit values at +6', () => {
  assert.equal(boundedOptions({}).maxCompoundLevel, 6);
  assert.equal(boundedOptions({ maxCompoundLevel: 99 }).maxCompoundLevel, 6);
  assert.equal(boundedOptions({ maxCompoundLevel: 4 }).maxCompoundLevel, 4);
});

test('legacy economy compound source cap is synchronized to the +6 result cap', () => {
  const runtime = { merchantEconomyAutonomy: { cfg: { maxCompound: 1 } } };
  assert.equal(synchronizeLegacyCompoundPolicy(runtime, 6), true);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompound, 5);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxCompoundResultLevel, 6);
});

test('level +5 compound selects and purchases the grade-appropriate cscroll2 before reaching +6', async () => {
  const fixture = mutationFixture('COMPOUND');
  const { runtime, convergence, engine, ledger, root } = fixture;
  setCompoundLevel(fixture, 5);

  const gameData = runtime.adapter.getGameData();
  gameData.items.ring.grades = [2, 4];
  gameData.items.cscroll2 = { g: 100 };
  root.character.items[3] = null;

  const purchases = [];
  root.can_buy = (name) => name === 'cscroll2';
  root.buy = async (name, quantity) => {
    purchases.push({ name, quantity });
    root.character.gold -= 100 * quantity;
    root.character.items[3] = { name, level: 0, q: quantity };
    return { success: true };
  };
  root.compound = async (a, b, c, scrollIndex) => {
    assert.deepEqual([a, b, c, scrollIndex], [0, 1, 2, 3]);
    root.character.items[0] = { name: 'ring', level: 6 };
    root.character.items[1] = null;
    root.character.items[2] = null;
    root.character.items[3] = null;
    return { success: true };
  };

  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'SUCCESS');
  assert.deepEqual(purchases, [{ name: 'cscroll2', quantity: 1 }]);
  assert.equal(convergence.stats.scrollPurchases, 1);
  assert.equal(root.character.items[0].level, 6);
});

test('level +6 compound is blocked before mutation so the result can never exceed +6', async () => {
  const fixture = mutationFixture('COMPOUND');
  const { convergence, engine, ledger, root } = fixture;
  setCompoundLevel(fixture, 6);

  let compoundCalls = 0;
  root.compound = async () => { compoundCalls += 1; return { success: true }; };

  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, false);
  assert.equal(result.reason, 'COMPOUND_LEVEL_RISK_CAP');
  assert.equal(compoundCalls, 0);
});
