'use strict';

const {
  finite, clone, text, gameDataOf, xpDelta, potionCount, monsterMap,
  ownedTargetId, farmerOwnedCombatBusy, isPoisonedPerformanceProfile
} = require('./alpha27-utils');

const TARGET_RECEIVER = '__AIO_V3_ALPHA27_FARMER_TARGET';

class Alpha27CombatOwnership {
  constructor(runtime, shared) {
    this.runtime = runtime;
    this.now = shared.now;
    this.log = shared.log;
    this.options = shared.options;
    this.stats = shared.stats;
    this.remoteLeaderTarget = null;
    this.targetReceiverInstalled = false;
    this.lastTargetPublishAt = -Infinity;
    this.lastPublishedTargetKey = null;
    this.lastTargetAuthority = null;
    this.quarantinedPerformance = new Set();
    this.patchPerformance();
    this.patchWorldPerformanceQuarantine();
    this.patchPartyTelemetry();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha27-convergence', event, severity, reason, data }); } catch (_) {}
  }

  patchPerformance() {
    const perf = this.runtime.performance;
    if (!perf || perf.__alpha27OwnershipPatched || typeof perf.observe !== 'function') return false;
    const baseObserve = perf.observe.bind(perf);
    perf.observe = (snapshot, context = {}) => {
      if (!snapshot || !snapshot.character) return baseObserve(snapshot, context);
      const owned = ownedTargetId(this.runtime);
      const raw = snapshot.character.target == null ? null : String(snapshot.character.target);
      if (raw && raw !== owned) this.stats.rawAdventureTargetsIgnored += 1;
      const annotated = {
        ...snapshot,
        character: {
          ...snapshot.character,
          __farmerOwnedTargetId: owned,
          __farmerOwnedTargetType: this.runtime.farmer && this.runtime.farmer.targetType || null
        }
      };
      return baseObserve(annotated, { ...context, farmerOwnedTargetId: owned });
    };

    perf._observeTransition = (previous, current, context = {}) => {
      const w = perf.window;
      if (!w) return;
      const prevC = previous.character || {};
      const currC = current.character || {};
      w.samples += 1;
      w.lastObservedAt = this.now();
      const gainedXp = xpDelta(prevC, currC, context.gameData);
      w.xp += gainedXp;
      w.gold += finite(currC.gold, 0) - finite(prevC.gold, 0);
      if (!prevC.rip && currC.rip) w.deaths += 1;
      if (finite(prevC.hp, 0) > finite(currC.hp, 0)) w.damageTaken += finite(prevC.hp, 0) - finite(currC.hp, 0);
      const beforePotions = potionCount(prevC.inventory);
      const afterPotions = potionCount(currC.inventory);
      if (beforePotions > afterPotions) w.potions += beforePotions - afterPotions;

      const prevEntities = monsterMap(previous);
      const currEntities = monsterMap(current);
      const ownedIds = new Set([text(prevC.__farmerOwnedTargetId), text(currC.__farmerOwnedTargetId)].filter(Boolean));
      const selfName = String(currC.name || prevC.name || '');
      for (const [id, before] of prevEntities.entries()) {
        if (!before || !before.mtype) continue;
        const after = currEntities.get(id) || null;
        const attributable = ownedIds.has(id) || String(before.target || '') === selfName || String(after && after.target || '') === selfName;
        if (!attributable) continue;
        const beforeHp = finite(before.hp, 0);
        const afterHp = after ? finite(after.hp, 0) : null;
        if (after && beforeHp > afterHp) {
          w.monsterHpLost += beforeHp - afterHp;
          perf._increment(w.damageEventsByMonster, before.mtype);
          this.stats.performanceAttributedDamageEvents += 1;
        }
        const wasAlive = !before.dead && !before.rip && (before.hp == null || beforeHp > 0);
        const explicitlyDead = !!(after && (after.dead || after.rip || (after.hp != null && afterHp <= 0)));
        const ownedDisappearedWithXp = !after && ownedIds.has(id) && gainedXp > 0;
        if (wasAlive && (explicitlyDead || ownedDisappearedWithXp)) {
          w.kills += 1;
          perf._increment(w.killsByMonster, before.mtype);
          this.stats.performanceAttributedKills += 1;
          if (ownedDisappearedWithXp) this.stats.performanceDisappearKills += 1;
        }
      }
      const currentOwned = text(currC.__farmerOwnedTargetId);
      if (currentOwned) {
        const target = currEntities.get(currentOwned);
        if (target && target.mtype) perf._increment(w.targetSamples, target.mtype);
      }
    };
    perf.__alpha27OwnershipPatched = true;
    return true;
  }

