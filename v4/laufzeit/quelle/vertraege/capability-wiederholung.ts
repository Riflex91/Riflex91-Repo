import type { CapabilityGruppenwahlEntscheidung } from './capability-gruppenwahl.js';
import type { CapabilityStatusSicht } from './capability-status.js';
import type { CapabilitySyncSnapshot, RemoteCapabilityVertrauensPruefung } from './capability-sync.js';
import type { CharakterFaehigkeiten } from './charakter-faehigkeiten.js';
import type { GruppenTeilnehmerMeldung } from './gruppen-koordination.js';
import type { KampfGefahrenStufe } from './kampfsicherheit.js';
import type { SkillKatalogAuditStatus } from './skill-katalog-audit.js';

export const CAPABILITY_WIEDERHOLUNG_SCHEMA_VERSION = 1 as const;
export const CAPABILITY_WIEDERHOLUNG_MAX_SCHRITTE = 256 as const;
export const CAPABILITY_WIEDERHOLUNG_MAX_CHARAKTERE = 16 as const;

export const CAPABILITY_WIEDERHOLUNG_REMOTE_QUELLEN = ['aktuell', 'vorheriger', 'fehlend'] as const;
export type CapabilityWiederholungRemoteQuelle = (typeof CAPABILITY_WIEDERHOLUNG_REMOTE_QUELLEN)[number];

export type CapabilityWiederholungPolicyAenderung =
  | Readonly<{
      art: 'skill_freigabe';
      skillId: string;
      freigegeben: boolean;
    }>
  | Readonly<{
      art: 'control';
      skillId: string;
      controlKennung: string;
      wert: number;
    }>
  | Readonly<{
      art: 'zuruecksetzen';
      skillId: string;
    }>;

export interface CapabilityWiederholungCharakterEingabe {
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly stufe: number;
  readonly leben: number;
  readonly lebenMaximal: number;
  readonly mana: number;
  readonly manaMaximal: number;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly karte: string;
  readonly instanz: string;
  readonly zielKennung: string | null;
  readonly gefahrenStufe: KampfGefahrenStufe;
  readonly lebendig: boolean;
  readonly skills: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly gameItems: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly slots: Readonly<Record<string, Readonly<{ name: string }> | null>>;
  readonly inventar: readonly Readonly<{ name: string }>[];
  readonly cooldownSkills: readonly string[];
  readonly canUse: Readonly<Record<string, boolean>>;
  readonly connectionGap: boolean;
  readonly revalidiere: boolean;
  readonly policyAenderungen: readonly CapabilityWiederholungPolicyAenderung[];
  readonly lebensnachweisLaufendeNummer: number;
  readonly remoteSnapshotQuelle: CapabilityWiederholungRemoteQuelle;
  readonly gruppenKoordinationErlaubt: boolean;
}

export interface CapabilityWiederholungSchritt {
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly eigenerTeilnehmerKennung: string;
  readonly charaktere: readonly CapabilityWiederholungCharakterEingabe[];
}

export interface CapabilityWiederholungsDatensatz {
  readonly schemaVersion: 1;
  readonly kennung: string;
  readonly erstelltAm: number;
  readonly schritte: readonly CapabilityWiederholungSchritt[];
}

export interface CapabilityWiederholungCharakterErgebnis {
  readonly charakterKennung: string;
  readonly audit: SkillKatalogAuditStatus;
  readonly faehigkeiten: CharakterFaehigkeiten;
  readonly lebensnachweis: GruppenTeilnehmerMeldung;
  readonly aktuellerSnapshot: CapabilitySyncSnapshot | null;
  readonly vorherigerSnapshot: CapabilitySyncSnapshot | null;
}

export interface CapabilityWiederholungSchrittErgebnis {
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly eigenerTeilnehmerKennung: string;
  readonly charaktere: readonly CapabilityWiederholungCharakterErgebnis[];
  readonly remoteVertrauen: readonly RemoteCapabilityVertrauensPruefung[];
  readonly gruppenwahl: CapabilityGruppenwahlEntscheidung | null;
  readonly status: CapabilityStatusSicht;
  readonly schrittFingerabdruck: string;
  readonly aktionsAutoritaet: false;
}

export interface CapabilityWiederholungsLauf {
  readonly schemaVersion: 1;
  readonly datensatzKennung: string;
  readonly varianteKennung: string;
  readonly eingabeFingerabdruck: string;
  readonly ausgabeFingerabdruck: string;
  readonly schritte: readonly CapabilityWiederholungSchrittErgebnis[];
  readonly aktionsAutoritaet: false;
}
