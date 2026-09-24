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
const exchangePlaner = text("grundlage/quelle/merchant/exchange-produktions-planer.ts");
const exchangePrep = lies("grundlage/vertraege/runtime/pr20-8-exchange-production-preparation.json");

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
    "ROADMAP_ABGESCHLOSSEN_MUTATIONS_RATIFIED_ALLOCATION_NO_WRITE");
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
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationSeparateGate, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationStatus,
    "BESTANDEN_NO_WRITE_FOUNDATION_RATIFIED");
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationRatification,
    "roadmap/pr20-7-farmer-gear-allocation-ratification.json");
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationExecutionAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationGameplayAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.farmerGearAllocationRawWriteAuthority, false);
  assert.equal(prep.pr20_7.nextGate, "PR20.8_WERTMUTATIONEN");
  assert.equal(prep.pr20_7.farmerGearAllocation.status,
    "BESTANDEN_NO_WRITE_FOUNDATION_RATIFIED");
  assert.equal(prep.pr20_7.farmerGearAllocation.gameplayAuthority, false);
  assert.equal(prep.pr20_7.farmerGearAllocation.normalRuntimeAllowed, false);
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
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionControllerVersion, "1.0.2");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionManifestCutoverPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSameTestUpgradeStrictlyNewer, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPreviousTerminalZeroWriteEligible, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionEvidenceStatus, "BESTANDEN_REAL_BROWSER_SOURCE_PINNED_NO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPurchaseAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionGoldBudgetLedgerReservationRequired, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionOldPr203HarnessReuseAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionNormalRuntimeAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPackage, "werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-2-autonomous.js");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSourceCommit, "0228da63fe01e8717ef7aebb85af24bb3b35478b");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPackageSha256, "1931312bfe6b15a2dd0764e774c52c84e6db09c376ee3fd33205b20cc5c9938c");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPreviousControllerVersionRejected, "1.0.1");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionPreviousLiveRunRatified, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRequiredBuyApi, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRequiredObservedSellDistance, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionRequiredVendorReachability, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSourcePinnedSellDistanceAllowed, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionSourcePinnedSellDistance, 400);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionBrowserSellDistanceMustMatchSourcePin, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionExpectedServerRegion, "EU");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionExpectedServerIdentifier, "I");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionOfficialServerSourceCommit, "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionOfficialServerBlobSha, "40d0aeda16b9a4320441e833020fe1b4db496e2c");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionEvidenceRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionEvidenceObservedAtMs, 1790238192422);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionObservedVendorDistance, 88.59875647515783);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionObservedSellDistance, 400);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionObservedSellDistanceSource, "OFFICIAL_SERVER_SOURCE_PIN");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowFoundation, "grundlage/quelle/equipment/pr20-7-weapon-offhand-acquisition-shadow.ts");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowPackage, "werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-v1-0-1-autonomous.js");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowTestId, "pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowControllerVersion, "1.0.1");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowSourceCommit, "0b92ce4002438ef4282622699019b5148da58184");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowPackageSha256, "11c666638c111a3acd04e550bf33b52eb7611f53a0f8f02547b4b199df73793d");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowManifestCutoverPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowExactCost, 4800);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowMinimumGoldSafetyReserve, 1000);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowGoldBudgetLedgerReservation, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowInventoryFence, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowGoldFence, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowBuyActionChannelFence, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowSocketBudgetReservation, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowSocketPlanBudgetReserved, 100);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowSocketServerReserveUntouched, 100);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowDurableIntent, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowDurableReadback, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowJournalTerminalArt, "ABBRUCH");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowSendBoundaryState, "NICHT_GESENDET");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowExpectedReconciliation, "NOT_APPLIED");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowOneShotMaximumUses, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowOneShotPurchaseAuthorityIssued, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowPurchaseAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowPublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowNormalRuntimeAllowed, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceStatus,
    "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceObservedAtMs, 1790243742400);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceResult, "BESTANDEN");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceBridgeState, "DEPLOYED");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceGameplayWrites, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidencePublicFunctionCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidencePurchaseAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceDurableReadback, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceGoldBudgetReservationSatisfied, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionShadowEvidenceVendorReachableNow, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseAuthority, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchasePreparationReady, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchasePreparationNoWrite, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseExactCost, 4800);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseMinimumGoldReserve, 1000);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseGoldReservationAmount, 4800);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseActionChannel, "buy");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseSocketPlanBudgetReserved, 100);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseSocketServerReserveUntouched, 100);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseOneShotMaximumUses, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseOneShotMaximumTtlMs, 1500);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseSettlementGoldDelta, -4800);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseSettlementItemDelta, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseAdapterPresent, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveRunnerPresent, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLivePackagePrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLivePackage,
    "werkzeuge/pr20-7-weapon-offhand-acquisition-live-5m.js");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveTestId,
    "pr20-7-gear-weapon-offhand-acquisition-live-5m");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveControllerVersion, "1.0.0");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveSourceCommit,
    "5efa5e2c92c258e1502ee388e84ba96d4c844027");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLivePackageSha256,
    "5cecc5a3ca36c2d75e4a6629c36991417b508e364a965c1a945a790aac8bd930");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveManifestCutoverPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveMaximumGameplayWrites, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveMaximumPublicFunctionCalls, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveRestartReconcileWithoutResend, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionProductivePurchaseLiveSoakMinimumSamples, 60);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandAcquisitionNextGate, "PR20.8_WERTMUTATIONEN");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipPackagePrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipExactItem, "wshield");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipTargetSlot, "offhand");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipPreviousTargetSlotMustBeEmpty, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipExactOppositeHand, "staff");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipManifestCutoverPrepared, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipEvidenceStatus,
    "BESTANDEN_REAL_BROWSER_LIVE_5M_ONE_WRITE");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipEvidenceRatified, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipEvidenceManifestMainCommit,
    "72ba966878e1575df786ca1e60f50044e2aa89a5");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipEvidenceObservedAtMs, 1790251127933);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedInventoryIndex, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedReconciliation, "COMMITTED");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedSettlement, "BESTAETIGT");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedGameplayWrites, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedPublicFunctionCalls, 1);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedRawWriteCalls, 0);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedSameIntentRetry, false);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedDurableIntentReadback, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedOneShotIssued, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedOneShotConsumed, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedExactEmptyOffhandPrestate, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedOppositeHandPinned, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedEquipmentInventoryFenceClaims, true);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedSoakSamples, 60);
  assert.ok(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipObservedSoakDurationMs >= 299000);
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandNextGate,
    "PR20.8_WERTMUTATIONEN");
  assert.equal(prep.pr20_7.sicherVorbereitet.weaponOffhandProductiveEquipSameIntentRetry, false);
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

