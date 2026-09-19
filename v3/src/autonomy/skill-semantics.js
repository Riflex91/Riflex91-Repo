'use strict';

const SkillControlType = Object.freeze({
  PERCENT: 'percent',
  INTEGER: 'integer'
});

const Capability = Object.freeze({
  SINGLE_TARGET_OFFENSE: 'single_target_offense',
  SINGLE_TARGET_BURST: 'single_target_burst',
  SINGLE_TARGET_HEAL: 'single_target_heal',
  SINGLE_TARGET_CONTROL: 'single_target_control',
  SINGLE_TARGET_DEBUFF: 'single_target_debuff',
  MULTI_TARGET_DAMAGE: 'multi_target_damage',
  RANGED_MULTI_TARGET_DAMAGE: 'ranged_multi_target_damage',
  VARIABLE_MULTI_TARGET_DAMAGE: 'variable_multi_target_damage',
  AOE_DAMAGE: 'aoe_damage',
  AOE_CONTROL: 'aoe_control',
  AOE_AGGRO_CONTROL: 'aoe_aggro_control',
  AGGRO_CONTROL: 'aggro_control',
  PULL_CONTROL: 'pull_control',
  PARTY_HEAL: 'party_heal',
  GROUP_SUSTAIN: 'group_sustain',
  PARTY_SUPPORT: 'party_support',
  PARTY_DAMAGE_SUPPORT: 'party_damage_support',
  RESOURCE_SUPPORT: 'resource_support',
  PERSONAL_DEFENSE: 'personal_defense',
  MOBILITY: 'mobility',
  REVIVE_SUPPORT: 'revive_support',
  NONCOMBAT_SUPPORT: 'noncombat_support'
});

function percentControl(key, defaultValue, options = {}) {
  return Object.freeze({
    key,
    type: SkillControlType.PERCENT,
    min: options.min == null ? 0 : Math.max(0, Math.min(1, Number(options.min))),
    max: options.max == null ? 1 : Math.max(0, Math.min(1, Number(options.max))),
    step: options.step == null ? 0.01 : Number(options.step),
    default: Math.max(0, Math.min(1, Number(defaultValue))),
    label: options.label || key,
    emergencyOverride: options.emergencyOverride === true
  });
}

function integerControl(key, defaultValue, min, max, options = {}) {
  const control = {
    key,
    type: SkillControlType.INTEGER,
    min: Math.max(0, Math.floor(Number(min))),
    max: Math.max(Math.floor(Number(min)), Math.floor(Number(max))),
    step: Math.max(1, Math.floor(Number(options.step) || 1)),
    default: Math.floor(Number(defaultValue)),
    label: options.label || key,
    emergencyOverride: options.emergencyOverride === true
  };
  if (options.maxSource) control.maxSource = String(options.maxSource);
  return Object.freeze(control);
}

const LEGACY_DEFAULT_ENABLED_SKILLS = Object.freeze(new Set([
  'heal', 'partyheal', 'hardshell', 'taunt', 'cleave', 'stomp',
  'supershot', 'huntersmark', 'burst', 'cburst',
  'mentalburst', 'quickpunch', 'quickstab',
  'darkblessing', 'invis', 'paladin_aura', 'mluck'
]));

