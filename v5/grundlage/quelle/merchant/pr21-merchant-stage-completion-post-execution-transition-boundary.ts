import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantStageCompletionExecutionResult,
  Pr21MerchantStageCompletionRecord,
  Pr21MerchantStageCompletionRecordBasis,
} from "./pr21-merchant-stage-completion-one-shot-execution-boundary.js";

export interface Pr21MerchantStageCompletionPostExecutionTransitionRequest {
  readonly schemaVersion: 1;
  readonly execution: Pr21MerchantStageCompletionExecutionResult;
  readonly currentMainCommit: string;
  readonly preparedAtMs: number;
}

export interface Pr21MerchantRepositoryStageStateTransitionRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY";
  readonly completedStage: "PR21";
  readonly nextDevelopmentStage: "PR22";
  readonly sourceMainCommit: string;
  readonly transactionFingerprint: string;
  readonly transitionFingerprint: string;
  readonly completionFingerprint: string;
  readonly preparedAtMs: number;
  readonly requiredPr21StageStatusBeforeApply: "IN_PROGRESS";
  readonly requiredPr22StageStatusBeforeApply: "BLOCKED_BY_PR21";
  readonly targetPr21StageStatus: "COMPLETE";
  readonly targetPr22StageStatus: "IN_PROGRESS";
  readonly targetCurrentStage: "PR22";
  readonly pr22ProductiveAuthorityIssued: false;
  readonly freshMainCheckRequiredAtApply: true;
  readonly completionFingerprintRecheckRequiredAtApply: true;
  readonly separateRepositoryStageStateApplyRequired: true;
  readonly repositoryStageStateApplied: false;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
  readonly controlPlaneMutationPerformedByTransition: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantRepositoryStageStateTransitionRecord
  extends Pr21MerchantRepositoryStageStateTransitionRecordBasis {
  readonly repositoryTransitionFingerprint: string;
}

export interface Pr21MerchantStageCompletionPostExecutionTransitionBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly completedStage: "PR21";
  readonly nextDevelopmentStage: "PR22";
  readonly record: Pr21MerchantRepositoryStageStateTransitionRecord | null;
  readonly repositoryStageStateApplied: false;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
  readonly controlPlaneMutationPerformedByTransition: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

const STAGE = "PR21" as const;
const NEXT_STAGE = "PR22" as const;

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function completionBasis(
  record: Pr21MerchantStageCompletionRecord,
): Pr21MerchantStageCompletionRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    nextStage: record.nextStage,
    authorizationId: record.authorizationId,
    transactionId: record.transactionId,
    transactionFingerprint: record.transactionFingerprint,
    transitionFingerprint: record.transitionFingerprint,
    settlementFingerprint: record.settlementFingerprint,
    ledgerFingerprint: record.ledgerFingerprint,
    sourceMainCommit: record.sourceMainCommit,
    durableIntentId: record.durableIntentId,
    appliedAtMs: record.appliedAtMs,
    pr21StageCompletionApplied: record.pr21StageCompletionApplied,
    pr22DevelopmentStageActivated: record.pr22DevelopmentStageActivated,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    controlPlaneMutationOnly: record.controlPlaneMutationOnly,
    roadmapMutationPerformed: record.roadmapMutationPerformed,
    ledgerMutationPerformed: record.ledgerMutationPerformed,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
  });
}

function validateCompletionRecord(
  record: Pr21MerchantStageCompletionRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status !== "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY"
      || record.stage !== STAGE
      || record.nextStage !== NEXT_STAGE
      || record.pr21StageCompletionApplied !== true
      || record.pr22DevelopmentStageActivated !== true
      || record.pr22ProductiveAuthorityIssued !== false
      || record.controlPlaneMutationOnly !== true
      || record.roadmapMutationPerformed !== false
      || record.ledgerMutationPerformed !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false) {
    return false;
  }
  sha40(
    record.sourceMainCommit,
    "PR21_MERCHANT_POST_EXECUTION_COMPLETION_MAIN_UNGUELTIG",
  );
  fp16(
    record.transactionFingerprint,
    "PR21_MERCHANT_POST_EXECUTION_TRANSACTION_FP_UNGUELTIG",
  );
  fp16(
    record.transitionFingerprint,
    "PR21_MERCHANT_POST_EXECUTION_TRANSITION_FP_UNGUELTIG",
  );
  fp16(
    record.settlementFingerprint,
    "PR21_MERCHANT_POST_EXECUTION_SETTLEMENT_FP_UNGUELTIG",
  );
  fp16(
    record.ledgerFingerprint,
    "PR21_MERCHANT_POST_EXECUTION_LEDGER_FP_UNGUELTIG",
  );
  fp16(
    record.completionFingerprint,
    "PR21_MERCHANT_POST_EXECUTION_COMPLETION_FP_UNGUELTIG",
  );
  return evidenceFingerprint(completionBasis(record))
    === record.completionFingerprint;
}

