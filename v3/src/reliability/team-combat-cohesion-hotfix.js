'use strict';

const base = require('./team-combat-cohesion-hotfix-base');

const SUPPORTED_COMBAT_CLASSES = new Set(['warrior', 'paladin', 'priest', 'ranger', 'rogue', 'mage']);

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ratio(value, max) {
  const denominator = finite(max);
  if (denominator == null || denominator <= 0) return null;
  return Math.max(0, Math.min(1, (finite(value) || 0) / denominator));
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function lower(value) { return String(value == null ? '' : value).trim().toLowerCase(); }

class TeamCombatCohesionHotfix extends base.TeamCombatCohesionHotfix {
  _expectedCombatNames() {
    const bootstrap = this.runtime && this.runtime.partyBootstrap;
    if (!bootstrap || typeof bootstrap.trustedRosterNames !== 'function') return null;
    let roster;
    try { roster = [...new Set((bootstrap.trustedRosterNames() || []).map(String).filter(Boolean))]; } catch (_) { return null; }
    let merchantName = bootstrap.merchantName ? String(bootstrap.merchantName) : null;
    if (!merchantName) {
      const rawParty = this._rawParty();
      const trustedMerchants = roster.filter((name) => {
        const row = rawParty && rawParty[name];
        return lower(row && (row.ctype || row.type)) === 'merchant';
      });
      if (trustedMerchants.length === 1) merchantName = trustedMerchants[0];
    }
    if (!merchantName || roster.length < 2 || roster.length > 4 || !roster.includes(merchantName)) return null;
    const combatNames = roster.filter((name) => name !== merchantName);
    return combatNames.length >= 1 && combatNames.length <= 3 ? combatNames.sort() : null;
  }

  _configStatus() {
    const status = super._configStatus();
    const expected = this._expectedCombatNames();
    return {
      ...status,
      requiredCombatMembers: expected ? expected.length : null,
      topologySource: 'trusted-party-bootstrap'
    };
  }

  _combatMembers(snapshot) {
    if (!snapshot || !snapshot.character) return [];
    const expected = this._expectedCombatNames();
    if (!expected) return [];
    const rawParty = this._rawParty();
    const snapshotParty = Array.isArray(snapshot.party) ? snapshot.party : [];
    return expected.map((name) => {
      const partyRow = snapshotParty.find((row) => row && String(row.name) === name) || null;
      const raw = rawParty[name] || null;
      const visible = this._visiblePlayer(snapshot, name);
      const self = String(snapshot.character.name) === name;
      const typeHint = self
        ? snapshot.character.ctype
        : partyRow && (partyRow.type || partyRow.ctype)
          || raw && (raw.type || raw.ctype)
          || visible && (visible.type || visible.ctype)
          || null;
      return {
        ...this._member(snapshot, name, typeHint),
        present: !!(self || partyRow || raw || visible)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  _team(snapshot) {
    const expectedNames = this._expectedCombatNames();
    const members = this._combatMembers(snapshot);
    const selfName = snapshot && snapshot.character && snapshot.character.name || null;
    const leader = members[0] || null;
    const self = members.find((row) => row.name === selfName) || null;
    const topologyKnown = Array.isArray(expectedNames) && expectedNames.length >= 1 && expectedNames.length <= 3;
    const combatTypesValid = topologyKnown && members.every((row) => SUPPORTED_COMBAT_CLASSES.has(lower(row.ctype)));
    const complete = topologyKnown
      && members.length === expectedNames.length
      && members.every((row) => row.present === true)
      && combatTypesValid;
    const alive = complete && members.every((row) => !row.rip);
    const sameMap = complete && members.every((row) => !row.map || !snapshot.character.map || row.map === snapshot.character.map);
    const positionsKnown = complete && members.every((row) => finite(row.x) != null && finite(row.y) != null);
    let maxPairDistance = Infinity;
    if (positionsKnown) {
      maxPairDistance = 0;
      for (let i = 0; i < members.length; i += 1) {
        for (let j = i + 1; j < members.length; j += 1) {
          maxPairDistance = Math.max(maxPairDistance, distance(members[i], members[j]));
        }
      }
    }
    const cohesive = complete && alive && sameMap && positionsKnown && maxPairDistance <= this.cohesionRadius;
    const knownHpRatios = members.map((row) => ratio(row.hp, row.max_hp)).filter((value) => value != null);
    const knownMpRatios = members.map((row) => ratio(row.mp, row.max_mp)).filter((value) => value != null);
    const healthReady = knownHpRatios.every((value) => value >= this.minNewFightHpRatio);
    const manaReady = knownMpRatios.every((value) => value >= this.minNewFightMpRatio);
    const leaderTargetId = leader && leader.target != null ? String(leader.target) : null;
    const state = {
      members,
      names: members.map((row) => row.name),
      expectedNames: expectedNames ? expectedNames.slice() : [],
      self,
      selfName,
      leader,
      leaderName: leader && leader.name || null,
      leaderTargetId,
      complete,
      alive,
      sameMap,
      positionsKnown,
      maxPairDistance,
      cohesive,
      healthReady,
      manaReady,
      resourcesKnown: knownHpRatios.length + knownMpRatios.length,
      at: this.now()
    };
    this.lastTeam = state;
    this._syncOrbitDirection(state);
    return state;
  }
}

function installTeamCombatCohesionHotfix(runtime, options = {}) {
  return new TeamCombatCohesionHotfix(runtime, options);
}

module.exports = {
  TeamCombatCohesionHotfix,
  installTeamCombatCohesionHotfix,
  TEAM_COMBAT_COHESION_MODE: base.TEAM_COMBAT_COHESION_MODE
};
