import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const prep = lies("grundlage/vertraege/runtime/logistics-transfer-production-preparation.json");
const ingamePolicy = lies("grundlage/vertraege/runtime/ingame-test-execution-policy.json");
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json").bindungen;
const actionContracts = lies("wissensbasis/vertraege/action-contracts.json").contracts;
const produktionsKomposition = fs.readFileSync(
  "grundlage/quelle/runtime/produktions-komposition.ts",
  "utf8",
);
const logistik = fs.readFileSync(
  "grundlage/quelle/merchant/logistik-workflow.ts",
  "utf8",
);
const recipientSettlement = fs.readFileSync(
  "grundlage/quelle/produktion/recipient-settlement.ts",
  "utf8",
);

const erwartete = new Map([
  ["AL-ACTION-SEND-ITEM", ["AL-RECOVERY-SEND-ITEM", "AL-VERIFIER-SEND-ITEM", "send_item"]],
  ["AL-ACTION-SEND-GOLD", ["AL-RECOVERY-SEND-GOLD", "AL-VERIFIER-SEND-GOLD", "send_gold"]],
]);

test("PR20.4 Harness und kuenftige Ingame-Tests laufen AUTO_ON_LOAD", () => {
  assert.equal(prep.testHarness.executionMode, "AUTO_ON_LOAD");
  assert.equal(prep.testHarness.controllerVersion, "1.1.0");
  assert.equal(prep.testHarness.autoStartAfterJavascriptLoad, true);
  assert.equal(prep.testHarness.manualStepClicksRequired, false);
  assert.equal(prep.testHarness.peerVersionGate, true);
  assert.equal(prep.testHarness.productiveTransferAuthority, false);
  assert.equal(prep.testHarness.sameIntentRetry, false);

  assert.equal(ingamePolicy.status, "AKTIV");
  assert.equal(ingamePolicy.executionMode, "AUTO_ON_LOAD");
  assert.equal(ingamePolicy.requirements.automaticStartAfterLoad, true);
  assert.equal(ingamePolicy.requirements.manualPerStepClicks, false);
  assert.equal(ingamePolicy.requirements.liveFunctionBudgetMustRemainHard, true);
  assert.equal(ingamePolicy.requirements.sameIntentRetry, false);
  assert.equal(ingamePolicy.requirements.productiveAuthorityMustNotBeEnabledByTestHarness, true);
});

