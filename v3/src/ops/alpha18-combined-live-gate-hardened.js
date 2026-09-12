'use strict';

const {
  Alpha18CombinedLiveGate: BaseAlpha18CombinedLiveGate,
  ALPHA18_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
} = require('./alpha18-combined-live-gate');

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class Alpha18CombinedLiveGate extends BaseAlpha18CombinedLiveGate {
  constructor(options = {}) {
    super(options);
    if (this.observationMs > 0 && this.sampleMs <= 0) this.sampleMs = 1;
  }

  _eventsSince(at) {
    const log = this.runtime && this.runtime.log;
    const rows = log && typeof log.list === 'function' ? log.list(4000) : [];
    return rows.filter((row) => {
      if (!row) return false;
      if (row.at != null && Number.isFinite(Number(row.at))) return Number(row.at) >= at;
      if (row.timestamp != null && Number.isFinite(Number(row.timestamp))) return Number(row.timestamp) >= at;
      if (row.ts != null) {
        const parsed = Date.parse(String(row.ts));
        return Number.isFinite(parsed) && parsed >= at;
      }
      return false;
    });
  }

  _publish(result) {
    if (result && result.planProbe && result.planProbe.plan && result.expansionCanary) {
      const plan = result.planProbe.plan;
      const expansionCoverageSatisfied = plan.action !== 'EXPAND_BANK_PACK'
        || plan.requiresTravel === true
        || result.expansionCanary.state === 'COMMITTED';
      result.expansionCoverageSatisfied = expansionCoverageSatisfied;
      result.confirmationEligible = result.confirmationEligible === true && expansionCoverageSatisfied;
      if (!expansionCoverageSatisfied) {
        result.confirmationBlockers = [...new Set([...(result.confirmationBlockers || []), 'JUSTIFIED_SAME_FLOOR_EXPANSION_NOT_COMMITTED'])];
      } else {
        result.confirmationBlockers = clone(result.confirmationBlockers || []);
      }
    }
    return super._publish(result);
  }
}

module.exports = {
  Alpha18CombinedLiveGate,
  ALPHA18_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};
