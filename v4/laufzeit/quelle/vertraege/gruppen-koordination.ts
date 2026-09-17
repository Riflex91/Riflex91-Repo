import type { KampfGefahrenStufe } from './kampfsicherheit.js';

export const GRUPPEN_FAEHIGKEITEN = ['heilen', 'schaden', 'aggro', 'schutz', 'unterstuetzung'] as const;
export type GruppenFaehigkeit = (typeof GRUPPEN_FAEHIGKEITEN)[number];

export const GRUPPEN_TEILNEHMER_STATUS = [
  'aktiv',
  'veraltet',
  'ausgefallen',
  'falsche_welt',
  'falsche_instanz'
] as const;
export type GruppenTeilnehmerStatus = (typeof GRUPPEN_TEILNEHMER_STATUS)[number];

export const GRUPPEN_BETRIEBS_ARTEN = ['normal', 'sicherheit', 'blockiert'] as const;
export type GruppenBetriebsArt = (typeof GRUPPEN_BETRIEBS_ARTEN)[number];

export type GruppenFaehigkeitsProfil = Readonly<Record<GruppenFaehigkeit, number>>;

export interface GruppenTeilnehmerMeldung {
  readonly schemaVersion: 1;
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly karte: string;
  readonly instanz: string;
  readonly lebendig: boolean | null;
  readonly lebensAnteil: number | null;
  readonly manaAnteil: number | null;
  readonly zielKennung: string | null;
  readonly gefahrenStufe: KampfGefahrenStufe;
  readonly faehigkeiten: GruppenFaehigkeitsProfil;
  readonly gesendetAm: number;
  readonly laufendeNummer: number;
}

export interface GruppenKoordinationsKonfiguration {
  readonly lebensnachweisMaximalAlterMillisekunden: number;
}

export interface GruppenTeilnehmerBewertung {
  readonly charakterKennung: string;
  readonly status: GruppenTeilnehmerStatus;
  readonly grund: string;
  readonly alterMillisekunden: number;
}

export type GruppenAufgabenZuordnung = Readonly<Record<GruppenFaehigkeit, string | null>>;

export interface GruppenKoordinationsEntscheidung {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly eigenerTeilnehmerKennung: string;
  readonly betriebsArt: GruppenBetriebsArt;
  readonly grund: string;
  readonly gemeinsameGefahrenStufe: KampfGefahrenStufe;
  readonly gemeinsamesZielKennung: string | null;
  readonly aktiveTeilnehmerKennungen: readonly string[];
  readonly teilnehmerBewertungen: readonly GruppenTeilnehmerBewertung[];
  readonly aufgaben: GruppenAufgabenZuordnung;
}
