import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R16-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r15 = gates.phases?.find(x => x.id === "R15");
const r16 = gates.phases?.find(x => x.id === "R16");

if (r15?.status !== "DONE") fehler("R16 verlangt R15 DONE.");
if (!r16 || !["IN_PROGRESS", "DONE"].includes(r16.status)) {
  fehler("R16 muss IN_PROGRESS oder DONE sein.");
}
if (r16.status === "IN_PROGRESS" && gates.currentPhase !== "R16") {
  fehler("R16 IN_PROGRESS verlangt currentPhase=R16.");
}
if (r16.status === "DONE") {
  const r17 = gates.phases?.find(x => x.id === "R17");
  const spaetere = new Set(["R18", "R19"]);
  const direkt = gates.currentPhase === "R17" && r17?.status === "IN_PROGRESS";
  const weiter = spaetere.has(gates.currentPhase) && r17?.status === "DONE";
  if (!direkt && !weiter) {
    fehler("R16 DONE verlangt mindestens R17 IN_PROGRESS oder einen formal abgeschlossenen R17-Uebergang.");
  }
}
if (bereitschaft.status === "FREIGEGEBEN") {
  fehler("R16 darf die breite Gameplay-Runtime noch nicht freigeben.");
}

for (const pfad of [
  "grundlage/quelle/navigation/reise-arrival.ts",
  "grundlage/quelle/navigation/motion-freshness.ts",
  "grundlage/quelle/navigation/bewegungs-owner.ts",
  "grundlage/quelle/kampf/target-ownership.ts",
  "grundlage/quelle/kampf/skill-capability.ts",
  "grundlage/quelle/kampf/character-lifecycle.ts",
  "grundlage/quelle/kampf/threat-cc.ts",
  "grundlage/quelle/kampf/aoe-safety.ts",
  "grundlage/quelle/kampf/encounter-ledger.ts",
  "grundlage/quelle/gruppe/party-wahrheit.ts",
  "grundlage/quelle/gruppe/group-capabilities.ts",
  "grundlage/quelle/farmer/farmer-fsm.ts",
  "grundlage/tests/r16-arrival-motion.test.mjs",
  "grundlage/tests/r16-ownership-movement.test.mjs",
  "grundlage/tests/r16-party-skill-lifecycle.test.mjs",
  "grundlage/tests/r16-combat-farmer.test.mjs",
  "dokumentation/P1B-PARTY-COMBAT-NAVIGATION.md",
  "werkzeuge/r16-statische-guards.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("R16 Pflichtartefakt fehlt: " + pfad);
}

const p1b = fs.readFileSync("dokumentation/P1B-PARTY-COMBAT-NAVIGATION.md", "utf8");
if (!p1b.includes("**Status:** GESCHLOSSEN")) fehler("R16 verlangt geschlossenen P1B-Nachweis.");

const erwartet = new Set([
  "V5-ANF-WORLD-001",
  "V5-ANF-WORLD-002",
  "V5-ANF-WORLD-003",
]);
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R16" && x.prioritaet === "MUSS");
if (anforderungen.length !== erwartet.size
    || anforderungen.some(x => !erwartet.has(x.kennung))) {
  fehler("R16-MUSS-Anforderungsmenge ungueltig.");
}
if (anforderungen.some(x => !["OFFEN", "R16_NACHGEWIESEN"].includes(x.status))) {
  fehler("R16-Anforderungsstatus ungueltig.");
}

const trace = lies("anforderungen/nachverfolgbarkeit.json").eintraege
  .filter(x => x.phase === "R16");
if (trace.length !== erwartet.size
    || trace.some(x => !erwartet.has(x.anforderungKennung))) {
  fehler("R16-Traceability-Menge unvollstaendig.");
}

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R16");
if (fitness.length !== 0) fehler("R16 besitzt laut ratifizierter Fitnessdatei keine eigenen Fitnessregeln.");

if (r16.status === "DONE") {
  const abdeckung = lies("grundlage/vertraege/r16/party-combat-navigation-abdeckung.json");
  if (abdeckung.phase !== "R16"
      || abdeckung.status !== "TECHNISCH_BESTANDEN"
      || abdeckung.runtimeGate !== "GESPERRT"
      || abdeckung.gameplayAutoritaet !== false
      || abdeckung.rawWriteAutoritaet !== false
      || abdeckung.anforderungen?.length !== 3
      || abdeckung.anforderungen.some(x => x.status !== "ERFUELLT")) {
    fehler("R16-Abdeckung ungueltig.");
  }
  const abschluss = lies("roadmap/r16-abschluss.json");
  if (abschluss.phase !== "R16"
      || abschluss.status !== "DONE"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || abschluss.rawWriteAutoritaet !== false) {
    fehler("R16-Abschlussmanifest ungueltig.");
  }
  if (anforderungen.some(x => x.status !== "R16_NACHGEWIESEN")
      || trace.some(x => x.vollstaendig !== true)) {
    fehler("R16 DONE verlangt 3/3 Anforderungen und Traceability.");
  }
}

console.log("[V5-R16-STRUKTUR] OK / R16:", r16.status, "/ Runtime-Gate:", bereitschaft.status);
