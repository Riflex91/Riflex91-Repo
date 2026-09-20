import {
  VersionierterAnzeigekatalog,
  type AnzeigeKategorie,
} from "./anzeigekatalog.js";

export interface EntdeckterSichtinhalt {
  readonly kategorie: AnzeigeKategorie;
  readonly externeKennung: string;
  readonly quellenNachweis: string;
}

export interface UebersetzungsAufgabe {
  readonly schemaVersion: 1;
  readonly aufgabeKennung: string;
  readonly status: "OFFEN";
  readonly kategorie: AnzeigeKategorie;
  readonly externeKennung: string;
  readonly quellenNachweis: string;
  readonly deutscherPlatzhalter: string;
  readonly gameplayAutoritaet: false;
  readonly automatischeFreigabe: false;
}

function normalisiere(wert: string): string {
  return String(wert ?? "").trim();
}

function aufgabeKennung(
  kategorie: AnzeigeKategorie,
  externeKennung: string,
): string {
  return "uebersetzung:" + kategorie.toLowerCase() + ":" + externeKennung;
}

export function planeOffeneUebersetzungsAufgaben(
  katalog: VersionierterAnzeigekatalog,
  entdeckteInhalte: readonly EntdeckterSichtinhalt[],
  maximaleAufgaben = 10_000,
): readonly UebersetzungsAufgabe[] {
  if (!Number.isInteger(maximaleAufgaben) || maximaleAufgaben < 1) {
    throw new Error("UEBERSETZUNGSAUFGABEN_GRENZE_UNGUELTIG");
  }

  const aufgaben = new Map<string, UebersetzungsAufgabe>();

  for (const inhalt of entdeckteInhalte) {
    const externeKennung = normalisiere(inhalt.externeKennung);
    const quellenNachweis = normalisiere(inhalt.quellenNachweis);
    if (externeKennung.length === 0 || externeKennung.length > 200) {
      throw new Error("UEBERSETZUNGSAUFGABE_EXTERNE_KENNUNG_UNGUELTIG");
    }
    if (quellenNachweis.length === 0 || quellenNachweis.length > 1_000) {
      throw new Error("UEBERSETZUNGSAUFGABE_QUELLENNACHWEIS_UNGUELTIG");
    }

    const aufloesung = katalog.loeseAuf(inhalt.kategorie, externeKennung);
    if (aufloesung.vollstaendig) continue;
    if (aufloesung.fallbackArt !== "SICHERER_DEUTSCHER_PLATZHALTER") {
      throw new Error("UEBERSETZUNGSAUFGABE_UNSICHERER_FALLBACK");
    }

    const kennung = aufgabeKennung(inhalt.kategorie, externeKennung);
    if (!aufgaben.has(kennung)) {
      aufgaben.set(kennung, Object.freeze({
        schemaVersion: 1,
        aufgabeKennung: kennung,
        status: "OFFEN",
        kategorie: inhalt.kategorie,
        externeKennung,
        quellenNachweis,
        deutscherPlatzhalter: aufloesung.text,
        gameplayAutoritaet: false,
        automatischeFreigabe: false,
      }));
    }

    if (aufgaben.size > maximaleAufgaben) {
      throw new Error("UEBERSETZUNGSAUFGABEN_GRENZE_UEBERSCHRITTEN");
    }
  }

  return Object.freeze(
    [...aufgaben.values()]
      .sort((a, b) => a.aufgabeKennung.localeCompare(b.aufgabeKennung)),
  );
}
