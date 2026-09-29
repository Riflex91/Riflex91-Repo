'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  GearProgressionEvaluator,
  scoreItem
} = require('../src/economy/gear-progression');

test('future gear intelligence chooses a risk-adjusted dynamic target instead of a fixed +5', () => {
  const evaluator = new GearProgressionEvaluator({
    now: () => 1000,
    maxProbeLevel: 7,
    minImprovementRatio: 0.01
  });
  const gameData = {
    upgrades: {
      0: { 1: 1, 2: 1, 3: 1, 4: 0.05, 5: 0.05, 6: 0.05, 7: 0.05 }
    },
    items: {
      oldbow: { type: 'weapon', class: ['ranger'], attack: 25, g: 1000 },
      futurebow: {
        type: 'weapon',
        class: ['ranger'],
        attack: 10,
        g: 1000,
        igrade: 0,
        grades: [],
        upgrade: { attack: 10 }
      }
    }
  };

  const result = evaluator.evaluate({
    registry: {
      characters: [
        {
          name: 'Merchant',
          ctype: 'merchant',
          level: 80,
          inventory: [{ index: 0, name: 'futurebow', level: 0, q: 1 }],
          gear: {}
        },
        {
          name: 'Ranger1',
          ctype: 'ranger',
          level: 80,
          inventory: [],
          gear: { mainhand: { name: 'oldbow', level: 0 } }
        }
      ]
    },
    gameData,
    contentDrift: { requiresRevalidation: () => false }
  });

  const goal = result.currentGoals.find((row) => row.character === 'Ranger1' && row.item === 'futurebow');
  assert.ok(goal);
  assert.equal(goal.firstMeaningfulLevel, 2);
  assert.equal(goal.targetLevel, 3);
  assert.equal(goal.projectedUpgradeRequired, true);
  assert.equal(goal.targetSelectionReason, 'RISK_ADJUSTED_FUTURE_GEAR_VALUE');
  assert.ok(Array.isArray(goal.progressionCurve));
  assert.ok(goal.progressionCurve.some((row) => row.level === 4 && row.cumulativeSuccessChance < 0.10));

  const protection = evaluator.futureProtectionFor('Merchant', 0, 'futurebow', 0);
  assert.ok(protection);
  assert.equal(protection.targetCharacter, 'Ranger1');
  assert.equal(protection.targetLevel, 3);
  assert.equal(protection.upgradeLifecycle, 'FARMER_DYNAMIC_GEAR_TARGET');
});

test('gear scoring can incorporate explicit combat role without changing default class scoring', () => {
  const meta = {
    type: 'chest',
    attack: 10,
    armor: 100,
    resistance: 40,
    hp: 200
  };
  const base = scoreItem(meta, 0, 'warrior');
  const tank = scoreItem(meta, 0, 'warrior', { combatRole: 'tank' });
  const dps = scoreItem(meta, 0, 'warrior', { combatRole: 'dps' });

  assert.ok(tank.survival > base.survival);
  assert.ok(tank.survival > dps.survival);
  assert.ok(dps.total > 0);
});

test('future gear intelligence remains fail-closed when content requires revalidation', () => {
  const evaluator = new GearProgressionEvaluator({ now: () => 1000, maxProbeLevel: 7 });
  const gameData = {
    items: {
      futurebow: {
        type: 'weapon',
        class: ['ranger'],
        attack: 10,
        g: 1000,
        upgrade: { attack: 10 }
      }
    }
  };
  evaluator.evaluate({
    registry: {
      characters: [
        {
          name: 'Merchant',
          ctype: 'merchant',
          level: 80,
          inventory: [{ index: 0, name: 'futurebow', level: 0, q: 1 }],
          gear: {}
        },
        {
          name: 'Ranger1',
          ctype: 'ranger',
          level: 80,
          inventory: [],
          gear: {}
        }
      ]
    },
    gameData,
    contentDrift: { requiresRevalidation: () => true }
  });

  const safety = evaluator.futureSellSafetyFor('Merchant', 0, 'futurebow', 0);
  assert.ok(safety);
  assert.equal(safety.checked, false);
  assert.equal(safety.blockedByUnknownContent, true);
});
