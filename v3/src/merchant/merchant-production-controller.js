'use strict';

const { MerchantProductionPlanner, ProductionStepKind } = require('./merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('./controlled-merchant-production-executor');

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

  function character() { return runtime.root && (runtime.root.character || (runtime.root.parent && runtime.root.parent.character)) || null; }
  function isMerchant() { const c = character(); return !!(c && String(c.ctype || c.type || '').toLowerCase() === 'merchant'); }
  function inCombat() { const c = character(); if (!c) return false; if (c.target) return true; const entities = runtime.root && runtime.root.parent && runtime.root.parent.entities || runtime.root && runtime.root.entities || {}; const ids = new Set([c.name, c.id].filter(Boolean).map(String)); return Object.values(entities).some((e) => e && e.target && ids.has(String(e.target))); }
  function alpha27Busy() {
    const convergence = runtime.alpha27CombatMerchantConvergence;
    const merchant = convergence && convergence.merchant;
    const atomic = merchant && merchant.atomic;
    return !!(atomic && (atomic.merchantBusy || atomic.serviceTravelBusy));
  }
  function controlledBusy() {
    const systems = [runtime.controlledMerchantService, runtime.controlledTravel, runtime.controlledMerchant, runtime.controlledMerchantSpaceRecovery, runtime.controlledPartyLifecycle];
    return systems.some((system) => { try { return !!(system && system.status && system.status().busy); } catch (_) { return true; } }) || executor.status().busy || alpha27Busy();
  }
  function input() {
    return {
      character: character() || {},
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
    return Math.hypot(cx - vx, cy - vy) <= 450;
  }

  function evaluate() {
    if (!isMerchant()) return null;
    state.lastPlan = planner.plan(input());
    return clone(state.lastPlan);
  }

  function schedule(plan) {
    if (!plan || plan.state !== 'READY' || !plan.nextStep || state.executionPending || !executor.status().enabled) return false;
    if (runtime.now() < state.pausedUntil) return false;
    if (!vendorNearby(plan.nextStep)) {
      state.lastExecution = { at: runtime.now(), planId: plan.id, kind: plan.nextStep.kind, result: { executed: false, committed: false, reason: 'VENDOR_TRAVEL_REQUIRED', vendor: clone(plan.nextStep.vendor) } };
      return false;
    }
    state.executionPending = true;
    Promise.resolve(executor.execute(plan, plan.nextStep))
      .then((result) => {
        state.lastExecution = { at: runtime.now(), planId: plan.id, kind: plan.nextStep.kind, result: clone(result) };
        if (result && result.executed === true && result.committed !== true) state.pausedUntil = runtime.now() + state.failureCooldownMs;
        if (runtime.log && typeof runtime.log.emit === 'function') runtime.log.emit({ component: 'merchant-production', event: result && result.committed ? 'PRODUCTION_STEP_COMMITTED' : 'PRODUCTION_STEP_RESULT', severity: result && result.committed ? 'info' : 'warn', reason: result && result.reason || 'UNKNOWN', data: { planId: plan.id, kind: plan.nextStep.kind, item: plan.nextStep.name } });
      })
      .catch((error) => {
        state.pausedUntil = runtime.now() + state.failureCooldownMs;
        state.lastExecution = { at: runtime.now(), planId: plan.id, kind: plan.nextStep.kind, result: { executed: false, committed: false, reason: 'UNHANDLED_PRODUCTION_ERROR', error: String(error && error.message || error) } };
      })
      .finally(() => { state.executionPending = false; });
    return true;
  }

  function cycle() { const plan = evaluate(); schedule(plan); return plan; }
  function configure(config = {}) {
    if (config.enabled === true && typeof runtime._liveEnableGate === 'function') {
      const gate = runtime._liveEnableGate();
      if (!gate || gate.allowed !== true) return { ...status(), enableRejected: gate && gate.reason || 'LIVE_GATE_REJECTED' };
    }
    executor.configure({ enabled: config.enabled === true, ack: config.ack, allowBuy: config.allowBuy === true, allowBank: config.allowBank === true, allowCraft: config.allowCraft === true });
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
      intervalMs: state.intervalMs,
      lastPlan: clone(state.lastPlan),
      lastExecution: clone(state.lastExecution),
      executionPending: state.executionPending,
      alpha27Busy: alpha27Busy(),
      pausedUntil: state.pausedUntil || null,
      failureCooldownMs: state.failureCooldownMs,
      explicitAckRequired: CONTROLLED_MERCHANT_PRODUCTION_ACK
    };
  }

  const baseTick = runtime.tick.bind(runtime);
  runtime.tick = function merchantProductionTick() {
    const result = baseTick();
    const now = runtime.now();
    if (now - state.lastCycleAt >= state.intervalMs) { state.lastCycleAt = now; cycle(); }
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
  runtime.controlledMerchantProduction = executor;
  runtime.configureMerchantProduction = configure;
  runtime.disableMerchantProduction = disable;
  runtime.reconcileMerchantProduction = reconcile;
  runtime.evaluateMerchantProduction = cycle;
  runtime.merchantProductionStatus = status;

  const controller = { planner, executor, evaluate, cycle, configure, disable, reconcile, status, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK };
  runtime.__merchantProductionController = controller;
  return controller;
}

module.exports = { installMerchantProduction, MERCHANT_PRODUCTION_CONTROLLER_MODE, CONTROLLED_MERCHANT_PRODUCTION_ACK };
