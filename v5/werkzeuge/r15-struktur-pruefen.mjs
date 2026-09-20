import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R15-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r14 = gates.phases?.find(x => x.id === "R14");
const r15 = gates.phases?.find(x => x.id === "R15");

if (r14?.status !== "DONE") fehler("R15 verlangt R14 DONE.");
if (!r15 || !["IN_PROGRESS", "DONE"].includes(r15.status)) {
  fehler("R15 muss IN_PROGRESS oder DONE sein.");
}
if (r15.status === "IN_PROGRESS" && gates.currentPhase !== "R15") {
  fehler("R15 IN_PROGRESS verlangt currentPhase=R15.");
}
if (r15.status === "DONE") {
  const r16 = gates.phases?.find(x => x.id === "R16");
  const spaeterePhasen = new Set(["R17", "R18", "R19"]);
  const direkterUebergang = gates.currentPhase === "R16" && r16?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r16?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R15 DONE verlangt mindestens R16 IN_PROGRESS oder einen formal abgeschlossenen R16-Uebergang.");
  }
}
if (bereitschaft.status === "FREIGEGEBEN") {
  fehler("R15 darf die breite Gameplay-Runtime noch nicht freigeben.");
}

for (const pfad of [
  "grundlage/quelle/merchant/werttransaktion.ts",
  "grundlage/tests/r15-production-graph.test.mjs",
  "grundlage/tests/r15-logistik-gear.test.mjs",
  "grundlage/quelle/produktion/production-graph.ts",
  "grundlage/quelle/produktion/bank-katalog.ts",
  "grundlage/quelle/merchant/gear-allokation.ts",
  "grundlage/quelle/merchant/logistik-workflow.ts",
  "grundlage/quelle/merchant/supply-policy.ts",
  "grundlage/quelle/produktion/recipient-settlement.ts",
  "grundlage/quelle/produktion/production-intent.ts",
  "grundlage/tests/r15-werttransaktion.test.mjs",
  "grundlage/tests/r15-production-settlement.test.mjs",
  "werkzeuge/r15-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("R15 Pflichtartefakt fehlt: " + pfad);
}

const erwartet = new Set(["V5-ANF-MERCHANT-006", "V5-ANF-MERCHANT-007"]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R15" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwartet.size
    || anforderungen.some(x => !erwartet.has(x.kennung))) {
  fehler("R15-MUSS-Anforderungsmenge ungueltig.");
}
if (anforderungen.some(x => !["OFFEN", "R15_NACHGEWIESEN"].includes(x.status))) {
  fehler("R15-Anforderungsstatus ungueltig.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege
  .filter(x => x.phase === "R15");
if (trace.length !== erwartet.size
    || trace.some(x => !erwartet.has(x.anforderungKennung))) {
  fehler("R15-Traceability-Menge unvollstaendig.");
}

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R15");
if (fitness.length !== 0) fehler("R15 besitzt laut ratifizierter Fitnessdatei keine eigenen Fitnessregeln.");

if (r15.status === "DONE") {
  const abdeckung = lies("grundlage/vertraege/r15/merchant-core-b-abdeckung.json");
  if (abdeckung.phase !== "R15"
      || abdeckung.status !== "TECHNISCH_BESTANDEN"
      || abdeckung.runtimeGate !== "GESPERRT"
      || abdeckung.gameplayAutoritaet !== false
      || abdeckung.rawWriteAutoritaet !== false
      || abdeckung.anforderungen?.length !== 2
      || abdeckung.anforderungen.some(x => x.status !== "ERFUELLT")) {
    fehler("R15 Merchant-Core-B-Abdeckung ungueltig.");
  }
  const abschluss = lies("roadmap/r15-abschluss.json");
  if (abschluss.phase !== "R15"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R15-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R15_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)) {
    fehler("R15 DONE verlangt 2/2 Anforderungen und Traceability.");
  }
}

console.log("[V5-R15-STRUKTUR] OK / R15:", r15.status, "/ Runtime-Gate:", bereitschaft.status);
