(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenAktionsAnfragen';
  const VERSION = '1.0.0';
  const MAX_VERLAUF = 20;
  let letzteAuswertung = null;
  const verlauf = [];

  function planungsSchatten() {
    const api = globalThis.V4Block8GruppenAktionsplanung;
    if (!api || typeof api.pruefe !== 'function' || typeof api.status !== 'function') {
      throw new Error('V4Block8GruppenAktionsplanung muss vorher geladen werden.');
    }
    return api;
  }

  function anfragenKern() {
    const kern = globalThis.V4Block8GruppenAktionsAnfragenKern;
    if (
      !kern ||
      typeof kern.uebersetzeEigeneGruppenPlanSchritte !== 'function' ||
      typeof kern.erstelleGruppenAktionsAnfrageKonfiguration !== 'function'
    ) {
      throw new Error('V4Block8GruppenAktionsAnfragenKern muss vorher geladen werden.');
    }
    return kern;
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
      planStatus: ergebnis.plan.status,
      uebersetzungsStatus: ergebnis.uebersetzung.status,
      erzeugteAktionsAnfragen: ergebnis.uebersetzung.aktionsAnfragen.length,
      anAktionsSteuerungEingereicht: false
    }));
    while (verlauf.length > MAX_VERLAUF) verlauf.shift();
  }

  async function pruefe(optionen = {}) {
    const planung = planungsSchatten();
    const kern = anfragenKern();
    const planungsAuswertung = await planung.pruefe({
      lebensnachweisMaximalAlterMillisekunden: optionen.lebensnachweisMaximalAlterMillisekunden ?? 5_000,
      heilenUnterLebensAnteil: optionen.heilenUnterLebensAnteil ?? 0.7,
      schuetzenUnterLebensAnteil: optionen.schuetzenUnterLebensAnteil ?? 0.5
    });

    if (!planungsAuswertung?.plan || typeof planungsAuswertung.plan !== 'object') {
      throw new Error('Der Gruppenaktionsplanung-Schatten lieferte keinen Gruppenaktionsplan.');
    }
    if (typeof planungsAuswertung.lokalerCharakter !== 'string' || planungsAuswertung.lokalerCharakter.length === 0) {
      throw new Error('Der Gruppenaktionsplanung-Schatten lieferte keinen lokalen Charakter.');
    }

    const konfiguration = kern.erstelleGruppenAktionsAnfrageKonfiguration({
      aktiviert: optionen.aktiviert ?? false,
      freigegebeneArten: optionen.freigegebeneArten ?? [],
      gueltigkeitMillisekunden: optionen.gueltigkeitMillisekunden ?? 1_500
    });
    const uebersetzung = kern.uebersetzeEigeneGruppenPlanSchritte(
      planungsAuswertung.plan,
      planungsAuswertung.lokalerCharakter,
      konfiguration
    );

    const ergebnis = Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      ausgewertetAm: planungsAuswertung.ausgewertetAm,
      produktionsKern: Object.freeze({
        quellDatei: kern.quellDatei,
        quellBlobSha: kern.quellBlobSha,
        version: kern.version
      }),
      lokalerCharakter: planungsAuswertung.lokalerCharakter,
      plan: planungsAuswertung.plan,
      planSignatur: planungsAuswertung.planSignatur,
      uebersetzung,
      bereitFuerAktionsSteuerung: uebersetzung.status === 'erzeugt' && uebersetzung.aktionsAnfragen.length > 0,
      anAktionsSteuerungEingereicht: false,
      aktionsSteuerungVerarbeitet: false,
      echteSpielaktionenAusgefuehrt: false
    });

    merke(ergebnis);
    ausgeben(ergebnis, 'Block 8 Gruppenaktionsanfragen · Schattenauswertung');
    return ergebnis;
  }

  function status() {
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      letzteAuswertung,
      verlauf: Object.freeze([...verlauf]),
      anAktionsSteuerungEingereicht: false,
      aktionsSteuerungVerarbeitet: false,
      echteSpielaktionenAusgefuehrt: false
    });
  }

  function leereVerlauf() {
    letzteAuswertung = null;
    verlauf.length = 0;
    return status();
  }

  globalThis[API_NAME] = Object.freeze({ version: VERSION, pruefe, status, leereVerlauf });

  ausgeben({
    version: VERSION,
    standard: 'gesperrt',
    hinweis: 'Read-only: Gruppenplan -> explizit freigegebene AktionsAnfrage-Kandidaten. Es wird nichts an die AktionsSteuerung eingereicht und keine Spielaktion ausgefuehrt.',
    startGesperrt: 'await V4Block8GruppenAktionsAnfragen.pruefe()',
    beispielExplizit: "await V4Block8GruppenAktionsAnfragen.pruefe({ aktiviert: true, freigegebeneArten: ['gruppe_unterstuetzen'] })"
  }, 'Block-8-Gruppenaktionsanfragen-Schattenwerkzeug bereit');
})();
