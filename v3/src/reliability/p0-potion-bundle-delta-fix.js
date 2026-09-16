'use strict';

const { itemQuantity } = require('../merchant/merchant-service-planner');

const P0_POTION_BUNDLE_DELTA_FIX_MODE = 'p0-potion-bundle-delta-fix-v1';
const POTION_DELIVERY_QUANTITY = 5000;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function rawFunction(root, name) {
  if (root && typeof root[name] === 'function') return { fn: root[name], owner: root };
  if (root && root.parent && typeof root.parent[name] === 'function') return { fn: root.parent[name], owner: root.parent };
  return null;
}

function itemStacks(service, itemName) {
  const items = typeof service._inventory === 'function' ? service._inventory() : [];
  const size = typeof service._inventorySize === 'function' ? service._inventorySize() : items.length;
  const rows = [];
  for (let index = 0; index < Math.min(size, items.length); index += 1) {
    const item = items[index];
    if (!item || String(item.name || '') !== String(itemName || '')) continue;
    rows.push({ index, q: Math.max(1, Math.floor(finite(item.q, 1))) });
  }
  rows.sort((a, b) => b.q - a.q || a.index - b.index);
  return rows;
}

function bundleChunks(service, deliveries) {
  const chunks = [];
  for (const delivery of deliveries) {
    let remaining = Math.max(1, Math.floor(finite(delivery.quantity, 1)));
    for (const stack of itemStacks(service, delivery.itemName)) {
      if (remaining <= 0) break;
      const quantity = Math.min(remaining, stack.q);
      chunks.push({ itemName: delivery.itemName, index: stack.index, quantity });
      remaining -= quantity;
    }
    if (remaining > 0) return null;
  }
  return chunks;
}

function recoveryStats(runtime) {
  const module = runtime && runtime.p0RegroupSupplyRecovery;
  return module && module.stats ? module.stats : null;
}

