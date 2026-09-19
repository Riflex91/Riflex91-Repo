'use strict';

const { directDropChance, monsterSpawn } = require('./elixir-policy');
const { contentDisposition, isApprovedDisposition } = require('../autonomy/local-farm-planner');

const PRODUCTION_MATERIAL_ACQUISITION_MODE = 'team-production-material-acquisition-v1';
const DEFAULT_MAX_TEAM_FARM_HOURS = 12;
const DEFAULT_FALLBACK_KILLS_PER_HOUR = 20;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function currentPartyFingerprintKey(runtime) {
  const raw = runtime && runtime.currentPartyFingerprint;
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw.key === 'string') return raw.key;
  return null;
}

function bestMeasuredKillsPerHour(runtime, monster) {
  const world = runtime && runtime.world;
  if (!world) return null;
  const fingerprint = currentPartyFingerprintKey(runtime);
  if (fingerprint && typeof world.performanceFor === 'function') {
    try {
      const current = world.performanceFor(monster, fingerprint);
      if (current && finite(current.seconds, 0) >= 60 && finite(current.killsPerHour, 0) > 0) return finite(current.killsPerHour, 0);
    } catch (_) {}
  }
  if (!(world.performance instanceof Map)) return null;
  const rows = [...world.performance.values()]
    .filter((row) => row && row.monster === monster && finite(row.seconds, 0) >= 60)
    .map((row) => {
      const hours = finite(row.seconds, 0) / 3600;
      return { kph: hours > 0 ? finite(row.kills, 0) / hours : 0, seconds: finite(row.seconds, 0) };
    })
    .filter((row) => row.kph > 0)
    .sort((a, b) => b.seconds - a.seconds || b.kph - a.kph);
  return rows.length ? rows[0].kph : null;
}

function partyHeldQuantity(runtime, name, level = 0) {
  const registry = runtime && runtime.characterRegistry;
  let status = null;
  try { status = registry && typeof registry.status === 'function' ? registry.status() : null; } catch (_) { status = null; }
  const rows = Array.isArray(status && status.characters) ? status.characters : [];
  let total = 0;
  for (const character of rows) {
    if (!character || String(character.ctype || character.type || '').toLowerCase() === 'merchant') continue;
    const inventory = Array.isArray(character.inventory) ? character.inventory : Array.isArray(character.items) ? character.items : [];
    for (const item of inventory) {
      if (!item || String(item.name || '') !== String(name || '')) continue;
      if (Math.max(0, Math.floor(finite(item.level, 0))) !== Math.max(0, Math.floor(finite(level, 0)))) continue;
      total += Math.max(1, Math.floor(finite(item.q, 1)));
    }
  }
  return total;
}

function sourceSafe(runtime, monster, spawn) {
  if (!runtime || !monster || !spawn || !spawn.map) return false;
  try {
    if (!isApprovedDisposition(contentDisposition(runtime.world, monster))) return false;
  } catch (_) { return false; }
  const drift = runtime.contentDrift;
  if (drift && typeof drift.requiresRevalidation === 'function') {
    try {
      if (drift.requiresRevalidation('monsters', monster)) return false;
      if (drift.requiresRevalidation('maps', spawn.map)) return false;
    } catch (_) { return false; }
  }
  return true;
}

