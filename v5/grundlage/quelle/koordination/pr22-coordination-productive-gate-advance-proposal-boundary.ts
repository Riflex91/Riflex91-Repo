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
  Pr22CoordinationProductiveEvidenceRatificationRecord,
  Pr22CoordinationProductiveEvidenceRatificationRecordBasis,
} from "./pr22-coordination-productive-evidence-ratification-boundary.js";

export interface Pr22CoordinationProductiveGateAdvanceProposalRequest {
  readonly schemaVersion: 1;
  readonly currentMainCommit: string;
  readonly expectedProductiveEvidenceFingerprint: string;
  readonly ratification:
    Pr22CoordinationProductiveEvidenceRatificationRecord;
  readonly featureGate: Pr21_28FeatureGateSicht;
  readonly currentRepositoryState:
    Pr21MerchantRepositoryPostExecutionStateSnapshot;
  readonly cap022FullChain: Cap022FoundationChainReadiness;
}

export interface Pr22CoordinationProductiveGateAdvanceProposalRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY";
  readonly stage: "PR22";
  readonly sourceMainCommit: string;
  readonly productiveEvidenceFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly featureGateProductiveEligible: true;
  readonly cap022FullChainRequired: true;
  readonly cap022FullChainSatisfied: true;
  readonly repositoryStateRevalidated: true;
  readonly freshMainCheckRequiredAtApply: true;
  readonly evidenceFingerprintRecheckRequiredAtApply: true;
  readonly ratificationFingerprintRecheckRequiredAtApply: true;
  readonly repositoryStateRecheckRequiredAtApply: true;
  readonly cap022FullChainRecheckRequiredAtApply: true;
  readonly separateApplyRequired: true;
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

export interface Pr22CoordinationProductiveGateAdvanceProposalRecord
  extends Pr22CoordinationProductiveGateAdvanceProposalRecordBasis {
  readonly proposalFingerprint: string;
}

export interface Pr22CoordinationProductiveGateAdvanceProposalBoundary {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly record:
    Pr22CoordinationProductiveGateAdvanceProposalRecord
    | null;
  readonly ratificationFingerprintRevalidated: boolean;
  readonly productiveEvidenceFingerprintMatched: boolean;
  readonly repositoryStateRevalidated: boolean;
  readonly featureGateRevalidated: boolean;
  readonly cap022FullChainRevalidated: boolean;
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

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}
function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function ratificationBasis(
  record: Pr22CoordinationProductiveEvidenceRatificationRecord,
): Pr22CoordinationProductiveEvidenceRatificationRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    productiveEvidenceFingerprint: record.productiveEvidenceFingerprint,
    sourceMainCommit: record.sourceMainCommit,
    messageId: record.messageId,
    workflowId: record.workflowId,
    workflowRevision: record.workflowRevision,
    ratifierId: record.ratifierId,
    ratifiedAtMs: record.ratifiedAtMs,
    confirmationText: record.confirmationText,
    evidenceFingerprintRevalidated: record.evidenceFingerprintRevalidated,
    repositoryStateRevalidated: record.repositoryStateRevalidated,
    cap022FullChainRevalidated: record.cap022FullChainRevalidated,
    evidenceStillImmutable: record.evidenceStillImmutable,
    ratified: record.ratified,
    gateAdvanced: record.gateAdvanced,
    separateGateAdvanceRequired: record.separateGateAdvanceRequired,
    productiveAuthorityIssued: record.productiveAuthorityIssued,
    sendCmAuthority: record.sendCmAuthority,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
    repositoryMutationPerformed: record.repositoryMutationPerformed,
    controlPlaneMutationPerformed: record.controlPlaneMutationPerformed,
  });
}

function validRatification(
  record: Pr22CoordinationProductiveEvidenceRatificationRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status
        !== "RATIFIED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY"
      || record.stage !== "PR22"
      || record.evidenceFingerprintRevalidated !== true
      || record.repositoryStateRevalidated !== true
      || record.cap022FullChainRevalidated !== true
      || record.evidenceStillImmutable !== true
      || record.ratified !== true
      || record.gateAdvanced !== false
      || record.separateGateAdvanceRequired !== true
      || record.productiveAuthorityIssued !== false
      || record.sendCmAuthority !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false
      || record.repositoryMutationPerformed !== false
      || record.controlPlaneMutationPerformed !== false) {
    return false;
  }
  sha40(record.sourceMainCommit,"PR22_GATE_PROPOSAL_SOURCE_MAIN_UNGUELTIG");
  fp16(
    record.productiveEvidenceFingerprint,
    "PR22_GATE_PROPOSAL_EVIDENCE_FP_UNGUELTIG",
  );
  fp16(
    record.ratificationFingerprint,
    "PR22_GATE_PROPOSAL_RATIFICATION_FP_UNGUELTIG",
  );
  return evidenceFingerprint(ratificationBasis(record))
    === record.ratificationFingerprint;
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

