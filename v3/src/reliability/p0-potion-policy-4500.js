'use strict';

const { MerchantServicePlanKind, itemQuantity } = require('../merchant/merchant-service-planner');

const P0_POTION_POLICY_4500_MODE = 'p0-potion-policy-demand-4500-v5';
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
      stats: { starts: 0, refreshes: 0, releases: 0, timeouts: 0, downwardClamps: 0, freshReportRebinds: 0, zeroSupplyPreemptions: 0 }
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

function startPotionServiceChain(runtime, planner, plan, deliveries, metadata) {
  const state = potionServiceChainState(runtime);
  const now = planner.now();
  state.sequence += 1;
  state.active = {
    id: `p0-potion-chain-${now.toString(36)}-${state.sequence.toString(36)}`,
    startedAt: now,
    refreshedAt: now,
    targetName: plan && plan.target && String(plan.target.name || '') || null,
    sourceReportAt: finite(plan && plan.sourceReportAt),
    target: clone(plan && plan.target || null),
    deliveries: clone(deliveries || []),
    metadata: clone(metadata || {})
  };
  state.stats.starts += 1;
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
  state.lastRelease = {
    at: now,
    reason,
    id: active.id,
    targetName: active.targetName,
    startedAt: active.startedAt,
    ageMs: Math.max(0, now - finite(active.startedAt, now))
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

  if (planner.__p0PotionPolicy4500PlannerVersion === 5 || typeof planner.plan !== 'function') return true;
  // Versioned wrapping is intentional: a live runtime may already carry the v4 wrapper.
  // Wrapping that existing planner once lets the liveness fix take effect without requiring a page restart.
  const basePlan = planner.plan.bind(planner);

  const targetReportFor = (input, targetName) => {
    const now = planner.now();
    return (Array.isArray(input && input.reports) ? input.reports : []).find((row) => {
      if (!row || String(row.name || '') !== String(targetName || '')) return false;
      const at = finite(row.at);
      return at != null && now - at <= planner.reportTtlMs;
    }) || null;
  };

  const shouldPreemptForZeroSupply = (input, base, chain) => {
    if (!base || !chain || !base.target || !base.need) return false;
    const nextTarget = String(base.target.name || '');
    if (!nextTarget || nextTarget === String(chain.targetName || '')) return false;
    const family = String(base.need.family || '');
    if (!['hp', 'mp'].includes(family)) return false;
    if (Number(base.need.priority || 0) < 95 || Number(base.need.count) !== 0) return false;

    // Do not churn between equally empty targets. Preemption is reserved for
    // absolute starvation (0 potions) overtaking a target that still has stock,
    // or a target whose evidence is no longer fresh.
    const activeReport = targetReportFor(input, chain.targetName);
    if (!activeReport) return true;
    const activeFamily = chain.deliveries && chain.deliveries[0] && chain.deliveries[0].family;
    const activeCount = farmerCount(activeReport, activeFamily || family);
    return activeCount > 0;
  };

  const buildChainPlan = (input, base, chain) => {
    const now = planner.now();
    if (now - finite(chain.startedAt, now) > POTION_SERVICE_CHAIN_TIMEOUT_MS) {
      releasePotionServiceChain(runtime, 'SERVICE_CHAIN_TIMEOUT');
      return null;
    }

    const report = targetReportFor(input, chain.targetName);
    if (report && (report.rip === true || report.active === false)) {
      releasePotionServiceChain(runtime, 'TARGET_INACTIVE');
      return null;
    }

    if (['MERCHANT_REQUIRED', 'MERCHANT_DEAD', 'MERCHANT_IN_COMBAT', 'ECONOMY_EMERGENCY', 'CONTROLLED_SUBSYSTEM_BUSY'].includes(String(base && base.reason || ''))) {
      return clone(base);
    }

    if (!report) {
      const hold = {
        ...clone(base),
        kind: MerchantServicePlanKind.HOLD,
        reason: 'POTION_SERVICE_CHAIN_WAITING_FOR_FRESH_TARGET_REPORT',
        target: clone(chain.target),
        sourceReportAt: chain.sourceReportAt,
        deliveries: clone(chain.deliveries),
        delivery: chain.deliveries.length ? clone(chain.deliveries[0]) : null,
        distance: null,
        metadata: {
          ...clone(chain.metadata || {}),
          p0PotionServiceChainId: chain.id,
          p0PotionServiceChainLatched: true,
          deliveryQuantityMayIncreaseWhileActive: false
        }
      };
      delete hold.afterRestock;
      delete hold.afterTravel;
      delete hold.missingStock;
      planner.lastPlan = clone(hold);
      return hold;
    }

    if (report.safety && (report.safety.emergency === true || report.safety.retreat === true)) {
      const hold = {
        ...clone(base),
        kind: MerchantServicePlanKind.HOLD,
        reason: 'POTION_SERVICE_CHAIN_TARGET_UNSAFE',
        target: clone(chain.target),
        sourceReportAt: chain.sourceReportAt,
        deliveries: clone(chain.deliveries),
        delivery: chain.deliveries.length ? clone(chain.deliveries[0]) : null,
        distance: null,
        metadata: {
          ...clone(chain.metadata || {}),
          p0PotionServiceChainId: chain.id,
          p0PotionServiceChainLatched: true,
          deliveryQuantityMayIncreaseWhileActive: false
        }
      };
      delete hold.afterRestock;
      delete hold.afterTravel;
      delete hold.missingStock;
      planner.lastPlan = clone(hold);
      return hold;
    }

    const freshSourceReportAt = finite(report.at, chain.sourceReportAt);
    const target = {
      ...clone(chain.target || {}),
      name: chain.targetName,
      map: report.map || chain.target && chain.target.map || null,
      x: finite(report.x, finite(chain.target && chain.target.x)),
      y: finite(report.y, finite(chain.target && chain.target.y))
    };
    const deliveries = [];
    for (const row of chain.deliveries || []) {
      const currentShortfall = Math.max(0, POTION_TARGET_COUNT - farmerCount(report, row.family));
      const quantity = Math.min(Math.max(0, Math.floor(finite(row.quantity, 0))), currentShortfall);
      if (quantity < Number(row.quantity || 0)) potionServiceChainState(runtime).stats.downwardClamps += 1;
      if (quantity > 0) deliveries.push({ family: row.family, itemName: row.itemName, quantity });
    }

    if (!deliveries.length) {
      releasePotionServiceChain(runtime, 'TARGET_ALREADY_SATISFIED');
      return null;
    }

    const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
    const stock = Object.fromEntries(deliveries.map((row) => [row.itemName, itemQuantity(inventory, row.itemName)]));
    const missing = deliveries.filter((row) => stock[row.itemName] < row.quantity);
    const readyKind = serviceKind(input, { target });
    const metadata = {
      ...clone(chain.metadata || {}),
      p0PotionServiceChainId: chain.id,
      p0PotionServiceChainLatched: true,
      deliveryQuantityMayIncreaseWhileActive: false,
      originalDeliveries: clone(chain.deliveries)
    };
    const next = {
      ...clone(base),
      target,
      // Bind travel/delivery authority to the fresh report that supplied the
      // current coordinates, not to the first report that started the chain.
      sourceReportAt: freshSourceReportAt,
      deliveries: clone(deliveries),
      delivery: clone(deliveries[0]),
      metadata
    };

    if (missing.length) {
      next.kind = MerchantServicePlanKind.RESTOCK_REQUIRED;
      next.afterRestock = readyKind;
      next.reason = 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED';
      next.missingStock = missing.map((row) => ({
        itemName: row.itemName,
        have: stock[row.itemName],
        required: row.quantity,
        buyQuantity: Math.max(0, row.quantity - stock[row.itemName])
      }));
      next.distance = null;
    } else {
      next.kind = readyKind;
      next.reason = readyKind === MerchantServicePlanKind.SERVICE_DELIVERY
        ? 'MERCHANT_ADAPTIVE_POTION_DELIVERY_READY'
        : readyKind === MerchantServicePlanKind.SERVICE_TRAVEL
          ? 'MERCHANT_ADAPTIVE_POTION_TRAVEL_READY'
          : base.reason;
      delete next.missingStock;
    }

    chain.refreshedAt = now;
    chain.target = clone(target);
    if (freshSourceReportAt != null && freshSourceReportAt !== chain.sourceReportAt) {
      chain.sourceReportAt = freshSourceReportAt;
      potionServiceChainState(runtime).stats.freshReportRebinds += 1;
    }
    potionServiceChainState(runtime).stats.refreshes += 1;
    publishPotionServiceChain(runtime);
    planner.lastPlan = clone(next);
    return clone(next);
  };

  planner.plan = (input = {}) => {
    const plan = basePlan(input);
    const state = potionServiceChainState(runtime);
    if (state.active && shouldPreemptForZeroSupply(input, plan, state.active)) {
      releasePotionServiceChain(runtime, 'ZERO_POTION_TARGET_PREEMPT');
      state.stats.zeroSupplyPreemptions += 1;
      publishPotionServiceChain(runtime);
    }
    if (state.active) {
      const chained = buildChainPlan(input, plan, state.active);
      if (chained) return chained;
    }

    if (!plan || !(plan.metadata && plan.metadata.p0PotionBundle)) return plan;

    const rows = dynamicBundle(input, plan);
    if (!rows) return plan;
    const deliveries = rows.filter((row) => row.quantity > 0);
    const metadata = policyMetadata(plan, rows);

    if (!deliveries.length) {
      const hold = {
        ...clone(plan),
        kind: MerchantServicePlanKind.HOLD,
        reason: 'FARMER_POTION_TARGET_SATISFIED',
        deliveries: [],
        delivery: null,
        distance: null,
        metadata
      };
      delete hold.afterRestock;
      delete hold.afterTravel;
      delete hold.missingStock;
      planner.lastPlan = clone(hold);
      return clone(hold);
    }

    const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
    const stock = Object.fromEntries(deliveries.map((row) => [row.itemName, itemQuantity(inventory, row.itemName)]));
    const missing = deliveries.filter((row) => stock[row.itemName] < row.quantity);
    const readyKind = serviceKind(input, plan);
    const next = {
      ...clone(plan),
      deliveries: deliveries.map((row) => ({ family: row.family, itemName: row.itemName, quantity: row.quantity })),
      delivery: { family: deliveries[0].family, itemName: deliveries[0].itemName, quantity: deliveries[0].quantity },
      metadata
    };

    if (missing.length) {
      next.kind = MerchantServicePlanKind.RESTOCK_REQUIRED;
      next.afterRestock = readyKind;
      next.reason = 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED';
      next.missingStock = missing.map((row) => ({
        itemName: row.itemName,
        have: stock[row.itemName],
        required: row.quantity,
        buyQuantity: Math.max(0, row.quantity - stock[row.itemName])
      }));
      next.distance = null;
    } else {
      next.kind = readyKind;
      next.reason = readyKind === MerchantServicePlanKind.SERVICE_DELIVERY
        ? 'MERCHANT_ADAPTIVE_POTION_DELIVERY_READY'
        : readyKind === MerchantServicePlanKind.SERVICE_TRAVEL
          ? 'MERCHANT_ADAPTIVE_POTION_TRAVEL_READY'
          : plan.reason;
      delete next.missingStock;
    }

    if ([MerchantServicePlanKind.RESTOCK_REQUIRED, MerchantServicePlanKind.SERVICE_TRAVEL, MerchantServicePlanKind.SERVICE_DELIVERY].includes(next.kind)) {
      const chain = startPotionServiceChain(runtime, planner, next, next.deliveries, metadata);
      next.metadata = {
        ...metadata,
        p0PotionServiceChainId: chain.id,
        p0PotionServiceChainLatched: true,
        deliveryQuantityMayIncreaseWhileActive: false,
        originalDeliveries: clone(chain.deliveries)
      };
    }

    planner.lastPlan = clone(next);
    return clone(next);
  };
  planner.__p0PotionPolicy4500PlannerInstalled = true;
  planner.__p0PotionPolicy4500PlannerVersion = 5;
  return true;
}

function installRestockPolicy(runtime) {
  const alpha27 = runtime && runtime.alpha27CombatMerchantConvergence;
  const merchant = alpha27 && alpha27.merchant;
  if (!merchant || typeof merchant.restockPartyPotions !== 'function') return false;

  merchant.options = merchant.options || {};
  merchant.options.merchantPotionLow = POTION_LOW_WATERMARK;
  merchant.options.merchantPotionTarget = POTION_TARGET_COUNT;
  merchant.options.merchantMaxPotionBuy = Math.max(POTION_TARGET_COUNT, finite(merchant.options.merchantMaxPotionBuy, 0));

  if (merchant.__p0PotionPolicy4500RestockInstalled) return true;
  const base = merchant.restockPartyPotions.bind(merchant);
  merchant.restockPartyPotions = async () => {
    const plan = runtime.lastMerchantServicePlan;
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : [];
    if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500) || plan.kind !== MerchantServicePlanKind.RESTOCK_REQUIRED || !deliveries.length) return base();
    if (!await merchant.ensureStandClosed('PARTY_SUPPLY_ADAPTIVE_RESTOCK')) return true;

    const needed = deliveries.find((row) => itemTotal(runtime, row.itemName) < Number(row.quantity));
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
    const required = Math.max(0, Math.floor(finite(needed.quantity, 0)));
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
  return true;
}

