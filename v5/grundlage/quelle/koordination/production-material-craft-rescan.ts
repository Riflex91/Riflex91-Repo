import type { MerchantLogistikSicht, TransferSettlementEvidence } from "../merchant/logistik-workflow.js";
import type { ProduktionsMaterialHandoffPlan } from "./production-material-handoff.js";
import {
  pruefePr20_9CraftReadOnlyPreflight,
  type Pr20_9CraftReadOnlyPreflightRequest,
  type Pr20_9CraftReadOnlyPreflightResult,
} from "../produktion/pr20-9-craft-read-only-preflight.js";

export interface ProduktionsMaterialCraftRescanAnfrage {
  readonly schemaVersion: 1;
  readonly handoff: ProduktionsMaterialHandoffPlan;
  readonly settledSicht: MerchantLogistikSicht;
  readonly settlementEvidence: TransferSettlementEvidence;
  readonly merchantInventoryFingerprint: string;
  readonly merchantInventoryBeobachtetAmMs: number;
  readonly merchantInventoryGueltigBisMs: number;
  readonly craftPreflight: Pr20_9CraftReadOnlyPreflightRequest;
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialCraftRescanErgebnis {
  readonly schemaVersion: 1;
  readonly status:
    | "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE"
    | "CRAFT_RESCAN_BLOCKIERT";
  readonly blocker: readonly string[];
  readonly objectiveId: string;
  readonly logistikId: string;
  readonly settlementFingerprint: string;
  readonly merchantInventoryFingerprint: string;
  readonly settledHandoffVerified: true;
  readonly postSettlementInventoryVerified: true;
  readonly handedMaterialMatchesRecipeInput: true;
  readonly preflight: Pr20_9CraftReadOnlyPreflightResult;
  readonly candidateObserved: boolean;
  readonly rescanTriggerEligible: true;
  readonly currentPr20_9RatificationCredit: false;
  readonly foundationCountsAsCraftRatification: false;
  readonly productiveCraftAuthorityOpened: false;
  readonly broadGraphExecutionAuthority: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly craftAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
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

function frisch(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  maximalesEvidenceAlterMs: number,
): boolean {
  return Number.isSafeInteger(beobachtetAmMs)
    && Number.isSafeInteger(gueltigBisMs)
    && beobachtetAmMs >= 0
    && gueltigBisMs >= beobachtetAmMs
    && jetztMs >= beobachtetAmMs
    && jetztMs <= gueltigBisMs
    && jetztMs - beobachtetAmMs <= maximalesEvidenceAlterMs;
}

function gleichePlanBindung(
  handoff: ProduktionsMaterialHandoffPlan,
  sicht: MerchantLogistikSicht,
): boolean {
  const geplant = handoff.logistik.plan;
  const aktuell = sicht.plan;
  return aktuell.schemaVersion === 1
    && geplant.schemaVersion === 1
    && aktuell.logistikId === geplant.logistikId
    && aktuell.art === "COLLECTION"
    && geplant.art === "COLLECTION"
    && aktuell.ownerCharacterId === geplant.ownerCharacterId
    && aktuell.quelleCharacterId === geplant.quelleCharacterId
    && aktuell.empfaenger.accountId === geplant.empfaenger.accountId
    && aktuell.empfaenger.characterId === geplant.empfaenger.characterId
    && aktuell.empfaenger.sessionId === geplant.empfaenger.sessionId
    && aktuell.empfaenger.serverRegion === geplant.empfaenger.serverRegion
    && aktuell.empfaenger.serverIdentifier === geplant.empfaenger.serverIdentifier
    && aktuell.empfaenger.rosterEpoche === geplant.empfaenger.rosterEpoche
    && aktuell.empfaenger.rosterFingerprint === geplant.empfaenger.rosterFingerprint
    && aktuell.baselineEmpfaengerInventoryFingerprint
      === geplant.baselineEmpfaengerInventoryFingerprint
    && aktuell.posten.length === geplant.posten.length
    && aktuell.posten.every((posten, index) => {
      const erwartet = geplant.posten[index];
      return erwartet !== undefined
        && posten.physischeKennung === erwartet.physischeKennung
        && posten.name === erwartet.name
        && posten.level === erwartet.level
        && posten.menge === erwartet.menge
        && posten.baselineEmpfaengerMenge === erwartet.baselineEmpfaengerMenge;
    });
}

function settlementPasstHandoff(
  handoff: ProduktionsMaterialHandoffPlan,
  evidence: TransferSettlementEvidence,
): boolean {
  const plan = handoff.logistik.plan;
  if (evidence.schemaVersion !== 1
      || evidence.characterId !== plan.empfaenger.characterId
      || evidence.sessionId !== plan.empfaenger.sessionId
      || evidence.serverRegion !== plan.empfaenger.serverRegion
      || evidence.serverIdentifier !== plan.empfaenger.serverIdentifier
      || evidence.rosterEpoche !== plan.empfaenger.rosterEpoche
      || evidence.baselineInventoryFingerprint
        !== plan.baselineEmpfaengerInventoryFingerprint
      || evidence.inventoryFingerprint === evidence.baselineInventoryFingerprint) {
    return false;
  }

  return plan.posten.every(posten => {
    const beobachtet = evidence.mengen
      .filter(x => x.name === posten.name && x.level === posten.level)
      .reduce((summe, x) => summe + x.menge, 0);
    return beobachtet - posten.baselineEmpfaengerMenge >= posten.menge;
  });
}

export function pruefeProductionMaterialCraftRescan(
  anfrage: ProduktionsMaterialCraftRescanAnfrage,
  jetztMs: number,
): ProduktionsMaterialCraftRescanErgebnis {
  if (anfrage.schemaVersion !== 1
      || anfrage.handoff.schemaVersion !== 1
      || anfrage.settledSicht.plan.schemaVersion !== 1
      || anfrage.settlementEvidence.schemaVersion !== 1
      || anfrage.craftPreflight.schemaVersion !== 1) {
    throw new Error("CAP022_CRAFT_RESCAN_SCHEMA_UNGUELTIG");
  }
  ganzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_CRAFT_RESCAN_ZEIT_UNGUELTIG",
  );
  ganzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_CRAFT_RESCAN_EVIDENCE_ALTER_UNGUELTIG",
  );
  for (const wert of [
    anfrage.handoff.objectiveId,
    anfrage.settledSicht.plan.logistikId,
    anfrage.settlementEvidence.settlementFingerprint,
    anfrage.settlementEvidence.inventoryFingerprint,
    anfrage.merchantInventoryFingerprint,
  ]) text(wert, "CAP022_CRAFT_RESCAN_TEXT_UNGUELTIG");

