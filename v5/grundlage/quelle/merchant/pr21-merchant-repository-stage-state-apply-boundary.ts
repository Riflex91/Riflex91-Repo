import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantRepositoryStageStateTransitionRecord,
  Pr21MerchantRepositoryStageStateTransitionRecordBasis,
  Pr21MerchantStageCompletionPostExecutionTransitionBoundary,
} from "./pr21-merchant-stage-completion-post-execution-transition-boundary.js";

export interface Pr21MerchantRepositoryStageStateSnapshot {
  readonly schemaVersion: 1;
  readonly currentStage: "PR21";
  readonly currentGate: "PR21_MERCHANT_INTEGRATION";
  readonly pr21StageStatus: "IN_PROGRESS";
  readonly pr22StageStatus: "BLOCKED_BY_PR21";
}

export interface Pr21MerchantRepositoryStageStateApplyRequest {
  readonly schemaVersion: 1;
  readonly transitionBoundary:
    Pr21MerchantStageCompletionPostExecutionTransitionBoundary;
  readonly currentMainCommit: string;
  readonly currentRepositoryState: Pr21MerchantRepositoryStageStateSnapshot;
  readonly transactionId: string;
  readonly preparedAtMs: number;
}

export interface Pr21MerchantRepositoryStageStateApplyTransactionBasis {
  readonly schemaVersion: 1;
  readonly status: "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF";
  readonly transactionId: string;
  readonly operationKey: string;
  readonly sourceMainCommit: string;
  readonly repositoryTransitionFingerprint: string;
  readonly completionFingerprint: string;
  readonly preparedAtMs: number;
  readonly requiredCurrentStage: "PR21";
  readonly requiredCurrentGate: "PR21_MERCHANT_INTEGRATION";
  readonly requiredPr21StageStatus: "IN_PROGRESS";
  readonly requiredPr22StageStatus: "BLOCKED_BY_PR21";
  readonly targetPr21StageStatus: "COMPLETE";
  readonly targetPr22StageStatus: "IN_PROGRESS";
  readonly targetCurrentStage: "PR22";
  readonly targetCurrentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr22ProductiveAuthorityIssued: false;
  readonly freshMainCheckRequiredAtExecution: true;
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
  readonly repositoryStageStateApplied: false;
  readonly roadmapMutationPerformed: false;
  readonly stageArrayMutationPerformed: false;
  readonly currentStageMutationPerformed: false;
  readonly currentGateMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantRepositoryStageStateApplyTransaction
  extends Pr21MerchantRepositoryStageStateApplyTransactionBasis {
  readonly transactionFingerprint: string;
}

export interface Pr21MerchantRepositoryStageStateApplyBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly transaction:
    Pr21MerchantRepositoryStageStateApplyTransaction
    | null;
  readonly currentMainMatched: boolean;
  readonly repositoryTransitionFingerprintMatched: boolean;
  readonly repositoryStateMatched: boolean;
  readonly repositoryApplyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly repositoryStageStateApplied: false;
  readonly roadmapMutationPerformed: false;
  readonly stageArrayMutationPerformed: false;
  readonly currentStageMutationPerformed: false;
  readonly currentGateMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly separateExecutionAuthorizationRequired: true;
}

const CURRENT_STAGE = "PR21" as const;
const NEXT_STAGE = "PR22" as const;
const CURRENT_GATE = "PR21_MERCHANT_INTEGRATION" as const;
const NEXT_GATE = "PR22_MULTI_CHARACTER_COORDINATION" as const;

