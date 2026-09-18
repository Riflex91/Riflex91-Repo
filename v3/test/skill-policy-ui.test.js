'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAdapter } = require('../src/game/adapter');
const { SkillCatalogService, SkillCatalogState } = require('../src/autonomy/skill-catalog-service');
const { CharacterCombatProfileStore } = require('../src/autonomy/character-combat-profile');
const { SkillPolicy } = require('../src/autonomy/skill-policy');
const { SkillUsagePolicy } = require('../src/farmer/skill-usage');
const { PartySkillEngine } = require('../src/autonomy/party-skill-engine');
const { DebugMonitorUI } = require('../src/ops/debug-monitor-ui');

function storage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; }
  };
}

function skills() {
  return {
    supershot: {
      type: 'skill', class: ['ranger'], name: 'Supershot', level: 30, mp: 100,
      hostile: true, target: true, damage_multiplier: 1.5, wtype: ['bow', 'crossbow']
    },
    heal: {
      type: 'ability', class: ['priest'], name: 'Heal', level: 1, heal: true,
      target: true, share: 'attack'
    },
    partyheal: {
      type: 'skill', class: ['priest'], name: 'Party Heal', level: 1, mp: 400,
      heal: true, party: true, multi: true
    },
    mysteryaoe: {
      type: 'skill', class: ['ranger'], name: 'Mystery AoE', level: 1,
      hostile: true, multi: true
    }
  };
}

function rangerRoot() {
  let casts = 0;
  const root = {
    character: {
      name: 'RangerA', ctype: 'ranger', level: 80, map: 'main',
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, range: 120,
      slots: { mainhand: { name: 'bow1' } }, items: []
    },
    G: { skills: skills(), items: { bow1: { wtype: 'bow' } }, monsters: {}, maps: {} },
    parent: { entities: { m1: { id: 'm1', mtype: 'goo', x: 20, y: 0 } }, party: {} },
    can_use: () => true,
    is_on_cooldown: () => false,
    is_in_range: () => true,
    use_skill() { casts += 1; }
  };
  root.parent.character = root.character;
  root.parent.G = root.G;
  return { root, casts: () => casts };
}

function fixture(mode = 'active') {
  const { root, casts } = rangerRoot();
  const mem = storage();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  catalog.audit('TEST', { force: true });
  const profiles = new CharacterCombatProfileStore({ root, storage: mem, now: () => 1000 });
  const policy = new SkillPolicy({ root, catalog, profiles, now: () => 1000 });
  const adapter = new GameAdapter({ root, parent: root.parent, mode, skillPolicy: policy, now: () => 1000 });
  return { root, casts, mem, catalog, profiles, policy, adapter };
}

test('known legacy automatic skills preserve default-on behavior while user disable is a hard GameAdapter block', () => {
  const f = fixture('active');
  assert.equal(f.profiles.skillSettings('RangerA', f.catalog.get('supershot')).enabled, true);
  const first = f.adapter.command('use_skill', ['supershot', 'm1']);
  assert.equal(first.executed, true);
  assert.equal(f.casts(), 1);

  f.profiles.setEnabled('RangerA', f.catalog.get('supershot'), false);
  const blocked = f.adapter.command('use_skill', ['supershot', 'm1']);
  assert.equal(blocked.executed, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.reason, 'SKILL_POLICY_DISABLED');
  assert.equal(f.casts(), 1);
});

test('skill policy blocks disabled skills before shadow command simulation too', () => {
  const f = fixture('shadow');
  f.profiles.setEnabled('RangerA', f.catalog.get('supershot'), false);
  const result = f.adapter.command('use_skill', ['supershot', 'm1']);
  assert.equal(result.executed, false);
  assert.equal(result.shadow, false);
  assert.equal(result.blocked, true);
  assert.equal(result.reason, 'SKILL_POLICY_DISABLED');
});

test('unknown newly discovered skills remain fail-closed even if a profile is manually toggled', () => {
  const f = fixture('active');
  const mystery = f.catalog.get('mysteryaoe');
  assert.equal(mystery.automationValidated, false);
  assert.equal(mystery.defaultEnabled, false);
  f.profiles.setEnabled('RangerA', mystery, true);
  const result = f.adapter.command('use_skill', ['mysteryaoe']);
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'SKILL_AUTOMATION_NOT_VALIDATED');
  assert.equal(f.casts(), 0);
});

