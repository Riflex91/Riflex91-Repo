'use strict';

const { GameAdapter } = require('../game/adapter');

const PARTY_CONTROL_PROTOCOL = 1;
const PARTY_CONTROL_TYPE = 'aio-v3-party-control';
const PartyControlAction = Object.freeze({
  ALLOW_PARTY_INVITE: 'ALLOW_PARTY_INVITE',
  LEASE_ACK: 'LEASE_ACK'
});

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function cleanName(value) { const name = String(value == null ? '' : value).trim(); return name || null; }
function cleanTransactionId(value) {
  const id = String(value == null ? '' : value).trim();
  if (!id || id.length > 128) return null;
  return id;
}

class PartyControlLease {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: this.root && this.root.parent, log: this.log, now: this.now, mode: 'active' });
    this.merchantName = cleanName(options.merchantName);
    this.trustedNames = new Set((options.trustedNames || []).map(cleanName).filter(Boolean));
    this.leaseMs = Math.max(5000, Math.min(60000, Number(options.leaseMs) || 15000));
    this.ackTimeoutMs = Math.max(1000, Math.min(15000, Number(options.ackTimeoutMs) || 5000));
    this.pollMs = Math.max(50, Math.min(1000, Number(options.pollMs) || 100));
    this.maxClockSkewMs = Math.max(1000, Math.min(10000, Number(options.maxClockSkewMs) || 3000));
    this.activeLease = null;
    this.acks = new Map();
    this.installed = false;
    this.previousOnCm = null;
    this.previousOnPartyInvite = null;
    this.stats = {
      leasesSent: 0,
      leasesReceived: 0,
      leaseAcksSent: 0,
      leaseAcksReceived: 0,
      controlRejected: 0,
      inviteAccepted: 0,
      inviteRejected: 0,
      acceptFailures: 0,
      ackTimeouts: 0
    };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'party-control', event, severity, reason, data });
    }
  }

  _character() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _localName() {
    const character = this._character();
    return cleanName(character && character.name);
  }

  setMerchantName(name) {
    this.merchantName = cleanName(name);
    return this.merchantName;
  }

  setTrustedNames(names) {
    this.trustedNames = new Set((names || []).map(cleanName).filter(Boolean));
    return [...this.trustedNames].sort();
  }

  _isTrusted(name) {
    const resolved = cleanName(name);
    return !!resolved && this.trustedNames.has(resolved);
  }

  _isControlMessage(data) {
    return !!data && data.type === PARTY_CONTROL_TYPE && Number(data.protocol) === PARTY_CONTROL_PROTOCOL;
  }

  _ackKey(transactionId, target) {
    return `${transactionId}:${target}`;
  }

  _prune() {
    const now = this.now();
    if (this.activeLease && this.activeLease.expiresAt <= now) {
      this._event('PARTY_CONTROL_LEASE_EXPIRED', { transactionId: this.activeLease.transactionId, target: this.activeLease.target }, 'warn', 'LEASE_EXPIRED');
      this.activeLease = null;
    }
    for (const [key, at] of this.acks) {
      if (now - at > this.ackTimeoutMs * 2) this.acks.delete(key);
    }
  }

  _reject(reason, data = {}) {
    this.stats.controlRejected += 1;
    this._event('PARTY_CONTROL_REJECTED', data, 'warn', reason);
    return false;
  }

  async _send(name, payload) {
    if (!this.adapter || typeof this.adapter.command !== 'function') throw new Error('GAME_ADAPTER_UNAVAILABLE');
    if (typeof this.adapter.canCommand === 'function' && !this.adapter.canCommand('send_cm')) throw new Error('SEND_CM_UNAVAILABLE');
    const command = this.adapter.command('send_cm', [name, payload]);
    if (!command.executed) throw new Error(command.reason || (command.shadow ? 'RUNTIME_NOT_ACTIVE' : 'SEND_CM_REJECTED'));
    return Promise.resolve(command.value);
  }

  _validateLeaseEnvelope(sender, data) {
    const now = this.now();
    const localName = this._localName();
    const senderName = cleanName(sender);
    const target = cleanName(data && data.target);
    const transactionId = cleanTransactionId(data && data.transactionId);
    const issuedAt = finite(data && data.issuedAt);
    const expiresAt = finite(data && data.expiresAt);
    if (!localName) return { ok: false, reason: 'LOCAL_CHARACTER_UNAVAILABLE' };
    if (!this.merchantName || senderName !== this.merchantName) return { ok: false, reason: 'UNTRUSTED_MERCHANT' };
    if (!this._isTrusted(senderName) || !this._isTrusted(localName)) return { ok: false, reason: 'UNTRUSTED_ROSTER_MEMBER' };
    if (!target || target !== localName) return { ok: false, reason: 'LEASE_TARGET_MISMATCH' };
    if (!transactionId) return { ok: false, reason: 'INVALID_TRANSACTION_ID' };
    if (issuedAt == null || expiresAt == null) return { ok: false, reason: 'INVALID_LEASE_TIME' };
    if (issuedAt > now + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_FROM_FUTURE' };
    if (now - issuedAt > this.leaseMs + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_TOO_OLD' };
    if (expiresAt <= now) return { ok: false, reason: 'LEASE_EXPIRED' };
    if (expiresAt - issuedAt > this.leaseMs + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_TOO_LONG' };
    if (expiresAt - now > this.leaseMs + this.maxClockSkewMs) return { ok: false, reason: 'LEASE_EXPIRY_TOO_FAR' };
    return { ok: true, senderName, localName, target, transactionId, issuedAt, expiresAt };
  }

  receive(sender, data) {
    if (!this._isControlMessage(data)) return false;
    this._prune();
    const action = String(data.action || '');
    if (action === PartyControlAction.ALLOW_PARTY_INVITE) {
      const validation = this._validateLeaseEnvelope(sender, data);
      if (!validation.ok) return this._reject(validation.reason, { sender: cleanName(sender), action, target: cleanName(data.target) });
      this.activeLease = {
        merchantName: validation.senderName,
        target: validation.target,
        transactionId: validation.transactionId,
        issuedAt: validation.issuedAt,
        expiresAt: validation.expiresAt
      };
      this.stats.leasesReceived += 1;
      this._event('PARTY_CONTROL_LEASE_RECEIVED', { transactionId: validation.transactionId, target: validation.target, expiresAt: validation.expiresAt });
      const ack = {
        type: PARTY_CONTROL_TYPE,
        protocol: PARTY_CONTROL_PROTOCOL,
        action: PartyControlAction.LEASE_ACK,
        merchantName: validation.senderName,
        target: validation.target,
        transactionId: validation.transactionId,
        at: this.now()
      };
      try {
        const pending = this._send(validation.senderName, ack);
        this.stats.leaseAcksSent += 1;
        Promise.resolve(pending).catch((error) => {
          this._event('PARTY_CONTROL_ACK_SEND_FAILED', { transactionId: validation.transactionId, message: String(error && error.message || error) }, 'warn', 'ACK_SEND_FAILED');
        });
      } catch (error) {
        this._event('PARTY_CONTROL_ACK_SEND_FAILED', { transactionId: validation.transactionId, message: String(error && error.message || error) }, 'warn', 'ACK_SEND_FAILED');
      }
      return true;
    }

    if (action === PartyControlAction.LEASE_ACK) {
      const localName = this._localName();
      const senderName = cleanName(sender);
      const target = cleanName(data.target);
      const transactionId = cleanTransactionId(data.transactionId);
      if (!localName || !this.merchantName || localName !== this.merchantName) return this._reject('ACK_NOT_ON_MERCHANT', { sender: senderName, target });
      if (!senderName || senderName !== target || !this._isTrusted(senderName) || !this._isTrusted(localName)) return this._reject('ACK_UNTRUSTED_TARGET', { sender: senderName, target });
      if (cleanName(data.merchantName) !== localName || !transactionId) return this._reject('ACK_MISMATCH', { sender: senderName, target });
      const at = finite(data.at);
      if (at == null || Math.abs(this.now() - at) > this.leaseMs + this.maxClockSkewMs) return this._reject('ACK_STALE', { sender: senderName, target });
      this.acks.set(this._ackKey(transactionId, senderName), this.now());
      this.stats.leaseAcksReceived += 1;
      this._event('PARTY_CONTROL_ACK_RECEIVED', { transactionId, target: senderName });
      return true;
    }

    return this._reject('UNKNOWN_CONTROL_ACTION', { action, sender: cleanName(sender) });
  }

  async authorizeIncoming(targetName, transactionId) {
    this._prune();
    const target = cleanName(targetName);
    const tx = cleanTransactionId(transactionId);
    const localName = this._localName();
    if (!target || !tx) throw new Error('INVALID_PARTY_CONTROL_REQUEST');
    if (!this.merchantName || localName !== this.merchantName) throw new Error('MERCHANT_CONTROLLER_REQUIRED');
    if (!this._isTrusted(localName) || !this._isTrusted(target)) throw new Error(`UNTRUSTED_PARTY_CONTROL_TARGET:${target}`);
    if (target === localName) return { authorized: true, target, transactionId: tx, local: true };
    const issuedAt = this.now();
    const expiresAt = issuedAt + this.leaseMs;
    const key = this._ackKey(tx, target);
    this.acks.delete(key);
    await this._send(target, {
      type: PARTY_CONTROL_TYPE,
      protocol: PARTY_CONTROL_PROTOCOL,
      action: PartyControlAction.ALLOW_PARTY_INVITE,
      merchantName: localName,
      target,
      transactionId: tx,
      issuedAt,
      expiresAt
    });
    this.stats.leasesSent += 1;
    this._event('PARTY_CONTROL_LEASE_SENT', { transactionId: tx, target, expiresAt });
    const startedAt = this.now();
    while (this.now() - startedAt <= this.ackTimeoutMs) {
      this._prune();
      if (this.acks.has(key)) {
        this.acks.delete(key);
        return { authorized: true, target, transactionId: tx, expiresAt };
      }
      await sleep(this.pollMs);
    }
    this.stats.ackTimeouts += 1;
    this._event('PARTY_CONTROL_ACK_TIMEOUT', { transactionId: tx, target }, 'warn', 'ACK_TIMEOUT');
    throw new Error(`PARTY_CONTROL_ACK_TIMEOUT:${target}`);
  }

  _validInviteLease(inviter) {
    this._prune();
    const inviterName = cleanName(inviter);
    const localName = this._localName();
    const lease = this.activeLease;
    return !!lease && !!localName && inviterName === lease.merchantName && inviterName === this.merchantName && localName === lease.target && this._isTrusted(inviterName) && this._isTrusted(localName) && lease.expiresAt > this.now();
  }

  _handleInvite(inviter) {
    const inviterName = cleanName(inviter);
    if (!this.merchantName || inviterName !== this.merchantName) return false;
    if (!this._validInviteLease(inviterName)) {
      this.stats.inviteRejected += 1;
      this._event('PARTY_CONTROL_INVITE_REJECTED', { inviter: inviterName, target: this._localName() }, 'warn', 'NO_VALID_CONTROL_LEASE');
      return true;
    }
    const lease = this.activeLease;
    this.activeLease = null;
    if (!this.adapter || typeof this.adapter.command !== 'function'
      || (typeof this.adapter.canCommand === 'function' && !this.adapter.canCommand('accept_party_invite'))) {
      this.stats.acceptFailures += 1;
      this._event('PARTY_CONTROL_INVITE_ACCEPT_FAILED', { inviter: inviterName, transactionId: lease.transactionId }, 'error', 'ACCEPT_PARTY_INVITE_UNAVAILABLE');
      return true;
    }
    try {
      const command = this.adapter.command('accept_party_invite', [inviterName]);
      if (!command.executed) throw new Error(command.reason || (command.shadow ? 'RUNTIME_NOT_ACTIVE' : 'ACCEPT_PARTY_INVITE_REJECTED'));
      const pending = command.value;
      this.stats.inviteAccepted += 1;
      this._event('PARTY_CONTROL_INVITE_ACCEPTED', { inviter: inviterName, target: lease.target, transactionId: lease.transactionId });
      Promise.resolve(pending).catch((error) => {
        this.stats.acceptFailures += 1;
        this._event('PARTY_CONTROL_INVITE_ACCEPT_FAILED', { inviter: inviterName, transactionId: lease.transactionId, message: String(error && error.message || error) }, 'error', 'ACCEPT_PARTY_INVITE_FAILED');
      });
    } catch (error) {
      this.stats.acceptFailures += 1;
      this._event('PARTY_CONTROL_INVITE_ACCEPT_FAILED', { inviter: inviterName, transactionId: lease.transactionId, message: String(error && error.message || error) }, 'error', 'ACCEPT_PARTY_INVITE_FAILED');
    }
    return true;
  }

  install() {
    if (this.installed || !this.root) return false;
    const self = this;
    this.previousOnCm = typeof this.root.on_cm === 'function' ? this.root.on_cm : null;
    this.previousOnPartyInvite = typeof this.root.on_party_invite === 'function' ? this.root.on_party_invite : null;
    this.root.on_cm = function onPartyControlMessage(name, data) {
      if (self._isControlMessage(data)) {
        self.receive(name, data);
        return undefined;
      }
      if (self.previousOnCm) return self.previousOnCm.apply(this, arguments);
      return undefined;
    };
    this.root.on_party_invite = function onPartyControlInvite(name) {
      if (self._handleInvite(name)) return undefined;
      if (self.previousOnPartyInvite) return self.previousOnPartyInvite.apply(this, arguments);
      return undefined;
    };
    this.installed = true;
    return true;
  }

  uninstall() {
    if (!this.installed || !this.root) return false;
    if (this.root.on_cm && this.root.on_cm.name === 'onPartyControlMessage') this.root.on_cm = this.previousOnCm || undefined;
    if (this.root.on_party_invite && this.root.on_party_invite.name === 'onPartyControlInvite') this.root.on_party_invite = this.previousOnPartyInvite || undefined;
    this.installed = false;
    this.activeLease = null;
    this.acks.clear();
    return true;
  }

  status() {
    this._prune();
    return {
      protocol: PARTY_CONTROL_PROTOCOL,
      type: PARTY_CONTROL_TYPE,
      installed: this.installed,
      merchantName: this.merchantName,
      trustedNames: [...this.trustedNames].sort(),
      leaseMs: this.leaseMs,
      ackTimeoutMs: this.ackTimeoutMs,
      activeLease: this.activeLease ? { ...this.activeLease } : null,
      pendingAcks: this.acks.size,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  PartyControlLease,
  PARTY_CONTROL_PROTOCOL,
  PARTY_CONTROL_TYPE,
  PartyControlAction
};