  patchWorldPerformanceQuarantine() {
    const world = this.runtime.world;
    if (!world || world.__alpha27PerformanceQuarantinePatched || typeof world.performanceFor !== 'function') return false;
    const base = world.performanceFor.bind(world);
    world.performanceFor = (monster, fingerprint) => {
      const profile = base(monster, fingerprint);
      if (!profile) return null;
      const gd = gameDataOf(this.runtime);
      const meta = gd.monsters && gd.monsters[monster];
      if (!isPoisonedPerformanceProfile(profile, meta)) return profile;
      const key = `${monster}::${fingerprint || 'unknown-party'}`;
      if (!this.quarantinedPerformance.has(key)) {
        this.quarantinedPerformance.add(key);
        this.stats.poisonedPerformanceProfilesQuarantined += 1;
        this._event('PERFORMANCE_PROFILE_QUARANTINED', 'warn', 'KILLS_WITHOUT_XP_EVIDENCE', { monster, fingerprint, kills: profile.kills, xp: profile.xp, windows: profile.windows });
      }
      return null;
    };
    world.__alpha27PerformanceQuarantinePatched = true;
    return true;
  }

  patchPartyTelemetry() {
    const bridge = this.runtime.partyTelemetry;
    if (!bridge || bridge.__alpha27FarmerOwnershipPatched) return false;
    if (typeof bridge.buildLocalReport === 'function') {
      const baseBuild = bridge.buildLocalReport.bind(bridge);
      bridge.buildLocalReport = (runtime) => {
        const report = baseBuild(runtime);
        if (!report) return report;
        const farmer = runtime && runtime.farmer;
        return { ...report, farmerTargetId: farmer && farmer.targetId != null ? String(farmer.targetId) : null, farmerTargetType: farmer && farmer.targetType || null, farmerState: farmer && farmer.state || null };
      };
    }
    if (typeof bridge._cleanReport === 'function') {
      const baseClean = bridge._cleanReport.bind(bridge);
      bridge._cleanReport = (report, sender) => {
        const clean = baseClean(report, sender);
        if (!clean) return null;
        return {
          ...clean,
          farmerTargetId: report && report.farmerTargetId != null ? String(report.farmerTargetId).slice(0, 128) : null,
          farmerTargetType: report && report.farmerTargetType != null ? String(report.farmerTargetType).slice(0, 64) : null,
          farmerState: report && report.farmerState != null ? String(report.farmerState).slice(0, 32) : null
        };
      };
    }
    bridge.__alpha27FarmerOwnershipPatched = true;
    return true;
  }

  patchTeamTargetAuthority() {
    const team = this.runtime.teamCombatCohesionHotfix;
    if (!team || team.__alpha27FarmerTargetAuthorityPatched || typeof team._team !== 'function') return false;
    const baseTeam = team._team.bind(team);
    team._team = (snapshot) => {
      const state = baseTeam(snapshot);
      if (!state || !state.leaderName) return state;
      let authoritative = null;
      let source = 'NONE';
      if (state.selfName === state.leaderName) {
        authoritative = ownedTargetId(this.runtime);
        source = 'LOCAL_FARMER_OWNER';
      } else if (this.remoteLeaderTarget && this.remoteLeaderTarget.leaderName === state.leaderName && this.remoteLeaderTarget.expiresAt > this.now()) {
        authoritative = this.remoteLeaderTarget.targetId;
        source = 'TRUSTED_DIRECT_FARMER_OWNER';
      }
      state.leaderTargetId = authoritative;
      state.leaderTargetAuthority = source;
      team.lastTeam = state;
      this.lastTargetAuthority = { at: this.now(), leaderName: state.leaderName, targetId: authoritative, source };
      return state;
    };
    team.__alpha27FarmerTargetAuthorityPatched = true;
    return true;
  }

  patchPartyFocusAuthority() {
    const focus = this.runtime.partyFocusFireHotfix;
    if (!focus || focus.__alpha27FarmerTargetAuthorityPatched) return false;
    focus._anchorTargetId = (snapshot, anchorName) => {
      if (!snapshot || !snapshot.character || !anchorName) return null;
      if (String(snapshot.character.name || '') === String(anchorName)) return ownedTargetId(this.runtime);
      if (this.remoteLeaderTarget && this.remoteLeaderTarget.leaderName === String(anchorName) && this.remoteLeaderTarget.expiresAt > this.now()) return this.remoteLeaderTarget.targetId;
      return null;
    };
    focus.__alpha27FarmerTargetAuthorityPatched = true;
    return true;
  }

