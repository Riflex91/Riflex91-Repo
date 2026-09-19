'use strict';

const MERCHANT_ROUTE_STABILITY_MODE = 'merchant-route-stability-v1';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clone(value) { try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }

function routeZone(destination, context = {}) {
  const task = context.task || null;
  const kind = String(task && task.kind || '');
  if (kind === 'COLLECTION') return 'COLLECTION';
  if (kind === 'PROGRESSION_BATCH') return 'PROGRESSION';
  if (kind === 'EXCHANGE_BATCH') return 'EXCHANGE';
  if (destination && typeof destination === 'object') return 'DYNAMIC';
  const key = String(destination == null ? '' : destination).toLowerCase();
  if (!key) return 'UNKNOWN';
  if (key.startsWith('bank')) return 'BANK';
  if (key === 'newupgrade' || key === 'upgrade' || key === 'compound') return 'PROGRESSION';
  if (key === 'exchange') return 'EXCHANGE';
  return 'VENDOR';
}

class MerchantRouteStability {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = options.now || runtime.now || (() => Date.now());
    this.log = options.log || runtime.log || null;
    this.holdMs = Math.max(2000, Math.min(60000, finite(options.holdMs, 10000)));
    this.pingPongWindowMs = Math.max(this.holdMs, Math.min(5 * 60 * 1000, finite(options.pingPongWindowMs, 45000)));
    this.currentZone = null;
    this.previousZone = null;
    this.arrivedAt = null;
    this.leaseUntil = 0;
    this.lastDecision = null;
    this.history = [];
    this.stats = { requests: 0, allowed: 0, sameZone: 0, highPriority: 0, holdBlocks: 0, pingPongBlocks: 0, arrivals: 0, zoneSwitches: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'merchant-route-stability', event, severity, reason, data }); } catch (_) {}
  }

  _priority(context = {}) {
    if (context.critical === true) return 'high';
    const task = context.task || null;
    const kind = String(task && task.kind || '');
    if (['COLLECTION', 'PROGRESSION_BATCH', 'EXCHANGE_BATCH'].includes(kind)) return 'high';
    if (['BANK_CATALOG', 'BANK_RECOVERY'].includes(kind)) return 'normal';
    if (['DISPOSAL'].includes(kind)) return 'low';
    const txType = String(context.txType || '').toUpperCase();
    if (['UPGRADE', 'COMPOUND'].includes(txType)) return 'high';
    return 'normal';
  }

  request(destination, context = {}) {
    const now = this.now();
    this.stats.requests += 1;
    const zone = routeZone(destination, context);
    const priority = this._priority(context);
    let allowed = true;
    let reason = 'ROUTE_ALLOWED';

    if (!this.currentZone || zone === 'UNKNOWN' || zone === 'DYNAMIC') {
      reason = 'NO_STABLE_ZONE_CONFLICT';
    } else if (zone === this.currentZone) {
      this.stats.sameZone += 1;
      reason = 'SAME_SERVICE_ZONE';
    } else if (priority === 'high') {
      this.stats.highPriority += 1;
      reason = 'HIGH_PRIORITY_ROUTE_PREEMPTION';
    } else if (priority === 'low' && now < this.leaseUntil) {
      allowed = false;
      reason = 'CURRENT_SERVICE_ZONE_LEASE_ACTIVE';
      this.stats.holdBlocks += 1;
    } else if (this.previousZone && zone === this.previousZone && this.arrivedAt != null && now - this.arrivedAt < this.pingPongWindowMs) {
      allowed = false;
      reason = 'MERCHANT_ROUTE_PINGPONG_GUARD';
      this.stats.pingPongBlocks += 1;
    }

    if (allowed) this.stats.allowed += 1;
    this.lastDecision = {
      at: now, allowed, reason, zone, priority, currentZone: this.currentZone,
      previousZone: this.previousZone, leaseUntil: this.leaseUntil || null
    };
    if (!allowed) this._event('MERCHANT_ROUTE_SWITCH_BLOCKED', 'info', reason, clone(this.lastDecision));
    return clone(this.lastDecision);
  }

  noteArrival(destination, context = {}) {
    const now = this.now();
    const zone = routeZone(destination, context);
    if (!zone || zone === 'UNKNOWN' || zone === 'DYNAMIC') return false;
    if (this.currentZone && this.currentZone !== zone) {
      this.previousZone = this.currentZone;
      this.stats.zoneSwitches += 1;
    }
    this.currentZone = zone;
    this.arrivedAt = now;
    this.leaseUntil = now + this.holdMs;
    this.stats.arrivals += 1;
    this.history.push({ at: now, zone, destination: typeof destination === 'object' ? 'object' : String(destination) });
    this.history = this.history.slice(-16);
    this._event('MERCHANT_ROUTE_ZONE_ARRIVED', 'info', zone, { zone, leaseUntil: this.leaseUntil });
    return true;
  }

  release(reason = 'ROUTE_LEASE_RELEASED') {
    this.leaseUntil = 0;
    this._event('MERCHANT_ROUTE_LEASE_RELEASED', 'info', reason, { currentZone: this.currentZone });
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: MERCHANT_ROUTE_STABILITY_MODE,
      currentZone: this.currentZone,
      previousZone: this.previousZone,
      arrivedAt: this.arrivedAt,
      leaseUntil: this.leaseUntil || null,
      holdMs: this.holdMs,
      pingPongWindowMs: this.pingPongWindowMs,
      lastDecision: clone(this.lastDecision),
      recent: this.history.slice(-8).map(clone),
      stats: clone(this.stats)
    };
  }
}

function installMerchantRouteStability(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.merchantRouteStability) return runtime.merchantRouteStability;
  runtime.merchantRouteStability = new MerchantRouteStability(runtime, {
    now: runtime.now,
    log: runtime.log,
    holdMs: options.merchantRouteHoldMs,
    pingPongWindowMs: options.merchantRoutePingPongWindowMs
  });
  return runtime.merchantRouteStability;
}

module.exports = { MerchantRouteStability, installMerchantRouteStability, MERCHANT_ROUTE_STABILITY_MODE, routeZone };
