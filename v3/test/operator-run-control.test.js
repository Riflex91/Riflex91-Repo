'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { OperatorRunControl } = require('../src/ops/operator-run-control');
const { DebugMonitorUI } = require('../src/ops/debug-monitor-ui');
const { EventLog } = require('../src/core/event-log');

function cleanEvidence() {
  return { observedClean: true, blockers: [], actionAuthority: false, rawGameplayActionAuthority: false };
}

function blockedEvidence(blocker = 'MERCHANT_SERVICE_OPERATION_RECOVERING') {
  return { observedClean: false, blockers: [blocker], actionAuthority: false, rawGameplayActionAuthority: false };
}

function fakeRuntime(options = {}) {
  let running = options.running !== false;
  let merchantEnabled = options.merchantEnabled === true;
  let starts = 0;
  let stops = 0;
  const runtime = {
    log: options.log || new EventLog(),
    now: options.now || (() => Date.now()),
    status() {
      return {
        version: '3.0.0-alpha.20.0', running, mode: 'active', character: { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', x: 0, y: 0 },
        supervisor: { state: 'HEALTHY', reasons: [] }, economy: { controlled: {}, transactions: {} }, travel: { controlled: {} }, inventory: {}, party: {}, gearProgression: {},
        merchantService: {
          controlled: {
            enabled: merchantEnabled, allowStand: merchantEnabled, allowDelivery: merchantEnabled, busy: false,
            circuit: { open: false }, stats: { rawActions: 0, committed: 0, deliveries: 0, standActions: 0 }
          },
          allowTravel: false, lastExecution: null
        }
      };
    },
    stop() { stops += 1; running = false; merchantEnabled = false; return true; },
    start() { starts += 1; running = true; return true; },
    get starts() { return starts; },
    get stops() { return stops; },
    get merchantEnabled() { return merchantEnabled; }
  };
  return runtime;
}

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
    this.onmousedown = null;
    this.disabled = false;
    this.title = '';
  }
  appendChild(node) { node.parentNode = this; this.children.push(node); this.firstChild = this.children[0] || null; return node; }
  removeChild(node) { this.children = this.children.filter((x) => x !== node); node.parentNode = null; this.firstChild = this.children[0] || null; return node; }
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
        for (const child of node.children || []) { const found = walk(child); if (found) return found; }
        return null;
      };
      return walk(body);
    },
    execCommand() { return false; }
  };
}

test('safe operator stop prevents new runtime ticks first and reaches clean stopped state', async () => {
  const runtime = fakeRuntime({ running: true, merchantEnabled: true });
  const control = new OperatorRunControl({ runtime, getReconciliationStatus: cleanEvidence, sleep: async () => {} });
  const result = await control.stop();
  assert.equal(result.ok, true);
  assert.equal(result.stopped, true);
  assert.equal(result.reason, 'RUNTIME_STOPPED_RECONCILED');
  assert.equal(runtime.stops, 1);
  assert.equal(runtime.merchantEnabled, false);
  assert.equal(control.status().state, 'STOPPED');
});

test('safe operator stop waits boundedly for an already in-flight transaction to settle', async () => {
  const runtime = fakeRuntime({ running: true });
  let observations = 0;
  const control = new OperatorRunControl({
    runtime,
    stopGraceMs: 500,
    pollMs: 25,
    sleep: async () => {},
    getReconciliationStatus: () => (++observations < 4 ? blockedEvidence('MERCHANT_SERVICE_OPERATION_EXECUTING') : cleanEvidence())
  });
  const result = await control.stop();
  assert.equal(result.ok, true);
  assert.equal(result.stopped, true);
  assert.ok(result.polls >= 2);
  assert.equal(control.status().state, 'STOPPED');
});

test('safe operator stop never invents recovery and remains stopped-blocked when reconciliation does not settle', async () => {
  const runtime = fakeRuntime({ running: true });
  const control = new OperatorRunControl({
    runtime,
    stopGraceMs: 250,
    pollMs: 25,
    now: () => 1000,
    sleep: async () => {},
    getReconciliationStatus: () => blockedEvidence('TRAVEL_OPERATION_RECOVERING')
  });
  const result = await control.stop();
  assert.equal(result.ok, false);
  assert.equal(result.stopped, true);
  assert.equal(result.reason, 'RUNTIME_STOPPED_RECONCILIATION_REQUIRED');
  assert.deepEqual(result.blockers, ['TRAVEL_OPERATION_RECOVERING']);
  assert.equal(control.status().state, 'STOPPED_BLOCKED');
  assert.equal(runtime.starts, 0);
});

test('safe operator start fails closed on unresolved evidence and never calls runtime.start', async () => {
  const runtime = fakeRuntime({ running: false });
  const control = new OperatorRunControl({ runtime, getReconciliationStatus: () => blockedEvidence('ECONOMY_TRANSACTION_RECOVERING') });
  const result = await control.start();
  assert.equal(result.ok, false);
  assert.equal(result.started, false);
  assert.equal(result.reason, 'START_BLOCKED_RECONCILIATION_REQUIRED');
  assert.equal(runtime.starts, 0);
  assert.equal(control.status().state, 'STOPPED_BLOCKED');
});

