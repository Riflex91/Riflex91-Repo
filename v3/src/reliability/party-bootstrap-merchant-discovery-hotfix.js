'use strict';

const base = require('./party-bootstrap-merchant-discovery-hotfix-base');

class PartyBootstrapMerchantDiscoveryHotfix extends base.PartyBootstrapMerchantDiscoveryHotfix {
  constructor(bootstrap) {
    super(bootstrap);
    const trusted = typeof bootstrap.trustedRosterNames === 'function' ? bootstrap.trustedRosterNames() : [];
    this.disabledByExplicitRoster = trusted.length >= 2
      && trusted.length <= 4
      && !!bootstrap.merchantName
      && trusted.includes(bootstrap.merchantName);
  }
}

module.exports = { PartyBootstrapMerchantDiscoveryHotfix };
