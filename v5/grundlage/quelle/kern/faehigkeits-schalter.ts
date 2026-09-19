export interface FaehigkeitsDefinition {
  readonly kennung: string;
  readonly mutierend: boolean;
}

export class FaehigkeitsSchalter {
  readonly #explizitFreigegeben: readonly string[];

  public constructor(explizitFreigegeben: readonly string[] = []) {
    if (explizitFreigegeben.length > 256) {
      throw new Error("ZU_VIELE_FAEHIGKEITSFREIGABEN");
    }

    const sortiert = [...explizitFreigegeben].sort();
    for (let index = 1; index < sortiert.length; index += 1) {
      if (sortiert[index] === sortiert[index - 1]) {
        throw new Error("DOPPELTE_FAEHIGKEITSFREIGABE");
      }
    }

    this.#explizitFreigegeben = Object.freeze(sortiert);
  }

  public istFreigegeben(definition: FaehigkeitsDefinition): boolean {
    if (!definition.mutierend) return true;
    return this.#explizitFreigegeben.includes(definition.kennung);
  }
}
