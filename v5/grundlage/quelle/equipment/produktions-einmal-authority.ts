import type { HealthEvidence } from "../operations/health.js";
import type {
  FaehigkeitsAutoritaetsNachweis,
  FaehigkeitsAutoritaetsPort,
} from "../ausfuehrung/ports.js";
import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
} from "./modul-vertrag.js";

export const EQUIPMENT_EQUIP_ACTION_CONTRACT_ID = "AL-ACTION-EQUIP";
export const EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID = "AL-RECOVERY-EQUIP";
export const EQUIPMENT_EQUIP_VERIFIER_ID = "AL-VERIFIER-EQUIP";
export const EQUIPMENT_EQUIP_EINMAL_POLICY_ID =
  "EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1";
export const EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG =
  "V5 EQUIP EINMAL AUSFUEHREN";

export interface V5EquipEinmalAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof EQUIPMENT_EQUIP_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof EQUIPMENT_CORE_MODUL_ID;
  readonly anbieterVersion: typeof EQUIPMENT_CORE_MODUL_VERSION;
  readonly actionContractId: typeof EQUIPMENT_EQUIP_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof EQUIPMENT_EQUIP_VERIFIER_ID;
  readonly policyId: typeof EQUIPMENT_EQUIP_EINMAL_POLICY_ID;
  readonly bestaetigungText: typeof EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
}

export interface V5EquipEinmalAuthorityDurableIntent {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof EQUIPMENT_EQUIP_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof EQUIPMENT_CORE_MODUL_ID;
  readonly anbieterVersion: typeof EQUIPMENT_CORE_MODUL_VERSION;
  readonly actionContractId: typeof EQUIPMENT_EQUIP_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof EQUIPMENT_EQUIP_VERIFIER_ID;
  readonly policyId: typeof EQUIPMENT_EQUIP_EINMAL_POLICY_ID;
  readonly evidenceIds: readonly string[];
  readonly zeitMs: number;
  readonly gueltigBisMs: number;
  readonly art: "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG";
  readonly maximaleVerwendungen: 1;
  readonly breiteRuntimeFreigabe: false;
  readonly rawWriteAutoritaet: false;
  readonly gameplayWriteNochNichtAusgefuehrt: true;
}

export interface V5EquipEinmalAuthorityDurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
}

export interface V5EquipEinmalAuthorityProtokollPort {
  schreibeDurable(
    intent: V5EquipEinmalAuthorityDurableIntent,
  ): Promise<V5EquipEinmalAuthorityDurableBestaetigung>;
}

export interface V5EquipEinmalAuthorityDaten {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof EQUIPMENT_EQUIP_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof EQUIPMENT_CORE_MODUL_ID;
  readonly anbieterVersion: typeof EQUIPMENT_CORE_MODUL_VERSION;
  readonly actionContractId: typeof EQUIPMENT_EQUIP_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof EQUIPMENT_EQUIP_VERIFIER_ID;
  readonly policyId: typeof EQUIPMENT_EQUIP_EINMAL_POLICY_ID;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration: number;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
}

export class ProduktiveEquipEinmalAuthority
implements FaehigkeitsAutoritaetsPort {
  readonly #daten: V5EquipEinmalAuthorityDaten;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(daten: V5EquipEinmalAuthorityDaten) {
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

  public daten(): V5EquipEinmalAuthorityDaten {
    return this.#daten;
  }
}

export interface V5EquipEinmalAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly authority: ProduktiveEquipEinmalAuthority | null;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}