function text(value: string, error: string, maximum = 192): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new Error(error);
  }
}

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function transitionBasis(
  record: Pr21MerchantRepositoryStageStateTransitionRecord,
): Pr21MerchantRepositoryStageStateTransitionRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    completedStage: record.completedStage,
    nextDevelopmentStage: record.nextDevelopmentStage,
    sourceMainCommit: record.sourceMainCommit,
    transactionFingerprint: record.transactionFingerprint,
    transitionFingerprint: record.transitionFingerprint,
    completionFingerprint: record.completionFingerprint,
    preparedAtMs: record.preparedAtMs,
    requiredPr21StageStatusBeforeApply:
      record.requiredPr21StageStatusBeforeApply,
    requiredPr22StageStatusBeforeApply:
      record.requiredPr22StageStatusBeforeApply,
    targetPr21StageStatus: record.targetPr21StageStatus,
    targetPr22StageStatus: record.targetPr22StageStatus,
    targetCurrentStage: record.targetCurrentStage,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    freshMainCheckRequiredAtApply: record.freshMainCheckRequiredAtApply,
    completionFingerprintRecheckRequiredAtApply:
      record.completionFingerprintRecheckRequiredAtApply,
    separateRepositoryStageStateApplyRequired:
      record.separateRepositoryStageStateApplyRequired,
    repositoryStageStateApplied: record.repositoryStageStateApplied,
    roadmapMutationPerformed: record.roadmapMutationPerformed,
    ledgerMutationPerformed: record.ledgerMutationPerformed,
    controlPlaneMutationPerformedByTransition:
      record.controlPlaneMutationPerformedByTransition,
    authorityIssued: record.authorityIssued,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
  });
}

function validateTransitionRecord(
  record: Pr21MerchantRepositoryStageStateTransitionRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status !== "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY"
      || record.completedStage !== CURRENT_STAGE
      || record.nextDevelopmentStage !== NEXT_STAGE
      || record.requiredPr21StageStatusBeforeApply !== "IN_PROGRESS"
      || record.requiredPr22StageStatusBeforeApply !== "BLOCKED_BY_PR21"
      || record.targetPr21StageStatus !== "COMPLETE"
      || record.targetPr22StageStatus !== "IN_PROGRESS"
      || record.targetCurrentStage !== NEXT_STAGE
      || record.pr22ProductiveAuthorityIssued !== false
      || record.freshMainCheckRequiredAtApply !== true
      || record.completionFingerprintRecheckRequiredAtApply !== true
      || record.separateRepositoryStageStateApplyRequired !== true
      || record.repositoryStageStateApplied !== false
      || record.roadmapMutationPerformed !== false
      || record.ledgerMutationPerformed !== false
      || record.controlPlaneMutationPerformedByTransition !== false
      || record.authorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false) {
    return false;
  }
  sha40(
    record.sourceMainCommit,
    "PR21_REPOSITORY_STAGE_APPLY_TRANSITION_MAIN_UNGUELTIG",
  );
  fp16(
    record.completionFingerprint,
    "PR21_REPOSITORY_STAGE_APPLY_COMPLETION_FP_UNGUELTIG",
  );
  fp16(
    record.repositoryTransitionFingerprint,
    "PR21_REPOSITORY_STAGE_APPLY_TRANSITION_FP_UNGUELTIG",
  );
  return evidenceFingerprint(transitionBasis(record))
    === record.repositoryTransitionFingerprint;
}

