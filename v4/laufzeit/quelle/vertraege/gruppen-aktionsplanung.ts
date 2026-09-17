import type { AktionsWichtigkeit } from './aktions-anfrage.js';
import type { GruppenBetriebsArt, GruppenFaehigkeit } from './gruppen-koordination.js';
import type { KampfGefahrenStufe } from './kampfsicherheit.js';
import type { RessourcenName } from './ressourcen-sperre.js';

export const GRUPPEN_PLAN_AKTIONS_ARTEN = [
  'mitglied_heilen',
  'ziel_aggro_binden',
  'mitglied_schuetzen',
  'gruppe_unterstuetzen',
  'gemeinsames_ziel_bearbeiten'
] as const;
export type GruppenPlanAktionsArt = (typeof GRUPPEN_PLAN_AKTIONS_ARTEN)[number];

export const GRUPPEN_PLAN_ZIEL_ARTEN = ['charakter', 'gegner', 'gruppe'] as const;
export type GruppenPlanZielArt = (typeof GRUPPEN_PLAN_ZIEL_ARTEN)[number];

export const GRUPPEN_AKTIONS_PLAN_STATUS = ['geplant', 'leer', 'blockiert'] as const;
export type GruppenAktionsPlanStatus = (typeof GRUPPEN_AKTIONS_PLAN_STATUS)[number];

export interface GruppenAktionsPlanKonfiguration {
  readonly heilenUnterLebensAnteil: number;
  readonly schuetzenUnterLebensAnteil: number;
}

export interface GruppenPlanSchritt {
  readonly kennung: string;
  readonly art: GruppenPlanAktionsArt;
  readonly faehigkeit: GruppenFaehigkeit;
  readonly ausfuehrenderTeilnehmerKennung: string;
  readonly zielArt: GruppenPlanZielArt;
  readonly zielKennung: string | null;
  readonly wichtigkeit: AktionsWichtigkeit;
  readonly prioritaet: number;
  readonly benoetigteRessourcen: readonly RessourcenName[];
  readonly grund: string;
}

export interface GruppenAktionsPlan {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly status: GruppenAktionsPlanStatus;
  readonly grund: string;
  readonly betriebsArt: GruppenBetriebsArt;
  readonly gemeinsameGefahrenStufe: KampfGefahrenStufe;
  readonly gemeinsamesZielKennung: string | null;
  readonly schritte: readonly GruppenPlanSchritt[];
}
