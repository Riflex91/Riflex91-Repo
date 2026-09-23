import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "pr20-6-updater-recovery-bootstrap.js"), "utf8");

test("PR20.6 updater recovery bootstrap is terminal, no-write and installs updater 1.0.2", async () => {
  assert.ok(source.includes("pr20-6-native-updater-recovery-bootstrap-v1"));
  assert.ok(source.includes("V5PR206UpdaterRecoveryBootstrap"));
  assert.ok(source.includes("const VERSION = '1.0.2'"));
  for (const forbidden of ["socket.emit(", ".socket.emit(", "api_call(", "use_skill(", "start_character("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }

  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    setTimeout, clearTimeout, setInterval() { return 1; }, clearInterval() {},
    character: { name: "Merchant", ctype: "merchant", hp: 1000, max_hp: 1000, rip: false, dead: false },
    AIO_V3: { operations: { status() { return { schemaVersion: 1 }; } } }
  };
  sandbox.parent = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "pr20-6-updater-recovery-bootstrap.js" });
  await Promise.resolve();

  assert.equal(sandbox.V5AutonomousTestIngameUpdater.version, "1.0.2");
  const state = sandbox.V5PR206UpdaterRecoveryBootstrap.status();
  assert.equal(state.testId, "pr20-6-native-updater-recovery-bootstrap-v1");
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.terminal, true);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.deepEqual(Array.from(state.intents), []);
  assert.equal(state.normalRuntimeAllowed, false);
  assert.equal(sandbox.AIO_V3.operations.status().v5AutonomousTest.testId, state.testId);
});
