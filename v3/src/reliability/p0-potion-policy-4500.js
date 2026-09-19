'use strict';

const { MerchantServicePlanKind, itemQuantity } = require('../merchant/merchant-service-planner');

const P0_POTION_POLICY_4500_MODE = 'p0-potion-policy-demand-4500-batch-v6';
const POTION_TARGET_COUNT = 4500;
// A latched service order is bounded so stale party telemetry cannot pin a target forever.
const POTION_SERVICE_CHAIN_TIMEOUT_MS = 130000;
const POTION_REQUEST_BELOW = 200;
const POTION_LOW_WATERMARK = POTION_REQUEST_BELOW - 1;
// Compatibility export only. 4500 is the farmer target, never a fixed delivery size.
const POTION_DELIVERY_QUANTITY = POTION_TARGET_COUNT;
// Reserve means newly purchased reserve. Existing stock is reused and may remain for the next farmer.
const MERCHANT_POTION_RESERVE = 0;
const MAX_DYNAMIC_DELIVERY = POTION_TARGET_COUNT;
const MAX_BATCH_FARMERS = 3;
const MAX_BATCH_ITEM_STOCK = POTION_TARGET_COUNT * MAX_BATCH_FARMERS;

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function potionServiceChainState(runtime) {
  if (!runtime.__p0PotionPolicy4500ServiceChainState) {
    runtime.__p0PotionPolicy4500ServiceChainState = {
      sequence: 0,
      active: null,
      lastRelease: null,
      stats: {
        starts: 0,
        refreshes: 0,
        releases: 0,
        timeouts: 0,
        downwardClamps: 0,
        batchStarts: 0,
        batchTargetsPlanned: 0,
        batchTargetsDelivered: 0,
        batchTargetsSatisfiedExternally: 0,
        batchTargetSwitches: 0,
        freshReportRebinds: 0,
        postBatchStaleSuppressions: 0
      }
    };
  }
  return runtime.__p0PotionPolicy4500ServiceChainState;
}

function publishPotionServiceChain(runtime) {
  const policy = runtime && runtime.p0PotionPolicy4500;
  if (!policy || typeof policy !== 'object') return;
  const state = potionServiceChainState(runtime);
  policy.serviceChain = clone(state.active);
  policy.serviceChainStats = clone(state.stats);
  policy.lastServiceChainRelease = clone(state.lastRelease);
}

function startPotionServiceBatch(runtime, planner, plan, targets, metadata, observedFarmerCount) {
  const state = potionServiceChainState(runtime);
  const now = planner.now();
  state.sequence += 1;
  const rows = (Array.isArray(targets) ? targets : []).slice(0, MAX_BATCH_FARMERS).map((row) => ({
    name: String(row.name || ''),
    sourceReportAt: finite(row.sourceReportAt),
    target: clone(row.target || null),
    deliveries: clone(row.deliveries || []),
    status: 'PENDING',
    completedAt: null,
    completionReason: null
  })).filter((row) => row.name && row.deliveries.length);
  if (!rows.length) return null;
  state.active = {
    id: `p0-potion-batch-${now.toString(36)}-${state.sequence.toString(36)}`,
    batch: true,
    startedAt: now,
    refreshedAt: now,
    triggerTargetName: plan && plan.target && String(plan.target.name || '') || null,
    observedFarmerCount: Math.max(0, Math.floor(finite(observedFarmerCount, rows.length))),
    targetName: null,
    sourceReportAt: null,
    target: null,
    deliveries: [],
    currentTargetName: null,
    targets: rows,
    deliveredCount: 0,
    metadata: clone(metadata || {})
  };
  state.stats.starts += 1;
  state.stats.batchStarts += 1;
  state.stats.batchTargetsPlanned += rows.length;
  publishPotionServiceChain(runtime);
  return state.active;
}

function releasePotionServiceChain(runtime, reason, plan = null) {
  const state = potionServiceChainState(runtime);
  const active = state.active;
  if (!active) return null;
  const planChainId = plan && plan.metadata && plan.metadata.p0PotionServiceChainId;
  if (planChainId && String(planChainId) !== String(active.id)) return null;
  const now = runtime && typeof runtime.now === 'function' ? runtime.now() : Date.now();
  state.active = null;
  state.stats.releases += 1;
  if (reason === 'SERVICE_CHAIN_TIMEOUT') state.stats.timeouts += 1;
  const maxSourceReportAt = Math.max(
    0,
    ...((Array.isArray(active.targets) ? active.targets : [])
      .map((row) => finite(row && row.sourceReportAt, 0))),
    finite(active.sourceReportAt, 0)
  );
  state.lastRelease = {
    at: now,
    reason,
    id: active.id,
    targetName: active.targetName,
    startedAt: active.startedAt,
    ageMs: Math.max(0, now - finite(active.startedAt, now)),
    maxSourceReportAt
  };
  publishPotionServiceChain(runtime);
  return active;
}

function inventoryOf(runtime) {
  const root = runtime && runtime.root;
  const c = root && (root.character || root.parent && root.parent.character);
  return c && Array.isArray(c.items) ? c.items : [];
}

