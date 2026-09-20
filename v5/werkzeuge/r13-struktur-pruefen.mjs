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
  if (gates.currentPhase !== "R14" || r14?.status !== "IN_PROGRESS") {
    fehler("R13 DONE verlangt R14 IN_PROGRESS und currentPhase=R14.");
  }
}
if (bereitschaft.status === "FREIGEGEBEN") {
  fehler("R13 darf die breite Gameplay-Runtime noch nicht freigeben.");
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
