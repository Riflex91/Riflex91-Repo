import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import {
  bewertePr22ShadowWorkflow,
  type Pr22ShadowWorkflowRequest,
} from "./pr22-coordination-shadow-workflow.js";
import type {
  Pr22CoordinationDevelopmentPreflightBoundary,
  Pr22CoordinationDevelopmentPreflightRecord,
  Pr22CoordinationDevelopmentPreflightRecordBasis,
} from "./pr22-coordination-development-preflight-boundary.js";
import type {
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";

export interface Pr22CoordinationShadowEvidenceRequest {
  readonly schemaVersion: 1;
  readonly preflight: Pr22CoordinationDevelopmentPreflightBoundary;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly workflowRequest: Omit<Pr22ShadowWorkflowRequest, "admissionReady">;
  readonly ackObservedAtMs: number;
  readonly settlementObservedAtMs: number;
  readonly observedAtMs: number;
  readonly sendCmCallsObserved: 0;
  readonly gameplayCallsObserved: 0;
  readonly rawWriteCallsObserved: 0;
}

export interface Pr22CoordinationShadowEvidenceRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY";
  readonly stage: "PR22";
  readonly preflightFingerprint: string;
  readonly preflightMainCommit: string;
  readonly evidenceMainCommit: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly ackObservedAtMs: number;
  readonly settlementObservedAtMs: number;
  readonly observedAtMs: number;
  readonly workflowTerminalStatus: "ABGESCHLOSSEN";
  readonly ackCorrelated: true;
  readonly settlementCorrelated: true;
  readonly shadowEvidenceComplete: true;
  readonly shadowOnly: true;
  readonly productiveEvidenceSatisfied: false;
  readonly productiveRatificationAllowedFromShadow: false;
  readonly cap022FullChainRecheckRequiredBeforeProductiveEvidence: true;
  readonly separateProductiveEvidenceAdmissionRequired: true;
  readonly separateProductiveRatificationRequired: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly sendCmCallsObserved: 0;
  readonly gameplayCallsObserved: 0;
  readonly rawWriteCallsObserved: 0;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationShadowEvidenceRecord
  extends Pr22CoordinationShadowEvidenceRecordBasis {
  readonly evidenceFingerprint: string;
}

export interface Pr22CoordinationShadowEvidenceBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record: Pr22CoordinationShadowEvidenceRecord | null;
  readonly preflightFingerprintRevalidated: boolean;
  readonly repositoryStateRevalidated: boolean;
  readonly workflowEvidenceVerified: boolean;
  readonly shadowEvidenceComplete: boolean;
  readonly productiveEvidenceSatisfied: false;
  readonly productiveRatificationAllowedFromShadow: false;
  readonly externalRuntimeStartAuthorized: false;
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

function preflightBasis(
  record: Pr22CoordinationDevelopmentPreflightRecord,
): Pr22CoordinationDevelopmentPreflightRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    handoffFingerprint: record.handoffFingerprint,
    handoffPreparedOnMainCommit: record.handoffPreparedOnMainCommit,
    preflightMainCommit: record.preflightMainCommit,
    preparedAtMs: record.preparedAtMs,
    messageId: record.messageId,
    workflowId: record.workflowId,
    workflowRevision: record.workflowRevision,
    recipientCharacterId: record.recipientCharacterId,
    recipientSessionId: record.recipientSessionId,
    serverRegion: record.serverRegion,
    serverIdentifier: record.serverIdentifier,
    rosterEpoch: record.rosterEpoch,
    livenessEpoch: record.livenessEpoch,
    shadowAdmissionStatus: record.shadowAdmissionStatus,
    shadowWorkflowInitialStatus: record.shadowWorkflowInitialStatus,
    shadowScenarioCorrelated: record.shadowScenarioCorrelated,
    restartReconciled: record.restartReconciled,
    shadowDevelopmentAllowed: record.shadowDevelopmentAllowed,
    productiveEvidenceRequired: record.productiveEvidenceRequired,
    cap022FullChainRecheckRequiredBeforeProductiveEvidence:
      record.cap022FullChainRecheckRequiredBeforeProductiveEvidence,
    separateProductiveRatificationRequired:
      record.separateProductiveRatificationRequired,
    externalRuntimeStartAuthorized: record.externalRuntimeStartAuthorized,
    shadowTransportSendPerformed: record.shadowTransportSendPerformed,
    sendCmAuthority: record.sendCmAuthority,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
    repositoryMutationPerformed: record.repositoryMutationPerformed,
    controlPlaneMutationPerformed: record.controlPlaneMutationPerformed,
  });
}

