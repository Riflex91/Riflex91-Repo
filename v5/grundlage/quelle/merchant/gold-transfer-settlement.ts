import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export interface GoldTransferSettlementPlan {
  readonly schemaVersion: 1;
  readonly settlementId: string;
  readonly transaktionsId: string;
  readonly sender: CharacterZielBindung;
  readonly empfaenger: CharacterZielBindung;
  readonly betrag: number;
  readonly senderGoldBaseline: number;
  readonly empfaengerGoldBaseline: number;
  readonly senderBaselineFingerprint: string;
  readonly empfaengerBaselineFingerprint: string;
  readonly transferBegonnenAmMs: number;
}

export interface GoldTransferSettlementEvidence {
  readonly schemaVersion: 1;
  readonly settlementId: string;
  readonly transaktionsId: string;
  readonly senderCharacterId: string;
  readonly senderSessionId: string;
  readonly empfaengerCharacterId: string;
  readonly empfaengerSessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly senderGold: number;
  readonly empfaengerGold: number;
  readonly beobachtetAmMs: number;
  readonly senderFingerprint: string;
  readonly empfaengerFingerprint: string;
  readonly korrelationsFingerprint: string;
}

export interface GoldTransferSettlementNachweis {
  readonly schemaVersion: 1;
  readonly settlementId: string;
  readonly transaktionsId: string;
  readonly status: "BESTAETIGT";
  readonly senderAbnahme: number;
  readonly empfaengerZunahme: number;
  readonly evidenceFingerprint: string;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeGold(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function pruefeBindung(bindung: CharacterZielBindung, fehler: string): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) throw new Error(fehler);
  for (const text of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) pruefeText(text, fehler);
}

function gleicheRosterWahrheit(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

export function validiereGoldTransferSettlement(
  plan: GoldTransferSettlementPlan,
  evidence: GoldTransferSettlementEvidence,
): GoldTransferSettlementNachweis {
  if (plan.schemaVersion !== 1 || evidence.schemaVersion !== 1) {
    throw new Error("GOLD_SETTLEMENT_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(plan.sender, "GOLD_SETTLEMENT_SENDER_BINDUNG_UNGUELTIG");
  pruefeBindung(plan.empfaenger, "GOLD_SETTLEMENT_EMPFAENGER_BINDUNG_UNGUELTIG");
  if (!gleicheRosterWahrheit(plan.sender, plan.empfaenger)) {
    throw new Error("GOLD_SETTLEMENT_ROSTER_DRIFT");
  }
  for (const text of [
    plan.settlementId,
    plan.transaktionsId,
    plan.senderBaselineFingerprint,
    plan.empfaengerBaselineFingerprint,
    evidence.senderFingerprint,
    evidence.empfaengerFingerprint,
    evidence.korrelationsFingerprint,
  ]) pruefeText(text, "GOLD_SETTLEMENT_TEXT_UNGUELTIG");

  pruefeGold(plan.senderGoldBaseline, "GOLD_SETTLEMENT_SENDER_BASELINE_UNGUELTIG");
  pruefeGold(plan.empfaengerGoldBaseline, "GOLD_SETTLEMENT_EMPFAENGER_BASELINE_UNGUELTIG");
  pruefeGold(evidence.senderGold, "GOLD_SETTLEMENT_SENDER_GOLD_UNGUELTIG");
  pruefeGold(evidence.empfaengerGold, "GOLD_SETTLEMENT_EMPFAENGER_GOLD_UNGUELTIG");
  if (!Number.isSafeInteger(plan.betrag) || plan.betrag < 1) {
    throw new Error("GOLD_SETTLEMENT_BETRAG_UNGUELTIG");
  }
  if (!Number.isSafeInteger(plan.transferBegonnenAmMs)
      || plan.transferBegonnenAmMs < 0
      || !Number.isSafeInteger(evidence.beobachtetAmMs)
      || evidence.beobachtetAmMs < 0) {
    throw new Error("GOLD_SETTLEMENT_ZEIT_UNGUELTIG");
  }

  const bindungPasst =
    evidence.settlementId === plan.settlementId
    && evidence.transaktionsId === plan.transaktionsId
    && evidence.senderCharacterId === plan.sender.characterId
    && evidence.senderSessionId === plan.sender.sessionId
    && evidence.empfaengerCharacterId === plan.empfaenger.characterId
    && evidence.empfaengerSessionId === plan.empfaenger.sessionId
    && evidence.serverRegion === plan.sender.serverRegion
    && evidence.serverIdentifier === plan.sender.serverIdentifier
    && evidence.rosterEpoche === plan.sender.rosterEpoche;
  if (!bindungPasst) throw new Error("GOLD_SETTLEMENT_ZIEL_ODER_SESSION_DRIFT");
  if (evidence.beobachtetAmMs < plan.transferBegonnenAmMs) {
    throw new Error("GOLD_SETTLEMENT_EVIDENCE_ZU_ALT");
  }
  if (evidence.senderFingerprint === plan.senderBaselineFingerprint) {
    throw new Error("GOLD_SETTLEMENT_SENDER_KEIN_NEUER_ZUSTAND");
  }
  if (evidence.empfaengerFingerprint === plan.empfaengerBaselineFingerprint) {
    throw new Error("GOLD_SETTLEMENT_EMPFAENGER_KEIN_NEUER_ZUSTAND");
  }

  const senderAbnahme = plan.senderGoldBaseline - evidence.senderGold;
  const empfaengerZunahme = evidence.empfaengerGold - plan.empfaengerGoldBaseline;
  if (senderAbnahme !== plan.betrag) {
    throw new Error("GOLD_SETTLEMENT_SENDER_DELTA_NICHT_BESTAETIGT");
  }
  if (empfaengerZunahme !== plan.betrag) {
    throw new Error("GOLD_SETTLEMENT_EMPFAENGER_DELTA_NICHT_BESTAETIGT");
  }

  return Object.freeze({
    schemaVersion: 1,
    settlementId: plan.settlementId,
    transaktionsId: plan.transaktionsId,
    status: "BESTAETIGT",
    senderAbnahme,
    empfaengerZunahme,
    evidenceFingerprint: evidence.korrelationsFingerprint,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
