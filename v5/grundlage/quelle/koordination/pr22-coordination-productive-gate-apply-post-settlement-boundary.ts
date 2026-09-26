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
  Pr22CoordinationProductiveGateApplyExecutionResult,
  Pr22CoordinationProductiveGateApplySettlement,
  Pr22CoordinationProductiveGateApplySettlementBasis,
} from "./pr22-coordination-productive-one-shot-gate-apply-execution-boundary.js";

export interface Pr22CoordinationProductiveGateApplyPostSettlementRequest {
  readonly schemaVersion: 1;
  readonly execution: Pr22CoordinationProductiveGateApplyExecutionResult;
  readonly currentMainCommit: string;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly featureGate: Pr21_28FeatureGateSicht;
  readonly cap022FullChain: Cap022FoundationChainReadiness;
  readonly preparedAtMs: number;
}

export interface Pr22CoordinationProductiveGateApplyPostSettlementRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY";
  readonly stage: "PR22";
  readonly sourceMainCommit: string;
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly proposalFingerprint: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly settlementFingerprint: string;
  readonly preparedAtMs: number;
  readonly gateApplyVerified: true;
  readonly repositoryStateRevalidated: true;
  readonly featureGateProductiveEligible: true;
  readonly cap022FullChainRequired: true;
  readonly cap022FullChainSatisfied: true;
  readonly freshMainCheckRequiredAtAuthorityApply: true;
  readonly settlementFingerprintRecheckRequiredAtAuthorityApply: true;
  readonly transactionFingerprintRecheckRequiredAtAuthorityApply: true;
  readonly proposalFingerprintRecheckRequiredAtAuthorityApply: true;
  readonly evidenceFingerprintRecheckRequiredAtAuthorityApply: true;
  readonly ratificationFingerprintRecheckRequiredAtAuthorityApply: true;
  readonly repositoryStateRecheckRequiredAtAuthorityApply: true;
  readonly featureGateRecheckRequiredAtAuthorityApply: true;
  readonly cap022FullChainRecheckRequiredAtAuthorityApply: true;
  readonly separateProductiveAuthorityApplyRequired: true;
  readonly authorityApplyAdapterInstalled: false;
  readonly authorityApplyExecutionEnabled: false;
  readonly additionalGateMutationPerformed: false;
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

export interface Pr22CoordinationProductiveGateApplyPostSettlementRecord
  extends Pr22CoordinationProductiveGateApplyPostSettlementRecordBasis {
  readonly postSettlementFingerprint: string;
}

export interface Pr22CoordinationProductiveGateApplyPostSettlementBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record:
    Pr22CoordinationProductiveGateApplyPostSettlementRecord
    | null;
  readonly executionRevalidated: boolean;
  readonly settlementFingerprintRevalidated: boolean;
  readonly repositoryStateRevalidated: boolean;
  readonly featureGateRevalidated: boolean;
  readonly cap022FullChainRevalidated: boolean;
  readonly authorityApplyAdapterInstalled: false;
  readonly authorityApplyExecutionEnabled: false;
  readonly additionalGateMutationPerformed: false;
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

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}
function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function settlementBasis(
  settlement: Pr22CoordinationProductiveGateApplySettlement,
): Pr22CoordinationProductiveGateApplySettlementBasis {
  return Object.freeze({
    schemaVersion:settlement.schemaVersion,
    status:settlement.status,
    stage:settlement.stage,
    authorizationId:settlement.authorizationId,
    transactionId:settlement.transactionId,
    transactionFingerprint:settlement.transactionFingerprint,
    proposalFingerprint:settlement.proposalFingerprint,
    productiveEvidenceFingerprint:settlement.productiveEvidenceFingerprint,
    ratificationFingerprint:settlement.ratificationFingerprint,
    sourceMainCommit:settlement.sourceMainCommit,
    durableIntentId:settlement.durableIntentId,
    settledAtMs:settlement.settledAtMs,
    durableIntentObserved:settlement.durableIntentObserved,
    mutationAttemptObserved:settlement.mutationAttemptObserved,
    postconditionVerified:settlement.postconditionVerified,
    terminalMutationRecordObserved:settlement.terminalMutationRecordObserved,
    gateMutationPerformedBySettlement:
      settlement.gateMutationPerformedBySettlement,
    productiveAuthorityIssuedBySettlement:
      settlement.productiveAuthorityIssuedBySettlement,
    pr22ProductiveAuthorityIssuedBySettlement:
      settlement.pr22ProductiveAuthorityIssuedBySettlement,
    sendCmAuthorityIssuedBySettlement:
      settlement.sendCmAuthorityIssuedBySettlement,
    gameplayAuthorityIssuedBySettlement:
      settlement.gameplayAuthorityIssuedBySettlement,
    rawWriteAuthorityIssuedBySettlement:
      settlement.rawWriteAuthorityIssuedBySettlement,
    broadRuntimeGrantIssuedBySettlement:
      settlement.broadRuntimeGrantIssuedBySettlement,
    normalRuntimeAllowedBySettlement:
      settlement.normalRuntimeAllowedBySettlement,
  });
}

