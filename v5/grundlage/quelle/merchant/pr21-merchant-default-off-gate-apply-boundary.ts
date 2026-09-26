import {
  bereitePr21_28GateApplyTransaktionVor,
  validierePr21_28GateApplyTransaktion,
  type Pr21_28GateApplyTransaction,
  type Pr21_28GateApplyValidation,
} from "../runtime/pr21-28-gate-apply-transaction.js";
import {
  reconcilePr21_28GateApply,
  type Pr21_28GateApplyReconciliation,
} from "../runtime/pr21-28-gate-apply-reconciliation.js";
import type { Pr21MerchantGateProposalBoundary } from "./pr21-merchant-gate-proposal-boundary.js";

export interface Pr21MerchantDefaultOffGateApplyRequest {
  readonly schemaVersion: 1;
  readonly currentMainCommit: string;
  readonly transactionId: string;
  readonly preparedAtMs: number;
  readonly proposalBoundary: Pr21MerchantGateProposalBoundary;
}

export interface Pr21MerchantDefaultOffGateApplyBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF_NO_APPLY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly currentMainCommit: string;
  readonly transaction: Pr21_28GateApplyTransaction | null;
  readonly validation: Pr21_28GateApplyValidation | null;
  readonly reconciliation: Pr21_28GateApplyReconciliation | null;
  readonly freshMainMatchedProposalSource: boolean;
  readonly transactionPreparedDefaultOff: boolean;
  readonly transactionValidatedDefaultOff: boolean;
  readonly reconciliationConfirmedNoApply: boolean;
  readonly durableIntentCreated: false;
  readonly mutationAttemptObserved: false;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

const STAGE = "PR21" as const;

export function bereitePr21MerchantDefaultOffGateApplyVor(
  request: Pr21MerchantDefaultOffGateApplyRequest,
): Pr21MerchantDefaultOffGateApplyBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_GATE_APPLY_SCHEMA_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/.test(request.currentMainCommit)) {
    throw new Error("PR21_MERCHANT_GATE_APPLY_MAIN_UNGUELTIG");
  }

  const boundary = request.proposalBoundary;
  const blocker: string[] = [];

  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_FOR_SEPARATE_GATE_APPLY"
      || boundary.blocker.length !== 0
      || boundary.stage !== STAGE
      || boundary.proposal.stage !== STAGE
      || boundary.separateApplyRequired !== true
      || boundary.requiresFreshMainCheckAtApply !== true
      || boundary.gateMutationPerformed !== false
      || boundary.authorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_PROPOSAL_BOUNDARY_NICHT_BEREIT");
  }

  if (request.currentMainCommit !== boundary.sourceMainCommit) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_MAIN_STALE");
  }

  if (blocker.length > 0) {
    return Object.freeze({
      schemaVersion: 1,
      status: "BLOCKIERT",
      blocker: Object.freeze([...new Set(blocker)]),
      stage: STAGE,
      currentMainCommit: request.currentMainCommit,
      transaction: null,
      validation: null,
      reconciliation: null,
      freshMainMatchedProposalSource:
        request.currentMainCommit === boundary.sourceMainCommit,
      transactionPreparedDefaultOff: false,
      transactionValidatedDefaultOff: false,
      reconciliationConfirmedNoApply: false,
      durableIntentCreated: false,
      mutationAttemptObserved: false,
      applyAdapterInstalled: false,
      executionEnabled: false,
      gateMutationPerformed: false,
      authorityIssued: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      broadRuntimeGrant: false,
      normalRuntimeAllowed: false,
    });
  }

  const transaction = bereitePr21_28GateApplyTransaktionVor(
    boundary.proposal,
    request.transactionId,
    request.preparedAtMs,
  );

  const validation = validierePr21_28GateApplyTransaktion(
    transaction,
    request.currentMainCommit,
    STAGE,
    boundary.packageFingerprint,
    boundary.ratificationFingerprint,
  );

  const reconciliation = reconcilePr21_28GateApply({
    schemaVersion: 1,
    transaction,
    observedState: "NOT_APPLIED",
    mutationAttemptObserved: false,
    durableIntentObserved: false,
    terminalSettlementObserved: false,
  });

  const ready = validation.status === "READY_DEFAULT_OFF"
    && validation.blocker.length === 0
    && validation.applyAdapterInstalled === false
    && validation.executionEnabled === false
    && validation.gateMutationPerformed === false
    && validation.authorityIssued === false
    && reconciliation.status === "DEFAULT_OFF_NO_APPLY"
    && reconciliation.blocker.length === 0
    && reconciliation.newApplyAttemptAllowed === false
    && reconciliation.sameIntentRetryAllowed === false
    && reconciliation.applyAdapterInstalled === false
    && reconciliation.executionEnabled === false
    && reconciliation.gateMutationPerformedByReconciler === false
    && reconciliation.authorityIssued === false
    && reconciliation.broadRuntimeGrant === false;

  return Object.freeze({
    schemaVersion: 1,
    status: ready ? "READY_DEFAULT_OFF_NO_APPLY" : "BLOCKIERT",
    blocker: ready
      ? Object.freeze([])
      : Object.freeze([
          "PR21_MERCHANT_GATE_APPLY_DEFAULT_OFF_VALIDIERUNG_FEHLGESCHLAGEN",
        ]),
    stage: STAGE,
    currentMainCommit: request.currentMainCommit,
    transaction,
    validation,
    reconciliation,
    freshMainMatchedProposalSource: true,
    transactionPreparedDefaultOff:
      transaction.status === "PREPARED_DEFAULT_OFF",
    transactionValidatedDefaultOff:
      validation.status === "READY_DEFAULT_OFF",
    reconciliationConfirmedNoApply:
      reconciliation.status === "DEFAULT_OFF_NO_APPLY",
    durableIntentCreated: false,
    mutationAttemptObserved: false,
    applyAdapterInstalled: false,
    executionEnabled: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
