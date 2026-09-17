import type { AktionsAnfrage } from './aktions-anfrage.js';
import type {
  GruppenAktionsPlanStatus,
  GruppenPlanAktionsArt,
  GruppenPlanSchritt,
  GruppenPlanZielArt
} from './gruppen-aktionsplanung.js';
import type { GruppenFaehigkeit } from './gruppen-koordination.js';

export const GRUPPEN_AKTIONS_NAMEN = Object.freeze({
  mitgliedHeilen: 'GRUPPE_MITGLIED_HEILEN',
  zielAggroBinden: 'GRUPPE_ZIEL_AGGRO_BINDEN',
  mitgliedSchuetzen: 'GRUPPE_MITGLIED_SCHUETZEN',
  gruppeUnterstuetzen: 'GRUPPE_UNTERSTUETZEN',
  gemeinsamesZielBearbeiten: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN'
} as const);

export type GruppenAktionsName = (typeof GRUPPEN_AKTIONS_NAMEN)[keyof typeof GRUPPEN_AKTIONS_NAMEN];

export const GRUPPEN_AKTIONS_ANFRAGE_STATUS = ['gesperrt', 'blockiert', 'leer', 'erzeugt'] as const;
export type GruppenAktionsAnfrageStatus = (typeof GRUPPEN_AKTIONS_ANFRAGE_STATUS)[number];

export interface GruppenAktionsAnfrageKonfiguration {
  readonly aktiviert: boolean;
  readonly freigegebeneArten: readonly GruppenPlanAktionsArt[];
  readonly gueltigkeitMillisekunden: number;
}

export interface GruppenAktionsAnfrageDetails {
  readonly planZeitpunkt: number;
  readonly planStatus: GruppenAktionsPlanStatus;
  readonly planSchrittKennung: string;
  readonly art: GruppenPlanAktionsArt;
  readonly faehigkeit: GruppenFaehigkeit;
  readonly ausfuehrenderTeilnehmerKennung: string;
  readonly zielArt: GruppenPlanZielArt;
  readonly zielKennung: string | null;
}

export interface GruppenAktionsAnfrageUebersetzung {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly status: GruppenAktionsAnfrageStatus;
  readonly grund: string;
  readonly eigenerTeilnehmerKennung: string;
  readonly planStatus: GruppenAktionsPlanStatus;
  readonly eigeneSchrittKennungen: readonly string[];
  readonly nichtFreigegebeneSchrittKennungen: readonly string[];
  readonly aktionsAnfragen: readonly AktionsAnfrage<GruppenAktionsAnfrageDetails>[];
}

export type GruppenAktionsAnfrageQuelle = Pick<
  GruppenPlanSchritt,
  | 'kennung'
  | 'art'
  | 'faehigkeit'
  | 'ausfuehrenderTeilnehmerKennung'
  | 'zielArt'
  | 'zielKennung'
  | 'wichtigkeit'
  | 'prioritaet'
  | 'benoetigteRessourcen'
  | 'grund'
>;
