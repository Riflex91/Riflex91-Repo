import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  klassifizierePr207GearSwapSettlement,
  pruefePr207GearSwapVorbereitung,
} from "../../erzeugt/index.js";

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Ranger1",
    sessionId: "ranger-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    rosterFingerprint: "roster-fp",
    ...overrides,
  };
}

function item(id, overrides = {}) {
  return {
    name: id,
    level: 1,
    physischeKennung: "physical:" + id,
    beobachtungsFingerprint: "fp:" + id,
    physisch: true,
    gesperrt: false,
    virtuellB: false,
    ...overrides,
  };
}

function evidence(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: "gear-swap-evidence-1",
    recipient: bindung(),
    merchantAccountId: "account-1",
    slot: "helmet",
    kandidatIndex: 12,
    kandidat: item("newhat"),
    vorherigesSlotItem: item("oldhat"),
    kompatibel: true,
    contentVerifiziert: true,
    dispositionErlaubt: true,
    beobachtetAmMs: 1_000,
    gueltigBisMs: 2_000,
    maximalesEvidenceAlterMs: 1_000,
    restInventarFingerprint: "rest-inv",
    restEquipmentFingerprint: "rest-equip",
    evidenceFingerprint: "evidence-fp",
    ...overrides,
  };
}

function settlement(plan, overrides = {}) {
  return {
    schemaVersion: 1,
    recipient: plan.recipient,
    slot: plan.slot,
    kandidatIndex: plan.kandidatIndex,
    slotFingerprint: plan.expectedPostcondition.slotFingerprint,
    indexFingerprint: plan.expectedPostcondition.indexFingerprint,
    restInventarFingerprint: plan.expectedPostcondition.restInventarFingerprint,
    restEquipmentFingerprint: plan.expectedPostcondition.restEquipmentFingerprint,
    beobachtetAmMs: 1_500,
    ...overrides,
  };
}

test("PR20.7 bereitet belegten sicheren Armor-Slot nur als NO-WRITE Swap vor", () => {
  const result = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.deepEqual(result.blocker, []);
  assert.ok(result.plan);
  assert.equal(result.plan.slot, "helmet");
  assert.equal(result.plan.expectedPostcondition.slotFingerprint, "fp:newhat");
  assert.equal(result.plan.expectedPostcondition.indexFingerprint, "fp:oldhat");
  assert.equal(
    result.plan.expectedPostcondition.serverSemantik,
    "ATOMIC_REPLACE_AND_RETURN_PREVIOUS_TO_SOURCE_INDEX",
  );
  assert.equal(result.plan.actionContractId, "AL-ACTION-EQUIP");
  assert.equal(result.plan.recoveryContractId, "AL-RECOVERY-EQUIP");
  assert.equal(result.plan.verifierId, "AL-VERIFIER-EQUIP");
  assert.equal(result.plan.ausfuehrungsAutoritaet, false);
  assert.equal(result.plan.gameplayAutoritaet, false);
  assert.equal(result.plan.rawWriteAutoritaet, false);
  assert.equal(result.plan.swapWriteRatification, false);
});

test("PR20.7 blockiert Waffen, Offhand, leere Slots und virtuelle Altobjekte", () => {
  const cases = [
    [evidence({ slot: "mainhand" }), "SLOT_NICHT_FREIGEGEBEN"],
    [evidence({ slot: "offhand" }), "SLOT_NICHT_FREIGEGEBEN"],
    [evidence({ vorherigesSlotItem: null }), "SLOT_IST_LEER"],
    [
      evidence({
        vorherigesSlotItem: item("oldhat", { physisch: false, virtuellB: true }),
      }),
      "ALTITEM_NICHT_PHYSISCH",
    ],
  ];
  for (const [input, blocker] of cases) {
    const result = pruefePr207GearSwapVorbereitung(input, 1_200);
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.plan, null);
    assert.ok(result.blocker.includes(blocker));
    assert.equal(result.gameplayAutoritaet, false);
  }
});

