export const EVIDENCE_KINDS = ['observed', 'inferred', 'learned'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export interface Evidence<TValue = unknown> {
  readonly kind: EvidenceKind;
  readonly confidence: number;
  readonly observedAt: number;
  readonly value: TValue;
}

export interface WorldSnapshot {
  readonly schemaVersion: number;
  readonly sequence: number;
  readonly capturedAt: number;
  readonly traceId: string;
  readonly character: Readonly<Record<string, unknown>>;
  readonly entities: readonly Readonly<Record<string, unknown>>[];
  readonly party: readonly Readonly<Record<string, unknown>>[];
  readonly inventory: readonly Readonly<Record<string, unknown>>[];
}
