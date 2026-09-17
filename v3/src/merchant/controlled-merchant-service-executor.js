'use strict';

const { MerchantServicePlanKind, itemQuantity } = require('./merchant-service-planner');
const { GameAdapter } = require('../game/adapter');

const CONTROLLED_MERCHANT_SERVICE_MODE = 'controlled-merchant-service-default-off';
const CONTROLLED_MERCHANT_SERVICE_ACK = 'ALPHA20_5_MERCHANT_SERVICE';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);
const TERMINAL = new Set(['COMMITTED', 'ABORTED', 'FAILED_SAFE']);
const MAX_SERVED_REPORTS = 32;

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class ControlledMerchantServiceExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3-merchant-service-operation-v1';
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.getEconomyEmergency = options.getEconomyEmergency || (() => false);
    this.getTrustedNames = options.getTrustedNames || (() => []);
    this.adapter = options.adapter || new GameAdapter({
      root: this.root,
      parent: this.root && this.root.parent,
      log: this.log,
      now: this.now,
      mode: this.getMode()
    });
    this.timeoutMs = Math.max(1000, Math.min(60000, finite(options.timeoutMs, 8000)));
    this.verifyDelayMs = Math.max(25, Math.min(2000, finite(options.verifyDelayMs, 150)));
    this.verifyAttempts = Math.max(1, Math.min(10, Math.floor(finite(options.verifyAttempts, 4))));
    this.maxDeliveryDistance = Math.max(50, Math.min(800, finite(options.maxDeliveryDistance, 400)));
    this.failureThreshold = Math.max(1, Math.min(10, Math.floor(finite(options.failureThreshold, 3))));
    this.failureWindowMs = Math.max(5000, Math.min(30 * 60 * 1000, finite(options.failureWindowMs, 120000)));
    this.circuitCooldownMs = Math.max(5000, Math.min(30 * 60 * 1000, finite(options.circuitCooldownMs, 120000)));
    this.actionWindowMs = Math.max(5000, Math.min(10 * 60 * 1000, finite(options.actionWindowMs, 60000)));
    this.maxActionsPerWindow = Math.max(1, Math.min(30, Math.floor(finite(options.maxActionsPerWindow, 8))));
    this.enabled = false;
    this.allowStand = false;
    this.allowDelivery = false;
    this.busy = false;
    this.activeOperation = null;
    this.lastAction = null;
    this.history = [];
    this.servedReports = new Map();
    this.failures = [];
    this.circuit = null;
    this.actionTimes = [];
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, recovered: 0, standActions: 0, deliveries: 0, rawActions: 0, duplicateReportsRejected: 0 };
    this._load();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-merchant-service', event, severity, reason, data });
  }

  _readStorage() {
    try {
      if (this.storage && typeof this.storage.get === 'function') return this.storage.get(this.storageKey);
      const local = this.root && this.root.localStorage;
      if (local && typeof local.getItem === 'function') return local.getItem(this.storageKey);
    } catch (_) {}
    return null;
  }

  _writeStorage(value) {
    const encoded = JSON.stringify(value);
    try {
      if (this.storage && typeof this.storage.set === 'function') return this.storage.set(this.storageKey, encoded) !== false;
      const local = this.root && this.root.localStorage;
      if (local && typeof local.setItem === 'function') { local.setItem(this.storageKey, encoded); return true; }
    } catch (_) { return false; }
    return false;
  }

  _servedRows() {
    return [...this.servedReports.entries()]
      .map(([name, at]) => ({ name, at }))
      .sort((a, b) => b.at - a.at || a.name.localeCompare(b.name))
      .slice(0, MAX_SERVED_REPORTS);
  }

  _persist() {
    return this._writeStorage({
      schemaVersion: 1,
      activeOperation: this.activeOperation,
      history: this.history.slice(-32),
      servedReports: this._servedRows()
    });
  }

  _loadServedReports(rows) {
    this.servedReports.clear();
    const cleaned = [];
    for (const row of Array.isArray(rows) ? rows : []) {
      const name = String(row && row.name || '').slice(0, 64);
      const at = finite(row && row.at);
      if (!name || at == null || at < 0) continue;
      cleaned.push({ name, at });
    }
    cleaned.sort((a, b) => b.at - a.at || a.name.localeCompare(b.name));
    for (const row of cleaned.slice(0, MAX_SERVED_REPORTS)) {
      const previous = this.servedReports.get(row.name);
      if (previous == null || row.at > previous) this.servedReports.set(row.name, row.at);
    }
  }

  _load() {
    const raw = this._readStorage();
    if (!raw) return false;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || Number(parsed.schemaVersion) !== 1) return false;
      this.history = Array.isArray(parsed.history) ? parsed.history.slice(-32) : [];
      this._loadServedReports(parsed.servedReports);
      const op = parsed.activeOperation && typeof parsed.activeOperation === 'object' ? clone(parsed.activeOperation) : null;
      if (op && !TERMINAL.has(op.state)) {
        op.state = 'RECOVERING';
        op.reason = 'RESTART_RECONCILIATION_REQUIRED';
        op.updatedAt = this.now();
        this.activeOperation = op;
        this._persist();
      } else this.activeOperation = op;
      return true;
    } catch (_) {
      this.activeOperation = { schemaVersion: 1, state: 'FAILED_SAFE', reason: 'CORRUPT_PERSISTED_SERVICE_OPERATION', updatedAt: this.now() };
      return false;
    }
  }

  _character() { return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null; }
  _entities() { return this.root && this.root.parent && this.root.parent.entities || this.root && this.root.entities || {}; }
  _inventory() { const c = this._character(); return c && Array.isArray(c.items) ? c.items : []; }
  _gameData() { return this.root && (this.root.G || (this.root.parent && this.root.parent.G)) || null; }
  _standOpen() { const c = this._character(); return !!(c && c.stand); }

  _inventorySize() {
    const c = this._character();
    const items = c && Array.isArray(c.items) ? c.items : [];
    return c && Number.isFinite(Number(c.isize)) ? Math.max(0, Math.floor(Number(c.isize))) : items.length;
  }

  _inventorySnapshot() {
    const items = this._inventory();
    const size = this._inventorySize();
    return items.slice(0, size).map((item, index) => item ? { index, name: item.name, q: Math.max(1, finite(item.q, 1)), level: Math.max(0, finite(item.level, 0)) } : null);
  }

  _standSlot() {
    const items = this._inventory();
    const size = Math.min(this._inventorySize(), items.length);
    const gameData = this._gameData();
    const definitions = gameData && gameData.items;
    if (!definitions || typeof definitions !== 'object') return null;
    for (let index = 0; index < size; index += 1) {
      const item = items[index];
      if (!item || !item.name) continue;
      const definition = definitions[item.name];
      if (definition && definition.stand) return index;
    }
    return null;
  }

  _servedReportAt(name) {
    const at = this.servedReports.get(String(name || ''));
    return at == null ? null : at;
  }

  _markServedReport(name, at) {
    const targetName = String(name || '').slice(0, 64);
    const reportAt = finite(at);
    if (!targetName || reportAt == null || reportAt < 0) return false;
    const previous = this._servedReportAt(targetName);
    if (previous == null || reportAt > previous) this.servedReports.set(targetName, reportAt);
    if (this.servedReports.size > MAX_SERVED_REPORTS) {
      const keep = this._servedRows();
      this.servedReports = new Map(keep.map((row) => [row.name, row.at]));
    }
    return this._persist();
  }

  _inCombat() {
    const c = this._character();
    if (!c) return false;
    if (c.target) return true;
    const names = new Set([c.name, c.id].filter(Boolean).map(String));
    return Object.values(this._entities()).some((entity) => entity && entity.target && names.has(String(entity.target)));
  }

  _trusted(name) {
    const wanted = String(name || '');
    if (!wanted) return false;
    return new Set((this.getTrustedNames() || []).filter(Boolean).map(String)).has(wanted);
  }

  _visibleTarget(name) {
    const wanted = String(name || '');
    return Object.values(this._entities()).find((entity) => entity && String(entity.name || '') === wanted) || null;
  }

  _distanceTo(entity) {
    const c = this._character();
    const cx = finite(c && (c.real_x != null ? c.real_x : c.x));
    const cy = finite(c && (c.real_y != null ? c.real_y : c.y));
    const tx = finite(entity && (entity.real_x != null ? entity.real_x : entity.x));
    const ty = finite(entity && (entity.real_y != null ? entity.real_y : entity.y));
    if (cx == null || cy == null || tx == null || ty == null) return null;
    return Math.hypot(cx - tx, cy - ty);
  }

  _pruneFailures(now = this.now()) {
    this.failures = this.failures.filter((row) => now - row.at <= this.failureWindowMs);
    if (this.circuit && this.circuit.openUntil <= now) this.circuit = null;
  }

  breaker() {
    const now = this.now();
    this._pruneFailures(now);
    return { open: !!this.circuit, openUntil: this.circuit ? this.circuit.openUntil : null, reason: this.circuit ? this.circuit.reason : null, failuresInWindow: this.failures.length, threshold: this.failureThreshold };
  }

  _failure(reason) {
    const now = this.now();
    this._pruneFailures(now);
    this.failures.push({ at: now, reason: String(reason || 'SERVICE_FAILURE') });
    if (this.failures.length >= this.failureThreshold) this.circuit = { openedAt: now, openUntil: now + this.circuitCooldownMs, reason: String(reason || 'SERVICE_FAILURE_BUDGET') };
  }

  _rawBudget() {
    const now = this.now();
    this.actionTimes = this.actionTimes.filter((at) => now - at <= this.actionWindowMs);
    return { allowed: this.actionTimes.length < this.maxActionsPerWindow, used: this.actionTimes.length, max: this.maxActionsPerWindow };
  }

  configure(config = {}) {
    if (config.enabled === true && config.ack !== CONTROLLED_MERCHANT_SERVICE_ACK) {
      this.enabled = false;
      this.allowStand = false;
      this.allowDelivery = false;
      this._event('MERCHANT_SERVICE_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = config.enabled === true;
    this.allowStand = this.enabled && config.allowStand === true;
    this.allowDelivery = this.enabled && config.allowDelivery === true;
    this._event('MERCHANT_SERVICE_CONFIG_CHANGED', 'warn', this.enabled ? 'EXPLICIT_CONTROLLED_ENABLE' : 'DISABLED', { enabled: this.enabled, allowStand: this.allowStand, allowDelivery: this.allowDelivery });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this.allowStand = false;
    this.allowDelivery = false;
    this._event('MERCHANT_SERVICE_DISABLED', 'warn', reason);
    return this.status();
  }

  _preflight(plan) {
    if (!plan || !plan.kind) return { ok: false, reason: 'SERVICE_PLAN_REQUIRED' };
    if (!this.enabled) return { ok: false, reason: 'MERCHANT_SERVICE_DISABLED' };
    if (this.busy) return { ok: false, reason: 'MERCHANT_SERVICE_BUSY' };
    if (this.activeOperation && !TERMINAL.has(this.activeOperation.state)) return { ok: false, reason: 'SERVICE_RECONCILIATION_REQUIRED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    if (this.getEconomyEmergency() === true) return { ok: false, reason: 'ECONOMY_EMERGENCY' };
    if (this.breaker().open) return { ok: false, reason: 'MERCHANT_SERVICE_CIRCUIT_OPEN' };
    if (!this._rawBudget().allowed) return { ok: false, reason: 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED' };
    const c = this._character();
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (c.rip === true || c.dead === true) return { ok: false, reason: 'MERCHANT_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'MERCHANT_IN_COMBAT' };
    if ([MerchantServicePlanKind.STAND_OPEN, MerchantServicePlanKind.STAND_CLOSE].includes(plan.kind) && !this.allowStand) return { ok: false, reason: 'STAND_AUTHORITY_DISABLED' };
    if (plan.kind === MerchantServicePlanKind.SERVICE_DELIVERY) {
      if (!this.allowDelivery) return { ok: false, reason: 'DELIVERY_AUTHORITY_DISABLED' };
      const targetName = plan.target && String(plan.target.name || '');
      const sourceReportAt = finite(plan.sourceReportAt);
      if (!targetName || sourceReportAt == null || sourceReportAt < 0) return { ok: false, reason: 'DELIVERY_SOURCE_REPORT_REQUIRED' };
      const servedAt = this._servedReportAt(targetName);
      if (servedAt != null && sourceReportAt <= servedAt) {
        this.stats.duplicateReportsRejected += 1;
        return { ok: false, reason: 'SERVICE_REPORT_ALREADY_SERVED' };
      }
    }
    return { ok: true };
  }

  _startOperation(plan, details) {
    const now = this.now();
    this.activeOperation = {
      schemaVersion: 1,
      id: String(plan.id || `service-${now}`),
      planKind: plan.kind,
      sourceReportAt: finite(plan.sourceReportAt),
      state: 'RESERVED',
      reason: 'PERSISTED_BEFORE_ACTION',
      createdAt: now,
      updatedAt: now,
      ...clone(details)
    };
    if (!this._persist()) {
      this.activeOperation.state = 'FAILED_SAFE';
      this.activeOperation.reason = 'PERSIST_BEFORE_ACTION_FAILED';
      this.activeOperation.updatedAt = this.now();
      return false;
    }
    return true;
  }

  _transition(state, reason) {
    if (!this.activeOperation) return false;
    this.activeOperation.state = state;
    this.activeOperation.reason = String(reason || state);
    this.activeOperation.updatedAt = this.now();
    this._persist();
    if (TERMINAL.has(state)) {
      this.history.push(clone(this.activeOperation));
      this.history = this.history.slice(-32);
      this._persist();
    }
    return true;
  }

  _delay(ms) {
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    return new Promise((resolve) => setTimer(resolve, ms));
  }

  _timeout(promise) {
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    const clearTimer = this.root && this.root.clearTimeout || clearTimeout;
    let timer = null;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error('MERCHANT_SERVICE_RAW_TIMEOUT')), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }

  _command(action, args = []) {
    if (!this.adapter || typeof this.adapter.command !== 'function') {
      return { executed: false, reason: 'GAME_ADAPTER_UNAVAILABLE', action };
    }
    const mode = this.getMode();
    if (this.adapter.mode !== mode && typeof this.adapter.setMode === 'function') this.adapter.setMode(mode);
    return this.adapter.command(action, args);
  }

  async _verify(predicate) {
    for (let attempt = 0; attempt < this.verifyAttempts; attempt += 1) {
      if (predicate()) return true;
      if (attempt + 1 < this.verifyAttempts) await this._delay(this.verifyDelayMs);
    }
    return false;
  }

  _commit(kind, reason, extra = {}) {
    this._transition('COMMITTED', reason);
    this.stats.committed += 1;
    this.failures = [];
    this.circuit = null;
    this.lastAction = { at: this.now(), kind, result: 'COMMITTED', reason, ...clone(extra) };
    return { executed: true, committed: true, reason, ...clone(extra) };
  }

  _failed(kind, reason, extra = {}) {
    this._transition('FAILED_SAFE', reason);
    this.stats.failedSafe += 1;
    this._failure(reason);
    this.lastAction = { at: this.now(), kind, result: 'FAILED_SAFE', reason, ...clone(extra) };
    this._event('MERCHANT_SERVICE_FAILED_SAFE', 'error', reason, this.lastAction);
    return { executed: true, committed: false, reason, ...clone(extra) };
  }

  async _executeStand(plan, open) {
    const fnName = open ? 'open_stand' : 'close_stand';
    const before = this._standOpen();
    if (before === open) return { executed: false, committed: true, reason: open ? 'STAND_ALREADY_OPEN' : 'STAND_ALREADY_CLOSED' };
    const standSlot = open ? this._standSlot() : null;
    if (open && standSlot == null) return { executed: false, committed: false, reason: 'VALID_STAND_ITEM_REQUIRED' };
    if (!this._startOperation(plan, { action: fnName, standSlot, beforeStandOpen: before, expectedStandOpen: open })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };
    this._transition('EXECUTING', 'RAW_ACTION_STARTING');
    this.actionTimes.push(this.now());
    this.stats.rawActions += 1;
    this.stats.standActions += 1;
    try {
      const command = this._command(fnName, open ? [standSlot] : []);
      if (!command.executed) return this._failed(plan.kind, `${fnName.toUpperCase()}_COMMAND_REJECTED:${command.reason || 'unknown'}`);
      const response = await this._timeout(command.value);
      if (response && response.success === false && response.reason) return this._failed(plan.kind, `STAND_API_REJECTED:${response.reason}`);
      this._transition('VERIFYING', 'RAW_ACTION_RETURNED');
      if (!await this._verify(() => this._standOpen() === open)) return this._failed(plan.kind, 'STAND_STATE_VERIFICATION_FAILED');
      return this._commit(plan.kind, open ? 'STAND_OPEN_VERIFIED' : 'STAND_CLOSE_VERIFIED', open ? { standSlot } : {});
    } catch (error) {
      return this._failed(plan.kind, String(error && error.message || error || 'STAND_ACTION_FAILED'));
    }
  }

  _sourceFor(itemName, quantity) {
    const wanted = String(itemName || '');
    const needed = Math.max(1, Math.floor(finite(quantity, 1)));
    const items = this._inventory();
    const size = this._inventorySize();
    for (let index = 0; index < Math.min(size, items.length); index += 1) {
      const item = items[index];
      if (!item || String(item.name || '') !== wanted) continue;
      const q = Math.max(1, finite(item.q, 1));
      if (q >= needed) return { index, quantity: q, name: wanted };
    }
    return null;
  }

  async _executeDelivery(plan) {
    const targetName = plan.target && String(plan.target.name || '');
    const sourceReportAt = finite(plan.sourceReportAt);
    const delivery = plan.delivery || {};
    const itemName = String(delivery.itemName || '');
    const quantity = Math.max(1, Math.min(1000, Math.floor(finite(delivery.quantity, 1))));
    if (!this._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
    if (!/^hpot|^mpot/i.test(itemName)) return { executed: false, committed: false, reason: 'DELIVERY_ITEM_NOT_POTION' };
    const target = this._visibleTarget(targetName);
    if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
    const c = this._character();
    if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
    const distance = this._distanceTo(target);
    if (distance == null || distance > this.maxDeliveryDistance) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };
    const source = this._sourceFor(itemName, quantity);
    if (!source) return { executed: false, committed: false, reason: 'DELIVERY_SOURCE_UNAVAILABLE' };
    const beforeInventory = this._inventorySnapshot();
    const beforeTotal = itemQuantity(beforeInventory, itemName);
    if (!this._startOperation(plan, { action: 'send_item', targetName, sourceReportAt, itemName, quantity, sourceIndex: source.index, beforeTotal, expectedAfterTotal: beforeTotal - quantity })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };
    this._transition('EXECUTING', 'RAW_ACTION_STARTING');
    this.actionTimes.push(this.now());
    this.stats.rawActions += 1;
    this.stats.deliveries += 1;
    try {
      const command = this._command('send_item', [targetName, source.index, quantity]);
      if (!command.executed) return this._failed(plan.kind, `SEND_ITEM_COMMAND_REJECTED:${command.reason || 'unknown'}`, { targetName, itemName, quantity, sourceReportAt });
      const response = await this._timeout(command.value);
      if (response && response.success === false) return this._failed(plan.kind, `SEND_ITEM_REJECTED:${response.reason || 'unknown'}`, { targetName, itemName, quantity, sourceReportAt });
      this._transition('VERIFYING', 'RAW_ACTION_RETURNED');
      const verified = await this._verify(() => itemQuantity(this._inventorySnapshot(), itemName) === beforeTotal - quantity);
      if (!verified) return this._failed(plan.kind, 'DELIVERY_LOCAL_DELTA_VERIFICATION_FAILED', { targetName, itemName, quantity, sourceReportAt });
      if (!this._markServedReport(targetName, sourceReportAt)) return this._failed(plan.kind, 'DELIVERY_DEDUPE_PERSIST_FAILED', { targetName, itemName, quantity, sourceReportAt });
      return this._commit(plan.kind, 'DELIVERY_LOCAL_DELTA_VERIFIED', { targetName, itemName, quantity, sourceReportAt });
    } catch (error) {
      return this._failed(plan.kind, String(error && error.message || error || 'SEND_ITEM_FAILED'), { targetName, itemName, quantity, sourceReportAt });
    }
  }

  async execute(plan) {
    const check = this._preflight(plan);
    if (!check.ok) {
      this.stats.rejected += 1;
      this._event('MERCHANT_SERVICE_EXECUTION_REJECTED', 'warn', check.reason, { planId: plan && plan.id || null, kind: plan && plan.kind || null });
      return { executed: false, committed: false, reason: check.reason };
    }
    this.busy = true;
    this.stats.attempts += 1;
    try {
      if (plan.kind === MerchantServicePlanKind.STAND_OPEN) return await this._executeStand(plan, true);
      if (plan.kind === MerchantServicePlanKind.STAND_CLOSE) return await this._executeStand(plan, false);
      if (plan.kind === MerchantServicePlanKind.SERVICE_DELIVERY) return await this._executeDelivery(plan);
      this.stats.rejected += 1;
      return { executed: false, committed: false, reason: 'SERVICE_PLAN_KIND_NOT_EXECUTABLE' };
    } finally {
      this.busy = false;
    }
  }

  reconcile() {
    const op = this.activeOperation;
    if (!op || TERMINAL.has(op.state)) return { reconciled: false, reason: 'NO_RECOVERING_SERVICE_OPERATION' };
    if (op.state !== 'RECOVERING') return { reconciled: false, reason: 'SERVICE_OPERATION_NOT_RECOVERING' };
    let committed = false;
    if (op.action === 'open_stand' || op.action === 'close_stand') committed = this._standOpen() === op.expectedStandOpen;
    else if (op.action === 'send_item') committed = itemQuantity(this._inventorySnapshot(), op.itemName) === Number(op.expectedAfterTotal);
    if (committed) {
      if (op.action === 'send_item' && !this._markServedReport(op.targetName, op.sourceReportAt)) {
        this._transition('FAILED_SAFE', 'RESTART_DEDUPE_PERSIST_FAILED_NO_RETRY');
        this.stats.failedSafe += 1;
        this._failure('RESTART_DEDUPE_PERSIST_FAILED_NO_RETRY');
        return { reconciled: true, committed: false, reason: 'RESTART_DEDUPE_PERSIST_FAILED_NO_RETRY' };
      }
      this._transition('COMMITTED', 'RESTART_RECONCILIATION_VERIFIED');
      this.stats.recovered += 1;
      this.stats.committed += 1;
      return { reconciled: true, committed: true, reason: 'RESTART_RECONCILIATION_VERIFIED' };
    }
    this._transition('FAILED_SAFE', 'RESTART_OUTCOME_UNCERTAIN_NO_RETRY');
    this.stats.failedSafe += 1;
    this._failure('RESTART_OUTCOME_UNCERTAIN_NO_RETRY');
    return { reconciled: true, committed: false, reason: 'RESTART_OUTCOME_UNCERTAIN_NO_RETRY' };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_MERCHANT_SERVICE_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled && (this.allowStand || this.allowDelivery),
      allowStand: this.allowStand,
      allowDelivery: this.allowDelivery,
      rawActionFamilies: ['OPEN_STAND', 'CLOSE_STAND', 'SEND_POTION'],
      commandBoundary: 'GameAdapter',
      arbitraryItemTransferAllowed: false,
      arbitraryTradeAllowed: false,
      buyAllowed: false,
      sellAllowed: false,
      upgradeAllowed: false,
      compoundAllowed: false,
      busy: this.busy,
      maxDeliveryDistance: this.maxDeliveryDistance,
      actionBudget: { ...this._rawBudget(), windowMs: this.actionWindowMs },
      circuit: this.breaker(),
      activeOperation: clone(this.activeOperation),
      lastAction: clone(this.lastAction),
      servedReports: this._servedRows(),
      history: this.history.slice(-16).map(clone),
      stats: clone(this.stats),
      explicitAckRequired: CONTROLLED_MERCHANT_SERVICE_ACK
    };
  }
}

module.exports = { ControlledMerchantServiceExecutor, CONTROLLED_MERCHANT_SERVICE_MODE, CONTROLLED_MERCHANT_SERVICE_ACK };
