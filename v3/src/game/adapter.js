'use strict';

const COMMAND_CATALOG = Object.freeze({
  attack: Object.freeze({ family: 'combat', mutation: true, outcome: 'observed' }),
  move: Object.freeze({ family: 'movement', mutation: true, outcome: 'observed' }),
  smart_move: Object.freeze({ family: 'movement', mutation: true, outcome: 'observed' }),
  town: Object.freeze({ family: 'movement', mutation: true, outcome: 'observed' }),
  use_hp: Object.freeze({ family: 'recovery', mutation: true, outcome: 'observed' }),
  use_mp: Object.freeze({ family: 'recovery', mutation: true, outcome: 'observed' }),
  use_hp_or_mp: Object.freeze({ family: 'recovery', mutation: true, outcome: 'observed' }),
  use_skill: Object.freeze({ family: 'skill', mutation: true, outcome: 'observed' }),
  stop: Object.freeze({ family: 'movement', mutation: true, outcome: 'observed' }),
  loot: Object.freeze({ family: 'loot', mutation: true, outcome: 'domain' }),
  open_stand: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  close_stand: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  send_item: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  equip: Object.freeze({ family: 'equipment', mutation: true, outcome: 'domain' }),
  unequip: Object.freeze({ family: 'equipment', mutation: true, outcome: 'domain' }),
  send_gold: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  sell: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  bank_retrieve: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  bank_store: Object.freeze({ family: 'merchant', mutation: true, outcome: 'domain' }),
  start_character: Object.freeze({ family: 'party-control', mutation: true, outcome: 'domain' }),
  stop_character: Object.freeze({ family: 'party-control', mutation: true, outcome: 'domain' }),
  send_party_invite: Object.freeze({ family: 'party-control', mutation: true, outcome: 'domain' }),
  accept_party_invite: Object.freeze({ family: 'party-control', mutation: true, outcome: 'domain' }),
  leave_party: Object.freeze({ family: 'party-control', mutation: true, outcome: 'domain' }),
  send_cm: Object.freeze({ family: 'account-communication', mutation: true, outcome: 'domain' }),
  command_character: Object.freeze({ family: 'account-communication', mutation: true, outcome: 'domain' })
});

const ACTIVE_ALLOWED = new Set(Object.keys(COMMAND_CATALOG));

