import type { CapabilityGruppenwahlEntscheidung } from './capability-gruppenwahl.js';
import type { CapabilitySyncEmpfang, RemoteCapabilityVertrauensPruefung } from './capability-sync.js';
import type { CapabilityAuswertung, CharakterFaehigkeiten } from './charakter-faehigkeiten.js';
import type { SkillPolicySkillAnsicht } from './skill-policy.js';
import type { GruppenTeilnehmerStatus } from './gruppen-koordination.js';
import type { SkillKatalogAuditStatus } from './skill-katalog-audit.js';
import type { SkillKatalogZustand } from './skill-katalog.js';

export const CAPABILITY_STATUS_SCHEMA_VERSION = 1 as const;

export const CATALOG_AGREEMENT_STATUS = ['stimmt', 'abweichend', 'unbekannt'] as const;
export type CatalogAgreementStatus = (typeof CATALOG_AGREEMENT_STATUS)[number];

export const CAPABILITY_DIAGNOSE_STUFEN = ['info', 'warnung', 'blockiert'] as const;
export type CapabilityDiagnoseStufe = (typeof CAPABILITY_DIAGNOSE_STUFEN)[number];

export interface CapabilityStatusKatalogSicht {
  readonly zustand: SkillKatalogZustand;
  readonly generation: number;
  readonly fingerprint: string | null;
  readonly letzterErfolgreicherAuditAm: number | null;
  readonly letzteExpliziteValidierungAm: number | null;
  readonly bestaetigungErforderlich: boolean;
  readonly produktionsbereit: boolean;
  readonly grund: string;
  readonly katalogGrund: string | null;
}

export interface CapabilityStatusSliderSicht {
  readonly kennung: string;
  readonly bezeichnung: string;
  readonly art: 'prozent' | 'ganzzahl';
  readonly wert: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly schritt: number;
}

export interface CapabilityStatusSkillSicht {
  readonly skillId: string;
  readonly skillName: string | null;
  readonly strukturellVorhanden: boolean;
  readonly automationValidated: boolean;
  readonly technischBereit: boolean;
  readonly vomNutzerFreigegeben: boolean;
  readonly automatisierungKonfiguriert: boolean;
  readonly aktuellAutomatisierbar: boolean;
  readonly zielKapazitaet: number | null;
  readonly slider: readonly CapabilityStatusSliderSicht[];
  readonly grund: string;
}

export interface CapabilityStatusSkillsSicht {
  readonly gesamt: number;
  readonly strukturellVorhanden: number;
  readonly validiert: number;
  readonly aktiv: number;
  readonly technischBereit: number;
  readonly automatisierungKonfiguriert: number;
  readonly aktuellAutomatisierbar: number;
  readonly skills: readonly CapabilityStatusSkillSicht[];
}

export interface CapabilityStatusCapabilitySicht extends CapabilityAuswertung {}

export interface CapabilityStatusRemoteSicht {
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly vertrauensStatus: RemoteCapabilityVertrauensPruefung['status'];
  readonly lebensnachweisStatus: GruppenTeilnehmerStatus | null;
  readonly lebensnachweisAlterMillisekunden: number | null;
  readonly catalogAgreement: CatalogAgreementStatus;
  readonly remoteKatalogFingerprint: string | null;
  readonly remoteGeneration: number | null;
  readonly remoteFingerprint: string | null;
  readonly aktuellAutomatisierbareSkills: number;
  readonly gruende: readonly string[];
}

export interface CapabilityStatusGruppenwahlSicht {
  readonly verfuegbar: boolean;
  readonly betriebsArt: CapabilityGruppenwahlEntscheidung['betriebsArt'] | null;
  readonly leaderKennung: string | null;
  readonly leaderName: string | null;
  readonly leaderGrund: string | null;
  readonly aufgabenZuordnung: CapabilityGruppenwahlEntscheidung['aufgabenZuordnung'] | null;
  readonly vertrauteTeilnehmerKennungen: readonly string[];
  readonly ausgeschlosseneTeilnehmer: readonly Readonly<{
    charakterKennung: string;
    grund: string;
  }>[];
}

export interface CapabilityDiagnoseEintrag {
  readonly stufe: CapabilityDiagnoseStufe;
  readonly code: string;
  readonly bereich: 'katalog' | 'skill' | 'remote' | 'gruppe';
  readonly bezug: string;
  readonly nachricht: string;
}

export interface CapabilityStatusSicht {
  readonly schemaVersion: 1;
  readonly erstelltAm: number;
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly nurLesen: true;
  readonly spielAutoritaet: false;
  readonly bedienAutoritaet: false;
  readonly neustartAutoritaet: false;
  readonly katalog: CapabilityStatusKatalogSicht;
  readonly skills: CapabilityStatusSkillsSicht;
  readonly capabilities: readonly CapabilityStatusCapabilitySicht[];
  readonly remote: readonly CapabilityStatusRemoteSicht[];
  readonly gruppenwahl: CapabilityStatusGruppenwahlSicht;
  readonly diagnose: readonly CapabilityDiagnoseEintrag[];
}

export interface CapabilityStatusEingabe {
  readonly zeitpunkt: number;
  readonly audit: SkillKatalogAuditStatus;
  readonly lokaleFaehigkeiten: CharakterFaehigkeiten;
  readonly skillPolicies: readonly SkillPolicySkillAnsicht[];
  readonly remoteEmpfaenge: readonly CapabilitySyncEmpfang[];
  readonly remoteVertrauen: readonly RemoteCapabilityVertrauensPruefung[];
  readonly gruppenwahl: CapabilityGruppenwahlEntscheidung | null;
}
