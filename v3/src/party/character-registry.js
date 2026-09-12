'use strict';

const REGISTRY_SCHEMA_VERSION = 1;
const REGISTRY_MODE = 'observation-only';
const SOURCE_CONFIDENCE = Object.freeze({ configured: 0.35, party: 0.75, visible: 0.9, self: 1 });
const SOURCE_RANK = Object.freeze({ configured: 1, party: 2, visible: 3, self: 4 });
const STAT_KEYS = Object.freeze([
  'attack', 'armor', 'resistance', 'range', 'speed', 'frequency',
  'evasion', 'reflection', 'crit', 'critdamage', 'lifesteal', 'manasteal',
  'dreturn', 'courage', 'mcourage'
]);

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp01(value) {
  const number = finite(value);
  if (number == null) return 0;
  return Math.max(0, Math.min(1, number));
}

function normalizeName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function normalizeClass(value) {
  const ctype = String(value == null ? '' : value).trim().toLowerCase();
  return ctype || null;
}

function cloneJson(value, fallback) {
  if (value == null) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function normalizeEquipment(equipment, maxSlots = 32) {
  if (!equipment || typeof equipment !== 'object' || Array.isArray(equipment)) return {};
  const out = {};
  const keys = Object.keys(equipment).sort().slice(0, maxSlots);
  for (const slot of keys) {
    const item = equipment[slot];
    if (!item || typeof item !== 'object') continue;
    out[slot] = {
      name: item.name || null,
      level: Math.max(0, finite(item.level) == null ? 0 : finite(item.level)),
      locked: !!(item.locked || item.l),
      special: !!(item.special || item.p)
    };
  }
  return out;
}

function normalizeInventory(inventory, maxItems = 80) {
  if (!Array.isArray(inventory)) return [];
  const out = [];
  for (const item of inventory) {
    if (!item || typeof item !== 'object') continue;
    out.push({
      index: Number.isFinite(Number(item.index)) ? Number(item.index) : null,
      name: item.name || null,
      level: Math.max(0, finite(item.level) == null ? 0 : finite(item.level)),
      q: Math.max(1, finite(item.q) == null ? 1 : finite(item.q)),
      locked: !!(item.locked || item.l),
      special: !!(item.special || item.p)
    });
    if (out.length >= maxItems) break;
  }
  return out;
}

function summarizeSupplies(inventory) {
  const byName = {};
  let hpPotions = 0;
  let mpPotions = 0;
  for (const item of inventory || []) {
    if (!item || !item.name) continue;
    const name = String(item.name).toLowerCase();
    const quantity = Math.max(1, finite(item.q) == null ? 1 : finite(item.q));
    if (/^hpot/.test(name)) hpPotions += quantity;
    if (/^mpot/.test(name)) mpPotions += quantity;
    if (/^(hpot|mpot)/.test(name)) byName[item.name] = (byName[item.name] || 0) + quantity;
  }
  return { hpPotions, mpPotions, byName };
}

function normalizeStats(stats, maxKeys = 64) {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return {};
  const out = {};
  for (const key of Object.keys(stats).sort().slice(0, maxKeys)) {
    const value = finite(stats[key]);
    if (value != null) out[key] = value;
  }
  return out;
}

function normalizeSupplies(supplies) {
  if (!supplies || typeof supplies !== 'object' || Array.isArray(supplies)) {
    return { hpPotions: 0, mpPotions: 0, byName: {} };
  }
  const byName = {};
  if (supplies.byName && typeof supplies.byName === 'object' && !Array.isArray(supplies.byName)) {
    for (const key of Object.keys(supplies.byName).sort().slice(0, 32)) {
      const value = finite(supplies.byName[key]);
      if (value != null && value >= 0) byName[key] = value;
    }
  }
  return {
    hpPotions: Math.max(0, finite(supplies.hpPotions) == null ? 0 : finite(supplies.hpPotions)),
    mpPotions: Math.max(0, finite(supplies.mpPotions) == null ? 0 : finite(supplies.mpPotions)),
    byName
  };
}

function extractStats(character) {
  const out = {};
  for (const key of STAT_KEYS) {
    const value = finite(character && character[key]);
    if (value != null) out[key] = value;
  }
  return out;
}

function levelUnlockedSkills(ctype, level, gameData, maxSkills = 128) {
  const resolvedClass = normalizeClass(ctype);
  const resolvedLevel = Math.max(0, finite(level) == null ? 0 : finite(level));
  const skills = gameData && gameData.skills;
  if (!resolvedClass || !skills || typeof skills !== 'object') return [];
  const out = [];
  for (const [name, skill] of Object.entries(skills)) {
    if (!skill || typeof skill !== 'object') continue;
    const classes = Array.isArray(skill.class) ? skill.class : skill.class ? [skill.class] : [];
    if (!classes.map((value) => String(value).toLowerCase()).includes(resolvedClass)) continue;
    const requiredLevel = skill.level == null ? 0 : finite(skill.level);
    if (requiredLevel == null || requiredLevel > resolvedLevel) continue;
    out.push(String(name));
    if (out.length >= maxSkills) break;
  }
  return out.sort();
}

function materialView(record) {
  return JSON.stringify({
    ctype: record.ctype,
    level: record.level,
    map: record.map,
    online: record.online,
    available: record.available,
    dead: record.dead,
    primarySource: record.primarySource
  });
}

class CharacterRegistry {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(4, Math.min(128, Number(options.capacity) || 32));
    this.staleAfterMs = Math.max(1000, Math.min(10 * 60 * 1000, Number(options.staleAfterMs) || 15000));
    this.maxInventoryItems = Math.max(8, Math.min(160, Number(options.maxInventoryItems) || 80));
    this.records = new Map();
    this.stats = { observations: 0, added: 0, materialUpdates: 0, rejected: 0, evicted: 0 };
    this.lastObservedAt = null;
    this.seedRoster(options.roster || []);
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'party-registry', event, severity, reason, data });
  }

  _sourceRank(source) {
    return SOURCE_RANK[source] || 0;
  }

  _makeRecord(name, at) {
    return {
      name,
      ctype: null,
      level: 0,
      map: null,
      x: null,
      y: null,
      online: null,
      available: null,
      dead: null,
      gear: {},
      stats: {},
      skillUnlocks: [],
      inventory: [],
      supplies: { hpPotions: 0, mpPotions: 0, byName: {} },
      primarySource: 'configured',
      primarySourceRank: 0,
      sources: [],
      stateConfidence: 0,
      firstObservedAt: at,
      lastSeenAt: null,
      lastUpdatedAt: at
    };
  }

  _evictFor(source, incomingName) {
    if (this.records.size < this.capacity) return true;
    const incomingRank = this._sourceRank(source);
    const candidates = [...this.records.values()]
      .filter((record) => record.name !== incomingName && record.primarySource !== 'self')
      .sort((a, b) => {
        if (a.primarySourceRank !== b.primarySourceRank) return a.primarySourceRank - b.primarySourceRank;
        return (a.lastUpdatedAt || 0) - (b.lastUpdatedAt || 0);
      });
    const victim = candidates[0];
    if (!victim || (victim.primarySourceRank > incomingRank && source !== 'self')) return false;
    this.records.delete(victim.name);
    this.stats.evicted += 1;
    this._event('CHARACTER_REGISTRY_MEMBER_EVICTED', { name: victim.name, source: victim.primarySource }, 'warn', 'REGISTRY_CAPACITY');
    return true;
  }

  _merge(observation, source, options = {}) {
    const name = normalizeName(observation && observation.name);
    if (!name) {
      this.stats.rejected += 1;
      return null;
    }
    const at = finite(options.at) == null ? this.now() : Number(options.at);
    let record = this.records.get(name);
    const isNew = !record;
    if (!record) {
      if (!this._evictFor(source, name)) {
        this.stats.rejected += 1;
        this._event('CHARACTER_REGISTRY_OBSERVATION_REJECTED', { name, source }, 'warn', 'REGISTRY_CAPACITY');
        return null;
      }
      record = this._makeRecord(name, at);
      this.records.set(name, record);
    }

    const before = materialView(record);
    const rank = this._sourceRank(source);
    const ctype = normalizeClass(observation.ctype || observation.type);
    const level = finite(observation.level);
    const x = finite(observation.x);
    const y = finite(observation.y);

    if (ctype) record.ctype = ctype;
    if (level != null) record.level = Math.max(0, level);
    if (observation.map != null) record.map = String(observation.map);
    if (x != null) record.x = x;
    if (y != null) record.y = y;
    if (typeof observation.online === 'boolean') record.online = observation.online;
    if (typeof observation.available === 'boolean') record.available = observation.available;
    if (typeof observation.dead === 'boolean') {
      record.dead = observation.dead;
      if (observation.online === true || options.live === true) record.available = !observation.dead;
    }

    if (observation.gear && typeof observation.gear === 'object') {
      record.gear = normalizeEquipment(observation.gear);
    }
    if (observation.stats && typeof observation.stats === 'object') {
      record.stats = { ...record.stats, ...normalizeStats(observation.stats) };
    }
    if (Array.isArray(observation.skillUnlocks)) {
      record.skillUnlocks = [...new Set(observation.skillUnlocks.map(String))].sort().slice(0, 128);
    }
    if (Array.isArray(observation.inventory)) {
      record.inventory = normalizeInventory(observation.inventory, this.maxInventoryItems);
      record.supplies = summarizeSupplies(record.inventory);
    }
    if (observation.supplies && typeof observation.supplies === 'object') {
      record.supplies = normalizeSupplies(observation.supplies);
    }

    if (!record.sources.includes(source)) record.sources.push(source);
    record.sources.sort((a, b) => this._sourceRank(b) - this._sourceRank(a));
    if (rank >= record.primarySourceRank) {
      record.primarySource = source;
      record.primarySourceRank = rank;
    }
    record.stateConfidence = Math.max(record.stateConfidence, clamp01(options.confidence == null ? SOURCE_CONFIDENCE[source] : options.confidence));
    if (options.live === true || observation.online === true) record.lastSeenAt = at;
    record.lastUpdatedAt = at;

    if (isNew) {
      this.stats.added += 1;
      this._event('CHARACTER_REGISTRY_MEMBER_ADDED', { name, ctype: record.ctype, source: record.primarySource });
    } else if (before !== materialView(record)) {
      this.stats.materialUpdates += 1;
      this._event('CHARACTER_REGISTRY_MEMBER_CHANGED', { name, ctype: record.ctype, level: record.level, map: record.map, source: record.primarySource });
    }
    return record;
  }

  seedRoster(roster) {
    if (!Array.isArray(roster)) return this.status();
    const at = this.now();
    for (const descriptor of roster) {
      const item = typeof descriptor === 'string' ? { name: descriptor } : descriptor;
      if (!item || typeof item !== 'object') continue;
      this._merge({
        name: item.name,
        ctype: item.ctype || item.type,
        level: item.level,
        map: item.map,
        online: typeof item.online === 'boolean' ? item.online : undefined,
        available: typeof item.available === 'boolean' ? item.available : undefined,
        gear: item.gear,
        stats: item.stats,
        skillUnlocks: item.skillUnlocks,
        inventory: item.inventory,
        supplies: item.supplies
      }, 'configured', { at, confidence: item.stateConfidence == null ? SOURCE_CONFIDENCE.configured : item.stateConfidence, live: item.online === true });
    }
    return this.status();
  }

  observe(context = {}) {
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return this.status();
    const at = finite(snapshot.observedAt) == null ? this.now() : Number(snapshot.observedAt);
    const gameData = context.gameData || {};
    const self = snapshot.character;
    const liveCharacter = context.liveCharacter && typeof context.liveCharacter === 'object' ? context.liveCharacter : null;
    const partyNames = new Set((snapshot.party || []).map((member) => normalizeName(member && member.name)).filter(Boolean));
    partyNames.add(normalizeName(self.name));

    for (const member of snapshot.party || []) {
      if (!member || !member.name || member.name === self.name) continue;
      this._merge({
        name: member.name,
        ctype: member.ctype || member.type,
        level: member.level,
        map: member.map,
        online: true,
        skillUnlocks: levelUnlockedSkills(member.ctype || member.type, member.level, gameData)
      }, 'party', { at, live: true });
    }

    for (const entity of snapshot.entities || []) {
      if (!entity || !entity.name) continue;
      const entityName = normalizeName(entity.name);
      const playerLike = !!entity.player || entity.type === 'character' || !!entity.ctype || partyNames.has(entityName);
      if (!playerLike || entityName === self.name) continue;
      this._merge({
        name: entityName,
        ctype: entity.ctype,
        level: entity.level,
        map: entity.map,
        x: entity.x,
        y: entity.y,
        online: true,
        dead: typeof entity.dead === 'boolean' ? entity.dead : undefined,
        stats: {
          hp: finite(entity.hp), max_hp: finite(entity.max_hp),
          mp: finite(entity.mp), max_mp: finite(entity.max_mp)
        },
        skillUnlocks: entity.ctype && finite(entity.level) != null ? levelUnlockedSkills(entity.ctype, entity.level, gameData) : null
      }, 'visible', { at, live: true });
    }

    const selfSource = liveCharacter ? { ...liveCharacter, ...self } : self;
    const rawInventory = Array.isArray(self.inventory)
      ? self.inventory
      : liveCharacter && Array.isArray(liveCharacter.items)
        ? liveCharacter.items.map((item, index) => item ? ({ index, ...item }) : null)
        : [];
    const inventory = normalizeInventory(rawInventory, this.maxInventoryItems);
    this._merge({
      name: self.name || (liveCharacter && liveCharacter.name),
      ctype: self.ctype || (liveCharacter && liveCharacter.ctype),
      level: self.level != null ? self.level : liveCharacter && liveCharacter.level,
      map: self.map || (liveCharacter && liveCharacter.map),
      x: self.x != null ? self.x : liveCharacter && (liveCharacter.real_x != null ? liveCharacter.real_x : liveCharacter.x),
      y: self.y != null ? self.y : liveCharacter && (liveCharacter.real_y != null ? liveCharacter.real_y : liveCharacter.y),
      online: true,
      available: !(self.rip || (liveCharacter && liveCharacter.rip)),
      dead: !!(self.rip || (liveCharacter && liveCharacter.rip)),
      gear: self.equipment || self.gear || (liveCharacter && liveCharacter.slots) || {},
      stats: {
        ...extractStats(selfSource),
        hp: finite(self.hp != null ? self.hp : liveCharacter && liveCharacter.hp),
        max_hp: finite(self.max_hp != null ? self.max_hp : liveCharacter && liveCharacter.max_hp),
        mp: finite(self.mp != null ? self.mp : liveCharacter && liveCharacter.mp),
        max_mp: finite(self.max_mp != null ? self.max_mp : liveCharacter && liveCharacter.max_mp)
      },
      skillUnlocks: levelUnlockedSkills(self.ctype || (liveCharacter && liveCharacter.ctype), self.level != null ? self.level : liveCharacter && liveCharacter.level, gameData),
      inventory,
      supplies: summarizeSupplies(inventory)
    }, 'self', { at, live: true, confidence: 1 });

    this.stats.observations += 1;
    this.lastObservedAt = at;
    return this.status();
  }

  _snapshotRecord(record, now) {
    const ageMs = record.lastSeenAt == null ? null : Math.max(0, now - record.lastSeenAt);
    const stale = ageMs != null && ageMs > this.staleAfterMs;
    let online = record.online;
    let available = record.available;
    let stateConfidence = record.stateConfidence;
    if (stale && record.primarySource !== 'configured') {
      online = null;
      available = null;
      stateConfidence *= 0.5;
    }
    const presence = stale ? 'STALE' : online === true ? 'ONLINE' : online === false ? 'OFFLINE' : 'UNKNOWN';
    const availability = available === true ? 'AVAILABLE' : available === false ? 'UNAVAILABLE' : 'UNKNOWN';
    return {
      name: record.name,
      ctype: record.ctype,
      level: record.level,
      map: record.map,
      x: record.x,
      y: record.y,
      online,
      presence,
      available,
      availability,
      dead: record.dead,
      gear: cloneJson(record.gear, {}),
      stats: cloneJson(record.stats, {}),
      skillUnlocks: record.skillUnlocks.slice(),
      inventory: cloneJson(record.inventory, []),
      supplies: cloneJson(record.supplies, { hpPotions: 0, mpPotions: 0, byName: {} }),
      primarySource: record.primarySource,
      sources: record.sources.slice(),
      stateConfidence: clamp01(stateConfidence),
      firstObservedAt: record.firstObservedAt,
      lastSeenAt: record.lastSeenAt,
      lastUpdatedAt: record.lastUpdatedAt,
      observationAgeMs: ageMs
    };
  }

  list() {
    const now = this.now();
    return [...this.records.values()]
      .map((record) => this._snapshotRecord(record, now))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get(name) {
    const wanted = normalizeName(name);
    if (!wanted) return null;
    const record = this.records.get(wanted);
    return record ? this._snapshotRecord(record, this.now()) : null;
  }

  status() {
    const characters = this.list();
    const counts = {
      total: characters.length,
      online: 0,
      offline: 0,
      stale: 0,
      unknownPresence: 0,
      available: 0,
      unavailable: 0,
      unknownAvailability: 0,
      byClass: {}
    };
    for (const character of characters) {
      if (character.presence === 'ONLINE') counts.online += 1;
      else if (character.presence === 'OFFLINE') counts.offline += 1;
      else if (character.presence === 'STALE') counts.stale += 1;
      else counts.unknownPresence += 1;
      if (character.availability === 'AVAILABLE') counts.available += 1;
      else if (character.availability === 'UNAVAILABLE') counts.unavailable += 1;
      else counts.unknownAvailability += 1;
      const ctype = character.ctype || 'unknown';
      counts.byClass[ctype] = (counts.byClass[ctype] || 0) + 1;
    }
    return {
      schemaVersion: REGISTRY_SCHEMA_VERSION,
      mode: REGISTRY_MODE,
      actionAuthority: false,
      directActionAccess: false,
      executorBypassAllowed: false,
      capacity: this.capacity,
      staleAfterMs: this.staleAfterMs,
      lastObservedAt: this.lastObservedAt,
      counts,
      characters,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  CharacterRegistry,
  REGISTRY_SCHEMA_VERSION,
  REGISTRY_MODE,
  SOURCE_CONFIDENCE,
  levelUnlockedSkills,
  summarizeSupplies
};
