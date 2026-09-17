'use strict';

const { MerchantServicePlanKind, itemQuantity } = require('../merchant/merchant-service-planner');

const P0_REGROUP_SUPPLY_RECOVERY_MODE = 'p0-regroup-supply-recovery-v1';
const POTION_DELIVERY_QUANTITY = 5000;
const POTION_LOW_WATERMARK = 5000;
const RECOVERY_SUPERVISOR_STATES = new Set(['DEGRADED', 'SAFE_MODE']);
const RECOVERY_REASON_ALLOWLIST = new Set([
  'NO_PROGRESS_WATCH',
  'NO_PROGRESS_DEGRADED',
  'NO_PROGRESS_SAFE_MODE',
  'EXPECTED_ACTIVITY_NO_PROGRESS',
  'CONTENT_REVALIDATION_REQUIRED'
]);

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function characterOf(runtime) {
  return runtime && runtime.lastSnapshot && runtime.lastSnapshot.character
    || runtime && runtime.root && (runtime.root.character || runtime.root.parent && runtime.root.parent.character)
    || null;
}

function inventoryOf(runtime) {
  const c = runtime && runtime.root && (runtime.root.character || runtime.root.parent && runtime.root.parent.character);
  return c && Array.isArray(c.items) ? c.items : [];
}

function identityQuantity(runtime, name) {
  return inventoryOf(runtime).reduce((sum, item) => {
    if (!item || String(item.name || '') !== String(name || '')) return sum;
    return sum + Math.max(1, finite(item.q, 1));
  }, 0);
}

function rawFunction(root, name) {
  if (root && typeof root[name] === 'function') return { fn: root[name], owner: root };
  const parent = root && root.parent;
  if (parent && typeof parent[name] === 'function') return { fn: parent[name], owner: parent };
  return null;
}

function safeSupervisorStatus(runtime) {
  try {
    return runtime && runtime.globalSupervisor && typeof runtime.globalSupervisor.status === 'function'
      ? runtime.globalSupervisor.status()
      : null;
  } catch (_) { return null; }
}

function reportFor(runtime, name) {
  try {
    const status = runtime && runtime.partyTelemetry && typeof runtime.partyTelemetry.status === 'function'
      ? runtime.partyTelemetry.status()
      : null;
    return Array.isArray(status && status.reports)
      ? status.reports.find((row) => row && String(row.name || '') === String(name || '')) || null
      : null;
  } catch (_) { return null; }
}

function freshReport(runtime, name, ttlMs) {
  const report = reportFor(runtime, name);
  if (!report) return null;
  const at = finite(report.at);
  const now = runtime && typeof runtime.now === 'function' ? runtime.now() : Date.now();
  if (at == null || at <= 0 || Math.abs(now - at) > Math.max(1000, finite(ttlMs, 25000))) return null;
  return report;
}

function potionBundle(reserve = 0) {
  const merchantReserve = Math.max(0, Math.floor(finite(reserve, 0)));
  return [
    { family: 'hp', itemName: 'hpot0', quantity: POTION_DELIVERY_QUANTITY, requiredStock: POTION_DELIVERY_QUANTITY + merchantReserve },
    { family: 'mp', itemName: 'mpot0', quantity: POTION_DELIVERY_QUANTITY, requiredStock: POTION_DELIVERY_QUANTITY + merchantReserve }
  ];
}

function isPotionServicePlan(plan) {
  if (!plan || !plan.need) return false;
  return ['hp', 'mp'].includes(String(plan.need.family || '')) || /POTIONS_(LOW|CRITICAL)/.test(String(plan.reason || ''));
}

function localFarmer(runtime) {
  const c = characterOf(runtime);
  return !!(c && String(c.ctype || c.type || '').toLowerCase() !== 'merchant');
}

