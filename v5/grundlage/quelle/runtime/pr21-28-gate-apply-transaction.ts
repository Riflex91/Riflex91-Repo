import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21_28GateAdvanceProposal,
} from "./pr21-28-gate-advance-proposal.js";
import type { Pr21_28GateStage } from "./pr21-28-feature-gates.js";

export interface Pr21_28GateApplyTransactionBasis {
  readonly schemaVersion: 1;
  readonly transactionId: string;
  readonly stage: Pr21_28GateStage;
  readonly operationKey: string;
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: true;
  readonly preparedAtMs: number;
  readonly status: "PREPARED_DEFAULT_OFF";
  readonly freshMainCheckRequiredAtApply: true;
  readonly durableIntentRequiredBeforeApply: true;
  readonly oneShotApplyRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gesamtfreigabeRequiredSeparately: true;
}

export interface Pr21_28GateApplyTransaction
  extends Pr21_28GateApplyTransactionBasis {
  readonly transactionFingerprint: string;
}

export interface Pr21_28GateApplyValidation {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly transactionFingerprint: string;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: boolean;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
}

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
}

function freezeBasis(
  basis: Pr21_28GateApplyTransactionBasis,
): Pr21_28GateApplyTransactionBasis {
  return Object.freeze({ ...basis });
}

export function bereitePr21_28GateApplyTransaktionVor(
  proposal: Pr21_28GateAdvanceProposal,
  transactionId: string,
  preparedAtMs: number,
): Pr21_28GateApplyTransaction {
  if (proposal.schemaVersion !== 1
      || proposal.status !== "READY_FOR_SEPARATE_GATE_APPLY"
      || proposal.requiresFreshMainCheckAtApply !== true
      || proposal.separateApplyRequired !== true
      || proposal.gateMutationPerformed !== false
      || proposal.authorityIssued !== false
      || proposal.gameplayAuthority !== false
      || proposal.rawWriteAuthority !== false
      || proposal.broadRuntimeGrant !== false
      || proposal.gesamtfreigabeRequiredSeparately !== true
      || proposal.cap022FullChainSatisfied !== true
      || proposal.cap022FullChainRequired
        !== (proposal.stage === "PR22" || proposal.stage === "PR23")) {
    throw new Error("PR21_28_GATE_APPLY_PROPOSAL_NICHT_BEREIT");
  }
  text(transactionId, "PR21_28_GATE_APPLY_TRANSACTION_ID_UNGUELTIG");
  if (!Number.isSafeInteger(preparedAtMs) || preparedAtMs < 0) {
    throw new Error("PR21_28_GATE_APPLY_ZEIT_UNGUELTIG");
  }

  const operationKey = [
    "pr21-28-gate-apply",
    proposal.stage,
    proposal.packageFingerprint,
    proposal.ratificationFingerprint,
  ].join(":");

  const basis = freezeBasis({
    schemaVersion: 1,
    transactionId,
    stage: proposal.stage,
    operationKey,
    sourceMainCommit: proposal.sourceMainCommit,
    packageFingerprint: proposal.packageFingerprint,
    ratificationFingerprint: proposal.ratificationFingerprint,
    cap022FullChainRequired: proposal.cap022FullChainRequired,
    cap022FullChainSatisfied: true,
    preparedAtMs,
    status: "PREPARED_DEFAULT_OFF",
    freshMainCheckRequiredAtApply: true,
    durableIntentRequiredBeforeApply: true,
    oneShotApplyRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    applyAdapterInstalled: false,
    executionEnabled: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gesamtfreigabeRequiredSeparately: true,
  });

  return Object.freeze({
    ...basis,
    transactionFingerprint: evidenceFingerprint(basis),
  });
}

