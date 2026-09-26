import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr22CoordinationProductiveGateApplyPostSettlementBoundary,
  Pr22CoordinationProductiveGateApplyPostSettlementRecord,
  Pr22CoordinationProductiveGateApplyPostSettlementRecordBasis,
} from "./pr22-coordination-productive-gate-apply-post-settlement-boundary.js";

export interface Pr22CoordinationProductiveAuthorityApplyTransactionBasis {
  readonly schemaVersion: 1;
  readonly status: "PREPARED_PR22_PRODUCTIVE_AUTHORITY_APPLY_DEFAULT_OFF";
  readonly stage: "PR22";
  readonly transactionId: string;
  readonly operationKey: string;
  readonly sourceMainCommit: string;
  readonly postSettlementFingerprint: string;
  readonly gateSettlementFingerprint: string;
  readonly gateTransactionFingerprint: string;
  readonly proposalFingerprint: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly preparedAtMs: number;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly postSettlementFingerprintRecheckRequiredAtExecution: true;
  readonly settlementFingerprintRecheckRequiredAtExecution: true;
  readonly gateTransactionFingerprintRecheckRequiredAtExecution: true;
  readonly proposalFingerprintRecheckRequiredAtExecution: true;
  readonly evidenceFingerprintRecheckRequiredAtExecution: true;
  readonly ratificationFingerprintRecheckRequiredAtExecution: true;
  readonly repositoryStateRecheckRequiredAtExecution: true;
  readonly featureGateRecheckRequiredAtExecution: true;
  readonly cap022FullChainRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeAuthorityMutation: true;
  readonly oneShotExecutionRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly authorityApplyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly productiveAuthorityIssued: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
}

export interface Pr22CoordinationProductiveAuthorityApplyTransaction
  extends Pr22CoordinationProductiveAuthorityApplyTransactionBasis {
  readonly authorityTransactionFingerprint: string;
}

export interface Pr22CoordinationProductiveAuthorityDefaultOffApplyRequest {
  readonly schemaVersion: 1;
  readonly postSettlementBoundary:
    Pr22CoordinationProductiveGateApplyPostSettlementBoundary;
  readonly transactionId: string;
  readonly currentMainCommit: string;
  readonly preparedAtMs: number;
}

export interface Pr22CoordinationProductiveAuthorityDefaultOffApplyBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stage: "PR22";
  readonly transaction:
    Pr22CoordinationProductiveAuthorityApplyTransaction
    | null;
  readonly postSettlementFingerprintRevalidated: boolean;
  readonly currentMainMatched: boolean;
  readonly authorityApplyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly productiveAuthorityIssued: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly controlPlaneMutationPerformed: false;
  readonly separateExecutionAuthorizationRequired: true;
}

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}
function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}
function text(value: string, error: string, maximum=192): void {
  if (value.trim().length === 0 || value.length > maximum) throw new Error(error);
}
function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function postSettlementBasis(
  record: Pr22CoordinationProductiveGateApplyPostSettlementRecord,
): Pr22CoordinationProductiveGateApplyPostSettlementRecordBasis {
  return Object.freeze({
    schemaVersion:record.schemaVersion,
    status:record.status,
    stage:record.stage,
    sourceMainCommit:record.sourceMainCommit,
    authorizationId:record.authorizationId,
    transactionId:record.transactionId,
    transactionFingerprint:record.transactionFingerprint,
    proposalFingerprint:record.proposalFingerprint,
    productiveEvidenceFingerprint:record.productiveEvidenceFingerprint,
    ratificationFingerprint:record.ratificationFingerprint,
    settlementFingerprint:record.settlementFingerprint,
    preparedAtMs:record.preparedAtMs,
    gateApplyVerified:record.gateApplyVerified,
    repositoryStateRevalidated:record.repositoryStateRevalidated,
    featureGateProductiveEligible:record.featureGateProductiveEligible,
    cap022FullChainRequired:record.cap022FullChainRequired,
    cap022FullChainSatisfied:record.cap022FullChainSatisfied,
    freshMainCheckRequiredAtAuthorityApply:
      record.freshMainCheckRequiredAtAuthorityApply,
    settlementFingerprintRecheckRequiredAtAuthorityApply:
      record.settlementFingerprintRecheckRequiredAtAuthorityApply,
    transactionFingerprintRecheckRequiredAtAuthorityApply:
      record.transactionFingerprintRecheckRequiredAtAuthorityApply,
    proposalFingerprintRecheckRequiredAtAuthorityApply:
      record.proposalFingerprintRecheckRequiredAtAuthorityApply,
    evidenceFingerprintRecheckRequiredAtAuthorityApply:
      record.evidenceFingerprintRecheckRequiredAtAuthorityApply,
    ratificationFingerprintRecheckRequiredAtAuthorityApply:
      record.ratificationFingerprintRecheckRequiredAtAuthorityApply,
    repositoryStateRecheckRequiredAtAuthorityApply:
      record.repositoryStateRecheckRequiredAtAuthorityApply,
    featureGateRecheckRequiredAtAuthorityApply:
      record.featureGateRecheckRequiredAtAuthorityApply,
    cap022FullChainRecheckRequiredAtAuthorityApply:
      record.cap022FullChainRecheckRequiredAtAuthorityApply,
    separateProductiveAuthorityApplyRequired:
      record.separateProductiveAuthorityApplyRequired,
    authorityApplyAdapterInstalled:record.authorityApplyAdapterInstalled,
    authorityApplyExecutionEnabled:record.authorityApplyExecutionEnabled,
    additionalGateMutationPerformed:record.additionalGateMutationPerformed,
    productiveAuthorityIssued:record.productiveAuthorityIssued,
    pr22ProductiveAuthorityIssued:record.pr22ProductiveAuthorityIssued,
    sendCmAuthority:record.sendCmAuthority,
    gameplayAuthority:record.gameplayAuthority,
    rawWriteAuthority:record.rawWriteAuthority,
    broadRuntimeGrant:record.broadRuntimeGrant,
    normalRuntimeAllowed:record.normalRuntimeAllowed,
    repositoryMutationPerformed:record.repositoryMutationPerformed,
    controlPlaneMutationPerformed:record.controlPlaneMutationPerformed,
  });
}

