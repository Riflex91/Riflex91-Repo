import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import type { ProduktiveEquipEinmalAuthority } from "./produktions-einmal-authority.js";
import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
} from "./modul-vertrag.js";
import {
  EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
  EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
  EQUIPMENT_EQUIP_VERIFIER_ID,
} from "./produktions-einmal-authority.js";

export interface ProduktiverEquipHostSchnappschuss {
  readonly zustand: string;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly equipEinmalAuthorityOffen: boolean;
}

export class ProduktivesEquipEinmalAdmissionGate
implements LaufzeitGatePort {
  readonly #basis: LaufzeitGatePort;
  readonly #hostStatus: () => ProduktiverEquipHostSchnappschuss;
  readonly #authority: ProduktiveEquipEinmalAuthority;

  public constructor(
    basis: LaufzeitGatePort,
    hostStatus: () => ProduktiverEquipHostSchnappschuss,
    authority: ProduktiveEquipEinmalAuthority,
  ) {
    this.#basis = basis;
    this.#hostStatus = hostStatus;
    this.#authority = authority;
  }

  public pruefe(kontext?: LaufzeitGateKontext): LaufzeitGateNachweis {
    const basis = this.#basis.pruefe(kontext);
    if (!basis.freigegeben || kontext === undefined) return basis;

    const daten = this.#authority.daten();
    const host = this.#hostStatus();
    const passt = host.zustand === "LAEUFT"
      && host.aktivePlanenFaehigkeiten.length === 0
      && host.equipEinmalAuthorityOffen
      && kontext.transaktionsId === daten.transaktionsId
      && kontext.faehigkeitId === EQUIPMENT_EQUIP_FAEHIGKEIT_ID
      && kontext.eigentuemerModulId === EQUIPMENT_CORE_MODUL_ID
      && kontext.actionContractId === EQUIPMENT_EQUIP_ACTION_CONTRACT_ID
      && kontext.recoveryContractId === EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID
      && kontext.verifierId === EQUIPMENT_EQUIP_VERIFIER_ID;

    return Object.freeze({
      freigegeben: passt,
      generation: basis.generation,
      nachweisId: passt
        ? basis.nachweisId + ":EQUIP_EINMAL:" + daten.aktivierungsId
        : basis.nachweisId + ":EQUIP_EINMAL_BLOCKIERT",
    });
  }
}
