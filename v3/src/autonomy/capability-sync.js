'use strict';

const { CombatMode, normalizeCombatMode } = require('./combat-modes');

const CAPABILITY_SYNC_SCHEMA_VERSION = 1;
const CAPABILITY_SYNC_MODE = 'party-capability-sync-v1';
const MAX_SYNC_SKILLS = 24;
const MAX_SYNC_CAPABILITIES = 12;
const MAX_SYNC_PARAMETERS = 8;

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanString(value, max = 96) {
  const text = String(value == null ? '' : value).trim();
  return text ? text.slice(0, max) : null;
}

function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function capabilityCounts(skills, configuredOnly = false) {
  const out = {};
  for (const skill of skills || []) {
    if (!skill || skill.automationValidated !== true) continue;
    if (configuredOnly && skill.configuredReady !== true) continue;
    for (const capability of skill.capabilities || []) {
      const key = cleanString(capability, 64);
      if (!key) continue;
      out[key] = (out[key] || 0) + 1;
    }
  }
  return out;
}

function cleanParameters(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw).slice(0, MAX_SYNC_PARAMETERS)) {
    const name = cleanString(key, 64);
    const number = finite(value);
    if (!name || number == null || Math.abs(number) > 1e9) continue;
    out[name] = number;
  }
  return out;
}

function cleanCapabilities(raw) {
  const out = [];
  for (const value of Array.isArray(raw) ? raw : []) {
    const key = cleanString(value, 64);
    if (key && !out.includes(key)) out.push(key);
    if (out.length >= MAX_SYNC_CAPABILITIES) break;
  }
  return out;
}

function cleanCombat(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const pullCapacity = Math.max(1, Math.min(12, Math.floor(finite(raw.pullCapacity, 1) || 1)));
  const desiredPullSize = Math.max(1, Math.min(pullCapacity, Math.floor(finite(raw.desiredPullSize, 1) || 1)));
  const engagedCount = Math.max(0, Math.min(12, Math.floor(finite(raw.engagedCount, 0) || 0)));
  const adaptive = raw.adaptivePull && typeof raw.adaptivePull === 'object' ? raw.adaptivePull : null;
  return {
    combatMode: normalizeCombatMode(raw.combatMode, CombatMode.SMART_AUTO),
    state: cleanString(raw.state, 32),
    pullOwner: cleanString(raw.pullOwner, 64),
    authoritative: raw.authoritative === true,
    pullCapacity,
    desiredPullSize,
    engagedCount,
    adaptivePull: adaptive ? {
      applied: adaptive.applied === true,
      reason: cleanString(adaptive.reason, 64),
      recommendedSize: Math.max(1, Math.min(pullCapacity, Math.floor(finite(adaptive.recommendedSize, desiredPullSize) || desiredPullSize))),
      confidence: Math.max(0, Math.min(1, finite(adaptive.confidence, 0) || 0))
    } : null
  };
}

function cleanSkill(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = cleanString(raw.id, 64);
  if (!id || raw.automationValidated !== true) return null;
  const targetCapacityRaw = finite(raw.targetCapacity);
  return {
    id,
    automationValidated: true,
    enabled: raw.enabled === true,
    configuredReady: raw.configuredReady === true,
    targetCapacity: targetCapacityRaw == null ? null : Math.max(1, Math.min(12, Math.floor(targetCapacityRaw))),
    parameters: cleanParameters(raw.parameters),
    capabilities: cleanCapabilities(raw.capabilities),
    rawFingerprint: cleanString(raw.rawFingerprint, 128)
  };
}

