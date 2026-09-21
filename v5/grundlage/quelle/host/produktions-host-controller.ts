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
  readonly equipEinmalAuthorityOffen: boolean;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface ProduktionsEquipEinmalAuthorityPort {
  pruefe(
    faehigkeitId: string,
    eigentuemerModulId: string,
  ): {
    readonly erlaubt: boolean;
    readonly mutierend: boolean;
    readonly generation: number;
  };
  gueltigFuer(jetztMs: number): boolean;
  verbraucht(): boolean;
  widerrufe(): void;
  daten(): {
    readonly aktivierungsId: string;
    readonly transaktionsId: string;
    readonly actionContractId: string;
    readonly recoveryContractId: string;
    readonly verifierId: string;
    readonly gueltigBisMs: number;
  };
}

export interface ProduktionsEquipEinmalAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: "equipment.equip";
  readonly anbieterModulId: "equipment-core";
  readonly anbieterVersion: "1";
  readonly actionContractId: "AL-ACTION-EQUIP";
  readonly recoveryContractId: "AL-RECOVERY-EQUIP";
  readonly verifierId: "AL-VERIFIER-EQUIP";
  readonly policyId: "EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1";
  readonly bestaetigungText: "V5 EQUIP EINMAL AUSFUEHREN";
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
}

export interface ProduktionsEquipEinmalAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly authority: ProduktionsEquipEinmalAuthorityPort | null;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface ProduktionsEquipEinmalRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly authorityOffen: boolean;
  readonly authorityWiderrufen: boolean;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface ProduktionsBankDepositEinmalAuthorityPort {
  pruefe(
    faehigkeitId: string,
    eigentuemerModulId: string,
  ): {
    readonly erlaubt: boolean;
    readonly mutierend: boolean;
    readonly generation: number;
  };
  gueltigFuer(jetztMs: number): boolean;
  verbraucht(): boolean;
  widerrufe(): void;
  daten(): {
    readonly aktivierungsId: string;
    readonly transaktionsId: string;
    readonly actionContractId: string;
    readonly recoveryContractId: string;
    readonly verifierId: string;
    readonly gueltigBisMs: number;
  };
}

export interface ProduktionsBankDepositEinmalAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: "merchant.bank.gold_einlagern";
  readonly anbieterModulId: "merchant-bank-core";
  readonly anbieterVersion: "1";
  readonly actionContractId: "AL-ACTION-BANK-DEPOSIT";
  readonly recoveryContractId: "AL-RECOVERY-BANK-DEPOSIT";
  readonly verifierId: "AL-VERIFIER-BANK-DEPOSIT";
  readonly policyId: "BANK-DEPOSIT-PRODUKTION-EINMAL-V1";
  readonly bestaetigungText: "V5 BANK DEPOSIT 1 GOLD EINMAL AUSFUEHREN";
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
}

export interface ProduktionsBankDepositEinmalAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly authority: ProduktionsBankDepositEinmalAuthorityPort | null;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface ProduktionsBankDepositEinmalRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly authorityOffen: boolean;
  readonly authorityWiderrufen: boolean;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface ProduktionsBankWithdrawEinmalAuthorityPort {
  pruefe(
    faehigkeitId: string,
    eigentuemerModulId: string,
  ): {
    readonly erlaubt: boolean;
    readonly mutierend: boolean;
    readonly generation: number;
  };
  gueltigFuer(jetztMs: number): boolean;
  verbraucht(): boolean;
  widerrufe(): void;
  daten(): {
    readonly aktivierungsId: string;
    readonly transaktionsId: string;
    readonly actionContractId: string;
    readonly recoveryContractId: string;
    readonly verifierId: string;
    readonly gueltigBisMs: number;
  };
}

export interface ProduktionsBankWithdrawEinmalAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: "merchant.bank.gold_auslagern";
  readonly anbieterModulId: "merchant-bank-core";
  readonly anbieterVersion: "1";
  readonly actionContractId: "AL-ACTION-BANK-WITHDRAW";
  readonly recoveryContractId: "AL-RECOVERY-BANK-WITHDRAW";
  readonly verifierId: "AL-VERIFIER-BANK-WITHDRAW";
  readonly policyId: "BANK-WITHDRAW-PRODUKTION-EINMAL-V1";
  readonly bestaetigungText: "V5 BANK WITHDRAW 1 GOLD EINMAL AUSFUEHREN";
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
}

export interface ProduktionsBankWithdrawEinmalAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly authority: ProduktionsBankWithdrawEinmalAuthorityPort | null;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface ProduktionsBankWithdrawEinmalRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly authorityOffen: boolean;
  readonly authorityWiderrufen: boolean;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
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
  erteileEquipEinmalAuthority(
    anforderung: ProduktionsEquipEinmalAuthorityAnforderung,
  ): Promise<ProduktionsEquipEinmalAuthorityErgebnis>;
  revalidiereEquipEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): ProduktionsEquipEinmalRevalidierungsErgebnis;
  erteileBankDepositEinmalAuthority(
    anforderung: ProduktionsBankDepositEinmalAuthorityAnforderung,
  ): Promise<ProduktionsBankDepositEinmalAuthorityErgebnis>;
  revalidiereBankDepositEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): ProduktionsBankDepositEinmalRevalidierungsErgebnis;
  erteileBankWithdrawEinmalAuthority(
    anforderung: ProduktionsBankWithdrawEinmalAuthorityAnforderung,
  ): Promise<ProduktionsBankWithdrawEinmalAuthorityErgebnis>;
  revalidiereBankWithdrawEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): ProduktionsBankWithdrawEinmalRevalidierungsErgebnis;
}

export type HostPlanenAktivierungsAnfrage = Omit<
  ProduktionsPlanenAktivierungsAnforderung,
  "healthEvidence" | "jetztMs"
>;

export type HostEquipEinmalAuthorityAnfrage = Omit<
  ProduktionsEquipEinmalAuthorityAnforderung,
  "healthEvidence" | "jetztMs"
>;

export type HostBankDepositEinmalAuthorityAnfrage = Omit<
  ProduktionsBankDepositEinmalAuthorityAnforderung,
  "healthEvidence" | "jetztMs"
>;

