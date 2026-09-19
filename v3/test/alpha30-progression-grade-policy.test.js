'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { gradeForLevel } = require('../src/reliability/alpha27-utils');
const {
  boundedOptions,
  synchronizeLegacyUpgradePolicy,
  installLegacyProgressionGradeGuard
} = require('../src/reliability/alpha27-combat-merchant-convergence');
const { mutationFixture } = require('./alpha27-convergence-test-helpers');

function setUpgradeLevel(fixture, level, targetLevel = level + 1) {
  fixture.root.character.items[0] = { name: 'sword', level };
  const entry = fixture.ledger.entries.get('Merchant:0');
  entry.level = level;
  fixture.runtime.gearProgression = {
    list: () => [{
      id: 'goal-upgrade',
      sourceCharacter: 'Merchant',
      character: 'Farmer',
      item: 'sword',
      observedLevel: level,
      targetLevel,
      projectedUpgradeRequired: true
    }]
  };
}

function setCompoundLevel(fixture, level) {
  for (let index = 0; index < 3; index += 1) {
    fixture.root.character.items[index] = { name: 'ring', level };
    fixture.ledger.entries.get(`Merchant:${index}`).level = level;
  }
}

test('gradeForLevel follows all current Adventure Land progression thresholds through Exalted', () => {
  assert.equal(gradeForLevel({ grades: [3, 5] }, 2), 0);
  assert.equal(gradeForLevel({ grades: [3, 5] }, 3), 1);
  assert.equal(gradeForLevel({ grades: [3, 5] }, 5), 2);

  const trigger = { grades: [0, 0, 1, 3] };
  assert.equal(gradeForLevel(trigger, 0), 2);
  assert.equal(gradeForLevel(trigger, 1), 3);
  assert.equal(gradeForLevel(trigger, 2), 3);
  assert.equal(gradeForLevel(trigger, 3), 4);

  assert.equal(gradeForLevel({}, 8), 0);
  assert.equal(gradeForLevel({}, 9), 1);
  assert.equal(gradeForLevel({}, 10), 2);
  assert.equal(gradeForLevel({}, 11), 3);
  assert.equal(gradeForLevel({}, 12), 4);
  assert.equal(gradeForLevel({ grades: [] }, 99), 0);
});

test('upgrade result cap defaults to +7 and clamps explicit values at +7', () => {
  assert.equal(boundedOptions({}).maxUpgradeLevel, 7);
  assert.equal(boundedOptions({ maxUpgradeLevel: 99 }).maxUpgradeLevel, 7);
  assert.equal(boundedOptions({ maxUpgradeLevel: 6 }).maxUpgradeLevel, 6);
  assert.equal(boundedOptions({}).maxCompoundLevel, 10);
});

test('legacy economy upgrade cap is synchronized to the +7 result cap', () => {
  const runtime = { merchantEconomyAutonomy: { cfg: { maxUpgrade: 2 } } };
  assert.equal(synchronizeLegacyUpgradePolicy(runtime, 7), true);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgrade, 7);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.maxUpgradeResultLevel, 7);
});

test('legacy economy defers Legendary upgrades to Alpha27 instead of using an undersized scroll', async () => {
  let calls = 0;
  const character = { name: 'Merchant', items: [{ name: 'sword', level: 6 }] };
  const gameData = { items: { sword: { upgrade: true, grades: [0, 0, 5, 8] } } };
  const legacy = {
    cfg: { maxUpgrade: 7, upgradeCap: 2000000 },
    now: () => 1000,
    oracle: { quote: () => ({ fairValue: 1000 }) },
    _c: () => character,
    _inv: () => character.items.map((item, index) => item ? { ...item, index } : null),
    _g: () => gameData,
    _upgrade: async () => { calls += 1; return true; }
  };
  const runtime = { merchantEconomyAutonomy: legacy };
  assert.equal(installLegacyProgressionGradeGuard(runtime), true);
  const result = await legacy._upgrade({ goals: [{ sourceCharacter: 'Merchant', character: 'Farmer', item: 'sword', observedLevel: 6, targetLevel: 7, projectedUpgradeRequired: true }] });
  assert.equal(result, false);
  assert.equal(calls, 0);
  assert.equal(legacy.lastDecision.reason, 'LEGENDARY_SCROLL_REQUIRES_ALPHA27');
  assert.equal(legacy.lastDecision.grade, 3);
});

