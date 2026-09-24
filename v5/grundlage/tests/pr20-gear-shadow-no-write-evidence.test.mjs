import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-shadow-no-write-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-shadow-no-write-evidence.json",
  "utf8",
));
const pinnedBytes = execFileSync(
  "git",
  ["show", plan.sourceCommit + ":" + plan.packagePath],
  { encoding: null, maxBuffer: 256 * 1024 },
);
const pinnedSha = crypto.createHash("sha256").update(pinnedBytes).digest("hex");

test("PR20.7 real shadow plan pins exact historical workerless package", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(plan.testId, "pr20-7-gear-occupied-slot-shadow-no-write");
  assert.equal(plan.status, "BEREIT_FUER_REALEN_SHADOW_NO_WRITE");
  assert.equal(plan.merchantOnly, true);
  assert.equal(plan.workerPackageConfigured, false);
  assert.match(plan.sourceCommit, /^[0-9a-f]{40}$/);
  assert.equal(plan.packageSha256, pinnedSha);
  assert.equal(evidence.sourceCommit, plan.sourceCommit);
  assert.equal(evidence.packageSha256, plan.packageSha256);
  assert.equal(evidence.ratified, true);
});

test("PR20.7 real shadow is explicitly no-send/no-authority", () => {
  assert.equal(plan.shadow.shadowDurableIntentReadback, true);
  assert.equal(plan.shadow.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(plan.shadow.expectedReconciliation, "NOT_APPLIED");
  assert.equal(plan.shadow.stablePostIntentReobserve, true);
  for (const [key, expected] of Object.entries({
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    swapWriteRatification: false,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
  })) {
    assert.equal(plan.safetyBoundary[key], expected, key);
  }
});

test("PR20.7 real shadow evidence is terminal, ratified and zero-write", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_SHADOW_NO_WRITE");
  assert.equal(evidence.observedAtMs, 1790196937277);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker, []);
  assert.equal(evidence.result.status, "BESTANDEN");
  assert.equal(evidence.result.phase, "COMPLETE");
  assert.equal(evidence.result.recipient.characterName, "My_Merchant");
  assert.equal(evidence.result.candidate.slot, "helmet");
  assert.equal(evidence.result.candidate.inventoryIndex, 7);
  assert.equal(evidence.result.stableDoubleObservation, true);
  assert.equal(evidence.result.performanceTrick.active, true);
  assert.equal(evidence.result.shadowDurableIntentCreated, true);
  assert.equal(evidence.result.shadowDurableReadback, true);
  assert.equal(evidence.result.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(evidence.result.reconciliationClassification, "NOT_APPLIED");
  assert.equal(evidence.result.oneShotBindingPrepared, true);
  assert.equal(evidence.result.equipmentInventoryFenceClaimsPrepared, true);
  for (const [key, expected] of Object.entries({
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    swapWriteRatification: false,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
  })) {
    assert.equal(evidence.observedSafetyBoundary[key], expected, key);
  }
  assert.equal(evidence.deploymentEvidence.v5Publish, "SUCCESS");
  assert.equal(evidence.deploymentEvidence.v5ReadbackVerify, "SUCCESS");
});
