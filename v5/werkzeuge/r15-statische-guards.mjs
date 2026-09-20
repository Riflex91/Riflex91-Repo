import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const pflicht = [
  "grundlage/quelle/merchant/werttransaktion.ts",
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