export function bereitePr21MerchantRepositoryStageStateApplyVor(
  request: Pr21MerchantRepositoryStageStateApplyRequest,
): Pr21MerchantRepositoryStageStateApplyBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_REPOSITORY_STAGE_APPLY_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR21_REPOSITORY_STAGE_APPLY_MAIN_UNGUELTIG",
  );
  text(
    request.transactionId,
    "PR21_REPOSITORY_STAGE_APPLY_TRANSACTION_ID_UNGUELTIG",
  );
  time(
    request.preparedAtMs,
    "PR21_REPOSITORY_STAGE_APPLY_ZEIT_UNGUELTIG",
  );

  const boundary = request.transitionBoundary;
  const record = boundary.record;
  const blocker: string[] = [];

  if (boundary.schemaVersion !== 1
      || boundary.status
        !== "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY"
      || boundary.blocker.length !== 0
      || boundary.completedStage !== CURRENT_STAGE
      || boundary.nextDevelopmentStage !== NEXT_STAGE
      || boundary.repositoryStageStateApplied !== false
      || boundary.roadmapMutationPerformed !== false
      || boundary.ledgerMutationPerformed !== false
      || boundary.controlPlaneMutationPerformedByTransition !== false
      || boundary.pr22ProductiveAuthorityIssued !== false
      || boundary.authorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || record === null) {
    blocker.push("PR21_REPOSITORY_STAGE_APPLY_TRANSITION_NICHT_BEREIT");
  }

  const repositoryTransitionFingerprintMatched =
    record !== null && validateTransitionRecord(record);
  if (!repositoryTransitionFingerprintMatched) {
    blocker.push("PR21_REPOSITORY_STAGE_APPLY_TRANSITION_FP_DRIFT");
  }

  const currentMainMatched =
    record !== null && record.sourceMainCommit === request.currentMainCommit;
  if (!currentMainMatched) {
    blocker.push("PR21_REPOSITORY_STAGE_APPLY_MAIN_STALE");
  }

  const state = request.currentRepositoryState;
  const repositoryStateMatched =
    state.schemaVersion === 1
    && state.currentStage === CURRENT_STAGE
    && state.currentGate === CURRENT_GATE
    && state.pr21StageStatus === "IN_PROGRESS"
    && state.pr22StageStatus === "BLOCKED_BY_PR21";
  if (!repositoryStateMatched) {
    blocker.push("PR21_REPOSITORY_STAGE_APPLY_STATE_DRIFT");
  }

  let transaction: Pr21MerchantRepositoryStageStateApplyTransaction | null =
    null;

  if (blocker.length === 0 && record !== null) {
    const operationKey = [
      "pr21-repository-stage-state",
      CURRENT_STAGE,
      NEXT_STAGE,
      record.repositoryTransitionFingerprint,
    ].join(":");

    const basis: Pr21MerchantRepositoryStageStateApplyTransactionBasis =
      Object.freeze({
        schemaVersion: 1,
        status: "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF",
        transactionId: request.transactionId,
        operationKey,
        sourceMainCommit: record.sourceMainCommit,
        repositoryTransitionFingerprint:
          record.repositoryTransitionFingerprint,
        completionFingerprint: record.completionFingerprint,
        preparedAtMs: request.preparedAtMs,
        requiredCurrentStage: CURRENT_STAGE,
        requiredCurrentGate: CURRENT_GATE,
        requiredPr21StageStatus: "IN_PROGRESS",
        requiredPr22StageStatus: "BLOCKED_BY_PR21",
        targetPr21StageStatus: "COMPLETE",
        targetPr22StageStatus: "IN_PROGRESS",
        targetCurrentStage: NEXT_STAGE,
        targetCurrentGate: NEXT_GATE,
        pr22ProductiveAuthorityIssued: false,
        freshMainCheckRequiredAtExecution: true,
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
        repositoryStageStateApplied: false,
        roadmapMutationPerformed: false,
        stageArrayMutationPerformed: false,
        currentStageMutationPerformed: false,
        currentGateMutationPerformed: false,
        controlPlaneMutationPerformed: false,
        authorityIssued: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        broadRuntimeGrant: false,
        normalRuntimeAllowed: false,
      });

    transaction = Object.freeze({
      ...basis,
      transactionFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "READY_DEFAULT_OFF" : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    transaction,
    currentMainMatched,
    repositoryTransitionFingerprintMatched,
    repositoryStateMatched,
    repositoryApplyAdapterInstalled: false,
    executionEnabled: false,
    repositoryStageStateApplied: false,
    roadmapMutationPerformed: false,
    stageArrayMutationPerformed: false,
    currentStageMutationPerformed: false,
    currentGateMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    pr22ProductiveAuthorityIssued: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    separateExecutionAuthorizationRequired: true,
  });
}
