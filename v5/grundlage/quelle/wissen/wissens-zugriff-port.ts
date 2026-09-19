import type { GepinnterWissensSnapshot } from "./typen.js";

export interface WissensZugriffPort {
  gibGepinntenSnapshot(): GepinnterWissensSnapshot;
  liesKanonischeDatei(snapshotKennung: string, relativerPfad: string): string | undefined;
}

export class FestGepinnterWissensZugriff implements WissensZugriffPort {
  readonly #snapshot: GepinnterWissensSnapshot;

  public constructor(snapshot: GepinnterWissensSnapshot) {
    if (snapshot.gepinnt !== true || snapshot.ausfuehrungsAutoritaet !== false) {
      throw new Error("WISSENSZUGRIFF_BRAUCHT_GEPINNTEN_SNAPSHOT");
    }
    this.#snapshot = snapshot;
  }

  public gibGepinntenSnapshot(): GepinnterWissensSnapshot {
    return this.#snapshot;
  }

  public liesKanonischeDatei(snapshotKennung: string, relativerPfad: string): string | undefined {
    if (snapshotKennung !== this.#snapshot.snapshotKennung) {
      throw new Error("WISSENSZUGRIFF_SNAPSHOT_DRIFT");
    }
    return this.#snapshot.dateien.find(datei => datei.relativerPfad === relativerPfad)
      ?.kanonischerInhalt;
  }
}
