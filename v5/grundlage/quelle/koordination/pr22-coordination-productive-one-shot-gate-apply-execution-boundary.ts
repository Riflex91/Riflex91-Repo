import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Cap022FoundationChainReadiness,
} from "../runtime/cap022-foundation-chain-readiness.js";
import type {
  Pr21_28FeatureGateSicht,
} from "../runtime/pr21-28-feature-gates.js";
import type {
  Pr21MerchantRepositoryPostExecutionStateSnapshot,
} from "../merchant/pr21-merchant-repository-stage-state-post-execution-finalization-boundary.js";
import type {
  Pr22CoordinationProductiveGateApplyTransaction,
  Pr22CoordinationProductiveGateApplyTransactionBasis,
} from "./pr22-coordination-productive-default-off-gate-apply-boundary.js";
import type {
  Pr22CoordinationProductiveGateApplyExecutionAuthorizationRecord,
} from "./pr22-coordination-productive-gate-apply-execution-authorization-boundary.js";

export interface Pr22CoordinationProductiveGateApplyDurableIntentInput {
  readonly schemaVersion: 1;
  readonly stage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly proposalFingerprint: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly requestedAtMs: number;
}

export interface Pr22CoordinationProductiveGateApplyDurableIntentReceipt {
  readonly schemaVersion: 1;
  readonly status:
    | "PERSISTED_NEW"
    | "ALREADY_PERSISTED_RECONCILIATION_REQUIRED";
  readonly durableIntentId: string;
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly persistedAtMs: number;
}

export interface Pr22CoordinationProductiveGateApplyDurableIntentWriter {
  persistPr22CoordinationProductiveGateApplyIntent(
    input: Pr22CoordinationProductiveGateApplyDurableIntentInput,
  ): Promise<Pr22CoordinationProductiveGateApplyDurableIntentReceipt>;
}

export interface Pr22CoordinationProductiveGateApplyMutationResult {
  readonly schemaVersion: 1;
  readonly outcome: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly mutationAttempted: true;
  readonly terminalMutationRecordPersisted: boolean;
  readonly productiveAuthorityIssued: false;
  readonly pr22ProductiveAuthorityIssued: false;
}

export interface Pr22CoordinationProductiveGateApplyPostcondition {
  readonly schemaVersion: 1;
  readonly status: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly stage: "PR22";
  readonly transactionFingerprint: string | null;
  readonly proposalFingerprint: string | null;
  readonly productiveEvidenceFingerprint: string | null;
  readonly ratificationFingerprint: string | null;
  readonly productiveAuthorityIssued: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly observedAtMs: number;
}

export interface Pr22CoordinationProductiveGateApplyControlPlaneAdapter {
  applyPr22CoordinationProductiveGate(input: {
    readonly schemaVersion: 1;
    readonly stage: "PR22";
    readonly authorizationId: string;
    readonly transactionId: string;
    readonly operationKey: string;
    readonly transactionFingerprint: string;
    readonly proposalFingerprint: string;
    readonly productiveEvidenceFingerprint: string;
    readonly ratificationFingerprint: string;
    readonly durableIntentId: string;
  }): Promise<Pr22CoordinationProductiveGateApplyMutationResult>;

  readPr22CoordinationProductiveGatePostcondition(input: {
    readonly schemaVersion: 1;
    readonly stage: "PR22";
    readonly transactionFingerprint: string;
    readonly proposalFingerprint: string;
    readonly productiveEvidenceFingerprint: string;
    readonly ratificationFingerprint: string;
  }): Promise<Pr22CoordinationProductiveGateApplyPostcondition>;
}

