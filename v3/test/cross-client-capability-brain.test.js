'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SkillCatalogService } = require('../src/autonomy/skill-catalog-service');
const { CharacterCombatProfileStore } = require('../src/autonomy/character-combat-profile');
const { CharacterCapabilityResolver, PartyCapabilityResolver } = require('../src/autonomy/capability-resolver');
const {
  buildCapabilitySnapshot,
  sanitizeCapabilitySnapshot,
  validateRemoteCapabilitySnapshot
} = require('../src/autonomy/capability-sync');
const { PartyTelemetryBridge } = require('../src/party/telemetry-bridge');
const { StrategicBrainV2, TinyStrategyNetwork, BRAIN_V2_INPUT_NAMES } = require('../src/brain/strategic-brain-v2');
const { ControlPlaneConfig } = require('../src/control/control-plane-config');
const { CombatMode } = require('../src/autonomy/combat-modes');

function storage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; },
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    rows
  };
}

function gameData() {
  return {
    skills: {
      cleave: {
        type: 'skill', class: ['warrior'], name: 'Cleave', level: 52, mp: 720,
        cooldown: 1200, range: 160, wtype: ['axe'], hostile: true
      },
      agitate: {
        type: 'skill', class: ['warrior'], name: 'Agitate', level: 68, mp: 420,
        cooldown: 2200, range: 320, hostile: true
      },
      '3shot': {
        type: 'skill', class: ['ranger'], name: '3-Shot', level: 60, mp: 200,
        damage_multiplier: 0.7, multi: true, share: 'attack',
        hostile: true, wtype: ['bow']
      },
      '5shot': {
        type: 'skill', class: ['ranger'], name: '5-Shot', level: 75, mp: 320,
        damage_multiplier: 0.5, multi: true, share: 'attack',
        hostile: true, wtype: ['bow']
      },
      partyheal: {
        type: 'skill', class: ['priest'], name: 'Party Heal', level: 1,
        mp: 400, heal: true, party: true, multi: true
      }
    },
    items: {
      bow1: { wtype: 'bow' },
      axe1: { wtype: 'axe' }
    },
    monsters: {}
  };
}

function makeClient(name, ctype, level, gear, configure = () => {}, now = () => 1000) {
  const G = gameData();
  const root = { G };
  const catalog = new SkillCatalogService({ root, getGameData: () => G, now });
  catalog.audit('TEST', { force: true });
  const profiles = new CharacterCombatProfileStore({ root, storage: storage(), now });
  configure({ catalog, profiles });
  const resolver = new CharacterCapabilityResolver({ catalog, profiles, now });
  const live = { name, ctype, level, slots: gear, items: [] };
  const resolved = resolver.resolve({ name, ctype, level, gear }, { gameData: G, liveCharacter: live });
  const runtime = {
    now,
    lastSnapshot: { character: { name, ctype, level } },
    skillCatalog: catalog,
    characterCombatProfiles: profiles,
    characterCapabilityResolver: resolver,
    lastCharacterCapabilities: resolved
  };
  return { G, root, catalog, profiles, resolver, live, resolved, runtime };
}

