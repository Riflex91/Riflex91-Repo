import type { UhrPort } from "../determinismus/ports.js";

export interface FrischeEvidence {
  readonly beobachtetAmMs: number;
  readonly maximalAlterMs: number;
}

export function istFrisch(evidence: FrischeEvidence, uhr: UhrPort): boolean {
  if (!Number.isFinite(evidence.beobachtetAmMs)
      || !Number.isFinite(evidence.maximalAlterMs)
      || evidence.maximalAlterMs < 0) {
    return false;
  }

  const alter = uhr.jetztMs() - evidence.beobachtetAmMs;
  return alter >= 0 && alter <= evidence.maximalAlterMs;
}

export function istDeadlineAbgelaufen(deadlineMs: number, uhr: UhrPort): boolean {
  if (!Number.isFinite(deadlineMs)) return true;
  return uhr.jetztMs() > deadlineMs;
}

export function istTtlGueltig(
  erzeugtAmMs: number,
  ttlMs: number,
  uhr: UhrPort,
): boolean {
  if (!Number.isFinite(erzeugtAmMs) || !Number.isFinite(ttlMs) || ttlMs < 0) return false;
  const jetzt = uhr.jetztMs();
  return erzeugtAmMs <= jetzt && jetzt <= erzeugtAmMs + ttlMs;
}