function installBootstrapProgressGuard(runtime, stats) {
  const supervisor = runtime && runtime.globalSupervisor;
  if (!supervisor || supervisor.__p0BootstrapProgressGuard || typeof supervisor._activeWork !== 'function') return false;
  const base = supervisor._activeWork.bind(supervisor);
  supervisor._activeWork = (status) => {
    if (localFarmer(runtime)) {
      let bootstrap = null;
      try { bootstrap = runtime.partyBootstrap && typeof runtime.partyBootstrap.status === 'function' ? runtime.partyBootstrap.status() : null; } catch (_) {}
      if (bootstrap && bootstrap.active === true && bootstrap.ready !== true) {
        stats.bootstrapNoProgressSuppressions += 1;
        return false;
      }
    }
    return base(status);
  };
  supervisor.__p0BootstrapProgressGuard = true;
  return true;
}

function recoverySupervisorAllowed(runtime) {
  const status = safeSupervisorStatus(runtime);
  if (!status || !RECOVERY_SUPERVISOR_STATES.has(String(status.state || ''))) return false;
  const reasons = Array.isArray(status.reasons) ? status.reasons.map(String) : [];
  return reasons.length > 0 && reasons.every((reason) => RECOVERY_REASON_ALLOWLIST.has(reason));
}

function validatedMapSplit(crossMap) {
  try {
    const snapshot = crossMap.runtime.lastSnapshot;
    const team = snapshot && crossMap._team(snapshot);
    if (!team || !team.complete || !team.alive || !team.positionsKnown || team.sameMap) return null;
    return { snapshot, team, isLeader: team.selfName === team.leaderName };
  } catch (_) { return null; }
}

function installCrossMapRecoveryAuthority(runtime, stats) {
  const alpha28 = runtime && runtime.alpha28LiveAuthorityLiveness;
  const crossMap = alpha28 && alpha28.crossMap;
  if (!crossMap) return false;

  if (!crossMap.__p0ReceiverFallbackInstalled) {
    const baseTransport = typeof crossMap._transport === 'function' ? crossMap._transport.bind(crossMap) : null;
    crossMap._transport = () => {
      let transport = null;
      try { transport = baseTransport ? baseTransport() : null; } catch (_) {}
      if (transport) return transport;
      const candidates = [
        runtime.partyAccountCommunication && runtime.partyAccountCommunication.transport,
        runtime.partyBootstrap && runtime.partyBootstrap.transport,
        runtime.controlledPartyLogistics && runtime.controlledPartyLogistics.transport
      ];
      return candidates.find((row) => row && typeof row.installDirectReceiver === 'function' && typeof row.send === 'function') || null;
    };
    crossMap.__p0ReceiverFallbackInstalled = true;
  }

  try {
    if (!crossMap.receiverInstalled && typeof crossMap._ensureReceiver === 'function' && crossMap._ensureReceiver()) stats.receiverRepairs += 1;
  } catch (_) {}

  if (crossMap.__p0RecoveryTickInstalled || typeof crossMap.tick !== 'function') return true;
  const baseTick = crossMap.tick.bind(crossMap);
  crossMap.tick = () => {
    crossMap.__p0LastTickAt = typeof crossMap.now === 'function' ? crossMap.now() : Date.now();
    try {
      if (!crossMap.receiverInstalled && typeof crossMap._ensureReceiver === 'function' && crossMap._ensureReceiver()) stats.receiverRepairs += 1;
    } catch (_) {}

    const normalAllowed = (() => {
      try { return typeof crossMap._supervisorAllowed === 'function' && crossMap._supervisorAllowed(); } catch (_) { return false; }
    })();
    if (normalAllowed) return baseTick();
    if (crossMap.busy || !localFarmer(runtime) || !recoverySupervisorAllowed(runtime)) return false;

    const split = validatedMapSplit(crossMap);
    if (!split) return false;
    const { snapshot, team, isLeader } = split;
    try { if (typeof crossMap._inCombat === 'function' && crossMap._inCombat(snapshot)) return false; } catch (_) { return false; }

    if (isLeader) {
      const objective = typeof crossMap._makeRegroupObjective === 'function' ? crossMap._makeRegroupObjective(snapshot, team) : null;
      if (!objective) return false;
      if (typeof crossMap._publishRegroup === 'function') crossMap._publishRegroup(team, objective);
      crossMap.lastAction = {
        at: crossMap.now(),
        result: 'PUBLISHED',
        reason: 'NO_PROGRESS_RECOVERY_TEAM_REGROUP',
        objectiveId: objective.id,
        objectiveKind: 'TEAM_REGROUP',
        map: objective.map
      };
      stats.recoveryRegroupPublishes += 1;
      if (typeof crossMap.event === 'function') crossMap.event('ALPHA28_TEAM_REGROUP_RECOVERY_AUTHORIZED', 'warn', 'VERIFIED_MAP_SPLIT_NO_PROGRESS_RECOVERY', { objectiveId: objective.id, map: objective.map });
      return true;
    }

    const objective = typeof crossMap._sharedObjective === 'function' ? crossMap._sharedObjective(team) : null;
    if (!objective || String(objective.kind || '') !== 'TEAM_REGROUP' || String(objective.map || '') === String(snapshot.character && snapshot.character.map || '')) return false;
    if (crossMap.lastAction && crossMap.lastAction.objectiveId === objective.id && ['COMPLETED', 'FAILED_SAFE'].includes(crossMap.lastAction.result)) return false;
    stats.recoveryRegroupTravels += 1;
    Promise.resolve(crossMap._execute(objective, snapshot)).catch((error) => {
      if (crossMap.stats) {
        crossMap.stats.crossMapTravelFailedSafe = (crossMap.stats.crossMapTravelFailedSafe || 0) + 1;
        crossMap.stats.crossMapRegroupTravelFailedSafe = (crossMap.stats.crossMapRegroupTravelFailedSafe || 0) + 1;
      }
      crossMap.lastAction = { at: crossMap.now(), result: 'FAILED_SAFE', reason: String(error && error.message || error).slice(0, 220), objectiveId: objective.id, objectiveKind: 'TEAM_REGROUP' };
    });
    return true;
  };
  crossMap.__p0RecoveryTickInstalled = true;
  return true;
}

