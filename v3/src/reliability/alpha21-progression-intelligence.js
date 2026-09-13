'use strict';

const { spawnType, spawnCenter, contentDisposition, isApprovedDisposition, isFarmableMonsterType } = require('../autonomy/local-farm-planner');

const ALPHA21_PROGRESSION_MODE = 'alpha21-live-progression-intelligence-v2';
const PROGRESSION_RECEIVER = '__AIO_V3_ALPHA21_PROGRESSION';
const SHARED_OBJECTIVE = '__AIO_V3_ALPHA21_OBJECTIVE';

const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp01 = (v) => Math.max(0, Math.min(1, finite(v)));
const clone = (v) => { try { return v == null ? v : JSON.parse(JSON.stringify(v)); } catch (_) { return null; } };

function monsterDifficulty(meta = {}) {
  return Math.pow(Math.max(1, finite(meta.hp, 1)), 0.58) *
    Math.pow(Math.max(1, finite(meta.attack, 1)), 0.32) *
    Math.pow(Math.max(0.2, finite(meta.frequency, 1)), 0.10);
}

function relativeMonsterDifficulty(current = {}, candidate = {}) {
  return Math.max(0.15, Math.min(6, monsterDifficulty(candidate) / Math.max(0.001, monsterDifficulty(current))));
}

function readinessBottleneck(scores = {}) {
  const rows = [['DPS', finite(scores.dps, 1)], ['SURVIVAL', finite(scores.survival, 1)], ['SUSTAIN', finite(scores.sustain, 1)]]
    .sort((a, b) => a[1] - b[1]);
  return rows[0][1] >= 0.82 ? 'NONE' : rows[0][0];
}

function evaluateProgressionReadiness(input = {}, options = {}) {
  const current = input.currentProfile || {};
  const candidate = input.candidateProfile || null;
  const currentMeta = input.currentMeta || {};
  const candidateMeta = input.candidateMeta || {};
  const minWindows = Math.max(2, Math.floor(finite(options.minWindows, 3)));
  const minConfidence = Math.max(0.05, finite(options.minConfidence, 0.18));
  const maxDeaths = Math.max(0.05, finite(options.maxDeathsPerHour, 0.25));
  const softTtk = Math.max(5, finite(options.softKillSeconds, 30));
  const hardTtk = Math.max(softTtk + 1, finite(options.hardKillSeconds, 75));
  const difficulty = relativeMonsterDifficulty(currentMeta, candidateMeta);
  const historical = !!candidate && finite(candidate.windows, 0) >= Math.max(2, minWindows - 1) && clamp01(candidate.confidence) >= minConfidence;
  const currentTtk = finite(current.killsPerHour, 0) > 0 ? 3600 / finite(current.killsPerHour) : Infinity;
  const projectedTtk = historical && finite(candidate.killsPerHour, 0) > 0 ? 3600 / finite(candidate.killsPerHour) : currentTtk * difficulty;
  const deaths = historical ? Math.max(0, finite(candidate.deathsPerHour)) : Math.max(0, finite(current.deathsPerHour)) * Math.max(0.7, difficulty);
  const damage = historical ? Math.max(0, finite(candidate.damageTakenPerHour)) : Math.max(0, finite(current.damageTakenPerHour)) * Math.max(0.7, difficulty);
  const potions = historical ? Math.max(0, finite(candidate.potionsPerHour)) : Math.max(0, finite(current.potionsPerHour)) * Math.max(0.7, Math.sqrt(difficulty));
  const hpPoolsPerMinute = damage / Math.max(1, finite(input.teamMaxHp, 1)) / 60;
  const survival = clamp01(1 - (deaths / maxDeaths) * 0.68 - Math.min(1, hpPoolsPerMinute / 2) * 0.32);
  const sustain = clamp01(1 - Math.min(1, potions / 360) * 0.55 - Math.min(1, hpPoolsPerMinute / 2.5) * 0.45);
  const dps = !Number.isFinite(projectedTtk) ? 0 : projectedTtk <= softTtk ? 1 : projectedTtk >= hardTtk ? 0 : 1 - (projectedTtk - softTtk) / (hardTtk - softTtk);
  const rewardRatio = Math.max(0, finite(candidateMeta.xp)) / Math.max(1, finite(currentMeta.xp, 1));
  const efficiencyRatio = historical && finite(current.xpPerHour) > 0 && finite(candidate.xpPerHour) > 0
    ? finite(candidate.xpPerHour) / finite(current.xpPerHour)
    : rewardRatio / Math.max(0.25, difficulty);
  const efficiency = clamp01((efficiencyRatio - 0.75) / 0.65);
  const evidenceReady = finite(current.windows) >= minWindows && clamp01(current.confidence) >= minConfidence;
  const evidence = clamp01((finite(current.windows) / minWindows) * 0.45 + clamp01(current.confidence) * 0.55);
  const scores = { dps, survival, sustain, efficiency, evidence };
  const readinessScore = clamp01(dps * 0.31 + survival * 0.31 + sustain * 0.14 + efficiency * 0.14 + evidence * 0.10);
  return {
    ready: evidenceReady && difficulty <= finite(options.maxDifficultyStep, 1.85) && projectedTtk <= hardTtk &&
      deaths <= maxDeaths && survival >= 0.62 && sustain >= 0.52 &&
      efficiencyRatio >= finite(options.minEfficiencyGain, 1.06) && readinessScore >= finite(options.minReadinessScore, 0.70),
    readinessScore,
    bottleneck: readinessBottleneck(scores),
    evidenceReady,
    historicalCandidateReady: historical,
    difficultyRatio: difficulty,
    projectedTtkSeconds: Number.isFinite(projectedTtk) ? projectedTtk : null,
    projectedEfficiencyRatio: efficiencyRatio,
    projectedDeathsPerHour: deaths,
    projectedDamagePoolsPerMinute: hpPoolsPerMinute,
    projectedPotionsPerHour: potions,
    scores
  };
}

