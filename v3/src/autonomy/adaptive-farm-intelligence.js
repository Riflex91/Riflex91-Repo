'use strict';

const { FarmAreaPressureHotfix, areaKey } = require('../farmer/farm-area-pressure-hotfix');

const PATCH = Symbol.for('AIO_V3_ALPHA20_16_ADAPTIVE_FARM_INTELLIGENCE');
const STORAGE_KEY = 'aio_v3_farm_intelligence_v2';
const MAX_HISTORY = 96;

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
function average(rows, key) { return rows.length ? rows.reduce((sum, row) => sum + finite(row[key]), 0) / rows.length : 0; }

function storageFor(instance) {
  const root = instance.runtime && instance.runtime.root;
  const parent = root && root.parent || root;
  return root && root.localStorage || parent && parent.localStorage || null;
}

function serverHourKey(instance) {
  const root = instance.runtime && instance.runtime.root;
  const parent = root && root.parent || root;
  const region = String(root && root.server_region || parent && parent.server_region || 'unknown');
  const server = String(root && root.server_identifier || parent && parent.server_identifier || 'unknown');
  const hour = new Date(instance.now()).getUTCHours();
  return `${region}:${server}:utc${String(hour).padStart(2, '0')}`;
}

function ensure(instance) {
  if (instance.__adaptiveFarmIntel) return instance.__adaptiveFarmIntel;
  const state = {
    area: null,
    previousMonsters: new Map(),
    lastXp: null,
    waitStartedAt: null,
    history: new Map(),
    persistenceBlocked: false,
    persistenceError: null,
    persistenceWrites: 0,
    persistenceFailures: 0,
    loaded: false,
    lastPersistAt: -Infinity
  };
  instance.__adaptiveFarmIntel = state;
  loadHistory(instance, state);
  return state;
}

function loadHistory(instance, state) {
  if (state.loaded) return;
  state.loaded = true;
  const storage = storageFor(instance);
  if (!storage || typeof storage.getItem !== 'function') return;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    for (const row of Array.isArray(parsed && parsed.rows) ? parsed.rows.slice(0, MAX_HISTORY) : []) {
      if (row && row.key) state.history.set(String(row.key), row);
    }
  } catch (_) {}
}

function persistHistory(instance, state) {
  if (state.persistenceBlocked || instance.now() - state.lastPersistAt < 30000) return false;
  const storage = storageFor(instance);
  if (!storage || typeof storage.setItem !== 'function') return false;
  state.lastPersistAt = instance.now();
  try {
    const rows = [...state.history.values()].sort((a, b) => finite(b.updatedAt) - finite(a.updatedAt)).slice(0, MAX_HISTORY);
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, rows }));
    state.persistenceWrites += 1;
    return true;
  } catch (error) {
    state.persistenceBlocked = true;
    state.persistenceFailures += 1;
    state.persistenceError = String(error && error.message || error || 'storage write failed').slice(0, 180);
    if (typeof instance._event === 'function') instance._event('FARM_INTELLIGENCE_PERSISTENCE_BLOCKED', 'warn', 'STORAGE_WRITE_FAILED_SESSION_BLOCKED', { message: state.persistenceError });
    return false;
  }
}

function updateHistory(instance, evaluation) {
  if (!evaluation || !evaluation.key) return;
  const state = ensure(instance);
  const key = `${serverHourKey(instance)}:${evaluation.key}`;
  const prior = state.history.get(key) || { key, areaKey: evaluation.key, serverHour: serverHourKey(instance), visits: 0, overpopulation: 0, starvation: 0 };
  const visits = finite(prior.visits) + 1;
  const blend = (oldValue, next) => visits <= 1 ? finite(next) : finite(oldValue) * 0.75 + finite(next) * 0.25;
  const row = {
    ...prior, visits, updatedAt: instance.now(),
    killsPerMin: blend(prior.killsPerMin, evaluation.killsPerMin),
    xpPerMin: blend(prior.xpPerMin, evaluation.xpPerMin),
    spawnRatePerMin: blend(prior.spawnRatePerMin, evaluation.spawnRatePerMin),
    monsterUptimeRatio: blend(prior.monsterUptimeRatio, evaluation.monsterUptimeRatio),
    averageWaitMs: blend(prior.averageWaitMs, evaluation.averageWaitMs),
    contestedLossRatio: blend(prior.contestedLossRatio, evaluation.contestedLossRatio),
    overpopulation: finite(prior.overpopulation) + (evaluation.classification === 'AREA_OVERPOPULATED' ? 1 : 0),
    starvation: finite(prior.starvation) + (evaluation.classification === 'AREA_SPAWN_STARVED' ? 1 : 0)
  };
  state.history.set(key, row);
  if (state.history.size > MAX_HISTORY) {
    const oldest = [...state.history.values()].sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt))[0];
    if (oldest) state.history.delete(oldest.key);
  }
  persistHistory(instance, state);
}

