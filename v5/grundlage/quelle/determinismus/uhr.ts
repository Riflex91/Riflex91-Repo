import type { UhrPort } from "./ports.js";

export class SimulierteUhr implements UhrPort {
  #jetztMs: number;

  public constructor(startMs = 0) {
    if (!Number.isFinite(startMs)) throw new Error("UHR_START_UNGUELTIG");
    this.#jetztMs = startMs;
  }

  public jetztMs(): number {
    return this.#jetztMs;
  }

  public stelleAuf(zeitMs: number): void {
    if (!Number.isFinite(zeitMs)) throw new Error("UHR_ZEIT_UNGUELTIG");
    this.#jetztMs = zeitMs;
  }

  public schreiteVor(deltaMs: number): number {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new Error("UHR_DELTA_UNGUELTIG");
    this.#jetztMs += deltaMs;
    return this.#jetztMs;
  }
}
