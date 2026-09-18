'use strict';

const { ControlledPartyLogistics, Action } = require('./controlled-party-logistics');

const PATCH = Symbol.for('AIO_V3_ALPHA20_19_LOGISTICS_STABILIZATION');
const OFFER_TTL_MS = 15000;
const MERCHANT_POTION_RESERVE = 300;

function ensureStats(instance) {
  for (const key of ['offerTransportFailures', 'staleOffersCleared', 'falseDeliveryResults']) {
    if (!Number.isFinite(Number(instance.stats[key]))) instance.stats[key] = 0;
  }
}

function offerMatches(instance, data) {
  return !!(instance.pendingOffer && data && String(instance.pendingOffer.offerId || '') === String(data.offerId || ''));
}

function clearFailedOffer(instance, data, reason) {
  if (!offerMatches(instance, data)) return false;
  instance.pendingOffer = null;
  instance.pendingGrant = null;
  instance.backoffUntil = Math.max(Number(instance.backoffUntil) || 0, instance.now() + Math.min(5000, Number(instance.config.failureBackoffMs) || 3000));
  ensureStats(instance);
  instance.stats.offerTransportFailures += 1;
  instance.lastDecision = { at: instance.now(), action: 'HOLD', reason, offerId: data.offerId };
  if (typeof instance._event === 'function') instance._event('PARTY_LOGISTICS_OFFER_RELEASED', 'warn', reason, { offerId: data.offerId });
  return true;
}

function patchAlpha2019LogisticsStabilization() {
  const proto = ControlledPartyLogistics && ControlledPartyLogistics.prototype;
  if (!proto || proto[PATCH]) return false;
  Object.defineProperty(proto, PATCH, { value: true, enumerable: false });

  const baseInstall = proto.install;
  const baseSend = proto._send;
  const basePrune = proto._prune;
  const baseStatusPayload = proto._statusPayload;
  const baseStatus = proto.status;

  proto.install = function alpha2019Install() {
    const result = baseInstall.apply(this, arguments);
    this.config.farmerPotionLow = 200;
    this.config.farmerPotionTarget = 5000;
    this.config.maxSupplyBatch = 5000;
    this.config.merchantPotionReserve = MERCHANT_POTION_RESERVE;
    this.config.farmerGoldReserve = 0;
    this.config.maxGoldBatch = Number.MAX_SAFE_INTEGER;
    this.__alpha2019OfferTtlMs = OFFER_TTL_MS;
    ensureStats(this);
    return result;
  };

  proto._send = function alpha2019Send(target, action, data = {}) {
    const promise = baseSend.call(this, target, action, data);
    return Promise.resolve(promise).then((result) => {
      ensureStats(this);
      const nestedFalse = !!(result && result.result && result.result.delivered === false);
      const failed = !result || result.delivered === false || nestedFalse;
      if (!failed) return result;
      if (nestedFalse) this.stats.falseDeliveryResults += 1;
      if (action === Action.LOOT_OFFER || action === Action.GOLD_OFFER) {
        clearFailedOffer(this, data, 'OFFER_TRANSPORT_FAILED');
      }
      return { ...(result || {}), delivered: false, reason: result && result.reason || (nestedFalse ? 'TRANSPORT_REPORTED_NOT_DELIVERED' : 'TRANSPORT_FAILED') };
    }).catch((error) => {
      if (action === Action.LOOT_OFFER || action === Action.GOLD_OFFER) clearFailedOffer(this, data, 'OFFER_TRANSPORT_REJECTED');
      return { delivered: false, reason: 'TRANSPORT_REJECTED', error };
    });
  };

  proto._prune = function alpha2019Prune() {
    const result = basePrune.apply(this, arguments);
    const now = this.now();
    const offer = this.pendingOffer;
    if (offer && !this.pendingGrant && now - Number(offer.at || 0) >= (this.__alpha2019OfferTtlMs || OFFER_TTL_MS)) {
      ensureStats(this);
      const stale = { kind: offer.kind || null, offerId: offer.offerId || null, ageMs: now - Number(offer.at || 0) };
      if (offer.kind === 'item' && offer.item && typeof this._blockRejectedLoot === 'function') {
        this._blockRejectedLoot(offer.item, 'OFFER_GRANT_TIMEOUT', this.config.rejectedLootBackoffMs);
      }
      this.pendingOffer = null;
      this.stats.staleOffersCleared += 1;
      this.backoffUntil = Math.max(Number(this.backoffUntil) || 0, now + Math.min(3000, Number(this.config.failureBackoffMs) || 3000));
      this.lastDecision = { at: now, action: 'HOLD', reason: 'STALE_OFFER_RELEASED', ...stale };
      if (typeof this._event === 'function') this._event('PARTY_LOGISTICS_STALE_OFFER_RELEASED', 'warn', 'OFFER_GRANT_TIMEOUT', stale);
    }
    return result;
  };

  proto._statusPayload = function alpha2019StatusPayload(snapshot) {
    const payload = baseStatusPayload.call(this, snapshot);
    return {
      ...payload,
      lootSignal: payload.acceptingLoot ? 'ACCEPTING_LOOT' : 'OKAY_STOP_MERCHANT_INVENTORY_FULL',
      merchantPotionReservePerType: MERCHANT_POTION_RESERVE
    };
  };

  proto.status = function alpha2019Status() {
    ensureStats(this);
    const base = baseStatus.call(this);
    const merchantCapacity = this._isMerchant() && this.adapter && this.adapter.snapshot ? this._merchantCapacity(this.adapter.snapshot()) : null;
    return {
      ...base,
      mode: 'bounded-owned-party-logistics-v3',
      alpha20_19: {
        offerTtlMs: this.__alpha2019OfferTtlMs || OFFER_TTL_MS,
        staleOfferProtection: true,
        staleRejectedItemTemporarilyExcluded: true,
        failedOfferReleasesChannel: true,
        transportFalseIsFailure: true,
        merchantPotionReservePerType: this.config.merchantPotionReserve,
        potionRequestBelow: this.config.farmerPotionLow,
        potionTargetPerType: this.config.farmerPotionTarget,
        maxSupplyBatch: this.config.maxSupplyBatch,
        farmerGoldReserve: this.config.farmerGoldReserve,
        lootSignal: merchantCapacity ? (merchantCapacity.acceptingLoot ? 'ACCEPTING_LOOT' : 'OKAY_STOP_MERCHANT_INVENTORY_FULL') : (this.lastMerchantStatus && this.lastMerchantStatus.lootSignal || null),
        stats: {
          offerTransportFailures: this.stats.offerTransportFailures,
          staleOffersCleared: this.stats.staleOffersCleared,
          falseDeliveryResults: this.stats.falseDeliveryResults
        }
      }
    };
  };

  return true;
}

module.exports = {
  OFFER_TTL_MS,
  MERCHANT_POTION_RESERVE,
  clearFailedOffer,
  patchAlpha2019LogisticsStabilization
};
