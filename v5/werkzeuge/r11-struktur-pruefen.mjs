import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R11-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r11 = gates.phases?.find(x => x.id === "R11");

if (!r11 || !["IN_PROGRESS", "DONE"].includes(r11.status)) {
  fehler("R11 muss IN_PROGRESS oder DONE sein.");
}
if (r11.status === "IN_PROGRESS" && gates.currentPhase !== "R11") {
  fehler("R11 IN_PROGRESS verlangt currentPhase=R11.");
}
if (r11.status === "DONE") {
  const r12 = gates.phases?.find(x => x.id === "R12");
  const spaeterePhasen = new Set(["R13","R14","R15","R16","R17","R18","R19"]);
  const direkterUebergang = gates.currentPhase === "R12" && r12?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r12?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R11 DONE verlangt mindestens R12 IN_PROGRESS oder einen formal abgeschlossenen R12-Uebergang.");
  }
}
if (r11.blocksRuntime !== true) fehler("R11 muss das Gameplay-Runtime-Gate blockieren.");
if (bereitschaft.status === "FREIGEGEBEN") {
  if (!fs.existsSync("roadmap/gesamtfreigabe.json")) {
    fehler("R11 darf die Runtime nicht selbst freigeben; finale Betreiber-Gesamtfreigabe-Evidence fehlt.");
  }
  const gesamtfreigabe = lies("roadmap/gesamtfreigabe.json");
  if (gesamtfreigabe.kennung !== "V5_GESAMTFREIGABE"
      || gesamtfreigabe.status !== "ERTEILT"
      || gesamtfreigabe.bestaetigungQuelle !== "BETREIBER_INTERAKTIV"
      || gesamtfreigabe.bestaetigungText !== "V5 GESAMTFREIGABE ERTEILEN"
      || bereitschaft.gesamtfreigabe !== "ERTEILT"
      || bereitschaft.breiteRuntimeFreigabe !== true) {
    fehler("R11 darf die Runtime nicht selbst freigeben; nur die spaetere explizite Post-R19-Gesamtfreigabe ist zulaessig.");
  }
}

for (const pfad of [
  "grundlage/quelle/operations/health.ts",
  "grundlage/quelle/operations/alerts.ts",
  "grundlage/quelle/operations/authority-status.ts",
  "grundlage/quelle/operations/telemetrie.ts",
  "grundlage/quelle/operations/headless-supervisor.ts",
  "grundlage/quelle/operations/safe-auto-updater.ts",
  "grundlage/quelle/control/remote-config.ts",
  "grundlage/quelle/control/request-budget.ts",
  "grundlage/quelle/operations/segment-pflege.ts",
  "grundlage/quelle/testlabor/golden-replay.ts",
  "grundlage/quelle/testlabor/evidence-replay.ts",
  "grundlage/tests/r11-operations.test.mjs",
  "grundlage/tests/r11-safe-auto-updater.test.mjs",
  "grundlage/tests/r11-cloud-control.test.mjs",
  "grundlage/tests/r11-replay.test.mjs",
  "grundlage/tests/r11-property-model.test.mjs",
  "grundlage/tests/r11-fault-labor.test.mjs",
  "grundlage/tests/r11-mutation.test.mjs",
  "grundlage/vertraege/r11/core-testabdeckung.json",
  "grundlage/vertraege/r11/fault-matrix.json",
  "werkzeuge/r11-safety-source-checks.mjs",
  "werkzeuge/r11-testabdeckung.mjs",
  "werkzeuge/r11-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const erwarteteAnforderungen = new Set([
  "V5-ANF-SICH-009",
  "V5-ANF-TEST-001",
  "V5-ANF-TEST-002",
  "V5-ANF-TEST-003",
  "V5-ANF-TEST-004",
  "V5-ANF-TEST-005",
  "V5-ANF-OPS-002",
  "V5-ANF-OPS-003",
  "V5-ANF-OPS-004",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R11" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwarteteAnforderungen.size
    || anforderungen.some(x => !erwarteteAnforderungen.has(x.kennung))) {
  fehler("R11-MUSS-Anforderungsmenge weicht von der ratifizierten Menge ab.");
}
if (anforderungen.some(x => !["OFFEN", "R11_NACHGEWIESEN"].includes(x.status))) {
  fehler("R11-Anforderungsstatus ungueltig.");
}

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R11");
if (fitness.length !== 0) fehler("R11 besitzt laut ratifizierter Fitnessdatei keine eigenen Fitnessregeln.");

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x => x.phase === "R11");
if (trace.length !== erwarteteAnforderungen.size
    || trace.some(x => !erwarteteAnforderungen.has(x.anforderungKennung))) {
  fehler("R11-Traceability-Menge ist unvollstaendig.");
}

if (r11.status === "DONE") {
  const abschluss = lies("roadmap/r11-abschluss.json");
  if (abschluss.phase !== "R11"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R11-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R11_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)) {
    fehler("R11 DONE verlangt 9/9 Anforderungen und Traceability.");
  }
}

console.log("[V5-R11-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
