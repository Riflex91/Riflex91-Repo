'use strict';

const TEAM_COMBAT_COHESION_MODE = 'cohesion-first-team-combat-v1';

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ratio(value, max) {
  const denominator = finite(max);
  if (denominator == null || denominator <= 0) return null;
  return Math.max(0, Math.min(1, (finite(value) || 0) / denominator));
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function lower(value) { return String(value == null ? '' : value).trim().toLowerCase(); }

class TeamCombatCohesionHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer || !runtime.localFarming) throw new Error('runtime farmer and localFarming required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.localFarming = runtime.localFarming;
    this.root = runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.resourceTopoff = options.resourceTopoff || runtime.farmerResourceTopoffHotfix || null;
    this.requiredCombatMembers = Math.max(2, Math.min(3, Number(options.requiredCombatMembers) || 3));
    this.cohesionRadius = Math.max(90, Math.min(220, Number(options.cohesionRadius) || 150));
    this.followRadius = Math.max(45, Math.min(this.cohesionRadius - 15, Number(options.followRadius) || 85));
    this.kiteFormationRadius = Math.max(this.followRadius, Math.min(this.cohesionRadius, Number(options.kiteFormationRadius) || 100));
    this.followStep = Math.max(25, Math.min(100, Number(options.followStep) || 70));
    this.followCooldownMs = Math.max(500, Number(options.followCooldownMs) || 850);
    this.minNewFightHpRatio = Math.max(0.65, Math.min(0.99, Number(options.minNewFightHpRatio) || 0.90));
    this.minNewFightMpRatio = Math.max(0.20, Math.min(0.99, Number(options.minNewFightMpRatio) || 0.75));
    this.maxNewTargetHpVsTeam = Math.max(0.5, Math.min(3, Number(options.maxNewTargetHpVsTeam) || 1.25));
    this.lastFormationMoveAt = -Infinity;
    this.lastDecision = null;
    this.lastTeam = null;
    this.stats = {
      targetSelections: 0,
      leaderSelections: 0,
      followerMirrors: 0,
      sharedAggroSelections: 0,
      soloTargetBlocks: 0,
      oversizedTargetBlocks: 0,
      incompleteTeamBlocks: 0,
      cohesionBlocks: 0,
      supplyBlocks: 0,
      recoveryBlocks: 0,
      followerMoves: 0,
      followerHolds: 0,
      leaderHolds: 0,
      kiteCohesionBlocks: 0,
      localFarmFollowerSuppressed: 0,
      localFarmLeaderWaits: 0,
      combatFormationHolds: 0,
      hardKiteTetherBlocks: 0,
      hardKiteTetherRecoveryMoves: 0
    };
    this.installed = false;
    this._tuneKiting();
    this._installTargetSelection();
    this._installCombatMovementGates();
    this._installLocalFarmTeamMovement();
    this._installKitingCohesionGuard();
    this.installed = true;
    this._event('TEAM_COMBAT_COHESION_INSTALLED', 'info', null, this._configStatus());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'team-combat-cohesion', event, severity, reason, data }); } catch (_) {}
  }

  _configStatus() {
    return {
      requiredCombatMembers: this.requiredCombatMembers,
      cohesionRadius: this.cohesionRadius,
      followRadius: this.followRadius,
      kiteFormationRadius: this.kiteFormationRadius,
      minNewFightHpRatio: this.minNewFightHpRatio,
      minNewFightMpRatio: this.minNewFightMpRatio,
      maxNewTargetHpVsTeam: this.maxNewTargetHpVsTeam,
      kiteTooCloseFactor: 0.52,
      kiteDesiredFactor: 0.70,
      kiteMaxStepFactor: 0.32
    };
  }

  _trustedNames() {
    const bootstrap = this.runtime.partyBootstrap;
    if (bootstrap && typeof bootstrap.trustedRosterNames === 'function') {
      try { return new Set((bootstrap.trustedRosterNames() || []).map(String)); } catch (_) {}
    }
    return null;
  }

  _rawParty() {
    const party = this.parent && this.parent.party || this.root && this.root.party || {};
    return party && typeof party === 'object' ? party : {};
  }

  _visiblePlayer(snapshot, name) {
    return (snapshot && snapshot.entities || []).find((entity) => entity && entity.name === name && !entity.mtype) || null;
  }

  _member(snapshot, name, typeHint) {
    const raw = this._rawParty()[name] || {};
    const visible = this._visiblePlayer(snapshot, name) || {};
    const self = snapshot && snapshot.character && snapshot.character.name === name ? snapshot.character : null;
    const source = self || {};
    const read = (key, alt) => {
      if (source[key] != null) return source[key];
      if (raw[key] != null) return raw[key];
      if (alt && raw[alt] != null) return raw[alt];
      if (visible[key] != null) return visible[key];
      return null;
    };
    return {
      name,
      ctype: source.ctype || raw.ctype || raw.type || typeHint || visible.ctype || visible.type || null,
      map: source.map || raw.map || visible.map || null,
      x: finite(read('x', 'real_x')),
      y: finite(read('y', 'real_y')),
      hp: finite(read('hp')),
      max_hp: finite(read('max_hp')),
      mp: finite(read('mp')),
      max_mp: finite(read('max_mp')),
      target: read('target'),
      rip: source.rip === true || raw.rip === true || raw.dead === true || visible.dead === true,
      self: !!self
    };
  }

  _combatMembers(snapshot) {
    if (!snapshot || !snapshot.character) return [];
    const trusted = this._trustedNames();
    const typeByName = new Map();
    for (const row of snapshot.party || []) if (row && row.name) typeByName.set(String(row.name), row.type || row.ctype || null);
    typeByName.set(String(snapshot.character.name), snapshot.character.ctype || null);
    for (const [name, raw] of Object.entries(this._rawParty())) {
      if (!typeByName.has(name)) typeByName.set(name, raw && (raw.type || raw.ctype) || null);
    }
    const rows = [];
    for (const [name, type] of typeByName.entries()) {
      if (trusted && !trusted.has(name)) continue;
      const member = this._member(snapshot, name, type);
      if (lower(member.ctype) === 'merchant') continue;
      rows.push(member);
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }

  _team(snapshot) {
    const members = this._combatMembers(snapshot);
    const selfName = snapshot && snapshot.character && snapshot.character.name || null;
    const leader = members[0] || null;
    const self = members.find((row) => row.name === selfName) || null;
    const complete = members.length === this.requiredCombatMembers;
    const alive = complete && members.every((row) => !row.rip);
    const sameMap = complete && members.every((row) => !row.map || !snapshot.character.map || row.map === snapshot.character.map);
    const positionsKnown = complete && members.every((row) => finite(row.x) != null && finite(row.y) != null);
    let maxPairDistance = Infinity;
    if (positionsKnown) {
      maxPairDistance = 0;
      for (let i = 0; i < members.length; i += 1) {
        for (let j = i + 1; j < members.length; j += 1) maxPairDistance = Math.max(maxPairDistance, distance(members[i], members[j]));
      }
    }
    const cohesive = complete && alive && sameMap && positionsKnown && maxPairDistance <= this.cohesionRadius;
    const knownHpRatios = members.map((row) => ratio(row.hp, row.max_hp)).filter((value) => value != null);
    const knownMpRatios = members.map((row) => ratio(row.mp, row.max_mp)).filter((value) => value != null);
    const healthReady = knownHpRatios.every((value) => value >= this.minNewFightHpRatio);
    const manaReady = knownMpRatios.every((value) => value >= this.minNewFightMpRatio);
    const leaderTargetId = leader && leader.target != null ? String(leader.target) : null;
    const state = {
      members,
      names: members.map((row) => row.name),
      self,
      selfName,
      leader,
      leaderName: leader && leader.name || null,
      leaderTargetId,
      complete,
      alive,
      sameMap,
      positionsKnown,
      maxPairDistance,
      cohesive,
      healthReady,
      manaReady,
      resourcesKnown: knownHpRatios.length + knownMpRatios.length,
      at: this.now()
    };
    this.lastTeam = state;
    this._syncOrbitDirection(state);
    return state;
  }

  _syncOrbitDirection(team) {
    const terrain = this.runtime.farmerTerrainNavigationHotfix;
    if (!terrain || !terrain.orbitDirectionByCharacter || !team || !team.leaderName || !team.selfName) return;
    let hash = 0;
    for (const ch of String(team.leaderName)) hash = ((hash * 31) + ch.charCodeAt(0)) | 0;
    terrain.orbitDirectionByCharacter.set(team.selfName, (Math.abs(hash) % 2) ? 1 : -1);
  }

  _localSupply(snapshot) {
    if (!this.resourceTopoff || typeof this.resourceTopoff.supply !== 'function') return { ready: true, hpReady: true, mpReady: true, hpPotions: null, mpPotions: null };
    return this.resourceTopoff.supply(snapshot);
  }

  _teamBlockReason(snapshot, team, requireResources = true) {
    if (!team.complete) return 'TEAM_INCOMPLETE';
    if (!team.alive) return 'TEAM_MEMBER_DEAD';
    if (!team.sameMap) return 'TEAM_MAP_SPLIT';
    if (!team.positionsKnown) return 'TEAM_POSITION_UNKNOWN';
    if (!team.cohesive) return 'TEAM_NOT_COHESIVE';
    const supply = this._localSupply(snapshot);
    if (requireResources && !supply.ready) return 'LOCAL_POTION_SUPPLY_INCOMPLETE';
    if (!team.healthReady) return 'TEAM_HP_TOPOFF_REQUIRED';
    if (!team.manaReady) return 'TEAM_MP_TOPOFF_REQUIRED';
    return null;
  }

  _candidateAllowed(context, target) {
    if (!target || !this.farmer || typeof this.farmer._safeLiveMonsters !== 'function') return false;
    const rows = this.farmer._safeLiveMonsters(context.snapshot, context.party);
    return Array.isArray(rows) && rows.some((row) => row && String(row.id) === String(target.id));
  }

  _isSharedAggroTarget(context, team, target) {
    if (!target || !target.target || !team || !team.names.includes(String(target.target))) return false;
    return this._candidateAllowed(context, target);
  }

  _sharedAggro(context, team) {
    const names = new Set(team.names);
    const candidates = (this.farmer._safeLiveMonsters(context.snapshot, context.party) || [])
      .filter((entity) => entity && entity.target && names.has(String(entity.target)))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return candidates[0] || null;
  }

  _oversizedNewTarget(target, team) {
    if (!target || target.target) return false;
    const maxHps = team.members.map((row) => finite(row.max_hp)).filter((value) => value != null && value > 0);
    if (maxHps.length !== team.members.length) return false;
    const combined = maxHps.reduce((sum, value) => sum + value, 0);
    const targetHp = finite(target.max_hp);
    return targetHp != null && combined > 0 && targetHp > combined * this.maxNewTargetHpVsTeam;
  }

  _installTargetSelection() {
    if (this.farmer.__teamCohesionTargetSelectionInstalled) return;
    const baseSelect = this.farmer._selectTarget.bind(this.farmer);
    this.farmer._selectTarget = (context) => {
      this.stats.targetSelections += 1;
      const snapshot = context && context.snapshot;
      const team = this._team(snapshot);
      if (!team.self || lower(team.self.ctype) === 'merchant') return null;
      const block = this._teamBlockReason(snapshot, team, true);
      if (block) {
        if (block === 'TEAM_NOT_COHESIVE') this.stats.cohesionBlocks += 1;
        else if (block === 'LOCAL_POTION_SUPPLY_INCOMPLETE') this.stats.supplyBlocks += 1;
        else if (block === 'TEAM_HP_TOPOFF_REQUIRED' || block === 'TEAM_MP_TOPOFF_REQUIRED') this.stats.recoveryBlocks += 1;
        else this.stats.incompleteTeamBlocks += 1;
        this.lastDecision = { at: this.now(), action: 'TARGET_HOLD', reason: block, leaderName: team.leaderName, maxPairDistance: team.maxPairDistance };
        return null;
      }

      const sharedAggro = this._sharedAggro(context, team);
      if (sharedAggro) {
        this.stats.sharedAggroSelections += 1;
        this.lastDecision = { at: this.now(), action: 'TARGET_SHARED_AGGRO', reason: 'PARTY_MEMBER_UNDER_ATTACK', targetId: String(sharedAggro.id), targetType: sharedAggro.mtype, leaderName: team.leaderName };
        return { target: sharedAggro, ranking: { monster: sharedAggro.mtype, score: Number.MAX_SAFE_INTEGER, source: 'team-shared-aggro' } };
      }

      if (team.selfName !== team.leaderName) {
        if (!team.leaderTargetId) {
          this.stats.soloTargetBlocks += 1;
          this.lastDecision = { at: this.now(), action: 'TARGET_HOLD', reason: 'WAITING_FOR_TEAM_LEADER_TARGET', leaderName: team.leaderName };
          return null;
        }
        const leaderTarget = (snapshot.entities || []).find((entity) => entity && String(entity.id) === String(team.leaderTargetId));
        if (!leaderTarget || !this._candidateAllowed(context, leaderTarget)) {
          this.stats.soloTargetBlocks += 1;
          this.lastDecision = { at: this.now(), action: 'TARGET_HOLD', reason: 'LEADER_TARGET_NOT_LOCALLY_SAFE_OR_VISIBLE', leaderName: team.leaderName, targetId: team.leaderTargetId };
          return null;
        }
        this.stats.followerMirrors += 1;
        this.lastDecision = { at: this.now(), action: 'TARGET_MIRROR', reason: 'TEAM_LEADER_TARGET', leaderName: team.leaderName, targetId: String(leaderTarget.id), targetType: leaderTarget.mtype };
        return { target: leaderTarget, ranking: { monster: leaderTarget.mtype, score: Number.MAX_SAFE_INTEGER - 1, source: 'team-leader-target' } };
      }

      const selection = baseSelect(context);
      if (!selection || !selection.target) return selection;
      if (this._oversizedNewTarget(selection.target, team)) {
        this.stats.oversizedTargetBlocks += 1;
        this.lastDecision = { at: this.now(), action: 'TARGET_HOLD', reason: 'NEW_TARGET_TOO_LARGE_FOR_ROUTINE_TEAM_PULL', targetId: String(selection.target.id), targetType: selection.target.mtype, targetMaxHp: selection.target.max_hp };
        this._event('TEAM_NEW_TARGET_REJECTED', 'warn', 'NEW_TARGET_TOO_LARGE_FOR_ROUTINE_TEAM_PULL', { ...this.lastDecision });
        return null;
      }
      this.stats.leaderSelections += 1;
      this.lastDecision = { at: this.now(), action: 'TARGET_LEADER_SELECT', reason: 'TEAM_COHESIVE', leaderName: team.leaderName, targetId: String(selection.target.id), targetType: selection.target.mtype };
      return selection;
    };
    this.farmer.__teamCohesionTargetSelectionInstalled = true;
  }

  _canMoveTo(x, y) {
    const fn = this.root && this.root.can_move_to || this.parent && this.parent.can_move_to;
    if (typeof fn !== 'function') return true;
    try { return fn.call(this.root, x, y) !== false; } catch (_) { return false; }
  }

  _followWaypoint(character, leader) {
    const d = distance(character, leader);
    if (!Number.isFinite(d) || d <= this.followRadius) return null;
    const cx = Number(character.x);
    const cy = Number(character.y);
    const angle = Math.atan2(Number(leader.y) - cy, Number(leader.x) - cx);
    const travel = Math.max(0, d - this.followRadius * 0.75);
    const step = Math.min(this.followStep, travel);
    if (step < 2) return null;
    const offsets = [0, 20, -20, 35, -35, 50, -50, 70, -70, 90, -90];
    for (const offsetDeg of offsets) {
      const a = angle + offsetDeg * Math.PI / 180;
      const x = cx + Math.cos(a) * step;
      const y = cy + Math.sin(a) * step;
      if (this._canMoveTo(x, y)) return { x, y, step, offsetDeg, distance: d };
    }
    return null;
  }

  _activeTeamCombat(context, team) {
    const snapshot = context && context.snapshot || this.runtime.lastSnapshot;
    if (!snapshot || !team) return null;
    const names = new Set(Array.isArray(team.names) ? team.names.map(String) : []);
    const targetIds = new Set((Array.isArray(team.members) ? team.members : [])
      .map((member) => member && member.target != null ? String(member.target) : null)
      .filter(Boolean));
    return (snapshot.entities || []).find((entity) => entity
      && entity.mtype
      && !entity.dead
      && !entity.rip
      && (entity.hp == null || Number(entity.hp) > 0)
      && (
        (entity.target != null && names.has(String(entity.target)))
        || (entity.id != null && targetIds.has(String(entity.id)))
      )) || null;
  }

  _isActiveTeamCombatTarget(context, team, target) {
    if (!target || target.dead || target.rip || (target.hp != null && Number(target.hp) <= 0)) return false;
    const names = new Set(Array.isArray(team && team.names) ? team.names.map(String) : []);
    if (target.target != null && names.has(String(target.target))) return this._candidateAllowed(context, target);
    const id = target.id == null ? null : String(target.id);
    if (!id) return false;
    const targetedByParty = (Array.isArray(team && team.members) ? team.members : [])
      .some((member) => member && member.target != null && String(member.target) === id);
    return targetedByParty && this._candidateAllowed(context, target);
  }

  _followLeader(context, team, reason) {
    if (!team || !team.self || !team.leader || team.selfName === team.leaderName) return false;
    const activeCombat = this._activeTeamCombat(context, team);
    if (activeCombat) {
      this.stats.combatFormationHolds += 1;
      this.lastDecision = {
        at: this.now(),
        action: 'FORMATION_HOLD',
        reason: 'ACTIVE_COMBAT_POSITION_OWNED_BY_COMBAT',
        requestedReason: reason || null,
        leaderName: team.leaderName,
        targetId: activeCombat.id == null ? null : String(activeCombat.id),
        aggroOwner: activeCombat.target == null ? null : String(activeCombat.target),
        distance: distance(team.self, team.leader)
      };
      return true;
    }
    if (this.now() - this.lastFormationMoveAt < this.followCooldownMs) return true;
    const waypoint = this._followWaypoint(team.self, team.leader);
    if (!waypoint) {
      this.stats.followerHolds += 1;
      this.lastDecision = { at: this.now(), action: 'FORMATION_HOLD', reason: reason || 'LEADER_WITHIN_FOLLOW_RADIUS', leaderName: team.leaderName, distance: distance(team.self, team.leader) };
      return true;
    }
    const result = context && context.adapter && typeof context.adapter.command === 'function'
      ? context.adapter.command('move', [waypoint.x, waypoint.y])
      : { executed: false, reason: 'ADAPTER_UNAVAILABLE' };
    this.lastFormationMoveAt = this.now();
    if (result.executed || result.shadow || result.coalesced) this.stats.followerMoves += 1;
    this.lastDecision = { at: this.now(), action: 'FORMATION_FOLLOW', reason: reason || 'REGROUP_WITH_TEAM_LEADER', leaderName: team.leaderName, distance: waypoint.distance, x: waypoint.x, y: waypoint.y, offsetDeg: waypoint.offsetDeg, executed: !!result.executed, resultReason: result.reason || null };
    this._event('TEAM_FORMATION_MOVE_REQUESTED', 'info', this.lastDecision.reason, { ...this.lastDecision });
    return true;
  }

  _combatGate(context, target, phase) {
    const snapshot = context && context.snapshot;
    const team = this._team(snapshot);
    if (!team.self) return { allowed: false, team, reason: 'LOCAL_COMBAT_MEMBER_NOT_FOUND' };
    const supply = this._localSupply(snapshot);
    if (!supply.ready) return { allowed: false, team, reason: 'LOCAL_POTION_SUPPLY_INCOMPLETE' };
    if (!team.complete || !team.alive || !team.sameMap || !team.positionsKnown) return { allowed: false, team, reason: 'TEAM_NOT_READY' };
    const activeTeamCombatTarget = this._isActiveTeamCombatTarget(context, team, target);
    if (!team.cohesive && !activeTeamCombatTarget) return { allowed: false, team, reason: 'TEAM_NOT_COHESIVE' };
    if (team.selfName !== team.leaderName) {
      const matchesLeader = !!(team.leaderTargetId && target && String(target.id) === String(team.leaderTargetId));
      const sharedAggro = this._isSharedAggroTarget(context, team, target);
      if (!matchesLeader && !sharedAggro && !activeTeamCombatTarget) return { allowed: false, team, reason: 'FOLLOWER_TARGET_DIFFERS_FROM_LEADER' };
    }
    return {
      allowed: true,
      team,
      reason: activeTeamCombatTarget && !team.cohesive ? 'ACTIVE_TEAM_COMBAT_CONTINUES_OUTSIDE_COHESION' : null,
      phase
    };
  }

  _installCombatMovementGates() {
    if (this.farmer.__teamCohesionCombatGateInstalled) return;
    const baseTravel = this.farmer._travel.bind(this.farmer);
    const baseEngage = this.farmer._engage.bind(this.farmer);
    this.farmer._travel = (context, target) => {
      if (this.resourceTopoff) this.resourceTopoff.topOff(context && context.snapshot, context && context.adapter);
      const gate = this._combatGate(context, target, 'TRAVEL');
      if (!gate.allowed) {
        if (gate.team && gate.team.selfName !== gate.team.leaderName) this._followLeader(context, gate.team, gate.reason);
        else this.stats.leaderHolds += 1;
        if (gate.reason === 'FOLLOWER_TARGET_DIFFERS_FROM_LEADER') {
          this.farmer._clearTarget('TEAM_TARGET_CHANGED');
          this.farmer._transition('REASSESS', 'TEAM_TARGET_CHANGED');
        }
        this.lastDecision = { ...(this.lastDecision || {}), at: this.now(), action: this.lastDecision && this.lastDecision.action === 'FORMATION_FOLLOW' ? this.lastDecision.action : 'COMBAT_HOLD', reason: gate.reason, phase: 'TRAVEL', leaderName: gate.team && gate.team.leaderName || null };
        return;
      }
      return baseTravel(context, target);
    };
    this.farmer._engage = (context, target) => {
      if (this.resourceTopoff) this.resourceTopoff.topOff(context && context.snapshot, context && context.adapter);
      const gate = this._combatGate(context, target, 'ENGAGE');
      if (!gate.allowed) {
        if (gate.team && gate.team.selfName !== gate.team.leaderName) this._followLeader(context, gate.team, gate.reason);
        else this.stats.leaderHolds += 1;
        if (gate.reason === 'FOLLOWER_TARGET_DIFFERS_FROM_LEADER') {
          this.farmer._clearTarget('TEAM_TARGET_CHANGED');
          this.farmer._transition('REASSESS', 'TEAM_TARGET_CHANGED');
        }
        this.lastDecision = { ...(this.lastDecision || {}), at: this.now(), action: this.lastDecision && this.lastDecision.action === 'FORMATION_FOLLOW' ? this.lastDecision.action : 'COMBAT_HOLD', reason: gate.reason, phase: 'ENGAGE', leaderName: gate.team && gate.team.leaderName || null };
        return;
      }
      return baseEngage(context, target);
    };
    this.farmer.__teamCohesionCombatGateInstalled = true;
  }

  _installLocalFarmTeamMovement() {
    if (this.localFarming.__teamCohesionInstalled) return;
    const baseTick = this.localFarming.tick.bind(this.localFarming);
    this.localFarming.tick = (context = {}) => {
      const snapshot = context.snapshot;
      if (!snapshot || !snapshot.character || lower(snapshot.character.ctype) === 'merchant') return { at: this.now(), action: 'HOLD', reason: 'MERCHANT_EXCLUDED_FROM_TEAM_FARM' };
      if (this.resourceTopoff) this.resourceTopoff.topOff(snapshot, context.runtime && context.runtime.adapter || this.runtime.adapter);
      const team = this._team(snapshot);
      const supply = this._localSupply(snapshot);
      if (!supply.ready) {
        this.stats.supplyBlocks += 1;
        if (team.selfName !== team.leaderName) this._followLeader({ ...context, adapter: this.runtime.adapter }, team, 'LOCAL_POTION_SUPPLY_INCOMPLETE');
        this.lastDecision = { ...(this.lastDecision || {}), at: this.now(), action: 'HOLD', reason: 'LOCAL_POTION_SUPPLY_INCOMPLETE', leaderName: team.leaderName, supply };
        return this.lastDecision;
      }
      if (!team.complete || !team.alive || !team.sameMap || !team.positionsKnown) {
        this.stats.incompleteTeamBlocks += 1;
        this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'TEAM_INCOMPLETE_OR_UNOBSERVABLE', leaderName: team.leaderName };
        return this.lastDecision;
      }
      if (team.selfName !== team.leaderName) {
        this.stats.localFarmFollowerSuppressed += 1;
        this._followLeader({ ...context, adapter: this.runtime.adapter }, team, team.cohesive ? 'FOLLOW_TEAM_LEADER' : 'REGROUP_WITH_TEAM_LEADER');
        if (!this.lastDecision || this.lastDecision.action !== 'FORMATION_FOLLOW') this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'FOLLOWER_DOES_NOT_OWN_FARM_DIRECTION', leaderName: team.leaderName };
        return this.lastDecision;
      }
      if (!team.cohesive || !team.healthReady || !team.manaReady) {
        this.stats.localFarmLeaderWaits += 1;
        const reason = !team.cohesive ? 'WAITING_FOR_TEAM_COHESION' : (!team.healthReady ? 'WAITING_FOR_TEAM_HP_TOPOFF' : 'WAITING_FOR_TEAM_MP_TOPOFF');
        this.lastDecision = { at: this.now(), action: 'HOLD', reason, leaderName: team.leaderName, maxPairDistance: team.maxPairDistance };
        return this.lastDecision;
      }
      return baseTick(context);
    };
    this.localFarming.__teamCohesionInstalled = true;
  }

  _tuneKiting() {
    const kiting = this.farmer && this.farmer.kiting;
    if (!kiting) return;
    kiting.tooCloseFactor = 0.52;
    kiting.desiredFactor = 0.70;
    kiting.maxStepFactor = 0.32;
  }

  _installKitingCohesionGuard() {
    const kiting = this.farmer && this.farmer.kiting;
    if (!kiting || typeof kiting.evaluate !== 'function' || kiting.__teamCohesionGuardInstalled) return;
    const baseEvaluate = kiting.evaluate.bind(kiting);
    kiting.evaluate = (character, target) => {
      const decision = baseEvaluate(character, target);
      if (!decision || !decision.shouldMove) return decision;
      const snapshot = this.runtime.lastSnapshot;
      const team = snapshot && snapshot.character ? this._team(snapshot) : null;
      if (!team || !team.complete || !team.positionsKnown || !team.self) return decision;
      const proposed = { x: decision.x, y: decision.y };
      const peers = team.members.filter((member) => member.name !== team.selfName);
      const currentMax = peers.reduce((max, member) => Math.max(max, distance(team.self, member)), 0);
      const proposedMax = peers.reduce((max, member) => Math.max(max, distance(proposed, member)), 0);
      const outsideHardTether = proposedMax > this.kiteFormationRadius;
      const recoveryMove = outsideHardTether
        && Number.isFinite(currentMax)
        && proposedMax + 0.5 < currentMax;
      if (outsideHardTether && !recoveryMove) {
        this.stats.kiteCohesionBlocks += 1;
        this.stats.hardKiteTetherBlocks += 1;
        this.lastDecision = {
          at: this.now(),
          action: 'KITE_HOLD',
          reason: 'TEAM_COHESION_KITE_LIMIT',
          targetId: target && target.id || null,
          leaderName: team.leaderName,
          currentMaxDistance: Number.isFinite(currentMax) ? currentMax : null,
          proposedMaxDistance: Number.isFinite(proposedMax) ? proposedMax : null,
          kiteFormationRadius: this.kiteFormationRadius
        };
        return { ...decision, shouldMove: false, reason: 'TEAM_COHESION_KITE_LIMIT', teamCohesionBlocked: true, hardTeamTether: true };
      }
      if (recoveryMove) this.stats.hardKiteTetherRecoveryMoves += 1;
      return { ...decision, hardTeamTether: true, hardTeamTetherRecoveryMove: recoveryMove };
    };
    kiting.__teamCohesionGuardInstalled = true;
  }

  status() {
    const team = this.runtime.lastSnapshot && this.runtime.lastSnapshot.character ? this._team(this.runtime.lastSnapshot) : this.lastTeam;
    return {
      schemaVersion: 1,
      mode: TEAM_COMBAT_COHESION_MODE,
      installed: this.installed,
      config: this._configStatus(),
      strategy: {
        deterministicLeader: true,
        followersNeverOpenNewTargets: true,
        followersDoNotOwnFarmDirection: true,
        sharedAggroBecomesTeamTarget: true,
        existingSafetyStillRequired: true,
        emergencyRetreatStillHasPriority: true,
        merchantExcluded: true,
        hardKiteTeamTether: true,
        formationMovementSuppressedDuringActiveSharedCombat: true,
        sharedAggroCombatMayContinueOutsideCohesionRadius: true
      },
      team: team ? {
        names: team.names,
        leaderName: team.leaderName,
        leaderTargetId: team.leaderTargetId,
        complete: team.complete,
        alive: team.alive,
        sameMap: team.sameMap,
        positionsKnown: team.positionsKnown,
        cohesive: team.cohesive,
        maxPairDistance: Number.isFinite(team.maxPairDistance) ? team.maxPairDistance : null,
        healthReady: team.healthReady,
        manaReady: team.manaReady
      } : null,
      lastDecision: this.lastDecision ? { ...this.lastDecision } : null,
      stats: { ...this.stats }
    };
  }
}

function installTeamCombatCohesionHotfix(runtime, options = {}) {
  return new TeamCombatCohesionHotfix(runtime, options);
}

module.exports = {
  TeamCombatCohesionHotfix,
  installTeamCombatCohesionHotfix,
  TEAM_COMBAT_COHESION_MODE
};