function installPlannerBundlePolicy(runtime, stats) {
  const planner = runtime && runtime.merchantServicePlanner;
  if (!planner || planner.__p0BundlePolicyInstalled || typeof planner.plan !== 'function') return false;
  planner.lowPotionCount = Math.max(planner.lowPotionCount || 0, POTION_LOW_WATERMARK);
  planner.criticalPotionCount = Math.max(planner.criticalPotionCount || 0, Math.min(1000, POTION_LOW_WATERMARK));
  planner.targetPotionCount = POTION_DELIVERY_QUANTITY;
  planner.maxDeliveryQuantity = POTION_DELIVERY_QUANTITY;
  const basePlan = planner.plan.bind(planner);
  planner.plan = (input = {}) => {
    const plan = basePlan(input);
    if (!isPotionServicePlan(plan)) return plan;
    const reserve = Math.max(0, Math.floor(finite(planner.merchantPotionReserve, 0)));
    const bundle = potionBundle(reserve);
    const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
    const stock = Object.fromEntries(bundle.map((row) => [row.itemName, itemQuantity(inventory, row.itemName)]));
    const missing = bundle.filter((row) => finite(stock[row.itemName], 0) < row.requiredStock);
    const next = {
      ...clone(plan),
      reason: missing.length ? 'MERCHANT_POTION_BUNDLE_RESTOCK_REQUIRED' : plan.reason,
      deliveries: bundle.map((row) => ({ family: row.family, itemName: row.itemName, quantity: row.quantity })),
      delivery: bundle[0],
      metadata: {
        ...(plan.metadata || {}),
        p0PotionBundle: true,
        bundlePolicy: 'EXACT_5000_HP_AND_5000_MP_PER_FARMER_DELIVERY',
        stockRequirements: bundle.map((row) => ({ itemName: row.itemName, requiredStock: row.requiredStock, merchantReserve: reserve }))
      }
    };
    if (missing.length) {
      next.kind = MerchantServicePlanKind.RESTOCK_REQUIRED;
      next.afterRestock = plan.kind;
      next.missingStock = missing.map((row) => ({ itemName: row.itemName, have: stock[row.itemName], required: row.requiredStock }));
      next.distance = null;
      stats.bundleRestockPlans += 1;
    } else if ([MerchantServicePlanKind.SERVICE_TRAVEL, MerchantServicePlanKind.SERVICE_DELIVERY].includes(next.kind)) {
      stats.bundleDeliveryPlans += 1;
    }
    planner.lastPlan = clone(next);
    return clone(next);
  };
  planner.__p0BundlePolicyInstalled = true;
  return true;
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

function installBundleExecutor(runtime, stats) {
  const service = runtime && runtime.controlledMerchantService;
  if (!service || service.__p0BundleExecutorInstalled || typeof service._executeDelivery !== 'function') return false;
  const baseDelivery = service._executeDelivery.bind(service);
  const basePreflight = typeof service._preflight === 'function' ? service._preflight.bind(service) : null;
  const baseReconcile = typeof service.reconcile === 'function' ? service.reconcile.bind(service) : null;

  if (basePreflight) {
    service._preflight = (plan) => {
      const gear = !!(plan && plan.metadata && plan.metadata.alpha27GearGoal);
      if (!gear) return basePreflight(plan);
      const name = plan && plan.target && String(plan.target.name || '');
      const previous = name ? service.servedReports.get(name) : null;
      if (name) service.servedReports.delete(name);
      try { return basePreflight(plan); }
      finally { if (name && previous != null) service.servedReports.set(name, previous); }
    };
  }

  service._executeDelivery = async (plan) => {
    const deliveries = Array.isArray(plan && plan.deliveries) ? plan.deliveries : null;
    if (!plan || !plan.metadata || plan.metadata.p0PotionBundle !== true || !deliveries || deliveries.length !== 2) return baseDelivery(plan);
    const targetName = plan.target && String(plan.target.name || '');
    const sourceReportAt = finite(plan.sourceReportAt);
    if (!service._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
    if (!deliveries.every((row) => ['hpot0', 'mpot0'].includes(String(row.itemName || '')) && Number(row.quantity) === POTION_DELIVERY_QUANTITY)) return { executed: false, committed: false, reason: 'INVALID_POTION_BUNDLE' };
    const target = service._visibleTarget(targetName);
    if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
    const c = service._character();
    if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
    const distance = service._distanceTo(target);
    if (distance == null || distance > service.maxDeliveryDistance) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };

    const reserve = Math.max(0, Math.floor(finite(runtime.merchantServicePlanner && runtime.merchantServicePlanner.merchantPotionReserve, 0)));
    for (const row of deliveries) {
      const have = itemQuantity(service._inventorySnapshot(), row.itemName);
      if (have < POTION_DELIVERY_QUANTITY + reserve) return { executed: false, committed: false, reason: 'POTION_BUNDLE_STOCK_INCOMPLETE', itemName: row.itemName, have, required: POTION_DELIVERY_QUANTITY + reserve };
    }
    const chunks = bundleChunks(service, deliveries);
    if (!chunks || !chunks.length) return { executed: false, committed: false, reason: 'POTION_BUNDLE_SOURCE_UNAVAILABLE' };
    const budget = service._rawBudget();
    if (budget.used + chunks.length > budget.max) return { executed: false, committed: false, reason: 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED' };
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
        service.actionTimes.push(service.now());
        service.stats.rawActions += 1;
        const command = service._command('send_item', [targetName, chunk.index, chunk.quantity]);
        if (!command.executed) throw new Error(`SEND_ITEM_COMMAND_REJECTED:${command.reason || 'unknown'}`);
        const response = await service._timeout(command.value);
        if (response && response.success === false) throw new Error(`SEND_ITEM_REJECTED:${response.reason || 'unknown'}`);
        const expected = itemQuantity(service._inventorySnapshot(), chunk.itemName);
        if (expected > expectedAfterTotals[chunk.itemName] && !await service._verify(() => itemQuantity(service._inventorySnapshot(), chunk.itemName) <= expected - chunk.quantity)) {
          throw new Error(`POTION_BUNDLE_DELTA_NOT_OBSERVED:${chunk.itemName}`);
        }
      }
      service._transition('VERIFYING', 'RAW_ACTION_RETURNED');
      const verified = await service._verify(() => deliveries.every((row) => itemQuantity(service._inventorySnapshot(), row.itemName) === expectedAfterTotals[row.itemName]));
      if (!verified) throw new Error('POTION_BUNDLE_FINAL_DELTA_VERIFICATION_FAILED');
      if (!service._markServedReport(targetName, sourceReportAt)) throw new Error('DELIVERY_DEDUPE_PERSIST_FAILED');
      stats.bundleDeliveriesCommitted += 1;
      return service._commit(plan.kind, 'POTION_BUNDLE_DELIVERY_LOCAL_DELTA_VERIFIED', { targetName, deliveries: clone(deliveries), sourceReportAt });
    } catch (error) {
      // A partially applied two-item delivery is intentionally never blindly replayed
      // against the same telemetry snapshot. Fresh farmer telemetry is required.
      try { service._markServedReport(targetName, sourceReportAt); } catch (_) {}
      stats.bundleDeliveriesFailedSafe += 1;
      return service._failed(plan.kind, String(error && error.message || error || 'POTION_BUNDLE_DELIVERY_FAILED'), { targetName, deliveries: clone(deliveries), sourceReportAt });
    }
  };

  if (baseReconcile) {
    service.reconcile = () => {
      const op = service.activeOperation;
      if (!op || op.action !== 'send_potion_bundle' || op.state !== 'RECOVERING') return baseReconcile();
      const committed = Object.entries(op.expectedAfterTotals || {}).every(([name, quantity]) => itemQuantity(service._inventorySnapshot(), name) === Number(quantity));
      if (committed) {
        if (!service._markServedReport(op.targetName, op.sourceReportAt)) {
          service._transition('FAILED_SAFE', 'RESTART_BUNDLE_DEDUPE_PERSIST_FAILED_NO_RETRY');
          service.stats.failedSafe += 1;
          return { reconciled: true, committed: false, reason: 'RESTART_BUNDLE_DEDUPE_PERSIST_FAILED_NO_RETRY' };
        }
        service._transition('COMMITTED', 'RESTART_POTION_BUNDLE_RECONCILIATION_VERIFIED');
        service.stats.recovered += 1;
        service.stats.committed += 1;
        stats.bundleDeliveriesCommitted += 1;
        return { reconciled: true, committed: true, reason: 'RESTART_POTION_BUNDLE_RECONCILIATION_VERIFIED' };
      }
      try { service._markServedReport(op.targetName, op.sourceReportAt); } catch (_) {}
      service._transition('FAILED_SAFE', 'RESTART_POTION_BUNDLE_OUTCOME_UNCERTAIN_NO_RETRY');
      service.stats.failedSafe += 1;
      return { reconciled: true, committed: false, reason: 'RESTART_POTION_BUNDLE_OUTCOME_UNCERTAIN_NO_RETRY' };
    };
  }

  service.__p0BundleExecutorInstalled = true;
  return true;
}

