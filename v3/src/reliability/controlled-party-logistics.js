'use strict';

const { sellProtectionReasons } = require('../economy/sell-safety');

const PARTY_LOGISTICS_TYPE = 'aio-v3-party-logistics';
const PARTY_LOGISTICS_PROTOCOL = 1;
const PARTY_LOGISTICS_RECEIVER = '__AIO_V3_PARTY_LOGISTICS_RECEIVE';
const PARTY_LOGISTICS_MODE = 'bounded-owned-party-logistics-v1';

const Action = Object.freeze({
  STATUS: 'STATUS',
  STATUS_REQUEST: 'STATUS_REQUEST',
  SUPPLY_REQUEST: 'SUPPLY_REQUEST',
  SUPPLY_RESULT: 'SUPPLY_RESULT',
  LOOT_OFFER: 'LOOT_OFFER',
  LOOT_GRANT: 'LOOT_GRANT',
  GOLD_OFFER: 'GOLD_OFFER',
  GOLD_GRANT: 'GOLD_GRANT',
  TRANSFER_COMMIT: 'TRANSFER_COMMIT',
  STOP_FULL: 'STOP_FULL',
  RENDEZVOUS: 'RENDEZVOUS'
});

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function countItem(snapshot, name, level = null) {
  const rows = snapshot && snapshot.character && snapshot.character.inventory || [];
  return rows.reduce((sum, item) => {
    if (!item || item.name !== name) return sum;
    if (level != null && Number(item.level || 0) !== Number(level || 0)) return sum;
    return sum + Math.max(1, finite(item.q, 1));
  }, 0);
}

function inventoryMetrics(snapshot) {
  const c = snapshot && snapshot.character || {};
  const inventory = Array.isArray(c.inventory) ? c.inventory : [];
  const capacity = Math.max(0, Math.floor(finite(c.isize, inventory.length) || 0));
  const occupied = inventory.slice(0, capacity).filter(Boolean).length;
  return {
    capacity,
    occupied,
    freeSlots: Math.max(0, capacity - occupied),
    hpPotions: countItem(snapshot, 'hpot0'),
    mpPotions: countItem(snapshot, 'mpot0'),
    gold: Math.max(0, finite(c.gold, 0))
  };
}

