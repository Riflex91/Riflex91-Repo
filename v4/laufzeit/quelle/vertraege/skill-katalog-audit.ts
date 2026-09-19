import type { SkillKatalog } from './skill-katalog.js';

export const SKILL_KATALOG_AUDIT_SCHEMA_VERSION = 1 as const;

export const SKILL_KATALOG_AUDIT_AUSLOESER = [
  'runtime_start',
  'periodisch',
  'connection_gap',
  'recovery',
  'serverwechsel',
  'charakterwechsel',
  'levelaenderung',
  'skill_drift',
  'revalidierung'
] as const;
export type SkillKatalogAuditAusloeser = (typeof SKILL_KATALOG_AUDIT_AUSLOESER)[number];

export interface SkillKatalogAuditIdentitaet {
  readonly charakterKennung: string | null;
  readonly charakterName: string | null;
  readonly klasse: string | null;
  readonly stufe: number | null;
  readonly serverRegion: string | null;
  readonly serverKennung: string | null;
}

export interface SkillKatalogRevalidierungsProfil {
  readonly schemaVersion: 1;
  readonly katalogFingerprint: string;
  readonly katalogGeneration: number;
  readonly charakterKennung: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly bestaetigtAm: number;
  readonly aktionsAutoritaet: false;
}

export interface SkillKatalogAuditKonfiguration {
  readonly periodischesIntervallMillisekunden: number;
}

export interface SkillKatalogAuditZeitgeber {
  readonly jetzt: () => number;
  readonly setzeIntervall: (aktion: () => void, intervallMillisekunden: number) => unknown;
  readonly loescheIntervall: (kennung: unknown) => void;
}

export interface SkillKatalogAuditStatus {
  readonly schemaVersion: 1;
  readonly gestartet: boolean;
  readonly auditNummer: number;
  readonly letzterAuditAm: number | null;
  readonly letzterErfolgreicherAuditAm: number | null;
  readonly letzteAusloeser: readonly SkillKatalogAuditAusloeser[];
  readonly connectionGapAktiv: boolean;
  readonly periodischesIntervallMillisekunden: number;
  readonly identitaet: SkillKatalogAuditIdentitaet;
  readonly katalog: SkillKatalog;
  readonly revalidierungsProfil: SkillKatalogRevalidierungsProfil | null;
  readonly produktionsbereit: boolean;
  readonly grund: string;
  readonly aktionsAutoritaet: false;
  readonly automatischerNeustart: false;
}
