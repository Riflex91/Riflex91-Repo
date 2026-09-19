import fs from "node:fs";

const regelwerk = JSON.parse(fs.readFileSync("anzeigetexte/regelwerk.json", "utf8"));
const fehler = text => { throw new Error("[V5-R3-SICHTTEXT] " + text); };

if (regelwerk.sprache !== "de-DE") fehler("Sprache muss de-DE sein.");
if (regelwerk.freigabeMetriken?.deutscheAbdeckungUebersetzungspflichtigProzent !== 100) {
  fehler("Deutsche Abdeckung muss 100 Prozent sein.");
}
if (regelwerk.freigabeMetriken?.unerlaubteEnglischeRohtextLeaks !== 0
    || regelwerk.freigabeMetriken?.fehlendeErforderlicheUebersetzungen !== 0) {
  fehler("Rohtext-/Uebersetzungstoleranz muss null sein.");
}

for (const [kategorie, regeln] of Object.entries(regelwerk.kategorien ?? {})) {
  if (kategorie === "monster") continue;
  if (regeln.deutschPflicht !== true || regeln.englischerRohFallbackErlaubt !== false) {
    fehler("Kategorie ist nicht strikt deutsch: " + kategorie);
  }
}

const monster = regelwerk.kategorien?.monster;
if (!monster
    || monster.deutschPflicht !== "WENN_OFFIZIELLE_DEUTSCHE_SPIELBEZEICHNUNG_EXISTIERT"
    || monster.englischerRohFallbackErlaubt !== true
    || monster.eigeneErfundeneUebersetzungAlsOffiziell !== false) {
  fehler("Monster-Ausnahme ist nicht exakt begrenzt.");
}

console.log("[V5-R3-SICHTTEXT] OK");
