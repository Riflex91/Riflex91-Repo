import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const text = pfad => fs.readFileSync(pfad, "utf8");

const prep = lies("grundlage/vertraege/runtime/merchant-remaining-production-preparation.json");
const actions = lies("wissensbasis/vertraege/action-contracts.json");
const recoveries = lies("wissensbasis/vertraege/recovery-contracts.json");
const verifiers = lies("grundlage/vertraege/r9/verifier-katalog.json");
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json");
const produktionsKomposition = text("grundlage/quelle/runtime/produktions-komposition.ts");
const clientQuelle = text("wissensbasis/datenbank/aktuell/AL-SRC-FUNCTIONS.txt");
const serverQuelle = text("wissensbasis/datenbank/aktuell/AL-SRC-SERVER.txt");
const skillQuelle = text("wissensbasis/datenbank/aktuell/AL-DATA-SKILLS.txt");

test("PR20.5-PR20.9 Vorbereitung bleibt strikt authority-frei", () => {
  assert.equal(prep.status, "VORBEREITET_NO_WRITE");
  assert.equal(prep.authorityGrenze.produktiveRegistrierungErlaubt, false);
  assert.equal(prep.authorityGrenze.produktiverAktivierungspfadErlaubt, false);
  assert.equal(prep.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(prep.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(prep.authorityGrenze.actionAuthority, false);
  assert.equal(prep.authorityGrenze.neueLiveAdapter, 0);
  assert.equal(prep.authorityGrenze.neueGameplayWrites, 0);
});

test("MLuck same-account Contract ist eng gebunden und besitzt keinen Runtime-Bypass", () => {
  const action = actions.contracts.find(x => x.id === "AL-ACTION-MLUCK-SAME-ACCOUNT");
  const recovery = recoveries.actions.find(x => x.id === "AL-RECOVERY-MLUCK-SAME-ACCOUNT");
  const verifier = verifiers.verifiers.find(x => x.id === "AL-VERIFIER-MLUCK-SAME-ACCOUNT");
  const bindung = bindungen.bindungen.find(
    x => x.actionContractId === "AL-ACTION-MLUCK-SAME-ACCOUNT",
  );

  assert.ok(action);
  assert.ok(recovery);
  assert.ok(verifier);
  assert.ok(bindung);

  assert.equal(action.publicFunction, "use_skill");
  assert.equal(action.family, "skill_buff");
  assert.equal(action.client.transportEvent, "skill");
  assert.equal(action.client.correlationType, "FIFO_DEFERRED");
  assert.equal(action.client.correlationChannel, "mluck");
  assert.equal(action.client.requestId, false);
  assert.equal(action.idempotency, "NON_IDEMPOTENT");
  assert.equal(action.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
  assert.ok(action.liveRevalidation.includes("same_account"));
  assert.ok(action.liveRevalidation.includes("target_mluck_condition_source_strength"));
  assert.ok(action.postconditions.includes(
    "same-account target mluck condition is strong=true",
  ));

  assert.equal(recovery.actionContractId, action.id);
  assert.equal(recovery.retryPolicy.sameIntentAfterPossibleSend, "NEVER");
  assert.equal(verifier.actionContractId, action.id);
  assert.equal(bindung.recoveryContractId, recovery.id);
  assert.equal(bindung.verifierId, verifier.id);

  assert.equal(prep.pr20_6.scope, "SAME_ACCOUNT_MLUCK_ONLY");
  assert.equal(prep.pr20_6.produktiveRegistrierungErlaubt, false);
  assert.equal(prep.pr20_6.gameplayAuthority, false);

  assert.equal(produktionsKomposition.includes("AL-ACTION-MLUCK-SAME-ACCOUNT"), false);
  assert.equal(produktionsKomposition.includes("use_skill("), false);
  assert.equal(produktionsKomposition.includes("merchant.mluck.mutieren"), false);
});

test("MLuck Contract ist aus vorhandenen offiziellen Source-Snapshots ableitbar", () => {
  for (const marker of [
    "function use_skill(name, target, arg, request_id)",
    'return request(name, "skill", { name: name, id: target })',
  ]) assert.ok(clientQuelle.includes(marker), marker);

  for (const marker of [
    '"mluck":{',
    '"class":["merchant"]',
    '"level":40',
    '"mp":10',
    '"range":320',
    '"cooldown":100',
    '"target":"player"',
  ]) assert.ok(skillQuelle.includes(marker), marker);

  const mluckIndex = serverQuelle.indexOf('} else if (data.name == "mluck")');
  assert.ok(mluckIndex >= 0);
  const mluckBlock = serverQuelle.slice(mluckIndex, mluckIndex + 1200);
  assert.ok(mluckBlock.includes("consume_mp(player, gSkill.mp, target)"));
  assert.ok(mluckBlock.includes("!target.s[gSkill.condition].strong"));
  assert.ok(mluckBlock.includes("target.s[gSkill.condition].f == player.name"));
  assert.ok(mluckBlock.includes("target.owner == player.owner"));
  assert.ok(mluckBlock.includes("target.s[gSkill.condition].strong = true"));
});

test("Merchant Pingpong-Planer enthaelt keine Raw-Action-Aufrufe", () => {
  const stabilitaet = text("grundlage/quelle/merchant/dienst-stabilitaet.ts");
  for (const roh of [
    "bank_store(",
    "bank_retrieve(",
    "buy(",
    "sell(",
    "send_item(",
    "send_gold(",
    "use_skill(",
    "equip(",
    "upgrade(",
    "compound(",
    "exchange(",
    "craft(",
  ]) assert.equal(stabilitaet.includes(roh), false, roh);
  assert.ok(stabilitaet.includes("gameplayAutoritaet: false"));
  assert.ok(stabilitaet.includes("rawWriteAutoritaet: false"));
  assert.ok(stabilitaet.includes("IRREVERSIBLE_MUTATION_OFFEN"));
  assert.ok(stabilitaet.includes("STARVATION_GRENZE_ERREICHT"));
  assert.ok(stabilitaet.includes("WECHSEL_BUDGET_ERSCHOEPFT"));
});

test("Gear Foundation bleibt reservierungs- und restart-gebunden", () => {
  const gear = text("grundlage/quelle/merchant/gear-allokation.ts");
  const progression = text("grundlage/quelle/merchant/gear-progression.ts");
  for (const marker of [
    "GEAR_KANDIDAT_BEREITS_RESERVIERT",
    "GEAR_RECIPIENT_SLOT_BEREITS_BELEGT",
    '"RECOVERY_PENDING"',
  ]) assert.ok(gear.includes(marker), marker);
  for (const marker of [
    '"FARMER"',
    '"MERCHANT_SELF"',
    "EVIDENCE_STALE",
    "PHYSISCH_NICHT_VERFUEGBAR",
    "DISPOSITION_GESPERRT",
  ]) assert.ok(progression.includes(marker), marker);
  assert.equal(prep.pr20_7.status,
    "WEAPON_OFFHAND_ACQUISITION_CORRECTIVE_1_0_1_PACKAGE_BEREIT_MANIFEST_OFFEN");
  assert.equal(prep.pr20_7.sicherVorbereitet.exactTwoLocationSettlement, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.performanceTrickRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.exactHeadRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.stableDoubleObservation, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.browserGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.authorityAusstellung, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.realBrowserPreflightEvidence, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.oneShotMaximumUses, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.oneShotMaximumTtlMs, 1500);
  assert.equal(prep.pr20_7.sicherVorbereitet.exactRecipientSessionBinding, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.exactSlotAndIndexBinding, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.exactPrestateBinding, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.equipmentFenceRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.inventoryFenceRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.fenceDriftRevokes, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.gameplayAutoritaet, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.rawWriteAutoritaet, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.persistBeforeMutation, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.exactJournalAckRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(prep.pr20_7.sicherVorbereitet.postSendReobserveClassifier, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.sameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.newIntentAutomaticallyAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowDurableReadback, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowSendBoundaryState, "NICHT_GESENDET");
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowExpectedReconciliation, "NOT_APPLIED");
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowAuthorityIssued, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowEvidenceStatus, "BESTANDEN_REAL_BROWSER_SHADOW_NO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowEvidenceRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowObservedReconciliation, "NOT_APPLIED");
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.realShadowRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.realBrowserPreflightEvidenceStatus, "BESTANDEN_REAL_BROWSER_NO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.workerPackageConfigured, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerWorkerDistribution, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.startCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.disconnectCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerWorkersInstalled, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.sameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.gameplayAutoritaet, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.rawWriteAutoritaet, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveEvidenceStatus,
    "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveEvidenceRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveReconciliation, "COMMITTED");
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveSettlement, "BESTAETIGT");
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveGameplayWrites, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLivePublicFunctionCalls, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveSoakSamples, 60);
  assert.ok(prep.pr20_7.sicherVorbereitet.occupiedNonWeaponLiveSoakDurationMs >= 299000);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponsOffhandSeparateGate, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationSeparateGate, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandExplicitSlotRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandClassRulesPinned, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandOppositeHandPinned, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandDoublehandConflictBlocked, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAutomaticUnequipAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandRealReadOnlyEvidenceStatus, "BLOCKIERT_REAL_BROWSER_NO_SAFE_CANDIDATE_ZERO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandRealReadOnlyEvidenceRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandMerchantCandidateCount, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyPackagePrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyWorkerPackageConfigured, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyFarmerWorkerDistribution, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyStableDoubleObservation, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyCompleteRestEquipmentFence, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyManifestCutoverPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryFarmerGearAllocationRatification, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryEvidenceStatus, "BLOCKIERT_REAL_BROWSER_NO_COMPATIBLE_ACCOUNT_CANDIDATE_ZERO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryManifestCutoverPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryControllerVersion, "1.0.3");
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryTestId, "pr20-7-gear-account-weapon-candidate-discovery-v2");
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoverySupersedesTestId, "pr20-7-gear-account-weapon-candidate-discovery");
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoverySameTestVersionUpgradeBypassed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryBridgeContractFixed, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryStatusEnvelope, "status.v5AutonomousTest");
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryPeekTelemetryArray, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryRichSourceSelection, true);
  assert.deepEqual(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoverySources, ["get_characters", "X.characters"]);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryPriorV2Status, "BLOCKIERT_ROSTER_OHNE_INVENTAR_SLOTS_ZERO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoverySameTestUpgradeGate, "WINDOWS_BRIDGE_TERMINAL_ZERO_WRITE_ONLY");
  assert.match(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoverySourceCommit, /^[0-9a-f]{40}$/);
  assert.match(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryPackageSha256, /^[0-9a-f]{64}$/);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryObservedAtMs, 1790232916356);
  assert.equal(prep.pr20_7.sicherVorbereitet.accountWeaponDiscoveryResolution, "PROCUREMENT_REQUIRED");
  assert.equal(prep.pr20_7.sicherVorbereitet.bridgeExistingFarmerContextsObserved, 3);
  assert.equal(prep.pr20_7.sicherVorbereitet.bridgeExistingFarmerCompatibleCandidates, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionCandidate, "wshield");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRecipient, "My_Merchant");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionTargetSlot, "offhand");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionExpectedUnitPrice, 4800);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionVendorId, "basics");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionControllerVersion, "1.0.1");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionManifestCutoverPrepared, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionEvidenceStatus, "V1_0_0_FALSE_POSITIVE_REJECTED_V1_0_1_OFFEN");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPurchaseAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionGoldBudgetLedgerReservationRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionOldPr203HarnessReuseAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionNormalRuntimeAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPackage, "werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSourceCommit, "bfcbc3186b1fe374fe37d0dd43d5677511480f5d");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPackageSha256, "0d1378a0bca4ff0665dc14ab67920a15a0532f20ab141c6428edac414c0c3c72");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPreviousControllerVersionRejected, "1.0.0");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPreviousLiveRunRatified, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRequiredBuyApi, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRequiredObservedSellDistance, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRequiredVendorReachability, true);
  assert.match(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSourceCommit, /^[0-9a-f]{40}$/);
  assert.match(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPackageSha256, /^[0-9a-f]{64}$/);
  assert.match(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlySourceCommit, /^[0-9a-f]{40}$/);
  assert.match(prep.pr20_7.sicherVorbereitet.weaponOffhandReadOnlyPackageSha256, /^[0-9a-f]{64}$/);
});

