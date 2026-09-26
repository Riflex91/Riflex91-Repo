import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import {
  pruefePr22CoordinationShadowAdmission,
  type Pr22CoordinationShadowRequest,
} from "./pr22-coordination-shadow-admission.js";
import {
  bewertePr22ShadowWorkflow,
  type Pr22ShadowWorkflowRequest,
} from "./pr22-coordination-shadow-workflow.js";
import type {
  Pr22DevelopmentHandoffBoundary,
  Pr22DevelopmentHandoffRecord,
  Pr22DevelopmentHandoffRecordBasis,
} from "./pr22-development-handoff-boundary.js";
import type {
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";

export interface Pr22CoordinationDevelopmentPreflightRequest {
  readonly schemaVersion: 1;
  readonly handoff: Pr22DevelopmentHandoffBoundary;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly admissionRequest: Pr22CoordinationShadowRequest;
  readonly workflowRequest: Omit<Pr22ShadowWorkflowRequest, "admissionReady">;
  readonly preparedAtMs: number;
}

export interface Pr22CoordinationDevelopmentPreflightRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY";
  readonly stage: "PR22";
  readonly handoffFingerprint: string;
  readonly handoffPreparedOnMainCommit: string;
  readonly preflightMainCommit: string;
  readonly preparedAtMs: number;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly recipientCharacterId: string;
  readonly recipientSessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoch: number;
  readonly livenessEpoch: number;
  readonly shadowAdmissionStatus: "BEREIT_NO_WRITE";
  readonly shadowWorkflowInitialStatus: "ACK_AUSSTEHEND";
  readonly shadowScenarioCorrelated: true;
  readonly restartReconciled: true;
  readonly shadowDevelopmentAllowed: true;
  readonly productiveEvidenceRequired: true;
  readonly cap022FullChainRecheckRequiredBeforeProductiveEvidence: true;
  readonly separateProductiveRatificationRequired: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly shadowTransportSendPerformed: false;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationDevelopmentPreflightRecord
  extends Pr22CoordinationDevelopmentPreflightRecordBasis {
  readonly preflightFingerprint: string;
}

export interface Pr22CoordinationDevelopmentPreflightBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record: Pr22CoordinationDevelopmentPreflightRecord | null;
  readonly handoffFingerprintRevalidated: boolean;
  readonly repositoryStateRevalidated: boolean;
  readonly shadowAdmissionReady: boolean;
  readonly shadowWorkflowReady: boolean;
  readonly shadowDevelopmentAllowed: boolean;
  readonly productiveEvidenceRequired: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly shadowTransportSendPerformed: false;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
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

function handoffBasis(
  record: Pr22DevelopmentHandoffRecord,
): Pr22DevelopmentHandoffRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    predecessorStage: record.predecessorStage,
    stage: record.stage,
    finalizationFingerprint: record.finalizationFingerprint,
    predecessorSourceMainCommit: record.predecessorSourceMainCommit,
    finalizedOnMainCommit: record.finalizedOnMainCommit,
    preparedOnMainCommit: record.preparedOnMainCommit,
    preparedAtMs: record.preparedAtMs,
    pr21StageStatus: record.pr21StageStatus,
    pr22StageStatus: record.pr22StageStatus,
    currentStage: record.currentStage,
    currentGate: record.currentGate,
    pr21CompletionFinalized: record.pr21CompletionFinalized,
    pr22DevelopmentStageActive: record.pr22DevelopmentStageActive,
    pr22ShadowAdmissionRequiredStatus:
      record.pr22ShadowAdmissionRequiredStatus,
    pr22ShadowWorkflowRequiredStatus:
      record.pr22ShadowWorkflowRequiredStatus,
    shadowDevelopmentAllowed: record.shadowDevelopmentAllowed,
    productiveEvidenceRequired: record.productiveEvidenceRequired,
    cap022FullChainRecheckRequiredBeforeProductiveEvidence:
      record.cap022FullChainRecheckRequiredBeforeProductiveEvidence,
    separateProductiveRatificationRequired:
      record.separateProductiveRatificationRequired,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    sendCmAuthority: record.sendCmAuthority,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
    repositoryMutationPerformed: record.repositoryMutationPerformed,
    controlPlaneMutationPerformed: record.controlPlaneMutationPerformed,
  });
}

