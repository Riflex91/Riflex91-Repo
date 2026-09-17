(() => {
  'use strict';

  const API_NAME = 'V4Block8Gruppenkoordination';
  const VERSION = '1.1.0';
  const MAX_VERLAUF = 20;
  let letzteAuswertung = null;
  const verlauf = [];

  function lebensnachweisApi() {
    const api = globalThis.V4Block8Lebensnachweis;
    if (!api || typeof api.status !== 'function' || typeof api.sendeEinmal !== 'function') {
      throw new Error('V4Block8Lebensnachweis muss vorher geladen und konfiguriert werden.');
    }
    return api;
  }

  function koordinationsKern() {
    const kern = globalThis.V4Block8GruppenKoordinationKern;
    if (!kern || typeof kern.koordiniereGruppe !== 'function' || typeof kern.erstelleGruppenKoordinationsKonfiguration !== 'function') {
      throw new Error('V4Block8GruppenKoordinationKern muss vorher geladen werden.');
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

  function sichereMeldung(wert) {
    if (!wert || typeof wert !== 'object') return null;
    if (wert.schemaVersion !== 1 || typeof wert.charakterKennung !== 'string' || typeof wert.charakterName !== 'string') return null;
    return wert;
  }

  function remoteMeldungen(status) {
    if (!Array.isArray(status?.teilnehmer)) return [];
    return status.teilnehmer.map((eintrag) => sichereMeldung(eintrag?.meldung)).filter(Boolean);
  }

  function merke(ergebnis) {
    letzteAuswertung = ergebnis;
    verlauf.push(Object.freeze({
      ausgewertetAm: ergebnis.ausgewertetAm,
      betriebsArt: ergebnis.entscheidung.betriebsArt,
      aktiveTeilnehmerKennungen: ergebnis.entscheidung.aktiveTeilnehmerKennungen,
      teilnehmerBewertungen: ergebnis.entscheidung.teilnehmerBewertungen,
      aufgaben: ergebnis.entscheidung.aufgaben,
      meldungsAnzahl: ergebnis.meldungen.length
    }));
    while (verlauf.length > MAX_VERLAUF) verlauf.shift();
  }

  async function pruefe(optionen = {}) {
    const lebensnachweis = lebensnachweisApi();
    const kern = koordinationsKern();
    const statusVorher = lebensnachweis.status();
    if (statusVorher.aktiv !== true) throw new Error('Der lokale Lebensnachweis muss laufen.');

    const eigenerSendeSchritt = await lebensnachweis.sendeEinmal();
    const eigeneMeldung = sichereMeldung(eigenerSendeSchritt?.meldung);
    if (!eigeneMeldung) throw new Error('Der lokale Lebensnachweis lieferte keine gueltige eigene Meldung.');

    const lebensStatus = lebensnachweis.status();
    const meldungen = Object.freeze([eigeneMeldung, ...remoteMeldungen(lebensStatus)]);
    const ausgewertetAm = Date.now();
    const konfiguration = kern.erstelleGruppenKoordinationsKonfiguration({
      lebensnachweisMaximalAlterMillisekunden: optionen.lebensnachweisMaximalAlterMillisekunden ?? 5_000
    });
    const entscheidung = kern.koordiniereGruppe(meldungen, eigeneMeldung.charakterKennung, ausgewertetAm, konfiguration);

    const ergebnis = Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      ausgewertetAm,
      produktionsKern: Object.freeze({
        quellDatei: kern.quellDatei,
        quellBlobSha: kern.quellBlobSha,
        version: kern.version
      }),
      lokalerCharakter: eigeneMeldung.charakterName,
      meldungsAnzahl: meldungen.length,
      meldungen,
      lebensnachweis: Object.freeze({
        version: lebensStatus.version,
        gesendet: lebensStatus.gesendet,
        empfangen: lebensStatus.empfangen,
        verworfen: lebensStatus.verworfen,
        kommunikation: lebensStatus.kommunikation
      }),
      entscheidung,
      echteSpielaktionenAusgefuehrt: false
    });

    merke(ergebnis);
    ausgeben(ergebnis, 'Block 8 Gruppenkoordination · Schattenauswertung');
    return ergebnis;
  }

  function status() {
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      letzteAuswertung,
      verlauf: Object.freeze([...verlauf]),
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
    hinweis: 'Read-only Koordinationsschatten: wertet echte Block-8-Lebensnachweise mit dem source-locked Produktionskern aus und stellt den geprueften Meldungssnapshot fuer nachgelagerte read-only Planung bereit; keine Spielaktion wird ausgefuehrt.',
    start: 'await V4Block8Gruppenkoordination.pruefe()'
  }, 'Block-8-Gruppenkoordination-Schattenwerkzeug bereit');
})();
