'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha19Runtime } = require('../src/autonomy/alpha19-runtime');

function storage() {
  const data = new Map();
  return {
    get: (key) => data.get(key),
    set: (key, value) => { data.set(key, value); return true; }
  };
}

function gameData() {
  return {
    monsters: {}, maps: { bank: {} }, npcs: {}, skills: {}, events: {},
    items: {
      scrap: { type: 'material', s: 9999, g: 1 },
      weapon: { type: 'weapon', upgrade: true, wtype: 'sword', g: 1000 }
    }
  };
}

function character(overrides = {}) {
  return {
    name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 1000000, rip: false,
    items: [{ name: 'scrap', q: 2 }], isize: 4, slots: {}, speed: 40,
    bank: { items0: [null, null] },
    ...overrides
  };
}

function root(overrides = {}) {
  const value = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData(),
    bank_packs: { items0: ['bank', 0, 0], items1: ['bank', 500000, 50] },
    performance_trick() {},
    open_bank_pack: async () => ({ success: true }),
    bank_retrieve: async () => ({ success: true, place: 'bank', bank_action: 'retrieve' }),
    sell: async () => ({ success: true }),
    game_log() {},
    console: { log() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    ...overrides
  };
  value.globalThis = value;
  return value;
}

function options(r, extra = {}) {
  return {
    root: r,
    parent: r.parent,
    mode: 'shadow',
    visibleStatus: false,
    storage: storage(),
    inventoryBankAllowlist: ['scrap'],
    controlledMerchantVerifyDelayMs: 0,
    controlledMerchantVerifyAttempts: 1,
    controlledBankConsolidationVerifyDelayMs: 0,
    alpha19LiveGateTestMode: true,
    alpha19LiveGateObservationMs: 0,
    alpha19LiveGateSampleMs: 1,
    ...extra
  };
}

function installBankStore(r, calls) {
  r.bank_store = async (index, packName, targetIndex) => {
    calls.push({ index, packName, targetIndex });
    const item = r.character.items[index];
    assert.ok(item);
    const pack = packName || 'items0';
    const slots = r.character.bank[pack];
    assert.ok(Array.isArray(slots));
    let slot = Number.isInteger(targetIndex) ? targetIndex : slots.findIndex((row) => !row);
    if (slot < 0) throw new Error('NO_BANK_SLOT');
    slots[slot] = { ...item };
    r.character.items[index] = null;
    return { success: true, place: 'bank', bank_action: 'store' };
  };
}

test('Alpha.19 combined live gate requires its own explicit acknowledgement', async () => {
  const r = root();
  installBankStore(r, []);
  const runtime = new Alpha19Runtime(options(r));
  const result = await runtime.runAlpha19CombinedLiveGate({ allowControlledRecovery: true });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'ALPHA19_LIVE_GATE_ACK_REQUIRED');
  assert.equal(runtime.alpha19LiveGateStatus().running, false);
});

test('Alpha.19 live gate never fabricates a source when no fresh BANK-classified stack exists', async () => {
  let bankCalls = 0;
  const r = root({ character: character({ items: [], bank: { items0: [null, null] } }) });
  r.bank_store = async () => { bankCalls += 1; };
  const runtime = new Alpha19Runtime(options(r, { inventoryBankAllowlist: [] }));
  const result = await runtime.runAlpha19CombinedLiveGate({
    ack: 'ALPHA19_FULL_LIVE_GATE',
    allowControlledRecovery: true,
    allowExpansionPurchase: true,
    allowEmergencyReclaim: true
  });

  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, false);
  assert.equal(result.sourceProbe.state, 'NOT_JUSTIFIED');
  assert.equal(result.recoveryCanary.state, 'NOT_JUSTIFIED');
  assert.ok(result.confirmationBlockers.includes('NO_FRESH_LEDGER_BANK_SOURCE'));
  assert.equal(bankCalls, 0);
  assert.equal(result.finalSafeState.mode, 'shadow');
  assert.equal(result.finalSafeState.controlled.spaceRecoveryEnabled, false);
  assert.equal(result.finalSafeState.controlled.emergencyReclaimAuthority, false);
});