  patchCohesionRecovery() {
    const cohesion = this.runtime.teamCohesionDeadlockHotfix;
    if (!cohesion || cohesion.__alpha27RecoveryOwnershipPatched) return false;
    cohesion._combatOrSafetyBusy = (snapshot) => {
      const busy = farmerOwnedCombatBusy(this.runtime, snapshot);
      if (busy) this.stats.farmerOwnedCombatHolds += 1;
      else if (snapshot && snapshot.character && snapshot.character.target) this.stats.rawAdventureTargetsIgnored += 1;
      return busy;
    };
    cohesion.__alpha27RecoveryOwnershipPatched = true;
    return true;
  }

  ensureTargetReceiver() {
    if (this.targetReceiverInstalled) return true;
    const transport = this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport;
    if (!transport || typeof transport.installDirectReceiver !== 'function') return false;
    transport.installDirectReceiver(TARGET_RECEIVER, (sender, payload) => {
      const snapshot = this.runtime.lastSnapshot;
      let team = null;
      try { team = this.runtime.teamCombatCohesionHotfix && this.runtime.teamCombatCohesionHotfix._team(snapshot); } catch (_) {}
      const valid = !!(team && team.leaderName && String(sender || '') === String(team.leaderName) && payload && payload.leaderName === team.leaderName && finite(payload.expiresAt, 0) > this.now());
      if (!valid) { this.stats.targetAuthorityRejects += 1; return false; }
      this.remoteLeaderTarget = {
        leaderName: team.leaderName,
        targetId: payload.targetId == null ? null : String(payload.targetId),
        targetType: payload.targetType == null ? null : String(payload.targetType),
        state: payload.state == null ? null : String(payload.state),
        at: finite(payload.at, this.now()),
        expiresAt: finite(payload.expiresAt, this.now())
      };
      this.stats.targetAuthorityReceives += 1;
      return true;
    });
    this.targetReceiverInstalled = true;
    return true;
  }

  publishFarmerTarget() {
    const snapshot = this.runtime.lastSnapshot;
    if (!snapshot || !snapshot.character || String(snapshot.character.ctype || '').toLowerCase() === 'merchant') return false;
    const teamCtl = this.runtime.teamCombatCohesionHotfix;
    if (!teamCtl || typeof teamCtl._team !== 'function') return false;
    let team = null;
    try { team = teamCtl._team(snapshot); } catch (_) { return false; }
    if (!team || team.selfName !== team.leaderName) return false;
    const targetId = ownedTargetId(this.runtime);
    const targetType = this.runtime.farmer && this.runtime.farmer.targetType || null;
    const state = this.runtime.farmer && this.runtime.farmer.state || null;
    const key = `${targetId || '-'}:${targetType || '-'}:${state || '-'}`;
    if (key === this.lastPublishedTargetKey && this.now() - this.lastTargetPublishAt < this.options.targetPublishMs) return false;
    const transport = this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport;
    if (!transport || typeof transport.send !== 'function') return false;
    const payload = { type: 'aio-v3-alpha27-farmer-target', leaderName: team.leaderName, targetId, targetType, state, at: this.now(), expiresAt: this.now() + this.options.targetTtlMs };
    for (const member of team.members || []) {
      if (!member || !member.name || member.name === team.leaderName) continue;
      Promise.resolve(transport.send(member.name, payload, { receiver: TARGET_RECEIVER, sender: team.leaderName })).catch(() => {});
    }
    this.lastPublishedTargetKey = key;
    this.lastTargetPublishAt = this.now();
    this.stats.targetAuthorityPublishes += 1;
    return true;
  }

  tick() {
    this.patchPartyTelemetry();
    this.patchTeamTargetAuthority();
    this.patchPartyFocusAuthority();
    this.patchCohesionRecovery();
    this.ensureTargetReceiver();
    this.publishFarmerTarget();
  }

  status() {
    return {
      targetAuthority: {
        rawAdventureLandTargetIsAuthoritative: false,
        farmerOwnedTargetIsAuthoritative: true,
        followerTargetSource: 'trusted-direct-farmer-owner',
        receiverInstalled: this.targetReceiverInstalled,
        remoteLeaderTarget: clone(this.remoteLeaderTarget),
        last: clone(this.lastTargetAuthority)
      },
      cohesionRecovery: {
        rawCharacterTargetBlocksRecovery: false,
        selfAggroBlocksRecovery: true,
        farmerOwnedEngageBlocksRecovery: true,
        recoverStateBlocksRecovery: true,
        travelStateBlocksRecovery: false
      },
      performance: {
        attribution: 'farmer-owned-target-or-self-aggro-only',
        disappearedOwnedTargetRequiresXpDeltaForKill: true,
        poisonedHistoricalProfilesQuarantined: true,
        quarantinedProfiles: this.quarantinedPerformance.size
      }
    };
  }
}

module.exports = { Alpha27CombatOwnership, TARGET_RECEIVER };
