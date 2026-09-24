import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export const PR20_7_WEAPON_EXPLICIT_SLOTS = Object.freeze([
  "mainhand",
  "offhand",
] as const);

export type Pr207WeaponExplicitSlot =
  (typeof PR20_7_WEAPON_EXPLICIT_SLOTS)[number];

export type Pr207WeaponBlockGrund =
  | "ACCOUNT_DRIFT"
  | "SESSION_DRIFT"
  | "SERVER_DRIFT"
  | "ROSTER_DRIFT"
  | "EVIDENCE_STALE"
  | "SLOT_NICHT_EXPLIZIT"
  | "ITEM_NICHT_WEAPON"
  | "KANDIDAT_NICHT_PHYSISCH"
  | "KANDIDAT_GESPERRT"
  | "KANDIDAT_VIRTUELL"
  | "ZIELSLOT_ITEM_NICHT_PHYSISCH"
  | "ZIELSLOT_ITEM_GESPERRT"
  | "ZIELSLOT_ITEM_VIRTUELL"
  | "KLASSE_NICHT_VERIFIZIERT"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "DISPOSITION_GESPERRT"
  | "MAINHAND_WTYPE_NICHT_ERLAUBT"
  | "OFFHAND_WTYPE_NICHT_ERLAUBT"
  | "DOUBLEHAND_OFFHAND_BELEGT"
  | "OFFHAND_NEBEN_DOUBLEHAND_VERBOTEN"
  | "MAINHAND_EVIDENCE_FEHLT"
  | "IDENTITAET_NICHT_EINDEUTIG";

export interface Pr207WeaponItemEvidence {
  readonly name: string;
  readonly level: number;
  readonly type: string;
  readonly wtype: string;
  readonly physischeKennung: string;
  readonly beobachtungsFingerprint: string;
  readonly physisch: boolean;
  readonly gesperrt: boolean;
  readonly virtuellB: boolean;
}

export interface Pr207WeaponClassEvidence {
  readonly ctype: string;
  readonly mainhandWtypes: readonly string[];
  readonly offhandWtypes: readonly string[];
  readonly doublehandWtypes: readonly string[];
  readonly sourceFingerprint: string;
  readonly verifiziert: boolean;
}

export interface Pr207WeaponSlotEvidence {
  readonly mainhand: Pr207WeaponItemEvidence | null;
  readonly offhand: Pr207WeaponItemEvidence | null;
}

export interface Pr207WeaponEvidence {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly merchantAccountId: string;
  readonly requestedSlot: string;
  readonly kandidatIndex: number;
  readonly kandidat: Pr207WeaponItemEvidence;
  readonly slots: Pr207WeaponSlotEvidence;
  readonly klasse: Pr207WeaponClassEvidence;
  readonly contentVerifiziert: boolean;
  readonly dispositionErlaubt: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalesEvidenceAlterMs: number;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
  readonly evidenceFingerprint: string;
}

export interface Pr207WeaponPlan {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE";
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly slot: Pr207WeaponExplicitSlot;
  readonly kandidatIndex: number;
  readonly kandidat: Pr207WeaponItemEvidence;
  readonly vorherigesSlotItem: Pr207WeaponItemEvidence | null;
  readonly mainhandPrestateFingerprint: string | null;
  readonly offhandPrestateFingerprint: string | null;
  readonly classEvidenceFingerprint: string;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
  readonly offhandLeerErforderlich: boolean;
  readonly expliziteSlotAufloesung: true;
  readonly serverCanEquipAutoWeaponSlotVerboten: true;
  readonly actionContractId: "AL-ACTION-EQUIP";
  readonly recoveryContractId: "AL-RECOVERY-EQUIP";
  readonly verifierId: "AL-VERIFIER-EQUIP";
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly weaponWriteRatification: false;
}

