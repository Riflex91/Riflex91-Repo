'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicTransactionEngine } = require('./alpha27-atomic-transaction-engine');

class Alpha27AtomicTransactions extends Alpha27AtomicTransactionEngine {
  mutationAttemptBudget(tx) {
    const engine = this.runtime.transactionEngine;
    const now = this.now();
    const max = tx && tx.type === 'COMPOUND' ? this.options.maxCompoundAttemptsPerWindow : this.options.maxUpgradeAttemptsPerWindow;
    const rows = engine && typeof engine.list === 'function' ? engine.list(500) : [];
    const attempts = rows
      .filter((row) => row && row.type === tx.type && row.character === tx.character && row.item === tx.item && levelOf(row) === levelOf(tx) && row.attemptedAt != null && now - finite(row.attemptedAt, 0) <= this.options.mutationAttemptWindowMs)
      .map((row) => finite(row.attemptedAt, 0))
      .filter((at) => at > 0)
      .sort((a, b) => a - b);
    const used = attempts.length;
    const allowed = used < max;
    const retryIndex = Math.max(0, used - max);
    const retryAt = allowed || !attempts.length ? null : attempts[Math.min(retryIndex, attempts.length - 1)] + this.options.mutationAttemptWindowMs + 1;
    return { allowed, used, max, remaining: Math.max(0, max - used), retryAt, windowMs: this.options.mutationAttemptWindowMs };
  }

  plannedScrollDemand(scrollName, tx = null) {
    const ledger = this.runtime.inventoryLedger;
    const c = characterOf(this.runtime);
    const gd = gameDataOf(this.runtime);
    if (!ledger || !c || !scrollName) return { scrollName, quantity: 1, groups: [] };
    const groups = new Map();
    for (const row of ledger.list(2000)) {
      if (!row || row.character !== c.name) continue;
      let type = null;
      if (row.disposition === 'RESERVE_COMPOUND') type = 'COMPOUND';
      else if (row.disposition === 'RESERVE_UPGRADE') type = 'UPGRADE';
      else continue;
      const meta = gd.items && gd.items[row.name];
      if (!meta || (type === 'COMPOUND' ? !meta.compound : !meta.upgrade)) continue;
      const grade = gradeForLevel(meta, levelOf(row));
      // Adventure Land decides the compatible scroll from the item's actual
      // grade thresholds (G.items[name].grades). Target level is a progression
      // goal, not a scroll-class override.
      const wantedScroll = `${type === 'COMPOUND' ? 'cscroll' : 'scroll'}${grade}`;
      if (wantedScroll !== scrollName || grade >= 4) continue;
      const key = `${type}|${row.name}|${levelOf(row)}`;
      const group = groups.get(key) || { type, item: row.name, level: levelOf(row), count: 0, scroll: wantedScroll };
      group.count += 1;
      groups.set(key, group);
    }
    let quantity = 0;
    const details = [];
    for (const group of groups.values()) {
      const operations = group.type === 'COMPOUND' ? Math.floor(group.count / 3) : group.count;
      if (operations <= 0) continue;
      const budget = this.mutationAttemptBudget({ type: group.type, character: c.name, item: group.item, level: group.level });
      // Buying scrolls is a low-risk procurement action. Size the purchase for
      // the visible work backlog, not only the number of mutations allowed in
      // this exact rate-limit window, so one vendor trip can service the next
      // several minutes of compound/upgrade work.
      const planned = operations;
      const immediateActionable = Math.min(operations, Math.max(0, budget.remaining));
      if (planned <= 0) continue;
      quantity += planned;
      details.push({ ...group, operations, planned, immediateActionable, mutationBudget: budget });
    }
    const cap = Math.max(1, Math.min(200, Math.floor(finite(this.options.merchantScrollBatchMax, 80))));
    return { scrollName, quantity: Math.max(1, Math.min(cap, quantity || 1)), cap, groups: details };
  }

  mutationRiskKey(type, item, level, index) {
    return `${String(type || '').toUpperCase()}|${String(item || '')}|${levelOf({ level })}|${Number(index)}`;
  }

  mutationRiskHoldFor(entry, type) {
    if (!entry || !(this.mutationRiskHolds instanceof Map)) return null;
    const now = this.now();
    for (const [key, row] of this.mutationRiskHolds.entries()) {
      if (!row || finite(row.expiresAt, 0) <= now) this.mutationRiskHolds.delete(key);
    }
    const key = this.mutationRiskKey(type, entry.name, levelOf(entry), entry.index);
    const hold = this.mutationRiskHolds.get(key) || null;
    return hold ? clone(hold) : null;
  }

