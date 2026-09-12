'use strict';

const { Alpha12Runtime: BaseAlpha12Runtime } = require('./alpha12-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { PartyControlLease } = require('../party/control-lease');

class Alpha12Runtime extends BaseAlpha12Runtime {
  constructor(options = {}) {
    super(options);
    const roster = this.characterRegistry.status().characters || [];
    const merchant = options.partyMerchantName || roster.find((row) => row.ctype === 'merchant')?.name || this.partyTransitions.merchantName || null;
    this.partyControlLease = options.partyControlLease || new PartyControlLease({
      root: this.root,
      now: this.now,
      log: this.log,
      merchantName: merchant,
      trustedNames: roster.map((row) => row.name),
      leaseMs: options.partyControlLeaseMs,
      ackTimeoutMs: options.partyControlAckTimeoutMs,
      pollMs: options.partyControlPollMs,
      maxClockSkewMs: options.partyControlMaxClockSkewMs
    });
    this.partyControlLease.install();
    this.partyTransitions.setControlLease(this.partyControlLease);
    this.syncPartyControlConfig();
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${RELEASE_VERSION}]`);
    return super._announce(normalized, event);
  }

  syncPartyControlConfig() {
    if (!this.partyControlLease) return null;
    const status = this.characterRegistry.status();
    const names = status.characters.map((row) => row.name);
    const merchant = status.characters.find((row) => row.ctype === 'merchant');
    this.partyControlLease.setTrustedNames(names);
    if (merchant) {
      this.partyControlLease.setMerchantName(merchant.name);
      this.partyTransitions.setMerchantName(merchant.name);
      this.partyTelemetry.setMerchantName(merchant.name);
    }
    return this.partyControlLease.status();
  }

  _partyDecisionCycle() {
    this.syncPartyControlConfig();
    return super._partyDecisionCycle();
  }

  start() {
    if (this.partyControlLease && !this.partyControlLease.installed) this.partyControlLease.install();
    return super.start();
  }

  stop() {
    if (this.backgroundExecution && typeof this.backgroundExecution.stop === 'function') this.backgroundExecution.stop();
    if (this.partyControlLease) this.partyControlLease.uninstall();
    return super.stop();
  }

  setPartyTransitionsEnabled(enabled) {
    this.syncPartyControlConfig();
    return super.setPartyTransitionsEnabled(enabled);
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: RELEASE_VERSION,
      party: {
        ...(base.party || {}),
        controlLease: this.partyControlLease ? this.partyControlLease.status() : null,
        transition: {
          ...((base.party && base.party.transition) || {}),
          controlLeaseBound: !!(this.partyTransitions && this.partyTransitions.controlLease)
        }
      }
    };
  }
}

module.exports = { Alpha12Runtime };
