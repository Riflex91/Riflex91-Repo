function text(wert, maximum, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > maximum) throw new Error(fehler);
}

function safe(wert, fehler) {
  text(wert, 128, fehler);
  if (!/^[A-Za-z0-9._:-]+$/.test(wert)) throw new Error(fehler);
  return wert.replaceAll(":", "_");
}

function normalisiere(intent) {
  if (intent === null || typeof intent !== "object"
      || intent.schemaVersion !== 1
      || intent.art !== "BANK_DEPOSIT_EINMAL_AUTHORITY_VOR_WIRKUNG"
      || intent.faehigkeitId !== "merchant.bank.gold_einlagern"
      || intent.anbieterModulId !== "merchant-bank-core"
      || intent.anbieterVersion !== "1"
      || intent.actionContractId !== "AL-ACTION-BANK-DEPOSIT"
      || intent.recoveryContractId !== "AL-RECOVERY-BANK-DEPOSIT"
      || intent.verifierId !== "AL-VERIFIER-BANK-DEPOSIT"
      || intent.policyId !== "BANK-DEPOSIT-PRODUKTION-EINMAL-V1"
      || intent.maximaleVerwendungen !== 1
      || intent.breiteRuntimeFreigabe !== false
      || intent.rawWriteAutoritaet !== false
      || intent.gameplayWriteNochNichtAusgefuehrt !== true
      || !Number.isSafeInteger(intent.zeitMs)
      || !Number.isSafeInteger(intent.gueltigBisMs)
      || intent.zeitMs < 0
      || intent.gueltigBisMs < intent.zeitMs
      || intent.gueltigBisMs - intent.zeitMs > 2_000
      || !Array.isArray(intent.evidenceIds)
      || intent.evidenceIds.length < 1
      || intent.evidenceIds.length > 64) {
    throw new Error("BANK_DEPOSIT_AUTHORITY_AUDIT_FORMAT_UNGUELTIG");
  }
  text(intent.aktivierungsId, 128, "BANK_DEPOSIT_AUTHORITY_ID_UNGUELTIG");
  text(intent.transaktionsId, 128, "BANK_DEPOSIT_AUTHORITY_TX_UNGUELTIG");
  const evidenceIds = Object.freeze([...intent.evidenceIds].sort());
  for (let i = 0; i < evidenceIds.length; i += 1) {
    text(evidenceIds[i], 192, "BANK_DEPOSIT_AUTHORITY_EVIDENCE_UNGUELTIG");
    if (i > 0 && evidenceIds[i] === evidenceIds[i - 1]) {
      throw new Error("BANK_DEPOSIT_AUTHORITY_EVIDENCE_DOPPELT");
    }
  }
  return Object.freeze({
    ...intent,
    evidenceIds,
  });
}

export class NodeBankDepositEinmalAuthorityProtokoll {
  #dateisystem;

  constructor(dateisystem) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("BANK_DEPOSIT_AUTHORITY_DATEISYSTEM_UNGUELTIG");
    }
    this.#dateisystem = dateisystem;
  }

  async schreibeDurable(intentWert) {
    const intent = normalisiere(intentWert);
    const pfad = "runtime/authority/mutieren/bank-deposit/"
      + safe(intent.aktivierungsId, "BANK_DEPOSIT_AUTHORITY_ID_UNGUELTIG")
      + ".json";
    const json = JSON.stringify(intent) + "\n";
    const vorhanden = await this.#dateisystem.liesText(pfad);
    if (vorhanden !== undefined) {
      if (vorhanden !== json) {
        throw new Error("BANK_DEPOSIT_AUTHORITY_AUDIT_ID_KOLLISION");
      }
      return this.#ack(intent);
    }
    const erstellt = await this.#dateisystem.erstelleExklusivDurable(
      pfad,
      json,
    );
    if (!erstellt) {
      const nachRace = await this.#dateisystem.liesText(pfad);
      if (nachRace !== json) {
        throw new Error("BANK_DEPOSIT_AUTHORITY_AUDIT_ID_KOLLISION");
      }
    }
    return this.#ack(intent);
  }

  #ack(intent) {
    return Object.freeze({
      durable: true,
      bestaetigungsId: "BANK-DEPOSIT-AUTH:" + intent.aktivierungsId,
      aktivierungsId: intent.aktivierungsId,
      transaktionsId: intent.transaktionsId,
    });
  }
}