const SKILL_SEMANTICS = Object.freeze({
  heal: Object.freeze({
    capabilities: [Capability.SINGLE_TARGET_HEAL],
    controls: [percentControl('hpThreshold', 0.65, { label: 'Heal HP threshold', emergencyOverride: true })]
  }),
  partyheal: Object.freeze({
    capabilities: [Capability.PARTY_HEAL, Capability.GROUP_SUSTAIN],
    controls: [
      percentControl('hpThreshold', 0.72, { label: 'Party Heal HP threshold', emergencyOverride: true }),
      integerControl('minInjuredMembers', 2, 1, 4, { label: 'Minimum injured party members' })
    ]
  }),
  selfheal: Object.freeze({
    capabilities: [Capability.SINGLE_TARGET_HEAL, Capability.PERSONAL_DEFENSE],
    controls: [percentControl('hpThreshold', 0.55, { label: 'Self Heal HP threshold', emergencyOverride: true })]
  }),
  hardshell: Object.freeze({
    capabilities: [Capability.PERSONAL_DEFENSE],
    controls: [percentControl('hpThreshold', 0.45, { label: 'Hard Shell HP threshold', emergencyOverride: true })]
  }),
  cleave: Object.freeze({
    capabilities: [Capability.AOE_DAMAGE, Capability.MULTI_TARGET_DAMAGE],
    controls: [integerControl('minTargets', 3, 1, 8, { label: 'Minimum targets' })]
  }),
  stomp: Object.freeze({
    capabilities: [Capability.AOE_CONTROL],
    controls: [integerControl('minTargets', 3, 1, 8, { label: 'Minimum targets' })]
  }),
  agitate: Object.freeze({
    capabilities: [Capability.AOE_AGGRO_CONTROL, Capability.PULL_CONTROL],
    controls: [integerControl('maxDesiredTargets', 4, 1, 8, { label: 'Maximum desired nearby targets' })]
  }),
  taunt: Object.freeze({ capabilities: [Capability.AGGRO_CONTROL], controls: [] }),
  warcry: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT], controls: [] }),
  charge: Object.freeze({ capabilities: [Capability.MOBILITY], controls: [] }),
  dash: Object.freeze({ capabilities: [Capability.MOBILITY], controls: [] }),

  '3shot': Object.freeze({
    capabilities: [Capability.MULTI_TARGET_DAMAGE, Capability.RANGED_MULTI_TARGET_DAMAGE],
    controls: [integerControl('minTargets', 2, 1, 8, { label: 'Minimum targets', maxSource: 'targetCapacity' })]
  }),
  '5shot': Object.freeze({
    capabilities: [Capability.MULTI_TARGET_DAMAGE, Capability.RANGED_MULTI_TARGET_DAMAGE],
    controls: [integerControl('minTargets', 4, 1, 8, { label: 'Minimum targets', maxSource: 'targetCapacity' })]
  }),
  supershot: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_BURST], controls: [] }),
  poisonarrow: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  piercingshot: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  huntersmark: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_DEBUFF], controls: [] }),

  fanofknives: Object.freeze({
    capabilities: [Capability.MULTI_TARGET_DAMAGE],
    controls: [integerControl('minTargets', 3, 1, 8, { label: 'Minimum targets', maxSource: 'targetCapacity' })]
  }),
  mentalburst: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  quickpunch: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  quickstab: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  shadowstrike: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  invis: Object.freeze({ capabilities: [Capability.PERSONAL_DEFENSE], controls: [] }),
  rspeed: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT], controls: [] }),

  cburst: Object.freeze({
    capabilities: [Capability.MULTI_TARGET_DAMAGE, Capability.VARIABLE_MULTI_TARGET_DAMAGE],
    controls: [
      integerControl('minTargets', 2, 1, 8, { label: 'Minimum targets' }),
      percentControl('manaBudgetRatio', 0.20, { min: 0.05, max: 0.50, label: 'Maximum MP budget per cast' })
    ]
  }),
  burst: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_BURST], controls: [] }),
  arcane_needle: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  entangle: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_CONTROL], controls: [] }),
  reflection: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT], controls: [] }),
  energize: Object.freeze({
    capabilities: [Capability.RESOURCE_SUPPORT, Capability.PARTY_SUPPORT],
    controls: [percentControl('recipientMpThreshold', 0.50, { label: 'Recipient MP threshold' })]
  }),
  blink: Object.freeze({ capabilities: [Capability.MOBILITY], controls: [] }),
  magiport: Object.freeze({ capabilities: [Capability.MOBILITY, Capability.PARTY_SUPPORT], controls: [] }),

  curse: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_DEBUFF], controls: [] }),
  darkblessing: Object.freeze({ capabilities: [Capability.PARTY_DAMAGE_SUPPORT], controls: [] }),
  absorb: Object.freeze({ capabilities: [Capability.AGGRO_CONTROL, Capability.PARTY_SUPPORT], controls: [] }),
  phaseout: Object.freeze({ capabilities: [Capability.PERSONAL_DEFENSE], controls: [] }),
  revive: Object.freeze({ capabilities: [Capability.REVIVE_SUPPORT], controls: [] }),

  mshield: Object.freeze({ capabilities: [Capability.PERSONAL_DEFENSE], controls: [] }),
  aether_shield: Object.freeze({ capabilities: [Capability.PERSONAL_DEFENSE], controls: [] }),
  cleansing_light: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT], controls: [] }),
  guardians_oath: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT, Capability.GROUP_SUSTAIN], controls: [] }),
  beacon_of_resolve: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT, Capability.GROUP_SUSTAIN], controls: [] }),
  paladin_aura: Object.freeze({ capabilities: [Capability.PARTY_SUPPORT, Capability.GROUP_SUSTAIN], controls: [] }),
  purify: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  shield_slam: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),
  smash: Object.freeze({ capabilities: [Capability.SINGLE_TARGET_OFFENSE], controls: [] }),

  mluck: Object.freeze({ capabilities: [Capability.NONCOMBAT_SUPPORT], controls: [] }),
  mcourage: Object.freeze({ capabilities: [Capability.PERSONAL_DEFENSE], controls: [] }),
  mfrenzy: Object.freeze({ capabilities: [Capability.PERSONAL_DEFENSE], controls: [] })
});

