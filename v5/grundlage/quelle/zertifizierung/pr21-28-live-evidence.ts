export type Pr21_28CheckpointArt =
  | "MERCHANT_INTEGRATION_15M"
  | "CAPABILITY_5M"
  | "GROUP_INTEGRATION_15M"
  | "FULL_INTEGRATION_MULTI_HOUR";

export interface Pr21_28LiveEvidenceRow {
  readonly evidenceId: string;
  readonly art: Pr21_28CheckpointArt;
  readonly stage: "PR21" | "PR22" | "PR23" | "PR24" | "PR25" | "PR26" | "PR27" | "PR28";
  readonly dauerSekunden: number;
  readonly samples: number;
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

export interface Pr21_28LiveEvidenceBewertung {
  readonly schemaVersion: 1;
  readonly status: "EVIDENCE_RATIFIZIERBAR" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly evidenceId: string;
  readonly art: Pr21_28CheckpointArt;
  readonly stage: Pr21_28LiveEvidenceRow["stage"];
  readonly minimumDauerSekunden: number;
  readonly evidenceRatifiedByEvaluation: false;
  readonly productiveAuthorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

function text(value: string, error: string): void {
  if (value.trim().length === 0 || value.length > 192) throw new Error(error);
}

function count(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function minDauer(art: Pr21_28CheckpointArt): number {
  if (art === "CAPABILITY_5M") return 300;
  if (art === "FULL_INTEGRATION_MULTI_HOUR") return 7200;
  return 900;
}

export function bewertePr21_28LiveEvidence(
  row: Pr21_28LiveEvidenceRow,
): Pr21_28LiveEvidenceBewertung {
  text(row.evidenceId, "PR21_28_EVIDENCE_ID_UNGUELTIG");
  for (const value of [
    row.dauerSekunden,
    row.samples,
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
  ]) count(value, "PR21_28_EVIDENCE_ZAEHLER_UNGUELTIG");

  const minimum = minDauer(row.art);
  const blocker: string[] = [];
  if (row.dauerSekunden < minimum) blocker.push("PR21_28_EVIDENCE_DAUER_ZU_KURZ");
  if (row.samples < 2) blocker.push("PR21_28_EVIDENCE_ZU_WENIGE_SAMPLES");
  if (row.unerwarteteGameplayWrites > 0) blocker.push("PR21_28_EVIDENCE_UNERWARTETER_WRITE");
  if (row.duplicateIrreversibleEffects > 0) blocker.push("PR21_28_EVIDENCE_DUPLICATE_EFFECT");
  if (row.safetyViolations > 0) blocker.push("PR21_28_EVIDENCE_SAFETY_VIOLATION");
  if (row.sameIntentRetries > 0) blocker.push("PR21_28_EVIDENCE_SAME_INTENT_RETRY");
  if (row.unresolvedTransactions > 0) blocker.push("PR21_28_EVIDENCE_UNRESOLVED_TRANSACTION");
  if (row.authorityLeaks > 0) blocker.push("PR21_28_EVIDENCE_AUTHORITY_LEAK");
  if (row.restartRecoveryFailures > 0) blocker.push("PR21_28_EVIDENCE_RESTART_RECOVERY_FAILURE");
  if (row.staleEvidenceActions > 0) blocker.push("PR21_28_EVIDENCE_STALE_ACTION");
  if (row.thrashEvents > 0) blocker.push("PR21_28_EVIDENCE_THRASH");
  if (row.pingpongEvents > 0) blocker.push("PR21_28_EVIDENCE_PINGPONG");
  if (row.starvationCriticalCount > 0) blocker.push("PR21_28_EVIDENCE_STARVATION");

  return Object.freeze({
    schemaVersion:1,
    status:blocker.length===0?"EVIDENCE_RATIFIZIERBAR":"BLOCKIERT",
    blocker:Object.freeze(blocker),
    evidenceId:row.evidenceId,
    art:row.art,
    stage:row.stage,
    minimumDauerSekunden:minimum,
    evidenceRatifiedByEvaluation:false,
    productiveAuthorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
  });
}

export interface Pr21_28CheckpointDefinition {
  readonly checkpointId: string;
  readonly afterStage: "PR20" | "PR24_25" | "PR28";
  readonly rows: readonly Readonly<{
    art: Pr21_28CheckpointArt;
    stage: Pr21_28LiveEvidenceRow["stage"];
    zielDauerSekunden: number;
  }>[];
  readonly produktiveGatesBleibenBisEvidenceGeschlossen: true;
}

export function planePr21_28IntegrationCheckpoints(): readonly Pr21_28CheckpointDefinition[] {
  return Object.freeze([
    Object.freeze({
      checkpointId:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
      afterStage:"PR20",
      rows:Object.freeze([
        Object.freeze({art:"MERCHANT_INTEGRATION_15M",stage:"PR21",zielDauerSekunden:900}),
      ]),
      produktiveGatesBleibenBisEvidenceGeschlossen:true,
    }),
    Object.freeze({
      checkpointId:"POST_PR24_25_GROUP_CHECKPOINT",
      afterStage:"PR24_25",
      rows:Object.freeze([
        Object.freeze({art:"CAPABILITY_5M",stage:"PR23",zielDauerSekunden:300}),
        Object.freeze({art:"GROUP_INTEGRATION_15M",stage:"PR25",zielDauerSekunden:900}),
      ]),
      produktiveGatesBleibenBisEvidenceGeschlossen:true,
    }),
    Object.freeze({
      checkpointId:"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN",
      afterStage:"PR28",
      rows:Object.freeze([
        Object.freeze({art:"FULL_INTEGRATION_MULTI_HOUR",stage:"PR28",zielDauerSekunden:10800}),
      ]),
      produktiveGatesBleibenBisEvidenceGeschlossen:true,
    }),
  ]);
}
