import type { AusfuehrungsTransportErgebnis } from "../ausfuehrung/ports.js";
import type { WissensSnapshotPin } from "../scheduler/workflow-vertrag.js";

export type AbgleichKlassifikation =
  | "BESTAETIGT"
  | "NICHT_AUSGEFUEHRT"
  | "TEILWEISE"
  | "NOCH_AUSSTEHEND"
  | "UNGEKLAERT";

export type RecoveryAbschlussArt =
  | "COMMITTED"
  | "ABORTED"
  | "REPLAN_ALLOWED"
  | "FAILED_SAFE"
  | "OPERATOR_REQUIRED";

export interface TransaktionsSnapshotPin {
  readonly schemaVersion: 1;
  readonly wissensSnapshot: WissensSnapshotPin;
  readonly configFingerprint: string;
  readonly prestateFingerprint: string;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
}

export interface DifferenzNachweis {
  readonly schemaVersion: 1;
  readonly erwarteteDomaenen: readonly string[];
  readonly angewendeteDomaenen: readonly string[];
  readonly offeneDomaenen: readonly string[];
  readonly widerspruechlicheDomaenen: readonly string[];
}

export interface AbgleichEvidence {
  readonly schemaVersion: 1;
  readonly klassifikation: AbgleichKlassifikation;
  readonly beobachtetAmMs: number;
  readonly snapshot: TransaktionsSnapshotPin;
  readonly differenz: DifferenzNachweis;
  readonly evidenceFingerprints: readonly string[];
}

export interface RecoveryVertragsNachweis {
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly produktivErlaubt: boolean;
  readonly sameIntentAfterPossibleSend: "NEVER";
  readonly maximaleBeobachtungen: number;
  readonly fehlerDomaeneId: string;
}

export interface RecoveryVertragsPort {
  pruefe(
    actionContractId: string,
    recoveryContractId: string,
  ): RecoveryVertragsNachweis;
}

export interface AbgleichBeobachterPort {
  beobachte(
    transaktionsId: string,
    snapshot: TransaktionsSnapshotPin,
    versuch: number,
  ): Promise<AbgleichEvidence>;
}

export interface RecoveryAnfrage<Ergebnis = unknown> {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly transportErgebnis: AusfuehrungsTransportErgebnis<Ergebnis>;
  readonly snapshot: TransaktionsSnapshotPin;
}

export interface RecoveryAbschluss {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly art: RecoveryAbschlussArt;
  readonly klassifikation: AbgleichKlassifikation | "NICHT_GESENDET";
  readonly beobachtungen: number;
  readonly restDomaenen: readonly string[];
  readonly neuerIntentErforderlich: boolean;
  readonly sameIntentErneutSenden: false;
  readonly fehlerDomaeneId: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeEindeutig(werte: readonly string[], fehler: string): void {
  const sortiert = [...werte].sort();
  if (sortiert.some((wert, index) => index > 0 && wert === sortiert[index - 1])) {
    throw new Error(fehler);
  }
}

export function friereTransaktionsSnapshot(
  snapshot: TransaktionsSnapshotPin,
): TransaktionsSnapshotPin {
  if (snapshot.schemaVersion !== 1) throw new Error("RECOVERY_SNAPSHOT_SCHEMA_UNGUELTIG");
  pruefeText(snapshot.configFingerprint, "RECOVERY_CONFIG_FINGERPRINT_UNGUELTIG");
  pruefeText(snapshot.prestateFingerprint, "RECOVERY_PRESTATE_FINGERPRINT_UNGUELTIG");
  pruefeText(snapshot.actionContractId, "RECOVERY_ACTION_CONTRACT_UNGUELTIG");
  pruefeText(snapshot.recoveryContractId, "RECOVERY_RECOVERY_CONTRACT_UNGUELTIG");
  pruefeText(snapshot.verifierId, "RECOVERY_VERIFIER_UNGUELTIG");
  if (!/^[0-9a-f]{40}$/i.test(snapshot.wissensSnapshot.gitCommit)) {
    throw new Error("RECOVERY_WISSENS_COMMIT_UNGUELTIG");
  }
  if (snapshot.wissensSnapshot.quellenSha256.length < 1
      || snapshot.wissensSnapshot.quellenSha256.length > 128) {
    throw new Error("RECOVERY_WISSENS_QUELLEN_ANZAHL_UNGUELTIG");
  }
  for (const hash of snapshot.wissensSnapshot.quellenSha256) {
    if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error("RECOVERY_WISSENS_HASH_UNGUELTIG");
  }
  pruefeEindeutig(snapshot.wissensSnapshot.quellenSha256, "RECOVERY_WISSENS_HASH_DOPPELT");

  return Object.freeze({
    ...snapshot,
    wissensSnapshot: Object.freeze({
      gitCommit: snapshot.wissensSnapshot.gitCommit,
      quellenSha256: Object.freeze([...snapshot.wissensSnapshot.quellenSha256].sort()),
    }),
  });
}

export function validiereDifferenz(differenz: DifferenzNachweis): void {
  if (differenz.schemaVersion !== 1) throw new Error("RECOVERY_DIFFERENZ_SCHEMA_UNGUELTIG");
  for (const gruppe of [
    differenz.erwarteteDomaenen,
    differenz.angewendeteDomaenen,
    differenz.offeneDomaenen,
    differenz.widerspruechlicheDomaenen,
  ]) {
    if (gruppe.length > 128) throw new Error("RECOVERY_DIFFERENZ_ZU_GROSS");
    for (const id of gruppe) pruefeText(id, "RECOVERY_DIFFERENZ_DOMAENE_UNGUELTIG");
    pruefeEindeutig(gruppe, "RECOVERY_DIFFERENZ_DOMAENE_DOPPELT");
  }
  for (const id of [
    ...differenz.angewendeteDomaenen,
    ...differenz.offeneDomaenen,
    ...differenz.widerspruechlicheDomaenen,
  ]) {
    if (!differenz.erwarteteDomaenen.includes(id)) {
      throw new Error("RECOVERY_DIFFERENZ_AUSSERHALB_ERWARTUNG:" + id);
    }
  }
}

export function validiereRecoveryAnfrage(
  anfrage: RecoveryAnfrage,
): TransaktionsSnapshotPin {
  if (anfrage.schemaVersion !== 1) throw new Error("RECOVERY_ANFRAGE_SCHEMA_UNGUELTIG");
  pruefeText(anfrage.transaktionsId, "RECOVERY_TRANSAKTION_ID_UNGUELTIG");
  if (anfrage.actionContractId !== anfrage.snapshot.actionContractId
      || anfrage.recoveryContractId !== anfrage.snapshot.recoveryContractId) {
    throw new Error("RECOVERY_SNAPSHOT_VERTRAG_STIMMT_NICHT");
  }
  return friereTransaktionsSnapshot(anfrage.snapshot);
}
