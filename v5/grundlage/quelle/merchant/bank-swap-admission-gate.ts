import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";
import {
  BANK_SWAP_ACTION_CONTRACT_ID,
  BANK_SWAP_RECOVERY_CONTRACT_ID,
  BANK_SWAP_VERIFIER_ID,
  type ProduktiveBankSwapEinmalAuthority,
} from "./bank-swap-einmal-authority.js";

export interface ProduktiverBankSwapHostSchnappschuss {
  readonly zustand: string;
  readonly aktivePlanenFaehigkeiten: readonly string[];
  readonly bankSwapEinmalAuthorityOffen: boolean;
}

export class ProduktivesBankSwapEinmalAdmissionGate
implements LaufzeitGatePort {
  readonly #basis: LaufzeitGatePort;
  readonly #hostStatus: () => ProduktiverBankSwapHostSchnappschuss;
  readonly #authority: ProduktiveBankSwapEinmalAuthority;

  public constructor(
    basis: LaufzeitGatePort,
    hostStatus: () => ProduktiverBankSwapHostSchnappschuss,
    authority: ProduktiveBankSwapEinmalAuthority,
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
      && host.bankSwapEinmalAuthorityOffen
      && kontext.transaktionsId === daten.transaktionsId
      && kontext.faehigkeitId === MERCHANT_BANK_SWAP_FAEHIGKEIT_ID
      && kontext.eigentuemerModulId === MERCHANT_BANK_CORE_MODUL_ID
      && kontext.actionContractId === BANK_SWAP_ACTION_CONTRACT_ID
      && kontext.recoveryContractId === BANK_SWAP_RECOVERY_CONTRACT_ID
      && kontext.verifierId === BANK_SWAP_VERIFIER_ID;

    return Object.freeze({
      freigegeben: passt,
      generation: basis.generation,
      nachweisId: passt
        ? basis.nachweisId + ":BANK_SWAP_EINMAL:" + daten.aktivierungsId
        : basis.nachweisId + ":BANK_SWAP_EINMAL_BLOCKIERT",
    });
  }
}
