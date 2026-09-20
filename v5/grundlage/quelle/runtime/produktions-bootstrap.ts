import type { HealthEvidence } from "../operations/health.js";
import type {
  HeadlessOperationsSupervisor,
  HeadlessSupervisorStatus,
} from "../operations/headless-supervisor.js";
import type { HostStatus } from "../host/host-grenze.js";
import type {
  ProduktionsGesamtfreigabeBewertung,
} from "./gesamtfreigabe-gate.js";

export type ProduktionsBootstrapZustand =
  | "GESTOPPT"
  | "GESPERRT"
  | "STARTET"
  | "LAEUFT"
  | "FEHLER";

export interface GlobaleProduktionsFreigabePort {
  bewertung(): ProduktionsGesamtfreigabeBewertung;
}

export interface V5ProduktionsProzessStatus extends HostStatus {
  readonly runtimeKennung: "V5";
  readonly bereit: boolean;
}

export interface V5ProduktionsProzessErgebnis {
  readonly erfolgreich: boolean;
  readonly grund: string;
}

export interface V5ProduktionsProzessPort {
  starte(): Promise<V5ProduktionsProzessErgebnis>;
  stoppe(grund: string): Promise<V5ProduktionsProzessErgebnis>;
  status(): V5ProduktionsProzessStatus;
}

export interface ProduktionsBootstrapStatus {
  readonly schemaVersion: 1;
  readonly zustand: ProduktionsBootstrapZustand;
  readonly grund: string;
  readonly gesamtfreigabeErlaubt: boolean;
  readonly gesamtfreigabeNachweisId: string;
  readonly releaseCandidateSha: string | null;
  readonly operationsBereit: boolean;
  readonly prozess: V5ProduktionsProzessStatus | null;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly automatischerNeustart: false;
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("PRODUKTIONS_BOOTSTRAP_ZEIT_UNGUELTIG");
  }
}

function pruefeGrund(grund: string): void {
  if (grund.trim().length === 0 || grund.length > 192) {
    throw new Error("PRODUKTIONS_BOOTSTRAP_GRUND_UNGUELTIG");
  }
}

function istSichererV5Prozess(
  status: V5ProduktionsProzessStatus,
  bereitErforderlich: boolean,
): boolean {
  return status.runtimeKennung === "V5"
    && status.gameplayAutoritaet === false
    && status.rawWriteAutoritaet === false
    && (!bereitErforderlich || status.bereit === true);
}

export class V5ProduktionsBootstrap {
  readonly #gesamtfreigabe: GlobaleProduktionsFreigabePort;
  readonly #supervisor: HeadlessOperationsSupervisor;
  readonly #prozess: V5ProduktionsProzessPort;

  #zustand: ProduktionsBootstrapZustand = "GESTOPPT";
  #grund = "NOCH_NICHT_GESTARTET";
  #letzteFreigabe: ProduktionsGesamtfreigabeBewertung | null = null;
  #letzteOperations: HeadlessSupervisorStatus | null = null;
  #letzterProzess: V5ProduktionsProzessStatus | null = null;

  public constructor(
    gesamtfreigabe: GlobaleProduktionsFreigabePort,
    supervisor: HeadlessOperationsSupervisor,
    prozess: V5ProduktionsProzessPort,
  ) {
    this.#gesamtfreigabe = gesamtfreigabe;
    this.#supervisor = supervisor;
    this.#prozess = prozess;
  }

