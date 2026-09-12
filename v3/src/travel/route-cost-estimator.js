'use strict';

const ROUTE_COST_MODE = 'shadow-route-cost-estimator';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class RouteCostEstimator {
  constructor(options = {}) {
    this.minTownSavingsMs = Math.max(5000, Math.min(5 * 60 * 1000, finite(options.minTownSavingsMs, 30000)));
    this.defaultUncertaintyMs = Math.max(0, Math.min(5 * 60 * 1000, finite(options.defaultUncertaintyMs, 10000)));
    this.lastDecision = null;
    this.stats = { decisions: 0, direct: 0, town: 0, unknown: 0 };
  }

  estimateDirect(input = {}) {
    const supplied = finite(input.directEtaMs);
    if (supplied != null && supplied >= 0) return supplied;
    const distance = finite(input.distance);
    const speed = finite(input.speed);
    if (distance == null || speed == null || speed <= 0) return null;
    return Math.max(0, distance / speed * 1000);
  }

  estimateTown(input = {}) {
    if (input.townAvailable === false) return null;
    const supplied = finite(input.townEtaMs);
    if (supplied != null && supplied >= 0) return supplied;
    const castMs = finite(input.townCastMs);
    const postTownEtaMs = finite(input.postTownEtaMs);
    if (castMs == null || postTownEtaMs == null) return null;
    return Math.max(0, castMs + postTownEtaMs);
  }

  choose(input = {}) {
    const directEtaMs = this.estimateDirect(input);
    const townEtaMs = this.estimateTown(input);
    const urgency = String(input.urgency || 'NORMAL').toUpperCase();
    const minSavingsMs = urgency === 'CRITICAL' ? Math.max(5000, this.minTownSavingsMs / 2) : this.minTownSavingsMs;
    let route = 'UNKNOWN';
    let reason = 'ROUTE_COST_INCOMPLETE';
    if (directEtaMs != null && townEtaMs == null) { route = 'DIRECT'; reason = 'TOWN_COST_UNKNOWN'; }
    else if (directEtaMs == null && townEtaMs != null) { route = 'TOWN'; reason = 'DIRECT_COST_UNKNOWN'; }
    else if (directEtaMs != null && townEtaMs != null) {
      if (townEtaMs + minSavingsMs < directEtaMs) { route = 'TOWN'; reason = 'TOWN_MATERIALLY_FASTER'; }
      else { route = 'DIRECT'; reason = 'DIRECT_FASTER_OR_HYSTERESIS'; }
    }
    const decision = {
      schemaVersion: 1,
      mode: ROUTE_COST_MODE,
      actionAuthority: false,
      route,
      reason,
      directEtaMs,
      townEtaMs,
      expectedSavingsMs: directEtaMs != null && townEtaMs != null ? directEtaMs - townEtaMs : null,
      minTownSavingsMs: minSavingsMs,
      uncertaintyMs: Math.max(0, finite(input.uncertaintyMs, this.defaultUncertaintyMs))
    };
    this.lastDecision = decision;
    this.stats.decisions += 1;
    if (route === 'DIRECT') this.stats.direct += 1;
    else if (route === 'TOWN') this.stats.town += 1;
    else this.stats.unknown += 1;
    return clone(decision);
  }

  status() {
    return { schemaVersion: 1, mode: ROUTE_COST_MODE, actionAuthority: false, minTownSavingsMs: this.minTownSavingsMs, lastDecision: clone(this.lastDecision), stats: clone(this.stats) };
  }
}

module.exports = { RouteCostEstimator, ROUTE_COST_MODE };
