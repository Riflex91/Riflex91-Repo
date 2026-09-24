import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, "..", "pr20-8-bridge-handshake-probe-v1-0-1.js"),
  "utf8",
);

test("PR20.8 bridge handshake probe v1.0.1 terminalizes only the diagnostic zero-write state", () => {
  for (const forbidden of [
    "upload_code(", "load_code(", "socket.emit(", ".socket.emit(", "api_call(",
    "use_skill(", "upgrade(", "compound(", "exchange(", "craft(", "buy(",
    "sell(", "send_item(", "send_gold("
  ]) assert.equal(source.includes(forbidden), false, forbidden);

  const parent = { AIO_V3: { operations: { status: () => ({ schemaVersion: 1 }) } } };
  const sandbox = {
    console, JSON, Object, String, Number, Boolean, Array,
    globalThis: null,
    parent,
    AIO_V3: { operations: { status: () => ({ schemaVersion: 1 }) } }
  };
  sandbox.globalThis = sandbox;

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-bridge-handshake-probe-v1-0-1.js"
  });

  for (const owner of [sandbox, parent]) {
    const status = owner.AIO_V3.operations.status().v5AutonomousTest;
    assert.equal(status.testId, "pr20-8-bridge-handshake-probe-v1");
    assert.equal(status.version, "1.0.1");
    assert.equal(status.status, "BESTANDEN");
    assert.equal(status.phase, "BRIDGE_HANDSHAKE_PROBE_COMPLETE");
    assert.equal(status.terminal, true);
    assert.equal(status.gameplayWrites, 0);
    assert.equal(status.publicFunctionCalls, 0);
    assert.equal(status.rawWriteCalls, 0);
    assert.equal(status.sameIntentRetry, false);
    assert.deepEqual(Array.from(status.intents), []);
    assert.equal(status.normalRuntimeAllowed, false);
    assert.equal(status.probe.synchronous, true);
    assert.equal(status.probe.diagnosticCompletion, true);
    assert.equal(status.probe.updaterInstall, false);
    assert.equal(status.probe.codeSlotPersistence, false);
    assert.equal(status.probe.gameplayMutation, false);

    const reconciliation = owner.AIO_V3.operations.reconciliationStatus();
    assert.equal(reconciliation.status, "TERMINAL_NO_MUTATION");
    assert.equal(reconciliation.v5Terminal, true);

    const api = owner.V5PR208BridgeHandshakeProbe;
    assert.equal(api.testId, "pr20-8-bridge-handshake-probe-v1");
    assert.equal(api.version, "1.0.1");
    assert.equal(api.status().terminal, true);
  }
});
