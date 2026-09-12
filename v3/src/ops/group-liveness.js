'use strict';

const GROUP_LIVENESS_SCHEMA_VERSION = 1;
const COMBAT_CLASSES = new Set(['warrior', 'paladin', 'rogue', 'ranger', 'mage', 'priest']);

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

class GroupLivenessMonitor {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.staleAfterMs = Math.max(1000, Math.min(10 * 60 * 1000, finite(options.staleAfterMs, 15000)));
  }

  evaluate(runtime) {
    const now = this.now();
    const snapshot = runtime && runtime.lastSnapshot || null;
    const character = snapshot && snapshot.character || null;
    const registry = runtime && runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function'
      ? runtime.characterRegistry.status() : { characters: [] };
    const byName = new Map((registry.characters || []).filter(Boolean).map((row) => [String(row.name), row]));
    const partyNames = unique([
      character && character.name,
      ...((snapshot && snapshot.party || []).map((row) => row && row.name))
    ]);

    const members = partyNames.map((name) => {
      if (character && String(character.name) === name) {
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
        source: row && row.primarySource || null
      };
    });

    const invalidMembers = members
      .filter((row) => !row.fresh || row.online === false || row.dead === true || row.available === false)
      .map((row) => row.name);
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
    if (invalidMembers.length) {
      state = 'DEGRADED';
      reasons.push('PARTY_MEMBER_NOT_LIVE');
    } else if (character && String(character.ctype || '').toLowerCase() === 'merchant' && members.length > 1 && !fourCharacterReady) {
      state = 'WATCH';
      reasons.push('MERCHANT_PARTY_NOT_FOUR_CHARACTER_READY');
    }

    return {
      schemaVersion: GROUP_LIVENESS_SCHEMA_VERSION,
      mode: 'observation-only',
      actionAuthority: false,
      state,
      reasons,
      evaluatedAt: now,
      staleAfterMs: this.staleAfterMs,
      localCharacter: character && character.name || null,
      memberCount: members.length,
      freshCount: members.filter((row) => row.fresh).length,
      merchantCount,
      combatCount,
      fourCharacterReady,
      invalidMembers,
      members: clone(members)
    };
  }

  status(runtime) { return this.evaluate(runtime); }
}

module.exports = { GroupLivenessMonitor, GROUP_LIVENESS_SCHEMA_VERSION };
