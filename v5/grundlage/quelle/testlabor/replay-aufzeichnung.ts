export interface DeterminismusQuellen {
  jetztMs(): number;
  naechsteId(): string;
  zufall01(): number;
}

export interface ReplayKopf {
  readonly schemaVersion: 1;
  readonly buildGitSha: string;
  readonly wissensSnapshotSha256: string;
  readonly konfigurationSha256: string;
}

export interface ReplayEintrag {
  readonly schemaVersion: 1;
  readonly sequenz: number;
  readonly eintragId: string;
  readonly zeitMs: number;
  readonly art: string;
  readonly inhalt: Readonly<Record<string, unknown>>;
}

export interface ReplaySnapshot {
  readonly kopf: ReplayKopf;
  readonly eintraege: readonly ReplayEintrag[];
  readonly verworfenWegenGrenze: number;
}

export class BegrenzteReplayAufzeichnung {
  readonly #kopf: ReplayKopf;
  readonly #quellen: DeterminismusQuellen;
  readonly #maximum: number;
  #eintraege: readonly ReplayEintrag[] = Object.freeze([]);
  #verworfen = 0;

  public constructor(
    kopf: ReplayKopf,
    quellen: DeterminismusQuellen,
    maximum: number,
  ) {
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 100_000) {
      throw new Error("REPLAY_GRENZE_UNGUELTIG");
    }

    this.#kopf = Object.freeze({ ...kopf });
    this.#quellen = quellen;
    this.#maximum = maximum;
  }

  public zeichneAuf(art: string, inhalt: Readonly<Record<string, unknown>>): boolean {
    if (this.#eintraege.length >= this.#maximum) {
      this.#verworfen += 1;
      return false;
    }

    const eintrag: ReplayEintrag = Object.freeze({
      schemaVersion: 1,
      sequenz: this.#eintraege.length + 1,
      eintragId: this.#quellen.naechsteId(),
      zeitMs: this.#quellen.jetztMs(),
      art,
      inhalt: Object.freeze({ ...inhalt }),
    });

    this.#eintraege = Object.freeze([...this.#eintraege, eintrag]);
    return true;
  }

  public snapshot(): ReplaySnapshot {
    return Object.freeze({
      kopf: this.#kopf,
      eintraege: Object.freeze([...this.#eintraege]),
      verworfenWegenGrenze: this.#verworfen,
    });
  }
}