function empiricalBonus(instance, row) {
  const state = ensure(instance);
  const exact = state.history.get(`${serverHourKey(instance)}:${areaKey(row)}`);
  if (!exact || finite(exact.visits) < 1) return 0;
  const productive = clamp(finite(exact.killsPerMin) / 8, 0, 1) * 0.04 + clamp(finite(exact.xpPerMin) / 5000, 0, 1) * 0.04;
  const waiting = clamp(finite(exact.averageWaitMs) / 20000, 0, 1) * 0.04;
  const contested = clamp(finite(exact.contestedLossRatio), 0, 1) * 0.05;
  return clamp(productive - waiting - contested, -0.08, 0.08);
}

function patchAdaptiveFarmIntelligence() {
  const proto = FarmAreaPressureHotfix && FarmAreaPressureHotfix.prototype;
  if (!proto || proto[PATCH]) return false;
  Object.defineProperty(proto, PATCH, { value: true, enumerable: false });
  const baseInstall = proto.install;
  const baseResetForArea = proto._resetForArea;
  const baseSample = proto._sample;
  const baseEvaluate = proto._evaluate;
  const baseStatus = proto.status;

  proto.install = function alpha2016Install() {
    const result = baseInstall.apply(this, arguments);
    const state = ensure(this);
    this.config.contestedLossThreshold = 0.30;
    this.config.minSpawnRatePerMin = 2.5;
    this.config.maxAverageWaitMs = 9000;
    this.config.minKillsPerMin = 1.5;
    if (!this.planner.__adaptiveFarmIntelRankInstalled) {
      const pressureRank = this.planner.rank.bind(this.planner);
      this.planner.rank = (...args) => {
        const rows = pressureRank(...args) || [];
        return rows.map((row) => ({ ...row, empiricalFarmBonus: empiricalBonus(this, row), score: finite(row.score) + empiricalBonus(this, row) }))
          .sort((a, b) => finite(b.score) - finite(a.score));
      };
      this.planner.__adaptiveFarmIntelRankInstalled = true;
    }
    state.area = null;
    return result;
  };

  proto._resetForArea = function alpha2016Reset(key) {
    const result = baseResetForArea.call(this, key);
    const state = ensure(this);
    state.area = key;
    state.previousMonsters = new Map();
    state.lastXp = null;
    state.waitStartedAt = null;
    return result;
  };

  proto._sample = function alpha2016Sample(snapshot, plan) {
    const base = baseSample.call(this, snapshot, plan);
    const state = ensure(this);
    const trusted = this._trustedNames();
    const now = this.now();
    const monsters = (snapshot.entities || []).filter((entity) => entity && entity.mtype === plan.monster && !entity.dead && finite(entity.hp, 1) > 0 && this._nearPlan(entity, plan));
    const current = new Map(monsters.map((entity) => [String(entity.id), entity]));
    let spawnAppearances = 0;
    let partyKills = 0;
    let contestedLosses = 0;
    for (const id of current.keys()) if (!state.previousMonsters.has(id)) spawnAppearances += 1;
    for (const [id, old] of state.previousMonsters.entries()) {
      if (current.has(id)) continue;
      const partyOwned = trusted.has(String(old && old.target || '')) || String(this.runtime.farmer && this.runtime.farmer.targetId || '') === id || String(snapshot.character && snapshot.character.target || '') === id;
      if (partyOwned) partyKills += 1;
      else if (base.foreignPlayers > 0) contestedLosses += 1;
    }
    state.previousMonsters = current;
    const xp = finite(snapshot.character && snapshot.character.xp, null);
    const xpDelta = state.lastXp == null || xp == null ? 0 : Math.max(0, xp - state.lastXp);
    state.lastXp = xp;
    const hasOpportunity = base.targetActive || base.matchingMonsters > 0;
    let waitCompletedMs = 0;
    if (!hasOpportunity && state.waitStartedAt == null) state.waitStartedAt = now;
    if (hasOpportunity && state.waitStartedAt != null) {
      waitCompletedMs = Math.max(0, now - state.waitStartedAt);
      state.waitStartedAt = null;
    }
    return { ...base, xpDelta, spawnAppearances, partyKills, contestedLosses, waitCompletedMs, waitCompleted: waitCompletedMs > 0 ? 1 : 0, currentWaitMs: state.waitStartedAt == null ? 0 : now - state.waitStartedAt };
  };

  proto._evaluate = function alpha2016Evaluate(plan) {
    const basic = baseEvaluate.call(this, plan);
    if (!basic) return null;
    const rows = this.samples.filter((row) => row.areaKey === basic.key);
    const elapsedMin = Math.max(1 / 60, (finite(basic.dwellMs) || this.config.windowMs) / 60000);
    const monsterUptimeRatio = rows.filter((row) => finite(row.matchingMonsters) > 0).length / Math.max(1, rows.length);
    const noTargetRatio = rows.filter((row) => !row.targetActive).length / Math.max(1, rows.length);
    const killsPerMin = rows.reduce((sum, row) => sum + finite(row.partyKills), 0) / elapsedMin;
    const xpPerMin = rows.reduce((sum, row) => sum + finite(row.xpDelta), 0) / elapsedMin;
    const spawnRatePerMin = rows.reduce((sum, row) => sum + finite(row.spawnAppearances), 0) / elapsedMin;
    const contested = rows.reduce((sum, row) => sum + finite(row.contestedLosses), 0);
    const partyKills = rows.reduce((sum, row) => sum + finite(row.partyKills), 0);
    const contestedLossRatio = contested / Math.max(1, contested + partyKills);
    const completedWaits = rows.reduce((sum, row) => sum + finite(row.waitCompleted), 0);
    const totalWait = rows.reduce((sum, row) => sum + finite(row.waitCompletedMs), 0);
    const currentWait = rows.length ? finite(rows[rows.length - 1].currentWaitMs) : 0;
    const averageWaitMs = completedWaits ? totalWait / completedWaits : currentWait;
    const weak = noTargetRatio >= 0.55 && (killsPerMin < this.config.minKillsPerMin || averageWaitMs >= this.config.maxAverageWaitMs || monsterUptimeRatio < 0.25);
    const enoughTheoreticalSpawn = spawnRatePerMin >= this.config.minSpawnRatePerMin || monsterUptimeRatio >= 0.20;
    const competition = basic.foreignPresenceRatio >= 0.25 || contestedLossRatio >= this.config.contestedLossThreshold;
    const legacyOverpopulationEvidence = basic.pressured && basic.classification === 'AREA_OVERPOPULATED';
    let classification = 'AREA_HEALTHY';
    if (weak && competition && (enoughTheoreticalSpawn || legacyOverpopulationEvidence)) classification = 'AREA_OVERPOPULATED';
    else if (weak && (!enoughTheoreticalSpawn || monsterUptimeRatio < 0.18)) classification = 'AREA_SPAWN_STARVED';
    else if (basic.pressured) classification = basic.classification;
    const evaluation = { ...basic, monsterUptimeRatio, noTargetRatio, killsPerMin, xpPerMin, spawnRatePerMin, contestedLossRatio, averageWaitMs, averageForeignPlayers: average(rows, 'foreignPlayers'), pressured: classification !== 'AREA_HEALTHY', classification, serverHour: serverHourKey(this) };
    this.lastEvaluation = evaluation;
    updateHistory(this, evaluation);
    return evaluation;
  };

  proto.status = function alpha2016Status() {
    const base = baseStatus.call(this); const state = ensure(this);
    return { ...base, schemaVersion: 2, mode: 'adaptive-farm-intelligence-v2', alpha20_16: { leaderOnlyAreaAuthority: true, partyWideReplan: true, metrics: ['monsterUptimeRatio','noTargetRatio','killsPerMin','xpPerMin','spawnRatePerMin','foreignPresenceRatio','contestedLossRatio','averageWaitMs'], classification: ['AREA_OVERPOPULATED','AREA_SPAWN_STARVED','AREA_HEALTHY'], serverHour: serverHourKey(this), learnedAreas: state.history.size, persistence: { storageKey: STORAGE_KEY, blocked: state.persistenceBlocked, error: state.persistenceError, writes: state.persistenceWrites, failures: state.persistenceFailures }, lastEvaluation: this.lastEvaluation } };
  };

  return true;
}

module.exports = { STORAGE_KEY, MAX_HISTORY, empiricalBonus, patchAdaptiveFarmIntelligence };
