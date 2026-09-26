import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-bridge-handshake-terminal-recovery-evidence.json",
  "utf8",
));
const manifest = JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));

test("PR20.8 terminal bridge recovery is real-browser BESTANDEN and zero-write", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_TERMINAL_ZERO_WRITE");
  assert.equal(evidence.ratified, true);
  assert.equal(evidence.manifestMainCommit, "ff22a1c835b2634e3ce67a8a724ab6d6d9fb7675");
  assert.equal(evidence.testId, "pr20-8-bridge-handshake-probe-v1");
  assert.equal(evidence.controllerVersion, "1.0.1");

  const live=evidence.steadyState;
  assert.equal(live.status, "BESTANDEN");
  assert.equal(live.phase, "BRIDGE_HANDSHAKE_PROBE_COMPLETE");
  assert.equal(live.terminal, true);
  assert.equal(live.bridgeState, "ALREADY_PRESENT");
  assert.equal(live.bridgeError, null);
  assert.equal(live.gameplayWrites, 0);
  assert.equal(live.publicFunctionCalls, 0);
  assert.equal(live.rawWriteCalls, 0);
  assert.equal(live.sameIntentRetry, false);
  assert.equal(live.normalRuntimeAllowed, false);

  assert.equal(evidence.firstDeployment.bridgeState, "DEPLOYED");
  assert.equal(evidence.firstDeployment.bridgeError, null);
  assert.equal(evidence.conclusion.bridgeHandshakeConfirmed, true);
  assert.equal(evidence.conclusion.updater108PersistenceConfirmed, true);
  assert.equal(evidence.conclusion.terminalRecoveryConfirmed, true);
  assert.equal(evidence.conclusion.bootstrapV3Required, false);
  assert.equal(evidence.conclusion.nextTestMayAdvance, true);
  assert.equal(evidence.safety.noAdditionalGameplayWriteObserved, true);
  assert.equal(evidence.safety.compoundRatified, false);
  assert.equal(evidence.safety.exchangeRatified, false);
});

test("PR20.8 terminal recovery package remains immutable and no-write", () => {
  const bytes=execFileSync(
    "git",
    ["show", evidence.sourceCommit + ":" + evidence.packagePath],
    {encoding:null,maxBuffer:256*1024},
  );
  assert.equal(bytes.length,evidence.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    evidence.packageSha256,
  );
  const source=bytes.toString("utf8");
  assert.ok(source.includes('const VERSION = "1.0.1"'));
  assert.ok(source.includes('status: "BESTANDEN"'));
  assert.ok(source.includes("terminal: true"));
  for(const marker of [
    "upload_code(", "load_code(", "upgrade(", "compound(", "exchange(",
    "buy(", "sell(", "send_item(", "send_gold(", "socket.emit(", ".socket.emit(",
    "api_call("
  ]) assert.equal(source.includes(marker),false,marker);
});

test("terminal recovery evidence stays immutable while the current manifest advances to the anniversarygift Exchange service mount", () => {
  assert.equal(manifest.testId,"pr20-9-craft-durable-shadow-natural-recheck-no-write");
  assert.equal(manifest.controllerVersion,"1.1.0");
  assert.equal(manifest.sourceCommit,"406feea6491edd14be2e76c842ac761b89f57a5d");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr20-9-craft-durable-shadow-natural-recheck-no-write.js");
  assert.equal(manifest.packageSha256,"f1b5fc3fd761fbca12355976543e823bff4bf53efed074b1d4820433a0567008");
  assert.equal(manifest.expectedGlobal,"V5PR209CraftDurableShadowNaturalRecheckNoWrite");
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.equal(evidence.nextGate, "PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
});
