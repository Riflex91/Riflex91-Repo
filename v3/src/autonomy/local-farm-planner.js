'use strict';

const { finite } = require('../core/numeric');
const { distance } = require('../core/geometry');

const NON_FARM_MONSTER_TYPES = new Set(['target']);

function spawnType(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) {
    const value = entry.find((item) => typeof item === 'string');
    return value || null;
  }
  if (typeof entry === 'object') return entry.type || entry.mtype || entry.monster || entry.id || null;
  return null;
}

function boundaryCenter(boundary) {
  if (!boundary) return null;
  if (Array.isArray(boundary)) {
    const nums = boundary.map(Number).filter(Number.isFinite);
    if (nums.length >= 4) {
      return { x: (nums[0] + nums[2]) / 2, y: (nums[1] + nums[3]) / 2 };
    }
    if (nums.length >= 2) return { x: nums[0], y: nums[1] };
  }
  if (typeof boundary === 'object') {
    const x1 = finite(boundary.x1 != null ? boundary.x1 : boundary.left, null);
    const y1 = finite(boundary.y1 != null ? boundary.y1 : boundary.top, null);
    const x2 = finite(boundary.x2 != null ? boundary.x2 : boundary.right, null);
    const y2 = finite(boundary.y2 != null ? boundary.y2 : boundary.bottom, null);
    if (x1 != null && y1 != null && x2 != null && y2 != null) return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    const x = finite(boundary.x, null);
    const y = finite(boundary.y, null);
    if (x != null && y != null) return { x, y };
  }
  return null;
}

function spawnCenter(entry) {
  if (!entry || typeof entry === 'string') return null;
  if (Array.isArray(entry)) {
    if (entry.length >= 5 && typeof entry[0] === 'string') return boundaryCenter(entry.slice(1));
    return boundaryCenter(entry);
  }
  if (typeof entry !== 'object') return null;
  const direct = boundaryCenter(entry.boundary || entry.bound || entry.bounds || entry.area);
  if (direct) return direct;
  const x = finite(entry.x, null);
  const y = finite(entry.y, null);
  if (x != null && y != null) return { x, y };
  return null;
}

function spawnCountHint(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 1;
  for (const key of ['count', 'quantity', 'num', 'max_count', 'maxCount', 'population']) {
    const value = Number(entry[key]);
    if (Number.isFinite(value) && value > 0) return Math.max(1, Math.floor(value));
  }
  return 1;
}

function aoeContext(party) {
  const raw = party && party.aoe || {};
  const mode = String(raw.combatMode || raw.mode || 'smart_auto');
  const configured = raw.configured === true && mode !== 'single_target';
  const hardCapacity = Math.max(1, Math.min(12, Math.floor(Number(raw.hardCapacity) || 1)));
  const desiredPullSize = Math.max(1, Math.min(hardCapacity, Math.floor(Number(raw.desiredPullSize) || Math.min(hardCapacity, 2))));
  return { configured, mode, hardCapacity, desiredPullSize };
}

function contentDisposition(world, mtype) {
  if (!world || typeof world.fact !== 'function' || !mtype) return null;
  try {
    return world.fact('monster-policy', String(mtype), 'contentSafetyDisposition').value || null;
  } catch (_) {
    return null;
  }
}

function isApprovedDisposition(value) {
  return value === 'APPROVED' || value === 'LEGACY_ALLOWED';
}

function isFarmableMonsterType(mtype) {
  const normalized = String(mtype == null ? '' : mtype).trim().toLowerCase();
  return !!normalized && !NON_FARM_MONSTER_TYPES.has(normalized);
}

class LocalFarmPlanner {
  constructor(options = {}) {
    this.log = options.log || null;
    this.minExpectedImprovement = Math.max(0.05, Math.min(1, Number(options.minExpectedImprovement) || 0.2));
    this.maxCandidates = Math.max(5, Math.min(100, Number(options.maxCandidates) || 40));
    this.aoeClusterRadius = Math.max(120, Math.min(900, Number(options.aoeClusterRadius) || 420));
    this.aoePreferredBonus = Math.max(0, Math.min(0.30, Number(options.aoePreferredBonus) || 0.14));
    this.aoeSmartBonus = Math.max(0, Math.min(0.20, Number(options.aoeSmartBonus) || 0.08));
  }

