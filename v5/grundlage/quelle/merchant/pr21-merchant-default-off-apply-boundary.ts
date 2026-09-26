import {
  bereitePr21_28GateApplyTransaktionVor,
  validierePr21_28GateApplyTransaktion,
  type Pr21_28GateApplyTransaction,
  type Pr21_28GateApplyValidation,
} from "../runtime/pr21-28-gate-apply-transaction.js";
import type {
  Pr21MerchantGateProposalBoundary,
} from "./pr21-merchant-gate-proposal-boundary.js";

export interface Pr21MerchantDefaultOffApplyRequest {
  readonly schemaVersion: 1;
  readonly proposalBoundary: Pr21MerchantGateProposalBoundary;
  readonly transactionId: string;
  readonly preparedAtMs: number;
  readonly currentMainCommit: string;
}

export interface Pr21MerchantDefaultOffApplyBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly transaction: Pr21_28GateApplyTransaction | null;
  readonly validation: Pr21_28GateApplyValidation | null;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
  readonly durableIntentCreated: false;
  readonly oneShotApplyPreparedButNotExecuted: true;
  readonly separateApplyExecutionRequired: true;
}

const STAGE = "PR21" as const;

export function bereitePr21MerchantDefaultOffApplyVor(
  request: Pr21MerchantDefaultOffApplyRequest,
): Pr21MerchantDefaultOffApplyBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_DEFAULT_OFF_APPLY_SCHEMA_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/.test(request.currentMainCommit)) {
    throw new Error("PR21_MERCHANT_DEFAULT_OFF_APPLY_MAIN_UNGUELTIG");
  }

  const boundary = request.proposalBoundary;
  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_FOR_SEPARATE_GATE_APPLY"
      || boundary.blocker.length !== 0
      || boundary.stage !== STAGE
      || boundary.currentMainMatchedRatificationSource !== true
      || boundary.packageFingerprintMatched !== true
      || boundary.featureGateProductiveEligible !== true
      || boundary.separateApplyRequired !== true
      || boundary.requiresFreshMainCheckAtApply !== true
      || boundary.gateMutationPerformed !== false
      || boundary.authorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || boundary.proposal.status !== "READY_FOR_SEPARATE_GATE_APPLY"
      || boundary.proposal.stage !== STAGE) {
    throw new Error("PR21_MERCHANT_DEFAULT_OFF_APPLY_PROPOSAL_NICHT_BEREIT");
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

  const blocker = validation.status === "READY_DEFAULT_OFF"
    ? []
    : [...validation.blocker];

  if (transaction.stage !== STAGE
      || transaction.applyAdapterInstalled !== false
      || transaction.executionEnabled !== false
      || transaction.gateMutationPerformed !== false
      || transaction.authorityIssued !== false
      || transaction.broadRuntimeGrant !== false
      || transaction.sameIntentRetryAllowed !== false
      || transaction.durableIntentRequiredBeforeApply !== true
      || transaction.oneShotApplyRequired !== true
      || transaction.postconditionVerificationRequired !== true
      || transaction.unknownOutcomeRequiresReconciliation !== true) {
    blocker.push("PR21_MERCHANT_DEFAULT_OFF_APPLY_TRANSACTION_BOUNDARY_DRIFT");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "READY_DEFAULT_OFF" : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    stage: STAGE,
    transaction,
    validation,
    applyAdapterInstalled: false,
    executionEnabled: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
    durableIntentCreated: false,
    oneShotApplyPreparedButNotExecuted: true,
    separateApplyExecutionRequired: true,
  });
}
