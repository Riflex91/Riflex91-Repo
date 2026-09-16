export const KONTINGENT_ZEITRAEUME = ['sekunde', 'minute', 'stunde', 'tag', 'monat', 'dauerhaft'] as const;
export type KontingentZeitraum = (typeof KONTINGENT_ZEITRAEUME)[number];

export const KONTINGENT_EINHEITEN = [
  'anfragen',
  'zeilen_gelesen',
  'zeilen_geschrieben',
  'funktionsaufrufe',
  'nachrichten',
  'verbindungen',
  'operationen_a',
  'operationen_b',
  'bytes',
  'speicher_bytes'
] as const;
export type KontingentEinheit = (typeof KONTINGENT_EINHEITEN)[number];

export interface DienstGrenze {
  readonly kennung: string;
  readonly einheit: KontingentEinheit;
  readonly zeitraum: KontingentZeitraum;
  readonly anbieterMaximum: number;
  readonly sicherheitsPuffer: number;
}

export interface DienstProfil {
  readonly dienstKennung: string;
  readonly anzeigename: string;
  readonly tarifName: string;
  readonly quelle: string;
  readonly geprueftAm: number;
  readonly gueltigBis: number;
  readonly grenzen: readonly DienstGrenze[];
}

export interface VerbrauchsStand {
  readonly dienstKennung: string;
  readonly grenzeKennung: string;
  readonly fensterKennung: string;
  readonly lokalReserviert: number;
  readonly vomAnbieterGemeldet: number;
}

export interface VerbrauchsReservierung {
  readonly grenzeKennung: string;
  readonly maximalerVerbrauch: number;
}

export interface DienstAnfrage {
  readonly dienstKennung: string;
  readonly vorgangKennung: string;
  readonly angefordertAm: number;
  readonly reservierungen: readonly VerbrauchsReservierung[];
}

export const KONTINGENT_SCHUTZSTUFEN = ['normal', 'beobachten', 'sparen', 'blockiert'] as const;
export type KontingentSchutzstufe = (typeof KONTINGENT_SCHUTZSTUFEN)[number];

export interface KontingentEntscheidung {
  readonly erlaubt: boolean;
  readonly schutzstufe: KontingentSchutzstufe;
  readonly grund: string;
  readonly dienstKennung: string;
  readonly vorgangKennung: string;
  readonly verbleibendNachReservierung: Readonly<Record<string, number>>;
}