function installDeliveryPolicy(runtime) {
  const service = runtime && runtime.controlledMerchantService;
  if (!service || typeof service._executeDelivery !== 'function') return false;
  if (service.__p0PotionPolicy4500DeliveryVersion === 4) return true;

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
      releasePotionServiceChain(runtime, 'DELIVERY_COMMITTED', plan);
      return result;
    } catch (error) {
      try { service._markServedReport(targetName, sourceReportAt); } catch (_) {}
      const result = service._failed(plan.kind, String(error && error.message || error || 'ADAPTIVE_POTION_DELIVERY_FAILED'), { targetName, deliveries: clone(deliveries), sourceReportAt });
      releasePotionServiceChain(runtime, 'DELIVERY_FAILED_AFTER_EXECUTION', plan);
      return result;
    }
  };

  service.__p0PotionPolicy4500DeliveryInstalled = true;
  service.__p0PotionPolicy4500DeliveryVersion = 5;
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
          deliveryMode: 'adaptive-demand-top-up',
          merchantReserve: MERCHANT_POTION_RESERVE,
          buyOnlyCurrentDeliveryDeficit: true,
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

function installP0PotionPolicy4500(runtime) {
  if (!runtime) throw new Error('runtime required');
  installPlannerPolicy(runtime);
  installRestockPolicy(runtime);
  installDeliveryPolicy(runtime);
  installStatusPolicy(runtime);
  runtime.p0PotionPolicy4500 = {
    mode: P0_POTION_POLICY_4500_MODE,
    farmerTarget: POTION_TARGET_COUNT,
    potionRequestBelow: POTION_REQUEST_BELOW,
    lowWatermark: POTION_LOW_WATERMARK,
    merchantPotionReserve: MERCHANT_POTION_RESERVE,
    adaptiveDelivery: true,
    buyOnlyCurrentDeliveryDeficit: true,
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