function buildCapabilitySnapshot(runtime, character = null) {
  if (!runtime) return null;
  const c = character || runtime.lastSnapshot && runtime.lastSnapshot.character || null;
  if (!c || !c.name) return null;
  const local = runtime.characterCapabilityResolver && typeof runtime.characterCapabilityResolver.get === 'function'
    ? runtime.characterCapabilityResolver.get(c.name)
    : runtime.lastCharacterCapabilities || null;
  const catalog = runtime.skillCatalog && typeof runtime.skillCatalog.status === 'function'
    ? runtime.skillCatalog.status()
    : null;
  if (!local || !catalog) return null;
  const skills = (local.skills || [])
    .filter((row) => row && row.automationValidated === true)
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .slice(0, MAX_SYNC_SKILLS)
    .map((row) => cleanSkill(row))
    .filter(Boolean);
  const combatMode = runtime.characterCombatProfiles && typeof runtime.characterCombatProfiles.getCombatMode === 'function'
    ? runtime.characterCombatProfiles.getCombatMode(c.name)
    : CombatMode.SMART_AUTO;
  const encounter = runtime.tacticalPartyCombat && runtime.tacticalPartyCombat.encounter || null;
  const aoe = encounter && encounter.aoe || null;
  let adaptiveConfidence = 0;
  if (aoe && aoe.adaptivePull && Array.isArray(aoe.adaptivePull.profiles)) {
    const wanted = Number(aoe.adaptivePull.recommendedSize);
    const profile = aoe.adaptivePull.profiles.find((row) => Number(row && row.size) === wanted);
    adaptiveConfidence = Math.max(0, Math.min(1, finite(profile && profile.confidence, 0) || 0));
  }
  const combat = aoe ? cleanCombat({
    combatMode: aoe.combatMode || combatMode,
    state: aoe.state,
    pullOwner: encounter && encounter.pullOwner || null,
    authoritative: !!(encounter && encounter.pullOwner && String(encounter.pullOwner) === String(c.name)),
    pullCapacity: aoe.pullCapacity,
    desiredPullSize: aoe.desiredPullSize,
    engagedCount: aoe.engagedCount,
    adaptivePull: aoe.adaptivePull ? {
      applied: aoe.adaptivePull.applied === true,
      reason: aoe.adaptivePull.reason,
      recommendedSize: aoe.adaptivePull.recommendedSize,
      confidence: adaptiveConfidence
    } : null
  }) : null;
  return {
    schemaVersion: CAPABILITY_SYNC_SCHEMA_VERSION,
    mode: CAPABILITY_SYNC_MODE,
    character: String(c.name),
    ctype: String(c.ctype || local.ctype || 'unknown').toLowerCase(),
    level: Math.max(0, finite(c.level, local.level || 0)),
    observedAt: runtime.now ? runtime.now() : Date.now(),
    combatMode: normalizeCombatMode(combatMode, CombatMode.SMART_AUTO),
    generation: Math.max(0, finite(local.generation, 0)),
    fingerprint: cleanString(local.fingerprint, 128),
    catalog: {
      state: cleanString(catalog.state, 32),
      generation: Math.max(0, finite(catalog.generation, 0)),
      fingerprint: cleanString(catalog.fingerprint, 128)
    },
    skills,
    structuralCapabilities: capabilityCounts(skills, false),
    enabledCapabilities: capabilityCounts(skills, true),
    combat
  };
}

function sanitizeCapabilitySnapshot(raw, expected = {}) {
  if (!raw || typeof raw !== 'object' || Number(raw.schemaVersion) !== CAPABILITY_SYNC_SCHEMA_VERSION) return null;
  const character = cleanString(raw.character, 64);
  const expectedName = cleanString(expected.name, 64);
  if (!character || (expectedName && character !== expectedName)) return null;
  const ctype = String(raw.ctype || '').trim().toLowerCase().slice(0, 32) || 'unknown';
  const expectedType = String(expected.ctype || '').trim().toLowerCase();
  if (expectedType && ctype !== expectedType) return null;
  const catalog = raw.catalog && typeof raw.catalog === 'object' ? raw.catalog : {};
  const skills = (Array.isArray(raw.skills) ? raw.skills : [])
    .slice(0, MAX_SYNC_SKILLS)
    .map(cleanSkill)
    .filter(Boolean);
  const observedAt = finite(raw.observedAt);
  if (observedAt == null) return null;
  return {
    schemaVersion: CAPABILITY_SYNC_SCHEMA_VERSION,
    mode: CAPABILITY_SYNC_MODE,
    character,
    ctype,
    level: Math.max(0, finite(raw.level, finite(expected.level, 0)) || 0),
    observedAt,
    combatMode: normalizeCombatMode(raw.combatMode, CombatMode.SMART_AUTO),
    generation: Math.max(0, finite(raw.generation, 0) || 0),
    fingerprint: cleanString(raw.fingerprint, 128),
    catalog: {
      state: cleanString(catalog.state, 32),
      generation: Math.max(0, finite(catalog.generation, 0) || 0),
      fingerprint: cleanString(catalog.fingerprint, 128)
    },
    skills,
    structuralCapabilities: capabilityCounts(skills, false),
    enabledCapabilities: capabilityCounts(skills, true),
    combat: cleanCombat(raw.combat)
  };
}

