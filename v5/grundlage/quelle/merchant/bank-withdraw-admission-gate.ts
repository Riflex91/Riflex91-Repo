import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";
import {
  BANK_WITHDRAW_ACTION_CONTRACT_ID,
  BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
  BANK_WITHDRAW_VERIFIER_ID,
  type ProduktiveBankWithdrawEinmalAuthority,
} from "./bank-withdraw-einmal-authority.js";

export interface ProduktiverBankWithdrawHostSchnappschuss {
  readonly zustand: string;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly bankWithdrawEinmalAuthorityOffen: boolean;
}

export class ProduktivesBankWithdrawEinmalAdmissionGate
implements LaufzeitGatePort {
  readonly #basis: LaufzeitGatePort;
  readonly #hostStatus: () => ProduktiverBankWithdrawHostSchnappschuss;
  readonly #authority: ProduktiveBankWithdrawEinmalAuthority;

  public constructor(
    basis: LaufzeitGatePort,
    hostStatus: () => ProduktiverBankWithdrawHostSchnappschuss,
    authority: ProduktiveBankWithdrawEinmalAuthority,
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
      && host.bankWithdrawEinmalAuthorityOffen
      && kontext.transaktionsId === daten.transaktionsId
      && kontext.faehigkeitId === MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID
      && kontext.eigentuemerModulId === MERCHANT_BANK_CORE_MODUL_ID
      && kontext.actionContractId === BANK_WITHDRAW_ACTION_CONTRACT_ID
      && kontext.recoveryContractId === BANK_WITHDRAW_RECOVERY_CONTRACT_ID
      && kontext.verifierId === BANK_WITHDRAW_VERIFIER_ID;

    return Object.freeze({
      freigegeben: passt,
      generation: basis.generation,
      nachweisId: passt
        ? basis.nachweisId + ":BANK_WITHDRAW_EINMAL:" + daten.aktivierungsId
        : basis.nachweisId + ":BANK_WITHDRAW_EINMAL_BLOCKIERT",
    });
  }
}
