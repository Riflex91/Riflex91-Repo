import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, "..", "pr20-8-updater-recovery-bootstrap-v1.js"),
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

test("PR20.8 updater persistence bootstrap installs updater 1.0.8, persists once and stays gameplay-no-write", async () => {
  assert.ok(source.includes("pr20-8-native-updater-recovery-bootstrap-v1"));
  assert.ok(source.includes("const UPDATER_VERSION = '1.0.8'"));
  assert.ok(source.includes("const VERSION = '1.0.8'"));
  assert.ok(source.includes("function installPr208UpdaterRecoveryBootstrapV1()"));
  assert.ok(source.includes("cleanBundleSource"));
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
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }

  const storage = new MemoryStorage();
  const calls = { upload: [], load: [] };
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
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    performance_trick() { return true; },
    sounds: { empty: { cplaying: true, playing() { return true; } } },
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
        status() {
          return {
            schemaVersion: 1,
            v5AutonomousTest: {
              testId: "pr20-8-upgrade-productive-one-write-live",
              version: "1.0.3",
              status: "BESTANDEN",
              phase: "COMPLETE",
              terminal: true,
              gameplayWrites: 1,
              publicFunctionCalls: 1,
              rawWriteCalls: 0,
              sameIntentRetry: false,
              intents: []
            }
          };
        }
      }
    }
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v1.js",
  });
  await flush();

  assert.equal(sandbox.V5AutonomousTestIngameUpdater.version, "1.0.8");
  let state = sandbox.V5PR208UpdaterRecoveryBootstrap.status();
  assert.equal(state.testId, "pr20-8-native-updater-recovery-bootstrap-v1");
  assert.equal(state.version, "1.0.0");
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.phase, "UPDATER_PERSISTENCE_BOOTSTRAP");
  assert.equal(state.terminal, true);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.publicFunctionCalls, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.intents.length, 0);
  assert.equal(state.updaterVersion, "1.0.8");
  assert.equal(state.normalRuntimeAllowed, false);
  assert.equal(state.codeSlotWrites, 1);
  assert.equal(state.codeSlotReloads, 1);
  assert.equal(state.persisted, true);

  assert.equal(calls.upload.length, 1);
  assert.equal(calls.load.length, 1);
  assert.equal(calls.load[0], 7);
  assert.equal(calls.upload[0][0], 7);
  assert.equal(calls.upload[0][1], "AIO V5");
  assert.ok(calls.upload[0][2].includes("const VERSION = '1.0.8'"));
  assert.ok(calls.upload[0][2].includes("installPr208UpdaterRecoveryBootstrapV1"));
  assert.ok(calls.upload[0][2].includes("pr20-8-native-updater-recovery-bootstrap-v1"));

  const marker = JSON.parse(storage.getItem(
    "AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V1_PERSISTED",
  ));
  assert.equal(marker.testId, "pr20-8-native-updater-recovery-bootstrap-v1");
  assert.equal(marker.updaterVersion, "1.0.8");
  assert.equal(marker.slot, 7);

  const ops = sandbox.AIO_V3.operations;
  assert.equal(typeof ops.status, "function");
  assert.equal(typeof ops.hostHeartbeat, "function");
  assert.equal(typeof ops.reconciliationStatus, "function");
  assert.equal(typeof ops.peekTelemetry, "function");
  assert.equal(
    ops.status().v5AutonomousTest.testId,
    "pr20-8-native-updater-recovery-bootstrap-v1",
  );
  assert.equal(ops.reconciliationStatus().v5Terminal, true);

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v1.second.js",
  });
  await flush();

  state = sandbox.V5PR208UpdaterRecoveryBootstrap.status();
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.persisted, true);
  assert.equal(state.codeSlotWrites, 0);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.load.length, 1);
});

test("PR20.8 updater persistence bootstrap fails closed when code-slot safety changes", async () => {
  const storage = new MemoryStorage();
  const calls = { upload: [], load: [] };
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
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    performance_trick() { return true; },
    sounds: { empty: { cplaying: true, playing() { return true; } } },
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
    AIO_V3: { operations: { status() { return { schemaVersion: 1 }; } } }
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v1.unsafe.js",
  });
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
  assert.equal(storage.getItem("AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V1_PERSISTED"), null);
});
