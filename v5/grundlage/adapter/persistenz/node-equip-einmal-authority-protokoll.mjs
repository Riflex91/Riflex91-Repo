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
      || intent.art !== "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG"
      || intent.faehigkeitId !== "equipment.equip"
      || intent.anbieterModulId !== "equipment-core"
      || intent.anbieterVersion !== "1"
      || intent.actionContractId !== "AL-ACTION-EQUIP"
      || intent.recoveryContractId !== "AL-RECOVERY-EQUIP"
      || intent.verifierId !== "AL-VERIFIER-EQUIP"
      || intent.policyId !== "EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1"
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
    throw new Error("EQUIP_EINMAL_AUTHORITY_AUDIT_FORMAT_UNGUELTIG");
  }

  pruefeText(
    intent.aktivierungsId,
    128,
    "EQUIP_EINMAL_AUTHORITY_AUDIT_ID_UNGUELTIG",
  );
  pruefeText(
    intent.transaktionsId,
    128,
    "EQUIP_EINMAL_AUTHORITY_TRANSAKTION_UNGUELTIG",
  );

  const evidenceIds = [...intent.evidenceIds].sort();
  for (let index = 0; index < evidenceIds.length; index += 1) {
    pruefeText(
      evidenceIds[index],
      192,
      "EQUIP_EINMAL_AUTHORITY_EVIDENCE_UNGUELTIG",
    );
    if (index > 0 && evidenceIds[index] === evidenceIds[index - 1]) {
      throw new Error("EQUIP_EINMAL_AUTHORITY_EVIDENCE_DOPPELT");
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    aktivierungsId: intent.aktivierungsId,
    transaktionsId: intent.transaktionsId,
    faehigkeitId: "equipment.equip",
    anbieterModulId: "equipment-core",
    anbieterVersion: "1",
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    policyId: "EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1",
    evidenceIds: Object.freeze(evidenceIds),
    zeitMs: intent.zeitMs,
    gueltigBisMs: intent.gueltigBisMs,
    art: "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
    maximaleVerwendungen: 1,
    breiteRuntimeFreigabe: false,
    rawWriteAutoritaet: false,
    gameplayWriteNochNichtAusgefuehrt: true,
  });
}

export class NodeEquipEinmalAuthorityProtokoll {
  #dateisystem;

  constructor(dateisystem) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("EQUIP_EINMAL_AUTHORITY_DATEISYSTEM_UNGUELTIG");
    }
    this.#dateisystem = dateisystem;
  }

  async schreibeDurable(intent) {
    const normalisiert = normalisiereIntent(intent);
    const pfad = this.#pfad(normalisiert.aktivierungsId);
    const json = JSON.stringify(normalisiert) + "\n";

    const vorhanden = await this.#dateisystem.liesText(pfad);
    if (vorhanden !== undefined) {
      if (vorhanden !== json) {
        throw new Error("EQUIP_EINMAL_AUTHORITY_AUDIT_ID_KOLLISION");
      }
      return this.#bestaetigung(normalisiert);
    }

    const neu = await this.#dateisystem.erstelleExklusivDurable(pfad, json);
    if (!neu) {
      const nachRace = await this.#dateisystem.liesText(pfad);
      if (nachRace !== json) {
        throw new Error("EQUIP_EINMAL_AUTHORITY_AUDIT_ID_KOLLISION");
      }
    }
    return this.#bestaetigung(normalisiert);
  }

  #pfad(aktivierungsId) {
    return "runtime/authority/mutieren/equipment-equip/"
      + sichereKennung(
        aktivierungsId,
        "EQUIP_EINMAL_AUTHORITY_AUDIT_ID_UNGUELTIG",
      )
      + ".json";
  }

  #bestaetigung(intent) {
    return Object.freeze({
      durable: true,
      bestaetigungsId: "EQUIP-AUTH:" + intent.aktivierungsId,
      aktivierungsId: intent.aktivierungsId,
      transaktionsId: intent.transaktionsId,
    });
  }
}
