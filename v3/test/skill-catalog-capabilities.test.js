'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SkillCatalogService, SkillCatalogState } = require('../src/autonomy/skill-catalog-service');
const { CharacterCombatProfileStore } = require('../src/autonomy/character-combat-profile');
const { CharacterCapabilityResolver, PartyCapabilityResolver } = require('../src/autonomy/capability-resolver');
const { Capability } = require('../src/autonomy/skill-semantics');

function storage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; },
    rows
  };
}

function skills() {
  return {
    cleave: {
      type: 'skill', class: ['warrior'], name: 'Cleave', level: 52, mp: 720,
      cooldown: 1200, range: 160, wtype: ['axe', 'scythe'], hostile: true
    },
    stomp: {
      type: 'skill', class: ['warrior'], name: 'Stomp', level: 52, mp: 120,
      cooldown: 24000, range: 400, wtype: 'basher', hostile: true, condition: 'stunned'
    },
    agitate: {
      type: 'skill', class: ['warrior'], name: 'Agitate', level: 68, mp: 420,
      cooldown: 2200, range: 320, hostile: true
    },
    hardshell: {
      type: 'skill', class: ['warrior'], name: 'Hard Shell', level: 60, mp: 480,
      cooldown: 16000, condition: 'hardshell'
    },
    '3shot': {
      type: 'skill', class: ['ranger'], name: '3-Shot', level: 60, mp: 200,
      damage_multiplier: 0.7, cooldown_multiplier: 1, multi: true, share: 'attack',
      hostile: true, wtype: ['bow', 'crossbow'], pierces_immunity: true, procs: true
    },
    '5shot': {
      type: 'skill', class: ['ranger'], name: '5-Shot', level: 75, mp: 320,
      damage_multiplier: 0.5, cooldown_multiplier: 1, multi: true, share: 'attack',
      hostile: true, wtype: ['bow', 'crossbow'], pierces_immunity: true, procs: true
    },
    supershot: {
      type: 'skill', class: ['ranger'], name: 'Supershot', mp: 400,
      damage_multiplier: 1.5, cooldown: 30000, hostile: true, target: true,
      wtype: ['bow', 'crossbow']
    },
    fanofknives: {
      type: 'skill', class: ['rogue'], name: 'Fan of Knives', level: 65, mp: 180,
      range: 160, multi: true, max_targets: 5, share: 'attack',
      slot: [['belt', 'knifebelt']], hostile: true, damage_multiplier: 0.85
    },
    cburst: {
      type: 'skill', class: ['mage'], name: 'Controlled Mana Burst', level: 75,
      mp: 80, cooldown: 240, list: true, hostile: true
    },
    heal: {
      type: 'ability', class: ['priest'], name: 'Heal', heal: true, target: true,
      share: 'attack', cooldown_multiplier: 1
    },
    partyheal: {
      type: 'skill', class: ['priest'], name: 'Party Heal', mp: 400, cooldown: 200,
      party: true, multi: true, heal: true
    }
  };
}

function rootWithSkills(skillData = skills()) {
  const root = {
    G: { skills: skillData, items: {
      bow1: { wtype: 'bow' },
      knifebelt: { type: 'belt' },
      basher1: { wtype: 'basher' }
    } },
    server_region: 'EU',
    server_identifier: 'I',
    parent: {}
  };
  root.parent.G = root.G;
  root.parent.server_region = root.server_region;
  root.parent.server_identifier = root.server_identifier;
  return root;
}

function snapshot(overrides = {}) {
  return {
    character: {
      name: 'RangerA', ctype: 'ranger', level: 75, map: 'main',
      hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000,
      ...overrides
    },
    party: [],
    entities: []
  };
}

test('live SkillCatalog models current multi-target semantics from G.skills without stale test constants', () => {
  const root = rootWithSkills();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  const first = catalog.audit('TEST', { force: true });
  assert.equal(first.ok, true);
  assert.equal(catalog.status().state, SkillCatalogState.READY);

  const three = catalog.get('3shot');
  assert.equal(three.requiredLevel, 60);
  assert.equal(three.damageMultiplier, 0.7);
  assert.equal(three.multi, true);
  assert.equal(three.targetCapacity, 3);
  assert.ok(three.capabilities.includes(Capability.RANGED_MULTI_TARGET_DAMAGE));

  const five = catalog.get('5shot');
  assert.equal(five.requiredLevel, 75);
  assert.equal(five.damageMultiplier, 0.5);
  assert.equal(five.targetCapacity, 5);

  const knives = catalog.get('fanofknives');
  assert.equal(knives.targetCapacity, 5);
  assert.deepEqual(knives.slot, [['belt', 'knifebelt']]);

  const cburst = catalog.get('cburst');
  assert.equal(cburst.list, true);
  assert.ok(cburst.capabilities.includes(Capability.VARIABLE_MULTI_TARGET_DAMAGE));
});

