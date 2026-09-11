'use strict';

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function hpRatio(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return 1;
  const maxHp = Number(c.max_hp) || 0;
  if (maxHp <= 0) return 1;
  return clamp01((Number(c.hp) || 0) / maxHp);
}

class CombatEmergencyGate {
  constructor(options = {}) {
    this.criticalHpRatio = Math.max(0.1, Math.min(0.9, Number(options.criticalHpRatio) || 0.35));
    this.multiAggroHpRatio = Math.max(this.criticalHpRatio, Math.min(0.95, Number(options.multiAggroHpRatio) || 0.55));
    this.multiAggroCount = Math.max(2, Math.floor(Number(options.multiAggroCount) || 2));
  }

  _attackers(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c || !c.name) return [];
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
      return entity.target === c.name;
    });
  }

  evaluate(snapshot, target) {
    if (!snapshot || !snapshot.character || !target || !target.mtype) {
      return { triggered: false, reason: 'EMERGENCY_NOT_APPLICABLE', signals: {} };
    }

    const currentHpRatio = hpRatio(snapshot);
    const attackers = this._attackers(snapshot);
    const signals = {
      hpRatio: Number(currentHpRatio.toFixed(3)),
      attackers: attackers.length,
      attackerIds: attackers.slice(0, 5).map((entity) => String(entity.id))
    };

    if (currentHpRatio <= this.criticalHpRatio) {
      return { triggered: true, reason: 'CRITICAL_HP', signals };
    }

    if (currentHpRatio <= this.multiAggroHpRatio && attackers.length >= this.multiAggroCount) {
      return { triggered: true, reason: 'MULTI_AGGRO_LOW_HP', signals };
    }

    return { triggered: false, reason: 'EMERGENCY_CLEAR', signals };
  }

  status() {
    return {
      criticalHpRatio: this.criticalHpRatio,
      multiAggroHpRatio: this.multiAggroHpRatio,
      multiAggroCount: this.multiAggroCount
    };
  }
}

module.exports = { CombatEmergencyGate };
