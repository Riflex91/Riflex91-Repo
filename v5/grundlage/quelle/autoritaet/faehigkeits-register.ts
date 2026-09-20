export type FaehigkeitsModus = "LESEN" | "PLANEN" | "MUTIEREN";
export type FaehigkeitsStatus =
  | "VERFUEGBAR"
  | "DEGRADIERT"
  | "QUARANTAENE"
  | "DEAKTIVIERT"
  | "UNBEKANNT";

export interface FaehigkeitsAnbieterDefinition {
  readonly schemaVersion: 1;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly modus: FaehigkeitsModus;
  readonly status: FaehigkeitsStatus;
  readonly standardAktiv: boolean;
}

export interface FaehigkeitsEintrag extends FaehigkeitsAnbieterDefinition {
  readonly aktiv: boolean;
  readonly generation: number;
}

function pruefeKennung(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 128) {
    throw new Error(fehler);
  }
}

function friereEintrag(eintrag: FaehigkeitsEintrag): FaehigkeitsEintrag {
  return Object.freeze({ ...eintrag });
}

export class FaehigkeitsRegister {
  readonly #maximaleEintraege: number;
  #eintraege: readonly FaehigkeitsEintrag[] = Object.freeze([]);
  #generation = 0;

  public constructor(maximaleEintraege = 512) {
    if (!Number.isInteger(maximaleEintraege) || maximaleEintraege < 1 || maximaleEintraege > 4096) {
      throw new Error("FAEHIGKEITSREGISTER_GRENZE_UNGUELTIG");
    }
    this.#maximaleEintraege = maximaleEintraege;
  }

  public registriere(definition: FaehigkeitsAnbieterDefinition): FaehigkeitsEintrag {
    this.#pruefeDefinition(definition);
    if (this.#eintraege.length >= this.#maximaleEintraege) {
      throw new Error("FAEHIGKEITSREGISTER_VOLL");
    }

    const gleicheFaehigkeit = this.#eintraege.filter(
      eintrag => eintrag.faehigkeitId === definition.faehigkeitId,
    );
    if (gleicheFaehigkeit.some(eintrag => eintrag.modus !== definition.modus)) {
      throw new Error("FAEHIGKEITS_MODUS_WIDERSPRUCH");
    }
    if (gleicheFaehigkeit.some(eintrag =>
      eintrag.anbieterModulId === definition.anbieterModulId
      && eintrag.anbieterVersion === definition.anbieterVersion)) {
      throw new Error("FAEHIGKEITS_ANBIETER_DOPPELT");
    }
    if (definition.modus === "MUTIEREN" && gleicheFaehigkeit.length > 0) {
      throw new Error("MUTIERENDER_OWNER_BEREITS_VERGEBEN");
    }

