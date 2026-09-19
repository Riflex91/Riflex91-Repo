import fs from "node:fs";
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R6" && x.prioritaet === "MUSS");
const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R6");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const nachweis = {
  schemaVersion: 1,
  phase: "R6",
  slice: "WISSENSZUGRIFF_SNAPSHOT_VERIFIER_WELTWAHRHEIT",
  headSha: process.env.GITHUB_SHA ?? null,
  runtimeGate: bereitschaft.status,
  gameplayAutoritaet: false,
  rawWriteAutoritaet: false,
  r6MussAnforderungen: anforderungen.length,
  r6Fitnessregeln: fitness.length,
  nachweise: [
    "grundlage/quelle/wissen/typen.ts",
    "grundlage/quelle/wissen/snapshot.ts",
    "grundlage/quelle/wissen/wissens-zugriff-port.ts",
    "grundlage/quelle/wissen/verifier.ts",
    "grundlage/quelle/wissen/abgleich.ts",
    "grundlage/quelle/wissen/drift-quarantaene.ts",
    "grundlage/tests/r6-wissen.test.mjs",
    "werkzeuge/r6-struktur-pruefen.mjs",
  ],
};
fs.writeFileSync("r6-wissensnachweis.json", JSON.stringify(nachweis, null, 2) + "\n", "utf8");
console.log("[V5-R6-NACHWEIS]", JSON.stringify(nachweis));
