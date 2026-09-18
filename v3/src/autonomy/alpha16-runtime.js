'use strict';

const { Alpha15Runtime } = require('./alpha15-runtime');
const { SafeTravelController } = require('../travel/safe-travel');

const ALPHA16_VERSION = '3.0.0-alpha.16.0';

function composeAlpha16Runtime(options = {}) {
this.log.version = ALPHA16_VERSION;
    this.travelMaintenanceIntervalMs = Math.max(250, Math.min(30000, Number(options.travelMaintenanceIntervalMs) || 1000));
    this.lastTravelMaintenanceAt = -Infinity;
    this.safeTravel = options.safeTravel || new SafeTravelController({
      now: this.now,
      log: this.log,
      capacity: options.travelCapacity,
      leaseMs: options.travelLeaseMs,
      noProgressMs: options.travelNoProgressMs,
      arrivalRadius: options.travelArrivalRadius,
      minProgressDistance: options.travelMinProgressDistance,
      failureThreshold: options.travelFailureThreshold,
      failureWindowMs: options.travelFailureWindowMs,
      circuitCooldownMs: options.travelCircuitCooldownMs
    });
}

class Alpha16Runtime extends Alpha15Runtime {
  constructor(options = {}) {
    super(options);
    composeAlpha16Runtime.call(this, options);
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA16_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _travelStatus() { return this.safeTravel.status(); }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastTravelMaintenanceAt >= this.travelMaintenanceIntervalMs) {
      this.lastTravelMaintenanceAt = now;
      this.safeTravel.tick(this.lastSnapshot || {});
    }
  }

  setTravelLiveEnabled() {
    this.log.emit({ component: 'safe-travel', event: 'LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'ALPHA16_SHADOW_ONLY' });
    return false;
  }

  planTravel(request, context = {}) {
    return this.safeTravel.plan(request, {
      gameData: this.adapter.getGameData() || {},
      contentDrift: this.contentDrift,
      snapshot: this.lastSnapshot || this.adapter.snapshot(),
      destinationMapAttestation: context && context.destinationMapAttestation || null
    });
  }

  status() {
    const base = super.status();
    return { ...base, version: ALPHA16_VERSION, travel: this._travelStatus() };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.travel = { status: this.safeTravel.status(), plans: this.safeTravel.list(100) };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha16Runtime, ALPHA16_VERSION, composeAlpha16Runtime };
