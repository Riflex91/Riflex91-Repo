import type {
  MerchantLogistikSicht,
  RendezvousEvidence,
} from "../merchant/logistik-workflow.js";
import {
  planeMerchantLogistik,
  type LogistikQuellenEvidence,
  type MerchantLogistikPlanungsErgebnis,
} from "../merchant/logistik-planer.js";
import type {
  ProduktionsMaterialTeamHandoffPlan,
  ProduktionsMaterialTeamHandoffTransfer,
} from "./production-material-team-handoff.js";

export interface ProduktionsMaterialTeamHandoffRecoveryResult {
  readonly schemaVersion: 1;
  readonly status:
    | "NAECHSTER_TRANSFER_BEREIT_NO_WRITE"
    | "TRANSFER_IN_FLIGHT_ODER_RECOVERY_NO_WRITE"
    | "BATCH_SETTLED_NO_WRITE"
    | "BLOCKIERT";
  readonly objectiveId: string;
  readonly settledSequences: readonly number[];
  readonly activeSequence: number | null;
  readonly activeRecoveryPending: boolean;
  readonly nextSequence: number | null;
  readonly nextTransferId: string | null;
  readonly blocker: readonly string[];
  readonly allPreviousSettled: boolean;
  readonly nextTransferPlanningAllowed: boolean;
  readonly finalCraftRescanEligible: boolean;
  readonly persistentMerchantLogisticsControllerRequired: true;
  readonly sameTransferRetryAllowed: false;
  readonly transferAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface ProduktionsMaterialTeamTransferPlanungsAnfrage {
  readonly schemaVersion: 1;
  readonly batch: ProduktionsMaterialTeamHandoffPlan;
  readonly logistikSicht: readonly MerchantLogistikSicht[];
  readonly quelleEvidence: LogistikQuellenEvidence;
  readonly merchantRendezvousEvidence: RendezvousEvidence;
  readonly baselineMerchantInventoryFingerprint: string;
  readonly baselineMerchantMenge: number;
  readonly erstelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalTransferDistanz: number;
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialTeamTransferPlanung {
  readonly schemaVersion: 1;
  readonly status: "NAECHSTER_COLLECTION_TRANSFER_PLAN_BEREIT_NO_WRITE";
  readonly objectiveId: string;
  readonly sequence: number;
  readonly transferId: string;
  readonly recovery: ProduktionsMaterialTeamHandoffRecoveryResult;
  readonly logistik: MerchantLogistikPlanungsErgebnis;
  readonly freshMerchantBaselineBound: true;
  readonly freshMerchantRendezvousBound: true;
  readonly exactSourcePinRevalidated: true;
  readonly persistentMerchantLogisticsControllerRequired: true;
  readonly previousTransfersSettled: true;
  readonly sameTransferRetryAllowed: false;
  readonly planningOnly: true;
  readonly transferAuthority: false;
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

function gleicheBindung(
  a: ProduktionsMaterialTeamHandoffTransfer["quelle"],
  b: ProduktionsMaterialTeamHandoffTransfer["quelle"],
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

function transferPasstSicht(
  transfer: ProduktionsMaterialTeamHandoffTransfer,
  sicht: MerchantLogistikSicht,
): boolean {
  const plan = sicht.plan;
  return plan.schemaVersion === 1
    && plan.logistikId === transfer.transferId
    && plan.art === "COLLECTION"
    && plan.quelleCharacterId === transfer.quelle.characterId
    && gleicheBindung(plan.empfaenger, transfer.empfaenger)
    && plan.posten.length === transfer.posten.length
    && transfer.posten.every((pin, index) => {
      const posten = plan.posten[index];
      return posten !== undefined
        && posten.physischeKennung === pin.physischeKennung
        && posten.name === pin.name
        && posten.level === pin.level
        && posten.menge === pin.menge;
    });
}

function validiereBatch(batch: ProduktionsMaterialTeamHandoffPlan): void {
  if (batch.schemaVersion !== 1
      || batch.status !== "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE"
      || batch.aggregateReadyVerified !== true
      || batch.farmStopVerified !== true
      || batch.transferSequenceFixed !== true
      || batch.parallelTransferAllowed !== false
      || batch.eachTransferMustSettleBeforeNext !== true
      || batch.freshMerchantBaselineBeforeEachTransferRequired !== true
      || batch.freshMerchantRendezvousBeforeEachTransferRequired !== true
      || batch.finalCraftRescanOnlyAfterAllSettled !== true
      || batch.sameTransferRetryAllowed !== false
      || batch.currentPr20_9RatificationCredit !== false
      || batch.productiveExecutionAllowed !== false
      || batch.transferAuthority !== false
      || batch.gameplayAuthority !== false
      || batch.rawWriteAuthority !== false
      || batch.normalRuntimeAllowed !== false) {
    throw new Error("CAP022_BATCH_RECOVERY_BATCH_UNGUELTIG");
  }
  text(batch.objectiveId, "CAP022_BATCH_RECOVERY_OBJECTIVE_UNGUELTIG");
  if (batch.transfers.length < 1 || batch.transfers.length > 8) {
    throw new Error("CAP022_BATCH_RECOVERY_TRANSFER_ANZAHL_UNGUELTIG");
  }
  for (let index = 0; index < batch.transfers.length; index += 1) {
    const transfer = batch.transfers[index];
    if (transfer === undefined
        || transfer.schemaVersion !== 1
        || transfer.sequence !== index + 1
        || transfer.objectiveId !== batch.objectiveId
        || transfer.sameProductionObjective !== true
        || transfer.planningOnly !== true
        || transfer.transferAuthority !== false
        || transfer.gameplayAuthority !== false
        || transfer.rawWriteAuthority !== false
        || transfer.previousTransferSettlementRequired !== (index > 0)) {
      throw new Error("CAP022_BATCH_RECOVERY_TRANSFER_UNGUELTIG");
    }
    text(transfer.transferId, "CAP022_BATCH_RECOVERY_TRANSFER_ID_UNGUELTIG");
    if (batch.transfers.slice(0, index).some(
      x => x.transferId === transfer.transferId,
    )) {
      throw new Error("CAP022_BATCH_RECOVERY_TRANSFER_ID_DOPPELT");
    }
  }
}

export function bewerteProductionMaterialTeamHandoffRecovery(
  batch: ProduktionsMaterialTeamHandoffPlan,
  logistikSicht: readonly MerchantLogistikSicht[],
): ProduktionsMaterialTeamHandoffRecoveryResult {
  validiereBatch(batch);
  if (logistikSicht.length > 512) {
    throw new Error("CAP022_BATCH_RECOVERY_LOGISTIK_SICHT_ZU_GROSS");
  }

  const ids = new Set(batch.transfers.map(x => x.transferId));
  const relevant = logistikSicht.filter(x => ids.has(x.plan.logistikId));
  for (let index = 0; index < relevant.length; index += 1) {
    const sicht = relevant[index];
    if (sicht === undefined) {
      throw new Error("CAP022_BATCH_RECOVERY_SICHT_FEHLT");
    }
    if (relevant.slice(0, index).some(
      x => x.plan.logistikId === sicht.plan.logistikId,
    )) {
      throw new Error("CAP022_BATCH_RECOVERY_SICHT_DOPPELT");
    }
    const transfer = batch.transfers.find(
      x => x.transferId === sicht.plan.logistikId,
    );
    if (transfer === undefined || !transferPasstSicht(transfer, sicht)) {
      throw new Error("CAP022_BATCH_RECOVERY_LOGISTIK_PLAN_DRIFT");
    }
  }

  const blocker: string[] = [];
  const settledSequences: number[] = [];
  let activeSequence: number | null = null;
  let activeRecoveryPending = false;
  let nextSequence: number | null = null;

  for (let index = 0; index < batch.transfers.length; index += 1) {
    const transfer = batch.transfers[index];
    if (transfer === undefined) {
      throw new Error("CAP022_BATCH_RECOVERY_TRANSFER_FEHLT");
    }
    const sicht = relevant.find(
      x => x.plan.logistikId === transfer.transferId,
    );
    const spaetereVorhanden = batch.transfers
      .slice(index + 1)
      .some(spaeter => relevant.some(
        x => x.plan.logistikId === spaeter.transferId,
      ));

    if (sicht === undefined) {
      if (spaetereVorhanden) {
        blocker.push(
          "CAP022_BATCH_RECOVERY_SPAETERER_TRANSFER_VOR_VORHERIGEM:"
          + transfer.transferId,
        );
      } else {
        nextSequence = transfer.sequence;
      }
      break;
    }

    if (sicht.zustand === "SETTLED") {
      settledSequences.push(transfer.sequence);
      continue;
    }

    if (sicht.zustand === "FAILED_SAFE") {
      blocker.push(
        "CAP022_BATCH_RECOVERY_TRANSFER_FAILED_SAFE:"
        + transfer.transferId,
      );
      break;
    }

    activeSequence = transfer.sequence;
    activeRecoveryPending = sicht.zustand === "RECOVERY_PENDING";
    if (spaetereVorhanden) {
      blocker.push(
        "CAP022_BATCH_RECOVERY_PARALLELER_ODER_SPAETERER_TRANSFER:"
        + transfer.transferId,
      );
    }
    break;
  }

  const allPreviousSettled = blocker.length === 0
    && (nextSequence === null
      || settledSequences.length === nextSequence - 1);
  const allSettled = blocker.length === 0
    && settledSequences.length === batch.transfers.length
    && activeSequence === null
    && nextSequence === null;

  const status = blocker.length > 0
    ? "BLOCKIERT"
    : allSettled
      ? "BATCH_SETTLED_NO_WRITE"
      : activeSequence !== null
        ? "TRANSFER_IN_FLIGHT_ODER_RECOVERY_NO_WRITE"
        : "NAECHSTER_TRANSFER_BEREIT_NO_WRITE";

  const nextTransfer = nextSequence === null
    ? null
    : batch.transfers.find(x => x.sequence === nextSequence) ?? null;

  return Object.freeze({
    schemaVersion: 1,
    status,
    objectiveId: batch.objectiveId,
    settledSequences: Object.freeze(settledSequences),
    activeSequence,
    activeRecoveryPending,
    nextSequence,
    nextTransferId: nextTransfer?.transferId ?? null,
    blocker: Object.freeze(blocker),
    allPreviousSettled,
    nextTransferPlanningAllowed:
      status === "NAECHSTER_TRANSFER_BEREIT_NO_WRITE"
      && nextSequence !== null
      && allPreviousSettled,
    finalCraftRescanEligible: status === "BATCH_SETTLED_NO_WRITE",
    persistentMerchantLogisticsControllerRequired: true,
    sameTransferRetryAllowed: false,
    transferAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

export function planeNaechstenProductionMaterialTeamTransfer(
  anfrage: ProduktionsMaterialTeamTransferPlanungsAnfrage,
  jetztMs: number,
): ProduktionsMaterialTeamTransferPlanung {
  if (anfrage.schemaVersion !== 1) {
    throw new Error("CAP022_BATCH_TRANSFER_SCHEMA_UNGUELTIG");
  }
  ganzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_BATCH_TRANSFER_ZEIT_UNGUELTIG",
  );
  ganzzahl(
    anfrage.baselineMerchantMenge,
    0,
    1_000_000,
    "CAP022_BATCH_TRANSFER_BASELINE_MENGE_UNGUELTIG",
  );
  text(
    anfrage.baselineMerchantInventoryFingerprint,
    "CAP022_BATCH_TRANSFER_BASELINE_FP_UNGUELTIG",
  );

  const recovery = bewerteProductionMaterialTeamHandoffRecovery(
    anfrage.batch,
    anfrage.logistikSicht,
  );
  if (!recovery.nextTransferPlanningAllowed
      || recovery.nextSequence === null
      || recovery.nextTransferId === null) {
    throw new Error("CAP022_BATCH_TRANSFER_NAECHSTER_NICHT_BEREIT");
  }

  const transfer = anfrage.batch.transfers.find(
    x => x.sequence === recovery.nextSequence,
  );
  if (transfer === undefined
      || transfer.transferId !== recovery.nextTransferId) {
    throw new Error("CAP022_BATCH_TRANSFER_SEQUENCE_DRIFT");
  }

  const quelle = anfrage.quelleEvidence;
  if (quelle.schemaVersion !== 1
      || !gleicheBindung(quelle.quelle, transfer.quelle)
      || quelle.freshnessFingerprint !== transfer.sourceFreshnessFingerprint
      || quelle.inventoryFingerprint !== transfer.sourceInventoryFingerprint) {
    throw new Error("CAP022_BATCH_TRANSFER_QUELLE_DRIFT");
  }
  for (const pin of transfer.posten) {
    const aktuell = quelle.posten.find(
      x => x.physischeKennung === pin.physischeKennung,
    );
    if (aktuell === undefined
        || aktuell.name !== pin.name
        || aktuell.level !== pin.level
        || aktuell.menge < pin.menge
        || aktuell.itemFingerprint !== pin.itemFingerprint) {
      throw new Error(
        "CAP022_BATCH_TRANSFER_PHYSISCHER_PIN_DRIFT:"
        + pin.physischeKennung,
      );
    }
  }

  const logistik = planeMerchantLogistik({
    schemaVersion: 1,
    logistikId: transfer.transferId,
    art: "COLLECTION",
    ownerCharacterId: transfer.empfaenger.characterId,
    quelle: transfer.quelle,
    empfaenger: transfer.empfaenger,
    quelleEvidence: quelle,
    zielEvidence: anfrage.merchantRendezvousEvidence,
    posten: transfer.posten.map(pin => ({
      physischeKennung: pin.physischeKennung,
      name: pin.name,
      level: pin.level,
      menge: pin.menge,
      baselineEmpfaengerMenge: anfrage.baselineMerchantMenge,
      itemFingerprint: pin.itemFingerprint,
    })),
    baselineEmpfaengerInventoryFingerprint:
      anfrage.baselineMerchantInventoryFingerprint,
    erstelltAmMs: anfrage.erstelltAmMs,
    gueltigBisMs: anfrage.gueltigBisMs,
    maximalTransferDistanz: anfrage.maximalTransferDistanz,
    maximalesEvidenceAlterMs: anfrage.maximalesEvidenceAlterMs,
  }, jetztMs);

  if (logistik.ausfuehrungsAutoritaet !== false
      || logistik.gameplayAutoritaet !== false
      || logistik.rawWriteAutoritaet !== false
      || logistik.transferBindung.planningOnly !== true) {
    throw new Error("CAP022_BATCH_TRANSFER_LOGISTIK_AUTHORITY_DRIFT");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "NAECHSTER_COLLECTION_TRANSFER_PLAN_BEREIT_NO_WRITE",
    objectiveId: anfrage.batch.objectiveId,
    sequence: transfer.sequence,
    transferId: transfer.transferId,
    recovery,
    logistik,
    freshMerchantBaselineBound: true,
    freshMerchantRendezvousBound: true,
    exactSourcePinRevalidated: true,
    persistentMerchantLogisticsControllerRequired: true,
    previousTransfersSettled: true,
    sameTransferRetryAllowed: false,
    planningOnly: true,
    transferAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
