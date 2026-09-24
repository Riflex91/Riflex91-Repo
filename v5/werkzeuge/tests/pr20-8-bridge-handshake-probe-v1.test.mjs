import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, "..", "pr20-8-bridge-handshake-probe-v1.js"),
  "utf8",
);

function deploymentProbe(owner) {
  const aio = owner.AIO_V3
    || (owner.parent && owner.parent.AIO_V3)
    || null;
  const operations = aio && aio.operations;
  const status = typeof operations?.status === "function"
    ? operations.status()
    : null;
  const current = status?.v5AutonomousTest
    && typeof status.v5AutonomousTest === "object"
      ? status.v5AutonomousTest
      : null;
  return {
    currentTestId: current ? String(current.testId || "") : null,
    currentVersion: current ? String(current.version || "") : null,
    currentStatus: current ? String(current.status || "") : null,
    currentPhase: current ? String(current.phase || "") : null,
    currentTerminal: current ? current.terminal === true : false,
    currentGameplayWrites: current && Number.isFinite(Number(current.gameplayWrites))
      ? Math.max(0, Number(current.gameplayWrites))
      : null,
    currentRawWriteCalls: current && Number.isFinite(Number(current.rawWriteCalls))
      ? Math.max(0, Number(current.rawWriteCalls))
      : null,
    currentSameIntentRetry: current ? current.sameIntentRetry !== false : null,
    currentIntentCount: current && Array.isArray(current.intents)
      ? current.intents.length
      : null
  };
}

function coordinatorProbe(owner, expectedGlobal) {
  const local = owner;
  const host = owner.parent && owner.parent !== owner ? owner.parent : owner;
  const api = local[expectedGlobal] || host[expectedGlobal] || null;
  let status = null;
  try { status = typeof api?.status === "function" ? api.status() : null; } catch {}
  return {
    testId: status
      ? String(status.testId || api?.testId || "")
      : String(api?.testId || ""),
    version: status
      ? String(status.version || api?.version || "")
      : String(api?.version || "")
  };
}

test("PR20.8 handshake probe mirrors both bridge verification surfaces synchronously", () => {
  for (const forbidden of [
    "upload_code(",
    "load_code(",
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

  const parent = {
    AIO_V3: {
      operations: {
        status() {
          return {
            schemaVersion: 1,
            v5AutonomousTest: {
              testId: "parent-old",
              version: "9.9.9",
              terminal: true
            }
          };
        }
      }
    }
  };
  const sandbox = {
    console,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Array,
    globalThis: null,
    parent,
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
              intents: [{ status: "COMMITTED", sendCount: 1 }]
            }
          };
        }
      }
    }
  };
  sandbox.globalThis = sandbox;

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-bridge-handshake-probe-v1.js"
  });

  for (const owner of [sandbox, parent]) {
    const status = owner.AIO_V3.operations.status().v5AutonomousTest;
    assert.equal(status.testId, "pr20-8-bridge-handshake-probe-v1");
    assert.equal(status.version, "1.0.0");
    assert.equal(status.status, "LAEUFT");
    assert.equal(status.phase, "BRIDGE_HANDSHAKE_PROBE");
    assert.equal(status.terminal, false);
    assert.equal(status.gameplayWrites, 0);
    assert.equal(status.publicFunctionCalls, 0);
    assert.equal(status.rawWriteCalls, 0);
    assert.equal(status.sameIntentRetry, false);
    assert.equal(status.intents.length, 0);
    assert.equal(status.normalRuntimeAllowed, false);
  }

  const deployed = deploymentProbe(sandbox);
  assert.equal(deployed.currentTestId, "pr20-8-bridge-handshake-probe-v1");
  assert.equal(deployed.currentVersion, "1.0.0");
  assert.equal(deployed.currentStatus, "LAEUFT");
  assert.equal(deployed.currentPhase, "BRIDGE_HANDSHAKE_PROBE");
  assert.equal(deployed.currentTerminal, false);
  assert.equal(deployed.currentGameplayWrites, 0);
  assert.equal(deployed.currentRawWriteCalls, 0);
  assert.equal(deployed.currentSameIntentRetry, false);
  assert.equal(deployed.currentIntentCount, 0);

  const api = coordinatorProbe(sandbox, "V5PR208BridgeHandshakeProbe");
  assert.equal(api.testId, "pr20-8-bridge-handshake-probe-v1");
  assert.equal(api.version, "1.0.0");
});

test("PR20.8 handshake probe does not inherit old committed mutation counters", () => {
  const sandbox = {
    console,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Array,
    globalThis: null,
    AIO_V3: {
      operations: {
        status() {
          return {
            schemaVersion: 1,
            v5AutonomousTest: {
              testId: "pr20-8-upgrade-productive-one-write-live",
              version: "1.0.3",
              gameplayWrites: 1,
              publicFunctionCalls: 1,
              rawWriteCalls: 0,
              intents: [{ sendCount: 1 }]
            }
          };
        }
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, {
    filename: "pr20-8-bridge-handshake-probe-v1.same-root.js"
  });

  const status = sandbox.AIO_V3.operations.status().v5AutonomousTest;
  assert.equal(status.testId, "pr20-8-bridge-handshake-probe-v1");
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.intents.length, 0);
});