test('catalog drift blocks all skill execution until the second identical audit verifies the new live catalog', () => {
  let now = 1000;
  const { root, casts } = rangerRoot();
  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => now });
  catalog.audit('INITIAL', { force: true });
  const profiles = new CharacterCombatProfileStore({ root, storage: storage(), now: () => now });
  const policy = new SkillPolicy({ root, catalog, profiles, now: () => now });
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active', skillPolicy: policy, now: () => now });

  root.G.skills.supershot.mp = 101;
  now += 10;
  catalog.audit('DRIFT', { force: true });
  assert.equal(catalog.status().state, SkillCatalogState.DRIFT_DETECTED);
  const blocked = adapter.command('use_skill', ['supershot', 'm1']);
  assert.equal(blocked.reason, 'SKILL_CATALOG_NOT_READY');
  assert.equal(casts(), 0);

  now += 10;
  catalog.audit('VERIFY', { force: true });
  assert.equal(catalog.status().state, SkillCatalogState.READY);
  assert.equal(adapter.command('use_skill', ['supershot', 'm1']).executed, true);
  assert.equal(casts(), 1);
});

test('GameAdapter skillAvailability exposes technical readiness reasons without removing the skill from configuration', () => {
  const f = fixture('active');
  f.root.character.mp = 50;
  assert.equal(f.adapter.skillAvailability('supershot').reason, 'LOW_MP');
  f.root.character.mp = 500;
  f.root.character.slots = {};
  assert.equal(f.adapter.skillAvailability('supershot').reason, 'WEAPON_TYPE_REQUIRED');
  f.root.character.slots = { mainhand: { name: 'bow1' } };
  assert.equal(f.adapter.skillAvailability('supershot').ready, true);
});

test('direct SkillUsagePolicy candidates are filtered by the central user permission before tactical selection', () => {
  const f = fixture('active');
  const usage = new SkillUsagePolicy({ skillPolicy: f.policy });
  assert.equal(usage.candidates(f.root.character, f.root.G).some((row) => row.id === 'supershot'), true);
  f.profiles.setEnabled('RangerA', f.catalog.get('supershot'), false);
  assert.equal(usage.candidates(f.root.character, f.root.G).some((row) => row.id === 'supershot'), false);
});

test('Priest Heal and Party Heal thresholds select single heal for one injury and party heal for multiple injuries', () => {
  const settings = {
    heal: { enabled: true, parameters: { hpThreshold: 0.65 } },
    partyheal: { enabled: true, parameters: { hpThreshold: 0.72, minInjuredMembers: 2 } }
  };
  const skillPolicy = {
    peek: (id) => !!settings[id],
    settings: (id) => settings[id] || null
  };
  const farmer = {
    skillUsage: { candidates: () => [], mpReserveRatio: 0, minIntervalMs: 250 },
    _needsRecovery: () => ({ hpUnsafe: false }),
    _targetAllowed: () => true,
    _engage() {}
  };
  let members = [
    { name: 'PriestA', ctype: 'priest', hp: 1000, max_hp: 1000 },
    { name: 'WarriorA', ctype: 'warrior', hp: 600, max_hp: 1000 },
    { name: 'RangerA', ctype: 'ranger', hp: 950, max_hp: 1000 }
  ];
  const team = {
    _team: () => ({ members }),
    _combatGate: () => ({ allowed: true, team: { members } })
  };
  const runtime = { farmer, teamCombatCohesionHotfix: team, skillPolicy, now: () => 1000, log: { emit() {} } };
  const engine = new PartySkillEngine(runtime);
  const context = {
    snapshot: { character: { name: 'PriestA', ctype: 'priest', hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 }, entities: [] },
    adapter: {
      getGameData: () => ({ skills: skills() }),
      canUseSkill: () => true,
      isSkillInRange: () => true
    },
    party: {}
  };
  const target = { id: 'm1', mtype: 'goo', hp: 1000, target: 'WarriorA' };

  const single = engine._supportDecision(context, target, { members });
  assert.equal(single.id, 'heal');
  assert.equal(single.args[1], 'WarriorA');

  members = [
    { name: 'PriestA', ctype: 'priest', hp: 700, max_hp: 1000 },
    { name: 'WarriorA', ctype: 'warrior', hp: 600, max_hp: 1000 },
    { name: 'RangerA', ctype: 'ranger', hp: 950, max_hp: 1000 }
  ];
  const party = engine._supportDecision(context, target, { members });
  assert.equal(party.id, 'partyheal');
  assert.equal(party.injuredCount, 2);
});

