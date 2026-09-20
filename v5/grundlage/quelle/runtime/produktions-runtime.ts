import {
  ModulRegister,
  type ModulDefinition,
} from "../autoritaet/modul-register.js";
import {
  FaehigkeitsRegister,
  type FaehigkeitsAnbieterDefinition,
} from "../autoritaet/faehigkeits-register.js";
import { AutoritaetsStatusRegister } from "../operations/authority-status.js";
import {
  BegrenzteOperationsTelemetrie,
  type OperationsMetrik,
} from "../operations/telemetrie.js";
import {
  HeadlessOperationsSupervisor,
} from "../operations/headless-supervisor.js";
import type { KritischeHealthAnforderung } from "../operations/health.js";
import { AblaufScheduler } from "../scheduler/ablauf-scheduler.js";
import { RessourcenVerwalter } from "../scheduler/ressourcen-verwalter.js";
import {
  CharacterSocketBudget,
  MutationsKanalKoordination,
} from "../scheduler/socket-budget.js";
import { AusfuehrungsKernel } from "../ausfuehrung/ausfuehrungs-kernel.js";
import { KontrollierteLaufsteuerung } from "../recovery/laufsteuerung.js";
import type {
  V5ProduktionsProzessErgebnis,
  V5ProduktionsProzessPort,
  V5ProduktionsProzessStatus,
} from "./produktions-bootstrap.js";

export interface V5ProduktionsKompositionsDefinition {
  readonly schemaVersion: 1;
  readonly modulDefinitionen: readonly ModulDefinition[];
  readonly faehigkeitsDefinitionen: readonly FaehigkeitsAnbieterDefinition[];
  readonly healthAnforderungen: readonly KritischeHealthAnforderung[];
}

export interface V5ProduktionsKernKomponenten {
  readonly module: ModulRegister;
  readonly faehigkeiten: FaehigkeitsRegister;
  readonly scheduler: AblaufScheduler;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
  readonly mutationsKanaele: MutationsKanalKoordination;
  readonly ausfuehrung: AusfuehrungsKernel;
  readonly laufsteuerung: KontrollierteLaufsteuerung;
  readonly autoritaetsStatus: AutoritaetsStatusRegister;
  readonly telemetrie: BegrenzteOperationsTelemetrie;
}

export interface V5ProduktionsRuntimeStatus extends V5ProduktionsProzessStatus {
  readonly schemaVersion: 1;
  readonly zustand:
    | "GESTOPPT"
    | "LAEUFT"
    | "PAUSIERT"
    | "ABGLEICH_ERFORDERLICH"
    | "KRITISCH_GESPERRT";
  readonly registrierteModule: number;
  readonly aktiveModule: number;
  readonly registrierteFaehigkeiten: number;
  readonly aktiveFaehigkeiten: number;
  readonly aktiveMutierendeFaehigkeiten: number;
  readonly schedulerAblaeufe: number;
  readonly ressourcenEintraege: number;
  readonly laufsteuerungStatus: string;
  readonly actionAuthority: false;
  readonly automatischerNeustart: false;
}

function pruefeDefinition(definition: V5ProduktionsKompositionsDefinition): void {
  if (definition.schemaVersion !== 1) {
    throw new Error("PRODUKTIONS_KOMPOSITION_SCHEMA_UNGUELTIG");
  }
  if (definition.modulDefinitionen.length > 256) {
    throw new Error("PRODUKTIONS_KOMPOSITION_ZU_VIELE_MODULE");
  }
  if (definition.faehigkeitsDefinitionen.length > 512) {
    throw new Error("PRODUKTIONS_KOMPOSITION_ZU_VIELE_FAEHIGKEITEN");
  }
  if (definition.healthAnforderungen.length < 1
      || definition.healthAnforderungen.length > 256) {
    throw new Error("PRODUKTIONS_KOMPOSITION_HEALTH_ANFORDERUNGEN_UNGUELTIG");
  }
  if (definition.modulDefinitionen.some(x => x.standardAktiv)) {
    throw new Error("PRODUKTIONS_KOMPOSITION_MODUL_STANDARD_AKTIV_VERBOTEN");
  }
  if (definition.faehigkeitsDefinitionen.some(x => x.standardAktiv)) {
    throw new Error("PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_STANDARD_AKTIV_VERBOTEN");
  }
}

