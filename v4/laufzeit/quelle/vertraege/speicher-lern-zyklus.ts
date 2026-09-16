export const SPEICHER_LERN_PHASES = [
  'sammeln',
  'vorbereiten',
  'lernen',
  'pruefen',
  'bereinigen',
  'notfall'
] as const;
export type SpeicherLernPhase = (typeof SPEICHER_LERN_PHASES)[number];

export interface SpeicherLernSchwellen {
  readonly zielNachBereinigung: number;
  readonly vorbereitenAb: number;
  readonly lernenAb: number;
  readonly bereinigenAb: number;
  readonly notfallAb: number;
}

export interface LernNachweis {
  readonly datensatzErstellt: boolean;
  readonly lernenErfolgreich: boolean;
  readonly pruefungBestanden: boolean;
  readonly wissenDauerhaftGespeichert: boolean;
}

export interface SpeicherLernEingabe {
  readonly belegtBytes: number;
  readonly sicherNutzbarBytes: number;
  readonly verarbeiteteLoeschbareBytes: number;
  readonly geschuetzteBytes: number;
  readonly nachweis: LernNachweis;
}

export interface SpeicherLernEntscheidung {
  readonly phase: SpeicherLernPhase;
  readonly auslastung: number;
  readonly datenerfassungReduzieren: boolean;
  readonly datensatzErstellen: boolean;
  readonly lernenStarten: boolean;
  readonly pruefungStarten: boolean;
  readonly bereinigungErlaubt: boolean;
  readonly loeschbarBisBytes: number;
  readonly zielBelegtBytes: number;
  readonly grund: string;
}
