import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const pflicht = [
  "grundlage/quelle/koordination/cm-protokoll.ts",
  "grundlage/quelle/koordination/cm-settlement.ts",
  "grundlage/quelle/koordination/roster-wahrheit.ts",
  "grundlage/quelle/koordination/character-liveness.ts",
  "grundlage/quelle/koordination/account-koordinator.ts",
  "grundlage/quelle/koordination/character-agent.ts",
  "grundlage/tests/r14-cm-protokoll.test.mjs",
  "grundlage/tests/r14-cm-settlement.test.mjs",
  "grundlage/tests/r14-cm-fault-injektion.test.mjs",
  "grundlage/tests/r14-roster-liveness.test.mjs",
  "grundlage/tests/r14-koordinator-agent.test.mjs",
  "dokumentation/P1A-CM-MULTI-CHARACTER.md",
];

for (const pfad of pflicht) {
  if (!fs.existsSync(pfad)) fehler.push("PFLICHTARTEFAKT_FEHLT:" + pfad);
}

const cm = liesText("grundlage/quelle/koordination/cm-protokoll.ts");
for (const marker of [
  "protokollVersion: 1",
  "nachrichtenId",
  "dedupeSchluessel",
  "gueltigBisMs",
  "workflowId",
  "workflowRevision",
  "rosterEpoche",
  "DUPLIKAT",
  "VERALTETE_REVISION",
  "GLEICHE_NACHRICHTEN_ID_WIEDERHOLEN",
  "importiereNachRestart",
]) {
  if (!cm.includes(marker)) fehler.push("CM_MARKER_FEHLT:" + marker);
}

const settlement = liesText("grundlage/quelle/koordination/cm-settlement.ts");
for (const marker of [
  "CmAntwortLedger",
  "ACK_BESTAETIGT",
  "SETTLEMENT_ABGESCHLOSSEN",
  "BEREITS_ABGESCHLOSSEN",
  "importiereNachRestart",
]) {
  if (!settlement.includes(marker)) fehler.push("SETTLEMENT_MARKER_FEHLT:" + marker);
}

const roster = liesText("grundlage/quelle/koordination/roster-wahrheit.ts");
for (const marker of [
  "RosterWahrheit",
  "rosterEpoche",
  "CharacterZielBindung",
  "importiereNachRestart",
  "ROSTER_KEINE_AKTUELLE_WAHRHEIT",
]) {
  if (!roster.includes(marker)) fehler.push("ROSTER_MARKER_FEHLT:" + marker);
}

const liveness = liesText("grundlage/quelle/koordination/character-liveness.ts");
for (const marker of [
  "CharacterLebendigkeitsRegister",
  "sitzungsEpoche",
  "RECOVERY_PENDING",
  "istFrisch",
  "importiereNachRestart",
]) {
  if (!liveness.includes(marker)) fehler.push("LIVENESS_MARKER_FEHLT:" + marker);
}

const koordinator = liesText("grundlage/quelle/koordination/account-koordinator.ts");
for (const marker of [
  "AccountKoordinator",
  "erteileKoordinationsFreigabe",
  "validiereKoordinationsFreigabe",
  "KOORDINATOR_CHARACTER_STALE",
  "gameplayAutoritaet = false",
  "rawWriteAutoritaet = false",
]) {
  if (!koordinator.includes(marker)) fehler.push("KOORDINATOR_MARKER_FEHLT:" + marker);
}

const agent = liesText("grundlage/quelle/koordination/character-agent.ts");
for (const marker of [
  "CharacterAgent",
  "akzeptiereKoordinationsFreigabe",
  "empfangeCm",
  "gameplayAutoritaet = false",
  "rawWriteAutoritaet = false",
]) {
  if (!agent.includes(marker)) fehler.push("AGENT_MARKER_FEHLT:" + marker);
}

const fault = liesText("grundlage/tests/r14-cm-fault-injektion.test.mjs");
for (const marker of ["duplicate", "out-of-order", "loss", "delayed"]) {
  if (!fault.includes(marker)) fehler.push("FAULT_MARKER_FEHLT:" + marker);
}

const p1a = liesText("dokumentation/P1A-CM-MULTI-CHARACTER.md");
if (!p1a.includes("**Status:** GESCHLOSSEN")) fehler.push("P1A_NICHT_GESCHLOSSEN");

const rawMuster = [
  /\battack\s*\(/,
  /\bsmart_move\s*\(/,
  /\bmove\s*\(/,
  /\buse_skill\s*\(/,
  /\bequip\s*\(/,
  /\bsend_cm\s*\(/,
  /\bsend_gold\s*\(/,
  /\bsend_item\s*\(/,
  /\bbank_store\s*\(/,
  /\bbank_retrieve\s*\(/,
  /\btrade_buy\s*\(/,
  /\btrade_sell\s*\(/,
  /\.emit\s*\(/,
];

const koordinationsQuellen = [
  "grundlage/quelle/koordination/account-bank-lease.ts",
  "grundlage/quelle/koordination/cm-protokoll.ts",
  "grundlage/quelle/koordination/cm-settlement.ts",
  "grundlage/quelle/koordination/roster-wahrheit.ts",
  "grundlage/quelle/koordination/character-liveness.ts",
  "grundlage/quelle/koordination/account-koordinator.ts",
  "grundlage/quelle/koordination/character-agent.ts",
];

for (const pfad of koordinationsQuellen) {
  const text = liesText(pfad);
  if (rawMuster.some(muster => muster.test(text))) {
    fehler.push("R14_KOORDINATION_RAW_GAME_WRITE_VERBOTEN:" + pfad);
  }
}

if (fehler.length > 0) {
  console.error("[V5-R14-GUARD] FEHLER\n" + fehler.join("\n"));
  process.exit(1);
}

console.log("[V5-R14-GUARD] OK / Multi-Character Coordination bleibt transport- und planning-only");
