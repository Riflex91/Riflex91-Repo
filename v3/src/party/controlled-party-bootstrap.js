'use strict';

const { AccountCharacterTransport } = require('./account-character-transport');

const PARTY_BOOTSTRAP_PROTOCOL = 1;
const PARTY_BOOTSTRAP_TYPE = 'aio-v3-party-bootstrap';
const PARTY_BOOTSTRAP_RECEIVER = '__AIO_V3_PARTY_BOOTSTRAP_RECEIVE';
const PartyBootstrapAction = Object.freeze({
  HELLO_CHALLENGE: 'HELLO_CHALLENGE',
  HELLO_ACK: 'HELLO_ACK'
});

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function cleanName(value) { const name = String(value == null ? '' : value).trim(); return name || null; }
function randomToken(now) { return `${now.toString(36)}-${Math.random().toString(36).slice(2, 12)}`; }

class ControlledPartyBootstrap {
  constructor(options = {}) {
    this.runtime = options.runtime || null;
    this.root = options.root || (this.runtime && this.runtime.root) || globalThis;
    this.now = options.now || (this.runtime && this.runtime.now) || (() => Date.now());
    this.log = options.log || (this.runtime && this.runtime.log) || null;
    this.controlLease = options.controlLease || (this.runtime && this.runtime.partyControlLease) || null;
    this.transport = options.transport || new AccountCharacterTransport({ root: this.root, now: this.now, log: this.log });
    this.challengeTtlMs = Math.max(1500, Math.min(15000, Number(options.challengeTtlMs) || 5000));
    this.ackTimeoutMs = Math.max(1000, Math.min(10000, Number(options.ackTimeoutMs) || 3500));
    this.verifyTimeoutMs = Math.max(2000, Math.min(20000, Number(options.verifyTimeoutMs) || 8000));
    this.pollMs = Math.max(50, Math.min(1000, Number(options.pollMs) || 100));
    this.retryBaseMs = Math.max(1000, Number(options.retryBaseMs) || 5000);
    this.retryMaxMs = Math.max(this.retryBaseMs, Number(options.retryMaxMs) || 60000);
    this.maxAttempts = Math.max(1, Math.min(10, Number(options.maxAttempts) || 3));
    this.breakerMs = Math.max(10000, Number(options.breakerMs) || 120000);
    this.active = false;
    this.generation = 0;
    this.state = 'SUSPENDED';
    this.reason = 'RUNTIME_NOT_STARTED';
    this.ready = false;
    this.lastObserved = null;
    this.lastResult = null;
    this.inFlight = null;
    this.pendingChallenges = new Map();
    this.acknowledged = new Map();
    this.attempts = new Map();
    this.nextAttemptAt = new Map();
    this.breakerUntil = 0;
    this.previousOnCm = null;
    this.installed = false;
    this.stats = {
      observations: 0,
      noops: 0,
      challengesSent: 0,
      challengesAccepted: 0,
      challengeAcksReceived: 0,
      invitesSent: 0,
      invitesVerified: 0,
      failures: 0,
      foreignPartyBlocks: 0,
      leaderBlocks: 0,
      activeLimitBlocks: 0,
      breakerOpens: 0,
      cancels: 0
    };
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'party-bootstrap', event, severity, reason, data });
  }

  _function(name) {
    return this.root && (this.root[name] || (this.root.parent && this.root.parent[name])) || null;
  }

  _character() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _partyNames() {
    const parent = this.root && (this.root.parent || this.root);
    const names = Object.keys(parent && parent.party || {}).map(cleanName).filter(Boolean);
    const local = cleanName(this._character() && this._character().name);
    if (local && !names.includes(local)) names.push(local);
    return [...new Set(names)].sort();
  }

  _observableLeader() {
    const parent = this.root && (this.root.parent || this.root);
    const list = parent && parent.party_list;
    return Array.isArray(list) && list.length ? cleanName(list[0]) : null;
  }

  _activeSnapshot() {
    const raw = this.transport.activeCharacters();
    if (!raw) return { available: false, present: [], running: [], raw: null };
    const present = this.transport.ownedNames();
    const running = this.transport.ownedNames({ runningOnly: true });
    return { available: true, present, running, raw };
  }

  _merchantName(activeNames) {
    const active = new Set(activeNames || []);
    const c = this._character();
    if (c && String(c.ctype || '').toLowerCase() === 'merchant' && active.has(String(c.name))) return String(c.name);

    const configured = cleanName(this.controlLease && this.controlLease.merchantName);
    if (configured && active.has(configured)) return configured;

    const registry = this.runtime && this.runtime.characterRegistry && this.runtime.characterRegistry.status && this.runtime.characterRegistry.status();
    const candidates = (registry && registry.characters || [])
      .filter((row) => row && String(row.ctype || '').toLowerCase() === 'merchant' && active.has(String(row.name)))
      .map((row) => String(row.name));
    if (new Set(candidates).size === 1) return candidates[0];

    const parent = this.root && (this.root.parent || this.root);
    const party = parent && parent.party || {};
    const partyMerchants = Object.entries(party)
      .filter(([name, row]) => active.has(String(name)) && String(row && (row.ctype || row.type) || '').toLowerCase() === 'merchant')
      .map(([name]) => String(name));
    return new Set(partyMerchants).size === 1 ? partyMerchants[0] : null;
  }

  _configureTrust(activeNames, merchantName) {
    if (!this.controlLease) return;
    if (typeof this.controlLease.setTrustedNames === 'function') this.controlLease.setTrustedNames(activeNames);
    if (merchantName && typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(merchantName);
  }

  _observe() {
    const at = this.now();
    const active = this._activeSnapshot();
    const local = cleanName(this._character() && this._character().name);
    const merchant = this._merchantName(active.present);
    const partyNames = this._partyNames();
    const leader = this._observableLeader();
    const presentSet = new Set(active.present);
    const foreignPartyNames = partyNames.filter((name) => !presentSet.has(name));
    const missingRunning = active.running.filter((name) => name !== merchant && !partyNames.includes(name));
    const full = active.available && active.running.length === 4 && !!merchant && active.running.every((name) => partyNames.includes(name));
    const leaderWrong = !!leader && !!merchant && partyNames.length > 1 && leader !== merchant;
    const observation = {
      at,
      local,
      merchant,
      activeStateAvailable: active.available,
      presentNames: active.present,
      runningNames: active.running,
      partyNames,
      foreignPartyNames,
      missingRunning,
      leader,
      leaderObserved: !!leader,
      leaderWrong,
      full
    };
    this.lastObserved = observation;
    this.stats.observations += 1;
    this._configureTrust(active.present, merchant);
    return observation;
  }

  _setState(state, reason, ready = false) {
    const changed = this.state !== state || this.reason !== reason || this.ready !== ready;
    this.state = state;
    this.reason = reason;
    this.ready = ready === true;
    if (changed) this._event('PARTY_BOOTSTRAP_STATE_CHANGED', ready ? 'info' : (state === 'BLOCKED' ? 'warn' : 'info'), reason, { state, ready });
  }

  _isBootstrapMessage(data) {
    return !!data && data.type === PARTY_BOOTSTRAP_TYPE && Number(data.protocol) === PARTY_BOOTSTRAP_PROTOCOL;
  }

  receive(sender, data) {
    if (!this.active || !this._isBootstrapMessage(data)) return false;
    const from = cleanName(sender);
    const local = cleanName(this._character() && this._character().name);
    const active = this._activeSnapshot();
    if (!active.available || active.present.length > 4 || !from || !local || !active.present.includes(from) || !active.present.includes(local)) return false;
    const merchant = this._merchantName(active.present);
    const action = String(data.action || '');

    if (action === PartyBootstrapAction.HELLO_CHALLENGE) {
      if (!merchant || from !== merchant || cleanName(data.merchantName) !== merchant || cleanName(data.target) !== local) return false;
      const issuedAt = Number(data.issuedAt);
      const expiresAt = Number(data.expiresAt);
      const nonce = String(data.nonce || '');
      if (!nonce || !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > this.now() + 3000 || expiresAt <= this.now() || expiresAt - issuedAt > this.challengeTtlMs + 3000) return false;
      this.stats.challengesAccepted += 1;
      const ack = {
        type: PARTY_BOOTSTRAP_TYPE,
        protocol: PARTY_BOOTSTRAP_PROTOCOL,
        action: PartyBootstrapAction.HELLO_ACK,
        merchantName: merchant,
        target: local,
        nonce,
        at: this.now()
      };
      Promise.resolve(this.transport.send(merchant, ack, { receiver: PARTY_BOOTSTRAP_RECEIVER, sender: local })).catch((error) => {
        this._event('PARTY_BOOTSTRAP_ACK_SEND_FAILED', 'warn', 'ACK_SEND_FAILED', { target: local, message: String(error && error.message || error).slice(0, 200) });
      });
      return true;
    }

    if (action === PartyBootstrapAction.HELLO_ACK) {
      if (!merchant || local !== merchant || cleanName(data.merchantName) !== merchant || cleanName(data.target) !== from) return false;
      const pending = this.pendingChallenges.get(from);
      if (!pending || pending.nonce !== String(data.nonce || '') || pending.expiresAt <= this.now()) return false;
      this.acknowledged.set(from, { nonce: pending.nonce, at: this.now() });
      this.stats.challengeAcksReceived += 1;
      return true;
    }
    return false;
  }

  install() {
    if (this.installed || !this.root) return false;
    this.transport.installDirectReceiver(PARTY_BOOTSTRAP_RECEIVER, (sender, payload) => this.receive(sender, payload));
    this.previousOnCm = typeof this.root.on_cm === 'function' ? this.root.on_cm : null;
    const self = this;
    this.root.on_cm = function onPartyBootstrapMessage(name, data) {
      if (self._isBootstrapMessage(data)) {
        self.receive(name, data);
        return undefined;
      }
      if (self.previousOnCm) return self.previousOnCm.apply(this, arguments);
      return undefined;
    };
    this.installed = true;
    return true;
  }

  resume() {
    this.active = true;
    this.generation += 1;
    this._setState('OBSERVING', 'RUNTIME_STARTED', false);
    return true;
  }

  cancel(reason = 'RUNTIME_STOPPED') {
    this.active = false;
    this.generation += 1;
    this.pendingChallenges.clear();
    this.acknowledged.clear();
    this.stats.cancels += 1;
    this._setState('SUSPENDED', reason, false);
    return true;
  }

  _assertGeneration(generation) {
    if (!this.active || generation !== this.generation) throw new Error('PARTY_BOOTSTRAP_CANCELLED');
  }

  async _waitUntil(predicate, timeoutMs, generation, reason) {
    const started = this.now();
    while (this.now() - started <= timeoutMs) {
      this._assertGeneration(generation);
      if (predicate()) return true;
      await sleep(this.pollMs);
    }
    throw new Error(reason || 'PARTY_BOOTSTRAP_TIMEOUT');
  }

  async _verifyPresence(target, merchant, generation) {
    const issuedAt = this.now();
    const nonce = randomToken(issuedAt);
    const pending = { nonce, target, issuedAt, expiresAt: issuedAt + this.challengeTtlMs };
    this.pendingChallenges.set(target, pending);
    this.acknowledged.delete(target);
    await this.transport.send(target, {
      type: PARTY_BOOTSTRAP_TYPE,
      protocol: PARTY_BOOTSTRAP_PROTOCOL,
      action: PartyBootstrapAction.HELLO_CHALLENGE,
      merchantName: merchant,
      target,
      nonce,
      issuedAt,
      expiresAt: pending.expiresAt
    }, { receiver: PARTY_BOOTSTRAP_RECEIVER, sender: merchant });
    this.stats.challengesSent += 1;
    await this._waitUntil(() => {
      const ack = this.acknowledged.get(target);
      return !!ack && ack.nonce === nonce;
    }, this.ackTimeoutMs, generation, `PARTY_BOOTSTRAP_HELLO_TIMEOUT:${target}`);
    this.pendingChallenges.delete(target);
    this.acknowledged.delete(target);
    return true;
  }

  async _invite(target, observation, generation) {
    const merchant = observation.merchant;
    this._assertGeneration(generation);
    this._setState('DISCOVERING', `VERIFYING_${target}`, false);
    await this._verifyPresence(target, merchant, generation);
    this._assertGeneration(generation);

    if (!this.controlLease || typeof this.controlLease.authorizeIncoming !== 'function') throw new Error('PARTY_CONTROL_LEASE_UNAVAILABLE');
    this._configureTrust(observation.presentNames, merchant);
    const transactionId = `party-bootstrap-${this.now()}-${target}`;
    this._setState('AUTHORIZING', `AUTHORIZING_${target}`, false);
    await this.controlLease.authorizeIncoming(target, transactionId);
    this._assertGeneration(generation);

    const invite = this._function('send_party_invite');
    if (typeof invite !== 'function') throw new Error('PARTY_INVITE_UNAVAILABLE');
    this._setState('INVITING', `INVITING_${target}`, false);
    await Promise.resolve(invite.call(this.root, target));
    this.stats.invitesSent += 1;
    this._setState('VERIFYING', `VERIFYING_PARTY_${target}`, false);
    await this._waitUntil(() => this._partyNames().includes(target), this.verifyTimeoutMs, generation, `PARTY_BOOTSTRAP_VERIFY_TIMEOUT:${target}`);
    this.stats.invitesVerified += 1;
    this.attempts.delete(target);
    this.nextAttemptAt.delete(target);
    this.lastResult = { ok: true, target, transactionId, at: this.now() };
    return this.lastResult;
  }

  _noteFailure(target, error) {
    const attempts = (this.attempts.get(target) || 0) + 1;
    this.attempts.set(target, attempts);
    this.stats.failures += 1;
    const message = String(error && error.message || error || 'PARTY_BOOTSTRAP_FAILED').slice(0, 240);
    if (attempts >= this.maxAttempts) {
      this.breakerUntil = this.now() + this.breakerMs;
      this.stats.breakerOpens += 1;
      this._setState('BLOCKED', 'PARTY_BOOTSTRAP_CIRCUIT_OPEN', false);
    } else {
      const delay = Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, attempts - 1));
      this.nextAttemptAt.set(target, this.now() + delay);
      this._setState('BACKOFF', `RETRY_${target}`, false);
    }
    this.lastResult = { ok: false, target, attempts, message, at: this.now() };
    this._event('PARTY_BOOTSTRAP_ATTEMPT_FAILED', 'warn', message, { target, attempts, breakerUntil: this.breakerUntil || null });
  }

  tick() {
    if (!this.active) return this.status();
    const observation = this._observe();

    if (!observation.activeStateAvailable) {
      this._setState('BLOCKED', 'ACTIVE_CHARACTER_STATE_UNAVAILABLE', false);
      return this.status();
    }
    if (observation.presentNames.length > 4) {
      this.stats.activeLimitBlocks += 1;
      this._setState('BLOCKED', 'ACTIVE_CHARACTER_LIMIT_EXCEEDED', false);
      return this.status();
    }
    if (!observation.merchant) {
      this._setState('OBSERVING', 'MERCHANT_NOT_IDENTIFIED', false);
      return this.status();
    }
    if (observation.foreignPartyNames.length) {
      this.stats.foreignPartyBlocks += 1;
      this._setState('BLOCKED', 'FOREIGN_OR_INACTIVE_PARTY_MEMBER_PRESENT', false);
      return this.status();
    }
    if (observation.leaderWrong) {
      this.stats.leaderBlocks += 1;
      this._setState('BLOCKED', 'MERCHANT_NOT_PARTY_LEADER', false);
      return this.status();
    }
    if (observation.full) {
      this.stats.noops += 1;
      this._setState('READY', observation.leaderObserved ? 'FULL_PARTY_VERIFIED' : 'FULL_PARTY_NOOP_LEADER_INFERRED', true);
      return this.status();
    }

    if (this.breakerUntil > this.now()) {
      this._setState('BLOCKED', 'PARTY_BOOTSTRAP_CIRCUIT_OPEN', false);
      return this.status();
    }
    if (this.breakerUntil && this.breakerUntil <= this.now()) {
      this.breakerUntil = 0;
      this.attempts.clear();
    }

    const local = observation.local;
    if (local !== observation.merchant) {
      this._setState('PARTIAL', 'WAITING_FOR_MERCHANT_BOOTSTRAP', false);
      return this.status();
    }
    if (this.runtime && this.runtime.adapter && this.runtime.adapter.mode !== 'active') {
      this._setState('PARTIAL', 'ACTIVE_MODE_REQUIRED_FOR_BOOTSTRAP', false);
      return this.status();
    }
    if (this.inFlight) return this.status();

    const target = observation.missingRunning.find((name) => this.now() >= (this.nextAttemptAt.get(name) || 0));
    if (!target) {
      this._setState('PARTIAL', observation.runningNames.length < 4 ? 'WAITING_FOR_ACTIVE_COMPANIONS' : 'WAITING_FOR_RETRY_WINDOW', false);
      return this.status();
    }

    const generation = this.generation;
    this.inFlight = Promise.resolve()
      .then(() => this._invite(target, observation, generation))
      .catch((error) => {
        if (String(error && error.message || error) === 'PARTY_BOOTSTRAP_CANCELLED') return;
        this._noteFailure(target, error);
      })
      .finally(() => { this.inFlight = null; });
    return this.status();
  }

  async waitForIdle(timeoutMs = 15000) {
    const started = this.now();
    while (this.inFlight && this.now() - started <= timeoutMs) await sleep(this.pollMs);
    return !this.inFlight;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'controlled-dynamic-party-bootstrap-v1',
      protocol: PARTY_BOOTSTRAP_PROTOCOL,
      installed: this.installed,
      active: this.active,
      state: this.state,
      reason: this.reason,
      ready: this.ready,
      actionAuthority: this.active && this.runtime && this.runtime.adapter && this.runtime.adapter.mode === 'active' && this.lastObserved && this.lastObserved.local === this.lastObserved.merchant,
      inFlight: !!this.inFlight,
      breakerUntil: this.breakerUntil || null,
      breakerRemainingMs: Math.max(0, this.breakerUntil - this.now()),
      observed: this.lastObserved ? { ...this.lastObserved } : null,
      lastResult: this.lastResult ? { ...this.lastResult } : null,
      attempts: Object.fromEntries(this.attempts.entries()),
      stats: { ...this.stats },
      transport: this.transport.status()
    };
  }
}

module.exports = {
  ControlledPartyBootstrap,
  PARTY_BOOTSTRAP_PROTOCOL,
  PARTY_BOOTSTRAP_TYPE,
  PARTY_BOOTSTRAP_RECEIVER,
  PartyBootstrapAction
};
