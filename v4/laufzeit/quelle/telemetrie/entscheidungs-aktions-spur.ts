import type {
  AktionsSpurEintrag,
  EntscheidungsSpurEintrag,
  EreignisSchreiber
} from '../vertraege/telemetrie.js';

function pruefeText(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der Spur-Zeitpunkt muss endlich und nichtnegativ sein.');
}

export class EntscheidungsAktionsSpur {
  constructor(private readonly schreiber: EreignisSchreiber) {}

  schreibeEntscheidung<TDetails>(eintrag: EntscheidungsSpurEintrag<TDetails>): void {
    pruefeZeitpunkt(eintrag.zeitpunkt);
    for (const [name, wert] of [
      ['entscheidungKennung', eintrag.entscheidungKennung],
      ['ablaufKennung', eintrag.ablaufKennung],
      ['quelle', eintrag.quelle],
      ['entscheidung', eintrag.entscheidung],
      ['grund', eintrag.grund]
    ] as const) pruefeText(name, wert);
    this.schreiber.schreibe({
      zeitpunkt: eintrag.zeitpunkt,
      name: 'entscheidung_getroffen',
      quelle: eintrag.quelle,
      ablaufKennung: eintrag.ablaufKennung,
      details: Object.freeze({
        entscheidungKennung: eintrag.entscheidungKennung,
        entscheidung: eintrag.entscheidung,
        grund: eintrag.grund,
        details: eintrag.details
      })
    });
  }

  schreibeAktionsPhase<TDetails>(eintrag: AktionsSpurEintrag<TDetails>): void {
    pruefeZeitpunkt(eintrag.zeitpunkt);
    for (const [name, wert] of [
      ['aktionsKennung', eintrag.aktionsKennung],
      ['ablaufKennung', eintrag.ablaufKennung],
      ['quelle', eintrag.quelle],
      ['phase', eintrag.phase],
      ['grund', eintrag.grund]
    ] as const) pruefeText(name, wert);
    this.schreiber.schreibe({
      zeitpunkt: eintrag.zeitpunkt,
      name: 'aktionsphase',
      quelle: eintrag.quelle,
      ablaufKennung: eintrag.ablaufKennung,
      details: Object.freeze({
        aktionsKennung: eintrag.aktionsKennung,
        phase: eintrag.phase,
        grund: eintrag.grund,
        details: eintrag.details
      })
    });
  }
}