test('skill definition drift invalidates combat readiness until a second identical audit verifies it', () => {
  let now = 1000;
  const root = rootWithSkills();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => now });
  catalog.audit('INITIAL', { force: true });
  const generation = catalog.status().generation;

  root.G.skills['3shot'].damage_multiplier = 0.75;
  now += 100;
  const drift = catalog.audit('PERIODIC', { force: true });
  assert.equal(drift.drift, true);
  assert.equal(catalog.status().state, SkillCatalogState.DRIFT_DETECTED);
  assert.equal(catalog.status().combatReady, false);
  assert.equal(catalog.status().generation, generation + 1);
  assert.deepEqual(catalog.status().lastChange.changedSkills, ['3shot']);

  now += 100;
  const verified = catalog.audit('VERIFY', { force: true });
  assert.equal(verified.changed, false);
  assert.equal(catalog.status().state, SkillCatalogState.READY);
  assert.equal(catalog.get('3shot').damageMultiplier, 0.75);
});

test('connection gaps mark the catalog stale and recovery forces revalidation', () => {
  let now = 1000;
  const root = rootWithSkills();
  const catalog = new SkillCatalogService({
    root, getGameData: () => root.G, now: () => now, connectionGapMs: 5000
  });
  catalog.audit('INITIAL', { force: true });
  catalog.observeRuntime({ snapshot: snapshot(), liveCharacter: { slots: { mainhand: { name: 'bow1' } } } });

  catalog.noteSnapshotUnavailable();
  now += 5001;
  catalog.noteSnapshotUnavailable();
  assert.equal(catalog.status().state, SkillCatalogState.STALE);

  now += 1;
  const recovery = catalog.observeRuntime({
    snapshot: snapshot(),
    liveCharacter: { slots: { mainhand: { name: 'bow1' } } }
  });
  assert.ok(recovery.reasons.includes('CONNECTION_RECOVERED'));
  assert.equal(catalog.status().state, SkillCatalogState.READY);
});

test('per-character skill controls persist and clamp Heal and target-count sliders safely', () => {
  const root = rootWithSkills();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  catalog.audit('INITIAL', { force: true });
  const mem = storage();
  const profiles = new CharacterCombatProfileStore({ root, storage: mem, now: () => 1000 });

  const heal = catalog.get('heal');
  profiles.setEnabled('PriestA', heal, true);
  let result = profiles.setParameter('PriestA', heal, 'hpThreshold', 1.5);
  assert.equal(result.ok, true);
  assert.equal(result.settings.parameters.hpThreshold, 1);

  result = profiles.setParameter('PriestA', heal, 'hpThreshold', -0.2);
  assert.equal(result.settings.parameters.hpThreshold, 0);

  const five = catalog.get('5shot');
  profiles.setEnabled('RangerA', five, true);
  result = profiles.setParameter('RangerA', five, 'minTargets', 99);
  assert.equal(result.settings.parameters.minTargets, 5);

  const restored = new CharacterCombatProfileStore({ root, storage: mem, now: () => 2000 });
  assert.equal(restored.skillSettings('PriestA', heal).enabled, true);
  assert.equal(restored.skillSettings('PriestA', heal).parameters.hpThreshold, 0);
  assert.equal(restored.skillSettings('RangerA', five).parameters.minTargets, 5);
});

