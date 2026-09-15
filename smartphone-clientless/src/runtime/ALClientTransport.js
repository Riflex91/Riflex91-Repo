'use strict';

function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function values(collection) {
  if (!collection) return [];
  if (collection instanceof Map) return [...collection.values()];
  if (Array.isArray(collection)) return collection;
  return Object.values(collection);
}

class ALClientTransport {
  constructor(options = {}) {
    this.credentials = options.credentials || {};
    this.region = options.region || 'EU';
    this.identifier = options.identifier || 'I';
    this.characterName = options.characterName || null;
    this.role = options.role || 'farmer';
    this.AL = options.AL || null;
    this.character = null;
    this.connectedAt = 0;
    this.lastError = null;
  }

  async _library() {
    if (this.AL) return this.AL;
    const imported = await import('alclient');
    this.AL = imported.default || imported;
    return this.AL;
  }

  async _authenticate(AL) {
    const Game = AL.Game;
    if (Game.user) return;
    const { email, password, userID, userAuth, secure = true } = this.credentials;
    if (userID && userAuth) {
      Game.user = { userID: String(userID), userAuth: String(userAuth), secure: secure !== false };
      await Game.updateServersAndCharacters();
      return;
    }
    if (!email) throw new Error('CLIENTLESS_CREDENTIALS_REQUIRED');
    await Game.login(String(email), password == null ? undefined : String(password), undefined, secure !== false);
  }

  async connect({ characterName, role } = {}) {
    const AL = await this._library();
    this.characterName = characterName || this.characterName;
    this.role = role || this.role;
    if (!this.characterName) throw new Error('CHARACTER_NAME_REQUIRED');
    try {
      await this._authenticate(AL);
      if (!AL.Game.G) await AL.Game.getGData(false, true);
      if (AL.Pathfinder && typeof AL.Pathfinder.prepare === 'function') await AL.Pathfinder.prepare(AL.Game.G);
      this.character = await AL.Game.startCharacter(this.characterName, this.region, this.identifier);
      this.connectedAt = Date.now();
      this.lastError = null;
      return this.status();
    } catch (error) {
      this.lastError = String(error && error.message || error);
      throw error;
    }
  }

  disconnect() {
    if (this.character && typeof this.character.disconnect === 'function') this.character.disconnect();
    this.character = null;
  }

  snapshot() {
    const c = this.character;
    if (!c || c.ready === false) return null;
    const entities = values(c.entities).map((e) => ({
      id: String(e.id), name: e.name || null, type: e.type || null, mtype: e.mtype || null,
      player: e.player || null, npc: e.npc || null, map: e.map || c.map || null,
      x: finite(e.x), y: finite(e.y), hp: finite(e.hp), max_hp: finite(e.max_hp),
      target: e.target || null, dead: !!e.dead
    }));
    const objects = values(c.chests).map((o) => ({ id: String(o.id), name: o.name || o.type || 'chest', type: o.type || 'chest', map: o.map || c.map || null, x: finite(o.x), y: finite(o.y) }));
    const party = c.partyData && c.partyData.party
      ? Object.entries(c.partyData.party).map(([name, p]) => ({ name, type: p.type || p.ctype || null, level: finite(p.level), map: p.map || null }))
      : [];
    const inventory = (Array.isArray(c.items) ? c.items : []).map((item, index) => item ? ({ index, name: item.name, level: Number(item.level) || 0, q: Number(item.q) || 1, locked: !!item.l, special: !!item.p }) : null);
    return {
      observedAt: Date.now(),
      character: {
        name: c.name || c.id || this.characterName, ctype: c.ctype || 'unknown', level: Number(c.level) || 0,
        map: c.map || null, x: finite(c.x), y: finite(c.y), hp: finite(c.hp), max_hp: finite(c.max_hp),
        mp: finite(c.mp), max_mp: finite(c.max_mp), range: finite(c.range), speed: finite(c.speed), frequency: finite(c.frequency),
        xp: finite(c.xp), gold: finite(c.gold), moving: !!c.moving, target: c.target || null, rip: !!c.rip,
        isize: Number(c.isize) || inventory.length, inventory
      },
      entities, objects, party,
      game: { monstersKnown: Object.keys((this.AL && this.AL.Game.G && this.AL.Game.G.monsters) || {}).length, mapsKnown: Object.keys((this.AL && this.AL.Game.G && this.AL.Game.G.maps) || {}).length },
      gameData: this.AL && this.AL.Game.G || {}
    };
  }

