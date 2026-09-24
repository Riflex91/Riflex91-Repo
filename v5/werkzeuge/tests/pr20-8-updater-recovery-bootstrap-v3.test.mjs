import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, "..", "pr20-8-updater-recovery-bootstrap-v3.js"),
  "utf8",
);

class MemoryStorage {
  constructor() { this.rows = new Map(); }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
}

function staleOneWriteStatus(testId = "pr20-8-upgrade-productive-one-write-live") {
  return {
    schemaVersion: 1,
    v5AutonomousTest: {
      testId,
      version: "1.0.3",
      status: "BESTANDEN",
      phase: "COMPLETE",
      terminal: true,
      gameplayWrites: 1,
      publicFunctionCalls: 1,
      rawWriteCalls: 0,
      sameIntentRetry: false,
      intents: [{ status: "COMMITTED", sendCount: 1 }]
    }
  };
}

function makeSandbox({ hp = 1000, persisted = false } = {}) {
  const storage = new MemoryStorage();
  const calls = { upload: [], load: [], timers: [] };
  if (persisted) {
    storage.setItem(
      "AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V3_PERSISTED",
      JSON.stringify({
        schemaVersion: 1,
        testId: "pr20-8-native-updater-recovery-bootstrap-v3",
        updaterVersion: "1.0.8",
        atMs: 123456,
        slot: 7
      }),
    );
  }

  const character = {
    name: "My_Merchant",
    ctype: "merchant",
    hp,
    max_hp: 1000,
    rip: false,
    dead: false
  };

  const parent = {
    localStorage: storage,
    character,
    get_entities() { return {}; },
    get_active_code_slot() { return { slot: 7, name: "AIO V5" }; },
    async upload_code(...args) { calls.upload.push(args); return true; },
    async load_code(slot) { calls.load.push(slot); return true; },
    AIO_V3: {
      operations: {
        status() { return staleOneWriteStatus("parent-old-test"); }
      }
    }
  };

  const sandbox = {
    console,
    Date,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    Error,
    TextEncoder,
    Uint8Array,
    ArrayBuffer,
    localStorage: storage,
    setTimeout(fn, ms = 0) {
      calls.timers.push({ fn, ms: Number(ms) || 0 });
      return calls.timers.length;
    },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    performance_trick() { return true; },
    sounds: { empty: { cplaying: true, playing() { return true; } } },
    character,
    get_entities() { return {}; },
    get_active_code_slot() { return { slot: 7, name: "AIO V5" }; },
    async upload_code(...args) { calls.upload.push(args); return true; },
    async load_code(slot) { calls.load.push(slot); return true; },
    AIO_V3: {
      operations: {
        status() { return staleOneWriteStatus(); }
      }
    },
    parent
  };
  sandbox.globalThis = sandbox;
  return { sandbox, parent, storage, calls };
}

async function flushMicrotasks() {
  for (let i = 0; i < 12; i += 1)
    await new Promise(resolve => setImmediate(resolve));
}

async function firePersistenceDelay(calls) {
  const timer = calls.timers.find(row => row.ms === 3000);
  assert.ok(timer, "expected a 3000ms persistence-delay timer");
  timer.fn();
  await flushMicrotasks();
}

