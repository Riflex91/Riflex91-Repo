'use strict';

function clone(value) { try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }

class Alpha28BrainCloud {
  constructor(runtime, shared) {
    this.runtime = runtime;
    this.now = shared.now;
    this.log = shared.log;
    this.stats = shared.stats;
    this.configured = false;
    this.plannerPatched = false;
    this.lastDecision = null;
    this.lastBrainAt = -Infinity;
  }
  event(event, severity = 'info', reason = null, data = {}) { try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'alpha28-brain-cloud', event, severity, reason, data }); } catch (_) {} }

  ensureSettings() {
    const alpha25 = this.runtime.alpha25ControlCenterBrain;
    const cp = this.runtime.controlPlane;
    if (!alpha25 || !cp || typeof alpha25.patchSettings !== 'function') return false;
    const needs = {};
    if (cp.get('brain.mode', 'shadow') !== 'canary') needs['brain.mode'] = 'canary';
    if (cp.get('cloud.enabled', false) !== true) needs['cloud.enabled'] = true;
    if (Object.keys(needs).length) {
      const result = alpha25.patchSettings(needs, 'alpha28-explicit-live-authority');
      this.stats.brainCloudSettingPatches += Object.keys(needs).length;
      this.event('ALPHA28_BRAIN_CLOUD_ENABLED', 'info', 'OPERATOR_REQUESTED_ON', { requested: needs, result: clone(result) });
    }
    this.configured = cp.get('brain.mode') === 'canary' && cp.get('cloud.enabled') === true;
    this.patchPlanner();
    return this.configured;
  }

  patchPlanner() {
    const planner = this.runtime.planner;
    const brain = this.runtime.strategicBrainV2;
    const cp = this.runtime.controlPlane;
    if (!planner || !brain || !cp || this.plannerPatched || planner.__alpha28BrainCanaryRanking) return false;
    if (typeof planner.rank !== 'function' || typeof brain.observe !== 'function') return false;
    const base = planner.rank.bind(planner);
    planner.rank = (candidates, context = {}) => {
      const safeRows = base(candidates, context) || [];
      if (cp.get('brain.mode', 'shadow') !== 'canary' || !safeRows.length) return safeRows;
      let observation = null;
      const auditMs = Math.max(1000, Number(cp.get('runtime.brainAuditMs', 5000)) || 5000);
      if (this.now() - this.lastBrainAt >= auditMs) {
        try {
          observation = brain.observe({ ...context, candidates: safeRows, teacherRanking: safeRows, currentPlan: this.runtime.localFarming && this.runtime.localFarming.currentPlan || null, snapshot: this.runtime.lastSnapshot });
          this.lastBrainAt = this.now();
        } catch (_) { return safeRows; }
      } else observation = brain.lastObservation || null;
      const quality = observation && observation.quality && observation.quality.state;
      if (!observation || ['quarantine','degraded'].includes(String(quality || ''))) return safeRows;
      const action = observation.student && observation.student.action;
      const wanted = observation.teacher && String(observation.teacher.target || '').trim();
      if (!['change_farm_target','explore'].includes(action) || !wanted) return safeRows;
      const index = safeRows.findIndex((row) => String(row && (row.monster || row.id) || '') === wanted);
      if (index <= 0) return safeRows;
      const reordered = safeRows.slice();
      const [selected] = reordered.splice(index, 1); reordered.unshift(selected);
      this.stats.brainCanaryPlannerDecisions += 1;
      this.lastDecision = { at: this.now(), action, target: wanted, confidence: observation.student.confidence, authority: 'SAFE_CANDIDATE_REORDER_ONLY' };
      this.event('ALPHA28_BRAIN_CANARY_APPLIED', 'info', 'SAFE_CANDIDATE_REORDER_ONLY', clone(this.lastDecision));
      return reordered;
    };
    planner.__alpha28BrainCanaryRanking = true;
    this.plannerPatched = true;
    return true;
  }

  tick() { this.ensureSettings(); return false; }
  status() {
    const cp = this.runtime.controlPlane;
    const cloud = this.runtime.cloudControlPlane && this.runtime.cloudControlPlane.status ? this.runtime.cloudControlPlane.status() : null;
    return {
      brainCanaryEnabled: !!(cp && cp.get('brain.mode') === 'canary'),
      brainAuthority: 'SAFE_CANDIDATE_REORDER_ONLY',
      brainDirectExecutorAccess: false,
      cloudEnabled: !!(cp && cp.get('cloud.enabled') === true),
      cloudReady: !!(cloud && cloud.ready),
      cloudOfflineSafe: true,
      plannerPatched: this.plannerPatched,
      lastDecision: clone(this.lastDecision)
    };
  }
}

module.exports = { Alpha28BrainCloud };