test('capability sync snapshot carries per-character permissions, sliders and catalog identity only for validated skills', () => {
  const ranger = makeClient('RangerA', 'ranger', 80, { mainhand: { name: 'bow1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('RangerA', catalog.get('3shot'), true);
    profiles.setParameter('RangerA', catalog.get('3shot'), 'minTargets', 2);
    profiles.setEnabled('RangerA', catalog.get('5shot'), false);
    profiles.setCombatMode('RangerA', CombatMode.AOE_PREFERRED);
  });

  ranger.runtime.tacticalPartyCombat = {
    encounter: {
      pullOwner: 'RangerA',
      aoe: {
        combatMode: CombatMode.AOE_PREFERRED,
        state: 'AOE_BURN',
        pullCapacity: 5,
        desiredPullSize: 4,
        engagedCount: 3,
        adaptivePull: {
          applied: true,
          reason: 'SUSTAINABLE_XP_OPTIMUM',
          recommendedSize: 4,
          profiles: [{ size: 4, confidence: 0.84 }]
        }
      }
    }
  };
  const report = buildCapabilitySnapshot(ranger.runtime, ranger.runtime.lastSnapshot.character);
  assert.equal(report.character, 'RangerA');
  assert.equal(report.combatMode, CombatMode.AOE_PREFERRED);
  assert.equal(report.catalog.state, 'READY');
  assert.equal(report.catalog.fingerprint, ranger.catalog.status().fingerprint);
  assert.equal(report.skills.find((row) => row.id === '3shot').configuredReady, true);
  assert.equal(report.skills.find((row) => row.id === '3shot').parameters.minTargets, 2);
  assert.equal(report.skills.find((row) => row.id === '5shot').enabled, false);
  assert.equal(report.skills.find((row) => row.id === '5shot').configuredReady, false);
  assert.equal(report.combat.authoritative, true);
  assert.equal(report.combat.pullCapacity, 5);
  assert.equal(report.combat.desiredPullSize, 4);
  assert.equal(report.combat.engagedCount, 3);
  assert.equal(report.combat.adaptivePull.confidence, 0.84);

  const clean = sanitizeCapabilitySnapshot(report, { name: 'RangerA', ctype: 'ranger', level: 80 });
  assert.ok(clean);
  assert.equal(clean.enabledCapabilities.ranged_multi_target_damage, 1);
  assert.equal(sanitizeCapabilitySnapshot(report, { name: 'DifferentName', ctype: 'ranger' }), null);
});

test('party telemetry broadcasts one bounded capability report to merchant and current party peers', () => {
  const now = 6000;
  const client = makeClient('RangerA', 'ranger', 80, { mainhand: { name: 'bow1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('RangerA', catalog.get('3shot'), true);
  }, () => now);
  const sent = [];
  const root = { character: { ...client.runtime.lastSnapshot.character, map: 'main', hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 } };
  const bridge = new PartyTelemetryBridge({
    root,
    now: () => now,
    merchantName: 'MerchantA',
    trustedNames: ['MerchantA', 'WarriorA', 'PriestA', 'RangerA']
  });
  const runtime = {
    ...client.runtime,
    root,
    lastSnapshot: {
      character: root.character,
      party: [
        { name: 'WarriorA', ctype: 'warrior' },
        { name: 'PriestA', ctype: 'priest' },
        { name: 'MerchantA', ctype: 'merchant' }
      ],
      entities: []
    },
    performance: { status: () => ({ current: { rates: {} } }) },
    farmerStatus: () => ({}),
    localFarming: { status: () => ({}) },
    adapter: {
      canCommand: () => true,
      command(action, args) {
        sent.push({ action, args });
        return { executed: true, value: null };
      }
    }
  };

  assert.equal(bridge.tick(runtime), true);
  assert.deepEqual(sent.map((row) => row.args[0]).sort(), ['MerchantA', 'PriestA', 'WarriorA']);
  assert.ok(sent.every((row) => row.action === 'send_cm'));
  assert.ok(sent.every((row) => row.args[1].capabilities && row.args[1].capabilities.character === 'RangerA'));
  assert.equal(bridge.status().stats.merchantSent, 1);
  assert.equal(bridge.status().stats.peerSent, 2);
});

test('merchant remains receive-only and never rebroadcasts its own telemetry report', () => {
  const sent = [];
  const root = { character: { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 } };
  const bridge = new PartyTelemetryBridge({
    root,
    now: () => 1000,
    merchantName: 'MerchantA',
    trustedNames: ['MerchantA', 'WarriorA', 'RangerA']
  });
  const runtime = {
    root,
    lastSnapshot: {
      character: root.character,
      party: [{ name: 'WarriorA', ctype: 'warrior' }, { name: 'RangerA', ctype: 'ranger' }],
      entities: []
    },
    performance: { status: () => ({ current: { rates: {} } }) },
    farmerStatus: () => ({}),
    localFarming: { status: () => ({}) },
    adapter: {
      canCommand: () => true,
      command(action, args) { sent.push({ action, args }); return { executed: true }; }
    }
  };
  assert.equal(bridge.tick(runtime), false);
  assert.equal(sent.length, 0);
});

test('party resolver uses fresh per-name remote capabilities for duplicate classes and never falls back to guessed remote profiles', () => {
  let now = 1000;
  const leader = makeClient('WarriorA', 'warrior', 80, { mainhand: { name: 'axe1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('WarriorA', catalog.get('cleave'), true);
    profiles.setParameter('WarriorA', catalog.get('cleave'), 'minTargets', 3);
  }, () => now);
  const ranger1 = makeClient('Ranger1', 'ranger', 80, { mainhand: { name: 'bow1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('Ranger1', catalog.get('3shot'), true);
    profiles.setParameter('Ranger1', catalog.get('3shot'), 'minTargets', 2);
    profiles.setEnabled('Ranger1', catalog.get('5shot'), true);
    profiles.setParameter('Ranger1', catalog.get('5shot'), 'minTargets', 4);
  }, () => now);
  const ranger2 = makeClient('Ranger2', 'ranger', 80, { mainhand: { name: 'bow1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('Ranger2', catalog.get('3shot'), true);
    profiles.setParameter('Ranger2', catalog.get('3shot'), 'minTargets', 3);
    profiles.setEnabled('Ranger2', catalog.get('5shot'), false);
  }, () => now);

  const resolver = new PartyCapabilityResolver({ characterResolver: leader.resolver, now: () => now });
  const snap = {
    character: { name: 'WarriorA', ctype: 'warrior', level: 80 },
    party: [
      { name: 'Ranger1', ctype: 'ranger', type: 'ranger', level: 80 },
      { name: 'Ranger2', ctype: 'ranger', type: 'ranger', level: 80 }
    ]
  };
  const remoteCapabilities = {
    Ranger1: buildCapabilitySnapshot(ranger1.runtime, ranger1.runtime.lastSnapshot.character),
    Ranger2: buildCapabilitySnapshot(ranger2.runtime, ranger2.runtime.lastSnapshot.character)
  };
  const result = resolver.resolve({
    snapshot: snap,
    gameData: leader.G,
    liveCharacter: leader.live,
    registryStatus: { characters: snap.party },
    remoteCapabilities,
    remoteCapabilityTtlMs: 20000
  });

  assert.equal(result.remoteSync.coverage, 1);
  assert.equal(result.remoteSync.valid, 2);
  assert.equal(result.catalogReady, true);
  const r1 = result.members.find((row) => row.name === 'Ranger1');
  const r2 = result.members.find((row) => row.name === 'Ranger2');
  assert.equal(r1.remote, true);
  assert.equal(r2.remote, true);
  assert.equal(r1.skills.find((row) => row.id === '5shot').configuredReady, true);
  assert.equal(r2.skills.find((row) => row.id === '5shot').configuredReady, false);
  assert.equal(r1.skills.find((row) => row.id === '3shot').parameters.minTargets, 2);
  assert.equal(r2.skills.find((row) => row.id === '3shot').parameters.minTargets, 3);
});

test('stale, missing or catalog-mismatched remote capabilities fail closed for Smart AoE capacity', () => {
  let now = 1000;
  const leader = makeClient('WarriorA', 'warrior', 80, { mainhand: { name: 'axe1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('WarriorA', catalog.get('cleave'), true);
  }, () => now);
  const ranger = makeClient('RangerA', 'ranger', 80, { mainhand: { name: 'bow1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('RangerA', catalog.get('3shot'), true);
  }, () => now);
  const resolver = new PartyCapabilityResolver({ characterResolver: leader.resolver, now: () => now });
  const snap = {
    character: { name: 'WarriorA', ctype: 'warrior', level: 80 },
    party: [{ name: 'RangerA', ctype: 'ranger', type: 'ranger', level: 80 }]
  };

  const good = buildCapabilitySnapshot(ranger.runtime, ranger.runtime.lastSnapshot.character);
  now = 25050;
  let result = resolver.resolve({
    snapshot: snap, gameData: leader.G, liveCharacter: leader.live,
    registryStatus: { characters: snap.party },
    remoteCapabilities: { RangerA: good }, remoteCapabilityTtlMs: 20000
  });
  assert.equal(result.catalogReady, false);
  assert.equal(result.remoteSync.rows[0].reason, 'REMOTE_CAPABILITY_STALE');
  assert.equal(result.combat.aoeConfigured, false);

  now = 26000;
  const mismatched = { ...good, observedAt: now, catalog: { ...good.catalog, fingerprint: 'different-live-catalog' } };
  result = resolver.resolve({
    snapshot: snap, gameData: leader.G, liveCharacter: leader.live,
    registryStatus: { characters: snap.party },
    remoteCapabilities: { RangerA: mismatched }, remoteCapabilityTtlMs: 20000
  });
  assert.equal(result.catalogReady, false);
  assert.equal(result.remoteSync.rows[0].reason, 'SKILL_CATALOG_FINGERPRINT_MISMATCH');
  assert.equal(result.remoteSync.catalogAgreement, false);

  result = resolver.resolve({
    snapshot: snap, gameData: leader.G, liveCharacter: leader.live,
    registryStatus: { characters: snap.party },
    remoteCapabilities: {}, remoteCapabilityTtlMs: 20000
  });
  assert.equal(result.remoteSync.coverage, 0);
  assert.equal(result.remoteSync.rows[0].reason, 'REMOTE_CAPABILITY_MISSING');
  assert.equal(result.combat.aoeConfigured, false);
});

test('remote capability validation trusts same live catalog fingerprint even when audit generation differs', () => {
  const ranger = makeClient('RangerA', 'ranger', 80, { mainhand: { name: 'bow1' } }, ({ catalog, profiles }) => {
    profiles.setEnabled('RangerA', catalog.get('3shot'), true);
  });
  const snapshot = buildCapabilitySnapshot(ranger.runtime, ranger.runtime.lastSnapshot.character);
  snapshot.catalog.generation += 7;
  const checked = validateRemoteCapabilitySnapshot(snapshot, ranger.catalog.status(), {
    now: 1000, maxAgeMs: 20000, expected: { name: 'RangerA', ctype: 'ranger' }
  });
  assert.equal(checked.valid, true);
});

function brainRuntime() {
  const mem = storage();
  const runtime = {
    root: { localStorage: mem },
    now: () => 5000,
    log: { rows: [], emit(row) { this.rows.push(row); }, list() { return this.rows; } },
    lastSnapshot: {
      character: { name: 'WarriorA', ctype: 'warrior', level: 80, hp: 4500, max_hp: 5000, mp: 1600, max_mp: 2000, range: 60, speed: 50, attack: 900, isize: 42, inventory: [] },
      party: [
        { name: 'RangerA', ctype: 'ranger', hp: 3000, max_hp: 3000 },
        { name: 'PriestA', ctype: 'priest', hp: 2800, max_hp: 3000 }
      ],
      entities: []
    },
    performance: { status: () => ({ current: { rates: { xpPerHour: 800000, goldPerHour: 50000, deathsPerHour: 0, damageTakenPerHour: 1000 } }, recent: [] }) },
    combatRisk: { threshold: 0.65 },
    characterCombatProfiles: { getCombatMode: () => CombatMode.SMART_AUTO },
    partyCapabilityResolver: {
      status: () => ({
        remoteSync: { enabled: true, coverage: 0.75, catalogAgreement: true, valid: 3, expected: 4 },
        combat: {
          aoeConfigured: true,
          configuredSupport: { partyHeal: true, groupSustain: true, aoeControl: false, aoeAggroControl: true }
        },
        members: [
          { name: 'WarriorA', ctype: 'warrior', skills: [{ id: 'cleave', configuredReady: true, targetCapacity: null, parameters: { minTargets: 3 }, capabilities: ['aoe_damage'] }] },
          { name: 'RangerA', ctype: 'ranger', remote: true, remoteSync: { valid: true }, skills: [{ id: '5shot', configuredReady: true, targetCapacity: 5, parameters: { minTargets: 4 }, capabilities: ['multi_target_damage'] }] },
          { name: 'PriestA', ctype: 'priest', remote: true, remoteSync: { valid: true }, skills: [{ id: 'partyheal', configuredReady: true, targetCapacity: null, parameters: { minInjuredMembers: 2 }, capabilities: ['party_heal', 'group_sustain'] }] }
        ]
      })
    },
    tacticalPartyCombat: {
      encounter: {
        aoe: {
          combatMode: CombatMode.SMART_AUTO,
          state: 'AOE_BURN',
          pullCapacity: 5,
          desiredPullSize: 4,
          engagedCount: 3,
          adaptivePull: {
            applied: true,
            reason: 'SUSTAINABLE_XP_OPTIMUM',
            recommendedSize: 4,
            profiles: [{ size: 4, confidence: 0.82 }]
          }
        }
      }
    },
    adaptivePullLearner: { lastRecommendation: null },
    gearProgression: { list: () => [] },
    world: { status: () => ({ confidence: 0.9 }) },
    economyEquipmentAutonomyV2: { status: () => ({ marketDecisions: [], homeService: { phase: 'STANDBY' } }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    brain: { observe: () => null }
  };
  return runtime;
}

test('StrategicBrainV2 learns with explicit party capability and adaptive pull features and exposes them to teacher requests', () => {
  const runtime = brainRuntime();
  const control = new ControlPlaneConfig({ root: runtime.root, now: runtime.now, log: runtime.log });
  const brain = new StrategicBrainV2({ runtime, root: runtime.root, now: runtime.now, log: runtime.log, controlPlane: control, legacyBrain: runtime.brain });
  const observation = brain.observe({
    snapshot: runtime.lastSnapshot,
    candidates: [{ id: 'main:goo', monster: 'goo', xpPerHour: 800000, goldPerHour: 50000, deathsPerHour: 0, confidence: 0.9, travelSeconds: 10, expectedKillSeconds: 10 }],
    teacherRanking: [{ id: 'main:goo', monster: 'goo', xpPerHour: 800000, goldPerHour: 50000, confidence: 0.9, travelSeconds: 10 }],
    currentPlan: { id: 'main:goo', monster: 'goo' }
  });

  assert.equal(BRAIN_V2_INPUT_NAMES.length, 43);
  assert.equal(observation.inputs.capabilityCoverage, 0.75);
  assert.equal(observation.inputs.catalogAgreement, 1);
  assert.equal(observation.inputs.aoeConfigured, 1);
  assert.equal(observation.inputs.aoeSupport, 0.75);
  assert.equal(observation.inputs.combatModeAggression, 0.5);
  assert.equal(observation.inputs.pullCapacity, 0.625);
  assert.equal(observation.inputs.desiredPullRatio, 0.8);
  assert.equal(observation.inputs.engagedPullRatio, 0.6);
  assert.equal(observation.inputs.adaptivePullConfidence, 0.82);
  assert.equal(observation.inputs.adaptiveSafetySignal, 1);

  const replay = brain.replay(8);
  assert.ok(replay.some((row) => Array.isArray(row.vector) && row.vector.length === 43));
  const teacher = brain.teacherRequest('test');
  assert.equal(teacher.inputs.pullCapacity, 0.625);
  assert.equal(teacher.capabilityLearning.remoteSync.coverage, 0.75);
  assert.equal(teacher.capabilityLearning.combat.hardCapacity, 5);
  assert.equal(teacher.capabilityLearning.adaptive.reason, 'SUSTAINABLE_XP_OPTIMUM');
  assert.equal(teacher.policies.adaptivePullCannotExceedHardCapacity, true);
});

test('Merchant StrategicBrainV2 consumes authoritative remote leader pull context from party telemetry', () => {
  const runtime = brainRuntime();
  runtime.lastSnapshot.character = {
    ...runtime.lastSnapshot.character,
    name: 'MerchantA',
    ctype: 'merchant',
    hp: 2000,
    max_hp: 2000,
    mp: 1500,
    max_mp: 1500
  };
  runtime.tacticalPartyCombat = null;
  runtime.adaptivePullLearner = { lastRecommendation: null };
  runtime.partyTelemetry = {
    capabilityReports: () => ({
      WarriorA: {
        character: 'WarriorA',
        ctype: 'warrior',
        combat: {
          authoritative: true,
          pullOwner: 'WarriorA',
          combatMode: CombatMode.AOE_PREFERRED,
          state: 'AOE_BURN',
          pullCapacity: 5,
          desiredPullSize: 4,
          engagedCount: 3,
          adaptivePull: {
            applied: true,
            reason: 'SUSTAINABLE_XP_OPTIMUM',
            recommendedSize: 4,
            confidence: 0.88
          }
        }
      }
    })
  };
  const control = new ControlPlaneConfig({ root: runtime.root, now: runtime.now, log: runtime.log });
  const brain = new StrategicBrainV2({ runtime, root: runtime.root, now: runtime.now, log: runtime.log, controlPlane: control, legacyBrain: runtime.brain });
  const observation = brain.observe({
    snapshot: runtime.lastSnapshot,
    candidates: [{ id: 'main:goo', monster: 'goo', xpPerHour: 800000, goldPerHour: 50000, deathsPerHour: 0, confidence: 0.9, travelSeconds: 10, expectedKillSeconds: 10 }],
    teacherRanking: [{ id: 'main:goo', monster: 'goo', xpPerHour: 800000, goldPerHour: 50000, confidence: 0.9, travelSeconds: 10 }],
    currentPlan: { id: 'main:goo', monster: 'goo' }
  });

  assert.equal(observation.inputs.combatModeAggression, 1);
  assert.equal(observation.inputs.pullCapacity, 0.625);
  assert.equal(observation.inputs.desiredPullRatio, 0.8);
  assert.equal(observation.inputs.engagedPullRatio, 0.6);
  assert.equal(observation.inputs.adaptivePullConfidence, 0.88);
  const teacher = brain.teacherRequest('merchant-remote-context');
  assert.equal(teacher.capabilityLearning.combat.source, 'remote-leader:WarriorA');
  assert.equal(teacher.capabilityLearning.combat.hardCapacity, 5);
  assert.equal(teacher.capabilityLearning.adaptive.reason, 'SUSTAINABLE_XP_OPTIMUM');
});

test('TinyStrategyNetwork migrates old 32-input brain weights and preserves all legacy columns', () => {
  const legacyInputs = 32;
  const oldState = {
    w1: Array.from({ length: 24 }, (_, h) => Array.from({ length: legacyInputs }, (_, i) => (h + 1) * 0.001 + i * 0.00001)),
    b1: Array(24).fill(0.1),
    w2: Array.from({ length: 5 }, () => Array(24).fill(0.02)),
    b2: Array(5).fill(0.03)
  };
  const net = new TinyStrategyNetwork();
  assert.equal(net.restore(oldState), true);
  const migrated = net.snapshot();
  assert.equal(migrated.w1[0].length, 43);
  assert.deepEqual(migrated.w1[0].slice(0, legacyInputs), oldState.w1[0]);
  assert.ok(migrated.w1[0].slice(legacyInputs).every(Number.isFinite));
  assert.equal(net.forward(Array(43).fill(0.5)).probs.length, 5);
});
