'use strict';

const ACTIVE_CHARACTER_STATES = new Set(['self', 'starting', 'loading', 'active', 'code']);
const RUNNING_CHARACTER_STATES = new Set(['self', 'active', 'code']);

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
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
    this.stats = {
      directSent: 0,
      directFailed: 0,
      fallbackSent: 0,
      fallbackFailed: 0,
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

  ownedNames(options = {}) {
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
    return [...new Set(names)].sort();
  }

  isOwned(name, options = {}) {
    const target = cleanName(name);
    return !!target && this.ownedNames(options).includes(target);
  }

  installDirectReceiver(receiverName, handler) {
    const name = cleanName(receiverName);
    if (!name || typeof handler !== 'function' || !this.root) return false;
    this.root[name] = handler;
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
      this._event('ACCOUNT_TRANSPORT_REJECTED', 'warn', 'TARGET_NOT_ACTIVE_OWN_CHARACTER', { target, sender });
      throw new Error(`TARGET_NOT_ACTIVE_OWN_CHARACTER:${target}`);
    }

    const commandCharacter = this._function('command_character');
    if (receiver && typeof commandCharacter === 'function') {
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
    }

    if (!this.fallbackEnabled) throw new Error(`ACCOUNT_TRANSPORT_DIRECT_UNAVAILABLE:${target}`);
    const sendCm = this._function('send_cm');
    if (typeof sendCm !== 'function') throw new Error('SEND_CM_UNAVAILABLE');
    try {
      await Promise.resolve(sendCm.call(this.root, target, payload));
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
      schemaVersion: 1,
      mode: 'same-account-command-character-first',
      localName: this.localName(),
      activeOwnedNames: this.ownedNames(),
      runningOwnedNames: this.ownedNames({ runningOnly: true }),
      fallbackEnabled: this.fallbackEnabled,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  AccountCharacterTransport,
  ACTIVE_CHARACTER_STATES,
  RUNNING_CHARACTER_STATES,
  cleanName
};