  spawnCandidates(snapshot, gameData, world, party) {
    if (!snapshot || !snapshot.character) return [];
    const mapName = snapshot.character.map;
    const mapData = gameData && gameData.maps && gameData.maps[mapName];
    const raw = mapData && mapData.monsters;
    if (!raw) return [];
    const entries = Array.isArray(raw) ? raw : Object.values(raw);
    const descriptors = entries.map((entry, index) => ({ entry, index, mtype: spawnType(entry), center: spawnCenter(entry), count: spawnCountHint(entry) }));
    const monsterData = gameData && gameData.monsters || {};
    const fingerprint = party && party.fingerprint || null;
    const rows = [];

    for (let index = 0; index < entries.length && rows.length < this.maxCandidates; index += 1) {
      const entry = entries[index];
      const mtype = spawnType(entry);
      const center = spawnCenter(entry);
      if (!mtype || !center || !isFarmableMonsterType(mtype)) continue;
      const disposition = contentDisposition(world, mtype);
      if (!isApprovedDisposition(disposition)) continue;
      const learned = world && typeof world.performanceFor === 'function'
        ? world.performanceFor(mtype, fingerprint)
        : null;
      const metadata = monsterData[mtype] || {};
      const livePackCount = (snapshot.entities || []).filter((row) => row && row.mtype === mtype && !row.dead && Number(row.hp == null ? 1 : row.hp) > 0 && distance(row, center) <= this.aoeClusterRadius).length;
      const clusterRows = descriptors.filter((row) => row.index !== index && row.mtype === mtype && row.center && distance(row.center, center) <= this.aoeClusterRadius);
      const clusterSpawnCount = spawnCountHint(entry) + clusterRows.reduce((sum, row) => sum + Math.max(1, row.count), 0);
      const packPotential = Math.max(1, livePackCount, clusterSpawnCount);
      const aoe = aoeContext(party);
      const fit = aoe.configured ? Math.max(0, Math.min(1, packPotential / Math.max(1, aoe.desiredPullSize))) : 0;
      const density = aoe.configured ? Math.max(0, Math.min(1, packPotential / Math.max(1, aoe.hardCapacity))) : 0;
      const baseAoeBonus = aoe.mode === 'aoe_preferred' ? this.aoePreferredBonus : this.aoeSmartBonus;
      const aoeFarmBonus = aoe.configured
        ? Math.max(-0.05, baseAoeBonus * (fit * 0.65 + density * 0.35) - (packPotential < 2 && aoe.mode === 'aoe_preferred' ? 0.04 : 0))
        : 0;
      const travel = distance(snapshot.character, center);
      const speed = Math.max(1, Number(snapshot.character.speed) || 40);
      rows.push({
        id: `${mapName}:${mtype}:${index}`,
        monster: String(mtype),
        map: mapName,
        x: center.x,
        y: center.y,
        spawnIndex: index,
        contentDisposition: disposition,
        xpPerHour: learned ? learned.xpPerHour : Math.max(0, Number(metadata.xp) || 0) * 60,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.1,
        travelSeconds: Number.isFinite(travel) ? travel / speed : 120,
        source: learned ? 'measured-spawn' : 'known-spawn-metadata',
        packPotential,
        livePackCount,
        spawnClusterCount: clusterRows.length + 1,
        aoeFarmFit: Number(fit.toFixed(4)),
        aoeFarmBonus: Number(aoeFarmBonus.toFixed(5)),
        aoePlanning: aoe
      });
    }
    return rows;
  }

  rank(snapshot, gameData, world, party, farmPlanner) {
    const candidates = this.spawnCandidates(snapshot, gameData, world, party);
    if (!candidates.length) return [];
    const ranked = farmPlanner && typeof farmPlanner.rank === 'function'
      ? farmPlanner.rank(candidates, {
          character: snapshot.character && snapshot.character.name || null,
          partyFingerprint: party && party.fingerprint || null
        })
      : candidates.map((row) => ({ ...row, score: Number(row.score) || 0 }));
    return ranked.map((row) => {
      const bonus = Number(row.aoeFarmBonus) || 0;
      return {
        ...row,
        baseScore: Number(row.score) || 0,
        score: Math.max(0, (Number(row.score) || 0) + bonus),
        scoring: { ...(row.scoring || {}), aoeFarmBonus: bonus, aoeFarmFit: Number(row.aoeFarmFit) || 0 }
      };
    }).sort((a, b) => b.score - a.score || b.packPotential - a.packPotential || b.xpPerHour - a.xpPerHour || a.travelSeconds - b.travelSeconds);
  }

  materiallyBetter(current, candidate) {
    if (!current || !candidate) return true;
    const currentScore = Math.max(0, Number(current.score) || 0);
    const nextScore = Math.max(0, Number(candidate.score) || 0);
    if (currentScore <= 0) return nextScore > 0;
    return nextScore >= currentScore * (1 + this.minExpectedImprovement);
  }
}

module.exports = {
  LocalFarmPlanner,
  NON_FARM_MONSTER_TYPES,
  spawnType,
  spawnCenter,
  spawnCountHint,
  aoeContext,
  contentDisposition,
  isApprovedDisposition,
  isFarmableMonsterType
};
