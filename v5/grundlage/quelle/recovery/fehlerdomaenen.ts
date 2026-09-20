export type FehlerDomaenenStatus = "GESUND" | "DEGRADIERT" | "GESPERRT";

export interface FehlerDomaenenSicht {
  readonly domaeneId: string;
  readonly status: FehlerDomaenenStatus;
  readonly generation: number;
  readonly grund: string | null;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friere(eintrag: FehlerDomaenenSicht): FehlerDomaenenSicht {
  return Object.freeze({ ...eintrag });
}

export class FehlerDomaenenSteuerung {
  readonly #maximaleDomaenen: number;
  #generation = 0;
  #eintraege: readonly FehlerDomaenenSicht[] = Object.freeze([]);

  public constructor(maximaleDomaenen = 256) {
    if (!Number.isInteger(maximaleDomaenen) || maximaleDomaenen < 1 || maximaleDomaenen > 4096) {
      throw new Error("FEHLERDOMAENEN_GRENZE_UNGUELTIG");
    }
    this.#maximaleDomaenen = maximaleDomaenen;
  }

  public registriere(domaeneId: string): FehlerDomaenenSicht {
    pruefeText(domaeneId, "FEHLERDOMAENE_ID_UNGUELTIG");
    const vorhanden = this.#eintraege.find(x => x.domaeneId === domaeneId);
    if (vorhanden !== undefined) return vorhanden;
    if (this.#eintraege.length >= this.#maximaleDomaenen) throw new Error("FEHLERDOMAENEN_REGISTER_VOLL");
    this.#generation += 1;
    const neu = friere({
      domaeneId,
      status: "GESUND",
      generation: this.#generation,
      grund: null,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, neu]);
    return neu;
  }

  public meldeFehler(
    domaeneId: string,
    status: Exclude<FehlerDomaenenStatus, "GESUND">,
    grund: string,
  ): FehlerDomaenenSicht {
    pruefeText(grund, "FEHLERDOMAENE_GRUND_UNGUELTIG");
    const alt = this.registriere(domaeneId);
    this.#generation += 1;
    const neu = friere({
      ...alt,
      status,
      generation: this.#generation,
      grund,
    });
    this.#eintraege = Object.freeze(this.#eintraege.map(x => x.domaeneId === domaeneId ? neu : x));
    return neu;
  }

  public istErlaubt(domaeneId: string): boolean {
    const eintrag = this.#eintraege.find(x => x.domaeneId === domaeneId);
    return eintrag === undefined || eintrag.status !== "GESPERRT";
  }

  public sicht(): readonly FehlerDomaenenSicht[] {
    return Object.freeze(
      this.#eintraege.map(friere).sort((a,b) => a.domaeneId.localeCompare(b.domaeneId)),
    );
  }
}
