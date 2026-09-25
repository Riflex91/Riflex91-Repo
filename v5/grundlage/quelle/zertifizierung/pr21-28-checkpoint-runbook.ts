import {
  planePr21_28MilestoneRunner,
  type Pr21_28CheckpointId,
} from "./pr21-28-milestone-runner.js";

export type Pr21_28RunbookPhase =
  | "PRECHECK"
  | "OBSERVABILITY_ARMED"
  | "RUN_EXTERNAL_RUNTIME"
  | "COLLECT_SAMPLES"
  | "STOP_AND_FREEZE"
  | "EVALUATE"
  | "PACKAGE"
  | "MANUAL_RATIFICATION";

export interface Pr21_28RunbookStep {
  readonly order: number;
  readonly phase: Pr21_28RunbookPhase;
  readonly instructionId: string;
  readonly requiresProductiveWriteFromRunner: false;
  readonly failClosed: boolean;
}

export interface Pr21_28CheckpointRunbook {
  readonly schemaVersion: 1;
  readonly checkpointId: Pr21_28CheckpointId;
  readonly steps: readonly Pr21_28RunbookStep[];
  readonly requiredPreconditions: readonly string[];
  readonly abortSignals: readonly string[];
  readonly completionArtifacts: readonly string[];
  readonly minimumDurationSeconds: number;
  readonly targetDurationSeconds: number;
  readonly cap022FullChainRequired: boolean;
  readonly manualRatificationRequired: true;
  readonly externalRuntimeOwnsGameplayAuthority: true;
  readonly runnerOwnsGameplayAuthority: false;
  readonly runnerGameplayWrites: 0;
  readonly runnerPublicFunctionCalls: 0;
  readonly runnerRawWriteCalls: 0;
  readonly normalRuntimeAllowedByRunbook: false;
}

const ABORT_SIGNALS = Object.freeze([
  "HEALTH_NOT_HEALTHY",
  "OPERATIONS_STALE",
  "RECORDER_DROPS",
  "SAMPLE_GAPS",
  "UNEXPECTED_GAMEPLAY_WRITE",
  "DUPLICATE_IRREVERSIBLE_EFFECT",
  "SAFETY_VIOLATION",
  "SAME_INTENT_RETRY",
  "UNRESOLVED_TRANSACTION",
  "AUTHORITY_LEAK",
  "RESTART_RECOVERY_FAILURE",
  "STALE_EVIDENCE_ACTION",
  "THRASH",
  "PINGPONG",
  "CRITICAL_STARVATION",
  "UNEXPECTED_AUTHORITY",
]);

function step(
  order: number,
  phase: Pr21_28RunbookPhase,
  instructionId: string,
  failClosed: boolean,
): Pr21_28RunbookStep {
  return Object.freeze({
    order,
    phase,
    instructionId,
    requiresProductiveWriteFromRunner: false,
    failClosed,
  });
}

export function bauePr21_28CheckpointRunbook(
  checkpointId: Pr21_28CheckpointId,
): Pr21_28CheckpointRunbook {
  const plan = planePr21_28MilestoneRunner(checkpointId);
  const minimumDurationSeconds = plan.segmente.reduce(
    (sum, segment) => sum + segment.minimumDauerSekunden,
    0,
  );
  const targetDurationSeconds = plan.segmente.reduce(
    (sum, segment) => sum + segment.zielDauerSekunden,
    0,
  );

  const requiredPreconditions = Object.freeze([
    "CURRENT_MAIN_VERIFIED",
    "CHECKPOINT_PREDECESSOR_PRODUCTIVE_GATE_SATISFIED",
    "REQUIRED_FEATURE_GATES_RATIFIED",
    ...(plan.cap022FullChainRequired ? ["CAP022_FULL_CHAIN_READY"] : []),
    "NO_OPEN_UNRESOLVED_TRANSACTION",
    "NO_PENDING_SAME_INTENT_RETRY",
    "R11_HEALTH_GREEN",
    "R11_OPERATIONS_CURRENT",
    "EXPECTED_RUNTIME_AUTHORITIES_ONLY",
    "RUNNER_OBSERVER_ONLY",
    "MILESTONE_PLAN_PINNED",
  ]);

  const completionArtifacts = Object.freeze([
    "MILESTONE_RUNNER_EVALUATION",
    "LIVE_EVIDENCE_EVALUATIONS",
    "OBSERVABILITY_SUMMARY",
    "IMMUTABLE_RESULT_PACKAGE",
    "MANUAL_RATIFICATION_DECISION",
  ]);

  const steps = Object.freeze([
    step(1, "PRECHECK", "VERIFY_MAIN_AND_PREDECESSOR_GATES", true),
    step(2, "PRECHECK", "VERIFY_NO_OPEN_IRREVERSIBLE_OR_RETRY_STATE", true),
    step(3, "OBSERVABILITY_ARMED", "ARM_R11_HEALTH_OPERATIONS_AUTHORITY_OBSERVER", true),
    step(4, "RUN_EXTERNAL_RUNTIME", "START_EXTERNALLY_AUTHORIZED_RUNTIME_ONLY", true),
    step(5, "COLLECT_SAMPLES", "COLLECT_BOUNDED_MILESTONE_SAMPLES", true),
    step(6, "COLLECT_SAMPLES", "ABORT_IMMEDIATELY_ON_FAIL_CLOSED_SIGNAL", true),
    step(7, "STOP_AND_FREEZE", "STOP_AT_MINIMUM_OR_TARGET_AND_FREEZE_SAMPLES", true),
    step(8, "EVALUATE", "RUN_MILESTONE_AND_LIVE_EVIDENCE_EVALUATORS", true),
    step(9, "PACKAGE", "BUILD_IMMUTABLE_RESULT_PACKAGE", true),
    step(10, "MANUAL_RATIFICATION", "RATIFY_SEPARATELY_BEFORE_ANY_GATE_ADVANCE", true),
  ]);

  return Object.freeze({
    schemaVersion: 1,
    checkpointId,
    steps,
    requiredPreconditions,
    abortSignals: ABORT_SIGNALS,
    completionArtifacts,
    minimumDurationSeconds,
    targetDurationSeconds,
    cap022FullChainRequired: plan.cap022FullChainRequired,
    manualRatificationRequired: true,
    externalRuntimeOwnsGameplayAuthority: true,
    runnerOwnsGameplayAuthority: false,
    runnerGameplayWrites: 0,
    runnerPublicFunctionCalls: 0,
    runnerRawWriteCalls: 0,
    normalRuntimeAllowedByRunbook: false,
  });
}
