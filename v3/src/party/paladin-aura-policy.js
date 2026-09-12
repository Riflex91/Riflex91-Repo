'use strict';

const AURAS = Object.freeze(['bulwark', 'sanctuary', 'zeal', 'warding']);
class PaladinAuraPolicy {
  constructor(options = {}) { this.now = options.now || (() => Date.now()); this.minHoldMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.minHoldMs) || 30000)); this.lastAura = null; this.lastChangedAt = 0; this.lastDecision = null; }
  recommend(context = {}) {
    const paladin = context.paladin || null; const encounter = context.encounter || {}; const risk = context.risk || {};
    if (!paladin || paladin.ctype !== 'paladin' || Number(paladin.level) < 60 || !Array.isArray(paladin.skillUnlocks) || !paladin.skillUnlocks.includes('paladin_aura')) { this.lastDecision = { aura: null, reason: 'PALADIN_AURA_UNAVAILABLE', canSwitch: false }; return this.lastDecision; }
    const monster = encounter.monster || {}; const damageType = String(monster.damageType || '').toLowerCase(); let aura = 'zeal'; let reason = 'SAFE_OFFENSE';
    if (risk.unknown || risk.highRisk || risk.lowSurvivalMargin) { aura = damageType === 'magical' ? 'sanctuary' : 'bulwark'; reason = damageType === 'magical' ? 'MAGICAL_DAMAGE_PRESSURE' : 'LOW_SURVIVAL_MARGIN'; }
    else if (risk.statusPressure || risk.elementalPressure || risk.mpStarvation) { aura = 'warding'; reason = risk.mpStarvation ? 'MP_STARVATION' : 'STATUS_OR_ELEMENTAL_PRESSURE'; }
    else if (damageType === 'magical' && risk.mediumRisk) { aura = 'sanctuary'; reason = 'MAGICAL_DAMAGE_PRESSURE'; }
    else if (damageType === 'physical' && risk.mediumRisk) { aura = 'bulwark'; reason = 'PHYSICAL_DAMAGE_PRESSURE'; }
    const now = this.now(); const held = this.lastAura && this.lastAura !== aura && now - this.lastChangedAt < this.minHoldMs; const resolved = held ? this.lastAura : aura;
    this.lastDecision = { aura: resolved, proposedAura: aura, reason: held ? 'AURA_HYSTERESIS_HOLD' : reason, canSwitch: !held, minHoldMs: this.minHoldMs }; return this.lastDecision;
  }
  noteApplied(aura) { if (!AURAS.includes(aura)) return false; if (this.lastAura !== aura) { this.lastAura = aura; this.lastChangedAt = this.now(); } return true; }
  status() { return { auras: AURAS.slice(), lastAura: this.lastAura, lastChangedAt: this.lastChangedAt || null, lastDecision: this.lastDecision, minHoldMs: this.minHoldMs }; }
}
module.exports = { PaladinAuraPolicy, AURAS };
