import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export interface EmpfaengerSettlementPlan {
  readonly schemaVersion: 1;
  readonly settlementId: string;
  readonly produktionsId: string;
  readonly ziel: CharacterZielBindung;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly erwarteteMengenZunahme: number;
  readonly baselineMenge: number;
  readonly baselineFingerprint: string;
  readonly deliveryBegonnenAmMs: number;
}

export interface EmpfaengerSettlementEvidence {
  readonly schemaVersion: 1;
  readonly settlementId: string;
  readonly produktionsId: string;
  readonly recipientCharacterId: string;
  readonly recipientSessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly beobachteteMenge: number;
  readonly beobachtetAmMs: number;
  readonly inventoryFingerprint: string;
  readonly korrelationsFingerprint: string;
}

export interface EmpfaengerSettlementNachweis {
  readonly schemaVersion: 1;
  readonly settlementId: string;
  readonly produktionsId: string;
  readonly status: "BESTAETIGT";
  readonly mengenZunahme: number;
  readonly evidenceFingerprint: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeMenge(wert: number, fehler: string): void {
  if (!Number.isInteger(wert) || wert < 0 || wert > 1_000_000) throw new Error(fehler);
}

export function validiereEmpfaengerSettlement(
  plan: EmpfaengerSettlementPlan,
  evidence: EmpfaengerSettlementEvidence,
): EmpfaengerSettlementNachweis {
  if (plan.schemaVersion !== 1 || evidence.schemaVersion !== 1) {
    throw new Error("RECIPIENT_SETTLEMENT_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    plan.settlementId,
    plan.produktionsId,
    plan.outputName,
    plan.baselineFingerprint,
    plan.ziel.accountId,
    plan.ziel.characterId,
    plan.ziel.sessionId,
    plan.ziel.serverRegion,
    plan.ziel.serverIdentifier,
    plan.ziel.rosterFingerprint,
    evidence.inventoryFingerprint,
    evidence.korrelationsFingerprint,
  ]) pruefeText(text, "RECIPIENT_SETTLEMENT_TEXT_UNGUELTIG");
  if (plan.ziel.schemaVersion !== 1) throw new Error("RECIPIENT_SETTLEMENT_ZIEL_SCHEMA_UNGUELTIG");
  pruefeMenge(plan.baselineMenge, "RECIPIENT_SETTLEMENT_BASELINE_UNGUELTIG");
  pruefeMenge(plan.erwarteteMengenZunahme, "RECIPIENT_SETTLEMENT_ERWARTETE_MENGE_UNGUELTIG");
  if (plan.erwarteteMengenZunahme < 1) throw new Error("RECIPIENT_SETTLEMENT_ERWARTETE_MENGE_UNGUELTIG");
  pruefeMenge(evidence.beobachteteMenge, "RECIPIENT_SETTLEMENT_BEOBACHTETE_MENGE_UNGUELTIG");
  if (!Number.isInteger(plan.outputLevel) || plan.outputLevel < 0 || plan.outputLevel > 99
      || !Number.isInteger(evidence.outputLevel) || evidence.outputLevel < 0 || evidence.outputLevel > 99
      || !Number.isSafeInteger(plan.deliveryBegonnenAmMs) || plan.deliveryBegonnenAmMs < 0
      || !Number.isSafeInteger(evidence.beobachtetAmMs) || evidence.beobachtetAmMs < 0) {
    throw new Error("RECIPIENT_SETTLEMENT_ZAHL_UNGUELTIG");
  }
  const bindungPasst = evidence.settlementId === plan.settlementId
    && evidence.produktionsId === plan.produktionsId
    && evidence.recipientCharacterId === plan.ziel.characterId
    && evidence.recipientSessionId === plan.ziel.sessionId
    && evidence.serverRegion === plan.ziel.serverRegion
    && evidence.serverIdentifier === plan.ziel.serverIdentifier
    && evidence.rosterEpoche === plan.ziel.rosterEpoche;
  if (!bindungPasst) throw new Error("RECIPIENT_SETTLEMENT_ZIEL_DRIFT");
  if (evidence.outputName !== plan.outputName || evidence.outputLevel !== plan.outputLevel) {
    throw new Error("RECIPIENT_SETTLEMENT_OUTPUT_DRIFT");
  }
  if (evidence.beobachtetAmMs < plan.deliveryBegonnenAmMs) {
    throw new Error("RECIPIENT_SETTLEMENT_EVIDENCE_ZU_ALT");
  }
  if (evidence.inventoryFingerprint === plan.baselineFingerprint) {
    throw new Error("RECIPIENT_SETTLEMENT_KEIN_NEUER_INVENTARSTAND");
  }
  const mengenZunahme = evidence.beobachteteMenge - plan.baselineMenge;
  if (mengenZunahme < plan.erwarteteMengenZunahme) {
    throw new Error("RECIPIENT_SETTLEMENT_MENGE_NICHT_BESTAETIGT");
  }
  return Object.freeze({
    schemaVersion: 1,
    settlementId: plan.settlementId,
    produktionsId: plan.produktionsId,
    status: "BESTAETIGT",
    mengenZunahme,
    evidenceFingerprint: evidence.korrelationsFingerprint,
  });
}
