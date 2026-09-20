import type { ModulDefinition } from "../autoritaet/modul-register.js";

export const MERCHANT_CORE_A_MODUL_ID = "merchant-core-a";
export const MERCHANT_CORE_A_MODUL_VERSION = "1";

export function merchantCoreABasisModulDefinition(): ModulDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulId: MERCHANT_CORE_A_MODUL_ID,
    modulVersion: MERCHANT_CORE_A_MODUL_VERSION,
    bereitgestellteFaehigkeiten: Object.freeze([]),
    benoetigteFaehigkeiten: Object.freeze([]),
    bereitgestelltePorts: Object.freeze([]),
    benoetigtePorts: Object.freeze([]),
    standardAktiv: false,
  });
}
