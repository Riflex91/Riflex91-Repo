import type { GruppenFaehigkeitsProfil, GruppenTeilnehmerBewertung, GruppenTeilnehmerMeldung } from './gruppen-koordination.js';
import type { GruppenLebensnachweisEmpfang } from './gruppen-lebensnachweis.js';
import type { SkillCapabilityTag, SkillKatalog } from './skill-katalog.js';

export const CAPABILITY_SYNC_SCHEMA_VERSION = 1 as const;
export const CAPABILITY_SYNC_PROTOKOLL = 'v4-capability-sync-v1' as const;
export const CAPABILITY_SYNC_MAX_SKILLS = 64 as const;
export const CAPABILITY_SYNC_MAX_TAGS_PRO_SKILL = 16 as const;
export const CAPABILITY_SYNC_MAX_PARAMETER_PRO_SKILL = 8 as const;

export interface CapabilitySyncSkillSnapshot {
  readonly skillId: string;
  readonly capabilityTags: readonly SkillCapabilityTag[];
  readonly zielKapazitaet: number | null;
  readonly enabled: boolean;
  readonly configuredReady: boolean;
  readonly aktuellAutomatisierbar: boolean;
  readonly parameter: Readonly<Record<string, number>>;
}

export interface CapabilitySyncSnapshot {
  readonly schemaVersion: 1;
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly stufe: number;
  readonly generation: number;
  readonly fingerprint: string;
  readonly katalogZustand: 'bereit';
  readonly katalogGeneration: number;
  readonly katalogFingerprint: string;
  readonly lebensnachweisGesendetAm: number;
  readonly lebensnachweisLaufendeNummer: number;
  readonly skills: readonly CapabilitySyncSkillSnapshot[];
  readonly gruppenFaehigkeiten: GruppenFaehigkeitsProfil;
  readonly aktionsAutoritaet: false;
}

export interface CapabilitySyncUmschlag {
  readonly schemaVersion: 1;
  readonly protokoll: typeof CAPABILITY_SYNC_PROTOKOLL;
  readonly absenderName: string;
  readonly snapshot: CapabilitySyncSnapshot;
}

export interface CapabilitySyncEmpfang {
  readonly schemaVersion: 1;
  readonly absenderName: string;
  readonly empfangenAm: number;
  readonly snapshot: CapabilitySyncSnapshot;
}

export const CAPABILITY_SYNC_BAU_STATUS = ['bereit', 'blockiert'] as const;
export type CapabilitySyncBauStatus = (typeof CAPABILITY_SYNC_BAU_STATUS)[number];

export interface CapabilitySyncBauErgebnis {
  readonly schemaVersion: 1;
  readonly status: CapabilitySyncBauStatus;
  readonly gruende: readonly string[];
  readonly snapshot: CapabilitySyncSnapshot | null;
}

export const REMOTE_CAPABILITY_VERTRAUENS_STATUS = ['vertraut', 'blockiert'] as const;
export type RemoteCapabilityVertrauensStatus = (typeof REMOTE_CAPABILITY_VERTRAUENS_STATUS)[number];

export interface RemoteCapabilityVertrauensPruefung {
  readonly schemaVersion: 1;
  readonly status: RemoteCapabilityVertrauensStatus;
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly gruende: readonly string[];
  readonly snapshot: CapabilitySyncSnapshot | null;
  readonly lebensnachweisBewertung: GruppenTeilnehmerBewertung | null;
  readonly aktionsAutoritaet: false;
}

export interface CapabilitySyncSendeErgebnis {
  readonly schemaVersion: 1;
  readonly zielName: string;
  readonly gesendet: boolean;
  readonly grund: string;
}

export interface CapabilitySyncVertrauensEingabe {
  readonly empfang: CapabilitySyncEmpfang;
  readonly lebensnachweisEmpfang: GruppenLebensnachweisEmpfang | null;
  readonly lebensnachweisBewertung: GruppenTeilnehmerBewertung | null;
  readonly lokalerKatalog: SkillKatalog;
}

export interface CapabilitySyncBauEingabe {
  readonly lebensnachweis: GruppenTeilnehmerMeldung;
}