function itemTotal(runtime, itemName) {
  return itemQuantity(inventoryOf(runtime), itemName);
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

function targetReport(input, plan) {
  const targetName = plan && plan.target && String(plan.target.name || '');
  return (Array.isArray(input && input.reports) ? input.reports : []).find((row) => row && String(row.name || '') === targetName) || null;
}

function farmerCount(report, family) {
  const supplies = report && report.supplies || {};
  return Math.max(0, Math.floor(finite(family === 'hp' ? supplies.hpPotions : supplies.mpPotions, 0)));
}

function freshSafeFarmerReports(input, planner) {
  const now = planner.now();
  return (Array.isArray(input && input.reports) ? input.reports : []).filter((row) => {
    if (!row || !row.name || String(row.ctype || '').toLowerCase() === 'merchant') return false;
    const at = finite(row.at);
    if (at == null || now - at > planner.reportTtlMs) return false;
    if (row.rip === true || row.active === false) return false;
    if (row.safety && (row.safety.emergency === true || row.safety.retreat === true)) return false;
    return true;
  });
}

function reportTarget(row) {
  return {
    name: String(row && row.name || ''),
    map: row && row.map || null,
    x: finite(row && row.x),
    y: finite(row && row.y)
  };
}

function batchDeliveriesForReport(report) {
  return [
    { family: 'hp', itemName: 'hpot0', quantity: Math.max(0, POTION_TARGET_COUNT - farmerCount(report, 'hp')) },
    { family: 'mp', itemName: 'mpot0', quantity: Math.max(0, POTION_TARGET_COUNT - farmerCount(report, 'mp')) }
  ].filter((row) => row.quantity > 0 && row.quantity <= MAX_DYNAMIC_DELIVERY);
}

function buildBatchTargets(input, planner, triggerName = null) {
  const reports = freshSafeFarmerReports(input, planner);
  const merchant = input && input.merchant || {};
  const mx = finite(merchant.x != null ? merchant.x : merchant.real_x);
  const my = finite(merchant.y != null ? merchant.y : merchant.real_y);
  const targets = reports.map((row) => {
    const deliveries = batchDeliveriesForReport(row);
    const minPotionCount = Math.min(farmerCount(row, 'hp'), farmerCount(row, 'mp'));
    const tx = finite(row.x);
    const ty = finite(row.y);
    const distance = mx != null && my != null && tx != null && ty != null ? Math.hypot(mx - tx, my - ty) : Infinity;
    return {
      name: String(row.name),
      sourceReportAt: finite(row.at),
      target: reportTarget(row),
      deliveries,
      minPotionCount,
      distance
    };
  }).filter((row) => row.deliveries.length);

  targets.sort((a, b) =>
    (String(a.name) === String(triggerName || '') ? -1 : 0) - (String(b.name) === String(triggerName || '') ? -1 : 0)
    || a.minPotionCount - b.minPotionCount
    || a.distance - b.distance
    || a.name.localeCompare(b.name)
  );
  return { reports, targets: targets.slice(0, MAX_BATCH_FARMERS) };
}

function aggregateBatchRequirements(chain) {
  const totals = new Map([['hpot0', 0], ['mpot0', 0]]);
  for (const row of Array.isArray(chain && chain.targets) ? chain.targets : []) {
    if (!row || row.status !== 'PENDING') continue;
    for (const delivery of Array.isArray(row.deliveries) ? row.deliveries : []) {
      totals.set(delivery.itemName, (totals.get(delivery.itemName) || 0) + Math.max(0, Math.floor(finite(delivery.quantity, 0))));
    }
  }
  return [...totals.entries()]
    .filter(([, requiredStock]) => requiredStock > 0)
    .map(([itemName, requiredStock]) => ({ itemName, requiredStock, merchantReserve: MERCHANT_POTION_RESERVE }));
}

function completeBatchTarget(runtime, plan, reason = 'DELIVERED') {
  const state = potionServiceChainState(runtime);
  const chain = state.active;
  if (!chain || chain.batch !== true) return releasePotionServiceChain(runtime, reason === 'DELIVERED' ? 'DELIVERY_COMMITTED' : reason, plan);
  const planChainId = plan && plan.metadata && plan.metadata.p0PotionServiceChainId;
  if (planChainId && String(planChainId) !== String(chain.id)) return null;
  const name = plan && plan.target && String(plan.target.name || '');
  const row = chain.targets.find((target) => target && target.status === 'PENDING' && String(target.name || '') === name);
  if (!row) return null;
  const now = runtime && typeof runtime.now === 'function' ? runtime.now() : Date.now();
  row.status = reason === 'DELIVERED' ? 'DELIVERED' : reason;
  row.completedAt = now;
  row.completionReason = reason;
  chain.currentTargetName = null;
  chain.targetName = null;
  chain.sourceReportAt = null;
  chain.target = null;
  chain.deliveries = [];
  if (reason === 'DELIVERED') {
    chain.deliveredCount += 1;
    state.stats.batchTargetsDelivered += 1;
  } else if (reason === 'SATISFIED_EXTERNALLY') {
    state.stats.batchTargetsSatisfiedExternally += 1;
  }
  const pending = chain.targets.filter((target) => target && target.status === 'PENDING');
  if (!pending.length) return releasePotionServiceChain(runtime, 'BATCH_DELIVERY_COMMITTED', plan);
  publishPotionServiceChain(runtime);
  return chain;
}

function dynamicBundle(input, plan) {
  const report = targetReport(input, plan);
  if (!report) return null;
  const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
  const definitions = [
    { family: 'hp', itemName: 'hpot0' },
    { family: 'mp', itemName: 'mpot0' }
  ];
  const rows = [];
  for (const def of definitions) {
    const farmerBefore = farmerCount(report, def.family);
    const farmerShortfall = Math.max(0, POTION_TARGET_COUNT - farmerBefore);
    const merchantHave = Math.max(0, Math.floor(itemQuantity(inventory, def.itemName)));
    // Request/refill each potion family independently. A healthy HP stack must
    // not be topped up just because MP crossed the low threshold (and vice versa).
    const quantity = farmerBefore < POTION_REQUEST_BELOW ? farmerShortfall : 0;
    if (quantity > MAX_DYNAMIC_DELIVERY) return null;
    rows.push({
      family: def.family,
      itemName: def.itemName,
      quantity,
      farmerBefore,
      farmerShortfall,
      merchantHave,
      buyQuantity: Math.max(0, quantity - merchantHave),
      retainedAfterDelivery: Math.max(0, merchantHave - quantity)
    });
  }
  return rows;
}

function serviceKind(input, plan) {
  if (input && input.standOpen === true) return MerchantServicePlanKind.STAND_CLOSE;
  const merchant = input && input.merchant || {};
  const target = plan && plan.target || {};
  const sameMap = merchant.map && target.map && String(merchant.map) === String(target.map);
  const mx = finite(merchant.x != null ? merchant.x : merchant.real_x);
  const my = finite(merchant.y != null ? merchant.y : merchant.real_y);
  const tx = finite(target.x);
  const ty = finite(target.y);
  const distance = sameMap && [mx, my, tx, ty].every((value) => value != null) ? Math.hypot(mx - tx, my - ty) : null;
  const nearby = sameMap && distance != null && distance <= Math.max(50, finite(input && input.deliveryDistance, 400));
  return nearby ? MerchantServicePlanKind.SERVICE_DELIVERY : MerchantServicePlanKind.SERVICE_TRAVEL;
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

function policyMetadata(plan, rows) {
  return {
    ...(plan && plan.metadata || {}),
    p0PotionBundle: true,
    p0PotionPolicy4500: true,
    adaptivePotionDelivery: true,
    bundlePolicy: 'TOP_UP_FARMER_TO_4500_WITH_DEMAND_ONLY_PURCHASE',
    farmerTarget: POTION_TARGET_COUNT,
    potionRequestBelow: POTION_REQUEST_BELOW,
    merchantReserve: MERCHANT_POTION_RESERVE,
    noPurchasedReserve: true,
    merchantExcessBlocksDelivery: false,
    retainedExistingStock: rows.filter((row) => row.retainedAfterDelivery > 0).map((row) => ({
      itemName: row.itemName,
      quantity: row.retainedAfterDelivery
    })),
    stockRequirements: rows.filter((row) => row.quantity > 0).map((row) => ({
      itemName: row.itemName,
      requiredStock: row.quantity,
      merchantReserve: MERCHANT_POTION_RESERVE,
      farmerBefore: row.farmerBefore,
      farmerShortfall: row.farmerShortfall,
      merchantHaveAtPlan: row.merchantHave,
      buyQuantity: row.buyQuantity
    }))
  };
}

function installPlannerPolicy(runtime) {
  const planner = runtime && runtime.merchantServicePlanner;
  if (!planner) return false;

  planner.merchantPotionReserve = MERCHANT_POTION_RESERVE;
  planner.lowPotionCount = POTION_LOW_WATERMARK;
  planner.criticalPotionCount = Math.min(planner.criticalPotionCount, POTION_LOW_WATERMARK);
  planner.targetPotionCount = POTION_TARGET_COUNT;
  planner.maxDeliveryQuantity = POTION_TARGET_COUNT;

  if (planner.__p0PotionPolicy4500PlannerVersion === 6 || typeof planner.plan !== 'function') return true;
  const stateAtInstall = potionServiceChainState(runtime);
  if (stateAtInstall.active && stateAtInstall.active.batch !== true) releasePotionServiceChain(runtime, 'POLICY_BATCH_UPGRADE');

  const basePlan = planner.plan.bind(planner);

  const reportFor = (input, name) => (Array.isArray(input && input.reports) ? input.reports : []).find((row) => row && String(row.name || '') === String(name || '')) || null;
  const freshSafeReportFor = (input, name) => freshSafeFarmerReports(input, planner).find((row) => String(row.name || '') === String(name || '')) || null;

  const updateTargetFromFreshReport = (chain, row, report) => {
    if (!row || !report) return false;
    const previousReportAt = row.sourceReportAt;
    row.sourceReportAt = finite(report.at, row.sourceReportAt);
    row.target = reportTarget(report);
    row.deliveries = (Array.isArray(row.deliveries) ? row.deliveries : []).map((delivery) => {
      const shortfall = Math.max(0, POTION_TARGET_COUNT - farmerCount(report, delivery.family));
      const quantity = Math.min(Math.max(0, Math.floor(finite(delivery.quantity, 0))), shortfall);
      if (quantity < Number(delivery.quantity || 0)) potionServiceChainState(runtime).stats.downwardClamps += 1;
      return { ...delivery, quantity };
    }).filter((delivery) => delivery.quantity > 0);
    if (previousReportAt !== row.sourceReportAt) potionServiceChainState(runtime).stats.freshReportRebinds += 1;
    if (!row.deliveries.length) {
      completeBatchTarget(runtime, { metadata: { p0PotionServiceChainId: chain.id }, target: { name: row.name } }, 'SATISFIED_EXTERNALLY');
      return false;
    }
    return true;
  };

  const chooseCurrentTarget = (input, base, chain) => {
    const current = chain.currentTargetName && chain.targets.find((row) => row && row.status === 'PENDING' && row.name === chain.currentTargetName);
    if (current) {
      const report = freshSafeReportFor(input, current.name);
      if (report && updateTargetFromFreshReport(chain, current, report)) return current;
      chain.currentTargetName = null;
    }

    const merchant = input && input.merchant || {};
    const mx = finite(merchant.x != null ? merchant.x : merchant.real_x);
    const my = finite(merchant.y != null ? merchant.y : merchant.real_y);
    const candidates = [];
    for (const row of chain.targets.filter((target) => target && target.status === 'PENDING')) {
      const rawReport = reportFor(input, row.name);
      if (rawReport && (rawReport.rip === true || rawReport.active === false)) {
        row.status = 'INACTIVE';
        row.completedAt = planner.now();
        row.completionReason = 'TARGET_INACTIVE';
        continue;
      }
      const report = freshSafeReportFor(input, row.name);
      if (!report || !updateTargetFromFreshReport(chain, row, report)) continue;
      const tx = finite(report.x);
      const ty = finite(report.y);
      const distance = mx != null && my != null && tx != null && ty != null ? Math.hypot(mx - tx, my - ty) : Infinity;
      const minPotionCount = Math.min(farmerCount(report, 'hp'), farmerCount(report, 'mp'));
      candidates.push({
        row,
        minPotionCount,
        criticalRank: minPotionCount < POTION_REQUEST_BELOW ? 0 : 1,
        distance,
        basePreferred: base && base.target && String(base.target.name || '') === row.name ? 0 : 1
      });
    }
    candidates.sort((a, b) => chain.deliveredCount > 0
      ? a.criticalRank - b.criticalRank
        || a.distance - b.distance
        || a.minPotionCount - b.minPotionCount
        || a.row.name.localeCompare(b.row.name)
      : a.minPotionCount - b.minPotionCount
        || a.basePreferred - b.basePreferred
        || a.distance - b.distance
        || a.row.name.localeCompare(b.row.name)
    );
    const selected = candidates[0] && candidates[0].row || null;
    if (selected) {
      if (chain.targetName && chain.targetName !== selected.name) potionServiceChainState(runtime).stats.batchTargetSwitches += 1;
      chain.currentTargetName = selected.name;
    }
    return selected;
  };

  const metadataFor = (chain, stockRequirements) => ({
    ...clone(chain.metadata || {}),
    p0PotionBundle: true,
    p0PotionPolicy4500: true,
    adaptivePotionDelivery: true,
    p0PotionBatch: true,
    p0PotionBatchId: chain.id,
    p0PotionServiceChainId: chain.id,
    p0PotionServiceChainLatched: true,
    p0PotionBatchObservedFarmers: chain.observedFarmerCount,
    p0PotionBatchTargetCount: chain.targets.length,
    p0PotionBatchPendingCount: chain.targets.filter((row) => row.status === 'PENDING').length,
    p0PotionBatchDeliveredCount: chain.deliveredCount,
    batchPolicy: 'ONE_CRITICAL_TRIGGER_TOPS_ALL_FRESH_FARMERS_TO_4500',
    batchStockRequirements: clone(stockRequirements),
    stockRequirements: clone(stockRequirements),
    farmerTarget: POTION_TARGET_COUNT,
    potionRequestBelow: POTION_REQUEST_BELOW,
    merchantReserve: MERCHANT_POTION_RESERVE,
    noPurchasedReserve: true,
    deliveryQuantityMayIncreaseWhileActive: false
  });

  const buildBatchPlan = (input, base, chain) => {
    const now = planner.now();
    if (now - finite(chain.startedAt, now) > POTION_SERVICE_CHAIN_TIMEOUT_MS) {
      releasePotionServiceChain(runtime, 'SERVICE_CHAIN_TIMEOUT');
      return null;
    }

    if (['MERCHANT_REQUIRED', 'MERCHANT_DEAD', 'MERCHANT_IN_COMBAT', 'ECONOMY_EMERGENCY', 'CONTROLLED_SUBSYSTEM_BUSY'].includes(String(base && base.reason || ''))) {
      return clone(base);
    }

    const current = chooseCurrentTarget(input, base, chain);
    const pending = chain.targets.filter((row) => row && row.status === 'PENDING');
    if (!pending.length) {
      releasePotionServiceChain(runtime, 'BATCH_TARGETS_COMPLETE');
      return null;
    }

    const stockRequirements = aggregateBatchRequirements(chain);
    const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
    const missing = stockRequirements.filter((row) => itemQuantity(inventory, row.itemName) < row.requiredStock);

    if (!current) {
      const fallback = pending[0];
      const hold = {
        ...clone(base),
        kind: MerchantServicePlanKind.HOLD,
        reason: 'POTION_BATCH_WAITING_FOR_FRESH_SAFE_FARMER_REPORT',
        target: clone(fallback && fallback.target || null),
        sourceReportAt: finite(fallback && fallback.sourceReportAt),
        deliveries: clone(fallback && fallback.deliveries || []),
        delivery: fallback && fallback.deliveries && fallback.deliveries.length ? clone(fallback.deliveries[0]) : null,
        distance: null,
        metadata: metadataFor(chain, stockRequirements)
      };
      delete hold.afterRestock;
      delete hold.afterTravel;
      delete hold.missingStock;
      planner.lastPlan = clone(hold);
      publishPotionServiceChain(runtime);
      return hold;
    }

    chain.targetName = current.name;
    chain.sourceReportAt = current.sourceReportAt;
    chain.target = clone(current.target);
    chain.deliveries = clone(current.deliveries);
    chain.refreshedAt = now;

    const readyKind = serviceKind(input, { target: current.target });
    const primaryDelivery = current.deliveries[0] || null;
    const next = {
      ...clone(base),
      target: clone(current.target),
      sourceReportAt: finite(current.sourceReportAt),
      need: {
        family: primaryDelivery && primaryDelivery.family || 'mp',
        priority: 100,
        count: primaryDelivery ? farmerCount(freshSafeReportFor(input, current.name), primaryDelivery.family) : 0,
        reason: 'CRITICAL_SUPPLY_BATCH_TOP_UP'
      },
      deliveries: clone(current.deliveries),
      delivery: clone(primaryDelivery),
      metadata: metadataFor(chain, stockRequirements)
    };

    if (missing.length) {
      next.kind = MerchantServicePlanKind.RESTOCK_REQUIRED;
      next.afterRestock = readyKind;
      next.reason = 'MERCHANT_BATCH_POTION_RESTOCK_REQUIRED';
      next.missingStock = missing.map((row) => ({
        itemName: row.itemName,
        have: itemQuantity(inventory, row.itemName),
        required: row.requiredStock,
        buyQuantity: Math.max(0, row.requiredStock - itemQuantity(inventory, row.itemName))
      }));
      next.distance = null;
    } else {
      next.kind = readyKind;
      next.reason = readyKind === MerchantServicePlanKind.SERVICE_DELIVERY
        ? 'MERCHANT_BATCH_POTION_DELIVERY_READY'
        : readyKind === MerchantServicePlanKind.SERVICE_TRAVEL
          ? 'MERCHANT_BATCH_POTION_TRAVEL_READY'
          : base.reason;
      delete next.missingStock;
      if (readyKind === MerchantServicePlanKind.SERVICE_TRAVEL) next.afterTravel = MerchantServicePlanKind.SERVICE_DELIVERY;
    }

    potionServiceChainState(runtime).stats.refreshes += 1;
    publishPotionServiceChain(runtime);
    planner.lastPlan = clone(next);
    return clone(next);
  };

  planner.plan = (input = {}) => {
    const base = basePlan(input);
    const state = potionServiceChainState(runtime);
    if (state.active && state.active.batch === true) {
      const chained = buildBatchPlan(input, base, state.active);
      if (chained) return chained;
    }

    if (!base || !(base.metadata && base.metadata.p0PotionBundle)) return base;
    const lastRelease = state.lastRelease;
    if (
      lastRelease
      && lastRelease.reason === 'BATCH_DELIVERY_COMMITTED'
      && finite(base.sourceReportAt, 0) <= finite(lastRelease.maxSourceReportAt, 0)
    ) {
      state.stats.postBatchStaleSuppressions += 1;
      const hold = {
        ...clone(base),
        kind: MerchantServicePlanKind.HOLD,
        reason: 'POTION_BATCH_WAITING_FOR_FRESH_POST_DELIVERY_TELEMETRY',
        deliveries: [],
        delivery: null,
        distance: null
      };
      delete hold.afterRestock;
      delete hold.afterTravel;
      delete hold.missingStock;
      planner.lastPlan = clone(hold);
      return hold;
    }
    const triggerName = base.target && String(base.target.name || '') || null;
    const built = buildBatchTargets(input, planner, triggerName);
    if (!built.targets.length) return base;

    const metadata = {
      ...(base.metadata || {}),
      p0PotionBundle: true,
      p0PotionPolicy4500: true,
      adaptivePotionDelivery: true,
      batchPolicy: 'ONE_CRITICAL_TRIGGER_TOPS_ALL_FRESH_FARMERS_TO_4500'
    };
    const chain = startPotionServiceBatch(runtime, planner, base, built.targets, metadata, built.reports.length);
    if (!chain) return base;
    return buildBatchPlan(input, base, chain) || base;
  };

  planner.__p0PotionPolicy4500PlannerInstalled = true;
  planner.__p0PotionPolicy4500PlannerVersion = 6;
  return true;
}

function installRestockPolicy(runtime) {
  const alpha27 = runtime && runtime.alpha27CombatMerchantConvergence;
  const merchant = alpha27 && alpha27.merchant;
  if (!merchant || typeof merchant.restockPartyPotions !== 'function') return false;

  merchant.options = merchant.options || {};
  merchant.options.merchantPotionLow = POTION_LOW_WATERMARK;
  merchant.options.merchantPotionTarget = POTION_TARGET_COUNT;
  merchant.options.merchantMaxPotionBuy = Math.max(MAX_BATCH_ITEM_STOCK, finite(merchant.options.merchantMaxPotionBuy, 0));

  if (merchant.__p0PotionPolicy4500RestockVersion === 6) return true;
  const base = merchant.restockPartyPotions.bind(merchant);
  merchant.restockPartyPotions = async () => {
    const plan = runtime.lastMerchantServicePlan;
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : [];
    if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500) || plan.kind !== MerchantServicePlanKind.RESTOCK_REQUIRED || !deliveries.length) return base();
    if (!await merchant.ensureStandClosed('PARTY_SUPPLY_ADAPTIVE_RESTOCK')) return true;

    const requirements = plan.metadata && plan.metadata.p0PotionBatch === true && Array.isArray(plan.metadata.batchStockRequirements)
      ? plan.metadata.batchStockRequirements
      : deliveries.map((row) => ({ itemName: row.itemName, requiredStock: Number(row.quantity) }));
    const needed = requirements.find((row) => itemTotal(runtime, row.itemName) < Number(row.requiredStock));
    if (!needed) return false;

    const canBuy = rawFunction(merchant.root, 'can_buy');
    let near = false;
    if (canBuy) {
      try { near = canBuy.fn.call(canBuy.owner, needed.itemName) === true; } catch (_) { near = false; }
    }
    if (!near) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'SERVICE_TRAVEL', reason: 'PARTY_SUPPLY_ADAPTIVE_VENDOR_REQUIRED', destination: needed.itemName };
      await merchant.atomic.namedServiceTravel(needed.itemName);
      return true;
    }

    const buy = rawFunction(merchant.root, 'buy');
    if (!buy) {
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'FAILED_SAFE', reason: 'BUY_API_UNAVAILABLE' };
      return true;
    }

    const c = characterOf(runtime);
    const gd = runtime.adapter && typeof runtime.adapter.getGameData === 'function' ? runtime.adapter.getGameData() || {} : {};
    const meta = gd.items && gd.items[needed.itemName];
    const price = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    const before = itemTotal(runtime, needed.itemName);
    const required = Math.max(0, Math.floor(finite(needed.requiredStock != null ? needed.requiredStock : needed.quantity, 0)));
    const deficit = Math.max(0, required - before);
    const reserveGold = Math.max(0, finite(merchant.options.goldReserve, 0));
    const affordable = price > 0 ? Math.max(0, Math.floor((finite(c && c.gold, 0) - reserveGold) / price)) : deficit;
    const quantity = Math.max(0, Math.min(deficit, affordable, merchant.options.merchantMaxPotionBuy));
    if (quantity <= 0) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'HOLD', reason: 'PARTY_SUPPLY_GOLD_RESERVE_PROTECTED', itemName: needed.itemName, have: before, requiredStock: required };
      return true;
    }

    try {
      const response = await merchant.atomic._timeout(buy.fn.call(buy.owner, needed.itemName, quantity), 'BUY_PARTY_SUPPLY_ADAPTIVE', 15000);
      if (response && response.failed === true) throw response;
      const verified = await merchant.atomic.verifyEventually(() => itemTotal(runtime, needed.itemName) >= before + quantity);
      if (!verified) throw new Error('PARTY_SUPPLY_ADAPTIVE_PURCHASE_DELTA_NOT_OBSERVED');
      merchant.stats.potionRestocks = (merchant.stats.potionRestocks || 0) + 1;
      merchant.lastMerchantAction = {
        at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'COMMITTED', itemName: needed.itemName,
        quantity, requiredStock: required, merchantReserve: MERCHANT_POTION_RESERVE
      };
      return true;
    } catch (error) {
      merchant.stats.failedSafe = (merchant.stats.failedSafe || 0) + 1;
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_ADAPTIVE', result: 'FAILED_SAFE', reason: String(error && error.message || error || 'BUY_PARTY_SUPPLY_ADAPTIVE_FAILED') };
      return true;
    }
  };
  merchant.__p0PotionPolicy4500RestockInstalled = true;
  merchant.__p0PotionPolicy4500RestockVersion = 6;
  return true;
}

