'use strict';

const { finite, clone, text, errorDetails, errorReason, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicTransactions } = require('./alpha27-atomic-transactions');

function serviceNpcId(destination, gameData = {}) {
  if (destination == null || typeof destination === 'object') return null;
  const key = String(destination).trim();
  if (!key) return null;
  if (key === 'upgrade' || key === 'compound') return 'newupgrade';
  const npcs = gameData && gameData.npcs && typeof gameData.npcs === 'object' ? gameData.npcs : {};
  if (Object.prototype.hasOwnProperty.call(npcs, key)) return key;
  for (const [id, npc] of Object.entries(npcs)) {
    if (!npc || !Array.isArray(npc.items)) continue;
    if (npc.items.some((item) => item != null && String(item) === key)) return id;
  }
  return null;
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

class Alpha27AtomicService extends Alpha27AtomicTransactions {
  _sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    return new Promise((resolve) => setTimer(resolve, ms));
  }

  _timeout(promise, label, ms = null) {
    const setTimer = this.root && this.root.setTimeout || setTimeout;
    const clearTimer = this.root && this.root.clearTimeout || clearTimeout;
    let timer = null;
    const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new Error(`${label}_TIMEOUT`)), ms == null ? this.options.serviceTravelTimeoutMs : ms); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => { if (timer != null) clearTimer(timer); });
  }

  async verifyEventually(test) {
    for (let attempt = 0; attempt < this.options.verifyAttempts; attempt += 1) {
      let result = false;
      try { result = test(); } catch (_) {}
      if (result) return true;
      if (attempt + 1 < this.options.verifyAttempts) await this._sleep(this.options.verifyDelayMs);
    }
    return false;
  }

  resolveServiceDestination(destination) {
    if (destination && typeof destination === 'object') {
      return { ok: true, requested: clone(destination), destination: clone(destination), npcId: null, source: 'DIRECT_OBJECT' };
    }
    const requested = String(destination == null ? '' : destination).trim();
    if (!requested) return { ok: false, requested: null, destination: null, npcId: null, source: null, reason: 'SERVICE_DESTINATION_REQUIRED' };
    const gd = gameDataOf(this.runtime);
    if (gd.maps && Object.prototype.hasOwnProperty.call(gd.maps, requested)) {
      return { ok: true, requested, destination: requested, npcId: null, source: 'MAP_ID' };
    }
    const npcId = serviceNpcId(requested, gd);
    if (!npcId) return { ok: true, requested, destination: requested, npcId: null, source: 'RAW_DESTINATION' };
    const finder = rawFunction(this.root, 'find_npc');
    if (finder) {
      try {
        const found = finder.fn.call(finder.owner, npcId);
        const current = characterOf(this.runtime);
        const location = usableNpcLocation(found, current && current.map);
        if (location) return { ok: true, requested, destination: location, npcId, source: 'FIND_NPC' };
      } catch (_) {}
    }
    // Current Adventure Land accepts NPC ids in smart_move as well. Keeping the
    // canonical NPC id as the fallback is safer than retrying the invalid action
    // alias/item id that led to the live 20.45 stall.
    return { ok: true, requested, destination: npcId, npcId, source: 'NPC_ID_FALLBACK' };
  }

  async namedServiceTravel(destination, tx = null) {
    if (this.serviceTravelBusy) return { ok: false, reason: 'SERVICE_TRAVEL_BUSY' };
    if (!this.merchantActive() || !this.supervisorAllowed() || this.merchantInCombat()) return { ok: false, reason: 'SERVICE_TRAVEL_SAFETY_HOLD' };
    const resolved = this.resolveServiceDestination(destination);
    if (!resolved.ok) {
      const reason = resolved.reason || 'SERVICE_DESTINATION_RESOLUTION_FAILED';
      if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
      this.stats.failedSafe += 1;
      this._event('ALPHA27_SERVICE_TRAVEL_FAILED_SAFE', 'error', reason, { transactionId: tx && tx.id || null, requestedDestination: destination, resolved });
      return { ok: false, reason, resolved };
    }
    const gd = gameDataOf(this.runtime);
    const target = resolved.destination;
    const controlledTarget = target && typeof target === 'object' && target.map && Number.isFinite(Number(target.x)) && Number.isFinite(Number(target.y));
    const controlledMap = typeof target === 'string' && gd.maps && Object.prototype.hasOwnProperty.call(gd.maps, target);
    if ((controlledTarget || controlledMap) && typeof this.runtime.planTravel === 'function' && typeof this.runtime.executeTravelPlan === 'function') {
      const planned = this.runtime.planTravel({ destination: clone(target), metadata: { source: 'ALPHA27_MERCHANT_SERVICE_TRAVEL', transactionId: tx && tx.id || null, requestedDestination: resolved.requested, npcId: resolved.npcId, resolutionSource: resolved.source } });
      if (!planned || planned.accepted !== true || !planned.plan) {
        const reason = planned && planned.reason || 'CONTROLLED_SERVICE_TRAVEL_PLAN_REJECTED';
        if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
        this.stats.failedSafe += 1;
        this._event('ALPHA27_SERVICE_TRAVEL_FAILED_SAFE', 'error', reason, { transactionId: tx && tx.id || null, requestedDestination: resolved.requested, resolvedDestination: clone(target), npcId: resolved.npcId, resolutionSource: resolved.source });
        return { ok: false, reason, resolved };
      }
      this.serviceTravelBusy = true;
      this.stats.namedServiceTravels += 1;
      try {
        const result = await this.runtime.executeTravelPlan(planned.plan.id);
        if (!result || result.completed !== true) {
          const reason = result && result.reason || 'CONTROLLED_SERVICE_TRAVEL_FAILED';
          if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
          this.stats.failedSafe += 1;
          this._event('ALPHA27_SERVICE_TRAVEL_FAILED_SAFE', 'error', reason, { transactionId: tx && tx.id || null, requestedDestination: resolved.requested, resolvedDestination: clone(target), npcId: resolved.npcId, resolutionSource: resolved.source });
          return { ok: false, reason, resolved };
        }
        this._event('ALPHA27_SERVICE_TRAVEL_COMPLETED', 'info', 'SERVICE_DESTINATION_REACHED', { transactionId: tx && tx.id || null, requestedDestination: resolved.requested, resolvedDestination: clone(target), npcId: resolved.npcId, resolutionSource: resolved.source, controlled: true });
        return { ok: true, controlled: true, result: clone(result), resolved };
      } finally { this.serviceTravelBusy = false; }
    }
    const smart = rawFunction(this.root, 'smart_move');
    const stop = rawFunction(this.root, 'stop');
    if (!smart || !stop) return { ok: false, reason: 'SERVICE_TRAVEL_API_UNAVAILABLE', resolved };
    this.serviceTravelBusy = true;
    this.stats.namedServiceTravels += 1;
    try {
      const response = await this._timeout(smart.fn.call(smart.owner, target), 'SERVICE_TRAVEL');
      if (response && response.failed === true) throw response;
      this._event('ALPHA27_SERVICE_TRAVEL_COMPLETED', 'info', 'SERVICE_DESTINATION_REACHED', { transactionId: tx && tx.id || null, requestedDestination: resolved.requested, resolvedDestination: clone(target), npcId: resolved.npcId, resolutionSource: resolved.source, controlled: false });
      return { ok: true, controlled: false, response: clone(response), resolved };
    } catch (error) {
      try { await Promise.resolve(stop.fn.call(stop.owner, 'smart')); } catch (_) {}
      const details = errorDetails(error);
      const reason = details.reason || 'SERVICE_TRAVEL_FAILED';
      if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
      this.stats.failedSafe += 1;
      this._event('ALPHA27_SERVICE_TRAVEL_FAILED_SAFE', 'error', reason, { transactionId: tx && tx.id || null, requestedDestination: resolved.requested, resolvedDestination: clone(target), npcId: resolved.npcId, resolutionSource: resolved.source, error: details });
      return { ok: false, reason, error: details, resolved };
    } finally { this.serviceTravelBusy = false; }
  }

  mutationServiceDestination(tx) {
    const type = String(tx && tx.type || '').toUpperCase();
    if (type === 'UPGRADE' || type === 'COMPOUND') return 'newupgrade';
    return null;
  }

  async ensureMutationService(tx) {
    const destination = this.mutationServiceDestination(tx);
    if (!destination) return { ok: true, skipped: true, destination: null };
    const travelled = await this.namedServiceTravel(destination, tx);
    if (!travelled.ok) return { ...travelled, destination };
    this._event('ALPHA27_MUTATION_SERVICE_REACHED', 'info', `${String(tx.type).toUpperCase()}_SERVICE_REACHED`, {
      transactionId: tx && tx.id || null,
      type: tx && tx.type || null,
      destination,
      resolved: travelled.resolved || null,
      controlled: travelled.controlled === true
    });
    return { ...travelled, destination };
  }

  async ensureScroll(tx, scrollName) {
    let scroll = findItem(this.root, scrollName);
    if (!scroll) {
      const canBuy = rawFunction(this.root, 'can_buy');
      let near = false;
      if (canBuy) { try { near = canBuy.fn.call(canBuy.owner, scrollName) === true; } catch (_) {} }
      if (!near) {
        const travelled = await this.namedServiceTravel(scrollName, tx);
        if (!travelled.ok) return travelled;
        if (canBuy) { try { near = canBuy.fn.call(canBuy.owner, scrollName) === true; } catch (_) { near = false; } }
        if (!near) {
          this.runtime.transactionEngine.markFailedSafe(tx.id, 'SCROLL_VENDOR_NOT_REACHED');
          this.stats.failedSafe += 1;
          return { ok: false, reason: 'SCROLL_VENDOR_NOT_REACHED' };
        }
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
        if (!scroll) return { ok: false, reason: 'SCROLL_NOT_FOUND_AFTER_VERIFIED_PURCHASE' };
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
  }
}

module.exports = { Alpha27AtomicService, serviceNpcId, usableNpcLocation };