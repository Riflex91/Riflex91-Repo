'use strict';

const { MerchantServicePlanKind, itemQuantity } = require('../merchant/merchant-service-planner');

const P0_POTION_POLICY_4500_MODE = 'p0-potion-policy-4500-v1';
const POTION_DELIVERY_QUANTITY = 4500;
const POTION_LOW_WATERMARK = 4500;
const MERCHANT_POTION_RESERVE = 0;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function inventoryOf(runtime) {
  const root = runtime && runtime.root;
  const c = root && (root.character || root.parent && root.parent.character);
  return c && Array.isArray(c.items) ? c.items : [];
}

function itemTotal(runtime, itemName) {
  return inventoryOf(runtime).reduce((sum, item) => {
    if (!item || String(item.name || '') !== String(itemName || '')) return sum;
    return sum + Math.max(1, Math.floor(finite(item.q, 1)));
  }, 0);
}

function characterOf(runtime) {
  const root = runtime && runtime.root;
  return root && (root.character || root.parent && root.parent.character) || null;
}

function rawFunction(root, name) {
  if (root && typeof root[name] === 'function') return { fn: root[name], owner: root };
  if (root && root.parent && typeof root.parent[name] === 'function') return { fn: root.parent[name], owner: root.parent };
  return null;
}

function exactBundle() {
  return [
    { family: 'hp', itemName: 'hpot0', quantity: POTION_DELIVERY_QUANTITY },
    { family: 'mp', itemName: 'mpot0', quantity: POTION_DELIVERY_QUANTITY }
  ];
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
    let remaining = POTION_DELIVERY_QUANTITY;
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

function installPlannerPolicy(runtime) {
  const planner = runtime && runtime.merchantServicePlanner;
  if (!planner) return false;

  // Zero means the merchant carries no dedicated potion reserve after a farmer
  // delivery. This intentionally frees inventory capacity for merchant work.
  planner.merchantPotionReserve = MERCHANT_POTION_RESERVE;
  planner.lowPotionCount = POTION_LOW_WATERMARK;
  planner.targetPotionCount = POTION_DELIVERY_QUANTITY;
  planner.maxDeliveryQuantity = POTION_DELIVERY_QUANTITY;

  if (planner.__p0PotionPolicy4500PlannerInstalled || typeof planner.plan !== 'function') return true;
  const basePlan = planner.plan.bind(planner);
  planner.plan = (input = {}) => {
    const plan = basePlan(input);
    if (!plan || !(plan.metadata && plan.metadata.p0PotionBundle)) return plan;

    const bundle = exactBundle();
    const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
    const stock = Object.fromEntries(bundle.map((row) => [row.itemName, itemQuantity(inventory, row.itemName)]));
    const missing = bundle.filter((row) => finite(stock[row.itemName], 0) < POTION_DELIVERY_QUANTITY);
    const originalKind = plan.kind === MerchantServicePlanKind.RESTOCK_REQUIRED && plan.afterRestock
      ? plan.afterRestock
      : plan.kind;
    const next = {
      ...clone(plan),
      deliveries: clone(bundle),
      delivery: clone(bundle[0]),
      metadata: {
        ...(plan.metadata || {}),
        p0PotionBundle: true,
        p0PotionPolicy4500: true,
        bundlePolicy: 'EXACT_4500_HP_AND_4500_MP_PER_FARMER_DELIVERY',
        stockRequirements: bundle.map((row) => ({ itemName: row.itemName, requiredStock: POTION_DELIVERY_QUANTITY, merchantReserve: MERCHANT_POTION_RESERVE }))
      }
    };

    if (missing.length) {
      next.kind = MerchantServicePlanKind.RESTOCK_REQUIRED;
      next.afterRestock = originalKind;
      next.reason = 'MERCHANT_POTION_BUNDLE_4500_RESTOCK_REQUIRED';
      next.missingStock = missing.map((row) => ({ itemName: row.itemName, have: stock[row.itemName], required: POTION_DELIVERY_QUANTITY }));
      next.distance = null;
    } else if (plan.kind === MerchantServicePlanKind.RESTOCK_REQUIRED && plan.reason === 'MERCHANT_POTION_BUNDLE_RESTOCK_REQUIRED') {
      next.kind = originalKind;
      next.reason = 'MERCHANT_POTION_BUNDLE_4500_READY';
      delete next.missingStock;
    }

    planner.lastPlan = clone(next);
    return clone(next);
  };
  planner.__p0PotionPolicy4500PlannerInstalled = true;
  return true;
}

function installRestockPolicy(runtime) {
  const alpha27 = runtime && runtime.alpha27CombatMerchantConvergence;
  const merchant = alpha27 && alpha27.merchant;
  if (!merchant || typeof merchant.restockPartyPotions !== 'function') return false;

  merchant.options.merchantPotionLow = POTION_LOW_WATERMARK;
  merchant.options.merchantPotionTarget = POTION_DELIVERY_QUANTITY;
  merchant.options.merchantMaxPotionBuy = Math.max(9000, finite(merchant.options.merchantMaxPotionBuy, 0));

  if (merchant.__p0PotionPolicy4500RestockInstalled) return true;
  const base = merchant.restockPartyPotions.bind(merchant);
  merchant.restockPartyPotions = async () => {
    const plan = runtime.lastMerchantServicePlan;
    if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500) || plan.kind !== MerchantServicePlanKind.RESTOCK_REQUIRED) return base();
    if (!await merchant.ensureStandClosed('PARTY_SUPPLY_4500_RESTOCK')) return true;

    const needed = exactBundle().find((row) => itemTotal(runtime, row.itemName) < POTION_DELIVERY_QUANTITY);
    if (!needed) return false;

    const canBuy = rawFunction(merchant.root, 'can_buy');
    let near = false;
    if (canBuy) {
      try { near = canBuy.fn.call(canBuy.owner, needed.itemName) === true; } catch (_) { near = false; }
    }
    if (!near) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'SERVICE_TRAVEL', reason: 'PARTY_SUPPLY_4500_VENDOR_REQUIRED', destination: needed.itemName };
      await merchant.atomic.namedServiceTravel(needed.itemName);
      return true;
    }

    const buy = rawFunction(merchant.root, 'buy');
    if (!buy) {
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_4500', result: 'FAILED_SAFE', reason: 'BUY_API_UNAVAILABLE' };
      return true;
    }

    const c = characterOf(runtime);
    const gd = runtime.adapter && typeof runtime.adapter.getGameData === 'function' ? runtime.adapter.getGameData() || {} : {};
    const meta = gd.items && gd.items[needed.itemName];
    const price = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    const before = itemTotal(runtime, needed.itemName);
    const deficit = Math.max(0, POTION_DELIVERY_QUANTITY - before);
    const affordable = price > 0 ? Math.max(0, Math.floor((finite(c && c.gold, 0) - merchant.options.goldReserve) / price)) : deficit;
    const quantity = Math.max(0, Math.min(deficit, affordable, merchant.options.merchantMaxPotionBuy));
    if (quantity <= 0) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'HOLD', reason: 'PARTY_SUPPLY_GOLD_RESERVE_PROTECTED', itemName: needed.itemName, have: before, requiredStock: POTION_DELIVERY_QUANTITY };
      return true;
    }

    try {
      const response = await merchant.atomic._timeout(buy.fn.call(buy.owner, needed.itemName, quantity), 'BUY_PARTY_SUPPLY_4500', 15000);
      if (response && response.failed === true) throw response;
      const verified = await merchant.atomic.verifyEventually(() => itemTotal(runtime, needed.itemName) >= before + quantity);
      if (!verified) throw new Error('PARTY_SUPPLY_4500_PURCHASE_DELTA_NOT_OBSERVED');
      merchant.stats.potionRestocks = (merchant.stats.potionRestocks || 0) + 1;
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_4500', result: 'COMMITTED', itemName: needed.itemName, quantity, requiredStock: POTION_DELIVERY_QUANTITY };
      return true;
    } catch (error) {
      merchant.stats.failedSafe = (merchant.stats.failedSafe || 0) + 1;
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_4500', result: 'FAILED_SAFE', reason: String(error && error.message || error || 'BUY_PARTY_SUPPLY_4500_FAILED') };
      return true;
    }
  };
  merchant.__p0PotionPolicy4500RestockInstalled = true;
  return true;
}