export function validierePr21_28GateApplyTransaktion(
  transaction: Pr21_28GateApplyTransaction,
  currentMainCommit: string,
  expectedStage: Pr21_28GateStage,
  expectedPackageFingerprint: string,
  expectedRatificationFingerprint: string,
): Pr21_28GateApplyValidation {
  if (!/^[0-9a-f]{40}$/.test(currentMainCommit)) {
    throw new Error("PR21_28_GATE_APPLY_CURRENT_MAIN_UNGUELTIG");
  }
  if (!/^[0-9a-f]{16}$/.test(expectedPackageFingerprint)
      || !/^[0-9a-f]{16}$/.test(expectedRatificationFingerprint)) {
    throw new Error("PR21_28_GATE_APPLY_EXPECTED_FP_UNGUELTIG");
  }

  const blocker: string[] = [];
  if (transaction.schemaVersion !== 1
      || transaction.status !== "PREPARED_DEFAULT_OFF") {
    blocker.push("PR21_28_GATE_APPLY_TRANSACTION_STATUS_UNGUELTIG");
  }
  if (transaction.stage !== expectedStage) {
    blocker.push("PR21_28_GATE_APPLY_STAGE_DRIFT");
  }
  if (transaction.sourceMainCommit !== currentMainCommit) {
    blocker.push("PR21_28_GATE_APPLY_MAIN_STALE");
  }
  if (transaction.packageFingerprint !== expectedPackageFingerprint) {
    blocker.push("PR21_28_GATE_APPLY_PACKAGE_FP_DRIFT");
  }
  if (transaction.ratificationFingerprint !== expectedRatificationFingerprint) {
    blocker.push("PR21_28_GATE_APPLY_RATIFICATION_FP_DRIFT");
  }
  const cap022FullChainRequired =
    expectedStage === "PR22" || expectedStage === "PR23";
  if (transaction.cap022FullChainRequired !== cap022FullChainRequired
      || transaction.cap022FullChainSatisfied !== true) {
    blocker.push("PR21_28_GATE_APPLY_CAP022_BINDING_UNGUELTIG");
  }
  if (transaction.applyAdapterInstalled !== false
      || transaction.executionEnabled !== false
      || transaction.gateMutationPerformed !== false
      || transaction.authorityIssued !== false
      || transaction.broadRuntimeGrant !== false
      || transaction.gesamtfreigabeRequiredSeparately !== true
      || transaction.sameIntentRetryAllowed !== false
      || transaction.durableIntentRequiredBeforeApply !== true
      || transaction.postconditionVerificationRequired !== true
      || transaction.unknownOutcomeRequiresReconciliation !== true) {
    blocker.push("PR21_28_GATE_APPLY_BOUNDARY_UNSAFE");
  }

  const basis: Pr21_28GateApplyTransactionBasis = Object.freeze({
    schemaVersion: transaction.schemaVersion,
    transactionId: transaction.transactionId,
    stage: transaction.stage,
    operationKey: transaction.operationKey,
    sourceMainCommit: transaction.sourceMainCommit,
    packageFingerprint: transaction.packageFingerprint,
    ratificationFingerprint: transaction.ratificationFingerprint,
    cap022FullChainRequired: transaction.cap022FullChainRequired,
    cap022FullChainSatisfied: transaction.cap022FullChainSatisfied,
    preparedAtMs: transaction.preparedAtMs,
    status: transaction.status,
    freshMainCheckRequiredAtApply: transaction.freshMainCheckRequiredAtApply,
    durableIntentRequiredBeforeApply: transaction.durableIntentRequiredBeforeApply,
    oneShotApplyRequired: transaction.oneShotApplyRequired,
    sameIntentRetryAllowed: transaction.sameIntentRetryAllowed,
    postconditionVerificationRequired: transaction.postconditionVerificationRequired,
    unknownOutcomeRequiresReconciliation: transaction.unknownOutcomeRequiresReconciliation,
    applyAdapterInstalled: transaction.applyAdapterInstalled,
    executionEnabled: transaction.executionEnabled,
    gateMutationPerformed: transaction.gateMutationPerformed,
    authorityIssued: transaction.authorityIssued,
    broadRuntimeGrant: transaction.broadRuntimeGrant,
    gesamtfreigabeRequiredSeparately: transaction.gesamtfreigabeRequiredSeparately,
  });
  if (evidenceFingerprint(basis) !== transaction.transactionFingerprint) {
    blocker.push("PR21_28_GATE_APPLY_TRANSACTION_FP_DRIFT");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "READY_DEFAULT_OFF" : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    transactionFingerprint: transaction.transactionFingerprint,
    cap022FullChainRequired,
    cap022FullChainSatisfied:
      transaction.cap022FullChainRequired === cap022FullChainRequired
      && transaction.cap022FullChainSatisfied === true,
    applyAdapterInstalled: false,
    executionEnabled: false,
    gateMutationPerformed: false,
    authorityIssued: false,
  });
}
