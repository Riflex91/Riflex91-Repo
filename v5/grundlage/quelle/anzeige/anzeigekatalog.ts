export type AnzeigeKategorie =
  | "FAEHIGKEIT"
  | "KLASSE"
  | "GEGENSTAND"
  | "NICHTSPIELERFIGUR"
  | "EREIGNIS"
  | "AUFGABE"
  | "AKTION"
  | "STATUS"
  | "MONSTER";

export type AnzeigeQuellenStatus =
  | "DEUTSCH_GEPRUEFT"
  | "DEUTSCH_OFFIZIELL"
  | "ORIGINALNAME_ERLAUBT";

export interface AnzeigeKatalogEintrag {
  readonly schemaVersion: 1;
  readonly katalogVersion: number;
  readonly externeKennung: string;
  readonly kategorie: AnzeigeKategorie;
  readonly deutscherAnzeigename?: string;
  readonly deutscheBeschreibung?: string;
  readonly originalName?: string;
  readonly quellenStatus: AnzeigeQuellenStatus;
  readonly revalidiertAm: string;
  readonly quellenNachweis: string;
}

export interface AnzeigeAufloesung {
  readonly text: string;
  readonly beschreibung?: string;
  readonly vollstaendig: boolean;
  readonly fallbackArt:
    | "KEINER"
    | "SICHERER_DEUTSCHER_PLATZHALTER"
    | "MONSTER_ORIGINALNAME";
}

export interface ErwarteterSichtinhalt {
  readonly kategorie: AnzeigeKategorie;
  readonly externeKennung: string;
}

export interface KatalogAbdeckung {
  readonly erwartet: number;
  readonly abgedeckt: number;
  readonly abdeckungProzent: number;
  readonly fehlend: readonly string[];
  readonly vollstaendig: boolean;
}

const TECHNISCHE_ROHKENNUNG = /^[a-z0-9_:-]+$/;

function text(wert: string | undefined): string {
  return String(wert ?? "").trim();
}

function schluessel(kategorie: AnzeigeKategorie, externeKennung: string): string {
  return kategorie + ":" + externeKennung;
}

