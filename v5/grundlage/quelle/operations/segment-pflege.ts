export interface DatenSegment {
  readonly segmentId: string;
  readonly erstelltAmMs: number;
  readonly bytes: number;
  readonly komprimiert: boolean;
}

export interface SegmentPflegeRegel {
  readonly maximaleSegmente: number;
  readonly maximaleBytes: number;
  readonly maximalesAlterMs: number;
  readonly komprimiereAbAlterMs: number;
}

export interface SegmentPflegePlan {
  readonly komprimierenIds: readonly string[];
  readonly loeschenIds: readonly string[];
  readonly behaltenIds: readonly string[];
}

export function planeSegmentPflege(
  segmente: readonly DatenSegment[],
  regel: SegmentPflegeRegel,
  jetztMs: number,
): SegmentPflegePlan {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("SEGMENT_ZEIT_UNGUELTIG");
  if (segmente.length > 100_000) throw new Error("SEGMENT_ANZAHL_UNGUELTIG");
  if (!Number.isInteger(regel.maximaleSegmente) || regel.maximaleSegmente < 1
      || !Number.isSafeInteger(regel.maximaleBytes) || regel.maximaleBytes < 1
      || !Number.isSafeInteger(regel.maximalesAlterMs) || regel.maximalesAlterMs < 0
      || !Number.isSafeInteger(regel.komprimiereAbAlterMs) || regel.komprimiereAbAlterMs < 0) {
    throw new Error("SEGMENT_REGEL_UNGUELTIG");
  }

  let aktiv = [...segmente].sort((a,b) => a.erstelltAmMs - b.erstelltAmMs || a.segmentId.localeCompare(b.segmentId));
  const loeschen: string[] = [];
  const komprimieren: string[] = [];

  for (const s of aktiv) {
    if (jetztMs - s.erstelltAmMs > regel.maximalesAlterMs) loeschen.push(s.segmentId);
    else if (!s.komprimiert && jetztMs - s.erstelltAmMs >= regel.komprimiereAbAlterMs) komprimieren.push(s.segmentId);
  }
  aktiv = aktiv.filter(x => !loeschen.includes(x.segmentId));

  while (aktiv.length > regel.maximaleSegmente
      || aktiv.reduce((summe,x) => summe + x.bytes, 0) > regel.maximaleBytes) {
    const erstes = aktiv.shift();
    if (erstes === undefined) break;
    loeschen.push(erstes.segmentId);
  }

  return Object.freeze({
    komprimierenIds: Object.freeze([...new Set(komprimieren.filter(x => !loeschen.includes(x)))].sort()),
    loeschenIds: Object.freeze([...new Set(loeschen)].sort()),
    behaltenIds: Object.freeze(aktiv.map(x => x.segmentId).sort()),
  });
}
