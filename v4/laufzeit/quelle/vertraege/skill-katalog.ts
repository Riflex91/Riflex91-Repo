export const SKILL_KATALOG_SCHEMA_VERSION = 1 as const;
export const SKILL_KATALOG_QUELLE = 'adventure-land-g-skills' as const;

export const SKILL_KATALOG_ZUSTAENDE = ['bereit', 'veraltet', 'drift', 'blockiert'] as const;
export type SkillKatalogZustand = (typeof SKILL_KATALOG_ZUSTAENDE)[number];

export const SKILL_CAPABILITY_TAGS = [
  'einzelziel-schaden',
  'einzelziel-spitzenschaden',
  'einzelziel-heilung',
  'einzelziel-kontrolle',
  'einzelziel-debuff',
  'mehrziel-schaden',
  'fernkampf-mehrziel-schaden',
  'variabler-mehrziel-schaden',
  'flaechen-schaden',
  'flaechen-kontrolle',
  'flaechen-aggro-kontrolle',
  'aggro-kontrolle',
  'pull-kontrolle',
  'gruppen-heilung',
  'gruppen-erhaltung',
  'gruppen-unterstuetzung',
  'gruppen-schadensunterstuetzung',
  'ressourcen-unterstuetzung',
  'persoenlicher-schutz',
  'mobilitaet',
  'wiederbelebung',
  'nichtkampf-unterstuetzung'
] as const;
export type SkillCapabilityTag = (typeof SKILL_CAPABILITY_TAGS)[number];

export interface SkillSlotVoraussetzung {
  readonly slot: string;
  readonly gegenstand: string;
}

export interface SkillAusruestungsVoraussetzungen {
  readonly waffenTypen: readonly string[];
  readonly nebenhandTyp: string | null;
  readonly slots: readonly SkillSlotVoraussetzung[];
}

export interface SkillMaterialVoraussetzungen {
  readonly verbrauch: string | null;
  readonly inventar: readonly string[];
  readonly anforderungen: Readonly<Record<string, string | number | boolean>>;
}

export interface SkillBeobachteteMerkmale {
  readonly mehrziel: boolean;
  readonly zielListe: boolean;
  readonly gruppe: boolean;
  readonly aura: boolean;
  readonly heilung: boolean;
  readonly feindlich: boolean;
  readonly passiv: boolean;
  readonly umschaltbar: boolean;
  readonly zielModus: string | boolean | null;
  readonly geteilterCooldown: string | null;
  readonly bedingung: string | null;
  readonly schadensArt: string | null;
  readonly procs: boolean | null;
  readonly immunitaetDurchdringen: boolean | null;
}

export interface TechnischeSkillReadiness {
  readonly zustand: 'unbekannt';
  readonly grund: string;
  readonly aktionsFreigabe: false;
}

export interface SkillKatalogEintrag {
  readonly schemaVersion: typeof SKILL_KATALOG_SCHEMA_VERSION;
  readonly skillId: string;
  readonly name: string | null;
  readonly art: string | null;
  readonly klassen: readonly string[];
  readonly stufenVoraussetzung: number | null;
  readonly manaKosten: number | null;
  readonly cooldownMillisekunden: number | null;
  readonly wiederverwendungsCooldownMillisekunden: number | null;
  readonly reichweite: number | null;
  readonly reichweitenMultiplikator: number | null;
  readonly reichweitenBonus: number | null;
  readonly schadensWert: number | null;
  readonly schadensMultiplikator: number | null;
  readonly cooldownMultiplikator: number | null;
  readonly zielKapazitaet: number | null;
  readonly ausruestung: SkillAusruestungsVoraussetzungen;
  readonly materialien: SkillMaterialVoraussetzungen;
  readonly merkmale: SkillBeobachteteMerkmale;
  readonly capabilityTags: readonly SkillCapabilityTag[];
  readonly technischeReadiness: TechnischeSkillReadiness;
  readonly automationValidated: boolean;
  readonly validierungsGrund: string;
  readonly unbekannteRohFelder: readonly string[];
  readonly fachlicherFingerprint: string;
}

export interface SkillKatalog {
  readonly schemaVersion: typeof SKILL_KATALOG_SCHEMA_VERSION;
  readonly quelle: typeof SKILL_KATALOG_QUELLE;
  readonly aufgenommenAm: number;
  readonly generation: number;
  readonly zustand: SkillKatalogZustand;
  readonly grund: string | null;
  readonly fingerprint: string | null;
  readonly vorherigerFingerprint: string | null;
  readonly skills: readonly SkillKatalogEintrag[];
  readonly automationValidatedAnzahl: number;
  readonly fehler: readonly string[];
  readonly bestaetigungErforderlich: boolean;
  readonly spielAutoritaet: false;
}