test('CharacterCapabilityResolver reacts to level unlocks, user permission and equipment', () => {
  const root = rootWithSkills();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  catalog.audit('INITIAL', { force: true });
  const profiles = new CharacterCombatProfileStore({ root, storage: storage(), now: () => 1000 });
  const resolver = new CharacterCapabilityResolver({ catalog, profiles, now: () => 1000 });

  const l59 = resolver.resolve({ name: 'RangerA', ctype: 'ranger', level: 59, gear: { mainhand: { name: 'bow1' } } }, { gameData: root.G });
  assert.equal(l59.skills.some((row) => row.id === '3shot'), false);

  const l60 = resolver.resolve({ name: 'RangerA', ctype: 'ranger', level: 60, gear: { mainhand: { name: 'bow1' } } }, { gameData: root.G });
  assert.equal(l60.skills.some((row) => row.id === '3shot'), true);
  assert.equal(l60.skills.some((row) => row.id === '5shot'), false);

  profiles.setEnabled('RangerA', catalog.get('3shot'), true);
  profiles.setParameter('RangerA', catalog.get('3shot'), 'minTargets', 2);
  profiles.setEnabled('RangerA', catalog.get('5shot'), true);

  const l75 = resolver.resolve({ name: 'RangerA', ctype: 'ranger', level: 75, gear: { mainhand: { name: 'bow1' } } }, { gameData: root.G });
  const three = l75.skills.find((row) => row.id === '3shot');
  const five = l75.skills.find((row) => row.id === '5shot');
  assert.equal(three.configuredReady, true);
  assert.equal(three.parameters.minTargets, 2);
  assert.equal(five.configuredReady, true);
  assert.ok(l75.enabledCapabilities[Capability.RANGED_MULTI_TARGET_DAMAGE] >= 2);

  profiles.setEnabled('RogueA', catalog.get('fanofknives'), true);
  const rogueNoBelt = resolver.resolve({ name: 'RogueA', ctype: 'rogue', level: 70, gear: { mainhand: { name: 'dagger1' } } }, { gameData: root.G });
  assert.equal(rogueNoBelt.skills.find((row) => row.id === 'fanofknives').equipmentReady, false);

  const rogueWithBelt = resolver.resolve({ name: 'RogueA', ctype: 'rogue', level: 70, gear: { belt: { name: 'knifebelt' } } }, { gameData: root.G });
  assert.equal(rogueWithBelt.skills.find((row) => row.id === 'fanofknives').equipmentReady, true);
});

test('unknown new skills are detected but never become validated automatic combat capabilities', () => {
  const live = {
    mysteryaoe: {
      type: 'skill', class: ['ranger'], name: 'Mystery AoE', level: 1,
      multi: true, hostile: true
    }
  };
  const root = rootWithSkills(live);
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  catalog.audit('INITIAL', { force: true });
  const profiles = new CharacterCombatProfileStore({ root, storage: storage(), now: () => 1000 });
  const resolver = new CharacterCapabilityResolver({ catalog, profiles, now: () => 1000 });
  profiles.setEnabled('RangerA', catalog.get('mysteryaoe'), true);

  const result = resolver.resolve({ name: 'RangerA', ctype: 'ranger', level: 90 }, { gameData: root.G });
  const skill = result.skills.find((row) => row.id === 'mysteryaoe');
  assert.equal(skill.automationValidated, false);
  assert.equal(skill.configuredReady, false);
  assert.equal(result.detectedCapabilities[Capability.MULTI_TARGET_DAMAGE], 1);
  assert.equal(result.structuralCapabilities[Capability.MULTI_TARGET_DAMAGE], undefined);
  assert.equal(result.enabledCapabilities[Capability.MULTI_TARGET_DAMAGE], undefined);
});

test('PartyCapabilityResolver aggregates only live validated and user-enabled AoE capabilities', () => {
  const root = rootWithSkills();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  catalog.audit('INITIAL', { force: true });
  const profiles = new CharacterCombatProfileStore({ root, storage: storage(), now: () => 1000 });
  profiles.setEnabled('RangerA', catalog.get('3shot'), true);
  profiles.setEnabled('RangerA', catalog.get('5shot'), true);
  profiles.setEnabled('PriestA', catalog.get('partyheal'), true);

  const characterResolver = new CharacterCapabilityResolver({ catalog, profiles, now: () => 1000 });
  const partyResolver = new PartyCapabilityResolver({ characterResolver, now: () => 1000 });
  const snap = snapshot();
  snap.party = [
    { name: 'RangerA', type: 'ranger', level: 75, map: 'main' },
    { name: 'PriestA', type: 'priest', level: 80, map: 'main' }
  ];

  const result = partyResolver.resolve({
    snapshot: snap,
    gameData: root.G,
    liveCharacter: { slots: { mainhand: { name: 'bow1' } }, items: [] },
    registryStatus: {
      characters: [
        { name: 'RangerA', ctype: 'ranger', level: 75, gear: { mainhand: { name: 'bow1' } } },
        { name: 'PriestA', ctype: 'priest', level: 80, gear: {} }
      ]
    }
  });
  assert.equal(result.catalogReady, true);
  assert.equal(result.combat.aoePotential, true);
  assert.equal(result.combat.aoeConfigured, true);
  assert.equal(result.combat.support.partyHeal, true);
  assert.ok(result.enabledCapabilities[Capability.RANGED_MULTI_TARGET_DAMAGE] >= 2);
  assert.ok(result.enabledCapabilities[Capability.PARTY_HEAL] >= 1);
});