function installDeliveryPolicy(runtime) {
  const service = runtime && runtime.controlledMerchantService;
  if (!service || typeof service._executeDelivery !== 'function') return false;
  if (service.__p0PotionPolicy4500DeliveryInstalled) return true;

  const baseDelivery = service._executeDelivery.bind(service);
  service._executeDelivery = async (plan) => {
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : null;
    if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500) || !deliveries) return baseDelivery(plan);

    const exact = deliveries.length === 2 &&
      deliveries.some((row) => String(row.itemName || '') === 'hpot0' && Number(row.quantity) === POTION_DELIVERY_QUANTITY) &&
      deliveries.some((row) => String(row.itemName || '') === 'mpot0' && Number(row.quantity) === POTION_DELIVERY_QUANTITY) &&
      deliveries.every((row) => ['hpot0', 'mpot0'].includes(String(row.itemName || '')) && Number(row.quantity) === POTION_DELIVERY_QUANTITY);
    if (!exact) return { executed: false, committed: false, reason: 'INVALID_POTION_BUNDLE_4500' };

    const targetName = plan.target && String(plan.target.name || '');
    const sourceReportAt = finite(plan.sourceReportAt);
    if (!service._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
    const target = service._visibleTarget(targetName);
    if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
    const c = service._character();
    if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
    const distance = service._distanceTo(target);
    if (distance == null || distance > service.maxDeliveryDistance) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };

    for (const row of deliveries) {
      const have = itemQuantity(service._inventorySnapshot(), row.itemName);
      if (have < POTION_DELIVERY_QUANTITY) return { executed: false, committed: false, reason: 'POTION_BUNDLE_STOCK_INCOMPLETE', itemName: row.itemName, have, required: POTION_DELIVERY_QUANTITY };
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
      action: 'send_potion_bundle', targetName, sourceReportAt, deliveries: clone(deliveries), chunks: clone(chunks), beforeTotals, expectedAfterTotals
    })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };

    service._transition('EXECUTING', 'RAW_ACTION_STARTING');
    service.stats.deliveries += 1;
    try {
      for (const chunk of chunks) {
        const beforeChunkTotal = itemQuantity(service._inventorySnapshot(), chunk.itemName);
        const expectedChunkTotal = beforeChunkTotal - chunk.quantity;
        if (expectedChunkTotal < expectedAfterTotals[chunk.itemName]) throw new Error(`POTION_BUNDLE_CHUNK_WOULD_OVERDELIVER:${chunk.itemName}`);

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
      return service._commit(plan.kind, 'POTION_BUNDLE_4500_DELIVERY_LOCAL_DELTA_VERIFIED', { targetName, deliveries: clone(deliveries), sourceReportAt, merchantPotionReserve: MERCHANT_POTION_RESERVE });
    } catch (error) {
      try { service._markServedReport(targetName, sourceReportAt); } catch (_) {}
      return service._failed(plan.kind, String(error && error.message || error || 'POTION_BUNDLE_4500_DELIVERY_FAILED'), { targetName, deliveries: clone(deliveries), sourceReportAt });
    }
  };

  service.__p0PotionPolicy4500DeliveryInstalled = true;
  return true;
}

