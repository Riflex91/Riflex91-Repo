function normalisiere(
  wert: unknown,
  tiefe: number,
  maximaleTiefe: number,
  maximaleElemente: number,
): unknown {
  if (tiefe > maximaleTiefe) throw new Error("SERIALISIERUNG_ZU_TIEF");

  if (wert === null || typeof wert === "string" || typeof wert === "boolean") return wert;

  if (typeof wert === "number") {
    if (!Number.isFinite(wert)) throw new Error("SERIALISIERUNG_ZAHL_UNGUELTIG");
    return Object.is(wert, -0) ? 0 : wert;
  }

  if (Array.isArray(wert)) {
    if (wert.length > maximaleElemente) throw new Error("SERIALISIERUNG_ZU_VIELE_ELEMENTE");
    return Object.freeze(wert.map(eintrag =>
      normalisiere(eintrag, tiefe + 1, maximaleTiefe, maximaleElemente)));
  }

  if (typeof wert === "object") {
    const prototype = Object.getPrototypeOf(wert);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("SERIALISIERUNG_NUR_REINE_OBJEKTE");
    }

    const quelle = wert as Record<string, unknown>;
    const schluessel = Object.keys(quelle).sort();
    if (schluessel.length > maximaleElemente) throw new Error("SERIALISIERUNG_ZU_VIELE_FELDER");

    const ziel: Record<string, unknown> = {};
    for (const schluesselName of schluessel) {
      const feld = quelle[schluesselName];
      if (feld === undefined) throw new Error("SERIALISIERUNG_UNDEFINED_VERBOTEN");
      ziel[schluesselName] = normalisiere(
        feld,
        tiefe + 1,
        maximaleTiefe,
        maximaleElemente,
      );
    }
    return Object.freeze(ziel);
  }

  throw new Error("SERIALISIERUNG_TYP_VERBOTEN");
}

export function kanonischSerialisieren(
  wert: unknown,
  maximaleTiefe = 64,
  maximaleElemente = 10_000,
): string {
  if (!Number.isInteger(maximaleTiefe) || maximaleTiefe < 1 || maximaleTiefe > 256) {
    throw new Error("SERIALISIERUNG_TIEFENGRENZE_UNGUELTIG");
  }
  if (!Number.isInteger(maximaleElemente) || maximaleElemente < 1 || maximaleElemente > 100_000) {
    throw new Error("SERIALISIERUNG_ELEMENTGRENZE_UNGUELTIG");
  }
  return JSON.stringify(normalisiere(wert, 0, maximaleTiefe, maximaleElemente));
}