test('Alpha.19 live gate executes exactly one real ledger-bound BANK recovery and returns default-off', async () => {
  const calls = [];
  const r = root();
  installBankStore(r, calls);
  const runtime = new Alpha19Runtime(options(r));
  const result = await runtime.runAlpha19CombinedLiveGate({
    ack: 'ALPHA19_FULL_LIVE_GATE',
    allowControlledRecovery: true,
    allowExpansionPurchase: false,
    allowEmergencyReclaim: false
  });

  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, false);
  assert.equal(result.sourceProbe.state, 'SOURCE_FOUND');
  assert.ok(['DEPOSIT_STACK', 'DEPOSIT_FREE_SLOT'].includes(result.planProbe.plan.action));
  assert.equal(result.recoveryCanary.state, 'COMMITTED');
  assert.equal(result.recoveryCanary.coverageSatisfied, true);
  assert.equal(result.recoveryCanary.rawActions, 1);
  assert.equal(result.recoveryCanary.emergencyReclaimCount, 0);
  assert.equal(calls.length, 1);
  assert.equal(r.character.items[0], null);
  assert.equal(r.character.bank.items0[0].name, 'scrap');
  assert.equal(result.finalSafeState.mode, 'shadow');
  assert.equal(result.finalSafeState.farmerEnabled, false);
  assert.equal(result.finalSafeState.controlled.spaceRecoveryEnabled, false);
  assert.equal(result.finalSafeState.controlled.expansionPurchaseAuthority, false);
  assert.equal(result.finalSafeState.controlled.emergencyReclaimAuthority, false);
  assert.equal(result.finalSafeState.controlled.merchantEnabled, false);
  assert.equal(result.finalSafeState.controlled.travelEnabled, false);
  assert.match(runtime.alpha19LiveGateResultText(), /ALPHA19 FULL LIVE GATE RESULT BEGIN/);
});

test('a justified safe recovery that operator did not authorize performs zero raw actions and blocks confirmation coverage', async () => {
  const calls = [];
  const r = root();
  installBankStore(r, calls);
  const runtime = new Alpha19Runtime(options(r));
  const result = await runtime.runAlpha19CombinedLiveGate({
    ack: 'ALPHA19_FULL_LIVE_GATE',
    allowControlledRecovery: false,
    allowExpansionPurchase: false,
    allowEmergencyReclaim: false
  });

  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, false);
  assert.equal(result.sourceProbe.state, 'SOURCE_FOUND');
  assert.equal(result.recoveryCanary.state, 'NOT_EXECUTED');
  assert.equal(result.recoveryCanary.reason, 'OPERATOR_DID_NOT_ALLOW_CONTROLLED_RECOVERY');
  assert.equal(result.recoveryCanary.rawActions, 0);
  assert.equal(calls.length, 0);
  assert.ok(result.confirmationBlockers.includes('OPERATOR_DID_NOT_ALLOW_CONTROLLED_RECOVERY'));
  const op = runtime.merchantSpaceRecoveryJournal.get(result.planProbe.operation.id);
  assert.equal(op.state, 'ABORTED');
});

test('wrong parent acknowledgement cannot enable expansion or reclaim budgets', async () => {
  const r = root();
  installBankStore(r, []);
  const runtime = new Alpha19Runtime(options(r));
  const result = await runtime.runAlpha19CombinedLiveGate({
    ack: 'ALPHA19_FULL_LIVE_GATE',
    allowControlledRecovery: false
  });
  assert.equal(result.wrongAckProbe.pass, true);
  assert.equal(result.wrongAckProbe.status.enabled, false);
  assert.equal(result.wrongAckProbe.status.expansionPurchaseAuthority, false);
  assert.equal(result.wrongAckProbe.status.emergencyReclaimAuthority, false);
});

test('Alpha.19 passive observation fails closed on ISO timestamped error event', async () => {
  let now = 1000;
  let runtime;
  const r = root();
  installBankStore(r, []);
  const sleep = async (ms) => {
    now += ms;
    runtime.log.emit({ component: 'test-probe', event: 'SYNTHETIC_ALPHA19_LIVE_ERROR', severity: 'error', reason: 'EXPECTED_TEST_ERROR', ts: new Date(now).toISOString() });
  };
  runtime = new Alpha19Runtime(options(r, {
    now: () => now,
    alpha19LiveGateObservationMs: 10,
    alpha19LiveGateSampleMs: 5,
    alpha19LiveGateSleep: sleep
  }));

  const result = await runtime.runAlpha19CombinedLiveGate({
    ack: 'ALPHA19_FULL_LIVE_GATE',
    allowControlledRecovery: false
  });
  assert.equal(result.pass, false);
  assert.equal(result.passiveObservation.pass, false);
  assert.ok(result.passiveObservation.errorEvents.some((row) => row.event === 'SYNTHETIC_ALPHA19_LIVE_ERROR'));
  assert.ok(result.passiveObservation.violations.some((row) => row.reason === 'ERROR_EVENT_DURING_PASSIVE_WINDOW'));
  assert.equal(result.finalSafeState.mode, 'shadow');
});
