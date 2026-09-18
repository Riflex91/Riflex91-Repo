'use strict';

const { fingerprint } = require('../world/content-drift');
const { Capability } = require('./skill-semantics');

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function normalizedGear(descriptor, liveCharacter) {
  const source = liveCharacter && liveCharacter.slots && typeof liveCharacter.slots === 'object'
    ? liveCharacter.slots
    : descriptor && descriptor.gear && typeof descriptor.gear === 'object'
      ? descriptor.gear
      : descriptor && descriptor.equipment && typeof descriptor.equipment === 'object'
        ? descriptor.equipment
        : null;
  if (!source) return null;
  const out = {};
  for (const slot of Object.keys(source).sort()) {
    const item = source[slot];
    if (!item || typeof item !== 'object') continue;
    out[slot] = {
      name: item.name == null ? null : String(item.name),
      level: Math.max(0, finite(item.level) || 0)
    };
  }
  return out;
}

function normalizedInventory(descriptor, liveCharacter) {
  const source = liveCharacter && Array.isArray(liveCharacter.items)
    ? liveCharacter.items
    : descriptor && Array.isArray(descriptor.inventory)
      ? descriptor.inventory
      : null;
  if (!source) return null;
  const names = new Set();
  for (const item of source) if (item && item.name) names.add(String(item.name));
  return names;
}

function equippedTypes(gear, gameData) {
  if (!gear) return null;
  const items = gameData && gameData.items || {};
  const result = [];
  for (const [slot, item] of Object.entries(gear)) {
    if (!item || !item.name) continue;
    const meta = items[item.name] || {};
    result.push({
      slot,
      name: item.name,
      wtype: meta.wtype == null ? null : String(meta.wtype),
      type: meta.type == null ? null : String(meta.type)
    });
  }
  return result;
}

function equipmentReadiness(skill, gear, gameData) {
  const needsWtype = Array.isArray(skill.wtype) && skill.wtype.length > 0;
  const needsOffhand = !!skill.offhandType;
  const needsSlot = Array.isArray(skill.slot) && skill.slot.length > 0;
  if (!needsWtype && !needsOffhand && !needsSlot) return { ready: true, reasons: [] };
  if (!gear) return { ready: null, reasons: ['EQUIPMENT_UNKNOWN'] };

  const types = equippedTypes(gear, gameData) || [];
  const reasons = [];

  if (needsWtype) {
    const allowed = new Set(skill.wtype.map(String));
    if (!types.some((row) => row.wtype && allowed.has(row.wtype))) reasons.push('WEAPON_TYPE_REQUIRED');
  }
  if (needsOffhand) {
    const offhand = types.find((row) => row.slot === 'offhand');
    const wanted = String(skill.offhandType);
    if (!offhand || (offhand.wtype !== wanted && offhand.type !== wanted)) reasons.push('OFFHAND_TYPE_REQUIRED');
  }
  if (needsSlot) {
    const matches = skill.slot.some(([slot, itemName]) => gear[slot] && gear[slot].name === itemName);
    if (!matches) reasons.push('EQUIPMENT_SLOT_REQUIREMENT');
  }
  return { ready: reasons.length === 0, reasons };
}

function materialReadiness(skill, inventory) {
  if (!skill.consume) return { ready: true, reason: null };
  if (!inventory) return { ready: null, reason: 'MATERIAL_UNKNOWN' };
  return inventory.has(String(skill.consume))
    ? { ready: true, reason: null }
    : { ready: false, reason: 'MATERIAL_REQUIRED' };
}

function addCounts(target, values) {
  for (const value of values || []) target[value] = (target[value] || 0) + 1;
}

