'use strict';

const { GameAdapter } = require('../game/adapter');
const base = require('./controlled-party-bootstrap-base');
const { DynamicPartyRosterDiscovery } = require('./dynamic-party-roster-discovery');

const PENDING_MERCHANT = '__AIO_V3_PENDING_MERCHANT__';
const PENDING_COMBAT = '__AIO_V3_PENDING_COMBAT__';

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function uniqueNames(values) {
  return [...new Set((values || []).map(cleanName).filter(Boolean))];
}

function localCharacter(options) {
  const root = options.root || options.runtime && options.runtime.root || globalThis;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function resolveMerchantName(options, roster) {
  const explicit = cleanName(options.merchantName);
  if (explicit) return explicit;
  const local = localCharacter(options);
  if (local && String(local.ctype || local.type || '').toLowerCase() === 'merchant' && roster.includes(String(local.name))) {
    return String(local.name);
  }
  if (roster.includes('My_Merchant')) return 'My_Merchant';
  if (roster.includes('Merch')) return 'Merch';
  return null;
}

function explicitRoster(options) {
  const configured = options.desiredRoster || options.roster || null;
  if (!Array.isArray(configured) || !configured.length) return null;
  const roster = uniqueNames(configured);
  if (roster.length < 2 || roster.length > 4) throw new Error('PARTY_BOOTSTRAP_REQUIRES_TWO_TO_FOUR_TRUSTED_NAMES');
  const merchantName = resolveMerchantName(options, roster);
  if (!merchantName || !roster.includes(merchantName)) throw new Error('PARTY_BOOTSTRAP_MERCHANT_NOT_IN_ROSTER');
  return { roster, merchantName };
}

function provisionalDynamicRoster(options, discoveryStatus) {
  const local = localCharacter(options);
  const observed = uniqueNames((discoveryStatus && discoveryStatus.roster || []).map((row) => row && row.name));
  const localName = cleanName(local && local.name);
  if (localName && !observed.includes(localName)) observed.push(localName);

  let merchantName = cleanName(discoveryStatus && discoveryStatus.merchantName);
  if (!merchantName && local && String(local.ctype || local.type || '').toLowerCase() === 'merchant') merchantName = localName;
  if (!merchantName) merchantName = PENDING_MERCHANT;
  if (!observed.includes(merchantName)) observed.unshift(merchantName);
  if (observed.length < 2) observed.push(PENDING_COMBAT);
  return { roster: uniqueNames(observed).slice(0, 4), merchantName };
}

function padForLegacyBase(roster) {
  const padded = uniqueNames(roster);
  let suffix = 1;
  while (padded.length < 4) {
    let placeholder = `__AIO_V3_UNUSED_TRUST_SLOT_${suffix++}__`;
    while (padded.includes(placeholder)) placeholder = `__AIO_V3_UNUSED_TRUST_SLOT_${suffix++}__`;
    padded.push(placeholder);
  }
  return padded.slice(0, 4);
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
    const explicit = explicitRoster(options);
    const discovery = explicit ? null : new DynamicPartyRosterDiscovery({
      runtime: options.runtime,
      root: options.root,
      now: options.now,
      settleMs: options.discoverySettleMs
    });
    const initialDiscovery = discovery ? discovery.refresh() : null;
    const resolved = explicit || (initialDiscovery && initialDiscovery.ready
      ? {
        roster: initialDiscovery.roster.map((row) => row.name),
        merchantName: initialDiscovery.merchantName
      }
      : provisionalDynamicRoster(options, initialDiscovery));

    const adapter = resolveCommandAdapter(options);
    super({
      ...options,
      ...(adapter ? { adapter } : {}),
      desiredRoster: padForLegacyBase(resolved.roster),
      merchantName: resolved.merchantName
    });

    this.dynamicRosterDiscovery = discovery;
    this.dynamicRosterManaged = !!discovery;
    this.dynamicRosterReady = !discovery;
    this.dynamicRosterSignature = null;
    this.dynamicRosterLastAppliedAt = null;
    this.dynamicRosterReconfigurations = 0;
    this.dynamicRosterPendingReason = null;

    if (this.dynamicRosterManaged) {
      const safeObservedNames = uniqueNames((initialDiscovery && initialDiscovery.roster || []).map((row) => row && row.name));
      const local = localCharacter(options);
      const localName = cleanName(local && local.name);
      if (localName && !safeObservedNames.includes(localName)) safeObservedNames.push(localName);
      this.desiredRoster = safeObservedNames.slice(0, 4);
      if (initialDiscovery && initialDiscovery.merchantName) this.merchantName = initialDiscovery.merchantName;
      if (typeof this.transport.setTrustedNames === 'function') this.transport.setTrustedNames(this.desiredRoster);
      if (initialDiscovery && initialDiscovery.ready) this._applyDynamicRoster(initialDiscovery);
      else this.dynamicRosterPendingReason = initialDiscovery && initialDiscovery.reason || 'DYNAMIC_ROSTER_DISCOVERY_PENDING';
    } else {
      this.desiredRoster = explicit.roster.slice();
      this.merchantName = explicit.merchantName;
      if (typeof this.transport.setTrustedNames === 'function') this.transport.setTrustedNames(this.desiredRoster);
      this._configureTrust();
    }
  }

  _discoverySignature(status) {
    if (!status || status.ready !== true) return null;
    return (status.roster || []).map((row) => `${row.name}:${row.ctype || ''}`).join('|');
  }

  _seedRegistry(status) {
    if (!this.runtime || !this.runtime.characterRegistry || typeof this.runtime.characterRegistry.seedRoster !== 'function') return false;
    try {
      this.runtime.characterRegistry.seedRoster((status.roster || []).map((row) => ({
        name: row.name,
        ctype: row.ctype,
        online: true
      })));
      return true;
    } catch (_) {
      return false;
    }
  }

  _applyDynamicRoster(status) {
    if (!this.dynamicRosterManaged || !status || status.ready !== true) return false;
    const roster = uniqueNames((status.roster || []).map((row) => row && row.name));
    const merchantName = cleanName(status.merchantName);
    if (roster.length < 2 || roster.length > 4 || !merchantName || !roster.includes(merchantName)) return false;

    const signature = this._discoverySignature(status);
    if (this.inFlight && signature !== this.dynamicRosterSignature) {
      this.dynamicRosterReady = false;
      this.dynamicRosterPendingReason = 'DYNAMIC_ROSTER_RECONFIGURATION_WAITING_FOR_IDLE';
      return false;
    }

    const changed = signature !== this.dynamicRosterSignature;
    if (changed && this.dynamicRosterSignature) this.dynamicRosterReconfigurations += 1;
    if (changed && this.active) this.generation += 1;

    this.desiredRoster = roster;
    this.merchantName = merchantName;
    this.dynamicRosterSignature = signature;
    this.dynamicRosterReady = true;
    this.dynamicRosterPendingReason = null;
    this.dynamicRosterLastAppliedAt = this.now();

    if (typeof this.transport.setTrustedNames === 'function') this.transport.setTrustedNames(this.desiredRoster);
    if (this.controlLease) {
      if (typeof this.controlLease.setTrustedNames === 'function') this.controlLease.setTrustedNames(this.desiredRoster);
      if (typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(this.merchantName);
    }

    if (changed) {
      this.pendingChallenges.clear();
      this.acknowledged.clear();
      this.attempts.clear();
      this.nextAttemptAt.clear();
      this.breakerUntil = 0;
      this._seedRegistry(status);
      this._event('DYNAMIC_PARTY_ROSTER_CONVERGED', 'info', 'DYNAMIC_ROSTER_READY', {
        merchantName: this.merchantName,
        desiredRoster: this.desiredRoster.slice(),
        signature
      });
    }
    return true;
  }

  _refreshDynamicRoster() {
    if (!this.dynamicRosterManaged) return null;
    const status = this.dynamicRosterDiscovery.refresh();
    if (status.ready === true) {
      if (!this._applyDynamicRoster(status)) {
        return {
          ...status,
          ready: false,
          reason: this.dynamicRosterPendingReason || 'DYNAMIC_ROSTER_RECONFIGURATION_PENDING'
        };
      }
      return status;
    }
    this.dynamicRosterReady = false;
    this.dynamicRosterPendingReason = status.reason;
    return status;
  }

  _pendingObservation(discoveryStatus) {
    const local = cleanName(this._character() && this._character().name);
    const partyNames = this._partyNames();
    const roster = uniqueNames((discoveryStatus && discoveryStatus.roster || []).map((row) => row && row.name));
    return {
      at: this.now(),
      local,
      merchant: discoveryStatus && discoveryStatus.merchantName || null,
      trustSource: 'dynamic-account-online-roster-pending',
      desiredRoster: roster,
      activeStateAvailable: !!(discoveryStatus && discoveryStatus.activeStateAvailable),
      observedPresentNames: discoveryStatus && discoveryStatus.observedActiveNames || [],
      observedRunningNames: discoveryStatus && discoveryStatus.observedActiveNames || [],
      observedRunningDesired: [],
      runtimeLivenessVerified: false,
      readinessScope: 'account-roster-discovery',
      partyNames,
      foreignPartyNames: [],
      missingDesired: roster.filter((name) => !partyNames.includes(name)),
      leader: this._observableLeader(),
      leaderObserved: !!this._observableLeader(),
      leaderWrong: false,
      full: false,
      discoveryReason: discoveryStatus && discoveryStatus.reason || 'DYNAMIC_ROSTER_DISCOVERY_PENDING'
    };
  }

  resume() {
    const discoveryStatus = this._refreshDynamicRoster();
    const result = super.resume();
    if (this.dynamicRosterManaged && (!discoveryStatus || discoveryStatus.ready !== true || !this.dynamicRosterReady)) {
      this.lastObserved = this._pendingObservation(discoveryStatus);
      this._setState('DISCOVERING', discoveryStatus && discoveryStatus.reason || this.dynamicRosterPendingReason || 'DYNAMIC_ROSTER_DISCOVERY_PENDING', false);
    }
    return result;
  }

  tick() {
    if (this.dynamicRosterManaged) {
      const discoveryStatus = this._refreshDynamicRoster();
      if (!discoveryStatus || discoveryStatus.ready !== true || !this.dynamicRosterReady) {
        this.lastObserved = this._pendingObservation(discoveryStatus);
        this.stats.observations += 1;
        this._setState('DISCOVERING', discoveryStatus && discoveryStatus.reason || this.dynamicRosterPendingReason || 'DYNAMIC_ROSTER_DISCOVERY_PENDING', false);
        return this.status();
      }
    }
    return super.tick();
  }

  farmingGate(characterName = null) {
    if (this.dynamicRosterManaged) {
      const discoveryStatus = this._refreshDynamicRoster();
      if (!discoveryStatus || discoveryStatus.ready !== true || !this.dynamicRosterReady) {
        return {
          allowed: false,
          reason: discoveryStatus && discoveryStatus.reason || this.dynamicRosterPendingReason || 'DYNAMIC_ROSTER_DISCOVERY_PENDING',
          full: false
        };
      }
    }
    return super.farmingGate(characterName);
  }

  _observe() {
    if (this.dynamicRosterManaged && !this.dynamicRosterReady) {
      const observation = this._pendingObservation(this.dynamicRosterDiscovery.status());
      this.lastObserved = observation;
      return observation;
    }
    const observation = super._observe();
    observation.trustSource = this.dynamicRosterManaged
      ? 'dynamic-account-online-roster'
      : 'explicit-variable-party-roster';
    if (this.dynamicRosterManaged) observation.dynamicRosterDiscovery = this.dynamicRosterDiscovery.status();
    this.lastObserved = observation;
    return observation;
  }

  status() {
    const status = super.status();
    if (!this.dynamicRosterManaged) {
      status.trustSource = 'explicit-variable-party-roster';
      if (status.observed) status.observed.trustSource = 'explicit-variable-party-roster';
      return status;
    }

    const discovery = this.dynamicRosterDiscovery.status();
    status.schemaVersion = Math.max(3, Number(status.schemaVersion) || 0);
    status.trustSource = this.dynamicRosterReady
      ? 'dynamic-account-online-roster'
      : 'dynamic-account-online-roster-pending';
    status.dynamicRosterManaged = true;
    status.dynamicRosterReady = this.dynamicRosterReady;
    status.dynamicRosterSignature = this.dynamicRosterSignature;
    status.dynamicRosterLastAppliedAt = this.dynamicRosterLastAppliedAt;
    status.dynamicRosterReconfigurations = this.dynamicRosterReconfigurations;
    status.dynamicRosterDiscovery = discovery;
    status.desiredRoster = this.desiredRoster.slice();
    status.merchantName = this.dynamicRosterReady
      ? this.merchantName
      : discovery.merchantName || null;
    if (status.observed) status.observed.trustSource = status.trustSource;
    return status;
  }
}

module.exports = {
  ControlledPartyBootstrap,
  PARTY_BOOTSTRAP_PROTOCOL: base.PARTY_BOOTSTRAP_PROTOCOL,
  PARTY_BOOTSTRAP_TYPE: base.PARTY_BOOTSTRAP_TYPE,
  PARTY_BOOTSTRAP_RECEIVER: base.PARTY_BOOTSTRAP_RECEIVER,
  DEFAULT_PARTY_BOOTSTRAP_ROSTER: base.DEFAULT_PARTY_BOOTSTRAP_ROSTER,
  PartyBootstrapAction: base.PartyBootstrapAction,
  DynamicPartyRosterDiscovery
};
