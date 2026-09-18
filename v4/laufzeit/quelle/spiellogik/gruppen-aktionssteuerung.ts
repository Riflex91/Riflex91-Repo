import { AktionsSteuerung } from '../kern/aktions-steuerung.js';
import {
  GRUPPEN_AKTIONS_NAMEN,
  type GruppenAktionsAnfrageUebersetzung,
  type GruppenAktionsName
} from '../vertraege/gruppen-aktionsanfrage.js';
import type {
  GruppenAktionsSteuerungErgebnis,
  GruppenAktionsSteuerungKonfiguration
} from '../vertraege/gruppen-aktionssteuerung.js';

const ALLE_GRUPPEN_AKTIONS_NAMEN = Object.freeze(Object.values(GRUPPEN_AKTIONS_NAMEN));
const ALLE_GRUPPEN_AKTIONS_NAMEN_MENGE = new Set<string>(ALLE_GRUPPEN_AKTIONS_NAMEN);

function friereStrings(werte: readonly string[]): readonly string[] {
  return Object.freeze([...werte]);
}

export function erstelleGruppenAktionsSteuerungKonfiguration(
  aenderungen: Partial<GruppenAktionsSteuerungKonfiguration> = {}
): GruppenAktionsSteuerungKonfiguration {
  const aktiviert = aenderungen.aktiviert ?? false;
  if (typeof aktiviert !== 'boolean') throw new Error('aktiviert muss ein boolescher Wert sein.');

  const roheAktionen = aenderungen.freigegebeneAktionen ?? [];
  for (const aktion of roheAktionen) {
    if (!ALLE_GRUPPEN_AKTIONS_NAMEN_MENGE.has(aktion)) {
      throw new Error(`Unbekannte freigegebene GruppenAktionsName: ${String(aktion)}.`);
    }
  }
  const aktionsMenge = new Set<GruppenAktionsName>(roheAktionen);
  const freigegebeneAktionen = Object.freeze(
    ALLE_GRUPPEN_AKTIONS_NAMEN.filter((aktion) => aktionsMenge.has(aktion))
  );

  const verarbeiten = aenderungen.verarbeiten ?? false;
  if (typeof verarbeiten !== 'boolean') throw new Error('verarbeiten muss ein boolescher Wert sein.');

  return Object.freeze({ aktiviert, freigegebeneAktionen, verarbeiten });
}

export function uebergibGruppenAktionsAnfragenAnSteuerung(
  uebersetzung: GruppenAktionsAnfrageUebersetzung,
  steuerung: AktionsSteuerung,
  jetzt: number,
  konfiguration: GruppenAktionsSteuerungKonfiguration = erstelleGruppenAktionsSteuerungKonfiguration()
): GruppenAktionsSteuerungErgebnis {
  if (!Number.isFinite(jetzt) || jetzt < 0) {
    throw new Error('jetzt muss eine endliche, nichtnegative Zahl sein.');
  }

  const cfg = erstelleGruppenAktionsSteuerungKonfiguration(konfiguration);
  const kandidaten = [...uebersetzung.aktionsAnfragen];
  const leer = (status: GruppenAktionsSteuerungErgebnis['status'], grund: string): GruppenAktionsSteuerungErgebnis =>
    Object.freeze({
      schemaVersion: 1,
      zeitpunkt: jetzt,
      status,
      grund,
      eingereichteAnfrageKennungen: Object.freeze([]),
      nichtFreigegebeneAnfrageKennungen: Object.freeze([]),
      abgelaufeneAnfrageKennungen: Object.freeze([]),
      laufZustaende: Object.freeze([...steuerung.listeAktionsZustaende()]),
      verarbeitung: null,
      schattenEintraege: Object.freeze([...steuerung.listeSchattenProtokoll()])
    });

  if (uebersetzung.status === 'blockiert') {
    return leer('blockiert', `Die Gruppenaktionsanfrage-Uebersetzung ist blockiert: ${uebersetzung.grund}`);
  }
  if (kandidaten.length === 0) {
    return leer('leer', 'Die Gruppenaktionsanfrage-Uebersetzung enthaelt keine einreichbare Anfrage.');
  }
  if (!cfg.aktiviert) {
    return Object.freeze({
      ...leer('gesperrt', 'Die Uebergabe von Gruppen-AktionsAnfragen an die zentrale AktionsSteuerung ist standardmaessig gesperrt.'),
      nichtFreigegebeneAnfrageKennungen: friereStrings(kandidaten.map((anfrage) => anfrage.kennung))
    });
  }

  const freigegeben = new Set(cfg.freigegebeneAktionen);
  const nichtFreigegebene = kandidaten.filter((anfrage) => !freigegeben.has(anfrage.aktion as GruppenAktionsName));
  const nachAktionFreigegebene = kandidaten.filter((anfrage) => freigegeben.has(anfrage.aktion as GruppenAktionsName));
  const abgelaufene = nachAktionFreigegebene.filter(
    (anfrage) => anfrage.gueltigBis !== undefined && anfrage.gueltigBis <= jetzt
  );
  const einreichbar = nachAktionFreigegebene.filter(
    (anfrage) => anfrage.gueltigBis === undefined || anfrage.gueltigBis > jetzt
  );

  if (einreichbar.length === 0) {
    return Object.freeze({
      ...leer('leer', 'Keine freigegebene Gruppen-AktionsAnfrage ist zum angegebenen Zeitpunkt noch einreichbar.'),
      nichtFreigegebeneAnfrageKennungen: friereStrings(nichtFreigegebene.map((anfrage) => anfrage.kennung)),
      abgelaufeneAnfrageKennungen: friereStrings(abgelaufene.map((anfrage) => anfrage.kennung))
    });
  }

  for (const anfrage of einreichbar) steuerung.reicheAnfrageEin(anfrage);
  const verarbeitung = cfg.verarbeiten ? steuerung.verarbeiteNaechsteAktion(jetzt) : null;

  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: jetzt,
    status: verarbeitung === null ? 'eingereiht' : 'verarbeitet',
    grund: verarbeitung === null
      ? `${einreichbar.length} freigegebene Gruppen-AktionsAnfrage(n) wurden in die zentrale AktionsSteuerung eingereiht.`
      : `${einreichbar.length} freigegebene Gruppen-AktionsAnfrage(n) wurden eingereiht und die zentrale AktionsSteuerung wurde einmal verarbeitet.`,
    eingereichteAnfrageKennungen: friereStrings(einreichbar.map((anfrage) => anfrage.kennung)),
    nichtFreigegebeneAnfrageKennungen: friereStrings(nichtFreigegebene.map((anfrage) => anfrage.kennung)),
    abgelaufeneAnfrageKennungen: friereStrings(abgelaufene.map((anfrage) => anfrage.kennung)),
    laufZustaende: Object.freeze([...steuerung.listeAktionsZustaende()]),
    verarbeitung,
    schattenEintraege: Object.freeze([...steuerung.listeSchattenProtokoll()])
  });
}
