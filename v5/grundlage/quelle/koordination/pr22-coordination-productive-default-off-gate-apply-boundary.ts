import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr22CoordinationProductiveGateAdvanceProposalBoundary,
  Pr22CoordinationProductiveGateAdvanceProposalRecord,
  Pr22CoordinationProductiveGateAdvanceProposalRecordBasis,
} from "./pr22-coordination-productive-gate-advance-proposal-boundary.js";

export interface Pr22CoordinationProductiveGateApplyTransactionBasis {
  readonly schemaVersion: 1;
  readonly status: "PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF";
  readonly stage: "PR22";
  readonly transactionId: string;
  readonly operationKey: string;
  readonly sourceMainCommit: string;
  readonly proposalFingerprint: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly preparedAtMs: number;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly proposalFingerprintRecheckRequiredAtExecution: true;
  readonly evidenceFingerprintRecheckRequiredAtExecution: true;
  readonly ratificationFingerprintRecheckRequiredAtExecution: true;
  readonly repositoryStateRecheckRequiredAtExecution: true;
  readonly featureGateRecheckRequiredAtExecution: true;
  readonly cap022FullChainRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeGateMutation: true;
  readonly oneShotExecutionRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly productiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationProductiveGateApplyTransaction
  extends Pr22CoordinationProductiveGateApplyTransactionBasis {
  readonly transactionFingerprint: string;
}

export interface Pr22CoordinationProductiveDefaultOffGateApplyRequest {
  readonly schemaVersion: 1;
  readonly proposalBoundary:
    Pr22CoordinationProductiveGateAdvanceProposalBoundary;
  readonly transactionId: string;
  readonly preparedAtMs: number;
  readonly currentMainCommit: string;
}

export interface Pr22CoordinationProductiveDefaultOffGateApplyBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly transaction:
    Pr22CoordinationProductiveGateApplyTransaction
    | null;
  readonly proposalFingerprintRevalidated: boolean;
  readonly currentMainMatchedProposalSource: boolean;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly productiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
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

function proposalBasis(
  record: Pr22CoordinationProductiveGateAdvanceProposalRecord,
): Pr22CoordinationProductiveGateAdvanceProposalRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    sourceMainCommit: record.sourceMainCommit,
    productiveEvidenceFingerprint: record.productiveEvidenceFingerprint,
    ratificationFingerprint: record.ratificationFingerprint,
    messageId: record.messageId,
    workflowId: record.workflowId,
    workflowRevision: record.workflowRevision,
    featureGateProductiveEligible: record.featureGateProductiveEligible,
    cap022FullChainRequired: record.cap022FullChainRequired,
    cap022FullChainSatisfied: record.cap022FullChainSatisfied,
    repositoryStateRevalidated: record.repositoryStateRevalidated,
    freshMainCheckRequiredAtApply: record.freshMainCheckRequiredAtApply,
    evidenceFingerprintRecheckRequiredAtApply:
      record.evidenceFingerprintRecheckRequiredAtApply,
    ratificationFingerprintRecheckRequiredAtApply:
      record.ratificationFingerprintRecheckRequiredAtApply,
    repositoryStateRecheckRequiredAtApply:
      record.repositoryStateRecheckRequiredAtApply,
    cap022FullChainRecheckRequiredAtApply:
      record.cap022FullChainRecheckRequiredAtApply,
    separateApplyRequired: record.separateApplyRequired,
    gateMutationPerformed: record.gateMutationPerformed,
    productiveAuthorityIssued: record.productiveAuthorityIssued,
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

function validProposal(
  boundary: Pr22CoordinationProductiveGateAdvanceProposalBoundary,
): Pr22CoordinationProductiveGateAdvanceProposalRecord | null {
  const record=boundary.record;
  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY"
      || boundary.blocker.length !== 0
      || boundary.ratificationFingerprintRevalidated !== true
      || boundary.productiveEvidenceFingerprintMatched !== true
      || boundary.repositoryStateRevalidated !== true
      || boundary.featureGateRevalidated !== true
      || boundary.cap022FullChainRevalidated !== true
      || boundary.gateMutationPerformed !== false
      || boundary.productiveAuthorityIssued !== false
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
      || record.status !== "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY"
      || record.stage !== "PR22"
      || record.featureGateProductiveEligible !== true
      || record.cap022FullChainRequired !== true
      || record.cap022FullChainSatisfied !== true
      || record.repositoryStateRevalidated !== true
      || record.freshMainCheckRequiredAtApply !== true
      || record.evidenceFingerprintRecheckRequiredAtApply !== true
      || record.ratificationFingerprintRecheckRequiredAtApply !== true
      || record.repositoryStateRecheckRequiredAtApply !== true
      || record.cap022FullChainRecheckRequiredAtApply !== true
      || record.separateApplyRequired !== true
      || record.gateMutationPerformed !== false
      || record.productiveAuthorityIssued !== false
      || record.sendCmAuthority !== false
      || record.pr22ProductiveAuthorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false
      || record.repositoryMutationPerformed !== false
      || record.controlPlaneMutationPerformed !== false) {
    return null;
  }
  sha40(record.sourceMainCommit,"PR22_GATE_APPLY_PROPOSAL_MAIN_UNGUELTIG");
  fp16(record.productiveEvidenceFingerprint,"PR22_GATE_APPLY_EVIDENCE_FP_UNGUELTIG");
  fp16(record.ratificationFingerprint,"PR22_GATE_APPLY_RATIFICATION_FP_UNGUELTIG");
  fp16(record.proposalFingerprint,"PR22_GATE_APPLY_PROPOSAL_FP_UNGUELTIG");
  if (evidenceFingerprint(proposalBasis(record)) !== record.proposalFingerprint) {
    return null;
  }
  return record;
}