function bestDirectMaterialFarmSource(runtime, material, quantity, options = {}) {
  const name = String(material == null ? '' : material).trim();
  const need = Math.max(1, Math.floor(finite(quantity, 1)));
  if (!name) return null;
  const gameData = runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
    ? runtime.adapter.getGameData() || {}
    : {};
  const monsters = gameData && gameData.drops && gameData.drops.monsters || {};
  const fallbackKillsPerHour = Math.max(1, finite(options.fallbackKillsPerHour, DEFAULT_FALLBACK_KILLS_PER_HOUR));
  const candidates = [];

  for (const monster of Object.keys(monsters)) {
    const yieldPerKill = directDropChance(gameData, monster, name);
    if (!(yieldPerKill > 0)) continue;
    const spawn = monsterSpawn(gameData, monster);
    if (!spawn || !sourceSafe(runtime, monster, spawn)) continue;
    const measuredKillsPerHour = bestMeasuredKillsPerHour(runtime, monster);
    const killsPerHour = measuredKillsPerHour || fallbackKillsPerHour;
    const unitsPerHour = yieldPerKill * killsPerHour;
    if (!(unitsPerHour > 0)) continue;
    candidates.push({
      kind: 'DIRECT_MATERIAL_DROP',
      material: name,
      quantity: need,
      monster,
      yieldPerKill,
      killsPerHour,
      measuredKillsPerHour,
      evidence: measuredKillsPerHour ? 'MEASURED_KILLS_PER_HOUR' : 'CONSERVATIVE_FALLBACK_KILLS_PER_HOUR',
      unitsPerHour,
      expectedHours: need / unitsPerHour,
      ...spawn
    });
  }

  candidates.sort((a, b) => a.expectedHours - b.expectedHours
    || (b.measuredKillsPerHour != null ? 1 : 0) - (a.measuredKillsPerHour != null ? 1 : 0)
    || b.unitsPerHour - a.unitsPerHour
    || a.monster.localeCompare(b.monster));
  return candidates[0] || null;
}

function aggregateFarmSteps(steps = []) {
  const grouped = new Map();
  for (const step of Array.isArray(steps) ? steps : []) {
    if (!step || String(step.kind || '') !== 'FARM_REQUIRED' || !step.name) continue;
    const level = Math.max(0, Math.floor(finite(step.level, 0)));
    const key = `${String(step.name)}|${level}`;
    const current = grouped.get(key) || { name: String(step.name), level, quantity: 0 };
    current.quantity += Math.max(1, Math.floor(finite(step.quantity, 1)));
    grouped.set(key, current);
  }
  return [...grouped.values()];
}

function estimateBlockedProductionCandidate(runtime, blockedCandidate, options = {}) {
  if (!blockedCandidate || !blockedCandidate.candidate) return { eligible: false, reason: 'CANDIDATE_UNAVAILABLE' };
  const materialSteps = aggregateFarmSteps(blockedCandidate.steps);
  if (!materialSteps.length) return { eligible: false, reason: 'NO_FARM_REQUIRED_MATERIALS' };
  const nonMaterialBlockers = (blockedCandidate.blockers || []).filter((row) => row && row.reason !== 'MATERIAL_FARM_REQUIRED');
  if (nonMaterialBlockers.length) return { eligible: false, reason: 'NON_MATERIAL_BLOCKER', blockers: clone(nonMaterialBlockers) };

  const materials = [];
  for (const step of materialSteps) {
    if (step.level !== 0) {
      return { eligible: false, reason: 'LEVELED_MATERIAL_REQUIRES_PROGRESSION', material: clone(step) };
    }
    const alreadyOnFarmers = partyHeldQuantity(runtime, step.name, step.level);
    const remainingToFarm = Math.max(0, step.quantity - alreadyOnFarmers);
    if (remainingToFarm <= 0) {
      materials.push({ ...clone(step), alreadyOnFarmers, remainingToFarm: 0, source: null, awaitingTransfer: true });
      continue;
    }
    const source = bestDirectMaterialFarmSource(runtime, step.name, remainingToFarm, options);
    if (!source) return { eligible: false, reason: 'NO_SAFE_DIRECT_FARM_SOURCE', material: { ...clone(step), alreadyOnFarmers, remainingToFarm } };
    materials.push({ ...clone(step), alreadyOnFarmers, remainingToFarm, source });
  }

  if (materials.every((row) => row.awaitingTransfer === true)) {
    return { eligible: false, reason: 'MATERIAL_ALREADY_HELD_BY_FARMERS_AWAIT_TRANSFER', materials };
  }

  const totalExpectedHours = materials.reduce((sum, row) => sum + (row.source ? finite(row.source.expectedHours, Infinity) : 0), 0);
  if (!Number.isFinite(totalExpectedHours)) return { eligible: false, reason: 'FARM_TIME_ESTIMATE_UNAVAILABLE', materials };
  const maxTeamFarmHours = Math.max(0.25, finite(options.maxTeamFarmHours, DEFAULT_MAX_TEAM_FARM_HOURS));
  const longPath = totalExpectedHours > maxTeamFarmHours;

  const target = blockedCandidate.candidate;
  const benefit = Math.max(
    0.001,
    finite(target.improvement, 0)
      + Math.max(0, finite(target.survivalImprovement, 0))
      + Math.max(0, finite(target.speedImprovement, 0)) * 10
  );
  const utilityPerFarmHour = benefit / Math.max(0.01, totalExpectedHours);
  const nextMaterial = materials.filter((row) => row.source).sort((a, b) =>
    finite(b.source && b.source.expectedHours, 0) - finite(a.source && a.source.expectedHours, 0)
    || a.name.localeCompare(b.name)
  )[0];

  return {
    eligible: true,
    reason: longPath ? 'LONG_TEAM_FARM_PATH_DEPRIORITIZED' : 'TEAM_FARM_PATH_WITHIN_PRIORITY_BUDGET',
    target: clone(target),
    materials,
    nextMaterial,
    totalExpectedHours,
    maxTeamFarmHours,
    longPath,
    priorityTier: longPath ? 1 : 0,
    benefit,
    utilityPerFarmHour
  };
}