function validSettlement(
  settlement: Pr22CoordinationProductiveGateApplySettlement,
): boolean {
  return settlement.schemaVersion === 1
    && settlement.status
      === "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY"
    && settlement.stage === "PR22"
    && settlement.durableIntentObserved === true
    && settlement.mutationAttemptObserved === true
    && settlement.postconditionVerified === true
    && settlement.terminalMutationRecordObserved === true
    && settlement.gateMutationPerformedBySettlement === false
    && settlement.productiveAuthorityIssuedBySettlement === false
    && settlement.pr22ProductiveAuthorityIssuedBySettlement === false
    && settlement.sendCmAuthorityIssuedBySettlement === false
    && settlement.gameplayAuthorityIssuedBySettlement === false
    && settlement.rawWriteAuthorityIssuedBySettlement === false
    && settlement.broadRuntimeGrantIssuedBySettlement === false
    && settlement.normalRuntimeAllowedBySettlement === false
    && evidenceFingerprint(settlementBasis(settlement))
      === settlement.settlementFingerprint;
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

export function bereitePr22CoordinationProductiveGateApplyPostSettlementVor(
  request: Pr22CoordinationProductiveGateApplyPostSettlementRequest,
): Pr22CoordinationProductiveGateApplyPostSettlementBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_GATE_POST_SETTLEMENT_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR22_GATE_POST_SETTLEMENT_MAIN_UNGUELTIG",
  );
  time(
    request.preparedAtMs,
    "PR22_GATE_POST_SETTLEMENT_ZEIT_UNGUELTIG",
  );

  const blocker: string[]=[];
  const execution=request.execution;
  const settlement=execution.settlement;

  const executionRevalidated =
    execution.schemaVersion === 1
    && execution.status
      === "APPLIED_VERIFIED_PR22_PRODUCTIVE_GATE_RECORD_ONLY"
    && execution.blocker.length === 0
    && execution.stage === "PR22"
    && execution.authorizationConsumed === true
    && execution.durableIntentPersisted === true
    && execution.mutationAttemptObserved === true
    && execution.gateMutationPerformed === true
    && execution.controlPlaneMutationPerformed === true
    && execution.productiveAuthorityIssued === false
    && execution.pr22ProductiveAuthorityIssued === false
    && execution.sendCmAuthority === false
    && execution.gameplayAuthority === false
    && execution.rawWriteAuthority === false
    && execution.broadRuntimeGrant === false
    && execution.normalRuntimeAllowed === false
    && execution.repositoryMutationPerformed === false
    && execution.sameIntentRetryAllowed === false
    && execution.blindResumeAfterRestartAllowed === false
    && settlement !== null;
  if (!executionRevalidated) {
    blocker.push("PR22_GATE_POST_SETTLEMENT_EXECUTION_NICHT_VERIFIZIERT");
  }

  let settlementFingerprintRevalidated=false;
  if (settlement !== null) {
    settlementFingerprintRevalidated=
      validSettlement(settlement)
      && settlement.authorizationId === execution.authorizationId
      && settlement.transactionId === execution.transactionId
      && settlement.transactionFingerprint === execution.transactionFingerprint;
    if (!settlementFingerprintRevalidated) {
      blocker.push("PR22_GATE_POST_SETTLEMENT_RECORD_UNGUELTIG");
    }
    if (settlement.sourceMainCommit !== request.currentMainCommit) {
      blocker.push("PR22_GATE_POST_SETTLEMENT_MAIN_STALE");
    }
  }

  const repositoryStateRevalidated=
    validRepositoryState(request.currentRepositoryState);
  if (!repositoryStateRevalidated) {
    blocker.push("PR22_GATE_POST_SETTLEMENT_REPOSITORY_STATE_DRIFT");
  }

  const featureGateRevalidated=validFeatureGate(request.featureGate);
  if (!featureGateRevalidated) {
    blocker.push("PR22_GATE_POST_SETTLEMENT_FEATURE_GATE_NICHT_ELIGIBLE");
  }

  const cap022FullChainRevalidated=validCap022(request.cap022FullChain);
  if (!cap022FullChainRevalidated) {
    blocker.push("PR22_GATE_POST_SETTLEMENT_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }

  const uniqueBlocker=Object.freeze([...new Set(blocker)]);
  let record: Pr22CoordinationProductiveGateApplyPostSettlementRecord | null=null;

  if (uniqueBlocker.length === 0 && settlement !== null) {
    const basis: Pr22CoordinationProductiveGateApplyPostSettlementRecordBasis =
      Object.freeze({
        schemaVersion:1,
        status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY",
        stage:"PR22",
        sourceMainCommit:settlement.sourceMainCommit,
        authorizationId:settlement.authorizationId,
        transactionId:settlement.transactionId,
        transactionFingerprint:settlement.transactionFingerprint,
        proposalFingerprint:settlement.proposalFingerprint,
        productiveEvidenceFingerprint:settlement.productiveEvidenceFingerprint,
        ratificationFingerprint:settlement.ratificationFingerprint,
        settlementFingerprint:settlement.settlementFingerprint,
        preparedAtMs:request.preparedAtMs,
        gateApplyVerified:true,
        repositoryStateRevalidated:true,
        featureGateProductiveEligible:true,
        cap022FullChainRequired:true,
        cap022FullChainSatisfied:true,
        freshMainCheckRequiredAtAuthorityApply:true,
        settlementFingerprintRecheckRequiredAtAuthorityApply:true,
        transactionFingerprintRecheckRequiredAtAuthorityApply:true,
        proposalFingerprintRecheckRequiredAtAuthorityApply:true,
        evidenceFingerprintRecheckRequiredAtAuthorityApply:true,
        ratificationFingerprintRecheckRequiredAtAuthorityApply:true,
        repositoryStateRecheckRequiredAtAuthorityApply:true,
        featureGateRecheckRequiredAtAuthorityApply:true,
        cap022FullChainRecheckRequiredAtAuthorityApply:true,
        separateProductiveAuthorityApplyRequired:true,
        authorityApplyAdapterInstalled:false,
        authorityApplyExecutionEnabled:false,
        additionalGateMutationPerformed:false,
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
    record=Object.freeze({
      ...basis,
      postSettlementFingerprint:evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion:1,
    status:uniqueBlocker.length === 0
      ? "READY_FOR_SEPARATE_PR22_PRODUCTIVE_AUTHORITY_APPLY"
      : "BLOCKIERT",
    blocker:uniqueBlocker,
    record,
    executionRevalidated,
    settlementFingerprintRevalidated,
    repositoryStateRevalidated,
    featureGateRevalidated,
    cap022FullChainRevalidated,
    authorityApplyAdapterInstalled:false,
    authorityApplyExecutionEnabled:false,
    additionalGateMutationPerformed:false,
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
}
