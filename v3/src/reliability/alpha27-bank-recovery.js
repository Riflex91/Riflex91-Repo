'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, gradeForLevel } = require('./alpha27-utils');
const { bankRows, ProductionStepKind } = require('../merchant/merchant-production-planner');
const {
  ControlledMerchantProductionExecutor,
  CONTROLLED_MERCHANT_PRODUCTION_ACK
} = require('../merchant/controlled-merchant-production-executor');

const ALPHA27_BANK_RECOVERY_MODE = 'alpha27-progression-bank-recovery-v1';

function itemKey(name, level) {
  return `${String(name || '')}:${Math.max(0, Math.floor(finite(level, 0)))}`;
}

function quantity(items, name, level) {
  let total = 0;
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || String(item.name || '') !== String(name || '') || levelOf(item) !== levelOf({ level })) continue;
    total += Math.max(1, Math.floor(finite(item.q, 1)));
  }
  return total;
}

function hardProtected(meta) {
  if (!meta || typeof meta !== 'object') return true;
  return [
    'quest', 'exchange', 'event', 'cash', 'soulbound', 'offering',
    'throw', 'ignore'
  ].some((key) => meta[key] === true || (meta[key] != null && meta[key] !== false && meta[key] !== 0 && meta[key] !== ''));
}

class Alpha27BankRecovery {
  constructor(runtime, atomic, shared) {
    this.runtime = runtime;
    this.atomic = atomic;
    this.root = runtime.root || globalThis;
    this.now = shared.now;
    this.log = shared.log;
    this.options = shared.options;
    this.probeIntervalMs = Math.max(60000, Math.min(30 * 60 * 1000, finite(this.options.bankRecoveryProbeIntervalMs, 5 * 60 * 1000)));
    this.failureRetryMs = Math.max(10000, Math.min(5 * 60 * 1000, finite(this.options.bankRecoveryFailureRetryMs, 30000)));
    this.lastProbeAt = -Infinity;
    this.nextProbeAt = -Infinity;
    this.lastCandidate = null;
    this.lastAction = null;
    this.stats = {
      bankTravels: 0,
      scans: 0,
      emptyScans: 0,
      candidates: 0,
      retrievesAttempted: 0,
      retrievesCommitted: 0,
      retrievesFailedSafe: 0,
      reconciliations: 0,
      skippedProtected: 0,
      skippedHighValue: 0,
      skippedIncompleteCompoundSet: 0,
      skippedWorkspace: 0
    };
    this.executor = new ControlledMerchantProductionExecutor({
      root: this.root,
      now: this.now,
      log: this.log,
      storageKey: 'aio-v3-alpha27-bank-recovery-operation-v1',
      getMode: () => this.runtime.adapter && this.runtime.adapter.mode,
      getSupervisorStatus: () => this.runtime.globalSupervisor && this.runtime.globalSupervisor.status
        ? this.runtime.globalSupervisor.status()
        : { state: 'UNKNOWN' },
      getEconomyEmergency: () => typeof this.runtime._alpha20EconomyEmergency === 'function'
        ? this.runtime._alpha20EconomyEmergency()
        : false,
      contentDrift: this.runtime.contentDrift,
      timeoutMs: 10000,
      verifyDelayMs: 200,
      verifyAttempts: 8,
      actionWindowMs: 60000,
      maxActionsPerWindow: 4,
      goldReserve: this.options.goldReserve
    });
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha27-bank-recovery', event, severity, reason, data }); } catch (_) {}
  }

  _inventoryPressure() {
    const c = characterOf(this.runtime);
    const items = inventoryOf(this.root);
    const capacity = Math.max(items.length, Math.floor(finite(c && c.isize, items.length)));
    const occupied = items.filter(Boolean).length;
    const ledgerStatus = this.runtime.inventoryLedger && this.runtime.inventoryLedger.status
      ? this.runtime.inventoryLedger.status()
      : null;
    const workspaceSlots = Math.max(1, Math.floor(finite(ledgerStatus && ledgerStatus.workspaceSlots, 3)));
    return {
      capacity,
      occupied,
      free: Math.max(0, capacity - occupied),
      workspaceSlots,
      minimumFreeForRetrieve: workspaceSlots + 1
    };
  }

  _contentUnsafe(name) {
    try {
      return !!(this.runtime.contentDrift
        && typeof this.runtime.contentDrift.requiresRevalidation === 'function'
        && this.runtime.contentDrift.requiresRevalidation('items', name));
    } catch (_) {
      return true;
    }
  }

