import type {
  Pr21_28GateApplyTransaction,
} from "./pr21-28-gate-apply-transaction.js";

export type Pr21_28GateApplyObservedState =
  | "NOT_APPLIED"
  | "POSTCONDITION_TRUE"
  | "POSTCONDITION_FALSE"
  | "UNKNOWN";

export interface Pr21_28GateApplyReconciliationRequest {
  readonly schemaVersion: 1;
  readonly transaction: Pr21_28GateApplyTransaction;
  readonly observedState: Pr21_28GateApplyObservedState;
  readonly mutationAttemptObserved: boolean;
  readonly durableIntentObserved: boolean;
  readonly terminalSettlementObserved: boolean;
}

export interface Pr21_28GateApplyReconciliation {
  readonly schemaVersion: 1;
  readonly status:
    | "DEFAULT_OFF_NO_APPLY"
    | "ALREADY_APPLIED_REQUIRES_RECORD_ONLY"
    | "BLOCKIERT_RECONCILIATION_REQUIRED";
  readonly blocker: readonly string[];
  readonly sameIntentRetryAllowed: false;
  readonly newApplyAttemptAllowed: false;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformedByReconciler: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
}

export function reconcilePr21_28GateApply(
  request: Pr21_28GateApplyReconciliationRequest,
): Pr21_28GateApplyReconciliation {
  if (request.schemaVersion !== 1
      || request.transaction.schemaVersion !== 1
      || request.transaction.sameIntentRetryAllowed !== false
      || request.transaction.applyAdapterInstalled !== false
      || request.transaction.executionEnabled !== false
      || request.transaction.cap022FullChainSatisfied !== true
      || request.transaction.cap022FullChainRequired
        !== (request.transaction.stage === "PR22"
          || request.transaction.stage === "PR23")) {
    throw new Error("PR21_28_GATE_APPLY_RECONCILIATION_INPUT_UNGUELTIG");
  }

  const blocker: string[] = [];
  let status: Pr21_28GateApplyReconciliation["status"];

  if (!request.mutationAttemptObserved) {
    if (request.observedState !== "NOT_APPLIED") {
      blocker.push("PR21_28_GATE_APPLY_STATE_OHNE_MUTATION_DRIFT");
    }
    if (request.durableIntentObserved || request.terminalSettlementObserved) {
      blocker.push("PR21_28_GATE_APPLY_LEDGER_OHNE_MUTATION_DRIFT");
    }
    status = blocker.length === 0
      ? "DEFAULT_OFF_NO_APPLY"
      : "BLOCKIERT_RECONCILIATION_REQUIRED";
  } else if (request.observedState === "POSTCONDITION_TRUE") {
    if (!request.durableIntentObserved) {
      blocker.push("PR21_28_GATE_APPLY_POSTCONDITION_OHNE_DURABLE_INTENT");
    }
    if (!request.terminalSettlementObserved) {
      blocker.push("PR21_28_GATE_APPLY_TERMINAL_SETTLEMENT_FEHLT");
    }
    status = blocker.length === 0
      ? "ALREADY_APPLIED_REQUIRES_RECORD_ONLY"
      : "BLOCKIERT_RECONCILIATION_REQUIRED";
  } else {
    blocker.push("PR21_28_GATE_APPLY_UNKNOWN_ODER_UNVERIFIZIERT");
    status = "BLOCKIERT_RECONCILIATION_REQUIRED";
  }

  return Object.freeze({
    schemaVersion: 1,
    status,
    blocker: Object.freeze([...new Set(blocker)]),
    sameIntentRetryAllowed: false,
    newApplyAttemptAllowed: false,
    applyAdapterInstalled: false,
    executionEnabled: false,
    gateMutationPerformedByReconciler: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
  });
}
