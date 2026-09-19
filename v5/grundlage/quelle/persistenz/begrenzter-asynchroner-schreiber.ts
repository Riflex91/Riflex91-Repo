export type SchreibFunktion<T> = (wert: T) => Promise<void>;

export class BegrenzterAsynchronerSchreiber<T> {
  readonly #maximum: number;
  readonly #schreibe: SchreibFunktion<T>;
  #ausstehend = 0;
  #kette: Promise<void> = Promise.resolve();
  #letzterFehler: unknown;

  public constructor(maximum: number, schreibe: SchreibFunktion<T>) {
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 10_000) {
      throw new Error("SCHREIBER_GRENZE_UNGUELTIG");
    }

    this.#maximum = maximum;
    this.#schreibe = schreibe;
  }

  public get ausstehend(): number {
    return this.#ausstehend;
  }

  public get maximum(): number {
    return this.#maximum;
  }

  public reiheEin(wert: T): boolean {
    if (this.#ausstehend >= this.#maximum) return false;

    this.#ausstehend += 1;
    this.#kette = this.#kette.then(async () => {
      try {
        await this.#schreibe(wert);
      } catch (error) {
        this.#letzterFehler = error;
      } finally {
        this.#ausstehend -= 1;
      }
    });

    return true;
  }

  public async warteBisLeer(): Promise<void> {
    await this.#kette;
    if (this.#letzterFehler !== undefined) {
      const fehler = this.#letzterFehler;
      this.#letzterFehler = undefined;
      throw fehler;
    }
  }
}