  _recoverableRows() {
    const c = characterOf(this.runtime);
    if (!c || !c.bank || typeof c.bank !== 'object') return [];
    const gd = gameDataOf(this.runtime);
    const local = inventoryOf(this.root);
    const bank = bankRows(c.bank);
    const bankCounts = new Map();
    for (const row of bank) {
      const key = itemKey(row.name, row.level);
      bankCounts.set(key, (bankCounts.get(key) || 0) + row.quantity);
    }

    const candidates = [];
    for (const row of bank) {
      const raw = c.bank && Array.isArray(c.bank[row.pack]) ? c.bank[row.pack][row.index] : null;
      const meta = gd.items && gd.items[row.name];
      if (!raw || raw.l === true || raw.locked === true || raw.p || raw.special || !meta || this._contentUnsafe(row.name) || hardProtected(meta)) {
        this.stats.skippedProtected += 1;
        continue;
      }
      const level = levelOf(row);
      const grade = gradeForLevel(meta, level);
      if (grade >= 4) {
        this.stats.skippedProtected += 1;
        continue;
      }
      const value = finite(meta.g != null ? meta.g : meta.gold, null);
      if (value == null || value < 0) {
        this.stats.skippedProtected += 1;
        continue;
      }
      const localCount = quantity(local, row.name, level);
      const bankCount = bankCounts.get(itemKey(row.name, level)) || 0;

      if (meta.compound) {
        if (level >= this.options.maxCompoundLevel || value > this.options.compoundValueCap) {
          this.stats.skippedHighValue += 1;
          continue;
        }
        const remainder = localCount % 3;
        const neededForSet = remainder === 0 ? 3 : 3 - remainder;
        const totalAvailable = localCount + bankCount;
        if (totalAvailable >= localCount + neededForSet) {
          candidates.push({
            kind: 'COMPOUND_SET_COMPLETION',
            priority: 0,
            backlog: Math.floor(totalAvailable / 3),
            row,
            localCount,
            bankCount,
            neededForSet,
            value
          });
          continue;
        }
        // A levelled legacy result can still be useful to a Farmer or safely sold
        // after a fresh GearProgression evaluation. Level-0 partial sets stay in bank.
        if (level > 0 && value < this.options.keepValue) {
          candidates.push({
            kind: 'PROCESSED_COMPOUND_RESULT',
            priority: 1,
            backlog: bankCount,
            row,
            localCount,
            bankCount,
            neededForSet: 1,
            value
          });
          continue;
        }
        this.stats.skippedIncompleteCompoundSet += 1;
        continue;
      }

      if (meta.upgrade) {
        if (level >= this.options.maxUpgradeLevel || value > this.options.upgradeValueCap || value >= this.options.keepValue) {
          this.stats.skippedHighValue += 1;
          continue;
        }
        candidates.push({
          kind: level > 0 ? 'PROCESSED_UPGRADE_RESULT' : 'ECONOMIC_UPGRADE_INPUT',
          priority: level > 0 ? 1 : 2,
          backlog: bankCount,
          row,
          localCount,
          bankCount,
          neededForSet: 1,
          value
        });
      }
    }

    candidates.sort((a, b) => (
      a.priority - b.priority
      || b.backlog - a.backlog
      || a.row.level - b.row.level
      || a.row.name.localeCompare(b.row.name)
      || a.row.pack.localeCompare(b.row.pack)
      || a.row.index - b.row.index
    ));
    return candidates;
  }

  plan() {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return null;
    const pressure = this._inventoryPressure();
    const recovering = this.executor.activeOperation && !['COMMITTED', 'ABORTED', 'FAILED_SAFE'].includes(String(this.executor.activeOperation.state || ''));

    if (!c.bank || typeof c.bank !== 'object') {
      if (recovering || this.now() >= this.nextProbeAt) {
        return {
          action: 'TRAVEL_BANK',
          reason: recovering ? 'BANK_RECOVERY_RECONCILIATION_REQUIRES_BANK' : 'BANK_RECOVERY_PROBE_DUE',
          recovering,
          pressure
        };
      }
      return null;
    }

    this.stats.scans += 1;
    this.lastProbeAt = this.now();
    this.nextProbeAt = this.now() + this.probeIntervalMs;

    if (recovering) {
      return { action: 'RECONCILE', reason: 'BANK_RECOVERY_OPERATION_RECOVERING', pressure };
    }
    if (pressure.free < pressure.minimumFreeForRetrieve) {
      this.stats.skippedWorkspace += 1;
      this.lastCandidate = null;
      return { action: 'HOLD', reason: 'BANK_RECOVERY_WORKSPACE_FLOOR', pressure };
    }

    const candidates = this._recoverableRows();
    const picked = candidates[0] || null;
    if (!picked) {
      this.stats.emptyScans += 1;
      this.lastCandidate = null;
      return null;
    }
    this.stats.candidates += 1;
    this.lastCandidate = clone(picked);
    return {
      action: 'RETRIEVE',
      reason: picked.kind,
      pressure,
      candidate: clone(picked)
    };
  }

