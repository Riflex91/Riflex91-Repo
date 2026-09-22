import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const prep = lies("grundlage/vertraege/runtime/bank-production-preparation.json");
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json");
const actionContracts = lies("wissensbasis/vertraege/action-contracts.json");
const produktionsKomposition = fs.readFileSync(
  "grundlage/quelle/runtime/produktions-komposition.ts",
  "utf8",
);
const postR19Roadmap = lies("roadmap/post-r19-roadmap.json");

const erwartete = new Map([
  ["AL-ACTION-BANK-DEPOSIT", ["AL-RECOVERY-BANK-DEPOSIT", "AL-VERIFIER-BANK-DEPOSIT", "bank_deposit"]],
  ["AL-ACTION-BANK-WITHDRAW", ["AL-RECOVERY-BANK-WITHDRAW", "AL-VERIFIER-BANK-WITHDRAW", "bank_withdraw"]],
  ["AL-ACTION-BANK-STORE", ["AL-RECOVERY-BANK-STORE", "AL-VERIFIER-BANK-STORE", "bank_store"]],
  ["AL-ACTION-BANK-RETRIEVE", ["AL-RECOVERY-BANK-RETRIEVE", "AL-VERIFIER-BANK-RETRIEVE", "bank_retrieve"]],
  ["AL-ACTION-BANK-SWAP", ["AL-RECOVERY-BANK-SWAP", "AL-VERIFIER-BANK-SWAP", "bank_swap"]],
]);

