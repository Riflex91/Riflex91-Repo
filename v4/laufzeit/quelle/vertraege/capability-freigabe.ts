import type { CapabilityGruppenwahlEntscheidung } from './capability-gruppenwahl.js';
import type { CapabilityStatusSicht } from './capability-status.js';
import type {
  CapabilitySyncEmpfang,
  CapabilitySyncSendeErgebnis,
  CapabilitySyncSnapshot,
  RemoteCapabilityVertrauensPruefung
} from './capability-sync.js';
import type { CharakterFaehigkeiten } from './charakter-faehigkeiten.js';
import type { SkillKatalogAuditStatus } from './skill-katalog-audit.js';

export const CAPABILITY_FREIGABE_VERSION = '1.0.0' as const;
export const CAPABILITY_FREIGABE_SCHEMA_VERSION = 1 as const;

export interface CapabilityFreigabePolicyVorgabe {
  readonly skillId: string;
  readonly freigegeben: boolean;
  readonly parameter?: Readonly<Record<string, number>>;
}

export interface CapabilityFreigabeOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly ablaufKennung: string;
  readonly vertrauensNamen: readonly string[];
  readonly koordinationsNamen?: readonly string[];
  readonly policyVorgaben?: readonly CapabilityFreigabePolicyVorgabe[];
}

export interface CapabilityFreigabeSendeZaehler {
  readonly versuche: number;
  readonly erfolge: number;
  readonly fehler: number;
  readonly letzterFehler: string | null;
}

export interface CapabilityFreigabeStatus {
  readonly schemaVersion: 1;
  readonly version: typeof CAPABILITY_FREIGABE_VERSION;
  readonly aktivFreigegeben: boolean;
  readonly ablaufKennung: string;
  readonly remoteBeobachtungInstalliert: boolean;
  readonly capabilityEmpfangInstalliert: boolean;
  readonly beobachteteLebensnachweise: number;
  readonly empfangeneCapabilitySnapshots: number;
  readonly senden: CapabilityFreigabeSendeZaehler;
  readonly audit: SkillKatalogAuditStatus | null;
  readonly faehigkeiten: CharakterFaehigkeiten | null;
  readonly lokalerSnapshot: CapabilitySyncSnapshot | null;
  readonly remoteVertrauen: readonly RemoteCapabilityVertrauensPruefung[];
  readonly gruppenwahl: CapabilityGruppenwahlEntscheidung | null;
  readonly capabilityStatus: CapabilityStatusSicht | null;
  readonly spielAutoritaet: false;
  readonly neustartAutoritaet: false;
}

export interface CapabilityFreigabeAktualisierung {
  readonly schemaVersion: 1;
  readonly status: CapabilityFreigabeStatus;
  readonly lokalerSnapshot: CapabilitySyncSnapshot | null;
  readonly remoteEmpfaenge: readonly CapabilitySyncEmpfang[];
}

export interface CapabilityFreigabeSendeAntwort {
  readonly schemaVersion: 1;
  readonly zielName: string;
  readonly ergebnis: CapabilitySyncSendeErgebnis;
  readonly status: CapabilityFreigabeStatus;
}

export interface CapabilityFreigabeApi {
  readonly version: typeof CAPABILITY_FREIGABE_VERSION;
  readonly status: () => CapabilityFreigabeStatus;
  readonly aktualisiere: () => CapabilityFreigabeAktualisierung;
  readonly installiereRemoteBeobachtung: () => CapabilityFreigabeStatus;
  readonly sendeCapabilityEinmal: (
    zielName: string,
    bestaetigungsText: string
  ) => Promise<CapabilityFreigabeSendeAntwort>;
  readonly stoppe: () => CapabilityFreigabeStatus;
  readonly sendeBestaetigungsText: (zielName: string) => string;
}
