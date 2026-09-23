import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-read-only-preflight-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-read-only-preflight-evidence.json",
  "utf8",
));
const manifest = JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));
const packageBytes = fs.readFileSync(
  "werkzeuge/pr20-7-gear-read-only-autonomous.js",
);
const packageSource = packageBytes.toString("utf8");
const packageSha256 = crypto.createHash("sha256")
  .update(packageBytes)
  .digest("hex");

test("PR20.7 real read-only plan pins the exact autonomous package", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(
    plan.testId,
    "pr20-7-gear-occupied-slot-read-only-preflight",
  );
  assert.equal(plan.controllerVersion, "1.0.0");
  assert.equal(
    plan.status,
    "BEREIT_FUER_REALEN_NO_WRITE_PREFLIGHT",
  );
  assert.equal(plan.deployment.coordinatorClass, "merchant");
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.match(plan.deployment.sourceCommit, /^[0-9a-f]{40}$/);
  assert.equal(plan.deployment.packageSha256, packageSha256);
  assert.equal(manifest.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(manifest.packageSha256, packageSha256);
  assert.equal(manifest.packagePath, plan.deployment.packagePath);
  assert.equal(manifest.testId, plan.testId);
  assert.equal(manifest.gate, plan.gate);
});

test("PR20.7 real preflight keeps all mutation and lifecycle authority closed", () => {
  const boundary = plan.mutationBoundary;
  assert.equal(boundary.browserGameplayWrites, 0);
  assert.equal(boundary.publicFunctionCalls, 0);
  assert.equal(boundary.rawWriteCalls, 0);
  assert.equal(boundary.durableIntentCreated, false);
  assert.equal(boundary.authorityIssued, false);
  assert.equal(boundary.swapWriteRatification, false);
  assert.equal(boundary.startCalls, 0);
  assert.equal(boundary.disconnectCalls, 0);
  assert.equal(boundary.farmerWorkersInstalled, 0);
  assert.equal(boundary.sameIntentRetry, false);
  assert.equal(boundary.normalRuntimeAllowed, false);

  for (const marker of [
    ["use", "_", "skill", "("],
    ["start", "_", "character", "("],
    ["command", "_", "character", "("],
    ["equip", "("],
    ["un", "equip", "("],
    ["send", "_", "item", "("],
    ["api", "_", "call", "("],
    ["socket", ".", "emit", "("],
    ["/", "disconnect", " "],
  ].map(parts => parts.join(""))) {
    assert.equal(packageSource.includes(marker), false, marker);
  }
});

test("PR20.7 evidence placeholder cannot masquerade as a real PASS", () => {
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.deepEqual(
    evidence.blocker,
    ["REAL_BROWSER_PREFLIGHT_NOCH_NICHT_AUSGEFUEHRT"],
  );
  assert.equal(
    evidence.expectedSafetyBoundary.browserGameplayWrites,
    0,
  );
  assert.equal(
    evidence.expectedSafetyBoundary.authorityIssued,
    false,
  );
  assert.equal(
    evidence.expectedSafetyBoundary.normalRuntimeAllowed,
    false,
  );
});

test("PR20.7 safe slot list excludes weapons and offhand", () => {
  assert.ok(plan.recipient.safeOccupiedSlots.length > 0);
  assert.equal(plan.recipient.safeOccupiedSlots.includes("mainhand"), false);
  assert.equal(plan.recipient.safeOccupiedSlots.includes("offhand"), false);
  assert.equal(plan.recipient.stableDoubleObservation, true);
  assert.equal(plan.prerequisites.performanceTrickRequired, true);
  assert.equal(
    plan.prerequisites.performanceTrickVerification,
    "HOWLER_PLAYING_TRUE",
  );
});
