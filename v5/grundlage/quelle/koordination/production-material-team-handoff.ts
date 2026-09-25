import type { CharacterZielBindung } from "./roster-wahrheit.js";
import type {
  ProduktionsMaterialTeamPlan,
  ProduktionsMaterialTeamZuteilung,
} from "./production-material-team-coordination.js";
import type {
  LogistikQuellenEvidence,
  LogistikQuellenPostenEvidence,
} from "../merchant/logistik-planer.js";

export interface ProduktionsMaterialTeamHandoffAnfrage {
  readonly schemaVersion: 1;
  readonly team: ProduktionsMaterialTeamPlan;
  readonly merchant: CharacterZielBindung;
  readonly quellen: readonly LogistikQuellenEvidence[];
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialTeamHandoffPostenPin {
  readonly physischeKennung: string;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly itemFingerprint: string;
}

export interface ProduktionsMaterialTeamHandoffTransfer {
  readonly schemaVersion: 1;
  readonly sequence: number;
  readonly transferId: string;
  readonly objectiveId: string;
  readonly quelle: CharacterZielBindung;
  readonly empfaenger: CharacterZielBindung;
  readonly posten: readonly ProduktionsMaterialTeamHandoffPostenPin[];
  readonly gesamtMenge: number;
  readonly sourceFreshnessFingerprint: string;
  readonly sourceInventoryFingerprint: string;
  readonly actionContractId: "AL-ACTION-SEND-ITEM";
  readonly recoveryContractId: "AL-RECOVERY-SEND-ITEM";
  readonly verifierId: "AL-VERIFIER-SEND-ITEM";
  readonly sameProductionObjective: true;
  readonly freshMerchantRendezvousBeforeTransferRequired: true;
  readonly freshMerchantBaselineBeforeTransferRequired: true;
  readonly previousTransferSettlementRequired: boolean;
  readonly planningOnly: true;
  readonly transferAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

export interface ProduktionsMaterialTeamHandoffPlan {
  readonly schemaVersion: 1;
  readonly status: "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly objectiveId: string;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly name: string;
  readonly level: number;
  readonly requiredQuantity: number;
  readonly pinnedQuantity: number;
  readonly transfers: readonly ProduktionsMaterialTeamHandoffTransfer[];
  readonly blocker: readonly string[];
  readonly allSourcesSameProductionObjective: true;
  readonly aggregateReadyVerified: boolean;
  readonly farmStopVerified: boolean;
  readonly transferSequenceFixed: true;
  readonly parallelTransferAllowed: false;
  readonly eachTransferMustSettleBeforeNext: true;
  readonly freshMerchantBaselineBeforeEachTransferRequired: true;
  readonly freshMerchantRendezvousBeforeEachTransferRequired: true;
  readonly finalCraftRescanOnlyAfterAllSettled: true;
  readonly sameTransferRetryAllowed: false;
  readonly currentPr20_9RatificationCredit: false;
  readonly productiveExecutionAllowed: false;
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

function bindungGueltig(bindung: CharacterZielBindung): boolean {
  return bindung.schemaVersion === 1
    && bindung.accountId.trim().length > 0
    && bindung.characterId.trim().length > 0
    && bindung.sessionId.trim().length > 0
    && bindung.serverRegion.trim().length > 0
    && bindung.serverIdentifier.trim().length > 0
    && bindung.rosterFingerprint.trim().length > 0
    && bindung.accountId.length <= 192
    && bindung.characterId.length <= 192
    && bindung.sessionId.length <= 192
    && bindung.serverRegion.length <= 192
    && bindung.serverIdentifier.length <= 192
    && bindung.rosterFingerprint.length <= 192
    && Number.isSafeInteger(bindung.rosterEpoche)
    && bindung.rosterEpoche >= 1;
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

function zielPosten(
  evidence: LogistikQuellenEvidence,
  team: ProduktionsMaterialTeamPlan,
): readonly LogistikQuellenPostenEvidence[] {
  return Object.freeze(
    evidence.posten
      .filter(x => x.name === team.name && x.level === team.level)
      .slice()
      .sort((a, b) => a.physischeKennung.localeCompare(b.physischeKennung)),
  );
}

function sourceFuer(
  zuteilung: ProduktionsMaterialTeamZuteilung,
  quellen: readonly LogistikQuellenEvidence[],
): LogistikQuellenEvidence | undefined {
  return quellen.find(x => gleicheBindung(x.quelle, zuteilung.farmer));
}

export function planeProductionMaterialTeamHandoff(
  anfrage: ProduktionsMaterialTeamHandoffAnfrage,
  jetztMs: number,
): ProduktionsMaterialTeamHandoffPlan {
  if (anfrage.schemaVersion !== 1 || anfrage.team.schemaVersion !== 1) {
    throw new Error("CAP022_TEAM_HANDOFF_SCHEMA_UNGUELTIG");
  }
  ganzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_TEAM_HANDOFF_ZEIT_UNGUELTIG",
  );
  ganzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_TEAM_HANDOFF_EVIDENCE_ALTER_UNGUELTIG",
  );
  if (!bindungGueltig(anfrage.merchant)) {
    throw new Error("CAP022_TEAM_HANDOFF_MERCHANT_UNGUELTIG");
  }

