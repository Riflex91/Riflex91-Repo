import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R9-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r9 = gates.phases?.find(x => x.id === "R9");

if (!r9 || !["IN_PROGRESS", "DONE"].includes(r9.status)) {
  fehler("R9 muss IN_PROGRESS oder DONE sein.");
}
if (r9.status === "IN_PROGRESS" && gates.currentPhase !== "R9") {
  fehler("R9 IN_PROGRESS verlangt currentPhase=R9.");
}
if (r9.status === "DONE") {
  const r10 = gates.phases?.find(x => x.id === "R10");
  if (gates.currentPhase !== "R10" || r10?.status !== "IN_PROGRESS") {
    fehler("R9 DONE verlangt R10 IN_PROGRESS und currentPhase=R10.");
  }
}
if (r9.blocksRuntime !== true) fehler("R9 muss das Gameplay-Runtime-Gate blockieren.");
if (bereitschaft.status === "FREIGEGEBEN") fehler("R9 darf Gameplay-Runtime noch nicht freigeben.");

for (const pfad of [
  "grundlage/quelle/ausfuehrung/ports.ts",
  "grundlage/quelle/ausfuehrung/intent-bindung.ts",
  "grundlage/quelle/ausfuehrung/admission.ts",
  "grundlage/quelle/ausfuehrung/ausfuehrungs-kernel.ts",
  "grundlage/tests/r9-admission-execution.test.mjs",
  "ausfuehrung/vertraege/verifier-katalog.json",
  "ausfuehrung/vertraege/r9-bindungen.json",
  "werkzeuge/r9-vertragsabdeckung.mjs",
  "werkzeuge/r9-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const erwarteteAnforderungen = new Set([
  "V5-ANF-ARCH-003",
  "V5-ANF-SICH-002",
  "V5-ANF-SICH-003",
  "V5-ANF-SICH-004",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R9" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwarteteAnforderungen.size
    || anforderungen.some(x => !erwarteteAnforderungen.has(x.kennung))) {
  fehler("R9-MUSS-Anforderungsmenge weicht von der ratifizierten Menge ab.");
}
if (anforderungen.some(x => !["OFFEN", "R9_NACHGEWIESEN"].includes(x.status))) {
  fehler("R9-Anforderungsstatus ungueltig.");
}

const erwarteteFitness = new Set(["V5-FIT-007", "V5-FIT-020", "V5-FIT-046"]);
const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R9");
if (fitness.length !== erwarteteFitness.size
    || fitness.some(x => !erwarteteFitness.has(x.kennung))) {
  fehler("R9-Fitnessregelmenge weicht von der ratifizierten Menge ab.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x => x.phase === "R9");
if (trace.length !== erwarteteAnforderungen.size
    || trace.some(x => !erwarteteAnforderungen.has(x.anforderungKennung))) {
  fehler("R9-Traceability-Menge ist unvollstaendig.");
}

const bindungen = lies("ausfuehrung/vertraege/r9-bindungen.json");
if (bindungen.summary.gebunden !== 59 || bindungen.summary.deaktiviert !== 1) {
  fehler("R9 Action-/Verifier-/Recovery-Bindungsabdeckung ungueltig.");
}

if (r9.status === "DONE") {
  const abschluss = lies("roadmap/r9-abschluss.json");
  if (abschluss.phase !== "R9"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R9-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R9_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)
      || fitness.some(x => x.r9NachweisStatus !== "ERFUELLT")) {
    fehler("R9 DONE verlangt 4/4 Anforderungen, Traceability und 3/3 Fitness.");
  }
}

console.log("[V5-R9-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
