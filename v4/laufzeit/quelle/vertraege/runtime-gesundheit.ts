import type { KampfGefahrenStufe } from './kampfsicherheit.js';

export const RECOVERY_STUFEN = [
  'normal',
  'beobachten',
  'sicher_pausiert',
  'neustart_empfohlen',
  'blockiert'
] as const;
export type RecoveryStufe = (typeof RECOVERY_STUFEN)[number];

export const GRUPPEN_LIVENESS_STATUS = [
  'gesund',
  'beobachten',
  'degradiert',
  'unbekannt'
] as const;
export type GruppenLivenessStatus = (typeof GRUPPEN_LIVENESS_STATUS)[number];

export interface RuntimeGesundheitsKonfiguration {
  readonly beobachtenNachMillisekunden: number;
  readonly sicherPausierenNachMillisekunden: number;
  readonly neustartEmpfehlenNachMillisekunden: number;
}

export interface RuntimeGesundheitsBeobachtung {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly laufzeitGestartetAm: number;
  readonly snapshotErwartet: boolean;
  readonly letzterSnapshotAm: number | null;
  readonly heartbeatErwartet: boolean;
  readonly letzterHeartbeatAm: number | null;
  readonly fachlicherFortschrittErwartet: boolean;
  readonly letzterFachlicherFortschrittAm: number | null;
  readonly gruppenLiveness: GruppenLivenessStatus;
  readonly sicherheitsStufe: KampfGefahrenStufe;
  readonly offeneAktionsAnfragen: number;
  readonly abgebrocheneAktionsAnfragen: number;
  readonly kritischerLaufzeitFehler: boolean;
}

export interface RuntimeGesundheitsZustand {
  readonly schemaVersion: 1;
  readonly ausgewertetAm: number;
  readonly recoveryStufe: RecoveryStufe;
  readonly grund: string;
  readonly gruende: readonly string[];
  readonly snapshotAlterMillisekunden: number | null;
  readonly heartbeatAlterMillisekunden: number | null;
  readonly fachlicherFortschrittAlterMillisekunden: number | null;
  readonly gruppenLiveness: GruppenLivenessStatus;
  readonly sicherheitsStufe: KampfGefahrenStufe;
  readonly offeneAktionsAnfragen: number;
  readonly abgebrocheneAktionsAnfragen: number;
  readonly mussNutzerHandeln: boolean;
  readonly hostNeustartEmpfohlen: boolean;
  readonly automatischerNeustart: false;
}
