import type { Pr21MerchantLivePreflightResult } from "./pr21-merchant-integration-live-preflight.js";
import {
  planePr21_28MilestoneRunner,
  type Pr21_28MilestoneRunnerPlan,
} from "../zertifizierung/pr21-28-milestone-runner.js";
import {
  bauePr21_28CheckpointRunbook,
  type Pr21_28CheckpointRunbook,
} from "../zertifizierung/pr21-28-checkpoint-runbook.js";

export type Pr21MerchantPr20_9RatificationBasis =
  | "LIVE_EVIDENCE"
  | "MANUAL_DEVELOPMENT_OVERRIDE";

export interface Pr21MerchantCheckpointAdmissionRequest {
  readonly schemaVersion: 1;
  readonly sourceMainCommit: string;
  readonly preflight: Pr21MerchantLivePreflightResult;
  readonly pr20_9RatificationBasis: Pr21MerchantPr20_9RatificationBasis;
  readonly manualOverrideEvidence?: string | null;
  readonly liveCraftEvidenceSatisfied: boolean;
}

export interface Pr21MerchantCheckpointAdmission {
  readonly schemaVersion: 1;
  readonly status: "CHECKPOINT_PREPARED_NO_START_AUTHORITY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly sourceMainCommit: string;
  readonly checkpointId: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  readonly runnerPlan: Pr21_28MilestoneRunnerPlan;
  readonly runbook: Pr21_28CheckpointRunbook;
  readonly pr20_9RatificationBasis: Pr21MerchantPr20_9RatificationBasis;
  readonly manualOverrideEvidence: string | null;
  readonly liveCraftEvidenceSatisfied: boolean;
  readonly manualOverrideExplicitlyDistinguishedFromLiveEvidence: true;
  readonly observerOnly: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly separateExternalAuthorizationRequired: true;
  readonly runnerGameplayWrites: 0;
  readonly runnerPublicFunctionCalls: 0;
  readonly runnerRawWriteCalls: 0;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 512) throw new Error(error);
}

export function bereitePr21MerchantCheckpointVor(
  request: Pr21MerchantCheckpointAdmissionRequest,
): Pr21MerchantCheckpointAdmission {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_CHECKPOINT_ADMISSION_SCHEMA_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/.test(request.sourceMainCommit)) {
    throw new Error("PR21_MERCHANT_CHECKPOINT_ADMISSION_MAIN_UNGUELTIG");
  }
  if (request.pr20_9RatificationBasis !== "LIVE_EVIDENCE"
      && request.pr20_9RatificationBasis !== "MANUAL_DEVELOPMENT_OVERRIDE") {
    throw new Error("PR21_MERCHANT_CHECKPOINT_ADMISSION_PR20_9_BASIS_UNGUELTIG");
  }

  const manualOverrideEvidence =
    request.manualOverrideEvidence === undefined
      ? null
      : request.manualOverrideEvidence;

  if (manualOverrideEvidence !== null) {
    text(
      manualOverrideEvidence,
      "PR21_MERCHANT_CHECKPOINT_ADMISSION_OVERRIDE_EVIDENCE_UNGUELTIG",
    );
  }

  const plan = planePr21_28MilestoneRunner(CHECKPOINT);
  const runbook = bauePr21_28CheckpointRunbook(CHECKPOINT);
  const blocker: string[] = [];

  if (request.preflight.schemaVersion !== 1
      || request.preflight.status !== "PRECHECK_BEREIT_NO_START_AUTHORITY"
      || request.preflight.blocker.length !== 0
      || request.preflight.currentMainVerified !== true
      || request.preflight.merchantReadinessSatisfied !== true
      || request.preflight.checkpointBindingSatisfied !== true
      || request.preflight.allPr20StagesRatified !== true
      || request.preflight.missingPr20Stages.length !== 0) {
    blocker.push("PR21_MERCHANT_CHECKPOINT_PREFLIGHT_NICHT_BEREIT");
  }

  if (request.preflight.targetCheckpoint !== CHECKPOINT
      || request.preflight.targetDurationSeconds !== 900) {
    blocker.push("PR21_MERCHANT_CHECKPOINT_PREFLIGHT_BINDING_DRIFT");
  }

  if (runbook.checkpointId !== CHECKPOINT
      || runbook.minimumDurationSeconds !== 900
      || runbook.targetDurationSeconds !== 900
      || runbook.manualRatificationRequired !== true
      || runbook.runnerOwnsGameplayAuthority !== false
      || runbook.runnerGameplayWrites !== 0
      || runbook.runnerPublicFunctionCalls !== 0
      || runbook.runnerRawWriteCalls !== 0
      || runbook.normalRuntimeAllowedByRunbook !== false) {
    blocker.push("PR21_MERCHANT_CHECKPOINT_RUNBOOK_BOUNDARY_DRIFT");
  }

  if (plan.checkpointId !== CHECKPOINT
      || plan.segmente.length !== 1
      || plan.segmente[0]?.stage !== "PR21"
      || plan.segmente[0]?.art !== "MERCHANT_INTEGRATION_15M"
      || plan.segmente[0]?.minimumDauerSekunden !== 900
      || plan.segmente[0]?.zielDauerSekunden !== 900
      || plan.segmente[0]?.sampleIntervallMs !== 5_000
      || plan.observerOnly !== true
      || plan.runnerErteiltKeineAuthority !== true) {
    blocker.push("PR21_MERCHANT_CHECKPOINT_RUNNER_PLAN_DRIFT");
  }

  if (request.preflight.externalRuntimeStartAuthorized !== false
      || request.preflight.runnerOwnsGameplayAuthority !== false
      || request.preflight.gameplayAuthority !== false
      || request.preflight.rawWriteAuthority !== false
      || request.preflight.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_CHECKPOINT_PREFLIGHT_AUTHORITY_DRIFT");
  }

  if (request.pr20_9RatificationBasis === "MANUAL_DEVELOPMENT_OVERRIDE") {
    if (manualOverrideEvidence === null) {
      blocker.push("PR21_MERCHANT_CHECKPOINT_MANUAL_OVERRIDE_EVIDENCE_FEHLT");
    }
    if (request.liveCraftEvidenceSatisfied !== false) {
      blocker.push("PR21_MERCHANT_CHECKPOINT_MANUAL_OVERRIDE_LIVE_EVIDENCE_DRIFT");
    }
  } else {
    if (manualOverrideEvidence !== null) {
      blocker.push("PR21_MERCHANT_CHECKPOINT_LIVE_EVIDENCE_OVERRIDE_EVIDENCE_UNERWARTET");
    }
    if (request.liveCraftEvidenceSatisfied !== true) {
      blocker.push("PR21_MERCHANT_CHECKPOINT_LIVE_CRAFT_EVIDENCE_FEHLT");
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "CHECKPOINT_PREPARED_NO_START_AUTHORITY"
      : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    sourceMainCommit: request.sourceMainCommit,
    checkpointId: CHECKPOINT,
    runnerPlan: plan,
    runbook,
    pr20_9RatificationBasis: request.pr20_9RatificationBasis,
    manualOverrideEvidence,
    liveCraftEvidenceSatisfied: request.liveCraftEvidenceSatisfied,
    manualOverrideExplicitlyDistinguishedFromLiveEvidence: true,
    observerOnly: true,
    externalRuntimeStartAuthorized: false,
    separateExternalAuthorizationRequired: true,
    runnerGameplayWrites: 0,
    runnerPublicFunctionCalls: 0,
    runnerRawWriteCalls: 0,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
