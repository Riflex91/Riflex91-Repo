'use strict';

const DEFAULT_UPGRADE_CHANCES = Object.freeze({
  0: Object.freeze({ 1: 0.9999999, 2: 0.98, 3: 0.95, 4: 0.7, 5: 0.6, 6: 0.4, 7: 0.25, 8: 0.15, 9: 0.07, 10: 0.024, 11: 0.14, 12: 0.11 }),
  1: Object.freeze({ 1: 0.99998, 2: 0.97, 3: 0.94, 4: 0.68, 5: 0.58, 6: 0.38, 7: 0.24, 8: 0.14, 9: 0.066, 10: 0.018, 11: 0.13, 12: 0.10 }),
  2: Object.freeze({ 1: 0.97, 2: 0.94, 3: 0.92, 4: 0.64, 5: 0.52, 6: 0.32, 7: 0.232, 8: 0.13, 9: 0.062, 10: 0.015, 11: 0.12, 12: 0.09 })
});
const DEFAULT_COMPOUND_CHANCES = Object.freeze({
  0: Object.freeze({ 1: 0.99, 2: 0.75, 3: 0.40, 4: 0.25, 5: 0.20, 6: 0.10, 7: 0.08, 8: 0.05, 9: 0.05, 10: 0.05 }),
  1: Object.freeze({ 1: 0.90, 2: 0.70, 3: 0.40, 4: 0.20, 5: 0.15, 6: 0.08, 7: 0.05, 8: 0.05, 9: 0.05, 10: 0.03 }),
  2: Object.freeze({ 1: 0.80, 2: 0.60, 3: 0.32, 4: 0.16, 5: 0.10, 6: 0.05, 7: 0.03, 8: 0.03, 9: 0.03, 10: 0.02 })
});

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function levelOf(value) {
  return Math.max(0, Math.floor(finite(value && typeof value === 'object' ? value.level : value, 0)));
}

function gradeForLevel(meta, level) {
  const grades = Array.isArray(meta && meta.grades) ? meta.grades : [9, 10, 11, 12];
  const current = levelOf(level);
  for (let index = Math.min(3, grades.length - 1); index >= 0; index -= 1) {
    const threshold = finite(grades[index]);
    if (threshold != null && current >= threshold) return index + 1;
  }
  return 0;
}

function progressionTable(gameData, compound) {
  const live = gameData && (compound ? gameData.compounds : gameData.upgrades);
  return live && typeof live === 'object'
    ? live
    : compound ? DEFAULT_COMPOUND_CHANCES : DEFAULT_UPGRADE_CHANCES;
}

function progressionProbability(gameData, meta, nextLevel, compound = false) {
  const bucket = Math.max(0, Math.min(2, Math.floor(finite(meta && meta.igrade, 0))));
  const table = progressionTable(gameData, compound);
  const row = table && (table[bucket] || table[String(bucket)]);
  const raw = row && (row[nextLevel] != null ? row[nextLevel] : row[String(nextLevel)]);
  const chance = finite(raw);
  return chance != null && chance >= 0 && chance <= 1 ? chance : null;
}

function scrollName(meta, currentLevel, compound = false) {
  return `${compound ? 'cscroll' : 'scroll'}${Math.max(0, Math.min(3, gradeForLevel(meta, currentLevel)))}`;
}

function scrollBuyCost(gameData, meta, currentLevel, compound = false) {
  const name = scrollName(meta, currentLevel, compound);
  const def = gameData && gameData.items && gameData.items[name];
  const value = finite(def && def.g);
  return { name, cost: value != null && value >= 0 ? value : null };
}

