import type { RecoveryStufe } from './runtime-gesundheit.js';

export const RECOVERY_CHECKPOINT_SCHEMA_VERSION = 1 as const;
export const RECOVERY_CHECKPOINT_SLOTS = ['A', 'B'] as const;
export type RecoveryCheckpointSlot = (typeof RECOVERY_CHECKPOINT_SLOTS)[number];

export interface RecoveryCheckpointInhalt {
  readonly schemaVersion: 1;
  readonly charakterKennung: string;
  readonly ablaufKennung: string;
  readonly entscheidungKennung: string | null;
  readonly fachlicherFingerabdruck: string | null;
  readonly recoveryStufe: RecoveryStufe;
  readonly offeneAktionsAnfrageKennungen: readonly string[];
  readonly letzteEreignisNummer: number | null;
}

export interface RecoveryCheckpointNutzlast {
  readonly schemaVersion: 1;
  readonly sequenz: number;
  readonly gespeichertAm: number;
  readonly grund: string;
  readonly wiederaufnahmeErlaubt: false;
  readonly abgleichErforderlich: true;
  readonly aktionsAutoritaet: false;
  readonly inhalt: RecoveryCheckpointInhalt;
}

export interface RecoveryCheckpointHuelle {
  readonly schemaVersion: 1;
  readonly sha256: string;
  readonly serialisiert: string;
}

export const RECOVERY_CHECKPOINT_SPEICHER_STATUS = [
  'gespeichert',
  'zu_gross',
  'speicher_fehler'
] as const;
export type RecoveryCheckpointSpeicherStatus =
  (typeof RECOVERY_CHECKPOINT_SPEICHER_STATUS)[number];

export interface RecoveryCheckpointSpeicherErgebnis {
  readonly status: RecoveryCheckpointSpeicherStatus;
  readonly grund: string;
  readonly slot: RecoveryCheckpointSlot | null;
  readonly sequenz: number | null;
  readonly bytes: number;
}

export const RECOVERY_CHECKPOINT_LADE_STATUS = [
  'geladen',
  'nicht_vorhanden',
  'beschaedigt'
] as const;
export type RecoveryCheckpointLadeStatus =
  (typeof RECOVERY_CHECKPOINT_LADE_STATUS)[number];

export interface RecoveryCheckpointLadeErgebnis {
  readonly status: RecoveryCheckpointLadeStatus;
  readonly grund: string;
  readonly slot: RecoveryCheckpointSlot | null;
  readonly fallbackVerwendet: boolean;
  readonly checkpoint: RecoveryCheckpointNutzlast | null;
}
