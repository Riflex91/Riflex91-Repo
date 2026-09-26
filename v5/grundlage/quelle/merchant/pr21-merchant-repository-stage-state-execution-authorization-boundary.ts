import type {
  Pr21MerchantRepositoryStageStateApplyBoundary,
} from "./pr21-merchant-repository-stage-state-apply-boundary.js";

export interface Pr21MerchantRepositoryStageStateExecutionAuthorizationDraft {
  readonly schemaVersion: 1;
  readonly status: "AWAITING_EXPLICIT_REPOSITORY_STAGE_STATE_AUTHORIZATION";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly repositoryTransitionFingerprint: string;
  readonly completionFingerprint: string;
  readonly issuedAtMs: number;
  readonly expiresAtMs: number;
  readonly maximumUses: 1;
  readonly requiredConfirmationText: string;
  readonly requiredCurrentStage: "PR21";
  readonly requiredCurrentGate: "PR21_MERCHANT_INTEGRATION";
  readonly requiredPr21StageStatus: "IN_PROGRESS";
  readonly requiredPr22StageStatus: "BLOCKED_BY_PR21";
  readonly targetPr21StageStatus: "COMPLETE";
  readonly targetPr22StageStatus: "IN_PROGRESS";
  readonly targetCurrentStage: "PR22";
  readonly targetCurrentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  readonly freshMainCheckRequiredAtExecution: true;
  readonly transactionFingerprintRecheckRequiredAtExecution: true;
  readonly repositoryTransitionFingerprintRecheckRequiredAtExecution: true;
  readonly completionFingerprintRecheckRequiredAtExecution: true;
  readonly repositoryStateRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeRepositoryMutation: true;
  readonly oneShotExecutionRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly repositoryApplyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly executionPerformed: false;
  readonly repositoryStageStateApplied: false;
  readonly roadmapMutationPerformed: false;
  readonly stageArrayMutationPerformed: false;
  readonly currentStageMutationPerformed: false;
  readonly currentGateMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantRepositoryStageStateExecutionAuthorizationRecord
  extends Omit<
    Pr21MerchantRepositoryStageStateExecutionAuthorizationDraft,
    "status" | "requiredConfirmationText"
  > {
  readonly status: "AUTHORIZED_REPOSITORY_STAGE_STATE_ONE_SHOT_RECORD_ONLY";
  readonly operatorId: string;
  readonly authorizedAtMs: number;
  readonly confirmationText: string;
  readonly repositoryStageStateExecutionAuthorizationIssued: true;
  readonly authorizationConsumed: false;
}

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
  boundary: Pr21MerchantRepositoryStageStateApplyBoundary,
): void {
  const tx = boundary.transaction;
  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_DEFAULT_OFF"
      || boundary.blocker.length !== 0
      || boundary.currentMainMatched !== true
      || boundary.repositoryTransitionFingerprintMatched !== true
      || boundary.repositoryStateMatched !== true
      || boundary.repositoryApplyAdapterInstalled !== false
      || boundary.executionEnabled !== false
      || boundary.repositoryStageStateApplied !== false
      || boundary.roadmapMutationPerformed !== false
      || boundary.stageArrayMutationPerformed !== false
      || boundary.currentStageMutationPerformed !== false
      || boundary.currentGateMutationPerformed !== false
      || boundary.controlPlaneMutationPerformed !== false
      || boundary.pr22ProductiveAuthorityIssued !== false
      || boundary.authorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || boundary.separateExecutionAuthorizationRequired !== true
      || tx === null
      || tx.status !== "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF"
      || tx.requiredCurrentStage !== "PR21"
      || tx.requiredCurrentGate !== "PR21_MERCHANT_INTEGRATION"
      || tx.requiredPr21StageStatus !== "IN_PROGRESS"
      || tx.requiredPr22StageStatus !== "BLOCKED_BY_PR21"
      || tx.targetPr21StageStatus !== "COMPLETE"
      || tx.targetPr22StageStatus !== "IN_PROGRESS"
      || tx.targetCurrentStage !== "PR22"
      || tx.targetCurrentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || tx.freshMainCheckRequiredAtExecution !== true
      || tx.repositoryTransitionFingerprintRecheckRequiredAtExecution !== true
      || tx.completionFingerprintRecheckRequiredAtExecution !== true
      || tx.repositoryStateRecheckRequiredAtExecution !== true
      || tx.durableIntentRequiredBeforeRepositoryMutation !== true
      || tx.oneShotExecutionRequired !== true
      || tx.sameIntentRetryAllowed !== false
      || tx.postconditionVerificationRequired !== true
      || tx.unknownOutcomeRequiresReconciliation !== true
      || tx.repositoryApplyAdapterInstalled !== false
      || tx.executionEnabled !== false
      || tx.repositoryStageStateApplied !== false
      || tx.roadmapMutationPerformed !== false
      || tx.stageArrayMutationPerformed !== false
      || tx.currentStageMutationPerformed !== false
      || tx.currentGateMutationPerformed !== false
      || tx.controlPlaneMutationPerformed !== false
      || tx.pr22ProductiveAuthorityIssued !== false
      || tx.authorityIssued !== false
      || tx.gameplayAuthority !== false
      || tx.rawWriteAuthority !== false
      || tx.broadRuntimeGrant !== false
      || tx.normalRuntimeAllowed !== false) {
    throw new Error(
      "PR21_REPOSITORY_STAGE_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT",
    );
  }
}

