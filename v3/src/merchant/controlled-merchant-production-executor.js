'use strict';

const { ProductionStepKind, recipeFor, itemQuantity, bankRows } = require('./merchant-production-planner');

const CONTROLLED_MERCHANT_PRODUCTION_MODE = 'controlled-merchant-production-default-off';
const CONTROLLED_MERCHANT_PRODUCTION_ACK = 'MERCHANT_PRODUCTION_V1';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);
const TERMINAL = new Set(['COMMITTED', 'ABORTED', 'FAILED_SAFE']);

function n(value, fallback = 0) { const x = Number(value); return Number.isFinite(x) ? x : fallback; }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function levelOf(item) { return Math.max(0, Math.floor(n(item && item.level, 0))); }

class ControlledMerchantProductionExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3-merchant-production-operation-v1';
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.getEconomyEmergency = options.getEconomyEmergency || (() => false);
    this.contentDrift = options.contentDrift || null;
    this.timeoutMs = Math.max(1000, Math.min(60000, n(options.timeoutMs, 10000)));
    this.verifyDelayMs = Math.max(25, Math.min(2000, n(options.verifyDelayMs, 200)));
    this.verifyAttempts = Math.max(1, Math.min(15, Math.floor(n(options.verifyAttempts, 6))));
    this.actionWindowMs = Math.max(5000, Math.min(600000, n(options.actionWindowMs, 60000)));
    this.maxActionsPerWindow = Math.max(1, Math.min(30, Math.floor(n(options.maxActionsPerWindow, 10))));
    this.maxBuyQuantity = Math.max(1, Math.min(10000, Math.floor(n(options.maxBuyQuantity, 1000))));
    this.goldReserve = Math.max(0, Math.floor(n(options.goldReserve, 1000000)));
    this.enabled = false; this.allowBuy = false; this.allowBank = false; this.allowCraft = false; this.allowExchange = false; this.busy = false;
    this.activeOperation = null; this.lastAction = null; this.history = []; this.actionTimes = [];
    this.stats = { attempts: 0, committed: 0, rejected: 0, failedSafe: 0, recovered: 0, buys: 0, bankRetrieves: 0, bankStores: 0, crafts: 0, exchanges: 0, verificationRetries: 0 };
    this._load();
  }

  _event(event, severity = 'info', reason = null, data = {}) { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-merchant-production', event, severity, reason, data }); }
  _character() { return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null; }
  _gameData() { return this.root && (this.root.G || (this.root.parent && this.root.parent.G)) || null; }
  _inventory() { const c = this._character(); return c && Array.isArray(c.items) ? c.items : []; }
  _api(name) { if (this.root && typeof this.root[name] === 'function') return [this.root[name], this.root]; if (this.root && this.root.parent && typeof this.root.parent[name] === 'function') return [this.root.parent[name], this.root.parent]; return null; }
  _bankQty(name, level) { const c = this._character(); return bankRows(c && c.bank).reduce((sum, row) => sum + (row.name === name && row.level === level ? row.quantity : 0), 0); }
  _inCombat() { const c = this._character(); if (!c) return false; if (c.target) return true; const entities = this.root && this.root.parent && this.root.parent.entities || this.root && this.root.entities || {}; const ids = new Set([c.name, c.id].filter(Boolean).map(String)); return Object.values(entities).some((e) => e && e.target && ids.has(String(e.target))); }

  _storageGet() { try { if (this.storage && typeof this.storage.get === 'function') return this.storage.get(this.storageKey); const ls = this.root && this.root.localStorage; return ls && typeof ls.getItem === 'function' ? ls.getItem(this.storageKey) : null; } catch (_) { return null; } }
  _storageSet(value) { try { const text = JSON.stringify(value); if (this.storage && typeof this.storage.set === 'function') return this.storage.set(this.storageKey, text) !== false; const ls = this.root && this.root.localStorage; if (ls && typeof ls.setItem === 'function') { ls.setItem(this.storageKey, text); return true; } } catch (_) {} return false; }
  _persist() { return this._storageSet({ schemaVersion: 1, activeOperation: this.activeOperation, history: this.history.slice(-32) }); }
  _load() { const raw = this._storageGet(); if (!raw) return; try { const data = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!data || Number(data.schemaVersion) !== 1) return; this.history = Array.isArray(data.history) ? data.history.slice(-32) : []; this.activeOperation = data.activeOperation && typeof data.activeOperation === 'object' ? clone(data.activeOperation) : null; if (this.activeOperation && !TERMINAL.has(this.activeOperation.state)) { this.activeOperation.state = 'RECOVERING'; this.activeOperation.reason = 'RESTART_RECONCILIATION_REQUIRED'; this.activeOperation.updatedAt = this.now(); this._persist(); } } catch (_) { this.activeOperation = { schemaVersion: 1, state: 'FAILED_SAFE', reason: 'CORRUPT_PERSISTED_PRODUCTION_OPERATION', updatedAt: this.now() }; } }

  configure(config = {}) {
    if (config.enabled === true && config.ack !== CONTROLLED_MERCHANT_PRODUCTION_ACK) return this.disable('ACK_REQUIRED');
    this.enabled = config.enabled === true;
    this.allowBuy = this.enabled && config.allowBuy === true;
    this.allowBank = this.enabled && config.allowBank === true;
    this.allowCraft = this.enabled && config.allowCraft === true;
    this.allowExchange = this.enabled && config.allowExchange === true;
    this._event('MERCHANT_PRODUCTION_CONFIG_CHANGED', 'warn', this.enabled ? 'EXPLICIT_CONTROLLED_ENABLE' : 'DISABLED', { enabled: this.enabled, allowBuy: this.allowBuy, allowBank: this.allowBank, allowCraft: this.allowCraft, allowExchange: this.allowExchange });
    return this.status();
  }
  disable(reason = 'OPERATOR_DISABLED') { this.enabled = false; this.allowBuy = false; this.allowBank = false; this.allowCraft = false; this.allowExchange = false; this._event('MERCHANT_PRODUCTION_DISABLED', 'warn', reason); return this.status(); }
  _budgetOk() { const now = this.now(); this.actionTimes = this.actionTimes.filter((at) => now - at <= this.actionWindowMs); return this.actionTimes.length < this.maxActionsPerWindow; }
  _sleep(ms) { const setTimer = this.root && this.root.setTimeout || setTimeout; return new Promise((resolve) => setTimer(resolve, ms)); }
  async _verify(fn) { for (let i = 0; i < this.verifyAttempts; i += 1) { if (fn()) return true; if (i + 1 < this.verifyAttempts) { this.stats.verificationRetries += 1; await this._sleep(this.verifyDelayMs); } } return false; }
  _timeout(value, label) { const setTimer = this.root && this.root.setTimeout || setTimeout; const clearTimer = this.root && this.root.clearTimeout || clearTimeout; let timer; const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error(`${label}_TIMEOUT`)), this.timeoutMs); }); return Promise.race([Promise.resolve(value), timeout]).finally(() => { if (timer) clearTimer(timer); }); }

  _preflight(step) {
    if (!step || !step.kind) return { ok: false, reason: 'PRODUCTION_STEP_REQUIRED' };
    if (!this.enabled) return { ok: false, reason: 'MERCHANT_PRODUCTION_DISABLED' };
    if (this.busy) return { ok: false, reason: 'MERCHANT_PRODUCTION_BUSY' };
    if (this.activeOperation && !TERMINAL.has(this.activeOperation.state)) return { ok: false, reason: 'PRODUCTION_RECONCILIATION_REQUIRED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (!SUPERVISOR_ALLOWED.has(String((this.getSupervisorStatus() || {}).state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    if (this.getEconomyEmergency() === true) return { ok: false, reason: 'ECONOMY_EMERGENCY' };
    const c = this._character();
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (c.rip === true || c.dead === true) return { ok: false, reason: 'MERCHANT_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'MERCHANT_IN_COMBAT' };
    if (!this._budgetOk()) return { ok: false, reason: 'PRODUCTION_ACTION_BUDGET_EXHAUSTED' };
    const kind = String(step.kind), name = String(step.name || ''), level = Math.max(0, Math.floor(n(step.level, 0)));
    if (!name) return { ok: false, reason: 'ITEM_NAME_REQUIRED' };
    if (this.contentDrift && typeof this.contentDrift.requiresRevalidation === 'function') { try { if (this.contentDrift.requiresRevalidation('items', name)) return { ok: false, reason: 'ITEM_REQUIRES_REVALIDATION' }; } catch (_) { return { ok: false, reason: 'CONTENT_DRIFT_CHECK_FAILED' }; } }
    if (kind === ProductionStepKind.BUY) {
      if (!this.allowBuy) return { ok: false, reason: 'BUY_AUTHORITY_DISABLED' };
      const api = this._api('buy'), quantity = Math.max(1, Math.floor(n(step.quantity, 1))), meta = this._gameData() && this._gameData().items && this._gameData().items[name] || {}, unitCost = Math.max(0, Math.floor(n(step.unitCost, n(meta.g, 0))));
      if (!api) return { ok: false, reason: 'BUY_API_UNAVAILABLE' }; if (quantity > this.maxBuyQuantity) return { ok: false, reason: 'BUY_QUANTITY_EXCEEDS_LIMIT' }; if (!unitCost) return { ok: false, reason: 'BUY_PRICE_UNKNOWN' }; if (n(c.gold, 0) - unitCost * quantity < this.goldReserve) return { ok: false, reason: 'GOLD_RESERVE_WOULD_BE_BREACHED' };
      return { ok: true, api, name, level: 0, quantity };
    }
    if (kind === ProductionStepKind.BANK_RETRIEVE) {
      if (!this.allowBank) return { ok: false, reason: 'BANK_AUTHORITY_DISABLED' }; if (!c.bank) return { ok: false, reason: 'NOT_IN_BANK' };
      const api = this._api('bank_retrieve'), pack = String(step.pack || ''), index = Number(step.bankIndex), item = pack && Number.isInteger(index) && Array.isArray(c.bank[pack]) ? c.bank[pack][index] : null;
      if (!api) return { ok: false, reason: 'BANK_RETRIEVE_API_UNAVAILABLE' }; if (!item || String(item.name || '') !== name || levelOf(item) !== level) return { ok: false, reason: 'BANK_ITEM_IDENTITY_CHANGED' };
      return { ok: true, api, name, level, pack, index, quantity: Math.max(1, Math.floor(n(item.q, 1))) };
    }
    if (kind === ProductionStepKind.BANK_STORE) {
      if (!this.allowBank) return { ok: false, reason: 'BANK_AUTHORITY_DISABLED' }; if (!c.bank) return { ok: false, reason: 'NOT_IN_BANK' };
      const api = this._api('bank_store'), index = Number(step.inventoryIndex), item = Number.isInteger(index) && Array.isArray(c.items) ? c.items[index] : null;
      if (!api) return { ok: false, reason: 'BANK_STORE_API_UNAVAILABLE' }; if (!item || String(item.name || '') !== name || levelOf(item) !== level) return { ok: false, reason: 'INVENTORY_ITEM_IDENTITY_CHANGED' };
      return { ok: true, api, name, level, index, quantity: Math.max(1, Math.floor(n(item.q, 1))) };
    }
    if (kind === ProductionStepKind.CRAFT) {
      if (!this.allowCraft) return { ok: false, reason: 'CRAFT_AUTHORITY_DISABLED' };
      const recipe = recipeFor(this._gameData(), name);
      if (!recipe) return { ok: false, reason: 'CRAFT_RECIPE_UNAVAILABLE' };
      const anniversaryQuest = String(recipe.quest || '') === 'anniversary_baker';
      const eventState = this.root && (this.root.S || this.root.parent && this.root.parent.S) || {};
      if (anniversaryQuest && !(eventState.anniversary && eventState.anniversary.active)) return { ok: false, reason: 'ANNIVERSARY_WORKSHOP_CLOSED' };
      const api = anniversaryQuest ? this._api('anniversary_craft') : this._api('auto_craft');
      if (!api) return { ok: false, reason: anniversaryQuest ? 'ANNIVERSARY_CRAFT_API_UNAVAILABLE' : 'AUTO_CRAFT_API_UNAVAILABLE' };
      for (const req of recipe.items) if (itemQuantity(this._inventory(), req.name, req.level) < req.quantity) return { ok: false, reason: 'CRAFT_MATERIALS_MISSING' };
      if (n(c.gold, 0) - recipe.cost < this.goldReserve) return { ok: false, reason: 'GOLD_RESERVE_WOULD_BE_BREACHED' };
      return { ok: true, api, name, level: 0, recipe, craftMode: anniversaryQuest ? 'ANNIVERSARY_CRAFT' : 'AUTO_CRAFT' };
    }
    if (kind === ProductionStepKind.EXCHANGE) {
      if (!this.allowExchange) return { ok: false, reason: 'EXCHANGE_AUTHORITY_DISABLED' };
      const api = this._api('exchange');
      const index = Number(step.inventoryIndex);
      const item = Number.isInteger(index) && Array.isArray(c.items) ? c.items[index] : null;
      const meta = this._gameData() && this._gameData().items && this._gameData().items[name] || {};
      const required = Math.max(1, Math.floor(n(step.quantity, n(meta.e, 0))));
      if (!api) return { ok: false, reason: 'EXCHANGE_API_UNAVAILABLE' };
      if (!item || String(item.name || '') !== name || levelOf(item) !== level) return { ok: false, reason: 'EXCHANGE_ITEM_IDENTITY_CHANGED' };
      if (item.locked || item.l || item.special || item.p) return { ok: false, reason: 'EXCHANGE_ITEM_PROTECTED' };
      if (Math.max(1, Math.floor(n(item.q, 1))) < required) return { ok: false, reason: 'EXCHANGE_REQUIREMENT_NOT_MET' };
      if (Math.max(0, Math.floor(n(meta.e, 0))) !== required) return { ok: false, reason: 'EXCHANGE_REQUIREMENT_CHANGED' };
      return { ok: true, api, name, level, index, quantity: required };
    }
    return { ok: false, reason: 'PRODUCTION_STEP_KIND_NOT_EXECUTABLE' };
  }

  _start(plan, step, data) { const now = this.now(); this.activeOperation = { schemaVersion: 1, id: `${String(plan && plan.id || 'manual')}:${now.toString(36)}`, planId: plan && plan.id || null, kind: step.kind, item: String(step.name || ''), level: Math.max(0, Math.floor(n(step.level, 0))), state: 'RESERVED', reason: 'PERSISTED_BEFORE_ACTION', createdAt: now, updatedAt: now, ...clone(data) }; return this._persist(); }
  _transition(state, reason) { if (!this.activeOperation) return; this.activeOperation.state = state; this.activeOperation.reason = reason; this.activeOperation.updatedAt = this.now(); this._persist(); }
  _finish(step, committed, reason, data = {}) { this._transition(committed ? 'COMMITTED' : 'FAILED_SAFE', reason); if (committed) this.stats.committed += 1; else this.stats.failedSafe += 1; this.lastAction = { at: this.now(), kind: step.kind, item: step.name, result: committed ? 'COMMITTED' : 'FAILED_SAFE', reason, ...clone(data) }; this.history.push(clone(this.lastAction)); this.history = this.history.slice(-32); this._persist(); this._event(committed ? 'MERCHANT_PRODUCTION_COMMITTED' : 'MERCHANT_PRODUCTION_FAILED_SAFE', committed ? 'info' : 'error', reason, this.lastAction); return { executed: true, committed, reason, ...clone(data) }; }

  async execute(plan, step) {
    const check = this._preflight(step); if (!check.ok) { this.stats.rejected += 1; return { executed: false, committed: false, reason: check.reason }; }
    this.busy = true; this.stats.attempts += 1; this.actionTimes.push(this.now());
    try {
      const beforeInv = itemQuantity(this._inventory(), check.name, check.level), beforeBank = this._bankQty(check.name, check.level);
      if (step.kind === ProductionStepKind.BUY) {
        if (!this._start(plan, step, { action: 'buy', expectedInventory: beforeInv + check.quantity })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' }; this._transition('EXECUTING', 'BUY_STARTING'); this.stats.buys += 1; await this._timeout(check.api[0].call(check.api[1], check.name, check.quantity), 'BUY'); this._transition('VERIFYING', 'BUY_RETURNED'); const ok = await this._verify(() => itemQuantity(this._inventory(), check.name, 0) >= beforeInv + check.quantity); return this._finish(step, ok, ok ? 'BUY_DELTA_VERIFIED' : 'BUY_DELTA_VERIFICATION_FAILED', { quantity: check.quantity });
      }
      if (step.kind === ProductionStepKind.BANK_RETRIEVE) {
        if (!this._start(plan, step, { action: 'bank_retrieve', expectedInventory: beforeInv + check.quantity, expectedBank: beforeBank - check.quantity })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' }; this._transition('EXECUTING', 'BANK_RETRIEVE_STARTING'); this.stats.bankRetrieves += 1; await this._timeout(check.api[0].call(check.api[1], check.pack, check.index), 'BANK_RETRIEVE'); this._transition('VERIFYING', 'BANK_RETRIEVE_RETURNED'); const ok = await this._verify(() => itemQuantity(this._inventory(), check.name, check.level) >= beforeInv + check.quantity && this._bankQty(check.name, check.level) <= beforeBank - check.quantity); return this._finish(step, ok, ok ? 'BANK_RETRIEVE_DELTA_VERIFIED' : 'BANK_RETRIEVE_DELTA_VERIFICATION_FAILED', { quantity: check.quantity });
      }
      if (step.kind === ProductionStepKind.BANK_STORE) {
        if (!this._start(plan, step, { action: 'bank_store', expectedInventory: beforeInv - check.quantity, expectedBank: beforeBank + check.quantity })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' }; this._transition('EXECUTING', 'BANK_STORE_STARTING'); this.stats.bankStores += 1; await this._timeout(check.api[0].call(check.api[1], check.index), 'BANK_STORE'); this._transition('VERIFYING', 'BANK_STORE_RETURNED'); const ok = await this._verify(() => itemQuantity(this._inventory(), check.name, check.level) <= beforeInv - check.quantity && this._bankQty(check.name, check.level) >= beforeBank + check.quantity); return this._finish(step, ok, ok ? 'BANK_STORE_DELTA_VERIFIED' : 'BANK_STORE_DELTA_VERIFICATION_FAILED', { quantity: check.quantity });
      }
      if (step.kind === ProductionStepKind.EXCHANGE) {
        if (!this._start(plan, step, { action: 'exchange', inventoryIndex: check.index, consumedQuantity: check.quantity, expectedInventoryMax: beforeInv - check.quantity })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };
        this._transition('EXECUTING', 'EXCHANGE_STARTING');
        this.stats.exchanges += 1;
        const response = await this._timeout(check.api[0].call(check.api[1], check.index), 'EXCHANGE');
        if (response && response.success === false) throw new Error(`EXCHANGE_REJECTED:${response.reason || 'unknown'}`);
        this._transition('VERIFYING', 'EXCHANGE_RETURNED');
        const ok = await this._verify(() => itemQuantity(this._inventory(), check.name, check.level) <= beforeInv - check.quantity);
        return this._finish(step, ok, ok ? 'EXCHANGE_INPUT_DELTA_VERIFIED' : 'EXCHANGE_INPUT_DELTA_VERIFICATION_FAILED', { consumedQuantity: check.quantity, reward: response && response.reward || null });
      }
      const out = Math.max(1, Math.floor(n(check.recipe.outputQuantity, 1)));
      const craftAction = check.craftMode === 'ANNIVERSARY_CRAFT' ? 'anniversary_craft' : 'auto_craft';
      if (!this._start(plan, step, { action: craftAction, expectedInventory: beforeInv + out })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };
      this._transition('EXECUTING', check.craftMode === 'ANNIVERSARY_CRAFT' ? 'ANNIVERSARY_CRAFT_STARTING' : 'AUTO_CRAFT_STARTING');
      this.stats.crafts += 1;
      await this._timeout(check.api[0].call(check.api[1], check.name), check.craftMode === 'ANNIVERSARY_CRAFT' ? 'ANNIVERSARY_CRAFT' : 'AUTO_CRAFT');
      this._transition('VERIFYING', check.craftMode === 'ANNIVERSARY_CRAFT' ? 'ANNIVERSARY_CRAFT_RETURNED' : 'AUTO_CRAFT_RETURNED');
      const ok = await this._verify(() => itemQuantity(this._inventory(), check.name, 0) >= beforeInv + out);
      return this._finish(step, ok, ok ? 'CRAFT_OUTPUT_VERIFIED' : 'CRAFT_OUTPUT_DELTA_VERIFICATION_FAILED', { outputQuantity: out, craftMode: check.craftMode });
    } catch (error) { return this._finish(step, false, String(error && error.message || error || 'PRODUCTION_ACTION_FAILED')); }
    finally { this.busy = false; }
  }

  reconcile() {
    const op = this.activeOperation; if (!op || TERMINAL.has(op.state)) return { reconciled: false, reason: 'NO_RECOVERING_PRODUCTION_OPERATION' }; if (op.state !== 'RECOVERING') return { reconciled: false, reason: 'PRODUCTION_OPERATION_NOT_RECOVERING' };
    const inv = itemQuantity(this._inventory(), op.item, op.level), bank = this._bankQty(op.item, op.level); let ok = false;
    if (op.action === 'buy' || op.action === 'auto_craft' || op.action === 'anniversary_craft') ok = inv >= n(op.expectedInventory, Infinity); else if (op.action === 'exchange') ok = inv <= n(op.expectedInventoryMax, -1); else if (op.action === 'bank_retrieve') ok = inv >= n(op.expectedInventory, Infinity) && bank <= n(op.expectedBank, -1); else if (op.action === 'bank_store') ok = inv <= n(op.expectedInventory, -1) && bank >= n(op.expectedBank, Infinity);
    this._transition(ok ? 'COMMITTED' : 'FAILED_SAFE', ok ? 'RESTART_RECONCILIATION_VERIFIED' : 'RESTART_OUTCOME_UNCERTAIN_NO_RETRY'); if (ok) { this.stats.recovered += 1; this.stats.committed += 1; } else this.stats.failedSafe += 1; return { reconciled: true, committed: ok, reason: this.activeOperation.reason };
  }

  status() { this._budgetOk(); return { schemaVersion: 1, mode: CONTROLLED_MERCHANT_PRODUCTION_MODE, enabled: this.enabled, actionAuthority: this.enabled && (this.allowBuy || this.allowBank || this.allowCraft || this.allowExchange), allowBuy: this.allowBuy, allowBank: this.allowBank, allowCraft: this.allowCraft, allowExchange: this.allowExchange, buyAllowed: this.enabled && this.allowBuy, bankAllowed: this.enabled && this.allowBank, craftAllowed: this.enabled && this.allowCraft, exchangeAllowed: this.enabled && this.allowExchange, rawActionFamilies: ['BUY', 'BANK_RETRIEVE', 'BANK_STORE', 'AUTO_CRAFT', 'EXCHANGE'], busy: this.busy, goldReserve: this.goldReserve, maxBuyQuantity: this.maxBuyQuantity, actionBudget: { used: this.actionTimes.length, max: this.maxActionsPerWindow, windowMs: this.actionWindowMs, allowed: this.actionTimes.length < this.maxActionsPerWindow }, activeOperation: clone(this.activeOperation), lastAction: clone(this.lastAction), history: this.history.slice(-16).map(clone), stats: clone(this.stats), explicitAckRequired: CONTROLLED_MERCHANT_PRODUCTION_ACK }; }
}

module.exports = { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_MODE, CONTROLLED_MERCHANT_PRODUCTION_ACK };
