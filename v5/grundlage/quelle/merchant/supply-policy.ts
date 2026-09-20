export interface SupplyPolicy {
  readonly niedrigSchwelle: number;
  readonly zielMenge: number;
  readonly mindestBatch: number;
  readonly maximalBatch: number;
  readonly merchantReserve: number;
}

export interface SupplyBedarf {
  readonly benoetigt: boolean;
  readonly menge: number;
  readonly grund: "AUSREICHEND" | "UNTER_SCHWELLE" | "BATCH_ZU_KLEIN" | "MERCHANT_RESERVE";
}

function pruefeMenge(wert: number, fehler: string): void {
  if (!Number.isInteger(wert) || wert < 0 || wert > 1_000_000) throw new Error(fehler);
}

export function berechneSupplyBedarf(
  aktuelleMenge: number,
  merchantVerfuegbar: number,
  policy: SupplyPolicy,
): SupplyBedarf {
  for (const [wert, fehler] of [
    [aktuelleMenge, "SUPPLY_AKTUELL_UNGUELTIG"],
    [merchantVerfuegbar, "SUPPLY_MERCHANT_MENGE_UNGUELTIG"],
    [policy.niedrigSchwelle, "SUPPLY_SCHWELLE_UNGUELTIG"],
    [policy.zielMenge, "SUPPLY_ZIEL_UNGUELTIG"],
    [policy.mindestBatch, "SUPPLY_MIN_BATCH_UNGUELTIG"],
    [policy.maximalBatch, "SUPPLY_MAX_BATCH_UNGUELTIG"],
    [policy.merchantReserve, "SUPPLY_RESERVE_UNGUELTIG"],
  ] as const) pruefeMenge(wert, fehler);

  if (policy.zielMenge <= policy.niedrigSchwelle
      || policy.mindestBatch < 1
      || policy.maximalBatch < policy.mindestBatch) {
    throw new Error("SUPPLY_POLICY_UNGUELTIG");
  }
  if (aktuelleMenge > policy.niedrigSchwelle) {
    return Object.freeze({ benoetigt: false, menge: 0, grund: "AUSREICHEND" });
  }

  const bedarf = Math.max(0, policy.zielMenge - aktuelleMenge);
  const frei = Math.max(0, merchantVerfuegbar - policy.merchantReserve);
  if (frei === 0) {
    return Object.freeze({ benoetigt: false, menge: 0, grund: "MERCHANT_RESERVE" });
  }
  const menge = Math.min(bedarf, frei, policy.maximalBatch);
  if (menge < policy.mindestBatch) {
    return Object.freeze({ benoetigt: false, menge: 0, grund: "BATCH_ZU_KLEIN" });
  }
  return Object.freeze({ benoetigt: true, menge, grund: "UNTER_SCHWELLE" });
}
