import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R8-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r8 = gates.phases?.find(x => x.id === "R8");

if (!r8 || !["IN_PROGRESS", "DONE"].includes(r8.status)) {
  fehler("R8 muss IN_PROGRESS oder DONE sein.");
}
if (r8.status === "IN_PROGRESS" && gates.currentPhase !== "R8") {
  fehler("R8 IN_PROGRESS verlangt currentPhase=R8.");
}
if (r8.status === "DONE") {
  const r9 = gates.phases?.find(x => x.id === "R9");
  const spaeterePhasen = new Set(["R10","R11","R12","R13","R14","R15","R16","R17","R18","R19"]);
  const direkterUebergang = gates.currentPhase === "R9" && r9?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r9?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R8 DONE verlangt mindestens R9 IN_PROGRESS oder einen formal abgeschlossenen R9-Uebergang.");
  }
}
if (r8.blocksRuntime !== true) fehler("R8 muss das Gameplay-Runtime-Gate blockieren.");
if (bereitschaft.status === "FREIGEGEBEN") fehler("R8 darf Gameplay-Runtime nicht freigeben.");

for (const pfad of [
  "grundlage/quelle/scheduler/workflow-vertrag.ts",
  "grundlage/quelle/scheduler/ressourcen-verwalter.ts",
  "grundlage/quelle/scheduler/socket-budget.ts",
  "grundlage/quelle/scheduler/retry-circuit.ts",
  "grundlage/quelle/scheduler/ablauf-scheduler.ts",
  "grundlage/tests/r8-scheduler.test.mjs",
  "grundlage/tests/r8-ressourcen.test.mjs",
  "grundlage/tests/r8-retry.test.mjs",
  "werkzeuge/r8-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const erwarteteAnforderungen = new Set([
  "V5-ANF-ARCH-007",
  "V5-ANF-ARCH-008",
  "V5-ANF-SICH-012",
  "V5-ANF-TRANS-004",
  "V5-ANF-TRANS-005",
  "V5-ANF-WISSEN-019",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R8" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwarteteAnforderungen.size
    || anforderungen.some(x => !erwarteteAnforderungen.has(x.kennung))) {
  fehler("R8-MUSS-Anforderungsmenge weicht von der ratifizierten Menge ab.");
}
if (anforderungen.some(x => !["OFFEN", "R8_NACHGEWIESEN"].includes(x.status))) {
  fehler("R8-Anforderungsstatus ungueltig.");
}

const erwarteteFitness = new Set(["V5-FIT-039", "V5-FIT-041"]);
const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R8");
if (fitness.length !== erwarteteFitness.size
    || fitness.some(x => !erwarteteFitness.has(x.kennung))) {
  fehler("R8-Fitnessregelmenge weicht von der ratifizierten Menge ab.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x => x.phase === "R8");
if (trace.length !== erwarteteAnforderungen.size
    || trace.some(x => !erwarteteAnforderungen.has(x.anforderungKennung))) {
  fehler("R8-Traceability-Menge ist unvollstaendig.");
}

const workflow = fs.readFileSync("grundlage/quelle/scheduler/workflow-vertrag.ts", "utf8");
if (!workflow.includes("WissensSnapshotPin")
    || !workflow.includes("gitCommit")
    || !workflow.includes("quellenSha256")) {
  fehler("Workflow-Snapshot-Pinning fehlt.");
}

const ressourcen = fs.readFileSync("grundlage/quelle/scheduler/ressourcen-verwalter.ts", "utf8");
if (!ressourcen.includes("FencingToken")
    || !ressourcen.includes("epoche")
    || !ressourcen.includes("ABGELAUFEN_ABGLEICH")
    || !ressourcen.includes("RESSOURCE_BELEGT")) {
  fehler("Ressourcen Lease/Fencing/No-Steal unvollstaendig.");
}

const budget = fs.readFileSync("grundlage/quelle/scheduler/socket-budget.ts", "utf8");
if (!budget.includes("actionKanalRessourcenId")
    || !budget.includes("socketBudgetRessourcenId")
    || !budget.includes("planBudget = 100")
    || !budget.includes("serverGrenze = 200")) {
  fehler("Action-Channel-/Socket-Budget-Vertrag unvollstaendig.");
}

const scheduler = fs.readFileSync("grundlage/quelle/scheduler/ablauf-scheduler.ts", "utf8");
if (!scheduler.includes("agingIntervallMs")
    || !scheduler.includes("WARTEN_BIS_SICHERER_PUNKT")
    || !scheduler.includes("istSafetyOderNotfall")) {
  fehler("Scheduler Aging/Safe-Preemption unvollstaendig.");
}

const retry = fs.readFileSync("grundlage/quelle/scheduler/retry-circuit.ts", "utf8");
if (!retry.includes("VERSUCHE_AUSGESCHOEPFT")
    || !retry.includes("ZEITBUDGET_AUSGESCHOEPFT")
    || !retry.includes("CIRCUIT_OFFEN")) {
  fehler("Retry-/Circuit-Grenzen unvollstaendig.");
}

const index = fs.readFileSync("grundlage/quelle/index.ts", "utf8");
for (const exportPfad of [
  "./scheduler/workflow-vertrag.js",
  "./scheduler/ressourcen-verwalter.js",
  "./scheduler/socket-budget.js",
  "./scheduler/retry-circuit.js",
  "./scheduler/ablauf-scheduler.js",
]) {
  if (!index.includes(exportPfad)) fehler("R8 Index-Export fehlt: " + exportPfad);
}

if (r8.status === "DONE") {
  const abschluss = lies("roadmap/r8-abschluss.json");
  if (abschluss.phase !== "R8"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R8-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R8_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)
      || fitness.some(x => x.r8NachweisStatus !== "ERFUELLT")) {
    fehler("R8 DONE verlangt 6/6 Anforderungen, Traceability und 2/2 Fitness.");
  }
}

console.log("[V5-R8-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
