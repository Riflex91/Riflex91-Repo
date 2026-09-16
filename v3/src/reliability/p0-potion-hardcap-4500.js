'use strict';

const { MerchantServicePlanKind, itemQuantity } = require('../merchant/merchant-service-planner');
const { POTION_TARGET_COUNT, MERCHANT_POTION_RESERVE } = require('./p0-potion-policy-4500');

const P0_POTION_HARDCAP_4500_MODE = 'p0-potion-hardcap-4500-v1';

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
    return { adaptive: false, excess: [] };
  }
  const targetName = plan.target && String(plan.target.name || '');
  const report = reportFor(input, targetName);
  if (!report) return { adaptive: true, targetName, reportMissing: true, excess: [] };
  const inventory = input && input.merchant && Array.isArray(input.merchant.inventory) ? input.merchant.inventory : [];
  const rows = [
    { family: 'hp', itemName: 'hpot0' },
    { family: 'mp', itemName: 'mpot0' }
  ].map((def) => {
    const farmerBefore = farmerCount(report, def.family);
    const farmerShortfall = Math.max(0, POTION_TARGET_COUNT - farmerBefore);
    const merchantHave = Math.max(0, Math.floor(itemQuantity(inventory, def.itemName)));
    return {
      ...def,
      farmerBefore,
      farmerShortfall,
      merchantHave,
      excessQuantity: Math.max(0, merchantHave - farmerShortfall)
    };
  });
  return {
    adaptive: true,
    targetName,
    reportMissing: false,
    rows,
    excess: rows.filter((row) => row.excessQuantity > 0)
  };
}

function holdForExcess(plan, blocked) {
  const next = {
    ...clone(plan),
    kind: MerchantServicePlanKind.HOLD,
    reason: 'MERCHANT_POTION_EXCESS_BLOCKS_ZERO_RESERVE_DELIVERY',
    deliveries: [],
    delivery: null,
    distance: null,
    metadata: {
      ...(plan && plan.metadata || {}),
      p0PotionHardCap4500: true,
      farmerTarget: POTION_TARGET_COUNT,
      merchantReserve: MERCHANT_POTION_RESERVE,
      zeroReserveHardCap: true,
      overdeliveryAllowed: false,
      blockedTargets: clone(blocked)
    }
  };
  delete next.afterRestock;
  delete next.afterTravel;
  delete next.missingStock;
  return next;
}

function annotateReroute(plan, blocked) {
  const next = {
    ...clone(plan),
    metadata: {
      ...(plan && plan.metadata || {}),
      p0PotionHardCap4500: true,
      farmerTarget: POTION_TARGET_COUNT,
      merchantReserve: MERCHANT_POTION_RESERVE,
      zeroReserveHardCap: true,
      overdeliveryAllowed: false,
      reroutedFromPotionExcess: clone(blocked)
    }
  };
  return next;
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
    reroutes: 0,
    blockedPlans: 0,
    lastBlocked: null,
    installed: true
  };
  const basePlan = planner.plan.bind(planner);

  planner.plan = (input = {}) => {
    const originalReports = Array.isArray(input.reports) ? input.reports.slice() : [];
    let candidateReports = originalReports.slice();
    const blocked = [];
    const attempts = Math.max(1, originalReports.length + 1);

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const planInput = candidateReports === originalReports ? input : { ...input, reports: candidateReports };
      const plan = basePlan(planInput);
      const assessment = assessAdaptivePlan(input, plan);
      if (!assessment.adaptive || assessment.reportMissing || !assessment.excess.length) {
        if (blocked.length && assessment.adaptive) {
          state.reroutes += 1;
          const rerouted = annotateReroute(plan, blocked);
          planner.lastPlan = clone(rerouted);
          return clone(rerouted);
        }
        return plan;
      }

      const blockedRow = {
        targetName: assessment.targetName,
        excess: assessment.excess.map((row) => ({
          itemName: row.itemName,
          merchantHave: row.merchantHave,
          farmerBefore: row.farmerBefore,
          farmerShortfall: row.farmerShortfall,
          excessQuantity: row.excessQuantity
        }))
      };
      blocked.push(blockedRow);
      state.lastBlocked = clone(blockedRow);

      const before = candidateReports.length;
      candidateReports = candidateReports.filter((row) => row && String(row.name || '') !== assessment.targetName);
      if (!assessment.targetName || candidateReports.length === before || candidateReports.length === 0) {
        const hold = holdForExcess(plan, blocked);
        state.blockedPlans += 1;
        planner.lastPlan = clone(hold);
        return clone(hold);
      }
    }

    const fallback = holdForExcess(planner.lastPlan || {}, blocked);
    state.blockedPlans += 1;
    planner.lastPlan = clone(fallback);
    return clone(fallback);
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
