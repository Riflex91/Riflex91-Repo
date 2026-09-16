import type { FarmLeistungsEintraege } from '../vertraege/farmen.js';
import type { CharakterZustand, Spielzustand, WissensWert } from '../vertraege/spielzustand.js';
import { TelemetrieSpeicher } from './telemetrie-speicher.js';

function bekannterWert<T>(wert: WissensWert<T>): T | undefined {
  return wert.zustand === 'bekannt' ? wert.wert : undefined;
}

function charakter(spielzustand: Spielzustand): CharakterZustand | null {
  return bekannterWert(spielzustand.beobachtet.charakter) ?? null;
}

function berechneErfahrungsGewinn(vorher: CharakterZustand, nachher: CharakterZustand): number | null {
  const vorherStufe = bekannterWert(vorher.stufe);
  const nachherStufe = bekannterWert(nachher.stufe);
  const vorherErfahrung = bekannterWert(vorher.erfahrung);
  const nachherErfahrung = bekannterWert(nachher.erfahrung);
  if (vorherStufe === undefined || nachherStufe === undefined || vorherErfahrung === undefined || nachherErfahrung === undefined) return null;
  if (nachherStufe === vorherStufe) return Math.max(0, nachherErfahrung - vorherErfahrung);
  if (nachherStufe === vorherStufe + 1) {
    const vorherMaximal = bekannterWert(vorher.erfahrungNaechsteStufe);
    if (vorherMaximal === undefined || vorherMaximal < vorherErfahrung) return null;
    return Math.max(0, vorherMaximal - vorherErfahrung + nachherErfahrung);
  }
  return null;
}

export function erstelleFarmLeistungsEintraege(
  vorher: Spielzustand,
  nachher: Spielzustand
): Readonly<FarmLeistungsEintraege> | null {
  if (nachher.aufgenommenAm <= vorher.aufgenommenAm) return null;
  const vorherCharakter = charakter(vorher);
  const nachherCharakter = charakter(nachher);
  if (!vorherCharakter || !nachherCharakter) return null;
  const vorherKennung = bekannterWert(vorherCharakter.kennung);
  const nachherKennung = bekannterWert(nachherCharakter.kennung);
  const charakterName = bekannterWert(nachherCharakter.name);
  if (!vorherKennung || vorherKennung !== nachherKennung || !charakterName) return null;

  const laufzeitAbschnitt = Object.freeze({
    schemaVersion: 1 as const,
    kennung: `${nachher.ablaufKennung}:farm-laufzeit:${vorher.laufendeNummer}-${nachher.laufendeNummer}`,
    start: vorher.aufgenommenAm,
    ende: nachher.aufgenommenAm,
    charakterName
  });

  const erfahrungGewonnen = berechneErfahrungsGewinn(vorherCharakter, nachherCharakter);
  const vorherGold = bekannterWert(vorherCharakter.gold);
  const nachherGold = bekannterWert(nachherCharakter.gold);
  const goldGewonnen = vorherGold === undefined || nachherGold === undefined ? null : Math.max(0, nachherGold - vorherGold);
  const leistungsZaehler = erfahrungGewonnen === null && goldGewonnen === null ? null : Object.freeze({
    schemaVersion: 1 as const,
    kennung: `${nachher.ablaufKennung}:farm-leistung:${vorher.laufendeNummer}-${nachher.laufendeNummer}`,
    zeitpunkt: nachher.aufgenommenAm,
    charakterName,
    erfahrungGewonnen: erfahrungGewonnen ?? 0,
    goldGewonnen: goldGewonnen ?? 0,
    tode: 0,
    rueckzuege: 0,
    verbindungsAbbrueche: 0,
    neustarts: 0,
    automatischBehoben: 0,
    ungefangeneFehler: 0
  });

  return Object.freeze({ laufzeitAbschnitt, leistungsZaehler });
}

export function speichereFarmLeistungsEintraege(
  speicher: TelemetrieSpeicher,
  eintraege: FarmLeistungsEintraege,
  gespeichertAm: number
): void {
  speicher.erfasseLaufzeitAbschnitt(eintraege.laufzeitAbschnitt, gespeichertAm);
  if (eintraege.leistungsZaehler) speicher.erfasseLeistungsZaehler(eintraege.leistungsZaehler, gespeichertAm);
}
