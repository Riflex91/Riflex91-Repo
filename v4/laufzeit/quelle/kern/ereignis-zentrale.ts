import type { BotEreignis } from '../vertraege/bot-ereignis.js';

export type EreignisEmpfaenger = (ereignis: BotEreignis) => void;

export interface EreignisFehler {
  readonly empfaengerNummer: number;
  readonly fehler: unknown;
}

export interface EreignisBericht {
  readonly zugestelltAn: number;
  readonly fehler: readonly EreignisFehler[];
}

export class EreignisZentrale {
  private readonly empfaengerNachName = new Map<string, EreignisEmpfaenger[]>();
  private readonly alleEreignisEmpfaenger: EreignisEmpfaenger[] = [];
  private letzteLaufendeNummer = 0;

  fuegeEmpfaengerHinzu(ereignisName: string, empfaenger: EreignisEmpfaenger): () => void {
    if (ereignisName === '*') {
      this.alleEreignisEmpfaenger.push(empfaenger);
      return () => this.entferneEmpfaenger(this.alleEreignisEmpfaenger, empfaenger);
    }

    const empfaengerListe = this.empfaengerNachName.get(ereignisName) ?? [];
    empfaengerListe.push(empfaenger);
    this.empfaengerNachName.set(ereignisName, empfaengerListe);
    return () => this.entferneEmpfaenger(empfaengerListe, empfaenger);
  }

  sendeEreignis(ereignis: BotEreignis): EreignisBericht {
    if (!Number.isSafeInteger(ereignis.laufendeNummer) || ereignis.laufendeNummer <= this.letzteLaufendeNummer) {
      throw new Error(`Die laufende Ereignisnummer muss steigen: ${ereignis.laufendeNummer} ist nicht groesser als ${this.letzteLaufendeNummer}.`);
    }

    this.letzteLaufendeNummer = ereignis.laufendeNummer;
    const empfaenger = [
      ...(this.empfaengerNachName.get(ereignis.name) ?? []),
      ...this.alleEreignisEmpfaenger
    ];
    const fehler: EreignisFehler[] = [];

    empfaenger.forEach((ziel, index) => {
      try {
        ziel(ereignis);
      } catch (ursache: unknown) {
        fehler.push({ empfaengerNummer: index + 1, fehler: ursache });
      }
    });

    return { zugestelltAn: empfaenger.length, fehler };
  }

  holeLetzteLaufendeNummer(): number {
    return this.letzteLaufendeNummer;
  }

  private entferneEmpfaenger(liste: EreignisEmpfaenger[], empfaenger: EreignisEmpfaenger): void {
    const index = liste.indexOf(empfaenger);
    if (index >= 0) liste.splice(index, 1);
  }
}
