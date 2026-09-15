'use strict';

const ACTIVE_ALLOWED = new Set(['attack', 'move', 'smart_move', 'town', 'use_hp', 'use_mp', 'use_hp_or_mp', 'use_skill', 'stop']);

class ClientlessGameAdapter {
  constructor(options = {}) {
    if (!options.transport) throw new Error('CLIENTLESS_TRANSPORT_REQUIRED');
    this.transport = options.transport;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.mode = options.mode === 'shadow' ? 'shadow' : 'active';
    this.lastSnapshot = null;
  }

  setMode(mode) {
    if (mode !== 'shadow' && mode !== 'active') throw new Error('mode must be shadow or active');
    this.mode = mode;
    return mode;
  }

  snapshot() {
    const raw = this.transport.snapshot();
    if (!raw) return null;
    const snapshot = { ...raw, observedAt: raw.observedAt || this.now() };
    this.lastSnapshot = snapshot;
    return snapshot;
  }

  getGameData() {
    return typeof this.transport.getGameData === 'function'
      ? this.transport.getGameData()
      : (this.lastSnapshot && this.lastSnapshot.gameData) || {};
  }

  canAttack(targetId) {
    if (typeof this.transport.canAttack === 'function') return this.transport.canAttack(targetId) !== false;
    const snap = this.lastSnapshot || this.snapshot();
    return !!(snap && Array.isArray(snap.entities) && snap.entities.some((e) => e && String(e.id) === String(targetId) && !e.dead));
  }

  canUseSkill(skillName) {
    return typeof this.transport.canUseSkill === 'function' ? this.transport.canUseSkill(skillName) !== false : true;
  }

  isSkillInRange(targetId, skillName) {
    return typeof this.transport.isSkillInRange === 'function'
      ? this.transport.isSkillInRange(targetId, skillName) !== false
      : true;
  }

  command(action, args = []) {
    if (!ACTIVE_ALLOWED.has(action)) return { executed: false, reason: 'ACTION_NOT_ALLOWED' };
    if (this.mode !== 'active') return { executed: false, shadow: true };
    if (typeof this.transport.command !== 'function') return { executed: false, reason: 'CLIENTLESS_COMMAND_UNAVAILABLE' };
    try {
      const value = this.transport.command(action, Array.isArray(args) ? args : []);
      return { executed: true, value, action };
    } catch (error) {
      if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'clientless-adapter', event: 'COMMAND_FAILED', severity: 'error', reason: String(error && error.message || error), data: { action } });
      return { executed: false, reason: 'COMMAND_FAILED', error };
    }
  }

  status() {
    return {
      runtime: 'smartphone-clientless',
      browser: false,
      mode: this.mode,
      transport: typeof this.transport.status === 'function' ? this.transport.status() : null
    };
  }
}

module.exports = { ClientlessGameAdapter, ACTIVE_ALLOWED };
