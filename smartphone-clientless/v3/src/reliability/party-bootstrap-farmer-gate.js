'use strict';

const { TaskState } = require('../core/task');

class PartyBootstrapFarmerGate {
  constructor(runtime, bootstrap) {
    if (!runtime || !runtime.farmer || !bootstrap) throw new Error('runtime farmer and bootstrap required');
    this.runtime = runtime;
    this.bootstrap = bootstrap;
    this.stats = {
      gatedSteps: 0,
      allowedSteps: 0,
      merchantBypasses: 0,
      fullPartyAllows: 0,
      trustedPartialAllows: 0,
      trustedPendingAllows: 0
    };
    this.lastGate = null;
    this._install();
  }

  _trustedPendingDecision(character, decision, status) {
    const name = character && character.name ? String(character.name) : null;
    const desired = new Set(Array.isArray(status && status.desiredRoster) ? status.desiredRoster.map(String) : []);
    const observed = status && status.observed || {};
    const foreign = Array.isArray(observed.foreignPartyNames) ? observed.foreignPartyNames.filter(Boolean) : [];
    const present = Array.isArray(observed.observedPresentNames) ? observed.observedPresentNames.filter(Boolean) : [];
    const reason = String(decision && decision.reason || status && status.reason || '');

    if (!name || !desired.has(name)) return null;
    if (foreign.length) return null;
    if (present.length > 4 || reason === 'ACTIVE_CHARACTER_LIMIT_EXCEEDED') return null;
    if (reason === 'LOCAL_CHARACTER_NOT_IN_TRUSTED_ROSTER') return null;

    return {
      allowed: true,
      reason: 'TRUSTED_ROSTER_BOOTSTRAP_PENDING',
      full: false
    };
  }

  _install() {
    const farmer = this.runtime.farmer;
    if (farmer.__partyBootstrapGateInstalled || typeof farmer.step !== 'function') return false;
    farmer.__partyBootstrapGateInstalled = true;
    const original = farmer.step.bind(farmer);
    farmer.step = (context = {}) => {
      const snapshot = context.snapshot || this.runtime.lastSnapshot;
      const character = snapshot && snapshot.character;
      const isMerchant = String(character && character.ctype || '').toLowerCase() === 'merchant';
      if (isMerchant) {
        this.stats.merchantBypasses += 1;
        return original(context);
      }

      const status = this.bootstrap.status();
      let decision = typeof this.bootstrap.farmingGate === 'function'
        ? this.bootstrap.farmingGate(character && character.name)
        : { allowed: !!status.ready, reason: status.reason };

      if (!decision.allowed) {
        const trustedPending = this._trustedPendingDecision(character, decision, status);
        if (trustedPending) decision = trustedPending;
      }

      if (!decision.allowed) {
        this.stats.gatedSteps += 1;
        this.lastGate = {
          at: this.runtime.now(),
          character: character && character.name || null,
          state: status.state,
          reason: decision.reason || status.reason,
          full: decision.full === true
        };
        return { state: TaskState.RUNNING, reason: 'PARTY_BOOTSTRAP_NOT_READY' };
      }

      this.stats.allowedSteps += 1;
      if (decision.full) this.stats.fullPartyAllows += 1;
      if (decision.reason === 'SAFE_TRUSTED_PARTIAL_PARTY') this.stats.trustedPartialAllows += 1;
      if (decision.reason === 'TRUSTED_ROSTER_BOOTSTRAP_PENDING') this.stats.trustedPendingAllows += 1;
      this.lastGate = {
        at: this.runtime.now(),
        character: character && character.name || null,
        state: status.state,
        reason: decision.reason,
        full: decision.full === true,
        allowed: true
      };
      return original(context);
    };
    return true;
  }

  status() {
    return {
      schemaVersion: 3,
      mode: 'party-bootstrap-farmer-isolation-v3',
      requiresReady: false,
      policy: 'trusted-roster-farming-isolated-from-bootstrap-liveness; foreign-or-ambiguous-party-state-fails-closed',
      lastGate: this.lastGate ? { ...this.lastGate } : null,
      stats: { ...this.stats }
    };
  }
}

function installPartyBootstrapFarmerGate(runtime, bootstrap) {
  return new PartyBootstrapFarmerGate(runtime, bootstrap);
}

module.exports = { PartyBootstrapFarmerGate, installPartyBootstrapFarmerGate };
