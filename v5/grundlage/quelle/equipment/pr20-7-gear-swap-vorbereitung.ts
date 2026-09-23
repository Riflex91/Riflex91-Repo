import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export const PR20_7_GEAR_SWAP_SAFE_SLOTS = Object.freeze([
  "cape",
  "belt",
  "amulet",
  "orb",
  "helmet",
  "gloves",
  "shoes",
  "pants",
  "chest",
] as const);

export type Pr207GearSwapSafeSlot =
  (typeof PR20_7_GEAR_SWAP_SAFE_SLOTS)[number];

export type Pr207GearSwapBlockGrund =
  | "ACCOUNT_DRIFT"
  | "SESSION_DRIFT"
  | "SERVER_DRIFT"
  | "ROSTER_DRIFT"
  | "EVIDENCE_STALE"
  | "SLOT_NICHT_FREIGEGEBEN"
  | "SLOT_IST_LEER"
  | "KANDIDAT_NICHT_PHYSISCH"
  | "ALTITEM_NICHT_PHYSISCH"
  | "ALTITEM_GESPERRT"
  | "KANDIDAT_GESPERRT"
  | "NICHT_KOMPATIBEL"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "DISPOSITION_GESPERRT"
  | "KANDIDAT_INDEX_UNGUELTIG"
  | "IDENTITAET_UNVOLLSTAENDIG";

export interface Pr207GearSwapItemEvidence {
  readonly name: string;
  readonly level: number;
  readonly physischeKennung: string;
  readonly beobachtungsFingerprint: string;
  readonly physisch: boolean;
  readonly gesperrt: boolean;
  readonly virtuellB: boolean;
}

export interface Pr207GearSwapEvidence {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly merchantAccountId: string;
  readonly slot: string;
  readonly kandidatIndex: number;
  readonly kandidat: Pr207GearSwapItemEvidence;
  readonly vorherigesSlotItem: Pr207GearSwapItemEvidence | null;
  readonly kompatibel: boolean;
  readonly contentVerifiziert: boolean;
  readonly dispositionErlaubt: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalesEvidenceAlterMs: number;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
  readonly evidenceFingerprint: string;
}

export interface Pr207GearSwapPlan {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE";
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly slot: Pr207GearSwapSafeSlot;
  readonly kandidatIndex: number;
  readonly kandidat: Pr207GearSwapItemEvidence;
  readonly vorherigesSlotItem: Pr207GearSwapItemEvidence;
  readonly prestate: Readonly<{
    slotFingerprint: string;
    indexFingerprint: string;
    restInventarFingerprint: string;
    restEquipmentFingerprint: string;
  }>;
  readonly expectedPostcondition: Readonly<{
    slotFingerprint: string;
    indexFingerprint: string;
    restInventarFingerprint: string;
    restEquipmentFingerprint: string;
    serverSemantik: "ATOMIC_REPLACE_AND_RETURN_PREVIOUS_TO_SOURCE_INDEX";
  }>;
  readonly actionContractId: "AL-ACTION-EQUIP";
  readonly recoveryContractId: "AL-RECOVERY-EQUIP";
  readonly verifierId: "AL-VERIFIER-EQUIP";
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
}

export interface Pr207GearSwapVorbereitung {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly Pr207GearSwapBlockGrund[];
  readonly plan: Pr207GearSwapPlan | null;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface Pr207GearSwapSettlementObservation {
  readonly schemaVersion: 1;
  readonly recipient: CharacterZielBindung;
  readonly slot: string;
  readonly kandidatIndex: number;
  readonly slotFingerprint: string | null;
  readonly indexFingerprint: string | null;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
  readonly beobachtetAmMs: number;
}

export type Pr207GearSwapSettlementKlassifikation =
  | "BESTAETIGT"
  | "NICHT_AUSGEFUEHRT"
  | "TEILWEISE"
  | "UNGEKLAERT";

export interface Pr207GearSwapSettlement {
  readonly schemaVersion: 1;
  readonly klassifikation: Pr207GearSwapSettlementKlassifikation;
  readonly sameIntentRetry: false;
  readonly neuerIntentAutomatischErlaubt: false;
  readonly gruende: readonly string[];
  readonly beobachtetAmMs: number;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) {
    throw new Error(fehler);
  }
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereBindung(bindung: CharacterZielBindung): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error("PR20_7_GEAR_BINDUNG_UNGUELTIG");
  }
  for (const wert of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) {
    text(wert, "PR20_7_GEAR_BINDUNG_UNGUELTIG");
  }
}

