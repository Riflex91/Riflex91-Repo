import type {
  BegrenzungsRegeln,
  DienstVerbrauchsEintrag,
  LeistungsCharakterZusammenfassung,
  LeistungsZusammenfassung,
  LeistungsZaehlerEintrag,
  LaufzeitAbschnitt,
  SchluesselWertSpeicher,
  TelemetrieAblage,
  TelemetrieDauerzustand,
  VorfallPaket,
  WiederholungsSegment
} from '../vertraege/telemetrie.js';

export interface TelemetrieSpeicherOptionen extends BegrenzungsRegeln {}

const STANDARD_OPTIONEN: TelemetrieSpeicherOptionen = Object.freeze({
  maxEintraege: 50_000,
  maxBytes: 4_000_000,
  maxAlterMillisekunden: 7 * 24 * 60 * 60 * 1000
});

interface Zeitbezug {
  readonly art: 'laufzeit' | 'leistung' | 'dienst' | 'segment' | 'vorfall';
  readonly index: number;
  readonly zeitpunkt: number;
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function pruefeNichtnegativeZahl(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function pruefeOptionen(optionen: TelemetrieSpeicherOptionen): void {
  for (const [name, wert] of [
    ['maxEintraege', optionen.maxEintraege],
    ['maxBytes', optionen.maxBytes],
    ['maxAlterMillisekunden', optionen.maxAlterMillisekunden]
  ] as const) {
    if (!Number.isSafeInteger(wert) || wert <= 0) throw new Error(`${name} muss eine positive ganze Zahl sein.`);
  }
}

function laufzeitZeitpunkt(abschnitt: LaufzeitAbschnitt): number {
  return abschnitt.ende;
}

function zaehlerZeitpunkt(eintrag: LeistungsZaehlerEintrag): number {
  return eintrag.zeitpunkt;
}

function dienstZeitpunkt(eintrag: DienstVerbrauchsEintrag): number {
  return eintrag.zeitpunkt;
}

function segmentZeitpunkt(eintrag: WiederholungsSegment): number {
  return eintrag.zeitraumEnde;
}

function kopiereZustand(zustand: TelemetrieDauerzustand): TelemetrieDauerzustand {
  return Object.freeze({
    schemaVersion: 1,
    gespeichertAm: zustand.gespeichertAm,
    laufzeitAbschnitte: Object.freeze(zustand.laufzeitAbschnitte.map((eintrag) => Object.freeze({ ...eintrag }))),
    leistungsZaehler: Object.freeze(zustand.leistungsZaehler.map((eintrag) => Object.freeze({ ...eintrag }))),
    dienstVerbrauch: Object.freeze(zustand.dienstVerbrauch.map((eintrag) => Object.freeze({ ...eintrag }))),
    wiederholungsSegmente: Object.freeze(zustand.wiederholungsSegmente.map((eintrag) => Object.freeze({ ...eintrag }))),
    vorfallPakete: Object.freeze(zustand.vorfallPakete.map((eintrag) => Object.freeze({ ...eintrag, ereignisseVorher: Object.freeze([...eintrag.ereignisseVorher]), ereignisseNachher: Object.freeze([...eintrag.ereignisseNachher]) })))
  });
}

export class SchluesselWertTelemetrieAblage implements TelemetrieAblage {
  constructor(
    private readonly speicher: SchluesselWertSpeicher,
    private readonly schluessel = 'aio-v4-telemetrie'
  ) {
    if (this.schluessel.trim().length === 0) throw new Error('Der Telemetrie-Schluessel darf nicht leer sein.');
  }

  lese(): string | null {
    return this.speicher.getItem(this.schluessel);
  }

  schreibe(inhalt: string): void {
    this.speicher.setItem(this.schluessel, inhalt);
  }
}

export class TelemetrieSpeicher {
  private laufzeitAbschnitte: LaufzeitAbschnitt[] = [];
  private leistungsZaehler: LeistungsZaehlerEintrag[] = [];
  private dienstVerbrauch: DienstVerbrauchsEintrag[] = [];
  private wiederholungsSegmente: WiederholungsSegment[] = [];
  private vorfallPakete: VorfallPaket[] = [];
  private readonly bekannteKennungen = new Set<string>();
  private gespeichertAm = 0;
  private readonly optionen: TelemetrieSpeicherOptionen;

  constructor(
    private readonly ablage: TelemetrieAblage,
    optionen: Partial<TelemetrieSpeicherOptionen> = {}
  ) {
    this.optionen = { ...STANDARD_OPTIONEN, ...optionen };
    pruefeOptionen(this.optionen);
    const vorhanden = this.ablage.lese();
    if (vorhanden !== null) this.lade(vorhanden);
  }

  erfasseLaufzeitAbschnitt(abschnitt: LaufzeitAbschnitt, gespeichertAm: number): boolean {
    pruefeZeitpunkt('start', abschnitt.start);
    pruefeZeitpunkt('ende', abschnitt.ende);
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    if (abschnitt.ende <= abschnitt.start) throw new Error('Ein LaufzeitAbschnitt muss nach seinem Start enden.');
    this.pruefeKennung(abschnitt.kennung);
    if (this.bekannteKennungen.has(abschnitt.kennung)) return false;
    this.laufzeitAbschnitte.push(Object.freeze({ ...abschnitt }));
    this.bekannteKennungen.add(abschnitt.kennung);
    this.persistiere(gespeichertAm);
    return this.bekannteKennungen.has(abschnitt.kennung);
  }

  erfasseLeistungsZaehler(eintrag: LeistungsZaehlerEintrag, gespeichertAm: number): boolean {
    pruefeZeitpunkt('zeitpunkt', eintrag.zeitpunkt);
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    this.pruefeKennung(eintrag.kennung);
    for (const [name, wert] of [
      ['erfahrungGewonnen', eintrag.erfahrungGewonnen],
      ['goldGewonnen', eintrag.goldGewonnen],
      ['tode', eintrag.tode],
      ['rueckzuege', eintrag.rueckzuege],
      ['verbindungsAbbrueche', eintrag.verbindungsAbbrueche],
      ['neustarts', eintrag.neustarts],
      ['automatischBehoben', eintrag.automatischBehoben],
      ['ungefangeneFehler', eintrag.ungefangeneFehler]
    ] as const) pruefeNichtnegativeZahl(name, wert);
    if (this.bekannteKennungen.has(eintrag.kennung)) return false;
    this.leistungsZaehler.push(Object.freeze({ ...eintrag }));
    this.bekannteKennungen.add(eintrag.kennung);
    this.persistiere(gespeichertAm);
    return this.bekannteKennungen.has(eintrag.kennung);
  }

  erfasseDienstVerbrauch(eintrag: DienstVerbrauchsEintrag, gespeichertAm: number): boolean {
    pruefeZeitpunkt('zeitpunkt', eintrag.zeitpunkt);
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    this.pruefeKennung(eintrag.kennung);
    pruefeNichtnegativeZahl('lokalReserviert', eintrag.lokalReserviert);
    pruefeNichtnegativeZahl('vomAnbieterGemeldet', eintrag.vomAnbieterGemeldet);
    if (this.bekannteKennungen.has(eintrag.kennung)) return false;
    this.dienstVerbrauch.push(Object.freeze({ ...eintrag }));
    this.bekannteKennungen.add(eintrag.kennung);
    this.persistiere(gespeichertAm);
    return this.bekannteKennungen.has(eintrag.kennung);
  }

  erfasseWiederholungsSegment(eintrag: WiederholungsSegment, gespeichertAm: number): boolean {
    pruefeZeitpunkt('zeitraumStart', eintrag.zeitraumStart);
    pruefeZeitpunkt('zeitraumEnde', eintrag.zeitraumEnde);
    pruefeZeitpunkt('erstelltAm', eintrag.erstelltAm);
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    if (eintrag.zeitraumEnde < eintrag.zeitraumStart) throw new Error('Ein Segment darf nicht vor seinem Beginn enden.');
    if (!/^[a-f0-9]{64}$/.test(eintrag.sha256)) throw new Error('Ein WiederholungsSegment benoetigt einen gueltigen SHA-256-Wert.');
    this.pruefeKennung(eintrag.segmentKennung);
    if (this.bekannteKennungen.has(eintrag.segmentKennung)) return false;
    this.wiederholungsSegmente.push(Object.freeze({ ...eintrag }));
    this.bekannteKennungen.add(eintrag.segmentKennung);
    this.gespeichertAm = gespeichertAm;
    this.bereinige(gespeichertAm);
    if (this.ueberschreitetKapazitaet()) {
      this.wiederholungsSegmente = this.wiederholungsSegmente.filter((segment) => segment.segmentKennung !== eintrag.segmentKennung);
      this.baueKennungenNeu();
      this.ablage.schreibe(this.serialisiere());
      return false;
    }
    this.ablage.schreibe(this.serialisiere());
    return true;
  }

  erfasseVorfallPaket(eintrag: VorfallPaket, gespeichertAm: number): boolean {
    pruefeZeitpunkt('abgeschlossenAm', eintrag.abgeschlossenAm);
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    this.pruefeKennung(eintrag.paketKennung);
    if (this.bekannteKennungen.has(eintrag.paketKennung)) return false;
    this.vorfallPakete.push(Object.freeze({ ...eintrag, ereignisseVorher: Object.freeze([...eintrag.ereignisseVorher]), ereignisseNachher: Object.freeze([...eintrag.ereignisseNachher]) }));
    this.bekannteKennungen.add(eintrag.paketKennung);
    this.gespeichertAm = gespeichertAm;
    this.bereinige(gespeichertAm);
    if (this.ueberschreitetKapazitaet()) {
      this.vorfallPakete = this.vorfallPakete.filter((paket) => paket.paketKennung !== eintrag.paketKennung);
      this.baueKennungenNeu();
      this.ablage.schreibe(this.serialisiere());
      return false;
    }
    this.ablage.schreibe(this.serialisiere());
    return true;
  }

  entferneWiederholungsSegmentNachArchivierung(segmentKennung: string, gespeichertAm: number): boolean {
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    const vorher = this.wiederholungsSegmente.length;
    this.wiederholungsSegmente = this.wiederholungsSegmente.filter((segment) => segment.segmentKennung !== segmentKennung);
    if (this.wiederholungsSegmente.length === vorher) return false;
    this.gespeichertAm = gespeichertAm;
    this.baueKennungenNeu();
    this.ablage.schreibe(this.serialisiere());
    return true;
  }

  entferneVorfallPaketNachArchivierung(paketKennung: string, gespeichertAm: number): boolean {
    pruefeZeitpunkt('gespeichertAm', gespeichertAm);
    const vorher = this.vorfallPakete.length;
    this.vorfallPakete = this.vorfallPakete.filter((paket) => paket.paketKennung !== paketKennung);
    if (this.vorfallPakete.length === vorher) return false;
    this.gespeichertAm = gespeichertAm;
    this.baueKennungenNeu();
    this.ablage.schreibe(this.serialisiere());
    return true;
  }

  fasseLeistungZusammen(zeitraumStart: number, zeitraumEnde: number): LeistungsZusammenfassung {
    pruefeZeitpunkt('zeitraumStart', zeitraumStart);
    pruefeZeitpunkt('zeitraumEnde', zeitraumEnde);
    if (zeitraumEnde <= zeitraumStart) throw new Error('Der Auswertungszeitraum muss eine positive Dauer besitzen.');

    const globaleLaufzeit = this.berechneVereinigteLaufzeit(
      this.laufzeitAbschnitte.filter((abschnitt) => abschnitt.charakterName === undefined),
      zeitraumStart,
      zeitraumEnde
    );
    const zaehler = this.leistungsZaehler.filter((eintrag) => eintrag.zeitpunkt >= zeitraumStart && eintrag.zeitpunkt < zeitraumEnde);
    const charakterNamen = new Set<string>();
    for (const abschnitt of this.laufzeitAbschnitte) if (abschnitt.charakterName !== undefined) charakterNamen.add(abschnitt.charakterName);
    for (const eintrag of zaehler) if (eintrag.charakterName !== undefined) charakterNamen.add(eintrag.charakterName);

    const charaktere: LeistungsCharakterZusammenfassung[] = [...charakterNamen].sort().map((charakterName) => {
      const laufzeitMillisekunden = this.berechneVereinigteLaufzeit(
        this.laufzeitAbschnitte.filter((abschnitt) => abschnitt.charakterName === charakterName),
        zeitraumStart,
        zeitraumEnde
      );
      const passendeZaehler = zaehler.filter((eintrag) => eintrag.charakterName === charakterName);
      const erfahrungGewonnen = passendeZaehler.reduce((summe, eintrag) => summe + eintrag.erfahrungGewonnen, 0);
      const goldGewonnen = passendeZaehler.reduce((summe, eintrag) => summe + eintrag.goldGewonnen, 0);
      return Object.freeze({
        charakterName,
        laufzeitMillisekunden,
        erfahrungGewonnen,
        goldGewonnen,
        erfahrungProStunde: laufzeitMillisekunden > 0 ? erfahrungGewonnen / (laufzeitMillisekunden / 3_600_000) : null,
        goldProStunde: laufzeitMillisekunden > 0 ? goldGewonnen / (laufzeitMillisekunden / 3_600_000) : null,
        tode: passendeZaehler.reduce((summe, eintrag) => summe + eintrag.tode, 0),
        rueckzuege: passendeZaehler.reduce((summe, eintrag) => summe + eintrag.rueckzuege, 0)
      });
    });

    const relevanteZeiten: number[] = [];
    for (const abschnitt of this.laufzeitAbschnitte) {
      if (abschnitt.ende > zeitraumStart && abschnitt.start < zeitraumEnde) {
        relevanteZeiten.push(Math.max(abschnitt.start, zeitraumStart), Math.min(abschnitt.ende, zeitraumEnde));
      }
    }
    for (const eintrag of zaehler) relevanteZeiten.push(eintrag.zeitpunkt);

    return Object.freeze({
      zeitraumStart,
      zeitraumEnde,
      vollstaendig: globaleLaufzeit === zeitraumEnde - zeitraumStart,
      datenVon: relevanteZeiten.length > 0 ? Math.min(...relevanteZeiten) : null,
      datenBis: relevanteZeiten.length > 0 ? Math.max(...relevanteZeiten) : null,
      gesamt: Object.freeze({
        laufzeitMillisekunden: globaleLaufzeit,
        verbindungsAbbrueche: zaehler.reduce((summe, eintrag) => summe + eintrag.verbindungsAbbrueche, 0),
        automatischBehoben: zaehler.reduce((summe, eintrag) => summe + eintrag.automatischBehoben, 0),
        ungefangeneFehler: zaehler.reduce((summe, eintrag) => summe + eintrag.ungefangeneFehler, 0),
        neustarts: zaehler.reduce((summe, eintrag) => summe + eintrag.neustarts, 0)
      }),
      charaktere: Object.freeze(charaktere)
    });
  }

  listeDienstVerbrauch(zeitraumStart: number, zeitraumEnde: number): readonly DienstVerbrauchsEintrag[] {
    pruefeZeitpunkt('zeitraumStart', zeitraumStart);
    pruefeZeitpunkt('zeitraumEnde', zeitraumEnde);
    return Object.freeze(this.dienstVerbrauch.filter((eintrag) => eintrag.zeitpunkt >= zeitraumStart && eintrag.zeitpunkt < zeitraumEnde));
  }

  listeWiederholungsSegmente(): readonly WiederholungsSegment[] {
    return Object.freeze([...this.wiederholungsSegmente]);
  }

  listeVorfallPakete(): readonly VorfallPaket[] {
    return Object.freeze([...this.vorfallPakete]);
  }

  holeDauerzustand(): TelemetrieDauerzustand {
    return kopiereZustand({
      schemaVersion: 1,
      gespeichertAm: this.gespeichertAm,
      laufzeitAbschnitte: this.laufzeitAbschnitte,
      leistungsZaehler: this.leistungsZaehler,
      dienstVerbrauch: this.dienstVerbrauch,
      wiederholungsSegmente: this.wiederholungsSegmente,
      vorfallPakete: this.vorfallPakete
    });
  }

  serialisiere(): string {
    return JSON.stringify(this.holeDauerzustand());
  }

  private lade(serialisiert: string): void {
    let roh: unknown;
    try {
      roh = JSON.parse(serialisiert);
    } catch (ursache: unknown) {
      throw new Error(`Telemetrie-Dauerzustand ist kein gueltiges JSON: ${String(ursache)}`);
    }
    if (!this.istDauerzustand(roh)) throw new Error('Telemetrie-Dauerzustand hat ein ungueltiges Format oder eine unbekannte SchemaVersion.');
    this.gespeichertAm = roh.gespeichertAm;
    this.laufzeitAbschnitte = roh.laufzeitAbschnitte.map((eintrag) => Object.freeze({ ...eintrag }));
    this.leistungsZaehler = roh.leistungsZaehler.map((eintrag) => Object.freeze({ ...eintrag }));
    this.dienstVerbrauch = roh.dienstVerbrauch.map((eintrag) => Object.freeze({ ...eintrag }));
    this.wiederholungsSegmente = roh.wiederholungsSegmente.map((eintrag) => Object.freeze({ ...eintrag }));
    this.vorfallPakete = roh.vorfallPakete.map((eintrag) => Object.freeze({ ...eintrag, ereignisseVorher: Object.freeze([...eintrag.ereignisseVorher]), ereignisseNachher: Object.freeze([...eintrag.ereignisseNachher]) }));
    this.baueKennungenNeu();
    this.bereinige(this.gespeichertAm);
  }

  private persistiere(gespeichertAm: number): void {
    this.gespeichertAm = gespeichertAm;
    this.bereinige(gespeichertAm);
    this.ablage.schreibe(this.serialisiere());
  }

  private bereinige(jetzt: number): void {
    const grenze = jetzt - this.optionen.maxAlterMillisekunden;
    this.laufzeitAbschnitte = this.laufzeitAbschnitte.filter((eintrag) => laufzeitZeitpunkt(eintrag) >= grenze);
    this.leistungsZaehler = this.leistungsZaehler.filter((eintrag) => zaehlerZeitpunkt(eintrag) >= grenze);
    this.dienstVerbrauch = this.dienstVerbrauch.filter((eintrag) => dienstZeitpunkt(eintrag) >= grenze);
    while (this.ueberschreitetKapazitaet()) {
      if (!this.entferneAeltestenNormalenEintrag()) break;
    }
    this.baueKennungenNeu();
  }

  private entferneAeltestenNormalenEintrag(): boolean {
    const bezuege: Zeitbezug[] = [];
    this.laufzeitAbschnitte.forEach((eintrag, index) => bezuege.push({ art: 'laufzeit', index, zeitpunkt: laufzeitZeitpunkt(eintrag) }));
    this.leistungsZaehler.forEach((eintrag, index) => bezuege.push({ art: 'leistung', index, zeitpunkt: zaehlerZeitpunkt(eintrag) }));
    this.dienstVerbrauch.forEach((eintrag, index) => bezuege.push({ art: 'dienst', index, zeitpunkt: dienstZeitpunkt(eintrag) }));
    bezuege.sort((a, b) => a.zeitpunkt - b.zeitpunkt || a.art.localeCompare(b.art) || a.index - b.index);
    const aeltester = bezuege[0];
    if (!aeltester) return false;
    if (aeltester.art === 'laufzeit') this.laufzeitAbschnitte.splice(aeltester.index, 1);
    if (aeltester.art === 'leistung') this.leistungsZaehler.splice(aeltester.index, 1);
    if (aeltester.art === 'dienst') this.dienstVerbrauch.splice(aeltester.index, 1);
    return true;
  }

  private ueberschreitetKapazitaet(): boolean {
    return this.gesamtEintraege() > this.optionen.maxEintraege || this.serialisierteGroesse() > this.optionen.maxBytes;
  }

  private berechneVereinigteLaufzeit(abschnitte: readonly LaufzeitAbschnitt[], start: number, ende: number): number {
    const intervalle = abschnitte
      .filter((abschnitt) => abschnitt.ende > start && abschnitt.start < ende)
      .map((abschnitt) => [Math.max(abschnitt.start, start), Math.min(abschnitt.ende, ende)] as const)
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (intervalle.length === 0) return 0;
    let summe = 0;
    let aktuellerStart = intervalle[0]?.[0] ?? 0;
    let aktuellesEnde = intervalle[0]?.[1] ?? 0;
    for (const intervall of intervalle.slice(1)) {
      if (intervall[0] <= aktuellesEnde) {
        aktuellesEnde = Math.max(aktuellesEnde, intervall[1]);
      } else {
        summe += aktuellesEnde - aktuellerStart;
        aktuellerStart = intervall[0];
        aktuellesEnde = intervall[1];
      }
    }
    return summe + aktuellesEnde - aktuellerStart;
  }

  private serialisierteGroesse(): number {
    return new TextEncoder().encode(JSON.stringify({
      schemaVersion: 1,
      gespeichertAm: this.gespeichertAm,
      laufzeitAbschnitte: this.laufzeitAbschnitte,
      leistungsZaehler: this.leistungsZaehler,
      dienstVerbrauch: this.dienstVerbrauch,
      wiederholungsSegmente: this.wiederholungsSegmente,
      vorfallPakete: this.vorfallPakete
    })).byteLength;
  }

  private gesamtEintraege(): number {
    return this.laufzeitAbschnitte.length + this.leistungsZaehler.length + this.dienstVerbrauch.length + this.wiederholungsSegmente.length + this.vorfallPakete.length;
  }

  private pruefeKennung(kennung: string): void {
    if (kennung.trim().length === 0) throw new Error('Telemetrie-Kennungen duerfen nicht leer sein.');
  }

  private baueKennungenNeu(): void {
    this.bekannteKennungen.clear();
    for (const eintrag of this.laufzeitAbschnitte) this.bekannteKennungen.add(eintrag.kennung);
    for (const eintrag of this.leistungsZaehler) this.bekannteKennungen.add(eintrag.kennung);
    for (const eintrag of this.dienstVerbrauch) this.bekannteKennungen.add(eintrag.kennung);
    for (const eintrag of this.wiederholungsSegmente) this.bekannteKennungen.add(eintrag.segmentKennung);
    for (const eintrag of this.vorfallPakete) this.bekannteKennungen.add(eintrag.paketKennung);
  }

  private istDauerzustand(wert: unknown): wert is TelemetrieDauerzustand {
    if (typeof wert !== 'object' || wert === null) return false;
    const objekt = wert as Record<string, unknown>;
    return objekt.schemaVersion === 1 &&
      typeof objekt.gespeichertAm === 'number' &&
      Array.isArray(objekt.laufzeitAbschnitte) &&
      Array.isArray(objekt.leistungsZaehler) &&
      Array.isArray(objekt.dienstVerbrauch) &&
      Array.isArray(objekt.wiederholungsSegmente) &&
      Array.isArray(objekt.vorfallPakete);
  }
}
