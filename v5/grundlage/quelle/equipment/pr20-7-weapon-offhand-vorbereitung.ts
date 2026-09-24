import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export const PR20_7_WEAPON_OFFHAND_SLOTS = Object.freeze([
  "mainhand",
  "offhand",
] as const);

export type Pr207WeaponOffhandSlot =
  (typeof PR20_7_WEAPON_OFFHAND_SLOTS)[number];

export interface Pr207WeaponOffhandItemEvidence {
  readonly name: string;
  readonly level: number;
  readonly type: string;
  readonly wtype: string;
  readonly classList: readonly string[];
  readonly requiredLevel: number;
  readonly physischeKennung: string;
  readonly beobachtungsFingerprint: string;
  readonly physisch: boolean;
  readonly gesperrt: boolean;
  readonly virtuellB: boolean;
}

export interface Pr207WeaponOffhandClassRules {
  readonly ctype: string;
  readonly mainhandWtypes: readonly string[];
  readonly doublehandWtypes: readonly string[];
  readonly offhandKinds: readonly string[];
}

export type Pr207WeaponOffhandBlockGrund =
  | "ACCOUNT_DRIFT"
  | "EVIDENCE_STALE"
  | "SLOT_NICHT_EXPLIZIT_WAFFE_ODER_OFFHAND"
  | "KANDIDAT_INDEX_UNGUELTIG"
  | "KANDIDAT_NICHT_PHYSISCH"
  | "KANDIDAT_GESPERRT"
  | "ALTITEM_NICHT_PHYSISCH"
  | "ALTITEM_GESPERRT"
  | "GEGENHAND_NICHT_PHYSISCH"
  | "GEGENHAND_GESPERRT"
  | "IDENTITAET_NICHT_EINDEUTIG"
  | "KLASSENREGEL_DRIFT"
  | "ITEM_KLASSENBESCHRAENKUNG"
  | "ITEM_LEVEL_ZU_HOCH"
  | "WAFFENTYP_NICHT_ERLAUBT"
  | "DOUBLEHAND_OFFHAND_BELEGT"
  | "OFFHAND_GEGENSEITE_DOUBLEHAND"
  | "OFFHAND_TYP_NICHT_ERLAUBT"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "DISPOSITION_GESPERRT";

export interface Pr207WeaponOffhandEvidence {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly merchantAccountId: string;
  readonly recipientCtype: string;
  readonly recipientLevel: number;
  readonly slot: string;
  readonly kandidatIndex: number;
  readonly kandidat: Pr207WeaponOffhandItemEvidence;
  readonly vorherigesSlotItem: Pr207WeaponOffhandItemEvidence | null;
  readonly gegenhandItem: Pr207WeaponOffhandItemEvidence | null;
  readonly klassenRegeln: Pr207WeaponOffhandClassRules;
  readonly contentVerifiziert: boolean;
  readonly dispositionErlaubt: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalesEvidenceAlterMs: number;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
}

export interface Pr207WeaponOffhandPlan {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE";
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly recipientCtype: string;
  readonly recipientLevel: number;
  readonly slot: Pr207WeaponOffhandSlot;
  readonly kandidatIndex: number;
  readonly kandidat: Pr207WeaponOffhandItemEvidence;
  readonly vorherigesSlotItem: Pr207WeaponOffhandItemEvidence | null;
  readonly gegenhandItem: Pr207WeaponOffhandItemEvidence | null;
  readonly kandidatIstDoublehand: boolean;
  readonly prestate: Readonly<{
    slotFingerprint: string | null;
    indexFingerprint: string;
    gegenhandFingerprint: string | null;
    restInventarFingerprint: string;
    restEquipmentFingerprint: string;
  }>;
  readonly expectedPostcondition: Readonly<{
    slotFingerprint: string;
    indexFingerprint: string | null;
    gegenhandFingerprint: string | null;
    restInventarFingerprint: string;
    restEquipmentFingerprint: string;
    serverSemantik: "EXPLICIT_SLOT_ATOMIC_REPLACE";
  }>;
  readonly actionContractId: "AL-ACTION-EQUIP";
  readonly recoveryContractId: "AL-RECOVERY-EQUIP";
  readonly verifierId: "AL-VERIFIER-EQUIP";
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly weaponOffhandWriteRatification: false;
}

