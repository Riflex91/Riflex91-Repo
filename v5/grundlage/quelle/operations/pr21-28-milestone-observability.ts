import type { HeadlessSupervisorStatus } from "./headless-supervisor.js";

export interface Pr21_28MilestoneObservabilityRequest {
  readonly schemaVersion: 1;
  readonly supervisor: HeadlessSupervisorStatus;
  readonly requiredActiveAuthorityIds: readonly string[];
  readonly allowedActiveAuthorityIds: readonly string[];
}

export interface Pr21_28MilestoneObservabilityResult {
  readonly schemaVersion: 1;
  readonly status: "BEOBACHTUNG_BEREIT" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly activeAuthorityIds: readonly string[];
  readonly missingRequiredAuthorityIds: readonly string[];
  readonly unexpectedActiveAuthorityIds: readonly string[];
  readonly authorityLeakCount: number;
  readonly dashboardFehlerDiagnosticOnly: number;
  readonly recorderDrops: number;
  readonly operationsBackpressureAktiv: boolean | null;
  readonly resourceMetricsComplete: boolean;
  readonly dashboardFailureBlocksGameplay: false;
  readonly observerActionAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
}

function unique(values: readonly string[], error: string): readonly string[] {
  const seen = new Set<string>();
  for (const value of values) {
    text(value,error);
    if (seen.has(value)) throw new Error(error + "_DOPPELT");
    seen.add(value);
  }
  return Object.freeze([...seen].sort());
}

export function bewertePr21_28MilestoneObservability(
  request: Pr21_28MilestoneObservabilityRequest,
): Pr21_28MilestoneObservabilityResult {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_28_MILESTONE_OBSERVABILITY_SCHEMA_UNGUELTIG");
  }
  const required = unique(
    request.requiredActiveAuthorityIds,
    "PR21_28_MILESTONE_REQUIRED_AUTHORITY_UNGUELTIG",
  );
  const allowed = unique(
    request.allowedActiveAuthorityIds,
    "PR21_28_MILESTONE_ALLOWED_AUTHORITY_UNGUELTIG",
  );
  for (const id of required) {
    if (!allowed.includes(id)) {
      throw new Error("PR21_28_MILESTONE_REQUIRED_AUTHORITY_NICHT_ALLOWED:" + id);
    }
  }

  const blocker: string[] = [];
  const supervisor = request.supervisor;
  if (supervisor.schemaVersion !== 1 || supervisor.actionAuthority !== false) {
    throw new Error("PR21_28_MILESTONE_SUPERVISOR_UNGUELTIG");
  }
  if (!supervisor.bereit) blocker.push("PR21_28_MILESTONE_SUPERVISOR_NICHT_BEREIT");
  if (supervisor.health.zustand !== "GESUND") {
    blocker.push("PR21_28_MILESTONE_HEALTH_NICHT_GESUND");
  }
  if (!supervisor.operationsAktuell) {
    blocker.push("PR21_28_MILESTONE_OPERATIONS_STALE");
  }

  const active = supervisor.autoritaeten
    .filter(x => x.aktiv)
    .map(x => x.authorityId)
    .sort();
  const missing = required.filter(id => !active.includes(id));
  const unexpected = active.filter(id => !allowed.includes(id));
  if (missing.length > 0) blocker.push("PR21_28_MILESTONE_REQUIRED_AUTHORITY_FEHLT");
  if (unexpected.length > 0) blocker.push("PR21_28_MILESTONE_UNEXPECTED_AUTHORITY");

  const operations = supervisor.operations;
  let recorderDrops = 0;
  let backpressure: boolean | null = null;
  let resourceMetricsComplete = false;
  let dashboardFehler = 0;

  if (operations === null) {
    blocker.push("PR21_28_MILESTONE_OPERATIONS_FEHLT");
  } else {
    recorderDrops = operations.metrik.recorderDrops;
    backpressure = operations.metrik.backpressureAktiv;
    dashboardFehler = operations.dashboardFehler;
    resourceMetricsComplete =
      operations.metrik.ssdIoLatenzMs !== null
      && operations.metrik.ioQueueTiefe !== null
      && operations.metrik.freieBytes !== null;

    if (recorderDrops > 0) blocker.push("PR21_28_MILESTONE_RECORDER_DROPS");
    if (backpressure) blocker.push("PR21_28_MILESTONE_BACKPRESSURE");
    if (!resourceMetricsComplete) blocker.push("PR21_28_MILESTONE_RESOURCE_METRICS_UNVOLLSTAENDIG");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "BEOBACHTUNG_BEREIT" : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    activeAuthorityIds: Object.freeze(active),
    missingRequiredAuthorityIds: Object.freeze(missing),
    unexpectedActiveAuthorityIds: Object.freeze(unexpected),
    authorityLeakCount: unexpected.length,
    dashboardFehlerDiagnosticOnly: dashboardFehler,
    recorderDrops,
    operationsBackpressureAktiv: backpressure,
    resourceMetricsComplete,
    dashboardFailureBlocksGameplay: false,
    observerActionAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