export interface Pr22CoordinationProductiveGateApplySettlementBasis {
  readonly schemaVersion: 1;
  readonly status: "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY";
  readonly stage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly proposalFingerprint: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly sourceMainCommit: string;
  readonly durableIntentId: string;
  readonly settledAtMs: number;
  readonly durableIntentObserved: true;
  readonly mutationAttemptObserved: true;
  readonly postconditionVerified: true;
  readonly terminalMutationRecordObserved: true;
  readonly gateMutationPerformedBySettlement: false;
  readonly productiveAuthorityIssuedBySettlement: false;
  readonly pr22ProductiveAuthorityIssuedBySettlement: false;
  readonly sendCmAuthorityIssuedBySettlement: false;
  readonly gameplayAuthorityIssuedBySettlement: false;
  readonly rawWriteAuthorityIssuedBySettlement: false;
  readonly broadRuntimeGrantIssuedBySettlement: false;
  readonly normalRuntimeAllowedBySettlement: false;
}

export interface Pr22CoordinationProductiveGateApplySettlement
  extends Pr22CoordinationProductiveGateApplySettlementBasis {
  readonly settlementFingerprint: string;
}

export interface Pr22CoordinationProductiveGateApplyExecutionRequest {
  readonly schemaVersion: 1;
  readonly authorization:
    Pr22CoordinationProductiveGateApplyExecutionAuthorizationRecord;
  readonly transaction: Pr22CoordinationProductiveGateApplyTransaction;
  readonly currentMainCommit: string;
  readonly currentTransactionFingerprint: string;
  readonly currentProposalFingerprint: string;
  readonly currentProductiveEvidenceFingerprint: string;
  readonly currentRatificationFingerprint: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly featureGate: Pr21_28FeatureGateSicht;
  readonly cap022FullChain: Cap022FoundationChainReadiness;
  readonly executionAtMs: number;
  readonly restartSinceAuthorization: boolean;
  readonly durableIntentWriter:
    Pr22CoordinationProductiveGateApplyDurableIntentWriter;
  readonly controlPlaneAdapter:
    Pr22CoordinationProductiveGateApplyControlPlaneAdapter;
}

