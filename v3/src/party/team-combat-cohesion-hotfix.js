'use strict';

const base = require('./team-combat-cohesion-hotfix-base');

const SUPPORTED_COMBAT_CLASSES = new Set(['warrior', 'paladin', 'priest', 'ranger', 'rogue', 'mage']);
const COMBAT_LEADER_POLICY = 'class-priority-then-name-v1';
const COMBAT_LEADER_CLASS_PRIORITY = Object.freeze({
  warrior: 600,
  paladin: 550,
  ranger: 500,
  mage: 450,
  rogue: 400,
  priest: 300
});

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

function combatLeaderPriority(member) {
  return COMBAT_LEADER_CLASS_PRIORITY[lower(member && member.ctype)] || 0;
}

function selectCombatLeader(members) {
  return (members || []).filter(Boolean).slice().sort((a, b) =>
    combatLeaderPriority(b) - combatLeaderPriority(a)
      || String(a.name || '').localeCompare(String(b.name || ''))
  )[0] || null;
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
      combatLeaderPolicy: COMBAT_LEADER_POLICY,
      combatLeaderClassPriority: { ...COMBAT_LEADER_CLASS_PRIORITY },
      crossMapFormationMovesBlocked: true,
      crossMapRegroupOwner: 'alpha28-controlled-farmer-travel'
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

  _selectTeamLeader(members) {
    return selectCombatLeader(members);
  }

  _team(snapshot) {
    const expectedNames = this._expectedCombatNames();
    const members = this._combatMembers(snapshot);
    const selfName = snapshot && snapshot.character && snapshot.character.name || null;
    const leader = this._selectTeamLeader(members);
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
    const leaderTarget = this._resolveLeaderTarget(leader);
    const leaderTargetId = leaderTarget.targetId;
    const state = {
      members,
      names: members.map((row) => row.name),
      expectedNames: expectedNames ? expectedNames.slice() : [],
      self,
      selfName,
      leader,
      leaderName: leader && leader.name || null,
      leaderTargetId,
      leaderTargetType: leaderTarget.targetType,
      leaderTargetSource: leaderTarget.source,
      leaderPolicy: COMBAT_LEADER_POLICY,
      leaderPriority: leader ? combatLeaderPriority(leader) : null,
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
    this._broadcastLeaderTarget(state, snapshot);
    return state;
  }

  _crossMapHold(team, requestedReason = null, phase = 'FORMATION') {
    this.stats.incompleteTeamBlocks += 1;
    this.lastDecision = {
      at: this.now(),
      action: 'HOLD',
      reason: 'CROSS_MAP_REGROUP_REQUIRED',
      requestedReason,
      phase,
      leaderName: team && team.leaderName || null,
      leaderMap: team && team.leader && team.leader.map || null,
      memberMap: team && team.self && team.self.map || null
    };
    this._event('TEAM_CROSS_MAP_REGROUP_REQUIRED', 'warn', 'CROSS_MAP_REGROUP_REQUIRED', { ...this.lastDecision });
    return true;
  }

  _followLeader(context, team, reason) {
    if (team && team.self && team.leader && team.selfName !== team.leaderName) {
      const memberMap = String(team.self.map || '');
      const leaderMap = String(team.leader.map || '');
      if (memberMap && leaderMap && memberMap !== leaderMap) return this._crossMapHold(team, reason, 'FORMATION');
    }
    return super._followLeader(context, team, reason);
  }

  _installLocalFarmTeamMovement() {
    if (this.localFarming.__teamCohesionInstalled) return;
    const baseTick = this.localFarming.tick.bind(this.localFarming);
    this.localFarming.tick = (context = {}) => {
      const snapshot = context.snapshot;
      if (!snapshot || !snapshot.character || lower(snapshot.character.ctype) === 'merchant') return { at: this.now(), action: 'HOLD', reason: 'MERCHANT_EXCLUDED_FROM_TEAM_FARM' };
      if (this.resourceTopoff) this.resourceTopoff.topOff(snapshot, context.runtime && context.runtime.adapter || this.runtime.adapter);
      const team = this._team(snapshot);
      if (!team.complete || !team.alive || !team.positionsKnown) {
        this.stats.incompleteTeamBlocks += 1;
        this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'TEAM_INCOMPLETE_OR_UNOBSERVABLE', leaderName: team.leaderName };
        return this.lastDecision;
      }
      if (!team.sameMap) {
        this._crossMapHold(team, null, 'LOCAL_FARM');
        return this.lastDecision;
      }
      const supply = this._localSupply(snapshot);
      if (!supply.ready) {
        this.stats.supplyBlocks += 1;
        if (team.selfName !== team.leaderName) this._followLeader({ ...context, adapter: this.runtime.adapter }, team, 'LOCAL_POTION_SUPPLY_INCOMPLETE');
        this.lastDecision = { ...(this.lastDecision || {}), at: this.now(), action: 'HOLD', reason: 'LOCAL_POTION_SUPPLY_INCOMPLETE', leaderName: team.leaderName, supply };
        return this.lastDecision;
      }
      if (team.selfName !== team.leaderName) {
        this.stats.localFarmFollowerSuppressed += 1;
        this._followLeader({ ...context, adapter: this.runtime.adapter }, team, team.cohesive ? 'FOLLOW_TEAM_LEADER' : 'REGROUP_WITH_TEAM_LEADER');
        if (!this.lastDecision || this.lastDecision.action !== 'FORMATION_FOLLOW') this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'FOLLOWER_DOES_NOT_OWN_FARM_DIRECTION', leaderName: team.leaderName };
        return this.lastDecision;
      }
      if (!team.cohesive || !team.healthReady || !team.manaReady) {
        this.stats.localFarmLeaderWaits += 1;
        const reason = !team.cohesive ? 'WAITING_FOR_TEAM_COHESION' : (!team.healthReady ? 'WAITING_FOR_TEAM_HP_TOPOFF' : 'WAITING_FOR_TEAM_MP_TOPOFF');
        this.lastDecision = { at: this.now(), action: 'HOLD', reason, leaderName: team.leaderName, maxPairDistance: team.maxPairDistance };
        return this.lastDecision;
      }
      return baseTick(context);
    };
    this.localFarming.__teamCohesionInstalled = true;
  }
}

function installTeamCombatCohesionHotfix(runtime, options = {}) {
  return new TeamCombatCohesionHotfix(runtime, options);
}

module.exports = {
  TeamCombatCohesionHotfix,
  installTeamCombatCohesionHotfix,
  TEAM_COMBAT_COHESION_MODE: base.TEAM_COMBAT_COHESION_MODE,
  COMBAT_LEADER_POLICY,
  COMBAT_LEADER_CLASS_PRIORITY,
  selectCombatLeader,
  TEAM_TARGET_STATE_ACTION: base.TEAM_TARGET_STATE_ACTION
};
