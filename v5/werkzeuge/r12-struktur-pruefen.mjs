import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R12-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r12 = gates.phases?.find(x => x.id === "R12");

if (!r12 || !["IN_PROGRESS", "DONE"].includes(r12.status)) {
  fehler("R12 muss IN_PROGRESS oder DONE sein.");
}
if (r12.status === "IN_PROGRESS" && gates.currentPhase !== "R12") {
  fehler("R12 IN_PROGRESS verlangt currentPhase=R12.");
}
if (r12.status === "DONE") {
  const r13 = gates.phases?.find(x => x.id === "R13");
  const spaeterePhasen = new Set(["R14","R15","R16","R17","R18","R19"]);
  const direkterUebergang = gates.currentPhase === "R13" && r13?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r13?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R12 DONE verlangt mindestens R13 IN_PROGRESS oder einen formal abgeschlossenen R13-Uebergang.");
  }
  const live = lies("roadmap/r12-controlled-live-evidence.json");
  const abschluss = lies("roadmap/r12-abschluss.json");
  if (abschluss.phase !== "R12"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.breiteGameplayAutoritaet !== false
      || abschluss.controlledLiveTestgate?.status !== "BESTANDEN") {
    fehler("R12 DONE verlangt konsistentes Abschlussmanifest bei weiter gesperrter breiter Runtime.");
  }
  if (live.status !== "BESTANDEN"
      || live.controlledLiveTestGate !== "BESTANDEN"
      || live.actionContractId !== "AL-ACTION-EQUIP"
      || live.publicFunction !== "equip"
      || live.gameWrites !== 1
      || live.unerwarteteGameWrites !== 0
      || live.maximaleAktionen !== 1
      || live.breiteRuntimeFreigabe !== false) {
    fehler("R12 DONE verlangt echten, einmaligen Controlled-Live-Testnachweis ohne breite Runtime-Freigabe.");
  }
}

for (const pfad of [
  "grundlage/quelle/vertical-slice/protokoll.ts",
  "grundlage/quelle/vertical-slice/shadow-adapter.ts",
  "grundlage/quelle/vertical-slice/controlled-live-policy.ts",
  "grundlage/tests/r12-controlled-live-auswahl.test.mjs",
  "grundlage/tests/r12-controlled-live-gate.test.mjs",
  "grundlage/quelle/vertical-slice/controlled-live-auswahl.ts",
  "grundlage/quelle/vertical-slice/controlled-live-gate.ts",
  "grundlage/tests/r12-vertical-slice-shadow.test.mjs",
  "grundlage/tests/r12-controlled-live-runner.test.mjs",
  "werkzeuge/r12-controlled-live-equip-runner.mjs",
  "werkzeuge/r12-live/cdp.mjs",
  "werkzeuge/r12-live/datei-journal.mjs",
  "werkzeuge/r12-live/browser-equip.mjs",
  "architektur/adr/ADR-014-R12-CONTROLLED-LIVE-TESTGATE.md",
  "architektur/adr/ADR-015-V5-INGAME-TEST-GUI.md",
  "werkzeuge/v5-adventure-land-test-gui.js",
  "werkzeuge/r12-controlled-live-test-gui.js",
  "werkzeuge/r12-controlled-live-test-paket.js",
  "werkzeuge/r12-test-gui-paket-bauen.mjs",
  "werkzeuge/tests/r12-test-gui.test.mjs",
  "werkzeuge/V5-TEST-GUI.md",
  "werkzeuge/r12-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const erwarteteAnforderungen = new Set(["V5-ANF-TEST-007", "V5-ANF-TEST-008"]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R12" && x.prioritaet === "MUSS");
if (anforderungen.length !== 2
    || anforderungen.some(x => !erwarteteAnforderungen.has(x.kennung))) {
  fehler("R12-MUSS-Anforderungsmenge ungueltig.");
}
if (anforderungen.some(x => !["OFFEN", "R12_NACHGEWIESEN"].includes(x.status))) {
  fehler("R12-Anforderungsstatus ungueltig.");
}
const shadow = anforderungen.find(x => x.kennung === "V5-ANF-TEST-007");
const controlled = anforderungen.find(x => x.kennung === "V5-ANF-TEST-008");

if (bereitschaft.status === "FREIGEGEBEN" && r12.status !== "DONE") {
  fehler("Breite Runtime-Freigabe darf R12 nicht vor dessen Controlled-Live-Abschluss ueberholen.");
}
if (r12.status === "DONE"
    && (shadow?.status !== "R12_NACHGEWIESEN" || controlled?.status !== "R12_NACHGEWIESEN")) {
  fehler("R12 DONE verlangt beide MUSS-Anforderungen.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege.filter(x => x.phase === "R12");
if (trace.length !== 2) fehler("R12-Traceability-Menge unvollstaendig.");

console.log("[V5-R12-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status, "/ R12:", r12.status);
