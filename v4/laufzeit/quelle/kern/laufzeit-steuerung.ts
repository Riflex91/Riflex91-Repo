import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import {
  istPauseGeschuetzteWichtigkeit,
  type LaufzeitAktionsFreigabe,
  type LaufzeitAktionsTor,
  type LaufzeitSteuerungsStatus
} from '../vertraege/laufzeit-steuerung.js';

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
    throw new Error('Der Laufzeitsteuerungs-Zeitpunkt muss endlich und nichtnegativ sein.');
  }
}

function pruefeGrund(grund: string): void {
  if (grund.trim().length === 0) throw new Error('Die Laufzeitsteuerung benoetigt einen Grund.');
}

export class LaufzeitSteuerung implements LaufzeitAktionsTor {
  private zustand: 'laeuft' | 'pausiert' = 'laeuft';
  private generation = 0;
  private letzteAenderungAm: number | null = null;
  private grund = 'Laufzeit ist fuer normale Arbeit freigegeben.';

  status(): LaufzeitSteuerungsStatus {
    return Object.freeze({
      schemaVersion: 1,
      zustand: this.zustand,
      generation: this.generation,
      letzteAenderungAm: this.letzteAenderungAm,
      grund: this.grund,
      automatischeFortsetzung: false
    });
  }

  pausiere(zeitpunkt: number, grund: string): LaufzeitSteuerungsStatus {
    pruefeZeitpunkt(zeitpunkt);
    pruefeGrund(grund);
    if (this.zustand === 'pausiert') return this.status();

    this.zustand = 'pausiert';
    this.generation += 1;
    this.letzteAenderungAm = zeitpunkt;
    this.grund = grund;
    return this.status();
  }

  setzeFort(zeitpunkt: number, grund: string): LaufzeitSteuerungsStatus {
    pruefeZeitpunkt(zeitpunkt);
    pruefeGrund(grund);
    if (this.zustand === 'laeuft') return this.status();

    this.zustand = 'laeuft';
    this.generation += 1;
    this.letzteAenderungAm = zeitpunkt;
    this.grund = grund;
    return this.status();
  }

  pruefeAktionsAnfrage(
    anfrage: Pick<AktionsAnfrage, 'wichtigkeit'>
  ): LaufzeitAktionsFreigabe {
    if (this.zustand === 'laeuft') {
      return Object.freeze({
        erlaubt: true,
        grund: 'Laufzeit ist fuer normale Arbeit freigegeben.'
      });
    }

    if (istPauseGeschuetzteWichtigkeit(anfrage.wichtigkeit)) {
      return Object.freeze({
        erlaubt: true,
        grund: 'Laufzeit ist pausiert; Notfall- und Sicherheitsarbeit bleibt ausdruecklich zugelassen.'
      });
    }

    return Object.freeze({
      erlaubt: false,
      grund: 'Laufzeit ist pausiert; normale und Hintergrundarbeit darf nicht gestartet oder fortgesetzt werden.'
    });
  }
}
