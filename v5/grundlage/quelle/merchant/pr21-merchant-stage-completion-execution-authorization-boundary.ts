import type {
  Pr21MerchantStageCompletionApplyBoundary,
} from "./pr21-merchant-stage-completion-apply-boundary.js";

export interface Pr21MerchantStageCompletionExecutionAuthorizationDraft {
  readonly schemaVersion: 1;
  readonly status: "AWAITING_EXPLICIT_STAGE_COMPLETION_AUTHORIZATION";
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly transitionFingerprint: string;
  readonly settlementFingerprint: string;
  readonly ledgerFingerprint: string;
  readonly issuedAtMs: number;
  readonly expiresAtMs: number;
  readonly maximumUses: 1;
  readonly requiredConfirmationText: string;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly transactionFingerprintRecheckRequiredAtExecution: true;
  readonly transitionFingerprintRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeMutation: true;
  readonly oneShotExecutionRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly stageCompletionAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly executionPerformed: false;
  readonly pr21StageCompletionApplied: false;
  readonly pr22DevelopmentStageActivated: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
  readonly stageMutationPerformed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantStageCompletionExecutionAuthorizationRecord
  extends Omit<
    Pr21MerchantStageCompletionExecutionAuthorizationDraft,
    "status" | "requiredConfirmationText"
  > {
  readonly status: "AUTHORIZED_STAGE_COMPLETION_ONE_SHOT_RECORD_ONLY";
  readonly operatorId: string;
  readonly authorizedAtMs: number;
  readonly confirmationText: string;
  readonly stageCompletionExecutionAuthorizationIssued: true;
  readonly authorizationConsumed: false;
}

const STAGE = "PR21" as const;
const NEXT_STAGE = "PR22" as const;

function text(value: string, error: string, maximum = 256): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new Error(error);
  }
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function validateBoundary(
  boundary: Pr21MerchantStageCompletionApplyBoundary,
): void {
  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_DEFAULT_OFF"
      || boundary.blocker.length !== 0
      || boundary.stage !== STAGE
      || boundary.nextStage !== NEXT_STAGE
      || boundary.transaction === null
      || boundary.transitionFingerprintMatched !== true
      || boundary.currentMainMatched !== true
      || boundary.stageCompletionAdapterInstalled !== false
      || boundary.executionEnabled !== false
      || boundary.pr21StageCompletionApplied !== false
      || boundary.pr22DevelopmentStageActivated !== false
      || boundary.pr22ProductiveAuthorityIssued !== false
      || boundary.roadmapMutationPerformed !== false
      || boundary.ledgerMutationPerformed !== false
      || boundary.stageMutationPerformed !== false
      || boundary.authorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || boundary.separateExecutionAuthorizationRequired !== true
      || boundary.transaction.status !== "PREPARED_STAGE_COMPLETION_DEFAULT_OFF"
      || boundary.transaction.freshMainCheckRequiredAtExecution !== true
      || boundary.transaction.transitionFingerprintRecheckRequiredAtExecution !== true
      || boundary.transaction.durableIntentRequiredBeforeMutation !== true
      || boundary.transaction.oneShotExecutionRequired !== true
      || boundary.transaction.sameIntentRetryAllowed !== false
      || boundary.transaction.postconditionVerificationRequired !== true
      || boundary.transaction.unknownOutcomeRequiresReconciliation !== true
      || boundary.transaction.stageCompletionAdapterInstalled !== false
      || boundary.transaction.executionEnabled !== false
      || boundary.transaction.pr21StageCompletionApplied !== false
      || boundary.transaction.pr22DevelopmentStageActivated !== false
      || boundary.transaction.pr22ProductiveAuthorityIssued !== false
      || boundary.transaction.roadmapMutationPerformed !== false
      || boundary.transaction.ledgerMutationPerformed !== false
      || boundary.transaction.stageMutationPerformed !== false
      || boundary.transaction.authorityIssued !== false
      || boundary.transaction.gameplayAuthority !== false
      || boundary.transaction.rawWriteAuthority !== false
      || boundary.transaction.broadRuntimeGrant !== false
      || boundary.transaction.normalRuntimeAllowed !== false) {
    throw new Error(
      "PR21_MERCHANT_STAGE_COMPLETION_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT",
    );
  }
}

