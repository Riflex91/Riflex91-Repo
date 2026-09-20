import type { KritischeHealthAnforderung } from "../operations/health.js";
import {
  merchantCoreABasisModulDefinition,
} from "../merchant/modul-vertrag.js";
import type {
  V5ProduktionsKompositionsDefinition,
} from "./produktions-runtime.js";

export const PRODUKTIONS_KOMPOSITIONS_KATALOG_STATUS =
  "DEFAULT_DENY_OHNE_FAEHIGKEITSBINDUNGEN";

function kopiereHealthAnforderungen(
  anforderungen: readonly KritischeHealthAnforderung[],
): readonly KritischeHealthAnforderung[] {
  return Object.freeze(
    anforderungen.map(anforderung => Object.freeze({ ...anforderung })),
  );
}

export function erstelleKanonischeProduktionsKomposition(
  healthAnforderungen: readonly KritischeHealthAnforderung[],
): V5ProduktionsKompositionsDefinition {
  return Object.freeze({
    schemaVersion: 1,
    modulDefinitionen: Object.freeze([
      merchantCoreABasisModulDefinition(),
    ]),
    faehigkeitsDefinitionen: Object.freeze([]),
    healthAnforderungen: kopiereHealthAnforderungen(healthAnforderungen),
  });
}
