export const FREIGABE_STUFEN = [
  'offline',
  'schatten',
  'kontrolliert_live',
  'soak'
] as const;

export type FreigabeStufe = (typeof FREIGABE_STUFEN)[number];

export const FREIGABE_NACHWEIS_ERGEBNISSE = [
  'bestanden',
  'fehlgeschlagen'
] as const;

export type FreigabeNachweisErgebnis = (typeof FREIGABE_NACHWEIS_ERGEBNISSE)[number];

export const FREIGABE_STUFEN_ZUSTAENDE = [
  'offen',
  'bestanden',
  'fehlgeschlagen',
  'blockiert'
] as const;

export type FreigabeStufenZustand = (typeof FREIGABE_STUFEN_ZUSTAENDE)[number];

export interface FreigabeNachweis {
  readonly schemaVersion: 1;
  readonly laufzeitPfadKennung: string;
  readonly aenderungsKennung: string;
  readonly stufe: FreigabeStufe;
  readonly nachweisKennung: string;
  readonly ergebnis: FreigabeNachweisErgebnis;
  readonly durchgefuehrtAm: number;
  readonly deterministisch: boolean;
  readonly spielAktionAusgefuehrt: boolean;
  readonly begrenzt: boolean;
  readonly telemetrieNachweis: boolean;
  readonly recoveryNachweis: boolean;
  readonly gesamtauswertungBestanden: boolean;
}

export interface FreigabeAuswertungsEingabe {
  readonly schemaVersion: 1;
  readonly laufzeitPfadKennung: string;
  readonly aenderungsKennung: string;
  readonly nachweise: readonly FreigabeNachweis[];
}

export interface FreigabeStufenEintrag {
  readonly stufe: FreigabeStufe;
  readonly zustand: FreigabeStufenZustand;
  readonly grund: string;
  readonly nachweisKennung: string | null;
  readonly durchgefuehrtAm: number | null;
}

export interface FreigabeAuswertung {
  readonly schemaVersion: 1;
  readonly laufzeitPfadKennung: string;
  readonly aenderungsKennung: string;
  readonly stufen: readonly FreigabeStufenEintrag[];
  readonly naechsteStufe: FreigabeStufe | null;
  readonly freigabeVollstaendig: boolean;
  readonly block9Freigegeben: boolean;
  readonly spielAutoritaet: false;
  readonly neustartAutoritaet: false;
  readonly grund: string;
}
