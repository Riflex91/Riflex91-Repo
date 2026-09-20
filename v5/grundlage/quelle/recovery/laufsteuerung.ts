export type LaufsteuerungsStatus =
  | "LAEUFT"
  | "STOPP_ANGEFORDERT"
  | "KEINE_NEUE_ARBEIT"
  | "ABGLEICH_LAEUFT"
  | "PAUSIERT"
  | "KRITISCH_GESPERRT";

export interface InFlightArbeit {
  readonly transaktionsId: string;
  readonly fehlerDomaeneId: string;
  readonly irreversiblerEffektMoeglich: boolean;
}

export interface StoppSicht {
  readonly status: LaufsteuerungsStatus;
  readonly neueArbeitErlaubt: boolean;
  readonly inFlight: readonly InFlightArbeit[];
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereArbeit(arbeit: InFlightArbeit): InFlightArbeit {
  return Object.freeze({ ...arbeit });
}

export class KontrollierteLaufsteuerung {
  readonly #maximaleInFlight: number;
  #status: LaufsteuerungsStatus = "LAEUFT";
  #neueArbeitErlaubt = true;
  #inFlight: readonly InFlightArbeit[] = Object.freeze([]);

  public constructor(maximaleInFlight = 256) {
    if (!Number.isInteger(maximaleInFlight) || maximaleInFlight < 1 || maximaleInFlight > 4096) {
      throw new Error("LAUFSTEUERUNG_INFLIGHT_GRENZE_UNGUELTIG");
    }
    this.#maximaleInFlight = maximaleInFlight;
  }

  public registriereInFlight(arbeit: InFlightArbeit): void {
    if (!this.#neueArbeitErlaubt) throw new Error("LAUFSTEUERUNG_KEINE_NEUE_ARBEIT");
    pruefeText(arbeit.transaktionsId, "LAUFSTEUERUNG_TRANSAKTION_ID_UNGUELTIG");
    pruefeText(arbeit.fehlerDomaeneId, "LAUFSTEUERUNG_FEHLERDOMAENE_UNGUELTIG");
    if (this.#inFlight.length >= this.#maximaleInFlight) throw new Error("LAUFSTEUERUNG_INFLIGHT_VOLL");
    if (this.#inFlight.some(x => x.transaktionsId === arbeit.transaktionsId)) {
      throw new Error("LAUFSTEUERUNG_TRANSAKTION_DOPPELT");
    }
    this.#inFlight = Object.freeze([...this.#inFlight, friereArbeit(arbeit)]);
  }

  public fordereStoppAn(): StoppSicht {
    this.#status = "STOPP_ANGEFORDERT";
    this.#neueArbeitErlaubt = false;
    this.#status = "KEINE_NEUE_ARBEIT";
    this.#status = this.#inFlight.length === 0 ? "PAUSIERT" : "ABGLEICH_LAEUFT";
    return this.sicht();
  }

  public meldeAbgleichAbgeschlossen(
    transaktionsId: string,
    terminalSicher: boolean,
  ): StoppSicht {
    if (this.#status !== "ABGLEICH_LAEUFT") {
      throw new Error("LAUFSTEUERUNG_KEIN_ABGLEICH_AKTIV");
    }
    const arbeit = this.#inFlight.find(x => x.transaktionsId === transaktionsId);
    if (arbeit === undefined) throw new Error("LAUFSTEUERUNG_TRANSAKTION_UNBEKANNT");
    if (!terminalSicher && arbeit.irreversiblerEffektMoeglich) {
      this.#status = "KRITISCH_GESPERRT";
      return this.sicht();
    }

    this.#inFlight = Object.freeze(this.#inFlight.filter(x => x.transaktionsId !== transaktionsId));
    if (this.#inFlight.length === 0) this.#status = "PAUSIERT";
    return this.sicht();
  }

  public sicht(): StoppSicht {
    return Object.freeze({
      status: this.#status,
      neueArbeitErlaubt: this.#neueArbeitErlaubt,
      inFlight: Object.freeze(this.#inFlight.map(friereArbeit)),
    });
  }
}
