import type { KontingentEntscheidung, VerbrauchsStand } from '../vertraege/dienst-kontingent.js';
import type { DienstVerbrauchsEintrag, EreignisSchreiber } from '../vertraege/telemetrie.js';

export interface DienstVerbrauchsErfassung {
  readonly kennung: string;
  readonly zeitpunkt: number;
  readonly stand: VerbrauchsStand;
  readonly entscheidung: KontingentEntscheidung;
}

export function erstelleDienstVerbrauchsEintrag(erfassung: DienstVerbrauchsErfassung): DienstVerbrauchsEintrag {
  if (erfassung.kennung.trim().length === 0) throw new Error('Die Dienstverbrauchs-Kennung darf nicht leer sein.');
  if (!Number.isFinite(erfassung.zeitpunkt) || erfassung.zeitpunkt < 0) throw new Error('Der Dienstverbrauchs-Zeitpunkt ist ungueltig.');
  if (erfassung.stand.dienstKennung !== erfassung.entscheidung.dienstKennung) {
    throw new Error('VerbrauchsStand und KontingentEntscheidung muessen zum selben Dienst gehoeren.');
  }
  return Object.freeze({
    schemaVersion: 1,
    kennung: erfassung.kennung,
    zeitpunkt: erfassung.zeitpunkt,
    dienstKennung: erfassung.stand.dienstKennung,
    grenzeKennung: erfassung.stand.grenzeKennung,
    fensterKennung: erfassung.stand.fensterKennung,
    vorgangKennung: erfassung.entscheidung.vorgangKennung,
    lokalReserviert: erfassung.stand.lokalReserviert,
    vomAnbieterGemeldet: erfassung.stand.vomAnbieterGemeldet,
    schutzstufe: erfassung.entscheidung.schutzstufe,
    erlaubt: erfassung.entscheidung.erlaubt,
    grund: erfassung.entscheidung.grund
  });
}

export function schreibeDienstVerbrauchsEreignis(
  schreiber: EreignisSchreiber,
  eintrag: DienstVerbrauchsEintrag
): void {
  schreiber.schreibe({
    zeitpunkt: eintrag.zeitpunkt,
    name: eintrag.erlaubt ? 'dienst_verbrauch_erfasst' : 'dienst_anfrage_blockiert',
    quelle: 'kontingent-waechter',
    ablaufKennung: eintrag.vorgangKennung,
    details: eintrag
  });
}
