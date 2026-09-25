import type { SpeicherPort } from "../persistenz/speicher-port.js";
import {
  planeMerchantLogistik,
  type LogistikQuellenEvidence,
  type MerchantLogistikPlanungsErgebnis,
} from "../merchant/logistik-planer.js";
import type {
  MerchantLogistikSicht,
  RendezvousEvidence,
  TransferSettlementEvidence,
} from "../merchant/logistik-workflow.js";
import type {
  ProduktionsMaterialTeamHandoffPlan,
  ProduktionsMaterialTeamHandoffTransfer,
} from "./production-material-team-handoff.js";

export type ProduktionsMaterialTeamBatchZustand =
  | "BATCH_BEREIT"
  | "TRANSFER_AKTIV"
  | "RECOVERY_PENDING"
  | "ALLE_SETTLED"
  | "FAILED_SAFE";

export type ProduktionsMaterialTeamBatchRecoveryVorZustand =
  | "BATCH_BEREIT"
  | "TRANSFER_AKTIV";

export interface ProduktionsMaterialTeamBatchSicht {
  readonly schemaVersion: 1;
  readonly batchId: string;
  readonly objectiveId: string;
  readonly transferIds: readonly string[];
  readonly zustand: ProduktionsMaterialTeamBatchZustand;
  readonly recoveryVorZustand:
    | ProduktionsMaterialTeamBatchRecoveryVorZustand
    | null;
  readonly nextSequence: number;
  readonly activeTransferId: string | null;
  readonly settledTransferIds: readonly string[];
  readonly merchantInventoryFingerprint: string;
  readonly merchantMenge: number;
  readonly letzteSettlementFingerprint: string | null;
  readonly aktualisiertAmMs: number;
  readonly sameTransferRetryAllowed: false;
  readonly exactlyOneActiveTransfer: true;
  readonly parallelTransferAllowed: false;
  readonly finalCraftRescanAllowed: boolean;
  readonly productiveExecutionAllowed: false;
  readonly transferAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface ProduktionsMaterialTeamBatchLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly recoveryPending: boolean;
  readonly terminal: boolean;
  readonly finalCraftRescanAllowed: boolean;
  readonly productiveExecutionAllowed: false;
  readonly transferAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface ProduktionsMaterialTeamBatchTransferPlanung {
  readonly schemaVersion: 1;
  readonly batch: ProduktionsMaterialTeamBatchSicht;
  readonly transfer: ProduktionsMaterialTeamHandoffTransfer;
  readonly logistik: MerchantLogistikPlanungsErgebnis;
  readonly freshMerchantBaselineUsed: true;
  readonly freshMerchantRendezvousUsed: true;
  readonly previousTransferSettlementVerified: boolean;
  readonly sameTransferRetryAllowed: false;
  readonly productiveExecutionAllowed: false;
  readonly transferAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

interface PersistierterSnapshot {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly sicht: ProduktionsMaterialTeamBatchSicht;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function pruefeMenge(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0 || wert > 32_000_000) {
    throw new Error(fehler);
  }
}

function bindungPasst(
  transfer: ProduktionsMaterialTeamHandoffTransfer,
  evidence: LogistikQuellenEvidence,
): boolean {
  const a = transfer.quelle;
  const b = evidence.quelle;
  return b.schemaVersion === 1
    && a.accountId === b.accountId
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

function zielPasstSettlement(
  transfer: ProduktionsMaterialTeamHandoffTransfer,
  evidence: TransferSettlementEvidence,
): boolean {
  const ziel = transfer.empfaenger;
  return evidence.characterId === ziel.characterId
    && evidence.sessionId === ziel.sessionId
    && evidence.serverRegion === ziel.serverRegion
    && evidence.serverIdentifier === ziel.serverIdentifier
    && evidence.rosterEpoche === ziel.rosterEpoche;
}

function beobachteteMenge(
  evidence: TransferSettlementEvidence,
  name: string,
  level: number,
): number {
  return evidence.mengen
    .filter(x => x.name === name && x.level === level)
    .reduce((summe, x) => summe + x.menge, 0);
}

function validiereBatch(
  batch: ProduktionsMaterialTeamHandoffPlan,
): void {
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
      || batch.normalRuntimeAllowed !== false
      || batch.transfers.length < 1
      || batch.transfers.length > 8
      || batch.pinnedQuantity !== batch.requiredQuantity) {
    throw new Error("CAP022_TEAM_BATCH_UNGUELTIG");
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
        || transfer.previousTransferSettlementRequired !== (index > 0)
        || transfer.gesamtMenge < 1) {
      throw new Error("CAP022_TEAM_BATCH_TRANSFER_UNGUELTIG");
    }
    pruefeText(
      transfer.transferId,
      "CAP022_TEAM_BATCH_TRANSFER_ID_UNGUELTIG",
    );
    if (batch.transfers.slice(0, index).some(
      x => x.transferId === transfer.transferId,
    )) {
      throw new Error("CAP022_TEAM_BATCH_TRANSFER_ID_DOPPELT");
    }
  }
}

function batchPasstSicht(
  batch: ProduktionsMaterialTeamHandoffPlan,
  sicht: ProduktionsMaterialTeamBatchSicht,
): boolean {
  return sicht.objectiveId === batch.objectiveId
    && sicht.batchId === batch.objectiveId + ":collection-batch"
    && sicht.transferIds.length === batch.transfers.length
    && sicht.transferIds.every(
      (id, index) => id === batch.transfers[index]?.transferId,
    );
}

function validiereQuellenEvidence(
  transfer: ProduktionsMaterialTeamHandoffTransfer,
  evidence: LogistikQuellenEvidence,
): void {
  if (evidence.schemaVersion !== 1
      || !bindungPasst(transfer, evidence)
      || evidence.freshnessFingerprint !== transfer.sourceFreshnessFingerprint
      || evidence.inventoryFingerprint !== transfer.sourceInventoryFingerprint) {
    throw new Error("CAP022_TEAM_BATCH_SOURCE_DRIFT");
  }
  for (const pin of transfer.posten) {
    const item = evidence.posten.find(
      x => x.physischeKennung === pin.physischeKennung,
    );
    if (item === undefined
        || item.name !== pin.name
        || item.level !== pin.level
        || item.menge < pin.menge
        || item.itemFingerprint !== pin.itemFingerprint) {
      throw new Error(
        "CAP022_TEAM_BATCH_SOURCE_PIN_DRIFT:" + pin.physischeKennung,
      );
    }
  }
}

function validiereSettlement(
  transfer: ProduktionsMaterialTeamHandoffTransfer,
  baselineFingerprint: string,
  baselineMenge: number,
  sicht: MerchantLogistikSicht,
  evidence: TransferSettlementEvidence,
): void {
  if (sicht.zustand !== "SETTLED"
      || sicht.plan.logistikId !== transfer.transferId
      || sicht.plan.art !== "COLLECTION"
      || sicht.plan.quelleCharacterId !== transfer.quelle.characterId
      || sicht.plan.baselineEmpfaengerInventoryFingerprint
        !== baselineFingerprint
      || sicht.sameTransferErneutSenden !== false
      || sicht.letzteEvidenceFingerprint !== evidence.settlementFingerprint
      || evidence.schemaVersion !== 1
      || !zielPasstSettlement(transfer, evidence)
      || evidence.baselineInventoryFingerprint !== baselineFingerprint
      || evidence.inventoryFingerprint === baselineFingerprint) {
    throw new Error("CAP022_TEAM_BATCH_SETTLEMENT_DRIFT");
  }
  const name = transfer.posten[0]?.name;
  const level = transfer.posten[0]?.level;
  if (name === undefined || level === undefined
      || transfer.posten.some(x => x.name !== name || x.level !== level)) {
    throw new Error("CAP022_TEAM_BATCH_TRANSFER_MATERIAL_DRIFT");
  }
  const beobachtet = beobachteteMenge(evidence, name, level);
  if (beobachtet - baselineMenge < transfer.gesamtMenge) {
    throw new Error("CAP022_TEAM_BATCH_SETTLEMENT_MENGE_FEHLT");
  }
}

function friere(
  sicht: ProduktionsMaterialTeamBatchSicht,
): ProduktionsMaterialTeamBatchSicht {
  return Object.freeze({
    ...sicht,
    transferIds: Object.freeze([...sicht.transferIds]),
    settledTransferIds: Object.freeze([...sicht.settledTransferIds]),
  });
}

function parseSnapshot(text: string): PersistierterSnapshot {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_UNGUELTIG");
  }
  if (typeof roh !== "object" || roh === null || Array.isArray(roh)) {
    throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_UNGUELTIG");
  }
  const obj = roh as Record<string, unknown>;
  if (obj["schemaVersion"] !== 1
      || typeof obj["gespeichertAmMs"] !== "number"
      || !Number.isSafeInteger(obj["gespeichertAmMs"])
      || obj["gespeichertAmMs"] < 0
      || typeof obj["sicht"] !== "object"
      || obj["sicht"] === null
      || Array.isArray(obj["sicht"])) {
    throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_UNGUELTIG");
  }
  const sicht = obj["sicht"] as Record<string, unknown>;
  const zustaende: readonly ProduktionsMaterialTeamBatchZustand[] = [
    "BATCH_BEREIT",
    "TRANSFER_AKTIV",
    "RECOVERY_PENDING",
    "ALLE_SETTLED",
    "FAILED_SAFE",
  ];
  const recovery: readonly ProduktionsMaterialTeamBatchRecoveryVorZustand[] = [
    "BATCH_BEREIT",
    "TRANSFER_AKTIV",
  ];
  if (sicht["schemaVersion"] !== 1
      || typeof sicht["batchId"] !== "string"
      || typeof sicht["objectiveId"] !== "string"
      || !Array.isArray(sicht["transferIds"])
      || !sicht["transferIds"].every(x => typeof x === "string")
      || typeof sicht["zustand"] !== "string"
      || !zustaende.includes(
        sicht["zustand"] as ProduktionsMaterialTeamBatchZustand,
      )
      || (sicht["recoveryVorZustand"] !== null
        && (typeof sicht["recoveryVorZustand"] !== "string"
          || !recovery.includes(
            sicht["recoveryVorZustand"]
              as ProduktionsMaterialTeamBatchRecoveryVorZustand,
          )))
      || typeof sicht["nextSequence"] !== "number"
      || !Number.isSafeInteger(sicht["nextSequence"])
      || (sicht["activeTransferId"] !== null
        && typeof sicht["activeTransferId"] !== "string")
      || !Array.isArray(sicht["settledTransferIds"])
      || !sicht["settledTransferIds"].every(x => typeof x === "string")
      || typeof sicht["merchantInventoryFingerprint"] !== "string"
      || typeof sicht["merchantMenge"] !== "number"
      || !Number.isSafeInteger(sicht["merchantMenge"])
      || (sicht["letzteSettlementFingerprint"] !== null
        && typeof sicht["letzteSettlementFingerprint"] !== "string")
      || typeof sicht["aktualisiertAmMs"] !== "number"
      || !Number.isSafeInteger(sicht["aktualisiertAmMs"])
      || sicht["sameTransferRetryAllowed"] !== false
      || sicht["exactlyOneActiveTransfer"] !== true
      || sicht["parallelTransferAllowed"] !== false
      || typeof sicht["finalCraftRescanAllowed"] !== "boolean"
      || sicht["productiveExecutionAllowed"] !== false
      || sicht["transferAuthority"] !== false
      || sicht["gameplayAuthority"] !== false
      || sicht["rawWriteAuthority"] !== false
      || sicht["normalRuntimeAllowed"] !== false) {
    throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_UNGUELTIG");
  }
  const zustand = sicht["zustand"] as ProduktionsMaterialTeamBatchZustand;
  const recoveryVorZustand = sicht["recoveryVorZustand"]
    as ProduktionsMaterialTeamBatchRecoveryVorZustand | null;
  const transferIds = sicht["transferIds"] as string[];
  const settledTransferIds = sicht["settledTransferIds"] as string[];
  const nextSequence = sicht["nextSequence"] as number;
  const activeTransferId = sicht["activeTransferId"] as string | null;
  const finalCraftRescanAllowed = sicht["finalCraftRescanAllowed"] as boolean;
  if ((zustand === "RECOVERY_PENDING" && recoveryVorZustand === null)
      || nextSequence < 1
      || nextSequence > transferIds.length + 1
      || settledTransferIds.length > transferIds.length
      || !settledTransferIds.every((id, index) => id === transferIds[index])
      || (finalCraftRescanAllowed && zustand !== "ALLE_SETTLED")
      || (zustand === "ALLE_SETTLED"
        && (finalCraftRescanAllowed !== true
          || nextSequence !== transferIds.length + 1
          || settledTransferIds.length !== transferIds.length
          || activeTransferId !== null))
      || (zustand === "BATCH_BEREIT" && activeTransferId !== null)
      || (zustand === "TRANSFER_AKTIV" && activeTransferId === null)
      || (zustand === "RECOVERY_PENDING"
        && recoveryVorZustand === "TRANSFER_AKTIV"
        && activeTransferId === null)) {
    throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_UNGUELTIG");
  }
  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs: obj["gespeichertAmMs"] as number,
    sicht: friere(
      sicht as unknown as ProduktionsMaterialTeamBatchSicht,
    ),
  });
}

