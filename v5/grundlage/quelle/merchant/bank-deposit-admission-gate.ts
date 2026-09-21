import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";
import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  type ProduktiveBankDepositEinmalAuthority,
} from "./bank-deposit-einmal-authority.js";

export interface ProduktiverBankDepositHostSchnappschuss {
  readonly zustand: string;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly bankDepositEinmalAuthorityOffen: boolean;
}

export class ProduktivesBankDepositEinmalAdmissionGate
implements LaufzeitGatePort {
  readonly #basis: LaufzeitGatePort;
  readonly #hostStatus: () => ProduktiverBankDepositHostSchnappschuss;
  readonly #authority: ProduktiveBankDepositEinmalAuthority;

  public constructor(
    basis: LaufzeitGatePort,
    hostStatus: () => ProduktiverBankDepositHostSchnappschuss,
    authority: ProduktiveBankDepositEinmalAuthority,
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
      && host.bankDepositEinmalAuthorityOffen
      && kontext.transaktionsId === daten.transaktionsId
      && kontext.faehigkeitId === MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID
      && kontext.eigentuemerModulId === MERCHANT_BANK_CORE_MODUL_ID
      && kontext.actionContractId === BANK_DEPOSIT_ACTION_CONTRACT_ID
      && kontext.recoveryContractId === BANK_DEPOSIT_RECOVERY_CONTRACT_ID
      && kontext.verifierId === BANK_DEPOSIT_VERIFIER_ID;

    return Object.freeze({
      freigegeben: passt,
      generation: basis.generation,
      nachweisId: passt
        ? basis.nachweisId + ":BANK_DEPOSIT_EINMAL:" + daten.aktivierungsId
        : basis.nachweisId + ":BANK_DEPOSIT_EINMAL_BLOCKIERT",
    });
  }
}
