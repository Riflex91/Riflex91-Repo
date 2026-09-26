import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Cap022FoundationChainReadiness,
} from "../runtime/cap022-foundation-chain-readiness.js";
import type {
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";
import {
  pruefePr22CoordinationShadowAdmission,
  type Pr22CoordinationShadowRequest,
} from "./pr22-coordination-shadow-admission.js";
import type {
  Pr22CoordinationProductiveEvidenceAdmissionRecord,
  Pr22CoordinationProductiveEvidenceAdmissionRecordBasis,
} from "./pr22-coordination-productive-evidence-admission-boundary.js";
import type {
  Pr22CoordinationProductiveEvidenceExecutionAuthorizationRecord,
} from "./pr22-coordination-productive-evidence-execution-authorization-boundary.js";

export interface Pr22CoordinationProductiveTransportFenceBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_PRODUCTIVE_ONE_SHOT_TRANSPORT";
  readonly messageId: string;
  readonly dedupeKey: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly senderCharacterId: string;
  readonly recipientCharacterId: string;
  readonly recipientSessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoch: number;
  readonly livenessEpoch: number;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
  readonly payloadFingerprint: string;
  readonly senderTrusted: true;
  readonly recipientRosterFresh: true;
  readonly recipientLivenessFresh: true;
  readonly sameServer: true;
  readonly duplicateObserved: false;
  readonly outOfOrderObserved: false;
  readonly restartReconciled: true;
  readonly priorTerminalSettlement: false;
}

export interface Pr22CoordinationProductiveTransportFence
  extends Pr22CoordinationProductiveTransportFenceBasis {
  readonly transportFenceFingerprint: string;
}

export interface Pr22CoordinationProductiveDurableIntentInput {
  readonly schemaVersion: 1;
  readonly authorizationId: string;
  readonly admissionFingerprint: string;
  readonly shadowEvidenceFingerprint: string;
  readonly transportFenceFingerprint: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly payloadFingerprint: string;
  readonly requestedAtMs: number;
}

export interface Pr22CoordinationProductiveDurableIntentReceipt {
  readonly schemaVersion: 1;
  readonly status:
    | "PERSISTED_NEW"
    | "ALREADY_PERSISTED_RECONCILIATION_REQUIRED";
  readonly durableIntentId: string;
  readonly authorizationId: string;
  readonly admissionFingerprint: string;
  readonly transportFenceFingerprint: string;
  readonly messageId: string;
  readonly persistedAtMs: number;
}

export interface Pr22CoordinationProductiveDurableIntentWriter {
  persistPr22CoordinationProductiveEvidenceIntent(
    input: Pr22CoordinationProductiveDurableIntentInput,
  ): Promise<Pr22CoordinationProductiveDurableIntentReceipt>;
}

export interface Pr22CoordinationProductiveTransportResult {
  readonly schemaVersion: 1;
  readonly outcome: "SENT" | "NOT_SENT" | "UNKNOWN";
  readonly transportAttempted: true;
  readonly terminalSendRecordPersisted: boolean;
  readonly sendCmCallsObserved: 0 | 1;
}

export interface Pr22CoordinationProductiveEvidenceObservation {
  readonly schemaVersion: 1;
  readonly status: "COMPLETE" | "PENDING" | "UNKNOWN";
  readonly messageId: string | null;
  readonly dedupeKey: string | null;
  readonly workflowId: string | null;
  readonly workflowRevision: number | null;
  readonly recipientCharacterId: string | null;
  readonly recipientSessionId: string | null;
  readonly serverRegion: string | null;
  readonly serverIdentifier: string | null;
  readonly rosterEpoch: number | null;
  readonly livenessEpoch: number | null;
  readonly ackObserved: boolean;
  readonly settlementObserved: boolean;
  readonly ackCorrelated: boolean;
  readonly settlementCorrelated: boolean;
  readonly ttlEvidenceSatisfied: boolean;
  readonly dedupeEvidenceSatisfied: boolean;
  readonly rosterSessionEpochEvidenceSatisfied: boolean;
  readonly duplicateSendObserved: boolean;
  readonly sendCmCallsObserved: 0 | 1;
  readonly observedAtMs: number;
}

