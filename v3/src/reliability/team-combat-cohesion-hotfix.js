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

function livePlayerRow(row) {
  if (!row || typeof row !== 'object' || row.mtype) return false;
  if (row.rip === true || row.dead === true) return false;
  const hp = finite(row.hp);
  return hp == null || hp > 0;
}

function observedCoordinate(row, axis) {
  if (!row) return null;
  const real = finite(row[`real_${axis}`]);
  return real != null ? real : finite(row[axis]);
}

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
      topologySource: 'trusted-party-bootstrap',
      ownedObservationFallback: true
    };
  }

  _trustedOwnedObservation(snapshot, name) {
    const transport = this.runtime && this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport;
    const target = String(name || '');
    if (!target || !transport || typeof transport.isOwned !== 'function') return null;
    try { if (transport.isOwned(target) !== true) return null; } catch (_) { return null; }

    let evidence = null;
    try {
      evidence = typeof transport.strongLiveEvidence === 'function' ? transport.strongLiveEvidence(target) : null;
    } catch (_) {
      return null;
    }
    if (!evidence || evidence.live !== true) return null;

    const candidates = [];
    const add = (row, source) => {
      if (!livePlayerRow(row)) return;
      if (row.name != null && String(row.name) !== target) return;
      candidates.push({ row, source });
    };

    add(this._visiblePlayer(snapshot, target), 'snapshot-entity');
    for (const owner of [this.root, this.parent]) {
      if (!owner) continue;
      if (typeof owner.get_player === 'function') {
        try { add(owner.get_player(target), 'get-player'); } catch (_) {}
      }
      const entities = owner.entities;
      if (entities && typeof entities === 'object') {
        const entity = Object.values(entities).find((row) => row && !row.mtype && String(row.name || '') === target);
        add(entity, 'entity');
      }
      const party = owner.party;
      if (party && typeof party === 'object') add(party[target], 'party');
    }

    const preferred = candidates.find((candidate) => candidate.source === evidence.source) || candidates[0] || null;
    return {
      evidence: { live: true, source: evidence.source || null },
      row: preferred && preferred.row || null,
      source: preferred && preferred.source || evidence.source || 'owned-live-evidence'
    };
  }

  _mergeOwnedObservation(member, observation) {
    const row = observation && observation.row;
    if (!row) return member;
    const x = observedCoordinate(row, 'x');
    const y = observedCoordinate(row, 'y');
    return {
      ...member,
      ctype: member.ctype || row.ctype || row.type || null,
      map: row.map || member.map || null,
      x: x != null ? x : member.x,
      y: y != null ? y : member.y,
      hp: finite(row.hp) != null ? finite(row.hp) : member.hp,
      max_hp: finite(row.max_hp) != null ? finite(row.max_hp) : member.max_hp,
      mp: finite(row.mp) != null ? finite(row.mp) : member.mp,
      max_mp: finite(row.max_mp) != null ? finite(row.max_mp) : member.max_mp,
      target: row.target != null ? row.target : member.target,
      rip: member.rip === true || row.rip === true || row.dead === true,
      ownedObservationSource: observation.source || null
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
      const ownedObservation = self ? null : this._trustedOwnedObservation(snapshot, name);
      const observed = ownedObservation && ownedObservation.row;
      const typeHint = self
        ? snapshot.character.ctype
        : partyRow && (partyRow.type || partyRow.ctype)
          || raw && (raw.type || raw.ctype)
          || visible && (visible.type || visible.ctype)
          || observed && (observed.type || observed.ctype)
          || null;
      const member = this._mergeOwnedObservation(this._member(snapshot, name, typeHint), ownedObservation);
      return {
        ...member,
        present: !!(self || partyRow || raw || visible || ownedObservation && ownedObservation.evidence && ownedObservation.evidence.live),
        strongOwnedObservation: !!(ownedObservation && ownedObservation.evidence && ownedObservation.evidence.live)
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
      strongOwnedObservations: members.filter((row) => row.strongOwnedObservation).map((row) => row.name),
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