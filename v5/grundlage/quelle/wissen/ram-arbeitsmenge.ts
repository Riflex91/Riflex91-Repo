import type { BeobachtungsEvidenceEintrag } from "./beobachtungs-evidence.js";
import type { WissensDomaene } from "./typen.js";

export interface RamArbeitsEintrag<T = unknown> {
  readonly schluessel: string;
  readonly kennung: string;
  readonly domaene: WissensDomaene;
  readonly stichproben: number;
  readonly letzteSequenz: number;
  readonly letzteBeobachtungAmMs: number;
  readonly letzterWert: T;
}

export interface RamArbeitsmenge<T = unknown> {
  readonly schemaVersion: 1;
  readonly arbeitsmengenVersion: 1;
  readonly speicherklasse: "HOT_RAM";
  readonly quellenEintraege: number;
  readonly verworfeneKennungenWegenGrenze: number;
  readonly eintraege: readonly RamArbeitsEintrag<T>[];
  readonly ausfuehrungsAutoritaet: false;
}

export function verdichteZuRamArbeitsmenge<T>(
  evidence: readonly BeobachtungsEvidenceEintrag<T>[],
  maximaleKennungen: number,
): RamArbeitsmenge<T> {
  if (!Number.isInteger(maximaleKennungen) || maximaleKennungen < 1 || maximaleKennungen > 10_000) {
    throw new Error("RAM_ARBEITSMENGE_GRENZE_UNGUELTIG");
  }

  const sortiert = [...evidence].sort((a, b) =>
    a.sequenz - b.sequenz || a.evidenceId.localeCompare(b.evidenceId));
  let aggregiert: readonly RamArbeitsEintrag<T>[] = Object.freeze([]);

  for (const eintrag of sortiert) {
    const schluessel = eintrag.domaene + ":" + eintrag.kennung;
    const vorhanden = aggregiert.find(kandidat => kandidat.schluessel === schluessel);
    const aktualisiert: RamArbeitsEintrag<T> = Object.freeze({
      schluessel,
      kennung: eintrag.kennung,
      domaene: eintrag.domaene,
      stichproben: (vorhanden?.stichproben ?? 0) + 1,
      letzteSequenz: eintrag.sequenz,
      letzteBeobachtungAmMs: eintrag.beobachtetAmMs,
      letzterWert: eintrag.wert,
    });
    aggregiert = vorhanden === undefined
      ? Object.freeze([...aggregiert, aktualisiert])
      : Object.freeze(aggregiert.map(kandidat =>
        kandidat.schluessel === schluessel ? aktualisiert : kandidat));
  }

  const nachAktualitaet = [...aggregiert].sort((a, b) =>
    b.letzteBeobachtungAmMs - a.letzteBeobachtungAmMs
      || b.letzteSequenz - a.letzteSequenz
      || a.schluessel.localeCompare(b.schluessel));
  const begrenzt = Object.freeze(nachAktualitaet.slice(0, maximaleKennungen));

  return Object.freeze({
    schemaVersion: 1,
    arbeitsmengenVersion: 1,
    speicherklasse: "HOT_RAM",
    quellenEintraege: evidence.length,
    verworfeneKennungenWegenGrenze: Math.max(0, aggregiert.length - begrenzt.length),
    eintraege: begrenzt,
    ausfuehrungsAutoritaet: false,
  });
}
