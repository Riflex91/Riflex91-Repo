'use strict';

const PRIMARY_STAT = Object.freeze({
  ranger: 'dex',
  rogue: 'dex',
  warrior: 'str',
  paladin: 'str',
  mage: 'int',
  priest: 'int',
  merchant: 'luck'
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function primaryStatFor(ctype) {
  return PRIMARY_STAT[String(ctype || '').toLowerCase()] || null;
}

function elixirCandidates(gameData, ctype) {
  const items = gameData && gameData.items || {};
  const stat = primaryStatFor(ctype);
  if (!stat) return [];
  return Object.entries(items)
    .filter(([, meta]) => meta && meta.type === 'elixir' && finite(meta[stat], 0) > 0 && finite(meta.duration, 0) > 0)
    .map(([name, meta]) => {
      const statValue = finite(meta[stat], 0);
      const durationHours = finite(meta.duration, 0);
      const nominalValue = Math.max(1, finite(meta.g != null ? meta.g : meta.gold, 1));
      return {
        name,
        stat,
        statValue,
        durationHours,
        nominalValue,
        totalUtility: statValue * durationHours,
        efficiency: (statValue * durationHours) / nominalValue,
        meta: clone(meta)
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency || b.totalUtility - a.totalUtility || a.nominalValue - b.nominalValue || a.name.localeCompare(b.name));
}

function preferredAcquisitionElixir(gameData, ctype) {
  return elixirCandidates(gameData, ctype)[0] || null;
}

function bestOwnedElixir(inventory, gameData, ctype) {
  const byName = new Map(elixirCandidates(gameData, ctype).map((row) => [row.name, row]));
  const rows = [];
  for (const item of Array.isArray(inventory) ? inventory : []) {
    if (!item || !byName.has(item.name)) continue;
    const candidate = byName.get(item.name);
    rows.push({ ...candidate, index: item.index, quantity: Math.max(1, Math.floor(finite(item.q, 1))) });
  }
  rows.sort((a, b) => b.totalUtility - a.totalUtility || b.durationHours - a.durationHours || a.name.localeCompare(b.name));
  return rows[0] || null;
}

function activeElixir(character, now = Date.now()) {
  const slot = character && character.slots && character.slots.elixir || null;
  if (!slot || !slot.name) return { active: false, name: null, remainingMs: 0, expiresAt: null };
  const raw = slot.expires;
  const expiresAt = raw instanceof Date ? raw.getTime() : Date.parse(raw || '');
  if (!Number.isFinite(expiresAt)) return { active: true, name: slot.name, remainingMs: Infinity, expiresAt: null };
  const remainingMs = Math.max(0, expiresAt - now);
  return { active: remainingMs > 0, name: slot.name, remainingMs, expiresAt };
}

function flattenDropTable(gameData, table, multiplier = 1, seen = new Set()) {
  const drops = gameData && gameData.drops || {};
  const rows = Array.isArray(table) ? table : [];
  const out = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const weight = Math.max(0, finite(row[0], 0));
    if (!weight) continue;
    if (row[1] === 'open' && row[2] && Array.isArray(drops[row[2]])) {
      const key = String(row[2]);
      if (seen.has(key)) continue;
      const total = drops[key].reduce((sum, child) => sum + Math.max(0, finite(child && child[0], 0)), 0) || 1;
      const nextSeen = new Set(seen); nextSeen.add(key);
      out.push(...flattenDropTable(gameData, drops[key], multiplier * weight / total, nextSeen));
      continue;
    }
    if (typeof row[1] !== 'string') continue;
    out.push({ chance: multiplier * weight, name: row[1], quantity: Math.max(1, Math.floor(finite(row[2], 1))) });
  }
  return out;
}

function rewardChanceForExchange(gameData, exchangeItemName, desiredName) {
  const drops = gameData && gameData.drops || {};
  const table = drops[exchangeItemName];
  if (!Array.isArray(table)) return 0;
  return flattenDropTable(gameData, table).filter((row) => row.name === desiredName)
    .reduce((sum, row) => sum + row.chance * row.quantity, 0);
}

function directDropChance(gameData, monster, itemName) {
  const monsters = gameData && gameData.drops && gameData.drops.monsters || {};
  const table = monsters[monster];
  if (!Array.isArray(table)) return 0;
  return flattenDropTable(gameData, table).filter((row) => row.name === itemName)
    .reduce((sum, row) => sum + row.chance * row.quantity, 0);
}

function monsterSpawn(gameData, mtype) {
  const maps = gameData && gameData.maps || {};
  for (const [mapName, map] of Object.entries(maps)) {
    const packs = Array.isArray(map && map.monsters) ? map.monsters : [];
    for (let i = 0; i < packs.length; i += 1) {
      const pack = packs[i];
      if (!pack || String(pack.type || pack.mtype || '') !== String(mtype)) continue;
      const boundary = Array.isArray(pack.boundary) ? pack.boundary : Array.isArray(pack.boundaries) && pack.boundaries[0];
      let x = finite(pack.x, null), y = finite(pack.y, null);
      if ((x == null || y == null) && Array.isArray(boundary) && boundary.length >= 4) {
        x = (finite(boundary[0], 0) + finite(boundary[2], 0)) / 2;
        y = (finite(boundary[1], 0) + finite(boundary[3], 0)) / 2;
      }
      return { map: mapName, spawnIndex: i, x, y };
    }
  }
  return null;
}

function bestMeasuredKillsPerHour(runtime, monster) {
  const world = runtime && runtime.world;
  if (!world || !(world.performance instanceof Map)) return null;
  const rows = [...world.performance.values()]
    .filter((row) => row && row.monster === monster && finite(row.seconds, 0) >= 60)
    .map((row) => {
      const hours = finite(row.seconds, 0) / 3600;
      return { kph: hours > 0 ? finite(row.kills, 0) / hours : 0, seconds: finite(row.seconds, 0) };
    })
    .filter((row) => row.kph > 0)
    .sort((a, b) => b.seconds - a.seconds);
  return rows.length ? rows[0].kph : null;
}

function bestFarmSource(runtime, desiredElixirName, options = {}) {
  const gameData = runtime && runtime.adapter && runtime.adapter.getGameData ? runtime.adapter.getGameData() || {} : {};
  const items = gameData.items || {};
  const monsters = gameData.drops && gameData.drops.monsters || {};
  const fallbackKillsPerHour = Math.max(10, finite(options.fallbackKillsPerHour, 60));
  const candidates = [];

  for (const monster of Object.keys(monsters)) {
    const direct = directDropChance(gameData, monster, desiredElixirName);
    if (direct > 0) {
      const killsPerHour = bestMeasuredKillsPerHour(runtime, monster) || fallbackKillsPerHour;
      const unitsPerHour = direct * killsPerHour;
      const spawn = monsterSpawn(gameData, monster);
      if (unitsPerHour > 0 && spawn) candidates.push({
        kind: 'DIRECT_ELIXIR_DROP', monster, material: desiredElixirName, yieldPerKill: direct,
        killsPerHour, unitsPerHour, expectedHours: 1 / unitsPerHour, ...spawn
      });
    }
  }

  for (const [material, meta] of Object.entries(items)) {
    const required = Math.max(0, Math.floor(finite(meta && meta.e, 0)));
    if (required <= 0) continue;
    const rewardChance = rewardChanceForExchange(gameData, material, desiredElixirName);
    if (rewardChance <= 0) continue;
    for (const monster of Object.keys(monsters)) {
      const materialChance = directDropChance(gameData, monster, material);
      if (materialChance <= 0) continue;
      const killsPerHour = bestMeasuredKillsPerHour(runtime, monster) || fallbackKillsPerHour;
      const desiredPerKill = (materialChance / required) * rewardChance;
      const unitsPerHour = desiredPerKill * killsPerHour;
      const spawn = monsterSpawn(gameData, monster);
      if (unitsPerHour > 0 && spawn) candidates.push({
        kind: 'EXCHANGE_MATERIAL_DROP', monster, material, requiredPerExchange: required,
        exchangeRewardChance: rewardChance, yieldPerKill: desiredPerKill, materialChance,
        killsPerHour, unitsPerHour, expectedHours: 1 / unitsPerHour, ...spawn
      });
    }
  }

  candidates.sort((a, b) => a.expectedHours - b.expectedHours || b.unitsPerHour - a.unitsPerHour || a.monster.localeCompare(b.monster));
  return candidates[0] || null;
}

function planElixirAcquisition(runtime, ctype, options = {}) {
  const gameData = runtime && runtime.adapter && runtime.adapter.getGameData ? runtime.adapter.getGameData() || {} : {};
  const desired = preferredAcquisitionElixir(gameData, ctype);
  if (!desired) return null;
  const source = bestFarmSource(runtime, desired.name, options);
  if (!source) return { desired, farm: null, worthwhile: false, reason: 'NO_KNOWN_FARM_SOURCE' };
  const maxFarmHours = Math.max(0.25, finite(options.maxFarmHours, desired.durationHours));
  const utilityPerFarmHour = desired.totalUtility / Math.max(0.01, source.expectedHours);
  const minUtilityPerFarmHour = Math.max(0.1, finite(options.minUtilityPerFarmHour, 4));
  const worthwhile = source.expectedHours <= maxFarmHours && utilityPerFarmHour >= minUtilityPerFarmHour;
  return {
    desired,
    farm: source,
    worthwhile,
    reason: worthwhile ? 'EXPECTED_BUFF_UTILITY_JUSTIFIES_FARM_TIME' : 'FARM_TIME_EXCEEDS_ELIXIR_UTILITY',
    maxFarmHours,
    utilityPerFarmHour,
    minUtilityPerFarmHour
  };
}

module.exports = {
  PRIMARY_STAT,
  primaryStatFor,
  elixirCandidates,
  preferredAcquisitionElixir,
  bestOwnedElixir,
  activeElixir,
  flattenDropTable,
  rewardChanceForExchange,
  directDropChance,
  monsterSpawn,
  bestFarmSource,
  planElixirAcquisition
};
