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
      trustedPartialAllows: 0
    };
    this.lastGate = null;
    this._install();
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

      const decision = typeof this.bootstrap.farmingGate === 'function'
        ? this.bootstrap.farmingGate(character && character.name)
        : { allowed: !!this.bootstrap.status().ready, reason: this.bootstrap.status().reason };

      if (!decision.allowed) {
        this.stats.gatedSteps += 1;
        this.lastGate = {
          at: this.runtime.now(),
          character: character && character.name || null,
          state: this.bootstrap.status().state,
          reason: decision.reason || this.bootstrap.status().reason,
          full: decision.full === true
        };
        return { state: TaskState.RUNNING, reason: 'PARTY_BOOTSTRAP_NOT_READY' };
      }

      this.stats.allowedSteps += 1;
      if (decision.full) this.stats.fullPartyAllows += 1;
      if (decision.reason === 'SAFE_TRUSTED_PARTIAL_PARTY') this.stats.trustedPartialAllows += 1;
      this.lastGate = {
        at: this.runtime.now(),
        character: character && character.name || null,
        state: this.bootstrap.status().state,
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
      schemaVersion: 2,
      mode: 'party-bootstrap-farmer-gate-v2',
      requiresReady: false,
      policy: 'full-trusted-party-or-trusted-merchant-partial-repair-window',
      lastGate: this.lastGate ? { ...this.lastGate } : null,
      stats: { ...this.stats }
    };
  }
}

function installPartyBootstrapFarmerGate(runtime, bootstrap) {
  return new PartyBootstrapFarmerGate(runtime, bootstrap);
}

module.exports = { PartyBootstrapFarmerGate, installPartyBootstrapFarmerGate };