test("PR20.8 bootstrap v3 exposes both CDP roots before any slot write", async () => {
  assert.ok(source.includes("pr20-8-native-updater-recovery-bootstrap-v3"));
  assert.ok(source.includes("const UPDATER_VERSION = '1.0.8'"));
  assert.ok(source.includes("const PERSIST_DELAY_MS = 3000"));
  assert.ok(source.includes("function installObservabilityBridgeOn(owner)"));
  assert.ok(source.includes("function runtimeRoots()"));
  assert.ok(source.includes("HANDSHAKE_READY_PERSISTENCE_DELAY"));
  for (const forbidden of [
    "socket.emit(", ".socket.emit(", "api_call(", "use_skill(",
    "upgrade(", "compound(", "exchange(", "craft(", "buy(", "sell(",
    "send_item(", "send_gold("
  ]) assert.equal(source.includes(forbidden), false, forbidden);

  const { sandbox, parent, storage, calls } = makeSandbox();
  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v3.js",
  });

  const local = sandbox.AIO_V3.operations.status().v5AutonomousTest;
  const host = parent.AIO_V3.operations.status().v5AutonomousTest;
  assert.equal(local.testId, "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(host.testId, "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(local.version, "1.0.0");
  assert.equal(host.version, "1.0.0");
  assert.equal(local.phase, "HANDSHAKE_READY_PERSISTENCE_DELAY");
  assert.equal(host.phase, "HANDSHAKE_READY_PERSISTENCE_DELAY");
  assert.equal(local.terminal, false);
  assert.equal(local.gameplayWrites, 0);
  assert.equal(local.publicFunctionCalls, 0);
  assert.equal(local.rawWriteCalls, 0);
  assert.equal(local.persistenceDelayMs, 3000);

  assert.equal(sandbox.V5PR208UpdaterRecoveryBootstrap.testId,
    "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(parent.V5PR208UpdaterRecoveryBootstrap.testId,
    "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(sandbox.V5PR208UpdaterRecoveryBootstrap.version, "1.0.0");
  assert.equal(parent.V5PR208UpdaterRecoveryBootstrap.version, "1.0.0");

  assert.equal(calls.upload.length, 0);
  assert.equal(calls.load.length, 0);
  assert.equal(storage.getItem(
    "AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V3_PERSISTED",
  ), null);

  await firePersistenceDelay(calls);

  const state = sandbox.V5PR208UpdaterRecoveryBootstrap.status();
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.phase, "UPDATER_PERSISTENCE_BOOTSTRAP");
  assert.equal(state.terminal, true);
  assert.equal(state.persisted, true);
  assert.equal(state.updaterVersion, "1.0.8");
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.publicFunctionCalls, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.codeSlotWrites, 1);
  assert.equal(state.codeSlotReloads, 1);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.load.length, 1);
  assert.equal(calls.upload[0][0], 7);
  assert.equal(calls.load[0], 7);
  assert.ok(calls.upload[0][2].includes("installV5AutonomousTestIngameUpdater"));
  assert.ok(calls.upload[0][2].includes("installPr208UpdaterRecoveryBootstrapV3"));
  assert.ok(calls.upload[0][2].includes(
    "pr20-8-native-updater-recovery-bootstrap-v3",
  ));

  const marker = JSON.parse(storage.getItem(
    "AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V3_PERSISTED",
  ));
  assert.equal(marker.testId, "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(marker.updaterVersion, "1.0.8");
  assert.equal(marker.slot, 7);
});

test("PR20.8 bootstrap v3 reload reconciles marker synchronously without another slot write", async () => {
  const { sandbox, parent, calls } = makeSandbox({ persisted: true });
  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v3.reload.js",
  });
  await flushMicrotasks();

  const local = sandbox.AIO_V3.operations.status().v5AutonomousTest;
  const host = parent.AIO_V3.operations.status().v5AutonomousTest;
  assert.equal(local.testId, "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(host.testId, "pr20-8-native-updater-recovery-bootstrap-v3");
  assert.equal(local.status, "BESTANDEN");
  assert.equal(local.phase, "UPDATER_PERSISTENCE_BOOTSTRAP");
  assert.equal(local.terminal, true);
  assert.equal(local.persisted, true);
  assert.equal(local.persistedAtMs, 123456);
  assert.equal(local.activeSlot, 7);
  assert.equal(local.gameplayWrites, 0);
  assert.equal(local.publicFunctionCalls, 0);
  assert.equal(local.rawWriteCalls, 0);
  assert.equal(calls.upload.length, 0);
  assert.equal(calls.load.length, 0);
  assert.equal(calls.timers.some(row => row.ms === 3000), false);
});

test("PR20.8 bootstrap v3 stays fail-closed if safety changes during handshake delay", async () => {
  const { sandbox, parent, storage, calls } = makeSandbox({ hp: 100 });
  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v3.unsafe.js",
  });

  assert.equal(
    sandbox.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v3",
  );
  assert.equal(
    parent.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v3",
  );
  assert.equal(calls.upload.length, 0);
  assert.equal(calls.load.length, 0);

  await firePersistenceDelay(calls);

  const state = sandbox.V5PR208UpdaterRecoveryBootstrap.status();
  assert.equal(state.status, "LAEUFT");
  assert.equal(state.phase, "WAITING_FOR_SAFE_MERCHANT");
  assert.equal(state.terminal, false);
  assert.ok(state.blocker.includes("HP_BELOW_UPDATE_THRESHOLD"));
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.publicFunctionCalls, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(calls.upload.length, 0);
  assert.equal(calls.load.length, 0);
  assert.equal(storage.getItem(
    "AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V3_PERSISTED",
  ), null);
});
