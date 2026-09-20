import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const pflicht = [
  "grundlage/quelle/merchant/werttransaktion.ts",
  "grundlage/quelle/merchant/item-mutations-planer.ts",
  "grundlage/tests/r15-item-mutations-planer.test.mjs",
  "grundlage/tests/r15-production-graph.test.mjs",
  "grundlage/tests/r15-logistik-gear.test.mjs",
  "grundlage/quelle/produktion/production-graph.ts",
  "grundlage/quelle/produktion/bank-katalog.ts",
  "grundlage/quelle/merchant/gear-allokation.ts",
  "grundlage/quelle/merchant/gear-progression.ts",
  "grundlage/tests/r15-gear-progression.test.mjs",
  "grundlage/quelle/merchant/logistik-workflow.ts",
  "grundlage/quelle/merchant/supply-policy.ts",
  "grundlage/quelle/produktion/recipient-settlement.ts",
  "grundlage/quelle/produktion/production-intent.ts",
  "grundlage/tests/r15-werttransaktion.test.mjs",
  "grundlage/tests/r15-production-settlement.test.mjs",
  "dokumentation/P0-05-UPGRADE-COMPOUND.md",
  "dokumentation/P0-06-EXCHANGE-CRAFT-OUTPUTSPACE.md",
];
for (const pfad of pflicht) {
  if (!fs.existsSync(pfad)) fehler.push("PFLICHTARTEFAKT_FEHLT:" + pfad);
}

const logistik = liesText("grundlage/quelle/merchant/logistik-workflow.ts");
for (const marker of [
  "MerchantLogistikLedger",
  "RENDEZVOUS_AUSSTEHEND",
  "LOGISTIK_SETTLEMENT_BASELINE_DRIFT",
  "sameTransferErneutSenden: false",
  "RECOVERY_PENDING",
]) {
  if (!logistik.includes(marker)) fehler.push("LOGISTIK_MARKER_FEHLT:" + marker);
}

const gear = liesText("grundlage/quelle/merchant/gear-allokation.ts");
for (const marker of [
  "GearAllokationsLedger",
  "GEAR_KANDIDAT_BEREITS_RESERVIERT",
  "GEAR_RECIPIENT_SLOT_BEREITS_BELEGT",
  "FARMER",
  "RECOVERY_PENDING",
  "bereinigeAbgelaufene",
  "ABGEBROCHEN",
]) {
  if (!gear.includes(marker)) fehler.push("GEAR_MARKER_FEHLT:" + marker);
}

const gearProgression = liesText("grundlage/quelle/merchant/gear-progression.ts");
for (const marker of [
  "planeUndReserviereGearProgression",
  "farmerVorMerchantSelf: true",
  "KANDIDAT_BEREITS_RESERVIERT",
  "RECIPIENT_SLOT_BEREITS_BELEGT",
  "EVIDENCE_STALE",
  "ausfuehrungsAutoritaet: false",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!gearProgression.includes(marker)) fehler.push("GEAR_PROGRESS_MARKER_FEHLT:" + marker);
}

const graph = liesText("grundlage/quelle/produktion/production-graph.ts");
for (const marker of [
  "pruefeProduktionsGraph",
  "PRODUKTION_GRAPH_RECIPE_CYCLE",
  "PRODUKTION_GRAPH_VERWAISTER_SCHRITT",
  "PRODUKTION_GATE_STALE",
  "PRODUKTION_OPERATIONSSCHLUESSEL_DOPPELT",
  "actionAuthority: false",
  "rawWriteAuthority: false",
]) {
  if (!graph.includes(marker)) fehler.push("PRODUCTION_GRAPH_MARKER_FEHLT:" + marker);
}

const bankKatalog = liesText("grundlage/quelle/produktion/bank-katalog.ts");
for (const marker of [
  "pinneBankKatalog",
  "planningEvidence: true",
  "executionAuthority: false",
  "BANK_KATALOG_NICHT_FRISCH",
]) {
  if (!bankKatalog.includes(marker)) fehler.push("BANK_KATALOG_MARKER_FEHLT:" + marker);
}

const mutationsPlaner = liesText("grundlage/quelle/merchant/item-mutations-planer.ts");
for (const marker of [
  "planeItemMutation",
  "AL-ACTION-UPGRADE",
  "AL-RECOVERY-UPGRADE",
  "AL-VERIFIER-UPGRADE",
  "AL-ACTION-COMPOUND",
  "AL-RECOVERY-COMPOUND",
  "AL-VERIFIER-COMPOUND",
  "previewIstKeineExecutionAuthority: true",
  "unknownOutcomeKeinBlindRetry: true",
  "GEAR_KANDIDAT_RESERVIERT",
  "AKTIVE_ITEM_RESERVIERUNG",
  "WORKSPACE_FEHLT",
  "ausfuehrungsAutoritaet: false",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!mutationsPlaner.includes(marker)) {
    fehler.push("ITEM_MUTATION_PLANER_MARKER_FEHLT:" + marker);
  }
}