  const team = anfrage.team;
  for (const wert of [
    team.objectiveId,
    team.produktionsId,
    team.ablaufId,
    team.sourceId,
    team.name,
  ]) text(wert, "CAP022_TEAM_HANDOFF_TEAM_TEXT_UNGUELTIG");
  ganzzahl(team.level, 0, 99, "CAP022_TEAM_HANDOFF_LEVEL_UNGUELTIG");
  ganzzahl(
    team.requiredQuantity,
    1,
    1_000_000,
    "CAP022_TEAM_HANDOFF_REQUIRED_UNGUELTIG",
  );
  ganzzahl(
    team.heldByFarmers,
    0,
    32_000_000,
    "CAP022_TEAM_HANDOFF_HELD_UNGUELTIG",
  );

  if (team.status !== "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE"
      || team.remainingToFarm !== 0
      || team.heldByFarmers < team.requiredQuantity
      || team.farmStopRequired !== true
      || team.handoffBatchRequired !== true
      || team.allWorkersSameProductionObjective !== true
      || team.splitAcrossProductionObjectives !== false
      || team.productiveExecutionAllowed !== false
      || team.gameplayAuthority !== false
      || team.rawWriteAuthority !== false
      || team.normalRuntimeAllowed !== false
      || team.currentPr20_9RatificationCredit !== false) {
    throw new Error("CAP022_TEAM_HANDOFF_TEAM_NICHT_READY_NO_WRITE");
  }
  if (team.zuteilungen.length < 1 || team.zuteilungen.length > 8) {
    throw new Error("CAP022_TEAM_HANDOFF_ZUTEILUNGEN_UNGUELTIG");
  }
  if (anfrage.quellen.length > 32) {
    throw new Error("CAP022_TEAM_HANDOFF_QUELLEN_ZU_GROSS");
  }

  for (let index = 0; index < anfrage.quellen.length; index += 1) {
    const quelle = anfrage.quellen[index];
    if (quelle === undefined
        || quelle.schemaVersion !== 1
        || !bindungGueltig(quelle.quelle)) {
      throw new Error("CAP022_TEAM_HANDOFF_QUELLE_UNGUELTIG");
    }
    for (const wert of [
      quelle.freshnessFingerprint,
      quelle.inventoryFingerprint,
    ]) text(wert, "CAP022_TEAM_HANDOFF_QUELLE_TEXT_UNGUELTIG");
    if (anfrage.quellen.slice(0, index).some(
      x => x.quelle.characterId === quelle.quelle.characterId,
    )) {
      throw new Error("CAP022_TEAM_HANDOFF_QUELLE_DOPPELT");
    }
    for (let postenIndex = 0; postenIndex < quelle.posten.length; postenIndex += 1) {
      const posten = quelle.posten[postenIndex];
      if (posten === undefined) {
        throw new Error("CAP022_TEAM_HANDOFF_POSTEN_FEHLT");
      }
      for (const wert of [
        posten.physischeKennung,
        posten.name,
        posten.itemFingerprint,
      ]) text(wert, "CAP022_TEAM_HANDOFF_POSTEN_TEXT_UNGUELTIG");
      ganzzahl(posten.level, 0, 99, "CAP022_TEAM_HANDOFF_POSTEN_LEVEL_UNGUELTIG");
      ganzzahl(posten.menge, 1, 1_000_000, "CAP022_TEAM_HANDOFF_POSTEN_MENGE_UNGUELTIG");
      if (quelle.posten.slice(0, postenIndex).some(
        x => x.physischeKennung === posten.physischeKennung,
      )) {
        throw new Error("CAP022_TEAM_HANDOFF_POSTEN_DOPPELT");
      }
    }
  }

  const blocker: string[] = [];
  let rest = team.requiredQuantity;
  let sequence = 0;
  const transfers: ProduktionsMaterialTeamHandoffTransfer[] = [];
  const globalePhysischeKennungen = new Set<string>();

