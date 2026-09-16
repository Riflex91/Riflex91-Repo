export const ANMELDE_ZUSTAENDE = ['nicht_angemeldet', 'angemeldet', 'sitzung_abgelaufen', 'gesperrt'] as const;
export type AnmeldeZustand = (typeof ANMELDE_ZUSTAENDE)[number];

export const ANMELDE_ARTEN = ['manuell', 'gespeicherte_sitzung'] as const;
export type AnmeldeArt = (typeof ANMELDE_ARTEN)[number];

export interface KontoProfil {
  readonly kontoKennung: string;
  readonly anzeigename: string;
  readonly emailAnzeige?: string;
  readonly anmeldeArt: AnmeldeArt;
  readonly anmeldeZustand: AnmeldeZustand;
  readonly verbundTeilnahmeErlaubt: boolean;
}

export interface CharakterZuordnung {
  readonly kontoKennung: string;
  readonly charakterName: string;
  readonly verbundKennung?: string;
}

export interface VerbundTeilnehmer {
  readonly kontoKennung: string;
  readonly charakterName: string;
  readonly spielwelt: string;
  readonly server: string;
  readonly faehigkeiten: readonly string[];
  readonly zuletztGesehenAm: number;
}