class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.attributes = {};
    this.textContent = '';
    this.value = '';
    this.firstChild = null;
    this.onclick = null;
    this.onchange = null;
    this.oninput = null;
    this.onmousedown = null;
    this.disabled = false;
    this.checked = false;
    this.title = '';
  }
  appendChild(node) { node.parentNode = this; this.children.push(node); this.firstChild = this.children[0] || null; return node; }
  removeChild(node) { this.children = this.children.filter((row) => row !== node); node.parentNode = null; this.firstChild = this.children[0] || null; return node; }
  setAttribute(key, value) { this.attributes[key] = value; }
  focus() {}
  select() {}
  setSelectionRange() {}
}

function fakeDocument() {
  const body = new FakeNode('body');
  return {
    body,
    documentElement: body,
    createElement(tag) { return new FakeNode(tag); },
    getElementById(id) {
      const walk = (node) => {
        if (node.id === id) return node;
        for (const child of node.children || []) {
          const found = walk(child);
          if (found) return found;
        }
        return null;
      };
      return walk(body);
    }
  };
}

function findNodes(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.children || []) findNodes(child, predicate, out);
  return out;
}

test('Debug monitor Skills panel renders unlocked skills, checkboxes and Heal/PartyHeal sliders without raw gameplay authority', () => {
  const document = fakeDocument();
  const root = {
    document,
    character: {
      name: 'PriestA', ctype: 'priest', level: 80, map: 'main',
      hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000, slots: {}, items: []
    },
    G: { skills: skills(), items: {}, monsters: {}, maps: {} },
    parent: { entities: {}, party: {} },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: (fn) => { fn(); return 1; },
    can_use: () => true,
    is_on_cooldown: () => false
  };
  root.parent.character = root.character;
  root.parent.G = root.G;

  const catalog = new SkillCatalogService({ root, getGameData: () => root.G, now: () => 1000 });
  const profiles = new CharacterCombatProfileStore({ root, storage: storage(), now: () => 1000 });
  const policy = new SkillPolicy({ root, catalog, profiles, now: () => 1000 });
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'shadow', skillPolicy: policy, now: () => 1000 });
  const runtime = {
    root, adapter, skillCatalog: catalog, characterCombatProfiles: profiles, skillPolicy: policy,
    lastSnapshot: { character: root.character, party: [], entities: [] },
    _refreshSkillCapabilities() {},
    status: () => ({ running: false, merchantService: null })
  };
  const monitor = {
    runtime,
    now: () => 1000,
    summary: () => ({
      version: 'test', running: false, mode: 'shadow', startedAt: 1000, generatedAt: 1000,
      character: root.character, supervisor: {}, economy: { controlled: {} }, travel: { controlled: {} },
      inventory: {}, recentSignals: { errors: 0, warnings: 0 }
    }),
    copyToClipboard: async () => ({ copied: true }),
    exportSession: () => '{}'
  };
  const runControl = { status: () => ({ state: 'STOPPED', running: false, blockers: [] }) };
  const ui = new DebugMonitorUI({ root, monitor, runControl, refreshMs: 500 });

  assert.equal(ui.show().shown, true);
  assert.equal(ui._toggleSkillsPanel(), true);
  assert.equal(ui.skillsPanel.style.display, 'block');
  assert.equal(ui.skillsButton.textContent, 'Skills 2/2');

  const state = ui._skillPanelState();
  assert.deepEqual(state.rows.map((row) => row.skill.id).sort(), ['heal', 'partyheal']);
  assert.equal(state.rows.find((row) => row.skill.id === 'heal').parameters.hpThreshold, 0.65);
  assert.equal(state.rows.find((row) => row.skill.id === 'partyheal').parameters.hpThreshold, 0.72);

  const ranges = findNodes(ui.skillsPanel, (node) => node.tagName === 'INPUT' && node.type === 'range');
  assert.ok(ranges.some((node) => node.value === '65'));
  assert.ok(ranges.some((node) => node.value === '72'));
  assert.ok(ranges.some((node) => node.value === '2'));

  assert.equal(ui._setSkillEnabled('heal', false), true);
  assert.equal(ui._skillPanelState().rows.find((row) => row.skill.id === 'heal').enabled, false);
  assert.equal(ui.skillsButton.textContent, 'Skills 1/2');

  assert.equal(ui._setSkillParameter('partyheal', 'hpThreshold', 0.80), true);
  assert.equal(ui._skillPanelState().rows.find((row) => row.skill.id === 'partyheal').parameters.hpThreshold, 0.8);

  const status = ui.status();
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directGameplayActionAccess, false);
  assert.equal(status.skillConfigurationAuthority, true);
  ui.destroy();
});
