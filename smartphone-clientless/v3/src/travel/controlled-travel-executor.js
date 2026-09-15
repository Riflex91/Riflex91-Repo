'use strict';

const CONTROLLED_TRAVEL_MODE = 'controlled-live-default-off';
const LIVE_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class ControlledTravelExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.controller = options.controller;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.timeoutMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.timeoutMs) || 120000));
    this.enabled = false;
    this.busy = false;
    this.activePlanId = null;
    this.lastAction = null;
    this.stats = { attempts: 0, completed: 0, rejected: 0, failedSafe: 0, timeouts: 0, aborts: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-travel', event, severity, reason, data });
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== LIVE_ACK) {
      this.enabled = false;
      this._event('CONTROLLED_TRAVEL_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this._event('CONTROLLED_TRAVEL_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_CANARY_ENABLE' : 'DISABLED', { enabled: this.enabled });
    return this.status();
  }

  async disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    if (this.busy) await this.abort(reason);
    this._event('CONTROLLED_TRAVEL_DISABLED', 'warn', reason);
    return this.status();
  }

  _inCombat() {
    const root = this.root || {};
    const character = root.character || {};
    if (character.target) return true;
    const parent = root.parent || {};
    const entities = parent.entities || root.entities || {};
    const selfNames = new Set([character.name, character.id].filter(Boolean).map(String));
    for (const entity of Object.values(entities)) {
      if (entity && entity.target && selfNames.has(String(entity.target))) return true;
    }
    return false;
  }

  _preflight(plan) {
    if (!plan) return { ok: false, reason: 'TRAVEL_PLAN_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'CONTROLLED_TRAVEL_DISABLED' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (this.busy) return { ok: false, reason: 'CONTROLLED_TRAVEL_BUSY' };
    if (plan.state !== 'PLANNED') return { ok: false, reason: 'TRAVEL_PLAN_NOT_PLANNED' };
    if (plan.leaseExpiresAt != null && this.now() > Number(plan.leaseExpiresAt)) return { ok: false, reason: 'TRAVEL_LEASE_EXPIRED' };
    if (plan.serverChangeAllowed !== false) return { ok: false, reason: 'PLAN_SERVER_CHANGE_CONTRACT_INVALID' };
    if (this.controller && this.controller.breaker().open) return { ok: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY', supervisorState: supervisor.state || null };
    const character = this.root && this.root.character;
    if (!character) return { ok: false, reason: 'CHARACTER_UNAVAILABLE' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    if (typeof this.root.smart_move !== 'function') return { ok: false, reason: 'SMART_MOVE_API_UNAVAILABLE' };
    if (typeof this.root.stop !== 'function') return { ok: false, reason: 'STOP_API_UNAVAILABLE' };
    return { ok: true, supervisor };
  }

  _destination(plan) {
    if (!plan || !plan.target) return null;
    if (plan.target.x == null || plan.target.y == null) return plan.target.map;
    return { map: plan.target.map, x: plan.target.x, y: plan.target.y };
  }

  _snapshot() {
    const c = this.root && this.root.character || {};
    return {
      observedAt: this.now(),
      character: {
        name: c.name, ctype: c.ctype || c.type, map: c.map,
        x: c.x != null ? c.x : c.real_x, y: c.y != null ? c.y : c.real_y,
        real_x: c.real_x, real_y: c.real_y, hp: c.hp, max_hp: c.max_hp,
        mp: c.mp, max_mp: c.max_mp, rip: c.rip === true
      }
    };
  }

  _timeout(promise) {
    let timer = null;
    const setTimer = (this.root && this.root.setTimeout) || setTimeout;
    const clearTimer = (this.root && this.root.clearTimeout) || clearTimeout;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error('SMART_MOVE_TIMEOUT')), this.timeoutMs); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }

  _startControlled(plan) {
    if (this.controller && typeof this.controller.startControlled === 'function') return this.controller.startControlled(plan.id);
    const map = this.controller && this.controller.plans;
    const row = map && typeof map.get === 'function' ? map.get(String(plan.id)) : null;
    if (!row || row.state !== 'PLANNED') return { started: false, reason: 'PLAN_NOT_STARTABLE' };
    if (this.controller.breaker().open) return { started: false, reason: 'TRAVEL_CIRCUIT_OPEN' };
    row.state = 'TRAVELLING';
    row.updatedAt = this.now();
    row.lastProgressAt = row.updatedAt;
    row.reason = 'CONTROLLED_EXECUTION_STARTED';
    this.controller.stats.controlledStarts = (this.controller.stats.controlledStarts || 0) + 1;
    if (typeof this.controller._event === 'function') this.controller._event('TRAVEL_CONTROLLED_STARTED', 'warn', 'CONTROLLED_CANARY', { planId: row.id });
    return { started: true, plan: clone(row) };
  }

  _failSafe(planId, reason) {
    if (this.controller && typeof this.controller.failSafe === 'function') return this.controller.failSafe(planId, reason);
    const map = this.controller && this.controller.plans;
    const row = map && typeof map.get === 'function' ? map.get(String(planId)) : null;
    if (!row || ['COMPLETED', 'ABORTED', 'FAILED_SAFE'].includes(row.state)) return false;
    row.state = 'FAILED_SAFE';
    row.reason = String(reason || 'FAILED_SAFE');
    row.updatedAt = this.now();
    this.controller.stats.failedSafe = (this.controller.stats.failedSafe || 0) + 1;
    if (typeof this.controller._failure === 'function') this.controller._failure(row.reason, row);
    if (typeof this.controller._event === 'function') this.controller._event('TRAVEL_FAILED_SAFE', 'error', row.reason, { planId: row.id });
    return true;
  }

  async _stopSmart(reason) {
    try {
      const result = await Promise.resolve(this.root.stop('smart'));
      this._event('CONTROLLED_TRAVEL_STOPPED', 'warn', reason, { result: clone(result) });
      return true;
    } catch (error) {
      this._event('CONTROLLED_TRAVEL_STOP_FAILED', 'error', reason, { message: String(error && error.message || error) });
      return false;
    }
  }

  async execute(planId) {
    const plan = this.controller && this.controller.get(String(planId));
    const check = this._preflight(plan);
    if (!check.ok) {
      if (plan && check.reason === 'TRAVEL_LEASE_EXPIRED') this.controller.cancel(plan.id, check.reason);
      this.stats.rejected += 1;
      this._event('CONTROLLED_TRAVEL_EXECUTION_REJECTED', 'warn', check.reason, { planId, supervisorState: check.supervisorState || null });
      return { executed: false, completed: false, reason: check.reason };
    }
    this.busy = true;
    this.activePlanId = plan.id;
    this.stats.attempts += 1;
    const started = this._startControlled(plan);
    if (!started || started.started !== true) {
      this.busy = false;
      this.activePlanId = null;
      this.stats.rejected += 1;
      return { executed: false, completed: false, reason: started && started.reason || 'TRAVEL_PLAN_NOT_STARTABLE' };
    }
    const destination = this._destination(plan);
    this._event('CONTROLLED_TRAVEL_STARTED', 'warn', 'CONTROLLED_CANARY', { planId: plan.id, destination: clone(destination) });

    try {
      const routePromise = Promise.resolve(this.root.smart_move(destination));
      routePromise.catch(() => {});
      const response = await this._timeout(routePromise);
      if (response && response.failed === true) throw new Error(String(response.reason || 'SMART_MOVE_FAILED'));
      this.controller.observe(this._snapshot());
      const finalPlan = this.controller.get(plan.id);
      if (!finalPlan || finalPlan.state !== 'COMPLETED') {
        this._failSafe(plan.id, 'ARRIVAL_VERIFICATION_FAILED');
        this.stats.failedSafe += 1;
        this.lastAction = { at: this.now(), planId: plan.id, result: 'FAILED_SAFE', reason: 'ARRIVAL_VERIFICATION_FAILED' };
        this._event('CONTROLLED_TRAVEL_FAILED_SAFE', 'error', 'ARRIVAL_VERIFICATION_FAILED', this.lastAction);
        return { executed: true, completed: false, reason: 'ARRIVAL_VERIFICATION_FAILED', response: clone(response) };
      }
      this.stats.completed += 1;
      this.lastAction = { at: this.now(), planId: plan.id, result: 'COMPLETED', destination: clone(destination) };
      this._event('CONTROLLED_TRAVEL_COMPLETED', 'info', null, this.lastAction);
      return { executed: true, completed: true, reason: 'ARRIVAL_VERIFIED', response: clone(response) };
    } catch (error) {
      const reason = String(error && error.message || error || 'SMART_MOVE_FAILED');
      if (reason === 'SMART_MOVE_TIMEOUT') {
        this.stats.timeouts += 1;
        await this._stopSmart(reason);
      }
      this._failSafe(plan.id, reason);
      this.stats.failedSafe += 1;
      this.lastAction = { at: this.now(), planId: plan.id, result: 'FAILED_SAFE', reason };
      this._event('CONTROLLED_TRAVEL_FAILED_SAFE', 'error', reason, this.lastAction);
      return { executed: true, completed: false, reason };
    } finally {
      this.busy = false;
      this.activePlanId = null;
    }
  }

  async abort(reason = 'OPERATOR_ABORT') {
    if (!this.busy || !this.activePlanId) return { aborted: false, reason: 'NO_ACTIVE_CONTROLLED_TRAVEL' };
    const planId = this.activePlanId;
    await this._stopSmart(reason);
    this.controller.cancel(planId, reason);
    this.stats.aborts += 1;
    this.busy = false;
    this.activePlanId = null;
    this.lastAction = { at: this.now(), planId, result: 'ABORTED', reason };
    return { aborted: true, planId, reason };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_TRAVEL_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      boundedActionFamilies: ['SMART_MOVE'],
      serverChangeAllowed: false,
      unknownMapTravelAllowed: false,
      explicitAckRequired: LIVE_ACK,
      busy: this.busy,
      activePlanId: this.activePlanId,
      timeoutMs: this.timeoutMs,
      lastAction: clone(this.lastAction),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledTravelExecutor, CONTROLLED_TRAVEL_MODE, CONTROLLED_TRAVEL_ACK: LIVE_ACK };
