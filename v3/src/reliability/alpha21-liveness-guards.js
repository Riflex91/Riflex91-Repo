'use strict';

const { ControlledPartyLogistics, Action } = require('../party/controlled-party-logistics');
const { EconomyEquipmentAutonomyV2, HomePhase } = require('./economy-equipment-autonomy-v2');

const ALPHA21_LIVENESS_MODE = 'alpha21-farmer-merchant-liveness-guards-v2';
const ACTIONABLE_RENDEZVOUS_ACTIONS = new Set([
  Action.RENDEZVOUS,
  Action.SUPPLY_REQUEST,
  Action.LOOT_OFFER,
  Action.GOLD_OFFER
]);

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function distance(a, b) {
  const ax = finite(a && (a.real_x != null ? a.real_x : a.x));
  const ay = finite(a && (a.real_y != null ? a.real_y : a.y));
  const bx = finite(b && (b.real_x != null ? b.real_x : b.x));
  const by = finite(b && (b.real_y != null ? b.real_y : b.y));
  if ([ax, ay, bx, by].some((v) => v == null)) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function outboundWork(logistics, snapshot) {
  if (!logistics || !snapshot || !snapshot.character) return { hasWork: false, goldSurplus: 0, item: null };
  const goldSurplus = Math.max(
    0,
    Math.floor(finite(snapshot.character.gold, 0) - finite(logistics.config && logistics.config.farmerGoldReserve, 0))
  );
  let item = null;
  try {
    item = typeof logistics._safeLootCandidate === 'function' ? logistics._safeLootCandidate(snapshot) : null;
  } catch (_) {
    item = null;
  }
  return { hasWork: goldSurplus > 0 || !!item, goldSurplus, item };
}

function canMoveTo(runtime, x, y) {
  const root = runtime && runtime.root || globalThis;
  const parent = root && root.parent || root;
  const fn = root && root.can_move_to || parent && parent.can_move_to;
  if (typeof fn !== 'function') return true;
  try { return fn.call(root, x, y) !== false; } catch (_) { return false; }
}

function movementCircuitOpen(adapter) {
  if (!adapter || typeof adapter.stabilityStatus !== 'function') return false;
  try {
    const movement = adapter.stabilityStatus().movement || {};
    return movement.circuitOpen === true || !!movement.pendingOutcomeId;
  } catch (_) {
    return true;
  }
}

function boundedReachableMove(from, target, options = {}) {
  const d = distance(from, target);
  if (!Number.isFinite(d) || d <= finite(options.stopDistance, 0)) return null;
  const maxStep = Math.max(20, finite(options.maxStep, 120));
  const stopDistance = Math.max(0, finite(options.stopDistance, 0));
  const step = Math.min(maxStep, Math.max(0, d - stopDistance));
  if (step < 2) return null;
  const cx = finite(from && (from.real_x != null ? from.real_x : from.x));
  const cy = finite(from && (from.real_y != null ? from.real_y : from.y));
  const tx = finite(target && (target.real_x != null ? target.real_x : target.x));
  const ty = finite(target && (target.real_y != null ? target.real_y : target.y));
  if ([cx, cy, tx, ty].some((v) => v == null)) return null;
  const base = Math.atan2(ty - cy, tx - cx);
  const reachable = typeof options.canMoveTo === 'function' ? options.canMoveTo : () => true;
  for (const offsetDeg of [0, 15, -15, 30, -30, 45, -45, 65, -65, 90, -90]) {
    const angle = base + offsetDeg * Math.PI / 180;
    const x = cx + Math.cos(angle) * step;
    const y = cy + Math.sin(angle) * step;
    if (!reachable(x, y)) continue;
    const nextDistance = Math.hypot(tx - x, ty - y);
    if (nextDistance >= d - 1) continue;
    return { x, y, step, offsetDeg, distance: d, nextDistance, improvement: d - nextDistance };
  }
  return null;
}

function patchControlledPartyLogisticsRendezvous() {
  const proto = ControlledPartyLogistics && ControlledPartyLogistics.prototype;
  if (!proto || proto.__alpha21RendezvousPatched) return false;

  if (typeof proto._rememberRendezvous === 'function') {
    const baseRemember = proto._rememberRendezvous;
    proto._rememberRendezvous = function alpha21RememberRendezvous(sender, data) {
      const action = String(data && data.action || '');
      if (!ACTIONABLE_RENDEZVOUS_ACTIONS.has(action)) {
        this.__alpha21IgnoredNonWorkRendezvous = (this.__alpha21IgnoredNonWorkRendezvous || 0) + 1;
        return false;
      }
      const result = baseRemember.call(this, sender, data);
      const row = this.rendezvousRequests && this.rendezvousRequests.get(sender);
      if (row) {
        row.action = action;
        row.workReason = action === Action.RENDEZVOUS
          ? String(data && data.reason || 'OUTBOUND_TRANSFER')
          : action;
        row.blockedUntil = finite(row.blockedUntil, 0);
      }
      return result;
    };
  }

  if (typeof proto._offerOutbound === 'function') {
    const baseOfferOutbound = proto._offerOutbound;
    proto._offerOutbound = function alpha21OfferOutbound(snapshot) {
      if (!this.pendingOffer && !this.pendingGrant && !this.pendingOutbound) {
        const work = outboundWork(this, snapshot);
        if (!work.hasWork) {
          this.lastDecision = {
            at: this.now(),
            action: 'HOLD',
            reason: 'NO_OUTBOUND_TRANSFER_WORK'
          };
          this.__alpha21EmptyRendezvousSuppressed = (this.__alpha21EmptyRendezvousSuppressed || 0) + 1;
          return false;
        }
      }
      return baseOfferOutbound.call(this, snapshot);
    };
  }

  if (typeof proto._rendezvousMerchant === 'function') {
    proto._rendezvousMerchant = function alpha21RendezvousMerchant(snapshot) {
      const now = this.now();
      if (now - this.lastRendezvousMoveAt < this.config.rendezvousCooldownMs) return false;
      if (!snapshot || !snapshot.character || !this.rendezvousRequests) return false;
      if (movementCircuitOpen(this.adapter)) {
        this.lastDecision = { at: now, action: 'HOLD', reason: 'LOGISTICS_RENDEZVOUS_MOVEMENT_BUSY' };
        return false;
      }

      const here = snapshot.character;
      const rows = [];
      for (const [name, row] of this.rendezvousRequests.entries()) {
        if (!row || now - finite(row.at, 0) > this.config.rendezvousRequestTtlMs) {
          this.rendezvousRequests.delete(name);
          continue;
        }
        if (finite(row.blockedUntil, 0) > now) continue;
        if (typeof this._withinTransferRange === 'function' && this._withinTransferRange(here, row)) {
          this.rendezvousRequests.delete(name);
          continue;
        }
        rows.push(row);
      }
      if (!rows.length) return false;

      const sameMap = rows.filter((row) => !row.map || !here.map || row.map === here.map);
      if (!sameMap.length) {
        this.stats.rendezvousCrossMap += 1;
        this.lastDecision = { at: now, action: 'HOLD', reason: 'LOGISTICS_RENDEZVOUS_CROSS_MAP_UNSUPPORTED' };
        return false;
      }

      const centroid = {
        map: here.map,
        x: sameMap.reduce((sum, row) => sum + finite(row.x, 0), 0) / sameMap.length,
        y: sameMap.reduce((sum, row) => sum + finite(row.y, 0), 0) / sameMap.length
      };
      const d = distance(here, centroid);
      if (!Number.isFinite(d) || d <= this.config.rendezvousDistance) {
        for (const row of sameMap) this.rendezvousRequests.delete(row.name);
        return false;
      }

      const waypoint = boundedReachableMove(here, centroid, {
        maxStep: this.config.rendezvousStep,
        stopDistance: this.config.rendezvousDistance * 0.75,
        canMoveTo: (x, y) => canMoveTo(this.runtime, x, y)
      });
      if (!waypoint) {
        const blockedUntil = now + Math.max(3000, finite(this.config.rendezvousCooldownMs, 2500) * 2);
        for (const row of sameMap) {
          const stored = this.rendezvousRequests.get(row.name);
          if (stored) stored.blockedUntil = blockedUntil;
        }
        this.__alpha21RendezvousTerrainBlocks = (this.__alpha21RendezvousTerrainBlocks || 0) + 1;
        this.lastDecision = {
          at: now,
          action: 'HOLD',
          reason: 'LOGISTICS_RENDEZVOUS_TERRAIN_BLOCKED',
          blockedUntil
        };
        return false;
      }

      const result = this.adapter && typeof this.adapter.command === 'function'
        ? this.adapter.command('move', [waypoint.x, waypoint.y])
        : { executed: false, reason: 'ADAPTER_UNAVAILABLE' };
      this.lastRendezvousMoveAt = now;
      if (result.executed || result.coalesced || result.shadow) this.stats.rendezvousMoves += 1;
      if (!result.executed && !result.coalesced && !result.shadow) {
        const blockedUntil = now + Math.max(3000, finite(this.config.rendezvousCooldownMs, 2500) * 2);
        for (const row of sameMap) {
          const stored = this.rendezvousRequests.get(row.name);
          if (stored) stored.blockedUntil = blockedUntil;
        }
      }
      this.lastDecision = {
        at: now,
        action: 'MERCHANT_RENDEZVOUS',
        reason: 'ACTIONABLE_PARTY_LOGISTICS_PENDING',
        distance: d,
        projectedDistance: waypoint.nextDistance,
        x: waypoint.x,
        y: waypoint.y,
        terrainOffsetDeg: waypoint.offsetDeg,
        executed: !!result.executed,
        resultReason: result.reason || null
      };
      return !!(result.executed || result.coalesced || result.shadow);
    };
  }

  if (typeof proto.status === 'function') {
    const baseStatus = proto.status;
    proto.status = function alpha21RendezvousStatus() {
      const status = baseStatus.call(this);
      return {
        ...status,
        alpha21: {
          emptyRendezvousSuppressed: this.__alpha21EmptyRendezvousSuppressed || 0,
          ignoredNonWorkRendezvous: this.__alpha21IgnoredNonWorkRendezvous || 0,
          terrainBlockedRendezvous: this.__alpha21RendezvousTerrainBlocks || 0,
          onlyActionableWorkCreatesRendezvous: true,
          statusRequestsNeverCreateRendezvous: true,
          directRendezvousMovesRequireReachableStep: true
        }
      };
    };
  }

  proto.__alpha21RendezvousPatched = true;
  return true;
}

function actionableRendezvousRows(logistics, now) {
  if (!logistics || !logistics.rendezvousRequests) return [];
  const current = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const ttl = finite(logistics.config && logistics.config.rendezvousRequestTtlMs, 15000);
  return [...logistics.rendezvousRequests.values()].filter((row) =>
    row &&
    ACTIONABLE_RENDEZVOUS_ACTIONS.has(String(row.action || Action.RENDEZVOUS)) &&
    current - finite(row.at, 0) <= ttl &&
    finite(row.blockedUntil, 0) <= current
  );
}

function patchEconomyV2PartyStarvation() {
  const proto = EconomyEquipmentAutonomyV2 && EconomyEquipmentAutonomyV2.prototype;
  if (!proto || proto.__alpha21PartyStarvationPatched) return false;

  if (typeof proto._need === 'function') {
    const baseNeed = proto._need;
    proto._need = function alpha21Need() {
      const need = baseNeed.call(this);
      if (!need || need.reason !== 'LOGISTICS_RENDEZVOUS') return need;
      const logistics = this.runtime && this.runtime.controlledPartyLogistics;
      const actionable = actionableRendezvousRows(logistics, this.now());
      if (!actionable.length) return null;
      if (need.report && actionable.some((row) => row.name === need.report.name)) return need;
      const row = actionable[0];
      return {
        report: { name: row.name, map: row.map, x: row.x, y: row.y, at: row.at },
        priority: 75,
        reason: 'LOGISTICS_RENDEZVOUS'
      };
    };
  }

  if (typeof proto._partyService === 'function') {
    const basePartyService = proto._partyService;
    proto._partyService = async function alpha21PartyService(need) {
      if (!need || need.reason !== 'LOGISTICS_RENDEZVOUS') return basePartyService.call(this, need);

      const logistics = this.runtime && this.runtime.controlledPartyLogistics;
      const snapshot = this.runtime && this.runtime.lastSnapshot;
      const row = logistics && logistics.rendezvousRequests &&
        need.report && logistics.rendezvousRequests.get(need.report.name);
      const blocked = !row ||
        finite(row.blockedUntil, 0) > this.now() ||
        movementCircuitOpen(this.runtime && this.runtime.adapter);

      let moved = false;
      if (!blocked && logistics && typeof logistics._rendezvousMerchant === 'function' && snapshot) {
        moved = logistics._rendezvousMerchant(snapshot) === true;
      }

      if (moved) {
        this.stats.partyPreemptions += 1;
        this.lastDecision = {
          at: this.now(),
          action: 'PARTY_SERVICE',
          reason: need.reason,
          target: need.report && need.report.name || null,
          priority: need.priority,
          movementOwner: 'CONTROLLED_PARTY_LOGISTICS'
        };
        return true;
      }

      if (row) row.blockedUntil = Math.max(finite(row.blockedUntil, 0), this.now() + 5000);
      this._transition(HomePhase.TOWN_RETURN, 'RENDEZVOUS_DEFERRED_HOME_SERVICE_CONTINUES', {
        target: need.report && need.report.name || null
      });
      this.lastDecision = {
        at: this.now(),
        action: 'HOME_SERVICE',
        reason: 'FAILED_RENDEZVOUS_MUST_NOT_STARVE_HOME_SERVICE',
        target: need.report && need.report.name || null
      };
      return false;
    };
  }

  proto.__alpha21PartyStarvationPatched = true;
  return true;
}

function patchAlpha21LivenessGuards() {
  return {
    logistics: patchControlledPartyLogisticsRendezvous(),
    economyV2: patchEconomyV2PartyStarvation()
  };
}

module.exports = {
  ALPHA21_LIVENESS_MODE,
  ACTIONABLE_RENDEZVOUS_ACTIONS,
  outboundWork,
  boundedReachableMove,
  actionableRendezvousRows,
  patchControlledPartyLogisticsRendezvous,
  patchEconomyV2PartyStarvation,
  patchAlpha21LivenessGuards
};