test("PR20.8 Exchange besitzt spezialisierten Multi-Domain NO-WRITE Planer", () => {
  assert.ok(prep.pr20_8.foundations.some(x =>
    x.includes("ExchangeProduktionsPlaner")));
  assert.equal(prep.pr20_8.erkannteRestluecken.some(x =>
    x.includes("EXCHANGE besitzt noch keinen gleichwertigen")), false);

  const planner = prep.pr20_8.exchangeSpecializedPlanner;
  assert.equal(planner.status, "SPECIALIZED_PLANNER_BEREIT_NO_WRITE");
  assert.equal(planner.source, "grundlage/quelle/merchant/exchange-produktions-planer.ts");
  assert.equal(planner.contract,
    "grundlage/vertraege/runtime/pr20-8-exchange-production-preparation.json");
  assert.equal(planner.sourceSnapshotCommit,
    "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4");
  assert.equal(planner.actionContractId, "AL-ACTION-EXCHANGE");
  assert.equal(planner.recoveryContractId, "AL-RECOVERY-EXCHANGE");
  assert.equal(planner.verifierId, "AL-VERIFIER-EXCHANGE");
  assert.equal(planner.fullRewardDomainReconciliationRequired, true);
  assert.deepEqual(planner.rewardDomains, [
    "inventory", "gold", "shells", "account_cosmetics", "empty", "recursive_drop",
  ]);
  assert.equal(planner.promiseRewardOnlySupportingEvidence, true);
  assert.equal(planner.qPlaceholderAcceptedInFlight, true);
  assert.equal(planner.physicalIndexReresolveBeforeSend, true);
  assert.equal(planner.sameIntentRetry, false);
  assert.equal(planner.executionAuthority, false);
  assert.equal(planner.gameplayAuthority, false);
  assert.equal(planner.rawWriteAuthority, false);
  assert.equal(planner.liveAdapterPresent, false);
  assert.equal(planner.liveRunnerPresent, false);
  assert.equal(planner.gameplayWrites, 0);
  assert.equal(planner.publicFunctionCalls, 0);
  assert.equal(planner.rawWriteCalls, 0);
  assert.equal(planner.normalRuntimeAllowed, false);

  assert.equal(exchangePrep.status, "SPECIALIZED_PLANNER_BEREIT_NO_WRITE");
  assert.equal(exchangePrep.foundation.actionContractId, "AL-ACTION-EXCHANGE");
  assert.equal(exchangePrep.foundation.recoveryContractId, "AL-RECOVERY-EXCHANGE");
  assert.equal(exchangePrep.foundation.verifierId, "AL-VERIFIER-EXCHANGE");
  assert.equal(exchangePrep.rewardReconciliation.promiseRewardOnlySupportingEvidence, true);
  assert.equal(exchangePrep.rewardReconciliation.fullRewardDomainReconciliationRequired, true);
  assert.equal(exchangePrep.recovery.qOrPlaceholderMeansAcceptedInFlight, true);
  assert.equal(exchangePrep.recovery.sameIntentRetry, false);
  assert.equal(exchangePrep.authority.planningOnly, true);
  assert.equal(exchangePrep.authority.executionAuthority, false);
  assert.equal(exchangePrep.authority.gameplayAuthority, false);
  assert.equal(exchangePrep.authority.rawWriteAuthority, false);
  assert.equal(exchangePrep.authority.exchangeAuthority, false);
  assert.equal(exchangePrep.authority.liveAdapterPresent, false);
  assert.equal(exchangePrep.authority.liveRunnerPresent, false);
  assert.equal(exchangePrep.authority.normalRuntimeAllowed, false);
  assert.equal(exchangePrep.nextGate, "PR20_8_DURABLE_ONE_SHOT_FOUNDATIONS");

  for (const marker of [
    "fullRewardDomainReconciliationRequired: true",
    "promiseRewardIstNurSupportingEvidence: true",
    "placeholderUndQAcceptedInFlight: true",
    "exactPhysicalIndexMustBeReresolvedBeforeSend: true",
    "sameIntentRetry: false",
    "ausfuehrungsAutoritaet: false",
    "gameplayAutoritaet: false",
    "rawWriteAutoritaet: false",
  ]) assert.ok(exchangePlaner.includes(marker), marker);
  for (const raw of [
    "exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
  ]) assert.equal(exchangePlaner.includes(raw), false, raw);
});

