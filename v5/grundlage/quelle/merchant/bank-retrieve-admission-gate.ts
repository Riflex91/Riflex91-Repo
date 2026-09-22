import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";
import {
  BANK_RETRIEVE_ACTION_CONTRACT_ID,
  BANK_RETRIEVE_RECOVERY_CONTRACT_ID,
  BANK_RETRIEVE_VERIFIER_ID,
  type ProduktiveBankRetrieveEinmalAuthority,
} from "./bank-retrieve-einmal-authority.js";

export interface ProduktiverBankRetrieveHostSchnappschuss {
  readonly zustand: string;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly bankRetrieveEinmalAuthorityOffen: boolean;
}

export class ProduktivesBankRetrieveEinmalAdmissionGate
implements LaufzeitGatePort {
  readonly #basis: LaufzeitGatePort;
  readonly #hostStatus: () => ProduktiverBankRetrieveHostSchnappschuss;
  readonly #authority: ProduktiveBankRetrieveEinmalAuthority;

  public constructor(
    basis: LaufzeitGatePort,
    hostStatus: () => ProduktiverBankRetrieveHostSchnappschuss,
    authority: ProduktiveBankRetrieveEinmalAuthority,
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
      && host.bankRetrieveEinmalAuthorityOffen
      && kontext.transaktionsId === daten.transaktionsId
      && kontext.faehigkeitId === MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID
      && kontext.eigentuemerModulId === MERCHANT_BANK_CORE_MODUL_ID
      && kontext.actionContractId === BANK_RETRIEVE_ACTION_CONTRACT_ID
      && kontext.recoveryContractId === BANK_RETRIEVE_RECOVERY_CONTRACT_ID
      && kontext.verifierId === BANK_RETRIEVE_VERIFIER_ID;

    return Object.freeze({
      freigegeben: passt,
      generation: basis.generation,
      nachweisId: passt
        ? basis.nachweisId + ":BANK_RETRIEVE_EINMAL:" + daten.aktivierungsId
        : basis.nachweisId + ":BANK_RETRIEVE_EINMAL_BLOCKIERT",
    });
  }
}
