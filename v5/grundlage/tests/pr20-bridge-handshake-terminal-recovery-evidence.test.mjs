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
const roadmap = JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
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

test("terminal recovery evidence stays immutable across the temporary PR20.9 no-write manifest cutover", () => {
  assert.equal(manifest.normalRuntimeAllowed, false);
  const restore=roadmap.pr20_9.craftDurableShadowRunner.restoreManifest;
  assert.equal(restore.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(restore.controllerVersion,"1.0.6");
  assert.equal(restore.sourceCommit,"a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.equal(restore.package,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js");
  assert.equal(restore.packageSha256,"fb2395104beee0e611e5150c44183c95976eab188e451c23401271d1ae02e387");
  assert.equal(restore.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(restore.normalRuntimeAllowed,false);
  assert.ok([
    "pr20-9-craft-durable-shadow-no-write",
    restore.testId,
  ].includes(manifest.testId));
  assert.equal(evidence.nextGate, "PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
});
