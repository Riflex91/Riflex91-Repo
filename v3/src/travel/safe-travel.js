'use strict';

const TRAVEL_SCHEMA_VERSION = 1;
const TRAVEL_MODE = 'shadow-safe-travel-foundation';
const TRUSTED_MAP_ATTESTATION_SOURCES = new Set([
  'trusted-party-regroup-leader',
  'trusted-owned-farmer-service'
]);
const TravelState = Object.freeze({
  PLANNED: 'PLANNED',
  TRAVELLING: 'TRAVELLING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const TERMINAL = new Set([TravelState.COMPLETED, TravelState.ABORTED, TravelState.FAILED_SAFE]);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function point(snapshot = {}) {
  const c = snapshot.character || snapshot || {};
  return {
    map: String(c.map || ''),
    x: finite(c.x != null ? c.x : c.real_x, 0),
    y: finite(c.y != null ? c.y : c.real_y, 0)
  };
}
function distance(a, b) {
  const dx = finite(a && a.x) - finite(b && b.x);
  const dy = finite(a && a.y) - finite(b && b.y);
  return Math.hypot(dx, dy);
}

class SafeTravelController {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(16, Math.min(256, Math.floor(finite(options.capacity, 64))));
    this.leaseMs = Math.max(5000, Math.min(30 * 60 * 1000, finite(options.leaseMs, 120000)));
    this.noProgressMs = Math.max(2000, Math.min(5 * 60 * 1000, finite(options.noProgressMs, 15000)));
    this.arrivalRadius = Math.max(5, Math.min(300, finite(options.arrivalRadius, 80)));
    this.failureThreshold = Math.max(1, Math.min(20, Math.floor(finite(options.failureThreshold, 3))));
    this.failureWindowMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.circuitCooldownMs = Math.max(5000, Math.min(60 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.minProgressDistance = Math.max(1, Math.min(200, finite(options.minProgressDistance, 12)));
    this.plans = new Map();
    this.sequence = 0;
    this.failures = [];
    this.circuit = null;
    this.stats = { planned: 0, rejected: 0, syntheticStarts: 0, completed: 0, aborted: 0, failedSafe: 0, progress: 0, capacityEvictions: 0, attestedMapPlans: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'safe-travel', event, severity, reason, data });
    }
  }

  _id() {
    this.sequence += 1;
    return `travel-${this.now().toString(36)}-${this.sequence.toString(36)}`;
  }

  _pruneFailures(now = this.now()) {
    this.failures = this.failures.filter((row) => now - row.at <= this.failureWindowMs);
    if (this.circuit && this.circuit.openUntil <= now) this.circuit = null;
  }

  breaker() {
    const now = this.now();
    this._pruneFailures(now);
    return {
      open: !!(this.circuit && this.circuit.openUntil > now),
      openUntil: this.circuit ? this.circuit.openUntil : null,
      reason: this.circuit ? this.circuit.reason : null,
      failuresInWindow: this.failures.length,
      threshold: this.failureThreshold,
      windowMs: this.failureWindowMs,
      cooldownMs: this.circuitCooldownMs
    };
  }

  _failure(reason, plan = null) {
    const now = this.now();
    this._pruneFailures(now);
    this.failures.push({ at: now, reason: String(reason || 'TRAVEL_FAILURE'), planId: plan && plan.id || null });
    if (this.failures.length >= this.failureThreshold) {
      this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'TRAVEL_FAILURE_BUDGET') };
      this._event('TRAVEL_CIRCUIT_OPENED', 'warn', reason, { openUntil: this.circuit.openUntil, failures: this.failures.length });
    }
  }

  _reject(reason, data = {}) {
    this.stats.rejected += 1;
    this._event('TRAVEL_PLAN_REJECTED', 'warn', reason, data);
    return { accepted: false, reason };
  }

  _evict() {
    if (this.plans.size < this.capacity) return;
    const row = [...this.plans.values()].filter((p) => TERMINAL.has(p.state)).sort((a, b) => finite(a.updatedAt) - finite(b.updatedAt))[0];
    if (row) {
      this.plans.delete(row.id);
      this.stats.capacityEvictions += 1;
    }
  }

  _trustedMapAttestation(map, context = {}) {
    const attestation = context && context.destinationMapAttestation;
    if (!attestation || attestation.trusted !== true) return null;
    if (String(attestation.map || '') !== String(map || '')) return null;
    const source = String(attestation.source || '');
    if (!TRUSTED_MAP_ATTESTATION_SOURCES.has(source)) return null;
    const observedAt = Number(attestation.observedAt);
    if (!Number.isFinite(observedAt) || observedAt <= 0) return null;
    const maxAgeMs = Math.max(1000, Math.min(30000, finite(attestation.maxAgeMs, 7000)));
    const ageMs = this.now() - observedAt;
    if (ageMs < -2000 || ageMs > maxAgeMs) return null;
    return {
      map: String(map),
      source,
      observedAt,
      ageMs,
      maxAgeMs,
      subject: attestation.subject == null ? null : String(attestation.subject).slice(0, 64)
    };
  }

  plan(request = {}, context = {}) {
    if (this.breaker().open) return this._reject('TRAVEL_CIRCUIT_OPEN');
    if (request.server || request.region || request.serverChange === true) return this._reject('SERVER_CHANGE_FORBIDDEN');
    const destination = typeof request.destination === 'string' ? { map: request.destination } : clone(request.destination || {});
    const map = String(destination.map || '').trim();
    if (!map) return this._reject('DESTINATION_MAP_REQUIRED');
    const gameData = context.gameData || {};
    if (!gameData.maps || !Object.prototype.hasOwnProperty.call(gameData.maps, map)) return this._reject('UNKNOWN_DESTINATION_MAP', { map });
    let mapAttestation = null;
    if (context.contentDrift && typeof context.contentDrift.requiresRevalidation === 'function' && context.contentDrift.requiresRevalidation('maps', map)) {
      mapAttestation = this._trustedMapAttestation(map, context);
      if (!mapAttestation) return this._reject('DESTINATION_MAP_REQUIRES_REVALIDATION', { map, attestationAccepted: false });
      this.stats.attestedMapPlans += 1;
      this._event('TRAVEL_DESTINATION_MAP_ATTESTED', 'info', 'FRESH_TRUSTED_PARTY_MAP_ATTESTATION', { ...mapAttestation });
    }
    const start = point(context.snapshot || {});
    if (!start.map) return this._reject('TRAVEL_SNAPSHOT_UNAVAILABLE');
    const target = {
      map,
      x: destination.x == null ? null : finite(destination.x, 0),
      y: destination.y == null ? null : finite(destination.y, 0)
    };
    this._evict();
    if (this.plans.size >= this.capacity) return this._reject('TRAVEL_CAPACITY_EXHAUSTED');
    const now = this.now();
    const id = this._id();
    const row = {
      schemaVersion: TRAVEL_SCHEMA_VERSION,
      id,
      state: TravelState.PLANNED,
      createdAt: now,
      updatedAt: now,
      leaseExpiresAt: now + this.leaseMs,
      lastProgressAt: now,
      start,
      lastObserved: start,
      target,
      arrivalRadius: request.arrivalRadius == null
        ? this.arrivalRadius
        : Math.max(5, Math.min(300, finite(request.arrivalRadius, this.arrivalRadius))),
      reason: mapAttestation ? 'SAFE_PLAN_CREATED_WITH_TRUSTED_MAP_ATTESTATION' : 'SAFE_PLAN_CREATED',
      actionAuthority: false,
      liveExecutionAllowed: false,
      serverChangeAllowed: false,
      routeKind: start.map === map ? 'SAME_MAP' : 'CROSS_MAP_KNOWN_ONLY',
      destinationMapAttestation: mapAttestation,
      metadata: request.metadata && typeof request.metadata === 'object' ? clone(request.metadata) : {}
    };
    this.plans.set(id, row);
    this.stats.planned += 1;
    this._event('TRAVEL_PLAN_CREATED', 'info', null, { planId: id, from: start.map, to: map, routeKind: row.routeKind, mapAttested: !!mapAttestation, arrivalRadius: row.arrivalRadius });
    return { accepted: true, plan: clone(row) };
  }

  startSynthetic(id) {
    const row = this.plans.get(String(id));
    if (!row || row.state !== TravelState.PLANNED) return { started: false, reason: 'PLAN_NOT_STARTABLE' };
    if (this.breaker().open) return { started: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    row.state = TravelState.TRAVELLING;
    row.updatedAt = this.now();
    row.lastProgressAt = row.updatedAt;
    row.reason = 'SYNTHETIC_EXECUTION_STARTED';
    this.stats.syntheticStarts += 1;
    this._event('TRAVEL_SYNTHETIC_STARTED', 'info', null, { planId: row.id });
    return { started: true, plan: clone(row) };
  }

  _arrived(row, observed) {
    if (!row || !observed || observed.map !== row.target.map) return false;
    if (row.target.x == null || row.target.y == null) return true;
    return distance(observed, row.target) <= Math.max(5, finite(row.arrivalRadius, this.arrivalRadius));
  }

  observe(snapshot) {
    const now = this.now();
    const observed = point(snapshot || {});
    const results = [];
    for (const row of this.plans.values()) {
      if (TERMINAL.has(row.state) || row.state === TravelState.PLANNED) continue;
      if (row.leaseExpiresAt != null && now > row.leaseExpiresAt) {
        row.state = TravelState.FAILED_SAFE;
        row.reason = 'TRAVEL_LEASE_EXPIRED';
        row.updatedAt = now;
        this.stats.failedSafe += 1;
        this._failure(row.reason, row);
        results.push({ id: row.id, state: row.state, reason: row.reason });
        continue;
      }
      const mapChanged = observed.map && observed.map !== row.lastObserved.map;
      const moved = observed.map === row.lastObserved.map && distance(observed, row.lastObserved) >= this.minProgressDistance;
      if (mapChanged || moved) {
        row.lastProgressAt = now;
        row.lastObserved = observed;
        row.updatedAt = now;
        this.stats.progress += 1;
        this._event('TRAVEL_PROGRESS', 'debug', null, { planId: row.id, observed });
      }
      if (this._arrived(row, observed)) {
        row.state = TravelState.COMPLETED;
        row.reason = 'ARRIVAL_VERIFIED';
        row.updatedAt = now;
        row.lastObserved = observed;
        this.stats.completed += 1;
        this.failures = [];
        this.circuit = null;
        this._event('TRAVEL_COMPLETED', 'info', null, { planId: row.id, observed });
        results.push({ id: row.id, state: row.state, reason: row.reason });
        continue;
      }
      if (now - row.lastProgressAt > this.noProgressMs) {
        row.state = TravelState.FAILED_SAFE;
        row.reason = 'TRAVEL_NO_PROGRESS_TIMEOUT';
        row.updatedAt = now;
        this.stats.failedSafe += 1;
        this._failure(row.reason, row);
        this._event('TRAVEL_FAILED_SAFE', 'warn', row.reason, { planId: row.id });
        results.push({ id: row.id, state: row.state, reason: row.reason });
      }
    }
    return results;
  }

  cancel(id, reason = 'OPERATOR_CANCELLED') {
    const row = this.plans.get(String(id));
    if (!row) return { cancelled: false, reason: 'PLAN_NOT_FOUND' };
    if (TERMINAL.has(row.state)) return { cancelled: false, reason: 'PLAN_ALREADY_TERMINAL', plan: clone(row) };
    row.state = TravelState.ABORTED;
    row.reason = String(reason || 'OPERATOR_CANCELLED');
    row.updatedAt = this.now();
    this.stats.aborted += 1;
    this._event('TRAVEL_ABORTED', 'warn', row.reason, { planId: row.id });
    return { cancelled: true, plan: clone(row) };
  }

  tick(snapshot) {
    this._pruneFailures(this.now());
    return this.observe(snapshot);
  }

  get(id) {
    const row = this.plans.get(String(id));
    return row ? clone(row) : null;
  }

  list(limit = 100) {
    const rows = [...this.plans.values()].sort((a, b) => finite(a.createdAt) - finite(b.createdAt));
    const n = Math.max(0, Math.min(rows.length, Math.floor(finite(limit, 100))));
    return rows.slice(rows.length - n).map(clone);
  }

  status() {
    const rows = [...this.plans.values()];
    const states = {};
    for (const state of Object.values(TravelState)) states[state] = rows.filter((row) => row.state === state).length;
    return {
      schemaVersion: TRAVEL_SCHEMA_VERSION,
      mode: TRAVEL_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      liveExecutionEnabled: false,
      smartMoveExecutionEnabled: false,
      serverChangeAllowed: false,
      unknownMapTravelAllowed: false,
      trustedMapAttestationSources: [...TRUSTED_MAP_ATTESTATION_SOURCES],
      capacity: this.capacity,
      leaseMs: this.leaseMs,
      noProgressMs: this.noProgressMs,
      arrivalRadius: this.arrivalRadius,
      plans: rows.length,
      active: rows.filter((row) => !TERMINAL.has(row.state) && row.state !== TravelState.PLANNED).length,
      states,
      circuit: this.breaker(),
      stats: clone(this.stats)
    };
  }
}

module.exports = { SafeTravelController, TRAVEL_SCHEMA_VERSION, TRAVEL_MODE, TravelState, TRUSTED_MAP_ATTESTATION_SOURCES };