test("PR20.8 Durable One-Shot Foundations bleiben family-separat und NO-WRITE", () => {
  const d = prep.pr20_8.durableOneShotFoundations;
  assert.equal(d.status, "BEREIT_NO_WRITE");
  assert.equal(d.separateAuthorityPerFamily, true);
  assert.equal(d.genericSharedMutationAuthority, false);
  assert.equal(d.maximumUses, 1);
  assert.equal(d.maximumTtlMs, 1500);
  assert.equal(d.durableAuthorityWriteRequired, true);
  assert.equal(d.exactDurableReadbackRequired, true);
  assert.equal(d.exactJournalReadbackRequired, true);
  assert.equal(d.driftRevokes, true);
  assert.equal(d.currentFenceBlocksAnyOpenMutationAuthority, true);
  assert.equal(d.currentFenceBlocksAnyOpenMutationTransaction, true);
  assert.equal(d.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(d.sameIntentRetry, false);
  assert.equal(d.admissionConsumesOneShot, true);
  assert.equal(d.admissionPerformsSend, false);
  assert.equal(d.executionAuthority, false);
  assert.equal(d.gameplayAuthority, false);
  assert.equal(d.rawWriteAuthority, false);
  assert.equal(d.liveAdapterPresent, false);
  assert.equal(d.liveRunnerPresent, false);
  assert.equal(d.gameplayWrites, 0);
  assert.equal(d.publicFunctionCalls, 0);
  assert.equal(d.rawWriteCalls, 0);
  assert.equal(d.normalRuntimeAllowed, false);
});

test("PR20.8 Read-only Preflights bleiben authority-frei und family-spezifisch", () => {
  const ro = prep.pr20_8.readOnlyPreflights;
  assert.equal(ro.status, "BEREIT_NO_WRITE");
  assert.deepEqual(ro.families, ["UPGRADE", "COMPOUND", "EXCHANGE"]);
  assert.equal(ro.exactCharacter, true);
  assert.equal(ro.exactSession, true);
  assert.equal(ro.exactServer, true);
  assert.equal(ro.merchantClassRequired, true);
  assert.equal(ro.authorityIssued, false);
  assert.equal(ro.durableIntentWritten, false);
  assert.equal(ro.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(ro.sameIntentRetry, false);
  assert.equal(ro.gameplayWrites, 0);
  assert.equal(ro.publicFunctionCalls, 0);
  assert.equal(ro.rawWriteCalls, 0);
  assert.equal(ro.liveAdapterPresent, false);
  assert.equal(ro.liveRunnerPresent, false);
  assert.equal(ro.normalRuntimeAllowed, false);
});

test("PR20.8 Live-Candidate-Discovery-Paket bleibt strikt NO-WRITE", () => {
  const live = prep.pr20_8.liveCandidateDiscovery;
  assert.equal(live.status, "PACKAGE_BEREIT_NO_WRITE");
  assert.equal(live.testId, "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(live.controllerVersion, "1.0.0");
  assert.equal(live.exactCharacter, "My_Merchant");
  assert.equal(live.exactCharacterClass, "merchant");
  assert.equal(live.exactServer, "EU:I");
  assert.equal(live.qMustBeEmpty, true);
  assert.equal(live.atLeastOneNormalCandidateRequired, true);
  assert.deepEqual(live.families, ["UPGRADE", "COMPOUND", "EXCHANGE"]);
  assert.equal(live.specialPathsExcluded, true);
  assert.equal(live.candidateAuthority, false);
  assert.equal(live.authorityIssued, false);
  assert.equal(live.durableIntentCreated, false);
  assert.equal(live.gameplayAuthority, false);
  assert.equal(live.rawWriteAuthority, false);
  assert.equal(live.gameplayWrites, 0);
  assert.equal(live.publicFunctionCalls, 0);
  assert.equal(live.rawWriteCalls, 0);
  assert.equal(live.sameIntentRetry, false);
  assert.equal(live.normalRuntimeAllowed, false);
});

test("PR20.8 Candidate-Manifest bleibt source- und package-gepinnt NO-WRITE", () => {
  const live = prep.pr20_8.liveCandidateDiscovery;
  assert.equal(
    live.sourceCommit,
    "7307573841b86b1fb22fd5abfb73a3d461bf0049",
  );
  assert.equal(
    live.packageSha256,
    "863ed58adb421ba618d5deace65942397db09fed676f3ef8eec9f9b17871d7d5",
  );
  assert.equal(live.manifest, "roadmap/v5-autonomous-test-manifest.json");
  assert.equal(live.manifestCutoverPrepared, true);
  assert.equal(live.authorityIssued, false);
  assert.equal(live.gameplayWrites, 0);
  assert.equal(live.publicFunctionCalls, 0);
  assert.equal(live.rawWriteCalls, 0);
  assert.equal(live.sameIntentRetry, false);
  assert.equal(live.normalRuntimeAllowed, false);
});

test("PR20.8 Real-Browser Candidate-Evidence ist ratifiziert und zero-write", () => {
  const live = prep.pr20_8.liveCandidateDiscovery;
  assert.equal(
    live.evidence,
    "roadmap/pr20-8-live-candidate-readonly-evidence.json",
  );
  assert.equal(
    live.evidenceStatus,
    "BESTANDEN_REAL_BROWSER_LIVE_READ_ONLY",
  );
  assert.equal(live.evidenceRatified, true);
  assert.equal(
    live.evidenceManifestMainCommit,
    "4ca28e7593e7757a05e0be4ea4f87902d8e089a9",
  );
  assert.equal(live.observedAtMs, 1790256949100);
  assert.deepEqual(live.observedUpgradeCandidate, {
    name: "gloves",
    level: 0,
    inventoryIndex: 6,
    baseGold: 3400,
    scrollName: "scroll0",
    observedScrollQuantity: 36,
    normalPathOnly: true,
    observedIndexCarriesWriteAuthority: false,
    freshReresolutionBeforeSendRequired: true,
  });
  assert.equal(live.observedCompoundCandidate, null);
  assert.equal(live.observedExchangeCandidate, null);
  assert.equal(live.authorityIssued, false);
  assert.equal(live.gameplayWrites, 0);
  assert.equal(live.publicFunctionCalls, 0);
  assert.equal(live.rawWriteCalls, 0);
  assert.equal(live.sameIntentRetry, false);
  assert.equal(live.normalRuntimeAllowed, false);
});

test("PR20.8 Upgrade Durable Shadow package stays no-send and authority-free", () => {
  const shadow = prep.pr20_8.upgradeDurableShadow;
  assert.equal(shadow.status, "PACKAGE_BEREIT_NO_WRITE");
  assert.equal(shadow.testId, "pr20-8-upgrade-durable-shadow-no-write");
  assert.equal(shadow.controllerVersion, "1.0.1");
  assert.equal(shadow.candidate.name, "gloves");
  assert.equal(shadow.candidate.level, 0);
  assert.equal(shadow.candidate.baseGold, 3400);
  assert.equal(shadow.scroll.name, "scroll0");
  assert.equal(shadow.scroll.consumeQuantity, 1);
  assert.equal(shadow.scroll.type, "uscroll");
  assert.equal(shadow.scroll.grade, 0);
  assert.equal(shadow.scroll.baseGold, 1000);
  assert.equal(shadow.serviceReachabilityRequired, true);
  assert.equal(shadow.sourcePinnedSellDistance, 400);
  assert.equal(shadow.conservativeLiveSafetyDistanceMax, 300);
  assert.equal(shadow.serviceReference, "G.maps.main.ref.u_mid");
  assert.equal(shadow.exactItemDefinitionRequired, true);
  assert.equal(shadow.exactScrollDefinitionRequired, true);
  assert.equal(shadow.offering, null);
  assert.equal(shadow.normalPathOnly, true);
  assert.equal(shadow.currentPhysicalIndexesReresolved, true);
  assert.equal(shadow.durableShadowOnly, true);
  assert.equal(shadow.durableReadbackRequired, true);
  assert.equal(shadow.journalTerminalArt, "ABBRUCH");
  assert.equal(shadow.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(shadow.reconciliationClassification, "NOT_APPLIED");
  assert.equal(shadow.sameIntentRetry, false);
  assert.equal(shadow.oneShotMaximumUses, 1);
  assert.equal(shadow.upgradeAuthorityIssued, false);
  assert.equal(shadow.productionDurableIntentCreated, false);
  assert.equal(shadow.gameplayAuthority, false);
  assert.equal(shadow.rawWriteAuthority, false);
  assert.equal(shadow.normalUpgradeWriteRatification, false);
  assert.equal(shadow.gameplayWrites, 0);
  assert.equal(shadow.publicFunctionCalls, 0);
  assert.equal(shadow.rawWriteCalls, 0);
  assert.equal(shadow.normalRuntimeAllowed, false);
});

test("PR20.8 Upgrade Shadow Manifest remains exact pinned and NO-WRITE after later gates", () => {
  const shadow = prep.pr20_8.upgradeDurableShadow;
  assert.equal(
    shadow.sourceCommit,
    "6d611de7fadf7a5cb3945ec25f3bc761acb14e3c",
  );
  assert.equal(
    shadow.packageSha256,
    "7703cff2fa837c19c1febffc064c44084494effa142c3e0fb560feec1af5a9ff",
  );
  assert.equal(shadow.manifest, "roadmap/v5-autonomous-test-manifest.json");
  assert.equal(shadow.manifestCutoverPrepared, true);
  assert.equal(shadow.handshakeMirrorsLocalAndGameRoot, true);
  assert.equal(shadow.controllerVersion, "1.0.1");
  assert.equal(shadow.exactTerminalIntentRecoveryAllowed, true);
  assert.equal(shadow.recoveryRequiresExactPersistedIntent, true);
  assert.equal(shadow.recoveryRewritesIntent, false);
  assert.equal(shadow.recoveryCreatesGameplayWrite, false);
  assert.equal(shadow.previousControllerVersionRecoverable, "1.0.0");
  assert.equal(shadow.terminalRecoveryPackagePinned, true);
  assert.equal(
    shadow.handshakeFixCommit,
    "72a0a2c65fff19327d3137356c9e079bf5117203",
  );
  assert.equal(shadow.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(shadow.upgradeAuthorityIssued, false);
  assert.equal(shadow.productionDurableIntentCreated, false);
  assert.equal(shadow.gameplayWrites, 0);
  assert.equal(shadow.publicFunctionCalls, 0);
  assert.equal(shadow.rawWriteCalls, 0);
  assert.equal(shadow.sameIntentRetry, false);
  assert.equal(shadow.normalRuntimeAllowed, false);
});

test("PR20.8 Upgrade Durable Shadow real-browser evidence remains ratified after later gates", () => {
  const shadow=prep.pr20_8.upgradeDurableShadow;
  assert.equal(
    shadow.evidence,
    "roadmap/pr20-8-upgrade-durable-shadow-evidence.json",
  );
  assert.equal(
    shadow.evidenceStatus,
    "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE",
  );
  assert.equal(shadow.evidenceRatified,true);
  assert.equal(shadow.evidenceTelemetryBatchId,8244);
  assert.equal(shadow.evidenceObservedControllerVersion,"1.0.0");
  assert.equal(shadow.evidenceObservedAtMs,1790258801223);
  assert.equal(shadow.evidenceCandidateIndex,6);
  assert.equal(shadow.evidenceScrollIndex,14);
  assert.equal(shadow.evidenceGameplayWrites,0);
  assert.equal(shadow.evidencePublicFunctionCalls,0);
  assert.equal(shadow.evidenceRawWriteCalls,0);
  assert.equal(shadow.evidenceSendBoundaryState,"NICHT_GESENDET");
  assert.equal(shadow.evidenceReconciliation,"NOT_APPLIED");
  assert.equal(shadow.evidenceUpgradeAuthority,false);
  assert.equal(shadow.evidenceNormalUpgradeWriteRatification,false);
  assert.equal(shadow.normalUpgradeWriteRatification,false);
  assert.equal(shadow.gameplayAuthority,false);
  assert.equal(shadow.rawWriteAuthority,false);
  assert.equal(shadow.normalRuntimeAllowed,false);
});

test("PR20.8 Upgrade one-write preparation remains no-live while manifest cutover advances separately", () => {
  const p=prep.pr20_8.upgradeProductiveOneWritePreparation;
  assert.equal(
    prep.pr20_8.status,
    "UPGRADE_COMMITTED_UPDATER_PERSISTED_BRIDGE_TERMINAL_RECOVERY_BESTANDEN_COMPOUND_EXCHANGE_READONLY_RESCAN_PREPARED",
  );
  assert.equal(
    prep.pr20_8.nextAction,
    "PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN",
  );
  assert.equal(p.status,"BEREIT_NO_LIVE_WRITE");
  assert.equal(
    p.contract,
    "grundlage/vertraege/runtime/pr20-8-upgrade-productive-one-write-preparation.json",
  );
  assert.equal(
    p.test,
    "grundlage/tests/pr20-upgrade-productive-one-write-preparation.test.mjs",
  );
  assert.equal(p.exactCandidate,"gloves@0");
  assert.equal(p.exactScroll,"scroll0");
  assert.equal(p.offering,null);
  assert.equal(p.futurePublicFunction,"upgrade");
  assert.equal(p.maximumGameplayWrites,1);
  assert.equal(p.maximumPublicFunctionCalls,1);
  assert.equal(p.maximumRawWriteCalls,0);
  assert.equal(p.durableIntentBeforePossibleSend,true);
  assert.equal(p.exactJournalReadbackRequired,true);
  assert.equal(p.oneShotMaximumUses,1);
  assert.equal(p.oneShotMaximumTtlMs,1500);
  assert.equal(p.freshIndexReresolutionImmediatelyBeforeSend,true);
  assert.equal(p.sameIntentRetry,false);
  assert.equal(p.liveRunnerPresent,true);
  assert.equal(
    p.runnerPackage,
    "werkzeuge/pr20-8-upgrade-productive-one-write-live.js",
  );
  assert.equal(
    p.runnerTest,
    "werkzeuge/tests/pr20-8-upgrade-productive-one-write-live.test.mjs",
  );
  assert.equal(
    p.runnerContract,
    "grundlage/vertraege/runtime/pr20-8-upgrade-productive-one-write-runner-preparation.json",
  );
  assert.equal(p.runnerTestId,"pr20-8-upgrade-productive-one-write-live");
  assert.equal(p.runnerControllerVersion,"1.0.0");
  assert.equal(p.expectedGlobal,"V5PR208UpgradeProductiveOneWriteLive");
  assert.equal(p.manifestCutoverPrepared,false);
  assert.equal(p.deployed,false);
  assert.equal(p.liveWriteEnabled,false);
  assert.equal(p.packageContainsExactlyOnePublicUpgradeCallSite,true);
  assert.equal(p.gameplayAuthority,false);
  assert.equal(p.rawWriteAuthority,false);
  assert.equal(p.normalRuntimeAllowed,false);
});

test("PR20.8 updater persistence bootstrap v2 remains confirmed persisted and zero-write", () => {
  const b=prep.pr20_8.updaterPersistenceBootstrap;
  assert.equal(b.status,"V2_REAL_BROWSER_BESTANDEN_PERSISTED");
  assert.equal(b.testId,"pr20-8-native-updater-recovery-bootstrap-v2");
  assert.equal(b.updaterVersion,"1.0.8");
  assert.equal(b.telemetryBatchId,8255);
  assert.equal(b.persistedObserved,true);
  assert.equal(b.persistedAtMs,1790270182323);
  assert.equal(b.bridgeState,"ALREADY_PRESENT");
  assert.equal(b.bridgeError,null);
  assert.equal(b.gameplayWrites,0);
  assert.equal(b.publicFunctionCalls,0);
  assert.equal(b.rawWriteCalls,0);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.nextGate,"PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
});

test("PR20.8 bridge handshake and terminal recovery are confirmed zero-write", () => {
  const b=prep.pr20_8.bridgeHandshakeProbe;
  assert.equal(b.status,"TERMINAL_RECOVERY_BESTANDEN_ZERO_WRITE");
  assert.equal(b.testId,"pr20-8-bridge-handshake-probe-v1");
  assert.equal(b.telemetryBatchId,8256);
  assert.equal(b.bridgeState,"ALREADY_PRESENT");
  assert.equal(b.bridgeError,null);
  assert.equal(b.observedStatus,"LAEUFT");
  assert.equal(b.observedPhase,"BRIDGE_HANDSHAKE_PROBE");
  assert.equal(b.observedTerminal,false);
  assert.equal(b.gameplayWrites,0);
  assert.equal(b.publicFunctionCalls,0);
  assert.equal(b.rawWriteCalls,0);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.nextGate,"PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");

  const r=b.terminalRecovery;
  assert.equal(r.status,"BESTANDEN_REAL_BROWSER_ZERO_WRITE");
  assert.equal(r.controllerVersion,"1.0.1");
  assert.equal(r.package,"werkzeuge/pr20-8-bridge-handshake-probe-v1-0-1.js");
  assert.equal(r.sourceCommit,"fe38f784d9d8bfeac3d9b30874a453716bd9e3bc");
  assert.equal(r.packageSha256,"08d21dde622ed1cf2dd56438225e4274478263908363a5692bcb6c548b58303b");
  assert.equal(r.packageBytes,2390);
  assert.equal(r.observedAtMs,1790272609259);
  assert.equal(r.bridgeState,"ALREADY_PRESENT");
  assert.equal(r.bridgeError,null);
  assert.equal(r.targetStatus,"BESTANDEN");
  assert.equal(r.targetPhase,"BRIDGE_HANDSHAKE_PROBE_COMPLETE");
  assert.equal(r.targetTerminal,true);
  assert.equal(r.gameplayWrites,0);
  assert.equal(r.publicFunctionCalls,0);
  assert.equal(r.rawWriteCalls,0);
  assert.equal(r.sameIntentRetry,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.evidence,"roadmap/pr20-8-bridge-handshake-terminal-recovery-evidence.json");
});

test("PR20.8 remaining Compound/Exchange candidate rescan is read-only and exact", () => {
  const r=prep.pr20_8.remainingCandidateRescan;
  assert.equal(r.status,"MANIFEST_CUTOVER_PREPARED_NOT_YET_OBSERVED");
  assert.equal(r.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(r.controllerVersion,"1.0.0");
  assert.equal(r.package,"werkzeuge/pr20-8-wertmutation-live-candidate-readonly.js");
  assert.equal(r.test,"werkzeuge/tests/pr20-8-wertmutation-live-candidate-readonly.test.mjs");
  assert.equal(r.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(r.sourceCommit,"7307573841b86b1fb22fd5abfb73a3d461bf0049");
  assert.equal(r.packageSha256,"863ed58adb421ba618d5deace65942397db09fed676f3ef8eec9f9b17871d7d5");
  assert.deepEqual(r.targetFamilies,["COMPOUND","EXCHANGE"]);
  assert.equal(r.upgradeFamilyInformationalOnly,true);
  assert.equal(r.readOnly,true);
  assert.equal(r.gameplayWrites,0);
  assert.equal(r.publicFunctionCalls,0);
  assert.equal(r.rawWriteCalls,0);
  assert.equal(r.sameIntentRetry,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.nextGate,"PR20_8_COMPOUND_EXCHANGE_LIVE_CANDIDATE_READONLY_RESCAN");
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


test("PR20.8 Upgrade productive one-write runner package has a separate aggregate contract boundary", () => {
  const r=prep.pr20_8.upgradeProductiveOneWriteRunner;
  assert.equal(r.status,"COMMITTED_SUCCESS_RETIRED_FROM_ACTIVE_MANIFEST");
  assert.equal(r.package,"werkzeuge/pr20-8-upgrade-productive-one-write-live-v1-0-3.js");
  assert.equal(r.test,"werkzeuge/tests/pr20-8-upgrade-productive-one-write-live-v1-0-3.test.mjs");
  assert.equal(
    r.contract,
    "grundlage/vertraege/runtime/pr20-8-upgrade-productive-one-write-runner-preparation.json",
  );
  assert.equal(
    r.recoveryContract,
    "grundlage/vertraege/runtime/pr20-8-upgrade-productive-one-write-item-definition-recovery-preparation.json",
  );
  assert.equal(
    r.priorRecoveryContract,
    "grundlage/vertraege/runtime/pr20-8-upgrade-productive-one-write-stale-lease-recovery-preparation.json",
  );
  assert.equal(r.testId,"pr20-8-upgrade-productive-one-write-live");
  assert.equal(r.controllerVersion,"1.0.3");
  assert.equal(r.expectedGlobal,"V5PR208UpgradeProductiveOneWriteLive");
  assert.equal(r.exactCandidate,"gloves@0");
  assert.equal(r.exactScroll,"scroll0");
  assert.equal(r.maximumGameplayWrites,1);
  assert.equal(r.maximumPublicFunctionCalls,1);
  assert.equal(r.maximumRawWriteCalls,0);
  assert.equal(r.sameIntentRetry,false);
  assert.equal(r.manifestCutoverPrepared,false);
  assert.equal(r.manifest,"roadmap/v5-autonomous-test-manifest.json");
  assert.equal(
    r.sourceCommit,
    "a4f58c98edc4d794a23346183d6f2375dceb5308",
  );
  assert.equal(
    r.packageSha256,
    "1290b72479eb5683ebab2c1202d09a2d5918a7a1bbf1a1fd190e48f0e2bab3a1",
  );
  assert.equal(r.packageBytes,51544);
  assert.equal(r.deployed,true);
  assert.equal(r.deploymentEvidenceObserved,true);
  assert.equal(r.liveWriteEnabled,false);
  assert.equal(r.realUpgradeMutationPerformed,true);
  assert.equal(r.bridgeMayDeployPinnedRunner,false);
  assert.equal(
    r.nextGate,
    "PR20_8_UPDATER_PERSISTENCE_BOOTSTRAP_REAL_BROWSER_RUN",
  );
  assert.equal(r.previousControllerVersion,"1.0.2");
  assert.equal(r.previousAttemptTelemetryBatchId,8251);
  assert.equal(
    r.previousAttemptBlocker,
    "PR20_8_UPGRADE_LIVE_ITEM_DEFINITION_DRIFT",
  );
  assert.equal(r.previousAttemptGameplayWrites,0);
  assert.equal(r.previousAttemptPublicFunctionCalls,0);
  assert.equal(r.previousAttemptRawWriteCalls,0);
  assert.equal(r.authoritativeUpgradeDefinitionShape,"OBJECT");
  assert.equal(r.evidence,"roadmap/pr20-8-upgrade-productive-one-write-evidence.json");
  assert.equal(r.evidenceTelemetryBatchId,8252);
  assert.equal(r.evidenceObservedControllerVersion,"1.0.3");
  assert.equal(r.evidenceStatus,"BESTANDEN");
  assert.equal(r.evidencePhase,"COMPLETE");
  assert.equal(r.evidenceReconciliation,"COMMITTED_SUCCESS");
  assert.equal(r.evidenceSendCount,1);
  assert.equal(r.evidenceGameplayWrites,1);
  assert.equal(r.evidencePublicFunctionCalls,1);
  assert.equal(r.evidenceRawWriteCalls,0);
  assert.equal(r.evidenceCandidate,"gloves@0->1");
  assert.equal(r.evidenceCandidateIndex,6);
  assert.equal(r.evidenceScroll,"scroll0");
  assert.equal(r.evidenceScrollIndex,14);
  assert.equal(r.evidenceScrollQuantityBefore,36);
  assert.equal(r.evidenceScrollQuantityAfter,35);
  assert.equal(r.normalRuntimeAllowed,false);
});
