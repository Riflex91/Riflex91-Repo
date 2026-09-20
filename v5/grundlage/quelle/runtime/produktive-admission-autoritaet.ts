import {
  BedienerRichtlinienDienst,
  type BedienerDenyBefehl,
  type BedienerProtokollPort,
  type BedienerRichtlinienSnapshot,
} from "../autoritaet/bediener-richtlinie.js";
import {
  FaehigkeitsRegister,
  type FaehigkeitsEintrag,
} from "../autoritaet/faehigkeits-register.js";
import {
  ModulRegister,
  type ModulEintrag,
} from "../autoritaet/modul-register.js";
import type {
  AktionsVertragsNachweis,
  AktionsVertragsPort,
  FaehigkeitsAutoritaetsNachweis,
  FaehigkeitsAutoritaetsPort,
  OperatorNachweis,
  OperatorRichtlinienPort,
} from "../ausfuehrung/ports.js";
import type {
  ProduktionsGesamtfreigabeBewertung,
} from "./gesamtfreigabe-gate.js";

export interface GlobaleAktivierungsfreigabePort {
  bewertung(): ProduktionsGesamtfreigabeBewertung;
}

export interface MutierendeProduktionsAktivierung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly gesamtfreigabeNachweisId: string;
  readonly zweck: string;
}

export interface AktiveMutationsAutoritaet extends MutierendeProduktionsAktivierung {
  readonly faehigkeitsGeneration: number;
  readonly modulGeneration: number;
  readonly operatorGeneration: number;
  readonly autoritaetsGeneration: number;
}

export interface ProduktiveAktionsVertragsDefinition {
  readonly schemaVersion: 1;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
  readonly produktivErlaubt: boolean;
  readonly invariantenKennungen: readonly string[];
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) {
    throw new Error(fehler);
  }
}

function hatDuplikate(werte: readonly string[]): boolean {
  const sortiert = [...werte].sort();
  return sortiert.some((wert, index) =>
    index > 0 && wert === sortiert[index - 1]);
}

function friereAktivierung(
  wert: AktiveMutationsAutoritaet,
): AktiveMutationsAutoritaet {
  return Object.freeze({ ...wert });
}

function pruefeProvider(
  provider: FaehigkeitsEintrag | undefined,
  anfrage: MutierendeProduktionsAktivierung,
): FaehigkeitsEintrag {
  if (provider === undefined) {
    throw new Error("PRODUKTIVE_MUTATIONS_FAEHIGKEIT_UNBEKANNT");
  }
  if (provider.modus !== "MUTIEREN"
      || provider.faehigkeitId !== anfrage.faehigkeitId
      || provider.anbieterModulId !== anfrage.anbieterModulId
      || provider.anbieterVersion !== anfrage.anbieterVersion) {
    throw new Error("PRODUKTIVE_MUTATIONS_PROVIDER_BINDUNG_UNGUELTIG");
  }
  if (provider.status !== "VERFUEGBAR") {
    throw new Error("PRODUKTIVE_MUTATIONS_PROVIDER_NICHT_VERFUEGBAR");
  }
  return provider;
}

function pruefeAktivesModul(
  modul: ModulEintrag | undefined,
  anfrage: MutierendeProduktionsAktivierung,
): ModulEintrag {
  if (modul === undefined
      || modul.modulVersion !== anfrage.anbieterVersion
      || !modul.aktiv
      || modul.gesundheit !== "GESUND") {
    throw new Error("PRODUKTIVE_MUTATIONS_MODUL_NICHT_AKTIV_GESUND");
  }
  return modul;
}

export class ProduktiveBedienerRichtlinie implements OperatorRichtlinienPort {
  readonly #dienst: BedienerRichtlinienDienst;
  #generation = 1;