// Mirrors Adventure Land's NPC sell-value calculation for ordinary gold items.
// Cash/event/special protection is handled by the inventory safety layer before
// this model is allowed to authorize disposal.
function itemNpcSellValue(gameData, itemOrName, explicitLevel = null, quantity = 1) {
  const item = typeof itemOrName === 'string'
    ? { name: itemOrName, level: explicitLevel == null ? 0 : explicitLevel }
    : itemOrName || {};
  const name = String(item.name || '');
  const def = gameData && gameData.items && gameData.items[name];
  if (!def || typeof def !== 'object') return null;
  if (item.gift) return 1;
  const base = finite(def.g);
  if (base == null || base < 0) return null;
  let value = def.cash ? base : base * 0.6;
  const markup = finite(def.markup);
  if (markup != null && markup > 0) value /= markup;
  const level = Math.max(0, Math.floor(explicitLevel == null ? levelOf(item) : finite(explicitLevel, 0)));
  if (def.compound && level > 0) {
    const grades = Array.isArray(def.grades) ? def.grades : [11, 12];
    let grade = 0;
    for (let i = 1; i <= level; i += 1) {
      if (i > finite(grades[1], 12)) grade = 2;
      else if (i > finite(grades[0], 11)) grade = 1;
      if (def.cash) value *= 1.5;
      else value *= 3.2;
      if (String(def.type || '') !== 'booster') {
        const scroll = gameData.items && gameData.items[`cscroll${grade}`];
        const scrollGold = finite(scroll && scroll.g, 0);
        value += scrollGold / 2.4;
      } else value *= 0.75;
    }
  }
  if (def.upgrade && level > 0) {
    const grades = Array.isArray(def.grades) ? def.grades : [11, 12];
    let grade = 0;
    let scrollContribution = 0;
    for (let i = 1; i <= level; i += 1) {
      if (i > finite(grades[1], 12)) grade = 2;
      else if (i > finite(grades[0], 11)) grade = 1;
      const scroll = gameData.items && gameData.items[`scroll${grade}`];
      scrollContribution += finite(scroll && scroll.g, 0) / 2;
      if (i >= 7) {
        value *= 3;
        scrollContribution *= 1.32;
      } else if (i === 6) value *= 2.4;
      else if (i >= 4) value *= 2;
      if (i === 9) {
        value *= 2.64;
        value += 400000;
      }
      if (i === 10) value *= 5;
      if (i === 12) value *= 0.8;
    }
    value += scrollContribution;
  }
  if (item.expires) value /= 8;
  const q = Math.max(1, Math.floor(finite(quantity != null ? quantity : item.q, 1)));
  return Math.round(value * q);
}

function evaluateUpgradeEconomics(options = {}) {
  const gameData = options.gameData || {};
  const name = String(options.itemName || '');
  const meta = gameData.items && gameData.items[name];
  const currentLevel = levelOf(options.currentLevel);
  const maxLevel = Math.max(currentLevel, Math.min(12, Math.floor(finite(options.maxLevel, currentLevel))));
  if (!meta || !meta.upgrade) return { modeled: false, action: 'SELL', reason: 'NOT_UPGRADEABLE', currentLevel, targetLevel: currentLevel };

  const values = new Map();
  const direct = new Map();
  for (let level = currentLevel; level <= maxLevel; level += 1) {
    const sellValue = itemNpcSellValue(gameData, name, level, 1);
    direct.set(level, sellValue);
    values.set(level, {
      expectedGold: sellValue,
      targetLevel: level,
      action: 'SELL',
      chance: null,
      scroll: null,
      scrollCost: 0
    });
  }
  for (let level = maxLevel - 1; level >= currentLevel; level -= 1) {
    const nextLevel = level + 1;
    const chance = progressionProbability(gameData, meta, nextLevel, false);
    const scroll = scrollBuyCost(gameData, meta, level, false);
    const next = values.get(nextLevel);
    const sale = direct.get(level);
    if (chance == null || scroll.cost == null || next == null || sale == null) continue;
    const upgradeExpected = chance * next.expectedGold - scroll.cost;
    if (upgradeExpected > sale) {
      values.set(level, {
        expectedGold: upgradeExpected,
        targetLevel: next.targetLevel,
        action: 'UPGRADE',
        chance,
        scroll: scroll.name,
        scrollCost: scroll.cost
      });
    }
  }
  const choice = values.get(currentLevel) || {};
  const directSellGold = direct.get(currentLevel);
  return {
    modeled: directSellGold != null,
    family: 'UPGRADE',
    action: choice.action || 'SELL',
    item: name,
    currentLevel,
    targetLevel: choice.targetLevel == null ? currentLevel : choice.targetLevel,
    expectedGold: finite(choice.expectedGold, directSellGold),
    directSellGold,
    expectedGain: finite(choice.expectedGold, directSellGold) - finite(directSellGold, 0),
    nextChance: choice.chance == null ? null : choice.chance,
    scroll: choice.scroll || null,
    scrollCost: finite(choice.scrollCost, 0),
    model: 'NPC_SELL_EXPECTED_VALUE_V1'
  };
}