class CharacterCapabilityResolver {
  constructor(options = {}) {
    if (!options.catalog) throw new Error('skill catalog required');
    if (!options.profiles) throw new Error('character combat profiles required');
    this.catalog = options.catalog;
    this.profiles = options.profiles;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.lastByCharacter = new Map();
    this.fingerprints = new Map();
    this.generations = new Map();
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'character-capabilities', event, severity, reason, data }); } catch (_) {}
  }

  _generation(name, value) {
    const fp = fingerprint(value).hash;
    const previous = this.fingerprints.get(name);
    if (previous !== fp) {
      this.fingerprints.set(name, fp);
      this.generations.set(name, (this.generations.get(name) || 0) + 1);
    }
    return { generation: this.generations.get(name) || 1, fingerprint: fp, changed: previous != null && previous !== fp };
  }

  resolve(descriptor = {}, context = {}) {
    const name = String(descriptor.name || context.name || 'unknown');
    const ctype = String(descriptor.ctype || descriptor.type || '').toLowerCase();
    const level = Math.max(0, finite(descriptor.level) || 0);
    const gear = normalizedGear(descriptor, context.liveCharacter);
    const inventory = normalizedInventory(descriptor, context.liveCharacter);
    const gameData = context.gameData || {};
    const catalogStatus = this.catalog.status();
    const detectedCapabilities = {};
    const structuralCapabilities = {};
    const enabledCapabilities = {};
    const skills = [];

    for (const skill of this.catalog.list({ ctype })) {
      if (!skill.classes.includes(ctype)) continue;
      const unlocked = level >= skill.requiredLevel;
      if (!unlocked) continue;

      const settings = this.profiles.skillSettings(name, skill) || { enabled: false, parameters: {}, configured: false };
      const equipment = equipmentReadiness(skill, gear, gameData);
      const material = materialReadiness(skill, inventory);
      const validated = skill.automationValidated === true;
      const configuredReady = validated
        && settings.enabled === true
        && equipment.ready !== false
        && material.ready !== false
        && catalogStatus.state === 'READY';

      addCounts(detectedCapabilities, skill.capabilities);
      if (validated) addCounts(structuralCapabilities, skill.capabilities);
      if (configuredReady) addCounts(enabledCapabilities, skill.capabilities);

      skills.push({
        id: skill.id,
        name: skill.name,
        requiredLevel: skill.requiredLevel,
        unlocked,
        automationValidated: validated,
        enabled: settings.enabled === true,
        configured: settings.configured === true,
        parameters: clone(settings.parameters, {}),
        controls: clone(skill.controls, []),
        capabilities: skill.capabilities.slice(),
        targetCapacity: skill.targetCapacity,
        equipmentReady: equipment.ready,
        equipmentReasons: equipment.reasons,
        materialReady: material.ready,
        materialReason: material.reason,
        configuredReady,
        technical: {
          mp: skill.mp,
          cooldown: skill.cooldown,
          range: skill.range,
          rangeMultiplier: skill.rangeMultiplier,
          wtype: skill.wtype.slice(),
          offhandType: skill.offhandType,
          slot: clone(skill.slot, []),
          consume: skill.consume,
          multi: skill.multi,
          list: skill.list,
          party: skill.party,
          heal: skill.heal,
          hostile: skill.hostile,
          share: skill.share
        },
        rawFingerprint: skill.rawFingerprint
      });
    }

    skills.sort((a, b) => a.requiredLevel - b.requiredLevel || a.id.localeCompare(b.id));
    const generationBasis = {
      catalogGeneration: catalogStatus.generation,
      catalogState: catalogStatus.state,
      ctype,
      level,
      gear,
      skills: skills.map((row) => ({
        id: row.id,
        enabled: row.enabled,
        parameters: row.parameters,
        equipmentReady: row.equipmentReady,
        materialReady: row.materialReady,
        rawFingerprint: row.rawFingerprint
      }))
    };
    const gen = this._generation(name, generationBasis);
    const result = {
      schemaVersion: 1,
      mode: 'live-character-capability-resolver-v1',
      name,
      ctype,
      level,
      observedAt: this.now(),
      generation: gen.generation,
      fingerprint: gen.fingerprint,
      catalogGeneration: catalogStatus.generation,
      catalogState: catalogStatus.state,
      catalogReady: catalogStatus.state === 'READY',
      detectedCapabilities,
      structuralCapabilities,
      enabledCapabilities,
      skills
    };
    this.lastByCharacter.set(name, result);
    if (gen.changed) this._event('CHARACTER_CAPABILITIES_CHANGED', {
      character: name,
      generation: gen.generation,
      catalogGeneration: catalogStatus.generation,
      ctype,
      level
    });
    return clone(result, null);
  }

  get(name) {
    const row = this.lastByCharacter.get(String(name || ''));
    return row ? clone(row, null) : null;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'live-character-capability-resolver-v1',
      characters: [...this.lastByCharacter.keys()].sort(),
      latest: Object.fromEntries([...this.lastByCharacter.entries()].map(([name, row]) => [
        name,
        {
          ctype: row.ctype,
          level: row.level,
          generation: row.generation,
          catalogGeneration: row.catalogGeneration,
          catalogReady: row.catalogReady,
          skills: row.skills.length
        }
      ]))
    };
  }
}

class PartyCapabilityResolver {
  constructor(options = {}) {
    if (!options.characterResolver) throw new Error('character capability resolver required');
    this.characterResolver = options.characterResolver;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.last = null;
    this.lastFingerprint = null;
    this.generation = 0;
  }

