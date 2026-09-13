'use strict';

const ALPHA24_MODE = 'alpha24-adaptive-range-risk-logistics-v1';
const RANGED_CLASSES = new Set(['ranger', 'mage', 'priest']);
const MELEE_CLASSES = new Set(['warrior', 'rogue', 'paladin']);
const HOME_BUSY_PHASES = new Set([
  'TOWN_RETURN', 'TOWN_SERVICE', 'BANK_TRAVEL', 'BANK_SERVICE',
  'MARKET_TRAVEL', 'MARKET_SERVICE', 'PROGRESSION_SERVICE', 'RESTOCK_SERVICE'
]);

function finite(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function nameOf(value) {
  const s = String(value == null ? '' : value).trim();
  return s || null;
}

function ctypeOf(value) {
  return String(value && (value.ctype || value.type) || '').trim().toLowerCase();
}

function distance(a, b) {
  const ax = finite(a && (a.real_x != null ? a.real_x : a.x));
  const ay = finite(a && (a.real_y != null ? a.real_y : a.y));
  const bx = finite(b && (b.real_x != null ? b.real_x : b.x));
  const by = finite(b && (b.real_y != null ? b.real_y : b.y));
  if ([ax, ay, bx, by].some((x) => x == null)) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function liveMonster(entity) {
  return !!(entity && entity.mtype && !entity.dead && !entity.rip && (entity.hp == null || Number(entity.hp) > 0));
}

function gameData(runtime) {
  try {
    return runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
      ? runtime.adapter.getGameData() || {}
      : runtime && runtime.root && (runtime.root.G || runtime.root.parent && runtime.root.parent.G) || {};
  } catch (_) {
    return {};
  }
}

function registryCharacters(runtime) {
  try {
    const status = runtime && runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function'
      ? runtime.characterRegistry.status()
      : null;
    return Array.isArray(status && status.characters) ? status.characters : [];
  } catch (_) {
    return [];
  }
}

function memberRows(runtime, snapshot) {
  const byName = new Map();
  const add = (row, priority) => {
    const name = nameOf(row && row.name);
    if (!name) return;
    const old = byName.get(name);
    if (old && old.__priority > priority) return;
    const stats = row && row.stats && typeof row.stats === 'object' ? row.stats : {};
    byName.set(name, {
      name,
      ctype: ctypeOf(row),
      range: finite(row && row.range, finite(stats.range)),
      speed: finite(row && row.speed, finite(stats.speed)),
      attack: finite(row && row.attack, finite(stats.attack)),
      frequency: finite(row && row.frequency, finite(stats.frequency)),
      hp: finite(row && row.hp, finite(stats.hp)),
      max_hp: finite(row && row.max_hp, finite(stats.max_hp)),
      map: row && row.map || null,
      dead: !!(row && (row.dead || row.rip)),
      stale: !!(row && row.stale),
      __priority: priority
    });
  };
  for (const row of registryCharacters(runtime)) add(row, 1);
  for (const row of snapshot && snapshot.party || []) add(row, 2);
  for (const row of snapshot && snapshot.entities || []) {
    if (row && !row.mtype && row.name) add(row, 3);
  }
  if (snapshot && snapshot.character) add(snapshot.character, 4);
  return [...byName.values()].map(({ __priority, ...row }) => row);
}

function classFallbackRange(ctype) {
  if (ctype === 'ranger') return 120;
  if (ctype === 'mage' || ctype === 'priest') return 100;
  if (ctype === 'merchant') return 90;
  if (MELEE_CLASSES.has(ctype)) return 35;
  return null;
}

function classifyCombatStyle(member) {
  const ctype = ctypeOf(member);
  const range = finite(member && member.range, classFallbackRange(ctype));
  if (RANGED_CLASSES.has(ctype)) return 'ranged';
  if (MELEE_CLASSES.has(ctype)) return 'melee';
  if (range != null) return range >= 80 ? 'ranged' : 'melee';
  return 'unknown';
}

function tankProfile(runtime, target, snapshot = runtime && runtime.lastSnapshot) {
  const rows = memberRows(runtime, snapshot);
  const self = snapshot && snapshot.character || null;
  const claimed = nameOf(target && target.target);
  const owner = claimed && rows.find((x) => x.name === claimed)
    || rows.find((x) => self && x.name === self.name)
    || self
    || null;
  const ctype = ctypeOf(owner);
  const observedRange = finite(owner && owner.range, classFallbackRange(ctype));
  const style = classifyCombatStyle({ ...(owner || {}), range: observedRange });
  const meta = gameData(runtime).monsters && target && target.mtype
    ? gameData(runtime).monsters[target.mtype] || {}
    : {};
  const monsterRange = Math.max(0, finite(target && target.range, finite(meta.range, 25)) || 0);
  const monsterSpeed = Math.max(1, finite(target && target.speed, finite(meta.speed, 40)) || 40);
  const tankSpeed = Math.max(1, finite(owner && owner.speed, 40) || 40);
  const rangedParty = rows.filter((x) => !x.dead && classifyCombatStyle(x) === 'ranged' && ctypeOf(x) !== 'merchant').length;
  let kiteConfidence = style === 'ranged' ? 0.45 : 0;
  if (style === 'ranged' && observedRange != null && observedRange >= monsterRange + 30) kiteConfidence += 0.20;
  if (style === 'ranged' && tankSpeed >= monsterSpeed * 0.85) kiteConfidence += 0.15;
  if (style === 'ranged' && rangedParty >= 2) kiteConfidence += 0.15;
  const hp = finite(owner && owner.hp), maxHp = finite(owner && owner.max_hp);
  if (style === 'ranged' && hp != null && maxHp > 0 && hp / maxHp >= 0.72) kiteConfidence += 0.05;
  kiteConfidence = clamp(kiteConfidence, 0, 0.95);
  return {
    name: nameOf(owner && owner.name),
    ctype: ctype || null,
    combatStyle: style,
    observedRange,
    speed: tankSpeed,
    monsterRange,
    monsterSpeed,
    rangedParty,
    kiteConfidence: Number(kiteConfidence.toFixed(3)),
    kiteCapable: style === 'ranged' && kiteConfidence >= 0.65,
    source: claimed ? 'active-aggro-owner' : 'prospective-local-puller'
  };
}

function estimatePartyDps(runtime, snapshot) {
  const rows = memberRows(runtime, snapshot).filter((x) => !x.dead && ctypeOf(x) !== 'merchant');
  const self = snapshot && snapshot.character || {};
  const selfRaw = Math.max(1, (finite(self.attack, 0) || 0) * Math.max(0.1, finite(self.frequency, 1) || 1));
  let rawDps = 0;
  let observed = 0;
  let estimated = 0;
  for (const row of rows) {
    const attack = finite(row.attack);
    const frequency = finite(row.frequency);
    if (attack != null && attack > 0 && frequency != null && frequency > 0) {
      rawDps += attack * frequency;
      observed += 1;
      continue;
    }
    const style = classifyCombatStyle(row);
    const scale = style === 'ranged' ? 0.78 : 0.68;
    rawDps += selfRaw * scale;
    estimated += 1;
  }
  if (!rows.length) {
    rawDps = selfRaw;
    observed = 1;
  }
  return {
    rawDps: Math.max(1, rawDps),
    effectiveDps: Math.max(1, rawDps * 0.62),
    members: Math.max(1, rows.length),
    observedMembers: observed,
    estimatedMembers: estimated
  };
}

function estimateExpectedKillSeconds(runtime, snapshot, mtype, entities = []) {
  const gd = gameData(runtime);
  const meta = gd.monsters && gd.monsters[mtype] || {};
  const live = (entities || []).find((x) => liveMonster(x) && x.mtype === mtype) || null;
  const hp = Math.max(1,
    finite(live && live.max_hp, finite(live && live.hp, finite(meta.hp, 1))) || 1);
  const dps = estimatePartyDps(runtime, snapshot);
  return {
    hp,
    seconds: hp / dps.effectiveDps,
    ...dps
  };
}

function radialWaypoint(runtime, character, target, desiredDistance, maxStep) {
  const cx = finite(character && (character.real_x != null ? character.real_x : character.x));
  const cy = finite(character && (character.real_y != null ? character.real_y : character.y));
  const tx = finite(target && (target.real_x != null ? target.real_x : target.x));
  const ty = finite(target && (target.real_y != null ? target.real_y : target.y));
  if ([cx, cy, tx, ty].some((x) => x == null)) return null;
  const current = Math.hypot(cx - tx, cy - ty);
  if (!Number.isFinite(current) || current < 0.001) return null;
  const step = Math.min(Math.max(0, desiredDistance - current), Math.max(1, maxStep));
  if (step < 1) return null;
  const baseAngle = Math.atan2(cy - ty, cx - tx);
  const root = runtime && runtime.root || globalThis;
  const canMove = root && (root.can_move_to || root.parent && root.parent.can_move_to);
  for (const offset of [0, 18, -18, 36, -36, 54, -54]) {
    const angle = baseAngle + offset * Math.PI / 180;
    const x = cx + Math.cos(angle) * step;
    const y = cy + Math.sin(angle) * step;
    let allowed = true;
    if (typeof canMove === 'function') {
      try { allowed = canMove.call(root, x, y) !== false; } catch (_) { allowed = false; }
    }
    if (allowed) return { x, y, step, offsetDeg: offset, currentDistance: current };
  }
  return null;
}

function installMerchantMovementAuthority(runtime, stats) {
  const logistics = runtime && runtime.controlledPartyLogistics;
  const economy = runtime && runtime.economyEquipmentAutonomyV2;
  if (!logistics || logistics.__alpha24MerchantMovementAuthorityInstalled) return false;

  if (typeof logistics._rememberRendezvous === 'function') {
    const baseRemember = logistics._rememberRendezvous.bind(logistics);
    logistics._rememberRendezvous = (sender, data) => {
      const action = String(data && data.action || '');
      const senderName = nameOf(sender);
      const senderPos = { map: data && data.map || null, x: finite(data && data.x), y: finite(data && data.y) };
      if (!senderName || !senderPos.map || senderPos.x == null || senderPos.y == null) return false;
      const local = typeof logistics._character === 'function' ? logistics._character() : null;
      let within = false;
      if (local && typeof logistics._withinTransferRange === 'function') {
        try { within = logistics._withinTransferRange(local, senderPos); } catch (_) { within = false; }
      }
      if (within) {
        if (logistics.rendezvousRequests && logistics.rendezvousRequests.delete(senderName)) stats.inRangeRendezvousClears += 1;
        return false;
      }
      const serviceRelevant = ['RENDEZVOUS', 'SUPPLY_REQUEST', 'LOOT_OFFER', 'GOLD_OFFER'].includes(action);
      if (!serviceRelevant) {
        stats.nonServiceRendezvousBlocks += 1;
        return false;
      }
      return baseRemember(senderName, data);
    };
  }

  if (typeof logistics._rendezvousMerchant === 'function') {
    const baseMove = logistics._rendezvousMerchant.bind(logistics);
    logistics._rendezvousMerchant = (snapshot) => {
      const activeEconomy = economy && typeof economy._active === 'function' ? economy._active() : !!economy;
      if (activeEconomy) {
        stats.logisticsMovementAuthorityBlocks += 1;
        return false;
      }
      return baseMove(snapshot);
    };
  }

  if (economy && typeof economy._need === 'function' && !economy.__alpha24SoftRendezvousNeedInstalled) {
    const baseNeed = economy._need.bind(economy);
    economy._need = () => {
      const need = baseNeed();
      if (need && need.reason === 'LOGISTICS_RENDEZVOUS' && HOME_BUSY_PHASES.has(String(economy.phase || ''))) {
        stats.softRendezvousDeferrals += 1;
        return null;
      }
      if (need && need.reason !== 'LOGISTICS_RENDEZVOUS') stats.urgentPartyNeedsObserved += 1;
      return need;
    };
    economy.__alpha24SoftRendezvousNeedInstalled = true;
  }

  logistics.__alpha24MerchantMovementAuthorityInstalled = true;
  return true;
}

function installAdaptiveRangePositioning(runtime, stats, options = {}) {
  const farmer = runtime && runtime.farmer;
  if (!farmer || farmer.__alpha24AdaptiveRangeInstalled) return false;
  const engageFactor = clamp(options.rangedEngagementFactor == null ? 0.94 : options.rangedEngagementFactor, 0.88, 0.97);
  const tooCloseFactor = clamp(options.rangedTooCloseFactor == null ? 0.84 : options.rangedTooCloseFactor, 0.72, 0.90);
  const desiredFactor = clamp(options.rangedDesiredFactor == null ? 0.92 : options.rangedDesiredFactor, tooCloseFactor + 0.04, 0.96);
  const firePositionTrigger = clamp(options.firePositionTriggerFactor == null ? 0.80 : options.firePositionTriggerFactor, 0.65, desiredFactor - 0.04);
  const firePositionCooldownMs = Math.max(700, finite(options.firePositionCooldownMs, 1200));

  if (typeof farmer._engagementRange === 'function') {
    const baseRange = farmer._engagementRange.bind(farmer);
    farmer._engagementRange = (snapshot) => {
      const normal = baseRange(snapshot);
      const c = snapshot && snapshot.character;
      if (classifyCombatStyle(c) !== 'ranged') return normal;
      const range = finite(c && c.range);
      if (range == null || range < 60) return normal;
      stats.rangedEngagementRangeEvaluations += 1;
      return Math.max(normal, range * engageFactor);
    };
  }

  const kiting = farmer.kiting;
  if (kiting) {
    kiting.tooCloseFactor = Math.max(finite(kiting.tooCloseFactor, 0), tooCloseFactor);
    kiting.desiredFactor = Math.max(finite(kiting.desiredFactor, 0), desiredFactor);
  }

  if (typeof farmer._engage === 'function') {
    const baseEngage = farmer._engage.bind(farmer);
    let lastFirePositionAt = -Infinity;
    farmer._engage = (context, target) => {
      const snapshot = context && context.snapshot;
      const c = snapshot && snapshot.character;
      if (c && liveMonster(target) && classifyCombatStyle(c) === 'ranged' && target.target && String(target.target) !== String(c.name || '')) {
        const range = finite(c.range);
        const d = distance(c, target);
        const now = runtime.now ? runtime.now() : Date.now();
        if (range != null && range >= 60 && Number.isFinite(d) && d < range * firePositionTrigger && now - lastFirePositionAt >= firePositionCooldownMs) {
          let unsafe = false;
          try { unsafe = !!(typeof farmer._needsRecovery === 'function' && farmer._needsRecovery(snapshot).hpUnsafe); } catch (_) {}
          if (!unsafe) {
            const desired = range * desiredFactor;
            const maxStep = Math.min(range * 0.42, Math.max(20, (finite(c.speed, 40) || 40) * 1.15));
            const waypoint = radialWaypoint(runtime, c, target, desired, maxStep);
            if (waypoint && context.adapter && typeof context.adapter.command === 'function') {
              const result = context.adapter.command('move', [waypoint.x, waypoint.y]);
              if (result && (result.executed || result.shadow || result.coalesced)) {
                lastFirePositionAt = now;
                farmer.lastActionAt = now;
                stats.rangedFirePositionMoves += 1;
                if (typeof farmer._event === 'function') farmer._event('FARMER_RANGE_POSITION_REQUESTED', 'info', 'MAXIMIZE_RANGED_FIRE_POSITION', {
                  distance: Number(d.toFixed(2)),
                  range,
                  desiredDistance: Number(desired.toFixed(2)),
                  tank: tankProfile(runtime, target, snapshot)
                });
                return;
              }
            }
          }
        }
      }
      return baseEngage(context, target);
    };
  }

  farmer.__alpha24AdaptiveRangeInstalled = true;
  farmer.__alpha24RangeConfig = { engageFactor, tooCloseFactor, desiredFactor, firePositionTrigger, firePositionCooldownMs };
  return true;
}

function installKiteAwareRisk(runtime, stats, options = {}) {
  const farmer = runtime && runtime.farmer;
  const risk = runtime && (runtime.combatRisk || runtime.combatRiskGate)
    || farmer && (farmer.combatRisk || farmer.combatRiskGate || farmer.riskGate);
  if (!risk || typeof risk.evaluate !== 'function' || risk.__alpha24KiteAwareRiskInstalled) return false;
  const base = risk.evaluate.bind(risk);
  const maxAdditionalAggro = Math.max(1, Math.min(3, Math.floor(finite(options.maxKiteAdditionalAggro, 2))));
  const mitigationScale = clamp(options.kiteRiskMitigationScale == null ? 0.78 : options.kiteRiskMitigationScale, 0.45, 0.9);
  const maxLearnedDeathsPerHour = clamp(options.maxKiteDeathsPerHour == null ? 0.60 : options.maxKiteDeathsPerHour, 0.25, 1.0);
  risk.evaluate = (entity, snapshot, world, party) => {
    const result = base(entity, snapshot, world, party);
    if (!result || result.allowed || !entity || entity.target) return result;
    if (!['ADDITIONAL_AGGRO', 'RISK_THRESHOLD_EXCEEDED'].includes(String(result.reason || ''))) return result;
    const signals = result.signals || {};
    const additional = Math.max(0, finite(signals.additionalAggro, 0));
    const hpRatio = finite(signals.hpRatio, 1);
    const deaths = Math.max(0, finite(signals.deathsPerHour, 0));
    if (additional < 1 || additional > maxAdditionalAggro || hpRatio < 0.72 || deaths > maxLearnedDeathsPerHour) return result;
    const tank = tankProfile(runtime, entity, snapshot);
    if (!tank.kiteCapable || tank.kiteConfidence < 0.65) return result;
    const addContribution = Math.max(0, finite(signals.additionalAggroContribution, 0));
    if (addContribution <= 0) return result;
    const originalScore = clamp(finite(result.score, 1), 0, 1);
    const mitigatedAdd = addContribution * (1 - mitigationScale * tank.kiteConfidence);
    const nonAggroScore = Math.max(0, originalScore - addContribution);
    const mitigatedScore = clamp(nonAggroScore + mitigatedAdd, 0, 1);
    const threshold = clamp(finite(result.threshold, finite(risk.threshold, 0.65)), 0.1, 1);
    if (mitigatedScore >= threshold) return { ...result, kiteAssessment: tank, mitigatedScore: Number(mitigatedScore.toFixed(3)) };
    stats.kiteRiskOverrides += 1;
    return {
      ...result,
      allowed: true,
      score: Number(mitigatedScore.toFixed(3)),
      reason: 'KITE_MITIGATED_RISK_ACCEPTABLE',
      originalScore: Number(originalScore.toFixed(3)),
      kiteAssessment: tank,
      signals: { ...signals, kiteMitigationApplied: Number((addContribution - mitigatedAdd).toFixed(3)) }
    };
  };
  risk.__alpha24KiteAwareRiskInstalled = true;
  return true;
}

function installEfficiencyAwareTargeting(runtime, stats, options = {}) {
  const farmer = runtime && runtime.farmer;
  if (!farmer || farmer.__alpha24EfficiencyTargetingInstalled || typeof farmer._candidateRows !== 'function') return false;
  const hardMaxKillSeconds = Math.max(35, Math.min(110, finite(options.hardMaxKillSeconds, 75)));
  const softKillSeconds = Math.max(12, Math.min(hardMaxKillSeconds - 5, finite(options.softKillSeconds, 30)));
  const baseRows = farmer._candidateRows.bind(farmer);
  farmer._candidateRows = (context) => {
    const result = baseRows(context) || { rows: [], monsters: [] };
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const monsters = Array.isArray(result.monsters) ? result.monsters : [];
    const snapshot = context && context.snapshot || runtime.lastSnapshot;
    const gd = gameData(runtime);
    result.rows = rows.map((row) => {
      const mtype = row.monster || row.id;
      const estimate = estimateExpectedKillSeconds(runtime, snapshot, mtype, monsters);
      const seconds = estimate.seconds;
      const meta = gd.monsters && gd.monsters[mtype] || {};
      let xpPerHour = Math.max(0, finite(row.xpPerHour, 0));
      if (String(row.source || '').startsWith('estimate') && finite(meta.xp, 0) > 0) {
        const cycleSeconds = Math.max(1, seconds + 1.5);
        xpPerHour = Math.max(0, finite(meta.xp, 0)) * 3600 / cycleSeconds;
      }
      const hardRejected = seconds > hardMaxKillSeconds;
      const efficiency = seconds <= softKillSeconds ? 1 : clamp(1 - ((seconds - softKillSeconds) / Math.max(1, hardMaxKillSeconds - softKillSeconds)) * 0.38, 0.62, 1);
      if (hardRejected) stats.killTimeRejects += 1;
      return {
        ...row,
        xpPerHour: xpPerHour * efficiency,
        expectedKillSeconds: Number(seconds.toFixed(2)),
        estimatedPartyDps: Number(estimate.effectiveDps.toFixed(2)),
        partyDpsMembers: estimate.members,
        efficiencyMultiplier: Number(efficiency.toFixed(3)),
        unsafe: !!row.unsafe || hardRejected,
        inefficiencyReason: hardRejected ? 'EXPECTED_KILL_TIME_TOO_LONG' : seconds > softKillSeconds ? 'LONG_KILL_TIME_PENALTY' : null
      };
    });
    stats.targetEfficiencyEvaluations += result.rows.length;
    return result;
  };

  const planner = farmer.planner;
  if (planner && typeof planner.rank === 'function' && !planner.__alpha24AdaptiveRiskBudgetInstalled) {
    const baseRank = planner.rank.bind(planner);
    planner.rank = (candidates, context) => {
      const snapshot = runtime.lastSnapshot;
      const representative = snapshot && (snapshot.entities || []).find(liveMonster) || null;
      const profile = tankProfile(runtime, representative, snapshot);
      const old = finite(planner.maxDeathsPerHour, 0.25);
      if (profile.kiteCapable && profile.kiteConfidence >= 0.7) planner.maxDeathsPerHour = Math.max(old, 0.60);
      try {
        if (planner.maxDeathsPerHour > old) stats.adaptiveRiskBudgetUses += 1;
        return baseRank(candidates, context);
      } finally {
        planner.maxDeathsPerHour = old;
      }
    };
    planner.__alpha24AdaptiveRiskBudgetInstalled = true;
  }

  farmer.__alpha24EfficiencyTargetingInstalled = true;
  farmer.__alpha24EfficiencyConfig = { hardMaxKillSeconds, softKillSeconds };
  return true;
}

class Alpha24AdaptiveRangeRiskLogisticsHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.installedAt = this.now();
    this.stats = {
      nonServiceRendezvousBlocks: 0,
      inRangeRendezvousClears: 0,
      logisticsMovementAuthorityBlocks: 0,
      softRendezvousDeferrals: 0,
      urgentPartyNeedsObserved: 0,
      rangedEngagementRangeEvaluations: 0,
      rangedFirePositionMoves: 0,
      kiteRiskOverrides: 0,
      targetEfficiencyEvaluations: 0,
      killTimeRejects: 0,
      adaptiveRiskBudgetUses: 0
    };
    this.merchantMovementAuthorityInstalled = installMerchantMovementAuthority(runtime, this.stats);
    this.adaptiveRangePositioningInstalled = installAdaptiveRangePositioning(runtime, this.stats, options);
    this.kiteAwareRiskInstalled = installKiteAwareRisk(runtime, this.stats, options);
    this.efficiencyAwareTargetingInstalled = installEfficiencyAwareTargeting(runtime, this.stats, options);
    if (runtime.log && typeof runtime.log.emit === 'function') {
      try { runtime.log.emit({ component: 'alpha24-adaptive-stability', event: 'ALPHA24_ADAPTIVE_STABILITY_INSTALLED', severity: 'info', data: this.status() }); } catch (_) {}
    }
  }

  status() {
    const farmer = this.runtime.farmer;
    const snapshot = this.runtime.lastSnapshot;
    const target = snapshot && farmer && farmer.targetId != null
      ? (snapshot.entities || []).find((x) => x && String(x.id) === String(farmer.targetId))
      : null;
    return {
      schemaVersion: 1,
      mode: ALPHA24_MODE,
      installedAt: this.installedAt,
      merchantMovementAuthorityInstalled: this.merchantMovementAuthorityInstalled,
      adaptiveRangePositioningInstalled: this.adaptiveRangePositioningInstalled,
      kiteAwareRiskInstalled: this.kiteAwareRiskInstalled,
      efficiencyAwareTargetingInstalled: this.efficiencyAwareTargetingInstalled,
      rangeConfig: farmer && farmer.__alpha24RangeConfig || null,
      efficiencyConfig: farmer && farmer.__alpha24EfficiencyConfig || null,
      currentTankAssessment: tankProfile(this.runtime, target, snapshot),
      stats: { ...this.stats },
      policies: {
        economyV2OwnsMerchantMovementWhileActive: true,
        statusRequestsNeverCreateRendezvousMovement: true,
        inRangeServiceClearsRendezvous: true,
        logisticsRendezvousIsSoftDuringHomeService: true,
        rangerAndOtherRangedClassesUseNearMaximumRange: true,
        onlyAggroHolderUsesKitingController: true,
        nonAggroRangedCharactersMayRepositionToFireBand: true,
        kiteCapabilityMitigatesButDoesNotEraseRisk: true,
        dangerousContentStillAbsolute: true,
        expectedKillTimeHardBounded: true,
        commandCharacterAuthorityWidened: false
      }
    };
  }
}

function installAlpha24AdaptiveRangeRiskLogisticsHotfix(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha24AdaptiveRangeRiskLogisticsHotfix) return runtime.alpha24AdaptiveRangeRiskLogisticsHotfix;
  const hotfix = new Alpha24AdaptiveRangeRiskLogisticsHotfix(runtime, options);
  runtime.alpha24AdaptiveRangeRiskLogisticsHotfix = hotfix;
  return hotfix;
}

module.exports = {
  ALPHA24_MODE,
  classifyCombatStyle,
  tankProfile,
  estimatePartyDps,
  estimateExpectedKillSeconds,
  installMerchantMovementAuthority,
  installAdaptiveRangePositioning,
  installKiteAwareRisk,
  installEfficiencyAwareTargeting,
  Alpha24AdaptiveRangeRiskLogisticsHotfix,
  installAlpha24AdaptiveRangeRiskLogisticsHotfix
};
