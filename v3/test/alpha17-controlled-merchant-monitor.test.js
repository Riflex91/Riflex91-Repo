'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha16Runtime, Alpha17Runtime, ControlledMerchantExecutor, ControlledTravelExecutor,
  EconomyTransactionEngine, SafeTravelController, SessionMonitor, DebugMonitorUI, EventLog,
  CONTROLLED_MERCHANT_ACK, CONTROLLED_TRAVEL_ACK
} = require('../src');

function storage() { return { get: () => null, set() {} }; }
function character(overrides = {}) {
  return {
    name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 100, rip: false, items: [], slots: {}, speed: 40,
    ...overrides
  };
}
function gameData() {
  return { monsters: {}, maps: { main: {}, winterland: {}, bank: {} }, npcs: {}, items: { junk: { type: 'material', s: 999 }, bankme: { type: 'material', s: 999 } }, skills: {}, events: {} };
}
function runtimeRoot(overrides = {}) {
  const root = {
    character: character(), parent: { entities: {}, party: {} }, G: gameData(), performance_trick() {},
    setTimeout, clearTimeout, setInterval, clearInterval, ...overrides
  };
  root.globalThis = root;
  return root;
}
function ledger(entry) {
  return {
    status() { return { stale: false, actionAuthority: false }; },
    get(name, index) { return name === entry.character && index === entry.index ? { ...entry, actionAuthority: false } : null; }
  };
}
function planTx(engine, fakeLedger, type, item, q = 1) {
  return engine.plan({ type, character: 'MerchantA', index: 0, quantity: q }, { ledger: fakeLedger, snapshot: {} });
}

class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null; this.style = {}; this.attributes = {};
    this.textContent = ''; this.value = ''; this.firstChild = null; this.onclick = null; this.disabled = false;
  }
  appendChild(node) { node.parentNode = this; this.children.push(node); this.firstChild = this.children[0] || null; return node; }
  removeChild(node) { this.children = this.children.filter((x) => x !== node); node.parentNode = null; this.firstChild = this.children[0] || null; return node; }
  setAttribute(key, value) { this.attributes[key] = value; }
  focus() {}
  select() { this.selected = true; }
  setSelectionRange() { this.selected = true; }
}
function fakeDocument() {
  const body = new FakeNode('body');
  return {
    body, documentElement: body,
    createElement(tag) { return new FakeNode(tag); },
    getElementById(id) {
      const walk = (node) => {
        if (node.id === id) return node;
        for (const child of node.children || []) { const found = walk(child); if (found) return found; }
        return null;
      };
      return walk(body);
    },
    execCommand() { return false; }
  };
}

test('Alpha16 runtime version is frozen after Alpha17 release bump', () => {
  const root = runtimeRoot();
  const runtime = new Alpha16Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  assert.equal(runtime.status().version, '3.0.0-alpha.16.0');
});

test('Alpha17 defaults all controlled live authority off and preserves shadow mode', () => {
  const root = runtimeRoot();
  const runtime = new Alpha17Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.17.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.economy.liveEnabled, false);
  assert.equal(status.economy.actionAuthority, false);
  assert.equal(status.travel.liveExecutionEnabled, false);
  assert.equal(status.travel.actionAuthority, false);
  assert.equal(status.controlledCanary.defaultEnabled, false);
  assert.equal(status.brain.actionAuthority, false);
  assert.equal(status.party.transition.liveEnabled, false);
});

test('Alpha17 inventory action policy changes classification only and does not enable live execution', () => {
  const root = runtimeRoot({ character: character({ items: [{ name: 'junk', q: 2 }] }) });
  const runtime = new Alpha17Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  runtime.tick();
  const policy = runtime.configureInventoryActionPolicy({ sell: ['junk', 'junk'], bank: ['bankme'] });
  assert.deepEqual(policy.sellAllowlist, ['junk']);
  assert.deepEqual(policy.bankAllowlist, ['bankme']);
  assert.equal(runtime.status().economy.liveEnabled, false);
});

test('Controlled Merchant requires exact canary acknowledgement and active Merchant context', () => {
  const engine = new EconomyTransactionEngine();
  const fakeLedger = ledger({ character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 1, disposition: 'SELL' });
  const root = runtimeRoot({ character: character({ items: [{ name: 'junk', q: 1 }] }), sell: async () => ({ success: true }) });
  let mode = 'shadow';
  const executor = new ControlledMerchantExecutor({ root, engine, ledger: fakeLedger, getMode: () => mode, getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  assert.equal(executor.configure({ enabled: true, sell: true }).enabled, false);
  assert.equal(executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK }).enabled, true);
  const planned = planTx(engine, fakeLedger, 'SELL', 'junk');
  return executor.execute(planned.transaction.id).then((result) => {
    assert.equal(result.executed, false);
    assert.equal(result.reason, 'RUNTIME_NOT_ACTIVE');
    mode = 'active';
  });
});

