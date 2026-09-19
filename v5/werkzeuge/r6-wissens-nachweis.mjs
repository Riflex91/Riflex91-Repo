import fs from "node:fs";
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const anforderungen = lies("anforderungen/anforderungen.json").anforderungen
  .filter(x => x.phase === "R6" && x.prioritaet === "MUSS");
const fitness = lies("fitness/fitness-regeln.json").regeln.filter(x => x.phase === "R6");
const bereitschaft = lies("bereitschaft/laufzeit-bereitschaft.json");
const anzeigekatalogAbdeckung = lies("r6-anzeigekatalog-abdeckung.json");
const skillUebersetzungen = lies("anzeigetexte/skill-uebersetzungen.json");
const itemUebersetzungen = lies("anzeigetexte/item-uebersetzungen.json");
const monsterLokalisierung = lies("anzeigetexte/monster-lokalisierungspruefung.json");
const nachweis = {
  schemaVersion: 1,
  phase: "R6",
  slice: "WISSENSZUGRIFF_VERIFIER_EVIDENCE_WORKING_SET_LEARNING",
  headSha: process.env.GITHUB_SHA ?? null,
  runtimeGate: bereitschaft.status,
  gameplayAutoritaet: false,
  rawWriteAutoritaet: false,
  r6MussAnforderungen: anforderungen.length,
  r6Fitnessregeln: fitness.length,
  anforderungenNachgewiesen: anforderungen.filter(x => x.status === "R6_NACHGEWIESEN").length,
  produktiverAnzeigekatalog: {
    skillUebersetzungen: skillUebersetzungen.uebersetzteEintraege,
    itemQuellvorkommen: itemUebersetzungen.quellenVorkommen,
    itemEindeutigeKennungen: itemUebersetzungen.eindeutigeKennungen,
    monsterLokalisierung: monsterLokalisierung.monsterQuelle.eintraege,
    monsterFallback: monsterLokalisierung.fallback,
  },
  anzeigekatalogAbdeckung: {
    status: anzeigekatalogAbdeckung.status,
    skills: anzeigekatalogAbdeckung.kategorien.FAEHIGKEIT,
    klassen: anzeigekatalogAbdeckung.kategorien.KLASSE,
    gegenstaende: anzeigekatalogAbdeckung.kategorien.GEGENSTAND,
    monster: anzeigekatalogAbdeckung.kategorien.MONSTER,
    events: anzeigekatalogAbdeckung.kategorien.EREIGNIS,
  },
  nachweise: [
    "grundlage/quelle/wissen/typen.ts",
    "grundlage/quelle/wissen/snapshot.ts",
    "grundlage/quelle/wissen/wissens-zugriff-port.ts",
    "grundlage/quelle/wissen/verifier.ts",
    "grundlage/quelle/wissen/abgleich.ts",
    "grundlage/quelle/wissen/drift-quarantaene.ts",
    "grundlage/tests/r6-wissen.test.mjs",
    "grundlage/tests/r6-evidence.test.mjs",
    "grundlage/quelle/wissen/wissens-promotion.ts",
    "grundlage/quelle/wissen/learning-evidence.ts",
    "grundlage/quelle/wissen/ram-arbeitsmenge.ts",
    "grundlage/quelle/wissen/beobachtungs-evidence.ts",
    "grundlage/quelle/anzeige/anzeigekatalog.ts",
    "grundlage/tests/r6-anzeigekatalog.test.mjs",
    "anzeigetexte/katalog.schema.json",
    "grundlage/quelle/wissen/live-wissens-publizierer.ts",
    "grundlage/quelle/wissen/beobachtungs-evidence-ablage.ts",
    "grundlage/tests/r6-publikation.test.mjs",
    "werkzeuge/r6-struktur-pruefen.mjs",
  ],
};
fs.writeFileSync("r6-wissensnachweis.json", JSON.stringify(nachweis, null, 2) + "\n", "utf8");
console.log("[V5-R6-NACHWEIS]", JSON.stringify(nachweis));
