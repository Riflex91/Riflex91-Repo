import type {
  FaehigkeitsAnbieterDefinition,
} from "../autoritaet/faehigkeits-register.js";
import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
} from "./modul-vertrag.js";

export const EQUIPMENT_CORE_FAEHIGKEITS_VERTRAG_VERSION = "1";

export function equipmentEquipMutationsFaehigkeitDefinition():
FaehigkeitsAnbieterDefinition {
  return Object.freeze({
    schemaVersion: 1,
    faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
    anbieterModulId: EQUIPMENT_CORE_MODUL_ID,
    anbieterVersion: EQUIPMENT_CORE_MODUL_VERSION,
    modus: "MUTIEREN",
    status: "VERFUEGBAR",
    standardAktiv: false,
  });
}