test('Controlled SELL commits only after exact inventory delta verification', async () => {
  const engine = new EconomyTransactionEngine();
  const fakeLedger = ledger({ character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 2, disposition: 'SELL' });
  const root = runtimeRoot({
    character: character({ items: [{ name: 'junk', q: 2 }], gold: 100 }),
    sell: async (index, quantity) => { root.character.items[index].q -= quantity; root.character.gold += 12; return { success: true }; }
  });
  const executor = new ControlledMerchantExecutor({ root, engine, ledger: fakeLedger, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), verifyDelayMs: 0 });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = planTx(engine, fakeLedger, 'SELL', 'junk', 1);
  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(engine.get(planned.transaction.id).state, 'COMMITTED');
  assert.equal(root.character.items[0].q, 1);
  assert.equal(root.character.gold, 112);
});

test('Controlled BANK requires bank context and verifies full-stack transfer into bank balance', async () => {
  const engine = new EconomyTransactionEngine();
  const fakeLedger = ledger({ character: 'MerchantA', index: 0, name: 'bankme', level: 0, q: 1, disposition: 'BANK' });
  const bank = { items0: Array(42).fill(null) };
  const root = runtimeRoot({
    character: character({ items: [{ name: 'bankme', q: 1 }], bank }),
    bank_store: async (index) => {
      root.character.items[index] = null;
      root.character.bank.items0[0] = { name: 'bankme', q: 1 };
      return { success: true };
    }
  });
  const executor = new ControlledMerchantExecutor({ root, engine, ledger: fakeLedger, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), verifyDelayMs: 0 });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = planTx(engine, fakeLedger, 'BANK', 'bankme');
  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(engine.get(planned.transaction.id).state, 'COMMITTED');
  assert.equal(root.character.items[0], null);
  assert.equal(root.character.bank.items0[0].name, 'bankme');
});

test('Controlled Merchant failures fail safe and trip the existing action-family circuit budget', async () => {
  const engine = new EconomyTransactionEngine({ failureThreshold: 1, circuitCooldownMs: 5000 });
  const fakeLedger = ledger({ character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 1, disposition: 'SELL' });
  const root = runtimeRoot({ character: character({ items: [{ name: 'junk', q: 1 }] }), sell: async () => { throw new Error('server_refused'); } });
  const executor = new ControlledMerchantExecutor({ root, engine, ledger: fakeLedger, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), verifyDelayMs: 0 });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = planTx(engine, fakeLedger, 'SELL', 'junk');
  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.committed, false);
  assert.equal(engine.get(planned.transaction.id).state, 'FAILED_SAFE');
  assert.equal(engine.breaker('SELL').open, true);
});

test('Controlled Travel requires canary acknowledgement and verifies observed arrival', async () => {
  let now = 1000;
  const controller = new SafeTravelController({ now: () => now });
  const root = runtimeRoot();
  root.smart_move = async (destination) => {
    root.character.map = typeof destination === 'string' ? destination : destination.map;
    if (destination && typeof destination === 'object') { root.character.x = destination.x; root.character.y = destination.y; }
    return { success: true };
  };
  root.stop = async () => ({ success: true });
  const planned = controller.plan({ destination: { map: 'winterland', x: 40, y: 50 } }, { gameData: gameData(), snapshot: { character: root.character } });
  const executor = new ControlledTravelExecutor({ root, controller, now: () => now, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  assert.equal(executor.configure({ enabled: true }).enabled, false);
  executor.configure({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });
  now += 100;
  const result = await executor.execute(planned.plan.id);
  assert.equal(result.completed, true);
  assert.equal(controller.get(planned.plan.id).state, 'COMPLETED');
  assert.equal(controller.stats.syntheticStarts, 0);
  assert.equal(controller.stats.controlledStarts, 1);
});

test('Controlled Travel does not treat immediate smart_move return as arrival', async () => {
  let now = 2000;
  const controller = new SafeTravelController({ now: () => now, arrivalRadius: 20 });
  const root = runtimeRoot();
  root.smart_move = () => {
    setTimeout(() => {
      now += 100;
      root.character.map = 'winterland';
      root.character.x = 40;
      root.character.y = 50;
      root.character.real_x = 40;
      root.character.real_y = 50;
    }, 20);
    return undefined;
  };
  root.stop = async () => ({ success: true });
  const planned = controller.plan(
    { destination: { map: 'winterland', x: 40, y: 50 } },
    { gameData: gameData(), snapshot: { character: root.character } }
  );
  const executor = new ControlledTravelExecutor({
    root, controller, now: () => now, getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }), timeoutMs: 5000
  });
  executor.configure({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });

  const result = await executor.execute(planned.plan.id);

  assert.equal(result.completed, true);
  assert.equal(controller.get(planned.plan.id).state, 'COMPLETED');
  assert.equal(controller.breaker().open, false);
  assert.equal(executor.status().stats.failedSafe, 0);
});

