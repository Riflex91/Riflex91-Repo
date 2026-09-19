'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha14Runtime,
  InventoryLedger,
  ItemDisposition,
  INVENTORY_LEDGER_SCHEMA_VERSION,
  GearProgressionEvaluator,
  GEAR_PROGRESSION_SCHEMA_VERSION,
  effectiveStats,
  scoreItem
} = require('../src');
const { GameAdapter, ACTIVE_ALLOWED } = require('../src/game/adapter');

function registry(characters) {
  return { characters };
}

function G() {
  return {
    monsters: {}, maps: { main: {} }, npcs: {}, events: {}, skills: {},
    items: {
      currentblade: { type: 'weapon', attack: 25 },
      blade: { type: 'weapon', attack: 10, upgrade: { attack: 5 }, class: ['ranger'] },
      quiver: { type: 'quiver', dex: 2, attack: 1 },
      shield: { type: 'shield', armor: 250, resistance: 100 },
      coat: { type: 'chest', armor: 20, resistance: 5, upgrade: { armor: 3, resistance: 1 } },
      hpot1: { type: 'pot', gives: [['hp', 400]] },
      mpot1: { type: 'pot', gives: [['mp', 500]] },
      citem: { type: 'ring', compound: true, dex: 2 },
      junk: { type: 'material', s: 999, g: 1 },
      unknownsafe: { type: 'material', g: 2 }
    }
  };
}

function ranger(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 70, stateConfidence: 1,
    gear: { mainhand: { name: 'currentblade', level: 0 } },
    inventory: [
      { index: 0, name: 'blade', level: 0, q: 1 },
      { index: 1, name: 'hpot1', level: 0, q: 100 },
      { index: 2, name: 'mpot1', level: 0, q: 100 }
    ],
    ...overrides
  };
}

test('Inventory Ledger is bounded, JSON-safe and has no destructive authority', () => {
  const ledger = new InventoryLedger({ capacity: 64, sellAllowlist: ['junk'] });
  const rows = [ranger({ inventory: [
    { index: 0, name: 'junk', level: 0, q: 1 },
    { index: 1, name: 'unknownsafe', level: 0, q: 1, locked: true },
    { index: 2, name: 'missingmeta', level: 0, q: 1 }
  ] })];
  ledger.observe({ registry: registry(rows), gameData: G(), liveCharacter: { name: 'R1', items: Array(42).fill(null) } });
  const status = ledger.status();
  assert.equal(status.schemaVersion, INVENTORY_LEDGER_SCHEMA_VERSION);
  assert.equal(status.mode, 'observation-planning-only');
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directGameplayActionAccess, false);
  assert.equal(status.destructiveActionsEnabled, false);
  assert.equal(status.sellExecutionEnabled, false);
  assert.equal(ledger.get('R1', 0).disposition, ItemDisposition.SELL);
  assert.equal(ledger.get('R1', 1).disposition, ItemDisposition.KEEP);
  assert.equal(ledger.get('R1', 2).disposition, ItemDisposition.UNDECIDED);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.stringify(ledger.list(100)));
});

test('Inventory Ledger protects group potion reserves and preserves surplus as undecided', () => {
  const ledger = new InventoryLedger({ groupHpPotionReserve: 150, groupMpPotionReserve: 100 });
  const rows = [
    ranger({ name: 'R1', inventory: [{ index: 0, name: 'hpot1', q: 100 }, { index: 1, name: 'mpot1', q: 120 }] }),
    ranger({ name: 'R2', inventory: [{ index: 0, name: 'hpot1', q: 100 }] })
  ];
  ledger.observe({ registry: registry(rows), gameData: G() });
  assert.equal(ledger.get('R1', 0).disposition, ItemDisposition.RESERVE_GROUP);
  assert.equal(ledger.get('R2', 0).disposition, ItemDisposition.RESERVE_GROUP);
  assert.equal(ledger.get('R1', 1).disposition, ItemDisposition.RESERVE_GROUP);
  assert.ok(ledger.status().summary.groupReserve.hpObservedReserved >= 150);
});

test('Inventory Ledger never sell-classifies content requiring revalidation', () => {
  const contentDrift = { requiresRevalidation: (category, id) => category === 'items' && id === 'junk' };
  const ledger = new InventoryLedger({ sellAllowlist: ['junk'] });
  ledger.observe({ registry: registry([ranger({ inventory: [{ index: 0, name: 'junk', q: 1 }] })]), gameData: G(), contentDrift });
  const item = ledger.get('R1', 0);
  assert.equal(item.disposition, ItemDisposition.UNDECIDED);
  assert.ok(item.reasons.includes('CONTENT_REVALIDATION_REQUIRED'));
});

test('Gear scoring is finite and upgrade stats scale deterministically', () => {
  const meta = { type: 'weapon', attack: 10, upgrade: { attack: 5 }, armor: Infinity };
  assert.deepEqual(effectiveStats(meta, 4), { attack: 30 });
  const a = scoreItem(meta, 4, 'ranger');
  const b = scoreItem(meta, 4, 'ranger');
  assert.deepEqual(a, b);
  assert.ok(Number.isFinite(a.total));
});

