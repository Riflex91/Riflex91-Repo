'use strict';

const COMMANDS = new Set([
  'SET_MODE',
  'SET_FARMER_ENABLED',
  'SET_TARGET_POLICY',
  'ADD_TARGET_EXCLUSION',
  'REMOVE_TARGET_EXCLUSION',
  'APPROVE_MONSTER_CONTENT',
  'QUARANTINE_MONSTER_CONTENT',
  'SAVE_WORLD',
  'SHOW_STATUS'
]);

const ELEVATED = new Set(['SET_MODE_ACTIVE', 'SET_FARMER_ENABLED_TRUE', 'APPROVE_MONSTER_CONTENT']);

function text(value) { return String(value == null ? '' : value).trim(); }

class ControlGateway {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.execute = typeof options.execute === 'function' ? options.execute : (() => { throw new Error('control executor unavailable'); });
    this.allowElevated = options.allowElevated === true;
    this.maxHistory = Math.max(50, Number(options.maxHistory) || 500);
    this.maxTtlMs = Math.max(1000, Number(options.maxTtlMs) || 60000);
    this.history = new Map();
    this.order = [];
  }

  _emit(event, input, result) {
    if (!this.log) return;
    this.log.emit({
      component: 'control',
      event,
      severity: result.status === 'REJECTED' || result.status === 'FAILED' ? 'warn' : 'info',
      reason: result.reason || null,
      data: {
        commandId: input && input.commandId || null,
        action: input && input.action || null,
        status: result.status
      }
    });
  }

  _remember(id, result) {
    this.history.set(id, result);
    this.order.push(id);
    while (this.order.length > this.maxHistory) {
      const oldest = this.order.shift();
      this.history.delete(oldest);
    }
  }

  _requiresElevated(action, params) {
    if (action === 'SET_MODE' && params && params.mode === 'active') return true;
    if (action === 'SET_FARMER_ENABLED' && params && params.enabled === true) return true;
    if (action === 'APPROVE_MONSTER_CONTENT') return true;
    return ELEVATED.has(action);
  }

  submit(input = {}) {
    const now = this.now();
    const commandId = text(input.commandId);
    const action = text(input.action).toUpperCase();
    const params = input.params && typeof input.params === 'object' ? input.params : {};
    const issuedAt = Number(input.issuedAt);
    const expiresAt = Number(input.expiresAt);

    if (!commandId || commandId.length > 120) return this._reject(input, 'INVALID_COMMAND_ID');
    if (this.history.has(commandId)) {
      const previous = this.history.get(commandId);
      const result = { ...previous, duplicate: true };
      this._emit('CONTROL_COMMAND_DUPLICATE', input, result);
      return result;
    }
    if (!COMMANDS.has(action)) return this._reject(input, 'ACTION_NOT_ALLOWED');
    if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt < issuedAt) return this._reject(input, 'INVALID_TIME_WINDOW');
    if (expiresAt - issuedAt > this.maxTtlMs) return this._reject(input, 'TTL_TOO_LONG');
    if (now > expiresAt) return this._reject(input, 'COMMAND_EXPIRED', 'EXPIRED');
    if (issuedAt > now + 5000) return this._reject(input, 'COMMAND_FROM_FUTURE');
    if (this._requiresElevated(action, params) && !this.allowElevated) return this._reject(input, 'ELEVATED_CONTROL_DISABLED');

    try {
      const value = this.execute(action, params);
      const result = { commandId, action, status: 'EXECUTED', executedAt: now, value };
      this._remember(commandId, result);
      this._emit('CONTROL_COMMAND_EXECUTED', input, result);
      return result;
    } catch (error) {
      const result = { commandId, action, status: 'FAILED', executedAt: now, reason: String(error && error.message || error) };
      this._remember(commandId, result);
      this._emit('CONTROL_COMMAND_FAILED', input, result);
      return result;
    }
  }

  _reject(input, reason, status = 'REJECTED') {
    const commandId = text(input && input.commandId);
    const action = text(input && input.action).toUpperCase();
    const result = { commandId: commandId || null, action: action || null, status, reason, executedAt: this.now() };
    if (commandId) this._remember(commandId, result);
    this._emit(status === 'EXPIRED' ? 'CONTROL_COMMAND_EXPIRED' : 'CONTROL_COMMAND_REJECTED', input, result);
    return result;
  }

  status() {
    return {
      enabled: true,
      allowElevated: this.allowElevated,
      remembered: this.history.size,
      maxHistory: this.maxHistory,
      maxTtlMs: this.maxTtlMs,
      actions: [...COMMANDS]
    };
  }
}

module.exports = { ControlGateway, COMMANDS };