test("PR20.2 dokumentiert aktuellen 4/5-Live- und 5m-Closeout fail-closed", () => {
  assert.equal(prep.schemaVersion, 1);
  assert.equal(
    prep.status,
    "FIRST_BANK_MUTATION_SET_4_OF_5_LIVE_BESTANDEN_NO_WRITE_5M_BESTANDEN_BLOCKED",
  );
  assert.equal(prep.blockingGate, "PR20.1_EQUIP_PRODUKTIONSNACHWEIS");
  assert.equal(prep.blockingGateStatus, "BESTANDEN");
  assert.equal(prep.authorityGrenze.produktiveRegistrierungErlaubt, true);
  assert.equal(prep.authorityGrenze.produktiverAktivierungspfadErlaubt, false);
  assert.equal(prep.authorityGrenze.oneShotAuthorityAusstellungImplementiert, true);
  assert.equal(prep.authorityGrenze.oneShotMaxVerwendungen, 1);
  assert.equal(prep.authorityGrenze.oneShotMaxLebensdauerMs, 2000);
  assert.equal(prep.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(prep.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(prep.authorityGrenze.actionAuthority, false);
  assert.equal(prep.authorityGrenze.direkteAdventureLandPublicFunctionAufrufe, 1);
  assert.equal(prep.authorityGrenze.browserGameplayWrites, 1);
  assert.equal(prep.authorityGrenze.persistenteBankLeaseImplementiert, true);
  assert.equal(prep.authorityGrenze.restartReconciliationImplementiert, true);
  assert.equal(prep.authorityGrenze.r9AdmissionShadowImplementiert, true);
  assert.equal(prep.authorityGrenze.shadowGameplayWrites, 0);
  assert.equal(prep.authorityGrenze.restartRecoveryRealEvidence, "BESTANDEN");
  assert.equal(
    prep.authorityGrenze.restartRecoveryEvidencePfad,
    "roadmap/pr20-2-bank-shadow-recovery-evidence.json",
  );
  assert.equal(prep.authorityGrenze.realBrowserShadowLiveEvidence, "BESTANDEN");
  assert.equal(prep.authorityGrenze.writeAdapterImplementiert, true);
  assert.equal(prep.authorityGrenze.liveRunnerImplementiert, true);
  assert.equal(prep.authorityGrenze.exakterLiveBetragGold, 1);
  assert.equal(prep.authorityGrenze.maximaleAdapterAufrufe, 1);
  assert.equal(prep.authorityGrenze.maximaleGameplayWrites, 1);
  assert.equal(prep.authorityGrenze.sameIntentRetry, false);
  assert.equal(prep.authorityGrenze.realLiveWritePerformed, true);
  assert.equal(prep.authorityGrenze.liveEvidence, "BESTANDEN");
  assert.equal(
    prep.authorityGrenze.liveEvidencePfad,
    "roadmap/pr20-2-bank-deposit-production-evidence.json",
  );
  assert.equal(
    prep.authorityGrenze.testedSourceSha,
    "a540d4107343a87b9d8ef5f3f301b3bbad819c4c",
  );
  assert.equal(
    prep.authorityGrenze.liveTransactionId,
    "BANK-DEPOSIT-PROD-TX-1790013959392-9c25f657",
  );
  assert.equal(prep.authorityGrenze.actualAdapterCalls, 1);
  assert.equal(prep.authorityGrenze.actualGameplayWrites, 1);
  assert.equal(prep.authorityGrenze.liveJournalTerminalArt, "COMMIT");
  assert.equal(prep.authorityGrenze.liveRecovery, "COMMITTED");
  assert.equal(prep.authorityGrenze.liveRecoveryKlassifikation, "BESTAETIGT");
  assert.equal(prep.authorityGrenze.liveLeaseEpoche, 3);
  assert.equal(prep.authorityGrenze.liveLeaseTerminalStatus, "RELEASED");
  assert.equal(
    prep.authorityGrenze.realBrowserShadowEvidencePfad,
    "roadmap/pr20-2-bank-real-browser-shadow-evidence.json",
  );
  assert.equal(prep.bestehendePlanung.capabilityId, "merchant.bank.planen");
  assert.equal(prep.bestehendePlanung.mutationsAuthorityAusPlanung, false);
});


test("PR20.2 erster Live-Kandidat ist eng auf bank_deposit(1) begrenzt", () => {
  const kandidat = prep.ersterLiveKandidat;
  assert.ok(kandidat);
  assert.equal(kandidat.status, "BESTANDEN");
  assert.equal(kandidat.publicFunction, "bank_deposit");
  assert.equal(kandidat.betragGold, 1);
  assert.equal(kandidat.actionContractId, "AL-ACTION-BANK-DEPOSIT");
  assert.equal(kandidat.recoveryContractId, "AL-RECOVERY-BANK-DEPOSIT");
  assert.equal(kandidat.verifierId, "AL-VERIFIER-BANK-DEPOSIT");
  assert.equal(kandidat.sameIntentRetry, false);
  assert.equal(kandidat.gameplayAutoritaet, false);
  assert.equal(kandidat.rawWriteAutoritaet, false);
  assert.equal(kandidat.provider, "merchant-bank-core@1");
  assert.equal(kandidat.capabilityId, "merchant.bank.gold_einlagern");
  assert.equal(kandidat.produktiveCapabilityNochNichtRegistriert, false);
  assert.equal(kandidat.oneShotAuthorityImplementiert, true);
  assert.equal(kandidat.currentFenceImplementiert, true);
  assert.equal(kandidat.readOnlyPreflightImplementiert, true);
  assert.equal(kandidat.persistentBankLease, true);
  assert.equal(kandidat.restartReconciliation, true);
  assert.equal(kandidat.r9AdmissionShadow, true);
  assert.equal(kandidat.shadowGameplayWrites, 0);
  assert.equal(kandidat.restartRecoveryRealEvidence, "BESTANDEN");
  assert.equal(
    kandidat.restartRecoveryEvidencePfad,
    "roadmap/pr20-2-bank-shadow-recovery-evidence.json",
  );
  assert.equal(kandidat.realBrowserShadowLiveEvidence, "BESTANDEN");
  assert.equal(
    kandidat.realBrowserShadowEvidencePfad,
    "roadmap/pr20-2-bank-real-browser-shadow-evidence.json",
  );
  assert.equal(kandidat.writeAdapterNochNichtVorhanden, false);
  assert.equal(kandidat.liveRunnerNochNichtVorhanden, false);
  assert.equal(kandidat.writeAdapterImplementiert, true);
  assert.equal(kandidat.liveRunnerImplementiert, true);
  assert.equal(kandidat.exakterLiveBetragGold, 1);
  assert.equal(kandidat.maximaleAdapterAufrufe, 1);
  assert.equal(kandidat.maximaleGameplayWrites, 1);
  assert.equal(kandidat.sameIntentRetry, false);
  assert.equal(kandidat.realLiveWritePerformed, true);
  assert.equal(kandidat.liveEvidence, "BESTANDEN");
  assert.equal(
    kandidat.liveEvidencePfad,
    "roadmap/pr20-2-bank-deposit-production-evidence.json",
  );
  assert.equal(
    kandidat.testedSourceSha,
    "a540d4107343a87b9d8ef5f3f301b3bbad819c4c",
  );
  assert.equal(
    kandidat.liveTransactionId,
    "BANK-DEPOSIT-PROD-TX-1790013959392-9c25f657",
  );
  assert.equal(kandidat.actualAdapterCalls, 1);
  assert.equal(kandidat.actualGameplayWrites, 1);
  assert.equal(kandidat.liveJournalTerminalArt, "COMMIT");
  assert.equal(kandidat.liveRecovery, "COMMITTED");
  assert.equal(kandidat.liveRecoveryKlassifikation, "BESTAETIGT");
  assert.equal(kandidat.liveLeaseEpoche, 3);
  assert.equal(kandidat.liveLeaseTerminalStatus, "RELEASED");
});

test("PR20.2 Kandidaten besitzen exakt vorhandene R9 Action/Recovery/Verifier-Bindungen", () => {
  assert.equal(prep.kandidaten.length, erwartete.size);
  const r9 = bindungen.bindungen ?? bindungen.actionBindungen ?? bindungen.actions ?? [];
  assert.ok(Array.isArray(r9) && r9.length > 0);

  for (const kandidat of prep.kandidaten) {
    const soll = erwartete.get(kandidat.actionContractId);
    assert.ok(soll, "unerwarteter Bankkandidat " + kandidat.actionContractId);
    const binding = r9.find(x => x.actionContractId === kandidat.actionContractId);
    assert.ok(binding, "R9-Bindung fehlt: " + kandidat.actionContractId);
    assert.deepEqual(
      [binding.recoveryContractId, binding.verifierId, binding.publicFunction],
      soll,
    );
    assert.deepEqual(
      [kandidat.recoveryContractId, kandidat.verifierId, kandidat.publicFunction],
      soll,
    );
  }
});

test("PR20.2 Kandidaten sind verifizierte non-idempotente Bankactions ohne Blind-Retry", () => {
  const contracts = actionContracts.contracts ?? [];
  for (const kandidat of prep.kandidaten) {
    const contract = contracts.find(x => x.id === kandidat.actionContractId);
    assert.ok(contract, "Action Contract fehlt: " + kandidat.actionContractId);
    assert.equal(contract.status, "VERIFIED_SOURCE_SNAPSHOT");
    assert.equal(contract.family, "bank");
    assert.equal(contract.idempotency, "NON_IDEMPOTENT");
    assert.equal(contract.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
    assert.equal(contract.client?.correlationChannel, "bank");
    assert.equal(contract.client?.requestId, false);
    assert.ok(contract.resourceDomains?.includes("account:bank_lease"));
    assert.ok(contract.resourceDomains?.includes("character:socket_call_budget"));
    assert.ok(contract.liveRevalidation?.includes("character"));
    assert.ok(contract.liveRevalidation?.includes("bank"));
    assert.ok(contract.dangerFlags?.includes("BANK_MOUNT_REQUIRED"));
    assert.ok(contract.dangerFlags?.includes("LIMITDC_AFTER_SEND_CAN_BE_UNKNOWN"));
  }
});

test("open_bank_pack bleibt wegen eigener Capacity-/Backend-Risiken bewusst ausserhalb des ersten Satzes", () => {
  assert.equal(
    prep.kandidaten.some(x => x.actionContractId === "AL-ACTION-OPEN-BANK-PACK"),
    false,
  );
  const deferred = prep.bewusstZurueckgestellt.find(
    x => x.actionContractId === "AL-ACTION-OPEN-BANK-PACK",
  );
  assert.ok(deferred);
  const contract = actionContracts.contracts.find(
    x => x.id === "AL-ACTION-OPEN-BANK-PACK",
  );
  assert.ok(contract);
  assert.ok(contract.dangerFlags.includes("ASYNC_BACKEND_TX"));
  assert.equal(contract.idempotency, "NON_IDEMPOTENT");
});

test("PR20.2 bank_withdraw(1) ist nach zwei Funktionstests fail-closed und CODE-Bridge read-only bestaetigt", () => {
  const kandidat = prep.naechsterLiveKandidat;
  const vertrag = lies(
    "grundlage/vertraege/runtime/bank-withdraw-production-candidate.json",
  );
  assert.ok(kandidat);
  assert.equal(kandidat.status, "TWO_TEST_LIMIT_REACHED_CODE_BRIDGE_READ_ONLY_BESTAETIGT");
  assert.equal(kandidat.publicFunction, "bank_withdraw");
  assert.equal(kandidat.betragGold, 1);
  assert.equal(kandidat.actionContractId, "AL-ACTION-BANK-WITHDRAW");
  assert.equal(kandidat.recoveryContractId, "AL-RECOVERY-BANK-WITHDRAW");
  assert.equal(kandidat.verifierId, "AL-VERIFIER-BANK-WITHDRAW");
  assert.equal(kandidat.sameIntentRetry, false);
  assert.equal(kandidat.gameplayAutoritaet, false);
  assert.equal(kandidat.rawWriteAutoritaet, false);
  assert.equal(kandidat.produktiveCapabilityImplementiert, true);
  assert.equal(kandidat.oneShotAuthorityImplementiert, true);
  assert.equal(kandidat.oneShotMaxVerwendungen, 1);
  assert.equal(kandidat.oneShotMaxLebensdauerMs, 2000);
  assert.equal(kandidat.currentFenceImplementiert, true);
  assert.equal(kandidat.readOnlyPreflightImplementiert, true);
  assert.equal(kandidat.preflightBrowserGameplayWrites, 0);
  assert.equal(kandidat.preflightAuthorityAusstellung, false);
  assert.equal(kandidat.admissionShadowImplementiert, true);
  assert.equal(kandidat.shadowSendBoundaryState, "NICHT_GESENDET");
  assert.equal(kandidat.shadowGameplayWrites, 0);
  assert.equal(kandidat.shadowAdapterAufrufe, 0);
  assert.equal(kandidat.realBrowserShadowRunnerImplementiert, true);
  assert.equal(
    kandidat.realBrowserShadowRunner,
    "werkzeuge/bank-withdraw-real-browser-shadow.mjs",
  );
  assert.equal(kandidat.realBrowserShadowSourceShaPinning, true);
  assert.equal(kandidat.realBrowserShadowGameplayWrites, 0);
  assert.equal(kandidat.realBrowserShadowAdapterAufrufe, 0);
  assert.equal(kandidat.realBrowserShadowEvidence, "BESTANDEN");
  assert.equal(
    kandidat.realBrowserShadowEvidencePfad,
    "roadmap/pr20-2-bank-withdraw-real-browser-shadow-evidence.json",
  );
  assert.equal(
    kandidat.realBrowserShadowTestedSourceSha,
    "15620374566b83c9532e492d63e15c2fed6709e5",
  );
  assert.equal(kandidat.realBrowserShadowLeaseEpoche, 4);
  assert.equal(kandidat.realBrowserShadowLeaseTerminalStatus, "RELEASED");
  assert.equal(kandidat.realBrowserShadowSendBoundaryState, "NICHT_GESENDET");
  assert.equal(kandidat.writeAdapterImplementiert, true);
  assert.equal(kandidat.writeAdapter, "werkzeuge/bank-withdraw-produktions-write-browser.mjs");
  assert.equal(kandidat.liveRunnerImplementiert, true);
  assert.equal(kandidat.liveRunner, "werkzeuge/bank-withdraw-produktions-live.mjs");
  assert.equal(kandidat.sourceLockedWritePreflight, true);
  assert.equal(kandidat.realLiveWritePerformed, true);
  assert.equal(kandidat.gameplayWritesInDiesemSchritt, 1);
  assert.equal(kandidat.functionalTestLimit, 2);
  assert.equal(kandidat.functionalTestsConsumed, 2);
  assert.equal(kandidat.additionalFunctionalTestAllowed, false);
  assert.equal(kandidat.liveEvidence, "NICHT_BESTANDEN_TESTLIMIT_ERREICHT");
  assert.equal(kandidat.liveEvidencePfad, "roadmap/pr20-2-bank-withdraw-two-test-limit-bridge-evidence.json");
  assert.equal(kandidat.correctedCodeBridgeReadOnlyEvidence, "BESTANDEN");
  assert.equal(kandidat.officialCodeBridge, "call_code_function_f");
  assert.equal(kandidat.productionWideActivationAllowed, false);
  assert.equal(vertrag.publicFunction, "bank_withdraw");
  assert.equal(vertrag.settlement.characterGoldDelta, 1);
  assert.equal(vertrag.settlement.bankGoldDelta, -1);
  assert.equal(vertrag.settlement.sameIntentRetry, false);
  assert.equal(vertrag.authorityGrenze.produktiveCapabilityInDiesemSchritt, true);
  assert.equal(vertrag.authorityGrenze.authorityInDiesemSchritt, true);
  assert.equal(vertrag.authorityGrenze.adapterInDiesemSchritt, true);
  assert.equal(vertrag.authorityGrenze.liveRunnerInDiesemSchritt, true);
  assert.equal(vertrag.authorityGrenze.gameplayWritesInDiesemSchritt, 1);
  assert.equal(vertrag.writeGate.realLiveWritePerformed, true);
  assert.equal(vertrag.writeGate.liveWriteEvidence, "NICHT_BESTANDEN_TESTLIMIT_ERREICHT");
  assert.equal(vertrag.writeGate.functionalTestLimit, 2);
  assert.equal(vertrag.writeGate.functionalTestsConsumed, 2);
  assert.equal(vertrag.writeGate.additionalFunctionalTestAllowed, false);
  assert.equal(vertrag.writeGate.officialCodeBridge, "call_code_function_f");
  assert.equal(vertrag.writeGate.codeBridgeReadOnlyEvidence, "BESTANDEN");
  assert.equal(vertrag.writeGate.productionWideActivationAllowed, false);
  assert.equal(vertrag.writeGate.publicFunctionCallCountStatic, 1);
});

test("Post-R19-Roadmap spiegelt Withdraw-Testlimit und Bridge-Closeout konsistent", () => {
  const status = "TWO_TEST_LIMIT_REACHED_CODE_BRIDGE_READ_ONLY_BESTAETIGT";
  const next = postR19Roadmap.parallelPreparation?.nextLiveCandidate;
  assert.ok(next);
  assert.equal(next.status, status);
  assert.equal(next.writeAdapter, true);
  assert.equal(next.liveRunner, true);
  assert.equal(next.gameplayWritesInThisStep, 0);
  assert.equal(next.functionalTestLimit, 2);
  assert.equal(next.functionalTestsConsumed, 2);
  assert.equal(next.additionalFunctionalTestAllowed, false);
  assert.equal(next.correctedCodeBridgeReadOnlyEvidence, "BESTANDEN");
  assert.equal(next.productionWideActivationAllowed, false);
  assert.equal(next.sameIntentRetry, false);

  for (const prep of postR19Roadmap.parallelPreparations ?? []) {
    if (prep?.nextLiveCandidate?.publicFunction !== "bank_withdraw") continue;
    assert.equal(prep.nextLiveCandidate.status, status);
    assert.equal(prep.nextLiveCandidate.writeAdapter, true);
    assert.equal(prep.nextLiveCandidate.liveRunner, true);
    assert.equal(prep.nextLiveCandidate.gameplayWritesInThisStep, 0);
    assert.equal(prep.nextLiveCandidate.functionalTestsConsumed, 2);
    assert.equal(prep.nextLiveCandidate.additionalFunctionalTestAllowed, false);
    assert.equal(prep.nextLiveCandidate.sameIntentRetry, false);
  }

  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateStatus, status);
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateAdapterImplemented, true);
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateLiveRunnerImplemented, true);
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateGameplayWrites, 1);
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateFunctionalTestsConsumed, 2);
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateAdditionalFunctionalTestAllowed, false);
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateCodeBridgeReadOnlyEvidence, "BESTANDEN");
  assert.equal(postR19Roadmap.pr20_2?.nextLiveCandidateProductionWideActivationAllowed, false);
});