export interface Pr22CoordinationProductiveTransportAdapter {
  sendPr22CoordinationProductiveEvidenceMessage(input: {
    readonly schemaVersion: 1;
    readonly authorizationId: string;
    readonly durableIntentId: string;
    readonly messageId: string;
    readonly dedupeKey: string;
    readonly workflowId: string;
    readonly workflowRevision: number;
    readonly senderCharacterId: string;
    readonly recipientCharacterId: string;
    readonly recipientSessionId: string;
    readonly serverRegion: string;
    readonly serverIdentifier: string;
    readonly rosterEpoch: number;
    readonly livenessEpoch: number;
    readonly createdAtMs: number;
    readonly expiresAtMs: number;
    readonly payloadFingerprint: string;
    readonly payload: unknown;
  }): Promise<Pr22CoordinationProductiveTransportResult>;

  readPr22CoordinationProductiveEvidence(input: {
    readonly schemaVersion: 1;
    readonly messageId: string;
    readonly workflowId: string;
    readonly workflowRevision: number;
    readonly transportFenceFingerprint: string;
  }): Promise<Pr22CoordinationProductiveEvidenceObservation>;
}

export interface Pr22CoordinationProductiveEvidenceRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY";
  readonly stage: "PR22";
  readonly authorizationId: string;
  readonly admissionFingerprint: string;
  readonly shadowEvidenceFingerprint: string;
  readonly transportFenceFingerprint: string;
  readonly durableIntentId: string;
  readonly sourceMainCommit: string;
  readonly messageId: string;
  readonly dedupeKey: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly recipientCharacterId: string;
  readonly recipientSessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoch: number;
  readonly livenessEpoch: number;
  readonly payloadFingerprint: string;
  readonly observedAtMs: number;
  readonly transportExecutionPerformed: true;
  readonly sendCmCallsObserved: 1;
  readonly ackEvidenceSatisfied: true;
  readonly settlementEvidenceSatisfied: true;
  readonly ttlAndDedupeEvidenceSatisfied: true;
  readonly rosterSessionEpochEvidenceSatisfied: true;
  readonly productiveEvidenceSatisfied: true;
  readonly productiveRatificationAllowed: false;
  readonly separateProductiveRatificationRequired: true;
  readonly oneShotTransportAuthorityConsumed: true;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationProductiveEvidenceRecord
  extends Pr22CoordinationProductiveEvidenceRecordBasis {
  readonly productiveEvidenceFingerprint: string;
}

export interface Pr22CoordinationProductiveEvidenceExecutionRequest {
  readonly schemaVersion: 1;
  readonly authorization:
    Pr22CoordinationProductiveEvidenceExecutionAuthorizationRecord;
  readonly admissionRecord:
    Pr22CoordinationProductiveEvidenceAdmissionRecord;
  readonly transportFence: Pr22CoordinationProductiveTransportFence;
  readonly payload: unknown;
  readonly currentMainCommit: string;
  readonly currentAdmissionFingerprint: string;
  readonly currentShadowEvidenceFingerprint: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly cap022FullChain: Cap022FoundationChainReadiness;
  readonly executionAtMs: number;
  readonly restartSinceAuthorization: boolean;
  readonly durableIntentWriter:
    Pr22CoordinationProductiveDurableIntentWriter;
  readonly transportAdapter:
    Pr22CoordinationProductiveTransportAdapter;
}

export interface Pr22CoordinationProductiveEvidenceExecutionResult {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY"
    | "BLOCKIERT_PRECHECK"
    | "BLOCKIERT_RECONCILIATION_REQUIRED";
  readonly blocker: readonly string[];
  readonly authorizationId: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly authorizationConsumed: boolean;
  readonly durableIntentPersisted: boolean;
  readonly transportAttemptObserved: boolean;
  readonly transportExecutionPerformed: boolean;
  readonly sendCmCallsObserved: 0 | 1;
  readonly productiveEvidenceSatisfied: boolean;
  readonly productiveRatificationAllowed: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly oneShotTransportAuthorityConsumed: boolean;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly sameIntentRetryAllowed: false;
  readonly blindResumeAfterRestartAllowed: false;
  readonly record: Pr22CoordinationProductiveEvidenceRecord | null;
}