test('Gear Progression finds the first meaningful upgrade level instead of assuming +0 is better', () => {
  let raw = null;
  const storage = { get: () => raw, set: (_, value) => { raw = value; } };
  const evaluator = new GearProgressionEvaluator({ storage, minImprovementRatio: 0.05, maxProbeLevel: 12 });
  const result = evaluator.evaluate({ registry: registry([ranger()]), gameData: G() });
  const goal = result.goals.find((row) => row.character === 'R1' && row.item === 'blade' && row.slot === 'mainhand');
  assert.ok(goal);
  assert.equal(goal.observedLevel, 0);
  assert.equal(goal.targetLevel, 5);
  assert.equal(goal.projectedUpgradeRequired, true);
  const future = evaluator.futureProtectionFor('R1', 0, 'blade', 0);
  assert.ok(future);
  assert.equal(future.firstMeaningfulLevel, 4);
  assert.equal(future.targetLevel, 5);
  assert.equal(future.upgradeLifecycle, 'FARMER_POTENTIAL_TO_PLUS5');
  assert.equal(goal.feasibility, 'MATERIALS_AND_RISK_UNMODELED');
  assert.equal(goal.actionAuthority, false);
  assert.ok(result.reservations.some((row) => row.name === 'blade' && row.level === 0));
});

test('Gear Progression respects class compatibility and content quarantine', () => {
  const rows = [ranger(), { ...ranger(), name: 'W1', ctype: 'warrior', gear: { mainhand: { name: 'currentblade', level: 0 } } }];
  const contentDrift = { requiresRevalidation: (category, id) => category === 'items' && id === 'blade' };
  const evaluator = new GearProgressionEvaluator();
  const result = evaluator.evaluate({ registry: registry(rows), gameData: G(), contentDrift });
  assert.equal(result.goals.filter((row) => row.item === 'blade').length, 0);
  assert.ok(result.status.lastEvaluation.blockedUnknownContent > 0);
});

test('Gear Progression rejects the live-proven impossible Ranger shield offhand goal', () => {
  const evaluator = new GearProgressionEvaluator({ minImprovementRatio: 0.01 });
  const row = ranger({
    gear: {
      mainhand: { name: 'currentblade', level: 0 },
      offhand: { name: 'quiver', level: 0 }
    },
    inventory: [{ index: 0, name: 'shield', level: 0, q: 1 }]
  });

  const result = evaluator.evaluate({ registry: registry([row]), gameData: G() });

  assert.equal(
    result.goals.some((goal) => goal.character === 'R1' && goal.item === 'shield' && goal.slot === 'offhand'),
    false,
    'a shield must not be proposed to a Ranger just because its weighted armor score beats a quiver'
  );
  const future = evaluator.futureSellSafetyFor('R1', 0, 'shield', 0);
  assert.ok(future);
  assert.equal(future.checked, true, 'incompatibility is a completed future-Farmer value check');
  assert.equal(future.protected, false);
});

test('Gear Progression persistence is schema-versioned and corrupt data fails closed', () => {
  let raw = null;
  const storage = { get: () => raw, set: (_, value) => { raw = value; } };
  const first = new GearProgressionEvaluator({ storage });
  first.evaluate({ registry: registry([ranger()]), gameData: G() });
  first.save({ force: true });
  assert.ok(raw.includes('schemaVersion'));
  const restored = new GearProgressionEvaluator({ storage });
  assert.equal(restored.load(), true);
  assert.equal(restored.status().schemaVersion, GEAR_PROGRESSION_SCHEMA_VERSION);
  assert.ok(restored.status().goals > 0);
  raw = '{broken';
  const corrupt = new GearProgressionEvaluator({ storage });
  assert.equal(corrupt.load(), false);
  assert.equal(corrupt.status().goals, 0);
  assert.equal(corrupt.status().stats.loadErrors, 1);
});

test('GameAdapter catalogs migrated economy commands while unmigrated destructive actions stay rejected', () => {
  assert.equal(ACTIVE_ALLOWED.has('sell'), true);
  for (const action of ['bank', 'compound', 'upgrade', 'exchange', 'trade']) assert.equal(ACTIVE_ALLOWED.has(action), false);
  assert.equal(ACTIVE_ALLOWED.has('send_item'), true);
  const root = { character: { name: 'R1', ctype: 'ranger', items: [] }, parent: { entities: {} }, G: {} };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  for (const action of ['bank', 'compound', 'upgrade']) assert.equal(adapter.command(action).reason, 'ACTION_NOT_ALLOWED_IN_ALPHA');
});

