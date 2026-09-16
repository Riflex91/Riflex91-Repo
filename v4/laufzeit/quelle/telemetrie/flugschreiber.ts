import type { BotEreignis } from '../vertraege/bot-ereignis.js';
import type { BegrenzungsRegeln, WiederholungsSegment } from '../vertraege/telemetrie.js';
import { BegrenzterRingpuffer } from './begrenzter-ringpuffer.js';
import { berechneSha256 } from './sha256.js';

export interface FlugschreiberOptionen {
  readonly sitzungKennung: string;
  readonly ringpuffer: BegrenzungsRegeln;
  readonly segmentMaxEintraege: number;
  readonly segmentMaxBytes: number;
  readonly segmentMaxAlterMillisekunden: number;
}

export interface FlugschreiberErgebnis {
  readonly aufgenommen: boolean;
  readonly imRingpuffer: boolean;
  readonly grund: string | null;
  readonly abgeschlosseneSegmente: readonly WiederholungsSegment[];
}

interface OffenerSegmentEintrag {
  readonly ereignis: BotEreignis;
  readonly zeile: string;
  readonly bytes: number;
}

function positiveGanzzahl(name: string, wert: number): void {
  if (!Number.isSafeInteger(wert) || wert <= 0) throw new Error(`${name} muss eine positive ganze Zahl sein.`);
}

export class Flugschreiber {
  private readonly optionen: FlugschreiberOptionen;
  private readonly ringpuffer: BegrenzterRingpuffer<BotEreignis>;
  private readonly offenesSegment: OffenerSegmentEintrag[] = [];
  private offeneSegmentBytes = 0;
  private letzteSequenz = 0;

  constructor(optionen: FlugschreiberOptionen) {
    if (optionen.sitzungKennung.trim().length === 0) throw new Error('Die SitzungKennung darf nicht leer sein.');
    positiveGanzzahl('segmentMaxEintraege', optionen.segmentMaxEintraege);
    positiveGanzzahl('segmentMaxBytes', optionen.segmentMaxBytes);
    positiveGanzzahl('segmentMaxAlterMillisekunden', optionen.segmentMaxAlterMillisekunden);
    this.optionen = optionen;
    this.ringpuffer = new BegrenzterRingpuffer<BotEreignis>({
      ...optionen.ringpuffer,
      ermittleZeitpunkt: (ereignis) => ereignis.zeitpunkt
    });
  }

  zeichneAuf(ereignis: BotEreignis): FlugschreiberErgebnis {
    this.pruefeEreignis(ereignis);
    let serialisiert: string;
    try {
      serialisiert = JSON.stringify(ereignis);
    } catch (ursache: unknown) {
      return Object.freeze({
        aufgenommen: false,
        imRingpuffer: false,
        grund: `Ereignis ${ereignis.kennung} kann nicht als JSON aufgezeichnet werden: ${String(ursache)}`,
        abgeschlosseneSegmente: Object.freeze([])
      });
    }
    const zeile = `${serialisiert}\n`;
    const bytes = new TextEncoder().encode(zeile).byteLength;
    if (bytes > this.optionen.segmentMaxBytes) {
      return Object.freeze({
        aufgenommen: false,
        imRingpuffer: false,
        grund: `Ereignis ${ereignis.kennung} ist mit ${bytes} Bytes groesser als ein Wiederholungssegment.`,
        abgeschlosseneSegmente: Object.freeze([])
      });
    }

    const abgeschlosseneSegmente: WiederholungsSegment[] = [];
    const erstes = this.offenesSegment[0];
    const alter = erstes ? ereignis.zeitpunkt - erstes.ereignis.zeitpunkt : 0;
    const wuerdeGrenzeUeberschreiten = this.offenesSegment.length > 0 && (
      this.offenesSegment.length + 1 > this.optionen.segmentMaxEintraege ||
      this.offeneSegmentBytes + bytes > this.optionen.segmentMaxBytes ||
      alter > this.optionen.segmentMaxAlterMillisekunden
    );

    if (wuerdeGrenzeUeberschreiten) {
      const segment = this.schliesseOffenesSegment(ereignis.zeitpunkt);
      if (segment) abgeschlosseneSegmente.push(segment);
    }

    this.offenesSegment.push({ ereignis, zeile, bytes });
    this.offeneSegmentBytes += bytes;
    this.letzteSequenz = ereignis.laufendeNummer;
    const ringErgebnis = this.ringpuffer.fuegeHinzu(ereignis, ereignis.zeitpunkt);

    if (this.offenesSegment.length >= this.optionen.segmentMaxEintraege || this.offeneSegmentBytes >= this.optionen.segmentMaxBytes) {
      const segment = this.schliesseOffenesSegment(ereignis.zeitpunkt);
      if (segment) abgeschlosseneSegmente.push(segment);
    }

    return Object.freeze({
      aufgenommen: true,
      imRingpuffer: ringErgebnis.aufgenommen,
      grund: ringErgebnis.aufgenommen ? null : ringErgebnis.grund,
      abgeschlosseneSegmente: Object.freeze(abgeschlosseneSegmente)
    });
  }

