import {
  ModulRegister,
  type ModulDefinition,
  type ModulEintrag,
  type ModulGesundheit,
} from "../autoritaet/modul-register.js";
import {
  FaehigkeitsRegister,
  type FaehigkeitsAnbieterDefinition,
  type FaehigkeitsEintrag,
  type FaehigkeitsStatus,
} from "../autoritaet/faehigkeits-register.js";
import type {
  BedienerRichtlinienDienst,
} from "../autoritaet/bediener-richtlinie.js";
import { AutoritaetsStatusRegister } from "../operations/authority-status.js";
import {
  BegrenzteOperationsTelemetrie,
  type OperationsMetrik,
} from "../operations/telemetrie.js";
import {
  HeadlessOperationsSupervisor,
} from "../operations/headless-supervisor.js";
import type {
  HealthEvidence,
  KritischeHealthAnforderung,
} from "../operations/health.js";
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

export interface V5ProduktionsModulKontrolle {
  sicht(): readonly ModulEintrag[];
  setzeGesundheit(
    modulId: string,
    modulVersion: string,
    gesundheit: ModulGesundheit,
  ): ModulEintrag;
  deaktiviere(modulId: string, modulVersion: string): ModulEintrag;
}

export interface V5ProduktionsFaehigkeitsKontrolle {
  sicht(): readonly FaehigkeitsEintrag[];
  setzeStatus(
    faehigkeitId: string,
    anbieterModulId: string,
    status: FaehigkeitsStatus,
  ): FaehigkeitsEintrag;
  deaktiviere(
    faehigkeitId: string,
    anbieterModulId: string,
  ): FaehigkeitsEintrag;
}

export interface V5ProduktionsKernKomponenten {
  readonly module: V5ProduktionsModulKontrolle;
  readonly faehigkeiten: V5ProduktionsFaehigkeitsKontrolle;
  readonly scheduler: AblaufScheduler;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
  readonly mutationsKanaele: MutationsKanalKoordination;
  readonly ausfuehrung: AusfuehrungsKernel;
  readonly laufsteuerung: KontrollierteLaufsteuerung;
  readonly autoritaetsStatus: AutoritaetsStatusRegister;
  readonly telemetrie: BegrenzteOperationsTelemetrie;
}

export interface V5PlanenAktivierungsAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly policyId: string;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
}

export interface V5PlanenAktivierungsErgebnis {
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

export interface V5PlanenAktivierungsAuditEintrag {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly policyId: string;
  readonly evidenceIds: readonly string[];
  readonly zeitMs: number;
  readonly wirkung: "AKTIVIERT" | "BEREITS_AKTIV";
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface V5PlanenAktivierungsDurableIntent {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly policyId: string;
  readonly evidenceIds: readonly string[];
  readonly zeitMs: number;
  readonly art: "PLANEN_AKTIVIERUNG_VOR_WIRKUNG";
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface V5PlanenAktivierungsDurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
  readonly aktivierungsId: string;
}

export interface V5PlanenAktivierungsProtokollPort {
  schreibeDurable(
    intent: V5PlanenAktivierungsDurableIntent,
  ): Promise<V5PlanenAktivierungsDurableBestaetigung>;
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

  for (const faehigkeit of definition.faehigkeitsDefinitionen) {
    const provider = definition.modulDefinitionen.find(modul =>
      modul.modulId === faehigkeit.anbieterModulId
      && modul.modulVersion === faehigkeit.anbieterVersion);
    if (provider === undefined) {
      throw new Error(
        "PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_PROVIDER_FEHLT:"
        + faehigkeit.faehigkeitId,
      );
    }
    if (!provider.bereitgestellteFaehigkeiten.includes(
      faehigkeit.faehigkeitId,
    )) {
      throw new Error(
        "PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_NICHT_DEKLARIERT:"
        + faehigkeit.faehigkeitId,
      );
    }
  }

  for (const modul of definition.modulDefinitionen) {
    for (const faehigkeitId of modul.bereitgestellteFaehigkeiten) {
      const provider = definition.faehigkeitsDefinitionen.filter(
        faehigkeit =>
          faehigkeit.faehigkeitId === faehigkeitId
          && faehigkeit.anbieterModulId === modul.modulId
          && faehigkeit.anbieterVersion === modul.modulVersion,
      );
      if (provider.length === 0) {
        throw new Error(
          "PRODUKTIONS_KOMPOSITION_MODUL_FAEHIGKEIT_OHNE_ANBIETER:"
          + faehigkeitId,
        );
      }
      if (provider.length > 1) {
        throw new Error(
          "PRODUKTIONS_KOMPOSITION_MODUL_FAEHIGKEIT_DOPPELT:"
          + faehigkeitId,
        );
      }
    }

    for (const faehigkeitId of modul.benoetigteFaehigkeiten) {
      if (!definition.faehigkeitsDefinitionen.some(
        faehigkeit => faehigkeit.faehigkeitId === faehigkeitId,
      )) {
        throw new Error(
          "PRODUKTIONS_KOMPOSITION_BENOETIGTE_FAEHIGKEIT_FEHLT:"
          + faehigkeitId,
        );
      }
    }
  }
}

function pruefeAktivierungsText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 128) {
    throw new Error(fehler);
  }
}

