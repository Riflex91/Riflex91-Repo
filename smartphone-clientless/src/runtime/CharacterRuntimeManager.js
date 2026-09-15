'use strict';

const { ClientlessSession } = require('./ClientlessSession');

class CharacterRuntimeManager {
  constructor(options = {}) {
    if (typeof options.transportFactory !== 'function') throw new Error('TRANSPORT_FACTORY_REQUIRED');
    this.transportFactory = options.transportFactory;
    this.log = options.log || null;
    this.sessions = new Map();
  }

  async applySelection(selection = []) {
    const desired = new Map();
    for (const row of selection) {
      const name = String(row && row.characterName || '').trim();
      if (!name) continue;
      desired.set(name, row.role === 'merchant' ? 'merchant' : 'farmer');
    }

    for (const [name, session] of this.sessions) {
      if (!desired.has(name) || desired.get(name) !== session.role) {
        await session.stop();
        this.sessions.delete(name);
      }
    }

    for (const [characterName, role] of desired) {
      if (this.sessions.has(characterName)) continue;
      const transport = this.transportFactory({ characterName, role });
      const session = new ClientlessSession({ characterName, role, transport, log: this.log, mode: 'active' });
      this.sessions.set(characterName, session);
      await session.start();
    }
    return this.status();
  }

  get(characterName) { return this.sessions.get(String(characterName)) || null; }

  async close() {
    await Promise.all([...this.sessions.values()].map((session) => session.stop()));
    this.sessions.clear();
  }

  status() {
    return {
      runtime: 'smartphone-clientless',
      browser: false,
      characters: [...this.sessions.values()].map((session) => session.status())
    };
  }
}

module.exports = { CharacterRuntimeManager };
