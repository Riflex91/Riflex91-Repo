import {
  type WiederholungsRichtlinie,
  validiereWiederholungsRichtlinie,
} from "./workflow-vertrag.js";

export type WiederholungsGrund =
  | "ERLAUBT"
  | "VERSUCHE_AUSGESCHOEPFT"
  | "ZEITBUDGET_AUSGESCHOEPFT"
  | "CIRCUIT_OFFEN"
  | "MOEGLICHER_SEND_ABGLEICH_ERFORDERLICH";

export interface WiederholungsEntscheidung {
  readonly erlaubt: boolean;
  readonly grund: WiederholungsGrund;
  readonly naechsterVersuchNachMs: number | null;
}

export function bewerteWiederholung(
  richtlinie: WiederholungsRichtlinie,
  versuch: number,
  vergangenMs: number,
  circuitErlaubt: boolean,
  moeglicherSend: boolean,
): WiederholungsEntscheidung {
  validiereWiederholungsRichtlinie(richtlinie);
  if (!Number.isInteger(versuch) || versuch < 1) throw new Error("RETRY_VERSUCH_UNGUELTIG");
  if (!Number.isSafeInteger(vergangenMs) || vergangenMs < 0) {
    throw new Error("RETRY_VERGANGENE_ZEIT_UNGUELTIG");
  }
  if (moeglicherSend) {
    return Object.freeze({
      erlaubt: false,
      grund: "MOEGLICHER_SEND_ABGLEICH_ERFORDERLICH",
      naechsterVersuchNachMs: null,
    });
  }
  if (!circuitErlaubt) {
    return Object.freeze({
      erlaubt: false,
      grund: "CIRCUIT_OFFEN",
      naechsterVersuchNachMs: null,
    });
  }
  if (versuch >= richtlinie.maximaleVersuche) {
    return Object.freeze({
      erlaubt: false,
      grund: "VERSUCHE_AUSGESCHOEPFT",
      naechsterVersuchNachMs: null,
    });
  }
  if (vergangenMs >= richtlinie.maximaleDauerMs) {
    return Object.freeze({
      erlaubt: false,
      grund: "ZEITBUDGET_AUSGESCHOEPFT",
      naechsterVersuchNachMs: null,
    });
  }

  const potenz = Math.max(0, versuch - 1);
  const backoff = Math.min(
    richtlinie.maximalerBackoffMs,
    Math.floor(richtlinie.anfangsBackoffMs * (richtlinie.backoffFaktor ** potenz)),
  );
  if (vergangenMs + backoff > richtlinie.maximaleDauerMs) {
    return Object.freeze({
      erlaubt: false,
      grund: "ZEITBUDGET_AUSGESCHOEPFT",
      naechsterVersuchNachMs: null,
    });
  }
  return Object.freeze({
    erlaubt: true,
    grund: "ERLAUBT",
    naechsterVersuchNachMs: backoff,
  });
}

export type CircuitStatus = "GESCHLOSSEN" | "OFFEN" | "HALBOFFEN";

export interface CircuitSicht {
  readonly schluessel: string;
  readonly status: CircuitStatus;
  readonly fehlerAnzahl: number;
  readonly offenBisMs: number | null;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereCircuit(eintrag: CircuitSicht): CircuitSicht {
  return Object.freeze({ ...eintrag });
}

export class BegrenztesCircuitRegister {
  readonly #maximaleCircuits: number;
  #eintraege: readonly CircuitSicht[] = Object.freeze([]);

  public constructor(maximaleCircuits = 512) {
    if (!Number.isInteger(maximaleCircuits)
        || maximaleCircuits < 1
        || maximaleCircuits > 4096) {
      throw new Error("CIRCUIT_REGISTER_GRENZE_UNGUELTIG");
    }
    this.#maximaleCircuits = maximaleCircuits;
  }

  public darfVersuch(schluessel: string, jetztMs: number): boolean {
    pruefeText(schluessel, "CIRCUIT_SCHLUESSEL_UNGUELTIG");
    this.#pruefeZeit(jetztMs);
    const eintrag = this.#eintraege.find(x => x.schluessel === schluessel);
    if (eintrag === undefined || eintrag.status === "GESCHLOSSEN") return true;
    if (eintrag.status === "HALBOFFEN") return true;
    if (eintrag.offenBisMs !== null && jetztMs >= eintrag.offenBisMs) {
      this.#ersetze(eintrag, {
        ...eintrag,
        status: "HALBOFFEN",
        offenBisMs: null,
      });
      return true;
    }
    return false;
  }

  public meldeFehler(
    schluessel: string,
    jetztMs: number,
    schwelle: number,
    offenDauerMs: number,
  ): CircuitSicht {
    pruefeText(schluessel, "CIRCUIT_SCHLUESSEL_UNGUELTIG");
    this.#pruefeZeit(jetztMs);
    if (!Number.isInteger(schwelle) || schwelle < 1 || schwelle > 64) {
      throw new Error("CIRCUIT_SCHWELLE_UNGUELTIG");
    }
    if (!Number.isSafeInteger(offenDauerMs) || offenDauerMs < 1 || offenDauerMs > 86_400_000) {
      throw new Error("CIRCUIT_OFFEN_DAUER_UNGUELTIG");
    }

    const alt = this.#eintraege.find(x => x.schluessel === schluessel);
    if (alt === undefined && this.#eintraege.length >= this.#maximaleCircuits) {
      throw new Error("CIRCUIT_REGISTER_VOLL");
    }
    const fehlerAnzahl = (alt?.fehlerAnzahl ?? 0) + 1;
    const offen = fehlerAnzahl >= schwelle;
    const neu = friereCircuit({
      schluessel,
      status: offen ? "OFFEN" : "GESCHLOSSEN",
      fehlerAnzahl,
      offenBisMs: offen ? jetztMs + offenDauerMs : null,
    });
    if (alt === undefined) this.#eintraege = Object.freeze([...this.#eintraege, neu]);
    else this.#ersetze(alt, neu);
    return neu;
  }

  public meldeErfolg(schluessel: string): CircuitSicht {
    pruefeText(schluessel, "CIRCUIT_SCHLUESSEL_UNGUELTIG");
    const alt = this.#eintraege.find(x => x.schluessel === schluessel);
    const neu = friereCircuit({
      schluessel,
      status: "GESCHLOSSEN",
      fehlerAnzahl: 0,
      offenBisMs: null,
    });
    if (alt === undefined) {
      if (this.#eintraege.length >= this.#maximaleCircuits) {
        throw new Error("CIRCUIT_REGISTER_VOLL");
      }
      this.#eintraege = Object.freeze([...this.#eintraege, neu]);
    } else {
      this.#ersetze(alt, neu);
    }
    return neu;
  }

  public sicht(): readonly CircuitSicht[] {
    return Object.freeze(
      this.#eintraege
        .map(eintrag => friereCircuit(eintrag))
        .sort((a, b) => a.schluessel.localeCompare(b.schluessel)),
    );
  }

  #ersetze(alt: CircuitSicht, neu: CircuitSicht): void {
    const gefroren = friereCircuit(neu);
    this.#eintraege = Object.freeze(this.#eintraege.map(x => x === alt ? gefroren : x));
  }

  #pruefeZeit(jetztMs: number): void {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("CIRCUIT_ZEIT_UNGUELTIG");
    }
  }
}
