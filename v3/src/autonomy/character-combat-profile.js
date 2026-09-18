'use strict';

const { normalizeControlValue, defaultParameters } = require('./skill-semantics');

const CHARACTER_COMBAT_PROFILE_SCHEMA_VERSION = 1;
const CHARACTER_COMBAT_PROFILE_KEY = 'AIO_V3_CHARACTER_COMBAT_PROFILES_V1';

function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function cleanSkillId(value) {
  const id = String(value == null ? '' : value).trim();
  return id || null;
}

class CharacterCombatProfileStore {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || CHARACTER_COMBAT_PROFILE_KEY;
    this.profiles = new Map();
    this.loaded = false;
    this.lastSavedAt = null;
    this.stats = { loads: 0, saves: 0, loadErrors: 0, saveErrors: 0, updates: 0 };
    this.load();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'character-combat-profile', event, severity, reason, data }); } catch (_) {}
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    const root = this.root;
    if (root && typeof root.get === 'function' && typeof root.set === 'function') {
      return { get: (key) => root.get(key), set: (key, value) => root.set(key, value) };
    }
    const ls = root && root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
      return { get: (key) => ls.getItem(key), set: (key, value) => ls.setItem(key, value) };
    }
    return null;
  }

  _empty(name) {
    return {
      schemaVersion: CHARACTER_COMBAT_PROFILE_SCHEMA_VERSION,
      character: name,
      updatedAt: this.now(),
      skills: {}
    };
  }

  _normalizeProfile(value) {
    if (!value || typeof value !== 'object') return null;
    const name = cleanName(value.character);
    if (!name) return null;
    const profile = this._empty(name);
    profile.updatedAt = Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : this.now();
    if (value.skills && typeof value.skills === 'object' && !Array.isArray(value.skills)) {
      for (const [skillId, raw] of Object.entries(value.skills)) {
        const id = cleanSkillId(skillId);
        if (!id || !raw || typeof raw !== 'object') continue;
        const parameters = raw.parameters && typeof raw.parameters === 'object' && !Array.isArray(raw.parameters)
          ? Object.fromEntries(Object.entries(raw.parameters)
            .filter(([, v]) => Number.isFinite(Number(v)))
            .map(([k, v]) => [String(k), Number(v)]))
          : {};
        profile.skills[id] = {
          enabled: raw.enabled === true,
          parameters
        };
      }
    }
    return profile;
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== CHARACTER_COMBAT_PROFILE_SCHEMA_VERSION || !Array.isArray(data.profiles)) {
        throw new Error('unsupported character combat profile schema');
      }
      for (const row of data.profiles) {
        const profile = this._normalizeProfile(row);
        if (profile) this.profiles.set(profile.character, profile);
      }
      this.stats.loads += 1;
      this._event('CHARACTER_COMBAT_PROFILES_RESTORED', 'info', null, { profiles: this.profiles.size });
      return true;
    } catch (error) {
      this.profiles.clear();
      this.stats.loadErrors += 1;
      this._event('CHARACTER_COMBAT_PROFILES_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', {
        message: String(error && error.message || error)
      });
      return false;
    }
  }

  serialize() {
    return JSON.stringify({
      schemaVersion: CHARACTER_COMBAT_PROFILE_SCHEMA_VERSION,
      savedAt: this.now(),
      profiles: [...this.profiles.values()].sort((a, b) => a.character.localeCompare(b.character))
    });
  }

  save() {
    const backend = this._backend();
    if (!backend) return false;
    try {
      backend.set(this.key, this.serialize());
      this.lastSavedAt = this.now();
      this.stats.saves += 1;
      return true;
    } catch (error) {
      this.stats.saveErrors += 1;
      this._event('CHARACTER_COMBAT_PROFILES_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', {
        message: String(error && error.message || error)
      });
      return false;
    }
  }

  _ensure(name) {
    const character = cleanName(name);
    if (!character) return null;
    if (!this.profiles.has(character)) this.profiles.set(character, this._empty(character));
    return this.profiles.get(character);
  }

  _touch(profile, event, data = {}) {
    if (!profile) return false;
    profile.updatedAt = this.now();
    this.stats.updates += 1;
    this.save();
    this._event(event, 'info', null, { character: profile.character, ...data });
    return true;
  }

  _record(skillRecord) {
    if (!skillRecord || typeof skillRecord !== 'object') return null;
    const id = cleanSkillId(skillRecord.id);
    return id ? { ...skillRecord, id } : null;
  }

  skillSettings(name, skillRecord) {
    const profile = this._ensure(name);
    const record = this._record(skillRecord);
    if (!profile || !record) return null;
    const configured = Object.prototype.hasOwnProperty.call(profile.skills, record.id);
    const saved = configured ? profile.skills[record.id] : { enabled: record.defaultEnabled === true, parameters: {} };
    const defaults = defaultParameters(record.id, record);
    const controls = Array.isArray(record.controls) ? record.controls : [];
    const parameters = { ...defaults };
    for (const control of controls) {
      if (!control || !control.key) continue;
      const savedValue = saved.parameters && saved.parameters[control.key];
      parameters[control.key] = normalizeControlValue(control, savedValue, record);
    }
    return {
      enabled: saved.enabled === true,
      parameters,
      configured
    };
  }

  setEnabled(name, skillRecord, enabled) {
    const profile = this._ensure(name);
    const record = this._record(skillRecord);
    if (!profile || !record) return null;
    const current = this.skillSettings(name, record);
    profile.skills[record.id] = {
      enabled: enabled === true,
      parameters: { ...(current && current.parameters || {}) }
    };
    this._touch(profile, 'CHARACTER_SKILL_PERMISSION_CHANGED', { skill: record.id, enabled: enabled === true });
    return this.skillSettings(name, record);
  }

  setParameter(name, skillRecord, key, value) {
    const profile = this._ensure(name);
    const record = this._record(skillRecord);
    const parameter = String(key == null ? '' : key).trim();
    if (!profile || !record || !parameter) return null;
    const control = (record.controls || []).find((row) => row && row.key === parameter);
    if (!control) return { ok: false, reason: 'UNKNOWN_SKILL_CONTROL', skill: record.id, parameter };
    const current = this.skillSettings(name, record);
    const normalized = normalizeControlValue(control, value, record);
    profile.skills[record.id] = {
      enabled: !!(current && current.enabled),
      parameters: { ...(current && current.parameters || {}), [parameter]: normalized }
    };
    this._touch(profile, 'CHARACTER_SKILL_CONTROL_CHANGED', { skill: record.id, parameter, value: normalized });
    return { ok: true, settings: this.skillSettings(name, record) };
  }

  resetSkill(name, skillRecord) {
    const profile = this._ensure(name);
    const record = this._record(skillRecord);
    if (!profile || !record) return false;
    if (!Object.prototype.hasOwnProperty.call(profile.skills, record.id)) return false;
    delete profile.skills[record.id];
    this._touch(profile, 'CHARACTER_SKILL_SETTINGS_RESET', { skill: record.id });
    return true;
  }

  resetProfile(name) {
    const character = cleanName(name);
    if (!character || !this.profiles.has(character)) return false;
    this.profiles.set(character, this._empty(character));
    this._touch(this.profiles.get(character), 'CHARACTER_COMBAT_PROFILE_RESET');
    return true;
  }

  get(name) {
    const character = cleanName(name);
    if (!character) return null;
    const profile = this._ensure(character);
    return clone(profile, null);
  }

  status() {
    return {
      schemaVersion: CHARACTER_COMBAT_PROFILE_SCHEMA_VERSION,
      mode: 'per-character-skill-permission-and-controls-v1',
      profiles: this.profiles.size,
      characters: [...this.profiles.keys()].sort(),
      lastSavedAt: this.lastSavedAt,
      persistenceAvailable: !!this._backend(),
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  CharacterCombatProfileStore,
  CHARACTER_COMBAT_PROFILE_SCHEMA_VERSION,
  CHARACTER_COMBAT_PROFILE_KEY
};
