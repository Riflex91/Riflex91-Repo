import type { HealthEvidence } from "../operations/health.js";
import type {
  FaehigkeitsAutoritaetsNachweis,
  FaehigkeitsAutoritaetsPort,
} from "../ausfuehrung/ports.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";

export const BANK_SWAP_ACTION_CONTRACT_ID = "AL-ACTION-BANK-SWAP";
export const BANK_SWAP_RECOVERY_CONTRACT_ID = "AL-RECOVERY-BANK-SWAP";
export const BANK_SWAP_VERIFIER_ID = "AL-VERIFIER-BANK-SWAP";
export const BANK_SWAP_EINMAL_POLICY_ID = "BANK-SWAP-PRODUKTION-EINMAL-V1";
export const BANK_SWAP_EINMAL_BESTAETIGUNG =
  "V5 BANK SWAP EINMAL AUSFUEHREN";

export interface V5BankSwapEinmalAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_BANK_SWAP_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof MERCHANT_BANK_CORE_MODUL_ID;
  readonly anbieterVersion: typeof MERCHANT_BANK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof BANK_SWAP_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof BANK_SWAP_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof BANK_SWAP_VERIFIER_ID;
  readonly policyId: typeof BANK_SWAP_EINMAL_POLICY_ID;
  readonly bestaetigungText: typeof BANK_SWAP_EINMAL_BESTAETIGUNG;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration?: number;
}

export interface V5BankSwapEinmalAuthorityRevalidierungsErgebnis {
  readonly schemaVersion: 1;
  readonly bereit: boolean;
  readonly grund: string;
  readonly authorityOffen: boolean;
  readonly authorityWiderrufen: boolean;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface V5BankSwapEinmalAuthorityDurableIntent {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_BANK_SWAP_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof MERCHANT_BANK_CORE_MODUL_ID;
  readonly anbieterVersion: typeof MERCHANT_BANK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof BANK_SWAP_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof BANK_SWAP_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof BANK_SWAP_VERIFIER_ID;
  readonly policyId: typeof BANK_SWAP_EINMAL_POLICY_ID;
  readonly evidenceIds: readonly string[];
  readonly zeitMs: number;
  readonly gueltigBisMs: number;
  readonly art: "BANK_SWAP_EINMAL_AUTHORITY_VOR_WIRKUNG";
  readonly maximaleVerwendungen: 1;
  readonly breiteRuntimeFreigabe: false;
  readonly rawWriteAutoritaet: false;
  readonly gameplayWriteNochNichtAusgefuehrt: true;
}

export interface V5BankSwapEinmalAuthorityDurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
}

export interface V5BankSwapEinmalAuthorityProtokollPort {
  schreibeDurable(
    intent: V5BankSwapEinmalAuthorityDurableIntent,
  ): Promise<V5BankSwapEinmalAuthorityDurableBestaetigung>;
}

export interface V5BankSwapEinmalAuthorityDaten {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_BANK_SWAP_FAEHIGKEIT_ID;
  readonly anbieterModulId: typeof MERCHANT_BANK_CORE_MODUL_ID;
  readonly anbieterVersion: typeof MERCHANT_BANK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof BANK_SWAP_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof BANK_SWAP_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof BANK_SWAP_VERIFIER_ID;
  readonly policyId: typeof BANK_SWAP_EINMAL_POLICY_ID;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration: number;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
}

export class ProduktiveBankSwapEinmalAuthority
implements FaehigkeitsAutoritaetsPort {
  readonly #daten: V5BankSwapEinmalAuthorityDaten;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(daten: V5BankSwapEinmalAuthorityDaten) {
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

  public daten(): V5BankSwapEinmalAuthorityDaten {
    return this.#daten;
  }
}

export interface V5BankSwapEinmalAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly authority: ProduktiveBankSwapEinmalAuthority | null;
  readonly evidenceIds: readonly string[];
  readonly maximaleVerwendungen: 1;
  readonly gameplayWriteAusgefuehrt: false;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

function text(wert: string): boolean {
  return wert.trim().length > 0 && wert.length <= 192;
}

function evidenceIds(
  evidence: readonly HealthEvidence[],
  jetztMs: number,
): readonly string[] | null {
  if (!Array.isArray(evidence) || evidence.length < 1 || evidence.length > 64) return null;
  const ids: string[] = [];
  for (const e of evidence) {
    if (!e || e.zustand !== "GESUND"
        || !text(e.evidenceId)
        || !Number.isSafeInteger(e.beobachtetAmMs)
        || !Number.isSafeInteger(e.gueltigBisMs)
        || e.beobachtetAmMs > jetztMs
        || e.gueltigBisMs < jetztMs
        || ids.includes(e.evidenceId)) return null;
    ids.push(e.evidenceId);
  }
  return Object.freeze(ids.sort());
}

