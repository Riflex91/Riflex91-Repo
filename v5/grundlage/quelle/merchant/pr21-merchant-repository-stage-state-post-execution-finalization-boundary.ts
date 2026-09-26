import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantRepositoryStageStateExecutionRecord,
  Pr21MerchantRepositoryStageStateExecutionRecordBasis,
  Pr21MerchantRepositoryStageStateExecutionResult,
} from "./pr21-merchant-repository-stage-state-one-shot-execution-boundary.js";

export interface Pr21MerchantRepositoryPostExecutionStateSnapshot {
  readonly schemaVersion: 1;
  readonly currentStage: "PR22";
  readonly currentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr21StageStatus: "COMPLETE";
  readonly pr22StageStatus: "IN_PROGRESS";
  readonly pr22ProductiveAuthorityIssued: false;
}

export interface Pr21MerchantRepositoryPostExecutionFinalizationRequest {
  readonly schemaVersion: 1;
  readonly execution: Pr21MerchantRepositoryStageStateExecutionResult;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly finalizedAtMs: number;
}

export interface Pr21MerchantRepositoryPostExecutionFinalizationRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY";
  readonly completedStage: "PR21";
  readonly nextDevelopmentStage: "PR22";
  readonly sourceMainCommit: string;
  readonly finalizedOnMainCommit: string;
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly repositoryTransitionFingerprint: string;
  readonly completionFingerprint: string;
  readonly repositoryExecutionFingerprint: string;
  readonly finalizedAtMs: number;
  readonly pr21StageStatus: "COMPLETE";
  readonly pr22StageStatus: "IN_PROGRESS";
  readonly currentStage: "PR22";
  readonly currentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr22ProductiveAuthorityIssued: false;
  readonly repositoryStageStateApplied: true;
  readonly executionFingerprintRevalidated: true;
  readonly repositoryPostconditionRevalidated: true;
  readonly pr22DevelopmentHandoffPrepared: true;
  readonly pr22ProductiveHandoffPrepared: false;
  readonly additionalRepositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantRepositoryPostExecutionFinalizationRecord
  extends Pr21MerchantRepositoryPostExecutionFinalizationRecordBasis {
  readonly finalizationFingerprint: string;
}

export interface Pr21MerchantRepositoryPostExecutionFinalizationBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record:
    Pr21MerchantRepositoryPostExecutionFinalizationRecord
    | null;
  readonly executionFingerprintRevalidated: boolean;
  readonly repositoryPostconditionRevalidated: boolean;
  readonly pr22DevelopmentHandoffPrepared: boolean;
  readonly pr22ProductiveHandoffPrepared: false;
  readonly additionalRepositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
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

function executionBasis(
  record: Pr21MerchantRepositoryStageStateExecutionRecord,
): Pr21MerchantRepositoryStageStateExecutionRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    authorizationId: record.authorizationId,
    transactionId: record.transactionId,
    transactionFingerprint: record.transactionFingerprint,
    repositoryTransitionFingerprint: record.repositoryTransitionFingerprint,
    completionFingerprint: record.completionFingerprint,
    sourceMainCommit: record.sourceMainCommit,
    durableIntentId: record.durableIntentId,
    appliedAtMs: record.appliedAtMs,
    pr21StageStatus: record.pr21StageStatus,
    pr22StageStatus: record.pr22StageStatus,
    currentStage: record.currentStage,
    currentGate: record.currentGate,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    repositoryStageStateApplied: record.repositoryStageStateApplied,
    roadmapMutationPerformed: record.roadmapMutationPerformed,
    stageArrayMutationPerformed: record.stageArrayMutationPerformed,
    currentStageMutationPerformed: record.currentStageMutationPerformed,
    currentGateMutationPerformed: record.currentGateMutationPerformed,
    controlPlaneMutationPerformed: record.controlPlaneMutationPerformed,
    authorityIssued: record.authorityIssued,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
  });
}

function validExecutionRecord(
  record: Pr21MerchantRepositoryStageStateExecutionRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status
        !== "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY"
      || record.pr21StageStatus !== "COMPLETE"
      || record.pr22StageStatus !== "IN_PROGRESS"
      || record.currentStage !== "PR22"
      || record.currentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || record.pr22ProductiveAuthorityIssued !== false
      || record.repositoryStageStateApplied !== true
      || record.roadmapMutationPerformed !== true
      || record.stageArrayMutationPerformed !== true
      || record.currentStageMutationPerformed !== true
      || record.currentGateMutationPerformed !== true
      || record.controlPlaneMutationPerformed !== false
      || record.authorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false) {
    return false;
  }

  sha40(
    record.sourceMainCommit,
    "PR21_REPOSITORY_FINALIZATION_SOURCE_MAIN_UNGUELTIG",
  );
  fp16(
    record.transactionFingerprint,
    "PR21_REPOSITORY_FINALIZATION_TRANSACTION_FP_UNGUELTIG",
  );
  fp16(
    record.repositoryTransitionFingerprint,
    "PR21_REPOSITORY_FINALIZATION_TRANSITION_FP_UNGUELTIG",
  );
  fp16(
    record.completionFingerprint,
    "PR21_REPOSITORY_FINALIZATION_COMPLETION_FP_UNGUELTIG",
  );
  fp16(
    record.repositoryExecutionFingerprint,
    "PR21_REPOSITORY_FINALIZATION_EXECUTION_FP_UNGUELTIG",
  );

  return evidenceFingerprint(executionBasis(record))
    === record.repositoryExecutionFingerprint;
}

