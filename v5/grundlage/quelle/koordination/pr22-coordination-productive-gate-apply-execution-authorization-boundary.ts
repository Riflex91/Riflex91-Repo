import type {
  Pr22CoordinationProductiveDefaultOffGateApplyBoundary,
} from "./pr22-coordination-productive-default-off-gate-apply-boundary.js";

export interface Pr22CoordinationProductiveGateApplyExecutionAuthorizationDraft {
  readonly schemaVersion: 1;
  readonly status:
    "AWAITING_EXPLICIT_PR22_PRODUCTIVE_GATE_APPLY_AUTHORIZATION";
  readonly stage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly proposalFingerprint: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly issuedAtMs: number;
  readonly expiresAtMs: number;
  readonly maximumUses: 1;
  readonly requiredConfirmationText: string;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly transactionFingerprintRecheckRequiredAtExecution: true;
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
  readonly executionPerformed: false;
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

export interface Pr22CoordinationProductiveGateApplyExecutionAuthorizationRecord
  extends Omit<
    Pr22CoordinationProductiveGateApplyExecutionAuthorizationDraft,
    "status" | "requiredConfirmationText"
  > {
  readonly status:
    "AUTHORIZED_PR22_PRODUCTIVE_GATE_APPLY_ONE_SHOT_RECORD_ONLY";
  readonly operatorId: string;
  readonly authorizedAtMs: number;
  readonly confirmationText: string;
  readonly gateApplyExecutionAuthorizationIssued: true;
  readonly authorizationConsumed: false;
}

function text(value: string, error: string, maximum=192): void {
  if (value.trim().length===0 || value.length>maximum) throw new Error(error);
}
function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value<0) throw new Error(error);
}
function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}
function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function validateBoundary(
  boundary: Pr22CoordinationProductiveDefaultOffGateApplyBoundary,
): void {
  const tx=boundary.transaction;
  if (boundary.schemaVersion!==1
      || boundary.status!=="READY_DEFAULT_OFF"
      || boundary.blocker.length!==0
      || boundary.proposalFingerprintRevalidated!==true
      || boundary.currentMainMatchedProposalSource!==true
      || boundary.applyAdapterInstalled!==false
      || boundary.executionEnabled!==false
      || boundary.gateMutationPerformed!==false
      || boundary.productiveAuthorityIssued!==false
      || boundary.sendCmAuthority!==false
      || boundary.pr22ProductiveAuthorityIssued!==false
      || boundary.gameplayAuthority!==false
      || boundary.rawWriteAuthority!==false
      || boundary.broadRuntimeGrant!==false
      || boundary.normalRuntimeAllowed!==false
      || boundary.repositoryMutationPerformed!==false
      || boundary.controlPlaneMutationPerformed!==false
      || tx===null
      || tx.schemaVersion!==1
      || tx.status!=="PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF"
      || tx.stage!=="PR22"
      || tx.freshMainCheckRequiredAtExecution!==true
      || tx.proposalFingerprintRecheckRequiredAtExecution!==true
      || tx.evidenceFingerprintRecheckRequiredAtExecution!==true
      || tx.ratificationFingerprintRecheckRequiredAtExecution!==true
      || tx.repositoryStateRecheckRequiredAtExecution!==true
      || tx.featureGateRecheckRequiredAtExecution!==true
      || tx.cap022FullChainRecheckRequiredAtExecution!==true
      || tx.durableIntentRequiredBeforeGateMutation!==true
      || tx.oneShotExecutionRequired!==true
      || tx.sameIntentRetryAllowed!==false
      || tx.postconditionVerificationRequired!==true
      || tx.unknownOutcomeRequiresReconciliation!==true
      || tx.applyAdapterInstalled!==false
      || tx.executionEnabled!==false
      || tx.gateMutationPerformed!==false
      || tx.productiveAuthorityIssued!==false
      || tx.sendCmAuthority!==false
      || tx.pr22ProductiveAuthorityIssued!==false
      || tx.gameplayAuthority!==false
      || tx.rawWriteAuthority!==false
      || tx.broadRuntimeGrant!==false
      || tx.normalRuntimeAllowed!==false
      || tx.repositoryMutationPerformed!==false
      || tx.controlPlaneMutationPerformed!==false) {
    throw new Error("PR22_GATE_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT");
  }
}