    this.#generation += 1;
    const aktiv = definition.modus === "MUTIEREN"
      ? false
      : definition.standardAktiv && definition.status === "VERFUEGBAR";
    const eintrag = friereEintrag({
      ...definition,
      aktiv,
      generation: this.#generation,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, eintrag]);
    return eintrag;
  }

  public ersetzeMutierendenAnbieter(
    faehigkeitId: string,
    erwarteterAnbieterModulId: string,
    ersatz: FaehigkeitsAnbieterDefinition,
  ): FaehigkeitsEintrag {
    const index = this.#eintraege.findIndex(eintrag =>
      eintrag.faehigkeitId === faehigkeitId
      && eintrag.modus === "MUTIEREN");
    if (index < 0) throw new Error("MUTIERENDER_OWNER_FEHLT");

    const alt = this.#eintraege[index];
    if (alt === undefined) throw new Error("MUTIERENDER_OWNER_FEHLT");
    if (alt.anbieterModulId !== erwarteterAnbieterModulId) {
      throw new Error("MUTIERENDER_OWNER_STIMMT_NICHT");
    }
    if (alt.aktiv) throw new Error("MUTIERENDER_OWNER_NOCH_AKTIV");
    if (ersatz.faehigkeitId !== faehigkeitId || ersatz.modus !== "MUTIEREN") {
      throw new Error("MUTIERENDER_ERSATZ_UNGUELTIG");
    }

    this.#pruefeDefinition(ersatz);
    this.#generation += 1;
    const neu = friereEintrag({
      ...ersatz,
      status: "DEAKTIVIERT",
      standardAktiv: false,
      aktiv: false,
      generation: this.#generation,
    });
    this.#eintraege = Object.freeze(this.#eintraege.map(
      (eintrag, eintragIndex) => eintragIndex === index ? neu : eintrag,
    ));
    return neu;
  }

  public aktiviereNichtMutierend(
    faehigkeitId: string,
    anbieterModulId: string,
  ): FaehigkeitsEintrag {
    const eintrag = this.#finde(faehigkeitId, anbieterModulId);
    if (eintrag.modus === "MUTIEREN") {
      throw new Error("R7_MUTIERENDE_AKTIVIERUNG_GESPERRT");
    }
    if (eintrag.status !== "VERFUEGBAR") {
      throw new Error("FAEHIGKEIT_NICHT_VERFUEGBAR");
    }
    return this.#ersetze(eintrag, { aktiv: true });
  }

  public deaktiviere(
    faehigkeitId: string,
    anbieterModulId: string,
  ): FaehigkeitsEintrag {
    const eintrag = this.#finde(faehigkeitId, anbieterModulId);
    return this.#ersetze(eintrag, { aktiv: false });
  }

  public setzeStatus(
    faehigkeitId: string,
    anbieterModulId: string,
    status: FaehigkeitsStatus,
  ): FaehigkeitsEintrag {
    const eintrag = this.#finde(faehigkeitId, anbieterModulId);
    const aktiv = status === "VERFUEGBAR" ? eintrag.aktiv : false;
    return this.#ersetze(eintrag, { status, aktiv });
  }

  public mutierenderAnbieter(faehigkeitId: string): FaehigkeitsEintrag | undefined {
    return this.#eintraege.find(eintrag =>
      eintrag.faehigkeitId === faehigkeitId
      && eintrag.modus === "MUTIEREN");
  }

  public sicht(): readonly FaehigkeitsEintrag[] {
    return Object.freeze(
      this.#eintraege
        .map(eintrag => friereEintrag(eintrag))
        .sort((a, b) =>
          a.faehigkeitId.localeCompare(b.faehigkeitId)
          || a.anbieterModulId.localeCompare(b.anbieterModulId)
          || a.anbieterVersion.localeCompare(b.anbieterVersion)),
    );
  }

  #finde(faehigkeitId: string, anbieterModulId: string): FaehigkeitsEintrag {
    const eintrag = this.#eintraege.find(kandidat =>
      kandidat.faehigkeitId === faehigkeitId
      && kandidat.anbieterModulId === anbieterModulId);
    if (eintrag === undefined) throw new Error("FAEHIGKEITS_ANBIETER_UNBEKANNT");
    return eintrag;
  }

  #ersetze(
    alt: FaehigkeitsEintrag,
    aenderung: Pick<FaehigkeitsEintrag, "aktiv"> & Partial<Pick<FaehigkeitsEintrag, "status">>,
  ): FaehigkeitsEintrag {
    this.#generation += 1;
    const neu = friereEintrag({
      ...alt,
      ...aenderung,
      generation: this.#generation,
    });
    this.#eintraege = Object.freeze(this.#eintraege.map(
      eintrag => eintrag === alt ? neu : eintrag,
    ));
    return neu;
  }

  #pruefeDefinition(definition: FaehigkeitsAnbieterDefinition): void {
    if (definition.schemaVersion !== 1) {
      throw new Error("FAEHIGKEITS_SCHEMA_UNGUELTIG");
    }
    pruefeKennung(definition.faehigkeitId, "FAEHIGKEITS_KENNUNG_UNGUELTIG");
    pruefeKennung(definition.anbieterModulId, "ANBIETER_MODUL_KENNUNG_UNGUELTIG");
    pruefeKennung(definition.anbieterVersion, "ANBIETER_VERSION_UNGUELTIG");
    if (definition.modus === "MUTIEREN" && definition.standardAktiv) {
      throw new Error("MUTIERENDE_FAEHIGKEIT_STANDARD_AKTIV_VERBOTEN");
    }
  }
}
