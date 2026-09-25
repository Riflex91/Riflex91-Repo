import {
  pruefePr20_9CraftReadOnlyPreflight,
  type Pr20_9CraftReadOnlyPreflightRequest,
  type Pr20_9CraftReadOnlyPreflightResult,
} from "../produktion/pr20-9-craft-read-only-preflight.js";
import type { ProduktionsMaterialTeamHandoffPlan } from "./production-material-team-handoff.js";
import type { ProduktionsMaterialTeamBatchSicht } from "./production-material-team-settlement-recovery.js";

export interface ProduktionsMaterialTeamCraftRescanAnfrage {
  readonly schemaVersion: 1;
  readonly handoff: ProduktionsMaterialTeamHandoffPlan;
  readonly batch: ProduktionsMaterialTeamBatchSicht;
  readonly merchantInventoryFingerprint: string;
  readonly merchantInventoryBeobachtetAmMs: number;
  readonly merchantInventoryGueltigBisMs: number;
  readonly craftPreflight: Pr20_9CraftReadOnlyPreflightRequest;
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialTeamCraftRescanErgebnis {
  readonly schemaVersion: 1;
  readonly status:
    | "TEAM_CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE"
    | "TEAM_CRAFT_RESCAN_BLOCKIERT";
  readonly blocker: readonly string[];
  readonly objectiveId: string;
  readonly batchId: string;
  readonly finalSettlementFingerprint: string;
  readonly merchantInventoryFingerprint: string;
  readonly allSettledVerified: true;
  readonly allTransferIdsSettledInOrder: true;
  readonly noActiveTransferVerified: true;
  readonly finalMerchantBaselineVerified: true;
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

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function pruefeGanzzahl(
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

function batchPasstHandoff(
  handoff: ProduktionsMaterialTeamHandoffPlan,
  batch: ProduktionsMaterialTeamBatchSicht,
): boolean {
  return batch.schemaVersion === 1
    && batch.objectiveId === handoff.objectiveId
    && batch.batchId === handoff.objectiveId + ":collection-batch"
    && batch.transferIds.length === handoff.transfers.length
    && batch.transferIds.every(
      (id, index) => id === handoff.transfers[index]?.transferId,
    );
}

function transferKetteVollstaendig(
  handoff: ProduktionsMaterialTeamHandoffPlan,
  batch: ProduktionsMaterialTeamBatchSicht,
): boolean {
  return batch.settledTransferIds.length === handoff.transfers.length
    && batch.settledTransferIds.every(
      (id, index) => id === handoff.transfers[index]?.transferId,
    )
    && batch.nextSequence === handoff.transfers.length + 1;
}

export function pruefeProductionMaterialTeamCraftRescan(
  anfrage: ProduktionsMaterialTeamCraftRescanAnfrage,
  jetztMs: number,
): ProduktionsMaterialTeamCraftRescanErgebnis {
  if (anfrage.schemaVersion !== 1
      || anfrage.handoff.schemaVersion !== 1
      || anfrage.batch.schemaVersion !== 1
      || anfrage.craftPreflight.schemaVersion !== 1) {
    throw new Error("CAP022_TEAM_CRAFT_RESCAN_SCHEMA_UNGUELTIG");
  }
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_TEAM_CRAFT_RESCAN_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_TEAM_CRAFT_RESCAN_EVIDENCE_ALTER_UNGUELTIG",
  );
  for (const wert of [
    anfrage.handoff.objectiveId,
    anfrage.batch.batchId,
    anfrage.merchantInventoryFingerprint,
  ]) pruefeText(wert, "CAP022_TEAM_CRAFT_RESCAN_TEXT_UNGUELTIG");

  const handoff = anfrage.handoff;
  if (handoff.status !== "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE"
      || handoff.aggregateReadyVerified !== true
      || handoff.farmStopVerified !== true
      || handoff.parallelTransferAllowed !== false
      || handoff.eachTransferMustSettleBeforeNext !== true
      || handoff.finalCraftRescanOnlyAfterAllSettled !== true
      || handoff.sameTransferRetryAllowed !== false
      || handoff.currentPr20_9RatificationCredit !== false
      || handoff.productiveExecutionAllowed !== false
      || handoff.transferAuthority !== false
      || handoff.gameplayAuthority !== false
      || handoff.rawWriteAuthority !== false
      || handoff.normalRuntimeAllowed !== false
      || handoff.transfers.length < 1
      || handoff.pinnedQuantity !== handoff.requiredQuantity) {
    throw new Error("CAP022_TEAM_CRAFT_RESCAN_HANDOFF_UNGUELTIG");
  }

  const batch = anfrage.batch;
  if (!batchPasstHandoff(handoff, batch)) {
    throw new Error("CAP022_TEAM_CRAFT_RESCAN_BATCH_IDENTITAET_DRIFT");
  }
  if (batch.zustand !== "ALLE_SETTLED"
      || batch.recoveryVorZustand !== null
      || batch.activeTransferId !== null
      || batch.finalCraftRescanAllowed !== true
      || batch.sameTransferRetryAllowed !== false
      || batch.exactlyOneActiveTransfer !== true
      || batch.parallelTransferAllowed !== false
      || batch.productiveExecutionAllowed !== false
      || batch.transferAuthority !== false
      || batch.gameplayAuthority !== false
      || batch.rawWriteAuthority !== false
      || batch.normalRuntimeAllowed !== false) {
    throw new Error("CAP022_TEAM_CRAFT_RESCAN_BATCH_NICHT_ALL_SETTLED");
  }
  if (!transferKetteVollstaendig(handoff, batch)) {
    throw new Error("CAP022_TEAM_CRAFT_RESCAN_SETTLEMENT_KETTE_UNVOLLSTAENDIG");
  }
  if (batch.letzteSettlementFingerprint === null) {
    throw new Error("CAP022_TEAM_CRAFT_RESCAN_FINAL_SETTLEMENT_FP_FEHLT");
  }
  pruefeText(
    batch.letzteSettlementFingerprint,
    "CAP022_TEAM_CRAFT_RESCAN_FINAL_SETTLEMENT_FP_UNGUELTIG",
  );
  pruefeText(
    batch.merchantInventoryFingerprint,
    "CAP022_TEAM_CRAFT_RESCAN_BATCH_INVENTAR_FP_UNGUELTIG",
  );
  pruefeGanzzahl(
    batch.merchantMenge,
    0,
    32_000_000,
    "CAP022_TEAM_CRAFT_RESCAN_BATCH_MENGE_UNGUELTIG",
  );

  if (anfrage.merchantInventoryFingerprint
        !== batch.merchantInventoryFingerprint
      || anfrage.merchantInventoryBeobachtetAmMs < batch.aktualisiertAmMs
      || !frisch(
        anfrage.merchantInventoryBeobachtetAmMs,
        anfrage.merchantInventoryGueltigBisMs,
        jetztMs,
        anfrage.maximalesEvidenceAlterMs,
      )) {
    throw new Error(
      "CAP022_TEAM_CRAFT_RESCAN_POST_SETTLEMENT_INVENTAR_STALE_ODER_DRIFT",
    );
  }

  const recipeInput = anfrage.craftPreflight.recipe.inputs.find(input =>
    input.name === handoff.name
    && input.level === handoff.level
    && input.menge <= handoff.requiredQuantity);
  if (recipeInput === undefined) {
    throw new Error(
      "CAP022_TEAM_CRAFT_RESCAN_BATCH_MATERIAL_NICHT_RECIPE_INPUT",
    );
  }
  if (batch.merchantMenge < recipeInput.menge) {
    throw new Error(
      "CAP022_TEAM_CRAFT_RESCAN_MERCHANT_MENGE_UNTER_RECIPE_INPUT",
    );
  }

  const preflight = pruefePr20_9CraftReadOnlyPreflight(
    anfrage.craftPreflight,
    jetztMs,
  );

  return Object.freeze({
    schemaVersion: 1,
    status: preflight.status === "BEREIT_NO_WRITE"
      ? "TEAM_CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE"
      : "TEAM_CRAFT_RESCAN_BLOCKIERT",
    blocker: Object.freeze([...preflight.blocker]),
    objectiveId: handoff.objectiveId,
    batchId: batch.batchId,
    finalSettlementFingerprint: batch.letzteSettlementFingerprint,
    merchantInventoryFingerprint: anfrage.merchantInventoryFingerprint,
    allSettledVerified: true,
    allTransferIdsSettledInOrder: true,
    noActiveTransferVerified: true,
    finalMerchantBaselineVerified: true,
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