function validPreflightRecord(
  record: Pr22CoordinationDevelopmentPreflightRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status
        !== "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY"
      || record.stage !== "PR22"
      || record.shadowAdmissionStatus !== "BEREIT_NO_WRITE"
      || record.shadowWorkflowInitialStatus !== "ACK_AUSSTEHEND"
      || record.shadowScenarioCorrelated !== true
      || record.restartReconciled !== true
      || record.shadowDevelopmentAllowed !== true
      || record.productiveEvidenceRequired !== true
      || record.cap022FullChainRecheckRequiredBeforeProductiveEvidence !== true
      || record.separateProductiveRatificationRequired !== true
      || record.externalRuntimeStartAuthorized !== false
      || record.shadowTransportSendPerformed !== false
      || record.sendCmAuthority !== false
      || record.pr22ProductiveAuthorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false
      || record.repositoryMutationPerformed !== false
      || record.controlPlaneMutationPerformed !== false) {
    return false;
  }
  sha40(record.preflightMainCommit,"PR22_SHADOW_EVIDENCE_PREFLIGHT_MAIN_UNGUELTIG");
  fp16(record.preflightFingerprint,"PR22_SHADOW_EVIDENCE_PREFLIGHT_FP_UNGUELTIG");
  return evidenceFingerprint(preflightBasis(record)) === record.preflightFingerprint;
}