function commandDefinition(action) {
  return Object.prototype.hasOwnProperty.call(COMMAND_CATALOG, action) ? COMMAND_CATALOG[action] : null;
}

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
    const rawItems = Array.isArray(c.items) ? c.items : [];
    const reportedIsize = finite(c.isize);
    const inventorySize = reportedIsize == null
      ? rawItems.length
      : Math.max(0, Math.floor(reportedIsize));
    const inventory = rawItems.slice(0, inventorySize).map((item, index) => item ? ({
      index,
      name: item.name,
      level: Number(item.level) || 0,
      q: Number(item.q) || 1,
      locked: !!item.l,
      special: !!item.p
    }) : null);
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
        isize: inventorySize,
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

  canUseSkill(skillName) {
    const G = this._G();
    const skill = G.skills && G.skills[skillName];
    const c = this._character();
    if (!skill || !c) return false;
    if (Array.isArray(skill.class) && !skill.class.includes(c.ctype)) return false;
    if (Number(skill.level) > 0 && Number(c.level) < Number(skill.level)) return false;
    if (Number(skill.mp) > 0 && Number(c.mp) < Number(skill.mp)) return false;

    if (Array.isArray(skill.wtype) && skill.wtype.length) {
      const slots = c.slots || {};
      const equippedTypes = ['mainhand', 'offhand']
        .map((slot) => slots[slot] && slots[slot].name)
        .filter(Boolean)
        .map((name) => G.items && G.items[name] && G.items[name].wtype)
        .filter(Boolean);
      if (equippedTypes.length && !equippedTypes.some((wtype) => skill.wtype.includes(wtype))) return false;
    }

    const canUse = this.root.can_use || this.parent.can_use;
    if (typeof canUse === 'function') {
      try { return canUse.call(this.root, skillName) !== false; } catch (_) { return false; }
    }
    const onCooldown = this.root.is_on_cooldown || this.parent.is_on_cooldown;
    if (typeof onCooldown === 'function') {
      try { return onCooldown.call(this.root, skillName) !== true; } catch (_) { return false; }
    }
    return true;
  }

  isSkillInRange(targetId, skillName) {
    const target = this._entityById(targetId);
    const c = this._character();
    const G = this._G();
    const skill = G.skills && G.skills[skillName];
    if (!target || !c || !skill) return false;

    const fn = this.root.is_in_range || this.parent.is_in_range;
    if (typeof fn === 'function') {
      try { return fn.call(this.root, target, skillName) !== false; } catch (_) { return false; }
    }

    const cx = finite(c.real_x != null ? c.real_x : c.x);
    const cy = finite(c.real_y != null ? c.real_y : c.y);
    const tx = finite(target.real_x != null ? target.real_x : target.x);
    const ty = finite(target.real_y != null ? target.real_y : target.y);
    if (cx == null || cy == null || tx == null || ty == null) return false;

    let range = finite(skill.range);
    if (range == null) {
      const baseRange = finite(c.range);
      if (baseRange == null) return false;
      range = baseRange * (finite(skill.range_multiplier) || 1);
    }
    return Math.hypot(cx - tx, cy - ty) <= range;
  }

  _prepareArgs(action, args) {
    const out = Array.isArray(args) ? args.slice() : [];
    if (action === 'attack' && typeof out[0] === 'string') {
      const target = this._entityById(out[0]);
      if (target) out[0] = target;
    }
    if (action === 'use_skill' && typeof out[1] === 'string') {
      const target = this._entityById(out[1]);
      if (target) out[1] = target;
    }
    return out;
  }

  commandCatalog() {
    return Object.fromEntries(Object.entries(COMMAND_CATALOG).map(([action, definition]) => [action, { ...definition }]));
  }

  canCommand(action) {
    if (!commandDefinition(action)) return false;
    if (typeof this.root[action] === 'function' || typeof this.parent[action] === 'function') return true;
    if (action === 'use_hp' || action === 'use_mp') {
      return typeof this.root.use_hp_or_mp === 'function' || typeof this.parent.use_hp_or_mp === 'function';
    }
    return false;
  }

  command(action, args = []) {
    const definition = commandDefinition(action);
    if (!definition) {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'ACTION_NOT_ALLOWED_IN_ALPHA', data: { action } });
      return { executed: false, reason: 'ACTION_NOT_ALLOWED_IN_ALPHA' };
    }
    if (this.mode !== 'active') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'SHADOW_COMMAND', data: { action, args: args.map((x) => typeof x === 'object' && x ? (x.id || x.name || '[object]') : x) } });
      return { executed: false, shadow: true };
    }
    let resolvedAction = action;
    let owner = typeof this.root[action] === 'function' ? this.root : this.parent;
    let fn = owner && owner[action];
    if (typeof fn !== 'function' && (action === 'use_hp' || action === 'use_mp')) {
      resolvedAction = 'use_hp_or_mp';
      owner = typeof this.root.use_hp_or_mp === 'function' ? this.root : this.parent;
      fn = owner && owner.use_hp_or_mp;
    }
    if (typeof fn !== 'function') {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_REJECTED', severity: 'warn', reason: 'COMMAND_UNAVAILABLE', data: { action, resolvedAction } });
      return { executed: false, reason: 'COMMAND_UNAVAILABLE', action, resolvedAction };
    }
    try {
      const prepared = this._prepareArgs(resolvedAction, args);
      const value = fn.apply(owner, prepared);
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_EXECUTED', data: { action, resolvedAction, family: definition.family } });
      return { executed: true, value, action, resolvedAction, family: definition.family, outcome: definition.outcome };
    } catch (error) {
      if (this.log) this.log.emit({ component: 'adapter', event: 'COMMAND_FAILED', severity: 'error', reason: String(error && error.message || error), data: { action } });
      return { executed: false, reason: 'COMMAND_FAILED', error };
    }
  }
}

module.exports = { GameAdapter, ACTIVE_ALLOWED, COMMAND_CATALOG, commandDefinition };
