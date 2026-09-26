import type { Pr21MerchantIntegrationReadiness } from "./pr21-merchant-integration-readiness.js";
import type { Pr21_28CheckpointRunbook } from "../zertifizierung/pr21-28-checkpoint-runbook.js";
import type { Pr21_28ReadinessSnapshot } from "../runtime/pr21-28-readiness-snapshot.js";

export type Pr20ProductiveRatificationId =
  | "PR20.1" | "PR20.2" | "PR20.3" | "PR20.4" | "PR20.5"
  | "PR20.6" | "PR20.7" | "PR20.8" | "PR20.9";

export interface Pr21MerchantLivePreflightRequest {
  readonly schemaVersion: 1;
  readonly currentMainCommit: string;
  readonly pinnedMainCommit: string;
  readonly merchantReadiness: Pr21MerchantIntegrationReadiness;
  readonly runbook: Pr21_28CheckpointRunbook;
  readonly readinessSnapshot: Pr21_28ReadinessSnapshot;
  readonly ratifiedPr20Stages: readonly Pr20ProductiveRatificationId[];
}

export interface Pr21MerchantLivePreflightResult {
  readonly schemaVersion: 1;
  readonly status: "PRECHECK_BEREIT_NO_START_AUTHORITY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly currentMainVerified: boolean;
  readonly merchantReadinessSatisfied: boolean;
  readonly checkpointBindingSatisfied: boolean;
  readonly allPr20StagesRatified: boolean;
  readonly ratifiedPr20Stages: readonly Pr20ProductiveRatificationId[];
  readonly missingPr20Stages: readonly Pr20ProductiveRatificationId[];
  readonly targetCheckpoint: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  readonly targetDurationSeconds: 900;
  readonly separateExternalAuthorizationRequired: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly runnerOwnsGameplayAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const PR20_STAGES: readonly Pr20ProductiveRatificationId[] = Object.freeze([
  "PR20.1","PR20.2","PR20.3","PR20.4","PR20.5",
  "PR20.6","PR20.7","PR20.8","PR20.9",
]);

function commit(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

export function bewertePr21MerchantLivePreflight(
  request: Pr21MerchantLivePreflightRequest,
): Pr21MerchantLivePreflightResult {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_LIVE_PREFLIGHT_SCHEMA_UNGUELTIG");
  }
  commit(request.currentMainCommit, "PR21_LIVE_PREFLIGHT_CURRENT_MAIN_UNGUELTIG");
  commit(request.pinnedMainCommit, "PR21_LIVE_PREFLIGHT_PINNED_MAIN_UNGUELTIG");

  const seen = new Set<Pr20ProductiveRatificationId>();
  for (const stage of request.ratifiedPr20Stages) {
    if (!PR20_STAGES.includes(stage)) {
      throw new Error("PR21_LIVE_PREFLIGHT_PR20_STAGE_UNBEKANNT");
    }
    if (seen.has(stage)) {
      throw new Error("PR21_LIVE_PREFLIGHT_PR20_STAGE_DOPPELT:" + stage);
    }
    seen.add(stage);
  }

  const blocker: string[] = [];
  const currentMainVerified =
    request.currentMainCommit === request.pinnedMainCommit
    && request.readinessSnapshot.mainCommit === request.currentMainCommit;
  if (!currentMainVerified) blocker.push("PR21_LIVE_PREFLIGHT_MAIN_DRIFT");

  const merchantReadinessSatisfied =
    request.merchantReadiness.schemaVersion === 1
    && request.merchantReadiness.status === "BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE"
    && request.merchantReadiness.blocker.length === 0
    && request.merchantReadiness.liveExecutionAllowed === false
    && request.merchantReadiness.gameplayAuthority === false
    && request.merchantReadiness.rawWriteAuthority === false
    && request.merchantReadiness.normalRuntimeAllowed === false;
  if (!merchantReadinessSatisfied) {
    blocker.push("PR21_LIVE_PREFLIGHT_MERCHANT_READINESS_NICHT_BEREIT");
  }

  const requiredRunbookPreconditions = [
    "CURRENT_MAIN_VERIFIED",
    "CHECKPOINT_PREDECESSOR_PRODUCTIVE_GATE_SATISFIED",
    "REQUIRED_FEATURE_GATES_RATIFIED",
    "NO_OPEN_UNRESOLVED_TRANSACTION",
    "NO_PENDING_SAME_INTENT_RETRY",
    "R11_HEALTH_GREEN",
    "R11_OPERATIONS_CURRENT",
    "EXPECTED_RUNTIME_AUTHORITIES_ONLY",
    "RUNNER_OBSERVER_ONLY",
    "MILESTONE_PLAN_PINNED",
  ];
  const checkpointBindingSatisfied =
    request.runbook.schemaVersion === 1
    && request.runbook.checkpointId === "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT"
    && request.runbook.minimumDurationSeconds === 900
    && request.runbook.targetDurationSeconds === 900
    && request.runbook.cap022FullChainRequired === false
    && request.runbook.manualRatificationRequired === true
    && request.runbook.externalRuntimeOwnsGameplayAuthority === true
    && request.runbook.runnerOwnsGameplayAuthority === false
    && request.runbook.runnerGameplayWrites === 0
    && request.runbook.runnerPublicFunctionCalls === 0
    && request.runbook.runnerRawWriteCalls === 0
    && request.runbook.normalRuntimeAllowedByRunbook === false
    && requiredRunbookPreconditions.every(
      precondition => request.runbook.requiredPreconditions.includes(precondition),
    )
    && request.readinessSnapshot.nextRequiredCheckpoint
      === "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  if (!checkpointBindingSatisfied) {
    blocker.push("PR21_LIVE_PREFLIGHT_CHECKPOINT_BINDING_UNGUELTIG");
  }

  const missingPr20Stages = PR20_STAGES.filter(stage => !seen.has(stage));
  for (const stage of missingPr20Stages) {
    blocker.push("PR21_LIVE_PREFLIGHT_PREDECESSOR_NOT_RATIFIED:" + stage);
  }
  const allPr20StagesRatified = missingPr20Stages.length === 0;

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "PRECHECK_BEREIT_NO_START_AUTHORITY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    currentMainVerified,
    merchantReadinessSatisfied,
    checkpointBindingSatisfied,
    allPr20StagesRatified,
    ratifiedPr20Stages: Object.freeze(
      PR20_STAGES.filter(stage => seen.has(stage)),
    ),
    missingPr20Stages: Object.freeze(missingPr20Stages),
    targetCheckpoint: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    targetDurationSeconds: 900,
    separateExternalAuthorizationRequired: true,
    externalRuntimeStartAuthorized: false,
    runnerOwnsGameplayAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
