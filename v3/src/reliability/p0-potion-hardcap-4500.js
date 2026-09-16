'use strict';

const { MerchantServicePlanKind } = require('../merchant/merchant-service-planner');
const { POTION_TARGET_COUNT, MERCHANT_POTION_RESERVE } = require('./p0-potion-policy-4500');

const P0_POTION_HARDCAP_4500_MODE = 'p0-potion-hardcap-4500-v2';

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function reportFor(input, targetName) {
  return (Array.isArray(input && input.reports) ? input.reports : []).find((row) => row && String(row.name || '') === String(targetName || '')) || null;
}

function farmerCount(report, family) {
  const supplies = report && report.supplies || {};
  return Math.max(0, Math.floor(finite(family === 'hp' ? supplies.hpPotions : supplies.mpPotions, 0)));
}

function assessAdaptivePlan(input, plan) {
  if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500 && plan.metadata.p0PotionBundle)) {
    return { adaptive: false, violations: [] };
  }
  const targetName = plan.target && String(plan.target.name || '');
  const report = reportFor(input, targetName);
  if (!report) return { adaptive: true, targetName, reportMissing: true, violations: [] };

  const shortfalls = {
    hpot0: Math.max(0, POTION_TARGET_COUNT - farmerCount(report, 'hp')),
    mpot0: Math.max(0, POTION_TARGET_COUNT - farmerCount(report, 'mp'))
  };
  const deliveries = Array.isArray(plan.deliveries) ? plan.deliveries : [];
  const violations = deliveries
    .map((row) => ({
      itemName: String(row && row.itemName || ''),
      quantity: Math.max(0, Math.floor(finite(row && row.quantity, 0))),
      farmerShortfall: shortfalls[String(row && row.itemName || '')] == null ? 0 : shortfalls[String(row && row.itemName || '')]
    }))
    .filter((row) => !Object.prototype.hasOwnProperty.call(shortfalls, row.itemName) || row.quantity > row.farmerShortfall);

  return { adaptive: true, targetName, reportMissing: false, shortfalls, violations };
}

function blockedPlan(plan, assessment) {
  const next = {
    ...clone(plan),
    kind: MerchantServicePlanKind.HOLD,
    reason: 'POTION_DELIVERY_EXCEEDS_FARMER_SHORTFALL',
    deliveries: [],
    delivery: null,
    distance: null,
    metadata: {
      ...(plan && plan.metadata || {}),
      p0PotionHardCap4500: true,
      farmerTarget: POTION_TARGET_COUNT,
      merchantReserve: MERCHANT_POTION_RESERVE,
      demandHardCap: true,
      overdeliveryAllowed: false,
      violations: clone(assessment.violations)
    }
  };
  delete next.afterRestock;
  delete next.afterTravel;
  delete next.missingStock;
  return next;
}

function annotate(plan) {
  return {
    ...clone(plan),
    metadata: {
      ...(plan && plan.metadata || {}),
      p0PotionHardCap4500: true,
      farmerTarget: POTION_TARGET_COUNT,
      merchantReserve: MERCHANT_POTION_RESERVE,
      demandHardCap: true,
      overdeliveryAllowed: false,
      merchantExcessBlocksDelivery: false
    }
  };
}

function installP0PotionHardCap4500(runtime) {
  if (!runtime) throw new Error('runtime required');
  const planner = runtime.merchantServicePlanner;
  if (!planner || typeof planner.plan !== 'function') return null;
  if (planner.__p0PotionHardCap4500Installed) return runtime.p0PotionHardCap4500 || null;

  const state = {
    mode: P0_POTION_HARDCAP_4500_MODE,
    farmerTarget: POTION_TARGET_COUNT,
    merchantPotionReserve: MERCHANT_POTION_RESERVE,
    overdeliveryAllowed: false,
    merchantExcessBlocksDelivery: false,
    blockedOverdeliveryPlans: 0,
    lastBlocked: null,
    installed: true
  };
  const basePlan = planner.plan.bind(planner);

  planner.plan = (input = {}) => {
    const plan = basePlan(input);
    const assessment = assessAdaptivePlan(input, plan);
    if (!assessment.adaptive || assessment.reportMissing) return plan;
    if (assessment.violations.length) {
      const hold = blockedPlan(plan, assessment);
      state.blockedOverdeliveryPlans += 1;
      state.lastBlocked = clone({ targetName: assessment.targetName, violations: assessment.violations });
      planner.lastPlan = clone(hold);
      return clone(hold);
    }
    const next = annotate(plan);
    planner.lastPlan = clone(next);
    return clone(next);
  };

  planner.__p0PotionHardCap4500Installed = true;
  runtime.p0PotionHardCap4500 = state;
  return state;
}

module.exports = {
  P0_POTION_HARDCAP_4500_MODE,
  installP0PotionHardCap4500,
  assessAdaptivePlan
};
