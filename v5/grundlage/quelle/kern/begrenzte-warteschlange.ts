export class BegrenzteWarteschlange<T> {
  readonly #maximum: number;
  #werte: readonly T[] = Object.freeze([]);

  public constructor(maximum: number) {
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 100_000) {
      throw new Error("WARTESCHLANGEN_GRENZE_UNGUELTIG");
    }
    this.#maximum = maximum;
  }

  public get laenge(): number {
    return this.#werte.length;
  }

  public get maximum(): number {
    return this.#maximum;
  }

  public legeAb(wert: T): boolean {
    if (this.#werte.length >= this.#maximum) return false;
    this.#werte = Object.freeze([...this.#werte, wert]);
    return true;
  }

  public entnehme(): T | undefined {
    const erstes = this.#werte[0];
    if (erstes === undefined) return undefined;
    this.#werte = Object.freeze(this.#werte.slice(1));
    return erstes;
  }

  public snapshot(): readonly T[] {
    return Object.freeze([...this.#werte]);
  }
}