test("PR20.7 blockiert stale oder unsichere Kandidaten vor jeder Ausfuehrungsplanung", () => {
  const cases = [
    [evidence({ gueltigBisMs: 1_100 }), "EVIDENCE_STALE"],
    [evidence({ kandidat: item("newhat", { gesperrt: true }) }), "KANDIDAT_GESPERRT"],
    [evidence({ vorherigesSlotItem: item("oldhat", { gesperrt: true }) }), "ALTITEM_GESPERRT"],
    [evidence({ vorherigesSlotItem: item("oldhat", { beobachtungsFingerprint: "fp:newhat" }) }), "IDENTITAET_NICHT_EINDEUTIG"],
    [evidence({ kompatibel: false }), "NICHT_KOMPATIBEL"],
    [evidence({ contentVerifiziert: false }), "CONTENT_NICHT_VERIFIZIERT"],
    [evidence({ dispositionErlaubt: false }), "DISPOSITION_GESPERRT"],
    [
      evidence({ recipient: bindung({ accountId: "other-account" }) }),
      "ACCOUNT_DRIFT",
    ],
  ];
  for (const [input, blocker] of cases) {
    const result = pruefePr207GearSwapVorbereitung(input, 1_200);
    assert.equal(result.status, "BLOCKIERT");
    assert.ok(result.blocker.includes(blocker));
    assert.equal(result.ausfuehrungsAutoritaet, false);
  }
});

test("PR20.7 Settlement bestaetigt nur den exakten Zwei-Ort-Swap", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan),
  );
  assert.equal(result.klassifikation, "BESTAETIGT");
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.neuerIntentAutomatischErlaubt, false);
  assert.deepEqual(result.gruende, []);
});

test("PR20.7 Settlement erkennt unveraenderten Prestate als NICHT_AUSGEFUEHRT", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan, {
      slotFingerprint: prep.plan.prestate.slotFingerprint,
      indexFingerprint: prep.plan.prestate.indexFingerprint,
    }),
  );
  assert.equal(result.klassifikation, "NICHT_AUSGEFUEHRT");
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.neuerIntentAutomatischErlaubt, false);
});

test("PR20.7 Settlement klassifiziert einseitigen Swap nur als TEILWEISE", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan, {
      indexFingerprint: prep.plan.prestate.indexFingerprint,
    }),
  );
  assert.equal(result.klassifikation, "TEILWEISE");
  assert.ok(result.gruende.includes("NUR_TEILMENGE_DER_SWAP_POSTCONDITION"));
  assert.equal(result.sameIntentRetry, false);
});

test("PR20.7 Settlement bleibt bei Recipient- oder Restzustandsdrift UNGEKLAERT", () => {
  const prep = pruefePr207GearSwapVorbereitung(evidence(), 1_200);
  assert.ok(prep.plan);
  const result = klassifizierePr207GearSwapSettlement(
    prep.plan,
    settlement(prep.plan, {
      recipient: bindung({ sessionId: "other-session" }),
      restInventarFingerprint: "drifted-rest",
    }),
  );
  assert.equal(result.klassifikation, "UNGEKLAERT");
  assert.ok(result.gruende.includes("RECIPIENT_BINDUNG_DRIFT"));
  assert.ok(result.gruende.includes("REST_INVENTAR_DRIFT"));
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.neuerIntentAutomatischErlaubt, false);
});

