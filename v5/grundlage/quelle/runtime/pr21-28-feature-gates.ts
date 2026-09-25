export type Pr21_28GateStage =
  | "PR21" | "PR22" | "PR23" | "PR24"
  | "PR25" | "PR26" | "PR27" | "PR28";

export interface Pr21_28FeatureGateEvidence {
  readonly stage: Pr21_28GateStage;
  readonly foundationPrepared: boolean;
  readonly orchestrationPrepared: boolean;
  readonly cap022FullChainReady: boolean;
  readonly predecessorProductiveComplete: boolean;
  readonly requiredLiveEvidenceRatified: boolean;
  readonly restartReconciliationRatified: boolean;
  readonly safetyViolations: number;
  readonly duplicateIrreversibleEffects: number;
  readonly unresolvedTransactions: number;
}

export interface Pr21_28FeatureGateSicht {
  readonly stage: Pr21_28GateStage;
  readonly productiveEligible: boolean;
  readonly blocker: readonly string[];
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: boolean;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21_28FeatureGateResult {
  readonly schemaVersion: 1;
  readonly stages: readonly Pr21_28FeatureGateSicht[];
  readonly highestProductiveEligibleStage: Pr21_28GateStage | null;
  readonly allThroughPr28Eligible: boolean;
  readonly cap022FullChainRequiredStages: readonly ["PR22", "PR23"];
  readonly authorityIssuedByGateEvaluation: false;
}

const ORDER: readonly Pr21_28GateStage[] = Object.freeze([
  "PR21","PR22","PR23","PR24","PR25","PR26","PR27","PR28",
]);

function count(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

export function bewertePr21_28FeatureGates(
  evidence: readonly Pr21_28FeatureGateEvidence[],
): Pr21_28FeatureGateResult {
  if (evidence.length !== ORDER.length) {
    throw new Error("PR21_28_FEATURE_GATE_EVIDENCE_UNVOLLSTAENDIG");
  }
  const byStage = new Map<Pr21_28GateStage, Pr21_28FeatureGateEvidence>();
  for (const row of evidence) {
    if (!ORDER.includes(row.stage)) throw new Error("PR21_28_FEATURE_GATE_STAGE_UNBEKANNT");
    if (byStage.has(row.stage)) throw new Error("PR21_28_FEATURE_GATE_STAGE_DOPPELT");
    count(row.safetyViolations, "PR21_28_FEATURE_GATE_SAFETY_COUNT_UNGUELTIG");
    count(row.duplicateIrreversibleEffects, "PR21_28_FEATURE_GATE_DUPLICATE_COUNT_UNGUELTIG");
    count(row.unresolvedTransactions, "PR21_28_FEATURE_GATE_UNRESOLVED_COUNT_UNGUELTIG");
    byStage.set(row.stage,row);
  }

  const stages: Pr21_28FeatureGateSicht[] = [];
  let chainOpen = true;
  let highest: Pr21_28GateStage | null = null;

  for (const stage of ORDER) {
    const row = byStage.get(stage);
    if (!row) throw new Error("PR21_28_FEATURE_GATE_STAGE_FEHLT:" + stage);
    const blocker: string[] = [];
    if (!row.foundationPrepared) blocker.push(stage + "_FOUNDATION_FEHLT");
    if (!row.orchestrationPrepared) blocker.push(stage + "_ORCHESTRATION_FEHLT");
    const cap022FullChainRequired = stage === "PR22" || stage === "PR23";
    const cap022FullChainSatisfied =
      !cap022FullChainRequired || row.cap022FullChainReady === true;
    if (!cap022FullChainSatisfied) {
      blocker.push(stage + "_CAP022_FULL_CHAIN_NICHT_BEREIT");
    }
    if (!row.predecessorProductiveComplete) blocker.push(stage + "_PREDECESSOR_NICHT_COMPLETE");
    if (!row.requiredLiveEvidenceRatified) blocker.push(stage + "_LIVE_EVIDENCE_NICHT_RATIFIZIERT");
    if (!row.restartReconciliationRatified) blocker.push(stage + "_RESTART_EVIDENCE_NICHT_RATIFIZIERT");
    if (row.safetyViolations > 0) blocker.push(stage + "_SAFETY_VIOLATION");
    if (row.duplicateIrreversibleEffects > 0) blocker.push(stage + "_DUPLICATE_IRREVERSIBLE_EFFECT");
    if (row.unresolvedTransactions > 0) blocker.push(stage + "_UNRESOLVED_TRANSACTION");
    if (!chainOpen) blocker.push(stage + "_VORGAENGER_KETTE_GESCHLOSSEN");

    const productiveEligible = blocker.length === 0;
    if (productiveEligible) highest = stage;
    else chainOpen = false;

    stages.push(Object.freeze({
      stage,
      productiveEligible,
      blocker:Object.freeze(blocker),
      cap022FullChainRequired,
      cap022FullChainSatisfied,
      authorityIssued:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
    }));
  }

  return Object.freeze({
    schemaVersion:1,
    stages:Object.freeze(stages),
    highestProductiveEligibleStage:highest,
    allThroughPr28Eligible:stages.every(x=>x.productiveEligible),
    cap022FullChainRequiredStages:Object.freeze(["PR22","PR23"] as const),
    authorityIssuedByGateEvaluation:false,
  });
}