export function finalisierePr21MerchantRepositoryStageStatePostExecution(
  request: Pr21MerchantRepositoryPostExecutionFinalizationRequest,
): Pr21MerchantRepositoryPostExecutionFinalizationBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_REPOSITORY_FINALIZATION_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR21_REPOSITORY_FINALIZATION_CURRENT_MAIN_UNGUELTIG",
  );
  time(
    request.finalizedAtMs,
    "PR21_REPOSITORY_FINALIZATION_ZEIT_UNGUELTIG",
  );

  const execution = request.execution;
  const record = execution.executionRecord;
  const blocker: string[] = [];

  if (execution.schemaVersion !== 1
      || execution.status
        !== "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY"
      || execution.blocker.length !== 0
      || execution.authorizationConsumed !== true
      || execution.durableIntentPersisted !== true
      || execution.mutationAttemptObserved !== true
      || execution.repositoryStageStateApplied !== true
      || execution.roadmapMutationPerformed !== true
      || execution.stageArrayMutationPerformed !== true
      || execution.currentStageMutationPerformed !== true
      || execution.currentGateMutationPerformed !== true
      || execution.pr21StageStatus !== "COMPLETE"
      || execution.pr22StageStatus !== "IN_PROGRESS"
      || execution.currentStage !== "PR22"
      || execution.currentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || execution.pr22ProductiveAuthorityIssued !== false
      || execution.controlPlaneMutationPerformed !== false
      || execution.sameIntentRetryAllowed !== false
      || execution.blindResumeAfterRestartAllowed !== false
      || execution.gameplayAuthority !== false
      || execution.rawWriteAuthority !== false
      || execution.broadRuntimeGrant !== false
      || execution.normalRuntimeAllowed !== false
      || record === null) {
    blocker.push("PR21_REPOSITORY_FINALIZATION_EXECUTION_NICHT_VERIFIZIERT");
  }

  const executionFingerprintRevalidated =
    record !== null && validExecutionRecord(record);
  if (!executionFingerprintRevalidated) {
    blocker.push("PR21_REPOSITORY_FINALIZATION_EXECUTION_FP_DRIFT");
  }

  if (record !== null
      && (record.authorizationId !== execution.authorizationId
        || record.transactionId !== execution.transactionId
        || record.transactionFingerprint !== execution.transactionFingerprint)) {
    blocker.push("PR21_REPOSITORY_FINALIZATION_EXECUTION_BINDING_DRIFT");
  }

  const state = request.currentRepositoryState;
  const repositoryPostconditionRevalidated =
    state.schemaVersion === 1
    && state.currentStage === "PR22"
    && state.currentGate === "PR22_MULTI_CHARACTER_COORDINATION"
    && state.pr21StageStatus === "COMPLETE"
    && state.pr22StageStatus === "IN_PROGRESS"
    && state.pr22ProductiveAuthorityIssued === false;

  if (!repositoryPostconditionRevalidated) {
    blocker.push("PR21_REPOSITORY_FINALIZATION_POSTCONDITION_DRIFT");
  }

  let finalization:
    Pr21MerchantRepositoryPostExecutionFinalizationRecord
    | null = null;

  if (blocker.length === 0 && record !== null) {
    const basis: Pr21MerchantRepositoryPostExecutionFinalizationRecordBasis =
      Object.freeze({
        schemaVersion: 1,
        status: "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY",
        completedStage: "PR21",
        nextDevelopmentStage: "PR22",
        sourceMainCommit: record.sourceMainCommit,
        finalizedOnMainCommit: request.currentMainCommit,
        authorizationId: record.authorizationId,
        transactionId: record.transactionId,
        transactionFingerprint: record.transactionFingerprint,
        repositoryTransitionFingerprint:
          record.repositoryTransitionFingerprint,
        completionFingerprint: record.completionFingerprint,
        repositoryExecutionFingerprint:
          record.repositoryExecutionFingerprint,
        finalizedAtMs: request.finalizedAtMs,
        pr21StageStatus: "COMPLETE",
        pr22StageStatus: "IN_PROGRESS",
        currentStage: "PR22",
        currentGate: "PR22_MULTI_CHARACTER_COORDINATION",
        pr22ProductiveAuthorityIssued: false,
        repositoryStageStateApplied: true,
        executionFingerprintRevalidated: true,
        repositoryPostconditionRevalidated: true,
        pr22DevelopmentHandoffPrepared: true,
        pr22ProductiveHandoffPrepared: false,
        additionalRepositoryMutationPerformed: false,
        controlPlaneMutationPerformed: false,
        authorityIssued: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        broadRuntimeGrant: false,
        normalRuntimeAllowed: false,
      });

    finalization = Object.freeze({
      ...basis,
      finalizationFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    record: finalization,
    executionFingerprintRevalidated,
    repositoryPostconditionRevalidated,
    pr22DevelopmentHandoffPrepared: blocker.length === 0,
    pr22ProductiveHandoffPrepared: false,
    additionalRepositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