function installDeliveryPolicy(runtime) {
  const service = runtime && runtime.controlledMerchantService;
  if (!service || typeof service._executeDelivery !== 'function') return false;
  if (service.__p0PotionPolicy4500DeliveryVersion === 6) return true;

  // Keep hot reload safe for runtimes that already have the v3 delivery wrapper installed.
  const baseDelivery = service._executeDelivery.bind(service);
  service._executeDelivery = async (plan) => {
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : null;
    if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500) || !deliveries) return baseDelivery(plan);

    const valid = deliveries.length >= 1 && deliveries.length <= 2 &&
      new Set(deliveries.map((row) => String(row.itemName || ''))).size === deliveries.length &&
      deliveries.every((row) => ['hpot0', 'mpot0'].includes(String(row.itemName || '')) && Number.isInteger(Number(row.quantity)) && Number(row.quantity) > 0 && Number(row.quantity) <= MAX_DYNAMIC_DELIVERY);
    if (!valid) return { executed: false, committed: false, reason: 'INVALID_ADAPTIVE_POTION_BUNDLE' };

    const targetName = plan.target && String(plan.target.name || '');
    const sourceReportAt = finite(plan.sourceReportAt);
    if (!service._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
    const target = service._visibleTarget(targetName);
    if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
    const c = service._character();
    if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
    const distance = service._distanceTo(target);
    if (distance == null || distance > service.maxDeliveryDistance) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };

    const planned = new Map(deliveries.map((row) => [String(row.itemName), Number(row.quantity)]));
    const beforeTotals = {
      hpot0: itemQuantity(service._inventorySnapshot(), 'hpot0'),
      mpot0: itemQuantity(service._inventorySnapshot(), 'mpot0')
    };
    for (const itemName of ['hpot0', 'mpot0']) {
      const required = planned.get(itemName) || 0;
      if (beforeTotals[itemName] < required) {
        return { executed: false, committed: false, reason: 'POTION_STOCK_CHANGED_REPLAN_REQUIRED', itemName, have: beforeTotals[itemName], required };
      }
    }

    const chunks = bundleChunks(service, deliveries);
    if (!chunks || !chunks.length) return { executed: false, committed: false, reason: 'POTION_BUNDLE_SOURCE_UNAVAILABLE' };
    const budget = service._rawBudget();
    if (budget.used + chunks.length > budget.max) return { executed: false, committed: false, reason: 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED' };
    const expectedAfterTotals = {
      hpot0: beforeTotals.hpot0 - (planned.get('hpot0') || 0),
      mpot0: beforeTotals.mpot0 - (planned.get('mpot0') || 0)
    };
    if (!service._startOperation(plan, {
      action: 'send_potion_bundle', targetName, sourceReportAt, deliveries: clone(deliveries), chunks: clone(chunks), beforeTotals, expectedAfterTotals
    })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };

    service._transition('EXECUTING', 'RAW_ACTION_STARTING');
    service.stats.deliveries += 1;
    try {
      for (const chunk of chunks) {
        const beforeChunkTotal = itemQuantity(service._inventorySnapshot(), chunk.itemName);
        const expectedChunkTotal = beforeChunkTotal - chunk.quantity;
        if (expectedChunkTotal < 0) throw new Error(`POTION_BUNDLE_CHUNK_WOULD_OVERDELIVER:${chunk.itemName}`);
        service.actionTimes.push(service.now());
        service.stats.rawActions += 1;
        const command = service._command('send_item', [targetName, chunk.index, chunk.quantity]);
        if (!command.executed) throw new Error(`SEND_ITEM_COMMAND_REJECTED:${command.reason || 'unknown'}`);
        const response = await service._timeout(command.value);
        if (response && response.success === false) throw new Error(`SEND_ITEM_REJECTED:${response.reason || 'unknown'}`);
        const verified = itemQuantity(service._inventorySnapshot(), chunk.itemName) <= expectedChunkTotal ||
          await service._verify(() => itemQuantity(service._inventorySnapshot(), chunk.itemName) <= expectedChunkTotal);
        if (!verified) throw new Error(`POTION_BUNDLE_DELTA_NOT_OBSERVED:${chunk.itemName}`);
      }

      service._transition('VERIFYING', 'RAW_ACTION_RETURNED');
      const matchesExpected = () => ['hpot0', 'mpot0'].every((itemName) => itemQuantity(service._inventorySnapshot(), itemName) === expectedAfterTotals[itemName]);
      const verified = matchesExpected() || await service._verify(matchesExpected);
      if (!verified) throw new Error('MERCHANT_POTION_EXPECTED_REMAINDER_NOT_REACHED');
      if (!service._markServedReport(targetName, sourceReportAt)) throw new Error('DELIVERY_DEDUPE_PERSIST_FAILED');
      const result = service._commit(plan.kind, 'ADAPTIVE_POTION_DELIVERY_DEMAND_VERIFIED', {
        targetName,
        deliveries: clone(deliveries),
        sourceReportAt,
        merchantPotionReserve: MERCHANT_POTION_RESERVE,
        expectedAfterTotals
      });
      completeBatchTarget(runtime, plan, 'DELIVERED');
      return result;
    } catch (error) {
      try { service._markServedReport(targetName, sourceReportAt); } catch (_) {}
      const result = service._failed(plan.kind, String(error && error.message || error || 'ADAPTIVE_POTION_DELIVERY_FAILED'), { targetName, deliveries: clone(deliveries), sourceReportAt });
      releasePotionServiceChain(runtime, 'DELIVERY_FAILED_AFTER_EXECUTION', plan);
      return result;
    }
  };

  service.__p0PotionPolicy4500DeliveryInstalled = true;
  service.__p0PotionPolicy4500DeliveryVersion = 6;
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
          farmerTarget: POTION_TARGET_COUNT,
          potionRequestBelow: POTION_REQUEST_BELOW,
          lowWatermark: POTION_LOW_WATERMARK,
          deliveryMode: 'critical-trigger-batched-all-farmers-top-up',
          batchOnAnyFarmerRequest: true,
          topUpAllFreshFarmersTo: POTION_TARGET_COUNT,
          maxBatchFarmers: MAX_BATCH_FARMERS,
          merchantReserve: MERCHANT_POTION_RESERVE,
          buyOnlyCurrentDeliveryDeficit: false,
          buyAggregateBatchDemandBeforeDeliveryRound: true,
          noPurchasedReserve: true,
          existingStockMayRemainForNextFarmer: true,
          successfulDeliveryVerifiesExpectedRemainder: true,
          policyOverride: P0_POTION_POLICY_4500_MODE
        }
      };
    };
    recovery.__p0PotionPolicy4500StatusInstalled = true;
  }

  const logistics = runtime && runtime.controlledPartyLogistics;
  if (logistics && logistics.config) {
    // Enforce the live logistics contract on the already-created instance too;
    // this avoids older prototype/default values surviving hot reloads.
    logistics.config.merchantReserveSlots = 0;
    logistics.config.farmerPotionLow = POTION_REQUEST_BELOW;
    logistics.config.farmerPotionTarget = POTION_TARGET_COUNT;
    logistics.config.maxSupplyBatch = POTION_TARGET_COUNT;
  }
  return true;
}