function evaluateCompoundEconomics(options = {}) {
  const gameData = options.gameData || {};
  const name = String(options.itemName || '');
  const meta = gameData.items && gameData.items[name];
  const currentLevel = levelOf(options.currentLevel);
  const same = Math.max(0, Math.floor(finite(options.sameCount, 0)));
  const maxLevel = Math.max(currentLevel, Math.min(10, Math.floor(finite(options.maxLevel, currentLevel))));
  const directOne = itemNpcSellValue(gameData, name, currentLevel, 1);
  if (!meta || !meta.compound || currentLevel >= maxLevel || directOne == null) {
    return { modeled: directOne != null, family: 'COMPOUND', action: 'SELL', item: name, currentLevel, targetLevel: currentLevel, directSellGold: directOne, expectedGold: directOne, expectedGain: 0, sameCount: same, model: 'NPC_SELL_EXPECTED_VALUE_V1' };
  }
  const nextLevel = currentLevel + 1;
  const chance = progressionProbability(gameData, meta, nextLevel, true);
  const scroll = scrollBuyCost(gameData, meta, currentLevel, true);
  const nextSell = itemNpcSellValue(gameData, name, nextLevel, 1);
  if (chance == null || scroll.cost == null || nextSell == null) {
    return { modeled: false, family: 'COMPOUND', action: 'SELL', item: name, currentLevel, targetLevel: currentLevel, directSellGold: directOne, expectedGold: directOne, expectedGain: 0, sameCount: same, model: 'NPC_SELL_EXPECTED_VALUE_V1' };
  }
  const directSet = directOne * 3;
  const compoundExpected = chance * nextSell - scroll.cost;
  const profitable = compoundExpected > directSet;
  return {
    modeled: true,
    family: 'COMPOUND',
    action: profitable ? (same >= 3 ? 'COMPOUND' : 'ACCUMULATE') : 'SELL',
    item: name,
    currentLevel,
    targetLevel: profitable ? nextLevel : currentLevel,
    expectedGold: profitable ? compoundExpected : directSet,
    directSellGold: directSet,
    expectedGain: compoundExpected - directSet,
    nextChance: chance,
    scroll: scroll.name,
    scrollCost: scroll.cost,
    sameCount: same,
    model: 'NPC_SELL_EXPECTED_VALUE_V1'
  };
}

function evaluateItemEconomics(options = {}) {
  const gameData = options.gameData || {};
  const meta = gameData.items && gameData.items[String(options.itemName || '')];
  if (meta && meta.compound) return evaluateCompoundEconomics(options);
  if (meta && meta.upgrade) return evaluateUpgradeEconomics(options);
  const directSellGold = itemNpcSellValue(gameData, String(options.itemName || ''), levelOf(options.currentLevel), 1);
  return {
    modeled: directSellGold != null,
    family: 'NONE',
    action: 'SELL',
    item: String(options.itemName || ''),
    currentLevel: levelOf(options.currentLevel),
    targetLevel: levelOf(options.currentLevel),
    expectedGold: directSellGold,
    directSellGold,
    expectedGain: 0,
    model: 'NPC_SELL_EXPECTED_VALUE_V1'
  };
}

function itemEconomyCatalog(gameData, name, maxLevel = 10) {
  const meta = gameData && gameData.items && gameData.items[name];
  if (!meta || typeof meta !== 'object') return null;
  const limit = Math.max(0, Math.min(12, Math.floor(finite(maxLevel, 10))));
  const sellValues = [];
  for (let level = 0; level <= limit; level += 1) {
    const value = itemNpcSellValue(gameData, name, level, 1);
    if (value == null) break;
    sellValues.push({ level, value });
    if (!meta.upgrade && !meta.compound) break;
  }
  const chances = [];
  const compound = !!meta.compound;
  if (meta.upgrade || compound) {
    for (let nextLevel = 1; nextLevel <= limit; nextLevel += 1) {
      const chance = progressionProbability(gameData, meta, nextLevel, compound);
      if (chance == null) break;
      chances.push({ level: nextLevel, chance });
    }
  }
  return {
    baseGold: finite(meta.g),
    npcSellValues: sellValues,
    progression: meta.compound ? 'COMPOUND' : meta.upgrade ? 'UPGRADE' : null,
    baseChances: chances,
    grades: Array.isArray(meta.grades) ? meta.grades.slice(0, 6) : [],
    itemGrade: finite(meta.igrade, 0),
    model: 'AL_ATLAS_GAME_DATA_V1'
  };
}

module.exports = {
  DEFAULT_UPGRADE_CHANCES,
  DEFAULT_COMPOUND_CHANCES,
  progressionProbability,
  scrollName,
  scrollBuyCost,
  itemNpcSellValue,
  evaluateUpgradeEconomics,
  evaluateCompoundEconomics,
  evaluateItemEconomics,
  itemEconomyCatalog
};
