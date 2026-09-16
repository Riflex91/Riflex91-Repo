export const WISSENS_QUELLEN = ['beobachtet', 'abgeleitet', 'gelernt'] as const;
export type WissensQuelle = (typeof WISSENS_QUELLEN)[number];

export interface BekannterWert<TWert = unknown> {
  readonly quelle: WissensQuelle;
  readonly sicherheit: number;
  readonly bekanntSeit: number;
  readonly wert: TWert;
}

export interface Spielzustand {
  readonly schemaVersion: number;
  readonly laufendeNummer: number;
  readonly aufgenommenAm: number;
  readonly ablaufKennung: string;
  readonly charakter: Readonly<Record<string, unknown>>;
  readonly objekte: readonly Readonly<Record<string, unknown>>[];
  readonly gruppe: readonly Readonly<Record<string, unknown>>[];
  readonly inventar: readonly Readonly<Record<string, unknown>>[];
}