  if (anfrage.handoff.status !== "COLLECTION_PLAN_BEREIT_NO_WRITE"
      || anfrage.handoff.planningOnly !== true
      || anfrage.handoff.ausfuehrungsAutoritaet !== false
      || anfrage.handoff.gameplayAutoritaet !== false
      || anfrage.handoff.rawWriteAutoritaet !== false
      || anfrage.handoff.normalRuntimeAllowed !== false
      || anfrage.handoff.foundationCountsAsCraftRatification !== false
      || anfrage.handoff.handoffPlanCountsAsNaturalCurrentInventoryCandidate
        !== false) {
    throw new Error("CAP022_CRAFT_RESCAN_HANDOFF_AUTHORITY_DRIFT");
  }

  if (!gleichePlanBindung(anfrage.handoff, anfrage.settledSicht)) {
    throw new Error("CAP022_CRAFT_RESCAN_LOGISTIK_PLAN_DRIFT");
  }
  if (anfrage.settledSicht.zustand !== "SETTLED"
      || anfrage.settledSicht.recoveryVorZustand !== null
      || anfrage.settledSicht.sameTransferErneutSenden !== false
      || anfrage.settledSicht.letzteEvidenceFingerprint
        !== anfrage.settlementEvidence.settlementFingerprint) {
    throw new Error("CAP022_CRAFT_RESCAN_HANDOFF_NICHT_SETTLED");
  }

  if (!settlementPasstHandoff(anfrage.handoff, anfrage.settlementEvidence)) {
    throw new Error("CAP022_CRAFT_RESCAN_SETTLEMENT_DRIFT");
  }
  if (!frisch(
    anfrage.settlementEvidence.beobachtetAmMs,
    anfrage.handoff.logistik.plan.gueltigBisMs,
    jetztMs,
    anfrage.maximalesEvidenceAlterMs,
  )) {
    throw new Error("CAP022_CRAFT_RESCAN_SETTLEMENT_STALE");
  }

  if (anfrage.merchantInventoryFingerprint
        !== anfrage.settlementEvidence.inventoryFingerprint
      || anfrage.merchantInventoryBeobachtetAmMs
        < anfrage.settlementEvidence.beobachtetAmMs
      || !frisch(
        anfrage.merchantInventoryBeobachtetAmMs,
        anfrage.merchantInventoryGueltigBisMs,
        jetztMs,
        anfrage.maximalesEvidenceAlterMs,
      )) {
    throw new Error("CAP022_CRAFT_RESCAN_POST_SETTLEMENT_INVENTAR_STALE_ODER_DRIFT");
  }

  const handedPosten = anfrage.handoff.logistik.plan.posten;
  const handedMaterialMatchesRecipeInput = handedPosten.some(posten =>
    anfrage.craftPreflight.recipe.inputs.some(input =>
      input.name === posten.name
      && input.level === posten.level
      && input.menge <= posten.menge));
  if (!handedMaterialMatchesRecipeInput) {
    throw new Error("CAP022_CRAFT_RESCAN_HANDOFF_MATERIAL_NICHT_RECIPE_INPUT");
  }

  const preflight = pruefePr20_9CraftReadOnlyPreflight(
    anfrage.craftPreflight,
    jetztMs,
  );

  return Object.freeze({
    schemaVersion: 1,
    status: preflight.status === "BEREIT_NO_WRITE"
      ? "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE"
      : "CRAFT_RESCAN_BLOCKIERT",
    blocker: Object.freeze([...preflight.blocker]),
    objectiveId: anfrage.handoff.objectiveId,
    logistikId: anfrage.settledSicht.plan.logistikId,
    settlementFingerprint: anfrage.settlementEvidence.settlementFingerprint,
    merchantInventoryFingerprint: anfrage.merchantInventoryFingerprint,
    settledHandoffVerified: true,
    postSettlementInventoryVerified: true,
    handedMaterialMatchesRecipeInput: true,
    preflight,
    candidateObserved: preflight.status === "BEREIT_NO_WRITE",
    rescanTriggerEligible: true,
    currentPr20_9RatificationCredit: false,
    foundationCountsAsCraftRatification: false,
    productiveCraftAuthorityOpened: false,
    broadGraphExecutionAuthority: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    craftAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
