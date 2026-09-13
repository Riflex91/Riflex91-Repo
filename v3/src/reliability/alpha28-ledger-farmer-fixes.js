'use strict';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function distance(a, b) {
  const ax = finite(a && (a.real_x != null ? a.real_x : a.x), NaN), ay = finite(a && (a.real_y != null ? a.real_y : a.y), NaN);
  const bx = finite(b && (b.real_x != null ? b.real_x : b.x), NaN), by = finite(b && (b.real_y != null ? b.real_y : b.y), NaN);
  return [ax, ay, bx, by].every(Number.isFinite) ? Math.hypot(ax - bx, ay - by) : Infinity;
}

class Alpha28LedgerFarmerFixes {
  constructor(runtime, shared) {
    this.runtime = runtime;
    this.now = shared.now;
    this.log = shared.log;
    this.stats = shared.stats;
    this.patchLedger();
    this.patchCohesionSemantics();
    this.patchAreaPressure();
    this.patchFarmerTargetLiveness();
  }

  event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'alpha28-liveness', event, severity, reason, data }); } catch (_) {}
  }

  patchLedger() {
    const ledger = this.runtime.inventoryLedger;
    if (!ledger || ledger.__alpha28LedgerSignatureVerified) return false;
    if (!ledger.__alpha27AutonomousPlannerPatched || typeof ledger._baseDisposition !== 'function') return false;
    // Alpha27 now preserves InventoryLedger's native four-argument contract:
    // (row, gameData, contentDrift, counts). Alpha28 only records that the
    // repaired central planner is active; it must not replace/reclassify it.
    ledger.__alpha28LedgerSignatureVerified = true;
    this.stats.ledgerSignatureFixes += 1;
    this.event('ALPHA28_LEDGER_SIGNATURE_VERIFIED', 'info', 'ALPHA27_FOUR_ARGUMENT_CONTRACT_ACTIVE');
    return true;
  }

  patchCohesionSemantics() {
    const team = this.runtime.teamCombatCohesionHotfix;
    if (!team || team.__alpha28SemanticRegroupPreserved || typeof team._team !== 'function') return false;
    const base = team._team.bind(team);
    team._team = (snapshot) => {
      const state = base(snapshot);
      if (!state) return state;
      const semanticRegroup = state.regroupRequired === true || (Array.isArray(state.stuckMembers) && state.stuckMembers.length > 0);
      if (semanticRegroup && state.cohesive === true) {
        state.cohesive = false;
        this.stats.semanticRegroupPreserved += 1;
      }
      return state;
    };
    team.__alpha28SemanticRegroupPreserved = true;
    return true;
  }

  patchAreaPressure() {
    const pressure = this.runtime.farmAreaPressureHotfix;
    if (!pressure || pressure.__alpha28CombatAcquisitionPressureFix || typeof pressure._evaluate !== 'function') return false;
    const base = pressure._evaluate.bind(pressure);
    pressure._evaluate = (...args) => {
      const result = base(...args);
      if (!result || result.pressured !== true || String(result.classification || '') !== 'AREA_OVERPOPULATED') return result;
      const uptime = finite(result.monsterUptimeRatio, finite(result.availabilityRatio, 0));
      const contested = finite(result.contestedLossRatio, 0);
      if (uptime >= 0.70 && contested < 0.20) {
        this.stats.falseAreaPressureSuppressed += 1;
        return { ...result, pressured: false, classification: 'AREA_HEALTHY', alpha28Classification: 'COMBAT_ACQUISITION_STALLED', alpha28SuppressedOverpopulation: true };
      }
      return result;
    };
    pressure.__alpha28CombatAcquisitionPressureFix = true;
    return true;
  }

  patchFarmerTargetLiveness() {
    const farmer = this.runtime.farmer;
    if (!farmer || farmer.__alpha28PlannedTargetFallback || typeof farmer._selectTarget !== 'function') return false;
    const base = farmer._selectTarget.bind(farmer);
    farmer._selectTarget = (context) => {
      const selected = base(context);
      if (selected) return selected;
      const snapshot = context && context.snapshot;
      const teamModule = this.runtime.teamCombatCohesionHotfix;
      const local = this.runtime.localFarming;
      const plan = local && local.currentPlan;
      if (!snapshot || !snapshot.character || !plan || !plan.monster) return null;
      let team = null;
      try { team = teamModule && typeof teamModule._team === 'function' ? teamModule._team(snapshot) : null; } catch (_) {}
      if (!team || team.selfName !== team.leaderName || !team.complete || !team.alive || !team.sameMap || !team.positionsKnown || !team.cohesive) return null;
      const reliability = this.runtime.preFarmingReliability;
      const safeIds = reliability && reliability.safeEntityIds;
      if (!(safeIds instanceof Set)) return null;
      if (reliability.safeEntitySnapshotAt != null && snapshot.observedAt != null && Number(reliability.safeEntitySnapshotAt) !== Number(snapshot.observedAt)) return null;
      const candidates = (snapshot.entities || []).filter((entity) => {
        if (!entity || entity.id == null || !entity.mtype || entity.dead || entity.rip || (entity.hp != null && Number(entity.hp) <= 0)) return false;
        if (String(entity.mtype) !== String(plan.monster)) return false;
        if (!safeIds.has(String(entity.id))) return false;
        if (entity.map && snapshot.character.map && String(entity.map) !== String(snapshot.character.map)) return false;
        return typeof farmer._targetAllowed !== 'function' || farmer._targetAllowed(entity, snapshot, context.party);
      }).sort((a, b) => distance(snapshot.character, a) - distance(snapshot.character, b));
      const target = candidates[0];
      if (!target) return null;
      this.stats.plannedTargetFallbackSelections += 1;
      this.event('ALPHA28_PLANNED_TARGET_FALLBACK_SELECTED', 'info', 'SAFE_PLANNED_MONSTER_VISIBLE', { targetId: String(target.id), monster: target.mtype, planId: plan.id || null });
      return { target, ranking: { id: target.mtype, monster: target.mtype, source: 'alpha28-safe-planned-fallback' } };
    };
    farmer.__alpha28PlannedTargetFallback = true;
    return true;
  }

  ensurePatches() {
    this.patchLedger();
    this.patchCohesionSemantics();
    this.patchAreaPressure();
    this.patchFarmerTargetLiveness();
  }

  status() {
    return {
      ledgerSignatureFixed: !!(this.runtime.inventoryLedger && this.runtime.inventoryLedger.__alpha28LedgerSignatureVerified),
      semanticRegroupPreserved: !!(this.runtime.teamCombatCohesionHotfix && this.runtime.teamCombatCohesionHotfix.__alpha28SemanticRegroupPreserved),
      areaPressureCombatStallFix: !!(this.runtime.farmAreaPressureHotfix && this.runtime.farmAreaPressureHotfix.__alpha28CombatAcquisitionPressureFix),
      plannedTargetFallback: !!(this.runtime.farmer && this.runtime.farmer.__alpha28PlannedTargetFallback)
    };
  }
}

module.exports = { Alpha28LedgerFarmerFixes };
