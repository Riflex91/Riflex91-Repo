import type { Pr21_28MilestoneObservabilityResult } from "../operations/pr21-28-milestone-observability.js";
import {
  planePr21_28MilestoneRunner,
  wertePr21_28MilestoneSamplesAus,
  type Pr21_28MilestoneRunnerAuswertung,
} from "../zertifizierung/pr21-28-milestone-runner.js";
import {
  bewertePr21_28LiveEvidence,
  type Pr21_28LiveEvidenceBewertung,
} from "../zertifizierung/pr21-28-live-evidence.js";
import {
  bauePr21_28ResultPackage,
  type Pr21_28ResultPackage,
} from "../zertifizierung/pr21-28-result-package.js";
import {
  bereitePr21_28RatificationVor,
  type Pr21_28RatificationDraft,
} from "../zertifizierung/pr21-28-ratification-record.js";
import type { Pr21MerchantObserverHandoff } from "./pr21-merchant-observer-handoff.js";
import type { Pr21MerchantSampleCollectorState } from "./pr21-merchant-sample-collector.js";

export interface Pr21MerchantFreezeEvaluationRequest {
  readonly schemaVersion: 1;
  readonly sourceMainCommit: string;
  readonly packageId: string;
  readonly createdAtMs: number;
  readonly handoff: Pr21MerchantObserverHandoff;
  readonly collector: Pr21MerchantSampleCollectorState;
  readonly finalObservability: Pr21_28MilestoneObservabilityResult;
}

export interface Pr21MerchantFreezeEvaluationHandoff {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_FOR_EXPLICIT_MANUAL_RATIFICATION"
    | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly checkpointId: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  readonly sourceMainCommit: string;
  readonly packageId: string;
  readonly runner: Pr21_28MilestoneRunnerAuswertung | null;
  readonly evidence: readonly Pr21_28LiveEvidenceBewertung[];
  readonly resultPackage: Pr21_28ResultPackage | null;
  readonly ratificationDraft: Pr21_28RatificationDraft | null;
  readonly sampleSeriesFrozen: true;
  readonly samplesImmutableAtHandoff: true;
  readonly automaticRatification: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
}

