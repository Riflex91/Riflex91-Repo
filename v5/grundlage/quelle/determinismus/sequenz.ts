import type { SequenzPort } from "./ports.js";

export class MonotoneSequenz implements SequenzPort {
  #wert: number;

  public constructor(start = 0) {
    if (!Number.isSafeInteger(start) || start < 0) throw new Error("SEQUENZ_START_UNGUELTIG");
    this.#wert = start;
  }

  public naechsteSequenz(): number {
    if (this.#wert >= Number.MAX_SAFE_INTEGER) throw new Error("SEQUENZRAUM_ERSCHOEPFT");
    this.#wert += 1;
    return this.#wert;
  }

  public aktuell(): number {
    return this.#wert;
  }
}