function installP0PotionBundleDeltaFix(runtime) {
  const service = runtime && runtime.controlledMerchantService;
  if (!service || service.__p0PotionBundleDeltaFixInstalled || typeof service._executeDelivery !== 'function') return false;

  const baseDelivery = service._executeDelivery.bind(service);
  service._executeDelivery = async (plan) => {
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : null;
    if (!plan || !plan.metadata || plan.metadata.p0PotionBundle !== true || !deliveries || deliveries.length !== 2) {
      return baseDelivery(plan);
    }

    const targetName = plan.target && String(plan.target.name || '');
    const sourceReportAt = finite(plan.sourceReportAt);
    const exactBundle = deliveries.length === 2 &&
      deliveries.some((row) => String(row.itemName || '') === 'hpot0' && Number(row.quantity) === POTION_DELIVERY_QUANTITY) &&
      deliveries.some((row) => String(row.itemName || '') === 'mpot0' && Number(row.quantity) === POTION_DELIVERY_QUANTITY) &&
      deliveries.every((row) => ['hpot0', 'mpot0'].includes(String(row.itemName || '')) && Number(row.quantity) === POTION_DELIVERY_QUANTITY);

    if (!exactBundle) return { executed: false, committed: false, reason: 'INVALID_POTION_BUNDLE' };
    if (!service._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
    const target = service._visibleTarget(targetName);
    if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
    const c = service._character();
    if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
    const distance = service._distanceTo(target);
    if (distance == null || distance > service.maxDeliveryDistance) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };

    const reserve = Math.max(0, Math.floor(finite(runtime.merchantServicePlanner && runtime.merchantServicePlanner.merchantPotionReserve, 0)));
    for (const row of deliveries) {
      const have = itemQuantity(service._inventorySnapshot(), row.itemName);
      const required = POTION_DELIVERY_QUANTITY + reserve;
      if (have < required) return { executed: false, committed: false, reason: 'POTION_BUNDLE_STOCK_INCOMPLETE', itemName: row.itemName, have, required };
    }

    const chunks = bundleChunks(service, deliveries);
    if (!chunks || !chunks.length) return { executed: false, committed: false, reason: 'POTION_BUNDLE_SOURCE_UNAVAILABLE' };
    const budget = service._rawBudget();
    if (budget.used + chunks.length > budget.max) return { executed: false, committed: false, reason: 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED' };
    const fn = rawFunction(service.root, 'send_item');
    if (!fn) return { executed: false, committed: false, reason: 'SEND_ITEM_API_UNAVAILABLE' };

    const beforeTotals = Object.fromEntries(deliveries.map((row) => [row.itemName, itemQuantity(service._inventorySnapshot(), row.itemName)]));
    const expectedAfterTotals = Object.fromEntries(deliveries.map((row) => [row.itemName, beforeTotals[row.itemName] - POTION_DELIVERY_QUANTITY]));
    if (!service._startOperation(plan, {
      action: 'send_potion_bundle',
      targetName,
      sourceReportAt,
      deliveries: clone(deliveries),
      chunks: clone(chunks),
      beforeTotals,
      expectedAfterTotals
    })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };

    service._transition('EXECUTING', 'RAW_ACTION_STARTING');
    service.stats.deliveries += 1;

    try {
      for (const chunk of chunks) {
        // Capture the item-family total BEFORE send_item. Adventure Land may update
        // the local inventory either before or after the returned promise resolves.
        // The old implementation captured it afterwards and could therefore subtract
        // the chunk twice when the local inventory changed synchronously.
        const beforeChunkTotal = itemQuantity(service._inventorySnapshot(), chunk.itemName);
        const expectedChunkTotal = beforeChunkTotal - chunk.quantity;
        if (expectedChunkTotal < expectedAfterTotals[chunk.itemName]) {
          throw new Error(`POTION_BUNDLE_CHUNK_WOULD_OVERDELIVER:${chunk.itemName}`);
        }

        service.actionTimes.push(service.now());
        service.stats.rawActions += 1;
        const response = await service._timeout(fn.fn.call(fn.owner, targetName, chunk.index, chunk.quantity));
        if (response && response.success === false) throw new Error(`SEND_ITEM_REJECTED:${response.reason || 'unknown'}`);

        const verified = itemQuantity(service._inventorySnapshot(), chunk.itemName) <= expectedChunkTotal ||
          await service._verify(() => itemQuantity(service._inventorySnapshot(), chunk.itemName) <= expectedChunkTotal);
        if (!verified) throw new Error(`POTION_BUNDLE_DELTA_NOT_OBSERVED:${chunk.itemName}`);
      }

      service._transition('VERIFYING', 'RAW_ACTION_RETURNED');
      const verified = deliveries.every((row) => itemQuantity(service._inventorySnapshot(), row.itemName) === expectedAfterTotals[row.itemName]) ||
        await service._verify(() => deliveries.every((row) => itemQuantity(service._inventorySnapshot(), row.itemName) === expectedAfterTotals[row.itemName]));
      if (!verified) throw new Error('POTION_BUNDLE_FINAL_DELTA_VERIFICATION_FAILED');
      if (!service._markServedReport(targetName, sourceReportAt)) throw new Error('DELIVERY_DEDUPE_PERSIST_FAILED');

      const stats = recoveryStats(runtime);
      if (stats) stats.bundleDeliveriesCommitted = (stats.bundleDeliveriesCommitted || 0) + 1;
      return service._commit(plan.kind, 'POTION_BUNDLE_DELIVERY_LOCAL_DELTA_VERIFIED', { targetName, deliveries: clone(deliveries), sourceReportAt });
    } catch (error) {
      // A partially applied two-family delivery is never replayed from the same
      // telemetry report. This keeps the at-most-once fail-safe semantics.
      try { service._markServedReport(targetName, sourceReportAt); } catch (_) {}
      const stats = recoveryStats(runtime);
      if (stats) stats.bundleDeliveriesFailedSafe = (stats.bundleDeliveriesFailedSafe || 0) + 1;
      return service._failed(plan.kind, String(error && error.message || error || 'POTION_BUNDLE_DELIVERY_FAILED'), { targetName, deliveries: clone(deliveries), sourceReportAt });
    }
  };

  service.__p0PotionBundleDeltaFixInstalled = true;
  return true;
}

module.exports = {
  P0_POTION_BUNDLE_DELTA_FIX_MODE,
  POTION_DELIVERY_QUANTITY,
  installP0PotionBundleDeltaFix
};
