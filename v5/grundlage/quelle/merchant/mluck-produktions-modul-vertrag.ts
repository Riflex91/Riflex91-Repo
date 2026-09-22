import type { ModulDefinition } from "../autoritaet/modul-register.js";

export const MERCHANT_MLUCK_CORE_MODUL_ID = "merchant-mluck-core";
export const MERCHANT_MLUCK_CORE_MODUL_VERSION = "1";
export const MERCHANT_MLUCK_FAEHIGKEIT_ID = "merchant.mluck.same_account";

export function merchantMluckCoreModulDefinition(): ModulDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulId: MERCHANT_MLUCK_CORE_MODUL_ID,
    modulVersion: MERCHANT_MLUCK_CORE_MODUL_VERSION,
    bereitgestellteFaehigkeiten: Object.freeze([
      MERCHANT_MLUCK_FAEHIGKEIT_ID,
    ]),
    benoetigteFaehigkeiten: Object.freeze([]),
    bereitgestelltePorts: Object.freeze([]),
    benoetigtePorts: Object.freeze([]),
    standardAktiv: false,
  });
}
