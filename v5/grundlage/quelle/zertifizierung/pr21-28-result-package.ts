import { evidenceFingerprint } from "./evidence-kette.js";
import type { Pr21_28LiveEvidenceBewertung } from "./pr21-28-live-evidence.js";
import type {
  Pr21_28CheckpointId,
  Pr21_28MilestoneRunnerAuswertung,
} from "./pr21-28-milestone-runner.js";
import type { Pr21_28MilestoneObservabilityResult } from "../operations/pr21-28-milestone-observability.js";

export interface Pr21_28ResultPackageInput {
  readonly schemaVersion: 1;
  readonly packageId: string;
  readonly sourceMainCommit: string;
  readonly createdAtMs: number;
  readonly checkpointId: Pr21_28CheckpointId;
  readonly runner: Pr21_28MilestoneRunnerAuswertung;
  readonly observability: Pr21_28MilestoneObservabilityResult;
  readonly evidence: readonly Pr21_28LiveEvidenceBewertung[];
}

export interface Pr21_28ResultPackageBasis {
  readonly schemaVersion: 1;
  readonly packageId: string;
  readonly sourceMainCommit: string;
  readonly createdAtMs: number;
  readonly checkpointId: Pr21_28CheckpointId;
  readonly status: "READY_FOR_MANUAL_RATIFICATION" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly runnerStatus: Pr21_28MilestoneRunnerAuswertung["status"];
  readonly observabilityStatus: Pr21_28MilestoneObservabilityResult["status"];
  readonly evidenceIds: readonly string[];
  readonly evidenceStatuses: readonly string[];
  readonly sampleAnzahl: number;
  readonly sampleGaps: number;
  readonly alleMinimaErreicht: boolean;
  readonly alleZieleErreicht: boolean;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: boolean;
  readonly cap022FullChainBoundToPackage: true;
  readonly authorityLeakCount: number;
  readonly recorderDrops: number;
  readonly dashboardFehlerDiagnosticOnly: number;
  readonly manualRatificationRequired: true;
  readonly ratifiedByPackageBuilder: false;
  readonly authorityIssuedByPackageBuilder: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21_28ResultPackage extends Pr21_28ResultPackageBasis {
  readonly packageFingerprint: string;
}

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
}

function freezeBasis(
  basis: Pr21_28ResultPackageBasis,
): Pr21_28ResultPackageBasis {
  return Object.freeze({
    ...basis,
    blocker: Object.freeze([...basis.blocker]),
    evidenceIds: Object.freeze([...basis.evidenceIds]),
    evidenceStatuses: Object.freeze([...basis.evidenceStatuses]),
  });
}