function opportunisticPotionInput(runtime) {
  const c = characterOf(runtime) || {};
  let reports = [];
  try {
    const status = runtime.partyTelemetry && typeof runtime.partyTelemetry.status === 'function'
      ? runtime.partyTelemetry.status()
      : null;
    reports = Array.isArray(status && status.reports) ? status.reports : [];
  } catch (_) {
    reports = [];
  }
  return {
    merchant: {
      name: c.name || null,
      ctype: c.ctype || null,
      map: c.map || null,
      x: finite(c.real_x != null ? c.real_x : c.x),
      y: finite(c.real_y != null ? c.real_y : c.y),
      inventory: inventoryOf(runtime)
    },
    reports,
    standOpen: !!c.stand,
    deliveryDistance: runtime.controlledMerchantService && finite(runtime.controlledMerchantService.maxDeliveryDistance, 400)
  };
}

function startOpportunisticPotionService(runtime, names = [], reason = 'PLANNED_FARMER_ROUTE') {
  const planner = runtime && runtime.merchantServicePlanner;
  if (!runtime || !planner) return { started: false, reason: 'MERCHANT_SERVICE_PLANNER_UNAVAILABLE' };
  const state = potionServiceChainState(runtime);
  if (state.active) return { started: false, reason: 'POTION_SERVICE_CHAIN_ALREADY_ACTIVE', chainId: state.active.id };

  const wanted = new Set((Array.isArray(names) ? names : [names]).map(String).filter(Boolean));
  if (!wanted.size) return { started: false, reason: 'NO_ROUTE_FARMERS' };
  const input = opportunisticPotionInput(runtime);
  const fresh = freshSafeFarmerReports(input, planner).filter((row) => wanted.has(String(row.name || '')));
  const lastReleaseAt = finite(state.lastRelease && state.lastRelease.maxSourceReportAt, 0);
  const targets = fresh
    .filter((report) => finite(report.at, 0) > lastReleaseAt)
    .map((report) => ({
      name: String(report.name),
      sourceReportAt: finite(report.at),
      target: reportTarget(report),
      deliveries: batchDeliveriesForReport(report),
      minPotionCount: Math.min(farmerCount(report, 'hp'), farmerCount(report, 'mp')),
      distance: Infinity
    }))
    .filter((row) => row.deliveries.length)
    .slice(0, MAX_BATCH_FARMERS);
  if (!targets.length) return { started: false, reason: 'ROUTE_FARMERS_ALREADY_SUPPLIED_OR_TELEMETRY_STALE' };

  const metadata = {
    p0PotionBundle: true,
    p0PotionPolicy4500: true,
    adaptivePotionDelivery: true,
    p0PotionBatch: true,
    opportunisticRouteService: true,
    routeReason: String(reason || 'PLANNED_FARMER_ROUTE'),
    batchPolicy: 'PLANNED_FARMER_ROUTE_TOPS_ROUTE_TARGETS_TO_4500'
  };
  const seedPlan = {
    target: clone(targets[0].target),
    metadata
  };
  const chain = startPotionServiceBatch(runtime, planner, seedPlan, targets, metadata, fresh.length);
  if (!chain) return { started: false, reason: 'OPPORTUNISTIC_POTION_BATCH_START_REJECTED' };
  state.stats.opportunisticRouteStarts = (state.stats.opportunisticRouteStarts || 0) + 1;
  publishPotionServiceChain(runtime);
  return {
    started: true,
    reason: 'OPPORTUNISTIC_POTION_BATCH_STARTED',
    chainId: chain.id,
    targets: targets.map((row) => ({ name: row.name, deliveries: clone(row.deliveries), sourceReportAt: row.sourceReportAt }))
  };
}

