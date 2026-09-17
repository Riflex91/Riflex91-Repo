import type { AktionsSteuerungsSchritt } from '../vertraege/aktions-steuerung.js';
import { FARM_AKTIONS_NAMEN } from '../vertraege/farmen.js';
import { AktionsSteuerung } from '../kern/aktions-steuerung.js';

export interface AdventureLandFarmAusfuehrungOptionen {
  readonly aktivFreigegeben?: boolean;
}

export interface AdventureLandFarmAusfuehrungsErgebnis {
  readonly aktionsKennung: string;
  readonly aktionsName: string;
  readonly beendetAm: number;
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der Ausfuehrungszeitpunkt muss eine endliche, nichtnegative Zahl sein.');
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null;
}

function ersteEndlicheZahl(objekt: Readonly<Record<string, unknown>>, felder: readonly string[]): number | null {
  for (const feld of felder) {
    const wert = objekt[feld];
    if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
  }
  return null;
}

export class AdventureLandFarmAusfuehrung {
  private readonly aktivFreigegeben: boolean;

  public constructor(
    private readonly spielFenster: object,
    optionen: AdventureLandFarmAusfuehrungOptionen = {}
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
  }

  public async fuehreFreigegebeneAktionAus(
    schritt: AktionsSteuerungsSchritt,
    steuerung: AktionsSteuerung,
    zeitQuelle: () => number
  ): Promise<Readonly<AdventureLandFarmAusfuehrungsErgebnis>> {
    if (!this.aktivFreigegeben) {
      throw new Error('Aktive Adventure-Land-Farmausfuehrung ist nicht ausdruecklich freigegeben.');
    }
    if (schritt.art !== 'gestartet' || schritt.gestarteteAnfrage === null) {
      throw new Error('Nur eine von der zentralen AktionsSteuerung gestartete Anfrage darf aktiv ausgefuehrt werden.');
    }

    const anfrage = schritt.gestarteteAnfrage;
    const lauf = steuerung.holeAktionsZustand(anfrage.kennung);
    if (!lauf || lauf.phase !== 'laeuft' || lauf.anfrage.kennung !== anfrage.kennung) {
      throw new Error('Die zentrale AktionsSteuerung bestaetigt die Farmaktion nicht mehr als laufend.');
    }

    try {
      await Promise.resolve(this.fuehreAdventureLandAktionAus(anfrage.aktion, anfrage.details));
      const beendetAm = zeitQuelle();
      pruefeZeitpunkt(beendetAm);
      if (beendetAm < schritt.zeitpunkt) throw new Error('Der Abschlusszeitpunkt darf nicht vor der zentralen Freigabe liegen.');
      if (steuerung.holeAktionsZustand(anfrage.kennung)?.phase === 'laeuft') {
        steuerung.schliesseAktionAb(anfrage.kennung, beendetAm, 'Freigegebene Adventure-Land-Farmaktion abgeschlossen.');
      }
      return Object.freeze({ aktionsKennung: anfrage.kennung, aktionsName: anfrage.aktion, beendetAm });
    } catch (fehler) {
      const beendetAm = zeitQuelle();
      pruefeZeitpunkt(beendetAm);
      if (steuerung.holeAktionsZustand(anfrage.kennung)?.phase === 'laeuft') {
        steuerung.brecheAktionAb(anfrage.kennung, beendetAm, `Adventure-Land-Farmaktion fehlgeschlagen: ${fehlerText(fehler)}`);
      }
      throw fehler;
    }
  }

