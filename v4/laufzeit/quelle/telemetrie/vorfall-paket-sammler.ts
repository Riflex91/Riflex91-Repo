import type { BotEreignis } from '../vertraege/bot-ereignis.js';
import type { Vorfall, VorfallPaket } from '../vertraege/telemetrie.js';
import type { Flugschreiber } from './flugschreiber.js';

export interface VorfallPaketOptionen {
  readonly vorherMillisekunden: number;
  readonly nachherMillisekunden: number;
  readonly maxOffenePakete: number;
  readonly maxEreignisseProPaket: number;
  readonly maxBytesProPaket: number;
}

const STANDARD_OPTIONEN: VorfallPaketOptionen = Object.freeze({
  vorherMillisekunden: 120_000,
  nachherMillisekunden: 30_000,
  maxOffenePakete: 20,
  maxEreignisseProPaket: 2_000,
  maxBytesProPaket: 1_000_000
});

interface OffenesPaket {
  readonly vorfall: Vorfall;
  readonly erstelltAm: number;
  readonly nachlaufBis: number;
  readonly vorher: BotEreignis[];
  readonly nachher: BotEreignis[];
  bytes: number;
  gekuerzt: boolean;
}

function pruefeOption(name: string, wert: number, nullErlaubt = false): void {
  if (!Number.isSafeInteger(wert) || wert < (nullErlaubt ? 0 : 1)) throw new Error(`${name} ist ungueltig.`);
}

function ereignisBytes(ereignis: BotEreignis): number {
  return new TextEncoder().encode(JSON.stringify(ereignis)).byteLength;
}

export class VorfallPaketSammler {
  private readonly optionen: VorfallPaketOptionen;
  private readonly offen: OffenesPaket[] = [];

  constructor(optionen: Partial<VorfallPaketOptionen> = {}) {
    this.optionen = { ...STANDARD_OPTIONEN, ...optionen };
    pruefeOption('vorherMillisekunden', this.optionen.vorherMillisekunden, true);
    pruefeOption('nachherMillisekunden', this.optionen.nachherMillisekunden, true);
    pruefeOption('maxOffenePakete', this.optionen.maxOffenePakete);
    pruefeOption('maxEreignisseProPaket', this.optionen.maxEreignisseProPaket);
    pruefeOption('maxBytesProPaket', this.optionen.maxBytesProPaket);
  }

  oeffne(vorfall: Vorfall, flugschreiber: Flugschreiber): readonly VorfallPaket[] {
    const fertig: VorfallPaket[] = [];
    while (this.offen.length >= this.optionen.maxOffenePakete) {
      const aeltestes = this.offen.shift();
      if (aeltestes) {
        aeltestes.gekuerzt = true;
        fertig.push(this.schliessePaket(aeltestes, vorfall.entdecktAm));
      }
    }

    const vorherRoh = flugschreiber.holeEreignisse(
      Math.max(0, vorfall.entdecktAm - this.optionen.vorherMillisekunden),
      vorfall.entdecktAm
    );
    const paket: OffenesPaket = {
      vorfall,
      erstelltAm: vorfall.entdecktAm,
      nachlaufBis: vorfall.entdecktAm + this.optionen.nachherMillisekunden,
      vorher: [],
      nachher: [],
      bytes: 0,
      gekuerzt: false
    };
    for (const ereignis of vorherRoh) this.fuegeBegrenztHinzu(paket, paket.vorher, ereignis);
    this.offen.push(paket);
    return Object.freeze(fertig);
  }

  verarbeiteEreignis(ereignis: BotEreignis): void {
    for (const paket of this.offen) {
      if (ereignis.zeitpunkt <= paket.vorfall.entdecktAm || ereignis.zeitpunkt > paket.nachlaufBis) continue;
      this.fuegeBegrenztHinzu(paket, paket.nachher, ereignis);
    }
  }

  schliesseFaellige(zeitpunkt: number): readonly VorfallPaket[] {
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der Zeitpunkt muss endlich und nichtnegativ sein.');
    const fertig: VorfallPaket[] = [];
    for (let index = this.offen.length - 1; index >= 0; index -= 1) {
      const paket = this.offen[index];
      if (!paket || zeitpunkt < paket.nachlaufBis) continue;
      this.offen.splice(index, 1);
      fertig.push(this.schliessePaket(paket, zeitpunkt));
    }
    fertig.sort((a, b) => a.vorfall.entdecktAm - b.vorfall.entdecktAm || a.paketKennung.localeCompare(b.paketKennung));
    return Object.freeze(fertig);
  }

  schliesseAlle(zeitpunkt: number): readonly VorfallPaket[] {
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) throw new Error('Der Zeitpunkt muss endlich und nichtnegativ sein.');
    const fertig = this.offen.splice(0, this.offen.length).map((paket) => {
      if (zeitpunkt < paket.nachlaufBis) paket.gekuerzt = true;
      return this.schliessePaket(paket, zeitpunkt);
    });
    return Object.freeze(fertig);
  }

  anzahlOffenePakete(): number {
    return this.offen.length;
  }

  private fuegeBegrenztHinzu(paket: OffenesPaket, ziel: BotEreignis[], ereignis: BotEreignis): void {
    const bytes = ereignisBytes(ereignis);
    const gesamtAnzahl = paket.vorher.length + paket.nachher.length;
    if (gesamtAnzahl + 1 > this.optionen.maxEreignisseProPaket || paket.bytes + bytes > this.optionen.maxBytesProPaket) {
      paket.gekuerzt = true;
      return;
    }
    ziel.push(ereignis);
    paket.bytes += bytes;
  }

  private schliessePaket(paket: OffenesPaket, abgeschlossenAm: number): VorfallPaket {
    return Object.freeze({
      schemaVersion: 1,
      paketKennung: `paket:${paket.vorfall.vorfallKennung}`,
      vorfall: paket.vorfall,
      erstelltAm: paket.erstelltAm,
      abgeschlossenAm,
      ereignisseVorher: Object.freeze([...paket.vorher]),
      ereignisseNachher: Object.freeze([...paket.nachher]),
      gekuerzt: paket.gekuerzt
    });
  }
}
