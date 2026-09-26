import type { Pr21_28MilestoneObservabilityResult } from "../operations/pr21-28-milestone-observability.js";
import type { Pr21_28MilestoneSample } from "../zertifizierung/pr21-28-milestone-runner.js";
import type { Pr21MerchantObserverHandoff } from "./pr21-merchant-observer-handoff.js";
import type { Pr21MerchantSampleCollectorState } from "./pr21-merchant-sample-collector.js";
import {
  bereitePr21MerchantFreezeEvaluationHandoffVor,
  type Pr21MerchantFreezeEvaluationHandoff,
} from "./pr21-merchant-freeze-evaluation-handoff.js";

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;
const SEGMENT = "pr21-merchant-integration" as const;
const LIVE_TEST_ID = "pr21-merchant-integration-live-15m-v1-0-2" as const;
const LIVE_VERSION = "1.0.2" as const;
const OBSERVATION_SOURCE = "AIO_V3.__operations" as const;
const EXPECTED_SAMPLES = 181;
const MAXIMUM_SAMPLES = 184;
const TARGET_DURATION_MS = 900_000;
const SAMPLE_INTERVAL_MS = 5_000;
const MAXIMUM_SAMPLE_GAP_MS = 15_000;

export interface Pr21MerchantLiveBrowserSample extends Pr21_28MilestoneSample {
  readonly runtimeAuthorityId?: string | null;
  readonly runtimeRunning?: boolean;
  readonly snapshotAgeMs?: number | null;
  readonly heartbeatAgeMs?: number | null;
  readonly captureErrors?: number;
  readonly reconciliationBlockers?: readonly string[];
  readonly heartbeatType?: string | null;
}

export interface Pr21MerchantLiveEvidenceEnvelope {
  readonly schemaVersion: 1;
  readonly status: "EVIDENCE_READY_TARGET_REACHED" | string;
  readonly checkpointId: string;
  readonly sampleCount: number;
  readonly durationMs: number;
  readonly activeAuthorityIds?: readonly string[];
  readonly observerOnly?: boolean;
  readonly collectorGameplayWrites?: number;
  readonly collectorPublicFunctionCalls?: number;
  readonly collectorRawWriteCalls?: number;
  readonly authorityIssuedByHarness?: boolean;
  readonly externalRuntimeStartAuthorized?: boolean;
  readonly externalRuntimeStartCalls?: number;
  readonly externalRuntimeStopCalls?: number;
  readonly runtimeStartedByCheckpoint?: boolean;
  readonly runtimeWasRunningBeforeCheckpoint?: boolean;
  readonly normalRuntimeAllowed?: boolean;
  readonly observationSource?: string;
}

export interface Pr21MerchantLiveResultSnapshot {
  readonly schemaVersion: 1;
  readonly testId: string;
  readonly version: string;
  readonly checkpointId: string;
  readonly phase: string;
  readonly status: string;
  readonly terminal: boolean;
  readonly blocker: readonly string[];
  readonly samples: readonly Pr21MerchantLiveBrowserSample[];
  readonly sampleCount: number;
  readonly durationMs: number;
  readonly startedAtMs: number | null;
  readonly completedAtMs: number | null;
  readonly evidence: Pr21MerchantLiveEvidenceEnvelope | null;
  readonly gameplayWrites: number;
  readonly publicFunctionCalls: number;
  readonly rawWriteCalls: number;
  readonly sameIntentRetry: boolean;
  readonly normalRuntimeAllowed: boolean;
  readonly authorityIssuedByHarness: boolean;
  readonly externalRuntimeStartAuthorized: boolean;
  readonly observationSource?: string;
}

export interface Pr21MerchantLiveResultFreezeAdapterRequest {
  readonly schemaVersion: 1;
  readonly sourceMainCommit: string;
  readonly packageId: string;
  readonly createdAtMs: number;
  readonly handoff: Pr21MerchantObserverHandoff;
  readonly liveResult: Pr21MerchantLiveResultSnapshot;
  readonly finalObservability: Pr21_28MilestoneObservabilityResult;
}