export function pr21MerchantRepositoryStageStateAuthorizationConfirmationText(
  transactionFingerprint: string,
  sourceMainCommit: string,
): string {
  fp16(
    transactionFingerprint,
    "PR21_REPOSITORY_STAGE_AUTH_TRANSACTION_FP_UNGUELTIG",
  );
  sha40(
    sourceMainCommit,
    "PR21_REPOSITORY_STAGE_AUTH_MAIN_UNGUELTIG",
  );
  return "AUTHORIZE PR21 REPOSITORY STAGE STATE TRANSACTION "
    + transactionFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr21MerchantRepositoryStageStateExecutionAuthorizationVor(
  boundary: Pr21MerchantRepositoryStageStateApplyBoundary,
  authorizationId: string,
  issuedAtMs: number,
  expiresAtMs: number,
): Pr21MerchantRepositoryStageStateExecutionAuthorizationDraft {
  validateBoundary(boundary);
  text(authorizationId,"PR21_REPOSITORY_STAGE_AUTH_ID_UNGUELTIG",192);
  time(issuedAtMs,"PR21_REPOSITORY_STAGE_AUTH_ISSUED_AT_UNGUELTIG");
  time(expiresAtMs,"PR21_REPOSITORY_STAGE_AUTH_EXPIRES_AT_UNGUELTIG");
  if (expiresAtMs < issuedAtMs || expiresAtMs - issuedAtMs > 1_500) {
    throw new Error("PR21_REPOSITORY_STAGE_AUTH_TTL_UNGUELTIG");
  }

  const tx = boundary.transaction;
  if (tx === null) {
    throw new Error(
      "PR21_REPOSITORY_STAGE_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT",
    );
  }
  sha40(tx.sourceMainCommit,"PR21_REPOSITORY_STAGE_AUTH_TX_MAIN_UNGUELTIG");
  fp16(tx.transactionFingerprint,"PR21_REPOSITORY_STAGE_AUTH_TX_FP_UNGUELTIG");
  fp16(
    tx.repositoryTransitionFingerprint,
    "PR21_REPOSITORY_STAGE_AUTH_TRANSITION_FP_UNGUELTIG",
  );
  fp16(
    tx.completionFingerprint,
    "PR21_REPOSITORY_STAGE_AUTH_COMPLETION_FP_UNGUELTIG",
  );

  return Object.freeze({
    schemaVersion: 1,
    status: "AWAITING_EXPLICIT_REPOSITORY_STAGE_STATE_AUTHORIZATION",
    authorizationId,
    transactionId: tx.transactionId,
    operationKey: tx.operationKey,
    transactionFingerprint: tx.transactionFingerprint,
    sourceMainCommit: tx.sourceMainCommit,
    repositoryTransitionFingerprint: tx.repositoryTransitionFingerprint,
    completionFingerprint: tx.completionFingerprint,
    issuedAtMs,
    expiresAtMs,
    maximumUses: 1,
    requiredConfirmationText:
      pr21MerchantRepositoryStageStateAuthorizationConfirmationText(
        tx.transactionFingerprint,
        tx.sourceMainCommit,
      ),
    requiredCurrentStage: tx.requiredCurrentStage,
    requiredCurrentGate: tx.requiredCurrentGate,
    requiredPr21StageStatus: tx.requiredPr21StageStatus,
    requiredPr22StageStatus: tx.requiredPr22StageStatus,
    targetPr21StageStatus: tx.targetPr21StageStatus,
    targetPr22StageStatus: tx.targetPr22StageStatus,
    targetCurrentStage: tx.targetCurrentStage,
    targetCurrentGate: tx.targetCurrentGate,
    freshMainCheckRequiredAtExecution: true,
    transactionFingerprintRecheckRequiredAtExecution: true,
    repositoryTransitionFingerprintRecheckRequiredAtExecution: true,
    completionFingerprintRecheckRequiredAtExecution: true,
    repositoryStateRecheckRequiredAtExecution: true,
    durableIntentRequiredBeforeRepositoryMutation: true,
    oneShotExecutionRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    repositoryApplyAdapterInstalled: false,
    executionEnabled: false,
    executionPerformed: false,
    repositoryStageStateApplied: false,
    roadmapMutationPerformed: false,
    stageArrayMutationPerformed: false,
    currentStageMutationPerformed: false,
    currentGateMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    pr22ProductiveAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

export function erteilePr21MerchantRepositoryStageStateExecutionAuthorization(
  draft: Pr21MerchantRepositoryStageStateExecutionAuthorizationDraft,
  confirmationText: string,
  operatorId: string,
  authorizedAtMs: number,
): Pr21MerchantRepositoryStageStateExecutionAuthorizationRecord {
  if (draft.schemaVersion !== 1
      || draft.status
        !== "AWAITING_EXPLICIT_REPOSITORY_STAGE_STATE_AUTHORIZATION"
      || draft.maximumUses !== 1
      || draft.requiredCurrentStage !== "PR21"
      || draft.requiredCurrentGate !== "PR21_MERCHANT_INTEGRATION"
      || draft.requiredPr21StageStatus !== "IN_PROGRESS"
      || draft.requiredPr22StageStatus !== "BLOCKED_BY_PR21"
      || draft.targetPr21StageStatus !== "COMPLETE"
      || draft.targetPr22StageStatus !== "IN_PROGRESS"
      || draft.targetCurrentStage !== "PR22"
      || draft.targetCurrentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || draft.freshMainCheckRequiredAtExecution !== true
      || draft.transactionFingerprintRecheckRequiredAtExecution !== true
      || draft.repositoryTransitionFingerprintRecheckRequiredAtExecution !== true
      || draft.completionFingerprintRecheckRequiredAtExecution !== true
      || draft.repositoryStateRecheckRequiredAtExecution !== true
      || draft.durableIntentRequiredBeforeRepositoryMutation !== true
      || draft.oneShotExecutionRequired !== true
      || draft.sameIntentRetryAllowed !== false
      || draft.postconditionVerificationRequired !== true
      || draft.unknownOutcomeRequiresReconciliation !== true
      || draft.repositoryApplyAdapterInstalled !== false
      || draft.executionEnabled !== false
      || draft.executionPerformed !== false
      || draft.repositoryStageStateApplied !== false
      || draft.roadmapMutationPerformed !== false
      || draft.stageArrayMutationPerformed !== false
      || draft.currentStageMutationPerformed !== false
      || draft.currentGateMutationPerformed !== false
      || draft.controlPlaneMutationPerformed !== false
      || draft.pr22ProductiveAuthorityIssued !== false
      || draft.gameplayAuthority !== false
      || draft.rawWriteAuthority !== false
      || draft.broadRuntimeGrant !== false
      || draft.normalRuntimeAllowed !== false) {
    throw new Error("PR21_REPOSITORY_STAGE_AUTH_DRAFT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR21_REPOSITORY_STAGE_AUTH_BESTAETIGUNG_UNGUELTIG");
  }
  text(operatorId,"PR21_REPOSITORY_STAGE_AUTH_OPERATOR_UNGUELTIG",192);
  time(
    authorizedAtMs,
    "PR21_REPOSITORY_STAGE_AUTH_AUTHORIZED_AT_UNGUELTIG",
  );
  if (authorizedAtMs < draft.issuedAtMs || authorizedAtMs > draft.expiresAtMs) {
    throw new Error("PR21_REPOSITORY_STAGE_AUTH_ABGELAUFEN");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "AUTHORIZED_REPOSITORY_STAGE_STATE_ONE_SHOT_RECORD_ONLY",
    authorizationId: draft.authorizationId,
    transactionId: draft.transactionId,
    operationKey: draft.operationKey,
    transactionFingerprint: draft.transactionFingerprint,
    sourceMainCommit: draft.sourceMainCommit,
    repositoryTransitionFingerprint: draft.repositoryTransitionFingerprint,
    completionFingerprint: draft.completionFingerprint,
    issuedAtMs: draft.issuedAtMs,
    expiresAtMs: draft.expiresAtMs,
    maximumUses: 1,
    requiredCurrentStage: draft.requiredCurrentStage,
    requiredCurrentGate: draft.requiredCurrentGate,
    requiredPr21StageStatus: draft.requiredPr21StageStatus,
    requiredPr22StageStatus: draft.requiredPr22StageStatus,
    targetPr21StageStatus: draft.targetPr21StageStatus,
    targetPr22StageStatus: draft.targetPr22StageStatus,
    targetCurrentStage: draft.targetCurrentStage,
    targetCurrentGate: draft.targetCurrentGate,
    freshMainCheckRequiredAtExecution: true,
    transactionFingerprintRecheckRequiredAtExecution: true,
    repositoryTransitionFingerprintRecheckRequiredAtExecution: true,
    completionFingerprintRecheckRequiredAtExecution: true,
    repositoryStateRecheckRequiredAtExecution: true,
    durableIntentRequiredBeforeRepositoryMutation: true,
    oneShotExecutionRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    repositoryApplyAdapterInstalled: false,
    executionEnabled: false,
    executionPerformed: false,
    repositoryStageStateApplied: false,
    roadmapMutationPerformed: false,
    stageArrayMutationPerformed: false,
    currentStageMutationPerformed: false,
    currentGateMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    pr22ProductiveAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    operatorId,
    authorizedAtMs,
    confirmationText,
    repositoryStageStateExecutionAuthorizationIssued: true,
    authorizationConsumed: false,
  });
}
