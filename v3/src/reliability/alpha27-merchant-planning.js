'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, rawFunction, gradeForLevel } = require('./alpha27-utils');
const { CONTROLLED_ACK, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { MERCHANT_SERVICE_ACK, TERMINAL_TX } = require('./alpha27-merchant-constants');
const { Alpha27MerchantService } = require('./alpha27-merchant-service');

class Alpha27MerchantPlanning extends Alpha27MerchantService {
  constructor(runtime, atomic, shared) {
    super(runtime, atomic, shared);
    this.completedGearGoalClaims = new Map();
    this.gearGoalClaimSuppressions = 0;
    this.lastCompoundIdentity = null;
    this.compoundSelectionCounts = new Map();
  }

  gearDeliveryCandidate() {
    const c = characterOf(this.runtime);
    const gear = this.runtime.gearProgression;
    if (!c || !gear || typeof gear.list !== 'function') return null;
    const trusted = new Set();
    try { for (const name of this.runtime.partyBootstrap && this.runtime.partyBootstrap.trustedRosterNames ? this.runtime.partyBootstrap.trustedRosterNames() || [] : []) trusted.add(String(name)); } catch (_) {}
    const rows = gear.list(256)
      .filter((goal) => goal && goal.sourceCharacter === c.name && goal.character && goal.character !== c.name && !goal.projectedUpgradeRequired && trusted.has(String(goal.character)))
      .sort((a, b) => finite(b.survivalImprovement, 0) - finite(a.survivalImprovement, 0) || finite(b.improvement, 0) - finite(a.improvement, 0));
    for (const goal of rows) {
      const goalId = String(goal.id || '');
      if (goalId && this.completedGearGoalClaims.has(goalId)) {
        this.gearGoalClaimSuppressions += 1;
        continue;
      }
      const item = inventoryOf(this.root).find((row) => row && row.name === goal.item && levelOf(row) === levelOf({ level: goal.observedLevel }) && !row.locked && !row.l && !row.special && !row.p);
      if (item) return { goal, item };
    }
    return null;
  }

  partyReport(name) {
    try {
      const status = this.runtime.partyTelemetry && this.runtime.partyTelemetry.status ? this.runtime.partyTelemetry.status() : null;
      return Array.isArray(status && status.reports) ? status.reports.find((row) => row && String(row.name) === String(name)) || null : null;
    } catch (_) { return null; }
  }

  async deliverGearGoal() {
    const candidate = this.gearDeliveryCandidate();
    if (!candidate) return false;
    if (!await this.ensureStandClosed('GEAR_DELIVERY_PREEMPT')) return true;
    const { goal, item } = candidate;
    const parent = this.root && this.root.parent || this.root;
    const target = Object.values(parent && parent.entities || {}).find((row) => row && !row.mtype && String(row.name || '') === String(goal.character)) || null;
    const c = characterOf(this.runtime);
    const distance = target && c ? Math.hypot(finite(target.real_x != null ? target.real_x : target.x, 0) - finite(c.real_x != null ? c.real_x : c.x, 0), finite(target.real_y != null ? target.real_y : target.y, 0) - finite(c.real_y != null ? c.real_y : c.y, 0)) : Infinity;
    if (!target || (target.map && c.map && String(target.map) !== String(c.map)) || !Number.isFinite(distance) || distance > this.options.gearDeliveryDistance) {
      const report = this.partyReport(goal.character);
      if (!report || !report.map || report.x == null || report.y == null || typeof this.runtime.planTravel !== 'function' || typeof this.runtime.executeTravelPlan !== 'function') return false;
      const planned = this.runtime.planTravel({ destination: { map: report.map, x: report.x, y: report.y }, metadata: { source: 'ALPHA27_GEAR_DELIVERY', goalId: goal.id, targetName: goal.character } });
      if (!planned || planned.accepted !== true || !planned.plan) return false;
      this.atomic.serviceTravelBusy = true;
      try { await this.runtime.executeTravelPlan(planned.plan.id); } finally { this.atomic.serviceTravelBusy = false; }
      return true;
    }
    const service = this.runtime.controlledMerchantService;
    if (!service) return false;
    const report = this.partyReport(goal.character);
    const sourceReportAt = Math.max(0, finite(report && report.at, this.now()));
    const plan = {
      schemaVersion: 1,
      id: `alpha27-gear-${this.now()}-${goal.id}`,
      at: this.now(),
      kind: 'SERVICE_DELIVERY',
      reason: 'GEAR_GOAL_DELIVERY',
      actionAuthority: false,
      liveExecutionAllowed: false,
      sourceReportAt,
      target: { name: goal.character, map: c.map, x: target.x, y: target.y },
      delivery: { itemName: goal.item, quantity: 1 },
      metadata: { alpha27GearGoal: goal.id, itemLevel: levelOf(item) }
    };
    const result = await service.execute(plan);
    if (result && result.committed === true && goal.id != null) {
      this.completedGearGoalClaims.set(String(goal.id), {
        at: this.now(),
        sourceReportAt,
        target: goal.character,
        item: goal.item,
        level: levelOf(item)
      });
    }
    this.lastMerchantAction = { at: this.now(), type: 'GEAR_DELIVERY', goalId: goal.id, result: clone(result) };
    // A rejected service action (for example because the shared raw-action budget
    // is temporarily full) must not consume the entire autonomous merchant turn.
    return !!(result && (result.executed === true || result.committed === true));
  }

  activeTransaction() {
    const engine = this.runtime.transactionEngine;
    const c = characterOf(this.runtime);
    if (!engine || !c) return null;
    return engine.list(200).find((row) => row && row.character === c.name && !TERMINAL_TX.has(row.state)) || null;
  }

  reconcileRecovering() {
    const engine = this.runtime.transactionEngine;
    if (!engine) return false;
    let changed = false;
    for (const row of engine.list(200)) {
      if (!row || row.state !== 'RECOVERING') continue;
      if (Array.isArray(row.reservationKeys) && row.reservationKeys.length > 1 && typeof engine.reconcileAtomic === 'function') engine.reconcileAtomic(row.id);
      else if (typeof this.runtime.reconcileEconomyTransaction === 'function') this.runtime.reconcileEconomyTransaction(row.id);
      changed = true;
    }
    return changed;
  }

  planUpgrade() {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    const gear = this.runtime.gearProgression;
    const gd = gameDataOf(this.runtime);
    if (!c || !ledger || !gear || typeof gear.list !== 'function') return null;
    const goals = gear.list(200).filter((goal) => goal && goal.sourceCharacter === c.name && goal.projectedUpgradeRequired && finite(goal.targetLevel, 0) > finite(goal.observedLevel, 0));
    for (const goal of goals) {
      const entry = ledger.list(1000).find((row) => row && row.character === c.name && row.name === goal.item && levelOf(row) === levelOf({ level: goal.observedLevel }) && EXPECTED_DISPOSITIONS.UPGRADE.has(String(row.disposition || '')));
      if (!entry || this.atomic.mutationRetryBlocked(entry, 'UPGRADE')) continue;
      const meta = gd.items && gd.items[entry.name];
      if (!meta || !meta.upgrade || levelOf(entry) >= this.options.maxUpgradeLevel || gradeForLevel(meta, levelOf(entry)) >= 4) continue;
      const budget = this.atomic.mutationAttemptBudget({ type: 'UPGRADE', character: c.name, item: entry.name, level: levelOf(entry) });
      if (!budget.allowed) continue;
      return { type: 'UPGRADE', character: c.name, index: entry.index, indices: [entry.index], metadata: { source: 'ALPHA27_AUTONOMOUS_PLANNER', goalId: goal.id, targetLevel: goal.targetLevel, targetCharacter: goal.character, lifecycle: 'PARTY_GEAR_GOAL' } };
    }

    // If no party goal claims an upgradeable level-0 item, perform one bounded
    // economy lifecycle upgrade. The result is re-evaluated against the party
    // before it can become an authorized processed-gear SELL candidate.
    const fallback = ledger.list(1000)
      .filter((row) => row && row.character === c.name && row.disposition === 'RESERVE_UPGRADE' && !this.atomic.mutationRetryBlocked(row, 'UPGRADE'))
      .sort((a, b) => levelOf(a) - levelOf(b) || String(a.name || '').localeCompare(String(b.name || '')) || Number(a.index) - Number(b.index))
      .find((entry) => {
        const meta = gd.items && gd.items[entry.name];
        if (!meta || !meta.upgrade || levelOf(entry) !== 0 || this.options.maxUpgradeLevel < 1) return false;
        if (gradeForLevel(meta, levelOf(entry)) >= 4) return false;
        const value = Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0));
        if (value > this.options.upgradeValueCap) return false;
        return this.atomic.mutationAttemptBudget({ type: 'UPGRADE', character: c.name, item: entry.name, level: levelOf(entry) }).allowed;
      });
    if (!fallback) return null;
    return {
      type: 'UPGRADE',
      character: c.name,
      index: fallback.index,
      indices: [fallback.index],
      metadata: {
        source: 'ALPHA27_AUTONOMOUS_PLANNER',
        lifecycle: 'ECONOMIC_PROCESSING',
        economicLifecycle: true,
        targetLevel: 1,
        targetCharacter: null
      }
    };
  }

  planCompound() {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    const gd = gameDataOf(this.runtime);
    if (!c || !ledger) return null;
    const groups = new Map();
    for (const row of ledger.list(1000)) {
      if (!row || row.character !== c.name || row.disposition !== 'RESERVE_COMPOUND' || this.atomic.mutationRetryBlocked(row, 'COMPOUND')) continue;
      const level = levelOf(row);
      const meta = gd.items && gd.items[row.name];
      if (!meta || !meta.compound || level >= this.options.maxCompoundLevel || gradeForLevel(meta, level) >= 4) continue;
      const key = `${row.name}:${level}`;
      const list = groups.get(key) || [];
      list.push(row);
      groups.set(key, list);
    }
    const candidates = [...groups.values()]
      .filter((rows) => rows.length >= 3)
      .map((rows) => {
        const identity = `${rows[0].name}:${levelOf(rows[0])}`;
        const budget = this.atomic.mutationAttemptBudget({ type: 'COMPOUND', character: c.name, item: rows[0].name, level: levelOf(rows[0]) });
        return {
          rows,
          identity,
          completeSets: Math.floor(rows.length / 3),
          mutationBudget: budget,
          previousSelections: this.compoundSelectionCounts.get(identity) || 0,
          repeated: identity === this.lastCompoundIdentity
        };
      })
      .filter((candidate) => candidate.mutationBudget && candidate.mutationBudget.allowed)
      .sort((a, b) => (
        // Drain the largest actionable backlog first, but never repeatedly starve
        // another identity merely because its item name sorts later (ringsj was
        // previously stuck behind hpamulet/hpbelt under the 3/min mutation budget).
        b.completeSets - a.completeSets
        || Number(a.repeated) - Number(b.repeated)
        || a.previousSelections - b.previousSelections
        || levelOf(a.rows[0]) - levelOf(b.rows[0])
        || String(a.rows[0].name).localeCompare(String(b.rows[0].name))
      ));
    const picked = candidates[0] || null;
    if (!picked) return null;
    const group = picked.rows;
    this.lastCompoundIdentity = picked.identity;
    this.compoundSelectionCounts.set(picked.identity, picked.previousSelections + 1);
    return {
      type: 'COMPOUND',
      character: c.name,
      index: group[0].index,
      indices: group.slice(0, 3).map((row) => row.index),
      metadata: {
        source: 'ALPHA27_AUTONOMOUS_PLANNER',
        compoundIdentity: picked.identity,
        completeSetsBefore: picked.completeSets,
        fairSelectionCount: picked.previousSelections + 1
      }
    };
  }

  planSellOrBank() {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    if (!c || !ledger) return null;
    const rows = ledger.list(1000).filter((row) => row && row.character === c.name);
    const gear = this.runtime.gearProgression;
    let gearStatus = null;
    let gearGoals = [];
    try {
      gearStatus = gear && typeof gear.status === 'function' ? gear.status() : null;
      gearGoals = gear && typeof gear.list === 'function' ? gear.list(256) : [];
    } catch (_) {
      gearStatus = null;
      gearGoals = [];
    }

    const sell = rows.find((row) => {
      if (row.disposition !== 'SELL') return false;
      const reasons = Array.isArray(row.reasons) ? row.reasons.map(String) : [];
      if (!reasons.includes('AUTONOMOUS_PROCESSED_GEAR_SELL')) return true;

      // Never race a freshly mutated item against stale GearProgression state.
      // At least one gear evaluation must have observed this ledger generation,
      // and any still-active Farmer goal blocks disposal.
      const observedAt = finite(row.observedAt, 0);
      const evaluatedAt = finite(gearStatus && gearStatus.lastEvaluatedAt, 0);
      if (!gearStatus || evaluatedAt < observedAt) return false;
      const activeFarmerGoal = gearGoals.find((goal) => (
        goal
        && goal.sourceCharacter === c.name
        && goal.character
        && goal.character !== c.name
        && goal.item === row.name
        && levelOf({ level: goal.observedLevel }) === levelOf(row)
        && !(goal.id != null && this.completedGearGoalClaims.has(String(goal.id)))
      ));
      let futureProtection = null;
      let futureSellSafety = null;
      try {
        futureProtection = gear && typeof gear.futureProtectionFor === 'function'
          ? gear.futureProtectionFor(c.name, row.index, row.name, levelOf(row))
          : null;
        futureSellSafety = gear && typeof gear.futureSellSafetyFor === 'function'
          ? gear.futureSellSafetyFor(c.name, row.index, row.name, levelOf(row))
          : null;
      } catch (_) {
        futureProtection = { reason: 'FUTURE_GEAR_PROTECTION_LOOKUP_FAILED' };
        futureSellSafety = null;
      }
      if (!futureSellSafety || futureSellSafety.checked !== true) return false;
      return !activeFarmerGoal && !futureProtection && futureSellSafety.protected !== true;
    });

    if (sell) {
      const reasons = Array.isArray(sell.reasons) ? sell.reasons.map(String) : [];
      const processed = reasons.includes('AUTONOMOUS_PROCESSED_GEAR_SELL');
      return {
        type: 'SELL',
        character: c.name,
        index: sell.index,
        quantity: Math.max(1, finite(sell.q, 1)),
        metadata: {
          source: 'ALPHA27_AUTONOMOUS_PLANNER',
          lifecycleProcessedSale: processed,
          lifecycleReasons: processed ? reasons.filter((reason) => /^AUTONOMOUS_(PROCESSED_GEAR_SELL|COMPOUND_RESULT|UPGRADE_RESULT)$/.test(reason)) : [],
          gearEvaluationAt: processed ? finite(gearStatus && gearStatus.lastEvaluatedAt, null) : null
        }
      };
    }
    const bank = rows.find((row) => row.disposition === 'BANK');
    if (bank) return { type: 'BANK', character: c.name, index: bank.index, quantity: Math.max(1, finite(bank.q, 1)), metadata: { source: 'ALPHA27_AUTONOMOUS_PLANNER' } };
    return null;
  }
}

module.exports = { Alpha27MerchantPlanning };