export type HostBankWithdrawEinmalAuthorityAnfrage = Omit<
  ProduktionsBankWithdrawEinmalAuthorityAnforderung,
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
  readonly equipEinmalAuthorityOffen: boolean;
  readonly bankDepositEinmalAuthorityOffen: boolean;
  readonly bankWithdrawEinmalAuthorityOffen: boolean;
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
  #equipEinmalAuthorityOffen = false;
  #bankDepositEinmalAuthorityOffen = false;
  #bankWithdrawEinmalAuthorityOffen = false;

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
      try {
        this.#letzterBootstrap = await this.#bootstrap.stoppe(
          "POST_START_REVALIDIERUNG_FEHLGESCHLAGEN",
        );
      } catch {
        return this.#setze(
          "FEHLER",
          "PRODUKTIONS_HOST_POST_START_STOPP_AUSNAHME",
        );
      }
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_REVALIDIERUNG_NICHT_BEREIT:"
          + revalidierung.grund,
      );
    }

    const equipRevalidierung = this.#runtime.revalidiereEquipEinmalAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#equipEinmalAuthorityOffen = equipRevalidierung.authorityOffen;
    if (!equipRevalidierung.bereit) {
      try {
        this.#letzterBootstrap = await this.#bootstrap.stoppe(
          "POST_START_EQUIP_REVALIDIERUNG_FEHLGESCHLAGEN",
        );
      } catch {
        return this.#setze(
          "FEHLER",
          "PRODUKTIONS_HOST_POST_START_STOPP_AUSNAHME",
        );
      }
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_EQUIP_REVALIDIERUNG_NICHT_BEREIT:"
          + equipRevalidierung.grund,
      );
    }

    const bankRevalidierung =
      this.#runtime.revalidiereBankDepositEinmalAuthority(
        beobachtung.healthEvidence,
        jetztMs,
      );
    this.#bankDepositEinmalAuthorityOffen = bankRevalidierung.authorityOffen;
    if (!bankRevalidierung.bereit) {
      try {
        this.#letzterBootstrap = await this.#bootstrap.stoppe(
          "POST_START_BANK_DEPOSIT_REVALIDIERUNG_FEHLGESCHLAGEN",
        );
      } catch {
        return this.#setze(
          "FEHLER",
          "PRODUKTIONS_HOST_POST_START_STOPP_AUSNAHME",
        );
      }
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_BANK_DEPOSIT_REVALIDIERUNG_NICHT_BEREIT:"
          + bankRevalidierung.grund,
      );
    }

    const withdrawRevalidierung =
      this.#runtime.revalidiereBankWithdrawEinmalAuthority(
        beobachtung.healthEvidence,
        jetztMs,
      );
    this.#bankWithdrawEinmalAuthorityOffen =
      withdrawRevalidierung.authorityOffen;
    if (!withdrawRevalidierung.bereit) {
      try {
        this.#letzterBootstrap = await this.#bootstrap.stoppe(
          "POST_START_BANK_WITHDRAW_REVALIDIERUNG_FEHLGESCHLAGEN",
        );
      } catch {
        return this.#setze(
          "FEHLER",
          "PRODUKTIONS_HOST_POST_START_STOPP_AUSNAHME",
        );
      }
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_BANK_WITHDRAW_REVALIDIERUNG_NICHT_BEREIT:"
          + withdrawRevalidierung.grund,
      );
    }

    return this.#setze("LAEUFT", "V5_PRODUKTIONS_HOST_GESTARTET");
  }

  public async stoppe(grund: string): Promise<ProduktionsHostStatus> {
    let bootstrap: ProduktionsBootstrapStatus;
    try {
      bootstrap = await this.#bootstrap.stoppe(grund);
      this.#letzterBootstrap = bootstrap;
    } catch {
      return this.#setze(
        "FEHLER",
        "PRODUKTIONS_HOST_STOPP_AUSNAHME",
      );
    }

    this.#aktivePlanenFaehigkeiten = Object.freeze([]);
    this.#equipEinmalAuthorityOffen = false;
    this.#bankDepositEinmalAuthorityOffen = false;
    this.#bankWithdrawEinmalAuthorityOffen = false;
    if (bootstrap.zustand !== "GESTOPPT") {
      return this.#setze(
        "FEHLER",
        "PRODUKTIONS_HOST_STOPP_FEHLGESCHLAGEN:" + bootstrap.grund,
      );
    }
    return this.#setze("GESTOPPT", "V5_PRODUKTIONS_HOST_GESTOPPT");
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
      const equipRevalidierung = this.#runtime.revalidiereEquipEinmalAuthority(
        Object.freeze([]),
        jetztMs,
      );
      this.#equipEinmalAuthorityOffen = equipRevalidierung.authorityOffen;
      const bankRevalidierung =
        this.#runtime.revalidiereBankDepositEinmalAuthority(
          Object.freeze([]),
          jetztMs,
        );
      this.#bankDepositEinmalAuthorityOffen =
        bankRevalidierung.authorityOffen;
      const withdrawRevalidierungFailClosed =
        this.#runtime.revalidiereBankWithdrawEinmalAuthority(
          Object.freeze([]),
          jetztMs,
        );
      this.#bankWithdrawEinmalAuthorityOffen =
        withdrawRevalidierungFailClosed.authorityOffen;
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

    const equipRevalidierung = this.#runtime.revalidiereEquipEinmalAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#equipEinmalAuthorityOffen = equipRevalidierung.authorityOffen;
    if (!equipRevalidierung.bereit) {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_EQUIP_REVALIDIERUNG_NICHT_BEREIT:"
          + equipRevalidierung.grund,
      );
    }

    const bankRevalidierung =
      this.#runtime.revalidiereBankDepositEinmalAuthority(
        beobachtung.healthEvidence,
        jetztMs,
      );
    this.#bankDepositEinmalAuthorityOffen = bankRevalidierung.authorityOffen;
    if (!bankRevalidierung.bereit) {
      return this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_BANK_DEPOSIT_REVALIDIERUNG_NICHT_BEREIT:"
          + bankRevalidierung.grund,
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

  public async erteileEquipEinmalAuthority(
    anfrage: HostEquipEinmalAuthorityAnfrage,
    jetztMs: number,
  ): Promise<ProduktionsEquipEinmalAuthorityErgebnis> {
    pruefeZeit(jetztMs);
    if (this.#zustand !== "LAEUFT") {
      throw new Error("PRODUKTIONS_HOST_EQUIP_EINMAL_HOST_NICHT_BEREIT");
    }
    if (this.#aktivePlanenFaehigkeiten.length > 0) {
      throw new Error("PRODUKTIONS_HOST_EQUIP_EINMAL_PLANEN_NOCH_AKTIV");
    }
    if (this.#bankDepositEinmalAuthorityOffen) {
      throw new Error("PRODUKTIONS_HOST_EQUIP_EINMAL_BANK_AUTHORITY_OFFEN");
    }

    const beobachtung = await this.#beobachteFailClosed(jetztMs);
    if (beobachtung === null) {
      this.#runtime.revalidiereEquipEinmalAuthority(
        Object.freeze([]),
        jetztMs,
      );
      this.#equipEinmalAuthorityOffen = false;
      this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
      );
      throw new Error(
        "PRODUKTIONS_HOST_EQUIP_EINMAL_OPERATIONS_NICHT_BEREIT",
      );
    }

    const planenRevalidierung = this.#runtime.revalidierePlanenAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#aktivePlanenFaehigkeiten = Object.freeze([
      ...planenRevalidierung.aktivePlanenFaehigkeiten,
    ]);
    if (!planenRevalidierung.bereit
        || this.#aktivePlanenFaehigkeiten.length > 0) {
      throw new Error(
        "PRODUKTIONS_HOST_EQUIP_EINMAL_PLANEN_REVALIDIERUNG_NICHT_BEREIT",
      );
    }

    const vorAuthority = this.#runtime.revalidiereEquipEinmalAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#equipEinmalAuthorityOffen = vorAuthority.authorityOffen;
    if (!vorAuthority.bereit || vorAuthority.authorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_EQUIP_EINMAL_AUTHORITY_NICHT_FREI",
      );
    }

    const ergebnis = await this.#runtime.erteileEquipEinmalAuthority(
      Object.freeze({
        ...anfrage,
        healthEvidence: beobachtung.healthEvidence,
        jetztMs,
      }),
    );
    this.#equipEinmalAuthorityOffen = ergebnis.erfolgreich
      && ergebnis.authority !== null;
    return ergebnis;
  }

  public async erteileBankDepositEinmalAuthority(
    anfrage: HostBankDepositEinmalAuthorityAnfrage,
    jetztMs: number,
  ): Promise<ProduktionsBankDepositEinmalAuthorityErgebnis> {
    pruefeZeit(jetztMs);
    if (this.#zustand !== "LAEUFT") {
      throw new Error("PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_HOST_NICHT_BEREIT");
    }
    if (this.#aktivePlanenFaehigkeiten.length > 0) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_PLANEN_NOCH_AKTIV",
      );
    }
    if (this.#equipEinmalAuthorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_EQUIP_AUTHORITY_OFFEN",
      );
    }
    if (this.#bankWithdrawEinmalAuthorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_WITHDRAW_AUTHORITY_OFFEN",
      );
    }

    const beobachtung = await this.#beobachteFailClosed(jetztMs);
    if (beobachtung === null) {
      this.#runtime.revalidiereBankDepositEinmalAuthority(
        Object.freeze([]),
        jetztMs,
      );
      this.#bankDepositEinmalAuthorityOffen = false;
      this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
      );
      throw new Error(
        "PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_OPERATIONS_NICHT_BEREIT",
      );
    }

    const planen = this.#runtime.revalidierePlanenAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#aktivePlanenFaehigkeiten = Object.freeze([
      ...planen.aktivePlanenFaehigkeiten,
    ]);
    if (!planen.bereit || this.#aktivePlanenFaehigkeiten.length > 0) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_PLANEN_NICHT_BEREIT",
      );
    }

    const vorAuthority =
      this.#runtime.revalidiereBankDepositEinmalAuthority(
        beobachtung.healthEvidence,
        jetztMs,
      );
    this.#bankDepositEinmalAuthorityOffen = vorAuthority.authorityOffen;
    if (!vorAuthority.bereit || vorAuthority.authorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_DEPOSIT_EINMAL_AUTHORITY_NICHT_FREI",
      );
    }

    const ergebnis = await this.#runtime.erteileBankDepositEinmalAuthority(
      Object.freeze({
        ...anfrage,
        healthEvidence: beobachtung.healthEvidence,
        jetztMs,
      }),
    );
    this.#bankDepositEinmalAuthorityOffen = ergebnis.erfolgreich
      && ergebnis.authority !== null;
    return ergebnis;
  }

  public async erteileBankWithdrawEinmalAuthority(
    anfrage: HostBankWithdrawEinmalAuthorityAnfrage,
    jetztMs: number,
  ): Promise<ProduktionsBankWithdrawEinmalAuthorityErgebnis> {
    pruefeZeit(jetztMs);
    if (this.#zustand !== "LAEUFT") {
      throw new Error("PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_HOST_NICHT_BEREIT");
    }
    if (this.#aktivePlanenFaehigkeiten.length > 0) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_PLANEN_NOCH_AKTIV",
      );
    }
    if (this.#equipEinmalAuthorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_EQUIP_AUTHORITY_OFFEN",
      );
    }
    if (this.#bankDepositEinmalAuthorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_DEPOSIT_AUTHORITY_OFFEN",
      );
    }
    if (this.#bankWithdrawEinmalAuthorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_WITHDRAW_AUTHORITY_OFFEN",
      );
    }

    const beobachtung = await this.#beobachteFailClosed(jetztMs);
    if (beobachtung === null) {
      this.#runtime.revalidiereBankWithdrawEinmalAuthority(
        Object.freeze([]),
        jetztMs,
      );
      this.#bankWithdrawEinmalAuthorityOffen = false;
      this.#setze(
        "GESPERRT",
        "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
      );
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_OPERATIONS_NICHT_BEREIT",
      );
    }

    const planen = this.#runtime.revalidierePlanenAuthority(
      beobachtung.healthEvidence,
      jetztMs,
    );
    this.#aktivePlanenFaehigkeiten = Object.freeze([
      ...planen.aktivePlanenFaehigkeiten,
    ]);
    if (!planen.bereit || this.#aktivePlanenFaehigkeiten.length > 0) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_PLANEN_NICHT_BEREIT",
      );
    }

    const vorAuthority =
      this.#runtime.revalidiereBankWithdrawEinmalAuthority(
        beobachtung.healthEvidence,
        jetztMs,
      );
    this.#bankWithdrawEinmalAuthorityOffen = vorAuthority.authorityOffen;
    if (!vorAuthority.bereit || vorAuthority.authorityOffen) {
      throw new Error(
        "PRODUKTIONS_HOST_BANK_WITHDRAW_EINMAL_AUTHORITY_NICHT_FREI",
      );
    }

    const ergebnis = await this.#runtime.erteileBankWithdrawEinmalAuthority(
      Object.freeze({
        ...anfrage,
        healthEvidence: beobachtung.healthEvidence,
        jetztMs,
      }),
    );
    this.#bankWithdrawEinmalAuthorityOffen = ergebnis.erfolgreich
      && ergebnis.authority !== null;
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
      equipEinmalAuthorityOffen: this.#equipEinmalAuthorityOffen,
      bankDepositEinmalAuthorityOffen:
        this.#bankDepositEinmalAuthorityOffen,
      bankWithdrawEinmalAuthorityOffen:
        this.#bankWithdrawEinmalAuthorityOffen,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
  }
}
