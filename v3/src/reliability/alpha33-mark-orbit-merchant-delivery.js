'use strict';

const { hasIncomingAggro } = require('./alpha20-33-combat-logistics-regression-hotfix');

const ALPHA33_MARK_ORBIT_MERCHANT_DELIVERY_MODE = 'alpha33-mark-orbit-merchant-delivery-v2';
const FARMER_STATE_ACTION = 'FARMER_STATE';
const GEAR_DELIVERY_INTENT_ACTION = 'GEAR_DELIVERY_INTENT';
const GEAR_DELIVERY_INTENT_ACK_ACTION = 'GEAR_DELIVERY_INTENT_ACK';

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
    try {
      if (logistics && typeof logistics._lootBlocked === 'function' && logistics._lootBlocked(item)) continue;
    } catch (_) {}
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
    this.farmerGearGoalFreshMs = Math.max(5000, Math.min(120000, finite(options.farmerGearGoalFreshMs, 30000)));
    this.gearDeliveryIntentTtlMs = Math.max(5000, Math.min(120000, finite(options.gearDeliveryIntentTtlMs, 30000)));
    this.gearDeliveryIntentAckTimeoutMs = Math.max(100, Math.min(5000, finite(options.gearDeliveryIntentAckTimeoutMs, 1200)));
    this.farmerGearEquipVerifyMs = Math.max(500, Math.min(10000, finite(options.farmerGearEquipVerifyMs, 2500)));
    this.farmerGearEquipRetryMs = Math.max(500, Math.min(30000, finite(options.farmerGearEquipRetryMs, 3000)));
    this.collectionSettleMs = Math.max(5000, Math.min(30000, finite(options.collectionSettleMs, 12000)));
    this.collectionPrepareMaxMs = Math.max(10000, Math.min(120000, finite(options.collectionPrepareMaxMs, 45000)));
    this.merchantRendezvousCooldownMs = Math.max(2500, Math.min(30000, finite(options.merchantRendezvousCooldownMs, 6000)));
    this.lastFarmerStateSentAt = -Infinity;
    this.lastMerchantRendezvousAt = -Infinity;
    this.merchantRendezvousBusy = false;
    this.collectionRoute = null;
    this.suspendedCollectionRoute = null;
    this.lastCollectionCapacityPlan = null;
    this.collectionCapacityBlockedIndexes = new Set();
    this.farmerStateRefreshAt = new Map();
    this.farmerStates = new Map();
    this.incomingGearIntents = new Map();
    this.pendingGearDeliveryIntentAcks = new Map();
    this.gearDeliveryIntentSequence = 0;
    this.pendingFarmerGearEquip = null;
    this.farmerGearEquipRetryAt = new Map();
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
      gearDeliveryIntentsSent: 0,
      gearDeliveryIntentSendFailures: 0,
      gearDeliveryIntentAcksSent: 0,
      gearDeliveryIntentAckSendFailures: 0,
      gearDeliveryIntentAcksReceived: 0,
      gearDeliveryIntentAckTimeouts: 0,
      gearDeliveryIntentsReceived: 0,
      farmerGearLootReservations: 0,
      farmerGearIntentIdentityHolds: 0,
      farmerGearExactReservations: 0,
      farmerGearEquipAttempts: 0,
      farmerGearEquipCommitted: 0,
      farmerGearEquipRejected: 0,
      farmerGearEquipTimeouts: 0,
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
      collectionCapacityDeferredBanks: 0,
      collectionCapacityMaxSafePrepCompleted: 0,
      collectionFollowMoves: 0,
      collectionDrainedWaits: 0,
      collectionUnavailableCompletions: 0,
      collectionRoutesPreemptedForCriticalSupply: 0,
      collectionRoutesSuspendedForCriticalSupply: 0,
      collectionRoutesResumedAfterCriticalSupply: 0
    };
    this.lastGearHold = null;
    this.lastMerchantRendezvous = null;

    this.huntersMarkGuardInstalled = this._installHuntersMarkGuard();
    this.anchoredOrbitInstalled = this._installAnchoredOrbit();
    this.merchantIncomingAggroInstalled = this._installMerchantIncomingAggro();
    this.gearDeliverySafetyInstalled = this._installGearDeliverySafety();
    this.farmerGearReservationInstalled = this._installFarmerGearReservation();
    this.farmerGearEquipInstalled = this._installFarmerGearEquip();
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
    const baseCandidate = merchant.gearDeliveryCandidate.bind(merchant);
    merchant.gearDeliveryCandidate = () => {
      const candidate = baseCandidate();
      if (!candidate || !candidate.goal) return candidate;
      const state = this._gearGoalTargetState(candidate.goal);
      if (state.safe) return candidate;
      if (state.reason === 'TARGET_GEAR_UNOBSERVED') this.stats.gearDeliveryUnknownTargetGearHolds += 1;
      else this.stats.gearDeliveryStaleGoalHolds += 1;
      this._noteGearHold(state.reason, candidate.goal);
      return null;
    };

    if (typeof merchant.deliverGearGoal === 'function') {
      const baseDeliver = merchant.deliverGearGoal.bind(merchant);
      merchant.deliverGearGoal = async () => {
        const candidate = merchant.gearDeliveryCandidate();
        if (!candidate || !candidate.goal || !candidate.item) return baseDeliver();
        const logistics = this.runtime.controlledPartyLogistics;
        if (!logistics || typeof logistics._send !== 'function') return baseDeliver();
        const goal = candidate.goal;
        const targetName = cleanName(goal.character);
        const intent = {
          intentToken: `gear-intent-${this.now()}-${++this.gearDeliveryIntentSequence}`,
          goalId: String(goal.id || ''),
          targetName,
          itemName: String(goal.item || candidate.item.name || ''),
          itemLevel: levelOf(candidate.item),
          slot: String(goal.slot || ''),
          currentItem: goal.currentItem == null ? null : String(goal.currentItem),
          currentLevel: Math.max(0, finite(goal.currentLevel, 0)),
          expiresAt: this.now() + this.gearDeliveryIntentTtlMs
        };
        if (!targetName || !intent.goalId || !intent.itemName || !intent.slot) return baseDeliver();

        // The physical item MUST NOT leave the Merchant until the Farmer has
        // processed the intent and captured its pre-delivery identity indexes.
        // send_cm delivery success only means the message was dispatched; it is
        // not an end-to-end acknowledgement from the target runtime.
        const ackWait = this._prepareGearDeliveryIntentAck(intent);
        const sent = await Promise.resolve(logistics._send(targetName, GEAR_DELIVERY_INTENT_ACTION, intent)).catch(() => null);
        if (!sent || sent.delivered !== true) {
          ackWait.cancel();
          this.stats.gearDeliveryIntentSendFailures += 1;
          this._event('GEAR_DELIVERY_INTENT_SEND_FAILED', 'warn', sent && sent.reason || 'INTENT_TRANSPORT_FAILED', intent);
          return false;
        }
        this.stats.gearDeliveryIntentsSent += 1;
        this._event('GEAR_DELIVERY_INTENT_SENT', 'info', 'TARGETED_FARMER_EQUIP_INTENT', intent);

        const ack = await ackWait.promise;
        if (!ack) return false;

        // The goal can change while the acknowledgement crosses character
        // runtimes. Fail closed instead of delivering an item for a stale slot.
        const stateAfterAck = this._gearGoalTargetState(goal);
        const freshCandidate = merchant.gearDeliveryCandidate();
        if (!stateAfterAck.safe
          || !freshCandidate
          || !freshCandidate.goal
          || String(freshCandidate.goal.id || '') !== intent.goalId
          || !freshCandidate.item
          || String(freshCandidate.item.name || '') !== intent.itemName
          || levelOf(freshCandidate.item) !== intent.itemLevel) {
          this._noteGearHold(stateAfterAck.safe ? 'GEAR_GOAL_CHANGED_AFTER_INTENT_ACK' : stateAfterAck.reason, goal);
          return false;
        }
        return baseDeliver();
      };
    }
    merchant.__alpha33GearDeliverySafetyInstalled = true;
    return true;
  }

  _liveEquipment(slot) {
    const c = characterOf(this.runtime);
    const gear = c && (c.slots || c.equipment) || {};
    return gear && slot ? gear[slot] || null : null;
  }

  _goalTargetStillMatches(goal) {
    if (!goal || !goal.slot) return false;
    const observed = this._liveEquipment(goal.slot);
    const expectedName = goal.currentItem == null ? null : String(goal.currentItem);
    const expectedLevel = Math.max(0, finite(goal.currentLevel, 0));
    if (expectedName == null) return !(observed && observed.name);
    return !!(observed && String(observed.name || '') === expectedName && levelOf(observed) === expectedLevel);
  }

  _pruneGearIntents() {
    const now = this.now();
    for (const [id, intent] of this.incomingGearIntents) {
      if (!intent || finite(intent.expiresAt, 0) <= now) this.incomingGearIntents.delete(id);
    }
    for (const [key, until] of this.farmerGearEquipRetryAt) {
      if (finite(until, 0) <= now) this.farmerGearEquipRetryAt.delete(key);
    }
  }

  _prepareGearDeliveryIntentAck(intent) {
    const token = String(intent && intent.intentToken || '');
    let resolvePromise = null;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    if (!token) return { promise: Promise.resolve(null), cancel() {} };

    const setTimer = this.root && typeof this.root.setTimeout === 'function'
      ? this.root.setTimeout.bind(this.root)
      : typeof setTimeout === 'function' ? setTimeout : null;
    const clearTimer = this.root && typeof this.root.clearTimeout === 'function'
      ? this.root.clearTimeout.bind(this.root)
      : typeof clearTimeout === 'function' ? clearTimeout : null;

    const row = {
      token,
      goalId: String(intent.goalId || ''),
      targetName: cleanName(intent.targetName),
      itemName: String(intent.itemName || ''),
      itemLevel: Math.max(0, Math.floor(finite(intent.itemLevel, 0))),
      slot: String(intent.slot || ''),
      createdAt: this.now(),
      timer: null,
      settled: false,
      settle: null
    };
    const settle = (ack) => {
      if (row.settled) return false;
      row.settled = true;
      if (row.timer != null && clearTimer) {
        try { clearTimer(row.timer); } catch (_) {}
      }
      if (this.pendingGearDeliveryIntentAcks.get(token) === row) this.pendingGearDeliveryIntentAcks.delete(token);
      resolvePromise(ack || null);
      return true;
    };
    row.settle = settle;
    this.pendingGearDeliveryIntentAcks.set(token, row);
    if (setTimer) {
      row.timer = setTimer(() => {
        if (this.pendingGearDeliveryIntentAcks.get(token) !== row || row.settled) return;
        this.stats.gearDeliveryIntentAckTimeouts += 1;
        this._event('GEAR_DELIVERY_INTENT_ACK_TIMEOUT', 'warn', 'FARMER_PREDELIVERY_SNAPSHOT_ACK_NOT_RECEIVED', {
          intentToken: token,
          goalId: row.goalId,
          targetName: row.targetName,
          itemName: row.itemName,
          itemLevel: row.itemLevel,
          slot: row.slot
        });
        settle(null);
      }, this.gearDeliveryIntentAckTimeoutMs);
    }
    return { promise, cancel: () => settle(null) };
  }

  _acceptGearDeliveryIntentAck(sender, data) {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || '').toLowerCase() !== 'merchant') return false;
    const token = String(data && data.intentToken || '').slice(0, 220);
    const pending = token ? this.pendingGearDeliveryIntentAcks.get(token) : null;
    const from = cleanName(sender || data && data.sender);
    if (!pending
      || !from
      || from !== pending.targetName
      || String(data && data.goalId || '') !== pending.goalId
      || String(data && data.itemName || '') !== pending.itemName
      || Math.max(0, Math.floor(finite(data && data.itemLevel, 0))) !== pending.itemLevel
      || String(data && data.slot || '') !== pending.slot) return false;
    this.stats.gearDeliveryIntentAcksReceived += 1;
    this._event('GEAR_DELIVERY_INTENT_ACK_RECEIVED', 'info', 'FARMER_PREDELIVERY_SNAPSHOT_CONFIRMED', {
      intentToken: token,
      goalId: pending.goalId,
      targetName: from,
      itemName: pending.itemName,
      itemLevel: pending.itemLevel,
      slot: pending.slot,
      beforeIndices: Array.isArray(data && data.beforeIndices) ? data.beforeIndices.slice(0, 32) : []
    });
    return pending.settle({
      intentToken: token,
      goalId: pending.goalId,
      targetName: from,
      receivedAt: this.now()
    });
  }

  _matchingGearIntentForItem(item) {
    if (!item || !item.name || !Number.isInteger(Number(item.index))) return null;
    this._pruneGearIntents();
    const c = characterOf(this.runtime);
    if (!c) return null;
    for (const intent of this.incomingGearIntents.values()) {
      if (!intent || String(intent.targetName || '') !== String(c.name || '')) continue;
      if (String(intent.itemName || '') !== String(item.name || '') || Math.max(0, finite(intent.itemLevel, 0)) !== levelOf(item)) continue;
      // Once the Farmer has ACKed a targeted gear intent, freeze this whole
      // name+level identity out of generic loot until the intent is resolved.
      // A pre-existing identical item can otherwise be sent after the ACK,
      // freeing its index; Adventure Land may then place the Merchant-delivered
      // upgrade into that same index, making it look "pre-existing" and sending
      // it straight back to the Merchant.
      return intent;
    }
    return null;
  }

  _activeLocalGearGoalForItem(item) {
    const c = characterOf(this.runtime);
    const gear = this.runtime.gearProgression;
    const ledger = this.runtime.inventoryLedger;
    if (!c || !item || !gear || typeof gear.list !== 'function' || !ledger || typeof ledger.get !== 'function') return null;
    const index = Number(item.index);
    if (!Number.isInteger(index)) return null;
    let entry = null;
    try { entry = ledger.get(c.name, index); } catch (_) { return null; }
    const goalIds = entry && entry.reservation && Array.isArray(entry.reservation.goalIds) ? new Set(entry.reservation.goalIds.map(String)) : new Set();
    if (!goalIds.size) return null;
    try {
      return gear.list(256).find((goal) => goal
        && goalIds.has(String(goal.id || ''))
        && String(goal.character || '') === String(c.name || '')
        && String(goal.sourceCharacter || '') === String(c.name || '')
        && Number(goal.sourceIndex) === index
        && String(goal.item || '') === String(item.name || '')
        && Math.max(0, finite(goal.observedLevel, 0)) === levelOf(item)
        && goal.projectedUpgradeRequired !== true
        && this.now() - finite(goal.lastSeenAt, 0) <= this.farmerGearGoalFreshMs
        && this._goalTargetStillMatches(goal)) || null;
    } catch (_) { return null; }
  }

  _localGearGoalMatches(item) {
    const intent = this._matchingGearIntentForItem(item);
    if (intent) {
      this.stats.farmerGearIntentIdentityHolds += 1;
      return true;
    }
    const goal = this._activeLocalGearGoalForItem(item);
    if (goal) this.stats.farmerGearExactReservations += 1;
    return !!goal;
  }

  _acceptGearDeliveryIntent(sender, data) {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || '').toLowerCase() === 'merchant') return false;
    const targetName = cleanName(data && data.targetName);
    const intentToken = String(data && data.intentToken || '').slice(0, 220);
    const goalId = String(data && data.goalId || '').slice(0, 200);
    const itemName = String(data && data.itemName || '').slice(0, 120);
    const itemLevel = Math.max(0, Math.floor(finite(data && data.itemLevel, 0)));
    const slot = String(data && data.slot || '').slice(0, 40);
    if (!targetName || targetName !== cleanName(c.name) || !intentToken || !goalId || !itemName || !slot) return false;
    const inventory = Array.isArray(c.items) ? c.items : [];
    const beforeIndices = [];
    for (let index = 0; index < inventory.length; index += 1) {
      const item = inventory[index];
      if (item && String(item.name || '') === itemName && levelOf(item) === itemLevel) beforeIndices.push(index);
    }
    const intent = {
      id: goalId,
      intentToken,
      goalId,
      sender: cleanName(sender),
      targetName,
      itemName,
      itemLevel,
      slot,
      currentItem: data && data.currentItem == null ? null : String(data.currentItem),
      currentLevel: Math.max(0, finite(data && data.currentLevel, 0)),
      beforeIndices,
      receivedAt: this.now(),
      expiresAt: Math.min(
        finite(data && data.expiresAt, this.now() + this.gearDeliveryIntentTtlMs),
        this.now() + this.gearDeliveryIntentTtlMs
      ),
      failures: 0
    };
    this.incomingGearIntents.set(goalId, intent);
    this.stats.gearDeliveryIntentsReceived += 1;
    this._event('GEAR_DELIVERY_INTENT_RECEIVED', 'info', 'MERCHANT_TARGETED_GEAR_DELIVERY', {
      intentToken, goalId, sender: intent.sender, targetName, itemName, itemLevel, slot, beforeIndices: beforeIndices.slice()
    });

    // Acknowledge only after the pre-delivery inventory snapshot is stored.
    // The Merchant waits for this exact token before issuing send_item.
    const logistics = this.runtime.controlledPartyLogistics;
    if (intent.sender && logistics && typeof logistics._send === 'function') {
      const ack = {
        intentToken,
        goalId,
        targetName,
        itemName,
        itemLevel,
        slot,
        beforeIndices: beforeIndices.slice()
      };
      Promise.resolve(logistics._send(intent.sender, GEAR_DELIVERY_INTENT_ACK_ACTION, ack)).then((result) => {
        if (result && result.delivered === true) {
          this.stats.gearDeliveryIntentAcksSent += 1;
          this._event('GEAR_DELIVERY_INTENT_ACK_SENT', 'info', 'FARMER_PREDELIVERY_SNAPSHOT_CAPTURED', ack);
        } else {
          this.stats.gearDeliveryIntentAckSendFailures += 1;
          this._event('GEAR_DELIVERY_INTENT_ACK_SEND_FAILED', 'warn', result && result.reason || 'INTENT_ACK_TRANSPORT_FAILED', ack);
        }
      }).catch(() => {
        this.stats.gearDeliveryIntentAckSendFailures += 1;
        this._event('GEAR_DELIVERY_INTENT_ACK_SEND_FAILED', 'warn', 'INTENT_ACK_TRANSPORT_FAILED', ack);
      });
    }
    return true;
  }

  _farmerGearEquipCandidate(snapshot) {
    this._pruneGearIntents();
    const sc = snapshot && snapshot.character || {};
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || sc.ctype || '').toLowerCase() === 'merchant' || c.rip || c.dead) return null;
    const inventory = Array.isArray(sc.inventory)
      ? sc.inventory
      : Array.isArray(c.items) ? c.items.map((item, index) => item ? { ...item, index } : null) : [];

    for (const intent of [...this.incomingGearIntents.values()].sort((a, b) => finite(a.receivedAt, 0) - finite(b.receivedAt, 0))) {
      if (!intent || String(intent.targetName || '') !== String(c.name || '')) continue;
      const expected = {
        slot: intent.slot,
        currentItem: intent.currentItem,
        currentLevel: intent.currentLevel
      };
      if (!this._goalTargetStillMatches(expected)) {
        this.incomingGearIntents.delete(intent.goalId);
        this.stats.gearDeliveryStaleGoalHolds += 1;
        this._event('FARMER_GEAR_EQUIP_INTENT_DROPPED', 'info', 'TARGET_SLOT_CHANGED_BEFORE_DELIVERY', {
          goalId: intent.goalId, slot: intent.slot
        });
        continue;
      }
      const retryKey = String(intent.goalId || '');
      if (finite(this.farmerGearEquipRetryAt.get(retryKey), 0) > this.now()) continue;
      const item = inventory.find((row) => row
        && Number.isInteger(Number(row.index))
        && !intent.beforeIndices.includes(Number(row.index))
        && String(row.name || '') === intent.itemName
        && levelOf(row) === intent.itemLevel);
      if (item) return { kind: 'MERCHANT_INTENT', goalId: intent.goalId, intent, item, slot: intent.slot };
    }

    const candidates = [];
    for (const item of inventory) {
      if (!item || !Number.isInteger(Number(item.index))) continue;
      const goal = this._activeLocalGearGoalForItem(item);
      if (!goal) continue;
      const retryKey = String(goal.id || '');
      if (finite(this.farmerGearEquipRetryAt.get(retryKey), 0) > this.now()) continue;
      candidates.push({ kind: 'ACTIVE_LOCAL_GOAL', goalId: goal.id, goal, item, slot: goal.slot });
    }
    candidates.sort((a, b) => finite(b.goal && b.goal.survivalImprovement, 0) - finite(a.goal && a.goal.survivalImprovement, 0)
      || finite(b.goal && b.goal.improvement, 0) - finite(a.goal && a.goal.improvement, 0)
      || String(a.goalId || '').localeCompare(String(b.goalId || '')));
    return candidates[0] || null;
  }

  _farmerGearEquipTick(snapshot) {
    const logistics = this.runtime.controlledPartyLogistics;
    const c = characterOf(this.runtime);
    if (!logistics || !c || String(c.ctype || '').toLowerCase() === 'merchant') return false;

    if (this.pendingFarmerGearEquip) {
      const pending = this.pendingFarmerGearEquip;
      const equipped = this._liveEquipment(pending.slot);
      if (equipped && String(equipped.name || '') === pending.itemName && levelOf(equipped) === pending.itemLevel) {
        this.pendingFarmerGearEquip = null;
        if (pending.intentId) this.incomingGearIntents.delete(pending.intentId);
        this.farmerGearEquipRetryAt.delete(String(pending.goalId || ''));
        this.stats.farmerGearEquipCommitted += 1;
        this._event('FARMER_GEAR_UPGRADE_EQUIPPED', 'info', 'LOCAL_EQUIP_VERIFIED', {
          goalId: pending.goalId,
          item: pending.itemName,
          level: pending.itemLevel,
          slot: pending.slot,
          sourceIndex: pending.sourceIndex,
          source: pending.kind
        });
        logistics.lastDecision = { at: this.now(), action: 'LOCAL_GEAR_EQUIP', reason: 'LOCAL_EQUIP_VERIFIED', goalId: pending.goalId };
        return true;
      }
      if (!pending.asyncRejected && this.now() < pending.deadline) {
        logistics.lastDecision = { at: this.now(), action: 'LOCAL_GEAR_EQUIP', reason: 'LOCAL_EQUIP_VERIFYING', goalId: pending.goalId };
        return true;
      }
      this.pendingFarmerGearEquip = null;
      const key = String(pending.goalId || '');
      this.farmerGearEquipRetryAt.set(key, this.now() + this.farmerGearEquipRetryMs);
      const intent = pending.intentId ? this.incomingGearIntents.get(pending.intentId) : null;
      if (intent) {
        intent.failures = Math.max(0, finite(intent.failures, 0)) + 1;
        if (intent.failures >= 3) this.incomingGearIntents.delete(pending.intentId);
        else this.incomingGearIntents.set(pending.intentId, intent);
      }
      if (pending.asyncRejected) this.stats.farmerGearEquipRejected += 1;
      else this.stats.farmerGearEquipTimeouts += 1;
      this._event('FARMER_GEAR_EQUIP_FAILED_SAFE', 'warn', pending.asyncRejected ? 'EQUIP_COMMAND_REJECTED' : 'EQUIP_VERIFICATION_TIMEOUT', {
        goalId: pending.goalId,
        item: pending.itemName,
        level: pending.itemLevel,
        slot: pending.slot,
        failures: intent ? intent.failures : null
      });
      logistics.lastDecision = { at: this.now(), action: 'LOCAL_GEAR_EQUIP', reason: 'LOCAL_EQUIP_FAILED_SAFE', goalId: pending.goalId };
      return true;
    }

    const candidate = this._farmerGearEquipCandidate(snapshot);
    if (!candidate) return false;
    const adapter = logistics.adapter || this.runtime.adapter;
    if (!adapter || typeof adapter.command !== 'function') return false;
    const item = candidate.item;
    const command = adapter.command('equip', [Number(item.index), candidate.slot]);
    this.stats.farmerGearEquipAttempts += 1;
    if (!command || command.executed !== true) {
      this.stats.farmerGearEquipRejected += 1;
      this.farmerGearEquipRetryAt.set(String(candidate.goalId || ''), this.now() + this.farmerGearEquipRetryMs);
      this._event('FARMER_GEAR_EQUIP_FAILED_SAFE', 'warn', command && command.reason || 'EQUIP_COMMAND_REJECTED', {
        goalId: candidate.goalId, item: item.name, level: levelOf(item), slot: candidate.slot, sourceIndex: item.index
      });
      return true;
    }
    const pending = {
      startedAt: this.now(),
      deadline: this.now() + this.farmerGearEquipVerifyMs,
      goalId: candidate.goalId || null,
      intentId: candidate.intent && candidate.intent.goalId || null,
      kind: candidate.kind,
      itemName: String(item.name),
      itemLevel: levelOf(item),
      sourceIndex: Number(item.index),
      slot: candidate.slot,
      asyncRejected: false
    };
    this.pendingFarmerGearEquip = pending;
    Promise.resolve(command.value).then((response) => {
      if (response && response.success === false && this.pendingFarmerGearEquip === pending) pending.asyncRejected = true;
    }).catch(() => {
      if (this.pendingFarmerGearEquip === pending) pending.asyncRejected = true;
    });
    logistics.lastDecision = { at: this.now(), action: 'LOCAL_GEAR_EQUIP', reason: 'LOCAL_GEAR_UPGRADE_READY', goalId: candidate.goalId || null };
    return true;
  }

  _installFarmerGearEquip() {
    const logistics = this.runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics._farmerTick !== 'function' || logistics.__alpha33FarmerGearEquipInstalled) return false;
    const base = logistics._farmerTick.bind(logistics);
    logistics._farmerTick = (snapshot) => {
      if (this._farmerGearEquipTick(snapshot)) return logistics.lastDecision;
      return base(snapshot);
    };
    logistics.__alpha33FarmerGearEquipInstalled = true;
    return true;
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
      const merchantReceiver = typeof logistics._isMerchant === 'function' && logistics._isMerchant();
      if (action === GEAR_DELIVERY_INTENT_ACK_ACTION && merchantReceiver) {
        const from = cleanName(sender || data && data.sender);
        const valid = typeof logistics._validEnvelope === 'function' && logistics._validEnvelope(from, data);
        if (!valid || !this._acceptGearDeliveryIntentAck(from, data)) {
          if (data && data.type && logistics.stats) logistics.stats.messagesRejected = (logistics.stats.messagesRejected || 0) + 1;
          return false;
        }
        if (logistics.stats) logistics.stats.messagesReceived = (logistics.stats.messagesReceived || 0) + 1;
        return true;
      }
      const farmerReceiver = typeof logistics._isMerchant === 'function' && !logistics._isMerchant();
      if (action === GEAR_DELIVERY_INTENT_ACTION && farmerReceiver) {
        const from = cleanName(sender || data && data.sender);
        const merchant = typeof logistics._merchantName === 'function' ? cleanName(logistics._merchantName()) : null;
        const valid = typeof logistics._validEnvelope === 'function' && logistics._validEnvelope(from, data);
        if (!valid || !merchant || from !== merchant) {
          if (data && data.type && logistics.stats) logistics.stats.messagesRejected = (logistics.stats.messagesRejected || 0) + 1;
          return false;
        }
        if (logistics.stats) logistics.stats.messagesReceived = (logistics.stats.messagesReceived || 0) + 1;
        return this._acceptGearDeliveryIntent(from, data);
      }
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

  _collectionPresenceCandidate(route) {
    const wanted = new Set(Array.isArray(route && route.farmers) ? route.farmers.map(String) : []);
    const rows = this._freshFarmerRows().filter((row) => wanted.size === 0 || wanted.has(String(row.name || '')));
    if (!rows.length) return null;
    const c = characterOf(this.runtime) || {};
    const sameMap = rows.filter((row) => String(row.map || '') === String(c.map || ''));
    const pool = sameMap.length ? sameMap : rows;
    const selected = pool.slice().sort((a, b) => (
      distance(c, a) - distance(c, b)
      || finite(b.sourceAt, 0) - finite(a.sourceAt, 0)
      || String(a.name || '').localeCompare(String(b.name || ''))
    ))[0];
    return {
      map: selected.map,
      x: Number(selected.x),
      y: Number(selected.y),
      targetName: selected.name || null,
      count: rows.length,
      names: rows.map((row) => row.name).filter(Boolean).sort(),
      rows: rows.map((row) => ({ ...row, gear: undefined })),
      pickupEntryCount: 0,
      pickupQuantity: 0,
      observedAt: Math.max(...rows.map((row) => Math.min(finite(row.at, 0), finite(row.sourceAt, 0))))
    };
  }

  _collectionRouteExplicitlyUnavailable(route) {
    const names = Array.isArray(route && route.farmers) ? route.farmers.map(String).filter(Boolean) : [];
    if (!names.length) return false;
    return names.every((name) => {
      const row = this.farmerStates.get(name);
      return !!row && (row.runtimeActive === false || row.available === false || row.dead === true);
    });
  }

  _collectionReserveSlots() {
    const logistics = this.runtime.controlledPartyLogistics;
    return Math.max(1, Math.floor(finite(logistics && logistics.config && logistics.config.merchantReserveSlots, 1)));
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

    const reserveSlots = this._collectionReserveSlots();
    const targetFreeSlots = Math.min(snapshot.capacity, incomingSlotsNeeded + reserveSlots);
    const slotsToFree = Math.max(0, targetFreeSlots - snapshot.freeSlots);
    const plan = {
      at: this.now(),
      farmerCount: candidate && candidate.count || 0,
      farmerNames: candidate && candidate.names ? candidate.names.slice() : [],
      pickupEntryCount: candidate && candidate.pickupEntryCount || 0,
      pickupQuantity: candidate && candidate.pickupQuantity || 0,
      incomingSlotsNeeded,
      targetFreeSlots,
      reserveSlots,
      currentFreeSlots: snapshot.freeSlots,
      slotsToFree,
      constrainedByCapacity: incomingSlotsNeeded > snapshot.capacity,
      identities
    };
    this.lastCollectionCapacityPlan = plan;
    return plan;
  }

  _collectionHasActiveFarmerGearGoal(entry) {
    const gear = this.runtime.gearProgression;
    if (!gear || typeof gear.list !== 'function' || !entry) return false;
    let goals = [];
    try { goals = gear.list(256) || []; } catch (_) { goals = []; }
    const c = characterOf(this.runtime) || {};
    return goals.some((goal) => goal
      && String(goal.sourceCharacter || '') === String(c.name || '')
      && Number(goal.sourceIndex) === Number(entry.index)
      && String(goal.item || '') === String(entry.name || '')
      && levelOf({ level: goal.observedLevel }) === levelOf(entry)
      && goal.character
      && String(goal.character) !== String(c.name || ''));
  }

  _collectionDeferredBankRequest() {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    if (!c || !ledger || typeof ledger.list !== 'function') return null;
    const allowed = new Set(['KEEP', 'RESERVE_GROUP', 'RESERVE_PROGRESSION', 'RESERVE_COMPOUND', 'RESERVE_UPGRADE']);
    const order = { KEEP: 0, RESERVE_GROUP: 1, RESERVE_COMPOUND: 2, RESERVE_UPGRADE: 3, RESERVE_PROGRESSION: 4 };
    const rows = ledger.list(1000)
      .filter((row) => row
        && String(row.character || '') === String(c.name || '')
        && allowed.has(String(row.disposition || ''))
        && !this.collectionCapacityBlockedIndexes.has(Number(row.index)))
      .sort((a, b) => finite(order[String(a.disposition)], 9) - finite(order[String(b.disposition)], 9)
        || Number(a.index) - Number(b.index));
    for (const row of rows) {
      const name = String(row.name || '');
      if (!name || /^(?:hpot|mpot|elixir)/i.test(name)) continue;
      if (this._collectionHasActiveFarmerGearGoal(row)) continue;
      const live = Array.isArray(c.items) ? c.items[Number(row.index)] : null;
      if (!live || String(live.name || '') !== name || levelOf(live) !== levelOf(row)) continue;
      if (live.locked === true || live.l === true || live.special === true || live.p) continue;
      return {
        type: 'BANK',
        character: c.name,
        index: Number(row.index),
        quantity: Math.max(1, Math.floor(finite(row.q, finite(live.q, 1)))),
        metadata: {
          source: 'ALPHA33_COLLECTION_CAPACITY_PREP',
          collectionCapacityPrep: true,
          originalDisposition: String(row.disposition || ''),
          reason: 'DEFERRED_ITEM_BANKED_FOR_MAX_FARMER_PICKUP_CAPACITY'
        }
      };
    }
    return null;
  }

  async _prepareCollectionCapacity(merchant, candidate) {
    const plan = this._collectionCapacityPlan(candidate);
    const normal = merchant && typeof merchant.planSellOrBank === 'function' ? merchant.planSellOrBank() : null;
    if (normal && ['SELL', 'BANK'].includes(String(normal.type || '')) && !this.collectionCapacityBlockedIndexes.has(Number(normal.index))) {
      const request = {
        ...normal,
        metadata: { ...(normal.metadata || {}), collectionCapacityPrep: true, source: normal.metadata && normal.metadata.source || 'ALPHA33_COLLECTION_CAPACITY_PREP' }
      };
      this.stats.collectionCapacityDisposals += 1;
      const acted = await merchant.executeEconomyRequest(request);
      if (!acted) {
        this.stats.collectionCapacityBlockedActions += 1;
        this.collectionCapacityBlockedIndexes.add(Number(request.index));
      }
      return { ready: false, acted: !!acted, plan, request, blocked: !acted, maximumSafeCapacityPending: true };
    }
    const deferredBank = this._collectionDeferredBankRequest();
    if (deferredBank) {
      this.stats.collectionCapacityDisposals += 1;
      this.stats.collectionCapacityDeferredBanks += 1;
      const acted = await merchant.executeEconomyRequest(deferredBank);
      if (!acted) {
        this.stats.collectionCapacityBlockedActions += 1;
        this.collectionCapacityBlockedIndexes.add(Number(deferredBank.index));
      }
      return { ready: false, acted: !!acted, plan, request: deferredBank, blocked: !acted, maximumSafeCapacityPending: true };
    }
    this.stats.collectionCapacityMaxSafePrepCompleted += 1;
    const finalPlan = this._collectionCapacityPlan(candidate);
    return { ready: true, acted: false, plan: finalPlan, maximumSafeCapacityPrepared: true, constrained: finalPlan.slotsToFree > 0 };
  }

  _collectionCoordinator() {
    return this.runtime.merchantTaskCoordinator || null;
  }

  _startCollectionRoute(candidate) {
    if (!candidate || !candidate.pickupEntryCount) return false;
    this.collectionCapacityBlockedIndexes.clear();
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

  _suspendCollectionRouteForCriticalSupply(plan) {
    const route = this.collectionRoute ? { ...this.collectionRoute, farmers: this.collectionRoute.farmers.slice() } : null;
    if (!route) return false;
    const details = {
      serviceKind: plan && plan.kind || null,
      target: plan && plan.target && plan.target.name || null,
      deliveries: plan && plan.deliveries || []
    };
    this._finishCollectionRoute('CRITICAL_PARTY_SUPPLY_PREEMPT', details);
    this.suspendedCollectionRoute = {
      ...route,
      suspendedAt: this.now(),
      suspendReason: 'CRITICAL_PARTY_SUPPLY_PREEMPT',
      stage: route.stage === 'PREPARE_CAPACITY' ? 'TRAVEL_TO_FARMERS' : route.stage
    };
    this.stats.collectionRoutesSuspendedForCriticalSupply += 1;
    this._event('MERCHANT_COLLECTION_ROUTE_SUSPENDED', 'info', 'CRITICAL_PARTY_SUPPLY_PREEMPT', {
      routeId: route.id,
      farmers: route.farmers.slice(),
      details
    });
    return true;
  }

  _resumeSuspendedCollectionRoute() {
    const suspended = this.suspendedCollectionRoute;
    if (!suspended) return false;
    const pressure = this._merchantCapacitySnapshot();
    if (pressure.freeSlots <= this._collectionReserveSlots()) {
      this.suspendedCollectionRoute = null;
      return false;
    }
    const coordinator = this._collectionCoordinator();
    const lock = coordinator && typeof coordinator.acquire === 'function'
      ? coordinator.acquire('RENDEZVOUS', 'COLLECTION_ROUTE', 'rendezvous:farmer-collection', {
          farmers: suspended.farmers.slice(),
          resumedAfter: suspended.suspendReason,
          previousRouteId: suspended.id
        }, { leaseMs: Math.max(120000, this.collectionPrepareMaxMs + 60000) })
      : { acquired: true };
    if (!lock.acquired) return false;
    const now = this.now();
    this.collectionRoute = {
      ...suspended,
      updatedAt: now,
      lastProgressAt: now,
      resumedAt: now,
      stage: suspended.stage === 'PREPARE_CAPACITY' ? 'TRAVEL_TO_FARMERS' : suspended.stage
    };
    this.suspendedCollectionRoute = null;
    this.stats.collectionRoutesResumedAfterCriticalSupply += 1;
    this._event('MERCHANT_COLLECTION_ROUTE_RESUMED', 'info', 'CRITICAL_PARTY_SUPPLY_COMPLETE_RESUME_COLLECTION', {
      routeId: this.collectionRoute.id,
      farmers: this.collectionRoute.farmers.slice(),
      freeSlots: pressure.freeSlots
    });
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

    const pressure = this._merchantCapacitySnapshot();
    const reserveSlots = this._collectionReserveSlots();
    if (route.stage !== 'PREPARE_CAPACITY' && pressure.freeSlots <= reserveSlots) {
      return this._finishCollectionRoute('MERCHANT_PICKUP_RESERVE_REACHED', {
        pickupQuantityRemaining: candidate && candidate.pickupQuantity || 0,
        occupied: pressure.occupied,
        capacity: pressure.capacity,
        freeSlots: pressure.freeSlots,
        reserveSlots
      });
    }

    candidate = this._merchantRendezvousCandidate();
    if (!candidate) {
      this._requestFarmerStateRefresh();

      // A transient "drained" snapshot is not a terminal collection state.
      // Farmers continue farming and can produce new loot immediately after the
      // settle window. Keep the collection task lock and stay/follow the known
      // Farmer group until the Merchant is actually full.
      const presence = this._collectionPresenceCandidate(route);
      if (presence) {
        const logistics = this.runtime.controlledPartyLogistics;
        const nearDistance = Math.max(120, Math.min(
          finite(logistics && logistics.config && logistics.config.rendezvousDistance, 260),
          finite(logistics && logistics.config && logistics.config.maxTransferDistance, 380) * 0.85
        ));
        const nearPresence = String(c.map || '') === String(presence.map) && distance(c, presence) <= nearDistance;
        if (!nearPresence) {
          await this._travelToFreshCandidate(merchant, presence, true);
          return true;
        }
        this.stats.collectionDrainedWaits += 1;
        route.stage = 'COLLECT';
        route.updatedAt = this.now();
        merchant.lastMerchantPlan = {
          at: this.now(),
          action: 'HOLD',
          reason: 'WAITING_FOR_NEW_FARMER_LOOT_UNTIL_MERCHANT_FULL',
          routeId: route.id,
          workers: presence.names.slice(),
          freeSlots: pressure.freeSlots
        };
        return true;
      }

      if (this._collectionRouteExplicitlyUnavailable(route)) {
        this.stats.collectionUnavailableCompletions += 1;
        return this._finishCollectionRoute('FARMERS_EXPLICITLY_UNAVAILABLE', {
          freeSlots: pressure.freeSlots,
          occupied: pressure.occupied,
          capacity: pressure.capacity
        });
      }

      this.stats.collectionDrainedWaits += 1;
      merchant.lastMerchantPlan = {
        at: this.now(),
        action: 'HOLD',
        reason: 'WAITING_FOR_FRESH_FARMER_STATE_UNTIL_MERCHANT_FULL',
        routeId: route.id,
        workers: route.farmers.slice(),
        freeSlots: pressure.freeSlots
      };
      return true;
    }

    if (candidate.pickupQuantity < route.lastPickupQuantity) {
      route.lastProgressAt = this.now();
      route.lastPickupQuantity = candidate.pickupQuantity;
    }
    route.updatedAt = this.now();
    route.farmers = [...new Set([...route.farmers, ...candidate.names])].sort();

    if (route.stage === 'PREPARE_CAPACITY') {
      const prepared = await this._prepareCollectionCapacity(merchant, candidate);
      if (!prepared.ready) {
        const prepareAgeMs = Math.max(0, this.now() - finite(route.startedAt, this.now()));
        merchant.lastMerchantPlan = {
          at: this.now(),
          action: 'COLLECTION_PREPARE',
          reason: prepared.blocked ? 'SKIPPING_BLOCKED_CAPACITY_ITEM_CONTINUE_PREP' : 'MAXIMIZING_SAFE_CAPACITY_BEFORE_FARMER_PICKUP',
          capacity: prepared.plan,
          prepareAgeMs,
          prepareMaxMs: this.collectionPrepareMaxMs,
          request: prepared.request || null
        };
        return true;
      }
      if (prepared.constrained) {
        this.stats.collectionCapacityConstrainedDepartures += 1;
        this._event('MERCHANT_COLLECTION_CAPACITY_CONSTRAINED', 'warn', 'NO_MORE_SAFE_CAPACITY_RELIEF', {
          routeId: route.id,
          capacity: prepared.plan,
          blockedIndexes: [...this.collectionCapacityBlockedIndexes]
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
      // Critical Farmer potion service must outrank collection. The live failure
      // mode was a circular wait: collection held the global Merchant task lock,
      // while the Rangers refused combat until that same Merchant delivered MP.
      // Ask Alpha27's already-latched supply-chain owner first; if it has real
      // RESTOCK/TRAVEL/DELIVERY work, release any collection lock and delegate.
      let criticalSupplyPlan = null;
      if (typeof merchant.criticalPartySupplyPlan === 'function') {
        try { criticalSupplyPlan = merchant.criticalPartySupplyPlan(); } catch (_) { criticalSupplyPlan = null; }
      }
      const criticalSupplyKind = String(criticalSupplyPlan && criticalSupplyPlan.kind || '');
      if (['RESTOCK_REQUIRED', 'SERVICE_TRAVEL', 'SERVICE_DELIVERY'].includes(criticalSupplyKind)) {
        if (this.collectionRoute) {
          this.stats.collectionRoutesPreemptedForCriticalSupply += 1;
          this._suspendCollectionRouteForCriticalSupply(criticalSupplyPlan);
        }
        return baseCycle();
      }

      // A critical supply detour releases the task lock so potions cannot
      // deadlock, but the Farmer collection obligation survives the detour.
      // Resume it before ordinary progression/production can pull the Merchant
      // back into town with free inventory slots.
      if (!this.collectionRoute && this.suspendedCollectionRoute) {
        const pressure = this._merchantCapacitySnapshot();
        if (pressure.freeSlots > this._collectionReserveSlots() && !this._resumeSuspendedCollectionRoute()) {
          merchant.lastMerchantPlan = {
            at: this.now(),
            action: 'HOLD',
            reason: 'WAITING_TO_RESUME_COLLECTION_AFTER_CRITICAL_SUPPLY',
            routeId: this.suspendedCollectionRoute.id,
            freeSlots: pressure.freeSlots
          };
          return true;
        }
        if (pressure.freeSlots <= this._collectionReserveSlots()) this.suspendedCollectionRoute = null;
      }

      // Fresh collection work still preempts ordinary progression/production.
      // It no longer preempts the critical party-supply service chain above.
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
        farmerGearAutoEquip: this.farmerGearEquipInstalled,
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
        targetedGearDeliveryIntentBeforeSend: true,
        gearDeliveryIntentRequiresFarmerPredeliverySnapshotAck: true,
        targetedGearIdentityHeldOutOfGenericLootUntilEquip: true,
        farmerReceivedReadyGearAutoEquippedAndVerified: true,
        localProgressionReservationRequiresExactActivePhysicalAssignment: true,
        localProgressionGearIsNotReturnedAsLoot: true,
        alpha27OwnsCrossMapMerchantRendezvous: true,
        merchantRendezvousRequiresPendingTransferWork: true,
        farmerPositionMustBeFresh: true,
        collectionRouteTaskLockedUntilTerminal: true,
        transientFarmerDrainDoesNotEndCollection: true,
        collectionReturnsToEconomyOnlyWhenInventoryFullOrFarmersExplicitlyUnavailable: true,
        criticalPartySupplyPreemptsCollectionRoute: true,
        criticalPartySupplySuspendsAndResumesCollection: true,
        rejectedOrTimedOutLootIsExcludedFromPickupTelemetry: true,
        merchantCapacityPreparedFromTotalFarmerPickupDemand: true,
        merchantCollectionMaximizesSafeFreeSlotsBeforeDeparture: true,
        collectionDeferredItemsBankedBeforeDeparture: true,
        operationalPotionsAndActiveFarmerGearGoalsStayLocal: true,
        merchantPickupReserveSlots: 1,
        merchantStopsCollectionWithOnePhysicalSlotFree: true,
        futureFarmerGearPreemptsMerchantSelfGear: true
      },
      config: {
        trainingRadiusFactor: this.trainingRadiusFactor,
        trainingRadiusMin: this.trainingRadiusMin,
        trainingRadiusMax: this.trainingRadiusMax,
        farmerStateIntervalMs: this.farmerStateIntervalMs,
        farmerPositionFreshMs: this.farmerPositionFreshMs,
        farmerGearGoalFreshMs: this.farmerGearGoalFreshMs,
        gearDeliveryIntentTtlMs: this.gearDeliveryIntentTtlMs,
        gearDeliveryIntentAckTimeoutMs: this.gearDeliveryIntentAckTimeoutMs,
        farmerGearEquipVerifyMs: this.farmerGearEquipVerifyMs,
        farmerGearEquipRetryMs: this.farmerGearEquipRetryMs,
        collectionSettleMs: this.collectionSettleMs,
        collectionPrepareMaxMs: this.collectionPrepareMaxMs,
        merchantRendezvousCooldownMs: this.merchantRendezvousCooldownMs
      },
      lastGearHold: this.lastGearHold ? { ...this.lastGearHold } : null,
      pendingFarmerGearEquip: this.pendingFarmerGearEquip ? { ...this.pendingFarmerGearEquip } : null,
      incomingGearIntents: [...this.incomingGearIntents.values()].map((row) => ({ ...row, beforeIndices: [...(row.beforeIndices || [])] })),
      pendingGearDeliveryIntentAckCount: this.pendingGearDeliveryIntentAcks.size,
      lastMerchantRendezvous: this.lastMerchantRendezvous ? { ...this.lastMerchantRendezvous } : null,
      collectionRoute: this.collectionRoute ? { ...this.collectionRoute } : null,
      suspendedCollectionRoute: this.suspendedCollectionRoute ? { ...this.suspendedCollectionRoute } : null,
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
  GEAR_DELIVERY_INTENT_ACTION,
  GEAR_DELIVERY_INTENT_ACK_ACTION,
  effectActiveOn,
  equipmentView,
  Alpha33MarkOrbitMerchantDelivery,
  installAlpha33MarkOrbitMerchantDelivery
};