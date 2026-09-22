import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";
import {
  BANK_STORE_ACTION_CONTRACT_ID,
  BANK_STORE_RECOVERY_CONTRACT_ID,
  BANK_STORE_VERIFIER_ID,
  type ProduktiveBankStoreEinmalAuthority,
} from "./bank-store-einmal-authority.js";

export interface ProduktiverBankStoreHostSchnappschuss {
  readonly zustand: string;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly bankStoreEinmalAuthorityOffen: boolean;
}

export class ProduktivesBankStoreEinmalAdmissionGate
implements LaufzeitGatePort {
  readonly #basis: LaufzeitGatePort;
  readonly #hostStatus: () => ProduktiverBankStoreHostSchnappschuss;
  readonly #authority: ProduktiveBankStoreEinmalAuthority;

  public constructor(
    basis: LaufzeitGatePort,
    hostStatus: () => ProduktiverBankStoreHostSchnappschuss,
    authority: ProduktiveBankStoreEinmalAuthority,
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
      && host.bankStoreEinmalAuthorityOffen
      && kontext.transaktionsId === daten.transaktionsId
      && kontext.faehigkeitId === MERCHANT_BANK_STORE_FAEHIGKEIT_ID
      && kontext.eigentuemerModulId === MERCHANT_BANK_CORE_MODUL_ID
      && kontext.actionContractId === BANK_STORE_ACTION_CONTRACT_ID
      && kontext.recoveryContractId === BANK_STORE_RECOVERY_CONTRACT_ID
      && kontext.verifierId === BANK_STORE_VERIFIER_ID;

    return Object.freeze({
      freigegeben: passt,
      generation: basis.generation,
      nachweisId: passt
        ? basis.nachweisId + ":BANK_STORE_EINMAL:" + daten.aktivierungsId
        : basis.nachweisId + ":BANK_STORE_EINMAL_BLOCKIERT",
    });
  }
}