export function bereitePr22CoordinationProductiveGateAdvanceProposalVor(
  request: Pr22CoordinationProductiveGateAdvanceProposalRequest,
): Pr22CoordinationProductiveGateAdvanceProposalBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR22_GATE_PROPOSAL_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR22_GATE_PROPOSAL_CURRENT_MAIN_UNGUELTIG");
  fp16(
    request.expectedProductiveEvidenceFingerprint,
    "PR22_GATE_PROPOSAL_EXPECTED_EVIDENCE_FP_UNGUELTIG",
  );

  const blocker: string[] = [];
  const ratification=request.ratification;

  const ratificationFingerprintRevalidated=validRatification(ratification);
  if (!ratificationFingerprintRevalidated) {
    blocker.push("PR22_GATE_PROPOSAL_RATIFICATION_DRIFT");
  }

  if (request.currentMainCommit !== ratification.sourceMainCommit) {
    blocker.push("PR22_GATE_PROPOSAL_MAIN_STALE");
  }

  const productiveEvidenceFingerprintMatched =
    request.expectedProductiveEvidenceFingerprint
      === ratification.productiveEvidenceFingerprint;
  if (!productiveEvidenceFingerprintMatched) {
    blocker.push("PR22_GATE_PROPOSAL_EVIDENCE_FP_DRIFT");
  }

  const state=request.currentRepositoryState;
  const repositoryStateRevalidated =
    state.schemaVersion === 1
    && state.currentStage === "PR22"
    && state.currentGate === "PR22_MULTI_CHARACTER_COORDINATION"
    && state.pr21StageStatus === "COMPLETE"
    && state.pr22StageStatus === "IN_PROGRESS"
    && state.pr22ProductiveAuthorityIssued === false;
  if (!repositoryStateRevalidated) {
    blocker.push("PR22_GATE_PROPOSAL_REPOSITORY_STATE_DRIFT");
  }

  const gate=request.featureGate;
  const featureGateRevalidated =
    gate.stage === "PR22"
    && gate.productiveEligible === true
    && gate.blocker.length === 0
    && gate.cap022FullChainRequired === true
    && gate.cap022FullChainSatisfied === true
    && gate.authorityIssued === false
    && gate.gameplayAuthority === false
    && gate.rawWriteAuthority === false
    && gate.normalRuntimeAllowed === false;
  if (!featureGateRevalidated) {
    blocker.push("PR22_GATE_PROPOSAL_FEATURE_GATE_NICHT_ELIGIBLE");
  }

  const cap022FullChainRevalidated=validCap022(request.cap022FullChain);
  if (!cap022FullChainRevalidated) {
    blocker.push("PR22_GATE_PROPOSAL_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }

  let record: Pr22CoordinationProductiveGateAdvanceProposalRecord | null=null;
  if (blocker.length === 0) {
    const basis: Pr22CoordinationProductiveGateAdvanceProposalRecordBasis =
      Object.freeze({
        schemaVersion:1,
        status:"READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY",
        stage:"PR22",
        sourceMainCommit:ratification.sourceMainCommit,
        productiveEvidenceFingerprint:
          ratification.productiveEvidenceFingerprint,
        ratificationFingerprint:ratification.ratificationFingerprint,
        messageId:ratification.messageId,
        workflowId:ratification.workflowId,
        workflowRevision:ratification.workflowRevision,
        featureGateProductiveEligible:true,
        cap022FullChainRequired:true,
        cap022FullChainSatisfied:true,
        repositoryStateRevalidated:true,
        freshMainCheckRequiredAtApply:true,
        evidenceFingerprintRecheckRequiredAtApply:true,
        ratificationFingerprintRecheckRequiredAtApply:true,
        repositoryStateRecheckRequiredAtApply:true,
        cap022FullChainRecheckRequiredAtApply:true,
        separateApplyRequired:true,
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
    record=Object.freeze({
      ...basis,
      proposalFingerprint:evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion:1,
    status:blocker.length === 0
      ? "READY_FOR_SEPARATE_PR22_PRODUCTIVE_GATE_APPLY"
      : "BLOCKIERT",
    blocker:Object.freeze([...new Set(blocker)]),
    record,
    ratificationFingerprintRevalidated,
    productiveEvidenceFingerprintMatched,
    repositoryStateRevalidated,
    featureGateRevalidated,
    cap022FullChainRevalidated,
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