export interface Pr21MerchantLiveResultFreezeAdapterResult {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_EXPLICIT_MANUAL_RATIFICATION" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly checkpointId: typeof CHECKPOINT;
  readonly liveTestId: typeof LIVE_TEST_ID;
  readonly liveVersion: typeof LIVE_VERSION;
  readonly collector: Pr21MerchantSampleCollectorState | null;
  readonly freezeEvaluation: Pr21MerchantFreezeEvaluationHandoff | null;
  readonly liveEvidenceBound: boolean;
  readonly externalRuntimeAuthorizationObserved: boolean;
  readonly collectorOwnsRuntimeStartAuthority: false;
  readonly automaticRatification: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function zeroCounterSample(sample: Pr21MerchantLiveBrowserSample): boolean {
  return sample.recorderDrops === 0
    && sample.unerwarteteGameplayWrites === 0
    && sample.duplicateIrreversibleEffects === 0
    && sample.safetyViolations === 0
    && sample.sameIntentRetries === 0
    && sample.unresolvedTransactions === 0
    && sample.authorityLeaks === 0
    && sample.restartRecoveryFailures === 0
    && sample.staleEvidenceActions === 0
    && sample.thrashEvents === 0
    && sample.pingpongEvents === 0
    && sample.starvationCriticalCount === 0;
}

function normalizeSamples(
  live: Pr21MerchantLiveResultSnapshot,
  blocker: string[],
): readonly Pr21_28MilestoneSample[] {
  const out: Pr21_28MilestoneSample[] = [];
  let previousObservedAtMs: number | null = null;

  for (let index = 0; index < live.samples.length; index += 1) {
    const sample = live.samples[index];
    const expectedSequence = index + 1;

    if (sample.schemaVersion !== 1
        || sample.sequenz !== expectedSequence
        || !nonNegativeInteger(sample.beobachtetAmMs)
        || sample.segmentId !== SEGMENT
        || sample.healthZustand !== "GESUND"
        || sample.operationsAktuell !== true
        || !zeroCounterSample(sample)
        || sample.runtimeRunning !== true
        || sample.runtimeAuthorityId !== "runtime:merchant"
        || (sample.captureErrors ?? 0) !== 0
        || (sample.reconciliationBlockers?.length ?? 0) !== 0) {
      blocker.push("PR21_MERCHANT_LIVE_RESULT_SAMPLE_UNGUELTIG");
      continue;
    }

    if (previousObservedAtMs !== null) {
      const gapMs = sample.beobachtetAmMs - previousObservedAtMs;
      if (gapMs <= 0 || gapMs > MAXIMUM_SAMPLE_GAP_MS) {
        blocker.push("PR21_MERCHANT_LIVE_RESULT_SAMPLE_GAP_UNGUELTIG");
      }
    }
    previousObservedAtMs = sample.beobachtetAmMs;

    out.push(Object.freeze({
      schemaVersion: 1,
      sequenz: sample.sequenz,
      beobachtetAmMs: sample.beobachtetAmMs,
      segmentId: sample.segmentId,
      healthZustand: sample.healthZustand,
      operationsAktuell: sample.operationsAktuell,
      recorderDrops: sample.recorderDrops,
      unerwarteteGameplayWrites: sample.unerwarteteGameplayWrites,
      duplicateIrreversibleEffects: sample.duplicateIrreversibleEffects,
      safetyViolations: sample.safetyViolations,
      sameIntentRetries: sample.sameIntentRetries,
      unresolvedTransactions: sample.unresolvedTransactions,
      authorityLeaks: sample.authorityLeaks,
      restartRecoveryFailures: sample.restartRecoveryFailures,
      staleEvidenceActions: sample.staleEvidenceActions,
      thrashEvents: sample.thrashEvents,
      pingpongEvents: sample.pingpongEvents,
      starvationCriticalCount: sample.starvationCriticalCount,
    }));
  }

  return Object.freeze(out);
}

function validateLiveEnvelope(
  live: Pr21MerchantLiveResultSnapshot,
  normalizedSamples: readonly Pr21_28MilestoneSample[],
  blocker: string[],
): void {
  if (live.schemaVersion !== 1
      || live.testId !== LIVE_TEST_ID
      || live.version !== LIVE_VERSION
      || live.checkpointId !== CHECKPOINT) {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_BINDING_DRIFT");
  }

  if (live.status !== "BESTANDEN"
      || live.phase !== "COMPLETE"
      || live.terminal !== true
      || live.blocker.length !== 0) {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_NICHT_TERMINAL_BESTANDEN");
  }

  if (live.sampleCount !== EXPECTED_SAMPLES
      || live.samples.length !== EXPECTED_SAMPLES
      || normalizedSamples.length !== EXPECTED_SAMPLES
      || live.durationMs < TARGET_DURATION_MS
      || live.startedAtMs === null
      || live.completedAtMs === null
      || !nonNegativeInteger(live.startedAtMs)
      || !nonNegativeInteger(live.completedAtMs)
      || live.completedAtMs < live.startedAtMs) {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_SAMPLE_SERIE_UNVOLLSTAENDIG");
  }

  const first = normalizedSamples[0];
  const last = normalizedSamples.at(-1);
  if (first === undefined
      || last === undefined
      || last.beobachtetAmMs - first.beobachtetAmMs < TARGET_DURATION_MS) {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_DAUER_UNVOLLSTAENDIG");
  }

  if (live.gameplayWrites !== 0
      || live.publicFunctionCalls !== 0
      || live.rawWriteCalls !== 0
      || live.sameIntentRetry !== false
      || live.normalRuntimeAllowed !== false
      || live.authorityIssuedByHarness !== false
      || live.externalRuntimeStartAuthorized !== true
      || live.observationSource !== OBSERVATION_SOURCE) {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_AUTHORITY_BOUNDARY_DRIFT");
  }

  const evidence = live.evidence;
  if (evidence === null
      || evidence.schemaVersion !== 1
      || evidence.status !== "EVIDENCE_READY_TARGET_REACHED"
      || evidence.checkpointId !== CHECKPOINT
      || evidence.sampleCount !== EXPECTED_SAMPLES
      || evidence.durationMs < TARGET_DURATION_MS
      || evidence.observerOnly !== true
      || evidence.collectorGameplayWrites !== 0
      || evidence.collectorPublicFunctionCalls !== 0
      || evidence.collectorRawWriteCalls !== 0
      || evidence.authorityIssuedByHarness !== false
      || evidence.externalRuntimeStartAuthorized !== true
      || evidence.normalRuntimeAllowed !== false
      || evidence.observationSource !== OBSERVATION_SOURCE
      || evidence.activeAuthorityIds?.length !== 1
      || evidence.activeAuthorityIds[0] !== "runtime:merchant") {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_EVIDENCE_UNGUELTIG");
  }

  if (evidence !== null) {
    const startCalls = evidence.externalRuntimeStartCalls ?? -1;
    const stopCalls = evidence.externalRuntimeStopCalls ?? -1;
    const startedByCheckpoint = evidence.runtimeStartedByCheckpoint === true;
    const wasRunningBefore = evidence.runtimeWasRunningBeforeCheckpoint === true;
    const startShapeValid = startedByCheckpoint
      ? startCalls === 1 && wasRunningBefore === false
      : startCalls === 0 && wasRunningBefore === true;
    const stopShapeValid = startedByCheckpoint ? stopCalls === 1 : stopCalls === 0;
    if (!startShapeValid || !stopShapeValid) {
      blocker.push("PR21_MERCHANT_LIVE_RESULT_RUNTIME_LIFECYCLE_UNGUELTIG");
    }
  }
}

function buildFrozenCollector(
  samples: readonly Pr21_28MilestoneSample[],
): Pr21MerchantSampleCollectorState {
  const first = samples[0];
  const last = samples.at(-1);
  if (first === undefined || last === undefined) {
    throw new Error("PR21_MERCHANT_LIVE_RESULT_SAMPLE_SERIE_FEHLT");
  }
  return Object.freeze({
    schemaVersion: 1,
    status: "ZIEL_ERREICHT_EINGEFROREN",
    blocker: Object.freeze([]),
    checkpointId: CHECKPOINT,
    segmentId: SEGMENT,
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
    maximumSampleGapMs: MAXIMUM_SAMPLE_GAP_MS,
    maximumSamples: MAXIMUM_SAMPLES,
    targetDurationMs: TARGET_DURATION_MS,
    sampleAnzahl: samples.length,
    gestartetAmMs: first.beobachtetAmMs,
    letzterSampleAmMs: last.beobachtetAmMs,
    dauerMs: last.beobachtetAmMs - first.beobachtetAmMs,
    samples,
    frozen: true,
    observerOnly: true,
    externalRuntimeStartAuthorized: false,
    collectorGameplayWrites: 0,
    collectorPublicFunctionCalls: 0,
    collectorRawWriteCalls: 0,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

function blocked(
  blocker: readonly string[],
  collector: Pr21MerchantSampleCollectorState | null = null,
  freezeEvaluation: Pr21MerchantFreezeEvaluationHandoff | null = null,
  externalRuntimeAuthorizationObserved = false,
): Pr21MerchantLiveResultFreezeAdapterResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    checkpointId: CHECKPOINT,
    liveTestId: LIVE_TEST_ID,
    liveVersion: LIVE_VERSION,
    collector,
    freezeEvaluation,
    liveEvidenceBound: false,
    externalRuntimeAuthorizationObserved,
    collectorOwnsRuntimeStartAuthority: false,
    automaticRatification: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

export function adaptierePr21MerchantLiveResultFuerFreezeEvaluation(
  request: Pr21MerchantLiveResultFreezeAdapterRequest,
): Pr21MerchantLiveResultFreezeAdapterResult {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_LIVE_RESULT_ADAPTER_SCHEMA_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/.test(request.sourceMainCommit)) {
    throw new Error("PR21_MERCHANT_LIVE_RESULT_ADAPTER_MAIN_UNGUELTIG");
  }
  if (request.packageId.trim().length === 0 || request.packageId.length > 192) {
    throw new Error("PR21_MERCHANT_LIVE_RESULT_ADAPTER_PACKAGE_ID_UNGUELTIG");
  }
  if (!nonNegativeInteger(request.createdAtMs)) {
    throw new Error("PR21_MERCHANT_LIVE_RESULT_ADAPTER_ZEIT_UNGUELTIG");
  }

  const blocker: string[] = [];
  if (request.handoff.sourceMainCommit !== request.sourceMainCommit
      || request.handoff.status !== "OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY"
      || request.handoff.blocker.length !== 0
      || request.handoff.checkpointId !== CHECKPOINT
      || request.handoff.segmentId !== SEGMENT
      || request.handoff.expectedSamplesForTarget !== EXPECTED_SAMPLES
      || request.handoff.maximumSamples !== MAXIMUM_SAMPLES
      || request.handoff.externalRuntimeStartAuthorized !== false
      || request.handoff.observerActionAuthority !== false
      || request.handoff.gameplayAuthority !== false
      || request.handoff.rawWriteAuthority !== false
      || request.handoff.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_LIVE_RESULT_HANDOFF_DRIFT");
  }

  const samples = normalizeSamples(request.liveResult, blocker);
  validateLiveEnvelope(request.liveResult, samples, blocker);
  const externalRuntimeAuthorizationObserved =
    request.liveResult.externalRuntimeStartAuthorized === true;

  if (blocker.length > 0) {
    return blocked(blocker, null, null, externalRuntimeAuthorizationObserved);
  }

  const collector = buildFrozenCollector(samples);
  const freezeEvaluation = bereitePr21MerchantFreezeEvaluationHandoffVor({
    schemaVersion: 1,
    sourceMainCommit: request.sourceMainCommit,
    packageId: request.packageId,
    createdAtMs: request.createdAtMs,
    handoff: request.handoff,
    collector,
    finalObservability: request.finalObservability,
  });

  if (freezeEvaluation.status !== "READY_FOR_EXPLICIT_MANUAL_RATIFICATION") {
    return blocked(
      freezeEvaluation.blocker.length > 0
        ? freezeEvaluation.blocker
        : ["PR21_MERCHANT_LIVE_RESULT_FREEZE_EVALUATION_NICHT_BEREIT"],
      collector,
      freezeEvaluation,
      externalRuntimeAuthorizationObserved,
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "READY_FOR_EXPLICIT_MANUAL_RATIFICATION",
    blocker: Object.freeze([]),
    checkpointId: CHECKPOINT,
    liveTestId: LIVE_TEST_ID,
    liveVersion: LIVE_VERSION,
    collector,
    freezeEvaluation,
    liveEvidenceBound: true,
    externalRuntimeAuthorizationObserved,
    collectorOwnsRuntimeStartAuthority: false,
    automaticRatification: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
