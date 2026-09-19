import fs from "node:fs";

const daten = JSON.parse(fs.readFileSync("zustaende/zustandsautomaten.json", "utf8"));
const fehler = text => { throw new Error("[V5-R4-ZUSTAND] " + text); };

if (daten.status !== "R2_RATIFIZIERT") fehler("R2-Ratifizierungsstatus driftet.");
if (daten.r4Modellkorrektur?.status !== "R4_GESCHLOSSEN") fehler("R4-Modellkorrektur fehlt.");
if (daten.automaten?.length !== 13) fehler("Es muessen exakt 13 kritische Automaten vorliegen.");

for (const automat of daten.automaten) {
  const zustaende = automat.zustaende ?? [];
  const terminal = new Set(automat.terminal ?? []);
  const zustandsSet = new Set(zustaende);

  if (zustandsSet.size !== zustaende.length) fehler(automat.kennung + ": doppelte Zustaende");
  if (!zustandsSet.has(automat.start)) fehler(automat.kennung + ": Startzustand unbekannt");

  const kanten = new Set();
  for (const edge of automat.uebergaenge ?? []) {
    if (!zustandsSet.has(edge.von) || !zustandsSet.has(edge.nach)) {
      fehler(automat.kennung + ": Kante mit unbekanntem Zustand");
    }
    const key = edge.von + "->" + edge.nach;
    if (kanten.has(key)) fehler(automat.kennung + ": doppelte Kante " + key);
    kanten.add(key);
  }

  for (const ziel of terminal) {
    if (!zustandsSet.has(ziel)) fehler(automat.kennung + ": Terminalzustand unbekannt");
    if ((automat.uebergaenge ?? []).some(edge => edge.von === ziel)) {
      fehler(automat.kennung + ": Terminalzustand besitzt Ausgang " + ziel);
    }
  }

  const erreichbar = new Set([automat.start]);
  let veraendert = true;
  while (veraendert) {
    veraendert = false;
    for (const edge of automat.uebergaenge ?? []) {
      if (erreichbar.has(edge.von) && !erreichbar.has(edge.nach)) {
        erreichbar.add(edge.nach);
        veraendert = true;
      }
    }
  }

  for (const zustand of zustaende) {
    if (!erreichbar.has(zustand)) fehler(automat.kennung + ": unerreichbar " + zustand);
    if (!terminal.has(zustand)
        && !(automat.uebergaenge ?? []).some(edge => edge.von === zustand)) {
      fehler(automat.kennung + ": unbeabsichtigte Sackgasse " + zustand);
    }
  }

  if (automat.unbekannterUebergang !== "FAIL_CLOSED") {
    fehler(automat.kennung + ": unbekannte Uebergaenge muessen fail-closed sein");
  }
}

const transaktion = daten.automaten.find(a => a.kennung === "V5-ZUSTAND-TRANSAKTION");
if (!transaktion) fehler("Transaktionsautomat fehlt.");
if (transaktion.uebergaenge.some(e => e.von === "ERGEBNIS_UNBEKANNT" && e.nach === "GESENDET")) {
  fehler("UNKNOWN darf keinen direkten Re-Send besitzen.");
}

const item = daten.automaten.find(a => a.kennung === "V5-ZUSTAND-MEHRPHASEN_ITEMAKTION");
if (!item) fehler("Mehrphasen-Itemautomat fehlt.");
if (item.uebergaenge.some(e => e.von === "GESENDET" && e.nach === "ABGEBROCHEN")) {
  fehler("Nach Send darf Itemaktion nicht direkt abgebrochen werden.");
}

const produktion = daten.automaten.find(a => a.kennung === "V5-ZUSTAND-PRODUKTION");
if (!produktion) fehler("Produktionsautomat fehlt.");
if (produktion.uebergaenge.some(e => e.von === "HERSTELLUNG_LAEUFT" && e.nach === "ABGEBROCHEN")) {
  fehler("Laufende Herstellung darf nicht blind abgebrochen werden.");
}

console.log("[V5-R4-ZUSTAND] OK:", daten.automaten.length);
