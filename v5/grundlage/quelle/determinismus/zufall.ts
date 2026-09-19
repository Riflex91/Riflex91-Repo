import type { ZufallsPort } from "./ports.js";

export class XorShift32Zufall implements ZufallsPort {
  #zustand: number;

  public constructor(seed: number) {
    if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff) {
      throw new Error("ZUFALLS_SEED_UNGUELTIG");
    }
    this.#zustand = seed >>> 0;
  }

  public naechsteUint32(): number {
    let wert = this.#zustand;
    wert ^= wert << 13;
    wert ^= wert >>> 17;
    wert ^= wert << 5;
    this.#zustand = wert >>> 0;
    return this.#zustand;
  }

  public zufall01(): number {
    return this.naechsteUint32() / 0x1_0000_0000;
  }

  public waehleIndex(anzahl: number): number {
    if (!Number.isInteger(anzahl) || anzahl < 1) throw new Error("AUSWAHL_ANZAHL_UNGUELTIG");
    return Math.floor(this.zufall01() * anzahl);
  }
}
