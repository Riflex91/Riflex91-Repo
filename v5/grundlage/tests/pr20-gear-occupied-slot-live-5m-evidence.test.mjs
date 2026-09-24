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
  assert.match(plan.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(plan.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.sourceCommit, evidence.sourceCommit);
  assert.equal(plan.packageSha256, evidence.packageSha256);
});

test("PR20.7 productive live evidence ratifies exact one-write committed 5m pass", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.match(evidence.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(evidence.packageSha256, /^[0-9a-f]{64}$/);
  assert.match(evidence.manifestMainCommit, /^[0-9a-f]{40}$/);
  assert.equal(evidence.observedAtMs, 1790224307797);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker, []);
  assert.equal(evidence.result.status, "BESTANDEN");
  assert.equal(evidence.result.phase, "COMPLETE");
  assert.equal(evidence.result.recipient.characterName, "My_Merchant");
  assert.equal(evidence.result.recipient.ctype, "merchant");
  assert.equal(evidence.result.recipient.serverRegion, "EU");
  assert.equal(evidence.result.recipient.serverIdentifier, "I");
  assert.equal(evidence.result.candidate.slot, "helmet");
  assert.equal(evidence.result.candidate.inventoryIndex, 7);
  assert.equal(evidence.result.candidate.name, "wcap");
  assert.equal(evidence.result.candidate.level, 4);
  assert.equal(evidence.result.previousSlotItem.name, "partyhat");
  assert.equal(evidence.result.previousSlotItem.level, 5);
  assert.equal(evidence.result.durableIntentReadback, true);
  assert.equal(evidence.result.reconciliation, "COMMITTED");
  assert.equal(evidence.result.settlement, "BESTAETIGT");
  assert.equal(evidence.result.oneShotAuthority.issued, true);
  assert.equal(evidence.result.oneShotAuthority.consumed, true);
  assert.equal(evidence.result.oneShotAuthority.maximumUses, 1);
  assert.equal(evidence.result.performanceTrick.active, true);
  assert.equal(evidence.result.performanceTrick.playing, true);
  assert.equal(evidence.result.performanceTrick.verification, "HOWLER_PLAYING_TRUE");
  assert.equal(evidence.result.soak.status, "BESTANDEN");
  assert.equal(evidence.result.soak.samples, 60);
  assert.ok(evidence.result.soak.durationMs >= 299000);
  for (const [key, expected] of Object.entries({
    gameplayWrites: 1,
    publicFunctionCalls: 1,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    normalRuntimeAllowed: false,
  })) {
    assert.equal(evidence.observedSafetyBoundary[key], expected, key);
  }
  assert.equal(evidence.deploymentEvidence.conclusion, "SUCCESS");
});
