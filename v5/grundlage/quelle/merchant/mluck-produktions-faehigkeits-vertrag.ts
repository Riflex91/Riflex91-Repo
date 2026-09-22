import type {
  FaehigkeitsAnbieterDefinition,
} from "../autoritaet/faehigkeits-register.js";
import {
  MERCHANT_MLUCK_CORE_MODUL_ID,
  MERCHANT_MLUCK_CORE_MODUL_VERSION,
  MERCHANT_MLUCK_FAEHIGKEIT_ID,
} from "./mluck-produktions-modul-vertrag.js";

export function merchantMluckMutationsFaehigkeitDefinition():
FaehigkeitsAnbieterDefinition {
  return Object.freeze({
    schemaVersion: 1,
    faehigkeitId: MERCHANT_MLUCK_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_MLUCK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_MLUCK_CORE_MODUL_VERSION,
    modus: "MUTIEREN",
    status: "VERFUEGBAR",
    standardAktiv: false,
  });
}
