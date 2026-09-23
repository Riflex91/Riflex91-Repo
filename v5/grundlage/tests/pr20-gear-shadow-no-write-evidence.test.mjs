import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-shadow-no-write-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-shadow-no-write-evidence.json",
  "utf8",
));
const manifest = JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));
const bytes = fs.readFileSync(
  "werkzeuge/pr20-7-gear-shadow-no-write-autonomous.js",
);
const sha = crypto.createHash("sha256").update(bytes).digest("hex");

test("PR20.7 real shadow plan pins exact workerless package", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(plan.testId, "pr20-7-gear-occupied-slot-shadow-no-write");
  assert.equal(plan.status, "BEREIT_FUER_REALEN_SHADOW_NO_WRITE");
  assert.equal(plan.merchantOnly, true);
  assert.equal(plan.workerPackageConfigured, false);
  assert.equal(plan.packageSha256, sha);
  assert.equal(manifest.testId, plan.testId);
  assert.equal(manifest.sourceCommit, plan.sourceCommit);
  assert.equal(manifest.packagePath, plan.packagePath);
  assert.equal(manifest.packageSha256, sha);
  assert.equal(manifest.expectedGlobal, plan.expectedGlobal);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
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

test("PR20.7 shadow evidence placeholder cannot count as PASS", () => {
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.deepEqual(
    evidence.blocker,
    ["REAL_BROWSER_SHADOW_NOCH_NICHT_AUSGEFUEHRT"],
  );
});
