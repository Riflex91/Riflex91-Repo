import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Cap022FoundationChainReadiness,
} from "../runtime/cap022-foundation-chain-readiness.js";
import type {
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";
import type {
  Pr22CoordinationProductiveEvidenceExecutionResult,
  Pr22CoordinationProductiveEvidenceRecord,
  Pr22CoordinationProductiveEvidenceRecordBasis,
} from "./pr22-coordination-productive-evidence-one-shot-execution-boundary.js";

export interface Pr22CoordinationProductiveEvidenceRatificationRequest {
  readonly schemaVersion: 1;
  readonly execution: Pr22CoordinationProductiveEvidenceExecutionResult;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly cap022FullChain: Cap022FoundationChainReadiness;
}

export interface Pr22CoordinationProductiveEvidenceRatificationDraft {
  readonly schemaVersion: 1;
  readonly status:
    "AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RATIFICATION";
  readonly stage: "PR22";
  readonly productiveEvidenceFingerprint: string;
  readonly sourceMainCommit: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly requiredConfirmationText: string;
  readonly evidenceFingerprintRevalidated: true;
  readonly repositoryStateRevalidated: true;
  readonly cap022FullChainRevalidated: true;
  readonly evidenceStillImmutable: true;
  readonly automaticRatification: false;
  readonly ratified: false;
  readonly gateAdvanced: false;
  readonly separateGateAdvanceRequired: true;
  readonly productiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationProductiveEvidenceRatificationRecordBasis {
  readonly schemaVersion: 1;
  readonly status:
    "RATIFIED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY";
  readonly stage: "PR22";
  readonly productiveEvidenceFingerprint: string;
  readonly sourceMainCommit: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly ratifierId: string;
  readonly ratifiedAtMs: number;
  readonly confirmationText: string;
  readonly evidenceFingerprintRevalidated: true;
  readonly repositoryStateRevalidated: true;
  readonly cap022FullChainRevalidated: true;
  readonly evidenceStillImmutable: true;
  readonly ratified: true;
  readonly gateAdvanced: false;
  readonly separateGateAdvanceRequired: true;
  readonly productiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationProductiveEvidenceRatificationRecord
  extends Pr22CoordinationProductiveEvidenceRatificationRecordBasis {
  readonly ratificationFingerprint: string;
}

function text(value: string, error: string, maximum=256): void {
  if (value.trim().length === 0 || value.length > maximum) throw new Error(error);
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

function evidenceBasis(
  record: Pr22CoordinationProductiveEvidenceRecord,
): Pr22CoordinationProductiveEvidenceRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    authorizationId: record.authorizationId,
    admissionFingerprint: record.admissionFingerprint,
    shadowEvidenceFingerprint: record.shadowEvidenceFingerprint,
    transportFenceFingerprint: record.transportFenceFingerprint,
    durableIntentId: record.durableIntentId,
    sourceMainCommit: record.sourceMainCommit,
    messageId: record.messageId,
    dedupeKey: record.dedupeKey,
    workflowId: record.workflowId,
    workflowRevision: record.workflowRevision,
    recipientCharacterId: record.recipientCharacterId,
    recipientSessionId: record.recipientSessionId,
    serverRegion: record.serverRegion,
    serverIdentifier: record.serverIdentifier,
    rosterEpoch: record.rosterEpoch,
    livenessEpoch: record.livenessEpoch,
    payloadFingerprint: record.payloadFingerprint,
    observedAtMs: record.observedAtMs,
    transportExecutionPerformed: record.transportExecutionPerformed,
    sendCmCallsObserved: record.sendCmCallsObserved,
    ackEvidenceSatisfied: record.ackEvidenceSatisfied,
    settlementEvidenceSatisfied: record.settlementEvidenceSatisfied,
    ttlAndDedupeEvidenceSatisfied: record.ttlAndDedupeEvidenceSatisfied,
    rosterSessionEpochEvidenceSatisfied:
      record.rosterSessionEpochEvidenceSatisfied,
    productiveEvidenceSatisfied: record.productiveEvidenceSatisfied,
    productiveRatificationAllowed: record.productiveRatificationAllowed,
    separateProductiveRatificationRequired:
      record.separateProductiveRatificationRequired,
    oneShotTransportAuthorityConsumed:
      record.oneShotTransportAuthorityConsumed,
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

function validEvidenceRecord(
  record: Pr22CoordinationProductiveEvidenceRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status
        !== "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY"
      || record.stage !== "PR22"
      || record.transportExecutionPerformed !== true
      || record.sendCmCallsObserved !== 1
      || record.ackEvidenceSatisfied !== true
      || record.settlementEvidenceSatisfied !== true
      || record.ttlAndDedupeEvidenceSatisfied !== true
      || record.rosterSessionEpochEvidenceSatisfied !== true
      || record.productiveEvidenceSatisfied !== true
      || record.productiveRatificationAllowed !== false
      || record.separateProductiveRatificationRequired !== true
      || record.oneShotTransportAuthorityConsumed !== true
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
  sha40(record.sourceMainCommit,"PR22_RATIFICATION_SOURCE_MAIN_UNGUELTIG");
  fp16(
    record.productiveEvidenceFingerprint,
    "PR22_RATIFICATION_EVIDENCE_FP_UNGUELTIG",
  );
  return evidenceFingerprint(evidenceBasis(record))
    === record.productiveEvidenceFingerprint;
}

function validCap022(readiness: Cap022FoundationChainReadiness): boolean {
  return readiness.schemaVersion === 1
    && readiness.status === "CAP022_FULL_CHAIN_BEREIT_NO_WRITE"
    && readiness.blocker.length === 0
    && readiness.requiredFoundationIds.length === 9
    && readiness.readyFoundationIds.length === 9
    && readiness.allRequiredFoundationsPresent === true
    && readiness.allRequiredFoundationsReady === true
    && readiness.currentPr20_9RatificationCredit === false
    && readiness.candidateAcquisitionOrMutationAllowedNow === false
    && readiness.durableIntentCreated === false
    && readiness.productiveCraftAuthorityOpened === false
    && readiness.productiveExecutionAllowed === false
    && readiness.gameplayAuthority === false
    && readiness.rawWriteAuthority === false
    && readiness.normalRuntimeAllowed === false;
}

export function pr22CoordinationProductiveEvidenceRatificationConfirmationText(
  productiveEvidenceFingerprint: string,
  sourceMainCommit: string,
): string {
  fp16(
    productiveEvidenceFingerprint,
    "PR22_RATIFICATION_CONFIRM_EVIDENCE_FP_UNGUELTIG",
  );
  sha40(sourceMainCommit,"PR22_RATIFICATION_CONFIRM_MAIN_UNGUELTIG");
  return "RATIFY PR22 COORDINATION PRODUCTIVE EVIDENCE "
    + productiveEvidenceFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr22CoordinationProductiveEvidenceRatificationVor(
  request: Pr22CoordinationProductiveEvidenceRatificationRequest,
): Pr22CoordinationProductiveEvidenceRatificationDraft {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_RATIFICATION_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_RATIFICATION_CURRENT_MAIN_UNGUELTIG");

  const execution=request.execution;
  const record=execution.record;
  if (execution.schemaVersion !== 1
      || execution.status
        !== "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY"
      || execution.blocker.length !== 0
      || execution.authorizationConsumed !== true
      || execution.durableIntentPersisted !== true
      || execution.transportAttemptObserved !== true
      || execution.transportExecutionPerformed !== true
      || execution.sendCmCallsObserved !== 1
      || execution.productiveEvidenceSatisfied !== true
      || execution.productiveRatificationAllowed !== false
      || execution.pr22ProductiveAuthorityIssued !== false
      || execution.oneShotTransportAuthorityConsumed !== true
      || execution.sendCmAuthority !== false
      || execution.gameplayAuthority !== false
      || execution.rawWriteAuthority !== false
      || execution.broadRuntimeGrant !== false
      || execution.normalRuntimeAllowed !== false
      || execution.repositoryMutationPerformed !== false
      || execution.controlPlaneMutationPerformed !== false
      || execution.sameIntentRetryAllowed !== false
      || execution.blindResumeAfterRestartAllowed !== false
      || record === null) {
    throw new Error("PR22_RATIFICATION_EXECUTION_NICHT_BEREIT");
  }

  if (!validEvidenceRecord(record)
      || record.messageId !== execution.messageId
      || record.workflowId !== execution.workflowId
      || record.workflowRevision !== execution.workflowRevision) {
    throw new Error("PR22_RATIFICATION_EVIDENCE_RECORD_DRIFT");
  }
  if (request.currentMainCommit !== record.sourceMainCommit) {
    throw new Error("PR22_RATIFICATION_MAIN_STALE");
  }

  const state=request.currentRepositoryState;
  if (state.schemaVersion !== 1
      || state.currentStage !== "PR22"
      || state.currentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || state.pr21StageStatus !== "COMPLETE"
      || state.pr22StageStatus !== "IN_PROGRESS"
      || state.pr22ProductiveAuthorityIssued !== false) {
    throw new Error("PR22_RATIFICATION_REPOSITORY_STATE_DRIFT");
  }
  if (!validCap022(request.cap022FullChain)) {
    throw new Error("PR22_RATIFICATION_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }

  return Object.freeze({
    schemaVersion:1,
    status:"AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RATIFICATION",
    stage:"PR22",
    productiveEvidenceFingerprint:record.productiveEvidenceFingerprint,
    sourceMainCommit:record.sourceMainCommit,
    messageId:record.messageId,
    workflowId:record.workflowId,
    workflowRevision:record.workflowRevision,
    requiredConfirmationText:
      pr22CoordinationProductiveEvidenceRatificationConfirmationText(
        record.productiveEvidenceFingerprint,
        record.sourceMainCommit,
      ),
    evidenceFingerprintRevalidated:true,
    repositoryStateRevalidated:true,
    cap022FullChainRevalidated:true,
    evidenceStillImmutable:true,
    automaticRatification:false,
    ratified:false,
    gateAdvanced:false,
    separateGateAdvanceRequired:true,
    productiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
  });
}

export function ratifizierePr22CoordinationProductiveEvidence(
  draft: Pr22CoordinationProductiveEvidenceRatificationDraft,
  confirmationText: string,
  ratifierId: string,
  ratifiedAtMs: number,
): Pr22CoordinationProductiveEvidenceRatificationRecord {
  if (draft.schemaVersion !== 1
      || draft.status
        !== "AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RATIFICATION"
      || draft.evidenceFingerprintRevalidated !== true
      || draft.repositoryStateRevalidated !== true
      || draft.cap022FullChainRevalidated !== true
      || draft.evidenceStillImmutable !== true
      || draft.automaticRatification !== false
      || draft.ratified !== false
      || draft.gateAdvanced !== false
      || draft.separateGateAdvanceRequired !== true
      || draft.productiveAuthorityIssued !== false
      || draft.sendCmAuthority !== false
      || draft.gameplayAuthority !== false
      || draft.rawWriteAuthority !== false
      || draft.broadRuntimeGrant !== false
      || draft.normalRuntimeAllowed !== false
      || draft.repositoryMutationPerformed !== false
      || draft.controlPlaneMutationPerformed !== false) {
    throw new Error("PR22_RATIFICATION_DRAFT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR22_RATIFICATION_BESTAETIGUNG_UNGUELTIG");
  }
  text(ratifierId,"PR22_RATIFICATION_RATIFIER_UNGUELTIG",192);
  time(ratifiedAtMs,"PR22_RATIFICATION_ZEIT_UNGUELTIG");

  const basis: Pr22CoordinationProductiveEvidenceRatificationRecordBasis =
    Object.freeze({
      schemaVersion:1,
      status:"RATIFIED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
      stage:"PR22",
      productiveEvidenceFingerprint:draft.productiveEvidenceFingerprint,
      sourceMainCommit:draft.sourceMainCommit,
      messageId:draft.messageId,
      workflowId:draft.workflowId,
      workflowRevision:draft.workflowRevision,
      ratifierId,
      ratifiedAtMs,
      confirmationText,
      evidenceFingerprintRevalidated:true,
      repositoryStateRevalidated:true,
      cap022FullChainRevalidated:true,
      evidenceStillImmutable:true,
      ratified:true,
      gateAdvanced:false,
      separateGateAdvanceRequired:true,
      productiveAuthorityIssued:false,
      sendCmAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      broadRuntimeGrant:false,
      normalRuntimeAllowed:false,
      repositoryMutationPerformed:false,
      controlPlaneMutationPerformed:false,
    });

  return Object.freeze({
    ...basis,
    ratificationFingerprint:evidenceFingerprint(basis),
  });
}
