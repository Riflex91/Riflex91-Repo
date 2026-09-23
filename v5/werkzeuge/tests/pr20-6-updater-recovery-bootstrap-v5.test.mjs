import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "pr20-6-updater-recovery-bootstrap-v5.js"), "utf8");

test("PR20.6 updater recovery bootstrap v5 restores the minimal observational bridge contract", async () => {
  assert.ok(source.includes("pr20-6-native-updater-recovery-bootstrap-v5"));
  assert.ok(source.includes("updaterVersion: '1.0.6'"));
  assert.ok(source.includes("performance_trick"));
  for (const forbidden of ["socket.emit(", ".socket.emit(", "api_call(", "use_skill(", "start_character(", "/disconnect "]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }

  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    performance_trick() { return true; },
    sounds: { empty: { cplaying: true, playing() { return true; } } },
    character: { name: "My_Merchant", ctype: "merchant", hp: 1000, max_hp: 1000, rip: false, dead: false }
  };
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, { filename: "pr20-6-updater-recovery-bootstrap-v5.js" });
  await Promise.resolve();

  assert.equal(sandbox.V5AutonomousTestIngameUpdater.version, "1.0.6");
  const state = sandbox.V5PR206UpdaterRecoveryBootstrap.status();
  assert.equal(state.testId, "pr20-6-native-updater-recovery-bootstrap-v5");
  assert.equal(state.version, "1.0.5");
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.terminal, true);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.normalRuntimeAllowed, false);

  const ops = sandbox.AIO_V3.operations;
  assert.equal(typeof ops.status, "function");
  assert.equal(typeof ops.hostHeartbeat, "function");
  assert.equal(typeof ops.reconciliationStatus, "function");
  assert.equal(typeof ops.peekTelemetry, "function");
  assert.equal(ops.status().v5AutonomousTest.testId, state.testId);
  assert.equal(ops.hostHeartbeat().alive, true);
  assert.equal(ops.reconciliationStatus().v5Terminal, true);
  assert.deepEqual(Array.from(ops.peekTelemetry(2000)), []);
});
