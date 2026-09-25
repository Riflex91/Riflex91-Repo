import type { HealthZustand } from "../operations/health.js";
import type {
  Pr21_28CheckpointArt,
  Pr21_28LiveEvidenceRow,
} from "./pr21-28-live-evidence.js";

export type Pr21_28CheckpointId =
  | "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT"
  | "POST_PR24_25_GROUP_CHECKPOINT"
  | "POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN";

export interface Pr21_28MilestoneSegmentPlan {
  readonly segmentId: string;
  readonly art: Pr21_28CheckpointArt;
  readonly stage: Pr21_28LiveEvidenceRow["stage"];
  readonly minimumDauerSekunden: number;
  readonly zielDauerSekunden: number;
  readonly sampleIntervallMs: number;
  readonly maximalerSampleAbstandMs: number;
}

export interface Pr21_28MilestoneRunnerPlan {
  readonly schemaVersion: 1;
  readonly checkpointId: Pr21_28CheckpointId;
  readonly segmente: readonly Pr21_28MilestoneSegmentPlan[];
  readonly maximaleSamples: number;
  readonly cap022FullChainRequired: boolean;
  readonly runtimeMussSeparatAutorisiertSein: true;
  readonly runnerErteiltKeineAuthority: true;
  readonly observerOnly: true;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21_28MilestoneSample {
  readonly schemaVersion: 1;
  readonly sequenz: number;
  readonly beobachtetAmMs: number;
  readonly segmentId: string;
  readonly healthZustand: HealthZustand;
  readonly operationsAktuell: boolean;
  readonly recorderDrops: number;
  readonly unerwarteteGameplayWrites: number;
  readonly duplicateIrreversibleEffects: number;
  readonly safetyViolations: number;
  readonly sameIntentRetries: number;
  readonly unresolvedTransactions: number;
  readonly authorityLeaks: number;
  readonly restartRecoveryFailures: number;
  readonly staleEvidenceActions: number;
  readonly thrashEvents: number;
  readonly pingpongEvents: number;
  readonly starvationCriticalCount: number;
}

export interface Pr21_28MilestoneEvaluationPrerequisites {
  readonly schemaVersion: 1;
  readonly cap022FullChainReady: boolean;
}

export interface Pr21_28MilestoneRunnerAuswertung {
  readonly schemaVersion: 1;
  readonly checkpointId: Pr21_28CheckpointId;
  readonly status:
    | "BLOCKIERT"
    | "EVIDENCE_READY_MINIMUM_REACHED"
    | "EVIDENCE_READY_TARGET_REACHED";
  readonly blocker: readonly string[];
  readonly sampleAnzahl: number;
  readonly sampleGaps: number;
  readonly segmentReihenfolgeVerletzt: number;
  readonly evidenceRows: readonly Pr21_28LiveEvidenceRow[];
  readonly alleMinimaErreicht: boolean;
  readonly alleZieleErreicht: boolean;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: boolean;
  readonly runnerGameplayWrites: 0;
  readonly runnerPublicFunctionCalls: 0;
  readonly runnerRawWriteCalls: 0;
  readonly evidenceRatifiedByRunner: false;
  readonly authorityIssuedByRunner: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function segment(
  segmentId: string,
  art: Pr21_28CheckpointArt,
  stage: Pr21_28LiveEvidenceRow["stage"],
  minimumDauerSekunden: number,
  zielDauerSekunden: number,
  sampleIntervallMs: number,
): Pr21_28MilestoneSegmentPlan {
  return Object.freeze({
    segmentId,
    art,
    stage,
    minimumDauerSekunden,
    zielDauerSekunden,
    sampleIntervallMs,
    maximalerSampleAbstandMs: sampleIntervallMs * 3,
  });
}

export function planePr21_28MilestoneRunner(
  checkpointId: Pr21_28CheckpointId,
): Pr21_28MilestoneRunnerPlan {
  const segmente =
    checkpointId === "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT"
      ? Object.freeze([
          segment("pr21-merchant-integration", "MERCHANT_INTEGRATION_15M", "PR21", 900, 900, 5_000),
        ])
      : checkpointId === "POST_PR24_25_GROUP_CHECKPOINT"
        ? Object.freeze([
            segment("pr23-capability", "CAPABILITY_5M", "PR23", 300, 300, 5_000),
            segment("pr25-group-integration", "GROUP_INTEGRATION_15M", "PR25", 900, 900, 5_000),
          ])
        : checkpointId === "POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN"
          ? Object.freeze([
              segment("pr28-full-integration", "FULL_INTEGRATION_MULTI_HOUR", "PR28", 7_200, 10_800, 10_000),
            ])
          : (() => { throw new Error("PR21_28_MILESTONE_CHECKPOINT_UNBEKANNT"); })();

  const maximaleSamples = segmente.reduce(
    (sum, x) => sum + Math.ceil((x.zielDauerSekunden * 1_000) / x.sampleIntervallMs) + 4,
    0,
  );

  return Object.freeze({
    schemaVersion: 1,
    checkpointId,
    segmente,
    maximaleSamples,
    cap022FullChainRequired: segmente.some(
      x => x.stage === "PR22" || x.stage === "PR23",
    ),
    runtimeMussSeparatAutorisiertSein: true,
    runnerErteiltKeineAuthority: true,
    observerOnly: true,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function zaehler(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function summe(
  rows: readonly Pr21_28MilestoneSample[],
  key: keyof Pick<
    Pr21_28MilestoneSample,
    | "unerwarteteGameplayWrites"
    | "duplicateIrreversibleEffects"
    | "safetyViolations"
    | "sameIntentRetries"
    | "unresolvedTransactions"
    | "authorityLeaks"
    | "restartRecoveryFailures"
    | "staleEvidenceActions"
    | "thrashEvents"
    | "pingpongEvents"
    | "starvationCriticalCount"
  >,
): number {
  return rows.reduce((sum, row) => sum + row[key], 0);
}

export function wertePr21_28MilestoneSamplesAus(
  plan: Pr21_28MilestoneRunnerPlan,
  samples: readonly Pr21_28MilestoneSample[],
  prerequisites: Pr21_28MilestoneEvaluationPrerequisites,
): Pr21_28MilestoneRunnerAuswertung {
  if (plan.schemaVersion !== 1
      || plan.segmente.length < 1
      || plan.segmente.length > 16
      || samples.length < 2
      || samples.length > plan.maximaleSamples
      || prerequisites.schemaVersion !== 1) {
    throw new Error("PR21_28_MILESTONE_RUNNER_INPUT_UNGUELTIG");
  }

  const cap022FullChainSatisfied =
    !plan.cap022FullChainRequired || prerequisites.cap022FullChainReady === true;

  const segmentIndex = new Map(
    plan.segmente.map((x, index) => [x.segmentId, index] as const),
  );
  const blocker: string[] = [];
  if (!cap022FullChainSatisfied) {
    blocker.push("PR21_28_MILESTONE_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }
  let sampleGaps = 0;
  let segmentReihenfolgeVerletzt = 0;
  let letzterSegmentIndex = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const row = samples[index];
    if (row === undefined || row.schemaVersion !== 1) {
      throw new Error("PR21_28_MILESTONE_SAMPLE_UNGUELTIG");
    }
    text(row.segmentId, "PR21_28_MILESTONE_SEGMENT_ID_UNGUELTIG");
    if (!Number.isSafeInteger(row.sequenz)
        || row.sequenz !== index + 1
        || !Number.isSafeInteger(row.beobachtetAmMs)
        || row.beobachtetAmMs < 0) {
      throw new Error("PR21_28_MILESTONE_SAMPLE_KOPF_UNGUELTIG");
    }
    for (const value of [
      row.recorderDrops,
      row.unerwarteteGameplayWrites,
      row.duplicateIrreversibleEffects,
      row.safetyViolations,
      row.sameIntentRetries,
      row.unresolvedTransactions,
      row.authorityLeaks,
      row.restartRecoveryFailures,
      row.staleEvidenceActions,
      row.thrashEvents,
      row.pingpongEvents,
      row.starvationCriticalCount,
    ]) zaehler(value, "PR21_28_MILESTONE_SAMPLE_ZAEHLER_UNGUELTIG");

    const currentSegmentIndex = segmentIndex.get(row.segmentId);
    if (currentSegmentIndex === undefined) {
      blocker.push("PR21_28_MILESTONE_UNBEKANNTES_SEGMENT:" + row.segmentId);
      continue;
    }
    if (currentSegmentIndex < letzterSegmentIndex) {
      segmentReihenfolgeVerletzt += 1;
    } else {
      letzterSegmentIndex = currentSegmentIndex;
    }

    const vorher = index === 0 ? undefined : samples[index - 1];
    if (vorher !== undefined) {
      if (row.beobachtetAmMs <= vorher.beobachtetAmMs) {
        throw new Error("PR21_28_MILESTONE_SAMPLE_ZEIT_NICHT_MONOTON");
      }
      const gap = row.beobachtetAmMs - vorher.beobachtetAmMs;
      const gapLimit = plan.segmente[currentSegmentIndex]?.maximalerSampleAbstandMs ?? 0;
      if (gap > gapLimit) sampleGaps += 1;
    }

    if (row.healthZustand !== "GESUND") blocker.push("PR21_28_MILESTONE_HEALTH_NICHT_GESUND");
    if (!row.operationsAktuell) blocker.push("PR21_28_MILESTONE_OPERATIONS_STALE");
    if (row.recorderDrops > 0) blocker.push("PR21_28_MILESTONE_RECORDER_DROPS");
    if (row.unerwarteteGameplayWrites > 0) blocker.push("PR21_28_MILESTONE_UNERWARTETER_WRITE");
    if (row.duplicateIrreversibleEffects > 0) blocker.push("PR21_28_MILESTONE_DUPLICATE_EFFECT");
    if (row.safetyViolations > 0) blocker.push("PR21_28_MILESTONE_SAFETY_VIOLATION");
    if (row.sameIntentRetries > 0) blocker.push("PR21_28_MILESTONE_SAME_INTENT_RETRY");
    if (row.unresolvedTransactions > 0) blocker.push("PR21_28_MILESTONE_UNRESOLVED_TRANSACTION");
    if (row.authorityLeaks > 0) blocker.push("PR21_28_MILESTONE_AUTHORITY_LEAK");
    if (row.restartRecoveryFailures > 0) blocker.push("PR21_28_MILESTONE_RESTART_RECOVERY_FAILURE");
    if (row.staleEvidenceActions > 0) blocker.push("PR21_28_MILESTONE_STALE_EVIDENCE_ACTION");
    if (row.thrashEvents > 0) blocker.push("PR21_28_MILESTONE_THRASH");
    if (row.pingpongEvents > 0) blocker.push("PR21_28_MILESTONE_PINGPONG");
    if (row.starvationCriticalCount > 0) blocker.push("PR21_28_MILESTONE_STARVATION");
  }

  if (sampleGaps > 0) blocker.push("PR21_28_MILESTONE_SAMPLE_GAPS");
  if (segmentReihenfolgeVerletzt > 0) blocker.push("PR21_28_MILESTONE_SEGMENT_REIHENFOLGE");

  const evidenceRows = plan.segmente.map((segmentPlan) => {
    const rows = samples.filter(x => x.segmentId === segmentPlan.segmentId);
    if (rows.length < 2) {
      blocker.push("PR21_28_MILESTONE_SEGMENT_ZU_WENIGE_SAMPLES:" + segmentPlan.segmentId);
      return Object.freeze({
        evidenceId: plan.checkpointId + ":" + segmentPlan.segmentId,
        art: segmentPlan.art,
        stage: segmentPlan.stage,
        dauerSekunden: 0,
        samples: rows.length,
        unerwarteteGameplayWrites: summe(rows, "unerwarteteGameplayWrites"),
        duplicateIrreversibleEffects: summe(rows, "duplicateIrreversibleEffects"),
        safetyViolations: summe(rows, "safetyViolations"),
        sameIntentRetries: summe(rows, "sameIntentRetries"),
        unresolvedTransactions: summe(rows, "unresolvedTransactions"),
        authorityLeaks: summe(rows, "authorityLeaks"),
        restartRecoveryFailures: summe(rows, "restartRecoveryFailures"),
        staleEvidenceActions: summe(rows, "staleEvidenceActions"),
        thrashEvents: summe(rows, "thrashEvents"),
        pingpongEvents: summe(rows, "pingpongEvents"),
        starvationCriticalCount: summe(rows, "starvationCriticalCount"),
      });
    }
    const first = rows[0];
    const last = rows.at(-1);
    if (first === undefined || last === undefined) {
      throw new Error("PR21_28_MILESTONE_SEGMENT_SAMPLE_FEHLT");
    }
    const dauerSekunden = Math.floor((last.beobachtetAmMs - first.beobachtetAmMs) / 1_000);
    if (dauerSekunden < segmentPlan.minimumDauerSekunden) {
      blocker.push("PR21_28_MILESTONE_SEGMENT_MINIMUM_NICHT_ERREICHT:" + segmentPlan.segmentId);
    }
    return Object.freeze({
      evidenceId: plan.checkpointId + ":" + segmentPlan.segmentId,
      art: segmentPlan.art,
      stage: segmentPlan.stage,
      dauerSekunden,
      samples: rows.length,
      unerwarteteGameplayWrites: summe(rows, "unerwarteteGameplayWrites"),
      duplicateIrreversibleEffects: summe(rows, "duplicateIrreversibleEffects"),
      safetyViolations: summe(rows, "safetyViolations"),
      sameIntentRetries: summe(rows, "sameIntentRetries"),
      unresolvedTransactions: summe(rows, "unresolvedTransactions"),
      authorityLeaks: summe(rows, "authorityLeaks"),
      restartRecoveryFailures: summe(rows, "restartRecoveryFailures"),
      staleEvidenceActions: summe(rows, "staleEvidenceActions"),
      thrashEvents: summe(rows, "thrashEvents"),
      pingpongEvents: summe(rows, "pingpongEvents"),
      starvationCriticalCount: summe(rows, "starvationCriticalCount"),
    });
  });

  const alleMinimaErreicht = evidenceRows.every((row, index) =>
    row.dauerSekunden >= (plan.segmente[index]?.minimumDauerSekunden ?? Number.POSITIVE_INFINITY));
  const alleZieleErreicht = evidenceRows.every((row, index) =>
    row.dauerSekunden >= (plan.segmente[index]?.zielDauerSekunden ?? Number.POSITIVE_INFINITY));

  const uniqueBlocker = Object.freeze([...new Set(blocker)]);
  const status =
    uniqueBlocker.length > 0
      ? "BLOCKIERT"
      : alleZieleErreicht
        ? "EVIDENCE_READY_TARGET_REACHED"
        : "EVIDENCE_READY_MINIMUM_REACHED";

  return Object.freeze({
    schemaVersion: 1,
    checkpointId: plan.checkpointId,
    status,
    blocker: uniqueBlocker,
    sampleAnzahl: samples.length,
    sampleGaps,
    segmentReihenfolgeVerletzt,
    evidenceRows: Object.freeze(evidenceRows),
    alleMinimaErreicht,
    alleZieleErreicht,
    cap022FullChainRequired: plan.cap022FullChainRequired,
    cap022FullChainSatisfied,
    runnerGameplayWrites: 0,
    runnerPublicFunctionCalls: 0,
    runnerRawWriteCalls: 0,
    evidenceRatifiedByRunner: false,
    authorityIssuedByRunner: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
