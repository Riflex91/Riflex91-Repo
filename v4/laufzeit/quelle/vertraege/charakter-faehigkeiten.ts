import type { KampfAktionsBereitschaft } from './kampf-aktionsbereitschaft.js';
import type { GruppenFaehigkeitsProfil } from './gruppen-koordination.js';
import type { SkillCapabilityTag, SkillKatalogZustand } from './skill-katalog.js';

export const CHARAKTER_FAEHIGKEITEN_SCHEMA_VERSION = 1 as const;

export const TECHNISCHE_SKILL_ZUSTAENDE = [
  'bereit',
  'abklingzeit',
  'blockiert',
  'unbekannt'
] as const;
export type TechnischerSkillZustand = (typeof TECHNISCHE_SKILL_ZUSTAENDE)[number];

export interface TechnischeSkillAuswertung {
  readonly schemaVersion: 1;
  readonly skillId: string;
  readonly aufgenommenAm: number;
  readonly zustand: TechnischerSkillZustand;
  readonly ausruestungBereit: boolean | null;
  readonly materialBereit: boolean | null;
  readonly manaBereit: boolean | null;
  readonly aktionsBereitschaft: KampfAktionsBereitschaft;
  readonly gruende: readonly string[];
  readonly aktionsFreigabe: false;
}

export interface CharakterSkillFaehigkeit {
  readonly schemaVersion: 1;
  readonly skillId: string;
  readonly skillName: string | null;
  readonly capabilityTags: readonly SkillCapabilityTag[];
  readonly zielKapazitaet: number | null;
  readonly strukturellVorhanden: boolean;
  readonly automationValidated: boolean;
  readonly technischBereit: boolean;
  readonly vomNutzerFreigegeben: boolean;
  readonly automatisierungKonfiguriert: boolean;
  readonly aktuellAutomatisierbar: boolean;
  readonly parameter: Readonly<Record<string, number>>;
  readonly technischeAuswertung: TechnischeSkillAuswertung;
  readonly grund: string;
}

export interface CapabilityAuswertung {
  readonly capability: SkillCapabilityTag;
  readonly strukturellAnzahl: number;
  readonly validiertAnzahl: number;
  readonly technischBereitAnzahl: number;
  readonly nutzerFreigegebenAnzahl: number;
  readonly automatisierungKonfiguriertAnzahl: number;
  readonly aktuellAutomatisierbarAnzahl: number;
  readonly maximaleZielKapazitaetStrukturell: number | null;
  readonly maximaleZielKapazitaetAktuell: number | null;
}

export interface CharakterFaehigkeiten {
  readonly schemaVersion: 1;
  readonly aufgenommenAm: number;
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly stufe: number;
  readonly generation: number;
  readonly fingerprint: string;
  readonly katalogZustand: SkillKatalogZustand;
  readonly katalogGeneration: number;
  readonly katalogFingerprint: string | null;
  readonly katalogVertrauenswuerdig: boolean;
  readonly skills: readonly CharakterSkillFaehigkeit[];
  readonly capabilities: readonly CapabilityAuswertung[];
  readonly gruppenFaehigkeiten: GruppenFaehigkeitsProfil;
  readonly aktionsAutoritaet: false;
}