  private fuehreAdventureLandAktionAus(aktionsName: string, details: unknown): unknown {
    if (aktionsName === FARM_AKTIONS_NAMEN.bewegen) {
      if (!istObjekt(details) || typeof details.x !== 'number' || typeof details.y !== 'number' ||
          !Number.isFinite(details.x) || !Number.isFinite(details.y)) {
        throw new Error('FARM_BEWEGEN benoetigt endliche x-/y-Koordinaten.');
      }
      return this.rufeSpielFunktionAuf('move', [details.x, details.y]);
    }

    if (aktionsName === FARM_AKTIONS_NAMEN.angreifen) {
      if (!istObjekt(details) || typeof details.zielKennung !== 'string' || details.zielKennung.trim().length === 0) {
        throw new Error('FARM_ANGREIFEN benoetigt eine Zielkennung.');
      }
      const ziel = this.holeEntity(details.zielKennung);
      if (!ziel) throw new Error(`Farmziel ${details.zielKennung} ist bei der Ausfuehrung nicht mehr sichtbar.`);
      this.pruefeAktuelleAngriffsReichweite(details.zielKennung, ziel);
      return this.rufeSpielFunktionAuf('attack', [ziel]);
    }

    if (aktionsName === FARM_AKTIONS_NAMEN.lebenWiederherstellen) {
      return this.rufeWiederherstellungAuf('use_hp');
    }

    if (aktionsName === FARM_AKTIONS_NAMEN.manaWiederherstellen) {
      return this.rufeWiederherstellungAuf('use_mp');
    }

    if (aktionsName === FARM_AKTIONS_NAMEN.beuteAufnehmen) {
      return this.rufeSpielFunktionAuf('loot', []);
    }

    throw new Error(`Nicht freigegebene Farmaktion: ${aktionsName}.`);
  }

  private pruefeAktuelleAngriffsReichweite(zielKennung: string, ziel: object): void {
    const charakterWert = Reflect.get(this.spielFenster, 'character');
    if (!istObjekt(charakterWert) || !istObjekt(ziel)) {
      throw new Error(`Aktuelle Angriffsreichweite fuer Farmziel ${zielKennung} kann nicht sicher geprueft werden.`);
    }

    const charakterX = ersteEndlicheZahl(charakterWert, ['real_x', 'x']);
    const charakterY = ersteEndlicheZahl(charakterWert, ['real_y', 'y']);
    const zielX = ersteEndlicheZahl(ziel, ['real_x', 'x']);
    const zielY = ersteEndlicheZahl(ziel, ['real_y', 'y']);
    const reichweite = ersteEndlicheZahl(charakterWert, ['range']);
    if (charakterX === null || charakterY === null || zielX === null || zielY === null || reichweite === null || reichweite < 0) {
      throw new Error(`Aktuelle Angriffsreichweite fuer Farmziel ${zielKennung} kann nicht sicher geprueft werden.`);
    }

    const abstand = Math.hypot(zielX - charakterX, zielY - charakterY);
    if (abstand > reichweite) {
      throw new Error(`Farmziel ${zielKennung} ist bei der Ausfuehrung ausserhalb der aktuellen Angriffsreichweite.`);
    }
  }

  private rufeWiederherstellungAuf(name: 'use_hp' | 'use_mp'): unknown {
    const direkt = Reflect.get(this.spielFenster, name);
    if (typeof direkt === 'function') return Reflect.apply(direkt, this.spielFenster, []);
    const gemeinsam = Reflect.get(this.spielFenster, 'use_hp_or_mp');
    if (typeof gemeinsam === 'function') return Reflect.apply(gemeinsam, this.spielFenster, []);
    throw new Error(`Adventure-Land-Funktion ${name} beziehungsweise use_hp_or_mp ist nicht verfuegbar.`);
  }

  private rufeSpielFunktionAuf(name: 'move' | 'attack' | 'loot', argumente: readonly unknown[]): unknown {
    const funktion = Reflect.get(this.spielFenster, name);
    if (typeof funktion !== 'function') throw new Error(`Adventure-Land-Funktion ${name} ist nicht verfuegbar.`);
    return Reflect.apply(funktion, this.spielFenster, [...argumente]);
  }

  private holeEntity(zielKennung: string): object | null {
    const entities = Reflect.get(this.spielFenster, 'entities');
    if (!istObjekt(entities)) return null;
    const direkt = entities[zielKennung];
    if (typeof direkt === 'object' && direkt !== null) return direkt;
    for (const entity of Object.values(entities)) {
      if (!istObjekt(entity)) continue;
      if (String(entity.id ?? '') === zielKennung) return entity;
    }
    return null;
  }
}
