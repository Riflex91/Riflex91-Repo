'use strict';

const MERCHANT_SERVICE_PLANNER_MODE = 'shadow-merchant-service-planner';

const MerchantServicePlanKind = Object.freeze({
  HOLD: 'HOLD',
  STAND_OPEN: 'STAND_OPEN',
  STAND_CLOSE: 'STAND_CLOSE',
  SERVICE_TRAVEL: 'SERVICE_TRAVEL',
  SERVICE_DELIVERY: 'SERVICE_DELIVERY',
  COLLECTION_REQUIRED: 'COLLECTION_REQUIRED',
  RESTOCK_REQUIRED: 'RESTOCK_REQUIRED'
});

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function itemQuantity(inventory, name) {
  return (Array.isArray(inventory) ? inventory : []).reduce((sum, item) => {
    if (!item || String(item.name || '') !== String(name || '')) return sum;
    return sum + Math.max(0, finite(item.q, 1));
  }, 0);
}

function familyItems(inventory, family) {
  const prefix = family === 'hp' ? 'hpot' : 'mpot';
  const rows = new Map();
  for (const item of Array.isArray(inventory) ? inventory : []) {
    if (!item || !String(item.name || '').toLowerCase().startsWith(prefix)) continue;
    const name = String(item.name);
    rows.set(name, (rows.get(name) || 0) + Math.max(0, finite(item.q, 1)));
  }
  return [...rows.entries()].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

class MerchantServicePlanner {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.reportTtlMs = Math.max(5000, Math.min(5 * 60 * 1000, finite(options.reportTtlMs, 25000)));
    this.criticalPotionCount = Math.max(0, Math.min(5000, finite(options.criticalPotionCount, 40)));
    this.lowPotionCount = Math.max(this.criticalPotionCount, Math.min(10000, finite(options.lowPotionCount, 120)));
    this.targetPotionCount = Math.max(this.lowPotionCount, Math.min(20000, finite(options.targetPotionCount, 240)));
    this.merchantPotionReserve = Math.max(0, Math.min(10000, finite(options.merchantPotionReserve, 80)));
    this.maxDeliveryQuantity = Math.max(1, Math.min(1000, finite(options.maxDeliveryQuantity, 200)));
    this.criticalFreeSlots = Math.max(0, Math.min(20, finite(options.criticalFreeSlots, 2)));
    this.lowFreeSlots = Math.max(this.criticalFreeSlots, Math.min(30, finite(options.lowFreeSlots, 5)));
    this.standWhenIdle = options.standWhenIdle !== false;
    this.sequence = 0;
    this.lastPlan = null;
    this.stats = { plans: 0, service: 0, stand: 0, holds: 0, staleReports: 0, unsafeTargets: 0 };
  }

  _id() {
    this.sequence += 1;
    return `merchant-service-${this.now().toString(36)}-${this.sequence.toString(36)}`;
  }

  _plan(kind, reason, data = {}) {
    const plan = {
      schemaVersion: 1,
      id: this._id(),
      at: this.now(),
      kind,
      reason,
      actionAuthority: false,
      liveExecutionAllowed: false,
      ...clone(data)
    };
    this.lastPlan = plan;
    this.stats.plans += 1;
    if (kind === MerchantServicePlanKind.HOLD) this.stats.holds += 1;
    else if (kind === MerchantServicePlanKind.STAND_OPEN || kind === MerchantServicePlanKind.STAND_CLOSE) this.stats.stand += 1;
    else this.stats.service += 1;
    return clone(plan);
  }

  _need(report) {
    if (!report || !report.supplies) return null;
    const supplies = report.supplies;
    const hp = Math.max(0, finite(supplies.hpPotions, 0));
    const mp = Math.max(0, finite(supplies.mpPotions, 0));
    const freeSlots = Math.max(0, finite(supplies.freeSlots, 0));
    const potionRate = Math.max(0, finite(report.rates && report.rates.potionsPerHour, 0));
    const hpRunwayMinutes = potionRate > 0 ? hp / potionRate * 60 : null;
    const mpRunwayMinutes = potionRate > 0 ? mp / potionRate * 60 : null;

    const rows = [];
    if (hp <= this.criticalPotionCount) rows.push({ family: 'hp', priority: 100, count: hp, preferred: supplies.preferredHpPotion || null, runwayMinutes: hpRunwayMinutes, reason: 'HP_POTIONS_CRITICAL' });
    else if (hp <= this.lowPotionCount) rows.push({ family: 'hp', priority: 80, count: hp, preferred: supplies.preferredHpPotion || null, runwayMinutes: hpRunwayMinutes, reason: 'HP_POTIONS_LOW' });
    if (mp <= this.criticalPotionCount) rows.push({ family: 'mp', priority: 100, count: mp, preferred: supplies.preferredMpPotion || null, runwayMinutes: mpRunwayMinutes, reason: 'MP_POTIONS_CRITICAL' });
    else if (mp <= this.lowPotionCount) rows.push({ family: 'mp', priority: 80, count: mp, preferred: supplies.preferredMpPotion || null, runwayMinutes: mpRunwayMinutes, reason: 'MP_POTIONS_LOW' });
    if (freeSlots <= this.criticalFreeSlots) rows.push({ family: 'inventory', priority: 95, count: freeSlots, reason: 'INVENTORY_CRITICAL' });
    else if (freeSlots <= this.lowFreeSlots) rows.push({ family: 'inventory', priority: 70, count: freeSlots, reason: 'INVENTORY_LOW' });
    if (!rows.length) return null;
    rows.sort((a, b) => b.priority - a.priority || (finite(a.runwayMinutes, Infinity) - finite(b.runwayMinutes, Infinity)));
    return rows[0];
  }

  _delivery(merchantInventory, need) {
    if (!need || !['hp', 'mp'].includes(need.family)) return null;
    const family = familyItems(merchantInventory, need.family);
    if (!family.length) return null;
    const preferred = need.preferred && family.find((row) => row.name === need.preferred);
    const source = preferred || family[0];
    const available = Math.max(0, source.quantity - this.merchantPotionReserve);
    if (available <= 0) return null;
    const wanted = Math.max(1, this.targetPotionCount - Math.max(0, need.count));
    const quantity = Math.max(1, Math.min(this.maxDeliveryQuantity, available, wanted));
    return { family: need.family, itemName: source.name, quantity, sourceQuantity: source.quantity, merchantReserve: this.merchantPotionReserve };
  }

  _serviceContext(selected) {
    return {
      sourceReportAt: finite(selected && selected.report && selected.report.at),
      target: {
        name: selected.report.name,
        map: selected.report.map || null,
        x: finite(selected.report.x),
        y: finite(selected.report.y)
      },
      need: selected.need
    };
  }

  plan(input = {}) {
    const merchant = input.merchant || {};
    const ctype = String(merchant.ctype || merchant.type || '').toLowerCase();
    if (ctype !== 'merchant') return this._plan(MerchantServicePlanKind.HOLD, 'MERCHANT_REQUIRED');
    if (merchant.rip === true || merchant.dead === true) return this._plan(MerchantServicePlanKind.HOLD, 'MERCHANT_DEAD');
    if (input.inCombat === true) return this._plan(MerchantServicePlanKind.HOLD, 'MERCHANT_IN_COMBAT');
    if (input.economyEmergency === true) return this._plan(MerchantServicePlanKind.HOLD, 'ECONOMY_EMERGENCY');
    if (input.controlledBusy === true) return this._plan(MerchantServicePlanKind.HOLD, 'CONTROLLED_SUBSYSTEM_BUSY');

    const now = this.now();
    const candidates = [];
    for (const report of Array.isArray(input.reports) ? input.reports : []) {
      if (!report || !report.name || String(report.ctype || '').toLowerCase() === 'merchant') continue;
      if (finite(report.at) == null || now - Number(report.at) > this.reportTtlMs) {
        this.stats.staleReports += 1;
        continue;
      }
      if (report.rip === true || report.active === false) continue;
      const need = this._need(report);
      if (!need) continue;
      if (report.safety && (report.safety.emergency === true || report.safety.retreat === true)) {
        this.stats.unsafeTargets += 1;
        continue;
      }
      candidates.push({ report, need });
    }

    // For equal-priority supply emergencies, serve the most depleted Farmer
    // first. This makes an empty potion stack outrank a merely low one.
    candidates.sort((a, b) =>
      b.need.priority - a.need.priority
      || Math.max(0, finite(a.need.count, Infinity)) - Math.max(0, finite(b.need.count, Infinity))
      || Number(a.report.at) - Number(b.report.at)
      || String(a.report.name).localeCompare(String(b.report.name))
    );
    const selected = candidates[0] || null;
    const standOpen = input.standOpen === true;

    if (!selected) {
      if (this.standWhenIdle && !standOpen) return this._plan(MerchantServicePlanKind.STAND_OPEN, 'NO_SERVICE_NEED');
      return this._plan(MerchantServicePlanKind.HOLD, standOpen ? 'STAND_IDLE' : 'NO_SERVICE_NEED');
    }

    const serviceContext = this._serviceContext(selected);

    if (standOpen) {
      return this._plan(MerchantServicePlanKind.STAND_CLOSE, 'SERVICE_PREEMPTS_STAND', serviceContext);
    }

    if (selected.need.family === 'inventory') {
      const sameMap = merchant.map && selected.report.map && String(merchant.map) === String(selected.report.map);
      const hasPosition = finite(selected.report.x) != null && finite(selected.report.y) != null;
      if (!sameMap || !hasPosition) {
        return this._plan(MerchantServicePlanKind.SERVICE_TRAVEL, selected.need.reason, {
          ...serviceContext,
          afterTravel: MerchantServicePlanKind.COLLECTION_REQUIRED
        });
      }
      return this._plan(MerchantServicePlanKind.COLLECTION_REQUIRED, selected.need.reason, serviceContext);
    }

    const delivery = this._delivery(merchant.inventory || [], selected.need);
    if (!delivery) {
      return this._plan(MerchantServicePlanKind.RESTOCK_REQUIRED, `MERCHANT_${selected.need.family.toUpperCase()}_POTION_STOCK_LOW`, serviceContext);
    }

    const sameMap = merchant.map && selected.report.map && String(merchant.map) === String(selected.report.map);
    const hasPosition = finite(selected.report.x) != null && finite(selected.report.y) != null;
    const mx = finite(merchant.x != null ? merchant.x : merchant.real_x);
    const my = finite(merchant.y != null ? merchant.y : merchant.real_y);
    const distance = sameMap && hasPosition && mx != null && my != null ? Math.hypot(mx - Number(selected.report.x), my - Number(selected.report.y)) : null;
    const nearby = sameMap && distance != null && distance <= Math.max(50, finite(input.deliveryDistance, 400));
    const base = { ...serviceContext, delivery, distance };
    if (!nearby) return this._plan(MerchantServicePlanKind.SERVICE_TRAVEL, selected.need.reason, { ...base, afterTravel: MerchantServicePlanKind.SERVICE_DELIVERY });
    return this._plan(MerchantServicePlanKind.SERVICE_DELIVERY, selected.need.reason, base);
  }

  status() {
    return {
      schemaVersion: 1,
      mode: MERCHANT_SERVICE_PLANNER_MODE,
      actionAuthority: false,
      liveExecutionAllowed: false,
      thresholds: {
        reportTtlMs: this.reportTtlMs,
        criticalPotionCount: this.criticalPotionCount,
        lowPotionCount: this.lowPotionCount,
        targetPotionCount: this.targetPotionCount,
        merchantPotionReserve: this.merchantPotionReserve,
        maxDeliveryQuantity: this.maxDeliveryQuantity,
        criticalFreeSlots: this.criticalFreeSlots,
        lowFreeSlots: this.lowFreeSlots,
        standWhenIdle: this.standWhenIdle
      },
      lastPlan: clone(this.lastPlan),
      stats: clone(this.stats)
    };
  }
}

module.exports = { MerchantServicePlanner, MerchantServicePlanKind, MERCHANT_SERVICE_PLANNER_MODE, itemQuantity, familyItems };