function aktivierungsErgebnis(
  anforderung: V5PlanenAktivierungsAnforderung,
  erfolgreich: boolean,
  grund: string,
  wirkung: V5PlanenAktivierungsErgebnis["wirkung"],
  evidenceIds: readonly string[] = [],
): V5PlanenAktivierungsErgebnis {
  return Object.freeze({
    schemaVersion: 1,
    erfolgreich,
    grund,
    aktivierungsId: anforderung.aktivierungsId,
    faehigkeitId: anforderung.faehigkeitId,
    anbieterModulId: anforderung.anbieterModulId,
    anbieterVersion: anforderung.anbieterVersion,
    wirkung,
    evidenceIds: Object.freeze([...evidenceIds]),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    actionAuthority: false,
  });
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
  readonly #bedienerRichtlinie: BedienerRichtlinienDienst | null;
  readonly #planenAktivierungsProtokoll: V5PlanenAktivierungsProtokollPort | null;
  #planenAktivierungsAudit: readonly V5PlanenAktivierungsAuditEintrag[] =
    Object.freeze([]);

  #prozessLaeuft = false;
  #zustand: V5ProduktionsRuntimeStatus["zustand"] = "GESTOPPT";
  #endgueltigGestoppt = false;

  public constructor(
    definition: V5ProduktionsKompositionsDefinition,
    bedienerRichtlinie: BedienerRichtlinienDienst | null = null,
    planenAktivierungsProtokoll: V5PlanenAktivierungsProtokollPort | null = null,
  ) {
    pruefeDefinition(definition);
    this.#bedienerRichtlinie = bedienerRichtlinie;
    this.#planenAktivierungsProtokoll = planenAktivierungsProtokoll;

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
      module: Object.freeze({
        sicht: () => this.#module.sicht(),
        setzeGesundheit: (
          modulId: string,
          modulVersion: string,
          gesundheit: ModulGesundheit,
        ) => this.#module.setzeGesundheit(modulId, modulVersion, gesundheit),
        deaktiviere: (modulId: string, modulVersion: string) =>
          this.#module.deaktiviere(modulId, modulVersion),
      }),
      faehigkeiten: Object.freeze({
        sicht: () => this.#faehigkeiten.sicht(),
        setzeStatus: (
          faehigkeitId: string,
          anbieterModulId: string,
          status: FaehigkeitsStatus,
        ) => this.#faehigkeiten.setzeStatus(
          faehigkeitId,
          anbieterModulId,
          status,
        ),
        deaktiviere: (faehigkeitId: string, anbieterModulId: string) =>
          this.#faehigkeiten.deaktiviere(faehigkeitId, anbieterModulId),
      }),
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

  public async aktivierePlanenFaehigkeit(
    anforderung: V5PlanenAktivierungsAnforderung,
  ): Promise<V5PlanenAktivierungsErgebnis> {
    if (anforderung.schemaVersion !== 1) {
      throw new Error("V5_PLANEN_AKTIVIERUNG_SCHEMA_UNGUELTIG");
    }
    pruefeAktivierungsText(
      anforderung.aktivierungsId,
      "V5_PLANEN_AKTIVIERUNG_ID_UNGUELTIG",
    );
    pruefeAktivierungsText(
      anforderung.faehigkeitId,
      "V5_PLANEN_AKTIVIERUNG_FAEHIGKEIT_UNGUELTIG",
    );
    pruefeAktivierungsText(
      anforderung.anbieterModulId,
      "V5_PLANEN_AKTIVIERUNG_PROVIDER_UNGUELTIG",
    );
    pruefeAktivierungsText(
      anforderung.anbieterVersion,
      "V5_PLANEN_AKTIVIERUNG_PROVIDER_VERSION_UNGUELTIG",
    );
    pruefeAktivierungsText(
      anforderung.policyId,
      "V5_PLANEN_AKTIVIERUNG_POLICY_UNGUELTIG",
    );
    if (!Number.isSafeInteger(anforderung.jetztMs) || anforderung.jetztMs < 0) {
      throw new Error("V5_PLANEN_AKTIVIERUNG_ZEIT_UNGUELTIG");
    }
    if (anforderung.healthEvidence.length > 512) {
      throw new Error("V5_PLANEN_AKTIVIERUNG_HEALTH_EVIDENCE_ZU_GROSS");
    }

    const blockiere = (grund: string) =>
      aktivierungsErgebnis(
        anforderung,
        false,
        grund,
        "BLOCKIERT",
      );

    const pruefeVorWirkung = (): string | null => {
      if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
        return "V5_PLANEN_AKTIVIERUNG_RUNTIME_LAEUFT_NICHT";
      }
      if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
        return "V5_PLANEN_AKTIVIERUNG_LAUFSTEUERUNG_GESPERRT";
      }
      if (this.#bedienerRichtlinie === null) {
        return "V5_PLANEN_AKTIVIERUNG_BEDIENER_RICHTLINIE_FEHLT";
      }

      const richtlinie = this.#bedienerRichtlinie.snapshot();
      if (richtlinie.nothaltAktiv) {
        return "V5_PLANEN_AKTIVIERUNG_NOTHALT_AKTIV";
      }
      if (!this.#bedienerRichtlinie.istErlaubt(anforderung.faehigkeitId)) {
        return "V5_PLANEN_AKTIVIERUNG_DURCH_POLICY_GESPERRT";
      }

      const faehigkeit = this.#faehigkeiten.sicht().find(x =>
        x.faehigkeitId === anforderung.faehigkeitId
        && x.anbieterModulId === anforderung.anbieterModulId
        && x.anbieterVersion === anforderung.anbieterVersion);
      if (faehigkeit === undefined) {
        return "V5_PLANEN_AKTIVIERUNG_PROVIDER_BINDUNG_UNGUELTIG";
      }
      if (faehigkeit.modus !== "PLANEN") {
        return "V5_PLANEN_AKTIVIERUNG_NUR_PLANEN_ERLAUBT";
      }
      if (faehigkeit.standardAktiv !== false) {
        return "V5_PLANEN_AKTIVIERUNG_STANDARD_AKTIV_UNGUELTIG";
      }
      if (faehigkeit.status !== "VERFUEGBAR") {
        return "V5_PLANEN_AKTIVIERUNG_FAEHIGKEIT_NICHT_VERFUEGBAR";
      }

      const module = this.#module.sicht();
      const modul = module.find(x =>
        x.modulId === anforderung.anbieterModulId
        && x.modulVersion === anforderung.anbieterVersion);
      if (modul === undefined
          || !modul.bereitgestellteFaehigkeiten.includes(
            anforderung.faehigkeitId,
          )) {
        return "V5_PLANEN_AKTIVIERUNG_PROVIDER_BINDUNG_UNGUELTIG";
      }
      if (modul.gesundheit !== "GESUND") {
        return "V5_PLANEN_AKTIVIERUNG_MODUL_NICHT_GESUND";
      }
      if (module.some(x =>
        x.modulId === anforderung.anbieterModulId
        && x.modulVersion !== anforderung.anbieterVersion
        && x.aktiv)) {
        return "V5_PLANEN_AKTIVIERUNG_ANDERE_MODULVERSION_AKTIV";
      }

      try {
        if (!this.#supervisor.status(
          anforderung.healthEvidence,
          anforderung.jetztMs,
        ).bereit) {
          return "V5_PLANEN_AKTIVIERUNG_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        return "V5_PLANEN_AKTIVIERUNG_HEALTH_EVIDENCE_UNGUELTIG";
      }
      return null;
    };

    if (this.#planenAktivierungsAudit.length >= 256) {
      return blockiere("V5_PLANEN_AKTIVIERUNG_AUDIT_VOLL");
    }
    const vorAudit = pruefeVorWirkung();
    if (vorAudit !== null) return blockiere(vorAudit);

    const evidenceIds = Object.freeze(
      anforderung.healthEvidence
        .map(x => x.evidenceId)
        .filter((evidenceId, index, alle) => alle.indexOf(evidenceId) === index)
        .sort(),
    );
    if (evidenceIds.length < 1 || evidenceIds.length > 64) {
      return blockiere("V5_PLANEN_AKTIVIERUNG_AUDIT_EVIDENCE_UNGUELTIG");
    }
    if (this.#planenAktivierungsProtokoll === null) {
      return blockiere("V5_PLANEN_AKTIVIERUNG_DURABLE_PROTOKOLL_FEHLT");
    }

    const intent: V5PlanenAktivierungsDurableIntent = Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      faehigkeitId: anforderung.faehigkeitId,
      anbieterModulId: anforderung.anbieterModulId,
      anbieterVersion: anforderung.anbieterVersion,
      policyId: anforderung.policyId,
      evidenceIds,
      zeitMs: anforderung.jetztMs,
      art: "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });

    let bestaetigung: V5PlanenAktivierungsDurableBestaetigung;
    try {
      bestaetigung = await this.#planenAktivierungsProtokoll.schreibeDurable(
        intent,
      );
    } catch {
      return blockiere("V5_PLANEN_AKTIVIERUNG_AUDIT_NICHT_DURABLE");
    }
    if (bestaetigung.durable !== true
        || bestaetigung.aktivierungsId !== anforderung.aktivierungsId
        || bestaetigung.bestaetigungsId.trim().length === 0
        || bestaetigung.bestaetigungsId.length > 192) {
      return blockiere("V5_PLANEN_AKTIVIERUNG_DURABILITY_NICHT_BESTAETIGT");
    }

    const nachAudit = pruefeVorWirkung();
    if (nachAudit !== null) {
      return blockiere(
        "V5_PLANEN_AKTIVIERUNG_REVALIDIERUNG_FEHLGESCHLAGEN:" + nachAudit,
      );
    }

    const faehigkeit = this.#faehigkeiten.sicht().find(x =>
      x.faehigkeitId === anforderung.faehigkeitId
      && x.anbieterModulId === anforderung.anbieterModulId
      && x.anbieterVersion === anforderung.anbieterVersion);
    const modul = this.#module.sicht().find(x =>
      x.modulId === anforderung.anbieterModulId
      && x.modulVersion === anforderung.anbieterVersion);
    if (faehigkeit === undefined || modul === undefined) {
      return blockiere("V5_PLANEN_AKTIVIERUNG_REVALIDIERUNG_PROVIDER_FEHLT");
    }

    const modulWarAktiv = modul.aktiv;
    const faehigkeitWarAktiv = faehigkeit.aktiv;
    try {
      if (!modulWarAktiv) {
        this.#module.aktiviere(modul.modulId, modul.modulVersion);
      }
      this.#faehigkeiten.aktiviereNichtMutierend(
        faehigkeit.faehigkeitId,
        faehigkeit.anbieterModulId,
        faehigkeit.anbieterVersion,
      );
    } catch {
      if (!faehigkeitWarAktiv) {
        try {
          this.#faehigkeiten.deaktiviere(
            faehigkeit.faehigkeitId,
            faehigkeit.anbieterModulId,
            faehigkeit.anbieterVersion,
          );
        } catch {
          // Fail-closed: best effort rollback; Runtime bleibt ohne Action-Authority.
        }
      }
      if (!modulWarAktiv) {
        try {
          this.#module.deaktiviere(modul.modulId, modul.modulVersion);
        } catch {
          // Fail-closed: best effort rollback; Runtime bleibt ohne Action-Authority.
        }
      }
      return blockiere("V5_PLANEN_AKTIVIERUNG_REGISTER_FEHLER");
    }

    const wirkung = faehigkeitWarAktiv ? "BEREITS_AKTIV" : "AKTIVIERT";
    const audit: V5PlanenAktivierungsAuditEintrag = Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      faehigkeitId: anforderung.faehigkeitId,
      anbieterModulId: anforderung.anbieterModulId,
      anbieterVersion: anforderung.anbieterVersion,
      policyId: anforderung.policyId,
      evidenceIds,
      zeitMs: anforderung.jetztMs,
      wirkung,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
    this.#planenAktivierungsAudit = Object.freeze([
      ...this.#planenAktivierungsAudit,
      audit,
    ]);

    return aktivierungsErgebnis(
      anforderung,
      true,
      wirkung === "AKTIVIERT"
        ? "V5_PLANEN_AKTIVIERUNG_ERFOLGREICH"
        : "V5_PLANEN_AKTIVIERUNG_BEREITS_AKTIV",
      wirkung,
      evidenceIds,
    );
  }

  public planenAktivierungsAudit():
  readonly V5PlanenAktivierungsAuditEintrag[] {
    return Object.freeze(
      this.#planenAktivierungsAudit.map(eintrag => Object.freeze({
        ...eintrag,
        evidenceIds: Object.freeze([...eintrag.evidenceIds]),
      })),
    );
  }

  public async stoppe(grund: string): Promise<V5ProduktionsProzessErgebnis> {
    if (grund.trim().length === 0 || grund.length > 192) {
      throw new Error("V5_RUNTIME_STOPPGRUND_UNGUELTIG");
    }
    if (!this.#prozessLaeuft) {
      this.#deaktiviereAlleKompositionsAutoritaet();
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

    this.#deaktiviereAlleKompositionsAutoritaet();
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

  #deaktiviereAlleKompositionsAutoritaet(): void {
    for (const faehigkeit of this.#faehigkeiten.sicht()) {
      if (faehigkeit.aktiv) {
        this.#faehigkeiten.deaktiviere(
          faehigkeit.faehigkeitId,
          faehigkeit.anbieterModulId,
        );
      }
    }
    for (const modul of this.#module.sicht()) {
      if (modul.aktiv) {
        this.#module.deaktiviere(modul.modulId, modul.modulVersion);
      }
    }
  }
}
