import crypto from "node:crypto";
import fs from "node:fs";

const liesText = pfad => fs.readFileSync(pfad, "utf8");
const katalog = JSON.parse(liesText("anzeigetexte/katalog.json"));

const quellen = [
  {
    kategorie: "FAEHIGKEIT",
    pfad: "wissensbasis/datenbank/aktuell/AL-DATA-SKILLS.txt",
    brauchtBeschreibung: true,
  },
  {
    kategorie: "KLASSE",
    pfad: "wissensbasis/datenbank/aktuell/AL-DATA-CLASSES.txt",
    brauchtBeschreibung: false,
  },
  {
    kategorie: "GEGENSTAND",
    pfad: "wissensbasis/datenbank/aktuell/AL-DATA-ITEMS.txt",
    brauchtBeschreibung: false,
  },
  {
    kategorie: "EREIGNIS",
    pfad: "wissensbasis/datenbank/aktuell/AL-DATA-EVENTS.txt",
    brauchtBeschreibung: false,
  },
  {
    kategorie: "MONSTER",
    pfad: "wissensbasis/datenbank/aktuell/AL-DATA-MONSTERS.txt",
    brauchtBeschreibung: false,
  },
];

function topLevelKennungen(text) {
  return [...text.matchAll(/^\t"([^"]+)":\s*\{/gm)].map(match => match[1]);
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function eintragGueltig(eintrag, quelle) {
  if (!eintrag || eintrag.schemaVersion !== 1 || eintrag.katalogVersion !== katalog.katalogVersion) {
    return false;
  }
  if (quelle.kategorie === "MONSTER") {
    if (eintrag.quellenStatus === "DEUTSCH_OFFIZIELL") {
      return String(eintrag.deutscherAnzeigename ?? "").trim().length > 0
        && String(eintrag.originalName ?? "").trim().length > 0;
    }
    if (eintrag.quellenStatus === "ORIGINALNAME_ERLAUBT") {
      return String(eintrag.originalName ?? "").trim().length > 0
        && String(eintrag.deutscherAnzeigename ?? "").trim().length === 0;
    }
    return false;
  }

  if (eintrag.quellenStatus !== "DEUTSCH_GEPRUEFT"
      || String(eintrag.deutscherAnzeigename ?? "").trim().length === 0) {
    return false;
  }
  if (quelle.brauchtBeschreibung
      && String(eintrag.deutscheBeschreibung ?? "").trim().length === 0) {
    return false;
  }
  return true;
}

const doppelt = new Set();
const gesehen = new Set();
for (const eintrag of katalog.eintraege ?? []) {
  const key = eintrag.kategorie + ":" + eintrag.externeKennung;
  if (gesehen.has(key)) doppelt.add(key);
  gesehen.add(key);
}
if (doppelt.size > 0) {
  throw new Error("[V5-R6-ANZEIGEKATALOG] Doppelte Eintraege: " + [...doppelt].join(", "));
}

const kategorien = {};
for (const quelle of quellen) {
  const roh = liesText(quelle.pfad);
  const erwartete = topLevelKennungen(roh);
  const passende = (katalog.eintraege ?? []).filter(eintrag => eintrag.kategorie === quelle.kategorie);
  const gueltigeKennungen = new Set(
    passende.filter(eintrag => eintragGueltig(eintrag, quelle)).map(eintrag => eintrag.externeKennung),
  );
  const fehlend = erwartete.filter(kennung => !gueltigeKennungen.has(kennung));
  kategorien[quelle.kategorie] = {
    quelle: quelle.pfad,
    quelleSha256: sha256(roh),
    erwartet: erwartete.length,
    abgedeckt: erwartete.length - fehlend.length,
    abdeckungProzent: erwartete.length === 0
      ? 100
      : ((erwartete.length - fehlend.length) * 100) / erwartete.length,
    fehlendAnzahl: fehlend.length,
    fehlendErste50: fehlend.slice(0, 50),
  };
}

const actionContracts = JSON.parse(liesText("wissensbasis/vertraege/action-contracts.json"));
const erwarteteAktionen = actionContracts.contracts.map(vertrag => vertrag.publicFunction);
const aktionsEintraege = (katalog.eintraege ?? [])
  .filter(eintrag => eintrag.kategorie === "AKTION" && eintragGueltig(eintrag, {
    kategorie: "AKTION",
    brauchtBeschreibung: false,
  }));
const aktionsKennungen = new Set(aktionsEintraege.map(eintrag => eintrag.externeKennung));
const fehlendeAktionen = erwarteteAktionen.filter(kennung => !aktionsKennungen.has(kennung));
kategorien.AKTION = {
  quelle: "wissensbasis/vertraege/action-contracts.json",
  quelleSha256: sha256(liesText("wissensbasis/vertraege/action-contracts.json")),
  erwartet: erwarteteAktionen.length,
  abgedeckt: erwarteteAktionen.length - fehlendeAktionen.length,
  abdeckungProzent: erwarteteAktionen.length === 0
    ? 100
    : ((erwarteteAktionen.length - fehlendeAktionen.length) * 100) / erwarteteAktionen.length,
  fehlendAnzahl: fehlendeAktionen.length,
  fehlendErste50: fehlendeAktionen.slice(0, 50),
};

const zustandsdaten = JSON.parse(liesText("zustaende/zustandsautomaten.json"));
const automaten = zustandsdaten.automaten ?? zustandsdaten.zustandsautomaten ?? [];
const erwarteteStatus = [...new Set(automaten.flatMap(automat => automat.zustaende ?? []))].sort();
const statusEintraege = (katalog.eintraege ?? [])
  .filter(eintrag => eintrag.kategorie === "STATUS" && eintragGueltig(eintrag, {
    kategorie: "STATUS",
    brauchtBeschreibung: false,
  }));
const statusKennungen = new Set(statusEintraege.map(eintrag => eintrag.externeKennung));
const fehlendeStatus = erwarteteStatus.filter(kennung => !statusKennungen.has(kennung));
kategorien.STATUS = {
  quelle: "zustaende/zustandsautomaten.json",
  quelleSha256: sha256(liesText("zustaende/zustandsautomaten.json")),
  erwartet: erwarteteStatus.length,
  abgedeckt: erwarteteStatus.length - fehlendeStatus.length,
  abdeckungProzent: erwarteteStatus.length === 0
    ? 100
    : ((erwarteteStatus.length - fehlendeStatus.length) * 100) / erwarteteStatus.length,
  fehlendAnzahl: fehlendeStatus.length,
  fehlendErste50: fehlendeStatus.slice(0, 50),
};

const weiterePflichtKategorien = {
  NICHTSPIELERFIGUR: "QUELLENMENGE_NOCH_ZU_DEFINIEREN",
  AUFGABE: "QUELLENMENGE_NOCH_ZU_DEFINIEREN",
};

const quellenKategorienBereit = Object.values(kategorien)
  .every(kategorie => kategorie.fehlendAnzahl === 0);
const weitereBereit = Object.values(weiterePflichtKategorien)
  .every(status => status === "BEREIT");

const bericht = {
  schemaVersion: 1,
  phase: "R6",
  stand: "2026-09-20",
  katalogVersion: katalog.katalogVersion,
  status: quellenKategorienBereit && weitereBereit ? "BEREIT" : "OFFEN",
  kategorien,
  weiterePflichtKategorien,
  hinweis: "R6 darf erst formal DONE werden, wenn alle uebersetzungspflichtigen Kategorien vollstaendig belegt sind.",
};
fs.writeFileSync(
  "r6-anzeigekatalog-abdeckung.json",
  JSON.stringify(bericht, null, 2) + "\n",
  "utf8",
);
console.log("[V5-R6-ANZEIGEKATALOG]", JSON.stringify(bericht));