class ControlledPartyLogistics {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.partyAccountCommunication || !runtime.partyAccountCommunication.transport) {
      throw new Error('party account communication transport required');
    }
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.transport = runtime.partyAccountCommunication.transport;
    this.adapter = runtime.adapter;

    this.config = {
      statusIntervalMs: Math.max(1000, finite(options.statusIntervalMs, 2000)),
      statusFreshMs: Math.max(3000, finite(options.statusFreshMs, 7000)),
      messageTtlMs: Math.max(3000, finite(options.messageTtlMs, 10000)),
      merchantReserveSlots: Math.max(2, Math.min(10, Math.floor(finite(options.merchantReserveSlots, 4)))),
      farmerPotionLow: Math.max(20, Math.min(1000, Math.floor(finite(options.farmerPotionLow, 120)))),
      farmerPotionTarget: Math.max(100, Math.min(2000, Math.floor(finite(options.farmerPotionTarget, 500)))),
      merchantPotionReserve: Math.max(100, Math.min(2000, Math.floor(finite(options.merchantPotionReserve, 300)))),
      maxSupplyBatch: Math.max(50, Math.min(1000, Math.floor(finite(options.maxSupplyBatch, 500)))),
      supplyRequestIntervalMs: Math.max(3000, finite(options.supplyRequestIntervalMs, 6000)),
      transferIntervalMs: Math.max(700, finite(options.transferIntervalMs, 1400)),
      verifyDelayMs: Math.max(250, finite(options.verifyDelayMs, 700)),
      verifyTimeoutMs: Math.max(1500, finite(options.verifyTimeoutMs, 3500)),
      failureBackoffMs: Math.max(3000, finite(options.failureBackoffMs, 7000)),
      grantTtlMs: Math.max(2000, finite(options.grantTtlMs, 4500)),
      maxTransferDistance: Math.max(150, Math.min(600, finite(options.maxTransferDistance, 380))),
      rendezvousDistance: Math.max(80, Math.min(400, finite(options.rendezvousDistance, 260))),
      rendezvousStep: Math.max(40, Math.min(140, finite(options.rendezvousStep, 100))),
      rendezvousCooldownMs: Math.max(700, finite(options.rendezvousCooldownMs, 1300)),
      rendezvousRequestTtlMs: Math.max(5000, finite(options.rendezvousRequestTtlMs, 15000)),
      farmerGoldReserve: Math.max(0, Math.floor(finite(options.farmerGoldReserve, 250000))),
      maxGoldBatch: Math.max(10000, Math.floor(finite(options.maxGoldBatch, 1000000))),
      maxLootStackTransfer: Math.max(1, Math.floor(finite(options.maxLootStackTransfer, 9999)))
    };

    this.sequence = 0;
    this.capacitySequence = 0;
    this.lastStatusBroadcastAt = -Infinity;
    this.lastSupplyRequestAt = -Infinity;
    this.lastStatusRequestAt = -Infinity;
    this.lastTransferAt = -Infinity;
    this.lastRendezvousMoveAt = -Infinity;
    this.backoffUntil = 0;
    this.lastMerchantStatus = null;
    this.lastSupplyResult = null;
    this.lastDecision = null;
    this.pendingSupply = null;
    this.supplyRequests = new Map();
    this.rendezvousRequests = new Map();
    this.activeLootGrants = new Map();
    this.pendingOffer = null;
    this.pendingGrant = null;
    this.pendingOutbound = null;
    this.previousOnCm = null;
    this.installed = false;
    this.stats = {
      messagesReceived: 0,
      messagesRejected: 0,
      messagesSent: 0,
      messageFailures: 0,
      statusBroadcasts: 0,
      supplyRequests: 0,
      supplyTransfers: 0,
      supplyVerified: 0,
      supplyFailed: 0,
      lootOffers: 0,
      lootGrants: 0,
      lootTransfers: 0,
      lootVerified: 0,
      goldOffers: 0,
      goldGrants: 0,
      goldTransfers: 0,
      goldVerified: 0,
      protectedLootSkipped: 0,
      merchantFullStops: 0,
      rendezvousMoves: 0,
      rendezvousCrossMap: 0,
      verificationFailures: 0
    };
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'controlled-party-logistics', event, severity, reason, data }); } catch (_) {}
  }

  _binding(name) {
    if (this.root && typeof this.root[name] === 'function') return { fn: this.root[name], owner: this.root };
    if (this.parent && typeof this.parent[name] === 'function') return { fn: this.parent[name], owner: this.parent };
    return null;
  }

  _character() {
    return this.root && (this.root.character || (this.parent && this.parent.character)) || null;
  }

  _localName() {
    const c = this._character();
    return cleanName(c && c.name);
  }

  _isMerchant(snapshot = null) {
    const c = snapshot && snapshot.character || this._character() || {};
    return String(c.ctype || '').toLowerCase() === 'merchant';
  }

  _merchantName() {
    const lease = this.runtime.partyControlLease;
    const leaseMerchant = cleanName(lease && lease.merchantName);
    if (leaseMerchant) return leaseMerchant;
    const bootstrap = this.runtime.partyBootstrap;
    const status = bootstrap && typeof bootstrap.status === 'function' ? bootstrap.status() : null;
    const discovered = cleanName(status && status.merchantName);
    if (discovered) return discovered;
    return this._isMerchant() ? this._localName() : null;
  }

  _trustedNames() {
    const bootstrap = this.runtime.partyBootstrap;
    if (bootstrap && typeof bootstrap.trustedRosterNames === 'function') {
      try {
        const rows = bootstrap.trustedRosterNames();
        if (Array.isArray(rows) && rows.length) return [...new Set(rows.map(cleanName).filter(Boolean))];
      } catch (_) {}
    }
    const rows = this.transport.trustedRosterNames && this.transport.trustedRosterNames();
    return Array.isArray(rows) ? rows.map(cleanName).filter(Boolean) : [];
  }

  _isTrustedActive(name) {
    const target = cleanName(name);
    if (!target) return false;
    const trusted = this._trustedNames();
    if (trusted.length && !trusted.includes(target)) return false;
    const active = this.transport.activeNames && this.transport.activeNames({ runningOnly: true });
    if (Array.isArray(active) && active.length > 1 && !active.includes(target)) return false;
    return target === this._localName() || !trusted.length || trusted.includes(target);
  }

  _envelope(action, data = {}) {
    return {
      type: PARTY_LOGISTICS_TYPE,
      protocol: PARTY_LOGISTICS_PROTOCOL,
      action,
      id: `log-${this.now()}-${++this.sequence}`,
      sender: this._localName(),
      at: this.now(),
      ...data
    };
  }

  _validEnvelope(sender, data) {
    if (!data || data.type !== PARTY_LOGISTICS_TYPE || Number(data.protocol) !== PARTY_LOGISTICS_PROTOCOL) return false;
    const from = cleanName(sender || data.sender);
    if (!from || from !== cleanName(data.sender || from)) return false;
    const at = finite(data.at);
    if (at == null || Math.abs(this.now() - at) > this.config.messageTtlMs) return false;
    return this._isTrustedActive(from);
  }

  _send(target, action, data = {}) {
    const name = cleanName(target);
    if (!name || !this._isTrustedActive(name)) {
      this.stats.messageFailures += 1;
      return Promise.resolve({ delivered: false, reason: 'UNTRUSTED_OR_INACTIVE_TARGET' });
    }
    const payload = this._envelope(action, data);
    return Promise.resolve(this.transport.send(name, payload, {
      receiver: PARTY_LOGISTICS_RECEIVER,
      sender: this._localName()
    })).then((result) => {
      this.stats.messagesSent += 1;
      return { delivered: true, result, payload };
    }).catch((error) => {
      this.stats.messageFailures += 1;
      this._event('PARTY_LOGISTICS_SEND_FAILED', 'warn', 'TRANSPORT_FAILED', {
        target: name,
        action,
        message: String(error && error.message || error).slice(0, 180)
      });
      return { delivered: false, reason: 'TRANSPORT_FAILED', error };
    });
  }

  _livePosition() {
    const c = this._character() || {};
    return { map: c.map || null, x: finite(c.real_x != null ? c.real_x : c.x), y: finite(c.real_y != null ? c.real_y : c.y) };
  }

  _rememberRendezvous(sender, data) {
    const map = data && data.map || null;
    const x = finite(data && data.x);
    const y = finite(data && data.y);
    if (!sender || !map || x == null || y == null) return;
    this.rendezvousRequests.set(sender, { name: sender, map, x, y, at: this.now() });
  }

  _prune() {
    const now = this.now();
    for (const [name, row] of this.rendezvousRequests) if (now - row.at > this.config.rendezvousRequestTtlMs) this.rendezvousRequests.delete(name);
    for (const [id, grant] of this.activeLootGrants) if (grant.expiresAt <= now) this.activeLootGrants.delete(id);
    if (this.pendingGrant && this.pendingGrant.expiresAt <= now) this.pendingGrant = null;
    if (this.lastMerchantStatus && now - this.lastMerchantStatus.receivedAt > this.config.statusFreshMs * 2) this.lastMerchantStatus = null;
  }

  _merchantCapacity(snapshot) {
    const metrics = inventoryMetrics(snapshot);
    const reservedIncomingSlots = [...this.activeLootGrants.values()].filter((grant) => grant.expiresAt > this.now()).length;
    const effectiveFreeSlots = Math.max(0, metrics.freeSlots - reservedIncomingSlots);
    const acceptingLoot = effectiveFreeSlots > this.config.merchantReserveSlots;
    return {
      ...metrics,
      reservedIncomingSlots,
      effectiveFreeSlots,
      reserveSlots: this.config.merchantReserveSlots,
      acceptingLoot,
      stopReason: acceptingLoot ? null : 'OKAY_STOP_MERCHANT_INVENTORY_FULL'
    };
  }

  _statusPayload(snapshot) {
    const capacity = this._merchantCapacity(snapshot);
    const c = snapshot.character;
    return {
      merchant: c.name,
      capacitySequence: ++this.capacitySequence,
      map: c.map || null,
      x: finite(c.x),
      y: finite(c.y),
      ...capacity
    };
  }

  _broadcastStatus(snapshot, force = false) {
    if (!this._isMerchant(snapshot)) return false;
    const now = this.now();
    if (!force && now - this.lastStatusBroadcastAt < this.config.statusIntervalMs) return false;
    const payload = this._statusPayload(snapshot);
    const merchant = snapshot.character.name;
    const targets = this._trustedNames().filter((name) => name !== merchant);
    for (const target of targets) this._send(target, payload.acceptingLoot ? Action.STATUS : Action.STOP_FULL, payload);
    this.lastStatusBroadcastAt = now;
    this.stats.statusBroadcasts += 1;
    if (!payload.acceptingLoot) this.stats.merchantFullStops += 1;
    this.lastDecision = { at: now, action: 'MERCHANT_STATUS', reason: payload.stopReason || 'MERCHANT_ACCEPTING_LOGISTICS', capacity: payload };
    return true;
  }

  _metadata(name) {
    const gameData = this.root && this.root.G || this.parent && this.parent.G || {};
    return gameData.items && gameData.items[name] || null;
  }

  _safeLootDescriptor(item) {
    if (!item || !item.name) return { ok: false, reason: 'ITEM_UNKNOWN' };
    const name = String(item.name);
    if (/^hpot/i.test(name) || /^mpot/i.test(name)) return { ok: false, reason: 'GROUP_POTION_RESERVED' };
    if (item.locked === true || item.special === true) return { ok: false, reason: 'LOCKED_OR_SPECIAL' };
    if (Number(item.level || 0) !== 0) return { ok: false, reason: 'LEVELLED_ITEM_PROTECTED' };
    const meta = this._metadata(name);
    const blockers = sellProtectionReasons(meta);
    if (blockers.length) return { ok: false, reason: blockers[0], blockers };
    return { ok: true, name, level: 0, quantity: Math.max(1, Math.floor(finite(item.q, 1))), metadataType: meta && meta.type || null };
  }

  _safeLootCandidate(snapshot) {
    const inventory = snapshot && snapshot.character && snapshot.character.inventory || [];
    for (const item of inventory) {
      if (!item) continue;
      const safe = this._safeLootDescriptor(item);
      if (!safe.ok) { this.stats.protectedLootSkipped += 1; continue; }
      return { ...safe, index: item.index, quantity: Math.min(safe.quantity, this.config.maxLootStackTransfer) };
    }
    return null;
  }

  _withinTransferRange(a, b) {
    return !!a && !!b && (!a.map || !b.map || a.map === b.map) && distance(a, b) <= this.config.maxTransferDistance;
  }

  _handleLootOffer(sender, data) {
    if (!this._isMerchant()) return false;
    this._rememberRendezvous(sender, data);
    const offered = data && data.item || null;
    const safe = this._safeLootDescriptor(offered);
    if (!safe.ok) {
      this.stats.messagesRejected += 1;
      return true;
    }
    const snapshot = this.adapter && this.adapter.snapshot ? this.adapter.snapshot() : null;
    if (!snapshot || !snapshot.character) return true;
    const capacity = this._merchantCapacity(snapshot);
    const merchantPos = snapshot.character;
    const senderPos = { map: data.map, x: finite(data.x), y: finite(data.y) };
    if (!capacity.acceptingLoot) {
      this._send(sender, Action.STOP_FULL, { merchant: snapshot.character.name, capacitySequence: ++this.capacitySequence, ...capacity, ...this._livePosition() });
      return true;
    }
    if (!this._withinTransferRange(merchantPos, senderPos)) {
      this._send(sender, Action.STATUS, { merchant: snapshot.character.name, capacitySequence: ++this.capacitySequence, ...capacity, ...this._livePosition(), reason: 'RENDEZVOUS_REQUIRED' });
      return true;
    }
    const offerId = String(data.offerId || '');
    if (!offerId || offerId.length > 160) return true;
    const grantId = `grant-${this.now()}-${++this.sequence}`;
    const expiresAt = this.now() + this.config.grantTtlMs;
    this.activeLootGrants.set(grantId, { grantId, offerId, sender, item: { name: safe.name, level: safe.level }, expiresAt });
    this.stats.lootGrants += 1;
    this._send(sender, Action.LOOT_GRANT, {
      offerId,
      grantId,
      expiresAt,
      merchant: snapshot.character.name,
      item: { name: safe.name, level: safe.level },
      maxQuantity: Math.min(Math.max(1, Math.floor(finite(data.quantity, safe.quantity))), this.config.maxLootStackTransfer),
      capacitySequence: this.capacitySequence
    });
    return true;
  }

  _handleGoldOffer(sender, data) {
    if (!this._isMerchant()) return false;
    this._rememberRendezvous(sender, data);
    const snapshot = this.adapter && this.adapter.snapshot ? this.adapter.snapshot() : null;
    if (!snapshot || !snapshot.character) return true;
    const capacity = this._merchantCapacity(snapshot);
    const senderPos = { map: data.map, x: finite(data.x), y: finite(data.y) };
    if (!capacity.acceptingLoot) {
      this._send(sender, Action.STOP_FULL, { merchant: snapshot.character.name, capacitySequence: ++this.capacitySequence, ...capacity, ...this._livePosition() });
      return true;
    }
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
      amount: Math.min(requested, this.config.maxGoldBatch)
    });
    return true;
  }

  receive(sender, data) {
    const from = cleanName(sender || data && data.sender);
    if (!this._validEnvelope(from, data)) {
      if (data && data.type === PARTY_LOGISTICS_TYPE) this.stats.messagesRejected += 1;
      return false;
    }
    this.stats.messagesReceived += 1;
    const action = String(data.action || '');
    const merchant = this._merchantName();

    if (action === Action.STATUS || action === Action.STOP_FULL) {
      if (!merchant || from !== merchant || this._isMerchant()) return false;
      this.lastMerchantStatus = { ...clone(data), receivedAt: this.now(), acceptingLoot: action === Action.STOP_FULL ? false : data.acceptingLoot === true };
      if (action === Action.STOP_FULL) this.stats.merchantFullStops += 1;
      return true;
    }

    if (action === Action.SUPPLY_RESULT) {
      if (!merchant || from !== merchant || this._isMerchant()) return false;
      this.lastSupplyResult = { ...clone(data), receivedAt: this.now() };
      return true;
    }

    if (action === Action.LOOT_GRANT || action === Action.GOLD_GRANT) {
      if (!merchant || from !== merchant || this._isMerchant()) return false;
      if (!this.pendingOffer || String(data.offerId || '') !== String(this.pendingOffer.offerId)) return false;
      const expiresAt = finite(data.expiresAt);
      if (expiresAt == null || expiresAt <= this.now() || expiresAt - this.now() > this.config.grantTtlMs + 1000) return false;
      this.pendingGrant = { ...clone(data), receivedAt: this.now() };
      return true;
    }

    if (!this._isMerchant()) return false;
    this._rememberRendezvous(from, data);

    if (action === Action.STATUS_REQUEST || action === Action.RENDEZVOUS) {
      const snapshot = this.adapter && this.adapter.snapshot ? this.adapter.snapshot() : null;
      if (snapshot) this._send(from, this._merchantCapacity(snapshot).acceptingLoot ? Action.STATUS : Action.STOP_FULL, this._statusPayload(snapshot));
      return true;
    }
    if (action === Action.SUPPLY_REQUEST) {
      this.supplyRequests.set(from, { ...clone(data), sender: from, receivedAt: this.now() });
      return true;
    }
    if (action === Action.LOOT_OFFER) return this._handleLootOffer(from, data);
    if (action === Action.GOLD_OFFER) return this._handleGoldOffer(from, data);
    if (action === Action.TRANSFER_COMMIT) {
      const grantId = String(data.grantId || '');
      if (grantId) this.activeLootGrants.delete(grantId);
      this._broadcastStatus(this.adapter && this.adapter.snapshot ? this.adapter.snapshot() : null, true);
      return true;
    }
    return false;
  }

  install() {
    if (this.installed) return false;
    this.transport.installDirectReceiver(PARTY_LOGISTICS_RECEIVER, (sender, payload) => this.receive(sender, payload));
    if (this.root) {
      const self = this;
      this.previousOnCm = typeof this.root.on_cm === 'function' ? this.root.on_cm : null;
      this.root.on_cm = function onPartyLogisticsMessage(name, data) {
        if (data && data.type === PARTY_LOGISTICS_TYPE && Number(data.protocol) === PARTY_LOGISTICS_PROTOCOL) {
          self.receive(name, data);
          return undefined;
        }
        if (self.previousOnCm) return self.previousOnCm.apply(this, arguments);
        return undefined;
      };
    }
    this.installed = true;
    this._event('PARTY_LOGISTICS_INSTALLED', 'info', null, {
      genericSendItemAuthorityOpened: false,
      allowedMerchantSupplyItems: ['hpot0', 'mpot0'],
      incomingLootPolicy: 'plain-stackable-material-only'
    });
    return true;
  }

  _supplyDeficit(request, itemName) {
    const reported = Math.max(0, Math.floor(finite(request && request[itemName === 'mpot0' ? 'mpPotions' : 'hpPotions'], 0)));
    return Math.max(0, this.config.farmerPotionTarget - reported);
  }

  _verifyPendingSupply(snapshot) {
    const pending = this.pendingSupply;
    if (!pending) return false;
    const now = this.now();
    if (now - pending.at < this.config.verifyDelayMs) return true;
    const after = countItem(snapshot, pending.itemName);
    const consumed = pending.beforeCount - after;
    if (consumed >= pending.quantity) {
      this.stats.supplyVerified += 1;
      this._send(pending.target, Action.SUPPLY_RESULT, {
        transactionId: pending.transactionId,
        itemName: pending.itemName,
        quantity: pending.quantity,
        committed: true
      });
      this.supplyRequests.delete(pending.target);
      this.pendingSupply = null;
      this._broadcastStatus(snapshot, true);
      return false;
    }
    if (pending.asyncRejected || now - pending.at >= this.config.verifyTimeoutMs) {
      this.stats.supplyFailed += 1;
      this.stats.verificationFailures += 1;
      this.backoffUntil = now + this.config.failureBackoffMs;
      this._send(pending.target, Action.SUPPLY_RESULT, {
        transactionId: pending.transactionId,
        itemName: pending.itemName,
        quantity: pending.quantity,
        committed: false,
        reason: pending.asyncRejected ? 'SEND_ITEM_REJECTED' : 'MERCHANT_INVENTORY_DELTA_NOT_OBSERVED'
      });
      this.supplyRequests.delete(pending.target);
      this.pendingSupply = null;
      return false;
    }
    return true;
  }

  _processSupply(snapshot) {
    if (this.pendingSupply || this.now() < this.backoffUntil) return false;
    const requests = [...this.supplyRequests.values()].sort((a, b) => a.receivedAt - b.receivedAt || a.sender.localeCompare(b.sender));
    for (const request of requests) {
      if (this.now() - request.receivedAt > this.config.messageTtlMs) { this.supplyRequests.delete(request.sender); continue; }
      const merchantPos = snapshot.character;
      const farmerPos = { map: request.map, x: finite(request.x), y: finite(request.y) };
      if (!this._withinTransferRange(merchantPos, farmerPos)) continue;
      const choices = ['mpot0', 'hpot0'].map((itemName) => ({ itemName, deficit: this._supplyDeficit(request, itemName), available: countItem(snapshot, itemName) }));
      const choice = choices.find((row) => row.deficit > 0 && row.available > this.config.merchantPotionReserve);
      if (!choice) { this.supplyRequests.delete(request.sender); continue; }
      const quantity = Math.min(choice.deficit, choice.available - this.config.merchantPotionReserve, this.config.maxSupplyBatch);
      if (quantity <= 0) continue;
      const inventory = snapshot.character.inventory || [];
      const slot = inventory.find((item) => item && item.name === choice.itemName && Math.max(1, finite(item.q, 1)) >= quantity);
      if (!slot) continue;
      const binding = this._binding('send_item');
      if (!binding) {
        this.stats.supplyFailed += 1;
        this.backoffUntil = this.now() + this.config.failureBackoffMs;
        return false;
      }
      const transactionId = `supply-${this.now()}-${++this.sequence}`;
      const pending = {
        at: this.now(), transactionId, target: request.sender, itemName: choice.itemName,
        quantity, slot: slot.index, beforeCount: choice.available, asyncRejected: false
      };
      this.pendingSupply = pending;
      try {
        const result = binding.fn.call(binding.owner, request.sender, slot.index, quantity);
        this.stats.supplyTransfers += 1;
        Promise.resolve(result).catch(() => { if (this.pendingSupply && this.pendingSupply.transactionId === transactionId) this.pendingSupply.asyncRejected = true; });
        this._event('PARTY_SUPPLY_SENT', 'info', 'BOUNDED_POTION_RESUPPLY', { transactionId, target: request.sender, itemName: choice.itemName, quantity });
      } catch (error) {
        this.pendingSupply = null;
        this.stats.supplyFailed += 1;
        this.backoffUntil = this.now() + this.config.failureBackoffMs;
        this._event('PARTY_SUPPLY_FAILED', 'warn', 'SEND_ITEM_CALL_FAILED', { target: request.sender, itemName: choice.itemName, message: String(error && error.message || error).slice(0, 160) });
      }
      return true;
    }
    return false;
  }

  _rendezvousMerchant(snapshot) {
    const now = this.now();
    if (now - this.lastRendezvousMoveAt < this.config.rendezvousCooldownMs) return false;
    const here = snapshot.character;
    const rows = [...this.rendezvousRequests.values()].filter((row) => now - row.at <= this.config.rendezvousRequestTtlMs);
    if (!rows.length) return false;
    const sameMap = rows.filter((row) => !row.map || !here.map || row.map === here.map);
    if (!sameMap.length) {
      this.stats.rendezvousCrossMap += 1;
      this.lastDecision = { at: now, action: 'HOLD', reason: 'LOGISTICS_RENDEZVOUS_CROSS_MAP_UNSUPPORTED' };
      return false;
    }
    const centroid = {
      map: here.map,
      x: sameMap.reduce((sum, row) => sum + row.x, 0) / sameMap.length,
      y: sameMap.reduce((sum, row) => sum + row.y, 0) / sameMap.length
    };
    const d = distance(here, centroid);
    if (!Number.isFinite(d) || d <= this.config.rendezvousDistance) return false;
    const step = Math.min(this.config.rendezvousStep, Math.max(0, d - this.config.rendezvousDistance * 0.75));
    if (step < 2) return false;
    const x = Number(here.x) + ((centroid.x - Number(here.x)) / d) * step;
    const y = Number(here.y) + ((centroid.y - Number(here.y)) / d) * step;
    const result = this.adapter && typeof this.adapter.command === 'function' ? this.adapter.command('move', [x, y]) : { executed: false, reason: 'ADAPTER_UNAVAILABLE' };
    this.lastRendezvousMoveAt = now;
    if (result.executed || result.coalesced || result.shadow) this.stats.rendezvousMoves += 1;
    this.lastDecision = { at: now, action: 'MERCHANT_RENDEZVOUS', reason: 'PARTY_LOGISTICS_PENDING', distance: d, x, y, executed: !!result.executed, resultReason: result.reason || null };
    return true;
  }

  _farmerPosition(snapshot) {
    const c = snapshot.character;
    return { map: c.map || null, x: finite(c.x), y: finite(c.y) };
  }

  _requestSupply(snapshot) {
    const hpPotions = countItem(snapshot, 'hpot0');
    const mpPotions = countItem(snapshot, 'mpot0');
    if (hpPotions >= this.config.farmerPotionLow && mpPotions >= this.config.farmerPotionLow) return false;
    const now = this.now();
    if (now - this.lastSupplyRequestAt < this.config.supplyRequestIntervalMs) return false;
    const merchant = this._merchantName();
    if (!merchant) return false;
    this.lastSupplyRequestAt = now;
    this.stats.supplyRequests += 1;
    this._send(merchant, Action.SUPPLY_REQUEST, { hpPotions, mpPotions, target: this.config.farmerPotionTarget, ...this._farmerPosition(snapshot) });
    this.lastDecision = { at: now, action: 'SUPPLY_REQUEST', reason: hpPotions <= 0 || mpPotions <= 0 ? 'POTION_SUPPLY_MISSING' : 'POTION_SUPPLY_LOW', hpPotions, mpPotions };
    return true;
  }

  _merchantStatusFresh() {
    return !!this.lastMerchantStatus && this.now() - this.lastMerchantStatus.receivedAt <= this.config.statusFreshMs;
  }

  _safeForOutbound(snapshot) {
    if (!snapshot || !snapshot.character || snapshot.character.rip) return false;
    const self = snapshot.character.name;
    const aggro = (snapshot.entities || []).some((entity) => entity && entity.mtype && !entity.dead && entity.target === self);
    if (aggro) return false;
    const farmer = this.runtime.farmer;
    if (farmer && ['ENGAGE', 'TRAVEL', 'RECOVER'].includes(farmer.state)) return false;
    return true;
  }

  _verifyPendingOutbound(snapshot) {
    const pending = this.pendingOutbound;
    if (!pending) return false;
    const now = this.now();
    if (now - pending.at < this.config.verifyDelayMs) return true;
    let committed = false;
    if (pending.kind === 'item') committed = pending.beforeCount - countItem(snapshot, pending.name, pending.level) >= pending.quantity;
    if (pending.kind === 'gold') committed = pending.beforeGold - Math.max(0, finite(snapshot.character.gold, 0)) >= pending.amount;
    if (committed) {
      if (pending.kind === 'item') this.stats.lootVerified += 1;
      else this.stats.goldVerified += 1;
      this._send(this._merchantName(), Action.TRANSFER_COMMIT, { grantId: pending.grantId, offerId: pending.offerId, kind: pending.kind, committed: true });
      this.pendingOutbound = null;
      this.pendingOffer = null;
      this.pendingGrant = null;
      this.lastTransferAt = now;
      return false;
    }
    if (pending.asyncRejected || now - pending.at >= this.config.verifyTimeoutMs) {
      this.stats.verificationFailures += 1;
      this.backoffUntil = now + this.config.failureBackoffMs;
      this.pendingOutbound = null;
      this.pendingOffer = null;
      this.pendingGrant = null;
      return false;
    }
    return true;
  }

  _executeGrant(snapshot) {
    const grant = this.pendingGrant;
    const offer = this.pendingOffer;
    if (!grant || !offer || this.pendingOutbound || this.now() < this.backoffUntil) return false;
    if (grant.expiresAt <= this.now()) { this.pendingGrant = null; this.pendingOffer = null; return false; }
    const merchant = this._merchantName();
    if (!merchant) return false;

    if (offer.kind === 'item' && grant.action === Action.LOOT_GRANT) {
      const inventory = snapshot.character.inventory || [];
      const item = inventory.find((row) => row && Number(row.index) === Number(offer.item.index));
      if (!item || item.name !== offer.item.name || Number(item.level || 0) !== Number(offer.item.level || 0)) {
        this.pendingGrant = null; this.pendingOffer = null; return false;
      }
      const safe = this._safeLootDescriptor(item);
      if (!safe.ok) { this.pendingGrant = null; this.pendingOffer = null; return false; }
      const quantity = Math.min(Math.max(1, Math.floor(finite(grant.maxQuantity, 1))), Math.max(1, finite(item.q, 1)), this.config.maxLootStackTransfer);
      const binding = this._binding('send_item');
      if (!binding) return false;
      const beforeCount = countItem(snapshot, item.name, item.level);
      const pending = { kind: 'item', at: this.now(), offerId: offer.offerId, grantId: grant.grantId, name: item.name, level: Number(item.level || 0), quantity, beforeCount, asyncRejected: false };
      this.pendingOutbound = pending;
      try {
        const result = binding.fn.call(binding.owner, merchant, item.index, quantity);
        this.stats.lootTransfers += 1;
        Promise.resolve(result).catch(() => { if (this.pendingOutbound && this.pendingOutbound.grantId === pending.grantId) this.pendingOutbound.asyncRejected = true; });
      } catch (_) {
        this.pendingOutbound = null; this.pendingOffer = null; this.pendingGrant = null; this.backoffUntil = this.now() + this.config.failureBackoffMs;
      }
      return true;
    }

    if (offer.kind === 'gold' && grant.action === Action.GOLD_GRANT) {
      const amount = Math.min(Math.max(0, Math.floor(finite(grant.amount, 0))), Math.max(0, Math.floor(finite(snapshot.character.gold, 0) - this.config.farmerGoldReserve)), this.config.maxGoldBatch);
      if (amount <= 0) { this.pendingGrant = null; this.pendingOffer = null; return false; }
      const binding = this._binding('send_gold');
      if (!binding) return false;
      const pending = { kind: 'gold', at: this.now(), offerId: offer.offerId, grantId: grant.grantId, amount, beforeGold: finite(snapshot.character.gold, 0), asyncRejected: false };
      this.pendingOutbound = pending;
      try {
        const result = binding.fn.call(binding.owner, merchant, amount);
        this.stats.goldTransfers += 1;
        Promise.resolve(result).catch(() => { if (this.pendingOutbound && this.pendingOutbound.grantId === pending.grantId) this.pendingOutbound.asyncRejected = true; });
      } catch (_) {
        this.pendingOutbound = null; this.pendingOffer = null; this.pendingGrant = null; this.backoffUntil = this.now() + this.config.failureBackoffMs;
      }
      return true;
    }
    return false;
  }

  _offerOutbound(snapshot) {
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

    const goldSurplus = Math.max(0, Math.floor(finite(snapshot.character.gold, 0) - this.config.farmerGoldReserve));
    if (goldSurplus > 0) {
      const offerId = `gold-offer-${now}-${++this.sequence}`;
      const amount = Math.min(goldSurplus, this.config.maxGoldBatch);
      this.pendingOffer = { kind: 'gold', offerId, amount, at: now };
      this.stats.goldOffers += 1;
      this._send(merchant, Action.GOLD_OFFER, { offerId, amount, ...farmerPos });
      return true;
    }

    const item = this._safeLootCandidate(snapshot);
    if (!item) return false;
    const offerId = `loot-offer-${now}-${++this.sequence}`;
    this.pendingOffer = { kind: 'item', offerId, item: clone(item), at: now };
    this.stats.lootOffers += 1;
    this._send(merchant, Action.LOOT_OFFER, {
      offerId,
      quantity: item.quantity,
      item: { name: item.name, level: item.level, q: item.quantity, locked: false, special: false },
      ...farmerPos
    });
    return true;
  }

  _merchantTick(snapshot) {
    this._prune();
    this._verifyPendingSupply(snapshot);
    this._broadcastStatus(snapshot, false);
    this._processSupply(snapshot);
    this._rendezvousMerchant(snapshot);
    const capacity = this._merchantCapacity(snapshot);
    if (!capacity.acceptingLoot) this.lastDecision = { at: this.now(), action: 'STOP', reason: 'OKAY_STOP_MERCHANT_INVENTORY_FULL', capacity };
    return this.lastDecision;
  }

  _farmerTick(snapshot) {
    this._prune();
    this._verifyPendingOutbound(snapshot);
    this._requestSupply(snapshot);
    if (this._safeForOutbound(snapshot)) {
      if (!this._executeGrant(snapshot)) this._offerOutbound(snapshot);
    }
    return this.lastDecision;
  }

  tick(snapshot) {
    if (!this.installed || !snapshot || !snapshot.character) return null;
    if (this.adapter && this.adapter.mode !== 'active') {
      this.lastDecision = { at: this.now(), action: 'SHADOW', reason: 'RUNTIME_NOT_ACTIVE' };
      return this.lastDecision;
    }
    return this._isMerchant(snapshot) ? this._merchantTick(snapshot) : this._farmerTick(snapshot);
  }

  status() {
    this._prune();
    return {
      schemaVersion: 1,
      mode: PARTY_LOGISTICS_MODE,
      protocol: PARTY_LOGISTICS_PROTOCOL,
      type: PARTY_LOGISTICS_TYPE,
      installed: this.installed,
      localName: this._localName(),
      merchantName: this._merchantName(),
      role: this._isMerchant() ? 'merchant' : 'farmer',
      config: { ...this.config },
      authority: {
        genericSendItem: false,
        merchantSupplyAllowlist: ['hpot0', 'mpot0'],
        farmerLootPolicy: 'plain-stackable-material-only',
        farmerGoldTransfer: true,
        requiresTrustedActiveOwnCharacter: true,
        requiresShortLivedGrantForFarmerOutbound: true,
        closedLoopLocalDeltaVerification: true
      },
      lastMerchantStatus: clone(this.lastMerchantStatus),
      lastSupplyResult: clone(this.lastSupplyResult),
      pendingSupply: clone(this.pendingSupply),
      supplyRequests: [...this.supplyRequests.values()].map(clone),
      rendezvousRequests: [...this.rendezvousRequests.values()].map(clone),
      activeLootGrants: [...this.activeLootGrants.values()].map(clone),
      pendingOffer: clone(this.pendingOffer),
      pendingGrant: clone(this.pendingGrant),
      pendingOutbound: clone(this.pendingOutbound),
      backoffUntil: this.backoffUntil || null,
      lastDecision: clone(this.lastDecision),
      stats: { ...this.stats }
    };
  }
}

function installControlledPartyLogistics(runtime, options = {}) {
  return new ControlledPartyLogistics(runtime, options);
}

module.exports = {
  ControlledPartyLogistics,
  installControlledPartyLogistics,
  PARTY_LOGISTICS_TYPE,
  PARTY_LOGISTICS_PROTOCOL,
  PARTY_LOGISTICS_RECEIVER,
  PARTY_LOGISTICS_MODE,
  Action,
  countItem,
  inventoryMetrics
};
