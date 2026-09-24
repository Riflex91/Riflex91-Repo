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
  "werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-2-autonomous.js",
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
  assert.equal(contract.sourceSemantik.officialServerRepository, "kaansoral/adventureland_mongodb");
  assert.equal(contract.sourceSemantik.officialServerRevalidatedCommit, "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(contract.sourceSemantik.officialServerBlobSha, "40d0aeda16b9a4320441e833020fe1b4db496e2c");
  assert.equal(contract.sourceSemantik.sourcePinnedSellDistance, 400);
  assert.equal(contract.sourceSemantik.buyReachabilityCheck, "simple_distance(player, l) < B.sell_dist");
});

test("PR20.7 acquisition preflight is immutable candidate discovery, never purchase authority", () => {
  assert.equal(plan.testId, "pr20-7-gear-weapon-offhand-acquisition-read-only-preflight");
  assert.equal(plan.controllerVersion, "1.0.2");
  assert.equal(plan.status, "CORRECTIVE_PACKAGE_1_0_2_SOURCE_PIN_BEREIT_MANIFEST_CUTOVER_OFFEN");
  assert.equal(plan.deployment.coordinatorClass, "merchant");
  assert.match(plan.deployment.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(plan.deployment.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.equal(plan.deployment.manifestCutoverPrepared, false);
  assert.equal(plan.deployment.mode, "GITHUB_MANIFEST_AUTO_DEPLOY_AFTER_CORRECTIVE_CUTOVER");
  assert.equal(plan.deployment.packagePath, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-2-autonomous.js");
  assert.equal(plan.deployment.sourceCommit, "0228da63fe01e8717ef7aebb85af24bb3b35478b");
  assert.equal(plan.deployment.packageSha256, "1931312bfe6b15a2dd0764e774c52c84e6db09c376ee3fd33205b20cc5c9938c");
  assert.equal(plan.deployment.supersedesControllerVersion, "1.0.1");
  assert.equal(plan.deployment.previousLiveRunRatified, false);
  assert.equal(plan.deployment.sameTestUpgradeGuard.previousControllerVersion, "1.0.1");
  assert.equal(plan.deployment.sameTestUpgradeGuard.nextControllerVersion, "1.0.2");
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
  assert.equal(plan.officialServerReachabilitySource.commit, "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(plan.officialServerReachabilitySource.serverBlobSha, "40d0aeda16b9a4320441e833020fe1b4db496e2c");
  assert.equal(plan.officialServerReachabilitySource.sellDistance, 400);
  assert.equal(plan.officialServerReachabilitySource.expectedRuntimeServer, "EU:I");
  assert.equal(plan.officialServerReachabilitySource.browserSellDistancePolicy, "IF_PRESENT_MUST_EQUAL_SOURCE_PIN_ELSE_USE_SOURCE_PIN");
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

  assert.equal(contract.preflight.controllerVersion, "1.0.2");
  assert.equal(contract.preflight.package, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-2-autonomous.js");
  assert.equal(contract.preflight.publicFunctionAvailabilityRequired, true);
  assert.equal(contract.preflight.sellDistanceObservationRequired, false);
  assert.equal(contract.preflight.sourcePinnedSellDistanceAllowed, true);
  assert.equal(contract.preflight.sourcePinnedSellDistance, 400);
  assert.equal(contract.preflight.browserSellDistanceIfPresentMustMatchSourcePin, true);
  assert.equal(contract.preflight.officialServerSourceRevalidated, true);
  assert.equal(contract.preflight.officialServerSourceCommit, "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(contract.preflight.officialServerBlobSha, "40d0aeda16b9a4320441e833020fe1b4db496e2c");
  assert.equal(contract.preflight.expectedServerRegion, "EU");
  assert.equal(contract.preflight.expectedServerIdentifier, "I");
  assert.equal(contract.preflight.vendorReachabilityRequired, true);
  assert.equal(contract.preflight.previousControllerVersionRejected, "1.0.1");
  assert.equal(contract.preflight.previousLiveRunRatified, false);
  assert.equal(contract.preflight.manifestCutoverPrepared, false);
  assert.equal(contract.preflight.sameTestUpgradeStrictlyNewer, true);
  assert.equal(contract.preflight.previousTerminalZeroWriteEligible, true);
  assert.equal(contract.nextAction, "PR20_7_WEAPON_OFFHAND_ACQUISITION_CORRECTIVE_MANIFEST_CUTOVER_1_0_2");
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
  assert.equal(evidence.blockedPreviousRunV1_0_1.controllerVersion, "1.0.1");
  assert.equal(evidence.blockedPreviousRunV1_0_1.status, "BLOCKIERT");
  assert.equal(evidence.blockedPreviousRunV1_0_1.terminal, true);
  assert.deepEqual(evidence.blockedPreviousRunV1_0_1.blocker, ["PR20_7_ACQUISITION_SELL_DIST_FEHLT"]);
  assert.equal(evidence.blockedPreviousRunV1_0_1.ratified, false);
  assert.equal(evidence.blockedPreviousRunV1_0_1.gameplayWrites, 0);
  assert.equal(evidence.blockedPreviousRunV1_0_1.publicFunctionCalls, 0);
  assert.equal(evidence.blockedPreviousRunV1_0_1.rawWriteCalls, 0);
  assert.equal(evidence.blockedPreviousRunV1_0_1.sameIntentRetry, false);
  assert.equal(evidence.officialServerReachabilitySource.sellDistance, 400);
  assert.equal(evidence.officialServerReachabilitySource.commit, "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.deepEqual(
    evidence.blocker,
    ["REAL_WSHIELD_ACQUISITION_READ_ONLY_PREFLIGHT_V1_0_2_NOCH_NICHT_AUSGEFUEHRT"],
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
  assert.ok(source.includes("SOURCE_PINNED_SELL_DISTANCE = 400"));
  assert.ok(source.includes("OFFICIAL_SERVER_SOURCE_COMMIT = '90052162eb3ebda36c893e1eb4af643913c8f984'"));
  assert.ok(source.includes("OFFICIAL_SERVER_BLOB_SHA = '40d0aeda16b9a4320441e833020fe1b4db496e2c'"));
  assert.ok(source.includes("PR20_7_ACQUISITION_SELL_DIST_DRIFT"));
  assert.ok(source.includes("PR20_7_ACQUISITION_SERVER_BINDUNG_DRIFT"));
  assert.ok(source.includes("purchaseAuthority: false"));
  assert.ok(source.includes("goldBudgetLedgerReservationRequired: true"));
  assert.ok(source.includes("goldBudgetLedgerReservationSatisfied: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