function validatePostSettlementRecord(
  record: Pr22CoordinationProductiveGateApplyPostSettlementRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status !== "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY"
      || record.stage !== "PR22"
      || record.gateApplyVerified !== true
      || record.repositoryStateRevalidated !== true
      || record.featureGateProductiveEligible !== true
      || record.cap022FullChainRequired !== true
      || record.cap022FullChainSatisfied !== true
      || record.freshMainCheckRequiredAtAuthorityApply !== true
      || record.settlementFingerprintRecheckRequiredAtAuthorityApply !== true
      || record.transactionFingerprintRecheckRequiredAtAuthorityApply !== true
      || record.proposalFingerprintRecheckRequiredAtAuthorityApply !== true
      || record.evidenceFingerprintRecheckRequiredAtAuthorityApply !== true
      || record.ratificationFingerprintRecheckRequiredAtAuthorityApply !== true
      || record.repositoryStateRecheckRequiredAtAuthorityApply !== true
      || record.featureGateRecheckRequiredAtAuthorityApply !== true
      || record.cap022FullChainRecheckRequiredAtAuthorityApply !== true
      || record.separateProductiveAuthorityApplyRequired !== true
      || record.authorityApplyAdapterInstalled !== false
      || record.authorityApplyExecutionEnabled !== false
      || record.additionalGateMutationPerformed !== false
      || record.productiveAuthorityIssued !== false
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
  sha40(record.sourceMainCommit,"PR22_AUTHORITY_APPLY_POST_SETTLEMENT_MAIN_UNGUELTIG");
  fp16(record.postSettlementFingerprint,"PR22_AUTHORITY_APPLY_POST_SETTLEMENT_FP_UNGUELTIG");
  fp16(record.settlementFingerprint,"PR22_AUTHORITY_APPLY_SETTLEMENT_FP_UNGUELTIG");
  fp16(record.transactionFingerprint,"PR22_AUTHORITY_APPLY_GATE_TX_FP_UNGUELTIG");
  fp16(record.proposalFingerprint,"PR22_AUTHORITY_APPLY_PROPOSAL_FP_UNGUELTIG");
  fp16(record.productiveEvidenceFingerprint,"PR22_AUTHORITY_APPLY_EVIDENCE_FP_UNGUELTIG");
  fp16(record.ratificationFingerprint,"PR22_AUTHORITY_APPLY_RATIFICATION_FP_UNGUELTIG");
  return evidenceFingerprint(postSettlementBasis(record))
    === record.postSettlementFingerprint;
}

