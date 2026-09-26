import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Cap022FoundationChainReadiness,
} from "../runtime/cap022-foundation-chain-readiness.js";
import type {
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";
import type {
  Pr22CoordinationShadowEvidenceBoundary,
  Pr22CoordinationShadowEvidenceRecord,
  Pr22CoordinationShadowEvidenceRecordBasis,
} from "./pr22-coordination-shadow-evidence-boundary.js";

export interface Pr22CoordinationProductiveEvidenceAdmissionRequest {
  readonly schemaVersion: 1;
  readonly shadowEvidence: Pr22CoordinationShadowEvidenceBoundary;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly cap022FullChain: Cap022FoundationChainReadiness;
  readonly preparedAtMs: number;
}

export interface Pr22CoordinationProductiveEvidenceAdmissionRecordBasis {
  readonly schemaVersion: 1;
  readonly status:
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY";
  readonly stage: "PR22";
  readonly shadowEvidenceFingerprint: string;
  readonly shadowEvidenceMainCommit: string;
  readonly admissionMainCommit: string;
  readonly preparedAtMs: number;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly shadowEvidenceComplete: true;
  readonly cap022FullChainStatus: "CAP022_FULL_CHAIN_BEREIT_NO_WRITE";
  readonly cap022AllRequiredFoundationsPresent: true;
  readonly cap022AllRequiredFoundationsReady: true;
  readonly productiveEvidenceStillRequired: true;
  readonly realCmTransportRequired: true;
  readonly ackEvidenceRequired: true;
  readonly settlementEvidenceRequired: true;
  readonly ttlAndDedupeEvidenceRequired: true;
  readonly rosterSessionEpochEvidenceRequired: true;
  readonly separateExecutionAuthorizationRequired: true;
  readonly exactExecutionAuthorizationRequired: true;
  readonly durableIntentRequiredBeforeSend: true;
  readonly oneShotSendRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly cap022FullChainRecheckRequiredAtExecution: true;
  readonly repositoryStateRecheckRequiredAtExecution: true;
  readonly shadowEvidenceFingerprintRecheckRequiredAtExecution: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly productiveEvidenceSatisfied: false;
  readonly productiveRatificationAllowed: false;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationProductiveEvidenceAdmissionRecord
  extends Pr22CoordinationProductiveEvidenceAdmissionRecordBasis {
  readonly admissionFingerprint: string;
}

export interface Pr22CoordinationProductiveEvidenceAdmissionBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record:
    Pr22CoordinationProductiveEvidenceAdmissionRecord
    | null;
  readonly shadowEvidenceFingerprintRevalidated: boolean;
  readonly repositoryStateRevalidated: boolean;
  readonly cap022FullChainRevalidated: boolean;
  readonly productiveEvidenceStillRequired: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly productiveEvidenceSatisfied: false;
  readonly productiveRatificationAllowed: false;
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

function shadowEvidenceBasis(
  record: Pr22CoordinationShadowEvidenceRecord,
): Pr22CoordinationShadowEvidenceRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    preflightFingerprint: record.preflightFingerprint,
    preflightMainCommit: record.preflightMainCommit,
    evidenceMainCommit: record.evidenceMainCommit,
    messageId: record.messageId,
    workflowId: record.workflowId,
    workflowRevision: record.workflowRevision,
    ackObservedAtMs: record.ackObservedAtMs,
    settlementObservedAtMs: record.settlementObservedAtMs,
    observedAtMs: record.observedAtMs,
    workflowTerminalStatus: record.workflowTerminalStatus,
    ackCorrelated: record.ackCorrelated,
    settlementCorrelated: record.settlementCorrelated,
    shadowEvidenceComplete: record.shadowEvidenceComplete,
    shadowOnly: record.shadowOnly,
    productiveEvidenceSatisfied: record.productiveEvidenceSatisfied,
    productiveRatificationAllowedFromShadow:
      record.productiveRatificationAllowedFromShadow,
    cap022FullChainRecheckRequiredBeforeProductiveEvidence:
      record.cap022FullChainRecheckRequiredBeforeProductiveEvidence,
    separateProductiveEvidenceAdmissionRequired:
      record.separateProductiveEvidenceAdmissionRequired,
    separateProductiveRatificationRequired:
      record.separateProductiveRatificationRequired,
    externalRuntimeStartAuthorized: record.externalRuntimeStartAuthorized,
    sendCmCallsObserved: record.sendCmCallsObserved,
    gameplayCallsObserved: record.gameplayCallsObserved,
    rawWriteCallsObserved: record.rawWriteCallsObserved,
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

function validShadowEvidenceRecord(
  record: Pr22CoordinationShadowEvidenceRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status
        !== "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY"
      || record.stage !== "PR22"
      || record.workflowTerminalStatus !== "ABGESCHLOSSEN"
      || record.ackCorrelated !== true
      || record.settlementCorrelated !== true
      || record.shadowEvidenceComplete !== true
      || record.shadowOnly !== true
      || record.productiveEvidenceSatisfied !== false
      || record.productiveRatificationAllowedFromShadow !== false
      || record.cap022FullChainRecheckRequiredBeforeProductiveEvidence !== true
      || record.separateProductiveEvidenceAdmissionRequired !== true
      || record.separateProductiveRatificationRequired !== true
      || record.externalRuntimeStartAuthorized !== false
      || record.sendCmCallsObserved !== 0
      || record.gameplayCallsObserved !== 0
      || record.rawWriteCallsObserved !== 0
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
  sha40(record.evidenceMainCommit,"PR22_PRODUCTIVE_ADMISSION_EVIDENCE_MAIN_UNGUELTIG");
  fp16(record.evidenceFingerprint,"PR22_PRODUCTIVE_ADMISSION_EVIDENCE_FP_UNGUELTIG");
  return evidenceFingerprint(shadowEvidenceBasis(record))
    === record.evidenceFingerprint;
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

export function bereitePr22CoordinationProductiveEvidenceAdmissionVor(
  request: Pr22CoordinationProductiveEvidenceAdmissionRequest,
): Pr22CoordinationProductiveEvidenceAdmissionBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_PRODUCTIVE_ADMISSION_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_PRODUCTIVE_ADMISSION_MAIN_UNGUELTIG");
  time(request.preparedAtMs,"PR22_PRODUCTIVE_ADMISSION_ZEIT_UNGUELTIG");

  const blocker: string[] = [];
  const evidenceRecord = request.shadowEvidence.record;

  if (request.shadowEvidence.schemaVersion !== 1
      || request.shadowEvidence.status
        !== "READY_FOR_PR22_COORDINATION_SHADOW_EVIDENCE_RECORD_ONLY"
      || request.shadowEvidence.blocker.length !== 0
      || request.shadowEvidence.preflightFingerprintRevalidated !== true
      || request.shadowEvidence.repositoryStateRevalidated !== true
      || request.shadowEvidence.workflowEvidenceVerified !== true
      || request.shadowEvidence.shadowEvidenceComplete !== true
      || request.shadowEvidence.productiveEvidenceSatisfied !== false
      || request.shadowEvidence.productiveRatificationAllowedFromShadow !== false
      || request.shadowEvidence.externalRuntimeStartAuthorized !== false
      || request.shadowEvidence.sendCmAuthority !== false
      || request.shadowEvidence.pr22ProductiveAuthorityIssued !== false
      || request.shadowEvidence.gameplayAuthority !== false
      || request.shadowEvidence.rawWriteAuthority !== false
      || request.shadowEvidence.broadRuntimeGrant !== false
      || request.shadowEvidence.normalRuntimeAllowed !== false
      || request.shadowEvidence.repositoryMutationPerformed !== false
      || request.shadowEvidence.controlPlaneMutationPerformed !== false
      || evidenceRecord === null) {
    blocker.push("PR22_PRODUCTIVE_ADMISSION_SHADOW_EVIDENCE_NICHT_BEREIT");
  }

  const shadowEvidenceFingerprintRevalidated =
    evidenceRecord !== null && validShadowEvidenceRecord(evidenceRecord);
  if (!shadowEvidenceFingerprintRevalidated) {
    blocker.push("PR22_PRODUCTIVE_ADMISSION_SHADOW_EVIDENCE_FP_DRIFT");
  }

  if (evidenceRecord !== null
      && request.currentMainCommit !== evidenceRecord.evidenceMainCommit) {
    blocker.push("PR22_PRODUCTIVE_ADMISSION_MAIN_STALE");
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
    blocker.push("PR22_PRODUCTIVE_ADMISSION_REPOSITORY_STATE_DRIFT");
  }

  const cap022FullChainRevalidated = validCap022(request.cap022FullChain);
  if (!cap022FullChainRevalidated) {
    blocker.push("PR22_PRODUCTIVE_ADMISSION_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }

  let record: Pr22CoordinationProductiveEvidenceAdmissionRecord | null = null;
  if (blocker.length === 0 && evidenceRecord !== null) {
    const basis: Pr22CoordinationProductiveEvidenceAdmissionRecordBasis =
      Object.freeze({
        schemaVersion: 1,
        status:
          "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY",
        stage: "PR22",
        shadowEvidenceFingerprint: evidenceRecord.evidenceFingerprint,
        shadowEvidenceMainCommit: evidenceRecord.evidenceMainCommit,
        admissionMainCommit: request.currentMainCommit,
        preparedAtMs: request.preparedAtMs,
        messageId: evidenceRecord.messageId,
        workflowId: evidenceRecord.workflowId,
        workflowRevision: evidenceRecord.workflowRevision,
        shadowEvidenceComplete: true,
        cap022FullChainStatus: "CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
        cap022AllRequiredFoundationsPresent: true,
        cap022AllRequiredFoundationsReady: true,
        productiveEvidenceStillRequired: true,
        realCmTransportRequired: true,
        ackEvidenceRequired: true,
        settlementEvidenceRequired: true,
        ttlAndDedupeEvidenceRequired: true,
        rosterSessionEpochEvidenceRequired: true,
        separateExecutionAuthorizationRequired: true,
        exactExecutionAuthorizationRequired: true,
        durableIntentRequiredBeforeSend: true,
        oneShotSendRequired: true,
        sameIntentRetryAllowed: false,
        unknownOutcomeRequiresReconciliation: true,
        cap022FullChainRecheckRequiredAtExecution: true,
        repositoryStateRecheckRequiredAtExecution: true,
        shadowEvidenceFingerprintRecheckRequiredAtExecution: true,
        externalRuntimeStartAuthorized: false,
        productiveEvidenceSatisfied: false,
        productiveRatificationAllowed: false,
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
      admissionFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    record,
    shadowEvidenceFingerprintRevalidated,
    repositoryStateRevalidated,
    cap022FullChainRevalidated,
    productiveEvidenceStillRequired: true,
    externalRuntimeStartAuthorized: false,
    productiveEvidenceSatisfied: false,
    productiveRatificationAllowed: false,
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
