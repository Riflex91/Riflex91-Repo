import type { Pr21_28FeatureGateSicht, Pr21_28GateStage } from "../runtime/pr21-28-feature-gates.js";
import type { Pr21_28RatificationRecord } from "../zertifizierung/pr21-28-ratification-record.js";

export interface Pr21_28GateAdvanceProposalRequest {
  readonly schemaVersion: 1;
  readonly stage: Pr21_28GateStage;
  readonly currentMainCommit: string;
  readonly expectedPackageFingerprint: string;
  readonly ratification: Pr21_28RatificationRecord;
  readonly featureGate: Pr21_28FeatureGateSicht;
}

export interface Pr21_28GateAdvanceProposal {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_GATE_APPLY" | "BLOCKIERT";
  readonly stage: Pr21_28GateStage;
  readonly blocker: readonly string[];
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly featureGateProductiveEligible: boolean;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: boolean;
  readonly requiresFreshMainCheckAtApply: true;
  readonly separateApplyRequired: true;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly gesamtfreigabeRequiredSeparately: true;
}

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

export function bereitePr21_28GateAdvanceVor(
  request: Pr21_28GateAdvanceProposalRequest,
): Pr21_28GateAdvanceProposal {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_28_GATE_ADVANCE_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit, "PR21_28_GATE_ADVANCE_MAIN_UNGUELTIG");
  fp16(
    request.expectedPackageFingerprint,
    "PR21_28_GATE_ADVANCE_PACKAGE_FP_UNGUELTIG",
  );

  const ratification = request.ratification;
  if (ratification.schemaVersion !== 1
      || ratification.status !== "RATIFIED_RECORD_ONLY"
      || ratification.ratified !== true
      || ratification.gateAdvanced !== false
      || ratification.authorityIssued !== false
      || ratification.broadRuntimeGrant !== false
      || ratification.gesamtfreigabeRequiredSeparately !== true
      || !/^[0-9a-f]{16}$/.test(ratification.ratificationFingerprint)) {
    throw new Error("PR21_28_GATE_ADVANCE_RATIFICATION_UNGUELTIG");
  }

  const gate = request.featureGate;
  if (gate.stage !== request.stage) {
    throw new Error("PR21_28_GATE_ADVANCE_STAGE_DRIFT");
  }
  if (gate.authorityIssued !== false
      || gate.gameplayAuthority !== false
      || gate.rawWriteAuthority !== false
      || gate.normalRuntimeAllowed !== false) {
    throw new Error("PR21_28_GATE_ADVANCE_GATE_BOUNDARY_UNSAFE");
  }

  const blocker: string[] = [];
  if (request.currentMainCommit !== ratification.sourceMainCommit) {
    blocker.push("PR21_28_GATE_ADVANCE_MAIN_STALE");
  }
  if (request.expectedPackageFingerprint !== ratification.packageFingerprint) {
    blocker.push("PR21_28_GATE_ADVANCE_PACKAGE_FP_DRIFT");
  }
  const cap022FullChainRequired =
    request.stage === "PR22" || request.stage === "PR23";
  if (gate.cap022FullChainRequired !== cap022FullChainRequired) {
    blocker.push("PR21_28_GATE_ADVANCE_CAP022_REQUIREMENT_DRIFT");
  }
  if (gate.cap022FullChainSatisfied !== true) {
    blocker.push("PR21_28_GATE_ADVANCE_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }
  if (!gate.productiveEligible) {
    blocker.push("PR21_28_GATE_ADVANCE_FEATURE_GATE_NICHT_ELIGIBLE");
  }
  if (gate.blocker.length > 0) {
    blocker.push("PR21_28_GATE_ADVANCE_FEATURE_GATE_BLOCKER_OFFEN");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "READY_FOR_SEPARATE_GATE_APPLY"
      : "BLOCKIERT",
    stage: request.stage,
    blocker: Object.freeze([...new Set(blocker)]),
    sourceMainCommit: ratification.sourceMainCommit,
    packageFingerprint: ratification.packageFingerprint,
    ratificationFingerprint: ratification.ratificationFingerprint,
    featureGateProductiveEligible: gate.productiveEligible,
    cap022FullChainRequired,
    cap022FullChainSatisfied: gate.cap022FullChainSatisfied,
    requiresFreshMainCheckAtApply: true,
    separateApplyRequired: true,
    gateMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    gesamtfreigabeRequiredSeparately: true,
  });
}
