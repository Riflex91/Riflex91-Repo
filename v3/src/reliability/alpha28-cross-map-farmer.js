'use strict';

const { contentDisposition, isApprovedDisposition } = require('../autonomy/local-farm-planner');
const { GameAdapter } = require('../game/adapter');

const SHARED_OBJECTIVE = '__AIO_V3_ALPHA21_OBJECTIVE';
const CROSS_MAP_RECEIVER = 'alpha28.progression.crossmap';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);
const TEAM_REGROUP_KIND = 'TEAM_REGROUP';
const PROGRESSION_KIND = 'PROGRESSION';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clone(value) { try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
function characterOf(runtime) { return runtime && runtime.lastSnapshot && runtime.lastSnapshot.character || runtime && runtime.root && runtime.root.character || null; }

class Alpha28CrossMapFarmerProgression {
  constructor(runtime, shared) {
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = shared.now;
    this.log = shared.log;
    this.stats = shared.stats;
    this.busy = false;
    this.activePlanId = null;
    this.activeObjectiveId = null;
    this.lastAction = null;
    this.timeoutMs = 120000;
    this.receiverInstalled = false;
    this.receivedObjective = null;
    this.lastRegroupPublishAt = -Infinity;
    this.regroupPublishIntervalMs = 2000;
    this.regroupObjectiveTtlMs = 15000;
    this.patchProgressionStatus();
  }

  event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'alpha28-farmer-travel', event, severity, reason, data }); } catch (_) {}
  }

  _progression() { return this.runtime.progressionIntelligence || null; }

  patchProgressionStatus() {
    const progression = this._progression();
    if (!progression || progression.__alpha28CrossMapStatusPatched || typeof progression.status !== 'function') return false;
    const base = progression.status.bind(progression);
    progression.status = () => {
      const status = base();
      return { ...status, policy: { ...(status.policy || {}), crossMapPromotionRecommendationOnly: false, crossMapPromotionAutomatic: true, directSmartMoveAuthority: false, controlledFarmerTravelAuthority: true, crossMapTeamRegroupAutomatic: true } };
    };
    progression.__alpha28CrossMapStatusPatched = true;
    return true;
  }
  _team(snapshot) {
    try { return this.runtime.teamCombatCohesionHotfix && this.runtime.teamCombatCohesionHotfix._team(snapshot); } catch (_) { return null; }
  }
  _transport() {
    return this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport || null;
  }
  _ensureReceiver() {
    if (this.receiverInstalled) return true;
    const transport = this._transport();
    if (!transport || typeof transport.installDirectReceiver !== 'function') return false;
    transport.installDirectReceiver(CROSS_MAP_RECEIVER, (sender, payload) => {
      const snapshot = this.runtime.lastSnapshot;
      const team = snapshot && this._team(snapshot);
      if (!team || team.selfName === team.leaderName) return false;
      if (String(sender || '') !== String(team.leaderName || '')) return false;
      if (!payload || payload.crossMapAuthorizedBy !== 'alpha28-controlled-farmer-travel') return false;
      if (!this._objectiveValid(payload, team)) return false;
      this.receivedObjective = clone(payload);
      if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(payload);
      this.stats.crossMapObjectivesReceived += 1;
      if (payload.kind === TEAM_REGROUP_KIND) this.stats.crossMapRegroupObjectivesReceived = (this.stats.crossMapRegroupObjectivesReceived || 0) + 1;
      this.event('ALPHA28_CROSS_MAP_OBJECTIVE_RECEIVED', 'info', payload.kind === TEAM_REGROUP_KIND ? 'VALIDATED_LEADER_REGROUP_OBJECTIVE' : 'VALIDATED_LEADER_OBJECTIVE', { objectiveId: payload.id, kind: payload.kind || PROGRESSION_KIND, leaderName: team.leaderName, map: payload.map, monster: payload.monster || null });
      return true;
    });
    this.receiverInstalled = true;
    return true;
  }
  _publishCrossMap(team, objective) {
    const transport = this._transport();
    if (!transport || typeof transport.send !== 'function') return false;
    for (const member of team.members || []) {
      if (!member || !member.name || String(member.name) === String(team.leaderName)) continue;
      Promise.resolve(transport.send(member.name, objective, { receiver: CROSS_MAP_RECEIVER, sender: team.leaderName })).catch(() => {});
    }
    return true;
  }
  _supervisorAllowed() {
    try { const s = this.runtime.globalSupervisor && this.runtime.globalSupervisor.status(); return !!(s && SUPERVISOR_ALLOWED.has(String(s.state || ''))); } catch (_) { return false; }
  }
  _inCombat(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c) return true;
    if (c.rip || c.dead || this.runtime.pendingEmergencyRetreat) return true;
    const farmer = this.runtime.farmer;
    if (farmer && farmer.state === 'ENGAGE' && farmer.targetId != null) return true;
    return (snapshot.entities || []).some((e) => e && e.mtype && !e.dead && !e.rip && String(e.target || '') === String(c.name || ''));
  }
  _objectiveKind(objective) {
    return String(objective && objective.kind || PROGRESSION_KIND);
  }
  _objectiveValid(objective, team) {
    if (!objective || !team || !objective.id || objective.expiresAt <= this.now()) return false;
    if (String(objective.leaderName || '') !== String(team.leaderName || '')) return false;
    if (objective.crossMapAuthorizedBy !== 'alpha28-controlled-farmer-travel') return false;
    const gameData = this.runtime.adapter && this.runtime.adapter.getGameData ? this.runtime.adapter.getGameData() || {} : {};
    if (!gameData.maps || !Object.prototype.hasOwnProperty.call(gameData.maps, objective.map)) return false;
    if (this._objectiveKind(objective) === TEAM_REGROUP_KIND) {
      if (!Number.isFinite(Number(objective.x)) || !Number.isFinite(Number(objective.y))) return false;
      if (team.leader && team.leader.map && String(team.leader.map) !== String(objective.map)) return false;
      return true;
    }
    if (!gameData.monsters || !gameData.monsters[objective.monster]) return false;
    if (!isApprovedDisposition(contentDisposition(this.runtime.world, objective.monster))) return false;
    if (this.runtime.contentDrift && typeof this.runtime.contentDrift.requiresRevalidation === 'function' && this.runtime.contentDrift.requiresRevalidation('maps', objective.map)) return false;
    return true;
  }

  _makeRegroupObjective(snapshot, team) {
    const c = snapshot && snapshot.character;
    if (!c || team.selfName !== team.leaderName || !c.map || !Number.isFinite(Number(c.x)) || !Number.isFinite(Number(c.y))) return null;
    const existing = this.parent && this.parent[SHARED_OBJECTIVE];
    if (existing && this._objectiveKind(existing) === TEAM_REGROUP_KIND && existing.expiresAt > this.now() && String(existing.leaderName) === String(team.leaderName) && String(existing.map) === String(c.map)) {
      const delta = Math.hypot(Number(existing.x) - Number(c.x), Number(existing.y) - Number(c.y));
      if (Number.isFinite(delta) && delta <= 80) return clone(existing);
    }
    const createdAt = this.now();
    const objective = {
      id: `alpha28-regroup-${createdAt}-${team.leaderName}`,
      kind: TEAM_REGROUP_KIND,
      leaderName: team.leaderName,
      partyFingerprint: null,
      map: String(c.map),
      monster: null,
      spawnIndex: null,
      x: Number(c.x),
      y: Number(c.y),
      createdAt,
      expiresAt: createdAt + this.regroupObjectiveTtlMs,
      readiness: null,
      crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
    };
    if (!this._objectiveValid(objective, team)) return null;
    if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(objective);
    return objective;
  }

  _publishRegroup(team, objective) {
    if (!objective) return false;
    if (this.now() - this.lastRegroupPublishAt < this.regroupPublishIntervalMs) return true;
    this.lastRegroupPublishAt = this.now();
    if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(objective);
    this._publishCrossMap(team, objective);
    this.stats.crossMapObjectivesPublished += 1;
    this.stats.crossMapRegroupObjectivesPublished = (this.stats.crossMapRegroupObjectivesPublished || 0) + 1;
    this.event('ALPHA28_TEAM_REGROUP_OBJECTIVE_PUBLISHED', 'warn', 'TEAM_MAP_SPLIT_CONTROLLED_REGROUP', { objective: clone(objective), memberMaps: (team.members || []).map((row) => ({ name: row.name, map: row.map })) });
    return true;
  }

  _makeLeaderObjective(snapshot, team) {
    const farmer = this.runtime.farmer;
    const material = farmer && farmer.materialObjective;
    if (material && material.expiresAt > this.now() && material.map && material.monster && material.map !== snapshot.character.map) {
      const existing = this.parent && this.parent[SHARED_OBJECTIVE];
      if (existing && this._objectiveKind(existing) === 'ELIXIR_MATERIAL' && existing.expiresAt > this.now() && existing.map === material.map && existing.monster === material.monster && String(existing.leaderName) === String(team.leaderName)) return existing;
      const objective = {
        id: `alpha28-elixir-material-${this.now()}-${material.monster}`,
        kind: 'ELIXIR_MATERIAL',
        leaderName: team.leaderName,
        partyFingerprint: null,
        map: material.map,
        monster: material.monster,
        spawnIndex: material.spawnIndex,
        x: material.x,
        y: material.y,
        material: material.material || null,
        elixirName: material.elixirName || null,
        createdAt: this.now(),
        expiresAt: material.expiresAt,
        readiness: null,
        crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
      };
      if (!this._objectiveValid(objective, team)) return null;
      if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(objective);
      this._publishCrossMap(team, objective);
      this.stats.crossMapObjectivesPublished += 1;
      this.event('ALPHA28_CROSS_MAP_OBJECTIVE_PUBLISHED', 'warn', 'ELIXIR_MATERIAL_FARM_TRAVEL_AUTHORIZED', { objective: clone(objective) });
      return objective;
    }

    const progression = this._progression();
    const decision = progression && progression.lastDecision;
    const selected = decision && decision.action === 'RECOMMEND' && decision.reason === 'CROSS_MAP_PROGRESSION_REQUIRES_AUTHORIZED_FARMER_TRAVEL' ? decision.target : null;
    if (!selected || selected.map === snapshot.character.map) return null;
    const existing = this.parent && this.parent[SHARED_OBJECTIVE];
    if (existing && this._objectiveKind(existing) === PROGRESSION_KIND && existing.expiresAt > this.now() && existing.map === selected.map && existing.monster === selected.monster && String(existing.leaderName) === String(team.leaderName)) return existing;
    const objective = {
      id: `alpha28-crossmap-${this.now()}-${selected.id}`,
      kind: PROGRESSION_KIND,
      leaderName: team.leaderName,
      partyFingerprint: progression && progression._party ? progression._party(snapshot).fingerprint : null,
      map: selected.map,
      monster: selected.monster,
      spawnIndex: selected.spawnIndex,
      x: selected.x,
      y: selected.y,
      createdAt: this.now(),
      expiresAt: this.now() + Math.max(60000, finite(progression && progression.options && progression.options.objectiveTtlMs, 300000)),
      readiness: clone(selected.readiness),
      crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
    };
    if (!this._objectiveValid(objective, team)) return null;
    if (progression && typeof progression._publish === 'function') progression._publish(team, objective);
    else if (this.parent) this.parent[SHARED_OBJECTIVE] = clone(objective);
    this._publishCrossMap(team, objective);
    this.stats.crossMapObjectivesPublished += 1;
    this.event('ALPHA28_CROSS_MAP_OBJECTIVE_PUBLISHED', 'warn', 'LIVE_READINESS_AND_CONTROLLED_TRAVEL_AUTHORIZED', { objective: clone(objective) });
    return objective;
  }

  _sharedObjective(team) {
    if (this._objectiveValid(this.receivedObjective, team)) return clone(this.receivedObjective);
    const objective = this.parent && this.parent[SHARED_OBJECTIVE];
    return this._objectiveValid(objective, team) ? clone(objective) : null;
  }

  _startControlled(plan) {
    const controller = this.runtime.safeTravel;
    if (!controller) return { started: false, reason: 'SAFE_TRAVEL_UNAVAILABLE' };
    if (typeof controller.startControlled === 'function') return controller.startControlled(plan.id);
    const row = controller.plans && controller.plans.get(String(plan.id));
    if (!row || row.state !== 'PLANNED') return { started: false, reason: 'PLAN_NOT_STARTABLE' };
    if (controller.breaker().open) return { started: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    row.state = 'TRAVELLING'; row.updatedAt = this.now(); row.lastProgressAt = row.updatedAt; row.reason = 'ALPHA28_FARMER_CONTROLLED_EXECUTION_STARTED';
    controller.stats.controlledStarts = (controller.stats.controlledStarts || 0) + 1;
    return { started: true, plan: clone(row) };
  }

  _snapshot() {
    const c = this.root.character || {};
    return { observedAt: this.now(), character: { name: c.name, ctype: c.ctype || c.type, map: c.map, x: c.x != null ? c.x : c.real_x, y: c.y != null ? c.y : c.real_y, real_x: c.real_x, real_y: c.real_y, hp: c.hp, max_hp: c.max_hp, rip: c.rip === true } };
  }
  _failSafe(planId, reason) {
    const controller = this.runtime.safeTravel;
    if (!controller) return false;
    if (typeof controller.failSafe === 'function') return controller.failSafe(planId, reason);
    const row = controller.plans && typeof controller.plans.get === 'function' ? controller.plans.get(String(planId)) : null;
    if (!row || ['COMPLETED', 'ABORTED', 'FAILED_SAFE'].includes(String(row.state || ''))) return false;
    row.state = 'FAILED_SAFE';
    row.reason = String(reason || 'FARMER_TRAVEL_FAILED_SAFE');
    row.updatedAt = this.now();
    controller.stats.failedSafe = (controller.stats.failedSafe || 0) + 1;
    if (typeof controller._failure === 'function') controller._failure(row.reason, row);
    if (typeof controller._event === 'function') controller._event('TRAVEL_FAILED_SAFE', 'error', row.reason, { planId: row.id, alpha28FarmerCrossMap: true });
    return true;
  }

  async _execute(objective, snapshot) {
    const controller = this.runtime.safeTravel;
    if (!controller || typeof controller.plan !== 'function') return false;
    const runtimeAdapter = this.runtime.adapter;
    const adapter = runtimeAdapter && typeof runtimeAdapter.command === 'function'
      ? runtimeAdapter
      : new GameAdapter({
        root: this.root,
        parent: this.parent,
        log: this.log,
        now: this.now,
        mode: String(runtimeAdapter && runtimeAdapter.mode || '') === 'active' ? 'active' : 'shadow'
      });
    const regroup = this._objectiveKind(objective) === TEAM_REGROUP_KIND;
    const destinationMapAttestation = regroup ? {
      map: objective.map,
      trusted: true,
      source: 'trusted-party-regroup-leader',
      observedAt: objective.createdAt,
      maxAgeMs: Math.min(30000, Math.max(1000, Number(objective.expiresAt) - Number(objective.createdAt))),
      subject: objective.leaderName
    } : null;
    const planned = controller.plan({ destination: { map: objective.map, x: objective.x, y: objective.y }, metadata: { alpha28FarmerCrossMap: true, objectiveId: objective.id, objectiveKind: this._objectiveKind(objective), leaderName: objective.leaderName, monster: objective.monster || null } }, { snapshot, gameData: this.runtime.adapter.getGameData() || {}, contentDrift: this.runtime.contentDrift, destinationMapAttestation });
    if (!planned || !planned.accepted || !planned.plan) { this.lastAction = { at: this.now(), result: 'REJECTED', reason: planned && planned.reason || 'TRAVEL_PLAN_REJECTED', objectiveId: objective.id }; return false; }
    const plan = planned.plan;
    const started = this._startControlled(plan);
    if (!started || !started.started) { this.lastAction = { at: this.now(), result: 'REJECTED', reason: started && started.reason || 'PLAN_NOT_STARTABLE', objectiveId: objective.id }; return false; }
    if (!adapter || typeof adapter.command !== 'function'
      || (typeof adapter.canCommand === 'function' && (!adapter.canCommand('smart_move') || !adapter.canCommand('stop')))) {
      this._failSafe(plan.id, 'SMART_MOVE_OR_STOP_API_UNAVAILABLE');
      return false;
    }
    this.busy = true; this.activePlanId = plan.id; this.activeObjectiveId = objective.id; this.stats.crossMapTravelAttempts += 1;
    if (regroup) this.stats.crossMapRegroupTravelAttempts = (this.stats.crossMapRegroupTravelAttempts || 0) + 1;
    this.event(regroup ? 'ALPHA28_TEAM_REGROUP_STARTED' : 'ALPHA28_FARMER_CROSS_MAP_STARTED', 'warn', regroup ? 'CONTROLLED_TEAM_REGROUP_TRAVEL' : 'CONTROLLED_FARMER_TRAVEL', { planId: plan.id, objectiveId: objective.id, destination: plan.target });
    let timer;
    try {
      const timeout = new Promise((_, reject) => { timer = (this.root.setTimeout || setTimeout)(() => reject(new Error('FARMER_SMART_MOVE_TIMEOUT')), this.timeoutMs); });
      const smartMoveCommand = adapter.command('smart_move', [{ map: objective.map, x: objective.x, y: objective.y }]);
      if (!smartMoveCommand.executed) throw new Error(smartMoveCommand.reason || (smartMoveCommand.shadow ? 'RUNTIME_NOT_ACTIVE' : 'SMART_MOVE_COMMAND_REJECTED'));
      let routeResponse = null;
      const routeFailurePromise = Promise.resolve(smartMoveCommand.value).then((response) => {
        routeResponse = response;
        if (response && response.failed === true) throw new Error(String(response.reason || 'SMART_MOVE_FAILED'));
        // A resolved/undefined smart_move return is not arrival evidence.
        // Keep this branch pending and let observed SafeTravel state decide.
        return new Promise(() => {});
      });
      routeFailurePromise.catch(() => {});
      const pollMs = 100;
      const setTimer = this.root.setTimeout || setTimeout;
      const observedArrival = (async () => {
        while (this.busy && this.activePlanId === plan.id) {
          controller.observe(this._snapshot());
          const current = controller.get(plan.id);
          if (current && current.state === 'COMPLETED') return { success: true, observedArrival: true };
          if (current && ['FAILED_SAFE', 'ABORTED'].includes(String(current.state || ''))) {
            throw new Error(current.reason || 'FARMER_TRAVEL_TERMINATED_BEFORE_ARRIVAL');
          }
          await new Promise((resolve) => setTimer(resolve, pollMs));
        }
        return null;
      })();
      const arrival = await Promise.race([routeFailurePromise, observedArrival, timeout]);
      const response = routeResponse == null ? arrival : routeResponse;
      const final = controller.get(plan.id);
      if (!final || final.state !== 'COMPLETED') throw new Error('ARRIVAL_VERIFICATION_FAILED');
      this.stats.crossMapTravelCompleted += 1;
      if (regroup) this.stats.crossMapRegroupTravelCompleted = (this.stats.crossMapRegroupTravelCompleted || 0) + 1;
      this.lastAction = { at: this.now(), result: 'COMPLETED', planId: plan.id, objectiveId: objective.id, objectiveKind: this._objectiveKind(objective), map: objective.map, monster: objective.monster || null };
      if (!regroup && this._objectiveKind(objective) === PROGRESSION_KIND) {
        const progression = this._progression();
        if (progression) { progression.objective = clone(objective); progression.lastSwitchAt = this.now(); progression.stats.promotions += 1; }
      }
      if (this.runtime.localFarming && typeof this.runtime.localFarming._abort === 'function') this.runtime.localFarming._abort(regroup ? 'ALPHA28_TEAM_REGROUP_ARRIVED_REPLAN' : 'ALPHA28_CROSS_MAP_ARRIVED_REPLAN', this.now(), { objectiveId: objective.id });
      this.event(regroup ? 'ALPHA28_TEAM_REGROUP_COMPLETED' : 'ALPHA28_FARMER_CROSS_MAP_COMPLETED', 'info', 'ARRIVAL_VERIFIED', clone(this.lastAction));
      return true;
    } catch (error) {
      const reason = String(error && error.message || error || 'FARMER_TRAVEL_FAILED');
      try {
        const stopCommand = adapter.command('stop', ['smart']);
        if (stopCommand.executed) await Promise.resolve(stopCommand.value);
      } catch (_) {}
      this._failSafe(plan.id, reason);
      this.stats.crossMapTravelFailedSafe += 1;
      if (regroup) this.stats.crossMapRegroupTravelFailedSafe = (this.stats.crossMapRegroupTravelFailedSafe || 0) + 1;
      this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason, planId: plan.id, objectiveId: objective.id, objectiveKind: this._objectiveKind(objective) };
      this.event(regroup ? 'ALPHA28_TEAM_REGROUP_FAILED_SAFE' : 'ALPHA28_FARMER_CROSS_MAP_FAILED_SAFE', 'error', reason, clone(this.lastAction));
      return false;
    } finally {
      if (timer != null) (this.root.clearTimeout || clearTimeout)(timer);
      this.busy = false; this.activePlanId = null; this.activeObjectiveId = null;
    }
  }

  tick() {
    this.patchProgressionStatus();
    this._ensureReceiver();
    if (this.busy) return false;
    const snapshot = this.runtime.lastSnapshot;
    const c = snapshot && snapshot.character;
    if (!c || String(c.ctype || '').toLowerCase() === 'merchant' || String(this.runtime.adapter && this.runtime.adapter.mode || '') !== 'active') return false;
    if (!this._supervisorAllowed() || this._inCombat(snapshot)) return false;
    const team = this._team(snapshot);
    if (!team || !team.complete || !team.alive || !team.positionsKnown) return false;
    const isLeader = team.selfName === team.leaderName;

    if (!team.sameMap) {
      if (isLeader) {
        const regroup = this._makeRegroupObjective(snapshot, team);
        if (!regroup) return false;
        this._publishRegroup(team, regroup);
        this.lastAction = { at: this.now(), result: 'PUBLISHED', reason: 'TEAM_MAP_SPLIT_CONTROLLED_REGROUP', objectiveId: regroup.id, objectiveKind: TEAM_REGROUP_KIND, map: regroup.map };
        return true;
      }
      const regroup = this._sharedObjective(team);
      if (!regroup || this._objectiveKind(regroup) !== TEAM_REGROUP_KIND || regroup.map === c.map) return false;
      if (this.lastAction && this.lastAction.objectiveId === regroup.id && ['COMPLETED','FAILED_SAFE'].includes(this.lastAction.result)) return false;
      Promise.resolve(this._execute(regroup, snapshot)).catch((error) => {
        this.stats.crossMapTravelFailedSafe += 1;
        this.stats.crossMapRegroupTravelFailedSafe = (this.stats.crossMapRegroupTravelFailedSafe || 0) + 1;
        this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason: String(error && error.message || error).slice(0, 220), objectiveId: regroup.id, objectiveKind: TEAM_REGROUP_KIND };
      });
      return true;
    }

    if (!team.cohesive) return false;
    const objective = isLeader ? this._makeLeaderObjective(snapshot, team) : this._sharedObjective(team);
    if (!objective || this._objectiveKind(objective) === TEAM_REGROUP_KIND || objective.map === c.map) return false;
    if (this.lastAction && this.lastAction.objectiveId === objective.id && ['COMPLETED','FAILED_SAFE'].includes(this.lastAction.result)) return false;
    Promise.resolve(this._execute(objective, snapshot)).catch((error) => {
      this.stats.crossMapTravelFailedSafe += 1;
      this.lastAction = { at: this.now(), result: 'FAILED_SAFE', reason: String(error && error.message || error).slice(0, 220), objectiveId: objective.id };
    });
    return true;
  }

  status() {
    return { automaticCrossMapFarmerProgression: true, automaticCrossMapTeamRegroup: true, directAlpha21SmartMoveAuthority: false, controlledFarmerSmartMoveAuthority: true, leaderOwnsObjective: true, leaderPublishesRegroupWhenMapSplit: true, followersOnlyFollowValidatedLeaderObjective: true, crossMapReceiverInstalled: this.receiverInstalled, busy: this.busy, activePlanId: this.activePlanId, activeObjectiveId: this.activeObjectiveId, lastAction: clone(this.lastAction) };
  }
}

module.exports = { Alpha28CrossMapFarmerProgression, SHARED_OBJECTIVE, CROSS_MAP_RECEIVER, TEAM_REGROUP_KIND, PROGRESSION_KIND };