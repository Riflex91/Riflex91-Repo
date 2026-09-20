import {
  gleicherPortVertrag,
  type PortVertragsReferenz,
} from "./ports.js";

export type ModulGesundheit =
  | "GESUND"
  | "BEOBACHTEN"
  | "DEGRADIERT"
  | "SICHERER_MODUS"
  | "QUARANTAENE"
  | "DEAKTIVIERT";

export interface ModulDefinition {
  readonly schemaVersion: 1;
  readonly modulId: string;
  readonly modulVersion: string;
  readonly bereitgestellteFaehigkeiten: readonly string[];
  readonly benoetigteFaehigkeiten: readonly string[];
  readonly bereitgestelltePorts: readonly PortVertragsReferenz[];
  readonly benoetigtePorts: readonly PortVertragsReferenz[];
  readonly standardAktiv: boolean;
}

export interface ModulEintrag extends ModulDefinition {
  readonly aktiv: boolean;
  readonly gesundheit: ModulGesundheit;
  readonly generation: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeKennung(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 128) throw new Error(fehler);
}

function hatDuplikate(werte: readonly string[]): boolean {
  const sortiert = [...werte].sort();
  return sortiert.some((wert, index) => index > 0 && wert === sortiert[index - 1]);
}

function portSchluessel(port: PortVertragsReferenz): string {
  return port.portId + "@" + port.vertragsVersion;
}

function frierePorts(ports: readonly PortVertragsReferenz[]): readonly PortVertragsReferenz[] {
  return Object.freeze(ports.map(port => Object.freeze({ ...port })));
}

function friereEintrag(eintrag: ModulEintrag): ModulEintrag {
  return Object.freeze({
    ...eintrag,
    bereitgestellteFaehigkeiten: Object.freeze([...eintrag.bereitgestellteFaehigkeiten]),
    benoetigteFaehigkeiten: Object.freeze([...eintrag.benoetigteFaehigkeiten]),
    bereitgestelltePorts: frierePorts(eintrag.bereitgestelltePorts),
    benoetigtePorts: frierePorts(eintrag.benoetigtePorts),
  });
}

export class ModulRegister {
  readonly #maximaleModule: number;
  #eintraege: readonly ModulEintrag[] = Object.freeze([]);
  #generation = 0;

  public constructor(maximaleModule = 256) {
    if (!Number.isInteger(maximaleModule) || maximaleModule < 1 || maximaleModule > 2048) {
      throw new Error("MODULREGISTER_GRENZE_UNGUELTIG");
    }
    this.#maximaleModule = maximaleModule;
  }

  public registriere(definition: ModulDefinition): ModulEintrag {
    this.#pruefeDefinition(definition);
    if (this.#eintraege.length >= this.#maximaleModule) {
      throw new Error("MODULREGISTER_VOLL");
    }
    if (this.#eintraege.some(eintrag =>
      eintrag.modulId === definition.modulId
      && eintrag.modulVersion === definition.modulVersion)) {
      throw new Error("MODULVERSION_DOPPELT");
    }

    this.#generation += 1;
    const eintrag = friereEintrag({
      ...definition,
      bereitgestellteFaehigkeiten: Object.freeze([...definition.bereitgestellteFaehigkeiten]),
      benoetigteFaehigkeiten: Object.freeze([...definition.benoetigteFaehigkeiten]),
      bereitgestelltePorts: frierePorts(definition.bereitgestelltePorts),
      benoetigtePorts: frierePorts(definition.benoetigtePorts),
      aktiv: false,
      gesundheit: "GESUND",
      generation: this.#generation,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, eintrag]);
    return eintrag;
  }

  public aktiviere(modulId: string, modulVersion: string): ModulEintrag {
    const eintrag = this.#finde(modulId, modulVersion);
    if (eintrag.aktiv) return eintrag;
    if (eintrag.gesundheit !== "GESUND") {
      throw new Error("MODUL_NICHT_GESUND");
    }
    if (this.#eintraege.some(kandidat =>
      kandidat.modulId === modulId
      && kandidat.aktiv
      && kandidat !== eintrag)) {
      throw new Error("MODUL_ID_BEREITS_AKTIV");
    }

    const hypothetisch = this.#eintraege.map(kandidat =>
      kandidat === eintrag ? friereEintrag({ ...kandidat, aktiv: true }) : kandidat);
    this.#pruefePortVoraussetzungen(hypothetisch, eintrag);