function installStatusPolicy(runtime) {
  const recovery = runtime && runtime.p0RegroupSupplyRecovery;
  if (recovery && !recovery.__p0PotionPolicy4500StatusInstalled && typeof recovery.status === 'function') {
    const baseStatus = recovery.status.bind(recovery);
    recovery.status = () => {
      const status = baseStatus() || {};
      return {
        ...status,
        potionPolicy: {
          ...(status.potionPolicy || {}),
          deliveryPerFarmer: { hpot0: POTION_DELIVERY_QUANTITY, mpot0: POTION_DELIVERY_QUANTITY },
          lowWatermark: POTION_LOW_WATERMARK,
          merchantReserve: MERCHANT_POTION_RESERVE,
          policyOverride: P0_POTION_POLICY_4500_MODE
        }
      };
    };
    recovery.__p0PotionPolicy4500StatusInstalled = true;
  }

  const logistics = runtime && runtime.controlledPartyLogistics;
  if (logistics && logistics.config) {
    logistics.config.farmerPotionLow = POTION_LOW_WATERMARK;
    logistics.config.farmerPotionTarget = POTION_DELIVERY_QUANTITY;
    logistics.config.maxSupplyBatch = POTION_DELIVERY_QUANTITY;
  }
  return true;
}

function installP0PotionPolicy4500(runtime) {
  if (!runtime) throw new Error('runtime required');
  installPlannerPolicy(runtime);
  installRestockPolicy(runtime);
  installDeliveryPolicy(runtime);
  installStatusPolicy(runtime);
  runtime.p0PotionPolicy4500 = {
    mode: P0_POTION_POLICY_4500_MODE,
    deliveryQuantity: POTION_DELIVERY_QUANTITY,
    lowWatermark: POTION_LOW_WATERMARK,
    merchantPotionReserve: MERCHANT_POTION_RESERVE,
    installed: true
  };
  return runtime.p0PotionPolicy4500;
}

module.exports = {
  P0_POTION_POLICY_4500_MODE,
  POTION_DELIVERY_QUANTITY,
  POTION_LOW_WATERMARK,
  MERCHANT_POTION_RESERVE,
  installP0PotionPolicy4500
};