function installP0PotionPolicy4500(runtime) {
  if (!runtime) throw new Error('runtime required');
  installPlannerPolicy(runtime);
  installRestockPolicy(runtime);
  installDeliveryPolicy(runtime);
  installStatusPolicy(runtime);
  runtime.p0PotionPolicy4500 = {
    mode: P0_POTION_POLICY_4500_MODE,
    startOpportunisticService: (names, reason) => startOpportunisticPotionService(runtime, names, reason),
    farmerTarget: POTION_TARGET_COUNT,
    potionRequestBelow: POTION_REQUEST_BELOW,
    lowWatermark: POTION_LOW_WATERMARK,
    merchantPotionReserve: MERCHANT_POTION_RESERVE,
    adaptiveDelivery: true,
    batchOnAnyFarmerRequest: true,
    topUpAllFreshFarmersTo: POTION_TARGET_COUNT,
    maxBatchFarmers: MAX_BATCH_FARMERS,
    aggregatePurchaseBeforeDeliveryRound: true,
    opportunisticFarmerRouteBundling: true,
    buyOnlyCurrentDeliveryDeficit: false,
    noPurchasedReserve: true,
    existingStockMayRemainForNextFarmer: true,
    serviceChainTimeoutMs: POTION_SERVICE_CHAIN_TIMEOUT_MS,
    deliveryQuantityMayIncreaseWhileChainActive: false,
    serviceChain: null,
    serviceChainStats: null,
    lastServiceChainRelease: null,
    installed: true
  };
  publishPotionServiceChain(runtime);
  return runtime.p0PotionPolicy4500;
}

module.exports = {
  P0_POTION_POLICY_4500_MODE,
  POTION_TARGET_COUNT,
  POTION_DELIVERY_QUANTITY,
  POTION_REQUEST_BELOW,
  POTION_LOW_WATERMARK,
  MERCHANT_POTION_RESERVE,
  POTION_SERVICE_CHAIN_TIMEOUT_MS,
  installP0PotionPolicy4500
};
