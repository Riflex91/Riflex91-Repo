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

test("PR20.8 updater persistence bootstrap installs updater 1.0.8 and stays terminal no-write", async () => {
  assert.ok(source.includes("pr20-8-native-updater-recovery-bootstrap-v1"));
  assert.ok(source.includes("updaterVersion: '1.0.8'"));
  assert.ok(source.includes("const VERSION = '1.0.8'"));
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
    character: {
      name: "My_Merchant",
      ctype: "merchant",
      hp: 1000,
      max_hp: 1000,
      rip: false,
      dead: false
    },
    get_entities() { return {}; },
    AIO_V3: {
      operations: {
        status() {
          return { schemaVersion: 1 };
        }
      }
    }
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-updater-recovery-bootstrap-v1.js",
  });
  await Promise.resolve();

  assert.equal(sandbox.V5AutonomousTestIngameUpdater.version, "1.0.8");
  const state = sandbox.V5PR208UpdaterRecoveryBootstrap.status();
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
});
