export interface GoldReservierung {
  readonly reservierungsId: string;
  readonly ablaufId: string;
  readonly betrag: number;
  readonly zweck: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeGold(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

export class GoldBudgetLedger {
  #beobachtetesGold = 0;
  #sicherheitsReserve = 0;
  #reservierungen: readonly GoldReservierung[] = Object.freeze([]);

  public aktualisiereBeobachtung(gold: number, sicherheitsReserve: number): void {
    pruefeGold(gold, "GOLD_BEOBACHTUNG_UNGUELTIG");
    pruefeGold(sicherheitsReserve, "GOLD_RESERVE_UNGUELTIG");
    if (sicherheitsReserve > gold) throw new Error("GOLD_RESERVE_UEBER_BESTAND");
    this.#beobachtetesGold = gold;
    this.#sicherheitsReserve = sicherheitsReserve;
    if (this.#reserviert() > this.verfuegbar()) {
      throw new Error("GOLD_BESTAND_UNTER_AKTIVEN_RESERVIERUNGEN");
    }
  }

  public reserviere(
    reservierungsId: string,
    ablaufId: string,
    betrag: number,
    zweck: string,
  ): GoldReservierung {
    pruefeText(reservierungsId, "GOLD_RESERVIERUNG_ID_UNGUELTIG");
    pruefeText(ablaufId, "GOLD_RESERVIERUNG_ABLAUF_UNGUELTIG");
    pruefeText(zweck, "GOLD_RESERVIERUNG_ZWECK_UNGUELTIG");
    pruefeGold(betrag, "GOLD_RESERVIERUNG_BETRAG_UNGUELTIG");
    if (betrag < 1) throw new Error("GOLD_RESERVIERUNG_BETRAG_UNGUELTIG");
    if (this.#reservierungen.some(x => x.reservierungsId === reservierungsId)) {
      throw new Error("GOLD_RESERVIERUNG_DOPPELT");
    }
    if (betrag > this.verfuegbarNachReservierungen()) {
      throw new Error("GOLD_BUDGET_NICHT_VERFUEGBAR");
    }
    const reservierung = Object.freeze({ reservierungsId, ablaufId, betrag, zweck });
    this.#reservierungen = Object.freeze([...this.#reservierungen, reservierung]);
    return reservierung;
  }

  public gibFrei(reservierungsId: string): void {
    if (!this.#reservierungen.some(x => x.reservierungsId === reservierungsId)) {
      throw new Error("GOLD_RESERVIERUNG_UNBEKANNT");
    }
    this.#reservierungen = Object.freeze(
      this.#reservierungen.filter(x => x.reservierungsId !== reservierungsId),
    );
  }

  public verfuegbar(): number {
    return Math.max(0, this.#beobachtetesGold - this.#sicherheitsReserve);
  }

  public verfuegbarNachReservierungen(): number {
    return Math.max(0, this.verfuegbar() - this.#reserviert());
  }

  public sicht(): Readonly<{
    beobachtetesGold: number;
    sicherheitsReserve: number;
    reserviert: number;
    verfuegbarNachReservierungen: number;
  }> {
    return Object.freeze({
      beobachtetesGold: this.#beobachtetesGold,
      sicherheitsReserve: this.#sicherheitsReserve,
      reserviert: this.#reserviert(),
      verfuegbarNachReservierungen: this.verfuegbarNachReservierungen(),
    });
  }

  #reserviert(): number {
    return this.#reservierungen.reduce((summe, x) => summe + x.betrag, 0);
  }
}