export function bereitePr22CoordinationProductiveDefaultOffGateApplyVor(
  request: Pr22CoordinationProductiveDefaultOffGateApplyRequest,
): Pr22CoordinationProductiveDefaultOffGateApplyBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_GATE_APPLY_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_GATE_APPLY_CURRENT_MAIN_UNGUELTIG");
  text(request.transactionId,"PR22_GATE_APPLY_TRANSACTION_ID_UNGUELTIG");
  time(request.preparedAtMs,"PR22_GATE_APPLY_ZEIT_UNGUELTIG");

  const blocker: string[] = [];
  const record=validProposal(request.proposalBoundary);
  const proposalFingerprintRevalidated=record !== null;
  if (!proposalFingerprintRevalidated) {
    blocker.push("PR22_GATE_APPLY_PROPOSAL_NICHT_BEREIT");
  }

  const currentMainMatchedProposalSource =
    record !== null && request.currentMainCommit === record.sourceMainCommit;
  if (!currentMainMatchedProposalSource) {
    blocker.push("PR22_GATE_APPLY_MAIN_STALE");
  }

  let transaction: Pr22CoordinationProductiveGateApplyTransaction | null=null;
  if (blocker.length === 0 && record !== null) {
    const operationKey=[
      "pr22-productive-gate-apply",
      record.stage,
      record.proposalFingerprint,
    ].join(":");

    const basis: Pr22CoordinationProductiveGateApplyTransactionBasis =
      Object.freeze({
        schemaVersion:1,
        status:"PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF",
        stage:"PR22",
        transactionId:request.transactionId,
        operationKey,
        sourceMainCommit:record.sourceMainCommit,
        proposalFingerprint:record.proposalFingerprint,
        productiveEvidenceFingerprint:record.productiveEvidenceFingerprint,
        ratificationFingerprint:record.ratificationFingerprint,
        preparedAtMs:request.preparedAtMs,
        freshMainCheckRequiredAtExecution:true,
        proposalFingerprintRecheckRequiredAtExecution:true,
        evidenceFingerprintRecheckRequiredAtExecution:true,
        ratificationFingerprintRecheckRequiredAtExecution:true,
        repositoryStateRecheckRequiredAtExecution:true,
        featureGateRecheckRequiredAtExecution:true,
        cap022FullChainRecheckRequiredAtExecution:true,
        durableIntentRequiredBeforeGateMutation:true,
        oneShotExecutionRequired:true,
        sameIntentRetryAllowed:false,
        postconditionVerificationRequired:true,
        unknownOutcomeRequiresReconciliation:true,
        applyAdapterInstalled:false,
        executionEnabled:false,
        gateMutationPerformed:false,
        productiveAuthorityIssued:false,
        sendCmAuthority:false,
        pr22ProductiveAuthorityIssued:false,
        gameplayAuthority:false,
        rawWriteAuthority:false,
        broadRuntimeGrant:false,
        normalRuntimeAllowed:false,
        repositoryMutationPerformed:false,
        controlPlaneMutationPerformed:false,
      });
    transaction=Object.freeze({
      ...basis,
      transactionFingerprint:evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion:1,
    status:blocker.length === 0 ? "READY_DEFAULT_OFF" : "BLOCKIERT",
    blocker:Object.freeze([...new Set(blocker)]),
    transaction,
    proposalFingerprintRevalidated,
    currentMainMatchedProposalSource,
    applyAdapterInstalled:false,
    executionEnabled:false,
    gateMutationPerformed:false,
    productiveAuthorityIssued:false,
    sendCmAuthority:false,
    pr22ProductiveAuthorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
  });
}
