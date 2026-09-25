import type { CharacterZielBindung } from "./roster-wahrheit.js";
import type {
  ProduktionsMaterialFortschritt,
  ProduktionsMaterialZiel,
} from "./production-material-acquisition.js";
import {
  planeMerchantLogistik,
  type LogistikQuellenEvidence,
  type MerchantLogistikPlanungsErgebnis,
} from "../merchant/logistik-planer.js";
import type { RendezvousEvidence } from "../merchant/logistik-workflow.js";

export interface ProduktionsMaterialHandoffAnfrage {
  readonly schemaVersion: 1;
  readonly ziel: ProduktionsMaterialZiel;
  readonly fortschritt: ProduktionsMaterialFortschritt;
  readonly merchant: CharacterZielBindung;
  readonly quelleEvidence: LogistikQuellenEvidence;
  readonly merchantRendezvousEvidence: RendezvousEvidence;
  readonly baselineMerchantInventoryFingerprint: string;
  readonly baselineMerchantMenge: number;
  readonly erstelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalTransferDistanz: number;
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialHandoffPlan {
  readonly schemaVersion: 1;
  readonly status: "COLLECTION_PLAN_BEREIT_NO_WRITE";
  readonly objectiveId: string;
  readonly logistik: MerchantLogistikPlanungsErgebnis;
  readonly farmStopVerified: true;
  readonly materialReadyVerified: true;
  readonly singlePhysicalStackPinned: true;
  readonly pr22CoordinationRequired: true;
  readonly pr23FarmStopEvidenceRequired: true;
  readonly productiveTransferAuthorityRequired: true;
  readonly settledFutureHandoffRequiresFreshCraftRescan: true;
  readonly handoffPlanCountsAsNaturalCurrentInventoryCandidate: false;
  readonly foundationCountsAsCraftRatification: false;
  readonly planningOnly: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function ganzzahl(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function validiereBindung(bindung: CharacterZielBindung, fehler: string): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error(fehler);
  }
  for (const wert of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) text(wert, fehler);
}

function gleicheBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.schemaVersion === 1
    && b.schemaVersion === 1
    && a.accountId === b.accountId
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

function gleicheAccountServerBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier;
}

function evidenceFrisch(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  maximalAlterMs: number,
): boolean {
  return Number.isSafeInteger(beobachtetAmMs)
    && Number.isSafeInteger(gueltigBisMs)
    && beobachtetAmMs >= 0
    && gueltigBisMs >= beobachtetAmMs
    && jetztMs >= beobachtetAmMs
    && jetztMs <= gueltigBisMs
    && jetztMs - beobachtetAmMs <= maximalAlterMs;
}

