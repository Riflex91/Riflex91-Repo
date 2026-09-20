import {
  type AbgleichEvidence,
  type AbgleichBeobachterPort,
  type RecoveryAbschluss,
  type RecoveryAnfrage,
  type RecoveryVertragsPort,
  validiereDifferenz,
  validiereRecoveryAnfrage,
} from "./typen.js";

function pruefeEvidence(
  evidence: AbgleichEvidence,
  actionContractId: string,
  recoveryContractId: string,
): void {
  if (evidence.schemaVersion !== 1) throw new Error("RECOVERY_EVIDENCE_SCHEMA_UNGUELTIG");
  if (!Number.isSafeInteger(evidence.beobachtetAmMs) || evidence.beobachtetAmMs < 0) {
    throw new Error("RECOVERY_EVIDENCE_ZEIT_UNGUELTIG");
  }
  if (evidence.snapshot.actionContractId !== actionContractId
      || evidence.snapshot.recoveryContractId !== recoveryContractId) {
    throw new Error("RECOVERY_EVIDENCE_SNAPSHOT_DRIFT");
  }
  validiereDifferenz(evidence.differenz);
  if (evidence.evidenceFingerprints.length < 1 || evidence.evidenceFingerprints.length > 128) {
    throw new Error("RECOVERY_EVIDENCE_FINGERPRINT_ANZAHL_UNGUELTIG");
  }
  if (evidence.klassifikation === "BESTAETIGT"
      && evidence.differenz.offeneDomaenen.length > 0) {
    throw new Error("RECOVERY_BESTAETIGT_MIT_OFFENEN_DOMAENEN");
  }
  if (evidence.klassifikation === "NICHT_AUSGEFUEHRT"
      && evidence.differenz.angewendeteDomaenen.length > 0) {
    throw new Error("RECOVERY_NICHT_AUSGEFUEHRT_MIT_EFFEKT");
  }
  if (evidence.klassifikation === "TEILWEISE"
      && (evidence.differenz.angewendeteDomaenen.length === 0
        || evidence.differenz.offeneDomaenen.length === 0)) {
    throw new Error("RECOVERY_TEILWEISE_OHNE_ECHTE_DIFFERENZ");
  }
}

function abschluss(
  transaktionsId: string,
  art: RecoveryAbschluss["art"],
  klassifikation: RecoveryAbschluss["klassifikation"],
  beobachtungen: number,
  restDomaenen: readonly string[],
  neuerIntentErforderlich: boolean,
  fehlerDomaeneId: string,
): RecoveryAbschluss {
  return Object.freeze({
    schemaVersion: 1,
    transaktionsId,
    art,
    klassifikation,
    beobachtungen,
    restDomaenen: Object.freeze([...restDomaenen].sort()),
    neuerIntentErforderlich,
    sameIntentErneutSenden: false,
    fehlerDomaeneId,
  });
}

export class RecoveryKernel {
  readonly #vertraege: RecoveryVertragsPort;
  readonly #beobachter: AbgleichBeobachterPort;

  public constructor(
    vertraege: RecoveryVertragsPort,
    beobachter: AbgleichBeobachterPort,
  ) {
    this.#vertraege = vertraege;
    this.#beobachter = beobachter;
  }

  public async gleicheAb<Ergebnis>(
    anfrage: RecoveryAnfrage<Ergebnis>,
  ): Promise<RecoveryAbschluss> {
    const snapshot = validiereRecoveryAnfrage(anfrage);
    const vertrag = this.#vertraege.pruefe(
      anfrage.actionContractId,
      anfrage.recoveryContractId,
    );
    if (!vertrag.produktivErlaubt
        || vertrag.actionContractId !== anfrage.actionContractId
        || vertrag.recoveryContractId !== anfrage.recoveryContractId
        || vertrag.sameIntentAfterPossibleSend !== "NEVER") {
      throw new Error("RECOVERY_VERTRAG_NICHT_FREIGEGEBEN");
    }
    if (!Number.isInteger(vertrag.maximaleBeobachtungen)
        || vertrag.maximaleBeobachtungen < 1
        || vertrag.maximaleBeobachtungen > 32) {
      throw new Error("RECOVERY_BEOBACHTUNGSGRENZE_UNGUELTIG");
    }
    if (vertrag.fehlerDomaeneId.trim().length === 0) {
      throw new Error("RECOVERY_FEHLERDOMAENE_UNGUELTIG");
    }

    if (anfrage.transportErgebnis.art === "NICHT_GESENDET") {
      return abschluss(
        anfrage.transaktionsId,
        "ABORTED",
        "NICHT_GESENDET",
        0,
        [],
        false,
        vertrag.fehlerDomaeneId,
      );
    }

    for (let versuch = 1; versuch <= vertrag.maximaleBeobachtungen; versuch += 1) {
      const evidence = await this.#beobachter.beobachte(
        anfrage.transaktionsId,
        snapshot,
        versuch,
      );
      pruefeEvidence(evidence, anfrage.actionContractId, anfrage.recoveryContractId);

      if (evidence.snapshot.wissensSnapshot.gitCommit !== snapshot.wissensSnapshot.gitCommit
          || evidence.snapshot.configFingerprint !== snapshot.configFingerprint
          || evidence.snapshot.prestateFingerprint !== snapshot.prestateFingerprint
          || evidence.snapshot.verifierId !== snapshot.verifierId) {
        throw new Error("RECOVERY_INFLIGHT_SNAPSHOT_UMGEDEUTET");
      }

      if (evidence.klassifikation === "BESTAETIGT") {
        return abschluss(
          anfrage.transaktionsId,
          "COMMITTED",
          evidence.klassifikation,
          versuch,
          [],
          false,
          vertrag.fehlerDomaeneId,
        );
      }
      if (evidence.klassifikation === "NICHT_AUSGEFUEHRT") {
        return abschluss(
          anfrage.transaktionsId,
          "REPLAN_ALLOWED",
          evidence.klassifikation,
          versuch,
          evidence.differenz.erwarteteDomaenen,
          true,
          vertrag.fehlerDomaeneId,
        );
      }
      if (evidence.klassifikation === "TEILWEISE") {
        return abschluss(
          anfrage.transaktionsId,
          "REPLAN_ALLOWED",
          evidence.klassifikation,
          versuch,
          evidence.differenz.offeneDomaenen,
          true,
          vertrag.fehlerDomaeneId,
        );
      }
      if (evidence.klassifikation === "UNGEKLAERT") {
        return abschluss(
          anfrage.transaktionsId,
          "OPERATOR_REQUIRED",
          evidence.klassifikation,
          versuch,
          evidence.differenz.offeneDomaenen,
          false,
          vertrag.fehlerDomaeneId,
        );
      }
      // NOCH_AUSSTEHEND: bounded erneut beobachten, niemals erneut senden.
    }

    return abschluss(
      anfrage.transaktionsId,
      "FAILED_SAFE",
      "NOCH_AUSSTEHEND",
      vertrag.maximaleBeobachtungen,
      [],
      false,
      vertrag.fehlerDomaeneId,
    );
  }
}