export async function erteileProduktiveBankSwapEinmalAuthority(
  anforderung: V5BankSwapEinmalAuthorityAnforderung,
  protokoll: V5BankSwapEinmalAuthorityProtokollPort | null,
): Promise<V5BankSwapEinmalAuthorityErgebnis> {
  const blockiert = (
    grund: string,
    ids: readonly string[] = Object.freeze([]),
  ): V5BankSwapEinmalAuthorityErgebnis => Object.freeze({
    schemaVersion: 1,
    erfolgreich: false,
    grund,
    authority: null,
    evidenceIds: ids,
    maximaleVerwendungen: 1,
    gameplayWriteAusgefuehrt: false,
    rawWriteAutoritaet: false,
    breiteRuntimeFreigabe: false,
  });

  if (!anforderung || anforderung.schemaVersion !== 1
      || !text(anforderung.aktivierungsId)
      || !text(anforderung.transaktionsId)
      || anforderung.faehigkeitId !== MERCHANT_BANK_SWAP_FAEHIGKEIT_ID
      || anforderung.anbieterModulId !== MERCHANT_BANK_CORE_MODUL_ID
      || anforderung.anbieterVersion !== MERCHANT_BANK_CORE_MODUL_VERSION
      || anforderung.actionContractId !== BANK_SWAP_ACTION_CONTRACT_ID
      || anforderung.recoveryContractId !== BANK_SWAP_RECOVERY_CONTRACT_ID
      || anforderung.verifierId !== BANK_SWAP_VERIFIER_ID
      || anforderung.policyId !== BANK_SWAP_EINMAL_POLICY_ID
      || anforderung.bestaetigungText !== BANK_SWAP_EINMAL_BESTAETIGUNG) {
    return blockiert("V5_BANK_SWAP_EINMAL_BINDUNG_UNGUELTIG");
  }
  if (!Number.isSafeInteger(anforderung.jetztMs)
      || !Number.isSafeInteger(anforderung.gueltigBisMs)
      || anforderung.jetztMs < 0
      || anforderung.gueltigBisMs < anforderung.jetztMs
      || anforderung.gueltigBisMs - anforderung.jetztMs > 2_000
      || !Number.isSafeInteger(anforderung.faehigkeitsGeneration)
      || Number(anforderung.faehigkeitsGeneration) < 1) {
    return blockiert("V5_BANK_SWAP_EINMAL_ZEIT_ODER_GENERATION_UNGUELTIG");
  }
  const ids = evidenceIds(anforderung.healthEvidence, anforderung.jetztMs);
  if (ids === null) return blockiert("V5_BANK_SWAP_EINMAL_HEALTH_EVIDENCE_UNGUELTIG");
  if (protokoll === null) {
    return blockiert("V5_BANK_SWAP_EINMAL_DURABLE_PROTOKOLL_FEHLT", ids);
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
    evidenceIds: ids,
    zeitMs: anforderung.jetztMs,
    gueltigBisMs: anforderung.gueltigBisMs,
    art: "BANK_SWAP_EINMAL_AUTHORITY_VOR_WIRKUNG",
    maximaleVerwendungen: 1,
    breiteRuntimeFreigabe: false,
    rawWriteAutoritaet: false,
    gameplayWriteNochNichtAusgefuehrt: true,
  });

  let ack: V5BankSwapEinmalAuthorityDurableBestaetigung;
  try {
    ack = await protokoll.schreibeDurable(intent);
  } catch {
    return blockiert("V5_BANK_SWAP_EINMAL_AUDIT_NICHT_DURABLE", ids);
  }
  if (ack.durable !== true
      || ack.aktivierungsId !== anforderung.aktivierungsId
      || ack.transaktionsId !== anforderung.transaktionsId
      || !text(ack.bestaetigungsId)) {
    return blockiert("V5_BANK_SWAP_EINMAL_DURABILITY_NICHT_BESTAETIGT", ids);
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
    faehigkeitsGeneration: Number(anforderung.faehigkeitsGeneration),
    evidenceIds: ids,
    maximaleVerwendungen: 1,
  }));

  return Object.freeze({
    schemaVersion: 1,
    erfolgreich: true,
    grund: "V5_BANK_SWAP_EINMAL_AUTHORITY_ERTEILT",
    authority,
    evidenceIds: ids,
    maximaleVerwendungen: 1,
    gameplayWriteAusgefuehrt: false,
    rawWriteAutoritaet: false,
    breiteRuntimeFreigabe: false,
  });
}