export function bereitePr22CoordinationProductiveAuthorityDefaultOffApplyVor(
  request: Pr22CoordinationProductiveAuthorityDefaultOffApplyRequest,
): Pr22CoordinationProductiveAuthorityDefaultOffApplyBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_AUTHORITY_APPLY_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_AUTHORITY_APPLY_MAIN_UNGUELTIG");
  text(request.transactionId,"PR22_AUTHORITY_APPLY_TRANSACTION_ID_UNGUELTIG");
  time(request.preparedAtMs,"PR22_AUTHORITY_APPLY_ZEIT_UNGUELTIG");

  const boundary=request.postSettlementBoundary;
  const record=boundary.record;
  const blocker: string[]=[];

  if (boundary.schemaVersion !== 1
      || boundary.status
        !== "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY"
      || boundary.blocker.length !== 0
      || boundary.executionRevalidated !== true
      || boundary.settlementFingerprintRevalidated !== true
      || boundary.repositoryStateRevalidated !== true
      || boundary.featureGateRevalidated !== true
      || boundary.cap022FullChainRevalidated !== true
      || boundary.authorityApplyAdapterInstalled !== false
      || boundary.authorityApplyExecutionEnabled !== false
      || boundary.additionalGateMutationPerformed !== false
      || boundary.productiveAuthorityIssued !== false
      || boundary.pr22ProductiveAuthorityIssued !== false
      || boundary.sendCmAuthority !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || boundary.repositoryMutationPerformed !== false
      || boundary.controlPlaneMutationPerformed !== false
      || record === null) {
    blocker.push("PR22_AUTHORITY_APPLY_POST_SETTLEMENT_NICHT_BEREIT");
  }

  const postSettlementFingerprintRevalidated=
    record !== null && validatePostSettlementRecord(record);
  if (!postSettlementFingerprintRevalidated) {
    blocker.push("PR22_AUTHORITY_APPLY_POST_SETTLEMENT_FP_DRIFT");
  }

  const currentMainMatched=
    record !== null && record.sourceMainCommit === request.currentMainCommit;
  if (!currentMainMatched) {
    blocker.push("PR22_AUTHORITY_APPLY_MAIN_STALE");
  }

  let transaction: Pr22CoordinationProductiveAuthorityApplyTransaction | null=null;
  if (blocker.length === 0 && record !== null) {
    const operationKey=[
      "pr22-productive-authority-apply",
      record.stage,
      record.postSettlementFingerprint,
    ].join(":");
    const basis: Pr22CoordinationProductiveAuthorityApplyTransactionBasis =
      Object.freeze({
        schemaVersion:1,
        status:"PREPARED_PR22_PRODUCTIVE_AUTHORITY_APPLY_DEFAULT_OFF",
        stage:"PR22",
        transactionId:request.transactionId,
        operationKey,
        sourceMainCommit:record.sourceMainCommit,
        postSettlementFingerprint:record.postSettlementFingerprint,
        gateSettlementFingerprint:record.settlementFingerprint,
        gateTransactionFingerprint:record.transactionFingerprint,
        proposalFingerprint:record.proposalFingerprint,
        productiveEvidenceFingerprint:record.productiveEvidenceFingerprint,
        ratificationFingerprint:record.ratificationFingerprint,
        preparedAtMs:request.preparedAtMs,
        freshMainCheckRequiredAtExecution:true,
        postSettlementFingerprintRecheckRequiredAtExecution:true,
        settlementFingerprintRecheckRequiredAtExecution:true,
        gateTransactionFingerprintRecheckRequiredAtExecution:true,
        proposalFingerprintRecheckRequiredAtExecution:true,
        evidenceFingerprintRecheckRequiredAtExecution:true,
        ratificationFingerprintRecheckRequiredAtExecution:true,
        repositoryStateRecheckRequiredAtExecution:true,
        featureGateRecheckRequiredAtExecution:true,
        cap022FullChainRecheckRequiredAtExecution:true,
        durableIntentRequiredBeforeAuthorityMutation:true,
        oneShotExecutionRequired:true,
        sameIntentRetryAllowed:false,
        postconditionVerificationRequired:true,
        unknownOutcomeRequiresReconciliation:true,
        authorityApplyAdapterInstalled:false,
        executionEnabled:false,
        productiveAuthorityIssued:false,
        pr22ProductiveAuthorityIssued:false,
        sendCmAuthority:false,
        gameplayAuthority:false,
        rawWriteAuthority:false,
        broadRuntimeGrant:false,
        normalRuntimeAllowed:false,
        repositoryMutationPerformed:false,
        controlPlaneMutationPerformed:false,
      });
    transaction=Object.freeze({
      ...basis,
      authorityTransactionFingerprint:evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion:1,
    status:blocker.length === 0 ? "READY_DEFAULT_OFF" : "BLOCKIERT",
    blocker:Object.freeze([...new Set(blocker)]),
    stage:"PR22",
    transaction,
    postSettlementFingerprintRevalidated,
    currentMainMatched,
    authorityApplyAdapterInstalled:false,
    executionEnabled:false,
    productiveAuthorityIssued:false,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    separateExecutionAuthorizationRequired:true,
  });
}
