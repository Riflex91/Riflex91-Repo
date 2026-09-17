'use strict';

const { GameAdapter } = require('../game/adapter');

const TransitionState = Object.freeze({
  IDLE: 'IDLE',
  PREFLIGHT: 'PREFLIGHT',
  STOPPING: 'STOPPING',
  STARTING: 'STARTING',
  PARTYING: 'PARTYING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
  RECOVERING: 'RECOVERING',
  RECOVERED: 'RECOVERED',
  FAILED_SAFE: 'FAILED_SAFE'
});

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function namesOf(members) {
  return (members || [])
    .map((member) => typeof member === 'string' ? member : member && member.name)
    .filter(Boolean)
    .map(String);
}

class PartyTransitionController {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: this.root && this.root.parent, log: this.log, now: this.now, mode: 'active' });
    this.liveEnabled = options.liveEnabled === true;
    this.merchantName = options.merchantName || null;
    this.codeSlots = { ...(options.codeSlots || {}) };
    this.controlLease = options.controlLease || null;
    this.stepTimeoutMs = Math.max(3000, Math.min(120000, Number(options.stepTimeoutMs) || 20000));
    this.transitionLeaseMs = Math.max(15000, Math.min(10 * 60 * 1000, Number(options.transitionLeaseMs) || 90000));
    this.pollMs = Math.max(100, Math.min(5000, Number(options.pollMs) || 500));
    this.state = TransitionState.IDLE;
    this.active = null;
    this.lastResult = null;
    this.history = [];
    this.historyCapacity = Math.max(10, Math.min(100, Number(options.historyCapacity) || 30));
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'party-transition', event, severity, reason, data });
    }
  }

  setLiveEnabled(enabled) {
    this.liveEnabled = enabled === true;
    return this.liveEnabled;
  }

  setMerchantName(name) {
    this.merchantName = name ? String(name) : null;
    if (this.controlLease && typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(this.merchantName);
    return this.merchantName;
  }

  setCodeSlots(slots) {
    this.codeSlots = { ...(slots || {}) };
    return { ...this.codeSlots };
  }

  setControlLease(controlLease) {
    this.controlLease = controlLease || null;
    if (this.controlLease && typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(this.merchantName);
    return !!this.controlLease;
  }

  _readFunction(name) {
    return this.root && (this.root[name] || (this.root.parent && this.root.parent[name])) || null;
  }

  _localCharacter() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _activeCharacters() {
    const fn = this._readFunction('get_active_characters');
    if (typeof fn !== 'function') return null;
    try {
      const value = fn.call(this.root);
      return value && typeof value === 'object' ? value : null;
    } catch (_) {
      return null;
    }
  }

  _partyNames() {
    const parent = this.root && (this.root.parent || this.root);
    return Object.keys(parent && parent.party || {});
  }

  _isPresentState(value) {
    return ['self', 'starting', 'loading', 'active', 'code'].includes(String(value));
  }

  _isRunningState(value) {
    return ['self', 'active', 'code'].includes(String(value));
  }

  _controlLeaseStatus() {
    if (!this.controlLease || typeof this.controlLease.status !== 'function') return null;
    try { return this.controlLease.status(); } catch (_) { return null; }
  }

  preflight(plan, context = {}) {
    const local = this._localCharacter();
    const targetNames = namesOf(plan && plan.members);
    const currentNames = namesOf(context.currentMembers);
    const desiredMerchant = plan && plan.merchant && plan.merchant.name || this.merchantName;
    const registry = context.registryStatus || { characters: [] };
    const byName = new Map((registry.characters || []).map((entry) => [entry.name, entry]));
    const slotRequired = [...new Set(currentNames.concat(targetNames))].filter((name) => name !== desiredMerchant);
    const missingSlots = slotRequired.filter((name) => !this.codeSlots[name]);
    const unsafeOutgoing = currentNames
      .filter((name) => name !== desiredMerchant)
      .map((name) => byName.get(name))
      .filter((row) => row && (
        row.dead ||
        row.available !== true ||
        (row.stats && row.stats.hp != null && row.stats.max_hp > 0 && row.stats.hp / row.stats.max_hp < 0.6)
      ));
    const reasons = [];

    if (!this.liveEnabled) reasons.push('TRANSITIONS_DISABLED');
    if (context.runtimeMode !== 'active') reasons.push('RUNTIME_NOT_ACTIVE');
    if (!local || !desiredMerchant || local.name !== desiredMerchant) reasons.push('MERCHANT_CONTROLLER_REQUIRED');
    if (context.inCombat) reasons.push('ACTIVE_COMBAT');
    if (context.emergency) reasons.push('EMERGENCY_RECOVERY');
    if (!targetNames.includes(desiredMerchant)) reasons.push('MERCHANT_MUST_REMAIN');
    if (targetNames.length !== 4) reasons.push('PARTY_SIZE_MUST_BE_FOUR');
    if (new Set(targetNames).size !== targetNames.length) reasons.push('DUPLICATE_CHARACTER_NAME');
    if (missingSlots.length) reasons.push('MISSING_CODE_SLOT');
    if (unsafeOutgoing.length) reasons.push('UNSAFE_OUTGOING_CHARACTER');
    const active = this._activeCharacters();
    if (!active) reasons.push('ACTIVE_CHARACTER_STATE_UNAVAILABLE');
    if (context.requiresCrossMapRouting) reasons.push('CROSS_MAP_ROUTING_NOT_ALLOWED');

    const control = this._controlLeaseStatus();
    if (this.controlLease) {
      if (!control || control.installed !== true) reasons.push('PARTY_CONTROL_LEASE_NOT_READY');
      if (control && control.merchantName !== desiredMerchant) reasons.push('PARTY_CONTROL_MERCHANT_MISMATCH');
    }

    return {
      allowed: reasons.length === 0,
      reasons,
      targetNames,
      currentNames,
      merchantName: desiredMerchant,
      missingSlots,
      activeCharacters: active,
      controlLease: control
    };
  }

  async _waitUntil(predicate, timeoutMs, reason) {
    const started = this.now();
    while (this.now() - started <= timeoutMs) {
      try {
        if (predicate()) return true;
      } catch (_) {}
      await sleep(this.pollMs);
    }
    throw new Error(reason || 'TRANSITION_STEP_TIMEOUT');
  }

  _command(action, args = [], unavailableReason = 'COMMAND_UNAVAILABLE') {
    if (!this.adapter || typeof this.adapter.command !== 'function') throw new Error('GAME_ADAPTER_UNAVAILABLE');
    if (typeof this.adapter.canCommand === 'function' && !this.adapter.canCommand(action)) throw new Error(unavailableReason);
    const command = this.adapter.command(action, args);
    if (!command.executed) throw new Error(command.reason || (command.shadow ? 'RUNTIME_NOT_ACTIVE' : unavailableReason));
    return command.value;
  }

  async _stop(name) {
    await Promise.resolve(this._command('stop_character', [name], 'STOP_CHARACTER_UNAVAILABLE'));
    await this._waitUntil(() => {
      const active = this._activeCharacters();
      return active && !this._isPresentState(active[name]);
    }, this.stepTimeoutMs, `STOP_VERIFY_TIMEOUT:${name}`);
  }

  async _start(name) {
    const slot = this.codeSlots[name];
    if (!slot) throw new Error(`MISSING_CODE_SLOT:${name}`);
    await Promise.resolve(this._command('start_character', [name, slot], 'START_CHARACTER_UNAVAILABLE'));
    await this._waitUntil(() => {
      const active = this._activeCharacters();
      return active && this._isRunningState(active[name]);
    }, this.stepTimeoutMs, `START_VERIFY_TIMEOUT:${name}`);
  }

  async _authorizeInvite(name, transactionId) {
    if (!this.controlLease || typeof this.controlLease.authorizeIncoming !== 'function') return { authorized: true, legacy: true };
    return this.controlLease.authorizeIncoming(name, transactionId);
  }

  async _invite(name, transactionId) {
    await this._authorizeInvite(name, transactionId);
    await Promise.resolve(this._command('send_party_invite', [name], 'PARTY_INVITE_UNAVAILABLE'));
  }

  async _recover(oldNames, newStarted, merchantName, transactionId) {
    this.state = TransitionState.RECOVERING;
    this._event('PARTY_SWITCH_RECOVERY', { oldNames, newStarted }, 'warn');

    for (const name of newStarted.slice().reverse()) {
      if (name === merchantName || oldNames.includes(name)) continue;
      try { await this._stop(name); } catch (_) {}
    }

    for (const name of oldNames) {
      if (name === merchantName) continue;
      const active = this._activeCharacters();
      if (active && this._isRunningState(active[name])) continue;
      try {
        await this._start(name);
      } catch (error) {
        this.state = TransitionState.FAILED_SAFE;
        return {
          recovered: false,
          reason: `ROLLBACK_START_FAILED:${name}`,
          error: String(error && error.message || error)
        };
      }
    }

    try {
      for (const name of oldNames) {
        if (name === merchantName || this._partyNames().includes(name)) continue;
        await this._invite(name, `${transactionId}:rollback`);
      }
      await this._waitUntil(() => {
        const party = new Set(this._partyNames().concat(merchantName));
        return oldNames.every((name) => party.has(name));
      }, this.stepTimeoutMs, 'ROLLBACK_PARTY_VERIFY_TIMEOUT');
    } catch (error) {
      this.state = TransitionState.FAILED_SAFE;
      return {
        recovered: false,
        reason: 'ROLLBACK_PARTY_FAILED',
        error: String(error && error.message || error)
      };
    }

    this.state = TransitionState.RECOVERED;
    return { recovered: true };
  }

  async execute(plan, context = {}) {
    if (this.active) return { executed: false, reason: 'TRANSITION_ALREADY_RUNNING' };
    this.state = TransitionState.PREFLIGHT;
    const preflight = this.preflight(plan, context);
    if (!preflight.allowed) {
      this.state = TransitionState.ABORTED;
      const result = {
        executed: false,
        state: this.state,
        reason: preflight.reasons[0],
        reasons: preflight.reasons,
        preflight
      };
      this._finish(result);
      this._event('PARTY_SWITCH_SUPPRESSED', { reasons: preflight.reasons }, 'warn', preflight.reasons[0]);
      return result;
    }

    const transaction = {
      id: `party-transition-${this.now()}`,
      startedAt: this.now(),
      targetNames: preflight.targetNames,
      oldNames: preflight.currentNames,
      stopped: [],
      started: []
    };
    this.active = transaction;
    this._event('PARTY_SWITCH_STARTED', { id: transaction.id, from: transaction.oldNames, to: transaction.targetNames });

    try {
      const deadline = transaction.startedAt + this.transitionLeaseMs;
      const target = new Set(transaction.targetNames);
      const outgoing = transaction.oldNames.filter((name) => name !== preflight.merchantName && !target.has(name));
      const incoming = transaction.targetNames.filter((name) => name !== preflight.merchantName && !transaction.oldNames.includes(name));

      this.state = TransitionState.STOPPING;
      for (const name of outgoing) {
        if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
        await this._stop(name);
        transaction.stopped.push(name);
      }

      this.state = TransitionState.STARTING;
      for (const name of incoming) {
        if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
        await this._start(name);
        transaction.started.push(name);
      }

      this.state = TransitionState.PARTYING;
      for (const name of transaction.targetNames) {
        if (name === preflight.merchantName) continue;
        if (!this._partyNames().includes(name)) {
          if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
          try {
            await this._invite(name, transaction.id);
          } catch (error) {
            throw new Error(`PARTY_INVITE_FAILED:${name}:${String(error && error.message || error)}`);
          }
        }
      }

      this.state = TransitionState.VERIFYING;
      await this._waitUntil(() => {
        const active = this._activeCharacters();
        if (!active) return false;
        const activeOk = transaction.targetNames.every((name) => name === preflight.merchantName || this._isRunningState(active[name]));
        const party = new Set(this._partyNames().concat(preflight.merchantName));
        const partyOk = transaction.targetNames.every((name) => party.has(name));
        const stateOk = typeof context.verifyTargetState === 'function'
          ? context.verifyTargetState(transaction.targetNames) === true
          : true;
        return activeOk && partyOk && stateOk;
      }, Math.min(this.stepTimeoutMs, Math.max(this.pollMs, deadline - this.now())), 'POSTCONDITION_VERIFY_TIMEOUT');

      if (this.now() > deadline) throw new Error('TRANSITION_LEASE_EXPIRED');
      this.state = TransitionState.COMPLETED;
      const result = {
        executed: true,
        state: this.state,
        id: transaction.id,
        from: transaction.oldNames,
        to: transaction.targetNames,
        durationMs: this.now() - transaction.startedAt
      };
      this._finish(result);
      this._event('PARTY_SWITCH_COMPLETED', result);
      return result;
    } catch (error) {
      this.state = TransitionState.ABORTED;
      const reason = String(error && error.message || error);
      this._event('PARTY_SWITCH_ABORTED', { id: transaction.id, reason }, 'error', reason);
      const recovery = await this._recover(transaction.oldNames, transaction.started, preflight.merchantName, transaction.id);
      const result = {
        executed: false,
        state: this.state,
        id: transaction.id,
        reason,
        recovery,
        durationMs: this.now() - transaction.startedAt
      };
      this._finish(result);
      return result;
    }
  }

  _finish(result) {
    this.lastResult = result;
    this.history.push(result);
    if (this.history.length > this.historyCapacity) this.history.splice(0, this.history.length - this.historyCapacity);
    this.active = null;
  }

  status() {
    return {
      liveEnabled: this.liveEnabled,
      state: this.state,
      merchantName: this.merchantName,
      transitionLeaseMs: this.transitionLeaseMs,
      stepTimeoutMs: this.stepTimeoutMs,
      configuredCodeSlots: Object.keys(this.codeSlots).sort(),
      controlLeaseBound: !!this.controlLease,
      controlLease: this._controlLeaseStatus(),
      crossMapRoutingAllowed: false,
      serverChangeAllowed: false,
      smartMoveAllowed: false,
      active: this.active ? { ...this.active } : null,
      lastResult: this.lastResult,
      recent: this.history.slice(-10)
    };
  }
}

module.exports = { PartyTransitionController, TransitionState };
