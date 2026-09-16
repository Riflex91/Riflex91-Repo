function kanonischerWert(wert: unknown, pfad: string): unknown {
  if (wert === null || typeof wert === 'string' || typeof wert === 'boolean') return wert;
  if (typeof wert === 'number') {
    if (!Number.isFinite(wert)) throw new Error(`Nicht endliche Zahl im Wiederholungsdatensatz: ${pfad}.`);
    return wert;
  }
  if (Array.isArray(wert)) return wert.map((eintrag, index) => kanonischerWert(eintrag, `${pfad}[${index}]`));
  if (typeof wert === 'object') {
    const objekt = wert as Readonly<Record<string, unknown>>;
    const ergebnis: Record<string, unknown> = {};
    for (const schluessel of Object.keys(objekt).sort()) {
      const eintrag = objekt[schluessel];
      if (eintrag === undefined) throw new Error(`undefined ist kein gueltiger Wiederholungswert: ${pfad}.${schluessel}.`);
      ergebnis[schluessel] = kanonischerWert(eintrag, `${pfad}.${schluessel}`);
    }
    return ergebnis;
  }
  throw new Error(`Nicht serialisierbarer Wiederholungswert bei ${pfad}: ${typeof wert}.`);
}

export function kanonisiereJson(wert: unknown): string {
  return JSON.stringify(kanonischerWert(wert, '$'));
}
