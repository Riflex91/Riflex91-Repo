export interface StackBeobachtung {
  readonly slotId: string;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly maximaleMenge: number;
  readonly variantenFingerprint: string;
}

export interface GeplanterOutput {
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly maximaleMenge: number;
  readonly variantenFingerprint: string | null;
}

export interface WorkspaceAnfrage {
  readonly freieInventarSlots: number;
  readonly temporaereWorkspaceSlots: number;
  readonly bestehendeStacks: readonly StackBeobachtung[];
  readonly outputs: readonly GeplanterOutput[];
}

export interface WorkspaceNachweis {
  readonly erlaubt: boolean;
  readonly benoetigteNeueSlots: number;
  readonly temporaereWorkspaceSlots: number;
  readonly gesamtBenoetigteFreieSlots: number;
  readonly freieInventarSlots: number;
}

function pruefeGanzzahl(wert: number, max: number, fehler: string): void {
  if (!Number.isInteger(wert) || wert < 0 || wert > max) throw new Error(fehler);
}

export function pruefeWorkspaceKapazitaet(anfrage: WorkspaceAnfrage): WorkspaceNachweis {
  pruefeGanzzahl(anfrage.freieInventarSlots, 256, "WORKSPACE_FREIE_SLOTS_UNGUELTIG");
  pruefeGanzzahl(anfrage.temporaereWorkspaceSlots, 256, "WORKSPACE_TEMP_SLOTS_UNGUELTIG");
  if (anfrage.bestehendeStacks.length > 256 || anfrage.outputs.length > 256) {
    throw new Error("WORKSPACE_EINGABE_ZU_GROSS");
  }

  const stacks = anfrage.bestehendeStacks.map(stack => {
    if (!stack.slotId || !stack.name || !stack.variantenFingerprint) {
      throw new Error("WORKSPACE_STACK_IDENTITAET_FEHLT");
    }
    pruefeGanzzahl(stack.menge, 1_000_000, "WORKSPACE_STACK_MENGE_UNGUELTIG");
    if (stack.menge < 1) throw new Error("WORKSPACE_STACK_MENGE_UNGUELTIG");
    pruefeGanzzahl(stack.maximaleMenge, 1_000_000, "WORKSPACE_STACK_MAX_UNGUELTIG");
    if (stack.maximaleMenge < stack.menge) throw new Error("WORKSPACE_STACK_MAX_UNTER_MENGE");
    return { ...stack };
  });

  let benoetigteNeueSlots = 0;
  for (const output of anfrage.outputs) {
    if (!output.name) throw new Error("WORKSPACE_OUTPUT_NAME_FEHLT");
    pruefeGanzzahl(output.menge, 1_000_000, "WORKSPACE_OUTPUT_MENGE_UNGUELTIG");
    if (output.menge < 1) throw new Error("WORKSPACE_OUTPUT_MENGE_UNGUELTIG");
    pruefeGanzzahl(output.maximaleMenge, 1_000_000, "WORKSPACE_OUTPUT_MAX_UNGUELTIG");
    if (output.maximaleMenge < 1) throw new Error("WORKSPACE_OUTPUT_MAX_UNGUELTIG");

    let rest = output.menge;
    if (output.variantenFingerprint !== null) {
      for (const stack of stacks) {
        if (stack.name !== output.name
            || stack.level !== output.level
            || stack.variantenFingerprint !== output.variantenFingerprint) continue;
        const platz = Math.max(0, stack.maximaleMenge - stack.menge);
        const merge = Math.min(rest, platz);
        stack.menge += merge;
        rest -= merge;
        if (rest === 0) break;
      }
    }
    if (rest > 0) {
      benoetigteNeueSlots += Math.ceil(rest / output.maximaleMenge);
    }
  }

  const gesamt = benoetigteNeueSlots + anfrage.temporaereWorkspaceSlots;
  return Object.freeze({
    erlaubt: gesamt <= anfrage.freieInventarSlots,
    benoetigteNeueSlots,
    temporaereWorkspaceSlots: anfrage.temporaereWorkspaceSlots,
    gesamtBenoetigteFreieSlots: gesamt,
    freieInventarSlots: anfrage.freieInventarSlots,
  });
}
