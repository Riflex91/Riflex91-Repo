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
    const used = rows.filter((row) => row && row.type === tx.type && row.character === tx.character && row.item === tx.item && levelOf(row) === levelOf(tx) && row.attemptedAt != null && now - finite(row.attemptedAt, 0) <= this.options.mutationAttemptWindowMs).length;
    return { allowed: used < max, used, max, windowMs: this.options.mutationAttemptWindowMs };
  }

  mutationRetryBlocked(entry, type) {
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
      if (!EXPECTED_DISPOSITIONS[tx.type].has(String(entry.disposition || ''))) return { ok: false, reason: 'LEDGER_DISPOSITION_CHANGED', index: input.index, disposition: entry.disposition };
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
    if (tx.type === 'UPGRADE') {
      if (!meta.upgrade) return { ok: false, reason: 'ITEM_NOT_UPGRADEABLE' };
      if (levelOf(tx) >= this.options.maxUpgradeLevel) return { ok: false, reason: 'UPGRADE_LEVEL_RISK_CAP' };
      const grade = gradeForLevel(meta, tx.level);
      if (grade >= 4) return { ok: false, reason: 'UPGRADE_ITEM_EXALTED' };
      if (value > this.options.upgradeValueCap) return { ok: false, reason: 'UPGRADE_VALUE_RISK_CAP' };
      const goals = this.runtime.gearProgression && typeof this.runtime.gearProgression.list === 'function' ? this.runtime.gearProgression.list(200) : [];
      const goal = goals.find((row) => row && row.sourceCharacter === tx.character && row.item === tx.item && levelOf({ level: row.observedLevel }) === levelOf(tx) && finite(row.targetLevel, 0) > levelOf(tx));
      if (!goal) return { ok: false, reason: 'LIVE_GEAR_GOAL_REQUIRED' };
      return { ok: true, inputs, meta, goal, value, grade, scroll: `scroll${grade}` };
    }
    if (!meta.compound) return { ok: false, reason: 'ITEM_NOT_COMPOUNDABLE' };
    if (levelOf(tx) >= this.options.maxCompoundLevel) return { ok: false, reason: 'COMPOUND_LEVEL_RISK_CAP' };
    const grade = gradeForLevel(meta, tx.level);
    if (grade >= 4) return { ok: false, reason: 'COMPOUND_ITEM_EXALTED' };
    if (value > this.options.compoundValueCap) return { ok: false, reason: 'COMPOUND_VALUE_RISK_CAP' };
    if (!inputs.every((row) => row.item === inputs[0].item && levelOf(row) === levelOf(inputs[0]))) return { ok: false, reason: 'COMPOUND_INPUT_IDENTITY_MISMATCH' };
    return { ok: true, inputs, meta, value, grade, scroll: `cscroll${grade}` };
  }
}

module.exports = { Alpha27AtomicTransactions };
