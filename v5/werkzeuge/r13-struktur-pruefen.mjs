import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R13-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r12 = gates.phases?.find(x => x.id === "R12");
const r13 = gates.phases?.find(x => x.id === "R13");

if (r12?.status !== "DONE") fehler("R13 verlangt R12 DONE.");
if (!r13 || !["IN_PROGRESS", "DONE"].includes(r13.status)) {
  fehler("R13 muss IN_PROGRESS oder DONE sein.");
}
if (r13.status === "IN_PROGRESS" && gates.currentPhase !== "R13") {
  fehler("R13 IN_PROGRESS verlangt currentPhase=R13.");
}
if (r13.status === "DONE") {
  const r14 = gates.phases?.find(x => x.id === "R14");
  const spaeterePhasen = new Set(["R15","R16","R17","R18","R19"]);
  const direkterUebergang = gates.currentPhase === "R14" && r14?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r14?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R13 DONE verlangt mindestens R14 IN_PROGRESS oder einen formal abgeschlossenen R14-Uebergang.");
  }
}
if (bereitschaft.status === "FREIGEGEBEN") {
  if (!fs.existsSync("roadmap/gesamtfreigabe.json")) {
    fehler("R13 darf die Runtime nicht selbst freigeben; finale Betreiber-Gesamtfreigabe-Evidence fehlt.");
  }
  const gesamtfreigabe = lies("roadmap/gesamtfreigabe.json");
  if (gesamtfreigabe.kennung !== "V5_GESAMTFREIGABE"
      || gesamtfreigabe.status !== "ERTEILT"
      || gesamtfreigabe.bestaetigungQuelle !== "BETREIBER_INTERAKTIV"
      || gesamtfreigabe.bestaetigungText !== "V5 GESAMTFREIGABE ERTEILEN"
      || bereitschaft.gesamtfreigabe !== "ERTEILT"
      || bereitschaft.breiteRuntimeFreigabe !== true) {
    fehler("R13 darf die Runtime nicht selbst freigeben; nur die spaetere explizite Post-R19-Gesamtfreigabe ist zulaessig.");
  }
}


for (const pfad of [
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
  "grundlage/vertraege/r13/merchant-core-abdeckung.json",
  "architektur/adr/ADR-016-R13-MERCHANT-CORE-A.md",
  "roadmap/r13-abschluss.json",
  "werkzeuge/r13-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("R13 Pflichtartefakt fehlt: " + pfad);
}

const erwartet = new Set([
  "V5-ANF-MERCHANT-001",
  "V5-ANF-MERCHANT-002",
  "V5-ANF-MERCHANT-003",
  "V5-ANF-MERCHANT-004",
  "V5-ANF-MERCHANT-005",
  "V5-ANF-MERCHANT-008",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R13" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwartet.size
    || anforderungen.some(x => !erwartet.has(x.kennung))) {
  fehler("R13-MUSS-Anforderungsmenge ungueltig.");
}
if (anforderungen.some(x => !["OFFEN", "R13_NACHGEWIESEN"].includes(x.status))) {
  fehler("R13-Anforderungsstatus ungueltig.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege
  .filter(x => x.phase === "R13");
if (trace.length !== erwartet.size
    || trace.some(x => !erwartet.has(x.anforderungKennung))) {
  fehler("R13-Traceability-Menge unvollstaendig.");
}

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R13");
if (fitness.length !== 0) fehler("R13 besitzt laut ratifizierter Fitnessdatei keine eigenen Fitnessregeln.");

if (r13.status === "DONE") {
  const abdeckung = lies("grundlage/vertraege/r13/merchant-core-abdeckung.json");
  if (abdeckung.phase !== "R13"
      || abdeckung.status !== "TECHNISCH_BESTANDEN"
      || abdeckung.runtimeGate !== "GESPERRT"
      || abdeckung.gameplayAutoritaet !== false
      || abdeckung.rawWriteAutoritaet !== false
      || abdeckung.anforderungen?.length !== 6
      || abdeckung.anforderungen.some(x => x.status !== "ERFUELLT")) {
    fehler("R13 Merchant-Core-Abdeckung ungueltig.");
  }
  const abschluss = lies("roadmap/r13-abschluss.json");
  if (abschluss.phase !== "R13"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R13-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R13_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)) {
    fehler("R13 DONE verlangt 6/6 Anforderungen und Traceability.");
  }
}

console.log("[V5-R13-STRUKTUR] OK / R13:", r13.status, "/ Runtime-Gate:", bereitschaft.status);
