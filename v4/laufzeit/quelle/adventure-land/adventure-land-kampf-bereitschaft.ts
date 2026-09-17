import type { KampfAktionsBereitschaft } from '../vertraege/kampf-aktionsbereitschaft.js';

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
    throw new Error('Der Bereitschaftszeitpunkt muss eine endliche, nichtnegative Zahl sein.');
  }
}

function unbekannt(aktionsName: string, aufgenommenAm: number, grund: string): Readonly<KampfAktionsBereitschaft> {
  return Object.freeze({
    schemaVersion: 1,
    aufgenommenAm,
    aktionsName,
    zustand: 'unbekannt',
    bereitAb: null,
    restMillisekunden: null,
    grund
  });
}

export class AdventureLandKampfBereitschaftLesezugriff {
  public constructor(private readonly spielFenster: object) {}

  public liesNormalenAngriff(aufgenommenAm: number): Readonly<KampfAktionsBereitschaft> {
    return this.liesAktionsBereitschaft('attack', aufgenommenAm);
  }

  public liesAktionsBereitschaft(aktionsName: string, aufgenommenAm: number): Readonly<KampfAktionsBereitschaft> {
    pruefeZeitpunkt(aufgenommenAm);
    if (aktionsName.trim().length === 0) throw new Error('Eine Aktionsbereitschaft benoetigt einen Aktionsnamen.');

    const funktion = Reflect.get(this.spielFenster, 'ms_to_next_skill');
    if (typeof funktion !== 'function') {
      return unbekannt(aktionsName, aufgenommenAm, 'Adventure Land stellt ms_to_next_skill nicht bereit.');
    }

    try {
      const rohwert = Reflect.apply(funktion, this.spielFenster, [aktionsName]);
      if (typeof rohwert !== 'number' || !Number.isFinite(rohwert)) {
        return unbekannt(aktionsName, aufgenommenAm, 'ms_to_next_skill lieferte keinen endlichen Zahlenwert.');
      }

      const restMillisekunden = Math.max(0, rohwert);
      const bereitAb = aufgenommenAm + restMillisekunden;
      return Object.freeze({
        schemaVersion: 1,
        aufgenommenAm,
        aktionsName,
        zustand: restMillisekunden > 0 ? 'abklingzeit' : 'bereit',
        bereitAb,
        restMillisekunden,
        grund: restMillisekunden > 0
          ? `Aktion ist noch ${restMillisekunden} ms in Abklingzeit.`
          : 'Aktion ist laut Adventure Land bereit.'
      });
    } catch (fehler) {
      const grund = fehler instanceof Error ? fehler.message : String(fehler);
      return unbekannt(aktionsName, aufgenommenAm, `Aktionsbereitschaft konnte nicht gelesen werden: ${grund}`);
    }
  }
}
