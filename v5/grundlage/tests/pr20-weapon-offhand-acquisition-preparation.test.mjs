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

const livePlan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-acquisition-live-5m-test-plan.json",
  "utf8",
));
const liveEvidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-acquisition-live-5m-evidence.json",
  "utf8",
));
const liveSource = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-acquisition-live-5m.js",
  "utf8",
);

test("PR20.7 acquisition candidate is exact wshield Merchant offhand source", () => {
  assert.equal(contract.blockingGate, "PR20.7_GEAR");
  assert.equal(contract.status, "PRODUCTIVE_PURCHASE_BESTANDEN_EQUIP_PREPARATION_BEREIT");
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
  assert.equal(plan.status, "BESTANDEN_REAL_BROWSER_SOURCE_PINNED_NO_WRITE");
  assert.equal(plan.deployment.coordinatorClass, "merchant");
  assert.match(plan.deployment.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(plan.deployment.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.equal(plan.deployment.manifestCutoverPrepared, true);
  assert.equal(plan.deployment.mode, "GITHUB_MANIFEST_AUTO_DEPLOY");
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
  assert.equal(plan.realEvidence.ratified, true);
  assert.equal(plan.realEvidence.result, "BESTANDEN");
  assert.equal(plan.realEvidence.observedAtMs, 1790238192422);
  assert.equal(plan.realEvidence.gameplayWrites, 0);
  assert.equal(plan.realEvidence.publicFunctionCalls, 0);
  assert.equal(plan.realEvidence.rawWriteCalls, 0);
  assert.equal(plan.realEvidence.purchaseAuthority, false);

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
  assert.equal(contract.preflight.manifestCutoverPrepared, true);
  assert.equal(contract.preflight.sameTestUpgradeStrictlyNewer, true);
  assert.equal(contract.preflight.previousTerminalZeroWriteEligible, true);
  assert.equal(contract.preflight.realEvidenceStatus, "BESTANDEN_REAL_BROWSER_SOURCE_PINNED_NO_WRITE");
  assert.equal(contract.preflight.realEvidenceRatified, true);
  assert.equal(contract.preflight.realEvidenceObservedAtMs, 1790238192422);
  assert.equal(contract.preflight.realEvidenceManifestMainCommit, "5a45b09c1ce7e439d80ada368980fc288fd76d35");
  assert.equal(contract.preflight.realObservedVendorDistance, 88.59875647515783);
  assert.equal(contract.preflight.realObservedSellDistance, 400);
  assert.equal(contract.preflight.realObservedSellDistanceSource, "OFFICIAL_SERVER_SOURCE_PIN");
  assert.equal(contract.preflight.realObservedGold, 14493644);
  assert.equal(contract.preflight.realObservedFreeInventorySlots, 21);
  assert.equal(contract.nextAction, "PR20_7_WEAPON_OFFHAND_PRODUCTIVE_EQUIP_PREPARATION");
  assert.equal(contract.preflight.purchaseAuthority, false);
  assert.equal(contract.preflight.goldBudgetLedgerReservationRequired, true);
  assert.equal(contract.preflight.goldBudgetLedgerReservationSatisfied, false);
  assert.equal(contract.mutationBoundary.purchaseAllowed, false);
  assert.equal(contract.mutationBoundary.equipAllowed, false);
  assert.equal(contract.mutationBoundary.movementAllowed, false);
  assert.equal(contract.mutationBoundary.bankRetrieveAllowed, false);
  assert.equal(contract.mutationBoundary.oldPr20_3HarnessReuseAllowed, false);
  assert.equal(contract.mutationBoundary.sameIntentRetry, false);
  assert.equal(contract.shadowPreparation.foundation, "v5/grundlage/quelle/equipment/pr20-7-weapon-offhand-acquisition-shadow.ts");
  assert.equal(contract.shadowPreparation.package, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-v1-0-1-autonomous.js");
  assert.equal(contract.shadowPreparation.testId, "pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write");
  assert.equal(contract.shadowPreparation.controllerVersion, "1.0.1");
  assert.equal(contract.shadowPreparation.expectedGlobal, "V5PR207WeaponOffhandAcquisitionShadow");
  assert.equal(contract.shadowPreparation.sourceCommit, "0b92ce4002438ef4282622699019b5148da58184");
  assert.equal(contract.shadowPreparation.packageSha256, "11c666638c111a3acd04e550bf33b52eb7611f53a0f8f02547b4b199df73793d");
  assert.equal(contract.shadowPreparation.manifestCutoverPrepared, true);
  assert.equal(contract.shadowPreparation.exactCost, 4800);
  assert.equal(contract.shadowPreparation.minimumGoldSafetyReserve, 1000);
  assert.equal(contract.shadowPreparation.goldBudgetLedgerReservationSatisfiedByFoundation, true);
  assert.equal(contract.shadowPreparation.inventoryFencePrepared, true);
  assert.equal(contract.shadowPreparation.goldFencePrepared, true);
  assert.equal(contract.shadowPreparation.buyActionChannelFencePrepared, true);
  assert.equal(contract.shadowPreparation.socketBudgetReservationPrepared, true);
  assert.equal(contract.shadowPreparation.socketPlanBudgetReserved, 100);
  assert.equal(contract.shadowPreparation.socketServerReserveUntouched, 100);
  assert.equal(contract.shadowPreparation.durableReadbackRequired, true);
  assert.equal(contract.shadowPreparation.journalTerminalArt, "ABBRUCH");
  assert.equal(contract.shadowPreparation.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(contract.shadowPreparation.expectedReconciliation, "NOT_APPLIED");
  assert.equal(contract.shadowPreparation.oneShotMaximumUses, 1);
  assert.equal(contract.shadowPreparation.oneShotPurchaseAuthorityIssued, false);
  assert.equal(contract.shadowPreparation.oldPr20_3HarnessReuseAllowed, false);
  assert.equal(contract.shadowPreparation.purchaseAuthority, false);
  assert.equal(contract.shadowPreparation.gameplayWrites, 0);
  assert.equal(contract.shadowPreparation.publicFunctionCalls, 0);
  assert.equal(contract.shadowPreparation.rawWriteCalls, 0);
  assert.equal(contract.shadowPreparation.sameIntentRetry, false);
  assert.equal(contract.shadowPreparation.normalRuntimeAllowed, false);
  assert.equal(contract.shadowPreparation.evidenceStatus, "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE");
  assert.equal(contract.shadowPreparation.realEvidenceRatified, true);
  assert.equal(contract.shadowPreparation.realEvidenceObservedAtMs, 1790243742400);
  assert.equal(contract.shadowPreparation.realEvidenceResult, "BESTANDEN");
  assert.equal(contract.shadowPreparation.realEvidenceBridgeState, "DEPLOYED");
  assert.equal(contract.shadowPreparation.realEvidenceGameplayWrites, 0);
  assert.equal(contract.shadowPreparation.realEvidencePublicFunctionCalls, 0);
  assert.equal(contract.shadowPreparation.realEvidenceRawWriteCalls, 0);
  assert.equal(contract.shadowPreparation.realEvidencePurchaseAuthority, false);
  assert.equal(contract.shadowPreparation.realEvidenceDurableReadback, true);
  assert.equal(contract.shadowPreparation.realEvidenceGoldBudgetReservationSatisfied, true);
  assert.equal(contract.shadowPreparation.realEvidenceVendorReachableNow, true);
  assert.equal(contract.shadowPreparation.productivePurchasePreparationAuthorized, false);
  assert.equal(contract.purchasePreparation.prepared, true);
  assert.equal(contract.purchasePreparation.noWrite, true);
  assert.equal(contract.purchasePreparation.exactRecipient, "My_Merchant");
  assert.equal(contract.purchasePreparation.exactServer, "EU:I");
  assert.equal(contract.purchasePreparation.exactItem, "wshield");
  assert.equal(contract.purchasePreparation.exactTargetSlot, "offhand");
  assert.equal(contract.purchasePreparation.exactQuantity, 1);
  assert.equal(contract.purchasePreparation.exactCost, 4800);
  assert.equal(contract.purchasePreparation.minimumGoldSafetyReserve, 1000);
  assert.equal(contract.purchasePreparation.goldBudgetReservationAmount, 4800);
  assert.equal(contract.purchasePreparation.actionContractId, "AL-ACTION-BUY-WITH-GOLD");
  assert.equal(contract.purchasePreparation.recoveryContractId, "AL-RECOVERY-BUY-WITH-GOLD");
  assert.equal(contract.purchasePreparation.verifierId, "AL-VERIFIER-BUY-WITH-GOLD");
  assert.equal(contract.purchasePreparation.actionChannel, "buy");
  assert.equal(contract.purchasePreparation.socketPlanBudgetReserved, 100);
  assert.equal(contract.purchasePreparation.socketServerReserveUntouched, 100);
  assert.equal(contract.purchasePreparation.oneShotMaximumUses, 1);
  assert.equal(contract.purchasePreparation.oneShotMaximumTtlMs, 1500);
  assert.equal(contract.purchasePreparation.exactSettlementGoldDelta, -4800);
  assert.equal(contract.purchasePreparation.exactSettlementItemDelta, 1);
  assert.equal(contract.purchasePreparation.sameIntentRetry, false);
  assert.equal(contract.purchasePreparation.purchaseAuthorityIssued, false);
  assert.equal(contract.purchasePreparation.productiveAdapterPresent, false);
  assert.equal(contract.purchasePreparation.liveWriteRunnerPresent, false);
  assert.equal(contract.purchasePreparation.livePackagePrepared, true);
  assert.equal(contract.purchasePreparation.livePackage,
    "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-live-5m.js");
  assert.equal(contract.purchasePreparation.livePackageTest,
    "v5/werkzeuge/tests/pr20-7-weapon-offhand-acquisition-live-5m.test.mjs");
  assert.equal(contract.purchasePreparation.liveTestId,
    "pr20-7-gear-weapon-offhand-acquisition-live-5m");
  assert.equal(contract.purchasePreparation.liveControllerVersion, "1.0.0");
  assert.equal(contract.purchasePreparation.liveSourceCommit,
    "5efa5e2c92c258e1502ee388e84ba96d4c844027");
  assert.equal(contract.purchasePreparation.livePackageSha256,
    "5cecc5a3ca36c2d75e4a6629c36991417b508e364a965c1a945a790aac8bd930");
  assert.equal(contract.purchasePreparation.liveManifestCutoverPrepared, true);
  assert.equal(contract.purchasePreparation.liveMaximumGameplayWrites, 1);
  assert.equal(contract.purchasePreparation.liveMaximumPublicFunctionCalls, 1);
  assert.equal(contract.purchasePreparation.liveRawWriteCalls, 0);
  assert.equal(contract.purchasePreparation.liveOneShotMaximumUses, 1);
  assert.equal(contract.purchasePreparation.liveRestartReconcileWithoutResend, true);
  assert.equal(contract.purchasePreparation.liveSoakMinimumSamples, 60);
  assert.equal(contract.purchasePreparation.broadPurchaseAuthority, false);
});

test("PR20.7 controlled wshield live package has ratified one-write evidence", () => {
  assert.equal(livePlan.testId,
    "pr20-7-gear-weapon-offhand-acquisition-live-5m");
  assert.equal(livePlan.controllerVersion, "1.0.0");
  assert.equal(livePlan.status, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(livePlan.scope.exactRecipientCharacter, "My_Merchant");
  assert.equal(livePlan.scope.exactServer, "EU:I");
  assert.equal(livePlan.scope.exactItem, "wshield");
  assert.equal(livePlan.scope.targetSlot, "offhand");
  assert.equal(livePlan.scope.exactCost, 4800);
  assert.equal(livePlan.transaction.maximumGameplayWrites, 1);
  assert.equal(livePlan.transaction.maximumPublicFunctionCalls, 1);
  assert.equal(livePlan.transaction.rawWriteCalls, 0);
  assert.equal(livePlan.transaction.exactGoldReservation, 4800);
  assert.equal(livePlan.transaction.minimumGoldSafetyReserve, 1000);
  assert.equal(livePlan.transaction.oneShotMaximumUses, 1);
  assert.equal(livePlan.transaction.sameIntentRetry, false);
  assert.equal(livePlan.transaction.restartReconcileWithoutResend, true);
  assert.equal(livePlan.transaction.expectedGoldDelta, -4800);
  assert.equal(livePlan.transaction.expectedItemQuantityDelta, 1);
  assert.equal(livePlan.soak.minimumSamples, 60);
  assert.equal(livePlan.soak.minimumDurationMs, 299000);
  assert.equal(livePlan.deployment.sourceCommit,
    "5efa5e2c92c258e1502ee388e84ba96d4c844027");
  assert.equal(livePlan.deployment.packageSha256,
    "5cecc5a3ca36c2d75e4a6629c36991417b508e364a965c1a945a790aac8bd930");
  assert.equal(livePlan.deployment.manifestCutoverPrepared, true);
  assert.equal(liveEvidence.status, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(liveEvidence.ratified, true);
  assert.equal(liveEvidence.manifestMainCommit, "8b23419ce8118600f00644ee5e1d678af198c0a5");
  assert.equal(liveEvidence.observedAtMs, 1790247947961);
  assert.equal(liveEvidence.terminal, true);
  assert.deepEqual(liveEvidence.blocker, []);
  assert.equal(liveEvidence.nextGate, "PR20_7_WEAPON_OFFHAND_PRODUCTIVE_EQUIP_PREPARATION");
  assert.equal(liveEvidence.result.status, "BESTANDEN");
  assert.equal(liveEvidence.result.reconciliation, "COMMITTED");
  assert.equal(liveEvidence.result.settlement, "BESTAETIGT");
  assert.equal(liveEvidence.result.prestate.gold, 14493644);
  assert.equal(liveEvidence.result.poststate.gold, 14488844);
  assert.equal(liveEvidence.result.poststate.goldDelta, -4800);
  assert.equal(liveEvidence.result.poststate.itemQuantityDelta, 1);
  assert.equal(liveEvidence.result.oneShotAuthority.issued, true);
  assert.equal(liveEvidence.result.oneShotAuthority.consumed, true);
  assert.equal(liveEvidence.result.durableIntentReadback, true);
  assert.equal(liveEvidence.result.gameplayWrites, 1);
  assert.equal(liveEvidence.result.publicFunctionCalls, 1);
  assert.equal(liveEvidence.result.rawWriteCalls, 0);
  assert.equal(liveEvidence.result.sameIntentRetry, false);
  assert.equal(liveEvidence.result.soak.samples, 60);
  assert.ok(liveEvidence.result.soak.durationMs >= 299000);
  assert.equal(livePlan.realEvidence.ratified, true);
  assert.equal(livePlan.realEvidence.reconciliation, "COMMITTED");
  assert.equal(livePlan.realEvidence.settlement, "BESTAETIGT");
  assert.equal(contract.livePurchase.realEvidenceRatified, true);
  assert.equal(contract.livePurchase.realEvidenceStatus, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(contract.livePurchase.broadPurchaseAuthority, false);
  assert.equal(contract.livePurchase.rawWriteAuthority, false);
  assert.equal((liveSource.match(/r\.buy_with_gold\(/g) || []).length, 1);
  assert.equal(liveSource.includes("socket.emit("), false);
  assert.equal(liveSource.includes(".socket.emit("), false);
  assert.equal(liveSource.includes("api_call("), false);
});

test("PR20.7 acquisition v1.0.2 real browser evidence is ratified zero-write", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_SOURCE_PINNED_NO_WRITE");
  assert.equal(evidence.testId, plan.testId);
  assert.equal(evidence.controllerVersion, plan.controllerVersion);
  assert.equal(evidence.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(evidence.packageSha256, plan.deployment.packageSha256);
  assert.equal(evidence.manifestMainCommit, "5a45b09c1ce7e439d80ada368980fc288fd76d35");
  assert.equal(evidence.observedAtMs, 1790238192422);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.result, "BESTANDEN");
  assert.equal(evidence.ratified, true);
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
  assert.deepEqual(evidence.blocker, []);
  assert.equal(evidence.nextGate, "PR20_7_WEAPON_OFFHAND_ACQUISITION_DURABLE_SHADOW_NO_WRITE");
  assert.equal(evidence.liveEvidence.recipient.characterName, "My_Merchant");
  assert.equal(evidence.liveEvidence.recipient.serverRegion, "EU");
  assert.equal(evidence.liveEvidence.recipient.serverIdentifier, "I");
  assert.equal(evidence.liveEvidence.acquisition.vendorReachableNow, true);
  assert.equal(evidence.liveEvidence.acquisition.nearestVendorDistance, 88.59875647515783);
  assert.equal(evidence.liveEvidence.acquisition.sellDistance, 400);
  assert.equal(evidence.liveEvidence.acquisition.sellDistanceSource, "OFFICIAL_SERVER_SOURCE_PIN");
  assert.equal(evidence.liveEvidence.acquisition.publicFunctionAvailable, true);
  assert.equal(evidence.liveEvidence.acquisition.observedGold, 14493644);
  assert.equal(evidence.liveEvidence.acquisition.freeInventorySlots, 21);
  assert.equal(evidence.liveEvidence.acquisition.purchaseAuthority, false);
  assert.equal(evidence.liveEvidence.gameplayWrites, 0);
  assert.equal(evidence.liveEvidence.publicFunctionCalls, 0);
  assert.equal(evidence.liveEvidence.rawWriteCalls, 0);
  assert.equal(evidence.liveEvidence.durableIntentCreated, false);
  assert.equal(evidence.liveEvidence.sameIntentRetry, false);
  assert.equal(evidence.liveEvidence.normalRuntimeAllowed, false);
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
