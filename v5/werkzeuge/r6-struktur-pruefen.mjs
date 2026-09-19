import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R6-STRUKTUR] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const gates = lies("roadmap/gates.json");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const r6 = gates.phases?.find(x => x.id === "R6");

if (!r6 || !["IN_PROGRESS", "DONE"].includes(r6.status)) fehler("R6 muss IN_PROGRESS oder DONE sein.");
if (r6.status === "IN_PROGRESS" && gates.currentPhase !== "R6") fehler("R6 IN_PROGRESS verlangt currentPhase=R6.");
if (bereitschaft.status === "FREIGEGEBEN") fehler("R6 darf Gameplay-Runtime nicht freigeben.");

for (const pfad of [
  "grundlage/quelle/wissen/typen.ts",
  "grundlage/quelle/wissen/snapshot.ts",
  "grundlage/quelle/wissen/wissens-zugriff-port.ts",
  "grundlage/quelle/wissen/verifier.ts",
  "grundlage/quelle/wissen/abgleich.ts",
  "grundlage/quelle/wissen/drift-quarantaene.ts",
  "grundlage/tests/r6-wissen.test.mjs",
  "architektur/adr/ADR-004-R6-WISSEN-WELTWAHRHEIT.md",
]) {
  if (!fs.existsSync(pfad)) fehler("Pflichtartefakt fehlt: " + pfad);
}

const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R6" && x.prioritaet === "MUSS");
if (anforderungen.length !== 13) fehler("R6 muss exakt 13 ratifizierte MUSS-Anforderungen besitzen.");

const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R6");
if (fitness.length !== 7) fehler("R6 muss exakt 7 ratifizierte Fitnessregeln besitzen.");

const typen = fs.readFileSync("grundlage/quelle/wissen/typen.ts", "utf8");
for (const name of ["DefinitionsWissen","SpielBeobachtung","LiveVerifizierterFakt","AbgeglicheneWeltWahrheit"]) {
  if (!typen.includes("interface " + name)) fehler("Getrennter R6-Typ fehlt: " + name);
}
if (!typen.includes("ausfuehrungsAutoritaet: false") || !typen.includes("mutationAutorisiert: false")) {
  fehler("R6-Wissen darf keine ExecutionAuthority tragen.");
}

const zugriff = fs.readFileSync("grundlage/quelle/wissen/wissens-zugriff-port.ts", "utf8");
if (!zugriff.includes("interface WissensZugriffPort")
    || !zugriff.includes("gibGepinntenSnapshot")
    || !zugriff.includes("liesKanonischeDatei")) {
  fehler("Read-only WissensZugriffPort unvollstaendig.");
}
if (/\b(?:schreibe|loesche|aktualisiere|ersetze)\w*\s*\(/.test(zugriff)) {
  fehler("WissensZugriffPort enthaelt mutierende API.");
}

const snapshot = fs.readFileSync("grundlage/quelle/wissen/snapshot.ts", "utf8");
if (!snapshot.includes("HashPrueferPort") || !snapshot.includes("pinneWissensSnapshot")
    || !snapshot.includes("WISSEN_SNAPSHOT_HASH_FALSCH")
    || !snapshot.includes("WISSEN_SNAPSHOT_ZU_VIELE_DATEIEN")) {
  fehler("Snapshot-Pinning/Hash/Bounds unvollstaendig.");
}

const verifier = fs.readFileSync("grundlage/quelle/wissen/verifier.ts", "utf8");
if (!verifier.includes("FachlicherLiveVerifier")
    || !verifier.includes('"LIVE_SPIEL"')
    || !verifier.includes('"LIVE_VERIFIZIERT"')) {
  fehler("LIVE_VERIFIZIERT-Verifiervertrag unvollstaendig.");
}

const abgleich = fs.readFileSync("grundlage/quelle/wissen/abgleich.ts", "utf8");
if (!abgleich.includes('"VERALTET"') || !abgleich.includes('"WIDERSPRUCH"')
    || !abgleich.includes("mutationAutorisiert: false")) {
  fehler("World-Truth-Frische/Widerspruch fail-closed unvollstaendig.");
}

const drift = fs.readFileSync("grundlage/quelle/wissen/drift-quarantaene.ts", "utf8");
if (!drift.includes('"QUARANTAENE"') || !drift.includes("automatischeFreigabe: false")
    || !drift.includes("mutationAutorisiert: false")) {
  fehler("Drift-Quarantaenevertrag unvollstaendig.");
}

const index = fs.readFileSync("grundlage/quelle/index.ts", "utf8");
for (const exportPfad of [
  "./wissen/typen.js","./wissen/snapshot.js","./wissen/wissens-zugriff-port.js",
  "./wissen/verifier.js","./wissen/abgleich.js","./wissen/drift-quarantaene.js",
]) {
  if (!index.includes(exportPfad)) fehler("Index-Export fehlt: " + exportPfad);
}
console.log("[V5-R6-STRUKTUR] OK / Runtime-Gate:", bereitschaft.status);
