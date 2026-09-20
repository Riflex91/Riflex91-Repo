export interface CombatEntityEvidence {
  readonly schemaVersion: 1;
  readonly entityId: string;
  readonly entityFingerprint: string;
  readonly map: string;
  readonly instanz: string;
  readonly beobachtetAmMs: number;
  readonly visible: boolean;
  readonly tot: boolean;
  readonly targetCharacterId: string | null;
  readonly conditions: readonly string[];
  readonly immune: boolean;
  readonly attack: number;
  readonly range: number;
  readonly frequency: number;
  readonly evidenceFingerprint: string;
}

export interface ThreatCcPin {
  readonly entityId: string;
  readonly entityFingerprint: string;
  readonly targetCharacterId: string | null;
  readonly conditions: readonly string[];
  readonly immune: boolean;
  readonly erwarteterBasisDps: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly evidenceFingerprint: string;
  readonly rawTargetIstOwnership: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function pinneThreatCcEvidence(
  evidence: CombatEntityEvidence,
  maxAlterMs: number,
): ThreatCcPin {
  if (evidence.schemaVersion !== 1) throw new Error("THREAT_SCHEMA_UNGUELTIG");
  for (const text of [
    evidence.entityId,
    evidence.entityFingerprint,
    evidence.map,
    evidence.instanz,
    evidence.evidenceFingerprint,
  ]) pruefeText(text, "THREAT_TEXT_UNGUELTIG");
  if (!Number.isSafeInteger(evidence.beobachtetAmMs)
      || evidence.beobachtetAmMs < 0
      || !Number.isSafeInteger(maxAlterMs)
      || maxAlterMs < 1
      || maxAlterMs > 30_000
      || !Number.isFinite(evidence.attack)
      || evidence.attack < 0
      || !Number.isFinite(evidence.range)
      || evidence.range < 0
      || !Number.isFinite(evidence.frequency)
      || evidence.frequency < 0
      || evidence.frequency > 100
      || !evidence.visible
      || evidence.tot
      || evidence.conditions.length > 64) {
    throw new Error("THREAT_EVIDENCE_UNGUELTIG");
  }
  for (const condition of evidence.conditions) {
    pruefeText(condition, "THREAT_CONDITION_UNGUELTIG");
  }
  const unique = [...evidence.conditions].sort();
  if (unique.some((x, index) => index > 0 && x === unique[index - 1])) {
    throw new Error("THREAT_CONDITION_DOPPELT");
  }
  return Object.freeze({
    entityId: evidence.entityId,
    entityFingerprint: evidence.entityFingerprint,
    targetCharacterId: evidence.targetCharacterId,
    conditions: Object.freeze(unique),
    immune: evidence.immune,
    erwarteterBasisDps: evidence.attack * evidence.frequency,
    beobachtetAmMs: evidence.beobachtetAmMs,
    gueltigBisMs: evidence.beobachtetAmMs + maxAlterMs,
    evidenceFingerprint: evidence.evidenceFingerprint,
    rawTargetIstOwnership: false,
  });
}

export function istThreatCcPinFrisch(pin: ThreatCcPin, jetztMs: number): boolean {
  return Number.isSafeInteger(jetztMs)
    && jetztMs >= pin.beobachtetAmMs
    && jetztMs <= pin.gueltigBisMs;
}
