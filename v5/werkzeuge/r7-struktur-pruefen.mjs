import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R7-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r7 = gates.phases?.find(x => x.id === "R7");

if (!r7 || !["IN_PROGRESS", "DONE"].includes(r7.status)) {
  fehler("R7 muss IN_PROGRESS oder DONE sein.");
}
if (r7.status === "IN_PROGRESS" && gates.currentPhase !== "R7") {
  fehler("R7 IN_PROGRESS verlangt currentPhase=R7.");
}
if (r7.status === "DONE") {
  const r8 = gates.phases?.find(x => x.id === "R8");
  const spaeterePhasen = new Set(["R9","R10","R11","R12","R13","R14","R15","R16","R17","R18"]);
  const direkterUebergang = gates.currentPhase === "R8" && r8?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r8?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R7 DONE verlangt mindestens R8 IN_PROGRESS oder einen formal abgeschlossenen R8-Uebergang.");
  }
}
if (r7.blocksRuntime !== true) {
  fehler("R7 muss das Gameplay-Runtime-Gate blockieren.");
}
if (bereitschaft.status === "FREIGEGEBEN") {
  fehler("R7 darf Gameplay-Runtime nicht freigeben.");
}

const pflichtartefakte = [
  "grundlage/quelle/autoritaet/ports.ts",
  "grundlage/quelle/autoritaet/modul-register.ts",
  "grundlage/quelle/autoritaet/faehigkeits-register.ts",
  "grundlage/quelle/autoritaet/bediener-richtlinie.ts",
  "grundlage/tests/r7-module.test.mjs",
  "grundlage/tests/r7-autoritaet.test.mjs",
  "werkzeuge/r7-statische-guards.mjs",
];
for (const pfad of pflichtartefakte) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const erwarteteAnforderungen = new Set([
  "V5-ANF-ARCH-002",
  "V5-ANF-ARCH-004",
  "V5-ANF-SICH-001",
  "V5-ANF-SICH-007",
  "V5-ANF-OPS-008",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R7" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwarteteAnforderungen.size
    || anforderungen.some(x => !erwarteteAnforderungen.has(x.kennung))) {
  fehler("R7-MUSS-Anforderungsmenge weicht von der ratifizierten Menge ab.");
}
if (anforderungen.some(x => !["OFFEN", "R7_NACHGEWIESEN"].includes(x.status))) {
  fehler("R7-Anforderungsstatus ungueltig.");
}

const erwarteteFitness = new Set(["V5-FIT-005", "V5-FIT-006", "V5-FIT-044"]);
const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R7");
if (fitness.length !== erwarteteFitness.size
    || fitness.some(x => !erwarteteFitness.has(x.kennung))) {
  fehler("R7-Fitnessregelmenge weicht von der ratifizierten Menge ab.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x => x.phase === "R7");
if (trace.length !== erwarteteAnforderungen.size
    || trace.some(x => !erwarteteAnforderungen.has(x.anforderungKennung))) {
  fehler("R7-Traceability-Menge ist unvollstaendig.");
}

const faehigkeiten = fs.readFileSync(
  "grundlage/quelle/autoritaet/faehigkeits-register.ts",
  "utf8",
);
for (const marker of [
  '"LESEN"',
  '"PLANEN"',
  '"MUTIEREN"',
  "MUTIERENDER_OWNER_BEREITS_VERGEBEN",
  "MUTIERENDE_FAEHIGKEIT_STANDARD_AKTIV_VERBOTEN",
  "R7_MUTIERENDE_AKTIVIERUNG_GESPERRT",
  "ersetzeMutierendenAnbieter",
]) {
  if (!faehigkeiten.includes(marker)) fehler("Faehigkeitsregister-Regel fehlt: " + marker);
}

const module = fs.readFileSync(
  "grundlage/quelle/autoritaet/modul-register.ts",
  "utf8",
);
for (const marker of [
  "bereitgestelltePorts",
  "benoetigtePorts",
  "gleicherPortVertrag",
  "R7_MODUL_STANDARD_AKTIV_VERBOTEN",
  "MODUL_ID_BEREITS_AKTIV",
  "ersetzeAktiveVersion",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!module.includes(marker)) fehler("Modulregister-Regel fehlt: " + marker);
}

const bediener = fs.readFileSync(
  "grundlage/quelle/autoritaet/bediener-richtlinie.ts",
  "utf8",
);
for (const marker of [
  "BedienerProtokollPort",
  '"NOTHALT_AKTIVIEREN"',
  '"FAEHIGKEIT_SPERREN"',
  "gameplayAutoritaetErhoeht: false",
  "safetyUmgangen: false",
]) {
  if (!bediener.includes(marker)) fehler("Bediener-Richtlinienregel fehlt: " + marker);
}

const index = fs.readFileSync("grundlage/quelle/index.ts", "utf8");
for (const exportPfad of [
  "./autoritaet/ports.js",
  "./autoritaet/modul-register.js",
  "./autoritaet/faehigkeits-register.js",
  "./autoritaet/bediener-richtlinie.js",
]) {
  if (!index.includes(exportPfad)) fehler("R7 Index-Export fehlt: " + exportPfad);
}

if (r7.status === "DONE") {
  const abschluss = lies("roadmap/r7-abschluss.json");
  if (abschluss.phase !== "R7"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R7-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R7_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)
      || fitness.some(x => x.r7NachweisStatus !== "ERFUELLT")) {
    fehler("R7 DONE verlangt 5/5 Anforderungen, Traceability und 3/3 Fitness.");
  }
}

console.log("[V5-R7-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
