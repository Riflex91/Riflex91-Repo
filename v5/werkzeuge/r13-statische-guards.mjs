import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const pflicht = [
  "grundlage/quelle/merchant/gegenstands-identitaet.ts",
  "grundlage/quelle/merchant/disposition.ts",
  "grundlage/quelle/merchant/workspace.ts",
  "grundlage/quelle/merchant/gold-budget.ts",
  "grundlage/quelle/koordination/account-bank-lease.ts",
  "grundlage/quelle/merchant/markt-evidence.ts",
  "grundlage/quelle/merchant/demand.ts",
  "grundlage/tests/r13-disposition-workspace.test.mjs",
  "grundlage/tests/r13-bank-lease.test.mjs",
  "grundlage/tests/r13-market-evidence.test.mjs",
  "grundlage/tests/r13-scheduler-budget.test.mjs",
];
for (const pfad of pflicht) {
  if (!fs.existsSync(pfad)) fehler.push("PFLICHTARTEFAKT_FEHLT:" + pfad);
}

const disposition = liesText("grundlage/quelle/merchant/disposition.ts");
for (const marker of [
  "GegenstandsDispositionsLedger",
  "physischeGegenstandsKennung",
  "ITEM_DISPOSITION_VERBIETET_ZWECK",
  "ITEM_PHYSISCHE_MENGE_BEREITS_RESERVIERT",
]) {
  if (!disposition.includes(marker)) fehler.push("DISPOSITION_MARKER_FEHLT:" + marker);
}

const workspace = liesText("grundlage/quelle/merchant/workspace.ts");
for (const marker of [
  "pruefeWorkspaceKapazitaet",
  "temporaereWorkspaceSlots",
  "variantenFingerprint",
  "gesamtBenoetigteFreieSlots",
]) {
  if (!workspace.includes(marker)) fehler.push("WORKSPACE_MARKER_FEHLT:" + marker);
}

const bank = liesText("grundlage/quelle/koordination/account-bank-lease.ts");
for (const marker of [
  '"account:" + accountId + ":bank"',
  "BankLeaseKoordinator",
  "RECOVERY_PENDING",
  "QUARANTINED",
  "actionKanalRessourcenId(token.ownerCharacterId, \"bank\")",
  "validiereFencing",
  "schliesseRestartAbgleichAb",
]) {
  if (!bank.includes(marker)) fehler.push("BANK_MARKER_FEHLT:" + marker);
}

const markt = liesText("grundlage/quelle/merchant/markt-evidence.ts");
for (const marker of [
  "pinneListingEvidence",
  "TRADE_RID_FEHLT",
  "TRADE_LISTING_EVIDENCE_ABGELAUFEN",
  "reproduziereTradeSellServerAuswahl",
  "inventarIndex",
  "NICHT_FUNGIBLE_MEHRDEUTIGE_SERVERAUSWAHL",
]) {
  if (!markt.includes(marker)) fehler.push("MARKT_MARKER_FEHLT:" + marker);
}

const demand = liesText("grundlage/quelle/merchant/demand.ts");
for (const marker of [
  "MerchantDemandInbox",
  "MerchantWorkflowProvider",
  "prioritaetsKlasse",
  "prioritaetsRang",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!demand.includes(marker)) fehler.push("DEMAND_MARKER_FEHLT:" + marker);
}

const merchantQuellen = pflicht.filter(p => p.includes("/quelle/merchant/"));
const rawWriteQuellen = [
  ...merchantQuellen,
  "grundlage/quelle/koordination/account-bank-lease.ts",
];
const rawMuster = [
  /\battack\s*\(/,
  /\bsmart_move\s*\(/,
  /\bmove\s*\(/,
  /\buse_skill\s*\(/,
  /\bequip\s*\(/,
  /\bbank_store\s*\(/,
  /\bbank_retrieve\s*\(/,
  /\bbank_deposit\s*\(/,
  /\bbank_withdraw\s*\(/,
  /\btrade_buy\s*\(/,
  /\btrade_sell\s*\(/,
  /\bsell\s*\(/,
  /\bbuy\s*\(/,
  /\.emit\s*\(/,
];
for (const pfad of rawWriteQuellen) {
  const text = liesText(pfad);
  if (rawMuster.some(muster => muster.test(text))) {
    fehler.push("MERCHANT_CORE_RAW_GAME_WRITE_VERBOTEN:" + pfad);
  }
}

if (fehler.length > 0) {
  console.error("[V5-R13-GUARD] FEHLER\n" + fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R13-GUARD] OK / Merchant Core bleibt planning-only ohne Raw Game Writes");