  async execute(plan) {
    if (!plan) return false;
    if (plan.action === 'HOLD') {
      this.lastAction = { at: this.now(), result: 'HOLD', reason: plan.reason, pressure: clone(plan.pressure) };
      return false;
    }
    if (plan.action === 'TRAVEL_BANK') {
      this.nextProbeAt = this.now() + this.failureRetryMs;
      const result = await this.atomic.namedServiceTravel('bank');
      const ok = result === true || !!(result && result.ok === true);
      if (ok) {
        this.stats.bankTravels += 1;
        this.nextProbeAt = this.now();
      }
      this.lastAction = { at: this.now(), result: ok ? 'TRAVELLED' : 'FAILED_SAFE', reason: plan.reason, travel: clone(result) };
      this._event('ALPHA27_BANK_RECOVERY_TRAVEL', ok ? 'info' : 'warn', plan.reason, this.lastAction);
      return true;
    }

    this.executor.configure({
      enabled: true,
      ack: CONTROLLED_MERCHANT_PRODUCTION_ACK,
      allowBuy: false,
      allowBank: true,
      allowCraft: false
    });

    if (plan.action === 'RECONCILE') {
      this.atomic.merchantBusy = true;
      try {
        const result = this.executor.reconcile();
        this.stats.reconciliations += 1;
        this.lastAction = { at: this.now(), result: 'RECONCILED', reason: result.reason, reconciliation: clone(result) };
        return true;
      } finally {
        this.atomic.merchantBusy = false;
        this.executor.disable('BANK_RECOVERY_RECONCILIATION_COMPLETE');
      }
    }

    if (plan.action !== 'RETRIEVE' || !plan.candidate || !plan.candidate.row) {
      this.executor.disable('BANK_RECOVERY_NO_ACTION');
      return false;
    }

    const row = plan.candidate.row;
    const step = {
      kind: ProductionStepKind.BANK_RETRIEVE,
      name: row.name,
      level: row.level,
      quantity: row.quantity,
      pack: row.pack,
      bankIndex: row.index,
      reason: `ALPHA27_BANK_RECOVERY:${plan.candidate.kind}`
    };
    const operation = {
      id: `alpha27-bank-recovery-${this.now().toString(36)}-${row.pack}-${row.index}`,
      target: { output: row.name },
      reason: plan.candidate.kind
    };

    this.stats.retrievesAttempted += 1;
    this.atomic.merchantBusy = true;
    try {
      const result = await this.executor.execute(operation, step);
      if (result && result.committed === true) {
        this.stats.retrievesCommitted += 1;
        this.nextProbeAt = this.now();
      } else if (result && result.executed === true) {
        this.stats.retrievesFailedSafe += 1;
        this.nextProbeAt = this.now() + this.failureRetryMs;
      }
      this.lastAction = {
        at: this.now(),
        result: result && result.committed === true ? 'COMMITTED' : result && result.executed === true ? 'FAILED_SAFE' : 'REJECTED',
        reason: result && result.reason || 'BANK_RECOVERY_RETRIEVE_REJECTED',
        candidate: clone(plan.candidate),
        execution: clone(result)
      };
      this._event(
        result && result.committed === true ? 'ALPHA27_BANK_RECOVERY_RETRIEVED' : 'ALPHA27_BANK_RECOVERY_RESULT',
        result && result.committed === true ? 'info' : 'warn',
        this.lastAction.reason,
        this.lastAction
      );
      return true;
    } finally {
      this.atomic.merchantBusy = false;
      const active = this.executor.activeOperation;
      if (!active || ['COMMITTED', 'ABORTED', 'FAILED_SAFE'].includes(String(active.state || ''))) {
        this.executor.disable('BANK_RECOVERY_STEP_COMPLETE');
      }
    }
  }

  status() {
    const executor = this.executor.status();
    return {
      mode: ALPHA27_BANK_RECOVERY_MODE,
      enabled: true,
      strategy: 'BANK_PROBE -> BOUNDED_RETRIEVE -> NORMAL_COMPOUND_UPGRADE -> GEAR_DELIVERY_OR_SELL',
      bankSnapshotRequiredForRetrieve: true,
      outsideBankProbeIntervalMs: this.probeIntervalMs,
      nextProbeAt: Number.isFinite(this.nextProbeAt) ? this.nextProbeAt : null,
      lastProbeAt: Number.isFinite(this.lastProbeAt) ? this.lastProbeAt : null,
      lastCandidate: clone(this.lastCandidate),
      lastAction: clone(this.lastAction),
      executor: {
        enabled: executor.enabled,
        busy: executor.busy,
        activeOperation: clone(executor.activeOperation),
        actionBudget: clone(executor.actionBudget),
        stats: clone(executor.stats)
      },
      stats: clone(this.stats)
    };
  }
}

module.exports = { Alpha27BankRecovery, ALPHA27_BANK_RECOVERY_MODE };
