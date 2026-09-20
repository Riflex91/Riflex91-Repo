import type { ModulDefinition } from "../autoritaet/modul-register.js";

export const MERCHANT_CORE_A_MODUL_ID = "merchant-core-a";
export const MERCHANT_CORE_A_MODUL_VERSION = "1";

export const MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS = Object.freeze([
  "merchant.task.planen",
  "merchant.bank.planen",
  "merchant.verkauf.planen",
  "merchant.markt.planen",
  "merchant.mluck.planen",
  "merchant.logistik.planen",
  "merchant.gear.planen",
  "merchant.itemmutation.planen",
] as const);

export type MerchantCoreAPlanungsFaehigkeitId =
  typeof MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS[number];

export function merchantCoreABasisModulDefinition(): ModulDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulId: MERCHANT_CORE_A_MODUL_ID,
    modulVersion: MERCHANT_CORE_A_MODUL_VERSION,
    bereitgestellteFaehigkeiten: Object.freeze([
      ...MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS,
    ]),
    benoetigteFaehigkeiten: Object.freeze([]),
    bereitgestelltePorts: Object.freeze([]),
    benoetigtePorts: Object.freeze([]),
    standardAktiv: false,
  });
}
