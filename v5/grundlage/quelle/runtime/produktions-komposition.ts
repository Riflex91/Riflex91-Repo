import type { KritischeHealthAnforderung } from "../operations/health.js";
import {
  merchantCoreABasisModulDefinition,
} from "../merchant/modul-vertrag.js";
import {
  merchantCoreAPlanungsFaehigkeitDefinitionen,
} from "../merchant/faehigkeits-vertrag.js";
import {
  merchantBankCoreModulDefinition,
} from "../merchant/bank-produktions-modul-vertrag.js";
import {
  merchantBankDepositMutationsFaehigkeitDefinition,
  merchantBankWithdrawMutationsFaehigkeitDefinition,
  merchantBankSwapMutationsFaehigkeitDefinition,
} from "../merchant/bank-produktions-faehigkeits-vertrag.js";
import {
  equipmentCoreModulDefinition,
} from "../equipment/modul-vertrag.js";
import {
  equipmentEquipMutationsFaehigkeitDefinition,
} from "../equipment/faehigkeits-vertrag.js";
import type {
  V5ProduktionsKompositionsDefinition,
} from "./produktions-runtime.js";

export const PRODUKTIONS_KOMPOSITIONS_KATALOG_STATUS =
  "DEFAULT_DENY_PLANEN_EQUIP_UND_BANK_GOLD_MUTIEREN_REGISTRIERT_INAKTIV";

export const V5_PRODUKTIONS_STORAGE_HEALTH_ID = "produktiver-speicher";

export const KANONISCHE_PRODUKTIONS_HEALTH_ANFORDERUNGEN:
readonly KritischeHealthAnforderung[] = Object.freeze([
  Object.freeze({
    healthId: V5_PRODUKTIONS_STORAGE_HEALTH_ID,
    erforderlich: true,
  }),
]);

function kopiereHealthAnforderungen(
  anforderungen: readonly KritischeHealthAnforderung[],
): readonly KritischeHealthAnforderung[] {
  return Object.freeze(
    anforderungen.map(anforderung => Object.freeze({ ...anforderung })),
  );
}

export function erstelleKanonischeProduktionsKomposition(
  healthAnforderungen: readonly KritischeHealthAnforderung[] =
    KANONISCHE_PRODUKTIONS_HEALTH_ANFORDERUNGEN,
): V5ProduktionsKompositionsDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulDefinitionen: Object.freeze([
      merchantCoreABasisModulDefinition(),
      merchantBankCoreModulDefinition(),
      equipmentCoreModulDefinition(),
    ]),
    faehigkeitsDefinitionen: Object.freeze([
      ...merchantCoreAPlanungsFaehigkeitDefinitionen(),
      merchantBankDepositMutationsFaehigkeitDefinition(),
      merchantBankWithdrawMutationsFaehigkeitDefinition(),
      merchantBankSwapMutationsFaehigkeitDefinition(),
      equipmentEquipMutationsFaehigkeitDefinition(),
    ]),
    healthAnforderungen: kopiereHealthAnforderungen(healthAnforderungen),
  });
}