  setMutationRiskHold(tx, decision = {}) {
    if (!tx || !(this.mutationRiskHolds instanceof Map)) return null;
    const input = transactionInputs(tx)[0] || {};
    const now = this.now();
    const hold = {
      at: now,
      expiresAt: now + Math.max(10000, finite(this.options.mutationRiskHoldMs, 60000)),
      type: String(tx.type || '').toUpperCase(),
      item: tx.item,
      level: levelOf(tx),
      index: Number(input.index),
      decision: clone(decision)
    };
    this.mutationRiskHolds.set(this.mutationRiskKey(hold.type, hold.item, hold.level, hold.index), hold);
    return clone(hold);
  }

  clearMutationRiskHold(tx) {
    if (!tx || !(this.mutationRiskHolds instanceof Map)) return false;
    const input = transactionInputs(tx)[0] || {};
    return this.mutationRiskHolds.delete(this.mutationRiskKey(tx.type, tx.item, levelOf(tx), input.index));
  }

  mutationRetryBlocked(entry, type) {
    if (this.mutationRiskHoldFor(entry, type)) return true;
    const engine = this.runtime.transactionEngine;
    if (!entry || !engine || typeof engine.list !== 'function') return false;
    return engine.list(500).some((row) => row && row.type === type && row.character === entry.character && Number(row.index) === Number(entry.index) && row.item === entry.name && levelOf(row) === levelOf(entry) && ['FAILED_SAFE', 'ABORTED'].includes(row.state) && /NO_RETRY|OUTCOME_UNCERTAIN/.test(String(row.reason || '')));
  }

  _ledgerEntry(input) {
    try { return this.runtime.inventoryLedger && this.runtime.inventoryLedger.get(input.character, input.index); } catch (_) { return null; }
  }

