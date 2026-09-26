import type { HeadlessSupervisorStatus } from "../operations/headless-supervisor.js";
import type {
  Pr21_28MilestoneObservabilityRequest,
} from "../operations/pr21-28-milestone-observability.js";
import type {
  Pr21MerchantCheckpointAdmission,
} from "./pr21-merchant-checkpoint-admission.js";

export interface Pr21MerchantObserverHandoff {
  readonly schemaVersion: 1;
  readonly status: "OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly sourceMainCommit: string;
  readonly checkpointId: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  readonly segmentId: "pr21-merchant-integration";
  readonly milestoneArt: "MERCHANT_INTEGRATION_15M";
  readonly stage: "PR21";
  readonly minimumDurationSeconds: 900;
  readonly targetDurationSeconds: 900;
  readonly sampleIntervalMs: 5_000;
  readonly maximumSampleGapMs: 15_000;
  readonly expectedSamplesForTarget: 181;
  readonly maximumSamples: number;
  readonly requiredActiveAuthorityIds: readonly ["runtime:merchant"];
  readonly allowedActiveAuthorityIds: readonly ["runtime:merchant"];
  readonly requiredHealthState: "GESUND";
  readonly operationsMustBeCurrent: true;
  readonly operationsResourceMetricsRequired: readonly [
    "ssdIoLatenzMs",
    "ioQueueTiefe",
    "freieBytes"
  ];
  readonly recorderDropsAllowed: 0;
  readonly backpressureAllowed: false;
  readonly abortSignals: readonly string[];
  readonly pr20_9RatificationBasis:
    Pr21MerchantCheckpointAdmission["pr20_9RatificationBasis"];
  readonly manualOverrideEvidence: string | null;
  readonly liveCraftEvidenceSatisfied: boolean;
  readonly manualOverrideExplicitlyDistinguishedFromLiveEvidence: true;
  readonly observerOnly: true;
  readonly observerActionAuthority: false;
  readonly externalRuntimeStartAuthorized: false;
  readonly separateExternalAuthorizationRequired: true;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;
const SEGMENT = "pr21-merchant-integration" as const;
const RUNTIME_AUTHORITY = "runtime:merchant" as const;
const RUNTIME_AUTHORITY_IDS = Object.freeze([RUNTIME_AUTHORITY] as const);

export function bereitePr21MerchantObserverHandoffVor(
  admission: Pr21MerchantCheckpointAdmission,
): Pr21MerchantObserverHandoff {
  const blocker: string[] = [];
  const plan = admission.runnerPlan;
  const segment = plan.segmente[0];
  const runbook = admission.runbook;

  if (admission.schemaVersion !== 1
      || admission.status !== "CHECKPOINT_PREPARED_NO_START_AUTHORITY"
      || admission.blocker.length !== 0) {
    blocker.push("PR21_MERCHANT_OBSERVER_CHECKPOINT_ADMISSION_NICHT_BEREIT");
  }

  if (admission.checkpointId !== CHECKPOINT
      || plan.checkpointId !== CHECKPOINT
      || runbook.checkpointId !== CHECKPOINT) {
    blocker.push("PR21_MERCHANT_OBSERVER_CHECKPOINT_BINDING_DRIFT");
  }

  if (plan.segmente.length !== 1
      || segment?.segmentId !== SEGMENT
      || segment.stage !== "PR21"
      || segment.art !== "MERCHANT_INTEGRATION_15M"
      || segment.minimumDauerSekunden !== 900
      || segment.zielDauerSekunden !== 900
      || segment.sampleIntervallMs !== 5_000
      || segment.maximalerSampleAbstandMs !== 15_000) {
    blocker.push("PR21_MERCHANT_OBSERVER_SAMPLING_BINDING_DRIFT");
  }

  if (runbook.minimumDurationSeconds !== 900
      || runbook.targetDurationSeconds !== 900
      || !runbook.abortSignals.includes("HEALTH_NOT_HEALTHY")
      || !runbook.abortSignals.includes("OPERATIONS_STALE")
      || !runbook.abortSignals.includes("RECORDER_DROPS")
      || !runbook.abortSignals.includes("UNEXPECTED_AUTHORITY")
      || !runbook.abortSignals.includes("THRASH")
      || !runbook.abortSignals.includes("PINGPONG")
      || !runbook.abortSignals.includes("CRITICAL_STARVATION")) {
    blocker.push("PR21_MERCHANT_OBSERVER_RUNBOOK_SIGNAL_DRIFT");
  }

  if (admission.observerOnly !== true
      || admission.externalRuntimeStartAuthorized !== false
      || admission.separateExternalAuthorizationRequired !== true
      || admission.runnerGameplayWrites !== 0
      || admission.runnerPublicFunctionCalls !== 0
      || admission.runnerRawWriteCalls !== 0
      || admission.gameplayAuthority !== false
      || admission.rawWriteAuthority !== false
      || admission.normalRuntimeAllowed !== false
      || plan.observerOnly !== true
      || plan.runnerErteiltKeineAuthority !== true
      || runbook.runnerOwnsGameplayAuthority !== false
      || runbook.normalRuntimeAllowedByRunbook !== false) {
    blocker.push("PR21_MERCHANT_OBSERVER_AUTHORITY_BOUNDARY_DRIFT");
  }

  if (admission.pr20_9RatificationBasis === "MANUAL_DEVELOPMENT_OVERRIDE") {
    if (admission.manualOverrideEvidence === null
        || admission.liveCraftEvidenceSatisfied !== false) {
      blocker.push("PR21_MERCHANT_OBSERVER_MANUAL_OVERRIDE_BINDING_DRIFT");
    }
  } else if (admission.pr20_9RatificationBasis === "LIVE_EVIDENCE") {
    if (admission.manualOverrideEvidence !== null
        || admission.liveCraftEvidenceSatisfied !== true) {
      blocker.push("PR21_MERCHANT_OBSERVER_LIVE_CRAFT_BINDING_DRIFT");
    }
  } else {
    blocker.push("PR21_MERCHANT_OBSERVER_PR20_9_BASIS_UNGUELTIG");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    sourceMainCommit: admission.sourceMainCommit,
    checkpointId: CHECKPOINT,
    segmentId: SEGMENT,
    milestoneArt: "MERCHANT_INTEGRATION_15M",
    stage: "PR21",
    minimumDurationSeconds: 900,
    targetDurationSeconds: 900,
    sampleIntervalMs: 5_000,
    maximumSampleGapMs: 15_000,
    expectedSamplesForTarget: 181,
    maximumSamples: plan.maximaleSamples,
    requiredActiveAuthorityIds: RUNTIME_AUTHORITY_IDS,
    allowedActiveAuthorityIds: RUNTIME_AUTHORITY_IDS,
    requiredHealthState: "GESUND",
    operationsMustBeCurrent: true,
    operationsResourceMetricsRequired: Object.freeze([
      "ssdIoLatenzMs",
      "ioQueueTiefe",
      "freieBytes",
    ]),
    recorderDropsAllowed: 0,
    backpressureAllowed: false,
    abortSignals: Object.freeze([...runbook.abortSignals]),
    pr20_9RatificationBasis: admission.pr20_9RatificationBasis,
    manualOverrideEvidence: admission.manualOverrideEvidence,
    liveCraftEvidenceSatisfied: admission.liveCraftEvidenceSatisfied,
    manualOverrideExplicitlyDistinguishedFromLiveEvidence: true,
    observerOnly: true,
    observerActionAuthority: false,
    externalRuntimeStartAuthorized: false,
    separateExternalAuthorizationRequired: true,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

export function bauePr21MerchantObserverRequest(
  handoff: Pr21MerchantObserverHandoff,
  supervisor: HeadlessSupervisorStatus,
): Pr21_28MilestoneObservabilityRequest {
  if (handoff.schemaVersion !== 1
      || handoff.status !== "OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY"
      || handoff.blocker.length !== 0
      || handoff.observerOnly !== true
      || handoff.observerActionAuthority !== false
      || handoff.externalRuntimeStartAuthorized !== false
      || handoff.gameplayAuthority !== false
      || handoff.rawWriteAuthority !== false
      || handoff.normalRuntimeAllowed !== false) {
    throw new Error("PR21_MERCHANT_OBSERVER_HANDOFF_NICHT_BEREIT");
  }

  return Object.freeze({
    schemaVersion: 1,
    supervisor,
    requiredActiveAuthorityIds: handoff.requiredActiveAuthorityIds,
    allowedActiveAuthorityIds: handoff.allowedActiveAuthorityIds,
  });
}
