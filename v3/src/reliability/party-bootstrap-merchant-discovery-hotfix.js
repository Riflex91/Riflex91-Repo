'use strict';

const { PARTY_BOOTSTRAP_TYPE, PARTY_BOOTSTRAP_PROTOCOL, PartyBootstrapAction } = require('../party/controlled-party-bootstrap');

class PartyBootstrapMerchantDiscoveryHotfix {
  constructor(bootstrap) {
    if (!bootstrap || typeof bootstrap.receive !== 'function') throw new Error('party bootstrap required');
    this.bootstrap = bootstrap;
    this.inferred = 0;
    this.lastInference = null;
    this._install();
  }

  _install() {
    const bootstrap = this.bootstrap;
    if (bootstrap.__merchantDiscoveryHotfixInstalled) return false;
    bootstrap.__merchantDiscoveryHotfixInstalled = true;
    const original = bootstrap.receive.bind(bootstrap);
    bootstrap.receive = (sender, data) => {
      const from = String(sender || '').trim();
      const localCharacter = bootstrap._character();
      const local = String(localCharacter && localCharacter.name || '').trim();
      const isChallenge = !!data && data.type === PARTY_BOOTSTRAP_TYPE && Number(data.protocol) === PARTY_BOOTSTRAP_PROTOCOL && data.action === PartyBootstrapAction.HELLO_CHALLENGE;
      if (isChallenge && from && local && String(data.merchantName || '') === from && String(data.target || '') === local) {
        const active = bootstrap._activeSnapshot();
        const knownMerchant = bootstrap._merchantName(active.present);
        if (active.available && active.present.length <= 4 && active.present.includes(from) && active.present.includes(local) && !knownMerchant && String(localCharacter && localCharacter.ctype || '').toLowerCase() !== 'merchant') {
          // command_character can only address another character on the same
          // account, while the send_cm fallback is still constrained by the
          // authoritative get_active_characters set. This inference therefore
          // narrows trust to an already proven owned active sender; it never
          // accepts a visible stranger as merchant authority.
          bootstrap._configureTrust(active.present, from);
          this.inferred += 1;
          this.lastInference = { at: bootstrap.now(), merchant: from, target: local };
          bootstrap._event('PARTY_BOOTSTRAP_MERCHANT_DISCOVERED', 'info', 'OWNED_MERCHANT_CHALLENGE', this.lastInference);
        }
      }
      return original(sender, data);
    };
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'owned-merchant-challenge-discovery-v1',
      inferred: this.inferred,
      lastInference: this.lastInference ? { ...this.lastInference } : null
    };
  }
}

function installPartyBootstrapMerchantDiscoveryHotfix(bootstrap) {
  return new PartyBootstrapMerchantDiscoveryHotfix(bootstrap);
}

module.exports = { PartyBootstrapMerchantDiscoveryHotfix, installPartyBootstrapMerchantDiscoveryHotfix };