function installBundleRestock(runtime, stats) {
  const alpha27 = runtime && runtime.alpha27CombatMerchantConvergence;
  const merchant = alpha27 && alpha27.merchant;
  if (!merchant || merchant.__p0BundleRestockInstalled || typeof merchant.restockPartyPotions !== 'function') return false;
  merchant.options.merchantPotionLow = Math.max(POTION_LOW_WATERMARK, finite(merchant.options.merchantPotionLow, 0));
  merchant.options.merchantPotionTarget = Math.max(POTION_DELIVERY_QUANTITY, finite(merchant.options.merchantPotionTarget, 0));
  merchant.options.merchantMaxPotionBuy = Math.max(10000, finite(merchant.options.merchantMaxPotionBuy, 0));

  const base = merchant.restockPartyPotions.bind(merchant);
  merchant.restockPartyPotions = async () => {
    const plan = runtime.lastMerchantServicePlan;
    if (!plan || plan.kind !== MerchantServicePlanKind.RESTOCK_REQUIRED || !(plan.metadata && plan.metadata.p0PotionBundle)) return base();
    if (!await merchant.ensureStandClosed('PARTY_SUPPLY_BUNDLE_RESTOCK')) return true;
    const reserve = Math.max(0, Math.floor(finite(runtime.merchantServicePlanner && runtime.merchantServicePlanner.merchantPotionReserve, 0)));
    const requirements = potionBundle(reserve);
    const needed = requirements.find((row) => identityQuantity(runtime, row.itemName) < row.requiredStock);
    if (!needed) return false;

    const canBuy = rawFunction(merchant.root, 'can_buy');
    let near = false;
    if (canBuy) {
      try { near = canBuy.fn.call(canBuy.owner, needed.itemName) === true; } catch (_) { near = false; }
    }
    if (!near) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'SERVICE_TRAVEL', reason: 'PARTY_SUPPLY_BUNDLE_VENDOR_REQUIRED', destination: needed.itemName };
      await merchant.atomic.namedServiceTravel(needed.itemName);
      return true;
    }

    const buy = rawFunction(merchant.root, 'buy');
    if (!buy) {
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_BUNDLE', result: 'FAILED_SAFE', reason: 'BUY_API_UNAVAILABLE' };
      return true;
    }
    const c = characterOf(runtime);
    const gd = runtime.adapter && typeof runtime.adapter.getGameData === 'function' ? runtime.adapter.getGameData() || {} : {};
    const meta = gd.items && gd.items[needed.itemName];
    const price = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    const before = identityQuantity(runtime, needed.itemName);
    const deficit = Math.max(0, needed.requiredStock - before);
    const affordable = price > 0 ? Math.max(0, Math.floor((finite(c && c.gold, 0) - merchant.options.goldReserve) / price)) : deficit;
    const quantity = Math.max(0, Math.min(deficit, affordable, merchant.options.merchantMaxPotionBuy));
    if (quantity <= 0) {
      merchant.lastMerchantPlan = { at: merchant.now(), action: 'HOLD', reason: 'PARTY_SUPPLY_GOLD_RESERVE_PROTECTED', itemName: needed.itemName, have: before, requiredStock: needed.requiredStock };
      return true;
    }

    try {
      const response = await merchant.atomic._timeout(buy.fn.call(buy.owner, needed.itemName, quantity), 'BUY_PARTY_SUPPLY_BUNDLE', 15000);
      if (response && response.failed === true) throw response;
      const verified = await merchant.atomic.verifyEventually(() => identityQuantity(runtime, needed.itemName) >= before + quantity);
      if (!verified) throw new Error('PARTY_SUPPLY_BUNDLE_PURCHASE_DELTA_NOT_OBSERVED');
      merchant.stats.potionRestocks += 1;
      stats.bundlePotionPurchases += 1;
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_BUNDLE', result: 'COMMITTED', itemName: needed.itemName, quantity, requiredStock: needed.requiredStock };
      return true;
    } catch (error) {
      merchant.stats.failedSafe += 1;
      merchant.lastMerchantAction = { at: merchant.now(), type: 'BUY_SUPPLY_BUNDLE', result: 'FAILED_SAFE', reason: String(error && error.message || error || 'BUY_PARTY_SUPPLY_BUNDLE_FAILED') };
      return true;
    }
  };
  merchant.__p0BundleRestockInstalled = true;
  return true;
}