  public constructor(
    protokoll: BedienerProtokollPort,
    maximaleSperren = 256,
  ) {
    this.#dienst = new BedienerRichtlinienDienst(
      protokoll,
      maximaleSperren,
    );
  }

  public pruefe(faehigkeitId: string): OperatorNachweis {
    pruefeText(
      faehigkeitId,
      "PRODUKTIVE_BEDIENER_FAEHIGKEIT_UNGUELTIG",
    );
    return Object.freeze({
      erlaubt: this.#dienst.istErlaubt(faehigkeitId),
      generation: this.#generation,
    });
  }

  public async wendeDenyAn(
    befehl: BedienerDenyBefehl,
  ): Promise<BedienerRichtlinienSnapshot> {
    const snapshot = await this.#dienst.wendeDenyAn(befehl);
    this.#generation += 1;
    return snapshot;
  }

  public snapshot(): BedienerRichtlinienSnapshot {
    return this.#dienst.snapshot();
  }
}

export class ProduktiveFaehigkeitsAutoritaet
implements FaehigkeitsAutoritaetsPort {
  readonly #faehigkeiten: FaehigkeitsRegister;
  readonly #module: ModulRegister;
  readonly #operator: OperatorRichtlinienPort;
  readonly #gesamtfreigabe: GlobaleAktivierungsfreigabePort;
  readonly #maximaleAktivierungen: number;

  #aktivierungen: readonly AktiveMutationsAutoritaet[] =
    Object.freeze([]);
  #generation = 1;

  public constructor(
    faehigkeiten: FaehigkeitsRegister,
    module: ModulRegister,
    operator: OperatorRichtlinienPort,
    gesamtfreigabe: GlobaleAktivierungsfreigabePort,
    maximaleAktivierungen = 512,
  ) {
    if (!Number.isInteger(maximaleAktivierungen)
        || maximaleAktivierungen < 1
        || maximaleAktivierungen > 4096) {
      throw new Error("PRODUKTIVE_MUTATIONS_AKTIVIERUNGSGRENZE_UNGUELTIG");
    }
    this.#faehigkeiten = faehigkeiten;
    this.#module = module;
    this.#operator = operator;
    this.#gesamtfreigabe = gesamtfreigabe;
    this.#maximaleAktivierungen = maximaleAktivierungen;
  }

  public aktiviere(
    anfrage: MutierendeProduktionsAktivierung,
  ): AktiveMutationsAutoritaet {
    this.#pruefeAktivierungsAnfrage(anfrage);
    if (this.#aktivierungen.length >= this.#maximaleAktivierungen) {
      throw new Error("PRODUKTIVE_MUTATIONS_AKTIVIERUNGEN_VOLL");
    }
    if (this.#aktivierungen.some(x =>
      x.aktivierungsId === anfrage.aktivierungsId)) {
      throw new Error("PRODUKTIVE_MUTATIONS_AKTIVIERUNG_ID_DOPPELT");
    }
    if (this.#aktivierungen.some(x =>
      x.faehigkeitId === anfrage.faehigkeitId)) {
      throw new Error("PRODUKTIVE_MUTATIONS_FAEHIGKEIT_BEREITS_AKTIV");
    }

    const gesamtfreigabe = this.#gesamtfreigabe.bewertung();
    if (!gesamtfreigabe.erlaubt
        || gesamtfreigabe.releaseCandidateSha === null
        || gesamtfreigabe.nachweisId !== anfrage.gesamtfreigabeNachweisId) {
      throw new Error("PRODUKTIVE_MUTATIONS_GESAMTFREIGABE_UNGUELTIG");
    }

    const provider = pruefeProvider(
      this.#faehigkeiten.mutierenderAnbieter(anfrage.faehigkeitId),
      anfrage,
    );
    const modul = pruefeAktivesModul(
      this.#module.aktiveVersion(anfrage.anbieterModulId),
      anfrage,
    );
    const operator = this.#operator.pruefe(anfrage.faehigkeitId);
    if (!operator.erlaubt) {
      throw new Error("PRODUKTIVE_MUTATIONS_OPERATOR_DENY");
    }

    this.#generation += 1;
    const aktivierung = friereAktivierung({
      ...anfrage,
      faehigkeitsGeneration: provider.generation,
      modulGeneration: modul.generation,
      operatorGeneration: operator.generation,
      autoritaetsGeneration: this.#generation,
    });
    this.#aktivierungen = Object.freeze([
      ...this.#aktivierungen,
      aktivierung,
    ]);
    return aktivierung;
  }

  public deaktiviere(
    faehigkeitId: string,
    anbieterModulId: string,
    grund: string,
  ): void {
    pruefeText(
      faehigkeitId,
      "PRODUKTIVE_MUTATIONS_FAEHIGKEIT_UNGUELTIG",
    );
    pruefeText(
      anbieterModulId,
      "PRODUKTIVE_MUTATIONS_MODUL_UNGUELTIG",
    );
    pruefeText(
      grund,
      "PRODUKTIVE_MUTATIONS_DEAKTIVIERUNGSGRUND_UNGUELTIG",
    );
    const vorhanden = this.#aktivierungen.some(x =>
      x.faehigkeitId === faehigkeitId
      && x.anbieterModulId === anbieterModulId);
    if (!vorhanden) return;
    this.#generation += 1;
    this.#aktivierungen = Object.freeze(
      this.#aktivierungen.filter(x =>
        x.faehigkeitId !== faehigkeitId
        || x.anbieterModulId !== anbieterModulId),
    );
  }

  public pruefe(
    faehigkeitId: string,
    eigentuemerModulId: string,
  ): FaehigkeitsAutoritaetsNachweis {
    const provider =
      this.#faehigkeiten.mutierenderAnbieter(faehigkeitId);
    const mutierend = provider?.modus === "MUTIEREN";
    const aktivierung = this.#aktivierungen.find(x =>
      x.faehigkeitId === faehigkeitId
      && x.anbieterModulId === eigentuemerModulId);

    if (provider === undefined
        || aktivierung === undefined
        || !mutierend) {
      return Object.freeze({
        erlaubt: false,
        mutierend,
        generation: this.#generation,
      });
    }

    const modul = this.#module.aktiveVersion(eigentuemerModulId);
    const operator = this.#operator.pruefe(faehigkeitId);
    const gesamtfreigabe = this.#gesamtfreigabe.bewertung();

    const erlaubt = provider.status === "VERFUEGBAR"
      && provider.anbieterModulId === aktivierung.anbieterModulId
      && provider.anbieterVersion === aktivierung.anbieterVersion
      && provider.generation === aktivierung.faehigkeitsGeneration
      && modul !== undefined
      && modul.aktiv
      && modul.gesundheit === "GESUND"
      && modul.modulVersion === aktivierung.anbieterVersion
      && modul.generation === aktivierung.modulGeneration
      && operator.erlaubt
      && operator.generation === aktivierung.operatorGeneration
      && gesamtfreigabe.erlaubt
      && gesamtfreigabe.nachweisId ===
        aktivierung.gesamtfreigabeNachweisId;

    return Object.freeze({
      erlaubt,
      mutierend: true,
      generation: Math.max(
        this.#generation,
        provider.generation,
        modul?.generation ?? 0,
        operator.generation,
      ),
    });
  }

  public sicht(): readonly AktiveMutationsAutoritaet[] {
    return Object.freeze(
      this.#aktivierungen
        .map(friereAktivierung)
        .sort((a, b) =>
          a.faehigkeitId.localeCompare(b.faehigkeitId)
          || a.anbieterModulId.localeCompare(b.anbieterModulId)),
    );
  }

  #pruefeAktivierungsAnfrage(
    anfrage: MutierendeProduktionsAktivierung,
  ): void {
    if (anfrage.schemaVersion !== 1) {
      throw new Error("PRODUKTIVE_MUTATIONS_AKTIVIERUNG_SCHEMA_UNGUELTIG");
    }
    for (const [wert, fehler] of [
      [anfrage.aktivierungsId, "PRODUKTIVE_MUTATIONS_AKTIVIERUNG_ID_UNGUELTIG"],
      [anfrage.faehigkeitId, "PRODUKTIVE_MUTATIONS_FAEHIGKEIT_UNGUELTIG"],
      [anfrage.anbieterModulId, "PRODUKTIVE_MUTATIONS_MODUL_UNGUELTIG"],
      [anfrage.anbieterVersion, "PRODUKTIVE_MUTATIONS_VERSION_UNGUELTIG"],
      [
        anfrage.gesamtfreigabeNachweisId,
        "PRODUKTIVE_MUTATIONS_FREIGABENACHWEIS_UNGUELTIG",
      ],
      [anfrage.zweck, "PRODUKTIVE_MUTATIONS_ZWECK_UNGUELTIG"],
    ] as const) {
      pruefeText(wert, fehler);
    }
  }
}

