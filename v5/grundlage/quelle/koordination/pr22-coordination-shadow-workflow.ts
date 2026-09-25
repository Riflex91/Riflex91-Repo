export type Pr22ShadowWorkflowStatus =
  | "GEPLANT"
  | "ACK_AUSSTEHEND"
  | "SETTLEMENT_AUSSTEHEND"
  | "ABGESCHLOSSEN"
  | "BLOCKIERT";

export interface Pr22ShadowWorkflowRequest {
  readonly schemaVersion: 1;
  readonly messageId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly admissionReady: boolean;
  readonly ackObserved: boolean;
  readonly settlementObserved: boolean;
  readonly ackCorrelated: boolean;
  readonly settlementCorrelated: boolean;
  readonly ttlFresh: boolean;
  readonly recipientFresh: boolean;
  readonly restartObserved: boolean;
  readonly restartReconciled: boolean;
}

export interface Pr22ShadowWorkflowResult {
  readonly schemaVersion: 1;
  readonly status: Pr22ShadowWorkflowStatus;
  readonly blocker: readonly string[];
  readonly sameMessageIdAcrossRetry: true;
  readonly semanticRetryCreatesNewMessage: false;
  readonly settlementTerminal: true;
  readonly staleRecipientAuthority: false;
  readonly sendCmAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function bewertePr22ShadowWorkflow(
  anfrage: Pr22ShadowWorkflowRequest,
): Pr22ShadowWorkflowResult {
  if (anfrage.schemaVersion !== 1) throw new Error("PR22_SHADOW_WORKFLOW_SCHEMA_UNGUELTIG");
  text(anfrage.messageId, "PR22_SHADOW_WORKFLOW_MESSAGE_ID_UNGUELTIG");
  text(anfrage.workflowId, "PR22_SHADOW_WORKFLOW_ID_UNGUELTIG");
  if (!Number.isSafeInteger(anfrage.workflowRevision) || anfrage.workflowRevision < 0) {
    throw new Error("PR22_SHADOW_WORKFLOW_REVISION_UNGUELTIG");
  }

  const blocker: string[] = [];
  if (!anfrage.admissionReady) blocker.push("PR22_SHADOW_ADMISSION_BLOCKIERT");
  if (!anfrage.ttlFresh) blocker.push("PR22_SHADOW_TTL_STALE");
  if (!anfrage.recipientFresh) blocker.push("PR22_SHADOW_RECIPIENT_STALE");
  if (anfrage.restartObserved && !anfrage.restartReconciled) {
    blocker.push("PR22_SHADOW_RESTART_RECONCILIATION_FEHLT");
  }
  if (anfrage.ackObserved && !anfrage.ackCorrelated) {
    blocker.push("PR22_SHADOW_ACK_KORRELATION_DRIFT");
  }
  if (anfrage.settlementObserved && !anfrage.settlementCorrelated) {
    blocker.push("PR22_SHADOW_SETTLEMENT_KORRELATION_DRIFT");
  }
  if (anfrage.settlementObserved && !anfrage.ackObserved) {
    blocker.push("PR22_SHADOW_SETTLEMENT_OHNE_ACK_EVIDENCE");
  }

  let status: Pr22ShadowWorkflowStatus = "GEPLANT";
  if (blocker.length > 0) status = "BLOCKIERT";
  else if (!anfrage.ackObserved) status = "ACK_AUSSTEHEND";
  else if (!anfrage.settlementObserved) status = "SETTLEMENT_AUSSTEHEND";
  else status = "ABGESCHLOSSEN";

  return Object.freeze({
    schemaVersion: 1,
    status,
    blocker: Object.freeze(blocker),
    sameMessageIdAcrossRetry: true,
    semanticRetryCreatesNewMessage: false,
    settlementTerminal: true,
    staleRecipientAuthority: false,
    sendCmAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