export interface Pr207WeaponOffhandVorbereitung {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly Pr207WeaponOffhandBlockGrund[];
  readonly plan: Pr207WeaponOffhandPlan | null;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface Pr207WeaponOffhandSettlementObservation {
  readonly schemaVersion: 1;
  readonly recipient: CharacterZielBindung;
  readonly slot: string;
  readonly kandidatIndex: number;
  readonly slotFingerprint: string | null;
  readonly indexFingerprint: string | null;
  readonly gegenhandFingerprint: string | null;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
  readonly beobachtetAmMs: number;
}

export interface Pr207WeaponOffhandSettlement {
  readonly schemaVersion: 1;
  readonly klassifikation:
    | "BESTAETIGT"
    | "NICHT_AUSGEFUEHRT"
    | "TEILWEISE"
    | "UNGEKLAERT";
  readonly sameIntentRetry: false;
  readonly neuerIntentAutomatischErlaubt: false;
  readonly gruende: readonly string[];
  readonly beobachtetAmMs: number;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereBindung(bindung: CharacterZielBindung): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error("PR20_7_WEAPON_BINDUNG_UNGUELTIG");
  }
  for (const wert of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) text(wert, "PR20_7_WEAPON_BINDUNG_UNGUELTIG");
}

function validiereItem(item: Pr207WeaponOffhandItemEvidence): void {
  for (const wert of [
    item.name,
    item.type,
    item.physischeKennung,
    item.beobachtungsFingerprint,
  ]) text(wert, "PR20_7_WEAPON_ITEM_UNGUELTIG");
  if (typeof item.wtype !== "string" || item.wtype.length > 96) {
    throw new Error("PR20_7_WEAPON_ITEM_WTYPE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(item.level) || item.level < 0 || item.level > 1_000) {
    throw new Error("PR20_7_WEAPON_ITEM_LEVEL_UNGUELTIG");
  }
  if (!Number.isSafeInteger(item.requiredLevel)
      || item.requiredLevel < 0
      || item.requiredLevel > 1_000) {
    throw new Error("PR20_7_WEAPON_REQUIRED_LEVEL_UNGUELTIG");
  }
  for (const ctype of item.classList) {
    text(ctype, "PR20_7_WEAPON_ITEM_CLASS_UNGUELTIG");
  }
}

function gleicheBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.schemaVersion === b.schemaVersion
    && a.accountId === b.accountId
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

function enthaelt(rows: readonly string[], wert: string): boolean {
  return rows.includes(wert);
}

function gegenhandSlot(slot: Pr207WeaponOffhandSlot): Pr207WeaponOffhandSlot {
  return slot === "mainhand" ? "offhand" : "mainhand";
}

export function pruefePr207WeaponOffhandVorbereitung(
  evidence: Pr207WeaponOffhandEvidence,
  jetztMs: number,
): Pr207WeaponOffhandVorbereitung {
  if (evidence.schemaVersion !== 1) {
    throw new Error("PR20_7_WEAPON_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  validiereBindung(evidence.recipient);
  validiereItem(evidence.kandidat);
  if (evidence.vorherigesSlotItem !== null) {
    validiereItem(evidence.vorherigesSlotItem);
  }
  if (evidence.gegenhandItem !== null) validiereItem(evidence.gegenhandItem);
  for (const wert of [
    evidence.evidenceId,
    evidence.merchantAccountId,
    evidence.recipientCtype,
    evidence.slot,
    evidence.klassenRegeln.ctype,
    evidence.restInventarFingerprint,
    evidence.restEquipmentFingerprint,
  ]) text(wert, "PR20_7_WEAPON_EVIDENCE_TEXT_UNGUELTIG");
  zeit(evidence.beobachtetAmMs, "PR20_7_WEAPON_EVIDENCE_ZEIT_UNGUELTIG");
  zeit(evidence.gueltigBisMs, "PR20_7_WEAPON_EVIDENCE_GUELTIGKEIT_UNGUELTIG");
  zeit(jetztMs, "PR20_7_WEAPON_JETZT_UNGUELTIG");
  if (!Number.isSafeInteger(evidence.recipientLevel) || evidence.recipientLevel < 1) {
    throw new Error("PR20_7_WEAPON_RECIPIENT_LEVEL_UNGUELTIG");
  }
  if (!Number.isSafeInteger(evidence.maximalesEvidenceAlterMs)
      || evidence.maximalesEvidenceAlterMs < 1
      || evidence.maximalesEvidenceAlterMs > 60_000) {
    throw new Error("PR20_7_WEAPON_EVIDENCE_ALTER_UNGUELTIG");
  }

  const blocker: Pr207WeaponOffhandBlockGrund[] = [];
  const slot = PR20_7_WEAPON_OFFHAND_SLOTS.includes(
    evidence.slot as Pr207WeaponOffhandSlot,
  ) ? evidence.slot as Pr207WeaponOffhandSlot : null;

  if (evidence.recipient.accountId !== evidence.merchantAccountId) {
    blocker.push("ACCOUNT_DRIFT");
  }
  if (jetztMs < evidence.beobachtetAmMs
      || jetztMs > evidence.gueltigBisMs
      || jetztMs - evidence.beobachtetAmMs > evidence.maximalesEvidenceAlterMs) {
    blocker.push("EVIDENCE_STALE");
  }
  if (slot === null) blocker.push("SLOT_NICHT_EXPLIZIT_WAFFE_ODER_OFFHAND");
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
  if (evidence.gegenhandItem !== null
      && (!evidence.gegenhandItem.physisch || evidence.gegenhandItem.virtuellB)) {
    blocker.push("GEGENHAND_NICHT_PHYSISCH");
  }
  if (evidence.gegenhandItem?.gesperrt === true) {
    blocker.push("GEGENHAND_GESPERRT");
  }
  if (evidence.vorherigesSlotItem !== null
      && evidence.vorherigesSlotItem.beobachtungsFingerprint
        === evidence.kandidat.beobachtungsFingerprint) {
    blocker.push("IDENTITAET_NICHT_EINDEUTIG");
  }
  if (evidence.klassenRegeln.ctype !== evidence.recipientCtype) {
    blocker.push("KLASSENREGEL_DRIFT");
  }
  if (evidence.kandidat.classList.length > 0
      && !evidence.kandidat.classList.includes(evidence.recipientCtype)) {
    blocker.push("ITEM_KLASSENBESCHRAENKUNG");
  }
  if (evidence.kandidat.requiredLevel > evidence.recipientLevel) {
    blocker.push("ITEM_LEVEL_ZU_HOCH");
  }
  if (!evidence.contentVerifiziert) blocker.push("CONTENT_NICHT_VERIFIZIERT");
  if (!evidence.dispositionErlaubt) blocker.push("DISPOSITION_GESPERRT");

  let kandidatIstDoublehand = false;
  if (slot === "mainhand") {
    kandidatIstDoublehand = enthaelt(
      evidence.klassenRegeln.doublehandWtypes,
      evidence.kandidat.wtype,
    );
    const oneHand = enthaelt(
      evidence.klassenRegeln.mainhandWtypes,
      evidence.kandidat.wtype,
    );
    if (!oneHand && !kandidatIstDoublehand) {
      blocker.push("WAFFENTYP_NICHT_ERLAUBT");
    }
    if (kandidatIstDoublehand && evidence.gegenhandItem !== null) {
      blocker.push("DOUBLEHAND_OFFHAND_BELEGT");
    }
  } else if (slot === "offhand") {
    const gegenhandDouble = evidence.gegenhandItem !== null
      && enthaelt(
        evidence.klassenRegeln.doublehandWtypes,
        evidence.gegenhandItem.wtype,
      );
    if (gegenhandDouble) blocker.push("OFFHAND_GEGENSEITE_DOUBLEHAND");

    const typeBasiert = ["shield", "source", "quiver", "misc_offhand"]
      .includes(evidence.kandidat.type);
    const weaponBasiert = evidence.kandidat.type === "weapon"
      || evidence.kandidat.type === "tool";
    const typeErlaubt = typeBasiert
      && enthaelt(
        evidence.klassenRegeln.offhandKinds,
        evidence.kandidat.type,
      );
    const weaponErlaubt = weaponBasiert
      && enthaelt(
        evidence.klassenRegeln.offhandKinds,
        evidence.kandidat.wtype,
      );
    if (!typeErlaubt && !weaponErlaubt) {
      blocker.push("OFFHAND_TYP_NICHT_ERLAUBT");
    }
    if (weaponErlaubt
        && evidence.gegenhandItem !== null
        && !enthaelt(
          evidence.klassenRegeln.mainhandWtypes,
          evidence.gegenhandItem.wtype,
        )) {
      blocker.push("OFFHAND_GEGENSEITE_DOUBLEHAND");
    }
  }

  if (blocker.length > 0 || slot === null) {
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

  const plan: Pr207WeaponOffhandPlan = Object.freeze({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    evidenceId: evidence.evidenceId,
    recipient: Object.freeze({ ...evidence.recipient }),
    recipientCtype: evidence.recipientCtype,
    recipientLevel: evidence.recipientLevel,
    slot,
    kandidatIndex: evidence.kandidatIndex,
    kandidat: Object.freeze({ ...evidence.kandidat }),
    vorherigesSlotItem: evidence.vorherigesSlotItem === null
      ? null
      : Object.freeze({ ...evidence.vorherigesSlotItem }),
    gegenhandItem: evidence.gegenhandItem === null
      ? null
      : Object.freeze({ ...evidence.gegenhandItem }),
    kandidatIstDoublehand,
    prestate: Object.freeze({
      slotFingerprint: evidence.vorherigesSlotItem?.beobachtungsFingerprint ?? null,
      indexFingerprint: evidence.kandidat.beobachtungsFingerprint,
      gegenhandFingerprint: evidence.gegenhandItem?.beobachtungsFingerprint ?? null,
      restInventarFingerprint: evidence.restInventarFingerprint,
      restEquipmentFingerprint: evidence.restEquipmentFingerprint,
    }),
    expectedPostcondition: Object.freeze({
      slotFingerprint: evidence.kandidat.beobachtungsFingerprint,
      indexFingerprint:
        evidence.vorherigesSlotItem?.beobachtungsFingerprint ?? null,
      gegenhandFingerprint:
        evidence.gegenhandItem?.beobachtungsFingerprint ?? null,
      restInventarFingerprint: evidence.restInventarFingerprint,
      restEquipmentFingerprint: evidence.restEquipmentFingerprint,
      serverSemantik: "EXPLICIT_SLOT_ATOMIC_REPLACE",
    }),
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    weaponOffhandWriteRatification: false,
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

export function klassifizierePr207WeaponOffhandSettlement(
  plan: Pr207WeaponOffhandPlan,
  beobachtung: Pr207WeaponOffhandSettlementObservation,
): Pr207WeaponOffhandSettlement {
  validiereBindung(beobachtung.recipient);
  zeit(beobachtung.beobachtetAmMs, "PR20_7_WEAPON_SETTLEMENT_ZEIT_UNGUELTIG");
  text(beobachtung.slot, "PR20_7_WEAPON_SETTLEMENT_SLOT_UNGUELTIG");
  text(
    beobachtung.restInventarFingerprint,
    "PR20_7_WEAPON_SETTLEMENT_REST_INVENTAR_UNGUELTIG",
  );
  text(
    beobachtung.restEquipmentFingerprint,
    "PR20_7_WEAPON_SETTLEMENT_REST_EQUIPMENT_UNGUELTIG",
  );

  const gruende: string[] = [];
  if (!gleicheBindung(plan.recipient, beobachtung.recipient)) {
    gruende.push("RECIPIENT_BINDUNG_DRIFT");
  }
  if (beobachtung.slot !== plan.slot) gruende.push("SLOT_DRIFT");
  if (beobachtung.kandidatIndex !== plan.kandidatIndex) {
    gruende.push("KANDIDAT_INDEX_DRIFT");
  }
  if (beobachtung.gegenhandFingerprint
      !== plan.expectedPostcondition.gegenhandFingerprint) {
    gruende.push("GEGENHAND_DRIFT");
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

  let klassifikation: Pr207WeaponOffhandSettlement["klassifikation"];
  if (!structuralDrift && postSlot && postIndex) {
    klassifikation = "BESTAETIGT";
  } else if (!structuralDrift && preSlot && preIndex) {
    klassifikation = "NICHT_AUSGEFUEHRT";
  } else if (!structuralDrift && (postSlot || postIndex)) {
    klassifikation = "TEILWEISE";
    gruende.push("NUR_TEILMENGE_DER_WAFFEN_POSTCONDITION");
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

export function pr207WeaponGegenhandSlot(
  slot: Pr207WeaponOffhandSlot,
): Pr207WeaponOffhandSlot {
  return gegenhandSlot(slot);
}
