import type { HealthEvidence } from "../operations/health.js";
import type {
  FaehigkeitsAutoritaetsNachweis,
  FaehigkeitsAutoritaetsPort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";

export const BANK_STORE_ACTION_CONTRACT_ID = "AL-ACTION-BANK-STORE";
export const BANK_STORE_RECOVERY_CONTRACT_ID = "AL-RECOVERY-BANK-STORE";
export const BANK_STORE_VERIFIER_ID = "AL-VERIFIER-BANK-STORE";
export const BANK_STORE_EINMAL_POLICY_ID =
  "BANK-STORE-PRODUKTION-EINMAL-V1";
export const BANK_STORE_EINMAL_BESTAETIGUNG =
  "V5 BANK STORE 1 ITEM EINMAL AUSFUEHREN";

export interface V5BankStoreEinmalAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_BANK_STORE_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof MERCHANT_BANK_CORE_MODUL_ID;
  readonly anbieterVersion: typeof MERCHANT_BANK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof BANK_STORE_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof BANK_STORE_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof BANK_STORE_VERIFIER_ID;
  readonly policyId: typeof BANK_STORE_EINMAL_POLICY_ID;
  readonly bestaetigungText: typeof BANK_STORE_EINMAL_BESTAETIGUNG;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
}

export interface V5BankStoreEinmalAuthorityDurableIntent {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_BANK_STORE_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof MERCHANT_BANK_CORE_MODUL_ID;
  readonly anbieterVersion: typeof MERCHANT_BANK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof BANK_STORE_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof BANK_STORE_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof BANK_STORE_VERIFIER_ID;
  readonly policyId: typeof BANK_STORE_EINMAL_POLICY_ID;
  readonly evidenceIds: readonly string[];
  readonly zeitMs: number;
  readonly gueltigBisMs: number;
  readonly art: "BANK_STORE_EINMAL_AUTHORITY_VOR_WIRKUNG";
  readonly maximaleVerwendungen: 1;
  readonly breiteRuntimeFreigabe: false;
  readonly rawWriteAutoritaet: false;
  readonly gameplayWriteNochNichtAusgefuehrt: true;
}

export interface V5BankStoreEinmalAuthorityDurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
}

export interface V5BankStoreEinmalAuthorityProtokollPort {
  schreibeDurable(
    intent: V5BankStoreEinmalAuthorityDurableIntent,
  ): Promise<V5BankStoreEinmalAuthorityDurableBestaetigung>;
}

export interface V5BankStoreEinmalAuthorityDaten {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_BANK_STORE_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof MERCHANT_BANK_CORE_MODUL_ID;
  readonly anbieterVersion: typeof MERCHANT_BANK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof BANK_STORE_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof BANK_STORE_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof BANK_STORE_VERIFIER_ID;
  readonly policyId: typeof BANK_STORE_EINMAL_POLICY_ID;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration: number;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
}

export class ProduktiveBankStoreEinmalAuthority
implements FaehigkeitsAutoritaetsPort {
  readonly #daten: V5BankStoreEinmalAuthorityDaten;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(daten: V5BankStoreEinmalAuthorityDaten) {
    this.#daten = Object.freeze({
      ...daten,
      evidenceIds: Object.freeze([...daten.evidenceIds]),
    });
  }

  public pruefe(
    faehigkeitId: string,
    eigentuemerModulId: string,
  ): FaehigkeitsAutoritaetsNachweis {
    const passt = !this.#verbraucht
      && !this.#widerrufen
      && faehigkeitId === this.#daten.faehigkeitId
      && eigentuemerModulId === this.#daten.anbieterModulId;
    if (!passt) {
      return Object.freeze({
        erlaubt: false,
        mutierend: true,
        generation: this.#daten.faehigkeitsGeneration,
      });
    }
    this.#verbraucht = true;
    return Object.freeze({
      erlaubt: true,
      mutierend: true,
      generation: this.#daten.faehigkeitsGeneration,
    });
  }

  public gueltigFuer(jetztMs: number): boolean {
    return Number.isSafeInteger(jetztMs)
      && jetztMs >= this.#daten.ausgestelltAmMs
      && jetztMs <= this.#daten.gueltigBisMs
      && !this.#verbraucht
      && !this.#widerrufen;
  }

  public verbraucht(): boolean {
    return this.#verbraucht;
  }

  public widerrufe(): void {
    this.#widerrufen = true;
  }

  public daten(): V5BankStoreEinmalAuthorityDaten {
    return this.#daten;
  }
}

export interface V5BankStoreEinmalAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly authority: ProduktiveBankStoreEinmalAuthority | null;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface V5BankStoreEinmalAuthorityRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly authorityOffen: boolean;
  readonly authorityWiderrufen: boolean;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}