function sichererPlatzhalter(kategorie: AnzeigeKategorie): AnzeigeAufloesung {
  switch (kategorie) {
    case "FAEHIGKEIT":
      return Object.freeze({
        text: "Unbekannte Fähigkeit",
        beschreibung: "Keine deutsche Beschreibung verfügbar.",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "KLASSE":
      return Object.freeze({
        text: "Unbekannte Klasse",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "GEGENSTAND":
      return Object.freeze({
        text: "Unbekannter Gegenstand",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "NICHTSPIELERFIGUR":
      return Object.freeze({
        text: "Unbekannte Spielfigur",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "EREIGNIS":
      return Object.freeze({
        text: "Unbekanntes Ereignis",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "AUFGABE":
      return Object.freeze({
        text: "Unbekannte Aufgabe",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "AKTION":
      return Object.freeze({
        text: "Unbekannte Aktion",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "STATUS":
      return Object.freeze({
        text: "Unbekannter Zustand",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
    case "MONSTER":
      return Object.freeze({
        text: "Unbekanntes Monster",
        vollstaendig: false,
        fallbackArt: "SICHERER_DEUTSCHER_PLATZHALTER",
      });
  }
}

function validiereEintrag(eintrag: AnzeigeKatalogEintrag, katalogVersion: number): void {
  const externeKennung = text(eintrag.externeKennung);
  const deutscherName = text(eintrag.deutscherAnzeigename);
  const beschreibung = text(eintrag.deutscheBeschreibung);
  const originalName = text(eintrag.originalName);

  if (eintrag.schemaVersion !== 1 || eintrag.katalogVersion !== katalogVersion) {
    throw new Error("ANZEIGEKATALOG_SCHEMA_ODER_VERSION_UNGUELTIG");
  }
  if (externeKennung.length === 0 || externeKennung.length > 200) {
    throw new Error("ANZEIGEKATALOG_EXTERNE_KENNUNG_UNGUELTIG");
  }
  if (text(eintrag.revalidiertAm).length === 0 || text(eintrag.quellenNachweis).length === 0) {
    throw new Error("ANZEIGEKATALOG_REVALIDIERUNG_ODER_QUELLE_FEHLT");
  }

  if (eintrag.kategorie === "MONSTER") {
    if (originalName.length === 0) throw new Error("MONSTER_ORIGINALNAME_FEHLT");
    if (eintrag.quellenStatus === "DEUTSCH_OFFIZIELL") {
      if (deutscherName.length === 0) {
        throw new Error("DEUTSCHE_MONSTERBEZEICHNUNG_FEHLT");
      }
      return;
    }
    if (eintrag.quellenStatus === "ORIGINALNAME_ERLAUBT") {
      if (deutscherName.length > 0) {
        throw new Error("MONSTER_EIGENE_UEBERSETZUNG_NICHT_ERLAUBT");
      }
      return;
    }
    throw new Error("MONSTER_QUELLENSTATUS_UNGUELTIG");
  }

  if (eintrag.quellenStatus !== "DEUTSCH_GEPRUEFT") {
    throw new Error("ANZEIGEKATALOG_DEUTSCHSTATUS_FEHLT");
  }
  if (deutscherName.length === 0) throw new Error("ANZEIGEKATALOG_DEUTSCHER_NAME_FEHLT");
  if (TECHNISCHE_ROHKENNUNG.test(deutscherName) && deutscherName === externeKennung) {
    throw new Error("ANZEIGEKATALOG_TECHNISCHE_ROHKENNUNG_IN_UI");
  }
  if (eintrag.kategorie === "FAEHIGKEIT" && beschreibung.length === 0) {
    throw new Error("ANZEIGEKATALOG_SKILL_BESCHREIBUNG_FEHLT");
  }
}

export class VersionierterAnzeigekatalog {
  readonly #version: number;
  readonly #eintraege: readonly AnzeigeKatalogEintrag[];

  public constructor(
    version: number,
    eintraege: readonly AnzeigeKatalogEintrag[],
    maximaleEintraege = 100_000,
  ) {
    if (!Number.isSafeInteger(version) || version < 1) {
      throw new Error("ANZEIGEKATALOG_VERSION_UNGUELTIG");
    }
    if (!Number.isInteger(maximaleEintraege) || maximaleEintraege < 1
        || eintraege.length > maximaleEintraege) {
      throw new Error("ANZEIGEKATALOG_GRENZE_UNGUELTIG");
    }

    for (const eintrag of eintraege) validiereEintrag(eintrag, version);
    const schluesselListe = eintraege
      .map(eintrag => schluessel(eintrag.kategorie, eintrag.externeKennung))
      .sort();
    for (let index = 1; index < schluesselListe.length; index += 1) {
      if (schluesselListe[index] === schluesselListe[index - 1]) {
        throw new Error("ANZEIGEKATALOG_DOPPELTER_EINTRAG");
      }
    }

    this.#version = version;
    this.#eintraege = Object.freeze(eintraege.map(eintrag => Object.freeze({ ...eintrag })));
  }

  public gibVersion(): number {
    return this.#version;
  }

  public loeseAuf(kategorie: AnzeigeKategorie, externeKennung: string): AnzeigeAufloesung {
    const eintrag = this.#eintraege.find(kandidat =>
      kandidat.kategorie === kategorie && kandidat.externeKennung === externeKennung);
    if (eintrag === undefined) return sichererPlatzhalter(kategorie);

    if (kategorie === "MONSTER") {
      if (eintrag.quellenStatus === "DEUTSCH_OFFIZIELL") {
        return Object.freeze({
          text: text(eintrag.deutscherAnzeigename),
          vollstaendig: true,
          fallbackArt: "KEINER",
        });
      }
      if (eintrag.quellenStatus === "ORIGINALNAME_ERLAUBT") {
        return Object.freeze({
          text: text(eintrag.originalName),
          vollstaendig: true,
          fallbackArt: "MONSTER_ORIGINALNAME",
        });
      }
      return sichererPlatzhalter(kategorie);
    }

    const beschreibung = text(eintrag.deutscheBeschreibung);
    return Object.freeze({
      text: text(eintrag.deutscherAnzeigename),
      ...(beschreibung.length === 0 ? {} : { beschreibung }),
      vollstaendig: true,
      fallbackArt: "KEINER",
    });
  }

  public pruefeAbdeckung(
    erwartet: readonly ErwarteterSichtinhalt[],
  ): KatalogAbdeckung {
    let fehlend: readonly string[] = Object.freeze([]);
    let abgedeckt = 0;

    for (const eintrag of erwartet) {
      const aufloesung = this.loeseAuf(eintrag.kategorie, eintrag.externeKennung);
      if (aufloesung.vollstaendig) {
        abgedeckt += 1;
      } else {
        fehlend = Object.freeze([
          ...fehlend,
          schluessel(eintrag.kategorie, eintrag.externeKennung),
        ]);
      }
    }

    const abdeckungProzent = erwartet.length === 0
      ? 100
      : (abgedeckt * 100) / erwartet.length;
    return Object.freeze({
      erwartet: erwartet.length,
      abgedeckt,
      abdeckungProzent,
      fehlend,
      vollstaendig: fehlend.length === 0,
    });
  }
}
