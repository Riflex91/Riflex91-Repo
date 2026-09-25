export interface Pr22CoordinationShadowRequest {
  readonly schemaVersion: 1;
  readonly messageId: string;
  readonly dedupeKey: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly senderCharacterId: string;
  readonly recipientCharacterId: string;
  readonly recipientSessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoch: number;
  readonly livenessEpoch: number;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
  readonly nowMs: number;
  readonly senderTrusted: boolean;
  readonly recipientRosterFresh: boolean;
  readonly recipientLivenessFresh: boolean;
  readonly sameServer: boolean;
  readonly duplicateObserved: boolean;
  readonly outOfOrderObserved: boolean;
  readonly restartReconciled: boolean;
  readonly priorTerminalSettlement: boolean;
}

export interface Pr22CoordinationShadowAdmission {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly staleCharacterAuthority: false;
  readonly blindResumeAllowed: false;
  readonly normalRuntimeAllowed: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function pruefePr22CoordinationShadowAdmission(
  anfrage: Pr22CoordinationShadowRequest,
): Pr22CoordinationShadowAdmission {
  if (anfrage.schemaVersion !== 1) throw new Error("PR22_COORD_SCHEMA_UNGUELTIG");
  for (const wert of [
    anfrage.messageId,
    anfrage.dedupeKey,
    anfrage.workflowId,
    anfrage.senderCharacterId,
    anfrage.recipientCharacterId,
    anfrage.recipientSessionId,
    anfrage.serverRegion,
    anfrage.serverIdentifier,
  ]) pruefeText(wert, "PR22_COORD_TEXT_UNGUELTIG");

  for (const [wert, fehler] of [
    [anfrage.workflowRevision, "PR22_COORD_REVISION_UNGUELTIG"],
    [anfrage.rosterEpoch, "PR22_COORD_ROSTER_EPOCHE_UNGUELTIG"],
    [anfrage.livenessEpoch, "PR22_COORD_LIVENESS_EPOCHE_UNGUELTIG"],
    [anfrage.createdAtMs, "PR22_COORD_CREATED_UNGUELTIG"],
    [anfrage.expiresAtMs, "PR22_COORD_EXPIRES_UNGUELTIG"],
    [anfrage.nowMs, "PR22_COORD_NOW_UNGUELTIG"],
  ] as const) {
    if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
  }
  if (anfrage.expiresAtMs < anfrage.createdAtMs) {
    throw new Error("PR22_COORD_TTL_UNGUELTIG");
  }

  const blocker: string[] = [];
  if (!anfrage.senderTrusted) blocker.push("PR22_SENDER_NICHT_VERTRAUT");
  if (!anfrage.sameServer) blocker.push("PR22_SERVER_BINDUNG_DRIFT");
  if (!anfrage.recipientRosterFresh) blocker.push("PR22_ROSTER_STALE");
  if (!anfrage.recipientLivenessFresh) blocker.push("PR22_RECIPIENT_STALE");
  if (anfrage.nowMs < anfrage.createdAtMs || anfrage.nowMs > anfrage.expiresAtMs) {
    blocker.push("PR22_MESSAGE_TTL_STALE");
  }
  if (anfrage.duplicateObserved) blocker.push("PR22_DUPLICATE_DEDUPED");
  if (anfrage.outOfOrderObserved) blocker.push("PR22_OUT_OF_ORDER_REJECTED");
  if (!anfrage.restartReconciled) blocker.push("PR22_RESTART_RECONCILIATION_FEHLT");
  if (anfrage.priorTerminalSettlement) blocker.push("PR22_TERMINAL_SETTLEMENT_BEREITS_VORHANDEN");

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "BEREIT_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    messageId: anfrage.messageId,
    workflowId: anfrage.workflowId,
    workflowRevision: anfrage.workflowRevision,
    sendCmAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    staleCharacterAuthority: false,
    blindResumeAllowed: false,
    normalRuntimeAllowed: false,
  });
}
