'use strict';

const { MerchantProductionPlanner, ProductionStepKind } = require('./merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('./controlled-merchant-production-executor');
const { PersistentBankCatalog } = require('./persistent-bank-catalog');
const { bufferedInteractionRange, interactionMaxRange, INTERACTION_SAFETY_FACTOR } = require('../reliability/alpha27-atomic-service');

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
    failureCooldownMs: Math.max(5000, Math.min(30 * 60 * 1000, n(options.merchantProductionFailureCooldownMs, 120000)))
  };

  function taskCoordinator() { return runtime.merchantTaskCoordinator || null; }
  function currentTask() { const c = taskCoordinator(); return c && typeof c.current === 'function' ? c.current() : null; }
  function productionTaskKey(plan) {
    if (!plan) return null;
    if (plan.nextStep && plan.nextStep.kind === ProductionStepKind.EXCHANGE) {
      return `production:exchange:${String(plan.nextStep.name || '')}:${String(plan.exchangeDemand && plan.exchangeDemand.target || plan.target && plan.target.item || '')}`;
    }
    const output = plan.target && (plan.target.output || plan.target.item) || null;
    const recipient = plan.target && plan.target.recipient || null;
    return output ? `production:chain:${String(output)}:${String(recipient || '')}` : null;
  }
  function acquireTask(plan, kind = null) {
    const coordinator = taskCoordinator();
    if (!coordinator || typeof coordinator.acquire !== 'function') return { acquired: true, task: null };
    const key = productionTaskKey(plan);
    if (!key) return { acquired: false, reason: 'PRODUCTION_TASK_KEY_UNAVAILABLE', task: coordinator.current() };
    const metadata = plan.nextStep && plan.nextStep.kind === ProductionStepKind.EXCHANGE
      ? { exchangeItem: plan.nextStep.name, target: plan.exchangeDemand && plan.exchangeDemand.target || null }
      : { output: plan.target && plan.target.output || null, recipient: plan.target && plan.target.recipient || null, slot: plan.target && plan.target.slot || null };
    return coordinator.acquire('PRODUCTION', kind || (plan.nextStep && plan.nextStep.kind === ProductionStepKind.EXCHANGE ? 'EXCHANGE_BATCH' : 'PRODUCTION_CHAIN'), key, metadata);
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
    state.lastPlan = planner.plan(input());
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
    if (schedule(plan)) return plan;

    if (plan && plan.state !== 'READY' && !collectionBusy() && !state.executionPending) {
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
  function disable(reason = 'OPERATOR_DISABLED') { executor.disable(reason); return status(); }
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
