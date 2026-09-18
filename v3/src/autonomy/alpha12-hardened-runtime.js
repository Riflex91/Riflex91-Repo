'use strict';

const { Alpha12Runtime: BaseAlpha12Runtime } = require('./alpha12-runtime');
const { PartyControlLease } = require('../party/control-lease');

const ALPHA12_VERSION = '3.0.0-alpha.12.0';
const OWNED_PRESENT_STATES = new Set(['self', 'starting', 'loading', 'active', 'code']);

function activeOwnedNames(root) {
  const localCharacter = root && (root.character || (root.parent && root.parent.character));
  const localName = localCharacter && localCharacter.name ? String(localCharacter.name) : null;
  const fn = root && (root.get_active_characters || (root.parent && root.parent.get_active_characters));
  if (typeof fn !== 'function') return localName ? [localName] : [];
  try {
    const active = fn.call(root);
    if (!active || typeof active !== 'object') return localName ? [localName] : [];
    const names = Object.entries(active)
      .filter(([, state]) => OWNED_PRESENT_STATES.has(String(state)))
      .map(([name]) => String(name));
    if (localName && !names.includes(localName)) names.push(localName);
    const unique = [...new Set(names)].sort();
    return unique.length <= 4 ? unique : (localName ? [localName] : []);
  } catch (_) {
    return localName ? [localName] : [];
  }
}

function composeHardenedAlpha12Runtime(options = {}) {
this.log.version = ALPHA12_VERSION;
    const roster = this.characterRegistry.status().characters || [];
    const owned = activeOwnedNames(this.root);
    const ownedSet = new Set(owned);
    const local = this.root && (this.root.character || (this.root.parent && this.root.parent.character));
    const localMerchant = local && String(local.ctype || '').toLowerCase() === 'merchant' ? String(local.name) : null;
    const configured = options.partyMerchantName && ownedSet.has(String(options.partyMerchantName)) ? String(options.partyMerchantName) : null;
    const registryMerchant = roster.find((row) => row && row.ctype === 'merchant' && ownedSet.has(String(row.name)));
    const merchant = localMerchant || configured || (registryMerchant && registryMerchant.name) || null;
    this.partyControlLease = options.partyControlLease || new PartyControlLease({
      root: this.root,
      adapter: this.adapter,
      now: this.now,
      log: this.log,
      merchantName: merchant,
      trustedNames: owned,
      leaseMs: options.partyControlLeaseMs,
      ackTimeoutMs: options.partyControlAckTimeoutMs,
      pollMs: options.partyControlPollMs,
      maxClockSkewMs: options.partyControlMaxClockSkewMs
    });
    this.partyControlLease.install();
    this.partyTransitions.setControlLease(this.partyControlLease);
    this.syncPartyControlConfig();
}

class Alpha12Runtime extends BaseAlpha12Runtime {
  constructor(options = {}) {
    super(options);
    composeHardenedAlpha12Runtime.call(this, options);
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA12_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _activeOwnedNames() {
    return activeOwnedNames(this.root);
  }

  _partyTrustedNames() {
    const bootstrap = this.partyBootstrap;
    if (bootstrap && typeof bootstrap.trustedRosterNames === 'function') {
      const names = bootstrap.trustedRosterNames();
      if (Array.isArray(names) && names.length) return [...new Set(names.map(String))].sort();
    }
    return this._activeOwnedNames();
  }

  syncPartyControlConfig() {
    if (!this.partyControlLease) return null;
    const status = this.characterRegistry.status();
    const names = this._partyTrustedNames();
    const trusted = new Set(names);
    const local = this.root && (this.root.character || (this.root.parent && this.root.parent.character));
    const localMerchant = local && String(local.ctype || '').toLowerCase() === 'merchant' && trusted.has(String(local.name))
      ? String(local.name)
      : null;
    const bootstrapMerchant = this.partyBootstrap && this.partyBootstrap.merchantName && trusted.has(String(this.partyBootstrap.merchantName))
      ? String(this.partyBootstrap.merchantName)
      : null;
    const candidates = status.characters.filter(
      (row) => row && row.ctype === 'merchant' && trusted.has(String(row.name))
    );
    const registryMerchant = new Set(candidates.map((row) => String(row.name))).size === 1
      ? String(candidates[0].name)
      : null;
    const currentMerchant = this.partyControlLease.merchantName && trusted.has(String(this.partyControlLease.merchantName))
      ? String(this.partyControlLease.merchantName)
      : null;
    const merchantName = bootstrapMerchant || localMerchant || registryMerchant || currentMerchant || null;

    this.partyControlLease.setTrustedNames(names);
    if (this.partyTelemetry && typeof this.partyTelemetry.setTrustedNames === 'function') {
      this.partyTelemetry.setTrustedNames(names);
    }
    if (merchantName) {
      this.partyControlLease.setMerchantName(merchantName);
      this.partyTransitions.setMerchantName(merchantName);
      this.partyTelemetry.setMerchantName(merchantName);
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
    const trusted = this._partyTrustedNames();
    return {
      ...base,
      version: ALPHA12_VERSION,
      party: {
        ...(base.party || {}),
        activeOwnedNames: this._activeOwnedNames(),
        trustedPartyNames: trusted,
        trustSource: this.partyBootstrap && typeof this.partyBootstrap.trustedRosterNames === 'function'
          ? 'explicit-party-bootstrap-roster'
          : 'get_active_characters',
        controlLease: this.partyControlLease ? this.partyControlLease.status() : null,
        transition: {
          ...((base.party && base.party.transition) || {}),
          controlLeaseBound: !!(this.partyTransitions && this.partyTransitions.controlLease)
        }
      }
    };
  }
}

module.exports = { Alpha12Runtime, ALPHA12_VERSION, activeOwnedNames, composeHardenedAlpha12Runtime };
