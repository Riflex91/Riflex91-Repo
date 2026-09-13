'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicTransactions } = require('./alpha27-atomic-transactions');

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

  async namedServiceTravel(destination, tx = null) {
    if (this.serviceTravelBusy) return { ok: false, reason: 'SERVICE_TRAVEL_BUSY' };
    if (!this.merchantActive() || !this.supervisorAllowed() || this.merchantInCombat()) return { ok: false, reason: 'SERVICE_TRAVEL_SAFETY_HOLD' };
    const gd = gameDataOf(this.runtime);
    if (gd.maps && Object.prototype.hasOwnProperty.call(gd.maps, String(destination)) && typeof this.runtime.planTravel === 'function' && typeof this.runtime.executeTravelPlan === 'function') {
      const planned = this.runtime.planTravel({ destination: String(destination), metadata: { source: 'ALPHA27_MERCHANT_SERVICE_TRAVEL', transactionId: tx && tx.id || null } });
      if (!planned || planned.accepted !== true || !planned.plan) {
        const reason = planned && planned.reason || 'CONTROLLED_SERVICE_TRAVEL_PLAN_REJECTED';
        if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
        return { ok: false, reason };
      }
      this.serviceTravelBusy = true;
      try {
        const result = await this.runtime.executeTravelPlan(planned.plan.id);
        if (!result || result.completed !== true) {
          const reason = result && result.reason || 'CONTROLLED_SERVICE_TRAVEL_FAILED';
          if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
          return { ok: false, reason };
        }
        return { ok: true, controlled: true, result: clone(result) };
      } finally { this.serviceTravelBusy = false; }
    }
    const smart = rawFunction(this.root, 'smart_move');
    const stop = rawFunction(this.root, 'stop');
    if (!smart || !stop) return { ok: false, reason: 'SERVICE_TRAVEL_API_UNAVAILABLE' };
    this.serviceTravelBusy = true;
    this.stats.namedServiceTravels += 1;
    try {
      const response = await this._timeout(smart.fn.call(smart.owner, destination), 'SERVICE_TRAVEL');
      if (response && response.failed === true) throw new Error(String(response.reason || 'SERVICE_TRAVEL_FAILED'));
      return { ok: true, controlled: false, response: clone(response) };
    } catch (error) {
      try { await Promise.resolve(stop.fn.call(stop.owner, 'smart')); } catch (_) {}
      const reason = String(error && error.message || error || 'SERVICE_TRAVEL_FAILED');
      if (tx) this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
      this.stats.failedSafe += 1;
      return { ok: false, reason };
    } finally { this.serviceTravelBusy = false; }
  }

  async ensureScroll(tx, scrollName) {
    let scroll = findItem(this.root, scrollName);
    if (scroll) return { ok: true, scroll };
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
      if (response && response.failed === true) throw new Error(String(response.reason || 'BUY_SCROLL_FAILED'));
      const verified = await this.verifyEventually(() => identityQuantity(inventoryOf(this.root), scrollName, 0) > before);
      if (!verified) throw new Error('SCROLL_PURCHASE_DELTA_NOT_OBSERVED');
      this.stats.scrollPurchases += 1;
      scroll = findItem(this.root, scrollName);
      return scroll ? { ok: true, scroll } : { ok: false, reason: 'SCROLL_NOT_FOUND_AFTER_VERIFIED_PURCHASE' };
    } catch (error) {
      const reason = String(error && error.message || error || 'BUY_SCROLL_FAILED');
      this.runtime.transactionEngine.markFailedSafe(tx.id, reason);
      this.stats.failedSafe += 1;
      return { ok: false, reason };
    }
  }
}

module.exports = { Alpha27AtomicService };
