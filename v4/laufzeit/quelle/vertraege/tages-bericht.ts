export const BERICHTS_VERSAND_ARTEN = ['email', 'web_oberflaeche'] as const;
export type BerichtsVersandArt = (typeof BERICHTS_VERSAND_ARTEN)[number];

export interface TagesBerichtGesamtWerte {
  readonly laufzeitMillisekunden: number;
  readonly verbindungsAbbrueche: number;
  readonly automatischBehoben: number;
  readonly ungefangeneFehler: number;
  readonly neustarts: number;
}

export interface TagesBerichtCharakterWerte {
  readonly charakterName: string;
  readonly laufzeitMillisekunden: number;
  readonly erfahrungGewonnen: number;
  readonly goldGewonnen: number;
  readonly erfahrungProStunde: number;
  readonly goldProStunde: number;
  readonly tode: number;
  readonly rueckzuege: number;
}

export interface TagesBerichtVorfall {
  readonly meldungsCode: string;
  readonly anzahl: number;
  readonly betroffeneCharaktere: readonly string[];
  readonly kurzBeschreibung: string;
  readonly automatischBehoben: boolean;
  readonly nutzerMussHandeln: boolean;
}

export interface TagesBerichtEntwicklung {
  readonly neueVorfaelle: number;
  readonly bekannteVorfaelle: number;
  readonly unbekannteVorfaelle: number;
  readonly offlineReproduzierbar: number;
  readonly offeneEntwicklungsAufgaben: number;
  readonly hinweise: readonly string[];
}

export interface TagesBerichtVergleich {
  readonly kennzahl: string;
  readonly vorherigerWert: number;
  readonly aktuellerWert: number;
  readonly einheit: string;
  readonly aenderungProzent?: number;
}

export interface TagesBericht {
  readonly schemaVersion: number;
  readonly berichtKennung: string;
  readonly zeitraumStart: number;
  readonly zeitraumEnde: number;
  readonly erstelltAm: number;
  readonly zusammenfassung: readonly string[];
  readonly gesamt: TagesBerichtGesamtWerte;
  readonly charaktere: readonly TagesBerichtCharakterWerte[];
  readonly vorfaelle: readonly TagesBerichtVorfall[];
  readonly entwicklung: TagesBerichtEntwicklung;
  readonly vergleich: readonly TagesBerichtVergleich[];
  readonly nutzerMussHandeln: boolean;
  readonly nutzerAktion: string;
}

export interface TagesBerichtEinstellung {
  readonly aktiviert: boolean;
  readonly versandUhrzeit: string;
  readonly zeitzone: string;
  readonly versandArten: readonly BerichtsVersandArt[];
  readonly empfaengerEmail?: string;
}