export function planeProductionMaterialHandoff(
  anfrage: ProduktionsMaterialHandoffAnfrage,
  jetztMs: number,
): ProduktionsMaterialHandoffPlan {
  if (anfrage.schemaVersion !== 1
      || anfrage.ziel.schemaVersion !== 1
      || anfrage.fortschritt.schemaVersion !== 1) {
    throw new Error("CAP022_HANDOFF_SCHEMA_UNGUELTIG");
  }
  ganzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_HANDOFF_ZEIT_UNGUELTIG",
  );
  ganzzahl(
    anfrage.baselineMerchantMenge,
    0,
    1_000_000,
    "CAP022_HANDOFF_BASELINE_MENGE_UNGUELTIG",
  );
  ganzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_HANDOFF_EVIDENCE_ALTER_UNGUELTIG",
  );
  text(
    anfrage.baselineMerchantInventoryFingerprint,
    "CAP022_HANDOFF_BASELINE_FP_UNGUELTIG",
  );

  validiereBindung(anfrage.ziel.farmer, "CAP022_HANDOFF_FARMER_UNGUELTIG");
  validiereBindung(anfrage.merchant, "CAP022_HANDOFF_MERCHANT_UNGUELTIG");

  if (anfrage.fortschritt.objectiveId !== anfrage.ziel.objectiveId) {
    throw new Error("CAP022_HANDOFF_OBJECTIVE_DRIFT");
  }
  if (anfrage.fortschritt.status !== "MATERIAL_READY_FOR_HANDOFF"
      || anfrage.fortschritt.restMenge !== 0
      || anfrage.fortschritt.farmStopErforderlich !== true
      || anfrage.fortschritt.handoffErforderlich !== true) {
    throw new Error("CAP022_HANDOFF_MATERIAL_NOCH_NICHT_BEREIT");
  }
  if (!evidenceFrisch(
    anfrage.fortschritt.beobachtetAmMs,
    anfrage.fortschritt.gueltigBisMs,
    jetztMs,
    anfrage.maximalesEvidenceAlterMs,
  )) {
    throw new Error("CAP022_HANDOFF_MATERIAL_EVIDENCE_STALE");
  }
  if (anfrage.fortschritt.pr20_9CraftRatificationCredit !== false
      || anfrage.fortschritt.ausfuehrungsAutoritaet !== false
      || anfrage.fortschritt.gameplayAutoritaet !== false
      || anfrage.fortschritt.rawWriteAutoritaet !== false) {
    throw new Error("CAP022_HANDOFF_FORTSCHRITT_AUTHORITY_DRIFT");
  }

  if (!gleicheBindung(anfrage.quelleEvidence.quelle, anfrage.ziel.farmer)) {
    throw new Error("CAP022_HANDOFF_QUELLE_FARMER_DRIFT");
  }
  if (!gleicheAccountServerBindung(anfrage.ziel.farmer, anfrage.merchant)
      || anfrage.ziel.farmer.characterId === anfrage.merchant.characterId) {
    throw new Error("CAP022_HANDOFF_MERCHANT_BINDUNG_DRIFT");
  }
  if (jetztMs > anfrage.ziel.gueltigBisMs) {
    throw new Error("CAP022_HANDOFF_ZIEL_STALE");
  }

  const kandidat = anfrage.quelleEvidence.posten
    .filter(posten =>
      posten.name === anfrage.ziel.name
      && posten.level === anfrage.ziel.level
      && posten.menge >= anfrage.ziel.menge)
    .slice()
    .sort((a, b) =>
      a.physischeKennung.localeCompare(b.physischeKennung))[0];

  if (kandidat === undefined) {
    throw new Error("CAP022_HANDOFF_PHYSISCHER_SINGLE_STACK_FEHLT");
  }

  const logistik = planeMerchantLogistik({
    schemaVersion: 1,
    logistikId: anfrage.ziel.objectiveId + ":collection",
    art: "COLLECTION",
    ownerCharacterId: anfrage.merchant.characterId,
    quelle: anfrage.ziel.farmer,
    empfaenger: anfrage.merchant,
    quelleEvidence: anfrage.quelleEvidence,
    zielEvidence: anfrage.merchantRendezvousEvidence,
    posten: [{
      physischeKennung: kandidat.physischeKennung,
      name: kandidat.name,
      level: kandidat.level,
      menge: anfrage.ziel.menge,
      baselineEmpfaengerMenge: anfrage.baselineMerchantMenge,
      itemFingerprint: kandidat.itemFingerprint,
    }],
    baselineEmpfaengerInventoryFingerprint:
      anfrage.baselineMerchantInventoryFingerprint,
    erstelltAmMs: anfrage.erstelltAmMs,
    gueltigBisMs: Math.min(
      anfrage.gueltigBisMs,
      anfrage.ziel.gueltigBisMs,
      anfrage.fortschritt.gueltigBisMs,
    ),
    maximalTransferDistanz: anfrage.maximalTransferDistanz,
    maximalesEvidenceAlterMs: anfrage.maximalesEvidenceAlterMs,
  }, jetztMs);

  if (logistik.ausfuehrungsAutoritaet !== false
      || logistik.gameplayAutoritaet !== false
      || logistik.rawWriteAutoritaet !== false
      || logistik.transferBindung.planningOnly !== true) {
    throw new Error("CAP022_HANDOFF_LOGISTIK_AUTHORITY_DRIFT");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "COLLECTION_PLAN_BEREIT_NO_WRITE",
    objectiveId: anfrage.ziel.objectiveId,
    logistik,
    farmStopVerified: true,
    materialReadyVerified: true,
    singlePhysicalStackPinned: true,
    pr22CoordinationRequired: true,
    pr23FarmStopEvidenceRequired: true,
    productiveTransferAuthorityRequired: true,
    settledFutureHandoffRequiresFreshCraftRescan: true,
    handoffPlanCountsAsNaturalCurrentInventoryCandidate: false,
    foundationCountsAsCraftRatification: false,
    planningOnly: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    normalRuntimeAllowed: false,
  });
}