  schliesseOffenesSegment(erstelltAm: number): WiederholungsSegment | null {
    this.pruefeZeitpunkt(erstelltAm);
    if (this.offenesSegment.length === 0) return null;
    const erstes = this.offenesSegment[0];
    const letztes = this.offenesSegment[this.offenesSegment.length - 1];
    if (!erstes || !letztes) return null;
    const inhalt = this.offenesSegment.map((eintrag) => eintrag.zeile).join('');
    const segment: WiederholungsSegment = Object.freeze({
      schemaVersion: 1,
      segmentKennung: `${this.optionen.sitzungKennung}:${erstes.ereignis.laufendeNummer}-${letztes.ereignis.laufendeNummer}`,
      sitzungKennung: this.optionen.sitzungKennung,
      erstelltAm,
      zeitraumStart: erstes.ereignis.zeitpunkt,
      zeitraumEnde: letztes.ereignis.zeitpunkt,
      sequenzStart: erstes.ereignis.laufendeNummer,
      sequenzEnde: letztes.ereignis.laufendeNummer,
      ereignisAnzahl: this.offenesSegment.length,
      groesseBytes: new TextEncoder().encode(inhalt).byteLength,
      sha256: berechneSha256(inhalt),
      inhalt
    });
    this.offenesSegment.splice(0, this.offenesSegment.length);
    this.offeneSegmentBytes = 0;
    return segment;
  }

  holeEreignisse(zeitraumStart: number, zeitraumEnde: number): readonly BotEreignis[] {
    this.pruefeZeitpunkt(zeitraumStart);
    this.pruefeZeitpunkt(zeitraumEnde);
    if (zeitraumEnde < zeitraumStart) throw new Error('Der ZeitraumEnde darf nicht vor ZeitraumStart liegen.');
    return Object.freeze(this.ringpuffer.liste().filter((ereignis) => ereignis.zeitpunkt >= zeitraumStart && ereignis.zeitpunkt <= zeitraumEnde));
  }

  listeRingpuffer(): readonly BotEreignis[] {
    return this.ringpuffer.liste();
  }

  ringpufferGroesseBytes(): number {
    return this.ringpuffer.groesseBytes();
  }

  offenesSegmentAnzahl(): number {
    return this.offenesSegment.length;
  }

  private pruefeEreignis(ereignis: BotEreignis): void {
    if (!Number.isSafeInteger(ereignis.laufendeNummer) || ereignis.laufendeNummer <= this.letzteSequenz) {
      throw new Error(`Die Flugschreiber-Sequenz muss steigen: ${ereignis.laufendeNummer} ist nicht groesser als ${this.letzteSequenz}.`);
    }
    this.pruefeZeitpunkt(ereignis.zeitpunkt);
    for (const [name, wert] of [['kennung', ereignis.kennung], ['name', ereignis.name], ['quelle', ereignis.quelle], ['ablaufKennung', ereignis.ablaufKennung]] as const) {
      if (wert.trim().length === 0) throw new Error(`${name} darf im Flugschreiber nicht leer sein.`);
    }
  }

  private pruefeZeitpunkt(zeitpunkt: number): void {
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Zeitpunkte muessen endliche, nichtnegative Zahlen sein.');
  }
}
