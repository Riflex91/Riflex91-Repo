import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-7-weapon-offhand-acquisition-preparation.json",
  "utf8",
));
const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-acquisition-shadow-no-write-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-acquisition-shadow-no-write-evidence.json",
  "utf8",
));
const foundation = fs.readFileSync(
  "grundlage/quelle/equipment/pr20-7-weapon-offhand-acquisition-shadow.ts",
  "utf8",
);
const runner = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-autonomous.js",
  "utf8",
);

test("PR20.7 acquisition shadow package is exact, immutable and merchant-only", () => {
  assert.equal(contract.status, "DURABLE_SHADOW_MANIFEST_CUTOVER_BEREIT_EVIDENCE_OFFEN");
  assert.equal(contract.blockingGate, "PR20.7_GEAR");
  assert.equal(contract.nextAction, "PR20_7_WEAPON_OFFHAND_ACQUISITION_DURABLE_SHADOW_NO_WRITE_EXECUTE");

  const shadow = contract.shadowPreparation;
  assert.equal(shadow.foundation, "v5/grundlage/quelle/equipment/pr20-7-weapon-offhand-acquisition-shadow.ts");
  assert.equal(shadow.package, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-autonomous.js");
  assert.equal(shadow.testId, "pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write");
  assert.equal(shadow.controllerVersion, "1.0.0");
  assert.equal(shadow.expectedGlobal, "V5PR207WeaponOffhandAcquisitionShadow");
  assert.equal(shadow.sourceCommit, "3f006c17934f0159fa575d2da0e4d048fbf0df09");
  assert.equal(shadow.packageSha256, "72554c3c90f4e8b09f26a679258ced7f8eb511f2a5eff16cbd084d8830933b08");
  assert.equal(shadow.manifestCutoverPrepared, false);

  assert.equal(plan.testId, shadow.testId);
  assert.equal(plan.controllerVersion, shadow.controllerVersion);
  assert.equal(plan.status, "PACKAGE_BEREIT_MANIFEST_CUTOVER_OFFEN");
  assert.equal(plan.deployment.sourceCommit, shadow.sourceCommit);
  assert.equal(plan.deployment.packagePath, shadow.package);
  assert.equal(plan.deployment.packageSha256, shadow.packageSha256);
  assert.equal(plan.deployment.expectedGlobal, shadow.expectedGlobal);
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.equal(plan.deployment.manifestCutoverPrepared, false);
});

test("PR20.7 acquisition shadow requires the ratified read-only v1.0.2 source evidence", () => {
  assert.equal(plan.prerequisites.readOnlyEvidenceStatus, "BESTANDEN_REAL_BROWSER_SOURCE_PINNED_NO_WRITE");
  assert.equal(plan.prerequisites.readOnlyEvidenceRatified, true);
  assert.equal(plan.prerequisites.exactRecipient, "My_Merchant");
  assert.equal(plan.prerequisites.exactServer, "EU:I");
  assert.equal(plan.prerequisites.exactItem, "wshield");
  assert.equal(plan.prerequisites.exactQuantity, 1);
  assert.equal(plan.prerequisites.exactCost, 4800);
  assert.equal(plan.prerequisites.vendorReachabilityRatified, true);
  assert.equal(plan.prerequisites.buyWithGoldAvailableRatified, true);

  assert.equal(evidence.prerequisiteEvidence.readOnlyStatus, "BESTANDEN_REAL_BROWSER_SOURCE_PINNED_NO_WRITE");
  assert.equal(evidence.prerequisiteEvidence.readOnlyObservedAtMs, 1790238192422);
  assert.equal(evidence.prerequisiteEvidence.readOnlyManifestMainCommit, "5a45b09c1ce7e439d80ada368980fc288fd76d35");
});

test("PR20.7 acquisition shadow binds exact gold budget, resource fencing and one-shot no-send semantics", () => {
  const shadow = contract.shadowPreparation;
  assert.equal(shadow.exactCost, 4800);
  assert.equal(shadow.minimumGoldSafetyReserve, 1000);
  assert.equal(shadow.stricterRuntimeReserveAllowed, true);
  assert.equal(shadow.goldBudgetLedgerReservationRequired, true);
  assert.equal(shadow.goldBudgetLedgerReservationSatisfiedByFoundation, true);
  assert.equal(shadow.inventoryFencePrepared, true);
  assert.equal(shadow.goldFencePrepared, true);
  assert.equal(shadow.buyActionChannelFencePrepared, true);
  assert.equal(shadow.socketBudgetReservationPrepared, true);
  assert.equal(shadow.socketPlanBudgetReserved, 100);
  assert.equal(shadow.socketServerReserveUntouched, 100);
  assert.equal(shadow.durableIntentRequired, true);
  assert.equal(shadow.durableReadbackRequired, true);
  assert.equal(shadow.journalTerminalArt, "ABBRUCH");
  assert.equal(shadow.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(shadow.expectedReconciliation, "NOT_APPLIED");
  assert.equal(shadow.oneShotBindingPrepared, true);
  assert.equal(shadow.oneShotMaximumUses, 1);
  assert.equal(shadow.oneShotPurchaseAuthorityIssued, false);
  assert.equal(shadow.oldPr20_3HarnessReuseAllowed, false);

  assert.equal(plan.safetyModel.actionContractId, "AL-ACTION-BUY-WITH-GOLD");
  assert.equal(plan.safetyModel.recoveryContractId, "AL-RECOVERY-BUY-WITH-GOLD");
  assert.equal(plan.safetyModel.verifierId, "AL-VERIFIER-BUY-WITH-GOLD");
  assert.equal(plan.safetyModel.actionChannel, "buy");
  assert.equal(plan.safetyModel.exactGoldReservation, 4800);
  assert.equal(plan.safetyModel.minimumGoldSafetyReserve, 1000);
  assert.equal(plan.safetyModel.goldSafetyReserveSource, "PR20.4 ratified MIN_GOLD_RESERVE floor");
  assert.equal(plan.safetyModel.stricterRuntimeReserveAllowed, true);
  assert.equal(plan.safetyModel.inventoryFence, "character:My_Merchant:inventory");
  assert.equal(plan.safetyModel.goldFence, "character:My_Merchant:gold");
  assert.equal(plan.safetyModel.buyChannelFence, "character:My_Merchant:action_channel:buy");
  assert.equal(plan.safetyModel.socketBudgetResource, "character:My_Merchant:socket_call_budget");
  assert.equal(plan.safetyModel.socketPlanBudgetReserved, 100);
  assert.equal(plan.safetyModel.socketServerLimit, 200);
  assert.equal(plan.safetyModel.socketServerReserveUntouched, 100);
  assert.equal(plan.safetyModel.oneShotMaximumUses, 1);
  assert.equal(plan.safetyModel.oneShotPurchaseAuthorityIssued, false);
  assert.equal(plan.safetyModel.durableIntentReadback, true);
  assert.equal(plan.safetyModel.journalTerminalArt, "ABBRUCH");
  assert.equal(plan.safetyModel.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(plan.safetyModel.expectedReconciliation, "NOT_APPLIED");
  assert.equal(plan.safetyModel.sameIntentRetry, false);
});

test("PR20.7 acquisition shadow evidence remains pending and authority remains closed", () => {
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.testId, plan.testId);
  assert.equal(evidence.controllerVersion, plan.controllerVersion);
  assert.equal(evidence.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(evidence.packagePath, plan.deployment.packagePath);
  assert.equal(evidence.packageSha256, plan.deployment.packageSha256);
  assert.equal(evidence.manifestMainCommit, null);
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.deepEqual(evidence.blocker, [
    "REAL_WSHIELD_ACQUISITION_DURABLE_SHADOW_NO_WRITE_NOCH_NICHT_AUSGEFUEHRT",
  ]);
  assert.equal(evidence.expectedSafetyBoundary.gameplayWrites, 0);
  assert.equal(evidence.expectedSafetyBoundary.publicFunctionCalls, 0);
  assert.equal(evidence.expectedSafetyBoundary.rawWriteCalls, 0);
  assert.equal(evidence.expectedSafetyBoundary.authorityIssued, false);
  assert.equal(evidence.expectedSafetyBoundary.purchaseAuthority, false);
  assert.equal(evidence.expectedSafetyBoundary.durableIntentCreatedShadowOnly, true);
  assert.equal(evidence.expectedSafetyBoundary.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(evidence.expectedSafetyBoundary.journalTerminalArt, "ABBRUCH");
  assert.equal(evidence.expectedSafetyBoundary.sameIntentRetry, false);
  assert.equal(evidence.expectedSafetyBoundary.normalRuntimeAllowed, false);

  for (const [key, expected] of Object.entries({
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    authorityIssued: false,
    purchaseAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  })) assert.equal(plan.safetyBoundary[key], expected, key);
});

test("PR20.7 acquisition shadow contains no mutation adapter and never reuses PR20.3 live harness", () => {
  for (const source of [foundation, runner]) {
    for (const forbidden of [
      "buy_with_gold(",
      "buy(",
      "equip(",
      "unequip(",
      "sell(",
      "send_item(",
      "send_gold(",
      "start_character(",
      "command_character(",
      "use_skill(",
      "api_call(",
      "socket.emit(",
      ".socket.emit(",
    ]) assert.equal(source.includes(forbidden), false, forbidden);

    assert.equal(source.includes("pr20-3-market-buy-gold-step-test"), false);
    assert.equal(source.includes("PR20_3"), false);
  }

  assert.ok(foundation.includes("GoldBudgetLedger"));
  assert.ok(foundation.includes("PersistVorMutationTor"));
  assert.ok(foundation.includes("MutationsKanalKoordination"));
  assert.ok(foundation.includes("NICHT_GESENDET"));
  assert.ok(runner.includes("ACQUISITION_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE"));
  assert.ok(runner.includes("purchaseAuthorityIssued: false"));
  assert.ok(runner.includes("serverReserveUntouched: 100"));
});
