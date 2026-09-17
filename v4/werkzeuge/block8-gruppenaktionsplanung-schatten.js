(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenAktionsplanung';
  const VERSION = '1.0.0';
  const MAX_VERLAUF = 20;
  let letzteAuswertung = null;
  const verlauf = [];

  function koordinationsSchatten() {
    const api = globalThis.V4Block8Gruppenkoordination;
    if (!api || typeof api.pruefe !== 'function' || typeof api.status !== 'function') {
      throw new Error('V4Block8Gruppenkoordination muss vorher geladen werden.');
    }
    return api;
  }

  function planungsKern() {
    const kern = globalThis.V4Block8GruppenAktionsPlanungKern;
    if (
      !kern ||
      typeof kern.planeGruppenAktionen !== 'function' ||
      typeof kern.eigeneGruppenPlanSchritte !== 'function' ||
      typeof kern.erstelleGruppenAktionsPlanKonfiguration !== 'function'
    ) {
      throw new Error('V4Block8GruppenAktionsPlanungKern muss vorher geladen werden.');
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

  function bauePlanSignatur(plan) {
    return Object.freeze(
      plan.schritte.map((schritt) =>
        [
          schritt.art,
          schritt.ausfuehrenderTeilnehmerKennung,
          schritt.zielArt,
          schritt.zielKennung ?? '-',
          schritt.wichtigkeit,
          String(schritt.prioritaet)
        ].join('|')
      )
    );
  }

  function merke(ergebnis) {
    letzteAuswertung = ergebnis;
    verlauf.push(Object.freeze({
      ausgewertetAm: ergebnis.ausgewertetAm,
      lokalerCharakter: ergebnis.lokalerCharakter,
      betriebsArt: ergebnis.plan.betriebsArt,
      planStatus: ergebnis.plan.status,
      planSignatur: ergebnis.planSignatur,
      eigeneSchritte: ergebnis.eigeneSchritte.map((schritt) => schritt.art)
    }));
    while (verlauf.length > MAX_VERLAUF) verlauf.shift();
  }

  async function pruefe(optionen = {}) {
    const koordination = koordinationsSchatten();
    const kern = planungsKern();
    const koordinationsAuswertung = await koordination.pruefe({
      lebensnachweisMaximalAlterMillisekunden: optionen.lebensnachweisMaximalAlterMillisekunden ?? 5_000
    });

    if (!Array.isArray(koordinationsAuswertung?.meldungen)) {
      throw new Error('Der Koordinationsschatten lieferte keinen geprueften Meldungssnapshot.');
    }
    if (!koordinationsAuswertung?.entscheidung || typeof koordinationsAuswertung.entscheidung !== 'object') {
      throw new Error('Der Koordinationsschatten lieferte keine Koordinationsentscheidung.');
    }

    const konfiguration = kern.erstelleGruppenAktionsPlanKonfiguration({
      heilenUnterLebensAnteil: optionen.heilenUnterLebensAnteil ?? 0.7,
      schuetzenUnterLebensAnteil: optionen.schuetzenUnterLebensAnteil ?? 0.5
    });
    const plan = kern.planeGruppenAktionen(
      koordinationsAuswertung.meldungen,
      koordinationsAuswertung.entscheidung,
      konfiguration
    );
    const eigenerTeilnehmerKennung = koordinationsAuswertung.entscheidung.eigenerTeilnehmerKennung;
    const eigeneSchritte = kern.eigeneGruppenPlanSchritte(plan, eigenerTeilnehmerKennung);
    const planSignatur = bauePlanSignatur(plan);

    const ergebnis = Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      ausgewertetAm: koordinationsAuswertung.ausgewertetAm,
      produktionsKern: Object.freeze({
        quellDatei: kern.quellDatei,
        quellBlobSha: kern.quellBlobSha,
        version: kern.version
      }),
      koordinationsKern: koordinationsAuswertung.produktionsKern,
      lokalerCharakter: koordinationsAuswertung.lokalerCharakter,
      meldungsAnzahl: koordinationsAuswertung.meldungsAnzahl,
      meldungen: koordinationsAuswertung.meldungen,
      entscheidung: koordinationsAuswertung.entscheidung,
      plan,
      planSignatur,
      eigeneSchritte,
      aktionsAnfragenErzeugt: false,
      echteSpielaktionenAusgefuehrt: false
    });

    merke(ergebnis);
    ausgeben(ergebnis, 'Block 8 Gruppenaktionsplanung · Schattenauswertung');
    return ergebnis;
  }

  function status() {
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      letzteAuswertung,
      verlauf: Object.freeze([...verlauf]),
      aktionsAnfragenErzeugt: false,
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
    hinweis: 'Read-only Gruppenaktionsschatten: echte Lebensnachweise -> source-locked Koordination -> source-locked Gruppenaktionsplanung; keine AktionsAnfrage und keine Spielaktion.',
    start: 'await V4Block8GruppenAktionsplanung.pruefe()'
  }, 'Block-8-Gruppenaktionsplanung-Schattenwerkzeug bereit');
})();
