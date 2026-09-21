function pruefeText(wert, maximum, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function sichereKennung(wert) {
  pruefeText(wert, 128, "PLANEN_AKTIVIERUNGS_AUDIT_ID_UNGUELTIG");
  if (!/^[A-Za-z0-9._:-]+$/.test(wert)) {
    throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_ID_UNGUELTIG");
  }
  return wert.replaceAll(":", "_");
}

function normalisiereIntent(intent) {
  if (intent === null || typeof intent !== "object") {
    throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_FORMAT_UNGUELTIG");
  }
  if (intent.schemaVersion !== 1
      || intent.art !== "PLANEN_AKTIVIERUNG_VOR_WIRKUNG"
      || intent.gameplayAutoritaet !== false
      || intent.rawWriteAutoritaet !== false
      || intent.actionAuthority !== false
      || !Number.isSafeInteger(intent.zeitMs)
      || intent.zeitMs < 0
      || !Array.isArray(intent.evidenceIds)
      || intent.evidenceIds.length < 1
      || intent.evidenceIds.length > 64) {
    throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_FORMAT_UNGUELTIG");
  }

  pruefeText(intent.aktivierungsId, 128, "PLANEN_AKTIVIERUNGS_AUDIT_ID_UNGUELTIG");
  pruefeText(intent.faehigkeitId, 128, "PLANEN_AKTIVIERUNGS_AUDIT_FAEHIGKEIT_UNGUELTIG");
  pruefeText(intent.anbieterModulId, 128, "PLANEN_AKTIVIERUNGS_AUDIT_PROVIDER_UNGUELTIG");
  pruefeText(intent.anbieterVersion, 128, "PLANEN_AKTIVIERUNGS_AUDIT_VERSION_UNGUELTIG");
  pruefeText(intent.policyId, 128, "PLANEN_AKTIVIERUNGS_AUDIT_POLICY_UNGUELTIG");

  const evidenceIds = [...intent.evidenceIds].sort();
  for (let index = 0; index < evidenceIds.length; index += 1) {
    pruefeText(
      evidenceIds[index],
      192,
      "PLANEN_AKTIVIERUNGS_AUDIT_EVIDENCE_UNGUELTIG",
    );
    if (index > 0 && evidenceIds[index] === evidenceIds[index - 1]) {
      throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_EVIDENCE_DOPPELT");
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    aktivierungsId: intent.aktivierungsId,
    faehigkeitId: intent.faehigkeitId,
    anbieterModulId: intent.anbieterModulId,
    anbieterVersion: intent.anbieterVersion,
    policyId: intent.policyId,
    evidenceIds: Object.freeze(evidenceIds),
    zeitMs: intent.zeitMs,
    art: "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    actionAuthority: false,
  });
}

export class NodePlanenAktivierungsProtokoll {
  #dateisystem;

  constructor(dateisystem) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_DATEISYSTEM_UNGUELTIG");
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
        throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_ID_KOLLISION");
      }
      return this.#bestaetigung(normalisiert.aktivierungsId);
    }

    const neu = await this.#dateisystem.erstelleExklusivDurable(pfad, json);
    if (!neu) {
      const nachRace = await this.#dateisystem.liesText(pfad);
      if (nachRace !== json) {
        throw new Error("PLANEN_AKTIVIERUNGS_AUDIT_ID_KOLLISION");
      }
    }

    return this.#bestaetigung(normalisiert.aktivierungsId);
  }

  #pfad(aktivierungsId) {
    return "runtime/authority/planen/"
      + sichereKennung(aktivierungsId)
      + ".json";
  }

  #bestaetigung(aktivierungsId) {
    return Object.freeze({
      durable: true,
      bestaetigungsId: "PLAN-AUDIT:" + aktivierungsId,
      aktivierungsId,
    });
  }
}
