import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R10-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r10 = gates.phases?.find(x => x.id === "R10");

if (!r10 || !["IN_PROGRESS", "DONE"].includes(r10.status)) {
  fehler("R10 muss IN_PROGRESS oder DONE sein.");
}
if (r10.status === "IN_PROGRESS" && gates.currentPhase !== "R10") {
  fehler("R10 IN_PROGRESS verlangt currentPhase=R10.");
}
if (r10.status === "DONE") {
  const r11 = gates.phases?.find(x => x.id === "R11");
  if (gates.currentPhase !== "R11" || r11?.status !== "IN_PROGRESS") {
    fehler("R10 DONE verlangt R11 IN_PROGRESS und currentPhase=R11.");
  }
}
if (r10.blocksRuntime !== true) fehler("R10 muss das Gameplay-Runtime-Gate blockieren.");
if (bereitschaft.status === "FREIGEGEBEN") fehler("R10 darf Gameplay-Runtime noch nicht freigeben.");

for (const pfad of [
  "grundlage/quelle/recovery/typen.ts",
  "grundlage/quelle/recovery/recovery-kernel.ts",
  "grundlage/quelle/recovery/laufsteuerung.ts",
  "grundlage/quelle/recovery/fehlerdomaenen.ts",
  "grundlage/quelle/recovery/wiederanlauf.ts",
  "grundlage/tests/r10-recovery.test.mjs",
  "grundlage/tests/r10-control.test.mjs",
  "werkzeuge/r10-recovery-abdeckung.mjs",
  "werkzeuge/r10-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const erwarteteAnforderungen = new Set([
  "V5-ANF-SICH-011",
  "V5-ANF-SICH-014",
  "V5-ANF-SICH-015",
  "V5-ANF-PERSIST-004",
  "V5-ANF-TRANS-001",
  "V5-ANF-TRANS-002",
  "V5-ANF-TRANS-003",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R10" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwarteteAnforderungen.size
    || anforderungen.some(x => !erwarteteAnforderungen.has(x.kennung))) {
  fehler("R10-MUSS-Anforderungsmenge weicht von der ratifizierten Menge ab.");
}
if (anforderungen.some(x => !["OFFEN", "R10_NACHGEWIESEN"].includes(x.status))) {
  fehler("R10-Anforderungsstatus ungueltig.");
}

const erwarteteFitness = new Set(["V5-FIT-018", "V5-FIT-019", "V5-FIT-040"]);
const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R10");
if (fitness.length !== erwarteteFitness.size
    || fitness.some(x => !erwarteteFitness.has(x.kennung))) {
  fehler("R10-Fitnessregelmenge weicht von der ratifizierten Menge ab.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x => x.phase === "R10");
if (trace.length !== erwarteteAnforderungen.size
    || trace.some(x => !erwarteteAnforderungen.has(x.anforderungKennung))) {
  fehler("R10-Traceability-Menge ist unvollstaendig.");
}

if (r10.status === "DONE") {
  const abschluss = lies("roadmap/r10-abschluss.json");
  if (abschluss.phase !== "R10"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R10-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R10_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)
      || fitness.some(x => x.r10NachweisStatus !== "ERFUELLT")) {
    fehler("R10 DONE verlangt 7/7 Anforderungen, Traceability und 3/3 Fitness.");
  }
}

console.log("[V5-R10-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
