export type VerticalSliceStufe =
  | "BEOBACHTUNG"
  | "PLAN"
  | "WORKFLOW"
  | "RESSOURCEN"
  | "INTENT_DURABLE"
  | "ADMISSION"
  | "EXECUTION_SHADOW"
  | "SERVERERGEBNIS"
  | "POSTCONDITION"
  | "COMMIT"
  | "RESTART_ABGLEICH"
  | "SHADOW_NACHWEIS";

const REIHENFOLGE: readonly VerticalSliceStufe[] = Object.freeze([
  "BEOBACHTUNG",
  "PLAN",
  "WORKFLOW",
  "RESSOURCEN",
  "INTENT_DURABLE",
  "ADMISSION",
  "EXECUTION_SHADOW",
  "SERVERERGEBNIS",
  "POSTCONDITION",
  "COMMIT",
  "RESTART_ABGLEICH",
  "SHADOW_NACHWEIS",
]);

export interface VerticalSliceStufenNachweis {
  readonly stufe: VerticalSliceStufe;
  readonly evidenceId: string;
}

export class VerticalSliceProtokoll {
  #nachweise: readonly VerticalSliceStufenNachweis[] = Object.freeze([]);

  public melde(stufe: VerticalSliceStufe, evidenceId: string): void {
    if (evidenceId.trim().length === 0 || evidenceId.length > 192) {
      throw new Error("VERTICAL_SLICE_EVIDENCE_ID_UNGUELTIG");
    }
    const erwartet = REIHENFOLGE[this.#nachweise.length];
    if (erwartet === undefined) throw new Error("VERTICAL_SLICE_BEREITS_VOLLSTAENDIG");
    if (stufe !== erwartet) {
      throw new Error("VERTICAL_SLICE_REIHENFOLGE_VERLETZT:" + erwartet + "->" + stufe);
    }
    this.#nachweise = Object.freeze([
      ...this.#nachweise,
      Object.freeze({ stufe, evidenceId }),
    ]);
  }

  public vollstaendig(): boolean {
    return this.#nachweise.length === REIHENFOLGE.length;
  }

  public sicht(): readonly VerticalSliceStufenNachweis[] {
    return Object.freeze(this.#nachweise.map(x => Object.freeze({ ...x })));
  }
}
