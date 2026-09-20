import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import type {
  LogistikPosten,
  MerchantLogistikArt,
  MerchantLogistikPlan,
  RendezvousEvidence,
} from "./logistik-workflow.js";

export interface LogistikQuellenPostenEvidence {
  readonly physischeKennung: string;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly itemFingerprint: string;
}

export interface LogistikQuellenEvidence {
  readonly schemaVersion: 1;
  readonly quelle: CharacterZielBindung;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly freshnessFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly posten: readonly LogistikQuellenPostenEvidence[];
}

export interface LogistikPostenAnforderung extends LogistikPosten {
  readonly itemFingerprint: string;
}

export interface LogistikPlanungsAnfrage {
  readonly schemaVersion: 1;
  readonly logistikId: string;
  readonly art: MerchantLogistikArt;
  readonly ownerCharacterId: string;
  readonly quelle: CharacterZielBindung;
  readonly empfaenger: CharacterZielBindung;
  readonly quelleEvidence: LogistikQuellenEvidence;
  readonly zielEvidence: RendezvousEvidence;
  readonly posten: readonly LogistikPostenAnforderung[];
  readonly baselineEmpfaengerInventoryFingerprint: string;
  readonly erstelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalTransferDistanz: number;
  readonly maximalesEvidenceAlterMs: number;
}

export interface LogistikQuellenPinPosten {
  readonly physischeKennung: string;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly itemFingerprint: string;
}

export interface LogistikQuellenPin {
  readonly schemaVersion: 1;
  readonly quelle: CharacterZielBindung;
  readonly freshnessFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly gueltigBisMs: number;
  readonly posten: readonly LogistikQuellenPinPosten[];
  readonly planningEvidence: true;
  readonly executionAuthority: false;
}

export interface LogistikTransferBindung {
  readonly actionContractId: "AL-ACTION-SEND-ITEM";
  readonly recoveryContractId: "AL-RECOVERY-SEND-ITEM";
  readonly verifierId: "AL-VERIFIER-SEND-ITEM";
  readonly planningOnly: true;
}

