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
    this.batchSession = null;
    this.bankVisibilityWaitUntil = -Infinity;
    this.nextBatchAt = -Infinity;
    this.stats = {
      bankTravels: 0,
      scans: 0,
      emptyScans: 0,
      candidates: 0,
      retrievesAttempted: 0,
      retrievesCommitted: 0,
      retrievesFailedSafe: 0,
      batchesStarted: 0,
      batchesCompleted: 0,
      batchRowsPlanned: 0,
      batchRowsCommitted: 0,
      reconciliations: 0,
      skippedProtected: 0,
      skippedHighValue: 0,
      skippedIncompleteCompoundSet: 0,
      skippedWorkspace: 0,
      offlineGearReservationsHeld: 0,
      offlineGearReturnsPlanned: 0
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

  _currentTrustedPartyNames() {
    const partyNames = new Set(
      (Array.isArray(this.runtime.lastSnapshot && this.runtime.lastSnapshot.party)
        ? this.runtime.lastSnapshot.party
        : [])
        .map((row) => typeof row === 'string' ? row : row && row.name)
        .filter(Boolean)
        .map(String)
    );
    const trusted = new Set();
    try {
      for (const name of this.runtime.partyBootstrap && typeof this.runtime.partyBootstrap.trustedRosterNames === 'function'
        ? this.runtime.partyBootstrap.trustedRosterNames() || []
        : []) trusted.add(String(name));
    } catch (_) {}
    if (!trusted.size) return new Set();
    return new Set([...partyNames].filter((name) => trusted.has(name)));
  }

  _offlineGearReservationState(row, excludedGoalIds = new Set()) {
    const c = characterOf(this.runtime);
    const gear = this.runtime.gearProgression;
    if (!c || !row || !gear || typeof gear.list !== 'function') return null;
    let goals = [];
    try {
      goals = gear.list(512).filter((goal) => goal
        && goal.bankUntilPartyReturn === true
        && String(goal.sourceCharacter || '') === String(c.name || '')
        && String(goal.item || '') === String(row.name || '')
        && levelOf({ level: goal.observedLevel }) === levelOf(row)
        && goal.character
        && String(goal.character) !== String(c.name || ''));
    } catch (_) {
      return null;
    }
    if (!goals.length) return null;
    const currentParty = this._currentTrustedPartyNames();
    const returning = goals
      .filter((goal) => currentParty.has(String(goal.character))
        && !excludedGoalIds.has(String(goal.id || '')))
      .sort((a, b) => finite(b.survivalImprovement, 0) - finite(a.survivalImprovement, 0)
        || finite(b.improvement, 0) - finite(a.improvement, 0)
        || String(a.id || '').localeCompare(String(b.id || '')))[0] || null;
    return {
      reserved: true,
      releasable: !!returning,
      returningGoal: returning ? clone(returning) : null,
      goalIds: goals.map((goal) => String(goal.id || '')).filter(Boolean).slice(0, 32),
      targetNames: [...new Set(goals.map((goal) => String(goal.character || '')).filter(Boolean))].slice(0, 32)
    };
  }

  _recoverableRows() {
    const c = characterOf(this.runtime);
    if (!c || !c.bank || typeof c.bank !== 'object') return [];
    if (this.runtime.merchantBankCatalog && typeof this.runtime.merchantBankCatalog.observe === 'function') this.runtime.merchantBankCatalog.observe(c);
    const gd = gameDataOf(this.runtime);
    const local = inventoryOf(this.root);
    const bank = bankRows(c.bank);
    const bankCounts = new Map();
    for (const row of bank) {
      const key = itemKey(row.name, row.level);
      bankCounts.set(key, (bankCounts.get(key) || 0) + row.quantity);
    }

    const candidates = [];
    const allocatedOfflineReturnGoalIds = new Set();
    for (const row of bank) {
      const raw = c.bank && Array.isArray(c.bank[row.pack]) ? c.bank[row.pack][row.index] : null;
      const meta = gd.items && gd.items[row.name];
      if (!raw || raw.l === true || raw.locked === true || raw.p || raw.special || !meta || this._contentUnsafe(row.name) || hardProtected(meta)) {
        this.stats.skippedProtected += 1;
        continue;
      }
      const level = levelOf(row);
      const offlineReservation = this._offlineGearReservationState(row, allocatedOfflineReturnGoalIds);
      if (offlineReservation && offlineReservation.reserved === true) {
        if (!offlineReservation.releasable) {
          this.stats.offlineGearReservationsHeld += 1;
          continue;
        }
        this.stats.offlineGearReturnsPlanned += 1;
        if (offlineReservation.returningGoal && offlineReservation.returningGoal.id) {
          allocatedOfflineReturnGoalIds.add(String(offlineReservation.returningGoal.id));
        }
        candidates.push({
          kind: 'OFFLINE_PARTY_GEAR_RETURN',
          priority: -10,
          backlog: 1,
          row,
          localCount: quantity(local, row.name, level),
          bankCount: bankCounts.get(itemKey(row.name, level)) || 0,
          neededForSet: 1,
          value: Math.max(0, finite(meta.g != null ? meta.g : meta.gold, 0)),
          targetName: offlineReservation.returningGoal && offlineReservation.returningGoal.character || null,
          targetSlot: offlineReservation.returningGoal && offlineReservation.returningGoal.slot || null,
          gearGoalId: offlineReservation.returningGoal && offlineReservation.returningGoal.id || null,
          offlineReservation
        });
        continue;
      }
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

  _batchCapacity(pressure) {
    const maxRows = Math.max(1, Math.floor(finite(this.options.bankRecoveryBatchMaxRows, 12)));
    const usableSlots = Math.max(0, Math.floor(finite(pressure && pressure.free, 0) - finite(pressure && pressure.workspaceSlots, 0)));
    return Math.max(0, Math.min(maxRows, usableSlots));
  }

  _startBatch(candidates, pressure) {
    const capacity = this._batchCapacity(pressure);
    const selected = (Array.isArray(candidates) ? candidates : []).slice(0, capacity);
    if (!selected.length) return null;
    const now = this.now();
    this.batchSession = {
      id: `bank-batch-${now.toString(36)}`,
      startedAt: now,
      updatedAt: now,
      plannedRows: selected.length,
      remainingRows: selected.length,
      committedRows: 0,
      identities: selected.map((candidate) => `${candidate.row.name}:${candidate.row.level}`)
    };
    this.stats.batchesStarted += 1;
    this.stats.batchRowsPlanned += selected.length;
    this._event('ALPHA27_BANK_RECOVERY_BATCH_STARTED', 'info', 'BANK_WORK_BLOCK_PLANNED', {
      batch: clone(this.batchSession),
      pressure: clone(pressure)
    });
    return this.batchSession;
  }

  _finishBatch(reason = 'BANK_WORK_BLOCK_DRAINED') {
    const session = this.batchSession;
    if (!session) return null;
    this.batchSession = null;
    if (reason === 'BANK_WORK_BLOCK_TARGET_REACHED') this.nextBatchAt = this.now() + 60000;
    this.stats.batchesCompleted += 1;
    const completed = { ...clone(session), endedAt: this.now(), reason };
    this._event('ALPHA27_BANK_RECOVERY_BATCH_COMPLETED', 'info', reason, completed);
    return completed;
  }

  hasActiveBatch() {
    return !!(this.batchSession && Math.max(0, finite(this.batchSession.remainingRows, 0)) > 0);
  }

  plan() {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return null;
    const pressure = this._inventoryPressure();
    const recovering = this.executor.activeOperation && !['COMMITTED', 'ABORTED', 'FAILED_SAFE'].includes(String(this.executor.activeOperation.state || ''));

    if (!c.bank || typeof c.bank !== 'object') {
      if (this.now() < this.bankVisibilityWaitUntil) {
        return {
          action: 'HOLD',
          reason: 'BANK_RECOVERY_WAITING_FOR_BANK_VISIBILITY',
          keepTask: true,
          pressure
        };
      }
      // Do not invent a Bank trip merely because this module exists. In live
      // runtime the persistent catalog is the evidence that Bank work is a real
      // responsibility; stripped-down contexts/tests without a catalog must
      // leave unrelated SELL/production work alone.
      const catalog = this.runtime.merchantBankCatalog;
      const catalogAvailable = !!(catalog && typeof catalog.status === 'function');
      if (recovering || (catalogAvailable && this.now() >= this.nextProbeAt)) {
        return {
          action: 'TRAVEL_BANK',
          reason: recovering ? 'BANK_RECOVERY_RECONCILIATION_REQUIRES_BANK' : 'BANK_RECOVERY_PROBE_DUE',
          recovering,
          pressure
        };
      }
      return null;
    }

    this.bankVisibilityWaitUntil = -Infinity;
    this.stats.scans += 1;
    this.lastProbeAt = this.now();
    this.nextProbeAt = this.now() + this.probeIntervalMs;

    if (!this.batchSession && this.now() < this.nextBatchAt) {
      return {
        action: 'HOLD',
        reason: 'BANK_WORK_BLOCK_READY_FOR_PROCESSING',
        keepTask: false,
        pressure,
        retryAt: this.nextBatchAt
      };
    }

    if (recovering) {
      return { action: 'RECONCILE', reason: 'BANK_RECOVERY_OPERATION_RECOVERING', pressure };
    }
    if (pressure.free < pressure.minimumFreeForRetrieve) {
      this.stats.skippedWorkspace += 1;
      this.lastCandidate = null;
      if (this.batchSession) this._finishBatch('BANK_WORKSPACE_FLOOR_REACHED');
      return { action: 'HOLD', reason: 'BANK_RECOVERY_WORKSPACE_FLOOR', pressure };
    }

    const candidates = this._recoverableRows();
    if (!candidates.length) {
      this.stats.emptyScans += 1;
      this.lastCandidate = null;
      if (this.batchSession) this._finishBatch('BANK_RECOVERY_CANDIDATES_DRAINED');
      return null;
    }
    if (!this.batchSession) this._startBatch(candidates, pressure);
    if (!this.hasActiveBatch()) {
      this._finishBatch('BANK_WORK_BLOCK_DRAINED');
      return null;
    }

    const picked = candidates[0] || null;
    if (!picked) {
      this._finishBatch('BANK_RECOVERY_CANDIDATES_DRAINED');
      return null;
    }
    this.stats.candidates += 1;
    this.lastCandidate = clone(picked);
    return {
      action: 'RETRIEVE',
      reason: picked.kind,
      pressure,
      candidate: clone(picked),
      batch: clone(this.batchSession)
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
        // Bank data can appear a tick after smart_move resolves. Keep the bank
        // work task latched through this visibility window so progression cannot
        // pull the Merchant away before the batch is planned.
        this.bankVisibilityWaitUntil = this.now() + 5000;
        this.nextProbeAt = this.now() + 5000;
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
        if (this.batchSession) {
          this.batchSession.committedRows += 1;
          this.batchSession.remainingRows = Math.max(0, this.batchSession.remainingRows - 1);
          this.batchSession.updatedAt = this.now();
          this.stats.batchRowsCommitted += 1;
          if (this.batchSession.remainingRows <= 0) this._finishBatch('BANK_WORK_BLOCK_TARGET_REACHED');
        }
        this.nextProbeAt = this.now();
        if (this.runtime.merchantBankCatalog && typeof this.runtime.merchantBankCatalog.observe === 'function') this.runtime.merchantBankCatalog.observe(characterOf(this.runtime));
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
      strategy: 'BANK_PROBE -> OFFLINE_PARTY_GEAR_RETURN -> BATCH_RETRIEVE_WORK_BLOCK -> NORMAL_COMPOUND_UPGRADE -> GEAR_DELIVERY_OR_SELL',
      bankSnapshotRequiredForRetrieve: true,
      offlinePartyGearPolicy: 'HOLD_IN_BANK_UNTIL_TRUSTED_PARTY_RETURN',
      batchRecovery: true,
      batchMaxRows: Math.max(1, Math.floor(finite(this.options.bankRecoveryBatchMaxRows, 12))),
      activeBatch: clone(this.batchSession),
      bankVisibilityWaitUntil: Number.isFinite(this.bankVisibilityWaitUntil) ? this.bankVisibilityWaitUntil : null,
      nextBatchAt: Number.isFinite(this.nextBatchAt) ? this.nextBatchAt : null,
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