function friereVertrag(
  definition: ProduktiveAktionsVertragsDefinition,
): ProduktiveAktionsVertragsDefinition {
  return Object.freeze({
    ...definition,
    invariantenKennungen: Object.freeze([
      ...definition.invariantenKennungen,
    ].sort()),
  });
}

export class ProduktiverAktionsVertragsKatalog
implements AktionsVertragsPort {
  readonly #definitionen: readonly ProduktiveAktionsVertragsDefinition[];

  public constructor(
    definitionen: readonly ProduktiveAktionsVertragsDefinition[],
  ) {
    if (definitionen.length < 1 || definitionen.length > 128) {
      throw new Error("PRODUKTIVER_AKTIONSVERTRAG_KATALOG_GROESSE_UNGUELTIG");
    }
    if (hatDuplikate(definitionen.map(x => x.actionContractId))) {
      throw new Error("PRODUKTIVER_AKTIONSVERTRAG_DOPPELT");
    }
    this.#definitionen = Object.freeze(
      definitionen.map(definition => {
        if (definition.schemaVersion !== 1) {
          throw new Error("PRODUKTIVER_AKTIONSVERTRAG_SCHEMA_UNGUELTIG");
        }
        for (const [wert, fehler] of [
          [
            definition.actionContractId,
            "PRODUKTIVER_AKTIONSVERTRAG_ACTION_ID_UNGUELTIG",
          ],
          [
            definition.recoveryContractId,
            "PRODUKTIVER_AKTIONSVERTRAG_RECOVERY_ID_UNGUELTIG",
          ],
          [
            definition.verifierId,
            "PRODUKTIVER_AKTIONSVERTRAG_VERIFIER_ID_UNGUELTIG",
          ],
        ] as const) {
          pruefeText(wert, fehler);
        }
        if (definition.invariantenKennungen.length < 1
            || definition.invariantenKennungen.length > 64
            || hatDuplikate(definition.invariantenKennungen)) {
          throw new Error("PRODUKTIVER_AKTIONSVERTRAG_INVARIANTEN_UNGUELTIG");
        }
        return friereVertrag(definition);
      }),
    );
  }

  public pruefe(
    actionContractId: string,
    recoveryContractId: string,
    verifierId: string,
  ): AktionsVertragsNachweis {
    const definition = this.#definitionen.find(x =>
      x.actionContractId === actionContractId
      && x.recoveryContractId === recoveryContractId
      && x.verifierId === verifierId);
    if (definition === undefined) {
      return Object.freeze({
        actionContractId,
        recoveryContractId,
        verifierId,
        produktivErlaubt: false,
        invariantenKennungen: Object.freeze([]),
      });
    }
    return Object.freeze({
      actionContractId: definition.actionContractId,
      recoveryContractId: definition.recoveryContractId,
      verifierId: definition.verifierId,
      produktivErlaubt: definition.produktivErlaubt,
      invariantenKennungen: Object.freeze([
        ...definition.invariantenKennungen,
      ]),
    });
  }
}