export function bereitePr21MerchantFreezeEvaluationHandoffVor(
  request: Pr21MerchantFreezeEvaluationRequest,
): Pr21MerchantFreezeEvaluationHandoff {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_FREEZE_EVAL_SCHEMA_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/.test(request.sourceMainCommit)) {
    throw new Error("PR21_MERCHANT_FREEZE_EVAL_MAIN_UNGUELTIG");
  }
  text(request.packageId, "PR21_MERCHANT_FREEZE_EVAL_PACKAGE_ID_UNGUELTIG");
  if (!Number.isSafeInteger(request.createdAtMs) || request.createdAtMs < 0) {
    throw new Error("PR21_MERCHANT_FREEZE_EVAL_ZEIT_UNGUELTIG");
  }

  const blocker: string[] = [];
  const handoff = request.handoff;
  const collector = request.collector;

  if (handoff.schemaVersion !== 1
      || handoff.status !== "OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY"
      || handoff.blocker.length !== 0
      || handoff.checkpointId !== CHECKPOINT
      || handoff.sourceMainCommit !== request.sourceMainCommit) {
    blocker.push("PR21_MERCHANT_FREEZE_EVAL_HANDOFF_NICHT_BEREIT");
  }

  if (handoff.externalRuntimeStartAuthorized !== false
      || handoff.observerActionAuthority !== false
      || handoff.gameplayAuthority !== false
      || handoff.rawWriteAuthority !== false
      || handoff.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_FREEZE_EVAL_HANDOFF_AUTHORITY_DRIFT");
  }

  if (collector.schemaVersion !== 1
      || collector.status !== "ZIEL_ERREICHT_EINGEFROREN"
      || collector.frozen !== true
      || collector.blocker.length !== 0
      || collector.checkpointId !== CHECKPOINT
      || collector.segmentId !== "pr21-merchant-integration"
      || collector.targetDurationMs !== 900_000
      || collector.dauerMs < 900_000
      || collector.sampleAnzahl !== collector.samples.length
      || collector.sampleAnzahl !== 181
      || collector.samples.length !== 181) {
    blocker.push("PR21_MERCHANT_FREEZE_EVAL_SAMPLE_SERIE_NICHT_BEREIT");
  }

  if (collector.externalRuntimeStartAuthorized !== false
      || collector.collectorGameplayWrites !== 0
      || collector.collectorPublicFunctionCalls !== 0
      || collector.collectorRawWriteCalls !== 0
      || collector.gameplayAuthority !== false
      || collector.rawWriteAuthority !== false
      || collector.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_FREEZE_EVAL_COLLECTOR_BOUNDARY_DRIFT");
  }

  if (request.finalObservability.schemaVersion !== 1
      || request.finalObservability.status !== "BEOBACHTUNG_BEREIT"
      || request.finalObservability.blocker.length !== 0
      || request.finalObservability.authorityLeakCount !== 0
      || request.finalObservability.recorderDrops !== 0
      || request.finalObservability.resourceMetricsComplete !== true
      || request.finalObservability.observerActionAuthority !== false
      || request.finalObservability.gameplayAuthority !== false
      || request.finalObservability.rawWriteAuthority !== false
      || request.finalObservability.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_FREEZE_EVAL_OBSERVABILITY_NICHT_BEREIT");
  }

  if (blocker.length > 0) {
    return Object.freeze({
      schemaVersion: 1,
      status: "BLOCKIERT",
      blocker: Object.freeze([...new Set(blocker)]),
      checkpointId: CHECKPOINT,
      sourceMainCommit: request.sourceMainCommit,
      packageId: request.packageId,
      runner: null,
      evidence: Object.freeze([]),
      resultPackage: null,
      ratificationDraft: null,
      sampleSeriesFrozen: true,
      samplesImmutableAtHandoff: true,
      automaticRatification: false,
      gateMutationPerformed: false,
      authorityIssued: false,
      broadRuntimeGrant: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
  }

  const plan = planePr21_28MilestoneRunner(CHECKPOINT);
  const runner = wertePr21_28MilestoneSamplesAus(
    plan,
    collector.samples,
    { schemaVersion: 1, cap022FullChainReady: true },
  );
  const evidence = Object.freeze(
    runner.evidenceRows.map(row => bewertePr21_28LiveEvidence(row)),
  );

  const resultPackage = bauePr21_28ResultPackage({
    schemaVersion: 1,
    packageId: request.packageId,
    sourceMainCommit: request.sourceMainCommit,
    createdAtMs: request.createdAtMs,
    checkpointId: CHECKPOINT,
    runner,
    observability: request.finalObservability,
    evidence,
  });

  if (runner.status !== "EVIDENCE_READY_TARGET_REACHED"
      || runner.alleMinimaErreicht !== true
      || runner.alleZieleErreicht !== true
      || runner.sampleGaps !== 0
      || runner.segmentReihenfolgeVerletzt !== 0
      || runner.evidenceRatifiedByRunner !== false
      || runner.authorityIssuedByRunner !== false
      || evidence.some(x => x.status !== "EVIDENCE_RATIFIZIERBAR")
      || resultPackage.status !== "READY_FOR_MANUAL_RATIFICATION") {
    return Object.freeze({
      schemaVersion: 1,
      status: "BLOCKIERT",
      blocker: Object.freeze([
        "PR21_MERCHANT_FREEZE_EVAL_RESULT_PACKAGE_NICHT_BEREIT",
      ]),
      checkpointId: CHECKPOINT,
      sourceMainCommit: request.sourceMainCommit,
      packageId: request.packageId,
      runner,
      evidence,
      resultPackage,
      ratificationDraft: null,
      sampleSeriesFrozen: true,
      samplesImmutableAtHandoff: true,
      automaticRatification: false,
      gateMutationPerformed: false,
      authorityIssued: false,
      broadRuntimeGrant: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
  }

  const ratificationDraft = bereitePr21_28RatificationVor(resultPackage);

  return Object.freeze({
    schemaVersion: 1,
    status: "READY_FOR_EXPLICIT_MANUAL_RATIFICATION",
    blocker: Object.freeze([]),
    checkpointId: CHECKPOINT,
    sourceMainCommit: request.sourceMainCommit,
    packageId: request.packageId,
    runner,
    evidence,
    resultPackage,
    ratificationDraft,
    sampleSeriesFrozen: true,
    samplesImmutableAtHandoff: true,
    automaticRatification: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
