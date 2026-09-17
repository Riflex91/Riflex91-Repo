import type { AktionsSteuerungsSchritt } from '../vertraege/aktions-steuerung.js';
import { KAMPF_SICHERHEITS_AKTIONS_NAMEN } from '../vertraege/kampfsicherheit.js';
import { AktionsSteuerung } from '../kern/aktions-steuerung.js';

export interface AdventureLandKampfSicherheitsAusfuehrungOptionen {
  readonly aktivFreigegeben?: boolean;
}

export interface AdventureLandKampfSicherheitsAusfuehrungsErgebnis {
  readonly aktionsKennung: string;
  readonly aktionsName: string;
  readonly bewegungGestartetAm: number;
  readonly beendetAm: number;
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
    throw new Error('Der Sicherheits-Ausfuehrungszeitpunkt muss eine endliche, nichtnegative Zahl sein.');
  }
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null;
}

export class AdventureLandKampfSicherheitsAusfuehrung {
  private readonly aktivFreigegeben: boolean;

  public constructor(
    private readonly spielFenster: object,
    optionen: AdventureLandKampfSicherheitsAusfuehrungOptionen = {}
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
  }

  public async fuehreFreigegebeneSicherheitsAktionAus(
    schritt: AktionsSteuerungsSchritt,
    steuerung: AktionsSteuerung,
    zeitQuelle: () => number
  ): Promise<Readonly<AdventureLandKampfSicherheitsAusfuehrungsErgebnis>> {
    if (!this.aktivFreigegeben) {
      throw new Error('Aktive Adventure-Land-Kampfsicherheitsausfuehrung ist nicht ausdruecklich freigegeben.');
    }
    if (schritt.art !== 'gestartet' || schritt.gestarteteAnfrage === null) {
      throw new Error('Nur eine von der zentralen AktionsSteuerung gestartete Sicherheitsanfrage darf aktiv ausgefuehrt werden.');
    }

    const anfrage = schritt.gestarteteAnfrage;
    const lauf = steuerung.holeAktionsZustand(anfrage.kennung);
    if (!lauf || lauf.phase !== 'laeuft' || lauf.anfrage.kennung !== anfrage.kennung) {
      throw new Error('Die zentrale AktionsSteuerung bestaetigt die Sicherheitsaktion nicht mehr als laufend.');
    }

    try {
      if (anfrage.aktion !== KAMPF_SICHERHEITS_AKTIONS_NAMEN.rueckzug &&
          anfrage.aktion !== KAMPF_SICHERHEITS_AKTIONS_NAMEN.abstandHerstellen) {
        throw new Error(`Nicht freigegebene Kampfsicherheitsaktion: ${anfrage.aktion}.`);
      }
      if (!istObjekt(anfrage.details) || typeof anfrage.details.x !== 'number' || typeof anfrage.details.y !== 'number' ||
          !Number.isFinite(anfrage.details.x) || !Number.isFinite(anfrage.details.y)) {
        throw new Error(`${anfrage.aktion} benoetigt endliche x-/y-Koordinaten.`);
      }

      const move = Reflect.get(this.spielFenster, 'move');
      if (typeof move !== 'function') throw new Error('Adventure-Land-Funktion move ist nicht verfuegbar.');
      Reflect.apply(move, this.spielFenster, [anfrage.details.x, anfrage.details.y]);

      const beendetAm = zeitQuelle();
      pruefeZeitpunkt(beendetAm);
      if (beendetAm < schritt.zeitpunkt) throw new Error('Der Abschlusszeitpunkt darf nicht vor der zentralen Freigabe liegen.');
      if (steuerung.holeAktionsZustand(anfrage.kennung)?.phase === 'laeuft') {
        steuerung.schliesseAktionAb(anfrage.kennung, beendetAm, 'Freigegebene Adventure-Land-Kampfsicherheitsaktion gestartet.');
      }

      return Object.freeze({
        aktionsKennung: anfrage.kennung,
        aktionsName: anfrage.aktion,
        bewegungGestartetAm: schritt.zeitpunkt,
        beendetAm
      });
    } catch (fehler) {
      const beendetAm = zeitQuelle();
      pruefeZeitpunkt(beendetAm);
      if (steuerung.holeAktionsZustand(anfrage.kennung)?.phase === 'laeuft') {
        steuerung.brecheAktionAb(anfrage.kennung, beendetAm, `Adventure-Land-Kampfsicherheitsaktion fehlgeschlagen: ${fehlerText(fehler)}`);
      }
      throw fehler;
    }
  }
}
