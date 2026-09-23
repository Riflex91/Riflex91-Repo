const SAFE_SLOTS = Object.freeze([
  "cape",
  "belt",
  "amulet",
  "orb",
  "helmet",
  "gloves",
  "shoes",
  "pants",
  "chest",
]);

function text(value, maximum, error) {
  if (typeof value !== "string"
      || value.trim().length === 0
      || value.length > maximum) {
    throw new Error(error);
  }
}

function safeId(value, error) {
  text(value, 192, error);
  if (!/^[A-Za-z0-9._:-]+$/.test(value)) throw new Error(error);
  return value.replaceAll(":", "_");
}

function hash64(value, error) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error(error);
  }
}

function normalizeScope(scope) {
  if (!scope || typeof scope !== "object" || scope.schemaVersion !== 1) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_SCOPE_UNGUELTIG");
  }
  for (const value of [
    scope.accountId,
    scope.characterId,
    scope.sessionId,
    scope.serverRegion,
    scope.serverIdentifier,
  ]) {
    text(
      value,
      192,
      "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_SCOPE_UNGUELTIG",
    );
  }
  if (!SAFE_SLOTS.includes(scope.slot)
      || !Number.isInteger(scope.kandidatIndex)
      || scope.kandidatIndex < 0
      || scope.kandidatIndex >= 128) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_SCOPE_UNGUELTIG");
  }
  for (const value of [
    scope.kandidatFingerprint,
    scope.vorherigesSlotItemFingerprint,
    scope.restInventarFingerprint,
    scope.restEquipmentFingerprint,
    scope.prestateFingerprint,
    scope.evidenceFingerprint,
  ]) {
    hash64(
      value,
      "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_FINGERPRINT_UNGUELTIG",
    );
  }
  if (scope.kandidatFingerprint === scope.vorherigesSlotItemFingerprint) {
    throw new Error(
      "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_IDENTITAET_NICHT_EINDEUTIG",
    );
  }
  return Object.freeze({
    schemaVersion: 1,
    accountId: scope.accountId,
    characterId: scope.characterId,
    sessionId: scope.sessionId,
    serverRegion: scope.serverRegion,
    serverIdentifier: scope.serverIdentifier,
    slot: scope.slot,
    kandidatIndex: scope.kandidatIndex,
    kandidatFingerprint: scope.kandidatFingerprint.toLowerCase(),
    vorherigesSlotItemFingerprint:
      scope.vorherigesSlotItemFingerprint.toLowerCase(),
    restInventarFingerprint: scope.restInventarFingerprint.toLowerCase(),
    restEquipmentFingerprint: scope.restEquipmentFingerprint.toLowerCase(),
    prestateFingerprint: scope.prestateFingerprint.toLowerCase(),
    evidenceFingerprint: scope.evidenceFingerprint.toLowerCase(),
  });
}

function normalizeFences(fences, scope, ablaufId, gueltigBisMs) {
  if (!Array.isArray(fences) || fences.length !== 2) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_FENCES_UNGUELTIG");
  }
  const expected = [
    "character:" + scope.characterId + ":equipment",
    "character:" + scope.characterId + ":inventory",
  ].sort();
  const normalized = fences.map(fence => {
    if (!fence || typeof fence !== "object"
        || fence.art !== "LANGLEBIG"
        || fence.ablaufId !== ablaufId
        || !Number.isSafeInteger(fence.epoche)
        || fence.epoche < 1
        || fence.leaseBisMs !== gueltigBisMs) {
      throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_FENCES_UNGUELTIG");
    }
    text(
      fence.ressourcenId,
      256,
      "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_FENCES_UNGUELTIG",
    );
    return Object.freeze({
      ressourcenId: fence.ressourcenId,
      ablaufId: fence.ablaufId,
      epoche: fence.epoche,
      art: "LANGLEBIG",
      leaseBisMs: fence.leaseBisMs,
    });
  }).sort((a, b) => a.ressourcenId.localeCompare(b.ressourcenId));
  if (normalized[0].ressourcenId !== expected[0]
      || normalized[1].ressourcenId !== expected[1]) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_FENCE_SCOPE_DRIFT");
  }
  text(
    ablaufId,
    192,
    "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_ABLAUF_ID_UNGUELTIG",
  );
  return Object.freeze(normalized);
}