export function pr22CoordinationProductiveGateApplyAuthorizationConfirmationText(
  transactionFingerprint: string,
  sourceMainCommit: string,
): string {
  fp16(transactionFingerprint,"PR22_GATE_APPLY_AUTH_TX_FP_UNGUELTIG");
  sha40(sourceMainCommit,"PR22_GATE_APPLY_AUTH_MAIN_UNGUELTIG");
  return "AUTHORIZE PR22 PRODUCTIVE GATE APPLY TRANSACTION "
    + transactionFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr22CoordinationProductiveGateApplyExecutionAuthorizationVor(
  boundary: Pr22CoordinationProductiveDefaultOffGateApplyBoundary,
  authorizationId: string,
  issuedAtMs: number,
  expiresAtMs: number,
): Pr22CoordinationProductiveGateApplyExecutionAuthorizationDraft {
  validateBoundary(boundary);
  text(authorizationId,"PR22_GATE_APPLY_AUTH_ID_UNGUELTIG");
  time(issuedAtMs,"PR22_GATE_APPLY_AUTH_ISSUED_AT_UNGUELTIG");
  time(expiresAtMs,"PR22_GATE_APPLY_AUTH_EXPIRES_AT_UNGUELTIG");
  if (expiresAtMs<issuedAtMs || expiresAtMs-issuedAtMs>1500) {
    throw new Error("PR22_GATE_APPLY_AUTH_TTL_UNGUELTIG");
  }

  const tx=boundary.transaction;
  if(tx===null) {
    throw new Error("PR22_GATE_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT");
  }
  sha40(tx.sourceMainCommit,"PR22_GATE_APPLY_AUTH_TX_MAIN_UNGUELTIG");
  fp16(tx.transactionFingerprint,"PR22_GATE_APPLY_AUTH_TX_FP_UNGUELTIG");
  fp16(tx.proposalFingerprint,"PR22_GATE_APPLY_AUTH_PROPOSAL_FP_UNGUELTIG");
  fp16(tx.productiveEvidenceFingerprint,"PR22_GATE_APPLY_AUTH_EVIDENCE_FP_UNGUELTIG");
  fp16(tx.ratificationFingerprint,"PR22_GATE_APPLY_AUTH_RATIFICATION_FP_UNGUELTIG");

  return Object.freeze({
    schemaVersion:1,
    status:"AWAITING_EXPLICIT_PR22_PRODUCTIVE_GATE_APPLY_AUTHORIZATION",
    stage:"PR22",
    authorizationId,
    transactionId:tx.transactionId,
    operationKey:tx.operationKey,
    transactionFingerprint:tx.transactionFingerprint,
    sourceMainCommit:tx.sourceMainCommit,
    proposalFingerprint:tx.proposalFingerprint,
    productiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
    ratificationFingerprint:tx.ratificationFingerprint,
    issuedAtMs,
    expiresAtMs,
    maximumUses:1,
    requiredConfirmationText:
      pr22CoordinationProductiveGateApplyAuthorizationConfirmationText(
        tx.transactionFingerprint,
        tx.sourceMainCommit,
      ),
    freshMainCheckRequiredAtExecution:true,
    transactionFingerprintRecheckRequiredAtExecution:true,
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
    executionPerformed:false,
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

export function erteilePr22CoordinationProductiveGateApplyExecutionAuthorization(
  draft: Pr22CoordinationProductiveGateApplyExecutionAuthorizationDraft,
  confirmationText: string,
  operatorId: string,
  authorizedAtMs: number,
): Pr22CoordinationProductiveGateApplyExecutionAuthorizationRecord {
  if (draft.schemaVersion!==1
      || draft.status!=="AWAITING_EXPLICIT_PR22_PRODUCTIVE_GATE_APPLY_AUTHORIZATION"
      || draft.stage!=="PR22"
      || draft.maximumUses!==1
      || draft.freshMainCheckRequiredAtExecution!==true
      || draft.transactionFingerprintRecheckRequiredAtExecution!==true
      || draft.proposalFingerprintRecheckRequiredAtExecution!==true
      || draft.evidenceFingerprintRecheckRequiredAtExecution!==true
      || draft.ratificationFingerprintRecheckRequiredAtExecution!==true
      || draft.repositoryStateRecheckRequiredAtExecution!==true
      || draft.featureGateRecheckRequiredAtExecution!==true
      || draft.cap022FullChainRecheckRequiredAtExecution!==true
      || draft.durableIntentRequiredBeforeGateMutation!==true
      || draft.oneShotExecutionRequired!==true
      || draft.sameIntentRetryAllowed!==false
      || draft.postconditionVerificationRequired!==true
      || draft.unknownOutcomeRequiresReconciliation!==true
      || draft.applyAdapterInstalled!==false
      || draft.executionEnabled!==false
      || draft.executionPerformed!==false
      || draft.gateMutationPerformed!==false
      || draft.productiveAuthorityIssued!==false
      || draft.sendCmAuthority!==false
      || draft.pr22ProductiveAuthorityIssued!==false
      || draft.gameplayAuthority!==false
      || draft.rawWriteAuthority!==false
      || draft.broadRuntimeGrant!==false
      || draft.normalRuntimeAllowed!==false
      || draft.repositoryMutationPerformed!==false
      || draft.controlPlaneMutationPerformed!==false) {
    throw new Error("PR22_GATE_APPLY_AUTH_DRAFT_UNGUELTIG");
  }
  if(confirmationText!==draft.requiredConfirmationText) {
    throw new Error("PR22_GATE_APPLY_AUTH_BESTAETIGUNG_UNGUELTIG");
  }
  text(operatorId,"PR22_GATE_APPLY_AUTH_OPERATOR_UNGUELTIG");
  time(authorizedAtMs,"PR22_GATE_APPLY_AUTH_AUTHORIZED_AT_UNGUELTIG");
  if(authorizedAtMs<draft.issuedAtMs || authorizedAtMs>draft.expiresAtMs) {
    throw new Error("PR22_GATE_APPLY_AUTH_ABGELAUFEN");
  }

  return Object.freeze({
    schemaVersion:1,
    status:"AUTHORIZED_PR22_PRODUCTIVE_GATE_APPLY_ONE_SHOT_RECORD_ONLY",
    stage:"PR22",
    authorizationId:draft.authorizationId,
    transactionId:draft.transactionId,
    operationKey:draft.operationKey,
    transactionFingerprint:draft.transactionFingerprint,
    sourceMainCommit:draft.sourceMainCommit,
    proposalFingerprint:draft.proposalFingerprint,
    productiveEvidenceFingerprint:draft.productiveEvidenceFingerprint,
    ratificationFingerprint:draft.ratificationFingerprint,
    issuedAtMs:draft.issuedAtMs,
    expiresAtMs:draft.expiresAtMs,
    maximumUses:1,
    freshMainCheckRequiredAtExecution:true,
    transactionFingerprintRecheckRequiredAtExecution:true,
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
    executionPerformed:false,
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
    operatorId,
    authorizedAtMs,
    confirmationText,
    gateApplyExecutionAuthorizationIssued:true,
    authorizationConsumed:false,
  });
}