function installGearTravelAttestation(runtime, stats) {
  if (!runtime || runtime.__p0GearTravelAttestationInstalled || typeof runtime.planTravel !== 'function') return false;
  const base = runtime.planTravel.bind(runtime);
  runtime.planTravel = (request = {}, context = {}) => {
    if (!context.destinationMapAttestation && request && request.metadata && request.metadata.source === 'ALPHA27_GEAR_DELIVERY') {
      const targetName = request.metadata.targetName;
      const ttl = Math.max(1000, finite(runtime.merchantServicePlanner && runtime.merchantServicePlanner.reportTtlMs, 25000));
      const report = freshReport(runtime, targetName, ttl);
      const destination = request.destination || {};
      const sameMap = report && report.map && destination.map && String(report.map) === String(destination.map);
      const rx = finite(report && report.x); const ry = finite(report && report.y);
      const dx = finite(destination && destination.x); const dy = finite(destination && destination.y);
      const samePosition = [rx, ry, dx, dy].every((value) => value != null) && Math.hypot(rx - dx, ry - dy) <= 5;
      if (sameMap && samePosition) {
        context = {
          ...context,
          destinationMapAttestation: {
            map: String(report.map),
            trusted: true,
            source: 'trusted-owned-farmer-service',
            observedAt: Number(report.at),
            maxAgeMs: Math.min(30000, ttl),
            subject: String(targetName || '')
          }
        };
        stats.gearTravelAttestations += 1;
      }
    }
    return base(request, context);
  };
  runtime.__p0GearTravelAttestationInstalled = true;
  return true;
}