function normalizeIntent(intent) {
  if (!intent || typeof intent !== "object"
      || intent.schemaVersion !== 1
      || intent.art !== "PR20_7_GEAR_SWAP_AUTHORITY_VOR_WIRKUNG"
      || intent.realEvidenceStatus !== "BESTANDEN_REAL_BROWSER_NO_WRITE"
      || intent.policyId !== "PR20-7-GEAR-SWAP-OCCUPIED-ONE-SHOT-V1"
      || intent.maximaleVerwendungen !== 1
      || intent.produktiveRegistrierungErlaubt !== false
      || intent.breiteRuntimeFreigabe !== false
      || intent.gameplayAutoritaet !== false
      || intent.rawWriteAutoritaet !== false
      || intent.swapWriteRatification !== false
      || intent.gameplayWriteNochNichtAusgefuehrt !== true
      || !Number.isSafeInteger(intent.zeitMs)
      || !Number.isSafeInteger(intent.gueltigBisMs)
      || intent.zeitMs < 0
      || intent.gueltigBisMs <= intent.zeitMs
      || intent.gueltigBisMs - intent.zeitMs > 1_500) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_FORMAT_UNGUELTIG");
  }
  for (const value of [
    intent.aktivierungsId,
    intent.transaktionsId,
    intent.ablaufId,
    intent.evidenceId,
  ]) {
    text(
      value,
      192,
      "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_KENNUNG_UNGUELTIG",
    );
  }
  const scope = normalizeScope(intent.scope);
  const fences = normalizeFences(
    intent.fences,
    scope,
    intent.ablaufId,
    intent.gueltigBisMs,
  );
  return Object.freeze({
    schemaVersion: 1,
    art: "PR20_7_GEAR_SWAP_AUTHORITY_VOR_WIRKUNG",
    aktivierungsId: intent.aktivierungsId,
    transaktionsId: intent.transaktionsId,
    ablaufId: intent.ablaufId,
    evidenceId: intent.evidenceId,
    realEvidenceStatus: "BESTANDEN_REAL_BROWSER_NO_WRITE",
    policyId: "PR20-7-GEAR-SWAP-OCCUPIED-ONE-SHOT-V1",
    scope,
    fences,
    zeitMs: intent.zeitMs,
    gueltigBisMs: intent.gueltigBisMs,
    maximaleVerwendungen: 1,
    produktiveRegistrierungErlaubt: false,
    breiteRuntimeFreigabe: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
    gameplayWriteNochNichtAusgefuehrt: true,
  });
}

export class NodePr207GearSwapEinmalAuthorityProtokoll {
  #dateisystem;

  constructor(dateisystem) {
    if (!dateisystem
        || typeof dateisystem !== "object"
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error(
        "PR20_7_GEAR_SWAP_AUTHORITY_DATEISYSTEM_UNGUELTIG",
      );
    }
    this.#dateisystem = dateisystem;
  }

  async schreibeDurable(intent) {
    const normalized = normalizeIntent(intent);
    const path = this.#path(normalized.aktivierungsId);
    const json = JSON.stringify(normalized) + "\n";
    const existing = await this.#dateisystem.liesText(path);
    if (existing !== undefined) {
      if (existing !== json) {
        throw new Error(
          "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_ID_KOLLISION",
        );
      }
      return this.#ack(normalized);
    }
    const created = await this.#dateisystem.erstelleExklusivDurable(
      path,
      json,
    );
    if (!created) {
      const afterRace = await this.#dateisystem.liesText(path);
      if (afterRace !== json) {
        throw new Error(
          "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_ID_KOLLISION",
        );
      }
    }
    return this.#ack(normalized);
  }

  #path(aktivierungsId) {
    return "runtime/authority/mutieren/pr20-7-gear-swap/"
      + safeId(
        aktivierungsId,
        "PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_ID_UNGUELTIG",
      )
      + ".json";
  }

  #ack(intent) {
    return Object.freeze({
      durable: true,
      bestaetigungsId:
        "PR20-7-GEAR-SWAP-AUTH:" + intent.aktivierungsId,
      aktivierungsId: intent.aktivierungsId,
      transaktionsId: intent.transaktionsId,
      ablaufId: intent.ablaufId,
    });
  }
}