const wert = liesText("grundlage/quelle/merchant/werttransaktion.ts");
for (const marker of [
  "WerttransaktionsLedger",
  "AKZEPTIERT_IN_FLIGHT",
  "ABGLEICH_ERFORDERLICH",
  "qAktiv",
  "placeholderAnzahl",
  "consumableDeltaBeobachtet",
  "NICHT_AUSGEFUEHRT",
  "sameIntentErneutSenden: false",
  "importiereNachRestart",
]) {
  if (!wert.includes(marker)) fehler.push("WERTTRANSAKTION_MARKER_FEHLT:" + marker);
}

const settlement = liesText("grundlage/quelle/produktion/recipient-settlement.ts");
for (const marker of [
  "validiereEmpfaengerSettlement",
  "baselineMenge",
  "erwarteteMengenZunahme",
  "rosterEpoche",
  "recipientSessionId",
  "RECIPIENT_SETTLEMENT_MENGE_NICHT_BESTAETIGT",
  "RECIPIENT_SETTLEMENT_ZIEL_DRIFT",
]) {
  if (!settlement.includes(marker)) fehler.push("RECIPIENT_SETTLEMENT_MARKER_FEHLT:" + marker);
}

const production = liesText("grundlage/quelle/produktion/production-intent.ts");
for (const marker of [
  "ProduktionsLedger",
  "OUTPUT_BEREIT",
  "LIEFERUNG_AUSSTEHEND",
  "RECIPIENT_SETTLED",
  "PRODUKTION_COMMIT_OHNE_RECIPIENT_SETTLEMENT",
  "RECOVERY_PENDING",
  "sameIntentErneutSenden: false",
]) {
  if (!production.includes(marker)) fehler.push("PRODUKTION_MARKER_FEHLT:" + marker);
}

const productionTest = liesText("grundlage/tests/r15-production-settlement.test.mjs");
for (const marker of [
  "Craft Output allein beendet Production nicht",
  "Production committed erst nach final verifiziertem Recipient Settlement",
  "Restart macht nichtterminale Production RECOVERY_PENDING",
]) {
  if (!productionTest.includes(marker)) fehler.push("PRODUKTION_TEST_MARKER_FEHLT:" + marker);
}

const wertTest = liesText("grundlage/tests/r15-werttransaktion.test.mjs");
for (const marker of [
  "q oder Placeholder beweist accepted in-flight",
  "NOT_APPLIED verlangt positive Evidence",
  "Restart setzt nichtterminale Werttransaktion auf ABGLEICH_ERFORDERLICH",
]) {
  if (!wertTest.includes(marker)) fehler.push("WERTTRANSAKTION_TEST_MARKER_FEHLT:" + marker);
}

const rawMuster = [
  /\battack\s*\(/,
  /\bsmart_move\s*\(/,
  /\bmove\s*\(/,
  /\buse_skill\s*\(/,
  /\bequip\s*\(/,
  /\bsend_cm\s*\(/,
  /\bsend_gold\s*\(/,
  /\bsend_item\s*\(/,
  /\bupgrade\s*\(/,
  /\bcompound\s*\(/,
  /\bexchange\s*\(/,
  /\bcraft\s*\(/,
  /\bdismantle\s*\(/,
  /\bbank_store\s*\(/,
  /\bbank_retrieve\s*\(/,
  /\btrade_buy\s*\(/,
  /\btrade_sell\s*\(/,
  /\.emit\s*\(/,
];

const r15Quellen = [
  "grundlage/quelle/merchant/werttransaktion.ts",
  "grundlage/quelle/merchant/item-mutations-planer.ts",
  "grundlage/quelle/merchant/supply-policy.ts",
  "grundlage/quelle/merchant/logistik-workflow.ts",
  "grundlage/quelle/merchant/gear-allokation.ts",
  "grundlage/quelle/merchant/gear-progression.ts",
  "grundlage/quelle/produktion/bank-katalog.ts",
  "grundlage/quelle/produktion/production-graph.ts",
  "grundlage/quelle/produktion/recipient-settlement.ts",
  "grundlage/quelle/produktion/production-intent.ts",
];
for (const pfad of r15Quellen) {
  const text = liesText(pfad);
  if (rawMuster.some(muster => muster.test(text))) {
    fehler.push("R15_CORE_RAW_GAME_WRITE_VERBOTEN:" + pfad);
  }
}

if (fehler.length > 0) {
  console.error("[V5-R15-GUARD] FEHLER\n" + fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R15-GUARD] OK / Production und Werttransaktionen bleiben planning/reconciliation-only");
