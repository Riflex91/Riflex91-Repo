'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');

class Alpha27AtomicCore {
  constructor(runtime, shared) {
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = shared.now;
    this.log = shared.log;
    this.options = shared.options;
    this.stats = shared.stats;
    this.merchantBusy = false;
    this.serviceTravelBusy = false;
    this.lastMerchantAction = null;
    this.mutationRiskHolds = new Map();
    this.lastMutationRiskDecision = null;
    this.patchInventoryLedger();
    this.patchTransactionEngine();
    this.patchControlledMerchant();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha27-convergence', event, severity, reason, data }); } catch (_) {}
  }

  supervisorAllowed() {
    try {
      const status = this.runtime.globalSupervisor && this.runtime.globalSupervisor.status ? this.runtime.globalSupervisor.status() : { state: 'HEALTHY' };
      return SUPERVISOR_ALLOWED.has(String(status && status.state || ''));
    } catch (_) { return false; }
  }

  merchantActive() {
    const c = characterOf(this.runtime);
    return !!(c && String(c.ctype || c.type || '').toLowerCase() === 'merchant' && !c.rip && !c.dead && this.runtime.adapter && String(this.runtime.adapter.mode) === 'active');
  }

  merchantInCombat() {
    const c = characterOf(this.runtime);
    if (!c) return true;
    if (c.target) return true;
    const parent = this.root && this.root.parent || this.root;
    return Object.values(parent && parent.entities || {}).some((entity) => entity && entity.mtype && !entity.dead && String(entity.target || '') === String(c.name || ''));
  }
}

module.exports = { Alpha27AtomicCore };
