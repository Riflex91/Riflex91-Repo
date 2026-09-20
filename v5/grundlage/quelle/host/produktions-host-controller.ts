import type { HealthEvidence } from "../operations/health.js";
import type { OperationsMetrik } from "../operations/telemetrie.js";
import type {
  ProduktionsBootstrapStatus,
  V5ProduktionsBootstrap,
  V5ProduktionsProzessStatus,
} from "../runtime/produktions-bootstrap.js";

export interface ProduktionsOperationsBeobachtung {
  readonly schemaVersion: 1;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly operationsMetrik: OperationsMetrik;
}

export interface ProduktionsOperationsQuellePort {
  beobachte(jetztMs: number): Promise<ProduktionsOperationsBeobachtung>;
}

export interface ProduktionsPlanenAktivierungsAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly policyId: string;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
}

export interface ProduktionsPlanenAktivierungsErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly wirkung: "AKTIVIERT" | "BEREITS_AKTIV" | "BLOCKIERT";
  readonly evidenceIds: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface ProduktionsPlanenRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly deaktivierteFaehigkeiten: readonly string[];
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface ProduktionsPlanenRuntimePort {
  status(): V5ProduktionsProzessStatus;
  erfasseOperationsMetrik(metrik: OperationsMetrik): boolean;
  revalidierePlanenAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): ProduktionsPlanenRevalidierungsErgebnis;
  aktivierePlanenFaehigkeit(
    anforderung: ProduktionsPlanenAktivierungsAnforderung,
  ): Promise<ProduktionsPlanenAktivierungsErgebnis>;
}

export type HostPlanenAktivierungsAnfrage = Omit<
  ProduktionsPlanenAktivierungsAnforderung,
  "healthEvidence" | "jetztMs"
>;

export type ProduktionsHostZustand =
  | "GESTOPPT"
  | "LAEUFT"
  | "GESPERRT"
  | "FEHLER";

export interface ProduktionsHostStatus {
  readonly schemaVersion: 1;
  readonly zustand: ProduktionsHostZustand;
  readonly grund: string;
  readonly bootstrap: ProduktionsBootstrapStatus | null;
  readonly prozess: V5ProduktionsProzessStatus | null;
  readonly letzteHealthEvidenceIds: readonly string[];
  readonly letzteOperationsZeitMs: number | null;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("PRODUKTIONS_HOST_ZEIT_UNGUELTIG");
  }
}

function pruefeBeobachtung(
  beobachtung: ProduktionsOperationsBeobachtung,
  jetztMs: number,
): void {
  if (beobachtung.schemaVersion !== 1) {
    throw new Error("PRODUKTIONS_HOST_BEOBACHTUNG_SCHEMA_UNGUELTIG");
  }
  if (beobachtung.healthEvidence.length < 1
      || beobachtung.healthEvidence.length > 512) {
    throw new Error("PRODUKTIONS_HOST_HEALTH_EVIDENCE_UNGUELTIG");
  }
  if (beobachtung.operationsMetrik.schemaVersion !== 1
      || beobachtung.operationsMetrik.zeitMs > jetztMs) {
    throw new Error("PRODUKTIONS_HOST_OPERATIONS_METRIK_UNGUELTIG");
  }
}

export class V5ProduktionsHostController {
  readonly #bootstrap: V5ProduktionsBootstrap;
  readonly #runtime: ProduktionsPlanenRuntimePort;
  readonly #operationsQuelle: ProduktionsOperationsQuellePort;

  #zustand: ProduktionsHostZustand = "GESTOPPT";
  #grund = "NOCH_NICHT_GESTARTET";
  #letzterBootstrap: ProduktionsBootstrapStatus | null = null;
  #letzteHealthEvidenceIds: readonly string[] = Object.freeze([]);
  #letzteOperationsZeitMs: number | null = null;
  #aktivePlanenFaehigkeiten: readonly string[] = Object.freeze([]);

  public constructor(
    bootstrap: V5ProduktionsBootstrap,
    runtime: ProduktionsPlanenRuntimePort,
    operationsQuelle: ProduktionsOperationsQuellePort,
  ) {
    this.#bootstrap = bootstrap;
    this.#runtime = runtime;
    this.#operationsQuelle = operationsQuelle;
  }

  public async starte(jetztMs: number): Promise<ProduktionsHostStatus> {
    pruefeZeit(jetztMs);
    const beobachtung = await this.#beobachteFailClosed(jetztMs);
    if (beobachtung === null) {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
      );
    }