export function finalisierePr22CoordinationShadowEvidence(
  request: Pr22CoordinationShadowEvidenceRequest,
): Pr22CoordinationShadowEvidenceBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_SHADOW_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_SHADOW_EVIDENCE_MAIN_UNGUELTIG");
  time(request.ackObservedAtMs,"PR22_SHADOW_EVIDENCE_ACK_ZEIT_UNGUELTIG");
  time(request.settlementObservedAtMs,"PR22_SHADOW_EVIDENCE_SETTLEMENT_ZEIT_UNGUELTIG");
  time(request.observedAtMs,"PR22_SHADOW_EVIDENCE_OBSERVED_ZEIT_UNGUELTIG");

  const blocker: string[] = [];
  const preflightRecord = request.preflight.record;

  if (request.preflight.schemaVersion !== 1
      || request.preflight.status
        !== "READY_FOR_PR22_COORDINATION_SHADOW_PREFLIGHT_RECORD_ONLY"
      || request.preflight.blocker.length !== 0
      || request.preflight.handoffFingerprintRevalidated !== true
      || request.preflight.repositoryStateRevalidated !== true
      || request.preflight.shadowAdmissionReady !== true
      || request.preflight.shadowWorkflowReady !== true
      || request.preflight.shadowDevelopmentAllowed !== true
      || request.preflight.productiveEvidenceRequired !== true
      || request.preflight.externalRuntimeStartAuthorized !== false
      || request.preflight.shadowTransportSendPerformed !== false
      || request.preflight.sendCmAuthority !== false
      || request.preflight.pr22ProductiveAuthorityIssued !== false
      || request.preflight.gameplayAuthority !== false
      || request.preflight.rawWriteAuthority !== false
      || request.preflight.broadRuntimeGrant !== false
      || request.preflight.normalRuntimeAllowed !== false
      || request.preflight.repositoryMutationPerformed !== false
      || request.preflight.controlPlaneMutationPerformed !== false
      || preflightRecord === null) {
    blocker.push("PR22_SHADOW_EVIDENCE_PREFLIGHT_NICHT_BEREIT");
  }

  const preflightFingerprintRevalidated =
    preflightRecord !== null && validPreflightRecord(preflightRecord);
  if (!preflightFingerprintRevalidated) {
    blocker.push("PR22_SHADOW_EVIDENCE_PREFLIGHT_FP_DRIFT");
  }

  if (preflightRecord !== null
      && request.currentMainCommit !== preflightRecord.preflightMainCommit) {
    blocker.push("PR22_SHADOW_EVIDENCE_MAIN_STALE");
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
    blocker.push("PR22_SHADOW_EVIDENCE_REPOSITORY_STATE_DRIFT");
  }

  if (preflightRecord !== null
      && (request.workflowRequest.messageId !== preflightRecord.messageId
        || request.workflowRequest.workflowId !== preflightRecord.workflowId
        || request.workflowRequest.workflowRevision
          !== preflightRecord.workflowRevision)) {
    blocker.push("PR22_SHADOW_EVIDENCE_SCENARIO_BINDING_DRIFT");
  }

  const workflow = bewertePr22ShadowWorkflow(Object.freeze({
    ...request.workflowRequest,
    admissionReady: true,
  }));
  const workflowEvidenceVerified =
    workflow.status === "ABGESCHLOSSEN"
    && workflow.blocker.length === 0
    && workflow.sameMessageIdAcrossRetry === true
    && workflow.semanticRetryCreatesNewMessage === false
    && workflow.settlementTerminal === true
    && workflow.staleRecipientAuthority === false
    && workflow.sendCmAuthority === false
    && workflow.gameplayAuthority === false
    && workflow.rawWriteAuthority === false
    && workflow.normalRuntimeAllowed === false
    && request.workflowRequest.ackObserved === true
    && request.workflowRequest.settlementObserved === true
    && request.workflowRequest.ackCorrelated === true
    && request.workflowRequest.settlementCorrelated === true
    && request.workflowRequest.ttlFresh === true
    && request.workflowRequest.recipientFresh === true
    && (!request.workflowRequest.restartObserved
      || request.workflowRequest.restartReconciled === true);
  if (!workflowEvidenceVerified) {
    blocker.push("PR22_SHADOW_EVIDENCE_WORKFLOW_NICHT_TERMINAL_VERIFIZIERT");
  }

  if (preflightRecord !== null
      && (request.ackObservedAtMs < preflightRecord.preparedAtMs
        || request.settlementObservedAtMs < request.ackObservedAtMs
        || request.observedAtMs < request.settlementObservedAtMs)) {
    blocker.push("PR22_SHADOW_EVIDENCE_ZEITREIHENFOLGE_UNGUELTIG");
  }

  if (request.sendCmCallsObserved !== 0
      || request.gameplayCallsObserved !== 0
      || request.rawWriteCallsObserved !== 0) {
    blocker.push("PR22_SHADOW_EVIDENCE_WRITE_BEOBACHTET");
  }

  let record: Pr22CoordinationShadowEvidenceRecord | null = null;
  if (blocker.length === 0 && preflightRecord !== null) {
    const basis: Pr22CoordinationShadowEvidenceRecordBasis = Object.freeze({
      schemaVersion: 1,
      status: "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY",
      stage: "PR22",
      preflightFingerprint: preflightRecord.preflightFingerprint,
      preflightMainCommit: preflightRecord.preflightMainCommit,
      evidenceMainCommit: request.currentMainCommit,
      messageId: preflightRecord.messageId,
      workflowId: preflightRecord.workflowId,
      workflowRevision: preflightRecord.workflowRevision,
      ackObservedAtMs: request.ackObservedAtMs,
      settlementObservedAtMs: request.settlementObservedAtMs,
      observedAtMs: request.observedAtMs,
      workflowTerminalStatus: "ABGESCHLOSSEN",
      ackCorrelated: true,
      settlementCorrelated: true,
      shadowEvidenceComplete: true,
      shadowOnly: true,
      productiveEvidenceSatisfied: false,
      productiveRatificationAllowedFromShadow: false,
      cap022FullChainRecheckRequiredBeforeProductiveEvidence: true,
      separateProductiveEvidenceAdmissionRequired: true,
      separateProductiveRatificationRequired: true,
      externalRuntimeStartAuthorized: false,
      sendCmCallsObserved: 0,
      gameplayCallsObserved: 0,
      rawWriteCallsObserved: 0,
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
      evidenceFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    record,
    preflightFingerprintRevalidated,
    repositoryStateRevalidated,
    workflowEvidenceVerified,
    shadowEvidenceComplete: blocker.length === 0,
    productiveEvidenceSatisfied: false,
    productiveRatificationAllowedFromShadow: false,
    externalRuntimeStartAuthorized: false,
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
