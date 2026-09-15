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
      return { type: 'UPGRADE', character: c.name, index: entry.index, indices: [entry.index], metadata: { source: 'ALPHA27_AUTONOMOUS_PLANNER', goalId: goal.id, targetLevel: goal.targetLevel, targetCharacter: goal.character } };
    }
    return null;
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
    const group = [...groups.values()].filter((rows) => rows.length >= 3).sort((a, b) => levelOf(a[0]) - levelOf(b[0]) || String(a[0].name).localeCompare(String(b[0].name)))[0];
    if (!group) return null;
    return { type: 'COMPOUND', character: c.name, index: group[0].index, indices: group.slice(0, 3).map((row) => row.index), metadata: { source: 'ALPHA27_AUTONOMOUS_PLANNER' } };
  }

  planSellOrBank() {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    if (!c || !ledger) return null;
    const rows = ledger.list(1000).filter((row) => row && row.character === c.name);
    const sell = rows.find((row) => row.disposition === 'SELL');
    if (sell) return { type: 'SELL', character: c.name, index: sell.index, quantity: Math.max(1, finite(sell.q, 1)), metadata: { source: 'ALPHA27_AUTONOMOUS_PLANNER' } };
    const bank = rows.find((row) => row.disposition === 'BANK');
    if (bank) return { type: 'BANK', character: c.name, index: bank.index, quantity: Math.max(1, finite(bank.q, 1)), metadata: { source: 'ALPHA27_AUTONOMOUS_PLANNER' } };
    return null;
  }
}

module.exports = { Alpha27MerchantPlanning };
