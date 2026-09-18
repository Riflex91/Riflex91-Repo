'use strict';

const { ControlledPartyLogistics, Action } = require('./controlled-party-logistics');

const ALPHA20_15_COMBAT_LOGISTICS_MODE = 'alpha20.15-team-combat-logistics-v1';
const LOGISTICS_PATCH = Symbol.for('AIO_V3_ALPHA20_15_LOGISTICS_PATCH');

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function isPotion(name) {
  return /^(?:hpot|mpot)/i.test(String(name || ''));
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function normalizeRanking(selection) {
  if (!selection || !selection.target) return selection;
  const ranking = selection.ranking && typeof selection.ranking === 'object' ? { ...selection.ranking } : {};
  ranking.monster = ranking.monster || selection.target.mtype || null;
  ranking.score = finite(ranking.score, 0);
  ranking.travelSeconds = finite(ranking.travelSeconds, 0);
  ranking.xpPerHour = finite(ranking.xpPerHour, 0);
  ranking.goldPerHour = finite(ranking.goldPerHour, 0);
  ranking.deathsPerHour = finite(ranking.deathsPerHour, 0);
  ranking.confidence = finite(ranking.confidence, 1);
  ranking.source = ranking.source || 'alpha20.15-normalized-team-ranking';
  return { ...selection, ranking };
}

function installFarmerRankingGuard(runtime) {
  const farmer = runtime && runtime.farmer;
  if (!farmer || typeof farmer._selectTarget !== 'function') return false;
  if (farmer.__alpha2015RankingGuardInstalled) return false;
  const baseSelect = farmer._selectTarget.bind(farmer);
  farmer._selectTarget = (context) => normalizeRanking(baseSelect(context));
  farmer.__alpha2015RankingGuardInstalled = true;
  return true;
}

function patchLogisticsPrototype() {
  const proto = ControlledPartyLogistics && ControlledPartyLogistics.prototype;
  if (!proto || proto[LOGISTICS_PATCH]) return false;
  Object.defineProperty(proto, LOGISTICS_PATCH, { value: true, enumerable: false, configurable: false });

  const baseInstall = proto.install;
  const baseExecuteGrant = proto._executeGrant;
  const baseVerifyPendingOutbound = proto._verifyPendingOutbound;
  const baseStatus = proto.status;

  proto.install = function installAlpha2015Logistics() {
    // Alpha20.15 contract: request only when critically low, then refill deeply.
    this.config.merchantReserveSlots = 0;
    this.config.farmerPotionLow = 200;
    this.config.farmerPotionTarget = 5000;
    this.config.maxSupplyBatch = 5000;
    this.config.farmerGoldReserve = 0;
    this.config.maxGoldBatch = Number.MAX_SAFE_INTEGER;
    this.config.maxLootStackTransfer = Math.max(9999, Number(this.config.maxLootStackTransfer) || 0);
    this.__alpha2015BlockedLoot = new Map();
    return baseInstall.apply(this, arguments);
  };

  proto._safeLootDescriptor = function alpha2015LootDescriptor(item) {
    if (!item || !item.name) return { ok: false, reason: 'ITEM_UNKNOWN' };
    const name = String(item.name);
    if (isPotion(name)) return { ok: false, reason: 'HP_MP_POTION_RESERVED' };
    // Adventure Land locked items are not transferable. Never unlock user items
    // automatically merely to satisfy logistics.
    if (item.locked === true) return { ok: false, reason: 'SERVER_LOCKED_NONTRANSFERABLE' };
    const meta = this._metadata ? this._metadata(name) : null;
    if (meta && meta.type === 'elixir') return { ok: false, reason: 'FARMER_ELIXIR_RESERVED' };
    return {
      ok: true,
      name,
      level: Number(item.level || 0),
      quantity: Math.max(1, Math.floor(finite(item.q, 1))),
      metadataType: meta && meta.type || null,
      special: item.special === true
    };
  };

  proto._safeLootCandidate = function alpha2015LootCandidate(snapshot) {
    const inventory = snapshot && snapshot.character && snapshot.character.inventory || [];
    const now = this.now();
    for (const item of inventory) {
      if (!item) continue;
      if (typeof this._lootBlocked === 'function' && this._lootBlocked(item)) continue;
      const safe = this._safeLootDescriptor(item);
      if (!safe.ok) {
        this.stats.protectedLootSkipped += 1;
        continue;
      }
      const signature = `${Number(item.index)}:${safe.name}:${safe.level}`;
      const blockedUntil = this.__alpha2015BlockedLoot && this.__alpha2015BlockedLoot.get(signature) || 0;
      if (blockedUntil > now) continue;
      if (blockedUntil) this.__alpha2015BlockedLoot.delete(signature);
      return {
        ...safe,
        index: item.index,
        signature,
        quantity: Math.min(safe.quantity, this.config.maxLootStackTransfer)
      };
    }
    return null;
  };

  proto._executeGrant = function alpha2015ExecuteGrant(snapshot) {
    const offer = this.pendingOffer;
    const result = baseExecuteGrant.call(this, snapshot);
    if (result && offer && offer.kind === 'item' && this.pendingOutbound) {
      this.pendingOutbound.index = offer.item && offer.item.index;
      this.pendingOutbound.signature = offer.item && offer.item.signature || `${Number(offer.item && offer.item.index)}:${this.pendingOutbound.name}:${this.pendingOutbound.level}`;
    }
    return result;
  };

  proto._verifyPendingOutbound = function alpha2015VerifyOutbound(snapshot) {
    const pending = this.pendingOutbound;
    if (pending && pending.kind === 'item') {
      const now = this.now();
      if (pending.asyncRejected || now - pending.at >= this.config.verifyTimeoutMs) {
        const signature = pending.signature || `${Number(pending.index)}:${pending.name}:${pending.level}`;
        if (this.__alpha2015BlockedLoot) this.__alpha2015BlockedLoot.set(signature, now + 120000);
        if (typeof this._blockRejectedLoot === 'function') {
          this._blockRejectedLoot(
            { index: pending.index, name: pending.name, level: pending.level },
            pending.asyncRejected ? 'OUTBOUND_SEND_REJECTED' : 'OUTBOUND_VERIFY_TIMEOUT',
            120000
          );
        }
      }
    }
    return baseVerifyPendingOutbound.call(this, snapshot);
  };

  // Gold never consumes an inventory slot, therefore Merchant inventory fullness
  // must not reject a gold grant.
  proto._handleGoldOffer = function alpha2015HandleGoldOffer(sender, data) {
    if (!this._isMerchant()) return false;
    this._rememberRendezvous(sender, data);
    const snapshot = this.adapter && this.adapter.snapshot ? this.adapter.snapshot() : null;
    if (!snapshot || !snapshot.character) return true;
    const senderPos = { map: data.map, x: finite(data.x), y: finite(data.y) };
    if (!this._withinTransferRange(snapshot.character, senderPos)) return true;
    const offerId = String(data.offerId || '');
    const requested = Math.max(0, Math.floor(finite(data.amount, 0)));
    if (!offerId || requested <= 0) return true;
    this.stats.goldGrants += 1;
    this._send(sender, Action.GOLD_GRANT, {
      offerId,
      grantId: `gold-${this.now()}-${++this.sequence}`,
      expiresAt: this.now() + this.config.grantTtlMs,
      merchant: snapshot.character.name,
      amount: requested
    });
    return true;
  };

  proto._offerGoldAnytime = function alpha2015OfferGold(snapshot) {
    const now = this.now();
    if (this.pendingOffer || this.pendingGrant || this.pendingOutbound || now < this.backoffUntil || now - this.lastTransferAt < this.config.transferIntervalMs) return false;
    const merchant = this._merchantName();
    const status = this.lastMerchantStatus;
    if (!merchant || !this._merchantStatusFresh()) {
      if (merchant && now - this.lastStatusRequestAt >= this.config.statusIntervalMs) {
        this.lastStatusRequestAt = now;
        this._send(merchant, Action.STATUS_REQUEST, this._farmerPosition(snapshot));
      }
      return false;
    }
    const farmerPos = this._farmerPosition(snapshot);
    const merchantPos = { map: status.map, x: finite(status.x), y: finite(status.y) };
    if (!this._withinTransferRange(farmerPos, merchantPos)) return false;
    const amount = Math.max(0, Math.floor(finite(snapshot.character.gold, 0)));
    if (amount <= 0) return false;
    const offerId = `gold-offer-${now}-${++this.sequence}`;
    this.pendingOffer = { kind: 'gold', offerId, amount, at: now };
    this.stats.goldOffers += 1;
    this._send(merchant, Action.GOLD_OFFER, { offerId, amount, ...farmerPos });
    this.lastDecision = { at: now, action: 'GOLD_OFFER', reason: status.acceptingLoot ? 'MERCHANT_NEARBY' : 'MERCHANT_FULL_BUT_GOLD_HAS_NO_SLOT_COST', amount };
    return true;
  };

  proto._offerInventoryItem = function alpha2015OfferInventoryItem(snapshot) {
    const now = this.now();
    if (this.pendingOffer || this.pendingGrant || this.pendingOutbound || now < this.backoffUntil || now - this.lastTransferAt < this.config.transferIntervalMs) return false;
    const merchant = this._merchantName();
    const status = this.lastMerchantStatus;
    if (!merchant || !this._merchantStatusFresh()) {
      if (merchant && now - this.lastStatusRequestAt >= this.config.statusIntervalMs) {
        this.lastStatusRequestAt = now;
        this._send(merchant, Action.STATUS_REQUEST, this._farmerPosition(snapshot));
      }
      return false;
    }
    if (!status.acceptingLoot) {
      this.lastDecision = { at: now, action: 'HOLD', reason: status.stopReason || 'OKAY_STOP_MERCHANT_INVENTORY_FULL' };
      return false;
    }
    const farmerPos = this._farmerPosition(snapshot);
    const merchantPos = { map: status.map, x: finite(status.x), y: finite(status.y) };
    if (!this._withinTransferRange(farmerPos, merchantPos)) {
      this._send(merchant, Action.RENDEZVOUS, farmerPos);
      return false;
    }
    const item = this._safeLootCandidate(snapshot);
    if (!item) return false;
    const offerId = `loot-offer-${now}-${++this.sequence}`;
    this.pendingOffer = { kind: 'item', offerId, item: { ...item }, at: now };
    this.stats.lootOffers += 1;
    this._send(merchant, Action.LOOT_OFFER, {
      offerId,
      quantity: item.quantity,
      item: {
        name: item.name,
        level: item.level,
        q: item.quantity,
        locked: false,
        special: item.special === true,
        index: item.index,
        signature: item.signature
      },
      ...farmerPos
    });
    return true;
  };

  proto._farmerTick = function alpha2015FarmerTick(snapshot) {
    this._prune();
    this._verifyPendingOutbound(snapshot);
    if (typeof this._maybeUseElixir === 'function') this._maybeUseElixir(snapshot);
    this._requestSupply(snapshot);

    // Existing grants must complete even if the combat state changed after the
    // offer. Gold grants are always permitted; item grants were only created
    // from a safe outbound state.
    if (this.pendingGrant && this.pendingOffer && snapshot && snapshot.character && snapshot.character.rip !== true) {
      // A grant was already scoped to the trusted Merchant and the exact item
      // identity is revalidated by _executeGrant. Combat state must not let the
      // short-lived grant expire before send_item executes.
      this._executeGrant(snapshot);
    }
    if (this.pendingOffer || this.pendingGrant || this.pendingOutbound) return this.lastDecision;

    // Gold has no slot cost and may be sent whenever Merchant is nearby.
    if (this._offerGoldAnytime(snapshot)) return this.lastDecision;

    // send_item is independent from the combat target/action loop. Keep draining
    // transferable loot while farming; the grant/identity checks still serialize
    // one outbound mutation at a time.
    if (snapshot && snapshot.character && snapshot.character.rip !== true) this._offerInventoryItem(snapshot);
    return this.lastDecision;
  };

  proto.status = function alpha2015LogisticsStatus() {
    const base = baseStatus.call(this);
    return {
      ...base,
      mode: 'bounded-owned-party-logistics-v2',
      authority: {
        ...(base.authority || {}),
        farmerLootPolicy: 'all-transferable-inventory-except-hp-mp-potions',
        farmerGoldTransfer: 'all-gold-when-nearby-even-if-merchant-inventory-full',
        merchantStopsItemsOnlyWhenInventoryFull: true,
        lockedItemsRemainLocal: true
      },
      alpha20_15: {
        potionRequestBelow: this.config.farmerPotionLow,
        potionTarget: this.config.farmerPotionTarget,
        merchantReserveSlots: this.config.merchantReserveSlots,
        farmerGoldReserve: this.config.farmerGoldReserve,
        maxGoldBatch: this.config.maxGoldBatch,
        blockedNonTransferableItems: this.__alpha2015BlockedLoot ? this.__alpha2015BlockedLoot.size : 0
      }
    };
  };

  return true;
}

class Alpha2015CombatLogisticsHotfix {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.rankingGuardInstalled = installFarmerRankingGuard(runtime);
    this.logisticsPrototypePatched = patchLogisticsPrototype();
    this.installedAt = this.now();
    this._event('ALPHA20_15_COMBAT_LOGISTICS_INSTALLED', 'warn', 'TEAM_RANKING_CRASH_AND_LOGISTICS_POLICY_FIXED', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha20-15-combat-logistics', event, severity, reason, data }); } catch (_) {}
  }

  status() {
    const logistics = this.runtime.controlledPartyLogistics;
    return {
      schemaVersion: 1,
      mode: ALPHA20_15_COMBAT_LOGISTICS_MODE,
      installedAt: this.installedAt || null,
      rankingGuardInstalled: !!(this.runtime.farmer && this.runtime.farmer.__alpha2015RankingGuardInstalled),
      logisticsPrototypePatched: !!(ControlledPartyLogistics.prototype && ControlledPartyLogistics.prototype[LOGISTICS_PATCH]),
      liveLogistics: logistics && typeof logistics.status === 'function' ? logistics.status().alpha20_15 || null : null,
      policies: {
        syntheticTeamRankingsAlwaysHaveTravelSeconds: true,
        potionRequestBelow: 200,
        potionTarget: 5000,
        farmerGoldReserve: 0,
        allTransferableInventoryExceptHpMpPotions: true,
        farmerElixirsRemainLocalUntilConsumed: true,
        merchantFullDoesNotBlockGold: true
      }
    };
  }
}

function installAlpha2015CombatLogisticsHotfix(runtime) {
  return new Alpha2015CombatLogisticsHotfix(runtime);
}

module.exports = {
  Alpha2015CombatLogisticsHotfix,
  installAlpha2015CombatLogisticsHotfix,
  installFarmerRankingGuard,
  patchLogisticsPrototype,
  normalizeRanking,
  isPotion,
  ALPHA20_15_COMBAT_LOGISTICS_MODE
};