function progressionGoalScore(goal, bottleneck) {
  const gain = finite(goal && goal.improvement);
  const survival = finite(goal && goal.survivalImprovement);
  if (bottleneck === 'SURVIVAL') return survival * 3 + gain * 0.65;
  if (bottleneck === 'SUSTAIN') return survival * 2 + gain * 0.85;
  if (bottleneck === 'DPS') return gain * 2.2 + survival * 0.35;
  return gain + survival;
}

function enumerateProgressionCandidates(gameData, world, fingerprint, current, options = {}) {
  if (!current || !current.monster || !world || typeof world.performanceFor !== 'function') return [];
  const monsters = gameData && gameData.monsters || {};
  const maps = gameData && gameData.maps || {};
  const currentProfile = world.performanceFor(current.monster, fingerprint);
  if (!currentProfile || !monsters[current.monster]) return [];
  const rows = [];
  for (const [map, meta] of Object.entries(maps)) {
    const raw = meta && meta.monsters;
    const spawns = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
    for (let i = 0; i < spawns.length; i += 1) {
      const monster = spawnType(spawns[i]);
      const center = spawnCenter(spawns[i]);
      if (!monster || !center || !isFarmableMonsterType(monster) || !monsters[monster]) continue;
      const disposition = contentDisposition(world, monster);
      if (!isApprovedDisposition(disposition)) continue;
      if (map === current.map && monster === current.monster && i === current.spawnIndex) continue;
      const candidateProfile = world.performanceFor(monster, fingerprint);
      const readiness = evaluateProgressionReadiness({
        currentProfile,
        candidateProfile,
        currentMeta: monsters[current.monster],
        candidateMeta: monsters[monster],
        teamMaxHp: options.teamMaxHp
      }, options);
      rows.push({
        id: `${map}:${monster}:${i}`,
        map,
        monster: String(monster),
        spawnIndex: i,
        x: center.x,
        y: center.y,
        progressionDirection: readiness.difficultyRatio > 1.05 ? 'ADVANCE' : readiness.difficultyRatio < 0.92 ? 'EASIER' : 'SIDEGRADE',
        contentDisposition: disposition,
        readiness,
        score: readiness.readinessScore + Math.min(0.35, Math.max(-0.25, (readiness.projectedEfficiencyRatio - 1) * 0.42)) - (map === current.map ? 0 : 0.04)
      });
    }
  }
  return rows.sort((a, b) => Number(b.readiness.ready) - Number(a.readiness.ready) || b.score - a.score || a.id.localeCompare(b.id));
}

