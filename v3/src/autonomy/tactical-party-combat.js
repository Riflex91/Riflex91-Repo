'use strict';

const { SmartAoePlanner, SmartAoeState } = require('./smart-aoe-planner');
const { CombatMode } = require('./combat-modes');
const { createPartyFingerprint } = require('../party/fingerprints');

const TACTICAL_PARTY_COMBAT_MODE = 'leader-owned-multi-encounter-v2';

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
      maxAvoidance: clamp(finite(options.maxAvoidance, 0.70), 0.30, 0.95),
      pullExpansionIntervalMs: Math.max(500, finite(options.pullExpansionIntervalMs, 1100)),
      pendingPullTimeoutMs: Math.max(1200, finite(options.pendingPullTimeoutMs, 3000)),
      sameTypePullsOnly: options.sameTypePullsOnly !== false
    };
    this.adaptivePullLearner = options.adaptivePullLearner || runtime.adaptivePullLearner || null;
    this.encounterLifecycle = options.encounterLifecycle || runtime.encounterLifecycle || null;
    this.smartAoePlanner = options.smartAoePlanner || new SmartAoePlanner({
      ...(options.smartAoe || {}),
      now: this.now,
      log: this.log,
      adaptivePullLearner: this.adaptivePullLearner
    });
    this.encounter = null;
    this.lastEvaluation = null;
    this.lastDecision = null;
    this.lastPullExpansionAt = -Infinity;
    this.pendingPull = null;
    this.stats = { evaluations: 0, routineAllowed: 0, unsafeRejected: 0, specialPullBlocks: 0, targetLocks: 0, betterTargetSwitches: 0, sharedAggroSwitches: 0, followerReassessmentBlocks: 0, encounterRefreshes: 0, pullCandidateAllows: 0, pullCandidateBlocks: 0, pullExpansionAttempts: 0, pullExpansionCommands: 0, pullExpansionObserved: 0, pullExpansionTimeouts: 0, pullExpansionNoCandidate: 0 };
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

  _combatMode(snapshot) {
    const profiles = this.runtime && this.runtime.characterCombatProfiles;
    const character = snapshot && snapshot.character;
    if (!profiles || !character || typeof profiles.getCombatMode !== 'function') return CombatMode.SMART_AUTO;
    try { return profiles.getCombatMode(character.name); } catch (_) { return CombatMode.SMART_AUTO; }
  }

  _partyCapabilities() {
    const resolver = this.runtime && this.runtime.partyCapabilityResolver;
    if (!resolver || typeof resolver.status !== 'function') return null;
    try { return resolver.status(); } catch (_) { return null; }
  }

  _encounterEntities(snapshot, team) {
    if (!snapshot) return [];
    const names = new Set(team && team.names || []);
    const known = new Set(this.encounter && this.encounter.targetIds || []);
    if (this.encounter && this.encounter.targetId) known.add(String(this.encounter.targetId));
    const rows = (snapshot.entities || []).filter((row) => row && row.mtype && !row.dead && finite(row.hp, 1) > 0 && (
      known.has(String(row.id)) || (row.target != null && names.has(String(row.target)))
    ));
    return rows.sort((a, b) => {
      const primary = this.encounter && String(this.encounter.primaryTargetId || this.encounter.targetId || '');
      if (String(a.id) === primary) return -1;
      if (String(b.id) === primary) return 1;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  _refreshEncounterPlan(snapshot, team) {
    if (!this.encounter || !snapshot || !team) return null;
    const now = this.now();
    if (this.pendingPull) {
      const observed = (snapshot.entities || []).find((row) => row && String(row.id) === String(this.pendingPull.targetId)
        && row.target != null && (team.names || []).includes(String(row.target))
        && !row.dead && finite(row.hp, 1) > 0);
      if (observed) {
        this.stats.pullExpansionObserved += 1;
        this._event('SMART_AOE_PULL_OBSERVED', 'info', 'PENDING_PULL_JOINED_ENCOUNTER', {
          targetId: String(observed.id),
          targetType: observed.mtype || null,
          pullOwner: team.leaderName || null
        });
        this.pendingPull = null;
      } else if (now >= finite(this.pendingPull.expiresAt, 0)) {
        this.stats.pullExpansionTimeouts += 1;
        this._event('SMART_AOE_PULL_TIMEOUT', 'warn', 'PULL_AGGRO_NOT_OBSERVED', {
          targetId: this.pendingPull.targetId,
          targetType: this.pendingPull.targetType || null
        });
        this.pendingPull = null;
      }
    }
    const targets = this._encounterEntities(snapshot, team);
    const evaluations = targets.map((target) => this.evaluateTarget(target, team, snapshot));
    const currentMembers = this.runtime && typeof this.runtime._currentMembers === 'function'
      ? this.runtime._currentMembers(snapshot)
      : (team.members || []);
    const lifecycleContext = this.encounterLifecycle && this.encounterLifecycle.current || null;
    const partyFingerprint = this.runtime.currentPartyFingerprint
      || (lifecycleContext && lifecycleContext.partyFingerprint ? { key: lifecycleContext.partyFingerprint } : createPartyFingerprint(currentMembers));
    const encounterFingerprint = this.runtime.currentEncounterFingerprint || {
      monster: { mtype: this.encounter.targetType || targets[0] && targets[0].mtype || null },
      contentDisposition: lifecycleContext && lifecycleContext.contentDisposition || null,
      event: null
    };
    const aoe = this.smartAoePlanner.evaluate({
      mode: this._combatMode(snapshot, team),
      team,
      partyCapabilities: this._partyCapabilities(),
      engagedTargets: targets,
      evaluations,
      learningContext: {
        snapshot,
        currentMembers,
        monster: this.encounter.targetType || targets[0] && targets[0].mtype || null,
        encounterFingerprint,
        partyFingerprint,
        isLeader: team.selfName === team.leaderName
      }
    });
    const primaryId = String(this.encounter.primaryTargetId || this.encounter.targetId || '');
    this.encounter.targetIds = targets.map((row) => String(row.id));
    this.encounter.targets = targets.map((row) => ({
      id: String(row.id),
      type: row.mtype || null,
      role: String(row.id) === primaryId ? 'PRIMARY' : 'ENGAGED',
      target: row.target == null ? null : String(row.target)
    }));
    this.encounter.aoe = aoe;
    this.encounter.updatedAt = this.now();
    if (this.encounterLifecycle && typeof this.encounterLifecycle.observe === 'function') {
      this.encounterLifecycle.observe({ snapshot, team, tacticalEncounter: this.encounter, reason: 'PLAN_REFRESH' });
    }
    this.stats.encounterRefreshes += 1;
    return aoe;
  }

  _finalizeEncounter(snapshot, team, reason, outcome = null) {
    if (!this.encounter) return null;
    const previous = this.encounter;
    let final = null;
    if (this.encounterLifecycle && typeof this.encounterLifecycle.finish === 'function') {
      final = this.encounterLifecycle.finish({ snapshot, team, tacticalEncounter: previous, reason, outcome });
    }
    this.encounter = null;
    this.pendingPull = null;
    return final;
  }

  _setEncounter(target, evaluation, reason, team = null, snapshot = this.runtime.lastSnapshot) {
    const resolvedTeam = team || (snapshot && this.team && typeof this.team._team === 'function' ? this.team._team(snapshot) : null);
    const previous = this.encounter;
    const previousPrimary = previous && String(previous.primaryTargetId || previous.targetId || '');
    if (previous && previousPrimary && previousPrimary !== String(target.id)) {
      this._finalizeEncounter(snapshot, resolvedTeam, 'TACTICAL_TARGET_REPLACED');
    }
    this.encounter = {
      targetId: String(target.id),
      primaryTargetId: String(target.id),
      targetType: target.mtype || null,
      targetIds: [String(target.id)],
      targets: [{ id: String(target.id), type: target.mtype || null, role: 'PRIMARY', target: target.target == null ? null : String(target.target) }],
      pullOwner: resolvedTeam && resolvedTeam.leaderName || null,
      selectedAt: this.now(),
      updatedAt: this.now(),
      reason,
      score: finite(evaluation && evaluation.score),
      plan: evaluation ? {
        ttkSeconds: finite(evaluation.ttkSeconds),
        partyDps: finite(evaluation.partyDps),
        targetDps: finite(evaluation.targetDps),
        projectedDamageRatio: finite(evaluation.projectedDamageRatio),
        avoidance: finite(evaluation.avoidance),
        rangeScore: finite(evaluation.rangeScore)
      } : null,
      aoe: null
    };
    if (this.encounterLifecycle && typeof this.encounterLifecycle.begin === 'function') {
      this.encounterLifecycle.begin({ snapshot, team: resolvedTeam, tacticalEncounter: this.encounter, previousEncounter: previous, reason });
    }
    if (resolvedTeam && snapshot) this._refreshEncounterPlan(snapshot, resolvedTeam);
    this.lastDecision = { at: this.now(), action: 'ENCOUNTER_TARGET', reason, targetId: this.encounter.targetId, targetType: this.encounter.targetType, pullOwner: this.encounter.pullOwner };
    return this.encounter;
  }

  canAddTarget(target, context = {}) {
    const snapshot = context.snapshot || this.runtime.lastSnapshot;
    const team = context.team || (snapshot && this.team && typeof this.team._team === 'function' ? this.team._team(snapshot) : null);
    if (!target || !snapshot || !team) return { allowed: false, reason: 'PULL_CONTEXT_UNAVAILABLE' };
    if (team.selfName !== team.leaderName) {
      this.stats.pullCandidateBlocks += 1;
      return { allowed: false, reason: 'PULL_OWNED_BY_TEAM_LEADER', pullOwner: team.leaderName || null };
    }
    if (this._combatMode(snapshot, team) === CombatMode.SINGLE_TARGET) {
      this.stats.pullCandidateBlocks += 1;
      return { allowed: false, reason: 'SINGLE_TARGET_MODE' };
    }
    if (!this.encounter) {
      this.stats.pullCandidateBlocks += 1;
      return { allowed: false, reason: 'ENCOUNTER_MISSING' };
    }
    this._refreshEncounterPlan(snapshot, team);
    if ((this.encounter.targetIds || []).includes(String(target.id))) {
      this.stats.pullCandidateBlocks += 1;
      return { allowed: false, reason: 'TARGET_ALREADY_IN_ENCOUNTER' };
    }
    if (!this.team._candidateAllowed({ snapshot, party: context.party || {} }, target)) {
      this.stats.pullCandidateBlocks += 1;
      return { allowed: false, reason: 'TARGET_NOT_LOCALLY_SAFE' };
    }
    const evaluation = this.evaluateTarget(target, team, snapshot);
    const decision = this.smartAoePlanner.evaluateCandidate(this.encounter.aoe, evaluation);
    if (decision.allowed) this.stats.pullCandidateAllows += 1;
    else this.stats.pullCandidateBlocks += 1;
    return { ...decision, evaluation, pullOwner: team.leaderName };
  }

  _pullCandidates(context, team) {
    const snapshot = context && context.snapshot;
    if (!snapshot || !team || !this.encounter) return [];
    const primaryType = this.encounter.targetType || null;
    const existing = new Set(this.encounter.targetIds || []);
    const safe = this.farmer && typeof this.farmer._safeLiveMonsters === 'function'
      ? this.farmer._safeLiveMonsters(snapshot, context.party || {}) || []
      : [];
    const rows = [];
    for (const candidate of safe) {
      if (!candidate || candidate.dead || finite(candidate.hp, 1) <= 0) continue;
      if (existing.has(String(candidate.id))) continue;
      if (candidate.target != null) continue;
      if (this.config.sameTypePullsOnly && primaryType && candidate.mtype !== primaryType) continue;
      if (this._specialFreshPull(candidate)) continue;
      if (context.adapter && typeof context.adapter.canAttack === 'function' && !context.adapter.canAttack(candidate.id)) continue;
      const decision = this.canAddTarget(candidate, { snapshot, team, party: context.party || {} });
      if (!decision.allowed) continue;
      rows.push({ candidate, decision });
    }
    rows.sort((a, b) => finite(b.decision.evaluation && b.decision.evaluation.score, -Infinity)
      - finite(a.decision.evaluation && a.decision.evaluation.score, -Infinity)
      || String(a.candidate.id).localeCompare(String(b.candidate.id)));
    return rows;
  }

  maybeExpandPull(context, primaryTarget = null) {
    const snapshot = context && context.snapshot;
    if (!snapshot || !snapshot.character || !this.encounter) return { acted: false, reason: 'PULL_CONTEXT_UNAVAILABLE' };
    const team = this.team && typeof this.team._team === 'function' ? this.team._team(snapshot) : null;
    if (!team || team.selfName !== team.leaderName) return { acted: false, reason: 'PULL_OWNED_BY_TEAM_LEADER' };

    const gate = this.team && typeof this.team._combatGate === 'function'
      ? this.team._combatGate(context, primaryTarget || this._currentEntity(snapshot), 'SMART_AOE_PULL_EXPANSION')
      : { allowed: true };
    if (!gate || gate.allowed !== true) return { acted: false, reason: gate && gate.reason || 'TEAM_COMBAT_GATE_BLOCKED' };

    const plan = this._refreshEncounterPlan(snapshot, team);
    if (!plan || plan.state !== SmartAoeState.BUILD_PULL || plan.mayAddTarget !== true) {
      return { acted: false, reason: plan && plan.reason || 'PLANNER_NOT_BUILDING_PULL' };
    }
    if (this.pendingPull) return { acted: false, reason: 'PULL_AGGRO_CONFIRMATION_PENDING', pending: { ...this.pendingPull } };
    const now = this.now();
    if (now - this.lastPullExpansionAt < this.config.pullExpansionIntervalMs) return { acted: false, reason: 'PULL_EXPANSION_INTERVAL' };

    const candidates = this._pullCandidates(context, team);
    if (!candidates.length) {
      this.stats.pullExpansionNoCandidate += 1;
      return { acted: false, reason: 'NO_SAFE_IN_RANGE_PULL_CANDIDATE' };
    }

    const selected = candidates[0];
    this.stats.pullExpansionAttempts += 1;
    this.lastPullExpansionAt = now;
    const result = context.adapter && typeof context.adapter.command === 'function'
      ? context.adapter.command('attack', [String(selected.candidate.id)])
      : { executed: false, shadow: false, reason: 'ADAPTER_UNAVAILABLE' };
    if (!result || (!result.executed && !result.shadow)) {
      this.lastDecision = {
        at: now,
        action: 'SMART_AOE_PULL_HOLD',
        reason: result && result.reason || 'PULL_ATTACK_FAILED',
        targetId: String(selected.candidate.id),
        targetType: selected.candidate.mtype || null
      };
      return { acted: false, reason: this.lastDecision.reason, result: result || null };
    }

    this.stats.pullExpansionCommands += 1;
    this.pendingPull = {
      targetId: String(selected.candidate.id),
      targetType: selected.candidate.mtype || null,
      at: now,
      expiresAt: now + this.config.pendingPullTimeoutMs,
      shadow: result.shadow === true
    };
    if (this.farmer) {
      this.farmer.lastActionAt = now;
      if (this.farmer.lastSkillAttemptAt != null) this.farmer.lastSkillAttemptAt = now;
    }
    this.lastDecision = {
      at: now,
      action: 'SMART_AOE_PULL_EXPAND',
      reason: 'LEADER_TAGGED_ONE_SAFE_CANDIDATE',
      primaryTargetId: this.encounter.primaryTargetId || this.encounter.targetId || null,
      targetId: this.pendingPull.targetId,
      targetType: this.pendingPull.targetType,
      pullOwner: team.leaderName,
      projectedDamageRatio: selected.decision.projectedDamageRatio,
      resultingCount: selected.decision.resultingCount,
      shadow: result.shadow === true
    };
    this._event('SMART_AOE_PULL_EXPANDED', 'info', this.lastDecision.reason, { ...this.lastDecision });
    return { acted: true, decision: { ...this.lastDecision }, result, candidate: selected.candidate };
  }

  _currentEntity(snapshot) {
    if (!this.encounter) return null;
    const id = String(this.encounter.primaryTargetId || this.encounter.targetId || '');
    return (snapshot && snapshot.entities || []).find((row) => row && String(row.id) === id && !row.dead && finite(row.hp, 1) > 0) || null;
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
          this._refreshEncounterPlan(snapshot, team);
          const current = this._currentEntity(snapshot);
          if (current && this.team._candidateAllowed(context, current)) {
            const shared = this.team._sharedAggro(context, team);
            const encounterIds = new Set(this.encounter.targetIds || []);
            if (!shared || String(shared.id) === String(current.id) || encounterIds.has(String(shared.id))) {
              const evaluation = this.evaluateTarget(current, team, snapshot);
              if (evaluation.allowed) {
                this.stats.targetLocks += 1;
                this.encounter.updatedAt = this.now();
                return this._selection(current, 'tactical-encounter-lock', evaluation);
              }
            }
          }
          this._finalizeEncounter(snapshot, team, 'LEADER_ENCOUNTER_INVALIDATED');
        }
        const selection = baseSelect(context);
        if (selection && selection.target && team && team.selfName === team.leaderName) {
          const evaluation = this.evaluateTarget(selection.target, team, snapshot);
          if (!evaluation.allowed) {
            this.lastDecision = { at: this.now(), action: 'TARGET_HOLD', reason: evaluation.reason, targetId: String(selection.target.id), targetType: selection.target.mtype };
            return null;
          }
          this._setEncounter(selection.target, evaluation, evaluation.partyAggro ? 'PARTY_MEMBER_UNDER_ATTACK' : 'LEADER_TACTICAL_SELECTION', team, snapshot);
        } else if (selection && selection.target && team && team.selfName !== team.leaderName) {
          const primaryId = String(team.leaderTargetId || selection.target.id);
          const primary = (snapshot.entities || []).find((row) => row && String(row.id) === primaryId) || selection.target;
          const evaluation = this.evaluateTarget(primary, team, snapshot);
          if (evaluation.allowed) {
            const currentPrimary = this.encounter && String(this.encounter.primaryTargetId || this.encounter.targetId || '');
            if (!this.encounter || currentPrimary !== String(primary.id) || this.encounter.pullOwner !== team.leaderName) {
              this._setEncounter(primary, evaluation, 'FOLLOWER_LEADER_ENCOUNTER_MIRROR', team, snapshot);
            } else {
              this._refreshEncounterPlan(snapshot, team);
            }
          } else {
            this.encounter = null;
          }
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
            if (this.encounter) {
              this._refreshEncounterPlan(snapshot, team);
              const ids = new Set(this.encounter.targetIds || []);
              if (ids.has(String(shared.id)) && this.encounter.aoe && [
                SmartAoeState.BUILD_PULL, SmartAoeState.HOLD_PULL, SmartAoeState.AOE_BURN
              ].includes(this.encounter.aoe.state)) return target;
            }
            this._setEncounter(shared, evaluation, 'PARTY_MEMBER_UNDER_ATTACK', team, snapshot);
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
            this._setEncounter(best.candidate, best.evaluation, 'CLEARLY_BETTER_TEAM_TARGET', team, snapshot);
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
    return {
      schemaVersion: 2,
      mode: TACTICAL_PARTY_COMBAT_MODE,
      installed: this.installed,
      leaderOwnsEncounter: true,
      leaderOwnsPullExpansion: true,
      followerEncounterMirror: true,
      followerIndependentReassessment: false,
      freshBossSpecialPullsForbidden: true,
      config: { ...this.config },
      encounter: this.encounter ? JSON.parse(JSON.stringify(this.encounter)) : null,
      smartAoePlanner: this.smartAoePlanner.status(),
      adaptivePullLearning: this.adaptivePullLearner && typeof this.adaptivePullLearner.status === 'function' ? this.adaptivePullLearner.status() : null,
      encounterLifecycle: this.encounterLifecycle && typeof this.encounterLifecycle.status === 'function' ? this.encounterLifecycle.status() : null,
      pendingPull: this.pendingPull ? { ...this.pendingPull } : null,
      lastEvaluation: this.lastEvaluation ? { ...this.lastEvaluation } : null,
      lastDecision: this.lastDecision ? { ...this.lastDecision } : null,
      stats: { ...this.stats }
    };
  }
}

function installTacticalPartyCombat(runtime, options = {}) { return new TacticalPartyCombat(runtime, options); }
module.exports = { TacticalPartyCombat, installTacticalPartyCombat, TACTICAL_PARTY_COMBAT_MODE };
