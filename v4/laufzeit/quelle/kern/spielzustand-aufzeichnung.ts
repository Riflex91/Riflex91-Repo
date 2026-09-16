import type { Spielzustand, SpielzustandAufzeichnung } from '../vertraege/spielzustand.js';
import { friereTief } from './spielzustand-erstellung.js';

type Objekt = Record<string, unknown>;

function istObjekt(wert: unknown): wert is Objekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function pruefeSpielzustand(wert: unknown): asserts wert is Spielzustand {
  if (!istObjekt(wert)) throw new Error('Spielzustand muss ein Objekt sein.');
  if (wert.schemaVersion !== 2) throw new Error('Unbekannte Spielzustand-Schemaversion.');
  if (!Number.isSafeInteger(wert.laufendeNummer) || (wert.laufendeNummer as number) < 0) {
    throw new Error('Spielzustand enthaelt eine ungueltige laufendeNummer.');
  }
  if (typeof wert.aufgenommenAm !== 'number' || !Number.isFinite(wert.aufgenommenAm) || wert.aufgenommenAm < 0) {
    throw new Error('Spielzustand enthaelt einen ungueltigen Zeitpunkt.');
  }
  if (typeof wert.ablaufKennung !== 'string' || wert.ablaufKennung.trim().length === 0) {
    throw new Error('Spielzustand enthaelt keine gueltige ablaufKennung.');
  }
  if (!istObjekt(wert.beobachtet)) throw new Error('Spielzustand enthaelt kein beobachtetes Wissen.');
  if (!istObjekt(wert.abgeleitet)) throw new Error('Spielzustand enthaelt kein abgeleitetes Wissen.');
  if (!Array.isArray(wert.gelernt)) throw new Error('Spielzustand enthaelt kein gelerntes Wissen.');
}

function pruefeReihenfolge(zustaende: readonly Spielzustand[]): void {
  let vorherigeNummer = -1;
  for (const zustand of zustaende) {
    if (zustand.laufendeNummer <= vorherigeNummer) {
      throw new Error('Spielzustandsaufzeichnung muss streng steigende laufendeNummern enthalten.');
    }
    vorherigeNummer = zustand.laufendeNummer;
  }
}

export function serialisiereSpielzustand(zustand: Spielzustand): string {
  return JSON.stringify(zustand);
}

export function ladeSpielzustand(text: string): Spielzustand {
  const wert: unknown = JSON.parse(text);
  pruefeSpielzustand(wert);
  return friereTief(wert);
}

export function erstelleSpielzustandAufzeichnung(
  zustaende: readonly Spielzustand[],
  erstelltAm: number
): SpielzustandAufzeichnung {
  if (!Number.isFinite(erstelltAm) || erstelltAm < 0) {
    throw new Error('erstelltAm muss eine nichtnegative endliche Zahl sein.');
  }
  pruefeReihenfolge(zustaende);
  return friereTief({
    schemaVersion: 1,
    erstelltAm,
    zustaende: [...zustaende]
  });
}

export function serialisiereSpielzustandAufzeichnung(aufzeichnung: SpielzustandAufzeichnung): string {
  return JSON.stringify(aufzeichnung);
}

export function ladeSpielzustandAufzeichnung(text: string): SpielzustandAufzeichnung {
  const wert: unknown = JSON.parse(text);
  if (!istObjekt(wert)) throw new Error('Spielzustandsaufzeichnung muss ein Objekt sein.');
  if (wert.schemaVersion !== 1) throw new Error('Unbekannte Aufzeichnungs-Schemaversion.');
  if (typeof wert.erstelltAm !== 'number' || !Number.isFinite(wert.erstelltAm) || wert.erstelltAm < 0) {
    throw new Error('Spielzustandsaufzeichnung enthaelt einen ungueltigen Zeitpunkt.');
  }
  if (!Array.isArray(wert.zustaende)) throw new Error('Spielzustandsaufzeichnung enthaelt keine Zustandsliste.');

  for (const zustand of wert.zustaende) pruefeSpielzustand(zustand);
  const zustaende = wert.zustaende as Spielzustand[];
  pruefeReihenfolge(zustaende);

  return friereTief({
    schemaVersion: 1,
    erstelltAm: wert.erstelltAm,
    zustaende
  });
}
