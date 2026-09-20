import type { WorkflowCheckpoint } from "../persistenz/ports.js";
import { bestimmeWiederanlauf } from "../persistenz/restart.js";

export interface RecoveryWiederanlauf {
  readonly art: "KEINE_ARBEIT" | "TERMINAL" | "ABGLEICH_ERFORDERLICH";
  readonly workflowId: string | null;
  readonly checkpointId: string | null;
  readonly terminalStatus: string | null;
  readonly executionAuthority: false;
}

export function ladeRecoveryWiederanlauf<T>(
  checkpoint: WorkflowCheckpoint<T> | undefined,
): RecoveryWiederanlauf {
  const entscheidung = bestimmeWiederanlauf(checkpoint);
  if (entscheidung.modus === "KEIN_CHECKPOINT") {
    return Object.freeze({
      art: "KEINE_ARBEIT",
      workflowId: null,
      checkpointId: null,
      terminalStatus: null,
      executionAuthority: false,
    });
  }
  if (entscheidung.modus === "TERMINAL") {
    return Object.freeze({
      art: "TERMINAL",
      workflowId: checkpoint?.workflowId ?? null,
      checkpointId: checkpoint?.checkpointId ?? null,
      terminalStatus: entscheidung.status,
      executionAuthority: false,
    });
  }
  return Object.freeze({
    art: "ABGLEICH_ERFORDERLICH",
    workflowId: entscheidung.workflowId,
    checkpointId: entscheidung.checkpointId,
    terminalStatus: null,
    executionAuthority: false,
  });
}
