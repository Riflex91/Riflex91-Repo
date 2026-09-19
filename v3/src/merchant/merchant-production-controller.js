'use strict';

const { MerchantProductionPlanner, ProductionStepKind } = require('./merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('./controlled-merchant-production-executor');
const { PersistentBankCatalog } = require('./persistent-bank-catalog');
const { bufferedInteractionRange, interactionMaxRange, INTERACTION_SAFETY_FACTOR } = require('../reliability/alpha27-atomic-service');
const { chooseProductionTeamFarmObjective, DEFAULT_MAX_TEAM_FARM_HOURS, DEFAULT_FALLBACK_KILLS_PER_HOUR } = require('../party/production-material-acquisition');

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
    lastMaterialFarmDecision: null,
    lastMutationDemand: null,
    mutationExecutions: 0,
    mutationHolds: 0
  };

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
    const lock = acquireTask(plan);
    if (!lock.acquired) return false;
    const step = plan.nextStep;
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
      acquisitionGraph: 'LEAST_GOLD_SOURCE_GRAPH_V2_MUTATION_AWARE',
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
        source: 'MERCHANT_PRODUCTION_ACQUISITION_V2',
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
      clearProductionMutationDemand('PRODUCTION_MUTATION_ATTEMPT_COMPLETE_REPLAN');
      state.executionPending = false;
    });
    return true;
  }

  function setProductionExchangeDemand(source = null, targetMaterial = null, expiresAt = null) {
    const existing = Array.isArray(runtime.merchantExchangeDemands) ? runtime.merchantExchangeDemands : [];
    const retained = existing.filter((row) => row && String(row.reason || '') !== 'PRODUCTION_MATERIAL');
    if (source && source.kind === 'EXCHANGE_MATERIAL_DROP' && source.material) {
      retained.push({
        item: String(source.material),
        target: String(source.targetMaterial || targetMaterial || ''),
        reason: 'PRODUCTION_MATERIAL',
        expiresAt: Number(expiresAt) || runtime.now() + state.materialObjectiveTtlMs
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
      const awaitingTransfer = (decision.evaluated || []).some((row) => row && row.reason === 'MATERIAL_ALREADY_HELD_BY_FARMERS_AWAIT_TRANSFER');
      if (awaitingTransfer) return true;
      clearProductionMaterialObjective('NO_KNOWN_PRODUCTION_MATERIAL_FARM_PATH');
      return false;
    }
    const selected = decision.selected;
    const material = selected.nextMaterial;
    const source = material.source;
    const expiresAt = runtime.now() + state.materialObjectiveTtlMs;
    setProductionExchangeDemand(source, material.name, expiresAt);
    const farmMaterial = source.kind === 'EXCHANGE_MATERIAL_DROP' ? source.material : material.name;
    const farmQuantity = source.kind === 'EXCHANGE_MATERIAL_DROP'
      ? Math.max(1, Math.floor(n(source.farmQuantity, n(source.requiredPerExchange, 1))))
      : Math.max(1, Math.floor(n(material.remainingToFarm, material.quantity)));
    return logistics.publishProductionMaterialObjective({
      objectiveId: `production-material:${selected.target.output}:${selected.target.recipient || ''}:${farmMaterial}`,
      output: selected.target.output,
      recipient: selected.target.recipient || null,
      slot: selected.target.slot || null,
      material: farmMaterial,
      targetMaterial: material.name,
      acquisitionKind: source.kind,
      level: source.kind === 'EXCHANGE_MATERIAL_DROP' ? 0 : material.level,
      requiredQuantity: farmQuantity,
      exchangeRequired: source.requiredPerExchange || null,
      exchangeRewardPerOperation: source.rewardPerExchange || null,
      monster: source.monster,
      map: source.map,
      x: source.x,
      y: source.y,
      spawnIndex: source.spawnIndex,
      expectedHours: source.expectedHours,
      totalExpectedHours: selected.totalExpectedHours,
      maxTeamFarmHours: selected.maxTeamFarmHours,
      utilityPerFarmHour: selected.utilityPerFarmHour,
      evidence: source.evidence,
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
      clearProductionMutationDemand('PRODUCTION_CHAIN_READY');
      clearProductionMaterialObjective('PRODUCTION_CHAIN_READY');
    } else if (plan && plan.state === 'BLOCKED') {
      if (scheduleProductionMutation(plan)) return plan;
      clearProductionMutationDemand('NO_ACTIONABLE_PRODUCTION_MUTATION');
      publishProductionMaterialObjective(plan);
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
        leveledRecipeMaterialAcquisition: true,
        acquisitionGraph: 'LEAST_GOLD_SOURCE_GRAPH_V2_MUTATION_AWARE',
        mutationAuthority: 'ALPHA27_ATOMIC_ONLY',
        mutationDemandTtlMs: state.mutationDemandTtlMs,
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

  runtime.merchantProductionPlanner = planner;
  runtime.merchantBankCatalog = bankCatalog;
  runtime.controlledMerchantProduction = executor;
  runtime.configureMerchantProduction = configure;
  runtime.disableMerchantProduction = disable;
  runtime.reconcileMerchantProduction = reconcile;
  runtime.evaluateMerchantProduction = cycle;
  runtime.merchantProductionStatus = status;

  const controller = { planner, executor, bankCatalog, evaluate, cycle, configure, disable, reconcile, status, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK };
  runtime.__merchantProductionController = controller;
  return controller;
}

module.exports = { installMerchantProduction, MERCHANT_PRODUCTION_CONTROLLER_MODE, CONTROLLED_MERCHANT_PRODUCTION_ACK };
