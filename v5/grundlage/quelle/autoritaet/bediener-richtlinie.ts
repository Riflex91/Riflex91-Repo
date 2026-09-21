export interface BedienerProtokollEintrag {
  readonly schemaVersion: 1;
  readonly befehlId: string;
  readonly bedienerId: string;
  readonly zeitMs: number;
  readonly art: "NOTHALT_AKTIVIEREN" | "FAEHIGKEIT_SPERREN";
  readonly faehigkeitId?: string;
  readonly wirkung: "AUTORITAET_REDUZIERT" | "UNVERAENDERT";
  readonly gameplayAutoritaetErhoeht: false;
  readonly safetyUmgangen: false;
}

export interface BedienerProtokollPort {
  schreibeDurable(eintrag: BedienerProtokollEintrag): Promise<void>;
}

export type BedienerDenyBefehl =
  | {
      readonly schemaVersion: 1;
      readonly befehlId: string;
      readonly bedienerId: string;
      readonly zeitMs: number;
      readonly art: "NOTHALT_AKTIVIEREN";
    }
  | {
      readonly schemaVersion: 1;
      readonly befehlId: string;
      readonly bedienerId: string;
      readonly zeitMs: number;
      readonly art: "FAEHIGKEIT_SPERREN";
      readonly faehigkeitId: string;
    };

export interface BedienerRichtlinienSnapshot {
  readonly schemaVersion: 1;
  readonly nothaltAktiv: boolean;
  readonly gesperrteFaehigkeiten: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 128) throw new Error(fehler);
}

export class BedienerRichtlinienDienst {
  readonly #protokoll: BedienerProtokollPort;
  readonly #maximaleSperren: number;
  #nothaltAktiv = false;
  #gesperrteFaehigkeiten: readonly string[] = Object.freeze([]);
  #generation = 1;

  public constructor(protokoll: BedienerProtokollPort, maximaleSperren = 256) {
    if (!Number.isInteger(maximaleSperren) || maximaleSperren < 1 || maximaleSperren > 4096) {
      throw new Error("BEDIENER_SPERREN_GRENZE_UNGUELTIG");
    }
    this.#protokoll = protokoll;
    this.#maximaleSperren = maximaleSperren;
  }

  public istErlaubt(faehigkeitId: string): boolean {
    if (this.#nothaltAktiv) return false;
    return !this.#gesperrteFaehigkeiten.includes(faehigkeitId);
  }

  public async wendeDenyAn(
    befehl: BedienerDenyBefehl,
  ): Promise<BedienerRichtlinienSnapshot> {
    this.#pruefeBefehl(befehl);

    const bereitsWirksam = befehl.art === "NOTHALT_AKTIVIEREN"
      ? this.#nothaltAktiv
      : this.#gesperrteFaehigkeiten.includes(befehl.faehigkeitId);
    if (befehl.art === "FAEHIGKEIT_SPERREN"
        && !bereitsWirksam
        && this.#gesperrteFaehigkeiten.length >= this.#maximaleSperren) {
      throw new Error("BEDIENER_SPERRENLISTE_VOLL");
    }

    const eintrag: BedienerProtokollEintrag = Object.freeze({
      schemaVersion: 1,
      befehlId: befehl.befehlId,
      bedienerId: befehl.bedienerId,
      zeitMs: befehl.zeitMs,
      art: befehl.art,
      ...(befehl.art === "FAEHIGKEIT_SPERREN"
        ? { faehigkeitId: befehl.faehigkeitId }
        : {}),
      wirkung: bereitsWirksam ? "UNVERAENDERT" : "AUTORITAET_REDUZIERT",
      gameplayAutoritaetErhoeht: false,
      safetyUmgangen: false,
    });
    await this.#protokoll.schreibeDurable(eintrag);

    if (!bereitsWirksam) {
      this.#generation += 1;
    }
    if (befehl.art === "NOTHALT_AKTIVIEREN") {
      this.#nothaltAktiv = true;
    } else if (!bereitsWirksam) {
      this.#gesperrteFaehigkeiten = Object.freeze(
        [...this.#gesperrteFaehigkeiten, befehl.faehigkeitId].sort(),
      );
    }

    return this.snapshot();
  }

  public pruefe(faehigkeitId: string): Readonly<{
    erlaubt: boolean;
    generation: number;
  }> {
    pruefeText(faehigkeitId, "BEDIENER_FAEHIGKEIT_UNGUELTIG");
    return Object.freeze({
      erlaubt: this.istErlaubt(faehigkeitId),
      generation: this.#generation,
    });
  }

  public snapshot(): BedienerRichtlinienSnapshot {
    return Object.freeze({
      schemaVersion: 1,
      nothaltAktiv: this.#nothaltAktiv,
      gesperrteFaehigkeiten: Object.freeze([...this.#gesperrteFaehigkeiten]),
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  #pruefeBefehl(befehl: BedienerDenyBefehl): void {
    if (befehl.schemaVersion !== 1) throw new Error("BEDIENER_BEFEHL_SCHEMA_UNGUELTIG");
    pruefeText(befehl.befehlId, "BEDIENER_BEFEHL_KENNUNG_UNGUELTIG");
    pruefeText(befehl.bedienerId, "BEDIENER_KENNUNG_UNGUELTIG");
    if (!Number.isSafeInteger(befehl.zeitMs) || befehl.zeitMs < 0) {
      throw new Error("BEDIENER_ZEIT_UNGUELTIG");
    }
    if (befehl.art === "FAEHIGKEIT_SPERREN") {
      pruefeText(befehl.faehigkeitId, "BEDIENER_FAEHIGKEIT_UNGUELTIG");
    }
  }
}