  public async starte(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): Promise<ProduktionsBootstrapStatus> {
    pruefeZeit(jetztMs);
    if (this.#zustand === "STARTET") {
      return this.#setze("GESPERRT", "START_BEREITS_IN_ARBEIT");
    }
    if (this.#zustand === "LAEUFT") {
      return this.status();
    }

    const freigabe = this.#gesamtfreigabe.bewertung();
    this.#letzteFreigabe = freigabe;
    if (!freigabe.erlaubt || freigabe.releaseCandidateSha === null) {
      return this.#setze("GESPERRT", "GESAMTFREIGABE_NICHT_GUELTIG");
    }

    const operations = this.#supervisor.status(healthEvidence, jetztMs);
    this.#letzteOperations = operations;
    if (!operations.bereit || !operations.health.mutationErlaubt) {
      return this.#setze("GESPERRT", "OPERATIONS_NICHT_BEREIT");
    }

    let vorStatus: V5ProduktionsProzessStatus;
    try {
      vorStatus = this.#prozess.status();
      this.#letzterProzess = vorStatus;
    } catch {
      return this.#setze("GESPERRT", "PROZESS_STATUS_NICHT_LESBAR");
    }
    if (!istSichererV5Prozess(vorStatus, false)) {
      return this.#setze("GESPERRT", "PROZESS_GRENZE_UNSICHER");
    }
    if (vorStatus.prozessLaeuft) {
      return this.#setze("GESPERRT", "PROZESS_BEREITS_EXTERN_GESTARTET");
    }

    this.#zustand = "STARTET";
    this.#grund = "START_WIRD_AUSGEFUEHRT";

    let ergebnis: V5ProduktionsProzessErgebnis;
    try {
      ergebnis = await this.#prozess.starte();
    } catch {
      return this.#setze("FEHLER", "PROZESS_START_AUSNAHME");
    }
    pruefeGrund(ergebnis.grund);
    if (!ergebnis.erfolgreich) {
      return this.#setze("FEHLER", "PROZESS_START_FEHLGESCHLAGEN:" + ergebnis.grund);
    }

    let nachStatus: V5ProduktionsProzessStatus;
    try {
      nachStatus = this.#prozess.status();
      this.#letzterProzess = nachStatus;
    } catch {
      await this.#stoppeFailClosed("POST_START_STATUS_NICHT_LESBAR");
      return this.#setze("GESPERRT", "POST_START_STATUS_NICHT_LESBAR");
    }

    if (!nachStatus.prozessLaeuft || !istSichererV5Prozess(nachStatus, true)) {
      await this.#stoppeFailClosed("POST_START_GRENZE_UNGUELTIG");
      return this.#setze("GESPERRT", "POST_START_GRENZE_UNGUELTIG");
    }

    return this.#setze("LAEUFT", "V5_PRODUKTIONS_RUNTIME_GESTARTET");
  }

  public async stoppe(grund: string): Promise<ProduktionsBootstrapStatus> {
    pruefeGrund(grund);
    let status: V5ProduktionsProzessStatus;
    try {
      status = this.#prozess.status();
      this.#letzterProzess = status;
    } catch {
      return this.#setze("FEHLER", "PROZESS_STATUS_NICHT_LESBAR");
    }

    if (!status.prozessLaeuft) {
      return this.#setze("GESTOPPT", "PROZESS_BEREITS_GESTOPPT");
    }

    let ergebnis: V5ProduktionsProzessErgebnis;
    try {
      ergebnis = await this.#prozess.stoppe(grund);
    } catch {
      return this.#setze("FEHLER", "PROZESS_STOPP_AUSNAHME");
    }
    pruefeGrund(ergebnis.grund);
    if (!ergebnis.erfolgreich) {
      return this.#setze("FEHLER", "PROZESS_STOPP_FEHLGESCHLAGEN:" + ergebnis.grund);
    }

    try {
      status = this.#prozess.status();
      this.#letzterProzess = status;
    } catch {
      return this.#setze("FEHLER", "POST_STOPP_STATUS_NICHT_LESBAR");
    }
    if (status.prozessLaeuft) {
      return this.#setze("FEHLER", "PROZESS_NACH_STOPP_NOCH_AKTIV");
    }
    return this.#setze("GESTOPPT", "V5_PRODUKTIONS_RUNTIME_GESTOPPT");
  }

  public status(): ProduktionsBootstrapStatus {
    let prozess = this.#letzterProzess;
    try {
      prozess = this.#prozess.status();
      this.#letzterProzess = prozess;
    } catch {
      prozess = null;
    }

    return Object.freeze({
      schemaVersion: 1,
      zustand: this.#zustand,
      grund: this.#grund,
      gesamtfreigabeErlaubt: this.#letzteFreigabe?.erlaubt === true,
      gesamtfreigabeNachweisId:
        this.#letzteFreigabe?.nachweisId ?? "V5_GESAMTFREIGABE:UNGEPRUEFT",
      releaseCandidateSha: this.#letzteFreigabe?.releaseCandidateSha ?? null,
      operationsBereit: this.#letzteOperations?.bereit === true,
      prozess,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      automatischerNeustart: false,
    });
  }

  async #stoppeFailClosed(grund: string): Promise<void> {
    try {
      await this.#prozess.stoppe(grund);
      this.#letzterProzess = this.#prozess.status();
    } catch {
      this.#letzterProzess = null;
    }
  }

  #setze(
    zustand: ProduktionsBootstrapZustand,
    grund: string,
  ): ProduktionsBootstrapStatus {
    pruefeGrund(grund);
    this.#zustand = zustand;
    this.#grund = grund;
    return this.status();
  }
}