    let bootstrap: ProduktionsBootstrapStatus;
    try {
      bootstrap = await this.#bootstrap.starte(
        beobachtung.healthEvidence,
        jetztMs,
      );
      this.#letzterBootstrap = bootstrap;
    } catch {
      return this.#setze(
        "FEHLER",
        "PRODUKTIONS_HOST_BOOTSTRAP_AUSNAHME",
      );
    }
    if (bootstrap.zustand !== "LAEUFT") {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_BOOTSTRAP_NICHT_LAEUFT:" + bootstrap.grund,
      );
    }

    const revalidierung = this.#runtime.revalidierePlanenAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#aktivePlanenFaehigkeiten = Object.freeze([
      ...revalidierung.aktivePlanenFaehigkeiten,
    ]);
    if (!revalidierung.bereit) {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_REVALIDIERUNG_NICHT_BEREIT:"
          + revalidierung.grund,
      );
    }

    return this.#setze("LAEUFT", "V5_PRODUKTIONS_HOST_GESTARTET");
  }

  public async tick(jetztMs: number): Promise<ProduktionsHostStatus> {
    pruefeZeit(jetztMs);
    const beobachtung = await this.#beobachteFailClosed(jetztMs);
    if (beobachtung === null) {
      const revalidierung = this.#runtime.revalidierePlanenAuthority(
        Object.freeze([]),
        jetztMs,
      );
      this.#aktivePlanenFaehigkeiten = Object.freeze([
        ...revalidierung.aktivePlanenFaehigkeiten,
      ]);
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
      );
    }

    const revalidierung = this.#runtime.revalidierePlanenAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#aktivePlanenFaehigkeiten = Object.freeze([
      ...revalidierung.aktivePlanenFaehigkeiten,
    ]);
    if (!revalidierung.bereit) {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_REVALIDIERUNG_NICHT_BEREIT:"
          + revalidierung.grund,
      );
    }

    const prozess = this.#sichererProzessStatus();
    if (prozess === null || !prozess.prozessLaeuft) {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_RUNTIME_NICHT_LAEUFT",
      );
    }

    return this.#setze("LAEUFT", "V5_PRODUKTIONS_HOST_BEREIT");
  }

  public async aktivierePlanen(
    anfrage: HostPlanenAktivierungsAnfrage,
    jetztMs: number,
  ): Promise<ProduktionsPlanenAktivierungsErgebnis> {
    pruefeZeit(jetztMs);
    if (this.#zustand !== "LAEUFT") {
      throw new Error("PRODUKTIONS_HOST_PLANEN_AKTIVIERUNG_HOST_NICHT_BEREIT");
    }

    const beobachtung = await this.#beobachteFailClosed(jetztMs);
    if (beobachtung === null) {
      this.#runtime.revalidierePlanenAuthority(
        Object.freeze([]),
        jetztMs,
      );
      this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
      );
      throw new Error(
        "PRODUKTIONS_HOST_PLANEN_AKTIVIERUNG_OPERATIONS_NICHT_BEREIT",
      );
    }

    const revalidierung = this.#runtime.revalidierePlanenAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    if (!revalidierung.bereit) {
      this.#aktivePlanenFaehigkeiten = Object.freeze([
        ...revalidierung.aktivePlanenFaehigkeiten,
      ]);
      this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_REVALIDIERUNG_NICHT_BEREIT:"
          + revalidierung.grund,
      );
      throw new Error(
        "PRODUKTIONS_HOST_PLANEN_AKTIVIERUNG_REVALIDIERUNG_FEHLGESCHLAGEN",
      );
    }

    const ergebnis = await this.#runtime.aktivierePlanenFaehigkeit(
      Object.freeze({
        ...anfrage,
        healthEvidence: beobachtung.healthEvidence,
        jetztMs,
      }),
    );
    this.#aktivePlanenFaehigkeiten = Object.freeze(
      this.#runtime.revalidierePlanenAuthority(
        beobachtung.healthEvidence,
        jetztMs,
      ).aktivePlanenFaehigkeiten,
    );
    return ergebnis;
  }

  public status(): ProduktionsHostStatus {
    return this.#snapshot();
  }

  async #beobachteFailClosed(
    jetztMs: number,
  ): Promise<ProduktionsOperationsBeobachtung | null> {
    let beobachtung: ProduktionsOperationsBeobachtung;
    try {
      beobachtung = await this.#operationsQuelle.beobachte(jetztMs);
      pruefeBeobachtung(beobachtung, jetztMs);
      this.#runtime.erfasseOperationsMetrik(beobachtung.operationsMetrik);
    } catch {
      this.#letzteHealthEvidenceIds = Object.freeze([]);
      this.#letzteOperationsZeitMs = null;
      return null;
    }

    this.#letzteHealthEvidenceIds = Object.freeze(
      beobachtung.healthEvidence.map(x => x.evidenceId).sort(),
    );
    this.#letzteOperationsZeitMs = beobachtung.operationsMetrik.zeitMs;
    return beobachtung;
  }

  #sichererProzessStatus(): V5ProduktionsProzessStatus | null {
    try {
      const status = this.#runtime.status();
      if (status.runtimeKennung !== "V5"
          || status.gameplayAutoritaet !== false
          || status.rawWriteAutoritaet !== false) {
        return null;
      }
      return status;
    } catch {
      return null;
    }
  }

  #setze(
    zustand: ProduktionsHostZustand,
    grund: string,
  ): ProduktionsHostStatus {
    if (grund.trim().length === 0 || grund.length > 256) {
      throw new Error("PRODUKTIONS_HOST_GRUND_UNGUELTIG");
    }
    this.#zustand = zustand;
    this.#grund = grund;
    return this.#snapshot();
  }

  #snapshot(): ProduktionsHostStatus {
    return Object.freeze({
      schemaVersion: 1,
      zustand: this.#zustand,
      grund: this.#grund,
      bootstrap: this.#letzterBootstrap,
      prozess: this.#sichererProzessStatus(),
      letzteHealthEvidenceIds: Object.freeze([
        ...this.#letzteHealthEvidenceIds,
      ]),
      letzteOperationsZeitMs: this.#letzteOperationsZeitMs,
      aktivePlanenFaehigkeiten: Object.freeze([
        ...this.#aktivePlanenFaehigkeiten,
      ]),
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
  }
}
