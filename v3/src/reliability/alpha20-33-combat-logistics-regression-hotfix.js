'use strict';

const ALPHA20_33_MODE = 'alpha20.33-combat-logistics-regression-v1';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nameOf(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function point(value) {
  return {
    x: finite(value && (value.real_x != null ? value.real_x : value.x)),
    y: finite(value && (value.real_y != null ? value.real_y : value.y))
  };
}

function distance(a, b) {
  const pa = point(a);
  const pb = point(b);
  if ([pa.x, pa.y, pb.x, pb.y].some((value) => value == null)) return Infinity;
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

function liveMonster(entity) {
  return !!(entity && entity.mtype && !entity.dead && !entity.rip && (entity.hp == null || Number(entity.hp) > 0));
}

function runtimeCharacter(runtime, snapshot = null) {
  return snapshot && snapshot.character
    || runtime && runtime.lastSnapshot && runtime.lastSnapshot.character
    || runtime && runtime.root && (runtime.root.character || runtime.root.parent && runtime.root.parent.character)
    || null;
}

function snapshotEntities(runtime, snapshot = null) {
  const rows = [];
  const add = (entity) => { if (entity && !rows.includes(entity)) rows.push(entity); };
  for (const entity of snapshot && snapshot.entities || []) add(entity);
  for (const entity of runtime && runtime.lastSnapshot && runtime.lastSnapshot.entities || []) add(entity);
  const root = runtime && runtime.root || globalThis;
  const parent = root && root.parent || root;
  for (const entity of Object.values(parent && parent.entities || {})) add(entity);
  for (const entity of Object.values(root && root.entities || {})) add(entity);
  return rows;
}

function hasIncomingAggro(runtime, snapshot = null) {
  const c = runtimeCharacter(runtime, snapshot);
  const self = nameOf(c && c.name);
  if (!self) return true;
  return snapshotEntities(runtime, snapshot).some((entity) => liveMonster(entity) && String(entity.target || '') === self);
}

function emit(runtime, component, event, severity = 'info', reason = null, data = {}) {
  try {
    if (runtime && runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({ component, event, severity, reason, data });
    }
  } catch (_) {}
}

function installActiveAggroKiteCohesionBypass(runtime, stats) {
  const farmer = runtime && runtime.farmer;
  const kiting = farmer && farmer.kiting;
  if (!kiting || typeof kiting.evaluate !== 'function' || kiting.__alpha20_33AggroKiteCohesionBypassInstalled) return false;
  const base = kiting.evaluate.bind(kiting);
  kiting.evaluate = (character, target) => {
    const decision = base(character, target);
    if (!decision || decision.shouldMove !== false || String(decision.reason || '') !== 'TEAM_COHESION_KITE_LIMIT') return decision;
    const self = nameOf(character && character.name) || nameOf(runtimeCharacter(runtime) && runtimeCharacter(runtime).name);
    if (!self || !liveMonster(target) || String(target.target || '') !== self) return decision;
    stats.kitingCohesionBypasses += 1;
    emit(runtime, 'alpha20-33-combat-logistics', 'ACTIVE_AGGRO_KITE_COHESION_BYPASS', 'info', 'ACTIVE_AGGRO_OUTRANKS_SOFT_FORMATION_LIMIT', {
      targetId: target.id == null ? null : String(target.id),
      targetType: target.mtype || null,
      previousReason: decision.reason || null,
      x: finite(decision.x),
      y: finite(decision.y)
    });
    return {
      ...decision,
      shouldMove: true,
      reason: 'ACTIVE_AGGRO_KITE_COHESION_BYPASS',
      teamCohesionBlocked: false,
      aggroAuthorized: true
    };
  };
  kiting.__alpha20_33AggroKiteCohesionBypassInstalled = true;
  return true;
}

function installSupportAggroMovementGate(runtime, stats) {
  const farmer = runtime && runtime.farmer;
  if (!farmer || typeof farmer._engage !== 'function' || farmer.__alpha20_33SupportAggroMovementGateInstalled) return false;
  const baseEngage = farmer._engage.bind(farmer);
  farmer._engage = (context, target) => {
    const snapshot = context && context.snapshot || runtime.lastSnapshot;
    const c = snapshot && snapshot.character;
    const self = nameOf(c && c.name);
    const aggroOwner = nameOf(target && target.target);
    const adapter = context && context.adapter;
    if (!self || !adapter || typeof adapter.command !== 'function' || !liveMonster(target) || !aggroOwner || aggroOwner === self) {
      return baseEngage(context, target);
    }

    const guardedAdapter = Object.create(adapter);
    guardedAdapter.command = (action, args) => {
      if (String(action || '') === 'move' && Array.isArray(args) && args.length >= 2) {
        const proposed = { x: finite(args[0]), y: finite(args[1]) };
        const currentDistance = distance(c, target);
        const proposedDistance = distance(proposed, target);
        if (Number.isFinite(currentDistance) && Number.isFinite(proposedDistance) && proposedDistance > currentDistance + 0.5) {
          stats.nonAggroOutwardMovesBlocked += 1;
          emit(runtime, 'alpha20-33-combat-logistics', 'FARMER_SUPPORT_RETREAT_BLOCKED', 'info', 'NO_SELF_AGGRO_HOLD_FIRE_POSITION', {
            targetId: target.id == null ? null : String(target.id),
            targetType: target.mtype || null,
            aggroOwner,
            currentDistance: Number(currentDistance.toFixed(2)),
            proposedDistance: Number(proposedDistance.toFixed(2))
          });
          return { executed: false, shadow: false, coalesced: false, reason: 'SUPPORT_NO_SELF_AGGRO_RETREAT_BLOCKED' };
        }
      }
      return adapter.command.call(adapter, action, args);
    };
    return baseEngage({ ...context, adapter: guardedAdapter }, target);
  };
  farmer.__alpha20_33SupportAggroMovementGateInstalled = true;
  return true;
}

function installMerchantIncomingAggroAuthority(runtime, parentAlpha27, stats) {
  let installed = false;
  const install = (owner, key) => {
    if (!owner || typeof owner[key] !== 'function') return false;
    const marker = `__alpha20_33_${key}_incomingAggroOnly`;
    if (owner[marker]) return false;
    owner[key] = () => {
      const c = runtimeCharacter(runtime);
      const incoming = hasIncomingAggro(runtime);
      if (!incoming && c && c.target) stats.merchantTargetOnlyCombatHoldsPrevented += 1;
      return incoming;
    };
    owner[marker] = true;
    return true;
  };
  installed = install(runtime, '_merchantInCombat') || installed;
  installed = install(parentAlpha27 && parentAlpha27.atomic, 'merchantInCombat') || installed;
  return installed;
}

function cloneSnapshotWithGold(snapshot, gold) {
  if (!snapshot || !snapshot.character) return snapshot;
  return { ...snapshot, character: { ...snapshot.character, gold } };
}

function installFarmerGoldWindow(runtime, stats, options = {}) {
  const logistics = runtime && runtime.controlledPartyLogistics;
  if (!logistics || logistics.__alpha20_33FarmerGoldWindowInstalled) return false;
  const windowMs = Math.max(30000, finite(options.goldWindowMs, 30000));
  const state = {
    windowMs,
    observations: [],
    observationKeys: new Set(),
    windowStartedAt: null,
    lastGoldTransferAt: -Infinity,
    inFlight: null
  };

  const observeLoot = () => {
    const observation = runtime.controlledFarmerLoot && runtime.controlledFarmerLoot.lastObservation;
    const amount = Math.max(0, Math.floor(finite(observation && observation.delta && observation.delta.gold, 0)));
    if (amount <= 0) return false;
    const at = finite(observation && observation.at, runtime.now ? runtime.now() : Date.now());
    const key = `${nameOf(observation && observation.requestId) || 'loot'}:${at}`;
    if (state.observationKeys.has(key)) return false;
    state.observationKeys.add(key);
    state.observations.push({ at, amount, key });
    state.observations.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
    if (state.windowStartedAt == null) state.windowStartedAt = at;
    stats.goldLootObservations += 1;
    return true;
  };

  const amountInWindow = (now) => state.observations
    .filter((row) => row.at >= now - state.windowMs && (!state.inFlight || row.at > state.inFlight.throughAt))
    .reduce((sum, row) => sum + row.amount, 0);

  const eligibleAmount = (snapshot, now) => {
    const amount = amountInWindow(now);
    if (amount <= 0) return 0;
    if (state.windowStartedAt == null || now - state.windowStartedAt < state.windowMs) return 0;
    if (now - state.lastGoldTransferAt < state.windowMs) return 0;
    const reserve = Math.max(0, Math.floor(finite(logistics.config && logistics.config.farmerGoldReserve, 0)));
    const available = Math.max(0, Math.floor(finite(snapshot && snapshot.character && snapshot.character.gold, 0) - reserve));
    if (available < amount) {
      stats.goldWindowInsufficientSurplus += 1;
      return 0;
    }
    return amount;
  };

  if (typeof logistics._offerOutbound === 'function') {
    const baseOffer = logistics._offerOutbound.bind(logistics);
    logistics._offerOutbound = (snapshot) => {
      const now = runtime.now ? runtime.now() : Date.now();
      const amount = eligibleAmount(snapshot, now);
      const reserve = Math.max(0, Math.floor(finite(logistics.config && logistics.config.farmerGoldReserve, 0)));
      if (amount <= 0 || state.inFlight) {
        if (amountInWindow(now) > 0) stats.goldWindowHolds += 1;
        return baseOffer(cloneSnapshotWithGold(snapshot, reserve));
      }
      const previousCap = logistics.config.maxGoldBatch;
      logistics.config.maxGoldBatch = Math.max(previousCap, amount);
      try {
        const before = logistics.pendingOffer;
        const result = baseOffer(cloneSnapshotWithGold(snapshot, reserve + amount));
        if (logistics.pendingOffer && logistics.pendingOffer !== before && logistics.pendingOffer.kind === 'gold') {
          state.inFlight = { amount, throughAt: now, offerId: logistics.pendingOffer.offerId || null };
          logistics.pendingOffer.goldWindowMs = state.windowMs;
          logistics.pendingOffer.windowLootAmount = amount;
          stats.goldWindowOffers += 1;
        }
        return result;
      } finally {
        logistics.config.maxGoldBatch = previousCap;
      }
    };
  }

  if (typeof logistics._executeGrant === 'function') {
    const baseExecute = logistics._executeGrant.bind(logistics);
    logistics._executeGrant = (snapshot) => {
      if (logistics.pendingOffer && logistics.pendingOffer.kind === 'gold' && state.inFlight) {
        const reserve = Math.max(0, Math.floor(finite(logistics.config && logistics.config.farmerGoldReserve, 0)));
        const available = Math.max(0, Math.floor(finite(snapshot && snapshot.character && snapshot.character.gold, 0) - reserve));
        if (available < state.inFlight.amount) {
          logistics.pendingOffer = null;
          logistics.pendingGrant = null;
          state.inFlight = null;
          stats.goldWindowInsufficientSurplus += 1;
          return false;
        }
        const previousCap = logistics.config.maxGoldBatch;
        logistics.config.maxGoldBatch = Math.max(previousCap, state.inFlight.amount);
        try { return baseExecute(snapshot); }
        finally { logistics.config.maxGoldBatch = previousCap; }
      }
      return baseExecute(snapshot);
    };
  }

  if (typeof logistics._verifyPendingOutbound === 'function') {
    const baseVerify = logistics._verifyPendingOutbound.bind(logistics);
    logistics._verifyPendingOutbound = (snapshot) => {
      const beforeVerified = finite(logistics.stats && logistics.stats.goldVerified, 0);
      const result = baseVerify(snapshot);
      const afterVerified = finite(logistics.stats && logistics.stats.goldVerified, 0);
      if (state.inFlight && afterVerified > beforeVerified) {
        const now = runtime.now ? runtime.now() : Date.now();
        state.lastGoldTransferAt = now;
        const throughAt = state.inFlight.throughAt;
        state.observations = state.observations.filter((row) => row.at > throughAt);
        state.windowStartedAt = state.observations.length ? state.observations[0].at : null;
        state.inFlight = null;
        stats.goldWindowTransfers += 1;
      } else if (state.inFlight && !logistics.pendingOffer && !logistics.pendingGrant && !logistics.pendingOutbound) {
        state.inFlight = null;
      }
      return result;
    };
  }

  if (typeof logistics.tick === 'function') {
    const baseTick = logistics.tick.bind(logistics);
    logistics.tick = (snapshot) => {
      if (snapshot && snapshot.character && String(snapshot.character.ctype || '').toLowerCase() !== 'merchant') observeLoot();
      return baseTick(snapshot);
    };
  }

  if (typeof logistics.status === 'function') {
    const baseStatus = logistics.status.bind(logistics);
    logistics.status = () => {
      const now = runtime.now ? runtime.now() : Date.now();
      return {
        ...baseStatus(),
        goldTransferWindow: {
          windowMs: state.windowMs,
          windowStartedAt: state.windowStartedAt,
          lastGoldTransferAt: Number.isFinite(state.lastGoldTransferAt) ? state.lastGoldTransferAt : null,
          pendingLootGoldInLastWindow: amountInWindow(now),
          inFlight: state.inFlight ? { ...state.inFlight } : null
        }
      };
    };
  }

  logistics.config.goldTransferWindowMs = state.windowMs;
  logistics.__alpha20_33GoldWindowState = state;
  logistics.__alpha20_33FarmerGoldWindowInstalled = true;
  return true;
}

class Alpha2033CombatLogisticsRegressionHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.installedAt = this.now();
    this.stats = {
      kitingCohesionBypasses: 0,
      nonAggroOutwardMovesBlocked: 0,
      merchantTargetOnlyCombatHoldsPrevented: 0,
      goldLootObservations: 0,
      goldWindowOffers: 0,
      goldWindowTransfers: 0,
      goldWindowHolds: 0,
      goldWindowInsufficientSurplus: 0
    };
    this.kitingCohesionBypassInstalled = installActiveAggroKiteCohesionBypass(runtime, this.stats);
    this.supportAggroMovementGateInstalled = installSupportAggroMovementGate(runtime, this.stats);
    this.merchantIncomingAggroAuthorityInstalled = installMerchantIncomingAggroAuthority(runtime, options.parentAlpha27, this.stats);
    this.farmerGoldWindowInstalled = installFarmerGoldWindow(runtime, this.stats, options);
    emit(runtime, 'alpha20-33-combat-logistics', 'ALPHA20_33_COMBAT_LOGISTICS_REGRESSION_INSTALLED', 'info', null, this.status());
  }

  status() {
    const logistics = this.runtime.controlledPartyLogistics;
    const gold = logistics && logistics.__alpha20_33GoldWindowState;
    const now = this.now();
    return {
      schemaVersion: 1,
      mode: ALPHA20_33_MODE,
      installedAt: this.installedAt,
      installed: {
        kitingCohesionBypass: this.kitingCohesionBypassInstalled,
        supportAggroMovementGate: this.supportAggroMovementGateInstalled,
        merchantIncomingAggroAuthority: this.merchantIncomingAggroAuthorityInstalled,
        farmerGoldWindow: this.farmerGoldWindowInstalled
      },
      config: {
        goldTransferWindowMs: gold ? gold.windowMs : null
      },
      policies: {
        activeAggroMayBypassSoftKiteCohesionLimit: true,
        supportCharactersDoNotRetreatWithoutSelfAggro: true,
        merchantCombatRequiresIncomingMonsterAggro: true,
        merchantOwnTargetDoesNotCountAsIncomingAggro: true,
        farmerGoldTransferMinIntervalMs: gold ? gold.windowMs : 30000,
        farmerGoldTransferAmountUsesRecentLootWindow: true,
        itemTransfersRemainAvailableWhileGoldBatches: true
      },
      goldWindow: gold ? {
        windowStartedAt: gold.windowStartedAt,
        lastGoldTransferAt: Number.isFinite(gold.lastGoldTransferAt) ? gold.lastGoldTransferAt : null,
        pendingLootGoldInLastWindow: gold.observations.filter((row) => row.at >= now - gold.windowMs && (!gold.inFlight || row.at > gold.inFlight.throughAt)).reduce((sum, row) => sum + row.amount, 0),
        inFlight: gold.inFlight ? { ...gold.inFlight } : null
      } : null,
      stats: { ...this.stats }
    };
  }
}

function installAlpha2033CombatLogisticsRegressionHotfix(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha20_33CombatLogisticsRegressionHotfix) return runtime.alpha20_33CombatLogisticsRegressionHotfix;
  const module = new Alpha2033CombatLogisticsRegressionHotfix(runtime, options);
  runtime.alpha20_33CombatLogisticsRegressionHotfix = module;
  return module;
}

module.exports = {
  ALPHA20_33_MODE,
  hasIncomingAggro,
  installActiveAggroKiteCohesionBypass,
  installSupportAggroMovementGate,
  installMerchantIncomingAggroAuthority,
  installFarmerGoldWindow,
  Alpha2033CombatLogisticsRegressionHotfix,
  installAlpha2033CombatLogisticsRegressionHotfix
};
