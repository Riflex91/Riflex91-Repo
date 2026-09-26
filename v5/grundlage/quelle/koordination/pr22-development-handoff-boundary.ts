import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantRepositoryPostExecutionFinalizationBoundary,
  Pr21MerchantRepositoryPostExecutionFinalizationRecord,
  Pr21MerchantRepositoryPostExecutionFinalizationRecordBasis,
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";

export interface Pr22DevelopmentHandoffRequest {
  readonly schemaVersion: 1;
  readonly finalization:
    Pr21MerchantRepositoryPostExecutionFinalizationBoundary;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly preparedAtMs: number;
}

export interface Pr22DevelopmentHandoffRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY";
  readonly predecessorStage: "PR21";
  readonly stage: "PR22";
  readonly finalizationFingerprint: string;
  readonly predecessorSourceMainCommit: string;
  readonly finalizedOnMainCommit: string;
  readonly preparedOnMainCommit: string;
  readonly preparedAtMs: number;
  readonly pr21StageStatus: "COMPLETE";
  readonly pr22StageStatus: "IN_PROGRESS";
  readonly currentStage: "PR22";
  readonly currentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr21CompletionFinalized: true;
  readonly pr22DevelopmentStageActive: true;
  readonly pr22ShadowAdmissionRequiredStatus: "BEREIT_NO_WRITE";
  readonly pr22ShadowWorkflowRequiredStatus: "PREPARED_NO_WRITE";
  readonly shadowDevelopmentAllowed: true;
  readonly productiveEvidenceRequired: true;
  readonly cap022FullChainRecheckRequiredBeforeProductiveEvidence: true;
  readonly separateProductiveRatificationRequired: true;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22DevelopmentHandoffRecord
  extends Pr22DevelopmentHandoffRecordBasis {
  readonly handoffFingerprint: string;
}

export interface Pr22DevelopmentHandoffBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record: Pr22DevelopmentHandoffRecord | null;
  readonly finalizationFingerprintRevalidated: boolean;
  readonly repositoryStateRevalidated: boolean;
  readonly shadowDevelopmentAllowed: boolean;
  readonly productiveEvidenceRequired: true;
  readonly separateProductiveRatificationRequired: true;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
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

function finalizationBasis(
  record: Pr21MerchantRepositoryPostExecutionFinalizationRecord,
): Pr21MerchantRepositoryPostExecutionFinalizationRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    completedStage: record.completedStage,
    nextDevelopmentStage: record.nextDevelopmentStage,
    sourceMainCommit: record.sourceMainCommit,
    finalizedOnMainCommit: record.finalizedOnMainCommit,
    authorizationId: record.authorizationId,
    transactionId: record.transactionId,
    transactionFingerprint: record.transactionFingerprint,
    repositoryTransitionFingerprint: record.repositoryTransitionFingerprint,
    completionFingerprint: record.completionFingerprint,
    repositoryExecutionFingerprint: record.repositoryExecutionFingerprint,
    finalizedAtMs: record.finalizedAtMs,
    pr21StageStatus: record.pr21StageStatus,
    pr22StageStatus: record.pr22StageStatus,
    currentStage: record.currentStage,
    currentGate: record.currentGate,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    repositoryStageStateApplied: record.repositoryStageStateApplied,
    executionFingerprintRevalidated: record.executionFingerprintRevalidated,
    repositoryPostconditionRevalidated:
      record.repositoryPostconditionRevalidated,
    pr22DevelopmentHandoffPrepared: record.pr22DevelopmentHandoffPrepared,
    pr22ProductiveHandoffPrepared: record.pr22ProductiveHandoffPrepared,
    additionalRepositoryMutationPerformed:
      record.additionalRepositoryMutationPerformed,
    controlPlaneMutationPerformed: record.controlPlaneMutationPerformed,
    authorityIssued: record.authorityIssued,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
  });
}

function validFinalizationRecord(
  record: Pr21MerchantRepositoryPostExecutionFinalizationRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status !== "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY"
      || record.completedStage !== "PR21"
      || record.nextDevelopmentStage !== "PR22"
      || record.pr21StageStatus !== "COMPLETE"
      || record.pr22StageStatus !== "IN_PROGRESS"
      || record.currentStage !== "PR22"
      || record.currentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || record.pr22ProductiveAuthorityIssued !== false
      || record.repositoryStageStateApplied !== true
      || record.executionFingerprintRevalidated !== true
      || record.repositoryPostconditionRevalidated !== true
      || record.pr22DevelopmentHandoffPrepared !== true
      || record.pr22ProductiveHandoffPrepared !== false
      || record.additionalRepositoryMutationPerformed !== false
      || record.controlPlaneMutationPerformed !== false
      || record.authorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false) {
    return false;
  }
  sha40(record.sourceMainCommit,"PR22_DEV_HANDOFF_SOURCE_MAIN_UNGUELTIG");
  sha40(record.finalizedOnMainCommit,"PR22_DEV_HANDOFF_FINAL_MAIN_UNGUELTIG");
  fp16(record.finalizationFingerprint,"PR22_DEV_HANDOFF_FINAL_FP_UNGUELTIG");
  return evidenceFingerprint(finalizationBasis(record))
    === record.finalizationFingerprint;
}

