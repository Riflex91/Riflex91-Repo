import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R14-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r13 = gates.phases?.find(x => x.id === "R13");
const r14 = gates.phases?.find(x => x.id === "R14");

if (r13?.status !== "DONE") fehler("R14 verlangt R13 DONE.");
if (!r14 || !["IN_PROGRESS", "DONE"].includes(r14.status)) {
  fehler("R14 muss IN_PROGRESS oder DONE sein.");
}
if (r14.status === "IN_PROGRESS" && gates.currentPhase !== "R14") {
  fehler("R14 IN_PROGRESS verlangt currentPhase=R14.");
}
if (r14.status === "DONE") {
  const r15 = gates.phases?.find(x => x.id === "R15");
  const spaeterePhasen = new Set(["R16", "R17", "R18", "R19"]);
  const direkterUebergang = gates.currentPhase === "R15" && r15?.status === "IN_PROGRESS";
  const bereitsWeiter = spaeterePhasen.has(gates.currentPhase) && r15?.status === "DONE";
  if (!direkterUebergang && !bereitsWeiter) {
    fehler("R14 DONE verlangt mindestens R15 IN_PROGRESS oder einen formal abgeschlossenen R15-Uebergang.");
  }
}
if (bereitschaft.status === "FREIGEGEBEN") {
  if (!fs.existsSync("roadmap/gesamtfreigabe.json")) {
    fehler("R14 darf die Runtime nicht selbst freigeben; finale Betreiber-Gesamtfreigabe-Evidence fehlt.");
  }
  const gesamtfreigabe = lies("roadmap/gesamtfreigabe.json");
  if (gesamtfreigabe.kennung !== "V5_GESAMTFREIGABE"
      || gesamtfreigabe.status !== "ERTEILT"
      || gesamtfreigabe.bestaetigungQuelle !== "BETREIBER_INTERAKTIV"
      || gesamtfreigabe.bestaetigungText !== "V5 GESAMTFREIGABE ERTEILEN"
      || bereitschaft.gesamtfreigabe !== "ERTEILT"
      || bereitschaft.breiteRuntimeFreigabe !== true) {
    fehler("R14 darf die Runtime nicht selbst freigeben; nur die spaetere explizite Post-R19-Gesamtfreigabe ist zulaessig.");
  }
}

for (const pfad of [
  "grundlage/quelle/koordination/cm-protokoll.ts",
  "grundlage/quelle/koordination/cm-settlement.ts",
  "grundlage/quelle/koordination/roster-wahrheit.ts",
  "grundlage/quelle/koordination/character-liveness.ts",
  "grundlage/quelle/koordination/account-koordinator.ts",
  "grundlage/quelle/koordination/character-agent.ts",
  "grundlage/tests/r14-cm-protokoll.test.mjs",
  "grundlage/tests/r14-cm-settlement.test.mjs",
  "grundlage/tests/r14-cm-fault-injektion.test.mjs",
  "grundlage/tests/r14-roster-liveness.test.mjs",
  "grundlage/tests/r14-koordinator-agent.test.mjs",
  "dokumentation/P1A-CM-MULTI-CHARACTER.md",
  "werkzeuge/r14-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("R14 Pflichtartefakt fehlt: " + pfad);
}

const p1a = fs.readFileSync("dokumentation/P1A-CM-MULTI-CHARACTER.md", "utf8");
if (!p1a.includes("**Status:** GESCHLOSSEN")) fehler("R14 verlangt geschlossenen P1A-Nachweis.");

const erwartet = new Set([
  "V5-ANF-MULTI-001",
  "V5-ANF-MULTI-002",
  "V5-ANF-MULTI-003",
  "V5-ANF-MULTI-004",
  "V5-ANF-MULTI-005",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R14" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwartet.size
    || anforderungen.some(x => !erwartet.has(x.kennung))) {
  fehler("R14-MUSS-Anforderungsmenge ungueltig.");
}
if (anforderungen.some(x => !["OFFEN", "R14_NACHGEWIESEN"].includes(x.status))) {
  fehler("R14-Anforderungsstatus ungueltig.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege
  .filter(x => x.phase === "R14");
if (trace.length !== erwartet.size
    || trace.some(x => !erwartet.has(x.anforderungKennung))) {
  fehler("R14-Traceability-Menge unvollstaendig.");
}

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R14");
if (fitness.length !== 1 || fitness[0]?.kennung !== "V5-FIT-042") {
  fehler("R14-Fitnessregel V5-FIT-042 fehlt oder ist nicht eindeutig.");
}

if (r14.status === "DONE") {
  const abdeckung = lies("grundlage/vertraege/r14/multi-character-abdeckung.json");
  if (abdeckung.phase !== "R14"
      || abdeckung.status !== "TECHNISCH_BESTANDEN"
      || abdeckung.runtimeGate !== "GESPERRT"
      || abdeckung.gameplayAutoritaet !== false
      || abdeckung.rawWriteAutoritaet !== false
      || abdeckung.anforderungen?.length !== 5
      || abdeckung.anforderungen.some(x => x.status !== "ERFUELLT")) {
    fehler("R14 Multi-Character-Abdeckung ungueltig.");
  }
  const abschluss = lies("roadmap/r14-abschluss.json");
  if (abschluss.phase !== "R14"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R14-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R14_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)) {
    fehler("R14 DONE verlangt 5/5 Anforderungen und Traceability.");
  }
}

console.log("[V5-R14-STRUKTUR] OK / R14:", r14.status, "/ Runtime-Gate:", bereitschaft.status);
