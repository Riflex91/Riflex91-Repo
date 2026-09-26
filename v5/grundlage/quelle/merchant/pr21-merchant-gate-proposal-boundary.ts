import type { Pr21_28FeatureGateSicht } from "../runtime/pr21-28-feature-gates.js";
import {
  bereitePr21_28GateAdvanceVor,
  type Pr21_28GateAdvanceProposal,
} from "../runtime/pr21-28-gate-advance-proposal.js";
import type { Pr21_28RatificationRecord } from "../zertifizierung/pr21-28-ratification-record.js";

export interface Pr21MerchantGateProposalRequest {
  readonly schemaVersion: 1;
  readonly currentMainCommit: string;
  readonly expectedPackageFingerprint: string;
  readonly ratification: Pr21_28RatificationRecord;
  readonly featureGate: Pr21_28FeatureGateSicht;
}

export interface Pr21MerchantGateProposalBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_GATE_APPLY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly proposal: Pr21_28GateAdvanceProposal;
  readonly currentMainMatchedRatificationSource: boolean;
  readonly packageFingerprintMatched: boolean;
  readonly featureGateProductiveEligible: boolean;
  readonly separateApplyRequired: true;
  readonly requiresFreshMainCheckAtApply: true;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;
const STAGE = "PR21" as const;

export function bereitePr21MerchantGateProposalVor(
  request: Pr21MerchantGateProposalRequest,
): Pr21MerchantGateProposalBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_GATE_PROPOSAL_SCHEMA_UNGUELTIG");
  }

  const record = request.ratification;
  if (record.schemaVersion !== 1
      || record.status !== "RATIFIED_RECORD_ONLY"
      || record.ratified !== true
      || record.checkpointId !== CHECKPOINT
      || record.gateAdvanced !== false
      || record.authorityIssued !== false
      || record.broadRuntimeGrant !== false
      || record.resultPackageStillImmutable !== true
      || record.gesamtfreigabeRequiredSeparately !== true) {
    throw new Error("PR21_MERCHANT_GATE_PROPOSAL_RECORD_NICHT_BEREIT");
  }

  const gate = request.featureGate;
  if (gate.stage !== STAGE) {
    throw new Error("PR21_MERCHANT_GATE_PROPOSAL_STAGE_DRIFT");
  }
  if (gate.cap022FullChainRequired !== false
      || gate.cap022FullChainSatisfied !== true
      || gate.authorityIssued !== false
      || gate.gameplayAuthority !== false
      || gate.rawWriteAuthority !== false
      || gate.normalRuntimeAllowed !== false) {
    throw new Error("PR21_MERCHANT_GATE_PROPOSAL_FEATURE_GATE_BOUNDARY_DRIFT");
  }

  const proposal = bereitePr21_28GateAdvanceVor({
    schemaVersion: 1,
    stage: STAGE,
    currentMainCommit: request.currentMainCommit,
    expectedPackageFingerprint: request.expectedPackageFingerprint,
    ratification: record,
    featureGate: gate,
  });

  return Object.freeze({
    schemaVersion: 1,
    status: proposal.status,
    blocker: Object.freeze([...proposal.blocker]),
    stage: STAGE,
    sourceMainCommit: proposal.sourceMainCommit,
    packageFingerprint: proposal.packageFingerprint,
    ratificationFingerprint: proposal.ratificationFingerprint,
    proposal,
    currentMainMatchedRatificationSource:
      request.currentMainCommit === record.sourceMainCommit,
    packageFingerprintMatched:
      request.expectedPackageFingerprint === record.packageFingerprint,
    featureGateProductiveEligible: gate.productiveEligible,
    separateApplyRequired: true,
    requiresFreshMainCheckAtApply: true,
    gateMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