function validHandoffRecord(record: Pr22DevelopmentHandoffRecord): boolean {
  if (record.schemaVersion !== 1
      || record.status !== "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY"
      || record.predecessorStage !== "PR21"
      || record.stage !== "PR22"
      || record.pr21StageStatus !== "COMPLETE"
      || record.pr22StageStatus !== "IN_PROGRESS"
      || record.currentStage !== "PR22"
      || record.currentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || record.pr21CompletionFinalized !== true
      || record.pr22DevelopmentStageActive !== true
      || record.pr22ShadowAdmissionRequiredStatus !== "BEREIT_NO_WRITE"
      || record.pr22ShadowWorkflowRequiredStatus !== "PREPARED_NO_WRITE"
      || record.shadowDevelopmentAllowed !== true
      || record.productiveEvidenceRequired !== true
      || record.cap022FullChainRecheckRequiredBeforeProductiveEvidence !== true
      || record.separateProductiveRatificationRequired !== true
      || record.pr22ProductiveAuthorityIssued !== false
      || record.sendCmAuthority !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false
      || record.repositoryMutationPerformed !== false
      || record.controlPlaneMutationPerformed !== false) {
    return false;
  }
  sha40(record.preparedOnMainCommit,"PR22_DEV_PREFLIGHT_HANDOFF_MAIN_UNGUELTIG");
  fp16(record.handoffFingerprint,"PR22_DEV_PREFLIGHT_HANDOFF_FP_UNGUELTIG");
  return evidenceFingerprint(handoffBasis(record)) === record.handoffFingerprint;
}

