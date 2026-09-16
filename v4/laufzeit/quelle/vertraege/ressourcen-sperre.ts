export const RESSOURCEN_NAMEN = [
  'bewegung',
  'inventar',
  'bank',
  'handel',
  'kampfziel',
  'gruppe',
  'ausruestung'
] as const;

export type RessourcenName = (typeof RESSOURCEN_NAMEN)[number];

export interface RessourcenSperre {
  readonly ressource: RessourcenName;
  readonly besitzer: string;
  readonly prioritaet: number;
  readonly darfUnterbrochenWerden: boolean;
  readonly gesperrtSeit: number;
}

export interface RessourcenSperrAnfrage {
  readonly besitzer: string;
  readonly ressourcen: readonly RessourcenName[];
  readonly prioritaet: number;
  readonly darfUnterbrochenWerden: boolean;
  readonly angefordertAm: number;
}