function validiereItem(item: Pr207GearSwapItemEvidence): void {
  for (const wert of [
    item.name,
    item.physischeKennung,
    item.beobachtungsFingerprint,
  ]) {
    text(wert, "PR20_7_GEAR_ITEM_IDENTITAET_UNGUELTIG");
  }
  if (!Number.isSafeInteger(item.level)
      || item.level < 0
      || item.level > 1_000) {
    throw new Error("PR20_7_GEAR_ITEM_LEVEL_UNGUELTIG");
  }
}

function gleicheBindung(
  links: CharacterZielBindung,
  rechts: CharacterZielBindung,
): boolean {
  return links.schemaVersion === rechts.schemaVersion
    && links.accountId === rechts.accountId
    && links.characterId === rechts.characterId
    && links.sessionId === rechts.sessionId
    && links.serverRegion === rechts.serverRegion
    && links.serverIdentifier === rechts.serverIdentifier
    && links.rosterEpoche === rechts.rosterEpoche
    && links.rosterFingerprint === rechts.rosterFingerprint;
}

export function pruefePr207GearSwapVorbereitung(
  evidence: Pr207GearSwapEvidence,
  jetztMs: number,
): Pr207GearSwapVorbereitung {
  if (evidence.schemaVersion !== 1) {
    throw new Error("PR20_7_GEAR_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  validiereBindung(evidence.recipient);
  validiereItem(evidence.kandidat);
  if (evidence.vorherigesSlotItem !== null) {
    validiereItem(evidence.vorherigesSlotItem);
  }
  for (const wert of [
    evidence.evidenceId,
    evidence.merchantAccountId,
    evidence.slot,
    evidence.restInventarFingerprint,
    evidence.restEquipmentFingerprint,
    evidence.evidenceFingerprint,
  ]) {
    text(wert, "PR20_7_GEAR_EVIDENCE_TEXT_UNGUELTIG");
  }
  zeit(evidence.beobachtetAmMs, "PR20_7_GEAR_EVIDENCE_ZEIT_UNGUELTIG");
  zeit(evidence.gueltigBisMs, "PR20_7_GEAR_EVIDENCE_GUELTIGKEIT_UNGUELTIG");
  zeit(jetztMs, "PR20_7_GEAR_JETZT_UNGUELTIG");
  if (!Number.isSafeInteger(evidence.maximalesEvidenceAlterMs)
      || evidence.maximalesEvidenceAlterMs < 1
      || evidence.maximalesEvidenceAlterMs > 60_000) {
    throw new Error("PR20_7_GEAR_EVIDENCE_ALTER_UNGUELTIG");
  }

  const blocker: Pr207GearSwapBlockGrund[] = [];
  const slot = PR20_7_GEAR_SWAP_SAFE_SLOTS.includes(
    evidence.slot as Pr207GearSwapSafeSlot,
  )
    ? evidence.slot as Pr207GearSwapSafeSlot
    : null;

  if (evidence.recipient.accountId !== evidence.merchantAccountId) {
    blocker.push("ACCOUNT_DRIFT");
  }
  if (jetztMs < evidence.beobachtetAmMs
      || jetztMs > evidence.gueltigBisMs
      || jetztMs - evidence.beobachtetAmMs > evidence.maximalesEvidenceAlterMs) {
    blocker.push("EVIDENCE_STALE");
  }
  if (slot === null) blocker.push("SLOT_NICHT_FREIGEGEBEN");
  if (evidence.vorherigesSlotItem === null) blocker.push("SLOT_IST_LEER");
  if (!Number.isInteger(evidence.kandidatIndex)
      || evidence.kandidatIndex < 0
      || evidence.kandidatIndex >= 128) {
    blocker.push("KANDIDAT_INDEX_UNGUELTIG");
  }
  if (!evidence.kandidat.physisch || evidence.kandidat.virtuellB) {
    blocker.push("KANDIDAT_NICHT_PHYSISCH");
  }
  if (evidence.kandidat.gesperrt) blocker.push("KANDIDAT_GESPERRT");
  if (evidence.vorherigesSlotItem !== null
      && (!evidence.vorherigesSlotItem.physisch
        || evidence.vorherigesSlotItem.virtuellB)) {
    blocker.push("ALTITEM_NICHT_PHYSISCH");
  }
  if (evidence.vorherigesSlotItem?.gesperrt === true) {
    blocker.push("ALTITEM_GESPERRT");
  }
  if (!evidence.kompatibel) blocker.push("NICHT_KOMPATIBEL");
  if (!evidence.contentVerifiziert) blocker.push("CONTENT_NICHT_VERIFIZIERT");
  if (!evidence.dispositionErlaubt) blocker.push("DISPOSITION_GESPERRT");
  if (evidence.kandidat.physischeKennung
      === evidence.vorherigesSlotItem?.physischeKennung) {
    blocker.push("IDENTITAET_UNVOLLSTAENDIG");
  }

  if (blocker.length > 0 || slot === null || evidence.vorherigesSlotItem === null) {
    return Object.freeze({
      schemaVersion: 1,
      status: "BLOCKIERT",
      blocker: Object.freeze([...new Set(blocker)]),
      plan: null,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  const plan: Pr207GearSwapPlan = Object.freeze({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    evidenceId: evidence.evidenceId,
    recipient: Object.freeze({ ...evidence.recipient }),
    slot,
    kandidatIndex: evidence.kandidatIndex,
    kandidat: Object.freeze({ ...evidence.kandidat }),
    vorherigesSlotItem: Object.freeze({ ...evidence.vorherigesSlotItem }),
    prestate: Object.freeze({
      slotFingerprint: evidence.vorherigesSlotItem.beobachtungsFingerprint,
      indexFingerprint: evidence.kandidat.beobachtungsFingerprint,
      restInventarFingerprint: evidence.restInventarFingerprint,
      restEquipmentFingerprint: evidence.restEquipmentFingerprint,
    }),
    expectedPostcondition: Object.freeze({
      slotFingerprint: evidence.kandidat.beobachtungsFingerprint,
      indexFingerprint: evidence.vorherigesSlotItem.beobachtungsFingerprint,
      restInventarFingerprint: evidence.restInventarFingerprint,
      restEquipmentFingerprint: evidence.restEquipmentFingerprint,
      serverSemantik: "ATOMIC_REPLACE_AND_RETURN_PREVIOUS_TO_SOURCE_INDEX",
    }),
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
  });

  return Object.freeze({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    blocker: Object.freeze([]),
    plan,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function klassifizierePr207GearSwapSettlement(
  plan: Pr207GearSwapPlan,
  beobachtung: Pr207GearSwapSettlementObservation,
): Pr207GearSwapSettlement {
  validiereBindung(beobachtung.recipient);
  zeit(beobachtung.beobachtetAmMs, "PR20_7_GEAR_SETTLEMENT_ZEIT_UNGUELTIG");
  text(beobachtung.slot, "PR20_7_GEAR_SETTLEMENT_SLOT_UNGUELTIG");
  text(
    beobachtung.restInventarFingerprint,
    "PR20_7_GEAR_SETTLEMENT_REST_INVENTAR_UNGUELTIG",
  );
  text(
    beobachtung.restEquipmentFingerprint,
    "PR20_7_GEAR_SETTLEMENT_REST_EQUIPMENT_UNGUELTIG",
  );

  const gruende: string[] = [];
  if (!gleicheBindung(plan.recipient, beobachtung.recipient)) {
    gruende.push("RECIPIENT_BINDUNG_DRIFT");
  }
  if (beobachtung.slot !== plan.slot) gruende.push("SLOT_DRIFT");
  if (beobachtung.kandidatIndex !== plan.kandidatIndex) {
    gruende.push("KANDIDAT_INDEX_DRIFT");
  }
  if (beobachtung.restInventarFingerprint
      !== plan.expectedPostcondition.restInventarFingerprint) {
    gruende.push("REST_INVENTAR_DRIFT");
  }
  if (beobachtung.restEquipmentFingerprint
      !== plan.expectedPostcondition.restEquipmentFingerprint) {
    gruende.push("REST_EQUIPMENT_DRIFT");
  }

  const postSlot = beobachtung.slotFingerprint
    === plan.expectedPostcondition.slotFingerprint;
  const postIndex = beobachtung.indexFingerprint
    === plan.expectedPostcondition.indexFingerprint;
  const preSlot = beobachtung.slotFingerprint === plan.prestate.slotFingerprint;
  const preIndex = beobachtung.indexFingerprint === plan.prestate.indexFingerprint;
  const structuralDrift = gruende.length > 0;

  let klassifikation: Pr207GearSwapSettlementKlassifikation;
  if (!structuralDrift && postSlot && postIndex) {
    klassifikation = "BESTAETIGT";
  } else if (!structuralDrift && preSlot && preIndex) {
    klassifikation = "NICHT_AUSGEFUEHRT";
  } else if (!structuralDrift && (postSlot || postIndex)) {
    klassifikation = "TEILWEISE";
    gruende.push("NUR_TEILMENGE_DER_SWAP_POSTCONDITION");
  } else {
    klassifikation = "UNGEKLAERT";
    if (!postSlot && !postIndex && !preSlot && !preIndex) {
      gruende.push("WEDER_PRESTATE_NOCH_POSTCONDITION");
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    klassifikation,
    sameIntentRetry: false,
    neuerIntentAutomatischErlaubt: false,
    gruende: Object.freeze(gruende),
    beobachtetAmMs: beobachtung.beobachtetAmMs,
  });
}