export function bereitePr22CoordinationDevelopmentPreflightVor(
  request: Pr22CoordinationDevelopmentPreflightRequest,
): Pr22CoordinationDevelopmentPreflightBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_DEV_PREFLIGHT_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_DEV_PREFLIGHT_MAIN_UNGUELTIG");
  time(request.preparedAtMs,"PR22_DEV_PREFLIGHT_ZEIT_UNGUELTIG");

  const blocker: string[] = [];
  const handoffRecord = request.handoff.record;

  if (request.handoff.schemaVersion !== 1
      || request.handoff.status
        !== "READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY"
      || request.handoff.blocker.length !== 0
      || request.handoff.finalizationFingerprintRevalidated !== true
      || request.handoff.repositoryStateRevalidated !== true
      || request.handoff.shadowDevelopmentAllowed !== true
      || request.handoff.productiveEvidenceRequired !== true
      || request.handoff.separateProductiveRatificationRequired !== true
      || request.handoff.pr22ProductiveAuthorityIssued !== false
      || request.handoff.sendCmAuthority !== false
      || request.handoff.gameplayAuthority !== false
      || request.handoff.rawWriteAuthority !== false
      || request.handoff.broadRuntimeGrant !== false
      || request.handoff.normalRuntimeAllowed !== false
      || request.handoff.repositoryMutationPerformed !== false
      || request.handoff.controlPlaneMutationPerformed !== false
      || handoffRecord === null) {
    blocker.push("PR22_DEV_PREFLIGHT_HANDOFF_NICHT_BEREIT");
  }

  const handoffFingerprintRevalidated =
    handoffRecord !== null && validHandoffRecord(handoffRecord);
  if (!handoffFingerprintRevalidated) {
    blocker.push("PR22_DEV_PREFLIGHT_HANDOFF_FP_DRIFT");
  }

  if (handoffRecord !== null
      && request.currentMainCommit !== handoffRecord.preparedOnMainCommit) {
    blocker.push("PR22_DEV_PREFLIGHT_MAIN_STALE");
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
    blocker.push("PR22_DEV_PREFLIGHT_REPOSITORY_STATE_DRIFT");
  }

  const admission = pruefePr22CoordinationShadowAdmission(
    request.admissionRequest,
  );
  const shadowAdmissionReady =
    admission.status === "BEREIT_NO_WRITE"
    && admission.blocker.length === 0
    && admission.sendCmAuthority === false
    && admission.gameplayAuthority === false
    && admission.rawWriteAuthority === false
    && admission.staleCharacterAuthority === false
    && admission.blindResumeAllowed === false
    && admission.normalRuntimeAllowed === false;
  if (!shadowAdmissionReady) {
    blocker.push("PR22_DEV_PREFLIGHT_SHADOW_ADMISSION_BLOCKIERT");
  }

  const workflow = bewertePr22ShadowWorkflow(Object.freeze({
    ...request.workflowRequest,
    admissionReady: shadowAdmissionReady,
  }));
  const shadowScenarioCorrelated =
    admission.messageId === request.workflowRequest.messageId
    && admission.workflowId === request.workflowRequest.workflowId
    && admission.workflowRevision === request.workflowRequest.workflowRevision;
  if (!shadowScenarioCorrelated) {
    blocker.push("PR22_DEV_PREFLIGHT_SCENARIO_BINDING_DRIFT");
  }

  const shadowWorkflowReady =
    workflow.status === "ACK_AUSSTEHEND"
    && workflow.blocker.length === 0
    && workflow.sameMessageIdAcrossRetry === true
    && workflow.semanticRetryCreatesNewMessage === false
    && workflow.settlementTerminal === true
    && workflow.staleRecipientAuthority === false
    && workflow.sendCmAuthority === false
    && workflow.gameplayAuthority === false
    && workflow.rawWriteAuthority === false
    && workflow.normalRuntimeAllowed === false
    && request.workflowRequest.ackObserved === false
    && request.workflowRequest.settlementObserved === false
    && request.workflowRequest.restartObserved === false
    && request.workflowRequest.restartReconciled === true;
  if (!shadowWorkflowReady) {
    blocker.push("PR22_DEV_PREFLIGHT_SHADOW_WORKFLOW_NICHT_INITIAL_BEREIT");
  }

  let record: Pr22CoordinationDevelopmentPreflightRecord | null = null;
  if (blocker.length === 0 && handoffRecord !== null) {
    const basis: Pr22CoordinationDevelopmentPreflightRecordBasis =
      Object.freeze({
        schemaVersion: 1,
        status: "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY",
        stage: "PR22",
        handoffFingerprint: handoffRecord.handoffFingerprint,
        handoffPreparedOnMainCommit: handoffRecord.preparedOnMainCommit,
        preflightMainCommit: request.currentMainCommit,
        preparedAtMs: request.preparedAtMs,
        messageId: admission.messageId,
        workflowId: admission.workflowId,
        workflowRevision: admission.workflowRevision,
        recipientCharacterId: request.admissionRequest.recipientCharacterId,
        recipientSessionId: request.admissionRequest.recipientSessionId,
        serverRegion: request.admissionRequest.serverRegion,
        serverIdentifier: request.admissionRequest.serverIdentifier,
        rosterEpoch: request.admissionRequest.rosterEpoch,
        livenessEpoch: request.admissionRequest.livenessEpoch,
        shadowAdmissionStatus: "BEREIT_NO_WRITE",
        shadowWorkflowInitialStatus: "ACK_AUSSTEHEND",
        shadowScenarioCorrelated: true,
        restartReconciled: true,
        shadowDevelopmentAllowed: true,
        productiveEvidenceRequired: true,
        cap022FullChainRecheckRequiredBeforeProductiveEvidence: true,
        separateProductiveRatificationRequired: true,
        externalRuntimeStartAuthorized: false,
        shadowTransportSendPerformed: false,
        sendCmAuthority: false,
        pr22ProductiveAuthorityIssued: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        broadRuntimeGrant: false,
        normalRuntimeAllowed: false,
        repositoryMutationPerformed: false,
        controlPlaneMutationPerformed: false,
      });
    record = Object.freeze({
      ...basis,
      preflightFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    record,
    handoffFingerprintRevalidated,
    repositoryStateRevalidated,
    shadowAdmissionReady,
    shadowWorkflowReady,
    shadowDevelopmentAllowed: blocker.length === 0,
    productiveEvidenceRequired: true,
    externalRuntimeStartAuthorized: false,
    shadowTransportSendPerformed: false,
    sendCmAuthority: false,
    pr22ProductiveAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    repositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
  });
}
