'use strict';

const { Alpha20Runtime } = require('./alpha20-runtime');
const { MerchantServicePlanner, MerchantServicePlanKind } = require('../merchant/merchant-service-planner');
const { ControlledMerchantServiceExecutor, CONTROLLED_MERCHANT_SERVICE_ACK } = require('../merchant/controlled-merchant-service-executor');
const { RouteCostEstimator } = require('../travel/route-cost-estimator');

const ALPHA20_5_MERCHANT_RUNTIME_MODE = 'alpha20.5-merchant-service-foundation';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class Alpha20_5MerchantRuntime extends Alpha20Runtime {
  constructor(options = {}) {
    super(options);
    this.merchantServicePlanner = options.merchantServicePlanner || new MerchantServicePlanner({
      now: this.now,
      reportTtlMs: options.merchantServiceReportTtlMs,
      criticalPotionCount: options.merchantServiceCriticalPotionCount,
      lowPotionCount: options.merchantServiceLowPotionCount,
      targetPotionCount: options.merchantServiceTargetPotionCount,
      merchantPotionReserve: options.merchantServicePotionReserve,
      maxDeliveryQuantity: options.merchantServiceMaxDeliveryQuantity,
      criticalFreeSlots: options.merchantServiceCriticalFreeSlots,
      lowFreeSlots: options.merchantServiceLowFreeSlots,
      standWhenIdle: options.merchantServiceStandWhenIdle
    });
    this.merchantRouteEstimator = options.merchantRouteEstimator || new RouteCostEstimator({
      minTownSavingsMs: options.merchantRouteMinTownSavingsMs,
      defaultUncertaintyMs: options.merchantRouteUncertaintyMs
    });
    this.controlledMerchantService = options.controlledMerchantService || new ControlledMerchantServiceExecutor({
      root: this.root,
      now: this.now,
      log: this.log,
      storage: options.merchantServiceStorage || options.storage,
      storageKey: options.merchantServiceStorageKey,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getEconomyEmergency: () => this._alpha20EconomyEmergency(),
      getTrustedNames: () => this.partyTelemetry && this.partyTelemetry.status ? this.partyTelemetry.status().trustedNames : [],
      timeoutMs: options.merchantServiceTimeoutMs,
      verifyDelayMs: options.merchantServiceVerifyDelayMs,
      verifyAttempts: options.merchantServiceVerifyAttempts,
      maxDeliveryDistance: options.merchantServiceMaxDeliveryDistance,
      failureThreshold: options.merchantServiceFailureThreshold,
      failureWindowMs: options.merchantServiceFailureWindowMs,
      circuitCooldownMs: options.merchantServiceCircuitCooldownMs,
      actionWindowMs: options.merchantServiceActionWindowMs,
      maxActionsPerWindow: options.merchantServiceMaxActionsPerWindow
    });
    this.merchantServiceIntervalMs = Math.max(500, Math.min(30000, finite(options.merchantServiceIntervalMs, 2000)));
    this.lastMerchantServiceAt = -Infinity;
    this.lastMerchantServicePlan = null;
    this.lastMerchantServiceExecution = null;
    this.lastMerchantRouteDecision = null;
    this.merchantServiceAllowTravel = false;
    this.merchantTownEtaMs = finite(options.merchantTownEtaMs);
    this.merchantServiceExecutionPending = false;
    this.merchantServiceNoticeKey = null;
  }

  _localMerchant() {
    const c = this.lastSnapshot && this.lastSnapshot.character;
    return !!(c && String(c.ctype || '').toLowerCase() === 'merchant');
  }

  _merchantInCombat() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return false;
    const c = snapshot.character;
    if (c.target) return true;
    return (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name);
  }

  _controlledMerchantBusy() {
    return !!(
      this.controlledMerchantService && this.controlledMerchantService.status().busy ||
      this.controlledTravel && this.controlledTravel.status().busy ||
      this.controlledMerchant && this.controlledMerchant.status().busy ||
      this.controlledMerchantSpaceRecovery && this.controlledMerchantSpaceRecovery.status().busy ||
      this.controlledPartyLifecycle && this.controlledPartyLifecycle.status().busy
    );
  }

  _standOpen() {
    const c = this.root && (this.root.character || (this.root.parent && this.root.parent.character));
    return !!(c && c.stand);
  }

  _routeDecision(plan) {
    if (!plan || plan.kind !== MerchantServicePlanKind.SERVICE_TRAVEL || !plan.target) return null;
    const c = this.lastSnapshot && this.lastSnapshot.character || {};
    const sameMap = c.map && plan.target.map && String(c.map) === String(plan.target.map);
    const cx = finite(c.x); const cy = finite(c.y); const tx = finite(plan.target.x); const ty = finite(plan.target.y);
    const distance = sameMap && cx != null && cy != null && tx != null && ty != null ? Math.hypot(cx - tx, cy - ty) : null;
    const directEtaMs = distance != null && finite(c.speed) > 0 ? distance / finite(c.speed) * 1000 : null;
    const needPriority = plan.need && Number(plan.need.priority) >= 95 ? 'CRITICAL' : 'NORMAL';
    return this.merchantRouteEstimator.choose({
      directEtaMs,
      distance,
      speed: finite(c.speed),
      townAvailable: !!(this.root && typeof this.root.town === 'function'),
      townEtaMs: this.merchantTownEtaMs,
      urgency: needPriority
    });
  }

  _servicePlanInput() {
    const snapshot = this.lastSnapshot;
    const telemetry = this.partyTelemetry && this.partyTelemetry.status ? this.partyTelemetry.status() : { reports: [] };
    return {
      merchant: snapshot && snapshot.character || {},
      reports: telemetry.reports || [],
      standOpen: this._standOpen(),
      inCombat: this._merchantInCombat(),
      economyEmergency: this._alpha20EconomyEmergency(),
      controlledBusy: this._controlledMerchantBusy(),
      deliveryDistance: this.controlledMerchantService.status().maxDeliveryDistance
    };
  }

  _noteMerchantServicePlan(plan) {
    if (!plan) return;
    const key = `${plan.kind}:${plan.reason}:${plan.target && plan.target.name || '-'}`;
    if (key === this.merchantServiceNoticeKey) return;
    this.merchantServiceNoticeKey = key;
    this.log.emit({ component: 'merchant-service', event: 'MERCHANT_SERVICE_PLAN', severity: plan.kind === MerchantServicePlanKind.RESTOCK_REQUIRED || plan.kind === MerchantServicePlanKind.COLLECTION_REQUIRED ? 'warn' : 'info', reason: plan.reason, data: { kind: plan.kind, target: plan.target || null, need: plan.need || null } });
  }

  _merchantServiceAuditData(plan, result) {
    const delivery = plan && plan.delivery || {};
    const target = plan && plan.target || {};
    return {
      planId: plan && plan.id || null,
      kind: plan && plan.kind || null,
      targetName: result && result.targetName || target.name || null,
      itemName: result && result.itemName || delivery.itemName || null,
      quantity: finite(result && result.quantity, finite(delivery.quantity)),
      sourceReportAt: finite(result && result.sourceReportAt, finite(plan && plan.sourceReportAt)),
      standSlot: finite(result && result.standSlot),
      committed: result && result.committed === true,
      executed: result && result.executed === true,
      route: result && result.route ? clone(result.route) : null
    };
  }

  async _executeMerchantTravel(plan) {
    if (!this.merchantServiceAllowTravel) return { executed: false, reason: 'MERCHANT_SERVICE_TRAVEL_AUTHORITY_DISABLED' };
    if (!this.controlledTravel || !this.controlledTravel.status().enabled) return { executed: false, reason: 'CONTROLLED_TRAVEL_NOT_ENABLED' };
    if (!plan.target || !plan.target.map || finite(plan.target.x) == null || finite(plan.target.y) == null) return { executed: false, reason: 'SERVICE_TARGET_POSITION_UNAVAILABLE' };
    if (this.lastMerchantRouteDecision && this.lastMerchantRouteDecision.route === 'TOWN') {
      return { executed: false, reason: 'TOWN_ROUTE_RECOMMENDED_BUT_LIVE_TOWN_AUTHORITY_NOT_IMPLEMENTED', route: clone(this.lastMerchantRouteDecision) };
    }
    const planned = this.planTravel({
      destination: { map: plan.target.map, x: plan.target.x, y: plan.target.y },
      metadata: { source: 'MERCHANT_SERVICE', servicePlanId: plan.id, targetName: plan.target.name }
    });
    if (!planned || planned.accepted !== true || !planned.plan) return { executed: false, reason: planned && planned.reason || 'SERVICE_TRAVEL_PLAN_REJECTED' };
    return this.executeTravelPlan(planned.plan.id);
  }

  _scheduleMerchantServiceExecution(plan) {
    if (this.merchantServiceExecutionPending || !plan) return false;
    const controlled = this.controlledMerchantService.status();
    if (!controlled.enabled) return false;
    const executable = [MerchantServicePlanKind.STAND_OPEN, MerchantServicePlanKind.STAND_CLOSE, MerchantServicePlanKind.SERVICE_DELIVERY, MerchantServicePlanKind.SERVICE_TRAVEL].includes(plan.kind);
    if (!executable) return false;
    this.merchantServiceExecutionPending = true;
    const pending = plan.kind === MerchantServicePlanKind.SERVICE_TRAVEL ? this._executeMerchantTravel(plan) : this.controlledMerchantService.execute(plan);
    Promise.resolve(pending)
      .then((result) => {
        this.lastMerchantServiceExecution = { at: this.now(), planId: plan.id, kind: plan.kind, result: clone(result) };
        if (result && result.committed === true) {
          this.log.emit({
            component: 'merchant-service',
            event: 'MERCHANT_SERVICE_EXECUTION_COMMITTED',
            severity: 'info',
            reason: result.reason || 'COMMITTED',
            data: this._merchantServiceAuditData(plan, result)
          });
        }
      })
      .catch((error) => {
        this.lastMerchantServiceExecution = { at: this.now(), planId: plan.id, kind: plan.kind, result: { executed: false, reason: 'UNHANDLED_MERCHANT_SERVICE_ERROR', error: String(error && error.message || error) } };
        this.log.emit({ component: 'merchant-service', event: 'MERCHANT_SERVICE_EXECUTION_ERROR', severity: 'error', reason: 'UNHANDLED_MERCHANT_SERVICE_ERROR', data: { message: String(error && error.message || error) } });
      })
      .finally(() => { this.merchantServiceExecutionPending = false; });
    return true;
  }

  _merchantServiceCycle() {
    if (!this._localMerchant()) return null;
    const plan = this.merchantServicePlanner.plan(this._servicePlanInput());
    this.lastMerchantServicePlan = plan;
    this.lastMerchantRouteDecision = this._routeDecision(plan);
    this._noteMerchantServicePlan(plan);
    this._scheduleMerchantServiceExecution(plan);
    return plan;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastMerchantServiceAt >= this.merchantServiceIntervalMs) {
      this.lastMerchantServiceAt = now;
      this._merchantServiceCycle();
    }
  }

  configureMerchantService(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledMerchantService.disable(gate.reason);
        this.merchantServiceAllowTravel = false;
        return { ...this.merchantServiceStatus(), enableRejected: gate.reason };
      }
    }
    const controlled = this.controlledMerchantService.configure({
      enabled: config.enabled === true,
      ack: config.ack,
      allowStand: config.allowStand === true,
      allowDelivery: config.allowDelivery === true
    });
    this.merchantServiceAllowTravel = controlled.enabled && config.ack === CONTROLLED_MERCHANT_SERVICE_ACK && config.allowTravel === true;
    return this.merchantServiceStatus();
  }

  disableMerchantService(reason = 'OPERATOR_DISABLED') {
    this.merchantServiceAllowTravel = false;
    this.controlledMerchantService.disable(reason);
    return this.merchantServiceStatus();
  }

  reconcileMerchantService() {
    return this.controlledMerchantService.reconcile();
  }

  merchantServiceStatus() {
    return {
      schemaVersion: 1,
      mode: ALPHA20_5_MERCHANT_RUNTIME_MODE,
      planner: this.merchantServicePlanner.status(),
      controlled: this.controlledMerchantService.status(),
      allowTravel: this.merchantServiceAllowTravel,
      liveTownAuthority: false,
      liveBuyAuthority: false,
      liveCollectionAuthority: false,
      routeEstimator: this.merchantRouteEstimator.status(),
      lastPlan: clone(this.lastMerchantServicePlan),
      lastRouteDecision: clone(this.lastMerchantRouteDecision),
      lastExecution: clone(this.lastMerchantServiceExecution),
      executionPending: this.merchantServiceExecutionPending,
      intervalMs: this.merchantServiceIntervalMs,
      explicitAckRequired: CONTROLLED_MERCHANT_SERVICE_ACK
    };
  }

  _guardControlledAuthority() {
    const base = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (this.controlledMerchantService.breaker().open) reason = 'MERCHANT_SERVICE_CIRCUIT_OPEN';
    else if (this._alpha20EconomyEmergency()) reason = 'ECONOMY_EMERGENCY';
    if (reason && this.controlledMerchantService.status().enabled) this.disableMerchantService(reason);
    return { ...base, merchantServiceGuardReason: reason };
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') this.disableMerchantService('RUNTIME_LEFT_ACTIVE_MODE');
    return resolved;
  }

  stop() {
    this.disableMerchantService('RUNTIME_STOP');
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      merchantService: this.merchantServiceStatus(),
      alpha20_5: {
        ...(base.alpha20_5 || {}),
        merchantServiceFoundation: true,
        farmerSupplyTelemetry: true,
        standControlledDefaultOff: true,
        potionDeliveryControlledDefaultOff: true,
        serviceTravelRequiresExistingControlledTravel: true,
        inventoryCollectionPlanningOnly: true,
        potionRestockPlanningOnly: true,
        townRouteComparisonShadowOnly: true,
        directGameplayAuthorityAddedToBrain: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.merchantService = this.merchantServiceStatus();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha20_5MerchantRuntime, ALPHA20_5_MERCHANT_RUNTIME_MODE, CONTROLLED_MERCHANT_SERVICE_ACK };