export class PersistenterProduktionsMaterialTeamBatchController {
  public readonly productiveExecutionAllowed = false as const;
  public readonly transferAuthority = false as const;
  public readonly gameplayAuthority = false as const;
  public readonly rawWriteAuthority = false as const;
  public readonly normalRuntimeAllowed = false as const;

  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  #sicht: ProduktionsMaterialTeamBatchSicht | null = null;

  public constructor(
    speicher: SpeicherPort,
    pfad = "koordination/production-material-team-batch-v1.json",
  ) {
    pruefeText(pfad, "CAP022_TEAM_BATCH_PFAD_UNGUELTIG");
    this.#speicher = speicher;
    this.#pfad = pfad;
  }

  public async lade(
    jetztMs: number,
  ): Promise<ProduktionsMaterialTeamBatchLadeStatus> {
    pruefeZeit(jetztMs, "CAP022_TEAM_BATCH_ZEIT_UNGUELTIG");
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        recoveryPending: false,
        terminal: false,
        finalCraftRescanAllowed: false,
        productiveExecutionAllowed: false,
        transferAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        normalRuntimeAllowed: false,
      });
    }
    const snapshot = parseSnapshot(text);
    if (snapshot.gespeichertAmMs > jetztMs) {
      throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_AUS_ZUKUNFT");
    }
    const alt = snapshot.sicht;
    const terminal = alt.zustand === "ALLE_SETTLED"
      || alt.zustand === "FAILED_SAFE";
    this.#sicht = terminal
      ? friere(alt)
      : friere({
        ...alt,
        zustand: "RECOVERY_PENDING",
        recoveryVorZustand: alt.zustand === "RECOVERY_PENDING"
          ? alt.recoveryVorZustand
          : alt.zustand as ProduktionsMaterialTeamBatchRecoveryVorZustand,
        sameTransferRetryAllowed: false,
        finalCraftRescanAllowed: false,
        productiveExecutionAllowed: false,
        transferAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        normalRuntimeAllowed: false,
        aktualisiertAmMs: jetztMs,
      });
    await this.#persistiere(jetztMs);
    return Object.freeze({
      schemaVersion: 1,
      geladen: true,
      recoveryPending: this.#sicht.zustand === "RECOVERY_PENDING",
      terminal,
      finalCraftRescanAllowed:
        this.#sicht.zustand === "ALLE_SETTLED",
      productiveExecutionAllowed: false,
      transferAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
  }

  public async beginne(
    batch: ProduktionsMaterialTeamHandoffPlan,
    merchantInventoryFingerprint: string,
    merchantMenge: number,
    jetztMs: number,
  ): Promise<ProduktionsMaterialTeamBatchSicht> {
    pruefeZeit(jetztMs, "CAP022_TEAM_BATCH_ZEIT_UNGUELTIG");
    validiereBatch(batch);
    pruefeText(
      merchantInventoryFingerprint,
      "CAP022_TEAM_BATCH_BASELINE_FP_UNGUELTIG",
    );
    pruefeMenge(
      merchantMenge,
      "CAP022_TEAM_BATCH_BASELINE_MENGE_UNGUELTIG",
    );
    if (this.#sicht !== null) {
      throw new Error("CAP022_TEAM_BATCH_EXISTIERT");
    }
    this.#sicht = friere({
      schemaVersion: 1,
      batchId: batch.objectiveId + ":collection-batch",
      objectiveId: batch.objectiveId,
      transferIds: Object.freeze(
        batch.transfers.map(x => x.transferId),
      ),
      zustand: "BATCH_BEREIT",
      recoveryVorZustand: null,
      nextSequence: 1,
      activeTransferId: null,
      settledTransferIds: Object.freeze([]),
      merchantInventoryFingerprint,
      merchantMenge,
      letzteSettlementFingerprint: null,
      aktualisiertAmMs: jetztMs,
      sameTransferRetryAllowed: false,
      exactlyOneActiveTransfer: true,
      parallelTransferAllowed: false,
      finalCraftRescanAllowed: false,
      productiveExecutionAllowed: false,
      transferAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
    await this.#persistiere(jetztMs);
    return friere(this.#sicht);
  }

  public async planeNaechstenTransfer(
    batch: ProduktionsMaterialTeamHandoffPlan,
    quelleEvidence: LogistikQuellenEvidence,
    rendezvousEvidence: RendezvousEvidence,
    jetztMs: number,
    maximalesEvidenceAlterMs: number,
    maximalTransferDistanz: number,
  ): Promise<ProduktionsMaterialTeamBatchTransferPlanung> {
    pruefeZeit(jetztMs, "CAP022_TEAM_BATCH_ZEIT_UNGUELTIG");
    validiereBatch(batch);
    const alt = this.#requireSicht();
    if (!batchPasstSicht(batch, alt)) {
      throw new Error("CAP022_TEAM_BATCH_IDENTITAET_DRIFT");
    }
    if (alt.zustand !== "BATCH_BEREIT"
        || alt.activeTransferId !== null
        || alt.nextSequence < 1
        || alt.nextSequence > batch.transfers.length) {
      throw new Error("CAP022_TEAM_BATCH_TRANSFER_ZUSTAND_UNGUELTIG");
    }
    const transfer = batch.transfers[alt.nextSequence - 1];
    if (transfer === undefined) {
      throw new Error("CAP022_TEAM_BATCH_TRANSFER_FEHLT");
    }
    if (transfer.sequence > 1
        && alt.settledTransferIds.length !== transfer.sequence - 1) {
      throw new Error("CAP022_TEAM_BATCH_VORHERIGES_SETTLEMENT_FEHLT");
    }
    validiereQuellenEvidence(transfer, quelleEvidence);

    const logistik = planeMerchantLogistik({
      schemaVersion: 1,
      logistikId: transfer.transferId,
      art: "COLLECTION",
      ownerCharacterId: transfer.empfaenger.characterId,
      quelle: transfer.quelle,
      empfaenger: transfer.empfaenger,
      quelleEvidence,
      zielEvidence: rendezvousEvidence,
      posten: transfer.posten.map(x => Object.freeze({
        physischeKennung: x.physischeKennung,
        name: x.name,
        level: x.level,
        menge: x.menge,
        baselineEmpfaengerMenge: alt.merchantMenge,
        itemFingerprint: x.itemFingerprint,
      })),
      baselineEmpfaengerInventoryFingerprint:
        alt.merchantInventoryFingerprint,
      erstelltAmMs: jetztMs,
      gueltigBisMs: quelleEvidence.gueltigBisMs,
      maximalTransferDistanz,
      maximalesEvidenceAlterMs,
    }, jetztMs);

    this.#sicht = friere({
      ...alt,
      zustand: "TRANSFER_AKTIV",
      recoveryVorZustand: null,
      activeTransferId: transfer.transferId,
      aktualisiertAmMs: jetztMs,
      finalCraftRescanAllowed: false,
      sameTransferRetryAllowed: false,
    });
    await this.#persistiere(jetztMs);

    return Object.freeze({
      schemaVersion: 1,
      batch: friere(this.#sicht),
      transfer,
      logistik,
      freshMerchantBaselineUsed: true,
      freshMerchantRendezvousUsed: true,
      previousTransferSettlementVerified: transfer.sequence === 1
        ? true
        : alt.settledTransferIds.length === transfer.sequence - 1,
      sameTransferRetryAllowed: false,
      productiveExecutionAllowed: false,
      transferAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
    });
  }

  public async bestaetigeSettlement(
    batch: ProduktionsMaterialTeamHandoffPlan,
    sicht: MerchantLogistikSicht,
    evidence: TransferSettlementEvidence,
    jetztMs: number,
  ): Promise<ProduktionsMaterialTeamBatchSicht> {
    pruefeZeit(jetztMs, "CAP022_TEAM_BATCH_ZEIT_UNGUELTIG");
    validiereBatch(batch);
    const alt = this.#requireSicht();
    if (!batchPasstSicht(batch, alt)) {
      throw new Error("CAP022_TEAM_BATCH_IDENTITAET_DRIFT");
    }
    const recoveryAktiv = alt.zustand === "RECOVERY_PENDING"
      && alt.recoveryVorZustand === "TRANSFER_AKTIV";
    if (alt.zustand !== "TRANSFER_AKTIV" && !recoveryAktiv) {
      throw new Error("CAP022_TEAM_BATCH_SETTLEMENT_ZUSTAND_UNGUELTIG");
    }
    const transfer = batch.transfers[alt.nextSequence - 1];
    if (transfer === undefined
        || alt.activeTransferId !== transfer.transferId) {
      throw new Error("CAP022_TEAM_BATCH_AKTIVER_TRANSFER_DRIFT");
    }
    if (!Number.isSafeInteger(evidence.beobachtetAmMs)
        || evidence.beobachtetAmMs > jetztMs) {
      throw new Error("CAP022_TEAM_BATCH_SETTLEMENT_AUS_ZUKUNFT");
    }
    validiereSettlement(
      transfer,
      alt.merchantInventoryFingerprint,
      alt.merchantMenge,
      sicht,
      evidence,
    );
    const name = transfer.posten[0]?.name;
    const level = transfer.posten[0]?.level;
    if (name === undefined || level === undefined) {
      throw new Error("CAP022_TEAM_BATCH_TRANSFER_MATERIAL_FEHLT");
    }
    const neueMenge = beobachteteMenge(evidence, name, level);
    const settled = Object.freeze([
      ...alt.settledTransferIds,
      transfer.transferId,
    ]);
    const allesSettled = transfer.sequence === batch.transfers.length;
    this.#sicht = friere({
      ...alt,
      zustand: allesSettled ? "ALLE_SETTLED" : "BATCH_BEREIT",
      recoveryVorZustand: null,
      nextSequence: allesSettled
        ? batch.transfers.length + 1
        : transfer.sequence + 1,
      activeTransferId: null,
      settledTransferIds: settled,
      merchantInventoryFingerprint: evidence.inventoryFingerprint,
      merchantMenge: neueMenge,
      letzteSettlementFingerprint: evidence.settlementFingerprint,
      aktualisiertAmMs: jetztMs,
      sameTransferRetryAllowed: false,
      finalCraftRescanAllowed: allesSettled,
      productiveExecutionAllowed: false,
      transferAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
    await this.#persistiere(jetztMs);
    return friere(this.#sicht);
  }

  public async reconciliereBereitenBatchNachRestart(
    batch: ProduktionsMaterialTeamHandoffPlan,
    merchantInventoryFingerprint: string,
    merchantMenge: number,
    jetztMs: number,
  ): Promise<ProduktionsMaterialTeamBatchSicht> {
    pruefeZeit(jetztMs, "CAP022_TEAM_BATCH_ZEIT_UNGUELTIG");
    validiereBatch(batch);
    const alt = this.#requireSicht();
    if (!batchPasstSicht(batch, alt)
        || alt.zustand !== "RECOVERY_PENDING"
        || alt.recoveryVorZustand !== "BATCH_BEREIT"
        || alt.activeTransferId !== null
        || merchantInventoryFingerprint !== alt.merchantInventoryFingerprint
        || merchantMenge !== alt.merchantMenge) {
      throw new Error("CAP022_TEAM_BATCH_RECOVERY_BASELINE_DRIFT");
    }
    this.#sicht = friere({
      ...alt,
      zustand: "BATCH_BEREIT",
      recoveryVorZustand: null,
      aktualisiertAmMs: jetztMs,
      sameTransferRetryAllowed: false,
      finalCraftRescanAllowed: false,
    });
    await this.#persistiere(jetztMs);
    return friere(this.#sicht);
  }

  public async scheitereSicher(
    batch: ProduktionsMaterialTeamHandoffPlan,
    jetztMs: number,
  ): Promise<ProduktionsMaterialTeamBatchSicht> {
    pruefeZeit(jetztMs, "CAP022_TEAM_BATCH_ZEIT_UNGUELTIG");
    validiereBatch(batch);
    const alt = this.#requireSicht();
    if (!batchPasstSicht(batch, alt)
        || alt.zustand === "ALLE_SETTLED"
        || alt.zustand === "FAILED_SAFE") {
      throw new Error("CAP022_TEAM_BATCH_FAILED_SAFE_ZUSTAND_UNGUELTIG");
    }
    this.#sicht = friere({
      ...alt,
      zustand: "FAILED_SAFE",
      recoveryVorZustand: null,
      activeTransferId: null,
      aktualisiertAmMs: jetztMs,
      sameTransferRetryAllowed: false,
      finalCraftRescanAllowed: false,
      productiveExecutionAllowed: false,
      transferAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
    await this.#persistiere(jetztMs);
    return friere(this.#sicht);
  }

  public finde(): ProduktionsMaterialTeamBatchSicht {
    return friere(this.#requireSicht());
  }

  #requireSicht(): ProduktionsMaterialTeamBatchSicht {
    if (this.#sicht === null) {
      throw new Error("CAP022_TEAM_BATCH_NICHT_INITIALISIERT");
    }
    return this.#sicht;
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const sicht = this.#requireSicht();
    const snapshot: PersistierterSnapshot = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      sicht: friere(sicht),
    });
    const inhalt = JSON.stringify(snapshot);
    if (inhalt.length > 1_000_000) {
      throw new Error("CAP022_TEAM_BATCH_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
