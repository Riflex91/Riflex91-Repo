function pruefeText(wert, maximum, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function sichereKennung(wert, fehler) {
  pruefeText(wert, 128, fehler);
  if (!/^[A-Za-z0-9._:-]+$/.test(wert)) throw new Error(fehler);
  return wert.replaceAll(":", "_");
}

function normalisiereIntent(intent) {
  if (intent === null || typeof intent !== "object"
      || intent.schemaVersion !== 1
      || intent.art !== "MLUCK_EINMAL_AUTHORITY_VOR_WIRKUNG"
      || intent.faehigkeitId !== "merchant.mluck.same_account"
      || intent.ownerId !== "merchant-mluck-core"
      || intent.ownerVersion !== "1"
      || intent.actionContractId !== "AL-ACTION-MLUCK-SAME-ACCOUNT"
      || intent.recoveryContractId !== "AL-RECOVERY-MLUCK-SAME-ACCOUNT"
      || intent.verifierId !== "AL-VERIFIER-MLUCK-SAME-ACCOUNT"
      || intent.policyId !== "MERCHANT-MLUCK-SAME-ACCOUNT-EINMAL-V1"
      || intent.maximaleVerwendungen !== 1
      || intent.breiteRuntimeFreigabe !== false
      || intent.rawWriteAutoritaet !== false
      || !Number.isSafeInteger(intent.ausgestelltAmMs)
      || !Number.isSafeInteger(intent.gueltigBisMs)
      || intent.ausgestelltAmMs < 0
      || intent.gueltigBisMs < intent.ausgestelltAmMs
      || intent.gueltigBisMs - intent.ausgestelltAmMs > 2_000
      || !Array.isArray(intent.evidenceIds)
      || intent.evidenceIds.length < 1
      || intent.evidenceIds.length > 64) {
    throw new Error("MLUCK_EINMAL_AUTHORITY_AUDIT_FORMAT_UNGUELTIG");
  }
  pruefeText(intent.aktivierungsId, 128, "MLUCK_EINMAL_AUTHORITY_AUDIT_ID_UNGUELTIG");
  pruefeText(intent.transaktionsId, 128, "MLUCK_EINMAL_AUTHORITY_TX_UNGUELTIG");
  pruefeText(intent.liveEvidenceFingerprint, 192, "MLUCK_EINMAL_AUTHORITY_LIVE_EVIDENCE_UNGUELTIG");

  const evidenceIds = [...intent.evidenceIds].sort();
  for (let index = 0; index < evidenceIds.length; index += 1) {
    pruefeText(evidenceIds[index], 192, "MLUCK_EINMAL_AUTHORITY_EVIDENCE_UNGUELTIG");
    if (index > 0 && evidenceIds[index] === evidenceIds[index - 1]) {
      throw new Error("MLUCK_EINMAL_AUTHORITY_EVIDENCE_DOPPELT");
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    art: "MLUCK_EINMAL_AUTHORITY_VOR_WIRKUNG",
    aktivierungsId: intent.aktivierungsId,
    transaktionsId: intent.transaktionsId,
    faehigkeitId: "merchant.mluck.same_account",
    ownerId: "merchant-mluck-core",
    ownerVersion: "1",
    actionContractId: "AL-ACTION-MLUCK-SAME-ACCOUNT",
    recoveryContractId: "AL-RECOVERY-MLUCK-SAME-ACCOUNT",
    verifierId: "AL-VERIFIER-MLUCK-SAME-ACCOUNT",
    policyId: "MERCHANT-MLUCK-SAME-ACCOUNT-EINMAL-V1",
    evidenceIds: Object.freeze(evidenceIds),
    liveEvidenceFingerprint: intent.liveEvidenceFingerprint,
    ausgestelltAmMs: intent.ausgestelltAmMs,
    gueltigBisMs: intent.gueltigBisMs,
    maximaleVerwendungen: 1,
    breiteRuntimeFreigabe: false,
    rawWriteAutoritaet: false,
  });
}

export class NodeMluckEinmalAuthorityProtokoll {
  #dateisystem;

  constructor(dateisystem) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("MLUCK_EINMAL_AUTHORITY_DATEISYSTEM_UNGUELTIG");
    }
    this.#dateisystem = dateisystem;
  }

  async schreibeDurable(intent) {
    const normalisiert = normalisiereIntent(intent);
    const pfad = "runtime/authority/mutieren/merchant-mluck/"
      + sichereKennung(
        normalisiert.aktivierungsId,
        "MLUCK_EINMAL_AUTHORITY_AUDIT_ID_UNGUELTIG",
      )
      + ".json";
    const json = JSON.stringify(normalisiert) + "\n";

    const vorhanden = await this.#dateisystem.liesText(pfad);
    if (vorhanden !== undefined) {
      if (vorhanden !== json) {
        throw new Error("MLUCK_EINMAL_AUTHORITY_AUDIT_ID_KOLLISION");
      }
      return this.#bestaetigung(normalisiert);
    }

    const neu = await this.#dateisystem.erstelleExklusivDurable(pfad, json);
    if (!neu) {
      const nachRace = await this.#dateisystem.liesText(pfad);
      if (nachRace !== json) {
        throw new Error("MLUCK_EINMAL_AUTHORITY_AUDIT_ID_KOLLISION");
      }
    }
    return this.#bestaetigung(normalisiert);
  }

  #bestaetigung(intent) {
    return Object.freeze({
      durable: true,
      bestaetigungsId: "MLUCK-AUTH:" + intent.aktivierungsId,
      aktivierungsId: intent.aktivierungsId,
      transaktionsId: intent.transaktionsId,
    });
  }
}