export interface Pr22CoordinationProductiveGateApplyExecutionResult {
  readonly schemaVersion: 1;
  readonly status:
    | "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY"
    | "BLOCKIERT_PRECHECK"
    | "BLOCKIERT_RECONCILIATION_REQUIRED";
  readonly blocker: readonly string[];
  readonly stage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly authorizationConsumed: boolean;
  readonly durableIntentPersisted: boolean;
  readonly mutationAttemptObserved: boolean;
  readonly gateMutationPerformed: boolean;
  readonly controlPlaneMutationPerformed: boolean;
  readonly settlement:
    Pr22CoordinationProductiveGateApplySettlement
    | null;
  readonly productiveAuthorityIssued: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly repositoryMutationPerformed: false;
  readonly sameIntentRetryAllowed: false;
  readonly blindResumeAfterRestartAllowed: false;
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

function transactionBasis(
  tx: Pr22CoordinationProductiveGateApplyTransaction,
): Pr22CoordinationProductiveGateApplyTransactionBasis {
  return Object.freeze({
    schemaVersion:tx.schemaVersion,
    status:tx.status,
    stage:tx.stage,
    transactionId:tx.transactionId,
    operationKey:tx.operationKey,
    sourceMainCommit:tx.sourceMainCommit,
    proposalFingerprint:tx.proposalFingerprint,
    productiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
    ratificationFingerprint:tx.ratificationFingerprint,
    preparedAtMs:tx.preparedAtMs,
    freshMainCheckRequiredAtExecution:
      tx.freshMainCheckRequiredAtExecution,
    proposalFingerprintRecheckRequiredAtExecution:
      tx.proposalFingerprintRecheckRequiredAtExecution,
    evidenceFingerprintRecheckRequiredAtExecution:
      tx.evidenceFingerprintRecheckRequiredAtExecution,
    ratificationFingerprintRecheckRequiredAtExecution:
      tx.ratificationFingerprintRecheckRequiredAtExecution,
    repositoryStateRecheckRequiredAtExecution:
      tx.repositoryStateRecheckRequiredAtExecution,
    featureGateRecheckRequiredAtExecution:
      tx.featureGateRecheckRequiredAtExecution,
    cap022FullChainRecheckRequiredAtExecution:
      tx.cap022FullChainRecheckRequiredAtExecution,
    durableIntentRequiredBeforeGateMutation:
      tx.durableIntentRequiredBeforeGateMutation,
    oneShotExecutionRequired:tx.oneShotExecutionRequired,
    sameIntentRetryAllowed:tx.sameIntentRetryAllowed,
    postconditionVerificationRequired:
      tx.postconditionVerificationRequired,
    unknownOutcomeRequiresReconciliation:
      tx.unknownOutcomeRequiresReconciliation,
    applyAdapterInstalled:tx.applyAdapterInstalled,
    executionEnabled:tx.executionEnabled,
    gateMutationPerformed:tx.gateMutationPerformed,
    productiveAuthorityIssued:tx.productiveAuthorityIssued,
    sendCmAuthority:tx.sendCmAuthority,
    pr22ProductiveAuthorityIssued:tx.pr22ProductiveAuthorityIssued,
    gameplayAuthority:tx.gameplayAuthority,
    rawWriteAuthority:tx.rawWriteAuthority,
    broadRuntimeGrant:tx.broadRuntimeGrant,
    normalRuntimeAllowed:tx.normalRuntimeAllowed,
    repositoryMutationPerformed:tx.repositoryMutationPerformed,
    controlPlaneMutationPerformed:tx.controlPlaneMutationPerformed,
  });
}

function validTransaction(
  tx: Pr22CoordinationProductiveGateApplyTransaction,
): boolean {
  return tx.schemaVersion === 1
    && tx.status === "PREPARED_PR22_PRODUCTIVE_GATE_APPLY_DEFAULT_OFF"
    && tx.stage === "PR22"
    && tx.freshMainCheckRequiredAtExecution === true
    && tx.proposalFingerprintRecheckRequiredAtExecution === true
    && tx.evidenceFingerprintRecheckRequiredAtExecution === true
    && tx.ratificationFingerprintRecheckRequiredAtExecution === true
    && tx.repositoryStateRecheckRequiredAtExecution === true
    && tx.featureGateRecheckRequiredAtExecution === true
    && tx.cap022FullChainRecheckRequiredAtExecution === true
    && tx.durableIntentRequiredBeforeGateMutation === true
    && tx.oneShotExecutionRequired === true
    && tx.sameIntentRetryAllowed === false
    && tx.postconditionVerificationRequired === true
    && tx.unknownOutcomeRequiresReconciliation === true
    && tx.applyAdapterInstalled === false
    && tx.executionEnabled === false
    && tx.gateMutationPerformed === false
    && tx.productiveAuthorityIssued === false
    && tx.sendCmAuthority === false
    && tx.pr22ProductiveAuthorityIssued === false
    && tx.gameplayAuthority === false
    && tx.rawWriteAuthority === false
    && tx.broadRuntimeGrant === false
    && tx.normalRuntimeAllowed === false
    && tx.repositoryMutationPerformed === false
    && tx.controlPlaneMutationPerformed === false
    && evidenceFingerprint(transactionBasis(tx)) === tx.transactionFingerprint;
}

function validRepositoryState(
  state: Pr21MerchantRepositoryPostExecutionStateSnapshot,
): boolean {
  return state.schemaVersion === 1
    && state.currentStage === "PR22"
    && state.currentGate === "PR22_MULTI_CHARACTER_COORDINATION"
    && state.pr21StageStatus === "COMPLETE"
    && state.pr22StageStatus === "IN_PROGRESS"
    && state.pr22ProductiveAuthorityIssued === false;
}

function validFeatureGate(gate: Pr21_28FeatureGateSicht): boolean {
  return gate.stage === "PR22"
    && gate.productiveEligible === true
    && gate.blocker.length === 0
    && gate.cap022FullChainRequired === true
    && gate.cap022FullChainSatisfied === true
    && gate.authorityIssued === false
    && gate.gameplayAuthority === false
    && gate.rawWriteAuthority === false
    && gate.normalRuntimeAllowed === false;
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

function blocked(
  request: Pr22CoordinationProductiveGateApplyExecutionRequest,
  blocker: readonly string[],
): Pr22CoordinationProductiveGateApplyExecutionResult {
  return Object.freeze({
    schemaVersion:1,
    status:"BLOCKIERT_PRECHECK",
    blocker:Object.freeze([...new Set(blocker)]),
    stage:"PR22",
    authorizationId:request.authorization.authorizationId,
    transactionId:request.transaction.transactionId,
    transactionFingerprint:request.transaction.transactionFingerprint,
    authorizationConsumed:false,
    durableIntentPersisted:false,
    mutationAttemptObserved:false,
    gateMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    settlement:null,
    productiveAuthorityIssued:false,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
  });
}

function reconciliationResult(
  request: Pr22CoordinationProductiveGateApplyExecutionRequest,
  blocker: readonly string[],
  durableIntentPersisted: boolean,
  mutationAttemptObserved: boolean,
): Pr22CoordinationProductiveGateApplyExecutionResult {
  return Object.freeze({
    schemaVersion:1,
    status:"BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker:Object.freeze([
      "PR22_GATE_APPLY_EXEC_RECONCILIATION_REQUIRED",
      ...new Set(blocker),
    ]),
    stage:"PR22",
    authorizationId:request.authorization.authorizationId,
    transactionId:request.transaction.transactionId,
    transactionFingerprint:request.transaction.transactionFingerprint,
    authorizationConsumed:true,
    durableIntentPersisted,
    mutationAttemptObserved,
    gateMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    settlement:null,
    productiveAuthorityIssued:false,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
  });
}