  _memberDescriptors(snapshot, registryStatus, liveCharacter) {
    const byName = new Map();
    for (const row of registryStatus && registryStatus.characters || []) if (row && row.name) byName.set(String(row.name), row);
    const members = [];
    const seen = new Set();
    const self = snapshot && snapshot.character;
    if (self && self.name) {
      const registry = byName.get(String(self.name)) || {};
      members.push({
        descriptor: { ...registry, ...self, gear: liveCharacter && liveCharacter.slots || registry.gear },
        liveCharacter
      });
      seen.add(String(self.name));
    }
    for (const member of snapshot && snapshot.party || []) {
      if (!member || !member.name || seen.has(String(member.name))) continue;
      const registry = byName.get(String(member.name)) || {};
      members.push({
        descriptor: {
          ...registry,
          ...member,
          ctype: member.ctype || member.type || registry.ctype,
          level: member.level != null ? member.level : registry.level,
          gear: registry.gear
        },
        liveCharacter: null
      });
      seen.add(String(member.name));
    }
    return members;
  }

  resolve(context = {}) {
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return null;
    const members = this._memberDescriptors(snapshot, context.registryStatus, context.liveCharacter)
      .map(({ descriptor, liveCharacter }) => this.characterResolver.resolve(descriptor, {
        gameData: context.gameData || {},
        liveCharacter
      }));

    const detectedCapabilities = {};
    const structuralCapabilities = {};
    const enabledCapabilities = {};
    for (const member of members) {
      addCounts(detectedCapabilities, Object.keys(member.detectedCapabilities).flatMap((key) => Array(member.detectedCapabilities[key]).fill(key)));
      addCounts(structuralCapabilities, Object.keys(member.structuralCapabilities).flatMap((key) => Array(member.structuralCapabilities[key]).fill(key)));
      addCounts(enabledCapabilities, Object.keys(member.enabledCapabilities).flatMap((key) => Array(member.enabledCapabilities[key]).fill(key)));
    }

    const offensiveAoe = [
      Capability.MULTI_TARGET_DAMAGE,
      Capability.RANGED_MULTI_TARGET_DAMAGE,
      Capability.VARIABLE_MULTI_TARGET_DAMAGE,
      Capability.AOE_DAMAGE
    ];
    const aoePotential = offensiveAoe.some((key) => Number(structuralCapabilities[key]) > 0);
    const aoeConfigured = members.every((row) => row.catalogReady)
      && offensiveAoe.some((key) => Number(enabledCapabilities[key]) > 0);
    const support = {
      partyHeal: Number(structuralCapabilities[Capability.PARTY_HEAL]) > 0,
      groupSustain: Number(structuralCapabilities[Capability.GROUP_SUSTAIN]) > 0,
      aoeControl: Number(structuralCapabilities[Capability.AOE_CONTROL]) > 0,
      aoeAggroControl: Number(structuralCapabilities[Capability.AOE_AGGRO_CONTROL]) > 0
    };

    const basis = {
      members: members.map((row) => [row.name, row.generation, row.fingerprint]),
      catalog: members.map((row) => row.catalogGeneration)
    };
    const fp = fingerprint(basis).hash;
    if (fp !== this.lastFingerprint) {
      this.lastFingerprint = fp;
      this.generation += 1;
      if (this.log && typeof this.log.emit === 'function') {
        try {
          this.log.emit({
            component: 'party-capabilities',
            event: 'PARTY_CAPABILITIES_CHANGED',
            data: { generation: this.generation, members: members.map((row) => row.name), aoePotential, aoeConfigured }
          });
        } catch (_) {}
      }
    }

    this.last = {
      schemaVersion: 1,
      mode: 'live-party-capability-resolver-v1',
      observedAt: this.now(),
      generation: this.generation,
      fingerprint: fp,
      catalogReady: members.length > 0 && members.every((row) => row.catalogReady),
      members,
      detectedCapabilities,
      structuralCapabilities,
      enabledCapabilities,
      combat: {
        aoePotential,
        aoeConfigured,
        support
      }
    };
    return clone(this.last, null);
  }

  status() {
    if (!this.last) return {
      schemaVersion: 1,
      mode: 'live-party-capability-resolver-v1',
      generation: this.generation,
      catalogReady: false,
      members: [],
      combat: { aoePotential: false, aoeConfigured: false, support: {} }
    };
    return clone(this.last, null);
  }
}

module.exports = {
  CharacterCapabilityResolver,
  PartyCapabilityResolver,
  equipmentReadiness,
  materialReadiness
};