function text(value: string, error: string, maximum = 192): void {
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

function payloadFingerprint(payload: unknown): string {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(payload);
  } catch {
    throw new Error("PR22_PRODUCTIVE_EXEC_PAYLOAD_NICHT_JSON");
  }
  if (serialized === undefined || serialized.length > 65_536) {
    throw new Error("PR22_PRODUCTIVE_EXEC_PAYLOAD_UNGUELTIG");
  }
  return evidenceFingerprint(payload);
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

function validAdmissionRecord(
  record: Pr22CoordinationProductiveEvidenceAdmissionRecord,
): boolean {
  return record.schemaVersion === 1
    && record.status
      === "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ADMISSION_RECORD_ONLY"
    && record.stage === "PR22"
    && record.shadowEvidenceComplete === true
    && record.cap022FullChainStatus === "CAP022_FULL_CHAIN_BEREIT_NO_WRITE"
    && record.cap022AllRequiredFoundationsPresent === true
    && record.cap022AllRequiredFoundationsReady === true
    && record.productiveEvidenceStillRequired === true
    && record.realCmTransportRequired === true
    && record.ackEvidenceRequired === true
    && record.settlementEvidenceRequired === true
    && record.ttlAndDedupeEvidenceRequired === true
    && record.rosterSessionEpochEvidenceRequired === true
    && record.separateExecutionAuthorizationRequired === true
    && record.exactExecutionAuthorizationRequired === true
    && record.durableIntentRequiredBeforeSend === true
    && record.oneShotSendRequired === true
    && record.sameIntentRetryAllowed === false
    && record.unknownOutcomeRequiresReconciliation === true
    && record.cap022FullChainRecheckRequiredAtExecution === true
    && record.repositoryStateRecheckRequiredAtExecution === true
    && record.shadowEvidenceFingerprintRecheckRequiredAtExecution === true
    && record.externalRuntimeStartAuthorized === false
    && record.productiveEvidenceSatisfied === false
    && record.productiveRatificationAllowed === false
    && record.sendCmAuthority === false
    && record.pr22ProductiveAuthorityIssued === false
    && record.gameplayAuthority === false
    && record.rawWriteAuthority === false
    && record.broadRuntimeGrant === false
    && record.normalRuntimeAllowed === false
    && record.repositoryMutationPerformed === false
    && record.controlPlaneMutationPerformed === false
    && evidenceFingerprint(admissionBasis(record)) === record.admissionFingerprint;
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

function fenceBasis(
  fence: Pr22CoordinationProductiveTransportFence,
): Pr22CoordinationProductiveTransportFenceBasis {
  return Object.freeze({
    schemaVersion: fence.schemaVersion,
    status: fence.status,
    messageId: fence.messageId,
    dedupeKey: fence.dedupeKey,
    workflowId: fence.workflowId,
    workflowRevision: fence.workflowRevision,
    senderCharacterId: fence.senderCharacterId,
    recipientCharacterId: fence.recipientCharacterId,
    recipientSessionId: fence.recipientSessionId,
    serverRegion: fence.serverRegion,
    serverIdentifier: fence.serverIdentifier,
    rosterEpoch: fence.rosterEpoch,
    livenessEpoch: fence.livenessEpoch,
    createdAtMs: fence.createdAtMs,
    expiresAtMs: fence.expiresAtMs,
    payloadFingerprint: fence.payloadFingerprint,
    senderTrusted: fence.senderTrusted,
    recipientRosterFresh: fence.recipientRosterFresh,
    recipientLivenessFresh: fence.recipientLivenessFresh,
    sameServer: fence.sameServer,
    duplicateObserved: fence.duplicateObserved,
    outOfOrderObserved: fence.outOfOrderObserved,
    restartReconciled: fence.restartReconciled,
    priorTerminalSettlement: fence.priorTerminalSettlement,
  });
}

export function bereitePr22CoordinationProductiveTransportFenceVor(
  request: Pr22CoordinationShadowRequest,
  payload: unknown,
): Pr22CoordinationProductiveTransportFence {
  const admission = pruefePr22CoordinationShadowAdmission(request);
  if (admission.status !== "BEREIT_NO_WRITE" || admission.blocker.length !== 0) {
    throw new Error("PR22_PRODUCTIVE_EXEC_TRANSPORT_FENCE_NICHT_BEREIT");
  }
  const basis: Pr22CoordinationProductiveTransportFenceBasis = Object.freeze({
    schemaVersion: 1,
    status: "READY_FOR_PR22_PRODUCTIVE_ONE_SHOT_TRANSPORT",
    messageId: request.messageId,
    dedupeKey: request.dedupeKey,
    workflowId: request.workflowId,
    workflowRevision: request.workflowRevision,
    senderCharacterId: request.senderCharacterId,
    recipientCharacterId: request.recipientCharacterId,
    recipientSessionId: request.recipientSessionId,
    serverRegion: request.serverRegion,
    serverIdentifier: request.serverIdentifier,
    rosterEpoch: request.rosterEpoch,
    livenessEpoch: request.livenessEpoch,
    createdAtMs: request.createdAtMs,
    expiresAtMs: request.expiresAtMs,
    payloadFingerprint: payloadFingerprint(payload),
    senderTrusted: true,
    recipientRosterFresh: true,
    recipientLivenessFresh: true,
    sameServer: true,
    duplicateObserved: false,
    outOfOrderObserved: false,
    restartReconciled: true,
    priorTerminalSettlement: false,
  });
  return Object.freeze({
    ...basis,
    transportFenceFingerprint: evidenceFingerprint(basis),
  });
}

function blocked(
  request: Pr22CoordinationProductiveEvidenceExecutionRequest,
  blocker: readonly string[],
): Pr22CoordinationProductiveEvidenceExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_PRECHECK",
    blocker: Object.freeze([...new Set(blocker)]),
    authorizationId: request.authorization.authorizationId,
    messageId: request.authorization.messageId,
    workflowId: request.authorization.workflowId,
    workflowRevision: request.authorization.workflowRevision,
    authorizationConsumed: false,
    durableIntentPersisted: false,
    transportAttemptObserved: false,
    transportExecutionPerformed: false,
    sendCmCallsObserved: 0,
    productiveEvidenceSatisfied: false,
    productiveRatificationAllowed: false,
    pr22ProductiveAuthorityIssued: false,
    oneShotTransportAuthorityConsumed: false,
    sendCmAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    repositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    record: null,
  });
}

