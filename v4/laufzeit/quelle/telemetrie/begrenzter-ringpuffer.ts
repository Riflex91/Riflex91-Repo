import type { BegrenzungsRegeln } from '../vertraege/telemetrie.js';

export interface RingpufferOptionen<T> extends BegrenzungsRegeln {
  readonly ermittleZeitpunkt: (eintrag: T) => number;
  readonly serialisiere?: (eintrag: T) => string;
}

export interface RingpufferErgebnis {
  readonly aufgenommen: boolean;
  readonly entfernteEintraege: number;
  readonly grund: string | null;
}

interface GespeicherterEintrag<T> {
  readonly wert: T;
  readonly bytes: number;
}

function pruefeGrenze(name: string, wert: number): void {
  if (!Number.isSafeInteger(wert) || wert <= 0) throw new Error(`${name} muss eine positive ganze Zahl sein.`);
}

export class BegrenzterRingpuffer<T> {
  private readonly eintraege: GespeicherterEintrag<T>[] = [];
  private readonly optionen: RingpufferOptionen<T>;
  private gesamtBytes = 0;

  constructor(optionen: RingpufferOptionen<T>) {
    pruefeGrenze('maxEintraege', optionen.maxEintraege);
    pruefeGrenze('maxBytes', optionen.maxBytes);
    pruefeGrenze('maxAlterMillisekunden', optionen.maxAlterMillisekunden);
    this.optionen = optionen;
  }

  fuegeHinzu(eintrag: T, jetzt: number): RingpufferErgebnis {
    this.pruefeZeitpunkt(jetzt);
    const zeitpunkt = this.optionen.ermittleZeitpunkt(eintrag);
    this.pruefeZeitpunkt(zeitpunkt);
    const serialisiert = this.optionen.serialisiere?.(eintrag) ?? JSON.stringify(eintrag);
    const bytes = new TextEncoder().encode(serialisiert).byteLength;
    let entfernt = this.bereinigeNachAlter(jetzt);

    if (bytes > this.optionen.maxBytes) {
      return Object.freeze({
        aufgenommen: false,
        entfernteEintraege: entfernt,
        grund: `Ein einzelner Eintrag mit ${bytes} Bytes ueberschreitet das Pufferlimit von ${this.optionen.maxBytes} Bytes.`
      });
    }

    this.eintraege.push({ wert: eintrag, bytes });
    this.gesamtBytes += bytes;

    while (this.eintraege.length > this.optionen.maxEintraege || this.gesamtBytes > this.optionen.maxBytes) {
      this.entferneAeltesten();
      entfernt += 1;
    }

    return Object.freeze({ aufgenommen: true, entfernteEintraege: entfernt, grund: null });
  }

  bereinige(jetzt: number): number {
    this.pruefeZeitpunkt(jetzt);
    return this.bereinigeNachAlter(jetzt);
  }

  liste(): readonly T[] {
    return Object.freeze(this.eintraege.map((eintrag) => eintrag.wert));
  }

  anzahl(): number {
    return this.eintraege.length;
  }

  groesseBytes(): number {
    return this.gesamtBytes;
  }

  leere(): void {
    this.eintraege.splice(0, this.eintraege.length);
    this.gesamtBytes = 0;
  }

  private bereinigeNachAlter(jetzt: number): number {
    let entfernt = 0;
    const grenze = jetzt - this.optionen.maxAlterMillisekunden;
    while (this.eintraege.length > 0) {
      const erster = this.eintraege[0];
      if (!erster || this.optionen.ermittleZeitpunkt(erster.wert) >= grenze) break;
      this.entferneAeltesten();
      entfernt += 1;
    }
    return entfernt;
  }

  private entferneAeltesten(): void {
    const entfernt = this.eintraege.shift();
    if (entfernt) this.gesamtBytes -= entfernt.bytes;
  }

  private pruefeZeitpunkt(zeitpunkt: number): void {
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
      throw new Error('Zeitpunkte muessen endliche, nichtnegative Zahlen sein.');
    }
  }
}
