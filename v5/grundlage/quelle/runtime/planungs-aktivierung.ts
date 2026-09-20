import type {
  BedienerRichtlinienDienst,
} from "../autoritaet/bediener-richtlinie.js";
import type {
  FaehigkeitsEintrag,
  FaehigkeitsRegister,
} from "../autoritaet/faehigkeits-register.js";
import type {
  ModulEintrag,
  ModulRegister,
} from "../autoritaet/modul-register.js";
import type {
  AutoritaetsStatusRegister,
} from "../operations/authority-status.js";
import type {
  HeadlessOperationsSupervisor,
  HeadlessSupervisorStatus,
} from "../operations/headless-supervisor.js";
import type { HealthEvidence } from "../operations/health.js";

export const PLANUNGS_AKTIVIERUNGS_POLICY_ID =
  "POLICY-V5-PLANUNGS-AKTIVIERUNG";

export interface PlanungsAktivierungsAnfrage {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly grund: string;
}

export interface PlanungsAktivierungsAuditEintrag {
  readonly schemaVersion: 1;
  readonly auditId: string;
  readonly aktivierungsId: string;
  readonly zeitMs: number;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly policyId: string;
  readonly healthEvidenceIds: readonly string[];
  readonly healthGueltigBisMs: number;
  readonly art: "PLANEN_AKTIVIERUNG_VOR_WIRKUNG";
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface PlanungsAktivierungsProtokollPort {
  schreibeDurable(eintrag: PlanungsAktivierungsAuditEintrag): Promise<void>;
}

export interface PlanungsAktivierungsRuntimeStatus {
  readonly prozessLaeuft: boolean;
  readonly zustand: string;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface PlanungsAktivierungsErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly faehigkeitId: string;
  readonly anbieterModulId: string;
  readonly anbieterVersion: string;
  readonly modulAktiv: boolean;
  readonly faehigkeitAktiv: boolean;
  readonly authorityId: string | null;
  readonly gueltigBisMs: number | null;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

interface PlanungsAktivierungsPruefung {
  readonly modul: ModulEintrag;
  readonly faehigkeit: FaehigkeitsEintrag;
  readonly supervisor: HeadlessSupervisorStatus;
  readonly evidenceIds: readonly string[];
  readonly gueltigBisMs: number;
}

function pruefeText(
  wert: string,
  maximum: number,
  fehler: string,
): void {
  if (wert.trim().length === 0 || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function eindeutigeSortierteTexte(werte: readonly string[]): readonly string[] {
  const sortiert = [...werte].sort();
  return Object.freeze(
    sortiert.filter((wert, index) =>
      index === 0 || wert !== sortiert[index - 1]),
  );
}

export class KontrolliertePlanungsAktivierung {
  readonly #module: ModulRegister;
  readonly #faehigkeiten: FaehigkeitsRegister;
  readonly #supervisor: HeadlessOperationsSupervisor;
  readonly #bedienerRichtlinie: BedienerRichtlinienDienst;
  readonly #autoritaetsStatus: AutoritaetsStatusRegister;
  readonly #protokoll: PlanungsAktivierungsProtokollPort;
  readonly #runtimeStatus: () => PlanungsAktivierungsRuntimeStatus;

  public constructor(
    module: ModulRegister,
    faehigkeiten: FaehigkeitsRegister,
    supervisor: HeadlessOperationsSupervisor,
    bedienerRichtlinie: BedienerRichtlinienDienst,
    autoritaetsStatus: AutoritaetsStatusRegister,
    protokoll: PlanungsAktivierungsProtokollPort,
    runtimeStatus: () => PlanungsAktivierungsRuntimeStatus,
  ) {
    this.#module = module;
    this.#faehigkeiten = faehigkeiten;
    this.#supervisor = supervisor;
    this.#bedienerRichtlinie = bedienerRichtlinie;
    this.#autoritaetsStatus = autoritaetsStatus;
    this.#protokoll = protokoll;
    this.#runtimeStatus = runtimeStatus;
  }

  public async aktiviere(
    anfrage: PlanungsAktivierungsAnfrage,
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): Promise<PlanungsAktivierungsErgebnis> {
    this.#pruefeAnfrage(anfrage, jetztMs);

    const vor = this.#pruefeVoraussetzungen(
      anfrage,
      healthEvidence,
      jetztMs,
    );
    if (typeof vor === "string") {
      return this.#ergebnis(anfrage, false, vor, null, null);
    }

    const auditId = "AUDIT-" + anfrage.aktivierungsId;
    const audit: PlanungsAktivierungsAuditEintrag = Object.freeze({
      schemaVersion: 1,
      auditId,
      aktivierungsId: anfrage.aktivierungsId,
      zeitMs: jetztMs,
      faehigkeitId: anfrage.faehigkeitId,
      anbieterModulId: anfrage.anbieterModulId,
      anbieterVersion: anfrage.anbieterVersion,
      policyId: PLANUNGS_AKTIVIERUNGS_POLICY_ID,
      healthEvidenceIds: vor.evidenceIds,
      healthGueltigBisMs: vor.gueltigBisMs,
      art: "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });

    try {
      await this.#protokoll.schreibeDurable(audit);
    } catch {
      return this.#ergebnis(
        anfrage,
        false,
        "PLANUNGS_AKTIVIERUNG_AUDIT_NICHT_DURABLE",
        null,
        null,
      );
    }

    const nachAudit = this.#pruefeVoraussetzungen(
      anfrage,
      healthEvidence,
      jetztMs,
    );
    if (typeof nachAudit === "string") {
      return this.#ergebnis(
        anfrage,
        false,
        "PLANUNGS_AKTIVIERUNG_REVALIDIERUNG_FEHLGESCHLAGEN:"
          + nachAudit,
        null,
        null,
      );
    }

    const modulWarAktiv = nachAudit.modul.aktiv;
    let modulAktiviert = false;
    let faehigkeitAktiviert = false;
    try {
      if (!modulWarAktiv) {
        this.#module.aktiviere(
          anfrage.anbieterModulId,
          anfrage.anbieterVersion,
        );
        modulAktiviert = true;
      }

      const aktiviert = this.#faehigkeiten.aktiviereNichtMutierend(
        anfrage.faehigkeitId,
        anfrage.anbieterModulId,
        anfrage.anbieterVersion,
      );
      faehigkeitAktiviert = aktiviert.aktiv;

      if (!aktiviert.aktiv
          || aktiviert.modus !== "PLANEN"
          || aktiviert.anbieterVersion !== anfrage.anbieterVersion) {
        throw new Error("PLANUNGS_AKTIVIERUNG_REGISTER_NACHPRUEFUNG_FEHLGESCHLAGEN");
      }

      const authorityId = this.#authorityId(anfrage);
      this.#autoritaetsStatus.setze({
        schemaVersion: 1,
        authorityId,
        capabilityId: anfrage.faehigkeitId,
        ownerModulId: anfrage.anbieterModulId,
        aktiv: true,
        grund: anfrage.grund,
        policyId: PLANUNGS_AKTIVIERUNGS_POLICY_ID,
        evidenceIds: eindeutigeSortierteTexte([
          auditId,
          ...nachAudit.evidenceIds,
        ]),
        ressourcenIds: [],
        erwarteteWirkung: "Nicht-mutierende Planung ohne Gameplay-Ausfuehrung",
        ausgestelltAmMs: jetztMs,
        gueltigBisMs: nachAudit.gueltigBisMs,
      });

