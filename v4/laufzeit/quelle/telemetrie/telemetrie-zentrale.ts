import type { EreignisZentrale } from '../kern/ereignis-zentrale.js';
import type {
  AblaufBeobachtung,
  DienstVerbrauchsEintrag,
  LeistungsZaehlerEintrag,
  LaufzeitAbschnitt,
  Vorfall,
  VorfallPaket,
  WiederholungsSegment
} from '../vertraege/telemetrie.js';
import type { Flugschreiber } from './flugschreiber.js';
import type { TelemetrieSpeicher } from './telemetrie-speicher.js';
import type { VorfallErkennung } from './vorfall-erkennung.js';
import type { VorfallPaketSammler } from './vorfall-paket-sammler.js';

export interface TelemetrieVerarbeitungsErgebnis {
  readonly vorfaelle: readonly Vorfall[];
  readonly fertigeVorfallPakete: readonly VorfallPaket[];
  readonly abgeschlosseneSegmente: readonly WiederholungsSegment[];
  readonly nichtDauerhaftGespeichert: readonly string[];
}

export class TelemetrieZentrale {
  private trennen: (() => void) | null = null;
  private readonly neueSegmente: WiederholungsSegment[] = [];
  private readonly fertigePakete: VorfallPaket[] = [];
  private readonly nichtGespeichert: string[] = [];

  constructor(
    private readonly ereignisZentrale: EreignisZentrale,
    private readonly flugschreiber: Flugschreiber,
    private readonly speicher: TelemetrieSpeicher,
    private readonly vorfallErkennung: VorfallErkennung,
    private readonly paketSammler: VorfallPaketSammler
  ) {}

  verbinde(): () => void {
    if (this.trennen !== null) return this.trennen;
    const entfernen = this.ereignisZentrale.fuegeEmpfaengerHinzu('*', (ereignis) => {
      const ergebnis = this.flugschreiber.zeichneAuf(ereignis);
      this.paketSammler.verarbeiteEreignis(ereignis);
      for (const segment of ergebnis.abgeschlosseneSegmente) this.merkeSegment(segment, ereignis.zeitpunkt);
    });
    this.trennen = () => {
      entfernen();
      this.trennen = null;
    };
    return this.trennen;
  }

  beobachteAblauf(probe: AblaufBeobachtung): TelemetrieVerarbeitungsErgebnis {
    const vorfaelle = this.vorfallErkennung.pruefe(probe);
    for (const vorfall of vorfaelle) {
      const verdraengte = this.paketSammler.oeffne(vorfall, this.flugschreiber);
      this.merkePakete(verdraengte);
    }
    const faellige = this.paketSammler.schliesseFaellige(probe.zeitpunkt);
    this.merkePakete(faellige);
    return this.holeUndLeereErgebnis(vorfaelle);
  }

  erfasseLaufzeit(abschnitt: LaufzeitAbschnitt, gespeichertAm: number): boolean {
    return this.speicher.erfasseLaufzeitAbschnitt(abschnitt, gespeichertAm);
  }

  erfasseLeistung(eintrag: LeistungsZaehlerEintrag, gespeichertAm: number): boolean {
    return this.speicher.erfasseLeistungsZaehler(eintrag, gespeichertAm);
  }

  erfasseDienstVerbrauch(eintrag: DienstVerbrauchsEintrag, gespeichertAm: number): boolean {
    return this.speicher.erfasseDienstVerbrauch(eintrag, gespeichertAm);
  }

  schliesseWiederholungsSegment(zeitpunkt: number): WiederholungsSegment | null {
    const segment = this.flugschreiber.schliesseOffenesSegment(zeitpunkt);
    if (segment) this.merkeSegment(segment, zeitpunkt);
    return segment;
  }

  aktualisiere(zeitpunkt: number): TelemetrieVerarbeitungsErgebnis {
    const faellige = this.paketSammler.schliesseFaellige(zeitpunkt);
    this.merkePakete(faellige);
    return this.holeUndLeereErgebnis([]);
  }

  beendeAblauf(ablaufKennung: string): void {
    this.vorfallErkennung.beendeAblauf(ablaufKennung);
  }

  private merkeSegment(segment: WiederholungsSegment, gespeichertAm: number): void {
    const gespeichert = this.speicher.erfasseWiederholungsSegment(segment, gespeichertAm);
    if (!gespeichert) this.nichtGespeichert.push(segment.segmentKennung);
    this.neueSegmente.push(segment);
  }

  private merkePakete(pakete: readonly VorfallPaket[]): void {
    for (const paket of pakete) {
      const gespeichert = this.speicher.erfasseVorfallPaket(paket, paket.abgeschlossenAm);
      if (!gespeichert) this.nichtGespeichert.push(paket.paketKennung);
      this.fertigePakete.push(paket);
    }
  }

  private holeUndLeereErgebnis(vorfaelle: readonly Vorfall[]): TelemetrieVerarbeitungsErgebnis {
    const segmente = this.neueSegmente.splice(0, this.neueSegmente.length);
    const pakete = this.fertigePakete.splice(0, this.fertigePakete.length);
    const nichtGespeichert = this.nichtGespeichert.splice(0, this.nichtGespeichert.length);
    return Object.freeze({
      vorfaelle: Object.freeze([...vorfaelle]),
      fertigeVorfallPakete: Object.freeze(pakete),
      abgeschlosseneSegmente: Object.freeze(segmente),
      nichtDauerhaftGespeichert: Object.freeze(nichtGespeichert)
    });
  }
}
