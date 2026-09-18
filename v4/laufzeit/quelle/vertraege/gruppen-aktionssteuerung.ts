import type { AktionsLaufZustand, AktionsSteuerungsSchritt, SchattenAktionsEintrag } from './aktions-steuerung.js';
import type { GruppenAktionsName } from './gruppen-aktionsanfrage.js';

export const GRUPPEN_AKTIONS_STEUERUNG_STATUS = [
  'gesperrt',
  'blockiert',
  'leer',
  'eingereiht',
  'verarbeitet'
] as const;

export type GruppenAktionsSteuerungStatus = (typeof GRUPPEN_AKTIONS_STEUERUNG_STATUS)[number];

export interface GruppenAktionsSteuerungKonfiguration {
  readonly aktiviert: boolean;
  readonly freigegebeneAktionen: readonly GruppenAktionsName[];
  readonly verarbeiten: boolean;
}

export interface GruppenAktionsSteuerungErgebnis {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly status: GruppenAktionsSteuerungStatus;
  readonly grund: string;
  readonly eingereichteAnfrageKennungen: readonly string[];
  readonly nichtFreigegebeneAnfrageKennungen: readonly string[];
  readonly abgelaufeneAnfrageKennungen: readonly string[];
  readonly laufZustaende: readonly AktionsLaufZustand[];
  readonly verarbeitung: AktionsSteuerungsSchritt | null;
  readonly schattenEintraege: readonly SchattenAktionsEintrag[];
}