test("Produktionskomposition registriert Deposit und Withdraw unter demselben Bank-Single-Owner default-off", () => {
  assert.ok(
    produktionsKomposition.includes(
      "merchantBankDepositMutationsFaehigkeitDefinition",
    ),
  );
  assert.ok(produktionsKomposition.includes("merchantBankCoreModulDefinition"));
  assert.ok(
    produktionsKomposition.includes(
      "merchantBankWithdrawMutationsFaehigkeitDefinition",
    ),
  );
  assert.equal(produktionsKomposition.includes("bank_withdraw("), false);
  assert.equal(produktionsKomposition.includes("bank_store"), false);
  assert.equal(produktionsKomposition.includes("bank_retrieve"), false);
  assert.equal(produktionsKomposition.includes("bank_swap"), false);
  assert.equal(produktionsKomposition.includes("open_bank_pack"), false);
  assert.equal(produktionsKomposition.includes("merchant.bank.mutieren"), false);
  assert.equal(produktionsKomposition.includes("bankMutations"), false);
});


test("PR20.2 Produktionsvertrag spiegelt bestandenen Bank-NO-WRITE-5M-Lauf", () => {
  assert.equal(prep.noWrite5m.status, "BESTANDEN_REAL_INGAME_READ_ONLY");
  assert.equal(prep.noWrite5m.controllerVersion, "1.0.1");
  assert.equal(
    prep.noWrite5m.evidencePfad,
    "roadmap/pr20-2-bank-no-write-5m-evidence.json",
  );
  assert.equal(prep.noWrite5m.dauerMs, 300017);
  assert.equal(prep.noWrite5m.sampleAnzahl, 21);
  assert.equal(prep.noWrite5m.sampleGaps, 0);
  assert.equal(prep.noWrite5m.driftSamples, 0);
  assert.equal(prep.noWrite5m.performanceTrickFehler, 0);
  assert.equal(prep.noWrite5m.gameplayWrites, 0);
  assert.equal(prep.noWrite5m.mutatingPublicFunctionCalls, 0);
  assert.equal(prep.noWrite5m.functionalTestBudgetConsumed, false);
  assert.equal(prep.noWrite5m.integration15mRequiredNow, false);
});

