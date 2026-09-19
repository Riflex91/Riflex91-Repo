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
  fehler("R4 darf das Gameplay-Runtime-Gesamtgate nicht freigeben.");
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
