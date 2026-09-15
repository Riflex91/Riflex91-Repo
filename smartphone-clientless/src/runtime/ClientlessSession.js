'use strict';

const { ClientlessGameAdapter } = require('./ClientlessGameAdapter');

class ClientlessSession {
  constructor(options = {}) {
    const name = String(options.characterName || '').trim();
    if (!name) throw new Error('CHARACTER_NAME_REQUIRED');
    if (!options.transport) throw new Error('CLIENTLESS_TRANSPORT_REQUIRED');
    this.characterName = name;
    this.role = options.role === 'merchant' ? 'merchant' : 'farmer';
    this.transport = options.transport;
    this.adapter = new ClientlessGameAdapter({ transport: this.transport, log: options.log, now: options.now, mode: options.mode });
    this.connected = false;
    this.startedAt = 0;
    this.lastError = null;
  }

  async start() {
    if (this.connected) return this.status();
    try {
      await Promise.resolve(this.transport.connect({ characterName: this.characterName, role: this.role }));
      this.connected = true;
      this.startedAt = Date.now();
      this.lastError = null;
      return this.status();
    } catch (error) {
      this.lastError = String(error && error.message || error);
      throw error;
    }
  }

  async stop() {
    try { await Promise.resolve(this.transport.disconnect()); }
    finally { this.connected = false; }
  }

  snapshot() { return this.connected ? this.adapter.snapshot() : null; }
  command(action, args) {
    if (!this.connected) return { executed: false, reason: 'CLIENTLESS_SESSION_OFFLINE' };
    return this.adapter.command(action, args);
  }

  status() {
    return {
      characterName: this.characterName,
      role: this.role,
      connected: this.connected,
      startedAt: this.startedAt,
      lastError: this.lastError,
      adapter: this.adapter.status()
    };
  }
}

module.exports = { ClientlessSession };
