'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, identityQuantity, gameDataOf } = require('./alpha27-utils');

const PROTECTED_META = ['quest','q','event','cash','cash_item','soulbound','soul_bound'];

class Alpha28MerchantTransfers {
  constructor(runtime, shared) {
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = shared.now;
    this.log = shared.log;
    this.stats = shared.stats;
    this.queue = [];
    this.maxQueue = 32;
    this.patchService();
    this.installApi();
  }

  event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'alpha28-merchant-transfer', event, severity, reason, data }); } catch (_) {}
  }

  _isMerchant() {
    const c = characterOf(this.runtime);
    return String(c && (c.ctype || c.type) || '').toLowerCase() === 'merchant';
  }

  _trusted(targetName) {
    const service = this.runtime.controlledMerchantService;
    if (service && typeof service._trusted === 'function') return service._trusted(targetName);
    const transport = this.runtime.partyAccountCommunication && this.runtime.partyAccountCommunication.transport;
    return !!(transport && typeof transport.isOwned === 'function' && transport.isOwned(targetName));
  }

  _findSource(request) {
    const items = inventoryOf(this.root);
    const wantedIndex = request.index == null ? null : Math.floor(finite(request.index, -1));
    const wantedName = request.itemName == null ? null : String(request.itemName);
    const wantedLevel = request.itemLevel == null ? null : Math.max(0, Math.floor(finite(request.itemLevel, 0)));
    return items.find((item) => item &&
      (wantedIndex == null || item.index === wantedIndex) &&
      (wantedName == null || item.name === wantedName) &&
      (wantedLevel == null || levelOf(item) === wantedLevel)) || null;
  }

  _validateSource(source, quantity) {
    if (!source || !source.name) return { ok: false, reason: 'TRANSFER_SOURCE_UNAVAILABLE' };
    if (source.locked || source.l || source.special || source.p) return { ok: false, reason: 'TRANSFER_SOURCE_PROTECTED_RAW' };
    const gameData = gameDataOf(this.runtime);
    const meta = gameData.items && gameData.items[source.name];
    if (!meta) return { ok: false, reason: 'TRANSFER_ITEM_METADATA_UNKNOWN' };
    if (PROTECTED_META.some((key) => meta[key])) return { ok: false, reason: 'TRANSFER_ITEM_PROTECTED_METADATA' };
    if (this.runtime.contentDrift && typeof this.runtime.contentDrift.requiresRevalidation === 'function' && this.runtime.contentDrift.requiresRevalidation('items', source.name)) return { ok: false, reason: 'TRANSFER_ITEM_REQUIRES_REVALIDATION' };
    const c = characterOf(this.runtime);
    const ledger = this.runtime.inventoryLedger && typeof this.runtime.inventoryLedger.get === 'function' ? this.runtime.inventoryLedger.get(c && c.name, source.index) : null;
    if (!ledger) return { ok: false, reason: 'TRANSFER_LEDGER_ENTRY_REQUIRED' };
    if (String(ledger.disposition || '').startsWith('RESERVE_')) return { ok: false, reason: 'TRANSFER_ITEM_RESERVED', disposition: ledger.disposition };
    const q = Math.max(1, Math.floor(finite(source.q, 1)));
    if (quantity < 1 || quantity > q) return { ok: false, reason: 'TRANSFER_QUANTITY_INVALID' };
    return { ok: true, ledger, meta };
  }

  request(input = {}) {
    if (!this._isMerchant()) return { accepted: false, reason: 'MERCHANT_REQUIRED' };
    const targetName = String(input.targetName || '').trim();
    if (!targetName || !this._trusted(targetName)) return { accepted: false, reason: 'TRUSTED_PARTY_TARGET_REQUIRED' };
    if (this.queue.length >= this.maxQueue) return { accepted: false, reason: 'TRANSFER_QUEUE_FULL' };
    const source = this._findSource(input);
    if (!source) return { accepted: false, reason: 'TRANSFER_SOURCE_UNAVAILABLE' };
    const quantity = Math.max(1, Math.floor(finite(input.quantity, 1)));
    const safe = this._validateSource(source, quantity);
    if (!safe.ok) return { accepted: false, reason: safe.reason };
    const row = {
      id: `alpha28-transfer-${this.now()}-${this.queue.length + 1}`,
      createdAt: this.now(),
      expiresAt: this.now() + Math.max(30000, finite(input.ttlMs, 120000)),
      targetName,
      itemName: source.name,
      itemLevel: levelOf(source),
      quantity,
      sourceIndex: source.index
    };
    this.queue.push(row);
    this.stats.arbitraryTransferRequests += 1;
    this.event('ALPHA28_ARBITRARY_TRANSFER_QUEUED', 'info', 'TRUSTED_PARTY_REQUEST', clone(row));
    return { accepted: true, request: clone(row) };
  }

  installApi() {
    if (this.runtime.requestMerchantItemTransfer) return false;
    this.runtime.requestMerchantItemTransfer = (request) => this.request(request);
    this.runtime.listMerchantItemTransfers = () => this.queue.map(clone);
    return true;
  }

  patchService() {
    const service = this.runtime.controlledMerchantService;
    if (!service || service.__alpha28ArbitraryTransferPatched || typeof service._executeDelivery !== 'function') return false;
    const base = service._executeDelivery.bind(service);
    service._executeDelivery = async (plan) => {
      if (!(plan && plan.metadata && plan.metadata.alpha28ArbitraryTransfer === true)) return base(plan);
      const delivery = plan.delivery || {};
      const targetName = plan.target && String(plan.target.name || '');
      if (!this._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
      const target = typeof service._visibleTarget === 'function' ? service._visibleTarget(targetName) : null;
      if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
      const c = characterOf(this.runtime);
      if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
      const distance = typeof service._distanceTo === 'function' ? service._distanceTo(target) : null;
      if (distance == null || distance > finite(service.maxDeliveryDistance, 400)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };
      const source = this._findSource({ index: plan.metadata.sourceIndex, itemName: delivery.itemName, itemLevel: plan.metadata.itemLevel });
      const quantity = Math.max(1, Math.floor(finite(delivery.quantity, 1)));
      const safe = this._validateSource(source, quantity);
      if (!safe.ok) return { executed: false, committed: false, reason: safe.reason };
      const beforeTotal = identityQuantity(inventoryOf(this.root), source.name, levelOf(source));
      if (!service._startOperation(plan, { action: 'send_item', alpha28ArbitraryTransfer: true, targetName, sourceReportAt: finite(plan.sourceReportAt, this.now()), itemName: source.name, itemLevel: levelOf(source), quantity, sourceIndex: source.index, beforeTotal, expectedAfterTotal: beforeTotal - quantity })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };
      service._transition('EXECUTING', 'RAW_ACTION_STARTING');
      service.actionTimes.push(this.now());
      service.stats.rawActions += 1;
      service.stats.deliveries += 1;
      this.stats.arbitraryTransferAttempts += 1;
      try {
        const command = service._command('send_item', [targetName, source.index, quantity]);
        if (!command.executed) return service._failed(plan.kind, `SEND_ITEM_COMMAND_REJECTED:${command.reason || 'unknown'}`, { targetName, itemName: source.name, quantity });
        const response = await service._timeout(command.value);
        if (response && response.success === false) return service._failed(plan.kind, `SEND_ITEM_REJECTED:${response.reason || 'unknown'}`, { targetName, itemName: source.name, quantity });
        service._transition('VERIFYING', 'RAW_ACTION_RETURNED');
        const verified = await service._verify(() => identityQuantity(inventoryOf(this.root), source.name, levelOf(source)) === beforeTotal - quantity);
        if (!verified) return service._failed(plan.kind, 'ARBITRARY_TRANSFER_LOCAL_DELTA_VERIFICATION_FAILED', { targetName, itemName: source.name, quantity });
        this.stats.arbitraryTransfersCommitted += 1;
        return service._commit(plan.kind, 'ARBITRARY_TRANSFER_LOCAL_DELTA_VERIFIED', { targetName, itemName: source.name, itemLevel: levelOf(source), quantity });
      } catch (error) {
        return service._failed(plan.kind, String(error && error.message || error || 'SEND_ITEM_FAILED'), { targetName, itemName: source.name, quantity });
      }
    };
    if (typeof service.reconcile === 'function') {
      const baseReconcile = service.reconcile.bind(service);
      service.reconcile = () => {
        const op = service.activeOperation;
        if (!op || op.alpha28ArbitraryTransfer !== true || op.state !== 'RECOVERING') return baseReconcile();
        const committed = identityQuantity(inventoryOf(this.root), op.itemName, op.itemLevel) === Number(op.expectedAfterTotal);
        if (committed) {
          // Arbitrary transfer operations use their persisted active operation as
          // their idempotency record. Do not advance the normal party-service
          // served-report watermark, or a transfer could starve a later potion
          // service report for the same character.
          service._transition('COMMITTED', 'RESTART_ARBITRARY_TRANSFER_RECONCILIATION_VERIFIED');
          service.stats.recovered += 1; service.stats.committed += 1; this.stats.arbitraryTransfersCommitted += 1;
          return { reconciled: true, committed: true, reason: 'RESTART_ARBITRARY_TRANSFER_RECONCILIATION_VERIFIED' };
        }
        service._transition('FAILED_SAFE', 'RESTART_ARBITRARY_TRANSFER_OUTCOME_UNCERTAIN_NO_RETRY');
        service.stats.failedSafe += 1;
        if (typeof service._failure === 'function') service._failure('RESTART_ARBITRARY_TRANSFER_OUTCOME_UNCERTAIN_NO_RETRY');
        return { reconciled: true, committed: false, reason: 'RESTART_ARBITRARY_TRANSFER_OUTCOME_UNCERTAIN_NO_RETRY' };
      };
    }
    if (typeof service.status === 'function') {
      const baseStatus = service.status.bind(service);
      service.status = () => {
        const status = baseStatus();
        return {
          ...status,
          rawActionFamilies: [...new Set([...(status.rawActionFamilies || []), 'SEND_ITEM'])],
          alpha28ArbitraryItemTransfer: true,
          arbitraryItemTransferConfigured: true,
          arbitraryItemTransferAllowed: status.enabled === true && status.allowDelivery === true,
          arbitraryItemTransferScope: 'TRUSTED_PARTY_KNOWN_UNRESERVED_ITEMS_ONLY'
        };
      };
    }
    if (typeof this.runtime.merchantServiceStatus === 'function' && !this.runtime.__alpha28ArbitraryTransferStatusPatched) {
      const baseRuntimeStatus = this.runtime.merchantServiceStatus.bind(this.runtime);
      this.runtime.merchantServiceStatus = () => {
        const status = baseRuntimeStatus();
        const live = service.status();
        return { ...status, arbitraryItemTransferConfigured: true, arbitraryItemTransferAuthority: live.enabled === true && live.allowDelivery === true, arbitraryItemTransferScope: 'TRUSTED_PARTY_KNOWN_UNRESERVED_ITEMS_ONLY' };
      };
      this.runtime.__alpha28ArbitraryTransferStatusPatched = true;
    }
    service.__alpha28ArbitraryTransferPatched = true;
    return true;
  }

  async tick() {
    this.patchService();
    if (!this._isMerchant() || !this.queue.length) return false;
    const now = this.now();
    while (this.queue.length && this.queue[0].expiresAt <= now) { this.queue.shift(); this.stats.arbitraryTransferExpired += 1; }
    const request = this.queue[0];
    if (!request) return false;
    const service = this.runtime.controlledMerchantService;
    if (!service || (typeof service.status === 'function' && service.status().busy)) return false;
    const plan = {
      schemaVersion: 1,
      id: request.id,
      at: now,
      kind: 'SERVICE_DELIVERY',
      reason: 'ALPHA28_ARBITRARY_TRUSTED_PARTY_TRANSFER',
      target: { name: request.targetName },
      sourceReportAt: request.createdAt,
      delivery: { itemName: request.itemName, quantity: request.quantity },
      metadata: { alpha28ArbitraryTransfer: true, sourceIndex: request.sourceIndex, itemLevel: request.itemLevel },
      actionAuthority: false,
      liveExecutionAllowed: false
    };
    const result = await service.execute(plan);
    if (result && (result.committed === true || result.executed === true || String(result.reason || '').includes('FAILED'))) this.queue.shift();
    return !!result;
  }

  status() {
    const service = this.runtime.controlledMerchantService;
    const serviceStatus = service && typeof service.status === 'function' ? service.status() : null;
    return {
      arbitraryItemTransferAuthority: this._isMerchant() && !!(serviceStatus && serviceStatus.enabled && serviceStatus.allowDelivery),
      configuredOn: true,
      scope: 'TRUSTED_PARTY_KNOWN_UNRESERVED_ITEMS_ONLY',
      queued: this.queue.length,
      maxQueue: this.maxQueue,
      restartUncertainNoBlindRetry: true,
      protectedMetadataBlocked: true
    };
  }
}

module.exports = { Alpha28MerchantTransfers };
