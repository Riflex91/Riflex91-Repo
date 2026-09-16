import type { BotEreignis } from '../vertraege/bot-ereignis.js';
import type { EreignisSchreibDaten, EreignisSchreiber } from '../vertraege/telemetrie.js';
import type { EreignisZentrale } from '../kern/ereignis-zentrale.js';

export interface FortlaufenderEreignisSchreiberOptionen {
  readonly sitzungKennung: string;
  readonly startSequenz?: number;
}

export class FortlaufenderEreignisSchreiber implements EreignisSchreiber {
  private laufendeNummer: number;

  constructor(
    private readonly ereignisZentrale: EreignisZentrale,
    private readonly optionen: FortlaufenderEreignisSchreiberOptionen
  ) {
    if (optionen.sitzungKennung.trim().length === 0) throw new Error('Die SitzungKennung darf nicht leer sein.');
    const start = optionen.startSequenz ?? ereignisZentrale.holeLetzteLaufendeNummer();
    if (!Number.isSafeInteger(start) || start < 0) throw new Error('Die Startsequenz muss eine nichtnegative ganze Zahl sein.');
    if (start < ereignisZentrale.holeLetzteLaufendeNummer()) {
      throw new Error('Die Startsequenz darf nicht hinter der EreignisZentrale liegen.');
    }
    this.laufendeNummer = start;
  }

  schreibe<TDetails>(daten: EreignisSchreibDaten<TDetails>): BotEreignis<TDetails> {
    this.pruefeDaten(daten);
    const laufendeNummer = this.laufendeNummer + 1;
    const ereignis: BotEreignis<TDetails> = Object.freeze({
      kennung: `${this.optionen.sitzungKennung}:${laufendeNummer}`,
      laufendeNummer,
      zeitpunkt: daten.zeitpunkt,
      name: daten.name,
      quelle: daten.quelle,
      ablaufKennung: daten.ablaufKennung,
      details: daten.details
    });
    this.ereignisZentrale.sendeEreignis(ereignis);
    this.laufendeNummer = laufendeNummer;
    return ereignis;
  }

  holeLetzteSequenz(): number {
    return this.laufendeNummer;
  }

  private pruefeDaten(daten: EreignisSchreibDaten): void {
    if (!Number.isFinite(daten.zeitpunkt) || daten.zeitpunkt < 0) throw new Error('Der Ereigniszeitpunkt muss endlich und nichtnegativ sein.');
    for (const [name, wert] of [['name', daten.name], ['quelle', daten.quelle], ['ablaufKennung', daten.ablaufKennung]] as const) {
      if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
    }
  }
}
