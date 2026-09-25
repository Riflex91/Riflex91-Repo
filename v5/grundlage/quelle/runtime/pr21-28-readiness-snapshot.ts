import type { Pr21_28StageLedger } from "./pr21-28-stage-state-ledger.js";
import type { Pr21_28GateStage } from "./pr21-28-feature-gates.js";

export type Pr21_28CheckpointState =
  | "NOT_READY"
  | "READY_TO_RUN"
  | "RUNNING"
  | "EVIDENCE_READY"
  | "RATIFIED";

export interface Pr21_28CheckpointReadiness {
  readonly checkpointId:
    | "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT"
    | "POST_PR24_25_GROUP_CHECKPOINT"
    | "POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN";
  readonly state: Pr21_28CheckpointState;
}

export interface Pr21_28ReadinessSnapshotRequest {
  readonly schemaVersion: 1;
  readonly mainCommit: string;
  readonly ledger: Pr21_28StageLedger;
  readonly checkpoints: readonly Pr21_28CheckpointReadiness[];
}

export interface Pr21_28StageReadinessRow {
  readonly stage: Pr21_28GateStage;
  readonly preparationComplete: boolean;
  readonly productiveEligible: boolean;
  readonly missing: readonly string[];
}

export interface Pr21_28ReadinessSnapshot {
  readonly schemaVersion: 1;
  readonly mainCommit: string;
  readonly status:
    | "TECHNICALLY_PREPARED_LIVE_EVIDENCE_PENDING"
    | "PARTIALLY_PREPARED"
    | "PRODUCTIVE_CHAIN_ELIGIBLE";
  readonly stages: readonly Pr21_28StageReadinessRow[];
  readonly checkpoints: readonly Pr21_28CheckpointReadiness[];
  readonly highestPreparationCompleteStage: Pr21_28GateStage | null;
  readonly highestProductiveEligibleStage: Pr21_28GateStage | null;
  readonly nextRequiredCheckpoint: Pr21_28CheckpointReadiness["checkpointId"] | null;
  readonly liveEvidenceBoundaryReached: boolean;
  readonly preparationThroughPr28Complete: boolean;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT_ORDER: readonly Pr21_28CheckpointReadiness["checkpointId"][] = Object.freeze([
  "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
  "POST_PR24_25_GROUP_CHECKPOINT",
  "POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN",
]);

export function bauePr21_28ReadinessSnapshot(
  request: Pr21_28ReadinessSnapshotRequest,
): Pr21_28ReadinessSnapshot {
  if (request.schemaVersion !== 1 || !/^[0-9a-f]{40}$/.test(request.mainCommit)) {
    throw new Error("PR21_28_READINESS_SNAPSHOT_INPUT_UNGUELTIG");
  }
  if (request.ledger.schemaVersion !== 1 || request.ledger.replayOnly !== true) {
    throw new Error("PR21_28_READINESS_SNAPSHOT_LEDGER_UNGUELTIG");
  }
  if (request.checkpoints.length !== CHECKPOINT_ORDER.length) {
    throw new Error("PR21_28_READINESS_SNAPSHOT_CHECKPOINTS_UNVOLLSTAENDIG");
  }

  const byCheckpoint = new Map(request.checkpoints.map(x => [x.checkpointId, x] as const));
  for (const id of CHECKPOINT_ORDER) {
    if (!byCheckpoint.has(id)) throw new Error("PR21_28_READINESS_SNAPSHOT_CHECKPOINT_FEHLT:" + id);
  }

  const stages = request.ledger.entries.map(entry => {
    const missing: string[] = [];
    if (!entry.preparationComplete) missing.push("PREPARATION_INCOMPLETE");
    if (!entry.state.liveEvidenceRatified) missing.push("LIVE_EVIDENCE");
    if (!entry.state.explicitRatificationRecorded) missing.push("EXPLICIT_RATIFICATION");
    if (!entry.state.gateApplyVerified) missing.push("VERIFIED_GATE_APPLY");
    if (!entry.predecessorProductiveComplete) missing.push("PREDECESSOR_CHAIN");

    return Object.freeze({
      stage: entry.stage,
      preparationComplete: entry.preparationComplete,
      productiveEligible: entry.productiveChainEligible,
      missing: Object.freeze(missing),
    });
  });

  const nextRequiredCheckpoint = CHECKPOINT_ORDER
    .map(id => byCheckpoint.get(id))
    .find(row => row !== undefined && row.state !== "RATIFIED")
    ?.checkpointId ?? null;

  const preparationThroughPr28Complete =
    request.ledger.allPreparationComplete
    && request.ledger.highestPreparationCompleteStage === "PR28";

  const liveEvidenceBoundaryReached =
    preparationThroughPr28Complete
    && request.ledger.allProductiveEligible === false;

  const status =
    request.ledger.allProductiveEligible
      ? "PRODUCTIVE_CHAIN_ELIGIBLE"
      : preparationThroughPr28Complete
        ? "TECHNICALLY_PREPARED_LIVE_EVIDENCE_PENDING"
        : "PARTIALLY_PREPARED";

  return Object.freeze({
    schemaVersion: 1,
    mainCommit: request.mainCommit,
    status,
    stages: Object.freeze(stages),
    checkpoints: Object.freeze(CHECKPOINT_ORDER.map(id => byCheckpoint.get(id)!)),
    highestPreparationCompleteStage: request.ledger.highestPreparationCompleteStage,
    highestProductiveEligibleStage: request.ledger.highestProductiveEligibleStage,
    nextRequiredCheckpoint,
    liveEvidenceBoundaryReached,
    preparationThroughPr28Complete,
    gateMutationPerformed: false,
    authorityIssued: false,
    normalRuntimeAllowed: false,
  });
}