test('Alpha14 runtime integrates Ledger and Gear planning while all new authority remains off', () => {
  let now = 10000;
  const storageData = {};
  const storage = { get: (key) => storageData[key] || null, set: (key, value) => { storageData[key] = value; } };
  const root = {
    character: {
      name: 'R1', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 0, speed: 40, rip: false,
      items: [{ name: 'blade', level: 0 }, { name: 'hpot1', q: 50 }],
      slots: { mainhand: { name: 'currentblade', level: 0 } }
    },
    parent: { entities: {}, party: {} },
    G: G(),
    performance_trick() {}
  };
  const runtime = new Alpha14Runtime({
    root, parent: root.parent, mode: 'shadow', now: () => now, visibleStatus: false, storage,
    inventoryPlanningIntervalMs: 1000, contentDriftScanMs: 1000, globalSupervisorIntervalMs: 500,
    characterRoster: [{ name: 'R1', ctype: 'ranger', level: 70, available: true }]
  });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.14.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.inventory.actionAuthority, false);
  assert.equal(status.inventory.destructiveActionsEnabled, false);
  assert.equal(status.gearProgression.actionAuthority, false);
  assert.equal(status.gearProgression.defaultProgressionMode, 'sustainable');
  assert.equal(status.supervisor.safeActionsEnabled, false);
  assert.equal(status.party.transition.liveEnabled, false);
  assert.equal(status.party.aura.automationEnabled, false);
  assert.equal(status.party.orchestrator.explorationEnabled, false);
  assert.equal(status.brain.mode, 'shadow');
  assert.ok(runtime.gearProgression.list(10).some((goal) => goal.item === 'blade'));
  assert.equal(runtime.inventoryLedger.get('R1', 0).disposition, ItemDisposition.RESERVE_PROGRESSION);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('2000 combined inventory/gear planning cycles stay bounded, finite and serializable', () => {
  let now = 0;
  const ledger = new InventoryLedger({ now: () => now, capacity: 128 });
  const evaluator = new GearProgressionEvaluator({ now: () => now, capacity: 64, maxProbeLevel: 12 });
  const gameData = G();
  for (let i = 0; i < 2000; i += 1) {
    now += 1000;
    const rows = [ranger({ inventory: [
      { index: 0, name: 'blade', level: i % 3, q: 1 },
      { index: 1, name: 'hpot1', q: 50 + (i % 200) },
      { index: 2, name: 'citem', level: i % 4, q: 3 }
    ] })];
    const gear = evaluator.evaluate({ registry: registry(rows), gameData });
    ledger.setProgressionReservations(gear.reservations);
    ledger.observe({ registry: registry(rows), gameData, liveCharacter: { name: 'R1', items: Array(42).fill(null) } });
  }
  assert.ok(ledger.list(1000).length <= 128);
  assert.ok(evaluator.list(1000).length <= 64);
  assert.doesNotThrow(() => JSON.stringify(ledger.status()));
  assert.doesNotThrow(() => JSON.stringify(evaluator.status()));
  for (const goal of evaluator.list(1000)) {
    assert.ok(Number.isFinite(goal.improvement));
    assert.ok(Number.isFinite(goal.targetScore));
  }
});


test('sell safety records a completed no-upgrade answer for ordinary non-equipment items', () => {
  const evaluator = new GearProgressionEvaluator({ now: () => 1000 });
  evaluator.evaluate({
    registry: {
      characters: [
        { name: 'Merchant', ctype: 'merchant', level: 80, inventory: [{ index: 0, name: 'junk', level: 0 }], gear: {} },
        { name: 'Ranger1', ctype: 'ranger', level: 80, inventory: [], gear: {} }
      ]
    },
    gameData: { items: { junk: { type: 'material', g: 5 } } },
    contentDrift: { requiresRevalidation: () => false }
  });

  const safety = evaluator.futureSellSafetyFor('Merchant', 0, 'junk', 0);
  assert.ok(safety);
  assert.equal(safety.checked, true);
  assert.equal(safety.protected, false);
  assert.ok(safety.checkedCharacterCount >= 2);
});

test('future merchant upgrade value is protected before economic disposal', () => {
  const evaluator = new GearProgressionEvaluator({ now: () => 1000, minImprovementRatio: 0.01, maxProbeLevel: 5 });
  evaluator.evaluate({
    registry: {
      characters: [{
        name: 'Merchant',
        ctype: 'merchant',
        level: 80,
        inventory: [{ index: 0, name: 'speedcoat', level: 0 }],
        gear: { chest: { name: 'plaincoat', level: 0 } }
      }]
    },
    gameData: {
      items: {
        speedcoat: { type: 'chest', armor: 1, speed: 0, g: 1000, upgrade: { speed: 1 } },
        plaincoat: { type: 'chest', armor: 10, speed: 0, g: 1000 }
      }
    },
    contentDrift: { requiresRevalidation: () => false }
  });

  const protection = evaluator.futureProtectionFor('Merchant', 0, 'speedcoat', 0);
  const safety = evaluator.futureSellSafetyFor('Merchant', 0, 'speedcoat', 0);
  assert.ok(protection);
  assert.equal(protection.targetCharacter, 'Merchant');
  assert.equal(protection.reason, 'FUTURE_MERCHANT_GEAR_UPGRADE_POTENTIAL');
  assert.equal(safety.checked, true);
  assert.equal(safety.protected, true);
});