export interface MerchantLogistikPlanungsErgebnis {
  readonly schemaVersion: 1;
  readonly plan: MerchantLogistikPlan;
  readonly quellenPin: LogistikQuellenPin;
  readonly transferBindung: LogistikTransferBindung;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZiel(ziel: CharacterZielBindung, fehler: string): void {
  if (ziel.schemaVersion !== 1
      || !Number.isSafeInteger(ziel.rosterEpoche)
      || ziel.rosterEpoche < 1) {
    throw new Error(fehler);
  }
  for (const text of [
    ziel.accountId,
    ziel.characterId,
    ziel.sessionId,
    ziel.serverRegion,
    ziel.serverIdentifier,
    ziel.rosterFingerprint,
  ]) {
    pruefeText(text, fehler);
  }
}

function gleicheBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
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

function pruefeQuellenEvidence(
  evidence: LogistikQuellenEvidence,
  quelle: CharacterZielBindung,
  jetztMs: number,
  maximalAlterMs: number,
): void {
  if (evidence.schemaVersion !== 1
      || !gleicheBindung(evidence.quelle, quelle)) {
    throw new Error("LOGISTIK_PLAN_QUELLE_BINDUNG_DRIFT");
  }
  for (const text of [
    evidence.freshnessFingerprint,
    evidence.inventoryFingerprint,
  ]) {
    pruefeText(text, "LOGISTIK_PLAN_QUELLE_TEXT_UNGUELTIG");
  }
  if (!evidenceFrisch(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
    maximalAlterMs,
  )) {
    throw new Error("LOGISTIK_PLAN_QUELLE_NICHT_FRISCH");
  }
  if (evidence.posten.length < 1 || evidence.posten.length > 128) {
    throw new Error("LOGISTIK_PLAN_QUELLE_POSTEN_UNGUELTIG");
  }
  for (let index = 0; index < evidence.posten.length; index += 1) {
    const posten = evidence.posten[index];
    if (posten === undefined) {
      throw new Error("LOGISTIK_PLAN_QUELLE_POSTEN_FEHLT");
    }
    for (const text of [
      posten.physischeKennung,
      posten.name,
      posten.itemFingerprint,
    ]) {
      pruefeText(text, "LOGISTIK_PLAN_QUELLE_POSTEN_TEXT_UNGUELTIG");
    }
    if (!Number.isSafeInteger(posten.level)
        || posten.level < 0
        || posten.level > 99
        || !Number.isSafeInteger(posten.menge)
        || posten.menge < 1
        || posten.menge > 1_000_000) {
      throw new Error("LOGISTIK_PLAN_QUELLE_POSTEN_UNGUELTIG");
    }
    if (evidence.posten.slice(0, index).some(
      x => x.physischeKennung === posten.physischeKennung,
    )) {
      throw new Error("LOGISTIK_PLAN_QUELLE_PHYSISCH_DOPPELT");
    }
  }
}

function pruefeZielEvidence(
  evidence: RendezvousEvidence,
  ziel: CharacterZielBindung,
  jetztMs: number,
  maximalAlterMs: number,
): void {
  if (evidence.schemaVersion !== 1
      || evidence.characterId !== ziel.characterId
      || evidence.sessionId !== ziel.sessionId
      || evidence.serverRegion !== ziel.serverRegion
      || evidence.serverIdentifier !== ziel.serverIdentifier
      || evidence.rosterEpoche !== ziel.rosterEpoche) {
    throw new Error("LOGISTIK_PLAN_ZIEL_DRIFT");
  }
  pruefeText(
    evidence.freshnessFingerprint,
    "LOGISTIK_PLAN_ZIEL_FRESHNESS_UNGUELTIG",
  );
  if (!Number.isSafeInteger(evidence.beobachtetAmMs)
      || evidence.beobachtetAmMs < 0
      || evidence.beobachtetAmMs > jetztMs
      || jetztMs - evidence.beobachtetAmMs > maximalAlterMs
      || !Number.isFinite(evidence.distanz)
      || evidence.distanz < 0) {
    throw new Error("LOGISTIK_PLAN_ZIEL_NICHT_FRISCH");
  }
}

export function pruefeLogistikQuellenPin(
  pin: LogistikQuellenPin,
  evidence: LogistikQuellenEvidence,
  plan: MerchantLogistikPlan,
  jetztMs: number,
): void {
  if (pin.schemaVersion !== 1
      || pin.planningEvidence !== true
      || pin.executionAuthority !== false
      || !gleicheBindung(pin.quelle, evidence.quelle)
      || evidence.freshnessFingerprint !== pin.freshnessFingerprint
      || evidence.inventoryFingerprint !== pin.inventoryFingerprint) {
    throw new Error("LOGISTIK_QUELLEN_PIN_DRIFT");
  }
  if (!evidenceFrisch(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
    Math.max(1, pin.gueltigBisMs - plan.erstelltAmMs),
  ) || jetztMs > pin.gueltigBisMs) {
    throw new Error("LOGISTIK_QUELLEN_PIN_NICHT_FRISCH");
  }

  for (const geplant of pin.posten) {
    const aktuell = evidence.posten.find(
      x => x.physischeKennung === geplant.physischeKennung,
    );
    if (aktuell === undefined
        || aktuell.name !== geplant.name
        || aktuell.level !== geplant.level
        || aktuell.menge < geplant.menge
        || aktuell.itemFingerprint !== geplant.itemFingerprint) {
      throw new Error(
        "LOGISTIK_QUELLEN_POSTEN_DRIFT:" + geplant.physischeKennung,
      );
    }
  }
}

export function planeMerchantLogistik(
  anfrage: LogistikPlanungsAnfrage,
  jetztMs: number,
): MerchantLogistikPlanungsErgebnis {
  if (anfrage.schemaVersion !== 1) {
    throw new Error("LOGISTIK_PLAN_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    anfrage.logistikId,
    anfrage.ownerCharacterId,
    anfrage.baselineEmpfaengerInventoryFingerprint,
  ]) {
    pruefeText(text, "LOGISTIK_PLAN_TEXT_UNGUELTIG");
  }
  if (![ "SUPPLY_DELIVERY", "COLLECTION", "GEAR_DELIVERY" ].includes(
    anfrage.art,
  )) {
    throw new Error("LOGISTIK_PLAN_ART_UNGUELTIG");
  }
  pruefeZiel(anfrage.quelle, "LOGISTIK_PLAN_QUELLE_UNGUELTIG");
  pruefeZiel(anfrage.empfaenger, "LOGISTIK_PLAN_ZIEL_UNGUELTIG");
  if (anfrage.quelle.accountId !== anfrage.empfaenger.accountId
      || anfrage.quelle.serverRegion !== anfrage.empfaenger.serverRegion
      || anfrage.quelle.serverIdentifier !== anfrage.empfaenger.serverIdentifier
      || anfrage.quelle.characterId === anfrage.empfaenger.characterId) {
    throw new Error("LOGISTIK_PLAN_PARTY_BINDUNG_UNGUELTIG");
  }
  if (!Number.isSafeInteger(jetztMs)
      || !Number.isSafeInteger(anfrage.erstelltAmMs)
      || !Number.isSafeInteger(anfrage.gueltigBisMs)
      || !Number.isSafeInteger(anfrage.maximalesEvidenceAlterMs)
      || jetztMs < 0
      || anfrage.erstelltAmMs < 0
      || anfrage.erstelltAmMs > jetztMs
      || anfrage.gueltigBisMs < jetztMs
      || anfrage.maximalesEvidenceAlterMs < 1
      || anfrage.maximalesEvidenceAlterMs > 60_000
      || !Number.isFinite(anfrage.maximalTransferDistanz)
      || anfrage.maximalTransferDistanz <= 0
      || anfrage.maximalTransferDistanz > 10_000) {
    throw new Error("LOGISTIK_PLAN_GUELTIGKEIT_UNGUELTIG");
  }

  pruefeQuellenEvidence(
    anfrage.quelleEvidence,
    anfrage.quelle,
    jetztMs,
    anfrage.maximalesEvidenceAlterMs,
  );
  pruefeZielEvidence(
    anfrage.zielEvidence,
    anfrage.empfaenger,
    jetztMs,
    anfrage.maximalesEvidenceAlterMs,
  );

  if (anfrage.posten.length < 1 || anfrage.posten.length > 64) {
    throw new Error("LOGISTIK_PLAN_POSTEN_UNGUELTIG");
  }

  const posten = anfrage.posten.map((posten, index) => {
    for (const text of [
      posten.physischeKennung,
      posten.name,
      posten.itemFingerprint,
    ]) {
      pruefeText(text, "LOGISTIK_PLAN_POSTEN_TEXT_UNGUELTIG");
    }
    if (!Number.isSafeInteger(posten.level)
        || posten.level < 0
        || posten.level > 99
        || !Number.isSafeInteger(posten.menge)
        || posten.menge < 1
        || posten.menge > 1_000_000
        || !Number.isSafeInteger(posten.baselineEmpfaengerMenge)
        || posten.baselineEmpfaengerMenge < 0
        || posten.baselineEmpfaengerMenge > 1_000_000) {
      throw new Error("LOGISTIK_PLAN_POSTEN_UNGUELTIG");
    }
    if (anfrage.posten.slice(0, index).some(
      x => x.physischeKennung === posten.physischeKennung,
    )) {
      throw new Error("LOGISTIK_PLAN_POSTEN_PHYSISCH_DOPPELT");
    }

    const quelle = anfrage.quelleEvidence.posten.find(
      x => x.physischeKennung === posten.physischeKennung,
    );
    if (quelle === undefined
        || quelle.name !== posten.name
        || quelle.level !== posten.level
        || quelle.menge < posten.menge
        || quelle.itemFingerprint !== posten.itemFingerprint) {
      throw new Error(
        "LOGISTIK_PLAN_QUELLE_POSTEN_MISMATCH:" + posten.physischeKennung,
      );
    }

    return Object.freeze({
      physischeKennung: posten.physischeKennung,
      name: posten.name,
      level: posten.level,
      menge: posten.menge,
      baselineEmpfaengerMenge: posten.baselineEmpfaengerMenge,
    });
  });

  const pinPosten = anfrage.posten.map(posten => Object.freeze({
    physischeKennung: posten.physischeKennung,
    name: posten.name,
    level: posten.level,
    menge: posten.menge,
    itemFingerprint: posten.itemFingerprint,
  }));

  const plan: MerchantLogistikPlan = Object.freeze({
    schemaVersion: 1,
    logistikId: anfrage.logistikId,
    art: anfrage.art,
    ownerCharacterId: anfrage.ownerCharacterId,
    quelleCharacterId: anfrage.quelle.characterId,
    empfaenger: Object.freeze({ ...anfrage.empfaenger }),
    posten: Object.freeze(posten),
    erstelltAmMs: anfrage.erstelltAmMs,
    gueltigBisMs: anfrage.gueltigBisMs,
    maximalTransferDistanz: anfrage.maximalTransferDistanz,
    zielFreshnessFingerprint: anfrage.zielEvidence.freshnessFingerprint,
    baselineEmpfaengerInventoryFingerprint:
      anfrage.baselineEmpfaengerInventoryFingerprint,
  });

  const quellenPin: LogistikQuellenPin = Object.freeze({
    schemaVersion: 1,
    quelle: Object.freeze({ ...anfrage.quelle }),
    freshnessFingerprint: anfrage.quelleEvidence.freshnessFingerprint,
    inventoryFingerprint: anfrage.quelleEvidence.inventoryFingerprint,
    gueltigBisMs: Math.min(
      anfrage.gueltigBisMs,
      anfrage.quelleEvidence.gueltigBisMs,
    ),
    posten: Object.freeze(pinPosten),
    planningEvidence: true,
    executionAuthority: false,
  });

  return Object.freeze({
    schemaVersion: 1,
    plan,
    quellenPin,
    transferBindung: Object.freeze({
      actionContractId: "AL-ACTION-SEND-ITEM",
      recoveryContractId: "AL-RECOVERY-SEND-ITEM",
      verifierId: "AL-VERIFIER-SEND-ITEM",
      planningOnly: true,
    }),
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
