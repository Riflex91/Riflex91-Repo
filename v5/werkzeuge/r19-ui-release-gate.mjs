import fs from "node:fs";

const fehler = text => { throw new Error("[V5-R19-UI] " + text); };
const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const regelwerk = lies("anzeigetexte/regelwerk.json");
const monster = lies("anzeigetexte/monster-lokalisierungspruefung.json");
const abdeckung = lies("r6-anzeigekatalog-abdeckung.json");

if (regelwerk.sprache !== "de-DE") fehler("Release-Sprache muss de-DE sein.");
if (regelwerk.freigabeMetriken?.deutscheAbdeckungUebersetzungspflichtigProzent !== 100) {
  fehler("Deutsche Pflichtabdeckung muss 100 Prozent sein.");
}
if (regelwerk.freigabeMetriken?.unerlaubteEnglischeRohtextLeaks !== 0) {
  fehler("Unerlaubte englische Rohtext-Leaks muessen null sein.");
}
if (regelwerk.freigabeMetriken?.fehlendeErforderlicheUebersetzungen !== 0) {
  fehler("Fehlende erforderliche Uebersetzungen muessen null sein.");
}
if (abdeckung.status !== "BEREIT") fehler("R6-Anzeigekatalog-Abdeckung ist nicht BEREIT.");
for (const [kategorie, status] of Object.entries(abdeckung.kategorien ?? {})) {
  if (status.fehlendAnzahl !== 0 || status.abdeckungProzent !== 100) {
    fehler("Kategorie nicht 100 Prozent abgedeckt: " + kategorie);
  }
}
if (monster.fallback !== "ORIGINALNAME_ERLAUBT"
    || monster.monsterQuelle?.eintraege !== 129
    || monster.monster?.length !== 129
    || monster.monster.some(eintrag => eintrag.quellenStatus !== "ORIGINALNAME_ERLAUBT"
      && eintrag.quellenStatus !== "DEUTSCH_OFFIZIELL")) {
  fehler("Monster-Ausnahme ist nicht exakt auf den revalidierten Originalname-Fallback begrenzt.");
}
console.log("[V5-R19-UI] OK / 100 Prozent Pflichtabdeckung / 0 Rohtext-Leaks / Monster-Ausnahme begrenzt");