test('Buffered arrival ignores smart_move interruption caused by the intentional stop', async () => {
  let rejectRoute = null;
  let stopCalls = 0;
  const controller = new SafeTravelController({ arrivalRadius: 20 });
  const root = runtimeRoot({
    smart_move: () => new Promise((_, reject) => { rejectRoute = reject; }),
    stop: async () => {
      stopCalls += 1;
      if (rejectRoute) rejectRoute(new Error('interrupted'));
      return { success: true };
    }
  });
  const planned = controller.plan(
    {
      destination: { map: 'main', x: 100, y: 0 },
      arrivalRadius: 108,
      metadata: {
        stopWhenInteractionReady: true,
        interactionKind: 'npc',
        interactionMaxRange: 120,
        interactionSafetyFactor: 0.9
      }
    },
    { gameData: gameData(), snapshot: { character: root.character } }
  );
  const executor = new ControlledTravelExecutor({
    root, controller, getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }), timeoutMs: 5000
  });
  executor.configure({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });

  const result = await executor.execute(planned.plan.id);

  assert.equal(result.completed, true);
  assert.equal(result.reason, 'ARRIVAL_VERIFIED');
  assert.equal(controller.get(planned.plan.id).state, 'COMPLETED');
  assert.equal(executor.status().stats.failedSafe, 0);
  assert.equal(executor.status().stats.bufferedEarlyStops, 1);
  assert.equal(stopCalls, 1);
});

test('Controlled Travel stops active smart movement when observed travel fails safe', async () => {
  let now = 3000;
  let stopCalls = 0;
  const controller = new SafeTravelController({
    now: () => now,
    noProgressMs: 2000,
    failureThreshold: 3
  });
  const root = runtimeRoot({
    smart_move: () => {
      setTimeout(() => { now += 3000; }, 20);
      return undefined;
    },
    stop: async () => { stopCalls += 1; return { success: true }; }
  });
  const planned = controller.plan(
    { destination: { map: 'main', x: 500, y: 0 } },
    { gameData: gameData(), snapshot: { character: root.character } }
  );
  const executor = new ControlledTravelExecutor({
    root, controller, now: () => now, getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }), timeoutMs: 5000
  });
  executor.configure({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });

  const result = await executor.execute(planned.plan.id);

  assert.equal(result.completed, false);
  assert.equal(controller.get(planned.plan.id).state, 'FAILED_SAFE');
  assert.ok(stopCalls >= 1);
  assert.equal(executor.status().busy, false);
});

test('Controlled Travel preserves ABORTED result without adding a failed-safe count', async () => {
  let stopCalls = 0;
  const controller = new SafeTravelController();
  const root = runtimeRoot({
    smart_move: () => undefined,
    stop: async () => { stopCalls += 1; return { success: true }; }
  });
  const planned = controller.plan(
    { destination: { map: 'winterland', x: 40, y: 50 } },
    { gameData: gameData(), snapshot: { character: root.character } }
  );
  const executor = new ControlledTravelExecutor({
    root, controller, getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }), timeoutMs: 5000
  });
  executor.configure({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });

  const executing = executor.execute(planned.plan.id);
  await new Promise((resolve) => setTimeout(resolve, 20));
  const aborted = await executor.abort('TEST_ABORT');
  const result = await executing;

  assert.equal(aborted.aborted, true);
  assert.equal(result.aborted, true);
  assert.equal(result.reason, 'TEST_ABORT');
  assert.equal(controller.get(planned.plan.id).state, 'ABORTED');
  assert.equal(executor.status().stats.aborts, 1);
  assert.equal(executor.status().stats.failedSafe, 0);
  assert.ok(stopCalls >= 1);
});

