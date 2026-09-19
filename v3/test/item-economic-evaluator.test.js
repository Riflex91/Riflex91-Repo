'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  itemNpcSellValue,
  evaluateUpgradeEconomics,
  evaluateCompoundEconomics
} = require('../src/economy/item-economic-evaluator');

test('Party Hat uses Adventure Land NPC sell values and direct sale beats blind +3 processing', () => {
  const gameData = {
    items: {
      partyhat: {
        tier: 1,
        type: 'helmet',
        upgrade: { str: 0.2, int: 0.2, dex: 0.2, vit: 0.1 },
        g: 12000
      },
      scroll0: { type: 'uscroll', g: 1000 }
    }
  };

  assert.equal(itemNpcSellValue(gameData, 'partyhat', 0), 7200);
  assert.equal(itemNpcSellValue(gameData, 'partyhat', 1), 7700);
  assert.equal(itemNpcSellValue(gameData, 'partyhat', 2), 8200);
  assert.equal(itemNpcSellValue(gameData, 'partyhat', 3), 8700);

  const decision = evaluateUpgradeEconomics({
    gameData,
    itemName: 'partyhat',
    currentLevel: 0,
    maxLevel: 3
  });

  assert.equal(decision.modeled, true);
  assert.equal(decision.action, 'SELL');
  assert.equal(decision.targetLevel, 0);
  assert.equal(decision.directSellGold, 7200);
  assert.ok(decision.expectedGold >= 7200);
});

test('expected-value upgrade model can choose a profitable future level instead of always selling', () => {
  const gameData = {
    items: {
      testblade: { type: 'weapon', upgrade: { attack: 1 }, g: 10000 },
      scroll0: { type: 'uscroll', g: 1 }
    }
  };

  const decision = evaluateUpgradeEconomics({
    gameData,
    itemName: 'testblade',
    currentLevel: 0,
    maxLevel: 4
  });

  assert.equal(decision.action, 'UPGRADE');
  assert.equal(decision.targetLevel, 4);
  assert.ok(decision.expectedGold > decision.directSellGold);
  assert.equal(decision.scroll, 'scroll0');
});

test('compound expected value compares one compound set against selling all three inputs', () => {
  const gameData = {
    items: {
      ring: { type: 'ring', compound: { dex: 1 }, g: 1000 },
      cscroll0: { type: 'cscroll', g: 10 }
    }
  };

  const decision = evaluateCompoundEconomics({
    gameData,
    itemName: 'ring',
    currentLevel: 0,
    sameCount: 3,
    maxLevel: 1
  });

  assert.equal(decision.modeled, true);
  assert.equal(decision.action, 'COMPOUND');
  assert.equal(decision.targetLevel, 1);
  assert.ok(decision.expectedGain > 0);
});
