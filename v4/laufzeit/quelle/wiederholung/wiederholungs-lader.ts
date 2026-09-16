import type { WiederholungsSegment } from '../vertraege/telemetrie.js';
import type { WiederholungsEreignisEintrag, WiederholungsZustandsEintrag } from '../vertraege/wiederholung.js';
import { ladeSpielzustandAufzeichnung } from '../kern/spielzustand-aufzeichnung.js';
import { ladeWiederholungsSegmente } from './segment-lader.js';

function vergleicheText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface SpielzustandWiederholungsQuelle {
  readonly charakterKennung: string;
  readonly inhalt: string;
}

export function ladeWiederholungsZustaende(
  quellen: readonly SpielzustandWiederholungsQuelle[]
): readonly WiederholungsZustandsEintrag[] {
  const ergebnis: WiederholungsZustandsEintrag[] = [];
  for (const quelle of quellen) {
    if (quelle.charakterKennung.trim().length === 0) throw new Error('Eine Wiederholungsquelle benoetigt eine CharakterKennung.');
    const aufzeichnung = ladeSpielzustandAufzeichnung(quelle.inhalt);
    for (const zustand of aufzeichnung.zustaende) ergebnis.push(Object.freeze({ charakterKennung: quelle.charakterKennung, zustand }));
  }
  ergebnis.sort((a, b) => a.zustand.aufgenommenAm - b.zustand.aufgenommenAm || vergleicheText(a.charakterKennung, b.charakterKennung) || a.zustand.laufendeNummer - b.zustand.laufendeNummer);
  return Object.freeze(ergebnis);
}

export function ladeWiederholungsEreignisse(
  segmente: readonly WiederholungsSegment[],
  charakterNachAblauf: Readonly<Record<string, string>> = {}
): readonly WiederholungsEreignisEintrag[] {
  const sammlung = ladeWiederholungsSegmente(segmente);
  return Object.freeze(sammlung.ereignisse.map((ereignis) => Object.freeze({
    charakterKennung: charakterNachAblauf[ereignis.ablaufKennung] ?? null,
    ereignis
  })));
}