function installSinglePotionOwner(runtime, stats) {
  const logistics = runtime && runtime.controlledPartyLogistics;
  if (!logistics || logistics.__p0SinglePotionOwnerInstalled) return false;
  if (typeof logistics._processSupply === 'function') {
    logistics._processSupply = () => false;
  }
  if (typeof logistics._requestSupply === 'function') {
    logistics._requestSupply = () => false;
  }
  if (logistics.config) {
    logistics.config.farmerPotionLow = POTION_LOW_WATERMARK;
    logistics.config.farmerPotionTarget = POTION_DELIVERY_QUANTITY;
    logistics.config.maxSupplyBatch = POTION_DELIVERY_QUANTITY;
  }
  logistics.__p0SinglePotionOwnerInstalled = true;
  stats.legacyPotionPathSuppressions += 1;
  return true;
}

class P0RegroupSupplyRecovery {
  constructor(runtime) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.installedAt = this.now();
    this.lastFallbackCrossMapTickAt = 0;
    this.stats = {
      receiverRepairs: 0,
      recoveryRegroupPublishes: 0,
      recoveryRegroupTravels: 0,
      bootstrapNoProgressSuppressions: 0,
      crossMapFallbackTicks: 0,
      bundleRestockPlans: 0,
      bundleDeliveryPlans: 0,
      bundlePotionPurchases: 0,
      bundleDeliveriesCommitted: 0,
      bundleDeliveriesFailedSafe: 0,
      gearTravelAttestations: 0,
      legacyPotionPathSuppressions: 0
    };
    this.bootstrapProgressGuardInstalled = installBootstrapProgressGuard(runtime, this.stats);
    this.crossMapRecoveryInstalled = installCrossMapRecoveryAuthority(runtime, this.stats);
    this.plannerBundlePolicyInstalled = installPlannerBundlePolicy(runtime, this.stats);
    this.bundleExecutorInstalled = installBundleExecutor(runtime, this.stats);
    this.bundleRestockInstalled = installBundleRestock(runtime, this.stats);
    this.gearTravelAttestationInstalled = installGearTravelAttestation(runtime, this.stats);
    this.singlePotionOwnerInstalled = installSinglePotionOwner(runtime, this.stats);
    this._event('P0_REGROUP_SUPPLY_RECOVERY_INSTALLED', 'warn', 'LIVE_LOG_VERIFIED_RECOVERY', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'p0-regroup-supply-recovery', event, severity, reason, data }); } catch (_) {}
  }

  ensurePatches() {
    if (!this.bootstrapProgressGuardInstalled) this.bootstrapProgressGuardInstalled = installBootstrapProgressGuard(this.runtime, this.stats);
    if (!this.crossMapRecoveryInstalled) this.crossMapRecoveryInstalled = installCrossMapRecoveryAuthority(this.runtime, this.stats);
    if (!this.plannerBundlePolicyInstalled) this.plannerBundlePolicyInstalled = installPlannerBundlePolicy(this.runtime, this.stats);
    if (!this.bundleExecutorInstalled) this.bundleExecutorInstalled = installBundleExecutor(this.runtime, this.stats);
    if (!this.bundleRestockInstalled) this.bundleRestockInstalled = installBundleRestock(this.runtime, this.stats);
    if (!this.gearTravelAttestationInstalled) this.gearTravelAttestationInstalled = installGearTravelAttestation(this.runtime, this.stats);
    if (!this.singlePotionOwnerInstalled) this.singlePotionOwnerInstalled = installSinglePotionOwner(this.runtime, this.stats);
    return true;
  }

  beforeTick() {
    this.ensurePatches();
    const crossMap = this.runtime && this.runtime.alpha28LiveAuthorityLiveness && this.runtime.alpha28LiveAuthorityLiveness.crossMap;
    if (!crossMap || typeof crossMap.tick !== 'function') return false;
    const now = this.now();
    const last = finite(crossMap.__p0LastTickAt, 0);
    if (last > 0 && now - last <= 100) return false;
    this.lastFallbackCrossMapTickAt = now;
    this.stats.crossMapFallbackTicks += 1;
    try { return crossMap.tick(); }
    catch (error) {
      this._event('P0_CROSS_MAP_FALLBACK_TICK_FAILED', 'error', 'CROSS_MAP_FALLBACK_TICK_ERROR', { message: String(error && error.message || error).slice(0, 220) });
      return false;
    }
  }

  status() {
    const crossMap = this.runtime && this.runtime.alpha28LiveAuthorityLiveness && this.runtime.alpha28LiveAuthorityLiveness.crossMap;
    const planner = this.runtime && this.runtime.merchantServicePlanner;
    return {
      schemaVersion: 1,
      mode: P0_REGROUP_SUPPLY_RECOVERY_MODE,
      installedAt: this.installedAt,
      bootstrapProgressGuardInstalled: this.bootstrapProgressGuardInstalled,
      crossMapRecoveryInstalled: this.crossMapRecoveryInstalled,
      crossMapReceiverInstalled: !!(crossMap && crossMap.receiverInstalled),
      plannerBundlePolicyInstalled: this.plannerBundlePolicyInstalled,
      bundleExecutorInstalled: this.bundleExecutorInstalled,
      bundleRestockInstalled: this.bundleRestockInstalled,
      gearTravelAttestationInstalled: this.gearTravelAttestationInstalled,
      singlePotionOwnerInstalled: this.singlePotionOwnerInstalled,
      potionPolicy: {
        deliveryPerFarmer: { hpot0: POTION_DELIVERY_QUANTITY, mpot0: POTION_DELIVERY_QUANTITY },
        lowWatermark: POTION_LOW_WATERMARK,
        merchantReserve: planner ? planner.merchantPotionReserve : null,
        buyBeforeFarmerTravel: true,
        bothFamiliesRequiredBeforeTravel: true,
        exactDelivery: true,
        legacyDirectSupplyDisabled: true
      },
      recoveryPolicy: {
        normalCrossMapSupervisorStatesUnchanged: ['HEALTHY', 'WATCH'],
        verifiedTeamRegroupRecoveryStates: [...RECOVERY_SUPERVISOR_STATES],
        recoveryReasonAllowlist: [...RECOVERY_REASON_ALLOWLIST],
        normalProgressionAuthorityWidened: false,
        contentSafetyBypassed: false,
        targetSafetyBypassed: false,
        serverChangeAllowed: false
      },
      lastFallbackCrossMapTickAt: this.lastFallbackCrossMapTickAt || null,
      stats: { ...this.stats }
    };
  }
}

function installP0RegroupSupplyRecovery(runtime) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.p0RegroupSupplyRecovery) return runtime.p0RegroupSupplyRecovery;
  const module = new P0RegroupSupplyRecovery(runtime);
  runtime.p0RegroupSupplyRecovery = module;
  return module;
}

module.exports = {
  P0_REGROUP_SUPPLY_RECOVERY_MODE,
  POTION_DELIVERY_QUANTITY,
  POTION_LOW_WATERMARK,
  RECOVERY_SUPERVISOR_STATES,
  RECOVERY_REASON_ALLOWLIST,
  P0RegroupSupplyRecovery,
  installP0RegroupSupplyRecovery,
  installBootstrapProgressGuard,
  installCrossMapRecoveryAuthority,
  installPlannerBundlePolicy,
  installBundleExecutor,
  installBundleRestock,
  installGearTravelAttestation,
  installSinglePotionOwner,
  potionBundle,
  recoverySupervisorAllowed
};
