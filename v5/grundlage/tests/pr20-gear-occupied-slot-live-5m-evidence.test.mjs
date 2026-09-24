import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-occupied-slot-live-5m-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-occupied-slot-live-5m-evidence.json",
  "utf8",
));

test("PR20.7 productive occupied-slot plan is exact one-shot and 5m bounded", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(plan.scope.exactRecipientCharacter, "My_Merchant");
  assert.deepEqual(plan.scope.expectedShadowCandidate, {
    slot: "helmet",
    inventoryIndex: 7,
    candidateName: "wcap",
    candidateLevel: 4,
    previousName: "partyhat",
    previousLevel: 5,
  });
  assert.equal(plan.scope.weaponsAndOffhandExcluded, true);
  assert.equal(plan.scope.farmerGearAllocationExcluded, true);
  assert.equal(plan.transaction.maximumGameplayWrites, 1);
  assert.equal(plan.transaction.maximumPublicFunctionCalls, 1);
  assert.equal(plan.transaction.publicFunction, "equip");
  assert.equal(plan.transaction.rawWriteCalls, 0);
  assert.equal(plan.transaction.durableIntentBeforePossibleSend, true);
  assert.equal(plan.transaction.equipmentFence, true);
  assert.equal(plan.transaction.inventoryFence, true);
  assert.equal(plan.transaction.oneShotMaximumUses, 1);
  assert.equal(plan.transaction.sameIntentRetry, false);
  assert.equal(plan.transaction.restartReconcileWithoutResend, true);
  assert.equal(plan.soak.minimumSamples, 60);
  assert.equal(plan.soak.intervalMs, 5000);
  assert.ok(plan.soak.minimumDurationMs >= 299000);
  assert.equal(plan.safety.normalRuntimeAllowed, false);
});

test("PR20.7 productive live evidence placeholder cannot count as PASS", () => {
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.sourceCommit, null);
  assert.equal(evidence.packageSha256, null);
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.deepEqual(
    evidence.blocker,
    ["PRODUCTIVE_ONE_SHOT_LIVE_5M_NOCH_NICHT_AUSGEFUEHRT"],
  );
  assert.equal(evidence.expectedSafetyBoundary.gameplayWrites, 1);
  assert.equal(evidence.expectedSafetyBoundary.publicFunctionCalls, 1);
  assert.equal(evidence.expectedSafetyBoundary.rawWriteCalls, 0);
  assert.equal(evidence.expectedSafetyBoundary.sameIntentRetry, false);
  assert.equal(evidence.expectedSafetyBoundary.normalRuntimeAllowed, false);
});