  getGameData() { return this.AL && this.AL.Game.G || {}; }
  canAttack(targetId) {
    const c = this.character;
    const target = c && c.entities && (c.entities.get ? c.entities.get(String(targetId)) : c.entities[String(targetId)]);
    if (!c || !target) return false;
    if (typeof c.canUse === 'function' && !c.canUse('attack')) return false;
    return true;
  }
  canUseSkill(skillName) { return !!this.character && (typeof this.character.canUse !== 'function' || this.character.canUse(skillName)); }
  isSkillInRange(targetId, skillName) {
    const c = this.character;
    const target = c && c.entities && (c.entities.get ? c.entities.get(String(targetId)) : c.entities[String(targetId)]);
    if (!c || !target) return false;
    if (typeof c.isInRange === 'function') return c.isInRange(target, skillName);
    const range = Number((this.getGameData().skills || {})[skillName]?.range || c.range || 0);
    return Math.hypot(Number(c.x) - Number(target.x), Number(c.y) - Number(target.y)) <= range;
  }

  _fire(value) {
    if (value && typeof value.then === 'function') value.catch((error) => { this.lastError = String(error && error.message || error); });
    return value;
  }
  _potion(kind) {
    const c = this.character;
    const prefix = kind === 'hp' ? 'hpot' : 'mpot';
    const item = (c.items || []).find((x) => x && String(x.name).startsWith(prefix));
    if (item && typeof c.usePotion === 'function') return this._fire(c.usePotion(item.name));
    if (typeof c.useSkill === 'function') return this._fire(c.useSkill(kind === 'hp' ? 'regen_hp' : 'regen_mp'));
    throw new Error('POTION_COMMAND_UNAVAILABLE');
  }
  command(action, args = []) {
    const c = this.character;
    if (!c) throw new Error('CLIENTLESS_SESSION_OFFLINE');
    switch (action) {
      case 'attack': return this._fire(c.basicAttack(String(args[0])));
      case 'move': return this._fire(c.move(Number(args[0]), Number(args[1])));
      case 'smart_move': return this._fire(c.smartMove(args[0]));
      case 'use_skill': return this._fire(c.useSkill(args[0], args[1]));
      case 'use_hp': return this._potion('hp');
      case 'use_mp': return this._potion('mp');
      case 'use_hp_or_mp': return Number(c.hp) / Math.max(1, Number(c.max_hp)) < Number(c.mp) / Math.max(1, Number(c.max_mp)) ? this._potion('hp') : this._potion('mp');
      case 'town':
        if (typeof c.town === 'function') return this._fire(c.town());
        if (typeof c.warpToTown === 'function') return this._fire(c.warpToTown());
        throw new Error('TOWN_COMMAND_UNAVAILABLE');
      case 'stop':
        if (typeof c.stopSmartMove === 'function') return this._fire(c.stopSmartMove());
        if (typeof c.stop === 'function') return this._fire(c.stop());
        return false;
      default: throw new Error(`ACTION_NOT_SUPPORTED:${action}`);
    }
  }

  status() {
    const c = this.character;
    return { provider: 'alclient', browser: false, connected: !!c && c.ready !== false, characterName: this.characterName, role: this.role, region: this.region, identifier: this.identifier, connectedAt: this.connectedAt, lastError: this.lastError };
  }
}

module.exports = { ALClientTransport };
