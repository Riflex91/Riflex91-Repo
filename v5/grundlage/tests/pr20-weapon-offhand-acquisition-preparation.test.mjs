import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-7-weapon-offhand-acquisition-preparation.json",
  "utf8",
));
const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-acquisition-read-only-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-acquisition-read-only-evidence.json",
  "utf8",
));
const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js",
  "utf8",
);

test("PR20.7 acquisition candidate is exact wshield Merchant offhand source", () => {
  assert.equal(contract.blockingGate, "PR20.7_GEAR");
  assert.equal(contract.status, "READ_ONLY_SOURCE_PREFLIGHT_PREPARED_NO_PURCHASE_AUTHORITY");
  assert.equal(contract.rationale.procurementRequired, true);
  assert.equal(contract.rationale.farmerGearAllocationStillSeparate, true);
  assert.equal(contract.candidate.recipient, "My_Merchant");
  assert.equal(contract.candidate.recipientClass, "merchant");
  assert.equal(contract.candidate.itemName, "wshield");
  assert.equal(contract.candidate.displayName, "Wooden Shield");
  assert.equal(contract.candidate.itemType, "shield");
  assert.equal(contract.candidate.targetSlot, "offhand");
  assert.equal(contract.candidate.quantity, 1);
  assert.equal(contract.candidate.expectedUnitPrice, 4800);
  assert.equal(contract.candidate.expectedVendorId, "basics");
  assert.equal(contract.candidate.expectedVendorName, "Gabriel");
  assert.equal(contract.candidate.merchantOffhandKind, "shield");
  assert.equal(contract.candidate.currentOffhandMustBeEmpty, true);
  assert.equal(contract.candidate.currentMainhandMustNotBeDoublehand, true);
  assert.equal(contract.candidate.existingInventoryQuantityMustBe, 0);
  assert.equal(contract.sourceSemantik.actionContractId, "AL-ACTION-BUY-WITH-GOLD");
  assert.equal(contract.sourceSemantik.recoveryContractId, "AL-RECOVERY-BUY-WITH-GOLD");
  assert.equal(contract.sourceSemantik.verifierId, "AL-VERIFIER-BUY-WITH-GOLD");
  assert.equal(contract.sourceSemantik.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
});

test("PR20.7 acquisition preflight is immutable candidate discovery, never purchase authority", () => {
  assert.equal(plan.testId, "pr20-7-gear-weapon-offhand-acquisition-read-only-preflight");
  assert.equal(plan.controllerVersion, "1.0.1");
  assert.equal(plan.status, "CORRECTIVE_MANIFEST_CUTOVER_BEREIT_FUER_REALEN_NO_WRITE_PREFLIGHT");
  assert.equal(plan.deployment.coordinatorClass, "merchant");
  assert.match(plan.deployment.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(plan.deployment.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.equal(plan.deployment.manifestCutoverPrepared, true);
  assert.equal(plan.deployment.mode, "GITHUB_MANIFEST_AUTO_DEPLOY");
  assert.equal(plan.deployment.packagePath, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js");
  assert.equal(plan.deployment.sourceCommit, "bfcbc3186b1fe374fe37d0dd43d5677511480f5d");
  assert.equal(plan.deployment.packageSha256, "0d1378a0bca4ff0665dc14ab67920a15a0532f20ab141c6428edac414c0c3c72");
  assert.equal(plan.deployment.supersedesControllerVersion, "1.0.0");
  assert.equal(plan.deployment.previousLiveRunRatified, false);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousControllerVersion, "1.0.0");
  assert.equal(plan.deployment.sameTestUpgradeGuard.nextControllerVersion, "1.0.1");
  assert.equal(plan.deployment.sameTestUpgradeGuard.strictlyNewer, true);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousTerminal, true);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousGameplayWrites, 0);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousRawWriteCalls, 0);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousSameIntentRetry, false);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousDurableIntentCreated, false);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousOpenIntentCount, 0);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousRunRatified, false);
  assert.equal(plan.exactCandidate.itemName, "wshield");
  assert.equal(plan.exactCandidate.targetSlot, "offhand");
  assert.equal(plan.exactCandidate.expectedUnitPrice, 4800);
  assert.equal(plan.exactCandidate.vendorId, "basics");
  assert.equal(plan.budgetBoundary.baseAffordabilityObservationOnly, true);
  assert.equal(plan.budgetBoundary.GoldBudgetLedgerReservationRequiredBeforePurchase, true);
  assert.equal(plan.budgetBoundary.GoldBudgetLedgerReservationSatisfiedByThisTest, false);
  assert.equal(plan.budgetBoundary.safetyReserveMustBePreserved, true);

  for (const [key, expected] of Object.entries({
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    purchaseAuthority: false,
    weaponOffhandWriteRatification: false,
    farmerGearAllocationRatification: false,
    durableIntentCreated: false,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
  })) assert.equal(plan.safetyBoundary[key], expected, key);

  assert.equal(contract.preflight.controllerVersion, "1.0.1");
  assert.equal(contract.preflight.package, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js");
  assert.equal(contract.preflight.publicFunctionAvailabilityRequired, true);
  assert.equal(contract.preflight.sellDistanceObservationRequired, true);
  assert.equal(contract.preflight.vendorReachabilityRequired, true);
  assert.equal(contract.preflight.previousControllerVersionRejected, "1.0.0");
  assert.equal(contract.preflight.previousLiveRunRatified, false);
  assert.equal(contract.preflight.manifestCutoverPrepared, true);
  assert.equal(contract.preflight.sameTestUpgradeStrictlyNewer, true);
  assert.equal(contract.preflight.previousTerminalZeroWriteEligible, true);
  assert.equal(contract.nextAction, "PR20_7_WEAPON_OFFHAND_ACQUISITION_REAL_READ_ONLY_PREFLIGHT_V1_0_1");
  assert.equal(contract.preflight.purchaseAuthority, false);
  assert.equal(contract.preflight.goldBudgetLedgerReservationRequired, true);
  assert.equal(contract.preflight.goldBudgetLedgerReservationSatisfied, false);
  assert.equal(contract.mutationBoundary.purchaseAllowed, false);
  assert.equal(contract.mutationBoundary.equipAllowed, false);
  assert.equal(contract.mutationBoundary.movementAllowed, false);
  assert.equal(contract.mutationBoundary.bankRetrieveAllowed, false);
  assert.equal(contract.mutationBoundary.oldPr20_3HarnessReuseAllowed, false);
  assert.equal(contract.mutationBoundary.sameIntentRetry, false);
});