export class V5ProduktionsRuntime implements V5ProduktionsProzessPort {
  readonly #module = new ModulRegister();
  readonly #faehigkeiten = new FaehigkeitsRegister();
  readonly #scheduler = new AblaufScheduler();
  readonly #ressourcen = new RessourcenVerwalter();
  readonly #socketBudget = new CharacterSocketBudget();
  readonly #mutationsKanaele = new MutationsKanalKoordination(
    this.#ressourcen,
    this.#socketBudget,
  );
  readonly #ausfuehrung = new AusfuehrungsKernel();
  readonly #laufsteuerung = new KontrollierteLaufsteuerung();
  readonly #autoritaetsStatus = new AutoritaetsStatusRegister();
  readonly #telemetrie = new BegrenzteOperationsTelemetrie();
  readonly #supervisor: HeadlessOperationsSupervisor;
  readonly #komponenten: V5ProduktionsKernKomponenten;

  #prozessLaeuft = false;
  #zustand: V5ProduktionsRuntimeStatus["zustand"] = "GESTOPPT";
  #endgueltigGestoppt = false;

  public constructor(definition: V5ProduktionsKompositionsDefinition) {
    pruefeDefinition(definition);

    for (const modul of definition.modulDefinitionen) {
      this.#module.registriere(modul);
    }
    for (const faehigkeit of definition.faehigkeitsDefinitionen) {
      this.#faehigkeiten.registriere(faehigkeit);
    }

    this.#supervisor = new HeadlessOperationsSupervisor(
      definition.healthAnforderungen,
      this.#autoritaetsStatus,
      this.#telemetrie,
    );
    this.#komponenten = Object.freeze({
      module: this.#module,
      faehigkeiten: this.#faehigkeiten,
      scheduler: this.#scheduler,
      ressourcen: this.#ressourcen,
      socketBudget: this.#socketBudget,
      mutationsKanaele: this.#mutationsKanaele,
      ausfuehrung: this.#ausfuehrung,
      laufsteuerung: this.#laufsteuerung,
      autoritaetsStatus: this.#autoritaetsStatus,
      telemetrie: this.#telemetrie,
    });
  }

  public async starte(): Promise<V5ProduktionsProzessErgebnis> {
    if (this.#prozessLaeuft) {
      return Object.freeze({
        erfolgreich: true,
        grund: "V5_RUNTIME_BEREITS_GESTARTET",
      });
    }
    if (this.#endgueltigGestoppt) {
      return Object.freeze({
        erfolgreich: false,
        grund: "V5_RUNTIME_NEUSTART_ERFORDERT_NEUE_INSTANZ",
      });
    }

    const module = this.#module.sicht();
    const faehigkeiten = this.#faehigkeiten.sicht();
    if (module.some(x => x.aktiv)
        || faehigkeiten.some(x => x.aktiv)) {
      return Object.freeze({
        erfolgreich: false,
        grund: "V5_RUNTIME_VOR_START_NICHT_DEFAULT_DENY",
      });
    }
    if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
      return Object.freeze({
        erfolgreich: false,
        grund: "V5_RUNTIME_LAUFSTEUERUNG_NICHT_STARTBEREIT",
      });
    }

    this.#prozessLaeuft = true;
    this.#zustand = "LAEUFT";
    return Object.freeze({
      erfolgreich: true,
      grund: "V5_RUNTIME_KOMPOSITION_GESTARTET",
    });
  }

  public async stoppe(grund: string): Promise<V5ProduktionsProzessErgebnis> {
    if (grund.trim().length === 0 || grund.length > 192) {
      throw new Error("V5_RUNTIME_STOPPGRUND_UNGUELTIG");
    }
    if (!this.#prozessLaeuft) {
      this.#endgueltigGestoppt = true;
      this.#zustand = "PAUSIERT";
      return Object.freeze({
        erfolgreich: true,
        grund: "V5_RUNTIME_BEREITS_GESTOPPT",
      });
    }

    const stopp = this.#laufsteuerung.fordereStoppAn();
    if (stopp.status === "ABGLEICH_LAEUFT") {
      this.#zustand = "ABGLEICH_ERFORDERLICH";
      return Object.freeze({
        erfolgreich: false,
        grund: "V5_RUNTIME_ABGLEICH_ERFORDERLICH",
      });
    }
    if (stopp.status === "KRITISCH_GESPERRT") {
      this.#zustand = "KRITISCH_GESPERRT";
      return Object.freeze({
        erfolgreich: false,
        grund: "V5_RUNTIME_KRITISCH_GESPERRT",
      });
    }
    if (stopp.status !== "PAUSIERT") {
      this.#zustand = "KRITISCH_GESPERRT";
      return Object.freeze({
        erfolgreich: false,
        grund: "V5_RUNTIME_STOPPZUSTAND_UNGUELTIG",
      });
    }

    this.#prozessLaeuft = false;
    this.#endgueltigGestoppt = true;
    this.#zustand = "PAUSIERT";
    return Object.freeze({
      erfolgreich: true,
      grund: "V5_RUNTIME_KONTROLLIERT_GESTOPPT",
    });
  }

  public status(): V5ProduktionsRuntimeStatus {
    const module = this.#module.sicht();
    const faehigkeiten = this.#faehigkeiten.sicht();
    const scheduler = this.#scheduler.sicht();
    const ressourcen = this.#ressourcen.sicht();
    const laufsteuerung = this.#laufsteuerung.sicht();
    const aktiveMutierendeFaehigkeiten = faehigkeiten.filter(
      x => x.modus === "MUTIEREN" && x.aktiv,
    ).length;

    return Object.freeze({
      schemaVersion: 1,
      runtimeKennung: "V5",
      zustand: this.#zustand,
      prozessLaeuft: this.#prozessLaeuft,
      bereit: this.#prozessLaeuft
        && this.#zustand === "LAEUFT"
        && aktiveMutierendeFaehigkeiten === 0,
      registrierteModule: module.length,
      aktiveModule: module.filter(x => x.aktiv).length,
      registrierteFaehigkeiten: faehigkeiten.length,
      aktiveFaehigkeiten: faehigkeiten.filter(x => x.aktiv).length,
      aktiveMutierendeFaehigkeiten,
      schedulerAblaeufe: scheduler.length,
      ressourcenEintraege: ressourcen.length,
      laufsteuerungStatus: laufsteuerung.status,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
      automatischerNeustart: false,
    });
  }

  public kernKomponenten(): V5ProduktionsKernKomponenten {
    return this.#komponenten;
  }

  public operationsSupervisor(): HeadlessOperationsSupervisor {
    return this.#supervisor;
  }

  public erfasseOperationsMetrik(metrik: OperationsMetrik): boolean {
    return this.#telemetrie.erfasse(metrik);
  }
}