export function bereitePr22DevelopmentHandoffVor(
  request: Pr22DevelopmentHandoffRequest,
): Pr22DevelopmentHandoffBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_DEV_HANDOFF_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_DEV_HANDOFF_CURRENT_MAIN_UNGUELTIG");
  time(request.preparedAtMs,"PR22_DEV_HANDOFF_ZEIT_UNGUELTIG");

  const finalization = request.finalization;
  const finalRecord = finalization.record;
  const blocker: string[] = [];

  if (finalization.schemaVersion !== 1
      || finalization.status
        !== "READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY"
      || finalization.blocker.length !== 0
      || finalization.executionFingerprintRevalidated !== true
      || finalization.repositoryPostconditionRevalidated !== true
      || finalization.pr22DevelopmentHandoffPrepared !== true
      || finalization.pr22ProductiveHandoffPrepared !== false
      || finalization.additionalRepositoryMutationPerformed !== false
      || finalization.controlPlaneMutationPerformed !== false
      || finalization.authorityIssued !== false
      || finalization.gameplayAuthority !== false
      || finalization.rawWriteAuthority !== false
      || finalization.broadRuntimeGrant !== false
      || finalization.normalRuntimeAllowed !== false
      || finalRecord === null) {
    blocker.push("PR22_DEV_HANDOFF_PR21_FINALIZATION_NICHT_BEREIT");
  }

  const finalizationFingerprintRevalidated =
    finalRecord !== null && validFinalizationRecord(finalRecord);
  if (!finalizationFingerprintRevalidated) {
    blocker.push("PR22_DEV_HANDOFF_FINALIZATION_FP_DRIFT");
  }

  if (finalRecord !== null
      && request.currentMainCommit !== finalRecord.finalizedOnMainCommit) {
    blocker.push("PR22_DEV_HANDOFF_MAIN_STALE");
  }

  const state = request.currentRepositoryState;
  const repositoryStateRevalidated =
    state.schemaVersion === 1
    && state.currentStage === "PR22"
    && state.currentGate === "PR22_MULTI_CHARACTER_COORDINATION"
    && state.pr21StageStatus === "COMPLETE"
    && state.pr22StageStatus === "IN_PROGRESS"
    && state.pr22ProductiveAuthorityIssued === false;

  if (!repositoryStateRevalidated) {
    blocker.push("PR22_DEV_HANDOFF_REPOSITORY_STATE_DRIFT");
  }

  let record: Pr22DevelopmentHandoffRecord | null = null;
  if (blocker.length === 0 && finalRecord !== null) {
    const basis: Pr22DevelopmentHandoffRecordBasis = Object.freeze({
      schemaVersion: 1,
      status: "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY",
      predecessorStage: "PR21",
      stage: "PR22",
      finalizationFingerprint: finalRecord.finalizationFingerprint,
      predecessorSourceMainCommit: finalRecord.sourceMainCommit,
      finalizedOnMainCommit: finalRecord.finalizedOnMainCommit,
      preparedOnMainCommit: request.currentMainCommit,
      preparedAtMs: request.preparedAtMs,
      pr21StageStatus: "COMPLETE",
      pr22StageStatus: "IN_PROGRESS",
      currentStage: "PR22",
      currentGate: "PR22_MULTI_CHARACTER_COORDINATION",
      pr21CompletionFinalized: true,
      pr22DevelopmentStageActive: true,
      pr22ShadowAdmissionRequiredStatus: "BEREIT_NO_WRITE",
      pr22ShadowWorkflowRequiredStatus: "PREPARED_NO_WRITE",
      shadowDevelopmentAllowed: true,
      productiveEvidenceRequired: true,
      cap022FullChainRecheckRequiredBeforeProductiveEvidence: true,
      separateProductiveRatificationRequired: true,
      pr22ProductiveAuthorityIssued: false,
      sendCmAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      broadRuntimeGrant: false,
      normalRuntimeAllowed: false,
      repositoryMutationPerformed: false,
      controlPlaneMutationPerformed: false,
    });
    record = Object.freeze({
      ...basis,
      handoffFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    record,
    finalizationFingerprintRevalidated,
    repositoryStateRevalidated,
    shadowDevelopmentAllowed: blocker.length === 0,
    productiveEvidenceRequired: true,
    separateProductiveRatificationRequired: true,
    pr22ProductiveAuthorityIssued: false,
    sendCmAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    repositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
  });
}
