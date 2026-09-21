import type { ModulDefinition } from "../autoritaet/modul-register.js";

export const MERCHANT_BANK_CORE_MODUL_ID = "merchant-bank-core";
export const MERCHANT_BANK_CORE_MODUL_VERSION = "1";
export const MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID =
  "merchant.bank.gold_einlagern";
export const MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID =
  "merchant.bank.gold_auslagern";

export function merchantBankCoreModulDefinition(): ModulDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulId: MERCHANT_BANK_CORE_MODUL_ID,
    modulVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    bereitgestellteFaehigkeiten: Object.freeze([
      MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
    ]),
    benoetigteFaehigkeiten: Object.freeze([]),
    bereitgestelltePorts: Object.freeze([]),
    benoetigtePorts: Object.freeze([]),
    standardAktiv: false,
  });
}
