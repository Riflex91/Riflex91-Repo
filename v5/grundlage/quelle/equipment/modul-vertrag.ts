import type { ModulDefinition } from "../autoritaet/modul-register.js";

export const EQUIPMENT_CORE_MODUL_ID = "equipment-core";
export const EQUIPMENT_CORE_MODUL_VERSION = "1";
export const EQUIPMENT_EQUIP_FAEHIGKEIT_ID = "equipment.equip";

export function equipmentCoreModulDefinition(): ModulDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulId: EQUIPMENT_CORE_MODUL_ID,
    modulVersion: EQUIPMENT_CORE_MODUL_VERSION,
    bereitgestellteFaehigkeiten: Object.freeze([
      EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
    ]),
    benoetigteFaehigkeiten: Object.freeze([]),
    bereitgestelltePorts: Object.freeze([]),
    benoetigtePorts: Object.freeze([]),
    standardAktiv: false,
  });
}