    return this.#ersetze(eintrag, { aktiv: true });
  }

  public deaktiviere(modulId: string, modulVersion: string): ModulEintrag {
    const eintrag = this.#finde(modulId, modulVersion);
    if (!eintrag.aktiv) return eintrag;
    return this.#ersetze(eintrag, { aktiv: false });
  }

  public setzeGesundheit(
    modulId: string,
    modulVersion: string,
    gesundheit: ModulGesundheit,
  ): ModulEintrag {
    const eintrag = this.#finde(modulId, modulVersion);
    const aktiv = gesundheit === "GESUND" || gesundheit === "BEOBACHTEN" || gesundheit === "DEGRADIERT"
      ? eintrag.aktiv
      : false;
    return this.#ersetze(eintrag, { gesundheit, aktiv });
  }

  public ersetzeAktiveVersion(
    modulId: string,
    alteVersion: string,
    neueVersion: string,
  ): ModulEintrag {
    const alt = this.#finde(modulId, alteVersion);
    const neu = this.#finde(modulId, neueVersion);
    if (!alt.aktiv) throw new Error("ALTE_MODULVERSION_NICHT_AKTIV");
    if (neu.aktiv) throw new Error("NEUE_MODULVERSION_BEREITS_AKTIV");
    if (neu.gesundheit !== "GESUND") throw new Error("NEUE_MODULVERSION_NICHT_GESUND");

    const hypothetisch = this.#eintraege.map(eintrag => {
      if (eintrag === alt) return friereEintrag({ ...eintrag, aktiv: false });
      if (eintrag === neu) return friereEintrag({ ...eintrag, aktiv: true });
      return eintrag;
    });
    this.#pruefePortVoraussetzungen(hypothetisch, neu);
    for (const kandidat of hypothetisch) {
      if (kandidat.aktiv) this.#pruefePortVoraussetzungen(hypothetisch, kandidat);
    }

    this.#generation += 1;
    const neueGeneration = this.#generation;
    const ersetzt = hypothetisch.map(eintrag => {
      if (eintrag === alt || eintrag === neu) {
        return friereEintrag({ ...eintrag, generation: neueGeneration });
      }
      return eintrag;
    });
    this.#eintraege = Object.freeze(ersetzt);
    return this.#finde(modulId, neueVersion);
  }

  public aktiveVersion(modulId: string): ModulEintrag | undefined {
    return this.#eintraege.find(eintrag => eintrag.modulId === modulId && eintrag.aktiv);
  }

  public sicht(): readonly ModulEintrag[] {
    return Object.freeze(
      this.#eintraege
        .map(eintrag => friereEintrag(eintrag))
        .sort((a, b) =>
          a.modulId.localeCompare(b.modulId)
          || a.modulVersion.localeCompare(b.modulVersion)),
    );
  }

  #pruefePortVoraussetzungen(
    eintraege: readonly ModulEintrag[],
    modul: ModulEintrag,
  ): void {
    for (const benoetigt of modul.benoetigtePorts) {
      const vorhanden = eintraege.some(anbieter =>
        anbieter.aktiv
        && anbieter !== modul
        && anbieter.bereitgestelltePorts.some(port => gleicherPortVertrag(port, benoetigt)));
      if (!vorhanden) {
        throw new Error("MODUL_PORT_VORAUSSETZUNG_FEHLT:" + portSchluessel(benoetigt));
      }
    }
  }

  #finde(modulId: string, modulVersion: string): ModulEintrag {
    const eintrag = this.#eintraege.find(kandidat =>
      kandidat.modulId === modulId
      && kandidat.modulVersion === modulVersion);
    if (eintrag === undefined) throw new Error("MODULVERSION_UNBEKANNT");
    return eintrag;
  }

  #ersetze(
    alt: ModulEintrag,
    aenderung: Partial<Pick<ModulEintrag, "aktiv" | "gesundheit">>,
  ): ModulEintrag {
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

  #pruefeDefinition(definition: ModulDefinition): void {
    if (definition.schemaVersion !== 1) throw new Error("MODUL_SCHEMA_UNGUELTIG");
    pruefeKennung(definition.modulId, "MODUL_KENNUNG_UNGUELTIG");
    pruefeKennung(definition.modulVersion, "MODUL_VERSION_UNGUELTIG");
    if (definition.standardAktiv) {
      throw new Error("R7_MODUL_STANDARD_AKTIV_VERBOTEN");
    }
    if (definition.bereitgestellteFaehigkeiten.length > 128
        || definition.benoetigteFaehigkeiten.length > 128
        || definition.bereitgestelltePorts.length > 128
        || definition.benoetigtePorts.length > 128) {
      throw new Error("MODUL_VERTRAG_ZU_GROSS");
    }
    if (hatDuplikate(definition.bereitgestellteFaehigkeiten)
        || hatDuplikate(definition.benoetigteFaehigkeiten)
        || hatDuplikate(definition.bereitgestelltePorts.map(portSchluessel))
        || hatDuplikate(definition.benoetigtePorts.map(portSchluessel))) {
      throw new Error("MODUL_VERTRAG_DOPPELT");
    }
    for (const port of [...definition.bereitgestelltePorts, ...definition.benoetigtePorts]) {
      pruefeKennung(port.portId, "PORT_KENNUNG_UNGUELTIG");
      pruefeKennung(port.vertragsVersion, "PORT_VERSION_UNGUELTIG");
    }
  }
}