test("PR20.7 acquisition evidence stays open until real browser preflight", () => {
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.testId, plan.testId);
  assert.equal(evidence.controllerVersion, plan.controllerVersion);
  assert.equal(evidence.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(evidence.packageSha256, plan.deployment.packageSha256);
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.equal(evidence.packagePath, plan.deployment.packagePath);
  assert.equal(evidence.rejectedPreviousRun.controllerVersion, "1.0.0");
  assert.equal(evidence.rejectedPreviousRun.reportedStatus, "BESTANDEN");
  assert.equal(evidence.rejectedPreviousRun.ratified, false);
  assert.equal(evidence.rejectedPreviousRun.observedPublicFunctionAvailable, true);
  assert.equal(evidence.rejectedPreviousRun.observedVendorReachableNow, false);
  assert.equal(evidence.rejectedPreviousRun.observedSellDistance, null);
  assert.equal(evidence.rejectedPreviousRun.gameplayWrites, 0);
  assert.equal(evidence.rejectedPreviousRun.rawWriteCalls, 0);
  assert.equal(evidence.rejectedPreviousRun.sameIntentRetry, false);
  assert.deepEqual(
    evidence.blocker,
    ["REAL_WSHIELD_ACQUISITION_READ_ONLY_PREFLIGHT_V1_0_1_NOCH_NICHT_AUSGEFUEHRT"],
  );
});

test("PR20.7 acquisition source is zero-write and does not reuse mutating harnesses", () => {
  for (const forbidden of [
    "buy_with_gold(",
    "buy(",
    "equip(",
    "unequip(",
    "sell(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
    "/disconnect ",
  ]) assert.equal(source.includes(forbidden), false, forbidden);

  assert.ok(source.includes("ITEM_NAME = 'wshield'"));
  assert.ok(source.includes("TARGET_SLOT = 'offhand'"));
  assert.ok(source.includes("EXPECTED_UNIT_PRICE = 4800"));
  assert.ok(source.includes("VENDOR_ID = 'basics'"));
  assert.ok(source.includes("purchaseAuthority: false"));
  assert.ok(source.includes("goldBudgetLedgerReservationRequired: true"));
  assert.ok(source.includes("goldBudgetLedgerReservationSatisfied: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