export function bereitePr21MerchantStageCompletionPostExecutionTransitionVor(
  request: Pr21MerchantStageCompletionPostExecutionTransitionRequest,
): Pr21MerchantStageCompletionPostExecutionTransitionBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_POST_EXECUTION_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR21_MERCHANT_POST_EXECUTION_MAIN_UNGUELTIG",
  );
  time(
    request.preparedAtMs,
    "PR21_MERCHANT_POST_EXECUTION_ZEIT_UNGUELTIG",
  );

  const execution = request.execution;
  const completion = execution.completionRecord;
  const blocker: string[] = [];

  if (execution.schemaVersion !== 1
      || execution.status !== "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY"
      || execution.blocker.length !== 0
      || execution.stage !== STAGE
      || execution.nextStage !== NEXT_STAGE
      || execution.authorizationConsumed !== true
      || execution.durableIntentPersisted !== true
      || execution.mutationAttemptObserved !== true
      || execution.stageMutationPerformed !== true
      || execution.pr21StageCompletionApplied !== true
      || execution.pr22DevelopmentStageActivated !== true
      || execution.pr22ProductiveAuthorityIssued !== false
      || execution.controlPlaneMutationOnly !== true
      || execution.sameIntentRetryAllowed !== false
      || execution.blindResumeAfterRestartAllowed !== false
      || execution.roadmapMutationPerformed !== false
      || execution.ledgerMutationPerformed !== false
      || execution.gameplayAuthority !== false
      || execution.rawWriteAuthority !== false
      || execution.broadRuntimeGrant !== false
      || execution.normalRuntimeAllowed !== false
      || completion === null) {
    blocker.push("PR21_MERCHANT_POST_EXECUTION_EXECUTION_NICHT_VERIFIZIERT");
  }

  if (completion !== null) {
    if (!validateCompletionRecord(completion)) {
      blocker.push("PR21_MERCHANT_POST_EXECUTION_COMPLETION_RECORD_UNGUELTIG");
    }
    if (completion.transactionId !== execution.transactionId
        || completion.transactionFingerprint !== execution.transactionFingerprint
        || completion.authorizationId !== execution.authorizationId) {
      blocker.push("PR21_MERCHANT_POST_EXECUTION_COMPLETION_BINDING_DRIFT");
    }
    if (completion.sourceMainCommit !== request.currentMainCommit) {
      blocker.push("PR21_MERCHANT_POST_EXECUTION_MAIN_STALE");
    }
  }

  const uniqueBlocker = Object.freeze([...new Set(blocker)]);
  let record: Pr21MerchantRepositoryStageStateTransitionRecord | null = null;

  if (uniqueBlocker.length === 0 && completion !== null) {
    const basis: Pr21MerchantRepositoryStageStateTransitionRecordBasis =
      Object.freeze({
        schemaVersion: 1,
        status: "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY",
        completedStage: STAGE,
        nextDevelopmentStage: NEXT_STAGE,
        sourceMainCommit: completion.sourceMainCommit,
        transactionFingerprint: completion.transactionFingerprint,
        transitionFingerprint: completion.transitionFingerprint,
        completionFingerprint: completion.completionFingerprint,
        preparedAtMs: request.preparedAtMs,
        requiredPr21StageStatusBeforeApply: "IN_PROGRESS",
        requiredPr22StageStatusBeforeApply: "BLOCKED_BY_PR21",
        targetPr21StageStatus: "COMPLETE",
        targetPr22StageStatus: "IN_PROGRESS",
        targetCurrentStage: NEXT_STAGE,
        pr22ProductiveAuthorityIssued: false,
        freshMainCheckRequiredAtApply: true,
        completionFingerprintRecheckRequiredAtApply: true,
        separateRepositoryStageStateApplyRequired: true,
        repositoryStageStateApplied: false,
        roadmapMutationPerformed: false,
        ledgerMutationPerformed: false,
        controlPlaneMutationPerformedByTransition: false,
        authorityIssued: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        broadRuntimeGrant: false,
        normalRuntimeAllowed: false,
      });
    record = Object.freeze({
      ...basis,
      repositoryTransitionFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: uniqueBlocker.length === 0
      ? "READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY"
      : "BLOCKIERT",
    blocker: uniqueBlocker,
    completedStage: STAGE,
    nextDevelopmentStage: NEXT_STAGE,
    record,
    repositoryStageStateApplied: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    controlPlaneMutationPerformedByTransition: false,
    pr22ProductiveAuthorityIssued: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