function settlement(
  request: Pr22CoordinationProductiveGateApplyExecutionRequest,
  durableIntentId: string,
  settledAtMs: number,
): Pr22CoordinationProductiveGateApplySettlement {
  const tx=request.transaction;
  const basis: Pr22CoordinationProductiveGateApplySettlementBasis =
    Object.freeze({
      schemaVersion:1,
      status:"APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
      stage:"PR22",
      authorizationId:request.authorization.authorizationId,
      transactionId:tx.transactionId,
      transactionFingerprint:tx.transactionFingerprint,
      proposalFingerprint:tx.proposalFingerprint,
      productiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
      ratificationFingerprint:tx.ratificationFingerprint,
      sourceMainCommit:tx.sourceMainCommit,
      durableIntentId,
      settledAtMs,
      durableIntentObserved:true,
      mutationAttemptObserved:true,
      postconditionVerified:true,
      terminalMutationRecordObserved:true,
      gateMutationPerformedBySettlement:false,
      productiveAuthorityIssuedBySettlement:false,
      pr22ProductiveAuthorityIssuedBySettlement:false,
      sendCmAuthorityIssuedBySettlement:false,
      gameplayAuthorityIssuedBySettlement:false,
      rawWriteAuthorityIssuedBySettlement:false,
      broadRuntimeGrantIssuedBySettlement:false,
      normalRuntimeAllowedBySettlement:false,
    });
  return Object.freeze({
    ...basis,
    settlementFingerprint:evidenceFingerprint(basis),
  });
}

