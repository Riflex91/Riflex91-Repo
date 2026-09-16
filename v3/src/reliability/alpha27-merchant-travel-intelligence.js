'use strict';

const {
  finite,
  clone,
  inventoryOf,
  characterOf,
  gameDataOf,
  identityQuantity,
  findItem,
  rawFunction,
  errorDetails,
  errorReason
} = require('./alpha27-utils');

const MERCHANT_TRAVEL_INTELLIGENCE_MODE = 'alpha27-merchant-travel-intelligence-v1';
const DEFAULT_TOWN_CHANNEL_MS = 5000;
const DEFAULT_ROUTE_FACTOR = 1.18;
const DEFAULT_DIRECT_ROUTE_FACTOR = 1.02;
const MIN_TOWN_SAVINGS_MS = 1500;
const MIN_TOWN_WALK_DISTANCE = 350;

function uniq(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}

function serviceNpcCandidates(destination, gameData = {}) {
  if (destination == null || typeof destination === 'object') return [];
  const key = String(destination).trim();
  if (!key) return [];
  if (key === 'upgrade' || key === 'compound') return ['newupgrade'];
  const npcs = gameData && gameData.npcs && typeof gameData.npcs === 'object' ? gameData.npcs : {};
  if (Object.prototype.hasOwnProperty.call(npcs, key)) return [key];
  const candidates = [];
  for (const [id, npc] of Object.entries(npcs)) {
    if (!npc || !Array.isArray(npc.items)) continue;
    if (npc.items.some((item) => item != null && String(item) === key)) candidates.push(id);
  }
  return uniq(candidates);
}

