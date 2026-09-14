'use strict';

class PartyBootstrapMerchantDiscoveryHotfix {
  constructor(bootstrap) {
    if (!bootstrap || typeof bootstrap.receive !== 'function') throw new Error('party bootstrap required');
    this.bootstrap = bootstrap;
    this.inferred = 0;
    this.lastInference = null;
    this.disabledByExplicitRoster = typeof bootstrap.trustedRosterNames === 'function'
      && bootstrap.trustedRosterNames().length === 4;
  }

  status() {
    return {
      schemaVersion: 2,
      mode: 'explicit-roster-merchant-identity-v2',
      inferred: this.inferred,
      lastInference: this.lastInference ? { ...this.lastInference } : null,
      disabledByExplicitRoster: this.disabledByExplicitRoster,
      merchantName: this.bootstrap.merchantName || null
    };
  }
}

function installPartyBootstrapMerchantDiscoveryHotfix(bootstrap) {
  return new PartyBootstrapMerchantDiscoveryHotfix(bootstrap);
}

module.exports = { PartyBootstrapMerchantDiscoveryHotfix, installPartyBootstrapMerchantDiscoveryHotfix };
