import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr22CoordinationProductiveEvidenceAdmissionBoundary,
  Pr22CoordinationProductiveEvidenceAdmissionRecord,
  Pr22CoordinationProductiveEvidenceAdmissionRecordBasis,
} from "./pr22-coordination-productive-evidence-admission-boundary.js";

export interface Pr22CoordinationProductiveEvidenceExecutionAuthorizationDraft {
  readonly schemaVersion: 1;
  readonly status:
    "AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_AUTHORIZATION";
  readonly authorizationId: string;
  readonly admissionFingerprint: string;
  readonly shadowEvidenceFingerprint: string;
  readonly sourceMainCommit: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly issuedAtMs: number;
  readonly expiresAtMs: number;
  readonly maximumUses: 1;
  readonly requiredConfirmationText: string;
  readonly cap022FullChainRequired: true;
  readonly repositoryStateRecheckRequiredAtExecution: true;
  readonly admissionFingerprintRecheckRequiredAtExecution: true;
  readonly shadowEvidenceFingerprintRecheckRequiredAtExecution: true;
  readonly cap022FullChainRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeSend: true;
  readonly oneShotSendRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly ackEvidenceRequired: true;
  readonly settlementEvidenceRequired: true;
  readonly ttlAndDedupeEvidenceRequired: true;
  readonly rosterSessionEpochEvidenceRequired: true;
  readonly executionAuthorizationIssued: false;
  readonly authorizationConsumed: false;
  readonly externalRuntimeStartAuthorized: false;
  readonly transportExecutionPerformed: false;
  readonly productiveEvidenceSatisfied: false;
  readonly productiveRatificationAllowed: false;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr22CoordinationProductiveEvidenceExecutionAuthorizationRecord
  extends Omit<
    Pr22CoordinationProductiveEvidenceExecutionAuthorizationDraft,
    "status" | "requiredConfirmationText" | "executionAuthorizationIssued"
  > {
  readonly status:
    "AUTHORIZED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ONE_SHOT_RECORD_ONLY";
  readonly operatorId: string;
  readonly authorizedAtMs: number;
  readonly confirmationText: string;
  readonly executionAuthorizationIssued: true;
}

function text(value: string, error: string, maximum = 256): void {
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

function admissionBasis(
  record: Pr22CoordinationProductiveEvidenceAdmissionRecord,
): Pr22CoordinationProductiveEvidenceAdmissionRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    shadowEvidenceFingerprint: record.shadowEvidenceFingerprint,
    shadowEvidenceMainCommit: record.shadowEvidenceMainCommit,
    admissionMainCommit: record.admissionMainCommit,
    preparedAtMs: record.preparedAtMs,
    messageId: record.messageId,
    workflowId: record.workflowId,
    workflowRevision: record.workflowRevision,
    shadowEvidenceComplete: record.shadowEvidenceComplete,
    cap022FullChainStatus: record.cap022FullChainStatus,
    cap022AllRequiredFoundationsPresent:
      record.cap022AllRequiredFoundationsPresent,
    cap022AllRequiredFoundationsReady:
      record.cap022AllRequiredFoundationsReady,
    productiveEvidenceStillRequired: record.productiveEvidenceStillRequired,
    realCmTransportRequired: record.realCmTransportRequired,
    ackEvidenceRequired: record.ackEvidenceRequired,
    settlementEvidenceRequired: record.settlementEvidenceRequired,
    ttlAndDedupeEvidenceRequired: record.ttlAndDedupeEvidenceRequired,
    rosterSessionEpochEvidenceRequired:
      record.rosterSessionEpochEvidenceRequired,
    separateExecutionAuthorizationRequired:
      record.separateExecutionAuthorizationRequired,
    exactExecutionAuthorizationRequired:
      record.exactExecutionAuthorizationRequired,
    durableIntentRequiredBeforeSend: record.durableIntentRequiredBeforeSend,
    oneShotSendRequired: record.oneShotSendRequired,
    sameIntentRetryAllowed: record.sameIntentRetryAllowed,
    unknownOutcomeRequiresReconciliation:
      record.unknownOutcomeRequiresReconciliation,
    cap022FullChainRecheckRequiredAtExecution:
      record.cap022FullChainRecheckRequiredAtExecution,
    repositoryStateRecheckRequiredAtExecution:
      record.repositoryStateRecheckRequiredAtExecution,
    shadowEvidenceFingerprintRecheckRequiredAtExecution:
      record.shadowEvidenceFingerprintRecheckRequiredAtExecution,
    externalRuntimeStartAuthorized: record.externalRuntimeStartAuthorized,
    productiveEvidenceSatisfied: record.productiveEvidenceSatisfied,
    productiveRatificationAllowed: record.productiveRatificationAllowed,
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

function validateAdmission(
  boundary: Pr22CoordinationProductiveEvidenceAdmissionBoundary,
): Pr22CoordinationProductiveEvidenceAdmissionRecord {
  const record=boundary.record;
  if (boundary.schemaVersion !== 1
      || boundary.status
        !== "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY"
      || boundary.blocker.length !== 0
      || boundary.shadowEvidenceFingerprintRevalidated !== true
      || boundary.repositoryStateRevalidated !== true
      || boundary.cap022FullChainRevalidated !== true
      || boundary.productiveEvidenceStillRequired !== true
      || boundary.externalRuntimeStartAuthorized !== false
      || boundary.productiveEvidenceSatisfied !== false
      || boundary.productiveRatificationAllowed !== false
      || boundary.sendCmAuthority !== false
      || boundary.pr22ProductiveAuthorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || boundary.repositoryMutationPerformed !== false
      || boundary.controlPlaneMutationPerformed !== false
      || record === null
      || record.schemaVersion !== 1
      || record.status
        !== "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY"
      || record.stage !== "PR22"
      || record.shadowEvidenceComplete !== true
      || record.cap022FullChainStatus !== "CAP022_FULL_CHAIN_BEREIT_NO_WRITE"
      || record.cap022AllRequiredFoundationsPresent !== true
      || record.cap022AllRequiredFoundationsReady !== true
      || record.productiveEvidenceStillRequired !== true
      || record.realCmTransportRequired !== true
      || record.ackEvidenceRequired !== true
      || record.settlementEvidenceRequired !== true
      || record.ttlAndDedupeEvidenceRequired !== true
      || record.rosterSessionEpochEvidenceRequired !== true
      || record.separateExecutionAuthorizationRequired !== true
      || record.exactExecutionAuthorizationRequired !== true
      || record.durableIntentRequiredBeforeSend !== true
      || record.oneShotSendRequired !== true
      || record.sameIntentRetryAllowed !== false
      || record.unknownOutcomeRequiresReconciliation !== true
      || record.cap022FullChainRecheckRequiredAtExecution !== true
      || record.repositoryStateRecheckRequiredAtExecution !== true
      || record.shadowEvidenceFingerprintRecheckRequiredAtExecution !== true
      || record.externalRuntimeStartAuthorized !== false
      || record.productiveEvidenceSatisfied !== false
      || record.productiveRatificationAllowed !== false
      || record.sendCmAuthority !== false
      || record.pr22ProductiveAuthorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false
      || record.repositoryMutationPerformed !== false
      || record.controlPlaneMutationPerformed !== false) {
    throw new Error("PR22_PRODUCTIVE_AUTH_ADMISSION_NICHT_BEREIT");
  }
  sha40(record.admissionMainCommit,"PR22_PRODUCTIVE_AUTH_MAIN_UNGUELTIG");
  fp16(record.admissionFingerprint,"PR22_PRODUCTIVE_AUTH_ADMISSION_FP_UNGUELTIG");
  fp16(record.shadowEvidenceFingerprint,"PR22_PRODUCTIVE_AUTH_SHADOW_FP_UNGUELTIG");
  if (evidenceFingerprint(admissionBasis(record)) !== record.admissionFingerprint) {
    throw new Error("PR22_PRODUCTIVE_AUTH_ADMISSION_FP_DRIFT");
  }
  return record;
}

export function pr22CoordinationProductiveEvidenceAuthorizationConfirmationText(
  admissionFingerprint: string,
  sourceMainCommit: string,
): string {
  fp16(admissionFingerprint,"PR22_PRODUCTIVE_AUTH_CONFIRM_FP_UNGUELTIG");
  sha40(sourceMainCommit,"PR22_PRODUCTIVE_AUTH_CONFIRM_MAIN_UNGUELTIG");
  return "AUTHORIZE PR22 PRODUCTIVE EVIDENCE TRANSPORT "
    + admissionFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr22CoordinationProductiveEvidenceExecutionAuthorizationVor(
  boundary: Pr22CoordinationProductiveEvidenceAdmissionBoundary,
  authorizationId: string,
  issuedAtMs: number,
  expiresAtMs: number,
): Pr22CoordinationProductiveEvidenceExecutionAuthorizationDraft {
  const record=validateAdmission(boundary);
  text(authorizationId,"PR22_PRODUCTIVE_AUTH_ID_UNGUELTIG",192);
  time(issuedAtMs,"PR22_PRODUCTIVE_AUTH_ISSUED_AT_UNGUELTIG");
  time(expiresAtMs,"PR22_PRODUCTIVE_AUTH_EXPIRES_AT_UNGUELTIG");
  if (expiresAtMs < issuedAtMs || expiresAtMs-issuedAtMs > 1_500) {
    throw new Error("PR22_PRODUCTIVE_AUTH_TTL_UNGUELTIG");
  }

  return Object.freeze({
    schemaVersion:1,
    status:"AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_AUTHORIZATION",
    authorizationId,
    admissionFingerprint:record.admissionFingerprint,
    shadowEvidenceFingerprint:record.shadowEvidenceFingerprint,
    sourceMainCommit:record.admissionMainCommit,
    messageId:record.messageId,
    workflowId:record.workflowId,
    workflowRevision:record.workflowRevision,
    issuedAtMs,
    expiresAtMs,
    maximumUses:1,
    requiredConfirmationText:
      pr22CoordinationProductiveEvidenceAuthorizationConfirmationText(
        record.admissionFingerprint,
        record.admissionMainCommit,
      ),
    cap022FullChainRequired:true,
    repositoryStateRecheckRequiredAtExecution:true,
    admissionFingerprintRecheckRequiredAtExecution:true,
    shadowEvidenceFingerprintRecheckRequiredAtExecution:true,
    cap022FullChainRecheckRequiredAtExecution:true,
    durableIntentRequiredBeforeSend:true,
    oneShotSendRequired:true,
    sameIntentRetryAllowed:false,
    unknownOutcomeRequiresReconciliation:true,
    ackEvidenceRequired:true,
    settlementEvidenceRequired:true,
    ttlAndDedupeEvidenceRequired:true,
    rosterSessionEpochEvidenceRequired:true,
    executionAuthorizationIssued:false,
    authorizationConsumed:false,
    externalRuntimeStartAuthorized:false,
    transportExecutionPerformed:false,
    productiveEvidenceSatisfied:false,
    productiveRatificationAllowed:false,
    sendCmAuthority:false,
    pr22ProductiveAuthorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
  });
}

export function erteilePr22CoordinationProductiveEvidenceExecutionAuthorization(
  draft: Pr22CoordinationProductiveEvidenceExecutionAuthorizationDraft,
  confirmationText: string,
  operatorId: string,
  authorizedAtMs: number,
): Pr22CoordinationProductiveEvidenceExecutionAuthorizationRecord {
  if (draft.schemaVersion !== 1
      || draft.status
        !== "AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_AUTHORIZATION"
      || draft.maximumUses !== 1
      || draft.cap022FullChainRequired !== true
      || draft.repositoryStateRecheckRequiredAtExecution !== true
      || draft.admissionFingerprintRecheckRequiredAtExecution !== true
      || draft.shadowEvidenceFingerprintRecheckRequiredAtExecution !== true
      || draft.cap022FullChainRecheckRequiredAtExecution !== true
      || draft.durableIntentRequiredBeforeSend !== true
      || draft.oneShotSendRequired !== true
      || draft.sameIntentRetryAllowed !== false
      || draft.unknownOutcomeRequiresReconciliation !== true
      || draft.ackEvidenceRequired !== true
      || draft.settlementEvidenceRequired !== true
      || draft.ttlAndDedupeEvidenceRequired !== true
      || draft.rosterSessionEpochEvidenceRequired !== true
      || draft.executionAuthorizationIssued !== false
      || draft.authorizationConsumed !== false
      || draft.externalRuntimeStartAuthorized !== false
      || draft.transportExecutionPerformed !== false
      || draft.productiveEvidenceSatisfied !== false
      || draft.productiveRatificationAllowed !== false
      || draft.sendCmAuthority !== false
      || draft.pr22ProductiveAuthorityIssued !== false
      || draft.gameplayAuthority !== false
      || draft.rawWriteAuthority !== false
      || draft.broadRuntimeGrant !== false
      || draft.normalRuntimeAllowed !== false) {
    throw new Error("PR22_PRODUCTIVE_AUTH_DRAFT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR22_PRODUCTIVE_AUTH_BESTAETIGUNG_UNGUELTIG");
  }
  text(operatorId,"PR22_PRODUCTIVE_AUTH_OPERATOR_UNGUELTIG",192);
  time(authorizedAtMs,"PR22_PRODUCTIVE_AUTH_AUTHORIZED_AT_UNGUELTIG");
  if (authorizedAtMs < draft.issuedAtMs || authorizedAtMs > draft.expiresAtMs) {
    throw new Error("PR22_PRODUCTIVE_AUTH_ABGELAUFEN");
  }

  return Object.freeze({
    schemaVersion:1,
    status:"AUTHORIZED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ONE_SHOT_RECORD_ONLY",
    authorizationId:draft.authorizationId,
    admissionFingerprint:draft.admissionFingerprint,
    shadowEvidenceFingerprint:draft.shadowEvidenceFingerprint,
    sourceMainCommit:draft.sourceMainCommit,
    messageId:draft.messageId,
    workflowId:draft.workflowId,
    workflowRevision:draft.workflowRevision,
    issuedAtMs:draft.issuedAtMs,
    expiresAtMs:draft.expiresAtMs,
    maximumUses:1,
    cap022FullChainRequired:true,
    repositoryStateRecheckRequiredAtExecution:true,
    admissionFingerprintRecheckRequiredAtExecution:true,
    shadowEvidenceFingerprintRecheckRequiredAtExecution:true,
    cap022FullChainRecheckRequiredAtExecution:true,
    durableIntentRequiredBeforeSend:true,
    oneShotSendRequired:true,
    sameIntentRetryAllowed:false,
    unknownOutcomeRequiresReconciliation:true,
    ackEvidenceRequired:true,
    settlementEvidenceRequired:true,
    ttlAndDedupeEvidenceRequired:true,
    rosterSessionEpochEvidenceRequired:true,
    authorizationConsumed:false,
    externalRuntimeStartAuthorized:false,
    transportExecutionPerformed:false,
    productiveEvidenceSatisfied:false,
    productiveRatificationAllowed:false,
    sendCmAuthority:false,
    pr22ProductiveAuthorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    operatorId,
    authorizedAtMs,
    confirmationText,
    executionAuthorizationIssued:true,
  });
}
