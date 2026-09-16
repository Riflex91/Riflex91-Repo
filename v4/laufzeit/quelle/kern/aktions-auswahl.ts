import type { AktionsAnfrage, AktionsWichtigkeit } from '../vertraege/aktions-anfrage.js';

export const AKTIONS_WICHTIGKEITS_RANG: Readonly<Record<AktionsWichtigkeit, number>> = Object.freeze({
  notfall: 4,
  sicherheit: 3,
  normal: 2,
  hintergrund: 1
});

export function holeAktionsWichtigkeitsRang(wichtigkeit: AktionsWichtigkeit): number {
  return AKTIONS_WICHTIGKEITS_RANG[wichtigkeit];
}

export class AktionsAuswahl {
  sortiereNachWichtigkeit(aktionsAnfragen: readonly AktionsAnfrage[], jetzt: number): readonly AktionsAnfrage[] {
    return aktionsAnfragen
      .filter((anfrage) => anfrage.gueltigBis === undefined || anfrage.gueltigBis > jetzt)
      .slice()
      .sort((a, b) => {
        const wichtigkeitsUnterschied =
          holeAktionsWichtigkeitsRang(b.wichtigkeit) - holeAktionsWichtigkeitsRang(a.wichtigkeit);
        if (wichtigkeitsUnterschied !== 0) return wichtigkeitsUnterschied;
        if (a.prioritaet !== b.prioritaet) return b.prioritaet - a.prioritaet;
        if (a.angefordertAm !== b.angefordertAm) return a.angefordertAm - b.angefordertAm;
        return a.kennung.localeCompare(b.kennung);
      });
  }

  waehleNaechsteAktion(aktionsAnfragen: readonly AktionsAnfrage[], jetzt: number): AktionsAnfrage | null {
    return this.sortiereNachWichtigkeit(aktionsAnfragen, jetzt)[0] ?? null;
  }
}
