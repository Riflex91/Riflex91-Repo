import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, "..", "pr20-8-updater-recovery-bootstrap-v2.js"),
  "utf8",
);

class MemoryStorage {
  constructor() { this.rows = new Map(); }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
}

async function flush() {
  for (let i = 0; i < 8; i += 1)
    await new Promise(resolve => setImmediate(resolve));
}

function oldStatus(testId, version) {
  return () => ({
    schemaVersion: 1,
    v5AutonomousTest: {
      testId,
      version,
      status: "BESTANDEN",
      phase: "COMPLETE",
      terminal: true,
      gameplayWrites: 1,
      publicFunctionCalls: 1,
      rawWriteCalls: 0,
      sameIntentRetry: false,
      intents: [{ status: "COMMITTED", sendCount: 1 }]
    }
  });
}

test("PR20.8 bootstrap v2 synchronously bridges split local/parent contexts and persists updater 1.0.8 once", async () => {
  assert.ok(source.includes("pr20-8-native-updater-recovery-bootstrap-v2"));
  assert.ok(source.includes("function installObservabilityBridgeOn(owner)"));
  assert.ok(source.includes("function runtimeRoots()"));
  assert.ok(source.includes("const UPDATER_VERSION = '1.0.8'"));
  for (const forbidden of [
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "use_skill(",
    "upgrade(",
    "compound(",
    "exchange(",
    "craft(",
    "buy(",
    "sell(",
    "send_item(",
    "send_gold("
  ]) assert.equal(source.includes(forbidden), false, forbidden);

  const storage = new MemoryStorage();
  const calls = { upload: [], load: [] };

  const parent = {
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
    character: {
      name: "My_Merchant",
      ctype: "merchant",
      hp: 1000,
      max_hp: 1000,
      rip: false,
      dead: false
    },
    get_entities() { return {}; },
    get_active_code_slot() { return { slot: 7, name: "AIO V5" }; },
    async upload_code(...args) { calls.upload.push(args); return true; },
    async load_code(slot) { calls.load.push(slot); return true; },
    AIO_V3: {
      operations: {
        status: oldStatus("parent-old-test", "9.9.9")
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
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    performance_trick() { return true; },
    sounds: { empty: { cplaying: true, playing() { return true; } } },
    character: parent.character,
    get_entities() { return {}; },
    parent,
    AIO_V3: {
      operations: {
        status: oldStatus("pr20-8-upgrade-productive-one-write-live", "1.0.3")
      }
    }
  };

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v2.js",
  });

  // This is the bridge handshake boundary: both roots must expose v2 synchronously.
  assert.equal(
    sandbox.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );
  assert.equal(
    parent.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );
  assert.equal(
    sandbox.V5PR208UpdaterRecoveryBootstrap.status().version,
    "1.0.0",
  );
  assert.equal(
    parent.V5PR208UpdaterRecoveryBootstrap.status().testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );

  await flush();

  const state = sandbox.V5PR208UpdaterRecoveryBootstrap.status();
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.phase, "UPDATER_PERSISTENCE_BOOTSTRAP");
  assert.equal(state.terminal, true);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.publicFunctionCalls, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.intents.length, 0);
  assert.equal(state.updaterVersion, "1.0.8");
  assert.equal(state.codeSlotWrites, 1);
  assert.equal(state.codeSlotReloads, 1);
  assert.equal(state.persisted, true);

  assert.equal(calls.upload.length, 1);
  assert.equal(calls.load.length, 1);
  assert.equal(calls.upload[0][0], 7);
  assert.equal(calls.load[0], 7);
  assert.ok(calls.upload[0][2].includes("installPr208UpdaterRecoveryBootstrapV2"));
  assert.ok(calls.upload[0][2].includes("pr20-8-native-updater-recovery-bootstrap-v2"));

  const marker = JSON.parse(storage.getItem(
    "AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V2_PERSISTED",
  ));
  assert.equal(marker.testId, "pr20-8-native-updater-recovery-bootstrap-v2");
  assert.equal(marker.updaterVersion, "1.0.8");

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v2.second.js",
  });
  await flush();

  assert.equal(calls.upload.length, 1);
  assert.equal(calls.load.length, 1);
  assert.equal(
    sandbox.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );
  assert.equal(
    parent.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );
});

test("PR20.8 bootstrap v2 remains gameplay-no-write and fails closed before slot persistence when unsafe", async () => {
  const storage = new MemoryStorage();
  const calls = { upload: [], load: [] };
  const parent = {
    localStorage: storage,
    character: {
      name: "My_Merchant",
      ctype: "merchant",
      hp: 100,
      max_hp: 1000,
      rip: false,
      dead: false
    },
    get_entities() { return {}; },
    get_active_code_slot() { return { slot: 7, name: "AIO V5" }; },
    async upload_code(...args) { calls.upload.push(args); return true; },
    async load_code(slot) { calls.load.push(slot); return true; },
    AIO_V3: { operations: { status: oldStatus("old", "1.0.0") } }
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
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    performance_trick() { return true; },
    sounds: { empty: { cplaying: true, playing() { return true; } } },
    character: parent.character,
    get_entities() { return {}; },
    parent,
    AIO_V3: { operations: { status: oldStatus("local-old", "1.0.0") } }
  };

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v2.unsafe.js",
  });

  assert.equal(
    sandbox.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );
  assert.equal(
    parent.AIO_V3.operations.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v2",
  );

  await flush();

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
  assert.equal(storage.getItem("AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V2_PERSISTED"), null);
});
