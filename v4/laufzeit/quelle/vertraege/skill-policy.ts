import type { SkillKatalog, SkillKatalogEintrag } from './skill-katalog.js';

export const SKILL_POLICY_SCHEMA_VERSION = 1 as const;
export const SKILL_POLICY_SPEICHER_SCHLUESSEL = 'aio-v4-skill-policy-v1' as const;

export const SKILL_POLICY_CONTROL_ARTEN = ['prozent', 'ganzzahl'] as const;
export type SkillPolicyControlArt = (typeof SKILL_POLICY_CONTROL_ARTEN)[number];

export const SKILL_POLICY_CONTROL_KENNUNGEN = [
  'lebensSchwelleProzent',
  'mindestensVerletzteMitglieder',
  'mindestensZiele',
  'maximalGewuenschteZiele',
  'manaBudgetProzent',
  'empfaengerManaSchwelleProzent'
] as const;
export type SkillPolicyControlKennung = (typeof SKILL_POLICY_CONTROL_KENNUNGEN)[number];

export interface SkillPolicyControlDefinition {
  readonly kennung: SkillPolicyControlKennung;
  readonly art: SkillPolicyControlArt;
  readonly bezeichnung: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly schritt: number;
  readonly standardWert: number;
  readonly maximumQuelle: 'zielKapazitaet' | null;
}

export interface SkillPolicyControlWert {
  readonly definition: SkillPolicyControlDefinition;
  readonly wert: number;
}

export interface SkillPolicyCharakterKontext {
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly stufe: number;
}

export interface SkillPolicyPersistierteSkillEinstellung {
  readonly freigegeben: boolean;
  readonly parameter: Readonly<Record<string, number>>;
  readonly geaendertAm: number;
  readonly katalogFingerprintBeiAenderung: string | null;
}

export interface SkillPolicyCharakterProfil {
  readonly schemaVersion: 1;
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly geaendertAm: number;
  readonly skills: Readonly<Record<string, SkillPolicyPersistierteSkillEinstellung>>;
}

export interface SkillPolicyDauerzustand {
  readonly schemaVersion: 1;
  readonly gespeichertAm: number;
  readonly profile: readonly SkillPolicyCharakterProfil[];
}

export interface SkillPolicySkillAnsicht {
  readonly skillId: string;
  readonly skillName: string | null;
  readonly katalogEintrag: SkillKatalogEintrag;
  readonly freigegeben: boolean;
  readonly konfiguriert: boolean;
  readonly controls: readonly SkillPolicyControlWert[];
  readonly unbekanntePersistierteControls: readonly string[];
  readonly ungueltigePersistierteControls: readonly string[];
  readonly hartGesperrt: boolean;
  readonly grund: string;
}

export const SKILL_POLICY_AENDERUNGS_STATUS = ['gespeichert', 'blockiert'] as const;
export type SkillPolicyAenderungsStatus = (typeof SKILL_POLICY_AENDERUNGS_STATUS)[number];

export interface SkillPolicyAenderungsErgebnis {
  readonly schemaVersion: 1;
  readonly status: SkillPolicyAenderungsStatus;
  readonly grund: string;
  readonly charakterKennung: string;
  readonly skillId: string;
  readonly ansicht: SkillPolicySkillAnsicht | null;
}

export const SKILL_POLICY_ENTSCHEIDUNGS_GRUENDE = [
  'erlaubt',
  'katalog_nicht_bereit',
  'skill_unbekannt',
  'automation_nicht_validiert',
  'klasse_passt_nicht',
  'level_zu_niedrig',
  'skill_policy_aus',
  'unbekannte_persistierte_controls',
  'ungueltige_persistierte_controls'
] as const;
export type SkillPolicyEntscheidungsGrund = (typeof SKILL_POLICY_ENTSCHEIDUNGS_GRUENDE)[number];

export interface SkillPolicyEntscheidung {
  readonly schemaVersion: 1;
  readonly erlaubt: boolean;
  readonly grund: SkillPolicyEntscheidungsGrund;
  readonly charakterKennung: string;
  readonly skillId: string;
  readonly katalogGeneration: number;
  readonly katalogFingerprint: string | null;
  readonly parameter: Readonly<Record<string, number>>;
  readonly aktionsAutoritaet: false;
}

export interface SkillPolicyStatus {
  readonly schemaVersion: 1;
  readonly profileAnzahl: number;
  readonly letzterSpeicherZeitpunkt: number | null;
  readonly letzterLadeFehler: string | null;
  readonly letzterSpeicherFehler: string | null;
  readonly speicherSchluessel: string;
  readonly neueSkillsStandardmaessigFreigegeben: false;
  readonly userDisableIstHarteSperre: true;
  readonly unbekannteControlsFailClosed: true;
  readonly aktionsAutoritaet: false;
}

export interface SkillPolicySemantik {
  readonly skillId: string;
  readonly controls: readonly SkillPolicyControlDefinition[];
}

export interface SkillPolicyKontext {
  readonly katalog: SkillKatalog;
  readonly charakter: SkillPolicyCharakterKontext;
}
