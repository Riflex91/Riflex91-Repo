import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R4-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");

for (const pfad of [
  "grundlage/quelle/determinismus/ports.ts",
  "grundlage/quelle/determinismus/uhr.ts",
  "grundlage/quelle/determinismus/zufall.ts",
  "grundlage/quelle/determinismus/kennungen.ts",
  "grundlage/quelle/determinismus/sequenz.ts",
  "grundlage/quelle/kern/ergebnis.ts",
  "grundlage/quelle/kern/zeit.ts",
  "grundlage/quelle/kern/prioritaet.ts",
  "grundlage/quelle/kern/begrenzte-warteschlange.ts",
  "grundlage/quelle/kern/kanonische-serialisierung.ts",
  "grundlage/quelle/kern/domaenen-ereignis.ts",
  "grundlage/quelle/kern/geschlossener-zustandsautomat.ts",
  "grundlage/quelle/testlabor/deterministischer-szenario-lauf.ts",
  "grundlage/quelle/testlabor/replay-format.ts",
  "grundlage/tests/r4-determinismus.test.mjs",
  "werkzeuge/r4-zustandsmodelle-pruefen.mjs",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const r4 = gates.phases?.find(x => x.id === "R4");
if (!r4 || !["IN_PROGRESS", "DONE"].includes(r4.status)) fehler("R4 muss IN_PROGRESS oder DONE sein.");
if (r4.status === "IN_PROGRESS" && gates.currentPhase !== "R4") fehler("R4 IN_PROGRESS verlangt currentPhase=R4.");

if (bereitschaft.status === "FREIGEGEBEN") {
  if (!fs.existsSync("roadmap/gesamtfreigabe.json")) {
    fehler("R4 darf die Runtime nicht selbst freigeben; finale Betreiber-Gesamtfreigabe-Evidence fehlt.");
  }
  const gesamtfreigabe = lies("roadmap/gesamtfreigabe.json");
  if (gesamtfreigabe.kennung !== "V5_GESAMTFREIGABE"
      || gesamtfreigabe.status !== "ERTEILT"
      || gesamtfreigabe.bestaetigungQuelle !== "BETREIBER_INTERAKTIV"
      || gesamtfreigabe.bestaetigungText !== "V5 GESAMTFREIGABE ERTEILEN"
      || bereitschaft.gesamtfreigabe !== "ERTEILT"
      || bereitschaft.breiteRuntimeFreigabe !== true) {
    fehler("R4 darf die Runtime nicht selbst freigeben; nur die spaetere explizite Post-R19-Gesamtfreigabe ist zulaessig.");
  }
}

if (r4.status === "DONE") {
  const phaseIds = (gates.phases ?? []).map(x => x.id);
  if (phaseIds.indexOf(gates.currentPhase) <= phaseIds.indexOf("R4")) {
    fehler("Nach R4 DONE muss eine spaetere Phase currentPhase sein.");
  }

  const abschluss = lies("roadmap/r4-abschluss.json");
  if (abschluss.status !== "DONE"
      || abschluss.phase !== "R4"
      || abschluss.runtimeGate !== "GESPERRT"
      || abschluss.gameplayAutoritaet !== false
      || Object.values(abschluss.exitKriterien ?? {}).some(wert => wert !== true)) {
    fehler("R4-Abschlussmanifest ist unvollstaendig.");
  }

  const anforderungen = lies("anforderungen/anforderungen.json");
  const r4Anforderungen = anforderungen.anforderungen.filter(x => x.phase === "R4");
  if (r4Anforderungen.length !== 6
      || r4Anforderungen.some(x => x.status !== "R4_NACHGEWIESEN")) {
    fehler("R4-Anforderungen sind nicht 6/6 technisch nachgewiesen.");
  }

  const trace = lies("anforderungen/nachverfolgbarkeit.json");
  const r4Ids = new Set(r4Anforderungen.map(x => x.kennung));
  const r4Trace = trace.eintraege.filter(x => r4Ids.has(x.anforderungKennung));
  if (r4Trace.length !== 6
      || r4Trace.some(x => x.vollstaendig !== true || x.r4NachweisStatus !== "R4_NACHGEWIESEN")) {
    fehler("R4-Traceability ist nicht 6/6 vollstaendig.");
  }

  const fitness = lies("fitness/fitness-regeln.json");
  const r4Fitness = fitness.regeln.filter(x => x.phase === "R4");
  if (r4Fitness.length !== 4
      || r4Fitness.some(x => x.r4NachweisStatus !== "ERFUELLT")) {
    fehler("R4-Fitnessregeln sind nicht vollstaendig nachgewiesen.");
  }

  for (const kennung of ["ZUSTANDSMASCHINEN_BEREIT", "TESTSTRATEGIE_BEREIT"]) {
    const bereich = bereitschaft.bereiche.find(x => x.kennung === kennung);
    if (!bereich || bereich.erfuellt !== true) {
      fehler("Readiness-Bereich fehlt nach R4: " + kennung);
    }
  }
}

const index = fs.readFileSync("grundlage/quelle/index.ts", "utf8");
for (const exportPfad of [
  "./determinismus/ports.js",
  "./determinismus/uhr.js",
  "./determinismus/zufall.js",
  "./determinismus/kennungen.js",
  "./determinismus/sequenz.js",
  "./kern/ergebnis.js",
  "./kern/zeit.js",
  "./kern/prioritaet.js",
  "./kern/begrenzte-warteschlange.js",
  "./kern/kanonische-serialisierung.js",
  "./kern/domaenen-ereignis.js",
  "./kern/geschlossener-zustandsautomat.js",
  "./testlabor/deterministischer-szenario-lauf.js",
  "./testlabor/replay-format.js",
]) {
  if (!index.includes(exportPfad)) fehler("Index-Export fehlt: " + exportPfad);
}

console.log("[V5-R4-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
