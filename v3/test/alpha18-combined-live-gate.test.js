'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha18Runtime } = require('../src');

function storage() {
  const data = new Map();
  return {
    get: (key) => data.get(key),
    set: (key, value) => { data.set(key, value); return true; }
  };
}

function gameData() {
  return {
    monsters: {}, maps: { main: {}, bank: {} }, npcs: {}, skills: {}, events: {},
    items: {
      scrap: { type: 'material', s: 9999, g: 1 },
      weapon: { type: 'weapon', upgrade: true, wtype: 'sword', g: 1000 }
    }
  };
}

function character(overrides = {}) {
  return {
    name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 1000, rip: false,
    items: [], isize: 42, slots: {}, speed: 40, bank: { items0: [null] },
    ...overrides
  };
}

function root(overrides = {}) {
  const value = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData(),
    bank_packs: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] },
    open_bank_pack: async () => ({ success: true }),
    performance_trick() {}, game_log() {}, console: { log() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    ...overrides
  };
  value.globalThis = value;
  return value;
}

function runtimeOptions(r, extra = {}) {
  return {
    root: r,
    parent: r.parent,
    mode: 'shadow',
    visibleStatus: false,
    storage: storage(),
    bankProtectedGoldReserve: 100,
    alpha18LiveGateTestMode: true,
    alpha18LiveGateObservationMs: 0,
    alpha18LiveGateSampleMs: 1,
    ...extra
  };
}

test('Alpha.18 combined live gate requires its own explicit acknowledgement', async () => {
  const r = root();
  const runtime = new Alpha18Runtime(runtimeOptions(r));
  const result = await runtime.runAlpha18CombinedLiveGate({ allowExpansionPurchase: true });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'ALPHA18_LIVE_GATE_ACK_REQUIRED');
  assert.equal(runtime.alpha18LiveGateStatus().running, false);
});

test('combined live gate stays non-destructive when real capacity does not justify expansion', async () => {
  let openCalls = 0;
  const r = root({ open_bank_pack: async () => { openCalls += 1; } });
  const runtime = new Alpha18Runtime(runtimeOptions(r));
  const result = await runtime.runAlpha18CombinedLiveGate({ ack: 'ALPHA18_FULL_LIVE_GATE', allowExpansionPurchase: true });

  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, false);
  assert.equal(result.planProbe.plan.action, 'DEPOSIT_FREE_SLOT');
  assert.equal(result.expansionCanary.state, 'NOT_JUSTIFIED');
  assert.equal(openCalls, 0);
  assert.equal(result.finalSafeState.mode, 'shadow');
  assert.equal(result.finalSafeState.farmerEnabled, false);
  assert.equal(result.finalSafeState.controlled.expansionEnabled, false);
  assert.match(runtime.alpha18LiveGateResultText(), /ALPHA18 FULL LIVE GATE RESULT BEGIN/);
});

test('combined live gate executes exactly one justified controlled bank expansion and returns to default-off', async () => {
  let openCalls = 0;
  const r = root({
    character: character({ gold: 1000, bank: { items0: [{ name: 'weapon' }] } })
  });
  r.open_bank_pack = async (pack, currency) => {
    openCalls += 1;
    assert.equal(pack, 'items2');
    assert.equal(currency, 'gold');
    r.character.gold -= 500;
    r.character.bank.items2 = new Array(42).fill(null);
    return { pack, request_id: 'live-gate-test' };
  };

  const runtime = new Alpha18Runtime(runtimeOptions(r));
  const result = await runtime.runAlpha18CombinedLiveGate({ ack: 'ALPHA18_FULL_LIVE_GATE', allowExpansionPurchase: true });

  assert.equal(result.pass, true);
  assert.equal(result.planProbe.plan.action, 'EXPAND_BANK_PACK');
  assert.equal(result.expansionCanary.state, 'COMMITTED');
  assert.equal(result.expansionCanary.execution.committed, true);
  assert.equal(openCalls, 1);
  assert.equal(r.character.gold, 500);
  assert.ok(Array.isArray(r.character.bank.items2));
  assert.equal(result.finalSafeState.mode, 'shadow');
  assert.equal(runtime.controlledBankExpansion.status().enabled, false);
  assert.equal(runtime.bankExpansionTransactions.status().breaker.open, false);
});

test('passive observation fails on a real error event and never hides it from the gate result', async () => {
  let now = 1000;
  let runtime;
  const r = root();
  const sleep = async (ms) => {
    now += ms;
    runtime.log.emit({ component: 'test-probe', event: 'SYNTHETIC_LIVE_ERROR', severity: 'error', reason: 'EXPECTED_TEST_ERROR' });
  };
  runtime = new Alpha18Runtime(runtimeOptions(r, {
    now: () => now,
    alpha18LiveGateObservationMs: 10,
    alpha18LiveGateSampleMs: 5,
    alpha18LiveGateSleep: sleep
  }));

  const result = await runtime.runAlpha18CombinedLiveGate({ ack: 'ALPHA18_FULL_LIVE_GATE', allowExpansionPurchase: false });
  assert.equal(result.pass, false);
  assert.equal(result.passiveObservation.pass, false);
  assert.ok(result.passiveObservation.errorEvents.some((row) => row.event === 'SYNTHETIC_LIVE_ERROR'));
  assert.ok(result.passiveObservation.violations.some((row) => row.reason === 'ERROR_EVENT_DURING_PASSIVE_WINDOW'));
  assert.equal(result.finalSafeState.mode, 'shadow');
});
