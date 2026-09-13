'use strict';

const TACTICAL_PARTY_COMBAT_MODE = 'leader-owned-tactical-encounter-v1';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
function lower(value) { return String(value == null ? '' : value).trim().toLowerCase(); }
function distance(a, b) {
  const ax = finite(a && a.x, NaN); const ay = finite(a && a.y, NaN); const bx = finite(b && b.x, NaN); const by = finite(b && b.y, NaN);
  return [ax, ay, bx, by].every(Number.isFinite) ? Math.hypot(ax - bx, ay - by) : Infinity;
}

class TacticalPartyCombat {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer || !runtime.teamCombatCohesionHotfix) throw new Error('farmer and team combat cohesion required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.team = runtime.teamCombatCohesionHotfix;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.config = {
      targetLockMs: Math.max(3000, finite(options.targetLockMs, 8000)),
      betterTargetScoreDelta: Math.max(10, finite(options.betterTargetScoreDelta, 25)),
      maxRoutineTtkSeconds: Math.max(15, finite(options.maxRoutineTtkSeconds, 45)),
      maxProjectedTeamDamageRatio: clamp(finite(options.maxProjectedTeamDamageRatio, 0.80), 0.35, 1.5),
      maxAvoidance: clamp(finite(options.maxAvoidance, 0.70), 0.30, 0.95)
    };
    this.encounter = null;
    this.lastEvaluation = null;
    this.lastDecision = null;
    this.stats = { evaluations: 0, routineAllowed: 0, unsafeRejected: 0, specialPullBlocks: 0, targetLocks: 0, betterTargetSwitches: 0, sharedAggroSwitches: 0, followerReassessmentBlocks: 0 };
    this.installed = false;
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'tactical-party-combat', event, severity, reason, data }); } catch (_) {}
  }

  _monsterMeta(target) {
    const game = this.runtime.adapter && this.runtime.adapter.getGameData ? this.runtime.adapter.getGameData() || {} : {};
    return game.monsters && target && game.monsters[target.mtype] || {};
  }

  _specialFreshPull(target) {
    if (!target || target.target) return false;
    const meta = this._monsterMeta(target);
    return meta.boss === true || meta.special === true || meta.event === true || meta.global === true || meta.cooperative === true || target.boss === true || target.special === true;
  }

  _memberLiveRow(snapshot, name) {
    if (snapshot && snapshot.character && snapshot.character.name === name) return snapshot.character;
    return (snapshot && snapshot.entities || []).find((row) => row && row.name === name && !row.mtype) || null;
  }

  _partyDps(team, snapshot) {
    let total = 0;
    for (const member of team && team.members || []) {
      const row = this._memberLiveRow(snapshot, member.name) || member;
      const attack = finite(row.attack, 0);
      const frequency = Math.max(0.25, finite(row.frequency, 0));
      const base = attack > 0 ? attack * frequency : 200;
      const ctype = lower(row.ctype || member.ctype);
      const classFactor = ctype === 'ranger' || ctype === 'mage' || ctype === 'rogue' ? 1.08 : 1;
      total += Math.max(80, base * classFactor);
    }
    return Math.max(1, total);
  }

  _targetDps(target) {
    const meta = this._monsterMeta(target);
    const attack = Math.max(0, finite(target && target.attack, finite(meta.attack, 0)));
    const frequency = Math.max(0.2, finite(target && target.frequency, finite(meta.frequency, 1)));
    return attack * frequency;
  }

  _avoidance(target) {
    const meta = this._monsterMeta(target);
    return clamp(Math.max(finite(target && target.evasion, 0), finite(target && target.avoidance, 0), finite(meta.evasion, 0), finite(meta.avoidance, 0)), 0, 1);
  }

  _rangeScore(target, snapshot, team) {
    if (!snapshot || !snapshot.character || !target) return 0;
    const localDistance = distance(snapshot.character, target);
    const ranges = (team && team.members || []).map((member) => {
      const row = this._memberLiveRow(snapshot, member.name) || member;
      return finite(row.range, 100);
    });
    const averageRange = ranges.length ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 100;
    if (!Number.isFinite(localDistance)) return 0;
    return clamp((averageRange * 1.5 - localDistance) / Math.max(1, averageRange * 1.5), -1, 1);
  }

  evaluateTarget(target, team, snapshot = this.runtime.lastSnapshot) {
    this.stats.evaluations += 1;
    if (!target) return { allowed: false, reason: 'TARGET_MISSING', score: -Infinity };
    const names = new Set(team && team.names || []);
    const partyAggro = !!(target.target && names.has(String(target.target)));
    if (this._specialFreshPull(target) && !partyAggro) {
      const result = { allowed: false, reason: 'FRESH_BOSS_OR_SPECIAL_PULL_FORBIDDEN', score: -Infinity, targetId: String(target.id), targetType: target.mtype };
      this.stats.specialPullBlocks += 1; this.lastEvaluation = result; return result;
    }
    const partyDps = this._partyDps(team, snapshot);
    const hp = Math.max(1, finite(target.hp, finite(target.max_hp, 1)));
    const ttkSeconds = hp / partyDps;
    const targetDps = this._targetDps(target);
    const totalTeamHp = Math.max(1, (team && team.members || []).reduce((sum, row) => sum + Math.max(0, finite(row.hp, finite(row.max_hp, 0))), 0));
    const projectedDamage = targetDps * ttkSeconds;
    const projectedDamageRatio = projectedDamage / totalTeamHp;
    const avoidance = this._avoidance(target);
    const aggroBonus = partyAggro ? 30 : 0;
    const rangeScore = this._rangeScore(target, snapshot, team);
    const hpRatio = finite(target.max_hp, hp) > 0 ? hp / finite(target.max_hp, hp) : 1;
    const score = 100 - ttkSeconds * 1.5 - projectedDamageRatio * 45 - avoidance * 30 + aggroBonus + rangeScore * 8 + (1 - hpRatio) * 10;
    let allowed = true; let reason = partyAggro ? 'PARTY_MEMBER_UNDER_ATTACK' : 'TACTICAL_ROUTINE_TARGET';
    if (!partyAggro && avoidance > this.config.maxAvoidance) { allowed = false; reason = 'TARGET_AVOIDANCE_TOO_HIGH'; }
    else if (!partyAggro && ttkSeconds > this.config.maxRoutineTtkSeconds && projectedDamageRatio > this.config.maxProjectedTeamDamageRatio) { allowed = false; reason = 'PROJECTED_COMBAT_RISK_TOO_HIGH'; }
    const result = { allowed, reason, score, targetId: String(target.id), targetType: target.mtype, partyDps, targetDps, ttkSeconds, projectedDamage, projectedDamageRatio, avoidance, rangeScore, hpRatio, partyAggro };
    if (allowed) this.stats.routineAllowed += 1; else this.stats.unsafeRejected += 1;
    this.lastEvaluation = result;
    return result;
  }

  _setEncounter(target, evaluation, reason) {
    this.encounter = { targetId: String(target.id), targetType: target.mtype || null, selectedAt: this.now(), updatedAt: this.now(), reason, score: finite(evaluation && evaluation.score), plan: evaluation ? { ttkSeconds: finite(evaluation.ttkSeconds), partyDps: finite(evaluation.partyDps), targetDps: finite(evaluation.targetDps), projectedDamageRatio: finite(evaluation.projectedDamageRatio), avoidance: finite(evaluation.avoidance), rangeScore: finite(evaluation.rangeScore) } : null };
    this.lastDecision = { at: this.now(), action: 'ENCOUNTER_TARGET', reason, ...this.encounter };
    return this.encounter;
  }

  _currentEntity(snapshot) {
    if (!this.encounter) return null;
    return (snapshot && snapshot.entities || []).find((row) => row && String(row.id) === this.encounter.targetId && !row.dead && finite(row.hp, 1) > 0) || null;
  }

  _selection(target, source, evaluation) {
    return { target, ranking: { monster: target.mtype || null, score: finite(evaluation && evaluation.score), travelSeconds: 0, xpPerHour: 0, goldPerHour: 0, deathsPerHour: 0, confidence: 1, source } };
  }

  install() {
    if (this.installed || this.farmer.__tacticalPartyCombatInstalled) return false;
    const self = this;
    this.team._oversizedNewTarget = function tacticalRiskGate(target, team) {
      return !self.evaluateTarget(target, team, self.__selectionSnapshot || self.runtime.lastSnapshot).allowed;
    };

    const baseSelect = this.farmer._selectTarget.bind(this.farmer);
    this.farmer._selectTarget = (context) => {
      const snapshot = context && context.snapshot;
      const team = this.team._team(snapshot);
      this.__selectionSnapshot = snapshot;
      try {
        if (team && team.selfName === team.leaderName && this.encounter) {
          const current = this._currentEntity(snapshot);
          if (current && this.team._candidateAllowed(context, current)) {
            const shared = this.team._sharedAggro(context, team);
            if (!shared || String(shared.id) === String(current.id)) {
              const evaluation = this.evaluateTarget(current, team, snapshot);
              if (evaluation.allowed) {
                this.stats.targetLocks += 1;
                this.encounter.updatedAt = this.now();
                return this._selection(current, 'tactical-encounter-lock', evaluation);
              }
            }
          }
          this.encounter = null;
        }
        const selection = baseSelect(context);
        if (selection && selection.target && team && team.selfName === team.leaderName) {
          const evaluation = this.evaluateTarget(selection.target, team, snapshot);
          if (!evaluation.allowed) {
            this.lastDecision = { at: this.now(), action: 'TARGET_HOLD', reason: evaluation.reason, targetId: String(selection.target.id), targetType: selection.target.mtype };
            return null;
          }
          this._setEncounter(selection.target, evaluation, evaluation.partyAggro ? 'PARTY_MEMBER_UNDER_ATTACK' : 'LEADER_TACTICAL_SELECTION');
        }
        return selection;
      } finally { this.__selectionSnapshot = null; }
    };

    if (typeof this.farmer._maybeReassessTarget === 'function') {
      const baseReassess = this.farmer._maybeReassessTarget.bind(this.farmer);
      this.farmer._maybeReassessTarget = (context, target) => {
        const snapshot = context && context.snapshot;
        const team = this.team._team(snapshot);
        if (!team || !team.complete) return baseReassess(context, target);
        if (team.selfName !== team.leaderName) {
          this.stats.followerReassessmentBlocks += 1;
          return target;
        }
        const shared = this.team._sharedAggro(context, team);
        if (shared && String(shared.id) !== String(target && target.id)) {
          const evaluation = this.evaluateTarget(shared, team, snapshot);
          if (evaluation.allowed) {
            this.stats.sharedAggroSwitches += 1;
            this._setEncounter(shared, evaluation, 'PARTY_MEMBER_UNDER_ATTACK');
            return shared;
          }
        }
        if (target && !target.dead && finite(target.hp, 1) > 0) {
          const currentEval = this.evaluateTarget(target, team, snapshot);
          if (currentEval.allowed && this.encounter && this.now() - this.encounter.selectedAt < this.config.targetLockMs) return target;
          if (currentEval.allowed) {
            const candidates = this.farmer._safeLiveMonsters(snapshot, context.party) || [];
            let best = null;
            for (const candidate of candidates) {
              if (!candidate || String(candidate.id) === String(target.id)) continue;
              const evaluation = this.evaluateTarget(candidate, team, snapshot);
              if (!evaluation.allowed) continue;
              if (!best || evaluation.score > best.evaluation.score) best = { candidate, evaluation };
            }
            if (!best || best.evaluation.score < currentEval.score + this.config.betterTargetScoreDelta) return target;
            this.stats.betterTargetSwitches += 1;
            this._setEncounter(best.candidate, best.evaluation, 'CLEARLY_BETTER_TEAM_TARGET');
            return best.candidate;
          }
        }
        return baseReassess(context, target);
      };
    }

    this.farmer.__tacticalPartyCombatInstalled = true;
    this.installed = true;
    this._event('TACTICAL_PARTY_COMBAT_INSTALLED', 'info', null, { ...this.config });
    return true;
  }

  status() {
    return { schemaVersion: 1, mode: TACTICAL_PARTY_COMBAT_MODE, installed: this.installed, leaderOwnsEncounter: true, followerIndependentReassessment: false, freshBossSpecialPullsForbidden: true, config: { ...this.config }, encounter: this.encounter ? { ...this.encounter } : null, lastEvaluation: this.lastEvaluation ? { ...this.lastEvaluation } : null, lastDecision: this.lastDecision ? { ...this.lastDecision } : null, stats: { ...this.stats } };
  }
}

function installTacticalPartyCombat(runtime, options = {}) { return new TacticalPartyCombat(runtime, options); }
module.exports = { TacticalPartyCombat, installTacticalPartyCombat, TACTICAL_PARTY_COMBAT_MODE };
