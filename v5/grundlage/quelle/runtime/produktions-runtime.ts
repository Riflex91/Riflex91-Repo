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
import {
  EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
  EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
  EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
  EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
  EQUIPMENT_EQUIP_VERIFIER_ID,
  ProduktiveEquipEinmalAuthority,
  type V5EquipEinmalAuthorityAnforderung,
  type V5EquipEinmalAuthorityDurableBestaetigung,
  type V5EquipEinmalAuthorityDurableIntent,
  type V5EquipEinmalAuthorityErgebnis,
  type V5EquipEinmalAuthorityProtokollPort,
  type V5EquipEinmalAuthorityRevalidierungsErgebnis,
} from "../equipment/produktions-einmal-authority.js";
import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
} from "../equipment/modul-vertrag.js";
import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
  BANK_DEPOSIT_EINMAL_POLICY_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  ProduktiveBankDepositEinmalAuthority,
  type V5BankDepositEinmalAuthorityAnforderung,
  type V5BankDepositEinmalAuthorityDurableBestaetigung,
  type V5BankDepositEinmalAuthorityDurableIntent,
  type V5BankDepositEinmalAuthorityErgebnis,
  type V5BankDepositEinmalAuthorityProtokollPort,
  type V5BankDepositEinmalAuthorityRevalidierungsErgebnis,
} from "../merchant/bank-deposit-einmal-authority.js";
import {
  BANK_WITHDRAW_ACTION_CONTRACT_ID,
  BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
  BANK_WITHDRAW_EINMAL_POLICY_ID,
  BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
  BANK_WITHDRAW_VERIFIER_ID,
  ProduktiveBankWithdrawEinmalAuthority,
  type V5BankWithdrawEinmalAuthorityAnforderung,
  type V5BankWithdrawEinmalAuthorityDurableBestaetigung,
  type V5BankWithdrawEinmalAuthorityDurableIntent,
  type V5BankWithdrawEinmalAuthorityErgebnis,
  type V5BankWithdrawEinmalAuthorityProtokollPort,
  type V5BankWithdrawEinmalAuthorityRevalidierungsErgebnis,
} from "../merchant/bank-withdraw-einmal-authority.js";
import {
  BANK_SWAP_ACTION_CONTRACT_ID,
  BANK_SWAP_EINMAL_BESTAETIGUNG,
  BANK_SWAP_EINMAL_POLICY_ID,
  BANK_SWAP_RECOVERY_CONTRACT_ID,
  BANK_SWAP_VERIFIER_ID,
  ProduktiveBankSwapEinmalAuthority,
  type V5BankSwapEinmalAuthorityAnforderung,
  type V5BankSwapEinmalAuthorityDurableBestaetigung,
  type V5BankSwapEinmalAuthorityDurableIntent,
  type V5BankSwapEinmalAuthorityErgebnis,
  type V5BankSwapEinmalAuthorityProtokollPort,
  type V5BankSwapEinmalAuthorityRevalidierungsErgebnis,
} from "../merchant/bank-swap-einmal-authority.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
} from "../merchant/bank-produktions-modul-vertrag.js";
import {
  BankLeaseKoordinator,
} from "../koordination/account-bank-lease.js";
import {
  ProduktiveEquipTransaktionsOrchestrierung,
  type ProduktiveEquipTransaktionsAbhaengigkeiten,
  type ProduktiveEquipTransaktionsAnforderung,
  type ProduktiveEquipTransaktionsErgebnis,
} from "../equipment/produktions-equip-transaktion.js";
import {
  ProduktiveBankDepositShadowAdmission,
  type BankDepositShadowAbhaengigkeiten,
  type BankDepositShadowAnforderung,
  type BankDepositShadowErgebnis,
} from "../merchant/bank-deposit-shadow-admission.js";
import {
  ProduktiveBankWithdrawShadowAdmission,
  type BankWithdrawShadowAbhaengigkeiten,
  type BankWithdrawShadowAnforderung,
  type BankWithdrawShadowErgebnis,
} from "../merchant/bank-withdraw-shadow-admission.js";
import {
  ProduktiveBankSwapShadowAdmission,
  type BankSwapShadowAbhaengigkeiten,
  type BankSwapShadowAnforderung,
  type BankSwapShadowErgebnis,
} from "../merchant/bank-swap-shadow-admission.js";
import {
  ProduktiveBankDepositTransaktionsOrchestrierung,
  type ProduktiveBankDepositTransaktionsAbhaengigkeiten,
  type ProduktiveBankDepositTransaktionsAnforderung,
  type ProduktiveBankDepositTransaktionsErgebnis,
} from "../merchant/bank-deposit-produktions-transaktion.js";
import {
  ProduktiveBankWithdrawTransaktionsOrchestrierung,
  type ProduktiveBankWithdrawTransaktionsAbhaengigkeiten,
  type ProduktiveBankWithdrawTransaktionsAnforderung,
  type ProduktiveBankWithdrawTransaktionsErgebnis,
} from "../merchant/bank-withdraw-produktions-transaktion.js";
import {
  ProduktiveBankSwapTransaktionsOrchestrierung,
  type ProduktiveBankSwapTransaktionsAbhaengigkeiten,
  type ProduktiveBankSwapTransaktionsAnforderung,
  type ProduktiveBankSwapTransaktionsErgebnis,
} from "../merchant/bank-swap-produktions-transaktion.js";
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
    anbieterVersion?: string,
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

