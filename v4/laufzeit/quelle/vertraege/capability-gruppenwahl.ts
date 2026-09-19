import type { CapabilitySyncSnapshot, RemoteCapabilityVertrauensPruefung } from './capability-sync.js';
import type {
  GruppenAufgabenZuordnung,
  GruppenFaehigkeit,
  GruppenKoordinationsEntscheidung,
  GruppenTeilnehmerMeldung
} from './gruppen-koordination.js';

export const CAPABILITY_GRUPPENWAHL_SCHEMA_VERSION = 1 as const;

export interface CapabilityKoordinationsAutoritaet {
  readonly charakterKennung: string;
  readonly gruppenKoordinationErlaubt: boolean;
  readonly grund: string;
}

export interface CapabilityGruppenwahlEingabe {
  readonly basisEntscheidung: GruppenKoordinationsEntscheidung;
  readonly lebensnachweise: readonly GruppenTeilnehmerMeldung[];
  readonly lokalerSnapshot: CapabilitySyncSnapshot;
  readonly remoteVertrauen: readonly RemoteCapabilityVertrauensPruefung[];
  readonly autoritaeten: readonly CapabilityKoordinationsAutoritaet[];
}

export interface CapabilityAufgabenBewertung {
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly faehigkeit: GruppenFaehigkeit;
  readonly relevanteSkills: readonly string[];
  readonly relevanteSkillAnzahl: number;
  readonly maximaleZielKapazitaet: number | null;
  readonly lebensAnteil: number | null;
  readonly lebensnachweisAlterMillisekunden: number;
  readonly grund: string;
}

export interface CapabilityAufgabenEntscheidung {
  readonly faehigkeit: GruppenFaehigkeit;
  readonly charakterKennung: string | null;
  readonly charakterName: string | null;
  readonly grund: string;
  readonly kandidaten: readonly CapabilityAufgabenBewertung[];
}

export interface CapabilityLeaderBewertung {
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly aufgabenAbdeckung: number;
  readonly aktuellAutomatisierbareSkills: number;
  readonly maximaleZielKapazitaet: number | null;
  readonly lebensAnteil: number | null;
  readonly lebensnachweisAlterMillisekunden: number;
  readonly grund: string;
}

export interface CapabilityGruppenwahlEntscheidung {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly eigenerTeilnehmerKennung: string;
  readonly betriebsArt: GruppenKoordinationsEntscheidung['betriebsArt'];
  readonly grund: string;
  readonly leaderKennung: string | null;
  readonly leaderName: string | null;
  readonly leaderGrund: string;
  readonly leaderKandidaten: readonly CapabilityLeaderBewertung[];
  readonly aufgaben: Readonly<Record<GruppenFaehigkeit, CapabilityAufgabenEntscheidung>>;
  readonly aufgabenZuordnung: GruppenAufgabenZuordnung;
  readonly vertrauteTeilnehmerKennungen: readonly string[];
  readonly ausgeschlosseneTeilnehmer: readonly Readonly<{
    charakterKennung: string;
    grund: string;
  }>[];
  readonly aktionsAutoritaet: false;
}

export interface CapabilityGruppenwahlSnapshotQuelle {
  readonly charakterKennung: string;
  readonly snapshot: CapabilitySyncSnapshot;
  readonly quelle: 'lokal' | 'remote_vertraut';
}
