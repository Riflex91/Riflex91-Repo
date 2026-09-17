import type { KampfGefahrenStufe, KampfSicherheitsEntscheidung } from './kampfsicherheit.js';
import type { GruppenFaehigkeitsProfil, GruppenTeilnehmerMeldung } from './gruppen-koordination.js';

export const GRUPPEN_LEBENSNACHWEIS_PROTOKOLL = 'v4-gruppen-lebensnachweis-v1' as const;

export const GRUPPEN_TEILNEHMER_MELDUNGS_STATUS = ['bereit', 'blockiert'] as const;
export type GruppenTeilnehmerMeldungsStatus = (typeof GRUPPEN_TEILNEHMER_MELDUNGS_STATUS)[number];

export interface GruppenTeilnehmerMeldungsEingabe {
  readonly gefahrenStufe: KampfGefahrenStufe;
  readonly faehigkeiten: GruppenFaehigkeitsProfil;
}

export interface GruppenTeilnehmerMeldungsSicherheitsEingabe {
  readonly sicherheitsEntscheidung: KampfSicherheitsEntscheidung;
  readonly faehigkeiten: GruppenFaehigkeitsProfil;
}

export interface GruppenTeilnehmerMeldungsErgebnis {
  readonly schemaVersion: 1;
  readonly status: GruppenTeilnehmerMeldungsStatus;
  readonly gruende: readonly string[];
  readonly meldung: GruppenTeilnehmerMeldung | null;
}

export interface GruppenLebensnachweisUmschlag {
  readonly schemaVersion: 1;
  readonly protokoll: typeof GRUPPEN_LEBENSNACHWEIS_PROTOKOLL;
  readonly absenderName: string;
  readonly meldung: GruppenTeilnehmerMeldung;
}

export interface GruppenLebensnachweisEmpfang {
  readonly schemaVersion: 1;
  readonly absenderName: string;
  readonly empfangenAm: number;
  readonly meldung: GruppenTeilnehmerMeldung;
}

export interface GruppenLebensnachweisSendeErgebnis {
  readonly schemaVersion: 1;
  readonly zielName: string;
  readonly gesendet: boolean;
  readonly grund: string;
}
