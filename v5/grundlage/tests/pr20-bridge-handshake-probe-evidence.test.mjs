import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-bridge-handshake-probe-evidence.json",
  "utf8",
));

test("PR20.8 bridge handshake evidence pins successful zero-write live observations", () => {
  assert.equal(evidence.status, "BESTANDEN_LIVE_HANDSHAKE_ZERO_WRITE");
  assert.equal(evidence.immutable, true);

  const bootstrap = evidence.bootstrapV2Persistence;
  assert.equal(bootstrap.telemetryBatchId, 8255);
  assert.equal(bootstrap.testId, "pr20-8-native-updater-recovery-bootstrap-v2");
  assert.equal(bootstrap.status, "BESTANDEN");
  assert.equal(bootstrap.phase, "UPDATER_PERSISTENCE_BOOTSTRAP");
  assert.equal(bootstrap.terminal, true);
  assert.equal(bootstrap.persisted, true);
  assert.equal(bootstrap.updaterVersion, "1.0.8");
  assert.equal(bootstrap.gameplayWrites, 0);
  assert.equal(bootstrap.publicFunctionCalls, 0);
  assert.equal(bootstrap.rawWriteCalls, 0);
  assert.equal(bootstrap.bridgeState, "ALREADY_PRESENT");
  assert.equal(bootstrap.bridgeError, null);

  const probe = evidence.bridgeHandshakeProbe;
  assert.equal(probe.telemetryBatchId, 8256);
  assert.equal(probe.testId, "pr20-8-bridge-handshake-probe-v1");
  assert.equal(probe.controllerVersion, "1.0.0");
  assert.equal(probe.status, "LAEUFT");
  assert.equal(probe.phase, "BRIDGE_HANDSHAKE_PROBE");
  assert.equal(probe.terminal, false);
  assert.equal(probe.gameplayWrites, 0);
  assert.equal(probe.publicFunctionCalls, 0);
  assert.equal(probe.rawWriteCalls, 0);
  assert.equal(probe.bridgeState, "ALREADY_PRESENT");
  assert.equal(probe.bridgeError, null);
  assert.equal(probe.handshakeConfirmed, true);

  assert.equal(evidence.conclusion.bridgeHandshakeWorks, true);
  assert.equal(evidence.conclusion.updater108Persisted, true);
  assert.equal(evidence.conclusion.bootstrapV3Required, false);
  assert.equal(evidence.conclusion.probeTerminalRecoveryRequired, true);
  assert.equal(evidence.safety.upgradeOneWriteRunnerRetired, true);
  assert.equal(evidence.safety.noAdditionalGameplayWriteObserved, true);
  assert.equal(evidence.safety.compoundRatified, false);
  assert.equal(evidence.safety.exchangeRatified, false);
  assert.equal(evidence.safety.normalRuntimeAllowed, false);
});

test("PR20.8 terminal probe recovery package is immutable and exactly pinned", () => {
  const recovery = evidence.terminalRecovery;
  assert.equal(recovery.testId, "pr20-8-bridge-handshake-probe-v1");
  assert.equal(recovery.fromVersion, "1.0.0");
  assert.equal(recovery.toVersion, "1.0.1");
  assert.equal(recovery.packageBytes, 2390);
  assert.equal(recovery.gameplayWrites, 0);
  assert.equal(recovery.publicFunctionCalls, 0);
  assert.equal(recovery.rawWriteCalls, 0);
  assert.equal(recovery.normalRuntimeAllowed, false);

  const bytes = execFileSync(
    "git",
    ["show", recovery.sourceCommit + ":" + recovery.package],
    { encoding: null, maxBuffer: 256 * 1024 },
  );
  assert.equal(bytes.length, recovery.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    recovery.packageSha256,
  );

  const source = bytes.toString("utf8");
  assert.ok(source.includes('const VERSION = "1.0.1"'));
  assert.ok(source.includes('status: "BESTANDEN"'));
  assert.ok(source.includes('phase: "BRIDGE_HANDSHAKE_PROBE_COMPLETE"'));
  assert.ok(source.includes("terminal: true"));
  for (const marker of [
    "upload_code(", "load_code(", "upgrade(", "compound(", "exchange(",
    "buy(", "sell(", "send_item(", "send_gold(", "socket.emit(", ".socket.emit(",
    "api_call("
  ]) assert.equal(source.includes(marker), false, marker);
});
