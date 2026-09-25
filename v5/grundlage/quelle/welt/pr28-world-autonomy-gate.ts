export type Pr28WorldTaskArt =
  | "EVENT"
  | "QUEST"
  | "RARE_BOSS"
  | "SERVER_HOP"
  | "DISCOVERY";

export type Pr28WorldDriftStatus =
  | "GUELTIG"
  | "REPLAN_ERFORDERLICH"
  | "BLOCKIERT_STALE"
  | "BLOCKIERT_UNBEKANNT"
  | "NICHT_ERFORDERLICH";

export interface Pr28WorldAutonomyRequest {
  readonly schemaVersion: 1;
  readonly taskId: string;
  readonly art: Pr28WorldTaskArt;
  readonly optimizerCandidateAllowed: boolean;
  readonly contentKnown: boolean;
  readonly contentQuarantined: boolean;
  readonly liveEvidenceFresh: boolean;
  readonly definitionEvidenceFresh: boolean;
  readonly eventQuestDriftStatus: Pr28WorldDriftStatus;
  readonly rareBossTargetEvidenceFresh: boolean;
  readonly serverHopRequired: boolean;
  readonly serverHopEvidenceFresh: boolean;
  readonly serverHopAllowed: boolean;
  readonly targetServerModeKnown: boolean;
  readonly pvpHardcorePolicyAllowsTarget: boolean;
  readonly restartReconciled: boolean;
}

export interface Pr28WorldAutonomyGateResult {
  readonly schemaVersion: 1;
  readonly status: "PLAN_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly taskId: string;
  readonly art: Pr28WorldTaskArt;
  readonly discoveryKannQuarantaeneNichtFreigeben: true;
  readonly worldActionAuthority: false;
  readonly serverHopAuthority: false;
  readonly movementAuthority: false;
  readonly combatAuthority: false;
  readonly merchantAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function pruefePr28WorldAutonomyGate(
  anfrage: Pr28WorldAutonomyRequest,
): Pr28WorldAutonomyGateResult {
  if (anfrage.schemaVersion !== 1) throw new Error("PR28_WORLD_SCHEMA_UNGUELTIG");
  text(anfrage.taskId, "PR28_WORLD_TASK_UNGUELTIG");

  const blocker: string[] = [];
  if (!anfrage.optimizerCandidateAllowed) blocker.push("PR28_OPTIMIZER_KANDIDAT_NICHT_ERLAUBT");
  if (!anfrage.contentKnown) blocker.push("PR28_CONTENT_UNBEKANNT");
  if (anfrage.contentQuarantined) blocker.push("PR28_CONTENT_QUARANTAENE");
  if (!anfrage.liveEvidenceFresh) blocker.push("PR28_LIVE_EVIDENCE_STALE");
  if (!anfrage.definitionEvidenceFresh) blocker.push("PR28_DEFINITION_EVIDENCE_STALE");
  if (!anfrage.restartReconciled) blocker.push("PR28_RESTART_NICHT_RECONCILED");

  if (anfrage.art === "EVENT" || anfrage.art === "QUEST") {
    if (anfrage.eventQuestDriftStatus !== "GUELTIG") {
      blocker.push("PR28_EVENT_QUEST_DRIFT:" + anfrage.eventQuestDriftStatus);
    }
  }

  if (anfrage.art === "RARE_BOSS" && !anfrage.rareBossTargetEvidenceFresh) {
    blocker.push("PR28_RARE_BOSS_TARGET_STALE");
  }

  if (anfrage.art === "SERVER_HOP" || anfrage.serverHopRequired) {
    if (!anfrage.serverHopEvidenceFresh) blocker.push("PR28_SERVER_HOP_EVIDENCE_STALE");
    if (!anfrage.serverHopAllowed) blocker.push("PR28_SERVER_HOP_POLICY_BLOCKIERT");
    if (!anfrage.targetServerModeKnown) blocker.push("PR28_SERVER_MODUS_UNBEKANNT");
    if (!anfrage.pvpHardcorePolicyAllowsTarget) blocker.push("PR28_SERVER_POLICY_GESPERRT");
  }

  if (anfrage.art === "DISCOVERY") {
    blocker.push("PR28_DISCOVERY_NUR_BEOBACHTUNG");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "PLAN_BEREIT_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    taskId: anfrage.taskId,
    art: anfrage.art,
    discoveryKannQuarantaeneNichtFreigeben: true,
    worldActionAuthority: false,
    serverHopAuthority: false,
    movementAuthority: false,
    combatAuthority: false,
    merchantAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
