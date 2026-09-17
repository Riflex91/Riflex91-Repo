'use strict';

const { hasIncomingAggro } = require('./alpha20-33-combat-logistics-regression-hotfix');

const ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE = 'alpha33-mark-orbit-merchant-delivery-v1';

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function characterOf(runtime) {
  const root = runtime && runtime.root;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function liveMonster(entity) {
  return !!(entity && entity.mtype && !entity.dead && !entity.rip && (entity.hp == null || Number(entity.hp) > 0));
}

function point(value) {
  return {
    x: finite(value && (value.real_x != null ? value.real_x : value.x)),
    y: finite(value && (value.real_y != null ? value.real_y : value.y))
  };
}

function distance(a, b) {
  const pa = point(a);
  const pb = point(b);
  if ([pa.x, pa.y, pb.x, pb.y].some((value) => value == null)) return Infinity;
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

function levelOf(item) {
  return Math.max(0, Math.floor(finite(item && item.level, 0)));
}

function rawEntity(runtime, id) {
  if (id == null) return null;
  const wanted = String(id);
  const root = runtime && runtime.root || globalThis;
  const parent = root && root.parent || root;
  const pools = [parent && parent.entities, root && root.entities];
  for (const pool of pools) {
    for (const entity of Object.values(pool || {})) {
      if (entity && String(entity.id) === wanted) return entity;
    }
  }
  return null;
}

function effectActiveOn(entity, effectName, now = Date.now()) {
  if (!entity || !effectName) return false;
  const wanted = String(effectName).toLowerCase();
  const containers = [entity.s, entity.status, entity.effects, entity.conditions];
  for (const container of containers) {
    if (!container) continue;
    if (Array.isArray(container)) {
      for (const row of container) {
        const name = String(row && (row.name || row.id || row.type) || '').toLowerCase();
        if (name !== wanted) continue;
        if (row && row.expiresAt != null && finite(row.expiresAt, 0) <= now) continue;
        if (row && row.ms != null && finite(row.ms, 0) <= 0) continue;
        return true;
      }
      continue;
    }
    if (typeof container !== 'object') continue;
    const key = Object.keys(container).find((name) => String(name).toLowerCase() === wanted);
    if (!key) continue;
    const value = container[key];
    if (value == null || value === false) continue;
    if (typeof value === 'object') {
      if (value.expiresAt != null && finite(value.expiresAt, 0) <= now) continue;
      if (value.ms != null && finite(value.ms, 0) <= 0) continue;
    }
    return true;
  }
  return false;
}

class Alpha33MarkOrbitMerchantDelivery {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.trainingRadiusFactor = clamp(options.trainingRadiusFactor == null ? 2.1 : options.trainingRadiusFactor, 1.4, 3.5);
    this.trainingRadiusMin = Math.max(120, Math.min(360, finite(options.trainingRadiusMin, 180)));
    this.trainingRadiusMax = Math.max(this.trainingRadiusMin, Math.min(600, finite(options.trainingRadiusMax, 320)));
    this.stats = {
      huntersMarkExistingDebuffSkips: 0,
      orbitSpiralEscapes: 0,
      orbitAnchorCorrections: 0,
      orbitRadialFallbacks: 0,
      merchantTargetOnlyCombatHoldsPrevented: 0,
      merchantCombatOwnersPatched: 0,
      gearDeliveryUnknownTargetGearHolds: 0,
      gearDeliveryStaleGoalHolds: 0,
      farmerGearLootReservations: 0
    };
    this.lastGearHold = null;

    this.huntersMarkGuardInstalled = this._installHuntersMarkGuard();
    this.anchoredOrbitInstalled = this._installAnchoredOrbit();
    this.merchantIncomingAggroInstalled = this._installMerchantIncomingAggro();
    this.gearDeliverySafetyInstalled = this._installGearDeliverySafety();
    this.farmerGearReservationInstalled = this._installFarmerGearReservation();
    this.installedAt = this.now();
    this._event('ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_INSTALLED', 'warn', 'LIVE_LOG_CORRECTIONS', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha33-mark-orbit-merchant-delivery', event, severity, reason, data }); } catch (_) {}
  }

  _targetHasEffect(target, effectName) {
    const raw = rawEntity(this.runtime, target && target.id);
    return effectActiveOn(raw || target, effectName, this.now());
  }

  _installHuntersMarkGuard() {
    const engine = this.runtime.partySkillEngine;
    if (!engine || typeof engine._supportDecision !== 'function' || engine.__alpha33HuntersMarkDebuffGuardInstalled) return false;
    const base = engine._supportDecision.bind(engine);
    engine._supportDecision = (context, target, team) => {
      const decision = base(context, target, team);
      if (!decision || String(decision.id || '').toLowerCase() !== 'huntersmark') return decision;
      if (!this._targetHasEffect(target, 'huntersmark')) return decision;
      this.stats.huntersMarkExistingDebuffSkips += 1;
      this._event('HUNTERS_MARK_SKIPPED_EXISTING_DEBUFF', 'info', 'TARGET_ALREADY_HAS_HUNTERS_MARK', {
        targetId: target && target.id != null ? String(target.id) : null,
        targetType: target && target.mtype || null
      });
      return null;
    };
    engine.__alpha33HuntersMarkDebuffGuardInstalled = true;
    return true;
  }

  _trainingAnchor(character) {
    const plan = this.runtime.localFarming && this.runtime.localFarming.currentPlan;
    const px = finite(plan && plan.x);
    const py = finite(plan && plan.y);
    if (px == null || py == null) return null;
    if (plan && plan.map && character && character.map && String(plan.map) !== String(character.map)) return null;
    const range = Math.max(60, finite(character && character.range, 120));
    return {
      x: px,
      y: py,
      radius: clamp(range * this.trainingRadiusFactor, this.trainingRadiusMin, this.trainingRadiusMax),
      planId: plan && plan.id || null
    };
  }

  _anchorAllows(character, candidate, anchor) {
    if (!anchor || !candidate) return true;
    const current = distance(character, anchor);
    const after = distance(candidate, anchor);
    if (!Number.isFinite(after)) return false;
    if (current <= anchor.radius) return after <= anchor.radius + 0.5;
    return after < current - 0.25;
  }

  _spiralEscape(alpha31, character, target, desiredDistance, hardSafeDistance, maxRangeDistance) {
    const c = point(character);
    const t = point(target);
    if ([c.x, c.y, t.x, t.y].some((value) => value == null)) return null;
    const current = Math.hypot(c.x - t.x, c.y - t.y);
    if (!Number.isFinite(current) || current < 0.001) return null;
    const speed = Math.max(1, finite(character && character.speed, 40));
    const stepSeconds = clamp(finite(alpha31 && alpha31.orbitStepSeconds, 0.8), 0.35, 1.3);
    const maxStep = Math.max(12, speed * stepSeconds);
    const radialGain = Math.max(5, Math.min(Math.max(0, desiredDistance - current), maxStep * 0.48));
    const nextRadius = Math.min(maxRangeDistance, Math.max(current + radialGain, hardSafeDistance + 4));
    if (nextRadius <= current + 1) return null;
    const baseAngle = Math.atan2(c.y - t.y, c.x - t.x);
    const preferred = alpha31 && typeof alpha31._orbitDirection === 'function' ? alpha31._orbitDirection(character) : 1;
    const anchor = this._trainingAnchor(character);
    let best = null;
    for (const offsetDeg of [preferred * 22, preferred * 32, preferred * 42, preferred * 52, -preferred * 22, -preferred * 32, -preferred * 42]) {
      const angle = baseAngle + offsetDeg * Math.PI / 180;
      const x = t.x + Math.cos(angle) * nextRadius;
      const y = t.y + Math.sin(angle) * nextRadius;
      const step = Math.hypot(x - c.x, y - c.y);
      if (step < 4 || step > maxStep * 1.30) continue;
      if (alpha31 && typeof alpha31._canMoveTo === 'function' && !alpha31._canMoveTo(x, y)) continue;
      const candidate = { x, y };
      if (!this._anchorAllows(character, candidate, anchor)) continue;
      const anchorDistance = anchor ? distance(candidate, anchor) : 0;
      const directionPenalty = Math.sign(offsetDeg) === preferred ? 0 : 8;
      const score = directionPenalty + Math.abs(step - maxStep * 0.85) * 0.15 + anchorDistance * 0.03;
      const row = {
        x, y, step, afterDistance: nextRadius, desiredDistance, hardSafeDistance, maxRangeDistance,
        offsetDeg, direction: Math.sign(offsetDeg) || preferred, deltaDeg: offsetDeg,
        escape: true, anchored: !!anchor, score
      };
      if (!best || row.score < best.score) best = row;
    }
    return best;
  }

  _anchoredOrbitAlternative(alpha31, character, target, template) {
    const anchor = this._trainingAnchor(character);
    if (!anchor || !template) return null;
    const c = point(character);
    const t = point(target);
    if ([c.x, c.y, t.x, t.y].some((value) => value == null)) return null;
    const currentDistance = Math.hypot(c.x - t.x, c.y - t.y);
    const hardSafeDistance = Math.max(0, finite(template.hardSafeDistance, 0));
    const maxRangeDistance = Math.max(hardSafeDistance + 1, finite(template.maxRangeDistance, finite(character && character.range, 120) * 0.92));
    const desiredDistance = clamp(finite(template.desiredDistance, currentDistance), hardSafeDistance + 4, maxRangeDistance);
    const baseAngle = Math.atan2(c.y - t.y, c.x - t.x);
    const preferred = alpha31 && typeof alpha31._orbitDirection === 'function' ? alpha31._orbitDirection(character) : 1;
    const speed = Math.max(1, finite(character && character.speed, 40));
    const maxStep = Math.max(12, speed * clamp(finite(alpha31 && alpha31.orbitStepSeconds, 0.8), 0.35, 1.3));
    let best = null;
    for (const offsetDeg of [preferred * 10, preferred * 16, preferred * 22, preferred * 30, -preferred * 10, -preferred * 16, -preferred * 22]) {
      const angle = baseAngle + offsetDeg * Math.PI / 180;
      for (const radius of [desiredDistance, clamp(currentDistance, hardSafeDistance + 5, maxRangeDistance)]) {
        const x = t.x + Math.cos(angle) * radius;
        const y = t.y + Math.sin(angle) * radius;
        const step = Math.hypot(x - c.x, y - c.y);
        if (step < 3 || step > maxStep * 1.35) continue;
        if (alpha31 && typeof alpha31._canMoveTo === 'function' && !alpha31._canMoveTo(x, y)) continue;
        const candidate = { x, y };
        if (!this._anchorAllows(character, candidate, anchor)) continue;
        if (currentDistance >= hardSafeDistance + 4 && alpha31 && typeof alpha31._segmentSafe === 'function' && !alpha31._segmentSafe(character, candidate, target, hardSafeDistance)) continue;
        const afterAnchor = distance(candidate, anchor);
        const row = {
          x, y, step, afterDistance: radius, desiredDistance, hardSafeDistance, maxRangeDistance,
          direction: Math.sign(offsetDeg) || preferred, deltaDeg: offsetDeg,
          escape: false, anchored: true,
          score: afterAnchor + (Math.sign(offsetDeg) === preferred ? 0 : 18) + Math.abs(radius - desiredDistance) * 0.3
        };
        if (!best || row.score < best.score) best = row;
      }
    }
    return best;
  }

  _installAnchoredOrbit() {
    const alpha31 = this.runtime.alpha31PartyRoleLivenessHotfix;
    if (!alpha31 || typeof alpha31._radialEscape !== 'function' || typeof alpha31._orbitWaypoint !== 'function' || alpha31.__alpha33AnchoredOrbitInstalled) return false;
    const baseEscape = alpha31._radialEscape.bind(alpha31);
    const baseWaypoint = alpha31._orbitWaypoint.bind(alpha31);

    alpha31._radialEscape = (character, target, desiredDistance, hardSafeDistance, maxRangeDistance) => {
      const spiral = this._spiralEscape(alpha31, character, target, desiredDistance, hardSafeDistance, maxRangeDistance);
      if (spiral) {
        this.stats.orbitSpiralEscapes += 1;
        return spiral;
      }
      this.stats.orbitRadialFallbacks += 1;
      return baseEscape(character, target, desiredDistance, hardSafeDistance, maxRangeDistance);
    };

    alpha31._orbitWaypoint = (character, target) => {
      const waypoint = baseWaypoint(character, target);
      if (!waypoint || !liveMonster(target)) return waypoint;
      const anchor = this._trainingAnchor(character);
      if (!anchor) return waypoint;
      if (this._anchorAllows(character, waypoint, anchor)) return waypoint;
      const corrected = this._anchoredOrbitAlternative(alpha31, character, target, waypoint);
      if (!corrected) return waypoint;
      this.stats.orbitAnchorCorrections += 1;
      return corrected;
    };

    alpha31.__alpha33AnchoredOrbitInstalled = true;
    return true;
  }

  _installMerchantIncomingAggro() {
    let installed = false;
    const owners = [
      [this.runtime, '_merchantInCombat'],
      [this.runtime.controlledTravel, '_inCombat'],
      [this.runtime.controlledMerchantService, '_inCombat'],
      [this.runtime.controlledMerchantProduction, '_inCombat'],
      [this.runtime.alpha27CombatMerchantConvergence && this.runtime.alpha27CombatMerchantConvergence.atomic, 'merchantInCombat']
    ];
    for (const [owner, key] of owners) {
      if (!owner || typeof owner[key] !== 'function') continue;
      const marker = `__alpha33_${key}_incomingAggroOnly`;
      if (owner[marker]) continue;
      owner[key] = () => {
        const incoming = hasIncomingAggro(this.runtime);
        const c = characterOf(this.runtime);
        if (!incoming && c && c.target) this.stats.merchantTargetOnlyCombatHoldsPrevented += 1;
        return incoming;
      };
      owner[marker] = true;
      this.stats.merchantCombatOwnersPatched += 1;
      installed = true;
    }
    return installed;
  }

  _registryCharacter(name) {
    try {
      const status = this.runtime.characterRegistry && this.runtime.characterRegistry.status ? this.runtime.characterRegistry.status() : null;
      return Array.isArray(status && status.characters) ? status.characters.find((row) => row && String(row.name) === String(name)) || null : null;
    } catch (_) { return null; }
  }

  _gearGoalTargetState(goal) {
    const row = goal && this._registryCharacter(goal.character);
    const gear = row && row.gear;
    if (!gear || typeof gear !== 'object' || Array.isArray(gear) || Object.keys(gear).length === 0) {
      return { safe: false, reason: 'TARGET_GEAR_UNOBSERVED', row };
    }
    const observed = gear[goal.slot] || null;
    const expectedName = goal.currentItem == null ? null : String(goal.currentItem);
    const expectedLevel = Math.max(0, finite(goal.currentLevel, 0));
    if (expectedName == null) {
      if (observed && observed.name) return { safe: false, reason: 'GEAR_GOAL_STALE_TARGET_SLOT_CHANGED', row, observed };
      return { safe: true, row, observed: null };
    }
    if (!observed || String(observed.name || '') !== expectedName || levelOf(observed) !== expectedLevel) {
      return { safe: false, reason: 'GEAR_GOAL_STALE_TARGET_SLOT_CHANGED', row, observed };
    }
    return { safe: true, row, observed };
  }

  _noteGearHold(reason, goal) {
    const key = `${reason}:${goal && goal.id || '-'}`;
    if (this.lastGearHold && this.lastGearHold.key === key && this.now() - this.lastGearHold.at < 10000) return;
    this.lastGearHold = { at: this.now(), key, reason, goalId: goal && goal.id || null };
    this._event('GEAR_DELIVERY_HELD', 'info', reason, {
      goalId: goal && goal.id || null,
      target: goal && goal.character || null,
      slot: goal && goal.slot || null,
      item: goal && goal.item || null,
      level: goal ? finite(goal.observedLevel, 0) : null
    });
  }

  _installGearDeliverySafety() {
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    const merchant = alpha27 && alpha27.merchant;
    if (!merchant || typeof merchant.gearDeliveryCandidate !== 'function' || merchant.__alpha33GearDeliverySafetyInstalled) return false;
    const base = merchant.gearDeliveryCandidate.bind(merchant);
    merchant.gearDeliveryCandidate = () => {
      const candidate = base();
      if (!candidate || !candidate.goal) return candidate;
      const state = this._gearGoalTargetState(candidate.goal);
      if (state.safe) return candidate;
      if (state.reason === 'TARGET_GEAR_UNOBSERVED') this.stats.gearDeliveryUnknownTargetGearHolds += 1;
      else this.stats.gearDeliveryStaleGoalHolds += 1;
      this._noteGearHold(state.reason, candidate.goal);
      return null;
    };
    merchant.__alpha33GearDeliverySafetyInstalled = true;
    return true;
  }

  _localGearGoalMatches(item) {
    const c = characterOf(this.runtime);
    const gear = this.runtime.gearProgression;
    if (!c || !item || !gear || typeof gear.list !== 'function') return false;
    try {
      return gear.list(256).some((goal) => goal
        && String(goal.character || '') === String(c.name || '')
        && String(goal.item || '') === String(item.name || '')
        && Math.max(0, finite(goal.observedLevel, 0)) === levelOf(item)
        && goal.projectedUpgradeRequired !== true);
    } catch (_) { return false; }
  }

  _installFarmerGearReservation() {
    const logistics = this.runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics._safeLootDescriptor !== 'function' || logistics.__alpha33GearReservationInstalled) return false;
    const base = logistics._safeLootDescriptor.bind(logistics);
    logistics._safeLootDescriptor = (item) => {
      const descriptor = base(item);
      if (!descriptor || descriptor.ok !== true || !this._localGearGoalMatches(item)) return descriptor;
      this.stats.farmerGearLootReservations += 1;
      return { ok: false, reason: 'ACTIVE_LOCAL_GEAR_GOAL_RESERVED' };
    };
    logistics.__alpha33GearReservationInstalled = true;
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE,
      installedAt: this.installedAt || null,
      installed: {
        huntersMarkDebuffGuard: this.huntersMarkGuardInstalled,
        anchoredAggroOrbit: this.anchoredOrbitInstalled,
        merchantIncomingAggro: this.merchantIncomingAggroInstalled,
        gearDeliverySafety: this.gearDeliverySafetyInstalled,
        farmerGearReservation: this.farmerGearReservationInstalled
      },
      policies: {
        huntersMarkExistingDebuffSkipped: true,
        activeAggroUsesTangentialSpiralEscape: true,
        trainingAreaAnchorBoundsOrbit: true,
        merchantOwnTargetIsNotCombat: true,
        merchantCombatRequiresIncomingMonsterAggro: true,
        gearDeliveryRequiresObservedTargetGear: true,
        staleGearGoalsFailClosed: true,
        localProgressionGearIsNotReturnedAsLoot: true
      },
      config: {
        trainingRadiusFactor: this.trainingRadiusFactor,
        trainingRadiusMin: this.trainingRadiusMin,
        trainingRadiusMax: this.trainingRadiusMax
      },
      lastGearHold: this.lastGearHold ? { ...this.lastGearHold } : null,
      stats: { ...this.stats }
    };
  }
}

function installAlpha33MarkOrbitMerchantDelivery(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha33MarkOrbitMerchantDelivery) return runtime.alpha33MarkOrbitMerchantDelivery;
  const module = new Alpha33MarkOrbitMerchantDelivery(runtime, options);
  runtime.alpha33MarkOrbitMerchantDelivery = module;
  return module;
}

module.exports = {
  ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE,
  effectActiveOn,
  Alpha33MarkOrbitMerchantDelivery,
  installAlpha33MarkOrbitMerchantDelivery
};