test("PR20.7 Foundation enthaelt keinerlei Gameplay- oder Raw-Write-Pfad", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-gear-swap-vorbereitung.ts",
    "utf8",
  );
  for (const forbidden of [
    "root.equip(",
    ".equip(",
    "unequip(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "use_skill(",
    "send_item(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("gameplayAutoritaet: false"));
  assert.ok(source.includes("rawWriteAutoritaet: false"));
  assert.ok(source.includes("swapWriteRatification: false"));
});


test("PR20.7 maschinenlesbarer Vertrag bleibt NO-WRITE und trennt Waffen/Offhand", () => {
  const contract = JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr20-7-gear-production-preparation.json",
    "utf8",
  ));
  assert.equal(contract.status, "WEAPON_OFFHAND_ACQUISITION_CORRECTIVE_MANIFEST_CUTOVER_BEREIT_EVIDENCE_OFFEN");
  assert.equal(contract.basis.actionContractId, "AL-ACTION-EQUIP");
  assert.equal(contract.basis.recoveryContractId, "AL-RECOVERY-EQUIP");
  assert.equal(contract.basis.verifierId, "AL-VERIFIER-EQUIP");
  assert.equal(
    contract.serverSemantik.settlement,
    "ATOMIC_REPLACE_AND_RETURN_PREVIOUS_TO_SOURCE_INDEX",
  );
  assert.equal(contract.serverSemantik.virtualExistingB, "BLOCKED_FOR_PR20_7");
  assert.equal(contract.scope.mainhand, "FOUNDATION_NO_WRITE_SEPARATE_RATIFICATION");
  assert.equal(contract.scope.offhand, "FOUNDATION_NO_WRITE_SEPARATE_RATIFICATION");
  assert.equal(contract.authority.produktiveRegistrierungErlaubt, false);
  assert.equal(contract.authority.produktiverAktivierungspfadErlaubt, false);
  assert.equal(contract.authority.ausfuehrungsAutoritaet, false);
  assert.equal(contract.authority.gameplayAutoritaet, false);
  assert.equal(contract.authority.rawWriteAutoritaet, false);
  assert.equal(contract.authority.swapWriteRatification, false);
  assert.equal(contract.settlement.sameIntentRetry, false);
  assert.equal(contract.settlement.newIntentAutomaticallyAllowed, false);
  assert.equal(contract.preflight.implemented, true);
  assert.equal(contract.preflight.readOnly, true);
  assert.equal(contract.preflight.performanceTrickRequiredAndVerified, true);
  assert.equal(contract.preflight.authorityAusstellung, false);
  assert.equal(contract.preflight.browserGameplayWrites, 0);
  assert.equal(contract.preflight.workerPackageConfigured, false);
  assert.equal(contract.preflight.farmerWorkerDistribution, false);
  assert.equal(contract.preflight.startCalls, 0);
  assert.equal(contract.preflight.disconnectCalls, 0);
  assert.equal(contract.preflight.farmerWorkersInstalled, 0);
  assert.equal(contract.preflight.realEvidenceStatus, "BESTANDEN_REAL_BROWSER_NO_WRITE");
  assert.equal(contract.preflight.realEvidenceRatified, true);
  assert.equal(contract.oneShotAuthority.implemented, true);
  assert.equal(contract.oneShotAuthority.maximumUses, 1);
  assert.equal(contract.oneShotAuthority.maximumTtlMs, 1500);
  assert.equal(contract.oneShotAuthority.exactRecipientSessionBinding, true);
  assert.equal(contract.oneShotAuthority.exactSlotBinding, true);
  assert.equal(contract.oneShotAuthority.exactCandidateIndexBinding, true);
  assert.equal(contract.oneShotAuthority.exactPrestateBinding, true);
  assert.equal(contract.oneShotAuthority.equipmentFenceRequired, true);
  assert.equal(contract.oneShotAuthority.inventoryFenceRequired, true);
  assert.equal(contract.oneShotAuthority.fenceDriftRevokes, true);
  assert.equal(contract.oneShotAuthority.gameplayAuthority, false);
  assert.equal(contract.oneShotAuthority.rawWriteAuthority, false);
  assert.equal(contract.oneShotAuthority.swapWriteRatification, false);
  assert.equal(contract.oneShotAuthority.gameplayWrites, 0);
  assert.equal(contract.durableIntentReconciliation.implemented, true);
  assert.equal(contract.durableIntentReconciliation.persistBeforeMutation, true);
  assert.equal(contract.durableIntentReconciliation.exactJournalAckRequired, true);
  assert.equal(contract.durableIntentReconciliation.consumesExactOneShotBinding, true);
  assert.equal(contract.durableIntentReconciliation.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(contract.durableIntentReconciliation.postSendReobserveClassifier, true);
  assert.equal(contract.durableIntentReconciliation.sameIntentRetry, false);
  assert.equal(contract.durableIntentReconciliation.newIntentAutomaticallyAllowed, false);
  assert.equal(contract.durableIntentReconciliation.gameplayWrites, 0);
  assert.equal(contract.durableIntentReconciliation.publicFunctionCalls, 0);
  assert.equal(contract.durableIntentReconciliation.rawWriteCalls, 0);
  assert.equal(contract.durableIntentReconciliation.gameplayAuthority, false);
  assert.equal(contract.durableIntentReconciliation.rawWriteAuthority, false);
  assert.equal(contract.durableIntentReconciliation.swapWriteRatification, false);
  assert.equal(contract.realShadow.prepared, true);
  assert.equal(contract.realShadow.merchantOnly, true);
  assert.equal(contract.realShadow.workerPackageConfigured, false);
  assert.equal(contract.realShadow.shadowDurableIntentReadback, true);
  assert.equal(contract.realShadow.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(contract.realShadow.expectedReconciliation, "NOT_APPLIED");
  assert.equal(contract.realShadow.stablePostIntentReobserve, true);
  assert.equal(contract.realShadow.gameplayWrites, 0);
  assert.equal(contract.realShadow.publicFunctionCalls, 0);
  assert.equal(contract.realShadow.rawWriteCalls, 0);
  assert.equal(contract.realShadow.authorityIssued, false);
  assert.equal(contract.realShadow.swapWriteRatification, false);
  assert.equal(contract.realShadow.sameIntentRetry, false);
  assert.equal(contract.realShadow.realEvidenceStatus, "BESTANDEN_REAL_BROWSER_SHADOW_NO_WRITE");
  assert.equal(contract.realShadow.realEvidenceRatified, true);
  assert.equal(contract.realShadow.observedReconciliation, "NOT_APPLIED");
  assert.equal(contract.productiveOccupiedSlotLive.prepared, true);
  assert.equal(contract.productiveOccupiedSlotLive.maximumGameplayWrites, 1);
  assert.equal(contract.productiveOccupiedSlotLive.maximumPublicFunctionCalls, 1);
  assert.equal(contract.productiveOccupiedSlotLive.rawWriteCalls, 0);
  assert.equal(contract.productiveOccupiedSlotLive.oneShotMaximumUses, 1);
  assert.equal(contract.productiveOccupiedSlotLive.sameIntentRetry, false);
  assert.equal(contract.productiveOccupiedSlotLive.restartResendAllowed, false);
  assert.equal(contract.productiveOccupiedSlotLive.normalRuntimeAllowed, false);
  assert.equal(contract.productiveOccupiedSlotLive.realEvidenceStatus, "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(contract.productiveOccupiedSlotLive.realEvidenceRatified, true);
  assert.equal(contract.productiveOccupiedSlotLive.observedReconciliation, "COMMITTED");
  assert.equal(contract.productiveOccupiedSlotLive.observedSettlement, "BESTAETIGT");
  assert.equal(contract.productiveOccupiedSlotLive.observedGameplayWrites, 1);
  assert.equal(contract.productiveOccupiedSlotLive.observedPublicFunctionCalls, 1);
  assert.equal(contract.productiveOccupiedSlotLive.observedRawWriteCalls, 0);
  assert.equal(contract.productiveOccupiedSlotLive.observedSameIntentRetry, false);
  assert.equal(contract.productiveOccupiedSlotLive.observedSoakSamples, 60);
  assert.ok(contract.productiveOccupiedSlotLive.observedSoakDurationMs >= 299000);
  assert.equal(contract.productiveOccupiedSlotLive.manifestCutoverPrepared, true);
  assert.match(contract.productiveOccupiedSlotLive.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(contract.productiveOccupiedSlotLive.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(contract.weaponOffhandFoundation.explicitSlotRequired, true);
  assert.equal(contract.weaponOffhandFoundation.genericWeaponAutoSlotAllowed, false);
  assert.equal(contract.weaponOffhandFoundation.classRulesPinned, true);
  assert.equal(contract.weaponOffhandFoundation.oppositeHandPinned, true);
  assert.equal(contract.weaponOffhandFoundation.doublehandOffhandConflictBlocked, true);
  assert.equal(contract.weaponOffhandFoundation.automaticUnequipAllowed, false);
  assert.equal(contract.weaponOffhandFoundation.sameIntentRetry, false);
  assert.equal(contract.weaponOffhandFoundation.gameplayWrites, 0);
  assert.equal(contract.weaponOffhandFoundation.gameplayAuthority, false);
  assert.equal(contract.weaponOffhandFoundation.rawWriteAuthority, false);
  assert.equal(contract.weaponOffhandFoundation.realReadOnlyEvidenceStatus, "BLOCKIERT_REAL_BROWSER_NO_SAFE_CANDIDATE_ZERO_WRITE");
  assert.equal(contract.weaponOffhandFoundation.realReadOnlyEvidenceRatified, true);
  assert.equal(contract.weaponOffhandFoundation.realReadOnlyObservedMerchantCandidateCount, 0);
  assert.equal(contract.weaponOffhandFoundation.readOnlyPackagePrepared, true);
  assert.equal(contract.weaponOffhandFoundation.readOnlyWorkerPackageConfigured, false);
  assert.equal(contract.weaponOffhandFoundation.readOnlyFarmerWorkerDistribution, false);
  assert.equal(contract.weaponOffhandFoundation.readOnlyStableDoubleObservation, true);
  assert.equal(contract.weaponOffhandFoundation.readOnlyCompleteRestEquipmentFence, true);
  assert.equal(contract.weaponOffhandFoundation.readOnlyGameplayWrites, 0);
  assert.equal(contract.weaponOffhandFoundation.readOnlyPublicFunctionCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.readOnlyRawWriteCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.readOnlyManifestCutoverPrepared, true);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryPrepared, true);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryWorkerPackageConfigured, false);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryGameplayWrites, 0);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryPublicFunctionCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryRawWriteCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryFarmerGearAllocationRatification, false);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryEvidenceStatus, "BLOCKIERT_REAL_BROWSER_NO_COMPATIBLE_ACCOUNT_CANDIDATE_ZERO_WRITE");
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryManifestCutoverPrepared, true);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryControllerVersion, "1.0.3");
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryTestId, "pr20-7-gear-account-weapon-candidate-discovery-v2");
  assert.equal(contract.weaponOffhandFoundation.accountDiscoverySupersedesTestId, "pr20-7-gear-account-weapon-candidate-discovery");
  assert.equal(contract.weaponOffhandFoundation.accountDiscoverySameTestVersionUpgradeBypassed, false);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryBridgeContractFixed, true);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryStatusEnvelope, "status.v5AutonomousTest");
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryPeekTelemetryArray, true);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryRichSourceSelection, true);
  assert.deepEqual(contract.weaponOffhandFoundation.accountDiscoverySources, ["get_characters", "X.characters"]);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryPriorV2Status, "BLOCKIERT_ROSTER_OHNE_INVENTAR_SLOTS_ZERO_WRITE");
  assert.equal(contract.weaponOffhandFoundation.accountDiscoverySameTestUpgradeGate, "WINDOWS_BRIDGE_TERMINAL_ZERO_WRITE_ONLY");
  assert.match(contract.weaponOffhandFoundation.accountDiscoverySourceCommit, /^[0-9a-f]{40}$/);
  assert.match(contract.weaponOffhandFoundation.accountDiscoveryPackageSha256, /^[0-9a-f]{64}$/);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryRatified, true);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryObservedAtMs, 1790232916356);
  assert.equal(contract.weaponOffhandFoundation.accountDiscoveryResolution, "PROCUREMENT_REQUIRED");
  assert.equal(contract.weaponOffhandFoundation.bridgeExistingContextObservation.exactFarmerContexts, 3);
  assert.equal(contract.weaponOffhandFoundation.bridgeExistingContextObservation.totalCompatibleCandidates, 0);
  assert.equal(contract.weaponOffhandFoundation.bridgeExistingContextObservation.gameplayWrites, 0);
  assert.equal(contract.weaponOffhandFoundation.bridgeExistingContextObservation.rawWriteCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.acquisitionPrepared, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionCandidate, "wshield");
  assert.equal(contract.weaponOffhandFoundation.acquisitionRecipient, "My_Merchant");
  assert.equal(contract.weaponOffhandFoundation.acquisitionTargetSlot, "offhand");
  assert.equal(contract.weaponOffhandFoundation.acquisitionExpectedUnitPrice, 4800);
  assert.equal(contract.weaponOffhandFoundation.acquisitionVendorId, "basics");
  assert.equal(contract.weaponOffhandFoundation.acquisitionControllerVersion, "1.0.1");
  assert.equal(contract.weaponOffhandFoundation.acquisitionManifestCutoverPrepared, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionSameTestUpgradeStrictlyNewer, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionPreviousTerminalZeroWriteEligible, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionEvidenceStatus, "V1_0_0_FALSE_POSITIVE_REJECTED_V1_0_1_OFFEN");
  assert.equal(contract.weaponOffhandFoundation.acquisitionGameplayWrites, 0);
  assert.equal(contract.weaponOffhandFoundation.acquisitionPublicFunctionCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.acquisitionRawWriteCalls, 0);
  assert.equal(contract.weaponOffhandFoundation.acquisitionPurchaseAuthority, false);
  assert.equal(contract.weaponOffhandFoundation.acquisitionGoldBudgetLedgerReservationRequired, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionOldPr203HarnessReuseAllowed, false);
  assert.equal(contract.weaponOffhandFoundation.acquisitionSameIntentRetry, false);
  assert.equal(contract.weaponOffhandFoundation.acquisitionNormalRuntimeAllowed, false);
  assert.equal(contract.weaponOffhandFoundation.acquisitionPackage, "werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js");
  assert.equal(contract.weaponOffhandFoundation.acquisitionSourceCommit, "bfcbc3186b1fe374fe37d0dd43d5677511480f5d");
  assert.equal(contract.weaponOffhandFoundation.acquisitionPackageSha256, "0d1378a0bca4ff0665dc14ab67920a15a0532f20ab141c6428edac414c0c3c72");
  assert.equal(contract.weaponOffhandFoundation.acquisitionPreviousControllerVersionRejected, "1.0.0");
  assert.equal(contract.weaponOffhandFoundation.acquisitionPreviousLiveRunRatified, false);
  assert.equal(contract.weaponOffhandFoundation.acquisitionRequiredBuyApi, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionRequiredObservedSellDistance, true);
  assert.equal(contract.weaponOffhandFoundation.acquisitionRequiredVendorReachability, true);
  assert.match(contract.weaponOffhandFoundation.acquisitionSourceCommit, /^[0-9a-f]{40}$/);
  assert.match(contract.weaponOffhandFoundation.acquisitionPackageSha256, /^[0-9a-f]{64}$/);
  assert.match(contract.weaponOffhandFoundation.readOnlySourceCommit, /^[0-9a-f]{40}$/);
  assert.match(contract.weaponOffhandFoundation.readOnlyPackageSha256, /^[0-9a-f]{64}$/);
  assert.equal(contract.nextGate.weaponsAndOffhandRemainSeparate, true);
});
