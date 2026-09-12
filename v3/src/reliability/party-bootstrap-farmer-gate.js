'use strict';

const { TaskState } = require('../core/task');

class PartyBootstrapFarmerGate {
  constructor(runtime, bootstrap) {
    if (!runtime || !runtime.farmer || !bootstrap) throw new Error('runtime farmer and bootstrap required');
    this.runtime = runtime;
    this.bootstrap = bootstrap;
    this.stats = { gatedSteps: 0, allowedSteps: 0, merchantBypasses: 0 };
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
      const status = this.bootstrap.status();
      if (!status.ready) {
        this.stats.gatedSteps += 1;
        this.lastGate = {
          at: this.runtime.now(),
          character: character && character.name || null,
          state: status.state,
          reason: status.reason
        };
        return { state: TaskState.RUNNING, reason: 'PARTY_BOOTSTRAP_NOT_READY' };
      }
      this.stats.allowedSteps += 1;
      return original(context);
    };
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'party-bootstrap-farmer-gate-v1',
      requiresReady: true,
      lastGate: this.lastGate ? { ...this.lastGate } : null,
      stats: { ...this.stats }
    };
  }
}

function installPartyBootstrapFarmerGate(runtime, bootstrap) {
  return new PartyBootstrapFarmerGate(runtime, bootstrap);
}

module.exports = { PartyBootstrapFarmerGate, installPartyBootstrapFarmerGate };
