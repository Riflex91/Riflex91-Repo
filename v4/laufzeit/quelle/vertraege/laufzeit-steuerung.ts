import type { AktionsAnfrage, AktionsWichtigkeit } from './aktions-anfrage.js';
import type { BedienAnfrage, BedienEntscheidung } from './bedien-anfrage.js';

export const LAUFZEIT_BETRIEBS_ZUSTAENDE = ['laeuft', 'pausiert'] as const;
export type LaufzeitBetriebsZustand = (typeof LAUFZEIT_BETRIEBS_ZUSTAENDE)[number];

export interface LaufzeitSteuerungsStatus {
  readonly schemaVersion: 1;
  readonly zustand: LaufzeitBetriebsZustand;
  readonly generation: number;
  readonly letzteAenderungAm: number | null;
  readonly grund: string;
  readonly automatischeFortsetzung: false;
}

export interface LaufzeitAktionsFreigabe {
  readonly erlaubt: boolean;
  readonly grund: string;
}

export const BASIS_BEDIEN_AKTIONEN = [
  'diagnose_aktualisieren',
  'laufzeit_pausieren',
  'laufzeit_fortsetzen'
] as const;
export type BasisBedienAktion = (typeof BASIS_BEDIEN_AKTIONEN)[number];

export const BASIS_BEDIEN_ERGEBNIS_STATUS = [
  'ausgefuehrt',
  'blockiert',
  'wiederholt'
] as const;
export type BasisBedienErgebnisStatus =
  (typeof BASIS_BEDIEN_ERGEBNIS_STATUS)[number];

export interface BasisBedienAnfrageDaten {
  readonly vorgangsKennung: string;
  readonly aktion: BasisBedienAktion;
  readonly angefordertAm: number;
  readonly laufzeitStatus: LaufzeitSteuerungsStatus;
  readonly ausdruecklichBestaetigt?: boolean;
}

export interface BasisBedienErgebnis<TDiagnose = unknown> {
  readonly schemaVersion: 1;
  readonly vorgangsKennung: string;
  readonly aktion: BasisBedienAktion;
  readonly status: BasisBedienErgebnisStatus;
  readonly grund: string;
  readonly bedienEntscheidung: BedienEntscheidung;
  readonly laufzeitStatus: LaufzeitSteuerungsStatus;
  readonly abgebrocheneAktionsAnfrageKennungen: readonly string[];
  readonly diagnose: TDiagnose | null;
}

export interface LaufzeitAktionsTor {
  status(): LaufzeitSteuerungsStatus;
  pruefeAktionsAnfrage(anfrage: Pick<AktionsAnfrage, 'wichtigkeit'>): LaufzeitAktionsFreigabe;
}

export interface BasisBedienAnfrageErzeuger {
  erstelle(daten: BasisBedienAnfrageDaten): Readonly<BedienAnfrage>;
}

export function istPauseGeschuetzteWichtigkeit(wichtigkeit: AktionsWichtigkeit): boolean {
  return wichtigkeit === 'notfall' || wichtigkeit === 'sicherheit';
}