export function pr21MerchantStageCompletionAuthorizationConfirmationText(
  transactionFingerprint: string,
  sourceMainCommit: string,
): string {
  fp16(
    transactionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_TRANSACTION_FP_UNGUELTIG",
  );
  sha40(
    sourceMainCommit,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_MAIN_UNGUELTIG",
  );
  return "AUTHORIZE PR21 STAGE COMPLETION TRANSACTION "
    + transactionFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr21MerchantStageCompletionExecutionAuthorizationVor(
  boundary: Pr21MerchantStageCompletionApplyBoundary,
  authorizationId: string,
  issuedAtMs: number,
  expiresAtMs: number,
): Pr21MerchantStageCompletionExecutionAuthorizationDraft {
  validateBoundary(boundary);
  text(
    authorizationId,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_ID_UNGUELTIG",
    192,
  );
  time(
    issuedAtMs,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_ISSUED_AT_UNGUELTIG",
  );
  time(
    expiresAtMs,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_EXPIRES_AT_UNGUELTIG",
  );
  if (expiresAtMs < issuedAtMs || expiresAtMs - issuedAtMs > 1_500) {
    throw new Error("PR21_MERCHANT_STAGE_COMPLETION_AUTH_TTL_UNGUELTIG");
  }

  const tx = boundary.transaction;
  if (tx === null) {
    throw new Error(
      "PR21_MERCHANT_STAGE_COMPLETION_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT",
    );
  }
  sha40(
    tx.sourceMainCommit,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_TX_MAIN_UNGUELTIG",
  );
  fp16(
    tx.transactionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_TX_FP_UNGUELTIG",
  );
  fp16(
    tx.transitionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_TRANSITION_FP_UNGUELTIG",
  );
  fp16(
    tx.settlementFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_SETTLEMENT_FP_UNGUELTIG",
  );
  fp16(
    tx.ledgerFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_LEDGER_FP_UNGUELTIG",
  );

  return Object.freeze({
    schemaVersion: 1,
    status: "AWAITING_EXPLICIT_STAGE_COMPLETION_AUTHORIZATION",
    stage: STAGE,
    nextStage: NEXT_STAGE,
    authorizationId,
    transactionId: tx.transactionId,
    operationKey: tx.operationKey,
    transactionFingerprint: tx.transactionFingerprint,
    sourceMainCommit: tx.sourceMainCommit,
    transitionFingerprint: tx.transitionFingerprint,
    settlementFingerprint: tx.settlementFingerprint,
    ledgerFingerprint: tx.ledgerFingerprint,
    issuedAtMs,
    expiresAtMs,
    maximumUses: 1,
    requiredConfirmationText:
      pr21MerchantStageCompletionAuthorizationConfirmationText(
        tx.transactionFingerprint,
        tx.sourceMainCommit,
      ),
    freshMainCheckRequiredAtExecution: true,
    transactionFingerprintRecheckRequiredAtExecution: true,
    transitionFingerprintRecheckRequiredAtExecution: true,
    durableIntentRequiredBeforeMutation: true,
    oneShotExecutionRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    stageCompletionAdapterInstalled: false,
    executionEnabled: false,
    executionPerformed: false,
    pr21StageCompletionApplied: false,
    pr22DevelopmentStageActivated: false,
    pr22ProductiveAuthorityIssued: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    stageMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

export function erteilePr21MerchantStageCompletionExecutionAuthorization(
  draft: Pr21MerchantStageCompletionExecutionAuthorizationDraft,
  confirmationText: string,
  operatorId: string,
  authorizedAtMs: number,
): Pr21MerchantStageCompletionExecutionAuthorizationRecord {
  if (draft.schemaVersion !== 1
      || draft.status !== "AWAITING_EXPLICIT_STAGE_COMPLETION_AUTHORIZATION"
      || draft.stage !== STAGE
      || draft.nextStage !== NEXT_STAGE
      || draft.maximumUses !== 1
      || draft.freshMainCheckRequiredAtExecution !== true
      || draft.transactionFingerprintRecheckRequiredAtExecution !== true
      || draft.transitionFingerprintRecheckRequiredAtExecution !== true
      || draft.durableIntentRequiredBeforeMutation !== true
      || draft.oneShotExecutionRequired !== true
      || draft.sameIntentRetryAllowed !== false
      || draft.postconditionVerificationRequired !== true
      || draft.unknownOutcomeRequiresReconciliation !== true
      || draft.stageCompletionAdapterInstalled !== false
      || draft.executionEnabled !== false
      || draft.executionPerformed !== false
      || draft.pr21StageCompletionApplied !== false
      || draft.pr22DevelopmentStageActivated !== false
      || draft.pr22ProductiveAuthorityIssued !== false
      || draft.roadmapMutationPerformed !== false
      || draft.ledgerMutationPerformed !== false
      || draft.stageMutationPerformed !== false
      || draft.gameplayAuthority !== false
      || draft.rawWriteAuthority !== false
      || draft.broadRuntimeGrant !== false
      || draft.normalRuntimeAllowed !== false) {
    throw new Error("PR21_MERCHANT_STAGE_COMPLETION_AUTH_DRAFT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error(
      "PR21_MERCHANT_STAGE_COMPLETION_AUTH_BESTAETIGUNG_UNGUELTIG",
    );
  }
  text(
    operatorId,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_OPERATOR_UNGUELTIG",
    192,
  );
  time(
    authorizedAtMs,
    "PR21_MERCHANT_STAGE_COMPLETION_AUTH_AUTHORIZED_AT_UNGUELTIG",
  );
  if (authorizedAtMs < draft.issuedAtMs || authorizedAtMs > draft.expiresAtMs) {
    throw new Error("PR21_MERCHANT_STAGE_COMPLETION_AUTH_ABGELAUFEN");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "AUTHORIZED_STAGE_COMPLETION_ONE_SHOT_RECORD_ONLY",
    stage: STAGE,
    nextStage: NEXT_STAGE,
    authorizationId: draft.authorizationId,
    transactionId: draft.transactionId,
    operationKey: draft.operationKey,
    transactionFingerprint: draft.transactionFingerprint,
    sourceMainCommit: draft.sourceMainCommit,
    transitionFingerprint: draft.transitionFingerprint,
    settlementFingerprint: draft.settlementFingerprint,
    ledgerFingerprint: draft.ledgerFingerprint,
    issuedAtMs: draft.issuedAtMs,
    expiresAtMs: draft.expiresAtMs,
    maximumUses: 1,
    freshMainCheckRequiredAtExecution: true,
    transactionFingerprintRecheckRequiredAtExecution: true,
    transitionFingerprintRecheckRequiredAtExecution: true,
    durableIntentRequiredBeforeMutation: true,
    oneShotExecutionRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    stageCompletionAdapterInstalled: false,
    executionEnabled: false,
    executionPerformed: false,
    pr21StageCompletionApplied: false,
    pr22DevelopmentStageActivated: false,
    pr22ProductiveAuthorityIssued: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    stageMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    operatorId,
    authorizedAtMs,
    confirmationText,
    stageCompletionExecutionAuthorizationIssued: true,
    authorizationConsumed: false,
  });
}
