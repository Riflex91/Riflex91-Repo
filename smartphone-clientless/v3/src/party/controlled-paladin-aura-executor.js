'use strict';

const { AURAS } = require('./paladin-aura-policy');

const CONTROLLED_PALADIN_AURA_MODE = 'controlled-live-default-off';
const CONTROLLED_PALADIN_AURA_ACK = 'ALPHA20_PALADIN_AURA';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

class ControlledPaladinAuraExecutor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.adapter = options.adapter;
    this.auraPolicy = options.auraPolicy;
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'UNKNOWN' }));
    this.getEconomyEmergency = options.getEconomyEmergency || (() => false);
    this.enabled = false;
    this.lastResult = null;
    this.stats = { attempts: 0, changed: 0, rejected: 0 };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'paladin-aura-controlled', event, data, severity, reason });
  }

  _character() { return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null; }

  configure(config = {}) {
    if (config.enabled !== true) return this.disable(config.reason || 'OPERATOR_DISABLED');
    if (config.ack !== CONTROLLED_PALADIN_AURA_ACK) {
      this.stats.rejected += 1;
      this.disable('WRONG_ACK');
      return { ...this.status(), enableRejected: 'WRONG_ACK' };
    }
    this.enabled = true;
    return this.status();
  }

  disable(reason = 'DISABLED') {
    this.enabled = false;
    this._event('PALADIN_AURA_CONTROL_DISABLED', {}, 'info', reason);
    return this.status();
  }

  execute(recommendation, context = {}) {
    const character = this._character();
    const supervisor = this.getSupervisorStatus() || {};
    const reasons = [];
    if (!this.enabled) reasons.push('CONTROLLED_PALADIN_AURA_DISABLED');
    if (this.getMode() !== 'active') reasons.push('RUNTIME_NOT_ACTIVE');
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reasons.push('SUPERVISOR_NOT_HEALTHY');
    if (!character || character.ctype !== 'paladin') reasons.push('LOCAL_PALADIN_REQUIRED');
    if (!character || Number(character.level) < 60) reasons.push('PALADIN_LEVEL_TOO_LOW');
    if (context.inCombat === true || context.highRisk === true || context.emergency === true) reasons.push('UNSAFE_AURA_SWITCH_CONTEXT');
    if (this.getEconomyEmergency() === true) reasons.push('ECONOMY_EMERGENCY');
    const aura = recommendation && recommendation.aura;
    if (!AURAS.includes(aura)) reasons.push('INVALID_AURA');
    if (recommendation && recommendation.canSwitch === false) reasons.push('AURA_HYSTERESIS_HOLD');
    if (this.auraPolicy && this.auraPolicy.lastAura === aura) reasons.push('AURA_ALREADY_ACTIVE');
    if (!this.adapter || typeof this.adapter.command !== 'function') reasons.push('ADAPTER_UNAVAILABLE');
    if (reasons.length) {
      this.stats.rejected += 1;
      this.lastResult = { at: this.now(), executed: false, aura: aura || null, reason: reasons[0], reasons };
      return { ...this.lastResult };
    }

    this.stats.attempts += 1;
    const result = this.adapter.command('use_skill', ['paladin_aura', aura]);
    this.lastResult = { at: this.now(), aura, executed: !!(result && result.executed), reason: result && result.reason || null, shadow: !!(result && result.shadow) };
    if (this.lastResult.executed) {
      if (this.auraPolicy && typeof this.auraPolicy.noteApplied === 'function') this.auraPolicy.noteApplied(aura);
      this.stats.changed += 1;
      this._event('PALADIN_AURA_CONTROLLED_CHANGED', { aura, recommendation });
    }
    return { ...this.lastResult };
  }

  status() {
    return {
      mode: CONTROLLED_PALADIN_AURA_MODE,
      requiredAck: CONTROLLED_PALADIN_AURA_ACK,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      directGameplayActionAccess: false,
      oneAuraPerParty: true,
      allowedAuras: AURAS.slice(),
      lastResult: this.lastResult ? { ...this.lastResult } : null,
      stats: { ...this.stats }
    };
  }
}

module.exports = { ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_MODE, CONTROLLED_PALADIN_AURA_ACK };