export async function fuehrePr22CoordinationProductiveGateApplyEinmalAus(
  request: Pr22CoordinationProductiveGateApplyExecutionRequest,
): Promise<Pr22CoordinationProductiveGateApplyExecutionResult> {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_GATE_APPLY_EXEC_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_GATE_APPLY_EXEC_MAIN_UNGUELTIG");
  fp16(
    request.currentTransactionFingerprint,
    "PR22_GATE_APPLY_EXEC_CURRENT_TX_FP_UNGUELTIG",
  );
  fp16(
    request.currentProposalFingerprint,
    "PR22_GATE_APPLY_EXEC_CURRENT_PROPOSAL_FP_UNGUELTIG",
  );
  fp16(
    request.currentProductiveEvidenceFingerprint,
    "PR22_GATE_APPLY_EXEC_CURRENT_EVIDENCE_FP_UNGUELTIG",
  );
  fp16(
    request.currentRatificationFingerprint,
    "PR22_GATE_APPLY_EXEC_CURRENT_RATIFICATION_FP_UNGUELTIG",
  );
  time(request.executionAtMs,"PR22_GATE_APPLY_EXEC_ZEIT_UNGUELTIG");

  const auth=request.authorization;
  const tx=request.transaction;
  const blocker: string[]=[];

  if (auth.schemaVersion !== 1
      || auth.status
        !== "AUTHORIZED_PR22_PRODUCTIVE_GATE_APPLY_ONE_SHOT_RECORD_ONLY"
      || auth.stage !== "PR22"
      || auth.gateApplyExecutionAuthorizationIssued !== true
      || auth.authorizationConsumed !== false
      || auth.maximumUses !== 1
      || auth.freshMainCheckRequiredAtExecution !== true
      || auth.transactionFingerprintRecheckRequiredAtExecution !== true
      || auth.proposalFingerprintRecheckRequiredAtExecution !== true
      || auth.evidenceFingerprintRecheckRequiredAtExecution !== true
      || auth.ratificationFingerprintRecheckRequiredAtExecution !== true
      || auth.repositoryStateRecheckRequiredAtExecution !== true
      || auth.featureGateRecheckRequiredAtExecution !== true
      || auth.cap022FullChainRecheckRequiredAtExecution !== true
      || auth.durableIntentRequiredBeforeGateMutation !== true
      || auth.oneShotExecutionRequired !== true
      || auth.sameIntentRetryAllowed !== false
      || auth.postconditionVerificationRequired !== true
      || auth.unknownOutcomeRequiresReconciliation !== true
      || auth.applyAdapterInstalled !== false
      || auth.executionEnabled !== false
      || auth.executionPerformed !== false
      || auth.gateMutationPerformed !== false
      || auth.productiveAuthorityIssued !== false
      || auth.sendCmAuthority !== false
      || auth.pr22ProductiveAuthorityIssued !== false
      || auth.gameplayAuthority !== false
      || auth.rawWriteAuthority !== false
      || auth.broadRuntimeGrant !== false
      || auth.normalRuntimeAllowed !== false
      || auth.repositoryMutationPerformed !== false
      || auth.controlPlaneMutationPerformed !== false) {
    blocker.push("PR22_GATE_APPLY_EXEC_AUTHORIZATION_UNGUELTIG");
  }

  if (!validTransaction(tx)) {
    blocker.push("PR22_GATE_APPLY_EXEC_TRANSACTION_UNGUELTIG");
  }
  if (request.restartSinceAuthorization) {
    blocker.push("PR22_GATE_APPLY_EXEC_RESTART_REQUIRES_RECONCILIATION");
  }
  if (request.executionAtMs < auth.authorizedAtMs
      || request.executionAtMs > auth.expiresAtMs) {
    blocker.push("PR22_GATE_APPLY_EXEC_AUTHORIZATION_ABGELAUFEN");
  }
  if (tx.transactionId !== auth.transactionId
      || tx.operationKey !== auth.operationKey
      || tx.transactionFingerprint !== auth.transactionFingerprint
      || tx.sourceMainCommit !== auth.sourceMainCommit
      || tx.proposalFingerprint !== auth.proposalFingerprint
      || tx.productiveEvidenceFingerprint !== auth.productiveEvidenceFingerprint
      || tx.ratificationFingerprint !== auth.ratificationFingerprint) {
    blocker.push("PR22_GATE_APPLY_EXEC_AUTH_TX_BINDING_DRIFT");
  }
  if (request.currentMainCommit !== auth.sourceMainCommit) {
    blocker.push("PR22_GATE_APPLY_EXEC_MAIN_STALE");
  }
  if (request.currentTransactionFingerprint !== auth.transactionFingerprint
      || request.currentTransactionFingerprint !== tx.transactionFingerprint) {
    blocker.push("PR22_GATE_APPLY_EXEC_TRANSACTION_FP_STALE");
  }
  if (request.currentProposalFingerprint !== auth.proposalFingerprint
      || request.currentProposalFingerprint !== tx.proposalFingerprint) {
    blocker.push("PR22_GATE_APPLY_EXEC_PROPOSAL_FP_STALE");
  }
  if (request.currentProductiveEvidenceFingerprint
        !== auth.productiveEvidenceFingerprint
      || request.currentProductiveEvidenceFingerprint
        !== tx.productiveEvidenceFingerprint) {
    blocker.push("PR22_GATE_APPLY_EXEC_EVIDENCE_FP_STALE");
  }
  if (request.currentRatificationFingerprint !== auth.ratificationFingerprint
      || request.currentRatificationFingerprint !== tx.ratificationFingerprint) {
    blocker.push("PR22_GATE_APPLY_EXEC_RATIFICATION_FP_STALE");
  }
  if (!validRepositoryState(request.currentRepositoryState)) {
    blocker.push("PR22_GATE_APPLY_EXEC_REPOSITORY_STATE_DRIFT");
  }
  if (!validFeatureGate(request.featureGate)) {
    blocker.push("PR22_GATE_APPLY_EXEC_FEATURE_GATE_NICHT_ELIGIBLE");
  }
  if (!validCap022(request.cap022FullChain)) {
    blocker.push("PR22_GATE_APPLY_EXEC_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }

  if (blocker.length > 0) {
    return blocked(request,blocker);
  }

  let receipt: Pr22CoordinationProductiveGateApplyDurableIntentReceipt;
  try {
    receipt=
      await request.durableIntentWriter
        .persistPr22CoordinationProductiveGateApplyIntent(Object.freeze({
          schemaVersion:1,
          stage:"PR22",
          authorizationId:auth.authorizationId,
          transactionId:tx.transactionId,
          operationKey:tx.operationKey,
          transactionFingerprint:tx.transactionFingerprint,
          sourceMainCommit:tx.sourceMainCommit,
          proposalFingerprint:tx.proposalFingerprint,
          productiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
          ratificationFingerprint:tx.ratificationFingerprint,
          requestedAtMs:request.executionAtMs,
        }));
  } catch {
    return blocked(request,[
      "PR22_GATE_APPLY_EXEC_DURABLE_INTENT_PERSIST_FAILED",
    ]);
  }

  const receiptValid =
    receipt.schemaVersion === 1
    && receipt.authorizationId === auth.authorizationId
    && receipt.transactionId === tx.transactionId
    && receipt.operationKey === tx.operationKey
    && receipt.transactionFingerprint === tx.transactionFingerprint
    && receipt.durableIntentId.trim().length > 0
    && receipt.durableIntentId.length <= 192
    && Number.isSafeInteger(receipt.persistedAtMs)
    && receipt.persistedAtMs >= request.executionAtMs
    && receipt.persistedAtMs <= auth.expiresAtMs;

  if (!receiptValid) {
    return reconciliationResult(request,[
      "PR22_GATE_APPLY_EXEC_DURABLE_INTENT_RECEIPT_UNVERIFIED",
    ],true,false);
  }
  if (receipt.status === "ALREADY_PERSISTED_RECONCILIATION_REQUIRED") {
    return reconciliationResult(request,[
      "PR22_GATE_APPLY_EXEC_DURABLE_INTENT_ALREADY_EXISTS",
    ],true,false);
  }
  if (receipt.status !== "PERSISTED_NEW") {
    return reconciliationResult(request,[
      "PR22_GATE_APPLY_EXEC_DURABLE_INTENT_STATUS_UNBEKANNT",
    ],true,false);
  }

  let mutation: Pr22CoordinationProductiveGateApplyMutationResult =
    Object.freeze({
      schemaVersion:1,
      outcome:"UNKNOWN",
      mutationAttempted:true,
      terminalMutationRecordPersisted:false,
      productiveAuthorityIssued:false,
      pr22ProductiveAuthorityIssued:false,
    });
  try {
    mutation=
      await request.controlPlaneAdapter.applyPr22CoordinationProductiveGate(
        Object.freeze({
          schemaVersion:1,
          stage:"PR22",
          authorizationId:auth.authorizationId,
          transactionId:tx.transactionId,
          operationKey:tx.operationKey,
          transactionFingerprint:tx.transactionFingerprint,
          proposalFingerprint:tx.proposalFingerprint,
          productiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
          ratificationFingerprint:tx.ratificationFingerprint,
          durableIntentId:receipt.durableIntentId,
        }),
      );
  } catch {
    mutation=Object.freeze({
      schemaVersion:1,
      outcome:"UNKNOWN",
      mutationAttempted:true,
      terminalMutationRecordPersisted:false,
      productiveAuthorityIssued:false,
      pr22ProductiveAuthorityIssued:false,
    });
  }

  let postcondition: Pr22CoordinationProductiveGateApplyPostcondition =
    Object.freeze({
      schemaVersion:1,
      status:"UNKNOWN",
      stage:"PR22",
      transactionFingerprint:null,
      proposalFingerprint:null,
      productiveEvidenceFingerprint:null,
      ratificationFingerprint:null,
      productiveAuthorityIssued:false,
      pr22ProductiveAuthorityIssued:false,
      observedAtMs:request.executionAtMs,
    });
  try {
    postcondition=
      await request.controlPlaneAdapter
        .readPr22CoordinationProductiveGatePostcondition(Object.freeze({
          schemaVersion:1,
          stage:"PR22",
          transactionFingerprint:tx.transactionFingerprint,
          proposalFingerprint:tx.proposalFingerprint,
          productiveEvidenceFingerprint:tx.productiveEvidenceFingerprint,
          ratificationFingerprint:tx.ratificationFingerprint,
        }));
  } catch {
    postcondition=Object.freeze({
      schemaVersion:1,
      status:"UNKNOWN",
      stage:"PR22",
      transactionFingerprint:null,
      proposalFingerprint:null,
      productiveEvidenceFingerprint:null,
      ratificationFingerprint:null,
      productiveAuthorityIssued:false,
      pr22ProductiveAuthorityIssued:false,
      observedAtMs:request.executionAtMs,
    });
  }

  const mutationVerified =
    mutation.schemaVersion === 1
    && mutation.outcome === "APPLIED"
    && mutation.mutationAttempted === true
    && mutation.terminalMutationRecordPersisted === true
    && mutation.productiveAuthorityIssued === false
    && mutation.pr22ProductiveAuthorityIssued === false;

  const postconditionVerified =
    postcondition.schemaVersion === 1
    && postcondition.status === "APPLIED"
    && postcondition.stage === "PR22"
    && postcondition.transactionFingerprint === tx.transactionFingerprint
    && postcondition.proposalFingerprint === tx.proposalFingerprint
    && postcondition.productiveEvidenceFingerprint
      === tx.productiveEvidenceFingerprint
    && postcondition.ratificationFingerprint === tx.ratificationFingerprint
    && postcondition.productiveAuthorityIssued === false
    && postcondition.pr22ProductiveAuthorityIssued === false
    && Number.isSafeInteger(postcondition.observedAtMs)
    && postcondition.observedAtMs >= request.executionAtMs;

  if (!mutationVerified || !postconditionVerified) {
    const causes: string[]=[];
    if (!mutationVerified) {
      causes.push("PR22_GATE_APPLY_EXEC_MUTATION_UNVERIFIED");
    }
    if (!postconditionVerified) {
      causes.push("PR22_GATE_APPLY_EXEC_POSTCONDITION_UNVERIFIED");
    }
    return reconciliationResult(request,causes,true,true);
  }

  const record=settlement(
    request,
    receipt.durableIntentId,
    postcondition.observedAtMs,
  );

  return Object.freeze({
    schemaVersion:1,
    status:"APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY",
    blocker:Object.freeze([]),
    stage:"PR22",
    authorizationId:auth.authorizationId,
    transactionId:tx.transactionId,
    transactionFingerprint:tx.transactionFingerprint,
    authorizationConsumed:true,
    durableIntentPersisted:true,
    mutationAttemptObserved:true,
    gateMutationPerformed:true,
    controlPlaneMutationPerformed:true,
    settlement:record,
    productiveAuthorityIssued:false,
    pr22ProductiveAuthorityIssued:false,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
  });
}
