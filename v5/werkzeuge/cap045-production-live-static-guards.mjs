import fs from "node:fs";

const fehler = [];
const lies = pfad => fs.readFileSync(pfad, "utf8");
const controller = lies("werkzeuge/cap045-production-live-test-gui.js");
const paket = lies("werkzeuge/cap045-production-live-test-paket.js");
const evidenceValidator = lies("werkzeuge/cap045-production-live-evidence-pruefen.mjs");

for (const marker of [
  "FULLY_RESOLVED",
  "DEFERRED_EVENT_INAKTIV",
  "BLOCKIERT_QUEST_NICHT_ERFUELLT",
  "STRUCTURAL_GAP",
  "CAP045-STAGE2-LIVE-SOAK-START",
  "CAP045-PRODUCTION-LIVE-PROOF-UPGRADE-ONE-SHOT-AKZEPTIERT",
  "AL-ACTION-UPGRADE",
  "AL-RECOVERY-UPGRADE",
  "AL-VERIFIER-UPGRADE",
  "sameIntentErneutSenden: false",
  "synthetischeEvidenceZaehltAlsLive: false",
  "zertifiziererGameplayWrites: 0",
  "breiteRuntimeFreigabe: false",
  "planId: produktionsId",
  "bankKatalog: null",
  "workspaceNachweisFingerprint",
  "gateEvidence: null",
  "accountId: obs.accountId",
  "sessionId: obs.characterSessionId",
  "sample.zeitMs - samples[0].zeitMs >= SOAK_DAUER_MS",
  "root?.server?.region",
  "root?.server?.id",
  "parentRoot?.server_region",
  "parentRoot?.server_identifier",
  "serverBindungQuelle",
  "maschinenBerichtObjekt",
  "maschinenBerichtText",
  "kopiereMaschinenBericht",
  "controllerVersion: session.controllerVersion ?? VERSION"
]) {
  if (!controller.includes(marker)) fehler.push("CAP045_LIVE_MARKER_FEHLT:" + marker);
}

for (const marker of [
  "pruefeProduktionsGraph",
  "sourceReportFingerprintSha256",
  "CONTROLLED_PROOF_WRITE_ANZAHL_UNGUELTIG",
  "COVERAGE_CORE_GRAPH_UNGUELTIG",
  "CONTROLLER_VERSIONS",
  "\"1.0.2\"",
  "\"1.0.3\""
]) {
  if (!evidenceValidator.includes(marker)) fehler.push("CAP045_EVIDENCE_MARKER_FEHLT:" + marker);
}
if (controller.includes("sample.zeitMs - aktualisiert.stage2.gestartetAmMs >= SOAK_DAUER_MS")) {
  fehler.push("CAP045_LIVE_SOAK_DAUER_BUTTONSTART_STATT_EVIDENCE");
}

const upgradeAufrufe = controller.match(/\.upgrade\s*\(/g) ?? [];
if (upgradeAufrufe.length !== 1) {
  fehler.push("CAP045_LIVE_UPGRADE_AUFRUFE:" + upgradeAufrufe.length);
}

for (const [name, muster] of [
  ["ATTACK", /\battack\s*\(/],
  ["MOVE", /\bmove\s*\(/],
  ["SMART_MOVE", /\bsmart_move\s*\(/],
  ["USE_SKILL", /\buse_skill\s*\(/],
  ["BUY", /\bbuy\s*\(/],
  ["SELL", /\bsell\s*\(/],
  ["SEND_ITEM", /\bsend_item\s*\(/],
  ["SEND_GOLD", /\bsend_gold\s*\(/],
  ["CRAFT", /\bcraft\s*\(/],
  ["EXCHANGE", /\bexchange\s*\(/],
  ["COMPOUND", /\bcompound\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/]
]) {
  if (muster.test(controller)) fehler.push("CAP045_LIVE_RAW_WRITE_VERBOTEN:" + name);
}

for (const verboten of [
  "AIO_V3.__runtime.",
  "V4ProduktionsLaufzeit.stop",
  "V4ProduktionsLaufzeit.start",
  "fetch(",
  "XMLHttpRequest",
  ".status()"
]) {
  if (controller.includes(verboten) || paket.includes(verboten)) {
    fehler.push("CAP045_LIVE_VERBOTENE_ABHAENGIGKEIT:" + verboten);
  }
}

const durable = controller.indexOf("schreibeJournal(intent)");
const admission = controller.indexOf("status: 'ADMITTED'", durable);
const pending = controller.indexOf("status: 'OUTCOME_PENDING'", admission);
const send = controller.indexOf("await rufeUpgrade(rootFenster(), kandidat, false)", pending);
if (!(durable >= 0 && admission > durable && pending > admission && send > pending)) {
  fehler.push("CAP045_LIVE_DURABLE_ADMISSION_SEND_REIHENFOLGE_UNGUELTIG");
}

if (fehler.length) {
  console.error("[V5-CAP045-LIVE-GUARD] FEHLER\n" + fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-CAP045-LIVE-GUARD] OK / LIVE getrennt, Zertifizierer zero-write, One-Shot fail-closed");
