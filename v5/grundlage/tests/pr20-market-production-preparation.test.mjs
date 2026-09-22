import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const prep = lies("grundlage/vertraege/runtime/market-production-preparation.json");
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json").bindungen;
const actionContracts = lies("wissensbasis/vertraege/action-contracts.json").contracts;
const produktionsKomposition = fs.readFileSync(
  "grundlage/quelle/runtime/produktions-komposition.ts",
  "utf8",
);

const erwartete = new Map([
  ["AL-ACTION-BUY", ["AL-RECOVERY-BUY", "AL-VERIFIER-BUY", "buy"]],
  ["AL-ACTION-SELL", ["AL-RECOVERY-SELL", "AL-VERIFIER-SELL", "sell"]],
  ["AL-ACTION-TRADE-BUY", ["AL-RECOVERY-TRADE-BUY", "AL-VERIFIER-TRADE-BUY", "trade_buy"]],
  ["AL-ACTION-TRADE-SELL", ["AL-RECOVERY-TRADE-SELL", "AL-VERIFIER-TRADE-SELL", "trade_sell"]],
]);

test("PR20.3 Testkette ist nach breiter PR20.2-Freigabe NO-WRITE startbereit", () => {
  assert.equal(prep.schemaVersion, 1);
  assert.equal(prep.status, "STUFENTEST_VORBEREITET_EIN_MERGE");
  assert.deepEqual(prep.produktiveFreigabeBlockiertBis, [
    "PR20.3_EIGENE_CAPABILITY_AUTHORITY_JOURNAL_ADMISSION_SHADOW_LIVE_GATES",
  ]);
  assert.equal(
    prep.pr20_2Transition.status,
    "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN",
  );
  assert.equal(prep.pr20_2Transition.broadBankActivationAllowed, true);
  assert.equal(prep.pr20_2Transition.bankExceptionsRemainLocallyGated, true);
  assert.equal(prep.authorityGrenze.produktiveRegistrierungErlaubt, false);
  assert.equal(prep.authorityGrenze.produktiverAktivierungspfadErlaubt, false);
  assert.equal(prep.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(prep.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(prep.authorityGrenze.actionAuthority, false);
  assert.equal(prep.authorityGrenze.direkteAdventureLandPublicFunctionAufrufe, 0);
  assert.equal(prep.authorityGrenze.browserGameplayWrites, 0);
  assert.equal(prep.ersterLiveKandidat.publicFunction, "buy_with_gold");
  assert.equal(prep.ersterLiveKandidat.menge, 1);
  assert.equal(prep.ersterLiveKandidat.route, "GOLD_ONLY");
  assert.equal(
    prep.ersterLiveKandidat.testHarness,
    "werkzeuge/pr20-3-market-buy-gold-step-test-paket.js",
  );
  assert.equal(prep.ersterLiveKandidat.testHarnessSchritte, 7);
  assert.equal(prep.ersterLiveKandidat.mergeZwischenTestschrittenErforderlich, false);
  assert.equal(prep.ersterLiveKandidat.maxTrueTests, 2);
  assert.equal(prep.ersterLiveKandidat.produktiveGameplayAutoritaet, false);
  assert.equal(
    prep.naechsterVorbereiteterKandidat.status,
    "VORBEREITET_WARTET_AUF_BUY_GOLD_7_OF_7",
  );
  assert.equal(prep.naechsterVorbereiteterKandidat.publicFunction, "sell");
  assert.equal(prep.naechsterVorbereiteterKandidat.menge, 1);
  assert.equal(
    prep.naechsterVorbereiteterKandidat.sourceBuyStateKey,
    "AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1",
  );
  assert.equal(
    prep.naechsterVorbereiteterKandidat.testHarness,
    "werkzeuge/pr20-3-market-sell-step-test-paket.js",
  );
  assert.equal(prep.naechsterVorbereiteterKandidat.testHarnessSchritte, 7);
  assert.equal(
    prep.naechsterVorbereiteterKandidat.mergeZwischenTestschrittenErforderlich,
    false,
  );
  assert.equal(prep.naechsterVorbereiteterKandidat.maxTrueTests, 2);
  assert.equal(prep.naechsterVorbereiteterKandidat.produktiveGameplayAutoritaet, false);
  assert.equal(prep.naechsterVorbereiteterKandidat.sameIntentRetry, false);
});

test("PR20.3 Kandidaten besitzen exakt vorhandene R9 Action/Recovery/Verifier-Bindungen", () => {
  assert.equal(prep.kandidaten.length, erwartete.size);
  for (const kandidat of prep.kandidaten) {
    const soll = erwartete.get(kandidat.actionContractId);
    assert.ok(soll, "unerwarteter Marktkandidat " + kandidat.actionContractId);
    const binding = bindungen.find(x => x.actionContractId === kandidat.actionContractId);
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

test("PR20.3 Kandidaten sind non-idempotent und nach moeglichem Send niemals blind retrybar", () => {
  for (const kandidat of prep.kandidaten) {
    const contract = actionContracts.find(x => x.id === kandidat.actionContractId);
    assert.ok(contract, "Action Contract fehlt: " + kandidat.actionContractId);
    assert.equal(contract.status, "VERIFIED_SOURCE_SNAPSHOT");
    assert.equal(contract.idempotency, "NON_IDEMPOTENT");
    assert.equal(contract.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
    assert.ok(Array.isArray(contract.postconditions) && contract.postconditions.length > 0);
  }
  assert.equal(prep.transaktionsRegeln.sameIntentRetry, false);
  assert.equal(prep.transaktionsRegeln.ridIstIdempotencyKey, false);
  assert.equal(prep.transaktionsRegeln.ridIstQuantityVersion, false);
});

test("Player-Market-Pfade erzwingen RID-/Listing-/Item-Drift-Grenzen", () => {
  const buy = actionContracts.find(x => x.id === "AL-ACTION-TRADE-BUY");
  const sell = actionContracts.find(x => x.id === "AL-ACTION-TRADE-SELL");
  for (const contract of [buy, sell]) {
    assert.ok(contract);
    assert.equal(contract.family, "player_market_trade");
    assert.ok(contract.liveRevalidation.includes("listing_rid"));
    assert.ok(contract.liveRevalidation.includes("quantity"));
    assert.ok(contract.dangerFlags.includes("RID_GUARD"));
    assert.ok(contract.dangerFlags.includes("RID_NOT_QUANTITY_VERSION"));
    assert.ok(contract.dangerFlags.includes("PARTIAL_FILL_RID_STABLE"));
    assert.ok(contract.dangerFlags.includes("REMOTE_LISTING_MUTABLE_BY_OTHERS"));
  }
  assert.ok(sell.liveRevalidation.includes("server_selected_item_candidate"));
  assert.ok(sell.dangerFlags.includes("SERVER_SELECTS_FIRST_MATCHING_ITEM"));
  assert.ok(sell.dangerFlags.includes("PHYSICAL_ITEM_VARIANT_AMBIGUITY"));
});

test("NPC Sell bleibt destruktiv und physisch/evidence-gebunden", () => {
  const sell = actionContracts.find(x => x.id === "AL-ACTION-SELL");
  assert.ok(sell);
  assert.equal(sell.family, "npc_sale");
  assert.ok(sell.liveRevalidation.includes("inventory_item_identity"));
  assert.ok(sell.dangerFlags.includes("DESTRUCTIVE"));
  assert.ok(sell.dangerFlags.includes("INVENTORY_INDEX_DRIFT"));
  assert.equal(sell.client.correlationChannel, "sell");
  assert.equal(sell.client.requestId, false);
});

test("buy_secondhand bleibt ausserhalb des ersten PR20.3-Satzes", () => {
  assert.equal(
    prep.kandidaten.some(x => x.actionContractId === "AL-ACTION-BUY-SECONDHAND"),
    false,
  );
  const deferred = prep.bewusstZurueckgestellt.find(
    x => x.actionContractId === "AL-ACTION-BUY-SECONDHAND",
  );
  assert.ok(deferred);
  const contract = actionContracts.find(x => x.id === "AL-ACTION-BUY-SECONDHAND");
  assert.ok(contract);
  assert.equal(contract.client.correlationType, "REQUEST_ID");
  assert.equal(contract.client.requestId, true);
});

test("Produktionskomposition registriert waehrend PR20.3-Vorbereitung keine Marketmutation", () => {
  assert.ok(produktionsKomposition.includes("equipmentEquipMutationsFaehigkeitDefinition"));
  for (const kandidat of prep.kandidaten) {
    assert.equal(produktionsKomposition.includes(kandidat.publicFunction), false);
    assert.equal(produktionsKomposition.includes(kandidat.actionContractId), false);
  }
  for (const marker of [
    "merchant.markt.mutieren",
    "merchant.verkauf.mutieren",
    "tradeBuyMutations",
    "tradeSellMutations",
  ]) {
    assert.equal(produktionsKomposition.includes(marker), false);
  }
});
