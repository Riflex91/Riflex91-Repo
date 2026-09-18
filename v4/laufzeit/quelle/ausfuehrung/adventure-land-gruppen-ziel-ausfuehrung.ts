import { AdventureLandKampfBereitschaftLesezugriff } from '../adventure-land/adventure-land-kampf-bereitschaft.js';
import { AktionsSteuerung } from '../kern/aktions-steuerung.js';
import type { AktionsSteuerungsSchritt } from '../vertraege/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN, type GruppenAktionsAnfrageDetails } from '../vertraege/gruppen-aktionsanfrage.js';
import type { KampfSicherheitsEntscheidung } from '../vertraege/kampfsicherheit.js';

const STANDARD_SICHERHEITS_MAXIMAL_ALTER_MILLISEKUNDEN = 1_500;

export interface AdventureLandGruppenZielAusfuehrungOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly sicherheitsMaximalAlterMillisekunden?: number;
}

export interface AdventureLandGruppenZielAusfuehrungsErgebnis {
  readonly aktionsKennung: string;
  readonly aktionsName: string;
  readonly zielKennung: string;
  readonly sicherheitsZeitpunkt: number;
  readonly beendetAm: number;
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function pruefeZeitpunkt(name: string, zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
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

function objektOderNull(wert: unknown): object | null {
  return (typeof wert === 'object' && wert !== null) || typeof wert === 'function' ? wert as object : null;
}

function liesWert(kontext: object, name: string): unknown {
  try { return Reflect.get(kontext, name); } catch { return undefined; }
}

function kontexte(spielFenster: object): readonly object[] {
  const werte: object[] = [spielFenster];
  const parent = objektOderNull(liesWert(spielFenster, 'parent'));
  if (parent && parent !== spielFenster) werte.push(parent);
  return Object.freeze(werte);
}

export class AdventureLandGruppenZielAusfuehrung {
  private readonly aktivFreigegeben: boolean;
  private readonly sicherheitsMaximalAlterMillisekunden: number;

  public constructor(
    private readonly spielFenster: object,
    optionen: AdventureLandGruppenZielAusfuehrungOptionen = {}
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.sicherheitsMaximalAlterMillisekunden = optionen.sicherheitsMaximalAlterMillisekunden ?? STANDARD_SICHERHEITS_MAXIMAL_ALTER_MILLISEKUNDEN;
    if (!Number.isFinite(this.sicherheitsMaximalAlterMillisekunden) || this.sicherheitsMaximalAlterMillisekunden <= 0) {
      throw new Error('sicherheitsMaximalAlterMillisekunden muss eine positive endliche Zahl sein.');
    }
  }

  public async fuehreFreigegebeneGruppenZielAktionAus(
    schritt: AktionsSteuerungsSchritt,
    steuerung: AktionsSteuerung,
    sicherheit: KampfSicherheitsEntscheidung,
    zeitQuelle: () => number
  ): Promise<Readonly<AdventureLandGruppenZielAusfuehrungsErgebnis>> {
    if (!this.aktivFreigegeben) {
      throw new Error('Aktive Adventure-Land-Gruppenzielausfuehrung ist nicht ausdruecklich freigegeben.');
    }
    if (schritt.art !== 'gestartet' || schritt.gestarteteAnfrage === null) {
      throw new Error('Nur eine von der zentralen AktionsSteuerung gestartete Gruppenanfrage darf aktiv ausgefuehrt werden.');
    }

    const anfrage = schritt.gestarteteAnfrage;
    try {
      const jetzt = zeitQuelle();
      pruefeZeitpunkt('Der Gruppen-Ausfuehrungszeitpunkt', jetzt);
      if (jetzt < schritt.zeitpunkt) throw new Error('Der Gruppen-Ausfuehrungszeitpunkt darf nicht vor der zentralen Freigabe liegen.');

      const lauf = steuerung.holeAktionsZustand(anfrage.kennung);
      if (!lauf || lauf.phase !== 'laeuft' || lauf.anfrage.kennung !== anfrage.kennung) {
        throw new Error('Die zentrale AktionsSteuerung bestaetigt die Gruppenaktion nicht mehr als laufend.');
      }
      if (anfrage.angefordertVon !== 'gruppen-aktionsplanung') {
        throw new Error('Nur Gruppenanfragen aus gruppen-aktionsplanung duerfen diese Ausfuehrungsgrenze erreichen.');
      }
      if (anfrage.aktion !== GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten) {
        throw new Error(`Nicht freigegebene Gruppenaktion: ${anfrage.aktion}.`);
      }

      const details = this.pruefeDetails(anfrage.details);
      this.pruefeRessourcen(anfrage.kennung, anfrage.benoetigteRessourcen, steuerung);
      this.pruefeSicherheit(sicherheit, details.planZeitpunkt, jetzt);
      this.pruefeAngriffsBereitschaft(jetzt);
      const ziel = this.holeUndPruefeZiel(details.zielKennung);
      this.pruefeAktuelleAngriffsReichweite(details.zielKennung, ziel);

      const attack = this.findeFunktion('attack');
      if (!attack) throw new Error('Adventure-Land-Funktion attack ist nicht verfuegbar.');
      await Promise.resolve(Reflect.apply(attack.funktion, attack.kontext, [ziel]));

      const beendetAm = zeitQuelle();
      pruefeZeitpunkt('Der Gruppen-Abschlusszeitpunkt', beendetAm);
      if (beendetAm < jetzt) throw new Error('Der Gruppen-Abschlusszeitpunkt darf nicht vor dem Ausfuehrungszeitpunkt liegen.');
      if (steuerung.holeAktionsZustand(anfrage.kennung)?.phase === 'laeuft') {
        steuerung.schliesseAktionAb(anfrage.kennung, beendetAm, 'Freigegebene Adventure-Land-Gruppenzielaktion abgeschlossen.');
      }
      return Object.freeze({
        aktionsKennung: anfrage.kennung,
        aktionsName: anfrage.aktion,
        zielKennung: details.zielKennung,
        sicherheitsZeitpunkt: sicherheit.zeitpunkt,
        beendetAm
      });
    } catch (fehler) {
      const beendetAm = zeitQuelle();
      pruefeZeitpunkt('Der Gruppen-Abbruchzeitpunkt', beendetAm);
      if (steuerung.holeAktionsZustand(anfrage.kennung)?.phase === 'laeuft') {
        steuerung.brecheAktionAb(anfrage.kennung, beendetAm, `Adventure-Land-Gruppenzielaktion fehlgeschlagen: ${fehlerText(fehler)}`);
      }
      throw fehler;
    }
  }

  private pruefeDetails(details: unknown): GruppenAktionsAnfrageDetails & { readonly zielKennung: string } {
    if (!istObjekt(details)) throw new Error('Gruppenzielaktion benoetigt strukturierte Gruppenaktionsdetails.');
    if (details.planStatus !== 'geplant' || details.art !== 'gemeinsames_ziel_bearbeiten' || details.faehigkeit !== 'schaden' ||
        details.zielArt !== 'gegner' || typeof details.zielKennung !== 'string' || details.zielKennung.trim().length === 0 ||
        typeof details.planZeitpunkt !== 'number' || !Number.isFinite(details.planZeitpunkt) || details.planZeitpunkt < 0) {
      throw new Error('Gruppenzielaktion besitzt keine gueltigen geplanten Schadens-Zieldetails.');
    }
    return details as unknown as GruppenAktionsAnfrageDetails & { readonly zielKennung: string };
  }

  private pruefeRessourcen(
    aktionsKennung: string,
    benoetigteRessourcen: readonly string[],
    steuerung: AktionsSteuerung
  ): void {
    const ressourcen = [...new Set(benoetigteRessourcen)].sort();
    if (ressourcen.length !== 2 || ressourcen[0] !== 'gruppe' || ressourcen[1] !== 'kampfziel') {
      throw new Error('GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN benoetigt exakt die Ressourcen gruppe und kampfziel.');
    }
    const sperren = steuerung.listeRessourcenSperren();
    for (const ressource of ressourcen) {
      if (sperren.find((sperre) => sperre.ressource === ressource)?.besitzer !== aktionsKennung) {
        throw new Error(`Die Gruppenaktion besitzt die Ressource ${ressource} nicht mehr.`);
      }
    }
  }

  private pruefeSicherheit(sicherheit: KampfSicherheitsEntscheidung, planZeitpunkt: number, jetzt: number): void {
    if (sicherheit.schemaVersion !== 1) throw new Error('Unbekannte Kampfsicherheitsentscheidung.');
    pruefeZeitpunkt('Der Kampfsicherheitszeitpunkt', sicherheit.zeitpunkt);
    if (sicherheit.zeitpunkt > jetzt) throw new Error('Die Kampfsicherheitsentscheidung liegt unzulaessig in der Zukunft.');
    if (sicherheit.zeitpunkt < planZeitpunkt) throw new Error('Die Kampfsicherheitsentscheidung ist aelter als der Gruppenplan.');
    if (jetzt - sicherheit.zeitpunkt > this.sicherheitsMaximalAlterMillisekunden) {
      throw new Error('Die Kampfsicherheitsentscheidung ist fuer die Gruppenzielausfuehrung zu alt.');
    }
    if (sicherheit.normalAktionenErlaubt !== true || sicherheit.art !== 'keine' || sicherheit.gefahrenBewertung.stufe !== 'sicher') {
      throw new Error('Die aktuelle Kampfsicherheit gibt keine normale Gruppenzielaktion frei.');
    }
  }

  private pruefeAngriffsBereitschaft(jetzt: number): void {
    const bereitschaft = new AdventureLandKampfBereitschaftLesezugriff(this.spielFenster).liesNormalenAngriff(jetzt);
    if (bereitschaft.zustand !== 'bereit') {
      throw new Error(`Der normale Angriff ist nicht explizit bereit: ${bereitschaft.zustand}. ${bereitschaft.grund}`);
    }
  }

  private holeUndPruefeZiel(zielKennung: string): Readonly<Record<string, unknown>> {
    const entities = this.findeObjekt('entities');
    if (!entities) throw new Error('Adventure-Land-Entities sind fuer die Gruppenzielausfuehrung nicht verfuegbar.');
    let ziel = entities[zielKennung];
    if (!istObjekt(ziel)) {
      ziel = Object.values(entities).find((entity) => istObjekt(entity) && String(entity.id ?? '') === zielKennung);
    }
    if (!istObjekt(ziel)) throw new Error(`Gruppenziel ${zielKennung} ist bei der Ausfuehrung nicht mehr sichtbar.`);
    const hp = ersteEndlicheZahl(ziel, ['hp']);
    if (hp === null || hp <= 0 || ziel.dead === true || ziel.rip === true) {
      throw new Error(`Gruppenziel ${zielKennung} ist nicht bestaetigt lebendig.`);
    }
    return ziel;
  }

  private pruefeAktuelleAngriffsReichweite(zielKennung: string, ziel: Readonly<Record<string, unknown>>): void {
    const charakterWert = this.findeObjekt('character');
    if (!charakterWert) throw new Error(`Aktuelle Angriffsreichweite fuer Gruppenziel ${zielKennung} kann nicht sicher geprueft werden.`);
    const charakterHp = ersteEndlicheZahl(charakterWert, ['hp']);
    if (charakterHp === null || charakterHp <= 0 || charakterWert.rip === true) {
      throw new Error('Der lokale Charakter ist nicht bestaetigt lebendig.');
    }
    const charakterX = ersteEndlicheZahl(charakterWert, ['real_x', 'x']);
    const charakterY = ersteEndlicheZahl(charakterWert, ['real_y', 'y']);
    const zielX = ersteEndlicheZahl(ziel, ['real_x', 'x']);
    const zielY = ersteEndlicheZahl(ziel, ['real_y', 'y']);
    const reichweite = ersteEndlicheZahl(charakterWert, ['range']);
    if (charakterX === null || charakterY === null || zielX === null || zielY === null || reichweite === null || reichweite < 0) {
      throw new Error(`Aktuelle Angriffsreichweite fuer Gruppenziel ${zielKennung} kann nicht sicher geprueft werden.`);
    }
    const charakterKarte = charakterWert.map;
    const zielKarte = ziel.map;
    if (typeof charakterKarte === 'string' && typeof zielKarte === 'string' && charakterKarte !== zielKarte) {
      throw new Error(`Gruppenziel ${zielKennung} befindet sich nicht auf derselben Karte.`);
    }
    if (Math.hypot(zielX - charakterX, zielY - charakterY) > reichweite) {
      throw new Error(`Gruppenziel ${zielKennung} ist bei der Ausfuehrung ausserhalb der aktuellen Angriffsreichweite.`);
    }
  }

  private findeObjekt(name: string): Record<string, unknown> | null {
    for (const kontext of kontexte(this.spielFenster)) {
      const wert = liesWert(kontext, name);
      if (typeof wert === 'object' && wert !== null && !Array.isArray(wert)) return wert as Record<string, unknown>;
    }
    return null;
  }

  private findeFunktion(name: string): Readonly<{ funktion: (...argumente: unknown[]) => unknown; kontext: object }> | null {
    for (const kontext of kontexte(this.spielFenster)) {
      const funktion = liesWert(kontext, name);
      if (typeof funktion === 'function') return Object.freeze({ funktion: funktion as (...argumente: unknown[]) => unknown, kontext });
    }
    return null;
  }
}
