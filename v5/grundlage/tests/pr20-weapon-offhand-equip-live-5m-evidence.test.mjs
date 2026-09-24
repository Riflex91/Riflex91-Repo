import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-equip-live-5m-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-equip-live-5m-evidence.json",
  "utf8",
));

test("PR20.7 wshield offhand live plan stays exact one-shot and 5m bounded", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(plan.status, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(plan.scope.exactRecipientCharacter, "My_Merchant");
  assert.equal(plan.scope.exactServer, "EU:I");
  assert.equal(plan.scope.exactItem, "wshield");
  assert.equal(plan.scope.targetSlot, "offhand");
  assert.equal(plan.scope.previousTargetSlotMustBeEmpty, true);
  assert.equal(plan.scope.exactOppositeHandName, "staff");
  assert.equal(plan.scope.dynamicInventoryIndex, true);
  assert.equal(plan.scope.exactlyOneCompatibleCandidateRequired, true);
  assert.equal(plan.transaction.maximumGameplayWrites, 1);
  assert.equal(plan.transaction.maximumPublicFunctionCalls, 1);
  assert.equal(plan.transaction.rawWriteCalls, 0);
  assert.equal(plan.transaction.oneShotMaximumUses, 1);
  assert.equal(plan.transaction.durableIntentBeforePossibleSend, true);
  assert.equal(plan.transaction.durableReadbackRequired, true);
  assert.equal(plan.transaction.equipmentFenceRequired, true);
  assert.equal(plan.transaction.inventoryFenceRequired, true);
  assert.equal(plan.transaction.exactEmptyOffhandPrestate, true);
  assert.equal(plan.transaction.oppositeHandPinned, true);
  assert.equal(plan.transaction.sameIntentRetry, false);
  assert.equal(plan.transaction.restartReconcileWithoutResend, true);
  assert.equal(plan.soak.minimumSamples, 60);
  assert.ok(plan.soak.minimumDurationMs >= 299000);
  assert.equal(plan.authority.normalRuntimeAllowed, false);
  assert.equal(plan.nextAction, "PR20_7_FARMER_GEAR_ALLOCATION_RATIFICATION");
  assert.equal(plan.deployment.sourceCommit, evidence.sourceCommit);
  assert.equal(plan.deployment.packageSha256, evidence.packageSha256);
});

test("PR20.7 wshield offhand live evidence ratifies exact committed one-write pass", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(evidence.manifestMainCommit, "72ba966878e1575df786ca1e60f50044e2aa89a5");
  assert.equal(evidence.observedAtMs, 1790251127933);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker, []);
  assert.equal(evidence.nextGate, "PR20_7_FARMER_GEAR_ALLOCATION_RATIFICATION");
  assert.equal(evidence.result.status, "BESTANDEN");
  assert.equal(evidence.result.phase, "COMPLETE");
  assert.equal(evidence.result.transactionId, "PR20.7-WSHIELD-EQUIP-1790250827079");
  assert.equal(evidence.result.recipient.characterName, "My_Merchant");
  assert.equal(evidence.result.recipient.serverRegion, "EU");
  assert.equal(evidence.result.recipient.serverIdentifier, "I");
  assert.equal(evidence.result.candidate.name, "wshield");
  assert.equal(evidence.result.candidate.slot, "offhand");
  assert.equal(evidence.result.candidate.inventoryIndex, 1);
  assert.equal(evidence.result.previousSlotItem, null);
  assert.equal(evidence.result.oppositeHand.name, "staff");
  assert.equal(evidence.result.oppositeHand.slot, "mainhand");
  assert.equal(evidence.result.durableIntentReadback, true);
  assert.equal(evidence.result.sendBoundaryState, "MOEGLICH_GESENDET");
  assert.equal(evidence.result.reconciliation, "COMMITTED");
  assert.equal(evidence.result.settlement, "BESTAETIGT");
  assert.equal(evidence.result.oneShotAuthority.issued, true);
  assert.equal(evidence.result.oneShotAuthority.consumed, true);
  assert.equal(evidence.result.oneShotAuthority.maximumUses, 1);
  assert.equal(evidence.result.oneShotAuthority.exactEmptyOffhandPrestate, true);
  assert.equal(evidence.result.oneShotAuthority.oppositeHandPinned, true);
  assert.equal(evidence.result.oneShotAuthority.equipmentInventoryFenceClaims, true);
  assert.equal(evidence.result.performanceTrick.active, true);
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
  })) assert.equal(evidence.observedSafetyBoundary[key], expected, key);
  assert.equal(evidence.deploymentEvidence.githubWorkflow, "deploy-cloudflare");
  assert.equal(evidence.deploymentEvidence.workflowRunId, 35995541139);
  assert.equal(evidence.deploymentEvidence.conclusion, "SUCCESS");
});
