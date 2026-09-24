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
