import type {
  GoldenerWiederholungsEintrag,
  GoldenerWiederholungsHinzufuegeErgebnis,
  GoldenerWiederholungsSatzGrenzen,
  WiederholungsDatensatz
} from '../vertraege/wiederholung.js';
import { berechneSha256 } from '../telemetrie/sha256.js';
import { kanonisiereJson } from './kanonisches-json.js';

function vergleicheText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class GoldenerWiederholungsSatz {
  private readonly eintraege = new Map<string, GoldenerWiederholungsEintrag>();

  constructor(private readonly grenzen: GoldenerWiederholungsSatzGrenzen) {
    if (!Number.isSafeInteger(grenzen.maxEintraege) || grenzen.maxEintraege <= 0) throw new Error('maxEintraege muss positiv sein.');
    if (!Number.isSafeInteger(grenzen.maxBytes) || grenzen.maxBytes <= 0) throw new Error('maxBytes muss positiv sein.');
  }

  fuegeHinzu(kennung: string, grund: string, hinzugefuegtAm: number, datensatz: WiederholungsDatensatz): GoldenerWiederholungsHinzufuegeErgebnis {
    if (kennung.trim().length === 0 || grund.trim().length === 0) throw new Error('Goldene Wiederholungen benoetigen Kennung und Grund.');
    if (!Number.isFinite(hinzugefuegtAm) || hinzugefuegtAm < 0) throw new Error('hinzugefuegtAm muss eine endliche, nichtnegative Zahl sein.');
    if (this.eintraege.has(kennung)) return Object.freeze({ aufgenommen: false, grund: 'Die goldene Wiederholung ist bereits vorhanden.', eintrag: this.eintraege.get(kennung) ?? null });
    const datensatzJson = kanonisiereJson(datensatz);
    const eintrag: GoldenerWiederholungsEintrag = Object.freeze({
      schemaVersion: 1,
      kennung,
      hinzugefuegtAm,
      grund,
      datensatz,
      sha256: berechneSha256(datensatzJson)
    });
    const neueBytes = new TextEncoder().encode(kanonisiereJson(eintrag)).byteLength;
    if (this.eintraege.size + 1 > this.grenzen.maxEintraege || this.groesseBytes() + neueBytes > this.grenzen.maxBytes) {
      return Object.freeze({ aufgenommen: false, grund: 'Der geschuetzte goldene Wiederholungssatz ist voll; vorhandene Belege werden nicht automatisch verdraengt.', eintrag: null });
    }
    this.eintraege.set(kennung, eintrag);
    return Object.freeze({ aufgenommen: true, grund: 'Goldene Wiederholung wurde geschuetzt aufgenommen.', eintrag });
  }

  bereinigeNormal(): number {
    return 0;
  }

  entferneAusdruecklich(kennung: string): boolean {
    return this.eintraege.delete(kennung);
  }

  liste(): readonly GoldenerWiederholungsEintrag[] {
    return Object.freeze([...this.eintraege.values()].sort((a, b) => a.hinzugefuegtAm - b.hinzugefuegtAm || vergleicheText(a.kennung, b.kennung)));
  }

  groesseBytes(): number {
    let bytes = 0;
    for (const eintrag of this.eintraege.values()) bytes += new TextEncoder().encode(kanonisiereJson(eintrag)).byteLength;
    return bytes;
  }
}