test("PR20.2 Produktionsvertrag verlangt aktuell keinen weiteren Ingame-Test", () => {
  assert.equal(
    prep.blockerCloseout.status,
    "BLOCKIERT_FAIL_CLOSED_NO_FURTHER_INGAME_TEST_JUSTIFIED",
  );
  assert.equal(
    prep.blockerCloseout.evidencePfad,
    "roadmap/pr20-2-bank-blocker-closeout.json",
  );
  assert.equal(prep.blockerCloseout.weitereIngameTestsJetztErforderlich, false);
  assert.equal(prep.pr20_2ExitGate.status, "BLOCKIERT_FAIL_CLOSED");
  assert.deepEqual(prep.pr20_2ExitGate.blocker, [
    "BANK_WITHDRAW_LIVE_EVIDENCE_UNVOLLSTAENDIG_TESTLIMIT_2_OF_2",
    "OPEN_BANK_PACK_RESOURCE_BLOCKED_NO_LIVE",
  ]);
  assert.equal(prep.pr20_2ExitGate.noWrite5mStatus, "BESTANDEN_REAL_INGAME_READ_ONLY");
  assert.equal(prep.pr20_2ExitGate.integration15mRequiredNow, false);
  assert.equal(prep.pr20_2ExitGate.weitereIngameTestsJetztErforderlich, false);
  assert.equal(prep.pr20_2ExitGate.breiteBankAktivierungErlaubt, false);
  assert.equal(prep.pr20_2ExitGate.pr20_3MarktStartErlaubt, false);
  assert.equal(prep.pr20_2ExitGate.sameIntentRetry, false);
});
