import { PersistVorMutationTor } from "../persistenz/journal.js";
import type {
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "../persistenz/ports.js";
import {
  klassifizierePr207GearSwapSettlement,
  type Pr207GearSwapPlan,
  type Pr207GearSwapSettlementObservation,
} from "./pr20-7-gear-swap-vorbereitung.js";
import type {
  Pr207GearSwapOneShotAuthority,
} from "./pr20-7-gear-swap-one-shot-authority.js";

export interface Pr207GearSwapDurableIntentAnforderung {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly plan: Pr207GearSwapPlan;
  readonly authority: Pr207GearSwapOneShotAuthority;
  readonly jetztMs: number;
  readonly equipmentFenceEpoche: number;
  readonly inventoryFenceEpoche: number;
}

export interface Pr207GearSwapDurableIntentErgebnis {
  readonly schemaVersion: 1;
  readonly status: "INTENT_DURABLE_NO_WRITE";
  readonly transaktionsId: string;
  readonly journalId: string;
  readonly durable: true;
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly sameIntentRetry: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
}

export interface Pr207GearSwapReconcileErgebnis {
  readonly schemaVersion: 1;
  readonly status:
    | "COMMITTED"
    | "NOT_APPLIED"
    | "PARTIAL_OPERATOR_REQUIRED"
    | "UNKNOWN_OPERATOR_REQUIRED";
  readonly settlement:
    | "BESTAETIGT"
    | "NICHT_AUSGEFUEHRT"
    | "TEILWEISE"
    | "UNGEKLAERT";
  readonly sameIntentRetry: false;
  readonly neuerIntentAutomatischErlaubt: false;
  readonly gameplayWrites: 0;
  readonly rawWriteCalls: 0;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly gruende: readonly string[];
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

export async function persistierePr207GearSwapDurableIntent(
  a: Pr207GearSwapDurableIntentAnforderung,
  journal: TransaktionsJournalPort,
): Promise<Pr207GearSwapDurableIntentErgebnis> {
  if (a.schemaVersion !== 1) {
    throw new Error("PR20_7_GEAR_DURABLE_INTENT_SCHEMA_UNGUELTIG");
  }
  for (const wert of [a.transaktionsId, a.auftragId, a.ablaufId]) {
    text(wert, "PR20_7_GEAR_DURABLE_INTENT_ID_UNGUELTIG");
  }
  zeit(a.jetztMs, "PR20_7_GEAR_DURABLE_INTENT_ZEIT_UNGUELTIG");

  const authority = a.authority.daten();
  if (authority.transaktionsId !== a.transaktionsId) {
    throw new Error("PR20_7_GEAR_DURABLE_INTENT_TX_BINDUNG_DRIFT");
  }

  const pruefung = a.authority.pruefeExakteBindung(
    a.plan,
    a.jetztMs,
    a.equipmentFenceEpoche,
    a.inventoryFenceEpoche,
  );
  if (!pruefung.erlaubt) {
    throw new Error(pruefung.grund);
  }

  const intent: TransaktionsJournalEintrag = Object.freeze({
    schemaVersion: 1,
    journalId: a.transaktionsId + ":1",
    transaktionsId: a.transaktionsId,
    sequenz: 1,
    art: "INTENT",
    zeitMs: a.jetztMs,
    inhalt: Object.freeze({
      auftrag_id: a.auftragId,
      ablauf_id: a.ablaufId,
      action_contract_id: a.plan.actionContractId,
      recovery_contract_id: a.plan.recoveryContractId,
      verifier_id: a.plan.verifierId,
      attempt_id: a.transaktionsId + ":attempt:1",
      evidence_id: a.plan.evidenceId,
      recipient_character_id: a.plan.recipient.characterId,
      recipient_session_id: a.plan.recipient.sessionId,
      roster_epoche: a.plan.recipient.rosterEpoche,
      roster_fingerprint: a.plan.recipient.rosterFingerprint,
      server_region: a.plan.recipient.serverRegion,
      server_identifier: a.plan.recipient.serverIdentifier,
      slot: a.plan.slot,
      kandidat_index: a.plan.kandidatIndex,
      pinned_prestate: Object.freeze({ ...a.plan.prestate }),
      expected_postcondition: Object.freeze({ ...a.plan.expectedPostcondition }),
      resource_claims_and_fencing: authority.resourceClaims.map(
        claim => Object.freeze({
          ressourcenId: claim.ressourcenId,
          epoche: claim.epoche,
        }),
      ),
      send_boundary_state: "NICHT_GESENDET",
      same_intent_retry: false,
      gameplay_authority: false,
      raw_write_authority: false,
      swap_write_ratification: false,
    }),
  });

  const token = await new PersistVorMutationTor(journal).persistiereIntent(intent);
  return Object.freeze({
    schemaVersion: 1,
    status: "INTENT_DURABLE_NO_WRITE",
    transaktionsId: a.transaktionsId,
    journalId: token.journalId,
    durable: true,
    sendBoundaryState: "NICHT_GESENDET",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
  });
}

export function reconcilePr207GearSwapNachMoeglichemSend(
  plan: Pr207GearSwapPlan,
  beobachtung: Pr207GearSwapSettlementObservation,
): Pr207GearSwapReconcileErgebnis {
  const settlement = klassifizierePr207GearSwapSettlement(plan, beobachtung);
  let status: Pr207GearSwapReconcileErgebnis["status"];
  switch (settlement.klassifikation) {
    case "BESTAETIGT":
      status = "COMMITTED";
      break;
    case "NICHT_AUSGEFUEHRT":
      status = "NOT_APPLIED";
      break;
    case "TEILWEISE":
      status = "PARTIAL_OPERATOR_REQUIRED";
      break;
    default:
      status = "UNKNOWN_OPERATOR_REQUIRED";
      break;
  }
  return Object.freeze({
    schemaVersion: 1,
    status,
    settlement: settlement.klassifikation,
    sameIntentRetry: false,
    neuerIntentAutomatischErlaubt: false,
    gameplayWrites: 0,
    rawWriteCalls: 0,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    gruende: Object.freeze([...settlement.gruende]),
  });
}
