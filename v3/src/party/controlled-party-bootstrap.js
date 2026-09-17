'use strict';

const { GameAdapter } = require('../game/adapter');
const base = require('./controlled-party-bootstrap-base');

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function uniqueNames(values) {
  return [...new Set((values || []).map(cleanName).filter(Boolean))];
}

function resolveMerchantName(options, roster) {
  const explicit = cleanName(options.merchantName);
  if (explicit) return explicit;
  if (roster.includes('My_Merchant')) return 'My_Merchant';
  if (roster.includes('Merch')) return 'Merch';
  const root = options.root || options.runtime && options.runtime.root || globalThis;
  const local = root && (root.character || root.parent && root.parent.character);
  if (local && String(local.ctype || '').toLowerCase() === 'merchant' && roster.includes(String(local.name))) return String(local.name);
  return null;
}

function resolveRoster(options) {
  const configured = options.desiredRoster || options.roster || null;
  const configuredExplicitly = Array.isArray(configured) && configured.length > 0;
  let roster = configuredExplicitly ? uniqueNames(configured) : [];
  const root = options.root || options.runtime && options.runtime.root || globalThis;

  if (!roster.length) {
    const activeFn = root && (root.get_active_characters || root.parent && root.parent.get_active_characters);
    if (typeof activeFn === 'function') {
      try {
        const active = activeFn.call(root);
        const activeNames = active && typeof active === 'object' ? uniqueNames(Object.keys(active)) : [];
        if (activeNames.length >= 2 && activeNames.length <= 4) {
          const merchant = resolveMerchantName(options, activeNames);
          if (merchant && activeNames.includes(merchant)) roster = activeNames;
        }
      } catch (_) {}
    }
  }
  if (!roster.length) roster = uniqueNames(base.DEFAULT_PARTY_BOOTSTRAP_ROSTER);
  return { roster, configuredExplicitly };
}

function resolveCommandAdapter(options) {
  const supplied = options.adapter || options.runtime && options.runtime.adapter || null;
  if (!supplied || typeof supplied.command === 'function') return supplied;
  const root = options.root || options.runtime && options.runtime.root || globalThis;
  const now = options.now || options.runtime && options.runtime.now || (() => Date.now());
  const log = options.log || options.runtime && options.runtime.log || null;
  return new GameAdapter({
    root,
    parent: root && root.parent,
    log,
    now,
    mode: String(supplied.mode || '') === 'active' ? 'active' : 'shadow'
  });
}

class ControlledPartyBootstrap extends base.ControlledPartyBootstrap {
  constructor(options = {}) {
    const resolved = resolveRoster(options);
    const roster = resolved.roster;
    if (roster.length < 2 || roster.length > 4) throw new Error('PARTY_BOOTSTRAP_REQUIRES_TWO_TO_FOUR_TRUSTED_NAMES');
    const merchantName = resolveMerchantName(options, roster);
    if (!merchantName || !roster.includes(merchantName)) throw new Error('PARTY_BOOTSTRAP_MERCHANT_NOT_IN_ROSTER');

    const padded = roster.slice();
    let suffix = 1;
    while (padded.length < 4) {
      let placeholder = `__AIO_V3_UNUSED_TRUST_SLOT_${suffix++}__`;
      while (padded.includes(placeholder)) placeholder = `__AIO_V3_UNUSED_TRUST_SLOT_${suffix++}__`;
      padded.push(placeholder);
    }

    const adapter = resolveCommandAdapter(options);
    super({ ...options, ...(adapter ? { adapter } : {}), desiredRoster: padded, merchantName });
    this.desiredRoster = roster.slice();
    this.merchantName = merchantName;
    if (typeof this.transport.setTrustedNames === 'function') this.transport.setTrustedNames(this.desiredRoster);
    this._configureTrust();
  }

  _observe() {
    const observation = super._observe();
    observation.trustSource = 'explicit-variable-party-roster';
    this.lastObserved = observation;
    return observation;
  }

  status() {
    const status = super.status();
    status.trustSource = 'explicit-variable-party-roster';
    if (status.observed) status.observed.trustSource = 'explicit-variable-party-roster';
    return status;
  }
}

module.exports = {
  ControlledPartyBootstrap,
  PARTY_BOOTSTRAP_PROTOCOL: base.PARTY_BOOTSTRAP_PROTOCOL,
  PARTY_BOOTSTRAP_TYPE: base.PARTY_BOOTSTRAP_TYPE,
  PARTY_BOOTSTRAP_RECEIVER: base.PARTY_BOOTSTRAP_RECEIVER,
  DEFAULT_PARTY_BOOTSTRAP_ROSTER: base.DEFAULT_PARTY_BOOTSTRAP_ROSTER,
  PartyBootstrapAction: base.PartyBootstrapAction
};
