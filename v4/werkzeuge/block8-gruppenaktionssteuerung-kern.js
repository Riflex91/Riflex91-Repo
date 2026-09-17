(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenAktionsSteuerungKern';
  const VERSION = '1.0.0';
  const QUELL_BLOB_SHA = 'b4972a1ee0b200477061fd732040f3acb61c451a';
  const GRUPPEN_AKTIONS_NAMEN = Object.freeze({
    mitgliedHeilen: 'GRUPPE_MITGLIED_HEILEN',
    zielAggroBinden: 'GRUPPE_ZIEL_AGGRO_BINDEN',
    mitgliedSchuetzen: 'GRUPPE_MITGLIED_SCHUETZEN',
    gruppeUnterstuetzen: 'GRUPPE_UNTERSTUETZEN',
    gemeinsamesZielBearbeiten: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN'
  });
  const ALLE_GRUPPEN_AKTIONS_NAMEN = Object.freeze(Object.values(GRUPPEN_AKTIONS_NAMEN));
  const ALLE_GRUPPEN_AKTIONS_NAMEN_MENGE = new Set(ALLE_GRUPPEN_AKTIONS_NAMEN);

  function friereStrings(werte) { return Object.freeze([...werte]); }

  function erstelleGruppenAktionsSteuerungKonfiguration(aenderungen = {}) {
    const aktiviert = aenderungen.aktiviert ?? false;
    if (typeof aktiviert !== 'boolean') throw new Error('aktiviert muss ein boolescher Wert sein.');
    const roheAktionen = aenderungen.freigegebeneAktionen ?? [];
    for (const aktion of roheAktionen) {
      if (!ALLE_GRUPPEN_AKTIONS_NAMEN_MENGE.has(aktion)) throw new Error(`Unbekannte freigegebene GruppenAktionsName: ${String(aktion)}.`);
    }
    const aktionsMenge = new Set(roheAktionen);
    const freigegebeneAktionen = Object.freeze(ALLE_GRUPPEN_AKTIONS_NAMEN.filter((aktion) => aktionsMenge.has(aktion)));
    const verarbeiten = aenderungen.verarbeiten ?? false;
    if (typeof verarbeiten !== 'boolean') throw new Error('verarbeiten muss ein boolescher Wert sein.');
    return Object.freeze({ aktiviert, freigegebeneAktionen, verarbeiten });
  }

  function uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung, steuerung, jetzt, konfiguration = erstelleGruppenAktionsSteuerungKonfiguration()) {
    if (!Number.isFinite(jetzt) || jetzt < 0) throw new Error('jetzt muss eine endliche, nichtnegative Zahl sein.');
    const cfg = erstelleGruppenAktionsSteuerungKonfiguration(konfiguration);
    const kandidaten = [...uebersetzung.aktionsAnfragen];
    const leer = (status, grund) => Object.freeze({
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

    if (uebersetzung.status === 'blockiert') return leer('blockiert', `Die Gruppenaktionsanfrage-Uebersetzung ist blockiert: ${uebersetzung.grund}`);
    if (kandidaten.length === 0) return leer('leer', 'Die Gruppenaktionsanfrage-Uebersetzung enthaelt keine einreichbare Anfrage.');
    if (!cfg.aktiviert) {
      return Object.freeze({
        ...leer('gesperrt', 'Die Uebergabe von Gruppen-AktionsAnfragen an die zentrale AktionsSteuerung ist standardmaessig gesperrt.'),
        nichtFreigegebeneAnfrageKennungen: friereStrings(kandidaten.map((anfrage) => anfrage.kennung))
      });
    }

    const freigegeben = new Set(cfg.freigegebeneAktionen);
    const nichtFreigegebene = kandidaten.filter((anfrage) => !freigegeben.has(anfrage.aktion));
    const nachAktionFreigegebene = kandidaten.filter((anfrage) => freigegeben.has(anfrage.aktion));
    const abgelaufene = nachAktionFreigegebene.filter((anfrage) => anfrage.gueltigBis !== undefined && anfrage.gueltigBis <= jetzt);
    const einreichbar = nachAktionFreigegebene.filter((anfrage) => anfrage.gueltigBis === undefined || anfrage.gueltigBis > jetzt);

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

  globalThis[API_NAME] = Object.freeze({
    version: VERSION,
    quellDatei: 'v4/laufzeit/quelle/spiellogik/gruppen-aktionssteuerung.ts',
    quellBlobSha: QUELL_BLOB_SHA,
    gruppenAktionsNamen: GRUPPEN_AKTIONS_NAMEN,
    erstelleGruppenAktionsSteuerungKonfiguration,
    uebergibGruppenAktionsAnfragenAnSteuerung
  });
})();