test('Controlled Travel failures become FAILED_SAFE and feed the travel circuit breaker', async () => {
  const controller = new SafeTravelController({ failureThreshold: 1, circuitCooldownMs: 5000 });
  const root = runtimeRoot({ smart_move: async () => { throw new Error('route_failed'); }, stop: async () => ({ success: true }) });
  const planned = controller.plan({ destination: 'winterland' }, { gameData: gameData(), snapshot: { character: root.character } });
  const executor = new ControlledTravelExecutor({ root, controller, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  executor.configure({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });
  const result = await executor.execute(planned.plan.id);
  assert.equal(result.completed, false);
  assert.equal(controller.get(planned.plan.id).state, 'FAILED_SAFE');
  assert.equal(controller.breaker().open, true);
});

test('Alpha17 runtime refuses generic live enables and auto-disables controlled authority outside active mode', () => {
  const root = runtimeRoot();
  const runtime = new Alpha17Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  assert.equal(runtime.setEconomyLiveEnabled(true), false);
  assert.equal(runtime.setTravelLiveEnabled(true), false);
  runtime.setMode('active');
  assert.equal(runtime.configureControlledMerchant({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK }).enabled, true);
  assert.equal(runtime.configureControlledTravel({ enabled: true, ack: CONTROLLED_TRAVEL_ACK }).enabled, true);
  runtime.setMode('shadow');
  assert.equal(runtime.controlledMerchant.status().enabled, false);
  assert.equal(runtime.controlledTravel.status().enabled, false);
});

test('Session Monitor exports the complete retained redacted log and copies it with Clipboard API', async () => {
  const log = new EventLog({ capacity: 120, version: '3.0.0-alpha.17.0', now: (() => { let n = 0; return () => ++n; })() });
  for (let i = 0; i < 150; i += 1) log.emit({ component: 'test', event: 'ROW', data: { i, token: `secret-${i}` } });
  let copied = null;
  const root = { navigator: { clipboard: { async writeText(text) { copied = text; } } } };
  const runtime = { log, status: () => ({ version: '3.0.0-alpha.17.0', running: true, mode: 'shadow', character: character(), inventory: {}, economy: {}, travel: {}, supervisor: {}, party: {}, gearProgression: {} }) };
  const monitor = new SessionMonitor({ root, runtime, log, now: () => 999 });
  const bundle = JSON.parse(monitor.exportSession());
  assert.equal(bundle.eventLog.retained, 120);
  assert.equal(bundle.eventLog.completeRetainedLog, true);
  assert.equal(bundle.eventLog.events[0].data.token, '[redacted]');
  const result = await monitor.copyToClipboard();
  assert.equal(result.copied, true);
  assert.equal(result.method, 'navigator.clipboard');
  assert.equal(JSON.parse(copied).eventLog.events.length, 120);
});

test('Debug monitor GUI exposes a wired Log kopieren button while remaining read-only', () => {
  const document = fakeDocument();
  const root = { document, setInterval: () => 1, clearInterval() {}, setTimeout: (fn) => { fn(); return 1; } };
  const monitor = {
    summary: () => ({ version: '3.0.0-alpha.17.0', mode: 'shadow', character: {}, supervisor: {}, economy: {}, travel: {}, inventory: {}, recentSignals: {} }),
    async copyToClipboard() { return { copied: true, method: 'test', bytes: 42 }; },
    exportSession() { return '{}'; }
  };
  const ui = new DebugMonitorUI({ root, monitor, log: new EventLog(), refreshMs: 500 });
  assert.equal(ui.show().shown, true);
  assert.equal(ui.copyButton.textContent, 'Log kopieren');
  assert.equal(typeof ui.copyButton.onclick, 'function');
  assert.equal(ui.status().actionAuthority, false);
  assert.equal(ui.status().directGameplayActionAccess, false);
  ui.destroy();
});

test('2000 controlled status/diagnostic evaluations remain bounded and JSON-safe', () => {
  const root = runtimeRoot();
  const runtime = new Alpha17Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: storage() });
  for (let i = 0; i < 2000; i += 1) {
    runtime.transactionEngine.tick();
    runtime.safeTravel.tick(runtime.lastSnapshot || { character: root.character });
    runtime._guardControlledAuthority();
  }
  assert.equal(runtime.controlledMerchant.status().enabled, false);
  assert.equal(runtime.controlledTravel.status().enabled, false);
  assert.doesNotThrow(() => JSON.stringify(runtime.status()));
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});