function usableNpcLocation(value, fallbackMap = null) {
  if (!value || typeof value !== 'object') return null;
  const x = Number(value.x);
  const y = Number(value.y);
  const map = value.map != null ? String(value.map) : fallbackMap != null ? String(fallbackMap) : null;
  if (!map || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const result = { map, x, y };
  if (value.in != null) result.in = value.in;
  return result;
}

function townLocation(gameData, map) {
  const meta = gameData && gameData.maps && gameData.maps[map];
  const spawn = meta && Array.isArray(meta.spawns) && Array.isArray(meta.spawns[0]) ? meta.spawns[0] : null;
  if (!spawn || !Number.isFinite(Number(spawn[0])) || !Number.isFinite(Number(spawn[1]))) return null;
  return { map: String(map), x: Number(spawn[0]), y: Number(spawn[1]) };
}

function distance(a, b) {
  if (!a || !b) return Infinity;
  if (a.map && b.map && String(a.map) !== String(b.map)) return Infinity;
  const ax = Number(a.x != null ? a.x : a.real_x);
  const ay = Number(a.y != null ? a.y : a.real_y);
  const bx = Number(b.x != null ? b.x : b.real_x);
  const by = Number(b.y != null ? b.y : b.real_y);
  if (![ax, ay, bx, by].every(Number.isFinite)) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function directWalkAvailable(root, target) {
  const fn = rawFunction(root, 'can_move_to');
  if (!fn || !target || !Number.isFinite(Number(target.x)) || !Number.isFinite(Number(target.y))) return false;
  try { return fn.fn.call(fn.owner, Number(target.x), Number(target.y)) === true; } catch (_) { return false; }
}

function estimateWalkMs(root, character, target, routeFactor = DEFAULT_ROUTE_FACTOR) {
  const d = distance(character, target);
  if (!Number.isFinite(d)) return Infinity;
  const speed = Math.max(1, finite(character && character.speed, 40));
  const factor = directWalkAvailable(root, target) ? DEFAULT_DIRECT_ROUTE_FACTOR : routeFactor;
  return Math.round((d / speed) * 1000 * factor + 150);
}

function estimateTravelStrategy(root, runtime, resolved, state = {}) {
  const c = characterOf(runtime);
  const target = resolved && resolved.destination;
  const fallback = {
    strategy: 'SMART_MOVE',
    reason: 'DEFAULT_SAFE_ROUTE',
    currentDistance: Number.isFinite(distance(c, target)) ? Math.round(distance(c, target)) : null,
    walkEtaMs: null,
    townEtaMs: null,
    estimatedSavingsMs: null,
    town: null,
    target: clone(target)
  };
  if (!c || !target || typeof target !== 'object' || !target.map || !Number.isFinite(Number(target.x)) || !Number.isFinite(Number(target.y))) return fallback;
  if (!c.map || String(c.map) !== String(target.map)) return { ...fallback, reason: 'CROSS_MAP_SMART_MOVE_REQUIRED' };

  const walkEtaMs = estimateWalkMs(root, c, target);
  const currentDistance = distance(c, target);
  const townFn = rawFunction(root, 'town');
  if (!townFn) return { ...fallback, reason: 'TOWN_API_UNAVAILABLE', currentDistance: Math.round(currentDistance), walkEtaMs };

  const gd = gameDataOf(runtime);
  const town = townLocation(gd, c.map);
  if (!town) return { ...fallback, reason: 'TOWN_LOCATION_UNKNOWN', currentDistance: Math.round(currentDistance), walkEtaMs };

  const speed = Math.max(1, finite(c.speed, 40));
  const townToTarget = distance(town, target);
  if (!Number.isFinite(townToTarget)) return { ...fallback, reason: 'TOWN_TARGET_DISTANCE_UNKNOWN', currentDistance: Math.round(currentDistance), walkEtaMs, town };
  const townChannelMs = Math.max(1000, finite(state.townChannelEwmaMs, DEFAULT_TOWN_CHANNEL_MS));
  const townWalkMs = Math.round((townToTarget / speed) * 1000 * DEFAULT_ROUTE_FACTOR + 150);
  const townEtaMs = Math.round(townChannelMs + townWalkMs);
  const savings = Math.round(walkEtaMs - townEtaMs);
  const useTown = currentDistance >= MIN_TOWN_WALK_DISTANCE && savings >= MIN_TOWN_SAVINGS_MS;
  return {
    strategy: useTown ? 'TOWN_THEN_SMART_MOVE' : 'SMART_MOVE',
    reason: useTown ? 'TOWN_ESTIMATED_FASTER' : 'SMART_MOVE_ESTIMATED_FASTER',
    currentDistance: Math.round(currentDistance),
    walkEtaMs,
    townEtaMs,
    estimatedSavingsMs: savings,
    town,
    townToTargetDistance: Math.round(townToTarget),
    target: clone(target)
  };
}

function installAlpha27MerchantTravelIntelligence(runtime, alpha27 = null) {
  if (!runtime) return null;
  if (runtime.alpha27MerchantTravelIntelligence) return runtime.alpha27MerchantTravelIntelligence;
  const convergence = alpha27 || runtime.alpha27CombatMerchantConvergence;
  const atomic = convergence && convergence.atomic;
  const merchant = convergence && convergence.merchant;
  if (!atomic || !merchant) return null;

  const state = {
    mode: MERCHANT_TRAVEL_INTELLIGENCE_MODE,
    installedAt: typeof runtime.now === 'function' ? runtime.now() : Date.now(),
    townChannelEwmaMs: DEFAULT_TOWN_CHANNEL_MS,
    strategySelections: { SMART_MOVE: 0, TOWN_THEN_SMART_MOVE: 0 },
    townTeleports: 0,
    townTeleportFailures: 0,
    locatableNpcSelections: 0,
    ambiguousNpcFailClosed: 0,
    lastStrategy: null,
    lastNpcResolution: null,
    status() {
      return {
        mode: this.mode,
        installedAt: this.installedAt,
        townChannelEwmaMs: Math.round(this.townChannelEwmaMs),
        strategySelections: { ...this.strategySelections },
        townTeleports: this.townTeleports,
        townTeleportFailures: this.townTeleportFailures,
        locatableNpcSelections: this.locatableNpcSelections,
        ambiguousNpcFailClosed: this.ambiguousNpcFailClosed,
        lastStrategy: clone(this.lastStrategy),
        lastNpcResolution: clone(this.lastNpcResolution)
      };
    }
  };

  const baseResolve = atomic.resolveServiceDestination.bind(atomic);
  const baseTravel = atomic.namedServiceTravel.bind(atomic);

  atomic.resolveServiceDestination = function resolveServiceDestinationIntelligent(destination) {
    if (destination && typeof destination === 'object') return baseResolve(destination);
    const requested = String(destination == null ? '' : destination).trim();
    const gd = gameDataOf(this.runtime);
    const candidates = serviceNpcCandidates(requested, gd);
    if (!candidates.length) return baseResolve(destination);

    const finder = rawFunction(this.root, 'find_npc');
    const current = characterOf(this.runtime);
    if (finder) {
      for (const npcId of candidates) {
        try {
          const found = finder.fn.call(finder.owner, npcId);
          const location = usableNpcLocation(found, current && current.map);
          if (!location) continue;
          const resolved = { ok: true, requested, destination: location, npcId, npcCandidates: candidates, source: 'FIND_NPC_LOCATABLE_CANDIDATE' };
          state.locatableNpcSelections += 1;
          state.lastNpcResolution = clone(resolved);
          return resolved;
        } catch (_) {}
      }
      if (candidates.length > 1) {
        state.ambiguousNpcFailClosed += 1;
        const resolved = { ok: false, requested, destination: null, npcId: null, npcCandidates: candidates, source: 'FIND_NPC_NO_LOCATABLE_CANDIDATE', reason: 'SERVICE_NPC_LOCATION_UNRESOLVED' };
        state.lastNpcResolution = clone(resolved);
        return resolved;
      }
    }

    if (candidates.length === 1) {
      const resolved = { ok: true, requested, destination: candidates[0], npcId: candidates[0], npcCandidates: candidates, source: finder ? 'SINGLE_NPC_ID_FALLBACK' : 'NPC_ID_FALLBACK_NO_FINDER' };
      state.lastNpcResolution = clone(resolved);
      return resolved;
    }

    state.ambiguousNpcFailClosed += 1;
    const unresolved = { ok: false, requested, destination: null, npcId: null, npcCandidates: candidates, source: 'AMBIGUOUS_NPC_WITHOUT_LOCATOR', reason: 'SERVICE_NPC_LOCATION_UNRESOLVED' };
    state.lastNpcResolution = clone(unresolved);
    return unresolved;
  };

  atomic.estimateServiceTravelStrategy = function estimateServiceTravelStrategy(destination) {
    const resolved = destination && destination.ok != null ? destination : this.resolveServiceDestination(destination);
    if (!resolved || resolved.ok !== true) return { strategy: 'SMART_MOVE', reason: resolved && resolved.reason || 'SERVICE_DESTINATION_UNRESOLVED', resolved: clone(resolved) };
    return { ...estimateTravelStrategy(this.root, this.runtime, resolved, state), resolved: clone(resolved) };
  };

  atomic.namedServiceTravel = async function namedServiceTravelIntelligent(destination, tx = null) {
    const resolved = this.resolveServiceDestination(destination);
    if (!resolved.ok) {
      const reason = resolved.reason || 'SERVICE_DESTINATION_RESOLUTION_FAILED';
      if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
      this.stats.failedSafe += 1;
      this._event('ALPHA27_SERVICE_TRAVEL_FAILED_SAFE', 'error', reason, { transactionId: tx && tx.id || null, requestedDestination: destination, resolved });
      return { ok: false, reason, resolved };
    }

    const strategy = estimateTravelStrategy(this.root, this.runtime, resolved, state);
    state.lastStrategy = { at: typeof this.now === 'function' ? this.now() : Date.now(), requestedDestination: resolved.requested, npcId: resolved.npcId, ...strategy };
    state.strategySelections[strategy.strategy] = (state.strategySelections[strategy.strategy] || 0) + 1;
    this._event('ALPHA27_SERVICE_TRAVEL_STRATEGY_SELECTED', 'info', strategy.reason, {
      transactionId: tx && tx.id || null,
      requestedDestination: resolved.requested,
      npcId: resolved.npcId,
      strategy: strategy.strategy,
      currentDistance: strategy.currentDistance,
      walkEtaMs: strategy.walkEtaMs,
      townEtaMs: strategy.townEtaMs,
      estimatedSavingsMs: strategy.estimatedSavingsMs,
      town: strategy.town,
      target: strategy.target
    });

    if (strategy.strategy === 'TOWN_THEN_SMART_MOVE') {
      if (this.serviceTravelBusy) return { ok: false, reason: 'SERVICE_TRAVEL_BUSY', resolved };
      if (!this.merchantActive() || !this.supervisorAllowed() || this.merchantInCombat()) return { ok: false, reason: 'SERVICE_TRAVEL_SAFETY_HOLD', resolved };
      const town = rawFunction(this.root, 'town');
      if (!town) return baseTravel(destination, tx);
      const startedAt = typeof this.now === 'function' ? this.now() : Date.now();
      this.serviceTravelBusy = true;
      try {
        const response = await this._timeout(town.fn.call(town.owner), 'SERVICE_TOWN_TELEPORT', 15000);
        if (response && response.failed === true) throw response;
        const finishedAt = typeof this.now === 'function' ? this.now() : Date.now();
        const elapsed = Math.max(0, finishedAt - startedAt);
        if (elapsed > 0) state.townChannelEwmaMs = Math.round(state.townChannelEwmaMs * 0.7 + elapsed * 0.3);
        state.townTeleports += 1;
        this._event('ALPHA27_SERVICE_TOWN_TELEPORT_COMPLETED', 'info', 'TOWN_ESTIMATED_FASTER', {
          transactionId: tx && tx.id || null,
          requestedDestination: resolved.requested,
          elapsedMs: elapsed,
          estimatedSavingsMs: strategy.estimatedSavingsMs,
          target: clone(strategy.target)
        });
      } catch (error) {
        const details = errorDetails(error);
        const reason = details.reason || 'SERVICE_TOWN_TELEPORT_FAILED';
        if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
        this.stats.failedSafe += 1;
        state.townTeleportFailures += 1;
        this._event('ALPHA27_SERVICE_TRAVEL_FAILED_SAFE', 'error', reason, {
          transactionId: tx && tx.id || null,
          requestedDestination: resolved.requested,
          strategy: strategy.strategy,
          error: details
        });
        return { ok: false, reason, error: details, resolved, strategy };
      } finally {
        this.serviceTravelBusy = false;
      }
    }

    const travelled = await baseTravel(destination, tx);
    return travelled && typeof travelled === 'object' ? { ...travelled, strategy } : travelled;
  };

  atomic.ensureScroll = async function ensureScrollAfterVerifiedTravel(tx, scrollName) {
    let scroll = findItem(this.root, scrollName);
    if (!scroll) {
      const canBuy = rawFunction(this.root, 'can_buy');
      let definitelyNear = false;
      if (canBuy) { try { definitelyNear = canBuy.fn.call(canBuy.owner, scrollName) === true; } catch (_) {} }
      if (!definitelyNear) {
        const travelled = await this.namedServiceTravel(scrollName, tx);
        if (!travelled || travelled.ok !== true) return travelled || { ok: false, reason: 'SCROLL_VENDOR_TRAVEL_FAILED' };
      }

      const buy = rawFunction(this.root, 'buy');
      if (!buy) {
        this.runtime.transactionEngine.markFailedSafe(tx.id, 'BUY_API_UNAVAILABLE');
        this.stats.failedSafe += 1;
        return { ok: false, reason: 'BUY_API_UNAVAILABLE' };
      }
      const gd = gameDataOf(this.runtime);
      const scrollMeta = gd.items && gd.items[scrollName];
      const price = Math.max(0, finite(scrollMeta && (scrollMeta.g != null ? scrollMeta.g : scrollMeta.gold), 0));
      const c = characterOf(this.runtime);
      if (!c || finite(c.gold, 0) - price < this.options.goldReserve) {
        this.runtime.transactionEngine.markFailedSafe(tx.id, 'GOLD_RESERVE_PROTECTED');
        this.stats.failedSafe += 1;
        return { ok: false, reason: 'GOLD_RESERVE_PROTECTED' };
      }
      const before = identityQuantity(inventoryOf(this.root), scrollName, 0);
      try {
        const response = await this._timeout(buy.fn.call(buy.owner, scrollName, 1), 'BUY_SCROLL', 15000);
        if (response && response.failed === true) throw response;
        const verified = await this.verifyEventually(() => identityQuantity(inventoryOf(this.root), scrollName, 0) > before);
        if (!verified) throw new Error('SCROLL_PURCHASE_DELTA_NOT_OBSERVED');
        this.stats.scrollPurchases += 1;
        scroll = findItem(this.root, scrollName);
        if (!scroll) throw new Error('SCROLL_NOT_FOUND_AFTER_VERIFIED_PURCHASE');
      } catch (error) {
        const details = errorDetails(error);
        const reason = details.reason || 'BUY_SCROLL_FAILED';
        this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
        this.stats.failedSafe += 1;
        return { ok: false, reason, error: details };
      }
    }

    const service = await this.ensureMutationService(tx);
    if (!service.ok) return service;
    return { ok: true, scroll, service };
  };

  merchant.restockPartyPotions = async function restockPartyPotionsAfterVerifiedTravel() {
    const plan = this.runtime.lastMerchantServicePlan;
    if (!plan || plan.kind !== 'RESTOCK_REQUIRED' || !plan.need || !['hp', 'mp'].includes(plan.need.family)) return false;
    if (!await this.ensureStandClosed('PARTY_SUPPLY_RESTOCK')) return true;
    const family = plan.need.family;
    const preferred = plan.need.preferred && String(plan.need.preferred).toLowerCase().startsWith(family === 'hp' ? 'hpot' : 'mpot') ? String(plan.need.preferred) : null;
    const itemName = preferred || (family === 'hp' ? 'hpot0' : 'mpot0');
    const c = characterOf(this.runtime);
    const planner = this.runtime.merchantServicePlanner;
    const reserve = Math.max(0, finite(planner && planner.merchantPotionReserve, 80));
    const serviceTarget = Math.max(this.options.merchantPotionTarget, finite(planner && planner.targetPotionCount, 240) + reserve);
    const have = identityQuantity(inventoryOf(this.root), itemName, 0);
    if (have >= serviceTarget) return false;

    const canBuy = rawFunction(this.root, 'can_buy');
    let definitelyNear = false;
    if (canBuy) { try { definitelyNear = canBuy.fn.call(canBuy.owner, itemName) === true; } catch (_) {} }
    if (!definitelyNear) {
      this.lastMerchantPlan = { at: this.now(), action: 'SERVICE_TRAVEL', reason: 'PARTY_SUPPLY_VENDOR_REQUIRED', destination: itemName };
      const travelled = await this.atomic.namedServiceTravel(itemName);
      if (!travelled || travelled.ok !== true) {
        this.lastMerchantAction = { at: this.now(), type: 'BUY_SUPPLY', result: 'FAILED_SAFE', reason: travelled && travelled.reason || 'PARTY_SUPPLY_VENDOR_TRAVEL_FAILED' };
        return true;
      }
    }

    const buy = rawFunction(this.root, 'buy');
    if (!buy) return false;
    const gd = gameDataOf(this.runtime);
    const meta = gd.items && gd.items[itemName];
    const price = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    const affordable = price > 0 ? Math.max(0, Math.floor((finite(c && c.gold, 0) - this.options.goldReserve) / price)) : 0;
    const quantity = Math.max(0, Math.min(this.options.merchantMaxPotionBuy, Math.floor(serviceTarget - have), affordable));
    if (quantity <= 0) {
      this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'PARTY_SUPPLY_GOLD_RESERVE_PROTECTED', itemName, have, serviceTarget };
      return true;
    }

    const before = have;
    try {
      const response = await this.atomic._timeout(buy.fn.call(buy.owner, itemName, quantity), 'BUY_PARTY_SUPPLY', 15000);
      if (response && response.failed === true) throw response;
      const verified = await this.atomic.verifyEventually(() => identityQuantity(inventoryOf(this.root), itemName, 0) >= before + quantity);
      if (!verified) throw new Error('PARTY_SUPPLY_PURCHASE_DELTA_NOT_OBSERVED');
      this.stats.potionRestocks += 1;
      this.lastMerchantAction = { at: this.now(), type: 'BUY_SUPPLY', result: 'COMMITTED', itemName, quantity };
      return true;
    } catch (error) {
      this.stats.failedSafe += 1;
      this.lastMerchantAction = { at: this.now(), type: 'BUY_SUPPLY', result: 'FAILED_SAFE', reason: errorReason(error, 'BUY_PARTY_SUPPLY_FAILED') };
      return true;
    }
  };

  runtime.alpha27MerchantTravelIntelligence = state;
  try {
    if (runtime.log && typeof runtime.log.emit === 'function') runtime.log.emit({ component: 'alpha27-merchant-travel-intelligence', event: 'ALPHA27_MERCHANT_TRAVEL_INTELLIGENCE_INSTALLED', severity: 'warn', reason: 'LIVE_20_46_SERVICE_ROUTING_RECOVERY', data: state.status() });
  } catch (_) {}
  return state;
}

module.exports = {
  MERCHANT_TRAVEL_INTELLIGENCE_MODE,
  installAlpha27MerchantTravelIntelligence,
  serviceNpcCandidates,
  usableNpcLocation,
  townLocation,
  estimateTravelStrategy
};
