export type GrundlagenZustand = "GESTOPPT" | "GESTARTET";

export interface GrundlagenStatus {
  readonly zustand: GrundlagenZustand;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly spielSchreibversuche: 0;
}

export class LeereV5Grundlage {
  #zustand: GrundlagenZustand = "GESTOPPT";

  public starte(): GrundlagenStatus {
    this.#zustand = "GESTARTET";
    return this.status();
  }

  public stoppe(): GrundlagenStatus {
    this.#zustand = "GESTOPPT";
    return this.status();
  }

  public status(): GrundlagenStatus {
    return Object.freeze({
      zustand: this.#zustand,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      spielSchreibversuche: 0,
    });
  }
}