  atomicPreflight(tx) {
    const executor = this.runtime.controlledMerchant;
    if (!tx) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    const reservation = this.runtime && this.runtime.merchantSelfGearReservation;
    const selfGear = !!(tx.metadata && tx.metadata.selfGear === true
      && reservation
      && reservation.sessionId === tx.metadata.selfGearSessionId
      && reservation.type === tx.type
      && reservation.character === tx.character
      && reservation.item === tx.item
      && levelOf({ level: reservation.level }) === levelOf(tx)
      && Array.isArray(reservation.indices)
      && reservation.indices.length === transactionInputs(tx).length
      && reservation.indices.every((value) => transactionInputs(tx).some((row) => Number(row.index) === Number(value))));
    if (!executor || !executor.enabled) return { ok: false, reason: 'CONTROLLED_MERCHANT_DISABLED' };
    if (!['UPGRADE', 'COMPOUND'].includes(tx.type)) return { ok: false, reason: 'ATOMIC_FAMILY_NOT_SUPPORTED' };
    if (tx.type === 'UPGRADE' && !executor.upgradeEnabled) return { ok: false, reason: 'UPGRADE_LIVE_DISABLED' };
    if (tx.type === 'COMPOUND' && !executor.compoundEnabled) return { ok: false, reason: 'COMPOUND_LIVE_DISABLED' };
    if (!this.merchantActive()) return { ok: false, reason: 'MERCHANT_ACTIVE_MODE_REQUIRED' };
    if (!this.supervisorAllowed()) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    if (executor.busy || this.merchantBusy) return { ok: false, reason: 'CONTROLLED_MERCHANT_BUSY' };
    if (tx.state !== 'RESERVED') return { ok: false, reason: 'TRANSACTION_NOT_RESERVED' };
    if (tx.leaseExpiresAt != null && this.now() > finite(tx.leaseExpiresAt, 0)) return { ok: false, reason: 'TRANSACTION_LEASE_EXPIRED' };
    if (this.merchantInCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (this.runtime.transactionEngine.breaker(tx.type).open) return { ok: false, reason: 'TRANSACTION_CIRCUIT_OPEN' };
    if (typeof executor._pruneActions === 'function') executor._pruneActions();
    if (Array.isArray(executor.actionTimes) && executor.actionTimes.length >= finite(executor.maxActionsPerWindow, 3)) return { ok: false, reason: 'ACTION_BUDGET_EXHAUSTED' };
    const mutationBudget = this.mutationAttemptBudget(tx);
    if (!mutationBudget.allowed) return { ok: false, reason: 'MUTATION_RISK_BUDGET_EXHAUSTED', mutationBudget };
    const ledgerStatus = this.runtime.inventoryLedger && this.runtime.inventoryLedger.status ? this.runtime.inventoryLedger.status() : null;
    if (!ledgerStatus || ledgerStatus.stale === true) return { ok: false, reason: 'LEDGER_UNAVAILABLE_OR_STALE' };
    const c = characterOf(this.runtime);
    if (!c || String(c.name || '') !== String(tx.character || '')) return { ok: false, reason: 'CONTROLLED_CHARACTER_MISMATCH' };
    const live = inventoryOf(this.root);
    const inputs = transactionInputs(tx);
    if (tx.type === 'UPGRADE' && inputs.length !== 1) return { ok: false, reason: 'UPGRADE_REQUIRES_ONE_INPUT' };
    if (tx.type === 'COMPOUND' && inputs.length !== 3) return { ok: false, reason: 'COMPOUND_REQUIRES_THREE_INPUTS' };
    const seen = new Set();
    for (const input of inputs) {
      if (seen.has(input.index)) return { ok: false, reason: 'ATOMIC_DUPLICATE_INPUT_INDEX' };
      seen.add(input.index);
      const entry = this._ledgerEntry(input);
      if (!entry) return { ok: false, reason: 'LEDGER_ITEM_NOT_FOUND', index: input.index };
      const targetedGearCompound = tx.type === 'COMPOUND' && this.targetedGearCompoundInputAllowed(entry, tx.metadata || {}, input.index);
      if (!selfGear && !EXPECTED_DISPOSITIONS[tx.type].has(String(entry.disposition || '')) && !targetedGearCompound) {
        return { ok: false, reason: 'LEDGER_DISPOSITION_CHANGED', index: input.index, disposition: entry.disposition };
      }
      if (selfGear && (String(entry.name || '') !== String(reservation.item || '') || levelOf(entry) !== levelOf({ level: reservation.level }))) return { ok: false, reason: 'SELF_GEAR_LEDGER_IDENTITY_CHANGED', index: input.index };
      if (String(entry.name || '') !== String(input.item || '') || levelOf(entry) !== levelOf(input)) return { ok: false, reason: 'LEDGER_ITEM_IDENTITY_CHANGED', index: input.index };
      if (this.runtime.contentDrift && typeof this.runtime.contentDrift.requiresRevalidation === 'function' && this.runtime.contentDrift.requiresRevalidation('items', input.item)) return { ok: false, reason: 'ITEM_REQUIRES_REVALIDATION', item: input.item };
      const item = live[input.index];
      if (!item || String(item.name || '') !== String(input.item || '') || levelOf(item) !== levelOf(input)) return { ok: false, reason: 'LIVE_ITEM_IDENTITY_MISMATCH', index: input.index };
      if (item.locked || item.l || item.special || item.p) return { ok: false, reason: 'LIVE_ITEM_PROTECTED', index: input.index };
    }
    const gd = gameDataOf(this.runtime);
    const meta = gd.items && gd.items[tx.item];
    if (!meta) return { ok: false, reason: 'ITEM_METADATA_UNKNOWN' };
    const value = Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0));
    const productionLifecycle = !!(tx.metadata && tx.metadata.productionMaterialAcquisition === true);
    const productionDemand = this.runtime && this.runtime.productionMaterialMutationDemand;
    const productionDemandValid = !!(
      productionLifecycle
      && productionDemand
      && finite(productionDemand.expiresAt, 0) > this.now()
      && String(productionDemand.family || '').toUpperCase() === String(tx.type || '').toUpperCase()
      && String(productionDemand.item || '') === String(tx.item || '')
      && Math.max(0, Math.floor(finite(productionDemand.fromLevel, -1))) === levelOf(tx)
      && Math.max(0, Math.floor(finite(productionDemand.targetLevel, -1))) === levelOf(tx) + 1
      && String(productionDemand.output || '') === String(tx.metadata && tx.metadata.output || '')
      && String(productionDemand.recipient || '') === String(tx.metadata && tx.metadata.recipient || '')
    );
    if (productionLifecycle && !productionDemandValid) return { ok: false, reason: 'PRODUCTION_MUTATION_DEMAND_MISMATCH' };
    if (tx.type === 'UPGRADE') {
      if (!meta.upgrade) return { ok: false, reason: 'ITEM_NOT_UPGRADEABLE' };
      if (levelOf(tx) >= this.options.maxUpgradeLevel) return { ok: false, reason: 'UPGRADE_LEVEL_RISK_CAP' };
      const grade = gradeForLevel(meta, tx.level);
      if (grade >= 4) return { ok: false, reason: 'UPGRADE_ITEM_EXALTED' };
      if (value > this.options.upgradeValueCap) return { ok: false, reason: 'UPGRADE_VALUE_RISK_CAP' };
      const goals = this.runtime.gearProgression && typeof this.runtime.gearProgression.list === 'function' ? this.runtime.gearProgression.list(200) : [];
      const goal = goals.find((row) => row && row.sourceCharacter === tx.character && row.item === tx.item && levelOf({ level: row.observedLevel }) === levelOf(tx) && finite(row.targetLevel, 0) > levelOf(tx));
      const economicLifecycle = !!(tx.metadata && tx.metadata.economicLifecycle === true);
      const requestedTarget = Math.max(0, Math.floor(finite(tx.metadata && tx.metadata.targetLevel, levelOf(tx) + 1)));
      if (!goal && !economicLifecycle && !selfGear && !productionLifecycle) return { ok: false, reason: 'LIVE_GEAR_GOAL_OR_PRODUCTION_DEMAND_REQUIRED' };
      if (goal && tx.metadata && tx.metadata.targetLevel != null && requestedTarget !== Math.floor(finite(goal.targetLevel, requestedTarget))) {
        return { ok: false, reason: 'GEAR_GOAL_TARGET_MISMATCH' };
      }
      if (!goal && productionLifecycle && !selfGear && !economicLifecycle) {
        if (!productionDemandValid || requestedTarget !== levelOf(tx) + 1) return { ok: false, reason: 'PRODUCTION_UPGRADE_SCOPE_INVALID' };
      }
      if (!goal && economicLifecycle && !selfGear) {
        if (levelOf(tx) >= 3 || requestedTarget !== 3) return { ok: false, reason: 'ECONOMIC_UPGRADE_SCOPE_INVALID' };
        const entry = inputs.length ? this._ledgerEntry(inputs[0]) : null;
        const reasons = entry && Array.isArray(entry.reasons) ? entry.reasons.map(String) : [];
        if (!entry || entry.disposition !== 'RESERVE_UPGRADE' || !reasons.includes('AUTONOMOUS_ECONOMIC_UPGRADE_TO_PLUS3')) {
          return { ok: false, reason: 'ECONOMIC_UPGRADE_LEDGER_AUTHORIZATION_REQUIRED' };
        }
      }

      const scroll = `scroll${grade}`;
      const farmerPlus5 = !!(
        goal
        && String(goal.character || '') !== String(tx.character || '')
        && Math.floor(finite(goal.targetLevel, 0)) === 5
      );
      if (farmerPlus5 && levelOf(tx) >= 5) return { ok: false, reason: 'FARMER_UPGRADE_TARGET_REACHED' };
      return {
        ok: true,
        inputs,
        meta,
        goal: goal || null,
        economicLifecycle,
        productionLifecycle,
        selfGear,
        value,
        grade,
        scroll,
        upgradeLifecycle: farmerPlus5 ? 'FARMER_POTENTIAL_TO_PLUS5' : economicLifecycle && !selfGear ? 'ECONOMIC_TO_PLUS3' : 'DEFAULT_GRADE',
        scrollPolicy: 'ITEM_GRADE_DEFAULT'
      };
    }
    if (!meta.compound) return { ok: false, reason: 'ITEM_NOT_COMPOUNDABLE' };
    if (levelOf(tx) >= this.options.maxCompoundLevel) return { ok: false, reason: 'COMPOUND_LEVEL_RISK_CAP' };
    const grade = gradeForLevel(meta, tx.level);
    if (grade >= 4) return { ok: false, reason: 'COMPOUND_ITEM_EXALTED' };
    if (value > this.options.compoundValueCap) return { ok: false, reason: 'COMPOUND_VALUE_RISK_CAP' };
    if (!inputs.every((row) => row.item === inputs[0].item && levelOf(row) === levelOf(inputs[0]))) return { ok: false, reason: 'COMPOUND_INPUT_IDENTITY_MISMATCH' };
    return { ok: true, inputs, meta, productionLifecycle, selfGear, value, grade, scroll: `cscroll${grade}` };
  }
}

module.exports = { Alpha27AtomicTransactions };
