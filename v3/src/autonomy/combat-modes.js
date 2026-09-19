'use strict';

const CombatMode = Object.freeze({
  SINGLE_TARGET: 'single_target',
  SMART_AUTO: 'smart_auto',
  AOE_PREFERRED: 'aoe_preferred'
});

const COMBAT_MODE_LABELS = Object.freeze({
  [CombatMode.SINGLE_TARGET]: 'Single Target',
  [CombatMode.SMART_AUTO]: 'Smart Auto',
  [CombatMode.AOE_PREFERRED]: 'AoE preferred'
});

function normalizeCombatMode(value, fallback = CombatMode.SMART_AUTO) {
  const mode = String(value == null ? '' : value).trim().toLowerCase();
  return Object.values(CombatMode).includes(mode) ? mode : fallback;
}

module.exports = { CombatMode, COMBAT_MODE_LABELS, normalizeCombatMode };