test("PR20.4 Gesamttest ist vorbereitet; produktive Authority bleibt strikt default-off", () => {
  assert.equal(prep.schemaVersion, 1);
  assert.equal(prep.status, "BEREIT_FUER_INGAME_GESAMTSTUFENTEST");
  assert.equal(prep.authorityGrenze.produktiveRegistrierungErlaubt, false);
  assert.equal(prep.authorityGrenze.produktiverAktivierungspfadErlaubt, false);
  assert.equal(prep.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(prep.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(prep.authorityGrenze.actionAuthority, false);
  assert.equal(prep.authorityGrenze.direkteAdventureLandPublicFunctionAufrufe, 0);
  assert.equal(prep.authorityGrenze.browserGameplayWrites, 0);
  assert.equal(prep.vorstufenAbgeschlossen.pr20_1, true);
  assert.equal(prep.vorstufenAbgeschlossen.pr20_2, true);
  assert.equal(prep.vorstufenAbgeschlossen.pr20_3, true);
  assert.deepEqual(prep.produktiveFreigabeBlockiertBis, [
    "PR20.4_EIGENE_CAPABILITY_OWNER_AUTHORITY_JOURNAL_ADMISSION_PREFLIGHT_SHADOW_LIVE_GATES",
  ]);
});

test("send_item und send_gold besitzen vorhandene R9 Action/Recovery/Verifier-Bindungen", () => {
  assert.equal(prep.kandidaten.length, 2);
  for (const kandidat of prep.kandidaten) {
    const soll = erwartete.get(kandidat.actionContractId);
    assert.ok(soll);
    const binding = bindungen.find(x => x.actionContractId === kandidat.actionContractId);
    assert.ok(binding);
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

test("direkte Transfers sind non-idempotent, recipient-gebunden und niemals blind retrybar", () => {
  for (const id of erwartete.keys()) {
    const contract = actionContracts.find(x => x.id === id);
    assert.ok(contract);
    assert.equal(contract.family, "direct_transfer");
    assert.equal(contract.idempotency, "NON_IDEMPOTENT");
    assert.equal(contract.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
    assert.equal(contract.client.correlationType, "FIFO_DEFERRED");
    assert.equal(contract.client.correlationChannel, "send");
    assert.equal(contract.client.requestId, false);
    assert.ok(contract.resourceDomains.includes("transfer:recipient"));
    assert.ok(contract.liveRevalidation.includes("recipient_entity"));
    assert.ok(contract.liveRevalidation.includes("same_map"));
    assert.ok(contract.liveRevalidation.includes("distance"));
    assert.ok(contract.dangerFlags.includes("UNKNOWN_AFTER_DISCONNECT"));
    assert.ok(contract.postconditions.includes("recipient settlement evidence"));
  }
});

test("Item-Logistik besitzt bereits Restart- und Empfaenger-Settlement-Grenzen", () => {
  for (const marker of [
    'sameTransferErneutSenden: false',
    '"RECOVERY_PENDING"',
    "baselineEmpfaengerInventoryFingerprint",
    "LOGISTIK_SETTLEMENT_ZIEL_DRIFT",
    "LOGISTIK_SETTLEMENT_BASELINE_DRIFT",
    "LOGISTIK_SETTLEMENT_KEIN_NEUER_INVENTARSTAND",
    "LOGISTIK_SETTLEMENT_MENGE_FEHLT",
  ]) assert.ok(logistik.includes(marker), marker);

  for (const marker of [
    "recipientSessionId",
    "rosterEpoche",
    "baselineFingerprint",
    "RECIPIENT_SETTLEMENT_ZIEL_DRIFT",
    "RECIPIENT_SETTLEMENT_KEIN_NEUER_INVENTARSTAND",
    "RECIPIENT_SETTLEMENT_MENGE_NICHT_BESTAETIGT",
  ]) assert.ok(recipientSettlement.includes(marker), marker);
});

test("Goldtransfer besitzt jetzt einen authority-freien Empfaenger-Gold-Settlement-Core", () => {
  assert.equal(
    prep.recipientSettlement.gold.status,
    "FOUNDATION_IMPLEMENTIERT_NO_WRITE",
  );
  assert.equal(
    prep.recipientSettlement.gold.quelle,
    "grundlage/quelle/merchant/gold-transfer-settlement.ts",
  );
  assert.equal(prep.recipientSettlement.gold.produktiveAuthority, false);
  assert.ok(prep.recipientSettlement.gold.minimum.includes("baseline recipient gold + fingerprint"));
  const sendGold = actionContracts.find(x => x.id === "AL-ACTION-SEND-GOLD");
  assert.ok(sendGold.postconditions.includes("gold sender delta"));
  assert.ok(sendGold.postconditions.includes("recipient settlement evidence"));
});

test("send_cx und send_mail bleiben ausserhalb des ersten Merchant-Transfersatzes", () => {
  for (const id of ["AL-ACTION-SEND-CX", "AL-ACTION-SEND-MAIL"]) {
    assert.equal(prep.kandidaten.some(x => x.actionContractId === id), false);
    assert.ok(prep.bewusstZurueckgestellt.some(x => x.actionContractId === id));
  }
  const mail = actionContracts.find(x => x.id === "AL-ACTION-SEND-MAIL");
  assert.ok(mail);
  assert.ok(mail.dangerFlags.includes("ASYNC_BACKEND_TX"));
  assert.equal(mail.client.requestId, true);
});

test("Produktionskomposition registriert waehrend PR20.4-Vorbereitung keine Transfermutation", () => {
  for (const kandidat of prep.kandidaten) {
    assert.equal(produktionsKomposition.includes(kandidat.publicFunction), false);
    assert.equal(produktionsKomposition.includes(kandidat.actionContractId), false);
  }
  for (const marker of [
    "merchant.logistik.mutieren",
    "sendItemMutations",
    "sendGoldMutations",
  ]) assert.equal(produktionsKomposition.includes(marker), false);
});
