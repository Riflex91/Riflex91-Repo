import type { WorkflowCheckpoint } from "./ports.js";

export type WiederanlaufEntscheidung =
  | { readonly modus: "KEIN_CHECKPOINT" }
  | { readonly modus: "TERMINAL"; readonly status: string }
  | {
      readonly modus: "ABGLEICH_ERFORDERLICH";
      readonly workflowId: string;
      readonly checkpointId: string;
    };

export function bestimmeWiederanlauf<T>(
  checkpoint: WorkflowCheckpoint<T> | undefined,
): WiederanlaufEntscheidung {
  if (checkpoint === undefined) {
    return Object.freeze({ modus: "KEIN_CHECKPOINT" });
  }

  if (checkpoint.status === "NICHT_TERMINAL") {
    return Object.freeze({
      modus: "ABGLEICH_ERFORDERLICH",
      workflowId: checkpoint.workflowId,
      checkpointId: checkpoint.checkpointId,
    });
  }

  return Object.freeze({
    modus: "TERMINAL",
    status: checkpoint.status,
  });
}
