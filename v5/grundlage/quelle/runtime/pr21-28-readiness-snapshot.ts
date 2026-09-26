import type { Pr21_28StageLedger } from "./pr21-28-stage-state-ledger.js";
import type { Pr21_28GateStage } from "./pr21-28-feature-gates.js";
import type { Cap022FoundationChainReadiness } from "./cap022-foundation-chain-readiness.js";

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
  readonly cap022FoundationChain: Cap022FoundationChainReadiness;
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
  readonly cap022FullChainReady: boolean;
  readonly cap022FullChainStatus: "CAP022_FULL_CHAIN_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly cap022FullChainBlocker: readonly string[];
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
  const cap022 = request.cap022FoundationChain;
  if (cap022.schemaVersion !== 1
      || cap022.currentPr20_9RatificationCredit !== false
      || cap022.candidateAcquisitionOrMutationAllowedNow !== false
      || cap022.durableIntentCreated !== false
      || cap022.productiveCraftAuthorityOpened !== false
      || cap022.productiveExecutionAllowed !== false
      || cap022.gameplayAuthority !== false
      || cap022.rawWriteAuthority !== false
      || cap022.normalRuntimeAllowed !== false) {
    throw new Error("PR21_28_READINESS_SNAPSHOT_CAP022_UNGUELTIG");
  }
  const cap022FullChainReady =
    cap022.status === "CAP022_FULL_CHAIN_BEREIT_NO_WRITE"
    && cap022.allRequiredFoundationsPresent === true
    && cap022.allRequiredFoundationsReady === true
    && cap022.blocker.length === 0;
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
    if (!entry.state.gateApplyVerified) {
      missing.push("VERIFIED_GATE_APPLY");
    } else if (!entry.gateSettlementEvidenceSatisfied) {
      missing.push("VERIFIED_GATE_SETTLEMENT");
    }
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
    && request.ledger.highestPreparationCompleteStage === "PR28"
    && cap022FullChainReady;

  const liveEvidenceBoundaryReached =
    preparationThroughPr28Complete
    && request.ledger.allProductiveEligible === false;

  const status =
    request.ledger.allProductiveEligible && cap022FullChainReady
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
    cap022FullChainReady,
    cap022FullChainStatus: cap022.status,
    cap022FullChainBlocker: Object.freeze([...cap022.blocker]),
    gateMutationPerformed: false,
    authorityIssued: false,
    normalRuntimeAllowed: false,
  });
}