  for (const zuteilung of team.zuteilungen) {
    if (zuteilung.schemaVersion !== 1
        || zuteilung.objectiveId !== team.objectiveId
        || zuteilung.sameProductionObjective !== true
        || zuteilung.planningOnly !== true
        || zuteilung.movementAuthority !== false
        || zuteilung.combatAuthority !== false
        || zuteilung.lootAuthority !== false
        || zuteilung.gameplayAuthority !== false
        || zuteilung.rawWriteAuthority !== false
        || !gleicheAccountServerBindung(zuteilung.farmer, anfrage.merchant)
        || zuteilung.farmer.characterId === anfrage.merchant.characterId) {
      blocker.push(
        "CAP022_TEAM_HANDOFF_ZUTEILUNG_DRIFT:"
        + zuteilung.farmer.characterId,
      );
      continue;
    }
    if (zuteilung.beobachteteMenge <= 0) continue;

    const quelle = sourceFuer(zuteilung, anfrage.quellen);
    if (quelle === undefined
        || quelle.inventoryFingerprint !== zuteilung.inventoryFingerprint
        || !frisch(
          quelle.beobachtetAmMs,
          quelle.gueltigBisMs,
          jetztMs,
          anfrage.maximalesEvidenceAlterMs,
        )) {
      blocker.push(
        "CAP022_TEAM_HANDOFF_QUELLE_FEHLT_ODER_DRIFT:"
        + zuteilung.farmer.characterId,
      );
      continue;
    }

    const posten = zielPosten(quelle, team);
    const physischGesamt = posten.reduce((summe, x) => summe + x.menge, 0);
    if (physischGesamt !== zuteilung.beobachteteMenge) {
      blocker.push(
        "CAP022_TEAM_HANDOFF_MATERIALMENGE_DRIFT:"
        + zuteilung.farmer.characterId,
      );
      continue;
    }

    if (rest <= 0) continue;
    let workerRest = Math.min(rest, zuteilung.beobachteteMenge);
    const pins: ProduktionsMaterialTeamHandoffPostenPin[] = [];
    for (const item of posten) {
      if (workerRest <= 0) break;
      const physischerSchluessel =
        zuteilung.farmer.characterId + "|" + item.physischeKennung;
      if (globalePhysischeKennungen.has(physischerSchluessel)) {
        blocker.push(
          "CAP022_TEAM_HANDOFF_PHYSISCHE_KENNUNG_QUELLENLOKAL_DOPPELT:"
          + physischerSchluessel,
        );
        break;
      }
      const take = Math.min(workerRest, item.menge);
      if (take <= 0) continue;
      globalePhysischeKennungen.add(physischerSchluessel);
      pins.push(Object.freeze({
        physischeKennung: item.physischeKennung,
        name: item.name,
        level: item.level,
        menge: take,
        itemFingerprint: item.itemFingerprint,
      }));
      workerRest -= take;
    }
    if (workerRest > 0) {
      blocker.push(
        "CAP022_TEAM_HANDOFF_PHYSISCHER_BESTAND_FEHLT:"
        + zuteilung.farmer.characterId,
      );
      continue;
    }
    if (pins.length === 0) continue;

    sequence += 1;
    const gesamtMenge = pins.reduce((summe, x) => summe + x.menge, 0);
    transfers.push(Object.freeze({
      schemaVersion: 1,
      sequence,
      transferId:
        team.objectiveId
        + ":collection:"
        + String(sequence).padStart(2, "0")
        + ":"
        + zuteilung.farmer.characterId,
      objectiveId: team.objectiveId,
      quelle: Object.freeze({ ...zuteilung.farmer }),
      empfaenger: Object.freeze({ ...anfrage.merchant }),
      posten: Object.freeze(pins),
      gesamtMenge,
      sourceFreshnessFingerprint: quelle.freshnessFingerprint,
      sourceInventoryFingerprint: quelle.inventoryFingerprint,
      actionContractId: "AL-ACTION-SEND-ITEM",
      recoveryContractId: "AL-RECOVERY-SEND-ITEM",
      verifierId: "AL-VERIFIER-SEND-ITEM",
      sameProductionObjective: true,
      freshMerchantRendezvousBeforeTransferRequired: true,
      freshMerchantBaselineBeforeTransferRequired: true,
      previousTransferSettlementRequired: sequence > 1,
      planningOnly: true,
      transferAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
    }));
    rest -= gesamtMenge;
  }

  if (rest > 0) {
    blocker.push("CAP022_TEAM_HANDOFF_AGGREGATE_PHYSISCHE_MENGE_FEHLT");
  }

  const pinnedQuantity = transfers.reduce(
    (summe, transfer) => summe + transfer.gesamtMenge,
    0,
  );
  const ready = blocker.length === 0
    && rest === 0
    && pinnedQuantity === team.requiredQuantity
    && transfers.length > 0;

  return Object.freeze({
    schemaVersion: 1,
    status: ready
      ? "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE"
      : "BLOCKIERT",
    objectiveId: team.objectiveId,
    produktionsId: team.produktionsId,
    ablaufId: team.ablaufId,
    name: team.name,
    level: team.level,
    requiredQuantity: team.requiredQuantity,
    pinnedQuantity,
    transfers: Object.freeze(transfers),
    blocker: Object.freeze(blocker),
    allSourcesSameProductionObjective: true,
    aggregateReadyVerified: ready,
    farmStopVerified: ready,
    transferSequenceFixed: true,
    parallelTransferAllowed: false,
    eachTransferMustSettleBeforeNext: true,
    freshMerchantBaselineBeforeEachTransferRequired: true,
    freshMerchantRendezvousBeforeEachTransferRequired: true,
    finalCraftRescanOnlyAfterAllSettled: true,
    sameTransferRetryAllowed: false,
    currentPr20_9RatificationCredit: false,
    productiveExecutionAllowed: false,
    transferAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
