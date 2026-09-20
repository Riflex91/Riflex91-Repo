import {
  physischeGegenstandsKennung,
  type PhysischeGegenstandsIdentitaet,
} from "./gegenstands-identitaet.js";

export type GegenstandsDisposition =
  | "BEHALTEN"
  | "BANK"
  | "NPC_VERKAUF"
  | "MARKT_VERKAUF"
  | "UPGRADE"
  | "COMPOUND"
  | "DELIVERY"
  | "VERBRAUCH"
  | "QUARANTAENE";

export interface DispositionsEintrag {
  readonly physischeKennung: string;
  readonly identitaet: PhysischeGegenstandsIdentitaet;
  readonly disposition: GegenstandsDisposition;
  readonly begruendung: string;
  readonly policyVersion: string;
}

export interface GegenstandsReservierung {
  readonly reservierungsId: string;
  readonly physischeKennung: string;
  readonly ablaufId: string;
  readonly zweck: GegenstandsDisposition;
  readonly menge: number;
  readonly beobachtungsFingerprint: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export class GegenstandsDispositionsLedger {
  readonly #maximaleEintraege: number;
  #eintraege: readonly DispositionsEintrag[] = Object.freeze([]);
  #reservierungen: readonly GegenstandsReservierung[] = Object.freeze([]);

  public constructor(maximaleEintraege = 1024) {
    if (!Number.isInteger(maximaleEintraege)
        || maximaleEintraege < 1
        || maximaleEintraege > 8192) {
      throw new Error("DISPOSITION_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximaleEintraege = maximaleEintraege;
  }

  public setze(eintrag: Omit<DispositionsEintrag, "physischeKennung">): DispositionsEintrag {
    pruefeText(eintrag.begruendung, "DISPOSITION_BEGRUENDUNG_UNGUELTIG");
    pruefeText(eintrag.policyVersion, "DISPOSITION_POLICY_VERSION_UNGUELTIG");
    const physischeKennung = physischeGegenstandsKennung(eintrag.identitaet);
    const vorhanden = this.#eintraege.find(x => x.physischeKennung === physischeKennung);
    if (vorhanden === undefined && this.#eintraege.length >= this.#maximaleEintraege) {
      throw new Error("DISPOSITION_LEDGER_VOLL");
    }
    const neu = Object.freeze({ ...eintrag, physischeKennung });
    this.#eintraege = Object.freeze(
      vorhanden === undefined
        ? [...this.#eintraege, neu]
        : this.#eintraege.map(x => x.physischeKennung === physischeKennung ? neu : x),
    );
    return neu;
  }

  public lies(identitaet: PhysischeGegenstandsIdentitaet): DispositionsEintrag {
    const kennung = physischeGegenstandsKennung(identitaet);
    const eintrag = this.#eintraege.find(x => x.physischeKennung === kennung);
    if (eintrag === undefined) throw new Error("DISPOSITION_FEHLT:" + kennung);
    return Object.freeze({ ...eintrag, identitaet: Object.freeze({ ...eintrag.identitaet }) });
  }

  public reserviere(
    reservierungsId: string,
    ablaufId: string,
    identitaet: PhysischeGegenstandsIdentitaet,
    zweck: GegenstandsDisposition,
    menge: number,
  ): GegenstandsReservierung {
    pruefeText(reservierungsId, "ITEM_RESERVIERUNG_ID_UNGUELTIG");
    pruefeText(ablaufId, "ITEM_RESERVIERUNG_ABLAUF_UNGUELTIG");
    if (!Number.isInteger(menge) || menge < 1 || menge > identitaet.menge) {
      throw new Error("ITEM_RESERVIERUNG_MENGE_UNGUELTIG");
    }
    if (this.#reservierungen.some(x => x.reservierungsId === reservierungsId)) {
      throw new Error("ITEM_RESERVIERUNG_ID_DOPPELT");
    }
    if (this.#reservierungen.length >= this.#maximaleEintraege) {
      throw new Error("ITEM_RESERVIERUNGEN_VOLL");
    }

    const disposition = this.lies(identitaet);
    if (disposition.disposition !== zweck) {
      throw new Error(
        "ITEM_DISPOSITION_VERBIETET_ZWECK:"
        + disposition.disposition + ":" + zweck,
      );
    }
    const physischeKennung = disposition.physischeKennung;
    const bereitsReserviert = this.#reservierungen
      .filter(x => x.physischeKennung === physischeKennung)
      .reduce((summe, x) => summe + x.menge, 0);
    if (bereitsReserviert + menge > identitaet.menge) {
      throw new Error("ITEM_PHYSISCHE_MENGE_BEREITS_RESERVIERT");
    }

    const reservierung = Object.freeze({
      reservierungsId,
      physischeKennung,
      ablaufId,
      zweck,
      menge,
      beobachtungsFingerprint: identitaet.beobachtungsFingerprint,
    });
    this.#reservierungen = Object.freeze([...this.#reservierungen, reservierung]);
    return reservierung;
  }

  public validiere(
    reservierung: GegenstandsReservierung,
    identitaet: PhysischeGegenstandsIdentitaet,
  ): boolean {
    const kennung = physischeGegenstandsKennung(identitaet);
    return kennung === reservierung.physischeKennung
      && reservierung.beobachtungsFingerprint === identitaet.beobachtungsFingerprint
      && this.#reservierungen.some(x =>
        x.reservierungsId === reservierung.reservierungsId
        && x.physischeKennung === reservierung.physischeKennung
        && x.ablaufId === reservierung.ablaufId
        && x.zweck === reservierung.zweck
        && x.menge === reservierung.menge);
  }

  public gibFrei(reservierungsId: string): void {
    if (!this.#reservierungen.some(x => x.reservierungsId === reservierungsId)) {
      throw new Error("ITEM_RESERVIERUNG_UNBEKANNT");
    }
    this.#reservierungen = Object.freeze(
      this.#reservierungen.filter(x => x.reservierungsId !== reservierungsId),
    );
  }

  public reservierungen(): readonly GegenstandsReservierung[] {
    return Object.freeze(
      [...this.#reservierungen]
        .sort((a, b) => a.reservierungsId.localeCompare(b.reservierungsId))
        .map(x => Object.freeze({ ...x })),
    );
  }
}
