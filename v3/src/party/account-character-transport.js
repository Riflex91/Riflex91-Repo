'use strict';

const ACTIVE_CHARACTER_STATES = new Set(['self', 'starting', 'loading', 'active', 'code']);
const RUNNING_CHARACTER_STATES = new Set(['self', 'active', 'code']);
const NAMED_RECEIVER_CM_PROTOCOL = 'aio-v3-named-receiver-v1';

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function uniqueNames(values) {
  return [...new Set((values || []).map(cleanName).filter(Boolean))].sort();
}

function boundedMessage(error) {
  return String(error && error.message || error || 'unknown').slice(0, 240);
}

class AccountCharacterTransport {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.fallbackEnabled = options.fallbackEnabled !== false;
    this.trustedNames = new Set(uniqueNames(options.trustedNames || []));
    this._cmRouterInstalled = false;
    this._cmRouter = null;
    this._cmRouterPrevious = null;
    this._directReceiverNames = new Set();
    this.stats = {
      directSent: 0,
      directFailed: 0,
      directSkippedUnobserved: 0,
      fallbackSent: 0,
      fallbackFailed: 0,
      fallbackReceived: 0,
      fallbackRejected: 0,
      rejectedNotOwned: 0,
      localDelivered: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'account-character-transport', event, severity, reason, data });
  }

  _function(name) {
    return this.root && (this.root[name] || (this.root.parent && this.root.parent[name])) || null;
  }

  localName() {
    const character = this.root && (this.root.character || (this.root.parent && this.root.parent.character));
    return cleanName(character && character.name);
  }

  setTrustedNames(names) {
    this.trustedNames = new Set(uniqueNames(names));
    return [...this.trustedNames].sort();
  }

  trustedRosterNames() {
    return [...this.trustedNames].sort();
  }

  activeCharacters() {
    const fn = this._function('get_active_characters');
    if (typeof fn !== 'function') return null;
    try {
      const value = fn.call(this.root);
      return value && typeof value === 'object' ? { ...value } : null;
    } catch (_) {
      return null;
    }
  }

  activeNames(options = {}) {
    const runningOnly = options.runningOnly === true;
    const allowed = runningOnly ? RUNNING_CHARACTER_STATES : ACTIVE_CHARACTER_STATES;
    const active = this.activeCharacters();
    const local = this.localName();
    if (!active) return local ? [local] : [];
    const names = Object.entries(active)
      .filter(([, state]) => allowed.has(String(state)))
      .map(([name]) => cleanName(name))
      .filter(Boolean);
    if (local && !names.includes(local)) names.push(local);
    return uniqueNames(names);
  }

  ownedNames(options = {}) {
    if (this.trustedNames.size) return this.trustedRosterNames();
    return this.activeNames(options);
  }

  isOwned(name) {
    const target = cleanName(name);
    return !!target && this.ownedNames().includes(target);
  }

  _installCmRouter() {
    if (this._cmRouterInstalled || !this.root) return this._cmRouterInstalled;
    const previous = typeof this.root.on_cm === 'function' ? this.root.on_cm : null;
    const transport = this;
    const router = function aioNamedReceiverOnCm(sender, data) {
      const envelope = data && typeof data === 'object' && data.__aioProtocol === NAMED_RECEIVER_CM_PROTOCOL;
      if (envelope) {
        const receiver = cleanName(data.receiver);
        const senderName = cleanName(sender);
        const trusted = !transport.trustedNames.size || (senderName && transport.trustedNames.has(senderName));
        if (!trusted) {
          transport.stats.fallbackRejected += 1;
          transport._event('ACCOUNT_TRANSPORT_FALLBACK_REJECTED', 'warn', 'SENDER_NOT_TRUSTED_OWN_CHARACTER', { sender: senderName, receiver });
          return false;
        }
        if (receiver && typeof transport.root[receiver] === 'function') {
          transport.root[receiver](senderName || sender, data.payload);
          transport.stats.fallbackReceived += 1;
          return true;
        }
        transport.stats.fallbackRejected += 1;
        transport._event('ACCOUNT_TRANSPORT_FALLBACK_REJECTED', 'warn', 'NAMED_RECEIVER_UNAVAILABLE', { sender: senderName, receiver });
        return false;
      }
      if (previous) return previous.apply(this, arguments);
      return undefined;
    };
    this.root.on_cm = router;
    this._cmRouter = router;
    this._cmRouterPrevious = previous;
    this._cmRouterInstalled = true;
    return true;
  }

  _uninstallCmRouter() {
    if (!this._cmRouterInstalled || !this.root) return false;
    if (this.root.on_cm !== this._cmRouter) return false;
    this.root.on_cm = this._cmRouterPrevious || undefined;
    this._cmRouterInstalled = false;
    this._cmRouter = null;
    this._cmRouterPrevious = null;
    return true;
  }

  installDirectReceiver(receiverName, handler) {
    const name = cleanName(receiverName);
    if (!name || typeof handler !== 'function' || !this.root) return false;
    this.root[name] = handler;
    this._directReceiverNames.add(name);
    this._installCmRouter();
    return true;
  }

  uninstallDirectReceiver(receiverName, handler = null, previous = undefined) {
    const name = cleanName(receiverName);
    if (!name || !this.root) return false;
    if (handler && this.root[name] !== handler) return false;
    if (previous === undefined) {
      try { delete this.root[name]; } catch (_) { this.root[name] = undefined; }
    } else {
      this.root[name] = previous;
    }
    this._directReceiverNames.delete(name);
    if (!this._directReceiverNames.size) this._uninstallCmRouter();
    return true;
  }

  _directCode(receiverName, sender, payload) {
    const receiver = JSON.stringify(String(receiverName));
    const from = JSON.stringify(String(sender));
    const body = JSON.stringify(payload == null ? null : payload);
    return `if(globalThis[${receiver}]){globalThis[${receiver}](${from},${body});}`;
  }

  async send(targetName, payload, options = {}) {
    const target = cleanName(targetName);
    const sender = cleanName(options.sender) || this.localName();
    const receiver = cleanName(options.receiver);
    if (!target || !sender) throw new Error('ACCOUNT_TRANSPORT_INVALID_ENDPOINT');

    const local = this.localName();
    if (target === local && receiver && this.root && typeof this.root[receiver] === 'function') {
      this.root[receiver](sender, payload);
      this.stats.localDelivered += 1;
      return { delivered: true, transport: 'local', target, sender };
    }

    if (!this.isOwned(target)) {
      this.stats.rejectedNotOwned += 1;
      this._event('ACCOUNT_TRANSPORT_REJECTED', 'warn', 'TARGET_NOT_TRUSTED_OWN_CHARACTER', { target, sender });
      throw new Error(`TARGET_NOT_TRUSTED_OWN_CHARACTER:${target}`);
    }

    // Adventure Land can surface "Character not found" as an in-game message
    // without rejecting the JS call. Therefore command_character is only safe to
    // use when get_active_characters() actually observes this target in this runner.
    const observedActive = this.activeNames();
    const directObserved = observedActive.includes(target);
    const commandCharacter = this._function('command_character');
    if (receiver && typeof commandCharacter === 'function' && directObserved) {
      try {
        const code = this._directCode(receiver, sender, payload);
        await Promise.resolve(commandCharacter.call(this.root, target, code));
        this.stats.directSent += 1;
        return { delivered: true, transport: 'command_character', target, sender };
      } catch (error) {
        this.stats.directFailed += 1;
        this._event('ACCOUNT_TRANSPORT_DIRECT_FAILED', 'warn', 'COMMAND_CHARACTER_FAILED', {
          target,
          sender,
          message: boundedMessage(error)
        });
      }
    } else if (receiver && typeof commandCharacter === 'function' && !directObserved) {
      this.stats.directSkippedUnobserved += 1;
      this._event('ACCOUNT_TRANSPORT_DIRECT_SKIPPED', 'info', 'TARGET_NOT_OBSERVED_ACTIVE', {
        target,
        sender,
        observedActive
      });
    }

    if (!this.fallbackEnabled) throw new Error(`ACCOUNT_TRANSPORT_DIRECT_UNAVAILABLE:${target}`);
    const sendCm = this._function('send_cm');
    if (typeof sendCm !== 'function') throw new Error('SEND_CM_UNAVAILABLE');
    try {
      const body = receiver
        ? { __aioProtocol: NAMED_RECEIVER_CM_PROTOCOL, receiver, payload: payload == null ? null : payload }
        : payload;
      await Promise.resolve(sendCm.call(this.root, target, body));
      this.stats.fallbackSent += 1;
      return { delivered: true, transport: 'send_cm', target, sender };
    } catch (error) {
      this.stats.fallbackFailed += 1;
      this._event('ACCOUNT_TRANSPORT_FALLBACK_FAILED', 'warn', 'SEND_CM_FAILED', {
        target,
        sender,
        message: boundedMessage(error)
      });
      throw error;
    }
  }

  status() {
    return {
      schemaVersion: 3,
      mode: 'observed-active-command-character-else-addressed-cm',
      localName: this.localName(),
      trustSource: this.trustedNames.size ? 'explicit-roster' : 'get_active_characters-fallback',
      trustedNames: this.trustedRosterNames(),
      observedActiveNames: this.activeNames(),
      observedRunningNames: this.activeNames({ runningOnly: true }),
      activeOwnedNames: this.ownedNames(),
      runningOwnedNames: this.ownedNames({ runningOnly: true }),
      directRequiresObservedActive: true,
      fallbackEnabled: this.fallbackEnabled,
      namedReceiverCmProtocol: NAMED_RECEIVER_CM_PROTOCOL,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  AccountCharacterTransport,
  ACTIVE_CHARACTER_STATES,
  RUNNING_CHARACTER_STATES,
  NAMED_RECEIVER_CM_PROTOCOL,
  cleanName,
  uniqueNames
};
