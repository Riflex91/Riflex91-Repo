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
  // Historical evidence pins its own immutable package. The live manifest may
  // advance beyond PR20.7 without invalidating this ratified PASS.
  if (manifest.testId === plan.testId) {
    assert.equal(manifest.gate, plan.gate);
  }
  assert.equal(manifest.repository, "Riflex91/Riflex91-Repo");
  assert.equal(manifest.branch, "main");
  assert.equal(manifest.coordinatorClass, "merchant");
  assert.equal(manifest.normalRuntimeAllowed, false);
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

test("PR20.7 evidence ratifies the exact real no-write PASS", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_NO_WRITE");
  assert.equal(evidence.manifestMainCommit, "63f0218974f793e08eee0a5c2284dffab2f9a018");
  assert.equal(evidence.observedAtMs, 1790194007103);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.result.status, "BESTANDEN");
  assert.equal(evidence.result.phase, "COMPLETE");
  assert.equal(evidence.result.version, "1.0.0");
  assert.equal(evidence.result.recipient.characterName, "My_Merchant");
  assert.equal(evidence.result.recipient.ctype, "merchant");
  assert.equal(evidence.result.recipient.serverRegion, "EU");
  assert.equal(evidence.result.recipient.serverIdentifier, "I");
  assert.equal(evidence.result.candidate.slot, "helmet");
  assert.equal(evidence.result.candidate.inventoryIndex, 7);
  assert.equal(evidence.result.candidate.physical, true);
  assert.equal(evidence.result.candidate.locked, false);
  assert.equal(evidence.result.candidate.virtualB, false);
  assert.equal(evidence.result.previousSlotItem.physical, true);
  assert.equal(evidence.result.previousSlotItem.locked, false);
  assert.equal(evidence.result.previousSlotItem.virtualB, false);
  assert.notEqual(
    evidence.result.candidate.fingerprintSha256,
    evidence.result.previousSlotItem.fingerprintSha256,
  );
  assert.equal(evidence.result.stableDoubleObservation, true);
  assert.equal(evidence.result.performanceTrick.active, true);
  assert.equal(evidence.result.performanceTrick.playing, true);
  assert.equal(
    evidence.result.performanceTrick.verification,
    "HOWLER_PLAYING_TRUE",
  );
  assert.equal(evidence.observedSafetyBoundary.browserGameplayWrites, 0);
  assert.equal(evidence.observedSafetyBoundary.publicFunctionCalls, 0);
  assert.equal(evidence.observedSafetyBoundary.rawWriteCalls, 0);
  assert.equal(evidence.observedSafetyBoundary.startCalls, 0);
  assert.equal(evidence.observedSafetyBoundary.disconnectCalls, 0);
  assert.equal(evidence.observedSafetyBoundary.farmerWorkersInstalled, 0);
  assert.equal(evidence.observedSafetyBoundary.authorityIssued, false);
  assert.equal(evidence.observedSafetyBoundary.durableIntentCreated, false);
  assert.equal(evidence.observedSafetyBoundary.swapWriteRatification, false);
  assert.equal(evidence.observedSafetyBoundary.sameIntentRetry, false);
  assert.equal(evidence.observedSafetyBoundary.normalRuntimeAllowed, false);
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker, []);
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
