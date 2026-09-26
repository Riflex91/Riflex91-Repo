import type { HeadlessSupervisorStatus } from "../operations/headless-supervisor.js";
import {
  bewertePr21_28MilestoneObservability,
} from "../operations/pr21-28-milestone-observability.js";
import type {
  Pr21_28MilestoneSample,
} from "../zertifizierung/pr21-28-milestone-runner.js";
import {
  bauePr21MerchantObserverRequest,
  type Pr21MerchantObserverHandoff,
} from "./pr21-merchant-observer-handoff.js";

export interface Pr21MerchantSampleCounters {
  readonly unerwarteteGameplayWrites: number;
  readonly duplicateIrreversibleEffects: number;
  readonly safetyViolations: number;
  readonly sameIntentRetries: number;
  readonly unresolvedTransactions: number;
  readonly restartRecoveryFailures: number;
  readonly staleEvidenceActions: number;
  readonly thrashEvents: number;
  readonly pingpongEvents: number;
  readonly starvationCriticalCount: number;
}

export interface Pr21MerchantSampleInput {
  readonly schemaVersion: 1;
  readonly beobachtetAmMs: number;
  readonly supervisor: HeadlessSupervisorStatus;
  readonly counters: Pr21MerchantSampleCounters;
}

export interface Pr21MerchantSampleCollectorState {
  readonly schemaVersion: 1;
  readonly status:
    | "SAMMELBEREIT_NO_START_AUTHORITY"
    | "SAMMELND"
    | "ABGEBROCHEN_FAIL_CLOSED"
    | "ZIEL_ERREICHT_EINGEFROREN";
  readonly blocker: readonly string[];
  readonly checkpointId: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  readonly segmentId: "pr21-merchant-integration";
  readonly sampleIntervalMs: 5_000;
  readonly maximumSampleGapMs: 15_000;
  readonly maximumSamples: number;
  readonly targetDurationMs: 900_000;
  readonly sampleAnzahl: number;
  readonly gestartetAmMs: number | null;
  readonly letzterSampleAmMs: number | null;
  readonly dauerMs: number;
  readonly samples: readonly Pr21_28MilestoneSample[];
  readonly frozen: boolean;
  readonly observerOnly: true;
  readonly externalRuntimeStartAuthorized: false;
  readonly collectorGameplayWrites: 0;
  readonly collectorPublicFunctionCalls: 0;
  readonly collectorRawWriteCalls: 0;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;
const SEGMENT = "pr21-merchant-integration" as const;

function pruefeNichtNegativGanzzahl(
  value: number,
  error: string,
): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function pruefeCounters(counters: Pr21MerchantSampleCounters): void {
  for (const value of [
    counters.unerwarteteGameplayWrites,
    counters.duplicateIrreversibleEffects,
    counters.safetyViolations,
    counters.sameIntentRetries,
    counters.unresolvedTransactions,
    counters.restartRecoveryFailures,
    counters.staleEvidenceActions,
    counters.thrashEvents,
    counters.pingpongEvents,
    counters.starvationCriticalCount,
  ]) {
    pruefeNichtNegativGanzzahl(
      value,
      "PR21_MERCHANT_SAMPLE_COUNTER_UNGUELTIG",
    );
  }
}

function runtimeCounterBlocker(
  counters: Pr21MerchantSampleCounters,
): readonly string[] {
  const blocker: string[] = [];
  if (counters.unerwarteteGameplayWrites > 0) {
    blocker.push("UNEXPECTED_GAMEPLAY_WRITE");
  }
  if (counters.duplicateIrreversibleEffects > 0) {
    blocker.push("DUPLICATE_IRREVERSIBLE_EFFECT");
  }
  if (counters.safetyViolations > 0) {
    blocker.push("SAFETY_VIOLATION");
  }
  if (counters.sameIntentRetries > 0) {
    blocker.push("SAME_INTENT_RETRY");
  }
  if (counters.unresolvedTransactions > 0) {
    blocker.push("UNRESOLVED_TRANSACTION");
  }
  if (counters.restartRecoveryFailures > 0) {
    blocker.push("RESTART_RECOVERY_FAILURE");
  }
  if (counters.staleEvidenceActions > 0) {
    blocker.push("STALE_EVIDENCE_ACTION");
  }
  if (counters.thrashEvents > 0) blocker.push("THRASH");
  if (counters.pingpongEvents > 0) blocker.push("PINGPONG");
  if (counters.starvationCriticalCount > 0) {
    blocker.push("CRITICAL_STARVATION");
  }
  return Object.freeze(blocker);
}

function freezeState(
  state: Omit<Pr21MerchantSampleCollectorState, "samples" | "blocker"> & {
    readonly samples: readonly Pr21_28MilestoneSample[];
    readonly blocker: readonly string[];
  },
): Pr21MerchantSampleCollectorState {
  return Object.freeze({
    ...state,
    blocker: Object.freeze([...state.blocker]),
    samples: Object.freeze([...state.samples]),
  });
}

export function initialisierePr21MerchantSampleCollector(
  handoff: Pr21MerchantObserverHandoff,
): Pr21MerchantSampleCollectorState {
  const blocker: string[] = [];
  if (handoff.schemaVersion !== 1
      || handoff.status !== "OBSERVER_HANDOFF_PREPARED_NO_START_AUTHORITY"
      || handoff.blocker.length !== 0) {
    blocker.push("PR21_MERCHANT_SAMPLE_OBSERVER_HANDOFF_NICHT_BEREIT");
  }
  if (handoff.checkpointId !== CHECKPOINT
      || handoff.segmentId !== SEGMENT
      || handoff.sampleIntervalMs !== 5_000
      || handoff.maximumSampleGapMs !== 15_000
      || handoff.targetDurationSeconds !== 900
      || handoff.maximumSamples !== 184) {
    blocker.push("PR21_MERCHANT_SAMPLE_BOUNDARY_DRIFT");
  }
  if (handoff.observerOnly !== true
      || handoff.observerActionAuthority !== false
      || handoff.externalRuntimeStartAuthorized !== false
      || handoff.gameplayAuthority !== false
      || handoff.rawWriteAuthority !== false
      || handoff.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_SAMPLE_AUTHORITY_BOUNDARY_DRIFT");
  }

  return freezeState({
    schemaVersion: 1,
    status: blocker.length === 0
      ? "SAMMELBEREIT_NO_START_AUTHORITY"
      : "ABGEBROCHEN_FAIL_CLOSED",
    blocker,
    checkpointId: CHECKPOINT,
    segmentId: SEGMENT,
    sampleIntervalMs: 5_000,
    maximumSampleGapMs: 15_000,
    maximumSamples: handoff.maximumSamples,
    targetDurationMs: 900_000,
    sampleAnzahl: 0,
    gestartetAmMs: null,
    letzterSampleAmMs: null,
    dauerMs: 0,
    samples: [],
    frozen: blocker.length > 0,
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

export function sammlePr21MerchantSample(
  state: Pr21MerchantSampleCollectorState,
  handoff: Pr21MerchantObserverHandoff,
  input: Pr21MerchantSampleInput,
): Pr21MerchantSampleCollectorState {
  if (state.schemaVersion !== 1 || input.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_SAMPLE_SCHEMA_UNGUELTIG");
  }
  if (state.frozen) {
    throw new Error("PR21_MERCHANT_SAMPLE_COLLECTOR_EINGEFROREN");
  }
  pruefeNichtNegativGanzzahl(
    input.beobachtetAmMs,
    "PR21_MERCHANT_SAMPLE_ZEIT_UNGUELTIG",
  );
  pruefeCounters(input.counters);

  if (state.samples.length >= state.maximumSamples) {
    return freezeState({
      ...state,
      status: "ABGEBROCHEN_FAIL_CLOSED",
      blocker: ["PR21_MERCHANT_SAMPLE_LIMIT_VOR_ZIEL"],
      frozen: true,
    });
  }

  if (state.letzterSampleAmMs !== null
      && input.beobachtetAmMs <= state.letzterSampleAmMs) {
    return freezeState({
      ...state,
      status: "ABGEBROCHEN_FAIL_CLOSED",
      blocker: ["PR21_MERCHANT_SAMPLE_ZEIT_NICHT_MONOTON"],
      frozen: true,
    });
  }

  const observerRequest = bauePr21MerchantObserverRequest(
    handoff,
    input.supervisor,
  );
  const observability = bewertePr21_28MilestoneObservability(observerRequest);
  const gapMs = state.letzterSampleAmMs === null
    ? 0
    : input.beobachtetAmMs - state.letzterSampleAmMs;
  const zeitBlocker = gapMs > state.maximumSampleGapMs
    ? ["SAMPLE_GAPS"]
    : [];

  const sample: Pr21_28MilestoneSample = Object.freeze({
    schemaVersion: 1,
    sequenz: state.samples.length + 1,
    beobachtetAmMs: input.beobachtetAmMs,
    segmentId: state.segmentId,
    healthZustand: input.supervisor.health.zustand,
    operationsAktuell: input.supervisor.operationsAktuell,
    recorderDrops: observability.recorderDrops,
    unerwarteteGameplayWrites: input.counters.unerwarteteGameplayWrites,
    duplicateIrreversibleEffects: input.counters.duplicateIrreversibleEffects,
    safetyViolations: input.counters.safetyViolations,
    sameIntentRetries: input.counters.sameIntentRetries,
    unresolvedTransactions: input.counters.unresolvedTransactions,
    authorityLeaks: observability.authorityLeakCount,
    restartRecoveryFailures: input.counters.restartRecoveryFailures,
    staleEvidenceActions: input.counters.staleEvidenceActions,
    thrashEvents: input.counters.thrashEvents,
    pingpongEvents: input.counters.pingpongEvents,
    starvationCriticalCount: input.counters.starvationCriticalCount,
  });

  const samples = Object.freeze([...state.samples, sample]);
  const gestartetAmMs = state.gestartetAmMs ?? input.beobachtetAmMs;
  const dauerMs = input.beobachtetAmMs - gestartetAmMs;
  const blocker = Object.freeze([
    ...new Set([
      ...observability.blocker,
      ...zeitBlocker,
      ...runtimeCounterBlocker(input.counters),
    ]),
  ]);
  const targetReached = dauerMs >= state.targetDurationMs;
  const sampleLimitReached = samples.length >= state.maximumSamples;

  if (blocker.length > 0) {
    return freezeState({
      ...state,
      status: "ABGEBROCHEN_FAIL_CLOSED",
      blocker,
      sampleAnzahl: samples.length,
      gestartetAmMs,
      letzterSampleAmMs: input.beobachtetAmMs,
      dauerMs,
      samples,
      frozen: true,
    });
  }

  if (targetReached) {
    return freezeState({
      ...state,
      status: "ZIEL_ERREICHT_EINGEFROREN",
      blocker: [],
      sampleAnzahl: samples.length,
      gestartetAmMs,
      letzterSampleAmMs: input.beobachtetAmMs,
      dauerMs,
      samples,
      frozen: true,
    });
  }

  if (sampleLimitReached) {
    return freezeState({
      ...state,
      status: "ABGEBROCHEN_FAIL_CLOSED",
      blocker: ["PR21_MERCHANT_SAMPLE_LIMIT_VOR_ZIEL"],
      sampleAnzahl: samples.length,
      gestartetAmMs,
      letzterSampleAmMs: input.beobachtetAmMs,
      dauerMs,
      samples,
      frozen: true,
    });
  }

  return freezeState({
    ...state,
    status: "SAMMELND",
    blocker: [],
    sampleAnzahl: samples.length,
    gestartetAmMs,
    letzterSampleAmMs: input.beobachtetAmMs,
    dauerMs,
    samples,
    frozen: false,
  });
}
