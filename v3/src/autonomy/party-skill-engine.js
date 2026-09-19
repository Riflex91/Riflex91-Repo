'use strict';

const { Capability } = require('./skill-semantics');
const { SmartAoeState } = require('./smart-aoe-planner');

const PARTY_SKILL_ENGINE_MODE = 'party-aware-skill-engine-v2';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function ratio(value, max) { const m = finite(max); return m > 0 ? Math.max(0, Math.min(1, finite(value) / m)) : 1; }
function lower(value) { return String(value == null ? '' : value).trim().toLowerCase(); }

const CLASS_PRIORITY = {
  ranger: { supershot: 90, huntersmark: 35 },
  mage: { burst: 55, cburst: 50 },
  rogue: { quickpunch: 45, quickstab: 45, mentalburst: 55 },
  warrior: { cleave: 45, stomp: 35 },
  priest: { darkblessing: 20 }
};

class PartySkillEngine {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer || !runtime.teamCombatCohesionHotfix) throw new Error('farmer and team combat required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.team = runtime.teamCombatCohesionHotfix;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.config = {
      minTargetHpForMark: Math.max(500, finite(options.minTargetHpForMark, 2500)),
      supportHpRatio: Math.max(0.25, Math.min(0.80, finite(options.supportHpRatio, 0.55))),
      emergencyHpRatio: Math.max(0.15, Math.min(0.60, finite(options.emergencyHpRatio, 0.35))),
      overkillNormalAttackFactor: Math.max(0.8, finite(options.overkillNormalAttackFactor, 1.10)),
      expensiveMpRatio: Math.max(0.05, Math.min(0.50, finite(options.expensiveMpRatio, 0.15)))
    };
    this.lastDecision = null;
    this.lastUse = null;
    this.stats = { decisions: 0, directSkills: 0, aoeSkills: 0, aoeTargetsPlanned: 0, supportSkills: 0, defensiveSkills: 0, supershots: 0, overkillSkips: 0, cooldownSkips: 0, rangeSkips: 0, mpSkips: 0, policySkips: 0, teamGateBlocks: 0, parallelSkillMovesEnabled: 0, pullExpansions: 0 };
    this.installed = false;
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'party-skill-engine', event, severity, reason, data }); } catch (_) {}
  }

  _gameData(context) {
    return context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
  }

  _skillMeta(gameData, id) { return gameData && gameData.skills && gameData.skills[id] || null; }

  _classAllowed(meta, character) {
    if (!meta || !character) return false;
    const classes = Array.isArray(meta.class) ? meta.class : null;
    return !classes || !classes.length || classes.includes(character.ctype);
  }

  _policySettings(id, character) {
    const policy = this.runtime && this.runtime.skillPolicy;
    if (!policy || typeof policy.settings !== 'function') return null;
    try { return policy.settings(id, character); } catch (_) { return null; }
  }

  _canUse(context, id, targetId = null) {
    const adapter = context && context.adapter;
    const character = context && context.snapshot && context.snapshot.character;
    const policy = this.runtime && this.runtime.skillPolicy;
    if (policy && typeof policy.peek === 'function' && !policy.peek(id, character)) { this.stats.policySkips += 1; return false; }
    if (adapter && typeof adapter.canUseSkill === 'function' && !adapter.canUseSkill(id)) { this.stats.cooldownSkips += 1; return false; }
    if (targetId != null && adapter && typeof adapter.isSkillInRange === 'function' && !adapter.isSkillInRange(targetId, id)) { this.stats.rangeSkips += 1; return false; }
    return true;
  }

  _supportDecision(context, target, team) {
    const snapshot = context.snapshot; const c = snapshot.character; const game = this._gameData(context); const ctype = lower(c.ctype);
    const members = team && team.members || [];
    const lowest = members.slice().sort((a, b) => ratio(a.hp, a.max_hp) - ratio(b.hp, b.max_hp))[0] || null;
    const lowestRatio = lowest ? ratio(lowest.hp, lowest.max_hp) : 1;

    if (ctype === 'priest' && lowest) {
      const partyHealSettings = this._policySettings('partyheal', c);
      const healSettings = this._policySettings('heal', c);
      const partyHealThreshold = partyHealSettings && Number.isFinite(Number(partyHealSettings.parameters && partyHealSettings.parameters.hpThreshold))
        ? Number(partyHealSettings.parameters.hpThreshold) : this.config.supportHpRatio;
      const healThreshold = healSettings && Number.isFinite(Number(healSettings.parameters && healSettings.parameters.hpThreshold))
        ? Number(healSettings.parameters.hpThreshold) : this.config.supportHpRatio;
      const minInjured = Math.max(1, Math.floor(finite(
        partyHealSettings && partyHealSettings.parameters && partyHealSettings.parameters.minInjuredMembers,
        2
      )));
      const injuredCount = members.filter((row) => ratio(row.hp, row.max_hp) <= partyHealThreshold).length;

      const partyHeal = this._skillMeta(game, 'partyheal');
      if (lowestRatio <= partyHealThreshold && injuredCount >= minInjured
        && partyHeal && this._classAllowed(partyHeal, c) && finite(c.mp) >= finite(partyHeal.mp)
        && this._canUse(context, 'partyheal')) {
        return { id: 'partyheal', args: ['partyheal'], kind: 'support', reason: 'PARTY_HEAL_THRESHOLD_MET', utility: 200, injuredCount, threshold: partyHealThreshold };
      }
      const heal = this._skillMeta(game, 'heal');
      if (lowestRatio <= healThreshold
        && heal && this._classAllowed(heal, c) && finite(c.mp) >= finite(heal.mp)
        && this._canUse(context, 'heal', lowest.name)) {
        return { id: 'heal', args: ['heal', lowest.name], kind: 'support', reason: 'HEAL_THRESHOLD_MET', utility: 190, threshold: healThreshold };
      }
    }

    if (ctype === 'warrior') {
      const selfRatio = ratio(c.hp, c.max_hp);
      const shellSettings = this._policySettings('hardshell', c);
      const shellThreshold = shellSettings && Number.isFinite(Number(shellSettings.parameters && shellSettings.parameters.hpThreshold))
        ? Number(shellSettings.parameters.hpThreshold) : this.config.emergencyHpRatio;
      const shell = this._skillMeta(game, 'hardshell');
      if (selfRatio <= shellThreshold && shell && this._classAllowed(shell, c) && finite(c.mp) >= finite(shell.mp) && this._canUse(context, 'hardshell')) return { id: 'hardshell', args: ['hardshell'], kind: 'defensive', reason: 'HARDSHELL_HP_THRESHOLD_MET', utility: 180, threshold: shellThreshold };
      const taunt = this._skillMeta(game, 'taunt');
      if (target && target.target && target.target !== c.name && members.some((row) => row.name === target.target) && taunt && this._classAllowed(taunt, c) && finite(c.mp) >= finite(taunt.mp) && this._canUse(context, 'taunt', target.id)) return { id: 'taunt', args: ['taunt', String(target.id)], kind: 'support', reason: 'PROTECT_PARTY_TARGET', utility: 160 };
    }

    if (ctype === 'rogue' && ratio(c.hp, c.max_hp) < this.config.emergencyHpRatio) {
      const invis = this._skillMeta(game, 'invis');
      if (invis && this._classAllowed(invis, c) && finite(c.mp) >= finite(invis.mp) && this._canUse(context, 'invis')) return { id: 'invis', args: ['invis'], kind: 'defensive', reason: 'ROGUE_HP_EMERGENCY', utility: 170 };
    }

    if (ctype === 'ranger' && target && finite(target.hp) >= this.config.minTargetHpForMark) {
      const mark = this._skillMeta(game, 'huntersmark');
      if (mark && this._classAllowed(mark, c) && finite(c.mp) >= finite(mark.mp) && this._canUse(context, 'huntersmark', target.id)) return { id: 'huntersmark', args: ['huntersmark', String(target.id)], kind: 'support', reason: 'LONG_ENCOUNTER_MARK', utility: 75 };
    }

    return null;
  }

  _partyCapabilities() {
    const resolver = this.runtime && this.runtime.partyCapabilityResolver;
    if (!resolver || typeof resolver.status !== 'function') return null;
    try { return resolver.status(); } catch (_) { return null; }
  }

  _liveEncounterTargets(context, skillId, capacity = null) {
    const tactical = this.runtime && this.runtime.tacticalPartyCombat;
    const encounter = tactical && tactical.encounter;
    const snapshot = context && context.snapshot;
    if (!encounter || !snapshot) return [];
    const ids = Array.isArray(encounter.targetIds) ? encounter.targetIds.map(String) : [];
    const primary = String(encounter.primaryTargetId || encounter.targetId || '');
    const rows = ids
      .map((id) => (snapshot.entities || []).find((row) => row && String(row.id) === id))
      .filter((row) => row && row.mtype && !row.dead && finite(row.hp, 1) > 0)
      .filter((row) => {
        const adapter = context.adapter;
        return !adapter || typeof adapter.isSkillInRange !== 'function' || adapter.isSkillInRange(row.id, skillId);
      })
      .sort((a, b) => {
        if (String(a.id) === primary) return -1;
        if (String(b.id) === primary) return 1;
        return finite(b.hp, 0) - finite(a.hp, 0) || String(a.id).localeCompare(String(b.id));
      });
    return capacity == null ? rows : rows.slice(0, Math.max(1, Math.floor(finite(capacity, 1))));
  }

  _aoeDecision(context, target, team) {
    const tactical = this.runtime && this.runtime.tacticalPartyCombat;
    const encounter = tactical && tactical.encounter;
    const plan = encounter && encounter.aoe;
    if (!plan || plan.state !== SmartAoeState.AOE_BURN || plan.engagedCount < 2) return null;

    const snapshot = context.snapshot;
    const c = snapshot.character;
    const game = this._gameData(context);
    const partyCaps = this._partyCapabilities();
    if (!partyCaps || partyCaps.catalogReady !== true) return null;
    const member = (partyCaps.members || []).find((row) => row && row.name === c.name);
    if (!member) return null;

    const aoeCaps = new Set([
      Capability.MULTI_TARGET_DAMAGE,
      Capability.RANGED_MULTI_TARGET_DAMAGE,
      Capability.VARIABLE_MULTI_TARGET_DAMAGE,
      Capability.AOE_DAMAGE,
      Capability.AOE_CONTROL
    ]);
    const maxMp = Math.max(1, finite(c.max_mp, finite(c.mp, 1)));
    const reserve = maxMp * finite(this.farmer.skillUsage && this.farmer.skillUsage.mpReserveRatio, 0);
    const scored = [];

    for (const skill of member.skills || []) {
      if (!skill || skill.configuredReady !== true) continue;
      if (!(skill.capabilities || []).some((capability) => aoeCaps.has(capability))) continue;
      if (skill.id === 'agitate') continue;
      const meta = this._skillMeta(game, skill.id);
      if (!meta || !this._classAllowed(meta, c)) continue;
      if (!this._canUse(context, skill.id)) continue;

      const minTargets = Math.max(1, Math.floor(finite(skill.parameters && skill.parameters.minTargets, 2)));
      let capacity = skill.targetCapacity == null ? plan.pullCapacity : Math.max(1, Math.floor(finite(skill.targetCapacity, 1)));
      capacity = Math.max(1, Math.min(capacity, plan.pullCapacity || capacity, 8));
      const targets = this._liveEncounterTargets(context, skill.id, capacity);
      if (targets.length < minTargets) continue;

      let args = null;
      let mpCost = Math.max(0, finite(meta.mp, 0));
      let kind = 'aoe';
      let targetCount = targets.length;
      let reason = 'SMART_AOE_DAMAGE_WINDOW';
      let expectedFactor = Math.max(0.1, finite(meta.damage_multiplier, skill.id === 'stomp' ? 0 : 1));

      if (skill.id === '3shot' || skill.id === '5shot' || skill.id === 'fanofknives') {
        args = [skill.id, targets.map((row) => String(row.id))];
      } else if (skill.id === 'cburst') {
        const budgetRatio = Math.max(0.05, Math.min(0.50, finite(skill.parameters && skill.parameters.manaBudgetRatio, 0.20)));
        const available = Math.max(0, finite(c.mp, 0) - reserve - mpCost);
        const budget = Math.min(available, maxMp * budgetRatio);
        const manaPerTarget = Math.floor(budget / Math.max(1, targetCount));
        if (manaPerTarget < 1) { this.stats.mpSkips += 1; continue; }
        args = ['cburst', targets.map((row) => [String(row.id), manaPerTarget])];
        mpCost += manaPerTarget * targetCount;
        expectedFactor = Math.max(expectedFactor, finite(meta.ratio, 0.5) * manaPerTarget / Math.max(1, finite(c.attack, 100)));
        reason = 'SMART_AOE_CONTROLLED_BURST';
      } else if (skill.id === 'cleave') {
        args = ['cleave'];
        reason = 'SMART_AOE_CLEAVE_WINDOW';
      } else if (skill.id === 'stomp') {
        args = ['stomp'];
        kind = 'aoe-control';
        reason = 'SMART_AOE_CONTROL_WINDOW';
        expectedFactor = 0.35;
      } else if (meta.multi === true || meta.list === true) {
        args = [skill.id, targets.map((row) => String(row.id))];
      } else if ((skill.capabilities || []).includes(Capability.AOE_DAMAGE) || (skill.capabilities || []).includes(Capability.AOE_CONTROL)) {
        args = [skill.id];
      } else {
        continue;
      }

      if (finite(c.mp, 0) - mpCost < reserve) { this.stats.mpSkips += 1; continue; }
      const targetValue = targetCount * (kind === 'aoe-control' ? 22 : 34);
      const mpPenalty = mpCost / maxMp * 55;
      const skillBonus = skill.id === '5shot' ? 12 : skill.id === '3shot' ? 8 : skill.id === 'cleave' ? 10 : skill.id === 'cburst' ? 9 : 0;
      const utility = 100 + targetValue + expectedFactor * 18 + skillBonus - mpPenalty;
      scored.push({
        id: skill.id,
        args,
        kind,
        reason,
        utility,
        targetIds: targets.map((row) => String(row.id)),
        targetCount,
        mpCost,
        minTargets,
        expectedFactor
      });
    }

    scored.sort((a, b) => b.utility - a.utility || b.targetCount - a.targetCount || a.id.localeCompare(b.id));
    return scored[0] || null;
  }

  _directDecision(context, target, team) {
    const snapshot = context.snapshot; const c = snapshot.character; const game = this._gameData(context);
    const candidates = this.farmer.skillUsage && typeof this.farmer.skillUsage.candidates === 'function' ? this.farmer.skillUsage.candidates(c, game) : [];
    if (!candidates.length) return null;
    const normalDamage = Math.max(1, finite(c.attack, 100));
    const normalWouldKill = finite(target.hp, Infinity) <= normalDamage * this.config.overkillNormalAttackFactor;
    const maxMp = Math.max(1, finite(c.max_mp, finite(c.mp, 1)));
    const priorities = CLASS_PRIORITY[lower(c.ctype)] || {};
    const aligned = team && team.members && team.members.every((row) => !row.target || String(row.target) === String(target.id));
    const scored = [];

    for (const skill of candidates) {
      const mpAfter = finite(c.mp) - finite(skill.mp);
      if (mpAfter < maxMp * finite(this.farmer.skillUsage.mpReserveRatio, 0)) { this.stats.mpSkips += 1; continue; }
      if (!this._canUse(context, skill.id, target.id)) continue;
      const expensive = finite(skill.mp) >= maxMp * this.config.expensiveMpRatio;
      if (normalWouldKill && expensive) { this.stats.overkillSkips += 1; continue; }
      const estimatedDamage = normalDamage * Math.max(1, finite(skill.damageMultiplier, 1));
      const extremeOverkill = estimatedDamage > Math.max(1, finite(target.hp)) * 2 && expensive;
      if (extremeOverkill) { this.stats.overkillSkips += 1; continue; }
      const dpsGain = normalDamage * Math.max(0, finite(skill.damageMultiplier, 1) - 1) * Math.max(0.25, finite(c.frequency, 1));
      const mpPenalty = finite(skill.mp) / maxMp * 45;
      const utility = dpsGain * 0.20 + finite(priorities[skill.id]) - mpPenalty + (aligned ? 8 : 0) + (skill.id === 'supershot' ? 25 : 0);
      scored.push({ skill, utility, estimatedDamage, mpAfter });
    }
    scored.sort((a, b) => b.utility - a.utility || b.skill.damageMultiplier - a.skill.damageMultiplier || a.skill.id.localeCompare(b.skill.id));
    const best = scored[0];
    if (!best) return null;
    return { id: best.skill.id, args: [best.skill.id, String(target.id)], kind: 'damage', reason: best.skill.id === 'supershot' ? 'RANGER_SUPERSHOT_PRIORITY' : 'MAX_EXPECTED_SAFE_DPS_GAIN', utility: best.utility, skill: best.skill, mpAfter: best.mpAfter, estimatedDamage: best.estimatedDamage };
  }

  decide(context, target) {
    this.stats.decisions += 1;
    const snapshot = context && context.snapshot; const c = snapshot && snapshot.character;
    if (!snapshot || !c || !target) return null;
    const team = this.team._team(snapshot);
    const gate = this.team._combatGate(context, target, 'SKILL_ENGINE');
    if (!gate.allowed) { this.stats.teamGateBlocks += 1; this.lastDecision = { at: this.now(), action: 'HOLD', reason: gate.reason }; return null; }
    const recovery = this.farmer._needsRecovery(snapshot);
    if (c.rip || recovery.hpUnsafe || !this.farmer._targetAllowed(target, snapshot, context.party)) return null;
    const support = this._supportDecision(context, target, team);
    const aoe = this._aoeDecision(context, target, team);
    const direct = this._directDecision(context, target, team);
    const decision = aoe
      ? (support || aoe)
      : (support && (!direct || support.utility >= direct.utility) ? support : direct);
    this.lastDecision = decision ? { at: this.now(), action: 'USE_SKILL', targetId: target.id || null, targetType: target.mtype || null, ...decision } : { at: this.now(), action: 'ATTACK_OR_MOVE', reason: 'NO_HIGHER_VALUE_SKILL' };
    return decision;
  }

  _execute(context, target, decision) {
    if (!decision) return false;
    const now = this.now();
    const minInterval = this.farmer.skillUsage ? this.farmer.skillUsage.minIntervalMs : 250;
    if (now - finite(this.farmer.lastSkillAttemptAt, -Infinity) < minInterval) return false;
    const result = context.adapter.command('use_skill', decision.args);
    if (!result || (!result.executed && !result.shadow)) return false;
    this.farmer.lastSkillAttemptAt = now;
    // Prevent an additional basic attack in the same command turn, while the
    // existing kiting layer is still free to issue its independent move.
    this.farmer.lastActionAt = now;
    if (decision.kind === 'damage') this.stats.directSkills += 1;
    else if (decision.kind === 'aoe' || decision.kind === 'aoe-control') {
      this.stats.aoeSkills += 1;
      this.stats.aoeTargetsPlanned += Math.max(0, finite(decision.targetCount, 0));
    }
    else if (decision.kind === 'defensive') this.stats.defensiveSkills += 1;
    else this.stats.supportSkills += 1;
    if (decision.id === 'supershot') this.stats.supershots += 1;
    this.lastUse = { at: now, skill: decision.id, kind: decision.kind, reason: decision.reason, targetId: target.id || null, targetType: target.mtype || null, targetIds: decision.targetIds ? decision.targetIds.slice() : null, targetCount: decision.targetCount || null, executed: !!result.executed, shadow: !!result.shadow };
    if (this.farmer.lastSkillUse != null) this.farmer.lastSkillUse = { ...this.lastUse, selectionReason: decision.reason };
    this._event('PARTY_SKILL_USED', 'info', decision.reason, this.lastUse);
    return true;
  }

  install() {
    if (this.installed || this.farmer.__partySkillEngineInstalled) return false;
    const baseEngage = this.farmer._engage.bind(this.farmer);
    this.farmer._engage = (context, target) => {
      const tactical = this.runtime && this.runtime.tacticalPartyCombat;
      if (tactical && typeof tactical.maybeExpandPull === 'function') {
        const pull = tactical.maybeExpandPull(context, target);
        if (pull && pull.acted) {
          this.stats.pullExpansions += 1;
          return baseEngage(context, target);
        }
      }
      const decision = this.decide(context, target);
      const used = this._execute(context, target, decision);
      if (used) this.stats.parallelSkillMovesEnabled += 1;
      // The proven team gate/kiting pipeline remains authoritative. Because the
      // successful skill sets lastActionAt, it may kite in this same tick but it
      // will not issue a second damage command.
      return baseEngage(context, target);
    };
    this.farmer.__partySkillEngineInstalled = true;
    this.installed = true;
    this._event('PARTY_SKILL_ENGINE_INSTALLED', 'info', null, { ...this.config });
    return true;
  }

  status() {
    return { schemaVersion: 2, mode: PARTY_SKILL_ENGINE_MODE, installed: this.installed, classes: ['ranger','warrior','priest','rogue','mage','paladin'], rangerSupershotPriority: true, smartAoeExecution: true, smartAoePullExpansion: true, overkillAvoidance: true, movementParallel: true, supportAndDefensiveSkills: true, config: { ...this.config }, lastDecision: this.lastDecision, lastUse: this.lastUse, stats: { ...this.stats } };
  }
}

function installPartySkillEngine(runtime, options = {}) { return new PartySkillEngine(runtime, options); }
module.exports = { PartySkillEngine, installPartySkillEngine, PARTY_SKILL_ENGINE_MODE, CLASS_PRIORITY };