export function bauePr21_28ResultPackage(
  input: Pr21_28ResultPackageInput,
): Pr21_28ResultPackage {
  if (input.schemaVersion !== 1) {
    throw new Error("PR21_28_RESULT_PACKAGE_SCHEMA_UNGUELTIG");
  }
  text(input.packageId, "PR21_28_RESULT_PACKAGE_ID_UNGUELTIG");
  if (!/^[0-9a-f]{40}$/.test(input.sourceMainCommit)) {
    throw new Error("PR21_28_RESULT_PACKAGE_MAIN_COMMIT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(input.createdAtMs) || input.createdAtMs < 0) {
    throw new Error("PR21_28_RESULT_PACKAGE_ZEIT_UNGUELTIG");
  }
  if (input.runner.checkpointId !== input.checkpointId) {
    throw new Error("PR21_28_RESULT_PACKAGE_CHECKPOINT_DRIFT");
  }

  const cap022FullChainRequired =
    input.checkpointId === "POST_PR24_25_GROUP_CHECKPOINT";
  const cap022FullChainSatisfied =
    !cap022FullChainRequired
    || (input.runner.cap022FullChainRequired === true
      && input.runner.cap022FullChainSatisfied === true);

  const blocker: string[] = [];
  if (input.runner.cap022FullChainRequired !== cap022FullChainRequired) {
    blocker.push("PR21_28_RESULT_CAP022_REQUIREMENT_DRIFT");
  }
  if (!cap022FullChainSatisfied) {
    blocker.push("PR21_28_RESULT_CAP022_FULL_CHAIN_NICHT_BEREIT");
  }
  if (input.runner.status === "BLOCKIERT") {
    blocker.push("PR21_28_RESULT_RUNNER_BLOCKIERT");
  }
  if (!input.runner.alleMinimaErreicht) {
    blocker.push("PR21_28_RESULT_MINIMUM_NICHT_ERREICHT");
  }
  if (input.runner.sampleGaps > 0) {
    blocker.push("PR21_28_RESULT_SAMPLE_GAPS");
  }
  if (input.runner.segmentReihenfolgeVerletzt > 0) {
    blocker.push("PR21_28_RESULT_SEGMENT_REIHENFOLGE");
  }
  if (input.runner.runnerGameplayWrites !== 0
      || input.runner.runnerPublicFunctionCalls !== 0
      || input.runner.runnerRawWriteCalls !== 0
      || input.runner.authorityIssuedByRunner !== false
      || input.runner.evidenceRatifiedByRunner !== false) {
    blocker.push("PR21_28_RESULT_RUNNER_BOUNDARY_VIOLATION");
  }

  if (input.observability.status !== "BEOBACHTUNG_BEREIT") {
    blocker.push("PR21_28_RESULT_OBSERVABILITY_BLOCKIERT");
  }
  if (input.observability.authorityLeakCount > 0) {
    blocker.push("PR21_28_RESULT_AUTHORITY_LEAK");
  }
  if (input.observability.recorderDrops > 0) {
    blocker.push("PR21_28_RESULT_RECORDER_DROPS");
  }
  if (!input.observability.resourceMetricsComplete) {
    blocker.push("PR21_28_RESULT_RESOURCE_METRICS_UNVOLLSTAENDIG");
  }
  if (input.observability.observerActionAuthority !== false
      || input.observability.gameplayAuthority !== false
      || input.observability.rawWriteAuthority !== false) {
    blocker.push("PR21_28_RESULT_OBSERVER_BOUNDARY_VIOLATION");
  }

  if (input.evidence.length !== input.runner.evidenceRows.length) {
    blocker.push("PR21_28_RESULT_EVIDENCE_ANZAHL_DRIFT");
  }

  const expectedById = new Map(
    input.runner.evidenceRows.map(row => [row.evidenceId, row] as const),
  );
  const evidenceIds = input.evidence.map(row => row.evidenceId);
  if (new Set(evidenceIds).size !== evidenceIds.length) {
    throw new Error("PR21_28_RESULT_EVIDENCE_ID_DOPPELT");
  }

  for (const evidence of input.evidence) {
    const expected = expectedById.get(evidence.evidenceId);
    if (expected === undefined) {
      blocker.push("PR21_28_RESULT_EVIDENCE_UNBEKANNT:" + evidence.evidenceId);
      continue;
    }
    if (evidence.art !== expected.art || evidence.stage !== expected.stage) {
      blocker.push("PR21_28_RESULT_EVIDENCE_BINDING_DRIFT:" + evidence.evidenceId);
    }
    if (evidence.status !== "EVIDENCE_RATIFIZIERBAR") {
      blocker.push("PR21_28_RESULT_EVIDENCE_BLOCKIERT:" + evidence.evidenceId);
    }
    if (evidence.evidenceRatifiedByEvaluation !== false
        || evidence.productiveAuthorityIssued !== false
        || evidence.gameplayAuthority !== false
        || evidence.rawWriteAuthority !== false) {
      blocker.push("PR21_28_RESULT_EVIDENCE_BOUNDARY_VIOLATION:" + evidence.evidenceId);
    }
  }

  for (const expected of input.runner.evidenceRows) {
    if (!evidenceIds.includes(expected.evidenceId)) {
      blocker.push("PR21_28_RESULT_EVIDENCE_FEHLT:" + expected.evidenceId);
    }
  }

  const uniqueBlocker = Object.freeze([...new Set(blocker)]);
  const basis = freezeBasis({
    schemaVersion: 1,
    packageId: input.packageId,
    sourceMainCommit: input.sourceMainCommit,
    createdAtMs: input.createdAtMs,
    checkpointId: input.checkpointId,
    status: uniqueBlocker.length === 0
      ? "READY_FOR_MANUAL_RATIFICATION"
      : "BLOCKIERT",
    blocker: uniqueBlocker,
    runnerStatus: input.runner.status,
    observabilityStatus: input.observability.status,
    evidenceIds: Object.freeze([...evidenceIds].sort()),
    evidenceStatuses: Object.freeze(
      input.evidence
        .map(row => row.evidenceId + ":" + row.status)
        .sort(),
    ),
    sampleAnzahl: input.runner.sampleAnzahl,
    sampleGaps: input.runner.sampleGaps,
    alleMinimaErreicht: input.runner.alleMinimaErreicht,
    alleZieleErreicht: input.runner.alleZieleErreicht,
    cap022FullChainRequired,
    cap022FullChainSatisfied,
    cap022FullChainBoundToPackage: true,
    authorityLeakCount: input.observability.authorityLeakCount,
    recorderDrops: input.observability.recorderDrops,
    dashboardFehlerDiagnosticOnly: input.observability.dashboardFehlerDiagnosticOnly,
    manualRatificationRequired: true,
    ratifiedByPackageBuilder: false,
    authorityIssuedByPackageBuilder: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });

  return Object.freeze({
    ...basis,
    packageFingerprint: evidenceFingerprint(basis),
  });
}
