'use strict';

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, finite(value))); }
function ratio(value, max, fallback = 1) { const d = finite(max, 0); return d > 0 ? clamp(finite(value) / d, 0, 1) : fallback; }

class StrategicRewardModel {
  constructor(options = {}) {
    this.outcomeMs = Math.max(5000, Math.min(30 * 60 * 1000, Number(options.outcomeMs) || 180000));
  }

  metrics(context = {}) {
    const snapshot = context.snapshot || {};
    const c = snapshot.character || {};
    const inventory = Array.isArray(c.inventory) ? c.inventory : [];
    const capacity = Math.max(1, inventory.length || 42);
    const occupied = inventory.filter(Boolean).length;
    const performance = context.performance && context.performance.current || {};
    const rates = performance.rates || {};
    const party = context.party && Array.isArray(context.party.members) ? context.party.members : [];
    const partySize = Math.max(1, party.length || 1);
    const partyAlive = party.filter((member) => member && member.rip !== true).length || 1;
    const progress = context.progress || {};
    const movement = context.movement || {};
    const persistence = context.persistence || {};
    return {
      xpPerHour: Math.max(0, finite(rates.xpPerHour)),
      goldPerHour: finite(rates.goldPerHour),
      freeInventoryRatio: clamp((capacity - occupied) / capacity, 0, 1),
      hpRatio: ratio(c.hp, c.max_hp),
      mpRatio: ratio(c.mp, c.max_mp),
      partyAliveRatio: clamp(partyAlive / partySize, 0, 1),
      deathsPerHour: Math.max(0, finite(rates.deathsPerHour)),
      movementHealthy: movement.circuitOpen ? 0 : 1,
      persistenceHealthy: persistence.saveCircuitOpen || finite(persistence.loadFailureStreak) > 0 ? 0 : 1,
      progressHealthy: progress.state === 'DEGRADED' ? 0 : progress.state === 'WATCH' ? 0.5 : 1,
      rip: c.rip === true
    };
  }

  evaluate(before = {}, after = {}, options = {}) {
    const rel = (a, b, floor = 1) => clamp((finite(b) - finite(a)) / Math.max(floor, Math.abs(finite(a))), -1, 1);
    let reward = 0;
    const components = {};
    components.xp = rel(before.xpPerHour, after.xpPerHour, 1000) * 0.34;
    components.gold = rel(before.goldPerHour, after.goldPerHour, 100) * 0.12;
    components.inventory = clamp(finite(after.freeInventoryRatio) - finite(before.freeInventoryRatio), -1, 1) * 0.10;
    components.hp = clamp(finite(after.hpRatio) - finite(before.hpRatio), -1, 1) * 0.08;
    components.party = clamp(finite(after.partyAliveRatio) - finite(before.partyAliveRatio), -1, 1) * 0.12;
    components.deaths = -clamp(finite(after.deathsPerHour) - finite(before.deathsPerHour), 0, 5) * 0.16;
    components.movement = (finite(after.movementHealthy) - finite(before.movementHealthy)) * 0.06;
    components.persistence = (finite(after.persistenceHealthy) - finite(before.persistenceHealthy)) * 0.03;
    components.progress = (finite(after.progressHealthy) - finite(before.progressHealthy)) * 0.05;
    for (const value of Object.values(components)) reward += value;
    if (after.rip && !before.rip) { components.deathEvent = -0.65; reward -= 0.65; }
    if (options.safetyIncident === true) { components.safetyIncident = -0.75; reward -= 0.75; }
    if (options.actionError === true) { components.actionError = -0.15; reward -= 0.15; }
    reward = clamp(reward, -1, 1);
    return { reward, components };
  }

  status() { return { outcomeMs: this.outcomeMs, rewardRange: [-1, 1] }; }
}

module.exports = { StrategicRewardModel };
