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
    this.lastGearDeliveryFinalization = null;
    this.gearDeliveryFinalizationStats = {
      checks: 0,
      upgradeMutations: 0,
      compoundMutations: 0,
      holds: 0,
      ready: 0,
      lowerTierDeliveriesPrevented: 0
    };
  }

  _liveGearItemForGoal(goal) {
    const inventory = inventoryOf(this.root);
    const matches = inventory.filter((row) => row
      && String(row.name || '') === String(goal && goal.item || '')
      && levelOf(row) === levelOf({ level: goal && goal.observedLevel })
      && !row.locked && !row.l && !row.special && !row.p);
    if (!matches.length) return null;
    const exactIndex = Number(goal && goal.sourceIndex);
    if (Number.isInteger(exactIndex)) {
      const exact = matches.find((row) => Number(row.index) === exactIndex);
      if (exact) return exact;
    }
    return matches.sort((a, b) => Number(a.index) - Number(b.index))[0] || null;
  }

  _gearFinalizationRecord(state, reason, candidate, extra = {}) {
    const row = {
      at: this.now(),
      state,
      reason,
      targetName: candidate && candidate.goal && candidate.goal.character || null,
      slot: candidate && candidate.goal && candidate.goal.slot || null,
      item: candidate && candidate.item && candidate.item.name || candidate && candidate.goal && candidate.goal.item || null,
      level: candidate && candidate.item ? levelOf(candidate.item) : null,
      sourceIndex: candidate && candidate.item && Number.isInteger(Number(candidate.item.index)) ? Number(candidate.item.index) : null,
      ...clone(extra)
    };
    this.lastGearDeliveryFinalization = row;
    return row;
  }

  _compoundFeederEligible(entry, candidate) {
    if (!entry || !candidate || !candidate.item) return false;
    if (String(entry.name || '') !== String(candidate.item.name || '')) return false;
    if (Number(entry.index) === Number(candidate.item.index)) return true;
    const disposition = String(entry.disposition || '');
    if (disposition === 'RESERVE_PROGRESSION') return false;
    if (disposition === 'RESERVE_COMPOUND') return true;
    const reasons = Array.isArray(entry.reasons) ? entry.reasons.map(String) : [];
    if (disposition === 'KEEP') {
      return reasons.includes('AUTONOMOUS_COMPOUND_ACCUMULATION')
        && !reasons.includes('FUTURE_FARMER_GEAR_PROGRESSION');
    }
    if (disposition === 'SELL') {
      return reasons.includes('AUTONOMOUS_COMPOUND_RESULT')
        && reasons.includes('FUTURE_FARMER_GEAR_EVALUATED_SAFE');
    }
    return false;
  }

  _compoundReachability(candidate, meta) {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    const counts = new Map();
    const eligibleIndexes = new Set();
    if (!c || !ledger || !candidate || !candidate.item) return { reachableLevel: -1, initialCounts: counts, projectedCounts: counts, eligibleIndexes };

    for (const row of inventoryOf(this.root)) {
      if (!row || String(row.name || '') !== String(candidate.item.name || '') || row.locked || row.l || row.special || row.p) continue;
      let entry = null;
      try { entry = ledger.get(c.name, row.index); } catch (_) { entry = null; }
      if (!this._compoundFeederEligible(entry, candidate)) continue;
      const level = levelOf(row);
      counts.set(level, (counts.get(level) || 0) + 1);
      eligibleIndexes.add(Number(row.index));
    }
    const initialCounts = new Map(counts);
    let reachableLevel = -1;
    for (let level = 0; level < this.options.maxCompoundLevel; level += 1) {
      const count = counts.get(level) || 0;
      if (count < 3 || gradeForLevel(meta, level) >= 4) continue;
      const produced = Math.floor(count / 3);
      counts.set(level, count % 3);
      counts.set(level + 1, (counts.get(level + 1) || 0) + produced);
      if (produced > 0) reachableLevel = Math.max(reachableLevel, level + 1);
    }
    // Only levels that can be created from the target item plus unallocated
    // feeders count as reachable. Items reserved for other Farmer goals are
    // excluded even when they have the same name and level.
    return { reachableLevel, initialCounts, projectedCounts: counts, eligibleIndexes };
  }

  _targetedCompoundRequest(candidate, meta, reachable) {
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger;
    if (!c || !ledger || !candidate || !candidate.item) return null;
    const currentLevel = levelOf(candidate.item);
    const rows = ledger.list(1000)
      .filter((row) => row
        && row.character === c.name
        && String(row.name || '') === String(candidate.item.name || '')
        && reachable.eligibleIndexes.has(Number(row.index))
        && levelOf(row) < reachable.reachableLevel
        && !this.atomic.mutationRetryBlocked(row, 'COMPOUND'));
    const candidateEntry = rows.find((row) => Number(row.index) === Number(candidate.item.index)) || null;

    const makeRequest = (group, level, feederPreparation = false) => {
      const budget = this.atomic.mutationAttemptBudget({ type: 'COMPOUND', character: c.name, item: candidate.item.name, level });
      if (!budget.allowed) {
        return {
          hold: true,
          reason: 'GEAR_FINALIZATION_COMPOUND_BUDGET_WAIT',
          retryAt: budget.retryAt,
          mutationBudget: budget,
          targetLevel: reachable.reachableLevel
        };
      }
      return {
        request: {
          type: 'COMPOUND',
          character: c.name,
          index: group[0].index,
          indices: group.slice(0, 3).map((row) => row.index),
          metadata: {
            source: 'ALPHA27_GEAR_DELIVERY_FINALIZATION',
            lifecycle: 'FARMER_GEAR_DELIVERY_FINALIZATION',
            goalId: candidate.goal && candidate.goal.id || null,
            targetCharacter: candidate.goal.character,
            targetSlot: candidate.goal.slot,
            deliveryItem: candidate.item.name,
            deliveryObservedLevel: currentLevel,
            deliveryTargetLevel: reachable.reachableLevel,
            compoundIdentity: `${candidate.item.name}:${level}`,
            targetedGearFinalization: true,
            progressionInputIndex: feederPreparation ? null : Number(candidate.item.index),
            feederPreparation
          }
        },
        targetLevel: reachable.reachableLevel
      };
    };

    // Prefer advancing the exact delivery item whenever two safe same-level
    // feeders already exist. This preserves identity continuity for the goal.
    if (candidateEntry && levelOf(candidateEntry) === currentLevel && currentLevel < reachable.reachableLevel) {
      const sameLevelFeeders = rows
        .filter((row) => Number(row.index) !== Number(candidate.item.index)
          && levelOf(row) === currentLevel
          && String(row.disposition || '') !== 'RESERVE_PROGRESSION')
        .sort((a, b) => Number(a.index) - Number(b.index));
      if (sameLevelFeeders.length >= 2) return makeRequest([candidateEntry, ...sameLevelFeeders.slice(0, 2)], currentLevel, false);
    }

    // Otherwise manufacture the highest useful unallocated feeder first.
    const byLevel = new Map();
    for (const row of rows) {
      if (Number(row.index) === Number(candidate.item.index) || String(row.disposition || '') === 'RESERVE_PROGRESSION') continue;
      const level = levelOf(row);
      const list = byLevel.get(level) || [];
      list.push(row);
      byLevel.set(level, list);
    }
    const levels = [...byLevel.keys()].sort((a, b) => b - a);
    for (const level of levels) {
      const group = byLevel.get(level).sort((a, b) => Number(a.index) - Number(b.index));
      if (group.length >= 3) return makeRequest(group.slice(0, 3), level, true);
    }

    return {
      hold: true,
      reason: 'GEAR_FINALIZATION_COMPOUND_LEDGER_PENDING',
      targetLevel: reachable.reachableLevel
    };
  }

  _targetedUpgradeRequest(candidate, meta) {
    const c = characterOf(this.runtime);
    const gear = this.runtime.gearProgression;
    const ledger = this.runtime.inventoryLedger;
    if (!c || !gear || !ledger || !candidate || !candidate.item) return null;
    const item = candidate.item;
    const level = levelOf(item);
    let protection = null;
    try {
      protection = typeof gear.futureProtectionFor === 'function'
        ? gear.futureProtectionFor(c.name, item.index, item.name, level)
        : null;
    } catch (_) { protection = null; }
    const targetLevel = Math.max(level, Math.floor(finite(protection && protection.targetLevel, level)));
    if (!protection || targetLevel <= level) return null;

    // Structural safety caps mean the current level is the highest level this
    // runtime is allowed to deliver; do not create a permanent progression stall.
    const value = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    if (level >= this.options.maxUpgradeLevel || gradeForLevel(meta, level) >= 4 || value > this.options.upgradeValueCap) {
      return { blocked: true, reason: 'GEAR_FINALIZATION_UPGRADE_RISK_CAP', targetLevel };
    }

    const entry = typeof ledger.get === 'function' ? ledger.get(c.name, item.index) : null;
    if (!entry
      || String(entry.name || '') !== String(item.name || '')
      || levelOf(entry) !== level
      || !EXPECTED_DISPOSITIONS.UPGRADE.has(String(entry.disposition || ''))) {
      return { hold: true, reason: 'GEAR_FINALIZATION_UPGRADE_LEDGER_PENDING', targetLevel };
    }
    if (this.atomic.mutationRetryBlocked(entry, 'UPGRADE')) {
      return { blocked: true, reason: 'GEAR_FINALIZATION_UPGRADE_RETRY_BLOCKED', targetLevel };
    }
    const budget = this.atomic.mutationAttemptBudget({ type: 'UPGRADE', character: c.name, item: item.name, level });
    if (!budget.allowed) {
      return { hold: true, reason: 'GEAR_FINALIZATION_UPGRADE_BUDGET_WAIT', retryAt: budget.retryAt, mutationBudget: budget, targetLevel };
    }

    let projectedGoal = null;
    try {
      projectedGoal = gear.list(256).find((goal) => goal
        && goal.sourceCharacter === c.name
        && Number(goal.sourceIndex) === Number(item.index)
        && String(goal.item || '') === String(item.name || '')
        && levelOf({ level: goal.observedLevel }) === level
        && goal.projectedUpgradeRequired === true
        && finite(goal.targetLevel, 0) > level) || null;
    } catch (_) { projectedGoal = null; }
    if (!projectedGoal) return { hold: true, reason: 'GEAR_FINALIZATION_PROJECTED_GOAL_PENDING', targetLevel };

    const farmerPlus5 = String(projectedGoal.character || '') !== String(c.name || '') && targetLevel === 5;
    return {
      request: {
        type: 'UPGRADE',
        character: c.name,
        index: entry.index,
        indices: [entry.index],
        metadata: {
          source: 'ALPHA27_GEAR_DELIVERY_FINALIZATION',
          goalId: projectedGoal.id,
          targetLevel,
          targetCharacter: projectedGoal.character,
          targetSlot: projectedGoal.slot,
          lifecycle: 'FARMER_GEAR_DELIVERY_FINALIZATION',
          upgradeLifecycle: farmerPlus5 ? 'FARMER_POTENTIAL_TO_PLUS5' : 'PARTY_GEAR_GOAL',
          scrollPolicy: farmerPlus5 ? 'LEVEL_0_3_SCROLL0_LEVEL_3_5_SCROLL1' : 'ITEM_GRADE_DEFAULT',
          targetedGearFinalization: true
        }
      },
      targetLevel
    };
  }

  planGearDeliveryFinalization(candidate = null) {
    const selected = candidate || this.gearDeliveryCandidate();
    if (!selected || !selected.goal || !selected.item) return { state: 'NONE', reason: 'NO_READY_GEAR_DELIVERY', candidate: null };
    this.gearDeliveryFinalizationStats.checks += 1;
    const gd = gameDataOf(this.runtime);
    const meta = gd.items && gd.items[selected.item.name];
    if (!meta || typeof meta !== 'object') {
      this.gearDeliveryFinalizationStats.holds += 1;
      return { state: 'HOLD', reason: 'GEAR_FINALIZATION_METADATA_UNKNOWN', candidate: selected };
    }

    if (meta.upgrade) {
      const upgrade = this._targetedUpgradeRequest(selected, meta);
      if (upgrade && upgrade.request) {
        this.gearDeliveryFinalizationStats.upgradeMutations += 1;
        this.gearDeliveryFinalizationStats.lowerTierDeliveriesPrevented += 1;
        this._gearFinalizationRecord('MUTATE', 'TARGETED_UPGRADE_BEFORE_DELIVERY', selected, { targetLevel: upgrade.targetLevel, type: 'UPGRADE' });
        return { state: 'MUTATE', reason: 'TARGETED_UPGRADE_BEFORE_DELIVERY', candidate: selected, request: upgrade.request, targetLevel: upgrade.targetLevel };
      }
      if (upgrade && upgrade.hold) {
        this.gearDeliveryFinalizationStats.holds += 1;
        this.gearDeliveryFinalizationStats.lowerTierDeliveriesPrevented += 1;
        this._gearFinalizationRecord('HOLD', upgrade.reason, selected, upgrade);
        return { state: 'HOLD', candidate: selected, ...upgrade };
      }
      if (upgrade && upgrade.blocked) {
        this._gearFinalizationRecord('READY', upgrade.reason, selected, { targetLevel: levelOf(selected.item), structuralBlock: true });
      }
    }

    if (meta.compound) {
      const value = Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0));
      if (value <= this.options.compoundValueCap) {
        const reachable = this._compoundReachability(selected, meta);
        if (reachable.reachableLevel > levelOf(selected.item)) {
          const compound = this._targetedCompoundRequest(selected, meta, reachable);
          if (compound && compound.request) {
            this.gearDeliveryFinalizationStats.compoundMutations += 1;
            this.gearDeliveryFinalizationStats.lowerTierDeliveriesPrevented += 1;
            this._gearFinalizationRecord('MUTATE', 'TARGETED_COMPOUND_BEFORE_DELIVERY', selected, { targetLevel: compound.targetLevel, type: 'COMPOUND' });
            return { state: 'MUTATE', reason: 'TARGETED_COMPOUND_BEFORE_DELIVERY', candidate: selected, request: compound.request, targetLevel: compound.targetLevel };
          }
          this.gearDeliveryFinalizationStats.holds += 1;
          this.gearDeliveryFinalizationStats.lowerTierDeliveriesPrevented += 1;
          this._gearFinalizationRecord('HOLD', compound && compound.reason || 'GEAR_FINALIZATION_COMPOUND_PENDING', selected, compound || { targetLevel: reachable.reachableLevel });
          return { state: 'HOLD', candidate: selected, ...(compound || { reason: 'GEAR_FINALIZATION_COMPOUND_PENDING', targetLevel: reachable.reachableLevel }) };
        }
      }
    }

    this.gearDeliveryFinalizationStats.ready += 1;
    this._gearFinalizationRecord('READY', 'HIGHEST_CURRENT_SAFE_LEVEL_REACHED', selected, { targetLevel: levelOf(selected.item) });
    return { state: 'READY', reason: 'HIGHEST_CURRENT_SAFE_LEVEL_REACHED', candidate: selected, targetLevel: levelOf(selected.item) };
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
      const item = this._liveGearItemForGoal(goal);
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
      const farmerPlus5 = String(goal.character || '') !== String(c.name || '') && Math.floor(finite(goal.targetLevel, 0)) === 5;
      return {
        type: 'UPGRADE',
        character: c.name,
        index: entry.index,
        indices: [entry.index],
        metadata: {
          source: 'ALPHA27_AUTONOMOUS_PLANNER',
          goalId: goal.id,
          targetLevel: goal.targetLevel,
          targetCharacter: goal.character,
          lifecycle: 'PARTY_GEAR_GOAL',
          upgradeLifecycle: farmerPlus5 ? 'FARMER_POTENTIAL_TO_PLUS5' : 'PARTY_GEAR_GOAL',
          scrollPolicy: farmerPlus5 ? 'LEVEL_0_3_SCROLL0_LEVEL_3_5_SCROLL1' : 'ITEM_GRADE_DEFAULT'
        }
      };
    }

    // No Farmer value by +5: keep processing the exact observed item through
    // +3 with scroll0 only. GearProgression is re-run after every level change;
    // if the item becomes useful, the Farmer +5 goal above takes ownership.
    const fallback = ledger.list(1000)
      .filter((row) => row && row.character === c.name && row.disposition === 'RESERVE_UPGRADE' && !this.atomic.mutationRetryBlocked(row, 'UPGRADE'))
      .sort((a, b) => levelOf(a) - levelOf(b) || String(a.name || '').localeCompare(String(b.name || '')) || Number(a.index) - Number(b.index))
      .find((entry) => {
        const meta = gd.items && gd.items[entry.name];
        const reasons = Array.isArray(entry.reasons) ? entry.reasons.map(String) : [];
        const level = levelOf(entry);
        if (!meta || !meta.upgrade || level >= 3 || this.options.maxUpgradeLevel < 1) return false;
        if (!reasons.includes('AUTONOMOUS_ECONOMIC_UPGRADE_TO_PLUS3')) return false;
        if (gradeForLevel(meta, level) >= 4) return false;
        const value = Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0));
        if (value > this.options.upgradeValueCap) return false;
        return this.atomic.mutationAttemptBudget({ type: 'UPGRADE', character: c.name, item: entry.name, level }).allowed;
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
        targetLevel: 3,
        targetCharacter: null,
        upgradeLifecycle: 'ECONOMIC_TO_PLUS3',
        scrollPolicy: 'SCROLL0_ONLY'
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
