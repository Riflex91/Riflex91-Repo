'use strict';

const SKILL_POLICY_MODE = 'central-user-skill-policy-v1';

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clean(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

class SkillPolicy {
  constructor(options = {}) {
    if (!options.catalog) throw new Error('skill catalog required');
    if (!options.profiles) throw new Error('character combat profiles required');
    this.root = options.root || globalThis;
    this.catalog = options.catalog;
    this.profiles = options.profiles;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.lastDecision = null;
    this.stats = {
      evaluations: 0,
      allowed: 0,
      blocked: 0,
      blockedCatalog: 0,
      blockedUnknown: 0,
      blockedUnvalidated: 0,
      blockedClass: 0,
      blockedLevel: 0,
      blockedUser: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'skill-policy', event, severity, reason, data }); } catch (_) {}
  }

  _character(explicit = null) {
    if (explicit && typeof explicit === 'object') return explicit;
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _finish(decision) {
    this.stats.evaluations += 1;
    if (decision.allowed) this.stats.allowed += 1;
    else {
      this.stats.blocked += 1;
      if (decision.reason === 'SKILL_CATALOG_NOT_READY') this.stats.blockedCatalog += 1;
      else if (decision.reason === 'UNKNOWN_SKILL') this.stats.blockedUnknown += 1;
      else if (decision.reason === 'SKILL_AUTOMATION_NOT_VALIDATED') this.stats.blockedUnvalidated += 1;
      else if (decision.reason === 'SKILL_CLASS_MISMATCH') this.stats.blockedClass += 1;
      else if (decision.reason === 'SKILL_LEVEL_LOCKED') this.stats.blockedLevel += 1;
      else if (decision.reason === 'SKILL_POLICY_DISABLED') this.stats.blockedUser += 1;
    }
    this.lastDecision = { at: this.now(), ...decision };
    if (!decision.allowed) {
      this._event('SKILL_POLICY_BLOCKED', 'info', decision.reason, {
        skill: decision.skill || null,
        character: decision.character || null,
        ctype: decision.ctype || null,
        level: decision.level == null ? null : decision.level,
        catalogState: decision.catalogState || null
      });
    }
    return decision;
  }

  evaluate(skillId, options = {}) {
    const id = clean(skillId);
    const character = this._character(options.character);
    const catalogStatus = this.catalog.status();

    if (!id) return this._finish({ allowed: false, reason: 'SKILL_ID_REQUIRED', skill: null });
    if (!character) return this._finish({
      allowed: false, reason: 'SKILL_CHARACTER_UNAVAILABLE', skill: id,
      catalogState: catalogStatus.state
    });
    const name = clean(character.name);
    const ctype = String(character.ctype || character.type || '').toLowerCase();
    const level = Math.max(0, finite(character.level) || 0);

    if (catalogStatus.state !== 'READY') return this._finish({
      allowed: false, reason: 'SKILL_CATALOG_NOT_READY', skill: id,
      character: name, ctype, level, catalogState: catalogStatus.state
    });

    const record = this.catalog.get(id);
    if (!record) return this._finish({
      allowed: false, reason: 'UNKNOWN_SKILL', skill: id,
      character: name, ctype, level, catalogState: catalogStatus.state
    });
    if (record.automationValidated !== true) return this._finish({
      allowed: false, reason: 'SKILL_AUTOMATION_NOT_VALIDATED', skill: id,
      character: name, ctype, level, catalogState: catalogStatus.state
    });
    if (record.classes.length && !record.classes.includes(ctype)) return this._finish({
      allowed: false, reason: 'SKILL_CLASS_MISMATCH', skill: id,
      character: name, ctype, level, requiredClasses: record.classes.slice(),
      catalogState: catalogStatus.state
    });
    if (level < Number(record.requiredLevel || 0)) return this._finish({
      allowed: false, reason: 'SKILL_LEVEL_LOCKED', skill: id,
      character: name, ctype, level, requiredLevel: Number(record.requiredLevel || 0),
      catalogState: catalogStatus.state
    });

    const settings = this.profiles.skillSettings(name, record);
    if (!settings || settings.enabled !== true) return this._finish({
      allowed: false, reason: 'SKILL_POLICY_DISABLED', skill: id,
      character: name, ctype, level, configured: !!(settings && settings.configured),
      catalogState: catalogStatus.state
    });

    return this._finish({
      allowed: true,
      reason: settings.configured ? 'SKILL_POLICY_ENABLED' : 'SKILL_POLICY_DEFAULT_ENABLED',
      skill: id,
      character: name,
      ctype,
      level,
      configured: settings.configured === true,
      parameters: clone(settings.parameters, {}),
      catalogGeneration: catalogStatus.generation,
      catalogState: catalogStatus.state
    });
  }

  peek(skillId, character = null) {
    const id = clean(skillId);
    const c = this._character(character);
    const catalogStatus = this.catalog.status();
    if (!id || !c || catalogStatus.state !== 'READY') return false;
    const record = this.catalog.get(id);
    if (!record || record.automationValidated !== true) return false;
    const ctype = String(c.ctype || c.type || '').toLowerCase();
    const level = Math.max(0, finite(c.level) || 0);
    if (record.classes.length && !record.classes.includes(ctype)) return false;
    if (level < Number(record.requiredLevel || 0)) return false;
    const settings = this.profiles.skillSettings(clean(c.name), record);
    return !!(settings && settings.enabled === true);
  }

  settings(skillId, character = null) {
    const id = clean(skillId);
    const c = this._character(character);
    if (!id || !c) return null;
    const record = this.catalog.get(id);
    if (!record) return null;
    const settings = this.profiles.skillSettings(clean(c.name), record);
    return settings ? {
      ...clone(settings, {}),
      skill: id,
      automationValidated: record.automationValidated === true,
      defaultEnabled: record.defaultEnabled === true
    } : null;
  }

  evaluateCommand(args = [], options = {}) {
    const list = Array.isArray(args) ? args : [];
    return this.evaluate(list[0], options);
  }

  isEnabled(skillId, character = null) {
    return this.peek(skillId, character);
  }

  parameters(skillId, character = null) {
    const decision = this.evaluate(skillId, { character });
    return decision.allowed ? clone(decision.parameters, {}) : null;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: SKILL_POLICY_MODE,
      centralCommandEnforcement: true,
      unknownSkillsFailClosed: true,
      catalogMustBeReady: true,
      userDisableIsHardBlock: true,
      lastDecision: clone(this.lastDecision, null),
      stats: { ...this.stats }
    };
  }
}

module.exports = { SkillPolicy, SKILL_POLICY_MODE };