export interface Pr207WeaponVorbereitung {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly Pr207WeaponBlockGrund[];
  readonly plan: Pr207WeaponPlan | null;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereItem(item: Pr207WeaponItemEvidence): void {
  for (const wert of [
    item.name,
    item.type,
    item.wtype,
    item.physischeKennung,
    item.beobachtungsFingerprint,
  ]) text(wert, "PR20_7_WEAPON_ITEM_UNGUELTIG");
  if (!Number.isSafeInteger(item.level) || item.level < 0 || item.level > 1_000) {
    throw new Error("PR20_7_WEAPON_ITEM_LEVEL_UNGUELTIG");
  }
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

function unveraendert<T>(wert: T): Readonly<T> {
  return Object.freeze(wert);
}

export function pruefePr207WeaponVorbereitung(
  evidence: Pr207WeaponEvidence,
  jetztMs: number,
): Pr207WeaponVorbereitung {
  if (evidence.schemaVersion !== 1) {
    throw new Error("PR20_7_WEAPON_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  validiereBindung(evidence.recipient);
  validiereItem(evidence.kandidat);
  if (evidence.slots.mainhand !== null) validiereItem(evidence.slots.mainhand);
  if (evidence.slots.offhand !== null) validiereItem(evidence.slots.offhand);
  for (const wert of [
    evidence.evidenceId,
    evidence.merchantAccountId,
    evidence.requestedSlot,
    evidence.klasse.ctype,
    evidence.klasse.sourceFingerprint,
    evidence.restInventarFingerprint,
    evidence.restEquipmentFingerprint,
    evidence.evidenceFingerprint,
  ]) text(wert, "PR20_7_WEAPON_EVIDENCE_TEXT_UNGUELTIG");
  zeit(evidence.beobachtetAmMs, "PR20_7_WEAPON_EVIDENCE_ZEIT_UNGUELTIG");
  zeit(evidence.gueltigBisMs, "PR20_7_WEAPON_EVIDENCE_GUELTIGKEIT_UNGUELTIG");
  zeit(jetztMs, "PR20_7_WEAPON_JETZT_UNGUELTIG");
  if (!Number.isInteger(evidence.kandidatIndex)
      || evidence.kandidatIndex < 0
      || evidence.kandidatIndex >= 128) {
    throw new Error("PR20_7_WEAPON_INDEX_UNGUELTIG");
  }
  if (!Number.isSafeInteger(evidence.maximalesEvidenceAlterMs)
      || evidence.maximalesEvidenceAlterMs < 1
      || evidence.maximalesEvidenceAlterMs > 60_000) {
    throw new Error("PR20_7_WEAPON_EVIDENCE_ALTER_UNGUELTIG");
  }

  const blocker: Pr207WeaponBlockGrund[] = [];
  const slot = PR20_7_WEAPON_EXPLICIT_SLOTS.includes(
    evidence.requestedSlot as Pr207WeaponExplicitSlot,
  )
    ? evidence.requestedSlot as Pr207WeaponExplicitSlot
    : null;

  if (evidence.recipient.accountId !== evidence.merchantAccountId) {
    blocker.push("ACCOUNT_DRIFT");
  }
  if (jetztMs < evidence.beobachtetAmMs
      || jetztMs > evidence.gueltigBisMs
      || jetztMs - evidence.beobachtetAmMs > evidence.maximalesEvidenceAlterMs) {
    blocker.push("EVIDENCE_STALE");
  }
  if (slot === null) blocker.push("SLOT_NICHT_EXPLIZIT");
  if (evidence.kandidat.type !== "weapon") blocker.push("ITEM_NICHT_WEAPON");
  if (!evidence.kandidat.physisch) blocker.push("KANDIDAT_NICHT_PHYSISCH");
  if (evidence.kandidat.gesperrt) blocker.push("KANDIDAT_GESPERRT");
  if (evidence.kandidat.virtuellB) blocker.push("KANDIDAT_VIRTUELL");
  if (!evidence.klasse.verifiziert) blocker.push("KLASSE_NICHT_VERIFIZIERT");
  if (!evidence.contentVerifiziert) blocker.push("CONTENT_NICHT_VERIFIZIERT");
  if (!evidence.dispositionErlaubt) blocker.push("DISPOSITION_GESPERRT");

  const previous = slot === null ? null : evidence.slots[slot];
  if (previous !== null) {
    if (!previous.physisch) blocker.push("ZIELSLOT_ITEM_NICHT_PHYSISCH");
    if (previous.gesperrt) blocker.push("ZIELSLOT_ITEM_GESPERRT");
    if (previous.virtuellB) blocker.push("ZIELSLOT_ITEM_VIRTUELL");
    if (previous.beobachtungsFingerprint
        === evidence.kandidat.beobachtungsFingerprint) {
      blocker.push("IDENTITAET_NICHT_EINDEUTIG");
    }
  }

  const candidateWtype = evidence.kandidat.wtype;
  const candidateDoublehand =
    evidence.klasse.doublehandWtypes.includes(candidateWtype);

  if (slot === "mainhand") {
    const mainAllowed = evidence.klasse.mainhandWtypes.includes(candidateWtype);
    if (candidateDoublehand) {
      if (evidence.slots.offhand !== null) {
        blocker.push("DOUBLEHAND_OFFHAND_BELEGT");
      }
    } else if (!mainAllowed) {
      blocker.push("MAINHAND_WTYPE_NICHT_ERLAUBT");
    }
  } else if (slot === "offhand") {
    if (!evidence.klasse.offhandWtypes.includes(candidateWtype)) {
      blocker.push("OFFHAND_WTYPE_NICHT_ERLAUBT");
    }
    const main = evidence.slots.mainhand;
    if (main !== null) {
      if (!main.physisch || main.virtuellB) {
        blocker.push("MAINHAND_EVIDENCE_FEHLT");
      } else if (evidence.klasse.doublehandWtypes.includes(main.wtype)) {
        blocker.push("OFFHAND_NEBEN_DOUBLEHAND_VERBOTEN");
      } else if (!evidence.klasse.mainhandWtypes.includes(main.wtype)) {
        blocker.push("MAINHAND_EVIDENCE_FEHLT");
      }
    }
  }

  if (blocker.length > 0 || slot === null) {
    return unveraendert({
      schemaVersion: 1,
      status: "BLOCKIERT",
      blocker: unveraendert([...new Set(blocker)]),
      plan: null,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  const plan: Pr207WeaponPlan = unveraendert({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    evidenceId: evidence.evidenceId,
    recipient: unveraendert({ ...evidence.recipient }),
    slot,
    kandidatIndex: evidence.kandidatIndex,
    kandidat: unveraendert({ ...evidence.kandidat }),
    vorherigesSlotItem: previous === null
      ? null
      : unveraendert({ ...previous }),
    mainhandPrestateFingerprint:
      evidence.slots.mainhand?.beobachtungsFingerprint ?? null,
    offhandPrestateFingerprint:
      evidence.slots.offhand?.beobachtungsFingerprint ?? null,
    classEvidenceFingerprint: evidence.klasse.sourceFingerprint,
    restInventarFingerprint: evidence.restInventarFingerprint,
    restEquipmentFingerprint: evidence.restEquipmentFingerprint,
    offhandLeerErforderlich: slot === "mainhand" && candidateDoublehand,
    expliziteSlotAufloesung: true,
    serverCanEquipAutoWeaponSlotVerboten: true,
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    weaponWriteRatification: false,
  });

  return unveraendert({
    schemaVersion: 1,
    status: "BEREIT_NO_WRITE",
    blocker: unveraendert([]),
    plan,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