function reconciliationRequired(
  request: Pr22CoordinationProductiveEvidenceExecutionRequest,
  durableIntentPersisted: boolean,
  transportAttemptObserved: boolean,
  sendCmCallsObserved: 0 | 1,
  blocker: readonly string[],
): Pr22CoordinationProductiveEvidenceExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker: Object.freeze([
      "PR22_PRODUCTIVE_EXEC_RECONCILIATION_REQUIRED",
      ...new Set(blocker),
    ]),
    authorizationId: request.authorization.authorizationId,
    messageId: request.authorization.messageId,
    workflowId: request.authorization.workflowId,
    workflowRevision: request.authorization.workflowRevision,
    authorizationConsumed: true,
    durableIntentPersisted,
    transportAttemptObserved,
    transportExecutionPerformed: false,
    sendCmCallsObserved,
    productiveEvidenceSatisfied: false,
    productiveRatificationAllowed: false,
    pr22ProductiveAuthorityIssued: false,
    oneShotTransportAuthorityConsumed: transportAttemptObserved,
    sendCmAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    repositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    record: null,
  });
}

export async function fuehrePr22CoordinationProductiveEvidenceEinmalAus(
  request: Pr22CoordinationProductiveEvidenceExecutionRequest,
): Promise<Pr22CoordinationProductiveEvidenceExecutionResult> {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_PRODUCTIVE_EXEC_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_PRODUCTIVE_EXEC_MAIN_UNGUELTIG");
  fp16(request.currentAdmissionFingerprint,"PR22_PRODUCTIVE_EXEC_ADMISSION_FP_UNGUELTIG");
  fp16(request.currentShadowEvidenceFingerprint,"PR22_PRODUCTIVE_EXEC_SHADOW_FP_UNGUELTIG");
  time(request.executionAtMs,"PR22_PRODUCTIVE_EXEC_ZEIT_UNGUELTIG");

  const auth = request.authorization;
  const admission = request.admissionRecord;
  const fence = request.transportFence;
  const blocker: string[] = [];

  if (auth.schemaVersion !== 1
      || auth.status
        !== "AUTHORIZED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_ONE_SHOT_RECORD_ONLY"
      || auth.executionAuthorizationIssued !== true
      || auth.authorizationConsumed !== false
      || auth.maximumUses !== 1
      || auth.cap022FullChainRequired !== true
      || auth.repositoryStateRecheckRequiredAtExecution !== true
      || auth.admissionFingerprintRecheckRequiredAtExecution !== true
      || auth.shadowEvidenceFingerprintRecheckRequiredAtExecution !== true
      || auth.cap022FullChainRecheckRequiredAtExecution !== true
      || auth.durableIntentRequiredBeforeSend !== true
      || auth.oneShotSendRequired !== true
      || auth.sameIntentRetryAllowed !== false
      || auth.unknownOutcomeRequiresReconciliation !== true
      || auth.ackEvidenceRequired !== true
      || auth.settlementEvidenceRequired !== true
      || auth.ttlAndDedupeEvidenceRequired !== true
      || auth.rosterSessionEpochEvidenceRequired !== true
      || auth.externalRuntimeStartAuthorized !== false
      || auth.transportExecutionPerformed !== false
      || auth.productiveEvidenceSatisfied !== false
      || auth.productiveRatificationAllowed !== false
      || auth.sendCmAuthority !== false
      || auth.pr22ProductiveAuthorityIssued !== false
      || auth.gameplayAuthority !== false
      || auth.rawWriteAuthority !== false
      || auth.broadRuntimeGrant !== false
      || auth.normalRuntimeAllowed !== false) {
    blocker.push("PR22_PRODUCTIVE_EXEC_AUTHORIZATION_UNGUELTIG");
  }

  if (request.restartSinceAuthorization) {
    blocker.push("PR22_PRODUCTIVE_EXEC_RESTART_REQUIRES_RECONCILIATION");
  }
  if (request.executionAtMs < auth.authorizedAtMs
      || request.executionAtMs > auth.expiresAtMs) {
    blocker.push("PR22_PRODUCTIVE_EXEC_AUTHORIZATION_ABGELAUFEN");
  }

  if (!validAdmissionRecord(admission)
      || admission.admissionFingerprint !== auth.admissionFingerprint
      || admission.shadowEvidenceFingerprint !== auth.shadowEvidenceFingerprint
      || admission.admissionMainCommit !== auth.sourceMainCommit
      || admission.messageId !== auth.messageId
      || admission.workflowId !== auth.workflowId
      || admission.workflowRevision !== auth.workflowRevision) {
    blocker.push("PR22_PRODUCTIVE_EXEC_AUTH_ADMISSION_BINDING_DRIFT");
  }

  if (request.currentMainCommit !== auth.sourceMainCommit) {
    blocker.push("PR22_PRODUCTIVE_EXEC_MAIN_STALE");
  }
  if (request.currentAdmissionFingerprint !== auth.admissionFingerprint
      || request.currentAdmissionFingerprint !== admission.admissionFingerprint) {
    blocker.push("PR22_PRODUCTIVE_EXEC_ADMISSION_FP_STALE");
  }
  if (request.currentShadowEvidenceFingerprint !== auth.shadowEvidenceFingerprint
      || request.currentShadowEvidenceFingerprint
        !== admission.shadowEvidenceFingerprint) {
    blocker.push("PR22_PRODUCTIVE_EXEC_SHADOW_FP_STALE");
  }

  const state = request.currentRepositoryState;
  if (state.schemaVersion !== 1
      || state.currentStage !== "PR22"
      || state.currentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || state.pr21StageStatus !== "COMPLETE"
      || state.pr22StageStatus !== "IN_PROGRESS"
      || state.pr22ProductiveAuthorityIssued !== false) {
    blocker.push("PR22_PRODUCTIVE_EXEC_REPOSITORY_STATE_DRIFT");
  }

  if (!validCap022(request.cap022FullChain)) {
    blocker.push("PR22_PRODUCTIVE_EXEC_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }

  const fenceFingerprintValid =
    fence.schemaVersion === 1
    && fence.status === "READY_FOR_PR22_PRODUCTIVE_ONE_SHOT_TRANSPORT"
    && evidenceFingerprint(fenceBasis(fence)) === fence.transportFenceFingerprint;
  if (!fenceFingerprintValid
      || fence.messageId !== auth.messageId
      || fence.workflowId !== auth.workflowId
      || fence.workflowRevision !== auth.workflowRevision
      || payloadFingerprint(request.payload) !== fence.payloadFingerprint) {
    blocker.push("PR22_PRODUCTIVE_EXEC_TRANSPORT_FENCE_DRIFT");
  }

  if (request.executionAtMs < fence.createdAtMs
      || request.executionAtMs > fence.expiresAtMs) {
    blocker.push("PR22_PRODUCTIVE_EXEC_TRANSPORT_FENCE_TTL_STALE");
  }

  if (fenceFingerprintValid) {
    const currentAdmission = pruefePr22CoordinationShadowAdmission({
      schemaVersion: 1,
      messageId: fence.messageId,
      dedupeKey: fence.dedupeKey,
      workflowId: fence.workflowId,
      workflowRevision: fence.workflowRevision,
      senderCharacterId: fence.senderCharacterId,
      recipientCharacterId: fence.recipientCharacterId,
      recipientSessionId: fence.recipientSessionId,
      serverRegion: fence.serverRegion,
      serverIdentifier: fence.serverIdentifier,
      rosterEpoch: fence.rosterEpoch,
      livenessEpoch: fence.livenessEpoch,
      createdAtMs: fence.createdAtMs,
      expiresAtMs: fence.expiresAtMs,
      nowMs: request.executionAtMs,
      senderTrusted: fence.senderTrusted,
      recipientRosterFresh: fence.recipientRosterFresh,
      recipientLivenessFresh: fence.recipientLivenessFresh,
      sameServer: fence.sameServer,
      duplicateObserved: fence.duplicateObserved,
      outOfOrderObserved: fence.outOfOrderObserved,
      restartReconciled: fence.restartReconciled,
      priorTerminalSettlement: fence.priorTerminalSettlement,
    });
    if (currentAdmission.status !== "BEREIT_NO_WRITE"
        || currentAdmission.blocker.length !== 0) {
      blocker.push("PR22_PRODUCTIVE_EXEC_CURRENT_TRANSPORT_ADMISSION_BLOCKIERT");
    }
  }

  if (blocker.length > 0) return blocked(request,blocker);

  let receipt: Pr22CoordinationProductiveDurableIntentReceipt;
  try {
    receipt =
      await request.durableIntentWriter
        .persistPr22CoordinationProductiveEvidenceIntent(Object.freeze({
          schemaVersion: 1,
          authorizationId: auth.authorizationId,
          admissionFingerprint: auth.admissionFingerprint,
          shadowEvidenceFingerprint: auth.shadowEvidenceFingerprint,
          transportFenceFingerprint: fence.transportFenceFingerprint,
          messageId: auth.messageId,
          workflowId: auth.workflowId,
          workflowRevision: auth.workflowRevision,
          payloadFingerprint: fence.payloadFingerprint,
          requestedAtMs: request.executionAtMs,
        }));
  } catch {
    return blocked(request,[
      "PR22_PRODUCTIVE_EXEC_DURABLE_INTENT_PERSIST_FAILED",
    ]);
  }

  const receiptValid =
    receipt.schemaVersion === 1
    && receipt.authorizationId === auth.authorizationId
    && receipt.admissionFingerprint === auth.admissionFingerprint
    && receipt.transportFenceFingerprint === fence.transportFenceFingerprint
    && receipt.messageId === auth.messageId
    && Number.isSafeInteger(receipt.persistedAtMs)
    && receipt.persistedAtMs >= request.executionAtMs
    && receipt.persistedAtMs <= auth.expiresAtMs
    && receipt.durableIntentId.trim().length > 0
    && receipt.durableIntentId.length <= 192;

  if (!receiptValid) {
    return reconciliationRequired(request,true,false,0,[
      "PR22_PRODUCTIVE_EXEC_DURABLE_INTENT_RECEIPT_UNGUELTIG",
    ]);
  }
  if (receipt.status === "ALREADY_PERSISTED_RECONCILIATION_REQUIRED") {
    return reconciliationRequired(request,true,false,0,[
      "PR22_PRODUCTIVE_EXEC_DURABLE_INTENT_BEREITS_VORHANDEN",
    ]);
  }
  if (receipt.status !== "PERSISTED_NEW") {
    throw new Error("PR22_PRODUCTIVE_EXEC_DURABLE_INTENT_STATUS_UNBEKANNT");
  }

  let transport: Pr22CoordinationProductiveTransportResult = Object.freeze({
    schemaVersion: 1,
    outcome: "UNKNOWN",
    transportAttempted: true,
    terminalSendRecordPersisted: false,
    sendCmCallsObserved: 0,
  });
  try {
    transport =
      await request.transportAdapter.sendPr22CoordinationProductiveEvidenceMessage(
        Object.freeze({
          schemaVersion: 1,
          authorizationId: auth.authorizationId,
          durableIntentId: receipt.durableIntentId,
          messageId: fence.messageId,
          dedupeKey: fence.dedupeKey,
          workflowId: fence.workflowId,
          workflowRevision: fence.workflowRevision,
          senderCharacterId: fence.senderCharacterId,
          recipientCharacterId: fence.recipientCharacterId,
          recipientSessionId: fence.recipientSessionId,
          serverRegion: fence.serverRegion,
          serverIdentifier: fence.serverIdentifier,
          rosterEpoch: fence.rosterEpoch,
          livenessEpoch: fence.livenessEpoch,
          createdAtMs: fence.createdAtMs,
          expiresAtMs: fence.expiresAtMs,
          payloadFingerprint: fence.payloadFingerprint,
          payload: request.payload,
        }),
      );
  } catch {
    transport = Object.freeze({
      schemaVersion: 1,
      outcome: "UNKNOWN",
      transportAttempted: true,
      terminalSendRecordPersisted: false,
      sendCmCallsObserved: 0,
    });
  }

  let observation: Pr22CoordinationProductiveEvidenceObservation =
    Object.freeze({
      schemaVersion: 1,
      status: "UNKNOWN",
      messageId: null,
      dedupeKey: null,
      workflowId: null,
      workflowRevision: null,
      recipientCharacterId: null,
      recipientSessionId: null,
      serverRegion: null,
      serverIdentifier: null,
      rosterEpoch: null,
      livenessEpoch: null,
      ackObserved: false,
      settlementObserved: false,
      ackCorrelated: false,
      settlementCorrelated: false,
      ttlEvidenceSatisfied: false,
      dedupeEvidenceSatisfied: false,
      rosterSessionEpochEvidenceSatisfied: false,
      duplicateSendObserved: false,
      sendCmCallsObserved: transport.sendCmCallsObserved,
      observedAtMs: request.executionAtMs,
    });
  try {
    observation =
      await request.transportAdapter.readPr22CoordinationProductiveEvidence(
        Object.freeze({
          schemaVersion: 1,
          messageId: fence.messageId,
          workflowId: fence.workflowId,
          workflowRevision: fence.workflowRevision,
          transportFenceFingerprint: fence.transportFenceFingerprint,
        }),
      );
  } catch {
    // UNKNOWN bleibt fail-closed und wird unten reconciled.
  }

  const terminalSendRecordObserved =
    transport.schemaVersion === 1
    && transport.outcome === "SENT"
    && transport.transportAttempted === true
    && transport.terminalSendRecordPersisted === true
    && transport.sendCmCallsObserved === 1;

  const productiveEvidenceVerified =
    observation.schemaVersion === 1
    && observation.status === "COMPLETE"
    && observation.messageId === fence.messageId
    && observation.dedupeKey === fence.dedupeKey
    && observation.workflowId === fence.workflowId
    && observation.workflowRevision === fence.workflowRevision
    && observation.recipientCharacterId === fence.recipientCharacterId
    && observation.recipientSessionId === fence.recipientSessionId
    && observation.serverRegion === fence.serverRegion
    && observation.serverIdentifier === fence.serverIdentifier
    && observation.rosterEpoch === fence.rosterEpoch
    && observation.livenessEpoch === fence.livenessEpoch
    && observation.ackObserved === true
    && observation.settlementObserved === true
    && observation.ackCorrelated === true
    && observation.settlementCorrelated === true
    && observation.ttlEvidenceSatisfied === true
    && observation.dedupeEvidenceSatisfied === true
    && observation.rosterSessionEpochEvidenceSatisfied === true
    && observation.duplicateSendObserved === false
    && observation.sendCmCallsObserved === 1
    && Number.isSafeInteger(observation.observedAtMs)
    && observation.observedAtMs >= request.executionAtMs;

  if (!terminalSendRecordObserved || !productiveEvidenceVerified) {
    const reasons: string[] = [];
    if (!terminalSendRecordObserved) {
      reasons.push("PR22_PRODUCTIVE_EXEC_TERMINAL_SEND_RECORD_FEHLT");
    }
    if (!productiveEvidenceVerified) {
      reasons.push("PR22_PRODUCTIVE_EXEC_EVIDENCE_NICHT_VERIFIZIERT");
    }
    const observedCalls: 0 | 1 =
      transport.sendCmCallsObserved === 1 || observation.sendCmCallsObserved === 1
        ? 1
        : 0;
    return reconciliationRequired(request,true,true,observedCalls,reasons);
  }

  const basis: Pr22CoordinationProductiveEvidenceRecordBasis = Object.freeze({
    schemaVersion: 1,
    status: "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
    stage: "PR22",
    authorizationId: auth.authorizationId,
    admissionFingerprint: auth.admissionFingerprint,
    shadowEvidenceFingerprint: auth.shadowEvidenceFingerprint,
    transportFenceFingerprint: fence.transportFenceFingerprint,
    durableIntentId: receipt.durableIntentId,
    sourceMainCommit: auth.sourceMainCommit,
    messageId: fence.messageId,
    dedupeKey: fence.dedupeKey,
    workflowId: fence.workflowId,
    workflowRevision: fence.workflowRevision,
    recipientCharacterId: fence.recipientCharacterId,
    recipientSessionId: fence.recipientSessionId,
    serverRegion: fence.serverRegion,
    serverIdentifier: fence.serverIdentifier,
    rosterEpoch: fence.rosterEpoch,
    livenessEpoch: fence.livenessEpoch,
    payloadFingerprint: fence.payloadFingerprint,
    observedAtMs: observation.observedAtMs,
    transportExecutionPerformed: true,
    sendCmCallsObserved: 1,
    ackEvidenceSatisfied: true,
    settlementEvidenceSatisfied: true,
    ttlAndDedupeEvidenceSatisfied: true,
    rosterSessionEpochEvidenceSatisfied: true,
    productiveEvidenceSatisfied: true,
    productiveRatificationAllowed: false,
    separateProductiveRatificationRequired: true,
    oneShotTransportAuthorityConsumed: true,
    sendCmAuthority: false,
    pr22ProductiveAuthorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    repositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
  });
  const record: Pr22CoordinationProductiveEvidenceRecord = Object.freeze({
    ...basis,
    productiveEvidenceFingerprint: evidenceFingerprint(basis),
  });

  return Object.freeze({
    schemaVersion: 1,
    status: "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
    blocker: Object.freeze([]),
    authorizationId: auth.authorizationId,
    messageId: fence.messageId,
    workflowId: fence.workflowId,
    workflowRevision: fence.workflowRevision,
    authorizationConsumed: true,
    durableIntentPersisted: true,
    transportAttemptObserved: true,
    transportExecutionPerformed: true,
    sendCmCallsObserved: 1,
    productiveEvidenceSatisfied: true,
    productiveRatificationAllowed: false,
    pr22ProductiveAuthorityIssued: false,
    oneShotTransportAuthorityConsumed: true,
    sendCmAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    repositoryMutationPerformed: false,
    controlPlaneMutationPerformed: false,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    record,
  });
}
