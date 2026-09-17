'use strict';

const ALPHA31_PARTY_ROLE_LIVENESS_MODE = 'alpha31-party-role-liveness-v1';
const MERCHANT_TRAVEL_ATTESTATION_SOURCE = 'trusted-owned-merchant-service';

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function distance(a, b) {
  const ax = finite(a && (a.real_x != null ? a.real_x : a.x));
  const ay = finite(a && (a.real_y != null ? a.real_y : a.y));
  const bx = finite(b && (b.real_x != null ? b.real_x : b.x));
  const by = finite(b && (b.real_y != null ? b.real_y : b.y));
  if ([ax, ay, bx, by].some((value) => value == null)) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function characterOf(runtime) {
  const root = runtime && runtime.root;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function gameDataOf(runtime) {
  try {
    return runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
      ? runtime.adapter.getGameData() || {}
      : runtime && runtime.root && (runtime.root.G || runtime.root.parent && runtime.root.parent.G) || {};
  } catch (_) {
    return {};
  }
}

function liveMonster(entity) {
  return !!(entity && entity.mtype && !entity.dead && !entity.rip && (entity.hp == null || Number(entity.hp) > 0));
}

class Alpha31PartyRoleLivenessHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;

    this.orbitDesiredFactor = clamp(options.orbitDesiredFactor == null ? 0.80 : options.orbitDesiredFactor, 0.68, 0.90);
    this.orbitMaxRangeFactor = clamp(options.orbitMaxRangeFactor == null ? 0.92 : options.orbitMaxRangeFactor, this.orbitDesiredFactor, 0.96);
    this.orbitMonsterBuffer = Math.max(12, Math.min(60, finite(options.orbitMonsterBuffer, 20)));
    this.orbitSpeedBufferSeconds = clamp(options.orbitSpeedBufferSeconds == null ? 0.50 : options.orbitSpeedBufferSeconds, 0.20, 1.20);
    this.orbitStepSeconds = clamp(options.orbitStepSeconds == null ? 0.80 : options.orbitStepSeconds, 0.35, 1.30);

    this.regroupTriggerDistance = Math.max(90, finite(options.regroupTriggerDistance, 120));
    this.regroupStopDistance = Math.max(35, Math.min(this.regroupTriggerDistance - 10, finite(options.regroupStopDistance, 60)));
    this.regroupRetargetDistance = Math.max(20, finite(options.regroupRetargetDistance, 35));
    this.regroupRetargetMs = Math.max(700, finite(options.regroupRetargetMs, 1400));
    this.regroupTimeoutMs = Math.max(5000, finite(options.regroupTimeoutMs, 45000));

    this.merchantPotionLowWatermark = Math.max(1200, Math.min(4200, Math.floor(finite(options.merchantPotionLowWatermark, 3500))));
    this.merchantAttestationMaxAgeMs = Math.max(1000, Math.min(5000, finite(options.merchantAttestationMaxAgeMs, 2500)));

    this.followerSmartMove = null;
    this.nextFollowerSmartMoveId = 1;
    this.stats = {
      aggroOrbitEvaluations: 0,
      aggroOrbitMoves: 0,
      aggroOrbitEscapeMoves: 0,
      aggroOrbitNoWaypoint: 0,
      visiblePartyPositionRefreshes: 0,
      followerSmartRegroups: 0,
      followerSmartRetargets: 0,
      followerSmartStops: 0,
      followerSmartCompletions: 0,
      followerSmartFailures: 0,
      followerSmartTimeouts: 0,
      followerSmartSafetyPreemptions: 0,
      followerSmartCoalescedHolds: 0,
      followerRegroupSafetyHolds: 0,
      merchantPotionHysteresisApplies: 0,
      merchantAutonomyDriverTicks: 0,
      merchantAutonomyDriverAccepted: 0,
      merchantTravelAttestations: 0,
      merchantTravelAttestationAccepts: 0
    };

    this.aggroOrbitInstalled = this._installAggroOrbit();
    this.freshPartyPositionsInstalled = this._installFreshPartyPositions();
    this.followerRegroupInstalled = this._installFollowerRegroup();
    this.merchantTravelAttestationInstalled = this._installMerchantTravelAttestation();
    this.installedAt = this.now();

    this._event('ALPHA31_PARTY_ROLE_LIVENESS_INSTALLED', 'warn', 'LIVE_KITING_MERCHANT_AND_REGROUP_RECOVERY', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha31-party-role-liveness', event, severity, reason, data }); } catch (_) {}
  }

  _canMoveTo(x, y) {
    const parent = this.root && this.root.parent || this.root;
    const fn = this.root && this.root.can_move_to || parent && parent.can_move_to;
    if (typeof fn !== 'function') return true;
    try { return fn.call(this.root, x, y) !== false; } catch (_) { return false; }
  }

  _orbitDirection(character) {
    const terrain = this.runtime.farmerTerrainNavigationHotfix;
    if (terrain && typeof terrain._orbitDirection === 'function') {
      try { return terrain._orbitDirection(character); } catch (_) {}
    }
    const name = String(character && character.name || 'local');
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = ((hash * 31) + name.charCodeAt(i)) | 0;
    return (Math.abs(hash) % 2) ? 1 : -1;
  }

  _setOrbitDirection(character, direction) {
    const terrain = this.runtime.farmerTerrainNavigationHotfix;
    if (terrain && typeof terrain._setOrbitDirection === 'function') {
      try { terrain._setOrbitDirection(character, direction); return; } catch (_) {}
    }
  }

  _monsterMovementProfile(target) {
    const gd = gameDataOf(this.runtime);
    const meta = gd.monsters && target && target.mtype ? gd.monsters[target.mtype] || {} : {};
    return {
      range: Math.max(0, finite(target && target.range, finite(meta.range, 25)) || 0),
      speed: Math.max(1, finite(target && target.speed, finite(meta.speed, 40)) || 40)
    };
  }

  _segmentSafe(a, b, target, minimumDistance) {
    const ax = finite(a && (a.real_x != null ? a.real_x : a.x));
    const ay = finite(a && (a.real_y != null ? a.real_y : a.y));
    const bx = finite(b && b.x);
    const by = finite(b && b.y);
    const tx = finite(target && (target.real_x != null ? target.real_x : target.x));
    const ty = finite(target && (target.real_y != null ? target.real_y : target.y));
    if ([ax, ay, bx, by, tx, ty].some((value) => value == null)) return false;
    for (const t of [0.25, 0.5, 0.75, 1]) {
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (Math.hypot(x - tx, y - ty) < minimumDistance) return false;
    }
    return true;
  }

  _radialEscape(character, target, desiredDistance, hardSafeDistance, maxRangeDistance) {
    const cx = finite(character && (character.real_x != null ? character.real_x : character.x));
    const cy = finite(character && (character.real_y != null ? character.real_y : character.y));
    const tx = finite(target && (target.real_x != null ? target.real_x : target.x));
    const ty = finite(target && (target.real_y != null ? target.real_y : target.y));
    if ([cx, cy, tx, ty].some((value) => value == null)) return null;
    const current = Math.hypot(cx - tx, cy - ty);
    if (!Number.isFinite(current) || current < 0.001) return null;
    const speed = Math.max(1, finite(character && character.speed, 40));
    const step = Math.max(8, Math.min(desiredDistance - current, speed * this.orbitStepSeconds, Math.max(20, maxRangeDistance * 0.25)));
    if (step < 1) return null;
    const base = Math.atan2(cy - ty, cx - tx);
    const preferred = this._orbitDirection(character);
    for (const offsetDeg of [preferred * 12, preferred * 22, 0, -preferred * 12, -preferred * 22]) {
      const angle = base + offsetDeg * Math.PI / 180;
      const x = cx + Math.cos(angle) * step;
      const y = cy + Math.sin(angle) * step;
      if (!this._canMoveTo(x, y)) continue;
      const afterDistance = Math.hypot(x - tx, y - ty);
      if (afterDistance <= current + 2 || afterDistance > maxRangeDistance) continue;
      return { x, y, step, afterDistance, offsetDeg, direction: offsetDeg === 0 ? preferred : Math.sign(offsetDeg), escape: true, hardSafeDistance };
    }
    return null;
  }

  _orbitWaypoint(character, target) {
    const cx = finite(character && (character.real_x != null ? character.real_x : character.x));
    const cy = finite(character && (character.real_y != null ? character.real_y : character.y));
    const tx = finite(target && (target.real_x != null ? target.real_x : target.x));
    const ty = finite(target && (target.real_y != null ? target.real_y : target.y));
    const range = finite(character && character.range);
    if ([cx, cy, tx, ty, range].some((value) => value == null) || range < 60) return null;

    const monster = this._monsterMovementProfile(target);
    const hardSafeDistance = monster.range + this.orbitMonsterBuffer + monster.speed * this.orbitSpeedBufferSeconds;
    const maxRangeDistance = range * this.orbitMaxRangeFactor;
    if (hardSafeDistance + 8 >= maxRangeDistance) return null;

    const currentDistance = Math.hypot(cx - tx, cy - ty);
    const desiredDistance = Math.min(maxRangeDistance, Math.max(range * this.orbitDesiredFactor, hardSafeDistance + 16));
    if (currentDistance < hardSafeDistance + 4) {
      return this._radialEscape(character, target, desiredDistance, hardSafeDistance, maxRangeDistance);
    }

    const speed = Math.max(1, finite(character && character.speed, 40));
    const chordTarget = Math.max(10, Math.min(speed * this.orbitStepSeconds, range * 0.22));
    const ratio = Math.min(0.98, chordTarget / Math.max(1, 2 * desiredDistance));
    const baseDelta = clamp(2 * Math.asin(ratio), 8 * Math.PI / 180, 28 * Math.PI / 180);
    const currentAngle = Math.atan2(cy - ty, cx - tx);
    const preferred = this._orbitDirection(character);
    let best = null;

    for (const direction of [preferred, -preferred]) {
      for (const scale of [1, 0.72, 0.48]) {
        const delta = baseDelta * scale * direction;
        const angle = currentAngle + delta;
        for (const radius of [desiredDistance, clamp(currentDistance, hardSafeDistance + 8, maxRangeDistance)]) {
          const x = tx + Math.cos(angle) * radius;
          const y = ty + Math.sin(angle) * radius;
          if (!this._canMoveTo(x, y)) continue;
          const afterDistance = Math.hypot(x - tx, y - ty);
          if (afterDistance < hardSafeDistance + 4 || afterDistance > maxRangeDistance + 0.01) continue;
          if (!this._segmentSafe(character, { x, y }, target, hardSafeDistance)) continue;
          const step = Math.hypot(x - cx, y - cy);
          if (step < 4) continue;
          const switchPenalty = direction === preferred ? 0 : 12;
          const radiusPenalty = Math.abs(afterDistance - desiredDistance);
          const stepPenalty = Math.abs(step - chordTarget) * 0.12;
          const score = radiusPenalty + switchPenalty + stepPenalty;
          const candidate = { x, y, step, afterDistance, desiredDistance, hardSafeDistance, maxRangeDistance, direction, deltaDeg: delta * 180 / Math.PI, escape: false, score };
          if (!best || candidate.score < best.score) best = candidate;
        }
      }
    }
    return best;
  }

  _installAggroOrbit() {
    const farmer = this.runtime.farmer;
    const kiting = farmer && farmer.kiting;
    if (!kiting || typeof kiting.evaluate !== 'function' || kiting.__alpha31SafeOrbitInstalled) return false;
    const base = kiting.evaluate.bind(kiting);
    kiting.evaluate = (character, target) => {
      const decision = base(character, target);
      if (!character || !target || character.rip || character.dead || this.runtime.pendingEmergencyRetreat) return decision;
      if (!target.target || String(target.target) !== String(character.name || '')) return decision;
      if (!liveMonster(target)) return decision;

      this.stats.aggroOrbitEvaluations += 1;
      const waypoint = this._orbitWaypoint(character, target);
      if (!waypoint) {
        this.stats.aggroOrbitNoWaypoint += 1;
        return decision;
      }
      if (waypoint.direction) this._setOrbitDirection(character, waypoint.direction);
      if (waypoint.escape) this.stats.aggroOrbitEscapeMoves += 1;
      else this.stats.aggroOrbitMoves += 1;
      return {
        ...decision,
        shouldMove: true,
        reason: waypoint.escape ? 'AGGRO_ESCAPE_TO_SAFE_ORBIT' : 'AGGRO_SAFE_ORBIT',
        x: waypoint.x,
        y: waypoint.y,
        step: waypoint.step,
        distance: Number(distance(character, target).toFixed(2)),
        range: Number(character.range),
        desiredDistance: Number((waypoint.desiredDistance || waypoint.afterDistance).toFixed(2)),
        safeEnemyDistance: Number(waypoint.hardSafeDistance.toFixed(2)),
        orbitDirection: waypoint.direction,
        orbitDeltaDeg: waypoint.deltaDeg == null ? null : Number(waypoint.deltaDeg.toFixed(2)),
        terrainAware: true,
        alpha31SafeOrbit: true
      };
    };
    kiting.__alpha31SafeOrbitInstalled = true;
    return true;
  }

  _installFreshPartyPositions() {
    const team = this.runtime.teamCombatCohesionHotfix;
    if (!team || typeof team._member !== 'function' || team.__alpha31FreshVisiblePartyPositionsInstalled) return false;
    const base = team._member.bind(team);
    team._member = (snapshot, name, typeHint) => {
      const row = base(snapshot, name, typeHint);
      let visible = null;
      try { visible = typeof team._visiblePlayer === 'function' ? team._visiblePlayer(snapshot, name) : null; } catch (_) {}
      if (!visible) return row;
      const x = finite(visible.real_x != null ? visible.real_x : visible.x);
      const y = finite(visible.real_y != null ? visible.real_y : visible.y);
      if (x == null || y == null) return row;
      this.stats.visiblePartyPositionRefreshes += 1;
      return {
        ...row,
        map: visible.map || row.map,
        x,
        y,
        hp: finite(visible.hp, row.hp),
        max_hp: finite(visible.max_hp, row.max_hp),
        mp: finite(visible.mp, row.mp),
        max_mp: finite(visible.max_mp, row.max_mp),
        target: visible.target != null ? visible.target : row.target,
        rip: visible.rip === true || visible.dead === true || row.rip
      };
    };
    team.__alpha31FreshVisiblePartyPositionsInstalled = true;
    return true;
  }

  _regroupSafetyBusy(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c || c.rip || c.dead || this.runtime.pendingEmergencyRetreat) return true;
    if (c.target) return true;
    if ((snapshot.entities || []).some((entity) => liveMonster(entity) && String(entity.target || '') === String(c.name || ''))) return true;
    const farmer = this.runtime.farmer;
    if (!farmer) return false;
    if (farmer.state === 'ENGAGE' || farmer.state === 'RECOVER') return true;
    if (farmer.state === 'TRAVEL' && farmer.targetId != null) {
      const liveTarget = (snapshot.entities || []).find((entity) => liveMonster(entity) && String(entity.id) === String(farmer.targetId));
      if (liveTarget) return true;
    }
    return false;
  }

  _supersedeMovement(reason) {
    const adapter = this.runtime.adapter;
    if (!adapter || typeof adapter.supersedeMovement !== 'function') return false;
    try { return adapter.supersedeMovement(`ALPHA31_${String(reason || 'FOLLOWER_SMART_MOVE_STOPPED')}`) === true; }
    catch (_) { return false; }
  }

  _stopFollowerSmartMove(reason) {
    if (!this.followerSmartMove) return false;
    const adapter = this.runtime.adapter;
    if (adapter && typeof adapter.command === 'function') {
      try { adapter.command('stop', ['smart']); } catch (_) {}
    }
    this._supersedeMovement(reason);
    const previous = this.followerSmartMove;
    this.followerSmartMove = null;
    this.stats.followerSmartStops += 1;
    this._event('ALPHA31_FOLLOWER_SMART_REGROUP_STOPPED', 'info', reason, { previous });
    return true;
  }

  _observeFollowerSmartMove(result, active) {
    const value = result && result.value;
    if (!active || !value || typeof value.then !== 'function') return false;
    const id = active.id;
    Promise.resolve(value).then((response) => {
      const current = this.followerSmartMove;
      if (!current || current.id !== id) return;
      this.followerSmartMove = null;
      if (response && response.failed === true) {
        this._supersedeMovement('FOLLOWER_SMART_MOVE_FAILED');
        this.stats.followerSmartFailures += 1;
        this._event('ALPHA31_FOLLOWER_SMART_REGROUP_FAILED', 'warn', String(response.reason || 'SMART_MOVE_FAILED'), { move: current });
        return;
      }
      this.stats.followerSmartCompletions += 1;
      this._event('ALPHA31_FOLLOWER_SMART_REGROUP_COMPLETED', 'info', 'SMART_MOVE_RESOLVED', { move: current });
    }).catch((error) => {
      const current = this.followerSmartMove;
      if (!current || current.id !== id) return;
      this.followerSmartMove = null;
      this._supersedeMovement('FOLLOWER_SMART_MOVE_REJECTED');
      this.stats.followerSmartFailures += 1;
      this._event('ALPHA31_FOLLOWER_SMART_REGROUP_FAILED', 'warn', String(error && error.message || error || 'SMART_MOVE_REJECTED').slice(0, 160), { move: current });
    });
    return true;
  }

  _installFollowerRegroup() {
    const teamController = this.runtime.teamCombatCohesionHotfix;
    if (!teamController || typeof teamController._followLeader !== 'function' || teamController.__alpha31FollowerRegroupInstalled) return false;
    const baseFollow = teamController._followLeader.bind(teamController);
    teamController._followLeader = (context, team, reason) => {
      if (!team || !team.self || !team.leader || team.selfName === team.leaderName) return baseFollow(context, team, reason);
      const snapshot = context && context.snapshot || this.runtime.lastSnapshot;
      const d = distance(team.self, team.leader);
      if (!Number.isFinite(d)) return baseFollow(context, team, reason);

      const stopDistance = Math.min(this.regroupStopDistance, Math.max(35, finite(teamController.followRadius, this.regroupStopDistance)));
      if (d <= stopDistance || team.cohesive) {
        this._stopFollowerSmartMove('FOLLOWER_REJOINED_FORMATION');
        return baseFollow(context, team, reason);
      }
      if (!team.sameMap || !team.positionsKnown) {
        this._stopFollowerSmartMove('FOLLOWER_REGROUP_CONTEXT_INVALID');
        return baseFollow(context, team, reason);
      }
      if (d < this.regroupTriggerDistance) return baseFollow(context, team, reason);
      if (this._regroupSafetyBusy(snapshot)) {
        this.stats.followerRegroupSafetyHolds += 1;
        if (this.followerSmartMove) {
          this.stats.followerSmartSafetyPreemptions += 1;
          this._stopFollowerSmartMove('COMBAT_OR_SAFETY_PREEMPTION');
          return true;
        }
        return baseFollow(context, team, reason);
      }

      const adapter = this.runtime.adapter;
      if (!adapter || typeof adapter.command !== 'function') return baseFollow(context, team, reason);
      const destination = { map: snapshot && snapshot.character && snapshot.character.map || team.leader.map, x: Number(team.leader.x), y: Number(team.leader.y) };
      if (!destination.map || !Number.isFinite(destination.x) || !Number.isFinite(destination.y)) return baseFollow(context, team, reason);

      let active = this.followerSmartMove;
      const now = this.now();
      if (active && now - active.at >= this.regroupTimeoutMs) {
        this.stats.followerSmartTimeouts += 1;
        this._stopFollowerSmartMove('FOLLOWER_REGROUP_TIMEOUT');
        active = null;
      }
      const shifted = active ? distance(active.destination, destination) : Infinity;
      const shouldRetarget = !!(active && shifted >= this.regroupRetargetDistance && now - active.at >= this.regroupRetargetMs);
      if (active && !shouldRetarget) return true;
      if (shouldRetarget) {
        this._stopFollowerSmartMove('LEADER_POSITION_REFRESH');
        this.stats.followerSmartRetargets += 1;
      } else {
        const deadlock = this.runtime.teamCohesionDeadlockHotfix;
        if (deadlock && deadlock.activeTerrainRecovery && deadlock.activeTerrainRecovery.ownerName === team.selfName) {
          if (typeof deadlock._stopTerrainRecovery === 'function') {
            try { deadlock._stopTerrainRecovery('SUPERSEDED_BY_ALPHA31_SMART_REGROUP', { ownerName: team.selfName }); }
            catch (_) {
              try { adapter.command('stop', ['smart']); } catch (_) {}
              deadlock.activeTerrainRecovery = null;
            }
          } else {
            try { adapter.command('stop', ['smart']); } catch (_) {}
            deadlock.activeTerrainRecovery = null;
          }
          this._supersedeMovement('TERRAIN_RECOVERY_SUPERSEDED');
        }
      }

      const result = adapter.command('smart_move', [destination]);
      if (result && result.coalesced === true) {
        this.stats.followerSmartCoalescedHolds += 1;
        this._event('ALPHA31_FOLLOWER_SMART_REGROUP_HELD', 'info', result.reason || 'MOVEMENT_OUTCOME_PENDING', { leaderName: team.leaderName, destination });
        return true;
      }
      if (!result || (!result.executed && !result.shadow)) return baseFollow(context, team, reason);
      const activeMove = {
        id: `alpha31-follow-${this.nextFollowerSmartMoveId++}`,
        at: now,
        leaderName: team.leaderName,
        destination,
        startDistance: d,
        reason: reason || 'REGROUP_WITH_TEAM_LEADER'
      };
      this.followerSmartMove = activeMove;
      this._observeFollowerSmartMove(result, activeMove);
      this.stats.followerSmartRegroups += 1;
      teamController.lastDecision = {
        at: now,
        action: 'FORMATION_SMART_REGROUP',
        reason: shouldRetarget ? 'FOLLOW_MOVING_LEADER' : 'FOLLOWER_OUTSIDE_RECOVERY_RADIUS',
        leaderName: team.leaderName,
        distance: d,
        destination,
        executed: !!result.executed,
        shadow: !!result.shadow,
        coalesced: !!result.coalesced
      };
      this._event('ALPHA31_FOLLOWER_SMART_REGROUP_STARTED', 'warn', teamController.lastDecision.reason, { ...teamController.lastDecision });
      return true;
    };
    teamController.__alpha31FollowerRegroupInstalled = true;
    return true;
  }

  _merchantServiceAttestation(map, request) {
    const c = characterOf(this.runtime);
    const gd = gameDataOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return null;
    if (!this.runtime.adapter || String(this.runtime.adapter.mode || '') !== 'active') return null;
    if (!gd.maps || !Object.prototype.hasOwnProperty.call(gd.maps, map)) return null;
    const metadata = request && request.metadata || {};
    if (String(metadata.source || '') !== 'ALPHA27_MERCHANT_SERVICE_TRAVEL') return null;
    if (request.server || request.region || request.serverChange === true) return null;
    return {
      trusted: true,
      map: String(map),
      source: MERCHANT_TRAVEL_ATTESTATION_SOURCE,
      observedAt: this.now(),
      maxAgeMs: this.merchantAttestationMaxAgeMs,
      subject: String(metadata.requestedDestination || metadata.npcId || 'merchant-service').slice(0, 64)
    };
  }

  _installMerchantTravelAttestation() {
    let installed = false;
    const safeTravel = this.runtime.safeTravel;
    if (safeTravel && typeof safeTravel._trustedMapAttestation === 'function' && !safeTravel.__alpha31MerchantAttestationInstalled) {
      const baseTrusted = safeTravel._trustedMapAttestation.bind(safeTravel);
      safeTravel._trustedMapAttestation = (map, context = {}) => {
        const attestation = context && context.destinationMapAttestation;
        if (attestation && attestation.trusted === true && String(attestation.source || '') === MERCHANT_TRAVEL_ATTESTATION_SOURCE && String(attestation.map || '') === String(map || '')) {
          const observedAt = Number(attestation.observedAt);
          const maxAgeMs = Math.max(1000, Math.min(5000, finite(attestation.maxAgeMs, this.merchantAttestationMaxAgeMs)));
          const ageMs = this.now() - observedAt;
          if (Number.isFinite(observedAt) && observedAt > 0 && ageMs >= -2000 && ageMs <= maxAgeMs) {
            this.stats.merchantTravelAttestationAccepts += 1;
            return { map: String(map), source: MERCHANT_TRAVEL_ATTESTATION_SOURCE, observedAt, ageMs, maxAgeMs, subject: attestation.subject == null ? null : String(attestation.subject).slice(0, 64) };
          }
        }
        return baseTrusted(map, context);
      };
      safeTravel.__alpha31MerchantAttestationInstalled = true;
      installed = true;
    }

    if (typeof this.runtime.planTravel === 'function' && !this.runtime.__alpha31MerchantTravelPlanAttestationInstalled) {
      const basePlanTravel = this.runtime.planTravel.bind(this.runtime);
      this.runtime.planTravel = (request = {}, context = {}) => {
        const destination = typeof request.destination === 'string' ? { map: request.destination } : request.destination || {};
        const map = String(destination.map || '').trim();
        const attestation = map ? this._merchantServiceAttestation(map, request) : null;
        if (!attestation) return basePlanTravel(request, context);
        this.stats.merchantTravelAttestations += 1;
        return basePlanTravel(request, { ...context, destinationMapAttestation: attestation });
      };
      this.runtime.__alpha31MerchantTravelPlanAttestationInstalled = true;
      installed = true;
    }
    return installed;
  }

  _applyMerchantPotionHysteresis() {
    const planner = this.runtime.merchantServicePlanner;
    if (!planner) return false;
    const target = Math.max(this.merchantPotionLowWatermark + 1, finite(planner.targetPotionCount, 4500));
    const critical = Math.max(0, finite(planner.criticalPotionCount, 1000));
    const nextLow = Math.max(critical + 250, Math.min(this.merchantPotionLowWatermark, target - 250));
    if (planner.lowPotionCount === nextLow) return false;
    planner.lowPotionCount = nextLow;
    if (this.runtime.p0PotionPolicy4500 && typeof this.runtime.p0PotionPolicy4500 === 'object') this.runtime.p0PotionPolicy4500.lowWatermark = nextLow;
    this.stats.merchantPotionHysteresisApplies += 1;
    this._event('ALPHA31_MERCHANT_POTION_HYSTERESIS_APPLIED', 'info', 'BATCH_SUPPLY_INSTEAD_OF_MICRO_DELIVERIES', { targetPotionCount: target, lowPotionCount: nextLow, criticalPotionCount: critical });
    return true;
  }

  _driveMerchantAutonomy() {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return false;
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    const merchant = alpha27 && alpha27.merchant;
    if (!merchant || typeof merchant.tick !== 'function') return false;
    this.stats.merchantAutonomyDriverTicks += 1;
    let accepted = false;
    try { accepted = merchant.tick() === true; } catch (_) { return false; }
    if (accepted) this.stats.merchantAutonomyDriverAccepted += 1;
    return accepted;
  }

  beforeTick() {
    this._applyMerchantPotionHysteresis();
    this._driveMerchantAutonomy();
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: ALPHA31_PARTY_ROLE_LIVENESS_MODE,
      installedAt: this.installedAt || null,
      aggroOrbitInstalled: this.aggroOrbitInstalled,
      freshPartyPositionsInstalled: this.freshPartyPositionsInstalled,
      followerRegroupInstalled: this.followerRegroupInstalled,
      merchantTravelAttestationInstalled: this.merchantTravelAttestationInstalled,
      orbit: {
        desiredRangeFactor: this.orbitDesiredFactor,
        maximumRangeFactor: this.orbitMaxRangeFactor,
        monsterBuffer: this.orbitMonsterBuffer,
        monsterSpeedBufferSeconds: this.orbitSpeedBufferSeconds,
        stepSeconds: this.orbitStepSeconds
      },
      followerRegroup: {
        triggerDistance: this.regroupTriggerDistance,
        stopDistance: this.regroupStopDistance,
        retargetDistance: this.regroupRetargetDistance,
        retargetMs: this.regroupRetargetMs,
        timeoutMs: this.regroupTimeoutMs,
        active: this.followerSmartMove ? { ...this.followerSmartMove } : null,
        independentFollowers: true,
        sameMapOnly: true,
        combatPreemption: true
      },
      merchant: {
        potionTargetUnchanged: 4500,
        lowWatermark: this.merchantPotionLowWatermark,
        microDeliverySuppression: true,
        autonomyLivenessDriver: true,
        trustedServiceTravelAttestationSource: MERCHANT_TRAVEL_ATTESTATION_SOURCE,
        arbitraryTravelBypass: false
      },
      policies: {
        onlyActiveAggroHolderOrbits: true,
        orbitMaintainsEnemySafetyBuffer: true,
        emergencyRetreatStillOutranksOrbit: true,
        visiblePartyCoordinatesOutrankStalePartyCoordinates: true,
        everySeparatedFollowerMayRecoverIndependently: true,
        newPullSafetyGateUnchanged: true,
        merchantEconomyAuthorityUnchanged: true,
        merchantServiceTravelOnlyAttestation: true,
        serverChangeAuthorityUnchanged: true
      },
      stats: { ...this.stats }
    };
  }
}

function installAlpha31PartyRoleLivenessHotfix(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha31PartyRoleLivenessHotfix) return runtime.alpha31PartyRoleLivenessHotfix;
  const hotfix = new Alpha31PartyRoleLivenessHotfix(runtime, options);
  runtime.alpha31PartyRoleLivenessHotfix = hotfix;
  return hotfix;
}

module.exports = {
  ALPHA31_PARTY_ROLE_LIVENESS_MODE,
  MERCHANT_TRAVEL_ATTESTATION_SOURCE,
  Alpha31PartyRoleLivenessHotfix,
  installAlpha31PartyRoleLivenessHotfix
};