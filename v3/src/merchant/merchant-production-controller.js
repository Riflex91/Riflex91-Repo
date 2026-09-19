'use strict';

const { MerchantProductionPlanner, ProductionStepKind } = require('./merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('./controlled-merchant-production-executor');
const { PersistentBankCatalog } = require('./persistent-bank-catalog');
const { PersistentProductionIntent } = require('./persistent-production-intent');
const { bufferedInteractionRange, interactionMaxRange, INTERACTION_SAFETY_FACTOR } = require('../reliability/alpha27-atomic-service');
const {
  chooseProductionTeamFarmObjective,
  DEFAULT_MAX_TEAM_FARM_HOURS,
  DEFAULT_FALLBACK_KILLS_PER_HOUR,
  isExchangeBackedSource,
  isQuestBackedSource,
  isEventBackedSource
} = require('../party/production-material-acquisition');
const { PROBABILISTIC_FARM_TIME_MODEL } = require('../party/probabilistic-farm-time');
const { eventEntryActive } = require('../party/acquisition-source-evidence');
const {
  ProductionAcquisitionCoverageAudit,
  ProductionGraphSoakAuditor
} = require('./production-graph-certification');

const MERCHANT_PRODUCTION_CONTROLLER_MODE = 'merchant-production-controller-v1';

function n(value, fallback = null) { const x = Number(value); return Number.isFinite(x) ? x : fallback; }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

function installMerchantProduction(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.__merchantProductionController) return runtime.__merchantProductionController;

  const planner = options.planner || new MerchantProductionPlanner({
    now: runtime.now,
    log: runtime.log,
    maxDepth: options.merchantProductionMaxDepth,
    minImprovementRatio: options.merchantProductionMinImprovementRatio,
    goldReserve: options.merchantProductionGoldReserve,
    maxBuyQuantity: options.merchantProductionMaxBuyQuantity,
    candidateScanLimit: options.merchantProductionCandidateScanLimit,
    targets: options.merchantProductionTargets
  });
  const bankCatalog = options.bankCatalog || new PersistentBankCatalog({ root: runtime.root, now: runtime.now, storage: options.merchantProductionStorage || options.storage, storageKey: options.merchantBankCatalogStorageKey, maxAgeMs: options.merchantBankCatalogMaxAgeMs });
  const productionIntent = options.productionIntent || new PersistentProductionIntent({
    root: runtime.root,
    now: runtime.now,
    storage: options.merchantProductionStorage || options.storage,
    storageKey: options.merchantProductionIntentStorageKey
  });
  const productionCoverageAudit = options.productionCoverageAudit || new ProductionAcquisitionCoverageAudit(runtime, {
    maxDepth: options.merchantProductionCoverageMaxDepth,
    fallbackKillsPerHour: options.merchantProductionFallbackKillsPerHour
  });
  const productionSoakAuditor = options.productionSoakAuditor || new ProductionGraphSoakAuditor({
    capacity: options.merchantProductionSoakViolationCapacity
  });
  const executor = options.executor || new ControlledMerchantProductionExecutor({
    root: runtime.root,
    now: runtime.now,
    log: runtime.log,
    storage: options.merchantProductionStorage || options.storage,
    storageKey: options.merchantProductionStorageKey,
    getMode: () => runtime.adapter && runtime.adapter.mode,
    getSupervisorStatus: () => runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : { state: 'UNKNOWN' },
    getEconomyEmergency: () => typeof runtime._alpha20EconomyEmergency === 'function' ? runtime._alpha20EconomyEmergency() : false,
    contentDrift: runtime.contentDrift,
    timeoutMs: options.merchantProductionTimeoutMs,
    verifyDelayMs: options.merchantProductionVerifyDelayMs,
    verifyAttempts: options.merchantProductionVerifyAttempts,
    actionWindowMs: options.merchantProductionActionWindowMs,
    maxActionsPerWindow: options.merchantProductionMaxActionsPerWindow,
    maxBuyQuantity: options.merchantProductionMaxBuyQuantity,
    goldReserve: options.merchantProductionGoldReserve
  });

  const state = {
    intervalMs: Math.max(1000, Math.min(60000, n(options.merchantProductionIntervalMs, 3500))),
    lastCycleAt: -Infinity,
    lastPlan: null,
    lastExecution: null,
    executionPending: false,
    pausedUntil: 0,
    failureCooldownMs: Math.max(5000, Math.min(30 * 60 * 1000, n(options.merchantProductionFailureCooldownMs, 120000))),
    maxTeamFarmHours: Math.max(0.25, n(options.merchantProductionMaxTeamFarmHours, DEFAULT_MAX_TEAM_FARM_HOURS)),
    fallbackKillsPerHour: Math.max(1, n(options.merchantProductionFallbackKillsPerHour, DEFAULT_FALLBACK_KILLS_PER_HOUR)),
    materialObjectiveTtlMs: Math.max(60000, Math.min(60 * 60 * 1000, n(options.merchantProductionMaterialObjectiveTtlMs, 15 * 60 * 1000))),
    mutationDemandTtlMs: Math.max(30000, Math.min(15 * 60 * 1000, n(options.merchantProductionMutationDemandTtlMs, 5 * 60 * 1000))),
    intentRecoveryGraceMs: Math.max(5000, Math.min(5 * 60 * 1000, n(options.merchantProductionIntentRecoveryGraceMs, 60000))),
    lastMaterialFarmDecision: null,
    lastMutationDemand: null,
    mutationExecutions: 0,
    mutationHolds: 0,
    lastIntentRecovery: null
  };

  function productionTargetForPlan(plan) {
    const demand = plan && plan.exchangeDemand;
    if (demand && String(demand.reason || '') === 'PRODUCTION_MATERIAL' && demand.output) {
      return {
        output: String(demand.output),
        recipient: demand.recipient || null,
        slot: demand.slot || null
      };
    }
    return plan && plan.target || null;
  }

  function productionPhaseForStep(plan, step) {
    const demand = plan && plan.exchangeDemand;
    if (demand && String(demand.reason || '') === 'PRODUCTION_MATERIAL') {
      if (step && step.kind === ProductionStepKind.EXCHANGE) {
        if (demand.eventKey && demand.quest) return 'EVENT_QUEST_EXECUTING';
        if (demand.quest) return 'QUEST_EXECUTING';
        if (demand.eventKey) return 'EVENT_EXCHANGE_EXECUTING';
      }
      if (step && step.kind === ProductionStepKind.BANK_RETRIEVE) {
        if (demand.eventKey && demand.quest) return 'EVENT_QUEST_READY';
        if (demand.quest) return 'QUEST_READY';
        if (demand.eventKey) return 'EVENT_EXCHANGE_READY';
      }
    }
    return `EXECUTING_${String(step && step.kind || 'STEP')}`;
  }

  function persistIntentForTarget(plan, target, phase, details = {}) {
    if (!plan || !target || !target.output) return false;
    return productionIntent.ensureForPlan(
      { ...clone(plan), target: clone(target) },
      phase,
      {
        reason: details.reason || null,
        progress: Object.prototype.hasOwnProperty.call(details, 'progress') ? details.progress : undefined,
        material: Object.prototype.hasOwnProperty.call(details, 'material') ? details.material : undefined,
        lastExecution: Object.prototype.hasOwnProperty.call(details, 'lastExecution') ? details.lastExecution : undefined
      }
    );
  }

  function updateIntentAfterExecution(plan, step, result) {
    const target = productionTargetForPlan(plan);
    if (!plan || !target || !target.output) return false;
    if (result && result.committed === true && step && step.kind === ProductionStepKind.CRAFT && String(step.name || '') === String(target.output || '')) {
      return productionIntent.update('OUTPUT_READY_FOR_DELIVERY', {
        reason: 'FINAL_PRODUCTION_OUTPUT_VERIFIED_ON_MERCHANT',
        plan: { ...clone(plan), target: clone(target) },
        progress: {
          outputReady: true,
          recipientVerified: false,
          output: target.output,
          recipient: target.recipient || null,
          slot: target.slot || null
        },
        lastExecution: { at: runtime.now(), kind: step.kind, item: step.name, result: clone(result) }
      });
    }
    return productionIntent.update('REPLAN_REQUIRED', {
      reason: result && result.committed === true ? 'PRODUCTION_STEP_COMMITTED_REPLAN' : result && result.reason || 'PRODUCTION_STEP_RESULT_REPLAN',
      plan: { ...clone(plan), target: clone(target) },
      lastExecution: { at: runtime.now(), kind: step && step.kind || null, item: step && step.name || null, result: clone(result) }
    });
  }

  function itemLevel(item) {
    return Math.max(0, Math.floor(n(item && item.level, 0)));
  }

  function recipientTargetState(intentStatus = null) {
    const active = intentStatus && intentStatus.active || productionIntent.status().active;
    const target = active && active.target || null;
    if (!target || !target.output || !target.recipient) return { verified: false, reason: 'PRODUCTION_RECIPIENT_IDENTITY_INCOMPLETE' };
    const wantedName = String(target.output);
    const wantedRecipient = String(target.recipient);
    const wantedSlot = target.slot == null ? null : String(target.slot);
    const local = character();
    if (local && String(local.name || '') === wantedRecipient) {
      const gear = local.slots || local.equipment || local.gear || {};
      const equipped = wantedSlot ? gear[wantedSlot] : null;
      const inventory = Array.isArray(local.items) ? local.items : [];
      const held = inventory.some((item) => item && String(item.name || '') === wantedName);
      const equippedMatch = !!(equipped && String(equipped.name || '') === wantedName);
      return {
        verified: held || equippedMatch,
        reason: held ? 'RECIPIENT_INVENTORY_VERIFIED' : equippedMatch ? 'RECIPIENT_EQUIPMENT_VERIFIED' : 'RECIPIENT_OUTPUT_NOT_OBSERVED',
        recipient: wantedRecipient,
        output: wantedName,
        slot: wantedSlot,
        level: equippedMatch ? itemLevel(equipped) : null
      };
    }
    const registry = runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function'
      ? runtime.characterRegistry.status()
      : null;
    const row = (Array.isArray(registry && registry.characters) ? registry.characters : [])
      .find((entry) => entry && String(entry.name || '') === wantedRecipient) || null;
    if (!row) return { verified: false, reason: 'RECIPIENT_NOT_IN_REGISTRY', recipient: wantedRecipient, output: wantedName, slot: wantedSlot };
    const gear = row.gear || row.equipment || row.slots || {};
    const equipped = wantedSlot ? gear[wantedSlot] : null;
    const inventory = Array.isArray(row.inventory) ? row.inventory : Array.isArray(row.items) ? row.items : [];
    const held = inventory.some((item) => item && String(item.name || '') === wantedName);
    const equippedMatch = !!(equipped && String(equipped.name || '') === wantedName);
    return {
      verified: held || equippedMatch,
      reason: held ? 'RECIPIENT_INVENTORY_VERIFIED' : equippedMatch ? 'RECIPIENT_EQUIPMENT_VERIFIED' : 'RECIPIENT_OUTPUT_NOT_OBSERVED',
      recipient: wantedRecipient,
      output: wantedName,
      slot: wantedSlot,
      level: equippedMatch ? itemLevel(equipped) : null
    };
  }

  function settleDeliveredProductionIntent() {
    const intentStatus = productionIntent.status();
    const activeIntent = intentStatus.active;
    if (!activeIntent || String(activeIntent.phase || '') !== 'OUTPUT_READY_FOR_DELIVERY') return null;
    const delivery = recipientTargetState(intentStatus);
    if (delivery.verified !== true) {
      return { settled: false, reason: 'PRODUCTION_OUTPUT_AWAITING_RECIPIENT_DELIVERY', delivery };
    }
    productionIntent.complete('FINAL_PRODUCTION_RECIPIENT_VERIFIED');
    clearProductionMutationDemand('FINAL_PRODUCTION_RECIPIENT_VERIFIED');
    clearProductionMaterialObjective('FINAL_PRODUCTION_RECIPIENT_VERIFIED');
    const activeTask = currentTask();
    if (activeTask && activeTask.owner === 'PRODUCTION') {
      releaseTask('FINAL_PRODUCTION_RECIPIENT_VERIFIED', { delivery: clone(delivery) });
    }
    return { settled: true, reason: 'FINAL_PRODUCTION_RECIPIENT_VERIFIED', delivery };
  }

  function taskCoordinator() { return runtime.merchantTaskCoordinator || null; }
  function currentTask() { const c = taskCoordinator(); return c && typeof c.current === 'function' ? c.current() : null; }
  function exchangeTaskIdentity(plan) {
    if (!plan) return null;
    const demand = plan.exchangeDemand || null;
    const next = plan.nextStep || null;
    const item = demand && demand.item || (next && next.kind === ProductionStepKind.EXCHANGE ? next.name : null);
    const target = demand && demand.target || plan.target && plan.target.item || null;
    if (!item || !target) return null;
    return {
      key: `production:exchange:${String(item)}:${String(target)}`,
      item: String(item),
      target: String(target)
    };
  }
  function productionTaskKey(plan) {
    if (!plan) return null;
    // An exchange demand is one logical batch even while its next executable
    // step is BANK_RETRIEVE/BUY/etc. Keep the same coordinator key across all
    // preparation steps and the final EXCHANGE so the task never blocks itself.
    const exchange = exchangeTaskIdentity(plan);
    if (exchange) return exchange.key;
    const output = plan.target && (plan.target.output || plan.target.item) || null;
    const recipient = plan.target && plan.target.recipient || null;
    return output ? `production:chain:${String(output)}:${String(recipient || '')}` : null;
  }
  function acquireTask(plan, kind = null) {
    const coordinator = taskCoordinator();
    if (!coordinator || typeof coordinator.acquire !== 'function') return { acquired: true, task: null };
    const key = productionTaskKey(plan);
    if (!key) return { acquired: false, reason: 'PRODUCTION_TASK_KEY_UNAVAILABLE', task: coordinator.current() };
    const exchange = exchangeTaskIdentity(plan);
    const metadata = exchange
      ? { exchangeItem: exchange.item, target: exchange.target }
      : { output: plan.target && plan.target.output || null, recipient: plan.target && plan.target.recipient || null, slot: plan.target && plan.target.slot || null };
    return coordinator.acquire('PRODUCTION', kind || (exchange ? 'EXCHANGE_BATCH' : 'PRODUCTION_CHAIN'), key, metadata);
  }
  function releaseTask(reason = 'PRODUCTION_TASK_COMPLETE', details = {}) {
    const coordinator = taskCoordinator();
    const deliverySettlement = settleDeliveredProductionIntent();
    if (deliverySettlement) {
      return {
        state: 'HOLD',
        reason: deliverySettlement.reason,
        delivery: clone(deliverySettlement.delivery)
      };
    }

    const task = currentTask();
    if (!coordinator || !task || task.owner !== 'PRODUCTION' || typeof coordinator.release !== 'function') return false;
    return coordinator.release('PRODUCTION', task.key, reason, details);
  }
  function character() { return runtime.root && (runtime.root.character || (runtime.root.parent && runtime.root.parent.character)) || null; }
  function isMerchant() { const c = character(); return !!(c && String(c.ctype || c.type || '').toLowerCase() === 'merchant'); }
  function inCombat() { const c = character(); if (!c) return false; if (c.target) return true; const entities = runtime.root && runtime.root.parent && runtime.root.parent.entities || runtime.root && runtime.root.entities || {}; const ids = new Set([c.name, c.id].filter(Boolean).map(String)); return Object.values(entities).some((e) => e && e.target && ids.has(String(e.target))); }
  function alpha27Busy() {
    const convergence = runtime.alpha27CombatMerchantConvergence;
    const merchant = convergence && convergence.merchant;
    const atomic = merchant && merchant.atomic;
    return !!(atomic && (atomic.merchantBusy || atomic.serviceTravelBusy));
  }
  function collectionBusy() { try { return typeof runtime._merchantCollectionSessionActive === 'function' && runtime._merchantCollectionSessionActive() === true; } catch (_) { return true; } }
  function controlledBusy() {
    const systems = [runtime.controlledMerchantService, runtime.controlledTravel, runtime.controlledMerchant, runtime.controlledMerchantSpaceRecovery, runtime.controlledPartyLifecycle];
    const task = currentTask();
    const taskBlocked = !!(task && task.owner !== 'PRODUCTION');
    return systems.some((system) => { try { return !!(system && system.status && system.status().busy); } catch (_) { return true; } }) || executor.status().busy || alpha27Busy() || collectionBusy() || taskBlocked;
  }
  function input() {
    const c = character() || {};
    bankCatalog.observe(c);
    const task = currentTask();
    const productionTaskTarget = task && task.owner === 'PRODUCTION' ? clone(task.metadata || {}) : null;
    return {
      character: c,
      bankCatalog: bankCatalog.status(),
      productionTaskTarget,
      exchangeDemands: (Array.isArray(runtime.merchantExchangeDemands) ? runtime.merchantExchangeDemands : []).filter((row) => row && (!row.expiresAt || row.expiresAt > runtime.now())),
      eventState: clone(runtime.root && (runtime.root.S || runtime.root.parent && runtime.root.parent.S) || {}),
      registry: runtime.characterRegistry && runtime.characterRegistry.status ? runtime.characterRegistry.status() : { characters: [] },
      gameData: runtime.adapter && runtime.adapter.getGameData ? runtime.adapter.getGameData() || {} : {},
      anniversaryActive: !!(
        runtime.root
        && (runtime.root.S || runtime.root.parent && runtime.root.parent.S)
        && (runtime.root.S || runtime.root.parent && runtime.root.parent.S).anniversary
        && (runtime.root.S || runtime.root.parent && runtime.root.parent.S).anniversary.active
      ),
      contentDrift: runtime.contentDrift,
      inCombat: inCombat(),
      economyEmergency: typeof runtime._alpha20EconomyEmergency === 'function' ? runtime._alpha20EconomyEmergency() : false,
      controlledBusy: controlledBusy()
    };
  }
  function vendorNearby(step) {
    if (!step || step.kind !== ProductionStepKind.BUY || !step.vendor) return true;
    const c = character() || {};
    if (step.vendor.map && c.map && String(step.vendor.map) !== String(c.map)) return false;
    const cx = n(c.real_x, n(c.x)); const cy = n(c.real_y, n(c.y)); const vx = n(step.vendor.x); const vy = n(step.vendor.y);
    if (cx == null || cy == null || vx == null || vy == null) return true;
    return Math.hypot(cx - vx, cy - vy) <= bufferedInteractionRange(runtime.root, 'npc');
  }

  function evaluate() {
    if (!isMerchant()) return null;
    const currentInput = input();
    const lockedOutput = currentInput.productionTaskTarget && currentInput.productionTaskTarget.output;
    state.lastPlan = String(lockedOutput || '') === 'sixcake'
      ? (planner.planMaterialConsolidation(currentInput) || planner.plan(currentInput))
      : planner.plan(currentInput);
    return clone(state.lastPlan);
  }

  async function travelNamed(destination) {
    const convergence = runtime.alpha27CombatMerchantConvergence;
    const atomic = convergence && convergence.atomic;
    if (!atomic || typeof atomic.namedServiceTravel !== 'function') return { ok: false, reason: 'NAMED_SERVICE_TRAVEL_UNAVAILABLE' };
    return atomic.namedServiceTravel(destination);
  }
  async function travelVendor(step) {
    if (!step || !step.vendor || typeof runtime.planTravel !== 'function' || typeof runtime.executeTravelPlan !== 'function') return { ok: false, reason: 'VENDOR_TRAVEL_UNAVAILABLE' };
    const interactionMax = interactionMaxRange(runtime.root, 'npc');
    const arrivalRadius = bufferedInteractionRange(runtime.root, 'npc');
    const planned = runtime.planTravel({
      destination: { map: step.vendor.map, x: step.vendor.x, y: step.vendor.y },
      arrivalRadius,
      metadata: {
        source: 'MERCHANT_PRODUCTION',
        item: step.name,
        stopWhenInteractionReady: true,
        interactionKind: 'npc',
        interactionMaxRange: interactionMax,
        interactionSafetyFactor: INTERACTION_SAFETY_FACTOR,
        bufferedInteractionRange: arrivalRadius
      }
    });
    if (!planned || planned.accepted !== true || !planned.plan) return { ok: false, reason: planned && planned.reason || 'VENDOR_TRAVEL_PLAN_REJECTED' };
    const result = await runtime.executeTravelPlan(planned.plan.id);
    return { ok: !!(result && (result.completed === true || result.ok === true || result.result === 'COMPLETED')), result: clone(result) };
  }
  function ensureAutoEnabled() {
    if (!isMerchant() || String(runtime.adapter && runtime.adapter.mode || '') !== 'active') return false;
    if (executor.status().enabled) return true;
    const configured = configure({ enabled: true, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK, allowBuy: true, allowBank: true, allowCraft: true, allowExchange: true });
    return !!(configured && configured.controlled && configured.controlled.enabled);
  }
  function ensureBankCatalog() {
    const c = character() || {};
    if (c.bank && typeof c.bank === 'object') { bankCatalog.observe(c); return false; }
    if (!bankCatalog.needsRefresh() || collectionBusy() || state.executionPending || controlledBusy()) return false;
    const coordinator = taskCoordinator();
    const lock = coordinator && typeof coordinator.acquire === 'function'
      ? coordinator.acquire('PRODUCTION', 'BANK_CATALOG', 'production:bank-catalog', { destination: 'bank' })
      : { acquired: true };
    if (!lock.acquired) return false;
    state.executionPending = true;
    Promise.resolve(travelNamed('bank')).then((result) => {
      state.lastExecution = { at: runtime.now(), planId: null, kind: 'BANK_CATALOG_REFRESH', result: clone(result) };
      if (result && result.ok) bankCatalog.observe(character());
    }).finally(() => {
      state.executionPending = false;
      const active = currentTask();
      if (active && active.owner === 'PRODUCTION' && active.key === 'production:bank-catalog' && coordinator && typeof coordinator.release === 'function') {
        coordinator.release('PRODUCTION', active.key, 'BANK_CATALOG_REFRESH_COMPLETE');
      }
    });
    return true;
  }
  function schedule(plan) {
    if (!plan || plan.state !== 'READY' || !plan.nextStep || state.executionPending || !executor.status().enabled || collectionBusy()) return false;
    if (runtime.now() < state.pausedUntil) return false;
    const productionDemand = plan.exchangeDemand && String(plan.exchangeDemand.reason || '') === 'PRODUCTION_MATERIAL'
      ? plan.exchangeDemand
      : null;
    if (productionDemand && productionDemand.eventKey) {
      const liveEventState = runtime.root && (runtime.root.S || runtime.root.parent && runtime.root.parent.S) || {};
      if (!eventEntryActive(liveEventState, productionDemand.eventKey, runtime.now())) {
        const target = productionTargetForPlan(plan);
        state.lastExecution = {
          at: runtime.now(),
          planId: plan.id,
          kind: plan.nextStep.kind,
          result: { executed: false, committed: false, reason: 'EVENT_SOURCE_BECAME_INACTIVE_BEFORE_EXECUTION', eventKey: productionDemand.eventKey }
        };
        persistIntentForTarget({ ...clone(plan), target: clone(target) }, target, 'EVENT_WAITING', {
          reason: 'EVENT_SOURCE_BECAME_INACTIVE_BEFORE_EXECUTION',
          material: {
            material: productionDemand.item,
            targetMaterial: productionDemand.target,
            acquisitionKind: productionDemand.sourceKind || null,
            eventKey: productionDemand.eventKey,
            quest: productionDemand.quest || null,
            graphNode: clone(productionDemand.graphNode || null)
          },
          progress: { executableNow: false, permanentBlock: false }
        });
        setProductionExchangeDemand(null);
        return false;
      }
    }
    const lock = acquireTask(plan);
    if (!lock.acquired) return false;
    const step = plan.nextStep;
    const intentTarget = productionTargetForPlan(plan);
    persistIntentForTarget({ ...clone(plan), target: clone(intentTarget) }, intentTarget, productionPhaseForStep(plan, step), {
      reason: plan.exchangeDemand && plan.exchangeDemand.reason === 'PRODUCTION_MATERIAL'
        ? 'PRODUCTION_ACQUISITION_STEP_SCHEDULED'
        : 'PRODUCTION_STEP_SCHEDULED',
      material: plan.exchangeDemand && plan.exchangeDemand.reason === 'PRODUCTION_MATERIAL'
        ? {
          material: plan.exchangeDemand.item,
          targetMaterial: plan.exchangeDemand.target,
          acquisitionKind: plan.exchangeDemand.sourceKind || null,
          quest: plan.exchangeDemand.quest || null,
          eventKey: plan.exchangeDemand.eventKey || null,
          graphNode: clone(plan.exchangeDemand.graphNode || null)
        }
        : undefined,
      lastExecution: state.lastExecution
    });
    state.executionPending = true;
    Promise.resolve().then(async () => {
      const c = character() || {};
      if ((step.kind === ProductionStepKind.BANK_RETRIEVE || step.kind === ProductionStepKind.BANK_STORE) && !c.bank) {
        const travel = await travelNamed('bank');
        state.lastExecution = { at: runtime.now(), planId: plan.id, kind: step.kind, result: { executed: false, committed: false, reason: travel && travel.ok ? 'BANK_TRAVEL_COMPLETED_REPLAN_REQUIRED' : travel && travel.reason || 'BANK_TRAVEL_FAILED', travel: clone(travel) } };
        if (travel && travel.ok) bankCatalog.observe(character());
        return;
      }
      if (step.kind === ProductionStepKind.BUY && !vendorNearby(step)) {
        const travel = await travelVendor(step);
        state.lastExecution = { at: runtime.now(), planId: plan.id, kind: step.kind, result: { executed: false, committed: false, reason: travel.ok ? 'VENDOR_TRAVEL_COMPLETED_REPLAN_REQUIRED' : travel.reason, travel: clone(travel) } };
        return;
      }
      if (step.kind === ProductionStepKind.CRAFT && step.recipe && step.recipe.quest) {
        const travel = await travelNamed(step.recipe.quest);
        if (!travel || travel.ok !== true) {
          state.lastExecution = { at: runtime.now(), planId: plan.id, kind: step.kind, result: { executed: false, committed: false, reason: travel && travel.reason || 'CRAFT_QUEST_NPC_TRAVEL_FAILED', travel: clone(travel) } };
          return;
        }
      }
      if (step.kind === ProductionStepKind.EXCHANGE) {
        const travel = await travelNamed(step.destination || 'exchange');
        if (!travel || travel.ok !== true) {
          state.lastExecution = { at: runtime.now(), planId: plan.id, kind: step.kind, result: { executed: false, committed: false, reason: travel && travel.reason || 'EXCHANGE_NPC_TRAVEL_FAILED', travel: clone(travel) } };
          return;
        }
      }
      const result = await executor.execute(plan, step);
      state.lastExecution = { at: runtime.now(), planId: plan.id, kind: step.kind, result: clone(result) };
      updateIntentAfterExecution(plan, step, result);
      if (result && result.committed === true && (step.kind === ProductionStepKind.BANK_RETRIEVE || step.kind === ProductionStepKind.BANK_STORE)) bankCatalog.observe(character());
      if (result && result.executed === true && result.committed !== true) state.pausedUntil = runtime.now() + state.failureCooldownMs;
      if (runtime.log && typeof runtime.log.emit === 'function') runtime.log.emit({ component: 'merchant-production', event: result && result.committed ? 'PRODUCTION_STEP_COMMITTED' : 'PRODUCTION_STEP_RESULT', severity: result && result.committed ? 'info' : 'warn', reason: result && result.reason || 'UNKNOWN', data: { planId: plan.id, kind: step.kind, item: step.name } });
    }).catch((error) => {
      state.pausedUntil = runtime.now() + state.failureCooldownMs;
      state.lastExecution = { at: runtime.now(), planId: plan.id, kind: step.kind, result: { executed: false, committed: false, reason: 'UNHANDLED_PRODUCTION_ERROR', error: error && typeof error === 'object' ? { reason: error.reason || error.code || error.message || 'STRUCTURED_ERROR', message: error.message || null } : String(error) } };
      releaseTask('PRODUCTION_STEP_FAILED_SAFE', { step: step.kind, item: step.name });
    }).finally(() => { state.executionPending = false; });
    return true;
  }
  function mutationCandidateForPlan(plan) {
    if (!plan || plan.state !== 'BLOCKED') return null;
    const rows = Array.isArray(plan.blockedCandidates) && plan.blockedCandidates.length
      ? plan.blockedCandidates
      : plan.target
        ? [{ candidate: plan.target, steps: plan.steps || [], blockers: plan.blockers || [] }]
        : [];
    for (const row of rows) {
      if (!row || !row.candidate) continue;
      const blockers = Array.isArray(row.blockers) ? row.blockers : [];
      const hardBlocker = blockers.find((blocker) => blocker && ![
        'MATERIAL_MUTATION_REQUIRED',
        'MATERIAL_FARM_REQUIRED'
      ].includes(String(blocker.reason || '')));
      if (hardBlocker) continue;
      const step = (Array.isArray(row.steps) ? row.steps : []).find((candidateStep) => candidateStep && [
        ProductionStepKind.UPGRADE_REQUIRED,
        ProductionStepKind.COMPOUND_REQUIRED
      ].includes(candidateStep.kind));
      if (!step) continue;
      return { candidate: clone(row.candidate), step: clone(step) };
    }
    return null;
  }

  function clearProductionMutationDemand(reason = 'PRODUCTION_MUTATION_NO_LONGER_REQUIRED') {
    runtime.productionMaterialMutationDemand = null;
    state.lastMutationDemand = {
      at: runtime.now(),
      active: false,
      reason
    };
    return true;
  }

  function setProductionMutationDemand(plan, selection) {
    const step = selection && selection.step;
    const candidate = selection && selection.candidate;
    if (!step || !candidate) return null;
    const family = step.kind === ProductionStepKind.COMPOUND_REQUIRED ? 'COMPOUND'
      : step.kind === ProductionStepKind.UPGRADE_REQUIRED ? 'UPGRADE'
        : null;
    if (!family) return null;
    const demand = {
      schemaVersion: 1,
      kind: 'PRODUCTION_MATERIAL_MUTATION',
      family,
      item: String(step.name || ''),
      fromLevel: Math.max(0, Math.floor(n(step.fromLevel, Math.max(0, n(step.level, 1) - 1)))),
      targetLevel: Math.max(1, Math.floor(n(step.targetLevel, step.level))),
      output: String(candidate.output || ''),
      recipient: String(candidate.recipient || ''),
      slot: candidate.slot || null,
      quantity: Math.max(1, Math.floor(n(step.quantity, 1))),
      inputQuantity: Math.max(1, Math.floor(n(step.inputQuantity, family === 'COMPOUND' ? 3 : 1))),
      scrollName: step.scrollName || null,
      acquisitionGraph: 'LEAST_GOLD_SOURCE_GRAPH_V3_QUEST_EVENT_PROBABILISTIC',
      createdAt: runtime.now(),
      expiresAt: runtime.now() + state.mutationDemandTtlMs
    };
    runtime.productionMaterialMutationDemand = demand;
    state.lastMutationDemand = { at: runtime.now(), active: true, reason: 'PRODUCTION_MUTATION_REQUIRED', demand: clone(demand), planId: plan && plan.id || null };
    return demand;
  }

  function refreshInventoryLedgerForMutationDemand() {
    const ledger = runtime.inventoryLedger;
    const c = character();
    if (!ledger || typeof ledger.observe !== 'function' || !c) return false;
    let registry = null;
    try { registry = runtime.characterRegistry && runtime.characterRegistry.status ? runtime.characterRegistry.status() : null; } catch (_) { registry = null; }
    const characters = Array.isArray(registry && registry.characters) ? registry.characters.map((row) => clone(row)) : [];
    const liveInventory = (Array.isArray(c.items) ? c.items : []).map((item, index) => item ? { ...clone(item), index } : null).filter(Boolean);
    const liveRow = {
      ...(characters.find((row) => row && String(row.name || '') === String(c.name || '')) || {}),
      name: c.name,
      ctype: c.ctype || c.type,
      stateConfidence: 1,
      inventory: liveInventory
    };
    const merged = characters.filter((row) => row && String(row.name || '') !== String(c.name || ''));
    merged.push(liveRow);
    let gameData = {};
    try { gameData = runtime.adapter && runtime.adapter.getGameData ? runtime.adapter.getGameData() || {} : {}; } catch (_) { gameData = {}; }
    try {
      ledger.observe({
        observedAt: runtime.now(),
        registry: { ...(registry || {}), characters: merged },
        gameData,
        contentDrift: runtime.contentDrift,
        liveCharacter: c
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function mutationInputIndices(demand) {
    const c = character();
    const ledger = runtime.inventoryLedger;
    if (!c || !ledger || typeof ledger.get !== 'function' || !demand) return [];
    const required = String(demand.family || '') === 'COMPOUND' ? 3 : 1;
    const expectedDisposition = String(demand.family || '') === 'COMPOUND' ? 'RESERVE_COMPOUND' : 'RESERVE_UPGRADE';
    const out = [];
    const items = Array.isArray(c.items) ? c.items : [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item || String(item.name || '') !== String(demand.item || '')) continue;
      if (Math.max(0, Math.floor(n(item.level, 0))) !== Math.max(0, Math.floor(n(demand.fromLevel, 0)))) continue;
      if (item.locked || item.l || item.special || item.p) continue;
      let entry = null;
      try { entry = ledger.get(c.name, index); } catch (_) { entry = null; }
      if (!entry || String(entry.name || '') !== String(demand.item || '')) continue;
      if (Math.max(0, Math.floor(n(entry.level, 0))) !== Math.max(0, Math.floor(n(demand.fromLevel, 0)))) continue;
      if (String(entry.disposition || '') !== expectedDisposition) continue;
      const reasons = Array.isArray(entry.reasons) ? entry.reasons.map(String) : [];
      if (reasons.includes('FUTURE_FARMER_GEAR_PROGRESSION')
        || reasons.includes('ACTIVE_GEAR_GOAL_EXACT_ITEM')
        || reasons.includes('ACTIVE_GEAR_GOAL_QUANTITY_ALLOCATED')) continue;
      if (String(demand.family || '') === 'UPGRADE' && !reasons.includes('PRODUCTION_MATERIAL_MUTATION_DEMAND')) continue;
      out.push(index);
      if (out.length >= required) break;
    }
    return out;
  }

  function scheduleProductionMutation(plan) {
    if (!plan || plan.state !== 'BLOCKED' || state.executionPending || collectionBusy()) return false;
    if (runtime.now() < state.pausedUntil) return false;
    const selection = mutationCandidateForPlan(plan);
    if (!selection) return false;
    const lockPlan = { ...clone(plan), target: clone(selection.candidate) };
    persistIntentForTarget(lockPlan, selection.candidate, 'MUTATION_READY', {
      reason: 'LEVELED_RECIPE_INPUT_MUTATION_READY',
      material: {
        name: selection.step.name,
        fromLevel: selection.step.fromLevel,
        targetLevel: selection.step.targetLevel,
        quantity: selection.step.quantity,
        inputQuantity: selection.step.inputQuantity
      }
    });
    const lock = acquireTask(lockPlan, 'PRODUCTION_CHAIN');
    if (!lock.acquired) return false;

    clearProductionMaterialObjective('PRODUCTION_MUTATION_STEP_READY');
    const demand = setProductionMutationDemand(plan, selection);
    if (!demand) {
      releaseTask('PRODUCTION_MUTATION_DEMAND_INVALID');
      return false;
    }

    const convergence = runtime.alpha27CombatMerchantConvergence;
    const merchant = convergence && convergence.merchant;
    if (!merchant || typeof merchant.executeEconomyRequest !== 'function') {
      state.mutationHolds += 1;
      state.pausedUntil = runtime.now() + state.failureCooldownMs;
      state.lastExecution = { at: runtime.now(), planId: plan.id, kind: selection.step.kind, result: { executed: false, committed: false, reason: 'ALPHA27_MUTATION_AUTHORITY_UNAVAILABLE' } };
      clearProductionMutationDemand('ALPHA27_MUTATION_AUTHORITY_UNAVAILABLE');
      releaseTask('PRODUCTION_MUTATION_AUTHORITY_UNAVAILABLE');
      return true;
    }
    try {
      if (typeof merchant.ensureAutonomousAuthorities === 'function') merchant.ensureAutonomousAuthorities();
    } catch (_) {}
    if (!refreshInventoryLedgerForMutationDemand()) {
      state.mutationHolds += 1;
      state.pausedUntil = runtime.now() + state.failureCooldownMs;
      state.lastExecution = { at: runtime.now(), planId: plan.id, kind: selection.step.kind, result: { executed: false, committed: false, reason: 'PRODUCTION_MUTATION_LEDGER_REFRESH_FAILED' } };
      clearProductionMutationDemand('PRODUCTION_MUTATION_LEDGER_REFRESH_FAILED');
      releaseTask('PRODUCTION_MUTATION_LEDGER_REFRESH_FAILED');
      return true;
    }

    const indices = mutationInputIndices(demand);
    const requiredInputs = demand.family === 'COMPOUND' ? 3 : 1;
    if (indices.length < requiredInputs) {
      state.mutationHolds += 1;
      state.pausedUntil = runtime.now() + state.failureCooldownMs;
      state.lastExecution = {
        at: runtime.now(),
        planId: plan.id,
        kind: selection.step.kind,
        result: { executed: false, committed: false, reason: 'PRODUCTION_MUTATION_INPUT_NOT_LEDGER_AUTHORIZED', requiredInputs, authorizedInputs: indices.length }
      };
      clearProductionMutationDemand('PRODUCTION_MUTATION_INPUT_NOT_LEDGER_AUTHORIZED');
      releaseTask('PRODUCTION_MUTATION_INPUT_NOT_LEDGER_AUTHORIZED');
      return true;
    }

    const request = {
      type: demand.family,
      character: character().name,
      index: indices[0],
      indices,
      metadata: {
        source: 'MERCHANT_PRODUCTION_ACQUISITION_V3',
        lifecycle: 'PRODUCTION_MATERIAL_ACQUISITION',
        productionMaterialAcquisition: true,
        output: demand.output,
        recipient: demand.recipient,
        targetLevel: demand.targetLevel,
        fromLevel: demand.fromLevel,
        requiredRecipeQuantity: demand.quantity,
        acquisitionGraph: demand.acquisitionGraph,
        scrollPolicy: 'ITEM_GRADE_DEFAULT'
      }
    };

    state.executionPending = true;
    state.mutationExecutions += 1;
    Promise.resolve(merchant.executeEconomyRequest(request)).then((acted) => {
      state.lastExecution = {
        at: runtime.now(),
        planId: plan.id,
        kind: selection.step.kind,
        result: {
          executed: acted === true,
          committed: null,
          reason: acted === true ? 'ALPHA27_PRODUCTION_MUTATION_EXECUTED_REPLAN_REQUIRED' : 'ALPHA27_PRODUCTION_MUTATION_NOT_EXECUTED',
          request: clone(request)
        }
      };
      if (acted !== true) {
        state.mutationHolds += 1;
        state.pausedUntil = runtime.now() + state.failureCooldownMs;
      }
    }).catch((error) => {
      state.mutationHolds += 1;
      state.pausedUntil = runtime.now() + state.failureCooldownMs;
      state.lastExecution = {
        at: runtime.now(),
        planId: plan.id,
        kind: selection.step.kind,
        result: {
          executed: false,
          committed: false,
          reason: 'UNHANDLED_PRODUCTION_MUTATION_ERROR',
          error: error && typeof error === 'object' ? { reason: error.reason || error.code || error.message || 'STRUCTURED_ERROR', message: error.message || null } : String(error)
        }
      };
    }).finally(() => {
      productionIntent.update('REPLAN_REQUIRED', {
        reason: state.lastExecution && state.lastExecution.result && state.lastExecution.result.reason || 'PRODUCTION_MUTATION_ATTEMPT_COMPLETE_REPLAN',
        plan: lockPlan,
        lastExecution: state.lastExecution
      });
      clearProductionMutationDemand('PRODUCTION_MUTATION_ATTEMPT_COMPLETE_REPLAN');
      state.executionPending = false;
    });
    return true;
  }

  function sourceExpiry(source = null, requested = null) {
    let expiresAt = Number(requested) || runtime.now() + state.materialObjectiveTtlMs;
    const eventEndsAt = Number(source && source.eventEndsAt);
    if (Number.isFinite(eventEndsAt) && eventEndsAt > 0) expiresAt = Math.min(expiresAt, eventEndsAt);
    return expiresAt;
  }

  function setProductionExchangeDemand(source = null, targetMaterial = null, expiresAt = null, target = null) {
    const existing = Array.isArray(runtime.merchantExchangeDemands) ? runtime.merchantExchangeDemands : [];
    const retained = existing.filter((row) => row && String(row.reason || '') !== 'PRODUCTION_MATERIAL');
    if (source && isExchangeBackedSource(source) && source.material) {
      const finalExpiry = sourceExpiry(source, expiresAt);
      if (finalExpiry <= runtime.now()) {
        runtime.merchantExchangeDemands = retained;
        return false;
      }
      retained.push({
        item: String(source.material),
        target: String(source.targetMaterial || targetMaterial || ''),
        reason: 'PRODUCTION_MATERIAL',
        sourceKind: source.kind || null,
        quest: source.quest || null,
        questDestination: clone(source.questDestination || null),
        eventKey: source.eventKey || null,
        eventType: source.eventType || null,
        eventEndsAt: source.eventEndsAt || null,
        probabilityConfidence: source.probabilityConfidence == null ? null : source.probabilityConfidence,
        timeModel: source.timeModel || PROBABILISTIC_FARM_TIME_MODEL,
        p50ExchangeOperations: source.p50ExchangeOperations || null,
        p90ExchangeOperations: source.p90ExchangeOperations || null,
        graphNode: clone(source.graphNode || null),
        output: target && target.output || null,
        recipient: target && target.recipient || null,
        slot: target && target.slot || null,
        expiresAt: finalExpiry
      });
    }
    runtime.merchantExchangeDemands = retained;
    return true;
  }

  function clearProductionMaterialObjective(reason = 'PRODUCTION_MATERIAL_OBJECTIVE_NO_LONGER_REQUIRED') {
    setProductionExchangeDemand(null);
    const logistics = runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics.clearProductionMaterialObjective !== 'function') return false;
    return logistics.clearProductionMaterialObjective(reason);
  }

  function acquisitionPhase(source, suffix = 'ACQUISITION') {
    if (isEventBackedSource(source) && isQuestBackedSource(source)) return `EVENT_QUEST_${suffix}`;
    if (isEventBackedSource(source)) return `EVENT_${suffix}`;
    if (isQuestBackedSource(source)) return `QUEST_${suffix}`;
    return suffix === 'ACQUISITION' ? 'FARMING_MATERIAL' : suffix;
  }

  function publishProductionMaterialObjective(plan) {
    if (!plan || plan.state !== 'BLOCKED') return false;
    const logistics = runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics.publishProductionMaterialObjective !== 'function') return false;
    const blockedCandidates = Array.isArray(plan.blockedCandidates) && plan.blockedCandidates.length
      ? plan.blockedCandidates
      : plan.target
        ? [{ candidate: plan.target, steps: plan.steps || [], blockers: plan.blockers || [] }]
        : [];
    const decision = chooseProductionTeamFarmObjective(runtime, blockedCandidates, {
      maxTeamFarmHours: state.maxTeamFarmHours,
      fallbackKillsPerHour: state.fallbackKillsPerHour
    });
    state.lastMaterialFarmDecision = { at: runtime.now(), ...clone(decision) };

    if (!decision.selected || !decision.selected.nextMaterial || !decision.selected.nextMaterial.source) {
      const evaluated = decision.evaluated || [];
      const awaitingTransfer = evaluated.find((row) => row && row.reason === 'MATERIAL_ALREADY_HELD_BY_FARMERS_AWAIT_TRANSFER');
      if (awaitingTransfer) {
        const materials = Array.isArray(awaitingTransfer.materials) ? awaitingTransfer.materials : [];
        const previous = logistics.lastProductionMaterialObjective || null;
        const preferred = previous && materials.find((row) => row && row.awaitingTransfer === true
          && String(row.handoffMaterial || row.name || '') === String(previous.material || '')
          && Math.max(0, Math.floor(n(row.handoffLevel, row.level))) === Math.max(0, Math.floor(n(previous.level, 0))));
        const material = preferred || materials.find((row) => row && row.awaitingTransfer === true);
        if (!material) return true;
        const source = material.source || null;
        const handoffMaterial = String(material.handoffMaterial || material.name || '');
        const handoffLevel = Math.max(0, Math.floor(n(material.handoffLevel, material.level)));
        const handoffQuantity = Math.max(1, Math.floor(n(material.handoffQuantity, material.quantity)));
        const heldByFarmers = Math.max(handoffQuantity, Math.floor(n(material.heldByFarmers, material.alreadyOnFarmers)));
        const expiresAt = sourceExpiry(source);
        const handoffPlan = { ...clone(plan), target: clone(awaitingTransfer.target || {
          output: awaitingTransfer.output,
          recipient: awaitingTransfer.recipient,
          slot: awaitingTransfer.slot
        }) };
        setProductionExchangeDemand(source, material.name, expiresAt, handoffPlan.target);
        persistIntentForTarget(handoffPlan, handoffPlan.target, 'MATERIAL_READY_FOR_HANDOFF', {
          reason: 'TARGET_QUANTITY_HELD_BY_FARMERS',
          material: {
            material: handoffMaterial,
            targetMaterial: material.name,
            level: handoffLevel,
            requiredQuantity: handoffQuantity,
            heldByFarmers,
            acquisitionKind: source && source.kind || 'DIRECT_MATERIAL_DROP',
            quest: source && source.quest || null,
            questDestination: clone(source && source.questDestination || null),
            eventKey: source && source.eventKey || null,
            eventEndsAt: source && source.eventEndsAt || null,
            graphNode: clone(source && source.graphNode || null)
          },
          progress: {
            requiredQuantity: handoffQuantity,
            heldByFarmers,
            remainingToFarm: 0,
            transferPending: true,
            p50Hours: source && source.p50Hours || 0,
            p90Hours: source && source.p90Hours || 0,
            probabilityConfidence: source && source.probabilityConfidence != null ? source.probabilityConfidence : null
          }
        });
        if (typeof logistics.publishProductionMaterialHandoffReady !== 'function') return true;
        return logistics.publishProductionMaterialHandoffReady({
          objectiveId: previous && previous.objectiveId || `production-material:${awaitingTransfer.output || ''}:${awaitingTransfer.recipient || ''}:${handoffMaterial}`,
          output: awaitingTransfer.output,
          recipient: awaitingTransfer.recipient || null,
          slot: awaitingTransfer.slot || null,
          material: handoffMaterial,
          targetMaterial: material.name,
          acquisitionKind: source && source.kind || 'DIRECT_MATERIAL_DROP',
          level: handoffLevel,
          requiredQuantity: handoffQuantity,
          heldByFarmers,
          quest: source && source.quest || null,
          questDestination: clone(source && source.questDestination || null),
          eventKey: source && source.eventKey || null,
          eventType: source && source.eventType || null,
          eventEndsAt: source && source.eventEndsAt || null,
          timeModel: source && source.timeModel || PROBABILISTIC_FARM_TIME_MODEL,
          probabilityConfidence: source && source.probabilityConfidence != null ? source.probabilityConfidence : null,
          graphNode: clone(source && source.graphNode || null),
          expiresAt
        });
      }

      const exchangeReady = evaluated.find((row) => row && row.reason === 'EXCHANGE_INPUT_READY_ON_MERCHANT');
      if (exchangeReady) {
        const material = (exchangeReady.materials || []).find((row) => row && row.exchangeReady && row.source);
        if (material && material.source) {
          const source = material.source;
          const target = exchangeReady.target || {
            output: exchangeReady.output,
            recipient: exchangeReady.recipient,
            slot: exchangeReady.slot
          };
          const expiresAt = sourceExpiry(source);
          setProductionExchangeDemand(source, material.name, expiresAt, target);
          persistIntentForTarget({ ...clone(plan), target: clone(target) }, target, acquisitionPhase(source, 'READY'), {
            reason: 'EXCHANGE_INPUT_ALREADY_ON_MERCHANT',
            material: {
              material: source.material,
              targetMaterial: material.name,
              acquisitionKind: source.kind,
              quest: source.quest || null,
              questDestination: clone(source.questDestination || null),
              eventKey: source.eventKey || null,
              eventEndsAt: source.eventEndsAt || null,
              graphNode: clone(source.graphNode || null)
            },
            progress: {
              transferPending: false,
              exchangeReady: true,
              p50ExchangeOperations: source.p50ExchangeOperations || null,
              p90ExchangeOperations: source.p90ExchangeOperations || null
            }
          });
          if (typeof logistics.clearProductionMaterialObjective === 'function') {
            logistics.clearProductionMaterialObjective('PRODUCTION_EXCHANGE_INPUT_READY_ON_MERCHANT');
          }
          return true;
        }
      }

      const deferred = evaluated.find((row) => row && ['EVENT_SOURCE_INACTIVE', 'EVENT_SOURCE_UNVERIFIED', 'QUEST_SOURCE_DESTINATION_UNVERIFIED'].includes(String(row.reason || '')));
      if (deferred) {
        const target = deferred.target || {
          output: deferred.output,
          recipient: deferred.recipient,
          slot: deferred.slot
        };
        const phase = String(deferred.reason || '').startsWith('EVENT_') ? 'EVENT_WAITING' : 'QUEST_WAITING_VALIDATION';
        persistIntentForTarget({ ...clone(plan), target: clone(target) }, target, phase, {
          reason: deferred.reason,
          material: {
            deferredSource: clone(deferred.deferredSource || null),
            acquisitionGraph: 'LEAST_GOLD_SOURCE_GRAPH_V3_QUEST_EVENT_PROBABILISTIC'
          },
          progress: { executableNow: false, permanentBlock: false }
        });
        clearProductionMaterialObjective(deferred.reason);
        return true;
      }

      persistIntentForTarget(plan, plan.target, 'BLOCKED', { reason: 'NO_KNOWN_PRODUCTION_MATERIAL_FARM_PATH' });
      clearProductionMaterialObjective('NO_KNOWN_PRODUCTION_MATERIAL_FARM_PATH');
      return false;
    }

    const selected = decision.selected;
    const material = selected.nextMaterial;
    const source = material.source;
    const expiresAt = sourceExpiry(source);
    if (expiresAt <= runtime.now()) {
      persistIntentForTarget({ ...clone(plan), target: clone(selected.target) }, selected.target, 'EVENT_WAITING', {
        reason: 'EVENT_SOURCE_EXPIRED_BEFORE_OBJECTIVE_PUBLISH',
        material: { source: clone(source) },
        progress: { executableNow: false, permanentBlock: false }
      });
      clearProductionMaterialObjective('EVENT_SOURCE_EXPIRED_BEFORE_OBJECTIVE_PUBLISH');
      return true;
    }

    setProductionExchangeDemand(source, material.name, expiresAt, selected.target);
    const exchangeBacked = isExchangeBackedSource(source);
    const farmMaterial = exchangeBacked ? source.material : material.name;
    const farmQuantity = exchangeBacked
      ? Math.max(1, Math.floor(n(source.farmQuantity, n(source.requiredPerExchange, 1))))
      : Math.max(1, Math.floor(n(material.remainingToFarm, material.quantity)));
    const farmLevel = exchangeBacked ? 0 : material.level;
    const farmPlan = { ...clone(plan), target: clone(selected.target) };
    const phase = acquisitionPhase(source, 'ACQUISITION');
    persistIntentForTarget(farmPlan, selected.target, phase, {
      reason: selected.reason,
      material: {
        material: farmMaterial,
        targetMaterial: material.name,
        level: farmLevel,
        requiredQuantity: farmQuantity,
        acquisitionKind: source.kind,
        monster: source.monster,
        map: source.map,
        quest: source.quest || null,
        questDestination: clone(source.questDestination || null),
        eventKey: source.eventKey || null,
        eventType: source.eventType || null,
        eventEndsAt: source.eventEndsAt || null,
        graphNode: clone(source.graphNode || null)
      },
      progress: {
        requiredQuantity: farmQuantity,
        heldByFarmers: Math.max(0, Math.floor(n(source.alreadyOnFarmers, material.alreadyOnFarmers))),
        remainingToFarm: Math.max(0, Math.floor(n(source.farmQuantity, material.remainingToFarm))),
        expectedHours: source.expectedHours,
        p50Hours: source.p50Hours,
        p90Hours: source.p90Hours,
        totalExpectedHours: selected.totalExpectedHours,
        totalP50Hours: selected.totalP50Hours,
        totalP90Hours: selected.totalP90Hours,
        probabilityConfidence: selected.probabilityConfidence,
        decisionQuantile: 'P90'
      }
    });
    return logistics.publishProductionMaterialObjective({
      objectiveId: `production-material:${selected.target.output}:${selected.target.recipient || ''}:${farmMaterial}`,
      output: selected.target.output,
      recipient: selected.target.recipient || null,
      slot: selected.target.slot || null,
      material: farmMaterial,
      targetMaterial: material.name,
      acquisitionKind: source.kind,
      level: farmLevel,
      requiredQuantity: farmQuantity,
      exchangeRequired: source.requiredPerExchange || null,
      exchangeRewardPerOperation: source.rewardPerExchange || null,
      expectedExchangeOperations: source.expectedExchangeOperations || null,
      p50ExchangeOperations: source.p50ExchangeOperations || null,
      p90ExchangeOperations: source.p90ExchangeOperations || null,
      monster: source.monster,
      map: source.map,
      x: source.x,
      y: source.y,
      spawnIndex: source.spawnIndex,
      expectedHours: source.expectedHours,
      p50Hours: source.p50Hours,
      p90Hours: source.p90Hours,
      totalExpectedHours: selected.totalExpectedHours,
      totalP50Hours: selected.totalP50Hours,
      totalP90Hours: selected.totalP90Hours,
      probabilityConfidence: selected.probabilityConfidence,
      timeModel: source.timeModel || PROBABILISTIC_FARM_TIME_MODEL,
      decisionQuantile: 'P90',
      maxTeamFarmHours: selected.maxTeamFarmHours,
      utilityPerFarmHour: selected.utilityPerFarmHour,
      evidence: source.evidence,
      quest: source.quest || null,
      questDestination: clone(source.questDestination || null),
      eventKey: source.eventKey || null,
      eventType: source.eventType || null,
      eventEndsAt: source.eventEndsAt || null,
      eventEvidence: source.eventEvidence || null,
      graphNode: clone(source.graphNode || null),
      expiresAt
    });
  }

  function cycle() {
    // Merchant production is installed in the shared runtime on every owned
    // character, but only the Merchant may acquire production tasks or travel
    // for bank/vendor work. Gate before any side effect, including auto-enable
    // and BANK_CATALOG task acquisition.
    if (!isMerchant()) {
      return { state: 'HOLD', reason: 'MERCHANT_PRODUCTION_ROLE_MISMATCH' };
    }
    ensureAutoEnabled();

    // Persisted non-terminal production must be reconciled before any fresh
    // task acquisition, bank refresh, production planning, or travel. Without
    // this gate a restarted exchange remains RECOVERING forever while every
    // newly planned exchange is rejected with PRODUCTION_RECONCILIATION_REQUIRED.
    const controlledAtStart = executor.status();
    const recoveringOperation = controlledAtStart && controlledAtStart.activeOperation;
    if (recoveringOperation && String(recoveringOperation.state || '') === 'RECOVERING') {
      const reconciliation = executor.reconcile();
      state.lastExecution = {
        at: runtime.now(),
        planId: recoveringOperation.planId || null,
        kind: recoveringOperation.kind || 'RECONCILE',
        result: clone(reconciliation)
      };
      if (reconciliation && reconciliation.reconciled === true && reconciliation.committed !== true) {
        const activeProductionTask = currentTask();
        if (activeProductionTask && activeProductionTask.owner === 'PRODUCTION') {
          releaseTask('PRODUCTION_RESTART_RECONCILIATION_FAILED_SAFE', {
            operation: clone(recoveringOperation),
            reconciliation: clone(reconciliation)
          });
        }
        state.pausedUntil = runtime.now() + state.failureCooldownMs;
      }
      if (runtime.log && typeof runtime.log.emit === 'function') {
        runtime.log.emit({
          component: 'merchant-production',
          event: 'PRODUCTION_RESTART_RECONCILED',
          severity: reconciliation && reconciliation.committed === true ? 'info' : 'warn',
          reason: reconciliation && reconciliation.reason || 'PRODUCTION_RECONCILIATION_COMPLETED',
          data: { operation: clone(recoveringOperation), reconciliation: clone(reconciliation) }
        });
      }
      return {
        state: 'HOLD',
        reason: reconciliation && reconciliation.committed === true
          ? 'PRODUCTION_RESTART_RECONCILED_COMMITTED'
          : 'PRODUCTION_RESTART_RECONCILED_FAILED_SAFE',
        reconciliation: clone(reconciliation)
      };
    }

    const persistedIntent = productionIntent.status();
    if (persistedIntent.recoveryPending) {
      const recoveryPlan = evaluate();
      const activeIntent = persistedIntent.active || {};
      const freshEvidence = !!(
        recoveryPlan
        && (
          recoveryPlan.target
          || Array.isArray(recoveryPlan.blockedCandidates) && recoveryPlan.blockedCandidates.length
          || ['READY', 'BLOCKED'].includes(String(recoveryPlan.state || ''))
        )
      );
      if (!freshEvidence && runtime.now() - n(activeIntent.updatedAt, runtime.now()) < state.intentRecoveryGraceMs) {
        state.lastIntentRecovery = {
          at: runtime.now(),
          reconciled: false,
          reason: 'WAITING_FOR_FRESH_PRODUCTION_REPLAN_EVIDENCE',
          targetIdentity: activeIntent.targetIdentity || null
        };
        return {
          state: 'HOLD',
          reason: 'PRODUCTION_INTENT_WAITING_FOR_FRESH_REPLAN',
          intentRecovery: clone(state.lastIntentRecovery)
        };
      }
      const intentRecovery = productionIntent.reconcile(recoveryPlan);
      state.lastIntentRecovery = { at: runtime.now(), ...clone(intentRecovery) };
      clearProductionMutationDemand('PRODUCTION_INTENT_RECONCILIATION');
      if (intentRecovery && intentRecovery.continued !== true) {
        const activeProductionTask = currentTask();
        if (activeProductionTask && activeProductionTask.owner === 'PRODUCTION') {
          releaseTask('PRODUCTION_INTENT_RECONCILIATION_FAILED_SAFE', { intentRecovery: clone(intentRecovery) });
        }
      }
      return {
        state: 'HOLD',
        reason: intentRecovery && intentRecovery.continued === true
          ? 'PRODUCTION_INTENT_RECOVERED_REPLAN_VERIFIED'
          : 'PRODUCTION_INTENT_FAILED_SAFE_REPLAN_CHANGED',
        intentRecovery: clone(intentRecovery)
      };
    }

    const task = currentTask();
    if (task && task.owner !== 'PRODUCTION') {
      return { state: 'HOLD', reason: 'MERCHANT_TASK_OWNED_BY_OTHER_SUBSYSTEM', task: clone(task) };
    }
    if (state.executionPending) {
      return { state: 'HOLD', reason: 'MERCHANT_PRODUCTION_EXECUTION_PENDING', task: clone(task) };
    }
    if (ensureBankCatalog()) return { state: 'HOLD', reason: 'BANK_CATALOG_REFRESH_IN_PROGRESS' };

    const active = currentTask();
    if (active && active.owner === 'PRODUCTION' && active.kind === 'EXCHANGE_BATCH') {
      const exchangePlan = planner.planExchange(input(), state.lastPlan && state.lastPlan.reservations || {});
      if (exchangePlan) {
        state.lastPlan = clone(exchangePlan);
        schedule(exchangePlan);
        return clone(exchangePlan);
      }
      releaseTask('EXCHANGE_BATCH_DRAINED');
    }

    const plan = evaluate();
    if (plan && plan.state === 'READY') {
      persistIntentForTarget(plan, plan.target, 'READY', { reason: 'PRODUCTION_CHAIN_READY' });
      clearProductionMutationDemand('PRODUCTION_CHAIN_READY');
      clearProductionMaterialObjective('PRODUCTION_CHAIN_READY');
    } else if (plan && plan.state === 'BLOCKED') {
      if (scheduleProductionMutation(plan)) return plan;
      clearProductionMutationDemand('NO_ACTIONABLE_PRODUCTION_MUTATION');
      const materialHandled = publishProductionMaterialObjective(plan);
      if (!materialHandled) persistIntentForTarget(plan, plan.target, 'BLOCKED', { reason: plan.reason || 'PRODUCTION_CHAIN_BLOCKED' });
    } else {
      clearProductionMutationDemand('PRODUCTION_PLAN_NOT_BLOCKED');
    }
    if (schedule(plan)) return plan;

    if (plan && plan.state !== 'READY' && !collectionBusy() && !state.executionPending) {
      const consolidationPlan = planner.planMaterialConsolidation(input());
      if (consolidationPlan) {
        state.lastPlan = clone(consolidationPlan);
        schedule(consolidationPlan);
        return clone(consolidationPlan);
      }
      const exchangePlan = planner.planExchange(input(), plan.reservations || {});
      if (exchangePlan) {
        state.lastPlan = clone(exchangePlan);
        schedule(exchangePlan);
        return clone(exchangePlan);
      }
    }

    const remaining = currentTask();
    if (remaining && remaining.owner === 'PRODUCTION' && remaining.kind === 'PRODUCTION_CHAIN' && (!plan || plan.state !== 'READY')) {
      releaseTask('PRODUCTION_CHAIN_DRAINED', { reason: plan && plan.reason || null });
    }
    return plan;
  }
  function configure(config = {}) {
    if (config.enabled === true && !isMerchant()) {
      return { ...status(), enableRejected: 'MERCHANT_PRODUCTION_ROLE_MISMATCH' };
    }
    if (config.enabled === true && typeof runtime._liveEnableGate === 'function') {
      const gate = runtime._liveEnableGate();
      if (!gate || gate.allowed !== true) return { ...status(), enableRejected: gate && gate.reason || 'LIVE_GATE_REJECTED' };
    }
    executor.configure({ enabled: config.enabled === true, ack: config.ack, allowBuy: config.allowBuy === true, allowBank: config.allowBank === true, allowCraft: config.allowCraft === true, allowExchange: config.allowExchange === true });
    return status();
  }
  function disable(reason = 'OPERATOR_DISABLED') { clearProductionMutationDemand(reason); executor.disable(reason); return status(); }
  function reconcile() { return executor.reconcile(); }
  function status() {
    return {
      schemaVersion: 1,
      mode: MERCHANT_PRODUCTION_CONTROLLER_MODE,
      planner: planner.status(),
      controlled: executor.status(),
      interactionArrival: {
        safetyFactor: INTERACTION_SAFETY_FACTOR,
        npcMaxRange: interactionMaxRange(runtime.root, 'npc'),
        npcBufferedRange: bufferedInteractionRange(runtime.root, 'npc')
      },
      bankCatalog: bankCatalog.status(),
      productionIntent: productionIntent.status(),
      productionCoverageAudit: productionCoverageAudit.status(),
      productionSoakAudit: productionSoakAuditor.status(),
      roleEligible: isMerchant(),
      autoLiveEnabled: isMerchant(),
      nonMerchantSideEffectsBlocked: true,
      collectionSessionBlocksProduction: collectionBusy(),
      intervalMs: state.intervalMs,
      lastPlan: clone(state.lastPlan),
      lastExecution: clone(state.lastExecution),
      executionPending: state.executionPending,
      alpha27Busy: alpha27Busy(),
      pausedUntil: state.pausedUntil || null,
      failureCooldownMs: state.failureCooldownMs,
      teamMaterialFarmPolicy: {
        teamActsTogether: true,
        multiFarmerSplit: false,
        maxTeamFarmHours: state.maxTeamFarmHours,
        fallbackKillsPerHour: state.fallbackKillsPerHour,
        objectiveTtlMs: state.materialObjectiveTtlMs,
        longPathsAreDeferredNotBlocked: true,
        preferredFarmHoursThreshold: state.maxTeamFarmHours,
        gearBenefitPrimary: true,
        characterLevelUsedForStrengthRanking: false,
        exchangeBackedMaterialAcquisition: true,
        questExchangeMaterialAcquisition: true,
        eventGatedMaterialAcquisition: true,
        inactiveEventsDeferredNotPermanentlyBlocked: true,
        leveledRecipeMaterialAcquisition: true,
        acquisitionGraph: 'LEAST_GOLD_SOURCE_GRAPH_V3_QUEST_EVENT_PROBABILISTIC',
        farmTimeModel: PROBABILISTIC_FARM_TIME_MODEL,
        farmTimeDecisionQuantile: 'P90',
        expectedHoursTelemetryOnly: true,
        mutationAuthority: 'ALPHA27_ATOMIC_ONLY',
        mutationDemandTtlMs: state.mutationDemandTtlMs,
        intentRecoveryGraceMs: state.intentRecoveryGraceMs,
        persistedProductionIntent: true,
        restartContinuationRequiresFreshReplanIdentityMatch: true,
        materialHandoffPausesFarmerCombat: true,
        finalCraftCompletionRequiresRecipientVerification: true,
        outputReadyPhase: 'OUTPUT_READY_FOR_DELIVERY',
        completionReason: 'FINAL_PRODUCTION_RECIPIENT_VERIFIED',
        lastIntentRecovery: clone(state.lastIntentRecovery),
        lastMutationDemand: clone(state.lastMutationDemand),
        mutationExecutions: state.mutationExecutions,
        mutationHolds: state.mutationHolds,
        lastDecision: clone(state.lastMaterialFarmDecision)
      },
      taskCoordinator: taskCoordinator() && typeof taskCoordinator().status === 'function' ? taskCoordinator().status() : null,
      nonPreemptiveTaskOwner: 'PRODUCTION',
      explicitAckRequired: CONTROLLED_MERCHANT_PRODUCTION_ACK
    };
  }

  const baseTick = runtime.tick.bind(runtime);
  runtime.tick = function merchantProductionTick() {
    const result = baseTick();
    const now = runtime.now();
    if (isMerchant() && now - state.lastCycleAt >= state.intervalMs) { state.lastCycleAt = now; cycle(); }
    return result;
  };

  const baseStatus = runtime.status.bind(runtime);
  runtime.status = function merchantProductionStatusWrapped() { return { ...baseStatus(), merchantProduction: status() }; };

  const baseExport = runtime.exportDiagnostics.bind(runtime);
  runtime.exportDiagnostics = function merchantProductionDiagnostics() {
    const data = JSON.parse(baseExport());
    data.context = data.context || {};
    data.context.merchantProduction = status();
    return JSON.stringify(data, null, 2);
  };

  const baseSetMode = runtime.setMode.bind(runtime);
  runtime.setMode = function merchantProductionSetMode(mode) { const resolved = baseSetMode(mode); if (resolved !== 'active') disable('RUNTIME_LEFT_ACTIVE_MODE'); return resolved; };

  const baseStop = runtime.stop.bind(runtime);
  runtime.stop = function merchantProductionStop() { disable('RUNTIME_STOP'); return baseStop(); };

  function auditProductionCoverage() {
    return productionCoverageAudit.auditAllGear();
  }

  function observeProductionSoakSample(sample = {}) {
    return productionSoakAuditor.observe(sample);
  }

  runtime.merchantProductionPlanner = planner;
  runtime.productionAcquisitionCoverageAudit = productionCoverageAudit;
  runtime.productionGraphSoakAuditor = productionSoakAuditor;
  runtime.auditProductionCoverage = auditProductionCoverage;
  runtime.observeProductionSoakSample = observeProductionSoakSample;
  runtime.merchantBankCatalog = bankCatalog;
  runtime.persistentProductionIntent = productionIntent;
  runtime.controlledMerchantProduction = executor;
  runtime.configureMerchantProduction = configure;
  runtime.disableMerchantProduction = disable;
  runtime.reconcileMerchantProduction = reconcile;
  runtime.evaluateMerchantProduction = cycle;
  runtime.merchantProductionStatus = status;

  const controller = {
    planner,
    executor,
    bankCatalog,
    productionIntent,
    productionCoverageAudit,
    productionSoakAuditor,
    auditProductionCoverage,
    observeProductionSoakSample,
    evaluate,
    cycle,
    configure,
    disable,
    reconcile,
    status,
    ack: CONTROLLED_MERCHANT_PRODUCTION_ACK
  };
  runtime.__merchantProductionController = controller;
  return controller;
}

module.exports = { installMerchantProduction, MERCHANT_PRODUCTION_CONTROLLER_MODE, CONTROLLED_MERCHANT_PRODUCTION_ACK };
