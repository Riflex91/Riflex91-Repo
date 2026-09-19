import type { KennungsPort } from "./ports.js";

export class DeterministischerKennungsGenerator implements KennungsPort {
  readonly #praefix: string;
  #zaehler: number;

  public constructor(praefix: string, start = 0) {
    const sauber = praefix.trim();
    if (!/^[A-Z0-9_-]{1,40}$/.test(sauber)) throw new Error("KENNUNGS_PRAEFIX_UNGUELTIG");
    if (!Number.isSafeInteger(start) || start < 0) throw new Error("KENNUNGS_START_UNGUELTIG");
    this.#praefix = sauber;
    this.#zaehler = start;
  }

  public naechsteId(art = "ID"): string {
    const sauber = art.trim();
    if (!/^[A-Z0-9_-]{1,40}$/.test(sauber)) throw new Error("KENNUNGS_ART_UNGUELTIG");
    if (this.#zaehler >= Number.MAX_SAFE_INTEGER) throw new Error("KENNUNGSRAUM_ERSCHOEPFT");
    this.#zaehler += 1;
    return `${this.#praefix}:${sauber}:${String(this.#zaehler).padStart(12, "0")}`;
  }
}