function chooseProductionTeamFarmObjective(runtime, blockedCandidates = [], options = {}) {
  const evaluated = (Array.isArray(blockedCandidates) ? blockedCandidates : [])
    .map((candidate) => ({ candidate, estimate: estimateBlockedProductionCandidate(runtime, candidate, options) }));
  const eligible = evaluated
    .filter((row) => row.estimate && row.estimate.eligible)
    .sort((a, b) => finite(a.estimate.priorityTier, 0) - finite(b.estimate.priorityTier, 0)
      || b.estimate.utilityPerFarmHour - a.estimate.utilityPerFarmHour
      || a.estimate.totalExpectedHours - b.estimate.totalExpectedHours
      || finite(b.estimate.benefit, 0) - finite(a.estimate.benefit, 0)
      || String(a.estimate.target && a.estimate.target.output || '').localeCompare(String(b.estimate.target && b.estimate.target.output || '')));
  return {
    selected: eligible.length ? clone(eligible[0].estimate) : null,
    evaluated: evaluated.map((row) => ({
      output: row.candidate && row.candidate.candidate && row.candidate.candidate.output || null,
      recipient: row.candidate && row.candidate.candidate && row.candidate.candidate.recipient || null,
      eligible: row.estimate && row.estimate.eligible === true,
      reason: row.estimate && row.estimate.reason || 'UNKNOWN',
      totalExpectedHours: row.estimate && Number.isFinite(row.estimate.totalExpectedHours) ? row.estimate.totalExpectedHours : null,
      maxTeamFarmHours: row.estimate && row.estimate.maxTeamFarmHours || Math.max(0.25, finite(options.maxTeamFarmHours, DEFAULT_MAX_TEAM_FARM_HOURS)),
      longPath: row.estimate && row.estimate.longPath === true,
      priorityTier: row.estimate && Number.isFinite(row.estimate.priorityTier) ? row.estimate.priorityTier : null,
      utilityPerFarmHour: row.estimate && Number.isFinite(row.estimate.utilityPerFarmHour) ? row.estimate.utilityPerFarmHour : null
    }))
  };
}

module.exports = {
  PRODUCTION_MATERIAL_ACQUISITION_MODE,
  DEFAULT_MAX_TEAM_FARM_HOURS,
  DEFAULT_FALLBACK_KILLS_PER_HOUR,
  currentPartyFingerprintKey,
  bestMeasuredKillsPerHour,
  partyHeldQuantity,
  bestDirectMaterialFarmSource,
  aggregateFarmSteps,
  estimateBlockedProductionCandidate,
  chooseProductionTeamFarmObjective
};
