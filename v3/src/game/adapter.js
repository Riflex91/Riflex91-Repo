'use strict';

const ACTIVE_ALLOWED = new Set(['attack', 'move', 'smart_move', 'town', 'use_hp', 'use_mp', 'use_skill', 'stop']);

function finite(n) { return Number.isFinite(Number(n)) ? Number(n) : null; }

class GameAdapter {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.parent = options.parent || this.root.parent || this.root;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.mode = options.mode === 'active' ? 'active' : 'shadow';
    this.lastSnapshot = null;
  }

  _character() { return this.root.character || this.parent.character || null; }
  _entities() { return this.root.parent && this.root.parent.entities || this.parent.entities || {}; }
  _G() { return this.root.G || this.parent.G || {}; }
  _entityById(id) {
    if (id == null) return null;
    const wanted = String(id);
    return Object.values(this._entities() || {}).find((entity) => entity && String(entity.id) === wanted) || null;
  }

  _objects() {
    const collections = [
      this.root.chests,
      this.root.parent && this.root.parent.chests,
      this.parent.chests,
      this.root.map_objects,
      this.parent.map_objects
    ];
    const out = new Map();
    for (const collection of collections) {
      if (!collection || typeof collection !== 'object') continue;
      for (const [rawId, object] of Object.entries(collection)) {
        if (!object) continue;
        const id = String(object.id || rawId);
        if (out.has(id)) continue;
        out.set(id, {
          id,
          name: object.name || object.type || object.skin || null,
          type: object.type || object.skin || 'object',
          map: object.map || (this._character() && this._character().map) || null,
          x: finite(object.real_x != null ? object.real_x : object.x),
          y: finite(object.real_y != null ? object.real_y : object.y)
        });
      }
    }
    return [...out.values()];
  }

  setMode(mode) {
    if (mode !== 'shadow' && mode !== 'active') throw new Error('mode must be shadow or active');
    const previous = this.mode;
    this.mode = mode;
    if (this.log) this.log.emit({ component: 'adapter', event: 'MODE_CHANGED', severity: mode === 'active' ? 'warn' : 'info', data: { previous, mode } });
    return this.mode;
  }

  snapshot() {
    const c = this._character();
    if (!c) return null;
    const entities = [];
    for (const entity of Object.values(this._entities() || {})) {
      if (!entity || !entity.id) continue;
      entities.push({
        id: String(entity.id),
        name: entity.name || null,
        type: entity.type || null,
        mtype: entity.mtype || null,
        player: entity.player || null,
        npc: entity.npc || entity.type === 'npc' || null,
        map: entity.map || c.map || null,
        x: finite(entity.real_x != null ? entity.real_x : entity.x),
        y: finite(entity.real_y != null ? entity.real_y : entity.y),
        hp: finite(entity.hp),
        max_hp: finite(entity.max_hp),
        target: entity.target || null,
        dead: !!entity.dead
      });
    }
    const inventory = (c.items || []).map((item, index) => item ? ({ index, name: item.name, level: Number(item.level) || 0, q: Number(item.q) || 1, locked: !!item.l, special: !!item.p }) : null);
    const snap = {
      observedAt: this.now(),
      character: {
        name: c.name || 'unknown',
        ctype: c.ctype || 'unknown',
        level: Number(c.level) || 0,
        map: c.map || null,
        x: finite(c.real_x != null ? c.real_x : c.x),
        y: finite(c.real_y != null ? c.real_y : c.y),
        hp: finite(c.hp), max_hp: finite(c.max_hp),
        mp: finite(c.mp), max_mp: finite(c.max_mp),
        range: finite(c.range), speed: finite(c.speed), frequency: finite(c.frequency),
        xp: finite(c.xp), gold: finite(c.gold),
        moving: !!c.moving,
        target: c.target || null,
        rip: !!c.rip,
        inventory
      },
      entities,
      objects: this._objects(),
      party: this._partySnapshot(),
      game: { monstersKnown: Object.keys((this._G().monsters) || {}).length, mapsKnown: Object.keys((this._G().maps) || {}).length }
    };
    this.lastSnapshot = snap;
    return snap;
  }

  _partySnapshot() {
    const party = this.parent.party || {};
    const out = [];
    for (const [name, member] of Object.entries(party)) {
      out.push({ name, type: member && (member.type || member.ctype) || null, level: member && Number(member.level) || null, map: member && member.map || null });
    }
    return out;
  }

  getGameData() { return this._G(); }

  canAttack(targetId) {
    const target = this._entityById(targetId);
    if (!target) return false;
    const fn = this.root.can_attack || this.parent.can_attack;
    if (typeof fn !== 'function') return true;
    try { return fn.call(this.root, target) !== false; } catch (_) { return false; }
  }

  _prepareArgs(action, args) {
    const out = Array.isArray(args) ? args.slice() : [];
    if (action === 'attack' && typeof out[0] === 'string') {
      const target = this._entityById(out[0]);
      if (target) out[0] = target;
    }
    return out;
  }

  command(action, args = []) {
    if (!ACTIVE_ALLOWED.has(action)) {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'ACTION_NOT_ALLOWED_IN_ALPHA', data: { action } });
      return { executed: false, reason: 'ACTION_NOT_ALLOWED_IN_ALPHA' };
    }
    if (this.mode !== 'active') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'SHADOW_COMMAND', data: { action, args: args.map((x) => typeof x === 'object' && x ? (x.id || x.name || '[object]') : x) } });
      return { executed: false, shadow: true };
    }
    const fn = this.root[action] || this.parent[action];
    if (typeof fn !== 'function') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'COMMAND_UNAVAILABLE', data: { action } });
      return { executed: false, reason: 'COMMAND_UNAVAILABLE' };
    }
    try {
      const prepared = this._prepareArgs(action, args);
      const value = fn.apply(this.root, prepared);
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', data: { action } });
      return { executed: true, value };
    } catch (error) {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_FAILED', severity: 'error', reason: String(error && error.message || error), data: { action } });
      return { executed: false, reason: 'COMMAND_FAILED', error };
    }
  }
}

module.exports = { GameAdapter, ACTIVE_ALLOWED };
