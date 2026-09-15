'use strict';

const GROUP_LIVENESS_SCHEMA_VERSION = 2;
const COMBAT_CLASSES = new Set(['warrior', 'paladin', 'rogue', 'ranger', 'mage', 'priest']);
const RUNNING_CHARACTER_STATES = new Set(['self', 'active', 'code']);

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function unique(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}
function runtimeActiveNames(runtime, localName) {
  const root = runtime && runtime.root || globalThis;
  const fn = root && (root.get_active_characters || (root.parent && root.parent.get_active_characters));
  if (typeof fn !== 'function') return null;
  try {
    const rows = fn.call(root);
    if (!rows || typeof rows !== 'object') return null;
    const names = Object.entries(rows)
      .filter(([, state]) => RUNNING_CHARACTER_STATES.has(String(state)))
      .map(([name]) => String(name || '').trim())
      .filter(Boolean);
    if (localName && !names.includes(localName)) names.push(localName);
    return unique(names);
  } catch (_) {
    return null;
  }
}

class GroupLivenessMonitor {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.staleAfterMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.staleAfterMs, 15000)));
    this.runtimeGraceMs = Math.max(0, Math.min(5 * 60 * 1000, finite(options.runtimeGraceMs, 15000)));
  }

  evaluate(runtime) {
    const now = this.now();
    const snapshot = runtime && runtime.lastSnapshot || null;
    const character = snapshot && snapshot.character || null;
    const localName = character && character.name ? String(character.name) : null;
    const registry = runtime && runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function'
      ? runtime.characterRegistry.status() : { characters: [] };
    const byName = new Map((registry.characters || []).filter(Boolean).map((row) => [String(row.name), row]));
    const partyNames = unique([
      localName,
      ...((snapshot && snapshot.party || []).map((row) => row && row.name))
    ]);
    const observedRuntimeNames = runtimeActiveNames(runtime, localName);
    const merchantLocal = String(character && character.ctype || '').toLowerCase() === 'merchant';
    const startedAt = finite(runtime && runtime.startedAt, now);
    const runtimeGraceRemainingMs = Math.max(0, this.runtimeGraceMs - Math.max(0, now - startedAt));
    const runtimeEvidenceRequired = merchantLocal && observedRuntimeNames !== null && runtimeGraceRemainingMs === 0;
    const observedRuntimeSet = new Set(observedRuntimeNames || []);

    const members = partyNames.map((name) => {
      const isSelf = localName === name;
      if (isSelf) {
        return {
          name,
          ctype: character.ctype || null,
          level: finite(character.level, 0),
          map: character.map || null,
          presence: 'ONLINE',
          online: true,
          available: character.rip !== true,
          dead: character.rip === true,
          ageMs: 0,
          fresh: true,
          runtimeActive: true,
          runtimeEvidence: 'self',
          source: 'self'
        };
      }
      const row = byName.get(name);
      const ageMs = row && finite(row.observationAgeMs);
      const fresh = !!row && row.presence !== 'STALE' && (ageMs == null || ageMs <= this.staleAfterMs);
      return {
        name,
        ctype: row && row.ctype || null,
        level: finite(row && row.level, 0),
        map: row && row.map || null,
        presence: row && row.presence || 'UNKNOWN',
        online: row ? row.online : null,
        available: row ? row.available : null,
        dead: row ? row.dead === true : null,
        ageMs,
        fresh,
        runtimeActive: observedRuntimeNames === null ? null : observedRuntimeSet.has(name),
        runtimeEvidence: observedRuntimeNames === null ? 'unavailable' : 'get_active_characters',
        source: row && row.primarySource || null
      };
    });

    const presenceInvalidMembers = members
      .filter((row) => !row.fresh || row.online === false || row.dead === true || row.available === false)
      .map((row) => row.name);
    const runtimeInactiveMembers = runtimeEvidenceRequired
      ? members.filter((row) => row.runtimeActive === false).map((row) => row.name)
      : [];
    const invalidMembers = unique([...presenceInvalidMembers, ...runtimeInactiveMembers]);
    const merchantCount = members.filter((row) => String(row.ctype || '').toLowerCase() === 'merchant').length;
    const combatCount = members.filter((row) => COMBAT_CLASSES.has(String(row.ctype || '').toLowerCase())).length;
    const fourCharacterReady = members.length === 4 && merchantCount === 1 && combatCount === 3 && invalidMembers.length === 0;

    let state = 'HEALTHY';
    const reasons = [];
    if (!character) {
      state = 'DEGRADED';
      reasons.push('LOCAL_CHARACTER_UNAVAILABLE');
    }
    if (character && character.rip === true) {
      state = 'DEGRADED';
      reasons.push('LOCAL_CHARACTER_DEAD');
    }
    if (presenceInvalidMembers.length) {
      state = 'DEGRADED';
      reasons.push('PARTY_MEMBER_NOT_LIVE');
    }
    if (runtimeInactiveMembers.length) {
      state = 'DEGRADED';
      reasons.push('PARTY_MEMBER_RUNTIME_INACTIVE');
    }
    if (state === 'HEALTHY' && merchantLocal && members.length > 1 && !fourCharacterReady) {
      state = 'WATCH';
      reasons.push(runtimeGraceRemainingMs > 0 ? 'RUNTIME_LIVENESS_STARTUP_GRACE' : 'MERCHANT_PARTY_NOT_FOUR_CHARACTER_READY');
    }

    return {
      schemaVersion: GROUP_LIVENESS_SCHEMA_VERSION,
      mode: 'presence-and-runtime-observation',
      actionAuthority: false,
      state,
      reasons,
      evaluatedAt: now,
      staleAfterMs: this.staleAfterMs,
      runtimeGraceMs: this.runtimeGraceMs,
      runtimeGraceRemainingMs,
      runtimeEvidenceRequired,
      observedRuntimeNames: clone(observedRuntimeNames),
      localCharacter: localName,
      memberCount: members.length,
      freshCount: members.filter((row) => row.fresh).length,
      runtimeActiveCount: members.filter((row) => row.runtimeActive === true).length,
      merchantCount,
      combatCount,
      fourCharacterReady,
      presenceInvalidMembers,
      runtimeInactiveMembers,
      invalidMembers,
      members: clone(members)
    };
  }

  status(runtime) { return this.evaluate(runtime); }
}

module.exports = { GroupLivenessMonitor, GROUP_LIVENESS_SCHEMA_VERSION, RUNNING_CHARACTER_STATES, runtimeActiveNames };