test("Upgrade Compound Exchange und Craft bleiben vorhandenen no-retry Contracts unterworfen", () => {
  const ids = [
    "AL-ACTION-UPGRADE",
    "AL-ACTION-COMPOUND",
    "AL-ACTION-EXCHANGE",
    "AL-ACTION-CRAFT",
  ];
  for (const id of ids) {
    const action = actions.contracts.find(x => x.id === id);
    const recovery = recoveries.actions.find(x => x.actionContractId === id);
    const verifier = verifiers.verifiers.find(x => x.actionContractId === id);
    const bindung = bindungen.bindungen.find(x => x.actionContractId === id);
    assert.ok(action, id);
    assert.ok(recovery, id);
    assert.ok(verifier, id);
    assert.ok(bindung, id);
    assert.equal(action.idempotency, "NON_IDEMPOTENT");
    assert.equal(action.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
    assert.equal(recovery.retryPolicy.sameIntentAfterPossibleSend, "NEVER");
  }
});

test("Werttransaktions- und Production-Foundations bleiben no-write", () => {
  const wert = text("grundlage/quelle/merchant/werttransaktion.ts");
  const graph = text("grundlage/quelle/produktion/production-graph.ts");
  const controller = text("grundlage/quelle/produktion/production-controller.ts");
  assert.ok(wert.includes("sameIntentErneutSenden: false"));
  assert.ok(wert.includes('"ABGLEICH_ERFORDERLICH"'));
  assert.ok(graph.includes("actionAuthority: false"));
  assert.ok(graph.includes("rawWriteAuthority: false"));
  assert.ok(graph.includes("PRODUKTION_IRREVERSIBEL_OHNE_OPERATIONSSCHLUESSEL"));
  assert.ok(controller.includes("gameplayAutoritaet = false"));
  assert.ok(controller.includes("rawWriteAutoritaet = false"));

  for (const roh of [
    "bank_store(",
    "bank_retrieve(",
    "buy(",
    "sell(",
    "send_item(",
    "send_gold(",
    "use_skill(",
    "upgrade(",
    "compound(",
    "exchange(",
    "craft(",
  ]) assert.equal(produktionsKomposition.includes(roh), false, roh);
});

test("aktueller Vertragskatalog ist konsistent 61 total / 60 verifiziert / 1 disabled", () => {
  assert.equal(actions.contracts.length, 61);
  assert.equal(recoveries.actions.length, 61);
  assert.equal(verifiers.verifiers.length, 61);
  assert.equal(bindungen.bindungen.length, 61);
  assert.equal(actions.summary.total, 61);
  assert.equal(actions.summary.sourceVerified, 54);
  assert.equal(actions.summary.liveDeployedVerified, 6);
  assert.equal(actions.summary.explicitlyDisabledPendingExactContract, 1);
  assert.equal(recoveries.summary.total, 61);
  assert.equal(recoveries.summary.verifiedRecoveryPolicy, 60);
  assert.equal(recoveries.summary.disabledWithActionContract, 1);
  assert.equal(verifiers.summary.verified, 60);
  assert.equal(bindungen.summary.gebunden, 60);
});
