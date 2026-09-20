export type HealthZustand = "GESUND" | "DEGRADIERT" | "KRITISCH" | "UNBEKANNT";

export interface HealthEvidence {
  readonly healthId: string;
  readonly zustand: Exclude<HealthZustand, "UNBEKANNT">;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly evidenceId: string;
}

export interface KritischeHealthAnforderung {
  readonly healthId: string;
  readonly erforderlich: true;
}

export interface HealthBewertung {
  readonly zustand: HealthZustand;
  readonly fehlendeHealthIds: readonly string[];
  readonly staleHealthIds: readonly string[];
  readonly kritischeHealthIds: readonly string[];
  readonly degradiertHealthIds: readonly string[];
  readonly mutationErlaubt: boolean;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function bewerteKritischeHealth(
  anforderungen: readonly KritischeHealthAnforderung[],
  evidence: readonly HealthEvidence[],
  jetztMs: number,
): HealthBewertung {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("HEALTH_ZEIT_UNGUELTIG");
  }
  if (anforderungen.length < 1 || anforderungen.length > 256) {
    throw new Error("HEALTH_ANFORDERUNGEN_ANZAHL_UNGUELTIG");
  }
  if (evidence.length > 512) throw new Error("HEALTH_EVIDENCE_ANZAHL_UNGUELTIG");

  const fehlend: string[] = [];
  const stale: string[] = [];
  const kritisch: string[] = [];
  const degradiert: string[] = [];

  for (const anforderung of anforderungen) {
    pruefeText(anforderung.healthId, "HEALTH_ID_UNGUELTIG");
    const passend = evidence.find(x => x.healthId === anforderung.healthId);
    if (passend === undefined) {
      fehlend.push(anforderung.healthId);
      continue;
    }
    pruefeText(passend.evidenceId, "HEALTH_EVIDENCE_ID_UNGUELTIG");
    if (!Number.isSafeInteger(passend.beobachtetAmMs)
        || !Number.isSafeInteger(passend.gueltigBisMs)
        || passend.beobachtetAmMs > jetztMs
        || passend.gueltigBisMs < jetztMs) {
      stale.push(anforderung.healthId);
      continue;
    }
    if (passend.zustand === "KRITISCH") kritisch.push(anforderung.healthId);
    if (passend.zustand === "DEGRADIERT") degradiert.push(anforderung.healthId);
  }

  const zustand: HealthZustand =
    fehlend.length > 0 || stale.length > 0 ? "UNBEKANNT"
    : kritisch.length > 0 ? "KRITISCH"
    : degradiert.length > 0 ? "DEGRADIERT"
    : "GESUND";

  return Object.freeze({
    zustand,
    fehlendeHealthIds: Object.freeze([...fehlend].sort()),
    staleHealthIds: Object.freeze([...stale].sort()),
    kritischeHealthIds: Object.freeze([...kritisch].sort()),
    degradiertHealthIds: Object.freeze([...degradiert].sort()),
    mutationErlaubt: zustand === "GESUND",
  });
}