function dedupe(values) {
  return [...new Set((values || []).filter(Boolean).map(String))].sort();
}

function inferCapabilities(skill = {}) {
  const out = [];
  if (skill.heal === true && (skill.party === true || skill.multi === true)) {
    out.push(Capability.PARTY_HEAL, Capability.GROUP_SUSTAIN);
  } else if (skill.heal === true) {
    out.push(Capability.SINGLE_TARGET_HEAL);
  }
  if (skill.hostile === true && (skill.multi === true || skill.list === true)) {
    out.push(Capability.MULTI_TARGET_DAMAGE);
  } else if (skill.hostile === true && skill.target === true) {
    out.push(Capability.SINGLE_TARGET_OFFENSE);
  }
  if (skill.party === true || skill.aura === true) out.push(Capability.PARTY_SUPPORT);
  return dedupe(out);
}

function resolveTargetCapacity(skillId, skill = {}) {
  const explicit = Number(skill.max_targets);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  if (skill.multi === true) {
    const match = String(skillId || '').match(/^(\d+)shot$/i);
    if (match) return Math.max(1, Math.floor(Number(match[1])));
  }
  return null;
}

function semanticFor(skillId, skill = {}) {
  const known = SKILL_SEMANTICS[String(skillId || '')] || null;
  return {
    automationValidated: !!known,
    defaultEnabled: !!known && LEGACY_DEFAULT_ENABLED_SKILLS.has(String(skillId || '')),
    capabilities: dedupe([...(known && known.capabilities || []), ...inferCapabilities(skill)]),
    controls: (known && known.controls || []).map((control) => ({ ...control })),
    targetCapacity: resolveTargetCapacity(skillId, skill)
  };
}

function controlBounds(control, skillRecord = {}) {
  const min = Number.isFinite(Number(control && control.min)) ? Number(control.min) : 0;
  let max = Number.isFinite(Number(control && control.max)) ? Number(control.max) : min;
  if (control && control.maxSource === 'targetCapacity') {
    const dynamic = Number(skillRecord && skillRecord.targetCapacity);
    if (Number.isFinite(dynamic) && dynamic >= min) max = dynamic;
  }
  return { min, max: Math.max(min, max) };
}

function normalizeControlValue(control, value, skillRecord = {}) {
  const bounds = controlBounds(control, skillRecord);
  const numeric = Number(value);
  const fallback = Number(control && control.default);
  const chosen = Number.isFinite(numeric) ? numeric : (Number.isFinite(fallback) ? fallback : bounds.min);
  if (control && control.type === SkillControlType.INTEGER) {
    return Math.max(bounds.min, Math.min(bounds.max, Math.round(chosen)));
  }
  return Math.max(bounds.min, Math.min(bounds.max, chosen));
}

function defaultParameters(skillId, skillRecord = {}) {
  const semantic = semanticFor(skillId, skillRecord.live || skillRecord);
  return Object.fromEntries(semantic.controls.map((control) => [
    control.key,
    normalizeControlValue(control, control.default, skillRecord)
  ]));
}

module.exports = {
  SkillControlType,
  Capability,
  SKILL_SEMANTICS,
  LEGACY_DEFAULT_ENABLED_SKILLS,
  semanticFor,
  inferCapabilities,
  resolveTargetCapacity,
  controlBounds,
  normalizeControlValue,
  defaultParameters
};
