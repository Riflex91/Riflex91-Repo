import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const fehler = text => { throw new Error("[V5-R10-RECOVERY-ABDECKUNG] " + text); };

const recoveries = lies("wissensbasis/vertraege/recovery-contracts.json").actions;
const bindungen = lies("grundlage/vertraege/r9/action-bindungen.json").bindungen;
const automaten = lies("zustaende/zustandsautomaten.json").automaten;

if (recoveries.length !== 61) fehler("Recovery-Contract-Anzahl muss 61 sein.");
if (bindungen.length !== 61) fehler("R9-Bindungsanzahl muss 61 sein.");

let produktiv = 0;
let deaktiviert = 0;
for (const recovery of recoveries) {
  if (recovery.retryPolicy?.sameIntentAfterPossibleSend !== "NEVER") {
    fehler("Same-Intent nach Possible-Send nicht NEVER: " + recovery.id);
  }
  for (const trigger of [
    "TIMEOUT_AFTER_SEND_POSSIBLE",
    "DISCONNECT_AFTER_SEND_POSSIBLE",
    "PROCESS_CRASH_AFTER_DURABLE_INTENT_BEFORE_SETTLEMENT",
    "RESPONSE_LOST_AFTER_POSSIBLE_COMMIT",
  ]) {
    if (!recovery.unknownEntryTriggers?.includes(trigger)) {
      fehler("UNKNOWN-Trigger fehlt " + trigger + " bei " + recovery.id);
    }
  }
  for (const klasse of ["committed","notApplied","partial","stillPending","unresolved"]) {
    if (!Array.isArray(recovery.settlementRules?.[klasse])
        || recovery.settlementRules[klasse].length < 1) {
      fehler("Settlement-Regel fehlt " + klasse + " bei " + recovery.id);
    }
  }
  for (const pflicht of [
    "intent_id",
    "action_contract_id",
    "recovery_contract_id",
    "knowledge_snapshot_id",
    "pinned_prestate_fingerprint",
    "resource_claims_and_fencing",
    "postcondition_evidence",
  ]) {
    if (!recovery.journalRequirements?.includes(pflicht)) {
      fehler("Journalpflicht fehlt " + pflicht + " bei " + recovery.id);
    }
  }

  if (recovery.status === "VERIFIED_RECOVERY_POLICY") produktiv += 1;
  else if (recovery.status === "DISABLED_WITH_ACTION_CONTRACT") deaktiviert += 1;
  else fehler("Unbekannter Recovery-Status: " + recovery.id);
}
if (produktiv !== 60 || deaktiviert !== 1) {
  fehler("Erwartet 60 produktive und 1 deaktivierten Recovery Contract.");
}

const transaktion = automaten.find(x => x.kennung === "V5-ZUSTAND-TRANSAKTION");
if (!transaktion) fehler("Transaktionsautomat fehlt.");
const unknownAusgaenge = transaktion.uebergaenge
  .filter(x => x.von === "ERGEBNIS_UNBEKANNT")
  .map(x => x.nach);
if (unknownAusgaenge.length !== 1 || unknownAusgaenge[0] !== "ABGLEICH_ERFORDERLICH") {
  fehler("ERGEBNIS_UNBEKANNT darf nur nach ABGLEICH_ERFORDERLICH fuehren.");
}
if (!transaktion.verbote.includes("ERGEBNIS_UNBEKANNT->GESENDET")) {
  fehler("UNKNOWN->Send-Verbot fehlt im Transaktionsautomaten.");
}

const laufsteuerung = automaten.find(x => x.kennung === "V5-ZUSTAND-LAUFSTEUERUNG");
if (!laufsteuerung) fehler("Laufsteuerungsautomat fehlt.");
for (const [von,nach] of [
  ["LAEUFT","STOPP_ANGEFORDERT"],
  ["STOPP_ANGEFORDERT","KEINE_NEUE_ARBEIT"],
  ["KEINE_NEUE_ARBEIT","ABGLEICH_LAEUFT"],
]) {
  if (!laufsteuerung.uebergaenge.some(x => x.von === von && x.nach === nach)) {
    fehler("Stop-Protokollkante fehlt: " + von + "->" + nach);
  }
}

const arbeitsauftrag = automaten.find(x => x.kennung === "V5-ZUSTAND-ARBEITSAUFTRAG");
if (!arbeitsauftrag?.verbote.some(x => x.includes("Restart darf LAEUFT nicht direkt wiederherstellen"))) {
  fehler("Restart->LAEUFT-Verbot fehlt.");
}

console.log("[V5-R10-RECOVERY-ABDECKUNG] OK / produktiv:", produktiv, "/ deaktiviert:", deaktiviert);