test('level +6 upgrade buys and uses the minimum compatible Legendary scroll before reaching +7', async () => {
  const fixture = mutationFixture('UPGRADE');
  const { runtime, convergence, engine, ledger, root } = fixture;
  setUpgradeLevel(fixture, 6, 7);

  const gameData = runtime.adapter.getGameData();
  gameData.items.sword.grades = [0, 0, 5, 8];
  gameData.items.scroll3 = { g: 100 };
  root.character.items[1] = null;

  const purchases = [];
  root.can_buy = (name) => name === 'scroll3';
  root.buy = async (name, quantity) => {
    purchases.push({ name, quantity });
    root.character.gold -= 100 * quantity;
    root.character.items[1] = { name, level: 0, q: quantity };
    return { success: true };
  };
  root.upgrade = async (...args) => {
    if (args[args.length - 1] === true) return { success: true, chance: 0.99 };
    const [itemIndex, scrollIndex] = args;
    assert.deepEqual([itemIndex, scrollIndex], [0, 1]);
    root.character.items[0] = { name: 'sword', level: 7 };
    root.character.items[1] = null;
    return { success: true };
  };

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', index: 0 }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'SUCCESS');
  assert.deepEqual(purchases, [{ name: 'scroll3', quantity: 1 }]);
  assert.equal(convergence.stats.scrollPurchases, 1);
  assert.equal(root.character.items[0].level, 7);
});

test('level +7 upgrade is blocked before mutation so the result can never exceed +7', async () => {
  const fixture = mutationFixture('UPGRADE');
  const { convergence, engine, ledger, root } = fixture;
  setUpgradeLevel(fixture, 7, 8);

  let upgradeCalls = 0;
  root.upgrade = async () => { upgradeCalls += 1; return { success: true }; };

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', index: 0 }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, false);
  assert.equal(result.reason, 'UPGRADE_LEVEL_RISK_CAP');
  assert.equal(upgradeCalls, 0);
});

test('Exalted upgrade is blocked before scroll purchase or mutation even below +7', async () => {
  const fixture = mutationFixture('UPGRADE');
  const { runtime, convergence, engine, ledger, root } = fixture;
  setUpgradeLevel(fixture, 3, 4);
  const gameData = runtime.adapter.getGameData();
  gameData.items.sword.grades = [0, 0, 1, 3];

  let buys = 0;
  let upgradeCalls = 0;
  root.buy = async () => { buys += 1; return { success: true }; };
  root.upgrade = async () => { upgradeCalls += 1; return { success: true }; };

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', index: 0 }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, false);
  assert.equal(result.reason, 'UPGRADE_ITEM_EXALTED');
  assert.equal(buys, 0);
  assert.equal(upgradeCalls, 0);
});

test('Legendary compound buys cscroll3 while Exalted compound is blocked', async () => {
  const fixture = mutationFixture('COMPOUND');
  const { runtime, convergence, engine, ledger, root } = fixture;
  setCompoundLevel(fixture, 1);
  const gameData = runtime.adapter.getGameData();
  gameData.items.ring.grades = [0, 0, 1, 3];
  gameData.items.cscroll3 = { g: 100 };
  root.character.items[3] = null;

  const purchases = [];
  root.can_buy = (name) => name === 'cscroll3';
  root.buy = async (name, quantity) => {
    purchases.push({ name, quantity });
    root.character.gold -= 100 * quantity;
    root.character.items[3] = { name, level: 0, q: quantity };
    return { success: true };
  };
  root.compound = async (a, b, c, scrollIndex) => {
    assert.deepEqual([a, b, c, scrollIndex], [0, 1, 2, 3]);
    root.character.items[0] = { name: 'ring', level: 2 };
    root.character.items[1] = null;
    root.character.items[2] = null;
    root.character.items[3] = null;
    return { success: true };
  };

  let planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  let result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.deepEqual(purchases, [{ name: 'cscroll3', quantity: 1 }]);
  assert.equal(root.character.items[0].level, 2);

  setCompoundLevel(fixture, 3);
  root.character.items[3] = null;
  let compoundCalls = 0;
  root.compound = async () => { compoundCalls += 1; return { success: true }; };
  planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'COMPOUND_ITEM_EXALTED');
  assert.equal(compoundCalls, 0);
});