function validateRemoteCapabilitySnapshot(raw, localCatalogStatus, options = {}) {
  const now = options.now == null ? Date.now() : Number(options.now);
  const maxAgeMs = Math.max(1000, Number(options.maxAgeMs) || 20000);
  const clean = sanitizeCapabilitySnapshot(raw, options.expected || {});
  if (!clean) return { valid: false, reason: 'REMOTE_CAPABILITY_INVALID', snapshot: null };
  if (!Number.isFinite(now) || Math.abs(now - clean.observedAt) > maxAgeMs) {
    return { valid: false, reason: 'REMOTE_CAPABILITY_STALE', snapshot: clean };
  }
  if (!localCatalogStatus || localCatalogStatus.state !== 'READY' || !localCatalogStatus.fingerprint) {
    return { valid: false, reason: 'LOCAL_SKILL_CATALOG_NOT_READY', snapshot: clean };
  }
  if (clean.catalog.state !== 'READY' || !clean.catalog.fingerprint) {
    return { valid: false, reason: 'REMOTE_SKILL_CATALOG_NOT_READY', snapshot: clean };
  }
  if (String(clean.catalog.fingerprint) !== String(localCatalogStatus.fingerprint)) {
    return { valid: false, reason: 'SKILL_CATALOG_FINGERPRINT_MISMATCH', snapshot: clean };
  }
  return { valid: true, reason: 'REMOTE_CAPABILITY_TRUSTED', snapshot: clean };
}

function remoteCapabilityMember(raw, localCatalogStatus, options = {}) {
  const checked = validateRemoteCapabilitySnapshot(raw, localCatalogStatus, options);
  if (!checked.valid || !checked.snapshot) return { valid: false, reason: checked.reason, member: null, snapshot: checked.snapshot };
  const row = checked.snapshot;
  const member = {
    schemaVersion: 1,
    mode: 'remote-character-capability-resolver-v1',
    remote: true,
    remoteSync: { valid: true, reason: checked.reason, observedAt: row.observedAt },
    name: row.character,
    ctype: row.ctype,
    level: row.level,
    observedAt: row.observedAt,
    generation: row.generation,
    fingerprint: row.fingerprint,
    combatMode: row.combatMode,
    catalogGeneration: row.catalog.generation,
    catalogState: row.catalog.state,
    catalogReady: true,
    detectedCapabilities: clone(row.structuralCapabilities, {}),
    structuralCapabilities: clone(row.structuralCapabilities, {}),
    enabledCapabilities: clone(row.enabledCapabilities, {}),
    combatMode: row.combatMode,
    remoteCombat: clone(row.combat, null),
    skills: row.skills.map((skill) => ({
      ...clone(skill, {}),
      configured: true,
      unlocked: true,
      equipmentReady: true,
      materialReady: true,
      controls: [],
      technical: {}
    }))
  };
  return { valid: true, reason: checked.reason, member, snapshot: row };
}

function missingRemoteCapabilityMember(descriptor = {}, reason = 'REMOTE_CAPABILITY_MISSING', now = Date.now()) {
  return {
    schemaVersion: 1,
    mode: 'remote-character-capability-resolver-v1',
    remote: true,
    remoteSync: { valid: false, reason, observedAt: null },
    name: String(descriptor.name || 'unknown'),
    ctype: String(descriptor.ctype || descriptor.type || 'unknown').toLowerCase(),
    level: Math.max(0, finite(descriptor.level, 0) || 0),
    observedAt: now,
    generation: 0,
    fingerprint: null,
    combatMode: CombatMode.SMART_AUTO,
    catalogGeneration: 0,
    catalogState: 'REMOTE_UNKNOWN',
    catalogReady: false,
    detectedCapabilities: {},
    structuralCapabilities: {},
    enabledCapabilities: {},
    skills: []
  };
}

module.exports = {
  CAPABILITY_SYNC_SCHEMA_VERSION,
  CAPABILITY_SYNC_MODE,
  MAX_SYNC_SKILLS,
  buildCapabilitySnapshot,
  sanitizeCapabilitySnapshot,
  validateRemoteCapabilitySnapshot,
  remoteCapabilityMember,
  missingRemoteCapabilityMember
};