test('clean restart resumes runtime but cannot silently re-enable Merchant Service authority', async () => {
  const runtime = fakeRuntime({ running: true, merchantEnabled: true });
  const control = new OperatorRunControl({ runtime, getReconciliationStatus: cleanEvidence, sleep: async () => {} });
  await control.stop();
  assert.equal(runtime.merchantEnabled, false);
  const result = await control.start();
  assert.equal(result.ok, true);
  assert.equal(result.started, true);
  assert.equal(runtime.starts, 1);
  assert.equal(runtime.merchantEnabled, false);
  assert.equal(control.status().state, 'RUNNING');
});

test('operator run control serializes transitions instead of double-starting while stop is pending', async () => {
  const runtime = fakeRuntime({ running: true });
  let clean = false;
  let releaseSleep;
  const sleep = () => new Promise((resolve) => { releaseSleep = resolve; });
  const control = new OperatorRunControl({ runtime, stopGraceMs: 500, pollMs: 25, sleep, getReconciliationStatus: () => clean ? cleanEvidence() : blockedEvidence() });
  const stopping = control.stop();
  await Promise.resolve();
  assert.equal(control.status().state, 'STOPPING');
  const competing = await control.start();
  assert.equal(competing.ok, false);
  assert.equal(competing.reason, 'CONTROL_TRANSITION_IN_PROGRESS');
  clean = true;
  releaseSleep();
  const stopped = await stopping;
  assert.equal(stopped.ok, true);
  assert.equal(runtime.starts, 0);
});

test('debug monitor exposes a wired safe Start/Stop button plus Merchant Service observability without gameplay authority', async () => {
  const document = fakeDocument();
  const root = { document, character: { stand: false }, setInterval: () => 1, clearInterval() {}, setTimeout: (fn) => { fn(); return 1; } };
  const runtime = fakeRuntime({ running: true, merchantEnabled: true });
  const monitor = {
    runtime,
    now: () => 2000,
    summary: () => ({
      version: '3.0.0-alpha.20.0', running: runtime.status().running, mode: 'active', startedAt: 1000, generatedAt: 2000,
      character: runtime.status().character, supervisor: runtime.status().supervisor,
      economy: { controlled: {}, activeTransactions: 0, recoveringTransactions: 0 }, travel: { controlled: {}, active: 0 }, inventory: {}, recentSignals: { errors: 0, warnings: 0 }
    }),
    async copyToClipboard() { return { copied: true, method: 'test', bytes: 10 }; },
    exportSession() { return '{}'; }
  };
  const runControl = new OperatorRunControl({ runtime, getReconciliationStatus: cleanEvidence, sleep: async () => {} });
  const ui = new DebugMonitorUI({ root, monitor, log: runtime.log, runControl, refreshMs: 500 });
  assert.equal(ui.show().shown, true);
  assert.equal(ui.runButton.textContent, 'Stoppen');
  assert.equal(typeof ui.runButton.onclick, 'function');
  const labels = ui.body.children.map((row) => row.children[0] && row.children[0].textContent);
  assert.ok(labels.includes('Bot'));
  assert.ok(labels.includes('Session'));
  assert.ok(labels.includes('Merchant Service'));
  assert.ok(labels.includes('Service Aktion'));
  const result = await ui._toggleRun();
  assert.equal(result.ok, true);
  assert.equal(runtime.status().running, false);
  assert.equal(ui.runButton.textContent, 'Starten');
  const status = ui.status();
  assert.equal(status.runtimeControlAuthority, true);
  assert.equal(status.safeStartStop, true);
  assert.equal(status.actionAuthority, false);
  assert.equal(status.directGameplayActionAccess, false);
  ui.destroy();
});

test('2500 safe stop/start cycles stay serialized, bounded and never gain gameplay action authority', async () => {
  const runtime = fakeRuntime({ running: true, merchantEnabled: false });
  const control = new OperatorRunControl({ runtime, getReconciliationStatus: cleanEvidence, sleep: async () => {} });
  for (let i = 0; i < 2500; i += 1) {
    const stopped = await control.stop();
    assert.equal(stopped.ok, true);
    const started = await control.start();
    assert.equal(started.ok, true);
  }
  const status = control.status();
  assert.equal(status.state, 'RUNNING');
  assert.equal(status.runtimeControlAuthority, true);
  assert.equal(status.directGameplayActionAccess, false);
  assert.equal(status.rawGameplayActionAuthority, false);
  assert.equal(runtime.starts, 2500);
  assert.equal(runtime.stops, 2500);
  const prototype = Object.getOwnPropertyNames(OperatorRunControl.prototype);
  for (const forbidden of ['attack', 'move', 'smart_move', 'town', 'buy', 'sell', 'send_item', 'use_skill']) assert.equal(prototype.includes(forbidden), false);
});