export interface V5PlanenRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly deaktivierteFaehigkeiten: readonly string[];
  readonly aktivePlanenFaehigkeiten: readonly string[];
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
  readonly offeneEquipEinmalAuthority: boolean;
  readonly offeneBankDepositEinmalAuthority: boolean;
  readonly offeneBankWithdrawEinmalAuthority: boolean;
  readonly offeneBankSwapEinmalAuthority: boolean;
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
  readonly #bankLeaseKoordinator = new BankLeaseKoordinator(
    this.#ressourcen,
  );
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
  readonly #equipEinmalAuthorityProtokoll:
    V5EquipEinmalAuthorityProtokollPort | null;
  readonly #bankDepositEinmalAuthorityProtokoll:
    V5BankDepositEinmalAuthorityProtokollPort | null;
  readonly #bankWithdrawEinmalAuthorityProtokoll:
    V5BankWithdrawEinmalAuthorityProtokollPort | null;
  readonly #bankSwapEinmalAuthorityProtokoll:
    V5BankSwapEinmalAuthorityProtokollPort | null;
  #planenAktivierungsAudit: readonly V5PlanenAktivierungsAuditEintrag[] =
    Object.freeze([]);
  #equipEinmalAuthority: ProduktiveEquipEinmalAuthority | null = null;
  #bankDepositEinmalAuthority:
    ProduktiveBankDepositEinmalAuthority | null = null;
  #bankWithdrawEinmalAuthority:
    ProduktiveBankWithdrawEinmalAuthority | null = null;
  #bankSwapEinmalAuthority:
    ProduktiveBankSwapEinmalAuthority | null = null;

  #prozessLaeuft = false;
  #zustand: V5ProduktionsRuntimeStatus["zustand"] = "GESTOPPT";
  #endgueltigGestoppt = false;

  public constructor(
    definition: V5ProduktionsKompositionsDefinition,
    bedienerRichtlinie: BedienerRichtlinienDienst | null = null,
    planenAktivierungsProtokoll: V5PlanenAktivierungsProtokollPort | null = null,
    equipEinmalAuthorityProtokoll:
      V5EquipEinmalAuthorityProtokollPort | null = null,
    bankDepositEinmalAuthorityProtokoll:
      V5BankDepositEinmalAuthorityProtokollPort | null = null,
    bankWithdrawEinmalAuthorityProtokoll:
      V5BankWithdrawEinmalAuthorityProtokollPort | null = null,
    bankSwapEinmalAuthorityProtokoll:
      V5BankSwapEinmalAuthorityProtokollPort | null = null,
  ) {
    pruefeDefinition(definition);
    this.#bedienerRichtlinie = bedienerRichtlinie;
    this.#planenAktivierungsProtokoll = planenAktivierungsProtokoll;
    this.#equipEinmalAuthorityProtokoll = equipEinmalAuthorityProtokoll;
    this.#bankDepositEinmalAuthorityProtokoll =
      bankDepositEinmalAuthorityProtokoll;
    this.#bankWithdrawEinmalAuthorityProtokoll =
      bankWithdrawEinmalAuthorityProtokoll;
    this.#bankSwapEinmalAuthorityProtokoll =
      bankSwapEinmalAuthorityProtokoll;

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
        deaktiviere: (
          faehigkeitId: string,
          anbieterModulId: string,
          anbieterVersion?: string,
        ) => this.#faehigkeiten.deaktiviere(
          faehigkeitId,
          anbieterModulId,
          anbieterVersion,
        ),
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

  public async erteileBankDepositEinmalAuthority(
    anforderung: V5BankDepositEinmalAuthorityAnforderung,
  ): Promise<V5BankDepositEinmalAuthorityErgebnis> {
    const blockiere = (
      grund: string,
      evidenceIds: readonly string[] = Object.freeze([]),
    ): V5BankDepositEinmalAuthorityErgebnis => Object.freeze({
      schemaVersion: 1,
      erfolgreich: false,
      grund,
      aktivierungsId: String(anforderung?.aktivierungsId ?? ""),
      transaktionsId: String(anforderung?.transaktionsId ?? ""),
      authority: null,
      evidenceIds: Object.freeze([...evidenceIds]),
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });

    if (anforderung.schemaVersion !== 1
        || anforderung.faehigkeitId !== MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID
        || anforderung.anbieterModulId !== MERCHANT_BANK_CORE_MODUL_ID
        || anforderung.anbieterVersion !== MERCHANT_BANK_CORE_MODUL_VERSION
        || anforderung.actionContractId !== BANK_DEPOSIT_ACTION_CONTRACT_ID
        || anforderung.recoveryContractId !== BANK_DEPOSIT_RECOVERY_CONTRACT_ID
        || anforderung.verifierId !== BANK_DEPOSIT_VERIFIER_ID
        || anforderung.policyId !== BANK_DEPOSIT_EINMAL_POLICY_ID
        || anforderung.bestaetigungText !== BANK_DEPOSIT_EINMAL_BESTAETIGUNG) {
      return blockiere("V5_BANK_DEPOSIT_EINMAL_BINDUNG_UNGUELTIG");
    }
    for (const wert of [
      anforderung.aktivierungsId,
      anforderung.transaktionsId,
    ]) {
      if (wert.trim().length === 0 || wert.length > 128) {
        return blockiere("V5_BANK_DEPOSIT_EINMAL_KENNUNG_UNGUELTIG");
      }
    }
    if (!Number.isSafeInteger(anforderung.jetztMs)
        || !Number.isSafeInteger(anforderung.gueltigBisMs)
        || anforderung.jetztMs < 0
        || anforderung.gueltigBisMs < anforderung.jetztMs
        || anforderung.gueltigBisMs - anforderung.jetztMs > 2_000
        || anforderung.healthEvidence.length > 512) {
      return blockiere("V5_BANK_DEPOSIT_EINMAL_ZEIT_ODER_EVIDENCE_UNGUELTIG");
    }

    if (this.#bankDepositEinmalAuthority !== null) {
      if (this.#bankDepositEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
        return blockiere("V5_BANK_DEPOSIT_EINMAL_AUTHORITY_BEREITS_OFFEN");
      }
      this.#bankDepositEinmalAuthority.widerrufe();
      this.#bankDepositEinmalAuthority = null;
    }

    if (this.#bankWithdrawEinmalAuthority !== null
        && this.#bankWithdrawEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_DEPOSIT_EINMAL_WITHDRAW_AUTHORITY_OFFEN");
    }
    if (this.#bankSwapEinmalAuthority !== null
        && this.#bankSwapEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_DEPOSIT_EINMAL_SWAP_AUTHORITY_OFFEN");
    }

    const pruefeVorWirkung = (): string | null => {
      if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
        return "V5_BANK_DEPOSIT_EINMAL_RUNTIME_LAEUFT_NICHT";
      }
      if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
        return "V5_BANK_DEPOSIT_EINMAL_LAUFSTEUERUNG_GESPERRT";
      }
      if (this.#bedienerRichtlinie === null) {
        return "V5_BANK_DEPOSIT_EINMAL_BEDIENER_RICHTLINIE_FEHLT";
      }
      if (this.#bedienerRichtlinie.snapshot().nothaltAktiv) {
        return "V5_BANK_DEPOSIT_EINMAL_NOTHALT_AKTIV";
      }
      if (!this.#bedienerRichtlinie.istErlaubt(
        MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      )) {
        return "V5_BANK_DEPOSIT_EINMAL_DURCH_POLICY_GESPERRT";
      }

      const faehigkeit = this.#faehigkeiten.sicht().find(x =>
        x.faehigkeitId === MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID
        && x.anbieterModulId === MERCHANT_BANK_CORE_MODUL_ID
        && x.anbieterVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
      if (faehigkeit === undefined
          || faehigkeit.modus !== "MUTIEREN"
          || faehigkeit.status !== "VERFUEGBAR"
          || faehigkeit.standardAktiv !== false
          || faehigkeit.aktiv) {
        return "V5_BANK_DEPOSIT_EINMAL_CAPABILITY_NICHT_BEREIT";
      }

      const modul = this.#module.sicht().find(x =>
        x.modulId === MERCHANT_BANK_CORE_MODUL_ID
        && x.modulVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
      if (modul === undefined
          || modul.gesundheit !== "GESUND"
          || modul.aktiv
          || !modul.bereitgestellteFaehigkeiten.includes(
            MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
          )) {
        return "V5_BANK_DEPOSIT_EINMAL_PROVIDER_NICHT_BEREIT";
      }

      try {
        if (!this.#supervisor.status(
          anforderung.healthEvidence,
          anforderung.jetztMs,
        ).bereit) {
          return "V5_BANK_DEPOSIT_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        return "V5_BANK_DEPOSIT_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
      return null;
    };

    const vorAudit = pruefeVorWirkung();
    if (vorAudit !== null) return blockiere(vorAudit);
    if (this.#bankDepositEinmalAuthorityProtokoll === null) {
      return blockiere("V5_BANK_DEPOSIT_EINMAL_DURABLE_PROTOKOLL_FEHLT");
    }

    const evidenceIds = Object.freeze(
      anforderung.healthEvidence
        .map(x => x.evidenceId)
        .filter((id, index, alle) => alle.indexOf(id) === index)
        .sort(),
    );
    if (evidenceIds.length < 1 || evidenceIds.length > 64) {
      return blockiere("V5_BANK_DEPOSIT_EINMAL_EVIDENCE_UNGUELTIG");
    }

    const intent: V5BankDepositEinmalAuthorityDurableIntent = Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
      anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
      actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
      recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
      verifierId: BANK_DEPOSIT_VERIFIER_ID,
      policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
      evidenceIds,
      zeitMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      art: "BANK_DEPOSIT_EINMAL_AUTHORITY_VOR_WIRKUNG",
      maximaleVerwendungen: 1,
      breiteRuntimeFreigabe: false,
      rawWriteAutoritaet: false,
      gameplayWriteNochNichtAusgefuehrt: true,
    });

    let bestaetigung: V5BankDepositEinmalAuthorityDurableBestaetigung;
    try {
      bestaetigung =
        await this.#bankDepositEinmalAuthorityProtokoll.schreibeDurable(intent);
    } catch {
      return blockiere(
        "V5_BANK_DEPOSIT_EINMAL_AUDIT_NICHT_DURABLE",
        evidenceIds,
      );
    }
    if (bestaetigung.durable !== true
        || bestaetigung.aktivierungsId !== anforderung.aktivierungsId
        || bestaetigung.transaktionsId !== anforderung.transaktionsId
        || bestaetigung.bestaetigungsId.trim().length === 0
        || bestaetigung.bestaetigungsId.length > 192) {
      return blockiere(
        "V5_BANK_DEPOSIT_EINMAL_DURABILITY_NICHT_BESTAETIGT",
        evidenceIds,
      );
    }

    const nachAudit = pruefeVorWirkung();
    if (nachAudit !== null) {
      return blockiere(
        "V5_BANK_DEPOSIT_EINMAL_REVALIDIERUNG_FEHLGESCHLAGEN:" + nachAudit,
        evidenceIds,
      );
    }

    const faehigkeit = this.#faehigkeiten.sicht().find(x =>
      x.faehigkeitId === MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID
      && x.anbieterModulId === MERCHANT_BANK_CORE_MODUL_ID
      && x.anbieterVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
    if (faehigkeit === undefined) {
      return blockiere(
        "V5_BANK_DEPOSIT_EINMAL_PROVIDER_VERLOREN",
        evidenceIds,
      );
    }

    const authority = new ProduktiveBankDepositEinmalAuthority(Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
      anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
      actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
      recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
      verifierId: BANK_DEPOSIT_VERIFIER_ID,
      policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
      ausgestelltAmMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      faehigkeitsGeneration: faehigkeit.generation,
      evidenceIds,
      maximaleVerwendungen: 1,
    }));
    this.#bankDepositEinmalAuthority = authority;

    return Object.freeze({
      schemaVersion: 1,
      erfolgreich: true,
      grund: "V5_BANK_DEPOSIT_EINMAL_AUTHORITY_ERTEILT",
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      authority,
      evidenceIds,
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public revalidiereBankDepositEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): V5BankDepositEinmalAuthorityRevalidierungsErgebnis {
    const authority = this.#bankDepositEinmalAuthority;
    if (authority === null) {
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_DEPOSIT_EINMAL_KEINE_AUTHORITY_OFFEN",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (authority.verbraucht()) {
      this.#bankDepositEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_DEPOSIT_EINMAL_AUTHORITY_VERBRAUCHT",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (!authority.gueltigFuer(jetztMs)) {
      authority.widerrufe();
      this.#bankDepositEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_DEPOSIT_EINMAL_AUTHORITY_ABGELAUFEN",
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }

    let grund: string | null = null;
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      grund = "V5_BANK_DEPOSIT_EINMAL_RUNTIME_LAEUFT_NICHT";
    } else if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
      grund = "V5_BANK_DEPOSIT_EINMAL_LAUFSTEUERUNG_GESPERRT";
    } else if (this.#bedienerRichtlinie === null
        || this.#bedienerRichtlinie.snapshot().nothaltAktiv
        || !this.#bedienerRichtlinie.istErlaubt(
          MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
        )) {
      grund = "V5_BANK_DEPOSIT_EINMAL_OPERATOR_POLICY_GESPERRT";
    } else {
      try {
        if (!this.#supervisor.status(healthEvidence, jetztMs).bereit) {
          grund = "V5_BANK_DEPOSIT_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        grund = "V5_BANK_DEPOSIT_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
    }

    if (grund !== null) {
      authority.widerrufe();
      this.#bankDepositEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: false,
        grund,
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    return Object.freeze({
      schemaVersion: 1,
      bereit: true,
      grund: "V5_BANK_DEPOSIT_EINMAL_AUTHORITY_BEREIT",
      authorityOffen: true,
      authorityWiderrufen: false,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public async erteileBankWithdrawEinmalAuthority(
    anforderung: V5BankWithdrawEinmalAuthorityAnforderung,
  ): Promise<V5BankWithdrawEinmalAuthorityErgebnis> {
    const blockiere = (
      grund: string,
      evidenceIds: readonly string[] = Object.freeze([]),
    ): V5BankWithdrawEinmalAuthorityErgebnis => Object.freeze({
      schemaVersion: 1,
      erfolgreich: false,
      grund,
      aktivierungsId: String(anforderung?.aktivierungsId ?? ""),
      transaktionsId: String(anforderung?.transaktionsId ?? ""),
      authority: null,
      evidenceIds: Object.freeze([...evidenceIds]),
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });

    if (anforderung.schemaVersion !== 1
        || anforderung.faehigkeitId !== MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID
        || anforderung.anbieterModulId !== MERCHANT_BANK_CORE_MODUL_ID
        || anforderung.anbieterVersion !== MERCHANT_BANK_CORE_MODUL_VERSION
        || anforderung.actionContractId !== BANK_WITHDRAW_ACTION_CONTRACT_ID
        || anforderung.recoveryContractId !== BANK_WITHDRAW_RECOVERY_CONTRACT_ID
        || anforderung.verifierId !== BANK_WITHDRAW_VERIFIER_ID
        || anforderung.policyId !== BANK_WITHDRAW_EINMAL_POLICY_ID
        || anforderung.bestaetigungText !== BANK_WITHDRAW_EINMAL_BESTAETIGUNG) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_BINDUNG_UNGUELTIG");
    }
    for (const wert of [
      anforderung.aktivierungsId,
      anforderung.transaktionsId,
    ]) {
      if (wert.trim().length === 0 || wert.length > 128) {
        return blockiere("V5_BANK_WITHDRAW_EINMAL_KENNUNG_UNGUELTIG");
      }
    }
    if (!Number.isSafeInteger(anforderung.jetztMs)
        || !Number.isSafeInteger(anforderung.gueltigBisMs)
        || anforderung.jetztMs < 0
        || anforderung.gueltigBisMs < anforderung.jetztMs
        || anforderung.gueltigBisMs - anforderung.jetztMs > 2_000
        || anforderung.healthEvidence.length > 512) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_ZEIT_ODER_EVIDENCE_UNGUELTIG");
    }

    if (this.#bankWithdrawEinmalAuthority !== null) {
      if (this.#bankWithdrawEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
        return blockiere("V5_BANK_WITHDRAW_EINMAL_AUTHORITY_BEREITS_OFFEN");
      }
      this.#bankWithdrawEinmalAuthority.widerrufe();
      this.#bankWithdrawEinmalAuthority = null;
    }

    if (this.#equipEinmalAuthority !== null
        && this.#equipEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_EQUIP_AUTHORITY_OFFEN");
    }
    if (this.#bankDepositEinmalAuthority !== null
        && this.#bankDepositEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_DEPOSIT_AUTHORITY_OFFEN");
    }
    if (this.#bankSwapEinmalAuthority !== null
        && this.#bankSwapEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_SWAP_AUTHORITY_OFFEN");
    }

    const pruefeVorWirkung = (): string | null => {
      if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
        return "V5_BANK_WITHDRAW_EINMAL_RUNTIME_LAEUFT_NICHT";
      }
      if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
        return "V5_BANK_WITHDRAW_EINMAL_LAUFSTEUERUNG_GESPERRT";
      }
      if (this.#bedienerRichtlinie === null) {
        return "V5_BANK_WITHDRAW_EINMAL_BEDIENER_RICHTLINIE_FEHLT";
      }
      if (this.#bedienerRichtlinie.snapshot().nothaltAktiv) {
        return "V5_BANK_WITHDRAW_EINMAL_NOTHALT_AKTIV";
      }
      if (!this.#bedienerRichtlinie.istErlaubt(
        MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
      )) {
        return "V5_BANK_WITHDRAW_EINMAL_DURCH_POLICY_GESPERRT";
      }

      const faehigkeit = this.#faehigkeiten.sicht().find(x =>
        x.faehigkeitId === MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID
        && x.anbieterModulId === MERCHANT_BANK_CORE_MODUL_ID
        && x.anbieterVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
      if (faehigkeit === undefined
          || faehigkeit.modus !== "MUTIEREN"
          || faehigkeit.status !== "VERFUEGBAR"
          || faehigkeit.standardAktiv !== false
          || faehigkeit.aktiv) {
        return "V5_BANK_WITHDRAW_EINMAL_CAPABILITY_NICHT_BEREIT";
      }

      const modul = this.#module.sicht().find(x =>
        x.modulId === MERCHANT_BANK_CORE_MODUL_ID
        && x.modulVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
      if (modul === undefined
          || modul.gesundheit !== "GESUND"
          || modul.aktiv
          || !modul.bereitgestellteFaehigkeiten.includes(
            MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
          )) {
        return "V5_BANK_WITHDRAW_EINMAL_PROVIDER_NICHT_BEREIT";
      }

      try {
        if (!this.#supervisor.status(
          anforderung.healthEvidence,
          anforderung.jetztMs,
        ).bereit) {
          return "V5_BANK_WITHDRAW_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        return "V5_BANK_WITHDRAW_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
      return null;
    };

    const vorAudit = pruefeVorWirkung();
    if (vorAudit !== null) return blockiere(vorAudit);
    if (this.#bankWithdrawEinmalAuthorityProtokoll === null) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_DURABLE_PROTOKOLL_FEHLT");
    }

    const evidenceIds = Object.freeze(
      anforderung.healthEvidence
        .map(x => x.evidenceId)
        .filter((id, index, alle) => alle.indexOf(id) === index)
        .sort(),
    );
    if (evidenceIds.length < 1 || evidenceIds.length > 64) {
      return blockiere("V5_BANK_WITHDRAW_EINMAL_EVIDENCE_UNGUELTIG");
    }

    const intent: V5BankWithdrawEinmalAuthorityDurableIntent = Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
      anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
      anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
      actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
      recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
      verifierId: BANK_WITHDRAW_VERIFIER_ID,
      policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
      evidenceIds,
      zeitMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      art: "BANK_WITHDRAW_EINMAL_AUTHORITY_VOR_WIRKUNG",
      maximaleVerwendungen: 1,
      breiteRuntimeFreigabe: false,
      rawWriteAutoritaet: false,
      gameplayWriteNochNichtAusgefuehrt: true,
    });

    let bestaetigung: V5BankWithdrawEinmalAuthorityDurableBestaetigung;
    try {
      bestaetigung =
        await this.#bankWithdrawEinmalAuthorityProtokoll.schreibeDurable(intent);
    } catch {
      return blockiere(
        "V5_BANK_WITHDRAW_EINMAL_AUDIT_NICHT_DURABLE",
        evidenceIds,
      );
    }
    if (bestaetigung.durable !== true
        || bestaetigung.aktivierungsId !== anforderung.aktivierungsId
        || bestaetigung.transaktionsId !== anforderung.transaktionsId
        || bestaetigung.bestaetigungsId.trim().length === 0
        || bestaetigung.bestaetigungsId.length > 192) {
      return blockiere(
        "V5_BANK_WITHDRAW_EINMAL_DURABILITY_NICHT_BESTAETIGT",
        evidenceIds,
      );
    }

    const nachAudit = pruefeVorWirkung();
    if (nachAudit !== null) {
      return blockiere(
        "V5_BANK_WITHDRAW_EINMAL_REVALIDIERUNG_FEHLGESCHLAGEN:" + nachAudit,
        evidenceIds,
      );
    }

    const faehigkeit = this.#faehigkeiten.sicht().find(x =>
      x.faehigkeitId === MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID
      && x.anbieterModulId === MERCHANT_BANK_CORE_MODUL_ID
      && x.anbieterVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
    if (faehigkeit === undefined) {
      return blockiere(
        "V5_BANK_WITHDRAW_EINMAL_PROVIDER_VERLOREN",
        evidenceIds,
      );
    }

    const authority = new ProduktiveBankWithdrawEinmalAuthority(Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
      anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
      anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
      actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
      recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
      verifierId: BANK_WITHDRAW_VERIFIER_ID,
      policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
      ausgestelltAmMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      faehigkeitsGeneration: faehigkeit.generation,
      evidenceIds,
      maximaleVerwendungen: 1,
    }));
    this.#bankWithdrawEinmalAuthority = authority;

    return Object.freeze({
      schemaVersion: 1,
      erfolgreich: true,
      grund: "V5_BANK_WITHDRAW_EINMAL_AUTHORITY_ERTEILT",
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      authority,
      evidenceIds,
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public async erteileBankSwapEinmalAuthority(
    anforderung: V5BankSwapEinmalAuthorityAnforderung,
  ): Promise<V5BankSwapEinmalAuthorityErgebnis> {
    const blockiere = (
      grund: string,
      evidenceIds: readonly string[] = Object.freeze([]),
    ): V5BankSwapEinmalAuthorityErgebnis => Object.freeze({
      schemaVersion: 1,
      erfolgreich: false,
      grund,
      aktivierungsId: String(anforderung?.aktivierungsId ?? ""),
      transaktionsId: String(anforderung?.transaktionsId ?? ""),
      authority: null,
      evidenceIds: Object.freeze([...evidenceIds]),
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });

    if (anforderung.schemaVersion !== 1
        || anforderung.faehigkeitId !== MERCHANT_BANK_SWAP_FAEHIGKEIT_ID
        || anforderung.anbieterModulId !== MERCHANT_BANK_CORE_MODUL_ID
        || anforderung.anbieterVersion !== MERCHANT_BANK_CORE_MODUL_VERSION
        || anforderung.actionContractId !== BANK_SWAP_ACTION_CONTRACT_ID
        || anforderung.recoveryContractId !== BANK_SWAP_RECOVERY_CONTRACT_ID
        || anforderung.verifierId !== BANK_SWAP_VERIFIER_ID
        || anforderung.policyId !== BANK_SWAP_EINMAL_POLICY_ID
        || anforderung.bestaetigungText !== BANK_SWAP_EINMAL_BESTAETIGUNG) {
      return blockiere("V5_BANK_SWAP_EINMAL_BINDUNG_UNGUELTIG");
    }
    for (const wert of [
      anforderung.aktivierungsId,
      anforderung.transaktionsId,
    ]) {
      if (wert.trim().length === 0 || wert.length > 128) {
        return blockiere("V5_BANK_SWAP_EINMAL_KENNUNG_UNGUELTIG");
      }
    }
    if (!Number.isSafeInteger(anforderung.jetztMs)
        || !Number.isSafeInteger(anforderung.gueltigBisMs)
        || anforderung.jetztMs < 0
        || anforderung.gueltigBisMs < anforderung.jetztMs
        || anforderung.gueltigBisMs - anforderung.jetztMs > 2_000
        || anforderung.healthEvidence.length > 512) {
      return blockiere("V5_BANK_SWAP_EINMAL_ZEIT_ODER_EVIDENCE_UNGUELTIG");
    }

    if (this.#bankSwapEinmalAuthority !== null) {
      if (this.#bankSwapEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
        return blockiere("V5_BANK_SWAP_EINMAL_AUTHORITY_BEREITS_OFFEN");
      }
      this.#bankSwapEinmalAuthority.widerrufe();
      this.#bankSwapEinmalAuthority = null;
    }

    if (this.#equipEinmalAuthority !== null
        && this.#equipEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_SWAP_EINMAL_EQUIP_AUTHORITY_OFFEN");
    }
    if (this.#bankDepositEinmalAuthority !== null
        && this.#bankDepositEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_SWAP_EINMAL_DEPOSIT_AUTHORITY_OFFEN");
    }
    if (this.#bankWithdrawEinmalAuthority !== null
        && this.#bankWithdrawEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_BANK_SWAP_EINMAL_WITHDRAW_AUTHORITY_OFFEN");
    }

    const pruefeVorWirkung = (): string | null => {
      if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
        return "V5_BANK_SWAP_EINMAL_RUNTIME_LAEUFT_NICHT";
      }
      if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
        return "V5_BANK_SWAP_EINMAL_LAUFSTEUERUNG_GESPERRT";
      }
      if (this.#bedienerRichtlinie === null) {
        return "V5_BANK_SWAP_EINMAL_BEDIENER_RICHTLINIE_FEHLT";
      }
      if (this.#bedienerRichtlinie.snapshot().nothaltAktiv) {
        return "V5_BANK_SWAP_EINMAL_NOTHALT_AKTIV";
      }
      if (!this.#bedienerRichtlinie.istErlaubt(
        MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
      )) {
        return "V5_BANK_SWAP_EINMAL_DURCH_POLICY_GESPERRT";
      }

      const faehigkeit = this.#faehigkeiten.sicht().find(x =>
        x.faehigkeitId === MERCHANT_BANK_SWAP_FAEHIGKEIT_ID
        && x.anbieterModulId === MERCHANT_BANK_CORE_MODUL_ID
        && x.anbieterVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
      if (faehigkeit === undefined
          || faehigkeit.modus !== "MUTIEREN"
          || faehigkeit.status !== "VERFUEGBAR"
          || faehigkeit.standardAktiv !== false
          || faehigkeit.aktiv) {
        return "V5_BANK_SWAP_EINMAL_CAPABILITY_NICHT_BEREIT";
      }

      const modul = this.#module.sicht().find(x =>
        x.modulId === MERCHANT_BANK_CORE_MODUL_ID
        && x.modulVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
      if (modul === undefined
          || modul.gesundheit !== "GESUND"
          || modul.aktiv
          || !modul.bereitgestellteFaehigkeiten.includes(
            MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
          )) {
        return "V5_BANK_SWAP_EINMAL_PROVIDER_NICHT_BEREIT";
      }

      try {
        if (!this.#supervisor.status(
          anforderung.healthEvidence,
          anforderung.jetztMs,
        ).bereit) {
          return "V5_BANK_SWAP_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        return "V5_BANK_SWAP_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
      return null;
    };

    const vorAudit = pruefeVorWirkung();
    if (vorAudit !== null) return blockiere(vorAudit);
    if (this.#bankSwapEinmalAuthorityProtokoll === null) {
      return blockiere("V5_BANK_SWAP_EINMAL_DURABLE_PROTOKOLL_FEHLT");
    }

    const evidenceIds = Object.freeze(
      anforderung.healthEvidence
        .map(x => x.evidenceId)
        .filter((id, index, alle) => alle.indexOf(id) === index)
        .sort(),
    );
    if (evidenceIds.length < 1 || evidenceIds.length > 64) {
      return blockiere("V5_BANK_SWAP_EINMAL_EVIDENCE_UNGUELTIG");
    }

    const intent: V5BankSwapEinmalAuthorityDurableIntent = Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
      anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
      anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
      actionContractId: BANK_SWAP_ACTION_CONTRACT_ID,
      recoveryContractId: BANK_SWAP_RECOVERY_CONTRACT_ID,
      verifierId: BANK_SWAP_VERIFIER_ID,
      policyId: BANK_SWAP_EINMAL_POLICY_ID,
      evidenceIds,
      zeitMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      art: "BANK_SWAP_EINMAL_AUTHORITY_VOR_WIRKUNG",
      maximaleVerwendungen: 1,
      breiteRuntimeFreigabe: false,
      rawWriteAutoritaet: false,
      gameplayWriteNochNichtAusgefuehrt: true,
    });

    let bestaetigung: V5BankSwapEinmalAuthorityDurableBestaetigung;
    try {
      bestaetigung =
        await this.#bankSwapEinmalAuthorityProtokoll.schreibeDurable(intent);
    } catch {
      return blockiere(
        "V5_BANK_SWAP_EINMAL_AUDIT_NICHT_DURABLE",
        evidenceIds,
      );
    }
    if (bestaetigung.durable !== true
        || bestaetigung.aktivierungsId !== anforderung.aktivierungsId
        || bestaetigung.transaktionsId !== anforderung.transaktionsId
        || bestaetigung.bestaetigungsId.trim().length === 0
        || bestaetigung.bestaetigungsId.length > 192) {
      return blockiere(
        "V5_BANK_SWAP_EINMAL_DURABILITY_NICHT_BESTAETIGT",
        evidenceIds,
      );
    }

    const nachAudit = pruefeVorWirkung();
    if (nachAudit !== null) {
      return blockiere(
        "V5_BANK_SWAP_EINMAL_REVALIDIERUNG_FEHLGESCHLAGEN:" + nachAudit,
        evidenceIds,
      );
    }

    const faehigkeit = this.#faehigkeiten.sicht().find(x =>
      x.faehigkeitId === MERCHANT_BANK_SWAP_FAEHIGKEIT_ID
      && x.anbieterModulId === MERCHANT_BANK_CORE_MODUL_ID
      && x.anbieterVersion === MERCHANT_BANK_CORE_MODUL_VERSION);
    if (faehigkeit === undefined) {
      return blockiere(
        "V5_BANK_SWAP_EINMAL_PROVIDER_VERLOREN",
        evidenceIds,
      );
    }

    const authority = new ProduktiveBankSwapEinmalAuthority(Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
      anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
      anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
      actionContractId: BANK_SWAP_ACTION_CONTRACT_ID,
      recoveryContractId: BANK_SWAP_RECOVERY_CONTRACT_ID,
      verifierId: BANK_SWAP_VERIFIER_ID,
      policyId: BANK_SWAP_EINMAL_POLICY_ID,
      ausgestelltAmMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      faehigkeitsGeneration: faehigkeit.generation,
      evidenceIds,
      maximaleVerwendungen: 1,
    }));
    this.#bankSwapEinmalAuthority = authority;

    return Object.freeze({
      schemaVersion: 1,
      erfolgreich: true,
      grund: "V5_BANK_SWAP_EINMAL_AUTHORITY_ERTEILT",
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      authority,
      evidenceIds,
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public revalidiereBankWithdrawEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): V5BankWithdrawEinmalAuthorityRevalidierungsErgebnis {
    const authority = this.#bankWithdrawEinmalAuthority;
    if (authority === null) {
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_WITHDRAW_EINMAL_KEINE_AUTHORITY_OFFEN",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (authority.verbraucht()) {
      this.#bankWithdrawEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_WITHDRAW_EINMAL_AUTHORITY_VERBRAUCHT",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (!authority.gueltigFuer(jetztMs)) {
      authority.widerrufe();
      this.#bankWithdrawEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_WITHDRAW_EINMAL_AUTHORITY_ABGELAUFEN",
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }

    let grund: string | null = null;
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      grund = "V5_BANK_WITHDRAW_EINMAL_RUNTIME_LAEUFT_NICHT";
    } else if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
      grund = "V5_BANK_WITHDRAW_EINMAL_LAUFSTEUERUNG_GESPERRT";
    } else if (this.#bedienerRichtlinie === null
        || this.#bedienerRichtlinie.snapshot().nothaltAktiv
        || !this.#bedienerRichtlinie.istErlaubt(
          MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
        )) {
      grund = "V5_BANK_WITHDRAW_EINMAL_OPERATOR_POLICY_GESPERRT";
    } else {
      try {
        if (!this.#supervisor.status(healthEvidence, jetztMs).bereit) {
          grund = "V5_BANK_WITHDRAW_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        grund = "V5_BANK_WITHDRAW_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
    }

    if (grund !== null) {
      authority.widerrufe();
      this.#bankWithdrawEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: false,
        grund,
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    return Object.freeze({
      schemaVersion: 1,
      bereit: true,
      grund: "V5_BANK_WITHDRAW_EINMAL_AUTHORITY_BEREIT",
      authorityOffen: true,
      authorityWiderrufen: false,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public revalidiereBankSwapEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): V5BankSwapEinmalAuthorityRevalidierungsErgebnis {
    const authority = this.#bankSwapEinmalAuthority;
    if (authority === null) {
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_SWAP_EINMAL_KEINE_AUTHORITY_OFFEN",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (authority.verbraucht()) {
      this.#bankSwapEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_SWAP_EINMAL_AUTHORITY_VERBRAUCHT",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (!authority.gueltigFuer(jetztMs)) {
      authority.widerrufe();
      this.#bankSwapEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_BANK_SWAP_EINMAL_AUTHORITY_ABGELAUFEN",
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }

    let grund: string | null = null;
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      grund = "V5_BANK_SWAP_EINMAL_RUNTIME_LAEUFT_NICHT";
    } else if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
      grund = "V5_BANK_SWAP_EINMAL_LAUFSTEUERUNG_GESPERRT";
    } else if (this.#bedienerRichtlinie === null
        || this.#bedienerRichtlinie.snapshot().nothaltAktiv
        || !this.#bedienerRichtlinie.istErlaubt(
          MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
        )) {
      grund = "V5_BANK_SWAP_EINMAL_OPERATOR_POLICY_GESPERRT";
    } else {
      try {
        if (!this.#supervisor.status(healthEvidence, jetztMs).bereit) {
          grund = "V5_BANK_SWAP_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        grund = "V5_BANK_SWAP_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
    }

    if (grund !== null) {
      authority.widerrufe();
      this.#bankSwapEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: false,
        grund,
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    return Object.freeze({
      schemaVersion: 1,
      bereit: true,
      grund: "V5_BANK_SWAP_EINMAL_AUTHORITY_BEREIT",
      authorityOffen: true,
      authorityWiderrufen: false,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public async erteileEquipEinmalAuthority(
    anforderung: V5EquipEinmalAuthorityAnforderung,
  ): Promise<V5EquipEinmalAuthorityErgebnis> {
    const blockiere = (
      grund: string,
      evidenceIds: readonly string[] = Object.freeze([]),
    ): V5EquipEinmalAuthorityErgebnis => Object.freeze({
      schemaVersion: 1,
      erfolgreich: false,
      grund,
      aktivierungsId: String(anforderung?.aktivierungsId ?? ""),
      transaktionsId: String(anforderung?.transaktionsId ?? ""),
      authority: null,
      evidenceIds: Object.freeze([...evidenceIds]),
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });

    if (anforderung.schemaVersion !== 1
        || anforderung.faehigkeitId !== EQUIPMENT_EQUIP_FAEHIGKEIT_ID
        || anforderung.anbieterModulId !== EQUIPMENT_CORE_MODUL_ID
        || anforderung.anbieterVersion !== EQUIPMENT_CORE_MODUL_VERSION
        || anforderung.actionContractId !== EQUIPMENT_EQUIP_ACTION_CONTRACT_ID
        || anforderung.recoveryContractId !== EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID
        || anforderung.verifierId !== EQUIPMENT_EQUIP_VERIFIER_ID
        || anforderung.policyId !== EQUIPMENT_EQUIP_EINMAL_POLICY_ID
        || anforderung.bestaetigungText !== EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG) {
      return blockiere("V5_EQUIP_EINMAL_BINDUNG_UNGUELTIG");
    }
    for (const wert of [
      anforderung.aktivierungsId,
      anforderung.transaktionsId,
    ]) {
      if (wert.trim().length === 0 || wert.length > 128) {
        return blockiere("V5_EQUIP_EINMAL_KENNUNG_UNGUELTIG");
      }
    }
    if (!Number.isSafeInteger(anforderung.jetztMs)
        || !Number.isSafeInteger(anforderung.gueltigBisMs)
        || anforderung.jetztMs < 0
        || anforderung.gueltigBisMs < anforderung.jetztMs
        || anforderung.gueltigBisMs - anforderung.jetztMs > 2_000
        || anforderung.healthEvidence.length > 512) {
      return blockiere("V5_EQUIP_EINMAL_ZEIT_ODER_EVIDENCE_UNGUELTIG");
    }

    if (this.#equipEinmalAuthority !== null) {
      if (this.#equipEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
        return blockiere("V5_EQUIP_EINMAL_AUTHORITY_BEREITS_OFFEN");
      }
      this.#equipEinmalAuthority.widerrufe();
      this.#equipEinmalAuthority = null;
    }

    if (this.#bankWithdrawEinmalAuthority !== null
        && this.#bankWithdrawEinmalAuthority.gueltigFuer(anforderung.jetztMs)) {
      return blockiere("V5_EQUIP_EINMAL_BANK_WITHDRAW_AUTHORITY_OFFEN");
    }

    const pruefeVorWirkung = (): string | null => {
      if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
        return "V5_EQUIP_EINMAL_RUNTIME_LAEUFT_NICHT";
      }
      if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
        return "V5_EQUIP_EINMAL_LAUFSTEUERUNG_GESPERRT";
      }
      if (this.#bedienerRichtlinie === null) {
        return "V5_EQUIP_EINMAL_BEDIENER_RICHTLINIE_FEHLT";
      }
      if (this.#bedienerRichtlinie.snapshot().nothaltAktiv) {
        return "V5_EQUIP_EINMAL_NOTHALT_AKTIV";
      }
      if (!this.#bedienerRichtlinie.istErlaubt(EQUIPMENT_EQUIP_FAEHIGKEIT_ID)) {
        return "V5_EQUIP_EINMAL_DURCH_POLICY_GESPERRT";
      }

      const faehigkeit = this.#faehigkeiten.sicht().find(x =>
        x.faehigkeitId === EQUIPMENT_EQUIP_FAEHIGKEIT_ID
        && x.anbieterModulId === EQUIPMENT_CORE_MODUL_ID
        && x.anbieterVersion === EQUIPMENT_CORE_MODUL_VERSION);
      if (faehigkeit === undefined
          || faehigkeit.modus !== "MUTIEREN"
          || faehigkeit.status !== "VERFUEGBAR"
          || faehigkeit.standardAktiv !== false
          || faehigkeit.aktiv) {
        return "V5_EQUIP_EINMAL_CAPABILITY_NICHT_BEREIT";
      }

      const modul = this.#module.sicht().find(x =>
        x.modulId === EQUIPMENT_CORE_MODUL_ID
        && x.modulVersion === EQUIPMENT_CORE_MODUL_VERSION);
      if (modul === undefined
          || modul.gesundheit !== "GESUND"
          || modul.aktiv
          || !modul.bereitgestellteFaehigkeiten.includes(
            EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
          )) {
        return "V5_EQUIP_EINMAL_PROVIDER_NICHT_BEREIT";
      }

      try {
        if (!this.#supervisor.status(
          anforderung.healthEvidence,
          anforderung.jetztMs,
        ).bereit) {
          return "V5_EQUIP_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        return "V5_EQUIP_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
      return null;
    };

    const vorAudit = pruefeVorWirkung();
    if (vorAudit !== null) return blockiere(vorAudit);
    if (this.#equipEinmalAuthorityProtokoll === null) {
      return blockiere("V5_EQUIP_EINMAL_DURABLE_PROTOKOLL_FEHLT");
    }

    const evidenceIds = Object.freeze(
      anforderung.healthEvidence
        .map(x => x.evidenceId)
        .filter((id, index, alle) => alle.indexOf(id) === index)
        .sort(),
    );
    if (evidenceIds.length < 1 || evidenceIds.length > 64) {
      return blockiere("V5_EQUIP_EINMAL_EVIDENCE_UNGUELTIG");
    }

    const intent: V5EquipEinmalAuthorityDurableIntent = Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
      anbieterModulId: EQUIPMENT_CORE_MODUL_ID,
      anbieterVersion: EQUIPMENT_CORE_MODUL_VERSION,
      actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
      recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
      verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
      policyId: EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
      evidenceIds,
      zeitMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      art: "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
      maximaleVerwendungen: 1,
      breiteRuntimeFreigabe: false,
      rawWriteAutoritaet: false,
      gameplayWriteNochNichtAusgefuehrt: true,
    });

    let bestaetigung: V5EquipEinmalAuthorityDurableBestaetigung;
    try {
      bestaetigung =
        await this.#equipEinmalAuthorityProtokoll.schreibeDurable(intent);
    } catch {
      return blockiere("V5_EQUIP_EINMAL_AUDIT_NICHT_DURABLE", evidenceIds);
    }
    if (bestaetigung.durable !== true
        || bestaetigung.aktivierungsId !== anforderung.aktivierungsId
        || bestaetigung.transaktionsId !== anforderung.transaktionsId
        || bestaetigung.bestaetigungsId.trim().length === 0
        || bestaetigung.bestaetigungsId.length > 192) {
      return blockiere(
        "V5_EQUIP_EINMAL_DURABILITY_NICHT_BESTAETIGT",
        evidenceIds,
      );
    }

    const nachAudit = pruefeVorWirkung();
    if (nachAudit !== null) {
      return blockiere(
        "V5_EQUIP_EINMAL_REVALIDIERUNG_FEHLGESCHLAGEN:" + nachAudit,
        evidenceIds,
      );
    }

    const faehigkeit = this.#faehigkeiten.sicht().find(x =>
      x.faehigkeitId === EQUIPMENT_EQUIP_FAEHIGKEIT_ID
      && x.anbieterModulId === EQUIPMENT_CORE_MODUL_ID
      && x.anbieterVersion === EQUIPMENT_CORE_MODUL_VERSION);
    if (faehigkeit === undefined) {
      return blockiere("V5_EQUIP_EINMAL_PROVIDER_VERLOREN", evidenceIds);
    }

    const authority = new ProduktiveEquipEinmalAuthority(Object.freeze({
      schemaVersion: 1,
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
      anbieterModulId: EQUIPMENT_CORE_MODUL_ID,
      anbieterVersion: EQUIPMENT_CORE_MODUL_VERSION,
      actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
      recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
      verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
      policyId: EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
      ausgestelltAmMs: anforderung.jetztMs,
      gueltigBisMs: anforderung.gueltigBisMs,
      faehigkeitsGeneration: faehigkeit.generation,
      evidenceIds,
      maximaleVerwendungen: 1,
    }));
    this.#equipEinmalAuthority = authority;

    return Object.freeze({
      schemaVersion: 1,
      erfolgreich: true,
      grund: "V5_EQUIP_EINMAL_AUTHORITY_ERTEILT",
      aktivierungsId: anforderung.aktivierungsId,
      transaktionsId: anforderung.transaktionsId,
      authority,
      evidenceIds,
      maximaleVerwendungen: 1,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public revalidiereEquipEinmalAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): V5EquipEinmalAuthorityRevalidierungsErgebnis {
    const authority = this.#equipEinmalAuthority;
    if (authority === null) {
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_EQUIP_EINMAL_KEINE_AUTHORITY_OFFEN",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }

    if (authority.verbraucht()) {
      this.#equipEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_EQUIP_EINMAL_AUTHORITY_VERBRAUCHT",
        authorityOffen: false,
        authorityWiderrufen: false,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }
    if (!authority.gueltigFuer(jetztMs)) {
      authority.widerrufe();
      this.#equipEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: true,
        grund: "V5_EQUIP_EINMAL_AUTHORITY_ABGELAUFEN",
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }

    let grund: string | null = null;
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      grund = "V5_EQUIP_EINMAL_RUNTIME_LAEUFT_NICHT";
    } else if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
      grund = "V5_EQUIP_EINMAL_LAUFSTEUERUNG_GESPERRT";
    } else if (this.#bedienerRichtlinie === null
        || this.#bedienerRichtlinie.snapshot().nothaltAktiv
        || !this.#bedienerRichtlinie.istErlaubt(EQUIPMENT_EQUIP_FAEHIGKEIT_ID)) {
      grund = "V5_EQUIP_EINMAL_OPERATOR_POLICY_GESPERRT";
    } else {
      try {
        if (!this.#supervisor.status(healthEvidence, jetztMs).bereit) {
          grund = "V5_EQUIP_EINMAL_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        grund = "V5_EQUIP_EINMAL_HEALTH_EVIDENCE_UNGUELTIG";
      }
    }

    if (grund !== null) {
      authority.widerrufe();
      this.#equipEinmalAuthority = null;
      return Object.freeze({
        schemaVersion: 1,
        bereit: false,
        grund,
        authorityOffen: false,
        authorityWiderrufen: true,
        gameplayWriteAusgefuehrt: false,
        rawWriteAutoritaet: false,
        breiteRuntimeFreigabe: false,
      });
    }

    return Object.freeze({
      schemaVersion: 1,
      bereit: true,
      grund: "V5_EQUIP_EINMAL_AUTHORITY_BEREIT",
      authorityOffen: true,
      authorityWiderrufen: false,
      gameplayWriteAusgefuehrt: false,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
  }

  public async fuehreEquipEinmalTransaktion<Ergebnis>(
    anforderung: ProduktiveEquipTransaktionsAnforderung,
    abhaengigkeiten: Omit<
      ProduktiveEquipTransaktionsAbhaengigkeiten<Ergebnis>,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
      | "ausfuehrung"
    >,
  ): Promise<ProduktiveEquipTransaktionsErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_EQUIP_PROD_TX_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_EQUIP_PROD_TX_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#equipEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_EQUIP_PROD_TX_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveEquipTransaktionsOrchestrierung()
      .fuehreEinmalAus(anforderung, Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
        ausfuehrung: this.#ausfuehrung,
      }));
  }

  public async fuehreBankDepositShadowAdmission(
    anforderung: BankDepositShadowAnforderung,
    abhaengigkeiten: Omit<
      BankDepositShadowAbhaengigkeiten,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
    >,
  ): Promise<BankDepositShadowErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_BANK_DEPOSIT_SHADOW_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_BANK_DEPOSIT_SHADOW_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#bankDepositEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_BANK_DEPOSIT_SHADOW_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveBankDepositShadowAdmission().pruefe(
      anforderung,
      Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
      }),
    );
  }

  public async fuehreBankWithdrawShadowAdmission(
    anforderung: BankWithdrawShadowAnforderung,
    abhaengigkeiten: Omit<
      BankWithdrawShadowAbhaengigkeiten,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
    >,
  ): Promise<BankWithdrawShadowErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_BANK_WITHDRAW_SHADOW_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_BANK_WITHDRAW_SHADOW_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#bankWithdrawEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_BANK_WITHDRAW_SHADOW_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveBankWithdrawShadowAdmission().pruefe(
      anforderung,
      Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
      }),
    );
  }

  public async fuehreBankSwapShadowAdmission(
    anforderung: BankSwapShadowAnforderung,
    abhaengigkeiten: Omit<
      BankSwapShadowAbhaengigkeiten,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
    >,
  ): Promise<BankSwapShadowErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_BANK_SWAP_SHADOW_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_BANK_SWAP_SHADOW_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#bankSwapEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_BANK_SWAP_SHADOW_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveBankSwapShadowAdmission().pruefe(
      anforderung,
      Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
      }),
    );
  }

  public async fuehreBankDepositEinGoldTransaktion<Ergebnis>(
    anforderung: ProduktiveBankDepositTransaktionsAnforderung,
    abhaengigkeiten: Omit<
      ProduktiveBankDepositTransaktionsAbhaengigkeiten<Ergebnis>,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
      | "ausfuehrung"
    >,
  ): Promise<ProduktiveBankDepositTransaktionsErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_BANK_DEPOSIT_PROD_TX_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_BANK_DEPOSIT_PROD_TX_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#bankDepositEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_BANK_DEPOSIT_PROD_TX_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveBankDepositTransaktionsOrchestrierung()
      .fuehreEinmalAus(anforderung, Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
        ausfuehrung: this.#ausfuehrung,
      }));
  }

  public async fuehreBankWithdrawEinGoldTransaktion<Ergebnis>(
    anforderung: ProduktiveBankWithdrawTransaktionsAnforderung,
    abhaengigkeiten: Omit<
      ProduktiveBankWithdrawTransaktionsAbhaengigkeiten<Ergebnis>,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
      | "ausfuehrung"
    >,
  ): Promise<ProduktiveBankWithdrawTransaktionsErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_BANK_WITHDRAW_PROD_TX_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_BANK_WITHDRAW_PROD_TX_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#bankWithdrawEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_BANK_WITHDRAW_PROD_TX_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveBankWithdrawTransaktionsOrchestrierung()
      .fuehreEinmalAus(anforderung, Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
        ausfuehrung: this.#ausfuehrung,
      }));
  }

  public async fuehreBankSwapZweiSlotTransaktion<Ergebnis>(
    anforderung: ProduktiveBankSwapTransaktionsAnforderung,
    abhaengigkeiten: Omit<
      ProduktiveBankSwapTransaktionsAbhaengigkeiten<Ergebnis>,
      | "operatorRichtlinie"
      | "ressourcen"
      | "socketBudget"
      | "mutationsKanaele"
      | "ausfuehrung"
    >,
  ): Promise<ProduktiveBankSwapTransaktionsErgebnis> {
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      throw new Error("V5_BANK_SWAP_PROD_TX_RUNTIME_LAEUFT_NICHT");
    }
    if (this.#bedienerRichtlinie === null) {
      throw new Error("V5_BANK_SWAP_PROD_TX_BEDIENER_RICHTLINIE_FEHLT");
    }
    if (this.#bankSwapEinmalAuthority !== anforderung.authority) {
      throw new Error("V5_BANK_SWAP_PROD_TX_AUTHORITY_NICHT_AKTUELL");
    }

    return new ProduktiveBankSwapTransaktionsOrchestrierung()
      .fuehreEinmalAus(anforderung, Object.freeze({
        ...abhaengigkeiten,
        operatorRichtlinie: this.#bedienerRichtlinie,
        ressourcen: this.#ressourcen,
        socketBudget: this.#socketBudget,
        mutationsKanaele: this.#mutationsKanaele,
        ausfuehrung: this.#ausfuehrung,
      }));
  }

  public revalidierePlanenAuthority(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): V5PlanenRevalidierungsErgebnis {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("V5_PLANEN_REVALIDIERUNG_ZEIT_UNGUELTIG");
    }
    if (healthEvidence.length > 512) {
      throw new Error("V5_PLANEN_REVALIDIERUNG_HEALTH_EVIDENCE_ZU_GROSS");
    }

    let globalerGrund: string | null = null;
    if (!this.#prozessLaeuft || this.#zustand !== "LAEUFT") {
      globalerGrund = "V5_PLANEN_REVALIDIERUNG_RUNTIME_LAEUFT_NICHT";
    } else if (!this.#laufsteuerung.sicht().neueArbeitErlaubt) {
      globalerGrund = "V5_PLANEN_REVALIDIERUNG_LAUFSTEUERUNG_GESPERRT";
    } else if (this.#bedienerRichtlinie === null) {
      globalerGrund = "V5_PLANEN_REVALIDIERUNG_BEDIENER_RICHTLINIE_FEHLT";
    } else if (this.#bedienerRichtlinie.snapshot().nothaltAktiv) {
      globalerGrund = "V5_PLANEN_REVALIDIERUNG_NOTHALT_AKTIV";
    } else {
      try {
        if (!this.#supervisor.status(healthEvidence, jetztMs).bereit) {
          globalerGrund = "V5_PLANEN_REVALIDIERUNG_SUPERVISOR_NICHT_BEREIT";
        }
      } catch {
        globalerGrund = "V5_PLANEN_REVALIDIERUNG_HEALTH_EVIDENCE_UNGUELTIG";
      }
    }

    let deaktivierte: readonly string[] = Object.freeze([]);
    if (globalerGrund !== null) {
      deaktivierte = Object.freeze(
        this.#faehigkeiten.sicht()
          .filter(x => x.aktiv)
          .map(x => x.faehigkeitId + "@" + x.anbieterVersion),
      );
      this.#deaktiviereAlleKompositionsAutoritaet();
    } else {
      for (const faehigkeit of this.#faehigkeiten.sicht()) {
        if (!faehigkeit.aktiv) continue;
        const modul = this.#module.sicht().find(x =>
          x.modulId === faehigkeit.anbieterModulId
          && x.modulVersion === faehigkeit.anbieterVersion);
        const erlaubt = faehigkeit.modus === "PLANEN"
          && faehigkeit.status === "VERFUEGBAR"
          && faehigkeit.standardAktiv === false
          && modul !== undefined
          && modul.aktiv
          && modul.gesundheit === "GESUND"
          && modul.bereitgestellteFaehigkeiten.includes(
            faehigkeit.faehigkeitId,
          )
          && this.#bedienerRichtlinie?.istErlaubt(
            faehigkeit.faehigkeitId,
          ) === true;
        if (!erlaubt) {
          this.#faehigkeiten.deaktiviere(
            faehigkeit.faehigkeitId,
            faehigkeit.anbieterModulId,
            faehigkeit.anbieterVersion,
          );
          deaktivierte = Object.freeze([
            ...deaktivierte,
            faehigkeit.faehigkeitId + "@" + faehigkeit.anbieterVersion,
          ]);
        }
      }

      for (const modul of this.#module.sicht()) {
        if (!modul.aktiv) continue;
        const hatAktiveFaehigkeit = this.#faehigkeiten.sicht().some(x =>
          x.aktiv
          && x.anbieterModulId === modul.modulId
          && x.anbieterVersion === modul.modulVersion);
        if (!hatAktiveFaehigkeit) {
          this.#module.deaktiviere(modul.modulId, modul.modulVersion);
        }
      }
    }

    const aktivePlanenFaehigkeiten = Object.freeze(
      this.#faehigkeiten.sicht()
        .filter(x => x.aktiv && x.modus === "PLANEN")
        .map(x => x.faehigkeitId + "@" + x.anbieterVersion),
    );
    const bereit = globalerGrund === null && deaktivierte.length === 0;

    return Object.freeze({
      schemaVersion: 1,
      bereit,
      grund: globalerGrund
        ?? (bereit
          ? "V5_PLANEN_REVALIDIERUNG_BEREIT"
          : "V5_PLANEN_REVALIDIERUNG_CAPABILITY_ENTZOGEN"),
      deaktivierteFaehigkeiten: Object.freeze([...deaktivierte]),
      aktivePlanenFaehigkeiten,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
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
      offeneEquipEinmalAuthority: this.#equipEinmalAuthority !== null
        && !this.#equipEinmalAuthority.verbraucht(),
      offeneBankDepositEinmalAuthority:
        this.#bankDepositEinmalAuthority !== null
        && !this.#bankDepositEinmalAuthority.verbraucht(),
      offeneBankWithdrawEinmalAuthority:
        this.#bankWithdrawEinmalAuthority !== null
        && !this.#bankWithdrawEinmalAuthority.verbraucht(),
      offeneBankSwapEinmalAuthority:
        this.#bankSwapEinmalAuthority !== null
        && !this.#bankSwapEinmalAuthority.verbraucht(),
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

  public bankLeaseKoordinator(): BankLeaseKoordinator {
    return this.#bankLeaseKoordinator;
  }

  public operationsSupervisor(): HeadlessOperationsSupervisor {
    return this.#supervisor;
  }

  public erfasseOperationsMetrik(metrik: OperationsMetrik): boolean {
    return this.#telemetrie.erfasse(metrik);
  }

  #deaktiviereAlleKompositionsAutoritaet(): void {
    if (this.#equipEinmalAuthority !== null) {
      this.#equipEinmalAuthority.widerrufe();
      this.#equipEinmalAuthority = null;
    }
    if (this.#bankDepositEinmalAuthority !== null) {
      this.#bankDepositEinmalAuthority.widerrufe();
      this.#bankDepositEinmalAuthority = null;
    }
    if (this.#bankWithdrawEinmalAuthority !== null) {
      this.#bankWithdrawEinmalAuthority.widerrufe();
      this.#bankWithdrawEinmalAuthority = null;
    }
    if (this.#bankSwapEinmalAuthority !== null) {
      this.#bankSwapEinmalAuthority.widerrufe();
      this.#bankSwapEinmalAuthority = null;
    }
    for (const faehigkeit of this.#faehigkeiten.sicht()) {
      if (faehigkeit.aktiv) {
        this.#faehigkeiten.deaktiviere(
          faehigkeit.faehigkeitId,
          faehigkeit.anbieterModulId,
          faehigkeit.anbieterVersion,
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
