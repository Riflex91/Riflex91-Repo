import type {
  FaehigkeitsAnbieterDefinition,
} from "../autoritaet/faehigkeits-register.js";
import {
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
} from "./bank-produktions-modul-vertrag.js";

export function merchantBankDepositMutationsFaehigkeitDefinition():
FaehigkeitsAnbieterDefinition {
  return Object.freeze({
    schemaVersion: 1,
    faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    modus: "MUTIEREN",
    status: "VERFUEGBAR",
    standardAktiv: false,
  });
}
