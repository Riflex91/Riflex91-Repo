import type {
  FaehigkeitsAnbieterDefinition,
} from "../autoritaet/faehigkeits-register.js";
import {
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
  MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS,
  type MerchantCoreAPlanungsFaehigkeitId,
} from "./modul-vertrag.js";

export const MERCHANT_CORE_A_FAEHIGKEITS_VERTRAG_VERSION = "1";

export function merchantCoreAPlanungsFaehigkeitDefinition(
  faehigkeitId: MerchantCoreAPlanungsFaehigkeitId,
): FaehigkeitsAnbieterDefinition {
  return Object.freeze({
    schemaVersion: 1,
    faehigkeitId,
    anbieterModulId: MERCHANT_CORE_A_MODUL_ID,
    anbieterVersion: MERCHANT_CORE_A_MODUL_VERSION,
    modus: "PLANEN",
    status: "VERFUEGBAR",
    standardAktiv: false,
  });
}

export function merchantCoreAPlanungsFaehigkeitDefinitionen():
readonly FaehigkeitsAnbieterDefinition[] {
  return Object.freeze(
    MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS.map(
      merchantCoreAPlanungsFaehigkeitDefinition,
    ),
  );
}