      return this.#ergebnis(
        anfrage,
        true,
        "PLANUNGS_AKTIVIERUNG_ERFOLGREICH",
        authorityId,
        nachAudit.gueltigBisMs,
      );
    } catch {
      if (faehigkeitAktiviert) {
        try {
          this.#faehigkeiten.deaktiviere(
            anfrage.faehigkeitId,
            anfrage.anbieterModulId,
            anfrage.anbieterVersion,
          );
        } catch {
          // Die Aktivierung bleibt fail-closed; ein Rollback-Fehler erhoeht keine Authority.
        }
      }
      if (modulAktiviert) {
        try {
          this.#module.deaktiviere(
            anfrage.anbieterModulId,
            anfrage.anbieterVersion,
          );
        } catch {
          // Die Aktivierung bleibt fail-closed; ein Rollback-Fehler erhoeht keine Authority.
        }
      }
      return this.#ergebnis(
        anfrage,
        false,
        "PLANUNGS_AKTIVIERUNG_LOKALE_WIRKUNG_FEHLGESCHLAGEN",
        null,
        null,
      );
    }
  }

  #pruefeVoraussetzungen(
    anfrage: PlanungsAktivierungsAnfrage,
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): PlanungsAktivierungsPruefung | string {
    let runtime: PlanungsAktivierungsRuntimeStatus;
    try {
      runtime = this.#runtimeStatus();
    } catch {
      return "PLANUNGS_AKTIVIERUNG_RUNTIME_STATUS_NICHT_LESBAR";
    }
    if (!runtime.prozessLaeuft || runtime.zustand !== "LAEUFT") {
      return "PLANUNGS_AKTIVIERUNG_RUNTIME_NICHT_LAEUFT";
    }
    if (runtime.gameplayAutoritaet !== false
        || runtime.rawWriteAutoritaet !== false
        || runtime.actionAuthority !== false) {
      return "PLANUNGS_AKTIVIERUNG_RUNTIME_AUTHORITY_UNSICHER";
    }

    const modul = this.#module.sicht().find(x =>
      x.modulId === anfrage.anbieterModulId
      && x.modulVersion === anfrage.anbieterVersion);
    if (modul === undefined) {
      return "PLANUNGS_AKTIVIERUNG_PROVIDER_MODUL_FEHLT";
    }
    if (modul.gesundheit !== "GESUND") {
      return "PLANUNGS_AKTIVIERUNG_PROVIDER_MODUL_NICHT_GESUND";
    }
    if (!modul.bereitgestellteFaehigkeiten.includes(anfrage.faehigkeitId)) {
      return "PLANUNGS_AKTIVIERUNG_PROVIDER_DEKLARATION_FEHLT";
    }

    const faehigkeit = this.#faehigkeiten.sicht().find(x =>
      x.faehigkeitId === anfrage.faehigkeitId
      && x.anbieterModulId === anfrage.anbieterModulId
      && x.anbieterVersion === anfrage.anbieterVersion);
    if (faehigkeit === undefined) {
      return "PLANUNGS_AKTIVIERUNG_FAEHIGKEIT_PROVIDER_FEHLT";
    }
    if (faehigkeit.modus !== "PLANEN") {
      return "PLANUNGS_AKTIVIERUNG_NUR_PLANEN";
    }
    if (faehigkeit.standardAktiv !== false) {
      return "PLANUNGS_AKTIVIERUNG_STANDARD_AKTIV_VERBOTEN";
    }
    if (faehigkeit.status !== "VERFUEGBAR") {
      return "PLANUNGS_AKTIVIERUNG_FAEHIGKEIT_NICHT_VERFUEGBAR";
    }
    if (faehigkeit.aktiv) {
      return "PLANUNGS_AKTIVIERUNG_FAEHIGKEIT_BEREITS_AKTIV";
    }

    const richtlinie = this.#bedienerRichtlinie.snapshot();
    if (richtlinie.nothaltAktiv) {
      return "PLANUNGS_AKTIVIERUNG_NOTHALT_AKTIV";
    }
    if (!this.#bedienerRichtlinie.istErlaubt(anfrage.faehigkeitId)) {
      return "PLANUNGS_AKTIVIERUNG_DURCH_OPERATOR_GESPERRT";
    }

    let supervisor: HeadlessSupervisorStatus;
    try {
      supervisor = this.#supervisor.status(healthEvidence, jetztMs);
    } catch {
      return "PLANUNGS_AKTIVIERUNG_SUPERVISOR_STATUS_NICHT_LESBAR";
    }
    if (!supervisor.bereit
        || supervisor.health.zustand !== "GESUND"
        || !supervisor.health.mutationErlaubt
        || supervisor.actionAuthority !== false) {
      return "PLANUNGS_AKTIVIERUNG_OPERATIONS_NICHT_BEREIT";
    }

    const aktuelleEvidence = healthEvidence.filter(evidence =>
      evidence.zustand === "GESUND"
      && evidence.beobachtetAmMs <= jetztMs
      && evidence.gueltigBisMs >= jetztMs);
    const evidenceIds = eindeutigeSortierteTexte(
      aktuelleEvidence.map(evidence => evidence.evidenceId),
    );
    if (evidenceIds.length < 1) {
      return "PLANUNGS_AKTIVIERUNG_HEALTH_EVIDENCE_FEHLT";
    }
    if (evidenceIds.length > 63) {
      return "PLANUNGS_AKTIVIERUNG_HEALTH_EVIDENCE_ZU_VIEL";
    }
    const gueltigBisMs = Math.min(
      ...aktuelleEvidence.map(evidence => evidence.gueltigBisMs),
    );
    if (!Number.isSafeInteger(gueltigBisMs) || gueltigBisMs < jetztMs) {
      return "PLANUNGS_AKTIVIERUNG_HEALTH_EVIDENCE_STALE";
    }

    return Object.freeze({
      modul,
      faehigkeit,
      supervisor,
      evidenceIds,
      gueltigBisMs,
    });
  }

  #authorityId(anfrage: PlanungsAktivierungsAnfrage): string {
    return "PLAN:"
      + anfrage.faehigkeitId
      + ":"
      + anfrage.anbieterModulId
      + "@"
      + anfrage.anbieterVersion;
  }

  #ergebnis(
    anfrage: PlanungsAktivierungsAnfrage,
    erfolgreich: boolean,
    grund: string,
    authorityId: string | null,
    gueltigBisMs: number | null,
  ): PlanungsAktivierungsErgebnis {
    const modulAktiv = this.#module.sicht().some(x =>
      x.modulId === anfrage.anbieterModulId
      && x.modulVersion === anfrage.anbieterVersion
      && x.aktiv);
    const faehigkeitAktiv = this.#faehigkeiten.sicht().some(x =>
      x.faehigkeitId === anfrage.faehigkeitId
      && x.anbieterModulId === anfrage.anbieterModulId
      && x.anbieterVersion === anfrage.anbieterVersion
      && x.aktiv);

    return Object.freeze({
      schemaVersion: 1,
      erfolgreich,
      grund,
      aktivierungsId: anfrage.aktivierungsId,
      faehigkeitId: anfrage.faehigkeitId,
      anbieterModulId: anfrage.anbieterModulId,
      anbieterVersion: anfrage.anbieterVersion,
      modulAktiv,
      faehigkeitAktiv,
      authorityId,
      gueltigBisMs,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
  }

  #pruefeAnfrage(
    anfrage: PlanungsAktivierungsAnfrage,
    jetztMs: number,
  ): void {
    if (anfrage.schemaVersion !== 1) {
      throw new Error("PLANUNGS_AKTIVIERUNG_SCHEMA_UNGUELTIG");
    }
    pruefeText(
      anfrage.aktivierungsId,
      128,
      "PLANUNGS_AKTIVIERUNG_ID_UNGUELTIG",
    );
    pruefeText(
      anfrage.faehigkeitId,
      128,
      "PLANUNGS_AKTIVIERUNG_FAEHIGKEIT_ID_UNGUELTIG",
    );
    pruefeText(
      anfrage.anbieterModulId,
      128,
      "PLANUNGS_AKTIVIERUNG_MODUL_ID_UNGUELTIG",
    );
    pruefeText(
      anfrage.anbieterVersion,
      128,
      "PLANUNGS_AKTIVIERUNG_VERSION_UNGUELTIG",
    );
    pruefeText(
      anfrage.grund,
      192,
      "PLANUNGS_AKTIVIERUNG_GRUND_UNGUELTIG",
    );
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("PLANUNGS_AKTIVIERUNG_ZEIT_UNGUELTIG");
    }
  }
}
