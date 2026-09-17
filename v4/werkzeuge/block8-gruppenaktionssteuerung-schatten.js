(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenAktionsSteuerung';
  const VERSION = '1.0.0';
  const MAX_VERLAUF = 20;
  let steuerung = null;
  let letzteAuswertung = null;
  const verlauf = [];

  function anfragenSchatten() {
    const api = globalThis.V4Block8GruppenAktionsAnfragen;
    if (!api || typeof api.pruefe !== 'function') throw new Error('V4Block8GruppenAktionsAnfragen muss vorher geladen werden.');
    return api;
  }
  function integrationsKern() {
    const api = globalThis.V4Block8GruppenAktionsSteuerungKern;
    if (!api || typeof api.uebergibGruppenAktionsAnfragenAnSteuerung !== 'function') {
      throw new Error('V4Block8GruppenAktionsSteuerungKern muss vorher geladen werden.');
    }
    return api;
  }
  function steuerungsKern() {
    const api = globalThis.V4AktionsSteuerungSchattenKern;
    if (!api || typeof api.AktionsSteuerung !== 'function') throw new Error('V4AktionsSteuerungSchattenKern muss vorher geladen werden.');
    return api;
  }
  function holeSteuerung() {
    if (!steuerung) steuerung = new (steuerungsKern().AktionsSteuerung)();
    return steuerung;
  }
  function ausgeben(wert, titel) {
    try {
      const konsole = globalThis.V4Testkonsole ?? (typeof parent !== 'undefined' ? parent?.V4Testkonsole : null);
      if (konsole?.ausgeben) konsole.ausgeben(wert, titel);
      else console.log(titel, wert);
    } catch {
      // Diagnose darf die Auswertung nicht beeinflussen.
    }
  }
  function merke(ergebnis) {
    letzteAuswertung = ergebnis;
    verlauf.push(Object.freeze({
      ausgewertetAm: ergebnis.ausgewertetAm,
      lokalerCharakter: ergebnis.lokalerCharakter,
      uebersetzungsStatus: ergebnis.anfragenAuswertung.uebersetzung.status,
      steuerungsStatus: ergebnis.steuerungsErgebnis.status,
      eingereicht: ergebnis.steuerungsErgebnis.eingereichteAnfrageKennungen.length,
      schattenEintraege: ergebnis.steuerungsErgebnis.schattenEintraege.length
    }));
    while (verlauf.length > MAX_VERLAUF) verlauf.shift();
  }

  async function pruefe(optionen = {}) {
    const anfragenAuswertung = await anfragenSchatten().pruefe({
      aktiviert: optionen.uebersetzungAktiviert ?? false,
      freigegebeneArten: optionen.freigegebeneArten ?? [],
      gueltigkeitMillisekunden: optionen.gueltigkeitMillisekunden ?? 1_500,
      lebensnachweisMaximalAlterMillisekunden: optionen.lebensnachweisMaximalAlterMillisekunden ?? 5_000,
      heilenUnterLebensAnteil: optionen.heilenUnterLebensAnteil ?? 0.7,
      schuetzenUnterLebensAnteil: optionen.schuetzenUnterLebensAnteil ?? 0.5
    });
    const kern = integrationsKern();
    const zentraleSteuerung = holeSteuerung();
    const cfg = kern.erstelleGruppenAktionsSteuerungKonfiguration({
      aktiviert: optionen.einreichungAktiviert ?? false,
      freigegebeneAktionen: optionen.freigegebeneAktionen ?? [],
      verarbeiten: optionen.verarbeiten ?? false
    });
    const jetzt = anfragenAuswertung.ausgewertetAm;
    const steuerungsErgebnis = kern.uebergibGruppenAktionsAnfragenAnSteuerung(
      anfragenAuswertung.uebersetzung,
      zentraleSteuerung,
      jetzt,
      cfg
    );
    const zentral = steuerungsKern();
    const ergebnis = Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      ausgewertetAm: jetzt,
      lokalerCharakter: anfragenAuswertung.lokalerCharakter,
      integrationsKern: Object.freeze({ version: kern.version, quellDatei: kern.quellDatei, quellBlobSha: kern.quellBlobSha }),
      aktionsSteuerungsKern: Object.freeze({ version: zentral.version, quellBlobShas: zentral.quellBlobShas }),
      anfragenAuswertung,
      steuerungsErgebnis,
      anAktionsSteuerungEingereicht: steuerungsErgebnis.eingereichteAnfrageKennungen.length > 0,
      aktionsSteuerungVerarbeitet: steuerungsErgebnis.verarbeitung !== null,
      echteSpielaktionenAusgefuehrt: false
    });
    merke(ergebnis);
    ausgeben(ergebnis, 'Block 8 Gruppen-AktionsSteuerung · Schattenauswertung');
    return ergebnis;
  }

  function status() {
    const zentraleSteuerung = holeSteuerung();
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      letzteAuswertung,
      verlauf: Object.freeze([...verlauf]),
      aktionsZustaende: Object.freeze([...zentraleSteuerung.listeAktionsZustaende()]),
      ressourcenSperren: Object.freeze([...zentraleSteuerung.listeRessourcenSperren()]),
      schattenProtokoll: Object.freeze([...zentraleSteuerung.listeSchattenProtokoll()]),
      echteSpielaktionenAusgefuehrt: false
    });
  }

  function setzeSteuerungZurueck() {
    steuerung = new (steuerungsKern().AktionsSteuerung)();
    letzteAuswertung = null;
    verlauf.length = 0;
    return status();
  }

  globalThis[API_NAME] = Object.freeze({ version: VERSION, pruefe, status, setzeSteuerungZurueck });
  ausgeben({
    version: VERSION,
    standard: 'doppelt_gesperrt',
    hinweis: 'Keine Adventure-Land-Ausfuehrung. Explizite Uebersetzungs- UND Einreichungsfreigabe sind erforderlich; Verarbeitung bleibt SchattenAusfuehrung.'
  }, 'Block-8-Gruppen-AktionsSteuerung-Schattenwerkzeug bereit');
})();
