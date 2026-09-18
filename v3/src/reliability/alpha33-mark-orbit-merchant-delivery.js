'use strict';

const { hasIncomingAggro } = require('./alpha20-33-combat-logistics-regression-hotfix');

const ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE = 'alpha33-mark-orbit-merchant-delivery-v2';
const FARMER_STATE_ACTION = 'FARMER_STATE';

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
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

function pickupItemsView(logistics, inventory, maxItems = 64) {
  const out = [];
  for (const item of Array.isArray(inventory) ? inventory : []) {
    if (!item || !item.name || out.length >= maxItems) continue;
    let descriptor = null;
    try { descriptor = logistics && typeof logistics._safeLootDescriptor === 'function' ? logistics._safeLootDescriptor(item) : null; } catch (_) {}
    if (!descriptor || descriptor.ok !== true) continue;
    out.push({
      name: String(item.name),
      level: levelOf(item),
      quantity: Math.max(1, Math.floor(finite(item.q, descriptor.quantity || 1))),
      metadataType: descriptor.metadataType || null
    });
  }
  return out;
}

function equipmentView(raw, maxSlots = 32) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const slot of Object.keys(raw).sort().slice(0, maxSlots)) {
    const item = raw[slot];
    if (!item || !item.name) continue;
    out[slot] = {
      name: String(item.name),
      level: levelOf(item),
      locked: !!(item.locked || item.l),
      special: !!(item.special || item.p)
    };
  }
  return out;
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
    this.farmerStateIntervalMs = Math.max(1200, Math.min(10000, finite(options.farmerStateIntervalMs, 2200)));
    this.farmerPositionFreshMs = Math.max(2000, Math.min(12000, finite(options.farmerPositionFreshMs, 5000)));
    this.collectionSettleMs = Math.max(5000, Math.min(30000, finite(options.collectionSettleMs, 12000)));
    this.collectionPrepareMaxMs = Math.max(10000, Math.min(120000, finite(options.collectionPrepareMaxMs, 45000)));
    this.merchantRendezvousCooldownMs = Math.max(2500, Math.min(30000, finite(options.merchantRendezvousCooldownMs, 6000)));
    this.lastFarmerStateSentAt = -Infinity;
    this.lastMerchantRendezvousAt = -Infinity;
    this.merchantRendezvousBusy = false;
    this.collectionRoute = null;
    this.lastCollectionCapacityPlan = null;
    this.farmerStateRefreshAt = new Map();
    this.farmerStates = new Map();
    this.stats = {
      huntersMarkExistingDebuffSkips: 0,
      huntersMarkOwnershipSkips: 0,
      huntersMarkOwnerAllows: 0,
      orbitSpiralEscapes: 0,
      orbitAnchorCorrections: 0,
      orbitRadialFallbacks: 0,
      merchantTargetOnlyCombatHoldsPrevented: 0,
      merchantCombatOwnersPatched: 0,
      gearDeliveryUnknownTargetGearHolds: 0,
      gearDeliveryStaleGoalHolds: 0,
      farmerGearLootReservations: 0,
      farmerStateSent: 0,
      farmerStateReceived: 0,
      farmerGearRegistryUpdates: 0,
      staleGearGoalsReleased: 0,
      merchantRendezvousAttempts: 0,
      merchantRendezvousCompleted: 0,
      merchantRendezvousFailed: 0,
      merchantRendezvousAlreadyNear: 0,
      staleFarmerPositionsRejected: 0,
      farmerStateRefreshRequests: 0,
      collectionRoutesStarted: 0,
      collectionRoutesCompleted: 0,
      collectionCapacityDisposals: 0,
      collectionCapacityBlockedActions: 0,
      collectionCapacityPrepareTimeouts: 0,
      collectionCapacityConstrainedDepartures: 0,
      collectionFollowMoves: 0
    };
    this.lastGearHold = null;
    this.lastMerchantRendezvous = null;

    this.huntersMarkGuardInstalled = this._installHuntersMarkGuard();
    this.anchoredOrbitInstalled = this._installAnchoredOrbit();
    this.merchantIncomingAggroInstalled = this._installMerchantIncomingAggro();
    this.gearDeliverySafetyInstalled = this._installGearDeliverySafety();
    this.farmerGearReservationInstalled = this._installFarmerGearReservation();
    this.partyStateTelemetryInstalled = this._installPartyStateTelemetry();
    this.merchantRendezvousAuthorityInstalled = this._installMerchantRendezvousAuthority();
    this.installedAt = this.now();
    this._event('ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_INSTALLED', 'warn', 'LIVE_LOG_CORRECTIONS_V2', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha33-mark-orbit-merchant-delivery', event, severity, reason, data }); } catch (_) {}
  }

  _targetHasEffect(target, effectName) {
    const raw = rawEntity(this.runtime, target && target.id);
    return effectActiveOn(raw || target, effectName, this.now());
  }

  _huntersMarkOwner(team, context = null) {
    const members = Array.isArray(team && team.members) ? team.members : [];
    const rangerNames = members
      .filter((row) => row && cleanName(row.name) && String(row.ctype || row.type || '').toLowerCase() === 'ranger' && !row.rip && !row.dead && row.present !== false)
      .map((row) => cleanName(row.name))
      .filter(Boolean)
      .sort();
    if (rangerNames.length) return rangerNames[0];
    const leader = cleanName(team && team.leaderName);
    if (leader) return leader;
    const self = context && context.snapshot && context.snapshot.character || characterOf(this.runtime);
    return self && String(self.ctype || '').toLowerCase() === 'ranger' ? cleanName(self.name) : null;
  }

  _installHuntersMarkGuard() {
    const engine = this.runtime.partySkillEngine;
    if (!engine || typeof engine._supportDecision !== 'function' || engine.__alpha33HuntersMarkDebuffGuardV2Installed) return false;
    const base = engine._supportDecision.bind(engine);
    engine._supportDecision = (context, target, team) => {
      const decision = base(context, target, team);
      if (!decision || String(decision.id || '').toLowerCase() !== 'huntersmark') return decision;
      const self = cleanName(context && context.snapshot && context.snapshot.character && context.snapshot.character.name)
        || cleanName(characterOf(this.runtime) && characterOf(this.runtime).name);
      const owner = this._huntersMarkOwner(team, context);
      if (!owner || !self || self !== owner) {
        this.stats.huntersMarkOwnershipSkips += 1;
        this._event('HUNTERS_MARK_SKIPPED_NOT_OWNER', 'info', owner ? 'DETERMINISTIC_PARTY_MARK_OWNER' : 'HUNTERS_MARK_OWNER_UNKNOWN', {
          self,
          owner,
          targetId: target && target.id != null ? String(target.id) : null,
          targetType: target && target.mtype || null
        });
        return null;
      }
      if (this._targetHasEffect(target, 'huntersmark')) {
        this.stats.huntersMarkExistingDebuffSkips += 1;
        this._event('HUNTERS_MARK_SKIPPED_EXISTING_DEBUFF', 'info', 'TARGET_ALREADY_HAS_HUNTERS_MARK', {
          owner,
          targetId: target && target.id != null ? String(target.id) : null,
          targetType: target && target.mtype || null
        });
        return null;
      }
      this.stats.huntersMarkOwnerAllows += 1;
      return decision;
    };
    engine.__alpha33HuntersMarkDebuffGuardV2Installed = true;
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
    for (const offsetDeg of [preferred * 22, preferred * 32, preferred * 42, preferred * 52, preferred * 72, preferred * 92, -preferred * 22, -preferred * 32, -preferred * 52, -preferred * 72, -preferred * 92]) {
      const angle = baseAngle + offsetDeg * Math.PI / 180;
      const x = t.x + Math.cos(angle) * nextRadius;
      const y = t.y + Math.sin(angle) * nextRadius;
      const step = Math.hypot(x - c.x, y - c.y);
      if (step < 4 || step > maxStep * 1.45) continue;
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
    for (const offsetDeg of [preferred * 10, preferred * 16, preferred * 22, preferred * 30, preferred * 45, preferred * 70, -preferred * 10, -preferred * 16, -preferred * 22, -preferred * 45, -preferred * 70]) {
      const angle = baseAngle + offsetDeg * Math.PI / 180;
      for (const radius of [desiredDistance, clamp(currentDistance, hardSafeDistance + 5, maxRangeDistance)]) {
        const x = t.x + Math.cos(angle) * radius;
        const y = t.y + Math.sin(angle) * radius;
        const step = Math.hypot(x - c.x, y - c.y);
        if (step < 3 || step > maxStep * 1.45) continue;
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

  _farmerStatePayload(snapshot = null) {
    const logistics = this.runtime.controlledPartyLogistics;
    const snap = snapshot || (logistics && logistics.adapter && typeof logistics.adapter.snapshot === 'function' ? logistics.adapter.snapshot() : this.runtime.lastSnapshot);
    const sc = snap && snap.character || {};
    const live = characterOf(this.runtime) || {};
    const gear = equipmentView(live.slots || live.equipment || sc.equipment || sc.gear || {});
    const inventory = Array.isArray(sc.inventory) ? sc.inventory : Array.isArray(live.items) ? live.items.map((item, index) => item ? { ...item, index } : null) : [];
    const pickupItems = pickupItemsView(logistics, inventory);
    return {
      runtimeActive: true,
      at: this.now(),
      name: cleanName(sc.name || live.name),
      ctype: sc.ctype || live.ctype || null,
      level: Math.max(0, finite(sc.level != null ? sc.level : live.level, 0)),
      map: sc.map || live.map || null,
      x: finite(sc.x != null ? sc.x : (live.real_x != null ? live.real_x : live.x)),
      y: finite(sc.y != null ? sc.y : (live.real_y != null ? live.real_y : live.y)),
      rip: !!(sc.rip || live.rip),
      gear,
      pickupItems,
      pickupEntryCount: pickupItems.length,
      pickupQuantity: pickupItems.reduce((sum, item) => sum + Math.max(1, finite(item.quantity, 1)), 0)
    };
  }

  _releaseStaleGearGoals(name, gear) {
    const progression = this.runtime.gearProgression;
    if (!progression || !(progression.goals instanceof Map) || !name || !gear || typeof gear !== 'object') return 0;
    let released = 0;
    for (const [id, goal] of [...progression.goals.entries()]) {
      if (!goal || String(goal.character || '') !== String(name)) continue;
      const observed = gear[goal.slot] || null;
      const expectedName = goal.currentItem == null ? null : String(goal.currentItem);
      const expectedLevel = Math.max(0, finite(goal.currentLevel, 0));
      const matches = expectedName == null
        ? !observed || !observed.name
        : !!observed && String(observed.name || '') === expectedName && levelOf(observed) === expectedLevel;
      if (matches) continue;
      progression.goals.delete(id);
      released += 1;
    }
    if (released) this.stats.staleGearGoalsReleased += released;
    return released;
  }

  _acceptFarmerState(sender, data) {
    const name = cleanName(sender || data && data.sender || data && data.name);
    if (!name) return false;
    const gear = equipmentView(data && data.gear || {});
    const pickupItems = Array.isArray(data && data.pickupItems)
      ? data.pickupItems.slice(0, 64).filter((item) => item && item.name).map((item) => ({
          name: String(item.name),
          level: Math.max(0, Math.floor(finite(item.level, 0))),
          quantity: Math.max(1, Math.floor(finite(item.quantity, 1))),
          metadataType: item.metadataType || null
        }))
      : [];
    const row = {
      name,
      ctype: data && data.ctype || null,
      level: Math.max(0, finite(data && data.level, 0)),
      map: data && data.map || null,
      x: finite(data && data.x),
      y: finite(data && data.y),
      online: true,
      available: !(data && data.rip),
      dead: !!(data && data.rip),
      gear,
      pickupItems,
      pickupEntryCount: pickupItems.length,
      pickupQuantity: pickupItems.reduce((sum, item) => sum + item.quantity, 0)
    };
    this.farmerStates.set(name, { ...row, at: this.now(), sourceAt: finite(data && data.at, this.now()), runtimeActive: data && data.runtimeActive === true });
    this.stats.farmerStateReceived += 1;
    const registry = this.runtime.characterRegistry;
    if (registry && typeof registry._merge === 'function') {
      try {
        registry._merge(row, 'party', { at: finite(data && data.at, this.now()), live: true, confidence: 0.98 });
        this.stats.farmerGearRegistryUpdates += 1;
      } catch (_) {}
    }
    const released = this._releaseStaleGearGoals(name, gear);
    this._event('FARMER_STATE_OBSERVED_BY_MERCHANT', 'info', 'TRUSTED_PARTY_STATE', {
      name,
      map: row.map,
      gearSlots: Object.keys(gear).length,
      staleGearGoalsReleased: released
    });
    return true;
  }

  _maybeSendFarmerState(target, options = {}) {
    const logistics = this.runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics._send !== 'function' || typeof logistics._isMerchant !== 'function' || logistics._isMerchant()) return false;
    const now = this.now();
    const force = options && options.force === true;
    if (!force && now - this.lastFarmerStateSentAt < this.farmerStateIntervalMs) return false;
    const payload = this._farmerStatePayload();
    if (!payload.name || !payload.map || payload.x == null || payload.y == null) return false;
    this.lastFarmerStateSentAt = now;
    this.stats.farmerStateSent += 1;
    Promise.resolve(logistics._send(target, FARMER_STATE_ACTION, payload)).catch(() => {});
    return true;
  }

  _installPartyStateTelemetry() {
    const logistics = this.runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics.receive !== 'function' || logistics.__alpha33PartyStateTelemetryV2Installed) return false;
    const baseReceive = logistics.receive.bind(logistics);
    logistics.receive = (sender, data) => {
      const action = String(data && data.action || '');
      if (action === FARMER_STATE_ACTION) {
        const from = cleanName(sender || data && data.sender);
        const merchant = typeof logistics._isMerchant === 'function' && logistics._isMerchant();
        const valid = typeof logistics._validEnvelope === 'function' && logistics._validEnvelope(from, data);
        if (!merchant || !valid) {
          if (data && data.type && logistics.stats) logistics.stats.messagesRejected = (logistics.stats.messagesRejected || 0) + 1;
          return false;
        }
        if (logistics.stats) logistics.stats.messagesReceived = (logistics.stats.messagesReceived || 0) + 1;
        return this._acceptFarmerState(from, data);
      }
      const farmerReceiver = typeof logistics._isMerchant === 'function' && !logistics._isMerchant();
      if (action === 'STATUS_REQUEST' && farmerReceiver) {
        const from = cleanName(sender || data && data.sender);
        const merchant = typeof logistics._merchantName === 'function' ? cleanName(logistics._merchantName()) : null;
        const valid = typeof logistics._validEnvelope === 'function' && logistics._validEnvelope(from, data);
        if (!valid || !merchant || from !== merchant) {
          if (data && data.type && logistics.stats) logistics.stats.messagesRejected = (logistics.stats.messagesRejected || 0) + 1;
          return false;
        }
        if (logistics.stats) logistics.stats.messagesReceived = (logistics.stats.messagesReceived || 0) + 1;
        // Explicit Merchant refreshes are already rate-limited by the requester.
        // Bypass the periodic Farmer telemetry throttle so a lost state packet
        // cannot keep a stale collection route blind for another interval.
        this._maybeSendFarmerState(from, { force: true });
        return true;
      }
      const accepted = baseReceive(sender, data);
      if (accepted && action === 'STATUS' && farmerReceiver) this._maybeSendFarmerState(sender || data && data.sender);
      if (accepted && action === 'STOP_FULL' && farmerReceiver) this._maybeSendFarmerState(sender || data && data.sender);
      return accepted;
    };
    logistics.__alpha33PartyStateTelemetryV2Installed = true;
    return true;
  }

  _freshFarmerRows() {
    const now = this.now();
    const rows = [];
    for (const row of this.farmerStates.values()) {
      if (!row || row.runtimeActive !== true || row.available === false || row.dead === true) continue;
      if (!row.map || finite(row.x) == null || finite(row.y) == null) continue;
      const receivedAge = Math.max(0, now - finite(row.at, 0));
      const sourceAge = Math.max(0, now - finite(row.sourceAt, 0));
      if (receivedAge > this.farmerPositionFreshMs || sourceAge > this.farmerPositionFreshMs) {
        this.stats.staleFarmerPositionsRejected += 1;
        continue;
      }
      rows.push(row);
    }
    return rows;
  }

  _requestFarmerStateRefresh() {
    const logistics = this.runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics._send !== 'function' || typeof logistics._trustedNames !== 'function') return false;
    const now = this.now();
    const fresh = new Set(this._freshFarmerRows().map((row) => String(row.name)));
    let sent = false;
    for (const name of logistics._trustedNames()) {
      if (!name || name === cleanName(characterOf(this.runtime) && characterOf(this.runtime).name) || fresh.has(String(name))) continue;
      const last = finite(this.farmerStateRefreshAt.get(String(name)), -Infinity);
      if (now - last < this.farmerStateIntervalMs) continue;
      this.farmerStateRefreshAt.set(String(name), now);
      this.stats.farmerStateRefreshRequests += 1;
      Promise.resolve(logistics._send(name, 'STATUS_REQUEST', {
        at: now,
        reason: 'MERCHANT_COLLECTION_FRESH_POSITION_REQUIRED'
      })).catch(() => {});
      sent = true;
    }
    return sent;
  }

  _merchantRendezvousCandidate() {
    const freshRows = this._freshFarmerRows();
    const pickupRows = freshRows.filter((row) => Array.isArray(row.pickupItems) && row.pickupItems.length > 0);
    if (!pickupRows.length) {
      this._requestFarmerStateRefresh();
      return null;
    }
    const byMap = new Map();
    for (const row of pickupRows) {
      const list = byMap.get(String(row.map)) || [];
      list.push(row);
      byMap.set(String(row.map), list);
    }
    const groups = [...byMap.entries()].map(([map, rows]) => ({
      map,
      rows,
      pickupEntryCount: rows.reduce((sum, row) => sum + Math.max(0, finite(row.pickupEntryCount, 0)), 0),
      pickupQuantity: rows.reduce((sum, row) => sum + Math.max(0, finite(row.pickupQuantity, 0)), 0),
      freshestAt: Math.max(...rows.map((row) => Math.min(finite(row.at, 0), finite(row.sourceAt, 0))))
    })).sort((a, b) => b.pickupEntryCount - a.pickupEntryCount || b.rows.length - a.rows.length || b.freshestAt - a.freshestAt || a.map.localeCompare(b.map));
    const selected = groups[0];
    const target = selected.rows.slice().sort((a, b) =>
      Math.max(0, finite(b.pickupEntryCount, 0)) - Math.max(0, finite(a.pickupEntryCount, 0))
      || Math.max(0, finite(b.pickupQuantity, 0)) - Math.max(0, finite(a.pickupQuantity, 0))
      || Math.min(finite(b.at, 0), finite(b.sourceAt, 0)) - Math.min(finite(a.at, 0), finite(a.sourceAt, 0))
      || String(a.name || '').localeCompare(String(b.name || ''))
    )[0];
    return {
      map: selected.map,
      x: Number(target.x),
      y: Number(target.y),
      targetName: target.name || null,
      count: selected.rows.length,
      names: selected.rows.map((row) => row.name).filter(Boolean).sort(),
      rows: selected.rows.map((row) => ({ ...row, gear: undefined })),
      pickupEntryCount: selected.pickupEntryCount,
      pickupQuantity: selected.pickupQuantity,
      observedAt: selected.freshestAt
    };
  }

  _merchantCapacitySnapshot() {
    const c = characterOf(this.runtime) || {};
    const items = Array.isArray(c.items) ? c.items : [];
    const capacity = Math.max(items.length, Math.floor(finite(c.isize, items.length)));
    const occupied = items.slice(0, capacity).filter(Boolean).length;
    return { capacity, occupied, freeSlots: Math.max(0, capacity - occupied), items };
  }

  _collectionCapacityPlan(candidate) {
    const snapshot = this._merchantCapacitySnapshot();
    const gameData = this.runtime.adapter && typeof this.runtime.adapter.getGameData === 'function'
      ? this.runtime.adapter.getGameData() || {}
      : this.root && this.root.G || {};
    const incoming = new Map();
    for (const row of candidate && candidate.rows || []) {
      for (const item of Array.isArray(row.pickupItems) ? row.pickupItems : []) {
        const key = `${item.name}:${Math.max(0, Math.floor(finite(item.level, 0)))}`;
        incoming.set(key, (incoming.get(key) || 0) + Math.max(1, Math.floor(finite(item.quantity, 1))));
      }
    }

    let incomingSlotsNeeded = 0;
    const identities = [];
    for (const [key, quantity] of incoming.entries()) {
      const split = key.lastIndexOf(':');
      const name = key.slice(0, split);
      const level = Math.max(0, Math.floor(finite(key.slice(split + 1), 0)));
      const meta = gameData.items && gameData.items[name];
      const stackMax = Math.max(1, Math.floor(finite(meta && meta.s, 1)));
      let headroom = 0;
      for (const item of snapshot.items) {
        if (!item || String(item.name || '') !== name || levelOf(item) !== level) continue;
        headroom += Math.max(0, stackMax - Math.max(1, Math.floor(finite(item.q, 1))));
      }
      const remaining = Math.max(0, quantity - headroom);
      const slots = Math.ceil(remaining / stackMax);
      incomingSlotsNeeded += slots;
      identities.push({ name, level, quantity, stackMax, existingHeadroom: headroom, newSlotsNeeded: slots });
    }

    const targetFreeSlots = Math.min(snapshot.capacity, incomingSlotsNeeded);
    const slotsToFree = Math.max(0, targetFreeSlots - snapshot.freeSlots);
    const plan = {
      at: this.now(),
      farmerCount: candidate && candidate.count || 0,
      farmerNames: candidate && candidate.names ? candidate.names.slice() : [],
      pickupEntryCount: candidate && candidate.pickupEntryCount || 0,
      pickupQuantity: candidate && candidate.pickupQuantity || 0,
      incomingSlotsNeeded,
      targetFreeSlots,
      currentFreeSlots: snapshot.freeSlots,
      slotsToFree,
      constrainedByCapacity: incomingSlotsNeeded > snapshot.capacity,
      identities
    };
    this.lastCollectionCapacityPlan = plan;
    return plan;
  }

  async _prepareCollectionCapacity(merchant, candidate) {
    const plan = this._collectionCapacityPlan(candidate);
    if (plan.slotsToFree <= 0) return { ready: true, acted: false, plan };

    const request = merchant && typeof merchant.planSellOrBank === 'function' ? merchant.planSellOrBank() : null;
    if (request && ['SELL', 'BANK'].includes(String(request.type || ''))) {
      this.stats.collectionCapacityDisposals += 1;
      const acted = await merchant.executeEconomyRequest(request);
      if (!acted) this.stats.collectionCapacityBlockedActions += 1;
      return { ready: false, acted: !!acted, plan, request, blocked: !acted };
    }

    // A complete compound set frees two inventory slots. Use it only when no
    // safe SELL/BANK disposal is available and capacity still blocks collection.
    const compound = merchant && typeof merchant.planCompound === 'function' ? merchant.planCompound() : null;
    if (compound) {
      const acted = await merchant.executeEconomyRequest(compound);
      if (!acted) this.stats.collectionCapacityBlockedActions += 1;
      return { ready: false, acted: !!acted, plan, request: compound, blocked: !acted };
    }

    this.stats.collectionCapacityConstrainedDepartures += 1;
    return { ready: true, acted: false, plan, constrained: true };
  }

  _collectionCoordinator() {
    return this.runtime.merchantTaskCoordinator || null;
  }

  _startCollectionRoute(candidate) {
    if (!candidate || !candidate.pickupEntryCount) return false;
    const coordinator = this._collectionCoordinator();
    const lock = coordinator && typeof coordinator.acquire === 'function'
      ? coordinator.acquire('RENDEZVOUS', 'COLLECTION_ROUTE', 'rendezvous:farmer-collection', {
          farmers: candidate.names.slice(),
          pickupEntries: candidate.pickupEntryCount,
          pickupQuantity: candidate.pickupQuantity
        }, { leaseMs: Math.max(120000, this.collectionPrepareMaxMs + 60000) })
      : { acquired: true };
    if (!lock.acquired) return false;
    const now = this.now();
    this.collectionRoute = {
      id: `collection-${now.toString(36)}`,
      startedAt: now,
      updatedAt: now,
      lastProgressAt: now,
      lastPickupQuantity: candidate.pickupQuantity,
      stage: 'PREPARE_CAPACITY',
      farmers: candidate.names.slice(),
      targetMap: candidate.map,
      targetX: candidate.x,
      targetY: candidate.y
    };
    this.stats.collectionRoutesStarted += 1;
    this._event('MERCHANT_COLLECTION_ROUTE_STARTED', 'info', 'FRESH_FARMER_PICKUP_DEMAND', {
      route: { ...this.collectionRoute },
      capacity: this._collectionCapacityPlan(candidate)
    });
    return true;
  }

  _finishCollectionRoute(reason, details = {}) {
    const route = this.collectionRoute;
    if (!route) return false;
    this.collectionRoute = null;
    const coordinator = this._collectionCoordinator();
    if (coordinator && typeof coordinator.release === 'function') {
      coordinator.release('RENDEZVOUS', 'rendezvous:farmer-collection', reason, details);
    }
    this.stats.collectionRoutesCompleted += 1;
    this.lastMerchantRendezvous = {
      at: this.now(),
      routeId: route.id,
      workers: route.farmers.slice(),
      ok: true,
      result: reason,
      details
    };
    this._event('MERCHANT_COLLECTION_ROUTE_COMPLETED', 'info', reason, this.lastMerchantRendezvous);
    return true;
  }

  async _travelToFreshCandidate(merchant, candidate, follow = false) {
    if (!candidate || !merchant || !merchant.atomic || typeof merchant.atomic.namedServiceTravel !== 'function') return false;
    const destination = { map: candidate.map, x: candidate.x, y: candidate.y };
    this.merchantRendezvousBusy = true;
    this.lastMerchantRendezvousAt = this.now();
    this.stats.merchantRendezvousAttempts += 1;
    if (follow) this.stats.collectionFollowMoves += 1;
    merchant.lastMerchantPlan = {
      at: this.now(),
      action: 'SERVICE_TRAVEL',
      reason: follow ? 'FOLLOW_FRESH_FARMER_COLLECTION_POSITION' : 'PARTY_LOGISTICS_RENDEZVOUS',
      destination,
      workers: candidate.names.slice(),
      pendingTransfers: candidate.pickupEntryCount
    };
    try {
      const result = await merchant.atomic.namedServiceTravel(destination);
      const ok = result === true || !!(result && result.ok === true);
      this.lastMerchantRendezvous = { at: this.now(), destination, ok, result: result && result.reason || null, workers: candidate.names.slice() };
      if (ok) this.stats.merchantRendezvousCompleted += 1;
      else this.stats.merchantRendezvousFailed += 1;
      return ok;
    } catch (error) {
      this.stats.merchantRendezvousFailed += 1;
      this.lastMerchantRendezvous = { at: this.now(), destination, ok: false, result: String(error && error.message || error).slice(0, 160), workers: candidate.names.slice() };
      return false;
    } finally {
      this.merchantRendezvousBusy = false;
    }
  }

  async _driveMerchantRendezvous(merchant) {
    if (this.merchantRendezvousBusy) return true;
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || '').toLowerCase() !== 'merchant' || c.rip) return false;
    if (hasIncomingAggro(this.runtime)) return !!this.collectionRoute;

    let candidate = this._merchantRendezvousCandidate();
    if (!this.collectionRoute) {
      if (!candidate || !candidate.pickupEntryCount) return false;
      if (!this._startCollectionRoute(candidate)) return false;
    }

    const route = this.collectionRoute;
    if (!route) return false;
    const coordinator = this._collectionCoordinator();
    if (coordinator && typeof coordinator.heartbeat === 'function') coordinator.heartbeat('RENDEZVOUS', 'rendezvous:farmer-collection', { stage: route.stage });

    candidate = this._merchantRendezvousCandidate();
    if (!candidate) {
      this._requestFarmerStateRefresh();
      if (this.now() - route.lastProgressAt >= this.collectionSettleMs) {
        return this._finishCollectionRoute('NO_FRESH_PICKUP_DEMAND_AFTER_SETTLE');
      }
      merchant.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'WAITING_FOR_FRESH_FARMER_COLLECTION_STATE', routeId: route.id };
      return true;
    }

    if (candidate.pickupQuantity < route.lastPickupQuantity) {
      route.lastProgressAt = this.now();
      route.lastPickupQuantity = candidate.pickupQuantity;
    }
    route.updatedAt = this.now();
    route.farmers = candidate.names.slice();

    const pressure = this._merchantCapacitySnapshot();
    if (pressure.freeSlots <= 0) return this._finishCollectionRoute('MERCHANT_INVENTORY_FULL', { pickupQuantityRemaining: candidate.pickupQuantity });

    if (route.stage === 'PREPARE_CAPACITY') {
      const prepared = await this._prepareCollectionCapacity(merchant, candidate);
      if (!prepared.ready) {
        const prepareAgeMs = Math.max(0, this.now() - finite(route.startedAt, this.now()));
        if (prepareAgeMs < this.collectionPrepareMaxMs) {
          merchant.lastMerchantPlan = {
            at: this.now(),
            action: 'COLLECTION_PREPARE',
            reason: prepared.blocked ? 'CAPACITY_DISPOSAL_BLOCKED_RETRY_BOUNDED' : 'FREEING_CAPACITY_FOR_FARMER_PICKUP',
            capacity: prepared.plan,
            prepareAgeMs,
            prepareMaxMs: this.collectionPrepareMaxMs
          };
          return true;
        }
        this.stats.collectionCapacityPrepareTimeouts += 1;
        this.stats.collectionCapacityConstrainedDepartures += 1;
        this._event('MERCHANT_COLLECTION_CAPACITY_PREPARE_TIMEOUT', 'warn', 'BOUNDED_COLLECTION_PREPARE_EXPIRED', {
          routeId: route.id,
          prepareAgeMs,
          prepareMaxMs: this.collectionPrepareMaxMs,
          blocked: prepared.blocked === true,
          capacity: prepared.plan
        });
      }
      route.stage = 'TRAVEL_TO_FARMERS';
      route.updatedAt = this.now();
    }

    const logistics = this.runtime.controlledPartyLogistics;
    const nearDistance = Math.max(120, Math.min(
      finite(logistics && logistics.config && logistics.config.rendezvousDistance, 260),
      finite(logistics && logistics.config && logistics.config.maxTransferDistance, 380) * 0.85
    ));
    const nearFresh = String(c.map || '') === String(candidate.map) && distance(c, candidate) <= nearDistance;

    if (route.stage === 'TRAVEL_TO_FARMERS') {
      if (!nearFresh) {
        await this._travelToFreshCandidate(merchant, candidate, false);
        return true;
      }
      route.stage = 'COLLECT';
      route.lastProgressAt = this.now();
      route.updatedAt = this.now();
    }

    if (route.stage === 'COLLECT') {
      if (!nearFresh) {
        await this._travelToFreshCandidate(merchant, candidate, true);
        return true;
      }
      if (candidate.pickupEntryCount <= 0 || candidate.pickupQuantity <= 0) {
        if (this.now() - route.lastProgressAt >= this.collectionSettleMs) return this._finishCollectionRoute('FARMER_PICKUP_DRAINED');
      } else {
        // Stay put. ControlledPartyLogistics owns serialized grants/offers.
        // Do not release the task lock just because Alpha27 has no local action.
        merchant.lastMerchantPlan = {
          at: this.now(),
          action: 'HOLD',
          reason: 'FARMER_COLLECTION_ACTIVE',
          routeId: route.id,
          workers: candidate.names.slice(),
          pickupEntriesRemaining: candidate.pickupEntryCount,
          pickupQuantityRemaining: candidate.pickupQuantity,
          freeSlots: pressure.freeSlots
        };
      }
      return true;
    }

    return true;
  }

  _installMerchantRendezvousAuthority() {
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    const merchant = alpha27 && alpha27.merchant;
    if (!merchant || typeof merchant.cycle !== 'function' || merchant.__alpha33MerchantRendezvousV3Installed) return false;
    const baseCycle = merchant.cycle.bind(merchant);
    merchant.cycle = async () => {
      // Fresh collection work preempts ordinary progression/production. Once
      // started, the collection route owns the global Merchant task lock until
      // all transferable Farmer inventory is drained or Merchant inventory fills.
      const candidate = this._merchantRendezvousCandidate();
      if (this.collectionRoute || candidate && candidate.pickupEntryCount > 0) {
        const handled = await this._driveMerchantRendezvous(merchant);
        if (handled) return true;
      }
      return baseCycle();
    };
    merchant.__alpha33MerchantRendezvousV3Installed = true;
    return true;
  }

  status() {
    return {
      schemaVersion: 2,
      mode: ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE,
      installedAt: this.installedAt || null,
      installed: {
        huntersMarkDebuffGuard: this.huntersMarkGuardInstalled,
        anchoredAggroOrbit: this.anchoredOrbitInstalled,
        merchantIncomingAggro: this.merchantIncomingAggroInstalled,
        gearDeliverySafety: this.gearDeliverySafetyInstalled,
        farmerGearReservation: this.farmerGearReservationInstalled,
        partyStateTelemetry: this.partyStateTelemetryInstalled,
        merchantRendezvousAuthority: this.merchantRendezvousAuthorityInstalled
      },
      policies: {
        huntersMarkSinglePartyOwner: true,
        huntersMarkOwnerSelection: 'FIRST_LIVE_RANGER_BY_NAME',
        huntersMarkExistingDebuffSkipped: true,
        activeAggroUsesTangentialSpiralEscape: true,
        trainingAreaAnchorBoundsOrbit: true,
        merchantOwnTargetIsNotCombat: true,
        merchantCombatRequiresIncomingMonsterAggro: true,
        gearDeliveryRequiresObservedTargetGear: true,
        trustedFarmerGearStateReplicatedToMerchant: true,
        staleGearGoalsReleasedOnFreshTargetState: true,
        staleGearGoalsFailClosed: true,
        localProgressionGearIsNotReturnedAsLoot: true,
        alpha27OwnsCrossMapMerchantRendezvous: true,
        merchantRendezvousRequiresPendingTransferWork: true,
        farmerPositionMustBeFresh: true,
        collectionRouteTaskLockedUntilTerminal: true,
        merchantCapacityPreparedFromTotalFarmerPickupDemand: true,
        futureFarmerGearPreemptsMerchantSelfGear: true
      },
      config: {
        trainingRadiusFactor: this.trainingRadiusFactor,
        trainingRadiusMin: this.trainingRadiusMin,
        trainingRadiusMax: this.trainingRadiusMax,
        farmerStateIntervalMs: this.farmerStateIntervalMs,
        farmerPositionFreshMs: this.farmerPositionFreshMs,
        collectionSettleMs: this.collectionSettleMs,
        collectionPrepareMaxMs: this.collectionPrepareMaxMs,
        merchantRendezvousCooldownMs: this.merchantRendezvousCooldownMs
      },
      lastGearHold: this.lastGearHold ? { ...this.lastGearHold } : null,
      lastMerchantRendezvous: this.lastMerchantRendezvous ? { ...this.lastMerchantRendezvous } : null,
      collectionRoute: this.collectionRoute ? { ...this.collectionRoute } : null,
      lastCollectionCapacityPlan: this.lastCollectionCapacityPlan ? { ...this.lastCollectionCapacityPlan } : null,
      farmerStates: [...this.farmerStates.values()].map((row) => ({ name: row.name, map: row.map, at: row.at, sourceAt: row.sourceAt, runtimeActive: row.runtimeActive, gearSlots: Object.keys(row.gear || {}).length, pickupEntryCount: row.pickupEntryCount || 0, pickupQuantity: row.pickupQuantity || 0 })),
      stats: { ...this.stats }
    };
  }
}

function installAlpha33MarkOrbitMerchantDelivery(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  const existing = runtime.alpha33MarkOrbitMerchantDelivery;
  if (existing && existing.mode === ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE) return existing;
  const module = new Alpha33MarkOrbitMerchantDelivery(runtime, options);
  module.mode = ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE;
  runtime.alpha33MarkOrbitMerchantDelivery = module;
  return module;
}

module.exports = {
  ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE,
  FARMER_STATE_ACTION,
  effectActiveOn,
  equipmentView,
  Alpha33MarkOrbitMerchantDelivery,
  installAlpha33MarkOrbitMerchantDelivery
};