class ProgressionIntelligence {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.localFarming || !runtime.localFarming.planner) throw new Error('runtime local farming required');
    this.runtime = runtime;
    this.parent = runtime.root && runtime.root.parent || runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.options = {
      minWindows: Math.max(2, finite(options.minWindows, 3)),
      minConfidence: finite(options.minConfidence, 0.18),
      minReadinessScore: finite(options.minReadinessScore, 0.70),
      minEfficiencyGain: finite(options.minEfficiencyGain, 1.06),
      maxDifficultyStep: finite(options.maxDifficultyStep, 1.85),
      maxDeathsPerHour: finite(options.maxDeathsPerHour, 0.25),
      softKillSeconds: finite(options.softKillSeconds, 30),
      hardKillSeconds: finite(options.hardKillSeconds, 75),
      evaluationIntervalMs: Math.max(5000, finite(options.evaluationIntervalMs, 15000)),
      stableEvaluations: Math.max(2, finite(options.stableEvaluations, 3)),
      switchCooldownMs: Math.max(30000, finite(options.switchCooldownMs, 120000)),
      objectiveTtlMs: Math.max(60000, finite(options.objectiveTtlMs, 300000))
    };
    this.lastEvaluationAt = -Infinity;
    this.lastSwitchAt = -Infinity;
    this.lastEvaluation = null;
    this.lastDecision = null;
    this.objective = null;
    this.candidateKey = null;
    this.candidateStableCount = 0;
    this.receiverInstalled = false;
    this.stats = {
      evaluations: 0,
      evidenceHolds: 0,
      readyDetections: 0,
      promotions: 0,
      sameMapReplans: 0,
      crossMapRecommendations: 0,
      objectivesPublished: 0,
      objectivesReceived: 0,
      gearGoalReorders: 0
    };
    this._installPlannerPreference();
    this._installGearPriority();
    this._installRuntimeHook();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log) this.log.emit({ component: 'alpha21-progression', event, severity, reason, data }); } catch (_) {}
  }

  _team(snapshot) {
    try { return this.runtime.teamCombatCohesionHotfix && this.runtime.teamCombatCohesionHotfix._team(snapshot); } catch (_) { return null; }
  }

  _party(snapshot) {
    try { return this.runtime._partyProfile(snapshot); } catch (_) { return { fingerprint: 'unknown-party' }; }
  }

  _plan() {
    const plan = this.runtime.localFarming.currentPlan;
    return plan && plan.state === 'HOLDING' ? plan : null;
  }

  _busy(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c || c.rip || c.dead || c.target || this.runtime.pendingEmergencyRetreat) return true;
    return (snapshot.entities || []).some((entity) => entity && entity.mtype && !entity.dead && String(entity.target || '') === String(c.name || ''));
  }

  _teamMaxHp(team, snapshot) {
    const total = (team && team.members || []).reduce((sum, member) => sum + Math.max(0, finite(member.max_hp)), 0);
    return total || Math.max(1, finite(snapshot.character.max_hp, 1));
  }

  _freshObjective() {
    if (this.objective && this.objective.expiresAt > this.now()) return this.objective;
    this.objective = null;
    return null;
  }

  _ensureReceiver() {
    if (this.receiverInstalled) return true;
    const transport = this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport;
    if (!transport || typeof transport.installDirectReceiver !== 'function') return false;
    transport.installDirectReceiver(PROGRESSION_RECEIVER, (sender, payload) => {
      const snapshot = this.runtime.lastSnapshot;
      const team = snapshot && this._team(snapshot);
      if (!team || String(sender) !== String(team.leaderName) || !payload || payload.leaderName !== team.leaderName || payload.expiresAt <= this.now()) return false;
      if (!snapshot.character || payload.map !== snapshot.character.map) return false;
      const gameData = this.runtime.adapter.getGameData() || {};
      if (!gameData.monsters || !gameData.monsters[payload.monster] || !isApprovedDisposition(contentDisposition(this.runtime.world, payload.monster))) return false;
      this.objective = clone(payload);
      if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(payload);
      this.stats.objectivesReceived += 1;
      return true;
    });
    this.receiverInstalled = true;
    return true;
  }

  _publish(team, objective) {
    this.objective = clone(objective);
    if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(objective);
    this.stats.objectivesPublished += 1;
    const transport = this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport;
    if (!transport || typeof transport.send !== 'function') return;
    for (const member of team.members || []) {
      if (!member.name || member.name === team.leaderName) continue;
      Promise.resolve(transport.send(member.name, objective, { receiver: PROGRESSION_RECEIVER, sender: team.leaderName })).catch(() => {});
    }
  }

  _syncShared() {
    const shared = this.parent && this.parent[SHARED_OBJECTIVE];
    const snapshot = this.runtime.lastSnapshot;
    if (!this._freshObjective() && shared && shared.expiresAt > this.now() && snapshot && snapshot.character && shared.map === snapshot.character.map) {
      this.objective = clone(shared);
    }
  }

  _installPlannerPreference() {
    const planner = this.runtime.localFarming.planner;
    if (planner.__alpha21ProgressionPreferenceInstalled) return;
    const base = planner.rank.bind(planner);
    planner.rank = (...args) => {
      const rows = base(...args) || [];
      this._syncShared();
      const objective = this._freshObjective();
      const character = args[0] && args[0].character;
      if (!objective || !character || character.map !== objective.map) return rows;
      const wanted = `${objective.map}:${objective.monster}:${objective.spawnIndex}`;
      return rows.slice().sort((a, b) => {
        const aWanted = `${a.map}:${a.monster}:${a.spawnIndex}` === wanted;
        const bWanted = `${b.map}:${b.monster}:${b.spawnIndex}` === wanted;
        if (aWanted !== bWanted) return aWanted ? -1 : 1;
        return finite(b.score) - finite(a.score);
      });
    };
    planner.__alpha21ProgressionPreferenceInstalled = true;
  }

  _installGearPriority() {
    const gear = this.runtime.gearProgression;
    if (!gear || gear.__alpha21ProgressionPriorityInstalled || typeof gear.list !== 'function') return;
    const base = gear.list.bind(gear);
    gear.list = (limit = 100) => {
      const goals = base(limit) || [];
      const bottleneck = this.lastEvaluation && this.lastEvaluation.selected && this.lastEvaluation.selected.readiness.bottleneck || 'NONE';
      if (bottleneck === 'NONE') return goals;
      this.stats.gearGoalReorders += 1;
      return goals
        .map((goal) => ({ ...goal, progressionBottleneck: bottleneck, progressionPriorityScore: progressionGoalScore(goal, bottleneck) }))
        .sort((a, b) => finite(b.progressionPriorityScore) - finite(a.progressionPriorityScore));
    };
    gear.__alpha21ProgressionPriorityInstalled = true;
  }

  _installRuntimeHook() {
    if (this.runtime.__alpha21ProgressionTickInstalled) return;
    const base = this.runtime.tick.bind(this.runtime);
    this.runtime.tick = (...args) => {
      const result = base(...args);
      try { this.tick(this.runtime.lastSnapshot); } catch (error) {
        this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'PROGRESSION_FAILED_SAFE', error: String(error && error.message || error).slice(0, 180) };
      }
      return result;
    };
    this.runtime.__alpha21ProgressionTickInstalled = true;
  }

  tick(snapshot) {
    this._ensureReceiver();
    this._syncShared();
    if (!snapshot || !snapshot.character || String(snapshot.character.ctype || '').toLowerCase() === 'merchant') return null;
    if (this.now() - this.lastEvaluationAt < this.options.evaluationIntervalMs) return this.lastDecision;
    this.lastEvaluationAt = this.now();

    const team = this._team(snapshot);
    if (!team || team.selfName !== team.leaderName) return this.lastDecision;
    if (!team.complete || !team.alive || !team.sameMap || !team.positionsKnown || !team.cohesive || this._busy(snapshot)) return this.lastDecision;
    const current = this._plan();
    if (!current) return this.lastDecision;
    const party = this._party(snapshot);
    const profile = this.runtime.world.performanceFor(current.monster, party.fingerprint);
    if (!profile || finite(profile.windows) < this.options.minWindows || clamp01(profile.confidence) < this.options.minConfidence) {
      this.stats.evidenceHolds += 1;
      this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'MORE_LIVE_EVIDENCE_REQUIRED' };
      return this.lastDecision;
    }

    const gameData = this.runtime.adapter.getGameData() || {};
    const ranked = enumerateProgressionCandidates(gameData, this.runtime.world, party.fingerprint, current, {
      ...this.options,
      teamMaxHp: this._teamMaxHp(team, snapshot)
    });
    const selected = ranked[0] || null;
    this.stats.evaluations += 1;
    this.lastEvaluation = {
      at: this.now(),
      current: { map: current.map, monster: current.monster, spawnIndex: current.spawnIndex, profile: clone(profile) },
      selected: clone(selected),
      candidates: ranked.slice(0, 8).map(clone)
    };

    if (!selected || !selected.readiness.ready) {
      this.candidateKey = null;
      this.candidateStableCount = 0;
      this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'NO_AREA_READY_YET', bottleneck: selected && selected.readiness.bottleneck || null };
      return this.lastDecision;
    }

    this.stats.readyDetections += 1;
    this.candidateStableCount = selected.id === this.candidateKey ? this.candidateStableCount + 1 : 1;
    this.candidateKey = selected.id;
    this._event('ALPHA21_AREA_READY', 'info', 'LIVE_READINESS_CONFIRMED', {
      target: selected.id,
      readinessScore: selected.readiness.readinessScore,
      bottleneck: selected.readiness.bottleneck,
      stableEvaluations: this.candidateStableCount
    });

    if (this.candidateStableCount < this.options.stableEvaluations || this.now() - this.lastSwitchAt < this.options.switchCooldownMs) return this.lastDecision;

    if (selected.map !== snapshot.character.map) {
      this.stats.crossMapRecommendations += 1;
      this.lastDecision = {
        at: this.now(),
        action: 'RECOMMEND',
        reason: 'CROSS_MAP_PROGRESSION_REQUIRES_AUTHORIZED_FARMER_TRAVEL',
        target: clone(selected)
      };
      return this.lastDecision;
    }

    const objective = {
      id: `alpha21-${this.now()}-${selected.id}`,
      leaderName: team.leaderName,
      partyFingerprint: party.fingerprint,
      map: selected.map,
      monster: selected.monster,
      spawnIndex: selected.spawnIndex,
      x: selected.x,
      y: selected.y,
      createdAt: this.now(),
      expiresAt: this.now() + this.options.objectiveTtlMs,
      readiness: clone(selected.readiness)
    };
    this._publish(team, objective);
    this.lastSwitchAt = this.now();
    this.stats.promotions += 1;
    if (typeof this.runtime.localFarming._abort === 'function') {
      this.runtime.localFarming._abort('ALPHA21_PROGRESSION_REPLAN', this.now(), { nextArea: selected.id });
    }
    this.stats.sameMapReplans += 1;
    this.lastDecision = { at: this.now(), action: 'REPLAN', reason: 'PARTY_READY_FOR_BETTER_AREA', target: clone(objective) };
    this._event('ALPHA21_PROGRESSION_PROMOTED', 'warn', 'PARTY_READY_FOR_BETTER_AREA', { objective: clone(objective) });
    return this.lastDecision;
  }

  status() {
    return {
      schemaVersion: 2,
      mode: ALPHA21_PROGRESSION_MODE,
      policy: {
        hardLevelGuide: false,
        livePerformanceDriven: true,
        deterministicLeaderOwnsPromotion: true,
        followerIndependentPromotion: false,
        unknownContentFailClosed: true,
        sameMapPromotionAutomatic: true,
        crossMapPromotionRecommendationOnly: true,
        directSmartMoveAuthority: false,
        gearGoalsFollowLiveBottleneck: true
      },
      objective: clone(this._freshObjective()),
      lastEvaluation: clone(this.lastEvaluation),
      lastDecision: clone(this.lastDecision),
      stableCandidate: this.candidateKey,
      stableEvaluations: this.candidateStableCount,
      receiverInstalled: this.receiverInstalled,
      options: { ...this.options },
      stats: { ...this.stats }
    };
  }
}

function installAlpha21ProgressionIntelligence(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.progressionIntelligence) return runtime.progressionIntelligence;
  return (runtime.progressionIntelligence = new ProgressionIntelligence(runtime, options));
}

module.exports = {
  ALPHA21_PROGRESSION_MODE,
  PROGRESSION_RECEIVER,
  ProgressionIntelligence,
  installAlpha21ProgressionIntelligence,
  monsterDifficulty,
  relativeMonsterDifficulty,
  evaluateProgressionReadiness,
  readinessBottleneck,
  progressionGoalScore,
  enumerateProgressionCandidates
};
