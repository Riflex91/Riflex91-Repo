import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R11-TESTABDECKUNG] " + text); };
const lokal = pfad => pfad.startsWith("v5/") ? pfad.slice(3) : pfad;
const existiert = pfad => fs.existsSync(lokal(pfad));
const katalog = JSON.parse(fs.readFileSync("grundlage/vertraege/r11/core-testabdeckung.json", "utf8"));
if (katalog.schemaVersion !== 1 || katalog.pfade.length < 10) fehler("Core-Testkatalog unvollstaendig.");

for (const eintrag of katalog.pfade) {
  if (!existiert(eintrag.quelle)) fehler("Corequelle fehlt: " + eintrag.quelle);
  if (!Array.isArray(eintrag.positiv) || eintrag.positiv.length < 1) fehler("Positivtest fehlt: " + eintrag.quelle);
  if (!Array.isArray(eintrag.negativ) || eintrag.negativ.length < 1) fehler("Negativtest fehlt: " + eintrag.quelle);
  for (const test of [...eintrag.positiv, ...eintrag.negativ]) {
    if (!existiert(test)) fehler("Testdatei fehlt: " + test);
  }
}
const faults = JSON.parse(fs.readFileSync("grundlage/vertraege/r11/fault-matrix.json", "utf8"));
for (const art of [
  "CRASH_RESTART_NONTERMINAL",
  "DISCONNECT_AFTER_SEND_POSSIBLE",
  "TIMEOUT_AFTER_SEND_POSSIBLE",
  "PARTIAL_COMPLETION",
]) {
  const eintrag = faults.faults.find(x => x.art === art);
  if (!eintrag || eintrag.nachweis.length < 1) fehler("Pflicht-Fault fehlt: " + art);
  for (const test of eintrag.nachweis) if (!existiert(test)) fehler("Fault-Test fehlt: " + test);
}
console.log("[V5-R11-TESTABDECKUNG] OK / Corepfade:", katalog.pfade.length, "/ Faults:", faults.faults.length);
