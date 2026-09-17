import { KAMPF_GEFAHREN_STUFEN, type KampfGefahrenStufe } from '../vertraege/kampfsicherheit.js';
import {
  GRUPPEN_FAEHIGKEITEN,
  type GruppenFaehigkeitsProfil,
  type GruppenTeilnehmerMeldung
} from '../vertraege/gruppen-koordination.js';
import type {
  GruppenTeilnehmerMeldungsEingabe,
  GruppenTeilnehmerMeldungsErgebnis,
  GruppenTeilnehmerMeldungsSicherheitsEingabe
} from '../vertraege/gruppen-lebensnachweis.js';
import type { CharakterZustand, Spielzustand, WissensWert } from '../vertraege/spielzustand.js';

function bekannterWert<TWert>(wert: WissensWert<TWert>): TWert | null {
  return wert.zustand === 'bekannt' ? wert.wert : null;
}

function normalisiereAnteil(wert: number | null, maximal: number | null): number | null {
  if (wert === null || maximal === null || !Number.isFinite(wert) || !Number.isFinite(maximal) || maximal <= 0) return null;
  return Math.max(0, Math.min(1, wert / maximal));
}

function pruefeFaehigkeiten(faehigkeiten: GruppenFaehigkeitsProfil): readonly string[] {
  const gruende: string[] = [];
  for (const faehigkeit of GRUPPEN_FAEHIGKEITEN) {
    const wert = faehigkeiten[faehigkeit];
    if (!Number.isFinite(wert) || wert < 0 || wert > 1) {
      gruende.push(`Gruppenfaehigkeit ${faehigkeit} muss zwischen 0 und 1 liegen.`);
    }
  }
  return gruende;
}

function pruefeGefahrenStufe(gefahrenStufe: KampfGefahrenStufe): readonly string[] {
  return (KAMPF_GEFAHREN_STUFEN as readonly string[]).includes(gefahrenStufe)
    ? []
    : ['Gefahrenstufe ist ungueltig.'];
}

function blockiert(gruende: readonly string[]): GruppenTeilnehmerMeldungsErgebnis {
  return Object.freeze({ schemaVersion: 1, status: 'blockiert', gruende: Object.freeze([...gruende]), meldung: null });
}

function fehltText(wert: string | null, name: string, gruende: string[]): void {
  if (wert === null || wert.length === 0) gruende.push(`${name} fehlt; Lebensnachweis wird nicht geraten.`);
}

function baueMeldung(
  spielzustand: Spielzustand,
  charakter: CharakterZustand,
  gefahrenStufe: KampfGefahrenStufe,
  faehigkeiten: GruppenFaehigkeitsProfil,
  charakterKennung: string,
  charakterName: string,
  klasse: string,
  serverRegion: string,
  serverKennung: string,
  karte: string,
  instanz: string
): GruppenTeilnehmerMeldung {
  const tot = bekannterWert(charakter.tot);
  const ziel = bekannterWert(charakter.ziel);
  const leben = bekannterWert(charakter.leben);
  const lebenMaximal = bekannterWert(charakter.lebenMaximal);
  const mana = bekannterWert(charakter.mana);
  const manaMaximal = bekannterWert(charakter.manaMaximal);

  return Object.freeze({
    schemaVersion: 1,
    charakterKennung,
    charakterName,
    klasse,
    serverRegion,
    serverKennung,
    karte,
    instanz,
    lebendig: typeof tot === 'boolean' ? !tot : null,
    lebensAnteil: normalisiereAnteil(leben, lebenMaximal),
    manaAnteil: normalisiereAnteil(mana, manaMaximal),
    zielKennung: typeof ziel === 'string' || ziel === null ? ziel : null,
    gefahrenStufe,
    faehigkeiten: Object.freeze({ ...faehigkeiten }),
    gesendetAm: spielzustand.aufgenommenAm,
    laufendeNummer: spielzustand.laufendeNummer
  });
}

export function erstelleGruppenTeilnehmerMeldungAusSpielzustand(
  spielzustand: Spielzustand,
  eingabe: GruppenTeilnehmerMeldungsEingabe
): GruppenTeilnehmerMeldungsErgebnis {
  const gruende: string[] = [
    ...pruefeGefahrenStufe(eingabe.gefahrenStufe),
    ...pruefeFaehigkeiten(eingabe.faehigkeiten)
  ];

  const charakter = bekannterWert(spielzustand.beobachtet.charakter);
  if (charakter === null) {
    gruende.push('Charakterzustand fehlt; Lebensnachweis wird nicht erzeugt.');
    return blockiert(gruende);
  }

  const charakterKennung = bekannterWert(charakter.kennung);
  const charakterName = bekannterWert(charakter.name);
  const klasse = bekannterWert(charakter.klasse);
  const karte = bekannterWert(charakter.karte);
  const instanz = bekannterWert(charakter.instanz);
  const serverRegion = bekannterWert(spielzustand.beobachtet.server.region);
  const serverKennung = bekannterWert(spielzustand.beobachtet.server.kennung);

  fehltText(charakterKennung, 'Charakterkennung', gruende);
  fehltText(charakterName, 'Charaktername', gruende);
  fehltText(klasse, 'Charakterklasse', gruende);
  fehltText(serverRegion, 'Serverregion', gruende);
  fehltText(serverKennung, 'Serverkennung', gruende);
  fehltText(karte, 'Karte', gruende);
  fehltText(instanz, 'Instanz', gruende);

  if (gruende.length > 0 || charakterKennung === null || charakterName === null || klasse === null || serverRegion === null || serverKennung === null || karte === null || instanz === null) {
    return blockiert(gruende);
  }

  return Object.freeze({
    schemaVersion: 1,
    status: 'bereit',
    gruende: Object.freeze([]),
    meldung: baueMeldung(
      spielzustand,
      charakter,
      eingabe.gefahrenStufe,
      eingabe.faehigkeiten,
      charakterKennung,
      charakterName,
      klasse,
      serverRegion,
      serverKennung,
      karte,
      instanz
    )
  });
}

export function erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(
  spielzustand: Spielzustand,
  eingabe: GruppenTeilnehmerMeldungsSicherheitsEingabe
): GruppenTeilnehmerMeldungsErgebnis {
  const sicherheit = eingabe.sicherheitsEntscheidung;
  const gruende: string[] = [...pruefeFaehigkeiten(eingabe.faehigkeiten)];

  if (sicherheit?.schemaVersion !== 1) {
    gruende.push('Block-7-Kampfsicherheitsentscheidung fehlt oder hat eine unbekannte Schemaversion.');
  }

  if (!Number.isFinite(sicherheit?.zeitpunkt) || sicherheit.zeitpunkt !== spielzustand.aufgenommenAm) {
    gruende.push('Block-7-Kampfsicherheitsentscheidung gehoert nicht zum selben Spielzustandszeitpunkt.');
  }

  const gefahrenStufe = sicherheit?.gefahrenBewertung?.stufe;
  if (typeof gefahrenStufe !== 'string' || !(KAMPF_GEFAHREN_STUFEN as readonly string[]).includes(gefahrenStufe)) {
    gruende.push('Block-7-Kampfsicherheitsentscheidung enthaelt keine gueltige Gefahrenstufe.');
  }

  if (gruende.length > 0 || typeof gefahrenStufe !== 'string') return blockiert(gruende);

  return erstelleGruppenTeilnehmerMeldungAusSpielzustand(spielzustand, {
    gefahrenStufe: gefahrenStufe as KampfGefahrenStufe,
    faehigkeiten: eingabe.faehigkeiten
  });
}
