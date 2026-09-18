'use strict';

const { GameAdapter } = require('../game/adapter');
const { AccountCharacterTransport, uniqueNames } = require('./account-character-transport');

const PARTY_BOOTSTRAP_PROTOCOL = 1;
const PARTY_BOOTSTRAP_TYPE = 'aio-v3-party-bootstrap';
const PARTY_BOOTSTRAP_RECEIVER = '__AIO_V3_PARTY_BOOTSTRAP_RECEIVE';
const DEFAULT_PARTY_BOOTSTRAP_ROSTER = Object.freeze([
  'My_Merchant',
  'My_Ranger1',
  'My_Ranger2',
  'My_Ranger3'
]);
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
    this.adapter = options.adapter || (this.runtime && this.runtime.adapter) || new GameAdapter({
      root: this.root,
      parent: this.root && this.root.parent,
      log: this.log,
      now: this.now,
      mode: 'active'
    });

    const configuredRoster = options.desiredRoster || options.roster || null;
    let resolvedRoster = configuredRoster ? uniqueNames(configuredRoster) : [];
    if (!resolvedRoster.length) {
      const activeFn = this.root && (this.root.get_active_characters || (this.root.parent && this.root.parent.get_active_characters));
      if (typeof activeFn === 'function') {
        try {
          const active = activeFn.call(this.root);
          const activeNames = active && typeof active === 'object' ? uniqueNames(Object.keys(active)) : [];
          if (activeNames.length === 4) resolvedRoster = activeNames;
        } catch (_) {}
      }
    }
    if (!resolvedRoster.length) resolvedRoster = uniqueNames(DEFAULT_PARTY_BOOTSTRAP_ROSTER);
    this.desiredRoster = resolvedRoster;
    if (this.desiredRoster.length !== 4) throw new Error('PARTY_BOOTSTRAP_REQUIRES_EXACTLY_FOUR_TRUSTED_NAMES');
    this.merchantName = cleanName(options.merchantName)
      || (this.desiredRoster.includes('My_Merchant') ? 'My_Merchant' : null)
      || (this.desiredRoster.includes('Merch') ? 'Merch' : null)
      || this.desiredRoster[0];
    if (!this.desiredRoster.includes(this.merchantName)) throw new Error('PARTY_BOOTSTRAP_MERCHANT_NOT_IN_ROSTER');

    this.transport = options.transport || new AccountCharacterTransport({
      root: this.root,
      now: this.now,
      log: this.log,
      adapter: this.adapter,
      trustedNames: this.desiredRoster
    });
    if (typeof this.transport.setTrustedNames === 'function') this.transport.setTrustedNames(this.desiredRoster);

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
    this.previousDirectReceiver = undefined;
    this.cmWrapper = null;
    this.directReceiver = null;
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
      leaderWarnings: 0,
      leaderRepairAttempts: 0,
      leaderRepairLeaves: 0,
      leaderRepairVerified: 0,
      leaderRepairFailures: 0,
      leaderRepairWaits: 0,
      activeLimitBlocks: 0,
      breakerOpens: 0,
      cancels: 0,
      installs: 0,
      uninstalls: 0
    };
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'party-bootstrap', event, severity, reason, data });
  }

  _character() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  trustedRosterNames() {
    return this.desiredRoster.slice();
  }

  _partyListNames() {
    const parent = this.root && (this.root.parent || this.root);
    const list = parent && parent.party_list;
    return Array.isArray(list) ? uniqueNames(list.map(cleanName).filter(Boolean)) : [];
  }

  _partyNames() {
    const parent = this.root && (this.root.parent || this.root);
    let names = Object.keys(parent && parent.party || {}).map(cleanName).filter(Boolean);
    const local = cleanName(this._character() && this._character().name);
    const listed = this._partyListNames();
    // party_list is authoritative for local membership during leader repair.
    // parent.party can lag briefly after leave_party(), so remove a stale local
    // row when the observable list already confirms that the character left.
    if (local && listed.length && !listed.includes(local)) names = names.filter((name) => name !== local);
    // Adventure Land can otherwise omit the local character from parent.party.
    if (local && !names.includes(local) && (!listed.length || listed.includes(local))) names.push(local);
    return uniqueNames(names);
  }

  _observableLeader() {
    const listed = this._partyListNames();
    return listed.length ? listed[0] : null;
  }

  _activeSnapshot() {
    const raw = this.transport.activeCharacters();
    const observedPresent = typeof this.transport.activeNames === 'function'
      ? this.transport.activeNames()
      : (typeof this.transport.ownedNames === 'function' ? this.transport.ownedNames() : []);
    const observedRunning = typeof this.transport.activeNames === 'function'
      ? this.transport.activeNames({ runningOnly: true })
      : observedPresent.slice();
    return {
      available: !!raw,
      observedPresent,
      observedRunning,
      raw
    };
  }

  _configureTrust() {
    if (typeof this.transport.setTrustedNames === 'function') this.transport.setTrustedNames(this.desiredRoster);
    if (!this.controlLease) return;
    if (typeof this.controlLease.setTrustedNames === 'function') this.controlLease.setTrustedNames(this.desiredRoster);
    if (typeof this.controlLease.setMerchantName === 'function') this.controlLease.setMerchantName(this.merchantName);
  }

  _observe() {
    const at = this.now();
    const active = this._activeSnapshot();
    const local = cleanName(this._character() && this._character().name);
    const partyNames = this._partyNames();
    const leader = this._observableLeader();
    const desiredSet = new Set(this.desiredRoster);
    const foreignPartyNames = partyNames.filter((name) => !desiredSet.has(name));
    const missingDesired = this.desiredRoster.filter((name) => !partyNames.includes(name));
    const full = partyNames.length === this.desiredRoster.length
      && this.desiredRoster.every((name) => partyNames.includes(name))
      && foreignPartyNames.length === 0;
    const observedRunningDesired = this.desiredRoster.filter((name) => active.observedRunning.includes(name));
    const runtimeLivenessVerified = observedRunningDesired.length === this.desiredRoster.length;
    const leaderWrong = !!leader && partyNames.length > 1 && leader !== this.merchantName;
    const observation = {
      at,
      local,
      merchant: this.merchantName,
      trustSource: 'explicit-four-character-roster',
      desiredRoster: this.desiredRoster.slice(),
      activeStateAvailable: active.available,
      observedPresentNames: active.observedPresent,
      observedRunningNames: active.observedRunning,
      observedRunningDesired,
      runtimeLivenessVerified,
      readinessScope: runtimeLivenessVerified ? 'party-membership-and-runtime' : 'party-membership-only',
      partyNames,
      foreignPartyNames,
      missingDesired,
      leader,
      leaderObserved: !!leader,
      leaderWrong,
      full
    };
    this.lastObserved = observation;
    this.stats.observations += 1;
    this._configureTrust();
    return observation;
  }

  _setState(state, reason, ready = false) {
    const changed = this.state !== state || this.reason !== reason || this.ready !== ready;
    this.state = state;
    this.reason = reason;
    this.ready = ready === true;
    if (changed) this._event(
      'PARTY_BOOTSTRAP_STATE_CHANGED',
      ready ? 'info' : (state === 'BLOCKED' ? 'warn' : 'info'),
      reason,
      { state, ready }
    );
  }

  _isBootstrapMessage(data) {
    return !!data && data.type === PARTY_BOOTSTRAP_TYPE && Number(data.protocol) === PARTY_BOOTSTRAP_PROTOCOL;
  }

  receive(sender, data) {
    if (!this.active || !this._isBootstrapMessage(data)) return false;
    const from = cleanName(sender);
    const local = cleanName(this._character() && this._character().name);
    if (!from || !local || !this.desiredRoster.includes(from) || !this.desiredRoster.includes(local)) return false;
    const action = String(data.action || '');

    if (action === PartyBootstrapAction.HELLO_CHALLENGE) {
      if (from !== this.merchantName || cleanName(data.merchantName) !== this.merchantName || cleanName(data.target) !== local) return false;
      const issuedAt = Number(data.issuedAt);
      const expiresAt = Number(data.expiresAt);
      const nonce = String(data.nonce || '');
      if (!nonce || !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)
        || issuedAt > this.now() + 3000 || expiresAt <= this.now()
        || expiresAt - issuedAt > this.challengeTtlMs + 3000) return false;

      this._configureTrust();
      this.stats.challengesAccepted += 1;
      const ack = {
        type: PARTY_BOOTSTRAP_TYPE,
        protocol: PARTY_BOOTSTRAP_PROTOCOL,
        action: PartyBootstrapAction.HELLO_ACK,
        merchantName: this.merchantName,
        target: local,
        nonce,
        at: this.now()
      };
      Promise.resolve(this.transport.send(this.merchantName, ack, {
        receiver: PARTY_BOOTSTRAP_RECEIVER,
        sender: local
      })).catch((error) => {
        this._event('PARTY_BOOTSTRAP_ACK_SEND_FAILED', 'warn', 'ACK_SEND_FAILED', {
          target: local,
          message: String(error && error.message || error).slice(0, 200)
        });
      });
      return true;
    }

    if (action === PartyBootstrapAction.HELLO_ACK) {
      if (local !== this.merchantName || cleanName(data.merchantName) !== this.merchantName || cleanName(data.target) !== from) return false;
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
    this._configureTrust();

    this.previousDirectReceiver = this.root[PARTY_BOOTSTRAP_RECEIVER];
    this.directReceiver = (sender, payload) => this.receive(sender, payload);
    const directInstalled = !!(this.transport
      && typeof this.transport.installDirectReceiver === 'function'
      && this.transport.installDirectReceiver(PARTY_BOOTSTRAP_RECEIVER, this.directReceiver));

    // The AccountCharacterTransport named-receiver router owns root.on_cm.
    // Installing another wrapper here displaces that router and breaks all
    // addressed receivers (telemetry, logistics, cross-map objectives, ...).
    // Keep raw bootstrap handling only for transports without named receivers.
    if (!directInstalled) {
      this.previousOnCm = typeof this.root.on_cm === 'function' ? this.root.on_cm : null;
      const self = this;
      this.cmWrapper = function onPartyBootstrapMessage(name, data) {
        if (self._isBootstrapMessage(data)) {
          self.receive(name, data);
          return undefined;
        }
        if (self.previousOnCm) return self.previousOnCm.apply(this, arguments);
        return undefined;
      };
      this.root.on_cm = this.cmWrapper;
    }
    this.installed = true;
    this.stats.installs += 1;
    return true;
  }

  uninstall() {
    if (!this.installed || !this.root) return false;
    if (this.root.on_cm === this.cmWrapper) this.root.on_cm = this.previousOnCm || undefined;
    if (typeof this.transport.uninstallDirectReceiver === 'function') {
      this.transport.uninstallDirectReceiver(
        PARTY_BOOTSTRAP_RECEIVER,
        this.directReceiver,
        this.previousDirectReceiver
      );
    } else if (this.root[PARTY_BOOTSTRAP_RECEIVER] === this.directReceiver) {
      if (this.previousDirectReceiver === undefined) {
        try { delete this.root[PARTY_BOOTSTRAP_RECEIVER]; } catch (_) { this.root[PARTY_BOOTSTRAP_RECEIVER] = undefined; }
      } else {
        this.root[PARTY_BOOTSTRAP_RECEIVER] = this.previousDirectReceiver;
      }
    }
    this.previousOnCm = null;
    this.previousDirectReceiver = undefined;
    this.cmWrapper = null;
    this.directReceiver = null;
    this.installed = false;
    this.stats.uninstalls += 1;
    return true;
  }

  resume() {
    if (this.controlLease && !this.controlLease.installed && typeof this.controlLease.install === 'function') {
      this.controlLease.install();
    }
    this.install();
    this.active = true;
    this.generation += 1;
    this._configureTrust();
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
    this.uninstall();
    if (this.controlLease && this.controlLease.installed && typeof this.controlLease.uninstall === 'function') {
      this.controlLease.uninstall();
    }
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

  async _verifyPresence(target, generation) {
    const issuedAt = this.now();
    const nonce = randomToken(issuedAt);
    const pending = { nonce, target, issuedAt, expiresAt: issuedAt + this.challengeTtlMs };
    this.pendingChallenges.set(target, pending);
    this.acknowledged.delete(target);
    await this.transport.send(target, {
      type: PARTY_BOOTSTRAP_TYPE,
      protocol: PARTY_BOOTSTRAP_PROTOCOL,
      action: PartyBootstrapAction.HELLO_CHALLENGE,
      merchantName: this.merchantName,
      target,
      nonce,
      issuedAt,
      expiresAt: pending.expiresAt
    }, { receiver: PARTY_BOOTSTRAP_RECEIVER, sender: this.merchantName });
    this.stats.challengesSent += 1;
    await this._waitUntil(() => {
      const ack = this.acknowledged.get(target);
      return !!ack && ack.nonce === nonce;
    }, this.ackTimeoutMs, generation, `PARTY_BOOTSTRAP_HELLO_TIMEOUT:${target}`);
    this.pendingChallenges.delete(target);
    this.acknowledged.delete(target);
    return true;
  }

  async _invite(target, generation) {
    this._assertGeneration(generation);
    this._setState('DISCOVERING', `VERIFYING_${target}`, false);
    await this._verifyPresence(target, generation);
    this._assertGeneration(generation);

    if (!this.controlLease || typeof this.controlLease.authorizeIncoming !== 'function') throw new Error('PARTY_CONTROL_LEASE_UNAVAILABLE');
    this._configureTrust();
    const transactionId = `party-bootstrap-${this.now()}-${target}`;
    this._setState('AUTHORIZING', `AUTHORIZING_${target}`, false);
    await this.controlLease.authorizeIncoming(target, transactionId);
    this._assertGeneration(generation);

    if (!this.adapter || typeof this.adapter.command !== 'function') throw new Error('GAME_ADAPTER_UNAVAILABLE');
    if (typeof this.adapter.canCommand === 'function' && !this.adapter.canCommand('send_party_invite')) throw new Error('PARTY_INVITE_UNAVAILABLE');
    this._setState('INVITING', `INVITING_${target}`, false);
    const command = this.adapter.command('send_party_invite', [target]);
    if (!command.executed) throw new Error(command.reason || (command.shadow ? 'ACTIVE_MODE_REQUIRED_FOR_BOOTSTRAP' : 'PARTY_INVITE_UNAVAILABLE'));
    await Promise.resolve(command.value);
    this.stats.invitesSent += 1;
    this._setState('VERIFYING', `VERIFYING_PARTY_${target}`, false);
    await this._waitUntil(() => this._partyNames().includes(target), this.verifyTimeoutMs, generation, `PARTY_BOOTSTRAP_VERIFY_TIMEOUT:${target}`);
    this.stats.invitesVerified += 1;
    this.attempts.delete(target);
    this.nextAttemptAt.delete(target);
    this.lastResult = { ok: true, target, transactionId, at: this.now() };
    return this.lastResult;
  }

  _leaderRepairKey(name) {
    return `leader:${cleanName(name) || 'unknown'}`;
  }

  async _repairNonMerchantLeader(observation, generation) {
    this._assertGeneration(generation);
    const local = cleanName(this._character() && this._character().name);
    const leader = cleanName(observation && observation.leader);
    if (!local || !leader || leader === this.merchantName || local !== leader) {
      throw new Error('PARTY_LEADER_REPAIR_AUTHORITY_MISMATCH');
    }
    if (!this.adapter || typeof this.adapter.command !== 'function') throw new Error('GAME_ADAPTER_UNAVAILABLE');
    if (typeof this.adapter.canCommand === 'function' && !this.adapter.canCommand('leave_party')) {
      throw new Error('LEAVE_PARTY_UNAVAILABLE');
    }

    this.stats.leaderRepairAttempts += 1;
    this._setState('REPAIRING', `LEAVING_NON_MERCHANT_PARTY_LEADER_${local}`, false);
    const command = this.adapter.command('leave_party', []);
    if (!command.executed) {
      throw new Error(command.reason || (command.shadow ? 'ACTIVE_MODE_REQUIRED_FOR_LEADER_REPAIR' : 'LEAVE_PARTY_UNAVAILABLE'));
    }
    await Promise.resolve(command.value);
    this.stats.leaderRepairLeaves += 1;
    this._setState('VERIFYING', `VERIFYING_PARTY_LEADER_RELEASE_${local}`, false);
    await this._waitUntil(
      () => !this._partyListNames().includes(local),
      this.verifyTimeoutMs,
      generation,
      `PARTY_LEADER_REPAIR_VERIFY_TIMEOUT:${local}`
    );

    this.stats.leaderRepairVerified += 1;
    const key = this._leaderRepairKey(local);
    this.attempts.delete(key);
    this.nextAttemptAt.delete(key);
    this.lastResult = {
      ok: true,
      action: 'LEAVE_FOR_MERCHANT_LEADERSHIP',
      leader: local,
      merchantName: this.merchantName,
      at: this.now()
    };
    this._event('PARTY_LEADER_REPAIR_LEAVE_VERIFIED', 'info', 'MERCHANT_LEADERSHIP_REPAIR_PROGRESS', {
      leader: local,
      merchantName: this.merchantName
    });
    return this.lastResult;
  }

  _noteLeaderRepairFailure(leader, error) {
    const key = this._leaderRepairKey(leader);
    const attempts = (this.attempts.get(key) || 0) + 1;
    this.attempts.set(key, attempts);
    this.stats.failures += 1;
    this.stats.leaderRepairFailures += 1;
    const message = String(error && error.message || error || 'PARTY_LEADER_REPAIR_FAILED').slice(0, 240);
    if (attempts >= this.maxAttempts) {
      this.breakerUntil = this.now() + this.breakerMs;
      this.stats.breakerOpens += 1;
      this._setState('BLOCKED', 'PARTY_LEADER_REPAIR_CIRCUIT_OPEN', false);
    } else {
      const delay = Math.min(this.retryMaxMs, this.retryBaseMs * Math.pow(2, attempts - 1));
      this.nextAttemptAt.set(key, this.now() + delay);
      this._setState('BACKOFF', `RETRY_PARTY_LEADER_REPAIR_${leader}`, false);
    }
    this.lastResult = { ok: false, action: 'LEADER_REPAIR', leader, attempts, message, at: this.now() };
    this._event('PARTY_LEADER_REPAIR_FAILED', 'warn', message, {
      leader,
      merchantName: this.merchantName,
      attempts,
      breakerUntil: this.breakerUntil || null
    });
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
    this._event('PARTY_BOOTSTRAP_ATTEMPT_FAILED', 'warn', message, {
      target,
      attempts,
      breakerUntil: this.breakerUntil || null
    });
  }

  farmingGate(characterName = null) {
    const local = cleanName(characterName) || cleanName(this._character() && this._character().name);
    const observation = this.lastObserved || this._observe();
    if (!local || !this.desiredRoster.includes(local)) {
      return { allowed: false, reason: 'LOCAL_CHARACTER_NOT_IN_TRUSTED_ROSTER', full: false };
    }
    if (local === this.merchantName) {
      return { allowed: true, reason: 'MERCHANT_NOT_FARMER', full: observation.full };
    }
    if (observation.foreignPartyNames.length) {
      return { allowed: false, reason: 'FOREIGN_PARTY_MEMBER_PRESENT', full: observation.full };
    }
    if (observation.leaderWrong) {
      return { allowed: false, reason: 'NON_MERCHANT_PARTY_LEADER_REPAIR_REQUIRED', full: observation.full };
    }
    if (observation.full) {
      return { allowed: true, reason: 'FULL_TRUSTED_PARTY', full: true };
    }
    const safeTrustedPartial = observation.partyNames.includes(local)
      && observation.partyNames.includes(this.merchantName)
      && observation.partyNames.length >= 2
      && observation.partyNames.every((name) => this.desiredRoster.includes(name));
    if (safeTrustedPartial) {
      return { allowed: true, reason: 'SAFE_TRUSTED_PARTIAL_PARTY', full: false };
    }
    return {
      allowed: false,
      reason: this.reason || 'PARTY_BOOTSTRAP_NOT_READY',
      full: false
    };
  }

  tick() {
    if (!this.active) return this.status();
    const observation = this._observe();

    if (observation.observedPresentNames.length > 4) {
      this.stats.activeLimitBlocks += 1;
      this._setState('BLOCKED', 'ACTIVE_CHARACTER_LIMIT_EXCEEDED', false);
      return this.status();
    }
    if (!this.desiredRoster.includes(observation.local)) {
      this._setState('BLOCKED', 'LOCAL_CHARACTER_NOT_IN_TRUSTED_ROSTER', false);
      return this.status();
    }
    if (observation.foreignPartyNames.length) {
      this.stats.foreignPartyBlocks += 1;
      this._setState('BLOCKED', 'FOREIGN_OR_INACTIVE_PARTY_MEMBER_PRESENT', false);
      return this.status();
    }
    if (observation.leaderWrong) {
      this.stats.leaderWarnings += 1;
      const leader = observation.leader;
      const repairKey = this._leaderRepairKey(leader);

      if (this.breakerUntil > this.now()) {
        this._setState('BLOCKED', 'PARTY_LEADER_REPAIR_CIRCUIT_OPEN', false);
        return this.status();
      }
      if (this.breakerUntil && this.breakerUntil <= this.now()) {
        this.breakerUntil = 0;
        this.attempts.clear();
      }
      if (observation.local !== leader) {
        this.stats.leaderRepairWaits += 1;
        this._setState('REPAIRING', `WAITING_FOR_CURRENT_PARTY_LEADER_${leader}`, false);
        return this.status();
      }
      if (!this.adapter || this.adapter.mode !== 'active') {
        this._setState('PARTIAL', 'ACTIVE_MODE_REQUIRED_FOR_LEADER_REPAIR', false);
        return this.status();
      }
      if (this.inFlight) return this.status();
      const nextAttemptAt = this.nextAttemptAt.get(repairKey) || 0;
      if (this.now() < nextAttemptAt) {
        this._setState('BACKOFF', `RETRY_PARTY_LEADER_REPAIR_${leader}`, false);
        return this.status();
      }

      const generation = this.generation;
      this.inFlight = Promise.resolve()
        .then(() => this._repairNonMerchantLeader(observation, generation))
        .catch((error) => {
          if (String(error && error.message || error) === 'PARTY_BOOTSTRAP_CANCELLED') return;
          this._noteLeaderRepairFailure(leader, error);
        })
        .finally(() => { this.inFlight = null; });
      return this.status();
    }

    if (observation.full) {
      this.stats.noops += 1;
      this._setState('READY', 'FULL_PARTY_VERIFIED', true);
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

    if (observation.local !== this.merchantName) {
      this._setState(
        'PARTIAL',
        observation.partyNames.includes(this.merchantName)
          ? 'WAITING_FOR_MERCHANT_BOOTSTRAP'
          : 'WAITING_FOR_TRUSTED_MERCHANT_PARTY',
        false
      );
      return this.status();
    }
    if (this.runtime && this.runtime.adapter && this.runtime.adapter.mode !== 'active') {
      this._setState('PARTIAL', 'ACTIVE_MODE_REQUIRED_FOR_BOOTSTRAP', false);
      return this.status();
    }
    if (this.inFlight) return this.status();

    const target = observation.missingDesired.find(
      (name) => name !== this.merchantName && this.now() >= (this.nextAttemptAt.get(name) || 0)
    );
    if (!target) {
      this._setState('PARTIAL', 'WAITING_FOR_RETRY_WINDOW', false);
      return this.status();
    }

    const generation = this.generation;
    this.inFlight = Promise.resolve()
      .then(() => this._invite(target, generation))
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
      schemaVersion: 2,
      mode: 'controlled-explicit-party-bootstrap-v2',
      protocol: PARTY_BOOTSTRAP_PROTOCOL,
      installed: this.installed,
      active: this.active,
      state: this.state,
      reason: this.reason,
      ready: this.ready,
      merchantName: this.merchantName,
      desiredRoster: this.desiredRoster.slice(),
      trustSource: 'explicit-four-character-roster',
      actionAuthority: this.active
        && this.runtime && this.runtime.adapter && this.runtime.adapter.mode === 'active'
        && this.lastObserved && this.lastObserved.local === this.merchantName,
      leaderRepairAuthority: this.active
        && this.adapter && this.adapter.mode === 'active'
        && this.lastObserved && this.lastObserved.leaderWrong === true
        && this.lastObserved.local === this.lastObserved.leader,
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
  DEFAULT_PARTY_BOOTSTRAP_ROSTER,
  PartyBootstrapAction
};
